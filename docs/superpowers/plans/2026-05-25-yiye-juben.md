# 《一夜剧本》Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将微信官方飞机 Demo 替换为都市科幻互动剧《一夜剧本》，Canvas 点选跑通 3 抉择 + 2 结局，并为 AIGC 文档留好 `story.js` 数据源。

**Architecture:** 保留 `js/render.js` 初始化 Canvas；新增 `story.js`（唯一剧情数据源）、`renderer.js`（绘制）、`input.js`（触摸命中）；`main.js` 仅做状态机调度。不 import 飞机相关模块。图片加载失败时用渐变兜底。

**Tech Stack:** 微信小游戏 API、`canvas` 2D、`requestAnimationFrame`、ES Module（`import`/`export`）

**Spec:** `docs/superpowers/specs/2026-05-25-yiye-juben-design.md`

---

## File Map（实现前后）

| 文件 | 操作 | 职责 |
|------|------|------|
| `game.js` | 保持 | 入口 `new Main()` |
| `js/render.js` | 保持 | Canvas 尺寸、`SCREEN_WIDTH/HEIGHT` |
| `js/story.js` | **新建** | 节点数据 + `getNode` / `START_ID` |
| `js/renderer.js` | **新建** | 标题/场景/结局绘制、图片缓存 |
| `js/input.js` | **新建** | 触摸区域注册与命中 |
| `js/main.js` | **重写** | `title` / `playing` / `ending` 状态机 |
| `js/player/**` 等 | 不 import | 可保留在目录，编译不会加载 |
| `README.md` | Task 6 改 | 运行 + AIGC 管线 |
| `docs/aigc-pipeline.md` | Task 6 新建 | 提示词与截图说明 |

---

## 手动验收（代替自动化测试）

微信小游戏无内置 pytest。每个 Task 末尾在**微信开发者工具**执行：

1. 点击「编译」
2. 模拟器内完成该 Task 描述的点击路径
3. **通过标准：** 无白屏；Console 无阻断游戏的红色 `SyntaxError`

---

### Task 1: 剧情数据 `story.js`

**Files:**
- Create: `js/story.js`

- [ ] **Step 1: 创建 `js/story.js`（完整内容）**

```javascript
/**
 * 《一夜剧本》剧情节点 — 唯一数据源。
 * 修改剧本只改本文件，不碰渲染逻辑。
 */

/** @type {string} 游戏开始时的节点 id */
export const START_ID = 'scene1';

/** @type {Record<string, object>} */
const NODES = {
  scene1: {
    id: 'scene1',
    background: 'images/bg.jpg',
    portrait: '',
    text: '凌晨两点，写字楼只剩你屏幕上的光标。试用版「AI 编剧」提示：上传大纲即可续写结局。',
    choices: [
      { label: '上传未完成剧本', next: 'scene2' },
      { label: '关掉窗口自己写', next: 'scene2' },
    ],
  },
  scene2: {
    id: 'scene2',
    background: 'images/bg.jpg',
    portrait: '',
    text: 'AI 秒回三版结局。客户消息弹窗：「要爽点，要反转，今晚就要。」',
    choices: [
      { label: '用 AI 爽点版', next: 'scene3' },
      { label: '保留原意慢改', next: 'scene3' },
    ],
  },
  scene3: {
    id: 'scene3',
    background: 'images/bg.jpg',
    portrait: '',
    text: '成片渲染进度 99%。署名栏闪烁：「联合创作 · AI 编剧」。发布键在等你。',
    choices: [
      { label: '发布并标注 AI 共创', next: 'ending_a' },
      { label: '只署自己名发布', next: 'ending_b' },
    ],
  },
  ending_a: {
    id: 'ending_a',
    background: 'images/bg.jpg',
    text:
      '雨夜霓虹下，你的短片上线。评论区有人说剧情「像被谁一夜写完」。你笑了——那一夜确实是。',
    choices: [],
    isEnding: true,
  },
  ending_b: {
    id: 'ending_b',
    background: 'images/bg.jpg',
    text:
      '数据不错，但团队收到合规提醒：试用 AI 未披露。凌晨的都市依旧闪亮，你的剧本却多了一道分叉。',
    choices: [],
    isEnding: true,
  },
};

/**
 * 按 id 取节点；缺失时返回 null。
 * @param {string} id
 * @returns {object|null}
 */
export function getNode(id) {
  if (!id || !NODES[id]) {
    return null;
  }
  return NODES[id];
}
```

- [ ] **Step 2: 保存后在微信工具编译**

Run: 微信开发者工具 → 编译（尚未改 main，飞机仍可跑 — 仅确认无语法错误可跳过，或继续 Task 4 后一起验）

Expected: 文件被工具识别，无单独报错（本 Task 尚未被 import）

---

### Task 2: 渲染模块 `renderer.js`

**Files:**
- Create: `js/renderer.js`
- Reuse: `js/render.js`（`SCREEN_WIDTH`, `SCREEN_HEIGHT`, 全局 `canvas`）

- [ ] **Step 1: 创建 `js/renderer.js`**

```javascript
/**
 * Canvas 绘制：标题页、剧情场景、结局页。
 * 图片加载失败时使用都市科幻风渐变背景。
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render';

const ctx = canvas.getContext('2d');

const TITLE = '一夜剧本';
const SUBTITLE = '都市科幻 · 互动微剧';
const AI_NOTE = '剧情由 AI 辅助编写';

/** 已加载图片缓存 */
const imageCache = {};

/** UI 常量 */
const DIALOG_H = Math.floor(SCREEN_HEIGHT * 0.28);
const BTN_H = 44;
const BTN_GAP = 12;
const PAD = 16;

/**
 * 预加载节点需要的背景图（失败则走渐变）。
 * @param {object|null} node
 */
export function preloadNodeImages(node) {
  if (!node || !node.background) {
    return;
  }
  loadImage(node.background);
}

/**
 * @param {string} src
 * @returns {HTMLImageElement|undefined}
 */
function loadImage(src) {
  if (imageCache[src]) {
    return imageCache[src];
  }
  const img = wx.createImage();
  img.src = src;
  imageCache[src] = img;
  return img;
}

/**
 * 绘制渐变背景（霓虹都市兜底）。
 */
function drawFallbackBg() {
  const g = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
  g.addColorStop(0, '#0f172a');
  g.addColorStop(0.5, '#1e1b4b');
  g.addColorStop(1, '#312e81');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

/**
 * @param {string} src
 */
function drawBackground(src) {
  const img = imageCache[src];
  if (img && img.width > 0) {
    ctx.drawImage(img, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    return;
  }
  drawFallbackBg();
}

/**
 * 自动换行绘制正文。
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {number} maxWidth
 * @param {number} lineHeight
 */
function drawWrappedText(text, x, y, maxWidth, lineHeight) {
  const chars = text.split('');
  let line = '';
  let drawY = y;
  for (let i = 0; i < chars.length; i += 1) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, drawY);
      line = chars[i];
      drawY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, drawY);
  }
}

/**
 * 绘制对话框区域。
 * @param {string} text
 */
function drawDialog(text) {
  const top = SCREEN_HEIGHT - DIALOG_H - BTN_H * 2 - BTN_GAP * 2 - PAD;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.fillRect(PAD, top, SCREEN_WIDTH - PAD * 2, DIALOG_H);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '16px sans-serif';
  drawWrappedText(text, PAD + 8, top + 24, SCREEN_WIDTH - PAD * 2 - 16, 22);
}

/**
 * 返回两个选项按钮的命中矩形（供 input 使用）。
 * @param {string[]} labels
 * @returns {{ x: number, y: number, w: number, h: number, index: number }[]}
 */
export function getChoiceButtonRects(labels) {
  const w = SCREEN_WIDTH - PAD * 2;
  const rects = [];
  let y = SCREEN_HEIGHT - PAD - BTN_H * labels.length - BTN_GAP * (labels.length - 1);
  labels.forEach((label, index) => {
    rects.push({ x: PAD, y, w, h: BTN_H, index, label });
    y += BTN_H + BTN_GAP;
  });
  return rects;
}

/**
 * 绘制选项按钮。
 * @param {string[]} labels
 */
function drawChoiceButtons(labels) {
  const rects = getChoiceButtonRects(labels);
  rects.forEach((r) => {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    const radius = 8;
    roundRect(r.x, r.y, r.w, r.h, radius);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '15px sans-serif';
    ctx.fillText(r.label, r.x + 12, r.y + 28);
  });
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r
 */
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * 绘制标题页；返回「开始」按钮矩形。
 * @returns {{ x: number, y: number, w: number, h: number }}
 */
export function drawTitleScreen() {
  drawFallbackBg();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(TITLE, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.32);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(SUBTITLE, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.32 + 36);
  ctx.font = '12px sans-serif';
  ctx.fillText(AI_NOTE, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.32 + 62);
  ctx.textAlign = 'left';

  const w = 200;
  const h = BTN_H;
  const x = (SCREEN_WIDTH - w) / 2;
  const y = SCREEN_HEIGHT * 0.55;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
  roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('开始', SCREEN_WIDTH / 2, y + 30);
  ctx.textAlign = 'left';
  return { x, y, w, h };
}

/**
 * 绘制剧情场景。
 * @param {object} node
 */
export function drawScene(node) {
  if (node.background) {
    loadImage(node.background);
    drawBackground(node.background);
  } else {
    drawFallbackBg();
  }
  drawDialog(node.text || '');
  const labels = (node.choices || []).map((c) => c.label);
  if (labels.length) {
    drawChoiceButtons(labels);
  }
}

/**
 * 绘制结局页；返回「再来一局」按钮矩形。
 * @param {object} node
 * @returns {{ x: number, y: number, w: number, h: number }}
 */
export function drawEndingScreen(node) {
  if (node.background) {
    loadImage(node.background);
    drawBackground(node.background);
  } else {
    drawFallbackBg();
  }
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(PAD, SCREEN_HEIGHT * 0.2, SCREEN_WIDTH - PAD * 2, SCREEN_HEIGHT * 0.45);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('— 结局 —', PAD + 8, SCREEN_HEIGHT * 0.2 + 32);
  ctx.font = '16px sans-serif';
  drawWrappedText(
    node.text || '',
    PAD + 8,
    SCREEN_HEIGHT * 0.2 + 56,
    SCREEN_WIDTH - PAD * 2 - 16,
    22,
  );

  const w = 200;
  const h = BTN_H;
  const x = (SCREEN_WIDTH - w) / 2;
  const y = SCREEN_HEIGHT * 0.72;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
  roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('再来一局', SCREEN_WIDTH / 2, y + 30);
  ctx.textAlign = 'left';
  return { x, y, w, h };
}
```

- [ ] **Step 2: 编译检查**

Run: 微信开发者工具 → 编译

Expected: 仍未引用则无变化；若已改 main 则应看到渐变 UI

---

### Task 3: 输入模块 `input.js`

**Files:**
- Create: `js/input.js`

- [ ] **Step 1: 创建 `js/input.js`**

```javascript
/**
 * 统一点击/触摸命中检测。
 */
let hitRegions = [];
let onTapCallback = null;

/**
 * 注册当前帧可点击区域与回调。
 * @param {{ x: number, y: number, w: number, h: number, index?: number }[]} regions
 * @param {(index: number) => void} callback index 为 -1 表示单按钮（开始/重来）
 */
export function setHitRegions(regions, callback) {
  hitRegions = regions || [];
  onTapCallback = callback;
}

/**
 * 判断点是否在矩形内。
 */
function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/**
 * 解析触摸/鼠标坐标并触发回调。
 * @param {TouchEvent|MouseEvent} ev
 */
function handlePointer(ev) {
  if (!onTapCallback || !hitRegions.length) {
    return;
  }
  const touch = ev.touches && ev.touches[0] ? ev.touches[0] : ev;
  const x = touch.clientX;
  const y = touch.clientY;
  for (let i = 0; i < hitRegions.length; i += 1) {
    const r = hitRegions[i];
    if (!pointInRect(x, y, r)) {
      continue;
    }
    const idx = typeof r.index === 'number' ? r.index : -1;
    onTapCallback(idx);
    return;
  }
}

let bound = false;

/**
 * 绑定 canvas 触摸（仅绑定一次）。
 */
export function bindInput() {
  if (bound) {
    return;
  }
  bound = true;
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handlePointer(e);
  });
  if (typeof wx.onTouchStart === 'function') {
    wx.onTouchStart((e) => {
      if (!e.touches || !e.touches[0]) {
        return;
      }
      const t = e.touches[0];
      handlePointer({ touches: [{ clientX: t.clientX, clientY: t.clientY }] });
    });
  }
}
```

- [ ] **Step 2: 保存文件**

Expected: 无语法错误

---

### Task 4: 主状态机 `main.js`（替换飞机逻辑）

**Files:**
- Modify: `js/main.js`（整文件替换）

- [ ] **Step 1: 用以下内容**完全替换** `js/main.js`**

```javascript
/**
 * 《一夜剧本》主入口：状态机 title → playing → ending。
 */
import './render';
import { START_ID, getNode } from './story';
import {
  drawTitleScreen,
  drawScene,
  drawEndingScreen,
  preloadNodeImages,
  getChoiceButtonRects,
} from './renderer';
import { setHitRegions, bindInput } from './input';

/** @typedef {'title'|'playing'|'ending'} GameState */

export default class Main {
  /** @type {GameState} */
  state = 'title';

  /** @type {string} */
  currentNodeId = START_ID;

  aniId = 0;

  constructor() {
    bindInput();
    this.loop();
  }

  /**
   * 进入标题页。
   */
  goTitle() {
    this.state = 'title';
    this.currentNodeId = START_ID;
    this.syncInput();
  }

  /**
   * 从节点 id 开始剧情。
   * @param {string} nodeId
   */
  goNode(nodeId) {
    const node = getNode(nodeId);
    if (!node) {
      this.goTitle();
      return;
    }
    this.currentNodeId = nodeId;
    if (node.isEnding) {
      this.state = 'ending';
    } else {
      this.state = 'playing';
    }
    preloadNodeImages(node);
    this.syncInput();
  }

  /**
   * 处理选项：跳转 next 或结局。
   * @param {number} choiceIndex
   */
  onChoice(choiceIndex) {
    const node = getNode(this.currentNodeId);
    if (!node || !node.choices || !node.choices[choiceIndex]) {
      return;
    }
    const nextId = node.choices[choiceIndex].next;
    this.goNode(nextId);
  }

  /**
   * 根据 state 绘制并更新命中区域。
   */
  syncInput() {
    if (this.state === 'title') {
      const btn = drawTitleScreen();
      setHitRegions([btn], () => this.goNode(START_ID));
      return;
    }
    if (this.state === 'playing') {
      const node = getNode(this.currentNodeId);
      drawScene(node);
      const labels = (node.choices || []).map((c) => c.label);
      const rects = getChoiceButtonRects(labels);
      setHitRegions(rects, (idx) => this.onChoice(idx));
      return;
    }
    if (this.state === 'ending') {
      const node = getNode(this.currentNodeId);
      const btn = drawEndingScreen(node);
      setHitRegions([btn], () => this.goTitle());
    }
  }

  /**
   * 每帧重绘（剧情无物理，全量重绘即可）。
   */
  loop() {
    this.syncInput();
    this.aniId = requestAnimationFrame(() => this.loop());
  }
}
```

- [ ] **Step 2: 确认 `game.js` 仍为**

```javascript
import Main from './js/main';

new Main();
```

- [ ] **Step 3: 微信开发者工具编译并试玩**

Run: 编译 → 点击「开始」→ 完成 3 次选择 → 看到结局 →「再来一局」回标题

Expected: **不再出现飞机**；霓虹渐变或 `images/bg.jpg` 背景；Console 无红色 SyntaxError

- [ ] **Step 4: （可选）git commit**

```bash
git init
git add js/story.js js/renderer.js js/input.js js/main.js
git commit -m "feat: replace plane demo with Yi Ye Ju Ben visual novel"
```

（若用户未要求 init 可跳过）

---

### Task 5: 替换 AI 美术资源（明晚）

**Files:**
- Add/replace: `images/bg_title.png`, `images/bg_office.png`, `images/bg_city.png`, `images/char.png`（可选）
- Modify: `js/story.js` 中 `background` 路径指向新文件

- [ ] **Step 1: 用 AIGC 生成图并放入 `images/`**

提示词示例（写入 `docs/aigc-pipeline.md`）：

- 背景：`cyberpunk Shanghai office at rainy night, neon blue light, vertical mobile game background, no text`
- 立绘：`young creator at desk, half body, transparent background style, anime cinematic`

- [ ] **Step 2: 更新 `story.js` 各节点 `background` 字段**

```javascript
// 示例
background: 'images/bg_office.png',
```

- [ ] **Step 3: 编译预览**

Expected: 场景显示新图；加载失败仍 fallback 渐变

---

### Task 6: 面试文档 README + AIGC 管线

**Files:**
- Modify: `README.md`
- Create: `docs/aigc-pipeline.md`

- [ ] **Step 1: 重写 `README.md` 核心章节**

必须包含：

1. 项目名称《一夜剧本》与一句话介绍  
2. 微信开发者工具打开目录、`AppID`、点击预览  
3. 目录结构（`js/story.js` 等）  
4. AIGC 管线 4 步示意图（文字列表即可）  
5. 截图占位说明：`docs/screenshots/`（用户自行粘贴生成图）

- [ ] **Step 2: 创建 `docs/aigc-pipeline.md`**

包含：

- 剧本提示词全文（可基于 spec 都市科幻设定）  
- 配图提示词  
- 「未使用 ComfyUI，规划下一步批量三视图」一句（诚实）  

- [ ] **Step 3: 录屏 60 秒**

内容：启动 → 玩到结局 A 或 B → 可选展示 README

---

## Spec Coverage（自检）

| Spec 需求 | Plan Task |
|-----------|-----------|
| 3 抉择 + 2 结局 | Task 1 `scene1-3`, `ending_a/b` |
| 状态机 title/playing/ending | Task 4 |
| 无 API/云开发 | 全 plan 无后端 |
| AI 辅助编写标注 | Task 2 `drawTitleScreen` |
| 图片失败渐变兜底 | Task 2 `drawFallbackBg` |
| story 集中数据 | Task 1 |
| README + AIGC 文档 | Task 6 |
| code-architect 注释/扁平 | 各文件头 Docstring + 卫语句 `goNode` |
| 两晚：今晚跑通 | Task 1–4；明晚素材+文档 | Task 5–6 |

**Gap:** 音效、ComfyUI、实时 API — spec 明确不做，无 task。

**Placeholder scan:** 无 TBD；Task 5 提示词为完整句子。

---

## 实现后 code-architect 检查清单

- [ ] `story.js` 无渲染逻辑  
- [ ] `main.js` 单文件 &lt; 300 行  
- [ ] 无 API Key / 无拼接外链脚本  
- [ ] 函数嵌套 ≤ 3 层，复杂分支已提前 return  

---
