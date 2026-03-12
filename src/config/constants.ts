export const GEMINI_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

export const GEMINI_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';
export const GEMINI_PHOTO_MODEL = 'gemini-2.5-flash';

// Timeout (ms) for WebSocket to reach 'active' state
export const CONNECTION_TIMEOUT_MS = 15_000;

export const GEMINI_VOICE = 'Enceladus';

// Audio
export const INPUT_SAMPLE_RATE = 16000;
export const OUTPUT_SAMPLE_RATE = 24000;

// Camera
export const CAMERA_FRAME_INTERVAL_MS = 1000;
export const CAMERA_FRAME_QUALITY = 0.7;
export const CAMERA_FRAME_MAX_WIDTH = 768;

// UI
export const MAX_CHAT_MESSAGES = 100;

// Local call logs
export const MAX_CALL_LOGS = 100;
export const CALL_LOG_SAVE_DEBOUNCE_MS = 1000;
export const CALL_LOG_MAX_TITLE_LENGTH = 80;
