import { useEffect, useRef, useCallback } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { useAudio } from '@/hooks/useAudio';
import { useCamera } from '@/hooks/useCamera';
import { CameraPreview } from './CameraPreview';
import { ChatOverlay } from './ChatOverlay';
import { ControlBar } from './ControlBar';
import { StatusIndicator } from './StatusIndicator';

interface SessionViewProps {
  onEnd: () => void;
}

export function SessionView({ onEnd }: SessionViewProps) {
  const gemini = useGeminiLive();
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const hasStartedRef = useRef(false);

  const audio = useAudio({
    onAudioChunk: gemini.sendAudio,
  });

  const camera = useCamera({
    onFrame: gemini.sendVideo,
  });

  // Wire audio playback to Gemini audio output
  useEffect(() => {
    gemini.setAudioCallback(audio.playAudio);
  }, [gemini.setAudioCallback, audio.playAudio]);

  // Start session on mount
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    gemini.connect();
    camera.startCamera().catch(() => {
      // Camera permission denied is handled in the UI
    });

    // Request wake lock
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLockRef.current = lock;
      }).catch(() => {
        // Wake lock not supported or failed
      });
    }

    return () => {
      hasStartedRef.current = false;
      gemini.disconnect();
      camera.stopCamera();
      audio.cleanup();
      wakeLockRef.current?.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When Gemini becomes active, start streaming audio + video
  const prevStateRef = useRef(gemini.state);
  useEffect(() => {
    if (prevStateRef.current !== 'active' && gemini.state === 'active') {
      audio.startCapture().catch(() => {
        // Mic permission denied
      });
      camera.startStreaming();
    }
    prevStateRef.current = gemini.state;
  }, [gemini.state, audio, camera]);

  const handleEnd = useCallback(() => {
    gemini.disconnect();
    camera.stopCamera();
    audio.cleanup();
    wakeLockRef.current?.release();
    onEnd();
  }, [gemini, camera, audio, onEnd]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-charcoal">
      {/* Camera feed - full screen background */}
      <CameraPreview videoRef={camera.videoRef} isActive={camera.isActive} />

      {/* Status indicator - top left */}
      <div className="absolute top-4 left-4 safe-top z-10">
        <StatusIndicator state={gemini.state} error={gemini.error} />
      </div>

      {/* Chat overlay */}
      <ChatOverlay messages={gemini.messages} />

      {/* Control bar */}
      <ControlBar
        isMuted={audio.isMuted}
        isAiSpeaking={audio.isAiSpeaking}
        onToggleMute={audio.toggleMute}
        onEndSession={handleEnd}
        onToggleCamera={camera.toggleCamera}
      />
    </div>
  );
}
