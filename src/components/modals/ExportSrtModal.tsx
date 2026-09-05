import React, { useState } from 'react';
import { X, Download, FileText, Check } from 'lucide-react';
import { SubtitleItem } from '../../types';
import { generateSrtContent, downloadFile } from '../../utils/srtHelper';

interface ExportSrtModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  projectName: string;
}

export const ExportSrtModal: React.FC<ExportSrtModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  projectName
}) => {
  const [exportMode, setExportMode] = useState<'khmer' | 'english' | 'dual'>('khmer');

  if (!isOpen) return null;

  const handleDownload = () => {
    const srtData = generateSrtContent(subtitles, exportMode);
    const suffix = exportMode === 'khmer' ? 'Khmer' : exportMode === 'english' ? 'English' : 'Bilingual';
    const cleanProject = projectName.replace(/\.[^/.]+$/, "");
    downloadFile(`${cleanProject}_${suffix}.srt`, srtData, 'text/plain');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-slate-200">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100 font-mono-code">
              EXPORT SRT SUBTITLES
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 text-xs">
          <label className="text-slate-400 text-[11px] font-medium">Select Subtitle Language Format</label>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setExportMode('khmer')}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                exportMode === 'khmer'
                  ? 'bg-sky-950/40 border-sky-500 text-sky-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <div className="font-bold text-xs font-khmer">ភាសាខ្មែរ (Khmer UTF-8)</div>
                <div className="text-[10px] text-slate-400">Export translated and dubbed Khmer script</div>
              </div>
              {exportMode === 'khmer' && <Check className="w-4 h-4 text-sky-400" />}
            </button>

            <button
              onClick={() => setExportMode('dual')}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                exportMode === 'dual'
                  ? 'bg-sky-950/40 border-sky-500 text-sky-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <div className="font-bold text-xs">Dual Bilingual (Khmer + English)</div>
                <div className="text-[10px] text-slate-400">Top line Khmer, bottom line English</div>
              </div>
              {exportMode === 'dual' && <Check className="w-4 h-4 text-sky-400" />}
            </button>

            <button
              onClick={() => setExportMode('english')}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                exportMode === 'english'
                  ? 'bg-sky-950/40 border-sky-500 text-sky-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <div className="font-bold text-xs">English Source</div>
                <div className="text-[10px] text-slate-400">Original English transcription</div>
              </div>
              {exportMode === 'english' && <Check className="w-4 h-4 text-sky-400" />}
            </button>
          </div>
        </div>

        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono-code">{subtitles.length} cues</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold">
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .SRT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
