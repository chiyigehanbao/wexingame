/**
 * 《县太爷今天也很忙》入口：主循环 + 场景注册。
 */
import { ctx, beginFrame } from './core/screen.js';
import { bindInput, onAnyTouch } from './core/input.js';
import { initAudio } from './core/audio.js';
import { initShare } from './core/platform.js';
import {
  registerScenes, go, update, draw,
} from './core/router.js';
import title from './scenes/title.js';
import playScene from './scenes/play.js';
import ending from './scenes/ending.js';
import archive from './scenes/archive.js';

registerScenes({
  title, play: playScene, ending, archive,
});

initShare();
initAudio();
bindInput();
onAnyTouch(initAudio);

let last = Date.now();

if (wx.onShow) {
  wx.onShow(() => {
    last = Date.now();
  });
}

function frame() {
  const nowMs = Date.now();
  const dt = Math.min(0.05, (nowMs - last) / 1000);
  last = nowMs;
  const now = nowMs / 1000;
  update(dt, now);
  beginFrame();
  draw(ctx, now);
  requestAnimationFrame(frame);
}

go('title');
requestAnimationFrame(frame);
