/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'tt-fors': ['TT_Fors_Medium', 'sans-serif']
      }
    }
  },
  plugins: [],
}

