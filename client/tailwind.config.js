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
          DEFAULT: '#0891B2',
          hover: '#0E7490',
          light: '#ECFEFF',
        },
        secondary: '#22D3EE',
        cta: {
          DEFAULT: '#059669',
          hover: '#047857',
        },
        surface: '#FFFFFF',
        'text-primary': '#164E63',
        'text-secondary': '#475569',
        'text-muted': '#94A3B8',
        'sidebar-bg': '#0F172A',
        'sidebar-text': '#CBD5E1',
        'sidebar-active': '#0891B2',
        danger: {
          DEFAULT: '#DC2626',
          hover: '#B91C1C',
        },
        warning: '#D97706',
        success: '#059669',
      },
    },
  },
  plugins: [],
}
