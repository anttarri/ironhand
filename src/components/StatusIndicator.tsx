import type { SessionState } from '@/types';

interface StatusIndicatorProps {
  state: SessionState;
  error?: string | null;
  labelOverride?: string;
}

const stateConfig: Record<SessionState, { color: string; label: string; pulse: boolean }> = {
  idle: { color: 'bg-gray-500', label: 'Ready', pulse: false },
  connecting: { color: 'bg-amber-500', label: 'Connecting...', pulse: true },
  active: { color: 'bg-green-500', label: 'Live', pulse: true },
  error: { color: 'bg-danger', label: 'Error', pulse: false },
};

export function StatusIndicator({ state, error, labelOverride }: StatusIndicatorProps) {
  const config = stateConfig[state];
  const label = state === 'error' && error ? error : labelOverride ?? config.label;

  return (
    <div className="flex items-center gap-2 glass-elevated rounded-full px-3 py-1.5">
      <span
        className={`w-2 h-2 rounded-full ${config.color} ${
          config.pulse ? 'animate-pulse-dot' : ''
        }`}
      />
      <span className="text-[11px] font-mono font-medium text-white/85 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
