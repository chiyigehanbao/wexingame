/**
 * 水墨宣纸色板与字体。
 */
export const COLORS = {
  paper: '#f3ecdc',
  paperDeep: '#e4d8bf',
  card: '#fbf6ea',
  ink: '#2b2622',
  inkSoft: '#5a5149',
  muted: '#8c8170',
  faint: 'rgba(43, 38, 34, 0.12)',
  red: '#b3342b',
  redDeep: '#8e2620',
  jade: '#3f7d5c',
  gold: '#b58a3a',
  wood: '#4a3528',
};

const SERIF = '"Songti SC", STSong, "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif';

export const font = (size, weight = 'normal') => `${weight} ${size}px ${SERIF}`;

export const STAT_META = {
  people: { label: '民心', glyph: '民' },
  money: { label: '钱粮', glyph: '粮' },
  court: { label: '官声', glyph: '官' },
  heart: { label: '良心', glyph: '心' },
};
