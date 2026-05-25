/**
 * 压力倒计时：顶栏下方细条 + 剩余秒数。
 */
import { SCREEN_WIDTH } from '../render';
import { COLORS, FONT } from '../theme';
import { CHROME_HEIGHT } from '../layers/chrome';

let remainingSec = 0;
let totalSec = 0;
let active = false;
let onTimeoutCb = null;

/**
 * 启动倒计时。
 * @param {number} sec
 * @param {() => void} onTimeout
 */
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
 * 每帧扣减（约 60fps 按 1/60 秒）。
 * @param {number} dtSec
 */
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
 * 绘制答辩倒计时条。
 */
export function drawPressureBar(ctx, label) {
  if (!active && remainingSec <= 0) {
    return;
  }
  const y = CHROME_HEIGHT + 4;
  const w = SCREEN_WIDTH - 24;
  const x = 12;
  ctx.fillStyle = 'rgba(230, 57, 70, 0.2)';
  ctx.fillRect(x, y, w, 6);
  const ratio = totalSec > 0 ? remainingSec / totalSec : 0;
  ctx.fillStyle = COLORS.hr;
  ctx.fillRect(x, y, w * Math.min(1, ratio), 6);
  ctx.font = FONT.mono;
  ctx.fillStyle = COLORS.hr;
  ctx.fillText(label || `答辩 ${Math.ceil(remainingSec)}s`, x, y + 20);
}
