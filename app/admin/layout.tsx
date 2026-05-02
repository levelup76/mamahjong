import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen p-10 max-w-3xl mx-auto text-slate-100">
        <h1 className="font-display text-3xl mb-3">Admin</h1>
        <p>A Supabase még nincs beállítva. Tölts ki .env.local-t.</p>
        <Link href="/" className="underline">
          Vissza
        </Link>
      </main>
    );
  }
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.is_admin) redirect("/");

  return (
    <div className="min-h-screen text-slate-100">
      <header className="bg-slate-900/70 px-6 py-3 flex flex-wrap items-center gap-4">
        <Link href="/" className="text-sm opacity-80 hover:opacity-100">
          ← Játék
        </Link>
        <span className="font-display text-xl">Admin</span>
        <nav className="ml-auto flex gap-3 text-sm">
          <Link href="/admin/backgrounds" className="hover:underline">Háttérképek</Link>
          <Link href="/admin/audio" className="hover:underline">Zene & hangok</Link>
          <Link href="/admin/tiles" className="hover:underline">Egyedi kövek</Link>
          <Link href="/admin/scores" className="hover:underline">Eredmények</Link>
        </nav>
      </header>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
