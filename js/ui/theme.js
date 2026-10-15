/**
 * 水墨宣纸色板与字体。
 */
export const COLORS = {
  paper: '#f3ecdc',
  paperDeep: '#e4d8bf',
  card: '#fbf6ea',
  ink: '#2b2622',
  inkSoft: '#5a5149',
  muted: '#5e554c',
  faint: 'rgba(43, 38, 34, 0.12)',
  red: '#b3342b',
  redDeep: '#8e2620',
  jade: '#3f7d5c',
  gold: '#b58a3a',
  wood: '#4a3528',
};

const SONG = '"Songti SC", STSong, "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif';
const HEI = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif';

/** 标题「县太爷 / 今天也很忙」和印章用宋体。 */
export const songFont = (size, weight = 'normal') => `${weight} ${size}px ${SONG}`;

/** 其余界面和正文用黑体，默认加粗，避免细宋体看不清。 */
export const font = (size, weight = 'bold') => `${weight} ${size}px ${HEI}`;

export const STAT_META = {
  people: { label: '民心', glyph: '民' },
  money: { label: '钱粮', glyph: '粮' },
  court: { label: '官声', glyph: '官' },
  heart: { label: '良心', glyph: '心' },
};
