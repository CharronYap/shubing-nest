# AI 寫的娃娃信（第一階段）

娃娃的信原本都是寫好的範本（`js/mail.js` 的 `MAIL_TPL`）。2026-11-26 範本從每種 2 個版本擴充到 4 到 14 個，不用 API、所有人都收得到，光靠範本就能玩很久。這份文件講的是另外多出來的一條路：輪到娃娃寫信時，先請 Claude 用那隻娃娃的口氣寫一封新的，拿不到才用範本。

**現在的狀態（2026-11-26）：程式寫好了，還沒上線。** `js/mailai.js` 裡的 `MAIL_AI_URL` 是空的，所以每個人收到的還是範本，跟以前一樣。照下面「上線步驟」做完才會開始有 AI 寫的信。

## 怎麼運作

```
遊戲（瀏覽器）
  │  輪到娃娃寫信，而且這個人有登入雲端帳號
  ▼
Cloudflare Worker（worker/ 資料夾）
  │  1. 確認是小窩登入的玩家（檢查 Firebase 的登入憑證）
  │  2. 看今天的名額還有沒有（一人一天 3 封、全部的人一天 200 封）
  │  3. 帶著 API 金鑰去問 Claude（Haiku 5.5）
  ▼
Claude 寫好 → Worker 檢查長度和符號 → 傳回遊戲 → 放進信箱
```

- API 金鑰只存在 Cloudflare 的密碼欄，不在網頁裡，也不在這個 repo 裡。這個 repo 是公開的，金鑰絕對不能寫進任何檔案。
- 只有四種信會問 AI：「你好」「一起做了 N 件事」「來小窩滿 N 年」「你不在的時候」。朋友送娃娃的信、過夜日記、「小窩更新了」照原本的寫法。
- 標題、附件、薯餅最後一行睡著、龍龍的葉子、史努比的小說章節、皮蛋的拖鞋都照原本的做法，AI 只換信的內文。史努比的 AI 只寫開場白，小說章節還是固定的那十章。
- 沒登入的人（訪客）一律用範本。
- 沒網路、Worker 壞掉、名額用完、Claude 沒回、等超過 20 秒，都會自動改用範本。玩的人不會看到錯誤，只是那封信是範本寫的。
- 登入的人打開遊戲時，信會晚幾秒才出現在信箱（等 Claude 寫）。
- AI 寫的字跟著信一起存檔（存在信的代號後面 `;ai=字`），之後重看、換裝置、在相簿翻，都是同一封，不會再問一次。

## 送出去的資料

送給 Worker、再轉給 Claude 的只有這些：哪隻娃娃、哪種信、數字（幾件事、幾年、幾天沒來）、火腿要吐槽的房間和家具名稱、家裡有哪幾隻娃娃、遊戲裡寫好的小事句子（最多兩句）、這隻上一封 AI 信的開頭、今天的日期和幾點。

帳號名字、好友、訪客簿和明信片上自己打的字都不會送。登入憑證只給 Worker 檢查用，不會轉給 Claude。

## 上線步驟

前三步要你自己做（我不能幫你開帳號和建金鑰），大約 15 分鐘。

### 1. 在 Claude Console 建一把 API 金鑰，並設花費上限

1. 打開 https://platform.claude.com ，用連結 Max 方案額度的那個組織登入。
2. 到 API keys 建一把新的金鑰，名字取 `shubing-nest-letters`。金鑰只會顯示一次，先貼在密碼管理工具裡，**不要貼進聊天、程式碼或 `~/.zshrc`**。
3. 到 Limits（花費上限）把每月上限設低一點，例如 5 美元。這是最後一道保險：就算哪裡出錯，一個月最多花這麼多。

### 2. 開一個 Cloudflare 帳號

到 https://dash.cloudflare.com/sign-up 註冊，免費方案就夠，不用填信用卡。

### 3. 把 Worker 放上去

在終端機照順序跑，每一行跑完再跑下一行。第一次跑 `npx wrangler` 會問要不要安裝，按 `y`。

```bash
cd ~/Desktop/shubing-nest/worker
```

```bash
npx wrangler login
```

會開瀏覽器，按允許。

```bash
npx wrangler kv namespace create LIMITS
```

這是記「今天寫了幾封」的地方。跑完會印出一段有 `id = "..."` 的字，把那個 id 貼到 `worker/wrangler.toml` 最後一行，換掉 `REPLACE_WITH_KV_ID`。（新版的 wrangler 可能會問要不要幫你寫進設定檔，選要的話就不用自己貼。）

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

會請你貼金鑰，貼上第 1 步那把，按 Enter。貼的時候畫面不會顯示，是正常的。

```bash
npx wrangler deploy
```

跑完最後會印出一個網址，長得像 `https://shubing-nest-letters.你的名字.workers.dev`。

### 4. 把網址填進遊戲

打開 `js/mailai.js`，把第一個設定改成剛剛的網址：

```js
const MAIL_AI_URL = 'https://shubing-nest-letters.你的名字.workers.dev';
```

存檔、commit、推上 GitHub，網頁版幾分鐘後就會更新。這一步可以叫 Claude 做。

### 5. 確認有沒有成功

用雲端帳號登入網頁版，等娃娃下一次寫信（做滿 5 件小事最快）。在終端機開著這個可以看到 Worker 每一次的紀錄：

```bash
cd ~/Desktop/shubing-nest/worker && npx wrangler tail
```

有信寫出來時會看到 `letter sloth cards end_turn in 812 out 190` 這種一行，後面兩個數字是這封信用掉的 token。

## 花費和上限

| 上限 | 設在哪 | 現在的值 |
| --- | --- | --- |
| 一個帳號一天幾封 | `worker/wrangler.toml` 的 `USER_DAILY` | 3（遊戲一天只會要一封） |
| 所有人一天幾封 | `worker/wrangler.toml` 的 `GLOBAL_DAILY` | 200 |
| 一個月最多花多少 | Claude Console 的 Limits | 自己設，建議 5 美元 |

- 一封信估計不到 0.001 美元（Haiku 5.5 每百萬 token 輸入 0.10、輸出 0.50 美元，一封信大約 800 進、300 出）。**這是估算，還沒用真的金鑰量過**，上線後看 `wrangler tail` 的數字或 Console 的 Usage 才準。
- 照估算，就算每天都寫滿 200 封，一天大約 0.2 美元。實際上每個登入的玩家一天最多一封，用量會小很多。
- 花的是 Max 方案每個月的 API 額度。額度每月重新算、不累積；沒有額度時 Claude 會回錯誤，遊戲自動改用範本，不會壞。
- Cloudflare 免費方案一天 10 萬次請求，遠遠用不完。KV 的免費寫入次數我記得是一天 1,000 次（每封信寫 2 次，200 封 = 400 次），這個數字還沒查證，上線後可以在 Cloudflare 後台的 KV 頁面確認。
- 改了 `wrangler.toml` 的數字要再跑一次 `npx wrangler deploy` 才會生效。

## 想關掉

把 `js/mailai.js` 的 `MAIL_AI_URL` 改回 `''`，推上去，就全部回到範本。已經收到的 AI 信還是看得到。

想連 Worker 一起停：`cd worker && npx wrangler delete`，再到 Claude Console 把那把金鑰刪掉。

## 出問題時

遊戲那邊不會顯示錯誤，要看 Worker 回什麼。`npx wrangler tail` 開著，再讓遊戲要一封信：

| Worker 回的 | 意思 | 怎麼辦 |
| --- | --- | --- |
| 403 `origin` | 不是從允許的網址來的 | 網頁版的網址變了的話，改 `wrangler.toml` 的 `ALLOWED_ORIGINS` |
| 401 `login` | 登入憑證不對或過期 | 重新登入。用 `?emu=1` 模擬器登入的帳號一定是這個結果，那是正常的 |
| 429 `user` / `global` | 今天的名額用完 | 明天就好，或調高上限 |
| 503 `setup` | 金鑰沒放，或 KV 沒接上 | 重做上線步驟的第 3 步 |
| 502 `letter` | Claude 沒寫出能用的信 | 看 tail 裡 `claude` 開頭那一行。常見的是額度用完或金鑰被刪 |

## 改娃娃的口氣

八隻的個性、每封信最多幾行幾個字、可以寫的小事，都在 `worker/src/voices.js`。改完跑 `npx wrangler deploy` 就生效，遊戲那邊不用動。

## 測試

Worker 有一組不連網路、不花錢的測試（假的 Google 鑰匙、假的 Claude、假的 KV）：

```bash
cd ~/Desktop/shubing-nest/worker && node --test
```

涵蓋：登入的人拿得到信、送給 Claude 的格式、十種不對的憑證都擋掉、每人和全部的上限、別的網站和壞資料、Claude 出錯或寫太長時回錯誤。

遊戲這邊（2026-11-26 用假的 Worker 回應在瀏覽器實測過）：訪客用範本、AI 成功時信箱顯示 AI 的字、Worker 回錯誤或網路斷掉時改用範本、同時觸發多次只寄一封、還沒登入好會等登入、回來的字裡有 HTML 會被拿掉、存檔再讀回來是同一封。

**還沒測的：真的金鑰、真的 Worker、真的 Firebase 登入憑證串在一起跑。** 這要等上線步驟做完才能測，第一次上線後請照「確認有沒有成功」看一次。

## 還沒做的

- 史努比的小說十章寫完之後，讓 AI 接著寫第二部。
- 信裡帶到更多家裡的事（今天的天氣、花園種了什麼、最近去誰家過夜）。
- 朋友送娃娃的信、過夜日記也交給 AI。
