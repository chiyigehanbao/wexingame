/**
 * 三个存档位。每个位子是一任没断完的县令，退堂之后还在。
 */
import { STAT_KEYS, createStats } from './stats.js';
import { RANKS } from './ranks.js';
import { careerAge } from './time.js';
import { COUNTY_FACES, COUNTY_NAMES } from './paths.js';
import { waitingNotices, showingNotice } from './run.js';

export const SLOT_COUNT = 3;

export function createSlots() {
  return Array.from({ length: SLOT_COUNT }, () => null);
}

function clamp100(n) {
  return Math.max(0, Math.min(100, n));
}

function normalizeShifts(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') {
    return out;
  }
  COUNTY_FACES.forEach((k) => {
    const n = raw[k];
    if (Number.isFinite(n) && n > 0) {
      out[k] = Math.min(9, Math.round(n));
    }
  });
  return out;
}

function normalizeThemeSeen(raw) {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const out = {};
  Object.keys(raw).forEach((k) => {
    if (typeof k === 'string' && k.length <= 16 && Number.isFinite(raw[k])) {
      out[k] = Math.max(0, Math.round(raw[k]));
    }
  });
  return out;
}

function normalizeRun(raw) {
  if (!raw || typeof raw !== 'object' || !Number.isFinite(raw.day)) {
    return null;
  }
  const stats = createStats();
  if (raw.stats && typeof raw.stats === 'object') {
    STAT_KEYS.forEach((k) => {
      if (Number.isFinite(raw.stats[k])) {
        stats[k] = clamp100(raw.stats[k]);
      }
    });
  }
  return {
    reign: Number.isFinite(raw.reign) ? raw.reign : 1,
    rank: Number.isFinite(raw.rank) ? Math.max(0, Math.min(RANKS.length - 1, raw.rank)) : 0,
    notice: '',
    lastCareerDraw: Number.isFinite(raw.lastCareerDraw) ? raw.lastCareerDraw : 0,
    lastEdictDraw: Number.isFinite(raw.lastEdictDraw) ? raw.lastEdictDraw : 0,
    day: raw.day,
    draws: Number.isFinite(raw.draws) ? raw.draws : 0,
    stats,
    flags: raw.flags && typeof raw.flags === 'object' ? { ...raw.flags } : {},
    queue: Array.isArray(raw.queue) ? raw.queue.filter((q) => q && q.id) : [],
    used: raw.used && typeof raw.used === 'object' ? { ...raw.used } : {},
    recent: Array.isArray(raw.recent) ? raw.recent.filter((id) => typeof id === 'string') : [],
    themeSeen: normalizeThemeSeen(raw.themeSeen),
    met: raw.met && typeof raw.met === 'object' ? { ...raw.met } : {},
    nextReview: Number.isFinite(raw.nextReview) ? raw.nextReview : 30,
    history: Array.isArray(raw.history) ? raw.history : [],
    ending: typeof raw.ending === 'string' ? raw.ending : null,
    dynasty: raw.dynasty === '启明' ? '启明' : '承平',
    guoshi: Number.isFinite(raw.guoshi) ? clamp100(raw.guoshi) : 55,
    bianjing: Number.isFinite(raw.bianjing) ? clamp100(raw.bianjing) : 30,
    virtue: Number.isFinite(raw.virtue) ? clamp100(raw.virtue) : 62,
    bribes: Number.isFinite(raw.bribes) ? raw.bribes : 0,
    troops: Number.isFinite(raw.troops) ? clamp100(raw.troops) : 0,
    founded: !!raw.founded,
    heirResume: Number.isFinite(raw.heirResume) ? raw.heirResume : 0,
    lastTroopDraw: Number.isFinite(raw.lastTroopDraw) ? raw.lastTroopDraw : 0,
    lastCrackdownDraw: Number.isFinite(raw.lastCrackdownDraw) ? raw.lastCrackdownDraw : 0,
    lastHeirDraw: Number.isFinite(raw.lastHeirDraw) ? raw.lastHeirDraw : 0,
    lastBulletinDraw: Number.isFinite(raw.lastBulletinDraw) ? raw.lastBulletinDraw : 0,
    news: Array.isArray(raw.news)
      ? raw.news
        .filter((item) => item && typeof item.text === 'string')
        .slice(0, 3)
        .map((item) => ({ id: typeof item.id === 'string' ? item.id : '', text: item.text }))
      : [],
    heard: Array.isArray(raw.heard) ? raw.heard.filter((id) => typeof id === 'string') : [],
    paths: raw.paths && typeof raw.paths === 'object'
      ? {
        clean: Number.isFinite(raw.paths.clean) ? Math.max(0, Math.min(12, raw.paths.clean)) : 0,
        graft: Number.isFinite(raw.paths.graft) ? Math.max(0, Math.min(12, raw.paths.graft)) : 0,
        pleasure: Number.isFinite(raw.paths.pleasure) ? Math.max(0, Math.min(12, raw.paths.pleasure)) : 0,
        arms: Number.isFinite(raw.paths.arms) ? Math.max(0, Math.min(12, raw.paths.arms)) : 0,
        scheme: Number.isFinite(raw.paths.scheme) ? Math.max(0, Math.min(12, raw.paths.scheme)) : 0,
      }
      : { clean: 0, graft: 0, pleasure: 0, arms: 0, scheme: 0 },
    bonds: raw.bonds && typeof raw.bonds === 'object'
      ? Object.fromEntries(
        Object.entries(raw.bonds)
          .filter(([, v]) => Number.isFinite(v))
          .map(([k, v]) => [k, Math.max(-2, Math.min(3, v))]),
      )
      : {},
    county: Array.isArray(raw.county) && raw.county.length
      ? raw.county.filter((c) => typeof c === 'string').slice(0, 2)
      : ['poor'],
    shifts: normalizeShifts(raw.shifts),
    retitled: !!raw.retitled,
    noticeQueue: waitingNotices(raw),
    noticeLine: showingNotice(raw).text,
    noticeLeft: showingNotice(raw).left,
    pathNotices: raw.pathNotices && typeof raw.pathNotices === 'object' ? { ...raw.pathNotices } : {},
    worldMarks: raw.worldMarks && typeof raw.worldMarks === 'object'
      ? Object.fromEntries(
        Object.entries(raw.worldMarks).filter(([, v]) => Number.isFinite(v)),
      )
      : {},
  };
}

export function normalizeSlots(raw) {
  const slots = createSlots();
  if (!Array.isArray(raw)) {
    return slots;
  }
  for (let i = 0; i < SLOT_COUNT; i += 1) {
    const entry = raw[i];
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const run = normalizeRun(entry.run);
    if (!run) {
      continue;
    }
    slots[i] = {
      cardId: typeof entry.cardId === 'string' ? entry.cardId : null,
      echo: typeof entry.echo === 'string' ? entry.echo : '',
      run,
    };
  }
  return slots;
}

/** payload 为 null 时清掉这个位子。返回新架子，不改入参。 */
export function writeSlot(slots, index, payload) {
  const next = slots.slice();
  if (!payload) {
    next[index] = null;
    return next;
  }
  next[index] = {
    cardId: payload.cardId || null,
    echo: payload.echo || '',
    run: JSON.parse(JSON.stringify(payload.run)),
  };
  return next;
}

/** 位子格上的两行。一行塞进撤任按钮前会画出格子。 */
export function slotFaceLines(summary) {
  return [
    `${summary.dynasty} · ${summary.county || '穷县'}`,
    `${summary.rank} · 第${summary.day}天`,
  ];
}

export function slotSummary(slot) {
  if (!slot || !slot.run) {
    return null;
  }
  const { run } = slot;
  const face = (run.county && run.county[0]) || 'poor';
  return {
    rank: RANKS[run.rank] || '县令',
    day: run.day,
    age: careerAge(run),
    dynasty: run.dynasty || '承平',
    county: COUNTY_NAMES[face] || '穷县',
  };
}
