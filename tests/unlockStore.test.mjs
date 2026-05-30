import test from "node:test";
import assert from "node:assert/strict";

import { UnlockStore } from "../js/engine/UnlockStore.js";

test("unlock store keeps completed endings only for the current runtime instance", () => {
  const store = new UnlockStore();
  store.markCompleted("chapter1", "end2");

  assert.deepEqual(store.getCompletedEndingKeys(), ["chapter1:end2"]);
  assert.deepEqual(new UnlockStore().getCompletedEndingKeys(), []);
});
