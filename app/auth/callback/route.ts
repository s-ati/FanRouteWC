import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/auth-server";
import type { EmailOtpType } from "@supabase/supabase-js";

// Magic-link / email confirm callback. Handles both flows Supabase can use:
//   - PKCE  → ?code=...                 (exchangeCodeForSession)
//   - OTP   → ?token_hash=...&type=...  (verifyOtp)
// Whichever fires, we end with a session cookie and redirect to /me.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/me";

  const supabase = await createServerSupabase();

  // 1. PKCE — newer @supabase/ssr default.
  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // 2. OTP token_hash — Supabase's default magic-link email template.
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
