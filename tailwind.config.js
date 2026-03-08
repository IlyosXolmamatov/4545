/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        // 🟠 Brand Color - Basand Orange
        basand: {
          50: '#fffbf5',
          100: '#fef3e2',
          200: '#fce7c8',
          300: '#fab290',
          400: '#f97316',  // PRIMARY
          500: '#ea580c',
          600: '#c2410c',
          700: '#9a2e0e',
          800: '#7c2410',
          900: '#66200d',
        },

        // 🟦 Status Colors
        'status-success': {
          light: '#dcfce7',
          DEFAULT: '#22c55e',
          dark: '#15803d',
        },
        'status-error': {
          light: '#fee2e2',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        'status-warning': {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        'status-info': {
          light: '#dbeafe',
          DEFAULT: '#3b82f6',
          dark: '#1d4ed8',
        },

        // Dark Mode Palette
        'dark-bg': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },

        'dark-text': {
          primary: '#f8fafc',
          secondary: '#cbd5e1',
          tertiary: '#94a3b8',
        },
      },

      backgroundColor: {
        'dark-primary': '#0f172a',
        'dark-secondary': '#1e293b',
        'dark-tertiary': '#334155',
        'light-primary': '#ffffff',
        'light-secondary': '#f8fafc',
        'light-tertiary': '#f1f5f9',
      },

      textColor: {
        'dark-primary': '#f8fafc',
        'dark-secondary': '#cbd5e1',
        'light-primary': '#0f172a',
        'light-secondary': '#475569',
      },

      borderColor: {
        'dark-light': '#334155',
        'light-light': '#e2e8f0',
      },

      boxShadow: {
        'dark-sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
        'dark-md': '0 4px 6px rgba(0, 0, 0, 0.5)',
        'dark-lg': '0 10px 15px rgba(0, 0, 0, 0.5)',
        'light-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'light-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'light-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
      },

      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        'gradient-success-light': 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        'gradient-error-light': 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        'gradient-warning-light': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        'gradient-success-dark': 'linear-gradient(135deg, #15803d 0%, #0f5d2f 100%)',
        'gradient-error-dark': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        'gradient-warning-dark': 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
      },
    },
  },
  safelist: [
    { pattern: /^ring-basand-/, variants: ['focus', 'focus-within'] },
    { pattern: /^border-t-basand-/ },
    { pattern: /^border-basand-/, variants: ['focus'] },
    { pattern: /^bg-basand-/ },
    { pattern: /^text-basand-/ },
  ],
  plugins: [],
}
