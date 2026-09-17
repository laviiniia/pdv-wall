import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultConfig';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      colors: {
        // Primary Blue
        primary: {
          50: '#E6F0FF',
          100: '#B3D9FF',
          200: '#80C3FF',
          300: '#4DAEFF',
          400: '#1A98FF',
          500: '#0066CC',
          600: '#0052A3',
          700: '#003D7A',
          800: '#002952',
          900: '#001429',
        },
        // Secondary Green
        secondary: {
          50: '#E6F7F0',
          100: '#B3E8D6',
          200: '#80DABD',
          300: '#4DCBA3',
          400: '#1ABD8A',
          500: '#00AA66',
          600: '#008C52',
          700: '#006E3F',
          800: '#50522B',
          900: '#003118',
        },
        // Semantic
        danger: '#DC3545',
        warning: '#FFC107',
        info: '#17A2B8',
        success: '#28A745',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideIn: 'slideIn 0.3s ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
