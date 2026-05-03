import Link from "next/link";
import { LAYOUTS, BOARD_IDS } from "@/lib/layouts";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import AuthButton from "@/components/AuthButton";

export default async function Home() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  const authProps = user
    ? {
        user: {
          id: user.id,
          email: user.email ?? null,
          display_name: profile?.display_name ?? null,
          is_admin: profile?.is_admin ?? false,
        },
      }
    : { user: null };

  return (
    <main className="min-h-screen px-6 py-10 text-slate-100">
      <div className="max-w-5xl mx-auto flex justify-end mb-4">
        <AuthButton {...authProps} />
      </div>
      <header className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="font-display text-5xl mb-2">Mamahjong</h1>
        <p className="opacity-80">
          Boldog Anyák napját! Válassz egy pályát!
        </p>
      </header>

      <section className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BOARD_IDS.map((id) => {
          const l = LAYOUTS[id];
          return (
            <Link
              key={id}
              href={`/play/${id}`}
              className="block rounded-xl bg-slate-800/70 hover:bg-slate-700 transition p-6 shadow-lg"
            >
              <div className="text-xs uppercase opacity-60">Pálya {id}</div>
              <div className="font-display text-2xl mt-1">{l.name}</div>
              <p className="text-sm opacity-80 mt-2">{l.description}</p>
              <div className="text-xs opacity-50 mt-3">
                {l.positions.length} kő · {Math.max(...l.positions.map((p) => p.z)) + 1} szint
              </div>
            </Link>
          );
        })}
      </section>

      <footer className="text-center mt-12 text-xs opacity-50">
        Készült anyák napjára 💛
      </footer>
    </main>
  );
}
