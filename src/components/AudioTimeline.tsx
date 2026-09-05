import React, { useRef, useState } from 'react';
import { 
  Mic, 
  Languages, 
  FileAudio, 
  Volume2, 
  VolumeX, 
  Magnet, 
  Lock, 
  Sparkles, 
  Minus, 
  Plus, 
  ChevronDown,
  Zap,
  Gauge,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SubtitleItem } from '../types';
import { formatTimecode } from '../utils/srtHelper';
import { calculateSmartFit, autoFitAllSubtitles } from '../utils/smartFitEngine';
import { audioEngine } from '../utils/audioEngine';

interface AudioTimelineProps {
  duration: number;
  currentTime: number;
  subtitles: SubtitleItem[];
  onSeek: (time: number) => void;
  bgmName?: string;
  hasIsolatedVoice?: boolean;
  isOriginalAudioMuted?: boolean;
  onToggleOriginalAudioMuted?: () => void;
  onTranscribe?: () => void;
  onTranslate?: () => void;
  onGenerateAudio?: () => void;
  onApplySmartFitAll?: (newSubtitles: SubtitleItem[]) => void;
  isGeneratingAudio?: boolean;
}

export const AudioTimeline: React.FC<AudioTimelineProps> = ({
  duration = 35.0,
  currentTime,
  subtitles,
  onSeek,
  hasIsolatedVoice = true,
  isOriginalAudioMuted = true,
  onToggleOriginalAudioMuted,
  onTranscribe,
  onTranslate,
  onGenerateAudio,
  onApplySmartFitAll,
  isGeneratingAudio = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(210);
  const [smartFitMode, setSmartFitMode] = useState<'Adaptive' | 'Snap Slot' | 'Stretch Voice'>('Adaptive');
  const [isSmartFitOn, setIsSmartFitOn] = useState<boolean>(audioEngine.isAutoSyncSpeedEnabled());
  const [isSnapOn, setIsSnapOn] = useState<boolean>(true);
  const [t1Muted, setT1Muted] = useState<boolean>(false);
  const [a1Volume, setA1Volume] = useState<number>(100);
  const [a2Volume, setA2Volume] = useState<number>(100);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pos * duration);
  };

  const handleZoomChange = (delta: number) => {
    setZoomLevel((prev) => Math.max(100, Math.min(400, prev + delta)));
  };

  const handleToggleSmartFit = () => {
    const nextState = !isSmartFitOn;
    setIsSmartFitOn(nextState);
    audioEngine.setAutoSyncSpeed(nextState);
  };

  const handleExecuteSmartFitAll = () => {
    if (!onApplySmartFitAll || subtitles.length === 0) return;
    const mode = smartFitMode === 'Snap Slot' ? 'snap_duration' : 'adaptive';
    const optimized = autoFitAllSubtitles(subtitles, duration, mode);
    onApplySmartFitAll(optimized);
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Time markers along ruler
  const totalSeconds = Math.max(duration, 30);
  const step = 2; // 2 seconds per tick
  const rulerTicks = Array.from({ length: Math.ceil(totalSeconds / step) + 1 }).map((_, i) => i * step);

  return (
    <div className="flex flex-col bg-[#070b13] border-t border-[#162235] text-[#c9d1d9] select-none shadow-2xl">
      {/* TIMELINE Top Control Toolbar matching Frenxz Studio Style */}
      <div className="px-4 py-2 bg-[#0a101b] border-b border-[#162235] flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Title & Modifiers */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <h3 className="font-black text-white text-xs tracking-wider uppercase font-sans">
              TIMELINE
            </h3>
            <span className="text-[10px] font-mono text-[#38bdf8] bg-[#0c2240] px-1.5 py-0.2 rounded border border-[#1e4976]">
              Frenxz Engine
            </span>
          </div>

          {/* Smart Fit Pill & Mode */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleSmartFit}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer shadow-xs ${
                isSmartFitOn
                  ? 'bg-[#062c1d] border-[#059669] text-[#34d399]'
                  : 'bg-[#111827] border-[#374151] text-[#6b7280]'
              }`}
              title="បើក/បិទ ការសម្រួលល្បឿន និងពេលវេលានិយាយស្វ័យប្រវត្តិ (Smart Fit Adaptive Sync)"
            >
              <Zap className={`w-3.5 h-3.5 ${isSmartFitOn ? 'text-[#10b981] animate-pulse' : 'text-[#6b7280]'}`} />
              <span>Smart Fit: {isSmartFitOn ? 'ADAPTIVE (ON)' : 'OFF'}</span>
            </button>

            {/* Smart Fit Mode Dropdown */}
            <div className="relative">
              <select
                value={smartFitMode}
                onChange={(e) => setSmartFitMode(e.target.value as any)}
                className="bg-[#0e1726] border border-[#1e293b] text-[#34d399] text-[11px] font-semibold rounded-md px-2 py-1 appearance-none pr-5 cursor-pointer focus:outline-none focus:border-[#059669]"
              >
                <option value="Adaptive">Adaptive Pace</option>
                <option value="Snap Slot">Snap Boundaries</option>
                <option value="Stretch Voice">Time-Stretch Only</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#64748b] absolute right-1.5 top-2 pointer-events-none" />
            </div>

            {/* Auto-Fit All Cues Button */}
            {onApplySmartFitAll && (
              <button
                onClick={handleExecuteSmartFitAll}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#0c2240] hover:bg-[#13335c] border border-[#1e4976] text-[#38bdf8] hover:text-white text-[10.5px] font-bold transition-all cursor-pointer shadow-xs"
                title="កែសម្រួលគ្រប់ Segments ទាំងអស់ឱ្យត្រូវនឹងសំឡេង ១០០% (Auto-Fit All Segments)"
              >
                <Gauge className="w-3 h-3 text-[#38bdf8]" />
                <span>Auto-Fit All</span>
              </button>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#0e1726] border border-[#1e293b] rounded-md px-1.5 py-0.5 text-[11px] font-mono">
            <button
              onClick={() => handleZoomChange(-25)}
              className="text-[#94a3b8] hover:text-white px-1 font-bold cursor-pointer"
              title="Zoom out"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[#38bdf8] font-bold px-1.5">{zoomLevel}%</span>
            <button
              onClick={() => handleZoomChange(25)}
              className="text-[#94a3b8] hover:text-white px-1 font-bold cursor-pointer"
              title="Zoom in"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* SNAP Pill */}
          <button
            onClick={() => setIsSnapOn(!isSnapOn)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
              isSnapOn
                ? 'bg-[#0f233d] border-[#1d4ed8] text-[#60a5fa]'
                : 'bg-[#111827] border-[#374151] text-[#6b7280]'
            }`}
            title="Snap to time markers"
          >
            <Magnet className="w-3 h-3 text-[#38bdf8]" />
            <span>SNAP: {isSnapOn ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Right: Solid Action Pills (Transcribe, Translate, Generate Audio) */}
        <div className="flex items-center gap-2">
          {/* 1. Transcribe Button */}
          <button
            onClick={onTranscribe}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#3b82f6] text-white text-[11px] font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            title="ស្រង់អត្ថបទពីសំឡេងដើម (AI Speech to Text)"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Transcribe</span>
          </button>

          {/* 2. Translate Button */}
          <button
            onClick={onTranslate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-[11px] font-bold rounded-lg shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            title="បកប្រែជាភាសាខ្មែរជាមួយ Gemini AI"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Translate</span>
          </button>

          {/* 3. Generate Audio Button */}
          <button
            onClick={onGenerateAudio}
            disabled={isGeneratingAudio}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#059669] hover:bg-[#10b981] disabled:opacity-50 text-white text-[11px] font-bold rounded-lg shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            title="បញ្ចេញសំឡេងខ្មែរ AI ទាំងអស់"
          >
            <FileAudio className={`w-3.5 h-3.5 ${isGeneratingAudio ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAudio ? 'Synthesizing...' : 'Generate Audio'}</span>
          </button>
        </div>
      </div>

      {/* Main Track Workspace */}
      <div className="flex bg-[#070b13] overflow-x-auto min-h-[140px] max-h-[175px]">
        {/* Left Column: Track Headers (T1, A1, A2) */}
        <div className="w-28 shrink-0 bg-[#0a101b] border-r border-[#162235] flex flex-col z-20">
          {/* Header spacer for ruler */}
          <div className="h-6 border-b border-[#162235] bg-[#070b13] flex items-center px-2 text-[10px] font-mono text-[#64748b]">
            TRACKS
          </div>

          {/* T1 Track Header */}
          <div className="h-10 border-b border-[#162235] flex items-center justify-between px-2.5 bg-[#0a101b]">
            <div className="flex items-center gap-1 font-mono font-bold text-xs text-[#38bdf8]">
              <span>T1</span>
              <span className="text-[9px] text-[#64748b]">SUBS</span>
            </div>
            <div className="flex items-center gap-1 text-[#64748b]">
              <button 
                onClick={() => setT1Muted(!t1Muted)} 
                className="hover:text-white cursor-pointer"
                title="Lock Subtitles Track"
              >
                <Lock className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* A1 Track Header (Khmer Voice) */}
          <div className="h-10 border-b border-[#162235] flex flex-col justify-center px-2.5 bg-[#0a101b]">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-[#34d399]">A1 DUB</span>
              <div className="flex items-center gap-1 text-[9px] text-[#94a3b8]">
                <Volume2 className="w-3 h-3 text-[#10b981]" />
                <span className="font-mono">{a1Volume}%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={a1Volume}
              onChange={(e) => setA1Volume(Number(e.target.value))}
              className="w-full h-1 bg-[#1e293b] rounded appearance-none cursor-pointer accent-[#10b981] mt-0.5"
            />
          </div>

          {/* A2 Track Header (BGM / Original) */}
          <div className="h-10 border-b border-[#162235] flex flex-col justify-center px-2.5 bg-[#0a101b]">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-[#c084fc]">A2 BGM</span>
              <button
                onClick={onToggleOriginalAudioMuted}
                className="flex items-center gap-1 text-[9px] text-[#94a3b8] hover:text-white cursor-pointer"
                title="Mute / Unmute Original Track"
              >
                {isOriginalAudioMuted ? (
                  <VolumeX className="w-3 h-3 text-rose-400" />
                ) : (
                  <Volume2 className="w-3 h-3 text-[#c084fc]" />
                )}
                <span className="font-mono">{isOriginalAudioMuted ? 'MUTE' : `${a2Volume}%`}</span>
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={isOriginalAudioMuted ? 0 : a2Volume}
              onChange={(e) => setA2Volume(Number(e.target.value))}
              disabled={isOriginalAudioMuted}
              className="w-full h-1 bg-[#1e293b] rounded appearance-none cursor-pointer accent-[#a855f7] mt-0.5 disabled:opacity-40"
            />
          </div>
        </div>

        {/* Right Canvas: Ruler + Track Clips + Playhead */}
        <div 
          ref={containerRef}
          onClick={handleTimelineClick}
          className="relative flex-1 bg-[#070b13] flex flex-col cursor-pointer overflow-hidden min-w-[700px]"
        >
          {/* 1. Timecode Ruler Bar */}
          <div className="h-6 bg-[#090e18] border-b border-[#162235] flex items-center relative text-[10px] font-mono text-[#64748b]">
            {rulerTicks.map((sec) => {
              const leftPercent = (sec / duration) * 100;
              if (leftPercent > 100) return null;
              return (
                <div 
                  key={sec} 
                  className="absolute top-0 bottom-0 flex flex-col justify-between"
                  style={{ left: `${leftPercent}%` }}
                >
                  <span className="text-[9px] pl-1 font-mono text-[#64748b]">
                    {formatTimecode(sec, false)}
                  </span>
                  <div className="w-[1px] h-1.5 bg-[#1e293b]" />
                </div>
              );
            })}
          </div>

          {/* Playhead Vertical Glowing Line & Knob */}
          <div 
            className="absolute top-0 bottom-0 z-30 pointer-events-none transition-all duration-75"
            style={{ left: `${playheadPercent}%` }}
          >
            {/* Top Diamond Head */}
            <div className="w-3.5 h-3.5 -translate-x-[6px] top-1 absolute rotate-45 bg-[#22d3ee] border border-white shadow-[0_0_10px_#22d3ee]" />
            {/* Glowing vertical needle */}
            <div className="w-[2px] h-full bg-gradient-to-b from-[#22d3ee] via-[#38bdf8] to-[#c084fc] shadow-[0_0_8px_#38bdf8]" />
          </div>

          {/* 2. T1 Track: Subtitle Text Clips */}
          <div className="h-10 border-b border-[#162235] relative bg-[#090f1a]/80 flex items-center px-1">
            {duration > 0 && subtitles.map((sub) => {
              const leftPercent = (sub.startTime / duration) * 100;
              const widthPercent = Math.max(1.5, ((sub.endTime - sub.startTime) / duration) * 100);
              const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;

              return (
                <div
                  key={sub.id}
                  className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center truncate text-[11px] font-medium transition-all shadow-md ${
                    isActive
                      ? 'bg-[#1e40af] border-2 border-[#a3e635] shadow-[0_0_14px_rgba(163,230,53,0.7)] text-[#fef08a] z-20 scale-[1.02]'
                      : 'bg-[#1d4ed8] border border-[#3b82f6]/70 text-white hover:border-[#60a5fa]'
                  }`}
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                  title={`#${sub.index}: ${sub.textKh || sub.textEn}`}
                >
                  <span className="truncate font-sans">
                    #{sub.index}: {sub.textKh || sub.textEn}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 3. A1 Track: Dubbed Audio Wave Clips with Intelligent Smart Fit Badges */}
          <div className="h-10 border-b border-[#162235] relative bg-[#07131a]/80 flex items-center px-1">
            {duration > 0 && subtitles.map((sub) => {
              const leftPercent = (sub.startTime / duration) * 100;
              const widthPercent = Math.max(1.5, ((sub.endTime - sub.startTime) / duration) * 100);
              const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;

              const text = sub.textKh || sub.textEn;
              const fit = calculateSmartFit(text, sub.startTime, sub.endTime, sub.audioDuration);

              return (
                <div
                  key={sub.id}
                  className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-[10px] font-mono transition-all shadow-md ${
                    isActive
                      ? 'bg-[#065f46] border-2 border-[#a3e635] shadow-[0_0_12px_rgba(163,230,53,0.6)] text-[#ecfdf5] z-20 scale-[1.02]'
                      : 'bg-[#047857] border border-[#10b981]/70 text-[#ecfdf5] hover:border-[#34d399]'
                  }`}
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                  title={`#${sub.index}: ${text} (${fit.statusLabelKh} - Rate: ${fit.idealSpeedRate}x)`}
                >
                  <div className="flex items-center gap-1 truncate mr-1">
                    <span className="font-bold text-[#a7f3d0]">🔊 #{sub.index}:</span>
                    <span className="truncate">{sub.textKh ? sub.textKh.slice(0, 8) + '...' : 'Audio'}</span>
                  </div>

                  {/* Smart Fit Rate & Percentage Badge */}
                  <div className="flex items-center gap-1 shrink-0 font-mono text-[9px]">
                    <span 
                      className="px-1 rounded font-bold border"
                      style={{ 
                        backgroundColor: fit.status === 'overflow' ? '#450a0a' : fit.status === 'fast' ? '#451a03' : '#022c22',
                        borderColor: fit.statusColor,
                        color: fit.statusColor
                      }}
                    >
                      {fit.idealSpeedRate}x
                    </span>
                    <span 
                      className="hidden sm:inline px-1 rounded border text-[#a7f3d0] bg-[#022c22] border-[#059669]"
                    >
                      {fit.fitPercentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. A2 Track: BGM / Original Audio Background Stem */}
          <div className="h-10 border-b border-[#162235] relative bg-[#130d24]/70 flex items-center px-1">
            <div 
              className={`h-7 w-full rounded-md border flex items-center px-3 gap-1 overflow-hidden transition-opacity ${
                isOriginalAudioMuted 
                  ? 'bg-[#2e1065]/40 border-[#581c87]/50 opacity-40' 
                  : 'bg-[#581c87] border-[#9333ea] opacity-90 shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#e9d5ff] font-bold shrink-0">
                <span>🎵 BGM & Original Stem ({isOriginalAudioMuted ? 'Muted' : 'Stereo'})</span>
              </div>
              <div className="flex-1 flex items-center gap-0.5 h-full opacity-60">
                {Array.from({ length: 90 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-0.5 bg-[#c084fc] rounded-full" 
                    style={{ height: `${20 + Math.sin(i * 0.3) * 35}%` }} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
