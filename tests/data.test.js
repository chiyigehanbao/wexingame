import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from '../js/data/cards.js';
import { echoOf } from '../js/data/echoes.js';
import { CHARACTERS } from '../js/data/characters.js';
import { ENDINGS, ENDING_ORDER } from '../js/data/endings.js';
import { STAT_KEYS } from '../js/game/stats.js';
import { createRun, drawCard, choose } from '../js/game/run.js';
import { createMeta, recordRun } from '../js/game/meta.js';

const byId = Object.fromEntries(CARDS.map((c) => [c.id, c]));
const options = (c) => [c.left, c.right];

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('card ids are unique and an intro card exists', () => {
  assert.equal(new Set(CARDS.map((c) => c.id)).size, CARDS.length);
  assert.ok(byId.intro?.chainOnly);
  assert.ok(CARDS.length >= 70, `only ${CARDS.length} cards`);
});

test('every card is well formed', () => {
  CARDS.forEach((c) => {
    assert.ok(CHARACTERS[c.who], `${c.id}: unknown who ${c.who}`);
    assert.ok(c.text && c.text.length <= 90, `${c.id}: text missing or too long`);
    options(c).forEach((o) => {
      assert.ok(o && o.label && o.label.length <= 9, `${c.id}: bad label ${o?.label}`);
      Object.keys(o.fx || {}).forEach((k) => assert.ok(STAT_KEYS.includes(k), `${c.id}: bad fx ${k}`));
      if (o.chain) {
        assert.ok(byId[o.chain.id]?.chainOnly, `${c.id}: chain to non-chain card ${o.chain.id}`);
      }
      if (o.ending) {
        assert.ok(ENDINGS[o.ending], `${c.id}: unknown ending ${o.ending}`);
      }
    });
  });
});

test('every choice has a short aftermath line', () => {
  CARDS.forEach((c) => {
    ['left', 'right'].forEach((side) => {
      const line = echoOf(c.id, side);
      assert.ok(line, `${c.id}:${side} has no echo`);
      assert.ok([...line].length <= 18, `${c.id}:${side} echo too long: ${line}`);
    });
  });
});

test('every chainOnly card is reachable from some choice', () => {
  const targets = new Set(CARDS.flatMap((c) => options(c).map((o) => o.chain?.id).filter(Boolean)));
  CARDS.filter((c) => c.chainOnly && c.id !== 'intro' && !c.career)
    .forEach((c) => assert.ok(targets.has(c.id), `${c.id} is never chained`));
});

test('every ending has text and is reachable', () => {
  assert.deepEqual([...ENDING_ORDER].sort(), Object.keys(ENDINGS).sort());
  const explicit = new Set(CARDS.flatMap((c) => options(c).map((o) => o.ending).filter(Boolean)));
  ENDING_ORDER.forEach((id) => {
    const e = ENDINGS[id];
    assert.ok(e.title && e.text && e.handoff && e.seal, `${id} incomplete`);
    const statEnding = /^(people|money|court|heart)_(low|high)$/.test(id);
    assert.ok(statEnding || id === 'full_term' || id === 'dismissed' || explicit.has(id), `${id} unreachable`);
  });
});

test('1000 random reigns always end and produce varied endings', () => {
  const rng = mulberry32(42);
  let meta = createMeta();
  const seen = {};
  let totalDays = 0;
  for (let i = 0; i < 1000; i += 1) {
    const run = createRun(meta);
    let guard = 0;
    while (!run.ending) {
      const card = drawCard(run, CARDS, meta, rng);
      choose(run, card, rng() < 0.5 ? 'left' : 'right', rng);
      guard += 1;
      assert.ok(guard < 1000, 'reign never ended');
    }
    seen[run.ending] = (seen[run.ending] || 0) + 1;
    totalDays += run.day;
    meta = recordRun(meta, run).meta;
  }
  const avgDays = totalDays / 1000;
  assert.ok(Object.keys(seen).length >= 9, `only saw ${Object.keys(seen).join(',')}`);
  assert.ok(avgDays > 25 && avgDays < 200, `average reign ${avgDays} days`);
});
