/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f4',
          100: '#dbf0e3',
          200: '#b9e1cb',
          300: '#8bcbac',
          400: '#5aad88',
          500: '#14482d',
          600: '#12472f',
          700: '#0f3827',
          800: '#0d2d20',
          900: '#0b251b',
        },
        secondary: {
          50: '#fef4f2',
          100: '#fde8e3',
          200: '#fbd5cc',
          300: '#f8b8a8',
          400: '#f49174',
          500: '#de5e2b',
          600: '#c94f20',
          700: '#a8401a',
          800: '#8a3516',
          900: '#722d13',
        },
      }
    },
  },
  plugins: [],
}
