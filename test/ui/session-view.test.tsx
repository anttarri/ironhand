// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  setAudioCallback: vi.fn(),
  sendAudio: vi.fn(),
  sendVideo: vi.fn(),
  startCapture: vi.fn(async () => {}),
  cleanupAudio: vi.fn(),
  toggleMute: vi.fn(),
  playAudio: vi.fn(),
  startCamera: vi.fn(async () => {}),
  stopCamera: vi.fn(),
  startStreaming: vi.fn(),
  stopStreaming: vi.fn(),
  toggleCamera: vi.fn(async () => {}),
  toggleTorch: vi.fn(async () => {}),
  capturePhoto: vi.fn(() => 'captured-photo-base64'),
  startCallLog: vi.fn(() => ({ id: 'call-1' })),
  updateCallLogMessages: vi.fn(),
  finalizeCallLog: vi.fn(),
  messages: [] as Array<{ id: string; role: string; text: string; timestamp?: number }>,
  cameraIsActive: true,
}));

import { SessionView } from '../../src/components/SessionView';

vi.mock('../../src/hooks/useGeminiLive', () => ({
  useGeminiLive: () => ({
    state: 'active',
    messages: mocks.messages,
    error: null,
    connect: mocks.connect,
    disconnect: mocks.disconnect,
    sendAudio: mocks.sendAudio,
    sendVideo: mocks.sendVideo,
    sendText: vi.fn(),
    setAudioCallback: mocks.setAudioCallback,
    connectionQuality: 'good',
  }),
}));

vi.mock('../../src/hooks/useAudio', () => ({
  useAudio: () => ({
    isCapturing: true,
    isMuted: false,
    isAiSpeaking: false,
    startCapture: mocks.startCapture,
    stopCapture: vi.fn(),
    playAudio: mocks.playAudio,
    stopPlayback: vi.fn(),
    toggleMute: mocks.toggleMute,
    cleanup: mocks.cleanupAudio,
  }),
}));

vi.mock('../../src/hooks/useCamera', () => ({
  useCamera: () => ({
    videoRef: { current: null },
    isActive: mocks.cameraIsActive,
    isStreaming: true,
    facingMode: 'environment',
    isTorchAvailable: true,
    isTorchOn: false,
    startCamera: mocks.startCamera,
    stopCamera: mocks.stopCamera,
    startStreaming: mocks.startStreaming,
    stopStreaming: mocks.stopStreaming,
    toggleCamera: mocks.toggleCamera,
    toggleTorch: mocks.toggleTorch,
    capturePhoto: mocks.capturePhoto,
    focusAt: vi.fn(async () => false),
  }),
}));

vi.mock('../../src/services/callLogStore', () => ({
  startCallLog: mocks.startCallLog,
  updateCallLogMessages: mocks.updateCallLogMessages,
  finalizeCallLog: mocks.finalizeCallLog,
}));

describe('SessionView lifecycle', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: vi.fn(async () => ({ release: vi.fn() })),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.messages = [];
    mocks.cameraIsActive = true;
  });

  it('defaults to live video mode', () => {
    render(<SessionView onEnd={() => {}} />);

    expect(screen.getByRole('button', { name: 'Live' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Photo' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: /take photo/i })).not.toBeInTheDocument();
  });

  it('does not start frame streaming on first render in default photo mode', () => {
    render(<SessionView onEnd={() => {}} />);

    expect(mocks.startStreaming).not.toHaveBeenCalled();
  });

  it('positions the chat overlay with live inset by default', () => {
    mocks.messages = [{ id: '1', role: 'ai', text: 'Visible response', timestamp: Date.now() }];
    render(<SessionView onEnd={() => {}} />);

    expect(screen.getByTestId('chat-overlay')).toHaveClass('bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))]');
  });

  it('positions the collapsed chat button with live inset by default', async () => {
    const user = userEvent.setup();
    mocks.messages = [{ id: '1', role: 'ai', text: 'Visible response', timestamp: Date.now() }];
    render(<SessionView onEnd={() => {}} />);

    await user.click(screen.getByRole('button', { name: /hide chat/i }));

    expect(screen.getByRole('button', { name: /chat \(1\)/i })).toHaveClass(
      'bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))]',
    );
  });

  it('positions the camera-off text composer with live inset by default', () => {
    mocks.cameraIsActive = false;
    render(<SessionView onEnd={() => {}} />);

    expect(screen.getByTestId('camera-off-composer')).toHaveClass(
      'bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))]',
    );
  });

  it('selects photo mode and stops streaming', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    mocks.stopStreaming.mockClear();
    await user.click(screen.getByRole('button', { name: 'Photo' }));

    expect(mocks.stopStreaming).toHaveBeenCalled();
    expect(mocks.disconnect).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Photo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument();
    expect(screen.getByText('Audio Live')).toBeInTheDocument();
  });

  it('shutter captures and sends photo', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Photo' }));
    await user.click(screen.getByRole('button', { name: /take photo/i }));

    expect(mocks.capturePhoto).toHaveBeenCalledTimes(1);
    expect(mocks.sendVideo).toHaveBeenCalledWith('captured-photo-base64');
  });

  it('selects live mode and resumes streaming', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Photo' }));
    mocks.startStreaming.mockClear();
    await user.click(screen.getByRole('button', { name: 'Live' }));

    expect(mocks.startStreaming).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Live' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: /take photo/i })).not.toBeInTheDocument();
  });

  it('audio remains active in photo mode', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Photo' }));

    expect(mocks.cleanupAudio).not.toHaveBeenCalled();
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });

  it('reselecting the current mode is a no-op', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    mocks.startStreaming.mockClear();
    mocks.stopStreaming.mockClear();
    await user.click(screen.getByRole('button', { name: 'Live' }));

    expect(mocks.startStreaming).not.toHaveBeenCalled();
    expect(mocks.stopStreaming).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Photo' }));
    expect(mocks.stopStreaming).toHaveBeenCalledTimes(1);

    mocks.stopStreaming.mockClear();
    await user.click(screen.getByRole('button', { name: 'Photo' }));
    expect(mocks.stopStreaming).not.toHaveBeenCalled();
  });

  it('flashlight toggle works without ending session', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    await user.click(screen.getByRole('button', { name: /turn flashlight on/i }));

    expect(mocks.toggleTorch).toHaveBeenCalledTimes(1);
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });

  it('shows analysis overlay after photo capture in photo mode', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Photo' }));
    await user.click(screen.getByRole('button', { name: /take photo/i }));

    expect(screen.getByTestId('analysis-overlay')).toBeInTheDocument();
  });

  it('hides analysis overlay when AI responds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(<SessionView onEnd={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Photo' }));
    await user.click(screen.getByRole('button', { name: /take photo/i }));

    expect(screen.getByTestId('analysis-overlay')).toBeInTheDocument();

    // Simulate AI response by updating messages
    mocks.messages = [{ id: '1', role: 'ai', text: 'I see a panel', timestamp: Date.now() }];
    rerender(<SessionView onEnd={() => {}} />);

    // Advance past the resolve phase (400ms)
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.queryByTestId('analysis-overlay')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('end session tears down resources and exits', async () => {
    const onEnd = vi.fn();
    const user = userEvent.setup();
    render(<SessionView onEnd={onEnd} />);

    await user.click(screen.getByRole('button', { name: /end session/i }));

    expect(mocks.disconnect).toHaveBeenCalledTimes(1);
    expect(mocks.stopCamera).toHaveBeenCalledTimes(1);
    expect(mocks.cleanupAudio).toHaveBeenCalledTimes(1);
    expect(mocks.finalizeCallLog).toHaveBeenCalledWith('call-1', 'completed');
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
