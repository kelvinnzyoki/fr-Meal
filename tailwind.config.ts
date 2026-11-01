import type { Config } from "tailwindcss";

// Design tokens for KulaGo. Deliberately not the "warm cream + terracotta"
// AI-generated default — this leans into Kenyan street-food / matatu-graphic
// energy: an ink-charcoal base, a hot marigold hero color, and chili + sukuma
// accents used sparingly for status and CTAs.
// Theme: toggled by adding the "dark" class to <html> (see ThemeToggle).
// white (cards), stone (muted text), ink, marigold/marigoldDark (the gold) and
// the chrome/accent tokens all read CSS variables from globals.css. Light mode
// = deep navy + rich gold; dark mode = the original charcoal + marigold.
// cream stays fixed (it is the light text used on dark surfaces).
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        cream: "#FAFAFA",
        marigold: "rgb(var(--color-gold) / <alpha-value>)",
        marigoldDark: "rgb(var(--color-gold-dark) / <alpha-value>)",
        chili: "#C1440E",
        sukuma: "#3A6B35",
        stone: "rgb(var(--color-stone) / <alpha-value>)",
        white: "rgb(var(--color-card) / <alpha-value>)",
        // Navbar / hero / footer surfaces: deep navy in light mode, charcoal in dark mode
        chrome: "rgb(var(--color-chrome) / <alpha-value>)",
        chromeFg: "rgb(var(--color-chrome-fg) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
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
