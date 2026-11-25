# 薯餅的小窩

在網頁上布置娃娃房間、用娃娃機夾娃娃和家具，每天陪八隻娃娃做幾件小事。可以登入跟薯餅蛋蛋島同一個雲端帳號，換裝置接著玩。還沒有朋友互訪和送禮。

## 直接玩

網頁版：https://charronyap.github.io/shubing-nest/

手機、電腦打開就能玩。push 到 main 之後，大約一兩分鐘網頁版會自動更新。瀏覽器會把檔案快取 10 分鐘，打開過舊版的人看不到新改的地方時，重新整理一次就好（電腦按 `Cmd + Shift + R`）。

## 在自己電腦跑

改程式時用這個方式。不用安裝任何套件，Mac 內建的 Python 就能跑。

```bash
git clone https://github.com/CharronYap/shubing-nest.git
cd shubing-nest
python3 -m http.server 8765
```

瀏覽器打開 http://localhost:8765 就可以玩。要停下來時，在終端機按 `Ctrl + C`。

直接雙擊 `index.html` 多半也能開，但有些瀏覽器會擋本機檔案的存檔，建議用上面的方式。

用手機試玩：手機和電腦連同一個 Wi-Fi，把網址裡的 `localhost` 換成電腦的區域網路 IP（例如 `http://192.168.1.23:8765`）。

## 第一版有什麼

- **封面**：打開先看到封面，按中間的薯餅進房間，右上角的按鈕直接去娃娃機。
- **雲端帳號**：封面左上角的「登入」。帳號跟薯餅蛋蛋島共用，好友也是同一份。沒登入也能玩，登入時會把這台的進度帶進帳號。設定和後台步驟在 `docs/CLOUD.md`。
- **背景音樂**：按了封面的按鈕才開始放，音量放得比較小。封面左上角和房間上方的音符按鈕可以開關，關掉後這台裝置會記住。
- **房間**：客廳、臥室、浴室三間。房間直接鋪滿畫面。娃娃可以拖來拖去，也能坐到沙發、床這些家具上。晚上七點到早上五點窗外會變成夜空，燈開著時房間跟白天一樣亮。
- **開燈關燈**：窗戶左邊的牆上有電燈開關，每個房間各自記得開或關。關燈後房間變暗，有檯燈的話只剩檯燈亮著。
- **娃娃機**：夾一次 2 枚幣。第一次進來送 20 枚，之後每天第一次打開送 10 枚。連續沒夾到時，第 10 次只要爪子底下有東西就一定夾到。
- **扭蛋**：娃娃機裡約兩成是扭蛋，開出來是家具、壁紙或小事要用的道具。湊齊雲朵系列（床、地毯、檯燈、蛋椅、相框）會送雲朵地板。
- **爪子**：一開始有兩款，夾到 3、8、15 次各解鎖一款。
- **每天的小事**：每天從已經有的娃娃裡抽 3 件，有的點娃娃幾下就好，有的要用扭蛋開到的道具。做完一件拿 2 枚幣。缺道具的那幾件會寫要什麼，旁邊有「去夾」可以直接去娃娃機；右上角的紅點只算現在做得到的件數。
- 一開始有 5 隻娃娃，另外 3 隻要從娃娃機夾。

## 檔案

```
index.html      頁面
css/style.css   遊戲樣式
css/cover.css   封面樣式
css/account.css 帳號按鈕和登入視窗
js/data.js      娃娃、家具、小事、規則數字
js/save.js      存檔（瀏覽器的 localStorage，訪客和每個帳號各一份）
js/room.js      房間：擺放、拖曳、收納架
js/claw.js      娃娃機
js/main.js      換頁、幣、每天的小事
js/cover.js     封面
js/music.js     背景音樂和開關
js/account.js   雲端帳號：登入、同步、好友碼
js/cloud.js     Firebase 登入和讀寫（從蛋蛋島改來的）
js/cloud-config.js  Firebase 專案設定
firestore.rules Firestore 規則（蛋蛋島原本的＋小窩的 nestSaves）
firebase.json   本機模擬器設定
docs/CLOUD.md   雲端帳號說明和後台步驟
audio/          背景音樂
img/            八隻娃娃的圖（img/cover/ 是封面用的）
fonts/          封面標題字型
```

規則數字（價錢、送幣、解鎖次數）都在 `js/data.js` 最上面，改數字就好。

## 存檔和重來

沒登入時，進度只存在這台裝置的瀏覽器（`shubingNest.v1`）。登入後存在雲端的 `nestSaves/{uid}`，這台裝置另外留一份 `shubingNest.v1.u.{uid}`，換裝置登入同一個帳號就能接著玩。

訪客想從頭玩：瀏覽器開發者工具 → Application → Local Storage → 刪掉 `shubingNest.v1`，或在 Console 輸入：

```js
localStorage.removeItem('shubingNest.v1'); location.reload();
```

## 還沒做的

- 朋友互訪、送娃娃、信箱（帳號和好友碼已經有了，之後接在 Firebase 上）
- 音效

## 音樂

背景音樂是 Zane Little Music 的「Apple Cider」，CC0（公眾領域），來源：https://opengameart.org/content/apple-cider 。原檔是 ogg，轉成 m4a 讓 iPhone 也能播。

## 字型

封面標題用「源泉圓體」（GenSen Rounded）Heavy，SIL Open Font License 1.1，授權全文在 `fonts/OFL.txt`。

## 注意

- 這個 repo 是公開的，網頁版放在 GitHub Pages。任何人都看得到程式和圖片。
- 蛋黃哥、貓咪老師、史努比、火腿是別人有版權的角色，圖片只供我們自己玩，不要拿去商用或另外散布。之後如果要正式推出，要先換成原創角色。
