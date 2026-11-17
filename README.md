# 《县太爷今天也很忙》微信小游戏

古风轻讽刺卡牌决策：你是穷县新任县令，百姓、师爷、上官、乡绅轮番来找你。左右拖动卡牌做决断，平衡 **民心 / 钱粮 / 官声 / 良心**——任何一项归零或爆满，你就得下台。

## 运行

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/minigame/dev/devtools/download.html)
2. 导入本项目目录，点击 **编译**

## 玩法

- 拖动卡牌：卡面显示该方向的选项，顶部圆点提示会影响哪几项（大小 = 幅度，不告诉你是加是减）
- 每张卡推进 1～3 天，每 30 天知府年终考核；任满 365 天光荣致仕
- 12 个结局（8 个数值结局 + 科举 / 狐仙 / 水患剧情线 + 任满），历任档案永久保存
- 多局解锁：第 2 任起西巷老宅出现狐仙线；解锁 2 个结局后钦差下乡

## 源码结构

```
js/
├── main.js          # 主循环、场景注册
├── session.js       # 存档 / 设置 / 当前一任
├── core/            # 画布与 DPR、触摸、补间、程序化音效、场景转场、平台能力
├── game/            # 纯逻辑：stats / run（抽牌、抉择、结局）/ meta（跨局存档）
├── data/            # characters / cards / endings —— 内容都在这里改
├── ui/              # 宣纸背景、印章、按钮、中文排版
└── scenes/          # title / play / ending / archive
```

无任何图片与音频素材：背景、印章头像均为 Canvas 绘制并离屏缓存；音效用 WebAudio 实时合成。

## 改内容

- 新卡牌：在 `js/data/cards.js` 追加，`fx` 键为 `people` / `money` / `court` / `heart`
- 剧情链：选项加 `chain: { id, delay }`，目标卡标 `chainOnly: true`
- 出现条件：`requires: { flags, notFlags, minDay, stat: { key: [min, max] }, runs, endings }`

## 测试

```
npm test
```

覆盖数值、抽牌、结局、存档、排版、数据完整性、1000 局随机模拟，以及一次无头完整通关（模拟 wx 与触摸）。


## 项目展示

面试介绍与讲解方向见 [项目展示说明](docs/PORTFOLIO.md)。
