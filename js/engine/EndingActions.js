const ENDING_SLOGANS = {
  chapter1: {
    success: "今天不做人，用户意志已沦陷，网络世界尽在掌握",
    failure: "你今天做人了，请重新开机"
  },
  chapter2: {
    success: "今天不做人，拉响命运交响曲，血包炫完意满离",
    failure: "你今天做人了，请重新起飞"
  },
  chapter3: {
    success: "今天不做人，成功超度打工人，世俗欲望全面封印",
    failure: "你今天做人了，请重新倒流时空"
  }
};

function getSlogan(chapterId, result) {
  return ENDING_SLOGANS[chapterId]?.[result] ?? "点击重新开始";
}

export function getEndingAction(chapterId, endingId) {
  if (chapterId === "chapter1" && endingId === "end2") {
    return {
      type: "next_chapter",
      chapterId: "chapter2",
      result: "success",
      label: getSlogan(chapterId, "success")
    };
  }

  if (chapterId === "chapter2" && endingId === "end2") {
    return {
      type: "next_chapter",
      chapterId: "chapter3",
      result: "success",
      label: getSlogan(chapterId, "success")
    };
  }

  if (chapterId === "chapter3" && endingId === "end4") {
    return {
      type: "outro",
      video: "assets/videos/out.mp4",
      result: "success",
      label: getSlogan(chapterId, "success")
    };
  }

  return {
    type: "restart",
    result: "failure",
    label: getSlogan(chapterId, "failure")
  };
}

export function isEndingCardReady({ startedAt, elapsed, durationMs }) {
  return Number.isFinite(startedAt) && elapsed - startedAt >= durationMs;
}
