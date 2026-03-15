// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const useAudioSpy = vi.hoisted(() => vi.fn());
const loadPhotoFilesMock = vi.hoisted(() => vi.fn());

vi.mock('../../src/hooks/useAudio', () => ({
  useAudio: useAudioSpy,
}));

vi.mock('../../src/components/PhotoCaptureView', () => ({
  PhotoCaptureView: ({ onBack, onCapture }: {
    onBack: () => void;
    onCapture: (photo: { id: string; base64: string; createdAt: number; source: 'camera' | 'upload' }) => void;
  }) => (
    <div>
      <div>Photo Capture Mock</div>
      <button
        onClick={() => onCapture({
          id: 'camera-1',
          base64: 'camera-photo',
          createdAt: 1700000000000,
          source: 'camera',
        })}
      >
        Confirm Captured Photo
      </button>
      <button onClick={onBack}>Back From Photo Capture</button>
    </div>
  ),
}));

vi.mock('../../src/services/photoUtils', () => ({
  loadCapturedPhotosFromFiles: loadPhotoFilesMock,
}));

import { PhotoChatView } from '../../src/components/PhotoChatView';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PhotoChatView', () => {
  it('renders empty-state attachment controls and omits live voice controls', () => {
    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn: vi.fn().mockResolvedValue({ text: 'ok' }) }}
      />,
    );

    expect(screen.getByText(/add up to 5 photos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload photos/i })).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /mute/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /turn camera/i })).not.toBeInTheDocument();
    expect(useAudioSpy).not.toHaveBeenCalled();
  });

  it('uploads multiple photos, renders their count, and appends ai response', async () => {
    const user = userEvent.setup();
    const sendTurn = vi.fn().mockResolvedValue({ text: 'Start with verifying the breaker is off.' });
    loadPhotoFilesMock.mockResolvedValue([
      { id: 'upload-1', base64: 'abc123', createdAt: 1700000000000, source: 'upload' },
      { id: 'upload-2', base64: 'def456', createdAt: 1700000000001, source: 'upload' },
    ]);

    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn }}
      />,
    );

    const input = screen.getByLabelText(/upload photos/i);
    await user.upload(input, [
      new File(['photo-1'], 'panel-1.png', { type: 'image/png' }),
      new File(['photo-2'], 'panel-2.png', { type: 'image/png' }),
    ]);

    await waitFor(() => {
      expect(screen.getByText('2 / 5 photos attached')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/ask about your photos/i), 'What is my next step?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(sendTurn).toHaveBeenCalledWith(expect.objectContaining({
      images: ['abc123', 'def456'],
    }));
    expect(await screen.findByText('Start with verifying the breaker is off.')).toBeInTheDocument();
  });

  it('alerts when adding a sixth photo', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    loadPhotoFilesMock
      .mockResolvedValueOnce([
        { id: 'upload-1', base64: 'a', createdAt: 1700000000000, source: 'upload' },
        { id: 'upload-2', base64: 'b', createdAt: 1700000000001, source: 'upload' },
        { id: 'upload-3', base64: 'c', createdAt: 1700000000002, source: 'upload' },
        { id: 'upload-4', base64: 'd', createdAt: 1700000000003, source: 'upload' },
        { id: 'upload-5', base64: 'e', createdAt: 1700000000004, source: 'upload' },
      ])
      .mockResolvedValueOnce([
        { id: 'upload-6', base64: 'f', createdAt: 1700000000005, source: 'upload' },
      ]);

    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn: vi.fn().mockResolvedValue({ text: 'ok' }) }}
      />,
    );

    const input = screen.getByLabelText(/upload photos/i);
    await user.upload(input, [
      new File(['1'], 'one.png', { type: 'image/png' }),
      new File(['2'], 'two.png', { type: 'image/png' }),
      new File(['3'], 'three.png', { type: 'image/png' }),
      new File(['4'], 'four.png', { type: 'image/png' }),
      new File(['5'], 'five.png', { type: 'image/png' }),
    ]);

    await waitFor(() => {
      expect(screen.getByText('5 / 5 photos attached')).toBeInTheDocument();
    });

    await user.upload(input, new File(['6'], 'six.png', { type: 'image/png' }));

    expect(alertSpy).toHaveBeenCalledWith(
      'You can only upload up to 5 photos in one chat. Start a new chat or use the livestream feature.',
    );
    expect(screen.getByText('5 / 5 photos attached')).toBeInTheDocument();
  });

  it('preserves prior messages when a user adds a captured photo later in the chat', async () => {
    const user = userEvent.setup();
    const sendTurn = vi.fn()
      .mockResolvedValueOnce({ text: 'First response' })
      .mockResolvedValueOnce({ text: 'Second response' });

    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn }}
      />,
    );

    await user.type(screen.getByPlaceholderText(/ask about your photos/i), 'What do you see?');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(await screen.findByText('First response')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /take photo/i }));
    expect(screen.getByText('Photo Capture Mock')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm captured photo/i }));
    expect(screen.queryByText('Photo Capture Mock')).not.toBeInTheDocument();
    expect(screen.getByText('1 / 5 photos attached')).toBeInTheDocument();
    expect(screen.getByText('First response')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/ask about your photos/i), 'And now?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(sendTurn).toHaveBeenNthCalledWith(2, expect.objectContaining({
      images: ['camera-photo'],
      history: [
        { role: 'user', text: 'What do you see?' },
        { role: 'ai', text: 'First response' },
      ],
    }));
    expect(await screen.findByText('Second response')).toBeInTheDocument();
  });
});
