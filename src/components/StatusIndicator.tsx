import type { SessionState } from '@/types';

interface StatusIndicatorProps {
  state: SessionState;
  error?: string | null;
  labelOverride?: string;
  isAiSpeaking?: boolean;
  connectionQuality?: 'good' | 'fair' | 'poor' | 'reconnecting';
}

const stateConfig: Record<SessionState, { color: string; label: string; pulse: boolean }> = {
  idle: { color: 'bg-gray-500', label: 'Ready', pulse: false },
  connecting: { color: 'bg-amber-500', label: 'Connecting...', pulse: true },
  active: { color: 'bg-green-500', label: 'Live', pulse: true },
  error: { color: 'bg-danger', label: 'Error', pulse: false },
};

function EqBars() {
  const delays = [0, 120, 240, 80];
  return (
    <div className="flex items-end gap-0.5 h-3">
      {delays.map((d, i) => (
        <span
          key={i}
          className="w-0.5 bg-electric-blue rounded-full animate-eq-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}

function SignalBars({ quality }: { quality: 'good' | 'fair' | 'poor' | 'reconnecting' }) {
  const heights = ['h-1', 'h-1.5', 'h-2'];
  const getBarColor = (index: number) => {
    switch (quality) {
      case 'good':
        return 'bg-success';
      case 'fair':
        return index < 2 ? 'bg-amber-500' : 'bg-white/15';
      case 'poor':
        return index === 0 ? 'bg-danger' : 'bg-white/15';
      case 'reconnecting':
        return 'bg-amber-500 animate-pulse-dot';
    }
  };

  return (
    <div className="flex items-end gap-[2px] ml-1.5">
      {heights.map((h, i) => (
        <span key={i} className={`w-0.5 rounded-full ${h} ${getBarColor(i)}`} />
      ))}
    </div>
  );
}

export function StatusIndicator({ state, error, labelOverride, isAiSpeaking, connectionQuality }: StatusIndicatorProps) {
  const config = stateConfig[state];
  const label = state === 'error' && error ? error : labelOverride ?? config.label;
  const showEq = state === 'active' && isAiSpeaking;

  return (
    <div className="flex items-center gap-2 glass-elevated rounded-full px-3 py-1.5">
      {showEq ? (
        <EqBars />
      ) : (
        <span
          className={`w-2 h-2 rounded-full ${config.color} ${
            config.pulse ? 'animate-pulse-dot' : ''
          }`}
        />
      )}
      <span className="text-[11px] font-mono font-medium text-white/85 uppercase tracking-wider">
        {label}
      </span>
      {state === 'active' && connectionQuality && (
        <SignalBars quality={connectionQuality} />
      )}
    </div>
  );
}
