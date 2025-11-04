/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f172a',
        'dark-sidebar': '#1e293b',
        'dark-content': '#111827',
        'teal-accent': '#14b8a6',
      }
    },
  },
  plugins: [],
}

