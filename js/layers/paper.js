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
 * 纸纹主面板，可选纹理与霓虹边。
 * @param {boolean} [glow]
 */
export function drawPaperPanel(ctx, x, y, w, h, glow = false) {
  if (glow) {
    ctx.shadowColor = 'rgba(0, 245, 212, 0.2)';
    ctx.shadowBlur = 16;
  }
  ctx.fillStyle = COLORS.paper;
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(42, 37, 32, 0.2)';
  ctx.lineWidth = 1;
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(42, 37, 32, 0.06)';
  for (let i = y + 8; i < y + h - 4; i += 7) {
    ctx.beginPath();
    ctx.moveTo(x + 10, i);
    ctx.lineTo(x + w - 10, i);
    ctx.stroke();
  }
}

/**
 * 便签式选项（带微动效）。
 */
/**
 * @param {boolean} accent 仅标题页「开始」等主行动可 true；剧情选项应 false。
 */
export function drawStickyChoice(ctx, rect, label, accent, tick = 0, extraPulse = 0) {
  const pulse = accent ? 0.03 * Math.sin(tick * 0.007) + extraPulse : 0;
  const tilt = accent ? pulse * 0.2 : 0.003;

  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate(tilt);
  if (accent) {
    ctx.scale(1 + pulse, 1 + pulse);
  }
  ctx.translate(-rect.w / 2, -rect.h / 2);

  ctx.fillStyle = accent ? '#fff9e8' : COLORS.paper;
  roundRectPath(ctx, 0, 0, rect.w, rect.h, 8);
  ctx.fill();

  ctx.strokeStyle = accent ? COLORS.cyan : 'rgba(42, 37, 32, 0.45)';
  ctx.lineWidth = accent ? 2 : 1.5;
  roundRectPath(ctx, 0, 0, rect.w, rect.h, 8);
  ctx.stroke();
  if (accent) {
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 6 + 4 * Math.sin(tick * 0.01);
    roundRectPath(ctx, 0, 0, rect.w, rect.h, 8);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.font = FONT.btn;
  ctx.fillStyle = COLORS.paperInk;
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.w / 2, rect.h / 2 + 6);
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
 * 居中换行绘制（用于标题页等全屏居中文案）。
 * @returns {number} 最后一行 baseline Y
 */
export function drawCenteredWrappedText(ctx, text, centerX, y, maxWidth, lineHeight, color, font) {
  ctx.font = font || FONT.body;
  ctx.fillStyle = color || COLORS.textMuted;
  const sidePad = 32;
  const safeMax = Math.min(maxWidth, centerX * 2 - sidePad * 2);
  const chars = (text || '').split('');
  let line = '';
  const lines = [];
  for (let i = 0; i < chars.length; i += 1) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > safeMax && line.length > 0) {
      lines.push(line);
      line = chars[i];
    } else {
      line = test;
    }
  }
  if (line) {
    lines.push(line);
  }
  let drawY = y;
  ctx.textAlign = 'left';
  lines.forEach((ln) => {
    const w = ctx.measureText(ln).width;
    let x = centerX - w / 2;
    if (x < sidePad) {
      x = sidePad;
    }
    if (x + w > centerX * 2 - sidePad) {
      x = centerX * 2 - sidePad - w;
    }
    ctx.fillText(ln, x, drawY);
    drawY += lineHeight;
  });
  return drawY;
}
