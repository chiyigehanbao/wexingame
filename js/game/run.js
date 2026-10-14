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
const CAREER_GAP = 8;

export const RANKS = ['县令', '通判', '知府', '按察使', '巡抚', '尚书'];

/** 四项都在稳妥区间，才配接受考核。 */
export function statsArePromotable(stats) {
  return STAT_KEYS.every((k) => stats[k] >= 48 && stats[k] <= 88);
}

export function careerAge(run) {
  return 30 + run.rank * 5 + Math.floor((Math.max(1, run.day) - 1) / 40);
}

export function promote(run) {
  run.rank = Math.min(RANKS.length - 1, run.rank + 1);
  run.notice = RANKS[run.rank];
  STAT_KEYS.forEach((k) => {
    run.stats[k] = Math.round(run.stats[k] * 0.45 + 52 * 0.55);
  });
}

export function createRun(meta) {
  return {
    reign: meta.runs + 1,
    rank: 0,
    notice: '',
    lastCareerDraw: 0,
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

function takeCareer(run, deck) {
  if (run.draws - run.lastCareerDraw < CAREER_GAP) {
    return null;
  }
  const old = careerAge(run) >= 56 || run.rank >= RANKS.length - 1;
  const steady = STAT_KEYS.every((k) => run.stats[k] >= 28 && run.stats[k] <= 92);
  let kind = null;
  if (old && steady) {
    kind = 'heir';
  } else if (!old && statsArePromotable(run.stats)) {
    kind = 'inspect';
  }
  if (!kind) {
    return null;
  }
  const card = deck.find((c) => c.career === kind);
  if (!card) {
    return null;
  }
  run.lastCareerDraw = run.draws;
  return card;
}

/**
 * 抽下一张牌：剧情队列 > 升官考核 > 年终考核 > 普通卡池。
 */
export function drawCard(run, deck, meta, rng) {
  run.draws += 1;
  const byId = {};
  deck.forEach((c) => { byId[c.id] = c; });
  const card = takeQueued(run, byId)
    || takeCareer(run, deck)
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
  if (!ending && opt.careerResult === 'promote') {
    const shaky = opt.risky && STAT_KEYS.some((k) => run.stats[k] < 40);
    if (shaky) {
      ending = 'dismissed';
    } else {
      promote(run);
    }
  }
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
    .replace(/\{handoff\}/g, handoff)
    .replace(/\{rank\}/g, RANKS[run.rank] || '县令')
    .replace(/\{age\}/g, String(careerAge(run)));
}
