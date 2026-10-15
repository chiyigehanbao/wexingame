import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from '../js/data/cards.js';
import { BULLETINS } from '../js/data/bulletins.js';
import { RULES } from '../js/data/rules.js';
import { echoOf } from '../js/data/echoes.js';
import { CHARACTERS } from '../js/data/characters.js';
import { ENDINGS, ENDING_ORDER } from '../js/data/endings.js';
import { STAT_KEYS } from '../js/game/stats.js';
import { createRun, drawCard, choose, isEligible } from '../js/game/run.js';
import { createMeta, recordRun } from '../js/game/meta.js';

const byId = Object.fromEntries(CARDS.map((c) => [c.id, c]));
const options = (c) => [c.left, c.right];

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('the rules do not call every choice two characters', () => {
  const body = RULES.find(([title]) => title === '断案')[1];
  assert.equal(body.includes('两个字'), false);
  const rankRule = RULES.find(([title]) => title === '官级')[1];
  assert.match(rankRule, /再多一年/);
  const labels = CARDS.flatMap((c) => [c.left?.label, c.right?.label]).filter(Boolean);
  const notTwo = labels.filter((label) => [...label].length !== 2).length;
  assert.ok(notTwo > labels.length / 2, `${notTwo} of ${labels.length}`);
});

test('themes, paths and bulletins cover the reign', () => {
  const themes = ['tax', 'river', 'bandit', 'exam', 'wedding', 'salt'];
  const themed = CARDS.filter((c) => c.theme);
  themed.forEach((c) => assert.ok(themes.includes(c.theme), `${c.id} theme ${c.theme}`));
  themes.forEach((t) => assert.ok(themed.some((c) => c.theme === t), t));
  assert.ok(CARDS.filter((c) => c.paths && c.paths.length).length >= 80);
  assert.ok(BULLETINS.length >= 120, `bulletins ${BULLETINS.length}`);
  const beatOf = {
    shusheng: 'arc_sheng_4',
    langzhong: 'arc_lang_4',
    huxian: 'arc_fox_4',
    qinchai: 'arc_qin_4',
    gousheng: 'arc_gou_4',
  };
  ['wangpo', 'qian', 'shiye', 'butou', 'shusheng', 'laohan', 'heshang', 'langzhong', 'gousheng', 'zhifu', 'huxian', 'qinchai']
    .forEach((who) => {
      const beat = beatOf[who] || `arc_${who}_4`;
      assert.ok(CARDS.some((c) => c.id === beat), `${who} missing ${beat}`);
    });
});

test('new faces have a handful of cards and late paths open at eight', () => {
  ['yanshang', 'linling', 'caoding', 'ancha', 'shizhe'].forEach((who) => {
    const n = CARDS.filter((c) => c.who === who).length;
    assert.ok(n >= 4, `${who} has ${n}`);
  });
  ['graft', 'pleasure', 'arms', 'scheme'].forEach((k) => {
    const late = CARDS.find((c) => (c.requires && c.requires.minPath && c.requires.minPath[k]) >= 8);
    assert.ok(late, `${k} has no late exit`);
    const run = createRun(createMeta());
    run.paths[k] = 7;
    run.day = 200;
    if (late.requires.minTroops) {
      run.troops = late.requires.minTroops;
    }
    assert.equal(isEligible(late, run, createMeta()), false, k);
    run.paths[k] = 8;
    assert.equal(isEligible(late, run, createMeta()), true, k);
  });
});

test('card ids are unique and an intro card exists', () => {
  assert.equal(new Set(CARDS.map((c) => c.id)).size, CARDS.length);
  assert.ok(byId.intro?.chainOnly);
  assert.ok(CARDS.length >= 70, `only ${CARDS.length} cards`);
});

test('every card is well formed', () => {
  CARDS.forEach((c) => {
    assert.ok(CHARACTERS[c.who], `${c.id}: unknown who ${c.who}`);
    assert.ok(c.text && c.text.length <= 90, `${c.id}: text missing or too long`);
    options(c).forEach((o) => {
      assert.ok(o && o.label && o.label.length <= 9, `${c.id}: bad label ${o?.label}`);
      Object.keys(o.fx || {}).forEach((k) => assert.ok(STAT_KEYS.includes(k), `${c.id}: bad fx ${k}`));
      if (o.chain) {
        assert.ok(byId[o.chain.id]?.chainOnly, `${c.id}: chain to non-chain card ${o.chain.id}`);
      }
      if (o.ending) {
        assert.ok(ENDINGS[o.ending], `${c.id}: unknown ending ${o.ending}`);
      }
    });
  });
});

test('every choice has a short aftermath line', () => {
  CARDS.forEach((c) => {
    ['left', 'right'].forEach((side) => {
      const line = echoOf(c.id, side);
      assert.ok(line, `${c.id}:${side} has no echo`);
      assert.ok([...line].length <= 18, `${c.id}:${side} echo too long: ${line}`);
    });
  });
});

test('every chainOnly card is reachable from some choice', () => {
  const targets = new Set(CARDS.flatMap((c) => options(c).map((o) => o.chain?.id).filter(Boolean)));
  CARDS.filter((c) => c.chainOnly && c.id !== 'intro' && !c.career)
    .forEach((c) => assert.ok(targets.has(c.id), `${c.id} is never chained`));
});

test('every ending has text and is reachable', () => {
  assert.deepEqual([...ENDING_ORDER].sort(), Object.keys(ENDINGS).sort());
  const explicit = new Set(CARDS.flatMap((c) => options(c).map((o) => o.ending).filter(Boolean)));
  ENDING_ORDER.forEach((id) => {
    const e = ENDINGS[id];
    assert.ok(e.title && e.text && e.handoff && e.seal, `${id} incomplete`);
    const statEnding = /^(people|money|court|heart)_low$/.test(id);
    assert.ok(statEnding || id === 'full_term' || id === 'empire_peace' || id === 'dismissed' || explicit.has(id), `${id} unreachable`);
  });
});

test('1000 random reigns always end and produce varied endings', () => {
  const rng = mulberry32(42);
  let meta = createMeta();
  const seen = {};
  let totalDays = 0;
  for (let i = 0; i < 1000; i += 1) {
    const run = createRun(meta);
    let guard = 0;
    while (!run.ending) {
      const card = drawCard(run, CARDS, meta, rng);
      choose(run, card, rng() < 0.5 ? 'left' : 'right', rng);
      guard += 1;
      assert.ok(guard < 1000, 'reign never ended');
    }
    seen[run.ending] = (seen[run.ending] || 0) + 1;
    totalDays += run.day;
    meta = recordRun(meta, run).meta;
  }
  const avgDays = totalDays / 1000;
  assert.ok(Object.keys(seen).length >= 9, `only saw ${Object.keys(seen).join(',')}`);
  assert.ok(avgDays > 25 && avgDays < 700, `average reign ${avgDays} days`);
});
