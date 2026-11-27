/* 朋友面板（2026-11-26）：使用者說「幫我在畫面上加一個朋友的 icon，不然每次找朋友都很麻煩，收到他們信件的部分可以統一在一個地方」。
   - 上面第二排右邊那一組：信箱、朋友、今天的小事。原本獨立的訪客簿鈕收進這個面板（去朋友家時那顆還在，開的是朋友的訪客簿）。
   - 面板最上面：朋友的名字和頭像、「去他家」，下面一排：寄明信片、送娃娃、去過夜、我的訪客簿。
   - 主體是「他那邊來的」：明信片、送來的娃娃（還沒領的在這裡按「讓牠進來」）、訪客簿的留言、來過夜的娃娃、
     自己的娃娃從他家帶回來的日記、澆水、躲貓貓、愛心。新的在上面，上次打開之後才來的有一個點。
   - 另一頁「寄出去的」：還在朋友門口等的娃娃（可以收回）、寄出去的明信片、在他家訪客簿寫的、幫他澆的水……
   - 2026-11-27 起信箱也列朋友的東西（「明信片」「朋友家」兩類），跟這裡是同一份資料；在信箱看過的明信片和日記，這裡的數字就不再算。
   資料不另外存一份：跟相簿的「兩個人的紀念冊」共用 S.album.memo（js/memo.js），加上信箱裡的明信片（S.mail.pc）、雲端上還沒領的娃娃。
   只多一個數字 S.album.frSeen = 上次打開面板的時間（放在 album 裡，不用改規則）。新舊風格都能用。
   要放在 hud.js 前面載入（hud.js 會把 #palBtn 排進第二排）。 */
const FR_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="8.600" cy="8.400" r="3.600"/><circle cx="17" cy="9.400" r="2.800"/><path d="M1.800 19.600c.500-3.900 3.200-6.200 6.800-6.200s6.300 2.300 6.800 6.200c.100.600-.400 1.100-1 1.100H2.800c-.600 0-1.100-.500-1-1.100z"/><path d="M15.200 14.100c.600-.200 1.200-.300 1.800-.300 2.800 0 4.800 1.800 5.200 4.800.100.600-.400 1.100-1 1.100h-3.700c.100-.400.100-.800 0-1.300-.300-1.800-1.100-3.300-2.300-4.300z"/></svg>';
const FR_IN = ['cardIn', 'giftIn', 'bookIn', 'guest', 'stayBack', 'waterIn', 'hideFound', 'hideMiss'];
const FR_OUT = ['cardOut', 'giftOut', 'bookOut', 'stayOut', 'waterOut', 'seekFound'];
let frTab = 'in', frWho = null, frList = null, frNewSince = 0, frHearts = 0, frBusy = false;
const frMemo = () => (typeof memoList === 'function' ? memoList() : []);
const frSeenAt = () => (S.album && S.album.frSeen) || 0;
// 還沒看過的：上次打開之後才來的，加上還在門口等的娃娃
function frUnread(){
  if (!sNet()) return 0;
  const t = frSeenAt();
  // 明信片、過夜的日記在信箱也看得到（同一份資料）：在那邊看過的，這裡就不再算
  const seen = e => { try {
    if (e.k === 'cardIn' && e.c){ const c = ((S.mail && S.mail.pc) || []).find(x => x && x.id === e.c); return !!(c && c.r); }
    if (e.k === 'stayBack' && e.d){ const o = frLetter('trip', e.d, e.u); return !!(o && o.r); }
  } catch (err) {} return false; };
  return frMemo().filter(e => FR_IN.includes(e.k) && e.k !== 'giftIn' && (e.ts || 0) > t && !seen(e)).length + (typeof ngWaiting === 'function' ? ngWaiting() : 0);
}
function frBadge(){
  const b = $('#palBtn'); if (!b) return;
  const n = frUnread(), bd = b.querySelector('.bd');
  bd.textContent = n; bd.hidden = !n;
  b.classList.toggle('wig', !!n && !REDUCE);
  b.setAttribute('aria-label', n ? `朋友，${n} 件沒看` : '朋友');
}
// 信箱裡朋友的東西（從朋友家來的娃娃的信、過夜的日記）：找最新的那一封。w：朋友的名字（同一隻去過好幾個朋友家時分得開）
function frLetter(type, d, w){
  const l = (S.mail && S.mail.l) || [];
  const find = byW => l.find(o => { try { const p = mailParse(o.k); return p.type === type && p.d === d && (!byW || (p.p.w || '') === byW); } catch (e) { return false; } }) || null;
  return (w && typeof ngName === 'function' && find(ngName(w))) || find('');
}
function frLetterOpen(o){
  if (!o) return;
  o.r = 1; save();
  const x = mailText(o.k);
  openSheet(`<div class="hd"><img class="st-hdimg" src="${SPR[x.d] || SPR.sloth}" alt=""><span>${x.title}</span></div>
    <div class="ml open fr-letter"><div class="ml-bd">${mailBodyHTML(x)}</div></div>
    <div class="ml-ft"><button class="btn" data-fr="back">回朋友</button></div>`);
  evOpen = false; alOpen = false;
}

async function frOpen(tab){
  if (VISIT) return;
  if (tab) frTab = tab;
  frNewSince = frSeenAt();
  // 先翻到有新東西的那個朋友（不然朋友多的時候，新來的紙條、日記在別頁，看起來像沒有）
  const fresh = frMemo().filter(e => FR_IN.includes(e.k) && (e.ts || 0) > frNewSince).sort((a, b) => b.ts - a.ts)[0];
  if (fresh) { frWho = fresh.u; frTab = 'in'; }
  frPaint();
  const net = sNet(); if (!net) return;
  S.album.frSeen = Date.now(); save(); frBadge();
  try { frList = await net.friends(); } catch (e) { frList = frList || []; }
  if ($('#sheet .fr-box')) frPaint();
  // 把雲端上還沒領的讀回來（各自的檔案會抄進存檔、記進紀念冊），讀完再畫一次
  const jobs = [];
  if (typeof ngRefresh === 'function') jobs.push(ngRefresh(false));
  if (typeof cardRefresh === 'function') jobs.push(cardRefresh(false));
  if (net.book) jobs.push(net.book(net.me.uid).catch(e => sQuiet('fr', e)));
  if (net.heartsToday) jobs.push(net.heartsToday().then(n => { frHearts = n | 0; }).catch(e => sQuiet('fr', e)));
  await Promise.all(jobs.map(j => Promise.resolve(j).catch(() => {})));
  if ($('#sheet .fr-box')){ frPaint(); S.album.frSeen = Date.now(); save(); frBadge(); }
}
function frPaint(){
  const net = sNet();
  const head = `<div class="hd">${FR_ICON}<span>朋友</span></div>`;
  if (!net){
    openSheet(`${head}<div class="fr-box"><p class="al-em">登入之後才能加朋友、去朋友家。帳號在封面左上角。</p></div>
      <div class="ml-ft"><button class="btn y" data-fr="acct">去登入</button></div>`);
    evOpen = false; alOpen = false; return;
  }
  if (!frList){ openSheet(`${head}<div class="fr-box"><p class="al-em">找朋友中……</p></div>`); evOpen = false; alOpen = false; return; }
  if (!frList.length){
    openSheet(`${head}<div class="fr-box"><p class="al-em">還沒有朋友。到帳號那裡，把你的好友碼給朋友，或輸入他的好友碼，加了之後他就會出現在這裡。</p></div>
      <div class="ml-ft"><button class="btn y" data-fr="acct">開帳號</button></div>`);
    evOpen = false; alOpen = false; return;
  }
  if (!frList.some(f => f.uid === frWho)) frWho = frList[0].uid;
  const f = frList.find(p => p.uid === frWho), nm = sText(f.name, 12) || '朋友';
  const dot = e => ((e.ts || 0) > frNewSince ? '<i class="fr-new" aria-label="新的"></i>' : '');
  const memo = frMemo().filter(e => e.u === f.uid);
  let rows = '';
  if (frTab === 'in'){
    // 還在門口等的娃娃排最上面
    rows += (typeof ngIn !== 'undefined' ? ngIn : []).filter(g => g.from === f.uid).map(g =>
      `<div class="fr-it wait"><span class="ic"><img src="${SPR[g.doll]}" alt=""></span><p>${txSlot(nm)}送來的${DOLL_NAME[g.doll]}在門口等<i class="fr-new"></i></p><button class="btn y sm" data-frclaim="${g.id}">讓牠進來</button></div>`).join('');
    if (frHearts) rows += `<div class="fr-it"><small>今天</small><span class="ic">${HEART()}</span><p>收到 ${frHearts} 顆愛心</p></div>`;
    rows += memo.filter(e => FR_IN.includes(e.k)).map(e => {
      const card = e.k === 'cardIn' && e.c && (S.mail.pc || []).some(c => c.id === e.c);
      const letter = (e.k === 'stayBack' && frLetter('trip', e.d, e.n)) || (e.k === 'giftIn' && frLetter('gift', e.d, e.n));
      const tap = card ? `data-frcard="${e.c}"` : letter ? `data-frletter="${e.k === 'stayBack' ? 'trip' : 'gift'}.${e.d}" data-frw="${e.u}"` : e.k === 'bookIn' ? 'data-fr="book"' : '';
      // 過夜帶回來的紙條：直接寫在這一行（這一版以前記的沒有 m，從那封日記讀）
      let ee = e;
      if (e.k === 'stayBack' && !e.m && letter){ try { const x = mailParse(letter.k).p.x; if (x) ee = {...e, m: mailDec(x)}; } catch (er) {} }
      return `<div class="fr-it ${tap ? 'tap' : ''}" ${tap} ${tap ? 'role="button" tabindex="0"' : ''}><small>${md(e.t)}</small><span class="ic">${MEMO_ICON[e.k] || ''}</span><p>${memoText(ee)}${dot(e)}${card ? '<u>看明信片</u>' : letter ? '<u>打開看</u>' : ''}</p></div>`;
    }).join('');
    // 信箱裡還有、紀念冊卻沒記到的明信片（這一版之前收到的）：照寄的人的名字列在這裡
    const known = new Set(frMemo().filter(e => e.k === 'cardIn').map(e => e.c));
    rows += ((S.mail && S.mail.pc) || []).filter(c => !known.has(c.id) && (frList.length === 1 || c.w === nm)).map(c =>
      `<div class="fr-it tap" data-frcard="${c.id}" role="button" tabindex="0"><small>${md(c.t)}</small><span class="ic">${CARD_ICON}</span><p>收到${txSlot(c.w)}寄來的明信片${c.r ? '' : '<i class="fr-new"></i>'}<u>看明信片</u></p></div>`).join('');
    if (!rows) rows = `<p class="al-em">${txSlot(nm)}那邊還沒有東西來。他寄的明信片、送的娃娃、在你家訪客簿留的話，都會收在這裡。</p>`;
  } else {
    rows += (typeof ngOut !== 'undefined' ? ngOut : []).filter(g => g.to === f.uid).map(g =>
      `<div class="fr-it wait"><span class="ic"><img src="${SPR[g.doll]}" alt=""></span><p>${DOLL_NAME[g.doll]}在${txSlot(nm)}門口等，他還沒開門</p><button class="btn sm" data-frback="${g.id}">收回</button></div>`).join('');
    rows += memo.filter(e => FR_OUT.includes(e.k)).map(e => `<div class="fr-it"><small>${md(e.t)}</small><span class="ic">${MEMO_ICON[e.k] || ''}</span><p>${memoText(e)}</p></div>`).join('');
    if (!rows) rows = `<p class="al-em">還沒有寄東西給${txSlot(nm)}。</p>`;
  }
  const inNew = frMemo().filter(e => e.u === f.uid && FR_IN.includes(e.k) && e.k !== 'giftIn' && (e.ts || 0) > frNewSince).length;
  openSheet(`${head}<div class="fr-box">
      ${frList.length > 1 ? `<div class="ng-chips">${frList.map(p => `<button class="ng-chip ${p.uid === frWho ? 'on' : ''}" data-frwho="${p.uid}" aria-pressed="${p.uid === frWho}">${txSlot(sText(p.name, 12))}</button>`).join('')}</div>` : ''}
      <div class="fr-top"><span class="fr-av" aria-hidden="true">${txSlot([...nm][0] || '友')}</span><b>${txSlot(nm)}</b><button class="btn y" data-fr="visit">${typeof HOUSE !== 'undefined' ? HOUSE : ''}<span>去他家</span></button></div>
      ${f.hasMe === false ? '<small class="bk-note">他還沒把你加進好友。等他加你之後，才能寄明信片和在訪客簿寫字給他。</small>' : ''}
      <div class="fr-acts">
        <button class="fr-a" data-fr="card">${CARD_ICON}<span>寄明信片</span></button>
        <button class="fr-a" data-fr="gift">${MAIL_ICON}<span>送娃娃</span></button>
        <button class="fr-a" data-fr="stay">${STAY_MOON}<span>去過夜</span></button>
        <button class="fr-a" data-fr="book">${BOOK_ICON}<span>我的訪客簿</span></button>
      </div>
      <div class="fr-tabs" role="tablist"><button class="${frTab === 'in' ? 'on' : ''}" data-frtab="in" role="tab" aria-selected="${frTab === 'in'}">他那邊來的${inNew ? `<i>${inNew}</i>` : ''}</button><button class="${frTab === 'out' ? 'on' : ''}" data-frtab="out" role="tab" aria-selected="${frTab === 'out'}">寄出去的</button></div>
      <div class="fr-list">${rows}</div>
    </div>`);
  evOpen = false; alOpen = false;
}
$('#sheet').addEventListener('click', async e => {
  const back = e.target.closest('[data-fr="back"]'); if (back){ frOpen(); return; }
  if (!$('#sheet .fr-box') && !e.target.closest('[data-fr]')) return;
  const t = e.target.closest('[data-frtab]'); if (t){ frTab = t.dataset.frtab; frPaint(); return; }
  const w = e.target.closest('[data-frwho]'); if (w){ frWho = w.dataset.frwho; frPaint(); return; }
  const cl = e.target.closest('[data-frclaim]');
  if (cl && !frBusy){ frBusy = true; try { await ngClaim(cl.dataset.frclaim); } finally { frBusy = false; } frBadge(); if (typeof mailBadge === 'function') mailBadge(); frPaint(); return; }
  const bk = e.target.closest('[data-frback]');
  if (bk && !frBusy){ frBusy = true; try { await ngBack(bk.dataset.frback); } finally { frBusy = false; } frPaint(); return; }
  const c = e.target.closest('[data-frcard]');
  if (c){ const i = (S.mail.pc || []).findIndex(x => x.id === c.dataset.frcard); if (i >= 0) cardOpen(i); return; }
  const lt = e.target.closest('[data-frletter]');
  if (lt){ const [type, d] = lt.dataset.frletter.split('.'), f = (frList || []).find(p => p.uid === lt.dataset.frw); frLetterOpen(frLetter(type, d, f && f.name)); return; }
  const b = e.target.closest('[data-fr]'); if (!b) return;
  const a = b.dataset.fr, net = sNet(), f = (frList || []).find(p => p.uid === frWho);
  if (a === 'acct'){ $('#sheet').hidden = true; const cb = $('#coverAcct'); if (cb) cb.click(); return; }
  if (a === 'book'){ if (typeof bookOpen === 'function') bookOpen(); return; }
  if (!net || !f) return;
  if (a === 'visit'){ $('#sheet').hidden = true; if (net.visit) net.visit(f.uid); else { const cb = $('#coverAcct'); if (cb) cb.click(); } }
  else if (a === 'card'){
    if (f.hasMe === false){ toast('他還沒把你加進好友，先不能寄'); return; }
    // 明信片上是現在這間房間的樣子：拍下來，收件人先選好
    cardCompose(cardSnap()); if (typeof cardDraft !== 'undefined' && cardDraft){ cardDraft.to = f.uid; cardDraft.friends = frList; cardPaint(); }
  }
  else if (a === 'gift'){ ngPick = {doll: null, to: f.uid, m: null, msg: ''}; ngOpenPick(); }
  else if (a === 'stay'){ stPick = {uid: f.uid, name: f.name, d: null}; stayPickPaint(); }
});

/* ---------- 上面的朋友鈕（hud.js 會把它排進第二排右邊那一組） ---------- */
(function(){
  if ($('#palBtn')) return;
  const b = document.createElement('button');
  b.className = 'cam palb'; b.id = 'palBtn'; b.setAttribute('aria-label', '朋友');
  b.innerHTML = FR_ICON + '<span class="bd" hidden></span>';
  b.addEventListener('click', () => { if (!$('#sheet').hidden && $('#sheet .fr-box')){ $('#sheet').hidden = true; return; } frOpen(); });
  (document.querySelector('.topr') || screen).appendChild(b);
})();
addEventListener('nestnet', () => { setTimeout(frBadge, 2500); setTimeout(frBadge, 9000); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(frBadge, 1500); });
setInterval(() => { if (!document.hidden) frBadge(); }, 20000);
frBadge();
