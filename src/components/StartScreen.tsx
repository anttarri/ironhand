interface StartScreenProps {
  onStart: () => void;
  onOpenHistory: () => void;
}

export function StartScreen({ onStart, onOpenHistory }: StartScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 bg-charcoal">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <img
          src="/ironhand-logo.svg"
          alt="Ironhand"
          className="w-20 h-20 mb-4"
        />
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Ironhand
        </h1>
        <p className="text-white/50 text-sm mt-1">Your AI Electrician</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={onStart}
          className="w-full bg-amber-500 hover:bg-amber-600 text-charcoal font-semibold rounded-xl py-4 text-base transition-colors active:scale-[0.98]"
        >
          Start Session
        </button>

        <button
          onClick={onOpenHistory}
          className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl py-4 text-base transition-colors active:scale-[0.98] border border-white/15"
        >
          Call History
        </button>

        <p className="text-white/20 text-xs text-center leading-relaxed">
          Ironhand uses your camera and microphone to provide realtime
          electrical guidance.
        </p>
      </div>
    </div>
  );
}
