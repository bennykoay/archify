// png-pixels.mjs — OSM-SEE-006 O1: THIN pixel interface over pngjs.
//
// CONTRACT: this is the ONLY module in archify that imports pngjs. Colour
// assertions (tools/archify/scripts/colour-assert.mjs) and fixture builders
// call readPngPixels()/writePngPixels() and never touch pngjs. A future
// reader swap touches THIS FILE ONLY (seam proof: grep pngjs across the
// repo hits this file + package.json/package-lock.json and nowhere else).
//
// What it owns: PNG file bytes <-> flat RGBA buffers. No colour science, no
// sampling, no verdicts anywhere: medians, CIEDE2000, floors and populations
// all live in colour-assert.mjs. Adopted reader UNMODIFIED (npm pngjs 7.0.0,
// MIT, pure JS, zero dependencies — see OSM-SEE-006 report for the ruling).
//
// Provenance: sync API per the pngjs README (PNG.sync.read returns
// {width,height,data} with 4 bytes R,G,B,A per pixel).

import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

// Reader identity for reports and the swap seam.
export const PNG_READER = Object.freeze({ name: 'pngjs', version: '7.0.0' });

// Read a PNG file into raw pixels. Returns {width, height, data} where data
// is a Buffer of width*height*4 bytes (R,G,B,A per pixel, top-to-bottom).
// Throws loudly on unreadable/empty input (N5: no silent drops).
export function readPngPixels(pngPath) {
  const bytes = readFileSync(pngPath);
  if (!bytes || bytes.length === 0) throw new Error(`png-pixels: empty file ${pngPath}`);
  const png = PNG.sync.read(bytes);
  if (!png || !png.width || !png.height || !png.data) {
    throw new Error(`png-pixels: no pixel data in ${pngPath}`);
  }
  return { width: png.width, height: png.height, data: png.data };
}

// Write a flat RGBA buffer to a PNG file. rgba must be width*height*4 bytes.
// Used ONLY by calibration-fixture builders (never by assertions).
export function writePngPixels(pngPath, width, height, rgba) {
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error(`png-pixels: bad dimensions ${width}x${height}`);
  }
  if (!rgba || rgba.length !== width * height * 4) {
    throw new Error(`png-pixels: rgba length ${rgba && rgba.length} != ${width}x${height}x4`);
  }
  const png = new PNG({ width, height });
  Buffer.from(rgba).copy(png.data);
  writeFileSync(pngPath, PNG.sync.write(png));
  return { width, height, bytes: width * height * 4 };
}
