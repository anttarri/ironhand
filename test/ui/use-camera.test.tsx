// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const mediaMocks = vi.hoisted(() => ({
  captureFrame: vi.fn(() => 'captured-photo-base64'),
}));

vi.mock('../../src/services/mediaUtils', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/mediaUtils')>('../../src/services/mediaUtils');
  return {
    ...actual,
    captureFrame: mediaMocks.captureFrame,
  };
});

import { useCamera } from '../../src/hooks/useCamera';

afterEach(() => {
  vi.clearAllMocks();
});

describe('useCamera capturePhoto', () => {
  it('returns null when no video element is attached', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.capturePhoto()).toBeNull();
  });

  it('captures a still frame from current video element', () => {
    const { result } = renderHook(() => useCamera());
    const video = document.createElement('video');

    act(() => {
      result.current.videoRef.current = video;
    });

    const photo = result.current.capturePhoto();
    expect(photo).toBe('captured-photo-base64');
    expect(mediaMocks.captureFrame).toHaveBeenCalledTimes(1);
    expect(mediaMocks.captureFrame).toHaveBeenCalledWith(video, expect.any(Number), expect.any(Number));
  });

  it('detects torch support and applies torch constraints', async () => {
    const applyConstraints = vi.fn(async () => {});
    const track = {
      stop: vi.fn(),
      getCapabilities: () => ({ torch: true }),
      applyConstraints,
    };

    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({
          getVideoTracks: () => [track],
          getTracks: () => [track],
        })),
      },
    });

    const { result } = renderHook(() => useCamera());
    const video = document.createElement('video');
    Object.defineProperty(video, 'play', {
      configurable: true,
      value: vi.fn(async () => {}),
    });

    act(() => {
      result.current.videoRef.current = video;
    });

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isTorchAvailable).toBe(true);
    expect(result.current.isTorchOn).toBe(false);

    await act(async () => {
      await result.current.toggleTorch();
    });

    expect(applyConstraints).toHaveBeenCalledWith({
      advanced: [{ torch: true }],
    });
    expect(result.current.isTorchOn).toBe(true);
  });
});
