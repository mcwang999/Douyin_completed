export class StoryFlow {
  constructor(story) {
    this.story = story;
    this.nodes = new Map(story.nodes.map((node) => [node.id, node]));
    this.history = [];
    this.currentNode = this.getNode(story.startNodeId);
  }

  reset() {
    this.history = [];
    this.currentNode = this.getNode(this.story.startNodeId);
    return this.currentNode;
  }

  advance() {
    if (!this.currentNode.next || this.currentNode.kind === "ending" || this.currentNode.kind === "choice") {
      return this.currentNode;
    }

    this.history.push(this.currentNode.id);
    this.currentNode = this.getNode(this.currentNode.next);
    return this.currentNode;
  }

  choose(choiceId) {
    if (this.currentNode.kind !== "choice") {
      throw new Error(`当前节点 "${this.currentNode.id}" 不能选择。`);
    }

    const choice = this.currentNode.choices.find((item) => item.id === choiceId);
    if (!choice) {
      throw new Error(`选项 "${choiceId}" 不存在。`);
    }

    this.history.push(`${this.currentNode.id}:${choice.id}`);
    this.currentNode = this.getNode(choice.next);
    return this.currentNode;
  }

  goTo(nodeId) {
    this.currentNode = this.getNode(nodeId);
    return this.currentNode;
  }

  getNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`剧情节点 "${nodeId}" 不存在。`);
    }
    return node;
  }
}
