/**
 * 缓动与插值小工具。
 */
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/** 与帧率无关的指数逼近 */
export const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));

/** 按住时从牌的当前位置接着走，不把位移从零重算。 */
export const followGrab = (origin, start, point, scale = 1) => origin + (point - start) * scale;

export const easeOutCubic = (t) => 1 - (1 - t) ** 3;
export const easeInCubic = (t) => t * t * t;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

/** 0→1 的进度，t 为已过秒数 */
export const progress = (t, start, dur) => clamp((t - start) / dur);
