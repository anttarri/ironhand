import { RefObject } from 'react';

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  videoMode?: 'live' | 'photo';
}

export function CameraPreview({ videoRef, isActive, videoMode }: CameraPreviewProps) {
  return (
    <div className="absolute inset-0 bg-charcoal">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`camera-video ${isActive ? 'opacity-100' : 'opacity-0'}`}
      />
      {isActive && videoMode === 'live' && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse-dot" />
          <span className="text-[11px] font-bold text-white tracking-widest uppercase">REC</span>
        </div>
      )}
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
    </div>
  );
}
