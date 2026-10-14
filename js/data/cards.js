/**
 * 卡牌表。left / right 为左滑 / 右滑选项。
 * fx 键：people 民心、money 钱粮、court 官声、heart 良心。
 */

const opt = (label, fx = {}, extra = {}) => ({ label, fx, ...extra });
const chain = (id, delay = 3) => ({ chain: { id, delay } });

export const CARDS = [
  // —— 开场 ——
  {
    id: 'intro', who: 'shiye', chainOnly: true,
    text: '大人，您就是第{n}任县令？{handoff}咱们县穷，事多，规矩也多。您先升堂吧。',
    left: opt('先看看账本', { money: 3 }),
    right: opt('升堂！', { people: 3 }),
  },

  // —— 师爷 ——
  {
    id: 'shiye_tax', who: 'shiye',
    text: '老爷，秋税要不要多收两成？就说是……修城墙。',
    left: opt('照旧收', { people: 5, money: -5 }),
    right: opt('就说修城墙', { people: -15, money: 15, heart: -5 }),
  },
  {
    id: 'shiye_gift', who: 'shiye',
    text: '知府大人下月做寿，咱们送点什么？小的觉得送一对金蟾，寓意好。',
    left: opt('送幅字画', { court: -8, heart: 5 }),
    right: opt('送金蟾', { money: -12, court: 15 }),
  },
  {
    id: 'shiye_ledger', who: 'shiye', once: true,
    text: '账房说库里少了三百两……小的发誓不是我。大概不是。',
    left: opt('算了', { money: -10, heart: -3 }),
    right: opt('严查到底', { money: 5, people: 5 }, chain('shiye_confess', 4)),
  },
  {
    id: 'shiye_confess', who: 'shiye', chainOnly: true,
    text: '老爷……那三百两，是小的拿去给老娘抓药了。小的这就卷铺盖。',
    left: opt('革职查办', { money: 10, heart: -15, court: 5 }),
    right: opt('扣半年俸禄', { heart: 12, money: 5 }),
  },
  {
    id: 'shiye_nap', who: 'shiye',
    text: '老爷，今日风和日丽，衙门无事。要不要……午休一下？',
    left: opt('批公文', { court: 6, heart: -2 }),
    right: opt('睡！', { court: -6, heart: 4 }),
  },
  {
    id: 'shiye_rumor', who: 'shiye',
    text: '城里都在传，说您长得像前任县令养的那只鹅。要不要贴告示辟谣？',
    left: opt('随他们去', { people: 6, court: -3 }),
    right: opt('贴告示', { money: -5, people: -6, court: 5 }),
  },
  {
    id: 'shiye_bridge', who: 'shiye',
    text: '东边那座桥塌了一半，修好要五百两。现在大家都是跳着过河。',
    left: opt('搭块木板', { people: -10 }),
    right: opt('拨款修桥', { money: -13, people: 9 }),
  },
  {
    id: 'shiye_monument', who: 'shiye',
    text: '老爷，要不要给您自己立块功德碑？别的县令都立，不立显得没功德。',
    left: opt('不立', { heart: 8, court: -5 }),
    right: opt('立个大的', { money: -12, court: 10, heart: -10 }),
  },
  {
    id: 'shiye_lottery', who: 'shiye',
    text: '老爷，咱们办个彩票吧？一文钱一张，头奖一两。稳赚。',
    left: opt('这叫赌博', { heart: 6, money: -2 }),
    right: opt('办！', { money: 15, people: 5, heart: -12 }),
  },
  {
    id: 'shiye_seal', who: 'shiye',
    text: '老爷，您的官印呢？明天要盖章，小的找遍了，就差掀房顶了。',
    left: opt('掀房顶找', { money: -6, court: 5 }),
    right: opt('先刻个萝卜章', { court: -10, heart: -4, people: 4 }),
  },
  {
    id: 'shiye_swap', who: 'shiye',
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
    right: opt('买新刀', { money: -12, court: 8, people: 6 }),
  },
  {
    id: 'butou_cat', who: 'butou',
    text: '王员外家的猫上树三天了，非要咱衙门去救。说衙门是父母官，猫也是子民。',
    left: opt('衙门不管猫', { people: -6, court: 4 }),
    right: opt('全员出动', { people: 10, court: -6 }),
  },
  {
    id: 'butou_bandit', who: 'butou',
    text: '城外黑风岭有山贼，劫了三车盐！剿不剿？小的手已经痒了。',
    left: opt('先招安', { money: -6, court: -6, heart: 6 }),
    right: opt('剿！追回赃物', { money: 8, court: 10, people: 4, heart: -4 }),
  },
  {
    id: 'butou_hero', who: 'butou',
    text: '小的昨晚一个人打跑了五个山贼！能不能……给块牌匾？',
    left: opt('先把牛皮收收', { heart: 4, people: -3 }),
    right: opt('赏！', { money: -6, people: 6, court: 4 }),
  },
  {
    id: 'butou_wrong', who: 'butou',
    text: '坏了老爷，昨天抓错人了。抓的是……知府大人的小舅子。',
    left: opt('赶紧放人赔罪', { court: 6, heart: -10, money: -5 }),
    right: opt('按律办事', { court: -18, heart: 12, people: 10 }),
  },
  {
    id: 'butou_jail', who: 'butou',
    text: '大牢满了，犯人们晚上睡觉得叠着睡。能不能放几个偷鸡摸狗的？',
    left: opt('再挤挤', { people: -5, heart: -6 }),
    right: opt('放', { people: 6, court: -6 }),
  },
  {
    id: 'butou_duel', who: 'butou',
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
    right: opt('跳吧跳吧', { people: 11, court: -10 }),
  },
  {
    id: 'wangpo_ghost', who: 'wangpo', once: true, requires: { runs: 1 },
    text: '县太爷，西巷老宅闹鬼！半夜有个白衣姑娘在院里啃鸡腿！',
    left: opt('派人看看', { people: 4 }, chain('fox_meet', 2)),
    right: opt('请和尚做法', { money: -10, people: 8 }),
  },
  {
    id: 'wangpo_widow', who: 'wangpo',
    text: '城北孙寡妇想改嫁，族里不让，两边都快打起来了。县太爷给评评理？',
    left: opt('族规为大', { court: 5, heart: -10 }),
    right: opt('本官准了', { heart: 10, court: -5, people: 5 }),
  },
  {
    id: 'wangpo_secret', who: 'wangpo',
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
    left: opt('缓一年', { people: 11, court: -6 }),
    right: opt('盖章', { people: -15, money: 10 }),
  },
  {
    id: 'qian_banquet', who: 'qian',
    text: '鄙人做寿，请大人赏光！宴上有烤全羊，还有从京城请来的厨子。',
    left: opt('公务繁忙', { heart: 5, people: 3, court: -3 }),
    right: opt('去吃！', { people: -6, money: 6, heart: -6 }),
  },
  {
    id: 'qian_school', who: 'qian',
    text: '鄙人愿捐一千两修学堂，只求学堂名叫「钱氏书院」。门口再立块我的像。',
    left: opt('学堂不冠名', { heart: 5, money: -3 }),
    right: opt('成交', { money: 18, people: 5, heart: -6 }),
  },
  {
    id: 'qian_salt', who: 'qian',
    text: '大人，全县的盐，不如就交给鄙人一家卖？省心，省事，省得您操心。',
    left: opt('不行', { money: -5, people: 10 }),
    right: opt('可以', { money: 15, people: -15 }),
  },
  {
    id: 'qian_opera', who: 'qian',
    text: '鄙人出钱请戏班子唱三天大戏，就说是为了庆贺大人上任。大人只要露个脸。',
    left: opt('省省吧', { people: -5, heart: 4 }),
    right: opt('唱！', { people: 11, court: -6, heart: -3 }),
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
    id: 'sheng_poem', who: 'shusheng',
    text: '学生写了首诗歌颂大人，一共八十八句，可否贴在城门上？',
    left: opt('太肉麻了', { heart: 5, court: -2 }),
    right: opt('贴！大字贴！', { court: 6, people: -6, heart: -5 }),
  },
  {
    id: 'sheng_school', who: 'shusheng',
    text: '县里好多孩子没书念。学生愿意教，能不能开个义学？',
    left: opt('没钱', { people: -10, money: 3 }),
    right: opt('开！', { money: -11, people: 9, heart: 5 }),
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
    left: opt('实在交不出', { court: -14, people: 5 }),
    right: opt('交', { money: -11, court: 10, people: -5 }),
  },
  {
    id: 'zhifu_visit', who: 'zhifu',
    text: '本府下月要来巡视。路要铺平，墙要刷白，百姓要笑。',
    left: opt('保持原样', { court: -10, heart: 5 }),
    right: opt('连夜翻新', { money: -12, court: 14, people: -5 }),
  },
  {
    id: 'zhifu_nephew', who: 'zhifu',
    text: '本府有个侄子，人很老实，就是有点笨。想在你县谋个差事。',
    left: opt('没有空缺', { court: -10, heart: 5 }),
    right: opt('让他当主簿', { court: 10, people: -5, heart: -5 }),
  },
  {
    id: 'zhifu_report', who: 'zhifu',
    text: '你县今年治安如何？写个折子来，本府要往上报。',
    left: opt('如实写', { court: -6, heart: 10 }),
    right: opt('写成太平盛世', { court: 10, heart: -10 }),
  },
  {
    id: 'zhifu_horse', who: 'zhifu',
    text: '本府的马跑丢了，据说跑进了你县。三日之内，给我找回来。',
    left: opt('全县搜马', { court: 10, people: -10 }),
    right: opt('送他一匹新的', { money: -11, court: 6 }),
  },
  {
    id: 'zhifu_poem', who: 'zhifu',
    text: '本府新作一首：「春风吹啊吹，吹到我的腿。」你点评点评？',
    left: opt('实话实说', { court: -14, heart: 10 }),
    right: opt('千古绝唱！', { court: 10, heart: -10 }),
  },
  {
    id: 'zhifu_promote', who: 'zhifu', requires: { stat: { court: [72, 100] } },
    text: '本府要升了，想带一个得力的人去京城。你……想不想去？',
    left: opt('留在县里', { people: 10, court: -10 }),
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
    left: opt('没有心意', { court: -14, heart: 6 }),
    right: opt('早备好了', { money: -11, court: 10 }),
  },

  // —— 狗剩 ——
  {
    id: 'gou_secret', who: 'gousheng',
    text: '大人，给俩铜板，我告诉你一个秘密。保证值！',
    left: opt('去去去', { people: -4 }),
    right: opt('给', { money: -2, heart: 4 }, { flags: { gou_friend: true } }),
  },
  {
    id: 'gou_snow', who: 'gousheng', requires: { season: 'winter' },
    text: '大人，下雪了。城隍庙里的人冻得直哆嗦，我把破棉袄都借出去了。',
    left: opt('各安天命', { heart: -10, people: -4 }),
    right: opt('开粥棚', { money: -9, people: 10, heart: 4 }),
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
    id: 'gou_dream', who: 'gousheng',
    text: '大人，我长大了也想当县令！当县令是不是天天都能吃肉？',
    left: opt('好好读书', { heart: 5, people: 4, money: -3 }),
    right: opt('别当，太累', { heart: 4, court: -4 }),
  },
  {
    id: 'gou_gang', who: 'gousheng',
    text: '大人，城里的乞丐想成立丐帮，选我当帮主！您批不批？',
    left: opt('不许结帮', { court: 5, people: -6 }),
    right: opt('准了', { people: 10, court: -10 }),
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
    right: opt('拨款', { money: -11, people: 11 }),
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
    id: 'hu_rival', who: 'langzhong',
    text: '城里来了个游医，说能治百病，生意都被他抢光了！大人把他赶走吧！',
    left: opt('各凭本事', { people: 6, court: -3 }),
    right: opt('赶走他', { people: -6, court: 4, heart: -4 }),
  },
  {
    id: 'hu_plague', who: 'langzhong', requires: { minDay: 25 },
    text: '大人，城南闹时疫了。得封坊，可百姓不干，说封了没饭吃。',
    left: opt('不封', { people: 8, court: -12 }),
    right: opt('封，官府送饭', { money: -15, people: 6, court: 10 }),
  },

  // —— 和尚 ——
  {
    id: 'chen_roof', who: 'heshang',
    text: '大人，寺里屋顶漏了，佛祖已经淋了三天雨。',
    left: opt('佛祖自有神通', { people: -5, heart: -4 }),
    right: opt('捐香火钱', { money: -10, people: 8, heart: 5 }),
  },
  {
    id: 'chen_omen', who: 'heshang',
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
    id: 'chen_gold', who: 'heshang',
    text: '大人，有人在寺后挖出一尊金佛！这……该归谁？',
    left: opt('归寺庙', { people: 5, heart: 6 }),
    right: opt('充公', { money: 18, people: -10 }),
  },
  {
    id: 'chen_debate', who: 'heshang',
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
    right: opt('开仓放粮', { money: -13, people: 11 }),
  },
  {
    id: 'zhang_ox', who: 'laohan',
    text: '大人，我家牛被老李家的牛顶伤了！您给做主！',
    left: opt('让老李赔钱', { people: 6, heart: -2 }),
    right: opt('牛的事牛管', { people: -10, court: 3 }),
  },
  {
    id: 'zhang_tax', who: 'laohan',
    text: '大人，今年收成不好，能不能少交点税？就少一点点。',
    left: opt('国法如山', { money: 10, people: -10 }),
    right: opt('减三成', { money: -10, people: 11, court: -5 }),
  },
  {
    id: 'zhang_eggs', who: 'laohan',
    text: '大人，这筐鸡蛋您收下，自家鸡下的，可新鲜了。',
    left: opt('心意领了', { people: -2, heart: 5, money: 2 }),
    right: opt('回他一筐米', { money: -6, people: 8 }),
  },
  {
    id: 'zhang_road', who: 'laohan',
    text: '去集上的路太烂了，一下雨，我家驴都不肯出门。',
    left: opt('让驴忍忍', { people: -10 }),
    right: opt('修路', { money: -11, people: 10, court: 4 }),
  },
  {
    id: 'zhang_wolf', who: 'laohan',
    text: '后山有狼！叼走了我家两只鸡，还把第三只吓得不下蛋了！',
    left: opt('鸡没就没了', { people: -10 }),
    right: opt('派人打狼', { money: -5, people: 10 }),
  },
  {
    id: 'zhang_seal', who: 'laohan',
    text: '大人，我孙子抓周，抓的是您落在我家的官印……您看这……',
    left: opt('把印拿回来', { court: 5, people: -3 }),
    right: opt('让他玩会儿', { people: 10, court: -10 }),
  },
  {
    id: 'zhang_lantern', who: 'laohan', requires: { season: 'autumn' },
    text: '大人，中秋了，县里办不办灯会？大伙都盼着呢。',
    left: opt('不办', { money: 5, people: -10 }),
    right: opt('办！', { money: -11, people: 11 }),
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
    right: opt('走！', {}, { ending: 'fox_away' }),
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
    right: opt('立吧立吧', { people: 6, court: -6 }),
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
    right: opt('官仓借种', { money: -10, people: 10, heart: 4 }),
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
    right: opt('设凉茶棚', { money: -8, people: 10 }),
  },
  {
    id: 'summer_river', who: 'butou', requires: { season: 'summer' },
    text: '老爷，河边全是乘凉的，有人把税吏推下水了！',
    left: opt('算他活该', { people: 6, court: -8 }),
    right: opt('抓人', { people: -8, court: 6 }),
  },
  {
    id: 'autumn_feast', who: 'wangpo', requires: { season: 'autumn' },
    text: '收成下来了，村里办酒席。县太爷来不来？来了就得出份子。',
    left: opt('不凑热闹', { people: -6, money: 2 }),
    right: opt('去，出份子', { money: -8, people: 10 }),
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
    right: opt('平价放炭', { money: -12, people: 10, heart: 4 }),
  },
  {
    id: 'winter_bonus', who: 'shiye', requires: { season: 'winter' },
    text: '年关了。衙役们眼巴巴看着您，往年这时候都有过年钱。',
    left: opt('今年没有', { court: -4, people: -6, money: 4 }),
    right: opt('发', { money: -10, court: 6, people: 4 }),
  },

  // —— 仕途：四项稳住时由抽牌逻辑插入，不进普通牌池 ——
  {
    id: 'inspect', who: 'qinchai', career: 'inspect', chainOnly: true,
    text: '吏部派人下来了。你如今是{rank}，四项都还看得过去。这一关，怎么过？',
    left: opt('从容应对', { court: 4, heart: 3 }, { careerResult: 'promote' }),
    right: opt('塞点银子', { money: -22, heart: -14 }, { careerResult: 'promote', risky: true }),
  },
  {
    id: 'heir_ask', who: 'shiye', career: 'heir', chainOnly: true,
    text: '你已是{rank}，今年{age}岁。上面问：这颗印，还自己攥着，还是交出去？',
    left: opt('不立继承人', {}, { ending: 'retire' }),
    right: opt('要立', {}, chain('heir_pick', 0)),
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
    left: opt('被老鼠啃了', { court: -14, people: 4 }),
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
