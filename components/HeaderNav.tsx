"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Header nav with two interaction patterns:
//   - direct link  (no `popover`): plain anchor
//   - popover      (`popover` set): button toggles a small panel below
//                                   the label with a single "View full X"
//                                   action that routes to the dedicated page
//
// Click-outside + Escape close the open popover. Only one open at a time.

export type HeaderNavItem = {
  label: string;
  href: string;
  popover?: string; // CTA text shown when popover opens
};

export default function HeaderNav({ items }: { items: HeaderNavItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpenIdx(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIdx(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="hidden items-center gap-stack-lg md:flex"
      role="navigation"
      aria-label="Primary"
    >
      {items.map((item, i) => {
        if (!item.popover) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className="text-body-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
              onClick={() => setOpenIdx(null)}
            >
              {item.label}
            </Link>
          );
        }
        const isOpen = openIdx === i;
        return (
          <div key={item.label} className="relative">
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-haspopup="menu"
              className={`text-body-sm font-medium transition-colors ${
                isOpen
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {item.label}
            </button>
            {isOpen ? (
              <div
                role="menu"
                className="absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 whitespace-nowrap rounded-lg border border-outline-variant bg-surface-container-low p-1 shadow-ambient"
                style={{
                  backgroundColor: "rgba(5, 30, 117, 0.95)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                <Link
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpenIdx(null)}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-body-sm font-semibold text-on-surface transition hover:bg-primary hover:text-on-primary"
                >
                  <span>{item.popover}</span>
                  <span
                    className="material-symbols-outlined"
                    aria-hidden
                    style={{ fontSize: 16 }}
                  >
                    arrow_forward
                  </span>
                </Link>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
