import type { SavedSession } from '@/types';

const STORAGE_KEY = 'ironhand_sessions';
const MAX_SAVED_SESSIONS = 50;

export function loadSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedSession[];
  } catch {
    return [];
  }
}

export function saveSession(session: SavedSession): void {
  const sessions = loadSessions();
  sessions.unshift(session);
  if (sessions.length > MAX_SAVED_SESSIONS) {
    sessions.length = MAX_SAVED_SESSIONS;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full — drop oldest sessions and retry
    sessions.length = Math.floor(sessions.length / 2);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // Still failing — give up silently
    }
  }
}

export function deleteSession(id: string): void {
  const sessions = loadSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function clearAllSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
