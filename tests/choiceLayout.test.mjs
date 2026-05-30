import test from "node:test";
import assert from "node:assert/strict";

import { getChoiceRects, hitChoiceRect } from "../js/engine/ChoiceLayout.js";

test("choice layout creates one tappable rect for each choice", () => {
  const choices = [
    { id: "a", label: "选项 A" },
    { id: "b", label: "选项 B" }
  ];
  const rects = getChoiceRects(390, 844, choices);

  assert.equal(rects.length, 2);
  assert.equal(rects[0].choice.id, "a");
  assert.equal(rects[1].choice.id, "b");
});

test("choice hit detection returns the selected choice", () => {
  const rects = getChoiceRects(390, 844, [
    { id: "wait", label: "等" },
    { id: "leave", label: "不等" }
  ]);

  const hit = hitChoiceRect({ x: 120, y: rects[1].y + 20 }, rects);

  assert.equal(hit.choice.id, "leave");
});

test("choice layout gives long choices more vertical space", () => {
  const rects = getChoiceRects(390, 844, [
    { id: "short", label: "数对" },
    { id: "long", label: "语音输出：听话，闭眼，不然我明天就把你的浏览器历史记录群发给通讯录" }
  ]);

  assert.ok(rects[1].height > rects[0].height);
  assert.ok(rects[1].y + rects[1].height <= 820);
});
