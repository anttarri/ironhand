import { useState } from 'react';
import { CallDetailView } from '@/components/CallDetailView';
import { CallHistoryView } from '@/components/CallHistoryView';
import { PhotoCaptureView } from '@/components/PhotoCaptureView';
import { PhotoChatView } from '@/components/PhotoChatView';
import { StartScreen } from '@/components/StartScreen';
import { SessionView } from '@/components/SessionView';
import type { AppScreen, CapturedPhoto } from '@/types';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('start');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);

  const handleStartLive = () => {
    setScreen('live-session');
  };

  const handleStartPhoto = () => {
    setCapturedPhoto(null);
    setScreen('photo-capture');
  };

  const handleEnd = () => {
    setCapturedPhoto(null);
    setScreen('start');
  };

  const handleOpenHistory = () => {
    setScreen('history');
  };

  const handleOpenCallDetail = (callId: string) => {
    setActiveCallId(callId);
    setScreen('call-detail');
  };

  const handleBackToHistory = () => {
    setScreen('history');
  };

  const handlePhotoCaptured = (photo: CapturedPhoto) => {
    setCapturedPhoto(photo);
    setScreen('photo-chat');
  };

  return (
    <div className="h-full">
      {screen === 'start' && (
        <StartScreen
          onStartLive={handleStartLive}
          onStartPhoto={handleStartPhoto}
          onOpenHistory={handleOpenHistory}
        />
      )}
      {screen === 'live-session' && <SessionView onEnd={handleEnd} />}
      {screen === 'photo-capture' && (
        <PhotoCaptureView
          onBack={handleEnd}
          onCapture={handlePhotoCaptured}
        />
      )}
      {screen === 'photo-chat' && capturedPhoto && (
        <PhotoChatView
          photo={capturedPhoto}
          onEnd={handleEnd}
        />
      )}
      {screen === 'history' && (
        <CallHistoryView
          onBack={() => setScreen('start')}
          onOpenCall={handleOpenCallDetail}
          onStartSession={handleStartLive}
        />
      )}
      {screen === 'call-detail' && activeCallId && (
        <CallDetailView
          callId={activeCallId}
          onBack={handleBackToHistory}
          onDeleted={handleBackToHistory}
        />
      )}
    </div>
  );
}
