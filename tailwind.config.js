/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  // `hover:` styles only apply on devices with a real hover pointer (desktop),
  // so touch devices don't get sticky hover states while scrolling.
  future: { hoverOnlyWhenSupported: true },
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
