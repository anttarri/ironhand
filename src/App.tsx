import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CallDetailView } from '@/components/CallDetailView';
import { CallHistoryView } from '@/components/CallHistoryView';
import { PhotoChatView } from '@/components/PhotoChatView';
import { StartScreen } from '@/components/StartScreen';
import { SessionView } from '@/components/SessionView';
import type { AppScreen } from '@/types';

const screenTransition = { type: 'spring' as const, stiffness: 300, damping: 30 };

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('start');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const handleStartLive = () => {
    setScreen('live-session');
  };

  const handleStartPhoto = () => {
    setScreen('photo-chat');
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
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={screenTransition}
          className="h-full"
        >
          {screen === 'start' && (
            <StartScreen
              onStartLive={handleStartLive}
              onStartPhoto={handleStartPhoto}
              onOpenHistory={handleOpenHistory}
            />
          )}
          {screen === 'live-session' && <SessionView onEnd={handleEnd} />}
          {screen === 'photo-chat' && (
            <PhotoChatView
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
