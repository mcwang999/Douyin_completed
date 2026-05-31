import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG } from "../js/config.js";
import { chapters, getChapterById } from "../js/data/chapters.js";
import { Game } from "../js/engine/Game.js";

globalThis.document = {
  createElement(tag) {
    if (tag === "canvas") {
      return { width: 0, height: 0, getContext: () => ({ drawImage() {} }) };
    }
    return {};
  }
};

let currentTime = 1000;

globalThis.window = {
  devicePixelRatio: 1,
  addEventListener() {}
};
globalThis.performance = {
  now: () => currentTime
};
globalThis.requestAnimationFrame = () => {};

function createCanvas() {
  return {
    width: 0,
    height: 0,
    addEventListener() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: CONFIG.canvasWidth, height: CONFIG.canvasHeight };
    },
    getContext() {
      return {
        setTransform() {},
        drawImage() {},
        clearRect() {},
        fillRect() {},
        save() {},
        restore() {}
      };
    }
  };
}

function createGame() {
  const game = new Game({ canvas: createCanvas(), chapters, config: CONFIG });
  const bgmCalls = [];
  game.audio = {
    unlock() {},
    playSfx() {},
    playBgm(entry, options) {
      bgmCalls.push({ entry, options });
    },
    bgmCalls
  };
  return game;
}

function pressExit(game) {
  game.exitButtonRect = { x: 318, y: 12, width: 60, height: 32 };
  game.handlePress({ x: 348, y: 28 });
}

test("exit button returns from a story chapter to the menu without clearing unlocks", () => {
  currentTime = 1000;
  const game = createGame();
  game.unlockStore.markCompleted("chapter1", "end2");
  game.startChapter(getChapterById("chapter2"), { transition: false });

  pressExit(game);

  assert.equal(game.phase, "menu");
  assert.equal(game.activeChapter.id, "chapter2");
  assert.deepEqual(game.unlockStore.getCompletedEndingKeys(), ["chapter1:end2"]);
  assert.deepEqual(game.audio.bgmCalls.at(-1), {
    entry: CONFIG.audio.menuBgm,
    options: undefined
  });
});

test("exit button stops an active intro video and returns to the menu", () => {
  currentTime = 1000;
  const game = createGame();
  game.startChapterIntro(getChapterById("chapter1"));
  let paused = false;
  game.activeIntro.video = {
    pause() {
      paused = true;
    }
  };

  pressExit(game);

  assert.equal(paused, true);
  assert.equal(game.phase, "menu");
  assert.equal(game.activeIntro, null);
  assert.equal(game.activeChapter, null);
  assert.deepEqual(game.audio.bgmCalls.at(-1), {
    entry: CONFIG.audio.menuBgm,
    options: undefined
  });
});
