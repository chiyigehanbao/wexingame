import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAT_KEYS, createStats, applyFx, findBrokenStat, fxMagnitude,
} from '../js/game/stats.js';

test('createStats starts every stat at 50', () => {
  const s = createStats();
  assert.deepEqual(Object.keys(s).sort(), [...STAT_KEYS].sort());
  STAT_KEYS.forEach((k) => assert.equal(s[k], 50));
});

test('applyFx adds deltas, clamps to 0..100 and does not mutate input', () => {
  const s = createStats();
  const next = applyFx(s, { people: 70, money: -80, court: 5 });
  assert.equal(next.people, 100);
  assert.equal(next.money, 0);
  assert.equal(next.court, 55);
  assert.equal(next.heart, 50);
  assert.equal(s.people, 50);
});

test('applyFx ignores unknown keys and missing fx', () => {
  const s = createStats();
  assert.deepEqual(applyFx(s, { luck: 10 }), s);
  assert.deepEqual(applyFx(s, undefined), s);
});

test('findBrokenStat reports the first stat at a boundary', () => {
  assert.equal(findBrokenStat(createStats()), null);
  assert.deepEqual(findBrokenStat({ people: 50, money: 0, court: 50, heart: 50 }), { key: 'money', side: 'low' });
  assert.deepEqual(findBrokenStat({ people: 50, money: 50, court: 50, heart: 100 }), null);
});

test('fxMagnitude buckets absolute deltas into 0..3', () => {
  assert.equal(fxMagnitude(0), 0);
  assert.equal(fxMagnitude(undefined), 0);
  assert.equal(fxMagnitude(-5), 1);
  assert.equal(fxMagnitude(12), 2);
  assert.equal(fxMagnitude(-25), 3);
});
