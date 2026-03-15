// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import App from '../../src/App';

const callLogMocks = vi.hoisted(() => ({
  startCallLog: vi.fn(),
  updateCallLogMessages: vi.fn(),
  finalizeCallLog: vi.fn(),
}));

vi.mock('../../src/services/callLogStore', () => ({
  startCallLog: callLogMocks.startCallLog,
  updateCallLogMessages: callLogMocks.updateCallLogMessages,
  finalizeCallLog: callLogMocks.finalizeCallLog,
  listCallLogs: vi.fn(() => []),
  getCallLog: vi.fn(() => null),
  clearCallLogs: vi.fn(),
  deleteCallLog: vi.fn(),
  renameCallLog: vi.fn(),
}));

vi.mock('../../src/components/SessionView', () => ({
  SessionView: ({ onEnd }: { onEnd: () => void }) => <button onClick={onEnd}>End Live</button>,
}));

vi.mock('../../src/components/CallHistoryView', () => ({
  CallHistoryView: () => <div>History</div>,
}));

vi.mock('../../src/components/CallDetailView', () => ({
  CallDetailView: () => <div>Detail</div>,
}));

vi.mock('../../src/components/PhotoChatView', () => ({
  PhotoChatView: ({ onEnd }: { onEnd: () => void }) => {
    const [localPhotos, setLocalPhotos] = useState(0);

    return (
      <div>
        <div>Photo Chat</div>
        <div>Local Photos: {localPhotos}</div>
        <button onClick={() => setLocalPhotos((count) => count + 1)}>Mock Add Photo</button>
        <button onClick={onEnd}>End Photo Chat</button>
      </div>
    );
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('photo flow persistence guardrails', () => {
  it('does not call call log APIs during photo flow', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /photo chat/i }));

    expect(screen.getByText('Photo Chat')).toBeInTheDocument();
    expect(callLogMocks.startCallLog).not.toHaveBeenCalled();
    expect(callLogMocks.updateCallLogMessages).not.toHaveBeenCalled();
    expect(callLogMocks.finalizeCallLog).not.toHaveBeenCalled();
  });

  it('clears ephemeral photo session after end', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /photo chat/i }));
    expect(screen.getByText('Local Photos: 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /mock add photo/i }));
    expect(screen.getByText('Local Photos: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /end photo chat/i }));
    expect(screen.getByRole('button', { name: /go live/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /photo chat/i }));
    expect(screen.getByText('Local Photos: 0')).toBeInTheDocument();
  });
});
