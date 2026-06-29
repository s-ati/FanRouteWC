import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/auth-server";
import { COUNTRY_COOKIE } from "@/lib/country-cookie";
import type { EmailOtpType } from "@supabase/supabase-js";

// Magic-link / email confirm callback. Handles both flows Supabase can use:
//   - PKCE  → ?code=...                 (exchangeCodeForSession)
//   - OTP   → ?token_hash=...&type=...  (verifyOtp)
// Whichever fires, we end with a session cookie and pick a landing page:
//   - an explicit same-origin ?next= wins,
//   - otherwise a user who hasn't picked a team yet lands on /onboarding
//     (the second step of the sign-in → pick-team flow),
//   - otherwise /me.

function resolveDestination(
  request: NextRequest,
  rawNext: string | null,
): string {
  if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")) {
    return rawNext;
  }
  const picked = request.cookies.get(COUNTRY_COOKIE)?.value?.trim();
  return picked && picked.length === 3 ? "/me" : "/onboarding";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = resolveDestination(request, searchParams.get("next"));

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
