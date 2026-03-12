import { useState } from 'react';

interface TextComposerProps {
  placeholder?: string;
  submitLabel?: string;
  isBusy?: boolean;
  onSubmit: (text: string) => Promise<void> | void;
}

export function TextComposer({
  placeholder = 'Type a message',
  submitLabel = 'Send',
  isBusy = false,
  onSubmit,
}: TextComposerProps) {
  const [text, setText] = useState('');
  const trimmed = text.trim();

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!trimmed || isBusy) return;
        await onSubmit(trimmed);
        setText('');
      }}
    >
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none focus:border-amber-500"
      />
      <button
        type="submit"
        disabled={!trimmed || isBusy}
        className="px-3 py-2 rounded-xl bg-amber-500 text-charcoal text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </form>
  );
}
