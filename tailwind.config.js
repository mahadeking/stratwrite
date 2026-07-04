/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
      colors: {
        // Indigo → violet modern accent
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Violet companion for gradients
        violetish: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d4d8e0',
          300: '#aeb5c4',
          400: '#828ca3',
          500: '#636e88',
          600: '#4e5770',
          700: '#40475b',
          800: '#373c4d',
          900: '#1f2333',
        },
        // Category accent colors (Grammarly-style)
        correctness: '#e5484d',
        clarity: '#3b82f6',
        engagement: '#12a150',
        delivery: '#8b5cf6',
      },
      boxShadow: {
        card: '0 1px 2px rgba(79,70,229,0.04), 0 6px 20px -6px rgba(79,70,229,0.08)',
        pop: '0 14px 44px -8px rgba(79,70,229,0.18), 0 6px 14px -6px rgba(79,70,229,0.10)',
        float: '0 30px 80px -20px rgba(99,80,200,0.30), 0 12px 32px -12px rgba(99,80,200,0.16)',
      },
      borderRadius: {
        '4xl': '28px',
      },
    },
  },
  plugins: [],
}
