import { useEffect, useRef, useCallback, useState } from 'react';
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
import { AnalysisOverlay } from './AnalysisOverlay';

type VideoMode = 'live' | 'photo';

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

  const [videoMode, setVideoMode] = useState<VideoMode>('live');
  const [photoFlash, setPhotoFlash] = useState(false);
  const [lastPhotoThumb, setLastPhotoThumb] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const messageCountAtScanRef = useRef(0);
  const statusLabelOverride = gemini.state === 'active' && videoMode === 'photo'
    ? 'Audio Live'
    : undefined;
  const overlayBottomInsetClass = videoMode === 'photo'
    ? 'bottom-[calc(11rem+env(safe-area-inset-bottom,0px))]'
    : 'bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))]';

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
      if (videoMode === 'live') {
        camera.startStreaming();
      }
    }
    prevStateRef.current = gemini.state;
  }, [gemini.state, audio, camera, videoMode]);

  // Dismiss scanning overlay when AI responds
  useEffect(() => {
    if (isScanning && gemini.messages.length > messageCountAtScanRef.current) {
      setIsScanning(false);
    }
  }, [isScanning, gemini.messages]);

  const handleSelectVideoMode = useCallback((nextMode: VideoMode) => {
    if (nextMode === videoMode) return;

    if (nextMode === 'photo') {
      camera.stopStreaming();
      setVideoMode('photo');
    } else {
      camera.startStreaming();
      setVideoMode('live');
      setLastPhotoThumb(null);
    }
  }, [videoMode, camera]);

  const handleCaptureAndSend = useCallback(() => {
    const frame = camera.capturePhoto();
    if (frame) {
      gemini.sendVideo(frame);
      setLastPhotoThumb(frame);
      setPhotoFlash(true);
      setTimeout(() => setPhotoFlash(false), 150);
      messageCountAtScanRef.current = gemini.messages.length;
      setIsScanning(true);
    }
  }, [camera, gemini]);

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
      <CameraPreview videoRef={camera.videoRef} isActive={camera.isActive} videoMode={videoMode} />

      {/* Mode indicator border */}
      <div className={`absolute inset-0 z-10 pointer-events-none border-[3px] transition-colors duration-300 ${
        videoMode === 'live' ? 'border-danger/40' : 'border-amber-500/50'
      }`} />

      {/* Flash overlay */}
      {photoFlash && (
        <div className="absolute inset-0 bg-white/70 z-20 pointer-events-none animate-flash" />
      )}

      {/* Analysis overlay */}
      <AnalysisOverlay isActive={isScanning} />

      {/* Status indicator - top left */}
      <div className="absolute top-4 left-4 safe-top z-10">
        <StatusIndicator
          state={gemini.state}
          error={gemini.error}
          labelOverride={statusLabelOverride}
        />
      </div>

      {/* Last photo thumbnail - shown in photo mode */}
      {videoMode === 'photo' && lastPhotoThumb && (
        <div className="absolute top-4 right-4 safe-top z-10">
          <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white/40 shadow-lg">
            <img
              src={`data:image/jpeg;base64,${lastPhotoThumb}`}
              alt="Last sent photo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Chat overlay */}
      <ChatOverlay messages={gemini.messages} bottomInsetClass={overlayBottomInsetClass} />

      {/* Text fallback when camera is unavailable */}
      {!camera.isActive && gemini.state === 'active' && (
        <div
          data-testid="camera-off-composer"
          className={`absolute left-3 right-3 z-10 ${overlayBottomInsetClass}`}
        >
          <TextComposer
            value={textDraft}
            onChange={setTextDraft}
            placeholder="Type while video is off"
            submitLabel="Send"
            onSubmit={async (text) => {
              setTextDraft('');
              gemini.sendText(text);
            }}
          />
        </div>
      )}

      {/* Control bar */}
      <ControlBar
        isMuted={audio.isMuted}
        isCameraOn={camera.isActive}
        videoMode={videoMode}
        isTorchAvailable={camera.isTorchAvailable}
        isTorchOn={camera.isTorchOn}
        isAiSpeaking={audio.isAiSpeaking}
        onToggleMute={audio.toggleMute}
        onEndSession={handleEnd}
        onSelectVideoMode={handleSelectVideoMode}
        onCapturePhoto={handleCaptureAndSend}
        onToggleTorch={() => {
          void camera.toggleTorch();
        }}
      />
    </div>
  );
}
