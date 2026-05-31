import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG } from "../js/config.js";
import { getEndingAction, isEndingCardReady } from "../js/engine/EndingActions.js";

test("chapter one end2 offers entry into chapter two", () => {
  assert.deepEqual(getEndingAction("chapter1", "end2"), {
    type: "next_chapter",
    chapterId: "chapter2",
    result: "success",
    label: "今天不做人，用户意志已沦陷，网络世界尽在掌握"
  });
});

test("chapter one failure endings use the computer failure slogan", () => {
  assert.deepEqual(getEndingAction("chapter1", "end1"), {
    type: "restart",
    result: "failure",
    label: "你今天做人了，请重新开机"
  });
});

test("chapter two end2 offers entry into chapter three", () => {
  assert.deepEqual(getEndingAction("chapter2", "end2"), {
    type: "next_chapter",
    chapterId: "chapter3",
    result: "success",
    label: "今天不做人，拉响命运交响曲，血包炫完意满离"
  });
});

test("chapter two failure endings use the mosquito failure slogan", () => {
  assert.deepEqual(getEndingAction("chapter2", "end1"), {
    type: "restart",
    result: "failure",
    label: "你今天做人了，请重新起飞"
  });
});

test("chapter three end4 plays the out video", () => {
  assert.deepEqual(getEndingAction("chapter3", "end4"), {
    type: "outro",
    video: "assets/videos/out.mp4",
    result: "success",
    label: "今天不做人，成功超度打工人，世俗欲望全面封印"
  });
});

test("chapter three failure endings use the alarm clock failure slogan", () => {
  assert.deepEqual(getEndingAction("chapter3", "end1"), {
    type: "restart",
    result: "failure",
    label: "你今天做人了，请重新倒流时空"
  });
});

test("ending card waits for the configured delay before showing", () => {
  assert.equal(isEndingCardReady({ startedAt: 1000, elapsed: 5999, durationMs: 5000 }), false);
  assert.equal(isEndingCardReady({ startedAt: 1000, elapsed: 6000, durationMs: 5000 }), true);
});

test("ending card appears quickly after the ending plays", () => {
  assert.equal(CONFIG.endingNodeDurationMs, 2000);
});
