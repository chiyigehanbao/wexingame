import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun, drawCard, choose, isEligible, formatCardText, seasonOf,
} from '../js/game/run.js';
import { createMeta } from '../js/game/meta.js';

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

test('seasonOf walks spring, summer, autumn, winter every forty days', () => {
  assert.equal(seasonOf(1), 'spring');
  assert.equal(seasonOf(40), 'spring');
  assert.equal(seasonOf(41), 'summer');
  assert.equal(seasonOf(81), 'autumn');
  assert.equal(seasonOf(121), 'winter');
  assert.equal(seasonOf(161), 'spring');
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
});

test('choose applies fx, flags, advances days and returns deltas', () => {
  const meta = createMeta();
  const run = createRun(meta);
  const card = { id: 'k', left: choice({ people: -10, money: 5 }, { flags: { ok: true } }), right: choice() };
  const res = choose(run, card, 'left', seq(0.99));
  assert.equal(run.stats.people, 40);
  assert.equal(run.stats.money, 55);
  assert.equal(run.flags.ok, true);
  assert.equal(run.day, 4);
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

test('review cards are drawn once the review day is reached', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  run.day = 31;
  assert.equal(drawCard(run, DECK, meta, seq(0)).id, 'review');
  assert.equal(run.nextReview, 60);
});

test('recently drawn cards are on cooldown while alternatives exist', () => {
  const meta = createMeta();
  const run = createRun(meta);
  run.queue = [];
  const a = drawCard(run, DECK, meta, seq(0)).id;
  const b = drawCard(run, DECK, meta, seq(0)).id;
  assert.notEqual(a, b);
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
  run.day = 364;
  assert.equal(choose(run, DECK[2], 'left', seq(0)).ending, 'full_term');
});

test('choose records the met character', () => {
  const meta = createMeta();
  const run = createRun(meta);
  choose(run, DECK[1], 'right', seq(0));
  assert.equal(run.met.a, true);
});
