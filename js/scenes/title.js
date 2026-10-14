/**
 * 标题页：远山宣纸、飘落梅瓣、「升堂」。
 */
import { W, H, SAFE_BOTTOM } from '../core/screen.js';
import { go } from '../core/router.js';
import { play, ambient } from '../core/audio.js';
import { vibrate } from '../core/platform.js';
import { easeOutCubic, progress } from '../core/tween.js';
import { session, toggleSound } from '../session.js';
import { titleBackground } from '../ui/paper.js';
import { COLORS, font } from '../ui/theme.js';
import { drawLivingText } from '../ui/text.js';
import { Button, ButtonGroup, drawSeal } from '../ui/widgets.js';

const petals = [];
const buttons = new ButtonGroup();
let t = 0;
let soundBtn = null;

function spawnPetal(initial) {
  return {
    x: Math.random() * W,
    y: initial ? Math.random() * H : -10,
    vy: 14 + Math.random() * 18,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.8 + Math.random() * 1.2,
    rot: Math.random() * Math.PI,
    size: 3 + Math.random() * 3,
  };
}

for (let i = 0; i < 14; i += 1) {
  petals.push(spawnPetal(true));
}

function layoutButtons() {
  buttons.clear();
  const bw = Math.min(220, W - 80);
  const by = Math.min(H * 0.6, H - SAFE_BOTTOM - 190);
  buttons.add(new Button({
    x: (W - bw) / 2, y: by, w: bw, h: 54, label: '升堂',
    onTap: (x, y) => {
      play('gavel', 0.9);
      vibrate('medium');
      go('play', {}, { x, y });
    },
  }));
  buttons.add(new Button({
    x: (W - bw) / 2, y: by + 68, w: bw, h: 46, label: '历任档案', kind: 'ghost',
    onTap: (x, y) => go('archive', {}, { x, y }),
  }));
  soundBtn = buttons.add(new Button({
    x: W / 2 - 50, y: H - SAFE_BOTTOM - 40, w: 100, h: 32, kind: 'text',
    label: '', fontSize: 13,
    onTap: () => toggleSound(),
  }));
}

export default {
  enter() {
    t = 0;
    layoutButtons();
  },

  update(dt, now) {
    t += dt;
    buttons.update(dt);
    soundBtn.label = session.settings.sound ? '声音 · 开' : '声音 · 关';
    petals.forEach((p, i) => {
      p.y += p.vy * dt;
      p.sway += p.swaySpeed * dt;
      p.x += Math.sin(p.sway) * 12 * dt;
      p.rot += dt * 0.8;
      if (p.y > H + 10) {
        petals[i] = spawnPetal(false);
      }
    });
    ambient(now, 0.14);
  },

  draw(ctx) {
    const bg = titleBackground();
    ctx.drawImage(bg.canvas, 0, 0, W, H);

    ctx.fillStyle = 'rgba(179, 52, 43, 0.75)';
    petals.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.55);
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const ty = H * 0.24;
    ctx.fillStyle = COLORS.ink;
    ctx.textBaseline = 'middle';
    ctx.font = font(Math.min(60, W * 0.15), 'bold');
    drawLivingText(ctx, '县太爷', W / 2, ty, 10, t, {
      bounce: 42, sway: 5, rot: 0.07, stagger: 0.1,
    });
    ctx.font = font(Math.min(26, W * 0.068));
    ctx.fillStyle = COLORS.inkSoft;
    drawLivingText(ctx, '今天也很忙', W / 2, ty + 58, 8, t, {
      delay: 0.32, bounce: 22, sway: 3, rot: 0.04, stagger: 0.06,
    });

    const sealT = progress(t, 0.7, 0.32);
    if (sealT > 0) {
      const landed = sealT >= 1;
      const s = 1 + (1 - easeOutCubic(sealT)) * 1.4;
      const bob = landed ? Math.sin(t * 2.4) * 2 : 0;
      const wob = landed ? Math.sin(t * 1.8) * 0.05 : 0;
      drawSeal(ctx, '忙', W / 2 + Math.min(132, W * 0.36), ty - 34 + bob, 32, 'square', COLORS.red, {
        rotate: -0.12 + wob, scale: s, alpha: Math.min(1, sealT * 2.4),
      });
    }

    const lineA = easeOutCubic(progress(t, 0.55, 0.45));
    ctx.globalAlpha = lineA;
    ctx.fillStyle = COLORS.muted;
    ctx.font = font(14);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('一个穷县 · 一张公案 · 一堆麻烦事', W / 2, ty + 100 + (1 - lineA) * 8);
    ctx.fillStyle = COLORS.inkSoft;
    ctx.fillText('四项见底或见顶就下台，在任越久越好', W / 2, ty + 126 + (1 - lineA) * 8);
    ctx.globalAlpha = 1;
    const m = session.meta;
    if (m.runs > 0) {
      ctx.textAlign = 'center';
      ctx.fillText(`已历 ${m.runs} 任 · 最长在任 ${m.best} 天`, W / 2, ty + 150);
    }
    ctx.globalAlpha = easeOutCubic(progress(t, 0.6, 0.6));
    buttons.draw(ctx);
    ctx.globalAlpha = 1;
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
