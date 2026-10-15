import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun, drawCard, choose, isEligible, formatCardText, seasonOf,
  careerAge, yearOf, reignHeaderLines, clearReignHeader, REVIEW_EVERY, FULL_TERM_DAYS,   RANKS, hearBulletin, claimThrone, skipRank, retitleCounty,
  foldNotice, NOTICE_HOLD, NOTICE_QUEUE,
} from '../js/game/run.js';
import { emptyPaths, cardPathWeight } from '../js/game/paths.js';
import { CARDS } from '../js/data/cards.js';
import { BULLETINS } from '../js/data/bulletins.js';
import { createMeta } from '../js/game/meta.js';
import { normalizeSlots } from '../js/game/slots.js';

const seq = (...values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

const choice = (fx = {}, extra = {}) => ({ label: 'x', fx, ...extra });

const DECK = [
  { id: 'intro', who: 'a', text: '第{n}任。{handoff}', chainOnly: true, left: choice(), right: choice() },
  { id: 'plain', who: 'a', text: 't', left: choice({ people: -10 }), right: choice({ people: 10 }) },
  { id: 'other', who: 'b', text: 't', left: choice(), right: choice() },
  { id: 'gated', who: 'b', text: 't', requires: { flags: ['seen_fox'] }, left: choice(), right: choice() },
  { id: 'chainee', who: 'b', text: 't', chainOnly: true, left: choice(), right: choice() },
  { id: 'review', who: 'c', text: 't', review: true, left: choice(), right: choice() },
];

const ENDINGS = { people_low: { handoff: 'H-low' } };

test('createRun queues the intro card and numbers the reign from meta', () => {
  const meta = { ...createMeta(), runs: 2 };
  const run = createRun(meta);
  assert.equal(run.reign, 3);
  assert.equal(run.day, 1);
  assert.equal(drawCard(run, DECK, meta, seq(0)).id, 'intro');
});

test('formatCardText fills reign number and previous handoff', () => {
  const meta = { ...createMeta(), runs: 1, lastEnding: 'people_low' };
  const run = createRun(meta);
  assert.equal(formatCardText(DECK[0], run, meta, ENDINGS), '第2任。H-low');
  assert.equal(formatCardText(DECK[0], createRun(createMeta()), createMeta(), ENDINGS), '第1任。');
});

test('chainOnly, review and gated cards are not drawn from the normal pool', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  const seen = new Set();
  for (let i = 0; i < 40; i += 1) {
    seen.add(drawCard(run, DECK, meta, Math.random).id);
  }
  assert.deepEqual([...seen].sort(), ['other', 'plain']);
});

test('a hundred troops wrap the reign header, a short posting stays one line', () => {
  const fits = (lines, width) => lines.every((ln) => [...ln].length * 13 <= width - 32);
  const quiet = reignHeaderLines({
    year: 1, season: '春', rank: '县令', age: 30, troops: null, width: 375,
  });
  assert.deepEqual(quiet, ['第1年 · 春 · 县令 · 30岁']);
  const posted = reignHeaderLines({
    year: 5, season: '冬', rank: '按察使', age: 49, troops: 40, width: 375,
  });
  assert.equal(posted.length, 1);
  assert.ok(fits(posted, 375));
  const full = reignHeaderLines({
    year: 5, season: '冬', rank: '按察使', age: 49, troops: 100, width: 375,
  });
  assert.equal(full.length, 2);
  assert.ok(fits(full, 375));
  const narrow = reignHeaderLines({
    year: 5, season: '冬', rank: '按察使', age: 49, troops: 40, width: 320,
  });
  assert.equal(narrow.length, 2);
  assert.ok(fits(narrow, 320));
});

test('a two-line reign header pushes the story clear of the notice', () => {
  const reignY = 182;
  const textTop = 212;
  const crowded = clearReignHeader({ reignY, cardH: 310, textTop, lineCount: 2 });
  assert.ok(crowded.shift > 0);
  assert.ok(crowded.textTop - 12 >= reignY + 36 + 7 + 6);
  assert.equal(crowded.cardH, 310 - crowded.shift);
  const quiet = clearReignHeader({ reignY, cardH: 310, textTop, lineCount: 1 });
  assert.equal(quiet.shift, 0);
  assert.equal(quiet.textTop, textTop);
  const oneEcho = clearReignHeader({
    reignY, cardH: 310, textTop, lineCount: 1, echo: 26,
  });
  assert.ok(oneEcho.shift > 0);
  assert.ok(oneEcho.textTop - 12 - 26 >= reignY + 20 + 7 + 6);
  const echoed = clearReignHeader({
    reignY, cardH: 310, textTop, lineCount: 2, echo: 26,
  });
  assert.ok(echoed.shift > crowded.shift);
  assert.ok(echoed.textTop - 12 - 26 >= reignY + 36 + 7 + 6);
});

test('seasonOf walks the four seasons of a year', () => {
  assert.equal(seasonOf(1), 'spring');
  assert.equal(seasonOf(36), 'spring');
  assert.equal(seasonOf(37), 'summer');
  assert.equal(seasonOf(73), 'autumn');
  assert.equal(seasonOf(109), 'winter');
  assert.equal(seasonOf(145), 'spring');
  assert.equal(yearOf(1), 1);
  assert.equal(yearOf(145), 2);
  assert.equal(yearOf(600), 5);
});

test('a season requirement keeps the card out of other seasons', () => {
  const meta = createMeta();
  const run = createRun(meta);
  const card = { id: 'snow', requires: { season: 'winter' } };
  assert.equal(isEligible(card, run, meta), false);
  run.day = 121;
  assert.equal(isEligible(card, run, meta), true);
});

test('isEligible checks flags, notFlags, minDay, stat ranges and meta gates', () => {
  const meta = createMeta();
  const run = createRun(meta);
  const card = (requires) => ({ id: 'z', requires });
  assert.equal(isEligible(card({ flags: ['f'] }), run, meta), false);
  run.flags.f = true;
  assert.equal(isEligible(card({ flags: ['f'] }), run, meta), true);
  assert.equal(isEligible(card({ notFlags: ['f'] }), run, meta), false);
  assert.equal(isEligible(card({ minDay: 10 }), run, meta), false);
  assert.equal(isEligible(card({ stat: { heart: [70, 100] } }), run, meta), false);
  run.stats.heart = 75;
  assert.equal(isEligible(card({ stat: { heart: [70, 100] } }), run, meta), true);
  assert.equal(isEligible(card({ runs: 1 }), run, meta), false);
  assert.equal(isEligible(card({ runs: 1 }), run, { ...meta, runs: 1 }), true);
  assert.equal(isEligible(card({ endings: 1 }), run, { ...meta, endings: { x: 1 } }), true);
  assert.equal(isEligible(card({ guoshi: [0, 22] }), run, meta), false);
  run.guoshi = 10;
  assert.equal(isEligible(card({ guoshi: [0, 22] }), run, meta), true);
  assert.equal(isEligible(card({ guoshi: [85, 100] }), run, meta), false);
  assert.equal(isEligible(card({ flags: ['founded'] }), run, meta), false);
  run.founded = true;
  assert.equal(isEligible(card({ flags: ['founded'] }), run, meta), true);
});

test('choose applies fx, flags, advances days and returns deltas', () => {
  const meta = createMeta();
  const run = createRun(meta);
  const card = { id: 'k', left: choice({ people: -10, money: 5 }, { flags: { ok: true } }), right: choice() };
  const res = choose(run, card, 'left', seq(0.99));
  assert.equal(run.stats.people, 40);
  assert.equal(run.stats.money, 55);
  assert.equal(run.flags.ok, true);
  assert.equal(run.day, 11);
  assert.deepEqual(res.delta, { people: -10, money: 5 });
  assert.equal(res.ending, null);
});

test('a chain choice queues its follow-up card after the delay', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  const card = { id: 'k', left: choice({}, { chain: { id: 'chainee', delay: 2 } }), right: choice() };
  choose(run, card, 'left', seq(0));
  const ids = [drawCard(run, DECK, meta, seq(0)).id, drawCard(run, DECK, meta, seq(0)).id];
  assert.equal(ids.includes('chainee'), false);
  assert.equal(drawCard(run, DECK, meta, seq(0)).id, 'chainee');
});

test('a due yearly review comes before troops, and a queued story comes before the review', () => {
  const meta = createMeta();
  const review = { id: 'year_review', who: 'zhifu', text: 't', review: true, left: choice(), right: choice() };
  const troop = { id: 'troop_volunteer', who: 'butou', text: 't', troop: true, left: choice(), right: choice() };
  const daily = { id: 'daily', who: 'a', text: 't', left: choice(), right: choice() };
  const story = { id: 'queued_story', who: 'shiye', text: 't', chainOnly: true, left: choice(), right: choice() };
  const deck = [review, troop, daily, story];
  const due = createRun(meta);
  due.queue = [];
  due.rank = 1;
  due.draws = 30;
  due.day = REVIEW_EVERY + 1;
  due.lastCareerDraw = 31;
  due.lastTroopDraw = 0;
  assert.equal(drawCard(due, deck, meta, seq(0)).id, 'year_review');
  assert.equal(due.nextReview, REVIEW_EVERY * 2);

  const queued = createRun(meta);
  queued.queue = [{ id: 'queued_story', due: 0 }];
  queued.rank = 1;
  queued.draws = 30;
  queued.day = REVIEW_EVERY + 1;
  queued.lastCareerDraw = 31;
  assert.equal(drawCard(queued, deck, meta, seq(0)).id, 'queued_story');
  assert.equal(queued.nextReview, REVIEW_EVERY);
});

test('review cards are drawn once the review day is reached', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  run.day = REVIEW_EVERY + 1;
  assert.equal(drawCard(run, DECK, meta, seq(0)).id, 'review');
  assert.equal(run.nextReview, REVIEW_EVERY * 2);
});

test('recently drawn cards are on cooldown while alternatives exist', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  const a = drawCard(run, DECK, meta, seq(0)).id;
  const b = drawCard(run, DECK, meta, seq(0)).id;
  assert.notEqual(a, b);
});

test('the same theme waits eighteen draws while another card exists', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  const tax = (id) => ({ id, theme: 'tax', who: 'a', text: 't', left: choice(), right: choice() });
  const plain = { id: 'plain_theme', who: 'a', text: 't', left: choice(), right: choice() };
  const deck = [tax('tax_a'), tax('tax_b'), plain];
  const first = drawCard(run, deck, meta, seq(0));
  assert.equal(first.theme, 'tax');
  for (let i = 0; i < 17; i += 1) {
    const card = drawCard(run, deck, meta, seq(0));
    assert.notEqual(card.theme, 'tax');
  }
  const back = drawCard(run, deck, meta, seq(0));
  assert.equal(back.theme, 'tax');
  const kept = normalizeSlots([{ run, cardId: back.id, echo: '' }]);
  assert.equal(kept[0].run.themeSeen.tax, run.themeSeen.tax);
});

test('the prefect birthday gift comes once in a reign', () => {
  const gift = CARDS.find((c) => c.id === 'shiye_gift');
  assert.equal(gift.once, true);
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  const deck = [gift, { id: 'filler', who: 'a', text: 't', left: choice(), right: choice() }];
  const first = drawCard(run, deck, meta, seq(0));
  assert.equal(first.id, 'shiye_gift');
  choose(run, first, 'right', seq(0));
  for (let i = 0; i < 12; i += 1) {
    const card = drawCard(run, deck, meta, seq(0));
    assert.notEqual(card.id, 'shiye_gift');
    choose(run, card, 'left', seq(0));
  }
});

test('once cards never repeat within a run', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  const deck = [
    { id: 'solo', who: 'a', once: true, left: choice(), right: choice() },
    { id: 'filler', who: 'a', left: choice(), right: choice() },
  ];
  const ids = [];
  for (let i = 0; i < 30; i += 1) {
    const c = drawCard(run, deck, meta, seq(0));
    ids.push(c.id);
    choose(run, c, 'left', seq(0));
  }
  assert.equal(ids.filter((id) => id === 'solo').length, 1);
});

test('endings: explicit ending, broken stat, then full term', () => {
  const meta = createMeta();
  let run = createRun(meta);
  assert.equal(choose(run, { id: 'e', left: choice({}, { ending: 'fox_away' }) }, 'left', seq(0)).ending, 'fox_away');

  run = createRun(meta);
  run.stats.people = 5;
  assert.equal(choose(run, DECK[1], 'left', seq(0)).ending, 'people_low');
  assert.equal(run.ending, 'people_low');

  run = createRun(meta);
  run.day = FULL_TERM_DAYS - 1;
  assert.equal(choose(run, DECK[2], 'left', seq(0)).ending, 'full_term');
});

const CAREER_DECK = [
  { id: 'filler', who: 'a', text: 't', left: choice(), right: choice() },
  {
    id: 'inspect', career: 'inspect', chainOnly: true, who: 'qinchai', text: '你是{rank}',
    left: choice({ court: 4 }, { careerResult: 'promote' }),
    right: choice({ money: -22, heart: -14 }, { careerResult: 'promote', risky: true }),
  },
  {
    id: 'heir_ask', career: 'heir', chainOnly: true, who: 'shiye', text: '{rank}{age}岁',
    left: choice({}, { ending: 'retire' }),
    right: choice({}, { chain: { id: 'heir_pick', delay: 0 } }),
  },
];

function steady(run) {
  Object.keys(run.stats).forEach((k) => { run.stats[k] = 60; });
}

test('steady stats bring an inspection, and a calm answer promotes', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  steady(run);
  let card = null;
  for (let i = 0; i < 18; i += 1) {
    card = drawCard(run, CAREER_DECK, meta, seq(0));
  }
  assert.equal(card.id, 'inspect');
  assert.equal(choose(run, card, 'left', seq(0)).ending, null);
  assert.equal(run.rank, 1);
  assert.equal(run.notice, '升为通判');
  assert.ok(run.stats.people > 48 && run.stats.people < 80);
});

test('strong stats bring an inspection sooner, after a story card already due', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  Object.keys(run.stats).forEach((k) => { run.stats[k] = 90; });
  let card = null;
  for (let i = 0; i < 11; i += 1) {
    card = drawCard(run, CAREER_DECK, meta, seq(0));
    assert.notEqual(card.id, 'inspect');
  }
  run.queue.push({ id: 'heir_ask', due: run.draws });
  card = drawCard(run, CAREER_DECK, meta, seq(0));
  assert.equal(card.id, 'heir_ask');
  card = drawCard(run, CAREER_DECK, meta, seq(0));
  assert.equal(card.id, 'inspect');
});

test('one soft stat slows the inspection, it does not cancel it', () => {
  const meta = createMeta();
  const weak = createRun(meta);
  weak.queue = [];
  Object.keys(weak.stats).forEach((k) => { weak.stats[k] = 90; });
  weak.stats.money = 50;
  for (let i = 0; i < 15; i += 1) {
    assert.notEqual(drawCard(weak, CAREER_DECK, meta, seq(0)).id, 'inspect');
  }
  assert.equal(drawCard(weak, CAREER_DECK, meta, seq(0)).id, 'inspect');

  const soft = createRun(meta);
  soft.queue = [];
  Object.keys(soft.stats).forEach((k) => { soft.stats[k] = 70; });
  soft.stats.money = 46;
  for (let i = 0; i < 17; i += 1) {
    assert.notEqual(drawCard(soft, CAREER_DECK, meta, seq(0)).id, 'inspect');
  }
  assert.equal(drawCard(soft, CAREER_DECK, meta, seq(0)).id, 'inspect');
});

test('an upright court turns a bribe away, a muddy court lets it buy the rank', () => {
  const card = CAREER_DECK[1];
  const clean = createRun(createMeta());
  steady(clean);
  clean.virtue = 70;
  assert.equal(choose(clean, card, 'right', seq(0)).ending, null);
  assert.equal(clean.rank, 0);
  assert.equal(clean.bribes, 1);
  assert.match(clean.notice, /没过/);

  const muddy = createRun(createMeta());
  steady(muddy);
  muddy.virtue = 40;
  assert.equal(choose(muddy, card, 'right', seq(0)).ending, null);
  assert.equal(muddy.rank, 1);
  assert.equal(muddy.bribes, 1);
});

test('old age asks about the seal, the throne is not another promotion', () => {
  const meta = createMeta();
  const shangshu = createRun(meta);
  shangshu.queue = [];
  steady(shangshu);
  shangshu.rank = RANKS.length - 2;
  let card = null;
  for (let i = 0; i < 18; i += 1) {
    card = drawCard(shangshu, CAREER_DECK, meta, seq(0));
  }
  assert.equal(card.id, 'inspect');
  assert.equal(careerAge({ rank: 0, day: 1 }), 30);
  assert.equal(careerAge({ rank: 6, day: 1 }), 30);
  assert.equal(formatCardText({ text: '{rank}{age}岁' }, shangshu, meta, {}), `${RANKS[shangshu.rank]}${careerAge(shangshu)}岁`);

  const throne = createRun(meta);
  throne.queue = [];
  steady(throne);
  throne.rank = RANKS.length - 1;
  for (let i = 0; i < 18; i += 1) {
    card = drawCard(throne, CAREER_DECK, meta, seq(0));
  }
  assert.notEqual(card.id, 'heir_ask');
  assert.notEqual(card.id, 'inspect');
});

test('reaching the throne queues the war, not the seal', () => {
  const run = createRun(createMeta());
  steady(run);
  run.rank = 4;
  run.draws = 10;
  choose(run, CAREER_DECK[1], 'left', seq(0));
  assert.equal(run.rank, 5);
  assert.equal(run.queue.some((q) => q.id === 'heir_ask'), false);

  run.rank = 5;
  run.draws = 10;
  choose(run, CAREER_DECK[1], 'left', seq(0));
  assert.equal(run.rank, 6);
  assert.equal(RANKS[run.rank], '皇帝');
  assert.equal(run.queue.some((q) => q.id === 'throne_name' && q.due === 11), true);
  assert.equal(run.queue.some((q) => q.id === 'throne_war' && q.due === 14), true);
});

test('after the throne, the reign name, the clan and the exam come before the war', () => {
  const run = createRun(createMeta());
  run.draws = 10;
  assert.equal(claimThrone(run, 'office'), true);
  const name = CARDS.find((c) => c.id === 'throne_name');
  choose(run, name, 'left', seq(0));
  assert.equal(run.queue.some((q) => q.id === 'throne_clan'), true);
  const clan = CARDS.find((c) => c.id === 'throne_clan');
  choose(run, clan, 'right', seq(0));
  assert.equal(run.queue.some((q) => q.id === 'throne_exam'), true);
  assert.equal(run.ending, null);
});

test('the throne can be taken by rising, and only once', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.rank = 1;
  run.draws = 12;
  assert.equal(claimThrone(run, 'rise'), true);
  assert.equal(RANKS[run.rank], '皇帝');
  assert.equal(run.notice, '起兵称帝');
  assert.equal(run.queue.some((q) => q.id === 'throne_rise'), true);
  assert.equal(run.queue.some((q) => q.id === 'throne_name'), true);
  assert.equal(claimThrone(run, 'revolt'), false);
  assert.equal(run.queue.filter((q) => String(q.id).startsWith('throne')).length, 2);

  const loved = createRun(meta);
  loved.rank = 2;
  loved.stats.people = 80;
  loved.flags = { news_death: true };
  const death = CARDS.find((c) => c.id === 'death_call');
  assert.equal(isEligible(death, loved, meta), true);
  loved.stats.people = 40;
  assert.equal(isEligible(death, loved, meta), false);

  const armed = createRun(meta);
  armed.rank = 1;
  armed.troops = 10;
  const defect = CARDS.find((c) => c.id === 'defect_ask');
  assert.equal(isEligible(defect, armed, meta), false);
  armed.troops = 30;
  assert.equal(isEligible(defect, armed, meta), true);
  armed.flags = { claimed: true };
  assert.equal(isEligible(defect, armed, meta), false);
});

test('a thick gift skips two ranks and stops at 尚书', () => {
  const run = createRun(createMeta());
  run.rank = 0;
  skipRank(run);
  assert.equal(RANKS[run.rank], '知府');
  run.rank = 4;
  skipRank(run);
  assert.equal(RANKS[run.rank], '尚书');
  skipRank(run);
  assert.equal(run.rank, 5);
  assert.equal(run.notice, '礼收下了，位子不动');
});

test('path choices accumulate and arm a mid-game fork at six', () => {
  const meta = createMeta();
  const run = createRun(meta);
  assert.deepEqual(run.paths, emptyPaths());
  const card = {
    id: 'p', who: 'a', text: 't',
    left: choice({}, { path: { graft: 2 } }),
    right: choice(),
  };
  for (let i = 0; i < 3; i += 1) {
    choose(run, card, 'left', seq(0.99));
  }
  assert.equal(run.paths.graft, 6);
  assert.equal(run.flags.path_graft_armed, true);
  assert.ok(run.queue.some((q) => q.id === 'path_graft_ledger'));
});

test('path weight lifts matching cards and softens the opposite', () => {
  const graftCard = { id: 'g', weight: 1, paths: ['graft'] };
  const cleanCard = { id: 'c', weight: 1, paths: ['clean'] };
  const graftRun = { paths: { ...emptyPaths(), graft: 6 } };
  const cleanRun = { paths: { ...emptyPaths(), clean: 6 } };
  assert.ok(cardPathWeight(graftCard, graftRun) > cardPathWeight(cleanCard, graftRun));
  assert.ok(cardPathWeight(graftCard, cleanRun) < cardPathWeight(graftCard, graftRun));
});

test('a familiar person can open their arc before the usual day', () => {
  const fox = CARDS.find((c) => c.id === 'arc_fox_1');
  const plainMeta = createMeta();
  const early = createRun(plainMeta);
  early.day = 12;
  assert.equal(isEligible(fox, early, plainMeta), false);
  const meta = createMeta();
  meta.world.bondHigh = { huxian: 2 };
  const known = createRun(meta);
  known.day = 12;
  assert.equal(isEligible(fox, known, meta), true);
  known.day = 11;
  assert.equal(isEligible(fox, known, meta), false);
  const seen = createMeta();
  seen.world.arcSeen = { huxian: true };
  const again = createRun(seen);
  again.day = 12;
  assert.equal(isEligible(fox, again, seen), true);
  const heavy = cardPathWeight(fox, known, meta);
  const light = cardPathWeight(fox, early, plainMeta);
  assert.ok(heavy > light);
});

test('from 知府 up, village cards weigh less than road cards', () => {
  const village = { id: 'v', weight: 1 };
  const road = { id: 'r', weight: 1, requires: { minRank: 2 } };
  const low = { county: ['poor'], paths: emptyPaths(), rank: 0 };
  const high = { county: ['poor'], paths: emptyPaths(), rank: 2 };
  assert.ok(cardPathWeight(village, high) < cardPathWeight(village, low) * 0.6);
  assert.ok(cardPathWeight(road, high) > cardPathWeight(village, high));
});

test('a county card is drawn ahead of a shared card in that county', () => {
  const salt = { id: 'salt', weight: 1, county: ['salt'] };
  const shared = { id: 'shared', weight: 1 };
  const run = { county: ['salt'], paths: emptyPaths() };
  assert.ok(cardPathWeight(salt, run) >= cardPathWeight(shared, run) * 2);
  assert.ok(cardPathWeight(shared, run) > 0);
});

test('retitle drops back to 县令 once and halves paths', () => {
  const run = createRun(createMeta());
  run.rank = 3;
  run.paths.graft = 6;
  run.paths.scheme = 4;
  const countyBefore = run.county[0];
  assert.equal(retitleCounty(run), true);
  assert.equal(run.rank, 0);
  assert.equal(run.paths.graft, 3);
  assert.equal(run.paths.scheme, 2);
  assert.equal(run.retitled, true);
  assert.notEqual(run.county[0], countyBefore);
  assert.equal(retitleCounty(run), false);
});

test('retitle lets the new county rebuild bridge school and granary', () => {
  const run = createRun(createMeta());
  run.rank = 2;
  run.used.shiye_bridge = true;
  run.used.sheng_school = true;
  run.used.shiye_granary = true;
  run.used.shiye_gift = true;
  run.bonds.shiye = 3;
  run.worldMarks = { bridge: 1, school: 1 };
  run.shifts = { chaos: 2 };
  assert.equal(retitleCounty(run), true);
  assert.equal(run.used.shiye_bridge, undefined);
  assert.equal(run.used.sheng_school, undefined);
  assert.equal(run.used.shiye_granary, undefined);
  assert.equal(run.used.shiye_gift, true);
  assert.equal(run.bonds.shiye, 3);
  assert.equal(run.worldMarks.bridge, 1);
  assert.deepEqual(run.shifts, {});
});

test('world echo cards wait for the previous reign marks', () => {
  const meta = createMeta();
  const run = createRun(meta);
  const echo = CARDS.find((c) => c.id === 'echo_school');
  assert.equal(isEligible(echo, run, meta), false);
  meta.runs = 1;
  meta.world = { ...(meta.world || {}), school: 1 };
  assert.equal(isEligible(echo, run, meta), true);
});

test('bond gates a follow-up and county gates a border card', () => {
  const meta = createMeta();
  const run = createRun(meta);
  const arc = CARDS.find((c) => c.id === 'arc_shiye_1');
  assert.equal(isEligible(arc, run, meta), false);
  run.bonds.shiye = 1;
  assert.equal(isEligible(arc, run, meta), true);
  const flood = CARDS.find((c) => c.id === 'county_flood');
  run.county = ['salt'];
  assert.equal(isEligible(flood, run, meta), false);
  run.county = ['poor'];
  assert.equal(isEligible(flood, run, meta), true);
  const border = CARDS.find((c) => c.id === 'border_ask');
  run.day = 40;
  run.paths.scheme = 0;
  assert.equal(isEligible(border, run, meta), false);
  run.day = 80;
  run.paths.scheme = 2;
  assert.equal(isEligible(border, run, meta), true);
});

test('old age asks about the seal without blocking a promotion', () => {
  const meta = createMeta();
  const aged = createRun(meta);
  aged.queue = [];
  steady(aged);
  aged.rank = 2;
  aged.day = 36 * 16 + 1;
  aged.draws = 40;
  aged.lastCareerDraw = 40;
  assert.equal(careerAge(aged), 46);
  assert.equal(drawCard(aged, CAREER_DECK, meta, seq(0)).id, 'heir_ask');
  assert.equal(aged.lastCareerDraw, 40);

  const due = createRun(meta);
  due.queue = [];
  steady(due);
  due.rank = 2;
  due.day = 36 * 16 + 1;
  due.draws = 17;
  assert.equal(drawCard(due, CAREER_DECK, meta, seq(0)).id, 'inspect');
});

test('a young 按察使 is still offered promotion', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  steady(run);
  run.rank = 3;
  run.day = 200;
  run.draws = 31;
  run.lastCareerDraw = 19;
  assert.equal(drawCard(run, CAREER_DECK, meta, seq(0)).id, 'inspect');
  assert.equal(careerAge(run), 35);
});

test('troops over the line bring the court back after a gap', () => {
  const meta = createMeta();
  const filler = { id: 'filler', who: 'a', text: 't', left: choice(), right: choice() };
  const first = {
    id: 'crackdown', career: 'crackdown', chainOnly: true, who: 'zhifu', text: 't',
    left: choice({ court: 2 }, { troops: -8, flags: { crackdown_done: true } }),
    right: choice(),
  };
  const again = {
    id: 'crackdown_again', career: 'crackdown', chainOnly: true, who: 'zhifu', text: 't',
    left: choice({ court: 3 }, { troops: -18 }),
    right: choice(),
  };
  const deck = [filler, first, again];
  const run = createRun(meta);
  run.queue = [];
  run.rank = 1;
  run.draws = 29;
  run.troops = 70;
  run.lastCareerDraw = 29;
  assert.equal(drawCard(run, deck, meta, seq(0)).id, 'crackdown');

  const held = createRun(meta);
  held.queue = [];
  held.rank = 1;
  held.draws = 40;
  held.troops = 80;
  held.lastCareerDraw = 40;
  held.lastCrackdownDraw = 30;
  held.flags.crackdown_done = true;
  assert.equal(drawCard(held, deck, meta, seq(0)).id, 'filler');

  held.draws = 52;
  held.lastCareerDraw = 52;
  assert.equal(drawCard(held, deck, meta, seq(0)).id, 'crackdown_again');
});

test('an edict waits for rank, and a night visit waits for a weak court', () => {
  const meta = createMeta();
  const filler = { id: 'filler', who: 'a', text: 't', left: choice(), right: choice() };
  const edict = {
    id: 'edict_tribute', edict: true, requires: { minRank: 1 }, who: 'zhifu', text: 't',
    left: choice({ money: -8 }, { courtShift: { guoshi: 8 } }),
    right: choice(),
  };
  const revolt = {
    id: 'revolt_ask', career: 'revolt', chainOnly: true, who: 'wangpo', text: 't',
    left: choice({}, { flags: { revolt_asked: true } }),
    right: choice({}, { ending: 'new_dynasty' }),
  };
  const deck = [filler, edict, revolt];
  const run = createRun(meta);
  run.queue = [];
  const early = new Set();
  for (let i = 0; i < 12; i += 1) {
    early.add(drawCard(run, deck, meta, seq(0)).id);
  }
  assert.deepEqual([...early], ['filler']);

  const ranked = createRun(meta);
  ranked.queue = [];
  ranked.rank = 1;
  ranked.lastEdictDraw = -20;
  assert.equal(drawCard(ranked, deck, meta, seq(0)).id, 'edict_tribute');
  assert.equal(choose(ranked, edict, 'left', seq(0)).ending, null);
  assert.equal(ranked.guoshi, 63);

  const ripe = createRun(meta);
  ripe.queue = [];
  ripe.draws = 39;
  ripe.rank = 2;
  ripe.lastCareerDraw = 30;
  ripe.stats.people = 80;
  ripe.stats.money = 78;
  ripe.guoshi = 28;
  assert.equal(drawCard(ripe, deck, meta, seq(0)).id, 'revolt_ask');
  assert.equal(formatCardText({ text: '{dynasty}朝' }, ripe, meta, {}), '承平朝');
});

test('a full heart does not end the reign, an empty granary does', () => {
  const meta = createMeta();
  const loved = createRun(meta);
  loved.stats.people = 95;
  const held = choose(loved, DECK[1], 'right', seq(0));
  assert.equal(held.ending, null);
  assert.equal(loved.stats.people, 100);

  const broke = createRun(meta);
  broke.stats.money = 5;
  assert.equal(choose(broke, { id: 'e', left: choice({ money: -10 }), right: choice() }, 'left', seq(0)).ending, 'money_low');
});

test('a strong people bring grain into the granary when the year turns', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.day = 140;
  run.stats.people = 80;
  run.stats.money = 40;
  const res = choose(run, DECK[2], 'left', seq(0));
  assert.ok(yearOf(run.day) > 1);
  assert.ok(run.stats.money > 40);
  assert.ok(res.delta.money > 0);
  assert.match(run.notice || '', /粮|税/);
});

test('the fourth year warns that the term is nearly full', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.day = 428;
  run.stats.money = 60;
  choose(run, DECK[2], 'left', seq(0));
  assert.equal(yearOf(run.day), 4);
  assert.match(run.notice || '', /任满/);
  assert.match(run.notice || '', /税|粮/);
  assert.ok((run.notice || '').length <= 16);
});

test('an emperor is not told the term is ending a year early', () => {
  const meta = createMeta();
  const early = createRun(meta);
  early.rank = RANKS.length - 1;
  early.day = 428;
  early.stats.money = 60;
  choose(early, DECK[2], 'left', seq(0));
  assert.equal(yearOf(early.day), 4);
  assert.equal((early.notice || '').includes('任满'), false);

  const late = createRun(meta);
  late.rank = RANKS.length - 1;
  late.day = 572;
  late.stats.money = 60;
  choose(late, DECK[2], 'left', seq(0));
  assert.equal(yearOf(late.day), 5);
  assert.match(late.notice || '', /任满/);
});

test('a thin granary takes in more tax than a comfortable one', () => {
  const meta = createMeta();
  const thin = createRun(meta);
  thin.day = 140;
  thin.stats.people = 50;
  thin.stats.money = 20;
  choose(thin, DECK[2], 'left', seq(0));
  const full = createRun(meta);
  full.day = 140;
  full.stats.people = 50;
  full.stats.money = 60;
  choose(full, DECK[2], 'left', seq(0));
  assert.ok(thin.stats.money - 20 > full.stats.money - 60);
});

test('choose records the met character', () => {
  const meta = createMeta();
  const run = createRun(meta);
  choose(run, DECK[1], 'right', seq(0));
  assert.equal(run.met.a, true);
});

test('a strong notice holds the next quiet line until it leaves', () => {
  const held = foldNotice({
    showing: '升为知府', until: 3.2, now: 1, incoming: '秋税进了仓',
  });
  assert.equal(held.notice, '升为知府');
  assert.equal(held.until, 3.2);
  assert.deepEqual(held.pending, ['秋税进了仓']);
  assert.equal(held.chime, false);

  const waiting = foldNotice({
    showing: held.notice, until: held.until, pending: held.pending, now: 2, incoming: '',
  });
  assert.equal(waiting.notice, '升为知府');
  assert.deepEqual(waiting.pending, ['秋税进了仓']);
  assert.equal(waiting.chime, false);

  const shown = foldNotice({
    showing: waiting.notice, until: waiting.until, pending: waiting.pending, now: 3.2, incoming: '',
  });
  assert.equal(shown.notice, '秋税进了仓');
  assert.deepEqual(shown.pending, []);
  assert.equal(shown.chime, true);
  assert.equal(shown.high, false);
  assert.equal(shown.until, 3.2 + NOTICE_HOLD.weak);

  const replaced = foldNotice({
    showing: '升为知府', until: 3.2, pending: '秋税进了仓', now: 1, incoming: '跳为按察使',
  });
  assert.equal(replaced.notice, '跳为按察使');
  assert.deepEqual(replaced.pending, ['秋税进了仓']);
  assert.equal(replaced.chime, true);
  assert.equal(replaced.high, true);
});

test('two quiet lines both wait out a strong notice', () => {
  const first = foldNotice({
    showing: '升为知府', until: 3.2, now: 1, incoming: '秋税进了仓',
  });
  const second = foldNotice({
    showing: first.notice, until: first.until, pending: first.pending, now: 1.7, incoming: '邻县举了旗',
  });
  assert.deepEqual(second.pending, ['秋税进了仓', '邻县举了旗']);
  assert.equal(second.chime, false);

  const tax = foldNotice({
    showing: second.notice, until: second.until, pending: second.pending, now: 3.2, incoming: '',
  });
  assert.equal(tax.notice, '秋税进了仓');
  assert.deepEqual(tax.pending, ['邻县举了旗']);

  const news = foldNotice({
    showing: tax.notice, until: tax.until, pending: tax.pending, now: tax.until, incoming: '',
  });
  assert.equal(news.notice, '邻县举了旗');
  assert.deepEqual(news.pending, []);

  let state = { notice: '升为知府', until: 10, pending: [] };
  for (let i = 0; i < NOTICE_QUEUE + 1; i += 1) {
    state = foldNotice({
      showing: state.notice, until: state.until, pending: state.pending, now: 1, incoming: `句${i}`,
    });
  }
  assert.equal(state.pending.length, NOTICE_QUEUE);
  assert.equal(state.pending[0], '句0');
  assert.equal(state.pending[NOTICE_QUEUE - 1], `句${NOTICE_QUEUE - 1}`);
});

test('realm news changes the court and does not replace a notice', () => {
  const meta = createMeta();
  const early = createRun(meta);
  early.draws = 3;
  choose(early, DECK[2], 'left', seq(0));
  assert.equal(early.news.length, 0);

  const run = createRun(meta);
  run.draws = 10;
  choose(run, DECK[2], 'left', seq(0));
  assert.equal(run.news.length, 1);
  assert.equal(run.notice, run.news[0].text);
  assert.ok(run.guoshi < 55);

  run.notice = '升为通判';
  run.draws = 20;
  choose(run, DECK[2], 'left', seq(0));
  assert.equal(run.notice, '升为通判');
  assert.equal(run.news.length, 2);
  assert.equal(run.flags.news_half, true);
  const follow = CARDS.find((c) => c.id === 'half_grain');
  assert.equal(isEligible(follow, run, meta), true);
});

test('two bandit bulletins make the county restless, two exam bulletins make it a school county', () => {
  const bandit = createRun(createMeta());
  bandit.draws = 20;
  bandit.county = ['poor'];
  bandit.heard = BULLETINS.map((b) => b.id).filter((id) => id !== 'bandit_prefecture' && id !== 'bandit_notice');
  assert.equal(hearBulletin(bandit, () => 0).id, 'bandit_prefecture');
  assert.deepEqual(bandit.county, ['poor']);
  bandit.draws += 5;
  assert.equal(hearBulletin(bandit, () => 0).id, 'bandit_notice');
  assert.deepEqual(bandit.county, ['poor', 'chaos']);
  assert.equal(bandit.notice, '匪事压到本县来了');
  const kept = normalizeSlots([{ run: bandit }])[0].run;
  assert.equal(kept.shifts.chaos, 2);
  assert.deepEqual(kept.county, ['poor', 'chaos']);

  const quiet = createRun(createMeta());
  quiet.draws = 20;
  quiet.county = ['poor'];
  quiet.heard = BULLETINS.map((b) => b.id).filter((id) => id !== 'bandit_notice' && id !== 'bandit_quiet');
  hearBulletin(quiet, () => 0);
  quiet.draws += 5;
  hearBulletin(quiet, () => 0);
  assert.deepEqual(quiet.county, ['poor']);

  const school = createRun(createMeta());
  school.draws = 20;
  school.county = ['poor'];
  school.heard = BULLETINS.map((b) => b.id).filter((id) => id !== 'exam_on' && id !== 'exam_list');
  hearBulletin(school, () => 0);
  assert.deepEqual(school.county, ['poor']);
  school.draws += 5;
  hearBulletin(school, () => 0);
  assert.deepEqual(school.county, ['poor', 'school']);

  const full = createRun(createMeta());
  full.draws = 20;
  full.county = ['salt', 'flood'];
  full.heard = BULLETINS.map((b) => b.id).filter((id) => id !== 'bandit_prefecture' && id !== 'bandit_notice');
  hearBulletin(full, () => 0);
  full.draws += 5;
  hearBulletin(full, () => 0);
  assert.deepEqual(full.county, ['salt', 'flood']);

  const held = createRun(createMeta());
  held.draws = 20;
  held.county = ['poor'];
  held.notice = '升为通判';
  held.heard = BULLETINS.map((b) => b.id).filter((id) => id !== 'bandit_prefecture' && id !== 'bandit_notice');
  hearBulletin(held, () => 0);
  held.draws += 5;
  hearBulletin(held, () => 0);
  assert.equal(held.notice, '升为通判');
  assert.deepEqual(held.county, ['poor', 'chaos']);
});

test('a salt county hears salt news ahead of a plain bulletin', () => {
  const leave = ['salt_price', 'opera_back'];
  const heard = BULLETINS.map((b) => b.id).filter((id) => !leave.includes(id));
  const salt = createRun(createMeta());
  salt.draws = 30;
  salt.county = ['salt'];
  salt.heard = heard.slice();
  assert.equal(hearBulletin(salt, () => 0.5).id, 'salt_price');
  const poor = createRun(createMeta());
  poor.draws = 30;
  poor.county = ['poor'];
  poor.heard = heard.slice();
  assert.equal(hearBulletin(poor, () => 0.5).id, 'opera_back');
});

test('a school is only built once, and each bulletin is heard once', () => {
  assert.equal(CARDS.find((c) => c.id === 'sheng_school').once, true);
  assert.equal(CARDS.find((c) => c.id === 'qian_school').once, true);
  const run = createRun(createMeta());
  run.draws = 10;
  const seen = new Set();
  for (let i = 0; i < 20; i += 1) {
    const item = hearBulletin(run, () => 0);
    if (item) {
      assert.equal(seen.has(item.id), false);
      seen.add(item.id);
    }
    run.draws += 8;
  }
  assert.ok(seen.size >= 12);
});
