import { useCallback, useEffect, useMemo, useState } from 'react';
import { clearCallLogs, deleteCallLog, listCallLogs } from '@/services/callLogStore';
import type { CallLogMeta } from '@/types';
import { formatCallTime, formatDuration, getStatusColor, getStatusLabel, groupCallLogs } from '@/utils/callLogFormat';

interface CallHistoryViewProps {
  onBack: () => void;
  onOpenCall: (callId: string) => void;
  onStartSession: () => void;
}

export function CallHistoryView({ onBack, onOpenCall, onStartSession }: CallHistoryViewProps) {
  const [logs, setLogs] = useState<CallLogMeta[]>([]);

  const refreshLogs = useCallback(() => {
    setLogs(listCallLogs());
  }, []);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  const groupedLogs = useMemo(() => groupCallLogs(logs), [logs]);

  const handleDelete = useCallback(
    (callId: string) => {
      const confirmed = window.confirm('Delete this call from local history?');
      if (!confirmed) return;

      deleteCallLog(callId);
      refreshLogs();
    },
    [refreshLogs],
  );

  const handleClearAll = useCallback(() => {
    const confirmed = window.confirm('Clear all call history from this browser?');
    if (!confirmed) return;

    clearCallLogs();
    refreshLogs();
  }, [refreshLogs]);

  return (
    <div className="h-full flex flex-col bg-charcoal text-white">
      <div className="safe-top px-4 pt-4 pb-3 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors"
          >
            Back
          </button>
          <div className="text-right">
            <h1 className="text-lg font-semibold">Call History</h1>
            <p className="text-xs text-white/50">Stored locally on this device</p>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleClearAll}
              className="text-xs px-3 py-1.5 rounded-lg bg-danger/25 text-danger hover:bg-danger/35 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <p className="text-white/60 text-base">No calls yet</p>
            <p className="text-white/35 text-sm mt-1">Your transcript history will show up here by date and time.</p>
            <button
              onClick={onStartSession}
              className="mt-5 px-4 py-2 rounded-lg bg-amber-500 text-charcoal font-semibold"
            >
              Start Session
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedLogs.map((group) => (
              <section key={group.key}>
                <h2 className="text-xs uppercase tracking-wider text-white/45 mb-2">{group.label}</h2>
                <div className="space-y-2">
                  {group.logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 flex items-start gap-3"
                    >
                      <button
                        onClick={() => onOpenCall(log.id)}
                        className="flex-1 min-w-0 text-left overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-white/95 truncate min-w-0">{log.title}</p>
                          <p className="text-xs text-white/50 whitespace-nowrap">{formatCallTime(log.startedAt)}</p>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-white/55">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(log.status)}`} />
                          <span>{getStatusLabel(log.status)}</span>
                          <span>•</span>
                          <span>{formatDuration(log.durationSec)}</span>
                          <span>•</span>
                          <span>{log.messageCount} msgs</span>
                        </div>
                        {log.preview && (
                          <p className="mt-1 text-sm text-white/65 overflow-hidden text-ellipsis whitespace-nowrap">
                            {log.preview}
                          </p>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white/70 transition-colors"
                        aria-label="Delete call"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
