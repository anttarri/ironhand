import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CallLogMeta } from '@/types';
import { formatDuration, groupCallLogs } from '@/utils/callLogFormat';

function dayStart(offsetDays: number): number {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.getTime();
}

function makeLog(id: string, startedAt: number): CallLogMeta {
  return {
    id,
    title: `Call ${id}`,
    startedAt,
    endedAt: startedAt + 60_000,
    durationSec: 60,
    status: 'completed',
    messageCount: 3,
    preview: 'preview',
    updatedAt: startedAt + 60_000,
  };
}

describe('callLogFormat', () => {
  it('groups logs by local day and orders each group newest-first', () => {
    const today = dayStart(0);
    const yesterday = dayStart(-1);
    const older = dayStart(-3);

    const logs: CallLogMeta[] = [
      makeLog('older', older + 10_000),
      makeLog('today-early', today + 5_000),
      makeLog('today-late', today + 30_000),
      makeLog('yesterday', yesterday + 20_000),
    ];

    const grouped = groupCallLogs(logs);
    assert.equal(grouped.length, 3);
    assert.equal(grouped[0].label, 'Today');
    assert.equal(grouped[0].logs[0].id, 'today-late');
    assert.equal(grouped[0].logs[1].id, 'today-early');
    assert.equal(grouped[1].label, 'Yesterday');
    assert.equal(grouped[1].logs[0].id, 'yesterday');
    assert.match(grouped[2].label, /\w+/);
    assert.equal(grouped[2].logs[0].id, 'older');
  });

  it('formats duration across seconds, minutes, and hours', () => {
    assert.equal(formatDuration(undefined), 'In progress');
    assert.equal(formatDuration(9), '9s');
    assert.equal(formatDuration(125), '2m 05s');
    assert.equal(formatDuration(3_723), '1h 02m');
  });
});
