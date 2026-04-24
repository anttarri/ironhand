type HapticEvent =
  | 'tap'
  | 'success'
  | 'warning'
  | 'error'
  | 'start'
  | 'end'
  | 'ai-ready';

const PATTERNS: Record<HapticEvent, number | number[]> = {
  tap: 8,
  success: [12, 40, 18],
  warning: [20, 60, 20],
  error: [30, 40, 30, 40, 60],
  start: [14, 30, 22],
  end: 40,
  'ai-ready': 10,
};

const STORAGE_KEY = 'ironhand:haptics-enabled';
let enabled = loadPref();

function loadPref(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

export function setHapticsEnabled(on: boolean) {
  enabled = on;
  try { localStorage.setItem(STORAGE_KEY, String(on)); } catch {}
}

export function getHapticsEnabled(): boolean {
  return enabled;
}

export function haptic(event: HapticEvent) {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try { navigator.vibrate(PATTERNS[event]); } catch {}
}
