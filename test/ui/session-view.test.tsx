// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
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
}));

import { SessionView } from '../../src/components/SessionView';

vi.mock('../../src/hooks/useGeminiLive', () => ({
  useGeminiLive: () => ({
    state: 'active',
    messages: [],
    error: null,
    connect: mocks.connect,
    disconnect: mocks.disconnect,
    sendAudio: mocks.sendAudio,
    sendVideo: mocks.sendVideo,
    sendText: vi.fn(),
    setAudioCallback: mocks.setAudioCallback,
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
    isActive: true,
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
  });

  it('defaults to live video mode', () => {
    render(<SessionView onEnd={() => {}} />);

    // Camera button should offer to switch to photo mode (meaning we're in live mode)
    expect(screen.getByRole('button', { name: /switch to photo mode/i })).toBeInTheDocument();
    // Shutter button should not be visible in live mode
    expect(screen.queryByRole('button', { name: /take photo/i })).not.toBeInTheDocument();
  });

  it('toggles to photo mode and stops streaming', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    await user.click(screen.getByRole('button', { name: /switch to photo mode/i }));

    expect(mocks.stopStreaming).toHaveBeenCalled();
    expect(mocks.disconnect).not.toHaveBeenCalled();
    // Shutter button should now be visible
    expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument();
  });

  it('shutter captures and sends photo', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    // Switch to photo mode first
    await user.click(screen.getByRole('button', { name: /switch to photo mode/i }));
    // Click the shutter
    await user.click(screen.getByRole('button', { name: /take photo/i }));

    expect(mocks.capturePhoto).toHaveBeenCalledTimes(1);
    expect(mocks.sendVideo).toHaveBeenCalledWith('captured-photo-base64');
  });

  it('toggles back to live mode and resumes streaming', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    // Toggle to photo mode
    await user.click(screen.getByRole('button', { name: /switch to photo mode/i }));
    mocks.startStreaming.mockClear();
    // Toggle back to live mode
    await user.click(screen.getByRole('button', { name: /switch to live video/i }));

    expect(mocks.startStreaming).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /take photo/i })).not.toBeInTheDocument();
  });

  it('audio remains active in photo mode', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    await user.click(screen.getByRole('button', { name: /switch to photo mode/i }));

    expect(mocks.cleanupAudio).not.toHaveBeenCalled();
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });

  it('flashlight toggle works without ending session', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    await user.click(screen.getByRole('button', { name: /turn flashlight on/i }));

    expect(mocks.toggleTorch).toHaveBeenCalledTimes(1);
    expect(mocks.disconnect).not.toHaveBeenCalled();
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
