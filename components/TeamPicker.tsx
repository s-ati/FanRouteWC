import { flagEmoji } from "@/lib/flags";
import { WC_2026_TEAMS } from "@/lib/wc2026-teams";

// Reusable team grid. The page wraps this in a `<form action={action}>`
// so each tile is a server-action submit. Keeps the picker shareable
// between the cold-open landing and the /onboarding switch flow.
export default function TeamPicker({
  pickedCode,
  variant = "grid",
}: {
  pickedCode?: string | null;
  variant?: "grid" | "compact";
}) {
  const teams = [...WC_2026_TEAMS].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const grid =
    variant === "compact"
      ? "grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
      : "grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";

  return (
    <ul role="list" className={`grid ${grid}`}>
      {teams.map((t) => {
        const isPicked = pickedCode?.toUpperCase() === t.code;
        return (
          <li key={t.code}>
            <button
              type="submit"
              name="country_code"
              value={t.code}
              className={`group flex w-full flex-col items-center gap-stack-sm rounded-lg border bg-surface-container-lowest p-stack-md text-center transition hover:-translate-y-[1px] hover:border-primary hover:shadow-ambient ${
                isPicked
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-outline-variant"
              }`}
            >
              <span
                aria-hidden
                className={
                  variant === "compact"
                    ? "text-2xl leading-none"
                    : "text-4xl leading-none"
                }
              >
                {flagEmoji(t.code) || "🏳️"}
              </span>
              <span
                className={`font-semibold leading-tight tracking-tight ${
                  variant === "compact" ? "text-body-sm" : "text-body-main"
                } text-on-surface group-hover:text-primary`}
              >
                {t.name}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
