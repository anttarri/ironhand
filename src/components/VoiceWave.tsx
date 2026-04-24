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

const MIN_H = 2;
const MAX_RANGE = 14;
const SMOOTHING_UP = 0.35;
const SMOOTHING_DOWN = 0.15;

const IDLE_BARS = Array(BAR_COUNT).fill(MIN_H);

export function VoiceWave({ userVolume, aiVolume, isAiSpeaking, isMuted }: VoiceWaveProps) {
  const [bars, setBars] = useState(IDLE_BARS);
  const rafRef = useRef(0);
  const smoothedRef = useRef(0);
  const volumeRef = useRef({ userVolume, aiVolume, isAiSpeaking, isMuted });
  volumeRef.current = { userVolume, aiVolume, isAiSpeaking, isMuted };

  useEffect(() => {
    let active = true;
    const tick = () => {
      if (!active) return;
      const { userVolume: uv, aiVolume: av, isAiSpeaking: ai, isMuted: m } = volumeRef.current;
      const target = ai ? av : (m ? 0 : uv);

      const prev = smoothedRef.current;
      const rate = target > prev ? SMOOTHING_UP : SMOOTHING_DOWN;
      const smoothed = prev + (target - prev) * rate;
      smoothedRef.current = smoothed;

      if (smoothed > 0.005) {
        setBars(SHAPE.map((s) => MIN_H + MAX_RANGE * smoothed * s));
      } else {
        smoothedRef.current = 0;
        setBars(IDLE_BARS);
      }

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
          className={`w-[3px] rounded-full ${active ? color : 'bg-white/15'}`}
          style={{ height: `${h}px`, transition: 'height 80ms linear' }}
        />
      ))}
    </div>
  );
}
