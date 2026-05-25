/**
 * L2 官僚霓虹顶栏：安全区 + 工牌 + 幕进度（避开刘海/状态栏）。
 */
import { SCREEN_WIDTH } from '../render';
import { COLORS, FONT } from '../theme';

/** 状态栏/刘海下移量 */
export const SAFE_TOP = 44;

const BAR_H = 40;
const PROGRESS_ROW = 24;

/** 工牌条底边 */
export const CHROME_HEIGHT = SAFE_TOP + BAR_H;

/** 含幕进度点的整块 HUD 高度 */
export const HUD_HEIGHT = CHROME_HEIGHT + PROGRESS_ROW;

/**
 * 从节点 id 解析幕序号。
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
 * 顶栏 chrome（含安全区背景）。
 */
export function drawTopChrome(ctx, opts) {
  const stress = opts.stress ?? 0;
  const timeline = opts.timeline || 'now';
  const actIdx = parseActIndex(opts.actId);
  const textY = SAFE_TOP + 24;

  ctx.fillStyle = 'rgba(6, 8, 15, 0.94)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, HUD_HEIGHT);

  ctx.font = FONT.mono;
  ctx.fillStyle = COLORS.badge;
  ctx.textAlign = 'left';
  ctx.fillText('工号 ·••427', 16, textY);

  const barX = 112;
  const barW = SCREEN_WIDTH - 208;
  const barY = SAFE_TOP + 12;
  ctx.fillStyle = 'rgba(139, 156, 179, 0.25)';
  ctx.fillRect(barX, barY, barW, 8);
  ctx.fillStyle = stress > 70 ? COLORS.hr : COLORS.cyan;
  ctx.fillRect(barX, barY, barW * Math.min(1, stress / 100), 8);

  const dotColor = timeline === 'past' ? COLORS.amber : COLORS.cyan;
  ctx.beginPath();
  ctx.arc(SCREEN_WIDTH - 56, textY - 4, 5, 0, Math.PI * 2);
  ctx.fillStyle = dotColor;
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText(actIdx > 0 ? `幕 ${actIdx}/10` : '', SCREEN_WIDTH - 68, textY);
  ctx.textAlign = 'left';
}

/**
 * 幕进度点（在工牌条下方）。
 */
export function drawHudProgress(ctx, progress) {
  const y = CHROME_HEIGHT + 14;
  const startX = SCREEN_WIDTH / 2 - 45;
  for (let i = 1; i <= 10; i += 1) {
    const cx = startX + (i - 1) * 10;
    ctx.beginPath();
    ctx.arc(cx, y, i <= progress ? 3.5 : 2.5, 0, Math.PI * 2);
    if (i <= progress) {
      ctx.fillStyle = i === progress ? COLORS.cyan : 'rgba(0, 245, 212, 0.28)';
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(139, 156, 179, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}
