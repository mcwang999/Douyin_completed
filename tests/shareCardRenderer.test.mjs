import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG } from "../js/config.js";
import { CanvasRenderer } from "../js/engine/CanvasRenderer.js";

globalThis.window = {
  devicePixelRatio: 1,
  addEventListener() {}
};
globalThis.document = {
  createElement(tag) {
    if (tag === "canvas") {
      return { width: 0, height: 0, getContext() { return { drawImage() {} }; } };
    }
    return {};
  }
};

function createContext() {
  const texts = [];
  return {
    texts,
    setTransform() {},
    clearRect() {},
    fillRect() {},
    drawImage() {},
    save() {},
    restore() {},
    stroke() {},
    fill() {},
    beginPath() {},
    moveTo() {},
    arcTo() {},
    closePath() {},
    createRadialGradient() {
      return { addColorStop() {} };
    },
    fillText(text) {
      texts.push(text);
    },
    set fillStyle(value) {},
    set strokeStyle(value) {},
    set lineWidth(value) {},
    set font(value) {},
    set textAlign(value) {},
    set textBaseline(value) {}
  };
}

test("share card renders image loading state and the two action buttons", () => {
  const ctx = createContext();
  const canvas = { getContext: () => ctx };
  const renderer = new CanvasRenderer(canvas, CONFIG);

  const rects = renderer.renderShareCard({
    shareCard: {
      image: "assets/images/share_1.png",
      action: { label: "成功结局" }
    },
    elapsed: 1000
  });

  assert.deepEqual(rects.map((rect) => rect.id), ["share", "continue"]);
  assert.ok(ctx.texts.includes("分享卡片加载中"));
  assert.ok(ctx.texts.includes("一键分享"));
  assert.ok(ctx.texts.includes("继续下一章"));
});
