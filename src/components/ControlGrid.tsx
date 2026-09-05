import React, { useRef } from 'react';
import { 
  Upload, 
  Music, 
  Split, 
  Sliders, 
  Sparkles,
  FileAudio,
  Film,
  Zap,
  Gauge,
  Volume2,
  Activity,
  Download
} from 'lucide-react';

interface ControlGridProps {
  onUploadVideo: (file: File) => void;
  onUploadBgm: (file: File) => void;
  onIsolateVoice: () => void;
  onOpenMixer: () => void;
  onImportSrt: () => void;
  onExportSrt: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
  onClearData: () => void;
  onRenderFinalVideo: () => void;
  onOpenPipeline: () => void;
  onExtractAudio: () => void;
  onOpenTelemetry?: () => void;
  bgmName?: string;
  hasIsolatedVoice?: boolean;
}

export const ControlGrid: React.FC<ControlGridProps> = ({
  onUploadVideo,
  onUploadBgm,
  onIsolateVoice,
  onOpenMixer,
  onOpenTelemetry,
  bgmName
}) => {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const bgmInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadVideo(file);
    }
  };

  const handleBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadBgm(file);
    }
  };

  return (
    <div className="flex flex-col gap-2 select-none">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoChange}
        accept="video/mp4,video/webm,video/mkv,video/quicktime"
        className="hidden"
      />
      <input
        type="file"
        ref={bgmInputRef}
        onChange={handleBgmChange}
        accept="audio/mp3,audio/wav,audio/aac,audio/ogg"
        className="hidden"
      />

      {/* Main Studio Action Cards */}
      <div className="grid grid-cols-2 gap-2">
        {/* Upload Video */}
        <button
          onClick={() => videoInputRef.current?.click()}
          className="flex items-center gap-2.5 p-2.5 bg-[#0a101b] hover:bg-[#101827] border border-[#162235] hover:border-[#2563eb]/60 rounded-lg text-left transition-all cursor-pointer group shadow-sm"
          title="ជ្រើសរើសវីដេអូពីកុំព្យូទ័រ (MP4, WebM)"
        >
          <div className="w-7 h-7 rounded-md bg-[#0c2240] border border-[#1e4976] flex items-center justify-center shrink-0 group-hover:bg-[#1d4ed8]/30 transition-all">
            <Upload className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className="overflow-hidden min-w-0">
            <span className="block font-bold text-white text-[11px] truncate">Upload Video</span>
            <span className="block text-[10px] text-[#64748b] truncate">MP4, WebM, MOV</span>
          </div>
        </button>

        {/* Upload BGM Stem */}
        <button
          onClick={() => bgmInputRef.current?.click()}
          className="flex items-center gap-2.5 p-2.5 bg-[#0a101b] hover:bg-[#101827] border border-[#162235] hover:border-[#7c3aed]/60 rounded-lg text-left transition-all cursor-pointer group shadow-sm"
          title="ដាក់បទភ្លេងផ្ទៃខាងក្រោយ (BGM Stem)"
        >
          <div className="w-7 h-7 rounded-md bg-[#1f1638] border border-[#6d28d9] flex items-center justify-center shrink-0 group-hover:bg-[#7c3aed]/30 transition-all">
            <Music className="w-3.5 h-3.5 text-[#c084fc]" />
          </div>
          <div className="overflow-hidden min-w-0">
            <span className="block font-bold text-white text-[11px] truncate">BGM Music</span>
            <span className="block text-[10px] text-[#64748b] truncate">{bgmName || 'MP3, WAV'}</span>
          </div>
        </button>

        {/* Voice Isolation */}
        <button
          onClick={onIsolateVoice}
          className="flex items-center gap-2.5 p-2.5 bg-[#0a101b] hover:bg-[#101827] border border-[#162235] hover:border-[#059669]/60 rounded-lg text-left transition-all cursor-pointer group shadow-sm"
          title="បំបែកសំឡេងមនុស្ស និងភ្លេង (Vocal Remover / Stem Isolation)"
        >
          <div className="w-7 h-7 rounded-md bg-[#062c1d] border border-[#059669] flex items-center justify-center shrink-0 group-hover:bg-[#059669]/30 transition-all">
            <Split className="w-3.5 h-3.5 text-[#34d399]" />
          </div>
          <div className="overflow-hidden min-w-0">
            <span className="block font-bold text-white text-[11px] truncate">Vocal Isolation</span>
            <span className="block text-[10px] text-[#64748b] truncate">Stem Splitter</span>
          </div>
        </button>

        {/* Audio Mixer */}
        <button
          onClick={onOpenMixer}
          className="flex items-center gap-2.5 p-2.5 bg-[#0a101b] hover:bg-[#101827] border border-[#162235] hover:border-[#d97706]/60 rounded-lg text-left transition-all cursor-pointer group shadow-sm"
          title="កែសម្រួលកម្រិតសំឡេង និង Auto Ducking"
        >
          <div className="w-7 h-7 rounded-md bg-[#2b1803] border border-[#b45309] flex items-center justify-center shrink-0 group-hover:bg-[#b45309]/30 transition-all">
            <Sliders className="w-3.5 h-3.5 text-[#fbbf24]" />
          </div>
          <div className="overflow-hidden min-w-0">
            <span className="block font-bold text-white text-[11px] truncate">Audio Mixer</span>
            <span className="block text-[10px] text-[#64748b] truncate">Auto Ducking</span>
          </div>
        </button>
      </div>

      {/* Hardware Telemetry & Export Banner */}
      {onOpenTelemetry && (
        <button
          onClick={onOpenTelemetry}
          className="w-full flex items-center justify-between p-2.5 bg-[#0a1424] hover:bg-[#102038] border border-[#1d4ed8]/40 hover:border-[#38bdf8] rounded-lg transition-all cursor-pointer group shadow-sm"
          title="ទាញយកកំណត់ត្រា និងដំណើរការ CPU, GPU, RAM"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#0c2240] border border-[#1e4976] flex items-center justify-center text-[#38bdf8] group-hover:bg-[#1e40af]/30 transition-all">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="text-left">
              <span className="block font-bold text-white text-[11px]">Hardware Performance Log</span>
              <span className="block text-[10px] text-[#38bdf8]">ទាញយកដំណើរការ CPU • GPU • RAM</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-[#1e3a8a] text-[#bfdbfe] px-2 py-1 rounded text-[10px] font-bold group-hover:bg-[#2563eb] transition-colors">
            <Download className="w-3 h-3" />
            <span>Download Log</span>
          </div>
        </button>
      )}
    </div>
  );
};
