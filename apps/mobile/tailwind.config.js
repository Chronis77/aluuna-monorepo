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
        'purple-custom': '#7B61FF',
        'blue-custom': '#3D91D7',
        'blue-active': '#2566A6',        
        'teal-custom': '#0FB5BA',
        'green-custom': '#9FD070',
        'orange-custom': '#F7941D',
        'yellow-custom': '#F9CB28',
      }
    },
  },
  plugins: [],
};
