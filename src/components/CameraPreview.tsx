import { RefObject, useState, useRef, useCallback } from 'react';

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  videoMode?: 'live' | 'photo';
  onFocus?: (x: number, y: number) => void;
}

export function CameraPreview({ videoRef, isActive, videoMode, onFocus }: CameraPreviewProps) {
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const focusTimerRef = useRef<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive || !onFocus) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setFocusPoint({ x, y });
    onFocus(x, y);

    if (focusTimerRef.current !== null) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => {
      setFocusPoint(null);
      focusTimerRef.current = null;
    }, 800);
  }, [isActive, onFocus]);

  return (
    <div className="absolute inset-0 bg-charcoal" onPointerDown={handlePointerDown}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`camera-video ${isActive ? 'opacity-100' : 'opacity-0'}`}
      />
      {isActive && videoMode === 'photo' && (
        <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top,0px)+3.5rem)] z-10 -translate-x-1/2 sm:top-4">
          <div className="bg-amber-500 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-bold text-charcoal uppercase tracking-wider flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="14" rx="2" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Photo Mode
          </div>
        </div>
      )}
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          <div className="text-white/30 text-sm">Camera off</div>
        </div>
      )}
      {/* Focus indicator */}
      {focusPoint && (
        <div
          className="absolute z-20 pointer-events-none animate-focus-ring"
          style={{
            left: `${focusPoint.x * 100}%`,
            top: `${focusPoint.y * 100}%`,
            width: 72,
            height: 72,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-full h-full rounded-lg border-2 border-amber-400" />
        </div>
      )}
    </div>
  );
}
