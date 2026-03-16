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
  it('renders empty-state chat controls and omits live voice controls', () => {
    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn: vi.fn().mockResolvedValue({ text: 'ok' }) }}
      />,
    );

    expect(screen.getByText(/add photos and ask a question/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /add photo/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /upload from gallery/i })).toHaveLength(1);
    expect(screen.getByText('0 photos in context')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find code violations' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Identify this part' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run a panel inspection' })).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /mute/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /turn camera/i })).not.toBeInTheDocument();
    expect(useAudioSpy).not.toHaveBeenCalled();
  });

  it('opens photo capture from the empty-state add photo button', async () => {
    const user = userEvent.setup();

    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn: vi.fn().mockResolvedValue({ text: 'ok' }) }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /add photo/i }));

    expect(screen.getByText('Photo Capture Mock')).toBeInTheDocument();
  });

  it('prefills the composer when a suggested prompt is tapped and does not send immediately', async () => {
    const user = userEvent.setup();
    const sendTurn = vi.fn().mockResolvedValue({ text: 'ok' });

    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Identify this part' }));

    const composer = screen.getByPlaceholderText(/ask about your photos/i);
    expect(composer).toHaveValue('Identify this part');
    expect(sendTurn).not.toHaveBeenCalled();

    await user.clear(composer);
    expect(screen.getByRole('button', { name: 'Find code violations' })).toBeInTheDocument();
  });

  it('clears the composer immediately after send, before the request resolves', async () => {
    const user = userEvent.setup();
    const sendTurn = vi.fn(() => new Promise(() => {}));

    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn }}
      />,
    );

    const composer = screen.getByPlaceholderText(/ask about your photos/i);
    await user.type(composer, 'What is my next step?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(sendTurn).toHaveBeenCalledTimes(1);
    expect(composer).toHaveValue('');
  });

  it('keeps the composer cleared after a failed send and shows retry UI', async () => {
    const user = userEvent.setup();
    const sendTurn = vi.fn().mockRejectedValueOnce(new Error('temporary failure'));

    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn }}
      />,
    );

    const composer = screen.getByPlaceholderText(/ask about your photos/i);
    await user.type(composer, 'Need help');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(composer).toHaveValue('');
    expect(screen.getByText('Need help')).toBeInTheDocument();
  });

  it('uploads photos, shows context count, renders them inline in the user turn, and appends ai response', async () => {
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
      expect(screen.getAllByRole('img', { name: /queued photo/i })).toHaveLength(2);
    });
    expect(screen.queryByText(/add photos and ask a question/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /add photo/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /upload from gallery/i })).toHaveLength(1);
    expect(screen.getByText('0 photos in context')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/ask about your photos/i), 'What is my next step?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(sendTurn).toHaveBeenCalledWith(expect.objectContaining({
      images: ['abc123', 'def456'],
    }));
    expect(await screen.findByText('Start with verifying the breaker is off.')).toBeInTheDocument();
    expect(screen.getByText('What is my next step?')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /open photo/i })).toHaveLength(2);
    expect(screen.getByText('2 photos in context')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /queued photo/i })).not.toBeInTheDocument();
  });

  it('preserves earlier photo turns while later text-only and later photo turns keep full context', async () => {
    const user = userEvent.setup();
    const sendTurn = vi.fn()
      .mockResolvedValueOnce({ text: 'First response' })
      .mockResolvedValueOnce({ text: 'Second response' })
      .mockResolvedValueOnce({ text: 'Third response' });
    loadPhotoFilesMock.mockResolvedValueOnce([
      { id: 'upload-1', base64: 'upload-photo', createdAt: 1700000000000, source: 'upload' },
    ]);

    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn }}
      />,
    );

    await user.upload(
      screen.getByLabelText(/upload photos/i),
      new File(['photo-1'], 'panel-1.png', { type: 'image/png' }),
    );

    await waitFor(() => {
      expect(screen.getByRole('img', { name: /queued photo 1/i })).toBeInTheDocument();
    });
    expect(screen.getByText('0 photos in context')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/ask about your photos/i), 'What do you see?');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(await screen.findByText('First response')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /open photo/i })).toHaveLength(1);
    expect(screen.getByText('1 photo in context')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/ask about your photos/i), 'Anything else?');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(await screen.findByText('Second response')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /open photo/i })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /add photo/i }));
    expect(screen.getByText('Photo Capture Mock')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /confirm captured photo/i }));

    expect(screen.queryByText('Photo Capture Mock')).not.toBeInTheDocument();
    expect(screen.getByText('1 photo in context')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /queued photo 1/i })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/ask about your photos/i), 'And now?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(sendTurn).toHaveBeenNthCalledWith(2, expect.objectContaining({
      images: ['upload-photo'],
    }));
    expect(sendTurn).toHaveBeenNthCalledWith(3, expect.objectContaining({
      images: ['upload-photo', 'camera-photo'],
      history: [
        { role: 'user', text: 'What do you see?' },
        { role: 'ai', text: 'First response' },
        { role: 'user', text: 'Anything else?' },
        { role: 'ai', text: 'Second response' },
      ],
    }));
    expect(await screen.findByText('Third response')).toBeInTheDocument();
    expect(screen.getByText('What do you see?')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /open photo/i })).toHaveLength(2);
    expect(screen.getByText('2 photos in context')).toBeInTheDocument();
  });

  it('opens an inline historical photo in a full-screen preview', async () => {
    const user = userEvent.setup();
    const sendTurn = vi.fn().mockResolvedValue({ text: 'Looks normal.' });
    loadPhotoFilesMock.mockResolvedValueOnce([
      { id: 'upload-1', base64: 'preview-photo', createdAt: 1700000000000, source: 'upload' },
    ]);

    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn }}
      />,
    );

    await user.upload(
      screen.getByLabelText(/upload photos/i),
      new File(['photo-1'], 'panel-1.png', { type: 'image/png' }),
    );

    await user.type(screen.getByPlaceholderText(/ask about your photos/i), 'How does this look?');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(await screen.findByText('Looks normal.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open photo 1/i }));

    expect(screen.getByRole('dialog', { name: /photo preview/i })).toBeInTheDocument();
    expect(screen.getByAltText(/full-screen photo preview/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove photo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /replace photo/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close photo preview/i }));
    expect(screen.queryByRole('dialog', { name: /photo preview/i })).not.toBeInTheDocument();
    expect(screen.getByText('How does this look?')).toBeInTheDocument();
  });

  it('allows removing queued photos before send', async () => {
    const user = userEvent.setup();
    const sendTurn = vi.fn().mockResolvedValue({ text: 'Looks good.' });
    loadPhotoFilesMock.mockResolvedValueOnce([
      { id: 'upload-1', base64: 'preview-photo-1', createdAt: 1700000000000, source: 'upload' },
      { id: 'upload-2', base64: 'preview-photo-2', createdAt: 1700000000001, source: 'upload' },
    ]);

    render(
      <PhotoChatView
        onEnd={() => {}}
        client={{ sendTurn }}
      />,
    );

    await user.upload(
      screen.getByLabelText(/upload photos/i),
      [
        new File(['photo-1'], 'panel-1.png', { type: 'image/png' }),
        new File(['photo-2'], 'panel-2.png', { type: 'image/png' }),
      ],
    );

    await waitFor(() => {
      expect(screen.getAllByRole('img', { name: /queued photo/i })).toHaveLength(2);
    });

    await user.click(screen.getByRole('button', { name: /remove queued photo 2/i }));

    expect(screen.getAllByRole('img', { name: /queued photo/i })).toHaveLength(1);

    await user.type(screen.getByPlaceholderText(/ask about your photos/i), 'What now?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(sendTurn).toHaveBeenCalledWith(expect.objectContaining({
      images: ['preview-photo-1'],
    }));
    expect(screen.getByText('1 photo in context')).toBeInTheDocument();
  });
});
