/**
 * 升堂：拖动卡牌左右决断。
 */
import {
  W, H, SAFE_TOP, SAFE_BOTTOM, ctx as screenCtx,
} from '../core/screen.js';
import { go } from '../core/router.js';
import {
  play, chime, ambient, warmPlaySounds,
} from '../core/audio.js';
import { vibrate, setShareTitle } from '../core/platform.js';
import {
  clamp, damp, followGrab, easeOutCubic, easeInCubic, easeOutBack, progress,
} from '../core/tween.js';
import { CARDS } from '../data/cards.js';
import { CHARACTERS } from '../data/characters.js';
import { ENDINGS } from '../data/endings.js';
import {
  createRun, drawCard, choose, formatCardText, seasonOf,
  careerAge, yearOf, reignHeaderLines, clearReignHeader, foldNotice, waitingNotices, showingNotice, RANKS,
} from '../game/run.js';
import { echoOf } from '../data/echoes.js';
import { STAT_KEYS, applyFx, fxMagnitude } from '../game/stats.js';
import { session, finishRun, saveProgress, clearProgress, consumeBlessing } from '../session.js';
import { deskBackground } from '../ui/paper.js';
import { COLORS, font, STAT_META } from '../ui/theme.js';
import { wrapText, drawLines, countChars, bandFontSize } from '../ui/text.js';
import {
  roundRect, drawSeal, Button, ButtonGroup,
} from '../ui/widgets.js';

const TEXT_FONT = font(18);
const TEXT_LINE = 30;
const TEXT_MAX_LINES = 5;
const CHARS_PER_SEC = 36;
const FLIP_DUR = 0.42;
const FLY_DUR = 0.3;
const ICON = 38;

const L = {};
let run = null;
let card = null;
let lines = [];
let reveal = 0;
let ticked = 0;
let phase = 'flip';
let phaseT = 0;
let t = 0;
let idleT = 0;
/** 首任引导晃过两次或玩家已动手，就不再晃。 */
let guideDone = false;

const drag = {
  active: false, sx: 0, sy: 0, ox: 0, oy: 0, x: 0, y: 0, lx: 0, lt: 0, vx: 0, armed: false,
};
let cardX = 0;
let cardY = 0;
let fly = { dir: 1, x0: 0, y0: 0 };
let textAlpha = 1;
let shownDay = 1;
const shown = {};
const flashes = {};
let brokenKey = null;
let lastEcho = '';
let pendingEcho = '';
let notice = '';
let noticeUntil = 0;
let noticePending = [];

const SEASON_LABEL = {
  spring: '春', summer: '夏', autumn: '秋', winter: '冬',
};
const SEASON_TINT = {
  spring: 'rgba(70, 110, 60, 0.05)',
  summer: 'rgba(170, 90, 40, 0.05)',
  autumn: 'rgba(150, 80, 20, 0.07)',
  winter: 'rgba(60, 80, 110, 0.07)',
};
const buttons = new ButtonGroup();
let quitBtn = null;
let quitArmedUntil = 0;
let laidLines = 0;

function currentHeaderLines() {
  if (!run) {
    return 1;
  }
  return reignHeaderLines({
    year: yearOf(run.day),
    season: SEASON_LABEL[seasonOf(run.day)],
    rank: RANKS[run.rank] || '县令',
    age: careerAge(run),
    troops: run.rank >= 1 ? (run.troops || 0) : null,
    width: W,
  }).length;
}

function layout() {
  L.iconTop = SAFE_TOP + 8;
  L.reignY = L.iconTop + ICON + 48;
  L.textW = W - 64;
  const contentTop = L.reignY + 48;
  const contentBottom = H - SAFE_BOTTOM - 58;
  const textSlot = TEXT_MAX_LINES * TEXT_LINE;
  const gap = 22;
  let cardW = Math.min(W - 72, 292);
  let cardH = cardW * 1.16;
  const maxCard = contentBottom - contentTop - textSlot - gap;
  if (cardH > maxCard) {
    cardH = Math.max(180, maxCard);
    cardW = cardH / 1.16;
  }
  L.cardW = cardW;
  L.cardH = cardH;
  L.cardCX = W / 2;
  L.cardCY = contentBottom - 18 - cardH / 2;
  L.textBottom = L.cardCY - cardH / 2 - gap;
  L.textTop = L.textBottom - textSlot;
  const fitted = clearReignHeader({
    reignY: L.reignY, cardH, textTop: L.textTop, lineCount: currentHeaderLines(), echo: 26,
  });
  if (fitted.shift) {
    L.cardH = fitted.cardH;
    L.cardW = L.cardH / 1.16;
    L.cardCY += fitted.shift / 2;
    L.textBottom += fitted.shift;
    L.textTop += fitted.shift;
  }
  L.deskTop = Math.round(L.cardCY + L.cardH * 0.18);
  L.hintY = L.cardCY + L.cardH / 2 + 22;
  laidLines = currentHeaderLines();
  const margin = W * 0.14;
  L.statX = STAT_KEYS.map((_, i) => margin + ((W - margin * 2) / 3) * i);
}

function setCard(c) {
  card = c;
  const text = formatCardText(c, run, session.meta, ENDINGS);
  lines = wrapText(screenCtx, text, L.textW, TEXT_FONT);
  reveal = 0;
  ticked = 0;
  phase = 'flip';
  phaseT = 0;
  idleT = 0;
  cardX = 0;
  cardY = 0;
  lastEcho = pendingEcho;
  pendingEcho = '';
  play('paper', 0.7);
}

function commit(side) {
  pendingEcho = echoOf(card.id, side);
  const res = choose(run, card, side, Math.random);
  phase = 'fly';
  phaseT = 0;
  fly = { dir: side === 'right' ? 1 : -1, x0: cardX, y0: cardY };
  drag.active = false;
  play('wood', 0.8);
  vibrate('light');

  let ups = 0;
  let downs = 0;
  Object.keys(res.delta).forEach((k) => {
    const d = res.delta[k];
    flashes[k] = { t: 0, dir: Math.sign(d), amount: d, big: fxMagnitude(d) >= 3 };
    if (d > 0) {
      ups += 1;
    } else {
      downs += 1;
    }
  });
  if (ups + downs > 0) {
    setTimeout(() => chime(ups >= downs), 140);
  }

  if (res.ending) {
    const m = res.ending.match(/^(people|money|court|heart)_/);
    brokenKey = m ? m[1] : null;
  }
}

function persist() {
  saveProgress(run, card && card.id, lastEcho);
}

function finishFly() {
  if (run.ending) {
    phase = 'ending';
    phaseT = 0;
    return;
  }
  setCard(drawCard(run, CARDS, session.meta, Math.random));
  persist();
}

function goEnding() {
  clearProgress();
  const result = finishRun(run);
  const ending = ENDINGS[run.ending];
  setShareTitle(ending.share.replace('{d}', String(run.day)));
  play('gong', 0.7);
  vibrate('heavy');
  go('ending', { run, result }, { x: L.cardCX, y: L.cardCY });
}

function makeButtons() {
  buttons.clear();
  quitBtn = buttons.add(new Button({
    x: 10, y: H - SAFE_BOTTOM - 34, w: 76, h: 30, kind: 'text', label: '退堂', fontSize: 13,
    color: 'rgba(251, 246, 234, 0.7)',
    onTap: (x, y) => {
      if (run.ending) {
        return;
      }
      if (t < quitArmedUntil) {
        persist();
        go('title', {}, { x, y });
        return;
      }
      quitArmedUntil = t + 2.2;
    },
  }));
  buttons.add(new Button({
    x: W - 86, y: H - SAFE_BOTTOM - 34, w: 76, h: 30, kind: 'text', label: '朝廷', fontSize: 13,
    color: 'rgba(251, 246, 234, 0.7)',
    onTap: (x, y) => {
      if (run.ending) {
        return;
      }
      persist();
      go('court', {}, { x, y });
    },
  }));
}

export default {
  enter(params = {}) {
    warmPlaySounds();
    if (Number.isInteger(params.slot)) {
      session.slot = params.slot;
    }
    const saved = session.slots[session.slot];
    const resume = saved && saved.run && !saved.run.ending;
    run = resume ? saved.run : createRun(session.meta);
    if (!resume) {
      const blessing = consumeBlessing();
      if (blessing) {
        run.stats = applyFx(run.stats, blessing);
        run.notice = '香火还在';
      }
    }
    session.run = run;
    STAT_KEYS.forEach((k) => {
      shown[k] = run.stats[k];
      delete flashes[k];
    });
    shownDay = run.day;
    brokenKey = null;
    lastEcho = '';
    pendingEcho = '';
    const onScreen = showingNotice(run);
    notice = onScreen.text;
    noticeUntil = onScreen.left;
    noticePending = waitingNotices(run);
    drag.active = false;
    t = 0;
    quitArmedUntil = 0;
    textAlpha = 1;
    guideDone = session.meta.runs > 0 || (resume && run.draws > 2);
    makeButtons();
    layout();
    const existing = resume && CARDS.find((c) => c.id === saved.cardId);
    if (existing) {
      pendingEcho = saved.echo || '';
      setCard(existing);
    } else {
      setCard(drawCard(run, CARDS, session.meta, Math.random));
    }
    persist();
  },

  update(dt, now) {
    t += dt;
    phaseT += dt;
    if (currentHeaderLines() !== laidLines) {
      layout();
    }
    buttons.update(dt);
    quitBtn.label = t < quitArmedUntil ? '再点退堂' : '退堂';
    ambient(now, 0.1);

    STAT_KEYS.forEach((k) => {
      shown[k] = damp(shown[k], run.stats[k], 7, dt);
      if (flashes[k]) {
        flashes[k].t += dt;
        if (flashes[k].t > 1) {
          delete flashes[k];
        }
      }
    });
    shownDay = damp(shownDay, run.day, 8, dt);
    const folded = foldNotice({
      showing: notice,
      until: noticeUntil,
      pending: noticePending,
      now: t,
      incoming: run.notice || '',
    });
    run.notice = '';
    if (folded.chime) {
      chime(folded.high);
    }
    notice = folded.notice;
    noticeUntil = folded.until;
    noticePending = folded.pending;
    run.noticeQueue = folded.pending;
    const left = Math.max(0, folded.until - t);
    run.noticeLine = left > 0 && folded.notice ? folded.notice : '';
    run.noticeLeft = run.noticeLine ? left : 0;

    if (phase === 'flip' && phaseT >= FLIP_DUR) {
      phase = 'idle';
      phaseT = 0;
    }
    if (phase === 'flip' || phase === 'idle') {
      textAlpha = damp(textAlpha, 1, 12, dt);
      if (phase === 'idle' || phaseT > FLIP_DUR * 0.5) {
        const total = countChars(lines);
        reveal = Math.min(total, reveal + dt * CHARS_PER_SEC);
        if (Math.floor(reveal / 3) > ticked && reveal < total) {
          ticked = Math.floor(reveal / 3);
          play('tick', 0.25);
        }
      }
    } else {
      textAlpha = damp(textAlpha, 0, 18, dt);
    }

    if (phase === 'idle') {
      if (drag.active) {
        cardX = drag.x;
        cardY = drag.y;
        idleT = 0;
      } else {
        cardX = damp(cardX, 0, 36, dt);
        cardY = damp(cardY, 0, 36, dt);
        if (Math.abs(cardX) < 1) {
          cardX = 0;
        }
        if (Math.abs(cardY) < 1) {
          cardY = 0;
        }
        idleT += dt;
        if (!guideDone && session.meta.runs === 0 && run.draws <= 2) {
          const textReady = reveal >= countChars(lines);
          if (textReady && idleT > 2.4) {
            const elapsed = idleT - 2.4;
            const cycle = Math.floor(elapsed / 3.4);
            if (cycle >= 2) {
              guideDone = true;
            } else {
              const w = elapsed % 3.4;
              if (w < 0.95) {
                cardX = Math.sin(w * Math.PI * 4) * 12 * (1 - w / 0.95);
              }
            }
          }
        }
      }
    }
    if (phase === 'fly' && phaseT >= FLY_DUR) {
      finishFly();
    }
    if (phase === 'ending' && phaseT >= (brokenKey ? 1.1 : 0.6)) {
      phase = 'done';
      goEnding();
    }
  },

  draw(ctx) {
    const bg = deskBackground(L.deskTop);
    ctx.drawImage(bg.canvas, 0, 0, W, H);

    ctx.fillStyle = SEASON_TINT[seasonOf(run.day)];
    ctx.fillRect(0, 0, W, H);
    drawStats(ctx);
    drawReign(ctx);
    drawText(ctx);
    drawDeck(ctx);
    drawActiveCard(ctx);
    drawChoices(ctx);
    drawHint(ctx);
    buttons.draw(ctx);
  },

  onDown(x, y) {
    if (buttons.onDown(x, y)) {
      return;
    }
    reveal = countChars(lines);
    if (phase !== 'idle' || y < L.textTop) {
      return;
    }
    guideDone = true;
    Object.assign(drag, {
      active: true, sx: x, sy: y, ox: cardX, oy: cardY, x: cardX, y: cardY,
      lx: x, lt: Date.now(), vx: 0, armed: Math.abs(cardX) > W * 0.18,
    });
  },

  onMove(x, y) {
    buttons.onMove(x, y);
    if (!drag.active) {
      return;
    }
    const now = Date.now();
    const dtMs = Math.max(1, now - drag.lt);
    drag.vx = drag.vx * 0.6 + ((x - drag.lx) / dtMs) * 0.4;
    drag.lx = x;
    drag.lt = now;
    drag.x = followGrab(drag.ox, drag.sx, x);
    drag.y = followGrab(drag.oy, drag.sy, y, 0.25);
    const armed = Math.abs(drag.x) > W * 0.18;
    if (armed !== drag.armed) {
      drag.armed = armed;
      if (armed) {
        vibrate('light');
        play('tick', 0.5);
      } else {
        play('tick', 0.22);
      }
    }
  },

  onUp(x, y) {
    if (buttons.onUp(x, y)) {
      return;
    }
    if (!drag.active) {
      return;
    }
    drag.x = followGrab(drag.ox, drag.sx, x);
    drag.y = followGrab(drag.oy, drag.sy, y, 0.25);
    cardX = drag.x;
    cardY = drag.y;
    drag.active = false;
    const dx = drag.x;
    const travel = x - drag.sx;
    const flick = Math.abs(drag.vx) > 0.7 && Math.abs(dx) > 30 && Math.sign(drag.vx) === Math.sign(dx);
    if (Math.abs(dx) > W * 0.18 || flick) {
      commit(dx > 0 ? 'right' : 'left');
    } else if (Math.abs(travel) > 12) {
      play('paper', 0.28);
    }
  },
};

/* ———————————————————— 绘制 ———————————————————— */

function dragAmount() {
  if (phase !== 'idle') {
    return 0;
  }
  return clamp((Math.abs(cardX) - 8) / 70);
}

function currentSide() {
  return cardX >= 0 ? 'right' : 'left';
}

function drawStats(ctx) {
  const amt = dragAmount();
  const fx = amt > 0 && card ? (card[currentSide()]?.fx || {}) : {};
  STAT_KEYS.forEach((k, i) => {
    const cx = L.statX[i];
    const top = L.iconTop;
    const v = shown[k];
    const danger = run.stats[k] <= 18 || run.stats[k] >= 82;
    const f = flashes[k];
    let scale = 1;
    let shakeX = 0;
    if (f) {
      scale = 1 + (f.big ? 0.2 : 0.12) * Math.sin(Math.PI * Math.min(1, f.t * 2.2));
    }
    if (phase === 'ending' && brokenKey === k) {
      shakeX = Math.sin(phaseT * 60) * 3 * (1 - phaseT / 1.1);
      scale = 1 + 0.15 * Math.min(1, phaseT * 4);
    }

    const mag = fxMagnitude(fx[k]);
    if (mag > 0) {
      ctx.globalAlpha = 0.35 + 0.65 * amt;
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, top - 11, [0, 4, 6, 8][mag], 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(cx + shakeX, top + ICON / 2);
    ctx.scale(scale, scale);
    const x = -ICON / 2;
    const y = -ICON / 2;
    ctx.fillStyle = 'rgba(251, 246, 234, 0.85)';
    roundRect(ctx, x, y, ICON, ICON, 7);
    ctx.fill();

    const fillH = (ICON - 4) * clamp(v / 100);
    const fillColor = danger ? COLORS.red : COLORS.ink;
    ctx.save();
    roundRect(ctx, x, y, ICON, ICON, 7);
    ctx.clip();
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y + ICON - 2 - fillH, ICON, fillH + 2);
    ctx.restore();

    ctx.font = font(20, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fillColor;
    ctx.fillText(STAT_META[k].glyph, 0, 1);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y + ICON - 2 - fillH, ICON, fillH + 2);
    ctx.clip();
    ctx.fillStyle = COLORS.card;
    ctx.fillText(STAT_META[k].glyph, 0, 1);
    ctx.restore();

    let strokeAlpha = 1;
    if (danger) {
      strokeAlpha = 0.55 + 0.45 * Math.sin(t * 6);
    }
    ctx.strokeStyle = danger ? COLORS.red : COLORS.ink;
    ctx.globalAlpha = strokeAlpha;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, ICON, ICON, 7);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (f) {
      const p = clamp(f.t);
      ctx.strokeStyle = f.dir > 0 ? COLORS.jade : COLORS.red;
      ctx.globalAlpha = 1 - p;
      ctx.lineWidth = 2;
      const g = 3 + p * 8;
      roundRect(ctx, x - g, y - g, ICON + g * 2, ICON + g * 2, 9 + g);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (f) {
      const p = clamp(f.t);
      ctx.globalAlpha = 1 - easeInCubic(p);
      ctx.fillStyle = f.dir > 0 ? COLORS.jade : COLORS.red;
      ctx.font = font(13, 'bold');
      ctx.textAlign = 'center';
      const sign = f.amount > 0 ? '+' : '';
      ctx.fillText(`${sign}${f.amount}`, cx, top - 12 - p * 14);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = COLORS.muted;
    ctx.font = font(12);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(STAT_META[k].label, cx, L.reignY - 22);
  });
}

function drawReign(ctx) {
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = font(13);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const season = SEASON_LABEL[seasonOf(run.day)];
  const rank = RANKS[run.rank] || '县令';
  const year = yearOf(run.day);
  const header = reignHeaderLines({
    year, season, rank, age: careerAge(run),
    troops: run.rank >= 1 ? (run.troops || 0) : null,
    width: W,
  });
  header.forEach((ln, i) => {
    ctx.fillText(ln, W / 2, L.reignY + i * 16);
  });
  const subY = L.reignY + (header.length > 1 ? 36 : 20);
  ctx.font = font(13);
  if (t < noticeUntil && notice) {
    ctx.fillStyle = COLORS.redDeep;
    ctx.font = font(14, 'bold');
    ctx.fillText(notice, W / 2, subY);
  } else {
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(`第 ${Math.round(shownDay)} 天`, W / 2, subY);
  }
}

function drawText(ctx) {
  if (textAlpha < 0.02) {
    return;
  }
  const h = lines.length * TEXT_LINE;
  const echoH = lastEcho ? 26 : 0;
  const y = L.textBottom - h;
  const padY = 12;
  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.fillStyle = 'rgba(255, 251, 244, 0.96)';
  roundRect(ctx, 20, y - padY - echoH, W - 40, h + padY * 2 + echoH, 10);
  ctx.fill();
  if (lastEcho) {
    ctx.fillStyle = COLORS.redDeep;
    ctx.font = font(13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lastEcho, W / 2, y - echoH + 2);
  }
  ctx.fillStyle = '#1a1614';
  ctx.font = TEXT_FONT;
  drawLines(ctx, lines, W / 2, y, TEXT_LINE, { visible: Math.floor(reveal) });
  ctx.restore();
}

function cardFrame(ctx, w, h) {
  roundRect(ctx, -w / 2, -h / 2, w, h, 10);
}

function drawCardBack(ctx, w, h) {
  ctx.fillStyle = COLORS.ink;
  cardFrame(ctx, w, h);
  ctx.fill();
  ctx.strokeStyle = 'rgba(181, 138, 58, 0.55)';
  ctx.lineWidth = 1.2;
  roundRect(ctx, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(181, 138, 58, 0.22)';
  roundRect(ctx, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 4);
  ctx.stroke();
  drawSeal(ctx, '衙', 0, 0, w * 0.32, 'square', COLORS.red);
}

function drawCardFront(ctx, c, w, h, amt) {
  const who = CHARACTERS[c.who];
  ctx.fillStyle = COLORS.card;
  cardFrame(ctx, w, h);
  ctx.fill();

  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.4;
  roundRect(ctx, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 6);
  ctx.stroke();
  ctx.lineWidth = 0.7;
  roundRect(ctx, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 4);
  ctx.stroke();

  const k = 12;
  ctx.lineWidth = 1.4;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
    const cx = sx * (w / 2 - 18);
    const cy = sy * (h / 2 - 18);
    ctx.beginPath();
    ctx.moveTo(cx, cy - sy * k);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx - sx * k, cy);
    ctx.stroke();
  });

  const sealSize = Math.round(w * 0.42);
  drawSeal(ctx, who.seal, 0, h * 0.02, sealSize, who.shape, who.color, { rotate: -0.04 });

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.ink;
  ctx.font = font(20, 'bold');
  ctx.fillText(who.name, 0, h * 0.3);
  ctx.fillStyle = COLORS.muted;
  ctx.font = font(13);
  ctx.fillText(who.role, 0, h * 0.3 + 22);

  if (amt > 0) {
    const label = c[currentSide()]?.label || '';
    const bandH = 36;
    const by = -h / 2 + 16;
    ctx.globalAlpha = amt;
    ctx.fillStyle = 'rgba(43, 38, 34, 0.92)';
    ctx.fillRect(-w / 2 + 12, by, w - 24, bandH);
    ctx.fillStyle = COLORS.card;
    ctx.font = font(bandFontSize(label, w), 'bold');
    ctx.textAlign = cardX >= 0 ? 'left' : 'right';
    ctx.fillText(label, cardX >= 0 ? -w / 2 + 26 : w / 2 - 26, by + bandH / 2);
    ctx.globalAlpha = 1;
  }
}

function drawDeck(ctx) {
  const w = L.cardW;
  const h = L.cardH;
  for (let i = 2; i >= 1; i -= 1) {
    ctx.save();
    ctx.translate(L.cardCX, L.cardCY + i * 4);
    ctx.rotate(i === 2 ? 0.025 : -0.018);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    drawCardBack(ctx, w, h);
    ctx.restore();
  }
}

function drawActiveCard(ctx) {
  if (!card || phase === 'ending' || phase === 'done') {
    return;
  }
  const w = L.cardW;
  const h = L.cardH;
  let x = cardX;
  let y = cardY;
  let rot = (cardX / W) * 0.45;
  let scaleX = 1;
  let back = false;
  let alpha = 1;

  if (phase === 'flip') {
    const p = easeOutCubic(progress(phaseT, 0, FLIP_DUR));
    const angle = Math.PI * (1 - p);
    scaleX = Math.max(0.02, Math.abs(Math.cos(angle)));
    back = angle > Math.PI / 2;
    y -= Math.sin(angle) * 10;
    rot = 0;
  } else if (phase === 'fly') {
    const p = easeInCubic(progress(phaseT, 0, FLY_DUR));
    x = fly.x0 + fly.dir * W * 1.1 * p;
    y = fly.y0 + p * 40;
    rot = (fly.x0 / W) * 0.45 + fly.dir * 0.5 * p;
    alpha = 1 - p * 0.3;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(L.cardCX + x, L.cardCY + y);
  ctx.rotate(rot);
  ctx.scale(scaleX, 1);
  const lift = phase === 'idle' ? dragAmount() : 0;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 14 + lift * 12;
  ctx.shadowOffsetY = 6 + lift * 8;
  if (back) {
    drawCardBack(ctx, w, h);
  } else {
    ctx.fillStyle = COLORS.card;
    cardFrame(ctx, w, h);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    drawCardFront(ctx, card, w, h, phase === 'idle' ? dragAmount() : 0);
  }
  ctx.restore();
}

function drawChoices(ctx) {
  if (!card || phase === 'ending' || phase === 'done' || phase === 'fly') {
    return;
  }
  const y = L.hintY;
  const amt = phase === 'idle' ? dragAmount() : 0;
  const hot = drag.active && Math.abs(cardX) > 12 ? currentSide() : null;
  const onWood = y > L.deskTop + 6;
  const base = onWood ? '251, 246, 234' : '43, 38, 34';
  ctx.textBaseline = 'middle';
  ctx.font = font(15, 'bold');
  [
    ['left', card.left?.label || '', 18, 'left'],
    ['right', card.right?.label || '', W - 18, 'right'],
  ].forEach(([side, label, x, align]) => {
    const guideWob = !guideDone && session.meta.runs === 0 && run.draws <= 2;
    const wob = hot || !guideWob ? 0 : Math.sin(t * 3) * 3;
    const mark = side === 'left' ? '‹ ' : ' ›';
    const text = side === 'left' ? `${mark}${label}` : `${label}${mark}`;
    const dx = side === 'left' ? -wob : wob;
    let alpha = 0.72;
    if (hot === side) {
      alpha = 0.45 + 0.55 * amt;
    } else if (hot) {
      alpha = 0.28;
    }
    ctx.globalAlpha = alpha * (phase === 'flip' ? textAlpha : 1);
    ctx.fillStyle = `rgba(${base}, 1)`;
    ctx.textAlign = align;
    ctx.fillText(text, x + dx, y);
  });
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawHint(ctx) {
  if (phase === 'ending' && brokenKey) {
    const p = easeOutBack(progress(phaseT, 0.15, 0.4));
    ctx.save();
    ctx.globalAlpha = clamp(p);
    ctx.fillStyle = COLORS.card;
    ctx.font = font(18, 'bold');
    const v = run.stats[brokenKey];
    const word = v <= 0 ? '尽失' : '满溢';
    ctx.translate(W / 2, L.cardCY);
    ctx.scale(p, p);
    ctx.fillStyle = 'rgba(43, 38, 34, 0.9)';
    roundRect(ctx, -90, -24, 180, 48, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.card;
    ctx.fillText(`${STAT_META[brokenKey].label}${word}`, 0, 1);
    ctx.restore();
  }
}
