import test from "node:test";
import assert from "node:assert/strict";

import { CONFIG } from "../js/config.js";
import { getChapterById, chapters } from "../js/data/chapters.js";
import { getEndingCardRect } from "../js/engine/EndingCard.js";
import { Game } from "../js/engine/Game.js";

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

test("chapter one end2 card enters and unlocks chapter two after delay", () => {
  currentTime = 1000;
  const game = createGame();
  game.startChapter(getChapterById("chapter1"));
  game.flow.goTo("count_choice");
  game.flow.choose("wrong_count");
  game.syncEndingState();

  assert.deepEqual(game.unlockStore.getCompletedEndingKeys(), ["chapter1:end2"]);

  currentTime = 1000 + CONFIG.endingNodeDurationMs - 1;
  game.handlePress(endingCardCenter(game.endingAction));
  assert.equal(game.activeChapter.id, "chapter1");
  assert.equal(game.flow.currentNode.id, "end2");

  currentTime = 1000 + CONFIG.endingNodeDurationMs;
  game.handlePress({ x: 10, y: 10 });
  assert.equal(game.activeChapter.id, "chapter1");
  assert.equal(game.flow.currentNode.id, "end2");

  game.handlePress(endingCardCenter(game.endingAction));
  assert.equal(game.activeChapter.id, "chapter2");
  assert.equal(game.flow.currentNode.id, "node1");
  assert.deepEqual(game.unlockStore.getCompletedEndingKeys(), ["chapter1:end2"]);
});

test("other ending cards restart the current chapter after delay", () => {
  currentTime = 1000;
  const game = createGame();
  game.startChapter(getChapterById("chapter1"));
  game.flow.goTo("end1");
  game.syncEndingState();

  currentTime = 1000 + CONFIG.endingNodeDurationMs;
  game.handlePress(endingCardCenter(game.endingAction));

  assert.equal(game.activeChapter.id, "chapter1");
  assert.equal(game.flow.currentNode.id, "computer_intro");
});

test("chapter two end2 card enters and unlocks chapter three after delay", () => {
  currentTime = 1000;
  const game = createGame();
  game.startChapter(getChapterById("chapter2"));
  game.flow.goTo("end2");
  game.syncEndingState();

  assert.deepEqual(game.unlockStore.getCompletedEndingKeys(), ["chapter2:end2"]);

  currentTime = 1000 + CONFIG.endingNodeDurationMs;
  game.handlePress(endingCardCenter(game.endingAction));

  assert.equal(game.activeChapter.id, "chapter3");
  assert.equal(game.flow.currentNode.id, "chapter3_placeholder");
});

test("chapter two non-end2 ending cards restart chapter two", () => {
  currentTime = 1000;
  const game = createGame();
  game.startChapter(getChapterById("chapter2"));
  game.flow.goTo("end1");
  game.syncEndingState();

  currentTime = 1000 + CONFIG.endingNodeDurationMs;
  game.handlePress(endingCardCenter(game.endingAction));

  assert.equal(game.activeChapter.id, "chapter2");
  assert.equal(game.flow.currentNode.id, "node1");
});
