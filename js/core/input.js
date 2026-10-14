/**
 * 单指触摸分发：down / move / up 交给当前处理者（场景或转场）。
 */
let handler = null;
let activeId = null;
const listeners = [];

export function setInputHandler(h) {
  handler = h;
}

/** 任意一次触摸都会通知（用于解锁音频等） */
export function onAnyTouch(fn) {
  listeners.push(fn);
}

function point(e) {
  const list = e.changedTouches && e.changedTouches.length ? e.changedTouches : e.touches;
  if (!list || !list.length) {
    return null;
  }
  for (let i = 0; i < list.length; i += 1) {
    if (activeId == null || list[i].identifier === activeId) {
      return list[i];
    }
  }
  return null;
}

export function bindInput() {
  wx.onTouchStart((e) => {
    if (activeId != null) {
      return;
    }
    const t = point(e);
    if (!t) {
      return;
    }
    activeId = t.identifier;
    listeners.forEach((fn) => fn());
    handler?.onDown?.(t.clientX, t.clientY);
  });
  wx.onTouchMove((e) => {
    const t = point(e);
    if (t && activeId != null) {
      handler?.onMove?.(t.clientX, t.clientY);
    }
  });
  const end = (e) => {
    const t = point(e);
    if (!t || activeId == null) {
      return;
    }
    activeId = null;
    handler?.onUp?.(t.clientX, t.clientY);
  };
  wx.onTouchEnd(end);
  wx.onTouchCancel(end);
}
