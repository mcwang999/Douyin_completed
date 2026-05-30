import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { CONFIG } from "../js/config.js";

test("logical canvas ratio matches the uploaded image assets", () => {
  const assetRatio = 941 / 1672;
  const canvasRatio = CONFIG.canvasWidth / CONFIG.canvasHeight;

  assert.ok(Math.abs(canvasRatio - assetRatio) < 0.001);
});

test("canvas css uses the asset ratio instead of forcing a mismatched phone ratio", () => {
  const css = readFileSync(new URL("../styles/main.css", import.meta.url), "utf8");

  assert.match(css, /#gameCanvas\s*\{[\s\S]*aspect-ratio:\s*941\s*\/\s*1672;/);
  assert.doesNotMatch(css, /#gameCanvas\s*\{[\s\S]*aspect-ratio:\s*9\s*\/\s*16;/);
});
