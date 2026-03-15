interface ControlBarProps {
  isMuted: boolean;
  isCameraOn: boolean;
  videoMode: 'live' | 'photo';
  isTorchAvailable: boolean;
  isTorchOn: boolean;
  isAiSpeaking: boolean;
  onToggleMute: () => void;
  onEndSession: () => void;
  onToggleVideoMode: () => void;
  onCapturePhoto: () => void;
  onToggleTorch: () => void;
}

export function ControlBar({
  isMuted,
  videoMode,
  isTorchAvailable,
  isTorchOn,
  isAiSpeaking,
  onToggleMute,
  onEndSession,
  onToggleVideoMode,
  onCapturePhoto,
  onToggleTorch,
}: ControlBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 safe-bottom">
      <div className="px-4 pb-4 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        {/* Glass tray */}
        <div className={`flex items-end justify-center gap-3 px-4 py-3 rounded-[20px] transition-colors duration-300 ${
          videoMode === 'photo'
            ? 'bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl'
            : 'glass-elevated'
        }`}>
          {/* Left group: Video Mode + Shutter + Torch */}
          <div className="flex items-end gap-2">
            {/* Video mode toggle */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={onToggleVideoMode}
                className={`w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  videoMode === 'live' ? 'bg-white/12' : 'bg-amber-500'
                }`}
                aria-label={videoMode === 'live' ? 'Switch to photo mode' : 'Switch to live video'}
              >
                {videoMode === 'live' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-charcoal">
                    <rect x="2" y="6" width="20" height="14" rx="2" />
                    <circle cx="12" cy="13" r="4" />
                    <circle cx="12" cy="13" r="1.5" fill="currentColor" />
                  </svg>
                )}
              </button>
              {videoMode === 'live' ? (
                <div className="flex items-center gap-1 justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse-dot" />
                  <span className="text-[10px] font-mono font-medium text-white/55 uppercase tracking-wider">Live</span>
                </div>
              ) : (
                <span className="text-[10px] font-mono font-medium text-amber-500/70 uppercase tracking-wider">Photo</span>
              )}
            </div>

            {/* Shutter button - only visible in photo mode */}
            {videoMode === 'photo' && (
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={onCapturePhoto}
                  className="w-12 h-12 rounded-full border-[3px] border-white/85 bg-white/20 active:bg-white/40 active:scale-95 transition-all"
                  aria-label="Take photo"
                />
                <span className="text-[10px] font-mono font-medium text-white/35 uppercase tracking-wider">Snap</span>
              </div>
            )}

            {/* Torch toggle */}
            {isTorchAvailable && (
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={onToggleTorch}
                  className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                    isTorchOn ? 'bg-amber-500 text-charcoal' : 'bg-white/12 text-white'
                  }`}
                  aria-label={isTorchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 2h6v6l-2 3v3h-2v-3L9 8V2z" />
                    <rect x="8" y="15" width="8" height="7" rx="2" />
                  </svg>
                </button>
                <span className="text-[10px] font-mono font-medium text-white/35 uppercase tracking-wider">Torch</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-9 bg-white/10 mx-1 self-center" />

          {/* Mic (primary) */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={onToggleMute}
              className={`w-16 h-16 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                isMuted
                  ? 'bg-danger'
                  : isAiSpeaking
                    ? 'bg-electric-blue shadow-[0_0_0_4px_rgba(0,102,255,0.2)]'
                    : 'bg-amber-500 animate-breathe'
              }`}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.34 2.18" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
            <span className="text-[10px] font-mono font-medium text-white/35 uppercase tracking-wider">Mic</span>
          </div>

          {/* Divider */}
          <div className="w-px h-9 bg-white/10 mx-1 self-center" />

          {/* End session */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={onEndSession}
              className="w-14 h-14 rounded-full bg-danger flex items-center justify-center active:scale-95 transition-all"
              aria-label="End session"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            </button>
            <span className="text-[10px] font-mono font-medium text-white/35 uppercase tracking-wider">End</span>
          </div>
        </div>
      </div>
    </div>
  );
}
