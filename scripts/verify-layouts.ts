// Run dealSolvable() on each layout multiple times to confirm the layout
// is structurally playable. Exits non-zero on any failure.
//
// Usage: npx tsx scripts/verify-layouts.ts

import { dealSolvable } from "../lib/game";
import { LAYOUTS, BOARD_IDS } from "../lib/layouts";

const TRIALS_PER_LAYOUT = 20;

let failures = 0;
for (const id of BOARD_IDS) {
  const layout = LAYOUTS[id];
  let ok = 0;
  let lastError: unknown = null;
  for (let i = 0; i < TRIALS_PER_LAYOUT; i++) {
    try {
      dealSolvable(layout.positions);
      ok++;
    } catch (e) {
      lastError = e;
    }
  }
  const verdict = ok === TRIALS_PER_LAYOUT ? "OK" : "FAIL";
  console.log(
    `Layout ${id} (${layout.name}): ${ok}/${TRIALS_PER_LAYOUT} ${verdict}` +
      (lastError ? ` — last error: ${(lastError as Error).message}` : ""),
  );
  if (ok !== TRIALS_PER_LAYOUT) failures++;
}

process.exit(failures === 0 ? 0 : 1);
