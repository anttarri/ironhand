import type { PhotoChatTurnInput, PhotoChatResponse } from '@/services/geminiPhotoClient';
import { useGeminiPhotoChat } from '@/hooks/useGeminiPhotoChat';
import { TextComposer } from './TextComposer';
import type { CapturedPhoto } from '@/types';

interface PhotoChatViewProps {
  photo: CapturedPhoto;
  onEnd: () => void;
  client?: {
    sendTurn: (input: PhotoChatTurnInput) => Promise<PhotoChatResponse>;
  };
}

export function PhotoChatView({ photo, onEnd, client }: PhotoChatViewProps) {
  const chat = useGeminiPhotoChat({
    photoBase64: photo.base64,
    client,
  });

  return (
    <div className="h-full flex flex-col bg-charcoal text-white">
      <div className="safe-top px-4 pt-4 pb-3 border-b border-white/10 bg-black/15">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-sm font-semibold tracking-wide">Photo Chat</h1>
          <button
            onClick={onEnd}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <img
          src={`data:image/jpeg;base64,${photo.base64}`}
          alt="Captured photo"
          className="w-24 h-24 rounded-xl object-cover border border-white/20"
        />
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-2">
        {chat.messages.length === 0 && (
          <p className="text-sm text-white/45">Ask about this photo to start the chat.</p>
        )}

        {chat.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-amber-500/20 text-amber-100 rounded-br-sm'
                  : 'bg-black/45 text-white/90 rounded-bl-sm'
              }`}
            >
              {message.text}
              {message.error && (
                <p className="text-xs text-danger mt-1">{message.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {chat.error && (
        <div className="px-4 pb-2">
          <div className="rounded-lg bg-danger/20 border border-danger/40 px-3 py-2 text-xs flex items-center justify-between gap-3">
            <span>{chat.error}</span>
            <button
              onClick={() => {
                void chat.retry();
              }}
              className="px-2 py-1 rounded bg-danger/35 hover:bg-danger/50 text-white"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="safe-bottom px-4 pb-4">
        <TextComposer
          placeholder="Ask about this photo"
          submitLabel="Send"
          isBusy={chat.state === 'sending'}
          onSubmit={async (text) => {
            await chat.sendText(text);
          }}
        />
      </div>
    </div>
  );
}
