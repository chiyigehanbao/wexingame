/**
 * Canvas 组合渲染：L0 氛围 + HUD + 居中场景栈。
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render';
import { COLORS, FONT, LAYOUT } from './theme';
import { drawBackdrop, titlePulse } from './atmosphere';
import { drawTopChrome, CHROME_HEIGHT } from './layers/chrome';
import {
  drawHudProgress,
  drawCenteredScene,
  drawCenteredBlock,
  triggerSceneEnter,
} from './layers/sceneLayout';
import { drawStickyChoice, drawWrappedText } from './layers/paper';
import { getActProgress } from './story';
import { getModeHandler } from './modes/registry';
import { getStats, loadChapterLog } from './gameState';

const ctx = canvas.getContext('2d');

const TITLE = '一夜剧本';
const SUBTITLE = '都市科幻 · 互动微剧';
const TAGLINE = '每一夜，都是一次不可撤回的发布';

import { setAnimTick as setClockTick, getAnimTick } from './animClock';

export { getAnimTick };

export function setAnimTick(tick) {
  setClockTick(tick);
}

const imageCache = {};

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
    drawBackdrop(getAnimTick(), timeline);
  }
}

export function drawTitleScreen() {
  drawBackdrop(getAnimTick(), 'now');
  triggerSceneEnter('title');
  const log = loadChapterLog();
  const hasLog = log.length > 0;
  const pulse = titlePulse(getAnimTick());

  const lines = [
    {
      text: TITLE,
      font: FONT.title,
      color: COLORS.text,
      h: 38,
      glow: pulse,
    },
    { text: SUBTITLE, font: '17px sans-serif', color: COLORS.cyan, h: 28 },
    {
      text: TAGLINE,
      font: FONT.bodySmall,
      color: COLORS.textMuted,
      wrap: SCREEN_WIDTH - 48,
      lines: 2,
      h: 44,
    },
    { text: '约 15 分钟 · 蒙太奇 · 多结局', font: FONT.bodySmall, color: COLORS.textMuted, h: 22 },
  ];

  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 18 * pulse;
  ctx.font = FONT.title;
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  const area = { centerY: SCREEN_HEIGHT / 2 };
  const blockTop = area.centerY - 120;
  ctx.fillText(TITLE, SCREEN_WIDTH / 2, blockTop);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.cyan;
  ctx.font = '17px sans-serif';
  ctx.fillText(SUBTITLE, SCREEN_WIDTH / 2, blockTop + 42);
  drawWrappedText(ctx, TAGLINE, 24, blockTop + 68, SCREEN_WIDTH - 48, 22, COLORS.textMuted, FONT.bodySmall);
  ctx.fillText('约 15 分钟 · 蒙太奇 · 多结局', SCREEN_WIDTH / 2, blockTop + 118);

  const buttons = [{ text: '开始这一夜', index: 0 }];
  if (hasLog) {
    buttons.push({ text: '重温章节目志', index: 1 });
  }

  const w = 240;
  const h = LAYOUT.btnH;
  const x = (SCREEN_WIDTH - w) / 2;
  let y = blockTop + 148;
  const regions = [];
  buttons.forEach((btn) => {
    drawStickyChoice(ctx, { x, y, w, h }, btn.text, btn.index === 0, getAnimTick(), 0);
    regions.push({ x, y, w, h, index: btn.index });
    y += h + LAYOUT.btnGap;
  });
  ctx.textAlign = 'left';
  return { regions, hasLog };
}

export function drawChapterLogScreen() {
  drawBackdrop(getAnimTick(), 'now');
  const log = loadChapterLog().slice(-8);
  const body = log.map((e) => `${e.timeline === 'past' ? '三年前' : '今夜'} · ${e.title}`).join('\n');
  const regions = drawCenteredBlock(ctx, {
    lines: [
      { text: '章节日志', font: FONT.sceneTitle, color: COLORS.text, h: 32 },
      { text: body || '（暂无记录）', font: FONT.body, color: COLORS.textMuted, wrap: SCREEN_WIDTH - 56, lines: Math.max(3, log.length), h: 80 },
    ],
    buttons: [{ text: '返回', index: 0 }],
    accent: COLORS.cyan,
  });
  return regions[0] || { x: 0, y: 0, w: 0, h: 0, index: 0 };
}

export function drawPlaying(node, hooks) {
  drawBgLayer(node);
  const stats = getStats();
  drawTopChrome(ctx, {
    stress: stats.stress,
    timeline: node.timeline,
    actId: node.id,
  });
  drawHudProgress(ctx, getActProgress(node.id));
  const handler = getModeHandler(node.mode);
  return handler.render(ctx, node, hooks);
}

export function drawEndingScreen(node) {
  drawBgLayer(node);
  const stats = getStats();
  drawTopChrome(ctx, { stress: stats.stress, timeline: 'now', actId: 'ending' });
  drawHudProgress(ctx, 10);
  triggerSceneEnter(node.id);

  const summary = `诚意 ${stats.sincerityNow} · 过去 ${stats.sincerityPast} · AI ${stats.aiDepend}`;
  const paper = `${node.text || ''}\n\n— ${summary}`;
  const regions = drawCenteredScene(ctx, {
    chapter: node.chapter || '结局',
    title: node.title || '',
    timeline: 'now',
    text: paper,
  }, {
    paperText: paper,
    animTick: getAnimTick(),
    choiceLabels: ['再来一局'],
  });
  return regions[0] || { x: 0, y: 0, w: 0, h: 0, index: 0 };
}
