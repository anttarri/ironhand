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

  it('sends all attached photos with a message', async () => {
    const sendTurn = vi.fn()
      .mockResolvedValueOnce({ text: 'First response' });

    const { result } = renderHook(() => useGeminiPhotoChat({ client: { sendTurn } }));

    await act(async () => {
      result.current.addPhotos([
        makePhoto('photo-1'),
        makePhoto('photo-2'),
        makePhoto('photo-3'),
        makePhoto('photo-4'),
        makePhoto('photo-5'),
      ]);
    });

    await act(async () => {
      await result.current.sendText('What do you see?');
    });

    expect(sendTurn).toHaveBeenCalledWith(expect.objectContaining({
      text: 'What do you see?',
      images: [
        'photo-1-data',
        'photo-2-data',
        'photo-3-data',
        'photo-4-data',
        'photo-5-data',
      ],
    }));
  });

  it('resends the full attached photo set on later turns after more photos are added', async () => {
    const sendTurn = vi.fn()
      .mockResolvedValueOnce({ text: 'First response' })
      .mockResolvedValueOnce({ text: 'Second response' });

    const { result } = renderHook(() => useGeminiPhotoChat({ client: { sendTurn } }));

    await act(async () => {
      result.current.addPhotos([makePhoto('photo-1')]);
      await result.current.sendText('First question');
    });

    await act(async () => {
      result.current.addPhotos([makePhoto('photo-2')]);
      await result.current.sendText('Follow-up question');
    });

    expect(sendTurn).toHaveBeenNthCalledWith(2, expect.objectContaining({
      text: 'Follow-up question',
      images: ['photo-1-data', 'photo-2-data'],
      history: [
        { role: 'user', text: 'First question' },
        { role: 'ai', text: 'First response' },
      ],
    }));
  });

  it('rejects photos above the five-photo cap', async () => {
    const sendTurn = vi.fn();
    const { result } = renderHook(() => useGeminiPhotoChat({ client: { sendTurn } }));

    let addResult: { added: number; rejected: number } | undefined;

    await act(async () => {
      result.current.addPhotos([
        makePhoto('photo-1'),
        makePhoto('photo-2'),
        makePhoto('photo-3'),
        makePhoto('photo-4'),
        makePhoto('photo-5'),
      ]);
      addResult = result.current.addPhotos([makePhoto('photo-6')]);
    });

    expect(result.current.photos).toHaveLength(5);
    expect(addResult).toEqual({ added: 0, rejected: 1 });
  });

  it('stores failed turn and retries it with the same photos', async () => {
    const sendTurn = vi.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ text: 'Recovered response' });

    const { result } = renderHook(() => useGeminiPhotoChat({ client: { sendTurn } }));

    await act(async () => {
      result.current.addPhotos([makePhoto('photo-1'), makePhoto('photo-2')]);
      await result.current.sendText('Need help');
    });

    expect(result.current.error).toBe('temporary failure');

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
