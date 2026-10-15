/**
 * 官级金字塔：下宽上窄，皇帝在塔尖。
 */
import { RANKS } from '../game/ranks.js';
import { COLORS, font } from './theme.js';
import { roundRect } from './widgets.js';

const ROW_H = 30;
const GAP = 6;

export function pyramidHeight() {
  return RANKS.length * ROW_H + (RANKS.length - 1) * GAP + 10;
}

/**
 * 朝廷页官级塔的底边超出屏幕时，要能往下看。
 * 条位和 court.js 里的朝报、官级对齐。
 */
export function courtScrollMax({ safeTop, height, newsCount, pad = 16 }) {
  const n = Math.max(0, Math.min(3, Number.isFinite(newsCount) ? newsCount : 0));
  let ny = safeTop + 318;
  ny += n ? 28 + n * 20 : 48;
  const bottom = ny + 28 + pyramidHeight();
  return Math.max(0, bottom + pad - height);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} top
 * @param {number} maxW 最底层宽度
 * @param {{ current?: number|null }} [opts] current 为现任下标；不传则只作图示，塔尖用朱印
 */
export function drawRankPyramid(ctx, cx, top, maxW, opts = {}) {
  const n = RANKS.length;
  const minW = Math.min(108, maxW * 0.42);
  const widthAt = (i) => minW + ((maxW - minW) * i) / (n - 1);
  const base = widthAt(n - 1);
  const total = pyramidHeight();

  ctx.beginPath();
  ctx.moveTo(cx, top + 4);
  ctx.lineTo(cx + base / 2 + 14, top + total - 2);
  ctx.lineTo(cx - base / 2 - 14, top + total - 2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(179, 52, 43, 0.07)';
  ctx.fill();

  for (let i = 0; i < n; i += 1) {
    const rankIndex = n - 1 - i;
    const name = RANKS[rankIndex];
    const w = widthAt(i);
    const x = cx - w / 2;
    const y = top + i * (ROW_H + GAP);
    const hasCurrent = Number.isInteger(opts.current);
    const here = hasCurrent && rankIndex === opts.current;
    const reached = !hasCurrent || rankIndex <= opts.current;
    const apex = !hasCurrent && i === 0;

    ctx.fillStyle = here || apex ? COLORS.red : 'rgba(255, 251, 244, 0.98)';
    roundRect(ctx, x, y, w, ROW_H, 5);
    ctx.fill();
    if (!here && !apex) {
      ctx.strokeStyle = reached ? 'rgba(43, 38, 34, 0.55)' : 'rgba(43, 38, 34, 0.18)';
      ctx.lineWidth = here ? 0 : 1.15;
      ctx.stroke();
    }
    ctx.font = font(name.length > 2 ? 14 : 15, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = here || apex ? COLORS.card : (reached ? COLORS.ink : COLORS.muted);
    ctx.fillText(name, cx, y + ROW_H / 2 + 1);
    if (here && w >= 150) {
      ctx.font = font(11);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(251, 246, 234, 0.85)';
      ctx.fillText('现任', x + w - 10, y + ROW_H / 2 + 1);
    }
  }

  ctx.fillStyle = 'rgba(43, 38, 34, 0.28)';
  roundRect(ctx, cx - base / 2 - 8, top + total - 6, base + 16, 4, 2);
  ctx.fill();
  return total;
}
