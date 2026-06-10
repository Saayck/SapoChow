/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1e3a5f',
          hover: '#254d7f',
          active: '#2d6aad',
        },
      },
    },
  },
  plugins: [],
}
