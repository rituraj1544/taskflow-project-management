/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17233b', muted: '#778198', line: '#e9edf3', canvas: '#f6f8fb',
        brand: { 50: '#eef3ff', 100: '#dce7ff', 500: '#4169f5', 600: '#3155dc', 700: '#2947bb' },
        navy: '#111b31', mint: '#39c7a4', coral: '#ff7c6d', amber: '#f5b94c', violet: '#8872ed',
      },
      fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Manrope', 'sans-serif'] },
      boxShadow: { card: '0 10px 35px rgba(24, 42, 78, .045)', lift: '0 16px 40px rgba(24, 42, 78, .11)' },
      borderRadius: { '2.5xl': '1.25rem' },
    },
  },
  plugins: [],
};
