/**
 * 升堂入口。微信开发者工具对动态 import() 返回空的脚本类型，
 * 卷宗必须跟标题一起静态引进去，否则升堂会停在「没展开」。
 */
import play from './play.js';

/**
 * 展开中或没展开时回标题，并丢掉排队的进入。
 * 已经升堂则不拦，排队也不动。
 */
export function bootLeave(real, error, loading, queued) {
  if (real || (!error && !loading)) {
    return { go: null, queued };
  }
  return { go: 'title', queued: null };
}

const boot = {
  enter(params) {
    play.enter(params);
  },
  update(dt, now) {
    play.update?.(dt, now);
  },
  draw(ctx, now) {
    play.draw(ctx, now);
  },
  onDown(x, y) {
    play.onDown?.(x, y);
  },
  onMove(x, y) {
    play.onMove?.(x, y);
  },
  onUp(x, y) {
    play.onUp?.(x, y);
  },
};

export default boot;
