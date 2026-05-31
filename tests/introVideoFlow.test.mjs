import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import { CONFIG } from "../js/config.js";
import { chapters, getChapterById } from "../js/data/chapters.js";
import { getChoiceRects } from "../js/engine/ChoiceLayout.js";
import { getChapterMenuItems } from "../js/engine/ChapterMenu.js";
import { getEndingCardRect } from "../js/engine/EndingCard.js";
import { getShareCardButtonRects } from "../js/engine/ShareCard.js";
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
  const stopBgmCalls = [];
  game.audio = {
    unlock() {},
    playSfx() {},
    playBgm(entry, options) {
      bgmCalls.push({ entry, options });
    },
    stopBgm(options) {
      stopBgmCalls.push(options);
    },
    bgmCalls,
    stopBgmCalls
  };
  return game;
}

test("intro video config points to existing splash and chapter videos", () => {
  assert.equal(CONFIG.introVideo, "assets/videos/intro0.mp4");
  assert.equal(getChapterById("chapter1").introVideo, "assets/videos/intro1.mp4");
  assert.equal(getChapterById("chapter1").introAudio, "assets/audio/bgm/intro1.mp3");
  assert.equal(getChapterById("chapter1").shareImage, "assets/images/share_1.png");
  assert.equal(getChapterById("chapter2").introVideo, "assets/videos/intro2.mp4");
  assert.equal(getChapterById("chapter2").introAudio, "assets/audio/bgm/intro2.mp3");
  assert.equal(getChapterById("chapter2").shareImage, "assets/images/share_2.png");
  assert.equal(getChapterById("chapter3").introVideo, "assets/videos/intro3.mp4");
  assert.equal(getChapterById("chapter3").introAudio, "assets/audio/bgm/intro3.mp3");
  assert.equal(getChapterById("chapter3").shareImage, "assets/images/share_3.png");

  const entries = [
    CONFIG.introVideo,
    "assets/videos/out.mp4",
    "assets/videos/end2.mp4",
    "assets/videos/end3.mp4",
    ...chapters.map((chapter) => chapter.introVideo).filter(Boolean),
    ...chapters.map((chapter) => chapter.introAudio).filter(Boolean),
    ...chapters.map((chapter) => chapter.shareImage).filter(Boolean)
  ];

  for (const entry of entries) {
    assert.equal(existsSync(new URL(`../${entry}`, import.meta.url)), true, entry);
  }
});

test("splash tap plays intro0, hides tap-to-continue, and enters menu as soon as it ends", () => {
  const game = createGame();

  game.handlePress({ x: 1, y: 1 });

  assert.equal(game.phase, "intro");
  assert.equal(game.activeIntro.src, CONFIG.introVideo);
  assert.equal(game.activeIntro.continueOnTap, false);

  game.handlePress({ x: 1, y: 1 });
  assert.equal(game.phase, "intro");

  game.handleIntroEnded();

  assert.equal(game.phase, "menu");
});

test("chapter menu selection plays the chapter intro before starting node1", () => {
  const game = createGame();
  game.phase = "menu";
  game.chapterMenuItems = getChapterMenuItems(CONFIG.canvasWidth, CONFIG.canvasHeight, chapters, ["chapter1"]);

  game.handleMenuPress({ x: 80, y: game.chapterMenuItems[0].y + 20 });

  assert.equal(game.phase, "intro");
  assert.equal(game.activeIntro.src, "assets/videos/intro1.mp4");
  assert.equal(game.activeIntro.continueOnTap, false);
  assert.equal(game.activeChapter, null);
  assert.deepEqual(game.audio.bgmCalls.at(-1), {
    entry: "assets/audio/bgm/intro1.mp3",
    options: { fadeMs: CONFIG.audio.introAudioFadeMs, volume: CONFIG.audio.introVolume }
  });

  game.handleIntroEnded();

  assert.equal(game.phase, "story");
  assert.equal(game.activeChapter.id, "chapter1");
  assert.equal(game.flow.currentNode.id, getChapterById("chapter1").story.startNodeId);
  assert.deepEqual(game.audio.bgmCalls.at(-1), {
    entry: "assets/audio/bgm/chapter1.mp3",
    options: { fadeMs: CONFIG.audio.chapterBgmFadeMs }
  });
});

test("each chapter intro audio replaces background bgm and chapter bgm fades in after intro", () => {
  const expectations = [
    ["chapter1", "assets/audio/bgm/intro1.mp3", "assets/audio/bgm/chapter1.mp3"],
    ["chapter2", "assets/audio/bgm/intro2.mp3", "assets/audio/bgm/chapter2.mp3"],
    ["chapter3", "assets/audio/bgm/intro3.mp3", "assets/audio/bgm/chapter3.mp3"]
  ];

  for (const [chapterId, introAudio, chapterBgm] of expectations) {
    const game = createGame();
    game.phase = "menu";
    game.startChapterIntro(getChapterById(chapterId));

    assert.deepEqual(game.audio.bgmCalls.at(-1), {
      entry: introAudio,
      options: { fadeMs: CONFIG.audio.introAudioFadeMs, volume: CONFIG.audio.introVolume }
    });

    game.handleIntroEnded();

    assert.deepEqual(game.audio.bgmCalls.at(-1), {
      entry: chapterBgm,
      options: { fadeMs: CONFIG.audio.chapterBgmFadeMs }
    });
  }
});

test("ending card chapter navigation returns to the menu instead of playing target node1", () => {
  const game = createGame();
  game.startChapter(getChapterById("chapter2"), { transition: false });
  game.flow.goTo("end2");
  game.syncEndingState();
  game.handleIntroEnded();

  currentTime += CONFIG.endingNodeDurationMs;
  const rect = getEndingCardRect(CONFIG.canvasWidth, CONFIG.canvasHeight, game.endingAction);
  game.handlePress({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

  assert.equal(game.phase, "share");
  assert.equal(game.shareCard.image, "assets/images/share_2.png");

  const continueRect = getShareCardButtonRects(CONFIG.canvasWidth, CONFIG.canvasHeight)
    .find((item) => item.id === "continue");
  game.shareButtonRects = getShareCardButtonRects(CONFIG.canvasWidth, CONFIG.canvasHeight);
  game.handlePress({ x: continueRect.x + continueRect.width / 2, y: continueRect.y + continueRect.height / 2 });

  assert.equal(game.phase, "menu");
  assert.equal(game.activeIntro, null);
  assert.equal(game.activeChapter.id, "chapter2");
  assert.deepEqual(game.unlockStore.getCompletedEndingKeys(), ["chapter2:end2"]);
});

test("chapter three success ending card plays the out video and returns to menu when it ends", () => {
  const game = createGame();
  game.startChapter(getChapterById("chapter3"), { transition: false });
  game.flow.goTo("end4");
  game.syncEndingState();

  currentTime += CONFIG.endingNodeDurationMs;
  const rect = getEndingCardRect(CONFIG.canvasWidth, CONFIG.canvasHeight, game.endingAction);
  game.handlePress({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

  assert.equal(game.phase, "share");
  assert.equal(game.shareCard.image, "assets/images/share_3.png");

  const buttons = getShareCardButtonRects(CONFIG.canvasWidth, CONFIG.canvasHeight);
  const continueRect = buttons.find((item) => item.id === "continue");
  game.shareButtonRects = buttons;
  game.handlePress({ x: continueRect.x + continueRect.width / 2, y: continueRect.y + continueRect.height / 2 });

  assert.equal(game.phase, "intro");
  assert.equal(game.activeIntro.src, "assets/videos/out.mp4");
  assert.equal(game.activeIntro.continueOnTap, false);
  assert.equal(game.activeChapter.id, "chapter3");
  assert.deepEqual(game.audio.stopBgmCalls.at(-1), { fadeMs: 0 });

  game.handleIntroEnded();

  assert.equal(game.phase, "menu");
  assert.deepEqual(game.audio.bgmCalls.at(-1), {
    entry: CONFIG.audio.menuBgm,
    options: undefined
  });
});

test("success share card one-click share invokes navigator share and stays on the card", () => {
  const originalNavigator = globalThis.navigator;
  const shareCalls = [];
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      share(payload) {
        shareCalls.push(payload);
        return Promise.resolve();
      }
    }
  });

  try {
    const game = createGame();
    game.startChapter(getChapterById("chapter1"), { transition: false });
    game.flow.goTo("end2");
    game.syncEndingState();

    currentTime += CONFIG.endingNodeDurationMs;
    const rect = getEndingCardRect(CONFIG.canvasWidth, CONFIG.canvasHeight, game.endingAction);
    game.handlePress({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

    const buttons = getShareCardButtonRects(CONFIG.canvasWidth, CONFIG.canvasHeight);
    const shareRect = buttons.find((item) => item.id === "share");
    game.shareButtonRects = buttons;
    game.handlePress({ x: shareRect.x + shareRect.width / 2, y: shareRect.y + shareRect.height / 2 });

    assert.equal(game.phase, "share");
    assert.equal(shareCalls.length, 1);
    assert.equal(shareCalls[0].title, "今天不做人");
    assert.equal(shareCalls[0].text, game.shareCard.action.label);
  } finally {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator
    });
  }
});

test("chapter two end2 and end3 play their ending videos before ending state starts", () => {
  const expectations = [
    ["end2", "assets/videos/end2.mp4"],
    ["end3", "assets/videos/end3.mp4"]
  ];

  for (const [endingId, video] of expectations) {
    const game = createGame();
    const chapter = getChapterById("chapter2");
    const node = chapter.story.nodes.find((item) => item.id === endingId);
    game.startChapter(chapter, { transition: false });

    assert.equal(node.endingVideo, video);

    game.flow.goTo(endingId);
    game.syncEndingState();

    assert.equal(game.phase, "intro");
    assert.equal(game.activeIntro.src, video);
    assert.equal(game.endingNodeKey, null);
    assert.deepEqual(game.unlockStore.getCompletedEndingKeys(), []);

    game.handleIntroEnded();

    assert.equal(game.phase, "story");
    assert.equal(game.endingNodeKey, `chapter2:${endingId}`);
    assert.deepEqual(game.unlockStore.getCompletedEndingKeys(), [`chapter2:${endingId}`]);
  }
});

test("chapter one node2_1 starts its dedicated bgm when reached", () => {
  const game = createGame();
  const chapter = getChapterById("chapter1");
  game.startChapter(chapter, { transition: false });
  game.flow.goTo("opening_choice");
  game.choiceRects = getChoiceRects(CONFIG.canvasWidth, CONFIG.canvasHeight, game.flow.currentNode.choices);
  const targetRect = game.choiceRects.find((rect) => rect.choice.next === "node2_1");
  const node = chapter.story.nodes.find((item) => item.id === "node2_1");

  assert.equal(node.bgm, "assets/audio/bgm/node2_1.mp3");

  game.handlePress({
    x: targetRect.x + targetRect.width / 2,
    y: targetRect.y + targetRect.height / 2
  });

  assert.equal(game.flow.currentNode.id, "node2_1");
  assert.deepEqual(game.audio.bgmCalls.at(-1), {
    entry: "assets/audio/bgm/node2_1.mp3",
    options: { fadeMs: CONFIG.audio.chapterBgmFadeMs }
  });
});
