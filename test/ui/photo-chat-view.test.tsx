// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const useAudioSpy = vi.hoisted(() => vi.fn());

vi.mock('../../src/hooks/useAudio', () => ({
  useAudio: useAudioSpy,
}));

import { PhotoChatView } from '../../src/components/PhotoChatView';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PhotoChatView', () => {
  it('renders the captured photo and omits live voice controls', () => {
    render(
      <PhotoChatView
        photo={{ base64: 'abc123', createdAt: 1700000000000 }}
        onEnd={() => {}}
        client={{ sendTurn: vi.fn().mockResolvedValue({ text: 'ok' }) }}
      />, 
    );

    const image = screen.getByRole('img', { name: /captured photo/i });
    expect(image).toHaveAttribute('src', expect.stringContaining('abc123'));

    expect(screen.queryByRole('button', { name: /mute/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /turn camera/i })).not.toBeInTheDocument();
    expect(useAudioSpy).not.toHaveBeenCalled();
  });

  it('sends composer text and appends ai response', async () => {
    const user = userEvent.setup();
    const sendTurn = vi.fn().mockResolvedValue({ text: 'Start with verifying the breaker is off.' });

    render(
      <PhotoChatView
        photo={{ base64: 'abc123', createdAt: 1700000000000 }}
        onEnd={() => {}}
        client={{ sendTurn }}
      />,
    );

    await user.type(screen.getByPlaceholderText(/ask about this photo/i), 'What is my next step?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(sendTurn).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Start with verifying the breaker is off.')).toBeInTheDocument();
  });
});
