import type { IncomingMessage, ServerResponse } from 'http';

// Memory cache for synthesized Khmer audio buffers
const ttsCache = new Map<string, Buffer>();

function prepareTextForTts(text: string): string {
  let cleaned = text.trim();
  // Ensure the sentence has natural ending punctuation so TTS completes the last syllable smoothly
  if (!cleaned.endsWith('។') && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    cleaned += ' ។';
  }
  return cleaned;
}

function splitTextIntoChunks(text: string, maxLength: number = 190): string[] {
  if (text.length <= maxLength) return [text];
  const chunks: string[] = [];
  // Split on Khmer sentence boundary punctuation (។, ៗ, ៖, \n) or standard punctuation
  const parts = text.split(/(?<=[។\n\r\?\!\.])/g);
  let currentChunk = '';

  for (const part of parts) {
    if ((currentChunk + part).length <= maxLength) {
      currentChunk += part;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      if (part.length > maxLength) {
        // Break segment by character limit safely
        for (let i = 0; i < part.length; i += maxLength) {
          chunks.push(part.slice(i, i + maxLength));
        }
        currentChunk = '';
      } else {
        currentChunk = part;
      }
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks.length > 0 ? chunks : [text];
}

export async function handleTtsRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const host = req.headers.host || 'localhost:3000';
    const parsedUrl = new URL(req.url || '', `http://${host}`);
    const rawText = (parsedUrl.searchParams.get('text') || '').trim();
    const lang = (parsedUrl.searchParams.get('lang') || 'km').trim();

    if (!rawText) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify({ error: 'Missing text parameter' }));
      return;
    }

    const text = prepareTextForTts(rawText);
    const cacheKey = `${lang}:${text}`;
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey)!;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', cached.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(cached);
      return;
    }

    const chunks = splitTextIntoChunks(text, 190);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      const queryText = chunk.trim();
      if (!queryText) continue;
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(queryText)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
      const response = await fetch(ttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`TTS upstream service error: HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      audioBuffers.push(Buffer.from(arrayBuffer));
    }

    const finalBuffer = Buffer.concat(audioBuffers);
    ttsCache.set(cacheKey, finalBuffer);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', finalBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(finalBuffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown TTS error';
    console.error('[TTS API Error]', message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ error: message }));
  }
}
