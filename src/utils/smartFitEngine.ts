import { SubtitleItem } from '../types';

export interface SmartFitResult {
  naturalDuration: number; // in seconds
  slotDuration: number; // in seconds
  idealSpeedRate: number; // e.g., 1.05x
  status: 'perfect' | 'good' | 'fast' | 'overflow' | 'relaxed';
  fitPercentage: number; // 0 - 100%
  statusColor: string;
  statusLabelKh: string;
  statusLabelEn: string;
  syllableCount: number;
  recommendedEndTime: number;
}

/**
 * Intelligent syllable & phoneme counter for Khmer script and English words
 */
export function calculateKhmerSyllables(text: string): number {
  if (!text || !text.trim()) return 0;

  // Check if text has Khmer Unicode characters (U+1780 to U+17FF)
  const isKhmer = /[\u1780-\u17FF]/.test(text);

  if (isKhmer) {
    // Khmer consonants: \u1780-\u17A2
    // Independent vowels: \u17A3-\u17B3
    // Coeng (subscript marker): \u17D2
    // Dependent vowels: \u17B6-\u17C5
    // Diacritics: \u17C6-\u17D3
    
    // Count base consonants that are NOT preceded by Coeng (\u17D2)
    let syllables = 0;
    const chars = Array.from(text);
    for (let i = 0; i < chars.length; i++) {
      const code = chars[i].charCodeAt(0);
      const prevCode = i > 0 ? chars[i - 1].charCodeAt(0) : 0;

      // Base consonant (U+1780 to U+17A2) not in subscript
      if (code >= 0x1780 && code <= 0x17A2 && prevCode !== 0x17D2) {
        syllables++;
      } else if (code >= 0x17A3 && code <= 0x17B3) {
        // Independent vowels count as syllables
        syllables++;
      }
    }
    // Return at least 1 if text is present
    return Math.max(1, syllables);
  } else {
    // English syllable estimation: count vowel groups
    const clean = text.toLowerCase().replace(/[^a-z]/g, ' ').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    let count = 0;
    for (const word of words) {
      const vowelMatches = word.match(/[aeiouy]{1,2}/g);
      count += vowelMatches ? Math.max(1, vowelMatches.length) : 1;
    }
    return Math.max(1, count);
  }
}

/**
 * Accurately estimates unstretched natural spoken duration in seconds
 */
export function estimateSpokenDuration(text: string, lang: 'km' | 'en' = 'km'): number {
  if (!text || !text.trim()) return 0.5;

  const isKhmer = /[\u1780-\u17FF]/.test(text) || lang === 'km';
  const syllables = calculateKhmerSyllables(text);

  if (isKhmer) {
    // Standard Khmer spoken pace: approx 3.6 to 4.2 syllables per second
    // + 0.25s natural acoustic breath/pause buffer
    const baseDuration = (syllables / 3.85) + 0.22;
    return Math.max(0.6, Math.round(baseDuration * 100) / 100);
  } else {
    // Standard English spoken pace: approx 4.0 syllables per second
    const baseDuration = (syllables / 4.0) + 0.2;
    return Math.max(0.5, Math.round(baseDuration * 100) / 100);
  }
}

/**
 * Calculates real-time Smart Fit metrics for a given subtitle cue
 */
export function calculateSmartFit(
  text: string,
  startTime: number,
  endTime: number,
  customAudioDuration?: number
): SmartFitResult {
  const slotDuration = Math.max(0.2, endTime - startTime);
  const naturalDuration = customAudioDuration && customAudioDuration > 0.3
    ? customAudioDuration
    : estimateSpokenDuration(text);

  const syllableCount = calculateKhmerSyllables(text);
  const rawRatio = naturalDuration / slotDuration;
  
  // Clamped ideal playback rate
  const idealSpeedRate = Math.max(0.75, Math.min(1.85, Math.round(rawRatio * 100) / 100));

  let status: SmartFitResult['status'] = 'perfect';
  let statusColor = '#34d399'; // Emerald / green
  let statusLabelKh = 'ស៊ីសង្វាក់ល្អឥតខ្ចោះ';
  let statusLabelEn = 'Perfect Sync';
  let fitPercentage = 100;

  if (rawRatio >= 0.92 && rawRatio <= 1.08) {
    status = 'perfect';
    fitPercentage = 100;
    statusColor = '#34d399';
    statusLabelKh = 'ស៊ីសង្វាក់ 100%';
    statusLabelEn = 'Perfect (1.0x)';
  } else if (rawRatio > 1.08 && rawRatio <= 1.28) {
    status = 'good';
    fitPercentage = Math.round(100 - ((rawRatio - 1.08) * 60));
    statusColor = '#38bdf8'; // Sky blue
    statusLabelKh = 'សម្រួលល្បឿនបន្តិច';
    statusLabelEn = `Fast (${idealSpeedRate}x)`;
  } else if (rawRatio > 1.28 && rawRatio <= 1.55) {
    status = 'fast';
    fitPercentage = Math.round(100 - ((rawRatio - 1.08) * 75));
    statusColor = '#fbbf24'; // Amber
    statusLabelKh = 'អត្ថបទវែង ត្រូវការល្បឿនលឿន';
    statusLabelEn = `Tight (${idealSpeedRate}x)`;
  } else if (rawRatio > 1.55) {
    status = 'overflow';
    fitPercentage = Math.max(30, Math.round(100 - ((rawRatio - 1.08) * 85)));
    statusColor = '#f87171'; // Rose red
    statusLabelKh = 'លើសកំណត់ (Overflow)';
    statusLabelEn = `Overflow (${idealSpeedRate}x)`;
  } else {
    // rawRatio < 0.92
    status = 'relaxed';
    fitPercentage = Math.round(rawRatio * 100);
    statusColor = '#a78bfa'; // Purple
    statusLabelKh = 'ចន្លោះទូលាយ';
    statusLabelEn = `Relaxed (${idealSpeedRate}x)`;
  }

  const recommendedEndTime = Math.round((startTime + naturalDuration) * 100) / 100;

  return {
    naturalDuration,
    slotDuration,
    idealSpeedRate,
    status,
    fitPercentage: Math.max(20, Math.min(100, fitPercentage)),
    statusColor,
    statusLabelKh,
    statusLabelEn,
    syllableCount,
    recommendedEndTime
  };
}

/**
 * Smart Timeline Optimizer:
 * Automatically fits every subtitle segment to perfectly match voice duration
 * while eliminating collisions, overlapping audio, and awkward cuts.
 */
export function autoFitAllSubtitles(
  subtitles: SubtitleItem[],
  videoDuration: number = 60,
  mode: 'adaptive' | 'snap_duration' = 'adaptive'
): SubtitleItem[] {
  if (!subtitles || subtitles.length === 0) return [];

  // Sort by startTime
  const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
  const result: SubtitleItem[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const text = current.textKh || current.textEn;
    const naturalDur = estimateSpokenDuration(text);
    const nextCue = sorted[i + 1];

    let newStart = Math.max(0, current.startTime);
    let newEnd = current.endTime;

    if (mode === 'snap_duration') {
      // Direct boundary alignment with 0.15s trailing silence for natural breathing
      const targetEnd = newStart + naturalDur + 0.15;
      const maxAllowedEnd = nextCue ? Math.max(newStart + 0.5, nextCue.startTime - 0.08) : Math.min(videoDuration, targetEnd);
      newEnd = Math.min(targetEnd, maxAllowedEnd);
    } else {
      // Adaptive mode: if slot is too short, stretch end time if gap exists
      const currentSlot = current.endTime - current.startTime;
      if (naturalDur > currentSlot) {
        // We need more time
        const availableSpace = nextCue ? nextCue.startTime - 0.05 : videoDuration;
        const idealEnd = newStart + naturalDur + 0.1;
        newEnd = Math.min(idealEnd, availableSpace);
      } else if (currentSlot > naturalDur * 1.8 && currentSlot > 4.0) {
        // Slot is unnecessarily huge, gently trim end to avoid trailing subtitle ghost
        newEnd = newStart + (naturalDur * 1.35);
      }
    }

    // Round to 2 decimal places
    newStart = Math.round(newStart * 100) / 100;
    newEnd = Math.max(newStart + 0.5, Math.round(newEnd * 100) / 100);

    result.push({
      ...current,
      index: i + 1,
      startTime: newStart,
      endTime: newEnd,
      audioDuration: naturalDur,
      status: 'dubbed'
    });
  }

  return result;
}

/**
 * Optimizes a single subtitle cue to its ideal audio duration
 */
export function autoFitSingleSubtitle(
  sub: SubtitleItem,
  nextSubStartTime?: number,
  videoDuration: number = 120
): SubtitleItem {
  const text = sub.textKh || sub.textEn;
  const naturalDur = estimateSpokenDuration(text);
  const targetEnd = sub.startTime + naturalDur + 0.15;
  const maxEnd = nextSubStartTime ? Math.max(sub.startTime + 0.5, nextSubStartTime - 0.08) : videoDuration;
  const newEnd = Math.round(Math.min(targetEnd, maxEnd) * 100) / 100;

  return {
    ...sub,
    endTime: Math.max(sub.startTime + 0.5, newEnd),
    audioDuration: naturalDur,
    status: 'dubbed'
  };
}
