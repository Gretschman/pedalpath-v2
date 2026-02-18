/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EBF4FD',
          100: '#D6E9FB',
          200: '#ADD3F7',
          300: '#85BDF3',
          400: '#5CA7EF',
          500: '#3498DB',
          600: '#2E86DE', // LEGO Classic Blue — primary actions
          700: '#2168BC',
          800: '#184F96',
          900: '#0F3670',
          950: '#081E46',
        },
      },
    },
  },
  plugins: [],
}
