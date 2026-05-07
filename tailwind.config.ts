import type { Config } from "tailwindcss";

// FanRoute Modern Editorial design system.
// Naming follows Material You vocabulary on purpose so the Stitch reference
// drops in cleanly. Existing aliases (`paper`, `ink`, `rule`, `accent`) are
// kept so legacy components keep compiling — they now point at the new palette.

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── New editorial palette (Stitch DESIGN.md) ─────────────────────
        primary: "#630ed4",
        "primary-fixed": "#eaddff",
        "primary-fixed-dim": "#d2bbff",
        "primary-container": "#7c3aed",
        "on-primary": "#ffffff",
        "on-primary-container": "#ede0ff",

        secondary: "#006591",
        "secondary-container": "#39b8fd",
        "on-secondary": "#ffffff",

        background: "#fef7ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f9f1ff",
        "surface-container": "#f3ebfa",
        "surface-container-high": "#ede5f4",
        "surface-container-highest": "#e8dfee",
        "surface-dim": "#dfd7e6",
        "surface-bright": "#fef7ff",

        "on-background": "#1d1a24",
        "on-surface": "#1d1a24",
        "on-surface-variant": "#4a4455",
        outline: "#7b7487",
        "outline-variant": "#ccc3d8",

        "inverse-surface": "#332f39",
        "inverse-on-surface": "#f6eefc",
        "inverse-primary": "#d2bbff",

        success: "#0B8B5B",
        "success-container": "#E3F4EC",
        warning: "#B7791F",
        "warning-container": "#FDF3DC",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",

        // ── Legacy aliases (mapped onto new palette) ─────────────────────
        // Keeps existing pages compiling while we rebuild them in Phase 3.
        paper: "#fef7ff",
        "paper-deep": "#f3ebfa",
        surface: "#ffffff",
        ink: "#1d1a24",
        "ink-body": "#4a4455",
        "ink-muted": "#7b7487",
        "ink-faint": "#a39ab2",
        rule: "#ccc3d8",
        "rule-soft": "#e8dfee",
        "rule-strong": "#7b7487",
        accent: "#630ed4",
        "accent-deep": "#5a00c6",
        "accent-soft": "#eaddff",
        official: "#0B8B5B",
        "official-soft": "#E3F4EC",
        warm: "#C7571F",
        "warm-soft": "#FBEDE1",
        amber: "#B7791F",
        "amber-soft": "#FDF3DC",
        "full-red": "#ba1a1a",
      },
      fontFamily: {
        // Manrope is the workhorse for everything except editorial pull-quotes.
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
        body: ["var(--font-manrope)", "system-ui", "sans-serif"],
        editorial: ["var(--font-newsreader)", "Georgia", "serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": [
          "48px",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" },
        ],
        "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "body-main": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-caps": [
          "12px",
          { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "700" },
        ],
        "editorial-quote": ["22px", { lineHeight: "1.5", fontWeight: "400" }],
      },
      spacing: {
        base: "8px",
        gutter: "16px",
        "container-padding": "24px",
        "stack-sm": "4px",
        "stack-md": "12px",
        "stack-lg": "24px",
        "section-gap": "40px",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        sm: "0.25rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        // Ambient lift — barely-there. Used only on hover/active.
        ambient: "0 4px 20px rgba(15, 23, 42, 0.05)",
        "ambient-strong": "0 8px 30px rgba(15, 23, 42, 0.08)",
        // Legacy lift-* aliases for components not yet migrated.
        "lift-1": "0 0 0 1px rgba(29, 26, 36, 0.04), 0 1px 2px rgba(29, 26, 36, 0.04)",
        "lift-2": "0 4px 20px rgba(15, 23, 42, 0.05)",
        "lift-3": "0 8px 30px rgba(15, 23, 42, 0.08)",
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
    },
  },
  plugins: [],
};

export default config;
