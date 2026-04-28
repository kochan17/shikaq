/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        label: '#000000',
        secondaryLabel: '#3C3C4399',
        tertiaryLabel: '#3C3C434D',
        systemBackground: '#FFFFFF',
        secondarySystemBackground: '#F2F2F7',
        secondarySystemFill: 'rgba(120,120,128,0.16)',
        systemFill: 'rgba(120,120,128,0.20)',
        systemGroupedBackground: '#F2F2F7',
        separator: '#3C3C434A',

        systemBlue: '#0600FF',
        brandGradientStart: '#0600FF',
        brandGradientEnd: '#7A0085',
        systemGreen: '#34C759',
        systemOrange: '#FF9F0A',
        systemRed: '#FF3B30',
        systemTeal: '#64D2FF',
        systemIndigo: '#5E5CE6',
        systemAmber: '#FFD60A',
        systemRose: '#FF375F',

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
    },
  },
  plugins: [],
};
