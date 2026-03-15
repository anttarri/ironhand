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
      {/* Header */}
      <div className="safe-top px-4 pt-4 pb-3 border-b border-white/[0.06] glass-elevated">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Photo Chat</h1>
            <p className="text-[11px] text-white/35 mt-0.5">Snap, upload, ask</p>
          </div>
          <button
            onClick={onEnd}
            className="px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-sm text-white/60 transition-colors"
          >
            End
          </button>
        </div>
      </div>

      {/* Photo attachment tray */}
      <div className="px-4 pt-3">
        <div className="rounded-2xl glass p-3 space-y-2">
          {/* Photo strip + add button */}
          <div className="flex gap-2 items-center overflow-x-auto pb-1">
            {chat.photos.map((photo, index) => (
              <img
                key={photo.id}
                src={`data:image/jpeg;base64,${photo.base64}`}
                alt={`Attached photo ${index + 1}`}
                className="w-[68px] h-[68px] rounded-2xl object-cover border border-white/10 shrink-0"
              />
            ))}

            {/* Skeleton placeholders while uploading */}
            {isUploading && (
              <>
                <div className="w-[68px] h-[68px] rounded-2xl bg-white/[0.04] shrink-0 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%' }} />
                <div className="w-[68px] h-[68px] rounded-2xl bg-white/[0.04] shrink-0 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%' }} />
              </>
            )}

            {/* Add photo button */}
            {chat.photos.length < MAX_PHOTO_CHAT_PHOTOS && !isUploading && (
              <button
                onClick={() => {
                  setAttachmentError(null);
                  setIsCaptureOpen(true);
                }}
                className="w-[68px] h-[68px] rounded-2xl border-2 border-dashed border-white/12 flex flex-col items-center justify-center gap-1 shrink-0 text-white/25 active:text-white/45 active:border-white/25 transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[9px] font-medium">Add</span>
              </button>
            )}
          </div>

          {/* Counter + upload link */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-white/30">
              {chat.photos.length}/{MAX_PHOTO_CHAT_PHOTOS}
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-amber-400 font-medium active:text-amber-300"
            >
              Upload from gallery
            </button>
          </div>

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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-2">
        {chat.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12 px-6">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/40">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <p className="text-sm text-white/50 mb-1">Add photos and ask a question</p>
            <p className="text-[11px] text-white/25">Up to {MAX_PHOTO_CHAT_PHOTOS} photos per session</p>
          </div>
        )}

        {chat.messages.map((message) => (
          <div
            key={message.id}
            className={`flex animate-fade-slide-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-amber-500/15 text-amber-100 rounded-br-sm'
                  : 'glass text-white/90 rounded-bl-sm'
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

      {/* Error banner */}
      {(attachmentError || chat.error) && (
        <div className="px-4 pb-2">
          <div className="rounded-xl bg-danger/15 border border-danger/30 px-3 py-2 text-xs flex items-center justify-between gap-3">
            <span className="text-white/80">{attachmentError ?? chat.error}</span>
            {chat.error && (
              <button
                onClick={() => {
                  void chat.retry();
                }}
                className="px-2 py-1 rounded-lg bg-danger/30 hover:bg-danger/45 text-white font-medium transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Composer */}
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

      {/* Photo capture overlay */}
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
