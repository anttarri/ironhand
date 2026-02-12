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
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/30 text-sm">Camera initializing...</div>
        </div>
      )}
    </div>
  );
}
