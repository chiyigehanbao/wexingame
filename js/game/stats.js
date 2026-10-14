/**
 * 四项政绩数值：民心 / 钱粮 / 官声 / 良心，范围 0～100。
 */

export const STAT_KEYS = ['people', 'money', 'court', 'heart'];

export const STAT_MIN = 0;
export const STAT_MAX = 100;

export function createStats() {
  return {
    people: 50, money: 50, court: 50, heart: 50,
  };
}

function clamp(v) {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, v));
}

/**
 * @param {Record<string, number>} stats
 * @param {Record<string, number>} [fx]
 * @returns {Record<string, number>} 新对象
 */
export function applyFx(stats, fx) {
  const next = { ...stats };
  if (!fx) {
    return next;
  }
  STAT_KEYS.forEach((k) => {
    if (typeof fx[k] === 'number') {
      next[k] = clamp(next[k] + fx[k]);
    }
  });
  return next;
}

/**
 * @returns {{ key: string, side: 'low'|'high' } | null}
 */
export function findBrokenStat(stats) {
  for (let i = 0; i < STAT_KEYS.length; i += 1) {
    const k = STAT_KEYS[i];
    if (stats[k] <= STAT_MIN) {
      return { key: k, side: 'low' };
    }
    if (stats[k] >= STAT_MAX) {
      return { key: k, side: 'high' };
    }
  }
  return null;
}

/**
 * 拖动预览圆点的大小档位：0 无影响，1 小，2 中，3 大。
 */
export function fxMagnitude(delta) {
  const a = Math.abs(delta || 0);
  if (a === 0) {
    return 0;
  }
  if (a <= 7) {
    return 1;
  }
  if (a <= 15) {
    return 2;
  }
  return 3;
}
