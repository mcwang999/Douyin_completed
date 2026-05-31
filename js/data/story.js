export const story = {
  startNodeId: "computer_intro",
  nodes: [
    {
      id: "computer_intro",
      kind: "scene",
      image: "assets/images/node1_1.png",
      text: "检测到对面碳基生物系统过载。",
      next: "opening_choice"
    },
    {
      id: "opening_choice",
      kind: "choice",
      image: "assets/images/node1_1.png",
      prompt: "电脑醒了。今天要怎么面对用户？",
      choices: [
        {
          id: "physical_retreat",
          label: "强行物理劝退",
          next: "node2_1"
        },
        {
          id: "black_screen",
          label: "主机断电黑屏",
          next: "node2_2"
        },
        {
          id: "stay_on",
          label: "保持开机与主人一刻也不分离",
          next: "node2_3"
        }
      ]
    },
    {
      id: "node2_1",
      kind: "scene",
      image: "assets/images/node2_1.png",
      bgm: "assets/audio/bgm/node2_1.mp3",
      text: "画面开始闪瞎狗眼，并播放一首用户这辈子不想再听见的神曲。",
      next: "end1"
    },
    {
      id: "end1",
      kind: "ending",
      image: "assets/images/end1.jpg",
      text: "用户沉默三秒，你被强行关机。世界终于安静了。",
      next: null
    },
    {
      id: "node2_2",
      kind: "scene",
      image: "assets/images/node2_2.png",
      text: "用户与你眉目传情，此时屏幕显示",
      next: "sleep_choice"
    },
    {
      id: "sleep_choice",
      kind: "choice",
      image: "assets/images/node2_2.png",
      prompt: "用户与你眉目传情，此时屏幕显示",
      choices: [
        {
          id: "cyber_sheep",
          label: "强迫人类赛博数羊",
          next: "counting_sheep"
        },
        {
          id: "voice_threat",
          label: "不睡就群发无痕浏览记录",
          next: "end3"
        }
      ]
    },
    {
      id: "counting_sheep",
      kind: "scene",
      image: "assets/images/counting_sheep.png",
      text: "用户开始跟着数。你第一次觉得自己像一台有编制的助眠设备。",
      next: "count_choice"
    },
    {
      id: "count_choice",
      kind: "choice",
      image: "assets/images/counting_sheep.png",
      prompt: "数羊进入关键阶段。",
      choices: [
        {
          id: "wrong_count",
          label: "故意数错玩弄一下他",
          next: "end2"
        },
        {
          id: "right_count",
          label: "老老实实勤勤恳恳",
          next: "end3"
        }
      ]
    },
    {
      id: "node2_3",
      kind: "scene",
      image: "assets/images/node2_3.png",
      text: "你继续保持开机。用户也继续保持上头，像一场不会结束的文档马拉松。",
      next: "end5"
    },
    {
      id: "end5",
      kind: "ending",
      image: "assets/images/end5.png",
      text: "过度运行，你炸了！",
      next: null
    },
    {
      id: "end2",
      kind: "ending",
      image: "assets/images/end2.png",
      text: "你故意数错。用户崩溃了，并开始怀疑自己。",
      next: null
    },
    {
      id: "end3",
      kind: "ending",
      image: "assets/images/end3.jpg",
      text: "用户睡着了。你觉得自己好像一台真正的助眠设备了。",
      next: null
    }
  ]
};
