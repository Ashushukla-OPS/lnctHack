/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        main: '#0f0f0f',
        card: '#1a1a1a',
        input: '#242424',
        primary: '#6366f1',
        accent: '#8b5cf6',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        'text-primary': '#f1f5f9',
        'text-muted': '#94a3b8',
        border: '#2e2e2e',
      }
    },
  },
  plugins: [],
}
