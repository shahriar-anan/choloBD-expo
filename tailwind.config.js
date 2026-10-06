/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light
        primary: '#0066FF',
        onPrimary: '#FFFFFF',
        'on-primary': '#FFFFFF',
        secondary: '#7C3AED',
        accent: '#06B6D4',
        background: '#F5F7FB',
        surface: '#FFFFFF',
        'surface-2': '#F1F5F9',
        text: '#0F172A',
        muted: '#475569',
        border: '#E6E9EE',
        success: '#16A34A',
        warning: '#F59E0B',
        error: '#DC2626',

        // Dark (neutral charcoal — removes navy cast so accents pop)
        'primary-dark': '#5DADE2',
        'on-primary-dark': '#FFFFFF',
        'secondary-dark': '#E0AAFF',
        'on-secondary-dark': '#1F1F3D',
        'accent-dark': '#4FD1E8',
        'background-dark': '#0C0C0F',
        'surface-dark': '#18191E',
        'surface-2-dark': '#23252D',
        'text-dark': '#F0F4F8',
        'muted-dark': '#9CA3AF',
        'border-dark': '#32353F',
        'success-dark': '#4ADE80',
        'warning-dark': '#FBBF24',
        'error-dark': '#FF6B6B',
      },
      fontFamily: {
        body: ['System'],
        heading: ['System'],
        mono: ['Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};