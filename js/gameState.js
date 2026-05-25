/**
 * 对局状态：诚意/压力/AI 依赖、flags、结局解析。
 * 业务逻辑集中于此，禁止散落在 modes 内硬编码阈值。
 */

const DEFAULT_STATS = {
  sincerityPast: 50,
  sincerityNow: 50,
  stress: 20,
  aiDepend: 0,
};

/** @type {typeof DEFAULT_STATS} */
let stats = { ...DEFAULT_STATS };

/** @type {Record<string, boolean>} */
let flags = {};

/**
 * 新一局重置数值与 flags。
 */
export function resetRun() {
  stats = { ...DEFAULT_STATS };
  flags = {};
}

/**
 * @returns {typeof DEFAULT_STATS}
 */
export function getStats() {
  return { ...stats };
}

/**
 * @returns {Record<string, boolean>}
 */
export function getFlags() {
  return { ...flags };
}

/**
 * 应用选项副作用（由 main 在跳转前调用）。
 * @param {{ statDelta?: Partial<typeof DEFAULT_STATS>, setFlags?: Record<string, boolean> }} | undefined effect
 */
export function applyEffect(effect) {
  if (!effect) {
    return;
  }
  if (effect.statDelta) {
    Object.keys(effect.statDelta).forEach((k) => {
      const delta = effect.statDelta[k];
      stats[k] = Math.max(0, Math.min(100, (stats[k] || 0) + delta));
    });
  }
  if (effect.setFlags) {
    flags = { ...flags, ...effect.setFlags };
  }
}

/**
 * 根据 stats + flags 解析结局 id。
 * @returns {string}
 */
export function resolveEnding() {
  if (flags.secret1Eligible && stats.sincerityPast >= 70 && stats.aiDepend < 30) {
    return 'ending_secret_1';
  }
  if (flags.fullAiSubmit && stats.aiDepend >= 80) {
    return 'ending_secret_2';
  }
  if (flags.dualVersion) {
    return 'ending_c';
  }
  if (stats.sincerityNow >= 65 && stats.aiDepend < 40) {
    return 'ending_a';
  }
  if (stats.aiDepend >= 60 && stats.sincerityNow < 40) {
    return 'ending_b';
  }
  return 'ending_d';
}
