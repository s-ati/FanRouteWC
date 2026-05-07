import Link from "next/link";
import KnockoutBracket from "@/components/KnockoutBracket";

export const revalidate = 60;

export default function BracketPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-section-gap px-container-padding py-section-gap">
      <Link
        href="/"
        className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary"
      >
        ← BACK TO HOME
      </Link>

      <header>
        <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          Knockout
        </p>
        <h1 className="mt-stack-md text-display-xl text-on-surface">
          Full bracket
        </h1>
        <p className="mt-stack-md max-w-2xl text-body-main text-on-surface-variant">
          The 2026 FIFA World Cup knockout tree. 48 teams → top 2 of 12 groups
          plus the 8 best third-place finishers → Round of 32. Below the R32
          entry strip, the tree opens into the classic two-sided draw with the
          final centered.
        </p>
      </header>

      <section
        id="bracket"
        className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg"
      >
        <KnockoutBracket />
      </section>
    </main>
  );
}
