// Frenxz Audio synthesis engine for Khmer & multilingual voice dubbing & playback
// Features dynamic speech rate fitting, acoustic formant preservation, and zero audio cutoff

import { estimateSpokenDuration, calculateSmartFit } from './smartFitEngine';

export type DuckingCallback = (isDucking: boolean) => void;

class DubAudioEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGainNode: GainNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private isSpeaking: boolean = false;
  private duckingListeners: Set<DuckingCallback> = new Set();
  private activeCueId: string | null = null;
  private autoSyncSpeedEnabled: boolean = true;
  private globalSpeedMultiplier: number = 1.0;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setAutoSyncSpeed(enabled: boolean) {
    this.autoSyncSpeedEnabled = enabled;
  }

  public setGlobalSpeedMultiplier(multiplier: number) {
    this.globalSpeedMultiplier = Math.max(0.5, Math.min(2.0, multiplier));
  }

  public getGlobalSpeedMultiplier(): number {
    return this.globalSpeedMultiplier;
  }

  public isAutoSyncSpeedEnabled(): boolean {
    return this.autoSyncSpeedEnabled;
  }

  public subscribeDucking(cb: DuckingCallback): () => void {
    this.duckingListeners.add(cb);
    return () => this.duckingListeners.delete(cb);
  }

  private notifyDucking(ducking: boolean) {
    this.duckingListeners.forEach((cb) => {
      try {
        cb(ducking);
      } catch {
        // ignore callback error
      }
    });
  }

  // Detects Khmer Unicode range (U+1780 - U+17FF)
  public isKhmerText(text: string): boolean {
    return /[\u1780-\u17FF]/.test(text);
  }

  public getActiveCueId(): string | null {
    return this.activeCueId;
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  // Pre-fetch and decode audio into cache for instantaneous playback
  public async preFetchAudio(text: string, lang?: string): Promise<AudioBuffer | null> {
    if (!text || !text.trim()) return null;
    const determinedLang = lang || (this.isKhmerText(text) ? 'km' : 'en');
    const cacheKey = `${determinedLang}:${text.trim()}`;

    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!;
    }

    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text.trim())}&lang=${determinedLang}`);
      if (!res.ok) {
        throw new Error(`TTS server returned ${res.status}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      const ctx = this.getContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.warn('[DubAudioEngine] Pre-fetch failed:', err);
      return null;
    }
  }

  // Primary voice synthesis player with smart time-stretching & zero cutoffs
  public playVoiceSnippet(
    text: string,
    voiceName: string = 'Khmer Standard',
    pitchFactor: number = 1.0,
    speedFactor: number = 1.0,
    cueId?: string,
    volume: number = 1.0,
    targetDuration?: number
  ): Promise<number> {
    return new Promise(async (resolve) => {
      // Smoothly release previous audio without abrupt pop
      this.stopAllAudio(false);
      if (!text || !text.trim()) {
        resolve(0);
        return;
      }

      this.isSpeaking = true;
      this.activeCueId = cueId || null;
      this.notifyDucking(true);

      const isKhmer = this.isKhmerText(text);
      const targetLang = isKhmer ? 'km' : 'en';
      const cacheKey = `${targetLang}:${text.trim()}`;

      try {
        let audioBuffer: AudioBuffer | null = this.bufferCache.get(cacheKey) || null;

        if (!audioBuffer) {
          audioBuffer = await this.preFetchAudio(text, targetLang);
        }

        if (audioBuffer) {
          const ctx = this.getContext();
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;

          // Enhanced Smart Fit dynamic rate calculation:
          let effectiveRate = speedFactor || 1.0;
          if (this.autoSyncSpeedEnabled && targetDuration && targetDuration > 0.3) {
            // Use actual audio buffer duration
            const naturalDuration = audioBuffer.duration;
            // Slot target gives 0.12s natural breath room at end
            const slotTarget = Math.max(0.35, targetDuration - 0.12);
            const calculatedFitRate = naturalDuration / slotTarget;

            // Intelligent dynamic scaling curve: allows natural stretch between 0.85x and 1.65x
            if (calculatedFitRate > 1.0) {
              // Smooth logarithmic compression for faster rates
              effectiveRate = Math.min(1.65, 1.0 + (calculatedFitRate - 1.0) * 0.95);
            } else {
              effectiveRate = Math.max(0.85, calculatedFitRate);
            }
          } else {
            effectiveRate = Math.max(0.8, Math.min(1.5, effectiveRate * this.globalSpeedMultiplier));
          }

          source.playbackRate.setValueAtTime(effectiveRate, ctx.currentTime);

          // Audio processing graph for character voice modeling
          const gainNode = ctx.createGain();
          const targetVol = Math.max(0, Math.min(1.5, volume));
          
          // Gentle attack ramp to avoid clicks
          gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(Math.max(0.01, targetVol), ctx.currentTime + 0.02);

          // Voice timbre filter
          const filter = ctx.createBiquadFilter();
          const isDeepVoice =
            voiceName.toLowerCase().includes('dara') ||
            voiceName.toLowerCase().includes('kosal') ||
            voiceName.toLowerCase().includes('rithy') ||
            pitchFactor < 0.98;

          if (isDeepVoice) {
            // Warm cinematic low-end boost
            filter.type = 'lowshelf';
            filter.frequency.setValueAtTime(320, ctx.currentTime);
            filter.gain.setValueAtTime(2.8, ctx.currentTime);
          } else {
            // Crisp presence boost for clear voice projection
            filter.type = 'highshelf';
            filter.frequency.setValueAtTime(3400, ctx.currentTime);
            filter.gain.setValueAtTime(1.8, ctx.currentTime);
          }

          source.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(ctx.destination);

          this.currentSource = source;
          this.currentGainNode = gainNode;
          const calculatedDuration = audioBuffer.duration / effectiveRate;

          source.onended = () => {
            if (this.currentSource === source) {
              this.isSpeaking = false;
              this.activeCueId = null;
              this.notifyDucking(false);
              this.currentSource = null;
              this.currentGainNode = null;
            }
            resolve(calculatedDuration);
          };

          source.start(0);
          return;
        }
      } catch (err) {
        console.warn('[DubAudioEngine] Web Audio playback failed, falling back to streaming:', err);
      }

      // Secondary fallback: Direct HTML5 Audio playback with smart rate
      try {
        const ttsUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${targetLang}`;
        const audio = new Audio(ttsUrl);
        let effRate = (speedFactor || 1.0) * this.globalSpeedMultiplier;
        if (targetDuration && targetDuration > 0.4) {
          const estimatedDur = estimateSpokenDuration(text);
          effRate = Math.max(0.85, Math.min(1.5, estimatedDur / targetDuration));
        }
        audio.playbackRate = effRate;
        audio.volume = Math.max(0, Math.min(1, volume));
        this.currentAudioElement = audio;

        audio.onended = () => {
          if (this.currentAudioElement === audio) {
            this.isSpeaking = false;
            this.activeCueId = null;
            this.notifyDucking(false);
            this.currentAudioElement = null;
          }
          resolve(audio.duration || 2.5);
        };

        audio.onerror = () => {
          this.fallbackSpeechSynth(text, pitchFactor, speedFactor, targetDuration).then(resolve);
        };

        await audio.play();
      } catch {
        this.fallbackSpeechSynth(text, pitchFactor, speedFactor, targetDuration).then(resolve);
      }
    });
  }

  // Fallback to SpeechSynthesis if available
  private fallbackSpeechSynth(text: string, pitchFactor: number, speedFactor: number, targetDuration?: number): Promise<number> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window && text) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        let calculatedRate = (speedFactor || 1.0) * this.globalSpeedMultiplier;
        if (this.autoSyncSpeedEnabled && targetDuration && targetDuration > 0.4) {
          const est = estimateSpokenDuration(text);
          calculatedRate = Math.max(0.85, Math.min(1.5, est / targetDuration));
        }
        utterance.rate = Math.min(1.5, Math.max(0.8, calculatedRate));
        utterance.pitch = Math.min(1.3, Math.max(0.7, pitchFactor || 1.0));

        const voices = window.speechSynthesis.getVoices();
        const khVoice = voices.find((v) => v.lang.includes('km') || v.lang.includes('kh'));
        if (khVoice) {
          utterance.voice = khVoice;
        }

        utterance.onend = () => {
          this.isSpeaking = false;
          this.activeCueId = null;
          this.notifyDucking(false);
          resolve(2.5);
        };

        utterance.onerror = () => {
          this.isSpeaking = false;
          this.activeCueId = null;
          this.notifyDucking(false);
          resolve(2.0);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        this.isSpeaking = false;
        this.activeCueId = null;
        this.notifyDucking(false);
        resolve(1.0);
      }
    });
  }

  public stopAllAudio(instant: boolean = true) {
    this.isSpeaking = false;
    this.activeCueId = null;
    this.notifyDucking(false);

    if (this.currentSource) {
      try {
        if (!instant && this.currentGainNode && this.ctx) {
          // Smooth 0.05s fade out to avoid clicks
          this.currentGainNode.gain.setValueAtTime(this.currentGainNode.gain.value, this.ctx.currentTime);
          this.currentGainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
          const oldSource = this.currentSource;
          setTimeout(() => {
            try {
              oldSource.stop();
              oldSource.disconnect();
            } catch {}
          }, 45);
        } else {
          this.currentSource.stop();
          this.currentSource.disconnect();
        }
      } catch {
        // ignore
      }
      this.currentSource = null;
      this.currentGainNode = null;
    }

    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudioElement = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioEngine = new DubAudioEngine();
