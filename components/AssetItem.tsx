"use client";

import { useTransition } from "react";
import { deleteAsset, toggleAsset } from "@/app/admin/actions";

type Props = {
  id: string;
  url: string;
  kind: "background" | "music" | "sound" | "tile";
  isActive: boolean;
  meta?: string;
};

export default function AssetItem({ id, url, kind, isActive, meta }: Props) {
  const [busy, start] = useTransition();

  return (
    <div className="rounded bg-slate-900/50 p-2 flex flex-col gap-2">
      {kind === "background" || kind === "tile" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="asset"
          className="w-full h-24 object-cover rounded"
        />
      ) : (
        <audio src={url} controls preload="none" className="w-full" />
      )}
      {meta && <div className="text-xs opacity-70">{meta}</div>}
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            start(() => {
              toggleAsset(id, !isActive);
            })
          }
          className={`flex-1 px-2 py-1 rounded ${
            isActive
              ? "bg-emerald-700 hover:bg-emerald-600"
              : "bg-slate-700 hover:bg-slate-600"
          }`}
        >
          {isActive ? "Aktív" : "Inaktív"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm("Tényleg törlöd?")) start(() => { deleteAsset(id); });
          }}
          className="px-2 py-1 rounded bg-rose-800 hover:bg-rose-700"
        >
          Töröl
        </button>
      </div>
    </div>
  );
}
