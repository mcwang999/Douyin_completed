import { getContainRect, getSplashAnimationFrame } from "./SplashScreen.js";
import { getChoiceRects } from "./ChoiceLayout.js";
import { getEndingCardRect } from "./EndingCard.js";
import { getExitButtonRect } from "./ExitButton.js";
import { getShareCardButtonRects, getShareCardImageRect } from "./ShareCard.js";

export class CanvasRenderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.ctx = canvas.getContext("2d");
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.imageCache = new Map();
    this.startImage = this.createImageState(config.startImage);
    this.choiceFrameImage = this.createImageState(config.startImage2);
    this.snapshotCanvas = null;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = this.config.canvasWidth * this.pixelRatio;
    this.canvas.height = this.config.canvasHeight * this.pixelRatio;
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  captureSnapshot() {
    if (!this.snapshotCanvas) {
      this.snapshotCanvas = document.createElement("canvas");
    }
    this.snapshotCanvas.width = this.canvas.width;
    this.snapshotCanvas.height = this.canvas.height;
    const sctx = this.snapshotCanvas.getContext("2d");
    sctx.drawImage(this.canvas, 0, 0);
  }

  renderTransition({ progress, node, elapsed, endingAction }) {
    const ctx = this.ctx;
    const width = this.config.canvasWidth;
    const height = this.config.canvasHeight;

    ctx.clearRect(0, 0, width, height);

    // Draw old snapshot fading out
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.drawImage(
      this.snapshotCanvas,
      0, 0, this.snapshotCanvas.width, this.snapshotCanvas.height,
      0, 0, width, height
    );
    ctx.restore();

    // Draw new node fading in
    ctx.save();
    ctx.globalAlpha = progress;
    const choiceRects = this.renderStoryNode({ node, elapsed, endingAction });
    ctx.restore();

    return choiceRects;
  }

  renderExitButton({ elapsed }) {
    const ctx = this.ctx;
    const width = this.config.canvasWidth;
    const rect = getExitButtonRect(width, this.config.canvasHeight);
    const alpha = 0.72 + Math.sin(elapsed / 400) * 0.12;

    ctx.save();
    ctx.fillStyle = "rgba(10, 12, 18, 0.72)";
    this.roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 6);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 231, 106, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 231, 106, ${alpha})`;
    ctx.font = "900 15px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("退出", rect.x + rect.width / 2, rect.y + rect.height / 2);
    ctx.restore();

    return rect;
  }

  renderSplash({ elapsed }) {
    const ctx = this.ctx;
    const width = this.config.canvasWidth;
    const height = this.config.canvasHeight;
    const frame = getSplashAnimationFrame(elapsed);

    ctx.clearRect(0, 0, width, height);

    if (this.startImage.loaded) {
      this.drawBlurredBackdrop(ctx, this.startImage.image, width, height, 0.44);
      this.drawAnimatedContainImage(ctx, this.startImage.image, width, height, frame);
    } else {
      this.drawLoading(ctx, "启动图加载中", width, height);
    }

    this.drawTvTextureOverlay(ctx, width, height, frame, 1);
    this.drawTapPanel(ctx, "点击屏幕开始游戏", width, height, elapsed);
  }

  renderStoryNode({ node, elapsed, endingAction = null }) {
    const ctx = this.ctx;
    const width = this.config.canvasWidth;
    const height = this.config.canvasHeight;
    const imageState = this.getImage(node);

    ctx.clearRect(0, 0, width, height);

    if (node.kind === "choice") {
      this.drawChoiceScene(ctx, imageState, node, width, height, elapsed);
      return getChoiceRects(width, height, node.choices);
    }

    if (node.kind === "ending" && endingAction) {
      this.drawEndingChoiceScene(ctx, imageState, node, width, height, elapsed, endingAction);
      return [getEndingCardRect(width, height, endingAction)];
    }

    this.drawNarrativeScene(ctx, imageState, node, width, height, elapsed);
    return [];
  }

  renderChapterMenu({ items, elapsed }) {
    const ctx = this.ctx;
    const width = this.config.canvasWidth;
    const height = this.config.canvasHeight;

    ctx.clearRect(0, 0, width, height);

    if (this.startImage.loaded) {
      this.drawBlurredBackdrop(ctx, this.startImage.image, width, height, 0.58);
    } else {
      ctx.fillStyle = "#121820";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.save();
    ctx.fillStyle = "#fff0a8";
    ctx.font = "900 30px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("选择章节", width / 2, 78);

    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.font = "800 14px Microsoft YaHei, sans-serif";
    ctx.fillText("通关指定结局后解锁下一章", width / 2, 106);
    ctx.restore();

    items.forEach((item, index) => this.drawChapterMenuItem(ctx, item, index, elapsed));
    this.drawTvTextureOverlay(ctx, width, height, getSplashAnimationFrame(elapsed), 0.5);
  }

  renderIntro({ intro, elapsed }) {
    const ctx = this.ctx;
    const width = this.config.canvasWidth;
    const height = this.config.canvasHeight;
    const video = intro?.video;

    ctx.clearRect(0, 0, width, height);

    if (video && (video.readyState >= 2 || video.videoWidth || video.width)) {
      this.drawCoverMedia(ctx, video, 0, 0, width, height);
    } else {
      this.drawLoading(ctx, "视频加载中", width, height);
    }

    this.drawTvTextureOverlay(ctx, width, height, getSplashAnimationFrame(elapsed), 0.32);
    if (intro?.continueOnTap) {
      this.drawTapPanel(ctx, "点击进入章节菜单", width, height, elapsed);
    }
  }

  renderShareCard({ shareCard, elapsed }) {
    const ctx = this.ctx;
    const width = this.config.canvasWidth;
    const height = this.config.canvasHeight;
    const imageState = this.getImage(shareCard?.image);
    const imageRect = getShareCardImageRect(width, height);
    const buttonRects = getShareCardButtonRects(width, height);

    ctx.clearRect(0, 0, width, height);
    if (this.startImage.loaded) {
      this.drawBlurredBackdrop(ctx, this.startImage.image, width, height, 0.66);
    } else {
      ctx.fillStyle = "#121820";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.save();
    ctx.fillStyle = "rgba(10, 12, 18, 0.78)";
    this.roundRect(ctx, imageRect.x - 12, imageRect.y - 12, imageRect.width + 24, imageRect.height + 24, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 231, 106, 0.86)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    if (imageState.loaded) {
      this.drawContainImageInRect(ctx, imageState.image, imageRect);
    } else {
      ctx.save();
      ctx.fillStyle = "rgba(255, 247, 198, 0.12)";
      this.roundRect(ctx, imageRect.x, imageRect.y, imageRect.width, imageRect.height, 6);
      ctx.fill();
      ctx.fillStyle = "#fff0a8";
      ctx.font = "900 20px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("分享卡片加载中", width / 2, imageRect.y + imageRect.height / 2);
      ctx.restore();
    }

    this.drawShareCardButtons(ctx, buttonRects, elapsed);
    this.drawTvTextureOverlay(ctx, width, height, getSplashAnimationFrame(elapsed), 0.28);
    return buttonRects;
  }

  drawChapterMenuItem(ctx, item, index, elapsed) {
    const shakeX = item.locked || item.comingSoon ? 0 : Math.sin(elapsed / 520 + index) * 0.8;
    ctx.save();
    ctx.translate(shakeX, 0);

    if (this.choiceFrameImage.loaded) {
      this.drawCoverImage(ctx, this.choiceFrameImage.image, item.x, item.y, item.width, item.height);
    } else {
      ctx.fillStyle = "rgba(255, 247, 198, 0.92)";
      this.roundRect(ctx, item.x, item.y, item.width, item.height, 8);
      ctx.fill();
    }

    ctx.fillStyle = item.locked || item.comingSoon ? "rgba(20, 20, 20, 0.42)" : "rgba(255, 247, 198, 0.76)";
    this.roundRect(ctx, item.x + 12, item.y + 12, item.width - 24, item.height - 24, 6);
    ctx.fill();

    ctx.fillStyle = item.locked || item.comingSoon ? "#595959" : "#111111";
    ctx.font = "900 22px Microsoft YaHei, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(item.title, item.x + 26, item.y + 38);

    ctx.font = "800 13px Microsoft YaHei, sans-serif";
    this.wrapText(ctx, item.subtitle, item.x + 26, item.y + 62, item.width - 92, 18, 1);

    ctx.textAlign = "right";
    ctx.font = "900 18px Microsoft YaHei, sans-serif";
    const stateText = item.comingSoon ? "敬请期待" : item.locked ? "未解锁" : "进入";
    ctx.fillText(stateText, item.x + item.width - 24, item.y + 49);
    ctx.restore();
  }

  drawNarrativeScene(ctx, imageState, node, width, height, elapsed) {
    if (!imageState.loaded) {
      this.drawLoading(ctx, "剧情图片加载中", width, height);
    } else {
      this.drawContainImage(ctx, imageState.image, width, height);
      this.drawCaption(ctx, node.text, node.kind === "ending" ? "已到达结局" : "点击继续", width, height, elapsed);
    }
  }

  drawChoiceScene(ctx, imageState, node, width, height, elapsed) {
    if (!imageState.loaded) {
      this.drawLoading(ctx, "选择画面加载中", width, height);
      return;
    }

    ctx.save();
    ctx.filter = "blur(9px)";
    this.drawCoverImage(ctx, imageState.image, -20, -20, width + 40, height + 40);
    ctx.restore();

    ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
    ctx.fillRect(0, 0, width, height);

    this.drawChoicePrompt(ctx, node.prompt, width);
    this.drawChoiceButtons(ctx, node.choices, width, height, elapsed);
  }

  drawEndingChoiceScene(ctx, imageState, node, width, height, elapsed, endingAction) {
    if (!imageState.loaded) {
      this.drawLoading(ctx, "剧情图片加载中", width, height);
      this.drawChoiceButtons(ctx, [{ id: "ending_action", label: endingAction.label }], width, height, elapsed);
      return;
    }

    ctx.save();
    ctx.filter = "blur(9px)";
    this.drawCoverImage(ctx, imageState.image, -20, -20, width + 40, height + 40);
    ctx.restore();

    ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
    ctx.fillRect(0, 0, width, height);

    this.drawChoicePrompt(ctx, node.text, width);
    this.drawChoiceButtons(ctx, [{ id: "ending_action", label: endingAction.label }], width, height, elapsed);
  }

  drawChoicePrompt(ctx, prompt, width) {
    ctx.save();
    ctx.fillStyle = "rgba(14, 16, 22, 0.84)";
    this.roundRect(ctx, 24, 28, width - 48, 88, 8);
    ctx.fill();
    ctx.strokeStyle = "#ffe76a";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffe76a";
    ctx.font = "900 17px Microsoft YaHei, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    this.wrapText(ctx, prompt, 42, 64, width - 84, 24, 2);
    ctx.restore();
  }

  drawChoiceButtons(ctx, choices, width, height, elapsed) {
    const rects = getChoiceRects(width, height, choices);

    rects.forEach((rect, index) => {
      const shakeX = Math.sin(elapsed / 280 + index) * 1.4;
      ctx.save();
      ctx.translate(shakeX, 0);

      if (this.choiceFrameImage.loaded) {
        this.drawCoverImage(ctx, this.choiceFrameImage.image, rect.x, rect.y, rect.width, rect.height);
      } else {
        ctx.fillStyle = "rgba(255, 238, 112, 0.94)";
        this.roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 7);
        ctx.fill();
        ctx.strokeStyle = "#121212";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255, 247, 198, 0.8)";
      this.roundRect(ctx, rect.x + 12, rect.y + 12, rect.width - 24, rect.height - 24, 6);
      ctx.fill();

      ctx.fillStyle = "#111111";
      ctx.font = choices.length > 2 ? "900 16px Microsoft YaHei, sans-serif" : "900 18px Microsoft YaHei, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      this.wrapText(ctx, rect.choice.label, rect.x + 26, rect.y + 35, rect.width - 86, 22, rect.height > 100 ? 4 : 3);

      ctx.textAlign = "right";
      ctx.font = "900 22px Microsoft YaHei, sans-serif";
      ctx.fillText("▶", rect.x + rect.width - 18, rect.y + rect.height / 2 + 8);
      ctx.restore();
    });
  }

  drawShareCardButtons(ctx, rects, elapsed) {
    rects.forEach((rect, index) => {
      const alpha = 0.76 + Math.sin(elapsed / 360 + index) * 0.12;
      ctx.save();
      ctx.fillStyle = rect.id === "share" ? "rgba(255, 231, 106, 0.94)" : "rgba(255, 247, 198, 0.9)";
      this.roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 7);
      ctx.fill();
      ctx.strokeStyle = `rgba(18, 18, 18, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#111111";
      ctx.font = "900 18px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(rect.label, rect.x + rect.width / 2, rect.y + rect.height / 2);
      ctx.restore();
    });
  }

  drawCaption(ctx, text, hint, width, height, elapsed) {
    ctx.save();
    ctx.fillStyle = "rgba(10, 12, 18, 0.84)";
    this.roundRect(ctx, 24, height - 140, width - 48, 88, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 18px Microsoft YaHei, sans-serif";
    ctx.textAlign = "left";
    this.wrapText(ctx, text, 44, height - 104, width - 88, 26, 2);

    ctx.fillStyle = `rgba(255, 211, 80, ${0.72 + Math.sin(elapsed / 360) * 0.2})`;
    ctx.font = "900 14px Microsoft YaHei, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(hint, width - 44, height - 64);
    ctx.restore();
  }

  drawTapPanel(ctx, text, width, height, elapsed) {
    const frameWidth = width - 64;
    const frameHeight = 56;
    const frameX = 32;
    const frameY = height * 0.72;
    const shakeX = Math.sin(elapsed / 600) * 2;
    const shakeY = Math.cos(elapsed / 500) * 1.5;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    if (this.choiceFrameImage.loaded) {
      this.drawCoverImage(ctx, this.choiceFrameImage.image, frameX, frameY, frameWidth, frameHeight);
    } else {
      ctx.fillStyle = "rgba(12, 14, 20, 0.88)";
      this.roundRect(ctx, frameX, frameY, frameWidth, frameHeight, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 20px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width / 2, frameY + frameHeight / 2);
    ctx.restore();
  }

  drawAnimatedContainImage(ctx, image, width, height, frame) {
    const rect = getContainRect({
      sourceWidth: image.width,
      sourceHeight: image.height,
      targetWidth: width,
      targetHeight: height
    });

    ctx.save();
    ctx.translate(rect.x + rect.width / 2 + frame.offsetX, rect.y + rect.height / 2 + frame.offsetY);
    ctx.scale(frame.scale, frame.scale);
    ctx.drawImage(image, -rect.width / 2, -rect.height / 2, rect.width, rect.height);
    ctx.restore();
  }

  drawContainImage(ctx, image, width, height) {
    const rect = getContainRect({
      sourceWidth: image.width,
      sourceHeight: image.height,
      targetWidth: width,
      targetHeight: height
    });
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  }

  drawContainImageInRect(ctx, image, targetRect) {
    const rect = getContainRect({
      sourceWidth: image.width,
      sourceHeight: image.height,
      targetWidth: targetRect.width,
      targetHeight: targetRect.height
    });
    ctx.drawImage(image, targetRect.x + rect.x, targetRect.y + rect.y, rect.width, rect.height);
  }

  drawBlurredBackdrop(ctx, image, width, height, overlayAlpha) {
    ctx.save();
    ctx.filter = "blur(12px)";
    this.drawCoverImage(ctx, image, -20, -20, width + 40, height + 40);
    ctx.restore();
    ctx.fillStyle = `rgba(6, 8, 12, ${overlayAlpha})`;
    ctx.fillRect(0, 0, width, height);
  }

  drawCoverImage(ctx, image, x, y, width, height) {
    const imageRatio = image.width / image.height;
    const targetRatio = width / height;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.width;
    let sourceHeight = image.height;

    if (imageRatio > targetRatio) {
      sourceWidth = image.height * targetRatio;
      sourceX = (image.width - sourceWidth) / 2;
    } else {
      sourceHeight = image.width / targetRatio;
      sourceY = (image.height - sourceHeight) / 2;
    }

    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  drawCoverMedia(ctx, media, x, y, width, height) {
    const mediaWidth = media.videoWidth || media.width || width;
    const mediaHeight = media.videoHeight || media.height || height;
    const mediaRatio = mediaWidth / mediaHeight;
    const targetRatio = width / height;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = mediaWidth;
    let sourceHeight = mediaHeight;

    if (mediaRatio > targetRatio) {
      sourceWidth = mediaHeight * targetRatio;
      sourceX = (mediaWidth - sourceWidth) / 2;
    } else {
      sourceHeight = mediaWidth / targetRatio;
      sourceY = (mediaHeight - sourceHeight) / 2;
    }

    ctx.drawImage(media, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  drawTvTextureOverlay(ctx, width, height, frame, intensity = 1) {
    ctx.save();
    const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.18, width / 2, height / 2, height * 0.72);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, `rgba(0, 0, 0, ${frame.vignetteAlpha * intensity})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = `rgba(255, 255, 255, ${frame.scanlineAlpha * intensity})`;
    for (let y = frame.grainOffset; y < height; y += 6) {
      ctx.fillRect(0, y, width, 1);
    }

    ctx.fillStyle = `rgba(0, 0, 0, ${0.08 * intensity})`;
    for (let i = 0; i < 70; i += 1) {
      const x = (i * 41 + frame.grainOffset * 17) % width;
      const y = (i * 67 + frame.grainOffset * 29) % height;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  }

  drawLoading(ctx, text, width, height) {
    ctx.fillStyle = "#121820";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#f5e6c8";
    ctx.font = "900 24px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, width / 2, height / 2);
  }

  createImageState(sources) {
    const sourceList = Array.isArray(sources) ? sources.filter(Boolean) : [sources].filter(Boolean);
    const imageState = { image: null, loaded: false, failed: false };
    if (typeof Image !== "undefined" && sourceList.length > 0) {
      this.loadImageCandidate(imageState, sourceList, 0);
    }
    return imageState;
  }

  loadImageCandidate(imageState, sourceList, index) {
    const src = sourceList[index];
    if (!src) {
      imageState.failed = true;
      return;
    }

    const image = new Image();
    image.onload = () => {
      imageState.loaded = true;
      imageState.image = image;
    };
    image.onerror = () => {
      this.loadImageCandidate(imageState, sourceList, index + 1);
    };
    image.src = src;
    imageState.image = image;
  }

  getImage(nodeOrSrc) {
    const sources = typeof nodeOrSrc === "string"
      ? [nodeOrSrc]
      : [nodeOrSrc?.image, nodeOrSrc?.fallbackImage];

    if (!sources[0]) {
      return { image: null, loaded: false };
    }

    const cacheKey = sources.filter(Boolean).join("|");
    if (!this.imageCache.has(cacheKey)) {
      this.imageCache.set(cacheKey, this.createImageState(sources));
    }
    return this.imageCache.get(cacheKey);
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
    const characters = [...text];
    let line = "";
    let lineCount = 0;

    for (const char of characters) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, y + lineCount * lineHeight);
        line = char;
        lineCount += 1;
        if (lineCount >= maxLines) {
          return;
        }
      } else {
        line = testLine;
      }
    }

    if (line && lineCount < maxLines) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
    }
  }

  roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }
}
