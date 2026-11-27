/* 小窩指南（2026-11-26）
   一頁列出小窩所有的功能，分四類。每一項：圖示、名稱、一句話、「帶我去」。還沒解開的照樣列出來，寫怎麼解開。
   入口：封面右上角的問號、小屋地圖最下面。
   ★ 之後每加一個功能，在下面 GUIDE 加一行就好：
     {c: 哪一類（room 房間和佈置／doll 娃娃／coin 賺幣和買東西／pal 朋友）, ic: 圖示, t: 名稱, s: 一句話,
      go: 點「帶我去」做什麼（不寫就沒有按鈕，只是說明）, btn: 按鈕上的字（不寫是「帶我去」）,
      lock: () => 還沒解開時回傳「怎麼解開」的字，解開了回傳空字串, lockGo: 還沒解開時按鈕做什麼, lockBtn: 那顆按鈕的字}
   第一次進遊戲：薯餅帶三步（拖娃娃、夾一次、看信）。可以跳過，之後在指南最上面可以重看。
   看過沒有記在 S.album.tour（放在 album 裡面，不用改雲端規則）。 */
const GUIDE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8.4 9.2a3.6 3.6 0 1 1 5.6 3c-1.1.7-2 1.4-2 2.8"/><circle cx="12" cy="18.8" r="1.3" fill="currentColor" stroke="none"/></svg>';
const GUIDE_CAT = [['room', '房間和佈置'], ['doll', '娃娃'], ['coin', '賺幣和買東西'], ['pal', '朋友']];
const gdIn = () => !!(window.nestNet && window.nestNet.me);
const gdShut = () => { $('#sheet').hidden = true; };
// 回房間那一頁；有指定房間、而且那一間有開，就走過去
const gdRoom = r => { gdShut(); setPage('room'); if (typeof yardOn !== 'undefined' && yardOn && r !== 'yard' && typeof goRoom === 'function') goRoom(r || 'living'); else if (r && roomId !== r && (RIDS.includes(r) || r === 'yard')) goRoom(r); };
const gdAcct = () => { gdShut(); const b = $('#coverAcct'); if (b) b.click(); };
const gdDoll = d => `<img src="${SPR[d]}" alt="">`;
const gdNeedLogin = () => gdIn() ? '' : '登入之後才有。帳號在封面左上角。';
const gdKey = r => () => home[r] ? '' : `還沒開。${ROOM_KEY[r].price} 枚幣可以打開。`;
const gdAsk = r => () => roomAsk(r, guideOpen);   // 直接問要不要打開（js/rooms.js）
const gdShop = () => { if (typeof shopOpen === 'function') shopOpen(); };
const gdTab = t => { gdRoom(roomId === 'yard' ? 'living' : null); tab = t; if (typeof setTray === 'function') setTray(false); renderTray(); if (typeof layout === 'function') layout(); };

const GUIDE = [
  // ---- 房間和佈置
  {c: 'room', ic: ICON.living, t: '擺娃娃和家具', s: '下面的收納架有四頁：娃娃、家具、牆地、紀念。點一下擺進房間，拖回架子就是收起來。家具每一間都能擺，擺在別間的點一下就搬過來。上面那條把手可以往上拖開大、往下拖收起來。', go: () => gdTab('furn')},
  {c: 'room', ic: MAP_ICON, t: '小屋地圖', s: '上面中間那顆。看得到每一間有誰，點一間就過去。', go: () => mapOpen()},
  {c: 'room', ic: ICON.living, t: '家具系列', s: '同一個系列的家具湊齊了會送東西。收納架家具那一頁最上面看得到還差幾件。', go: () => { if (typeof seriesOpen === 'function') seriesOpen(); }},
  {c: 'room', ic: '<span class="sw w-dots"></span>', t: '壁紙和地板', s: '收納架第三個分頁，點一下就換。', go: () => gdTab('deco')},
  {c: 'room', ic: gdDoll('sloth'), t: '開燈和關燈', s: '牆上的開關。關了燈，房間暗下來，燈會亮。', go: () => gdRoom(roomId === 'yard' ? 'living' : null)},
  {c: 'room', ic: ICON.yard, t: '門外小島', s: '客廳的門走出去。可以帶娃娃去、擺家具；種花、搖樹、招待小客人，都是點一下。', go: () => gdRoom('yard')},
  {c: 'room', ic: ICON.kitchen, t: '廚房', s: '多一間可以佈置的房間。', go: () => gdRoom('kitchen'), lock: gdKey('kitchen'), lockGo: gdAsk('kitchen'), lockBtn: '打開'},
  {c: 'room', ic: ICON.attic, t: '閣樓', s: '晚上從天窗看得到流星。', go: () => gdRoom('attic'), lock: gdKey('attic'), lockGo: gdAsk('attic'), lockBtn: '打開'},
  {c: 'room', ic: CAM_ICON, t: '拍照', s: '右上角的相機。把現在的房間拍下來，可以存到手機。', go: () => { gdRoom(roomId === 'yard' ? 'living' : null); toast('右上角的相機，按一下就拍'); }},
  {c: 'room', ic: gdDoll('moodeng'), t: '窗外和季節', s: '窗外跟著時間、天氣、月份變。過節那幾天，收納架的紀念那一頁會多出節日的東西。'},
  // ---- 娃娃
  {c: 'doll', ic: CLAW_ICON, t: '娃娃機', s: '夾娃娃、家具和扭蛋。每天第一次不用幣。', go: () => { gdShut(); setPage('claw'); }},
  {c: 'doll', ic: EV_ICON, t: '今天的小事', s: '每天有幾件小事，點有記號的娃娃去處理，做完一件 3 枚。', go: () => { setPage('room'); openEvents(); }},
  {c: 'doll', ic: ALB_ICON, t: '相簿', s: '每隻說過的話、回憶、跟誰比較好。薯餅、蛋黃哥、皮蛋、貓咪老師可以用手指轉一圈。', go: () => { setPage('room'); openAlbum(); }},
  {c: 'doll', ic: gdDoll('egg'), t: '衣櫃', s: '幫娃娃換帽子和衣服。點房間裡的衣櫃，或相簿裡的「換衣服」。', go: () => { setPage('room'); openWardrobe(); }},
  {c: 'doll', ic: MAIL_ICON, t: '信箱', s: '娃娃和薯餅寫給你的信、朋友寄來的明信片都在這裡，上面可以分類看。有附件的記得收，不會過期。', go: () => { setPage('room'); openMail(); }},
  {c: 'doll', ic: gdDoll('dino'), t: '娃娃自己玩', s: '牠們會自己走動、聊天、去隔壁串門子。不想要的話，小屋地圖最下面可以關。', go: () => mapOpen()},
  {c: 'doll', ic: gdDoll('snoopy'), t: '小劇場', s: '娃娃頭上出現驚嘆號，點一下就開演。演過的在相簿可以重看。', go: () => { setPage('room'); openAlbum(); }, btn: '去相簿'},
  {c: 'doll', ic: STAY_MOON, t: '娃娃的夢', s: '晚上娃娃會睡覺。點睡著的娃娃，看牠夢到什麼。'},
  {c: 'doll', ic: gdDoll('dog'), t: '你不在的時候', s: '隔一陣子回來，地上會有牠們留下的小東西，撿起來有幣。'},
  {c: 'doll', ic: typeof TV_BAG_ICON !== 'undefined' ? TV_BAG_ICON : ICON.living, t: '旅行', s: '客廳門邊的背包放點心、護身符、道具，放好就不用管。誰想出門會自己背走，路上寄明信片，回家帶土產。', go: () => { gdRoom('living'); if (typeof tvBagOpen === 'function') setTimeout(tvBagOpen, 300); }},
  {c: 'doll', ic: gdDoll('snoopy'), t: '旅行相簿', s: '主畫面相簿旁邊那一疊書，點「旅行」。四個地方各 3 張明信片、2 種土產，還有誰去過幾次。', go: () => { if (typeof tvAlbumOpen === 'function') tvAlbumOpen(); }},
  // ---- 賺幣和買東西
  {c: 'coin', ic: COIN, t: '現在可以賺幣的事', s: '點上面的幣就會列出來，點了直接過去。', go: () => earnOpen(false)},
  {c: 'coin', ic: COIN, t: '每天的幣', s: `每天第一次打開送 ${typeof DAILY_COINS !== 'undefined' ? DAILY_COINS : 20} 枚，沒來也不會被扣。`},
  {c: 'coin', ic: gdDoll('nyanko'), t: '電視小遊戲', s: '接點心、翻牌。每天前 3 局給得比較多，之後想玩幾局都可以。', go: () => { setPage('room'); gameMenu(); }},
  {c: 'coin', ic: SHOP_ICON, t: '火腿的小店', s: '家具、壁紙、房間的鑰匙，每天換一批。花和果子也拿來這裡換幣。', go: gdShop},
  {c: 'coin', ic: gdDoll('piggy'), t: '娃娃機的店員', s: '夾到家裡已經有的娃娃，可以送朋友，也可以留著。留著的那隻當店員，每隻一天 2 枚。', go: () => { gdShut(); setPage('claw'); }},
  {c: 'coin', ic: ICON.yard, t: '小島收成', s: '花開了點一下就收，樹每天三顆果子。拿去火腿的小店，一個 1 枚。', go: () => gdRoom('yard')},
  {c: 'coin', ic: WANT_STAR, t: '里程碑', s: '第一次做到某些事會有幣，補發不會漏。', go: () => earnMsOpen()},
  // ---- 朋友（都要登入）
  {c: 'pal', ic: FR_ICON, t: '朋友', s: '上面第三排右邊那顆。去朋友家、寄明信片、送娃娃、去過夜都從這裡；朋友那邊來的東西也都收在這裡。', go: () => { setPage('room'); frOpen(); }, lock: gdNeedLogin, lockGo: gdAcct, lockBtn: '去登入'},
  {c: 'pal', ic: gdDoll('sloth'), t: '帳號和好友', s: '登入之後進度存在雲端，換手機也在。用好友碼加朋友。', go: gdAcct, btn: '開帳號'},
  {c: 'pal', ic: ICON.living, t: '去朋友家', s: '朋友面板最上面的「去他家」。可以看他的每一間。', go: () => { setPage('room'); frOpen(); }, btn: '開朋友', lock: gdNeedLogin, lockGo: gdAcct, lockBtn: '去登入'},
  {c: 'pal', ic: HEART(), t: '愛心', s: '在朋友家點娃娃，留一顆愛心。你收到的愛心可以換幣。', go: () => { setPage('room'); frOpen(); }, btn: '開朋友', lock: gdNeedLogin, lockGo: gdAcct, lockBtn: '去登入'},
  {c: 'pal', ic: BOOK_ICON, t: '訪客簿', s: '朋友來你家可以貼貼紙、寫一句話，收在朋友面板。你去他家也可以寫。', go: () => { setPage('room'); bookOpen(); }, lock: gdNeedLogin, lockGo: gdAcct, lockBtn: '去登入'},
  {c: 'pal', ic: WANT_STAR, t: '願望清單', s: '相簿裡還沒來的娃娃，點星星。朋友來你家時看得到。', go: () => { setPage('room'); openAlbum(); }, btn: '去相簿', lock: gdNeedLogin, lockGo: gdAcct, lockBtn: '去登入'},
  {c: 'pal', ic: MAIL_ICON, t: '送娃娃', s: '把留著的那隻送給朋友。從朋友面板，或點娃娃機的店員。', go: () => { setPage('room'); frOpen(); }, btn: '開朋友', lock: gdNeedLogin, lockGo: gdAcct, lockBtn: '去登入'},
  {c: 'pal', ic: WATER_ICON, t: '幫忙澆水', s: '去朋友家的小島幫他澆水。朋友也會來幫你，一次 1 枚。', go: () => { setPage('room'); frOpen(); }, btn: '開朋友', lock: gdNeedLogin, lockGo: gdAcct, lockBtn: '去登入'},
  {c: 'pal', ic: STAY_MOON, t: '過夜', s: '讓一隻娃娃去朋友家住一晚，隔天牠帶日記回來。從朋友面板的「去過夜」。', go: () => { setPage('room'); frOpen(); }, btn: '開朋友', lock: gdNeedLogin, lockGo: gdAcct, lockBtn: '去登入'},
  {c: 'pal', ic: gdDoll('dino'), t: '躲貓貓', s: '點一隻娃娃選「躲起來」，再點一件家具。朋友來你家有 3 次機會找牠，找到兩邊各 1 枚。', go: () => gdRoom(roomId === 'yard' ? 'living' : null), lock: gdNeedLogin, lockGo: gdAcct, lockBtn: '去登入'},
  {c: 'pal', ic: ALB_ICON, t: '兩個人的紀念冊', s: '主畫面相簿旁邊那一疊書裡。跟朋友一起做過的事，照時間排：明信片、送的娃娃、過夜、訪客簿、躲貓貓、澆水。', go: () => { setPage('room'); memoOpen(); }, lock: gdNeedLogin, lockGo: gdAcct, lockBtn: '去登入'},
  {c: 'pal', ic: HEART(), t: '今天誰來過', s: '朋友在你不在的時候來過，打開小窩會跳一張小卡片告訴你，一天最多一次。'},
  {c: 'pal', ic: CARD_ICON, t: '明信片', s: '拍完照可以寄給朋友，或從朋友面板直接寄現在這一間。收到的也在朋友面板。', go: () => { setPage('room'); frOpen(); }, btn: '開朋友', lock: gdNeedLogin, lockGo: gdAcct, lockBtn: '去登入'},
];

let gdRows = [];
function guideOpen(){
  if (VISIT){ toast('回到自己家再看指南'); return; }
  gdRows = GUIDE.map(g => {
    let lock = ''; try { lock = g.lock ? g.lock() : ''; } catch (e) {}
    return {g, lock};
  });
  const row = (x, i) => {
    const {g, lock} = x, fn = lock ? g.lockGo : g.go;
    return `<div class="er-it gd-it ${lock ? 'lk' : ''}"><span class="ic">${g.ic}</span><span class="tx2"><b>${g.t}</b><small>${g.s}</small>${lock ? `<small class="gd-lk">${lock}</small>` : ''}</span>${fn ? `<button class="btn ${lock ? '' : 'y'} sm" data-gd="${i}">${lock ? (g.lockBtn || '怎麼開') : (g.btn || '帶我去')}</button>` : ''}</div>`;
  };
  openSheet(`<div class="hd">${GUIDE_ICON}<span>小窩指南</span></div>
    <div class="er-box gd-box">
      <div class="gd-top"><img src="${SPR.sloth}" alt=""><p>小窩有的東西都在這裡。點「帶我去」就過去。</p><button class="btn sm" data-gdtour="1">薯餅再帶一次</button></div>
      ${GUIDE_CAT.map(([k, name]) => `<div class="al-sec">${name}</div>` + gdRows.map((x, i) => x.g.c === k ? row(x, i) : '').join('')).join('')}
      ${typeof nestVer === 'function' && nestVer() ? `<p class="bk-note gd-ver">版本 ${nestVer()}</p>` : ''}
    </div>`);
  evOpen = false; alOpen = false;
}
$('#sheet').addEventListener('click', e => {
  if (e.target.closest('[data-gdtour]')){ gdShut(); tourStart(true); return; }
  if (e.target.closest('[data-gdopen]')){ guideOpen(); return; }
  const b = e.target.closest('[data-gd]'); if (!b) return;
  const x = gdRows[+b.dataset.gd]; if (!x) return;
  const fn = x.lock ? x.g.lockGo : x.g.go;
  try { if (fn) fn(); } catch (err) { console.info('[guide]', err); toast('現在去不了，等一下再試'); }
});

/* ---------- 入口：封面、小屋地圖 ---------- */
{
  const cover = $('#cover');
  if (cover && !$('#coverGuide')){
    const b = document.createElement('button');
    b.className = 'cv-cb cv-gd'; b.id = 'coverGuide'; b.setAttribute('aria-label', '小窩指南'); b.innerHTML = GUIDE_ICON;
    cover.appendChild(b);
    // 從封面看指南：直接進房間，指南開在上面
    b.addEventListener('click', () => { const go = $('#coverGo'); if (go) go.click(); setTimeout(guideOpen, 60); });
  }
}
// 小屋地圖最下面多一顆
if (typeof mapOpen === 'function'){
  const prev = mapOpen;
  mapOpen = function(){
    prev();
    const hm = $('#sheet .hm');
    if (hm && !VISIT && !hm.querySelector('[data-gdopen]')) hm.insertAdjacentHTML('beforeend', `<button class="btn gd-in" data-gdopen="1">${GUIDE_ICON}<span>小窩指南</span></button>`);
  };
}

/* ---------- 第一次進遊戲：薯餅帶三步 ---------- */
const TOUR_STEPS = [
  {t: '我是薯餅。帶你走三步，很快。第一步：按住一隻娃娃，拖到你想放的地方。', page: 'room'},
  {t: '第二步：去娃娃機夾一次。每天第一次不用幣。', page: 'claw'},
  {t: '第三步：打開信箱。裡面有我寫給你的信。', page: 'room'},
];
let tour = null;   // {i, snap, el, timer}
const tourSeen = () => !!(S.album && S.album.tour);
const tourDolls = () => JSON.stringify(Object.keys(home).map(r => (home[r].items || []).filter(i => i.kind === 'doll').map(i => [i.id, Math.round(i.x), Math.round(i.y), i.sit || 0])));
function tourMark(){ S.album.tour = todayStr(); save(); }
function tourHi(){
  document.querySelectorAll('.tour-hi').forEach(e => e.classList.remove('tour-hi'));
  if (!tour || tour.end) return;
  let el = null;
  if (tour.i === 0) el = page === 'room' ? null : $('#swap');
  else if (tour.i === 1) el = page === 'claw' ? $('#ctrl .go') : $('#swap');
  else if (tour.i === 2) el = page === 'room' ? $('#mailBtn') : $('#swap');
  if (el) el.classList.add('tour-hi');
  // 第一步：圈住房間裡的一隻娃娃
  if (tour.i === 0 && page === 'room'){ const d = room.querySelector('.it.doll'); if (d) d.classList.add('tour-hi'); }
}
function tourPaint(){
  let el = $('#tour');
  if (!tour){ if (el) el.remove(); tourHi(); return; }
  if (!el){
    el = document.createElement('div'); el.id = 'tour'; el.className = 'tour'; el.setAttribute('role', 'status');
    screen.appendChild(el);
    el.addEventListener('click', e => {
      if (e.target.closest('[data-tour="skip"]')){ tourEnd(true); return; }
      if (e.target.closest('[data-tour="ok"]')) tourEnd(false);
    });
  }
  const txt = tour.end ? '就這樣。其他的都寫在小窩指南裡，封面右上角和小屋地圖最下面都有。我去睡了。' : TOUR_STEPS[tour.i].t;
  el.classList.toggle('low', page === 'claw');
  el.innerHTML = `<img src="${SPR.sloth}" alt=""><div><p>${txt}</p><div class="tour-ft">${tour.end ? '' : `<span>${tour.i + 1} / ${TOUR_STEPS.length}</span>`}<button class="btn sm ${tour.end ? 'y' : ''}" data-tour="${tour.end ? 'ok' : 'skip'}">${tour.end ? '好' : '跳過'}</button></div></div>`;
  tourHi();
}
function tourSnap(){ tour.snap = {dolls: tourDolls(), wins: S.wins | 0, misses: S.misses | 0, free: S.day && S.day.free ? 1 : 0, coins: S.coins}; }
function tourNext(){
  if (!tour) return;
  tour.i++;
  if (tour.i >= TOUR_STEPS.length){ tour.end = true; tourMark(); }
  else tourSnap();
  tourPaint();
}
function tourTick(){
  if (!tour || tour.end) return;
  if (VISIT){ tourEnd(true); return; }
  const s = tour.snap;
  let ok = false;
  if (tour.i === 0) ok = !drag && tourDolls() !== s.dolls;
  else if (tour.i === 1) ok = !screen.querySelector('.over') && typeof claw !== 'undefined' && claw.state === 'idle' && ((S.wins | 0) !== s.wins || (S.misses | 0) !== s.misses || (S.day && S.day.free ? 1 : 0) !== s.free);
  else if (tour.i === 2) ok = !$('#sheet').hidden && !!$('#sheet .ml-box');
  if (ok) tourNext(); else { if (tour.page !== page){ tour.page = page; tourPaint(); } else tourHi(); }
}
function tourStart(again){
  if (VISIT || (tour && !tour.end)) return;
  if (!again && tourSeen()) return;
  tour = {i: 0, page};
  tourSnap(); tourPaint();
  clearInterval(tourStart.t); tourStart.t = setInterval(tourTick, 500);
}
function tourEnd(skip){
  clearInterval(tourStart.t);
  tour = null; tourPaint();
  if (!tourSeen()) tourMark();
  if (skip) toast('之後想看，小窩指南最上面可以請薯餅再帶一次');
}
// 還沒夾到過任何東西、也沒看過帶路的人：封面關掉之後開始。玩過的人不會自己跳出來
{
  const wait = setInterval(() => {
    if (tourSeen() || (S.wins | 0) > 0){ clearInterval(wait); return; }
    if (VISIT || !$('#cover').hidden || !$('#sheet').hidden || screen.querySelector('.over')) return;
    clearInterval(wait); tourStart(false);
  }, 800);
}
