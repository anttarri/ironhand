// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAnalysisAnimation } from '../../src/hooks/useAnalysisAnimation';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAnalysisAnimation', () => {
  it('starts idle when inactive', () => {
    const { result } = renderHook(() =>
      useAnalysisAnimation({ isActive: false }),
    );

    expect(result.current.phase).toBe('idle');
    expect(result.current.isVisible).toBe(false);
  });

  it('transitions to focus when activated', () => {
    const { result } = renderHook(() =>
      useAnalysisAnimation({ isActive: true }),
    );

    expect(result.current.phase).toBe('focus');
    expect(result.current.isVisible).toBe(true);
  });

  it('transitions to study after 800ms', () => {
    const { result } = renderHook(() =>
      useAnalysisAnimation({ isActive: true }),
    );

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(result.current.phase).toBe('study');
    expect(result.current.isVisible).toBe(true);
  });

  it('stays in study while active', () => {
    const { result } = renderHook(() =>
      useAnalysisAnimation({ isActive: true }),
    );

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.phase).toBe('study');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.phase).toBe('study');
    expect(result.current.isVisible).toBe(true);
  });

  it('transitions to resolve when deactivated during study', () => {
    const { result, rerender } = renderHook(
      ({ isActive }) => useAnalysisAnimation({ isActive }),
      { initialProps: { isActive: true } },
    );

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.phase).toBe('study');

    rerender({ isActive: false });

    expect(result.current.phase).toBe('resolve');
    expect(result.current.isVisible).toBe(true);
  });

  it('transitions to resolve when deactivated during focus', () => {
    const { result, rerender } = renderHook(
      ({ isActive }) => useAnalysisAnimation({ isActive }),
      { initialProps: { isActive: true } },
    );

    expect(result.current.phase).toBe('focus');

    rerender({ isActive: false });

    expect(result.current.phase).toBe('resolve');
    expect(result.current.isVisible).toBe(true);
  });

  it('transitions to done after resolve completes (400ms)', () => {
    const { result, rerender } = renderHook(
      ({ isActive }) => useAnalysisAnimation({ isActive }),
      { initialProps: { isActive: true } },
    );

    act(() => {
      vi.advanceTimersByTime(800);
    });

    rerender({ isActive: false });
    expect(result.current.phase).toBe('resolve');

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.phase).toBe('done');
    expect(result.current.isVisible).toBe(false);
  });

  it('calls onComplete when reaching done', () => {
    const onComplete = vi.fn();
    const { result, rerender } = renderHook(
      ({ isActive }) => useAnalysisAnimation({ isActive, onComplete }),
      { initialProps: { isActive: true } },
    );

    act(() => {
      vi.advanceTimersByTime(800);
    });

    rerender({ isActive: false });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.phase).toBe('done');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('can restart after done', () => {
    const { result, rerender } = renderHook(
      ({ isActive }) => useAnalysisAnimation({ isActive }),
      { initialProps: { isActive: true } },
    );

    // Complete full cycle
    act(() => {
      vi.advanceTimersByTime(800);
    });
    rerender({ isActive: false });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current.phase).toBe('done');

    // Restart
    rerender({ isActive: true });

    expect(result.current.phase).toBe('focus');
    expect(result.current.isVisible).toBe(true);
  });

  it('cleans up timers on unmount', () => {
    const { unmount } = renderHook(() =>
      useAnalysisAnimation({ isActive: true }),
    );

    unmount();

    // Should not throw or leave dangling timers
    act(() => {
      vi.advanceTimersByTime(2000);
    });
  });
});
