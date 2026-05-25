/**
 * 《一夜剧本》v2 剧情节点 — 唯一数据源。
 * 裁员 + 三年前的自己；平行蒙太奇；场景统一为高层写字楼。
 */

export const START_ID = 'act1_now';

/** @type {Record<string, object>} */
const NODES = {
  act1_now: {
    id: 'act1_now',
    timeline: 'now',
    chapter: '今夜 · 02:17',
    title: '空办公室的最后一格进度条',
    mode: 'narrative',
    background: '',
    text:
      '裁员风声已经绕楼三圈。你躲进空工位，替自己剪一支三分钟短片——只给三年前的自己看。' +
      '桌上是删了十一遍的稿，U 盘里是入职那年录下的粗剪，卡在「我其实……」。' +
      '屏幕右下角，试用版「AI 编剧」亮着：上传素材，即可续写结局。' +
      '你盯着那行字，像盯着一把别人递来的刀。',
    choices: [
      {
        label: '上传旧素材与未完成的台词',
        next: 'act2_past',
        effect: { statDelta: { aiDepend: 12, stress: 8 } },
      },
      {
        label: '拔掉网线，从第一句重写',
        next: 'act2_past',
        effect: { statDelta: { sincerityNow: 12, aiDepend: -5 } },
      },
    ],
  },
  act2_past: {
    id: 'act2_past',
    timeline: 'past',
    chapter: '三年前 · 夏至',
    title: '入职季的第一次开机',
    mode: 'narrative',
    background: '',
    text:
      '同一栋楼，窗外还没有这么多高架灯。你对着镜头笑得很用力，说这支片子「只给自己看」。' +
      '录到一半，你停住，喉头那句「我其实……」没有说完。' +
      '同事敲门问要不要接客户急单，你看着闪烁的录制灯，第一次知道沉默也会过期。',
    choices: [
      {
        label: '先把真话录进素材',
        next: 'act3_now',
        effect: { statDelta: { sincerityPast: 20 }, setFlags: { secret1Eligible: true } },
      },
      {
        label: '关掉麦，改拍空镜交差',
        next: 'act3_now',
        effect: { statDelta: { sincerityPast: -10, stress: -5 } },
      },
    ],
  },
  act3_now: {
    id: 'act3_now',
    timeline: 'now',
    chapter: '今夜 · 03:38',
    title: '模型给出的完美句号',
    mode: 'narrative',
    background: '',
    text:
      '三十秒后，AI 交出三版结局：反转、金句、眼泪，样样齐全。' +
      '第三版结尾写道：「我从不后悔。」你脊背发凉——三年前的你从没那么说过。' +
      '粗剪里卡在喉头的是「我其实……」，是未尽的歉意，不是励志海报上的口号。' +
      '算法把犹豫补成响亮，把缺席补成漂亮。',
    choices: [
      {
        label: '先用 AI 版顶住答辩',
        next: 'act4_past',
        effect: { statDelta: { aiDepend: 18, sincerityNow: -8 } },
      },
      {
        label: '删掉它的台词，只留节奏',
        next: 'act4_past',
        effect: { statDelta: { aiDepend: 5, sincerityNow: 15 } },
      },
    ],
  },
  act4_past: {
    id: 'act4_past',
    timeline: 'past',
    chapter: '三年前 · 秋分',
    title: '客户第一次改口',
    mode: 'narrative',
    background: '',
    text:
      '客户语音炸进来：「要爽点，要反转。」当年的你把母带拖进回收站，换上模板配乐。' +
      '窗外地铁通风井的风鸣灌进窗缝——城市在运转，你却触不到任何人。' +
      '你看着屏幕上那句「我其实……」被折叠成一行小字，像被塞进抽屉的辞职信。',
    choices: [
      {
        label: '迎合爽点，把闷片改短',
        next: 'act5_now',
        effect: { statDelta: { sincerityPast: -15, stress: 10 } },
      },
      {
        label: '硬留闷片，赌对方能看懂',
        next: 'act5_now',
        effect: { statDelta: { sincerityPast: 12, stress: 15 } },
      },
    ],
  },
  act5_now: {
    id: 'act5_now',
    timeline: 'now',
    chapter: '今夜 · 04:52',
    title: '慢热稿纸与快的客户',
    mode: 'mail',
    background: '',
    text: '你终于给「我其实……」落下后半句。邮箱与 IM 同时亮起。',
    modeParams: {
      pressureSec: 45,
      timeoutNext: 'act6_past',
      threads: [
        {
          from: 'client',
          subject: '明早九点前要成片',
          body: '要爽点，要反转。别跟我谈慢热。',
          replies: [
            {
              label: '回：先用 AI 折中版',
              next: 'act6_past',
              effect: { statDelta: { aiDepend: 10, stress: 12 }, setFlags: { dualVersion: true } },
            },
            {
              label: '回：发慢热原稿',
              next: 'act6_past',
              effect: { statDelta: { sincerityNow: 10, stress: 8 } },
            },
          ],
        },
        {
          from: 'hr',
          subject: '末次答辩材料',
          body: '请于 10:00 前提交成片链接与说明。',
          replies: [
            {
              label: '回：收到，仍在渲染',
              next: 'act6_past',
              effect: { statDelta: { stress: 5 } },
            },
          ],
        },
      ],
    },
    choices: [],
  },
  act6_past: {
    id: 'act6_past',
    timeline: 'past',
    chapter: '三年前 · 冬至',
    title: '署名栏第一次闪烁',
    mode: 'narrative',
    background: '',
    text:
      '渲染完成那晚，署名栏在「联合创作 · 协助剪辑」与你的姓名之间闪烁。' +
      '你想起镜头里那个没说完的「我其实……」，想起客户说的「别扫兴」。' +
      '电梯厅显示屏滚动「今日天气：雨」——你还没离开这栋楼，故事却已被改成别人的口味。',
    choices: [
      {
        label: '署自己名，把协助藏起来',
        next: 'act7_now',
        effect: { statDelta: { sincerityPast: -8, aiDepend: 5 } },
      },
      {
        label: '如实标注协作',
        next: 'act7_now',
        effect: { statDelta: { sincerityPast: 10, sincerityNow: 5 } },
      },
    ],
  },
  act7_now: {
    id: 'act7_now',
    timeline: 'now',
    chapter: '今夜 · 05:56',
    title: '渲染队列里的 HR 抄送',
    mode: 'qte',
    background: '',
    text:
      '渲染进度停在 99%。HR 邮件抄送栏亮起。楼道感应灯一盏盏亮——保洁推车经过，水桶撞地。' +
      '发布键在指尖下，像一枚硬币：一面是工牌，一面是三年前那个还没被改写的你。',
    modeParams: {
      pressureSec: 50,
      progressLabel: '渲染 99%',
      beats: [
        { at: 0.52, windowMs: 900, label: '点住节拍 · 冲过 99%' },
        { at: 0.78, windowMs: 750, label: '再打一次节拍' },
      ],
      successNext: 'act8_past',
      failNext: 'act8_past',
    },
    choices: [],
  },
  act8_past: {
    id: 'act8_past',
    timeline: 'past',
    chapter: '三年前 · 凌晨',
    title: '硬盘里未发送的那版',
    mode: 'archive',
    background: '',
    text: '你打开「未发送」文件夹。勾选要带进今夜的素材。',
    modeParams: {
      tiles: [
        { id: 'truth_line', label: '「我其实……」原声', keep: true },
        { id: 'broll_city', label: '窗外车流空镜', keep: false },
        { id: 'ai_tag', label: '协助剪辑标注', keep: false },
      ],
      successNext: 'act9_now',
    },
    choices: [],
  },
  act9_now: {
    id: 'act9_now',
    timeline: 'now',
    chapter: '今夜 · 06:08',
    title: '双时间线叠在同一预览窗',
    mode: 'edit',
    background: '',
    text: '预览窗里，上轨与下轨重叠。删留每一句，决定今夜发布什么声音。',
    modeParams: {
      clips: [
        { id: 'c1', text: '我从不后悔。', ai: true },
        { id: 'c2', text: '我其实……想对三年前的自己说实话。', ai: false },
        { id: 'c3', text: '感谢团队，感谢这座城市。', ai: true },
      ],
      successNext: 'act10_gate',
    },
    choices: [],
  },
  act10_gate: {
    id: 'act10_gate',
    timeline: 'now',
    chapter: '今夜 · 06:22',
    title: '走出旋转门之前',
    mode: 'narrative',
    background: '',
    text:
      '电梯厅显示屏滚动「今日天气：晴」。你还有最后一次点击。' +
      '不是为客户，不是为 HR——是为你是否还敢把三年前那句真话，和今夜这支片子一起发布。',
    choices: [
      {
        label: '发布并如实标注人机共创',
        next: 'ending_a',
        effect: { statDelta: { sincerityNow: 15 }, setFlags: { honestPublish: true } },
      },
      {
        label: '发布但不提 AI，先换答辩',
        next: 'ending_b',
        effect: { statDelta: { aiDepend: 12, sincerityNow: -10 } },
      },
      {
        label: '按这一路的选择收尾',
        next: '__resolve_ending__',
        effect: {},
      },
    ],
  },
  ending_a: {
    id: 'ending_a',
    timeline: 'now',
    chapter: '结局 · 诚实',
    title: '你选择了署名里的真相',
    mode: 'narrative',
    background: '',
    endingStyle: 'hope',
    isEnding: true,
    text:
      '你按下发布。简介里写着：「文本：人机共创；情感：人。」播放量缓慢爬升，评论撕裂——有人骂 AI 味，有人私信：「删掉那句口号后，我才敢面对自己的三年前。」' +
      '你收拾背包走进电梯，镜面里一张熬红的脸。大堂旋转门推开，潮气扑面。' +
      '你没有成为一夜封神的人，但你没有把过去的自己改成算法喜欢的样子。' +
      '东方既白，你站在大楼阴影与晨光交界处——一夜不够写完一生，够你决定：谁有资格替你说完最后一句话。',
    choices: [],
  },
  ending_b: {
    id: 'ending_b',
    timeline: 'now',
    chapter: '结局 · 隐瞒',
    title: '你选择了流量里的沉默',
    mode: 'narrative',
    background: '',
    endingStyle: 'warning',
    isEnding: true,
    text:
      '你没有标注。短片上了热门，品牌方转发了你，群里刷屏「一夜封神」。' +
      '答辩邮件回：「材料已收。」你仍在办公室喝冷掉的咖啡——窗外天亮了，灯却没必要关。' +
      '你跟着笑，喉咙发紧：封神的是模型，你偷换的是三年前那句没说完的实话。' +
      '凌晨两点，你梦见屏幕里的自己问：「那句『我从不后悔』，是谁写的？」你醒在转椅里，答不上来。',
    choices: [],
  },
  ending_c: {
    id: 'ending_c',
    timeline: 'now',
    chapter: '结局 · 妥协',
    title: '你选择了两个自己',
    mode: 'narrative',
    background: '',
    endingStyle: 'warning',
    isEnding: true,
    text:
      '你追加 AI 剪辑版。数据回升，团队松口气，HR 抄送：「答辩延期至下午。」' +
      '两个版本并排躺在服务器：一个里你像营销案例，一个里你像自己都不敢多看的人。' +
      '你关掉显示器，办公室只剩主机风扇声。快的是点击率，不是原谅。' +
      '你走出大楼，日头已高，影子却比平时更长——像有人替你活了一个更讨巧的结局，而你留在原地。',
    choices: [],
  },
  ending_d: {
    id: 'ending_d',
    timeline: 'now',
    chapter: '结局 · 坚守',
    title: '你选择了慢的那一条',
    mode: 'narrative',
    background: '',
    endingStyle: 'hope',
    isEnding: true,
    text:
      '数据惨淡，播放量停在三位数。但有一条长评沉在底部：「像一封没寄出的信，读到最后一句才想起自己也曾年轻。」' +
      '你把工程文件存进 U 盘，文件名是三年前的项目代号。电梯下行时，轿厢镜面映出你憔悴而平静的脸。' +
      '一楼大堂汇入上班人流——他们不知道你刚和谁说完最后一句话。' +
      '作品或许不会被记住，但那句「我其实……」是真的——是你肯为自己，拒绝捷径之后，仍然敢留下的那一句。',
    choices: [],
  },
  ending_secret_1: {
    id: 'ending_secret_1',
    timeline: 'now',
    chapter: '隐藏 · 未发送的补全',
    title: '你把三年前那句说完了',
    mode: 'narrative',
    background: '',
    endingStyle: 'hope',
    isEnding: true,
    text:
      '你选用底片轨，没有 AI 口号。三年前卡在喉头的那句，终于在今夜和尾声一起落地。' +
      '播放量不高，但有一条私信：「我好像也听见了以前的自己。」' +
      '裁员邮件仍在收件箱，你却第一次睡得着——不是因为赢，而是因为没再把真话删掉。',
    choices: [],
  },
  ending_secret_2: {
    id: 'ending_secret_2',
    timeline: 'now',
    chapter: '隐藏 · 亮着的工牌',
    title: '你留住了工位，没留住那句话',
    mode: 'narrative',
    background: '',
    endingStyle: 'warning',
    isEnding: true,
    text:
      '全 AI 交差。答辩通过，工牌还在，灯还亮着。' +
      '你点开成片，听见屏幕里一个陌生的自己说「我从不后悔」——流利、响亮、不像你。' +
      '城市照常运转。只有你知道：有些分叉不会出现在 HR 系统里，只会长在胃里。',
    choices: [],
  },
};

/**
 * @param {string} id
 * @returns {object|null}
 */
export function getNode(id) {
  if (!id || !NODES[id]) {
    return null;
  }
  return NODES[id];
}

/**
 * @param {string} id
 * @returns {number} 1～10 幕进度
 */
export function getActProgress(id) {
  if (!id) {
    return 1;
  }
  const m = id.match(/act(\d+)/);
  if (m) {
    return Math.min(10, parseInt(m[1], 10));
  }
  if (id.startsWith('ending')) {
    return 10;
  }
  return 1;
}
