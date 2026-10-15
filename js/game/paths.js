/**
 * 路数：清正 / 贪墨 / 乐逸 / 武备 / 权谋。
 * 不结束游戏，只塑牌面与中盘岔路。
 */
import { isKnown } from './world.js';

export const PATH_KEYS = ['clean', 'graft', 'pleasure', 'arms', 'scheme'];

export const PATH_NAMES = {
  clean: '清正',
  graft: '贪墨',
  pleasure: '乐逸',
  arms: '武备',
  scheme: '权谋',
};

/** 路数首次跨过 6 时排入的定性卡。 */
export const PATH_ARM_CARD = {
  clean: 'path_clean_name',
  graft: 'path_graft_ledger',
  pleasure: 'path_pleasure_doc',
  arms: 'path_arms_grip',
  scheme: 'path_scheme_two',
};

const PATH_CAP = 12;

export function emptyPaths() {
  return {
    clean: 0,
    graft: 0,
    pleasure: 0,
    arms: 0,
    scheme: 0,
  };
}

export function clampPath(n) {
  return Math.max(0, Math.min(PATH_CAP, Math.round(n)));
}

/** 把 opt.path 加进 run.paths，返回刚跨过的档位（3 或 6）。 */
export function applyPathDelta(run, delta) {
  if (!delta || typeof delta !== 'object') {
    return [];
  }
  if (!run.paths) {
    run.paths = emptyPaths();
  }
  const crossed = [];
  PATH_KEYS.forEach((k) => {
    if (!Number.isFinite(delta[k]) || delta[k] === 0) {
      return;
    }
    const before = run.paths[k] || 0;
    const after = clampPath(before + delta[k]);
    run.paths[k] = after;
    if (before < 3 && after >= 3) {
      crossed.push({ key: k, tier: 3 });
    }
    if (before < 6 && after >= 6) {
      crossed.push({ key: k, tier: 6 });
    }
  });
  return crossed;
}

export function topPaths(run, n = 2) {
  const paths = run?.paths || emptyPaths();
  return PATH_KEYS
    .map((k) => ({ key: k, v: paths[k] || 0, name: PATH_NAMES[k] }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v || a.key.localeCompare(b.key))
    .slice(0, n);
}

export function pathScentLine(run) {
  const top = topPaths(run, 2);
  if (!top.length) {
    return '';
  }
  return top.map((x) => x.name).join(' · ');
}

/**
 * 日常抽牌权重：对口路数抬高，对冲路数压低（不消失）。
 */
export function cardPathWeight(card, run, meta) {
  let w = card.weight || 1;
  const paths = run?.paths || emptyPaths();
  const tags = card.paths;
  if (tags && tags.length) {
    tags.forEach((k) => {
      const v = paths[k] || 0;
      if (v >= 3) {
        w += 2;
      }
      if (v >= 6) {
        w += 3;
      }
    });
    if (tags.includes('graft') && (paths.clean || 0) >= 6) {
      w *= 0.4;
    }
    if (tags.includes('clean') && (paths.graft || 0) >= 6) {
      w *= 0.4;
    }
    if (tags.includes('pleasure') && (paths.clean || 0) >= 6) {
      w *= 0.5;
    }
  }
  const face = run?.county && run.county[0];
  if (face && Array.isArray(card.county) && card.county.includes(face)) {
    w *= 2.4;
  }
  if ((run?.rank || 0) >= 2) {
    const minRank = card.requires && card.requires.minRank;
    if (Number.isFinite(minRank) && run.rank >= minRank) {
      w *= 1.8;
    } else if (!Number.isFinite(minRank)) {
      w *= 0.45;
    }
  }
  if (typeof card?.id === 'string' && card.id.startsWith('arc_') && isKnown(meta?.world, card.who)) {
    w *= 2.2;
  }
  return Math.max(0.15, w);
}

export const COUNTY_FACES = ['poor', 'border', 'salt', 'flood', 'school', 'chaos'];

export const COUNTY_NAMES = {
  poor: '穷县',
  border: '边县',
  salt: '盐县',
  flood: '水县',
  school: '学县',
  chaos: '乱县',
};
