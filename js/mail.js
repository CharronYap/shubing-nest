/* 信箱：娃娃寫給你的信，還有薯餅寫的「小窩更新了」
   不懲罰、不催人：信不會過期，附件沒領也一直留著；隔幾天才打開，娃娃寫的是牠這幾天的心情，不寫讓人有罪惡感的話。
   S.mail = {
     l:[{k:'sloth.intro.0#n=5', t:'日期', r:看過, a:'snack'|'bubble'|null, g:附件領了}],   信箱裡的信，最新的在前面。上限各類各算（見 MAIL_CAT_MAX）
     s:{key:'日期'},     寄過哪些（intro-sloth、cards-sloth-5、anniv-sloth-2027、miss-日期、news-v4）
     arch:{娃娃:['日期|k']},   每隻寫過的信，相簿翻得到，一隻最多留 24 封
     n:{娃娃:幾件},      跟這隻一起做完幾件小事（重複的也算）
     last:'日期',        娃娃上次寄信的日子（一天最多一封）
     att:'日期'          上次有附件的日子（一天最多一封有附件）
   }
   朋友送來的娃娃（js/nestgift.js）領了之後也變成一封信：k = '娃娃.gift.0#w=朋友名字;m=第幾句'，不算在一天一封裡
   第五版：朋友自己打的字放在代號最後 ';x=encodeURIComponent(字)'，畫的時候走 txSlot（textContent），不接進 innerHTML
     送娃娃自己寫的話：'娃娃.gift.0#w=名字;m=第幾句;x=字'      過夜回來（js/stay.js）：'娃娃.trip.第幾句日記#w=名字;x=小紙條'
   信裡的字寫在下面的 MAIL_TPL，存檔只存 key；同一個 key 永遠是同一封信 */
// AI 寫的信（js/mailai.js）：key 後面多一段 ;ai=字，有這段就顯示它，沒有就照範本
const MAIL_ARCH = 24;
/* 分類（2026-11-27 使用者要的）：信箱上面一排分類鈕，全部｜娃娃的信｜小窩更新｜明信片｜朋友家。
   每一封屬於哪一類看 key 的第二段：news = 小窩更新；gift（朋友送來的娃娃）、trip（過夜回來的日記）= 朋友家；pc（娃娃旅行寄回來的明信片）= 明信片；其他都是娃娃的信。
   朋友寄來的明信片不在 l 裡，在 S.mail.pc（js/card.js），畫的時候一起排進「明信片」和「全部」。
   上限各類各算，免得更新信把娃娃的信擠掉：小窩更新不設上限；其他三類各 60 封。滿了只刪最舊的「看過、附件也領了」的，沒看的不會不見。
   兩台裝置合併存檔（js/account.js）也叫 mailTrim，用同一套。朋友寄來的明信片的上限在 js/card.js（CARD_KEEP），這裡不管。 */
const MAIL_CATS = [['all', '全部'], ['doll', '娃娃的信'], ['news', '小窩更新'], ['pc', '明信片'], ['pal', '朋友家']];
const MAIL_CAT_NAME = Object.fromEntries(MAIL_CATS);
const MAIL_CAT_MAX = {doll: 60, pal: 60, pc: 60};
const MAIL_EMPTY = {all: '還沒有信。娃娃們偶爾會寫信給你，不用特別等。', doll: '還沒有信。娃娃們偶爾會寫信給你，不用特別等。', news: '還沒有更新信。', pc: '還沒有明信片。朋友拍照後可以寄給你。', pal: '還沒有。娃娃去朋友家過夜回來，或朋友送娃娃來，都會放在這裡。'};
const mailCatOf = o => { const t = (/^[a-z]+\.([a-z]+)\./.exec((o && o.k) || '') || [])[1]; return t === 'news' ? 'news' : t === 'gift' || t === 'trip' ? 'pal' : t === 'pc' ? 'pc' : 'doll'; };
let mailCat = 'all', mailCardBack = false;   // mailCat：同一次開著遊戲時記住上次選的那一類；mailCardBack：明信片是從信箱點開的，看完回信箱
function mailTrim(l){
  if (!Array.isArray(l)) return l;
  const n = {};
  l.forEach(o => { const c = mailCatOf(o); n[c] = (n[c] || 0) + 1; });
  for (let x = l.length - 1; x >= 0; x--){
    const o = l[x], c = mailCatOf(o);
    if (MAIL_CAT_MAX[c] && n[c] > MAIL_CAT_MAX[c] && o.r && (!o.a || o.g)){ l.splice(x, 1); n[c]--; }
  }
  return l;
}
const MAIL_CARDS = [5, 10, 20];          // 一起做完幾件小事時寫信
const MAIL_MISS_DAYS = 3;                // 隔超過幾天才打開，寫一封「你不在的時候」
const MAIL_ATT_RATE = .5;                // 一天第一封娃娃的信，有附件的機率
const MAIL_TITLE = {intro:'你好', cards:'一起做了 {n} 件事', anniv:'來小窩滿 {y} 年', miss:'你不在的時候', news:'小窩更新了', gift:'從{w}家來的', trip:'去{w}家過夜'};
// 送娃娃（js/nestgift.js）：寄的人從這 6 句選一句，信裡用 {m} 帶出來
const MAIL_GIFT_LINES = ['幫我照顧牠', '牠很想去你家玩', '牠說你家的沙發看起來很軟', '我又夾到一隻，這隻給你', '牠跟你很合', '想你的時候就看看牠'];
// 朋友送來的娃娃家裡已經有了：e=1 留著當店員、e=2 換成幣。before = 還沒開門（信箱裡先講會怎麼樣）
function mailGiftNote(d, e, before){
  const n = DOLL_NAME[d], pay = typeof EARN_WORK_PAY !== 'undefined' ? EARN_WORK_PAY : 2, c = typeof SPARE_COIN !== 'undefined' ? SPARE_COIN : 3;
  if (e === 2) return before ? `（你家已經有${n}，也留著一隻了。讓牠進來的話，這隻會換成 ${c} 枚幣。）` : `（家裡已經有${n}，也留著一隻了，所以這隻換成了 ${c} 枚幣。）`;
  return before ? `（你家已經有${n}了。讓牠進來的話，牠會先在娃娃機當店員，每天帶回 ${pay} 枚，之後也可以再送給別的朋友。）` : `（家裡已經有${n}了，這隻先在娃娃機當店員，每天帶回 ${pay} 枚。之後可以再送給別的朋友。）`;
}
const MAIL_ICON = '<svg viewBox="0 0 40 40"><rect x="4" y="9" width="32" height="23" rx="5" fill="#fff" stroke="#ff6fb0" stroke-width="2.6"/><path d="M5 11l15 11 15-11" fill="none" stroke="#ff6fb0" stroke-width="2.6" stroke-linejoin="round"/><path d="M20 27.5s-4-2.4-4-5c0-1.3 1-2.3 2.1-2.3.8 0 1.4.4 1.9 1 .5-.6 1.1-1 1.9-1 1.2 0 2.1 1 2.1 2.3 0 2.6-4 5-4 5z" fill="#ffc928"/></svg>';
const MAIL_LEAF = '<svg viewBox="0 0 60 60"><path d="M30 52C12 44 8 26 14 10c14 2 32 10 34 28-2 8-8 12-18 14z" fill="#8fd17a" stroke="#4f9a3a" stroke-width="2.4" stroke-linejoin="round"/><path d="M30 52C28 36 22 24 14 10M28 38l-9-4M25 28l-7-1M30 44l9-7M27 33l9-8" fill="none" stroke="#4f9a3a" stroke-width="2" stroke-linecap="round"/></svg>';
const MAIL_ROOM = {living:'客廳', bed:'臥室', bath:'浴室'};
const MAIL_FURN = {sofa:'沙發', tv:'電視', table:'小桌子', shelf:'櫃子', plant:'盆栽', clock:'時鐘', bed:'床', rug:'地毯', lamp:'檯燈', eggchair:'蛋椅', frame:'相框', toybox:'玩具箱', closet:'衣櫃', tub:'浴缸', sink:'洗手台', mat:'腳踏墊', towel:'毛巾', duck:'小鴨'};

/* 2026-11-26：四種信的內容全部換成口語的版本（八隻的個性和規則寫在 docs/gpt/0-全部個性和規則.md）。gift 沒有動。
   每隻每種信的版本數：intro 4、cards 8、anniv 6、miss 14（miss 會一直收到，所以最多）。gift 一種。
   新的版本只能加在每一排的最後面：存檔記的是「第幾個」，中間插一個或調順序，舊的信會變成別封。
   每隻照自己的個性寫：薯餅寫到睡著（最後一行歪掉）、蛋黃哥很短、皮蛋一直汪還會夾拖鞋、彈跳豬字很大全是驚嘆號、
   貓咪老師開頭嘴硬最後要點心、龍龍先給一片葉子背面才是信、史努比寫連載小說、火腿吐槽房間最後補一句還不錯 */
const MAIL_TPL = {
  sloth:{
    intro:[
      '你好喔，我剛剛有去看看我的床。\n可是我在沙發上就躺下來了。\n等我睡醒再去看看枕頭是不是也很舒',
      '欸，你看得到我嗎，我坐在這邊。\n我叫薯餅喔，你可以坐在我旁',
      '我剛才走了一圈，這裡好多可以躺的地方耶。\n我最喜歡你旁邊那個位',
      '我想跟你說你好，然後還有一件事。\n嗯……是什麼啊。\n我先把眼睛閉起來想一'],
    cards:[
      '我們做了 {n} 件了喔。\n我每做完一件就點一下頭，後來頭就越來越低。\n我是不是又要睡著了，眼睛都睜不',
      '欸，{n} 件耶。\n我本來想拍拍手的，可是有一隻手被我壓在肚子底',
      '我剛剛有數喔，我們一起做了 {n} 件。\n有你在的時候，我就想醒著陪你久一',
      '做了 {n} 件事了。\n那我們可以坐一下嗎，我有留一個軟軟的位',
      '我想到我們做的第一件事了耶。\n還有後來的……嗯，總共有 {n} 件。\n等我慢慢想就會全部想起',
      '{n} 件都做完了喔。\n我好高興，可是我的臉好像還是跟剛剛一',
      '欸，我也有幫忙耶，我們做了 {n} 件。\n我想跟你一起拍個手，可是我的手抬得好',
      '我們做了 {n} 件事。\n有幾次我做一做就坐下了，你也坐在旁邊。\n我喜歡跟你坐在一'],
    anniv:[
      '我住在這裡滿 {y} 年了耶。\n剛來的時候我還不知道哪裡最好睡。\n現在我閉著眼睛也找得',
      '{y} 年是多久啊。\n是不是比我從沙發走到門口還要久很',
      '我來這裡滿 {y} 年了。\n我好像有比剛來的時候更會找你耶。\n你坐哪裡我就慢慢走到那',
      '欸，今天滿 {y} 年喔。\n我想把我平常躺的那一邊借給你。\n那裡躺下去真的特別舒',
      '來小窩滿 {y} 年了。\n我想說一句很長的話給你聽。\n就是我每天都可以在這裡睡得好安',
      '{y} 年了耶，我還是很喜歡這裡的沙發。\n可是如果你坐地板，我也會慢慢下來跟你坐在一'],
    miss:[
      '我剛睡醒耶。\n這幾天我有試著躺沙發的另一邊。\n那邊也好軟，下次你可以試',
      '欸，是你喔。\n我這幾天走路有變快一點點，從床走到門口都沒有坐下來休',
      '我這幾天在看窗戶，裡面有一隻跟我長得好像。\n我抬手牠也抬手耶。\n等你坐過來我再指給你看牠的手指頭有多',
      '你來了喔。\n我把枕頭轉了一邊，另一邊好涼。\n你也摸摸看，真的很舒',
      '我這幾天找到一個好玩的事。\n就是趴在沙發上把手垂下去，看手指會不會碰到地',
      '欸，我剛剛還以為門口的拖鞋是你耶。\n我湊過去看了一下，才看到只有拖',
      '我這幾天有把點心慢慢吃完喔。\n最後那一口我含了好久，差點忘記要吞下',
      '你回來了耶。\n我剛才躺在床上，腳伸出去一點點，然後發現腳也可以塞到枕頭底',
      '這幾天我把沙發每個地方都坐過了。\n你那一邊最好坐，我幫你把那個位子留',
      '我本來在想一個好聽的故事。\n後來我睡醒就只記得有一隻很大的兔子。\n等一下我再想想牠跑到哪',
      '我有在地板上練習翻身喔。\n翻過去之後覺得肚子朝上也很舒服，就這樣躺了一',
      '欸，你坐這裡好不好。\n我這幾天睡得好飽，今天應該可以陪你坐久一',
      '我剛剛走到門口，忘了要做什麼。\n就坐在那邊摸自己的腳趾頭。\n然後你就來了耶，我想跟你說歡迎回',
      '這幾天我過得很好喔。\n你可以先坐下來，我挪一點點過去就可以靠著你睡一'],
    gift:['我是薯餅，從{w}家搬過來。\n{w}說：「{m}」\n我可以先在你家沙發躺一下嗎……'],
  },
  egg:{
    intro:[
      '蛤，自我介紹喔。\n蛋黃哥啦。',
      '你好。\n我就躺這囉。',
      '這裡可以躺嗎。\n喔，已經躺了。',
      '嗨。躺著跟你打招呼。'],
    cards:[
      '{n} 件喔。\n難怪想躺。',
      '有 {n} 件了耶。\n手就不舉了。',
      '做了 {n} 件。\n好啦，值得睡一覺。',
      '{n} 件都算我有份喔。\n好耶。',
      '跟你做了 {n} 件。\n還滿舒服的。',
      '{n} 件。\n數完就累了。',
      '欸，已經 {n} 件喔。\n我還沒坐起來耶。',
      '做完 {n} 件了。\n躺一下吧。'],
    anniv:[
      '住滿 {y} 年了。\n這個位置滿熟的。',
      '{y} 年喔。\n懶得換地方了。',
      '來這裡 {y} 年了。\n躺得很好。',
      '{y} 年耶。\n都沒躺膩。',
      '滿 {y} 年。\n慶祝一下。\n用躺的。',
      '{y} 年了喔。\n嗯，有你比較好。'],
    miss:[
      '回來啦。\n我剛翻好面。',
      '這幾天都在躺。\n地板很涼耶。',
      '我挪了半個身體。\n算有運動吧。\n嗨。',
      '喔，你來啦。\n這邊有空位。',
      '剛吃飽。\n連翻身都嫌麻煩。\n你也坐啊。',
      '這幾天睡很飽。\n還是睏。',
      '我趴了一下。\n結果仰躺比較好。\n你來啦。',
      '欸，回來囉。\n用眼睛跟你打招呼。',
      '枕頭太舒服了。\n頭拿不起來。',
      '剛剛伸懶腰。\n今天的運動量夠了。\n嗨。',
      '這幾天躺沙發。\n留下我的形狀了。',
      '嗨。\n剛好醒著耶。',
      '點心吃完了。\n好懶得再咬東西。\n喔，你來啦。',
      '我很好啊。\n你也躺著吧。'],
    gift:['我是蛋黃哥。從{w}家來的。\n{w}說：「{m}」\n就這樣，讓我進去躺著。'],
  },
  dog:{
    intro:[
      '汪！我是皮蛋！\n我剛才跑了一大圈，回來發現你也在耶！\n這個給你，歡迎你跟我一起玩！\n[拖鞋]',
      '汪汪汪汪！\n（翻譯：你好，我已經有一點喜歡你了。）\n汪！（好多點！）',
      '欸，我尾巴一直搖耶！\n我本來想坐好跟你打招呼的啦，汪！',
      '我把小窩每個角落都聞過了！\n現在就差你啦，我可以聞一下你的手嗎？'],
    cards:[
      '汪！我們做了 {n} 件事耶！\n我尾巴也有在幫忙，牠搖得超用力的！',
      '我們一起做了 {n} 件了喔！\n這個給你，是我找了好久才找到最喜歡的那隻。\n[拖鞋]',
      '欸欸，我們做了 {n} 件耶！\n我高興到想在地板上打滾。\n翻過來囉，汪！',
      '我剛剛跑來跑去，差點忘記跟你說。\n我們一起做了 {n} 件了！',
      '{n} 件耶！汪汪！\n有你跟我一起做，我就覺得好好玩喔。',
      '我們有 {n} 件做完了耶！\n我想跟你擊掌！\n可是我只有爪子，那就碰一下啦。',
      '汪汪！已經做了 {n} 件！\n我剛剛太高興，繞著自己的尾巴跑了一圈。',
      '我們一起做了 {n} 件事，耶！\n我趴一下喔，剛才跑太多圈了。\n你坐這裡就好。'],
    anniv:[
      '我住小窩滿 {y} 年了！\n剛來的時候我還會跑錯方向耶。\n現在閉著眼睛都找得到你！',
      '汪！今天滿 {y} 年耶！\n我把最喜歡的拖鞋帶來了，送給你！\n[拖鞋]',
      '{y} 年了喔！\n我有好多事情可以跟你講，汪，先抱一下！',
      '我來這裡滿 {y} 年了耶。\n我還記得剛認識你的時候，我尾巴也跟現在一樣停不下來！',
      '跟你住了 {y} 年啦！\n我今天要用尾巴畫一個好大的圈！\n欸，屁股也跟著轉了啦！',
      '汪汪！我來小窩滿 {y} 年了。\n我好喜歡跟你住在這裡，真的啦！'],
    miss:[
      '汪！你來啦！\n我這幾天學會用鼻子把拖鞋推很遠耶。\n可是推到沙發底下就拿不出來了！',
      '我這幾天有找到一隻很棒的拖鞋。\n本來想藏起來，可是我覺得你會喜歡！\n[拖鞋]',
      '欸欸，我剛才在跟自己的尾巴玩。\n牠一直跑掉，超難抓的！\n汪，你回來了！',
      '我這幾天在門口聞到好多味道喔。\n現在聞到你的啦！\n汪！',
      '你來摸摸我的頭好不好？\n這幾天我自己玩得好開心，現在想跟你貼一下。',
      '汪汪汪！\n（翻譯：這幾天我學會了在地板上滑一下再停。）\n可是屁股比腳先停，嘿嘿。',
      '我發現趴著的時候可以把兩隻腳疊在一起耶。\n這幾天睡覺都這樣，好舒服。\n你來了喔！',
      '欸，你回來啦！\n我這幾天藏了東西，藏得超好的。\n嗯……我自己也找不到了。',
      '這幾天我在小窩巡邏喔。\n沙發底下有一點點灰塵，我打了好大一個噴嚏。\n汪！歡迎回來！',
      '你看你看，我會坐好不動了耶！\n這幾天有練習喔。\n可是尾巴不算啦！',
      '我剛才把兩隻拖鞋排在一起。\n看起來好像一隻很長的小狗，汪！\n你也來看看！',
      '汪！我點心吃光光了。\n這幾天都有吃飽睡飽，現在可以再跑一圈！',
      '欸，你坐下來囉？\n這幾天我發現靠著沙發睡也很舒服。\n可是靠你更軟耶！',
      '我這幾天玩到腳都熱熱的。\n剛好跑累了，汪。\n我可以趴在你旁邊嗎？'],
    gift:['汪！我是皮蛋！從{w}家跑來的！汪汪！\n{w}說：「{m}」\n我有帶拖鞋喔。\n[拖鞋]'],
  },
  moodeng:{
    intro:[
      '我是彈跳豬！！\n我跳起來比你想的還高！！\n欸！！沙發借我一下！！',
      '你好！！！\n我剛剛跳了好多下！！\n現在肚子好餓！！',
      '哼！！我要住這裡！！\n那個軟軟的位置給你啦！！',
      '欸欸欸！！我會泡水喔！！\n還會踢水！！\n超會踢的啦！！！'],
    cards:[
      '我們做了 {n} 件耶！！\n我要跳起來慶祝！！\n咚！！我的屁股！！',
      '{n} 件！！很強吧！！\n這次給你拍拍手！！！',
      '蛤！！已經 {n} 件了喔！！\n我還有力氣啦！！',
      '我們做完 {n} 件了！！\n誰說我只會跳的！！\n哼哼！！！',
      '{n} 件都做完囉！！\n我現在要把腳伸直！！\n休息也是很重要的啦！！',
      '你跟我做了 {n} 件耶！！\n好啦！！你很厲害！！',
      '欸！！一起做了 {n} 件！！\n我高興到嘴巴合不起來！！',
      '做了 {n} 件了！！\n我要跳一個最大的！！\n欸！！再往後一點啦！！'],
    anniv:[
      '我來這裡滿 {y} 年了！！\n我還是一樣會跳！！！',
      '滿 {y} 年耶！！\n今天我要用屁股跳舞！！\n不准笑！！！',
      '住了 {y} 年囉！！\n這裡是我的家！！\n也是你的啦！！',
      '{y} 年！！好長喔！！\n我以為才跳幾下而已！！',
      '來小窩滿 {y} 年了！！\n我要吃最喜歡的點心！！\n分你一口啦！！！',
      '欸！！我住滿 {y} 年了！！\n今天可以摸我的頭！！\n好啦！！不只一下！！'],
    miss:[
      '你來啦！！\n我這幾天有練跳高！！\n落地超大聲的啦！！',
      '欸欸欸！！我的水好好玩！！\n剛剛踢到自己的臉了！！\n不准笑！！！',
      '這幾天我有趴著休息！！\n我的腳也會累啦！！\n欸！！你回來囉！！',
      '我剛才跳到床上！！\n又彈回來了！！\n再一次！！！',
      '這幾天我都有吃飽喔！！\n你看！！肚子圓圓的！！',
      '你回來啦！！\n我剛才用嘴巴咬枕頭！！\n咬不動啦！！哼！！',
      '這幾天我在練走直線！！\n一直想跳啦！！\n走到一半就飛起來了！！',
      '哼！！我今天很乖！！\n泡水的時候只踢一下！！\n好啦！！好幾下！！',
      '欸！！你坐這邊啦！！\n我剛好跳累了！！\n一起坐一下！！！',
      '我這幾天都在練大叫！！\n現在嘴巴張超大的！！\n啊啊啊！！！',
      '蛤！！你回來囉！！\n我剛睡醒啦！！\n頭上的毛翹起來了！！',
      '這幾天我發現一件事！！\n屁股先碰地板比較不痛！！\n我還要再跳！！！',
      '剛才我跟拖鞋比賽跑步！！\n我贏了啦！！\n牠根本沒動！！',
      '你來了耶！！\n我今天不想跳了！！\n我想靠著你啦！！'],
    gift:['我是彈跳豬！！從{w}家跳過來的！！！\n{w}說：「{m}」！！\n快開門！！！'],
  },
  nyanko:{
    intro:[
      '才不是普通的貓喔，先跟你講清楚。\n本大爺可是很厲害的。\n嗯，沙發倒是滿會挑的。',
      '喂，本大爺今天巡過一圈了。\n這裡住起來還可以，點心也有地方放。\n就先住下來吧。',
      '才不是看這裡有點心才留下來的。\n不過，那個位置拿來睡午覺倒是正好。',
      '本大爺有個規矩，睡午覺的時候不接任何差事。\n你要是也睏了，旁邊還有位子。'],
    cards:[
      '才不是什麼了不起的事，才 {n} 件嘛。\n不過你做得滿好的，本大爺都有看到。',
      '喂，我們做完 {n} 件了。\n本大爺剛好有兩個饅頭，分你一個。\n小的那個……算了，大的給你。',
      '才不是特地記下來的，剛好記得是 {n} 件。\n哼，本大爺記性本來就好。',
      '做了 {n} 件事，肚子也該餓了吧。\n本大爺宣布休息，誰有意見都駁回。\n你也坐下來吃點東西。',
      '才不是每一件都有出力，本大爺有時候也在打盹。\n不過跟你做了 {n} 件，也滿有意思的。',
      '{n} 件了喔。\n本大爺本來只打算在旁邊看，怎麼連午覺都忘了睡。',
      '真是的，都做了 {n} 件了。\n本大爺有賞，今天讓你坐平常我睡的那個位子。',
      '才不是要誇你喔。\n一起做了 {n} 件，手腳還滿快的嘛。\n下次本大爺就放心在旁邊睡了。'],
    anniv:[
      '才不是日子算得特別仔細。\n住滿 {y} 年，這裡哪一塊地板睡起來最舒服，本大爺都知道了。',
      '住了 {y} 年啦。\n本大爺吃過多少個饅頭倒是沒算。\n跟你分著吃的那幾個，我倒還記得。',
      '才不是捨不得換地方，本大爺只是住慣了。\n都滿 {y} 年了，連你坐哪裡我都猜得到。',
      '哼，今天住滿 {y} 年。\n本大爺去翻了翻點心櫃，還有一點好吃的。\n留給你吧，反正我飽了。',
      '才不是要特別慶祝。\n滿 {y} 年了，喝一小杯不過分吧。\n本大爺心情好，你就當沒看到。',
      '{y} 年了喔，日子過得還真快。\n本大爺平常也沒怎麼誇你。\n喂，這個家你布置得滿舒服的。'],
    miss:[
      '才不是本大爺偷吃，饅頭放久了會變硬嘛。\n這幾天我把它們處理掉了。\n喔，你回來啦。',
      '這幾天本大爺喝了點酒，回來一頭栽進枕頭裡。\n還好沒人看到。\n喂，這件事不要到處講啊。',
      '才不是在學普通的貓伸懶腰。\n這幾天本大爺在活動筋骨，剛好四腳朝天而已。\n回來啦，坐吧。',
      '喂，這幾天我把小窩巡過了，什麼事也沒有。\n連點心櫃都很安全。\n當然，少掉的那幾個是我吃的。',
      '才不是怕你坐得不舒服。\n本大爺剛把枕頭翻了個面，這面比較軟。\n反正順手，你坐吧。',
      '這幾天我在練習把饅頭一口吃完。\n結果咬到自己的嘴巴，嘖。\n哼，這種事你不要學。',
      '才不是偷懶，本大爺那叫閉目養神。\n這幾天睡得滿飽的。\n你來了啊，旁邊有地方坐。',
      '哼，本大爺找到一個新睡法。\n肚子朝上，四腳伸直，比趴著還舒服。\n你看歸看，不准把我當普通的貓。',
      '才不是在跟點心講話。\n這幾天本大爺在想炸蝦該從哪一頭吃。\n喂，你覺得呢。',
      '本大爺這幾天過得滿好的，吃飽就在沙發上打盹。\n你也休息一下吧。\n家裡有本大爺顧著。',
      '才不是特地給你留的。\n這幾天我吃夠了，那個點心歸你。\n放著也行，肚子餓再吃。',
      '真是的，本大爺剛醒來還找不到自己的腳。\n躺太久了嘛。\n喔，回來了啊。',
      '才不是睡到忘記巡邏。\n這幾天我有走到門口看過，然後才回去睡。\n一切正常，放心吧。',
      '本大爺剛把最後一口饅頭吞下去。\n這幾天吃得太好，現在連站起來都有點麻煩。\n你也來坐一下吧。'],
    gift:['才不是想來你家。\n是{w}說：「{m}」\n既然來了，點心準備好了嗎。'],
  },
  dino:{
    intro:[
      '吼——！有沒有嚇到你？\n我是龍龍啦，剛搬進來。\n我已經找到兩個可以躲起來的地方了，先不告訴你。',
      '欸，你把葉子翻過來了耶！\n我挑了很久喔，這片長得最像我的腳。',
      '我有一個計畫。\n先把小窩每個角落都探險一遍，再找你一起玩！\n剛剛走到床底下，差點忘了出來。',
      '你好啊，我叫龍龍！\n剛才沙發後面那個小小的影子就是我，嘿嘿。'],
    cards:[
      '我們一起做了 {n} 件耶！\n我想給你一個恐龍式的擊掌。\n啪！欸，我的手好短喔。',
      '做了 {n} 件事了，我們好強喔！\n我剛剛還想幫你偷偷做下一件，結果忘了是什麼。',
      '欸，{n} 件都做完了！\n那我來出個題目，你猜我現在躲在哪裡？\n提示：我的尾巴還露在外面啦。',
      '{n} 件耶！\n這片葉子送你，我特地找了一片沒有破洞的。',
      '我們有一起做了 {n} 件喔。\n本來想假裝很酷地跟你說一聲好棒。\n可是我嘴巴一直在笑啦！',
      '剛才我想了一個慶祝的方法，先跳一下，再轉一圈！\n做完 {n} 件就要這樣啦。\n欸，我轉暈了。',
      '{n} 件都完成囉！\n我今天可以當小窩的探險隊長嗎？\n你當另一個隊長，我們兩個都當。',
      '你知道嗎，我們一起做了 {n} 件。\n有一件我做得特別認真喔，連尾巴都沒有亂動。'],
    anniv:[
      '{y} 年了耶！\n我來這裡的時候還不知道沙發後面可以躲。\n現在那裡是我的秘密基地！',
      '欸，我住滿 {y} 年囉！\n我想送你一片最特別的葉子。\n就是這片，你收好了喔。',
      '我來小窩滿 {y} 年了。\n有好多次我想嚇你，自己都先笑了。\n下次我要練習閉著嘴巴笑！',
      '住了 {y} 年啦！\n我有一個超棒的計畫，就是繼續跟你玩。\n這次沒有惡作劇，真的啦。',
      '原來我已經來這裡 {y} 年了喔。\n我還以為我才剛把小窩探險完耶。\n欸，有你在好好玩。',
      '今天滿 {y} 年！\n本來想用恐龍話跟你說我很高興。\n可是用吼的你好像聽不懂，嘿嘿。'],
    miss:[
      '欸欸，你來了！\n這幾天我在練習躲起來不笑，還會用手摀住嘴巴喔。\n可是看到你就又笑了。',
      '我剛才把枕頭堆成一座山。\n爬到頂端才發現，原來下來比較可怕耶。\n你看，我現在在山腳下了！',
      '這幾天我發現一條秘密通道。\n從沙發這一頭爬到另一頭，屁股會卡一下。\n下次要倒著走！',
      '嘿嘿，我剛才在門口用尾巴畫了一個圈。\n想畫恐龍，可是畫起來很像一條蚯蚓。\n你回來啦！',
      '你看看這片葉子，有一個小洞耶。\n我這幾天都拿它當眼鏡，一次只能看一隻眼睛。',
      '我這幾天在玩捉迷藏。\n自己躲完再自己跑出來找，還滿好玩的！\n欸，現在有你耶。',
      '吼——！\n我剛剛對著枕頭練習嚇人，牠完全沒反應。\n你回來啦，枕頭比你還難嚇耶。',
      '這幾天我試著倒退走路。\n走一走還要回頭看自己的尾巴，超忙的啦！\n欸，你來囉。',
      '我剛才在地板上發現一條小小的縫。\n我蹲在旁邊看了很久，以為會有什麼跑出來。\n結果先看到你耶！',
      '這幾天我都有好好睡覺喔。\n還夢到我會飛，醒來才發現我抱著枕頭。\n嘿嘿，你回來啦。',
      '欸，你回來了喔。\n我這幾天發現床底下很適合講悄悄話。\n可是我講太大聲了，整個小窩都聽得到。',
      '這幾天我有排一排葉子，排成一條恐龍。\n可是最後少了一片當尾巴。\n這片先送你，尾巴就不要了啦！',
      '剛才我吃點心的時候想了一個笑話。\n笑到差點忘了咬。\n欸，你來了，等我想起來再講給你聽。',
      '你回來啦。\n我這幾天跑累了就自己趴著休息。\n現在可以坐你旁邊嗎？我想靠一下。'],
    gift:['嘿！我是龍龍，從{w}家走了好遠的路過來。\n{w}說：「{m}」\n路上撿了一片葉子，送你。'],
  },
  // 史努比：每封信開頭一句，接著是連載小說的下一章
  snoopy:{
    intro:[
      '作家史努比報到，恭喜你成為本作家唯一指定的編輯。',
      '咳咳，作家正式入住小窩了，午睡的地方也找好了。',
      '跟你說，作家有一個寫小說的大計畫，書名已經想好了喔。',
      '嗨，讀者你好啊，作家今天第一次用這個信箱，有點緊張耶。'],
    cards:[
      '一起做了 {n} 件事，作家覺得夠寫一本書了，書名晚點想。',
      '{n} 件耶！作家宣布今天可以提早收工，先吃點心。',
      '作家和你做完 {n} 件事了，編輯，這個成績還可以吧？',
      '我們有 {n} 件事的回憶了，作家想幫每件取一個很帥的名字。',
      '欸，{n} 件了耶，作家差點想在沙發上開記者會。',
      '本作家做了 {n} 件事，搭檔也就是你，表現得非常好。',
      '作家剛算過了，我們一起做了 {n} 件，這可比寫第一句容易多了。',
      '做完 {n} 件事囉，今天作家有個好心情，連午睡都笑著睡。'],
    anniv:[
      '作家在小窩住滿 {y} 年啦，小說還在寫，午覺倒是每天都有睡。',
      '{y} 年了耶，作家決定今天給自己放個假，喔，還有編輯也是。',
      '本作家來小窩滿 {y} 年，特別感謝你提供這麼舒服的寫作環境。',
      '住滿 {y} 年了，作家最喜歡的書評還是你坐在旁邊看的樣子。',
      '欸，作家來這裡 {y} 年了，現在連閉著眼睛都知道沙發在哪。',
      '{y} 年啦，作家很高興認識你，這一句不用編輯改喔。'],
    miss:[
      '讀者回來啦，作家這幾天在沙發上構思，順便睡了好幾個午覺。',
      '咳咳，作家這幾天有一個很棒的靈感，剛睡醒就忘掉半個。',
      '欸，你來啦，作家剛剛演了一次王牌飛行員，降落在枕頭上。',
      '這幾天作家用各種姿勢找靈感，最後發現趴著最好想事情。',
      '本作家這幾天都在研究故事的開頭，結果想出好多書名。',
      '報告編輯，作家這幾天有好好吃飯，靈感沒有餓到。',
      '作家剛才在沙發上練習接受訪問，問到第三題就自己笑了。',
      '跟你講，這幾天作家想寫一本關於點心的書，想到肚子餓。',
      '歡迎回來，編輯，作家這幾天的午睡品質堪稱世界第一。',
      '這幾天作家一直在練習很帥的站姿，後來覺得坐著就很帥了。',
      '欸讀者，你來得正好，作家剛才做了一個超長的夢，好好玩喔。',
      '這幾天作家試著邊走邊想故事，差點走過頭，還好小窩就這麼大。',
      '讀者你坐啊，作家這幾天找到一個很舒服的位置，可以一起坐。',
      '作家這幾天很有精神，今天想跟你聊聊天，小說的事也慢慢來嘛。'],
    gift:['作家史努比，從{w}家來你家取材。\n{w}說：「{m}」\n新的一章，要從你家開始寫。'],
  },
  piggy:{
    intro:[
      '我是火腿，有些事先說在前頭喔。\n{r}的{f}跟旁邊搭起來嘛，我得再研究一下。\n不過這個家其實還不錯。',
      '欸，{r}的{f}是你選的喔？\n我看了兩遍，第二遍比第一遍順眼。\n好啦，我這人剛來也不好意思打太低分。',
      '初次見面，我先給{r}的{f}打七分。\n另外三分等我熟了再說。\n我住得滿舒服的，其實還不錯啦。',
      '我叫火腿，平常有問題可以問我。\n像{r}的{f}嘛，我有一點自己的看法。\n不過你喜歡就好，先不開會了。'],
    cards:[
      '做了 {n} 件了喔，效率不錯嘛。\n至於{r}的{f}，本來想提出兩個意見。\n今天心情好，算了啦，其實還不錯。',
      '欸，我們一起完成 {n} 件了。\n我看{r}的{f}也沒那麼突兀了。\n你還滿有眼光的嘛。',
      '你看看，{n} 件都做完了。\n{r}的{f}我還沒看懂它好看在哪。\n但你做事情的本事，其實還不錯。',
      '一起做了 {n} 件，值得給自己拍個手。\n我本來還想評論一下{r}的{f}。\n好啦，今天只講好聽的。',
      '{n} 件了，我早就說你可以嘛。\n{r}的{f}倒是讓我想了半天，怎麼看都滿有個性的。\n欸，其實還不錯耶。',
      '我給我們這 {n} 件事打滿分。\n{r}的{f}嘛，另外計分。\n不過你今天表現這麼好，那個就先放著吧。',
      '邪惡豬排博士宣布，我們已經完成 {n} 件事。\n下一項研究是{r}的{f}怎麼會這麼搶眼。\n目前結論是，其實還不錯。',
      '做完 {n} 件了，來休息一下。\n{r}的{f}雖然不太合我的胃口。\n可是跟你一起住，我倒是滿開心的。'],
    anniv:[
      '住滿 {y} 年啦，我現在算是這裡的老住戶了。\n{r}的{f}我有時候還是會多看兩眼。\n看久了，其實還不錯嘛。',
      '{y} 年了喔，過得真快。\n以前我對{r}的{f}就有點意見，現在嘛。\n好啦，你選的東西還真有你的風格。',
      '來小窩滿 {y} 年，今天打個分數。\n{r}的{f}先扣半分，誰叫我眼光那麼高。\n其他的都給滿分，其實還不錯啦。',
      '我住這裡 {y} 年了，給你個建議。\n{r}的{f}可以再考慮一下整體搭配。\n不過連我都住習慣了，就留著吧。',
      '欸，今天滿 {y} 年。\n{r}的{f}我越看越覺得奇怪，奇怪的是我居然看習慣了。\n其實還不錯啦。',
      '來這裡 {y} 年了，我有句話要說。\n{r}的{f}如果照我的喜好選，可能會完全不一樣。\n但這裡有你自己的味道，我滿喜歡的。'],
    miss:[
      '這幾天我研究了一下{r}的{f}。\n原本想打六分，後來發現六分有點太嚴格。\n給八分好了，其實還不錯。',
      '欸，你回來啦。\n我這幾天一直覺得{r}的{f}好像少了點什麼。\n後來仔細一看，可能只是我太愛找問題了。',
      '這幾天本博士在做一項研究。\n題目是為什麼{r}的{f}這麼有存在感。\n研究到一半睡著了，暫時結論：其實還不錯。',
      '你來啦，我剛睡飽。\n這幾天我把{r}的{f}從不同角度看了一遍。\n好啦，從你平常坐的地方看是滿好看的。',
      '我跟你講，這幾天我一直在想{r}的{f}。\n如果讓我選，我可能還要猶豫半天。\n你倒是很乾脆，嗯，其實還不錯。',
      '這幾天我有幫小窩做個評分。\n{r}的{f}太有自己的風格，我差點不知道怎麼評。\n算了，自己家不用跟誰比啦。',
      '你回來啦，我這幾天都過得滿好的。\n有空就看看{r}的{f}，有時候還真想唸兩句。\n不過看久了，其實還不錯。',
      '這幾天我假裝自己是室內設計師。\n先從{r}的{f}開始評論，講了半天都沒人付我錢。\n好啦，今天免費說一句：滿好看的。',
      '我這幾天發現{r}的{f}很有意思。\n第一眼覺得哪裡怪怪的，第二眼又覺得滿合理的。\n這個家嘛，其實還不錯。',
      '這幾天我替自己安排了午睡時間。\n睡醒再看看{r}的{f}，照例有一點意見。\n算了，剛睡飽心情好，不唸了。',
      '欸，剛才我在研究{r}的{f}的配色。\n越想越覺得我應該收顧問費，不過你就算了。\n你家其實還不錯。',
      '這幾天我本來打算給{r}的{f}寫個評語。\n寫到一半，想想我自己也是粉紅色的。\n好像也沒資格說人家太搶眼嘛。',
      '我這幾天閒著就看看{r}的{f}。\n有一次還忍不住對它講了幾句，當然它沒理我。\n安安靜靜的，其實還不錯。',
      '你來啦，這幾天家裡都很好。\n{r}的{f}嘛，我還是有一點意見。\n那個晚點再說，今天先坐一下。'],
    gift:['我是火腿，從{w}家來的。\n{w}說：「{m}」\n先讓我進去看看你家擺得怎樣。'],
  },
};
// 史努比的連載《浴缸號出航》，一封信一章，兩部共 20 章，寫完之後作家去找靈感
const SNOOPY_NOVEL = [
  '浴缸號是一艘白色的船，停在浴室。船長是一隻很勇敢的狗，他今天決定出海。',
  '船開出浴室門口，前面是一片深藍色的地毯海。船長戴上帽子，大喊：「出發！」',
  '地毯海上起了大浪，原來是彈跳豬在跳。船長抓緊船舵，對著海浪敬禮。',
  '船停在沙發島。島上住著一位愛睡覺的島民，船長跟他借了一顆枕頭當帆。',
  '夜裡，船長看見天上的星星排成一塊餅乾的形狀。他把這件事寫進航海日記。',
  '船長遇到一隻在海上漂的拖鞋，裡面坐著一隻小狗。小狗說他在找寶藏。',
  '兩個人一起找寶藏。地圖上的叉叉，畫在一盒點心上。',
  '打開點心盒，裡面只剩一張紙條：「貓咪老師到此一遊」。',
  '船長沒有生氣。他說，一起找寶藏的這一路就很好玩了。說完自己感動得哭了。',
  '浴缸號回到浴室。船長泡了一個很長的澡，決定明天寫續集。（第一部完）',  // 第二部（2026-11-26 加）
  '浴缸號的船長正在泡澡，一個小瓶子漂到他腳邊。裡面有張紙條，上面寫著：「請來找我。」',
  '紙條背面畫了一片葉子。船長研究了半天，最後把紙條拿反了。他決定先去臥室找找看。',
  '浴缸號才剛開進臥室，前面就出現一座會動的山。船長拿起枕頭當盾牌，大喊：「全船注意！」',
  '原來是彈跳豬在練跳高。船長的帽子被震飛了，彈跳豬一口接住。船長說：「謝謝，下次用手接。」',
  '船長遇到一顆躺著的蛋，問他葉子在哪裡。蛋黃哥懶得抬手，翻了個身，用屁股指了個方向。',
  '船長照著方向走，果然找到一排葉子。他數到第六片，發現第七片黏在自己的腳底下。',
  '葉子排到衣櫃旁邊就不見了。船長清了清喉嚨，準備說一段很帥的開場白。',
  '「吼——！」衣櫃後面冒出一個小腦袋。船長嚇得跳上浴缸號，說：「剛才那是緊急登船演習。」',
  '寄信的是龍龍。他本來只是想嚇船長，後來又偷偷排了好長一條葉子路，想讓船長真的找得到他。',
  '船長邀請龍龍上船當大副。回浴室的路上，兩個人一直玩誰先笑的遊戲，結果船長輸了十次。（第二部完）',
];
const SNOOPY_REST = ['作家去泡澡找靈感了，下一章快寫好了。', '作家在屋頂上想劇情，想著想著睡著了。下一章再說。', '第三部的開頭寫了三次，都被作家自己撕掉了。再等等。'];
// 小窩更新了：薯餅寫的，不佔娃娃一天一封的名額。順序是舊的在前、新的在後（後寄的排在信箱上面）。
// 所有人都收得到，新玩家也收（才知道小窩有哪些功能）。幣只給一次：見 coin1 和 hi
// 口氣（2026-11-27 使用者定的，全文在 ~/Desktop/GitHub收藏/薯餅小窩/薯餅更新信_小孩版.md）：小孩子講話、樹懶慢吞吞（句子中間用「……」停一下，一封兩到四次）、
//   結尾輪著換，不要每封都想睡覺。zz:1 = 結尾接「……Zzz」、最後幾個字往下掉；沒標的更新信不接（薯餅自己的信照舊都接）
const MAIL_HI_FROM = '2026-11-26';   // 這天以後才開始玩的人算新玩家，收歡迎信
const MAIL_NEWS = [
  {id:'v4', t:'2026-11-26', zz:1, b:'我跟你說喔……小窩多了好多東西。\n有信箱了。大家會寫信給你。信不會不見，有空再看就好。\n窗戶外面會變喔。春天有花瓣，冬天會下雪。過節的時候，架子上會多出過節的東西。\n門外面有一座小島，可以種花、搖樹，還會有小客人來。\n夾到家裡已經有的娃娃，可以送給朋友。要先登入才可以。\n嗯……我講完了。講了好久喔。我要去睡午覺了'},
  {id:'v5', t:'2026-11-26', b:'小窩又有新的東西了。都是跟朋友一起玩的……要先登入喔。\n上面有一顆畫著兩個人的按鈕，那是朋友。朋友的事都從那裡開始。\n朋友來你家，可以貼貼紙，寫一句話給你。\n相簿裡還沒來的娃娃，點旁邊的星星，朋友就知道你想要誰。\n朋友可以來小島幫你澆水，你也可以去幫他。\n可以讓一隻娃娃去朋友家睡一晚。牠隔天會帶日記回來。\n拍照以後，可以變成明信片寄給朋友。\n朋友來的時候，我會走去門口接他。可是我走到的時候……他好像都要回家了。'},
  // a：附件。coin-30 = 30 枚幣。coin1 是補給舊玩家的；新玩家改收歡迎信 hi（也附 30 枚），兩封只會收到一封
  {id:'coin1', t:'2026-11-26', a:'coin-30', b:'我數了一下……大家的幣好像都不夠用。\n所以我改了幾件事喔。\n每天來，送你 20 枚。做完一件小事，給 3 枚。每天第一次夾娃娃，不用錢。\n幣不夠的時候，點上面的幣，它會跟你說還可以做什麼。\n信裡面有 30 枚，先給你用。\n我是一枚一枚慢慢數的。數到 30 的時候……天都黑了。'},
  {id:'f1', t:'2026-11-26', b:'家具多了 17 件喔。我數過了，數了很久。\n每一隻都有一件自己的。我的是吊床。別人的……你自己試試看。\n還有甜點的家具，看起來很好吃，可是不能吃。全部收齊，送你一張奶油色的壁紙。\n牆上也多了三樣可以掛的。\n娃娃機夾得到，火腿的小店也有賣，每天賣的不一樣。\n我要去試吊床了。爬上去……要一點時間。你先玩。'},
  {id:'f2', t:'2026-11-26', b:'又多了好多好多東西。我念給你聽……我念很慢喔。\n家具有森林的、海邊的、太空的，每一種六件。收齊了會送你地板或壁紙。\n還有一個魚缸。貓咪老師一直盯著魚看，我覺得牠想吃。\n多了兩間房間，廚房和閣樓。火腿的小店有賣鑰匙和梯子，買了就可以進去。閣樓晚上看得到流星喔。\n窗戶外面，早上和傍晚的顏色不一樣。有時候會下雨。\n念完了。謝謝你……等我念完。'},
  {id:'one1', t:'2026-11-26', b:'娃娃的事改了一下……我跟你說。\n每一種娃娃，家裡就住一隻。\n如果夾到家裡已經有的，那一隻可以送給朋友，也可以先留著。\n留著的那一隻，會站在娃娃機旁邊當店員，每天帶 2 枚幣回來。想送人的時候，點牠就可以。\n已經留一隻了，又夾到一樣的，會變成 3 枚幣。以前多出來的，也幫你換成幣了。\n我也想當店員。可是火腿說……客人等不了那麼久。'},
  {id:'look1', t:'2026-11-26', b:'小窩變了一個樣子喔。你有發現嗎。\n牆壁、家具、按鈕，都變成一張一張的紙，疊在一起。字也換了，像用筆寫的。\n晚上房間會暗暗的，窗戶旁邊有一圈黃黃的光。\n東西都在原本的地方。娃娃、家具、幣，一個都沒有少。\n壁紙和地板的花紋變得淡淡的，要靠很近才看得到。\n我每一間都去看過了。走了……一個下午。沙發還是我的。'},
  {id:'tv1', t:'2026-11-26', b:'我跟你說喔……大家可以去旅行了。\n客廳的門旁邊有一個背包。點它，可以放點心進去。點心在火腿的小店買。\n放好就不用管了喔。誰想出門，會自己背著走。要去哪裡，牠們自己決定。\n出門的那一隻，會留一張紙條給你。牠在路上會寄明信片回來，回家還會帶小東西給你。\n沒有放點心，牠們也會出門，只是走不遠。\n相簿上面有一顆「旅行」，明信片都貼在那裡。\n我也想去泡溫泉。現在出發的話……大概明年會到。'},
  // 小島重做：yard2 只寄給有舊進度換到幣的人（js/yard.js 的 yardMigMail 寄，幣附在那一封上）；其他人收 yard2n
  {id:'yard2', mig:1, t:'2026-11-27', b:'我跟你說喔……門外面的小島，整個換新了。\n現在從客廳的門走出去，就是小島。娃娃可以帶過去玩。\n中間有一排花圃。點空的地方就可以種花，大概半天會開。開了點一下，就收起來了。\n左邊有一棵大樹，每天會長三顆果子。點樹，果子就掉下來。\n前面的墊子上有一個盤子。放一份點心，會有小客人跑來吃，還會留東西給你。\n以前種的東西，我幫你換成幣了，放在信裡面。\n我也想搖那棵樹。我搖了喔……它還沒有動。'},
  {id:'yard2n', t:'2026-11-27', b:'我跟你說喔……門外面的小島，整個換新了。\n現在從客廳的門走出去，就是小島。娃娃可以帶過去玩。\n中間有一排花圃。點空的地方就可以種花，大概半天會開。開了點一下，就收起來了。\n左邊有一棵大樹，每天會長三顆果子。點樹，果子就掉下來。\n前面的墊子上有一個盤子。放一份點心，會有小客人跑來吃，還會留東西給你。\n你不在的時候，小客人也會來喔。\n我也想搖那棵樹。我搖了喔……它還沒有動。'},
  {id:'fam1', t:'2026-11-27', b:'大家……可以一起出門了喔。\n火腿的小店多了一個野餐籃。放進門邊的背包，下一次就是全家一起去。\n全家出門的時候，客廳會留一張大紙條。上面寫去哪裡、什麼時候回來。\n牠們會寄全家福回來。回家的時候，每一隻都帶一樣小東西。\n還有喔，每次回家都會多一張合照。相簿上面的「旅行」點進去，最上面那一排就是。\n全家一起走的時候，大家都在前面等我。謝謝大家……等我。'},
  {id:'any1', t:'2026-11-27', b:'家具現在……哪一間都可以擺喔。\n床可以搬到客廳，浴缸可以放到閣樓。小島上面也可以擺。\n掛在牆上的不能帶去小島。小島沒有牆壁。\n收納架的家具那一頁，現在全部的家具都在。已經擺在別間的，上面有那一間的小圖，點一下就搬過來。\n小屋地圖上還沒開的房間，點一下就可以打開，不用再去小店找了。\n我想把沙發搬去小島曬太陽。推了一個早上……它動了一點點。'},
  // 出國（js/abroad.js）：附一張機票（附件 'ticket'，每個人一張，收下時記在 album.tv.tk）
  {id:'air1', t:'2026-11-27', a:'ticket', b:'我跟你說喔……大家可以搭飛機了。\n信裡面有一張機票，送你的。之後火腿的小店也有賣。\n把機票放進門旁邊的背包。下一個出門的，就會飛去很遠的地方，兩三天才回來。\n現在有四個地方：雙峰塔、台北101、富士山、艾菲爾鐵塔。去哪裡牠們自己決定。\n機票加野餐籃，就是全家一起去。\n每個地方有三張明信片，還有一樣那裡才有的小東西。\n相簿的「旅行」裡多了一本護照。去過一個地方，就蓋一個章喔。\n大家都在排隊蓋章了。我還在……找我的護照。'},
  {id:'cut1', t:'2026-11-27', b:'家具……都換了新的樣子喔。\n以前有些家具，跟房間看起來不太一樣。現在每一件都是用色紙一張一張剪的。\n床、沙發、魚缸、過節的燈籠，全部都剪好了。\n東西都在原本的地方，一件都沒有少。坐的位置也一樣。\n甜甜圈坐墊看起來更好吃了。還是不能吃喔，我試過了。\n我也在剪一張。剪了三天……快剪到一半了。'},
  {id:'box1', t:'2026-11-27', b:'信箱……整理好了喔。\n上面多了一排按鈕：全部、娃娃的信、小窩更新、明信片、朋友家。\n我寫的這種信，都放在「小窩更新」。\n朋友寄來的明信片，還有大家旅行寄回來的，都在「明信片」。\n去朋友家過夜帶回來的小紙條，在「朋友家」。\n信變多也不會把別的信擠掉了。\n「小窩更新」那一格全部都是我寫的。我數了一下……我好像很忙。'},
  {id:'air2', t:'2026-11-27', b:'護照……又多了四頁喔。\n泰國的鄭王廟、義大利的比薩斜塔、土耳其的聖索菲亞、冰島的哈爾格林姆教堂。\n鄭王廟的塔上面貼滿小小的瓷片，拼成一朵一朵的花。\n比薩斜塔是歪的。真的歪歪的。我歪著頭看，它就直了。\n機票一樣放進門旁邊的背包。去哪裡，牠們自己決定。\n每個地方有三張明信片，還有一樣那裡才有的小東西。\n冰島那間教堂蓋了四十一年才蓋好。我覺得……我跟它很合得來。'},
  // 歡迎信：不在下面的迴圈裡寄，mailCheck 最後才寄，這樣會排在信箱最上面
  {id:'hi', hi:1, title:'歡迎來小窩', a:'coin-30', b:'你……好。我是薯餅。\n這裡是小窩喔。我跟大家一起住在這裡。\n我講話很慢，走路也很慢。你慢慢聽就好。\n信裡面有 30 枚幣，送你的。\n娃娃機夾一次要 2 枚。每天第一次……不用錢喔。\n幣不夠的話，點上面那個幣。它會跟你說可以做什麼。\n下面還有好幾封信，在講小窩有什麼好玩的。不用急，慢慢看。\n我想跟你揮手。等我一下喔……手快舉起來了。'},
];

/* ---------- 存檔 ---------- */
function mailInit(){
  const m = S.mail = S.mail || {};
  m.l = m.l || []; m.s = m.s || {}; m.arch = m.arch || {}; m.last = m.last || ''; m.att = m.att || '';
  if (!m.n){
    // 舊存檔：做過的小事先算一次
    m.n = {};
    Object.keys(S.album.cards || {}).forEach(id => { const e = evById(id); if (e) e.d.forEach(d => m.n[d] = (m.n[d] || 0) + 1); });
    MAIL_CARDS.forEach(c => DOLLS.forEach(d => { if ((m.n[d] || 0) >= c) m.s[`cards-${d}-${c}`] = m.s[`cards-${d}-${c}`] || 'old'; }));
  }
  return m;
}
// 小事做完一件（main.js 的 doEvent 會叫）
function mailCount(e){ const m = mailInit(); e.d.forEach(d => m.n[d] = (m.n[d] || 0) + 1); }

const mailParse = k => {
  const [head, q = ''] = k.split('#'), [d, type, i] = head.split('.');
  const p = {};
  q.split(';').filter(Boolean).forEach(x => { const [a, b] = x.split('='); p[a] = b; });
  return {d, type, i: +i, p};
};
function mailPiggyRoom(){
  const pool = [];
  Object.keys(MAIL_ROOM).forEach(r => (S.home[r] ? S.home[r].items : []).forEach(it => { if (it.kind === 'furn' && MAIL_FURN[it.id]) pool.push(`r=${r};f=${it.id}`); }));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : 'r=living;f=sofa';
}
// 寄一封娃娃的信（news 也走這裡）。ai：AI 寫好的字（js/mailai.js），沒有就是用範本
function mailAdd(d, type, q, today, ai){
  const m = mailInit();
  const n = type === 'news' ? 0 : MAIL_TPL[d][type].length;
  // 先挑這隻這種信還沒寫過的版本；都寫過了才重複，而且不跟上一封一樣
  let i = 0;
  if (n > 1){
    const used = (m.arch[d] || []).map(s => mailParse(s.slice(11))).filter(x => x.type === type).map(x => x.i);
    const all = [...Array(n).keys()], fresh = all.filter(j => !used.includes(j));
    const pool = fresh.length ? fresh : all.filter(j => j !== used[used.length - 1]);
    i = pool[Math.floor(Math.random() * pool.length)];
  }
  const parts = q ? [q] : [];
  if (d === 'piggy' && type !== 'news' && !/(^|;)r=/.test(q || '')) parts.push(mailPiggyRoom());
  if (d === 'snoopy' && type !== 'news') parts.push(`c=${(m.arch.snoopy || []).length + 1}`);
  if (ai && typeof mailAiEnc === 'function') parts.push('ai=' + mailAiEnc(ai));
  const k = `${d}.${type}.${i}${parts.length ? '#' + parts.join(';') : ''}`;
  let a = null;
  if (type === 'news') a = (MAIL_NEWS.find(x => 'id=' + x.id === q) || {}).a || null;
  if (type !== 'news' && m.att !== today && d !== 'nyanko' && Math.random() < MAIL_ATT_RATE){
    // 去過小島之後，三成的附件改成一顆種子
    const seed = typeof yardPickSeed === 'function' && S.yard && S.yard.day && Math.random() < .3;
    a = seed ? 'seed-' + yardPickSeed() : d === 'moodeng' ? 'bubble' : Math.random() < .5 ? 'snack' : 'bubble';
    m.att = today;
  }
  m.l.unshift({k, t: today, r: 0, a, g: 0});
  mailTrim(m.l);   // 滿了先刪那一類最舊的「看過、附件也領了」的；都還沒看就留著（不會因為太久沒看而不見）
  if (type !== 'news'){
    const ar = m.arch[d] = m.arch[d] || [];
    ar.push(`${today}|${k}`);
    if (ar.length > MAIL_ARCH) ar.splice(0, ar.length - MAIL_ARCH);
    m.last = today;
  }
}

/* ---------- 同一封信只留一封 ----------
   2026-11-27 使用者的信箱裡同一封更新信出現兩次：兩台裝置各在不同天寄了同一封，合併時是照「日期＋內容」比，日期不同就都留下來了。
   薯餅的更新信：同一個編號只留一封（不看日期）。其他的信：同一天、同一封才算重複（同一句話隔幾個月再寄一次是正常的）。
   留下來的那一封，「看過」「附件領過」只要有一邊是，就算是：附件不會因為重複多領一次，也不會變回沒領。js/account.js 合併存檔時用同一套（mailSameKey）。 */
const mailSameKey = o => (/^[a-z]+\.news\./.test(o.k) ? o.k : o.t + '|' + o.k);
function mailDedupe(m){
  const seen = new Map(), keep = [];
  (m.l || []).forEach(o => {
    if (!o || typeof o.k !== 'string') return;
    const k = mailSameKey(o), first = seen.get(k);
    if (!first){ seen.set(k, o); keep.push(o); return; }
    if (o.r) first.r = o.r; if (o.g) first.g = o.g; if (o.f) first.f = o.f; if (!first.a && o.a) first.a = o.a;
  });
  const n = (m.l || []).length - keep.length;
  if (n > 0) m.l = keep;
  return n;
}

/* ---------- 什麼時候寫信 ---------- */
// 打開時（atOpen）和過了午夜各看一次。娃娃的信一天最多一封：週年 > 你不在的時候 > 一起做了幾件 > 自我介紹
function mailCheck(atOpen){
  if (typeof VISIT !== 'undefined' && VISIT) return;
  const m = mailInit(), t = todayStr(), y = +t.slice(0, 4);
  const met = S.album.met || {};
  const dup = mailDedupe(m);   // 兩台裝置合併留下的重複信：清一次
  const ydMig = typeof yardMigMail === 'function' && yardMigMail();   // 小島舊進度換成的幣：薯餅的信（js/yard.js）
  const first = Object.values(met).sort()[0] || t;
  let changed = !!ydMig || dup > 0;
  const old = first < MAIL_HI_FROM;   // 歡迎信做好以前就在玩的人
  MAIL_NEWS.forEach(n => {
    if (n.hi || n.mig || m.s['news-' + n.id]) return;
    if (n.id === 'yard2n' && m.s['news-yard2']) return;   // 收過附幣的那一封就不用再收這封
    if (n.id === 'coin1' && (!old || m.s['news-hi'])) return;   // 新玩家的 30 枚在歡迎信裡，不重複給
    m.s['news-' + n.id] = t;
    if (m.l.some(o => o.k === 'sloth.news.0#id=' + n.id)) return;   // 信箱裡已經有這一封（另一台裝置寄過、合併進來的）：只補記，不再寄一次
    mailAdd('sloth', 'news', 'id=' + n.id, t); changed = true;
  });
  // 歡迎信：沒收過、也沒收過 coin1 的新玩家。最後寄，排在最上面
  if (!old && !m.s['news-hi'] && !m.s['news-coin1']){ m.s['news-hi'] = t; if (!m.l.some(o => o.k === 'sloth.news.0#id=hi')) mailAdd('sloth', 'news', 'id=hi', t); changed = true; }
  const have = DOLLS.filter(d => DOLL_N[d] && met[d]);
  if (m.last !== t && have.length && !(typeof mailAiBusy !== 'undefined' && mailAiBusy)){
    let pick = null;
    // 週年：season.js 那天已經記下 anniv-娃娃-年，這裡補一封信。同一天好幾隻，一天寄一隻
    for (const d of have){
      const yrs = y - +met[d].slice(0, 4);
      if (yrs > 0 && typeof seasonHas === 'function' && seasonHas(`anniv-${d}-${y}`) && !m.s[`anniv-${d}-${y}`]){ pick = [d, 'anniv', 'y=' + yrs, `anniv-${d}-${y}`]; break; }
    }
    if (!pick && atOpen && LAST_T && Date.now() - LAST_T > MAIL_MISS_DAYS * 864e5 && !m.s['miss-' + t]){
      const d = have[Math.floor(Math.random() * have.length)];
      pick = [d, 'miss', '', 'miss-' + t];
    }
    if (!pick) for (const d of have){
      const c = [...MAIL_CARDS].reverse().find(c => (m.n[d] || 0) >= c && !m.s[`cards-${d}-${c}`]);
      if (c){
        MAIL_CARDS.filter(x => x < c).forEach(x => m.s[`cards-${d}-${x}`] = m.s[`cards-${d}-${x}`] || t);   // 一口氣跨過好幾個，只寫最大的那封
        pick = [d, 'cards', 'n=' + c, `cards-${d}-${c}`]; break;
      }
    }
    if (!pick){ const d = have.find(d => met[d] < t && !m.s['intro-' + d]); if (d) pick = [d, 'intro', '', 'intro-' + d]; }
    if (pick && mailSend(pick, t)) changed = true;
  }
  if (changed) save();
  mailBadge();
}

// 寄出挑好的那封（pick = [娃娃, 哪種信, 參數, 記在 m.s 的名字]）。回 true = 已經放進信箱
// 登入雲端帳號的人先請 AI 寫（js/mailai.js），等牠寫好才放進信箱；沒登入、寫不出來、等太久就用範本
function mailSend(pick, t){
  const [d, type, q0, flag] = pick;
  const q = d === 'piggy' ? [q0, mailPiggyRoom()].filter(Boolean).join(';') : q0;   // 火腿要吐槽哪樣家具先挑好，AI 和範本講同一樣
  const put = ai => {
    const m = mailInit();
    if (m.s[flag] || m.last === t) return false;   // 等的時候已經寄過了
    m.s[flag] = t; mailAdd(d, type, q, t, ai);
    return true;
  };
  if (typeof mailAiAsk !== 'function' || !mailAiOn(type)) return put('');
  mailAiAsk(d, type, q).then(ai => {
    if (!put(ai)) return;
    save(); mailBadge();
    if ($('#sheet .ml-box') && !$('#sheet').hidden){ if (mlOpenIx >= 0) mlOpenIx++; openMail(true); }   // 信箱開著：新的信排最上面，原本打開的那封往下一格
  });
  return false;
}

/* ---------- 信的樣子 ---------- */
const mailDec = s => { try { return decodeURIComponent(s || ''); } catch (e) { return ''; } };
const mailEsc = s => s.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function mailFill(s, p){
  const yw = {1:'一', 2:'兩'}[p.y];   // 一年、兩年不留空格；3 年以上照數字寫
  return s.replace(/\{n\}/g, p.n || '').replace(/( ?)\{y\}( ?)/g, (_, a, b) => yw || a + (p.y || '') + b)
    .replace(/\{r\}/g, MAIL_ROOM[p.r] || '客廳').replace(/\{f\}/g, MAIL_FURN[p.f] || '沙發')
    .replace(/\{w\}/g, p.w || '朋友').replace(/\{m\}/g, () => p.x ? txSlot(mailDec(p.x)) : MAIL_GIFT_LINES[p.m] || MAIL_GIFT_LINES[0])
    .replace(/\{x\}/g, () => txSlot(mailDec(p.x)));
}
function mailText(k){
  const {d, type, i, p} = mailParse(k);
  let title = mailFill(MAIL_TITLE[type] || '', p), body;
  let zz = type !== 'news';   // 薯餅寫到一半睡著的結尾：牠自己的信都有，更新信只有標了 zz 的那幾封
  if (type === 'news'){ const n = MAIL_NEWS.find(n => n.id === p.id) || MAIL_NEWS[0]; body = n.b; if (n.title) title = n.title; zz = !!n.zz; }
  else if (type === 'pc' && typeof tvMailText === 'function'){
    // 旅行寄回來的明信片（js/travel.js）
    const r = tvMailText(d, p);
    return {d, type, title: r.title, body: r.body, from: r.from, pic: r.pic};
  } else if (type === 'trip'){
    // 過夜日記（data.js 的 STAY_DIARY）＋主人塞的小紙條
    const e = ((typeof STAY_DIARY !== 'undefined' && STAY_DIARY[d]) || [])[i];
    body = mailFill((e ? e.t : '在{w}家住了一晚。') + (p.x ? '\n{w}塞了一張小紙條讓牠帶回來：\n「{x}」' : ''), p);
  } else {
    const ai = p.ai ? mailEsc(mailDec(p.ai)) : '';   // AI 寫的信（js/mailai.js）。解不開就退回範本
    body = ai || mailFill((MAIL_TPL[d] && MAIL_TPL[d][type] || [''])[i] || '', p);
    if (type === 'gift' && (p.e === '1' || p.e === '2')) body += '\n' + mailGiftNote(d, +p.e, false);
    if (d === 'snoopy' && type !== 'gift'){
      const c = +p.c || 1;
      title = `《浴缸號出航》第 ${c} 章`;
      body += '\n' + (SNOOPY_NOVEL[c - 1] || SNOOPY_REST[(c - 1) % SNOOPY_REST.length]);
    }
  }
  return {d: type === 'news' ? 'sloth' : d, type, title, body, zz};
}
function mailBodyHTML(x){
  const lines = x.body.split('\n');
  // 送來的娃娃家裡已經有：最後多一行括號的說明（mailGiftNote），不是娃娃寫的，字小一點、也不算薯餅睡著的那一行
  const note = x.type === 'gift' && /^（(你家|家裡)已經有/.test(lines[lines.length - 1]) ? lines.length - 1 : -1;
  const html = lines.map((l, j) => {
    if (l === '[拖鞋]') return `<p class="ml-sl">${typeof DROP_SVG !== 'undefined' ? DROP_SVG.slipper : ''}</p>`;
    if (j === note) return `<p class="ml-nt">${l}</p>`;
    const last = j === lines.length - 1 - (note >= 0 ? 1 : 0);
    if (x.d === 'sloth' && last && x.type !== 'trip' && x.type !== 'pc' && x.zz !== false){
      // 薯餅寫到一半睡著：最後幾個字一個比一個往下掉，後面接 Zzz（不然看起來像字被切掉）
      const cs = /[<&]/.test(l) ? null : [...l], n = 7;
      const tail = cs ? cs.slice(0, Math.max(0, cs.length - n)).join('') + cs.slice(-n).map((c, k) => `<span style="--i:${k + 1}">${c}</span>`).join('') : l;
      return `<p class="tilt">${tail}<span class="zz" style="--i:${cs ? Math.min(n, cs.length) + 2 : 3}">……Zzz</span></p>`;
    }
    return `<p>${l}</p>`;
  }).join('');
  return `<div class="ml-tx ${x.d === 'moodeng' ? 'big' : ''} ${x.d === 'snoopy' ? 'novel' : ''}">${html}</div>`;
}
const mailSnip = x => x.d === 'dino' && x.type !== 'news' && x.type !== 'pc' ? '一片葉子' : x.body.split('\n')[0].replace('[拖鞋]', '');
function mailCard(o, j, open, tag){
  const x = mailText(o.k);
  const from = x.type === 'news' ? '薯餅' : x.from || DOLL_NAME[x.d];
  let inner = '';
  if (open){
    // 龍龍：先是一片葉子，點一下翻到背面
    inner = x.d === 'dino' && x.type !== 'news' && x.type !== 'pc' && !o.f
      ? `<button class="ml-leaf" data-flip="${j}" aria-label="把葉子翻過來">${MAIL_LEAF}<small>點一下翻過來</small></button>`
      : (x.pic || '') + mailBodyHTML(x) + `<p class="ml-sg">${from}</p>`;
    if (o.a) inner += `<div class="ml-att ${o.g ? 'got' : ''}">${mailAtt(o.a).svg}<span>${o.a.startsWith('coin-') ? '附上 ' : o.a === 'ticket' ? '附上一張' : '附上一個'}${mailAtt(o.a).name}</span>${o.g ? '<small>收下了</small>' : `<button class="btn y sm" data-take="${j}">收下</button>`}</div>`;
  }
  return `<div class="ml ${o.r ? '' : 'unread'} ${open ? 'open' : ''}">
    <button class="ml-hd" data-ml="${j}" aria-expanded="${open}"><img src="${SPR[x.d]}" alt=""><span><b>${x.title}</b><small>${tag ? MAIL_CAT_NAME[mailCatOf(o)] + '・' : ''}${from}・${md(o.t)}${o.a && !o.g ? '・有附件' : ''}</small>${open ? '' : `<i>${mailSnip(x)}</i>`}</span></button>
    ${open ? `<div class="ml-bd">${inner}</div>` : ''}</div>`;
}
let mlOpenIx = -1;
// 朋友寄來的明信片（S.mail.pc）在信箱裡的一列：一張一列，點了開那一張（js/card.js 的 cardOpen）
function mailPcRow(c, i, tag){
  return `<div class="ml pc ${c.r ? '' : 'unread'}"><button class="ml-hd" data-mpc="${i}"><span class="pc-st">${typeof CARD_ICON !== 'undefined' ? CARD_ICON : ''}</span><span><b>${txSlot(c.w)}寄來的明信片</b><small>${tag ? MAIL_CAT_NAME.pc + '・' : ''}${md(c.t)}</small><i>${c.msg ? txSlot(c.msg) : '這張沒有寫字。'}</i></span></button></div>`;
}
const mailPcs = () => (S.mail && Array.isArray(S.mail.pc) ? S.mail.pc : []);
// 這一類裡有哪些：信（l 裡的第幾封）和朋友的明信片（pc 裡的第幾張），照日期新的在前
function mailRowsOf(cat){
  const m = mailInit(), rows = [];
  m.l.forEach((o, j) => { if (o && typeof o.k === 'string' && (cat === 'all' || mailCatOf(o) === cat)) rows.push({o, j, t: o.t || ''}); });
  if (cat === 'all' || cat === 'pc') mailPcs().forEach((c, i) => { if (c) rows.push({c, i, t: c.t || ''}); });
  return rows.map((r, n) => [r, n]).sort((a, b) => (a[0].t < b[0].t ? 1 : a[0].t > b[0].t ? -1 : a[1] - b[1])).map(x => x[0]);
}
const mailUnreadOf = cat => mailRowsOf(cat).filter(r => !(r.o || r.c).r).length;
function openMail(keep){
  const m = mailInit();
  if (!keep) mlOpenIx = -1;
  if (!MAIL_CAT_NAME[mailCat]) mailCat = 'all';
  const rows = mailRowsOf(mailCat), all = mailCat === 'all';
  const total = mailUnreadOf('all'), unread = rows.filter(r => !(r.o || r.c).r).length, todo = rows.filter(r => r.o && r.o.a && !r.o.g).length;
  const on = typeof sNet === 'function' && !!sNet();
  const chips = MAIL_CATS.map(([k, name]) => { const n = k === 'all' ? total : mailUnreadOf(k); return `<button class="ng-chip ${k === mailCat ? 'on' : ''}" data-mcat="${k}" aria-pressed="${k === mailCat}" aria-label="${name}${n ? `，${n} 封沒看` : ''}">${name}${n ? '<b></b>' : ''}</button>`; }).join('');   // 有沒看的：右上角一顆小圓點，數量放在 aria-label（顯示數字的話 375 寬排不下五顆）
  const empty = MAIL_EMPTY[mailCat] + (!on && (mailCat === 'pc' || mailCat === 'pal') ? '登入、加了好友之後才會有。' : '');
  const tv = mailCat === 'pc' && typeof tvAlbumOpen === 'function';
  openSheet(`<div class="hd ml-top">${MAIL_ICON}<span>信箱</span>${total ? `<small>${total} 封沒看</small>` : ''}</div>
    <div class="ng-chips ml-cats" role="group" aria-label="信的分類">${chips}</div>
    <div class="ml-box">${rows.length ? rows.map(r => (r.o ? mailCard(r.o, r.j, r.j === mlOpenIx, all) : mailPcRow(r.c, r.i, all))).join('') : `<p class="al-em">${empty}</p>`}</div>
    ${todo || unread || tv ? `<div class="ml-ft">${todo ? '<button class="btn y" data-mall="take">全部領取</button>' : ''}${unread ? '<button class="btn" data-mall="read">全部已讀</button>' : ''}${tv ? '<button class="btn" data-mall="tv">旅行的明信片</button>' : ''}</div>` : ''}`);
  evOpen = false; alOpen = false;
  const cur = $('#sheet .ml-cats .on'); if (cur && cur.scrollIntoView) try { cur.scrollIntoView({block: 'nearest', inline: 'nearest'}); } catch (e) {}
}
// 附件的圖和名字：點心盒、泡泡球、幣（coin-幾枚）、機票（ticket），或小島的種子（seed-種類）
const mailAtt = a => (a.startsWith('coin-') ? {name: `${+a.slice(5) || 0} 枚幣`, svg: COIN} : a === 'ticket' ? {name: '機票', svg: (typeof TV_GOODS !== 'undefined' && TV_GOODS.ticket ? TV_GOODS.ticket.ic : COIN)} : (typeof yardAtt === 'function' && yardAtt(a)) || WISH[a]);
function mailTake(o){
  if (!o.a || o.g) return; o.g = 1;
  if (o.a.startsWith('coin-')){ S.coins += +o.a.slice(5) || 0; renderHud(); return; }
  if (o.a === 'ticket'){ if (typeof tvTicketTake === 'function') tvTicketTake(); return; }   // 機票放進行李的用品裡（js/travel.js）；另一台收過了就不再多一張
  if (o.a.startsWith('seed-')){ S.coins += 1; return; }   // 小島重做後沒有種子了，舊信裡的種子換成 1 枚幣
  S.wish[o.a] = (S.wish[o.a] || 0) + 1;
}
$('#sheet').addEventListener('click', e => {
  if (!$('#sheet .ml-box')) return;
  const m = S.mail, b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.mcat !== undefined){
    if (MAIL_CAT_NAME[b.dataset.mcat]) mailCat = b.dataset.mcat;
    openMail();
  } else if (b.dataset.mpc !== undefined){
    if (typeof cardOpen === 'function'){ mailCardBack = true; cardOpen(+b.dataset.mpc); }
  } else if (b.dataset.ml !== undefined){
    const j = +b.dataset.ml;
    mlOpenIx = mlOpenIx === j ? -1 : j;
    m.l[j].r = 1; save(); mailBadge(); openMail(true);
    const card = $('#sheet .ml.open'); if (card) card.scrollIntoView({block: 'nearest'});
  } else if (b.dataset.flip !== undefined){
    m.l[+b.dataset.flip].f = 1; save(); openMail(true);
  } else if (b.dataset.take !== undefined){
    const o = m.l[+b.dataset.take]; mailTake(o); save(); renderEvBadge();
    toast(`收下${mailAtt(o.a).name}`); openMail(true);
  } else if (b.dataset.mall === 'take'){
    // 只處理現在這一類；在「全部」就是全部
    const got = mailRowsOf(mailCat).filter(r => r.o && r.o.a && !r.o.g).map(r => r.o); got.forEach(mailTake); save(); renderEvBadge();
    toast(`收下 ${got.length} 個附件`); openMail(true);
  } else if (b.dataset.mall === 'read'){
    mailRowsOf(mailCat).forEach(r => { (r.o || r.c).r = 1; }); save(); mailBadge(); openMail(true);
  } else if (b.dataset.mall === 'tv'){
    tvAlbumOpen();
  }
});

/* ---------- 房間右上角的信封 ---------- */
// 朋友那邊來的（從朋友家來的娃娃的信、過夜的日記）。2026-11-27 起信箱也列（「朋友家」那一類），朋友面板（js/friend.js）照舊也列，兩邊是同一份資料
const mailIsPal = o => /^[a-z]+\.(gift|trip)\./.test((o && o.k) || '');
function mailBadge(){
  const b = $('#mailBtn'); if (!b) return;
  // 全部沒看的：信、朋友家的、旅行和朋友寄來的明信片都算。朋友鈕上的數字照它自己的算法
  const n = S.mail && Array.isArray(S.mail.l) ? S.mail.l.filter(o => o && !o.r).length + mailPcs().filter(c => c && !c.r).length : 0;
  if (typeof frBadge === 'function') frBadge();
  b.querySelector('.bd').textContent = n; b.querySelector('.bd').hidden = !n;
  b.classList.toggle('wig', !!n && !REDUCE);
  b.setAttribute('aria-label', n ? `信箱，${n} 封沒看` : '信箱');
}
(function(){
  const b = document.createElement('button');
  b.className = 'cam mailb'; b.id = 'mailBtn'; b.setAttribute('aria-label', '信箱');
  b.innerHTML = MAIL_ICON + '<span class="bd" hidden></span>';
  b.addEventListener('click', () => {
    if ($('#sheet .ml-box') && !$('#sheet').hidden){ $('#sheet').hidden = true; return; }
    openMail();
  });
  room.appendChild(b);
})();

/* ---------- 相簿：這隻寫過的信 ---------- */
function mailRows(d){
  const ar = (S.mail && S.mail.arch[d]) || [];
  if (!ar.length) return '';
  return `<div class="al-sec">寫給你的信</div>${ar.slice().reverse().map(s => {
    const [t, k] = [s.slice(0, 10), s.slice(11)], x = mailText(k);
    return `<details class="al-ml"><summary><b>${x.title}</b><small>${md(t)}</small></summary>${mailBodyHTML(x)}</details>`;
  }).join('')}`;
}

mailCheck(true);
setInterval(() => { if (S.mail && S.mail.last !== todayStr()) mailCheck(false); }, 60000);
addEventListener('nestnet', () => mailBadge());
