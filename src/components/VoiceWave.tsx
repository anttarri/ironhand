interface VoiceWaveProps {
  userVolume: number;
  aiVolume: number;
  isAiSpeaking: boolean;
  isMuted: boolean;
}

const BAR_COUNT = 5;

function getBarHeights(volume: number): number[] {
  const base = 2;
  const max = 16;
  const range = max - base;
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const center = (BAR_COUNT - 1) / 2;
    const dist = Math.abs(i - center) / center;
    const scale = 1 - dist * 0.5;
    return base + range * volume * scale * (0.7 + Math.random() * 0.3);
  });
}

export function VoiceWave({ userVolume, aiVolume, isAiSpeaking, isMuted }: VoiceWaveProps) {
  const active = isAiSpeaking ? aiVolume > 0.01 : !isMuted && userVolume > 0.01;
  const volume = isAiSpeaking ? aiVolume : userVolume;
  const bars = active ? getBarHeights(volume) : Array(BAR_COUNT).fill(2);
  const color = isAiSpeaking ? 'bg-electric-blue' : 'bg-amber-500';

  return (
    <div className="flex items-center justify-center gap-[3px] h-5">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all duration-75 ${
            active ? color : 'bg-white/15'
          }`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}
