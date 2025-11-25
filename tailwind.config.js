/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#398E3B",
          primaryHover: "#4BA44D",
          sidebar: "#E0E0E0",
          background: "#F5F5F5",
          card: "#FFFFFF",
          text: "#1F1F1F",
          textSecondary: "#4F4F4F",
          divider: "#C6C6C6",
          error: "#E04848",
          warning: "#F5C542",
          secondary: "#4A90E2",
        },
      },
    },
  },
  plugins: [],
}