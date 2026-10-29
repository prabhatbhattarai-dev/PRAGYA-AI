/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.05), 0 16px 40px rgba(96, 165, 250, 0.12)',
      },
      colors: {
        ink: '#08111f',
        panel: '#101827',
        slatebg: '#0f172a',
        accent: {
          cyan: '#67e8f9',
          violet: '#8b5cf6',
        },
      },
    },
  },
  plugins: [],
};
