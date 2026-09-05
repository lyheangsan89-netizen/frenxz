import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  SkipBack, 
  SkipForward, 
  Subtitles, 
  Zap,
  Upload,
  Film
} from 'lucide-react';
import { SubtitleItem, VoiceProfile } from '../types';
import { formatTimecode } from '../utils/srtHelper';
import { audioEngine } from '../utils/audioEngine';

interface VideoPlayerProps {
  videoUrl: string;
  videoName: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  subtitles: SubtitleItem[];
  voiceProfiles?: VoiceProfile[];
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onVideoEnd: () => void;
  onExtractAudio?: () => void;
  onUploadVideo?: (file: File) => void;
  isOriginalAudioMuted?: boolean;
  originalVolume?: number; // 0 - 100
  onToggleOriginalAudioMuted?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  videoName,
  currentTime,
  duration,
  isPlaying,
  subtitles,
  voiceProfiles = [],
  onPlayPause,
  onSeek,
  onTimeUpdate,
  onDurationChange,
  onVideoEnd,
  onUploadVideo,
  isOriginalAudioMuted: controlledOriginalMuted,
  originalVolume = 0,
  onToggleOriginalAudioMuted
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);

  // Local fallback if not controlled from parent
  const [localOriginalMuted, setLocalOriginalMuted] = useState<boolean>(true);
  const isOriginalMuted = controlledOriginalMuted !== undefined ? controlledOriginalMuted : localOriginalMuted;
  const toggleOriginalMute = () => {
    if (onToggleOriginalAudioMuted) {
      onToggleOriginalAudioMuted();
    } else {
      setLocalOriginalMuted(!localOriginalMuted);
    }
  };

  const [volume, setVolume] = useState<number>(0.95);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSubtitlesOverlay, setShowSubtitlesOverlay] = useState<boolean>(true);
  const [overlayLanguage, setOverlayLanguage] = useState<'khmer' | 'english' | 'dual'>('dual');
  const [subtitleSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Khmer Dubbed Audio state & sync
  const [isDubAudioEnabled, setIsDubAudioEnabled] = useState<boolean>(true);
  const [isSpeakingNow, setIsSpeakingNow] = useState<boolean>(false);
  const activeDubbedCueRef = useRef<string | null>(null);

  // Apply original audio volume or silence to HTML5 video element
  useEffect(() => {
    if (!videoRef.current) return;
    const shouldMute = isMuted || isOriginalMuted || originalVolume === 0;
    videoRef.current.muted = shouldMute;
    if (shouldMute) {
      videoRef.current.volume = 0;
    } else {
      const scaledVol = Math.max(0, Math.min(1, volume * (originalVolume / 100)));
      videoRef.current.volume = scaledVol;
    }
  }, [volume, isMuted, isOriginalMuted, originalVolume]);

  // Auto-ducking for background audio when Khmer voice speaks
  useEffect(() => {
    const unsubscribe = audioEngine.subscribeDucking((isDucking) => {
      setIsSpeakingNow(isDucking);
      if (!videoRef.current) return;
      const shouldMute = isMuted || isOriginalMuted || originalVolume === 0;
      if (shouldMute) {
        videoRef.current.muted = true;
        videoRef.current.volume = 0;
        return;
      }
      const baseVol = Math.max(0, Math.min(1, volume * (originalVolume / 100)));
      if (isDucking) {
        videoRef.current.volume = baseVol * 0.15;
      } else {
        videoRef.current.volume = baseVol;
      }
    });
    return () => unsubscribe();
  }, [volume, isMuted, isOriginalMuted, originalVolume]);

  // When video playback stops, cancel voice synthesis cleanly
  useEffect(() => {
    if (!isPlaying) {
      audioEngine.stopAllAudio(false);
      activeDubbedCueRef.current = null;
      setIsSpeakingNow(false);
    }
  }, [isPlaying]);

  // Synchronized Khmer dubbing playback with Dynamic Time-Stretch
  useEffect(() => {
    if (!isPlaying || !isDubAudioEnabled) return;

    const currentCue = subtitles.find(
      (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime && sub.status !== 'muted'
    );

    if (currentCue) {
      if (activeDubbedCueRef.current !== currentCue.id) {
        activeDubbedCueRef.current = currentCue.id;
        const voice = voiceProfiles.find((v) => v.id === currentCue.voiceProfileId);
        const textToSpeak = currentCue.textKh || currentCue.textEn;
        const targetDuration = Math.max(0.4, currentCue.endTime - currentCue.startTime);

        if (textToSpeak) {
          audioEngine.playVoiceSnippet(
            textToSpeak,
            voice ? voice.name : 'Khmer Standard',
            voice ? voice.pitch : 1.0,
            voice ? voice.speed : 1.0,
            currentCue.id,
            1.0,
            targetDuration
          );
        }
      }
    } else {
      if (activeDubbedCueRef.current !== null) {
        activeDubbedCueRef.current = null;
      }
    }
  }, [currentTime, isPlaying, isDubAudioEnabled, subtitles, voiceProfiles]);

  // Keep HTML5 video tag in sync with React state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else if (!isPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Synchronize seek from outside
  useEffect(() => {
    if (!videoRef.current) return;
    if (Math.abs(videoRef.current.currentTime - currentTime) > 0.3) {
      videoRef.current.currentTime = currentTime;
      audioEngine.stopAllAudio(true);
      activeDubbedCueRef.current = null;
    }
  }, [currentTime]);

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    onTimeUpdate(videoRef.current.currentTime);
  };

  const handleVideoLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (dur && !isNaN(dur) && isFinite(dur)) {
      onDurationChange(dur);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    audioEngine.stopAllAudio(true);
    activeDubbedCueRef.current = null;
    onSeek(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const stepFrame = (frames: number) => {
    const frameDuration = 1 / 30;
    const target = Math.max(0, Math.min(duration, currentTime + (frames * frameDuration)));
    audioEngine.stopAllAudio(true);
    activeDubbedCueRef.current = null;
    onSeek(target);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      if (videoRef.current) videoRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Drag and Drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onUploadVideo) {
      onUploadVideo(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadVideo) {
      onUploadVideo(file);
    }
    // reset input so same file can be selected again
    e.target.value = '';
  };

  const activeSubtitle = subtitles.find(
    (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
  );

  return (
    <div 
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col bg-[#070b13] border rounded-xl overflow-hidden shadow-2xl select-none transition-all ${
        isDragOver ? 'border-[#38bdf8] ring-2 ring-[#38bdf8]/40' : 'border-[#162235]'
      }`}
    >
      {/* Hidden file input for direct video upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="video/*,.mp4,.webm,.mkv,.mov,.avi"
        className="hidden"
      />

      {/* Top Monitor Info Bar */}
      <div className="h-8 px-3 bg-[#0a101b] border-b border-[#162235] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shrink-0" />
          <span className="font-bold text-white text-[11px] font-mono truncate max-w-[130px]">
            {videoName}
          </span>
          <span className="text-[10px] text-[#94a3b8] px-1.5 py-0.2 rounded bg-[#0e1726] border border-[#1e293b] font-mono shrink-0">
            {duration > 0 ? `${duration.toFixed(1)}s` : '30.0s'}
          </span>
        </div>

        {/* Action Controls & Dub Pill */}
        <div className="flex items-center gap-1.5">
          {/* Change / Upload Video Trigger */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0e1726] hover:bg-[#162235] border border-[#1e293b] text-[#38bdf8] text-[10px] font-semibold transition-colors cursor-pointer"
            title="Upload / Change Video (MP4, WebM, MOV)"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">Change</span>
          </button>

          {/* Active Speaking Indicator */}
          <div 
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all ${
              isSpeakingNow 
                ? 'bg-[#0c2240] border-[#2563eb] text-[#38bdf8]' 
                : 'bg-[#0a101b] border-[#162235] text-[#64748b]'
            }`}
          >
            <span className="flex items-end gap-0.5 h-2.5">
              <span className={`w-0.5 rounded-full bg-[#38bdf8] transition-all ${isSpeakingNow ? 'h-2.5 animate-pulse' : 'h-1'}`} />
              <span className={`w-0.5 rounded-full bg-[#38bdf8] transition-all ${isSpeakingNow ? 'h-2 animate-bounce' : 'h-1'}`} />
              <span className={`w-0.5 rounded-full bg-[#38bdf8] transition-all ${isSpeakingNow ? 'h-3 animate-pulse' : 'h-1'}`} />
            </span>
            <span className="text-[9.5px] font-semibold">
              {isSpeakingNow ? 'Voice Active' : 'Dub Idle'}
            </span>
          </div>

          <button
            onClick={() => setIsDubAudioEnabled(!isDubAudioEnabled)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold transition-colors cursor-pointer ${
              isDubAudioEnabled
                ? 'bg-[#0f233d] border-[#1d4ed8] text-[#60a5fa]'
                : 'bg-[#0e1726] border-[#1e293b] text-[#64748b]'
            }`}
          >
            <Zap className={`w-3 h-3 ${isDubAudioEnabled ? 'text-[#38bdf8]' : 'text-[#64748b]'}`} />
            <span>{isDubAudioEnabled ? 'DUB: ON' : 'DUB: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Video Screen */}
      <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden group">
        <video
          ref={videoRef}
          src={videoUrl}
          onTimeUpdate={handleVideoTimeUpdate}
          onLoadedMetadata={handleVideoLoadedMetadata}
          onEnded={onVideoEnd}
          className="w-full h-full object-contain"
          playsInline
        />

        {/* Drag & Drop Visual Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-[#070b13]/90 backdrop-blur-sm border-2 border-dashed border-[#38bdf8] flex flex-col items-center justify-center gap-2 z-40">
            <Upload className="w-10 h-10 text-[#38bdf8] animate-bounce" />
            <p className="text-sm font-bold text-white">Drop video file here to load</p>
            <p className="text-xs text-[#94a3b8]">Supports MP4, WebM, MOV, MKV</p>
          </div>
        )}

        {/* Overlay Language Controls */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-[#070b13]/90 backdrop-blur-md rounded-md p-1 border border-[#162235] flex items-center gap-1 shadow-lg">
            <button
              onClick={() => setShowSubtitlesOverlay(!showSubtitlesOverlay)}
              className={`p-1 rounded text-[10px] font-bold cursor-pointer ${
                showSubtitlesOverlay ? 'bg-[#2563eb] text-white' : 'text-[#64748b] hover:text-white'
              }`}
              title="Toggle Captions"
            >
              <Subtitles className="w-3 h-3" />
            </button>

            <button
              onClick={() => {
                const modes: Array<'khmer' | 'english' | 'dual'> = ['dual', 'khmer', 'english'];
                const next = modes[(modes.indexOf(overlayLanguage) + 1) % modes.length];
                setOverlayLanguage(next);
              }}
              className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#0e1726] text-[#38bdf8] border border-[#1e293b] hover:text-white cursor-pointer"
            >
              {overlayLanguage === 'dual' ? 'ខ្មែរ+EN' : overlayLanguage === 'khmer' ? 'ខ្មែរ' : 'EN'}
            </button>
          </div>
        </div>

        {/* Subtitle Overlay */}
        {showSubtitlesOverlay && activeSubtitle && (
          <div className="absolute bottom-4 left-4 right-4 flex flex-col items-center justify-center text-center pointer-events-none z-30">
            <div className="max-w-[92%] bg-black/85 px-4 py-1.5 rounded-lg border border-white/10 backdrop-blur-md shadow-2xl flex flex-col items-center gap-0.5">
              {(overlayLanguage === 'khmer' || overlayLanguage === 'dual') && activeSubtitle.textKh && (
                <p 
                  className={`font-semibold text-[#facc15] tracking-wide drop-shadow-md leading-relaxed ${
                    subtitleSize === 'sm' ? 'text-xs' : subtitleSize === 'lg' ? 'text-base' : 'text-sm'
                  }`}
                >
                  {activeSubtitle.textKh}
                </p>
              )}

              {(overlayLanguage === 'english' || overlayLanguage === 'dual') && activeSubtitle.textEn && (
                <p 
                  className={`font-medium text-[#cbd5e1] drop-shadow-xs italic ${
                    subtitleSize === 'sm' ? 'text-[9.5px]' : subtitleSize === 'lg' ? 'text-xs' : 'text-[11px]'
                  }`}
                >
                  {activeSubtitle.textEn}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Center Play Button Overlay */}
        {!isPlaying && !isDragOver && (
          <div 
            onClick={onPlayPause}
            className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#2563eb]/90 hover:bg-[#2563eb] text-white flex items-center justify-center shadow-xl shadow-blue-900/50 hover:scale-105 transition-all border border-blue-400/40">
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Media Controller Bar */}
      <div className="p-2.5 bg-[#0a101b] border-t border-[#162235] flex flex-col gap-2">
        {/* Scrubber Progress Bar */}
        <div 
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          className="relative h-2 bg-[#070b13] rounded-full cursor-pointer group flex items-center overflow-hidden border border-[#162235]"
        >
          {/* Subtitle Cue Markers */}
          {duration > 0 && subtitles.map((sub) => {
            const leftPercent = (sub.startTime / duration) * 100;
            const widthPercent = ((sub.endTime - sub.startTime) / duration) * 100;
            return (
              <div
                key={sub.id}
                className="absolute top-0 bottom-0 bg-[#3b82f6]/40 border-x border-[#38bdf8]/60 pointer-events-none"
                style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
              />
            );
          })}

          <div 
            className="h-full bg-gradient-to-r from-[#2563eb] to-[#38bdf8] relative"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border-2 border-[#2563eb] transform translate-x-1/2" />
          </div>
        </div>

        {/* Media Buttons Row */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Left Buttons: Play/Pause, Step Frames */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPlayPause}
              className="w-7 h-7 rounded-md bg-[#2563eb] hover:bg-[#3b82f6] text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />}
            </button>

            <button
              onClick={() => onSeek(0)}
              className="p-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#0e1726] transition-colors cursor-pointer"
              title="Return to start"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              onClick={() => stepFrame(-1)}
              className="p-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#0e1726] transition-colors cursor-pointer"
              title="-1 Frame"
            >
              <SkipBack className="w-3 h-3" />
            </button>

            <button
              onClick={() => stepFrame(1)}
              className="p-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#0e1726] transition-colors cursor-pointer"
              title="+1 Frame"
            >
              <SkipForward className="w-3 h-3" />
            </button>

            <button
              onClick={cyclePlaybackRate}
              className="px-1.5 py-0.5 rounded bg-[#0e1726] text-[#38bdf8] text-[9.5px] font-mono font-bold border border-[#1e293b] ml-1 cursor-pointer"
              title="Change Speed"
            >
              {playbackRate}x
            </button>

            <span className="font-mono text-[10px] text-[#93c5fd] font-bold ml-1.5">
              {formatTimecode(currentTime, false)}
            </span>
          </div>

          {/* Right Buttons: Original Audio Toggle, Volume & Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Org Audio Toggle */}
            <button
              onClick={toggleOriginalMute}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer ${
                isOriginalMuted
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                  : 'bg-[#0e1726] border-[#1e293b] text-[#34d399]'
              }`}
              title="Original Audio Track Mute"
            >
              {isOriginalMuted ? <VolumeX className="w-2.5 h-2.5 text-rose-400" /> : <Volume2 className="w-2.5 h-2.5 text-[#34d399]" />}
              <span>{isOriginalMuted ? 'ORG: MUTED' : 'ORG: ON'}</span>
            </button>

            {/* Dub Volume */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="text-[#94a3b8] hover:text-white cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3 h-3 text-rose-400" />
                ) : (
                  <Volume2 className="w-3 h-3 text-[#38bdf8]" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-12 h-1 bg-[#0e1726] rounded appearance-none cursor-pointer accent-[#2563eb]"
              />
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#0e1726] cursor-pointer"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
