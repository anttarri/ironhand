export type SessionState = 'idle' | 'connecting' | 'active' | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  timestamp: number;
}

export interface SavedSession {
  id: string;
  startedAt: number;
  endedAt: number;
  messages: ChatMessage[];
  messageCount: number;
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
