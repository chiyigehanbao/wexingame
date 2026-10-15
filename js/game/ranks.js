/** 官级表。单独文件，避免标题页拖进整局逻辑与朝报。 */
export const RANKS = ['县令', '通判', '知府', '按察使', '巡抚', '尚书', '皇帝'];

function recordWide(text, width) {
  return [...String(text)].length * 14 > width - 32;
}

/** 标题页历任。带官职时一行会出窄屏，拆开，短的仍一行。 */
export function titleRecordLines({ runs, best, rank = '', width }) {
  const tail = rank ? ` · 官至${rank}` : '';
  const full = `已历 ${runs} 任 · 最长在任 ${best} 天${tail}`;
  if (!recordWide(full, width)) {
    return [full];
  }
  const head = `已历 ${runs} 任 · 最长 ${best} 天`;
  if (!rank) {
    return [head];
  }
  if (!recordWide(head, width)) {
    return [head, `官至${rank}`];
  }
  return [`已历 ${runs} 任`, `最长 ${best} 天`, `官至${rank}`];
}
