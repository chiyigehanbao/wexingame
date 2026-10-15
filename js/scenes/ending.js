/**
 * 下台：印章落下、墓志铭式结局文、再任一届。
 */
import {
  W, H, SAFE_TOP, SAFE_BOTTOM, ctx as screenCtx,
} from '../core/screen.js';
import { go } from '../core/router.js';
import { play } from '../core/audio.js';
import { vibrate, shareNow } from '../core/platform.js';
import { adsReady, maybeInterstitial, showRewarded } from '../core/ads.js';
import { session, keepBlessing } from '../session.js';
import {
  clamp, easeInCubic, easeOutCubic, progress,
} from '../core/tween.js';
import { ENDINGS, ENDING_ORDER } from '../data/endings.js';
import { RANKS, careerAge, yearOf } from '../game/run.js';
import { achievementCount, countEndings } from '../game/meta.js';
import { paperBackground } from '../ui/paper.js';
import { COLORS, font } from '../ui/theme.js';
import { wrapText, drawLines, countChars } from '../ui/text.js';
import {
  Button, ButtonGroup, drawSeal, roundRect,
} from '../ui/widgets.js';

const TEXT_FONT = font(16);
const TEXT_LINE = 27;
const STAMP_AT = 0.35;
const STAMP_DUR = 0.28;

let t = 0;
let run = null;
let result = null;
let ending = null;
let lines = [];
let notes = [];
let reveal = 0;
let stamped = false;
const splats = [];
const buttons = new ButtonGroup();
const L = {};
let incenseBtn = null;
let incenseNote = '';
let incenseBusy = false;
let rewardedHere = false;

function unlockNotes(before, after) {
  const out = [];
  if (before.runs < 1 && after.runs >= 1) {
    out.push('听说西巷老宅，最近夜里总有动静……');
  }
  if (countEndings(before) < 2 && countEndings(after) >= 2) {
    out.push('听说朝廷要派钦差下来巡查了……');
  }
  return out;
}

function offerIncense() {
  if (incenseBusy || session.meta.blessing) {
    return;
  }
  incenseBusy = true;
  showRewarded().then((ok) => {
    incenseBusy = false;
    if (!ok) {
      incenseNote = '这炷香没点着';
      return;
    }
    keepBlessing();
    rewardedHere = true;
    incenseNote = '香火备下了，下一任用';
    if (incenseBtn) {
      incenseBtn.visible = false;
    }
  });
}

function layout() {
  L.seal = Math.min(116, W * 0.3);
  L.sealY = SAFE_TOP + 24 + L.seal / 2;
  L.titleY = L.sealY + L.seal / 2 + 56;
  L.infoY = L.titleY + 32;
  L.textTop = L.infoY + 48;
  L.textW = W - 64;
  const bw = Math.min(240, W - 80);
  const by = H - SAFE_BOTTOM - 118;
  buttons.clear();
  incenseBtn = null;
  L.buttonsTop = by;
  if (adsReady() && !session.meta.blessing) {
    incenseBtn = buttons.add(new Button({
      x: (W - bw) / 2, y: by - 48, w: bw, h: 40, label: '烧一炷香', kind: 'ghost', fontSize: 15,
      onTap: () => offerIncense(),
    }));
    L.buttonsTop = by - 68;
  }
  buttons.add(new Button({
    x: (W - bw) / 2, y: by, w: bw, h: 52, label: '再来一任',
    onTap: (x, y) => {
      play('gavel', 0.9);
      const ink = { x, y };
      maybeInterstitial(session.meta.runs, rewardedHere).then(() => go('play', {}, ink));
    },
  }));
  const half = (bw - 12) / 2;
  buttons.add(new Button({
    x: (W - bw) / 2, y: by + 64, w: half, h: 42, label: '历任档案', kind: 'ghost', fontSize: 15,
    onTap: (x, y) => go('archive', {}, { x, y }),
  }));
  buttons.add(new Button({
    x: (W - bw) / 2 + half + 12, y: by + 64, w: half, h: 42, label: '分享', kind: 'ghost', fontSize: 15,
    onTap: () => shareNow(),
  }));
}

function burst() {
  splats.length = 0;
  for (let i = 0; i < 22; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 160;
    splats.push({
      x: W / 2, y: L.sealY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 1.5 + Math.random() * 4,
    });
  }
}

export default {
  enter(params) {
    run = params.run;
    result = params.result;
    ending = ENDINGS[run.ending];
    t = 0;
    reveal = 0;
    stamped = false;
    splats.length = 0;
    incenseNote = '';
    incenseBusy = false;
    rewardedHere = false;
    layout();
    lines = wrapText(screenCtx, ending.text, L.textW, TEXT_FONT);
    notes = unlockNotes(result.before, result.meta);
    if (result.deed) {
      const times = achievementCount(result.meta.achievements?.[result.deed.id]) || 1;
      notes.unshift(times > 1 ? `功名 · ${result.deed.name} · 第${times}次` : `功名 · ${result.deed.name}`);
    }
  },

  update(dt) {
    t += dt;
    buttons.update(dt);
    if (!stamped && t >= STAMP_AT + STAMP_DUR) {
      stamped = true;
      burst();
      play('gavel', 1);
      vibrate('heavy');
    }
    splats.forEach((s) => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.88;
      s.vy *= 0.88;
    });
    if (t > STAMP_AT + STAMP_DUR + 0.5) {
      reveal = Math.min(countChars(lines), reveal + dt * 40);
    }
  },

  draw(ctx) {
    const bg = paperBackground();
    let shake = 0;
    const since = t - (STAMP_AT + STAMP_DUR);
    if (since > 0 && since < 0.25) {
      shake = Math.sin(since * 90) * 4 * (1 - since / 0.25);
    }
    ctx.save();
    ctx.translate(shake, 0);
    ctx.drawImage(bg.canvas, 0, 0, W, H);

    ctx.fillStyle = COLORS.red;
    splats.forEach((s) => {
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const sp = progress(t, STAMP_AT, STAMP_DUR);
    if (sp > 0) {
      const scale = 1 + (1 - easeInCubic(sp)) * 1.8;
      drawSeal(ctx, ending.seal, W / 2, L.sealY, L.seal, 'square', COLORS.red, {
        scale, rotate: -0.06, alpha: clamp(sp * 3),
      });
    }

    const a = easeOutCubic(progress(t, STAMP_AT + STAMP_DUR + 0.1, 0.5));
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleFont = font(26, 'bold');
    const titleLines = wrapText(ctx, ending.title, W - 32, titleFont).slice(0, 2);
    const titleExtra = (titleLines.length - 1) * 30;
    ctx.fillStyle = COLORS.ink;
    ctx.font = titleFont;
    drawLines(ctx, titleLines, W / 2, L.titleY - 15, 30);

    ctx.fillStyle = COLORS.muted;
    ctx.font = font(14);
    ctx.textAlign = 'center';
    const rank = RANKS[run.rank] || '县令';
    const infoY = L.infoY + titleExtra;
    ctx.fillText(`${rank} · ${careerAge(run)}岁 · 第${yearOf(run.day)}年`, W / 2, infoY);
    ctx.fillText(`在任 ${run.day} 天 · 最长 ${result.meta.best} 天`, W / 2, infoY + 20);

    const tags = [];
    if (result.isNewEnding) {
      tags.push('头一回见');
    }
    if (result.isBest && result.before.runs > 0) {
      tags.push('在任更久');
    }
    tags.forEach((tag, i) => {
      const tx = W / 2 + (i - (tags.length - 1) / 2) * 96;
      const ty = L.sealY + L.seal / 2 + 22;
      ctx.save();
      ctx.translate(tx + (i % 2 ? 6 : -6), ty);
      ctx.rotate(i % 2 ? 0.06 : -0.06);
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 1.3;
      roundRect(ctx, -36, -11, 72, 22, 3);
      ctx.stroke();
      ctx.fillStyle = COLORS.red;
      ctx.font = font(12, 'bold');
      ctx.fillText(tag, 0, 1);
      ctx.restore();
    });

    ctx.fillStyle = COLORS.ink;
    ctx.font = TEXT_FONT;
    const textY = L.textTop + titleExtra;
    const textH = drawLines(ctx, lines, W / 2, textY, TEXT_LINE, { visible: Math.floor(reveal) });

    const done = reveal >= countChars(lines);
    if (done && notes.length) {
      ctx.fillStyle = COLORS.red;
      ctx.font = font(14);
      ctx.textAlign = 'center';
      notes.forEach((n, i) => {
        const ny = textY + textH + 22 + i * 24;
        if (ny < L.buttonsTop - 10) {
          ctx.fillText(n, W / 2, ny);
        }
      });
    }

    ctx.globalAlpha = easeOutCubic(progress(t, STAMP_AT + STAMP_DUR + 0.7, 0.5));
    if (adsReady() && (incenseNote || (incenseBtn && incenseBtn.visible))) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = font(12);
      ctx.textAlign = 'center';
      ctx.fillText(incenseNote || '这炷香看完，下一任暖一点', W / 2, L.buttonsTop + 12);
    }
    buttons.draw(ctx);
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.muted;
    ctx.font = font(12);
    ctx.textAlign = 'center';
    ctx.globalAlpha = a * 0.8;
    ctx.fillText(`见过 ${countEndings(result.meta)} 种收场`, W / 2, H - SAFE_BOTTOM - 4);
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  onDown(x, y) {
    if (t < STAMP_AT + STAMP_DUR + 0.6) {
      return;
    }
    if (!buttons.onDown(x, y)) {
      reveal = countChars(lines);
    }
  },
  onMove(x, y) {
    buttons.onMove(x, y);
  },
  onUp(x, y) {
    buttons.onUp(x, y);
  },
};
