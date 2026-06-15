// Strip photo URLs we know will 403. Google Places signed URLs
// (`lh3.googleusercontent.com/gps-cs-s/...`) expire shortly after they're
// minted; the Supabase rows still carry stale ones that started returning
// 403 once the signature expired. Hand `null` back so the consumer renders
// its placeholder flow instead of next/image's broken-image "?" icon.

export function sanitizePhotoUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  if (url.includes("lh3.googleusercontent.com/gps-cs-s")) return null;
  if (url.includes("lh3.googleusercontent.com/places")) return null;
  return url;
}
