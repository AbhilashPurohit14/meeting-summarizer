/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a09",
        graphite: "#151412",
        panel: "#191815",
        line: "#302d27",
        "line-soft": "#211f1b",
        ash: "#8c877b",
        mist: "#b8b2a3",
        paper: "#efeade",
        stamp: "#716b5c",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        soft: "0 24px 60px rgba(0, 0, 0, 0.55)",
      },
      animation: {
        reveal: "reveal 500ms ease forwards",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
      keyframes: {
        reveal: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
    },
  },
  plugins: [],
};
