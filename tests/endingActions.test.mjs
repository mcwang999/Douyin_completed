import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG } from "../js/config.js";
import { getEndingAction, isEndingCardReady } from "../js/engine/EndingActions.js";

test("chapter one end2 offers entry into chapter two", () => {
  assert.deepEqual(getEndingAction("chapter1", "end2"), {
    type: "next_chapter",
    chapterId: "chapter2",
    label: "点击进入下一章"
  });
});

test("other endings restart from the beginning", () => {
  assert.deepEqual(getEndingAction("chapter1", "end1"), {
    type: "restart",
    label: "点击重新开始"
  });
});

test("chapter two end2 offers entry into chapter three", () => {
  assert.deepEqual(getEndingAction("chapter2", "end2"), {
    type: "next_chapter",
    chapterId: "chapter3",
    label: "点击进入下一章"
  });
});

test("chapter three end4 asks players to wait for the next chapter", () => {
  assert.deepEqual(getEndingAction("chapter3", "end4"), {
    type: "coming_soon",
    label: "敬请期待下一章"
  });
});

test("ending card waits for the configured delay before showing", () => {
  assert.equal(isEndingCardReady({ startedAt: 1000, elapsed: 5999, durationMs: 5000 }), false);
  assert.equal(isEndingCardReady({ startedAt: 1000, elapsed: 6000, durationMs: 5000 }), true);
});

test("ending card appears quickly after the ending plays", () => {
  assert.equal(CONFIG.endingNodeDurationMs, 1000);
});
