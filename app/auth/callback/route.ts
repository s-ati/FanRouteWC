import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/auth-server";

// Handles the magic-link redirect: Supabase appends `?code=...` to the
// URL we set as `emailRedirectTo`. We exchange the code for a session
// and redirect to /me (or `?next=` if the caller specified one).

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/me";

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
