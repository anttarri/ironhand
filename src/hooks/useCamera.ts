import { useRef, useState, useCallback, useEffect } from 'react';
import { CAMERA_FRAME_INTERVAL_MS, CAMERA_FRAME_MAX_WIDTH, CAMERA_FRAME_QUALITY } from '@/config/constants';
import { captureFrame } from '@/services/mediaUtils';

type FacingMode = 'environment' | 'user';

interface UseCameraOptions {
  onFrame?: (base64Jpeg: string) => void;
}

export function useCamera({ onFrame }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const getVideoTrack = useCallback((): MediaStreamTrack | null => {
    return streamRef.current?.getVideoTracks?.()[0] ?? null;
  }, []);

  const detectTorchSupport = useCallback((track: MediaStreamTrack | null) => {
    if (!track || typeof track.getCapabilities !== 'function') {
      setIsTorchAvailable(false);
      setIsTorchOn(false);
      return;
    }

    const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
    const supported = capabilities.torch === true;
    setIsTorchAvailable(supported);
    if (!supported) {
      setIsTorchOn(false);
    }
  }, []);

  const startCamera = useCallback(async (facing: FacingMode = 'environment') => {
    // Stop existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facing,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    streamRef.current = stream;
    setFacingMode(facing);
    detectTorchSupport(stream.getVideoTracks()[0] ?? null);
    setIsTorchOn(false);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    setIsActive(true);
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsStreaming(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setIsTorchAvailable(false);
    setIsTorchOn(false);
  }, []);

  const startStreaming = useCallback(() => {
    if (intervalRef.current !== null) return;

    intervalRef.current = window.setInterval(() => {
      if (!videoRef.current || document.hidden) return;
      const frame = captureFrame(videoRef.current, CAMERA_FRAME_MAX_WIDTH, CAMERA_FRAME_QUALITY);
      if (frame && onFrameRef.current) {
        onFrameRef.current(frame);
      }
    }, CAMERA_FRAME_INTERVAL_MS);

    setIsStreaming(true);
  }, []);

  const stopStreaming = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const toggleCamera = useCallback(async () => {
    if (isActive) {
      // Turn camera off — release hardware (saves battery for pocket mode)
      stopStreaming();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsActive(false);
      setIsTorchAvailable(false);
      setIsTorchOn(false);
    } else {
      // Turn camera back on — re-acquire with the same facing mode
      await startCamera(facingMode);
      startStreaming();
    }
  }, [isActive, facingMode, startCamera, startStreaming, stopStreaming]);

  const toggleTorch = useCallback(async () => {
    const track = getVideoTrack();
    if (!track || typeof track.applyConstraints !== 'function') return;

    const next = !isTorchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setIsTorchOn(next);
    } catch {
      // Ignore unsupported/failed torch requests.
    }
  }, [getVideoTrack, isTorchOn]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current) return null;
    return captureFrame(videoRef.current, CAMERA_FRAME_MAX_WIDTH, CAMERA_FRAME_QUALITY);
  }, []);

  // Pause frame capture when page hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (!document.hidden && isStreaming && intervalRef.current === null) {
        intervalRef.current = window.setInterval(() => {
          if (!videoRef.current || document.hidden) return;
          const frame = captureFrame(videoRef.current, CAMERA_FRAME_MAX_WIDTH, CAMERA_FRAME_QUALITY);
          if (frame && onFrameRef.current) {
            onFrameRef.current(frame);
          }
        }, CAMERA_FRAME_INTERVAL_MS);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    videoRef,
    isActive,
    isStreaming,
    facingMode,
    startCamera,
    stopCamera,
    startStreaming,
    stopStreaming,
    toggleCamera,
    capturePhoto,
    isTorchAvailable,
    isTorchOn,
    toggleTorch,
  };
}
