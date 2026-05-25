/**
 * narrative mode：纸纹旁白 + 便签选项。
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';
import { COLORS, FONT } from '../theme';
import {
  computeNarrativeLayout,
  drawPaperPanel,
  drawStickyChoice,
  drawWrappedText,
} from '../layers/paper';

/**
 * 绘制叙事场景并返回命中区。
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} node
 * @returns {{ x: number, y: number, w: number, h: number, index: number }[]}
 */
export function render(ctx, node, _hooks) {
  const layout = computeNarrativeLayout(ctx, node, SCREEN_WIDTH, SCREEN_HEIGHT);
  const { blockTop, panelTop, panelH, contentW, innerW, pad, buttons } = layout;
  const textX = pad + 16;

  ctx.font = FONT.chapter;
  ctx.fillStyle = node.timeline === 'past' ? COLORS.amber : COLORS.cyan;
  ctx.textAlign = 'center';
  ctx.fillText(node.chapter || '', SCREEN_WIDTH / 2, blockTop + 14);
  ctx.textAlign = 'left';

  drawWrappedText(
    ctx,
    node.title || '',
    pad,
    blockTop + 30,
    innerW + 32,
    22,
    COLORS.text,
    FONT.sceneTitle,
  );

  drawPaperPanel(ctx, pad, panelTop, contentW, panelH);
  drawWrappedText(
    ctx,
    node.text || '',
    textX,
    panelTop + 16,
    contentW - 32,
    21,
    COLORS.paperInk,
    FONT.body,
  );

  buttons.forEach((r, idx) => {
    drawStickyChoice(ctx, r, r.label, idx === 0);
  });

  return buttons;
}
