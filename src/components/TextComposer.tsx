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
        className="flex-1 rounded-xl bg-white/[0.07] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-amber-500 transition-colors"
      />
      <button
        type="submit"
        disabled={!trimmed || isBusy}
        className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-charcoal text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all"
      >
        {submitLabel}
      </button>
    </form>
  );
}
