/**
 * 交付/答辩倒计时：贴在工牌行下方独立一条，不与工牌重叠。
 */
import { SCREEN_WIDTH } from '../render';
import { COLORS, FONT } from '../theme';
import { CHROME_HEIGHT } from '../layers/chrome';

let remainingSec = 0;
let totalSec = 0;
let active = false;
let onTimeoutCb = null;

const BAND_H = 26;

export function startCountdown(sec, onTimeout) {
  totalSec = sec;
  remainingSec = sec;
  active = true;
  onTimeoutCb = onTimeout;
}

export function stopCountdown() {
  active = false;
  onTimeoutCb = null;
}

export function isActive() {
  return active;
}

/**
 * 为正文区顶边让出的高度。
 */
export function getBandHeight() {
  return active ? BAND_H : 0;
}

export function tick(dtSec) {
  if (!active) {
    return;
  }
  remainingSec -= dtSec;
  if (remainingSec <= 0) {
    remainingSec = 0;
    active = false;
    if (onTimeoutCb) {
      onTimeoutCb();
      onTimeoutCb = null;
    }
  }
}

export function getRemainingSec() {
  return Math.max(0, remainingSec);
}

/**
 * 绘制在工牌行正下方（CHROME_HEIGHT 起）。
 */
export function drawPressureBar(ctx, label) {
  if (!active && remainingSec <= 0) {
    return;
  }

  const y = CHROME_HEIGHT + 4;
  const x = 16;
  const w = SCREEN_WIDTH - 32;
  const barH = 6;

  ctx.fillStyle = 'rgba(6, 8, 15, 0.55)';
  ctx.fillRect(0, y - 2, SCREEN_WIDTH, BAND_H);

  ctx.fillStyle = 'rgba(230, 57, 70, 0.2)';
  roundRect(ctx, x, y, w, barH, 3);
  ctx.fill();

  const ratio = totalSec > 0 ? remainingSec / totalSec : 0;
  ctx.fillStyle = COLORS.hr;
  roundRect(ctx, x, y, w * Math.min(1, ratio), barH, 3);
  ctx.fill();

  ctx.font = FONT.mono;
  ctx.fillStyle = COLORS.hr;
  ctx.textAlign = 'left';
  ctx.fillText(`${label || '倒计时'}`, x, y + barH + 14);
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(remainingSec)}s`, SCREEN_WIDTH - 16, y + barH + 14);
  ctx.textAlign = 'left';
}

function roundRect(ctx, rx, ry, rw, rh, r) {
  ctx.beginPath();
  ctx.moveTo(rx + r, ry);
  ctx.lineTo(rx + rw - r, ry);
  ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
  ctx.lineTo(rx + rw, ry + rh - r);
  ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
  ctx.lineTo(rx + r, ry + rh);
  ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
  ctx.lineTo(rx, ry + r);
  ctx.quadraticCurveTo(rx, ry, rx + r, ry);
  ctx.closePath();
}
