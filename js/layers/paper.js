/**
 * L1 纸纹 UI：面板、便签选项、换行测量。
 */
import { COLORS, FONT, LAYOUT } from '../theme';

/**
 * 绘制圆角矩形路径。
 */
export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * 纸纹主面板。
 */
export function drawPaperPanel(ctx, x, y, w, h) {
  ctx.fillStyle = COLORS.paper;
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(42, 37, 32, 0.25)';
  ctx.lineWidth = 1;
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.stroke();
}

/**
 * 便签式选项按钮。
 * @param {boolean} accent 是否主选项
 */
export function drawStickyChoice(ctx, rect, label, accent) {
  const tilt = accent ? 0 : 0.008;
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate(tilt);
  ctx.translate(-rect.w / 2, -rect.h / 2);

  ctx.fillStyle = accent ? '#fff9e8' : COLORS.paper;
  roundRectPath(ctx, 0, 0, rect.w, rect.h, 6);
  ctx.fill();
  ctx.strokeStyle = accent ? COLORS.cyan : COLORS.paperMuted;
  ctx.lineWidth = accent ? 2 : 1;
  roundRectPath(ctx, 0, 0, rect.w, rect.h, 6);
  ctx.stroke();

  ctx.font = FONT.btn;
  ctx.fillStyle = COLORS.paperInk;
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.w / 2, rect.h / 2 + 5);
  ctx.textAlign = 'left';
  ctx.restore();
}

/**
 * 换行测量行数。
 */
export function measureWrappedLines(ctx, text, maxWidth, font) {
  if (!text) {
    return 1;
  }
  ctx.font = font;
  const chars = text.split('');
  let line = '';
  let lines = 1;
  for (let i = 0; i < chars.length; i += 1) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      line = chars[i];
      lines += 1;
    } else {
      line = test;
    }
  }
  return lines;
}

/**
 * 绘制换行正文，返回最后一行 baseline Y。
 */
export function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, color, font) {
  ctx.font = font || FONT.body;
  ctx.fillStyle = color || COLORS.paperInk;
  const chars = text.split('');
  let line = '';
  let drawY = y;
  for (let i = 0; i < chars.length; i += 1) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, drawY);
      line = chars[i];
      drawY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, drawY);
  }
  return drawY;
}

/**
 * 叙事场景布局（便签按钮列表）。
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} node
 * @param {number} screenW
 * @param {number} screenH
 */
export function computeNarrativeLayout(ctx, node, screenW, screenH) {
  const pad = LAYOUT.pad;
  const contentW = screenW - pad * 2;
  const innerW = contentW - LAYOUT.panelPad * 2;
  const labels = (node.choices || []).map((c) => c.label);

  const chapterH = 20;
  const titleLines = measureWrappedLines(ctx, node.title || '', innerW, FONT.sceneTitle);
  const bodyLines = measureWrappedLines(ctx, node.text || '', innerW, FONT.body);
  const panelH = bodyLines * 21 + LAYOUT.panelPad * 2 + 8;
  const headerH = chapterH + 8 + titleLines * 22 + 12;
  const btnBlockH = labels.length * LAYOUT.btnH + Math.max(0, labels.length - 1) * LAYOUT.btnGap;
  const totalH = headerH + panelH + 14 + btnBlockH;
  const blockTop = Math.max(88, (screenH - totalH) / 2);
  const panelTop = blockTop + headerH;
  let btnY = panelTop + panelH + 14;

  const buttons = labels.map((label, index) => {
    const rect = { x: pad, y: btnY, w: contentW, h: LAYOUT.btnH, index, label };
    btnY += LAYOUT.btnH + LAYOUT.btnGap;
    return rect;
  });

  return { blockTop, panelTop, panelH, contentW, innerW, pad, buttons };
}
