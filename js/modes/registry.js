/**
 * 玩法 mode 注册表。
 */
import * as narrative from './narrative';
import * as qte from './qte';
import * as mail from './mail';
import * as archive from './archive';
import * as edit from './edit';

const HANDLERS = {
  narrative,
  qte,
  mail,
  archive,
  edit,
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
