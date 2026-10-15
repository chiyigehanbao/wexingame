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
let deskGen = 0;
const visualJobs = [];

function fillBase(g) {
  g.fillStyle = COLORS.paper;
  g.fillRect(0, 0, W, H);
}

function enqueuePaper(g, seed, finish) {
  const rnd = seeded(seed);
  let phase = 0;
  let n = 0;
  visualJobs.push(() => {
    if (phase === 0) {
      const vig = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.75);
      vig.addColorStop(0, 'rgba(228, 216, 191, 0)');
      vig.addColorStop(1, 'rgba(196, 178, 146, 0.55)');
      g.fillStyle = vig;
      g.fillRect(0, 0, W, H);
      g.lineCap = 'round';
      phase = 1;
      return false;
    }
    if (phase === 1) {
      const end = Math.min(520, n + 52);
      for (; n < end; n += 1) {
        const x = rnd() * W;
        const y = rnd() * H;
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
      if (n >= 520) {
        phase = 2;
        n = 0;
      }
      return false;
    }
    const end = Math.min(900, n + 120);
    for (; n < end; n += 1) {
      g.fillStyle = `rgba(70, 55, 35, ${rnd() * 0.06})`;
      g.fillRect(rnd() * W, rnd() * H, 1, 1);
    }
    if (n < 900) {
      return false;
    }
    if (finish) {
      finish(rnd);
    }
    return true;
  });
}

/** 每帧只补一小块纸纹，不在翻牌、滑动时整张重画。 */
export function pumpVisuals() {
  const job = visualJobs[0];
  if (job && job()) {
    visualJobs.shift();
  }
}

/** 进升堂时丢掉还在画的标题纸纹，别跟公案抢帧。 */
export function clearVisualJobs() {
  visualJobs.length = 0;
}

export function paperBackground() {
  if (!paperLayer) {
    paperLayer = createLayer(W, H);
    fillBase(paperLayer.ctx);
    enqueuePaper(paperLayer.ctx, 7);
  }
  return paperLayer;
}

/** 标题页：宣纸 + 淡日 + 三层远山 */
export function titleBackground() {
  if (!titleLayer) {
    titleLayer = createLayer(W, H);
    const g = titleLayer.ctx;
    fillBase(g);
    enqueuePaper(g, 11, (rnd) => {
      const sun = g.createRadialGradient(W * 0.72, H * 0.5, 0, W * 0.72, H * 0.5, W * 0.16);
      sun.addColorStop(0, 'rgba(179, 52, 43, 0.22)');
      sun.addColorStop(0.85, 'rgba(179, 52, 43, 0.16)');
      sun.addColorStop(1, 'rgba(179, 52, 43, 0)');
      g.fillStyle = sun;
      g.fillRect(0, 0, W, H);
      ridge(g, W, H * 0.66, H * 0.07, rnd, 'rgba(43, 38, 34, 0.16)', H * 0.86);
      ridge(g, W, H * 0.76, H * 0.06, rnd, 'rgba(43, 38, 34, 0.26)', H * 0.95);
      ridge(g, W, H * 0.88, H * 0.05, rnd, 'rgba(43, 38, 34, 0.42)', H * 1.05);
    });
  }
  return titleLayer;
}

/** 游戏页：宣纸 + 淡水印「衙」+ 底部公案木纹 */
export function deskBackground(deskTop) {
  if (!deskLayer || deskLayer.deskTop !== deskTop) {
    clearVisualJobs();
    deskGen += 1;
    const gen = deskGen;
    deskLayer = createLayer(W, H);
    deskLayer.deskTop = deskTop;
    const g = deskLayer.ctx;
    fillBase(g);
    enqueuePaper(g, 23, (rnd) => {
      if (gen !== deskGen) {
        return;
      }
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
    });
  }
  return deskLayer;
}
