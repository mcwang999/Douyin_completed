export function getEndingAction(chapterId, endingId) {
  if (chapterId === "chapter1" && endingId === "end2") {
    return {
      type: "next_chapter",
      chapterId: "chapter2",
      label: "点击进入下一章"
    };
  }

  if (chapterId === "chapter2" && endingId === "end2") {
    return {
      type: "next_chapter",
      chapterId: "chapter3",
      label: "点击进入下一章"
    };
  }

  if (chapterId === "chapter3" && endingId === "end4") {
    return {
      type: "coming_soon",
      label: "敬请期待下一章"
    };
  }

  return {
    type: "restart",
    label: "点击重新开始"
  };
}

export function isEndingCardReady({ startedAt, elapsed, durationMs }) {
  return Number.isFinite(startedAt) && elapsed - startedAt >= durationMs;
}
