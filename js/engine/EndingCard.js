import { getChoiceRects } from "./ChoiceLayout.js";

export function getEndingCardRect(width, height, action) {
  const rect = getChoiceRects(width, height, [
    {
      id: "ending_action",
      label: action.label
    }
  ])[0];

  return {
    ...rect,
    action
  };
}

export function hitEndingCardRect(point, rect) {
  if (!rect) {
    return null;
  }

  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height
    ? rect
    : null;
}
