"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

// Wraps next/image so a load failure swaps in the caller's fallback node
// (usually a flag emoji or icon) instead of next/image's broken-image "?"
// placeholder. Use for any image sourced from a third-party host that can
// expire (e.g. Google Places signed photo URLs).

type Props = Omit<ImageProps, "onError"> & {
  fallback: React.ReactNode;
};

export default function SafeImage({ fallback, ...imageProps }: Props) {
  const [errored, setErrored] = useState(false);
  if (errored) return <>{fallback}</>;
  return <Image {...imageProps} onError={() => setErrored(true)} />;
}
