import test from 'node:test';
import assert from 'node:assert/strict';
import { createMeta, recordRun, countEndings, normalizeMeta } from '../js/game/meta.js';

const finishedRun = (ending, day, met = {}) => ({ ending, day, met });

test('recordRun counts runs, endings, best day and met characters', () => {
  let meta = createMeta();
  let res = recordRun(meta, finishedRun('money_low', 20, { shiye: true }));
  assert.equal(res.isNewEnding, true);
  assert.equal(res.isBest, true);
  meta = res.meta;
  assert.equal(meta.runs, 1);
  assert.equal(meta.best, 20);
  assert.equal(meta.lastEnding, 'money_low');
  assert.equal(meta.met.shiye, true);

  res = recordRun(meta, finishedRun('money_low', 10, { butou: true }));
  assert.equal(res.isNewEnding, false);
  assert.equal(res.isBest, false);
  assert.equal(res.meta.endings.money_low, 2);
  assert.equal(res.meta.best, 20);
  assert.equal(res.meta.met.shiye && res.meta.met.butou, true);
  assert.equal(countEndings(res.meta), 1);
});

test('recordRun does not mutate the input meta', () => {
  const meta = createMeta();
  recordRun(meta, finishedRun('fox_away', 3));
  assert.deepEqual(meta, createMeta());
});

test('normalizeMeta repairs missing or corrupted saves', () => {
  assert.deepEqual(normalizeMeta(null), createMeta());
  assert.deepEqual(normalizeMeta('garbage'), createMeta());
  const m = normalizeMeta({ runs: 3, endings: { a: 1 } });
  assert.equal(m.runs, 3);
  assert.equal(m.best, 0);
  assert.deepEqual(m.met, {});
});
