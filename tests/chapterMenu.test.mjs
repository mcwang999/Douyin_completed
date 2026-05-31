import test from "node:test";
import assert from "node:assert/strict";

import { chapters, getChapterById, getUnlockedChapterIds } from "../js/data/chapters.js";
import { getChapterMenuItems, hitChapterMenuItem } from "../js/engine/ChapterMenu.js";

test("chapter catalog exposes three chapters and one coming soon item", () => {
  assert.deepEqual(chapters.map((chapter) => chapter.id), [
    "chapter1",
    "chapter2",
    "chapter3",
    "coming_soon"
  ]);
});

test("only chapter one is unlocked without completed endings", () => {
  const unlocked = getUnlockedChapterIds([]);

  assert.deepEqual(unlocked, ["chapter1"]);
});

test("chapter two unlocks after chapter one end2", () => {
  const unlocked = getUnlockedChapterIds(["chapter1:end2"]);

  assert.deepEqual(unlocked, ["chapter1", "chapter2"]);
});

test("chapter three unlocks after chapter two end2", () => {
  const unlocked = getUnlockedChapterIds(["chapter1:end2", "chapter2:end2"]);

  assert.deepEqual(unlocked, ["chapter1", "chapter2", "chapter3"]);
});

test("chapter menu hit detection returns unlocked chapter item", () => {
  const items = getChapterMenuItems(390, 693, chapters, ["chapter1"]);
  const hit = hitChapterMenuItem({ x: 80, y: items[0].y + 20 }, items);

  assert.equal(hit.chapterId, "chapter1");
  assert.equal(hit.locked, false);
});

test("chapter two starts from node1", () => {
  const chapter = getChapterById("chapter2");

  assert.equal(chapter.story.startNodeId, "node1");
});

test("chapter three menu subtitle describes the alarm clock", () => {
  const chapter = getChapterById("chapter3");

  assert.equal(chapter.subtitle, "闹钟：叫碳基生物起床");
});

test("chapter two uses chapter scoped image assets", () => {
  const chapter = getChapterById("chapter2");
  const intro = chapter.story.nodes.find((node) => node.id === "node1");
  const nextChapterEnding = chapter.story.nodes.find((node) => node.id === "end2");

  assert.equal(intro.image, "assets/images/chapter2/node1.png");
  assert.equal(nextChapterEnding.image, "assets/images/chapter2/end2.png");
});
