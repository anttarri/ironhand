import { motion } from 'framer-motion';
import { haptic } from '@/services/haptics';

interface ControlBarProps {
  isMuted: boolean;
  isCameraOn: boolean;
  videoMode: 'live' | 'photo';
  isTorchAvailable: boolean;
  isTorchOn: boolean;
  isAiSpeaking: boolean;
  onToggleMute: () => void;
  onEndSession: () => void;
  onSelectVideoMode: (mode: 'live' | 'photo') => void;
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
  onSelectVideoMode,
  onCapturePhoto,
  onToggleTorch,
}: ControlBarProps) {
  const isPhotoMode = videoMode === 'photo';

  const modeSelector = (
    <div className="flex min-w-0 flex-col items-start gap-1.5">
      <span className="pl-1 text-[9px] font-mono font-medium text-white/30 uppercase tracking-[0.22em]">
        Mode
      </span>
      <div className="relative flex min-w-0 items-center rounded-[18px] border border-white/8 bg-black/15 p-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => { haptic('tap'); onSelectVideoMode('live'); }}
          aria-pressed={videoMode === 'live'}
          className={`relative flex h-9 items-center gap-1.5 rounded-[13px] px-2.5 outline-none active:scale-[0.98] transition-colors focus-visible:ring-2 focus-visible:ring-white/40 ${
            videoMode === 'live' ? 'text-white' : 'text-white/55 hover:text-white/80'
          }`}
        >
          {videoMode === 'live' && (
            <motion.div
              layoutId="mode-selector-active"
              className="absolute inset-0 rounded-[13px] bg-white/12 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {videoMode === 'live' && (
              <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse-dot" />
            )}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span className="text-[11px] font-medium tracking-tight">Live</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => { haptic('tap'); onSelectVideoMode('photo'); }}
          aria-pressed={videoMode === 'photo'}
          className={`relative flex h-9 items-center gap-1.5 rounded-[13px] px-2.5 outline-none active:scale-[0.98] transition-colors focus-visible:ring-2 focus-visible:ring-amber-300/60 ${
            videoMode === 'photo' ? 'text-charcoal' : 'text-white/55 hover:text-white/80'
          }`}
        >
          {videoMode === 'photo' && (
            <motion.div
              layoutId="mode-selector-active"
              className="absolute inset-0 rounded-[13px] bg-amber-500 shadow-[0_0_0_1px_rgba(255,149,0,0.18)]"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="14" rx="2" />
              <circle cx="12" cy="13" r="4" />
              <circle cx="12" cy="13" r="1.5" fill="currentColor" />
            </svg>
            <span className="text-[11px] font-medium tracking-tight">Photo</span>
          </span>
        </button>
      </div>
    </div>
  );

  const shutterControl = isPhotoMode ? (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:flex-none">
      <button
        type="button"
        onClick={() => { haptic('tap'); onCapturePhoto(); }}
        className="h-10 w-10 rounded-full border-[3px] border-white/85 bg-white/20 active:scale-95 active:bg-white/40 transition-all"
        aria-label="Take photo"
      />
      <span className="w-14 text-center text-[8px] leading-tight font-mono font-medium text-white/32 uppercase tracking-[0.14em] whitespace-nowrap">Take Photo</span>
    </div>
  ) : null;

  const torchControl = isTorchAvailable ? (
    <div className={`flex min-w-0 flex-col items-center gap-1.5 ${isPhotoMode ? 'flex-1 sm:flex-none' : ''}`}>
      <button
        type="button"
        onClick={() => { haptic('tap'); onToggleTorch(); }}
        className={`h-10 w-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${
          isTorchOn ? 'bg-amber-500 text-charcoal' : 'bg-white/12 text-white'
        }`}
        aria-label={isTorchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 2h6v6l-2 3v3h-2v-3L9 8V2z" />
          <rect x="8" y="15" width="8" height="7" rx="2" />
        </svg>
      </button>
      <span className="text-[9px] font-mono font-medium text-white/35 uppercase tracking-[0.18em]">Torch</span>
    </div>
  ) : null;

  const micControl = (
    <div className={`flex min-w-0 flex-col items-center gap-1.5 ${isPhotoMode ? 'flex-1 sm:flex-none' : ''}`}>
      <button
        type="button"
        onClick={() => { haptic('tap'); onToggleMute(); }}
        className={`w-[3.25rem] h-[3.25rem] min-w-[3.25rem] min-h-[3.25rem] rounded-full flex items-center justify-center active:scale-95 transition-all ${
          isMuted
            ? 'bg-danger'
            : isAiSpeaking
              ? 'bg-electric-blue shadow-[0_0_0_4px_rgba(0,102,255,0.2)]'
              : 'bg-amber-500 animate-breathe'
        }`}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMuted ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.34 2.18" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </button>
      <span className="text-[8px] font-mono font-medium text-white/32 uppercase tracking-[0.16em]">Mic</span>
    </div>
  );

  const endControl = (
    <div className={`flex min-w-0 flex-col items-center gap-1.5 ${isPhotoMode ? 'flex-1 sm:flex-none' : ''}`}>
      <button
        type="button"
        onClick={() => { haptic('warning'); onEndSession(); }}
        className="h-12 w-12 rounded-full bg-danger flex items-center justify-center active:scale-95 transition-all"
        aria-label="End session"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
          <rect x="5" y="5" width="14" height="14" rx="2" />
        </svg>
      </button>
      <span className="text-[8px] font-mono font-medium text-white/32 uppercase tracking-[0.16em]">End</span>
    </div>
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 safe-bottom">
      <div className="px-4 pb-4 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        {/* Glass tray */}
        <div className={`rounded-[20px] px-3 py-3 transition-colors duration-300 ${
          isPhotoMode
            ? 'bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl'
            : 'glass-elevated'
        }`}>
          {isPhotoMode ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:w-auto">
                {modeSelector}
              </div>
              <div
                data-testid="photo-mode-actions"
                className="flex w-full flex-wrap items-end justify-between gap-x-3 gap-y-4 sm:w-auto sm:flex-nowrap sm:justify-end"
              >
                {shutterControl}
                {torchControl}
                {micControl}
                {endControl}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {modeSelector}
                {torchControl}
              </div>
              <div className="flex shrink-0 items-end gap-2">
                {micControl}
                {endControl}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
