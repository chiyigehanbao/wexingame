/**
 * 《一夜剧本》剧情节点 — 唯一数据源。
 * 修改剧本只改本文件，不碰渲染逻辑。
 */

/** @type {string} 游戏开始时的节点 id */
export const START_ID = 'scene1';

/** @type {Record<string, object>} */
const NODES = {
  scene1: {
    id: 'scene1',
    background: 'images/bg.jpg',
    portrait: '',
    text: '凌晨两点，写字楼只剩你屏幕上的光标。试用版「AI 编剧」提示：上传大纲即可续写结局。',
    choices: [
      { label: '上传未完成剧本', next: 'scene2' },
      { label: '关掉窗口自己写', next: 'scene2' },
    ],
  },
  scene2: {
    id: 'scene2',
    background: 'images/bg.jpg',
    portrait: '',
    text: 'AI 秒回三版结局。客户消息弹窗：「要爽点，要反转，今晚就要。」',
    choices: [
      { label: '用 AI 爽点版', next: 'scene3' },
      { label: '保留原意慢改', next: 'scene3' },
    ],
  },
  scene3: {
    id: 'scene3',
    background: 'images/bg.jpg',
    portrait: '',
    text: '成片渲染进度 99%。署名栏闪烁：「联合创作 · AI 编剧」。发布键在等你。',
    choices: [
      { label: '发布并标注 AI 共创', next: 'ending_a' },
      { label: '只署自己名发布', next: 'ending_b' },
    ],
  },
  ending_a: {
    id: 'ending_a',
    background: 'images/bg.jpg',
    text:
      '雨夜霓虹下，你的短片上线。评论区有人说剧情「像被谁一夜写完」。你笑了——那一夜确实是。',
    choices: [],
    isEnding: true,
  },
  ending_b: {
    id: 'ending_b',
    background: 'images/bg.jpg',
    text:
      '数据不错，但团队收到合规提醒：试用 AI 未披露。凌晨的都市依旧闪亮，你的剧本却多了一道分叉。',
    choices: [],
    isEnding: true,
  },
};

/**
 * 按 id 取节点；缺失时返回 null。
 * @param {string} id
 * @returns {object|null}
 */
export function getNode(id) {
  if (!id || !NODES[id]) {
    return null;
  }
  return NODES[id];
}
