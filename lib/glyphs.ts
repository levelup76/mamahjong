// Maps tile codes to Unicode mahjong glyphs (U+1F000..U+1F02B).
// Used as placeholder artwork until per-board honor images are uploaded.
// Honor codes may carry a "@board-N" suffix from tagHonorsForBoard(); we strip
// it before lookup so all 4 copies of a tagged honor render with the same
// glyph (and later, the same custom image).

import type { TileCode } from "./game";

const BASE_GLYPHS: Record<string, string> = {
  // bamboo (sōzu)
  "bam-1": "🀐", "bam-2": "🀑", "bam-3": "🀒", "bam-4": "🀓", "bam-5": "🀔",
  "bam-6": "🀕", "bam-7": "🀖", "bam-8": "🀗", "bam-9": "🀘",
  // characters (manzu)
  "char-1": "🀇", "char-2": "🀈", "char-3": "🀉", "char-4": "🀊", "char-5": "🀋",
  "char-6": "🀌", "char-7": "🀍", "char-8": "🀎", "char-9": "🀏",
  // dots (pinzu)
  "dot-1": "🀙", "dot-2": "🀚", "dot-3": "🀛", "dot-4": "🀜", "dot-5": "🀝",
  "dot-6": "🀞", "dot-7": "🀟", "dot-8": "🀠", "dot-9": "🀡",
  // winds + dragons (the 7 honors)
  "honor-east":  "🀀", "honor-south": "🀁", "honor-west":  "🀂", "honor-north": "🀃",
  "honor-red":   "🀄", "honor-green": "🀅", "honor-white": "🀆",
  // bonus tiles
  "flower-1": "🀦", "flower-2": "🀧", "flower-3": "🀨", "flower-4": "🀩",
  "season-1": "🀢", "season-2": "🀣", "season-3": "🀤", "season-4": "🀥",
};

export function baseCode(code: TileCode): string {
  const at = code.indexOf("@");
  return at === -1 ? code : code.slice(0, at);
}

export function glyphFor(code: TileCode): string {
  return BASE_GLYPHS[baseCode(code)] ?? "?";
}

/** Friendly label used for accessibility / hover tooltips. */
export function labelFor(code: TileCode): string {
  const base = baseCode(code);
  if (base.startsWith("bam-")) return `Bambusz ${base.slice(4)}`;
  if (base.startsWith("char-")) return `Írásjel ${base.slice(5)}`;
  if (base.startsWith("dot-")) return `Kör ${base.slice(4)}`;
  if (base.startsWith("flower-")) return `Virág ${base.slice(7)}`;
  if (base.startsWith("season-")) return `Évszak ${base.slice(7)}`;
  if (base === "honor-east") return "Kelet";
  if (base === "honor-south") return "Dél";
  if (base === "honor-west") return "Nyugat";
  if (base === "honor-north") return "Észak";
  if (base === "honor-red") return "Vörös sárkány";
  if (base === "honor-green") return "Zöld sárkány";
  if (base === "honor-white") return "Fehér sárkány";
  return base;
}

export function isHonor(code: TileCode): boolean {
  return baseCode(code).startsWith("honor-");
}

/**
 * Returns a CSS color for the glyph. Mimics traditional mahjong tile colors
 * (bamboo green, characters black/red, dots navy, dragons red/green/blue,
 * flowers/seasons warm) so the placeholder glyphs aren't all monochrome.
 */
export function glyphColor(code: TileCode): string {
  const base = baseCode(code);
  if (base.startsWith("bam-")) return "#1f6f3a";       // bamboo green
  if (base.startsWith("char-")) {
    return base === "char-1" ? "#b91c1c" : "#1f2937"; // 1万 traditionally red
  }
  if (base.startsWith("dot-")) return "#1d4ed8";       // dot navy
  if (base === "honor-red") return "#b91c1c";
  if (base === "honor-green") return "#15803d";
  if (base === "honor-white") return "#1d4ed8";
  if (base.startsWith("honor-")) return "#1f2937";     // winds: black
  if (base.startsWith("flower-")) return "#be185d";    // pink
  if (base.startsWith("season-")) return "#c2410c";    // warm orange
  return "#1f2937";
}

/**
 * For a board-tagged honor tile like "honor-east@board-3" returns the asset
 * lookup key "board-3/east". Returns null for non-tagged or non-honor codes.
 */
export function honorImageKey(code: TileCode): string | null {
  const at = code.indexOf("@");
  if (at === -1) return null;
  const front = code.slice(0, at); // "honor-east"
  const back = code.slice(at + 1); // "board-3"
  if (!front.startsWith("honor-")) return null;
  return `${back}/${front.slice("honor-".length)}`;
}
