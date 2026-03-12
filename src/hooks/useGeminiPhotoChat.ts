import { useCallback, useMemo, useRef, useState } from 'react';
import type { PhotoChatMessage, PhotoChatState } from '@/types';
import type { PhotoChatResponse, PhotoChatTurn, PhotoChatTurnInput } from '@/services/geminiPhotoClient';
import { sendTurn } from '@/services/geminiPhotoClient';

interface PhotoChatClient {
  sendTurn: (input: PhotoChatTurnInput) => Promise<PhotoChatResponse>;
}

interface UseGeminiPhotoChatOptions {
  photoBase64: string;
  client?: PhotoChatClient;
}

let msgCounter = 0;
function nextMessageId(): string {
  msgCounter += 1;
  return `photo-msg-${msgCounter}`;
}

export function useGeminiPhotoChat({ photoBase64, client }: UseGeminiPhotoChatOptions) {
  const [messages, setMessages] = useState<PhotoChatMessage[]>([]);
  const [state, setState] = useState<PhotoChatState>('idle');
  const [error, setError] = useState<string | null>(null);

  const hasAttachedPhotoRef = useRef(false);
  const retryTextRef = useRef<string | null>(null);
  const clientImpl = useMemo<PhotoChatClient>(() => client ?? { sendTurn }, [client]);
  const messagesRef = useRef<PhotoChatMessage[]>([]);

  const submit = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    const includeImage = !hasAttachedPhotoRef.current;
    const history: PhotoChatTurn[] = messagesRef.current
      .filter((message) => message.role === 'user' || message.role === 'ai')
      .map((message) => ({
        role: message.role as PhotoChatTurn['role'],
        text: message.text,
      }));

    const userMessage: PhotoChatMessage = {
      id: nextMessageId(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => {
      const next = [...prev, userMessage];
      messagesRef.current = next;
      return next;
    });

    setState('sending');
    setError(null);

    try {
      const response = await clientImpl.sendTurn({
        text,
        history,
        imageBase64: photoBase64,
        includeImage,
      });

      hasAttachedPhotoRef.current = true;
      retryTextRef.current = null;

      const aiMessage: PhotoChatMessage = {
        id: nextMessageId(),
        role: 'ai',
        text: response.text,
        timestamp: Date.now(),
      };
      setMessages((prev) => {
        const next = [...prev, aiMessage];
        messagesRef.current = next;
        return next;
      });
      setState('idle');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Photo chat request failed.';
      retryTextRef.current = text;
      setError(message);
      setState('error');
      setMessages((prev) => {
        const next = prev.map((messageItem) => (
          messageItem.id === userMessage.id
            ? { ...messageItem, error: message }
            : messageItem
        ));
        messagesRef.current = next;
        return next;
      });
    }
  }, [clientImpl, photoBase64]);

  const sendText = useCallback(async (text: string) => {
    await submit(text);
  }, [submit]);

  const retry = useCallback(async () => {
    const text = retryTextRef.current;
    if (!text) return;
    await submit(text);
  }, [submit]);

  return {
    messages,
    state,
    error,
    sendText,
    retry,
  };
}
