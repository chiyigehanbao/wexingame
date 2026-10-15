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

const pending = [];
let current = null;
const SAMPLE_BUDGET = 4096;

function beginBuffer(dur) {
  const sr = ac.sampleRate;
  const len = Math.max(1, Math.floor(dur * sr));
  const buf = ac.createBuffer(1, len, sr);
  return { sr, len, data: buf.getChannelData(0), buf, i: 0 };
}

function pluckJob(freq, dur = 1.2, bright = 0.5) {
  const b = beginBuffer(dur);
  const n = Math.max(2, Math.round(b.sr / freq));
  const ring = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    ring[i] = Math.random() * 2 - 1;
  }
  let idx = 0;
  let prev = 0;
  return () => {
    const end = Math.min(b.len, b.i + SAMPLE_BUDGET);
    for (; b.i < end; b.i += 1) {
      const cur = ring[idx];
      const next = ring[(idx + 1) % n];
      ring[idx] = 0.996 * (bright * cur + (1 - bright) * next);
      idx = (idx + 1) % n;
      prev = prev * 0.2 + cur * 0.8;
      const fadeIn = Math.min(1, b.i / 40);
      const fadeOut = Math.min(1, (b.len - b.i) / (b.sr * 0.2));
      b.data[b.i] = prev * 0.5 * fadeIn * fadeOut;
    }
    return b.i >= b.len ? b.buf : null;
  };
}

function partialsJob(dur, list) {
  const b = beginBuffer(dur);
  return () => {
    const end = Math.min(b.len, b.i + SAMPLE_BUDGET);
    for (; b.i < end; b.i += 1) {
      const t = b.i / b.sr;
      let v = 0;
      list.forEach(([f, amp, decay]) => {
        v += Math.sin(2 * Math.PI * f * t) * amp * Math.exp(-t * decay);
      });
      b.data[b.i] = v * Math.min(1, b.i / 30);
    }
    return b.i >= b.len ? b.buf : null;
  };
}

function noiseJob(dur, env, smooth) {
  const b = beginBuffer(dur);
  let lp = 0;
  return () => {
    const end = Math.min(b.len, b.i + SAMPLE_BUDGET);
    for (; b.i < end; b.i += 1) {
      const t = b.i / b.len;
      const a = typeof smooth === 'function' ? smooth(t) : smooth;
      lp += (Math.random() * 2 - 1 - lp) * a;
      b.data[b.i] = lp * env(t);
    }
    return b.i >= b.len ? b.buf : null;
  };
}

function makeJob(name) {
  const noteIdx = /^note(\d)$/.exec(name);
  if (noteIdx) {
    return pluckJob(SCALE[Number(noteIdx[1])]);
  }
  if (name === 'gavel') {
    const step = partialsJob(0.35, [[95, 0.9, 18], [180, 0.4, 30], [820, 0.35, 55], [1340, 0.2, 80]]);
    let buf = null;
    return () => {
      if (!buf) {
        buf = step();
        return null;
      }
      const d = buf.getChannelData(0);
      const start = buf._noise || 0;
      const end = Math.min(400, start + SAMPLE_BUDGET);
      for (let i = start; i < end; i += 1) {
        d[i] += (Math.random() * 2 - 1) * 0.6 * (1 - i / 400);
      }
      buf._noise = end;
      return end >= 400 ? buf : null;
    };
  }
  if (name === 'wood') {
    return partialsJob(0.18, [[1180, 0.7, 42], [2360, 0.25, 70], [540, 0.2, 35]]);
  }
  if (name === 'paper') {
    return noiseJob(0.22, (t) => Math.sin(Math.PI * t) ** 2 * 0.5, (t) => 0.08 + 0.3 * t);
  }
  if (name === 'tick') {
    return noiseJob(0.012, (t) => (1 - t) * 0.5, 0.6);
  }
  if (name === 'gong') {
    return partialsJob(3.2, [
      [176, 0.5, 1.1], [261, 0.32, 1.6], [369, 0.22, 2.2], [512, 0.14, 3], [88, 0.3, 0.9],
    ]);
  }
  return null;
}

/** 创建音频上下文。采样在空帧里一点点合成，播放时不再现算。 */
export function initAudio() {
  if (ac || !wx.createWebAudioContext) {
    return;
  }
  try {
    ac = wx.createWebAudioContext();
    master = ac.createGain();
    master.gain.value = 0.8;
    master.connect(ac.destination);
    pending.push('tick', 'paper', 'wood', 'gavel', 'gong');
    SCALE.forEach((_, i) => pending.push(`note${i}`));
  } catch (e) {
    ac = null;
  }
}

function takeJob() {
  while (pending.length && !current) {
    const name = pending.shift();
    if (!buffers[name]) {
      const step = makeJob(name);
      if (step) {
        current = { name, step };
      }
    }
  }
}

/** 每帧只合成一小段，不占用断案那一帧。 */
export function pumpAudio() {
  if (!ac) {
    return;
  }
  if (!current) {
    takeJob();
  }
  if (!current) {
    return;
  }
  const done = current.step();
  if (done) {
    buffers[current.name] = done;
    current = null;
  }
}

function prioritize(name) {
  if (buffers[name] || (current && current.name === name)) {
    return;
  }
  const i = pending.indexOf(name);
  if (i > 0) {
    pending.splice(i, 1);
    pending.unshift(name);
  } else if (i < 0) {
    pending.unshift(name);
  }
}

/** 升堂前先把翻牌、拍堂的采样排到队首。 */
export function warmPlaySounds() {
  if (!ac) {
    return;
  }
  ['gong', 'gavel', 'tick', 'wood', 'paper'].forEach((name) => prioritize(name));
}

export function setSoundEnabled(on) {
  enabled = on;
}

export function isSoundEnabled() {
  return enabled;
}

export function play(name, volume = 1, rate = 1) {
  if (!ac || !enabled) {
    return;
  }
  if (!buffers[name]) {
    prioritize(name);
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
