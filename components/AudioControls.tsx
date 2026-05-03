"use client";

import { useAudio } from "./AudioProvider";

export default function AudioControls() {
  const { music, musicEnabled, setMusicEnabled, trackIndex, setTrackIndex, volume, setVolume } =
    useAudio();
  const hasMusic = music.length > 0;

  return (
    <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-2 text-xs">
      <button
        type="button"
        onClick={() => setMusicEnabled(!musicEnabled)}
        disabled={!hasMusic}
        className={`px-2 py-1 rounded ${
          musicEnabled
            ? "bg-emerald-700 hover:bg-emerald-600"
            : "bg-slate-700 hover:bg-slate-600 disabled:opacity-40"
        }`}
        title={hasMusic ? "Háttérzene" : "Nincs feltöltött zene"}
      >
        ♪ {musicEnabled ? "ki" : "be"}
      </button>
      {hasMusic && music.length > 1 && (
        <button
          type="button"
          onClick={() => setTrackIndex((trackIndex + 1) % music.length)}
          className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
          title="Következő szám"
        >
          ⏭
        </button>
      )}
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className="w-16 sm:w-20 accent-amber-500"
        title="Hangerő"
      />
    </div>
  );
}
