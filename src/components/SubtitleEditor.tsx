import React, { useState } from 'react';
import { 
  Play, 
  Pause,
  Plus, 
  Trash2, 
  Sparkles, 
  ChevronDown,
  Zap,
  Search,
  CheckSquare,
  Square,
  ArrowRight,
  Gauge,
  Sliders,
  Check
} from 'lucide-react';
import { SubtitleItem, VoiceProfile } from '../types';
import { formatTimecode, parseTimecodeToSeconds } from '../utils/srtHelper';
import { audioEngine } from '../utils/audioEngine';
import { calculateSmartFit, autoFitSingleSubtitle, calculateKhmerSyllables } from '../utils/smartFitEngine';

interface SubtitleEditorProps {
  subtitles: SubtitleItem[];
  voiceProfiles: VoiceProfile[];
  currentTime: number;
  videoDuration?: number;
  onSeek: (time: number) => void;
  onUpdateSubtitle: (id: string, updates: Partial<SubtitleItem>) => void;
  onAddSubtitle: (afterIndex?: number) => void;
  onDeleteSubtitle: (id: string) => void;
  onDuplicateSubtitle: (id: string) => void;
  onOpenTranslate: () => void;
  onBatchGenerateAudio: () => void;
  onExtractAudio?: () => void;
  onAutoFillCoverage?: () => void;
  isGeneratingAudio: boolean;
  audioProgress: number;
  autoScroll: boolean;
  setAutoScroll: (val: boolean) => void;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  subtitles,
  voiceProfiles,
  currentTime,
  videoDuration = 35.0,
  onSeek,
  onUpdateSubtitle,
  onAddSubtitle,
  onDeleteSubtitle,
  onOpenTranslate,
  onBatchGenerateAudio,
  onExtractAudio,
  isGeneratingAudio,
  audioProgress
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [bulkVoiceProfile, setBulkVoiceProfile] = useState<string>('voice-dara');
  const [timingMode, setTimingMode] = useState<'Tight' | 'Natural'>('Tight');
  const [targetLanguage, setTargetLanguage] = useState<'Khmer' | 'English'>('Khmer');

  // Filter subtitles based on search query
  const filteredSubtitles = subtitles.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sub.textKh.toLowerCase().includes(q) ||
      sub.textEn.toLowerCase().includes(q) ||
      sub.index.toString().includes(q)
    );
  });

  const allSelected = subtitles.length > 0 && subtitles.every((s) => s.status !== 'muted');

  const handleToggleSelectAll = () => {
    const nextStatus = allSelected ? 'muted' : 'dubbed';
    subtitles.forEach((s) => {
      onUpdateSubtitle(s.id, { status: nextStatus });
    });
  };

  const handleToggleActive = (sub: SubtitleItem) => {
    const nextStatus = sub.status === 'muted' ? 'dubbed' : 'muted';
    onUpdateSubtitle(sub.id, { status: nextStatus });
  };

  const handlePlayVoice = async (sub: SubtitleItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playingId === sub.id) {
      audioEngine.stopAllAudio(true);
      setPlayingId(null);
      return;
    }

    setPlayingId(sub.id);
    const voice = voiceProfiles.find((v) => v.id === sub.voiceProfileId);
    const textToSpeak = sub.textKh || sub.textEn;
    const targetDuration = Math.max(0.4, sub.endTime - sub.startTime);

    const spokenDuration = await audioEngine.playVoiceSnippet(
      textToSpeak,
      voice ? voice.name : 'Khmer Standard',
      voice ? voice.pitch : 1.0,
      voice ? voice.speed : 1.0,
      sub.id,
      1.0,
      targetDuration
    );

    if (spokenDuration > 0 && Math.abs(spokenDuration - (sub.audioDuration || 0)) > 0.3) {
      onUpdateSubtitle(sub.id, { audioDuration: parseFloat(spokenDuration.toFixed(2)) });
    }
    setPlayingId(null);
  };

  // Smart Fit a single row
  const handleSmartFitRow = (sub: SubtitleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = subtitles.findIndex((s) => s.id === sub.id);
    const nextSub = subtitles[currentIndex + 1];
    const fitted = autoFitSingleSubtitle(sub, nextSub ? nextSub.startTime : undefined, videoDuration);
    onUpdateSubtitle(sub.id, {
      endTime: fitted.endTime,
      audioDuration: fitted.audioDuration,
      status: 'dubbed'
    });
  };

  const handleApplyBulkVoice = (voiceId: string) => {
    setBulkVoiceProfile(voiceId);
    subtitles.forEach((s) => {
      onUpdateSubtitle(s.id, { voiceProfileId: voiceId });
    });
  };

  // Quick single-cue AI translate or regenerate
  const handleQuickAiGenerate = async (sub: SubtitleItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!sub.textKh && sub.textEn) {
      try {
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [{ id: sub.id, textEn: sub.textEn }] })
        });
        const data = await res.json();
        if (data.success && data.translations?.[0]?.textKh) {
          onUpdateSubtitle(sub.id, { 
            textKh: data.translations[0].textKh,
            status: 'dubbed'
          });
          audioEngine.preFetchAudio(data.translations[0].textKh, 'km');
        }
      } catch (err) {
        console.warn('AI generate failed:', err);
      }
    } else if (sub.textKh) {
      handlePlayVoice(sub);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#070b13] text-[#c9d1d9] overflow-hidden select-none border border-[#162235]">
      {/* Top Header Controls Bar matching Frenxz Studio UI style */}
      <div className="px-4 py-2.5 bg-[#0a101b] border-b border-[#162235] flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Section: Title & Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-white text-xs tracking-wider uppercase flex items-center gap-1.5">
              <span>SUBTITLE DATA</span>
            </h2>
            <span className="text-[11px] font-bold text-[#38bdf8] bg-[#0c2240] px-2.5 py-0.5 rounded-full border border-[#1e4976]">
              {subtitles.length} Segments
            </span>
          </div>

          {/* Timing Mode Pill (Tight / Natural) */}
          <button
            onClick={() => setTimingMode(timingMode === 'Tight' ? 'Natural' : 'Tight')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
              timingMode === 'Tight'
                ? 'bg-[#0f233d] border-[#1d4ed8] text-[#60a5fa] shadow-xs'
                : 'bg-[#111827] border-[#374151] text-[#9ca3af]'
            }`}
            title="កំណត់ទំហំពេលវេលា (Tight / Natural Timing)"
          >
            <Zap className="w-3 h-3 text-[#38bdf8]" />
            <span>{timingMode}</span>
          </button>

          {/* Add Segment Button */}
          <button
            onClick={() => onAddSubtitle()}
            className="w-6 h-6 rounded-md bg-[#2563eb] hover:bg-[#3b82f6] text-white flex items-center justify-center font-bold text-sm shadow-md transition-colors cursor-pointer"
            title="បន្ថែមបន្ទាត់សន្ទនាថ្មី (+ Add Segment)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* AI Auto Detect Dropdown */}
          <div className="relative">
            <button
              onClick={onExtractAudio}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#1e153b] hover:bg-[#281c4e] border border-[#6d28d9] text-[#c084fc] rounded-md text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
              title="ស្វែងរកនិងបកប្រែសំឡេងដោយស្វ័យប្រវត្តិ"
            >
              <Sparkles className="w-3 h-3 text-[#c084fc]" />
              <span>Auto Detect</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
          </div>

          <ArrowRight className="w-3 h-3 text-[#4b5563]" />

          {/* Target Language Dropdown */}
          <div className="relative">
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value as 'Khmer' | 'English')}
              className="bg-[#0e1726] border border-[#1e293b] text-[#38bdf8] text-[11px] font-bold rounded-md px-2.5 py-1 appearance-none pr-6 cursor-pointer focus:outline-none focus:border-[#38bdf8]"
            >
              <option value="Khmer">Khmer</option>
              <option value="English">English</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#64748b] absolute right-1.5 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Right Section: Bulk Voice Profile & Search */}
        <div className="flex items-center gap-3">
          {/* Global Voice Profile Selector */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-[#94a3b8] font-medium hidden md:inline">Voice Profile:</span>
            <div className="relative">
              <select
                value={bulkVoiceProfile}
                onChange={(e) => handleApplyBulkVoice(e.target.value)}
                className="bg-[#0e1726] border border-[#1e293b] text-white text-[11px] font-semibold rounded-md px-2.5 py-1 appearance-none pr-6 cursor-pointer focus:outline-none focus:border-[#38bdf8]"
              >
                {voiceProfiles.map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#0b101b] text-white">
                    {v.gender === 'female' ? 'ស្រី' : 'ប្រុស'} ({v.name.split(' ')[0]})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#64748b] absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-[#64748b] absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="ស្វែងរក..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-24 sm:w-32 bg-[#0e1726] border border-[#1e293b] rounded-md pl-7 pr-2 py-0.5 text-[11px] text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
            />
          </div>
        </div>
      </div>

      {/* Main Subtitle Data Table Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          {/* Table Header Row */}
          <thead className="sticky top-0 z-20 bg-[#080d16] border-b border-[#162235] text-[10.5px] font-mono font-bold tracking-wider text-[#94a3b8] uppercase select-none">
            <tr>
              <th className="py-2.5 px-3 w-14 text-center">
                <button
                  onClick={handleToggleSelectAll}
                  className="flex items-center justify-center gap-1.5 hover:text-white cursor-pointer"
                  title="ជ្រើសរើសទាំងអស់"
                >
                  {allSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#38bdf8]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[#475569]" />
                  )}
                  <span>ACTIVE</span>
                </button>
              </th>
              <th className="py-2.5 px-3 w-20">START</th>
              <th className="py-2.5 px-3 w-20">END</th>
              <th className="py-2.5 px-4 min-w-[240px]">KHMER SUBTITLE</th>
              <th className="py-2.5 px-3 w-32">VOICE PROFILE</th>
              <th className="py-2.5 px-3 w-32 text-center">SMART FIT</th>
              <th className="py-2.5 px-3 w-28 text-center">ACTIONS</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#0f172a]/80 font-sans">
            {filteredSubtitles.map((sub) => {
              const isActivePlaying = currentTime >= sub.startTime && currentTime <= sub.endTime;
              const isPlayingVoice = playingId === sub.id;
              const isMuted = sub.status === 'muted';
              const text = sub.textKh || sub.textEn;
              const syllables = calculateKhmerSyllables(text);
              const smartFit = calculateSmartFit(text, sub.startTime, sub.endTime, sub.audioDuration);

              return (
                <tr
                  key={sub.id}
                  id={`sub-row-${sub.id}`}
                  onClick={() => onSeek(sub.startTime)}
                  className={`group transition-all duration-100 cursor-pointer ${
                    isActivePlaying
                      ? 'bg-[#0c203b] border-y border-[#2563eb]/70 shadow-[0_0_15px_rgba(37,99,235,0.25)] ring-1 ring-[#38bdf8]/40'
                      : isMuted
                      ? 'bg-[#070b13]/60 opacity-50 hover:bg-[#0c1424]'
                      : 'bg-[#070b13] hover:bg-[#0a1424]'
                  }`}
                >
                  {/* Column 1: Active Checkbox & Index */}
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(sub);
                        }}
                        className="text-[#38bdf8] hover:scale-110 transition-transform cursor-pointer"
                        title={isMuted ? 'បើកដំណើរការបន្ទាត់នេះ' : 'បិទដំណើរការបន្ទាត់នេះ'}
                      >
                        {!isMuted ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#38bdf8]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-[#475569]" />
                        )}
                      </button>
                      <span className="font-mono text-[11px] font-bold text-[#64748b] group-hover:text-white">
                        {sub.index}
                      </span>
                    </div>
                  </td>

                  {/* Column 2: START Timecode */}
                  <td className="py-2 px-3 font-mono text-[11px] text-[#93c5fd] font-medium whitespace-nowrap">
                    <input
                      type="text"
                      value={formatTimecode(sub.startTime, false)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const parsed = parseTimecodeToSeconds(e.target.value);
                        if (parsed !== null && parsed >= 0) {
                          onUpdateSubtitle(sub.id, { startTime: parsed });
                        }
                      }}
                      className="bg-transparent border-none text-[#93c5fd] focus:outline-none cursor-pointer w-18 font-mono"
                    />
                  </td>

                  {/* Column 3: END Timecode */}
                  <td className="py-2 px-3 font-mono text-[11px] text-[#93c5fd] font-medium whitespace-nowrap">
                    <input
                      type="text"
                      value={formatTimecode(sub.endTime, false)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const parsed = parseTimecodeToSeconds(e.target.value);
                        if (parsed !== null && parsed > sub.startTime) {
                          onUpdateSubtitle(sub.id, { endTime: parsed });
                        }
                      }}
                      className="bg-transparent border-none text-[#93c5fd] focus:outline-none cursor-pointer w-18 font-mono"
                    />
                  </td>

                  {/* Column 4: KHMER SUB Text (Inline Editable) */}
                  <td className="py-2 px-4">
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="text"
                        value={sub.textKh}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateSubtitle(sub.id, { textKh: e.target.value })}
                        placeholder="វាយបញ្ចូលអត្ថបទខ្មែរ..."
                        className="w-full bg-transparent border-none text-[#60a5fa] group-hover:text-[#93c5fd] focus:text-white font-medium text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#38bdf8] rounded px-1 -mx-1"
                      />
                      <div className="flex items-center gap-2 text-[9.5px]">
                        {sub.textEn && (
                          <span className="text-[#64748b] italic truncate max-w-sm">
                            {sub.textEn}
                          </span>
                        )}
                        <span className="text-[#475569] font-mono shrink-0 ml-auto">
                          {syllables} syllables • {smartFit.naturalDuration}s
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 5: VOICE PROFILE Selector */}
                  <td className="py-2 px-3">
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={sub.voiceProfileId}
                        onChange={(e) => onUpdateSubtitle(sub.id, { voiceProfileId: e.target.value })}
                        className="w-full bg-[#0a101b] border border-[#162235] text-white text-[11px] font-semibold rounded px-2 py-1 appearance-none pr-5 cursor-pointer focus:outline-none focus:border-[#38bdf8]"
                      >
                        {voiceProfiles.map((v) => (
                          <option key={v.id} value={v.id} className="bg-[#0b101b] text-white">
                            {v.gender === 'female' ? 'ស្រី' : 'ប្រុស'} ({v.name.split(' ')[0]})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-[#64748b] absolute right-1.5 top-2 pointer-events-none" />
                    </div>
                  </td>

                  {/* Column 6: SMART FIT Badge & Rate */}
                  <td className="py-2 px-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold border"
                        style={{
                          backgroundColor: smartFit.status === 'overflow' ? '#450a0a' : smartFit.status === 'fast' ? '#451a03' : '#042f2e',
                          borderColor: smartFit.statusColor,
                          color: smartFit.statusColor
                        }}
                        title={smartFit.statusLabelKh}
                      >
                        {smartFit.idealSpeedRate}x • {smartFit.statusLabelEn}
                      </span>
                      <span className="text-[9px] text-[#64748b] font-mono">
                        {(sub.endTime - sub.startTime).toFixed(1)}s slot
                      </span>
                    </div>
                  </td>

                  {/* Column 7: ACTION Buttons (Play Audio, Smart Fit Snapper, AI Trigger, Delete) */}
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Play Preview Audio */}
                      <button
                        onClick={(e) => handlePlayVoice(sub, e)}
                        className={`w-6 h-6 rounded flex items-center justify-center border transition-all cursor-pointer ${
                          isPlayingVoice
                            ? 'bg-[#2563eb] text-white border-[#38bdf8] shadow-[0_0_8px_#38bdf8]'
                            : 'bg-[#0b121e] hover:bg-[#1e293b] text-[#38bdf8] border-[#1e293b]'
                        }`}
                        title="ស្តាប់សំឡេង (Play Voice)"
                      >
                        <Play className={`w-3 h-3 fill-current ${isPlayingVoice ? 'animate-pulse' : ''}`} />
                      </button>

                      {/* Smart Fit Single Button */}
                      <button
                        onClick={(e) => handleSmartFitRow(sub, e)}
                        className="w-6 h-6 rounded flex items-center justify-center bg-[#0b121e] hover:bg-[#064e3b] text-[#34d399] border border-[#1e293b] transition-all cursor-pointer"
                        title="កែសម្រួល Duration ឱ្យត្រូវនឹងសំឡេង (Smart Fit Cue Duration)"
                      >
                        <Gauge className="w-3 h-3" />
                      </button>

                      {/* Lightning / AI Trigger */}
                      <button
                        onClick={(e) => handleQuickAiGenerate(sub, e)}
                        className="w-6 h-6 rounded flex items-center justify-center bg-[#0b121e] hover:bg-[#1e293b] text-[#f59e0b] hover:text-[#fbbf24] border border-[#1e293b] transition-all cursor-pointer"
                        title="AI Dub & Translate"
                      >
                        <Zap className="w-3 h-3" />
                      </button>

                      {/* Delete Cue */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSubtitle(sub.id);
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center bg-[#0b121e] hover:bg-rose-950/80 text-[#64748b] hover:text-rose-400 border border-[#1e293b] transition-all cursor-pointer"
                        title="លុបបន្ទាត់នេះ (Delete Segment)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
