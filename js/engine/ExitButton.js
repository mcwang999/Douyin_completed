export function getExitButtonRect(width, height) {
  const buttonWidth = 60;
  const buttonHeight = 32;
  const marginX = 12;
  const marginY = 12;

  return {
    x: width - buttonWidth - marginX,
    y: marginY,
    width: buttonWidth,
    height: buttonHeight
  };
}

export function hitExitButton(point, rect) {
  if (!rect) return false;
  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height;
}
