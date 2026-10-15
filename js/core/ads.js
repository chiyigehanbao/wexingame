/**
 * 微信流量主。只接激励视频和插屏，游戏内不提供充值或内购。
 *
 * 设定：小游戏后台开通流量主之后，在「流量主 → 广告位管理」新建两个广告位，
 * 把广告位 ID 填进 AD_UNITS。留空时不创建广告，结局页也不出现烧香按钮。
 * 激励视频必须由玩家自己点；没看完不发奖。插屏隔一任、且六十秒内不再出。
 */
export const AD_UNITS = {
  rewarded: '',
  interstitial: '',
};

const INTERSTITIAL_GAP_MS = 60000;
const INTERSTITIAL_EVERY = 2;

let rewarded = null;
let interstitial = null;
let rewardWait = null;
let interstitialWait = null;
let lastInterstitialAt = 0;

function canUse(name) {
  return typeof wx !== 'undefined' && typeof wx[name] === 'function';
}

export function adsReady() {
  return !!(AD_UNITS.rewarded && canUse('createRewardedVideoAd'));
}

export function initAds() {
  if (AD_UNITS.rewarded && canUse('createRewardedVideoAd') && !rewarded) {
    rewarded = wx.createRewardedVideoAd({ adUnitId: AD_UNITS.rewarded });
    rewarded.onError(() => {});
    rewarded.onClose((res) => {
      const ok = !res || res.isEnded !== false;
      const wait = rewardWait;
      rewardWait = null;
      if (wait) {
        wait(ok);
      }
      rewarded.load().catch(() => {});
    });
    rewarded.load().catch(() => {});
  }
  if (AD_UNITS.interstitial && canUse('createInterstitialAd') && !interstitial) {
    interstitial = wx.createInterstitialAd({ adUnitId: AD_UNITS.interstitial });
    interstitial.onError(() => {});
    interstitial.onClose(() => {
      const wait = interstitialWait;
      interstitialWait = null;
      if (wait) {
        wait();
      }
    });
  }
}

/** 玩家点了烧香。看完才返回 true。 */
export function showRewarded() {
  if (!rewarded || rewardWait) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    rewardWait = resolve;
    rewarded.show().catch(() => {
      rewarded.load().then(() => rewarded.show()).catch(() => {
        rewardWait = null;
        resolve(false);
      });
    });
  });
}

/**
 * 再开一局时偶尔出插屏。第一任不出，看过激励视频的这一下也不出。
 * @param {number} runs 已经结束的任数
 * @param {boolean} justRewarded 这一页刚刚看完激励视频
 */
export function maybeInterstitial(runs, justRewarded) {
  if (!interstitial || justRewarded || runs < INTERSTITIAL_EVERY || runs % INTERSTITIAL_EVERY !== 0) {
    return Promise.resolve(false);
  }
  if (Date.now() - lastInterstitialAt < INTERSTITIAL_GAP_MS) {
    return Promise.resolve(false);
  }
  if (interstitialWait) {
    return Promise.resolve(false);
  }
  lastInterstitialAt = Date.now();
  return new Promise((resolve) => {
    interstitialWait = () => resolve(true);
    interstitial.show().catch(() => {
      interstitialWait = null;
      resolve(false);
    });
  });
}
