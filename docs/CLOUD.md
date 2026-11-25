# 雲端帳號

小窩用自己的 Firebase 專案 `shubing-nest`，帳號和好友只在小窩裡，不跟薯餅蛋蛋島共用。

| 放什麼 | 位置 |
| --- | --- |
| 帳號（名字＋密碼） | Authentication |
| 好友碼、名字、好友名單 | Firestore `players/{uid}` |
| 小窩的存檔 | Firestore `nestSaves/{uid}` |

## Firebase 後台（2026-11-26 已經設好）

都在 https://console.firebase.google.com 的 `shubing-nest` 專案裡，下面這些已經做完，不用再動：

- 「Authentication」→「登入方式」：開了「電子郵件／密碼」。玩家只取名字，程式會把名字換成 `名字@players.shubing-nest.firebaseapp.com` 這種不會收信的地址。
- 「Authentication」→「設定」→「授權網域」：加了 `charronyap.github.io`。
- 「Firestore Database」：資料庫 `(default)`，位置 asia-southeast1。
- 「Firestore Database」→「規則」：發布的是這個 repo 的 `firestore.rules`。

`firestore.rules` 前面 `saves`、`players` 兩段是從蛋蛋島的規則原樣複製來的，小窩用 `players`（好友）和最後一段 `nestSaves`（存檔），`saves` 用不到。`nestSaves` 已經留好第二版的四個欄位（`album`、`away`、`look`、`closet`）。

之後改了 `firestore.rules`，要再到「Firestore Database」→「規則」，把編輯框整份換成新的內容，按「發布」。沒發布的話，存檔裡有新欄位時雲端會拒絕，畫面會跳出「雲端存檔還沒開好」，進度先存在這台裝置。

換網址（例如綁自己的網域）時，要把新網址加進授權網域，不然登入會顯示「這個網址還不能登入」。

## 玩起來是怎樣

- 沒登入也能玩，進度存在這台裝置（訪客存檔）。封面左上角的「登入」按鈕可以登入或開新帳號。
- 登入時，帳號裡還沒有小窩，這台的進度會直接搬進帳號。帳號裡已經有小窩、這台又玩過，會問要不要帶進去：房間擺設用帳號裡的，娃娃、家具、壁紙、道具和幣取兩邊比較多的。
- 登入後每次改動，等 1.5 秒存一次到雲端。封面帳號按鈕旁邊的小圓點：綠色＝已經存到雲端，黃色＝存檔中，橘色＝離線或雲端還沒開好（連上後會自動補存）。
- 打開遊戲時，雲端那份是別台裝置後來存的，會換成雲端那份。玩到一半發現別台裝置改過，也會換成最新的，不會拿舊的蓋掉。
- 登出後回到這台裝置的訪客存檔。
- 帳號按鈕裡可以看自己的好友碼、輸入朋友的好友碼加好友。對方輸入你的好友碼後，也會出現在你的名單裡。

## 本機測試

用 Firebase 模擬器測，不會碰到真的帳號和存檔。需要 Node.js 和 Java（Firestore 模擬器要用）。

```bash
npx firebase-tools emulators:start --project demo-plush
```

另開一個終端機跑網頁：

```bash
python3 -m http.server 8765
```

瀏覽器打開 http://localhost:8765/?emu=1 。網址有 `?emu=1`、而且是在 localhost 打開時，才會連模擬器的假專案 `demo-plush`。

## 關掉雲端帳號

把 `js/cloud-config.js` 的 `FIREBASE_CONFIG` 換成 `null`，封面就不會出現帳號按鈕，所有人都只用這台裝置的存檔。

## 檔案

```
js/cloud-config.js   Firebase 專案設定（本來就會出現在網頁裡，不是密碼）
js/cloud.js          登入、讀寫存檔、好友（從蛋蛋島的程式改來的）
js/account.js        帳號按鈕、登入視窗、同步、搬存檔
css/account.css      帳號按鈕和視窗的樣式
firestore.rules      整份 Firestore 規則（好友 players、存檔 nestSaves）
firebase.json        模擬器設定
```
