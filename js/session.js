/**
 * 全局会话：存档、设置、当前这一任。
 */
import { loadMeta, saveMeta, loadSettings, saveSettings } from './core/platform.js';
import { setSoundEnabled } from './core/audio.js';
import { recordRun } from './game/meta.js';

export const session = {
  meta: loadMeta(),
  settings: loadSettings(),
  run: null,
};

setSoundEnabled(session.settings.sound);

export function toggleSound() {
  session.settings = { ...session.settings, sound: !session.settings.sound };
  setSoundEnabled(session.settings.sound);
  saveSettings(session.settings);
  return session.settings.sound;
}

/** 结算当前一任并落盘 */
export function finishRun(run) {
  const before = session.meta;
  const res = recordRun(before, run);
  session.meta = res.meta;
  saveMeta(res.meta);
  return { ...res, before };
}
