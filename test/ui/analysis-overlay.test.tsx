// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { AnalysisOverlay } from '../../src/components/AnalysisOverlay';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AnalysisOverlay', () => {
  it('renders nothing when inactive', () => {
    render(<AnalysisOverlay isActive={false} />);

    expect(screen.queryByTestId('analysis-overlay')).not.toBeInTheDocument();
  });

  it('renders overlay when active', () => {
    render(<AnalysisOverlay isActive={true} />);

    const overlay = screen.getByTestId('analysis-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('pointer-events-none');
  });

  it('has aria-hidden attribute', () => {
    render(<AnalysisOverlay isActive={true} />);

    expect(screen.getByTestId('analysis-overlay')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows status text when active', () => {
    render(<AnalysisOverlay isActive={true} />);

    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
  });

  it('hides after animation completes', () => {
    const { rerender } = render(<AnalysisOverlay isActive={true} />);

    expect(screen.getByTestId('analysis-overlay')).toBeInTheDocument();

    rerender(<AnalysisOverlay isActive={false} />);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.queryByTestId('analysis-overlay')).not.toBeInTheDocument();
  });
});
