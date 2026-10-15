/**
 * 《县太爷今天也很忙》入口：主循环 + 场景注册。
 */
import { ctx, beginFrame } from './core/screen.js';
import { bindInput, onAnyTouch } from './core/input.js';
import { initAudio, pumpAudio } from './core/audio.js';
import { pumpVisuals } from './ui/paper.js';
import { initShare } from './core/platform.js';
import { initAds } from './core/ads.js';
import {
  registerScenes, go, update, draw,
} from './core/router.js';
import title from './scenes/title.js';
import slots from './scenes/slots.js';
import rules from './scenes/rules.js';
import playScene from './scenes/play-boot.js';
import court from './scenes/court.js';
import ending from './scenes/ending.js';
import archive from './scenes/archive.js';

registerScenes({
  title, slots, rules, play: playScene, court, ending, archive,
});

initShare();
initAds();
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
  pumpAudio();
  pumpVisuals();
  update(dt, now);
  beginFrame();
  draw(ctx, now);
  requestAnimationFrame(frame);
}

go('title');
requestAnimationFrame(frame);
