/**
 * 三个存档位。空位新开一任，有人就接着断。
 */
import {
  W, H, SAFE_TOP, SAFE_BOTTOM,
} from '../core/screen.js';
import { go } from '../core/router.js';
import { session, clearProgress } from '../session.js';
import { slotSummary, slotFaceLines } from '../game/slots.js';
import { paperBackground } from '../ui/paper.js';
import { COLORS, font } from '../ui/theme.js';
import { Button, ButtonGroup, roundRect } from '../ui/widgets.js';

const ROW_TOP = 96;
const ROW_H = 100;
const ROW_GAP = 16;

let t = 0;
let armed = -1;
let armedUntil = 0;
const buttons = new ButtonGroup();
const rows = [];

function layout() {
  buttons.clear();
  rows.length = 0;
  buttons.add(new Button({
    x: 8, y: SAFE_TOP + 4, w: 70, h: 36, label: '‹ 返回', kind: 'text', fontSize: 15,
    onTap: (x, y) => go('title', {}, { x, y }),
  }));
  session.slots.forEach((slot, i) => {
    const y = SAFE_TOP + ROW_TOP + i * (ROW_H + ROW_GAP);
    const summary = slotSummary(slot);
    rows.push({ y, summary });
    if (summary) {
      buttons.add(new Button({
        x: W - 24 - 72, y: y + 30, w: 72, h: 40, kind: 'text', fontSize: 14,
        label: '撤任',
        onTap: (x, y) => {
          if (armed === i && t < armedUntil) {
            session.slot = i;
            clearProgress();
            go('play', { slot: i }, { x, y });
            return;
          }
          armed = i;
          armedUntil = t + 2.2;
        },
      }));
    }
    const label = summary ? '' : '空位 · 新开一任';
    buttons.add(new Button({
      x: 24, y, w: summary ? W - 48 - 84 : W - 48, h: ROW_H, kind: 'ghost', fontSize: 16,
      label,
      onTap: (x, y) => {
        session.slot = i;
        go('play', { slot: i }, { x, y });
      },
    }));
  });
}

export default {
  enter() {
    t = 0;
    armed = -1;
    armedUntil = 0;
    layout();
  },

  update(dt) {
    t += dt;
    buttons.update(dt);
    buttons.list.forEach((b) => {
      if (b.label === '撤任' || b.label === '再点就撤') {
        const index = rows.findIndex((row) => Math.abs((row.y + 30) - b.y) < 1 && row.summary);
        b.label = armed === index && t < armedUntil ? '再点就撤' : '撤任';
      }
    });
  },

  draw(ctx) {
    const bg = paperBackground();
    ctx.drawImage(bg.canvas, 0, 0, W, H);
    const fade = Math.min(1, t * 2.6);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = COLORS.ink;
    ctx.font = font(22, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('位子', W / 2, SAFE_TOP + 28);
    ctx.fillStyle = COLORS.muted;
    ctx.font = font(13);
    ctx.fillText('退堂之后还在 · 三个位子，各放一任', W / 2, SAFE_TOP + 58);
    ctx.restore();
    buttons.draw(ctx);
    rows.forEach((row) => {
      if (!row.summary) {
        return;
      }
      const face = slotFaceLines(row.summary);
      const w = W - 48 - 84;
      ctx.fillStyle = COLORS.ink;
      ctx.font = font(14, 'bold');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      face.forEach((ln, i) => {
        ctx.fillText(ln, 24 + w / 2, row.y + 34 + i * 22);
      });
      ctx.fillStyle = COLORS.inkSoft;
      ctx.font = font(13);
      ctx.textAlign = 'left';
      ctx.fillText(`${row.summary.age}岁`, 40, row.y + ROW_H - 22);
    });
    if (session.slots.some(Boolean)) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = font(12);
      ctx.textAlign = 'center';
      ctx.fillText('撤任会清掉这个位子上没断完的一任', W / 2, H - SAFE_BOTTOM - 16);
    }
  },

  onDown(x, y) {
    buttons.onDown(x, y);
  },
  onMove(x, y) {
    buttons.onMove(x, y);
  },
  onUp(x, y) {
    buttons.onUp(x, y);
  },
};

export const SLOT_OPEN_Y = ROW_TOP + ROW_H / 2;
