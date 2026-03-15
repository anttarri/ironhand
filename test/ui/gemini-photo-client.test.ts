// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PhotoChatRequestError, sendTurn } from '../../src/services/geminiPhotoClient';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('geminiPhotoClient.sendTurn', () => {
  it('sends all attached images before the current text turn and returns AI text', async () => {
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
      images: ['photo-1', 'photo-2', 'photo-3'],
      history: [],
    });

    expect(result.text).toBe('Looks like a 20A breaker on 12 AWG.');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const requestBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    const parts = requestBody.contents[0].parts;
    expect(parts[0].inline_data.mime_type).toBe('image/jpeg');
    expect(parts[0].inline_data.data).toBe('photo-1');
    expect(parts[1].inline_data.data).toBe('photo-2');
    expect(parts[2].inline_data.data).toBe('photo-3');
    expect(parts[3].text).toBe('What do you see?');
  });

  it('resends all attached images on follow-up turns together with prior history', async () => {
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
      images: ['photo-1', 'photo-2'],
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
        parts: [
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: 'photo-1',
            },
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: 'photo-2',
            },
          },
          { text: 'What next?' },
        ],
      },
    ]);
  });

  it('supports text-only turns when no photos are attached', async () => {
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
                parts: [{ text: 'Need a closer look.' }],
              },
            },
          ],
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    await sendTurn({
      text: 'Can you help?',
      images: [],
      history: [],
    });

    const requestBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(requestBody.contents).toEqual([
      {
        role: 'user',
        parts: [{ text: 'Can you help?' }],
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
        images: [],
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
