import { useRef, useEffect, useState } from 'react';

interface VoiceWaveProps {
  userVolume: number;
  aiVolume: number;
  isAiSpeaking: boolean;
  isMuted: boolean;
}

const BAR_COUNT = 5;
const CENTER = (BAR_COUNT - 1) / 2;
const SHAPE = Array.from({ length: BAR_COUNT }, (_, i) => {
  const dist = Math.abs(i - CENTER) / CENTER;
  return 1 - dist * 0.45;
});

function computeBars(volume: number): number[] {
  const base = 2;
  const range = 14;
  return SHAPE.map((s) => base + range * volume * s);
}

const IDLE_BARS = Array(BAR_COUNT).fill(2);

export function VoiceWave({ userVolume, aiVolume, isAiSpeaking, isMuted }: VoiceWaveProps) {
  const [bars, setBars] = useState(IDLE_BARS);
  const rafRef = useRef(0);
  const volumeRef = useRef({ userVolume, aiVolume, isAiSpeaking, isMuted });
  volumeRef.current = { userVolume, aiVolume, isAiSpeaking, isMuted };

  useEffect(() => {
    let active = true;
    const tick = () => {
      if (!active) return;
      const { userVolume: uv, aiVolume: av, isAiSpeaking: ai, isMuted: m } = volumeRef.current;
      const vol = ai ? av : (m ? 0 : uv);
      setBars(vol > 0.01 ? computeBars(vol) : IDLE_BARS);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const active = isAiSpeaking ? aiVolume > 0.01 : !isMuted && userVolume > 0.01;
  const color = isAiSpeaking ? 'bg-electric-blue' : 'bg-amber-500';

  return (
    <div className="flex items-center justify-center gap-[3px] h-5">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-[height] duration-100 ${
            active ? color : 'bg-white/15'
          }`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}
