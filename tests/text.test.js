import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapText, bandFontSize } from '../js/ui/text.js';
import { titleRecordLines } from '../js/game/ranks.js';
import { ENDINGS } from '../js/data/endings.js';

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

test('ending titles fit an archive cell in two lines', () => {
  const maxW = (375 - 40) / 3 - 8;
  const ctx = { font: '', measureText: (s) => ({ width: [...String(s)].length * 12 }) };
  Object.values(ENDINGS).forEach((e) => {
    const lines = wrapText(ctx, e.title, maxW, '12px bold');
    assert.ok(lines.length <= 2 && lines.length >= 1, e.title);
    lines.forEach((ln) => {
      assert.ok([...ln].length * 12 <= maxW, `${e.title} → ${ln}`);
    });
  });
});

test('ending titles fit an archive detail card in two lines', () => {
  const maxW = Math.min(320 - 60, 320) - 34;
  const ctx = { font: '', measureText: (s) => ({ width: [...String(s)].length * 20 }) };
  Object.values(ENDINGS).forEach((e) => {
    const lines = wrapText(ctx, e.title, maxW, '20px bold');
    assert.ok(lines.length <= 2 && lines.length >= 1, e.title);
    lines.forEach((ln) => {
      assert.ok([...ln].length * 20 <= maxW, `${e.title} → ${ln}`);
    });
  });
});

test('ending titles fit the closing page in two lines', () => {
  const maxW = 320 - 32;
  const ctx = { font: '', measureText: (s) => ({ width: [...String(s)].length * 26 }) };
  Object.values(ENDINGS).forEach((e) => {
    const lines = wrapText(ctx, e.title, maxW, '26px bold');
    assert.ok(lines.length <= 2 && lines.length >= 1, e.title);
    lines.forEach((ln) => {
      assert.ok([...ln].length * 26 <= maxW, `${e.title} → ${ln}`);
    });
  });
});

test('a long title record fits a narrow phone', () => {
  const short = titleRecordLines({ runs: 1, best: 8, width: 320 });
  assert.deepEqual(short, ['已历 1 任 · 最长在任 8 天']);
  const ranked = titleRecordLines({ runs: 12, best: 576, rank: '按察使', width: 320 });
  assert.deepEqual(ranked, ['已历 12 任 · 最长 576 天', '官至按察使']);
  ranked.forEach((ln) => {
    assert.ok([...ln].length * 14 <= 320 - 32, ln);
  });
  const onDesign = titleRecordLines({ runs: 12, best: 576, rank: '按察使', width: 375 });
  assert.equal(onDesign.length, 2);
  onDesign.forEach((ln) => {
    assert.ok([...ln].length * 14 <= 375 - 32, ln);
  });
});

test('seven-character choices fit the drag band on a short card', () => {
  const short = 155;
  const seven = '把邻县的也算上';
  assert.equal([...seven].length, 7);
  assert.equal(bandFontSize(seven, short), 16);
  assert.ok(7 * bandFontSize(seven, short) <= short - 38);
  assert.equal(bandFontSize('先刻个萝卜章', short), 19);
  assert.equal(bandFontSize(seven, 292), 19);
});

test('caches results per font, width and text', () => {
  const ctx = fakeCtx();
  const a = wrapText(ctx, '一二三四', 20, 'f');
  assert.equal(wrapText(ctx, '一二三四', 20, 'f'), a);
  assert.notEqual(wrapText(ctx, '一二三四', 30, 'f'), a);
});
