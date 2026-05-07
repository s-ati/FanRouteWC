import type { ReactNode } from "react";

type Tone = "primary" | "secondary" | "success" | "warning" | "error" | "neutral";
type Size = "sm" | "md";

const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  neutral: "bg-surface-container text-on-surface-variant",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
};

// Pill-shaped status/category tag. Modern Editorial spec calls for
// 10%-tint backgrounds with bold text and label-caps tracking.
export default function Chip({
  children,
  tone = "neutral",
  size = "md",
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  icon?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.05em] ${TONE_CLASS[tone]} ${SIZE_CLASS[size]}`}
    >
      {icon ? (
        <span
          className="material-symbols-outlined"
          aria-hidden
          style={{ fontSize: size === "sm" ? "14px" : "16px" }}
        >
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
