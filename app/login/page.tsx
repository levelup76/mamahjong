"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    const origin = window.location.origin;
    const { error } = await getSupabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
    // Otherwise the browser is redirecting to Google.
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="max-w-md w-full bg-slate-800/80 rounded-xl p-8 shadow-lg text-center">
        <h1 className="font-display text-3xl mb-2">Mamahjong</h1>
        <p className="opacity-80 mb-6">
          Lépj be Google fiókkal, hogy az eredményeid mentődjenek.
        </p>
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full px-4 py-3 rounded bg-white text-slate-900 font-semibold hover:bg-slate-100 disabled:opacity-50"
        >
          {busy ? "Átirányítás…" : "Bejelentkezés Google-lel"}
        </button>
        {error && <p className="mt-3 text-rose-300 text-sm">{error}</p>}
        <p className="mt-6 text-xs opacity-60">
          A bejelentkezés nélkül is játszhatsz — csak az eredményeid nem
          tárolódnak.
        </p>
      </div>
    </main>
  );
}
