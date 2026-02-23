import type { CallLogMeta, CallLogStatus } from '@/types';

export interface GroupedCallLogs {
  key: string;
  label: string;
  logs: CallLogMeta[];
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

function getLocalDayStart(timestamp: number): number {
  const value = new Date(timestamp);
  value.setHours(0, 0, 0, 0);
  return value.getTime();
}

function getGroupLabel(dayStart: number): string {
  const todayStart = getLocalDayStart(Date.now());
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

  if (dayStart === todayStart) {
    return 'Today';
  }

  if (dayStart === yesterdayStart) {
    return 'Yesterday';
  }

  return dateFormatter.format(dayStart);
}

export function groupCallLogs(logs: CallLogMeta[]): GroupedCallLogs[] {
  const grouped = new Map<number, CallLogMeta[]>();

  logs.forEach((log) => {
    const dayStart = getLocalDayStart(log.startedAt);
    const existing = grouped.get(dayStart) ?? [];
    existing.push(log);
    grouped.set(dayStart, existing);
  });

  return [...grouped.entries()]
    .sort(([left], [right]) => right - left)
    .map(([dayStart, dayLogs]) => ({
      key: String(dayStart),
      label: getGroupLabel(dayStart),
      logs: dayLogs.sort((left, right) => right.startedAt - left.startedAt),
    }));
}

export function formatCallTime(timestamp: number): string {
  return timeFormatter.format(timestamp);
}

export function formatCallDateTime(timestamp: number): string {
  return dateTimeFormatter.format(timestamp);
}

export function formatDuration(durationSec?: number): string {
  if (durationSec === undefined) {
    return 'In progress';
  }

  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  if (minutes < 60) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${String(remainingMinutes).padStart(2, '0')}m`;
}

export function getStatusLabel(status: CallLogStatus): string {
  if (status === 'completed') {
    return 'Completed';
  }

  if (status === 'interrupted') {
    return 'Interrupted';
  }

  return 'In progress';
}

export function getStatusColor(status: CallLogStatus): string {
  if (status === 'completed') {
    return 'bg-green-500';
  }

  if (status === 'interrupted') {
    return 'bg-amber-500';
  }

  return 'bg-blue-500';
}
