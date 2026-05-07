export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule bg-paper">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-10 font-mono text-[11px] uppercase tracking-widest text-ink-muted md:flex-row md:items-center md:justify-between">
        <p>FanRoute · San Francisco · 2026</p>
        <p>
          Data curated from the Bay Area Host Committee and official venue announcements.
          Subject to FIFA and broadcast approvals.
        </p>
      </div>
    </footer>
  );
}
