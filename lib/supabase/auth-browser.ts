"use client";

import { createBrowserClient } from "@supabase/ssr";

// Auth client for client components — same session cookie as the server
// helper, just executed in the browser.
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");

  return createBrowserClient(url, anonKey);
}
