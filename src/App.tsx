import { useState } from 'react';
import { StartScreen } from '@/components/StartScreen';
import { SessionView } from '@/components/SessionView';

type Screen = 'start' | 'session';

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');

  const handleStart = () => {
    setScreen('session');
  };

  const handleEnd = () => {
    setScreen('start');
  };

  return (
    <div className="h-full">
      {screen === 'start' && <StartScreen onStart={handleStart} />}
      {screen === 'session' && (
        <SessionView onEnd={handleEnd} />
      )}
    </div>
  );
}
