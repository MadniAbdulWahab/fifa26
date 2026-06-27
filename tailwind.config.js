/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16a34a',
          dark: '#15803d',
        },
        pitch: '#0b3d2e',
      },
      keyframes: {
        pulseLive: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'pulse-live': 'pulseLive 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
