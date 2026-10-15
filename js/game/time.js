/**
 * 任上的钟。一季 36 天，一年四季；一桩事过 6 到 10 天。
 * 每过一季长一岁，升官不加岁。四十六岁问交印。任满四年；登基后再过一年。
 */
export const SEASON_DAYS = 36;
export const YEAR_DAYS = SEASON_DAYS * 4;
export const FULL_TERM_YEARS = 4;
export const FULL_TERM_DAYS = YEAR_DAYS * FULL_TERM_YEARS;
export const OLD_AGE = 46;
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export function seasonOf(day) {
  const index = Math.floor((Math.max(1, day) - 1) / SEASON_DAYS) % SEASONS.length;
  return SEASONS[index];
}

export function yearOf(day) {
  const year = Math.floor((Math.max(1, day) - 1) / YEAR_DAYS) + 1;
  return Math.min(year, FULL_TERM_YEARS + 1);
}

/** 三十岁到任。只按过了几季长岁数，官职本身不加人岁。 */
export function careerAge(run) {
  const day = Math.max(1, run?.day || 1);
  const seasons = Math.floor((day - 1) / SEASON_DAYS);
  return 30 + seasons;
}

/**
 * 升堂年头。兵数把整句撑过屏宽减 32 时，岁数和兵落到第二行。
 * 宽度按一字一号计，和冒烟里的量法一致。
 */
export function reignHeaderLines({ year, season, rank, age, troops, width }) {
  const head = `第${year}年 · ${season} · ${rank} · ${age}岁`;
  const showTroops = troops != null && troops !== '';
  const full = showTroops ? `${head} · 兵 ${troops}` : head;
  const budget = width - 32;
  const wide = (s) => [...String(s)].length * 13 > budget;
  if (!wide(full)) {
    return [full];
  }
  return [
    `第${year}年 · ${season} · ${rank}`,
    showTroops ? `${age}岁 · 兵 ${troops}` : `${age}岁`,
  ];
}

/**
 * 正文纸顶上来时，给年头和通告让位。余韵再高出 echo 像素。
 * 两行年头按较低的那条通告让；一行年头只在有余韵时让，免得平时把牌缩短。
 * 牌矮于 minCard 时不再缩短。
 */
export function clearReignHeader({
  reignY, cardH, textTop, lineCount, minCard = 180, echo = 0,
}) {
  if (lineCount < 2 && echo <= 0) {
    return { cardH, textTop, shift: 0 };
  }
  const noticeBottom = reignY + (lineCount > 1 ? 36 : 20) + 7;
  const paperTop = textTop - 12 - echo;
  const need = noticeBottom + 6 - paperTop;
  if (need <= 0) {
    return { cardH, textTop, shift: 0 };
  }
  const shift = Math.min(need, Math.max(0, cardH - minCard));
  return { cardH: cardH - shift, textTop: textTop + shift, shift };
}

/** 一桩公案不是一天。过上一旬左右。 */
export function passDays(day, rng) {
  return day + 6 + Math.floor(rng() * 5);
}
