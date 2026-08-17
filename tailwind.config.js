/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0F2318',
          900: '#16341F',
          800: '#1E4429',
          700: '#2B5936',
        },
        brass: {
          400: '#E8B33D',
          500: '#D9A441',
          600: '#B9860F',
        },
        paper: '#F6F7EE',
        sage: {
          500: '#4C9A6A',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(11,18,32,0.06), 0 8px 24px -8px rgba(11,18,32,0.12)',
      },
    },
  },
  plugins: [],
}
