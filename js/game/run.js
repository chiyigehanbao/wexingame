/**
 * 单局状态与抽牌 / 抉择逻辑（纯逻辑，rng 由调用方注入）。
 */
import {
  STAT_KEYS, createStats, applyFx, findBrokenStat,
} from './stats.js';
import { countEndings } from './meta.js';
import {
  FULL_TERM_DAYS, FULL_TERM_YEARS, OLD_AGE, YEAR_DAYS, seasonOf, yearOf, careerAge, passDays, reignHeaderLines, clearReignHeader,
} from './time.js';
import { BULLETINS } from '../data/bulletins.js';
import {
  PATH_KEYS, PATH_NAMES, PATH_ARM_CARD, emptyPaths, applyPathDelta,
  cardPathWeight, COUNTY_FACES, COUNTY_NAMES, pathScentLine,
} from './paths.js';
import { applyWorldMark, isKnown, FAMILIAR_ARC_DAY } from './world.js';
import { RANKS } from './ranks.js';

export { FULL_TERM_DAYS, OLD_AGE, seasonOf, yearOf, careerAge, reignHeaderLines, clearReignHeader };
export { PATH_KEYS, PATH_NAMES, pathScentLine, COUNTY_NAMES, RANKS };
export const REVIEW_EVERY = YEAR_DAYS;
const COOLDOWN = 18;
const THEME_GAP = 18;
const EDICT_GAP = 7;
const CRACKDOWN_GAP = 22;

/**
 * 四项合在一起决定间隔。六十分上下是 12 桩，都很高可以到 6 桩。
 * 最低的一项会把间隔拉长，但不会把考核取消。
 */
export function careerGap(stats) {
  const vals = STAT_KEYS.map((k) => stats[k]);
  const avg = vals.reduce((sum, n) => sum + n, 0) / vals.length;
  const low = Math.min(...vals);
  const score = (avg * 2 + low) / 3;
  const gap = Math.round(12 - ((score - 60) / 30) * 6);
  return Math.max(6, Math.min(18, gap));
}

function clamp100(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

const CLAIM = {
  office: { card: 'throne_war', notice: '升为皇帝' },
  succession: { card: 'throne_succession', notice: '进京承了位' },
  revolt: { card: 'throne_revolt', notice: '举旗称帝' },
  defect: { card: 'throne_defect', notice: '倒戈称帝' },
  rise: { card: 'throne_rise', notice: '起兵称帝' },
};

/** 登基。一条路只能走一次：正常升上去、驾崩进京、举旗、策反、刚升一级就起兵。 */
export function claimThrone(run, how) {
  if (run.flags?.claimed) {
    return false;
  }
  const plan = CLAIM[how] || CLAIM.office;
  run.rank = RANKS.length - 1;
  run.flags = { ...run.flags, claimed: true };
  run.queue.push({ id: 'throne_name', due: run.draws + 1 });
  run.queue.push({ id: plan.card, due: run.draws + 4 });
  run.notice = plan.notice;
  return true;
}

export function promote(run) {
  run.rank = Math.min(RANKS.length - 1, run.rank + 1);
  run.notice = `升为${RANKS[run.rank]}`;
  STAT_KEYS.forEach((k) => {
    run.stats[k] = Math.round(run.stats[k] * 0.5 + 60 * 0.5);
  });
  if (run.rank >= RANKS.length - 1) {
    claimThrone(run, 'office');
  }
}

/** 厚礼跳级。最多跳到尚书，皇帝仍要另走。 */
export function skipRank(run) {
  const cap = RANKS.length - 2;
  const next = Math.min(cap, (run.rank || 0) + 2);
  if (next <= (run.rank || 0)) {
    run.notice = '礼收下了，位子不动';
    return;
  }
  run.rank = next;
  run.flags = { ...run.flags, jumped: true };
  run.notice = `跳为${RANKS[run.rank]}`;
}

/** 局内改任：还是县令，换个县面，还能再爬。一局一次。 */
/** 桥、学、仓绑在这一县。调走后新县还能再修，人物交情留下。 */
const COUNTY_WORKS = [
  'shiye_bridge',
  'qian_school',
  'sheng_school',
  'gou_school',
  'county_school',
  'shiye_granary',
];

export function retitleCounty(run) {
  if (run.retitled) {
    run.notice = '调令已经下过一回了';
    return false;
  }
  run.retitled = true;
  run.rank = 0;
  if (!run.paths) {
    run.paths = emptyPaths();
  }
  PATH_KEYS.forEach((k) => {
    run.paths[k] = Math.floor((run.paths[k] || 0) / 2);
  });
  if (run.used) {
    COUNTY_WORKS.forEach((id) => {
      delete run.used[id];
    });
  }
  const cur = (run.county && run.county[0]) || 'poor';
  const pool = COUNTY_FACES.filter((c) => c !== cur);
  const pickFace = pool[Math.abs((run.day || 1) + (run.draws || 0)) % pool.length];
  run.county = [pickFace];
  run.shifts = {};
  run.notice = `调去${COUNTY_NAMES[pickFace] || '别的县'}，还是县令`;
  return true;
}

function applyBondDelta(run, bond) {
  if (!bond || !bond.who) {
    return;
  }
  if (!run.bonds) {
    run.bonds = {};
  }
  const d = Number.isFinite(bond.d) ? bond.d : 1;
  const next = (run.bonds[bond.who] || 0) + d;
  run.bonds[bond.who] = Math.max(-2, Math.min(3, next));
}

function armPathEvents(run, crossed) {
  if (!crossed.length) {
    return;
  }
  if (!run.pathNotices) {
    run.pathNotices = {};
  }
  crossed.forEach(({ key, tier }) => {
    const noticeKey = `${key}_${tier}`;
    if (!run.pathNotices[noticeKey] && !run.notice) {
      run.pathNotices[noticeKey] = true;
      if (tier === 3) {
        run.notice = `城里开始传你${PATH_NAMES[key]}`;
      } else if (tier === 6) {
        run.notice = `这一任，已经是${PATH_NAMES[key]}的气味了`;
      }
    } else {
      run.pathNotices[noticeKey] = true;
    }
    if (tier === 6) {
      const cardId = PATH_ARM_CARD[key];
      const flag = `path_${key}_armed`;
      if (cardId && !run.flags?.[flag]) {
        run.flags = { ...run.flags, [flag]: true };
        run.queue.push({ id: cardId, due: run.draws + 2 });
      }
    }
  });
}

function nextDynasty(name) {
  return name === '启明' ? '承平' : '启明';
}

/** 夜访跟上：国号换了，位子还是你的，这一任接着断。 */
export function foundDynasty(run) {
  run.dynasty = nextDynasty(run.dynasty || '承平');
  run.founded = true;
  run.flags = { ...run.flags, founded: true };
  run.virtue = 50;
  run.guoshi = clamp100((run.guoshi ?? 55) - 8);
  run.notice = `国号改为${run.dynasty}`;
}

/** 朝代撑不住：降一级，留在新朝。 */
export function enterNewCourt(run) {
  run.dynasty = nextDynasty(run.dynasty || '承平');
  run.founded = true;
  run.flags = { ...run.flags, founded: true };
  run.rank = Math.max(0, (run.rank || 0) - 1);
  run.bribes = 0;
  run.virtue = 58;
  run.guoshi = 50;
  run.troops = Math.max(0, (run.troops || 0) - 20);
  run.notice = `${run.dynasty}朝 · ${RANKS[run.rank]}`;
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
    themeSeen: {},
    met: {},
    nextReview: REVIEW_EVERY,
    history: [],
    ending: null,
    dynasty: meta.dynasty || '承平',
    guoshi: 55,
    bianjing: 30,
    virtue: 62,
    bribes: 0,
    troops: 0,
    founded: false,
    heirResume: 0,
    lastEdictDraw: 0,
    lastTroopDraw: 0,
    lastCrackdownDraw: 0,
    lastHeirDraw: 0,
    lastBulletinDraw: 0,
    news: [],
    heard: [],
    paths: emptyPaths(),
    bonds: {},
    county: [COUNTY_FACES[(meta.runs || 0) % COUNTY_FACES.length]],
    shifts: {},
    retitled: false,
    pathNotices: {},
    worldMarks: {},
    noticeQueue: [],
    noticeLine: '',
    noticeLeft: 0,
  };
}

function familiarMinDay(card, minDay, meta) {
  if (typeof card?.id !== 'string' || !card.id.startsWith('arc_')) {
    return minDay;
  }
  if (!isKnown(meta?.world, card.who)) {
    return minDay;
  }
  return Math.min(minDay, FAMILIAR_ARC_DAY);
}

export function isEligible(card, run, meta) {
  if (card.county) {
    const have = run.county || ['poor'];
    const need = Array.isArray(card.county) ? card.county : [card.county];
    if (!need.some((c) => have.includes(c))) {
      return false;
    }
  }
  const req = card.requires;
  if (!req) {
    return true;
  }
  if (req.flags && !req.flags.every((f) => run.flags[f] || (f === 'founded' && run.founded))) {
    return false;
  }
  if (req.notFlags && req.notFlags.some((f) => run.flags[f])) {
    return false;
  }
  if (req.minDay && run.day < familiarMinDay(card, req.minDay, meta)) {
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
  if (req.guoshi) {
    const [lo, hi] = req.guoshi;
    const guoshi = run.guoshi ?? 55;
    if (guoshi < lo || guoshi > hi) {
      return false;
    }
  }
  if (req.runs && meta.runs < req.runs) {
    return false;
  }
  if (req.endings && countEndings(meta) < req.endings) {
    return false;
  }
  if (req.minRank && (run.rank || 0) < req.minRank) {
    return false;
  }
  if (Number.isFinite(req.maxRank) && (run.rank || 0) > req.maxRank) {
    return false;
  }
  if (req.minTroops && (run.troops || 0) < req.minTroops) {
    return false;
  }
  if (req.minPath) {
    const paths = run.paths || emptyPaths();
    const ok = Object.keys(req.minPath).every((k) => (paths[k] || 0) >= req.minPath[k]);
    if (!ok) {
      return false;
    }
  }
  if (req.county) {
    const have = run.county || ['poor'];
    const need = Array.isArray(req.county) ? req.county : [req.county];
    if (!need.some((c) => have.includes(c))) {
      return false;
    }
  }
  if (req.bond) {
    const bonds = run.bonds || {};
    const ok = Object.keys(req.bond).every((who) => {
      const want = req.bond[who];
      const v = bonds[who] || 0;
      if (Array.isArray(want)) {
        return v >= want[0] && v <= want[1];
      }
      return v >= want;
    });
    if (!ok) {
      return false;
    }
  }
  if (req.world) {
    const world = meta.world || {};
    const ok = Object.keys(req.world).every((k) => {
      if (k === 'people') {
        const need = req.world.people || {};
        const have = world.people || {};
        return Object.keys(need).every((who) => have[who] === need[who]);
      }
      if (k === 'lastPath' || k === 'lastCounty') {
        return world[k] === req.world[k];
      }
      return (world[k] || 0) >= req.world[k];
    });
    if (!ok) {
      return false;
    }
  }
  if (req.minRuns && (meta.runs || 0) < req.minRuns) {
    return false;
  }
  if (req.pack && !(meta.unlockedPacks || []).includes(req.pack)) {
    return false;
  }
  return true;
}

function pick(list, rng, weightOf) {
  const weights = list.map((c) => (weightOf ? weightOf(c) : (c.weight || 1)));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < list.length; i += 1) {
    r -= weights[i];
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

function takeRevolt(run, deck) {
  if (run.draws < 40 || (run.rank || 0) < 2 || run.flags.revolt_asked) {
    return null;
  }
  if (run.stats.people < 72 || run.stats.money < 72) {
    return null;
  }
  if ((run.guoshi ?? 55) > 42) {
    return null;
  }
  return deck.find((c) => c.career === 'revolt') || null;
}

function takeCrackdown(run, deck) {
  if ((run.troops || 0) < 58) {
    return null;
  }
  const last = run.lastCrackdownDraw || 0;
  if (last && run.draws - last < CRACKDOWN_GAP) {
    return null;
  }
  const id = run.flags.crackdown_done ? 'crackdown_again' : 'crackdown';
  const card = deck.find((c) => c.id === id);
  if (!card) {
    return null;
  }
  run.lastCrackdownDraw = run.draws;
  return card;
}

function themeHot(run, card) {
  if (!card || !card.theme) {
    return false;
  }
  const last = run.themeSeen && run.themeSeen[card.theme];
  return Number.isFinite(last) && run.draws - last < THEME_GAP;
}

function skipHotTheme(pool, run) {
  const cool = pool.filter((c) => !themeHot(run, c));
  return cool.length ? cool : pool;
}

function takeTroop(run, deck, meta) {
  if ((run.rank || 0) < 1 || run.draws < 22) {
    return null;
  }
  const crackdown = takeCrackdown(run, deck);
  if (crackdown) {
    return crackdown;
  }
  if (run.draws - (run.lastTroopDraw || 0) < 11 + ((run.draws + 2) % 4)) {
    return null;
  }
  const pool = skipHotTheme(
    deck.filter((c) => c.troop && !run.recent.includes(c.id) && isEligible(c, run, meta)),
    run,
  );
  const card = pool.find((c) => c.id === 'troop_volunteer') || pool[0];
  if (!card) {
    return null;
  }
  run.lastTroopDraw = run.draws;
  return card;
}

function takeEdict(run, deck, meta, rng) {
  if ((run.rank || 0) < 1) {
    return null;
  }
  if (run.draws - (run.lastEdictDraw || 0) < EDICT_GAP + (run.draws % 3)) {
    return null;
  }
  const pool = skipHotTheme(
    deck.filter((c) => c.edict && !(c.once && run.used[c.id]) && !run.recent.includes(c.id) && isEligible(c, run, meta)),
    run,
  );
  if (!pool.length) {
    return null;
  }
  run.lastEdictDraw = run.draws;
  return pick(pool, rng);
}

function takeRegular(run, deck, meta, rng) {
  const base = deck.filter((c) => !c.chainOnly && !c.review && !c.edict && !c.troop);
  const weightOf = (c) => cardPathWeight(c, run, meta);
  const open = base.filter((c) => !(c.once && run.used[c.id]) && isEligible(c, run, meta));
  const rested = open.filter((c) => !run.recent.includes(c.id));
  const freshRested = rested.filter((c) => !themeHot(run, c));
  if (freshRested.length) {
    return pick(freshRested, rng, weightOf);
  }
  const freshOpen = open.filter((c) => !themeHot(run, c));
  if (freshOpen.length) {
    return pick(freshOpen, rng, weightOf);
  }
  if (rested.length) {
    return pick(rested, rng, weightOf);
  }
  if (open.length) {
    return pick(open, rng, weightOf);
  }
  const repeatable = base.filter((c) => !c.once && isEligible(c, run, meta));
  if (repeatable.length) {
    return pick(repeatable, rng, weightOf);
  }
  const everyday = base.filter((c) => !c.once);
  return pick(everyday.length ? everyday : base, rng, weightOf);
}

function careerReady(run) {
  const gap = careerGap(run.stats);
  if (!run.lastCareerDraw) {
    return run.draws >= gap + 6;
  }
  return run.draws - run.lastCareerDraw >= gap;
}

function takeCareer(run, deck) {
  if (!careerReady(run)) {
    return null;
  }
  if (run.rank >= RANKS.length - 1) {
    return null;
  }
  const card = deck.find((c) => c.career === 'inspect');
  if (!card) {
    return null;
  }
  run.lastCareerDraw = run.draws;
  return card;
}

/** 岁数到了可以问交印，但不占考核那一抽，也不改下次升官的间隔。 */
function takeOldHeir(run, deck) {
  if (run.rank >= RANKS.length - 1 || careerAge(run) < OLD_AGE) {
    return null;
  }
  if (run.heirResume && run.draws < run.heirResume) {
    return null;
  }
  if (run.lastHeirDraw && run.draws - run.lastHeirDraw < 18) {
    return null;
  }
  const card = deck.find((c) => c.career === 'heir');
  if (!card) {
    return null;
  }
  run.lastHeirDraw = run.draws;
  return card;
}

/**
 * 抽下一张牌：已经排上的事先发生。年终考核先于交印、称帝、兵和圣旨。升官看四项，先于年终考核。
 */
export function drawCard(run, deck, meta, rng) {
  run.draws += 1;
  const byId = {};
  deck.forEach((c) => { byId[c.id] = c; });
  const card = takeQueued(run, byId)
    || takeCareer(run, deck)
    || takeReview(run, deck, meta, rng)
    || takeOldHeir(run, deck)
    || takeRevolt(run, deck)
    || takeTroop(run, deck, meta)
    || takeEdict(run, deck, meta, rng)
    || takeRegular(run, deck, meta, rng);
  run.used[card.id] = true;
  if (card.theme) {
    if (!run.themeSeen) {
      run.themeSeen = {};
    }
    run.themeSeen[card.theme] = run.draws;
  }
  run.recent.push(card.id);
  if (run.recent.length > COOLDOWN) {
    run.recent.shift();
  }
  return card;
}

const BULLETIN_GAP = 5;

/**
 * 跨年：税按册子进仓；民心旺了百姓再送粮。
 * 仓浅了多进一截；仓已很满时少进一点。
 */
function settleYearIncome(run, yearBefore, delta) {
  if (yearOf(run.day) === yearBefore) {
    return;
  }
  const people = run.stats.people;
  const money = run.stats.money;
  let gain = 6;
  if (people >= 70) {
    gain += 5;
  }
  if (people >= 85) {
    gain += 4;
  }
  if (money < 28) {
    gain += 6;
  } else if (money < 42) {
    gain += 3;
  }
  if (money >= 88) {
    gain = Math.min(gain, 2);
  }
  if (gain <= 0) {
    return;
  }
  const before = run.stats.money;
  run.stats = applyFx(run.stats, { money: gain });
  const got = run.stats.money - before;
  if (got > 0) {
    delta.money = (delta.money || 0) + got;
    if (!run.notice) {
      if (money < 42) {
        run.notice = '仓浅了，秋税多进了一截';
      } else if (people >= 70) {
        run.notice = '百姓送了些粮上来';
      } else {
        run.notice = '秋税进了仓';
      }
    }
  }
}

export const NOTICE_HOLD = { strong: 3.2, weak: 2.6 };
/** 强通告的 3.2 秒里，最快连甩大约能再来 4 张牌，各带一句。 */
export const NOTICE_QUEUE = 4;

function pendingQueue(pending) {
  if (Array.isArray(pending)) {
    return pending.filter(Boolean);
  }
  return pending ? [pending] : [];
}

/** 屏上这句还剩几秒。跟着这一任走，进朝廷再回来接着说，不重新响。 */
export function showingNotice(run) {
  const text = run && typeof run.noticeLine === 'string' ? run.noticeLine : '';
  const left = run && Number.isFinite(run.noticeLeft) ? run.noticeLeft : 0;
  if (!text || left <= 0) {
    return { text: '', left: 0 };
  }
  return { text, left: Math.min(left, NOTICE_HOLD.strong) };
}

/** 还没上屏的弱句。跟着这一任走，不跟升堂的场面走。 */
export function waitingNotices(run) {
  const raw = run && Array.isArray(run.noticeQueue) ? run.noticeQueue : [];
  return raw.filter((line) => typeof line === 'string' && line).slice(0, NOTICE_QUEUE);
}

/** 升官、称帝、跳级、调任、换国号等，不被朝报之类冲掉。 */
export function isStrongNotice(text) {
  if (!text) {
    return false;
  }
  return /^(升为|跳为|调去|国号|朝风|印先|城里开始|这一任)/.test(text)
    || text.includes('压到本县')
    || text.includes('落到本县')
    || text.includes('称帝')
    || text.includes('承了位')
    || text.includes('任满');
}

/**
 * 强通告还在时，弱句按到来的次序搁下，等这一句离开再逐条上。
 * 强句可以换掉屏上的强句，已经搁下的弱句还在。弱句换弱句时，不保留旧的。
 */
export function foldNotice({
  showing = '', until = 0, pending = '', now = 0, incoming = '',
}) {
  let notice = showing || '';
  let nextUntil = until;
  let nextPending = pendingQueue(pending);
  let chime = false;
  let high = false;
  const holding = isStrongNotice(notice) && now < nextUntil;
  if (incoming) {
    if (holding && !isStrongNotice(incoming)) {
      if (nextPending.length < NOTICE_QUEUE && nextPending[nextPending.length - 1] !== incoming) {
        nextPending = [...nextPending, incoming];
      }
    } else {
      high = isStrongNotice(incoming);
      notice = incoming;
      nextUntil = now + (high ? NOTICE_HOLD.strong : NOTICE_HOLD.weak);
      chime = true;
      if (!high) {
        nextPending = [];
      }
    }
  } else if (nextPending.length && !holding) {
    const [first, ...rest] = nextPending;
    high = isStrongNotice(first);
    notice = first;
    nextUntil = now + (high ? NOTICE_HOLD.strong : NOTICE_HOLD.weak);
    nextPending = rest;
    chime = true;
  }
  return { notice, until: nextUntil, pending: nextPending, chime, high };
}

const SHIFT_LINE = {
  chaos: '匪事压到本县来了',
  school: '科举的事落到本县了',
  flood: '河事压到本县来了',
  border: '边事压到本县来了',
  poor: '饥荒压到本县来了',
  salt: '盐政压到本县来了',
};

/** 同一类京报听到第二回，本县再沾上一个县面。已经有两面，或这一面本来就有，就不再加。 */
function applyBulletinShift(run, item) {
  const tag = item && item.shift;
  if (!SHIFT_LINE[tag]) {
    return false;
  }
  if (!run.shifts) {
    run.shifts = {};
  }
  run.shifts[tag] = (run.shifts[tag] || 0) + 1;
  if (run.shifts[tag] !== 2) {
    return false;
  }
  if (!run.county) {
    run.county = ['poor'];
  }
  if (run.county.includes(tag) || run.county.length >= 2) {
    return false;
  }
  run.county = [...run.county, tag];
  return true;
}

function bulletinWeight(item, run) {
  let w = item.weight || 1;
  const face = run?.county && run.county[0];
  if (face && item.face === face) {
    w *= 3;
  }
  return w;
}

/** 朝报到了就改国势。同一条这一任不再听第二遍。有更要紧的通告时，不盖掉那一行。 */
export function hearBulletin(run, rng) {
  if (!run || run.draws < 8) {
    return null;
  }
  if (run.draws - (run.lastBulletinDraw || 0) < BULLETIN_GAP) {
    return null;
  }
  if (rng() > 0.7) {
    return null;
  }
  const heard = new Set(run.heard || []);
  const pool = BULLETINS.filter((item) => !heard.has(item.id));
  if (!pool.length) {
    return null;
  }
  const item = pick(pool, rng, (b) => bulletinWeight(b, run));
  if (!item) {
    return null;
  }
  run.lastBulletinDraw = run.draws;
  run.heard = [...heard, item.id];
  if (Number.isFinite(item.guoshi)) {
    run.guoshi = clamp100((run.guoshi ?? 55) + item.guoshi);
  }
  if (Number.isFinite(item.bianjing)) {
    run.bianjing = clamp100((run.bianjing ?? 30) + item.bianjing);
  }
  if (item.flag) {
    run.flags = { ...run.flags, [item.flag]: true };
  }
  const entry = { id: item.id, text: item.text };
  run.news = [entry, ...(run.news || [])].slice(0, 3);
  const shifted = applyBulletinShift(run, item);
  if (shifted && !isStrongNotice(run.notice)) {
    run.notice = SHIFT_LINE[item.shift];
  } else if (!run.notice) {
    run.notice = item.text;
  }
  return item;
}

/**
 * @param {'left'|'right'} side
 * @returns {{ delta: Record<string, number>, ending: string|null }}
 */
export function choose(run, card, side, rng) {
  const opt = card[side] || {};
  const raw = opt.fx || {};
  const fx = { ...raw };
  if (card.edict && fx.money < 0 && (run.rank || 0) > 1) {
    fx.money -= (run.rank - 1);
  }
  const before = run.stats;
  run.stats = applyFx(before, fx);
  const delta = {};
  STAT_KEYS.forEach((k) => {
    if (run.stats[k] !== before[k]) {
      delta[k] = run.stats[k] - before[k];
    }
  });
  if (opt.flags) {
    run.flags = { ...run.flags, ...opt.flags };
  }
  if (opt.courtShift) {
    if (Number.isFinite(opt.courtShift.guoshi)) {
      run.guoshi = clamp100((run.guoshi ?? 55) + opt.courtShift.guoshi);
    }
    if (Number.isFinite(opt.courtShift.bianjing)) {
      run.bianjing = clamp100((run.bianjing ?? 30) + opt.courtShift.bianjing);
    }
  }
  if (Number.isFinite(opt.troops)) {
    run.troops = clamp100((run.troops || 0) + opt.troops);
  }
  if (Number.isFinite(opt.virtue)) {
    run.virtue = clamp100((run.virtue ?? 62) + opt.virtue);
  }
  if (opt.path) {
    const crossed = applyPathDelta(run, opt.path);
    armPathEvents(run, crossed);
  }
  if (opt.bond) {
    applyBondDelta(run, opt.bond);
  }
  if (opt.countyAdd) {
    const tag = opt.countyAdd;
    if (!run.county) {
      run.county = ['poor'];
    }
    if (!run.county.includes(tag)) {
      run.county = [...run.county, tag].slice(0, 2);
    }
  }
  if (opt.world) {
    applyWorldMark(run, opt.world);
  }
  if (opt.chain) {
    run.queue.push({ id: opt.chain.id, due: run.draws + (opt.chain.delay || 0) + 1 });
  }
  if (card.who) {
    run.met[card.who] = true;
  }
  const yearBefore = yearOf(run.day);
  run.day = passDays(run.day, rng);
  run.history.push({ id: card.id, side });
  settleYearIncome(run, yearBefore, delta);

  let ending = opt.ending || null;
  if (!ending && opt.careerResult === 'promote') {
    if (opt.risky) {
      run.bribes = (run.bribes || 0) + 1;
      if ((run.virtue ?? 62) >= 55) {
        run.virtue = clamp100((run.virtue ?? 62) - 12);
        run.notice = '朝风太正，这一关没过';
      } else {
        run.virtue = clamp100((run.virtue ?? 62) - 14);
        promote(run);
      }
      if (run.bribes >= 3 && !run.flags.collapse_queued) {
        run.flags = { ...run.flags, collapse_queued: true };
        run.queue.push({ id: 'fall_1', due: run.draws + 4 });
      }
    } else {
      run.virtue = clamp100((run.virtue ?? 62) + 6);
      promote(run);
    }
  }
  if (!ending && opt.careerResult === 'found') {
    foundDynasty(run);
  }
  if (!ending && opt.careerResult === 'claim') {
    claimThrone(run, opt.claim || 'revolt');
  }
  if (!ending && opt.careerResult === 'skip') {
    skipRank(run);
  }
  if (!ending && opt.careerResult === 'retitle') {
    retitleCounty(run);
  }
  if (!ending && opt.careerResult === 'stay') {
    enterNewCourt(run);
  }
  if (!ending && opt.careerResult === 'later') {
    const gap = (run.rank || 0) >= RANKS.length - 1 ? 36 : 14;
    run.heirResume = run.draws + gap;
    run.notice = '印先自己攥着';
  }
  if (yearOf(run.day) !== yearBefore) {
    const y = yearOf(run.day);
    const termYear = (run.rank || 0) >= RANKS.length - 1 ? FULL_TERM_YEARS + 1 : FULL_TERM_YEARS;
    if (y >= termYear) {
      const prev = run.notice || '';
      let tax = '';
      if (prev.includes('仓浅')) {
        tax = '仓浅，税多进了一截';
      } else if (prev.includes('百姓')) {
        tax = '百姓送了粮';
      } else if (/税|粮/.test(prev)) {
        tax = '秋税进了仓';
      }
      run.notice = tax ? `任满不远。${tax}` : '任满不远';
    } else if (!run.notice) {
      run.notice = `第${y}年了`;
    }
  }
  if (!ending) {
    hearBulletin(run, rng);
  }
  if (!ending) {
    const broken = findBrokenStat(run.stats);
    if (broken) {
      ending = `${broken.key}_${broken.side}`;
    }
  }
  if (!ending && run.day >= ((run.rank || 0) >= RANKS.length - 1 ? FULL_TERM_DAYS + YEAR_DAYS : FULL_TERM_DAYS)) {
    ending = (run.rank || 0) >= RANKS.length - 1 ? 'empire_peace' : 'full_term';
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
    .replace(/\{age\}/g, String(careerAge(run)))
    .replace(/\{dynasty\}/g, run.dynasty || '承平');
}
