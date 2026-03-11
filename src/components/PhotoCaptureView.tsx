import { useEffect, useState } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { CameraPreview } from './CameraPreview';
import type { CapturedPhoto } from '@/types';

interface PhotoCaptureViewProps {
  onBack: () => void;
  onCapture: (photo: CapturedPhoto) => void;
}

export function PhotoCaptureView({ onBack, onCapture }: PhotoCaptureViewProps) {
  const {
    videoRef,
    isActive,
    startCamera,
    stopCamera,
    capturePhoto,
  } = useCamera();
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera().catch(() => {
      setError('Camera permission is required to snap a photo.');
    });

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleShutter = () => {
    const photo = capturePhoto();
    if (!photo) {
      setError('Unable to capture photo. Try again.');
      return;
    }
    setError(null);
    setCapturedBase64(photo);
  };

  const handleUsePhoto = () => {
    if (!capturedBase64) return;
    onCapture({
      base64: capturedBase64,
      createdAt: Date.now(),
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-charcoal text-white">
      <CameraPreview videoRef={videoRef} isActive={isActive} />

      {capturedBase64 && (
        <img
          src={`data:image/jpeg;base64,${capturedBase64}`}
          alt="Captured preview"
          className="absolute inset-0 w-full h-full object-cover z-[1]"
        />
      )}

      <div className="absolute top-4 left-4 safe-top z-10">
        <button
          onClick={onBack}
          className="px-3 py-2 rounded-lg bg-black/40 backdrop-blur-sm hover:bg-black/60 text-sm"
        >
          Back
        </button>
      </div>

      <div className="absolute top-4 right-4 safe-top z-10 bg-black/50 rounded-full px-3 py-1 text-xs">
        Snap Photo
      </div>

      {error && (
        <div className="absolute top-16 left-4 right-4 z-10 rounded-lg bg-danger/70 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 safe-bottom z-10">
        <div className="flex items-center justify-center gap-4 px-6 py-5 bg-gradient-to-t from-black/85 to-transparent">
          {capturedBase64 ? (
            <>
              <button
                onClick={() => setCapturedBase64(null)}
                className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-sm"
              >
                Retake
              </button>
              <button
                onClick={handleUsePhoto}
                className="px-4 py-2 rounded-lg bg-amber-500 text-charcoal font-semibold text-sm"
              >
                Use Photo
              </button>
            </>
          ) : (
            <button
              onClick={handleShutter}
              className="w-20 h-20 rounded-full border-4 border-white/85 bg-white/20 hover:bg-white/30"
              aria-label="Shutter"
            />
          )}
        </div>
      </div>
    </div>
  );
}
