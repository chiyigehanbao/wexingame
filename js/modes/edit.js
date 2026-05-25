/**
 * 剪辑台 mode：句块作为便签选项（居中栈）。
 */
import { drawCenteredScene } from '../layers/sceneLayout';
import { applyEffect } from '../gameState';
import { getAnimTick } from '../animClock';

let nodeRef = null;
let dropped = {};
let goNextCb = null;

export function render(ctx, node, hooks) {
  if (nodeRef?.id !== node.id) {
    nodeRef = node;
    goNextCb = hooks?.goNext;
    dropped = {};
  }

  const clips = node.modeParams?.clips || [];
  const labels = clips.map((c) => {
    const mark = dropped[c.id] ? '✕ ' : '';
    const tag = c.ai ? '[AI] ' : '';
    return `${mark}${tag}${c.text}`;
  });
  labels.push('继续');
  const doneIdx = clips.length;

  return drawCenteredScene(ctx, node, {
    paperText: node.text,
    animTick: getAnimTick(),
    choiceLabels: labels,
    choiceMeta: [
      ...clips.map((c, i) => ({ _clipId: c.id, index: i })),
      { _done: true, index: doneIdx },
    ],
  });
}

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
