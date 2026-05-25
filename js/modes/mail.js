/**
 * 邮件 mode：居中栈；先选信封展开，再选回复。
 */
import { drawCenteredScene } from '../layers/sceneLayout';
import { applyEffect } from '../gameState';
import { getAnimTick } from '../animClock';
import * as pressure from './pressure';

let expanded = -1;
let nodeRef = null;
let goNextCb = null;
let lastTick = 0;

export function render(ctx, node, hooks) {
  if (nodeRef?.id !== node.id) {
    nodeRef = node;
    expanded = -1;
    lastTick = Date.now();
    pressure.startCountdown(node.modeParams?.pressureSec || 45, () => {
      const fail = node.modeParams?.timeoutNext;
      if (fail && hooks?.goNext) {
        hooks.goNext(fail);
      }
    });
  }
  goNextCb = hooks?.goNext;
  pressure.tick((Date.now() - lastTick) / 1000);
  lastTick = Date.now();
  pressure.drawPressureBar(ctx, '交付倒计时');

  const threads = node.modeParams?.threads || [];
  if (expanded < 0) {
    return drawCenteredScene(ctx, node, {
      paperText: node.text,
      animTick: getAnimTick(),
      choiceLabels: threads.map((t) => `▸ ${t.subject}`),
      choiceMeta: threads.map((_, i) => ({ _mailExpand: true, index: i })),
    });
  }

  const thread = threads[expanded];
  const body = `${node.text}\n\n${thread.body || ''}`;
  return drawCenteredScene(ctx, node, {
    paperText: body,
    animTick: getAnimTick(),
    choiceLabels: (thread.replies || []).map((r) => r.label),
    choiceMeta: (thread.replies || []).map((r, i) => ({
      _mailReply: r,
      index: i,
    })),
  });
}

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
