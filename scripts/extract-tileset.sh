#!/usr/bin/env bash
# Extract individual tile face PNGs from a KMahjongg sprite SVG.
# Output goes under public/tilesets/<theme>/.
#
# Usage: ./scripts/extract-tileset.sh <sprite.svg> <theme-name>
# Example: ./scripts/extract-tileset.sh /tmp/kmahjongg-previews/bamboo.svg bamboo

set -euo pipefail

SPRITE="${1:?sprite path required}"
THEME="${2:?theme name required}"

DEST="public/tilesets/${THEME}"
mkdir -p "$DEST"

# Render high-resolution raw elements. The extracted face elements have
# variable SVG bounding boxes; normalize-tileset.mjs places them into the
# final fixed tile canvas.
H="${TILESET_RAW_HEIGHT:-1024}"

extract() {
  local id="$1" outname="$2"
  rsvg-convert -i "$id" -h "$H" "$SPRITE" -o "$DEST/$outname.png"
}

# --- tile backgrounds ---
extract TILE_1     tile
extract TILE_1_SEL tile_selected

# --- bamboos (sōzu / our 'bam') ---
for i in 1 2 3 4 5 6 7 8 9; do extract "BAMBOO_$i" "bam-$i"; done

# --- characters (manzu / our 'char') ---
for i in 1 2 3 4 5 6 7 8 9; do extract "CHARACTER_$i" "char-$i"; done

# --- circles/dots (KMahjongg calls them ROD / our 'dot') ---
for i in 1 2 3 4 5 6 7 8 9; do extract "ROD_$i" "dot-$i"; done

# --- winds (East, South, West, North) ---
extract WIND_1 honor-east
extract WIND_2 honor-south
extract WIND_3 honor-west
extract WIND_4 honor-north

# --- dragons (Red, Green, White) ---
extract DRAGON_1 honor-red
extract DRAGON_2 honor-green
extract DRAGON_3 honor-white

# --- flowers + seasons ---
for i in 1 2 3 4; do extract "FLOWER_$i" "flower-$i"; done
for i in 1 2 3 4; do extract "SEASON_$i" "season-$i"; done

echo "Extracted $(ls "$DEST" | wc -l) PNGs to $DEST"
