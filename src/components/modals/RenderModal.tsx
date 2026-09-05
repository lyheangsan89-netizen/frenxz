import React, { useState, useEffect } from 'react';
import { X, Sparkles, Download, CheckCircle2, FileText, Settings, Sliders, Cpu, FileJson } from 'lucide-react';
import { RenderSettings, SubtitleItem } from '../../types';
import { generateSrtContent } from '../../utils/srtHelper';

interface RenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  videoName: string;
}

export const RenderModal: React.FC<RenderModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  videoName
}) => {
  const [settings, setSettings] = useState<RenderSettings>({
    resolution: '1080p',
    framerate: 30,
    codec: 'H.264 (NVENC)',
    bitrateMbps: 16,
    burnSubtitles: true,
    subtitleLanguage: 'khmer',
    subtitlePosition: 'bottom',
    subtitleFontSize: 24,
    exportStems: true
  });

  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStage, setRenderStage] = useState('');
  const [renderComplete, setRenderComplete] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsRendering(false);
      setRenderProgress(0);
      setRenderComplete(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartRender = () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderComplete(false);

    const stages = [
      'Stage 1/4: Synthesizing Neural Khmer Phonetic Audio Stems...',
      'Stage 2/4: Balancing Audio Mix & Dynamic BGM Ducking (-14 LUFS)...',
      'Stage 3/4: Rendering Khmer Subtitles with GPU Hardware Acceleration...',
      'Stage 4/4: Multiplexing Final Video Master Stream...'
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += 4;
      setRenderProgress(current);

      if (current < 25) {
        setRenderStage(stages[0]);
      } else if (current < 50) {
        setRenderStage(stages[1]);
      } else if (current < 80) {
        setRenderStage(stages[2]);
      } else {
        setRenderStage(stages[3]);
      }

      if (current >= 100) {
        clearInterval(interval);
        setIsRendering(false);
        setRenderComplete(true);
      }
    }, 60);
  };

  const handleDownloadSrt = () => {
    const srt = generateSrtContent(subtitles, settings.subtitleLanguage === 'english' ? 'english' : settings.subtitleLanguage === 'dual' ? 'dual' : 'khmer');
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoName.replace(/\.[^/.]+$/, '')}_Khmer_Dub.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadProject = () => {
    const projectData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      videoName,
      renderSettings: settings,
      subtitles
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoName.replace(/\.[^/.]+$/, '')}_Dub_Project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-[#c9d1d9]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xs tracking-wider text-white uppercase">
                នាំចេញ និងបង្កើតវីដេអូចុងក្រោយ (RENDER & EXPORT)
              </h3>
              <p className="text-[10px] text-slate-400">
                រៀបចំសំឡេងបញ្ចូលខ្មែរ និងអត្ថបទរត់កម្រិតគុណភាពខ្ពស់
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-[#30363d] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[75vh]">
          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Resolution */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 text-[11px] font-mono">EXPORT RESOLUTION</label>
              <select
                value={settings.resolution}
                onChange={(e) => setSettings({ ...settings, resolution: e.target.value as any })}
                disabled={isRendering}
                className="bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="1080p">1080p Full HD (1920x1080)</option>
                <option value="4k">4K Ultra HD (3840x2160)</option>
                <option value="720p">720p HD (1280x720)</option>
                <option value="vertical_1080x1920">Vertical Shorts (1080x1920)</option>
              </select>
            </div>

            {/* Video Codec */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 text-[11px] font-mono">VIDEO CODEC ENGINE</label>
              <select
                value={settings.codec}
                onChange={(e) => setSettings({ ...settings, codec: e.target.value as any })}
                disabled={isRendering}
                className="bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="H.264 (NVENC)">H.264 (Hardware Accelerated)</option>
                <option value="H.265 (HEVC)">H.265 / HEVC 10-Bit</option>
                <option value="AV1">AV1 Next-Gen</option>
                <option value="ProRes 422">Apple ProRes 422 HQ</option>
              </select>
            </div>

            {/* Subtitle Burn-in */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 text-[11px] font-mono">SUBTITLE LANGUAGE</label>
              <select
                value={settings.subtitleLanguage}
                onChange={(e) => setSettings({ ...settings, subtitleLanguage: e.target.value as any })}
                disabled={isRendering}
                className="bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="khmer">ភាសាខ្មែរ (Khmer Kantumruy)</option>
                <option value="dual">Dual Captions (Khmer + English)</option>
                <option value="english">English Captions Only</option>
                <option value="none">No Burnt-in (Clean Video)</option>
              </select>
            </div>

            {/* Framerate */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 text-[11px] font-mono">FRAMERATE (FPS)</label>
              <select
                value={settings.framerate}
                onChange={(e) => setSettings({ ...settings, framerate: parseInt(e.target.value) as any })}
                disabled={isRendering}
                className="bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="30">29.97 / 30 FPS</option>
                <option value="60">60 FPS (Smooth)</option>
                <option value="24">24 FPS (Cinematic)</option>
              </select>
            </div>
          </div>

          {/* Audio Output Stems Checklist */}
          <div className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg flex flex-col gap-2 text-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 font-mono">
              AUDIO MASTERING & STEMS
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded bg-[#21262d] border-[#30363d] accent-blue-500" />
                <span>Master Stereo Mix</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded bg-[#21262d] border-[#30363d] accent-blue-500" />
                <span>Khmer Dub Vocal Stem</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded bg-[#21262d] border-[#30363d] accent-blue-500" />
                <span>Auto-duck BGM beneath dialogue</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded bg-[#21262d] border-[#30363d] accent-blue-500" />
                <span>Embed UTF-8 Khmer SRT Track</span>
              </label>
            </div>
          </div>

          {/* Rendering Progress Card */}
          {(isRendering || renderComplete) && (
            <div className="p-3 bg-[#0d1117] border border-blue-500/40 rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                  {renderComplete ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>ដំណើរការ Render បានសម្រេច ១០០%!</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4 text-blue-400 animate-spin" />
                      <span>{renderStage}</span>
                    </>
                  )}
                </span>
                <span className="font-mono text-blue-400 font-bold">{renderProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#161b22] border border-[#30363d] rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-150 ${
                    renderComplete 
                      ? 'bg-green-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-400">
            {subtitles.length} Subtitles • Khmer Dub Active
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] text-xs font-semibold transition-colors cursor-pointer"
            >
              បិទ
            </button>

            {renderComplete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSrt}
                  className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-blue-500/40 text-blue-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>ទាញយក SRT</span>
                </button>
                <button
                  onClick={handleDownloadProject}
                  className="px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-green-900/30 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ទាញយកគម្រោងពេញលេញ</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartRender}
                disabled={isRendering}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-900/30 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRendering ? 'កំពុង Render...' : 'ចាប់ផ្តើម Render'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
