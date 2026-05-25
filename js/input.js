/**
 * 统一点击/触摸命中检测。
 */
let hitRegions = [];
let onTapCallback = null;

/**
 * 注册当前帧可点击区域与回调。
 * @param {{ x: number, y: number, w: number, h: number, index?: number }[]} regions
 * @param {(index: number) => void} callback index 为 -1 表示单按钮（开始/重来）
 */
export function setHitRegions(regions, callback) {
  hitRegions = regions || [];
  onTapCallback = callback;
}

/**
 * 判断点是否在矩形内。
 */
function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/**
 * 解析触摸/鼠标坐标并触发回调。
 * @param {TouchEvent|object} ev
 */
function handlePointer(ev) {
  if (!onTapCallback || !hitRegions.length) {
    return;
  }
  const touch = ev.touches && ev.touches[0] ? ev.touches[0] : ev;
  const x = touch.clientX ?? touch.x;
  const y = touch.clientY ?? touch.y;
  if (x == null || y == null) {
    return;
  }
  for (let i = 0; i < hitRegions.length; i += 1) {
    const r = hitRegions[i];
    if (!pointInRect(x, y, r)) {
      continue;
    }
    const idx = typeof r.index === 'number' ? r.index : -1;
    onTapCallback(idx);
    return;
  }
}

let bound = false;

/**
 * 绑定 canvas 触摸（仅绑定一次）。
 */
export function bindInput() {
  if (bound) {
    return;
  }
  bound = true;
  wx.onTouchStart((e) => {
    if (!e.touches || !e.touches[0]) {
      return;
    }
    handlePointer(e);
  });
}
