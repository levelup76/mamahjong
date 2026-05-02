"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Props = {
  user:
    | {
        id: string;
        email: string | null;
        display_name: string | null;
        is_admin: boolean;
      }
    | null;
};

export default function AuthButton({ user }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await getSupabaseBrowser().auth.signOut();
    router.refresh();
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-sm font-semibold"
      >
        Bejelentkezés
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="opacity-80">
        {user.display_name ?? user.email ?? "Játékos"}
        {user.is_admin && (
          <span className="ml-1 text-xs uppercase opacity-70">(admin)</span>
        )}
      </span>
      {user.is_admin && (
        <Link href="/admin" className="underline opacity-80 hover:opacity-100">
          admin
        </Link>
      )}
      <Link href="/scores" className="underline opacity-80 hover:opacity-100">
        eredmények
      </Link>
      <button
        onClick={handleLogout}
        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
      >
        Kilép
      </button>
    </div>
  );
}
