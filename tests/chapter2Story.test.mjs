import test from "node:test";
import assert from "node:assert/strict";

import { getChapterById } from "../js/data/chapters.js";
import { StoryFlow } from "../js/engine/StoryFlow.js";

const story = getChapterById("chapter2").story;
const chapter2Asset = (name) => `assets/images/chapter2/${name}`;

test("chapter two opening branches to the requested paths", () => {
  const branches = [
    ["sneak", "低速潜行并俯冲暗杀", "node2_1"],
    ["buzz", "开足马力高音频直接冲向用户", "node2_2"],
    ["dance", "炫一下自己优美的舞姿", "end5"]
  ];

  for (const [choiceId, label, nodeId] of branches) {
    const flow = new StoryFlow(story);
    flow.advance();

    const choice = flow.currentNode.choices.find((item) => item.id === choiceId);
    assert.equal(choice.label, label);

    const next = flow.choose(choiceId);
    assert.equal(next.id, nodeId);
    assert.equal(next.image, chapter2Asset(`${nodeId}.png`));
  }
});

test("chapter two sneak path ends at end1 after node2_1", () => {
  const flow = new StoryFlow(story);

  flow.goTo("node2_1");
  const ending = flow.advance();

  assert.equal(ending.id, "end1");
  assert.equal(ending.image, chapter2Asset("end1.png"));
});

test("chapter two attack choice maps to node3 or end4", () => {
  const flow = new StoryFlow(story);

  flow.goTo("node2_2_choice");
  assert.deepEqual(flow.currentNode.choices.map((choice) => [choice.label, choice.next]), [
    ["贴手开大反复蹦迪", "node3"],
    ["温柔一击，轻轻啜一口", "end4"]
  ]);
});

test("chapter two final choice maps end2 to next chapter and end3 to restart ending", () => {
  const flow = new StoryFlow(story);

  flow.goTo("node3_choice");
  assert.deepEqual(flow.currentNode.choices.map((choice) => [choice.label, choice.next]), [
    ["艺高人胆大，顺风撤离放手一搏", "end2"],
    ["死死地抱住用户的汗毛", "end3"]
  ]);
});

test("chapter two dance path directly reaches end5", () => {
  const flow = new StoryFlow(story);

  flow.goTo("node1_choice");
  const ending = flow.choose("dance");

  assert.equal(ending.id, "end5");
  assert.equal(ending.image, chapter2Asset("end5.png"));
});

test("chapter two only uses the requested node and ending assets", () => {
  const expected = new Map([
    ["node1", "node1.png"],
    ["node1_choice", "node1.png"],
    ["node2_1", "node2_1.png"],
    ["node2_2", "node2_2.png"],
    ["node2_2_choice", "node2_2.png"],
    ["node3", "node3.png"],
    ["node3_choice", "node3.png"],
    ["end1", "end1.png"],
    ["end2", "end2.png"],
    ["end3", "end3.png"],
    ["end4", "end4.png"],
    ["end5", "end5.png"]
  ]);

  assert.deepEqual(story.nodes.map((node) => node.id), [...expected.keys()]);

  for (const node of story.nodes) {
    assert.equal(node.image, chapter2Asset(expected.get(node.id)), node.id);
  }
});
