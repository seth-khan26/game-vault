import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        surface: '#111113',
        elevated: '#18181B',
        'primary-text': '#F4F4F5',
        'muted-text': '#A1A1AA',
        accent: '#7C3AED',
        'accent-hover': '#6D28D9',
        success: '#22C55E',
        danger: '#EF4444',
        border: '#27272A',
      },
      borderColor: {
        DEFAULT: '#27272A',
      },
    },
  },
  plugins: [],
}
export default config
