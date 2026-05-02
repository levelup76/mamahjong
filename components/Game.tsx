"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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

type Props = {
  boardId: BoardId;
  loggedIn: boolean;
  tileImages: Map<string, string>;
};

type Move = { aId: number; bId: number };

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

  const [tiles, setTiles] = useState<Tile[]>(() => freshDeal(boardId));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<Move[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scoreSaved, setScoreSaved] = useState<
    "idle" | "saving" | "saved" | "skipped" | "error"
  >("idle");

  const remaining = useMemo(
    () => tiles.filter((t) => !t.removed).length,
    [tiles],
  );

  const won = remaining === 0;

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
    if (stuck && !won) audio.play("stuck");
  }, [stuck, won, audio]);

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

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 text-slate-100">
      <header className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-baseline gap-3">
          <Link href="/" className="text-sm underline opacity-80 hover:opacity-100">
            ← Vissza
          </Link>
          <h1 className="font-display text-2xl">{layout.name}</h1>
          <span className="text-xs opacity-70">{layout.description}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span>Idő: <strong>{formatTime(seconds)}</strong></span>
          <span>Hátralévő: <strong>{remaining}</strong></span>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40"
          >Visszavon</button>
          <button
            onClick={handleHint}
            className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
          >Tipp</button>
          <button
            onClick={() => setPaused((p) => !p)}
            className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
          >{paused ? "Folytat" : "Szünet"}</button>
          <button
            onClick={handleNewGame}
            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500"
          >Új játék</button>
          <AudioControls />
        </div>
      </header>

      <div className="relative">
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
        />
      </div>

      {won && (
        <div className="mt-6 px-6 py-4 rounded-lg bg-emerald-700 text-white text-lg shadow-lg">
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
            onClick={handleNewGame}
            className="ml-4 px-3 py-1 rounded bg-white text-emerald-800 font-semibold"
          >Új játék</button>
        </div>
      )}
      {stuck && !won && (
        <div className="mt-6 px-6 py-4 rounded-lg bg-rose-700 text-white text-lg shadow-lg">
          Nincs több párosítható kő — próbáld újra!
          <button
            onClick={handleNewGame}
            className="ml-4 px-3 py-1 rounded bg-white text-rose-800 font-semibold"
          >Új játék</button>
        </div>
      )}
    </div>
  );
}
