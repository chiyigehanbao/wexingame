/**
 * 卡牌表。left / right 为左滑 / 右滑选项。
 * fx 键：people 民心、money 钱粮、court 官声、heart 良心。
 */
import { EXTRA_CARDS } from './cards-extra.js';
import { WAVE_CARDS } from './cards-wave.js';

const opt = (label, fx = {}, extra = {}) => ({ label, fx, ...extra });
const chain = (id, delay = 3) => ({ chain: { id, delay } });

const CORE_CARDS = [
  // —— 开场 ——
  {
    id: 'intro', who: 'shiye', chainOnly: true,
    text: '大人，您就是新来的县令吧？{handoff}咱们县穷，事多，规矩也多。您先升堂吧。',
    left: opt('先看看账本', { money: 3 }),
    right: opt('升堂！', { people: 3 }),
  },

  // —— 师爷 ——
  {
    id: 'shiye_tax', who: 'shiye',
    text: '老爷，秋税要不要多收两成？就说是……修城墙。',
    left: opt('照旧收', { people: 5, money: -5 }, { path: { clean: 1 } }),
    right: opt('就说修城墙', { people: -12, money: 12, heart: -4 }, { path: { graft: 1 } }),
  },
  {
    id: 'shiye_gift', who: 'shiye', once: true,
    text: '知府大人下月做寿，咱们送点什么？小的觉得送一对金蟾，寓意好。',
    left: opt('送幅字画', { court: -8, heart: 5 }, { path: { clean: 1 } }),
    right: opt('送金蟾', { money: -8, court: 15 }, { path: { graft: 1, scheme: 1 } }),
  },
  {
    id: 'shiye_ledger', who: 'shiye', once: true,
    text: '账房说库里少了三百两……小的发誓不是我。大概不是。',
    left: opt('算了', { money: -10, heart: -3 }, { path: { graft: 1 }, bond: { who: 'shiye', d: 1 } }),
    right: opt('严查到底', { money: 5, people: 5 }, { ...chain('shiye_confess', 4), path: { clean: 1 }, bond: { who: 'shiye', d: -1 } }),
  },
  {
    id: 'shiye_confess', who: 'shiye', chainOnly: true,
    text: '老爷……那三百两，是小的拿去给老娘抓药了。小的这就卷铺盖。',
    left: opt('革职查办', { money: 10, heart: -15, court: 5 }, { path: { clean: 1 }, bond: { who: 'shiye', d: -1 } }),
    right: opt('扣半年俸禄', { heart: 12, money: 5 }, { path: { clean: 1 }, bond: { who: 'shiye', d: 1 } }),
  },
  {
    id: 'shiye_nap', who: 'shiye', paths: ['pleasure'],
    text: '老爷，今日风和日丽，衙门无事。要不要……午休一下？',
    left: opt('批公文', { court: 6, heart: -2 }, { path: { clean: 1 } }),
    right: opt('睡！', { court: -6, heart: 4 }, { path: { pleasure: 2 } }),
  },
  {
    id: 'shiye_opera', who: 'shiye', once: true, weight: 2, paths: ['pleasure'],
    text: '城里来了戏班子。师爷说，状纸可以压一压，先去听两出。',
    left: opt('去听戏', { court: -3, heart: 3, money: -2 }, { path: { pleasure: 2 } }),
    right: opt('压着戏去批', { court: 3 }, { path: { clean: 1 } }),
  },
  {
    id: 'shiye_rumor', who: 'shiye',
    text: '城里都在传，说您长得像前任县令养的那只鹅。要不要贴告示辟谣？',
    left: opt('随他们去', { people: 6, court: -3 }),
    right: opt('贴告示', { money: -5, people: -6, court: 5 }),
  },
  {
    id: 'shiye_bridge', once: true, who: 'shiye',
    text: '东边那座桥塌了一半，修好要五百两。现在大家都是跳着过河。',
    left: opt('搭块木板', { people: -10 }),
    right: opt('拨款修桥', { money: -8, people: 9 }, { world: { bridge: 1 }, path: { clean: 1 } }),
  },
  {
    id: 'shiye_monument', once: true, who: 'shiye',
    text: '老爷，要不要给您自己立块功德碑？别的县令都立，不立显得没功德。',
    left: opt('不立', { heart: 8, court: -5 }),
    right: opt('立个大的', { money: -12, court: 10, heart: -10 }),
  },
  {
    id: 'shiye_lottery', once: true, who: 'shiye',
    text: '老爷，咱们办个彩票吧？一文钱一张，头奖一两。稳赚。',
    left: opt('这叫赌博', { heart: 6, money: -2 }),
    right: opt('办！', { money: 15, people: 5, heart: -12 }),
  },
  {
    id: 'shiye_seal', once: true, who: 'shiye',
    text: '老爷，您的官印呢？明天要盖章，小的找遍了，就差掀房顶了。',
    left: opt('掀房顶找', { money: -6, court: 5 }),
    right: opt('先刻个萝卜章', { court: -10, heart: -4, people: 4 }),
  },
  {
    id: 'shiye_swap', once: true, who: 'shiye',
    text: '邻县想跟咱们换地，拿他们的荒山换咱们的河滩。说是山上有灵气。',
    left: opt('不换', { people: 5, money: -3 }),
    right: opt('换', { money: 12, people: -10 }),
  },

  // —— 捕头 ——
  {
    id: 'butou_thief', who: 'butou',
    text: '老爷！抓到个偷馒头的小贼！打板子还是关大牢？',
    left: opt('赔个馒头放了', { people: 8, money: -3, heart: 6 }),
    right: opt('打二十板', { people: -8, court: 6, heart: -10 }),
  },
  {
    id: 'butou_blades', who: 'butou',
    text: '兄弟们的刀都锈得拔不出来了。上回追贼，小的是用刀鞘把人敲晕的。',
    left: opt('磨磨还能用', { court: -6, people: -3 }),
    right: opt('买新刀', { money: -8, court: 8, people: 6 }),
  },
  {
    id: 'butou_cat', who: 'butou',
    text: '王员外家的猫上树三天了，非要咱衙门去救。说衙门是父母官，猫也是子民。',
    left: opt('衙门不管猫', { people: -6, court: 4 }),
    right: opt('全员出动', { people: 10, court: -3 }),
  },
  {
    id: 'butou_bandit', once: true, who: 'butou',
    text: '城外黑风岭有山贼，劫了三车盐！剿不剿？小的手已经痒了。',
    left: opt('先招安', { money: -6, court: -6, heart: 6 }),
    right: opt('剿！追回赃物', { money: 8, court: 10, people: 4, heart: -4 }),
  },
  {
    id: 'butou_hero', once: true, who: 'butou',
    text: '小的昨晚一个人打跑了五个山贼！能不能……给块牌匾？',
    left: opt('先把牛皮收收', { heart: 4, people: -3 }),
    right: opt('赏！', { money: -6, people: 6, court: 4 }),
  },
  {
    id: 'butou_wrong', once: true, who: 'butou',
    text: '坏了老爷，昨天抓错人了。抓的是……知府大人的小舅子。',
    left: opt('赶紧放人赔罪', { court: 6, heart: -10, money: -5 }),
    right: opt('按律办事', { court: -4, heart: 12, people: 10 }),
  },
  {
    id: 'butou_jail', who: 'butou',
    text: '大牢满了，犯人们晚上睡觉得叠着睡。能不能放几个偷鸡摸狗的？',
    left: opt('再挤挤', { people: -5, heart: -6 }),
    right: opt('放', { people: 6, court: -3 }),
  },
  {
    id: 'butou_duel', once: true, who: 'butou',
    text: '邻县捕头约小的比武，输了要叫他爷爷！小的能去吗？',
    left: opt('不许去', { people: -4, court: 3 }),
    right: opt('去，打赢有赏', { people: 10, money: -6 }),
  },
  {
    id: 'butou_bribe', who: 'butou',
    text: '老爷，有人塞给小的十两银子，让放了他兄弟……小的该咋办？',
    left: opt('交公', { money: 8, heart: 8 }),
    right: opt('你自己看着办', { heart: -10, people: -5, court: -3 }),
  },

  // —— 王婆 ——
  {
    id: 'wangpo_match', who: 'wangpo', once: true,
    text: '县太爷，您还没成亲吧？城南李家姑娘，人好心善，还会做酱肘子！',
    left: opt('本官忙', { people: -5 }),
    right: opt('见见也行', { people: 8, money: -5 }, chain('wangpo_match2', 4)),
  },
  {
    id: 'wangpo_match2', who: 'wangpo', chainOnly: true,
    text: '李家姑娘说了，她只嫁会写诗的。县太爷，您……会写诗吗？',
    left: opt('不会，算了', { people: -5, heart: 3 }),
    right: opt('当场作诗', { people: 9, court: -4, heart: 4 }),
  },
  {
    id: 'wangpo_gossip', who: 'wangpo', once: true,
    text: '我跟您说，钱老爷家的小妾和账房先生……啧啧啧，您猜怎么着？',
    left: opt('别乱嚼舌根', { heart: 5, people: -5 }),
    right: opt('细说', { people: 6, heart: -5 }, chain('qian_hush', 3)),
  },
  {
    id: 'qian_hush', who: 'qian', chainOnly: true,
    text: '听说大人最近听了些闲话？这一百两，就当大人耳朵不太好使。',
    left: opt('本官耳朵灵着', { heart: 10, court: -5 }),
    right: opt('收下', { money: 18, heart: -15 }),
  },
  {
    id: 'wangpo_dance', who: 'wangpo',
    text: '县太爷，我们几个老姐妹想在衙门口跳舞，借块地儿呗？就晚上，就一会儿。',
    left: opt('衙门重地', { people: -10, court: 5 }),
    right: opt('跳吧跳吧', { people: 11, court: -4 }),
  },
  {
    id: 'wangpo_ghost', who: 'wangpo', once: true, requires: { runs: 1 },
    text: '县太爷，西巷老宅闹鬼！半夜有个白衣姑娘在院里啃鸡腿！',
    left: opt('派人看看', { people: 4 }, chain('fox_meet', 2)),
    right: opt('请和尚做法', { money: -6, people: 8 }),
  },
  {
    id: 'wangpo_widow', once: true, who: 'wangpo',
    text: '城北孙寡妇想改嫁，族里不让，两边都快打起来了。县太爷给评评理？',
    left: opt('族规为大', { court: 5, heart: -10 }),
    right: opt('本官准了', { heart: 10, court: -5, people: 5 }),
  },
  {
    id: 'wangpo_secret', once: true, who: 'wangpo',
    text: '县太爷，您知道师爷年轻时候，是唱戏的吗？唱旦角儿的！',
    left: opt('别造谣', { heart: 4, people: -3 }),
    right: opt('唱哪出？', { people: 6, heart: -3 }),
  },

  // —— 钱老爷 ——
  {
    id: 'qian_bribe', who: 'qian', once: true,
    text: '大人，小小心意，不成敬意。（推过来一个沉甸甸的箱子）',
    left: opt('拿走！', { heart: 10, people: 5 }),
    right: opt('笑纳', { money: 20, heart: -15 }, chain('qian_favor', 4)),
  },
  {
    id: 'qian_favor', who: 'qian', chainOnly: true,
    text: '大人，上次那箱……咱们是不是该办点事了？我想把河边那块地圈起来。',
    left: opt('一码归一码', { money: -12, heart: 8 }),
    right: opt('圈吧', { money: 10, people: -20, heart: -5 }),
  },
  {
    id: 'qian_land', who: 'qian',
    text: '那些佃户交不起租，我要收地。大人给盖个章？',
    left: opt('缓一年', { people: 11, court: -3 }),
    right: opt('盖章', { people: -15, money: 10 }),
  },
  {
    id: 'qian_banquet', who: 'qian',
    text: '鄙人做寿，请大人赏光！宴上有烤全羊，还有从京城请来的厨子。',
    left: opt('公务繁忙', { heart: 5, people: 3, court: -3 }),
    right: opt('去吃！', { people: -6, money: 6, heart: -6 }),
  },
  {
    id: 'qian_school', once: true, who: 'qian', paths: ['clean', 'graft'],
    text: '鄙人愿捐一千两修学堂，只求学堂名叫「钱氏书院」。门口再立块我的像。',
    left: opt('学堂不冠名', { heart: 5, money: -3 }, { path: { clean: 1 }, bond: { who: 'qian', d: -1 }, world: { school: 1 } }),
    right: opt('成交', { money: 18, people: 5, heart: -6 }, { path: { graft: 1 }, bond: { who: 'qian', d: 1 }, world: { school: 1 } }),
  },
  {
    id: 'qian_salt', once: true, who: 'qian', paths: ['graft'], county: ['salt', 'poor'],
    text: '大人，全县的盐，不如就交给鄙人一家卖？省心，省事，省得您操心。',
    left: opt('不行', { money: -5, people: 10 }, { path: { clean: 1 } }),
    right: opt('可以', { money: 15, people: -15 }, { path: { graft: 1 }, world: { salt: 1 }, countyAdd: 'salt' }),
  },
  {
    id: 'qian_opera', once: true, who: 'qian',
    text: '鄙人出钱请戏班子唱三天大戏，就说是为了庆贺大人上任。大人只要露个脸。',
    left: opt('省省吧', { people: -5, heart: 4 }),
    right: opt('唱！', { people: 11, court: -3, heart: -3 }),
  },

  // —— 书生 / 科举案 ——
  {
    id: 'sheng_trip', who: 'shusheng', once: true,
    text: '大人，学生要赴京赶考，盘缠还差十两……学生考中了一定加倍奉还！',
    left: opt('自己想办法', { heart: -6 }),
    right: opt('资助十两', { money: -6, heart: 10, people: 5 }, chain('exam_1', 8)),
  },
  {
    id: 'exam_1', who: 'shusheng', chainOnly: true,
    text: '大人！学生落榜了……但学生发现，主考官把考题卖给了钱老爷的儿子！',
    left: opt('别惹事', { heart: -10, court: 5 }),
    right: opt('替你写状子', { court: -10, heart: 10 }, chain('exam_2', 3)),
  },
  {
    id: 'exam_2', who: 'zhifu', chainOnly: true,
    text: '听说你在查科举的事？年轻人，这水很深，适可而止吧。',
    left: opt('适可而止', { court: 10, heart: -15 }),
    right: opt('查到底', { court: -18, heart: 10 }, chain('exam_3', 3)),
  },
  {
    id: 'exam_3', who: 'qian', chainOnly: true,
    text: '大人，犬子的事……五千两，够不够您告老还乡？',
    left: opt('留着当证据', { heart: 12 }, chain('exam_4', 2)),
    right: opt('成交', { money: 35, heart: -30 }),
  },
  {
    id: 'exam_4', who: 'shiye', chainOnly: true,
    text: '老爷，证据齐了。是递给知府，还是……直接上京告御状？',
    left: opt('递给知府', { court: 10, heart: -5 }),
    right: opt('告御状！', {}, { ending: 'exam_hero' }),
  },
  {
    id: 'sheng_poem', once: true, who: 'shusheng',
    text: '学生写了首诗歌颂大人，一共八十八句，可否贴在城门上？',
    left: opt('太肉麻了', { heart: 5, court: -2 }),
    right: opt('贴！大字贴！', { court: 6, people: -6, heart: -5 }),
  },
  {
    id: 'sheng_school', once: true, who: 'shusheng', paths: ['clean'],
    text: '县里好多孩子没书念。学生愿意教，能不能开个义学？',
    left: opt('没钱', { people: -10, money: 3 }),
    right: opt('开！', { money: -7, people: 9, heart: 5 }, { path: { clean: 1 }, bond: { who: 'shusheng', d: 1 }, world: { school: 1 } }),
  },
  {
    id: 'sheng_love', who: 'shusheng', once: true,
    text: '学生……爱上了钱老爷的女儿。可钱老爷嫌学生穷，大人能帮学生说句话吗？',
    left: opt('先考功名', { heart: 3, people: -3 }),
    right: opt('本官去说媒', { people: 8, heart: 5 }, chain('qian_angry', 3)),
  },
  {
    id: 'qian_angry', who: 'qian', chainOnly: true,
    text: '大人！您给我女儿说的什么穷酸书生！这门亲事，鄙人死也不……不同意！',
    left: opt('真心难得', { heart: 10, money: -10 }),
    right: opt('那就算了', { heart: -10, money: 5 }),
  },

  // —— 知府 ——
  {
    id: 'zhifu_quota', who: 'zhifu',
    text: '今年各县都要多交五百石粮，你县也不例外。',
    left: opt('实在交不出', { court: -4, people: 5 }),
    right: opt('交', { money: -11, court: 10, people: -5 }),
  },
  {
    id: 'zhifu_visit', once: true, who: 'zhifu',
    text: '本府下月要来巡视。路要铺平，墙要刷白，百姓要笑。',
    left: opt('保持原样', { court: -4, heart: 5 }),
    right: opt('连夜翻新', { money: -12, court: 14, people: -5 }),
  },
  {
    id: 'zhifu_nephew', once: true, who: 'zhifu',
    text: '本府有个侄子，人很老实，就是有点笨。想在你县谋个差事。',
    left: opt('没有空缺', { court: -4, heart: 5 }),
    right: opt('让他当主簿', { court: 10, people: -5, heart: -5 }),
  },
  {
    id: 'zhifu_report', who: 'zhifu',
    text: '你县今年治安如何？写个折子来，本府要往上报。',
    left: opt('如实写', { court: -6, heart: 10 }),
    right: opt('写成太平盛世', { court: 10, heart: -10 }),
  },
  {
    id: 'zhifu_horse', once: true, who: 'zhifu',
    text: '本府的马跑丢了，据说跑进了你县。三日之内，给我找回来。',
    left: opt('全县搜马', { court: 10, people: -10 }),
    right: opt('送他一匹新的', { money: -11, court: 6 }),
  },
  {
    id: 'zhifu_poem', once: true, who: 'zhifu',
    text: '本府新作一首：「春风吹啊吹，吹到我的腿。」你点评点评？',
    left: opt('实话实说', { court: -6, heart: 10 }),
    right: opt('千古绝唱！', { court: 10, heart: -10 }),
  },
  {
    id: 'zhifu_promote', who: 'zhifu', requires: { stat: { court: [72, 100] } },
    text: '本府要升了，想带一个得力的人去京城。你……想不想去？',
    left: opt('留在县里', { people: 10, court: -4 }),
    right: opt('想去！', { court: 14, people: -10 }),
  },
  {
    id: 'zhifu_warn', who: 'zhifu', requires: { stat: { court: [0, 28] } },
    text: '最近参你的折子，本府桌上已经摞了这么高了。你自己掂量掂量。',
    left: opt('请大人吃饭', { money: -9, court: 14 }),
    right: opt('身正不怕影斜', { heart: 6, court: -5 }),
  },
  {
    id: 'zhifu_review', who: 'zhifu', review: true,
    text: '年终考核到了。说说吧，你这段日子都有什么政绩？',
    left: opt('说实话', { court: -6, heart: 10 }),
    right: opt('把邻县的也算上', { court: 14, heart: -10 }),
  },
  {
    id: 'zhifu_review2', who: 'zhifu', review: true,
    text: '考核嘛，本府看你县……还行吧。今年的「心意」呢？',
    left: opt('没有心意', { court: -6, heart: 6 }),
    right: opt('早备好了', { money: -11, court: 10 }),
  },

  // —— 狗剩 ——
  {
    id: 'gou_secret', once: true, who: 'gousheng',
    text: '大人，给俩铜板，我告诉你一个秘密。保证值！',
    left: opt('去去去', { people: -4 }),
    right: opt('给', { money: -2, heart: 4 }, { flags: { gou_friend: true } }),
  },
  {
    id: 'gou_snow', who: 'gousheng', requires: { season: 'winter' },
    text: '大人，下雪了。城隍庙里的人冻得直哆嗦，我把破棉袄都借出去了。',
    left: opt('各安天命', { heart: -10, people: -4 }),
    right: opt('开粥棚', { money: -6, people: 10, heart: 4 }),
  },
  {
    id: 'gou_spy', who: 'gousheng', once: true, requires: { flags: ['gou_friend'] },
    text: '大人！我看见师爷半夜偷偷摸摸往钱老爷家去了！',
    left: opt('小孩别乱说', { people: -4 }),
    right: opt('盯着他', { court: 4 }, chain('shiye_caught', 2)),
  },
  {
    id: 'shiye_caught', who: 'shiye', chainOnly: true,
    text: '老爷……小的去钱老爷家，是去讨他三年前欠的药钱。他欠了小的二两。',
    left: opt('误会一场', { heart: 6, people: 3 }),
    right: opt('那也得罚', { money: 4, heart: -6 }),
  },
  {
    id: 'gou_dream', once: true, who: 'gousheng',
    text: '大人，我长大了也想当县令！当县令是不是天天都能吃肉？',
    left: opt('好好读书', { heart: 5, people: 4, money: -3 }),
    right: opt('别当，太累', { heart: 4, court: -4 }),
  },
  {
    id: 'gou_gang', once: true, who: 'gousheng',
    text: '大人，城里的乞丐想成立丐帮，选我当帮主！您批不批？',
    left: opt('不许结帮', { court: 5, people: -6 }),
    right: opt('准了', { people: 10, court: -4 }),
  },
  {
    id: 'gou_cheer', who: 'gousheng', requires: { stat: { people: [0, 28] } },
    text: '大人，街上人都在骂你。我替你挨了好几句骂，给俩铜板呗？',
    left: opt('骂得对', { heart: 8, people: 6 }),
    right: opt('给你十个', { money: -5, people: 4 }),
  },

  // —— 郎中 ——
  {
    id: 'hu_sick', who: 'langzhong',
    text: '城西好多人拉肚子！得拨银子买药，再晚就要排队上茅房了！',
    left: opt('多喝热水', { people: -14, money: 3 }),
    right: opt('拨款', { money: -7, people: 11 }),
  },
  {
    id: 'hu_pill', who: 'langzhong', once: true,
    text: '大人，在下新炼了一颗长生不老丹，您试试？',
    left: opt('你先吃', { heart: 4, people: 3 }),
    right: opt('吃了', { court: -3, people: 5 }, chain('hu_pill2', 1)),
  },
  {
    id: 'hu_pill2', who: 'langzhong', chainOnly: true,
    text: '大人……那颗丹，在下好像拿错了。拿成了泻药。您还好吗？',
    left: opt('罚他三个月', { people: -4, heart: -4, money: 4 }),
    right: opt('……算了', { heart: 6, court: -4 }),
  },
  {
    id: 'hu_rival', once: true, who: 'langzhong',
    text: '城里来了个游医，说能治百病，生意都被他抢光了！大人把他赶走吧！',
    left: opt('各凭本事', { people: 6, court: -3 }),
    right: opt('赶走他', { people: -6, court: 4, heart: -4 }),
  },
  {
    id: 'hu_plague', who: 'langzhong', requires: { minDay: 25 },
    text: '大人，城南闹时疫了。得封坊，可百姓不干，说封了没饭吃。',
    left: opt('不封', { people: 8, court: -4 }),
    right: opt('封，官府送饭', { money: -10, people: 6, court: 10 }),
  },

  // —— 和尚 ——
  {
    id: 'chen_roof', once: true, who: 'heshang',
    text: '大人，寺里屋顶漏了，佛祖已经淋了三天雨。',
    left: opt('佛祖自有神通', { people: -5, heart: -4 }),
    right: opt('捐香火钱', { money: -6, people: 8, heart: 5 }),
  },
  {
    id: 'chen_omen', once: true, who: 'heshang',
    text: '大人，贫僧观你印堂发黑，近日必有破财之灾。',
    left: opt('出去', { people: -3, heart: 2 }),
    right: opt('怎么破？', { money: -10, heart: 6 }),
  },
  {
    id: 'chen_veggie', who: 'heshang',
    text: '大人，不如全县吃素三日，积积福？',
    left: opt('百姓要吃肉', { people: 10, heart: -5 }),
    right: opt('全县吃素', { people: -14, heart: 10 }),
  },
  {
    id: 'chen_gold', once: true, who: 'heshang',
    text: '大人，有人在寺后挖出一尊金佛！这……该归谁？',
    left: opt('归寺庙', { people: 5, heart: 6 }),
    right: opt('充公', { money: 18, people: -10 }),
  },
  {
    id: 'chen_debate', once: true, who: 'heshang',
    text: '隔壁道观的道士说佛不如道，非要跟贫僧当街辩法。大人来评评理！',
    left: opt('各凭本事', { people: -3, heart: 3 }),
    right: opt('比赛求雨', { people: 8, money: -8 }),
  },
  {
    id: 'chen_zen', who: 'heshang', requires: { stat: { heart: [72, 100] } },
    text: '施主，你心中太干净了。贫僧想问一句：可愿随我参禅？',
    left: opt('红尘未了', { heart: -6, people: 4 }),
    right: opt('改天聊聊', { heart: 10 }),
  },
  {
    id: 'chen_nightmare', who: 'heshang', requires: { stat: { heart: [0, 28] } },
    text: '施主，你最近夜里是不是总做噩梦？梦里是不是还有人数你的账？',
    left: opt('没有的事', { heart: -5 }),
    right: opt('大师救我', { money: -10, heart: 14 }),
  },

  // —— 张老汉 / 水患 ——
  {
    id: 'zhang_drought', who: 'laohan', requires: { season: 'summer' },
    text: '大人，三个月没下雨了，地裂得能塞进一只脚！',
    left: opt('让百姓自救', { people: -12, money: 2 }),
    right: opt('开仓放粮', { money: -8, people: 11 }),
  },
  {
    id: 'zhang_ox', once: true, who: 'laohan',
    text: '大人，我家牛被老李家的牛顶伤了！您给做主！',
    left: opt('让老李赔钱', { people: 6, heart: -2 }),
    right: opt('牛的事牛管', { people: -10, court: 3 }),
  },
  {
    id: 'zhang_tax', who: 'laohan',
    text: '大人，今年收成不好，能不能少交点税？就少一点点。',
    left: opt('国法如山', { money: 10, people: -10 }),
    right: opt('减三成', { money: -6, people: 11, court: -5 }),
  },
  {
    id: 'zhang_eggs', once: true, who: 'laohan',
    text: '大人，这筐鸡蛋您收下，自家鸡下的，可新鲜了。',
    left: opt('心意领了', { people: -2, heart: 5, money: 2 }),
    right: opt('回他一筐米', { money: -6, people: 8 }),
  },
  {
    id: 'zhang_road', once: true, who: 'laohan',
    text: '去集上的路太烂了，一下雨，我家驴都不肯出门。',
    left: opt('让驴忍忍', { people: -10 }),
    right: opt('修路', { money: -7, people: 10, court: 4 }),
  },
  {
    id: 'zhang_wolf', once: true, who: 'laohan',
    text: '后山有狼！叼走了我家两只鸡，还把第三只吓得不下蛋了！',
    left: opt('鸡没就没了', { people: -10 }),
    right: opt('派人打狼', { money: -5, people: 10 }),
  },
  {
    id: 'zhang_seal', once: true, who: 'laohan',
    text: '大人，我孙子抓周，抓的是您落在我家的官印……您看这……',
    left: opt('把印拿回来', { court: 5, people: -3 }),
    right: opt('让他玩会儿', { people: 10, court: -4 }),
  },
  {
    id: 'zhang_lantern', who: 'laohan', requires: { season: 'autumn' },
    text: '大人，中秋了，县里办不办灯会？大伙都盼着呢。',
    left: opt('不办', { money: 5, people: -10 }),
    right: opt('办！', { money: -7, people: 11 }),
  },
  {
    id: 'flood_1', who: 'laohan', once: true, requires: { minDay: 40, season: 'summer' },
    text: '大人！河水涨得厉害，堤坝怕是撑不住了！',
    left: opt('再看看', { people: -6 }, chain('flood_bad', 2)),
    right: opt('连夜加固', { money: -15, people: 8 }, chain('flood_good', 2)),
  },
  {
    id: 'flood_bad', who: 'laohan', chainOnly: true,
    text: '大人！堤坝塌了，城东全淹了，百姓都爬到屋顶上去了！',
    left: opt('组织救人', { money: -15, people: 10, heart: 5 }, chain('flood_end', 3)),
    right: opt('先保县衙', { people: -25, court: -5, heart: -10 }),
  },
  {
    id: 'flood_good', who: 'shiye', chainOnly: true,
    text: '老爷，大水来了，堤坝稳稳当当！百姓都说您是神仙下凡。',
    left: opt('是百姓出的力', { people: 11, heart: 6 }, chain('flood_end', 3)),
    right: opt('上报请功', { court: 15, heart: -5 }),
  },
  {
    id: 'flood_end', who: 'laohan', chainOnly: true,
    text: '大人，水退了。大伙商量着，想给您送一把万民伞。',
    left: opt('伞不收，堤再修', {}, { ending: 'flood_saint' }),
    right: opt('收下', { people: 8, court: 6 }),
  },

  // —— 狐仙 ——
  {
    id: 'fox_meet', who: 'huxian', chainOnly: true,
    text: '（老宅里，白衣姑娘抱着鸡腿）大人，我不是鬼，我是狐狸。能不能别赶我走？',
    left: opt('妖孽速退', { people: 5, heart: -10 }),
    right: opt('住着吧', { heart: 10 }, chain('fox_2', 5)),
  },
  {
    id: 'fox_2', who: 'huxian', chainOnly: true,
    text: '大人，县里闹蝗虫了。我会点小法术能帮忙，代价嘛……请我吃一百只烧鸡。',
    left: opt('不用了', { people: -8 }),
    right: opt('一百只就一百只', { money: -12, people: 12 }, chain('fox_3', 5)),
  },
  {
    id: 'fox_3', who: 'wangpo', chainOnly: true,
    text: '县太爷！城里都在传您金屋藏娇，藏的还是只狐狸精！',
    left: opt('清者自清', { court: -10, heart: 5 }, chain('fox_4', 4)),
    right: opt('那是我表妹', { court: 5, heart: -5 }, chain('fox_4', 4)),
  },
  {
    id: 'fox_4', who: 'huxian', chainOnly: true,
    text: '大人，我修满五百年，要回青丘了。你……要不要跟我一起走？',
    left: opt('我还有百姓', { people: 10, heart: 8 }),
    right: opt('走！', { heart: 2 }, { ...chain('fox_bow', 3) }),
  },
  {
    id: 'fox_bow', who: 'huxian', chainOnly: true,
    text: '青丘的路还开着。真走，这一任就到头了。留下，她也会自己去。',
    left: opt('真走', {}, { ending: 'fox_away' }),
    right: opt('还是留下', { people: 6, heart: 4 }),
  },

  // —— 进项 ——
  {
    id: 'shiye_stalls', who: 'shiye',
    text: '老爷，城里商铺越开越多，要不要收点摊位费？一天一文，积少成多。',
    left: opt('不收', { people: 5, money: -3 }),
    right: opt('收', { money: 14, people: -8 }),
  },
  {
    id: 'shiye_fine', who: 'shiye',
    text: '老爷，钱老爷家的马车把城门撞了个窟窿。罚不罚？他可跟知府吃过饭。',
    left: opt('算了', { people: -8, court: 3 }),
    right: opt('罚一百两', { money: 14, people: 6, court: -8 }),
  },
  {
    id: 'butou_bounty', who: 'butou',
    text: '老爷，抓到的江洋大盗有悬赏，足足三百两！归衙门还是分给弟兄们？',
    left: opt('分给弟兄', { people: 6, heart: 4, money: -2 }),
    right: opt('归衙门', { money: 16, people: -6 }),
  },
  {
    id: 'zhang_harvest', who: 'laohan',
    text: '大人，今年风调雨顺，大丰收！大伙想多交点粮，谢谢您。',
    left: opt('照常收', { people: 8, heart: 2 }),
    right: opt('收下', { money: 15, people: -3 }),
  },
  {
    id: 'chen_fair', who: 'heshang',
    text: '大人，寺里要办庙会，香火钱可以分衙门三成。阿弥陀佛，这是功德。',
    left: opt('不要寺里的钱', { heart: 6, money: -2 }),
    right: opt('分！', { money: 14, heart: -6, people: -3 }),
  },
  {
    id: 'qian_loan', who: 'qian', requires: { stat: { money: [0, 40] } },
    text: '大人，听说县库有点紧？鄙人可以借，利息嘛……好商量。',
    left: opt('不借', { heart: 4, money: -2 }),
    right: opt('借', { money: 18, court: -4, heart: -6 }),
  },
  {
    id: 'zhifu_relief', who: 'zhifu', requires: { stat: { money: [0, 30] } },
    text: '听说你县穷得叮当响？本府可以拨点银子。不过，你得写篇文章歌颂本府。',
    left: opt('不写', { heart: 5, court: -5 }),
    right: opt('写', { money: 16, heart: -8, court: 5 }),
  },

  // —— 民心过高的预警 ——
  {
    id: 'wangpo_shrine', who: 'wangpo', requires: { stat: { people: [72, 100] } },
    text: '县太爷！百姓想给您立生祠，石料都运到城门口了！',
    left: opt('拆了！', { people: -10, heart: 4 }),
    right: opt('立吧立吧', { people: 6, court: -3 }),
  },
  {
    id: 'zhifu_jealous', who: 'zhifu', requires: { stat: { people: [72, 100] } },
    text: '听说你县百姓只认县令，不认朝廷？本府很是担心啊。',
    left: opt('百姓认朝廷', { people: -10, court: 8 }),
    right: opt('问心无愧', { court: -8, heart: 4 }),
  },

  // —— 四季 ——
  {
    id: 'spring_seed', who: 'laohan', requires: { season: 'spring' },
    text: '大人，春耕了，种子不够。再不出苗，秋天就没得收。',
    left: opt('各家自备', { people: -8, money: 2 }),
    right: opt('官仓借种', { money: -6, people: 10, heart: 4 }),
  },
  {
    id: 'spring_tomb', who: 'shiye', requires: { season: 'spring' },
    text: '清明了，城隍庙要祭。往年都是衙门出钱，百姓跟着磕头。',
    left: opt('今年省了', { money: 4, people: -8, heart: -4 }),
    right: opt('照例办', { money: -8, people: 8 }),
  },
  {
    id: 'summer_heat', who: 'langzhong', requires: { season: 'summer' },
    text: '热得地皮烫脚！城里中暑的人，排到了药铺门口。',
    left: opt('多喝井水', { people: -10, heart: -4 }),
    right: opt('设凉茶棚', { money: -5, people: 10 }),
  },
  {
    id: 'summer_river', who: 'butou', requires: { season: 'summer' },
    text: '老爷，河边全是乘凉的，有人把税吏推下水了！',
    left: opt('算他活该', { people: 6, court: -4 }),
    right: opt('抓人', { people: -8, court: 6 }),
  },
  {
    id: 'autumn_feast', who: 'wangpo', requires: { season: 'autumn' },
    text: '收成下来了，村里办酒席。县太爷来不来？来了就得出份子。',
    left: opt('不凑热闹', { people: -6, money: 2 }),
    right: opt('去，出份子', { money: -5, people: 10 }),
  },
  {
    id: 'autumn_tax', who: 'shiye', requires: { season: 'autumn' },
    text: '秋粮入库。小的建议多报两成损耗，剩下的……您懂的。',
    left: opt('如实入库', { heart: 8, money: -4, court: -3 }),
    right: opt('损耗就损耗', { money: 12, heart: -10 }),
  },
  {
    id: 'winter_coal', who: 'gousheng', requires: { season: 'winter' },
    text: '大人，炭价涨了三倍。城隍庙里的人，烤的是书。',
    left: opt('书也能烧', { heart: -10, people: -6 }),
    right: opt('平价放炭', { money: -8, people: 10, heart: 4 }),
  },
  {
    id: 'winter_bonus', who: 'shiye', requires: { season: 'winter' },
    text: '年关了。衙役们眼巴巴看着您，往年这时候都有过年钱。',
    left: opt('今年没有', { court: -4, people: -6, money: 4 }),
    right: opt('发', { money: -10, court: 6, people: 4 }),
  },

  {
    id: 'shiye_quota', who: 'shiye', weight: 3,
    text: '本季税册到了。照册收就有进项，加收一成仓里更多，村里会骂。',
    left: opt('照册收', { money: 14, court: 2 }),
    right: opt('加收一成', { money: 20, people: -8, heart: -4 }),
  },
  {
    id: 'wangpo_market', who: 'wangpo', weight: 3,
    text: '集上人多，牙税该入账了。按老规矩收，摊贩不喊贵。',
    left: opt('牙税入账', { money: 12, court: 2, people: 2 }),
    right: opt('再加一笔', { money: 18, people: -6, heart: -3 }),
  },
  {
    id: 'butou_taxback', who: 'butou', weight: 3,
    text: '捕头押回几个欠税的。银子是税，入了库就是县里的。',
    left: opt('税银入库', { money: 12, court: 3, heart: 2 }),
    right: opt('多罚一点', { money: 18, people: -6, heart: -4 }),
  },
  {
    id: 'laohan_surplus', who: 'laohan', weight: 3,
    text: '田里比去年多了一成。余粮可以入仓，也可以全部征走。',
    left: opt('余粮入仓', { money: 14, people: 2 }),
    right: opt('全部征走', { money: 20, people: -10, heart: -4 }),
  },
  {
    id: 'people_donate', who: 'wangpo', weight: 2, requires: { stat: { people: [60, 100] } },
    text: '乡里凑了一笔粮。他们说这些日子过得去，愿意往仓里送一截。',
    left: opt('入库', { money: 12, people: 2 }),
    right: opt('谢过留下', { money: 6, people: 4, heart: 3 }),
  },

  {
    id: 'ancha_case', once: true, who: 'zhifu', weight: 2, requires: { minRank: 3 },
    text: '邻府的命案推到你这里。接了，是你的；退回去，他们会记一笔。',
    left: opt('接过来', { court: 6, heart: -4, money: -8 }),
    right: opt('退回去', { court: -6, people: 3 }),
  },
  {
    id: 'xunfu_tax', once: true, who: 'qinchai', weight: 3, requires: { minRank: 4 },
    text: '你现在管着一路。下头几个县的秋税册子送上来了，有一县明显短了一截。',
    left: opt('让他们补', { court: 5, people: -6 }),
    right: opt('这一县免了', { money: -10, people: 6, heart: 3 }),
  },
  {
    id: 'shangshu_grain', once: true, who: 'qinchai', weight: 4, requires: { minRank: 5 },
    text: '人在京里点你的名。不是升官，是要粮。尚书的仓，得比县令的仓厚。',
    left: opt('解送进京', { money: -16, court: 8 }),
    right: opt('县里也要吃饭', { court: -8, people: 6, heart: 4 }),
  },
  {
    id: 'xunfu_road', once: true, who: 'qinchai', weight: 3, requires: { minRank: 4 },
    text: '一路的驿站被征去运军粮。你这县正在路上，车和粮都得点。',
    left: opt('出车出粮', { money: -8, court: 4 }),
    right: opt('只让路', { people: 2, court: -4 }),
  },
  {
    id: 'shangshu_camp', once: true, who: 'qinchai', weight: 4, requires: { minRank: 5 },
    text: '京营缺粮，点名要你的仓。三日内起运，迟了就是你的事。',
    left: opt('三日内起运', { money: -14, court: 6 }),
    right: opt('回说路断', { court: -6, heart: 3, people: 4 }),
  },
  {
    id: 'half_grain', who: 'zhifu', once: true, weight: 3, requires: { flags: ['news_half'] },
    text: '朝报说北境丢了半壁。京里接着问：你这县还能再解一趟粮吗？',
    left: opt('再解一趟', { money: -10, court: 5 }),
    right: opt('县里先留着', { people: 5, heart: 3, court: -4 }),
  },
  {
    id: 'invade_scout', who: 'butou', once: true, weight: 3, requires: { flags: ['news_invade'] },
    text: '别国的人在邻县问粮价，问完就走。捕头说，这是在探路。',
    left: opt('把粮藏一藏', { money: -4, court: 3, heart: 2 }),
    right: opt('照常开市', { people: 3, court: -3 }),
  },
  {
    id: 'gain_feast', who: 'shiye', once: true, weight: 3, requires: { flags: ['news_gain'] },
    text: '大军收回了城。户部的条子跟着到：劳军的粮，各县凑一笔。',
    left: opt('凑一笔', { money: -8, court: 5 }),
    right: opt('这个县不凑', { heart: 2, court: -4 }),
  },
  {
    id: 'bride_gift', who: 'shiye', once: true, weight: 3, requires: { flags: ['news_bride'] },
    text: '皇上新纳了妃，贺单送到县里。礼不重，每个县都有一份。',
    left: opt('备一份薄礼', { money: -6, court: 5 }),
    right: opt('这个县不凑', { heart: 3, court: -4 }),
  },
  {
    id: 'unrest_refugees', who: 'wangpo', weight: 2, requires: { minRank: 1, guoshi: [0, 46] },
    text: '国势下去了，邻县的人往你这儿涌。收进来要粮，拦住要挨骂。',
    left: opt('收进县里', { money: -8, people: 6, heart: 3 }),
    right: opt('拦住', { people: -6, court: 4 }),
  },
  {
    id: 'unrest_bandits', who: 'butou', weight: 2, requires: { minRank: 1, guoshi: [0, 46] },
    text: '山里的人下山了。出兵能压一压，关城门就当没看见。',
    left: opt('出兵', { money: -6, court: 3, people: 3 }, { courtShift: { guoshi: 4 } }),
    right: opt('关城门', { people: -4, heart: -2, court: 2 }),
  },
  {
    id: 'favor_tribute', who: 'zhifu', weight: 2, requires: { minRank: 2, guoshi: [70, 100] },
    text: '京里说你这县太平，岁贡照旧之外，再加一成。',
    left: opt('加上', { money: -12, court: 6 }),
    right: opt('回说没有', { court: -6, heart: 3 }, { courtShift: { guoshi: -6 } }),
  },
  {
    id: 'favor_banner', who: 'zhifu', weight: 2, requires: { minRank: 2, guoshi: [70, 100] },
    text: '朝廷送一块匾来。匾是好的，接风的酒席得你出。',
    left: opt('办席接匾', { money: -8, court: 8, people: 3 }),
    right: opt('席免了', { court: 2, heart: 2 }),
  },
  {
    id: 'newflag_seal', once: true, who: 'shiye', weight: 3, requires: { flags: ['founded'] },
    text: '国号换了，县印还是旧的。师爷问：税册先按哪本？',
    left: opt('先按旧册', { money: 6, court: -3 }),
    right: opt('换新册', { money: -4, court: 4, heart: 2 }),
  },
  {
    id: 'newflag_shrine', once: true, who: 'wangpo', weight: 3, requires: { flags: ['founded'] },
    text: '城门口还有人给旧旗上香。摘下来清静，留下他们心里安。',
    left: opt('让他们供', { people: 4, heart: 3, court: -4 }),
    right: opt('摘下来', { court: 4, people: -5 }),
  },
  {
    id: 'shiye_lamp', once: true, who: 'shiye', weight: 2,
    text: '师爷把灯芯拨亮，说今晚的状纸不看完，明天堂上要乱。',
    left: opt('今晚看完', { heart: -3, court: 4 }),
    right: opt('明天再说', { people: -3, heart: 2 }),
  },
  {
    id: 'wangpo_well', once: true, who: 'wangpo', weight: 2,
    text: '巷口的井绳断了。官家换一根，还是让各家自己凑？',
    left: opt('官家换', { money: -5, people: 5 }),
    right: opt('各家出', { people: 2, heart: 1 }),
  },
  {
    id: 'langzhong_night', who: 'langzhong', weight: 2, requires: { stat: { heart: [1, 32] } },
    text: '郎中说你夜里不睡，眼都青了。案子还堆着，人先垮也不行。',
    left: opt('早些歇', { heart: 8, court: -2 }),
    right: opt('案子没完', { heart: -4, court: 3 }),
  },
  {
    id: 'heshang_bell', once: true, who: 'heshang', weight: 2,
    text: '庙里的钟裂了一道。和尚说，不铸上，这个月的雨不好说。',
    left: opt('出钱铸', { money: -6, people: 4, heart: 2 }),
    right: opt('先敲着', { heart: -2, people: -2 }),
  },
  {
    id: 'shiye_granary', who: 'shiye', once: true,
    text: '师爷说，与其年年借粮，不如修一座义仓。修完，荒年就有着落。',
    left: opt('修义仓', { money: -10, people: 6, heart: 3 }, { world: { granary: 1 }, path: { clean: 1 } }),
    right: opt('先不修', { money: 2, people: -3 }),
  },
  {
    id: 'shiye_gate', who: 'shiye', once: true,
    text: '城门楼子裂了缝。不修，哪天塌下来，砸的是进城的人。',
    left: opt('修城门', { money: -8, people: 4, court: 2 }),
    right: opt('先支着', { people: -4, heart: -2 }),
  },
  {
    id: 'shiye_ferry', who: 'shiye', once: true,
    text: '渡口的船烂了。官家造一条，还是让船户自己凑？',
    left: opt('官家造', { money: -7, people: 5 }),
    right: opt('船户凑', { people: -3, money: 2 }),
  },
  {
    id: 'laohan_mulberry', who: 'laohan', once: true,
    text: '老汉想在河滩种桑。桑成了能养蚕，可河滩向来是放牛的。',
    left: opt('准他种', { people: 4, money: 3, heart: 2 }),
    right: opt('留给牛', { people: 2, heart: 1 }),
  },
  {
    id: 'laohan_ditch', who: 'laohan', once: true,
    text: '村里要开一条渠，旱天能浇地。渠从钱家的田边过。',
    left: opt('开渠', { money: -6, people: 7 }),
    right: opt('绕开钱家', { people: -4, court: -2 }),
  },
  {
    id: 'laohan_pact', who: 'laohan', once: true,
    text: '几个村要立乡约：偷瓜的罚，欺老的罚。他们请你到场画押。',
    left: opt('去画押', { people: 5, court: 3, heart: 2 }),
    right: opt('衙门不管这个', { people: -3, heart: -2 }),
  },
  {
    id: 'langzhong_shop', who: 'langzhong', once: true,
    text: '郎中想开一家官药铺。平价卖药，亏的那截问你补不补。',
    left: opt('补这一截', { money: -6, people: 5, heart: 3 }),
    right: opt('让他自己卖', { people: -2, heart: -1 }),
  },
  {
    id: 'wangpo_foundling', who: 'wangpo', once: true,
    text: '城门口又捡到孩子。王婆说，再不办个育婴的地方，冬天还要捡。',
    left: opt('办起来', { money: -8, people: 6, heart: 4 }),
    right: opt('先寄养', { people: 2, heart: 1, money: -2 }),
  },
  {
    id: 'heshang_grave', who: 'heshang', once: true,
    text: '乱葬岗该收一收了。和尚愿意管义冢，香火得你出一笔。',
    left: opt('出这笔', { money: -5, people: 4, heart: 3 }),
    right: opt('先这样', { heart: -2, people: -2 }),
  },
  {
    id: 'heshang_fire', who: 'heshang', once: true,
    text: '火神庙的屋顶见了天。不补，城里的人连烧香的地方都没有。',
    left: opt('补屋顶', { money: -6, people: 3 }),
    right: opt('露着吧', { people: -3, heart: -2 }),
  },
  {
    id: 'butou_barracks', who: 'butou', once: true,
    text: '捕快们挤在一间漏雨的屋里。捕头问：营房还修不修？',
    left: opt('修营房', { money: -7, court: 3 }),
    right: opt('先挤着', { court: -2, heart: -1 }),
  },
  {
    id: 'butou_watch', who: 'butou', once: true,
    text: '夜里没人打更，贼摸到县衙门口。捕头想雇两个更夫。',
    left: opt('雇更夫', { money: -4, people: 4, court: 2 }),
    right: opt('自己轮值', { heart: -2, court: 1 }),
  },
  {
    id: 'shusheng_gazette', who: 'shusheng', once: true,
    text: '书生说县志断了四十年。他愿意写，纸墨和走村的盘缠得你出。',
    left: opt('让他写', { money: -5, court: 4, heart: 2 }),
    right: opt('先不写', { heart: -1 }),
  },
  {
    id: 'qian_arch', who: 'qian', once: true,
    text: '钱老爷要在十字街立一座牌坊，石料他出，字得你来题。',
    left: opt('不题', { heart: 3, court: -2 }),
    right: opt('题了', { court: 4, people: -3, heart: -3 }),
  },
  {
    id: 'zhifu_relay', who: 'zhifu', once: true, requires: { minRank: 2 },
    text: '知府要在你县设一处驿站。马和草料常年都算在你账上。',
    left: opt('设驿站', { money: -8, court: 6 }),
    right: opt('回说没马', { court: -5, heart: 2 }),
  },
  {
    id: 'qinchai_canal', who: 'qinchai', once: true, weight: 2, requires: { minRank: 3 },
    text: '漕粮要改道，从你这县过。改一天，沿岸的田就得让一让。',
    left: opt('让道', { people: -6, court: 6, money: 4 }),
    right: opt('不让', { people: 5, court: -6 }),
  },
  {
    id: 'wangpo_teahouse', who: 'wangpo', once: true,
    text: '茶馆要请说书的，说的是你。王婆问：这一本，准不准开讲？',
    left: opt('准讲', { people: 4, court: -2, heart: 1 }),
    right: opt('换个主人公', { court: 2, people: -3 }),
  },
  {
    id: 'shiye_drum', who: 'shiye', once: true,
    text: '鼓楼的鼓破了。没有鼓，升堂和失火都只能靠喊。',
    left: opt('换一面', { money: -5, court: 3, people: 2 }),
    right: opt('先喊着', { people: -2, court: -2 }),
  },
  {
    id: 'shiye_buckets', who: 'shiye', once: true,
    text: '街口没有火桶。师爷说，真着了火，得去井里一桶桶拎。',
    left: opt('置火桶', { money: -4, people: 4 }),
    right: opt('先这样', { people: -3, heart: -1 }),
  },
  {
    id: 'shiye_archive', who: 'shiye', once: true,
    text: '旧档堆在厢房，老鼠比师爷先读完。要不要单开一间档案房？',
    left: opt('开一间', { money: -6, court: 4 }),
    right: opt('先堆着', { court: -2, heart: -1 }),
  },
  {
    id: 'laohan_mill', who: 'laohan', once: true,
    text: '河上能架一盘水磨。磨成了全村省力，渠却要分掉一截。',
    left: opt('架水磨', { money: -6, people: 5 }),
    right: opt('水留着浇地', { people: 2, heart: 1 }),
  },
  {
    id: 'laohan_dyke', who: 'laohan', once: true,
    text: '河堤矮了一截。老汉说，再一场大水，田就不是田了。',
    left: opt('加高堤', { money: -8, people: 5 }),
    right: opt('赌它不来', { people: -4, heart: -2 }),
  },
  {
    id: 'laohan_seed', who: 'laohan', once: true,
    text: '官仓有一批种。放出去，来年能多打；留下，荒年才有底。',
    left: opt('放给各村', { money: -4, people: 6 }),
    right: opt('留在仓里', { money: 2, people: -3 }),
  },
  {
    id: 'laohan_locust', who: 'laohan', once: true,
    text: '蝗虫落到东村田里。打，要人；不打，明天就到西村。',
    left: opt('全村去打', { people: 4, heart: 2, money: -3 }),
    right: opt('先看着', { people: -6, money: -4 }),
  },
  {
    id: 'langzhong_pox', who: 'langzhong', once: true,
    text: '郎中带来一种痘。说是种上就不犯天花，村里有人怕。',
    left: opt('先种衙门的', { heart: 3, people: 4, money: -3 }),
    right: opt('不准种', { people: -2, heart: -3 }),
  },
  {
    id: 'langzhong_isolate', who: 'langzhong', once: true,
    text: '城外有人发热。郎中要腾一间空庙隔离，香客得暂时请走。',
    left: opt('腾出来', { people: 3, heart: 3, court: -2 }),
    right: opt('让他们进城', { people: -5, heart: -3 }),
  },
  {
    id: 'wangpo_stage', who: 'wangpo', once: true,
    text: '城隍庙前没有戏台。王婆说，有了台，节下就不用在泥地里唱。',
    left: opt('修一座', { money: -7, people: 5 }),
    right: opt('泥地也能唱', { people: -2, money: 1 }),
  },
  {
    id: 'heshang_rain', who: 'heshang', once: true,
    text: '旱了半个月。和尚要办一场求雨，香烛和供果得你出。',
    left: opt('出这份', { money: -4, people: 4, heart: 2 }),
    right: opt('雨自己会来', { people: -3, heart: -1 }),
  },
  {
    id: 'heshang_buddha', who: 'heshang', once: true,
    text: '寺里的佛像裂了。重塑要一笔香火，和尚说裂着像不吉利。',
    left: opt('重塑', { money: -6, people: 3, heart: 2 }),
    right: opt('先供着', { heart: -2, people: -2 }),
  },
  {
    id: 'butou_cell', who: 'butou', once: true,
    text: '牢房漏雨，犯人跟捕快挤在檐下。捕头问：修不修？',
    left: opt('修牢房', { money: -5, court: 3, heart: 2 }),
    right: opt('先挤着', { court: -2, heart: -2 }),
  },
  {
    id: 'butou_market', who: 'butou', once: true,
    text: '有人想开夜市。捕头怕夜里出贼，摊主怕没有夜市就没生意。',
    left: opt('准开', { people: 4, money: 3, court: -2 }),
    right: opt('酉时收摊', { court: 3, people: -3 }),
  },
  {
    id: 'gou_school', who: 'gousheng', once: true,
    text: '狗剩扒在义学窗外。他说不进门，只想听一耳朵。先生不让。',
    left: opt('让他听', { people: 4, heart: 4, court: -2 }),
    right: opt('听先生的', { court: 2, heart: -3 }),
  },
  {
    id: 'gou_shed', who: 'gousheng', once: true,
    text: '狗剩的窝在城门洞里。入冬前，他问能不能在墙根搭个不漏的。',
    left: opt('准他搭', { people: 3, heart: 3, money: -2 }),
    right: opt('城门洞清清', { court: 2, people: -3 }),
  },
  {
    id: 'shusheng_books', who: 'shusheng', once: true,
    text: '书生想在义学放一架书。书他抄，架子和防潮的石灰得你出。',
    left: opt('出架子', { money: -4, people: 4, heart: 2 }),
    right: opt('先抄着', { heart: 1 }),
  },
  {
    id: 'shusheng_shed', who: 'shusheng', once: true,
    text: '县试没有考棚。下雨天，考生的卷子跟屋顶一起湿。',
    left: opt('盖考棚', { money: -8, court: 4, people: 3 }),
    right: opt('借庙里考', { people: 2, court: -2 }),
  },
  {
    id: 'qian_pawn', who: 'qian', once: true,
    text: '钱老爷要开当铺。他说是便民，师爷说是把穷人的冬天当进来。',
    left: opt('不准开', { people: 4, heart: 3, money: -2 }),
    right: opt('准了', { money: 8, people: -5, heart: -3 }),
  },
  {
    id: 'qian_wharf', who: 'qian', once: true,
    text: '钱老爷要包下渡口。船钱他定，你只要盖个章。',
    left: opt('不盖', { people: 4, heart: 3, court: -2 }),
    right: opt('盖章', { money: 10, people: -6, heart: -3 }),
  },
  {
    id: 'zhifu_ink', who: 'zhifu', once: true, requires: { minRank: 2 },
    text: '知府要你县贡一匣墨。墨不贵，贵的是盒子得像那么回事。',
    left: opt('好好配一匣', { money: -5, court: 5 }),
    right: opt('墨行盒将就', { court: -3, heart: 2 }),
  },
  {
    id: 'qinchai_map', who: 'qinchai', once: true, requires: { minRank: 2 },
    text: '钦差要一张县图。田、路、桥都得画上，漏一处，他会亲自来对。',
    left: opt('据实画', { court: 4, heart: 2, money: -3 }),
    right: opt('画好看点', { court: 3, heart: -4 }),
  },

  // —— 圣旨：通判之后插入，不进普通牌池。每道这一任只来一次 ——
  {
    id: 'edict_tribute', who: 'zhifu', once: true, edict: true, requires: { minRank: 1 },
    text: '圣旨到了。{dynasty}朝的岁贡，着你县照额解送。仓里要是不够，条子上没写。',
    left: opt('照额进贡', { money: -12, court: 6 }, { courtShift: { guoshi: 8 } }),
    right: opt('今年灾了', { court: -8, people: 6, heart: 3 }, { courtShift: { guoshi: -7 } }),
  },
  {
    id: 'edict_price', who: 'zhifu', once: true, edict: true, requires: { minRank: 1 },
    text: '户部的条子：粮价太高，限你十日内压下去。怎么压，没写。',
    left: opt('官仓平价', { money: -10, people: 8 }, { courtShift: { guoshi: 5 } }),
    right: opt('随行就市', { money: 8, people: -8 }, { courtShift: { guoshi: -4 } }),
  },
  {
    id: 'edict_levy', who: 'zhifu', once: true, edict: true, requires: { minRank: 1 },
    text: '边关缺人。名册上要你县出八十个壮丁，春天之前送到。',
    left: opt('照册去征', { people: -12, court: 5 }, { courtShift: { bianjing: -10, guoshi: 4 } }),
    right: opt('县里也缺', { court: -8, heart: 4 }, { courtShift: { bianjing: 12, guoshi: -4 } }),
  },
  {
    id: 'edict_omen', who: 'qinchai', once: true, edict: true, requires: { minRank: 2 },
    text: '皇上问：你县可有祥瑞？写得好，朝报就好看。写得太好，你自己心里知道。',
    left: opt('据实回奏', { heart: 6, court: -4 }, { courtShift: { guoshi: -2 } }),
    right: opt('写一篇', { heart: -8, court: 10 }, { courtShift: { guoshi: 8 } }),
  },
  {
    id: 'edict_renown', who: 'zhifu', once: true, edict: true, requires: { minRank: 2, stat: { people: [78, 100] } },
    text: '你已经是知府了，京里才听见治下的民心。让你送一封报，再带一点粮样。',
    left: opt('送报带粮', { money: -8, court: 6 }),
    right: opt('只送空报', { court: -3, heart: 3 }),
  },
  {
    id: 'edict_timber', who: 'zhifu', once: true, edict: true, requires: { minRank: 1 },
    text: '皇陵要用木料。条子上写着你县出杉木二百根，路上的脚钱自理。',
    left: opt('照数解送', { money: -10, court: 5 }),
    right: opt('回说山秃了', { court: -6, heart: 3, people: 2 }),
  },
  {
    id: 'edict_sect', who: 'zhifu', once: true, edict: true, requires: { minRank: 1 },
    text: '礼部说乡里有邪教。让你查。查得太认真，香火也算一份。',
    left: opt('查一查', { people: -4, court: 4, heart: -2 }),
    right: opt('回说没有', { heart: 3, court: -4 }),
  },
  {
    id: 'edict_coats', who: 'zhifu', once: true, edict: true, requires: { minRank: 1 },
    text: '边军要冬衣。你县摊到八十件，棉花和布都得现办。',
    left: opt('办齐送去', { money: -8, court: 4 }),
    right: opt('只送四十件', { court: -4, people: 2, heart: 2 }),
  },
  {
    id: 'edict_river', who: 'qinchai', once: true, edict: true, requires: { minRank: 2 },
    text: '河道该清淤了。上面点你县出夫，一天一百人，连出十天。',
    left: opt('照数出夫', { people: -8, court: 5 }),
    right: opt('雇人顶上', { money: -10, people: 3 }),
  },
  {
    id: 'edict_talent', who: 'qinchai', once: true, edict: true, requires: { minRank: 2 },
    text: '朝廷要各县举荐一名贤良。举谁，折子上得有你的名字。',
    left: opt('举书生', { court: 3, heart: 4, people: 2 }),
    right: opt('举钱老爷', { money: 8, court: 4, heart: -6 }),
  },
  {
    id: 'edict_census', who: 'shiye', once: true, edict: true, requires: { minRank: 1 },
    text: '户部要重造户籍。隐漏的口，这一回都得写上。写上就要加税。',
    left: opt('据实造册', { money: 8, people: -6, court: 4 }),
    right: opt('还按旧册', { people: 4, heart: 2, court: -4 }),
  },
  {
    id: 'edict_horses', who: 'zhifu', once: true, edict: true, requires: { minRank: 1 },
    text: '驿路缺马。你县摊到十二匹，不管是买是借，月底前得到。',
    left: opt('买齐送去', { money: -10, court: 4 }),
    right: opt('送六匹', { court: -4, money: -4, heart: 2 }),
  },
  {
    id: 'edict_paper', who: 'shiye', once: true, edict: true, requires: { minRank: 1 },
    text: '国史馆要纸。你县的竹纸在册上有名，这一回点了八百刀。',
    left: opt('照数起运', { money: -6, court: 4 }),
    right: opt('回说竹少', { court: -3, heart: 2 }),
  },
  {
    id: 'edict_copper', who: 'zhifu', once: true, edict: true, requires: { minRank: 2 },
    text: '户部收铜。家里的锅、庙里的钟，条子上都写着可以算。',
    left: opt('只收废铜', { money: -4, court: 3, people: 2 }),
    right: opt('连锅也收', { money: 6, people: -8, heart: -4 }),
  },
  {
    id: 'edict_birthday', who: 'qinchai', once: true, edict: true, requires: { minRank: 2 },
    text: '万寿将至。每个县要进一份贺表，还要一份本地的土仪。',
    left: opt('表和土仪都进', { money: -6, court: 5 }),
    right: opt('只进贺表', { court: -2, heart: 2 }),
  },
  {
    id: 'revolt_ask', who: 'wangpo', career: 'revolt', chainOnly: true,
    text: '夜里有人叩门。{dynasty}的国势下去了，你县的粮和人心都在。他们问：换个国号？',
    left: opt('把人送走', { people: -12, court: 8 }, { courtShift: { guoshi: 10 }, flags: { revolt_asked: true }, path: { clean: 1 } }),
    right: opt('跟上', { heart: 4 }, { careerResult: 'found', flags: { revolt_asked: true }, path: { scheme: 2 } }),
  },
  {
    id: 'troop_raise', who: 'butou', troop: true, requires: { minRank: 1 },
    text: '捕头问：这队兵，是拉去剿匪，还是留在城里守治安？',
    left: opt('去剿匪', { money: -5, people: 4 }, { troops: 22, courtShift: { bianjing: -8 }, path: { arms: 2 } }),
    right: opt('守治安', { money: -4, people: 6, court: 3 }, { troops: 16, path: { arms: 2 } }),
  },
  {
    id: 'troop_volunteer', who: 'butou', troop: true, requires: { minRank: 1, stat: { people: [78, 100] } },
    text: '捕头说，村里有壮丁自己要来。不图饷，图的是这县还像个县。',
    left: opt('编进队里', { money: -4 }, { troops: 16 }),
    right: opt('先让他们回家', { people: 3, heart: 2 }),
  },
  {
    id: 'crackdown', who: 'zhifu', career: 'crackdown', chainOnly: true,
    text: '上面看见你县兵多，来问一句：这些兵，是做什么的？',
    left: opt('就说剿匪', { court: 2 }, { troops: -8, flags: { crackdown_done: true }, chain: { id: 'crackdown_push', delay: 2 } }),
    right: opt('就说治安', { people: 3, court: 2 }, { troops: -6, flags: { crackdown_done: true }, chain: { id: 'crackdown_push', delay: 2 } }),
  },
  {
    id: 'crackdown_push', who: 'zhifu', chainOnly: true,
    text: '他听完还是要你裁一截。你可以再找个理由，也可以把兵留下。',
    left: opt('再找理由', { heart: -3, court: -2 }, { troops: -12, path: { scheme: 1 } }),
    right: opt('把兵留下', { court: -4 }, { virtue: -4, path: { arms: 2 } }),
  },
  {
    id: 'crackdown_again', who: 'zhifu', career: 'crackdown', chainOnly: true,
    text: '上面又来了。上回的兵还在，这次要你当场裁掉一截。',
    left: opt('裁一截', { court: 3 }, { troops: -18 }),
    right: opt('还是留下', { court: -6, heart: 2 }, { virtue: -3 }),
  },
  {
    id: 'fall_1', who: 'shiye', career: 'fall', chainOnly: true,
    text: '京里传话：{dynasty}的旗子不稳。你拿银子换过官，有人已经在写你的名字。',
    left: opt('先稳住', { heart: -3 }, chain('fall_2', 3)),
    right: opt('且看着', { court: -4 }, chain('fall_2', 3)),
  },
  {
    id: 'fall_2', who: 'wangpo', chainOnly: true,
    text: '城外有人打着新旗号。你县的兵和粮，他们都算过。再过些日子，城门未必还是你的。',
    left: opt('紧闭城门', { people: -4, heart: 3 }, chain('fall_3', 3)),
    right: opt('放出风声', { people: 4, court: -4 }, chain('fall_3', 3)),
  },
  {
    id: 'fall_3', who: 'qinchai', chainOnly: true,
    text: '旗子要换了。你可以降一级，留在新朝接着坐这把椅子，也可以现在就走。',
    left: opt('降级留下', { heart: 2 }, { careerResult: 'stay' }),
    right: opt('现在就走', {}, { ending: 'new_dynasty' }),
  },

  // —— 仕途：四项稳住时由抽牌逻辑插入，不进普通牌池 ——
  {
    id: 'inspect', who: 'qinchai', career: 'inspect', chainOnly: true,
    text: '吏部派人下来了。你如今是{rank}，四项都还看得过去。这一关，怎么过？',
    left: opt('从容应对', { court: 4, heart: 3 }, { careerResult: 'promote', path: { clean: 1 } }),
    right: opt('塞点银子', { money: -14, heart: -14 }, { careerResult: 'promote', risky: true, path: { graft: 1, scheme: 1 } }),
  },
  {
    id: 'gift_jump', who: 'zhifu', once: true, weight: 2, paths: ['graft', 'scheme'], requires: { maxRank: 4 },
    text: '上面有人递话：厚礼送到，这次不是升一级，是直接跳过去。',
    left: opt('送厚礼', { money: -14, heart: -6, court: 6 }, { careerResult: 'skip', path: { graft: 1, scheme: 1 }, chain: { id: 'gift_check', delay: 6 } }),
    right: opt('不送', { heart: 3 }, { path: { clean: 1 } }),
  },
  {
    id: 'gift_check', who: 'qinchai', chainOnly: true,
    text: '跳得太快，有人翻你的账。再送一笔，位子能保住。不送，就把你调去别的县，官还是县令。',
    left: opt('再送一笔', { money: -10, court: 4 }, { path: { graft: 1 } }),
    right: opt('认了', {}, { careerResult: 'retitle' }),
  },
  {
    id: 'greedy_oil', who: 'qian', once: true, weight: 2, paths: ['graft'],
    text: '钱老爷说，这县的油水他帮你看着，你睁只眼，银子自己会来。',
    left: opt('睁只眼', { money: 10, people: -3, heart: -3, court: 3 }, { path: { graft: 1 }, bond: { who: 'qian', d: 1 }, ...chain('greedy_share', 5) }),
    right: opt('不睁', { heart: 3, people: 2 }, { path: { clean: 1 }, bond: { who: 'qian', d: -1 } }),
  },
  {
    id: 'greedy_share', who: 'zhifu', chainOnly: true,
    text: '上面的人要分一截。分了，这摊子还能做下去。独吞，账就会被人翻开。',
    left: opt('分给他们', { money: -8, court: 5 }, { path: { graft: 1, scheme: 1 } }),
    right: opt('独吞', { money: 6, court: -5, heart: -2 }, { path: { graft: 2 }, ...chain('greedy_book', 4) }),
  },
  {
    id: 'greedy_book', who: 'qinchai', chainOnly: true,
    text: '账翻开了。再买一次，事情能压下去。不买，你就被调走，官还是县令。',
    left: opt('再买一次', { money: -10, court: 4 }, { path: { graft: 1 } }),
    right: opt('不买了', {}, { careerResult: 'retitle' }),
  },
  {
    id: 'pleasure_1', who: 'wangpo', once: true, weight: 2, paths: ['pleasure'],
    text: '城西开了家青楼，帖子送到衙门。今晚的状纸还堆着，你去不去？',
    left: opt('去坐坐', { money: -3, heart: -2, people: -1 }, { path: { pleasure: 2 }, ...chain('pleasure_2', 4) }),
    right: opt('看状纸', { court: 3, heart: 2 }, { path: { clean: 1 } }),
  },
  {
    id: 'pleasure_2', who: 'langzhong', chainOnly: true,
    text: '你去得勤了。郎中捎话：再这样，人要垮。班子还请你今晚再去。',
    left: opt('再去一晚', { money: -4, heart: -4 }, { path: { pleasure: 2 }, ...chain('pleasure_3', 3) }),
    right: opt('听郎中的', { heart: 6, money: -2 }, { path: { clean: 1 } }),
  },
  {
    id: 'pleasure_3', who: 'langzhong', chainOnly: true,
    text: '身子已经拖不住。再去，就是最后一晚。停下来，这一任还没完。',
    left: opt('最后一晚', { heart: -3 }, { path: { pleasure: 1 }, ...chain('illness_bow', 3) }),
    right: opt('停下来', { heart: 4, court: -2 }),
  },
  {
    id: 'illness_bow', who: 'langzhong', chainOnly: true,
    text: '郎中说这一晚过去，人就起不来了。真去，这一任病倒收场。留下，还能断。',
    left: opt('真去', { heart: -2 }, { ending: 'illness' }),
    right: opt('留下', { heart: 4 }, { path: { clean: 1 } }),
  },
  {
    id: 'neglect_year', who: 'shiye', once: true, weight: 1, paths: ['pleasure'],
    requires: { minDay: 100, minPath: { pleasure: 3 } },
    text: '这一阵你没怎么管事，酒和曲子倒没断。上面居然没来抓。日子自己走到了这儿。',
    left: opt('就混到这儿', { heart: 2 }, { path: { pleasure: 1 }, ...chain('leisure_bow', 6) }),
    right: opt('把落下的补上', { court: 4, heart: -3 }, { path: { clean: 1 } }),
  },
  {
    id: 'leisure_bow', who: 'shiye', chainOnly: true,
    text: '真要混完这一任也可以。把落下的补上，衙门还能转。',
    left: opt('就这样混完', { heart: 2 }, { ending: 'leisure' }),
    right: opt('把正事捡回', { court: 4 }, { path: { clean: 1 } }),
  },
  {
    id: 'border_ask', who: 'shiye', once: true, weight: 1, paths: ['scheme'], requires: { minDay: 72, minPath: { scheme: 2 } },
    text: '界河对面来了人。他们说这县紧挨着他们，你把城门打开，位子他们保。',
    left: opt('听听', { heart: -2 }, { path: { scheme: 1 }, countyAdd: 'border', ...chain('border_gate', 4) }),
    right: opt('送回去', { court: 3 }, { path: { clean: 1 }, courtShift: { bianjing: -4 } }),
  },
  {
    id: 'border_gate', who: 'shiye', chainOnly: true,
    text: '他们今夜就在城外。开城，你就不是这边的官了。不开，帖子当没送过。',
    left: opt('开城', { people: -4 }, { path: { scheme: 1 }, ...chain('border_open_bow', 3) }),
    right: opt('不开城', { court: 4, heart: 2 }, { courtShift: { bianjing: -6 } }),
  },
  {
    id: 'border_open_bow', who: 'shiye', chainOnly: true,
    text: '城门栓还在。真开，这一任就换边了。不开，今夜当没这回事。',
    left: opt('真开城', { people: -3 }, { path: { scheme: 2 }, ending: 'traitor' }),
    right: opt('还是不开', { court: 4, heart: 2 }, { courtShift: { bianjing: -4 } }),
  },
  {
    id: 'border_smuggle', who: 'qian', once: true, weight: 2, paths: ['graft', 'scheme'], county: ['border', 'salt', 'poor'],
    text: '钱老爷说，界河上夜里有船。你当没看见，银子会自己进库。',
    left: opt('当没看见', { money: 8, court: -3, heart: -3 }, { path: { graft: 1, scheme: 1 }, countyAdd: 'border' }),
    right: opt('查夜船', { people: 3, heart: 2 }, { path: { clean: 1 } }),
  },
  {
    id: 'path_clean_name', who: 'shusheng', career: 'path', chainOnly: true, once: true,
    text: '城里名帖贴满了，都夸你清。钦差夜里来过一回，问你还要不要接着做这个清官。',
    left: opt('接着清', { people: 4, heart: 3 }, { path: { clean: 1 }, chain: { id: 'path_clean_end', delay: 5 } }),
    right: opt('收点人情', { money: 6, heart: -3 }, { path: { graft: 1 } }),
  },
  {
    id: 'path_clean_end', who: 'qinchai', chainOnly: true,
    text: '京里传开了你的名字。可以留下一块清名匾接着断，也可以过些日子再借这名气收场。',
    left: opt('留匾接着断', { heart: 4, people: 3 }, { path: { clean: 1 }, world: { plaque: 1 } }),
    right: opt('过些日子', { court: 2 }, { path: { clean: 1 }, chain: { id: 'path_clean_bow', delay: 16 } }),
  },
  {
    id: 'path_clean_bow', who: 'qinchai', chainOnly: true,
    text: '名气还在。现在体面下来，或回县把这一任做满。',
    left: opt('体面下来', { heart: 3 }, { path: { clean: 1 }, ...chain('path_clean_leave', 6) }),
    right: opt('回县做满', { people: 2, court: 2 }, { path: { clean: 1 } }),
  },
  {
    id: 'path_clean_leave', who: 'qinchai', chainOnly: true,
    text: '匾还挂着。真退，这一任就体面收场。不退，接着断。',
    left: opt('真退', { heart: 2 }, { ending: 'clean_fame' }),
    right: opt('接着断', { people: 2, court: 2 }, { path: { clean: 1 }, world: { plaque: 1 } }),
  },
  {
    id: 'path_graft_ledger', who: 'qinchai', career: 'path', chainOnly: true, once: true,
    text: '账本到了府里。再买一次，位子还能坐。不买，这一任就调走收场。',
    left: opt('再买一次', { money: -12, court: 5 }, { path: { graft: 1 } }),
    right: opt('调走收场', { court: -2 }, { ...chain('transfer_bow', 4) }),
  },
  {
    id: 'transfer_bow', who: 'qinchai', chainOnly: true,
    text: '调令还没盖。真走，这一任就到别县收场。再买一次，位子还能坐。',
    left: opt('真调走', {}, { ending: 'transfer' }),
    right: opt('再买一次', { money: -10, court: 4 }, { path: { graft: 1 } }),
  },
  {
    id: 'path_pleasure_doc', who: 'langzhong', career: 'path', chainOnly: true, once: true,
    text: '郎中第三次上门。再去青楼，就是病榻上的事。停手，这一任还能过完。',
    left: opt('再去', { heart: -4, money: -3 }, { path: { pleasure: 1 }, ...chain('pleasure_3', 3) }),
    right: opt('停手', { heart: 5 }, { chain: { id: 'path_pleasure_idle', delay: 8 } }),
  },
  {
    id: 'path_pleasure_idle', who: 'shiye', chainOnly: true,
    text: '你停了手，酒也少了。正事补了一截。要就此混完这一任，也可以再过些日子说。',
    left: opt('再过些日子', { heart: 2 }, { path: { pleasure: 1 }, ...chain('leisure_bow', 10) }),
    right: opt('正经当官', { court: 4 }, { path: { clean: 1 } }),
  },
  {
    id: 'path_arms_grip', who: 'butou', career: 'path', chainOnly: true, once: true,
    text: '兵已经听你的了。握紧，这支兵就是你的。裁一半，上面会松一口气。',
    left: opt('握紧', { court: -3 }, { troops: 8, path: { arms: 1 }, chain: { id: 'path_arms_fork', delay: 4 } }),
    right: opt('裁一半', { court: 4 }, { troops: -20, path: { clean: 1 } }),
  },
  {
    id: 'path_arms_fork', who: 'butou', chainOnly: true,
    text: '兵在手里发热。有人劝你举旗，也有人说半路会散。',
    left: opt('准备举旗', { heart: 2 }, { path: { arms: 1 }, chain: { id: 'rebel_march', delay: 2 } }),
    right: opt('先按住', { people: -2, court: -2 }, { troops: -4, ...chain('arms_scatter_bow', 3) }),
  },
  {
    id: 'arms_scatter_bow', who: 'butou', chainOnly: true,
    text: '兵已经松了。真按住不管，人就散，这一任到头。握回去，还能听你的。',
    left: opt('真按住', { people: -4, court: -4 }, { troops: -10, ending: 'arms_scatter' }),
    right: opt('握回去', { court: -2 }, { troops: 6, path: { arms: 1 } }),
  },
  {
    id: 'path_scheme_two', who: 'shiye', career: 'path', chainOnly: true, once: true,
    text: '两边都来信：夜里换旗的，界河对面的。先应夜访，或两边都推开。邻国那头，另有帖子。',
    left: opt('跟夜访', { heart: 2 }, { path: { scheme: 1 }, careerResult: 'found' }),
    right: opt('两边都推', { court: 3, heart: 2 }, { path: { clean: 1 } }),
  },
  {
    id: 'arc_wangpo_1', who: 'wangpo', once: true, weight: 2,
    text: '王婆又来了。这次不是说媒，是说城里有人要拿你开刀，她能压一压。',
    left: opt('让她压', { money: -4, court: 3 }, { bond: { who: 'wangpo', d: 1 }, path: { scheme: 1 }, chain: { id: 'arc_wangpo_2', delay: 6 } }),
    right: opt('自己扛', { heart: 3 }, { bond: { who: 'wangpo', d: -1 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_wangpo_2', who: 'wangpo', chainOnly: true,
    text: '她压住了。过些日子她自己涉了案，跪在堂下看你。',
    left: opt('保她', { court: -4, heart: 2 }, { bond: { who: 'wangpo', d: 1 }, path: { scheme: 1 }, chain: { id: 'arc_wangpo_3', delay: 5 } }),
    right: opt('依法办', { court: 5, people: 2 }, { bond: { who: 'wangpo', d: -2 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_wangpo_3', who: 'wangpo', chainOnly: true,
    text: '她事后塞给你一张名单：谁在背后递话。你可以用，也可以烧了。',
    left: opt('用名单', { court: 4, heart: -3 }, { bond: { who: 'wangpo', d: 1 }, path: { scheme: 1 }, chain: { id: 'arc_wangpo_4', delay: 5 } }),
    right: opt('烧了', { heart: 5 }, { bond: { who: 'wangpo', d: 1 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_qian_1', who: 'qian', once: true, weight: 2, paths: ['graft'],
    text: '钱老爷请你私下喝茶。茶是好茶，话是分油水的话。',
    left: opt('听他分', { money: 8, people: -2 }, { bond: { who: 'qian', d: 1 }, path: { graft: 1 }, chain: { id: 'arc_qian_2', delay: 5 } }),
    right: opt('喝茶不办事', { heart: 3 }, { bond: { who: 'qian', d: -1 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_qian_2', who: 'qian', chainOnly: true,
    text: '油水分过一回。第二次他要你盖印。盖了，他抬你；不盖，他咬你。',
    left: opt('盖印', { money: 6, heart: -4, court: 3 }, { bond: { who: 'qian', d: 1 }, path: { graft: 1 }, chain: { id: 'arc_qian_3', delay: 4 } }),
    right: opt('不盖', { heart: 4, court: -3 }, { bond: { who: 'qian', d: -2 }, path: { clean: 1 }, ...chain('graft_bite_bow', 4) }),
  },
  {
    id: 'graft_bite_bow', who: 'qian', chainOnly: true,
    text: '他真要咬了。硬顶过去，这一任可能灰；低头盖印，还能缓一缓。',
    left: opt('硬顶', { heart: 3, court: -4 }, { ending: 'graft_bite' }),
    right: opt('低头盖印', { money: 4, heart: -3 }, { bond: { who: 'qian', d: 1 }, path: { graft: 1 } }),
  },
  {
    id: 'arc_qian_3', who: 'zhifu', chainOnly: true,
    text: '他果然抬了你一句。知府问：钱某与你是什么交情？',
    left: opt('说是乡谊', { court: 3 }, { path: { scheme: 1 }, chain: { id: 'arc_qian_4', delay: 5 } }),
    right: opt('说是公事', { heart: 2, court: -2 }, { path: { clean: 1 } }),
  },
  {
    id: 'arc_shiye_1', who: 'shiye', once: true, weight: 2, requires: { bond: { shiye: 1 } },
    text: '孙师爷夜里把账本摊开：有一笔，可以算你的，也可以算他的。',
    left: opt('算他的', { money: 4, heart: -3 }, { bond: { who: 'shiye', d: 1 }, path: { graft: 1 }, chain: { id: 'arc_shiye_2', delay: 5 } }),
    right: opt('算你的', { heart: 4, money: -4 }, { bond: { who: 'shiye', d: -1 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_shiye_2', who: 'shiye', chainOnly: true,
    text: '这笔账他替你圆过去了。过了些日子，他自己的私账也被人翻出来。',
    left: opt('先护他', { court: -2, heart: -2 }, { bond: { who: 'shiye', d: 1 }, path: { graft: 1 }, chain: { id: 'arc_shiye_3', delay: 4 } }),
    right: opt('交出去', { court: 3, heart: 2 }, { bond: { who: 'shiye', d: -1 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_shiye_3', who: 'shiye', chainOnly: true,
    text: '他跪在签押房：这一笔是他贪的。你还把那本旧账算在谁头上？',
    left: opt('仍算他的', { heart: -2 }, { bond: { who: 'shiye', d: 1 }, path: { scheme: 1 }, chain: { id: 'arc_shiye_4', delay: 4 } }),
    right: opt('改算你的', { heart: 4, money: -4 }, { path: { clean: 1 } }),
  },
  {
    id: 'arc_shiye_4', who: 'shiye', chainOnly: true,
    text: '外头的人已经进了门。割席，他一个人扛；同沉，两人一起灰。',
    left: opt('割席', { court: 3, heart: -4 }, { bond: { who: 'shiye', d: -2 }, path: { scheme: 1 }, ending: 'shiye_cut' }),
    right: opt('同沉', { money: -6, court: -4 }, { bond: { who: 'shiye', d: 1 }, path: { graft: 1 }, ending: 'shiye_sink' }),
  },
  {
    id: 'county_flood', who: 'laohan', once: true, weight: 2, county: ['flood', 'poor'],
    text: '河涨了。张老汉跪在堂下：要粮，要人，要你亲自去堤上。',
    left: opt('亲自去', { money: -6, people: 8, heart: 3 }, { path: { clean: 1 }, countyAdd: 'flood' }),
    right: opt('派人去', { money: -3, people: 2 }, { path: { pleasure: 1 } }),
  },
  {
    id: 'county_school', who: 'shusheng', once: true, weight: 2, county: ['school', 'poor'],
    text: '学县的学生堵在衙门口，要你出面主持县试。',
    left: opt('亲自主持', { court: 4, people: 3 }, { path: { clean: 1 }, countyAdd: 'school' }),
    right: opt('让师爷去', { court: -2 }, { path: { pleasure: 1 } }),
  },
  {
    id: 'county_chaos', who: 'butou', once: true, weight: 2, county: ['chaos'],
    text: '乱县今夜又响刀。捕头问：是剿，还是先缩进城里。',
    left: opt('出城剿', { money: -4, people: 4 }, { troops: 10, path: { arms: 1 } }),
    right: opt('缩进城', { people: -4, court: 2 }, { path: { scheme: 1 } }),
  },
  {
    id: 'early_rise', who: 'shiye', once: true, paths: ['arms'], requires: { minRank: 1, notFlags: ['claimed'] },
    text: '官才升了一级。城外有人喊你的名字，问你要不要现在就起兵。',
    left: opt('起兵', { heart: 2 }, { path: { arms: 2 }, ...chain('early_march', 2) }),
    right: opt('接着当官', { heart: 3, court: 2 }, { path: { clean: 1 } }),
  },
  {
    id: 'early_march', who: 'butou', chainOnly: true,
    text: '人跟你出了城。前面是府城。攻下去，或者趁夜散了。',
    left: opt('攻到府城', { people: -4 }, { careerResult: 'claim', claim: 'rise' }),
    right: opt('趁夜散了', { people: -6, court: -8 }),
  },
  {
    id: 'rebel_flag', who: 'wangpo', once: true, weight: 2, paths: ['arms'], requires: { minRank: 1, notFlags: ['claimed'] },
    text: '有人连夜来请你举旗。不是换个国号接着当官，是你自己来做皇帝。',
    left: opt('举旗', { people: 3 }, { path: { arms: 2 }, ...chain('rebel_march', 2) }),
    right: opt('把人送走', { people: -4, court: 3 }, { path: { clean: 1 } }),
  },
  {
    id: 'rebel_march', who: 'wangpo', chainOnly: true,
    text: '旗子打出去了。再往前是府城。半路散了，就只是一场闹。',
    left: opt('打到府城', { people: -4, heart: 2 }, { careerResult: 'claim', claim: 'revolt' }),
    right: opt('半路散了', { people: -6, court: -8 }),
  },
  {
    id: 'defect_ask', who: 'butou', once: true, paths: ['arms', 'scheme'], requires: { minRank: 1, minTroops: 24, notFlags: ['claimed'] },
    text: '军里有人递话：你点个头，这支兵明天就不姓朝廷。',
    left: opt('听他说', { heart: -2 }, { path: { arms: 1, scheme: 1 }, ...chain('defect_turn', 1) }),
    right: opt('当没听见', { court: 2 }, { troops: -6, path: { clean: 1 } }),
  },
  {
    id: 'defect_turn', who: 'butou', chainOnly: true,
    text: '倒戈的人等在门外。今夜过去，这支兵就收不回来了。',
    left: opt('连夜倒戈', { court: -8 }, { careerResult: 'claim', claim: 'defect' }),
    right: opt('临阵退回', { court: -4 }, { troops: -10 }),
  },
  {
    id: 'death_call', who: 'qinchai', once: true, requires: { minRank: 2, flags: ['news_death'], notFlags: ['claimed'], stat: { people: [70, 100] } },
    text: '皇上驾崩了。来人说民心在你这边，请你进京，坐那个空出来的位子。',
    left: opt('进京', { heart: 3 }, { careerResult: 'claim', claim: 'succession' }),
    right: opt('守着本任', { people: 3, heart: 2 }),
  },
  {
    id: 'throne_name', who: 'shiye', career: 'throne', chainOnly: true,
    text: '登基第一件是年号。换一个新的，或沿用进京前的。',
    left: opt('换一年号', { court: 2 }, chain('throne_clan', 1)),
    right: opt('沿用旧号', { heart: 2 }, chain('throne_clan', 1)),
  },
  {
    id: 'throne_clan', who: 'qinchai', chainOnly: true,
    text: '宗室来要爵。给了，椅子稳一点；不给，他们出去说闲话。',
    left: opt('给爵', { money: -6, court: 3 }, chain('throne_exam', 1)),
    right: opt('不给', { court: -2, heart: 2 }, chain('throne_exam', 1)),
  },
  {
    id: 'throne_exam', who: 'shusheng', chainOnly: true,
    text: '有人请你开恩科。开了，士子进京；不开，先把仗的事听完。',
    left: opt('开恩科', { people: 4, court: 2 }, { path: { clean: 1 } }),
    right: opt('先不开', { court: 2 }, { path: { scheme: 1 } }),
  },
  {
    id: 'throne_war', who: 'shiye', career: 'throne', chainOnly: true,
    text: '北境的兵过了界。你现在坐的是龙椅，师爷问：这仗，打还是守？',
    left: opt('出兵', { heart: 2 }, chain('throne_field', 2)),
    right: opt('死守', { people: 2 }, chain('throne_gate', 2)),
  },
  {
    id: 'throne_field', who: 'butou', chainOnly: true,
    text: '前军报：对方的阵松了。再压能成；收兵，这仗就停在半路。',
    left: opt('再压', { people: -6, money: -8 }, { ending: 'triumph' }),
    right: opt('收兵', { people: 3, heart: 2 }, { courtShift: { guoshi: -8, bianjing: 6 } }),
  },
  {
    id: 'throne_gate', who: 'shiye', chainOnly: true,
    text: '他们攻了三天。有人请你再守一夜，也有人请你开城讲和。',
    left: opt('再守一夜', { people: -4, heart: -3 }, { ending: 'triumph' }),
    right: opt('开城讲和', { court: -4, heart: -2 }, { ...chain('throne_defeat_bow', 2) }),
  },
  {
    id: 'throne_defeat_bow', who: 'shiye', chainOnly: true,
    text: '讲和的帖子还在案上。真开城，这一任就败了。再守一夜，还能赌一把。',
    left: opt('真开城', { court: -6, heart: -4 }, { ending: 'defeat' }),
    right: opt('再守一夜', { people: -4, heart: -3 }, { ending: 'triumph' }),
  },
  {
    id: 'throne_succession', who: 'qinchai', career: 'throne', chainOnly: true,
    text: '你进了京。宗室不认这张椅子，要你让出来，或者把不认的人清掉。',
    left: opt('把位子坐实', { court: 4, heart: -3 }, { ending: 'triumph' }),
    right: opt('先安抚着', { heart: 3 }, { courtShift: { guoshi: -6 } }),
  },
  {
    id: 'throne_revolt', who: 'wangpo', career: 'throne', chainOnly: true,
    text: '旧朝的兵打过来了。旗子已经是你的，这仗避不开。',
    left: opt('追出去', { people: -6, money: -6 }, { ending: 'triumph' }),
    right: opt('先缩进城', { people: -4, heart: -2 }, { ...chain('throne_defeat_bow', 2) }),
  },
  {
    id: 'throne_defect', who: 'butou', career: 'throne', chainOnly: true,
    text: '倒过来的兵看着你。另一支没倒的，已经把城围上了。',
    left: opt('带着他们出城', { people: -4, court: 3 }, { ending: 'triumph' }),
    right: opt('先缩进城', { people: -4, court: -3 }, { ...chain('throne_defeat_bow', 2) }),
  },
  {
    id: 'throne_rise', who: 'shiye', career: 'throne', chainOnly: true,
    text: '府城在你手里。京里的人马还在路上。打下去，或者就占到这儿。',
    left: opt('直取京城', { people: -6, money: -8 }, { ending: 'triumph' }),
    right: opt('占到这儿', { court: -3, people: 3 }, { courtShift: { guoshi: 4 } }),
  },
  {
    id: 'heir_ask', who: 'shiye', career: 'heir', chainOnly: true,
    text: '你已是{rank}，今年{age}岁。上面问：这颗印，还自己攥着，还是交出去？',
    left: opt('再干一阵', { heart: 3 }, { careerResult: 'later' }),
    right: opt('要立', {}, chain('heir_gate', 0)),
  },
  {
    id: 'heir_gate', who: 'shiye', chainOnly: true,
    text: '要交印，还是把印摘下来，自己出城？',
    left: opt('交出去', {}, chain('heir_pick', 0)),
    right: opt('摘印出城', {}, { ending: 'retire' }),
  },
  {
    id: 'heir_pick', who: 'shiye', chainOnly: true,
    text: '印交给谁？儿子稳当，师爷懂衙门。',
    left: opt('交给儿子', {}, { ending: 'heir_son' }),
    right: opt('交给师爷', {}, { ending: 'heir_shiye' }),
  },

  // —— 钦差（解锁 2 个结局后出现）——
  {
    id: 'qin_audit', who: 'qinchai', requires: { endings: 2 },
    text: '奉旨查账。你县的账本，拿来。',
    left: opt('被老鼠啃了', { court: -4, people: 4 }),
    right: opt('请查', { court: 10, money: -8 }),
  },
  {
    id: 'qin_incognito', who: 'qinchai', requires: { endings: 2 },
    text: '本官微服私访，听说你县有个贪官。你知道是谁吗？',
    left: opt('是钱老爷', { people: 10, court: 4, money: -5 }),
    right: opt('本县没有贪官', { court: -6, heart: -6 }),
  },
  {
    id: 'qin_rich', who: 'qinchai', requires: { endings: 2, stat: { money: [72, 100] } },
    text: '你县一个穷县，库里的银子比府城还多？说说吧，哪来的？',
    left: opt('拿去赈灾', { money: -15, people: 10 }),
    right: opt('百姓勤劳', { court: -10, heart: -5 }),
  },
  {
    id: 'qin_broke', who: 'qinchai', requires: { endings: 2, stat: { money: [0, 28] } },
    text: '听说你县穷得连衙役的饭都管不起了？朝廷可以拨一点，但要你立个军令状。',
    left: opt('不立', { heart: 4, court: -4 }),
    right: opt('立！', { money: 18, court: -8 }),
  },
];

const THEME_RULES = [
  ['wedding', /成亲|改嫁|嫁|说媒/],
  ['salt', /盐/],
  ['bandit', /匪|山贼/],
  ['exam', /科举|中举|县试|书院|恩科/],
  ['river', /堤|河水|河涨|河堤|河道|河上|河滩|决口|河伯|水患/],
  ['tax', /税|钱粮|秋粮|征粮/],
];
const DRESS_PATHS = ['clean', 'graft', 'pleasure', 'arms', 'scheme'];

function dressCard(card) {
  const next = { ...card };
  const text = next.text || '';
  if (!next.theme && !text.includes('不是说媒')) {
    const hit = THEME_RULES.find(([, re]) => re.test(text));
    if (hit) {
      next.theme = hit[0];
    }
  }
  if (!next.paths || !next.paths.length) {
    const keys = [];
    [next.left, next.right].forEach((o) => {
      if (!o || !o.path) {
        return;
      }
      DRESS_PATHS.forEach((k) => {
        if (o.path[k] && !keys.includes(k)) {
          keys.push(k);
        }
      });
    });
    if (keys.length) {
      next.paths = keys;
    }
  }
  return next;
}

export const CARDS = [...CORE_CARDS, ...EXTRA_CARDS, ...WAVE_CARDS].map(dressCard);
