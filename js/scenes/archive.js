/**
 * 历任档案：结局图鉴 + 见过的人。可上下拖动，点开查看详情。
 */
import {
  W, H, SAFE_TOP, SAFE_BOTTOM, ctx as screenCtx,
} from '../core/screen.js';
import { go } from '../core/router.js';
import { play } from '../core/audio.js';
import { clamp, damp } from '../core/tween.js';
import { ENDINGS, ENDING_ORDER } from '../data/endings.js';
import { CHARACTERS, CHARACTER_ORDER } from '../data/characters.js';
import { countEndings } from '../game/meta.js';
import { session } from '../session.js';
import { paperBackground } from '../ui/paper.js';
import { COLORS, font } from '../ui/theme.js';
import { wrapText, drawLines } from '../ui/text.js';
import {
  Button, ButtonGroup, drawSeal, roundRect,
} from '../ui/widgets.js';

const COLS = 3;
const PEOPLE_COLS = 4;

let scroll = 0;
let scrollTarget = 0;
let maxScroll = 0;
let touch = null;
let detail = null;
let detailT = 0;
const cells = [];
const buttons = new ButtonGroup();
const L = {};

function layout() {
  L.headerY = SAFE_TOP + 22;
  L.summaryY = L.headerY + 34;
  L.gridTop = L.summaryY + 34;
  L.cellW = (W - 40) / COLS;
  L.cellH = L.cellW * 0.92;
  const rows = Math.ceil(ENDING_ORDER.length / COLS);
  L.peopleTitleY = L.gridTop + rows * L.cellH + 26;
  L.peopleTop = L.peopleTitleY + 26;
  L.personW = (W - 40) / PEOPLE_COLS;
  L.personH = L.personW * 1.05;
  const prow = Math.ceil(CHARACTER_ORDER.length / PEOPLE_COLS);
  const contentBottom = L.peopleTop + prow * L.personH + 20;
  L.viewBottom = H - SAFE_BOTTOM - 8;
  maxScroll = Math.max(0, contentBottom - L.viewBottom);

  cells.length = 0;
  ENDING_ORDER.forEach((id, i) => {
    cells.push({
      kind: 'ending', id, x: 20 + (i % COLS) * L.cellW, y: L.gridTop + Math.floor(i / COLS) * L.cellH, w: L.cellW, h: L.cellH,
    });
  });
  CHARACTER_ORDER.forEach((id, i) => {
    cells.push({
      kind: 'person', id, x: 20 + (i % PEOPLE_COLS) * L.personW, y: L.peopleTop + Math.floor(i / PEOPLE_COLS) * L.personH, w: L.personW, h: L.personH,
    });
  });

  buttons.clear();
  buttons.add(new Button({
    x: 8, y: L.headerY - 18, w: 70, h: 36, label: '‹ 返回', kind: 'text', fontSize: 15,
    onTap: (x, y) => go('title', {}, { x, y }),
  }));
}

function openDetail(cell) {
  const m = session.meta;
  if (cell.kind === 'ending') {
    const e = ENDINGS[cell.id];
    if (!m.endings[cell.id]) {
      return;
    }
    detail = {
      seal: e.seal, shape: 'square', color: COLORS.red, title: e.title, sub: `达成 ${m.endings[cell.id]} 次`, text: e.text,
    };
  } else {
    const c = CHARACTERS[cell.id];
    if (!m.met[cell.id]) {
      return;
    }
    detail = {
      seal: c.seal, shape: c.shape, color: c.color, title: c.name, sub: c.role, text: c.bio,
    };
  }
  detail.lines = wrapText(screenCtx, detail.text, Math.min(W - 100, 280), font(15));
  detailT = 0;
  play('paper', 0.6);
}

export default {
  enter() {
    scroll = 0;
    scrollTarget = 0;
    detail = null;
    layout();
  },

  update(dt) {
    buttons.update(dt);
    scroll = damp(scroll, scrollTarget, 18, dt);
    detailT += dt;
  },

  draw(ctx) {
    ctx.drawImage(paperBackground().canvas, 0, 0, W, H);
    const m = session.meta;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, L.summaryY + 18, W, H);
    ctx.clip();
    ctx.translate(0, -scroll);

    cells.forEach((c) => {
      const cx = c.x + c.w / 2;
      if (c.kind === 'ending') {
        const got = !!m.endings[c.id];
        const size = c.w * 0.5;
        const cy = c.y + c.h * 0.42;
        if (got) {
          drawSeal(ctx, ENDINGS[c.id].seal, cx, cy, size, 'square', COLORS.red, { rotate: ((c.id.length % 3) - 1) * 0.04 });
        } else {
          ctx.strokeStyle = 'rgba(43, 38, 34, 0.25)';
          ctx.setLineDash && ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.2;
          roundRect(ctx, cx - size / 2, cy - size / 2, size, size, 6);
          ctx.stroke();
          ctx.setLineDash && ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(43, 38, 34, 0.3)';
          ctx.font = font(22, 'bold');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('？', cx, cy);
        }
        ctx.fillStyle = got ? COLORS.ink : COLORS.muted;
        ctx.font = font(12);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(got ? ENDINGS[c.id].title : '未解锁', cx, c.y + c.h * 0.84);
      } else {
        const p = CHARACTERS[c.id];
        const got = !!m.met[c.id];
        const size = c.w * 0.52;
        const cy = c.y + c.h * 0.4;
        drawSeal(ctx, got ? p.seal : '？', cx, cy, size, p.shape, got ? p.color : '#b9ad98');
        ctx.fillStyle = got ? COLORS.ink : COLORS.muted;
        ctx.font = font(12);
        ctx.textAlign = 'center';
        ctx.fillText(got ? p.role : '未见', cx, c.y + c.h * 0.82);
      }
    });

    ctx.fillStyle = COLORS.ink;
    ctx.font = font(16, 'bold');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('结局', 20, L.gridTop - 12);
    const metCount = CHARACTER_ORDER.filter((id) => m.met[id]).length;
    ctx.fillText(`见过的人  ${metCount} / ${CHARACTER_ORDER.length}`, 20, L.peopleTitleY);
    ctx.restore();

    ctx.fillStyle = COLORS.ink;
    ctx.font = font(22, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('历任档案', W / 2, L.headerY);
    ctx.fillStyle = COLORS.muted;
    ctx.font = font(13);
    ctx.fillText(
      `历任 ${m.runs} 任 · 最长在任 ${m.best} 天 · 结局 ${countEndings(m)} / ${ENDING_ORDER.length}`,
      W / 2,
      L.summaryY,
    );
    buttons.draw(ctx);

    if (detail) {
      drawDetail(ctx);
    }
  },

  onDown(x, y) {
    if (detail) {
      return;
    }
    if (buttons.onDown(x, y)) {
      return;
    }
    touch = { x, y, sy: scrollTarget, moved: false };
  },

  onMove(x, y) {
    buttons.onMove(x, y);
    if (!touch) {
      return;
    }
    if (Math.abs(y - touch.y) > 8) {
      touch.moved = true;
    }
    if (touch.moved) {
      scrollTarget = clamp(touch.sy - (y - touch.y), 0, maxScroll);
      scroll = scrollTarget;
    }
  },

  onUp(x, y) {
    if (detail) {
      detail = null;
      return;
    }
    if (buttons.onUp(x, y)) {
      return;
    }
    const tap = touch && !touch.moved;
    touch = null;
    if (!tap || y < L.summaryY + 18) {
      return;
    }
    const cy = y + scroll;
    const hit = cells.find((c) => x >= c.x && x <= c.x + c.w && cy >= c.y && cy <= c.y + c.h);
    if (hit) {
      openDetail(hit);
    }
  },
};

function drawDetail(ctx) {
  const a = clamp(detailT / 0.2);
  ctx.globalAlpha = a * 0.55;
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;

  const w = Math.min(W - 60, 320);
  const textH = detail.lines.length * 25;
  const h = 196 + textH;
  const x = (W - w) / 2;
  const y = (H - h) / 2 + (1 - a) * 16;
  ctx.fillStyle = COLORS.card;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.2;
  roundRect(ctx, x + 7, y + 7, w - 14, h - 14, 6);
  ctx.stroke();

  drawSeal(ctx, detail.seal, W / 2, y + 62, 72, detail.shape, detail.color);
  ctx.fillStyle = COLORS.ink;
  ctx.font = font(20, 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(detail.title, W / 2, y + 122);
  ctx.fillStyle = COLORS.muted;
  ctx.font = font(13);
  ctx.fillText(detail.sub, W / 2, y + 146);
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = font(15);
  drawLines(ctx, detail.lines, W / 2, y + 166, 25);
  ctx.fillStyle = COLORS.muted;
  ctx.font = font(12);
  ctx.fillText('点击任意处关闭', W / 2, y + h - 18);
  ctx.globalAlpha = 1;
}
