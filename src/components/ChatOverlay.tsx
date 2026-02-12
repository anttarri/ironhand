import { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '@/types';

interface ChatOverlayProps {
  messages: ChatMessage[];
}

export function ChatOverlay({ messages }: ChatOverlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (scrollRef.current && !collapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, collapsed]);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute bottom-28 right-4 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-white/80 text-sm active:bg-black/80"
      >
        Chat ({messages.length})
      </button>
    );
  }

  return (
    <div className="absolute bottom-28 left-0 right-0 max-h-[40vh] flex flex-col">
      {/* Collapse handle */}
      <button
        onClick={() => setCollapsed(true)}
        className="mx-auto mb-1 bg-black/40 rounded-full px-3 py-0.5 text-white/50 text-xs active:bg-black/60"
      >
        Hide chat
      </button>

      <div
        ref={scrollRef}
        className="chat-scroll overflow-y-auto px-3 pb-2 space-y-2"
      >
        {messages.length === 0 && (
          <div className="text-center text-white/40 text-sm py-4">
            Point your camera at the panel and start talking...
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-500/20 text-amber-100 rounded-br-sm'
                  : msg.role === 'ai'
                    ? 'bg-black/50 backdrop-blur-sm text-white/90 rounded-bl-sm'
                    : 'bg-white/10 text-white/60 text-xs rounded-lg'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
