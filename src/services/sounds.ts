type SoundEvent = 'start' | 'end' | 'capture' | 'error' | 'ai-ready';

let ctx: AudioContext | null = null;
const STORAGE_KEY = 'ironhand:sounds-enabled';
let enabled = loadPref();

function loadPref(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

export function setSoundsEnabled(on: boolean) {
  enabled = on;
  try { localStorage.setItem(STORAGE_KEY, String(on)); } catch {}
}

export function getSoundsEnabled(): boolean {
  return enabled;
}

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, when = 0, gain = 0.08) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(c.destination);

  const t = c.currentTime + when;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export function playSound(event: SoundEvent) {
  if (!enabled) return;
  try {
    switch (event) {
      case 'start':
        tone(523, 0.12, 0);
        tone(784, 0.18, 0.08);
        break;
      case 'end':
        tone(784, 0.1, 0);
        tone(523, 0.16, 0.07);
        break;
      case 'capture':
        tone(1200, 0.05, 0, 0.05);
        break;
      case 'error':
        tone(220, 0.2, 0, 0.06);
        tone(196, 0.25, 0.1, 0.06);
        break;
      case 'ai-ready':
        tone(880, 0.06, 0, 0.04);
        break;
    }
  } catch {}
}
