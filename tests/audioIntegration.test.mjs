import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import { CONFIG } from "../js/config.js";
import { chapters } from "../js/data/chapters.js";
import { AudioManager } from "../js/engine/AudioManager.js";
import { Game } from "../js/engine/Game.js";

test("audio config exposes splash, menu, chapter bgm, and sfx entries", () => {
  assert.equal(CONFIG.audio.splashBgm, "assets/audio/bgm/lobby.mp3");
  assert.equal(CONFIG.audio.menuBgm, "assets/audio/bgm/lobby.mp3");
  assert.equal(CONFIG.audio.chapterBgmFadeMs, 1800);
  assert.equal(CONFIG.audio.introAudioFadeMs, 0);
  assert.equal(CONFIG.audio.introVolume, 0.8);
  assert.equal(CONFIG.audio.sfx.uiTap, "assets/audio/sfx/ui_tap.mp3");
  assert.equal(CONFIG.audio.sfx.pageFlip, "assets/audio/sfx/page_flip.mp3");
  assert.equal(CONFIG.audio.sfx.choicePick, "assets/audio/sfx/choice_pick.mp3");
  assert.equal(CONFIG.audio.sfx.success, "assets/audio/sfx/success.mp3");
  assert.equal(CONFIG.audio.sfx.fail, "assets/audio/sfx/fail.mp3");

  assert.equal(chapters.find((chapter) => chapter.id === "chapter1").bgm, "assets/audio/bgm/chapter1.mp3");
  assert.equal(chapters.find((chapter) => chapter.id === "chapter1").introAudio, "assets/audio/bgm/intro1.mp3");
  assert.equal(chapters.find((chapter) => chapter.id === "chapter2").bgm, "assets/audio/bgm/chapter2.mp3");
  assert.equal(chapters.find((chapter) => chapter.id === "chapter2").introAudio, "assets/audio/bgm/intro2.mp3");
  assert.equal(chapters.find((chapter) => chapter.id === "chapter3").bgm, "assets/audio/bgm/chapter3.mp3");
  assert.equal(chapters.find((chapter) => chapter.id === "chapter3").introAudio, "assets/audio/bgm/intro3.mp3");
});

test("configured audio assets exist on disk", () => {
  const entries = [
    CONFIG.audio.splashBgm,
    CONFIG.audio.menuBgm,
    ...Object.values(CONFIG.audio.sfx),
    ...chapters.map((chapter) => chapter.bgm).filter(Boolean)
      .concat(chapters.map((chapter) => chapter.introAudio).filter(Boolean)),
    "assets/audio/bgm/node2_1.mp3"
  ];

  for (const entry of entries) {
    assert.equal(existsSync(new URL(`../${entry}`, import.meta.url)), true, entry);
  }
});

test("AudioManager plays bgm entries and cloned sound effects with configured volume", () => {
  class FakeAudio {
    static created = [];

    constructor(src = "") {
      this.src = src;
      this.volume = 1;
      this.loop = false;
      this.preload = "";
      this.played = false;
      FakeAudio.created.push(this);
    }

    play() {
      this.played = true;
      return Promise.resolve();
    }

    pause() {
      this.paused = true;
    }

    cloneNode() {
      const clone = new FakeAudio(this.src);
      clone.isClone = true;
      return clone;
    }
  }

  const originalAudio = globalThis.Audio;
  globalThis.Audio = FakeAudio;

  try {
    const audio = new AudioManager({ masterVolume: 0.5, bgmVolume: 0.35, sfxVolume: 0.95 });

    audio.playBgm({ src: "bgm.mp3", volume: 0.2 }, { fadeMs: 0 });
    audio.playSfx({ src: "tap.mp3", volume: 0.4 });

    assert.equal(audio.currentBgmSrc, "bgm.mp3");
    assert.equal(audio.currentBgm.volume, 0.1);

    const sfxClone = FakeAudio.created.find((instance) => instance.isClone);
    assert.ok(sfxClone);
    assert.equal(sfxClone.src, "tap.mp3");
    assert.equal(sfxClone.volume, 0.2);
    assert.equal(sfxClone.played, true);
  } finally {
    globalThis.Audio = originalAudio;
  }
});

test("AudioManager fades bgm volume up from silence", () => {
  class FakeAudio {
    constructor(src = "") {
      this.src = src;
      this.volume = 1;
      this.loop = false;
      this.preload = "";
    }

    play() {
      return Promise.resolve();
    }
  }

  const originalAudio = globalThis.Audio;
  const originalPerformance = globalThis.performance;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  let now = 0;
  const frames = [];

  globalThis.Audio = FakeAudio;
  globalThis.performance = { now: () => now };
  globalThis.requestAnimationFrame = (callback) => {
    frames.push(callback);
  };

  try {
    const audio = new AudioManager({ masterVolume: 1, bgmVolume: 0.4 });

    audio.playBgm("chapter.mp3", { fadeMs: 1000 });

    assert.equal(audio.currentBgm.volume, 0);

    now = 500;
    frames.shift()();
    assert.equal(audio.currentBgm.volume, 0.2);

    now = 1000;
    frames.shift()();
    assert.equal(audio.currentBgm.volume, 0.4);
  } finally {
    globalThis.Audio = originalAudio;
    globalThis.performance = originalPerformance;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
  }
});

test("splash intro flow unlocks audio, plays tap sfx, and starts menu bgm when intro ends", () => {
  globalThis.document = {
    createElement(tag) {
      if (tag === "canvas") {
        return { width: 0, height: 0, getContext: () => ({ drawImage() {} }) };
      }
      return {};
    }
  };
  globalThis.window = {
    devicePixelRatio: 1,
    addEventListener() {}
  };
  globalThis.performance = {
    now: () => 1000
  };
  globalThis.requestAnimationFrame = () => {};

  const canvas = {
    width: 0,
    height: 0,
    addEventListener() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: CONFIG.canvasWidth, height: CONFIG.canvasHeight };
    },
    getContext() {
      return { setTransform() {} };
    }
  };
  const game = new Game({ canvas, chapters, config: CONFIG });
  const calls = [];
  game.audio = {
    unlock: () => calls.push(["unlock"]),
    playSfx: (entry) => calls.push(["sfx", entry]),
    playBgm: (entry) => calls.push(["bgm", entry])
  };

  game.handlePress({ x: 1, y: 1 });
  game.handleIntroEnded();

  assert.deepEqual(calls, [
    ["unlock"],
    ["sfx", CONFIG.audio.sfx.uiTap],
    ["bgm", CONFIG.audio.menuBgm]
  ]);
});

test("ending state plays success or fail sfx based on ending result", () => {
  globalThis.document = {
    createElement(tag) {
      if (tag === "canvas") {
        return { width: 0, height: 0, getContext: () => ({ drawImage() {} }) };
      }
      return {};
    }
  };
  globalThis.window = {
    devicePixelRatio: 1,
    addEventListener() {}
  };
  globalThis.performance = {
    now: () => 1000
  };
  globalThis.requestAnimationFrame = () => {};

  const canvas = {
    width: 0,
    height: 0,
    addEventListener() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: CONFIG.canvasWidth, height: CONFIG.canvasHeight };
    },
    getContext() {
      return { setTransform() {} };
    }
  };

  const successGame = new Game({ canvas, chapters, config: CONFIG });
  const successSfx = [];
  successGame.audio = {
    unlock() {},
    playBgm() {},
    playSfx(entry) {
      successSfx.push(entry);
    }
  };
  successGame.startChapter(chapters.find((chapter) => chapter.id === "chapter1"), { transition: false });
  successGame.flow.goTo("end2");
  successGame.syncEndingState();

  assert.equal(successSfx.at(-1), CONFIG.audio.sfx.success);

  const failGame = new Game({ canvas, chapters, config: CONFIG });
  const failSfx = [];
  failGame.audio = {
    unlock() {},
    playBgm() {},
    playSfx(entry) {
      failSfx.push(entry);
    }
  };
  failGame.startChapter(chapters.find((chapter) => chapter.id === "chapter1"), { transition: false });
  failGame.flow.goTo("end1");
  failGame.syncEndingState();

  assert.equal(failSfx.at(-1), CONFIG.audio.sfx.fail);
});
