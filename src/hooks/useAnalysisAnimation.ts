import { useEffect, useRef, useState } from 'react';

export type AnalysisPhase = 'idle' | 'focus' | 'study' | 'resolve' | 'done';

const FOCUS_DURATION_MS = 800;
const RESOLVE_DURATION_MS = 400;

interface UseAnalysisAnimationOptions {
  isActive: boolean;
  onComplete?: () => void;
}

interface UseAnalysisAnimationReturn {
  phase: AnalysisPhase;
  isVisible: boolean;
}

export function useAnalysisAnimation({
  isActive,
  onComplete,
}: UseAnalysisAnimationOptions): UseAnalysisAnimationReturn {
  const [phase, setPhase] = useState<AnalysisPhase>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (isActive) {
      if (phase === 'idle' || phase === 'done') {
        setPhase('focus');
        timerRef.current = setTimeout(() => {
          setPhase('study');
        }, FOCUS_DURATION_MS);
      }
    } else {
      if (phase === 'focus' || phase === 'study') {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setPhase('resolve');
        timerRef.current = setTimeout(() => {
          setPhase('done');
          onCompleteRef.current?.();
        }, RESOLVE_DURATION_MS);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const isVisible = phase === 'focus' || phase === 'study' || phase === 'resolve';

  return { phase, isVisible };
}
