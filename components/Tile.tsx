"use client";

import type { Tile as GameTile } from "@/lib/game";
import { glyphFor, labelFor } from "@/lib/glyphs";

// Pixel sizing — kept in sync with Board.tsx layout grid.
// Slightly bigger tiles + larger glyphs for legibility, especially on
// stacked/locked tiles where the glyph competes with the tile borders.
export const UNIT = 26;          // px per coordinate unit (a tile is 2 units = 52px wide)
const TILE_W = UNIT * 2;          // 52
const TILE_H = UNIT * 2.6;        // 67.6
const Z_OFFSET = 5;               // px shift per stack layer for depth illusion

type Props = {
  tile: GameTile;
  free: boolean;
  selected: boolean;
  hinted: boolean;
  imageUrl: string | null;
  onClick: (tile: GameTile) => void;
};

export default function Tile({
  tile,
  free,
  selected,
  hinted,
  imageUrl,
  onClick,
}: Props) {
  const left = tile.x * UNIT - tile.z * Z_OFFSET;
  const top = tile.y * UNIT - tile.z * Z_OFFSET;

  // Stack order: higher z always renders on top; within a layer, higher y/x
  // should render later so the bottom-right "shadow" peeks correctly.
  const zIndex = tile.z * 1000 + tile.y * 10 + tile.x;

  const className = [
    "tile-face",
    "absolute",
    "flex items-center justify-center",
    "select-none cursor-pointer transition-transform",
    selected ? "selected" : "",
    hinted ? "ring-4 ring-sky-300" : "",
    !free ? "locked" : "hover:-translate-y-0.5",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      title={labelFor(tile.code)}
      aria-label={labelFor(tile.code)}
      disabled={!free}
      onClick={() => onClick(tile)}
      className={className}
      style={{
        left,
        top,
        width: TILE_W,
        height: TILE_H,
        zIndex,
      }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={labelFor(tile.code)}
          draggable={false}
          className="pointer-events-none w-[88%] h-[88%] object-cover rounded"
        />
      ) : (
        <span className="tile-glyph pointer-events-none">
          {glyphFor(tile.code)}
        </span>
      )}
    </button>
  );
}

export const TILE_PIXELS = { UNIT, TILE_W, TILE_H, Z_OFFSET };
