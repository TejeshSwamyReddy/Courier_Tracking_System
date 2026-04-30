/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 24px 70px rgba(15, 23, 42, 0.10)",
        glow: "0 18px 40px rgba(13, 148, 136, 0.18)"
      },
      keyframes: {
        "fade-rise": {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        "pulse-soft": {
          "0%, 100%": { transform: "scale(1)", opacity: 1 },
          "50%": { transform: "scale(1.02)", opacity: 0.9 }
        }
      },
      animation: {
        "fade-rise": "fade-rise 0.55s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

