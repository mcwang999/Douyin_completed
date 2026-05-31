import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG } from "../js/config.js";
import { getChapterById, chapters } from "../js/data/chapters.js";
import { getEndingCardRect } from "../js/engine/EndingCard.js";
import { getShareCardButtonRects } from "../js/engine/ShareCard.js";
import { Game } from "../js/engine/Game.js";

globalThis.document = {
  createElement(tag) {
    if (tag === "canvas") {
      return { width: 0, height: 0, getContext() { return { drawImage() {} }; } };
    }
    return {};
  }
};

let currentTime = 0;

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
    getContext() {
      return {
        setTransform() {}
      };
    },
    addEventListener() {},
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: CONFIG.canvasWidth,
        height: CONFIG.canvasHeight
      };
    }
  };
}

function createGame() {
  return new Game({
    canvas: createCanvas(),
    chapters,
    config: CONFIG
  });
}

function endingCardCenter(action) {
  const rect = getEndingCardRect(CONFIG.canvasWidth, CONFIG.canvasHeight, action);
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

function shareContinueCenter() {
  const rect = getShareCardButtonRects(CONFIG.canvasWidth, CONFIG.canvasHeight)
    .find((item) => item.id === "continue");
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

function prepareShareButtons(game) {
  game.shareButtonRects = getShareCardButtonRects(CONFIG.canvasWidth, CONFIG.canvasHeight);
}

test("chapter one end2 card returns to menu and unlocks chapter two after delay", () => {
  currentTime = 1000;
  const game = createGame();
  game.startChapter(getChapterById("chapter1"));

  // Skip past the transition
  currentTime = 1000 + CONFIG.transitionDurationMs;
  game.finishTransition();

  game.flow.goTo("count_choice");
  game.flow.choose("wrong_count");
  game.syncEndingState();

  assert.deepEqual(game.unlockStore.getCompletedEndingKeys(), ["chapter1:end2"]);

  currentTime = 1000 + CONFIG.transitionDurationMs + CONFIG.endingNodeDurationMs - 1;
  game.handlePress(endingCardCenter(game.endingAction));
  assert.equal(game.activeChapter.id, "chapter1");
  assert.equal(game.flow.currentNode.id, "end2");

  currentTime = 1000 + CONFIG.transitionDurationMs + CONFIG.endingNodeDurationMs;
  game.handlePress({ x: 10, y: 10 });
  assert.equal(game.activeChapter.id, "chapter1");
  assert.equal(game.flow.currentNode.id, "end2");

  game.handlePress(endingCardCenter(game.endingAction));
  assert.equal(game.phase, "share");
  assert.equal(game.shareCard.image, "assets/images/share_1.png");

  prepareShareButtons(game);
  game.handlePress(shareContinueCenter());
  assert.equal(game.phase, "menu");
  assert.equal(game.activeIntro, null);
  assert.equal(game.activeChapter.id, "chapter1");
  assert.equal(game.flow.currentNode.id, "end2");
  assert.deepEqual(game.unlockStore.getCompletedEndingKeys(), ["chapter1:end2"]);

  const unlockedChapterIds = game.unlockStore.getCompletedEndingKeys();
  assert.deepEqual(unlockedChapterIds, ["chapter1:end2"]);
});

test("other ending cards restart the current chapter after delay", () => {
  currentTime = 1000;
  const game = createGame();
  game.startChapter(getChapterById("chapter1"));

  // Skip past the transition
  currentTime = 1000 + CONFIG.transitionDurationMs;
  game.finishTransition();

  game.flow.goTo("end1");
  game.syncEndingState();

  currentTime = 1000 + CONFIG.transitionDurationMs + CONFIG.endingNodeDurationMs;
  game.handlePress(endingCardCenter(game.endingAction));

  assert.equal(game.phase, "intro");
  assert.equal(game.activeIntro.src, "assets/videos/intro1.mp4");

  game.handleIntroEnded();
  assert.equal(game.activeChapter.id, "chapter1");
  assert.equal(game.flow.currentNode.id, "computer_intro");
});

test("chapter two end2 card returns to menu and unlocks chapter three after delay", () => {
  currentTime = 1000;
  const game = createGame();
  game.startChapter(getChapterById("chapter2"));

  // Skip past the transition
  currentTime = 1000 + CONFIG.transitionDurationMs;
  game.finishTransition();

  game.flow.goTo("end2");
  game.syncEndingState();
  game.handleIntroEnded();

  assert.deepEqual(game.unlockStore.getCompletedEndingKeys(), ["chapter2:end2"]);

  currentTime = 1000 + CONFIG.transitionDurationMs + CONFIG.endingNodeDurationMs;
  game.handlePress(endingCardCenter(game.endingAction));

  assert.equal(game.phase, "share");
  assert.equal(game.shareCard.image, "assets/images/share_2.png");

  prepareShareButtons(game);
  game.handlePress(shareContinueCenter());

  assert.equal(game.phase, "menu");
  assert.equal(game.activeIntro, null);
  assert.equal(game.activeChapter.id, "chapter2");
  assert.equal(game.flow.currentNode.id, "end2");
  assert.deepEqual(game.unlockStore.getCompletedEndingKeys(), ["chapter2:end2"]);
});

test("chapter two non-end2 ending cards restart chapter two", () => {
  currentTime = 1000;
  const game = createGame();
  game.startChapter(getChapterById("chapter2"));

  // Skip past the transition
  currentTime = 1000 + CONFIG.transitionDurationMs;
  game.finishTransition();

  game.flow.goTo("end1");
  game.syncEndingState();

  currentTime = 1000 + CONFIG.transitionDurationMs + CONFIG.endingNodeDurationMs;
  game.handlePress(endingCardCenter(game.endingAction));

  assert.equal(game.phase, "intro");
  assert.equal(game.activeIntro.src, "assets/videos/intro2.mp4");

  game.handleIntroEnded();
  assert.equal(game.activeChapter.id, "chapter2");
  assert.equal(game.flow.currentNode.id, "node1");
});
