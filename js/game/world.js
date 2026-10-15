/**
 * 历任留下的县里痕迹。下一任靠 meta.world 看见。
 */

export function emptyWorld() {
  return {
    school: 0,
    bridge: 0,
    granary: 0,
    plaque: 0,
    salt: 0,
    dyke: 0,
    people: {},
    bondHigh: {},
    arcSeen: {},
    lastPath: '',
    lastCounty: 'poor',
  };
}

/** 交情到了，或弧已经收过，下一任可以更早遇见。 */
export const FAMILIAR_ARC_DAY = 12;

const ARC_ENDS = [
  ['arc_wangpo_4', 'wangpo'],
  ['arc_qian_4', 'qian'],
  ['arc_butou_4', 'butou'],
  ['arc_sheng_4', 'shusheng'],
  ['arc_laohan_4', 'laohan'],
  ['arc_heshang_4', 'heshang'],
  ['arc_lang_4', 'langzhong'],
  ['arc_gou_4', 'gousheng'],
  ['arc_zhifu_4', 'zhifu'],
  ['arc_fox_4', 'huxian'],
  ['arc_qin_4', 'qinchai'],
  ['arc_shiye_4', 'shiye'],
];

export function isKnown(world, who) {
  if (!who || !world) {
    return false;
  }
  return (world.bondHigh?.[who] || 0) >= 2 || world.arcSeen?.[who] === true;
}

export function normalizeWorld(raw) {
  const base = emptyWorld();
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  const people = {};
  if (raw.people && typeof raw.people === 'object') {
    Object.keys(raw.people).forEach((k) => {
      if (typeof raw.people[k] === 'string') {
        people[k] = raw.people[k];
      }
    });
  }
  return {
    school: clampMark(raw.school),
    bridge: clampMark(raw.bridge),
    granary: clampMark(raw.granary),
    plaque: clampMark(raw.plaque),
    salt: clampMark(raw.salt),
    dyke: clampMark(raw.dyke),
    people,
    bondHigh: readBondHigh(raw.bondHigh),
    arcSeen: readArcSeen(raw.arcSeen),
    lastPath: typeof raw.lastPath === 'string' ? raw.lastPath : '',
    lastCounty: typeof raw.lastCounty === 'string' ? raw.lastCounty : 'poor',
  };
}

function readBondHigh(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') {
    return out;
  }
  Object.keys(raw).forEach((k) => {
    if (!k || k.length > 16) {
      return;
    }
    const n = raw[k];
    if (!Number.isFinite(n)) {
      return;
    }
    out[k] = Math.max(-2, Math.min(3, Math.round(n)));
  });
  return out;
}

function readArcSeen(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') {
    return out;
  }
  Object.keys(raw).forEach((k) => {
    if (!k || k.length > 16) {
      return;
    }
    if (raw[k] === true) {
      out[k] = true;
    }
  });
  return out;
}

function clampMark(n) {
  return Number.isFinite(n) ? Math.max(0, Math.min(9, Math.round(n))) : 0;
}

/** 把这一任的 marks / bonds / 结局写进史册。 */
export function mergeWorld(prev, run) {
  const world = normalizeWorld(prev);
  const marks = run?.worldMarks || {};
  ['school', 'bridge', 'granary', 'plaque', 'salt', 'dyke'].forEach((k) => {
    if (Number.isFinite(marks[k]) && marks[k] > 0) {
      world[k] = clampMark((world[k] || 0) + marks[k]);
    }
  });
  const bonds = run?.bonds || {};
  const bondHigh = readBondHigh(world.bondHigh);
  Object.keys(bonds).forEach((who) => {
    const v = bonds[who];
    if (!Number.isFinite(v)) {
      return;
    }
    if (v >= 2) {
      world.people[who] = 'friend';
    } else if (v <= -1) {
      world.people[who] = 'foe';
    }
    const prev = Number.isFinite(bondHigh[who]) ? bondHigh[who] : v;
    bondHigh[who] = Math.max(-2, Math.min(3, Math.round(Math.max(prev, v))));
  });
  world.bondHigh = bondHigh;
  const arcSeen = readArcSeen(world.arcSeen);
  const used = run?.used || {};
  ARC_ENDS.forEach(([id, who]) => {
    if (used[id]) {
      arcSeen[who] = true;
    }
  });
  world.arcSeen = arcSeen;
  if (run?.ending === 'clean_fame') {
    world.plaque = clampMark(world.plaque + 1);
  }
  if (run?.ending === 'shiye_cut' || run?.ending === 'shiye_sink') {
    world.people.shiye = run.ending === 'shiye_cut' ? 'foe' : 'gone';
  }
  const paths = run?.paths || {};
  const top = Object.keys(paths).sort((a, b) => (paths[b] || 0) - (paths[a] || 0))[0];
  if (top && (paths[top] || 0) >= 3) {
    world.lastPath = top;
  }
  world.lastCounty = (run?.county && run.county[0]) || world.lastCounty;
  return world;
}

export function applyWorldMark(run, mark) {
  if (!mark || typeof mark !== 'object') {
    return;
  }
  if (!run.worldMarks) {
    run.worldMarks = {};
  }
  Object.keys(mark).forEach((k) => {
    if (!Number.isFinite(mark[k])) {
      return;
    }
    run.worldMarks[k] = (run.worldMarks[k] || 0) + mark[k];
  });
}
