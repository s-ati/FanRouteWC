import { cookies } from "next/headers";

export const COUNTRY_COOKIE = "fr_country";

export async function readPickedCountry(): Promise<string | null> {
  const store = await cookies();
  const c = store.get(COUNTRY_COOKIE);
  if (!c) return null;
  const v = c.value.trim().toUpperCase();
  return v.length === 3 ? v : null;
}
