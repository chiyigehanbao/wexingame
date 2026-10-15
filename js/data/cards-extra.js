/**
 * 第四期加厚：史册回声、人物弧、县域、乐逸/权谋。
 * 由 cards.js 合并进 CARDS。
 */

const opt = (label, fx = {}, extra = {}) => ({ label, fx, ...extra });
const chain = (id, delay = 3) => ({ chain: { id, delay } });

export const EXTRA_CARDS = [
  // —— 史册回声 ——
  {
    id: 'echo_school', who: 'shusheng', once: true, weight: 3, requires: { world: { school: 1 }, minRuns: 1 },
    text: '上一任办的学还在。学生们堵在门口，请你题一块新匾。',
    left: opt('题匾', { people: 4, heart: 2 }, { path: { clean: 1 }, world: { school: 1 } }),
    right: opt('改成钱仓', { money: 6, people: -4, heart: -3 }, { path: { graft: 1 } }),
  },
  {
    id: 'echo_bridge', who: 'laohan', once: true, weight: 3, requires: { world: { bridge: 1 }, minRuns: 1 },
    text: '上一任修的桥又松了。张老汉说：要么补，要么大家继续跳。',
    left: opt('补桥', { money: -6, people: 6 }, { path: { clean: 1 }, world: { bridge: 1 } }),
    right: opt('先跳着', { people: -5, heart: -2 }, { path: { pleasure: 1 } }),
  },
  {
    id: 'echo_granary', who: 'shiye', once: true, weight: 2, requires: { world: { granary: 1 }, minRuns: 1 },
    text: '上一任留下的义仓还在。今年要不要开仓赈一赈？',
    left: opt('开仓', { money: -4, people: 8, heart: 3 }, { path: { clean: 1 } }),
    right: opt('先锁着', { money: 3, people: -3 }, { path: { graft: 1 } }),
  },
  {
    id: 'echo_plaque', who: 'wangpo', once: true, weight: 2, requires: { world: { plaque: 1 }, minRuns: 1 },
    text: '城门口还有上一任的清名匾。有人要你换掉，有人说留着压邪。',
    left: opt('留着', { people: 3, heart: 2 }, { path: { clean: 1 } }),
    right: opt('换掉', { court: 3, heart: -2 }, { path: { scheme: 1 } }),
  },
  {
    id: 'echo_wangpo_friend', who: 'wangpo', once: true, weight: 2, requires: { world: { people: { wangpo: 'friend' } }, minRuns: 1 },
    text: '王婆一见你就笑：上一任跟她交情好。她手里又有一条能帮你的消息。',
    left: opt('听她的', { court: 3, money: -2 }, { bond: { who: 'wangpo', d: 1 }, path: { scheme: 1 } }),
    right: opt('自己断', { heart: 2 }, { path: { clean: 1 } }),
  },
  {
    id: 'echo_wangpo_foe', who: 'wangpo', once: true, weight: 2, requires: { world: { people: { wangpo: 'foe' } }, minRuns: 1 },
    text: '王婆认你是新官，可眼神冷：上一任伤过她。她说，闲话已经传到府里了。',
    left: opt('赔个不是', { money: -4, court: 2 }, { bond: { who: 'wangpo', d: 1 }, path: { scheme: 1 } }),
    right: opt('随她去', { court: -4, heart: 2 }, { bond: { who: 'wangpo', d: -1 }, path: { clean: 1 } }),
  },
  {
    id: 'echo_shiye_foe', who: 'gousheng', once: true, weight: 2, requires: { world: { people: { shiye: 'foe' } }, minRuns: 1 },
    text: '狗剩说，上一任把师爷逼走了。现在账房里坐着生人，账对不上。',
    left: opt('重聘熟手', { money: -5, court: 3 }, { path: { scheme: 1 } }),
    right: opt('自己盯账', { heart: 3, court: -2 }, { path: { clean: 1 } }),
  },
  {
    id: 'echo_salt', who: 'yanshang', once: true, weight: 2, requires: { world: { salt: 1 }, minRuns: 1 }, county: ['salt', 'poor'],
    text: '盐商说，上一任把盐引交给了私人。要续约，还是收回官卖？',
    left: opt('收回官卖', { people: 5, money: -4 }, { path: { clean: 1 } }),
    right: opt('续约', { money: 10, people: -4 }, { path: { graft: 1 }, world: { salt: 1 } }),
  },

  // —— 人物弧：捕头 / 书生 / 老汉 / 和尚 / 郎中 / 狗剩 / 知府 / 狐仙 ——
  {
    id: 'arc_butou_1', who: 'butou', once: true, weight: 2, paths: ['arms'],
    text: '赵捕头把刀拍在公案上：山上有窝匪，他愿带人去，只要你点头。',
    left: opt('点头', { money: -4, people: 4 }, { troops: 8, bond: { who: 'butou', d: 1 }, path: { arms: 2 }, chain: { id: 'arc_butou_2', delay: 5 } }),
    right: opt('先按住', { court: 2 }, { bond: { who: 'butou', d: -1 }, path: { scheme: 1 } }),
  },
  {
    id: 'arc_butou_2', who: 'butou', chainOnly: true,
    text: '匪巢破了。有人说他私藏了赃银。你信他，还是搜他的营？',
    left: opt('信他', { heart: 3, court: -2 }, { bond: { who: 'butou', d: 1 }, path: { arms: 1 }, chain: { id: 'arc_butou_3', delay: 4 } }),
    right: opt('搜营', { court: 4, heart: -3 }, { bond: { who: 'butou', d: -2 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_butou_3', who: 'butou', chainOnly: true,
    text: '他后来把一支亲兵名单递给你：真出事，这些人听你的。',
    left: opt('收下', { court: -2 }, { troops: 6, bond: { who: 'butou', d: 1 }, path: { arms: 1 }, chain: { id: 'arc_butou_4', delay: 5 } }),
    right: opt('退回', { heart: 3, court: 2 }, { bond: { who: 'butou', d: 1 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_sheng_1', who: 'shusheng', once: true, weight: 2, paths: ['clean'],
    text: '白小舟第几次来借盘缠了。这次他说：不借也行，求你给义学写个名。',
    left: opt('写上名', { heart: 3, people: 2 }, { bond: { who: 'shusheng', d: 1 }, path: { clean: 1 }, world: { school: 1 }, chain: { id: 'arc_sheng_2', delay: 6 } }),
    right: opt('不写', { money: 2 }, { bond: { who: 'shusheng', d: -1 } }),
  },
  {
    id: 'arc_sheng_2', who: 'shusheng', chainOnly: true,
    text: '他中了一点小功名，回来要在县里办册。办了，你的名字会写进去。',
    left: opt('办册', { court: 3, people: 3 }, { bond: { who: 'shusheng', d: 1 }, path: { clean: 1 }, chain: { id: 'arc_sheng_3', delay: 4 } }),
    right: opt('别办', { heart: -2 }, { bond: { who: 'shusheng', d: -1 } }),
  },
  {
    id: 'arc_sheng_3', who: 'shusheng', chainOnly: true,
    text: '册子写好了。他问：要写成德政，还是写成实录——连你不爱听的也写？',
    left: opt('写成德政', { court: 5, heart: -3 }, { path: { scheme: 1 } }),
    right: opt('写成实录', { heart: 5, court: -2 }, { path: { clean: 1 }, chain: { id: 'arc_sheng_4', delay: 5 } }),
  },
  {
    id: 'arc_laohan_1', who: 'laohan', once: true, weight: 2, county: ['flood', 'poor'],
    text: '张老汉又来告状：邻村田埂占了他家三分地。这次他带了全族。',
    left: opt('亲自勘', { people: 5, court: 2 }, { bond: { who: 'laohan', d: 1 }, path: { clean: 1 }, chain: { id: 'arc_laohan_2', delay: 5 } }),
    right: opt('让里正去', { people: -3 }, { bond: { who: 'laohan', d: -1 }, path: { pleasure: 1 } }),
  },
  {
    id: 'arc_laohan_2', who: 'laohan', chainOnly: true,
    text: '勘完了。他请你喝米酒，酒里有话：明年河工，他能喊来人手。',
    left: opt('记下', { people: 3 }, { bond: { who: 'laohan', d: 1 }, path: { clean: 1 }, chain: { id: 'arc_laohan_3', delay: 6 } }),
    right: opt('客气推开', { heart: 2 }, { bond: { who: 'laohan', d: -1 } }),
  },
  {
    id: 'arc_laohan_3', who: 'laohan', chainOnly: true,
    text: '河真的涨了。他带着人站在堤上，等你一句话。',
    left: opt('上堤', { money: -5, people: 8, heart: 3 }, { bond: { who: 'laohan', d: 1 }, path: { clean: 1 }, world: { dyke: 1 }, countyAdd: 'flood', chain: { id: 'arc_laohan_4', delay: 6 } }),
    right: opt('坐堂指挥', { people: 2, court: 2 }, { path: { scheme: 1 } }),
  },
  {
    id: 'arc_heshang_1', who: 'heshang', once: true, weight: 2,
    text: '了尘说寺里缺一座钟。化缘化不到，想请衙门出一点。',
    left: opt('出一点', { money: -5, people: 3 }, { bond: { who: 'heshang', d: 1 }, path: { clean: 1 }, chain: { id: 'arc_heshang_2', delay: 5 } }),
    right: opt('佛门自清', { heart: 2 }, { bond: { who: 'heshang', d: -1 } }),
  },
  {
    id: 'arc_heshang_2', who: 'heshang', chainOnly: true,
    text: '钟铸好了。夜里他来报：庙里藏过一个逃役的。交出去，还是留一夜？',
    left: opt('留一夜', { heart: 4, court: -3 }, { bond: { who: 'heshang', d: 1 }, path: { scheme: 1 }, chain: { id: 'arc_heshang_3', delay: 4 } }),
    right: opt('交出去', { court: 4, heart: -3 }, { bond: { who: 'heshang', d: -1 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_heshang_3', who: 'heshang', chainOnly: true,
    text: '那人走了。了尘送你一串念珠：说是压邪，其实是欠你的人情。',
    left: opt('收下', { heart: 3 }, { bond: { who: 'heshang', d: 1 }, chain: { id: 'arc_heshang_4', delay: 5 } }),
    right: opt('退回', { court: 2 }, { path: { clean: 1 } }),
  },
  {
    id: 'arc_lang_1', who: 'langzhong', once: true, weight: 2, paths: ['pleasure'],
    text: '胡一针说城里时疫将起。封巷隔离，生意会冷；不封，人会倒。',
    left: opt('封巷', { money: -4, people: 5, heart: 3 }, { bond: { who: 'langzhong', d: 1 }, path: { clean: 1 }, chain: { id: 'arc_lang_2', delay: 5 } }),
    right: opt('先看着', { money: 2, people: -3 }, { bond: { who: 'langzhong', d: -1 }, path: { pleasure: 1 } }),
  },
  {
    id: 'arc_lang_2', who: 'langzhong', chainOnly: true,
    text: '疫压下去了。他开价：要一间官医署，名字写他。',
    left: opt('给署', { money: -6, people: 4 }, { bond: { who: 'langzhong', d: 1 }, path: { clean: 1 }, chain: { id: 'arc_lang_3', delay: 4 } }),
    right: opt('不给名', { heart: 2, court: -2 }, { bond: { who: 'langzhong', d: -1 } }),
  },
  {
    id: 'arc_lang_3', who: 'langzhong', chainOnly: true,
    text: '署挂上了。他私下问：青楼那边的病号，要不要他也管一管？',
    left: opt('让他管', { people: 2, heart: 2 }, { path: { clean: 1 }, chain: { id: 'arc_lang_4', delay: 5 } }),
    right: opt('别掺和', { money: 2 }, { path: { pleasure: 1 } }),
  },
  {
    id: 'arc_gou_1', who: 'gousheng', once: true, weight: 2, paths: ['scheme'],
    text: '狗剩两个铜板卖消息：今夜有人要砸钱家的祠堂。',
    left: opt('买下', { money: -2, court: 2 }, { bond: { who: 'gousheng', d: 1 }, path: { scheme: 2 }, chain: { id: 'arc_gou_2', delay: 3 } }),
    right: opt('不信', { heart: 1 }, { bond: { who: 'gousheng', d: -1 } }),
  },
  {
    id: 'arc_gou_2', who: 'gousheng', chainOnly: true,
    text: '消息是真的。人抓了。他要你给他一件捕快号衣，好进衙门混饭。',
    left: opt('给号衣', { people: -2, court: 2 }, { bond: { who: 'gousheng', d: 1 }, path: { scheme: 1 }, chain: { id: 'arc_gou_3', delay: 5 } }),
    right: opt('给铜板', { money: -3, heart: 2 }, { bond: { who: 'gousheng', d: 1 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_gou_3', who: 'gousheng', chainOnly: true,
    text: '他穿着号衣在街口晃。有人认他是眼线，有人当他是官差。',
    left: opt('收回号衣', { court: 2 }, { path: { clean: 1 } }),
    right: opt('继续用', { court: -2 }, { path: { scheme: 1 }, bond: { who: 'gousheng', d: 1 }, chain: { id: 'arc_gou_4', delay: 4 } }),
  },
  {
    id: 'arc_zhifu_1', who: 'zhifu', once: true, weight: 2, requires: { minRank: 1 }, paths: ['scheme'],
    text: '知府来信：他过寿，要你亲自去，还要带一份「看得过去」的礼。',
    left: opt('厚礼去', { money: -10, court: 8 }, { bond: { who: 'zhifu', d: 1 }, path: { graft: 1, scheme: 1 }, chain: { id: 'arc_zhifu_2', delay: 6 } }),
    right: opt('薄礼去', { money: -4, court: -2, heart: 3 }, { bond: { who: 'zhifu', d: -1 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_zhifu_2', who: 'zhifu', chainOnly: true,
    text: '寿宴上他醉了，拉着你说：邻县缺人，他能荐你去——也可以把你按在这儿。',
    left: opt('求荐', { court: 4 }, { bond: { who: 'zhifu', d: 1 }, path: { scheme: 1 }, chain: { id: 'arc_zhifu_3', delay: 4 } }),
    right: opt('按在这儿', { heart: 2, people: 2 }, { path: { clean: 1 } }),
  },
  {
    id: 'arc_zhifu_3', who: 'zhifu', chainOnly: true,
    text: '荐书写了一半。他改口：再送一笔，荐书就发。',
    left: opt('再送', { money: -8, court: 5 }, { path: { graft: 1, scheme: 1 }, careerResult: 'skip' }),
    right: opt('不送了', { heart: 3, court: -3 }, { path: { clean: 1 }, chain: { id: 'arc_zhifu_4', delay: 5 } }),
  },
  {
    id: 'arc_fox_1', who: 'huxian', once: true, weight: 2, requires: { minDay: 40 },
    text: '西巷白衣姑娘又来了。这次不只要烧鸡，还问你：敢不敢跟她走一趟山里。',
    left: opt('跟一趟', { heart: 2 }, { bond: { who: 'huxian', d: 1 }, path: { pleasure: 1 }, chain: { id: 'arc_fox_2', delay: 4 } }),
    right: opt('公务在身', { court: 2 }, { bond: { who: 'huxian', d: -1 }, path: { clean: 1 } }),
  },
  {
    id: 'arc_fox_2', who: 'huxian', chainOnly: true,
    text: '山里她把真相说破：她是狐，她乏了。留下陪你，或带你离开这小小衙门。',
    left: opt('留下陪', { heart: 4, people: 2 }, { bond: { who: 'huxian', d: 1 }, path: { pleasure: 1 }, chain: { id: 'arc_fox_3', delay: 5 } }),
    right: opt('跟她走', { heart: 2 }, { chain: { id: 'fox_bow', delay: 3 } }),
  },
  {
    id: 'arc_fox_3', who: 'huxian', chainOnly: true,
    text: '她留在西巷。夜里帮你托过一回梦：哪本账是假的。信不信？',
    left: opt('信', { money: 5, heart: -2 }, { path: { scheme: 1 }, chain: { id: 'arc_fox_4', delay: 5 } }),
    right: opt('不靠这个', { heart: 3 }, { path: { clean: 1 } }),
  },

  // —— 县域加厚 ——
  {
    id: 'county_salt_tax', who: 'yanshang', once: true, weight: 2, county: ['salt'], paths: ['graft'],
    text: '盐商说私盐贩子疯了。加巡，要钱；睁眼，要心。',
    left: opt('加巡', { money: -6, people: 4 }, { path: { clean: 1 }, countyAdd: 'salt' }),
    right: opt('睁眼', { money: 8, heart: -4 }, { path: { graft: 1 }, world: { salt: 1 } }),
  },
  {
    id: 'county_salt_well', who: 'laohan', once: true, weight: 2, county: ['salt', 'poor'],
    text: '盐井塌了一口。灶户要衙门出钱，盐商说与官家无关。',
    left: opt('官家出', { money: -7, people: 6 }, { path: { clean: 1 } }),
    right: opt('盐商出', { people: 2, court: -3 }, { path: { scheme: 1 }, bond: { who: 'yanshang', d: -1 } }),
  },
  {
    id: 'county_border_post', who: 'butou', once: true, weight: 2, county: ['border'], paths: ['arms'],
    text: '边哨缺粮。补上，兵稳；不补，人可能跑去对面。',
    left: opt('补粮', { money: -6, court: 3 }, { troops: 6, path: { arms: 1 }, courtShift: { bianjing: -4 } }),
    right: opt('先欠着', { money: 2, court: -3 }, { path: { scheme: 1 }, courtShift: { bianjing: 4 } }),
  },
  {
    id: 'county_border_market', who: 'linling', once: true, weight: 2, county: ['border', 'poor'],
    text: '邻县令来信：两边开互市，税对半分。你开不开？',
    left: opt('开互市', { money: 6, people: 3 }, { path: { scheme: 1 }, countyAdd: 'border' }),
    right: opt('不开', { court: 2 }, { path: { clean: 1 } }),
  },
  {
    id: 'county_flood_dyke', who: 'laohan', once: true, weight: 2, county: ['flood'],
    text: '堤要加高。加高要银子，不加高，秋天可能没了。',
    left: opt('加高', { money: -9, people: 5, heart: 2 }, { path: { clean: 1 }, world: { dyke: 1 } }),
    right: opt('赌一把', { money: 2, people: -4 }, { path: { pleasure: 1 } }),
  },
  {
    id: 'county_school_exam', who: 'shusheng', once: true, weight: 2, county: ['school'],
    text: '学县开考前，有人塞卷子。抓，得罪士绅；放，污了这一科。',
    left: opt('抓', { court: -3, heart: 5, people: 3 }, { path: { clean: 1 } }),
    right: opt('装没看见', { court: 4, heart: -5 }, { path: { graft: 1 } }),
  },
  {
    id: 'county_chaos_curfew', who: 'butou', once: true, weight: 2, county: ['chaos'], paths: ['arms'],
    text: '乱县要不要宵禁？禁了，民怨；不禁，刀声一夜不停。',
    left: opt('宵禁', { people: -4, court: 4 }, { troops: 4, path: { arms: 1 } }),
    right: opt('不禁', { people: 2, court: -3 }, { path: { pleasure: 1 } }),
  },
  {
    id: 'county_poor_relief', who: 'wangpo', once: true, weight: 2, county: ['poor'],
    text: '冬月到了。王婆说城里有人卖儿。赈，库空；不赈，名声臭。',
    left: opt('开赈', { money: -8, people: 9, heart: 4 }, { path: { clean: 1 } }),
    right: opt('记到册上', { money: 2, people: -5, heart: -3 }, { path: { graft: 1 } }),
  },

  // —— 乐逸 / 权谋加厚 ——
  {
    id: 'menzi_song', who: 'menzi', once: true, weight: 3, paths: ['pleasure'],
    text: '门子说后堂来了个唱曲的，专等大人散了堂。状纸还有一叠。',
    left: opt('去听', { court: -3, heart: 3, money: -2 }, { path: { pleasure: 2 } }),
    right: opt('把人送走', { court: 2 }, { path: { clean: 1 } }),
  },
  {
    id: 'menzi_sick', who: 'menzi', once: true, weight: 2, paths: ['pleasure'],
    text: '门子替你回：大人身子不爽，今日不见客。真装病，还是真躺一天？',
    left: opt('真躺一天', { court: -4, heart: 4 }, { path: { pleasure: 2 } }),
    right: opt('撑着升堂', { court: 3, heart: -2 }, { path: { clean: 1 } }),
  },
  {
    id: 'scheme_letter', who: 'shiye', once: true, weight: 2, paths: ['scheme'], requires: { minDay: 24 },
    text: '两封密信同时到：一封劝你跟府里，一封劝你跟京里某位。',
    left: opt('跟府里', { court: 4, money: -4 }, { path: { scheme: 2 } }),
    right: opt('跟京里', { court: 2, money: -6, heart: -2 }, { path: { scheme: 2, graft: 1 } }),
  },
  {
    id: 'scheme_leak', who: 'gousheng', once: true, weight: 2, paths: ['scheme'],
    text: '狗剩说有人要把你昨夜的酒桌上的话捅到府里。封口要银子。',
    left: opt('封口', { money: -5 }, { path: { scheme: 2, graft: 1 } }),
    right: opt('让他捅', { heart: 3, court: -4 }, { path: { clean: 1 } }),
  },
  {
    id: 'echo_dyke', who: 'laohan', once: true, weight: 2, requires: { world: { dyke: 1 }, minRuns: 1 },
    text: '上一任加高的堤还在。今年要不要再培一层？',
    left: opt('再培', { money: -5, people: 4 }, { path: { clean: 1 }, world: { dyke: 1 } }),
    right: opt('够了', { money: 2 }, { path: { pleasure: 1 } }),
  },
];
