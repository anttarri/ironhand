import { useState } from 'react';
import { StartScreen } from '@/components/StartScreen';
import { SessionView } from '@/components/SessionView';
import { HistoryList } from '@/components/HistoryList';
import { HistoryDetail } from '@/components/HistoryDetail';
import { saveSession } from '@/services/sessionStorage';
import type { ChatMessage, SavedSession } from '@/types';

type Screen = 'start' | 'session' | 'history' | 'history-detail';

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);

  const handleStart = () => {
    setScreen('session');
  };

  const handleEnd = (messages: ChatMessage[]) => {
    const hasContent = messages.some((m) => m.role !== 'system');
    if (hasContent) {
      const session: SavedSession = {
        id: `session-${Date.now()}`,
        startedAt: messages[0].timestamp,
        endedAt: Date.now(),
        messages,
        messageCount: messages.length,
      };
      saveSession(session);
    }
    setScreen('start');
  };

  return (
    <div className="h-full">
      {screen === 'start' && (
        <StartScreen
          onStart={handleStart}
          onOpenHistory={() => setScreen('history')}
        />
      )}
      {screen === 'session' && (
        <SessionView onEnd={handleEnd} />
      )}
      {screen === 'history' && (
        <HistoryList
          onBack={() => setScreen('start')}
          onSelectSession={(id) => {
            setViewingSessionId(id);
            setScreen('history-detail');
          }}
        />
      )}
      {screen === 'history-detail' && viewingSessionId && (
        <HistoryDetail
          sessionId={viewingSessionId}
          onBack={() => setScreen('history')}
        />
      )}
    </div>
  );
}
