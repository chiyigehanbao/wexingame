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
 * @returns {{ x: number, y: number, w: number, h: number, index: number, label: string }[]}
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
