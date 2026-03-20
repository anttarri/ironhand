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
      {/* Header */}
      <div className="safe-top px-6 pt-4 pb-3 border-b border-white/[0.06] glass-elevated">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-sm transition-colors"
          >
            Back
          </button>
          <div className="text-right">
            <h1 className="text-lg font-bold tracking-tight">Call History</h1>
            <p className="text-[11px] text-white/35">Stored locally on this device</p>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleClearAll}
              className="text-xs px-3 py-1.5 rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll px-6 py-4">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.04] flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/15">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <p className="text-lg font-bold text-white/50 mb-1">No calls yet</p>
            <p className="text-sm text-white/30 mb-6 max-w-[240px]">
              Your session transcripts will appear here, organized by date.
            </p>
            <button
              onClick={onStartSession}
              className="px-5 py-3 rounded-xl bg-amber-500 text-charcoal font-semibold glow-amber active:scale-[0.97] transition-all"
            >
              Start First Session
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedLogs.map((group) => (
              <section key={group.key}>
                <h2 className="text-[10px] font-mono font-medium uppercase tracking-wider text-white/35 mb-2">{group.label}</h2>
                <div className="space-y-2">
                  {group.logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl glass-elevated p-4 flex items-start gap-3 active:bg-white/[0.08] transition-colors"
                    >
                      {/* Status accent line */}
                      <div className={`w-1 self-stretch rounded-full shrink-0 ${
                        log.status === 'completed' ? 'bg-success/50' :
                        log.status === 'interrupted' ? 'bg-amber-500/50' :
                        'bg-white/15'
                      }`} />

                      <button
                        onClick={() => onOpenCall(log.id)}
                        className="flex-1 min-w-0 text-left overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-white/90 truncate min-w-0">{log.title}</p>
                          <p className="text-[10px] font-mono text-white/40 whitespace-nowrap">{formatCallTime(log.startedAt)}</p>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/45">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(log.status)}`} />
                          <span>{getStatusLabel(log.status)}</span>
                          <span className="text-white/20">·</span>
                          <span className="font-mono">{formatDuration(log.durationSec)}</span>
                          <span className="text-white/20">·</span>
                          <span>{log.messageCount} msgs</span>
                        </div>
                        {log.preview && (
                          <p className="mt-1.5 text-sm text-white/50 overflow-hidden text-ellipsis whitespace-nowrap">
                            {log.preview}
                          </p>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/50 transition-colors"
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
