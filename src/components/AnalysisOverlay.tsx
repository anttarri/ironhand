import { useAnalysisAnimation } from '@/hooks/useAnalysisAnimation';
import type { AnalysisPhase } from '@/hooks/useAnalysisAnimation';

interface AnalysisOverlayProps {
  isActive: boolean;
}

function getRadianceStyle(phase: AnalysisPhase): React.CSSProperties {
  switch (phase) {
    case 'focus':
      return {
        transform: 'scale(0.5)',
        opacity: 0.12,
        transition: 'transform 800ms ease-out, opacity 800ms ease-out',
      };
    case 'study':
      return {
        transform: 'scale(1.2)',
        transition: 'transform 8s linear',
      };
    case 'resolve':
      return {
        transform: 'scale(1.4)',
        opacity: 0,
        transition: 'transform 400ms ease-in, opacity 400ms ease-in',
      };
    default:
      return {
        transform: 'scale(0.3)',
        opacity: 0,
      };
  }
}

function CornerBrackets({ phase }: { phase: AnalysisPhase }) {
  const visible = phase === 'focus' || phase === 'study';
  const resolving = phase === 'resolve';

  return (
    <div
      className="absolute inset-0 transition-opacity duration-400"
      style={{ opacity: resolving ? 0 : visible ? 1 : 0 }}
    >
      {/* Top-left */}
      <svg className="absolute top-5 left-5 animate-scale-in" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M2 12V4a2 2 0 012-2h8" stroke="rgb(251 191 36)" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {/* Top-right */}
      <svg className="absolute top-5 right-5 animate-scale-in" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M30 12V4a2 2 0 00-2-2h-8" stroke="rgb(251 191 36)" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {/* Bottom-left */}
      <svg className="absolute bottom-5 left-5 animate-scale-in" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M2 20v8a2 2 0 002 2h8" stroke="rgb(251 191 36)" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {/* Bottom-right */}
      <svg className="absolute bottom-5 right-5 animate-scale-in" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M30 20v8a2 2 0 01-2 2h-8" stroke="rgb(251 191 36)" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function AnalysisOverlay({ isActive }: AnalysisOverlayProps) {
  const { phase, isVisible } = useAnalysisAnimation({ isActive });

  if (!isVisible) return null;

  const radianceStyle = getRadianceStyle(phase);

  return (
    <div
      data-testid="analysis-overlay"
      className="absolute inset-0 z-10 pointer-events-none"
      aria-hidden="true"
    >
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)',
        }}
      />

      {/* Radiance */}
      <div
        className={`absolute inset-0 ${phase === 'study' ? 'animate-analysis-breathe' : ''}`}
        style={{
          background: 'radial-gradient(circle at center, rgba(255,149,0,0.12) 0%, transparent 70%)',
          ...radianceStyle,
        }}
      />

      {/* Scanning line */}
      {phase === 'study' && (
        <div className="absolute inset-x-0 top-0 bottom-0 overflow-hidden">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent animate-scan-sweep" />
        </div>
      )}

      {/* Corner brackets */}
      <CornerBrackets phase={phase} />

      {/* Status text */}
      <span className="absolute bottom-8 left-0 right-0 text-center text-[11px] font-mono text-amber-400/60">
        Analyzing...
      </span>
    </div>
  );
}
