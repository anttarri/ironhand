interface ControlBarProps {
  isMuted: boolean;
  isAiSpeaking: boolean;
  onToggleMute: () => void;
  onEndSession: () => void;
  onToggleCamera: () => void;
}

export function ControlBar({
  isMuted,
  isAiSpeaking,
  onToggleMute,
  onEndSession,
  onToggleCamera,
}: ControlBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 safe-bottom">
      <div className="flex items-center justify-center gap-5 px-6 py-4 bg-gradient-to-t from-black/80 to-transparent">
        {/* Camera flip */}
        <button
          onClick={onToggleCamera}
          className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:bg-white/25 transition-colors"
          aria-label="Flip camera"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
            <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
            <polyline points="16 3 18.5 5.5 16 8" />
            <polyline points="8 16 5.5 18.5 8 21" />
          </svg>
        </button>

        {/* Mic toggle */}
        <button
          onClick={onToggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-all ${
            isMuted
              ? 'bg-danger'
              : isAiSpeaking
                ? 'bg-electric-blue'
                : 'bg-amber-500'
          }`}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.34 2.18" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {/* End session */}
        <button
          onClick={onEndSession}
          className="w-14 h-14 rounded-full bg-danger flex items-center justify-center active:scale-95 transition-transform"
          aria-label="End session"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
