"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  deleteAsset,
  updateTileCrop,
  uploadAsset,
} from "@/app/admin/actions";
import { glyphFor } from "@/lib/glyphs";

type Props = {
  boardId: number;
  slotKey: string;
  label: string;
  activeAssetId: string | null;
  activeUrl: string | null;
  activeCropZoom: number;
  activeCropX: number;
  activeCropY: number;
};

type DraftImage = {
  file: File | null;
  assetId: string | null;
  previewUrl: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

const PREVIEW_SIZE = 160;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;

/**
 * One honor-tile slot in the admin Tiles page.
 *
 * Three ways to set the image:
 * 1. Paste (⌘V) directly while the slot has focus — best path for macOS Photos
 *    "Copy Subject" workflow (long-press a person → cuts a transparent PNG).
 * 2. "Beillesztés" button — calls the async Clipboard API on demand.
 * 3. "Tallózás" button — traditional file picker.
 *
 * New uploads open a local draft first, then "Mentés" uploads the original
 * file and stores crop metadata. Existing uploads can be re-opened with
 * "Igazítás" without re-uploading the image.
 */
export default function TileSlot({
  boardId,
  slotKey,
  label,
  activeAssetId,
  activeUrl,
  activeCropZoom,
  activeCropX,
  activeCropY,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<DraftImage | null>(null);

  useEffect(() => {
    return () => {
      if (draft?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(draft.previewUrl);
      }
    };
  }, [draft]);

  function revokePreviewUrl(url: string) {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }

  function queueFile(file: File) {
    setError(null);
    setDraft((current) => {
      if (current) revokePreviewUrl(current.previewUrl);
      return {
        file,
        assetId: null,
        previewUrl: URL.createObjectURL(file),
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      };
    });
  }

  async function uploadDraft() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      try {
        let assetId = draft.assetId;
        if (draft.file) {
          const fd = new FormData();
          fd.set("file", draft.file);
          fd.set("kind", "tile");
          fd.set("board_id", String(boardId));
          fd.set("slot_key", slotKey);
          const uploadRes = await uploadAsset(fd);
          if (!uploadRes.ok) {
            setError(uploadRes.message);
            return;
          }
          assetId = uploadRes.assetId ?? null;
        }
        if (!assetId) {
          setError("Nem található menthető csempe.");
          return;
        }
        const res = await updateTileCrop(assetId, {
          zoom: draft.zoom,
          x: draft.offsetX,
          y: draft.offsetY,
        });
        if (!res.ok) {
          setError(res.message);
          return;
        }
        revokePreviewUrl(draft.previewUrl);
        setDraft(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kép-feldolgozási hiba.");
      }
    });
  }

  function discardDraft() {
    setDraft((current) => {
      if (current) revokePreviewUrl(current.previewUrl);
      return null;
    });
  }

  // Native paste event — fires when the focused slot receives ⌘V/Ctrl+V.
  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          queueFile(file);
          e.preventDefault();
          return;
        }
      }
    }
    setError("A vágólapon nincs kép.");
  }

  // Async Clipboard API for the explicit "Beillesztés" button.
  // Requires user gesture + secure context (HTTPS or localhost).
  async function pasteFromClipboard() {
    setError(null);
    if (!navigator.clipboard?.read) {
      setError("A böngésző nem támogatja a vágólap-olvasást.");
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const ext = type.split("/")[1] || "png";
            const file = new File([blob], `clipboard.${ext}`, { type });
            queueFile(file);
            return;
          }
        }
      }
      setError("A vágólapon nincs kép.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vágólap-olvasási hiba.");
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) queueFile(f);
    e.target.value = ""; // allow re-selecting the same file later
  }

  function handleDelete() {
    if (!activeAssetId) return;
    if (!confirm("Tényleg törlöd?")) return;
    startTransition(async () => {
      await deleteAsset(activeAssetId);
    });
  }

  function startAdjustingActive() {
    if (!activeUrl || !activeAssetId) return;
    setError(null);
    setDraft((current) => {
      if (current) {
        revokePreviewUrl(current.previewUrl);
      }
      return {
        file: null,
        assetId: activeAssetId,
        previewUrl: activeUrl,
        zoom: activeCropZoom,
        offsetX: activeCropX,
        offsetY: activeCropY,
      };
    });
  }

  return (
    <div
      tabIndex={0}
      onPaste={handlePaste}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`rounded-lg bg-slate-900/40 p-3 flex flex-col items-center gap-2 outline-none transition ${
        focused ? "ring-2 ring-amber-500" : "ring-1 ring-slate-800/40"
      }`}
    >
      <div className="text-sm font-semibold opacity-90">{label}</div>

      <div
        className="relative rounded bg-amber-50 flex items-center justify-center overflow-hidden"
        style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
        title={focused ? "Most ⌘V — vágólap beillesztése" : ""}
      >
        {draft ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={draft.previewUrl}
            alt={label}
            draggable={false}
            className="h-full w-full object-contain"
            style={{
              transform: `translate(${draft.offsetX}%, ${draft.offsetY}%) scale(${draft.zoom})`,
            }}
          />
        ) : activeUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeUrl}
            alt={label}
            draggable={false}
            className="h-full w-full object-contain"
            style={{
              transform: `translate(${activeCropX}%, ${activeCropY}%) scale(${activeCropZoom})`,
            }}
          />
        ) : (
          <span className="text-5xl text-slate-800">
            {glyphFor(`honor-${slotKey}`)}
          </span>
        )}
        {busy && (
          <div className="absolute inset-0 bg-black/50 grid place-items-center text-white text-xs">
            Feltöltés…
          </div>
        )}
      </div>

      {focused && !busy && (
        <div className="text-[11px] text-amber-300 -mt-1">⌘V beilleszt</div>
      )}

      {draft && (
        <div className="w-full rounded bg-slate-950/70 p-2 text-[11px]">
          <CropSlider
            label="Zoom"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.01}
            value={draft.zoom}
            onChange={(value) =>
              setDraft((current) =>
                current ? { ...current, zoom: Number(value) } : current,
              )
            }
          />
          <CropSlider
            label="X"
            min={-50}
            max={50}
            step={1}
            value={draft.offsetX}
            onChange={(value) =>
              setDraft((current) =>
                current ? { ...current, offsetX: Number(value) } : current,
              )
            }
          />
          <CropSlider
            label="Y"
            min={-50}
            max={50}
            step={1}
            value={draft.offsetY}
            onChange={(value) =>
              setDraft((current) =>
                current ? { ...current, offsetY: Number(value) } : current,
              )
            }
          />
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={uploadDraft}
              disabled={busy}
              className="flex-1 rounded bg-emerald-700 px-2 py-1.5 text-xs font-semibold hover:bg-emerald-600 disabled:opacity-40"
            >
              Mentés
            </button>
            <button
              type="button"
              onClick={discardDraft}
              disabled={busy}
              className="flex-1 rounded bg-slate-700 px-2 py-1.5 text-xs font-semibold hover:bg-slate-600 disabled:opacity-40"
            >
              Mégse
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 w-full">
        {activeAssetId && activeUrl && !draft && (
          <button
            type="button"
            onClick={startAdjustingActive}
            disabled={busy}
            className="flex-1 px-2 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-xs font-semibold"
            title="A meglévő kép igazítása újrafeltöltés nélkül"
          >
            Igazítás
          </button>
        )}
        <button
          type="button"
          onClick={pasteFromClipboard}
          disabled={busy}
          className="flex-1 px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs font-semibold"
          title="Vágólapról beilleszt (⌘V)"
        >
          Beillesztés
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex-1 px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs font-semibold"
          title="Fájl megnyitása a gépről"
        >
          Tallózás
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {activeAssetId && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="w-full px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800/60 text-xs"
        >
          Töröl
        </button>
      )}

      {error && (
        <div className="text-xs text-rose-300 text-center break-words">
          {error}
        </div>
      )}
    </div>
  );
}

function CropSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-2 py-1">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="accent-amber-500"
      />
      <span className="text-right tabular-nums">{value}</span>
    </label>
  );
}
