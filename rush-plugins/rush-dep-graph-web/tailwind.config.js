const path = require('path');

module.exports = {
  mode: 'jit',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  purge: [
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx,html}'),
    // ...createGlobPatternsForDependencies(__dirname),
  ],
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        black: 'hsla(0, 0%, 13%, 1)',
        blue: {
          'dark': 'hsla(214, 61%, 11%, 1)',
          'base': 'hsla(214, 62%, 21%, 1)',
        },
        green: {
          'base': 'hsla(162, 47%, 50%, 1)',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            'code::before': {
              content: '',
            },
            'code::after': {
              content: '',
            },
            'blockquote p:first-of-type::before': {
              content: '',
            },
            'blockquote p:last-of-type::after': {
              content: '',
            },
          },
        },
      },
    },
  },
  variants: {
    extend: {
      translate: ['group-hover'],
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
