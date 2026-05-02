// Asset URL resolver. Reads the active assets list from the `assets` table
// and resolves storage paths to public URLs. The "assets" Storage bucket is
// expected to be public — admins upload via the admin UI.
//
// Falls back to null when:
//   - Supabase is not configured (env vars missing)
//   - the requested asset hasn't been uploaded yet
// Callers should render a placeholder (Unicode glyph, default background, no
// audio) in the null case.

import { getSupabaseServer } from "./supabase/server";

export type AssetKind = "background" | "music" | "sound" | "tile";

export type AssetRow = {
  id: string;
  kind: AssetKind;
  board_id: number | null;
  slot_key: string | null;
  storage_path: string;
  is_active: boolean;
};

/** Convert a storage_path to a public URL. */
function publicUrl(path: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/assets/${path}`;
}

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function fetchAssets(): Promise<AssetRow[]> {
  if (!isConfigured()) return [];
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("is_active", true);
    if (error) return [];
    return (data ?? []) as AssetRow[];
  } catch {
    return [];
  }
}

export type ResolvedAssets = {
  /** Background URL, optionally per board (boardId 1..5) or global (boardId null). */
  backgrounds: { boardId: number | null; url: string }[];
  /** Map from "board-N/slot" → URL for honor tile images. */
  tiles: Map<string, string>;
  /** Sound effects keyed by slot ('click','match','win','stuck'). */
  sounds: Map<string, string>;
  /** Background music tracks (multiple supported; first is default). */
  music: { id: string; url: string; slot_key: string | null }[];
};

export async function resolveAllAssets(): Promise<ResolvedAssets> {
  const rows = await fetchAssets();
  const result: ResolvedAssets = {
    backgrounds: [],
    tiles: new Map(),
    sounds: new Map(),
    music: [],
  };
  for (const r of rows) {
    const url = publicUrl(r.storage_path);
    if (!url) continue;
    if (r.kind === "background") {
      result.backgrounds.push({ boardId: r.board_id, url });
    } else if (r.kind === "tile" && r.board_id && r.slot_key) {
      result.tiles.set(`board-${r.board_id}/${r.slot_key}`, url);
    } else if (r.kind === "sound" && r.slot_key) {
      result.sounds.set(r.slot_key, url);
    } else if (r.kind === "music") {
      result.music.push({ id: r.id, url, slot_key: r.slot_key });
    }
  }
  return result;
}

/** Pick a background URL for a given board: prefer board-specific, else global. */
export function pickBackground(
  resolved: ResolvedAssets,
  boardId: number | null,
): string | null {
  if (boardId !== null) {
    const match = resolved.backgrounds.find((b) => b.boardId === boardId);
    if (match) return match.url;
  }
  const global = resolved.backgrounds.find((b) => b.boardId === null);
  return global?.url ?? null;
}
