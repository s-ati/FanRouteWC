import { createClient } from "@supabase/supabase-js";

// NOTE: server-only by convention — only import from server actions / route
// handlers. The service role key below bypasses RLS and must never reach a
// client bundle. (The `server-only` package isn't installed here, so this is
// enforced by discipline, not the compiler.)

// Service-role Supabase client. NEVER import this into a client component —
// the service role key bypasses RLS. Used only in server actions / route
// handlers for admin operations (e.g. minting an OTP without sending email
// during local testing).
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Generate a 6-digit email OTP for `email` WITHOUT sending an email. Creates
// the user first if they don't exist yet. Returns the code, or null on failure.
// Dev-only convenience: lets the verify-code flow be tested past the shared
// SMTP rate limit. Guard every call site with NODE_ENV !== "production".
export async function mintEmailOtp(email: string): Promise<string | null> {
  const admin = createAdminSupabase();

  // Idempotent: ignore "already registered" so re-testing the same email works.
  await admin.auth.admin
    .createUser({ email, email_confirm: true })
    .catch(() => undefined);

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error) return null;
  return data?.properties?.email_otp ?? null;
}
