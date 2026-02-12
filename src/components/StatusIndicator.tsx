import type { SessionState } from '@/types';

interface StatusIndicatorProps {
  state: SessionState;
  error?: string | null;
}

const stateConfig: Record<SessionState, { color: string; label: string; pulse: boolean }> = {
  idle: { color: 'bg-gray-500', label: 'Ready', pulse: false },
  connecting: { color: 'bg-amber-500', label: 'Connecting...', pulse: true },
  active: { color: 'bg-green-500', label: 'Live', pulse: true },
  error: { color: 'bg-danger', label: 'Error', pulse: false },
};

export function StatusIndicator({ state, error }: StatusIndicatorProps) {
  const config = stateConfig[state];

  return (
    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
      <span
        className={`w-2.5 h-2.5 rounded-full ${config.color} ${
          config.pulse ? 'animate-pulse-dot' : ''
        }`}
      />
      <span className="text-xs font-medium text-white/90">
        {state === 'error' && error ? error : config.label}
      </span>
    </div>
  );
}
