"use client";

import type { ResolvedTileAsset } from "@/lib/assets";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  dealSolvable,
  isFree,
  matches,
  tagHonorsForBoard,
  type Tile,
} from "@/lib/game";
import { getLayout, type BoardId } from "@/lib/layouts";
import Board from "./Board";
import { useAudio } from "./AudioProvider";
import AudioControls from "./AudioControls";
import { saveScore } from "@/app/scores/actions";
import {
  DEFAULT_TILE_BG_SCALE,
  DEFAULT_TILE_METRICS,
  type TileMetrics,
} from "./Tile";

type Props = {
  boardId: BoardId;
  loggedIn: boolean;
  tileImages: Map<string, ResolvedTileAsset>;
};

type Move = { aId: number; bId: number };
type TileTuning = {
  bgScale: number;
  bgX: number;
  bgY: number;
  bgW: number;
  bgH: number;
  stepX: number;
  stepY: number;
  zOffset: number;
};

function freshDeal(boardId: BoardId): Tile[] {
  const layout = getLayout(boardId);
  return tagHonorsForBoard(dealSolvable(layout.positions), boardId);
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Game({ boardId, loggedIn, tileImages }: Props) {
  const layout = getLayout(boardId);
  const audio = useAudio();
  const searchParams = useSearchParams();
  const debugTiles = searchParams.get("debugTiles") === "1";

  // Tiles are dealt on the CLIENT because dealSolvable() uses Math.random()
  // and timer state is also client-only. We render a loading skeleton until
  // mount completes — this side-steps any SSR/hydration mismatch on the
  // entire interactive subtree (tiles, timer, remaining count).
  const [mounted, setMounted] = useState(false);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<Move[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scoreSaved, setScoreSaved] = useState<
    "idle" | "saving" | "saved" | "skipped" | "error"
  >("idle");
  const [tileTuning, setTileTuning] = useState<TileTuning>({
    bgScale: DEFAULT_TILE_BG_SCALE,
    bgX: 0,
    bgY: 0,
    bgW: 100,
    bgH: 100,
    stepX: DEFAULT_TILE_METRICS.stepX,
    stepY: DEFAULT_TILE_METRICS.stepY,
    zOffset: DEFAULT_TILE_METRICS.zOffset,
  });

  const tileMetrics: TileMetrics = useMemo(
    () => ({
      stepX: tileTuning.stepX,
      stepY: tileTuning.stepY,
      tileW: DEFAULT_TILE_METRICS.tileW,
      tileH: DEFAULT_TILE_METRICS.tileH,
      zOffset: tileTuning.zOffset,
    }),
    [tileTuning.stepX, tileTuning.stepY, tileTuning.zOffset],
  );

  useEffect(() => {
    setTiles(freshDeal(boardId));
    setSelectedId(null);
    setHistory([]);
    setSeconds(0);
    setScoreSaved("idle");
    setMounted(true);
  }, [boardId]);

  const remaining = useMemo(
    () => tiles.filter((t) => !t.removed).length,
    [tiles],
  );

  // Guard against the empty pre-deal state being interpreted as a win.
  const won = tiles.length > 0 && remaining === 0;

  const stuck = useMemo(() => {
    if (won) return false;
    const free = tiles.filter((t) => !t.removed && isFree(t, tiles));
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        if (matches(free[i].code, free[j].code)) return false;
      }
    }
    return true;
  }, [tiles, won]);

  // Tick timer (pause when won/stuck or user paused)
  useEffect(() => {
    if (won || stuck || paused) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [won, stuck, paused]);

  const handleClick = useCallback(
    (clicked: Tile) => {
      // Need an up-to-date copy with removed flags from current state.
      setTiles((current) => {
        if (clicked.removed) return current;
        if (!isFree(clicked, current)) return current;

        if (selectedId === null) {
          setSelectedId(clicked.id);
          audio.play("click");
          return current;
        }
        if (selectedId === clicked.id) {
          // Deselect.
          setSelectedId(null);
          return current;
        }
        const prev = current.find((t) => t.id === selectedId);
        if (!prev || prev.removed) {
          setSelectedId(clicked.id);
          audio.play("click");
          return current;
        }
        if (matches(prev.code, clicked.code)) {
          setSelectedId(null);
          setHistory((h) => [...h, { aId: prev.id, bId: clicked.id }]);
          audio.play("match");
          return current.map((t) =>
            t.id === prev.id || t.id === clicked.id ? { ...t, removed: true } : t,
          );
        }
        // No match — switch selection.
        setSelectedId(clicked.id);
        audio.play("click");
        return current;
      });
    },
    [selectedId],
  );

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setTiles((current) =>
        current.map((t) =>
          t.id === last.aId || t.id === last.bId ? { ...t, removed: false } : t,
        ),
      );
      setSelectedId(null);
      return h.slice(0, -1);
    });
  }, []);

  const handleNewGame = useCallback(() => {
    setTiles(freshDeal(boardId));
    setSelectedId(null);
    setHistory([]);
    setSeconds(0);
    setPaused(false);
    setScoreSaved("idle");
  }, [boardId]);

  // Save the score exactly once when the player wins.
  useEffect(() => {
    if (!won || scoreSaved !== "idle") return;
    audio.play("win");
    if (!loggedIn) {
      setScoreSaved("skipped");
      return;
    }
    setScoreSaved("saving");
    saveScore({
      boardId,
      timeSeconds: seconds,
      won: true,
      moves: history.length,
    })
      .then((res) => setScoreSaved(res.ok ? "saved" : "error"))
      .catch(() => setScoreSaved("error"));
  }, [won, scoreSaved, loggedIn, boardId, seconds, history.length, audio]);

  useEffect(() => {
    // Skip the false-positive "stuck" that fires before the initial deal
    // populates the board.
    if (tiles.length > 0 && stuck && !won) audio.play("stuck");
  }, [tiles.length, stuck, won, audio]);

  // Hint: flash a free pair (one match-able pair) for 800ms.
  const [hint, setHint] = useState<{ a: number; b: number } | null>(null);
  const hintTimer = useRef<number | null>(null);
  const handleHint = useCallback(() => {
    const free = tiles.filter((t) => !t.removed && isFree(t, tiles));
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        if (matches(free[i].code, free[j].code)) {
          setHint({ a: free[i].id, b: free[j].id });
          if (hintTimer.current) window.clearTimeout(hintTimer.current);
          hintTimer.current = window.setTimeout(() => setHint(null), 1200);
          return;
        }
      }
    }
  }, [tiles]);

  const hintedIds = useMemo(
    () => (hint ? new Set([hint.a, hint.b]) : new Set<number>()),
    [hint],
  );

  if (!mounted) {
    // Identical SSR + first-paint markup. Once mounted=true the interactive
    // game replaces this with no hydration risk because mounted only flips
    // on the client.
    return (
      <div className="h-screen flex flex-col items-center justify-center text-slate-100">
        <div className="font-display text-2xl opacity-70">{layout.name}</div>
        <div className="text-sm opacity-50 mt-2">Pálya betöltése…</div>
      </div>
    );
  }

  return (
    <div
      className="h-[100svh] min-h-[100svh] flex flex-col px-2 py-2 sm:px-3 text-slate-100"
      style={
        {
          "--tile-bg-scale": tileTuning.bgScale,
          "--tile-bg-x": `${tileTuning.bgX}%`,
          "--tile-bg-y": `${tileTuning.bgY}%`,
          "--tile-bg-w": `${tileTuning.bgW}%`,
          "--tile-bg-h": `${tileTuning.bgH}%`,
        } as React.CSSProperties
      }
    >
      <header className="w-full flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 mb-2 shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <Link href="/" className="text-sm underline opacity-80 hover:opacity-100">
            ← Vissza
          </Link>
          <h1 className="font-display text-xl sm:text-2xl truncate">{layout.name}</h1>
          <span className="text-xs opacity-70 hidden sm:inline">{layout.description}</span>
        </div>
        <div className="grid grid-cols-4 sm:flex sm:items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <span className="rounded bg-black/25 px-2 py-1 text-center sm:bg-transparent sm:px-0">Idő: <strong>{formatTime(seconds)}</strong></span>
          <span className="rounded bg-black/25 px-2 py-1 text-center sm:bg-transparent sm:px-0">Kő: <strong>{remaining}</strong></span>
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="px-2 sm:px-3 py-1.5 sm:py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40"
          >Visszavon</button>
          <button
            type="button"
            onClick={handleHint}
            className="px-2 sm:px-3 py-1.5 sm:py-1 rounded bg-slate-700 hover:bg-slate-600"
          >Tipp</button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="px-2 sm:px-3 py-1.5 sm:py-1 rounded bg-slate-700 hover:bg-slate-600"
          >{paused ? "Folytat" : "Szünet"}</button>
          <button
            type="button"
            onClick={handleNewGame}
            className="px-2 sm:px-3 py-1.5 sm:py-1 rounded bg-amber-600 hover:bg-amber-500"
          >Új játék</button>
          <AudioControls />
        </div>
      </header>

      <div className="relative flex-1 grid place-items-center min-h-0 min-w-0 overflow-hidden">
        {paused && !won && !stuck && (
          <div className="absolute inset-0 z-[100000] grid place-items-center bg-black/60 rounded-xl">
            <div className="text-3xl font-display">Szünet</div>
          </div>
        )}
        <Board
          tiles={tiles}
          selectedId={selectedId}
          hintedIds={hintedIds}
          tileImages={tileImages}
          onTileClick={handleClick}
          width={layout.width}
          height={layout.height}
          metrics={tileMetrics}
        />
        {debugTiles && (
          <TileTuningPanel
            value={tileTuning}
            onChange={setTileTuning}
          />
        )}
      </div>

      {won && (
        <div className="mx-auto mb-2 max-w-full px-4 py-3 rounded-lg bg-emerald-700 text-white text-sm sm:text-lg shadow-lg">
          🎉 Gratulálunk! Pálya teljesítve {formatTime(seconds)} alatt.
          {scoreSaved === "saved" && (
            <span className="ml-3 text-sm opacity-90">(eredmény mentve)</span>
          )}
          {scoreSaved === "skipped" && (
            <span className="ml-3 text-sm opacity-90">
              (lépj be a mentéshez —{" "}
              <Link href="/login" className="underline">
                bejelentkezés
              </Link>
              )
            </span>
          )}
          {scoreSaved === "error" && (
            <span className="ml-3 text-sm opacity-90">
              (mentés nem sikerült)
            </span>
          )}
          <button
            type="button"
            onClick={handleNewGame}
            className="mt-2 sm:mt-0 sm:ml-4 px-3 py-1 rounded bg-white text-emerald-800 font-semibold"
          >Új játék</button>
        </div>
      )}
      {stuck && !won && (
        <div className="mx-auto mb-2 max-w-full px-4 py-3 rounded-lg bg-rose-700 text-white text-sm sm:text-lg shadow-lg">
          Nincs több párosítható kő — próbáld újra!
          <button
            type="button"
            onClick={handleNewGame}
            className="mt-2 sm:mt-0 sm:ml-4 px-3 py-1 rounded bg-white text-rose-800 font-semibold"
          >Új játék</button>
        </div>
      )}
    </div>
  );
}

function TileTuningPanel({
  value,
  onChange,
}: {
  value: TileTuning;
  onChange: (next: TileTuning) => void;
}) {
  const update = (key: keyof TileTuning, raw: string) => {
    onChange({ ...value, [key]: Number(raw) });
  };

  const css = `bg scale=${value.bgScale.toFixed(2)} x=${value.bgX}% y=${value.bgY}% w=${value.bgW}% h=${value.bgH}% | gap x=${value.stepX} y=${value.stepY} z=${value.zOffset}`;

  return (
    <aside className="absolute left-2 bottom-2 z-[100001] w-72 max-w-[calc(100vw-1rem)] rounded bg-slate-950/90 p-3 text-xs text-slate-100 shadow-xl ring-1 ring-white/15">
      <div className="mb-2 flex items-center justify-between gap-2">
        <strong>Tile bg tuning</strong>
        <code className="text-[10px] opacity-80">{css}</code>
      </div>
      <TuningSlider label="Scale" min={0.8} max={1.4} step={0.01} value={value.bgScale} onChange={(v) => update("bgScale", v)} />
      <TuningSlider label="X %" min={-25} max={25} step={1} value={value.bgX} onChange={(v) => update("bgX", v)} />
      <TuningSlider label="Y %" min={-25} max={25} step={1} value={value.bgY} onChange={(v) => update("bgY", v)} />
      <TuningSlider label="W %" min={80} max={140} step={1} value={value.bgW} onChange={(v) => update("bgW", v)} />
      <TuningSlider label="H %" min={80} max={140} step={1} value={value.bgH} onChange={(v) => update("bgH", v)} />
      <div className="my-2 border-t border-white/15" />
      <TuningSlider label="Gap X" min={22} max={38} step={0.5} value={value.stepX} onChange={(v) => update("stepX", v)} />
      <TuningSlider label="Gap Y" min={22} max={38} step={0.5} value={value.stepY} onChange={(v) => update("stepY", v)} />
      <TuningSlider label="Z off" min={3} max={12} step={0.5} value={value.zOffset} onChange={(v) => update("zOffset", v)} />
    </aside>
  );
}

function TuningSlider({
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
    <label className="grid grid-cols-[3.5rem_1fr_3rem] items-center gap-2 py-1">
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
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 rounded bg-slate-800 px-1 py-0.5 text-right"
      />
    </label>
  );
}
