# 路数骨骼与一任成史 · 实施计划

> **For agentic workers:** 按任务推进；用户未要求则不 commit。游戏名《县太爷今天也很忙》不改。

**Goal:** 落地终极方案第一～三期可玩切片：五路数塑牌面、定性大事件、人物 bond 弧（先做核心角色）、县域标签与局内改任，并模拟调平衡。

**Architecture:** `js/game/paths.js` 管路数；`run.js` 的 `choose`/`isEligible`/`takeRegular` 接入 path/bond/county；内容在 `cards.js`/`endings.js`/`echoes.js`；存档在 `slots.js`。

**Tech Stack:** 现有 ES modules + `node --test`；纯逻辑无 wx。

---

### Task 1: 路数核心 API + 测试

**Files:** Create `js/game/paths.js`；Modify `js/game/run.js`, `js/game/slots.js`；Test `tests/run.test.js`

- [ ] emptyPaths / applyPathDelta / pathTier / cardPathWeight
- [ ] createRun 带 paths；choose 吃 opt.path；≥3/≥6 notice 各一次
- [ ] takeRegular 按路数加权；requires.minPath

### Task 2: 五条定性链 + 结局

**Files:** `js/data/cards.js`, `endings.js`, `echoes.js`, `rules.js`

- [ ] 清正/贪墨/乐逸/武备/权谋定性链（可接现有链）
- [ ] 每条路至少 2 收场；opt 打上 path 增量
- [ ] 规矩一句话

### Task 3: bond + 核心人物弧

**Files:** `run.js`, `cards.js`, `echoes.js`

- [ ] bonds 存档；opt.bond；requires.bond
- [ ] 王婆/钱满仓/孙不二 各 4 拍弧

### Task 4: 县域 + 局内改任

**Files:** `run.js`, `cards.js`, `endings.js`

- [ ] county 标签；requires.county
- [ ] careerResult retitle：降回县令、换县面、路数减半、一局一次

### Task 5: 模拟平衡

**Files:** 临时 `tests/width-sim.mjs`（测完删除）

- [ ] 40～100 局分布；调权重/伤害；npm test 全绿
