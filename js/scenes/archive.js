/**
 * 历任档案：功名、结局、见过的人。空位先留两行，多了再加行。
 */
import {
  W, H, SAFE_TOP, SAFE_BOTTOM, ctx as screenCtx,
} from '../core/screen.js';
import { go } from '../core/router.js';
import { play } from '../core/audio.js';
import { clamp, damp } from '../core/tween.js';
import { ENDINGS, ENDING_ORDER } from '../data/endings.js';
import { CHARACTERS, CHARACTER_ORDER } from '../data/characters.js';
import { DEEDS, summarizeReign } from '../game/deeds.js';
import {
  achievementCount, achievementSeen, countEndings, gallerySlots,
} from '../game/meta.js';
import { acknowledgeAchievement, acknowledgeEnding, session } from '../session.js';
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
let summarySalt = 0;
const cells = [];
const buttons = new ButtonGroup();
const L = {};

function deedById(id) {
  return DEEDS.find((d) => d.id === id) || { id: 'ordinary', name: '寻常官场', seal: '寻常' };
}

function earnedDeedIds(meta) {
  const ids = DEEDS.map((d) => d.id).filter((id) => achievementCount(meta.achievements?.[id]) > 0);
  if (achievementCount(meta.achievements?.ordinary) > 0) {
    ids.push('ordinary');
  }
  return ids;
}

function placeGrid(kind, ids, top, cols, cellW, cellH) {
  const slots = gallerySlots(ids.length, cols);
  const out = [];
  for (let i = 0; i < slots; i += 1) {
    out.push({
      kind,
      id: ids[i] || null,
      empty: !ids[i],
      x: 20 + (i % cols) * cellW,
      y: top + Math.floor(i / cols) * cellH,
      w: cellW,
      h: cellH,
    });
  }
  return out;
}

function layout() {
  const m = session.meta;
  L.headerY = SAFE_TOP + 22;
  L.summaryY = L.headerY + 34;
  L.summary2Y = L.summaryY + 18;
  L.cellW = (W - 40) / COLS;
  L.cellH = L.cellW * 0.92;
  L.deedTitleY = L.summary2Y + 28;
  L.deedTop = L.deedTitleY + 18;
  const deedIds = earnedDeedIds(m);
  const deedRows = gallerySlots(deedIds.length, COLS) / COLS;
  L.endingTitleY = L.deedTop + deedRows * L.cellH + 22;
  L.endingTop = L.endingTitleY + 18;
  const endingIds = ENDING_ORDER.filter((id) => m.endings[id]);
  const endingRows = gallerySlots(endingIds.length, COLS) / COLS;
  L.peopleTitleY = L.endingTop + endingRows * L.cellH + 26;
  L.peopleTop = L.peopleTitleY + 26;
  L.personW = (W - 40) / PEOPLE_COLS;
  L.personH = L.personW * 1.05;
  const prow = Math.ceil(CHARACTER_ORDER.length / PEOPLE_COLS);
  const contentBottom = L.peopleTop + prow * L.personH + 20;
  L.viewBottom = H - SAFE_BOTTOM - 8;
  maxScroll = Math.max(0, contentBottom - L.viewBottom);

  cells.length = 0;
  cells.push(...placeGrid('deed', deedIds, L.deedTop, COLS, L.cellW, L.cellH));
  cells.push(...placeGrid('ending', endingIds, L.endingTop, COLS, L.cellW, L.cellH));
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
  if (cell.empty || !cell.id) {
    return;
  }
  const m = session.meta;
  if (cell.kind === 'deed') {
    const entry = m.achievements[cell.id];
    const count = achievementCount(entry);
    if (!count) {
      return;
    }
    const deed = deedById(cell.id);
    const reigns = entry.reigns || [];
    summarySalt += 1;
    const index = reigns.length ? (summarySalt - 1) % reigns.length : 0;
    const which = reigns.length > 1 ? `记下的第${index + 1}回，跟另外${reigns.length - 1}回不是同一段日子。` : '';
    const body = reigns.length ? summarizeReign(reigns[index], summarySalt) : `${deed.name}记下了${count}次。旧档没留下那几任的细账。`;
    detail = {
      seal: deed.seal, shape: 'square', color: COLORS.red, title: deed.name, sub: `累计 ${count} 次`, text: `${which}${body}`,
    };
    acknowledgeAchievement(cell.id);
  } else if (cell.kind === 'ending') {
    const e = ENDINGS[cell.id];
    if (!m.endings[cell.id]) {
      return;
    }
    detail = {
      seal: e.seal, shape: 'square', color: COLORS.red, title: e.title, sub: `走过 ${m.endings[cell.id]} 次`, text: e.text,
    };
    acknowledgeEnding(cell.id);
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
    ctx.rect(0, L.summary2Y + 16, W, H);
    ctx.clip();
    ctx.translate(0, -scroll);

    cells.forEach((c) => {
      const cx = c.x + c.w / 2;
      if (c.kind === 'person') {
        const p = CHARACTERS[c.id];
        const got = !!m.met[c.id];
        const size = c.w * 0.52;
        const cy = c.y + c.h * 0.4;
        drawSeal(ctx, got ? p.seal : '？', cx, cy, size, p.shape, got ? p.color : '#b9ad98');
        ctx.fillStyle = got ? COLORS.ink : COLORS.muted;
        ctx.font = font(12);
        ctx.textAlign = 'center';
        ctx.fillText(got ? p.role : '未见', cx, c.y + c.h * 0.82);
        return;
      }
      const size = c.w * 0.5;
      const cy = c.y + c.h * 0.42;
      const got = !c.empty && !!c.id;
      let fresh = false;
      let label = '尚无';
      if (c.kind === 'deed' && got) {
        const deed = deedById(c.id);
        const entry = m.achievements[c.id];
        fresh = achievementCount(entry) > achievementSeen(entry);
        label = deed.name;
        drawSeal(ctx, deed.seal, cx, cy, size, 'square', COLORS.red, { rotate: ((c.id.length % 3) - 1) * 0.04 });
      } else if (c.kind === 'ending' && got) {
        fresh = (m.endings[c.id] || 0) > (m.endingSeen?.[c.id] || 0);
        label = ENDINGS[c.id].title;
        drawSeal(ctx, ENDINGS[c.id].seal, cx, cy, size, 'square', COLORS.red, { rotate: ((c.id.length % 3) - 1) * 0.04 });
      } else {
        label = c.kind === 'ending' ? '未走过' : '尚无';
        drawEmptySlot(ctx, cx, cy, size);
      }
      if (fresh) {
        drawFreshDot(ctx, cx + size * 0.42, cy - size * 0.42);
      }
      ctx.fillStyle = got ? COLORS.ink : COLORS.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelFont = font(12);
      const labelLines = wrapText(ctx, label, Math.max(36, c.w - 8), labelFont).slice(0, 2);
      ctx.font = labelFont;
      const lineH = 13;
      const labelTop = c.y + c.h - 4 - labelLines.length * lineH;
      labelLines.forEach((ln, i) => {
        ctx.fillText(ln, cx, labelTop + lineH / 2 + i * lineH);
      });
    });

    ctx.fillStyle = COLORS.ink;
    ctx.font = font(16, 'bold');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const deedCount = earnedDeedIds(m).length;
    ctx.fillText(`功名  ${deedCount}`, 20, L.deedTitleY);
    ctx.fillText(`收场  ${countEndings(m)} / ${ENDING_ORDER.length}`, 20, L.endingTitleY);
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
    ctx.fillText(`历任 ${m.runs} 任 · 最长 ${m.best} 天`, W / 2, L.summaryY);
    ctx.fillText(`收场 ${countEndings(m)} / ${ENDING_ORDER.length}`, W / 2, L.summary2Y);
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

function drawEmptySlot(ctx, cx, cy, size) {
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

function drawFreshDot(ctx, x, y) {
  ctx.beginPath();
  ctx.fillStyle = COLORS.card;
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = COLORS.red;
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawDetail(ctx) {
  const a = clamp(detailT / 0.2);
  ctx.globalAlpha = a * 0.55;
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;

  const w = Math.min(W - 60, 320);
  const titleFont = font(20, 'bold');
  const titleLines = wrapText(ctx, detail.title, w - 34, titleFont).slice(0, 2);
  const titleH = titleLines.length * 24;
  const textH = detail.lines.length * 25;
  const h = 196 + (titleLines.length - 1) * 24 + textH;
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
  ctx.font = titleFont;
  drawLines(ctx, titleLines, W / 2, y + 110, 24);
  ctx.fillStyle = COLORS.muted;
  ctx.font = font(13);
  ctx.textAlign = 'center';
  ctx.fillText(detail.sub, W / 2, y + 110 + titleH + 12);
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = font(15);
  drawLines(ctx, detail.lines, W / 2, y + 142 + titleH, 25);
  ctx.fillStyle = COLORS.muted;
  ctx.font = font(12);
  ctx.fillText('点一下合上', W / 2, y + h - 18);
  ctx.globalAlpha = 1;
}
