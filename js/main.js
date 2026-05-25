/**
 * 《一夜剧本》v2 主入口：title / log / playing(mode) / ending。
 */
import './render';
import { START_ID, getNode } from './story';
import {
  setAnimTick,
  drawTitleScreen,
  drawPlaying,
  drawEndingScreen,
  drawChapterLogScreen,
  preloadNodeImages,
} from './renderer';
import { setHitRegions, bindInput } from './input';
import * as qteMode from './modes/qte';
import * as mailMode from './modes/mail';
import * as archiveMode from './modes/archive';
import * as editMode from './modes/edit';
import * as pressure from './modes/pressure';
import {
  resetRun,
  applyEffect,
  pushChapter,
  loadChapterLog,
  resolveEnding,
} from './gameState';

export default class Main {
  state = 'title';

  currentNodeId = START_ID;

  aniId = 0;

  /** @type {object[]} */
  lastHitRegions = [];

  titleHasLog = false;

  constructor() {
    loadChapterLog();
    bindInput();
    this.loop();
  }

  /**
   * 返回标题（新一局重置数值）。
   */
  goTitle() {
    resetRun();
    this.state = 'title';
    this.currentNodeId = START_ID;
    this.syncInput();
  }

  /**
   * @param {string} nodeId
   */
  goNode(nodeId) {
    if (nodeId === '__resolve_ending__') {
      nodeId = resolveEnding();
    }
    const node = getNode(nodeId);
    if (!node) {
      this.goTitle();
      return;
    }
    this.currentNodeId = nodeId;
    pushChapter(node);
    if (node.isEnding) {
      this.state = 'ending';
    } else {
      this.state = 'playing';
    }
    preloadNodeImages(node);
    this.syncInput();
  }

  /**
   * @param {number} choiceIndex
   */
  onPlayingTap(idx, node) {
    const region = this.lastHitRegions.find((r) => r.index === idx);
    if (node.mode === 'qte' && qteMode.handleTap()) {
      return;
    }
    if (node.mode === 'mail' && mailMode.handleRegionTap(region)) {
      return;
    }
    if (node.mode === 'archive' && archiveMode.handleRegionTap(region)) {
      return;
    }
    if (node.mode === 'edit' && editMode.handleRegionTap(region)) {
      return;
    }
    if (node.mode === 'narrative' || !node.mode) {
      this.onChoice(idx);
    }
  }

  onChoice(choiceIndex) {
    const node = getNode(this.currentNodeId);
    if (!node?.choices?.[choiceIndex]) {
      return;
    }
    const choice = node.choices[choiceIndex];
    applyEffect(choice.effect);
    let nextId = choice.next;
    if (nextId === '__resolve_ending__') {
      nextId = resolveEnding();
    }
    this.goNode(nextId);
  }

  goLog() {
    this.state = 'log';
    this.syncInput();
  }

  syncInput() {
    if (this.state === 'title') {
      const { regions, hasLog } = drawTitleScreen();
      this.titleHasLog = hasLog;
      setHitRegions(regions, (idx) => {
        if (idx === 1 && hasLog) {
          this.goLog();
          return;
        }
        resetRun();
        this.goNode(START_ID);
      });
      return;
    }
    if (this.state === 'log') {
      const btn = drawChapterLogScreen();
      setHitRegions([btn], () => {
        this.state = 'title';
        this.syncInput();
      });
      return;
    }
    if (this.state === 'playing') {
      const node = getNode(this.currentNodeId);
      const hooks = {
        goNext: (id) => {
          pressure.stopCountdown();
          this.goNode(id);
        },
      };
      const regions = drawPlaying(node, hooks);
      this.lastHitRegions = regions;
      setHitRegions(regions, (idx) => this.onPlayingTap(idx, node));
      return;
    }
    if (this.state === 'ending') {
      const node = getNode(this.currentNodeId);
      const btn = drawEndingScreen(node);
      setHitRegions([btn], () => this.goTitle());
    }
  }

  loop() {
    setAnimTick(Date.now());
    this.syncInput();
    this.aniId = requestAnimationFrame(() => this.loop());
  }
}
