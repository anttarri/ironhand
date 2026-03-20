import { loadSessions } from '@/services/sessionStorage';

interface HistoryDetailProps {
  sessionId: string;
  onBack: () => void;
}

export function HistoryDetail({ sessionId, onBack }: HistoryDetailProps) {
  const session = loadSessions().find((s) => s.id === sessionId);

  if (!session) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-charcoal">
        <p className="text-white/50 text-sm">Session not found</p>
        <button onClick={onBack} className="text-amber-500 text-sm mt-4">
          Go back
        </button>
      </div>
    );
  }

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
        <div className="text-center">
          <h2 className="text-white font-semibold text-sm">
            {new Date(session.startedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </h2>
          <p className="text-white/40 text-xs">
            {session.messageCount} messages
          </p>
        </div>
        <span className="w-10" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-2">
        {session.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user'
                ? 'justify-end'
                : msg.role === 'system'
                  ? 'justify-center'
                  : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-500/20 text-amber-100 rounded-br-sm'
                  : msg.role === 'ai'
                    ? 'bg-white/10 text-white/90 rounded-bl-sm'
                    : 'bg-white/5 text-white/50 text-xs rounded-lg'
              }`}
            >
              {msg.text}
              <div className="text-white/20 text-[10px] mt-1">
                {new Date(msg.timestamp).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
