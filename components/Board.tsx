"use client";

import type { ResolvedTileAsset } from "@/lib/assets";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Tile as GameTile } from "@/lib/game";
import { isFree } from "@/lib/game";
import { honorImageKey } from "@/lib/glyphs";
import { bambooTileImage } from "@/lib/tilesets";
import Tile, { DEFAULT_TILE_METRICS, type TileMetrics } from "./Tile";

type Props = {
  tiles: GameTile[];
  selectedId: number | null;
  hintedIds: Set<number>;
  tileImages: Map<string, ResolvedTileAsset>;
  onTileClick: (tile: GameTile) => void;
  width: number;
  height: number;
  metrics?: TileMetrics;
};

// useLayoutEffect logs a warning during SSR; alias to useEffect in that case.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Board({
  tiles,
  selectedId,
  hintedIds,
  tileImages,
  onTileClick,
  width,
  height,
  metrics,
}: Props) {
  const free = useMemo(() => {
    const set = new Set<number>();
    for (const t of tiles) {
      if (!t.removed && isFree(t, tiles)) set.add(t.id);
    }
    return set;
  }, [tiles]);

  const m = metrics ?? DEFAULT_TILE_METRICS;
  const pxWidth = width * m.stepX + m.tileW;
  const pxHeight = height * m.stepY + m.tileH + 5 * m.zOffset;

  // Scale-to-fit: measure the parent and apply a uniform CSS transform so the
  // natural-pixel stage fits exactly. Uses ResizeObserver for layout changes
  // (window resize, sidebar collapse, etc.) and re-measures on layout-out.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useIsoLayoutEffect(() => {
    const update = () => {
      const parent = wrapperRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const sx = rect.width / pxWidth;
      const sy = rect.height / pxHeight;
      // Cap upscale at 1.4× so tiny boards on huge monitors don't look pixelated.
      setScale(Math.min(sx, sy, 1.4));
    };
    update();
    let ro: ResizeObserver | null = null;
    const parent = wrapperRef.current?.parentElement;
    if (parent && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(parent);
    }
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [pxWidth, pxHeight]);

  return (
    <div
      ref={wrapperRef}
      style={{ width: pxWidth * scale, height: pxHeight * scale }}
      className="relative"
    >
      <div
        style={{
          width: pxWidth,
          height: pxHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="absolute top-0 left-0"
      >
        {tiles.map((t) => {
          if (t.removed) return null;
          const key = honorImageKey(t.code);
          const customTile = key ? tileImages.get(key) ?? null : null;
          const tileArtUrl = customTile?.url ?? bambooTileImage(t.code);
          return (
            <Tile
              key={t.id}
              tile={t}
              free={free.has(t.id)}
              selected={selectedId === t.id}
              hinted={hintedIds.has(t.id)}
              imageUrl={tileArtUrl}
              customImage={Boolean(customTile)}
              customCrop={customTile}
              metrics={m}
              onClick={onTileClick}
            />
          );
        })}
      </div>
    </div>
  );
}
