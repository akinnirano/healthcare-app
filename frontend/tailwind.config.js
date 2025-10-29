module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}','./index.html'],
  safelist: [
    { pattern: /(bg|text|border)-(gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900)/ },
  ],
  theme: { extend: {} },
  plugins: [],
}
