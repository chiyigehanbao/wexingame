/**
 * 规矩：怎么断、官级、朝廷、存档。
 */
import {
  W, H, SAFE_TOP, SAFE_BOTTOM, ctx as screenCtx,
} from '../core/screen.js';
import { go } from '../core/router.js';
import { clamp } from '../core/tween.js';
import { RULES } from '../data/rules.js';
import { paperBackground } from '../ui/paper.js';
import { COLORS, font } from '../ui/theme.js';
import { wrapText, drawLines } from '../ui/text.js';
import { Button, ButtonGroup, roundRect } from '../ui/widgets.js';
import { drawRankPyramid, pyramidHeight } from '../ui/pyramid.js';

const blocks = [];
let scroll = 0;
let scrollTarget = 0;
let maxScroll = 0;
let touch = null;
const buttons = new ButtonGroup();

function layout() {
  buttons.clear();
  buttons.add(new Button({
    x: 8, y: SAFE_TOP + 4, w: 70, h: 36, label: '‹ 返回', kind: 'text', fontSize: 15,
    onTap: (x, y) => go('title', {}, { x, y }),
  }));
  blocks.length = 0;
  let y = SAFE_TOP + 72;
  const cardW = W - 40;
  RULES.forEach(([title, body]) => {
    const pyramid = title === '官级';
    const lines = wrapText(screenCtx, body, cardW - 36, font(15));
    const extra = pyramid ? pyramidHeight() + 12 : 0;
    const h = 46 + lines.length * 24 + extra + 16;
    blocks.push({ title, lines, y, h, pyramid });
    y += h + 12;
  });
  const floor = H - Math.max(SAFE_BOTTOM, 28) - 8;
  maxScroll = Math.max(0, y + 8 - floor);
}

export default {
  enter() {
    scroll = 0;
    scrollTarget = 0;
    touch = null;
    layout();
  },

  update(dt) {
    buttons.update(dt);
    scroll += (scrollTarget - scroll) * Math.min(1, dt * 12);
  },

  draw(ctx) {
    const bg = paperBackground();
    ctx.drawImage(bg.canvas, 0, 0, W, H);
    const floor = H - Math.max(SAFE_BOTTOM, 28);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, SAFE_TOP + 52, W, floor - SAFE_TOP - 52);
    ctx.clip();
    ctx.translate(0, -scroll);
    blocks.forEach((block) => {
      ctx.fillStyle = 'rgba(255, 251, 244, 0.96)';
      roundRect(ctx, 20, block.y, W - 40, block.h, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(43, 38, 34, 0.14)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = COLORS.red;
      roundRect(ctx, 32, block.y + 16, 4, 16, 2);
      ctx.fill();
      ctx.fillStyle = COLORS.redDeep;
      ctx.font = font(16, 'bold');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(block.title, 44, block.y + 24);
      let bodyY = block.y + 40;
      if (block.pyramid) {
        drawRankPyramid(ctx, W / 2, block.y + 48, W - 96);
        bodyY = block.y + 48 + pyramidHeight() + 4;
      }
      ctx.fillStyle = COLORS.ink;
      ctx.font = font(15);
      drawLines(ctx, block.lines, 34, bodyY, 24, { align: 'left' });
    });
    ctx.restore();

    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, SAFE_TOP + 52);
    ctx.fillStyle = COLORS.ink;
    ctx.font = font(22, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('规矩', W / 2, SAFE_TOP + 28);
    buttons.draw(ctx);
    if (maxScroll > 12 && scroll < maxScroll - 12) {
      ctx.fillStyle = COLORS.paper;
      ctx.fillRect(0, floor - 4, W, H - floor + 4);
      ctx.fillStyle = COLORS.muted;
      ctx.font = font(12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('往下还有', W / 2, floor + Math.max(SAFE_BOTTOM, 28) / 2);
    }
  },

  onDown(x, y) {
    if (buttons.onDown(x, y)) {
      return;
    }
    touch = { y, sy: scrollTarget, moved: false };
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
    }
  },
  onUp(x, y) {
    buttons.onUp(x, y);
    touch = null;
  },
};
