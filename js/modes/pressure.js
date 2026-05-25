/**
 * 压力倒计时：固定在 HUD 区，不挤占居中栈。
 */
import { SCREEN_WIDTH } from '../render';
import { COLORS, FONT } from '../theme';
import { CHROME_HEIGHT } from '../layers/chrome';

let remainingSec = 0;
let totalSec = 0;
let active = false;
let onTimeoutCb = null;

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
 * HUD 内倒计时（居中栈上方固定带）。
 */
export function drawPressureBar(ctx, label) {
  if (!active && remainingSec <= 0) {
    return;
  }
  const y = CHROME_HEIGHT + 2;
  const w = SCREEN_WIDTH - 48;
  const x = 24;
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.012);

  ctx.fillStyle = 'rgba(230, 57, 70, 0.15)';
  roundRect(ctx, x, y, w, 8, 4);
  ctx.fill();

  const ratio = totalSec > 0 ? remainingSec / totalSec : 0;
  ctx.fillStyle = COLORS.hr;
  roundRect(ctx, x, y, w * Math.min(1, ratio), 8, 4);
  ctx.fill();

  ctx.font = FONT.mono;
  ctx.fillStyle = `rgba(230, 57, 70, ${0.7 + pulse * 0.3})`;
  ctx.textAlign = 'center';
  ctx.fillText(`${label || '倒计时'} ${Math.ceil(remainingSec)}s`, SCREEN_WIDTH / 2, y + 22);
  ctx.textAlign = 'left';
}

function roundRect(ctx, x, y, w, h, r) {
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
