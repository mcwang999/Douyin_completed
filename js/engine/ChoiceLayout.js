export function getChoiceRects(width, height, choices) {
  const gap = 12;
  const buttonHeights = choices.map((choice) => getChoiceHeight(choice.label, choices.length));
  const totalHeight = buttonHeights.reduce((sum, item) => sum + item, 0) + (choices.length - 1) * gap;
  const startY = Math.max(220, height - totalHeight - 42);
  let y = startY;

  return choices.map((choice, index) => {
    const rect = {
      x: 24,
      y,
      width: width - 48,
      height: buttonHeights[index],
      choice
    };
    y += buttonHeights[index] + gap;
    return rect;
  });
}

export function hitChoiceRect(point, rects) {
  return rects.find((rect) => {
    return point.x >= rect.x
      && point.x <= rect.x + rect.width
      && point.y >= rect.y
      && point.y <= rect.y + rect.height;
  }) || null;
}

function getChoiceHeight(label, choiceCount) {
  const baseHeight = choiceCount > 2 ? 66 : 76;
  if ([...label].length > 28) {
    return baseHeight + 46;
  }
  if ([...label].length > 16) {
    return baseHeight + 24;
  }
  return baseHeight;
}
