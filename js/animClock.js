/**
 * 全局动画时钟，避免 renderer 与 modes 循环依赖。
 */
let animTick = 0;

export function setAnimTick(tick) {
  animTick = tick;
}

export function getAnimTick() {
  return animTick;
}
