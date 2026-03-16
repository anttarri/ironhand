// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useGeminiPhotoChat } from '../../src/hooks/useGeminiPhotoChat';
import type { CapturedPhoto } from '../../src/types';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useGeminiPhotoChat', () => {
  function makePhoto(id: string): CapturedPhoto {
    return {
      id,
      base64: `${id}-data`,
      createdAt: 1700000000000,
      source: 'upload',
    };
  }

  it('queues photos separately from committed context until the user sends', async () => {
    const sendTurn = vi.fn();
    const { result } = renderHook(() => useGeminiPhotoChat({ client: { sendTurn } }));

    let queueResult: { added: number; rejected: number } | undefined;

    await act(async () => {
      queueResult = result.current.queuePhotos([
        makePhoto('photo-1'),
        makePhoto('photo-2'),
      ]);
    });

    expect(queueResult).toEqual({ added: 2, rejected: 0 });
    expect(result.current.contextPhotos).toEqual([]);
    expect(result.current.queuedPhotos).toEqual([
      makePhoto('photo-1'),
      makePhoto('photo-2'),
    ]);
    expect(sendTurn).not.toHaveBeenCalled();
  });

  it('removes a queued photo before send and excludes it from the next payload', async () => {
    const sendTurn = vi.fn()
      .mockResolvedValueOnce({ text: 'First response' });

    const { result } = renderHook(() => useGeminiPhotoChat({ client: { sendTurn } }));

    await act(async () => {
      result.current.queuePhotos([
        makePhoto('photo-1'),
        makePhoto('photo-2'),
      ]);
      result.current.removeQueuedPhoto('photo-2');
      await result.current.sendText('What do you see?');
    });

    expect(sendTurn).toHaveBeenCalledWith(expect.objectContaining({
      text: 'What do you see?',
      images: ['photo-1-data'],
    }));
    expect(result.current.messages[0]).toEqual(expect.objectContaining({
      role: 'user',
      text: 'What do you see?',
      photos: [makePhoto('photo-1')],
    }));
    expect(result.current.contextPhotos).toEqual([makePhoto('photo-1')]);
    expect(result.current.queuedPhotos).toEqual([]);
  });

  it('commits queued photos on send and preserves accumulated context on later turns', async () => {
    const sendTurn = vi.fn()
      .mockResolvedValueOnce({ text: 'First response' })
      .mockResolvedValueOnce({ text: 'Second response' })
      .mockResolvedValueOnce({ text: 'Third response' });

    const { result } = renderHook(() => useGeminiPhotoChat({ client: { sendTurn } }));

    await act(async () => {
      result.current.queuePhotos([makePhoto('photo-1')]);
      await result.current.sendText('First question');
    });

    expect(result.current.contextPhotos).toEqual([makePhoto('photo-1')]);
    expect(result.current.queuedPhotos).toEqual([]);

    await act(async () => {
      await result.current.sendText('Follow-up question');
    });

    await act(async () => {
      result.current.queuePhotos([makePhoto('photo-2')]);
      await result.current.sendText('And now?');
    });

    expect(sendTurn).toHaveBeenNthCalledWith(1, expect.objectContaining({
      text: 'First question',
      images: ['photo-1-data'],
    }));
    expect(sendTurn).toHaveBeenNthCalledWith(2, expect.objectContaining({
      text: 'Follow-up question',
      images: ['photo-1-data'],
      history: [
        { role: 'user', text: 'First question' },
        { role: 'ai', text: 'First response' },
      ],
    }));
    expect(sendTurn).toHaveBeenNthCalledWith(3, expect.objectContaining({
      text: 'And now?',
      images: ['photo-1-data', 'photo-2-data'],
      history: [
        { role: 'user', text: 'First question' },
        { role: 'ai', text: 'First response' },
        { role: 'user', text: 'Follow-up question' },
        { role: 'ai', text: 'Second response' },
      ],
    }));

    expect(result.current.messages[0]).toEqual(expect.objectContaining({
      text: 'First question',
      photos: [makePhoto('photo-1')],
    }));
    expect(result.current.messages[2]).toEqual(expect.objectContaining({
      text: 'Follow-up question',
      photos: undefined,
    }));
    expect(result.current.messages[4]).toEqual(expect.objectContaining({
      text: 'And now?',
      photos: [makePhoto('photo-2')],
    }));
    expect(result.current.contextPhotos).toEqual([makePhoto('photo-1'), makePhoto('photo-2')]);
    expect(result.current.queuedPhotos).toEqual([]);
  });

  it('rejects photos above the five-photo cap across committed and queued photos', async () => {
    const sendTurn = vi.fn();
    const { result } = renderHook(() => useGeminiPhotoChat({ client: { sendTurn } }));

    let queueResult: { added: number; rejected: number } | undefined;

    await act(async () => {
      result.current.queuePhotos([
        makePhoto('photo-1'),
        makePhoto('photo-2'),
      ]);
      await result.current.sendText('First question');
    });

    await act(async () => {
      queueResult = result.current.queuePhotos([
        makePhoto('photo-3'),
        makePhoto('photo-4'),
        makePhoto('photo-5'),
        makePhoto('photo-6'),
      ]);
    });

    expect(result.current.contextPhotos).toEqual([
      makePhoto('photo-1'),
      makePhoto('photo-2'),
    ]);
    expect(result.current.queuedPhotos).toEqual([
      makePhoto('photo-3'),
      makePhoto('photo-4'),
      makePhoto('photo-5'),
    ]);
    expect(queueResult).toEqual({ added: 3, rejected: 1 });
  });

  it('retries a failed turn with its stored photos without restoring them to the queue', async () => {
    const sendTurn = vi.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ text: 'Recovered response' });

    const { result } = renderHook(() => useGeminiPhotoChat({ client: { sendTurn } }));

    await act(async () => {
      result.current.queuePhotos([makePhoto('photo-1'), makePhoto('photo-2')]);
      await result.current.sendText('Need help');
    });

    expect(result.current.error).toBe('temporary failure');
    expect(result.current.messages[0]).toEqual(expect.objectContaining({
      text: 'Need help',
      photos: [makePhoto('photo-1'), makePhoto('photo-2')],
      error: 'temporary failure',
    }));
    expect(result.current.contextPhotos).toEqual([makePhoto('photo-1'), makePhoto('photo-2')]);
    expect(result.current.queuedPhotos).toEqual([]);

    await act(async () => {
      await result.current.retry();
    });

    expect(sendTurn).toHaveBeenCalledTimes(2);
    expect(sendTurn).toHaveBeenNthCalledWith(2, expect.objectContaining({
      text: 'Need help',
      images: ['photo-1-data', 'photo-2-data'],
    }));
    expect(result.current.error).toBeNull();
    expect(result.current.messages[result.current.messages.length - 1]?.text).toBe('Recovered response');
    expect(result.current.queuedPhotos).toEqual([]);
  });

  it('ignores blank text submits', async () => {
    const sendTurn = vi.fn();
    const { result } = renderHook(() => useGeminiPhotoChat({ client: { sendTurn } }));

    await act(async () => {
      await result.current.sendText('   ');
    });

    expect(sendTurn).not.toHaveBeenCalled();
  });
});
