import type { Config } from "tailwindcss";

// Design tokens for KulaGo. Deliberately not the "warm cream + terracotta"
// AI-generated default — this leans into Kenyan street-food / matatu-graphic
// energy: an ink-charcoal base, a hot marigold hero color, and chili + sukuma
// accents used sparingly for status and CTAs.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C1A17",
        cream: "#FBF6EC",
        marigold: "#F0A500",
        marigoldDark: "#C97F00",
        chili: "#C1440E",
        sukuma: "#3A6B35",
        stone: "#8A8375",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
