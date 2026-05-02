// Five 144-tile layouts. Each layout is composed of rectangular tile-blocks
// expressed as { z, x0, y0, w, h }. Coordinates use the same 2-unit-per-tile
// grid as lib/game.ts (so a w=12 block has 12 tile columns spanning x..x+22).
//
// Each layout MUST sum to exactly 144 tiles. The solvable dealer in game.ts
// will throw if a layout is structurally unplayable from the full state.

import type { Position } from "./game";

export type BoardId = 1 | 2 | 3 | 4 | 5;

export type Layout = {
  id: BoardId;
  name: string;
  description: string;
  width: number;       // logical grid width (max x + 2)
  height: number;      // logical grid height (max y + 2)
  positions: Position[];
};

type Block = { z: number; x0: number; y0: number; w: number; h: number };

function expandBlocks(blocks: Block[]): Position[] {
  const out: Position[] = [];
  for (const b of blocks) {
    for (let iy = 0; iy < b.h; iy++) {
      for (let ix = 0; ix < b.w; ix++) {
        out.push({ x: b.x0 + ix * 2, y: b.y0 + iy * 2, z: b.z });
      }
    }
  }
  return out;
}

// 1) Teknős — body 12+14+16+16+16+16+14+12=116 + back 20+6+2 = 144
const TURTLE = expandBlocks([
  { z: 0, x0: 4,  y0: 0,  w: 12, h: 1 },
  { z: 0, x0: 2,  y0: 2,  w: 14, h: 1 },
  { z: 0, x0: 0,  y0: 4,  w: 16, h: 1 },
  { z: 0, x0: 0,  y0: 6,  w: 16, h: 1 },
  { z: 0, x0: 0,  y0: 8,  w: 16, h: 1 },
  { z: 0, x0: 0,  y0: 10, w: 16, h: 1 },
  { z: 0, x0: 2,  y0: 12, w: 14, h: 1 },
  { z: 0, x0: 4,  y0: 14, w: 12, h: 1 },
  { z: 1, x0: 4,  y0: 4,  w: 5,  h: 4 }, // 20
  { z: 2, x0: 6,  y0: 6,  w: 3,  h: 2 }, // 6
  { z: 3, x0: 7,  y0: 7,  w: 2,  h: 1 }, // 2
]);

// 2) Piramis — 90 + 40 + 12 + 2 = 144
const PYRAMID = expandBlocks([
  { z: 0, x0: 0, y0: 0, w: 10, h: 9 }, // 90
  { z: 1, x0: 1, y0: 2, w: 8,  h: 5 }, // 40
  { z: 2, x0: 3, y0: 4, w: 6,  h: 2 }, // 12
  { z: 3, x0: 4, y0: 5, w: 2,  h: 1 }, // 2
]);

// 3) Kereszt — 88 + 32 + 16 + 8 = 144
const CROSS = expandBlocks([
  { z: 0, x0: 0,  y0: 6,  w: 16, h: 4 }, // 64 horizontal
  { z: 0, x0: 12, y0: 0,  w: 4,  h: 3 }, // 12 top arm
  { z: 0, x0: 12, y0: 16, w: 4,  h: 3 }, // 12 bottom arm
  { z: 1, x0: 2,  y0: 8,  w: 12, h: 2 }, // 24 horizontal
  { z: 1, x0: 13, y0: 4,  w: 2,  h: 2 }, // 4
  { z: 1, x0: 13, y0: 14, w: 2,  h: 2 }, // 4
  { z: 2, x0: 4,  y0: 8,  w: 8,  h: 2 }, // 16
  { z: 3, x0: 6,  y0: 8,  w: 4,  h: 2 }, // 8
]);

// 4) Sárkány — 96 body + 4 tail + 8 head + 8 fins + 24 spine + 4 crest = 144
const DRAGON = expandBlocks([
  { z: 0, x0: 4,  y0: 4,  w: 16, h: 6 }, // 96 body
  { z: 0, x0: 0,  y0: 5,  w: 2,  h: 2 }, // 4  tail
  { z: 0, x0: 36, y0: 4,  w: 4,  h: 2 }, // 8  head
  { z: 0, x0: 12, y0: 2,  w: 2,  h: 1 }, // 2  top fin 1
  { z: 0, x0: 22, y0: 2,  w: 2,  h: 1 }, // 2  top fin 2
  { z: 0, x0: 12, y0: 10, w: 2,  h: 1 }, // 2  bottom fin 1
  { z: 0, x0: 22, y0: 10, w: 2,  h: 1 }, // 2  bottom fin 2
  { z: 1, x0: 6,  y0: 5,  w: 12, h: 2 }, // 24 spine
  { z: 2, x0: 10, y0: 5,  w: 2,  h: 2 }, // 4  crest
]);

// 5) Vár — 120 floor + 16 corners + 4 tower-tops + 4 keep = 144
const CASTLE = expandBlocks([
  { z: 0, x0: 0,  y0: 0,  w: 12, h: 10 }, // 120 floor
  { z: 1, x0: 0,  y0: 0,  w: 2,  h: 2  }, // 4 NW
  { z: 1, x0: 20, y0: 0,  w: 2,  h: 2  }, // 4 NE
  { z: 1, x0: 0,  y0: 16, w: 2,  h: 2  }, // 4 SW
  { z: 1, x0: 20, y0: 16, w: 2,  h: 2  }, // 4 SE
  { z: 2, x0: 0,  y0: 0,  w: 1,  h: 1  }, // 1 NW top
  { z: 2, x0: 22, y0: 0,  w: 1,  h: 1  }, // 1 NE top
  { z: 2, x0: 0,  y0: 18, w: 1,  h: 1  }, // 1 SW top
  { z: 2, x0: 22, y0: 18, w: 1,  h: 1  }, // 1 SE top
  { z: 1, x0: 9,  y0: 7,  w: 2,  h: 2  }, // 4 central keep base
]);

function bounds(positions: import("./game").Position[]): {
  width: number;
  height: number;
} {
  let mx = 0;
  let my = 0;
  for (const p of positions) {
    if (p.x + 2 > mx) mx = p.x + 2;
    if (p.y + 2 > my) my = p.y + 2;
  }
  return { width: mx, height: my };
}

function assertCount(name: string, positions: import("./game").Position[]) {
  if (positions.length !== 144) {
    throw new Error(
      `Layout ${name}: expected 144 tiles, got ${positions.length}`,
    );
  }
}

assertCount("Teknős", TURTLE);
assertCount("Piramis", PYRAMID);
assertCount("Kereszt", CROSS);
assertCount("Sárkány", DRAGON);
assertCount("Vár", CASTLE);

export const LAYOUTS: Record<BoardId, Layout> = {
  1: { id: 1, name: "Teknős",  description: "A klasszikus mahjong forma — szelíd kezdés.", positions: TURTLE,  ...bounds(TURTLE)  },
  2: { id: 2, name: "Piramis", description: "Lépcsős piramis négy szinttel.",              positions: PYRAMID, ...bounds(PYRAMID) },
  3: { id: 3, name: "Kereszt", description: "Szimmetrikus kereszt négy emelettel.",         positions: CROSS,   ...bounds(CROSS)   },
  4: { id: 4, name: "Sárkány", description: "Hosszú sárkány test, fej és farok.",           positions: DRAGON,  ...bounds(DRAGON)  },
  5: { id: 5, name: "Vár",     description: "Négytornyú vár központi toronnyal.",           positions: CASTLE,  ...bounds(CASTLE)  },
};

export const BOARD_IDS: BoardId[] = [1, 2, 3, 4, 5];

export function getLayout(id: BoardId): Layout {
  return LAYOUTS[id];
}
