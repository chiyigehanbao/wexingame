/**
 * 一任只落一条成就。顺序是优先级，命中的第一条就是这局的总结。
 * 以后再有一任落成同一条，次数才加一。
 */
import { ENDINGS } from '../data/endings.js';
import { careerAge } from './time.js';
export const DEEDS = [
  { id: 'hero', name: '乱世英雄', seal: '乱世', test: (run) => !!(run.founded || run.ending === 'new_dynasty' || run.ending === 'traitor') },
  { id: 'throne', name: '黄袍加身', seal: '黄袍', test: (run) => ['triumph', 'defeat', 'empire_peace'].includes(run.ending) },
  { id: 'bribe', name: '铜臭青云', seal: '铜臭', test: (run) => (run.bribes || 0) >= 2 || (run.paths?.graft || 0) >= 6 },
  { id: 'pleasure', name: '酒色误事', seal: '酒色', test: (run) => ['illness', 'leisure'].includes(run.ending) || (run.paths?.pleasure || 0) >= 6 },
  { id: 'clean', name: '两袖清风', seal: '两袖', test: (run) => run.ending === 'clean_fame' || ((run.paths?.clean || 0) >= 6 && !(run.bribes > 0)) },
  { id: 'rise', name: '白手起家', seal: '白手', test: (run) => (run.rank || 0) >= 2 && !(run.bribes > 0) },
  { id: 'troops', name: '屯兵自重', seal: '屯兵', test: (run) => (run.troops || 0) >= 50 || run.ending === 'arms_scatter' },
  { id: 'transfer', name: '调任再爬', seal: '调任', test: (run) => !!run.retitled || run.ending === 'transfer' },
  { id: 'scheme', name: '两面三刀', seal: '权谋', test: (run) => (run.paths?.scheme || 0) >= 6 || run.ending === 'traitor' },
  { id: 'builder', name: '修桥办学', seal: '营造', test: (run) => ((run.worldMarks?.school || 0) + (run.worldMarks?.bridge || 0) + (run.worldMarks?.granary || 0)) >= 2 },
  { id: 'fox', name: '随狐而去', seal: '狐踪', test: (run) => run.ending === 'fox_away' },
  { id: 'exam', name: '金殿告状', seal: '御状', test: (run) => run.ending === 'exam_hero' },
  { id: 'flood', name: '河伯有知', seal: '治水', test: (run) => run.ending === 'flood_saint' || (run.worldMarks?.dyke || 0) >= 1 },
  { id: 'salt', name: '盐引翻车', seal: '盐引', test: (run) => run.ending === 'salt_fall' || (run.worldMarks?.salt || 0) >= 1 },
  { id: 'monk', name: '放下屠刀', seal: '出家', test: (run) => run.ending === 'monk_away' },
  { id: 'canal', name: '误了漕期', seal: '误漕', test: (run) => run.ending === 'canal_late' },
  { id: 'quiet', name: '无事身退', seal: '悄退', test: (run) => run.ending === 'quiet_exit' || run.ending === 'empty_post' },
  { id: 'book', name: '直笔惹祸', seal: '史祸', test: (run) => run.ending === 'book_trouble' },
  { id: 'mutiny', name: '兵哗一夜', seal: '兵哗', test: (run) => run.ending === 'mutiny_end' },
  { id: 'drunk', name: '醉卧公堂', seal: '醉堂', test: (run) => run.ending === 'drunk_court' },
  { id: 'monument', name: '碑倒人倒', seal: '碑倒', test: (run) => run.ending === 'monument_fall' },
  { id: 'retire', name: '急流勇退', seal: '急流', test: (run) => ['retire', 'heir_son', 'heir_shiye'].includes(run.ending) },
  { id: 'plain', name: '平淡一身', seal: '平淡', test: (run) => (run.rank || 0) === 0 && !(run.bribes > 0) && (run.day || 0) >= 30 },
  { id: 'idle', name: '碌碌无为', seal: '碌碌', test: (run) => (run.day || 0) < 25 && (run.rank || 0) === 0 && !run.founded },
];

export function deedOf(run) {
  return DEEDS.find((d) => d.test(run || {})) || { id: 'ordinary', name: '寻常官场', seal: '寻常' };
}

const RANKS = ['县令', '通判', '知府', '按察使', '巡抚', '尚书', '皇帝'];

/** 一任结束时留下的仕途事实，供档案里每次重写总结。 */
export function snapshotReign(run) {
  const stats = run?.stats || {};
  const rank = run?.rank || 0;
  const day = run?.day || 0;
  const num = (v) => (Number.isFinite(v) ? Math.round(v) : null);
  return {
    day,
    rank,
    age: careerAge({ day, rank }),
    dynasty: run?.dynasty === '启明' ? '启明' : '承平',
    ending: run?.ending || '',
    people: num(stats.people),
    money: num(stats.money),
    court: num(stats.court),
    heart: num(stats.heart),
    virtue: num(run?.virtue),
    bribes: run?.bribes || 0,
    troops: run?.troops || 0,
    founded: !!run?.founded,
  };
}

function endingTitle(id) {
  return ENDINGS[id]?.title || '这一任收了场';
}

/**
 * 同一份仕途，salt 不同，句子就换一套。
 * 次数相同也不会写成同一段话。
 */
export function summarizeReign(reign, salt = 0) {
  const r = reign || {};
  const s = Math.abs(salt | 0);
  const rank = RANKS[r.rank] || '县令';
  const dynasty = r.dynasty || '承平';
  const day = r.day || 0;
  const age = r.age || 30;
  const title = endingTitle(r.ending);
  const stats = [
    ['民心', r.people],
    ['钱粮', r.money],
    ['官声', r.court],
    ['良心', r.heart],
  ];
  const order = [0, 1, 2, 3];
  if (s % 3 === 1) {
    order.reverse();
  } else if (s % 3 === 2) {
    order.unshift(order.pop());
  }
  const known = order.filter((i) => Number.isFinite(stats[i][1]));
  const statLine = known.length
    ? known.map((i) => `${stats[i][0]}${stats[i][1]}`).join('，')
    : '';
  const bribe = (r.bribes || 0) >= 2
    ? `银子往上送过${r.bribes}回`
    : (r.bribes || 0) === 1
      ? '银子送上去过一回'
      : '银子一回都没送';
  let troop = '兵册基本是空的';
  if ((r.troops || 0) >= 50) {
    troop = `兵屯到${r.troops}，留着办县里的剿匪和治安`;
  } else if ((r.troops || 0) > 0) {
    troop = `手头有兵${r.troops}，为的是剿匪或者守街`;
  }
  const wind = !Number.isFinite(r.virtue) ? '' : (r.virtue >= 55 ? '朝风还正' : '朝风已经浑了');
  const flag = r.founded ? '旗子中途换过，人还坐在原位' : `${dynasty}的旗子一直挂到卸任`;
  const leads = rank === '县令'
    ? [
      `${dynasty}这一任，你还是县令，${age}岁，在任${day}天。`,
      `县令做到卸任，在${dynasty}过了${day}天，${age}岁离开。`,
      `${age}岁离开公案，官还是县令，${dynasty}的日子一共${day}天。`,
    ]
    : [
      `${dynasty}这一任，你做到${rank}，${age}岁，在任${day}天。`,
      `从县令坐到${rank}，在${dynasty}过了${day}天，卸任时${age}岁。`,
      `${age}岁离开公案，官做到${rank}，${dynasty}的日子一共${day}天。`,
    ];
  const bits = [bribe, troop, wind, flag].filter(Boolean);
  const tails = [
    `${statLine ? `离开时${statLine}。` : ''}${bits.join('，')}。收场是「${title}」。`,
    `收场落在「${title}」。${bits.slice().reverse().join('，')}。${statLine ? `四项是${statLine}。` : ''}`,
    `${flag}。${bribe}，${troop}。${wind ? `${wind}。` : ''}${statLine ? `日子走到${statLine}。` : ''}最后写成「${title}」。`,
  ];
  return `${leads[s % 3]}${tails[s % 3]}`;
}
