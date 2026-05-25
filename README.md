# 《一夜剧本》微信小游戏 v2

都市科幻互动微剧：裁员前夜，在 **今夜工位** 与 **三年前同一栋楼** 的蒙太奇之间抉择，用 QTE、邮件、剪辑台完成一夜成片。

## 运行

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入本项目目录 `wexingame`
3. 点击 **编译**，在模拟器或真机预览

## v2 功能

| 模块 | 说明 |
|------|------|
| 剧情 | 10 幕蒙太奇 + 4 主结局 + 2 隐藏结局（无 AIGC API） |
| 交互 | `narrative` / `mail` / `qte` / `archive` / `edit` |
| UI | 纸纹手稿 + HR/客户霓虹顶栏 + 雨夜程序化背景 |
| 状态 | `js/gameState.js` 集中数值与结局判定 |
| 文案 | `docs/story-copy-yiye-juben.md`（与 `js/story.js` 同步维护） |

## 源码结构

```
js/
├── main.js           # 状态机
├── story.js          # 剧情节点（唯一数据源）
├── gameState.js      # 数值 / flags / 结局 / 章节日志
├── renderer.js       # 画面组合
├── theme.js          # D+C 色板
├── atmosphere.js     # L0 雨夜背景
├── layers/           # 纸纹 / chrome 顶栏
└── modes/            # 各玩法 mode
```

## 规格与计划

- 设计：`docs/superpowers/specs/2026-05-25-yiye-juben-v2-expansion-design.md`
- 实现计划：`docs/superpowers/plans/2026-05-25-yiye-juben-v2-expansion.md`

## 验收建议

- 标题 → 开始 → 走完全程至结局
- 幕 5：邮件回复；幕 7：QTE 节拍；幕 8：素材勾选；幕 9：句块删留
- 标题页「重温章节日志」（有二周目进度后出现）
