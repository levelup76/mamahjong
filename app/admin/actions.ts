"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

const BUCKET = "assets";

type Kind = "background" | "music" | "sound" | "tile";

async function assertAdmin() {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("not-authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();
  if (!profile?.is_admin) throw new Error("not-admin");
  return { supabase, userId: userData.user.id };
}

function buildPath(
  kind: Kind,
  boardId: number | null,
  slotKey: string | null,
  fileName: string,
): string {
  // Normalize the original file extension; randomize the body to avoid
  // overwriting an existing asset under the same logical slot.
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "bin";
  const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  switch (kind) {
    case "background":
      return `bg/${boardId === null ? "global" : `board-${boardId}`}/${stamp}.${ext}`;
    case "music":
      return `music/${stamp}.${ext}`;
    case "sound":
      return `sound/${slotKey ?? "default"}/${stamp}.${ext}`;
    case "tile":
      return `tile/board-${boardId}/${slotKey}/${stamp}.${ext}`;
  }
}

export type UploadResult =
  | { ok: true; assetId?: string }
  | { ok: false; message: string };

export async function uploadAsset(formData: FormData): Promise<UploadResult> {
  try {
    const { supabase, userId } = await assertAdmin();
    const file = formData.get("file") as File | null;
    const kind = formData.get("kind") as Kind | null;
    const boardIdRaw = formData.get("board_id") as string | null;
    const slotKey = (formData.get("slot_key") as string | null) || null;

    if (!file || file.size === 0) return { ok: false, message: "Nincs fájl." };
    if (!kind) return { ok: false, message: "Hiányzik a kategória." };
    const boardId =
      boardIdRaw && boardIdRaw !== "" ? Number.parseInt(boardIdRaw, 10) : null;
    if (kind === "tile" && (!boardId || !slotKey)) {
      return { ok: false, message: "Pálya és slot szükséges egyedi kőhöz." };
    }

    const path = buildPath(kind, boardId, slotKey, file.name);
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) return { ok: false, message: `Storage: ${upErr.message}` };

    // Deactivate any previous active asset in the same slot, then insert this one.
    const deactivate = supabase
      .from("assets")
      .update({ is_active: false })
      .eq("kind", kind)
      .eq("is_active", true);
    if (kind === "tile") deactivate.eq("board_id", boardId).eq("slot_key", slotKey);
    if (kind === "background")
      boardId === null
        ? deactivate.is("board_id", null)
        : deactivate.eq("board_id", boardId);
    if (kind === "sound") deactivate.eq("slot_key", slotKey);
    // music: keep multiple active (user may want to cycle); don't deactivate

    if (kind !== "music") await deactivate;

    const insertPayload = {
      kind,
      board_id: boardId,
      slot_key: slotKey,
      storage_path: path,
      is_active: true,
      uploaded_by: userId,
      crop_zoom: kind === "tile" ? 1 : null,
      crop_x: kind === "tile" ? 0 : null,
      crop_y: kind === "tile" ? 0 : null,
    };
    const { data: inserted, error: insErr } = await supabase
      .from("assets")
      .insert(insertPayload)
      .select("id")
      .single();
    if (insErr) return { ok: false, message: `DB: ${insErr.message}` };

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { ok: true, assetId: inserted?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ismeretlen hiba";
    return { ok: false, message: msg };
  }
}

export async function updateTileCrop(
  assetId: string,
  crop: { zoom: number; x: number; y: number },
): Promise<UploadResult> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase
      .from("assets")
      .update({
        crop_zoom: crop.zoom,
        crop_x: crop.x,
        crop_y: crop.y,
      })
      .eq("id", assetId)
      .eq("kind", "tile");
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { ok: true, assetId };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "hiba" };
  }
}

export async function deleteAsset(id: string): Promise<UploadResult> {
  try {
    const { supabase } = await assertAdmin();
    const { data: row } = await supabase
      .from("assets")
      .select("storage_path")
      .eq("id", id)
      .single();
    if (row?.storage_path) {
      await supabase.storage.from(BUCKET).remove([row.storage_path]);
    }
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "hiba" };
  }
}

export async function toggleAsset(
  id: string,
  isActive: boolean,
): Promise<UploadResult> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase
      .from("assets")
      .update({ is_active: isActive })
      .eq("id", id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "hiba" };
  }
}
