/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand_400Regular'],
        input: ['Quicksand_500Medium'],
        heading: ['Quicksand_600SemiBold'],
        medium: ['Quicksand_500Medium'],
        semibold: ['Quicksand_600SemiBold'],
        bold: ['Quicksand_600SemiBold'],
      },
      colors: {        
        'gray-custom': '#666666',
        'purple-custom': '#8A318F',
        'blue-custom': '#066285',
        'blue-active': '#09204C',        
        'teal-custom': '#20B5C9',
        'green-custom': '#A6E3E3',
        'orange-custom': '#F7941D',
        'yellow-custom': '#F9CB28',
      }
    },
  },
  plugins: [],
};
