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
  onSelectVideoMode: vi.fn(),
  onCapturePhoto: vi.fn(),
  onToggleTorch: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ControlBar video mode', () => {
  it('renders both visible mode segments', () => {
    render(<ControlBar {...defaultProps} videoMode="live" />);

    expect(screen.getByRole('button', { name: 'Live' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Photo' })).toBeInTheDocument();
    expect(screen.getByText('Mode')).toBeInTheDocument();
  });

  it('renders shutter button only in photo mode', () => {
    const { rerender } = render(<ControlBar {...defaultProps} videoMode="live" />);
    expect(screen.queryByRole('button', { name: /take photo/i })).not.toBeInTheDocument();

    rerender(<ControlBar {...defaultProps} videoMode="photo" />);
    expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument();
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
  });

  it('marks live as the active segment in live mode', () => {
    render(<ControlBar {...defaultProps} videoMode="live" />);

    expect(screen.getByRole('button', { name: 'Live' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Photo' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks photo as the active segment in photo mode', () => {
    render(<ControlBar {...defaultProps} videoMode="photo" />);

    expect(screen.getByRole('button', { name: 'Live' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Photo' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onCapturePhoto when shutter clicked', async () => {
    const onCapturePhoto = vi.fn();
    const user = userEvent.setup();
    render(<ControlBar {...defaultProps} videoMode="photo" onCapturePhoto={onCapturePhoto} />);

    await user.click(screen.getByRole('button', { name: /take photo/i }));
    expect(onCapturePhoto).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectVideoMode with photo when photo clicked', async () => {
    const onSelectVideoMode = vi.fn();
    const user = userEvent.setup();
    render(<ControlBar {...defaultProps} onSelectVideoMode={onSelectVideoMode} />);

    await user.click(screen.getByRole('button', { name: 'Photo' }));
    expect(onSelectVideoMode).toHaveBeenCalledWith('photo');
  });

  it('calls onSelectVideoMode with live when live clicked', async () => {
    const onSelectVideoMode = vi.fn();
    const user = userEvent.setup();
    render(<ControlBar {...defaultProps} videoMode="photo" onSelectVideoMode={onSelectVideoMode} />);

    await user.click(screen.getByRole('button', { name: 'Live' }));
    expect(onSelectVideoMode).toHaveBeenCalledWith('live');
  });
});
