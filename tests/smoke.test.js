/**
 * 无头冒烟测试：模拟 wx / canvas / 触摸，从标题页一路玩到结局、档案、退堂。
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const W = 375;
const H = 812;
const store = {};
const handlers = {};
const shared = [];
let drawn = [];
let now = 1_000_000;
let rafCb = null;

const fontPx = (f) => Number((/(\d+)px/.exec(f) || [])[1] || 16);

function mockCtx() {
  const state = { font: '16px serif', globalAlpha: 1 };
  return new Proxy(state, {
    get(target, key) {
      if (key in target) {
        return target[key];
      }
      if (key === 'measureText') {
        return (s) => ({ width: [...String(s)].length * fontPx(target.font) });
      }
      if (key === 'createLinearGradient' || key === 'createRadialGradient') {
        return () => ({ addColorStop() {} });
      }
      if (key === 'fillText') {
        return (s, x, y) => drawn.push({ s: String(s), x, y });
      }
      return () => {};
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  });
}

function mockCanvas() {
  const ctx = mockCtx();
  return { width: 1, height: 1, getContext: () => ctx };
}

function mockAudio() {
  const node = () => ({ connect() {}, gain: { value: 1 } });
  return {
    sampleRate: 4000,
    state: 'running',
    destination: {},
    createBuffer: (_c, len) => ({ getChannelData: () => new Float32Array(len) }),
    createGain: node,
    createBufferSource: () => ({ ...node(), start() {}, playbackRate: { value: 1 } }),
  };
}

globalThis.GameGlobal = globalThis;
globalThis.requestAnimationFrame = (cb) => { rafCb = cb; };
Date.now = () => now;
globalThis.wx = {
  createCanvas: mockCanvas,
  getWindowInfo: () => ({
    windowWidth: W, windowHeight: H, pixelRatio: 3, statusBarHeight: 44, safeArea: { top: 44, bottom: 778 },
  }),
  getMenuButtonBoundingClientRect: () => ({ top: 50, bottom: 82 }),
  getStorageSync: (k) => (k in store ? JSON.parse(store[k]) : ''),
  setStorageSync: (k, v) => { store[k] = JSON.stringify(v); },
  onTouchStart: (f) => { handlers.start = f; },
  onTouchMove: (f) => { handlers.move = f; },
  onTouchEnd: (f) => { handlers.end = f; },
  onTouchCancel: (f) => { handlers.cancel = f; },
  onShow() {},
  vibrateShort() {},
  showShareMenu() {},
  onShareAppMessage() {},
  onShareTimeline() {},
  shareAppMessage: (o) => shared.push(o),
  createWebAudioContext: mockAudio,
};

function step(sec) {
  const frames = Math.round(sec * 60);
  for (let i = 0; i < frames; i += 1) {
    now += 1000 / 60;
    drawn = [];
    const cb = rafCb;
    rafCb = null;
    cb();
  }
}

const touch = (x, y) => {
  const t = [{ identifier: 0, clientX: x, clientY: y }];
  return { touches: t, changedTouches: t };
};
function tap(x, y) {
  handlers.start(touch(x, y));
  step(0.05);
  handlers.end(touch(x, y));
}
function drag(x0, y, x1, steps = 8) {
  handlers.start(touch(x0, y));
  for (let i = 1; i <= steps; i += 1) {
    step(1 / 60);
    handlers.move(touch(x0 + ((x1 - x0) * i) / steps, y));
  }
  handlers.end(touch(x1, y));
}

const screenText = () => drawn.map((d) => d.s).join('');
const meta = () => JSON.parse(store.xty_meta_v1);

test('full playthrough: title → reign → ending → archive → title → quit', async (t) => {
  const { ENDINGS } = await import('../js/data/endings.js');
  await import('../js/main.js');

  step(1.5);
  assert.match(screenText(), /县太爷/);
  assert.match(screenText(), /一个穷县/);

  tap(W / 2, 514);
  step(5);
  assert.match(screenText(), /第1任县令/, 'intro card text revealed');
  assert.match(screenText(), /孙不二/);
  assert.match(screenText(), /先看看账本/);

  handlers.start(touch(W / 2, 600));
  for (let i = 1; i <= 8; i += 1) {
    step(1 / 60);
    handlers.move(touch(W / 2 + i * 10, 600));
  }
  step(0.1);
  assert.match(screenText(), /升堂！/, 'right-hand choice label shows while dragging');
  handlers.move(touch(W / 2 + 160, 600));
  handlers.end(touch(W / 2 + 160, 600));
  step(1.5);
  assert.doesNotMatch(screenText(), /第1任县令/, 'next card replaced the intro');

  const titles = Object.values(ENDINGS).map((e) => e.title);
  let swipes = 0;
  while (!titles.some((tt) => screenText().includes(tt)) && swipes < 500) {
    const right = Math.random() < 0.5;
    drag(W / 2, 600, right ? W / 2 + 170 : W / 2 - 170);
    step(swipes % 7 === 0 ? 3 : 1.2);
    swipes += 1;
  }
  step(3);
  assert.ok(titles.some((tt) => screenText().includes(tt)), `reached an ending after ${swipes} swipes`);
  assert.equal(meta().runs, 1);
  assert.match(screenText(), /新结局/);
  t.diagnostic(`ending ${meta().lastEnding} after ${swipes} swipes, ${meta().best} days`);

  tap(67.5 + 114 + 12 + 57, 737);
  assert.equal(shared.length, 1, 'share button shares');
  assert.match(shared[0].title, /县令/);

  tap(124.5, 737);
  step(1.2);
  assert.match(screenText(), /历任档案/);
  assert.match(screenText(), /历任 1 任/);

  const cellW = (W - 40) / 3;
  const cellH = cellW * 0.92;
  let opened = false;
  for (let i = 0; i < 12 && !opened; i += 1) {
    tap(20 + (i % 3) * cellW + cellW / 2, 178 + Math.floor(i / 3) * cellH + cellH / 2);
    step(0.3);
    opened = screenText().includes('点击任意处关闭');
  }
  assert.ok(opened, 'an unlocked ending opens its detail card');
  tap(W / 2, 100);
  step(0.3);
  assert.doesNotMatch(screenText(), /点击任意处关闭/);

  tap(43, 110);
  step(1.2);
  assert.match(screenText(), /已历 1 任/);

  tap(W / 2, 514);
  step(2);
  assert.match(screenText(), /第2任县令/);
  tap(48, 751);
  step(0.2);
  assert.match(screenText(), /再点退堂/);
  tap(48, 751);
  step(1.2);
  assert.match(screenText(), /升/);
  assert.equal(meta().runs, 1, 'quitting does not record a reign');
});
