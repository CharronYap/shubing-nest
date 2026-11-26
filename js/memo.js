/* 兩個人的紀念冊、今天誰來過（2026-11-26）
   紀念冊：跟朋友一起做過的事，自動收、照時間排。相簿最上面多一顆「紀念冊」。
     收：成為好友、互寄的明信片、送和收到的娃娃、去對方家過夜和帶回來的日記、對方的娃娃來過夜、
         訪客簿（對方寫給你的、你寫給對方的）、躲貓貓找到的那幾次、幫忙澆水。
     兩個人各有一本，記的是同一件事從自己這邊看的樣子。
   今天誰來過：打開小窩時，朋友在你上次看過之後來過，跳一張小卡片。一天最多一次，沒有人來就不跳。
     愛心照舊不寫是誰，只寫收到幾顆。
   存檔（都放在 S.album 裡，不用改雲端規則）：
     memo = [{id, t:'日期', ts, u:朋友的 uid, n:朋友的名字, k:哪一種, in:1（對方做的事）, d:娃娃, m:對方寫的字, c:明信片編號}]  新的在前，最多 100 筆
     who  = '上次跳卡片的日期'   whoT = 上次跳卡片的時間   whoH = {d:'日期', n:那天已經講過幾顆愛心}
   做法：這些玩法都透過 window.nestNet 讀寫雲端，所以在那一層包一次，寫成功、或讀到對方留下的東西時順手記一筆；
        同一件事用 id 認，讀到幾次都只記一次。朋友的名字和寫的字一律走 txSlot（textContent）。 */
const MEMO_MAX = 100;
const MEMO_ICON = {
  friend: HEART(), cardOut: CARD_ICON, cardIn: CARD_ICON, giftOut: MAIL_ICON, giftIn: MAIL_ICON,
  stayOut: STAY_MOON, stayBack: STAY_MOON, guest: STAY_MOON, photoWith: typeof CAM_ICON !== 'undefined' ? CAM_ICON : STAY_MOON, bookIn: BOOK_ICON, bookOut: BOOK_ICON,
  hideFound: WANT_STAR, hideMiss: WANT_STAR, seekFound: WANT_STAR, waterIn: WATER_ICON, waterOut: WATER_ICON,
};
const memoList = () => (S.album.memo = Array.isArray(S.album.memo) ? S.album.memo : []);
const memoDate = day => { const d = new Date((day | 0) * 864e5); return isNaN(d) || !(day > 0) ? todayStr() : d.toISOString().slice(0, 10); };
// 記一筆。k 見 MEMO_ICON；o = {id, d, m, c, day（那件事是哪一天，沒有就是今天）, in}
function memoAdd(k, uid, name, o){
  o = o || {};
  if (!uid || typeof uid !== 'string' || !MEMO_ICON[k]) return false;
  const L = memoList(), id = String(o.id || k + ':' + uid + ':' + todayStr()).slice(0, 80);
  if (L.some(e => e.id === id)) return false;
  const e = {id, t: o.day ? memoDate(o.day) : todayStr(), ts: Date.now(), u: uid.slice(0, 64), n: sText(name, 12) || '朋友', k};
  if (o.in) e.in = 1;
  if (o.d && DOLLS.includes(o.d)) e.d = o.d;
  if (o.m) e.m = sText(o.m, 40);
  if (o.c) e.c = String(o.c).slice(0, 80);
  L.unshift(e);
  L.sort((a, b) => (a.t < b.t ? 1 : a.t > b.t ? -1 : b.ts - a.ts));
  if (L.length > MEMO_MAX) L.length = MEMO_MAX;
  save();
  return true;
}
window.nestMemo = (k, uid, name, o) => { try { memoAdd(k, uid, name, o); } catch (e) {} };
// 一句話。朋友的名字和字用 txSlot
function memoText(e){
  const w = txSlot(e.n), d = e.d ? DOLL_NAME[e.d] : '娃娃';
  switch (e.k){
    case 'friend': return `和${w}成為好友`;
    case 'cardOut': return `寄了一張明信片給${w}`;
    case 'cardIn': return `收到${w}寄來的明信片`;
    case 'giftOut': return `把${d}送給${w}`;
    case 'giftIn': return `${w}送來了${d}`;
    case 'stayOut': return `${d}去${w}家過夜`;
    case 'stayBack': return e.m ? `${d}從${w}家帶回一張小紙條：「${txSlot(e.m)}」` : `${d}從${w}家帶日記回來`;
    case 'guest': return `${w}家的${d}來過夜`;
    case 'photoWith': return `和${w}家的${d}一起拍了照`;
    case 'bookIn': return e.m ? `${w}在訪客簿寫：「${txSlot(e.m)}」` : `${w}在訪客簿貼了貼紙`;
    case 'bookOut': return `在${w}的訪客簿留了話`;
    case 'hideFound': return `${w}找到躲起來的${d}`;
    case 'hideMiss': return `${w}來找躲起來的${d}，沒找到`;
    case 'seekFound': return `在${w}家找到躲起來的${d}`;
    case 'waterIn': return `${w}來幫小島澆水`;
    case 'waterOut': return `幫${w}的小島澆水`;
  }
  return '';
}

/* ---------- 相簿多一頁：和○○的紀念冊 ---------- */
let memoCur = null;
function memoOpen(uid){
  if (VISIT) return;
  const L = memoList();
  // 有紀錄的朋友，最近有事的排前面
  const pals = [];
  L.slice().sort((a, b) => b.ts - a.ts).forEach(e => { if (!pals.some(p => p.u === e.u)) pals.push({u: e.u, n: e.n}); });
  if (uid) memoCur = uid;
  if (!pals.some(p => p.u === memoCur)) memoCur = pals.length ? pals[0].u : null;
  const me = pals.find(p => p.u === memoCur);
  const rows = L.filter(e => e.u === memoCur).map(e => {
    const card = e.k === 'cardIn' && e.c && S.mail && Array.isArray(S.mail.pc) && S.mail.pc.some(c => c.id === e.c);
    return `<div class="mm-it ${card ? 'tap' : ''}" ${card ? `data-mmc="${e.c}" role="button" tabindex="0"` : ''}><small>${md(e.t)}</small><span class="ic">${MEMO_ICON[e.k] || ''}</span><p>${memoText(e)}${card ? '<i>點開看</i>' : ''}</p></div>`;
  }).join('');
  openSheet(`<div class="hd">${ALB_ICON}<span>${me ? `和${txSlot(me.n)}的紀念冊` : '紀念冊'}</span></div>
    <div class="mm-box">
      ${pals.length > 1 ? `<div class="ng-chips">${pals.map(p => `<button class="ng-chip ${p.u === memoCur ? 'on' : ''}" data-mmu="${p.u}" aria-pressed="${p.u === memoCur}">${txSlot(p.n)}</button>`).join('')}</div>` : ''}
      ${rows || `<p class="al-em">${sNet() ? '還沒有紀錄。跟朋友互寄明信片、送娃娃、去對方家過夜、在訪客簿留話、玩躲貓貓、幫忙澆水，都會自動記在這裡。' : '登入、加了好友之後，一起做過的事會自動記在這裡。'}</p>`}
      <p class="bk-note">最多留最近 ${MEMO_MAX} 筆。只存在你自己的存檔裡，朋友那邊有他自己的一本。</p>
    </div>
    <div class="ml-ft"><button class="btn" data-mmback="1">回相簿</button></div>`);
  evOpen = false; alOpen = false;
}
$('#sheet').addEventListener('click', e => {
  if (e.target.closest('[data-memo]')){ memoOpen(); return; }
  if (e.target.closest('[data-mmback]')){ openAlbum(); return; }
  const u = e.target.closest('[data-mmu]'); if (u){ memoOpen(u.dataset.mmu); return; }
  const c = e.target.closest('[data-mmc]');
  if (c && typeof cardOpen === 'function'){ const i = (S.mail.pc || []).findIndex(x => x.id === c.dataset.mmc); if (i >= 0) cardOpen(i); }
});
// 相簿最上面多一顆「紀念冊」
if (typeof openAlbum === 'function'){
  const prev = openAlbum;
  openAlbum = function(d){
    prev(d);
    const hd = $('#sheet .hd');
    if (hd && !VISIT && !hd.querySelector('[data-memo]') && (sNet() || memoList().length)) hd.insertAdjacentHTML('beforeend', '<button class="btn sm al-memo" data-memo="1">紀念冊</button>');
  };
}

/* ---------- 在雲端那一層順手記 ---------- */
function memoWrap(){
  const net = window.nestNet;
  if (!net || net._memo) return;
  net._memo = true;
  const friendName = async uid => { try { const f = (await net.friends()).find(p => p.uid === uid); return f ? f.name : ''; } catch (e) { return ''; } };
  const after = (k, fn) => { const old = net[k]; if (typeof old !== 'function') return; net[k] = async (...a) => { const r = await old(...a); try { await fn(r, ...a); } catch (e) { console.info('[memo]', k, e); } return r; }; };
  const me = () => (net.me ? net.me.uid : '');
  // 我做的
  after('sendGift', (id, o) => memoAdd('giftOut', o.to, o.toName, {id: 'go' + id, d: o.doll}));
  after('cardSend', async (r, o) => memoAdd('cardOut', o.to, await friendName(o.to), {id: 'co' + o.to + Date.now()}));
  after('bookAdd', (r, uid, day) => memoAdd('bookOut', uid, VISIT && VISIT.uid === uid ? VISIT.name : '', {id: 'bo' + day + uid, day}));
  after('waterAdd', (r, uid, day) => memoAdd('waterOut', uid, VISIT && VISIT.uid === uid ? VISIT.name : '', {id: 'wo' + day + uid, day}));
  after('stayGo', async (r, o) => memoAdd('stayOut', o.to, await friendName(o.to), {id: 'so' + o.day + o.doll, d: o.doll, day: o.day}));
  // 對方做的（讀到的時候記）
  after('cardsTo', list => (list || []).forEach(c => { if (c && typeof c.id === 'string' && c.from) memoAdd('cardIn', c.from, c.fromName, {id: 'ci' + c.id, c: c.id, in: 1}); }));
  after('book', (list, uid) => { if (uid !== me()) return; (list || []).forEach(b => { if (b && typeof b.id === 'string' && b.from) memoAdd('bookIn', b.from, b.fromName, {id: 'bi' + b.id, m: b.msg, day: b.day, in: 1}); }); });
  after('waters', list => (list || []).forEach(w => { if (w && typeof w.id === 'string' && w.from) memoAdd('waterIn', w.from, w.fromName, {id: 'wi' + w.id, day: w.day, in: 1}); }));
  after('stayGuests', list => (list || []).forEach(g => { if (g && typeof g.id === 'string' && DOLLS.includes(g.doll)) memoAdd('guest', g.from || g.id, g.fromName, {id: 'sg' + g.id + (g.day | 0), d: g.doll, day: g.day, in: 1}); }));
}
memoWrap();
// window.nestNet 是 js/account.js（module，比較晚跑）放上去的；一放上去就包。
// 不能等 nestnet 事件才包：明信片、澆水那幾個檔案的 nestnet 比這裡早掛，會先去讀雲端，那一次就記不到
{ const t = setInterval(() => { if (window.nestNet){ memoWrap(); clearInterval(t); } }, 40); setTimeout(() => clearInterval(t), 60000); }
addEventListener('nestnet', memoWrap, true);
addEventListener('nestnet', () => { memoWrap(); memoStart(); });

/* ---------- 今天誰來過 ---------- */
const WHO_SAY = {
  bookIn: () => '在訪客簿留了話', waterIn: () => '幫小島澆了水', guest: e => `帶${DOLL_NAME[e.d] || '娃娃'}來過夜`, cardIn: () => '寄了明信片',
  hideFound: e => `找到躲起來的${DOLL_NAME[e.d] || '娃娃'}`, hideMiss: e => `來找躲起來的${DOLL_NAME[e.d] || '娃娃'}，沒找到`,
};
async function whoShow(){
  const net = sNet(); if (!net || VISIT) return;
  const a = S.album, t = todayStr();
  if (a.who === t) return;
  const since = a.whoT || 0;
  const fresh = memoList().filter(e => e.in && WHO_SAY[e.k] && e.ts > since);
  // 愛心：只算今天還沒講過的
  let hearts = 0;
  try { const n = (await net.heartsToday()) | 0, told = a.whoH && a.whoH.d === t ? a.whoH.n : 0; hearts = Math.max(0, n - told); a.whoH = {d: t, n: Math.max(n, told)}; } catch (e) { sQuiet('who', e); }
  if (!fresh.length && !hearts) return;
  // 畫面上有別的東西（封面、面板、獎品卡、薯餅帶路）時先不跳，晚一點再看
  if (!$('#cover').hidden || !$('#sheet').hidden || screen.querySelector('.over') || $('#tour')){ setTimeout(whoShow, 5000); return; }
  const by = [];
  fresh.forEach(e => { let p = by.find(x => x.u === e.u); if (!p){ p = {u: e.u, n: e.n, s: []}; by.push(p); } const s = WHO_SAY[e.k](e); if (!p.s.includes(s)) p.s.push(s); });
  a.who = t; a.whoT = Date.now(); save();
  const o = document.createElement('div'); o.className = 'over';
  o.innerHTML = `<div class="pcard who" role="dialog" aria-label="今天誰來過"><h3>今天誰來過</h3>
    ${by.map(p => `<p class="who-l"><b>${txSlot(p.n)}</b>來過：${p.s.join('、')}</p>`).join('')}
    ${hearts ? `<p class="who-l">${HEART()}收到 ${hearts} 顆愛心</p>` : ''}
    <div class="pz-row"><button class="btn y ok" aria-label="知道了">${CKS}</button>${by.length ? '<button class="btn who-mm">看朋友那邊</button>' : ''}</div></div>`;
  screen.appendChild(o);
  o.querySelector('.ok').onclick = () => o.remove();
  const mm = o.querySelector('.who-mm'); if (mm) mm.onclick = () => { o.remove(); if (typeof frOpen === 'function'){ frWho = by[0].u; frOpen('in'); } else memoOpen(by[0].u); };
}
// 登入好了：讀一次自己的訪客簿（其他的各自的檔案會讀），過幾秒看有沒有人來過
let memoStarted = false;
function memoStart(){
  const net = sNet(); if (!net || memoStarted) return;
  memoStarted = true;
  net.book(net.me.uid).catch(e => sQuiet('memo', e));
  setTimeout(whoShow, 9000);
}
if (sNet()) memoStart();
