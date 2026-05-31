# Canvas 分支剧情 Demo

这是一个纯离线 HTML5 Canvas 互动剧情框架。当前结构保留启动页，启动后进入新的图片剧情流。

## 本地运行

```powershell
npm.cmd start
```

打开：

```text
http://127.0.0.1:5174/
```

## 测试

```powershell
npm.cmd test
```

## 当前流程

```text
启动页 Start.jpg
→ 点击进入章节菜单
→ 第一章默认可玩，后续章节按指定结局解锁
→ 普通剧情节点：显示 assets/images 里的图片和旁白文字，点击继续
→ 选择节点：模糊当前底图，用 Start_2.png 绘制选择框，点击选项跳转
→ 结局节点：显示结局图片和旁白文字
```

## 剧情配置

剧情数据位于：

```text
js/data/story.js
```

节点类型：

```text
scene：剧情图片节点，点击进入 next
choice：选择节点，点击选项进入对应 next
ending：结局节点，停留在当前结局
```

示例：

```js
{
  id: "opening_choice",
  kind: "choice",
  image: "assets/images/node1_1.png",
  prompt: "电脑醒了。今天要怎么面对用户？",
  choices: [
    { id: "physical_retreat", label: "物理劝退", next: "physical_retreat_scene" }
  ]
}
```

## 资源

```text
assets/images/Start.jpg    启动页底图
assets/images/Start_2.png  启动提示框和选择框底图
assets/images/chapter1/    第一章图片
assets/images/chapter2/    第二章图片
assets/images/chapter3/    第三章图片
```

第一章目前会优先读取 `assets/images/chapter1/`，如果没有找到，会回退读取旧的 `assets/images/` 根目录图片，方便保留现有资产。

## 解锁规则

```text
第一章：始终可玩
第二章：第一章到达 end2 后解锁
第三章：第二章到达 end6 后解锁
敬请期待：仅展示，不可进入
```

## 当前图片资产对照表

| 节点 | 类型 | 需要上传的图片 |
|---|---|---|
| 第一章开场剧情 | 剧情 | `assets/images/chapter1/node1_1.png` |
| 第一章物理劝退后 | 剧情 | `assets/images/chapter1/node2_1.png` |
| 第一章黑屏装死后 | 剧情 | `assets/images/chapter1/node2_2.png` |
| 第一章继续保持开机后 | 剧情 | `assets/images/chapter1/node2_3.png` |
| 第一章物理劝退结局 | 结局 | `assets/images/chapter1/end1.jpg` |
| 第一章赛博数羊 | 剧情 | `assets/images/chapter1/counting_sheep.png` |
| 第一章故意数错结局 | 结局 | `assets/images/chapter1/end2.png` |
| 第一章用户睡了结局 | 结局 | `assets/images/chapter1/end3.png` |
| 第一章用户狂干晕倒结局 | 结局 | `assets/images/chapter1/end5.png` |

第二章图片资产：

| 节点 | 类型 | 需要上传的图片 |
|---|---|---|
| 第二章开场 | 剧情 | `assets/images/chapter2/node1_1.png` |
| 悄悄爬过去后 | 剧情 | `assets/images/chapter2/node2_1.png` |
| 开足马力后 | 剧情 | `assets/images/chapter2/node2_2.png` |
| 产生幻觉 | 剧情 | `assets/images/chapter2/node3_1.png` |
| 反复蹦迪后 | 剧情 | `assets/images/chapter2/node3_2.png` |
| 结局 2 | 结局 | `assets/images/chapter2/end2.png` |
| 结局 3 | 结局 | `assets/images/chapter2/end3.png` |
| 结局 4 | 结局 | `assets/images/chapter2/end4.png` |
| 结局 5 | 结局 | `assets/images/chapter2/end5.png` |
| 结局 6，解锁第三章 | 结局 | `assets/images/chapter2/end6.png` |
| 结局 7 | 结局 | `assets/images/chapter2/end7.png` |
| 结局 8 | 结局 | `assets/images/chapter2/end8.png` |
