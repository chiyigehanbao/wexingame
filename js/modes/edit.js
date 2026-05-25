/**
 * 剪辑台：句块删留（点击切换删除线）。
 */
import { SCREEN_WIDTH } from '../render';
import { COLORS, FONT, LAYOUT } from '../theme';
import { CHROME_HEIGHT } from '../layers/chrome';
import { drawPaperPanel, drawStickyChoice } from '../layers/paper';
import { applyEffect } from '../gameState';

let nodeRef = null;
let dropped = {};
let goNextCb = null;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} node
 * @param {{ goNext: (id: string) => void }} hooks
 */
export function render(ctx, node, hooks) {
  if (nodeRef?.id !== node.id) {
    nodeRef = node;
    goNextCb = hooks?.goNext;
    dropped = {};
  }

  const pad = LAYOUT.pad;
  let y = CHROME_HEIGHT + 48;
  ctx.fillStyle = COLORS.text;
  ctx.font = FONT.sceneTitle;
  ctx.fillText(node.title || '', pad, y);
  y += 30;

  const clips = node.modeParams?.clips || [];
  const regions = [];
  clips.forEach((clip, i) => {
    const isDrop = dropped[clip.id];
    const rect = { x: pad, y, w: SCREEN_WIDTH - pad * 2, h: 40, index: i, _clipId: clip.id };
    drawPaperPanel(ctx, pad, y, rect.w, rect.h);
    ctx.font = FONT.bodySmall;
    ctx.fillStyle = isDrop ? COLORS.paperMuted : COLORS.paperInk;
    if (isDrop) {
      ctx.fillRect(pad + 12, y + 20, rect.w - 24, 1);
    }
    ctx.fillText(`${clip.ai ? '[AI] ' : ''}${clip.text}`, pad + 16, y + 26);
    regions.push(rect);
    y += 48;
  });

  const btn = { x: pad, y: y + 8, w: SCREEN_WIDTH - pad * 2, h: LAYOUT.btnH, index: 99, _done: true };
  drawStickyChoice(ctx, btn, '继续', true);
  regions.push(btn);
  return regions;
}

/**
 * @param {object} region
 */
export function handleRegionTap(region) {
  if (!nodeRef || !region) {
    return false;
  }
  if (region._clipId) {
    dropped[region._clipId] = !dropped[region._clipId];
    return true;
  }
  if (region._done) {
    const clips = nodeRef.modeParams?.clips || [];
    let aiKept = 0;
    clips.forEach((c) => {
      if (c.ai && !dropped[c.id]) {
        aiKept += 1;
      }
    });
    if (aiKept === 0) {
      applyEffect({ statDelta: { sincerityNow: 12, aiDepend: -12 } });
    } else {
      applyEffect({ statDelta: { aiDepend: 15 } });
    }
    if (goNextCb && nodeRef.modeParams?.successNext) {
      goNextCb(nodeRef.modeParams.successNext);
    }
    return true;
  }
  return false;
}
