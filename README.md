# Ironhand

Real-time AI electrician assistant. Streams live camera video and two-way voice to Google's Gemini Multimodal Live API for hands-free electrical guidance.

## Setup

```bash
npm install

# Add your Gemini API key
cp .env.example .env.local
# Edit .env.local: GEMINI_KEY=your_key_here
```

Get an API key at [Google AI Studio](https://aistudio.google.com/apikey).

## Development

```bash
npm run dev
```

To run with the Vercel function layer (`/api/*`) locally:

```bash
npm run dev:vercel
```

## Testing on Mobile

Camera access requires HTTPS or localhost. To test on your phone over the local network:

```bash
npm run dev -- --host
```

Then open `https://<your-ip>:5173` on your phone. You may need HTTPS — install `@vitejs/plugin-basic-ssl`:

```bash
npm i -D @vitejs/plugin-basic-ssl
```

Then add it to `vite.config.ts`:

```ts
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
  // ...
});
```

## Production Build

```bash
npm run build
npm run preview
```

The `dist/` folder can be deployed to Vercel, Netlify, or any static host.

## Architecture

- **React + TypeScript + Vite** — no backend server
- **Raw WebSocket** connection to Gemini Multimodal Live API
- **Camera**: 1 FPS JPEG frames streamed to Gemini
- **Audio**: 16kHz PCM mic input, 24kHz PCM playback from Gemini
- **Transcription**: Built-in input/output audio transcription for chat overlay
