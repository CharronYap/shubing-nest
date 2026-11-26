/* 信箱：娃娃寫給你的信，還有薯餅寫的「小窩更新了」
   不懲罰、不催人：信不會過期，附件沒領也一直留著；隔幾天才打開，娃娃寫的是牠這幾天的心情，不寫讓人有罪惡感的話。
   S.mail = {
     l:[{k:'sloth.intro.0#n=5', t:'日期', r:看過, a:'snack'|'bubble'|null, g:附件領了}],   信箱裡的信，最新的在前面，最多 30 封
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
const MAIL_MAX = 30, MAIL_ARCH = 24;
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

/* 每隻每種信的版本數：intro 4、cards 8、anniv 6、miss 14（miss 會一直收到，所以最多）。gift 一種。
   新的版本只能加在每一排的最後面：存檔記的是「第幾個」，中間插一個或調順序，舊的信會變成別封。
   每隻照自己的個性寫：薯餅寫到睡著（最後一行歪掉）、蛋黃哥很短、皮蛋一直汪還會夾拖鞋、彈跳豬字很大全是驚嘆號、
   貓咪老師開頭嘴硬最後要點心、龍龍先給一片葉子背面才是信、史努比寫連載小說、火腿吐槽房間最後補一句還不錯 */
const MAIL_TPL = {
  sloth:{
    intro:['你好，我是薯餅。\n小窩的沙發很軟，我已經在上面躺了一整天。\n以後請多指教，我先閉一下眼睛……',
      '想寫信給你，想了很久要寫什麼。\n想著想著，窗外飄過去三朵雲。\n總之很高興來這裡，我先瞇一',
      '你好。我是薯餅。\n本來想早一點寫信，結果先睡了一覺。\n這裡的地板曬得到太陽，我想我會喜歡這',
      '我到小窩了。\n走到沙發花了一點時間，不過到了。\n以後慢慢認識，不急，我先坐一'],
    cards:['我們一起做了 {n} 件小事了。\n每一件我都記得，有幾件是睡醒才想起來的。\n下次也找我，我會醒著，大概',
      '數了一下，{n} 件了。\n數到一半差點睡著，又從頭數了一次。\n謝謝你常常來找我，晚安……zz',
      '{n} 件了。\n我做事很慢，謝謝你每次都等我。\n下一件也慢慢來，我先休息一',
      '聽說我們一起做了 {n} 件小事。\n我只記得每一次你都在旁邊。\n這樣就很好了，我想再躺一',
      '{n} 件小事，我一件一件想了一遍。\n想到第三件的時候，天就黑了。\n剩下的明天再想，晚',
      '今天有人告訴我，已經 {n} 件了。\n我說喔。過了很久才覺得開心。\n現在還在開心，開心得有點想睡',
      '我們做了 {n} 件事。\n每一件都不大，可是加起來滿滿的。\n我把它們放在枕頭旁邊，然後就',
      '{n} 件。我數得很慢，應該沒有數錯。\n跟你一起做事，時間過得剛剛好。\n下次再找我，我會慢慢走過'],
    anniv:['來小窩滿 {y} 年了。\n這段時間我睡了很多覺，每次醒來你都在。\n今天想醒著久一點，陪你',
      '今天是我來這裡的紀念日。\n我把這一年最喜歡的事想了一遍，想到一半……zz',
      '我來小窩滿 {y} 年了。\n沙發上有一個我躺出來的凹洞，很合身。\n謝謝你讓我待在這裡，我想再待很久很',
      '滿 {y} 年了，他們說要慶祝。\n我想了一下，最想做的還是跟你一起發呆。\n今天的雲很慢，剛好適合我',
      '今天是紀念日。來這裡滿 {y} 年。\n我沒有準備什麼，只有把最軟的位置留給你。\n你坐，我在旁邊瞇一',
      '{y} 年有多久，我算不太出來。\n大概是很多個午覺，和很多次你回來。\n兩種我都喜歡，尤其是後面那'],
    miss:['這幾天小窩很安靜，我睡了好幾場午覺。\n夢到你回來，醒來你真的回來了。\n歡迎回來，我先去躺一',
      '你不在的時候，我幫你看著窗外。\n太陽出來又下去好幾次，有一朵雲很像你。\n看到你好開心，我要睡個',
      '這幾天我換了三個地方睡。\n最後還是覺得門口附近最好，聽得到你回來。\n你回來了，那我可以放心睡',
      '你不在的時候，我看了很久的窗外。\n有一隻鳥停了一下，又飛走了。\n我跟牠說你會回來，牠好像不太',
      '小窩這幾天很安靜。\n安靜的時候，連我翻身都聽得見。\n歡迎回來，我剛剛才醒，可能還會再',
      '我想了一件事要跟你說。\n想了好幾天，剛剛看到你，就忘了。\n沒關係，你回來就好，我再慢慢想',
      '這幾天太陽照進來的位置，每天移一點點。\n我跟著它移，一天移一次。\n今天剛好移到門口，你就回',
      '你去忙的時候，我也很忙。\n我忙著躺，忙著看雲，還忙著等點心。\n現在你回來了，我可以不忙',
      '有一天下午，我夢到你推開門。\n醒來發現是風，我就又睡了。\n今天是真的，我看了兩次才確定，歡迎回',
      '我幫你顧了小窩。\n顧的方法是躺在中間，哪裡都看得到。\n沒有發生什麼事，只有我睡著了幾',
      '這幾天我學會一件事。\n把下巴放在沙發扶手上，可以看比較遠。\n剛剛就是這樣看到你的，你好',
      '你回來啦。\n我本來想站起來迎接，站到一半覺得坐著也很有誠意。\n所以我坐著說，歡迎回',
      '外面的事忙完了嗎。\n沒忙完也沒關係，這裡可以先坐一下。\n我旁邊的位置是暖的，剛剛才躺',
      '這幾天的雲，我都幫你看過了。\n有一朵很像枕頭，還有一朵很像另一顆枕頭。\n其他的我記不太清楚，因為後來我'],
    gift:['我是薯餅，從{w}家搬過來。\n{w}說：「{m}」\n我可以先在你家沙發躺一下嗎……'],
  },
  egg:{
    intro:['我是蛋黃哥。\n就這樣。', '懶得寫。\n（但是你好。）',
      '你好。\n我躺這裡。\n不用管我。',
      '我是蛋黃哥。\n剩下的，改天再說。'],
    cards:['{n} 件了。\n有點累，但還可以。', '懶得寫。\n{n} 件，辛苦了。我是說我自己。',
      '{n} 件。\n我有出力。一點點。',
      '{n} 件了。\n可以休息了嗎。',
      '聽說 {n} 件了。\n好喔。',
      '{n} 件。\n謝謝你沒有催我。',
      '做了 {n} 件事。\n我居然都在場。',
      '{n} 件。\n下一件，躺著做可以嗎。'],
    anniv:['{y} 年了。\n時間過得好快，我還是很懶。', '懶得寫。\n不過滿 {y} 年，還是寫一下好了。',
      '滿 {y} 年。\n我還在同一個位置。\n很好。',
      '{y} 年了。\n要慶祝的話，躺著慶祝。',
      '紀念日。\n今天多躺一下。\n跟平常一樣。',
      '來了 {y} 年。\n沒想過要走。\n太累了。這裡也不錯。'],
    miss:['你不在，我一直躺著。\n你在，我也一直躺著。\n不過你在比較好。', '懶得寫。\n回來就好。',
      '你回來了。\n好。\n我繼續躺。',
      '這幾天沒什麼事。\n我也沒做什麼事。\n很搭。',
      '你不在，沒人叫我起來。\n你在，也叫不起來。\n歡迎回來。',
      '我翻了一次身。\n這幾天的大事。',
      '回來啦。\n我有抬頭看你喔。\n剛剛。',
      '這幾天地板很涼。\n你也來躺躺看。',
      '本來想去門口等你。\n太遠了。\n心意有到。',
      '懶得寫。\n但是歡迎回來。',
      '你忙你的。\n我躺我的。\n回來的時候我都在。',
      '沒有想你。\n是懶得想別的。',
      '好久不見。\n算了，也沒有很久。\n你好。',
      '我幫你看家。\n用躺的。'],
    gift:['我是蛋黃哥。從{w}家來的。\n{w}說：「{m}」\n就這樣，讓我進去躺著。'],
  },
  dog:{
    intro:['汪！我是皮蛋！汪汪！\n小窩好好玩，我已經藏好一隻拖鞋了，汪。\n[拖鞋]', '汪汪汪！\n（翻譯：你好，我好喜歡這裡。）\n汪！',
      '汪汪！我是皮蛋！\n我把小窩每個角落都聞過一遍了，都是好味道！\n以後你去哪我就去哪，汪！',
      '汪！\n（翻譯：初次見面，我很乖，大部分的時候。）\n這隻拖鞋先放你這裡，幫我保管。\n[拖鞋]'],
    cards:['汪！我們一起做了 {n} 件事！汪汪！\n每一件我都有搖尾巴。\n[拖鞋]', '汪汪！{n}！汪！\n（翻譯：好開心，明天也要一起玩。）',
      '汪汪汪！{n} 件！\n每一件我都記得，因為每一件你都有摸我的頭！\n下一件什麼時候？現在嗎？汪！',
      '汪！我們做了 {n} 件事！\n（翻譯：我開心到追了自己的尾巴三圈。）\n沒有追到，沒關係，汪。',
      '{n} 件了！汪！\n為了慶祝，我把藏最好的那一隻拿出來了。\n[拖鞋]\n只借你看一下喔。',
      '汪汪！\n（翻譯：聽說我們一起做了 {n} 件小事。）\n（再翻譯：我還想做更多。）',
      '報告！一共 {n} 件！汪！\n我每一件都有幫忙，雖然有時候是幫忙搖尾巴。\n搖尾巴也很重要，汪。',
      '汪！{n}！\n我不太會數數，可是我知道這是很多的意思。\n很多很多次跟你在一起，汪汪！'],
    anniv:['汪汪汪汪汪！\n（翻譯：來小窩滿 {y} 年了！）\n送你我藏最久的寶貝。\n[拖鞋]', '汪！{y} 年！汪汪！\n我把藏起來的東西都數了一遍，最喜歡的還是你。',
      '汪汪！我來小窩滿 {y} 年了！\n這裡每一隻拖鞋我都認識，每一隻都藏過。\n最喜歡的這隻送你，汪。\n[拖鞋]',
      '汪！滿 {y} 年！\n（翻譯：謝謝你每天都讓我跟。）\n明年我還要跟，後年也要，汪汪！',
      '今天是我的紀念日！汪！\n我在門口轉了好多圈，轉到頭暈。\n頭暈也開心，因為滿 {y} 年了！',
      '汪汪汪！\n（翻譯：{y} 年前的今天，我第一次聞到這個家。）\n現在這裡聞起來都是我們的味道了，汪。'],
    miss:['汪……汪？汪！！\n（翻譯：你不在的時候我在門口睡覺，聽到你回來就醒了！）', '汪汪！\n我幫你看家，把拖鞋都排好了。\n[拖鞋]\n歡迎回來，汪！',
      '汪！！你回來了！\n我聽到腳步聲就知道是你，我耳朵很厲害。\n快點摸我，摸很久的那種，汪！',
      '汪汪！\n這幾天我每天去門口聞一下，今天聞到你了。\n歡迎回來，拖鞋幫你擺好了。\n[拖鞋]',
      '你不在的時候我很乖！汪！\n沒有咬東西，沒有亂跑，只藏了一隻拖鞋。\n好吧，兩隻。汪。',
      '汪……汪汪……汪！\n（翻譯：我在門口睡了幾天，睡得很好，夢裡都在跟你玩。）\n現在來玩真的！',
      '汪！歡迎回來！\n我幫你看家，一個壞人都沒有進來。\n其實也沒有人來，不過我還是有看，汪。',
      '這幾天我練習了新的把戲！\n就是坐下。汪。\n我本來就會，可是現在坐得更好了，你看！',
      '汪汪！你去了好多地方吧！\n你身上有外面的味道，等一下讓我聞清楚。\n先歡迎回來，汪！',
      '我幫你留了一樣東西。\n是我找到最好的一隻，一直壓在肚子下面。\n[拖鞋]\n有一點扁，汪。',
      '汪！\n（翻譯：你回來了，我尾巴搖到停不下來。）\n（再翻譯：真的停不下來，你看。）',
      '這幾天我每天繞小窩跑一圈，確定東西都在。\n我的碗在，我的球在，我的拖鞋也在。\n現在你也在了，汪！',
      '汪汪！\n你不在的時候，我把球放在門口。\n這樣你一回來，我們就可以馬上玩，汪！',
      '你回來啦！汪！\n這幾天我有吃飯，有睡覺，也有玩，過得很好。\n現在更好，因為可以跟你玩，汪！'],
    gift:['汪！我是皮蛋！從{w}家跑來的！汪汪！\n{w}說：「{m}」\n我有帶拖鞋喔。\n[拖鞋]'],
  },
  moodeng:{
    intro:['我是彈跳豬！！\n這裡我說了算！！\n你可以住下來！！！', '你好！！！\n我今天跳了一百下！！！\n明天要跳兩百下！！！',
      '我是彈跳豬！！\n先說好！！床是我的跳床！！\n你可以在旁邊看！！！',
      '喂！！我來了！！\n這個家看起來可以跳很久！！\n我決定住下來了！！！'],
    cards:['{n} 件！！！\n我做得最好！！！\n你也還不錯！！！', '我們做了 {n} 件事！！\n累了！！\n才沒有！！！',
      '{n} 件！！\n每一件我都跳得最用力！！\n不准說沒有！！！',
      '聽好了！！我們做了 {n} 件事！！\n我一個人也做得到！！\n可是跟你做比較好玩！！！',
      '{n} 件了！！！\n我才沒有在數！！\n是剛好知道！！！',
      '{n}！！{n}！！\n我要跳 {n} 下慶祝！！\n你幫我數！！！',
      '我們做了 {n} 件小事！！\n哼！！還可以啦！！\n下一件我要當第一個！！！',
      '{n} 件！！\n你有沒有覺得我很厲害！！\n有就說出來！！！'],
    anniv:['{y} 年！！！\n我要在床上跳 {y} 百下慶祝！！！', '來小窩滿 {y} 年了！！\n我還是最吵的那個！！！\n你喜歡吧！！！',
      '我來這裡滿 {y} 年了！！\n這個家被我跳得很結實！！\n不用謝我！！！',
      '{y} 年！！！\n我還是跳得最高的那個！！\n明年也是！！！',
      '今天是我的紀念日！！\n全部的人都要看我跳！！\n你站最前面！！！',
      '滿 {y} 年了！！\n我才沒有很感動！！\n眼睛濕濕的是剛剛泡水！！！'],
    miss:['你不在的時候！！\n我跳得比較小聲！！\n才不是因為你不在！！！', '回來了！！！\n我把每個房間都跳過一遍了！！\n現在換你陪我玩！！！',
      '你回來了！！！\n我才沒有每天看門口！！\n是門口剛好在那裡！！！',
      '這幾天我跳了很多下！！\n沒有人看也照樣跳！！\n現在你來看！！！',
      '哼！！你回來啦！！\n我把水都準備好了！！\n快來陪我玩水！！！',
      '你不在的時候！！\n我發明了新的跳法！！\n很厲害！！不教你！！好啦教你！！！',
      '回來得正好！！\n我剛好要跳今天最高的一下！！\n看好了！！！',
      '這幾天小窩我管得很好！！\n沒有人敢擋我的路！！\n因為也沒有人在走路！！！',
      '外面好玩嗎！！\n算了不用說！！\n這裡比較好玩！！！',
      '我才沒有想你！！\n只是跳的時候少一個人拍手！！\n現在可以拍了！！！',
      '歡迎回來！！！\n這句我練習了三天！！\n才沒有！！是現在才想到的！！！',
      '肚子餓了！！\n你回來了剛好！！\n一起吃東西！！然後一起跳！！！',
      '這幾天我泡了很久的水！！\n泡到手皺皺的！！\n你看！！不准笑！！！',
      '你一進門我就知道了！！\n因為地板震了一下！！\n不對！！那是我跳的！！！'],
    gift:['我是彈跳豬！！從{w}家跳過來的！！！\n{w}說：「{m}」！！\n快開門！！！'],
  },
  nyanko:{
    intro:['才不是想寫信給你。\n只是剛好有紙和筆。\n這裡還算可以住。\n對了，記得準備點心。', '才不是想認識你。\n不過既然來了，就說一聲你好。\n下次見面帶點心來。',
      '才不是歡迎你。\n本大爺只是剛好醒著，順便看一下新主人。\n長得還可以。點心放櫃子就好。',
      '才不是來讓你照顧的。\n是本大爺看這裡採光不錯，勉強住下。\n每天的點心別忘了。'],
    cards:['才不是在數。\n剛好看到，一起做了 {n} 件事。\n做得還可以，獎勵的話，點心就好。', '才不是想你。\n只是想起我們做了 {n} 件小事。\n今天的點心呢？',
      '才不是特地寫信。\n一起做了 {n} 件事，本大爺只是順手幫忙。\n順手也是會餓的，點心。',
      '才不是覺得開心。\n{n} 件而已，尾巴會動是因為有風。\n風停了，點心拿來。',
      '才不是在誇你。\n只是 {n} 件做下來，你還算可靠。\n可靠的人會記得買點心。',
      '才不是喜歡跟你一起做事。\n是你每次都剛好在旁邊，{n} 次都是。\n算你運氣好，分我點心。',
      '才不是記得很清楚。\n第 {n} 件做完的時候，你笑了一下。\n沒什麼，講這個會餓，點心。',
      '才不是要討獎勵。\n不過 {n} 件了，按照規矩是該有點表示。\n本大爺不挑，點心三種就好。'],
    anniv:['才不是在記日子。\n剛好想起來，來這裡滿 {y} 年了。\n這種日子要有蛋糕，還有點心。', '才不是特別寫的。\n{y} 年而已，沒什麼。\n……點心要兩盒。',
      '才不是捨不得走。\n是住了 {y} 年，位置都睡出形狀了，搬很麻煩。\n今天的點心要好一點的。',
      '才不是要跟你說謝謝。\n滿 {y} 年，本大爺只是通知你一聲。\n通知完了，點心呢。',
      '才不是記得這一天。\n是剛好看到日曆，剛好滿 {y} 年。\n剛好今天想吃特別的點心。',
      '才不是在想以前的事。\n{y} 年前本大爺的點心只有一盒，現在有一整層。\n繼續保持，尤其是點心那一層。'],
    miss:['才不是想你。\n你不在的時候，我只是比較常看門口。\n回來就好，點心呢？', '才不是在等你。\n剛好醒著而已。\n既然回來了，一起吃點心吧。',
      '才不是在等門。\n本大爺坐在門口，是因為那裡比較涼。\n回來了就去洗手，然後拿點心。',
      '才不是擔心你。\n外面的事本大爺不懂，反正你回來就好。\n這句不算關心。點心。',
      '才不是聽到聲音才醒的。\n本大爺本來就要起來伸懶腰。\n既然你在，順便開一下點心櫃。',
      '才不是幫你看家。\n是本大爺每天要巡邏，順路而已。\n一切正常，巡邏的費用用點心付。',
      '才不是無聊。\n這幾天本大爺睡得很好，一個人佔整張沙發。\n你回來可以坐旁邊，帶點心的話。',
      '才不是想聽你說外面的事。\n不過你要講的話，本大爺可以邊吃邊聽。\n所以先拿點心。',
      '才不是高興。\n鬍鬚翹起來是因為剛睡醒。\n回來就回來，點心放老地方。',
      '才不是替你留的。\n那塊點心是本大爺吃不下，剛好剩在那裡。\n你要吃就吃，下次還我兩塊點心。',
      '才不是數過日子。\n是本大爺午覺睡了幾次，自己會知道。\n醒來看到你，還行。點心。',
      '才不是特地走過來。\n本大爺要去喝水，路過門口，剛好你進來。\n剛好而已。喝完水要配點心。',
      '才不是怕你累。\n只是你看起來該坐一下。\n坐本大爺旁邊，一起吃點心。',
      '才不是一直醒著。\n本大爺今天碰巧沒睡，碰巧面向門口。\n碰巧也有點餓，點心。'],
    gift:['才不是想來你家。\n是{w}說：「{m}」\n既然來了，點心準備好了嗎。'],
  },
  dino:{
    intro:['嘿嘿，以為只有葉子吧！\n我是龍龍，最喜歡在小窩跑來跑去。\n葉子送你，是我在客廳撿的。', '翻過來了喔！\n我是龍龍，以後會把葉子藏在你找得到的地方。',
      '被你發現了！\n我是龍龍，這片葉子是見面禮，我挑了最大的一片。\n以後你會常常在奇怪的地方找到葉子喔。',
      '嘿！葉子後面有字！\n我是龍龍，剛到小窩第一天就探險完了。\n最棒的躲藏點我先不說，你自己找。'],
    cards:['我們做了 {n} 件事！\n我在每一件旁邊都放了一片葉子，你有看到嗎？', '{n} 件！\n下一件我要當隊長，你當副隊長。',
      '{n} 件了！\n我每做完一件就藏一片葉子，現在小窩裡有 {n} 片。\n你找到幾片了？',
      '報告隊長！我們完成 {n} 件任務了！\n下一件任務我已經想好了，是秘密。\n提示：跟葉子有關。',
      '嘿嘿，{n} 件！\n其中有一件我偷偷惡作劇，你沒發現。\n沒發現就算我贏喔。',
      '我們一起做了 {n} 件事！\n我本來以為會很無聊，結果每一件都好玩。\n這片葉子是獎品，頒給你。',
      '{n} 件！我跳了一圈慶祝！\n跳的時候葉子掉了一地，我撿了很久。\n最漂亮的這片送你。',
      '猜猜看我們做了幾件事？\n答案在這裡：{n} 件！\n猜對的人可以把葉子留著，沒猜對也可以。'],
    anniv:['{y} 年了耶！\n這段時間撿的葉子，全部送你。', '今天是我的紀念日！\n我在門口跳了一圈慶祝，順便又撿了一片葉子。',
      '滿 {y} 年了！\n我把這段時間藏過葉子的地方都走了一遍。\n有幾片還在，那些是留給你的寶藏。',
      '今天是龍龍來小窩 {y} 年的日子！\n我想了一個大計畫來慶祝，結果被自己嚇到。\n所以改成送你葉子，比較安全。',
      '{y} 年前我來的時候，一片葉子都沒有。\n現在我有好多好多。\n最好的一片，每年都留給你。',
      '紀念日快樂！是我的紀念日！\n滿 {y} 年，我今天很乖，一次惡作劇都沒有。\n好啦，只有一次，很小的。'],
    miss:['你不在的時候，我把小窩跑了好幾圈。\n每一圈都在門口停一下，看你回來了沒。\n現在回來了，我們去玩！', '這幾天我去探險了！\n在沙發後面找到一片很大的葉子，留給你。',
      '你回來了！\n我躲在門後面想嚇你，結果等到睡著。\n這片葉子是我睡著時抓在手上的，送你。',
      '這幾天我發現一條新路線！\n從床底下可以一路鑽到沙發後面。\n等一下帶你走，你可能要彎腰。',
      '嘿嘿，你不在的時候我藏了很多葉子。\n枕頭下面有一片，其他的不告訴你。\n找到的都算你的。',
      '歡迎回來！\n我有幫你看家，方法是每天大吼一聲。\n吼——就像這樣，壞人都不敢來。',
      '我這幾天當了小窩的隊長！\n隊員只有我自己，所以我也是副隊長。\n現在你回來了，副隊長讓給你。',
      '你一定不知道我這幾天去哪裡探險。\n我爬到小窩最高的地方！\n上面有灰塵，還有一片我以前藏的葉子。',
      '我準備了一個惡作劇要歡迎你。\n可是我忘記放在哪裡了。\n如果你突然被嚇到，那就是我的。',
      '這片葉子我留了好幾天！\n每天拿出來看一下，確定它還是最漂亮的。\n現在交給你保管。',
      '你回來啦！我有好多事要講！\n第一件，我跑得更快了。第二件，我忘了。\n第三件，葉子給你。',
      '我本來要假裝沒看到你。\n可是尾巴自己搖起來，就被發現了。\n好啦，歡迎回來，我們去玩！',
      '這幾天我玩了一個人的躲貓貓。\n我躲得太好，沒有人找到我。\n下次換你來找，我會躲簡單一點。',
      '我今天很乖喔，真的。\n這幾天也都很乖，大部分。\n不乖的部分我用這片葉子跟你換。'],
    gift:['嘿！我是龍龍，從{w}家走了好遠的路過來。\n{w}說：「{m}」\n路上撿了一片葉子，送你。'],
  },
  // 史努比：每封信開頭一句，接著是連載小說的下一章
  snoopy:{
    intro:['親愛的讀者，我是作家史努比。新小說開始連載了。', '作家史努比，請多指教。今天先給你看一章。',
      '作家史努比報到。我的新作品，今天起在你的信箱獨家連載。',
      '這位讀者你好。偉大的小說都從一封信開始，這封就是。'],
    cards:['慶祝我們一起做了 {n} 件事，加寫一章。', '{n} 件事了，靈感很多，今天多寫一點。',
      '我們一起做了 {n} 件事，每一件都是寫作的材料。作家很感謝。',
      '{n} 件小事換一次連載，這個匯率對讀者很划算。',
      '報告編輯，也就是你：{n} 件事做完了，作家今天也有坐在書桌前。',
      '第 {n} 件事做完的那個下午，作家突然有了靈感。',
      '{n} 件了。作家把你寫進了致謝名單，放在最前面。',
      '為了紀念 {n} 件小事，作家把稿子多改了三遍。'],
    anniv:['來小窩滿 {y} 年，作家特別寫了這一章。', '{y} 週年紀念章，請慢慢看。',
      '作家在小窩駐村滿 {y} 年。照慣例，紀念日要向讀者報告進度。',
      '給 {y} 年來最忠實的讀者：下面這一段獻給你。',
      '滿 {y} 年了。作家回頭看以前寫的稿子，覺得自己真是天才。',
      '今天是作家來小窩 {y} 年的日子，以下為紀念特別篇。'],
    miss:['你不在的時候我一直在寫，這一章寫了好久。', '作家這幾天閉關，寫出了新的一章。',
      '讀者回來了。作家把這幾天的稿子拍一拍灰塵，向你報告。',
      '這幾天作家都在屋頂上想劇情，想出了一些東西。',
      '你不在的時候，作家寫得特別專心。你回來了，剛好有人看。',
      '作家這幾天演了王牌飛行員，降落之後才回到書桌前。',
      '歡迎回來。作家一邊等靈感一邊等你，兩個都等到了。',
      '這幾天的稿子作家寫了又撕，撕了又寫，留下來的在下面。',
      '偉大的作家都需要午睡。以下是午睡和午睡之間的成果。',
      '報告，前方發現讀者。作家立刻送上最新消息。',
      '那是一個風很大的下午，作家剛放下筆，你就回來了。',
      '作家本來想等你回來再動筆，後來忍不住先寫了。',
      '這幾天的晚餐都很準時，所以作家心情很好，寫作也很順利。',
      '作家這幾天換了三個地方寫稿，最後發現還是屋頂最好。'],
    gift:['作家史努比，從{w}家來你家取材。\n{w}說：「{m}」\n新的一章，要從你家開始寫。'],
  },
  piggy:{
    intro:['我是火腿。先說，{r}的{f}擺得有點歪。\n牆紙跟地板的顏色我也有意見。\n……其實還不錯啦。', '初次見面，我觀察了一下。\n{r}的{f}位置不太對，走路會撞到。\n不過整體來說，其實還不錯。',
      '我是火腿，先講好，我講話比較直。\n{r}的{f}，我一進門就看到問題了。\n別緊張，整體來說其實還不錯。',
      '你好，我是火腿。以後這個家的意見由我負責。\n第一條：{r}的{f}位置不對。\n第二條：除此之外，其實還不錯。'],
    cards:['我們做了 {n} 件事。我順便看了一下{r}。\n{f}可以再往左一點，算了，往右也行。\n其實還不錯。', '{n} 件了，不錯。\n不過{r}的{f}你是不是很久沒擦了？\n開玩笑的，其實還不錯。',
      '{n} 件了。每一件我都有給建議，你有聽進去一半。\n順便講一下，{r}的{f}還是老樣子。\n一半也可以啦，其實還不錯。',
      '我們做了 {n} 件事，我統計過了。\n{r}的{f}被我唸了大概也是 {n} 次。\n它沒有改，我也習慣了，其實還不錯。',
      '{n} 件。我說過會成功吧，我早就說了。\n至於{r}的{f}，我也早就說了。\n算了，今天不講，其實還不錯。',
      '做了 {n} 件事，我覺得可以給你一個評語。\n優點：很多。缺點：{r}的{f}。\n總評：其實還不錯。',
      '{n} 件，辛苦了。這句是真心的。\n接下來這句也是真心的：{r}的{f}該整理了。\n整理不整理都行，其實還不錯。',
      '聽說 {n} 件了，我特地去{r}巡了一圈。\n{f}上面有一點灰，我假裝沒看到。\n你看我多體貼，這個家其實還不錯。'],
    anniv:['來小窩 {y} 年了，我有資格說了：\n{r}的{f}從來沒擺對過。\n……可是我已經習慣了，其實還不錯。', '{y} 週年，給這個家打個分數。\n{r}扣一分，因為{f}。\n其他滿分，其實還不錯。',
      '滿 {y} 年，我寫了一份報告。\n第一頁到第九頁都在講{r}的{f}。\n第十頁只有一行：其實還不錯。',
      '{y} 年了。我還記得第一天就嫌{r}的{f}。\n現在我還是嫌，但是換位置的話我會不習慣。\n所以不要動，這樣其實還不錯。',
      '今天是我來小窩滿 {y} 年的日子。\n本來想趁機把{r}的{f}再唸一遍。\n看在紀念日的份上，改成說：其實還不錯。',
      '住了 {y} 年，我有資格頒獎了。\n最需要改進獎：{r}的{f}。\n最佳住家獎：這裡。因為其實還不錯。'],
    miss:['你不在的時候我巡了一下{r}。\n{f}還在原位，灰塵我幫你吹掉了。\n其實還不錯，歡迎回來。', '這幾天我把{r}研究了一遍。\n{f}可以換個位置，等你回來再說。\n現在這樣其實也還不錯。',
      '你不在的時候，我替你檢查了{r}。\n{f}歪了一點，我看了三天才決定不扶。\n歪得有個性，其實還不錯。',
      '回來啦。我先報告：{r}的{f}沒有人動過。\n我每天去看一次，順便唸它兩句。\n它脾氣很好，這個家其實還不錯。',
      '這幾天我開了一個會，出席的只有我。\n議題是{r}的{f}要不要換位置。\n表決結果：維持現狀，其實還不錯。',
      '我早就說你會回來，我每次都說對。\n還有一件事我也說對了：{r}的{f}很佔位置。\n佔就佔吧，其實還不錯。',
      '這幾天我的意見都發表給{r}的{f}聽。\n它聽得很認真，一句都沒有頂嘴。\n是個好聽眾，其實還不錯。',
      '歡迎回來，我有三點要說。\n第一，{r}的{f}。第二，還是{r}的{f}。\n第三，你回來了，其實還不錯。',
      '這幾天我替{r}打了分數。\n{f}扣兩分，後來我心軟加回一分。\n你回來再加一分，其實還不錯。',
      '邪惡豬排博士這幾天在{r}進行研究。\n研究對象是{f}，結論是它沒有邪惡的用途。\n那就留著吧，其實還不錯。',
      '我把{r}的{f}擦了一下。\n不要誤會，我是看不下去，不是勤勞。\n擦完順眼多了，其實還不錯。',
      '你回來的時間，跟我估的差不多。\n我本來要趁這幾天把{r}的{f}挪一下。\n想想還是等你一起挪，其實還不錯。',
      '這幾天小窩的事都由我主持公道。\n最大的案子是{r}的{f}擋不擋路。\n判決：不擋，其實還不錯。',
      '我不是抱怨，是提醒：{r}的{f}該換個角度了。\n這句我對著它講了好幾天，它都沒有動。\n很有原則，其實還不錯。'],
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
  '第二部開始。浴缸號的船長在排水孔旁邊撿到一個瓶子，裡面有一張紙條：「請來找我」。',
  '紙條沒有署名，只畫了一片葉子。船長推理了一個晚上，結論是：寄信的人喜歡葉子。',
  '浴缸號再次出航。這次的航線通往臥室，聽說那裡有一座會彈起來的山。',
  '船一靠近，山就跳了起來，原來是有人在床上練習跳高。船長的帽子飛了，他假裝是故意脫的。',
  '船長向一顆躺著不動的蛋問路。蛋想了很久，說：「不知道。」然後翻了個身，剛好指了一個方向。',
  '照著那個方向，船長找到一條用葉子排成的路。葉子每隔三步一片，排得很用心。',
  '葉子路的盡頭是一個衣櫃。船長深呼吸，用最帥的姿勢敲了門。沒有人應門。',
  '衣櫃後面傳來「吼——」的一聲。船長沒有被嚇到，只是剛好往後跳了一步。',
  '寄信的是一隻小恐龍。他說瓶中信本來是惡作劇，可是寫完之後，是真的希望有人來找他玩。',
  '船長請他上船，任命為大副。兩個人一起把浴缸號開回浴室，約好下次去更遠的地方。（第二部完）',
];
const SNOOPY_REST = ['作家去泡澡找靈感了，下一章快寫好了。', '作家在屋頂上想劇情，想著想著睡著了。下一章再說。', '第三部的開頭寫了三次，都被作家自己撕掉了。再等等。'];
// 小窩更新了：薯餅寫的，不佔娃娃一天一封的名額。順序是舊的在前、新的在後（後寄的排在信箱上面）。
// 所有人都收得到，新玩家也收（才知道小窩有哪些功能）。幣只給一次：見 coin1 和 hi
const MAIL_HI_FROM = '2026-11-26';   // 這天以後才開始玩的人算新玩家，收歡迎信
const MAIL_NEWS = [
  {id:'v4', t:'2026-11-26', b:'小窩多了幾樣東西，跟你說一下。\n信箱：大家會寫信給你。信不會過期，附件也一直留著，有空再看就好。\n季節：窗外跟著月份換，過節的那幾天，收納架會多出節日的東西。\n門外小島：上面最右邊那顆鈕。可以種東西，大家會輪流來幫忙。沒來也沒關係，種子會等你。\n送娃娃：登入以後，夾到家裡已經有的娃娃，可以從信箱送去朋友家。朋友什麼時候開門都可以。\n我要去睡午覺了，剩下的你自己逛逛'},
  {id:'v5', t:'2026-11-26', b:'小窩又多了幾樣，都是跟朋友一起的，要登入才有。\n訪客簿：房間左上角那本小本子。朋友來可以貼貼紙、寫一句話，來你家的朋友都看得到。\n願望清單：相簿裡還沒來的娃娃，點星星。朋友有多的可以送你。\n小島：朋友可以來幫你澆水，你也可以去幫他澆。\n過夜：去朋友家的時候，可以讓一隻娃娃留下來住一晚，隔天牠帶日記回來。\n明信片：拍完照可以寄給朋友。\n沒有朋友來也沒關係，我也常常一個人發呆'},
  // a：附件。coin-30 = 30 枚幣。coin1 是補給舊玩家的；新玩家改收歡迎信 hi（也附 30 枚），兩封只會收到一封
  {id:'coin1', t:'2026-11-26', a:'coin-30', b:'我數了一下，大家的幣好像都不太夠用。\n所以改了幾件事：每天領的幣變 20 枚，做完一件小事給 3 枚，每天第一次夾娃娃不用幣。\n幣不夠的時候，會告訴你現在還有什麼事可以賺。點上面的幣也看得到。\n信裡附了 30 枚，先拿去用。\n之後還會有別的賺幣方法，我先去躺一下'},
  {id:'f1', t:'2026-11-26', b:'家具多了 17 件，跟你說一下。\n每隻都有一件自己的：我的是吊床。把我放上去，我會睡得比平常還熟。其他人的你自己試試看。\n還有甜點系列，湊齊了送一款奶油壁紙。牆上也多了三樣可以掛的。\n娃娃機夾得到，火腿的小店也有賣，每天換一批。\n我先去試吊床，試完再'},
  {id:'f2', t:'2026-11-26', b:'又多了很多東西，我念一遍。\n家具：森林露營、海邊、太空三個系列，各六件，湊齊各送一款地板或壁紙。還有一個魚缸，貓咪老師會一直盯著看。\n壁紙和地板也多了幾款，火腿的小店買得到。\n新房間：廚房和閣樓。小店有賣廚房的鑰匙和閣樓的梯子，買了上面就多一顆房間鈕。閣樓晚上看得到流星。\n窗外：清晨和傍晚顏色不一樣，有時候會下雨。下雨天小島不用澆水。\n念完了，好累'},
  {id:'one1', t:'2026-11-26', b:'娃娃的事改了一下，跟你說。\n每一種娃娃，家裡就是一隻。收納架上不會再寫有幾隻了。\n夾到家裡已經有的：那一隻可以送給朋友，也可以先留著。留著的時候牠會站在娃娃機旁邊當店員，每天帶 2 枚幣回來，不用再叫牠去打工。想送人的時候，點店員就可以。\n已經留著一隻，又夾到一樣的，會直接換成 3 枚幣。以前存了好幾隻一樣的，多的也幫你換成幣了。\n我也想當店員，可是要站著，還是算'},
  // 歡迎信：不在下面的迴圈裡寄，mailCheck 最後才寄，這樣會排在信箱最上面
  {id:'hi', hi:1, title:'歡迎來小窩', a:'coin-30', b:'你好，我是薯餅。\n這裡是小窩，我跟大家住在這裡。我平常都在發呆，有事點我一下就好。\n信裡附了 30 枚幣。娃娃機夾一次 2 枚，你可以多夾幾次，每天第一次夾不用幣。\n幣不夠的時候點上面的幣，會告訴你現在可以做什麼。客廳的電視可以玩小遊戲，每天的小事做完也有幣。\n下面幾封信是在講小窩有什麼，有空再看就好。\n我本來還想跟你說一件事，可是'},
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
  // 滿了先刪最舊的「看過、附件也領了」的；都還沒看就留著（不會因為太久沒看而不見）
  while (m.l.length > MAIL_MAX){
    let j = -1;
    for (let x = m.l.length - 1; x >= 0; x--) if (m.l[x].r && (!m.l[x].a || m.l[x].g)){ j = x; break; }
    if (j < 0) break;
    m.l.splice(j, 1);
  }
  if (type !== 'news'){
    const ar = m.arch[d] = m.arch[d] || [];
    ar.push(`${today}|${k}`);
    if (ar.length > MAIL_ARCH) ar.splice(0, ar.length - MAIL_ARCH);
    m.last = today;
  }
}

/* ---------- 什麼時候寫信 ---------- */
// 打開時（atOpen）和過了午夜各看一次。娃娃的信一天最多一封：週年 > 你不在的時候 > 一起做了幾件 > 自我介紹
function mailCheck(atOpen){
  if (typeof VISIT !== 'undefined' && VISIT) return;
  const m = mailInit(), t = todayStr(), y = +t.slice(0, 4);
  const met = S.album.met || {};
  const first = Object.values(met).sort()[0] || t;
  let changed = false;
  const old = first < MAIL_HI_FROM;   // 歡迎信做好以前就在玩的人
  MAIL_NEWS.forEach(n => {
    if (n.hi || m.s['news-' + n.id]) return;
    if (n.id === 'coin1' && (!old || m.s['news-hi'])) return;   // 新玩家的 30 枚在歡迎信裡，不重複給
    m.s['news-' + n.id] = t; mailAdd('sloth', 'news', 'id=' + n.id, t); changed = true;
  });
  // 歡迎信：沒收過、也沒收過 coin1 的新玩家。最後寄，排在最上面
  if (!old && !m.s['news-hi'] && !m.s['news-coin1']){ m.s['news-hi'] = t; mailAdd('sloth', 'news', 'id=hi', t); changed = true; }
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
  if (type === 'news'){ const n = MAIL_NEWS.find(n => n.id === p.id) || MAIL_NEWS[0]; body = n.b; if (n.title) title = n.title; }
  else if (type === 'trip'){
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
  return {d: type === 'news' ? 'sloth' : d, type, title, body};
}
function mailBodyHTML(x){
  const lines = x.body.split('\n');
  // 送來的娃娃家裡已經有：最後多一行括號的說明（mailGiftNote），不是娃娃寫的，字小一點、也不算薯餅睡著的那一行
  const note = x.type === 'gift' && /^（(你家|家裡)已經有/.test(lines[lines.length - 1]) ? lines.length - 1 : -1;
  const html = lines.map((l, j) => {
    if (l === '[拖鞋]') return `<p class="ml-sl">${typeof DROP_SVG !== 'undefined' ? DROP_SVG.slipper : ''}</p>`;
    if (j === note) return `<p class="ml-nt">${l}</p>`;
    const last = j === lines.length - 1 - (note >= 0 ? 1 : 0);
    if (x.d === 'sloth' && last && x.type !== 'trip'){
      // 薯餅寫到一半睡著：最後幾個字一個比一個往下掉，後面接 Zzz（不然看起來像字被切掉）
      const cs = /[<&]/.test(l) ? null : [...l], n = 7;
      const tail = cs ? cs.slice(0, Math.max(0, cs.length - n)).join('') + cs.slice(-n).map((c, k) => `<span style="--i:${k + 1}">${c}</span>`).join('') : l;
      return `<p class="tilt">${tail}<span class="zz" style="--i:${cs ? Math.min(n, cs.length) + 2 : 3}">……Zzz</span></p>`;
    }
    return `<p>${l}</p>`;
  }).join('');
  return `<div class="ml-tx ${x.d === 'moodeng' ? 'big' : ''} ${x.d === 'snoopy' ? 'novel' : ''}">${html}</div>`;
}
const mailSnip = x => x.d === 'dino' && x.type !== 'news' ? '一片葉子' : x.body.split('\n')[0].replace('[拖鞋]', '');
function mailCard(o, j, open){
  const x = mailText(o.k);
  const from = x.type === 'news' ? '薯餅' : DOLL_NAME[x.d];
  let inner = '';
  if (open){
    // 龍龍：先是一片葉子，點一下翻到背面
    inner = x.d === 'dino' && x.type !== 'news' && !o.f
      ? `<button class="ml-leaf" data-flip="${j}" aria-label="把葉子翻過來">${MAIL_LEAF}<small>點一下翻過來</small></button>`
      : mailBodyHTML(x) + `<p class="ml-sg">${from}</p>`;
    if (o.a) inner += `<div class="ml-att ${o.g ? 'got' : ''}">${mailAtt(o.a).svg}<span>${o.a.startsWith('coin-') ? '附上 ' : '附上一個'}${mailAtt(o.a).name}</span>${o.g ? '<small>收下了</small>' : `<button class="btn y sm" data-take="${j}">收下</button>`}</div>`;
  }
  return `<div class="ml ${o.r ? '' : 'unread'} ${open ? 'open' : ''}">
    <button class="ml-hd" data-ml="${j}" aria-expanded="${open}"><img src="${SPR[x.d]}" alt=""><span><b>${x.title}</b><small>${from}・${md(o.t)}${o.a && !o.g ? '・有附件' : ''}</small>${open ? '' : `<i>${mailSnip(x)}</i>`}</span></button>
    ${open ? `<div class="ml-bd">${inner}</div>` : ''}</div>`;
}
let mlOpenIx = -1;
function openMail(keep){
  const m = mailInit();
  if (!keep) mlOpenIx = -1;
  const unread = m.l.filter(o => !o.r).length, todo = m.l.filter(o => o.a && !o.g).length;
  const ngBtn = typeof ngSendBtn === 'function' ? ngSendBtn() : '';
  const ngw = typeof ngWaiting === 'function' ? ngWaiting() : 0;
  openSheet(`<div class="hd ml-top">${MAIL_ICON}<span>信箱</span>${unread || ngw ? `<small>${[unread ? `${unread} 封沒看` : '', ngw ? `${ngw} 隻在門口` : ''].filter(Boolean).join('・')}</small>` : ''}</div>
    <div class="ml-box">${typeof ngSection === 'function' ? ngSection() : ''}${typeof cardSection === 'function' ? cardSection() : ''}${m.l.length ? m.l.map((o, j) => mailCard(o, j, j === mlOpenIx)).join('') : (m.pc || []).length ? '' : '<p class="al-em">還沒有信。娃娃們偶爾會寫信給你，不用特別等。</p>'}</div>
    ${todo || unread || ngBtn ? `<div class="ml-ft">${todo ? '<button class="btn y" data-mall="take">全部領取</button>' : ''}${unread ? '<button class="btn" data-mall="read">全部已讀</button>' : ''}${ngBtn}</div>` : ''}`);
  evOpen = false; alOpen = false;
  if (!keep && typeof ngRefresh === 'function') ngRefresh(true);
  if (!keep && typeof cardRefresh === 'function') cardRefresh(true);
}
// 附件的圖和名字：點心盒、泡泡球，或小島的種子（seed-種類）
const mailAtt = a => (a.startsWith('coin-') ? {name: `${+a.slice(5) || 0} 枚幣`, svg: COIN} : (typeof yardAtt === 'function' && yardAtt(a)) || WISH[a]);
function mailTake(o){
  if (!o.a || o.g) return; o.g = 1;
  if (o.a.startsWith('coin-')){ S.coins += +o.a.slice(5) || 0; renderHud(); return; }
  if (o.a.startsWith('seed-')){ if (typeof yardInit === 'function'){ const y = yardInit(), k = o.a.slice(5); y.seeds[k] = (y.seeds[k] || 0) + 1; } return; }
  S.wish[o.a] = (S.wish[o.a] || 0) + 1;
}
$('#sheet').addEventListener('click', e => {
  if (!$('#sheet .ml-box')) return;
  const m = S.mail, b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.ml !== undefined){
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
    const got = m.l.filter(o => o.a && !o.g); got.forEach(mailTake); save(); renderEvBadge();
    toast(`收下 ${got.length} 個附件`); openMail(true);
  } else if (b.dataset.mall === 'read'){
    m.l.forEach(o => o.r = 1); save(); mailBadge(); openMail(true);
  }
});

/* ---------- 房間右上角的信封 ---------- */
function mailBadge(){
  const b = $('#mailBtn'); if (!b) return;
  // 沒看的信 + 朋友送來、還在門口等的娃娃
  const n = (S.mail ? S.mail.l.filter(o => !o.r).length : 0) + (typeof ngWaiting === 'function' ? ngWaiting() : 0) + (typeof cardUnread === 'function' ? cardUnread() : 0);
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
