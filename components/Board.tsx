"use client";

import { useMemo } from "react";
import type { Tile as GameTile } from "@/lib/game";
import { isFree } from "@/lib/game";
import { honorImageKey } from "@/lib/glyphs";
import Tile, { TILE_PIXELS } from "./Tile";

type Props = {
  tiles: GameTile[];
  selectedId: number | null;
  hintedIds: Set<number>;
  tileImages: Map<string, string>;
  onTileClick: (tile: GameTile) => void;
  width: number;
  height: number;
};

export default function Board({
  tiles,
  selectedId,
  hintedIds,
  tileImages,
  onTileClick,
  width,
  height,
}: Props) {
  const free = useMemo(() => {
    const set = new Set<number>();
    for (const t of tiles) {
      if (!t.removed && isFree(t, tiles)) set.add(t.id);
    }
    return set;
  }, [tiles]);

  const { UNIT, TILE_W, TILE_H, Z_OFFSET } = TILE_PIXELS;
  // Add room for stacked layers (max z is ~5) + tile width/height
  const pxWidth = width * UNIT + TILE_W;
  const pxHeight = height * UNIT + TILE_H + 5 * Z_OFFSET;

  return (
    <div
      className="relative mx-auto"
      style={{ width: pxWidth, height: pxHeight }}
    >
      {tiles.map((t) => {
        if (t.removed) return null;
        const key = honorImageKey(t.code);
        const url = key ? tileImages.get(key) ?? null : null;
        return (
          <Tile
            key={t.id}
            tile={t}
            free={free.has(t.id)}
            selected={selectedId === t.id}
            hinted={hintedIds.has(t.id)}
            imageUrl={url}
            onClick={onTileClick}
          />
        );
      })}
    </div>
  );
}
