/**
 * 《一夜剧本》主入口：状态机 title → playing → ending。
 */
import './render';
import { START_ID, getNode } from './story';
import {
  drawTitleScreen,
  drawScene,
  drawEndingScreen,
  preloadNodeImages,
  getChoiceButtonRects,
} from './renderer';
import { setHitRegions, bindInput } from './input';

export default class Main {
  state = 'title';

  currentNodeId = START_ID;

  aniId = 0;

  constructor() {
    bindInput();
    this.loop();
  }

  /**
   * 进入标题页。
   */
  goTitle() {
    this.state = 'title';
    this.currentNodeId = START_ID;
    this.syncInput();
  }

  /**
   * 从节点 id 开始剧情。
   * @param {string} nodeId
   */
  goNode(nodeId) {
    const node = getNode(nodeId);
    if (!node) {
      this.goTitle();
      return;
    }
    this.currentNodeId = nodeId;
    if (node.isEnding) {
      this.state = 'ending';
    } else {
      this.state = 'playing';
    }
    preloadNodeImages(node);
    this.syncInput();
  }

  /**
   * 处理选项：跳转 next 或结局。
   * @param {number} choiceIndex
   */
  onChoice(choiceIndex) {
    const node = getNode(this.currentNodeId);
    if (!node || !node.choices || !node.choices[choiceIndex]) {
      return;
    }
    const nextId = node.choices[choiceIndex].next;
    this.goNode(nextId);
  }

  /**
   * 根据 state 绘制并更新命中区域。
   */
  syncInput() {
    if (this.state === 'title') {
      const btn = drawTitleScreen();
      setHitRegions([btn], () => this.goNode(START_ID));
      return;
    }
    if (this.state === 'playing') {
      const node = getNode(this.currentNodeId);
      drawScene(node);
      const labels = (node.choices || []).map((c) => c.label);
      const rects = getChoiceButtonRects(labels);
      setHitRegions(rects, (idx) => this.onChoice(idx));
      return;
    }
    if (this.state === 'ending') {
      const node = getNode(this.currentNodeId);
      const btn = drawEndingScreen(node);
      setHitRegions([btn], () => this.goTitle());
    }
  }

  /**
   * 每帧重绘（剧情无物理，全量重绘即可）。
   */
  loop() {
    this.syncInput();
    this.aniId = requestAnimationFrame(() => this.loop());
  }
}
