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
  const { data, error } = await supabase
    .from("scores")
    .select(
      "id, user_id, board_id, time_seconds, won, moves, completed_at, profiles(display_name)",
    )
    .eq("won", true)
    .order("time_seconds", { ascending: true })
    .limit(200);
  if (error || !data) return new Map();

  const byBoard = new Map<number, ScoreRow[]>();
  for (const r of data as unknown as Array<
    Omit<ScoreRow, "display_name"> & {
      profiles: { display_name: string | null } | null;
    }
  >) {
    const row: ScoreRow = {
      id: r.id,
      user_id: r.user_id,
      board_id: r.board_id,
      time_seconds: r.time_seconds,
      won: r.won,
      moves: r.moves,
      completed_at: r.completed_at,
      display_name: r.profiles?.display_name ?? null,
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
