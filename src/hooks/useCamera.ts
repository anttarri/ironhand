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

  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

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
    const wasStreaming = isStreaming;
    if (wasStreaming) stopStreaming();

    const newFacing: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    await startCamera(newFacing);

    if (wasStreaming) startStreaming();
  }, [facingMode, isStreaming, startCamera, startStreaming, stopStreaming]);

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
  };
}
