/**
 * 主画布与高清屏适配。必须最先被 import：首个 wx.createCanvas() 才是上屏画布。
 */
const canvas = wx.createCanvas();
GameGlobal.canvas = canvas;

const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();

export const W = info.windowWidth || info.screenWidth;
export const H = info.windowHeight || info.screenHeight;
export const DPR = Math.min(info.pixelRatio || 2, 3);

canvas.width = Math.round(W * DPR);
canvas.height = Math.round(H * DPR);

export const ctx = canvas.getContext('2d');

function computeSafeTop() {
  let top = (info.statusBarHeight || info.safeArea?.top || 20) + 8;
  try {
    const menu = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect();
    if (menu && menu.bottom) {
      top = Math.max(top, menu.bottom + 6);
    }
  } catch (e) {
    // 部分基础库不支持胶囊按钮信息
  }
  return top;
}

/** 胶囊按钮下沿，内容从此处开始 */
export const SAFE_TOP = computeSafeTop();

/** 底部 Home 条留白 */
export const SAFE_BOTTOM = info.safeArea && info.safeArea.bottom
  ? Math.max(12, H - info.safeArea.bottom + 8)
  : 16;

export function beginFrame() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = 1;
}

/**
 * 离屏图层，按 DPR 放大，绘制时以逻辑尺寸 drawImage。
 */
export function createLayer(w, h) {
  const c = wx.createCanvas();
  c.width = Math.ceil(w * DPR);
  c.height = Math.ceil(h * DPR);
  const g = c.getContext('2d');
  g.scale(DPR, DPR);
  return { canvas: c, ctx: g, w, h };
}
