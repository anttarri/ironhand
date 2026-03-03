import { useState } from 'react';
import { loadSessions, clearAllSessions } from '@/services/sessionStorage';
import type { SavedSession, ChatMessage } from '@/types';

interface HistoryListProps {
  onBack: () => void;
  onSelectSession: (id: string) => void;
}

export function HistoryList({ onBack, onSelectSession }: HistoryListProps) {
  const [sessions, setSessions] = useState<SavedSession[]>(loadSessions);

  const handleClearAll = () => {
    clearAllSessions();
    setSessions([]);
  };

  return (
    <div className="h-full flex flex-col bg-charcoal">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 safe-top border-b border-white/10">
        <button
          onClick={onBack}
          className="text-amber-500 text-sm font-medium"
        >
          Back
        </button>
        <h2 className="text-white font-semibold text-base">Session History</h2>
        {sessions.length > 0 ? (
          <button
            onClick={handleClearAll}
            className="text-danger text-sm font-medium"
          >
            Clear
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto chat-scroll">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm">
            <p>No saved sessions yet</p>
            <p className="text-xs mt-1">Sessions are saved automatically when you end them</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className="w-full text-left px-4 py-4 hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">
                    {formatDate(session.startedAt)}
                  </span>
                  <span className="text-white/30 text-xs">
                    {session.messageCount} messages
                  </span>
                </div>
                <p className="text-white/40 text-xs mt-1 truncate">
                  {getPreviewText(session.messages)}
                </p>
                <p className="text-white/20 text-xs mt-0.5">
                  {formatDuration(session.endedAt - session.startedAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'Less than a minute';
  if (mins === 1) return '1 minute';
  return `${mins} minutes`;
}

function getPreviewText(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role !== 'system');
  return first?.text ?? 'Empty session';
}
