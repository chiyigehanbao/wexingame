/**
 * 玩法 mode 注册表。
 */
import * as narrative from './narrative';

const HANDLERS = {
  narrative,
};

/**
 * @param {string} mode
 * @returns {typeof narrative}
 */
export function getModeHandler(mode) {
  if (!mode || !HANDLERS[mode]) {
    return HANDLERS.narrative;
  }
  return HANDLERS[mode];
}
