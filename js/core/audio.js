/**
 * 程序化音效：启动时合成采样缓冲，无任何音频素材。
 * 古筝拨弦用 Karplus-Strong；惊堂木 / 木鱼 / 锣用衰减正弦叠加；纸张用滤波噪声。
 */

let ac = null;
let master = null;
let enabled = true;
const buffers = {};
let nextAmbientAt = 0;

/** D 宫五声音阶 */
const SCALE = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25, 739.99];

function makeBuffer(dur, fill) {
  const sr = ac.sampleRate;
  const len = Math.floor(dur * sr);
  const buf = ac.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  fill(data, sr, len);
  return buf;
}

function pluck(freq, dur = 1.6, bright = 0.5) {
  return makeBuffer(dur, (d, sr, len) => {
    const n = Math.max(2, Math.round(sr / freq));
    const ring = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      ring[i] = Math.random() * 2 - 1;
    }
    let idx = 0;
    let prev = 0;
    for (let i = 0; i < len; i += 1) {
      const cur = ring[idx];
      const next = ring[(idx + 1) % n];
      const v = 0.996 * (bright * cur + (1 - bright) * next);
      ring[idx] = v;
      idx = (idx + 1) % n;
      prev = prev * 0.2 + cur * 0.8;
      const fadeIn = Math.min(1, i / 40);
      const fadeOut = Math.min(1, (len - i) / (sr * 0.2));
      d[i] = prev * 0.5 * fadeIn * fadeOut;
    }
  });
}

function partials(dur, list) {
  return makeBuffer(dur, (d, sr, len) => {
    for (let i = 0; i < len; i += 1) {
      const t = i / sr;
      let v = 0;
      list.forEach(([f, amp, decay]) => {
        v += Math.sin(2 * Math.PI * f * t) * amp * Math.exp(-t * decay);
      });
      d[i] = v * Math.min(1, i / 30);
    }
  });
}

function noise(dur, env, smooth) {
  return makeBuffer(dur, (d, sr, len) => {
    let lp = 0;
    for (let i = 0; i < len; i += 1) {
      const t = i / len;
      const a = typeof smooth === 'function' ? smooth(t) : smooth;
      lp += (Math.random() * 2 - 1 - lp) * a;
      d[i] = lp * env(t);
    }
  });
}

function synthAll() {
  SCALE.forEach((f, i) => {
    buffers[`note${i}`] = pluck(f);
  });
  buffers.gavel = (() => {
    const thump = partials(0.35, [[95, 0.9, 18], [180, 0.4, 30], [820, 0.35, 55], [1340, 0.2, 80]]);
    const d = thump.getChannelData(0);
    for (let i = 0; i < 400; i += 1) {
      d[i] += (Math.random() * 2 - 1) * 0.6 * (1 - i / 400);
    }
    return thump;
  })();
  buffers.wood = partials(0.18, [[1180, 0.7, 42], [2360, 0.25, 70], [540, 0.2, 35]]);
  buffers.paper = noise(0.22, (t) => Math.sin(Math.PI * t) ** 2 * 0.5, (t) => 0.08 + 0.3 * t);
  buffers.tick = noise(0.012, (t) => (1 - t) * 0.5, 0.6);
  buffers.gong = partials(3.2, [
    [176, 0.5, 1.1], [261, 0.32, 1.6], [369, 0.22, 2.2], [512, 0.14, 3], [88, 0.3, 0.9],
  ]);
}

/** 首次触摸时调用（部分机型需要用户手势后才能出声） */
export function initAudio() {
  if (ac || !wx.createWebAudioContext) {
    return;
  }
  try {
    ac = wx.createWebAudioContext();
    master = ac.createGain();
    master.gain.value = 0.8;
    master.connect(ac.destination);
    synthAll();
  } catch (e) {
    ac = null;
  }
}

export function setSoundEnabled(on) {
  enabled = on;
}

export function isSoundEnabled() {
  return enabled;
}

export function play(name, volume = 1, rate = 1) {
  if (!ac || !enabled || !buffers[name]) {
    return;
  }
  try {
    if (ac.state === 'suspended' && ac.resume) {
      ac.resume();
    }
    const src = ac.createBufferSource();
    src.buffer = buffers[name];
    if (rate !== 1 && src.playbackRate) {
      src.playbackRate.value = rate;
    }
    const g = ac.createGain();
    g.gain.value = volume;
    src.connect(g);
    g.connect(master);
    src.start(0);
  } catch (e) {
    // 播放失败不影响游戏
  }
}

/** 音阶上的一个音，step 可越界（自动移八度） */
export function note(step, volume = 0.5) {
  const n = SCALE.length;
  const i = ((step % n) + n) % n;
  const oct = Math.floor(step / n);
  play(`note${i}`, volume, 2 ** oct);
}

/** 两音上行 / 下行 */
export function chime(up) {
  note(up ? 3 : 4, 0.35);
  setTimeout(() => note(up ? 5 : 1, 0.35), 90);
}

/**
 * 背景：稀疏的五声拨弦，每 2.5～6 秒一音，偶尔成对。
 * @param {number} now 秒
 */
export function ambient(now, volume = 0.16) {
  if (!ac || !enabled) {
    return;
  }
  if (now < nextAmbientAt) {
    return;
  }
  nextAmbientAt = now + 2.5 + Math.random() * 3.5;
  const step = Math.floor(Math.random() * 6) - 2;
  note(step, volume);
  if (Math.random() < 0.35) {
    setTimeout(() => note(step + 2, volume * 0.7), 260);
  }
}
