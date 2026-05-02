"use client";

import { useState, useTransition } from "react";
import { uploadAsset } from "@/app/admin/actions";

type Props = {
  kind: "background" | "music" | "sound" | "tile";
  boardId?: number | null;
  slotKey?: string;
  accept?: string;
  label?: string;
  /** Compact = file input + small button on one line. */
  compact?: boolean;
};

export default function AssetUploader({
  kind,
  boardId,
  slotKey,
  accept,
  label,
  compact = false,
}: Props) {
  const [busy, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("kind", kind);
    if (boardId !== undefined) fd.set("board_id", boardId === null ? "" : String(boardId));
    if (slotKey) fd.set("slot_key", slotKey);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const res = await uploadAsset(fd);
      if (res.ok) {
        setMsg("Feltöltve.");
        e.currentTarget.reset();
      } else {
        setErr(res.message);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex ${compact ? "items-center gap-2" : "flex-col gap-2"}`}
    >
      {label && !compact && (
        <label className="text-sm opacity-80">{label}</label>
      )}
      <input
        type="file"
        name="file"
        accept={accept}
        required
        className="text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-700 file:px-3 file:py-1 file:text-slate-100 hover:file:bg-slate-600"
      />
      <button
        type="submit"
        disabled={busy}
        className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-sm font-semibold"
      >
        {busy ? "Feltöltés…" : "Feltölt"}
      </button>
      {msg && <span className="text-emerald-300 text-xs">{msg}</span>}
      {err && <span className="text-rose-300 text-xs">{err}</span>}
    </form>
  );
}
