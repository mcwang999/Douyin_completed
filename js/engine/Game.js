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
    this.transitionStartedAt = null;
    this._bgmStarted = false;
  }

  start() {
    this.input.onPress((point) => this.handlePress(point));
    this.tick();
  }

  handlePress(point) {
    const elapsed = performance.now();
    this.audio.unlock();
    if (!this._bgmStarted && this.config.audio?.bgm) {
      this.audio.playBgm(this.config.audio.bgm);
      this._bgmStarted = true;
    }
    if (this.isTransitioning(elapsed)) {
      return;
    }

    if (this.phase === "splash") {
      if (isSplashStartTap(point, this.config.canvasWidth, this.config.canvasHeight)) {
        this.phase = "menu";
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
        this.handleEndingCardPress();
      }
      return;
    }

    if (node.kind === "choice") {
      const hit = hitChoiceRect(point, this.choiceRects);
      if (hit) {
        this.startTransition(elapsed);
        this.flow.choose(hit.choice.id);
        this.syncEndingState();
      }
      return;
    }

    this.startTransition(elapsed);
    this.flow.advance();
    this.syncEndingState();
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

    this.startChapter(chapter);
  }

  startChapter(chapter) {
    this.startTransition(performance.now());
    this.activeChapter = chapter;
    this.flow = new StoryFlow(chapter.story);
    this.phase = "story";
    this.resetEndingState();
    this.syncEndingState();
  }

  syncEndingState(elapsed = performance.now()) {
    const node = this.flow?.currentNode;
    if (node?.kind !== "ending" || !this.activeChapter) {
      this.resetEndingState();
      return;
    }

    const endingNodeKey = `${this.activeChapter.id}:${node.id}`;
    if (this.endingNodeKey !== endingNodeKey) {
      this.endingStartedAt = elapsed;
      this.endingNodeKey = endingNodeKey;
      this.endingAction = getEndingAction(this.activeChapter.id, node.id);
    }

    this.unlockStore.markCompleted(this.activeChapter.id, node.id);
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

  handleEndingCardPress() {
    if (this.endingAction?.type === "next_chapter") {
      const chapter = getChapterById(this.endingAction.chapterId);
      if (chapter?.story) {
        this.startChapter(chapter);
      }
      return;
    }

    if (this.activeChapter) {
      this.startChapter(this.activeChapter);
    }
  }

  tick() {
    const elapsed = performance.now();

    if (this.phase === "splash") {
      this.renderer.renderSplash({ elapsed });
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

    requestAnimationFrame(() => this.tick());
  }
}
