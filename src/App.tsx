import { useState } from 'react';
import { CallDetailView } from '@/components/CallDetailView';
import { CallHistoryView } from '@/components/CallHistoryView';
import { StartScreen } from '@/components/StartScreen';
import { SessionView } from '@/components/SessionView';

type Screen = 'start' | 'session' | 'history' | 'call-detail';

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const handleStart = () => {
    setScreen('session');
  };

  const handleEnd = () => {
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

  return (
    <div className="h-full">
      {screen === 'start' && <StartScreen onStart={handleStart} onOpenHistory={handleOpenHistory} />}
      {screen === 'session' && <SessionView onEnd={handleEnd} />}
      {screen === 'history' && (
        <CallHistoryView
          onBack={() => setScreen('start')}
          onOpenCall={handleOpenCallDetail}
          onStartSession={handleStart}
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
