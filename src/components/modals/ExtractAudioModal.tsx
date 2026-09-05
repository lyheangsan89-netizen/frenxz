import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  FileAudio, 
  CheckCircle2, 
  Loader2, 
  Languages, 
  Mic, 
  Volume2, 
  ArrowRight,
  Clock,
  Play,
  Check
} from 'lucide-react';
import { SubtitleItem, VoiceProfile } from '../../types';
import { extractAndTranslateVideo } from '../../utils/videoAudioExtractor';
import { audioEngine } from '../../utils/audioEngine';

interface ExtractAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSource: File | string;
  videoName: string;
  videoDuration: number;
  voiceProfiles: VoiceProfile[];
  onApplyResults: (cues: SubtitleItem[]) => void;
}

export const ExtractAudioModal: React.FC<ExtractAudioModalProps> = ({
  isOpen,
  onClose,
  videoSource,
  videoName,
  videoDuration,
  voiceProfiles,
  onApplyResults
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extractedCues, setExtractedCues] = useState<SubtitleItem[] | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExtraction = async () => {
    setIsRunning(true);
    setError(null);
    setProgress(5);
    setCurrentStep('Initializing audio extractor for ' + videoName);

    try {
      const result = await extractAndTranslateVideo(
        videoSource,
        videoName,
        videoDuration,
        (stageMsg, percent) => {
          setCurrentStep(stageMsg);
          setProgress(percent);
        }
      );

      setExtractedCues(result.cues);
      setProgress(100);
      setCurrentStep('Audio extracted, transcribed & translated into Khmer successfully!');
    } catch (err: any) {
      console.error('Audio extraction & translation failed:', err);
      setError(err.message || 'Failed to extract or translate audio from this video');
    } finally {
      setIsRunning(false);
    }
  };

  const handlePreviewAudio = async (cue: SubtitleItem) => {
    if (playingId === cue.id) return;
    setPlayingId(cue.id);
    const voice = voiceProfiles.find((v) => v.id === cue.voiceProfileId);
    await audioEngine.playVoiceSnippet(
      cue.textKh || cue.textEn,
      voice ? voice.name : 'Khmer Standard',
      voice?.pitch || 1.0,
      voice?.speed || 1.0
    );
    setPlayingId(null);
  };

  const handleApply = () => {
    if (extractedCues && extractedCues.length > 0) {
      onApplyResults(extractedCues);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#161b22] border-b border-[#30363d]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
              <FileAudio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>Extract Audio & Translate to Khmer</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-900/40 text-blue-300 border border-blue-500/40 rounded">
                  ទាញយកសំឡេងពីវីដេអូ
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Extracts the original audio from the video, transcribes speech, and translates into natural Khmer dubbing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
          {/* Target Video Info Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-200 text-sm">{videoName}</div>
                <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Duration: {videoDuration.toFixed(1)}s</span>
                  <span>•</span>
                  <span>Audio: 16kHz PCM (Speech-to-Text)</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] px-2 py-0.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 rounded font-mono">
                Gemini AI Dubbing
              </span>
            </div>
          </div>

          {/* Workflow Explanation Banner */}
          {!extractedCues && !isRunning && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-2">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>ដំណើរការបកប្រែ និងបញ្ចូលសំឡេងស្វ័យប្រវត្តិ (How it works):</span>
              </div>
              <ol className="list-decimal list-inside text-slate-400 text-[11px] space-y-1 pl-1">
                <li><strong className="text-slate-300">ទាញយកសំឡេង (Extract Audio):</strong> ប្រព័ន្ធដកស្រង់សំឡេងចេញពីវីដេអូដោយផ្ទាល់តាមរយៈ Web Audio API។</li>
                <li><strong className="text-slate-300">ស្គាល់សំឡេងនិយាយ (Speech-to-Text):</strong> Gemini AI ស្តាប់ និងចម្លងពាក្យនិយាយទាំងអស់ក្នុងវីដេអូ។</li>
                <li><strong className="text-slate-300">បកប្រែជាភាសាខ្មែរ (Khmer Translation):</strong> បកប្រែជាភាសាខ្មែរយ៉ាងរលូន ដោយផ្គូផ្គងពេលវេលានិងចលនានិយាយ។</li>
                <li><strong className="text-slate-300">បញ្ចូលសំឡេងខ្មែរ (Neural Dubbing):</strong> បញ្ចូលសំឡេងតួអង្គខ្មែរ (តារា, សុភា) ស្របតាមពេលវេលានៃវីដេអូ។</li>
              </ol>
            </div>
          )}

          {/* Progress / Running State */}
          {isRunning && (
            <div className="bg-[#161b22] border border-blue-500/40 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>{currentStep}</span>
                </div>
                <span className="font-mono text-blue-400 text-xs font-bold">{progress}%</span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>Extracting Audio ➔ Speech Analysis ➔ Gemini AI ➔ Khmer Dub</span>
                <span>Please wait...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* Extracted Cues Preview */}
          {extractedCues && extractedCues.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>រកឃើញ {extractedCues.length} ឃ្លា និងបកប្រែជាខ្មែររួចរាល់ (Extracted & Translated):</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {extractedCues.length} Subtitle Cues
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-[#30363d] rounded-lg divide-y divide-[#21262d] bg-[#161b22]">
                {extractedCues.map((cue, i) => (
                  <div key={cue.id || i} className="p-2.5 flex items-start justify-between gap-3 hover:bg-[#21262d]/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mb-1">
                        <span className="text-blue-400 font-bold">#{i + 1}</span>
                        <span>{cue.startTime.toFixed(1)}s - {cue.endTime.toFixed(1)}s</span>
                        <span className="text-slate-500">({(cue.endTime - cue.startTime).toFixed(1)}s)</span>
                      </div>
                      <div className="text-slate-300 text-[11px] mb-0.5">{cue.textEn}</div>
                      <div className="text-emerald-400 font-medium text-xs font-mono-code">{cue.textKh}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePreviewAudio(cue)}
                      className={`p-2 rounded border text-slate-300 transition-colors shrink-0 ${
                        playingId === cue.id
                          ? 'bg-emerald-600 text-white border-emerald-500 animate-pulse'
                          : 'bg-[#21262d] border-[#30363d] hover:bg-slate-700 hover:text-white'
                      }`}
                      title="Preview authentic Khmer voice dub"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          {!extractedCues ? (
            <button
              onClick={handleStartExtraction}
              disabled={isRunning}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>កំពុងទាញយកសំឡេង & បកប្រែ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>ទាញយកសំឡេង និងបកប្រែ (Extract Audio & Dub)</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-200" />
              <span>ដាក់ចូល Timeline វីដេអូ (Apply to Video)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
