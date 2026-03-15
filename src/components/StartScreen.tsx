interface StartScreenProps {
  onStartLive: () => void;
  onStartPhoto: () => void;
  onOpenHistory: () => void;
}

export function StartScreen({ onStartLive, onStartPhoto, onOpenHistory }: StartScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 bg-gradient-to-b from-charcoal-200 to-charcoal-900 relative overflow-hidden">
      {/* Grid texture */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full bg-amber-500/[0.07] blur-[80px] pointer-events-none" />
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[160px] h-[160px] rounded-full bg-amber-400/[0.10] blur-[50px] pointer-events-none" />

      {/* Logo */}
      <div className="mb-10 flex flex-col items-center animate-logo-float relative z-10">
        <div className="relative w-[88px] h-[88px] mb-5">
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-[22px] bg-amber-500/10 blur-xl" />
          {/* Glass container */}
          <div className="relative w-full h-full rounded-[22px] glass-elevated flex items-center justify-center">
            <img
              src="/ironhand-logo.svg"
              alt="Ironhand"
              className="w-14 h-14"
            />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tighter">
          Ironhand
        </h1>
        <p className="text-white/35 text-xs mt-2 tracking-[0.15em] uppercase font-mono font-medium">
          AI Electrician
        </p>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-sm space-y-3 relative z-10">
        {/* Primary CTA - Go Live */}
        <button
          onClick={onStartLive}
          className="group w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-charcoal transition-all duration-200 active:scale-[0.97] active:brightness-95 glow-amber"
        >
          <div className="w-11 h-11 rounded-xl bg-charcoal/15 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <span className="block font-bold text-[15px]">Live Walkthrough</span>
            <span className="block text-xs text-charcoal/65 font-medium mt-0.5">Point your camera, talk with voice</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-charcoal/35 group-active:translate-x-0.5 transition-transform">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Secondary - Photo Chat */}
        <button
          onClick={onStartPhoto}
          className="group w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl glass text-white transition-all duration-200 active:scale-[0.97] active:bg-white/[0.1]"
        >
          <div className="w-11 h-11 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <span className="block font-bold text-[15px]">Ask About Photos</span>
            <span className="block text-xs text-white/40 font-medium mt-0.5">Snap or upload photos, ask with text</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20 group-active:translate-x-0.5 transition-transform">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Tertiary - Call History (minimal) */}
        <button
          onClick={onOpenHistory}
          className="w-full flex items-center justify-center gap-2 py-3 text-white/35 text-sm font-medium transition-colors active:text-white/55"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>Session History</span>
        </button>
      </div>

      {/* Privacy footer */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-1.5 text-white/20 text-[11px] px-8">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Camera & mic active only during sessions. History stays on-device.</span>
      </div>
    </div>
  );
}
