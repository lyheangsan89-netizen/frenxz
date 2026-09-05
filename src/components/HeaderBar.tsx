import React, { useState } from 'react';
import { 
  Folder, 
  Save, 
  Download, 
  FileText, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Gauge, 
  Video, 
  Upload,
  Zap,
  Activity,
  Cpu,
  HardDrive
} from 'lucide-react';
import { HardwareTelemetry } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface HeaderBarProps {
  telemetry: HardwareTelemetry;
  projectName: string;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onImportSrt: () => void;
  onExportSrt: () => void;
  onOpenRender: () => void;
  onOpenMixer?: () => void;
  onOpenIsolation?: () => void;
  onOpenTranslate?: () => void;
  onOpenPipeline?: () => void;
  onUploadVideo?: () => void;
  onSmartFitAll?: () => void;
  onOpenTelemetry?: () => void;
  isVideoVisible?: boolean;
  onToggleVideo?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  telemetry,
  projectName,
  onOpenProject,
  onSaveProject,
  onImportSrt,
  onExportSrt,
  onOpenRender,
  onUploadVideo,
  onSmartFitAll,
  onOpenTelemetry,
  isVideoVisible = true,
  onToggleVideo
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [autoSyncSpeed, setAutoSyncSpeed] = useState(audioEngine.isAutoSyncSpeedEnabled());

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  const handleToggleAutoSync = () => {
    const nextVal = !autoSyncSpeed;
    setAutoSyncSpeed(nextVal);
    audioEngine.setAutoSyncSpeed(nextVal);
  };

  return (
    <header className="h-12 border-b border-[#162235] bg-[#070b13] flex items-center justify-between px-3.5 shrink-0 z-40 select-none shadow-xl">
      {/* Left: Brand Identity & Active Project Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Frenxz Studio Glow Badge */}
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-[#2563eb] via-[#4f46e5] to-[#9333ea] flex items-center justify-center text-white font-black text-[12px] shadow-lg shadow-blue-500/25 border border-blue-400/50">
            FZ
          </div>

          <div className="flex items-center gap-2">
            <h1 className="font-black text-white text-xs tracking-wider uppercase font-sans">
              FRENXZ STUDIO DUB
            </h1>
            <span className="text-[10px] font-bold text-[#38bdf8] px-2 py-0.5 rounded-full bg-[#0c2240] border border-[#1e4976] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
              Khmer AI Studio
            </span>
          </div>
        </div>

        {/* Project Tag */}
        <div className="hidden xl:flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-md bg-[#0a101b] border border-[#162235] text-[11px] text-[#94a3b8]">
          <span className="text-[#64748b] text-[10px]">Project:</span>
          <span className="font-semibold text-[#e2e8f0] font-mono text-[10.5px] max-w-[140px] truncate">
            {projectName}
          </span>
        </div>
      </div>

      {/* Center: Video Toggle / Smart Fit / Hardware Telemetry Button */}
      <div className="hidden md:flex items-center gap-2">
        {onToggleVideo && (
          <button
            onClick={onToggleVideo}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
              isVideoVisible
                ? 'bg-[#0f233d] border-[#1d4ed8] text-[#60a5fa]'
                : 'bg-[#0a101b] border-[#162235] text-[#64748b] hover:text-white'
            }`}
            title="បង្ហាញ/លាក់ អេក្រង់វីដេអូ (Toggle Video Monitor)"
          >
            <Video className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Video: {isVideoVisible ? 'ON' : 'OFF'}</span>
          </button>
        )}

        {/* Smart Fit Toggle Button */}
        <button
          onClick={handleToggleAutoSync}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer shadow-sm ${
            autoSyncSpeed
              ? 'bg-[#062c1d] border-[#059669] text-[#34d399]'
              : 'bg-[#0a101b] border-[#162235] text-[#64748b]'
          }`}
          title="សម្រួលល្បឿននិយាយ និងទំហំអត្ថបទស្វ័យប្រវត្តិ (Smart Fit Auto-Speed Sync)"
        >
          <Zap className={`w-3.5 h-3.5 ${autoSyncSpeed ? 'text-[#10b981] animate-pulse' : 'text-[#64748b]'}`} />
          <span>Smart Fit: {autoSyncSpeed ? 'ON' : 'OFF'}</span>
        </button>

        {/* Smart Fit All Timeline Trigger */}
        {onSmartFitAll && (
          <button
            onClick={onSmartFitAll}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#10192a] hover:bg-[#19263e] border border-[#233857] text-[#38bdf8] text-[10.5px] font-semibold transition-all cursor-pointer"
            title="កែសម្រួល Timeline Cues ទាំងអស់ឱ្យត្រូវនឹងសំឡេង ១០០% (Auto-Fit All Subtitle Cues)"
          >
            <Gauge className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Fit All</span>
          </button>
        )}

        {/* CPU • GPU • RAM Live Hardware Monitor & Download Trigger */}
        {onOpenTelemetry && (
          <button
            onClick={onOpenTelemetry}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0a1424] hover:bg-[#10203a] border border-[#1d4ed8]/50 text-white text-[10.5px] font-mono transition-all cursor-pointer shadow-sm group"
            title="មើល និងទាញយកកំណត់ត្រាដំណើរការ CPU GPU RAM (Click to view and download telemetry)"
          >
            <Activity className="w-3.5 h-3.5 text-[#38bdf8] animate-pulse" />
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-[#38bdf8]">CPU {telemetry.cpuUsage}%</span>
              <span className="text-[#64748b]">•</span>
              <span className="text-[#c084fc]">GPU {telemetry.gpuUsage}%</span>
              <span className="text-[#64748b]">•</span>
              <span className="text-[#34d399]">RAM {telemetry.ramUsed}G</span>
            </div>
            <span className="bg-[#1e3a8a] text-[#bfdbfe] px-1 py-0.2 rounded text-[9px] font-sans group-hover:bg-[#2563eb] transition-colors">
              Log
            </span>
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Upload Video Button */}
        {onUploadVideo && (
          <button
            onClick={onUploadVideo}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0f233d] hover:bg-[#1d4ed8]/30 border border-[#1d4ed8] text-[#60a5fa] hover:text-white rounded-md text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
            title="បញ្ចូលវីដេអូថ្មី (Upload Video: MP4, WebM, MOV)"
          >
            <Upload className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="hidden sm:inline">Upload Video</span>
          </button>
        )}

        {/* Open Project */}
        <button
          onClick={onOpenProject}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0a101b] hover:bg-[#162235] border border-[#162235] text-[#94a3b8] hover:text-white rounded-md text-[11px] font-semibold transition-all cursor-pointer"
          title="បើកគម្រោងចាស់ (Open Project)"
        >
          <Folder className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span className="hidden sm:inline">Open</span>
        </button>

        {/* Save Project */}
        <button
          onClick={onSaveProject}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0a101b] hover:bg-[#162235] border border-[#162235] text-[#94a3b8] hover:text-white rounded-md text-[11px] font-semibold transition-all cursor-pointer"
          title="រក្សាទុកគម្រោង (Save Project)"
        >
          <Save className="w-3.5 h-3.5 text-[#34d399]" />
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Import SRT */}
        <button
          onClick={onImportSrt}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#0a101b] hover:bg-[#162235] border border-[#162235] text-[#94a3b8] hover:text-white rounded-md text-[11px] font-semibold transition-all cursor-pointer"
          title="នាំចូលអក្សររត់ SRT (Import SRT)"
        >
          <FileText className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span>Import SRT</span>
        </button>

        {/* Export SRT */}
        <button
          onClick={onExportSrt}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#0a101b] hover:bg-[#162235] border border-[#162235] text-[#94a3b8] hover:text-white rounded-md text-[11px] font-semibold transition-all cursor-pointer"
          title="នាំចេញអក្សររត់ (Export SRT)"
        >
          <Download className="w-3.5 h-3.5 text-[#c084fc]" />
          <span>Export SRT</span>
        </button>

        {/* Export Master Video Button */}
        <button
          onClick={onOpenRender}
          className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:from-[#3b82f6] hover:to-[#8b5cf6] text-white rounded-md text-[11px] font-bold transition-all shadow-md shadow-blue-600/30 border border-blue-400/40 cursor-pointer"
          title="នាំចេញវីដេអូចុងក្រោយ (Render Final Video)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Export Video</span>
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleToggleFullscreen}
          className="p-1 bg-[#0a101b] hover:bg-[#162235] border border-[#162235] text-[#64748b] hover:text-white rounded-md transition-colors cursor-pointer"
          title="Fullscreen"
        >
          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
