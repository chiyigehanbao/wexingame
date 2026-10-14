/**
 * 角色表。seal 为印章头像上的单字；shape 圆印为平民、方印为官府。
 */
export const CHARACTERS = {
  shiye: {
    name: '孙不二', role: '师爷', seal: '孙', shape: 'square', color: '#b3342b',
    bio: '在衙门混了三十年，送走过七任县令。算盘比脑子快。',
  },
  butou: {
    name: '赵大锤', role: '捕头', seal: '赵', shape: 'square', color: '#8a3a2a',
    bio: '力气很大，脑子很直。至今以为「微服私访」是一种早点。',
  },
  wangpo: {
    name: '王婆', role: '媒婆', seal: '王', shape: 'round', color: '#c2552f',
    bio: '全县消息集散地。她知道的比县志多，说的比县志快。',
  },
  qian: {
    name: '钱满仓', role: '乡绅', seal: '钱', shape: 'round', color: '#9c6b1e',
    bio: '县里最有钱的人，也是最想让你知道这一点的人。',
  },
  shusheng: {
    name: '白小舟', role: '书生', seal: '白', shape: 'round', color: '#4a6b8a',
    bio: '考了九次没考上，第十次的盘缠还差一点。',
  },
  zhifu: {
    name: '知府大人', role: '上官', seal: '府', shape: 'square', color: '#6b2a5e',
    bio: '你的顶头上司。爱写诗，爱过寿，爱听「大人英明」。',
  },
  gousheng: {
    name: '狗剩', role: '小乞丐', seal: '剩', shape: 'round', color: '#7a6a55',
    bio: '县城里最消息灵通的人，只要两个铜板。',
  },
  langzhong: {
    name: '胡一针', role: '郎中', seal: '胡', shape: 'round', color: '#3f7d5c',
    bio: '自称妙手回春。病人回不回春不好说，他自己倒挺滋润。',
  },
  heshang: {
    name: '了尘', role: '和尚', seal: '尘', shape: 'round', color: '#a0702a',
    bio: '城外清风寺住持。看破红尘，但没看破香火钱。',
  },
  laohan: {
    name: '张老汉', role: '农户', seal: '张', shape: 'round', color: '#6b7a3a',
    bio: '种了一辈子地，告了一辈子状。和衙门比和亲戚还熟。',
  },
  huxian: {
    name: '青璃', role: '狐仙', seal: '狐', shape: 'round', color: '#3a6e8f',
    bio: '住在西巷老宅的白衣姑娘。五百岁，爱吃烧鸡。',
  },
  qinchai: {
    name: '钦差', role: '朝廷来使', seal: '钦', shape: 'square', color: '#1f3f6b',
    bio: '奉旨巡查。一张脸比圣旨还难懂。',
  },
};

export const CHARACTER_ORDER = Object.keys(CHARACTERS);
