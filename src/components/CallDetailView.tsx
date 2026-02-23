import { useCallback, useEffect, useState } from 'react';
import { deleteCallLog, getCallLog, renameCallLog } from '@/services/callLogStore';
import type { CallLog } from '@/types';
import { CALL_LOG_MAX_TITLE_LENGTH } from '@/config/constants';
import { formatCallDateTime, formatCallTime, formatDuration, getStatusColor, getStatusLabel } from '@/utils/callLogFormat';

interface CallDetailViewProps {
  callId: string;
  onBack: () => void;
  onDeleted: () => void;
}

export function CallDetailView({ callId, onBack, onDeleted }: CallDetailViewProps) {
  const [call, setCall] = useState<CallLog | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const refreshCall = useCallback(() => {
    const next = getCallLog(callId);
    setCall(next);
    setTitleDraft(next?.title ?? '');
    setIsEditingTitle(false);
  }, [callId]);

  useEffect(() => {
    refreshCall();
  }, [refreshCall]);

  const handleSaveTitle = useCallback(() => {
    if (!call) return;

    const renamed = renameCallLog(call.id, titleDraft);
    if (!renamed) return;

    setCall(renamed);
    setTitleDraft(renamed.title);
    setIsEditingTitle(false);
  }, [call, titleDraft]);

  const handleDelete = useCallback(() => {
    if (!call) return;

    const confirmed = window.confirm('Delete this call from local history?');
    if (!confirmed) return;

    deleteCallLog(call.id);
    onDeleted();
  }, [call, onDeleted]);

  if (!call) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-charcoal text-white px-6 text-center">
        <p className="text-white/65">Call not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15"
        >
          Back to History
        </button>
      </div>
    );
  }

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
          <button
            onClick={handleDelete}
            className="px-3 py-2 rounded-lg bg-danger/25 text-danger hover:bg-danger/35 text-sm transition-colors"
          >
            Delete
          </button>
        </div>

        <div className="mt-3">
          {isEditingTitle ? (
            <div className="space-y-2">
              <input
                type="text"
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                maxLength={CALL_LOG_MAX_TITLE_LENGTH}
                autoFocus
                className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white outline-none focus:border-amber-500"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSaveTitle();
                  }
                  if (event.key === 'Escape') {
                    setTitleDraft(call.title);
                    setIsEditingTitle(false);
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveTitle}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-charcoal text-sm font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setTitleDraft(call.title);
                    setIsEditingTitle(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-semibold leading-tight">{call.title}</h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
              >
                Rename
              </button>
            </div>
          )}

          <div className="mt-2 text-xs text-white/60 flex flex-wrap items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getStatusColor(call.status)}`} />
            <span>{getStatusLabel(call.status)}</span>
            <span>•</span>
            <span>{formatDuration(call.durationSec)}</span>
            <span>•</span>
            <span>{formatCallDateTime(call.startedAt)}</span>
            {call.endedAt && (
              <>
                <span>to</span>
                <span>{formatCallTime(call.endedAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-2">
        {call.messages.length === 0 && (
          <p className="text-center text-white/40 text-sm py-6">No transcript was captured for this call.</p>
        )}

        {call.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user'
                ? 'justify-end'
                : message.role === 'system'
                  ? 'justify-center'
                  : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-amber-500/20 text-amber-100 rounded-br-sm'
                  : message.role === 'ai'
                    ? 'bg-black/50 backdrop-blur-sm text-white/90 rounded-bl-sm'
                    : 'bg-white/10 text-white/60 text-xs rounded-lg'
              }`}
            >
              <p>{message.text}</p>
              <p className="mt-1 text-[11px] text-white/45">{formatCallTime(message.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
