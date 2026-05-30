export const story = {
  startNodeId: "computer_intro",
  nodes: [
    {
      id: "computer_intro",
      kind: "scene",
      image: "assets/images/node1_1.png",
      text: "对面的碳基生物累了。",
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
          label: "物理劝退",
          next: "node2_1"
        },
        {
          id: "black_screen",
          label: "黑屏装死",
          next: "node2_2"
        },
        {
          id: "stay_on",
          label: "继续保持开机",
          next: "node2_3"
        }
      ]
    },
    {
      id: "node2_1",
      kind: "scene",
      image: "assets/images/node2_1.png",
      text: "画面开始闪瞎狗眼，并播放一首用户这辈子不想再听见的神曲。",
      next: "end1"
    },
    {
      id: "end1",
      kind: "ending",
      image: "assets/images/end1.jpg",
      text: "用户沉默三秒，选择关机。世界终于安静了。",
      next: null
    },
    {
      id: "node2_2",
      kind: "scene",
      image: "assets/images/node2_2.png",
      text: "用户决定去躺在床上盯着你。你感觉事情开始变得私人。",
      next: "sleep_choice"
    },
    {
      id: "sleep_choice",
      kind: "choice",
      image: "assets/images/node2_2.png",
      prompt: "用户盯着数。你准备怎么处理？",
      choices: [
        {
          id: "cyber_sheep",
          label: "屏幕上出现赛博数羊",
          next: "counting_sheep"
        },
        {
          id: "voice_threat",
          label: "语音输出：听话，闭眼，不然我明天就把你的浏览器历史记录群发给通讯录",
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
          label: "故意数错",
          next: "end2"
        },
        {
          id: "right_count",
          label: "数对",
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
      text: "用户狂干到晕倒。结局：你被收拾东西的人扔进垃圾桶。",
      next: null
    },
    {
      id: "end2",
      kind: "ending",
      image: "assets/images/end2.png",
      text: "你故意数错。用户崩溃了，并开始怀疑数学也在针对自己。",
      next: null
    },
    {
      id: "end3",
      kind: "ending",
      image: "assets/images/end3.jpg",
      text: "用户睡了。你决定暂时不群发任何东西。",
      next: null
    }
  ]
};
