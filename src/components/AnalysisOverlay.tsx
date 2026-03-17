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
        // Opacity is handled by animate-analysis-breathe CSS animation
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

      {/* Status text */}
      <span className="absolute bottom-8 left-0 right-0 text-center text-[11px] font-mono text-amber-400/60">
        Analyzing...
      </span>
    </div>
  );
}
