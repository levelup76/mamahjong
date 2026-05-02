"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

export type SaveScoreInput = {
  boardId: number;
  timeSeconds: number;
  won: boolean;
  moves: number;
};

export type SaveScoreResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not-authenticated" | "error"; message?: string };

export async function saveScore(input: SaveScoreInput): Promise<SaveScoreResult> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, reason: "not-authenticated" };

  const { data, error } = await supabase
    .from("scores")
    .insert({
      user_id: userData.user.id,
      board_id: input.boardId,
      time_seconds: input.timeSeconds,
      won: input.won,
      moves: input.moves,
    })
    .select("id")
    .single();
  if (error) return { ok: false, reason: "error", message: error.message };
  revalidatePath("/scores");
  return { ok: true, id: data.id as string };
}
