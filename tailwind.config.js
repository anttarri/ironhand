/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        charcoal: {
          DEFAULT: '#1a1a2e',
          50: '#2a2a42',
          100: '#222238',
          200: '#1e1e34',
          900: '#12121f',
        },
        'charcoal-light': '#25253e',
        'electric-blue': '#0066ff',
        amber: {
          300: '#ffc966',
          400: '#ffb340',
          500: '#ff9500',
          600: '#e68600',
          700: '#cc7700',
        },
        danger: '#ff3b30',
        success: '#2ecc71',
        surface: '#25253e',
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 300ms ease-out',
        'fade-slide-in': 'fadeSlideIn 400ms ease-out both',
        'scale-in': 'scaleIn 250ms ease-out',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'breathe': 'breathe 2s ease-in-out infinite',
        'logo-float': 'logoFloat 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeSlideIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        breathe: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 149, 0, 0.3)' },
          '50%': { boxShadow: '0 0 0 10px rgba(255, 149, 0, 0)' },
        },
        logoFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
