# collab/：蛋蛋島 × 小窩 聯名工作區（Claude B）

這個資料夾**不會被小窩載入**（index.html 的 NEST_JS 沒有它），放在這裡的都是待審的草稿、測試和交接資料。
進度看根目錄的 [DEVELOPMENT_PROGRESS_B.md](../DEVELOPMENT_PROGRESS_B.md)。

| 路徑 | 內容 |
|---|---|
| `INVENTORY_EGG_ISLAND.md` | 蛋蛋島盤點：230 關、44 站、素材、衣櫃、12 個候選主題對照 |
| `HANDOFF_B_TO_A.md` | 需要 Claude A 配合的事（請使用者轉交） |
| `nest/collab-moon.js` | 月亮島四件樣品：夜燈（家具）、小模型、徽章（土產）、旅行地點（三張明信片和所有台詞） |
| `nest/collab-hook-furn.js`、`nest/collab-hook-trip.js` | 接進小窩的寫法（草稿，A 核准後接） |
| `egg-island/*.patch`、`*.bundle` | 蛋蛋島的修改（推不上 BONK520/shubing 之前先放這裡） |
| `tests/nest_room_mix.cjs` | 小窩真實房間混搭測試（不改小窩檔案，用攔截插入） |
| `tests/egg_closet_collab.cjs` | 蛋蛋島衣櫃聯名預覽測試 |
| `shots/` | 測試截圖 |

## 跑測試

```bash
cd /home/user/shubing-nest && python3 -m http.server 8765
```

```bash
node collab/tests/nest_room_mix.cjs collab/shots
```

蛋蛋島那一個要先在蛋蛋島 repo（分支 `claude/collab-b-nest-1128`）根目錄開 `python3 -m http.server 8766`，再跑：

```bash
node collab/tests/egg_closet_collab.cjs collab/shots
```

## 把蛋蛋島的修改套上去（還沒授權推送時）

在蛋蛋島 repo 裡：

```bash
git fetch /path/to/shubing-nest/collab/egg-island/collab-b-nest-1128.bundle claude/collab-b-nest-1128:claude/collab-b-nest-1128
```

或用 patch：`git am collab/egg-island/0001-map-moon-fix.patch collab/egg-island/0002-collab-nest-cosmetics.patch`（基準 `b692938`）。
