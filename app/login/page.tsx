import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/auth-server";

async function sendMagicLinkAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    redirect("/login?error=" + encodeURIComponent("Enter a valid email"));
  }

  const supabase = await createServerSupabase();
  const headers = await import("next/headers").then((m) => m.headers());
  const host = headers.get("host") ?? "localhost:3000";
  const proto = headers.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }
  redirect("/login?sent=" + encodeURIComponent(email));
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/me");

  const sp = await searchParams;
  const error = sp.error;
  const sent = sp.sent;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-container-padding py-section-gap">
      <Link
        href="/"
        className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary"
      >
        ← BACK
      </Link>

      <header className="mt-stack-lg">
        <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          Sign in
        </p>
        <h1 className="mt-stack-md text-display-xl text-on-surface">
          Your matchday window.
        </h1>
        <p className="mt-stack-md text-body-main text-on-surface-variant">
          Drop your email and we&apos;ll send a one-time magic link. No
          password, no faff.
        </p>
      </header>

      <form
        action={sendMagicLinkAction}
        className="mt-stack-lg flex flex-col gap-stack-md rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg"
      >
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
          Send magic link
          <span className="material-symbols-outlined" aria-hidden style={{ fontSize: 16 }}>
            arrow_forward
          </span>
        </button>

        {sent ? (
          <p className="text-body-sm text-success">
            ✓ Check {sent} for a sign-in link. (Look in spam if it doesn&apos;t arrive.)
          </p>
        ) : null}
        {error ? (
          <p className="text-body-sm text-error">{error}</p>
        ) : null}
      </form>
    </main>
  );
}
