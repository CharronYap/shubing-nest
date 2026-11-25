# 雲端帳號

小窩的帳號跟薯餅蛋蛋島是同一套：同一個 Firebase 專案 `plush-crush`，同一組名字和密碼兩邊都能登入，好友也是同一份。

| 放什麼 | 位置 | 誰會寫 |
| --- | --- | --- |
| 帳號（名字＋密碼） | Authentication | 兩邊都用 |
| 好友碼、名字、好友名單 | Firestore `players/{uid}` | 兩邊都用；小窩只會新增自己的那份、加好友 |
| 蛋蛋島的存檔 | Firestore `saves/{uid}` | 只有蛋蛋島，小窩完全不讀也不寫 |
| 小窩的存檔 | Firestore `nestSaves/{uid}` | 只有小窩 |

## 要在 Firebase 後台做的兩件事

這兩件做完，網頁版才能登入、存到雲端。都在 https://console.firebase.google.com 的 `plush-crush` 專案裡。

### 1. 發布新的 Firestore 規則

1. 左邊選「Firestore Database」→ 上面的「規則」分頁。
2. 把編輯框裡的內容全部刪掉，換成這個 repo 的 `firestore.rules` 整份內容。
3. 按「發布」。

`firestore.rules` 是蛋蛋島 repo 裡的規則原封不動，最後面多一段「薯餅的小窩」（`nestSaves`）。如果蛋蛋島之後又改過規則，不要整份蓋掉，只把「薯餅的小窩」那一段（從 `// ---------- 薯餅的小窩 ----------` 到 `match /nestSaves/{uid} { … }` 結束）貼進去，放在最後的 `match /{document=**}` 前面。

還沒發布前，登入會成功，但會跳出「雲端存檔還沒開好」，進度先存在這台裝置。

### 2. 把網址加進授權網域

1. 左邊選「Authentication」→ 上面的「設定」分頁 →「授權網域」。
2. 按「新增網域」，輸入 `charronyap.github.io`（不用加 https:// 和後面的路徑），新增。

沒加的話，登入會顯示「這個網址還不能登入」。

「登入方式」裡的「電子郵件／密碼」蛋蛋島已經開了，不用再動。

## 玩起來是怎樣

- 沒登入也能玩，進度存在這台裝置（訪客存檔）。封面左上角的「登入」按鈕可以登入或開新帳號。
- 登入時，帳號裡還沒有小窩，這台的進度會直接搬進帳號。帳號裡已經有小窩、這台又玩過，會問要不要帶進去：房間擺設用帳號裡的，娃娃、家具、壁紙、道具和幣取兩邊比較多的。
- 登入後每次改動，等 1.5 秒存一次到雲端。封面帳號按鈕旁邊的小圓點：綠色＝已經存到雲端，黃色＝存檔中，橘色＝離線或雲端還沒開好（連上後會自動補存）。
- 打開遊戲時，雲端那份是別台裝置後來存的，會換成雲端那份。玩到一半發現別台裝置改過，也會換成最新的，不會拿舊的蓋掉。
- 登出後回到這台裝置的訪客存檔。
- 帳號按鈕裡可以看自己的好友碼、輸入朋友的好友碼加好友。在蛋蛋島加過的朋友這裡也看得到。

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
js/cloud.js          登入、讀寫存檔、好友（從蛋蛋島改來的）
js/account.js        帳號按鈕、登入視窗、同步、搬存檔
css/account.css      帳號按鈕和視窗的樣式
firestore.rules      整份 Firestore 規則（蛋蛋島原本的＋小窩的 nestSaves）
firebase.json        模擬器設定
```
