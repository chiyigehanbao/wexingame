import test from 'node:test';
import assert from 'node:assert/strict';
import { createSlots, writeSlot, normalizeSlots, slotSummary, slotFaceLines } from '../js/game/slots.js';
import { createRun } from '../js/game/run.js';
import { createMeta } from '../js/game/meta.js';

test('a fresh shelf has three empty seats', () => {
  const slots = createSlots();
  assert.equal(slots.length, 3);
  assert.deepEqual(slots, [null, null, null]);
});

test('writing a seat keeps the other seats and does not mutate the shelf', () => {
  const slots = createSlots();
  const run = createRun(createMeta());
  run.day = 12;
  run.rank = 2;
  const next = writeSlot(slots, 1, { run, cardId: 'plain', echo: '账薄了' });
  assert.equal(slots[1], null);
  assert.equal(next[0], null);
  assert.equal(next[1].cardId, 'plain');
  assert.equal(next[1].echo, '账薄了');
  assert.equal(next[1].run.day, 12);
  next[1].run.day = 99;
  assert.equal(run.day, 12);
  const cleared = writeSlot(next, 1, null);
  assert.equal(cleared[1], null);
  assert.equal(next[1].cardId, 'plain');
});

test('waiting notices stay with the reign', () => {
  const run = createRun(createMeta());
  run.noticeQueue = ['秋税进了仓', '', 1, '邻县举了旗', '三', '四', '五'];
  const saved = writeSlot(createSlots(), 0, { run, cardId: 'shiye_tax', echo: '' });
  assert.deepEqual(saved[0].run.noticeQueue, ['秋税进了仓', '', 1, '邻县举了旗', '三', '四', '五']);
  const loaded = normalizeSlots(saved);
  assert.deepEqual(loaded[0].run.noticeQueue, ['秋税进了仓', '邻县举了旗', '三', '四']);
});

test('the line on screen stays with the reign', () => {
  const run = createRun(createMeta());
  run.noticeLine = '升为知府';
  run.noticeLeft = 1.4;
  const saved = writeSlot(createSlots(), 0, { run, cardId: 'a', echo: '' });
  assert.equal(saved[0].run.noticeLine, '升为知府');
  assert.equal(saved[0].run.noticeLeft, 1.4);
  const loaded = normalizeSlots(saved);
  assert.equal(loaded[0].run.noticeLine, '升为知府');
  assert.equal(loaded[0].run.noticeLeft, 1.4);

  run.noticeLeft = 0;
  const gone = normalizeSlots(writeSlot(createSlots(), 0, { run, cardId: 'a', echo: '' }));
  assert.equal(gone[0].run.noticeLine, '');
  assert.equal(gone[0].run.noticeLeft, 0);
});

test('slotSummary names the rank, day and dynasty', () => {
  const run = createRun(createMeta());
  run.day = 41;
  run.rank = 1;
  const summary = slotSummary({ run, cardId: 'a', echo: '' });
  assert.equal(summary.rank, '通判');
  assert.equal(summary.day, 41);
  assert.equal(summary.dynasty, '承平');
  assert.ok(summary.county);
  assert.equal(slotSummary(null), null);
});

test('a long seat name fits the row in two lines', () => {
  const lines = slotFaceLines({
    dynasty: '启明', county: '边县', rank: '按察使', day: 720, age: 49,
  });
  assert.deepEqual(lines, ['启明 · 边县', '按察使 · 第720天']);
  const budget = 320 - 48 - 84 - 16;
  lines.forEach((ln) => {
    assert.ok([...ln].length * 14 <= budget, ln);
  });
});

test('normalizeSlots drops garbage and keeps a readable reign', () => {
  assert.deepEqual(normalizeSlots(null), createSlots());
  const run = createRun(createMeta());
  run.guoshi = 20;
  run.lastCrackdownDraw = 15;
  run.lastBulletinDraw = 12;
  run.news = [{ id: 'half', text: '北境丢了半壁' }];
  const slots = normalizeSlots([
    { cardId: 'intro', echo: '', run },
    { run: { nope: true } },
    'nope',
  ]);
  assert.equal(slots[0].run.day, 1);
  assert.equal(slots[0].run.guoshi, 20);
  assert.equal(slots[0].run.lastCrackdownDraw, 15);
  assert.equal(slots[0].run.lastBulletinDraw, 12);
  assert.equal(slots[0].run.news[0].text, '北境丢了半壁');
  assert.equal(slots[1], null);
  assert.equal(slots[2], null);
});
