import { RefObject } from 'react';

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isActive: boolean;
}

export function CameraPreview({ videoRef, isActive }: CameraPreviewProps) {
  return (
    <div className="absolute inset-0 bg-charcoal">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`camera-video ${isActive ? 'opacity-100' : 'opacity-0'}`}
      />
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
