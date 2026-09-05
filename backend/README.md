# DII STUDIO DUB: Automated Khmer Video Dubbing Backend

This folder contains the complete automated video dubbing pipeline for **DII STUDIO DUB**, featuring English-to-Khmer (`km-KH`) speech recognition, context-aware theatrical translation, multi-speaker voice cloning, dynamic audio-video synchronization (`atempo`), and final FFmpeg muxing.

---

## 5-Stage Technical Architecture

```
                 [Input Video: MP4 / WebM]
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 1. Stem Extraction (FFmpeg & Demucs v4)               │
 │    • Extract 16kHz mono audio track                    │
 │    • Separate dialogue (vocals.wav) from BGM/SFX      │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 2. Speech-to-Text & Diarization (WhisperX)             │
 │    • Faster-Whisper large-v3 speech recognition        │
 │    • Phoneme-level alignment via Wav2Vec2              │
 │    • PyAnnote speaker diarization (SPEAKER_00, 01...) │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 3. Context-Aware Khmer Translation (Gemini 1.5 Pro)    │
 │    • Syllable & duration matching constraint           │
 │    • Natural theatrical Cambodian colloquialisms       │
 │    • Cambodian honorifics & Unicode normalization      │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 4. Multi-Speaker Voice Synthesis (ElevenLabs / TTS)   │
 │    • ElevenLabs Multilingual v2 or Edge-TTS (Khmer)    │
 │    • Speaker character mapping per voice profile       │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 5. Audio-Video Sync & Rendering (FFmpeg)               │
 │    • Dynamic time-stretching with `atempo` (0.85-1.25x)│
 │    • BGM sidechain ducking (-14dB beneath dialogue)    │
 │    • Re-muxing MP4 with burnt-in Kantumruy Pro SRT     │
 └────────────────────────────────────────────────────────┘
```

---

## Prerequisites

1. **System packages**:
   - `ffmpeg` (with `libx264`, `libass`, and `sidechaincompress` enabled)
   - `ffprobe`
2. **Python 3.10+** (with GPU support recommended for WhisperX and Demucs)
3. **Environment variables**:
   ```bash
   export GEMINI_API_KEY="your-gemini-api-key"
   export ELEVENLABS_API_KEY="your-elevenlabs-key" # Optional, falls back to Edge-TTS
   export HF_TOKEN="your-huggingface-token"         # For PyAnnote Diarization
   ```

---

## Installation

```bash
# Clone or navigate to the backend folder
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## Execution

To run the automated pipeline on any video file:

```bash
python dii_studio_dub_pipeline.py path/to/input_video.mp4 --work-dir ./workspace --resolution 1080p
```

### Outputs Produced in `workspace/`:
- `original_audio.wav`: Extracted 16kHz mono audio.
- `vocals.wav` & `instrumental.wav`: AI-separated vocal and background music stems.
- `transcription_whisperx.json`: Detailed word-level timestamps and speaker IDs.
- `dubbed_speech_track.wav`: Full synchronized Khmer voice track.
- `subtitles_khmer.srt`: Standard UTF-8 Khmer subtitle file.
- `final_mixed_audio.wav`: Master audio with auto-ducked background music.
- `dubbed_input_video.mp4`: Final 1080p video ready for streaming or broadcast.
