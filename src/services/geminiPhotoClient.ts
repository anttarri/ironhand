import { GEMINI_PHOTO_MODEL } from '@/config/constants';
import { SYSTEM_PROMPT } from '@/config/systemPrompt';

export interface PhotoChatTurn {
  role: 'user' | 'ai';
  text: string;
}

export interface PhotoChatTurnInput {
  text: string;
  history: PhotoChatTurn[];
  imageBase64?: string;
  includeImage: boolean;
}

export interface PhotoChatResponse {
  text: string;
}

export class PhotoChatRequestError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'PhotoChatRequestError';
    this.retryable = retryable;
  }
}

function mapRole(role: PhotoChatTurn['role']): 'user' | 'model' {
  return role === 'ai' ? 'model' : 'user';
}

async function getApiKey(): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/session');
  } catch {
    throw new PhotoChatRequestError('Network error while initializing photo chat.', true);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({} as { error?: string }));
    const message = body.error ?? `Unable to initialize photo chat (HTTP ${res.status}).`;
    throw new PhotoChatRequestError(message, true);
  }

  const data = await res.json() as { key?: string };
  if (!data.key) {
    throw new PhotoChatRequestError('Missing API key for photo chat.', false);
  }
  return data.key;
}

function normalizeModelText(body: unknown): string {
  const candidates = (body as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })?.candidates;
  if (!candidates?.length) {
    throw new PhotoChatRequestError('No response from photo chat model.', true);
  }

  const parts = candidates[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new PhotoChatRequestError('Photo chat model returned an empty response.', true);
  }

  return text;
}

export async function sendTurn(input: PhotoChatTurnInput): Promise<PhotoChatResponse> {
  const apiKey = await getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_PHOTO_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const userParts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];
  if (input.includeImage && input.imageBase64) {
    userParts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: input.imageBase64,
      },
    });
  }
  userParts.push({ text: input.text });

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      ...input.history
        .filter((turn) => turn.text.trim().length > 0)
        .map((turn) => ({
          role: mapRole(turn.role),
          parts: [{ text: turn.text }],
        })),
      {
        role: 'user',
        parts: userParts,
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new PhotoChatRequestError('Network error while sending photo chat turn.', true);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } })?.error?.message
      ?? `Photo chat request failed (HTTP ${res.status}).`;
    const retryable = res.status >= 500 || res.status === 429;
    throw new PhotoChatRequestError(message, retryable);
  }

  return {
    text: normalizeModelText(data),
  };
}
