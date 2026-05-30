export class UnlockStore {
  constructor() {
    this.completedEndingKeys = new Set();
  }

  getCompletedEndingKeys() {
    return [...this.completedEndingKeys];
  }

  markCompleted(chapterId, endingId) {
    this.completedEndingKeys.add(`${chapterId}:${endingId}`);
  }
}
