// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useGeminiPhotoChat } from '../../src/hooks/useGeminiPhotoChat';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useGeminiPhotoChat', () => {
  it('includes image on first user turn and excludes it afterward', async () => {
    const sendTurn = vi.fn()
      .mockResolvedValueOnce({ text: 'First response' })
      .mockResolvedValueOnce({ text: 'Second response' });

    const { result } = renderHook(() => useGeminiPhotoChat({ photoBase64: 'photo-data', client: { sendTurn } }));

    await act(async () => {
      await result.current.sendText('What do you see?');
    });

    await act(async () => {
      await result.current.sendText('What should I do next?');
    });

    expect(sendTurn).toHaveBeenNthCalledWith(1, expect.objectContaining({
      text: 'What do you see?',
      includeImage: true,
      imageBase64: 'photo-data',
    }));

    expect(sendTurn).toHaveBeenNthCalledWith(2, expect.objectContaining({
      text: 'What should I do next?',
      includeImage: false,
    }));
  });

  it('stores failed turn and retries it', async () => {
    const sendTurn = vi.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ text: 'Recovered response' });

    const { result } = renderHook(() => useGeminiPhotoChat({ photoBase64: 'photo-data', client: { sendTurn } }));

    await act(async () => {
      await result.current.sendText('Need help');
    });

    expect(result.current.error).toBe('temporary failure');

    await act(async () => {
      await result.current.retry();
    });

    expect(sendTurn).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
    expect(result.current.messages[result.current.messages.length - 1]?.text).toBe('Recovered response');
  });

  it('ignores blank text submits', async () => {
    const sendTurn = vi.fn();
    const { result } = renderHook(() => useGeminiPhotoChat({ photoBase64: 'photo-data', client: { sendTurn } }));

    await act(async () => {
      await result.current.sendText('   ');
    });

    expect(sendTurn).not.toHaveBeenCalled();
  });
});
