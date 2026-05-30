import test from "node:test";
import assert from "node:assert/strict";

import { CanvasRenderer } from "../js/engine/CanvasRenderer.js";
import { CONFIG } from "../js/config.js";

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
  const filters = [];
  return {
    texts,
    filters,
    setTransform() {},
    clearRect() {},
    fillRect() {},
    drawImage() {},
    save() {},
    restore() {},
    translate() {},
    scale() {},
    stroke() {},
    fill() {},
    beginPath() {},
    moveTo() {},
    arcTo() {},
    closePath() {},
    measureText(text) {
      return { width: [...text].length * 12 };
    },
    fillText(text) {
      texts.push(text);
    },
    set fillStyle(value) {},
    set strokeStyle(value) {},
    set lineWidth(value) {},
    set font(value) {},
    set textAlign(value) {},
    set textBaseline(value) {},
    set filter(value) {
      filters.push(value);
    }
  };
}

function createCanvas(ctx) {
  return {
    width: 0,
    height: 0,
    getContext() {
      return ctx;
    }
  };
}

test("ending card still renders when the ending image has not loaded yet", () => {
  const ctx = createContext();
  const renderer = new CanvasRenderer(createCanvas(ctx), CONFIG);

  renderer.renderStoryNode({
    node: {
      id: "end1",
      kind: "ending",
      image: "assets/images/chapter1/end1.jpg",
      text: "结局文字"
    },
    elapsed: 6000,
    endingAction: {
      type: "restart",
      label: "点击重新开始"
    }
  });

  assert.ok(ctx.texts.includes("点击重新开始"));
});

test("ending card uses the choice style blurred ending backdrop", () => {
  const ctx = createContext();
  const renderer = new CanvasRenderer(createCanvas(ctx), CONFIG);
  const image = "assets/images/chapter1/end1.jpg";
  renderer.imageCache.set(image, {
    loaded: true,
    image: { width: 941, height: 1672 }
  });

  renderer.renderStoryNode({
    node: {
      id: "end1",
      kind: "ending",
      image,
      text: "结局文字"
    },
    elapsed: 6000,
    endingAction: {
      type: "restart",
      label: "点击重新开始"
    }
  });

  assert.ok(ctx.filters.includes("blur(9px)"));
  assert.ok(ctx.texts.includes("点击重新开始"));
});
