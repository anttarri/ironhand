import { useEffect, useRef, useCallback } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { useAudio } from '@/hooks/useAudio';
import { useCamera } from '@/hooks/useCamera';
import { CALL_LOG_SAVE_DEBOUNCE_MS } from '@/config/constants';
import { finalizeCallLog, startCallLog, updateCallLogMessages } from '@/services/callLogStore';
import { CameraPreview } from './CameraPreview';
import { ChatOverlay } from './ChatOverlay';
import { ControlBar } from './ControlBar';
import { StatusIndicator } from './StatusIndicator';
import { TextComposer } from './TextComposer';

interface SessionViewProps {
  onEnd: () => void;
}

export function SessionView({ onEnd }: SessionViewProps) {
  const gemini = useGeminiLive();
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const hasStartedRef = useRef(false);
  const callLogIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const latestMessagesRef = useRef(gemini.messages);
  const hasEndedRef = useRef(false);

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

  const flushCallLog = useCallback(() => {
    const callLogId = callLogIdRef.current;
    if (!callLogId) return;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    updateCallLogMessages(callLogId, latestMessagesRef.current);
  }, []);

  const finalizeCurrentCall = useCallback(
    (status: 'completed' | 'interrupted') => {
      const callLogId = callLogIdRef.current;
      if (!callLogId) return;

      flushCallLog();
      finalizeCallLog(callLogId, status);
      callLogIdRef.current = null;
    },
    [flushCallLog],
  );

  // Start session on mount
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    hasEndedRef.current = false;

    const startedLog = startCallLog(Date.now());
    callLogIdRef.current = startedLog?.id ?? null;

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
      if (!hasEndedRef.current) {
        finalizeCurrentCall('interrupted');
      }
      gemini.disconnect();
      camera.stopCamera();
      audio.cleanup();
      wakeLockRef.current?.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep a ref of the latest transcript and debounce localStorage writes.
  useEffect(() => {
    latestMessagesRef.current = gemini.messages;

    const callLogId = callLogIdRef.current;
    if (!callLogId) return;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      updateCallLogMessages(callLogId, latestMessagesRef.current);
      saveTimerRef.current = null;
    }, CALL_LOG_SAVE_DEBOUNCE_MS);
  }, [gemini.messages]);

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
    hasEndedRef.current = true;
    finalizeCurrentCall('completed');
    gemini.disconnect();
    camera.stopCamera();
    audio.cleanup();
    wakeLockRef.current?.release();
    onEnd();
  }, [audio, camera, finalizeCurrentCall, gemini, onEnd]);

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

      {/* Text fallback when live video is disabled */}
      {!camera.isActive && gemini.state === 'active' && (
        <div className="absolute left-3 right-3 bottom-[7.5rem] z-10">
          <TextComposer
            placeholder="Type while video is off"
            submitLabel="Send"
            onSubmit={async (text) => {
              gemini.sendText(text);
            }}
          />
        </div>
      )}

      {/* Control bar */}
      <ControlBar
        isMuted={audio.isMuted}
        isCameraOn={camera.isActive}
        isAiSpeaking={audio.isAiSpeaking}
        onToggleMute={audio.toggleMute}
        onEndSession={handleEnd}
        onToggleCamera={camera.toggleCamera}
      />
    </div>
  );
}
