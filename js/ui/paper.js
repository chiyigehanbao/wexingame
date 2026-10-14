/**
 * 预渲染背景：宣纸纹理、远山、公案桌面。只画一次，之后每帧 drawImage。
 */
import { W, H, createLayer } from '../core/screen.js';
import { COLORS } from './theme.js';

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function paintPaper(g, w, h, rnd) {
  g.fillStyle = COLORS.paper;
  g.fillRect(0, 0, w, h);

  const vig = g.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.3, w / 2, h * 0.5, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(228, 216, 191, 0)');
  vig.addColorStop(1, 'rgba(196, 178, 146, 0.55)');
  g.fillStyle = vig;
  g.fillRect(0, 0, w, h);

  g.lineCap = 'round';
  for (let i = 0; i < 520; i += 1) {
    const x = rnd() * w;
    const y = rnd() * h;
    const len = 4 + rnd() * 16;
    const a = rnd() * Math.PI;
    g.strokeStyle = `rgba(90, 70, 45, ${0.03 + rnd() * 0.05})`;
    g.lineWidth = 0.4 + rnd() * 0.6;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(
      x + Math.cos(a) * len * 0.5 + (rnd() - 0.5) * 4,
      y + Math.sin(a) * len * 0.5 + (rnd() - 0.5) * 4,
      x + Math.cos(a) * len,
      y + Math.sin(a) * len,
    );
    g.stroke();
  }
  for (let i = 0; i < 900; i += 1) {
    g.fillStyle = `rgba(70, 55, 35, ${rnd() * 0.06})`;
    g.fillRect(rnd() * w, rnd() * h, 1, 1);
  }
}

function ridge(g, w, baseY, amp, rnd, color, mistTo) {
  const pts = [];
  const seeds = [rnd() * 10, rnd() * 10, rnd() * 10];
  for (let x = -10; x <= w + 10; x += 6) {
    const y = baseY
      - Math.sin(x * 0.011 + seeds[0]) * amp
      - Math.sin(x * 0.027 + seeds[1]) * amp * 0.45
      - Math.abs(Math.sin(x * 0.006 + seeds[2])) * amp * 0.9;
    pts.push([x, y]);
  }
  const top = Math.min(...pts.map((p) => p[1]));
  const grad = g.createLinearGradient(0, top, 0, mistTo);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(243, 236, 220, 0)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(pts[0][0], mistTo);
  pts.forEach(([x, y]) => g.lineTo(x, y));
  g.lineTo(pts[pts.length - 1][0], mistTo);
  g.closePath();
  g.fill();
}

let paperLayer = null;
let titleLayer = null;
let deskLayer = null;

export function paperBackground() {
  if (!paperLayer) {
    paperLayer = createLayer(W, H);
    paintPaper(paperLayer.ctx, W, H, seeded(7));
  }
  return paperLayer;
}

/** 标题页：宣纸 + 淡日 + 三层远山 */
export function titleBackground() {
  if (!titleLayer) {
    titleLayer = createLayer(W, H);
    const g = titleLayer.ctx;
    const rnd = seeded(11);
    paintPaper(g, W, H, rnd);
    const sun = g.createRadialGradient(W * 0.72, H * 0.5, 0, W * 0.72, H * 0.5, W * 0.16);
    sun.addColorStop(0, 'rgba(179, 52, 43, 0.22)');
    sun.addColorStop(0.85, 'rgba(179, 52, 43, 0.16)');
    sun.addColorStop(1, 'rgba(179, 52, 43, 0)');
    g.fillStyle = sun;
    g.fillRect(0, 0, W, H);
    ridge(g, W, H * 0.66, H * 0.07, rnd, 'rgba(43, 38, 34, 0.16)', H * 0.86);
    ridge(g, W, H * 0.76, H * 0.06, rnd, 'rgba(43, 38, 34, 0.26)', H * 0.95);
    ridge(g, W, H * 0.88, H * 0.05, rnd, 'rgba(43, 38, 34, 0.42)', H * 1.05);
  }
  return titleLayer;
}

/** 游戏页：宣纸 + 淡水印「衙」+ 底部公案木纹 */
export function deskBackground(deskTop) {
  if (!deskLayer || deskLayer.deskTop !== deskTop) {
    deskLayer = createLayer(W, H);
    deskLayer.deskTop = deskTop;
    const g = deskLayer.ctx;
    const rnd = seeded(23);
    paintPaper(g, W, H, rnd);

    g.save();
    g.globalAlpha = 0.03;
    g.fillStyle = COLORS.ink;
    g.font = `bold ${Math.round(W * 0.72)}px serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('衙', W / 2, H * 0.7);
    g.restore();

    const wood = g.createLinearGradient(0, deskTop, 0, H);
    wood.addColorStop(0, '#5a4130');
    wood.addColorStop(0.08, COLORS.wood);
    wood.addColorStop(1, '#2e2119');
    g.fillStyle = wood;
    g.fillRect(0, deskTop, W, H - deskTop);
    for (let i = 0; i < 26; i += 1) {
      const y = deskTop + 6 + rnd() * (H - deskTop - 6);
      g.strokeStyle = `rgba(20, 12, 8, ${0.12 + rnd() * 0.15})`;
      g.lineWidth = 0.6 + rnd();
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(W * 0.3, y + (rnd() - 0.5) * 8, W * 0.7, y + (rnd() - 0.5) * 8, W, y + (rnd() - 0.5) * 6);
      g.stroke();
    }
    g.fillStyle = 'rgba(255, 220, 170, 0.18)';
    g.fillRect(0, deskTop, W, 1.5);
  }
  return deskLayer;
}
