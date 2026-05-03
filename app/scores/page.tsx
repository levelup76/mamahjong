import Link from "next/link";
import { getSupabaseServer, getCurrentUser } from "@/lib/supabase/server";
import { LAYOUTS, BOARD_IDS } from "@/lib/layouts";

// Always re-fetch the leaderboard server-side; we don't want stale data after
// a new score is recorded.
export const dynamic = "force-dynamic";

type ScoreRow = {
  id: string;
  user_id: string;
  board_id: number;
  time_seconds: number;
  won: boolean;
  moves: number | null;
  completed_at: string;
  display_name: string | null;
};

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

async function fetchScoresByBoard(): Promise<Map<number, ScoreRow[]>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return new Map();
  const supabase = await getSupabaseServer();

  const { data: scores, error } = await supabase
    .from("scores")
    .select("id, user_id, board_id, time_seconds, won, moves, completed_at")
    .eq("won", true)
    .order("time_seconds", { ascending: true })
    .limit(200);
  if (error || !scores) return new Map();

  // scores.user_id → auth.users ← profiles.id: no direct FK, so we fetch
  // display names in a separate query instead of a PostgREST embedded join.
  const userIds = [...new Set(scores.map((r) => r.user_id))];
  const displayNames = new Map<string, string | null>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    for (const p of profiles ?? []) displayNames.set(p.id, p.display_name);
  }

  const byBoard = new Map<number, ScoreRow[]>();
  for (const r of scores) {
    const row: ScoreRow = {
      ...r,
      display_name: displayNames.get(r.user_id) ?? null,
    };
    const arr = byBoard.get(r.board_id) ?? [];
    arr.push(row);
    byBoard.set(r.board_id, arr);
  }
  return byBoard;
}

export default async function ScoresPage() {
  const user = await getCurrentUser();
  const byBoard = await fetchScoresByBoard();

  return (
    <main className="min-h-screen px-6 py-10 text-slate-100 max-w-5xl mx-auto">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-display text-4xl">Eredmények</h1>
        <Link href="/" className="text-sm underline opacity-80 hover:opacity-100">
          ← Vissza
        </Link>
      </div>

      {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
        <p className="mb-6 p-4 rounded bg-amber-700/40">
          A Supabase még nincs beállítva — az eredmények nem mentődnek.
          Tölts ki .env.local-t a setup szerint.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BOARD_IDS.map((id) => {
          const layout = LAYOUTS[id];
          const top = (byBoard.get(id) ?? []).slice(0, 10);
          return (
            <section
              key={id}
              className="rounded-xl bg-slate-800/70 p-4 shadow"
            >
              <h2 className="font-display text-xl mb-3">
                {id}. {layout.name}
              </h2>
              {top.length === 0 ? (
                <p className="text-sm opacity-60">Még nincs eredmény ezen a pályán.</p>
              ) : (
                <ol className="space-y-1 text-sm">
                  {top.map((r, i) => {
                    const isMe = user?.id === r.user_id;
                    return (
                      <li
                        key={r.id}
                        className={`flex justify-between ${isMe ? "text-amber-300 font-semibold" : ""}`}
                      >
                        <span>
                          {i + 1}. {r.display_name ?? "Játékos"}
                        </span>
                        <span>{fmtTime(r.time_seconds)}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
