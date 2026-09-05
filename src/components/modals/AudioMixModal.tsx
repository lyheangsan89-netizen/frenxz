import React, { useState } from 'react';
import { X, Sliders, Volume2, Mic2, Music, Check, RotateCcw } from 'lucide-react';
import { AudioMixSettings } from '../../types';

interface AudioMixModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AudioMixSettings;
  onSaveSettings: (settings: AudioMixSettings) => void;
  bgmName?: string;
}

export const AudioMixModal: React.FC<AudioMixModalProps> = ({
  isOpen,
  onClose,
  settings: initialSettings,
  onSaveSettings,
  bgmName
}) => {
  const [settings, setSettings] = useState<AudioMixSettings>(initialSettings);

  if (!isOpen) return null;

  const handleReset = () => {
    setSettings({
      dubbedVolume: 100,
      originalVolume: 0, // Default to 0% (Muted) for clean Khmer dubbing
      bgmVolume: 40,
      duckingAmount: 65,
      normalizeLoudness: true,
      noiseGate: true
    });
  };

  const handleApply = () => {
    onSaveSettings(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100 font-mono-code">
              STUDIO AUDIO MIXER & DUCKING
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliders Console */}
        <div className="p-4 flex flex-col gap-4 text-xs">
          {/* Dubbed Voice Volume */}
          <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Mic2 className="w-3.5 h-3.5" />
                Khmer Dub Voice Track
              </span>
              <span className="font-mono-code font-bold text-slate-100">{settings.dubbedVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={settings.dubbedVolume}
              onChange={(e) => setSettings({ ...settings, dubbedVolume: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Muted)</span>
              <span>100% (Unity)</span>
              <span>150% (+3dB Boost)</span>
            </div>
          </div>

          {/* Original Audio Track (សម្លេងដើម) */}
          <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Volume2 className="w-3.5 h-3.5" />
                Original Video Audio (សម្លេងដើមនៃវីដេអូ)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, originalVolume: settings.originalVolume === 0 ? 30 : 0 })}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                    settings.originalVolume === 0
                      ? 'bg-rose-950/90 text-rose-300 border-rose-500/70 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="ចុចដើម្បីបិទ ឬបើកសំឡេងដើម"
                >
                  {settings.originalVolume === 0 ? '🔇 បិទចោល (0% Muted)' : '🔊 បើក'}
                </button>
                <span className="font-mono-code font-bold text-slate-100 min-w-8 text-right">{settings.originalVolume}%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.originalVolume}
              onChange={(e) => setSettings({ ...settings, originalVolume: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="text-rose-400 font-semibold">0% (បិទសម្លេងដើមចោលទាំងស្រុង)</span>
              <span>20% (Bleed Ambiance)</span>
              <span>100% (ពេញលេញ)</span>
            </div>
          </div>

          {/* BGM Volume */}
          <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Music className="w-3.5 h-3.5" />
                Background Music (BGM)
              </span>
              <span className="font-mono-code font-bold text-slate-100">{settings.bgmVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.bgmVolume}
              onChange={(e) => setSettings({ ...settings, bgmVolume: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="text-[10px] text-slate-400">{bgmName || 'Cinematic Ambience Synth'}</span>
          </div>

          {/* Auto Ducking */}
          <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between font-medium">
              <span className="text-amber-400">Sidechain Auto-Ducking Depth</span>
              <span className="font-mono-code font-bold text-slate-100">{settings.duckingAmount}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.duckingAmount}
              onChange={(e) => setSettings({ ...settings, duckingAmount: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[10px] text-slate-400">Lowers BGM automatically whenever dialogue is active.</span>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.normalizeLoudness}
                onChange={(e) => setSettings({ ...settings, normalizeLoudness: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500"
              />
              <span>EBU R128 Loudness Normalization</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.noiseGate}
                onChange={(e) => setSettings({ ...settings, noiseGate: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500"
              />
              <span>De-reverb & Noise Gate</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold"
            >
              Apply Mix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
