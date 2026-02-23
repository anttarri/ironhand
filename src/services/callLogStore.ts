import { CALL_LOG_MAX_TITLE_LENGTH, MAX_CALL_LOGS } from '@/config/constants';
import type { CallLog, CallLogMessage, CallLogMeta, CallLogStatus, ChatMessage } from '@/types';

const STORAGE_INDEX_KEY = 'ironhand.callLogs.v1.index';
const STORAGE_CALL_KEY_PREFIX = 'ironhand.callLogs.v1.call.';

function supportsStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeTitle(value: string, startedAt: number): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return createDefaultTitle(startedAt);
  }
  return trimmed.slice(0, CALL_LOG_MAX_TITLE_LENGTH);
}

function createCallStorageKey(id: string): string {
  return `${STORAGE_CALL_KEY_PREFIX}${id}`;
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `call-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getPreview(messages: Array<Pick<CallLogMessage, 'role' | 'text'>>): string {
  const latestContent = [...messages].reverse().find((message) => message.role !== 'system' && message.text.trim().length > 0);
  if (latestContent) {
    return latestContent.text.slice(0, 140);
  }

  const latestAny = [...messages].reverse().find((message) => message.text.trim().length > 0);
  return latestAny ? latestAny.text.slice(0, 140) : '';
}

function hasConversation(messages: CallLogMessage[]): boolean {
  return messages.some((message) => {
    if (message.role !== 'user' && message.role !== 'ai') {
      return false;
    }
    return message.text.trim().length > 0;
  });
}

function toMeta(call: CallLog): CallLogMeta {
  return {
    id: call.id,
    title: call.title,
    titleUpdatedAt: call.titleUpdatedAt,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    durationSec: call.durationSec,
    status: call.status,
    messageCount: call.messageCount,
    preview: call.preview,
    updatedAt: call.updatedAt,
  };
}

function loadIndex(): CallLogMeta[] {
  if (!supportsStorage()) {
    return [];
  }
  const parsed = safeParse<CallLogMeta[]>(window.localStorage.getItem(STORAGE_INDEX_KEY), []);
  return parsed
    .filter((item) => item && typeof item.id === 'string')
    .sort((a, b) => b.startedAt - a.startedAt);
}

function saveIndex(index: CallLogMeta[]): void {
  if (!supportsStorage()) {
    return;
  }
  window.localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index));
}

function upsertIndex(meta: CallLogMeta): CallLogMeta[] {
  const index = loadIndex();
  const withoutCurrent = index.filter((item) => item.id !== meta.id);
  const next = [meta, ...withoutCurrent].sort((a, b) => b.startedAt - a.startedAt);
  saveIndex(next);
  return next;
}

function enforceRetention(index: CallLogMeta[]): void {
  if (!supportsStorage()) {
    return;
  }

  if (index.length <= MAX_CALL_LOGS) {
    return;
  }

  const keep = index.slice(0, MAX_CALL_LOGS);
  const purge = index.slice(MAX_CALL_LOGS);

  purge.forEach((item) => {
    window.localStorage.removeItem(createCallStorageKey(item.id));
  });

  saveIndex(keep);
}

function saveCall(call: CallLog): void {
  if (!supportsStorage()) {
    return;
  }
  window.localStorage.setItem(createCallStorageKey(call.id), JSON.stringify(call));
}

export function createDefaultTitle(startedAt: number): string {
  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(startedAt);

  return `Call - ${time}`;
}

export function startCallLog(startedAt = Date.now()): CallLog | null {
  if (!supportsStorage()) {
    return null;
  }

  const call: CallLog = {
    id: createId(),
    title: createDefaultTitle(startedAt),
    startedAt,
    status: 'active',
    messages: [],
    messageCount: 0,
    preview: '',
    updatedAt: startedAt,
  };

  saveCall(call);
  const nextIndex = upsertIndex(toMeta(call));
  enforceRetention(nextIndex);
  return call;
}

export function listCallLogs(): CallLogMeta[] {
  return loadIndex();
}

export function getCallLog(id: string): CallLog | null {
  if (!supportsStorage()) {
    return null;
  }

  return safeParse<CallLog | null>(window.localStorage.getItem(createCallStorageKey(id)), null);
}

export function updateCallLogMessages(callId: string, messages: ChatMessage[]): CallLog | null {
  const existing = getCallLog(callId);
  if (!existing) {
    return null;
  }

  const nextMessages: CallLogMessage[] = messages.map((message) => ({
    id: message.id,
    role: message.role,
    text: message.text,
    timestamp: message.timestamp,
  }));

  const next: CallLog = {
    ...existing,
    messages: nextMessages,
    messageCount: nextMessages.length,
    preview: getPreview(nextMessages),
    updatedAt: Date.now(),
  };

  saveCall(next);
  upsertIndex(toMeta(next));
  return next;
}

export function finalizeCallLog(callId: string, status: Exclude<CallLogStatus, 'active'>): CallLog | null {
  const existing = getCallLog(callId);
  if (!existing) {
    return null;
  }

  const endedAt = Date.now();
  const durationSec = Math.max(0, Math.round((endedAt - existing.startedAt) / 1000));
  const next: CallLog = {
    ...existing,
    endedAt,
    durationSec,
    status,
    updatedAt: endedAt,
  };

  // Ignore empty non-conversations (common in aborted attempts).
  if (status === 'interrupted' && !hasConversation(next.messages)) {
    deleteCallLog(callId);
    return null;
  }

  saveCall(next);
  upsertIndex(toMeta(next));
  return next;
}

export function renameCallLog(callId: string, title: string): CallLog | null {
  const existing = getCallLog(callId);
  if (!existing) {
    return null;
  }

  const nextTitle = normalizeTitle(title, existing.startedAt);
  const now = Date.now();
  const next: CallLog = {
    ...existing,
    title: nextTitle,
    titleUpdatedAt: now,
    updatedAt: now,
  };

  saveCall(next);
  upsertIndex(toMeta(next));
  return next;
}

export function deleteCallLog(callId: string): void {
  if (!supportsStorage()) {
    return;
  }

  window.localStorage.removeItem(createCallStorageKey(callId));
  const index = loadIndex().filter((item) => item.id !== callId);
  saveIndex(index);
}

export function clearCallLogs(): void {
  if (!supportsStorage()) {
    return;
  }

  const index = loadIndex();
  index.forEach((item) => {
    window.localStorage.removeItem(createCallStorageKey(item.id));
  });
  saveIndex([]);
}
