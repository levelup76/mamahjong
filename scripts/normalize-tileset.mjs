#!/usr/bin/env node

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = "public/tilesets/bamboo";
const destDir = "public/tilesets/bamboo-normalized";

const outputScale = 2;
const baseCanvas = { width: 195, height: 256 };
const canvas = {
  width: baseCanvas.width * outputScale,
  height: baseCanvas.height * outputScale,
};

// KMahjongg tilesets define a full tile, a smaller tileface area, and a
// per-level offset. The documented classic metrics are:
// tile 96x116, face 69x89, level offset 12.
const kdeMetrics = {
  tileWidth: 96,
  tileHeight: 116,
  faceWidth: 69,
  faceHeight: 89,
  levelOffset: 12,
};

const faceRect = {
  left: Math.round(canvas.width * (kdeMetrics.levelOffset / kdeMetrics.tileWidth)),
  top: Math.round(canvas.height * (kdeMetrics.levelOffset / kdeMetrics.tileHeight)),
  width: Math.round(canvas.width * (kdeMetrics.faceWidth / kdeMetrics.tileWidth)),
  height: Math.round(canvas.height * (kdeMetrics.faceHeight / kdeMetrics.tileHeight)),
};

const backgroundNames = new Set(["tile.png", "tile_selected.png"]);

await mkdir(destDir, { recursive: true });

const files = (await readdir(sourceDir))
  .filter((file) => file.endsWith(".png"))
  .sort();

for (const file of files) {
  const input = path.join(sourceDir, file);
  const output = path.join(destDir, file);

  if (backgroundNames.has(file)) {
    await sharp(input)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize({
        width: canvas.width,
        height: canvas.height,
        fit: "fill",
        kernel: "lanczos3",
      })
      .png()
      .toFile(output);
    continue;
  }

  const normalizedFace = await sharp(input)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({
      width: faceRect.width,
      height: faceRect.height,
      fit: "inside",
      withoutEnlargement: false,
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();
  const faceMeta = await sharp(normalizedFace).metadata();
  const left = faceRect.left + Math.round((faceRect.width - (faceMeta.width ?? faceRect.width)) / 2);
  const top = faceRect.top + Math.round((faceRect.height - (faceMeta.height ?? faceRect.height)) / 2);

  await sharp({
    create: {
      width: canvas.width,
      height: canvas.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: normalizedFace, left, top }])
    .png()
    .toFile(output);
}

console.log(
  `Normalized ${files.length} PNGs into ${destDir} (${canvas.width}x${canvas.height}, face ${faceRect.left},${faceRect.top} ${faceRect.width}x${faceRect.height})`,
);
