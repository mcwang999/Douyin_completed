export function isSplashStartTap(point, width, height) {
  return point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height;
}

export function getSplashAnimationFrame(elapsed) {
  return {
    scale: 1.006 + Math.sin(elapsed / 1800) * 0.004,
    offsetX: Math.sin(elapsed / 2400) * 4,
    offsetY: Math.cos(elapsed / 2100) * 5,
    vignetteAlpha: 0.24 + Math.sin(elapsed / 1600) * 0.04,
    scanlineAlpha: 0.13 + Math.sin(elapsed / 260) * 0.05,
    grainOffset: Math.floor(elapsed / 80) % 9
  };
}

export function getContainRect({ sourceWidth, sourceHeight, targetWidth, targetHeight }) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    const width = targetWidth;
    const height = targetWidth / sourceRatio;
    return {
      x: 0,
      y: (targetHeight - height) / 2,
      width,
      height
    };
  }

  const height = targetHeight;
  const width = targetHeight * sourceRatio;
  return {
    x: (targetWidth - width) / 2,
    y: 0,
    width,
    height
  };
}
