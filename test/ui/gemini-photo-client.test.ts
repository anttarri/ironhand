// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PhotoChatRequestError, sendTurn } from '../../src/services/geminiPhotoClient';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('geminiPhotoClient.sendTurn', () => {
  it('sends image + text on first turn and returns AI text', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: 'test-key' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Looks like a 20A breaker on 12 AWG.' }],
              },
            },
          ],
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const result = await sendTurn({
      text: 'What do you see?',
      imageBase64: 'photo-data',
      includeImage: true,
      history: [],
    });

    expect(result.text).toBe('Looks like a 20A breaker on 12 AWG.');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const requestBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    const parts = requestBody.contents[0].parts;
    expect(parts[0].inline_data.mime_type).toBe('image/jpeg');
    expect(parts[0].inline_data.data).toBe('photo-data');
    expect(parts[1].text).toBe('What do you see?');
  });

  it('sends text-only follow-up turns with prior history', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: 'test-key' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Check if that neutral is landed properly.' }],
              },
            },
          ],
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    await sendTurn({
      text: 'What next?',
      includeImage: false,
      history: [
        { role: 'user', text: 'What do you see?' },
        { role: 'ai', text: 'You have a crowded neutral bar.' },
      ],
    });

    const requestBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(requestBody.contents).toEqual([
      {
        role: 'user',
        parts: [{ text: 'What do you see?' }],
      },
      {
        role: 'model',
        parts: [{ text: 'You have a crowded neutral bar.' }],
      },
      {
        role: 'user',
        parts: [{ text: 'What next?' }],
      },
    ]);
  });

  it('maps API failures to retryable PhotoChatRequestError', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: 'test-key' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: { message: 'Service unavailable' } }),
      });

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendTurn({
        text: 'hello',
        includeImage: false,
        history: [],
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<PhotoChatRequestError>>({
        name: 'PhotoChatRequestError',
        retryable: true,
      }),
    );
  });
});
