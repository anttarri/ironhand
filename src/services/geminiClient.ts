import {
  GEMINI_WS_URL,
  GEMINI_MODEL,
  GEMINI_VOICE,
} from '@/config/constants';
import { SYSTEM_PROMPT } from '@/config/systemPrompt';
import type {
  SessionState,
  GeminiServerMessage,
  GeminiClientCallbacks,
} from '@/types';

export class GeminiClient {
  private ws: WebSocket | null = null;
  private callbacks: GeminiClientCallbacks;
  private aborted = false;

  constructor(callbacks: GeminiClientCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(apiKey: string): Promise<void> {
    this.aborted = false;
    this.callbacks.onStateChange('connecting');

    // Pre-flight: validate API key with a lightweight REST call
    try {
      const modelId = GEMINI_MODEL.replace('models/', '');
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}?key=${apiKey}`,
      );
      if (this.aborted) return;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          (body as { error?: { message?: string } })?.error?.message ||
          `HTTP ${res.status}`;
        this.callbacks.onError(`API key validation failed: ${msg}`);
        this.callbacks.onStateChange('error');
        return;
      }
    } catch {
      if (this.aborted) return;
      this.callbacks.onError('Network error — cannot reach Google API');
      this.callbacks.onStateChange('error');
      return;
    }

    if (this.aborted) return;

    // Key is valid, open WebSocket
    const url = `${GEMINI_WS_URL}?key=${apiKey}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.sendSetup();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data: GeminiServerMessage = JSON.parse(event.data);
        this.handleMessage(data);
      } catch {
        // Non-JSON message, ignore
      }
    };

    this.ws.onerror = () => {
      this.callbacks.onError('WebSocket connection error — check your API key');
      this.callbacks.onStateChange('error');
    };

    this.ws.onclose = (event: CloseEvent) => {
      if (event.code !== 1000) {
        const reason = event.reason
          || (event.code === 1006
            ? 'Connection failed — check your API key and try again'
            : `code ${event.code}`);
        this.callbacks.onError(`Connection closed: ${reason}`);
        this.callbacks.onStateChange('error');
      } else {
        this.callbacks.onStateChange('idle');
      }
    };
  }

  private sendSetup(): void {
    const setup = {
      setup: {
        model: GEMINI_MODEL,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: GEMINI_VOICE },
            },
          },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
      },
    };
    this.send(setup);
  }

  private handleMessage(msg: GeminiServerMessage): void {
    if (msg.setupComplete !== undefined) {
      this.callbacks.onStateChange('active');
      return;
    }

    const content = msg.serverContent;
    if (!content) return;

    // Handle input (user) transcription
    if (content.inputTranscription?.text) {
      this.callbacks.onTranscriptUser(content.inputTranscription.text);
    }

    // Handle output (model) transcription
    if (content.outputTranscription?.text) {
      this.callbacks.onTranscriptModel(content.outputTranscription.text);
    }

    // Handle model turn parts
    if (content.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          this.callbacks.onAudioData(part.inlineData.data);
        }
        if (part.text) {
          this.callbacks.onTextResponse(part.text);
        }
      }
    }

    // Handle turn complete
    if (content.turnComplete) {
      this.callbacks.onTurnComplete();
    }
  }

  sendAudio(base64Pcm: string): void {
    this.send({
      realtimeInput: {
        mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: base64Pcm }],
      },
    });
  }

  sendVideo(base64Jpeg: string): void {
    this.send({
      realtimeInput: {
        mediaChunks: [{ mimeType: 'image/jpeg', data: base64Jpeg }],
      },
    });
  }

  sendText(text: string): void {
    this.send({
      clientContent: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true,
      },
    });
  }

  disconnect(): void {
    this.aborted = true;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState !== WebSocket.CLOSED && this.ws.readyState !== WebSocket.CLOSING) {
        this.ws.close(1000);
      }
      this.ws = null;
    }
    this.callbacks.onStateChange('idle');
  }

  private send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
