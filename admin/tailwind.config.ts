import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0E0F12',
        surface: '#16181D',
        accent: '#F2C14E',
        danger: '#E5484D',
        success: '#5EC26A',
        'text-primary': '#F1F0EF',
        muted: '#7E7E7E',
      },
    },
  },
  plugins: [],
};

export default config;
