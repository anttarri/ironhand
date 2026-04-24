import { useRef, useState, useCallback, useEffect } from 'react';
import { GeminiClient } from '@/services/geminiClient';
import { MAX_CHAT_MESSAGES } from '@/config/constants';
import { haptic } from '@/services/haptics';
import type { SessionState, ChatMessage } from '@/types';

let messageIdCounter = 0;
function nextId(): string {
  return `msg-${++messageIdCounter}`;
}

type ConnectionQuality = 'good' | 'fair' | 'poor' | 'reconnecting';

export function useGeminiLive() {
  const [state, setState] = useState<SessionState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('good');

  const clientRef = useRef<GeminiClient | null>(null);
  const audioCallbackRef = useRef<((base64: string) => void) | null>(null);
  const lastReceiveRef = useRef(Date.now());

  const addMessage = useCallback((role: ChatMessage['role'], text: string) => {
    setMessages((prev) => {
      const msg: ChatMessage = { id: nextId(), role, text, timestamp: Date.now() };
      const next = [...prev, msg];
      if (next.length > MAX_CHAT_MESSAGES) {
        return next.slice(next.length - MAX_CHAT_MESSAGES);
      }
      return next;
    });
  }, []);

  /** Append text to the last message if it has the same role, otherwise create a new one. */
  const appendOrAddMessage = useCallback((role: ChatMessage['role'], text: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        const updated = [...prev];
        updated[updated.length - 1] = { ...last, text: last.text + text };
        return updated;
      }
      const msg: ChatMessage = { id: nextId(), role, text, timestamp: Date.now() };
      const next = [...prev, msg];
      if (next.length > MAX_CHAT_MESSAGES) {
        return next.slice(next.length - MAX_CHAT_MESSAGES);
      }
      return next;
    });
  }, []);

  const connect = useCallback(
    () => {
      // Clean up existing connection
      if (clientRef.current) {
        clientRef.current.disconnect();
      }

      setMessages([]);
      setError(null);

      const client = new GeminiClient({
        onStateChange: (s: SessionState) => {
          setState(s);
          if (s === 'active') {
            lastReceiveRef.current = Date.now();
            addMessage('system', 'Connected. Point your camera at what you are working on and start talking.');
          }
        },
        onAudioData: (base64: string) => {
          lastReceiveRef.current = Date.now();
          audioCallbackRef.current?.(base64);
        },
        onTranscriptUser: (text: string) => {
          lastReceiveRef.current = Date.now();
          if (text.trim()) {
            appendOrAddMessage('user', text);
          }
        },
        onTranscriptModel: (text: string) => {
          lastReceiveRef.current = Date.now();
          if (text.trim()) {
            appendOrAddMessage('ai', text);
          }
        },
        onTextResponse: () => {
          // Text from modelTurn.parts contains internal reasoning, not spoken words.
          // The actual spoken content comes via onTranscriptModel, so we ignore this.
        },
        onTurnComplete: () => {
          // Model finished speaking — could add UI indicator here
        },
        onError: (err: string) => {
          haptic('error');
          setError(err);
          addMessage('system', `Error: ${err}`);
        },
      });

      clientRef.current = client;
      client.connect();
    },
    [addMessage, appendOrAddMessage],
  );

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setState('idle');
  }, []);

  const sendAudio = useCallback((base64Pcm: string) => {
    clientRef.current?.sendAudio(base64Pcm);
  }, []);

  const sendVideo = useCallback((base64Jpeg: string) => {
    clientRef.current?.sendVideo(base64Jpeg);
  }, []);

  const sendText = useCallback(
    (text: string) => {
      clientRef.current?.sendText(text);
      addMessage('user', text);
    },
    [addMessage],
  );

  const setAudioCallback = useCallback((cb: (base64: string) => void) => {
    audioCallbackRef.current = cb;
  }, []);

  useEffect(() => {
    if (state !== 'active') {
      setConnectionQuality('good');
      return;
    }
    const id = setInterval(() => {
      const gap = Date.now() - lastReceiveRef.current;
      if (gap < 3000) setConnectionQuality('good');
      else if (gap < 6000) setConnectionQuality('fair');
      else setConnectionQuality('poor');
    }, 1000);
    return () => clearInterval(id);
  }, [state]);

  return {
    state,
    messages,
    error,
    connect,
    disconnect,
    sendAudio,
    sendVideo,
    sendText,
    setAudioCallback,
    connectionQuality,
  };
}
