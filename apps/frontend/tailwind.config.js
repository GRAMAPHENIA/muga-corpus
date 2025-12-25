/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        base: "#0f0f0f",
        ink: "#f7f4ef",
        accent: "#b0172f",
        inkMuted: "#9a958c",
        line: "#2c2c2c"
      }
    }
  },
  corePlugins: {
    borderRadius: false,
    boxShadow: false
  }
};
