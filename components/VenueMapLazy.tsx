"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type VenueMap from "./VenueMap";

const MapImpl = dynamic(() => import("./VenueMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] w-full animate-pulse rounded-md border border-rule bg-paper-deep" />
  ),
});

export default function VenueMapLazy(props: ComponentProps<typeof VenueMap>) {
  return <MapImpl {...props} />;
}
