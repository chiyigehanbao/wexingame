/**
 * 游玩区居中布局：章节/标题/主纸纹框/扩展块/选项同一垂直栈，整体相对屏幕居中。
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';
import { getContentTop } from './chrome';
import { getBandHeight } from '../modes/pressure';
import { COLORS, FONT, LAYOUT } from '../theme';
import {
  measureWrappedLines,
  drawPaperPanel,
  drawWrappedText,
  drawCenteredWrappedText,
  drawStickyChoice,
  roundRectPath,
} from './paper';

const PLAY_BOTTOM = 28;
const GAP = 12;
const SECTION_GAP = 14;

let enterAt = 0;
let enterNodeId = '';

/**
 * 新场景入场动画计时。
 * @param {string} nodeId
 */
export function triggerSceneEnter(nodeId) {
  if (enterNodeId !== nodeId) {
    enterNodeId = nodeId;
    enterAt = Date.now();
  }
}

/**
 * @returns {number} 0～1
 */
export function getEnterEase() {
  const t = Math.min(1, (Date.now() - enterAt) / 480);
  return 1 - (1 - t) ** 3;
}

function getEnterAlpha() {
  return 0.4 + 0.6 * getEnterEase();
}

function getEnterOffsetY() {
  return (1 - getEnterEase()) * 32;
}

/**
 * 可绘制区域（居中锚点在此区域的垂直中线）。
 */
export function getPlayArea() {
  const top = getContentTop(getBandHeight()) + 6;
  const bottom = SCREEN_HEIGHT - PLAY_BOTTOM;
  return {
    top,
    bottom,
    centerY: (top + bottom) / 2,
    contentW: SCREEN_WIDTH - LAYOUT.pad * 2,
    pad: LAYOUT.pad,
    innerW: SCREEN_WIDTH - LAYOUT.pad * 2 - LAYOUT.panelPad * 2,
  };
}

function measureHeaderH(ctx, node, w) {
  const innerW = w - 16;
  const chapLines = measureWrappedLines(ctx, node.chapter || '', innerW, FONT.chapter);
  const titleLines = measureWrappedLines(ctx, node.title || '', innerW, FONT.sceneTitle);
  return 14 + chapLines * 20 + 14 + titleLines * 24;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} node
 * @param {number} x
 * @param {number} y
 * @param {number} w
 */
function drawSceneHeader(ctx, node, x, y, w) {
  const centerX = x + w / 2;
  const innerW = w - 16;
  const chapterColor = node.timeline === 'past' ? COLORS.amber : COLORS.cyan;

  const chapEnd = drawCenteredWrappedText(
    ctx,
    node.chapter || '',
    centerX,
    y + 14,
    innerW,
    20,
    chapterColor,
    FONT.chapter,
  );

  drawCenteredWrappedText(
    ctx,
    node.title || '',
    centerX,
    chapEnd + 14,
    innerW,
    24,
    COLORS.text,
    FONT.sceneTitle,
  );
  ctx.textAlign = 'left';
}

/**
 * 主纸纹文本框（大号正文）。
 */
export function measurePaperHeight(ctx, text, innerW) {
  const lines = measureWrappedLines(ctx, text || '', innerW, FONT.body);
  return lines * LAYOUT.bodyLine + LAYOUT.panelPad * 2 + 12;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
export function drawMainPaper(ctx, text, x, y, w, h) {
  drawPaperPanel(ctx, x, y, w, h, true);
  drawWrappedText(
    ctx,
    text || '',
    x + LAYOUT.panelPad,
    y + LAYOUT.panelPad + 4,
    w - LAYOUT.panelPad * 2,
    LAYOUT.bodyLine,
    COLORS.paperInk,
    FONT.body,
  );
}

/**
 * 居中场景栈。
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} node
 * @param {{
 *   paperText?: string,
 *   widgets?: { height: number, draw: (ctx: CanvasRenderingContext2D, rect: object) => void }[],
 *   choiceLabels?: string[],
 *   choiceMeta?: object[],
 *   animTick?: number,
 * }} opts
 * @returns {object[]} hit regions
 */
export function drawCenteredScene(ctx, node, opts) {
  const area = getPlayArea();
  const pad = area.pad;
  const contentW = area.contentW;
  const innerW = area.innerW;
  const paperText = opts.paperText != null ? opts.paperText : node.text;
  const widgets = opts.widgets || [];
  const labels = opts.choiceLabels || (node.choices || []).map((c) => c.label);
  const meta = opts.choiceMeta || [];
  const tick = opts.animTick || 0;

  const headerH = measureHeaderH(ctx, node, contentW);
  const paperH = measurePaperHeight(ctx, paperText, innerW);
  const widgetH = widgets.reduce((s, w) => s + w.height + GAP, 0);
  const choiceH = labels.length
    ? labels.length * LAYOUT.btnH + Math.max(0, labels.length - 1) * LAYOUT.btnGap
    : 0;

  const totalH = headerH + SECTION_GAP + paperH + (widgetH ? SECTION_GAP + widgetH : 0)
    + (choiceH ? SECTION_GAP + choiceH : 0);

  let blockTop = area.centerY - totalH / 2;
  if (blockTop < area.top) {
    blockTop = area.top;
  }
  if (blockTop + totalH > area.bottom) {
    blockTop = area.bottom - totalH;
  }
  if (blockTop < area.top) {
    blockTop = area.top;
  }

  const offsetY = getEnterOffsetY();
  const alpha = getEnterAlpha();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(0, offsetY);

  let y = blockTop;
  drawSceneHeader(ctx, node, pad, y, contentW);
  y += headerH + SECTION_GAP;

  const paperY = y;
  drawMainPaper(ctx, paperText, pad, paperY, contentW, paperH);
  y += paperH;

  widgets.forEach((widget) => {
    y += SECTION_GAP;
    const rect = { x: pad, y, w: contentW, h: widget.height };
    widget.draw(ctx, rect);
    y += widget.height;
  });

  const regions = [];
  if (choiceH) {
    y += SECTION_GAP;
    labels.forEach((label, index) => {
      const rect = {
        x: pad,
        y,
        w: contentW,
        h: LAYOUT.btnH,
        index,
        label,
        ...(meta[index] || {}),
      };
      drawStickyChoice(ctx, rect, label, false, tick, 0);
      regions.push(rect);
      y += LAYOUT.btnH + LAYOUT.btnGap;
    });
  }

  ctx.restore();
  return regions;
}

/**
 * 标题/结局页居中块。
 */
export function drawCenteredBlock(ctx, spec) {
  const area = getPlayArea();
  const { lines, buttons, accent } = spec;
  const lineH = spec.lineHeight || 26;
  const totalH = lines.reduce((s, l) => s + (l.h || lineH), 0) + SECTION_GAP
    + buttons.length * (LAYOUT.btnH + LAYOUT.btnGap);
  let blockTop = area.centerY - totalH / 2;
  const offsetY = getEnterOffsetY();
  const alpha = getEnterAlpha();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(0, offsetY);

  let y = blockTop;
  lines.forEach((line) => {
    ctx.font = line.font || FONT.body;
    ctx.fillStyle = line.color || COLORS.text;
    ctx.textAlign = line.align || 'center';
    const x = line.align === 'left' ? LAYOUT.pad + 16 : SCREEN_WIDTH / 2;
    if (line.wrap) {
      const endY = drawCenteredWrappedText(
        ctx,
        line.text,
        SCREEN_WIDTH / 2,
        y,
        line.wrap,
        lineH,
        line.color,
        line.font,
      );
      y = endY + lineH * 0.3;
    } else {
      ctx.fillText(line.text, x, y);
      y += line.h || lineH;
    }
  });

  const regions = [];
  y += SECTION_GAP;
  buttons.forEach((btn, i) => {
    const w = btn.w || 240;
    const h = LAYOUT.btnH;
    const x = (SCREEN_WIDTH - w) / 2;
    drawStickyChoice(ctx, { x, y, w, h }, btn.text, i === 0, Date.now(), 0);
    if (accent && i === 0) {
      ctx.shadowColor = accent;
      ctx.shadowBlur = 14;
      roundRectPath(ctx, x, y, w, h, 10);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    regions.push({ x, y, w, h, index: btn.index != null ? btn.index : i });
    y += h + LAYOUT.btnGap;
  });
  ctx.textAlign = 'left';
  ctx.restore();
  return regions;
}
