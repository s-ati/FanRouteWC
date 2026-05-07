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
        // ── Deep Navy FIFA palette ───────────────────────────────────────
        // Primary bg = #00175F (deep navy). Surfaces step up toward
        // #051E75 → #062696 → #082FB6 so cards layer on the page bg.
        // Cyan #00A3E0 is the action accent. Borders are cyan @ 20%.

        primary: "#00A3E0",
        "primary-fixed": "#003d5b",
        "primary-fixed-dim": "#0077a8",
        "primary-container": "#00C4FF",
        "on-primary": "#00175F",
        "on-primary-container": "#001f3f",

        secondary: "#7DD3FC",
        "secondary-container": "#0EA5E9",
        "on-secondary": "#00175F",

        background: "#00175F",
        "surface-container-lowest": "#051E75",
        "surface-container-low": "#072590",
        "surface-container": "#0A2DA8",
        "surface-container-high": "#0E37BF",
        "surface-container-highest": "#1242D6",
        "surface-dim": "#02114A",
        "surface-bright": "#0E37BF",

        "on-background": "#F1F5F9",
        "on-surface": "#F8FAFC",
        "on-surface-variant": "#CBD5E1",
        outline: "rgba(0, 163, 224, 0.4)",
        "outline-variant": "rgba(0, 163, 224, 0.2)",

        "inverse-surface": "#F8FAFC",
        "inverse-on-surface": "#00175F",
        "inverse-primary": "#003d5b",

        success: "#10B981",
        "success-container": "rgba(16, 185, 129, 0.15)",
        warning: "#F59E0B",
        "warning-container": "rgba(245, 158, 11, 0.15)",
        error: "#F43F5E",
        "error-container": "rgba(244, 63, 94, 0.15)",
        "on-error": "#ffffff",

        // ── Legacy aliases (mapped onto Deep Navy FIFA) ──────────────────
        paper: "#00175F",
        "paper-deep": "#051E75",
        surface: "#051E75",
        ink: "#F8FAFC",
        "ink-body": "#CBD5E1",
        "ink-muted": "#94A3B8",
        "ink-faint": "#64748B",
        rule: "rgba(0, 163, 224, 0.2)",
        "rule-soft": "rgba(0, 163, 224, 0.1)",
        "rule-strong": "rgba(0, 163, 224, 0.4)",
        accent: "#00A3E0",
        "accent-deep": "#0077a8",
        "accent-soft": "rgba(0, 163, 224, 0.15)",
        official: "#10B981",
        "official-soft": "rgba(16, 185, 129, 0.15)",
        warm: "#F59E0B",
        "warm-soft": "rgba(245, 158, 11, 0.15)",
        amber: "#F59E0B",
        "amber-soft": "rgba(245, 158, 11, 0.15)",
        "full-red": "#F43F5E",
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
