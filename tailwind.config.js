/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070b14",
          900: "#0a0e1a",
          800: "#0f1525",
          700: "#141c2f",
          600: "#1c2540",
          500: "#2a3556",
        },
        gold: {
          400: "#e6c25c",
          500: "#d4af37",
          600: "#b08f25",
        },
        gain: "#10b981",
        loss: "#ef4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 1px 2px 0 rgba(0,0,0,0.4)",
        glow: "0 0 0 1px rgba(212,175,55,0.25), 0 8px 24px -6px rgba(212,175,55,0.15)",
      },
    },
  },
  plugins: [],
};
