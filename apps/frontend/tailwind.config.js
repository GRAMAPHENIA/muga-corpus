/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        base: "#f5f3ef",
        ink: "#0a0a0a",
        accent: "#b0172f",
        inkMuted: "#3a3a3a",
        line: "#c2b9ad"
      }
    }
  },
  corePlugins: {
    borderRadius: false,
    boxShadow: false
  }
};
