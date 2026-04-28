/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Apple iOS-style semantic system tokens
        label: '#000000',
        secondaryLabel: '#3C3C4399',
        tertiaryLabel: '#3C3C434D',
        systemBackground: '#FFFFFF',
        secondarySystemBackground: '#F2F2F7',
        systemGroupedBackground: '#F2F2F7',
        separator: '#3C3C434A',
        hairline: 'rgba(0,0,0,0.1)',

        // Semantic action colors
        systemBlue: '#007AFF',
        systemGreen: '#34C759',
        systemOrange: '#FF9F0A',
        systemRed: '#FF3B30',
        systemTeal: '#64D2FF',
        systemIndigo: '#5E5CE6',
        systemAmber: '#FFD60A',
        systemRose: '#FF375F',

        // Per-certification tinted glass accents (4 active)
        itPassport: '#64D2FF',
        fe: '#5E5CE6',
        spi: '#FFD60A',
        boki: '#FF375F',
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'Hiragino Sans', 'sans-serif'],
        symbol: ['Material Symbols Outlined'],
      },
    },
  },
  plugins: [],
};
