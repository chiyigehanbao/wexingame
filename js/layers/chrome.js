/**
 * L2 官僚霓虹顶栏：工牌、压力、时间线指示、幕进度。
 */
import { SCREEN_WIDTH } from '../render';
import { COLORS, FONT } from '../theme';

const BAR_H = 36;

/**
 * 从节点 id 解析幕序号。
 * @param {string} actId
 */
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
 * 顶栏 chrome。
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ stress: number, timeline: string, actId: string }} opts
 */
export function drawTopChrome(ctx, opts) {
  const stress = opts.stress ?? 0;
  const timeline = opts.timeline || 'now';
  const actIdx = parseActIndex(opts.actId);

  ctx.fillStyle = 'rgba(6, 8, 15, 0.85)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, BAR_H);

  ctx.font = FONT.mono;
  ctx.fillStyle = COLORS.badge;
  ctx.textAlign = 'left';
  ctx.fillText('工号 ·••427', 12, 22);

  const barX = 108;
  const barW = SCREEN_WIDTH - 200;
  ctx.fillStyle = 'rgba(139, 156, 179, 0.25)';
  ctx.fillRect(barX, 14, barW, 8);
  ctx.fillStyle = stress > 70 ? COLORS.hr : COLORS.cyan;
  ctx.fillRect(barX, 14, barW * Math.min(1, stress / 100), 8);

  const dotColor = timeline === 'past' ? COLORS.amber : COLORS.cyan;
  ctx.beginPath();
  ctx.arc(SCREEN_WIDTH - 52, 18, 5, 0, Math.PI * 2);
  ctx.fillStyle = dotColor;
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText(actIdx > 0 ? `幕 ${actIdx}/10` : '', SCREEN_WIDTH - 64, 22);
  ctx.textAlign = 'left';
}

export const CHROME_HEIGHT = BAR_H;
