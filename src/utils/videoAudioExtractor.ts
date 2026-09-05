import { SubtitleItem } from '../types';
import { audioEngine } from './audioEngine';

export interface ExtractionResult {
  duration: number;
  cues: SubtitleItem[];
  modelUsed?: string;
}

// Convert AudioBuffer to 16kHz mono 16-bit PCM WAV Blob
export function audioBufferToWav(buffer: AudioBuffer, targetSampleRate: number = 16000, maxDurationSeconds: number = 180): Blob {
  const duration = Math.min(buffer.duration, maxDurationSeconds);
  const originalSampleRate = buffer.sampleRate;
  const targetLength = Math.floor(duration * targetSampleRate);
  
  // Downsample to 16kHz mono
  const sourceChannel = buffer.getChannelData(0);
  const downsampled = new Float32Array(targetLength);
  const ratio = originalSampleRate / targetSampleRate;

  for (let i = 0; i < targetLength; i++) {
    const srcIndex = Math.floor(i * ratio);
    downsampled[i] = srcIndex < sourceChannel.length ? sourceChannel[srcIndex] : 0;
  }

  // 16-bit PCM WAV header + data
  const dataByteLength = targetLength * 2;
  const wavBuffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(wavBuffer);

  // Write RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 for mono)
  view.setUint32(24, targetSampleRate, true); // SampleRate
  view.setUint32(28, targetSampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < targetLength; i++) {
    const s = Math.max(-1, Math.min(1, downsampled[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Convert Blob to base64
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Detect speech boundaries using root-mean-square energy (Voice Activity Detection)
export function detectVoiceActivity(audioBuffer: AudioBuffer, windowSec: number = 0.1, threshold: number = 0.008): Array<{ startTime: number; endTime: number }> {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const totalDuration = audioBuffer.duration;
  const windowSize = Math.floor(sampleRate * windowSec);
  const numWindows = Math.floor(channelData.length / windowSize);

  const activeWindows: boolean[] = [];
  for (let w = 0; w < numWindows; w++) {
    let sumSquares = 0;
    const startIdx = w * windowSize;
    for (let i = 0; i < windowSize; i++) {
      const val = channelData[startIdx + i];
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / windowSize);
    activeWindows.push(rms > threshold);
  }

  // Merge active windows into speech segments
  const segments: Array<{ startTime: number; endTime: number }> = [];
  let inSpeech = false;
  let segStart = 0;
  let silenceFrames = 0;
  const maxSilenceFrames = Math.floor(0.4 / windowSec); // 400ms silence tolerance

  for (let w = 0; w < numWindows; w++) {
    const isActive = activeWindows[w];
    const time = w * windowSec;

    if (isActive) {
      if (!inSpeech) {
        inSpeech = true;
        segStart = Math.max(0, time - 0.1); // Pad lead-in
      }
      silenceFrames = 0;
    } else if (inSpeech) {
      silenceFrames++;
      if (silenceFrames >= maxSilenceFrames || w === numWindows - 1) {
        inSpeech = false;
        const segEnd = time;
        if (segEnd - segStart >= 0.6) {
          segments.push({
            startTime: parseFloat(segStart.toFixed(2)),
            endTime: parseFloat(segEnd.toFixed(2))
          });
        }
      }
    }
  }

  // If detected segments are sparse, interpolate segments to cover the entire timeline
  if (segments.length < 4 && totalDuration > 10) {
    let cursor = 0.8;
    while (cursor < totalDuration - 1.5) {
      const segLen = Math.min(3.8, +(totalDuration - cursor - 0.5).toFixed(1));
      if (segLen < 1.0) break;
      segments.push({
        startTime: +cursor.toFixed(2),
        endTime: +(cursor + segLen).toFixed(2)
      });
      cursor += segLen + 0.5;
    }
  }

  return segments;
}

/**
 * Main function: Extracts audio from a video file or video URL,
 * calls the server Gemini AI pipeline, transcribes speech, translates into natural Khmer,
 * and pre-caches the authentic Khmer neural audio.
 */
export async function extractAndTranslateVideo(
  videoSource: File | string,
  videoName: string = 'Video',
  knownDuration: number = 30,
  onProgress?: (stage: string, percent: number) => void
): Promise<ExtractionResult> {
  onProgress?.('Extracting audio track from video container...', 15);

  let arrayBuffer: ArrayBuffer | null = null;

  if (typeof videoSource === 'string') {
    try {
      const response = await fetch(videoSource);
      arrayBuffer = await response.arrayBuffer();
    } catch (e) {
      console.warn('Direct fetch of video URL failed, proceeding with audio element metadata:', e);
    }
  } else {
    arrayBuffer = await videoSource.arrayBuffer();
  }

  let audioBase64: string | null = null;
  let detectedSegments: Array<{ startTime: number; endTime: number }> = [];
  let finalDuration = knownDuration;

  if (arrayBuffer) {
    onProgress?.('Decoding audio stream (PCM)...', 30);
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      finalDuration = decodedBuffer.duration;

      onProgress?.('Analyzing voice activity & dialogue timing...', 45);
      detectedSegments = detectVoiceActivity(decodedBuffer);

      onProgress?.('Compressing 16kHz mono audio for AI analysis...', 55);
      const wavBlob = audioBufferToWav(decodedBuffer, 16000, 75); // up to 75 seconds
      audioBase64 = await blobToBase64(wavBlob);
    } catch (decodeErr) {
      console.warn('Audio decoding from video stream failed or not supported in this container:', decodeErr);
    }
  }

  onProgress?.('Transcribing speech & translating to cinematic Khmer with Gemini AI...', 70);

  const payload: any = {
    videoName,
    duration: finalDuration,
    transcriptHints: detectedSegments
  };

  if (audioBase64) {
    payload.audioBase64 = audioBase64;
    payload.mimeType = 'audio/wav';
  }

  const res = await fetch('/api/ai/transcribe-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI transcription failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.success || !Array.isArray(data.cues)) {
    throw new Error(data.error || 'No subtitle cues returned from AI pipeline');
  }

  const cues: SubtitleItem[] = data.cues;

  onProgress?.('Pre-caching authentic Khmer neural voice synthesis...', 85);

  // Pre-cache all generated Khmer audio lines in the background
  let cachedCount = 0;
  for (const cue of cues) {
    const textToSynthesize = cue.textKh || cue.textEn;
    if (textToSynthesize) {
      try {
        await audioEngine.preFetchAudio(textToSynthesize);
        cachedCount++;
      } catch (cacheErr) {
        console.warn('TTS prefetch error for cue:', cacheErr);
      }
    }
    const percent = 85 + Math.round((cachedCount / cues.length) * 15);
    onProgress?.(`Synthesizing Khmer dialogue: ${cachedCount}/${cues.length} lines ready`, percent);
  }

  onProgress?.('Khmer translation & dubbing synchronization ready!', 100);

  return {
    duration: finalDuration,
    cues,
    modelUsed: data.model
  };
}
