/**
 * Canvas 组合渲染：L0 氛围 + L2 chrome + L3 mode + 标题/结局壳。
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render';
import { COLORS, FONT, LAYOUT } from './theme';
import { drawBackdrop, titlePulse } from './atmosphere';
import { drawTopChrome, CHROME_HEIGHT } from './layers/chrome';
import { drawPaperPanel, drawWrappedText, roundRectPath } from './layers/paper';
import { getActProgress } from './story';
import { getModeHandler } from './modes/registry';
import { getStats, loadChapterLog } from './gameState';

const ctx = canvas.getContext('2d');

const TITLE = '一夜剧本';
const SUBTITLE = '都市科幻 · 互动微剧';
const TAGLINE = '每一夜，都是一次不可撤回的发布';

let animTick = 0;
const imageCache = {};

export function setAnimTick(tick) {
  animTick = tick;
}

export function preloadNodeImages(node) {
  if (!node || !node.background) {
    return;
  }
  const img = wx.createImage();
  img.src = node.background;
  imageCache[node.background] = img;
}

function drawBgLayer(node) {
  const timeline = node?.timeline || 'now';
  if (node && node.background && imageCache[node.background]?.width > 0) {
    ctx.drawImage(imageCache[node.background], 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = 'rgba(4, 6, 12, 0.55)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    drawBackdrop(animTick, timeline);
  }
}

function drawProgressDots(progress) {
  const dotY = CHROME_HEIGHT + 28;
  const startX = SCREEN_WIDTH / 2 - 45;
  for (let i = 1; i <= 10; i += 1) {
    const cx = startX + (i - 1) * 10;
    ctx.beginPath();
    ctx.arc(cx, dotY, i <= progress ? 3 : 2, 0, Math.PI * 2);
    if (i <= progress) {
      ctx.fillStyle = i === progress ? COLORS.cyan : 'rgba(0, 245, 212, 0.3)';
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(139, 156, 179, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function drawPrimaryButton(text, x, y, w, h) {
  const pulse = titlePulse(animTick);
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 8 * pulse;
  ctx.fillStyle = 'rgba(0, 245, 212, 0.12)';
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 2;
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.stroke();
  ctx.font = 'bold 17px sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + h / 2 + 6);
  ctx.textAlign = 'left';
}

/**
 * 标题页命中区：开始 + 可选重温。
 * @returns {{ regions: object[], hasLog: boolean }}
 */
export function drawTitleScreen() {
  drawBackdrop(animTick, 'now');
  const log = loadChapterLog();
  const hasLog = log.length > 0;

  const blockH = hasLog ? 240 : 200;
  const blockTop = (SCREEN_HEIGHT - blockH) / 2 - 24;
  const cx = SCREEN_WIDTH / 2;
  const pulse = titlePulse(animTick);

  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 20 * pulse;
  ctx.font = FONT.title;
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.fillText(TITLE, cx, blockTop);
  ctx.shadowBlur = 0;

  ctx.font = '16px sans-serif';
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText(SUBTITLE, cx, blockTop + 40);

  ctx.font = FONT.bodySmall;
  const tagW = SCREEN_WIDTH - 40;
  drawWrappedText(ctx, TAGLINE, cx - tagW / 2, blockTop + 64, tagW, 20, COLORS.textMuted, FONT.bodySmall);
  ctx.fillText('约 15 分钟 · 蒙太奇 · 多结局', cx, blockTop + 110);

  const w = 220;
  const h = LAYOUT.btnH;
  const x = (SCREEN_WIDTH - w) / 2;
  const yStart = blockTop + 138;
  drawPrimaryButton('开始这一夜', x, yStart, w, h);

  const regions = [{ x, y: yStart, w, h, index: 0 }];
  if (hasLog) {
    const yLog = yStart + h + 12;
    drawPrimaryButton('重温章节日志', x, yLog, w, h);
    regions.push({ x, y: yLog, w, h, index: 1 });
  }
  ctx.textAlign = 'left';
  return { regions, hasLog };
}

/**
 * 章节日志屏。
 */
export function drawChapterLogScreen() {
  drawBackdrop(animTick, 'now');
  const log = loadChapterLog().slice(-8);
  const pad = LAYOUT.pad;
  const panelTop = CHROME_HEIGHT + 40;
  const panelH = SCREEN_HEIGHT - panelTop - 100;
  drawPaperPanel(ctx, pad, panelTop, SCREEN_WIDTH - pad * 2, panelH);

  ctx.font = FONT.sceneTitle;
  ctx.fillStyle = COLORS.paperInk;
  ctx.fillText('章节日志', pad + 16, panelTop + 28);

  let y = panelTop + 52;
  log.forEach((entry) => {
    ctx.font = FONT.bodySmall;
    ctx.fillStyle = COLORS.paperMuted;
    const line = `${entry.timeline === 'past' ? '三年前' : '今夜'} · ${entry.title}`;
    ctx.fillText(line, pad + 16, y);
    y += 22;
  });

  const w = 200;
  const h = LAYOUT.btnH;
  const bx = (SCREEN_WIDTH - w) / 2;
  const by = SCREEN_HEIGHT - 80;
  drawPrimaryButton('返回', bx, by, w, h);
  return { x: bx, y: by, w, h, index: 0 };
}

/**
 * 绘制当前剧情节点（mode 分发）。
 * @returns {object[]} 命中区域
 */
/**
 * @param {object} node
 * @param {{ goNext: (id: string) => void }} [hooks]
 */
export function drawPlaying(node, hooks) {
  drawBgLayer(node);
  const stats = getStats();
  drawTopChrome(ctx, {
    stress: stats.stress,
    timeline: node.timeline,
    actId: node.id,
  });
  drawProgressDots(getActProgress(node.id));
  const handler = getModeHandler(node.mode);
  return handler.render(ctx, node, hooks);
}

export function drawEndingScreen(node) {
  drawBgLayer(node);
  const stats = getStats();
  drawTopChrome(ctx, { stress: stats.stress, timeline: 'now', actId: 'ending' });

  const contentW = SCREEN_WIDTH - LAYOUT.pad * 2;
  const innerW = contentW - 32;
  const accent = node.endingStyle === 'hope' ? COLORS.cyan : COLORS.amber;
  const panelTop = 120;
  const panelH = SCREEN_HEIGHT - panelTop - 120;

  drawPaperPanel(ctx, LAYOUT.pad, panelTop, contentW, panelH);

  ctx.font = FONT.chapter;
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.fillText(node.chapter || '结局', SCREEN_WIDTH / 2, panelTop - 12);

  ctx.textAlign = 'left';
  drawWrappedText(
    ctx,
    node.title || '',
    LAYOUT.pad + 16,
    panelTop + 20,
    innerW,
    24,
    COLORS.paperInk,
    FONT.sceneTitle,
  );
  drawWrappedText(
    ctx,
    node.text || '',
    LAYOUT.pad + 16,
    panelTop + 56,
    innerW,
    21,
    COLORS.paperMuted,
    FONT.body,
  );

  ctx.font = FONT.mono;
  ctx.fillStyle = COLORS.badge;
  const summary = `诚意${stats.sincerityNow} · 过去${stats.sincerityPast} · AI${stats.aiDepend}`;
  ctx.fillText(summary, LAYOUT.pad + 16, panelTop + panelH - 24);

  const w = 220;
  const h = LAYOUT.btnH;
  const x = (SCREEN_WIDTH - w) / 2;
  const y = SCREEN_HEIGHT - 72;
  drawPrimaryButton('再来一局', x, y, w, h);
  return { x, y, w, h, index: 0 };
}
