import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aligned to fanroute-landing tokens so the two properties feel seamless.
        paper: "#FAF8F3",          // --bg
        "paper-deep": "#F4EFE5",   // --bg-warm
        surface: "#FFFFFF",        // --surface
        ink: "#0B1A2C",            // --ink (deep navy, "black")
        "ink-body": "#4A5568",     // --ink-body
        "ink-muted": "#7A8599",    // --ink-muted
        "ink-faint": "#A7B0BD",    // --ink-faint
        rule: "#E8EAEF",           // --line
        "rule-soft": "#EFF1F5",    // --line-soft
        "rule-strong": "#D4D9E0",  // --line-strong
        accent: "#2B4DE8",         // --accent
        "accent-deep": "#1A38C4",  // --accent-deep
        "accent-soft": "#EEF2FF",  // --accent-soft
        official: "#0B8B5B",       // --official
        "official-soft": "#E3F4EC",
        warm: "#C7571F",           // --warm
        "warm-soft": "#FBEDE1",
        amber: "#B7791F",          // --amber
        "amber-soft": "#FDF3DC",
        "full-red": "#C7571F",     // match landing's warm/full signal
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "SF Pro Text", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["var(--font-geist-sans)", "SF Pro Display", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "lift-1":
          "0 0 0 1px rgba(11, 26, 44, 0.04), 0 1px 2px rgba(11, 26, 44, 0.04)",
        "lift-2":
          "0 0 0 1px rgba(11, 26, 44, 0.05), 0 2px 6px rgba(11, 26, 44, 0.05), 0 14px 28px -10px rgba(11, 26, 44, 0.12)",
        "lift-3":
          "0 0 0 1px rgba(11, 26, 44, 0.06), 0 8px 20px rgba(11, 26, 44, 0.07), 0 30px 60px -20px rgba(11, 26, 44, 0.18)",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
    },
  },
  plugins: [],
};

export default config;
