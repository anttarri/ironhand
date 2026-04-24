import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { ChatMessage } from '@/types';

interface ChatOverlayProps {
  messages: ChatMessage[];
  bottomInsetClass?: string;
}

const msgSpring = { type: 'spring' as const, stiffness: 380, damping: 28 };

export function ChatOverlay({
  messages,
  bottomInsetClass = 'bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))]',
}: ChatOverlayProps) {
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
        className={`absolute right-4 glass-elevated rounded-full px-4 py-2 text-white/80 text-sm active:bg-white/[0.1] font-medium ${bottomInsetClass}`}
      >
        Chat ({messages.length})
      </button>
    );
  }

  return (
    <div
      data-testid="chat-overlay"
      className={`absolute left-0 right-0 max-h-[40vh] flex flex-col ${bottomInsetClass}`}
    >
      {/* Collapse handle */}
      <button
        onClick={() => setCollapsed(true)}
        className="mx-auto mb-1 glass rounded-full px-3 py-0.5 text-white/50 text-xs active:bg-white/[0.1]"
      >
        Hide chat
      </button>

      <div
        ref={scrollRef}
        className="chat-scroll overflow-y-auto px-3 pb-2 space-y-2"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center py-6 px-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/25">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            </div>
            <p className="text-white/40 text-sm">Point your camera at what you&apos;re working on and start talking...</p>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={msgSpring}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-500/15 text-amber-100 rounded-br-sm'
                  : msg.role === 'ai'
                    ? 'glass text-white/90 rounded-bl-sm'
                    : 'bg-white/10 text-white/60 text-xs rounded-lg'
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
