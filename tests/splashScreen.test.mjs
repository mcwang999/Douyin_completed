import test from "node:test";
import assert from "node:assert/strict";

import { getContainRect, getSplashAnimationFrame, isSplashStartTap } from "../js/engine/SplashScreen.js";

test("splash screen accepts taps inside the logical canvas", () => {
  assert.equal(isSplashStartTap({ x: 120, y: 420 }, 390, 844), true);
});

test("splash screen ignores taps outside the logical canvas", () => {
  assert.equal(isSplashStartTap({ x: 420, y: 420 }, 390, 844), false);
});

test("splash animation frame returns bounded camera and overlay values", () => {
  const frame = getSplashAnimationFrame(1200);

  assert.ok(frame.scale >= 1.002);
  assert.ok(frame.scale <= 1.01);
  assert.ok(Math.abs(frame.offsetX) <= 4);
  assert.ok(Math.abs(frame.offsetY) <= 5);
  assert.ok(frame.scanlineAlpha >= 0.08);
  assert.ok(frame.scanlineAlpha <= 0.18);
});

test("contain rect preserves a portrait image ratio inside the canvas", () => {
  const rect = getContainRect({
    sourceWidth: 1024,
    sourceHeight: 1536,
    targetWidth: 390,
    targetHeight: 844
  });

  assert.equal(rect.width, 390);
  assert.equal(Math.round(rect.height), 585);
  assert.equal(rect.x, 0);
  assert.equal(Math.round(rect.y), 130);
});

test("contain rect preserves a landscape image ratio inside the canvas", () => {
  const rect = getContainRect({
    sourceWidth: 1600,
    sourceHeight: 900,
    targetWidth: 390,
    targetHeight: 844
  });

  assert.equal(rect.width, 390);
  assert.equal(Math.round(rect.height), 219);
  assert.equal(rect.x, 0);
  assert.equal(Math.round(rect.y), 312);
});
