/**
 * 跨局存档数据（纯逻辑，读写由 core/storage 负责）。
 */
import { deedOf, snapshotReign } from './deeds.js';
import { emptyWorld, mergeWorld, normalizeWorld } from './world.js';

export function createMeta() {
  return {
    runs: 0,
    best: 0,
    bestRank: 0,
    dynasty: '承平',
    endings: {},
    met: {},
    achievements: {},
    endingSeen: {},
    lastEnding: null,
    blessing: false,
    world: emptyWorld(),
    unlockedPacks: [],
  };
}

/** 成就落成时打开的内容包。 */
const DEED_PACK = {
  bribe: 'graft',
  clean: 'clean',
  pleasure: 'pleasure',
  troops: 'arms',
  scheme: 'scheme',
  throne: 'throne',
  builder: 'builder',
  plain: 'plain',
  rise: 'road',
  hero: 'scheme',
  transfer: 'plain',
};

function unlockPacks(meta, run, deed) {
  const packs = new Set(Array.isArray(meta.unlockedPacks) ? meta.unlockedPacks : []);
  const fromDeed = DEED_PACK[deed?.id];
  if (fromDeed) {
    packs.add(fromDeed);
  }
  if ((run.rank || 0) >= 2 || (meta.bestRank || 0) >= 2) {
    packs.add('road');
  }
  if ((meta.runs || 0) + 1 >= 3) {
    packs.add('plain');
  }
  return [...packs];
}

/** 看完一炷香：下一任新开局时钱粮和良心各暖一点。不看也能接着玩。 */
export const BLESSING_FX = { money: 6, heart: 4 };

export function grantBlessing(meta) {
  return { ...meta, blessing: true };
}

export function takeBlessing(meta) {
  if (!meta || !meta.blessing) {
    return { meta, fx: null };
  }
  return { meta: { ...meta, blessing: false }, fx: { ...BLESSING_FX } };
}

export function normalizeMeta(raw) {
  const base = createMeta();
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  return {
    runs: Number.isFinite(raw.runs) ? raw.runs : 0,
    best: Number.isFinite(raw.best) ? raw.best : 0,
    bestRank: Number.isFinite(raw.bestRank) ? raw.bestRank : 0,
    dynasty: raw.dynasty === '启明' ? '启明' : '承平',
    endings: raw.endings && typeof raw.endings === 'object' ? { ...raw.endings } : {},
    met: raw.met && typeof raw.met === 'object' ? { ...raw.met } : {},
    achievements: normalizeAchievements(raw.achievements),
    endingSeen: normalizeSeenMap(raw.endingSeen),
    lastEnding: typeof raw.lastEnding === 'string' ? raw.lastEnding : null,
    blessing: raw.blessing === true,
    world: normalizeWorld(raw.world),
    unlockedPacks: Array.isArray(raw.unlockedPacks)
      ? raw.unlockedPacks.filter((id) => typeof id === 'string')
      : [],
  };
}

export function countEndings(meta) {
  return Object.keys(meta.endings || {}).length;
}

function normalizeSeenMap(raw) {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const out = {};
  Object.entries(raw).forEach(([id, n]) => {
    if (Number.isFinite(n) && n > 0) {
      out[id] = n;
    }
  });
  return out;
}

/** 旧档里成就只是一个次数。迁过来时视为已经看过，避免一打开就铺满红点。 */
export function normalizeAchievement(value) {
  if (typeof value === 'number') {
    const count = value > 0 ? value : 0;
    return count ? { count, seen: count, reigns: [] } : null;
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  const count = Number.isFinite(value.count) && value.count > 0 ? value.count : 0;
  if (!count) {
    return null;
  }
  const seen = Number.isFinite(value.seen) ? Math.max(0, Math.min(value.seen, count)) : 0;
  const reigns = Array.isArray(value.reigns) ? value.reigns.slice(-8) : [];
  return { count, seen, reigns };
}

function normalizeAchievements(raw) {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const out = {};
  Object.entries(raw).forEach(([id, value]) => {
    const entry = normalizeAchievement(value);
    if (entry) {
      out[id] = entry;
    }
  });
  return out;
}

export function achievementCount(entry) {
  if (typeof entry === 'number') {
    return entry > 0 ? entry : 0;
  }
  return entry?.count || 0;
}

export function achievementSeen(entry) {
  if (typeof entry === 'number') {
    return entry > 0 ? entry : 0;
  }
  return entry?.seen || 0;
}

/** 图鉴至少两行。超出两行再按格子补行。 */
export function gallerySlots(count, columns = 3) {
  const min = columns * 2;
  const n = Math.max(0, count | 0);
  if (n <= min) {
    return min;
  }
  return Math.ceil(n / columns) * columns;
}

export function markAchievementSeen(meta, id) {
  const achievements = normalizeAchievements(meta.achievements);
  const entry = achievements[id];
  if (!entry || entry.seen >= entry.count) {
    return meta;
  }
  return {
    ...meta,
    achievements: { ...achievements, [id]: { ...entry, seen: entry.count } },
  };
}

export function markEndingSeen(meta, id) {
  const count = meta.endings?.[id] || 0;
  if (!count || (meta.endingSeen?.[id] || 0) >= count) {
    return meta;
  }
  return { ...meta, endingSeen: { ...(meta.endingSeen || {}), [id]: count } };
}

/**
 * @param {ReturnType<typeof createMeta>} meta
 * @param {{ ending: string, day: number, met: Record<string, boolean> }} run
 */
function nextDynastyName(meta, run) {
  if (run.dynasty && run.dynasty !== (meta.dynasty || '承平')) {
    return run.dynasty;
  }
  if (run.ending === 'new_dynasty') {
    return (meta.dynasty || '承平') === '启明' ? '承平' : '启明';
  }
  return meta.dynasty || '承平';
}

export function recordRun(meta, run) {
  const isNewEnding = !meta.endings[run.ending];
  const isBest = run.day > meta.best;
  const deed = deedOf(run);
  const achievements = normalizeAchievements(meta.achievements);
  const prev = achievements[deed.id] || { count: 0, seen: 0, reigns: [] };
  achievements[deed.id] = {
    count: prev.count + 1,
    seen: prev.seen,
    reigns: [...prev.reigns, snapshotReign(run)].slice(-8),
  };
  return {
    isNewEnding,
    isBest,
    deed,
    meta: {
      runs: meta.runs + 1,
      best: Math.max(meta.best, run.day),
      bestRank: Math.max(meta.bestRank || 0, run.rank || 0),
      dynasty: nextDynastyName(meta, run),
      endings: { ...meta.endings, [run.ending]: (meta.endings[run.ending] || 0) + 1 },
      met: { ...meta.met, ...run.met },
      achievements,
      endingSeen: { ...(meta.endingSeen || {}) },
      lastEnding: run.ending,
      blessing: meta.blessing === true,
      world: mergeWorld(meta.world, run),
      unlockedPacks: unlockPacks(meta, run, deed),
    },
  };
}
