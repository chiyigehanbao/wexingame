/**
 * 邮件/IM 抽屉：选回复倾向后跳转。
 */
import { SCREEN_WIDTH } from '../render';
import { COLORS, FONT, LAYOUT } from '../theme';
import { CHROME_HEIGHT } from '../layers/chrome';
import { drawPaperPanel, drawStickyChoice, drawWrappedText } from '../layers/paper';
import { applyEffect } from '../gameState';
import * as pressure from './pressure';

let expanded = -1;
let nodeRef = null;
let goNextCb = null;
let lastTick = 0;

const FROM_COLOR = {
  hr: COLORS.hr,
  client: COLORS.client,
  self: COLORS.badge,
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} node
 * @param {{ goNext: (id: string) => void }} hooks
 * @returns {object[]}
 */
export function render(ctx, node, hooks) {
  if (nodeRef?.id !== node.id) {
    nodeRef = node;
    expanded = -1;
    lastTick = Date.now();
    const sec = node.modeParams?.pressureSec || 90;
    pressure.startCountdown(sec, () => {
      const fail = node.modeParams?.timeoutNext;
      if (fail && hooks?.goNext) {
        hooks.goNext(fail);
      }
    });
  }
  goNextCb = hooks?.goNext;

  const dt = (Date.now() - lastTick) / 1000;
  lastTick = Date.now();
  pressure.tick(dt);
  pressure.drawPressureBar(ctx, '交付倒计时');

  const threads = node.modeParams?.threads || [];
  const pad = LAYOUT.pad;
  let y = CHROME_HEIGHT + 40;

  ctx.font = FONT.chapter;
  ctx.fillStyle = COLORS.cyan;
  ctx.textAlign = 'center';
  ctx.fillText(node.chapter || '', SCREEN_WIDTH / 2, y);
  y += 28;
  ctx.textAlign = 'left';

  const regions = [];
  let hitY = CHROME_HEIGHT + 68;

  threads.forEach((thread, ti) => {
    const color = FROM_COLOR[thread.from] || COLORS.badge;
    ctx.fillStyle = color;
    ctx.fillRect(pad, hitY, 8, 36);
    ctx.font = FONT.bodySmall;
    ctx.fillStyle = COLORS.text;
    ctx.fillText(thread.subject || '', pad + 16, hitY + 14);
    regions.push({ x: pad, y: hitY, w: SCREEN_WIDTH - pad * 2, h: 40, index: ti, _mailExpand: true });
    hitY += 44;

    if (expanded === ti) {
      const panelH = 100;
      drawPaperPanel(ctx, pad, y, SCREEN_WIDTH - pad * 2, panelH);
      drawWrappedText(ctx, thread.body || '', pad + 16, y + 14, SCREEN_WIDTH - pad * 2 - 32, 18, COLORS.paperInk, FONT.body);
      y += panelH + 8;
      thread.replies.forEach((rep, ri) => {
        const rect = {
          x: pad,
          y: y,
          w: SCREEN_WIDTH - pad * 2,
          h: LAYOUT.btnH,
          index: 100 + ri,
          label: rep.label,
          _mailReply: rep,
        };
        drawStickyChoice(ctx, rect, rep.label, ri === 0);
        regions.push(rect);
        y += LAYOUT.btnH + LAYOUT.btnGap;
      });
    }
  });

  return regions;
}

/**
 * @param {object} region
 * @returns {boolean} 是否已消费点击
 */
export function handleRegionTap(region) {
  if (!nodeRef || !region) {
    return false;
  }
  if (region._mailExpand) {
    expanded = region.index;
    return true;
  }
  if (region._mailReply) {
    const rep = region._mailReply;
    pressure.stopCountdown();
    applyEffect(rep.effect);
    if (goNextCb && rep.next) {
      goNextCb(rep.next);
    }
    return true;
  }
  return false;
}
