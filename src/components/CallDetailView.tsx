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
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p className="text-white/50 font-medium">Call not found</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] transition-colors"
        >
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-charcoal text-white">
      {/* Header */}
      <div className="safe-top px-4 pt-4 pb-3 border-b border-white/[0.06] glass-elevated">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-sm transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-2 rounded-xl bg-danger/20 text-danger hover:bg-danger/30 text-sm transition-colors"
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
                className="w-full rounded-xl bg-white/[0.07] border border-white/15 px-3.5 py-2.5 text-white outline-none focus:border-amber-500 transition-colors"
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
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-charcoal text-sm font-semibold active:scale-[0.97] transition-all"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setTitleDraft(call.title);
                    setIsEditingTitle(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold leading-tight tracking-tight">{call.title}</h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-sm transition-colors shrink-0"
              >
                Rename
              </button>
            </div>
          )}

          <div className="mt-2 text-[11px] text-white/45 flex flex-wrap items-center gap-2 font-mono">
            <span className={`w-2 h-2 rounded-full ${getStatusColor(call.status)}`} />
            <span>{getStatusLabel(call.status)}</span>
            <span className="text-white/20">·</span>
            <span>{formatDuration(call.durationSec)}</span>
            <span className="text-white/20">·</span>
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

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-2">
        {call.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/15">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-white/35">No transcript was captured for this call.</p>
          </div>
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
                  ? 'bg-amber-500/15 text-amber-100 rounded-br-sm'
                  : message.role === 'ai'
                    ? 'glass text-white/90 rounded-bl-sm'
                    : 'bg-white/[0.06] text-white/50 text-xs rounded-lg'
              }`}
            >
              <p>{message.text}</p>
              <p className="mt-1 text-[10px] font-mono text-white/30">{formatCallTime(message.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
