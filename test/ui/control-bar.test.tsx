// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlBar } from '../../src/components/ControlBar';

const defaultProps = {
  isMuted: false,
  isCameraOn: true,
  videoMode: 'live' as const,
  isTorchAvailable: false,
  isTorchOn: false,
  isAiSpeaking: false,
  onToggleMute: vi.fn(),
  onEndSession: vi.fn(),
  onToggleVideoMode: vi.fn(),
  onCapturePhoto: vi.fn(),
  onToggleTorch: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ControlBar video mode', () => {
  it('renders shutter button only in photo mode', () => {
    const { rerender } = render(<ControlBar {...defaultProps} videoMode="live" />);
    expect(screen.queryByRole('button', { name: /take photo/i })).not.toBeInTheDocument();

    rerender(<ControlBar {...defaultProps} videoMode="photo" />);
    expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument();
  });

  it('camera button shows "Live" label in live mode', () => {
    render(<ControlBar {...defaultProps} videoMode="live" />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('camera button shows "Photo" label in photo mode', () => {
    render(<ControlBar {...defaultProps} videoMode="photo" />);
    expect(screen.getByText('Photo')).toBeInTheDocument();
  });

  it('calls onCapturePhoto when shutter clicked', async () => {
    const onCapturePhoto = vi.fn();
    const user = userEvent.setup();
    render(<ControlBar {...defaultProps} videoMode="photo" onCapturePhoto={onCapturePhoto} />);

    await user.click(screen.getByRole('button', { name: /take photo/i }));
    expect(onCapturePhoto).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleVideoMode when camera button clicked', async () => {
    const onToggleVideoMode = vi.fn();
    const user = userEvent.setup();
    render(<ControlBar {...defaultProps} onToggleVideoMode={onToggleVideoMode} />);

    await user.click(screen.getByRole('button', { name: /switch to photo mode/i }));
    expect(onToggleVideoMode).toHaveBeenCalledTimes(1);
  });
});
