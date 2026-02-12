/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#1a1a2e',
        'charcoal-light': '#25253e',
        'electric-blue': '#0066ff',
        amber: {
          400: '#ffb340',
          500: '#ff9500',
          600: '#e68600',
        },
        danger: '#ff3b30',
        surface: '#25253e',
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};
