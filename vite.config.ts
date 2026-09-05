import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { handleTtsRequest } from './server/ttsHandler';
import { handleTranscribeVideo, handleTranslateCues } from './server/aiTranscribeHandler';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'dii-studio-backend',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && (req.url.startsWith('/api/tts') || req.url.startsWith('/api/tts?'))) {
              await handleTtsRequest(req, res);
              return;
            }
            if (req.url && req.url.startsWith('/api/ai/transcribe-video')) {
              await handleTranscribeVideo(req, res);
              return;
            }
            if (req.url && req.url.startsWith('/api/ai/translate')) {
              await handleTranslateCues(req, res);
              return;
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && (req.url.startsWith('/api/tts') || req.url.startsWith('/api/tts?'))) {
              await handleTtsRequest(req, res);
              return;
            }
            if (req.url && req.url.startsWith('/api/ai/transcribe-video')) {
              await handleTranscribeVideo(req, res);
              return;
            }
            if (req.url && req.url.startsWith('/api/ai/translate')) {
              await handleTranslateCues(req, res);
              return;
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
