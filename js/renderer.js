/**
 * Canvas 组合渲染：L0 氛围 + HUD + 居中场景栈。
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render';
import { COLORS, FONT, LAYOUT } from './theme';
import { drawBackdrop, titlePulse } from './atmosphere';
import { drawTopChrome } from './layers/chrome';
import {
  drawHudProgress,
  drawCenteredScene,
  drawCenteredBlock,
  triggerSceneEnter,
} from './layers/sceneLayout';
import { drawStickyChoice } from './layers/paper';
import { getActProgress } from './story';
import { getModeHandler } from './modes/registry';
import { getStats } from './gameState';
import { setAnimTick as setClockTick, getAnimTick } from './animClock';

export { getAnimTick };

export function setAnimTick(tick) {
  setClockTick(tick);
}

const ctx = canvas.getContext('2d');

const TITLE = '一夜剧本';
const SUBTITLE = '都市科幻 · 互动微剧';
const TAGLINE = '每一夜，都是一次不可撤回的发布';

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

/**
 * 标题页：单一居中块 + 仅「开始」按钮。
 */
export function drawTitleScreen() {
  drawBackdrop(getAnimTick(), 'now');
  triggerSceneEnter('title');
  const pulse = titlePulse(getAnimTick());

  ctx.save();
  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 14 * pulse;

  const regions = drawCenteredBlock(ctx, {
    lines: [
      { text: TITLE, font: FONT.title, color: COLORS.text, h: 42 },
      { text: SUBTITLE, font: '17px sans-serif', color: COLORS.cyan, h: 30 },
      {
        text: TAGLINE,
        font: FONT.bodySmall,
        color: COLORS.textMuted,
        wrap: SCREEN_WIDTH - 56,
        h: 52,
      },
      {
        text: '约 15 分钟 · 蒙太奇 · 多结局',
        font: FONT.bodySmall,
        color: COLORS.textMuted,
        h: 24,
      },
    ],
    buttons: [{ text: '开始这一夜', index: 0, w: 260 }],
    accent: COLORS.cyan,
  });

  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
  ctx.restore();
  return { regions };
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
  const regions = drawCenteredScene(
    ctx,
    {
      chapter: node.chapter || '结局',
      title: node.title || '',
      timeline: 'now',
      text: paper,
    },
    {
      paperText: paper,
      animTick: getAnimTick(),
      choiceLabels: ['再来一局'],
    },
  );
  return regions[0] || { x: 0, y: 0, w: 0, h: 0, index: 0 };
}
