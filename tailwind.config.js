/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bed: {
          free: '#22c55e',
          reserved: '#eab308',
          occupied: '#ef4444',
          maintenance: '#9ca3af',
        },
      },
    },
  },
  plugins: [],
}
