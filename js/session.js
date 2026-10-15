/**
 * 全局会话：存档、设置、当前这一任。
 */
import { loadMeta, saveMeta, loadSettings, saveSettings, loadSlots, saveSlots } from './core/platform.js';
import { setSoundEnabled } from './core/audio.js';
import { grantBlessing, markAchievementSeen, markEndingSeen, recordRun, takeBlessing } from './game/meta.js';
import { writeSlot } from './game/slots.js';

export const session = {
  meta: loadMeta(),
  settings: loadSettings(),
  slots: loadSlots(),
  slot: 0,
  run: null,
};

setSoundEnabled(session.settings.sound);

export function toggleSound() {
  session.settings = { ...session.settings, sound: !session.settings.sound };
  setSoundEnabled(session.settings.sound);
  saveSettings(session.settings);
  return session.settings.sound;
}

/** 把当前位子上的这一任记下来。payload 为空则清掉。 */
export function saveProgress(run, cardId, echo) {
  session.slots = writeSlot(session.slots, session.slot, { run, cardId, echo });
  saveSlots(session.slots);
}

export function clearProgress() {
  session.slots = writeSlot(session.slots, session.slot, null);
  saveSlots(session.slots);
}

export function acknowledgeAchievement(id) {
  const next = markAchievementSeen(session.meta, id);
  if (next !== session.meta) {
    session.meta = next;
    saveMeta(next);
  }
}

export function acknowledgeEnding(id) {
  const next = markEndingSeen(session.meta, id);
  if (next !== session.meta) {
    session.meta = next;
    saveMeta(next);
  }
}

export function keepBlessing() {
  session.meta = grantBlessing(session.meta);
  saveMeta(session.meta);
}

/** 新开一局时用掉香火。接着存档的这一任不消耗。 */
export function consumeBlessing() {
  const taken = takeBlessing(session.meta);
  if (!taken.fx) {
    return null;
  }
  session.meta = taken.meta;
  saveMeta(session.meta);
  return taken.fx;
}

/** 结算当前一任并落盘 */
export function finishRun(run) {
  const before = session.meta;
  const res = recordRun(before, run);
  session.meta = res.meta;
  saveMeta(res.meta);
  return { ...res, before };
}
