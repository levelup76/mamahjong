import { getSupabaseServer } from "@/lib/supabase/server";
import { LAYOUTS } from "@/lib/layouts";

type Row = {
  id: string;
  board_id: number;
  time_seconds: number;
  won: boolean;
  moves: number | null;
  completed_at: string;
  profiles: { display_name: string | null } | null;
};

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default async function AdminScoresPage() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("scores")
    .select(
      "id, board_id, time_seconds, won, moves, completed_at, profiles(display_name)",
    )
    .order("completed_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <h1 className="font-display text-3xl mb-4">Eredmények</h1>
      <div className="overflow-auto rounded-xl bg-slate-800/60">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/60 text-left">
            <tr>
              <th className="px-3 py-2">Játékos</th>
              <th className="px-3 py-2">Pálya</th>
              <th className="px-3 py-2">Idő</th>
              <th className="px-3 py-2">Lépések</th>
              <th className="px-3 py-2">Eredmény</th>
              <th className="px-3 py-2">Időpont</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-700/50">
                <td className="px-3 py-2">
                  {r.profiles?.display_name ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {r.board_id}. {LAYOUTS[r.board_id as 1 | 2 | 3 | 4 | 5]?.name}
                </td>
                <td className="px-3 py-2 font-mono">{fmtTime(r.time_seconds)}</td>
                <td className="px-3 py-2">{r.moves ?? "—"}</td>
                <td className="px-3 py-2">
                  {r.won ? "győzött" : "feladta"}
                </td>
                <td className="px-3 py-2 opacity-70">
                  {new Date(r.completed_at).toLocaleString("hu-HU")}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center opacity-60">
                  Még nincs eredmény.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
