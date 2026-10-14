/**
 * 单局状态与抽牌 / 抉择逻辑（纯逻辑，rng 由调用方注入）。
 */
import {
  STAT_KEYS, createStats, applyFx, findBrokenStat,
} from './stats.js';
import { countEndings } from './meta.js';

export const FULL_TERM_DAYS = 365;
export const REVIEW_EVERY = 30;
const SEASON_DAYS = 40;
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

/** 每 40 天换一季，一局里能赶上两季。 */
export function seasonOf(day) {
  const index = Math.floor((Math.max(1, day) - 1) / SEASON_DAYS) % SEASONS.length;
  return SEASONS[index];
}
const COOLDOWN = 12;

export function createRun(meta) {
  return {
    reign: meta.runs + 1,
    day: 1,
    draws: 0,
    stats: createStats(),
    flags: {},
    queue: [{ id: 'intro', due: 0 }],
    used: {},
    recent: [],
    met: {},
    nextReview: REVIEW_EVERY,
    history: [],
    ending: null,
  };
}

export function isEligible(card, run, meta) {
  const req = card.requires;
  if (!req) {
    return true;
  }
  if (req.flags && !req.flags.every((f) => run.flags[f])) {
    return false;
  }
  if (req.notFlags && req.notFlags.some((f) => run.flags[f])) {
    return false;
  }
  if (req.minDay && run.day < req.minDay) {
    return false;
  }
  if (req.season && seasonOf(run.day) !== req.season) {
    return false;
  }
  if (req.stat) {
    const ok = Object.keys(req.stat).every((k) => {
      const [lo, hi] = req.stat[k];
      return run.stats[k] >= lo && run.stats[k] <= hi;
    });
    if (!ok) {
      return false;
    }
  }
  if (req.runs && meta.runs < req.runs) {
    return false;
  }
  if (req.endings && countEndings(meta) < req.endings) {
    return false;
  }
  return true;
}

function pick(list, rng) {
  const total = list.reduce((s, c) => s + (c.weight || 1), 0);
  let r = rng() * total;
  for (let i = 0; i < list.length; i += 1) {
    r -= list[i].weight || 1;
    if (r < 0) {
      return list[i];
    }
  }
  return list[list.length - 1];
}

function takeQueued(run, byId) {
  const idx = run.queue.findIndex((q) => q.due <= run.draws && byId[q.id]);
  if (idx < 0) {
    return null;
  }
  const [entry] = run.queue.splice(idx, 1);
  return byId[entry.id];
}

function takeReview(run, deck, meta, rng) {
  if (run.day < run.nextReview) {
    return null;
  }
  run.nextReview += REVIEW_EVERY;
  const pool = deck.filter((c) => c.review && isEligible(c, run, meta));
  return pool.length ? pick(pool, rng) : null;
}

function takeRegular(run, deck, meta, rng) {
  const base = deck.filter((c) => !c.chainOnly && !c.review);
  const fresh = base.filter((c) => !(c.once && run.used[c.id]) && isEligible(c, run, meta));
  const rested = fresh.filter((c) => !run.recent.includes(c.id));
  if (rested.length) {
    return pick(rested, rng);
  }
  if (fresh.length) {
    return pick(fresh, rng);
  }
  return pick(base, rng);
}

/**
 * 抽下一张牌：剧情队列 > 年终考核 > 普通卡池。
 */
export function drawCard(run, deck, meta, rng) {
  run.draws += 1;
  const byId = {};
  deck.forEach((c) => { byId[c.id] = c; });
  const card = takeQueued(run, byId)
    || takeReview(run, deck, meta, rng)
    || takeRegular(run, deck, meta, rng);
  run.used[card.id] = true;
  run.recent.push(card.id);
  if (run.recent.length > COOLDOWN) {
    run.recent.shift();
  }
  return card;
}

/**
 * @param {'left'|'right'} side
 * @returns {{ delta: Record<string, number>, ending: string|null }}
 */
export function choose(run, card, side, rng) {
  const opt = card[side] || {};
  const before = run.stats;
  run.stats = applyFx(before, opt.fx);
  const delta = {};
  STAT_KEYS.forEach((k) => {
    if (run.stats[k] !== before[k]) {
      delta[k] = run.stats[k] - before[k];
    }
  });
  if (opt.flags) {
    run.flags = { ...run.flags, ...opt.flags };
  }
  if (opt.chain) {
    run.queue.push({ id: opt.chain.id, due: run.draws + (opt.chain.delay || 0) + 1 });
  }
  if (card.who) {
    run.met[card.who] = true;
  }
  run.day += 1 + Math.floor(rng() * 3);
  run.history.push({ id: card.id, side });

  let ending = opt.ending || null;
  if (!ending) {
    const broken = findBrokenStat(run.stats);
    if (broken) {
      ending = `${broken.key}_${broken.side}`;
    }
  }
  if (!ending && run.day >= FULL_TERM_DAYS) {
    ending = 'full_term';
  }
  run.ending = ending;
  return { delta, ending };
}

export function formatCardText(card, run, meta, endings) {
  const handoff = (meta.lastEnding && endings[meta.lastEnding]?.handoff) || '';
  return (card.text || '')
    .replace(/\{n\}/g, String(run.reign))
    .replace(/\{handoff\}/g, handoff);
}
