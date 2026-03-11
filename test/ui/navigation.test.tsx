// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../../src/App';
import { StartScreen } from '../../src/components/StartScreen';

vi.mock('../../src/components/SessionView', () => ({
  SessionView: ({ onEnd }: { onEnd: () => void }) => (
    <div>
      <div>Live Session Mock</div>
      <button onClick={onEnd}>End Live</button>
    </div>
  ),
}));

vi.mock('../../src/components/CallHistoryView', () => ({
  CallHistoryView: ({ onBack }: { onBack: () => void }) => (
    <div>
      <div>History Mock</div>
      <button onClick={onBack}>Back From History</button>
    </div>
  ),
}));

vi.mock('../../src/components/CallDetailView', () => ({
  CallDetailView: ({ onBack }: { onBack: () => void }) => (
    <div>
      <div>Call Detail Mock</div>
      <button onClick={onBack}>Back From Detail</button>
    </div>
  ),
}));

vi.mock('../../src/components/PhotoCaptureView', () => ({
  PhotoCaptureView: ({
    onBack,
    onCapture,
  }: {
    onBack: () => void;
    onCapture: (photo: { base64: string; createdAt: number }) => void;
  }) => (
    <div>
      <div>Photo Capture Mock</div>
      <button onClick={() => onCapture({ base64: 'image-data', createdAt: 1700000000000 })}>
        Confirm Photo
      </button>
      <button onClick={onBack}>Back From Photo Capture</button>
    </div>
  ),
}));

vi.mock('../../src/components/PhotoChatView', () => ({
  PhotoChatView: ({ onEnd }: { onEnd: () => void }) => (
    <div>
      <div>Photo Chat Mock</div>
      <button onClick={onEnd}>End Photo Chat</button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('mockup start actions', () => {
  it('shows Go Live and Snap Photo actions on the start screen', () => {
    render(<StartScreen onStartLive={() => {}} onStartPhoto={() => {}} onOpenHistory={() => {}} />);

    expect(screen.getByRole('button', { name: /go live/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /snap photo/i })).toBeInTheDocument();
  });

  it('routes Go Live to live-session and allows ending back to start', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /go live/i }));
    expect(screen.getByText('Live Session Mock')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /end live/i }));
    expect(screen.getByRole('button', { name: /go live/i })).toBeInTheDocument();
  });

  it('routes Snap Photo to photo capture and then to photo chat', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /snap photo/i }));
    expect(screen.getByText('Photo Capture Mock')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm photo/i }));
    expect(screen.getByText('Photo Chat Mock')).toBeInTheDocument();
  });
});
