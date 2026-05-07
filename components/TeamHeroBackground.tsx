"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Crossfade slideshow used as the background of MatchHero. Stacks every
// image in an absolute layer; the active one is opacity-1 and the rest
// opacity-0. setInterval rotates the active index. Pure presentational —
// MatchHero handles the dark gradient + content overlay.

export default function TeamHeroBackground({
  images,
  intervalMs = 5500,
}: {
  images: string[];
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  if (images.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
          aria-hidden={i !== active}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="100vw"
            priority={i === 0}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
