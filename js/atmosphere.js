/**
 * 程序化背景氛围：城市剪影、雨丝、扫描线、暗角。
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render';
import { COLORS } from './theme';

const ctx = canvas.getContext('2d');

/** 雨粒状态 */
const rainDrops = [];
const RAIN_COUNT = 70;

for (let i = 0; i < RAIN_COUNT; i += 1) {
  rainDrops.push({
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT,
    speed: 4 + Math.random() * 6,
    len: 8 + Math.random() * 14,
  });
}

/**
 * 墨黑夜空 + 地平线霓虹反光（非紫色模板渐变）。
 */
export function drawNightSky() {
  const g = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
  g.addColorStop(0, '#04060c');
  g.addColorStop(0.45, '#0a1528');
  g.addColorStop(0.72, '#122a3d');
  g.addColorStop(1, '#1a0a14');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  const glow = ctx.createRadialGradient(
    SCREEN_WIDTH * 0.72,
    SCREEN_HEIGHT * 0.88,
    10,
    SCREEN_WIDTH * 0.5,
    SCREEN_HEIGHT,
    SCREEN_WIDTH * 0.9,
  );
  glow.addColorStop(0, 'rgba(0, 245, 212, 0.12)');
  glow.addColorStop(0.5, 'rgba(255, 42, 109, 0.06)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

/**
 * 简易都市天际线剪影。
 */
export function drawCitySilhouette() {
  const baseY = SCREEN_HEIGHT * 0.42;
  ctx.fillStyle = '#0d1522';
  ctx.fillRect(0, baseY, SCREEN_WIDTH, SCREEN_HEIGHT - baseY);

  const blocks = [
    [0, 0.55, 0.12, 0.45],
    [0.1, 0.48, 0.08, 0.52],
    [0.2, 0.52, 0.14, 0.48],
    [0.36, 0.44, 0.1, 0.56],
    [0.5, 0.5, 0.18, 0.5],
    [0.7, 0.46, 0.12, 0.54],
    [0.84, 0.53, 0.16, 0.47],
  ];
  blocks.forEach(([bx, bh, bw, gap]) => {
    const x = SCREEN_WIDTH * bx;
    const w = SCREEN_WIDTH * bw;
    const h = SCREEN_HEIGHT * (baseY / SCREEN_HEIGHT - bh + 0.55);
    ctx.fillRect(x, baseY - h + SCREEN_HEIGHT * 0.08, w - SCREEN_WIDTH * gap * 0.3, h);

    ctx.fillStyle = 'rgba(255, 197, 61, 0.35)';
    const winRows = 3;
    for (let r = 0; r < winRows; r += 1) {
      const lit = (bx * 10 + r) % 3 !== 0;
      if (lit) {
        ctx.fillRect(x + w * 0.2, baseY - h + 20 + r * 22, w * 0.15, 8);
      }
    }
    ctx.fillStyle = '#0d1522';
  });

  ctx.fillStyle = 'rgba(0, 245, 212, 0.25)';
  ctx.fillRect(0, baseY - 2, SCREEN_WIDTH, 2);
}

/**
 * @param {number} tick 毫秒时间戳
 */
export function drawRain(tick) {
  ctx.strokeStyle = 'rgba(0, 245, 212, 0.18)';
  ctx.lineWidth = 1;
  rainDrops.forEach((d, i) => {
    const offset = (tick * 0.06 + i * 17) % SCREEN_HEIGHT;
    const y = (d.y + offset) % SCREEN_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(d.x, y);
    ctx.lineTo(d.x - 2, y + d.len);
    ctx.stroke();
  });
}

/**
 * 扫描线 + 暗角。
 */
export function drawPostFX() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let y = 0; y < SCREEN_HEIGHT; y += 4) {
    ctx.fillRect(0, y, SCREEN_WIDTH, 1);
  }

  const vig = ctx.createRadialGradient(
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2,
    SCREEN_HEIGHT * 0.2,
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2,
    SCREEN_HEIGHT * 0.85,
  );
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

/**
 * 时间线色温叠层。
 * @param {'now'|'past'|string} timeline
 */
function drawTimelineTint(timeline) {
  if (timeline === 'past') {
    ctx.fillStyle = COLORS.pastTint;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    return;
  }
  ctx.fillStyle = COLORS.nowTint;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

/**
 * 绘制完整背景层。
 * @param {number} tick
 * @param {'now'|'past'|string} [timeline]
 */
export function drawBackdrop(tick, timeline = 'now') {
  drawNightSky();
  drawCitySilhouette();
  drawRain(tick);
  drawPostFX();
  drawTimelineTint(timeline);
}

/**
 * 标题霓虹呼吸。
 * @param {number} tick
 * @returns {number} 0~1
 */
export function titlePulse(tick) {
  return 0.55 + 0.45 * Math.sin(tick * 0.003);
}
