import { useCallback, useMemo, useRef, useState } from 'react';
import { MAX_PHOTO_CHAT_PHOTOS } from '@/config/constants';
import type { CapturedPhoto, PhotoChatMessage, PhotoChatState } from '@/types';
import type { PhotoChatResponse, PhotoChatTurn, PhotoChatTurnInput } from '@/services/geminiPhotoClient';
import { sendTurn } from '@/services/geminiPhotoClient';

interface PhotoChatClient {
  sendTurn: (input: PhotoChatTurnInput) => Promise<PhotoChatResponse>;
}

interface UseGeminiPhotoChatOptions {
  initialPhotos?: CapturedPhoto[];
  client?: PhotoChatClient;
}

let msgCounter = 0;
function nextMessageId(): string {
  msgCounter += 1;
  return `photo-msg-${msgCounter}`;
}

export function useGeminiPhotoChat({ initialPhotos = [], client }: UseGeminiPhotoChatOptions) {
  const [contextPhotos, setContextPhotos] = useState<CapturedPhoto[]>(initialPhotos);
  const [queuedPhotos, setQueuedPhotos] = useState<CapturedPhoto[]>([]);
  const [messages, setMessages] = useState<PhotoChatMessage[]>([]);
  const [state, setState] = useState<PhotoChatState>('idle');
  const [error, setError] = useState<string | null>(null);

  const retryTextRef = useRef<string | null>(null);
  const retryMessageIdRef = useRef<string | null>(null);
  const clientImpl = useMemo<PhotoChatClient>(() => client ?? { sendTurn }, [client]);
  const contextPhotosRef = useRef<CapturedPhoto[]>(initialPhotos);
  const queuedPhotosRef = useRef<CapturedPhoto[]>([]);
  const messagesRef = useRef<PhotoChatMessage[]>([]);

  const queuePhotos = useCallback((incomingPhotos: CapturedPhoto[]) => {
    const usedSlots = contextPhotosRef.current.length + queuedPhotosRef.current.length;
    const availableSlots = Math.max(0, MAX_PHOTO_CHAT_PHOTOS - usedSlots);
    const accepted = incomingPhotos.slice(0, availableSlots);
    const rejected = incomingPhotos.length - accepted.length;

    if (accepted.length > 0) {
      const next = [...queuedPhotosRef.current, ...accepted];
      queuedPhotosRef.current = next;
      setQueuedPhotos(next);
    }

    return {
      added: accepted.length,
      rejected,
    };
  }, []);

  const removeQueuedPhoto = useCallback((photoId: string) => {
    const next = queuedPhotosRef.current.filter((photo) => photo.id !== photoId);
    queuedPhotosRef.current = next;
    setQueuedPhotos(next);
  }, []);

  const submit = useCallback(async (rawText: string, reuseMessageId?: string) => {
    const text = rawText.trim();
    if (!text) return;

    const history: PhotoChatTurn[] = messagesRef.current
      .filter((message) => (
        (message.role === 'user' || message.role === 'ai')
        && !message.error
        && message.id !== reuseMessageId
      ))
      .map((message) => ({
        role: message.role as PhotoChatTurn['role'],
        text: message.text,
      }));

    const userMessageId = reuseMessageId ?? nextMessageId();
    if (reuseMessageId) {
      setMessages((prev) => {
        const next = prev.map((messageItem) => (
          messageItem.id === reuseMessageId
            ? { ...messageItem, error: undefined }
            : messageItem
        ));
        messagesRef.current = next;
        return next;
      });
    } else {
      const pendingPhotos = queuedPhotosRef.current;
      queuedPhotosRef.current = [];
      setQueuedPhotos([]);
      if (pendingPhotos.length > 0) {
        const nextContextPhotos = [...contextPhotosRef.current, ...pendingPhotos];
        contextPhotosRef.current = nextContextPhotos;
        setContextPhotos(nextContextPhotos);
      }
      const userMessage: PhotoChatMessage = {
        id: userMessageId,
        role: 'user',
        text,
        photos: pendingPhotos.length > 0 ? pendingPhotos : undefined,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const next = [...prev, userMessage];
        messagesRef.current = next;
        return next;
      });
    }

    setState('sending');
    setError(null);

    try {
      const response = await clientImpl.sendTurn({
        text,
        history,
        images: contextPhotosRef.current.map((photo) => photo.base64),
      });

      retryTextRef.current = null;
      retryMessageIdRef.current = null;

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
      retryMessageIdRef.current = userMessageId;
      setError(message);
      setState('error');
      setMessages((prev) => {
        const next = prev.map((messageItem) => (
          messageItem.id === userMessageId
            ? { ...messageItem, error: message }
            : messageItem
        ));
        messagesRef.current = next;
        return next;
      });
    }
  }, [clientImpl]);

  const sendText = useCallback(async (text: string) => {
    await submit(text);
  }, [submit]);

  const retry = useCallback(async () => {
    const text = retryTextRef.current;
    if (!text) return;
    await submit(text, retryMessageIdRef.current ?? undefined);
  }, [submit]);

  return {
    contextPhotos,
    queuedPhotos,
    messages,
    state,
    error,
    queuePhotos,
    removeQueuedPhoto,
    sendText,
    retry,
  };
}
