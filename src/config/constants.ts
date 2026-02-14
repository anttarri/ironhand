export const GEMINI_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

export const GEMINI_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';

// Timeout (ms) for WebSocket to reach 'active' state
export const CONNECTION_TIMEOUT_MS = 15_000;

export const GEMINI_VOICE = 'Charon';

// Audio
export const INPUT_SAMPLE_RATE = 16000;
export const OUTPUT_SAMPLE_RATE = 24000;

// Camera
export const CAMERA_FRAME_INTERVAL_MS = 1000;
export const CAMERA_FRAME_QUALITY = 0.7;
export const CAMERA_FRAME_MAX_WIDTH = 768;

// UI
export const MAX_CHAT_MESSAGES = 100;
