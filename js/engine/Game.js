import { StoryFlow } from "./StoryFlow.js";
import { CanvasRenderer } from "./CanvasRenderer.js";
import { InputManager } from "./InputManager.js";
import { hitChoiceRect } from "./ChoiceLayout.js";
import { isSplashStartTap } from "./SplashScreen.js";
import { getChapterById, getUnlockedChapterIds } from "../data/chapters.js";
import { getChapterMenuItems, hitChapterMenuItem } from "./ChapterMenu.js";
import { UnlockStore } from "./UnlockStore.js";
import { getEndingAction, isEndingCardReady } from "./EndingActions.js";
import { getEndingCardRect, hitEndingCardRect } from "./EndingCard.js";
import { AudioManager } from "./AudioManager.js";
import { hitExitButton } from "./ExitButton.js";
import { hitShareCardButton } from "./ShareCard.js";

export class Game {
  constructor({ canvas, chapters, config }) {
    this.config = config;
    this.chapters = chapters;
    this.activeChapter = null;
    this.flow = null;
    this.renderer = new CanvasRenderer(canvas, config);
    this.input = new InputManager(canvas, config);
    this.unlockStore = new UnlockStore();
    this.audio = new AudioManager(config.audio);
    this.phase = "splash";
    this.choiceRects = [];
    this.chapterMenuItems = [];
    this.endingStartedAt = null;
    this.endingNodeKey = null;
    this.endingAction = null;
    this.activeIntro = null;
    this.shareCard = null;
    this.shareButtonRects = [];
    this.playedEndingVideoKeys = new Set();
    this.transitionStartedAt = null;
    this.exitButtonRect = null;
  }

  start() {
    this.input.onPress((point) => this.handlePress(point));
    this.tick();
  }

  handlePress(point) {
    const elapsed = performance.now();
    this.audio.unlock();

    if (this.phase !== "splash" && hitExitButton(point, this.exitButtonRect)) {
      this._exitToMenu();
      return;
    }

    if (this.isTransitioning(elapsed)) {
      return;
    }

    if (this.phase === "intro") {
      this.handleIntroPress();
      return;
    }

    if (this.phase === "share") {
      this.handleShareCardPress(point);
      return;
    }

    if (this.phase === "splash") {
      if (isSplashStartTap(point, this.config.canvasWidth, this.config.canvasHeight)) {
        this.audio.playSfx(this.config.audio?.sfx?.uiTap);
        this._startIntro(this.config.introVideo, {
          onComplete: () => this._enterMenuPhase()
        });
      }
      return;
    }

    if (this.phase === "menu") {
      this.handleMenuPress(point);
      return;
    }

    const node = this.flow.currentNode;

    if (node.kind === "ending") {
      const endingCardRect = this.endingAction
        ? getEndingCardRect(this.config.canvasWidth, this.config.canvasHeight, this.endingAction)
        : null;
      if (this.isEndingCardVisible() && hitEndingCardRect(point, endingCardRect)) {
        this.audio.playSfx(this.config.audio?.sfx?.uiTap);
        this.handleEndingCardPress();
      }
      return;
    }

    if (node.kind === "choice") {
      const hit = hitChoiceRect(point, this.choiceRects);
      if (hit) {
        this.audio.playSfx(this.config.audio?.sfx?.choicePick);
        this.startTransition(elapsed);
        this.flow.choose(hit.choice.id);
        this._playCurrentNodeBgm();
        this.syncEndingState();
      }
      return;
    }

    this.audio.playSfx(this.config.audio?.sfx?.pageFlip);
    this.startTransition(elapsed);
    this.flow.advance();
    this._playCurrentNodeBgm();
    this.syncEndingState();
  }

  _enterMenuPhase() {
    this.shareCard = null;
    this.shareButtonRects = [];
    this.phase = "menu";
    this.audio.playBgm(this.config.audio?.menuBgm);
  }

  _exitToMenu() {
    this._cancelIntro();
    this.shareCard = null;
    this.shareButtonRects = [];
    this.finishTransition();
    this.resetEndingState();
    this._enterMenuPhase();
  }

  handleMenuPress(point) {
    const hit = hitChapterMenuItem(point, this.chapterMenuItems);
    if (!hit || hit.comingSoon || hit.locked) {
      return;
    }

    const chapter = getChapterById(hit.chapterId);
    if (!chapter || !chapter.story) {
      return;
    }

    this.startChapterIntro(chapter);
  }

  startChapterIntro(chapter) {
    if (chapter.introAudio) {
      this.audio.playBgm(chapter.introAudio, {
        fadeMs: this.config.audio?.introAudioFadeMs,
        volume: this.config.audio?.introVolume
      });
    }

    if (chapter.introVideo) {
      this._startIntro(chapter.introVideo, {
        continueOnTap: false,
        onComplete: () => this.startChapter(chapter, { transition: false })
      });
      return;
    }

    this.startChapter(chapter);
  }

  startChapter(chapter, { transition = true } = {}) {
    if (transition) {
      this.startTransition(performance.now());
    } else {
      this.finishTransition();
    }
    this.activeChapter = chapter;
    this.flow = new StoryFlow(chapter.story);
    this.phase = "story";
    this.activeIntro = null;
    this.shareCard = null;
    this.shareButtonRects = [];
    this.playedEndingVideoKeys.clear();
    this.resetEndingState();
    if (chapter.bgm) {
      this.audio.playBgm(chapter.bgm, {
        fadeMs: this.config.audio?.chapterBgmFadeMs
      });
    }
    this.syncEndingState();
  }

  _playCurrentNodeBgm() {
    const node = this.flow?.currentNode;
    if (!node?.bgm) {
      return;
    }

    this.audio.playBgm(node.bgm, {
      fadeMs: this.config.audio?.chapterBgmFadeMs
    });
  }

  _playEndingResultSfx(endingAction) {
    const resultSfx = endingAction?.result === "success"
      ? this.config.audio?.sfx?.success
      : this.config.audio?.sfx?.fail;
    this.audio.playSfx(resultSfx);
  }

  syncEndingState(elapsed = performance.now()) {
    const node = this.flow?.currentNode;
    if (node?.kind !== "ending" || !this.activeChapter) {
      this.resetEndingState();
      return;
    }

    const endingNodeKey = `${this.activeChapter.id}:${node.id}`;
    if (node.endingVideo && !this.playedEndingVideoKeys.has(endingNodeKey)) {
      this.playedEndingVideoKeys.add(endingNodeKey);
      this._startIntro(node.endingVideo, {
        continueOnTap: false,
        onComplete: () => {
          this.phase = "story";
          this.syncEndingState(performance.now());
        }
      });
      return;
    }

    if (this.endingNodeKey !== endingNodeKey) {
      this.endingStartedAt = elapsed;
      this.endingNodeKey = endingNodeKey;
      this.endingAction = getEndingAction(this.activeChapter.id, node.id);
    }

    const wasNew = !this.unlockStore.getCompletedEndingKeys().includes(endingNodeKey);
    this.unlockStore.markCompleted(this.activeChapter.id, node.id);

    if (wasNew && this.endingAction?.type === "next_chapter") {
      this.audio.playSfx(this.config.audio?.sfx?.unlock);
    }

    if (wasNew) {
      this._playEndingResultSfx(this.endingAction);
    }
  }

  resetEndingState() {
    this.endingStartedAt = null;
    this.endingNodeKey = null;
    this.endingAction = null;
  }

  isEndingCardVisible(elapsed = performance.now()) {
    return isEndingCardReady({
      startedAt: this.endingStartedAt,
      elapsed,
      durationMs: this.config.endingNodeDurationMs
    });
  }

  isTransitioning(elapsed = performance.now()) {
    if (this.transitionStartedAt === null) {
      return false;
    }
    return elapsed - this.transitionStartedAt < this.config.transitionDurationMs;
  }

  startTransition(elapsed) {
    this.renderer.captureSnapshot();
    this.transitionStartedAt = elapsed;
  }

  finishTransition() {
    this.transitionStartedAt = null;
  }

  _startIntro(src, { continueOnTap = false, onComplete } = {}) {
    if (!src) {
      onComplete?.();
      return;
    }

    const video = this._createIntroVideo(src);
    this.phase = "intro";
    this.activeIntro = {
      src,
      video,
      continueOnTap,
      onComplete
    };
  }

  _createIntroVideo(src) {
    if (typeof document === "undefined" || !document.createElement) {
      return null;
    }

    const video = document.createElement("video");
    video.src = src;
    video.preload = "auto";
    video.playsInline = true;
    video.controls = false;
    video.addEventListener?.("ended", () => this.handleIntroEnded(), { once: true });
    const playPromise = video.play?.();
    if (playPromise) {
      playPromise.catch((err) => console.warn("[Game] Intro 视频播放被拒:", src, err.message));
    }
    return video;
  }

  handleIntroPress() {
    if (!this.activeIntro?.continueOnTap) {
      return;
    }
    this.audio.playSfx(this.config.audio?.sfx?.uiTap);
    this._completeIntro();
  }

  handleIntroEnded() {
    if (!this.activeIntro) {
      return;
    }
    this._completeIntro();
  }

  _completeIntro() {
    const intro = this.activeIntro;
    if (!intro) return;

    intro.video?.pause?.();
    this.activeIntro = null;
    intro.onComplete?.();
  }

  _cancelIntro() {
    const intro = this.activeIntro;
    if (!intro) return;

    intro.video?.pause?.();
    this.activeIntro = null;
  }

  _startShareCard(endingAction) {
    this.phase = "share";
    this.shareCard = {
      chapterId: this.activeChapter?.id,
      image: this.activeChapter?.shareImage,
      action: endingAction
    };
    this.shareButtonRects = [];
  }

  handleShareCardPress(point) {
    const hit = hitShareCardButton(point, this.shareButtonRects);
    if (!hit) {
      return;
    }

    this.audio.playSfx(this.config.audio?.sfx?.uiTap);
    if (hit.id === "share") {
      this._shareActiveCard();
      return;
    }

    this._completeShareCard();
  }

  _shareActiveCard() {
    const payload = {
      title: "今天不做人",
      text: this.shareCard?.action?.label ?? "",
      url: typeof window !== "undefined" ? window.location?.href : undefined
    };
    const sharePromise = globalThis.navigator?.share?.(payload);
    sharePromise?.catch?.((err) => console.warn("[Game] 分享被取消或失败:", err.message));
  }

  _completeShareCard() {
    const action = this.shareCard?.action;
    this.shareCard = null;
    this.shareButtonRects = [];
    this._applyEndingAction(action);
  }

  handleEndingCardPress() {
    if (this.endingAction?.result === "success" && this.activeChapter?.shareImage) {
      this._startShareCard(this.endingAction);
      return;
    }

    this._applyEndingAction(this.endingAction);
  }

  _applyEndingAction(action) {
    if (action?.type === "next_chapter") {
      this._enterMenuPhase();
      return;
    }

    if (action?.type === "outro") {
      this.audio.stopBgm?.({ fadeMs: 0 });
      this._startIntro(action.video, {
        continueOnTap: false,
        onComplete: () => this._enterMenuPhase()
      });
      return;
    }

    if (this.activeChapter) {
      this.startChapterIntro(this.activeChapter);
    }
  }

  tick() {
    const elapsed = performance.now();

    if (this.phase === "splash") {
      this.renderer.renderSplash({ elapsed });
    } else if (this.phase === "intro") {
      this.renderer.renderIntro({
        intro: this.activeIntro,
        elapsed
      });
    } else if (this.phase === "share") {
      this.shareButtonRects = this.renderer.renderShareCard({
        shareCard: this.shareCard,
        elapsed
      });
    } else if (this.phase === "menu") {
      const unlockedChapterIds = getUnlockedChapterIds(this.unlockStore.getCompletedEndingKeys());
      this.chapterMenuItems = getChapterMenuItems(this.config.canvasWidth, this.config.canvasHeight, this.chapters, unlockedChapterIds);
      this.renderer.renderChapterMenu({
        items: this.chapterMenuItems,
        elapsed
      });
    } else {
      this.syncEndingState(elapsed);

      if (this.isTransitioning(elapsed)) {
        const progress = (elapsed - this.transitionStartedAt) / this.config.transitionDurationMs;
        this.choiceRects = this.renderer.renderTransition({
          progress,
          node: this.flow.currentNode,
          elapsed,
          endingAction: this.isEndingCardVisible(elapsed) ? this.endingAction : null
        });
      } else {
        if (this.transitionStartedAt !== null) {
          this.finishTransition();
        }
        this.choiceRects = this.renderer.renderStoryNode({
          node: this.flow.currentNode,
          elapsed,
          endingAction: this.isEndingCardVisible(elapsed) ? this.endingAction : null
        });
      }
    }

    if (this.phase !== "splash") {
      this.exitButtonRect = this.renderer.renderExitButton({ elapsed });
    } else {
      this.exitButtonRect = null;
    }

    requestAnimationFrame(() => this.tick());
  }
}
