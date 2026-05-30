import test from "node:test";
import assert from "node:assert/strict";

import { getChapterById } from "../js/data/chapters.js";
import { StoryFlow } from "../js/engine/StoryFlow.js";

const story = getChapterById("chapter1").story;
const chapter1Asset = (name) => `assets/images/chapter1/${name}`;

test("story starts from the first computer scene", () => {
  const flow = new StoryFlow(story);

  assert.equal(flow.currentNode.id, "computer_intro");
  assert.equal(flow.currentNode.kind, "scene");
});

test("scene nodes advance to the next node when tapped", () => {
  const flow = new StoryFlow(story);

  const next = flow.advance();

  assert.equal(next.id, "opening_choice");
  assert.equal(next.kind, "choice");
});

test("choice nodes follow the selected branch", () => {
  const flow = new StoryFlow(story);

  flow.advance();
  const next = flow.choose("black_screen");

  assert.equal(next.id, "node2_2");
  assert.deepEqual(flow.history, ["computer_intro", "opening_choice:black_screen"]);
});

test("first choice maps directly to the uploaded node2 image assets", () => {
  const branches = [
    ["physical_retreat", "node2_1", chapter1Asset("node2_1.png")],
    ["black_screen", "node2_2", chapter1Asset("node2_2.png")],
    ["stay_on", "node2_3", chapter1Asset("node2_3.png")]
  ];

  for (const [choiceId, nodeId, image] of branches) {
    const flow = new StoryFlow(story);
    flow.advance();
    const next = flow.choose(choiceId);

    assert.equal(next.id, nodeId);
    assert.equal(next.image, image);
  }
});

test("node2_1 waits for a tap before playing end1", () => {
  const flow = new StoryFlow(story);

  flow.advance();
  flow.choose("physical_retreat");
  const ending = flow.advance();

  assert.equal(ending.id, "end1");
  assert.equal(ending.image, chapter1Asset("end1.jpg"));
});

test("node2_3 waits for a tap before playing end5", () => {
  const flow = new StoryFlow(story);

  flow.advance();
  flow.choose("stay_on");
  const ending = flow.advance();

  assert.equal(ending.id, "end5");
  assert.equal(ending.image, chapter1Asset("end5.png"));
});

test("cyber sheep choice plays the uploaded counting sheep image asset", () => {
  const flow = new StoryFlow(story);

  flow.goTo("sleep_choice");
  const next = flow.choose("cyber_sheep");

  assert.equal(next.id, "counting_sheep");
  assert.equal(next.image, chapter1Asset("counting_sheep.png"));
});

test("all story nodes point to their agreed image asset names", () => {
  const expectedAssets = new Map([
    ["computer_intro", chapter1Asset("node1_1.png")],
    ["opening_choice", chapter1Asset("node1_1.png")],
    ["node2_1", chapter1Asset("node2_1.png")],
    ["end1", chapter1Asset("end1.jpg")],
    ["node2_2", chapter1Asset("node2_2.png")],
    ["sleep_choice", chapter1Asset("node2_2.png")],
    ["counting_sheep", chapter1Asset("counting_sheep.png")],
    ["count_choice", chapter1Asset("counting_sheep.png")],
    ["end2", chapter1Asset("end2.png")],
    ["end3", chapter1Asset("end3.jpg")],
    ["node2_3", chapter1Asset("node2_3.png")],
    ["end5", chapter1Asset("end5.png")]
  ]);

  for (const node of story.nodes) {
    assert.equal(node.image, expectedAssets.get(node.id), node.id);
  }
});

test("remaining sheep branches end at fixed ending assets", () => {
  const wrongFlow = new StoryFlow(story);
  wrongFlow.goTo("count_choice");
  const wrongEnding = wrongFlow.choose("wrong_count");

  assert.equal(wrongEnding.id, "end2");
  assert.equal(wrongEnding.image, chapter1Asset("end2.png"));

  const rightFlow = new StoryFlow(story);
  rightFlow.goTo("count_choice");
  const rightEnding = rightFlow.choose("right_count");

  assert.equal(rightEnding.id, "end3");
  assert.equal(rightEnding.image, chapter1Asset("end3.jpg"));

  const voiceFlow = new StoryFlow(story);
  voiceFlow.goTo("sleep_choice");
  const voiceEnding = voiceFlow.choose("voice_threat");

  assert.equal(voiceEnding.id, "end3");
  assert.equal(voiceEnding.image, chapter1Asset("end3.jpg"));
});

test("ending nodes do not advance beyond themselves", () => {
  const flow = new StoryFlow(story);

  flow.goTo("end5");
  const current = flow.advance();

  assert.equal(current.id, "end5");
  assert.equal(current.kind, "ending");
});
