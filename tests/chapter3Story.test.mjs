import test from "node:test";
import assert from "node:assert/strict";

import { getChapterById } from "../js/data/chapters.js";
import { StoryFlow } from "../js/engine/StoryFlow.js";

const story = getChapterById("chapter3").story;
const chapter3Asset = (name) => `assets/images/chapter3/${name}`;

test("chapter three starts at the alarm clock scene and opens the three media choices after a tap", () => {
  const flow = new StoryFlow(story);

  assert.equal(flow.currentNode.id, "node1");
  assert.equal(flow.currentNode.kind, "scene");
  assert.equal(flow.currentNode.image, chapter3Asset("node1.png"));

  const choiceNode = flow.advance();
  assert.equal(choiceNode.id, "node1_choice");
  assert.deepEqual(choiceNode.choices.map((choice) => [choice.label, choice.next]), [
    ["疯狂相对论(3:00)", "end1"],
    ["时空速流(7:59)", "node2"],
    ["赛博冥想(13:00)", "end5"]
  ]);
});

test("chapter three direct media choices reach their ending assets or node2", () => {
  const branches = [
    ["mad_relativity", "end1", "end1.png"],
    ["time_stream", "node2", "node2.png"],
    ["cyber_meditation", "end5", "end5.png"]
  ];

  for (const [choiceId, nodeId, imageName] of branches) {
    const flow = new StoryFlow(story);
    flow.advance();

    const next = flow.choose(choiceId);
    assert.equal(next.id, nodeId);
    assert.equal(next.image, chapter3Asset(imageName));
  }
});

test("chapter three node2 branches to justice fantasy or mockery paths", () => {
  const flow = new StoryFlow(story);

  flow.goTo("node2");
  const choiceNode = flow.advance();

  assert.equal(choiceNode.id, "node2_choice");
  assert.deepEqual(choiceNode.choices.map((choice) => [choice.label, choice.next]), [
    ["正义使者狂想", "node3_1"],
    ["嘲笑他", "node3_2"]
  ]);
});

test("chapter three mockery path reaches end4 after node3_2", () => {
  const flow = new StoryFlow(story);

  flow.goTo("node3_2");
  const ending = flow.advance();

  assert.equal(ending.id, "end4");
  assert.equal(ending.image, chapter3Asset("end4.png"));
});

test("chapter three justice path maps the final choices to end2 and end3", () => {
  const flow = new StoryFlow(story);

  flow.goTo("node3_1");
  const choiceNode = flow.advance();

  assert.equal(choiceNode.id, "node3_1_choice");
  assert.deepEqual(choiceNode.choices.map((choice) => [choice.label, choice.next]), [
    ["反复横跳躲开", "end2"],
    ["音量提高到200%", "end3"]
  ]);
});

test("chapter three uses the requested node and ending assets", () => {
  const expected = new Map([
    ["node1", "node1.png"],
    ["node1_choice", "node1.png"],
    ["node2", "node2.png"],
    ["node2_choice", "node2.png"],
    ["node3_1", "node3_1.png"],
    ["node3_1_choice", "node3_1.png"],
    ["node3_2", "node3_2.png"],
    ["end1", "end1.png"],
    ["end2", "end2.png"],
    ["end3", "end3.png"],
    ["end4", "end4.png"],
    ["end5", "end5.png"]
  ]);

  assert.deepEqual(story.nodes.map((node) => node.id), [...expected.keys()]);

  for (const node of story.nodes) {
    assert.equal(node.image, chapter3Asset(expected.get(node.id)), node.id);
  }
});
