/**
 * 中文排版：按宽度换行、避头尾标点、显式换行；结果按 font|宽度|文本缓存。
 */

const NO_START = '，。、！？；：」』）》〉…—,.!?;:)~';
const NO_END = '「『（《〈(';
const CACHE_LIMIT = 400;
const cache = new Map();

export function wrapText(ctx, text, maxW, font) {
  const key = `${font}|${maxW}|${text}`;
  const hit = cache.get(key);
  if (hit) {
    return hit;
  }
  ctx.font = font;
  const out = [];
  String(text || '').split('\n').forEach((para) => {
    if (!para) {
      out.push('');
      return;
    }
    let line = '';
    for (const ch of para) {
      const test = line + ch;
      if (line && ctx.measureText(test).width > maxW && !NO_START.includes(ch)) {
        let carry = '';
        while (line.length > 1 && NO_END.includes(line[line.length - 1])) {
          carry = line[line.length - 1] + carry;
          line = line.slice(0, -1);
        }
        out.push(line);
        line = carry + ch;
      } else {
        line = test;
      }
    }
    if (line) {
      out.push(line);
    }
  });
  if (cache.size > CACHE_LIMIT) {
    cache.clear();
  }
  cache.set(key, out);
  return out;
}

/**
 * 绘制已换行文本，可只显示前 visible 个字（打字机）。
 * @returns {number} 绘制总高度
 */
export function drawLines(ctx, lines, x, y, lineH, opts = {}) {
  const align = opts.align || 'center';
  let remain = opts.visible == null ? Infinity : opts.visible;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  lines.forEach((ln, i) => {
    if (remain <= 0) {
      return;
    }
    const shown = remain >= ln.length ? ln : ln.slice(0, remain);
    remain -= ln.length;
    if (align === 'center' && shown !== ln) {
      const fullW = ctx.measureText(ln).width;
      ctx.textAlign = 'left';
      ctx.fillText(shown, x - fullW / 2, y + i * lineH + lineH / 2);
      ctx.textAlign = align;
    } else {
      ctx.fillText(shown, x, y + i * lineH + lineH / 2);
    }
  });
  return lines.length * lineH;
}

export function countChars(lines) {
  return lines.reduce((s, l) => s + l.length, 0);
}

/**
 * 逐字绘制（字间距），用于大标题。
 */
export function drawSpaced(ctx, text, cx, y, spacing) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((s, w) => s + w, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
}
