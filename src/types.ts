export interface SubtitleItem {
  id: string;
  index: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  textEn: string;
  textKh: string;
  voiceProfileId: string;
  status: 'ready' | 'translated' | 'dubbed' | 'processing' | 'muted';
  confidence?: number;
  audioDuration?: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  language: 'km-KH' | 'en-US' | 'en-GB';
  gender: 'Female' | 'Male';
  accent: string;
  description: string;
  sampleText: string;
  speed: number;
  pitch: number;
  tag: string;
}

export interface HardwareTelemetry {
  cpuUsage: number;
  cpuTemp: number;
  gpuUsage: number;
  gpuTemp: number;
  vramUsed: number;
  vramTotal: number;
  ramUsed: number;
  ramTotal: number;
  engineStatus: string;
}

export interface AudioMixSettings {
  dubbedVolume: number; // 0 - 100
  originalVolume: number; // 0 - 100
  bgmVolume: number; // 0 - 100
  duckingAmount: number; // 0 - 100
  normalizeLoudness: boolean;
  noiseGate: boolean;
}

export interface RenderSettings {
  resolution: '1080p' | '4k' | '720p' | 'vertical_1080x1920';
  framerate: 24 | 30 | 60;
  codec: 'H.264 (NVENC)' | 'H.265 (HEVC)' | 'AV1' | 'ProRes 422';
  bitrateMbps: number;
  burnSubtitles: boolean;
  subtitleLanguage: 'khmer' | 'english' | 'dual' | 'none';
  subtitlePosition: 'bottom' | 'top' | 'middle';
  subtitleFontSize: number;
  exportStems: boolean;
}

export interface ProjectData {
  version?: string;
  projectName: string;
  videoUrl?: string;
  videoName: string;
  videoDuration?: number;
  duration?: number;
  bgmName?: string;
  bgmUrl?: string;
  subtitles: SubtitleItem[];
  mixSettings: AudioMixSettings;
  createdDate?: string;
}
