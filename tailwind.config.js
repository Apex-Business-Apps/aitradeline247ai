/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html","./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        brandOrange: "#FFB347",
        brandBlue: "#1E3A8A"
      },
      fontFamily: {
        brand: ["Freight Text","Georgia","Times New Roman","serif"]
      }
    }
  },
  plugins: []
};