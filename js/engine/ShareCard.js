export function getShareCardButtonRects(width, height) {
  const buttonWidth = 136;
  const buttonHeight = 54;
  const gap = 22;
  const y = height - 92;
  const startX = (width - buttonWidth * 2 - gap) / 2;

  return [
    {
      id: "share",
      label: "一键分享",
      x: startX,
      y,
      width: buttonWidth,
      height: buttonHeight
    },
    {
      id: "continue",
      label: "继续下一章",
      x: startX + buttonWidth + gap,
      y,
      width: buttonWidth,
      height: buttonHeight
    }
  ];
}

export function getShareCardImageRect(width, height) {
  return {
    x: 34,
    y: 58,
    width: width - 68,
    height: height - 180
  };
}

export function hitShareCardButton(point, rects) {
  return rects.find((rect) => {
    return point.x >= rect.x
      && point.x <= rect.x + rect.width
      && point.y >= rect.y
      && point.y <= rect.y + rect.height;
  }) ?? null;
}
