import type { CapturedPhoto } from '@/types';

interface TextComposerProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  submitLabel?: string;
  isBusy?: boolean;
  queuedPhotos?: CapturedPhoto[];
  onRemoveQueuedPhoto?: (photoId: string) => void;
  suggestedPrompts?: string[];
  onSelectSuggestedPrompt?: (prompt: string) => void;
  onSubmit: (text: string) => Promise<void> | void;
}

export function TextComposer({
  value,
  onChange,
  placeholder = 'Type a message',
  submitLabel = 'Send',
  isBusy = false,
  queuedPhotos = [],
  onRemoveQueuedPhoto,
  suggestedPrompts = [],
  onSelectSuggestedPrompt,
  onSubmit,
}: TextComposerProps) {
  const trimmed = value.trim();
  const showSuggestedPrompts = !isBusy && trimmed.length === 0 && suggestedPrompts.length > 0;

  return (
    <form
      className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!trimmed || isBusy) return;
        await onSubmit(trimmed);
      }}
    >
      <div className="space-y-3">
        {queuedPhotos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {queuedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/30"
              >
                <img
                  src={`data:image/jpeg;base64,${photo.base64}`}
                  alt={`Queued photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {onRemoveQueuedPhoto && (
                  <button
                    type="button"
                    onClick={() => onRemoveQueuedPhoto(photo.id)}
                    aria-label={`Remove queued photo ${index + 1}`}
                    className="absolute right-1 top-1 h-5 w-5 rounded-full bg-black/70 text-xs text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showSuggestedPrompts && (
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onSelectSuggestedPrompt?.(prompt)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/[0.08]"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-xl bg-white/[0.07] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-amber-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!trimmed || isBusy}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-charcoal text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
