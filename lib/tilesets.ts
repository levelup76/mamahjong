import type { TileCode } from "./game";
import { baseCode } from "./glyphs";

const BAMBOO_ROOT = "/tilesets/bamboo-normalized";

const BAMBOO_CODES = new Set([
  ...Array.from({ length: 9 }, (_, i) => `bam-${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `char-${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `dot-${i + 1}`),
  ...Array.from({ length: 4 }, (_, i) => `flower-${i + 1}`),
  ...Array.from({ length: 4 }, (_, i) => `season-${i + 1}`),
  "honor-east",
  "honor-south",
  "honor-west",
  "honor-north",
  "honor-red",
  "honor-green",
  "honor-white",
]);

export const BAMBOO_TILE_FACE = `${BAMBOO_ROOT}/tile.png`;
export const BAMBOO_TILE_SELECTED_FACE = `${BAMBOO_ROOT}/tile_selected.png`;

export function bambooTileImage(code: TileCode): string | null {
  const base = baseCode(code);
  if (!BAMBOO_CODES.has(base)) return null;
  return `${BAMBOO_ROOT}/${base}.png`;
}
