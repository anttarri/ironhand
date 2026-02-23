import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  createDefaultTitle,
  finalizeCallLog,
  getCallLog,
  listCallLogs,
  renameCallLog,
  startCallLog,
  updateCallLogMessages,
} from '@/services/callLogStore';
import type { ChatMessage } from '@/types';

class MemoryStorage {
  #map = new Map<string, string>();

  get length() {
    return this.#map.size;
  }

  clear() {
    this.#map.clear();
  }

  getItem(key: string): string | null {
    return this.#map.has(key) ? this.#map.get(key) ?? null : null;
  }

  key(index: number): string | null {
    return [...this.#map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.#map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#map.set(key, value);
  }
}

const realDateNow = Date.now;

function withNow(value: number): void {
  Date.now = () => value;
}

function restoreNow(): void {
  Date.now = realDateNow;
}

function makeMessage(id: string, role: ChatMessage['role'], text: string, timestamp: number): ChatMessage {
  return { id, role, text, timestamp };
}

describe('callLogStore', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage: new MemoryStorage() },
    });
    restoreNow();
  });

  afterEach(() => {
    restoreNow();
  });

  it('persists transcript messages and metadata for completed calls', () => {
    const startedAt = Date.UTC(2026, 1, 23, 15, 0, 0);
    const call = startCallLog(startedAt);
    assert.ok(call);

    const messages: ChatMessage[] = [
      makeMessage('1', 'system', 'Connected', startedAt + 1000),
      makeMessage('2', 'user', 'The breaker keeps tripping.', startedAt + 2000),
      makeMessage('3', 'ai', 'Kill the breaker and verify voltage is zero.', startedAt + 3000),
    ];

    updateCallLogMessages(call.id, messages);

    withNow(startedAt + 65_000);
    finalizeCallLog(call.id, 'completed');

    const logs = listCallLogs();
    assert.equal(logs.length, 1);
    assert.equal(logs[0].status, 'completed');
    assert.equal(logs[0].messageCount, 3);
    assert.equal(logs[0].preview, 'Kill the breaker and verify voltage is zero.');
    assert.equal(logs[0].durationSec, 65);

    const stored = getCallLog(call.id);
    assert.ok(stored);
    assert.equal(stored.status, 'completed');
    assert.equal(stored.messages.length, 3);
    assert.equal(stored.endedAt, startedAt + 65_000);
  });

  it('drops interrupted calls that never had a user/ai conversation', () => {
    const startedAt = Date.UTC(2026, 1, 23, 16, 0, 0);
    const call = startCallLog(startedAt);
    assert.ok(call);

    updateCallLogMessages(call.id, [
      makeMessage('1', 'system', 'Connected', startedAt + 1000),
    ]);

    withNow(startedAt + 10_000);
    finalizeCallLog(call.id, 'interrupted');

    assert.equal(listCallLogs().length, 0);
    assert.equal(getCallLog(call.id), null);
  });

  it('renames titles with normalization and blank fallback', () => {
    const startedAt = Date.UTC(2026, 1, 23, 17, 15, 0);
    const call = startCallLog(startedAt);
    assert.ok(call);

    const renamed = renameCallLog(call.id, '   Main    panel   walkthrough   ');
    assert.ok(renamed);
    assert.equal(renamed.title, 'Main panel walkthrough');

    const blankFallback = renameCallLog(call.id, '      ');
    assert.ok(blankFallback);
    assert.equal(blankFallback.title, createDefaultTitle(startedAt));

    const maxLenAttempt = 'a'.repeat(120);
    const truncated = renameCallLog(call.id, maxLenAttempt);
    assert.ok(truncated);
    assert.equal(truncated.title.length, 80);
  });
});
