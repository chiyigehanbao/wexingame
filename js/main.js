/**
 * 《一夜剧本》v2 主入口：title → playing(mode) → ending。
 */
import './render';
import { START_ID, getNode } from './story';
import {
  setAnimTick,
  drawTitleScreen,
  drawPlaying,
  drawEndingScreen,
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
  resolveEnding,
} from './gameState';
import { triggerSceneEnter } from './layers/sceneLayout';

export default class Main {
  state = 'title';

  currentNodeId = START_ID;

  aniId = 0;

  /** @type {object[]} */
  lastHitRegions = [];

  constructor() {
    bindInput();
    this.loop();
  }

  goTitle() {
    resetRun();
    this.state = 'title';
    this.currentNodeId = START_ID;
    this.syncInput();
  }

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
    triggerSceneEnter(nodeId);
    if (node.isEnding) {
      this.state = 'ending';
    } else {
      this.state = 'playing';
    }
    preloadNodeImages(node);
    this.syncInput();
  }

  onPlayingTap(idx, node) {
    const region = this.lastHitRegions.find((r) => r.index === idx);
    if (node.mode === 'qte') {
      if (region?._qteBeat) {
        qteMode.handleTap();
      }
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

  syncInput() {
    if (this.state === 'title') {
      const { regions } = drawTitleScreen();
      setHitRegions(regions, () => {
        resetRun();
        this.goNode(START_ID);
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
