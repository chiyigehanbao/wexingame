/**
 * 对局状态：诚意/压力/AI 依赖、flags、章节日志、结局解析。
 * 业务逻辑集中于此，禁止散落在 modes 内硬编码阈值。
 */

const STORAGE_KEY = 'yiye_v2_chapter_log';

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

/** @type {{ actId: string, title: string, timeline: string, ts: number }[]} */
let chapterLog = [];

/**
 * 新一局重置数值与 flags（章节日志保留）。
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
 * 记录已读章节（进入节点时调用一次）。
 * @param {object} node
 */
export function pushChapter(node) {
  if (!node || !node.id) {
    return;
  }
  const entry = {
    actId: node.id,
    title: node.title || node.id,
    timeline: node.timeline || 'now',
    ts: Date.now(),
  };
  const last = chapterLog[chapterLog.length - 1];
  if (last && last.actId === entry.actId) {
    return;
  }
  chapterLog.push(entry);
  try {
    if (typeof wx !== 'undefined' && wx.setStorageSync) {
      wx.setStorageSync(STORAGE_KEY, chapterLog);
    }
  } catch (e) {
    /* 存储失败不阻断游戏 */
  }
}

/**
 * 从本地读取章节日志。
 * @returns {typeof chapterLog}
 */
export function loadChapterLog() {
  try {
    if (typeof wx !== 'undefined' && wx.getStorageSync) {
      const raw = wx.getStorageSync(STORAGE_KEY);
      chapterLog = Array.isArray(raw) ? raw : [];
    }
  } catch (e) {
    chapterLog = [];
  }
  return chapterLog.slice();
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
