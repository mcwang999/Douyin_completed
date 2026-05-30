import { story as chapter1Story } from "./story.js";

const chapter2Story = {
  startNodeId: "node1",
  nodes: [
    {
      id: "node1",
      kind: "scene",
      image: "assets/images/chapter2/node1.png",
      text: "碳基生物睡了。你是一只蚊子，世界忽然变得很香。",
      next: "node1_choice"
    },
    {
      id: "node1_choice",
      kind: "choice",
      image: "assets/images/chapter2/node1.png",
      prompt: "现在要怎么开局？",
      choices: [
        { id: "sneak", label: "悄悄爬过去", next: "node2_1" },
        { id: "buzz", label: "开足马力高音频直接冲向用户", next: "node2_2" },
        { id: "dance", label: "炫一下自己优美的舞姿", next: "node2_3" }
      ]
    },
    {
      id: "node2_1",
      kind: "scene",
      image: "assets/images/chapter2/node2_1.png",
      text: "半路遇到一股美味，是臭袜子。",
      next: "end1"
    },
    {
      id: "node2_2",
      kind: "scene",
      image: "assets/images/chapter2/node2_2.png",
      text: "你靠近用户的手。风压很大，命运很薄。",
      next: "node2_2_choice"
    },
    {
      id: "node2_2_choice",
      kind: "choice",
      image: "assets/images/chapter2/node2_2.png",
      prompt: "用户的手就在眼前。",
      choices: [
        { id: "dance_bite", label: "反复蹦迪", next: "node3" },
        { id: "gentle_bite", label: "温柔一击，轻轻啜一口", next: "end4" }
      ]
    },
    {
      id: "node2_3",
      kind: "scene",
      image: "assets/images/chapter2/node2_3.png",
      text: "你炫了一下自己优美的舞姿，优美到忘记抬头看路。",
      next: "end5"
    },
    {
      id: "node3",
      kind: "scene",
      image: "assets/images/chapter2/node3.png",
      text: "吃饱喝足后，用户一边条件反射挥舞双手，一边抓到电风扇开关。",
      next: "node3_choice"
    },
    {
      id: "node3_choice",
      kind: "choice",
      image: "assets/images/chapter2/node3.png",
      prompt: "风来了。你必须立刻决定。",
      choices: [
        { id: "let_go", label: "顺风放手一搏", next: "end2" },
        { id: "hold_sweat", label: "你抱住用户的汗毛", next: "end3" }
      ]
    },
    {
      id: "end1",
      kind: "ending",
      image: "assets/images/chapter2/end1.png",
      text: "吃嗨了就原地睡了，第二天被拍死了。",
      next: null
    },
    {
      id: "end2",
      kind: "ending",
      image: "assets/images/chapter2/end2.png",
      text: "你顺风放手一搏，被吹出窗户，获得新生。",
      next: null
    },
    {
      id: "end3",
      kind: "ending",
      image: "assets/images/chapter2/end3.png",
      text: "结果用户翻身把你捂在被子里压死了。",
      next: null
    },
    {
      id: "end4",
      kind: "ending",
      image: "assets/images/chapter2/end4.png",
      text: "你吃个七分饱，潇洒离开。",
      next: null
    },
    {
      id: "end5",
      kind: "ending",
      image: "assets/images/chapter2/end5.png",
      text: "过于沉溺，撞上天花板撞死了。",
      next: null
    }
  ]
};

const chapter3Story = {
  startNodeId: "chapter3_placeholder",
  nodes: [
    {
      id: "chapter3_placeholder",
      kind: "ending",
      image: "assets/images/chapter3/node1_1.png",
      text: "第三章框架已预留，等待资产和剧情。",
      next: null
    }
  ]
};

export const chapters = [
  {
    id: "chapter1",
    title: "第一章",
    subtitle: "电脑：对面的碳基生物累了",
    story: withChapterAssets(chapter1Story, "chapter1"),
    alwaysUnlocked: true
  },
  {
    id: "chapter2",
    title: "第二章",
    subtitle: "蚊子：碳基生物睡了",
    story: chapter2Story,
    unlockRequirement: { chapterId: "chapter1", endingId: "end2" }
  },
  {
    id: "chapter3",
    title: "第三章",
    subtitle: "下一件物品正在做心理建设",
    story: chapter3Story,
    unlockRequirement: { chapterId: "chapter2", endingId: "end2" }
  },
  {
    id: "coming_soon",
    title: "敬请期待",
    subtitle: "更多失控物品排队中",
    comingSoon: true
  }
];

export function getChapterById(chapterId) {
  return chapters.find((chapter) => chapter.id === chapterId);
}

export function getUnlockedChapterIds(completedEndingKeys) {
  return chapters
    .filter((chapter) => {
      if (chapter.alwaysUnlocked) {
        return true;
      }
      if (chapter.comingSoon || !chapter.unlockRequirement) {
        return false;
      }
      return completedEndingKeys.includes(`${chapter.unlockRequirement.chapterId}:${chapter.unlockRequirement.endingId}`);
    })
    .map((chapter) => chapter.id);
}

function withChapterAssets(story, chapterFolder) {
  return {
    ...story,
    nodes: story.nodes.map((node) => ({
      ...node,
      image: node.image.replace("assets/images/", `assets/images/${chapterFolder}/`),
      fallbackImage: node.image
    }))
  };
}
