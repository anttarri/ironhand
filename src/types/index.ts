export type SessionState = 'idle' | 'connecting' | 'active' | 'error';

export type AppScreen =
  | 'start'
  | 'live-session'
  | 'photo-capture'
  | 'photo-chat'
  | 'history'
  | 'call-detail';

export interface CapturedPhoto {
  base64: string;
  createdAt: number;
}

export interface PhotoChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  timestamp: number;
  error?: string;
}

export type PhotoChatState = 'idle' | 'sending' | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  timestamp: number;
}

export type CallLogStatus = 'active' | 'completed' | 'interrupted';

export interface CallLogMessage {
  id: string;
  role: ChatMessage['role'];
  text: string;
  timestamp: number;
}

export interface CallLog {
  id: string;
  title: string;
  titleUpdatedAt?: number;
  startedAt: number;
  endedAt?: number;
  durationSec?: number;
  status: CallLogStatus;
  messages: CallLogMessage[];
  messageCount: number;
  preview: string;
  updatedAt: number;
}

export interface CallLogMeta {
  id: string;
  title: string;
  titleUpdatedAt?: number;
  startedAt: number;
  endedAt?: number;
  durationSec?: number;
  status: CallLogStatus;
  messageCount: number;
  preview: string;
  updatedAt: number;
}

export interface GeminiSetupMessage {
  setup: {
    model: string;
    generationConfig: {
      responseModalities: string[];
      speechConfig?: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: string };
        };
      };
      inputAudioTranscription?: Record<string, never>;
      outputAudioTranscription?: Record<string, never>;
    };
    systemInstruction?: {
      parts: Array<{ text: string }>;
    };
  };
}

export interface GeminiRealtimeInput {
  realtimeInput: {
    mediaChunks: Array<{
      mimeType?: string;
      data: string;
    }>;
  };
}

export interface GeminiClientContent {
  clientContent: {
    turns: Array<{
      role: 'user';
      parts: Array<{ text: string }>;
    }>;
    turnComplete: boolean;
  };
}

export interface GeminiServerMessage {
  setupComplete?: Record<string, unknown>;
  serverContent?: {
    modelTurn?: {
      parts: Array<{
        text?: string;
        inlineData?: { mimeType: string; data: string };
      }>;
    };
    turnComplete?: boolean;
    inputTranscription?: { text: string };
    outputTranscription?: { text: string };
  };
  toolCall?: unknown;
  toolCallCancellation?: unknown;
}

export interface GeminiClientCallbacks {
  onStateChange: (state: SessionState) => void;
  onAudioData: (base64Pcm: string) => void;
  onTranscriptUser: (text: string) => void;
  onTranscriptModel: (text: string) => void;
  onTextResponse: (text: string) => void;
  onTurnComplete: () => void;
  onError: (error: string) => void;
}
