/**
 * 存档、震动、分享等微信平台能力（全部容错，模拟器缺失 API 时静默跳过）。
 */
import { normalizeMeta } from '../game/meta.js';

const META_KEY = 'xty_meta_v1';
const SETTINGS_KEY = 'xty_settings_v1';

function read(key) {
  try {
    return wx.getStorageSync(key);
  } catch (e) {
    return null;
  }
}

function write(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (e) {
    // 存储满或不可用时放弃本次写入
  }
}

export const loadMeta = () => normalizeMeta(read(META_KEY));
export const saveMeta = (meta) => write(META_KEY, meta);

export function loadSettings() {
  const s = read(SETTINGS_KEY);
  return { sound: !(s && s.sound === false) };
}
export const saveSettings = (s) => write(SETTINGS_KEY, s);

export function vibrate(type = 'light') {
  try {
    wx.vibrateShort && wx.vibrateShort({ type });
  } catch (e) {
    // 无震动能力
  }
}

let shareTitle = '县太爷今天也很忙——一个穷县，一堆麻烦事';

export function setShareTitle(title) {
  shareTitle = title;
}

export function initShare() {
  try {
    wx.showShareMenu && wx.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage', 'shareTimeline'] });
    wx.onShareAppMessage && wx.onShareAppMessage(() => ({ title: shareTitle }));
    wx.onShareTimeline && wx.onShareTimeline(() => ({ title: shareTitle }));
  } catch (e) {
    // 分享不可用
  }
}

export function shareNow() {
  try {
    wx.shareAppMessage && wx.shareAppMessage({ title: shareTitle });
  } catch (e) {
    // 分享不可用
  }
}
