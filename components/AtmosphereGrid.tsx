// 5-column icon grid used on the venue detail page.
// Mirrors the Stitch reference's "Atmosphere & Guide" block.

export type AtmosphereCell = {
  icon: string;        // Material Symbols name
  label: string;       // small uppercase label, e.g. "VIBE"
  value: string;       // big short value, e.g. "Eclectic"
};

export default function AtmosphereGrid({ cells }: { cells: AtmosphereCell[] }) {
  return (
    <ul
      role="list"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
    >
      {cells.map((c) => (
        <li
          key={c.label}
          className="flex flex-col items-center gap-stack-sm rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg text-center"
        >
          <span
            className="material-symbols-outlined text-primary"
            aria-hidden
            style={{ fontSize: "28px" }}
          >
            {c.icon}
          </span>
          <span className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
            {c.label}
          </span>
          <span className="text-headline-md text-on-surface">{c.value}</span>
        </li>
      ))}
    </ul>
  );
}
