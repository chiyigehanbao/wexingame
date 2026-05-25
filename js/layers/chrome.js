/**
 * L2 顶栏：轻薄 HUD，避免大块黑幕；幕进度仅用「幕 n/10」文字。
 */
import { SCREEN_WIDTH } from '../render';
import { COLORS, FONT } from '../theme';

/** 状态栏/刘海安全区 */
export const SAFE_TOP = 28;

const BAR_H = 32;

/** 工牌行底边（其下可接交付倒计时条） */
export const CHROME_HEIGHT = SAFE_TOP + BAR_H;

/** 工牌行下方留白（无倒计时时） */
const GAP_BELOW = 8;

/** 无压力条时，正文区起始参考高度 */
export const HUD_HEIGHT = CHROME_HEIGHT + GAP_BELOW;

/**
 * 正文区顶部 Y（含可选倒计时条高度）。
 * @param {number} pressureBand 由 pressure.getBandHeight() 传入
 */
export function getContentTop(pressureBand = 0) {
  return CHROME_HEIGHT + GAP_BELOW + pressureBand;
}

function parseActIndex(actId) {
  if (!actId) {
    return 0;
  }
  const m = actId.match(/act(\d+)/);
  if (m) {
    return parseInt(m[1], 10);
  }
  if (actId.startsWith('ending')) {
    return 10;
  }
  return 0;
}

/**
 * 顶栏：渐变底，不铺满整块黑幕。
 */
export function drawTopChrome(ctx, opts) {
  const stress = opts.stress ?? 0;
  const timeline = opts.timeline || 'now';
  const actIdx = parseActIndex(opts.actId);
  const textY = SAFE_TOP + 22;
  const fadeH = CHROME_HEIGHT + 12;

  const g = ctx.createLinearGradient(0, 0, 0, fadeH);
  g.addColorStop(0, 'rgba(6, 8, 15, 0.82)');
  g.addColorStop(0.65, 'rgba(6, 8, 15, 0.45)');
  g.addColorStop(1, 'rgba(6, 8, 15, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCREEN_WIDTH, fadeH);

  ctx.font = FONT.mono;
  ctx.fillStyle = COLORS.badge;
  ctx.textAlign = 'left';
  ctx.fillText('工号 ·••427', 16, textY);

  const barX = 108;
  const barW = SCREEN_WIDTH - 200;
  const barY = SAFE_TOP + 10;
  ctx.fillStyle = 'rgba(139, 156, 179, 0.22)';
  ctx.fillRect(barX, barY, barW, 6);
  ctx.fillStyle = stress > 70 ? COLORS.hr : COLORS.cyan;
  ctx.fillRect(barX, barY, barW * Math.min(1, stress / 100), 6);

  const dotColor = timeline === 'past' ? COLORS.amber : COLORS.cyan;
  ctx.beginPath();
  ctx.arc(SCREEN_WIDTH - 20, textY - 4, 4, 0, Math.PI * 2);
  ctx.fillStyle = dotColor;
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText(actIdx > 0 ? `幕 ${actIdx}/10` : '', SCREEN_WIDTH - 32, textY);
  ctx.textAlign = 'left';
}

/** 保留 API，幕进度已合并进「幕 n/10」 */
export function drawHudProgress(_ctx, _progress) {
  /* 不再单独画十格点，避免与倒计时条抢高度 */
}
