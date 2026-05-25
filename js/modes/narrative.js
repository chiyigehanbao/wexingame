/**
 * narrative mode：居中纸纹栈 + 便签选项。
 */
import { drawCenteredScene } from '../layers/sceneLayout';

let lastTick = 0;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} node
 * @param {object} _hooks
 * @param {number} [animTick]
 */
export function render(ctx, node, _hooks, animTick = Date.now()) {
  lastTick = animTick;
  return drawCenteredScene(ctx, node, {
    paperText: node.text,
    animTick: lastTick,
  });
}
