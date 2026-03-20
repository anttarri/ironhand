// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const cameraMocks = vi.hoisted(() => ({
  startCamera: vi.fn(async () => {}),
  stopCamera: vi.fn(),
  capturePhoto: vi.fn(() => 'base64-photo-data'),
  toggleCamera: vi.fn(async () => {}),
  toggleTorch: vi.fn(async () => {}),
}));

vi.mock('../../src/hooks/useCamera', () => ({
  useCamera: () => ({
    videoRef: { current: null },
    isActive: true,
    isStreaming: false,
    facingMode: 'environment',
    isTorchAvailable: true,
    isTorchOn: false,
    startCamera: cameraMocks.startCamera,
    stopCamera: cameraMocks.stopCamera,
    startStreaming: vi.fn(),
    stopStreaming: vi.fn(),
    toggleCamera: cameraMocks.toggleCamera,
    toggleTorch: cameraMocks.toggleTorch,
    capturePhoto: cameraMocks.capturePhoto,
  }),
}));

vi.mock('../../src/components/CameraPreview', () => ({
  CameraPreview: () => <div>Camera Preview Mock</div>,
}));

import { PhotoCaptureView } from '../../src/components/PhotoCaptureView';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PhotoCaptureView', () => {
  it('requests camera on mount and stops camera on unmount', () => {
    const { unmount } = render(<PhotoCaptureView onBack={() => {}} onCapture={() => {}} />);

    expect(cameraMocks.startCamera).toHaveBeenCalledTimes(1);

    unmount();
    expect(cameraMocks.stopCamera).toHaveBeenCalledTimes(1);
  });

  it('captures, retakes, and confirms a photo payload', async () => {
    const user = userEvent.setup();
    const onCapture = vi.fn();

    render(<PhotoCaptureView onBack={() => {}} onCapture={onCapture} />);

    await user.click(screen.getByRole('button', { name: /shutter/i }));
    expect(cameraMocks.capturePhoto).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /retake/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /retake/i }));
    await user.click(screen.getByRole('button', { name: /shutter/i }));
    expect(cameraMocks.capturePhoto).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('button', { name: /use photo/i }));
    expect(onCapture).toHaveBeenCalledTimes(1);
    expect(onCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        base64: 'base64-photo-data',
        createdAt: expect.any(Number),
        source: 'camera',
      }),
    );
  });

  it('toggles flash when torch is available', async () => {
    const user = userEvent.setup();
    render(<PhotoCaptureView onBack={() => {}} onCapture={() => {}} />);

    await user.click(screen.getByRole('button', { name: /turn flashlight on/i }));
    expect(cameraMocks.toggleTorch).toHaveBeenCalledTimes(1);
  });
});
