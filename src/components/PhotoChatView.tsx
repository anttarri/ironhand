import { useRef, useState } from 'react';
import { MAX_PHOTO_CHAT_PHOTOS, PHOTO_CHAT_LIMIT_MESSAGE } from '@/config/constants';
import type { CapturedPhoto } from '@/types';
import type { PhotoChatTurnInput, PhotoChatResponse } from '@/services/geminiPhotoClient';
import { useGeminiPhotoChat } from '@/hooks/useGeminiPhotoChat';
import { loadCapturedPhotosFromFiles } from '@/services/photoUtils';
import { PhotoCaptureView } from './PhotoCaptureView';
import { TextComposer } from './TextComposer';
import { AnalysisOverlay } from './AnalysisOverlay';

const SUGGESTED_PROMPTS = [
  'Find code violations',
  'Identify this part',
  'Run a panel inspection',
] as const;

interface PhotoChatViewProps {
  onEnd: () => void;
  client?: {
    sendTurn: (input: PhotoChatTurnInput) => Promise<PhotoChatResponse>;
  };
}

function formatContextCount(count: number): string {
  return `${count} photo${count === 1 ? '' : 's'} in context`;
}

export function PhotoChatView({ onEnd, client }: PhotoChatViewProps) {
  const chat = useGeminiPhotoChat({ client });
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<CapturedPhoto | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [draftText, setDraftText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddPhotos = (count: { added: number; rejected: number }) => {
    if (count.rejected > 0) {
      window.alert(PHOTO_CHAT_LIMIT_MESSAGE);
    }
  };
  const totalPhotoCount = chat.contextPhotos.length + chat.queuedPhotos.length;
  const isTrueEmptyState = chat.messages.length === 0 && totalPhotoCount === 0;

  const openPhotoCapture = () => {
    setAttachmentError(null);
    setIsCaptureOpen(true);
  };

  const openGalleryPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative h-full flex flex-col bg-charcoal text-white">
      <div className="safe-top px-6 pt-6 pb-3 border-b border-white/[0.06] glass-elevated">
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

      <div className="relative flex-1 overflow-y-auto chat-scroll px-6 py-4 space-y-3">
        <AnalysisOverlay isActive={chat.state === 'sending'} />

        {isTrueEmptyState && (
          <div className="flex min-h-full items-center justify-center px-2 py-8">
            <div className="flex w-full max-w-sm flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/40">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <p className="mb-1 text-sm text-white/50">Add photos and ask a question</p>
              <p className="text-[11px] text-white/25">Up to {MAX_PHOTO_CHAT_PHOTOS} photos per session</p>
              <div className="mt-6 grid w-full grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={openPhotoCapture}
                  className="min-h-[72px] rounded-2xl bg-white/[0.09] px-4 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/[0.14]"
                >
                  Add Photo
                </button>
                <button
                  type="button"
                  onClick={openGalleryPicker}
                  className="min-h-[72px] rounded-2xl bg-white/[0.06] px-4 py-3 text-sm font-medium text-amber-300 transition-colors hover:bg-white/[0.1]"
                >
                  Upload from gallery
                </button>
              </div>
              <p className="mt-4 text-[11px] text-white/35">
                {formatContextCount(chat.contextPhotos.length)}
              </p>
            </div>
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
              {message.photos && message.photos.length > 0 && (
                <div className="mb-2 grid grid-cols-2 gap-2">
                  {message.photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      aria-label={`Open photo ${index + 1}`}
                      onClick={() => setPreviewPhoto(photo)}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                    >
                      <img
                        src={`data:image/jpeg;base64,${photo.base64}`}
                        alt={`Shared photo ${index + 1}`}
                        className="w-28 h-28 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              <p>{message.text}</p>
              {message.error && (
                <p className="text-xs text-danger mt-1">{message.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {(attachmentError || chat.error) && (
        <div className="px-6 pb-2">
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

      <div className="safe-bottom px-6 pb-6 pt-2 border-t border-white/[0.06] bg-charcoal/95 backdrop-blur-sm space-y-3">
        {!isTrueEmptyState && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-white/35">
              {formatContextCount(chat.contextPhotos.length)}
            </span>
            <div className="flex items-center gap-2">
              {totalPhotoCount < MAX_PHOTO_CHAT_PHOTOS && (
                <button
                  type="button"
                  onClick={openPhotoCapture}
                  className="px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-sm text-white/80 transition-colors"
                >
                  Add Photo
                </button>
              )}
              <button
                type="button"
                onClick={openGalleryPicker}
                className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sm text-amber-300 transition-colors"
              >
                Upload from gallery
              </button>
            </div>
          </div>
        )}

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
              handleAddPhotos(chat.queuePhotos(photos));
            } catch (err) {
              setAttachmentError(err instanceof Error ? err.message : 'Unable to process uploaded photos.');
            } finally {
              setIsUploading(false);
            }
          }}
        />

        <TextComposer
          value={draftText}
          onChange={setDraftText}
          placeholder={isUploading ? 'Preparing photos…' : 'Ask about your photos'}
          submitLabel="Send"
          isBusy={chat.state === 'sending' || isUploading}
          queuedPhotos={chat.queuedPhotos}
          onRemoveQueuedPhoto={chat.removeQueuedPhoto}
          suggestedPrompts={[...SUGGESTED_PROMPTS]}
          onSelectSuggestedPrompt={(prompt) => setDraftText(prompt)}
          onSubmit={async (text) => {
            setDraftText('');
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
              handleAddPhotos(chat.queuePhotos([photo]));
              setIsCaptureOpen(false);
            }}
          />
        </div>
      )}

      {previewPhoto && (
        <div
          className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm flex flex-col"
          role="dialog"
          aria-label="Photo Preview"
        >
          <div className="safe-top p-4 flex justify-end">
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm text-white"
              aria-label="Close photo preview"
            >
              Close
            </button>
          </div>
          <div className="flex-1 px-6 pb-8 flex items-center justify-center">
            <img
              src={`data:image/jpeg;base64,${previewPhoto.base64}`}
              alt="Full-screen photo preview"
              className="max-h-full max-w-full object-contain rounded-3xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
