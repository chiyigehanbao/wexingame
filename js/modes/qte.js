/**
 * 轻 QTE：渲染进度 + 节拍点击窗口。
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';
import { COLORS, FONT, LAYOUT } from '../theme';
import { CHROME_HEIGHT } from '../layers/chrome';
import { drawPaperPanel, drawStickyChoice, drawWrappedText } from '../layers/paper';
import { getStats } from '../gameState';
import * as pressure from './pressure';

let phase = 'intro';
let progress = 0;
let beatIndex = 0;
let windowOpen = false;
let windowUntil = 0;
let nodeRef = null;
let goNextCb = null;
let lastTick = 0;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} node
 * @param {{ goNext: (id: string) => void }} hooks
 */
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

  const now = Date.now();
  const dt = (now - lastTick) / 1000;
  lastTick = now;
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

  drawScene(ctx, node);
  if (pressure.isActive()) {
    pressure.drawPressureBar(ctx, '末次答辩');
  }
  return buildHitRegions(node);
}

function openBeatWindow(node) {
  const beats = node.modeParams?.beats || [];
  const beat = beats[beatIndex];
  if (!beat) {
    return;
  }
  const stats = getStats();
  let windowMs = beat.windowMs || 800;
  if (stats.stress > 70) {
    windowMs *= 0.85;
  }
  windowOpen = true;
  windowUntil = Date.now() + windowMs;
  phase = 'running';
}

function finish(nextId) {
  pressure.stopCountdown();
  if (nextId && goNextCb) {
    goNextCb(nextId);
  }
}

function drawScene(ctx, node) {
  const pad = LAYOUT.pad;
  const top = CHROME_HEIGHT + 36;
  ctx.font = FONT.chapter;
  ctx.fillStyle = COLORS.cyan;
  ctx.textAlign = 'center';
  ctx.fillText(node.chapter || '', SCREEN_WIDTH / 2, top);
  ctx.textAlign = 'left';

  const barW = SCREEN_WIDTH - pad * 2;
  const barY = top + 24;
  ctx.fillStyle = 'rgba(139, 156, 179, 0.2)';
  ctx.fillRect(pad, barY, barW, 14);
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(pad, barY, barW * Math.min(1, progress), 14);
  ctx.font = FONT.mono;
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText(node.modeParams?.progressLabel || '渲染中', pad, barY - 6);

  const panelTop = barY + 40;
  const panelH = 120;
  drawPaperPanel(ctx, pad, panelTop, barW, panelH);
  drawWrappedText(ctx, node.text || '', pad + 16, panelTop + 16, barW - 32, 20, COLORS.paperInk, FONT.body);

  if (windowOpen) {
    const beat = (node.modeParams?.beats || [])[beatIndex];
    ctx.fillStyle = COLORS.amber;
    ctx.font = FONT.btn;
    ctx.fillText(beat?.label || '点击', pad + 16, panelTop + panelH + 28);
    if (Date.now() > windowUntil) {
      missBeat(node);
    }
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

function hitBeat(node) {
  windowOpen = false;
  beatIndex += 1;
  const beats = node.modeParams?.beats || [];
  if (beatIndex >= beats.length) {
    finish(node.modeParams?.successNext);
  }
}

function buildHitRegions(node) {
  if (!windowOpen) {
    return [];
  }
  const y = SCREEN_HEIGHT * 0.55;
  const w = SCREEN_WIDTH - 48;
  return [{
    x: 24,
    y,
    w,
    h: 64,
    index: 0,
    _qte: true,
  }];
}

/**
 * QTE 专用点击（由 main 转发）。
 */
export function handleTap() {
  if (!windowOpen || !nodeRef) {
    return false;
  }
  hitBeat(nodeRef);
  return true;
}
