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
  toggleCamera: vi.fn(async () => {}),
  toggleTorch: vi.fn(async () => {}),
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
    stopStreaming: vi.fn(),
    toggleCamera: mocks.toggleCamera,
    toggleTorch: mocks.toggleTorch,
    capturePhoto: vi.fn(),
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

  it('camera toggle off keeps live session connected', async () => {
    const user = userEvent.setup();
    render(<SessionView onEnd={() => {}} />);

    await user.click(screen.getByRole('button', { name: /turn camera off/i }));

    expect(mocks.toggleCamera).toHaveBeenCalledTimes(1);
    expect(mocks.disconnect).not.toHaveBeenCalled();
    expect(mocks.cleanupAudio).not.toHaveBeenCalled();
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
