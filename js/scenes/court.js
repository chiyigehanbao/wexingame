/**
 * 朝廷：国号、三道朝局、官级。只看，不另开一种玩法。
 */
import {
  W, H, SAFE_TOP,
} from '../core/screen.js';
import { go } from '../core/router.js';
import { clamp } from '../core/tween.js';
import { session } from '../session.js';
import { RANKS } from '../game/ranks.js';
import { careerAge, yearOf, pathScentLine, COUNTY_NAMES } from '../game/run.js';
import { paperBackground } from '../ui/paper.js';
import { COLORS, font } from '../ui/theme.js';
import { Button, ButtonGroup, roundRect } from '../ui/widgets.js';
import { drawRankPyramid, courtScrollMax } from '../ui/pyramid.js';

const buttons = new ButtonGroup();
let t = 0;
let scroll = 0;
let scrollTarget = 0;
let maxScroll = 0;
let touch = null;

function newsCount() {
  const news = session.run && Array.isArray(session.run.news) ? session.run.news : [];
  return news.length;
}

function layout() {
  buttons.clear();
  buttons.add(new Button({
    x: 8, y: SAFE_TOP + 4, w: 70, h: 36, label: '‹ 返回', kind: 'text', fontSize: 15,
    onTap: (x, y) => go('play', { slot: session.slot }, { x, y }),
  }));
}

function bar(ctx, label, value, y, color) {
  const v = Math.max(0, Math.min(100, value));
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = font(14);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 32, y);
  ctx.textAlign = 'right';
  ctx.fillText(String(Math.round(v)), W - 32, y);
  ctx.fillStyle = 'rgba(43, 38, 34, 0.08)';
  roundRect(ctx, 32, y + 16, W - 64, 8, 4);
  ctx.fill();
  ctx.fillStyle = color;
  const width = Math.max(v > 0 ? 8 : 0, ((W - 64) * v) / 100);
  roundRect(ctx, 32, y + 16, width, 8, 4);
  ctx.fill();
}

export default {
  enter() {
    t = 0;
    scroll = 0;
    scrollTarget = 0;
    touch = null;
    layout();
  },

  update(dt) {
    t += dt;
    buttons.update(dt);
    maxScroll = courtScrollMax({ safeTop: SAFE_TOP, height: H, newsCount: newsCount() });
    scrollTarget = clamp(scrollTarget, 0, maxScroll);
    scroll += (scrollTarget - scroll) * Math.min(1, dt * 12);
  },

  draw(ctx) {
    const bg = paperBackground();
    ctx.drawImage(bg.canvas, 0, 0, W, H);
    const run = session.run;
    ctx.fillStyle = COLORS.ink;
    ctx.font = font(22, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('朝廷', W / 2, SAFE_TOP + 28);
    if (!run) {
      buttons.draw(ctx);
      return;
    }

    const fade = Math.min(1, t * 2.4);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, SAFE_TOP + 52, W, H - SAFE_TOP - 52);
    ctx.clip();
    ctx.translate(0, -scroll);
    ctx.globalAlpha = fade;
    ctx.fillStyle = COLORS.redDeep;
    ctx.font = font(28, 'bold');
    ctx.fillText(run.dynasty || '承平', W / 2, SAFE_TOP + 92);
    ctx.fillStyle = COLORS.muted;
    ctx.font = font(13);
    ctx.fillText(`${RANKS[run.rank] || '县令'} · ${careerAge(run)}岁 · 第${yearOf(run.day)}年`, W / 2, SAFE_TOP + 124);
    const mood = (run.virtue ?? 62) >= 55 ? '正直' : '浑浊';
    const troop = (run.rank || 0) >= 1 ? ` · 兵 ${run.troops || 0}` : '';
    const scent = pathScentLine(run);
    const county = COUNTY_NAMES[(run.county && run.county[0]) || 'poor'] || '穷县';
    ctx.fillText(`朝风${mood}${troop}`, W / 2, SAFE_TOP + 148);
    ctx.fillStyle = COLORS.muted;
    ctx.font = font(12);
    ctx.fillText(scent ? `${county} · ${scent}` : county, W / 2, SAFE_TOP + 166);

    let y = SAFE_TOP + 182;
    bar(ctx, '国势', run.guoshi ?? 55, y, COLORS.red);
    bar(ctx, '民心', run.stats.people, y + 46, COLORS.jade);
    bar(ctx, '边警', run.bianjing ?? 30, y + 92, COLORS.gold);

    const news = Array.isArray(run.news) ? run.news.slice(0, 3) : [];
    let ny = y + 136;
    ctx.fillStyle = COLORS.ink;
    ctx.font = font(15, 'bold');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('朝报', 32, ny);
    ctx.font = font(13);
    ctx.fillStyle = COLORS.muted;
    if (!news.length) {
      ctx.fillText('京里还没信来', 32, ny + 24);
      ny += 48;
    } else {
      news.forEach((item, i) => {
        ctx.fillText(item.text, 32, ny + 24 + i * 20);
      });
      ny += 28 + news.length * 20;
    }

    ctx.fillStyle = COLORS.ink;
    ctx.font = font(15, 'bold');
    ctx.fillText('官级', 32, ny + 8);
    drawRankPyramid(ctx, W / 2, ny + 28, W - 96, { current: run.rank });
    ctx.restore();
    buttons.draw(ctx);
    if (maxScroll > 12 && scroll < maxScroll - 12) {
      const floor = H - 28;
      ctx.fillStyle = COLORS.paper;
      ctx.fillRect(0, floor - 4, W, H - floor + 4);
      ctx.fillStyle = COLORS.muted;
      ctx.font = font(12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('往下还有', W / 2, floor + 14);
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
