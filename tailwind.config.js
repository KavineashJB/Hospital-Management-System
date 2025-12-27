/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary-dark": "#012e58",
        "primary-light": "#1a4b7a",
        "accent-blue": "#3b82f6",
      },
    },
  },
  plugins: [],
};
