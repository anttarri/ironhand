// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../../src/App';

const callLogMocks = vi.hoisted(() => ({
  startCallLog: vi.fn(),
  updateCallLogMessages: vi.fn(),
  finalizeCallLog: vi.fn(),
}));

const captureSequence = vi.hoisted(() => ({
  value: 0,
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

vi.mock('../../src/components/PhotoCaptureView', () => ({
  PhotoCaptureView: ({ onCapture }: { onCapture: (photo: { base64: string; createdAt: number }) => void }) => {
    return (
      <button
        onClick={() => {
          captureSequence.value += 1;
          const next = captureSequence.value;
          onCapture({ base64: `photo-${next}`, createdAt: 1700000000000 + next });
        }}
      >
        Confirm Photo
      </button>
    );
  },
}));

vi.mock('../../src/components/PhotoChatView', () => ({
  PhotoChatView: ({ photo, onEnd }: { photo: { base64: string }; onEnd: () => void }) => (
    <div>
      <div>Photo Chat: {photo.base64}</div>
      <button onClick={onEnd}>End Photo Chat</button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  captureSequence.value = 0;
});

describe('photo flow persistence guardrails', () => {
  it('does not call call log APIs during photo flow', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /snap photo/i }));
    await user.click(screen.getByRole('button', { name: /confirm photo/i }));

    expect(screen.getByText('Photo Chat: photo-1')).toBeInTheDocument();
    expect(callLogMocks.startCallLog).not.toHaveBeenCalled();
    expect(callLogMocks.updateCallLogMessages).not.toHaveBeenCalled();
    expect(callLogMocks.finalizeCallLog).not.toHaveBeenCalled();
  });

  it('clears ephemeral photo session after end', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /snap photo/i }));
    await user.click(screen.getByRole('button', { name: /confirm photo/i }));
    expect(screen.getByText('Photo Chat: photo-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /end photo chat/i }));
    expect(screen.getByRole('button', { name: /go live/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /snap photo/i }));
    await user.click(screen.getByRole('button', { name: /confirm photo/i }));
    expect(screen.getByText('Photo Chat: photo-2')).toBeInTheDocument();
  });
});
