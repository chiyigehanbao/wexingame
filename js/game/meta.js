/**
 * 跨局存档数据（纯逻辑，读写由 core/storage 负责）。
 */

export function createMeta() {
  return {
    runs: 0,
    best: 0,
    endings: {},
    met: {},
    lastEnding: null,
  };
}

export function normalizeMeta(raw) {
  const base = createMeta();
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  return {
    runs: Number.isFinite(raw.runs) ? raw.runs : 0,
    best: Number.isFinite(raw.best) ? raw.best : 0,
    endings: raw.endings && typeof raw.endings === 'object' ? { ...raw.endings } : {},
    met: raw.met && typeof raw.met === 'object' ? { ...raw.met } : {},
    lastEnding: typeof raw.lastEnding === 'string' ? raw.lastEnding : null,
  };
}

export function countEndings(meta) {
  return Object.keys(meta.endings || {}).length;
}

/**
 * @param {ReturnType<typeof createMeta>} meta
 * @param {{ ending: string, day: number, met: Record<string, boolean> }} run
 */
export function recordRun(meta, run) {
  const isNewEnding = !meta.endings[run.ending];
  const isBest = run.day > meta.best;
  return {
    isNewEnding,
    isBest,
    meta: {
      runs: meta.runs + 1,
      best: Math.max(meta.best, run.day),
      endings: { ...meta.endings, [run.ending]: (meta.endings[run.ending] || 0) + 1 },
      met: { ...meta.met, ...run.met },
      lastEnding: run.ending,
    },
  };
}
