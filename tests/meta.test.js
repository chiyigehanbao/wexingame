import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeReign } from '../js/game/deeds.js';
import {
  achievementCount, createMeta, gallerySlots, grantBlessing, markAchievementSeen, normalizeMeta, recordRun, countEndings, takeBlessing, BLESSING_FX,
} from '../js/game/meta.js';

const finishedRun = (ending, day, met = {}) => ({ ending, day, met });

test('recordRun counts runs, endings, best day and met characters', () => {
  let meta = createMeta();
  let res = recordRun(meta, finishedRun('money_low', 20, { shiye: true }));
  assert.equal(res.isNewEnding, true);
  assert.equal(res.isBest, true);
  meta = res.meta;
  assert.equal(meta.runs, 1);
  assert.equal(meta.best, 20);
  assert.equal(meta.lastEnding, 'money_low');
  assert.equal(meta.met.shiye, true);

  res = recordRun(meta, finishedRun('money_low', 10, { butou: true }));
  assert.equal(res.isNewEnding, false);
  assert.equal(res.isBest, false);
  assert.equal(res.meta.endings.money_low, 2);
  assert.equal(res.meta.best, 20);
  assert.equal(res.meta.met.shiye && res.meta.met.butou, true);
  assert.equal(countEndings(res.meta), 1);
  assert.equal(res.meta.dynasty, '承平');
  assert.equal(res.deed.name, '碌碌无为');
  assert.equal(achievementCount(res.meta.achievements.idle), 2);
  assert.equal(res.meta.achievements.idle.seen, 0);
  const reigns = res.meta.achievements.idle.reigns;
  assert.equal(reigns.length, 2);
  assert.notEqual(summarizeReign(reigns[0], 0), summarizeReign(reigns[1], 0));
  assert.notEqual(summarizeReign(reigns[0], 0), summarizeReign(reigns[0], 1));

  res = recordRun(res.meta, { ...finishedRun('new_dynasty', 40), dynasty: '承平' });
  assert.equal(res.meta.dynasty, '启明');
  assert.equal(res.deed.name, '乱世英雄');
  assert.equal(achievementCount(res.meta.achievements.hero), 1);
  assert.equal(res.meta.achievements.plain, undefined);
  res = recordRun(res.meta, { ...finishedRun('new_dynasty', 10), dynasty: '启明' });
  assert.equal(res.meta.dynasty, '承平');
});

test('a blessing waits for the next new reign and survives a save', () => {
  const granted = grantBlessing(createMeta());
  assert.equal(normalizeMeta(granted).blessing, true);
  const kept = recordRun(granted, finishedRun('money_low', 20));
  assert.equal(kept.meta.blessing, true);
  const taken = takeBlessing(kept.meta);
  assert.deepEqual(taken.fx, BLESSING_FX);
  assert.equal(taken.meta.blessing, false);
  assert.equal(takeBlessing(taken.meta).fx, null);
  assert.equal(normalizeMeta({}).blessing, false);
});

test('recordRun does not mutate the input meta', () => {
  const meta = createMeta();
  recordRun(meta, finishedRun('fox_away', 3));
  assert.deepEqual(meta, createMeta());
});

test('archive slots stay at two rows until the shelf grows', () => {
  assert.equal(gallerySlots(0), 6);
  assert.equal(gallerySlots(6), 6);
  assert.equal(gallerySlots(7), 9);
});

test('an old achievement count is treated as already seen', () => {
  const m = normalizeMeta({ achievements: { idle: 3 } });
  assert.equal(m.achievements.idle.count, 3);
  assert.equal(m.achievements.idle.seen, 3);
  assert.equal(markAchievementSeen(m, 'idle'), m);
});

test('a finished reign leaves school and bonds in the world ledger', () => {
  let meta = createMeta();
  const run = {
    ending: 'clean_fame',
    day: 120,
    met: {},
    worldMarks: { school: 1, bridge: 1 },
    bonds: { wangpo: 2, shiye: -1 },
    paths: { clean: 5, graft: 0, pleasure: 0, arms: 0, scheme: 0 },
    county: ['school'],
  };
  meta = recordRun(meta, run).meta;
  assert.equal(meta.world.school, 1);
  assert.equal(meta.world.bridge, 1);
  assert.equal(meta.world.plaque, 1);
  assert.equal(meta.world.people.wangpo, 'friend');
  assert.equal(meta.world.people.shiye, 'foe');
  assert.equal(meta.world.lastPath, 'clean');
  assert.equal(meta.world.lastCounty, 'school');
  assert.equal(normalizeMeta(meta).world.school, 1);
});

test('the highest bond and a finished arc stay for the next reign', () => {
  let meta = createMeta();
  meta = recordRun(meta, {
    ending: 'clean_fame',
    day: 80,
    met: {},
    bonds: { wangpo: 3 },
    used: { arc_wangpo_4: true },
    paths: { clean: 1, graft: 0, pleasure: 0, arms: 0, scheme: 0 },
    county: ['poor'],
    worldMarks: {},
  }).meta;
  assert.equal(meta.world.bondHigh.wangpo, 3);
  assert.equal(meta.world.arcSeen.wangpo, true);
  meta = recordRun(meta, {
    ending: 'recall',
    day: 40,
    met: {},
    bonds: { wangpo: 0 },
    used: {},
    paths: { clean: 0, graft: 0, pleasure: 0, arms: 0, scheme: 0 },
    county: ['poor'],
    worldMarks: {},
  }).meta;
  assert.equal(meta.world.bondHigh.wangpo, 3);
  assert.equal(meta.world.arcSeen.wangpo, true);
  assert.equal(normalizeMeta(meta).world.bondHigh.wangpo, 3);
  assert.equal(normalizeMeta(meta).world.arcSeen.wangpo, true);
});

test('a clean deed unlocks the clean content pack', () => {
  const meta = createMeta();
  const res = recordRun(meta, {
    ending: 'clean_fame',
    day: 100,
    met: {},
    rank: 2,
    paths: { clean: 6, graft: 0, pleasure: 0, arms: 0, scheme: 0 },
    worldMarks: {},
    bonds: {},
    county: ['poor'],
  });
  assert.ok(res.meta.unlockedPacks.includes('clean'));
  assert.ok(res.meta.unlockedPacks.includes('road'));
});

test('normalizeMeta repairs missing or corrupted saves', () => {
  assert.deepEqual(normalizeMeta(null), createMeta());
  assert.deepEqual(normalizeMeta('garbage'), createMeta());
  const m = normalizeMeta({ runs: 3, endings: { a: 1 } });
  assert.equal(m.runs, 3);
  assert.equal(m.best, 0);
  assert.deepEqual(m.met, {});
});
