/**
 * 轻 QTE：居中栈内进度条 + 主文案 + 节拍便签。
 */
import { COLORS, FONT, LAYOUT } from '../theme';
import { drawCenteredScene } from '../layers/sceneLayout';
import { getStats } from '../gameState';
import { getAnimTick } from '../animClock';
import * as pressure from './pressure';

let phase = 'intro';
let progress = 0;
let beatIndex = 0;
let windowOpen = false;
let windowUntil = 0;
let nodeRef = null;
let goNextCb = null;
let lastTick = 0;
let lastBeatRect = null;

export function render(ctx, node, hooks) {
  if (nodeRef?.id !== node.id) {
    nodeRef = node;
    phase = 'intro';
    progress = 0;
    beatIndex = 0;
    windowOpen = false;
    lastTick = Date.now();
    const sec = node.modeParams?.pressureSec;
    if (sec) {
      pressure.startCountdown(sec, () => {
        const fail = node.modeParams?.failNext;
        if (fail && hooks?.goNext) {
          hooks.goNext(fail);
        }
      });
    }
  }
  goNextCb = hooks?.goNext;
  const dt = (Date.now() - lastTick) / 1000;
  lastTick = Date.now();
  pressure.tick(dt);

  if (phase === 'intro') {
    progress += dt * 0.08;
    if (progress >= (node.modeParams?.beats?.[0]?.at || 0.55)) {
      openBeatWindow(node);
    }
  } else if (phase === 'running') {
    progress += dt * 0.05;
    const beats = node.modeParams?.beats || [];
    const next = beats[beatIndex];
    if (next && progress >= next.at && !windowOpen) {
      openBeatWindow(node);
    }
    if (progress >= 1) {
      finish(node.modeParams?.successNext);
    }
  }

  if (windowOpen && Date.now() > windowUntil) {
    missBeat(node);
  }

  pressure.drawPressureBar(ctx, '末次答辩');

  const beat = (node.modeParams?.beats || [])[beatIndex];
  const beatLabel = windowOpen ? (beat?.label || '点击节拍') : '等待渲染进度…';
  const pulse = windowOpen ? 0.12 * Math.sin(Date.now() * 0.02) : 0;

  const regions = drawCenteredScene(ctx, node, {
    paperText: node.text,
    animTick: getAnimTick(),
    widgets: [
      {
        height: 28,
        draw: (c, rect) => {
          c.fillStyle = 'rgba(139, 156, 179, 0.25)';
          c.fillRect(rect.x, rect.y + 8, rect.w, 12);
          c.fillStyle = COLORS.cyan;
          c.fillRect(rect.x, rect.y + 8, rect.w * Math.min(1, progress), 12);
          c.font = FONT.mono;
          c.fillStyle = COLORS.textMuted;
          c.fillText(node.modeParams?.progressLabel || '渲染中', rect.x, rect.y);
        },
      },
    ],
    choiceLabels: windowOpen ? [beatLabel] : [],
    choiceMeta: windowOpen ? [{ _qteBeat: true, index: 0 }] : [],
  });

  if (windowOpen && regions.length) {
    lastBeatRect = regions[0];
    return regions;
  }
  lastBeatRect = null;
  return [];
}

function openBeatWindow(node) {
  const beat = (node.modeParams?.beats || [])[beatIndex];
  if (!beat) {
    return;
  }
  const stats = getStats();
  let windowMs = beat.windowMs || 900;
  if (stats.stress > 70) {
    windowMs *= 0.85;
  }
  windowOpen = true;
  windowUntil = Date.now() + windowMs;
  phase = 'running';
}

function finish(nextId) {
  pressure.stopCountdown();
  windowOpen = false;
  if (nextId && goNextCb) {
    goNextCb(nextId);
  }
}

function missBeat(node) {
  windowOpen = false;
  const fail = node.modeParams?.failNext;
  if (fail && goNextCb) {
    pressure.stopCountdown();
    goNextCb(fail);
  }
}

export function handleTap() {
  if (!windowOpen || !nodeRef) {
    return false;
  }
  windowOpen = false;
  beatIndex += 1;
  const beats = nodeRef.modeParams?.beats || [];
  if (beatIndex >= beats.length) {
    finish(nodeRef.modeParams?.successNext);
  }
  return true;
}
