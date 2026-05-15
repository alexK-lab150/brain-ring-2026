/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:  "#080d1a",
          navy:  "#0d1b2a",
          blue:  "#1a3a5c",
          gold:  "#f5c518",
          amber: "#f59e0b",
          red:   "#c0392b",
          light: "#7ec8e3",
        },
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        ticker: {
          "0%":   { transform: "translateX(100vw)" },
          "100%": { transform: "translateX(-100%)" },
        },
        overlayPulse: {
          "0%, 100%": { opacity: "0.88" },
          "50%":      { opacity: "1" },
        },
        scorePop: {
          "0%":   { transform: "scale(1)" },
          "50%":  { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in-up":    "fadeInUp 0.6s ease-out forwards",
        ticker:          "ticker 38s linear infinite",
        "overlay-pulse": "overlayPulse 1.6s ease-in-out infinite",
        "score-pop":     "scorePop 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
