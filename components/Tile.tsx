"use client";

import type { Tile as GameTile } from "@/lib/game";
import { glyphFor, glyphColor, labelFor } from "@/lib/glyphs";
import { BAMBOO_TILE_FACE, BAMBOO_TILE_SELECTED_FACE } from "@/lib/tilesets";
import type { ResolvedTileAsset } from "@/lib/assets";

// Pixel sizing — kept in sync with Board.tsx layout grid.
// Slightly bigger tiles + larger glyphs for legibility, especially on
// stacked/locked tiles where the glyph competes with the tile borders.
export const UNIT = 26;          // px per coordinate unit (a tile is 2 units = 52px wide)
const TILE_W = UNIT * 2;          // 52
const TILE_H = TILE_W * (256 / 195); // match the Bamboo tile.png aspect ratio
const Z_OFFSET = 5;               // px shift per stack layer for depth illusion
const STEP_Y = 33.5;
const BG_SCALE = 1.1;

export type TileMetrics = {
  stepX: number;
  stepY: number;
  tileW: number;
  tileH: number;
  zOffset: number;
};

type Props = {
  tile: GameTile;
  free: boolean;
  selected: boolean;
  hinted: boolean;
  imageUrl: string | null;
  customImage: boolean;
  customCrop?: ResolvedTileAsset | null;
  metrics?: TileMetrics;
  onClick: (tile: GameTile) => void;
};

export default function Tile({
  tile,
  free,
  selected,
  hinted,
  imageUrl,
  customImage,
  customCrop,
  metrics,
  onClick,
}: Props) {
  const m = metrics ?? DEFAULT_TILE_METRICS;
  const left = tile.x * m.stepX - tile.z * m.zOffset;
  const top = tile.y * m.stepY - tile.z * m.zOffset;

  // Front-to-back ordering for the 3/4 perspective:
  //   higher z (stacked above)    → in front  (z * 1000)
  //   higher y (closer to viewer) → in front  (covers bottom edge of tile
  //                                            "behind" it on the same layer)
  //   lower x (closer to viewer)  → in front  (covers right edge of tile
  //                                            to its right on the same layer)
  const zIndex = tile.z * 1000 + tile.y * 10 - tile.x;

  const className = [
    "tile-face",
    "absolute",
    "overflow-hidden",
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
        width: m.tileW,
        height: m.tileH,
        zIndex,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={selected ? BAMBOO_TILE_SELECTED_FACE : BAMBOO_TILE_FACE}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="tile-base pointer-events-none absolute inset-0 h-full w-full"
      />
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={labelFor(tile.code)}
          draggable={false}
          style={
            customImage
              ? {
                  transform: `translate(${customCrop?.cropX ?? 0}%, ${customCrop?.cropY ?? 0}%) scale(${customCrop?.cropZoom ?? 1})`,
                }
              : undefined
          }
          className={[
            "tile-art pointer-events-none absolute",
            customImage ? "tile-art-custom" : "tile-art-bamboo",
          ].join(" ")}
        />
      ) : (
        <span
          className="tile-glyph pointer-events-none absolute"
          style={{ color: glyphColor(tile.code) }}
        >
          {glyphFor(tile.code)}
        </span>
      )}
    </button>
  );
}

export const DEFAULT_TILE_METRICS: TileMetrics = {
  stepX: UNIT,
  stepY: STEP_Y,
  tileW: TILE_W,
  tileH: TILE_H,
  zOffset: Z_OFFSET,
};

export const DEFAULT_TILE_BG_SCALE = BG_SCALE;

export const TILE_PIXELS = { UNIT, TILE_W, TILE_H, Z_OFFSET };
