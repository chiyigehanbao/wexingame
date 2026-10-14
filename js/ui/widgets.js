/**
 * 通用绘制件：圆角矩形、印章、按钮。
 */
import { createLayer } from '../core/screen.js';
import { damp } from '../core/tween.js';
import { play } from '../core/audio.js';
import { COLORS, font } from './theme.js';
import { drawSpaced } from './text.js';

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const sealCache = {};

/**
 * 预渲染印章（白文：红底留白字），带边缘缺口与颗粒。
 * @param {string} text 1～2 字；2 字时竖排
 * @param {'square'|'round'} shape
 */
export function sealImage(text, size, shape = 'square', color = COLORS.red) {
  const key = `${text}|${size}|${shape}|${color}`;
  if (sealCache[key]) {
    return sealCache[key];
  }
  const pad = 2;
  const layer = createLayer(size + pad * 2, size + pad * 2);
  const g = layer.ctx;
  let seed = 0;
  for (const ch of key) {
    seed = (seed * 31 + ch.charCodeAt(0)) % 100003;
  }
  const rnd = () => {
    seed = (seed * 16807 + 11) % 2147483647;
    return seed / 2147483647;
  };
  g.translate(pad, pad);
  g.fillStyle = color;
  if (shape === 'round') {
    g.beginPath();
    g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    g.fill();
  } else {
    roundRect(g, 0, 0, size, size, size * 0.1);
    g.fill();
  }

  g.strokeStyle = COLORS.card;
  g.lineWidth = Math.max(1, size * 0.035);
  const inset = size * 0.08;
  if (shape === 'round') {
    g.beginPath();
    g.arc(size / 2, size / 2, size / 2 - inset, 0, Math.PI * 2);
    g.stroke();
  } else {
    roundRect(g, inset, inset, size - inset * 2, size - inset * 2, size * 0.05);
    g.stroke();
  }

  g.fillStyle = COLORS.card;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const chars = [...text];
  if (chars.length === 1) {
    g.font = font(Math.round(size * 0.52), 'bold');
    g.fillText(chars[0], size / 2, size / 2 + size * 0.02);
  } else {
    g.font = font(Math.round(size * 0.36), 'bold');
    g.fillText(chars[0], size / 2, size * 0.31);
    g.fillText(chars[1], size / 2, size * 0.71);
  }

  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < size * 1.6; i += 1) {
    g.globalAlpha = 0.25 + rnd() * 0.6;
    const r = rnd() * size * 0.018 + 0.3;
    g.beginPath();
    g.arc(rnd() * size, rnd() * size, r, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 7; i += 1) {
    g.globalAlpha = 0.9;
    const a = rnd() * Math.PI * 2;
    const rr = size / 2;
    const ex = shape === 'round' ? size / 2 + Math.cos(a) * rr : (rnd() < 0.5 ? 0 : size);
    const ey = shape === 'round' ? size / 2 + Math.sin(a) * rr : rnd() * size;
    g.beginPath();
    g.arc(ex, ey, size * (0.015 + rnd() * 0.03), 0, Math.PI * 2);
    g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  layer.pad = pad;
  sealCache[key] = layer;
  return layer;
}

export function drawSeal(ctx, text, cx, cy, size, shape, color, opts = {}) {
  const img = sealImage(text, size, shape, color);
  const full = size + img.pad * 2;
  ctx.save();
  ctx.translate(cx, cy);
  if (opts.rotate) {
    ctx.rotate(opts.rotate);
  }
  const s = opts.scale || 1;
  ctx.globalAlpha *= opts.alpha == null ? 1 : opts.alpha;
  ctx.drawImage(img.canvas, (-full / 2) * s, (-full / 2) * s, full * s, full * s);
  ctx.restore();
}

export class Button {
  /**
   * @param {{ x: number, y: number, w: number, h: number, label: string, kind?: 'primary'|'ghost'|'text', onTap: () => void }} o
   */
  constructor(o) {
    Object.assign(this, { kind: 'primary', visible: true, alpha: 1 }, o);
    this.press = 0;
    this.down = false;
  }

  contains(px, py) {
    const slop = 6;
    return px >= this.x - slop && px <= this.x + this.w + slop
      && py >= this.y - slop && py <= this.y + this.h + slop;
  }

  update(dt) {
    this.press = damp(this.press, this.down ? 1 : 0, 28, dt);
  }

  draw(ctx) {
    if (!this.visible || this.alpha <= 0) {
      return;
    }
    const s = 1 - this.press * 0.05;
    ctx.save();
    ctx.globalAlpha *= this.alpha;
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    ctx.scale(s, s);
    const x = -this.w / 2;
    const y = -this.h / 2;
    if (this.kind === 'primary') {
      ctx.shadowColor = 'rgba(43, 38, 34, 0.3)';
      ctx.shadowBlur = 10 * (1 - this.press);
      ctx.shadowOffsetY = 3 * (1 - this.press);
      ctx.fillStyle = this.press > 0.5 ? COLORS.inkSoft : COLORS.ink;
      roundRect(ctx, x, y, this.w, this.h, 6);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(243, 236, 220, 0.35)';
      ctx.lineWidth = 1;
      roundRect(ctx, x + 4, y + 4, this.w - 8, this.h - 8, 4);
      ctx.stroke();
      ctx.fillStyle = COLORS.card;
    } else if (this.kind === 'ghost') {
      ctx.fillStyle = `rgba(43, 38, 34, ${0.05 + this.press * 0.08})`;
      roundRect(ctx, x, y, this.w, this.h, 6);
      ctx.fill();
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = COLORS.ink;
    } else {
      ctx.fillStyle = this.color || (this.press > 0.5 ? COLORS.ink : COLORS.inkSoft);
      ctx.globalAlpha *= 1 - this.press * 0.4;
    }
    ctx.font = font(this.fontSize || (this.kind === 'text' ? 15 : 18), this.kind === 'text' ? 'normal' : 'bold');
    ctx.textBaseline = 'middle';
    drawSpaced(ctx, this.label, 0, 1, this.kind === 'primary' ? 6 : 2);
    ctx.restore();
  }
}

/** 一组按钮的按下 / 抬起判定 */
export class ButtonGroup {
  constructor() {
    this.list = [];
    this.active = null;
  }

  add(btn) {
    this.list.push(btn);
    return btn;
  }

  clear() {
    this.list = [];
    this.active = null;
  }

  onDown(x, y) {
    this.active = this.list.find((b) => b.visible && b.alpha > 0.5 && b.contains(x, y)) || null;
    if (this.active) {
      this.active.down = true;
    }
    return !!this.active;
  }

  onMove(x, y) {
    if (this.active) {
      this.active.down = this.active.contains(x, y);
    }
  }

  onUp(x, y) {
    const b = this.active;
    this.active = null;
    if (!b) {
      return false;
    }
    b.down = false;
    if (b.contains(x, y)) {
      play('wood', 0.5);
      b.onTap(x, y);
      return true;
    }
    return false;
  }

  update(dt) {
    this.list.forEach((b) => b.update(dt));
  }

  draw(ctx) {
    this.list.forEach((b) => b.draw(ctx));
  }
}
