import { SubtitleItem } from '../types';

export function formatTimecode(seconds: number, includeHours: boolean = true): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z: number = 2) => n.toString().padStart(z, '0');

  if (includeHours) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(millis, 3)}`;
  }
  return `${pad(mins)}:${pad(secs)}.${pad(millis, 3)}`;
}

export function parseTimecodeToSeconds(timecode: string): number {
  try {
    const clean = timecode.trim().replace(',', '.');
    const parts = clean.split(':');
    if (parts.length === 3) {
      const hrs = parseFloat(parts[0]);
      const mins = parseFloat(parts[1]);
      const secs = parseFloat(parts[2]);
      return hrs * 3600 + mins * 60 + secs;
    } else if (parts.length === 2) {
      const mins = parseFloat(parts[0]);
      const secs = parseFloat(parts[1]);
      return mins * 60 + secs;
    }
    return parseFloat(clean) || 0;
  } catch {
    return 0;
  }
}

export function formatSrtTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z: number = 2) => n.toString().padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(millis, 3)}`;
}

export function generateSrtContent(
  subtitles: SubtitleItem[],
  mode: 'khmer' | 'english' | 'dual' = 'khmer'
): string {
  return subtitles
    .map((sub, idx) => {
      const start = formatSrtTime(sub.startTime);
      const end = formatSrtTime(sub.endTime);
      let text = sub.textKh;
      if (mode === 'english') {
        text = sub.textEn;
      } else if (mode === 'dual') {
        text = `${sub.textKh}\n${sub.textEn}`;
      }

      return `${idx + 1}\n${start} --> ${end}\n${text}\n`;
    })
    .join('\n');
}

export function parseSrtContent(content: string): SubtitleItem[] {
  const blocks = content.trim().replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const items: SubtitleItem[] = [];

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;

    // Detect timestamp line (usually line 1 if line 0 is index, or line 0)
    let timeLineIdx = 0;
    if (lines[0].match(/^\d+$/) && lines[1] && lines[1].includes('-->')) {
      timeLineIdx = 1;
    } else if (!lines[0].includes('-->') && lines[1]?.includes('-->')) {
      timeLineIdx = 1;
    }

    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes('-->')) return;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const startTime = parseTimecodeToSeconds(startStr);
    const endTime = parseTimecodeToSeconds(endStr);

    const textLines = lines.slice(timeLineIdx + 1);
    const rawText = textLines.join(' ');

    // Simple heuristic: if contains Khmer characters unicode range (\u1780-\u17FF)
    const hasKhmer = /[\u1780-\u17FF]/.test(rawText);

    items.push({
      id: `imported-${Date.now()}-${idx}`,
      index: idx + 1,
      startTime,
      endTime,
      textEn: hasKhmer ? '' : rawText,
      textKh: hasKhmer ? rawText : '',
      voiceProfileId: 'voice-sophea',
      status: 'ready',
      confidence: 0.95,
      audioDuration: Math.max(1, endTime - startTime)
    });
  });

  return items;
}

export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
