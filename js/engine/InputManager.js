export class InputManager {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.pressHandler = () => {};
  }

  onPress(handler) {
    this.pressHandler = handler;
    this.canvas.addEventListener("pointerdown", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pressHandler(mapPointerToCanvas({
        clientX: event.clientX,
        clientY: event.clientY,
        rect,
        logicalWidth: this.config.canvasWidth,
        logicalHeight: this.config.canvasHeight
      }));
    });
  }
}

export function mapPointerToCanvas({ clientX, clientY, rect, logicalWidth, logicalHeight }) {
  return {
    x: Math.round((clientX - rect.left) * (logicalWidth / rect.width)),
    y: Math.round((clientY - rect.top) * (logicalHeight / rect.height))
  };
}
