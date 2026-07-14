/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0A0A0C",
        elevated: "#111114",
        card: "#17171B",
        ink: "#F2F2F0",
        mute: "#A0A0A8",
        hairline: "#26262B",
        signal: "#FFC78A",
        warn: "#F5A623",
        crit: "#FF5D5D",
      },
      fontFamily: {
        display: ["Ranade", "sans-serif"],
        body: ["Switzer", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.03em",
        tighter: "-0.02em",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
      },
    },
  },
  plugins: [],
};
