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
          DEFAULT: '#E07A5F',
          hover: '#C45B3F',
          light: '#FDF1ED',
          soft: '#F4A261',
        },
        secondary: {
          DEFAULT: '#3D405B',
          hover: '#2D3045',
          light: '#E8E9F0',
        },
        accent: {
          DEFAULT: '#F2CC8F',
          hover: '#E6B96B',
          light: '#FDF6EC',
        },
        success: {
          DEFAULT: '#81B29A',
          hover: '#6A9B83',
          light: '#E8F5EE',
        },
        info: {
          DEFAULT: '#8AB6F9',
          hover: '#6A9EE6',
          light: '#EDF4FF',
        },
        warning: {
          DEFAULT: '#F4A261',
          hover: '#E08C4A',
          light: '#FDF4EC',
        },
        danger: {
          DEFAULT: '#E76F51',
          hover: '#D45A3C',
          light: '#FDEBE7',
        },
        surface: '#FFFFFF',
        background: '#FDF6EC',
        'text-primary': '#3D405B',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
        'border': '#F0E6D8',
        'sidebar-bg': '#FFFFFF',
        'sidebar-text': '#3D405B',
        'sidebar-active': '#E07A5F',
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', '"Hiragino Sans GB"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"STSong"', '"Songti SC"', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -4px rgba(224, 122, 95, 0.08)',
        'card': '0 2px 12px rgba(61, 64, 91, 0.06)',
        'hover': '0 8px 24px rgba(224, 122, 95, 0.12)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      }
    },
  },
  plugins: [],
}
