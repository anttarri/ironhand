import { vi } from 'vitest';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const forwardMotionDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>>(
    ({ children, initial, animate, exit, transition, variants, layout, layoutId, whileHover, whileTap, ...rest }, ref) => {
      return React.createElement('div', { ...rest, ref }, children);
    },
  );
  forwardMotionDiv.displayName = 'motion.div';

  return {
    motion: { div: forwardMotionDiv },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    LayoutGroup: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});
