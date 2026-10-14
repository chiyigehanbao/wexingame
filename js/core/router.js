/**
 * 场景切换 + 墨迹转场。场景对象：{ enter(params), update(dt, now), draw(ctx, now), onDown/onMove/onUp }
 */
import { W, H } from './screen.js';
import { setInputHandler } from './input.js';
import { easeInCubic, easeOutCubic } from './tween.js';
import { COLORS } from '../ui/theme.js';

const IN_DUR = 0.38;
const OUT_DUR = 0.42;

let scenes = {};
let current = null;
let pending = null;

const blobs = [];

export function registerScenes(map) {
  scenes = map;
}

export function currentScene() {
  return current;
}

function rebuildBlobs(ox, oy) {
  blobs.length = 0;
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
    const d = 20 + Math.random() * 60;
    blobs.push({
      x: ox + Math.cos(a) * d,
      y: oy + Math.sin(a) * d,
      k: 0.75 + Math.random() * 0.45,
      delay: Math.random() * 0.25,
    });
  }
}

/**
 * @param {string} name
 * @param {object} [params]
 * @param {{ x: number, y: number }} [origin] 墨迹起点
 */
export function go(name, params = {}, origin) {
  if (pending) {
    return;
  }
  if (!current) {
    current = scenes[name];
    current.enter(params);
    setInputHandler(current);
    return;
  }
  const o = origin || { x: W / 2, y: H / 2 };
  rebuildBlobs(o.x, o.y);
  pending = { name, params, t: 0, swapped: false };
  setInputHandler(null);
}

export function update(dt, now) {
  if (pending) {
    pending.t += dt;
    if (!pending.swapped && pending.t >= IN_DUR) {
      pending.swapped = true;
      current = scenes[pending.name];
      current.enter(pending.params);
    }
    if (pending.t >= IN_DUR + OUT_DUR) {
      pending = null;
      setInputHandler(current);
    }
  }
  current?.update?.(dt, now);
}

function drawInk(ctx, cover) {
  const maxR = Math.hypot(W, H);
  ctx.fillStyle = COLORS.ink;
  blobs.forEach((b) => {
    const t = Math.max(0, (cover - b.delay) / (1 - b.delay));
    const r = maxR * b.k * t;
    if (r <= 0) {
      return;
    }
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function draw(ctx, now) {
  current?.draw?.(ctx, now);
  if (!pending) {
    return;
  }
  if (pending.t < IN_DUR) {
    drawInk(ctx, easeInCubic(pending.t / IN_DUR) * 1.25);
    return;
  }
  const t = (pending.t - IN_DUR) / OUT_DUR;
  ctx.globalAlpha = 1 - easeOutCubic(t);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
}
