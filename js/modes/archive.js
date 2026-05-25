/**
 * 素材盘 mode：便签式勾选 + 确认（居中栈）。
 */
import { drawCenteredScene } from '../layers/sceneLayout';
import { applyEffect } from '../gameState';
import { getAnimTick } from '../animClock';

let nodeRef = null;
let keepMap = {};
let goNextCb = null;

export function render(ctx, node, hooks) {
  if (nodeRef?.id !== node.id) {
    nodeRef = node;
    goNextCb = hooks?.goNext;
    keepMap = {};
    (node.modeParams?.tiles || []).forEach((t) => {
      keepMap[t.id] = t.keep !== false;
    });
  }

  const tiles = node.modeParams?.tiles || [];
  const labels = tiles.map((t) => `${keepMap[t.id] ? '✓ ' : '○ '}${t.label}`);
  labels.push('确认素材');
  const confirmIdx = tiles.length;

  return drawCenteredScene(ctx, node, {
    paperText: node.text,
    animTick: getAnimTick(),
    choiceLabels: labels,
    choiceMeta: [
      ...tiles.map((t, i) => ({ _tileId: t.id, index: i })),
      { _confirm: true, index: confirmIdx },
    ],
  });
}

export function handleRegionTap(region) {
  if (!nodeRef || !region) {
    return false;
  }
  if (region._tileId) {
    keepMap[region._tileId] = !keepMap[region._tileId];
    return true;
  }
  if (region._confirm) {
    if (keepMap.truth_line) {
      applyEffect({ statDelta: { sincerityPast: 15 }, setFlags: { secret1Eligible: true } });
    }
    if (goNextCb && nodeRef.modeParams?.successNext) {
      goNextCb(nodeRef.modeParams.successNext);
    }
    return true;
  }
  return false;
}
