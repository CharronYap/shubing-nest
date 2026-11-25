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
const MAIL_MAX = 30, MAIL_ARCH = 24;
const MAIL_CARDS = [5, 10, 20];          // 一起做完幾件小事時寫信
const MAIL_MISS_DAYS = 3;                // 隔超過幾天才打開，寫一封「你不在的時候」
const MAIL_ATT_RATE = .5;                // 一天第一封娃娃的信，有附件的機率
const MAIL_TITLE = {intro:'你好', cards:'一起做了 {n} 件事', anniv:'來小窩滿 {y} 年', miss:'你不在的時候', news:'小窩更新了', gift:'從{w}家來的', trip:'去{w}家過夜'};
// 送娃娃（js/nestgift.js）：寄的人從這 6 句選一句，信裡用 {m} 帶出來
const MAIL_GIFT_LINES = ['幫我照顧牠', '牠很想去你家玩', '牠說你家的沙發看起來很軟', '我家有兩隻，分你一隻', '牠跟你很合', '想你的時候就看看牠'];
const MAIL_ICON = '<svg viewBox="0 0 40 40"><rect x="4" y="9" width="32" height="23" rx="5" fill="#fff" stroke="#ff6fb0" stroke-width="2.6"/><path d="M5 11l15 11 15-11" fill="none" stroke="#ff6fb0" stroke-width="2.6" stroke-linejoin="round"/><path d="M20 27.5s-4-2.4-4-5c0-1.3 1-2.3 2.1-2.3.8 0 1.4.4 1.9 1 .5-.6 1.1-1 1.9-1 1.2 0 2.1 1 2.1 2.3 0 2.6-4 5-4 5z" fill="#ffc928"/></svg>';
const MAIL_LEAF = '<svg viewBox="0 0 60 60"><path d="M30 52C12 44 8 26 14 10c14 2 32 10 34 28-2 8-8 12-18 14z" fill="#8fd17a" stroke="#4f9a3a" stroke-width="2.4" stroke-linejoin="round"/><path d="M30 52C28 36 22 24 14 10M28 38l-9-4M25 28l-7-1M30 44l9-7M27 33l9-8" fill="none" stroke="#4f9a3a" stroke-width="2" stroke-linecap="round"/></svg>';
const MAIL_ROOM = {living:'客廳', bed:'臥室', bath:'浴室'};
const MAIL_FURN = {sofa:'沙發', tv:'電視', table:'小桌子', shelf:'櫃子', plant:'盆栽', clock:'時鐘', bed:'床', rug:'地毯', lamp:'檯燈', eggchair:'蛋椅', frame:'相框', toybox:'玩具箱', closet:'衣櫃', tub:'浴缸', sink:'洗手台', mat:'腳踏墊', towel:'毛巾', duck:'小鴨'};

/* 每隻照自己的個性寫：薯餅寫到睡著（最後一行歪掉）、蛋黃哥很短、皮蛋一直汪還會夾拖鞋、彈跳豬字很大全是驚嘆號、
   貓咪老師開頭嘴硬最後要點心、龍龍先給一片葉子背面才是信、史努比寫連載小說、火腿吐槽房間最後補一句還不錯 */
const MAIL_TPL = {
  sloth:{
    intro:['你好，我是薯餅。\n小窩的沙發很軟，我已經在上面躺了一整天。\n以後請多指教，我先閉一下眼睛……',
      '想寫信給你，想了很久要寫什麼。\n想著想著，窗外飄過去三朵雲。\n總之很高興來這裡，我先瞇一'],
    cards:['我們一起做了 {n} 件小事了。\n每一件我都記得，有幾件是睡醒才想起來的。\n下次也找我，我會醒著，大概',
      '數了一下，{n} 件了。\n數到一半差點睡著，又從頭數了一次。\n謝謝你常常來找我，晚安……zz'],
    anniv:['來小窩滿 {y} 年了。\n這段時間我睡了很多覺，每次醒來你都在。\n今天想醒著久一點，陪你',
      '今天是我來這裡的紀念日。\n我把這一年最喜歡的事想了一遍，想到一半……zz'],
    miss:['這幾天小窩很安靜，我睡了好幾場午覺。\n夢到你回來，醒來你真的回來了。\n歡迎回來，我先去躺一',
      '你不在的時候，我幫你看著窗外。\n太陽出來又下去好幾次，有一朵雲很像你。\n看到你好開心，我要睡個'],
    gift:['我是薯餅，從{w}家搬過來。\n{w}說：「{m}」\n我可以先在你家沙發躺一下嗎……'],
  },
  egg:{
    intro:['我是蛋黃哥。\n就這樣。', '懶得寫。\n（但是你好。）'],
    cards:['{n} 件了。\n有點累，但還可以。', '懶得寫。\n{n} 件，辛苦了。我是說我自己。'],
    anniv:['{y} 年了。\n時間過得好快，我還是很懶。', '懶得寫。\n不過滿 {y} 年，還是寫一下好了。'],
    miss:['你不在，我一直躺著。\n你在，我也一直躺著。\n不過你在比較好。', '懶得寫。\n回來就好。'],
    gift:['我是蛋黃哥。從{w}家來的。\n{w}說：「{m}」\n就這樣，讓我進去躺著。'],
  },
  dog:{
    intro:['汪！我是皮蛋！汪汪！\n小窩好好玩，我已經藏好一隻拖鞋了，汪。\n[拖鞋]', '汪汪汪！\n（翻譯：你好，我好喜歡這裡。）\n汪！'],
    cards:['汪！我們一起做了 {n} 件事！汪汪！\n每一件我都有搖尾巴。\n[拖鞋]', '汪汪！{n}！汪！\n（翻譯：好開心，明天也要一起玩。）'],
    anniv:['汪汪汪汪汪！\n（翻譯：來小窩滿 {y} 年了！）\n送你我藏最久的寶貝。\n[拖鞋]', '汪！{y} 年！汪汪！\n我把藏起來的東西都數了一遍，最喜歡的還是你。'],
    miss:['汪……汪？汪！！\n（翻譯：你不在的時候我在門口睡覺，聽到你回來就醒了！）', '汪汪！\n我幫你看家，把拖鞋都排好了。\n[拖鞋]\n歡迎回來，汪！'],
    gift:['汪！我是皮蛋！從{w}家跑來的！汪汪！\n{w}說：「{m}」\n我有帶拖鞋喔。\n[拖鞋]'],
  },
  moodeng:{
    intro:['我是彈跳豬！！\n這裡我說了算！！\n你可以住下來！！！', '你好！！！\n我今天跳了一百下！！！\n明天要跳兩百下！！！'],
    cards:['{n} 件！！！\n我做得最好！！！\n你也還不錯！！！', '我們做了 {n} 件事！！\n累了！！\n才沒有！！！'],
    anniv:['{y} 年！！！\n我要在床上跳 {y} 百下慶祝！！！', '來小窩滿 {y} 年了！！\n我還是最吵的那個！！！\n你喜歡吧！！！'],
    miss:['你不在的時候！！\n我跳得比較小聲！！\n才不是因為你不在！！！', '回來了！！！\n我把每個房間都跳過一遍了！！\n現在換你陪我玩！！！'],
    gift:['我是彈跳豬！！從{w}家跳過來的！！！\n{w}說：「{m}」！！\n快開門！！！'],
  },
  nyanko:{
    intro:['才不是想寫信給你。\n只是剛好有紙和筆。\n這裡還算可以住。\n對了，記得準備點心。', '才不是想認識你。\n不過既然來了，就說一聲你好。\n下次見面帶點心來。'],
    cards:['才不是在數。\n剛好看到，一起做了 {n} 件事。\n做得還可以，獎勵的話，點心就好。', '才不是想你。\n只是想起我們做了 {n} 件小事。\n今天的點心呢？'],
    anniv:['才不是在記日子。\n剛好想起來，來這裡滿 {y} 年了。\n這種日子要有蛋糕，還有點心。', '才不是特別寫的。\n{y} 年而已，沒什麼。\n……點心要兩盒。'],
    miss:['才不是想你。\n你不在的時候，我只是比較常看門口。\n回來就好，點心呢？', '才不是在等你。\n剛好醒著而已。\n既然回來了，一起吃點心吧。'],
    gift:['才不是想來你家。\n是{w}說：「{m}」\n既然來了，點心準備好了嗎。'],
  },
  dino:{
    intro:['嘿嘿，以為只有葉子吧！\n我是龍龍，最喜歡在小窩跑來跑去。\n葉子送你，是我在客廳撿的。', '翻過來了喔！\n我是龍龍，以後會把葉子藏在你找得到的地方。'],
    cards:['我們做了 {n} 件事！\n我在每一件旁邊都放了一片葉子，你有看到嗎？', '{n} 件！\n下一件我要當隊長，你當副隊長。'],
    anniv:['{y} 年了耶！\n這段時間撿的葉子，全部送你。', '今天是我的紀念日！\n我在門口跳了一圈慶祝，順便又撿了一片葉子。'],
    miss:['你不在的時候，我把小窩跑了好幾圈。\n每一圈都在門口停一下，看你回來了沒。\n現在回來了，我們去玩！', '這幾天我去探險了！\n在沙發後面找到一片很大的葉子，留給你。'],
    gift:['嘿！我是龍龍，從{w}家走了好遠的路過來。\n{w}說：「{m}」\n路上撿了一片葉子，送你。'],
  },
  // 史努比：每封信開頭一句，接著是連載小說的下一章
  snoopy:{
    intro:['親愛的讀者，我是作家史努比。新小說開始連載了。', '作家史努比，請多指教。今天先給你看一章。'],
    cards:['慶祝我們一起做了 {n} 件事，加寫一章。', '{n} 件事了，靈感很多，今天多寫一點。'],
    anniv:['來小窩滿 {y} 年，作家特別寫了這一章。', '{y} 週年紀念章，請慢慢看。'],
    miss:['你不在的時候我一直在寫，這一章寫了好久。', '作家這幾天閉關，寫出了新的一章。'],
    gift:['作家史努比，從{w}家來你家取材。\n{w}說：「{m}」\n新的一章，要從你家開始寫。'],
  },
  piggy:{
    intro:['我是火腿。先說，{r}的{f}擺得有點歪。\n牆紙跟地板的顏色我也有意見。\n……其實還不錯啦。', '初次見面，我觀察了一下。\n{r}的{f}位置不太對，走路會撞到。\n不過整體來說，其實還不錯。'],
    cards:['我們做了 {n} 件事。我順便看了一下{r}。\n{f}可以再往左一點，算了，往右也行。\n其實還不錯。', '{n} 件了，不錯。\n不過{r}的{f}你是不是很久沒擦了？\n開玩笑的，其實還不錯。'],
    anniv:['來小窩 {y} 年了，我有資格說了：\n{r}的{f}從來沒擺對過。\n……可是我已經習慣了，其實還不錯。', '{y} 週年，給這個家打個分數。\n{r}扣一分，因為{f}。\n其他滿分，其實還不錯。'],
    miss:['你不在的時候我巡了一下{r}。\n{f}還在原位，灰塵我幫你吹掉了。\n其實還不錯，歡迎回來。', '這幾天我把{r}研究了一遍。\n{f}可以換個位置，等你回來再說。\n現在這樣其實也還不錯。'],
    gift:['我是火腿，從{w}家來的。\n{w}說：「{m}」\n先讓我進去看看你家擺得怎樣。'],
  },
};
// 史努比的連載《浴缸號出航》，一封信一章，寫完第一部之後作家去找靈感
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
  '浴缸號回到浴室。船長泡了一個很長的澡，決定明天寫續集。（第一部完）',
];
const SNOOPY_REST = ['作家去泡澡找靈感了，下一章快寫好了。', '作家在屋頂上想劇情，想著想著睡著了。下一章再說。', '第二部的開頭寫了三次，都被作家自己撕掉了。再等等。'];
// 小窩更新了：薯餅寫的，不佔娃娃一天一封的名額。t 之後才開始玩的人不會收到
const MAIL_NEWS = [
  {id:'v4', t:'2026-11-26', b:'小窩多了幾樣東西，跟你說一下。\n信箱：大家會寫信給你。信不會過期，附件也一直留著，有空再看就好。\n季節：窗外跟著月份換，過節的那幾天，收納架會多出節日的東西。\n門外小島：上面最右邊那顆鈕。可以種東西，大家會輪流來幫忙。沒來也沒關係，種子會等你。\n送娃娃：登入以後，同一隻有兩隻的，可以從信箱送一隻去朋友家。朋友什麼時候開門都可以。\n我要去睡午覺了，剩下的你自己逛逛'},
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
// 寄一封娃娃的信（news 也走這裡）
function mailAdd(d, type, q, today){
  const m = mailInit();
  const n = type === 'news' ? 0 : MAIL_TPL[d][type].length;
  const i = n ? Math.floor(Math.random() * n) : 0;
  const parts = q ? [q] : [];
  if (d === 'piggy' && type !== 'news') parts.push(mailPiggyRoom());
  if (d === 'snoopy' && type !== 'news') parts.push(`c=${(m.arch.snoopy || []).length + 1}`);
  const k = `${d}.${type}.${i}${parts.length ? '#' + parts.join(';') : ''}`;
  let a = null;
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
  MAIL_NEWS.forEach(n => { if (!m.s['news-' + n.id] && n.t >= first){ m.s['news-' + n.id] = t; mailAdd('sloth', 'news', 'id=' + n.id, t); changed = true; } });
  const have = DOLLS.filter(d => DOLL_N[d] && met[d]);
  if (m.last !== t && have.length){
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
    if (pick){ m.s[pick[3]] = t; mailAdd(pick[0], pick[1], pick[2], t); changed = true; }
  }
  if (changed) save();
  mailBadge();
}

/* ---------- 信的樣子 ---------- */
const mailDec = s => { try { return decodeURIComponent(s || ''); } catch (e) { return ''; } };
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
  if (type === 'news') body = (MAIL_NEWS.find(n => n.id === p.id) || MAIL_NEWS[0]).b;
  else if (type === 'trip'){
    // 過夜日記（data.js 的 STAY_DIARY）＋主人塞的小紙條
    const e = ((typeof STAY_DIARY !== 'undefined' && STAY_DIARY[d]) || [])[i];
    body = mailFill((e ? e.t : '在{w}家住了一晚。') + (p.x ? '\n{w}塞了一張小紙條讓牠帶回來：\n「{x}」' : ''), p);
  } else {
    body = mailFill((MAIL_TPL[d] && MAIL_TPL[d][type] || [''])[i] || '', p);
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
  const html = lines.map((l, j) => {
    if (l === '[拖鞋]') return `<p class="ml-sl">${typeof DROP_SVG !== 'undefined' ? DROP_SVG.slipper : ''}</p>`;
    const last = j === lines.length - 1;
    return `<p${x.d === 'sloth' && last && x.type !== 'trip' ? ' class="tilt"' : ''}>${l}</p>`;
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
    if (o.a) inner += `<div class="ml-att ${o.g ? 'got' : ''}">${mailAtt(o.a).svg}<span>附上一個${mailAtt(o.a).name}</span>${o.g ? '<small>收下了</small>' : `<button class="btn y sm" data-take="${j}">收下</button>`}</div>`;
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
const mailAtt = a => (typeof yardAtt === 'function' && yardAtt(a)) || WISH[a];
function mailTake(o){
  if (!o.a || o.g) return; o.g = 1;
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
