import React, { useState } from 'react';
import { X, Split, Sparkles, CheckCircle2, Activity, Layers } from 'lucide-react';

interface VoiceIsolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIsolationComplete: () => void;
  videoName: string;
}

export const VoiceIsolationModal: React.FC<VoiceIsolationModalProps> = ({
  isOpen,
  onClose,
  onIsolationComplete,
  videoName
}) => {
  const [model, setModel] = useState<'demucs_v4' | 'uvr_mdx' | 'htdemucs_ft'>('demucs_v4');
  const [stemOutput, setStemOutput] = useState<'2stems' | '4stems'>('2stems');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const handleStartIsolation = () => {
    setIsProcessing(true);
    setProgress(0);
    setCompleted(false);

    const stages = [
      'Extracting 48kHz 24-bit PCM Audio track...',
      'Running AI Demucs v4 Deep Neural Stem Separation...',
      'Applying Wiener filtering & phase de-bleeding...',
      'Generating Isolated Vocal and Clean Instrumental Stems...'
    ];

    let current = 0;
    const timer = setInterval(() => {
      current += 4;
      setProgress(current);

      if (current < 25) setStage(stages[0]);
      else if (current < 60) setStage(stages[1]);
      else if (current < 85) setStage(stages[2]);
      else setStage(stages[3]);

      if (current >= 100) {
        clearInterval(timer);
        setIsProcessing(false);
        setCompleted(true);
        onIsolationComplete();
      }
    }, 70);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-slate-200">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100 font-mono-code">
              AI VOCAL ISOLATION & STEM SEPARATOR
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 text-xs">
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Extract pure dialogue speech from <strong className="text-slate-200 font-mono-code">{videoName}</strong> while preserving background sound effects and musical ambience for seamless dubbing.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-slate-400 text-[11px] font-medium">Neural Isolation Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
              disabled={isProcessing}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            >
              <option value="demucs_v4">Demucs v4 Hybrid Transformer (Highest Quality)</option>
              <option value="uvr_mdx">UVR5 MDX-Net VocalHQ</option>
              <option value="htdemucs_ft">HTDemucs Fine-Tuned 6-Stem</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-400 text-[11px] font-medium">Separation Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStemOutput('2stems')}
                className={`p-2 rounded border text-left flex flex-col gap-0.5 transition-colors ${
                  stemOutput === '2stems'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="font-bold text-xs">2 Stems (Recommended)</span>
                <span className="text-[10px] text-slate-400">Vocals + Instrumental</span>
              </button>
              <button
                type="button"
                onClick={() => setStemOutput('4stems')}
                className={`p-2 rounded border text-left flex flex-col gap-0.5 transition-colors ${
                  stemOutput === '4stems'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="font-bold text-xs">4 Stems Studio</span>
                <span className="text-[10px] text-slate-400">Vocals, Drums, Bass, Other</span>
              </button>
            </div>
          </div>

          {(isProcessing || completed) && (
            <div className="p-3 bg-slate-950 border border-rose-500/40 rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                  {completed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Separation Complete! Vocal Track Ready.</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
                      <span>{stage}</span>
                    </>
                  )}
                </span>
                <span className="font-mono-code text-rose-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-100 ${
                    completed ? 'bg-emerald-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold">
            {completed ? 'Done' : 'Cancel'}
          </button>
          {!completed && (
            <button
              onClick={handleStartIsolation}
              disabled={isProcessing}
              className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md shadow-rose-600/30"
            >
              {isProcessing ? 'Separating Stems...' : 'Start Separation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
