import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/auth-server";
import { mintEmailOtp } from "@/lib/supabase/auth-admin";
import { COUNTRY_COOKIE } from "@/lib/country-cookie";

// FanRoute sign-in. Step 1: enter email. Step 2: enter the 6-digit code.
// A code beats a magic link because email security scanners (Outlook/live.de
// Safe Links, corporate Proofpoint) pre-fetch links and burn the one-time
// token before the human clicks — the cause of "otp_expired". A code has no
// URL to pre-fetch.
//
// In development we mint the code via the admin API and show it on screen, so
// the flow can be tested past the shared-SMTP rate limit without sending mail.
// In production the code is emailed (Supabase template must include {{ .Token }}).

const DEV = process.env.NODE_ENV !== "production";

// Only allow same-origin relative paths as the post-login destination, so a
// crafted ?next= can't bounce a fresh session off to another site.
function safeNext(raw: string | undefined | null): string {
  if (!raw) return "";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "";
  return raw;
}

function backToVerify(email: string, next: string, error: string): never {
  const params = new URLSearchParams({ stage: "verify", email });
  if (next) params.set("next", next);
  if (error) params.set("error", error);
  redirect(`/login?${params.toString()}`);
}

async function sendCodeAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(String(formData.get("next") ?? ""));
  if (!email || !email.includes("@")) {
    const suffix = next ? "&next=" + encodeURIComponent(next) : "";
    redirect("/login?error=" + encodeURIComponent("Enter a valid email") + suffix);
  }

  const verifyParams = new URLSearchParams({ stage: "verify", email });
  if (next) verifyParams.set("next", next);

  if (DEV) {
    // No email sent → no rate limit. Surface the code on the verify screen.
    const code = await mintEmailOtp(email);
    if (!code) {
      redirect(
        "/login?error=" +
          encodeURIComponent("Could not mint a dev code — check service role key"),
      );
    }
    verifyParams.set("devcode", code);
    redirect(`/login?${verifyParams.toString()}`);
  }

  // Production: email the code (also leaves the magic link working as a fallback).
  const supabase = await createServerSupabase();
  const headers = await import("next/headers").then((m) => m.headers());
  const host = headers.get("host") ?? "localhost:3000";
  const proto = headers.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;
  const callback = next
    ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    : `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: callback },
  });
  if (error) {
    const suffix = next ? "&next=" + encodeURIComponent(next) : "";
    redirect("/login?error=" + encodeURIComponent(error.message) + suffix);
  }
  redirect(`/login?${verifyParams.toString()}`);
}

async function verifyCodeAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(String(formData.get("next") ?? ""));
  // OTP length is project-configurable (this project mints 8; Supabase default
  // is 6) — don't hard-code a length, just require a plausible numeric code.
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (!email) redirect("/login");
  if (token.length < 4) {
    backToVerify(email, next, "Enter your sign-in code");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) {
    backToVerify(email, next, error.message);
  }

  // Pick a landing page: explicit next wins, else team-less user → onboarding.
  const store = await cookies();
  const picked = store.get(COUNTRY_COOKIE)?.value?.trim();
  const dest = next || (picked && picked.length === 3 ? "/me" : "/onboarding");
  redirect(dest);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    stage?: string;
    email?: string;
    next?: string;
    devcode?: string;
  }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);

  const user = await getCurrentUser();
  if (user) redirect(next || "/me");

  const error = sp.error;
  const stage = sp.stage === "verify" ? "verify" : "email";
  const email = sp.email ?? "";
  const devcode = DEV ? sp.devcode : undefined;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-container-padding py-section-gap">
      <Link
        href={stage === "verify" ? "/login" : "/"}
        className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary"
      >
        ← {stage === "verify" ? "USE A DIFFERENT EMAIL" : "BACK"}
      </Link>

      <header className="mt-stack-lg">
        <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          Sign in
        </p>
        {stage === "verify" ? (
          <>
            <h1 className="mt-stack-md text-display-xl text-on-surface">
              Enter your code.
            </h1>
            <p className="mt-stack-md text-body-main text-on-surface-variant">
              We sent a sign-in code to{" "}
              <span className="text-on-surface">{email}</span>. Pop it in below.
              {next === "/onboarding"
                ? " Next stop: pick the team you're following."
                : null}
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-stack-md text-display-xl text-on-surface">
              Your matchday window.
            </h1>
            <p className="mt-stack-md text-body-main text-on-surface-variant">
              Drop your email and we&apos;ll send a one-time sign-in code. No
              password, no faff.
              {next === "/onboarding"
                ? " Next stop: pick the team you're following."
                : null}
            </p>
          </>
        )}
      </header>

      {stage === "verify" ? (
        <form
          action={verifyCodeAction}
          className="mt-stack-lg flex flex-col gap-stack-md rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg"
        >
          <input type="hidden" name="email" value={email} />
          {next ? <input type="hidden" name="next" value={next} /> : null}

          {devcode ? (
            <p className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-body-sm text-on-surface">
              <span className="font-bold uppercase tracking-[0.05em] text-on-surface-variant">
                Dev mode ·
              </span>{" "}
              your code is{" "}
              <span className="font-mono text-headline-md tracking-[0.3em] text-primary">
                {devcode}
              </span>{" "}
              <span className="text-on-surface-variant">
                (no email sent — bypasses the rate limit)
              </span>
            </p>
          ) : null}

          <label
            htmlFor="code"
            className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant"
          >
            Sign-in code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={10}
            defaultValue={devcode ?? ""}
            placeholder="••••••"
            className="rounded-md border border-outline-variant bg-background px-4 py-3 text-center font-mono text-headline-md tracking-[0.3em] text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-body-main font-semibold text-on-primary shadow-ambient transition hover:bg-primary-container"
          >
            Verify &amp; continue
            <span className="material-symbols-outlined" aria-hidden style={{ fontSize: 16 }}>
              arrow_forward
            </span>
          </button>
          {error ? <p className="text-body-sm text-error">{error}</p> : null}
        </form>
      ) : (
        <form
          action={sendCodeAction}
          className="mt-stack-lg flex flex-col gap-stack-md rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg"
        >
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <label
            htmlFor="email"
            className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className="rounded-md border border-outline-variant bg-background px-4 py-3 text-body-main text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-body-main font-semibold text-on-primary shadow-ambient transition hover:bg-primary-container"
          >
            Send code
            <span className="material-symbols-outlined" aria-hidden style={{ fontSize: 16 }}>
              arrow_forward
            </span>
          </button>
          {error ? <p className="text-body-sm text-error">{error}</p> : null}
        </form>
      )}
    </main>
  );
}
