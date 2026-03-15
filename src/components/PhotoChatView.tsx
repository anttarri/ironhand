import { useRef, useState } from 'react';
import { MAX_PHOTO_CHAT_PHOTOS, PHOTO_CHAT_LIMIT_MESSAGE } from '@/config/constants';
import type { PhotoChatTurnInput, PhotoChatResponse } from '@/services/geminiPhotoClient';
import { useGeminiPhotoChat } from '@/hooks/useGeminiPhotoChat';
import { loadCapturedPhotosFromFiles } from '@/services/photoUtils';
import { PhotoCaptureView } from './PhotoCaptureView';
import { TextComposer } from './TextComposer';

interface PhotoChatViewProps {
  onEnd: () => void;
  client?: {
    sendTurn: (input: PhotoChatTurnInput) => Promise<PhotoChatResponse>;
  };
}

export function PhotoChatView({ onEnd, client }: PhotoChatViewProps) {
  const chat = useGeminiPhotoChat({ client });
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddPhotos = (count: { added: number; rejected: number }) => {
    if (count.rejected > 0) {
      window.alert(PHOTO_CHAT_LIMIT_MESSAGE);
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-charcoal text-white">
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

      <div className="px-4 pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAttachmentError(null);
              setIsCaptureOpen(true);
            }}
            className="px-3 py-2 rounded-lg bg-amber-500 text-charcoal font-semibold text-sm"
          >
            Take Photo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors"
          >
            Upload Photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            aria-label="Upload Photos"
            onChange={async (event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = '';

              if (files.length === 0) return;

              setAttachmentError(null);
              setIsUploading(true);

              try {
                const photos = await loadCapturedPhotosFromFiles(files);
                handleAddPhotos(chat.addPhotos(photos));
              } catch (err) {
                setAttachmentError(err instanceof Error ? err.message : 'Unable to process uploaded photos.');
              } finally {
                setIsUploading(false);
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-white/60">
          <span>{chat.photos.length} / {MAX_PHOTO_CHAT_PHOTOS} photos attached</span>
          {isUploading && <span>Uploading...</span>}
        </div>

        {chat.photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {chat.photos.map((photo, index) => (
              <img
                key={photo.id}
                src={`data:image/jpeg;base64,${photo.base64}`}
                alt={`Attached photo ${index + 1}`}
                className="w-20 h-20 rounded-xl object-cover border border-white/20 shrink-0"
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-2">
        {chat.messages.length === 0 && (
          <p className="text-sm text-white/45">
            Add up to 5 photos and ask a question to start the chat.
          </p>
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

      {(attachmentError || chat.error) && (
        <div className="px-4 pb-2">
          <div className="rounded-lg bg-danger/20 border border-danger/40 px-3 py-2 text-xs flex items-center justify-between gap-3">
            <span>{attachmentError ?? chat.error}</span>
            {chat.error && (
              <button
                onClick={() => {
                  void chat.retry();
                }}
                className="px-2 py-1 rounded bg-danger/35 hover:bg-danger/50 text-white"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      <div className="safe-bottom px-4 pb-4">
        <TextComposer
          placeholder="Ask about your photos"
          submitLabel="Send"
          isBusy={chat.state === 'sending'}
          onSubmit={async (text) => {
            await chat.sendText(text);
          }}
        />
      </div>

      {isCaptureOpen && (
        <div className="absolute inset-0 z-20">
          <PhotoCaptureView
            onBack={() => setIsCaptureOpen(false)}
            onCapture={(photo) => {
              setAttachmentError(null);
              handleAddPhotos(chat.addPhotos([photo]));
              setIsCaptureOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
