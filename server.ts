import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { handleTtsRequest } from './server/ttsHandler';
import { handleTranscribeVideo, handleTranslateCues } from './server/aiTranscribeHandler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '60mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'DII STUDIO DUB' });
  });

  // High-fidelity Khmer & multilingual TTS endpoint
  app.get('/api/tts', async (req, res) => {
    await handleTtsRequest(req, res);
  });

  // AI Video Transcription & Khmer Translation endpoint
  app.post('/api/ai/transcribe-video', async (req, res) => {
    await handleTranscribeVideo(req, res);
  });

  // AI Subtitle translation endpoint
  app.post('/api/ai/translate', async (req, res) => {
    await handleTranslateCues(req, res);
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DII STUDIO DUB server running on port ${PORT}`);
  });
}

startServer();
