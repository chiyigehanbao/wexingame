import test from 'node:test';
import assert from 'node:assert/strict';

test('leaving while the dossier loads drops the queued enter', async () => {
  globalThis.GameGlobal = globalThis;
  globalThis.wx = {
    createCanvas: () => ({ getContext: () => ({}) }),
    getWindowInfo: () => ({ windowWidth: 375, windowHeight: 812, pixelRatio: 2, statusBarHeight: 20 }),
  };
  const { bootLeave } = await import('../js/scenes/play-boot.js');
  const waiting = { slot: 1 };
  assert.deepEqual(bootLeave(null, '', false, waiting), { go: null, queued: waiting });
  assert.deepEqual(bootLeave(null, '升堂卷宗没展开', false, waiting), { go: 'title', queued: null });
  assert.deepEqual(bootLeave(null, '', true, waiting), { go: 'title', queued: null });
  assert.deepEqual(bootLeave({}, '', true, waiting), { go: null, queued: waiting });
});

test('the court pyramid scrolls on a short phone', async () => {
  globalThis.GameGlobal = globalThis;
  globalThis.wx = {
    createCanvas: () => ({ getContext: () => ({}) }),
    getWindowInfo: () => ({ windowWidth: 375, windowHeight: 667, pixelRatio: 2, statusBarHeight: 20 }),
  };
  const { courtScrollMax, pyramidHeight } = await import('../js/ui/pyramid.js');
  assert.equal(pyramidHeight(), 7 * 30 + 6 * 6 + 10);
  const bottom = 64 + 318 + 28 + 3 * 20 + 28 + pyramidHeight();
  const short = courtScrollMax({ safeTop: 64, height: 667, newsCount: 3 });
  assert.equal(short, bottom + 16 - 667);
  assert.ok(short > 12);
  assert.equal(courtScrollMax({ safeTop: 88, height: 812, newsCount: 3 }), 0);
});
