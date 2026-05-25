# 《一夜剧本》v2 深度拓展 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 v1 双按钮互动剧升级为 v2：裁员+过去自己蒙太奇、9～11 幕、5 种交互 mode、D+C 分层 UI、4 主结局 + 2 隐藏结局；不使用 AIGC API。

**Architecture:** `story.js` 为唯一剧情数据源；`gameState.js` 集中数值/flags/结局/章节日志；`main.js` 按节点 `mode` 调度 `js/modes/*`；`renderer.js` 组合 L0 `atmosphere` + L1 `layers/paper` + L2 `layers/chrome` + L3 当前 mode。卫语句、单函数认知复杂度 ≤15（code-architect）。

**Tech Stack:** 微信小游戏、Canvas 2D、`requestAnimationFrame`、ES Module、`wx.setStorageSync`

**Spec:** `docs/superpowers/specs/2026-05-25-yiye-juben-v2-expansion-design.md`

---

## 架构约束（code-architect）

| 规则 | 落地 |
|------|------|
| 数据集中 | 剧情仅 `story.js`；数值/结局仅 `gameState.js`；色板仅 `theme.js` |
| 功能零破坏 | 每 Task 末尾在模拟器回归：标题 → 至少一条路径 → 结局/返回标题 |
| 卫语句 | `goNode` / `resolveEnding` / mode `update` 先判空提前 return |
| 注释 | 每个新文件顶部 Docstring；导出函数写 `@param` / `@returns` |
| 文件规模 | 单文件建议 ≤300 行；`story.js` 节点多时可拆 `story/nodes.js` + `story/index.js`（可选 Task 7b） |
| 安全 | 无 API Key；`STORAGE_KEY = 'yiye_v2_chapter_log'` 仅存章节元数据 |

---

## File Map

| 文件 | 操作 | 职责 |
|------|------|------|
| `docs/story-copy-yiye-juben.md` | **重写** | v2 全文案（无母亲线） |
| `js/story.js` | **重写** | `act*` 节点图 + `getNode` / `START_ID` |
| `js/gameState.js` | **新建** | stats、flags、`applyChoice`、`resolveEnding`、日志 |
| `js/theme.js` | **修改** | D+C 纸/霓虹色、字体 |
| `js/atmosphere.js` | **修改** | `drawBackdrop(tick, timeline)` 琥珀/冷青 |
| `js/layers/paper.js` | **新建** | 纸纹面板、便签按钮、翻页动画状态 |
| `js/layers/chrome.js` | **新建** | 工牌条、HR/客户徽章、压力细条 |
| `js/modes/registry.js` | **新建** | `getModeHandler(modeName)` |
| `js/modes/narrative.js` | **新建** | 旁白 + 便签选项 |
| `js/modes/qte.js` | **新建** | 节拍点击（P2） |
| `js/modes/mail.js` | **新建** | 邮件抽屉 + 回复倾向（P2） |
| `js/modes/pressure.js` | **新建** | 倒计时（P2） |
| `js/modes/edit.js` | **新建** | 句块删留（P3） |
| `js/modes/archive.js` | **新建** | 素材卡片勾选（P3） |
| `js/renderer.js` | **重构** | 组合层；标题/结局；委托 mode |
| `js/main.js` | **修改** | mode 调度、`gameState` 生命周期 |
| `js/input.js` | **保持** | 统一命中（必要时扩展 `index` 为 string id） |
| `README.md` | **修改** | v2 玩法说明；AIGC 降为「后续可选」 |

**不 import：** `js/player/**`、`js/npc/**`、`js/databus.js`

---

## 手动验收（全计划通用）

1. 微信开发者工具 → 打开 `d:\AAA\wexingame` → **编译**
2. 按 Task 描述路径点击
3. **通过：** 无白屏；Console 无 `SyntaxError`；状态切换符合 Task

---

## Phase P1 — 骨架、文案、叙事 UI、主结局

### Task 1: `gameState.js` 数值与结局

**Files:**
- Create: `js/gameState.js`

- [ ] **Step 1: 创建 `js/gameState.js`**

```javascript
/**
 * 对局状态：诚意/压力/AI 依赖、flags、章节日志、结局解析。
 * 业务逻辑集中于此，禁止散落在 modes 内硬编码阈值。
 */

const STORAGE_KEY = 'yiye_v2_chapter_log';

const DEFAULT_STATS = {
  sincerityPast: 50,
  sincerityNow: 50,
  stress: 20,
  aiDepend: 0,
};

/** @type {typeof DEFAULT_STATS} */
let stats = { ...DEFAULT_STATS };

/** @type {Record<string, boolean>} */
let flags = {};

/** @type {{ actId: string, title: string, timeline: string, ts: number }[]} */
let chapterLog = [];

export function resetRun() {
  stats = { ...DEFAULT_STATS };
  flags = {};
}

export function getStats() {
  return { ...stats };
}

/**
 * 应用选项副作用（由 main 在跳转前调用）。
 * @param {{ statDelta?: Partial<typeof DEFAULT_STATS>, setFlags?: Record<string, boolean> }} effect
 */
export function applyEffect(effect) {
  if (!effect) return;
  if (effect.statDelta) {
    Object.keys(effect.statDelta).forEach((k) => {
      stats[k] = Math.max(0, Math.min(100, (stats[k] || 0) + effect.statDelta[k]));
    });
  }
  if (effect.setFlags) {
    flags = { ...flags, ...effect.setFlags };
  }
}

/**
 * 记录已读章节（进入节点时调用一次）。
 */
export function pushChapter(node) {
  if (!node || !node.id) return;
  const entry = {
    actId: node.id,
    title: node.title || node.id,
    timeline: node.timeline || 'now',
    ts: Date.now(),
  };
  const last = chapterLog[chapterLog.length - 1];
  if (last && last.actId === entry.actId) return;
  chapterLog.push(entry);
  try {
    wx.setStorageSync(STORAGE_KEY, chapterLog);
  } catch (e) {
    /* 存储失败不阻断游戏 */
  }
}

export function loadChapterLog() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    chapterLog = Array.isArray(raw) ? raw : [];
  } catch (e) {
    chapterLog = [];
  }
  return chapterLog.slice();
}

/**
 * 根据 stats + flags 解析结局 id（节点 isEnding 为 false 时由汇合幕调用）。
 * @returns {'ending_a'|'ending_b'|'ending_c'|'ending_d'|'ending_secret_1'|'ending_secret_2'}
 */
export function resolveEnding() {
  if (flags.secret1Eligible && stats.sincerityPast >= 70 && stats.aiDepend < 30) {
    return 'ending_secret_1';
  }
  if (flags.fullAiSubmit && stats.aiDepend >= 80) {
    return 'ending_secret_2';
  }
  if (stats.sincerityNow >= 65 && stats.aiDepend < 40) return 'ending_a';
  if (stats.aiDepend >= 60 && stats.sincerityNow < 40) return 'ending_b';
  if (flags.dualVersion) return 'ending_c';
  return 'ending_d';
}
```

- [ ] **Step 2: 编译**

Run: 微信开发者工具 **编译**  
Expected: 无报错（尚未 import，下一步接入）

- [ ] **Step 3: Commit**

```bash
git add js/gameState.js
git commit -m "feat: add centralized game state and ending resolver"
```

---

### Task 2: `theme.js` D+C 色板

**Files:**
- Modify: `js/theme.js`

- [ ] **Step 1: 替换 `COLORS` / `FONT` 为 D+C**

```javascript
export const COLORS = {
  ink: '#06080f',
  paper: '#f4efe6',
  paperInk: '#2a2520',
  paperMuted: '#5c5348',
  cyan: '#00f5d4',
  hr: '#e63946',
  client: '#ffc53d',
  badge: '#8b9cb3',
  glass: 'rgba(12, 18, 32, 0.78)',
  glassBorder: 'rgba(0, 245, 212, 0.35)',
  pastTint: 'rgba(255, 197, 61, 0.18)',
  nowTint: 'rgba(0, 245, 212, 0.08)',
};

export const FONT = {
  title: 'bold 28px "Songti SC", STSong, serif',
  sceneTitle: 'bold 16px "Songti SC", STSong, serif',
  chapter: 'bold 11px sans-serif',
  body: '15px sans-serif',
  bodySmall: '13px sans-serif',
  btn: '14px sans-serif',
  mono: '12px monospace',
};
```

- [ ] **Step 2: 编译** — 通过  
- [ ] **Step 3: Commit** — `style: apply D+C theme tokens`

---

### Task 3: 分层 `layers/paper.js` + `layers/chrome.js`

**Files:**
- Create: `js/layers/paper.js`
- Create: `js/layers/chrome.js`

- [ ] **Step 1: `paper.js` — 导出 `drawPaperPanel(ctx, x, y, w, h)`、`drawStickyChoice(ctx, rect, label, selected)`**

实现要点：圆角纸色底、`COLORS.paperInk` 正文；便签右侧轻微折角线；使用 `renderer` 传入的 ctx（从 `canvas.getContext('2d')` 在 renderer 取一次传入，避免循环 import）。

- [ ] **Step 2: `chrome.js` — 导出 `drawTopChrome(ctx, { stress, timeline })`**

左：工牌灰块「工号 ·••」；中：细压力条 `stress/100`；右：timeline===`past` 显示琥珀点，否则青点。

- [ ] **Step 3: Commit** — `feat: add paper and chrome canvas layers`

---

### Task 4: `atmosphere.js` 支持 `timeline`

**Files:**
- Modify: `js/atmosphere.js`

- [ ] **Step 1: 将 `drawBackdrop(tick)` 改为 `drawBackdrop(tick, timeline = 'now')`**

在 `drawNightSky` 之后：`timeline === 'past'` 时 `fillStyle = COLORS.pastTint` 全屏叠层；`now` 用 `COLORS.nowTint`。

- [ ] **Step 2: 编译** — 现有游戏仍可运行  
- [ ] **Step 3: Commit** — `feat: timeline tint on backdrop`

---

### Task 5: Mode 注册表与 narrative mode

**Files:**
- Create: `js/modes/registry.js`
- Create: `js/modes/narrative.js`

- [ ] **Step 1: `registry.js`**

```javascript
/**
 * 玩法 mode 注册表。
 */
import * as narrative from './narrative';

const HANDLERS = {
  narrative,
};

export function getModeHandler(mode) {
  return HANDLERS[mode] || HANDLERS.narrative;
}
```

- [ ] **Step 2: `narrative.js` 导出统一接口**

```javascript
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} node
 * @param {number} animTick
 * @returns {{ regions: object[], onTap: (idx: number) => void } | null}
 */
export function render(ctx, node, animTick) {
  // 调用 layers/paper 画正文与 choices
  // 返回 hit regions + 内部不跳转，由 main onChoice 处理
}
```

- [ ] **Step 3: Commit** — `feat: mode registry and narrative handler`

---

### Task 6: 重写 v2 文案与 `story.js` 节点（幕 1～10）

**Files:**
- Modify: `docs/story-copy-yiye-juben.md`
- Modify: `js/story.js`

- [ ] **Step 1: 按 spec §2.4 在 `docs/story-copy-yiye-juben.md` 写完全部幕 1～10 + 6 结局全文**（删除母亲/病房；裁员+三年前自己；保留「我其实……」）

- [ ] **Step 2: `story.js` 节点 id 规范**

| id | timeline | mode |
|----|----------|------|
| `act1_now` | now | narrative |
| `act2_past` | past | narrative |
| `act3_now` | now | narrative |
| … | … | … |
| `act9_now` | now | narrative（P1 先用 narrative 占位，P3 改 edit） |
| `act10_gate` | now | narrative（choices 触发 `resolveEnding` 跳转） |
| `ending_a` … `ending_secret_2` | now | isEnding: true |

每个 `choices[]` 项增加可选字段：

```javascript
{ label: '…', next: 'act3_now', effect: { statDelta: { aiDepend: 15 }, setFlags: { uploadedAi: true } } }
```

- [ ] **Step 3: `act10_gate` 两选项示例**

```javascript
choices: [
  { label: '发布并如实标注', next: 'ending_a', effect: { statDelta: { sincerityNow: 20 }, setFlags: { honestPublish: true } } },
  { label: '发布但不提 AI', next: 'ending_b', effect: { statDelta: { aiDepend: 10 } } },
  // 另路径在 act9 已设 flags.dualVersion → main 调 resolveEnding
],
```

- [ ] **Step 4: 导出 `getNode(id)`、`START_ID = 'act1_now'`**

- [ ] **Step 5: 模拟器** — 从标题能点到 act2，文案无母亲  
- [ ] **Step 6: Commit** — `content: v2 montage story graph and copy doc`

---

### Task 7: 重构 `renderer.js` + `main.js` 接入 mode

**Files:**
- Modify: `js/renderer.js`
- Modify: `js/main.js`

- [ ] **Step 1: `renderer.js` 新增 `drawPlaying(node, animTick)`**

顺序：`drawBackdrop(tick, node.timeline)` → `drawTopChrome` → `getModeHandler(node.mode).render(...)`。

标题页增加「章节日志」按钮（`loadChapterLog().length > 0` 时绘制）；点击只读展示最近 5 条（简单列表 overlay 或跳转 `state = 'log'` 轻量屏）。

- [ ] **Step 2: `main.js` 构造函数调用 `loadChapterLog()`；`goNode` 内 `pushChapter(node)`**

```javascript
import { applyEffect, pushChapter, resetRun, resolveEnding } from './gameState';
import { getModeHandler } from './modes/registry';

onChoice(choiceIndex) {
  const node = getNode(this.currentNodeId);
  if (!node?.choices?.[choiceIndex]) return;
  const choice = node.choices[choiceIndex];
  applyEffect(choice.effect);
  if (node.id === 'act10_gate' && choice.next.startsWith('ending_')) {
    this.goNode(choice.next);
    return;
  }
  let nextId = choice.next;
  if (nextId === '__resolve_ending__') {
    nextId = resolveEnding();
  }
  this.goNode(nextId);
}

goTitle() {
  resetRun();
  // ...
}
```

- [ ] **Step 3: 结局节点 `drawEndingScreen` 显示 `getStats()` 一行摘要**

- [ ] **Step 4: 模拟器** — 任意选到底到达 `ending_a` 或 `ending_b`  
- [ ] **Step 5: Commit** — `feat: wire mode dispatch and gameState into main loop`

**P1 验收：** 9 幕 narrative 可从头走到任一主结局；UI 可见纸纹+顶栏 chrome；三年前幕偏琥珀。

---

## Phase P2 — QTE、邮件、压力（幕 5、7）

### Task 8: `modes/qte.js`

**Files:**
- Create: `js/modes/qte.js`
- Modify: `js/modes/registry.js`
- Modify: `js/story.js`（`act7_now`）

- [ ] **Step 1: 节点 `modeParams` 形状**

```javascript
modeParams: {
  progressLabel: '渲染 99%',
  beats: [
    { at: 0.55, windowMs: 900, label: '点住节拍' },
    { at: 0.82, windowMs: 700, label: '再按住' },
  ],
  successNext: 'act8_past',
  failNext: 'act7_fail_now',
},
```

- [ ] **Step 2: `qte.js` 逻辑**

- 进度条随帧增加；`at` 时打开命中区；点在窗口内 `success` 否则 `fail`
- `stress` 高时 `windowMs *= 0.85`（从 `getStats()` 读）
- 完成时 `onComplete(nextId)` 由 main 注入

- [ ] **Step 3: `main.syncInput` 对 qte 传 `{ goNext: (id) => this.goNode(id) }`**

- [ ] **Step 4: 模拟器 act7 两节拍可过  
- [ ] **Step 5: Commit** — `feat: render queue QTE mode`

---

### Task 9: `modes/mail.js`（幕 5）

**Files:**
- Create: `js/modes/mail.js`
- Modify: `js/story.js`（`act5_now`）

- [ ] **Step 1: `modeParams.threads`**

```javascript
threads: [
  { from: 'client', color: 'client', subject: '明早九点前要成片', body: '要爽点，要反转。', replies: [
      { label: '先答应再说', effect: { statDelta: { stress: 15 } }, next: 'act5_continue' },
      { label: '发进度截图稳住', effect: { statDelta: { sincerityNow: 5 } }, next: 'act5_continue' },
  ]},
],
```

- [ ] **Step 2: UI** — 霓虹信封列表；点击展开纸纹正文；底部 2 回复便签

- [ ] **Step 3: Commit** — `feat: mail drawer mode for act5`

---

### Task 10: `modes/pressure.js`（幕 5/7 叠加）

**Files:**
- Create: `js/modes/pressure.js`
- Modify: `js/modes/mail.js` 或 `renderer` — 顶栏调用 `pressure.getRemainingSec()`

- [ ] **Step 1: `pressure` 导出 `startCountdown(sec, onTimeout)`、`tick(dt)`、`drawBar`**

- [ ] **Step 2: `act7_now` 组合** — `mode: 'qte'` 且 `modeParams.pressureSec: 120`；qte 每帧 `pressure.tick`

- [ ] **Step 3: 超时 `goNode(failNext)` 且 `stress` +20**

- [ ] **Step 4: 模拟器 — 干等 120s 太慢，调试可用 `modeParams.pressureSec: 15` 测 timeout 路径**

- [ ] **Step 5: Commit** — `feat: pressure countdown bar`

**P2 验收：** act5 邮件、act7 QTE+压力条可玩；三种 mode 均已注册。

---

## Phase P3 — 剪辑台、素材盘、隐藏结局、日志

### Task 11: `modes/archive.js`（幕 8）

**Files:**
- Create: `js/modes/archive.js`
- Modify: `js/story.js`（`act8_past`）

- [ ] **Step 1: `modeParams.tiles`**

```javascript
tiles: [
  { id: 'truth_line', label: '「我其实……」原声', keep: true },
  { id: 'broll_city', label: '窗外车流空镜', keep: false },
],
minKeep: 1,
successNext: 'act9_now',
```

- [ ] **Step 2: 点击切换 keep；确认钮 `regions`；`keep truth_line` → `sincerityPast +25` + `secret1Eligible`**

- [ ] **Step 3: Commit** — `feat: archive tile mode`

---

### Task 12: `modes/edit.js`（幕 9）

**Files:**
- Create: `js/modes/edit.js`
- Modify: `js/story.js`（`act9_now` mode → `edit`）

- [ ] **Step 1: 句块 `[{ id, text, ai: true }]` 点击删除/恢复**

- [ ] **Step 2: 删除所有 `ai: true` 金句 → `aiDepend` 低；保留 → `aiDepend` 高**

- [ ] **Step 3: 「继续」跳转 `act10_gate`**

- [ ] **Step 4: Commit** — `feat: edit timeline strip mode`

---

### Task 13: 隐藏结局路由 + 章节日志屏

**Files:**
- Modify: `js/story.js`（`ending_secret_*` 节点全文）
- Modify: `js/gameState.js`（flags 在 act8/9 设齐）
- Modify: `js/renderer.js`（`state === 'log'` 列表）

- [ ] **Step 1: `act10_gate` 增加选项 `{ next: '__resolve_ending__' }` 供复杂路径**

- [ ] **Step 2: 模拟器走 secret1：act8 留真话 + act9 删 AI 句 + resolve**

- [ ] **Step 3: 标题「重温」进入 log 屏，点击条目 `goNode(actId)` 只读（`flags.readOnlyReplay = true` 禁止改 stats）**

- [ ] **Step 4: Commit** — `feat: secret endings and chapter log replay`

---

### Task 14: README 与清理

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README 增加 v2 结构图、P1～P3 功能列表、模拟器路径、无 AIGC 说明**

- [ ] **Step 2: 确认 `game.js` 仅 `import Main from './js/main'`**

- [ ] **Step 3: Commit** — `docs: update README for v2 expansion`

**P3 / 全案验收：**

- [ ] 4 主结局 + 2 隐藏各 1 路径可达  
- [ ] 单局路径 ≥15 分钟（全分支可快进测逻辑）  
- [ ] 无母亲相关文案残留（`rg "母亲|病房" docs js` 无命中）

---

## Spec 覆盖自检

| Spec § | Task |
|--------|------|
| 裁员+过去自己蒙太奇 | Task 6 |
| 9～11 幕 | Task 6, 13 |
| 5 种 mode 优先级 | Task 8–12 |
| D+C UI | Task 2–4, 7 |
| gameState 结局 | Task 1, 7, 13 |
| 章节日志 | Task 1, 7, 13 |
| 无 AIGC | README Task 14 |
| P1/P2/P3 分期 | Phase 分段 |

**占位扫描：** 无 TBD 步骤；各 mode 有 `modeParams` 示例。

---

## 执行方式（完成后由负责人选择）

**Plan 路径：** `docs/superpowers/plans/2026-05-25-yiye-juben-v2-expansion.md`

1. **Subagent-Driven（推荐）** — 每 Task 派生子代理 + 任务间审查  
2. **Inline Execution** — 本会话用 executing-plans 按 Task 批量执行并设检查点  

实现时 **REQUIRED：** `subagent-driven-development` 或 `executing-plans`。
