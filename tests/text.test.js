import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapText } from '../js/ui/text.js';

const fakeCtx = () => ({ font: '', measureText: (s) => ({ width: s.length * 10 }) });

test('wraps by width', () => {
  assert.deepEqual(wrapText(fakeCtx(), '一二三四五六七', 30, 'f'), ['一二三', '四五六', '七']);
});

test('honours explicit newlines and keeps blank lines', () => {
  assert.deepEqual(wrapText(fakeCtx(), '一二\n\n三', 100, 'f'), ['一二', '', '三']);
});

test('closing punctuation never starts a line', () => {
  assert.deepEqual(wrapText(fakeCtx(), '一二三，四五', 30, 'f'), ['一二三，', '四五']);
  assert.deepEqual(wrapText(fakeCtx(), '一二三」。四', 30, 'f'), ['一二三」。', '四']);
});

test('opening punctuation never ends a line', () => {
  assert.deepEqual(wrapText(fakeCtx(), '一二「三四', 30, 'f'), ['一二', '「三四']);
});

test('caches results per font, width and text', () => {
  const ctx = fakeCtx();
  const a = wrapText(ctx, '一二三四', 20, 'f');
  assert.equal(wrapText(ctx, '一二三四', 20, 'f'), a);
  assert.notEqual(wrapText(ctx, '一二三四', 30, 'f'), a);
});
