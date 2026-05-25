/**
 * 素材盘：勾选保留镜头卡片。
 */
import { SCREEN_WIDTH } from '../render';
import { COLORS, FONT, LAYOUT } from '../theme';
import { CHROME_HEIGHT } from '../layers/chrome';
import { drawPaperPanel, drawStickyChoice } from '../layers/paper';
import { applyEffect } from '../gameState';

let nodeRef = null;
let keepMap = {};
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
    keepMap = {};
    (node.modeParams?.tiles || []).forEach((t) => {
      keepMap[t.id] = t.keep !== false;
    });
  }

  const pad = LAYOUT.pad;
  let y = CHROME_HEIGHT + 48;
  ctx.font = FONT.sceneTitle;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(node.title || '', pad, y);
  y += 28;

  const tiles = node.modeParams?.tiles || [];
  const regions = [];
  tiles.forEach((tile, i) => {
    const rect = { x: pad, y, w: SCREEN_WIDTH - pad * 2, h: 44, index: i, _tileId: tile.id };
    const kept = keepMap[tile.id];
    drawPaperPanel(ctx, pad, y, rect.w, rect.h);
    ctx.font = FONT.body;
    ctx.fillStyle = kept ? COLORS.paperInk : COLORS.paperMuted;
    ctx.fillText(`${kept ? '✓ ' : ''}${tile.label}`, pad + 16, y + 28);
    regions.push(rect);
    y += 52;
  });

  const confirm = {
    x: pad,
    y: y + 8,
    w: SCREEN_WIDTH - pad * 2,
    h: LAYOUT.btnH,
    index: 99,
    _confirm: true,
  };
  drawStickyChoice(ctx, confirm, '确认素材', true);
  regions.push(confirm);
  return regions;
}

/**
 * @param {object} region
 */
export function handleRegionTap(region) {
  if (!nodeRef || !region) {
    return false;
  }
  if (region._tileId) {
    keepMap[region._tileId] = !keepMap[region._tileId];
    return true;
  }
  if (region._confirm) {
    const tiles = nodeRef.modeParams?.tiles || [];
    const truth = tiles.find((t) => t.id === 'truth_line');
    if (truth && keepMap.truth_line) {
      applyEffect({ statDelta: { sincerityPast: 15 }, setFlags: { secret1Eligible: true } });
    }
    if (goNextCb && nodeRef.modeParams?.successNext) {
      goNextCb(nodeRef.modeParams.successNext);
    }
    return true;
  }
  return false;
}
