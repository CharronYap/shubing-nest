/* 朋友聊天（2026-11-27，分支 wip/chat）
   朋友面板上面「聊天」那顆鈕打開：跟一位朋友來回傳字（80 字以內）或貼圖（js/stickers.js 那 32 張）。
   - 雲端：nestChats/{兩個帳號排序後用 _ 接起來} = {u, t, f, sa, sb, x}，底下 msgs/{自動編號} = {from, t, m 或 s}（firestore.rules）。
     時間都是伺服器時間；sa、sb 是兩個人各自看到哪裡；x 是最後一次收回的時間。
   - 沒有即時連線（firestore-lite 沒有 onSnapshot）：聊天頁開著時每 4 秒讀一次那一筆 nestChats（1 次讀取），
     t 比手上最新的那則新才去讀新訊息；x 變了（有人收回）就重讀最近 50 則。
   - 沒看的數量：房間裡每 5 分鐘、登入時、切回分頁時讀一次自己的 nestChats 清單，算朋友送來、比自己看到的還新的有幾則，
     併進上面朋友鈕的數字（js/friend.js 的 frUnread），朋友面板的「聊天」鈕和朋友名字旁邊也會標。
   - 字用 textContent 放進畫面；換行會被 sText 換成空白。只能收回自己送的。
   - 存檔不用改：聊天紀錄只在雲端。
   要放在 letter.js 後面、keep.js 前面載入。 */
const CH_LEN = 80, CH_PAGE = 50, CH_POLL = 4000, CH_IDLE = 5 * 60000, CH_COUNT = 20;
const CHAT_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.200c-5.100 0-9.200 3.400-9.200 7.700 0 2.300 1.200 4.400 3.100 5.800l-.700 3.300c-.100.500.400.900.900.600l3.700-2c.700.100 1.400.200 2.200.200 5.100 0 9.200-3.400 9.200-7.900S17.100 3.200 12 3.200z"/></svg>';
let chCur = null, chBusy = false, chFriends = null, chChecking = false;
const chUnread = {};   // 帳號 → 沒看的幾則
const chCache = {};    // 帳號 → {t, seen, n}：那一筆 nestChats 沒變就不用再數

const chMe = () => { const n = sNet(); return n && n.me ? n.me.uid : ''; };
const chHM = t => { const d = new Date(t); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
const chDay = t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function chDayLabel(t){
  const d = new Date(t), now = new Date();
  if (chDay(t) === chDay(now.getTime())) return '今天';
  if (chDay(t) === chDay(now.getTime() - 864e5)) return '昨天';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function chatUnreadAll(){ return Object.values(chUnread).reduce((a, n) => a + (n | 0), 0); }
function chatUnreadOf(uid){ return chUnread[uid] | 0; }

/* ---------- 聊天頁 ---------- */
function chatOpen(f, back){
  const net = sNet();
  if (VISIT || !f || !f.uid) return;
  if (!net || !net.chatRecent){ toast('登入之後才能聊天'); return; }
  const nm = sText(f.name, 12) || '朋友';
  chCur = {uid: f.uid, name: nm, hasMe: f.hasMe, back: typeof back === 'function' ? back : () => { $('#sheet').hidden = true; },
    list: [], ids: new Set(), cur: null, lastT: 0, lastTs: null, x: 0, timer: 0, older: false, polling: false, seen: 0};
  openSheet(`<div class="hd">${CHAT_ICON}<span>和${txSlot(nm)}聊天</span></div>
    <div class="ch-box">
      ${f.hasMe === false ? `<small class="bk-note">${txSlot(nm)}還沒加你當朋友，訊息傳不過去。</small>` : ''}
      <div class="ch-log" id="chLog" role="log" aria-live="polite" aria-label="和${nm.replace(/[<>&"]/g, '')}的聊天紀錄"><p class="al-em ch-em">讀取中……</p></div>
      <div class="bk-st ch-stk" id="chStk" hidden>${STK.map(s => `<button class="stk-b" data-chs="${s.id}" aria-label="${stkName(s.id)}">${stkHTML(s.id)}</button>`).join('')}</div>
      <div class="ch-bar">
        <button class="ch-k" data-ch="stk" aria-label="貼圖" aria-expanded="false" aria-controls="chStk">${typeof STK_HT === 'function' ? `<svg viewBox="0 0 24 24" aria-hidden="true">${STK_HT(12, 12.5, .9, 'currentColor')}</svg>` : '貼'}</button>
        <input class="tx-in ch-in" id="chTx" maxlength="${CH_LEN}" enterkeyhint="send" autocomplete="off" aria-label="訊息，${CH_LEN} 字以內">
        <button class="btn y ch-go" data-ch="send" disabled>傳送</button>
      </div>
    </div>
    <div class="ml-ft"><button class="btn" data-ch="back">返回</button></div>`);
  evOpen = false; alOpen = false;
  const tx = $('#chTx'); if (tx) tx.placeholder = `跟${nm}說……`;
  const log = $('#chLog'); if (log) log.addEventListener('scroll', chScroll, {passive: true});
  chLoad(true);
  chCur.timer = setInterval(chPoll, CH_POLL);
}
const chAlive = c => c && chCur === c && !$('#sheet').hidden && !!$('#sheet .ch-box');
function chStop(){ if (chCur && chCur.timer) clearInterval(chCur.timer); chCur = null; }

// 讀最近 50 則（打開時、有人收回時）
async function chLoad(first){
  const c = chCur, net = sNet(); if (!c || !net) return;
  let r, meta;
  try { [r, meta] = await Promise.all([net.chatRecent(c.uid, CH_PAGE), net.chatMeta(c.uid)]); }
  catch (e) {
    sQuiet('chat', e);
    if (!chAlive(c)) return;
    if (first){ const log = $('#chLog'); if (log) log.innerHTML = `<p class="al-em ch-em">${e && e.code === 'permission-denied' ? '聊天還沒開好，晚點再試。' : '連不上雲端，晚點再試。'}</p>`; }
    return;
  }
  if (!chAlive(c)) return;
  c.list = r.list.filter(chOk); c.ids = new Set(c.list.map(m => m.id)); c.cur = r.cur;
  c.x = meta ? meta.x : 0; c.seen = meta ? meta.seen : 0;
  chTail(c);
  chPaint('bottom');
  chMarkSeen(c);
}
const chOk = m => m && typeof m.id === 'string' && typeof m.from === 'string' && (typeof m.m === 'string' || typeof m.s === 'string');
function chTail(c){
  const last = c.list[c.list.length - 1];
  if (last && last.t >= c.lastT){ c.lastT = last.t; c.lastTs = last.ts; }
}
// 對方送來、比自己記的「看到哪裡」還新：記成看過了
function chMarkSeen(c){
  const net = sNet(); if (!net || document.hidden) return;
  const theirs = c.list.filter(m => m.from === c.uid);
  const last = theirs[theirs.length - 1];
  chUnread[c.uid] = 0; delete chCache[c.uid];
  if (typeof frBadge === 'function') frBadge();
  if (!last || last.t <= c.seen) return;
  c.seen = last.t;
  net.chatSeen(c.uid).catch(e => sQuiet('chat', e));
}
async function chPoll(){
  const c = chCur;
  if (!chAlive(c)){ if (c && chCur === c) chStop(); return; }
  if (document.hidden || c.polling) return;
  const net = sNet(); if (!net){ chStop(); return; }
  c.polling = true;
  try {
    const meta = await net.chatMeta(c.uid);
    if (!chAlive(c) || !meta) return;
    if (meta.x && meta.x !== c.x){ await chLoad(false); return; }
    if (meta.t > c.lastT) await chNew(c);
  } catch (e) { sQuiet('chat', e); }
  finally { c.polling = false; }
}
// 讀比手上最新的那則還新的
async function chNew(c){
  const net = sNet(); if (!net) return;
  if (!c.lastTs){ await chLoad(false); return; }
  const l = (await net.chatSince(c.uid, c.lastTs, CH_PAGE)).filter(m => chOk(m) && !c.ids.has(m.id));
  if (!chAlive(c) || !l.length) return;
  l.forEach(m => { c.list.push(m); c.ids.add(m.id); });
  chTail(c);
  chAppend(l);
  chMarkSeen(c);
}
// 往上捲到頂：讀更早的 50 則
async function chScroll(){
  const c = chCur, log = $('#chLog');
  if (!c || !log || log.scrollTop > 40 || !c.cur || c.older) return;
  const net = sNet(); if (!net) return;
  c.older = true;
  try {
    const r = await net.chatOlder(c.uid, c.cur, CH_PAGE);
    if (!chAlive(c)) return;
    const l = r.list.filter(m => chOk(m) && !c.ids.has(m.id));
    l.forEach(m => c.ids.add(m.id));
    c.list = l.concat(c.list); c.cur = r.cur;
    chPaint('keep');
  } catch (e) { sQuiet('chat', e); }
  finally { c.older = false; }
}

/* ---------- 畫 ---------- */
function chNode(m){
  const me = m.from === chMe();
  const el = document.createElement('div');
  el.className = 'ch-m ' + (me ? 'me' : 'them');
  el.dataset.id = m.id;
  const b = document.createElement('div');
  if (typeof m.s === 'string'){
    b.className = 'ch-s';
    const h = stkHTML(m.s);
    if (h){ b.innerHTML = h; b.setAttribute('role', 'img'); b.setAttribute('aria-label', '貼圖：' + (stkName(m.s) || '貼圖')); }
    else { b.className = 'ch-b ch-unk'; b.textContent = '（一張新的貼圖，更新小窩之後就看得到）'; }
  } else {
    b.className = 'ch-b';
    b.textContent = sText(m.m, CH_LEN);
  }
  el.appendChild(b);
  const t = document.createElement('small');
  t.className = 'ch-t'; t.textContent = m.t ? chHM(m.t) : '';
  el.appendChild(t);
  if (me){ el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', (typeof m.s === 'string' ? '你傳的貼圖' : '你說：' + sText(m.m, CH_LEN)) + '，點一下可以收回'); }
  return el;
}
function chSep(t){
  const s = document.createElement('p');
  s.className = 'ch-day'; s.textContent = chDayLabel(t);
  return s;
}
// mode：bottom 捲到最下面；keep 往上讀了更早的，畫面停在原本那一則
function chPaint(mode){
  const c = chCur, log = $('#chLog'); if (!c || !log) return;
  const fromBottom = log.scrollHeight - log.scrollTop;
  log.textContent = '';
  if (!c.list.length){
    const p = document.createElement('p');
    p.className = 'al-em ch-em'; p.textContent = `還沒聊過。跟${c.name}打聲招呼吧。`;
    log.appendChild(p); return;
  }
  const fr = document.createDocumentFragment();
  if (c.cur){ const p = document.createElement('p'); p.className = 'ch-more'; p.textContent = '往上捲，看更早的'; fr.appendChild(p); }
  let day = '';
  c.list.forEach(m => {
    if (m.t && chDay(m.t) !== day){ day = chDay(m.t); fr.appendChild(chSep(m.t)); }
    fr.appendChild(chNode(m));
  });
  log.appendChild(fr);
  log.scrollTop = mode === 'keep' ? log.scrollHeight - fromBottom : log.scrollHeight;
}
function chAppend(l){
  const c = chCur, log = $('#chLog'); if (!c || !log) return;
  const em = log.querySelector('.ch-em'); if (em) em.remove();
  const near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  const prev = c.list[c.list.length - l.length - 1];
  let day = prev && prev.t ? chDay(prev.t) : '';
  l.forEach(m => {
    if (m.t && chDay(m.t) !== day){ day = chDay(m.t); log.appendChild(chSep(m.t)); }
    log.appendChild(chNode(m));
  });
  // 自己剛傳的一定捲下去；對方的，原本就在最下面才捲（往上翻舊的時候不打斷）
  if (near || l.some(m => m.from === chMe())) log.scrollTop = log.scrollHeight;
}

/* ---------- 傳 ---------- */
function chCount(){
  const tx = $('#chTx'), b = $('#sheet [data-ch="send"]'); if (!tx || !b) return;
  if (!chBusy) b.disabled = !sText(tx.value, CH_LEN);
}
async function chSend(o){
  const c = chCur, net = sNet(); if (!c || chBusy) return;
  if (!net || !net.chatSend){ toast('登入之後才能聊天'); return; }
  if (c.hasMe === false){ toast(`${c.name}還沒加你當朋友，訊息傳不過去。`); return; }
  const tx = $('#chTx'), b = $('#sheet [data-ch="send"]');
  chBusy = true; if (b) b.disabled = true;
  try {
    await net.chatSend(c.uid, o);
    if (o.m && tx) tx.value = '';
    chBusy = false; chCount();
    if (chAlive(c)) await chNew(c);
    if (tx && chAlive(c) && o.m) tx.focus();
  } catch (e) {
    sQuiet('chat', e);
    chBusy = false; chCount();
    // 打的字留著，可以再按一次
    toast(e && e.code === 'permission-denied' && c.hasMe !== true ? `${c.name}還沒加你當朋友，訊息傳不過去。` : sErr(e));
  }
}
async function chDel(id){
  const c = chCur, net = sNet(); if (!c || !net || chBusy) return;
  chBusy = true;
  try {
    await net.chatDel(c.uid, id);
    c.list = c.list.filter(m => m.id !== id); c.ids.delete(id);
    const meta = await net.chatMeta(c.uid).catch(() => null);
    if (meta) c.x = meta.x;
    if (chAlive(c)) chPaint('keep');
    toast('收回了');
  } catch (e) { sQuiet('chat', e); toast(sErr(e)); }
  finally { chBusy = false; chCount(); }
}
function chToggleDel(el){
  const had = el.querySelector('.ch-del');
  document.querySelectorAll('#chLog .ch-del').forEach(x => x.remove());
  if (had) return;
  const b = document.createElement('button');
  b.className = 'btn sm ch-del'; b.dataset.chdel = el.dataset.id; b.textContent = '收回';
  el.appendChild(b);
}
document.addEventListener('input', e => { if (e.target && e.target.id === 'chTx') chCount(); });
document.addEventListener('keydown', e => {
  if (!e.target) return;
  if (e.target.id === 'chTx' && e.key === 'Enter' && !e.isComposing && e.keyCode !== 229){
    e.preventDefault();
    const m = sText(e.target.value, CH_LEN); if (m) chSend({m});
  } else if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('ch-m') && e.target.classList.contains('me')){
    e.preventDefault(); chToggleDel(e.target);
  }
});
$('#sheet').addEventListener('click', e => {
  if (!chCur || !$('#sheet .ch-box')) return;
  const d = e.target.closest('[data-chdel]'); if (d){ chDel(d.dataset.chdel); return; }
  const s = e.target.closest('[data-chs]');
  if (s){ const g = $('#chStk'); if (g) g.hidden = true; const k = $('#sheet [data-ch="stk"]'); if (k) k.setAttribute('aria-expanded', 'false'); chSend({s: s.dataset.chs}); return; }
  const me = e.target.closest('.ch-m.me'); if (me){ chToggleDel(me); return; }
  const b = e.target.closest('[data-ch]'); if (!b) return;
  const a = b.dataset.ch;
  if (a === 'back'){ const back = chCur.back; chStop(); back(); }
  else if (a === 'send'){ const tx = $('#chTx'), m = sText(tx && tx.value, CH_LEN); if (m) chSend({m}); }
  else if (a === 'stk'){ const g = $('#chStk'); if (!g) return; g.hidden = !g.hidden; b.setAttribute('aria-expanded', String(!g.hidden)); }
});

/* ---------- 沒看的數量 ---------- */
async function chatCheck(){
  const net = sNet(); if (!net || VISIT || !net.chatMetas || chChecking) return;
  chChecking = true;
  try {
    const me = net.me.uid;
    let F = (typeof frList !== 'undefined' && frList) || chFriends;
    if (!F){ F = chFriends = await net.friends(); }
    const ok = new Set((F || []).map(f => f.uid));
    const metas = await net.chatMetas();
    const now = {};
    for (const x of metas){
      if (!x || !ok.has(x.other)) continue;
      if (chCur && chCur.uid === x.other){ now[x.other] = 0; continue; }
      if (!x.t || x.f === me || x.t <= x.seen){ now[x.other] = 0; continue; }
      const k = chCache[x.other];
      if (k && k.t === x.t && k.seen === x.seen){ now[x.other] = k.n; continue; }
      const l = x.seenTs ? await net.chatSince(x.other, x.seenTs, CH_COUNT) : (await net.chatRecent(x.other, CH_COUNT)).list;
      const n = l.filter(m => m && m.from === x.other).length;
      chCache[x.other] = {t: x.t, seen: x.seen, n};
      now[x.other] = n;
    }
    let changed = false;
    Object.keys(chUnread).forEach(u => { if (!(u in now)){ delete chUnread[u]; changed = true; } });
    Object.entries(now).forEach(([u, n]) => { if ((chUnread[u] | 0) !== n){ chUnread[u] = n; changed = true; } });
    if (changed){
      if (typeof frBadge === 'function') frBadge();
      if (!$('#sheet').hidden && $('#sheet .fr-box') && typeof frPaint === 'function') frPaint();
    }
  } catch (e) { sQuiet('chat', e); }
  finally { chChecking = false; }
}
addEventListener('nestnet', () => {
  chFriends = null; chStop();
  Object.keys(chUnread).forEach(k => delete chUnread[k]);
  Object.keys(chCache).forEach(k => delete chCache[k]);
  setTimeout(chatCheck, 3000);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  setTimeout(chatCheck, 1200);
  if (chCur) chPoll();
});
setInterval(() => { if (!document.hidden) chatCheck(); }, CH_IDLE);
