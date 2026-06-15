// Hand-picked Unsplash bar/pub photos used as a demo stand-in for any venue
// whose `photo_url` is missing or points to an expired Google Places signed
// URL. Each venue id deterministically maps to one photo so the same bar
// shows the same image across renders.

const DEMO_BAR_PHOTOS = [
  "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=900&q=75",
  "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=900&q=75",
  "https://images.unsplash.com/photo-1546726747-421c6d69c929?auto=format&fit=crop&w=900&q=75",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=75",
  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=900&q=75",
  "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=900&q=75",
];

const DEMO_FAN_ZONE_PHOTOS = [
  "https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?auto=format&fit=crop&w=1200&q=75",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=75",
  "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=75",
];

function stableIndex(id: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % mod;
}

const BROKEN_HOST_FRAGMENTS = [
  "lh3.googleusercontent.com/gps-cs-s",
  "lh3.googleusercontent.com/places",
];

function isLikelyBroken(url: string | null | undefined): boolean {
  if (!url) return true;
  return BROKEN_HOST_FRAGMENTS.some((frag) => url.includes(frag));
}

export function demoBarPhotoFor(
  id: string,
  existing?: string | null,
): string {
  if (existing && !isLikelyBroken(existing)) return existing;
  return DEMO_BAR_PHOTOS[stableIndex(id, DEMO_BAR_PHOTOS.length)];
}

export function demoFanZonePhotoFor(
  id: string,
  existing?: string | null,
): string {
  if (existing && !isLikelyBroken(existing)) return existing;
  return DEMO_FAN_ZONE_PHOTOS[stableIndex(id, DEMO_FAN_ZONE_PHOTOS.length)];
}
