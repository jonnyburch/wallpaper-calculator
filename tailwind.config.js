module.exports = {
  purge: ['index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        lq: {
          beige: "hsl(30,62%,96%)",
          darkbeige: "hsl(30,62%,92%)",
          textbeige: "hsl(30,22%,32%)",
          darkgreen: "rgb(81, 86, 53)"
        }
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
