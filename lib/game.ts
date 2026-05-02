// Mahjong solitaire core types & logic.
//
// Coordinate system: each tile occupies a 2x2 grid cell, anchored at (x, y).
// A tile at (x, y, z) covers the rectangle [x, x+2) x [y, y+2). Two tiles at
// the same z overlap if their rectangles intersect. A tile is "above" another
// when its z is one higher and the rectangles intersect.
//
// All coordinates are even integers for full tiles. Half-step offsets (odd
// coordinates) are also supported by the rules below; layout authors may use
// odd anchors for offset stacks.

export type Position = { x: number; y: number; z: number };

export type TileCode = string; // e.g. "bam-3", "honor-east", "flower-2"

export type Tile = Position & {
  id: number;       // unique within a deal
  code: TileCode;   // semantic identity for matching
  removed: boolean;
};

// ---- Tile catalogue ----------------------------------------------------------

const SUITS = ["bam", "char", "dot"] as const;
const WINDS = ["east", "south", "west", "north"] as const;
const DRAGONS = ["red", "green", "white"] as const;

/** Build the 72 pairs that make up a 144-tile mahjong set. */
export function buildPairs(): TileCode[][] {
  const pairs: TileCode[][] = [];

  // Suits: each rank has 4 copies = 2 pairs.
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 9; rank++) {
      const code: TileCode = `${suit}-${rank}`;
      pairs.push([code, code]);
      pairs.push([code, code]);
    }
  }
  // Honors: 4 winds + 3 dragons, 4 copies each = 2 pairs each.
  for (const w of WINDS) {
    pairs.push([`honor-${w}`, `honor-${w}`]);
    pairs.push([`honor-${w}`, `honor-${w}`]);
  }
  for (const d of DRAGONS) {
    pairs.push([`honor-${d}`, `honor-${d}`]);
    pairs.push([`honor-${d}`, `honor-${d}`]);
  }
  // Flowers and seasons: 4 unique each, but cross-matched within their group.
  // We still emit 2 pairs per group so the dealer treats them as 4 tiles each.
  pairs.push(["flower-1", "flower-2"]);
  pairs.push(["flower-3", "flower-4"]);
  pairs.push(["season-1", "season-2"]);
  pairs.push(["season-3", "season-4"]);

  return pairs; // 72 pairs == 144 tiles
}

/** Two codes match if they're identical, or both flowers, or both seasons. */
export function matches(a: TileCode, b: TileCode): boolean {
  if (a === b) return true;
  if (a.startsWith("flower-") && b.startsWith("flower-")) return true;
  if (a.startsWith("season-") && b.startsWith("season-")) return true;
  return false;
}

// ---- Free / blocked checks ---------------------------------------------------

function rectsOverlap(a: Position, b: Position): boolean {
  return Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;
}

function isAbove(t: Position, other: Position): boolean {
  return other.z === t.z + 1 && rectsOverlap(t, other);
}

function isAdjacentSameLayer(
  t: Position,
  other: Position,
  side: "left" | "right",
): boolean {
  if (other.z !== t.z) return false;
  if (Math.abs(other.y - t.y) >= 2) return false;
  return side === "left" ? other.x === t.x - 2 : other.x === t.x + 2;
}

export function isFree(tile: Tile, all: Tile[]): boolean {
  if (tile.removed) return false;
  for (const o of all) {
    if (o.removed || o.id === tile.id) continue;
    if (isAbove(tile, o)) return false;
  }
  let blockedLeft = false;
  let blockedRight = false;
  for (const o of all) {
    if (o.removed || o.id === tile.id) continue;
    if (!blockedLeft && isAdjacentSameLayer(tile, o, "left")) blockedLeft = true;
    if (!blockedRight && isAdjacentSameLayer(tile, o, "right")) blockedRight = true;
    if (blockedLeft && blockedRight) return false;
  }
  return !blockedLeft || !blockedRight;
}

// ---- Solvable deal -----------------------------------------------------------

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate a solvable tile arrangement for `positions` (must be 144 entries).
 *
 * Strategy: simulate playing the puzzle from the FULL state. Repeatedly pick
 * two currently-free positions and "remove" them, recording the order. Then
 * assign matching code-pairs to consecutive removals — replaying that order
 * is, by construction, a valid solution.
 *
 * Why: random pair-placement gives many unsolvable boards in classic layouts.
 */
export function dealSolvable(
  positions: Position[],
  rng: () => number = Math.random,
): Tile[] {
  if (positions.length !== 144) {
    throw new Error(`expected 144 positions, got ${positions.length}`);
  }

  // Build mutable tile list with monotonic ids.
  const working: Tile[] = positions.map((p, i) => ({
    ...p,
    id: i,
    code: "",
    removed: false,
  }));

  const removalOrder: Tile[] = [];

  for (let step = 0; step < 72; step++) {
    const free = working.filter((t) => !t.removed && isFree(t, working));
    if (free.length < 2) {
      // Layout is structurally unsolvable from full state — bail.
      throw new Error(
        `dealSolvable: stuck after ${step} pairs removed; only ${free.length} free tiles`,
      );
    }
    const shuffled = shuffle(free, rng);
    const a = shuffled[0];
    const b = shuffled[1];
    a.removed = true;
    b.removed = true;
    removalOrder.push(a, b);
  }

  // Assign codes: pair k goes to removalOrder[2k], removalOrder[2k+1].
  // (First removed pair gets the LAST-played pair-code — order doesn't actually
  // matter since pairs are independent, but we shuffle pairs anyway.)
  const pairs = shuffle(buildPairs(), rng);

  for (let k = 0; k < 72; k++) {
    const [c1, c2] = pairs[k];
    removalOrder[2 * k].code = c1;
    removalOrder[2 * k + 1].code = c2;
  }

  // Reset removed flags — caller starts the game with all tiles in play.
  for (const t of working) t.removed = false;

  return working;
}

// ---- Deal customization for per-board honor swaps ----------------------------

/**
 * Re-tag every honor tile's code with a board-prefix so the renderer can pick
 * the per-board custom image. e.g. "honor-east" -> "honor-east@board-3".
 *
 * Matching still works because matches() is identity-based: two tiles tagged
 * with the same boardId match each other (and within one deal there is only
 * ever one boardId). Flowers/seasons unchanged.
 */
export function tagHonorsForBoard(tiles: Tile[], boardId: number): Tile[] {
  return tiles.map((t) =>
    t.code.startsWith("honor-")
      ? { ...t, code: `${t.code}@board-${boardId}` }
      : t,
  );
}
