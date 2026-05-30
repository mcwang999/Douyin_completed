import test from "node:test";
import assert from "node:assert/strict";

import { mapPointerToCanvas } from "../js/engine/InputManager.js";

test("pointer mapping returns logical canvas coordinates on high density screens", () => {
  const point = mapPointerToCanvas({
    clientX: 195,
    clientY: 422,
    rect: {
      left: 0,
      top: 0,
      width: 390,
      height: 844
    },
    logicalWidth: 390,
    logicalHeight: 844
  });

  assert.deepEqual(point, { x: 195, y: 422 });
});

test("pointer mapping supports scaled CSS canvas sizes", () => {
  const point = mapPointerToCanvas({
    clientX: 240,
    clientY: 320,
    rect: {
      left: 20,
      top: 20,
      width: 780,
      height: 1688
    },
    logicalWidth: 390,
    logicalHeight: 844
  });

  assert.deepEqual(point, { x: 110, y: 150 });
});
