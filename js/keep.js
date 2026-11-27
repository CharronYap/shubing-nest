/* 全部都留（2026-11-27，使用者要的）：紀念冊、朋友寄來的明信片、信箱的信，不再因為放不下就丟掉。
   整份存檔是一份文件（nestSaves/{uid}，上限 1 MiB、每次存檔整份上傳），不能無限放，所以：
   - 主存檔只留最近的：紀念冊 KEEP_MEMO 筆、朋友的明信片 CARD_KEEP 張（而且不超過 CARD_BYTES）、信箱每一類 MAIL_CAT_MAX 封（小窩更新不搬）。
   - 較舊的搬到存檔底下的子集合（規則見 firestore.rules 最下面「全部都留」那一段）：
       nestSaves/{uid}/memo/{月份} = {l:[紀念冊紀錄], t}      nestSaves/{uid}/mail/{月份} = {l:[信], t}
       nestSaves/{uid}/cards/{明信片編號} = 一張明信片
     月份 = yyyy-mm；同一個月放不下（筆數到上限或超過 KEEP_BYTES）就接 -2 ～ -9。
   - 沒登入：放這台裝置另一個 localStorage 鍵（KEEP_KEY，格式一樣的一包）。之後登入、而且訪客進度帶進帳號時（js/account.js 叫 keepAdopt），
     那一包改掛到那個帳號名下，再搬上雲端，搬成功才清。

   不能掉資料：
   - 先寫到雲端（或本機那一包）成功、而且從雲端讀回來確認每一筆都在，才從主存檔拿掉。寫失敗（斷線、規則還沒發布、被擋、本機空間滿）一律留在主存檔，安靜地下次再試，不跳錯誤。
   - 雲端那一份用 transaction「讀出來、用 id 合併、寫回去」，不直接蓋。中途關掉最壞是兩邊都有同一筆：畫的時候用 id 去重，下次合併還是同一筆。
   - 兩台裝置：另一台合併存檔後可能把搬走的又帶回來，那一台超過時自己會再搬一次（合併後還是同一筆）。
   - 原本會直接刪的三個地方（js/mail.js mailTrim、js/card.js cardTrim、js/memo.js 的上限、js/account.js 合併時的 slice）有這個檔時都不刪，改叫 keepLater()。

   讀取量：打開遊戲不讀任何一份。搬的時候一個月份 2 讀 1 寫（合併前讀一次、寫完讀回來確認一次）、一張明信片 1 寫 1 讀；一次開啟最多動 KEEP_DOCS 份文件，剩下的下次再搬，過程不擋畫面。
   按「看更早的」或點到舊的那一筆才讀，讀過的留在記憶體（換帳號會重新整理頁面，記憶體裡不會留上一個帳號的）。

   存檔裡多的小東西（都在現有欄位裡，不動最上層）：
     album.memoM = [有舊紀念冊的月份文件]   mail.lm = [有舊信的月份文件]
     mail.pcA = 1（有明信片搬出去過）       mail.pcx = [丟掉了、雲端那一份還沒刪成功的明信片編號]
   要放在 js/memo.js、js/mail.js、js/card.js、js/friend.js 後面載入。 */
const KEEP_MEMO = 200, KEEP_DOCS = 10, KEEP_WAIT = 8000, KEEP_BYTES = 600000, KEEP_RETRY = 30 * 60000;
const KEEP_MAX = {memo: 1000, mail: 500};
const KEEP_KEY = 'shubingNest.keep.v1';
const KEEP_CACHE = {memo: {}, mail: {}};   // 讀過的月份：{月份文件: [那一份的內容]}
const KEEP_SKIP = {};                      // 寫失敗的文件：{種類:文件: 什麼時候}，隔 KEEP_RETRY 才再試
let keepBusy = false, keepT = 0, keepLeft = KEEP_DOCS, keepOff = 0, keepFails = 0, keepWarned = false;
const keepKey = u => (u ? KEEP_KEY + '.u.' + u : KEEP_KEY);
const keepUid = () => { const n = sNet(); return n && n.me ? n.me.uid : ''; };
const keepClone = x => JSON.parse(JSON.stringify(x));
const keepMailKey = o => (typeof mailSameKey === 'function' ? mailSameKey(o) : o.t + '|' + o.k);
const keepKeyOf = {memo: e => e.id, mail: keepMailKey};

/* ---------- 這台裝置的那一包（沒登入時用；登入後還沒搬上去的也在這裡） ---------- */
function keepBag(u){
  try { const o = JSON.parse(localStorage.getItem(keepKey(u)) || 'null'); if (o && typeof o === 'object') return {memo: o.memo || {}, mail: o.mail || {}, cards: o.cards || {}}; } catch (e) {}
  return {memo: {}, mail: {}, cards: {}};
}
// 寫回去。回 false = 寫不進去（空間滿了），呼叫的人要把東西留在主存檔
function keepBagPut(u, b){
  try {
    if (!Object.keys(b.memo).length && !Object.keys(b.mail).length && !Object.keys(b.cards).length) localStorage.removeItem(keepKey(u));
    else localStorage.setItem(keepKey(u), JSON.stringify(b));
    return true;
  } catch (e) { return false; }
}
// 訪客的進度帶進帳號時（js/account.js）：訪客那一包改掛到這個帳號名下，之後由這個帳號搬上雲端。跳過、不帶進去的話不會叫這裡
function keepAdopt(u){
  if (!u) return;
  try {
    const g = keepBag(''), a = keepBag(u);
    ['memo', 'mail'].forEach(k => Object.keys(g[k]).forEach(m => { const seen = new Set((a[k][m] || []).map(keepKeyOf[k])); a[k][m] = [...(a[k][m] || []), ...g[k][m].filter(r => !seen.has(keepKeyOf[k](r)))]; }));
    Object.keys(g.cards).forEach(id => { if (!a.cards[id]) a.cards[id] = g.cards[id]; });
    if (keepBagPut(u, a)) localStorage.removeItem(keepKey(''));
  } catch (e) { sQuiet('keep', e); }
}

/* ---------- 哪一筆放哪個月份 ---------- */
// 規則只收 2026 年到現在這一年、01～12 月：日期早於 2026 的（裝置時間錯）放進 2026-11，日期在未來的放進現在這個月
function keepMonth(t){
  const now = new Date(), cur = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const m = /^(\d{4})-(\d{2})/.exec(t || ''); if (!m || +m[2] < 1 || +m[2] > 12) return cur;
  const ym = m[1] + '-' + m[2];
  return ym < '2026-01' ? '2026-11' : ym > cur ? cur : ym;
}
const keepList = (kind, make) => { if (kind === 'memo'){ const a = S.album; if (!Array.isArray(a.memoM) && make) a.memoM = []; return a.memoM || []; } const m = S.mail || {}; if (!Array.isArray(m.lm) && make && S.mail) m.lm = []; return m.lm || []; };
// 有舊資料的月份文件，新的在前（2026-11-2 排在 2026-11 後面，也就是比較舊的那一邊）
const keepMonths = kind => [...new Set(keepList(kind))].filter(x => typeof x === 'string').sort((a, b) => (a.slice(0, 7) === b.slice(0, 7) ? a.localeCompare(b) : a < b ? 1 : -1));

/* ---------- 現在主存檔裡哪些要搬 ---------- */
function keepPlan(){
  const out = {memo: {}, mail: {}, cards: []}, put = (g, t, r) => { const k = keepMonth(t); (g[k] = g[k] || []).push(r); };
  const L = (S.album && S.album.memo) || [];
  if (L.length > KEEP_MEMO) L.slice(KEEP_MEMO).forEach(e => { if (e && typeof e.id === 'string') put(out.memo, e.t, e); });
  const m = S.mail;
  if (m && Array.isArray(m.l) && typeof mailCatOf === 'function'){
    // 跟原本的 mailTrim 同一個挑法：每一類超過上限時，從最舊的「看過、附件也領了」的開始；沒看的不動
    const n = {};
    m.l.forEach(o => { const c = mailCatOf(o); n[c] = (n[c] || 0) + 1; });
    for (let x = m.l.length - 1; x >= 0; x--){
      const o = m.l[x], c = mailCatOf(o);
      if (o && typeof o.k === 'string' && MAIL_CAT_MAX[c] && n[c] > MAIL_CAT_MAX[c] && o.r && (!o.a || o.g)){ put(out.mail, o.t, o); n[c]--; }
    }
  }
  if (m && Array.isArray(m.pc) && typeof cardBytes === 'function'){
    const gone = new Set(m.pcx || []);
    let n = m.pc.length, bytes = n > 8 ? cardBytes(m.pc) : 0;   // 少於 9 張不可能超過（一張最多二十幾 KB），不用每次存檔都算
    for (let x = m.pc.length - 1; x >= 0 && (n > CARD_KEEP || bytes > CARD_BYTES); x--){
      const c = m.pc[x];
      if (!c || !c.r || typeof c.id !== 'string' || gone.has(c.id)) continue;
      out.cards.push(c); n--; bytes -= cardBytes([c]);
    }
  }
  return out;
}
const keepNeed = () => { const p = keepPlan(), m = S.mail || {}, u = keepUid(), b = u ? keepBag(u) : null; return !!(Object.keys(p.memo).length || Object.keys(p.mail).length || p.cards.length || (u && ((m.pcx || []).length || Object.keys(b.memo).length || Object.keys(b.mail).length || Object.keys(b.cards).length))); };
// 等一下搬（存檔後、收到新東西後叫）。連續叫只排一次
function keepLater(ms){
  if (keepT || typeof VISIT === 'undefined') return;
  keepT = setTimeout(() => { keepT = 0; keepFlush().catch(e => sQuiet('keep', e)); }, ms || KEEP_WAIT);
}

/* ---------- 搬 ---------- */
// 一筆寫失敗：安靜記下來，隔一陣子再試。一輪裡連續失敗好幾次（斷線、規則還沒發布）就整個先停一陣子
function keepFail(key, e){ KEEP_SKIP[key] = Date.now(); keepFails++; if (keepFails >= 3) keepOff = Date.now() + KEEP_RETRY; sQuiet('keep', e); }
// 寫到雲端的一個月份（放不下就試 -2 ～ -9）。回實際寫進去的文件名字；'' = 這次沒寫成
async function keepPut(net, kind, ym, rows){
  for (const sfx of ['', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9']){
    const mid = ym + sfx, key = kind + ':' + mid;
    if (keepLeft <= 0 || Date.now() < keepOff || (KEEP_SKIP[key] && Date.now() - KEEP_SKIP[key] < KEEP_RETRY)) return '';
    keepLeft--;
    try {
      const r = await net.keepMerge(kind, mid, rows, keepKeyOf[kind], KEEP_MAX[kind], KEEP_BYTES);
      if (r && r.ok){
        // 寫完再從雲端讀回來，這次要拿掉的每一筆都真的在裡面，才算數（就算我們對雲端的理解有錯，也只會搬不動，不會掉資料）
        const back = await net.keepGet(kind, mid), have = new Set((Array.isArray(back) ? back : []).map(keepKeyOf[kind]));
        if (!rows.every(x => have.has(keepKeyOf[kind](x)))){ keepFail(key, new Error('讀回來對不上，這一份先不算')); return ''; }
        keepFails = 0; delete KEEP_CACHE[kind][mid]; return mid;
      }
    } catch (e) { keepFail(key, e); return ''; }
  }
  return '';
}
// 寫到這台裝置的那一包。回 false = 寫不進去
function keepLocalPut(u, kind, ym, rows){
  const b = keepBag(u), seen = new Set((b[kind][ym] || []).map(keepKeyOf[kind]));
  b[kind][ym] = [...(b[kind][ym] || []), ...rows.filter(r => !seen.has(keepKeyOf[kind](r)))];
  return keepBagPut(u, b);
}
function keepFull(){
  if (keepWarned) return; keepWarned = true;
  toast('這台裝置的空間快滿了，較舊的紀錄先留在存檔裡。登入帳號之後會搬到雲端。');
}
// 寫成功了：從主存檔拿掉那幾筆、記下那個月份
function keepDrop(kind, rows, mid){
  const keys = new Set(rows.map(keepKeyOf[kind]));
  if (kind === 'memo') S.album.memo = (S.album.memo || []).filter(e => !keys.has(e.id));
  else {
    S.mail.l = S.mail.l.filter(o => !keys.has(keepMailKey(o)));
    if (typeof mlOpenIx !== 'undefined') mlOpenIx = -1;   // 信箱開著的話，第幾封會變：收起來重畫
  }
  const l = keepList(kind, true); if (!l.includes(mid)) l.push(mid);
}
async function keepMove(kind, groups, net, u){
  for (const ym of Object.keys(groups).sort()){
    const rows = keepClone(groups[ym]);
    let mid = '';
    if (net) mid = await keepPut(net, kind, ym, rows);
    else if (keepLocalPut(u, kind, ym, rows)) mid = ym; else { keepFull(); return; }
    if (!mid) continue;
    keepDrop(kind, rows, mid); save();
  }
}
// 寫一張明信片到雲端，再讀回來確認真的在、編號對得上。不對就丟例外（呼叫的人當成失敗，資料留在原地）
async function keepCardSend(net, c){
  const o = keepCard(c);
  await net.keepCardPut(o);
  const back = await net.keepCardGet(o.id);
  if (!back || back.id !== o.id || !back.snap) throw new Error('讀回來對不上，這一張先不算');
}
// 一張明信片在雲端的樣子（規則只收這幾欄）。收到的時間 h 先不帶：雲端規則加上 h 以前，帶了整張會被擋（2026-11-27）
const keepCard = c => { const o = {id: c.id, w: String(c.w || '朋友').slice(0, 24), t: /^\d{4}-\d{2}-\d{2}$/.test(c.t) ? c.t : todayStr(), msg: String(c.msg || '').slice(0, 80), snap: keepClone(c.snap), r: c.r ? 1 : 0}; if (typeof c.u === 'string' && c.u) o.u = c.u.slice(0, 64); return o; };
async function keepMoveCards(cards, net, u){
  for (const c of cards){
    const key = 'cards:' + c.id;
    if (net){
      if (keepLeft <= 0 || Date.now() < keepOff || (KEEP_SKIP[key] && Date.now() - KEEP_SKIP[key] < KEEP_RETRY)) continue;
      keepLeft--;
      try { await keepCardSend(net, c); keepFails = 0; } catch (e) { keepFail(key, e); continue; }
    } else { const b = keepBag(u); b.cards[c.id] = keepCard(c); if (!keepBagPut(u, b)){ keepFull(); return; } }
    const m = S.mail, k = m.pc.findIndex(x => x && x.id === c.id);
    if (k >= 0) m.pc.splice(k, 1);
    m.pcA = 1; save();
  }
}
// 登入了：這個帳號名下、還在這台裝置的那一包搬上雲端，搬成功的才從那一包拿掉
async function keepUpload(net, u){
  let b = keepBag(u);
  for (const kind of ['memo', 'mail']) for (const ym of Object.keys(b[kind]).sort()){
    const mid = await keepPut(net, kind, ym.slice(0, 7), keepClone(b[kind][ym]));
    if (!mid) continue;
    b = keepBag(u); delete b[kind][ym]; keepBagPut(u, b);
    const l = keepList(kind, true); if (!l.includes(mid)){ l.push(mid); save(); }
  }
  for (const id of Object.keys(b.cards)){
    const key = 'cards:' + id;
    if (keepLeft <= 0 || Date.now() < keepOff || (KEEP_SKIP[key] && Date.now() - KEEP_SKIP[key] < KEEP_RETRY)) continue;
    keepLeft--;
    try { await keepCardSend(net, b.cards[id]); keepFails = 0; } catch (e) { keepFail(key, e); continue; }
    b = keepBag(u); delete b.cards[id]; keepBagPut(u, b);
    if (S.mail && !S.mail.pcA){ S.mail.pcA = 1; save(); }
  }
}
// 丟掉的明信片：雲端那一份還沒刪成功的，再刪一次
async function keepDelPending(net){
  const m = S.mail; if (!m || !Array.isArray(m.pcx) || !m.pcx.length) return;
  for (const id of m.pcx.slice(0, KEEP_DOCS)){
    if (Date.now() < keepOff) return;
    try { await net.keepCardDel(id); keepFails = 0; } catch (e) { keepFail('del:' + id, e); continue; }
    m.pcx = m.pcx.filter(x => x !== id); if (!m.pcx.length) delete m.pcx;
    save();
  }
}
async function keepFlush(){
  if (keepBusy || typeof VISIT === 'undefined' || VISIT || Date.now() < keepOff) return;
  // 開著面板（信箱、紀念冊…）時先不動，免得畫面上的第幾封跟存檔對不起來；關掉之後再搬
  if (!$('#sheet').hidden){ keepLater(); return; }
  keepBusy = true; keepFails = 0;
  try {
    const net = sNet(), u = keepUid();
    if (net && u){ await keepUpload(net, u); await keepDelPending(net); }
    const plan = keepPlan();
    await keepMove('memo', plan.memo, net && u ? net : null, u);
    await keepMove('mail', plan.mail, net && u ? net : null, u);
    await keepMoveCards(plan.cards, net && u ? net : null, u);
    if (typeof mailBadge === 'function') mailBadge();
    if (!$('#sheet').hidden && $('#sheet .ml-box') && typeof openMail === 'function') openMail(true);
  } finally { keepBusy = false; }
}

/* ---------- 看更早的 ---------- */
// 讀一個月份：雲端那一份，加上這台裝置還沒搬上去的。讀不到會丟例外（呼叫的人跟玩家說晚點再試）
async function keepRead(kind, mid){
  if (KEEP_CACHE[kind][mid]) return KEEP_CACHE[kind][mid];
  const net = sNet(), u = keepUid(), b = keepBag(u)[kind];
  let rows = [];
  Object.keys(b).forEach(k => { if (k === mid || (!net && k.slice(0, 7) === mid.slice(0, 7))) rows = rows.concat(b[k]); });
  if (net && u){ const r = await net.keepGet(kind, mid); if (Array.isArray(r)) rows = rows.concat(r); }
  const seen = new Set();
  rows = rows.filter(r => r && !seen.has(keepKeyOf[kind](r)) && seen.add(keepKeyOf[kind](r)));
  return (KEEP_CACHE[kind][mid] = rows);
}
// 紀念冊：已經讀進來的舊紀錄（js/memo.js 畫的時候接在主存檔的後面）
let memoOld = [], memoOldN = 0, memoOldBusy = false;
const memoOldMore = () => keepMonths('memo').length > memoOldN;
async function memoOlder(){
  if (memoOldBusy) return; memoOldBusy = true;
  try {
    const mid = keepMonths('memo')[memoOldN]; if (!mid) return;
    const rows = await keepRead('memo', mid), have = new Set(memoOld.map(e => e.id));
    memoOld = memoOld.concat(rows.filter(e => e && typeof e.id === 'string' && !have.has(e.id)));
    memoOldN++;
  } catch (e) { sQuiet('keep', e); toast('現在讀不到更早的，晚點再試'); }
  finally { memoOldBusy = false; }
}
// 信箱：已經讀進來的舊信和舊明信片（js/mail.js 畫的時候接在後面）
let mailOld = [], mailOldN = 0, cardOld = [], cardOldEnd = false, cardOldPaged = false, mailOldBusy = false;   // cardOldPaged：舊明信片開始一頁一頁讀了沒
const mailOldMore = cat => cat !== 'news' && (keepMonths('mail').length > mailOldN || ((cat === 'pc' || cat === 'all') && !cardOldEnd && (!!(S.mail && S.mail.pcA) || Object.keys(keepBag(keepUid()).cards).length > 0)));
async function mailOlder(cat){
  if (mailOldBusy) return; mailOldBusy = true;
  try {
    const mid = keepMonths('mail')[mailOldN];
    if (mid){
      const rows = await keepRead('mail', mid), have = new Set(mailOld.map(keepMailKey));
      mailOld = mailOld.concat(rows.filter(o => o && typeof o.k === 'string' && !have.has(keepMailKey(o))));
      mailOldN++;
    }
    if ((cat === 'pc' || cat === 'all') && !cardOldEnd){
      const net = sNet(), u = keepUid(), have = new Set(cardOld.map(c => c.id));
      let list = Object.values(keepBag(u).cards).filter(c => c && !have.has(c.id));
      if (net && u && S.mail && S.mail.pcA){ const r = await net.keepCards(20, !cardOldPaged); cardOldPaged = true; list = list.concat((r.list || []).filter(c => c && !have.has(c.id) && !list.some(x => x.id === c.id))); if (!r.more) cardOldEnd = true; }
      else cardOldEnd = true;
      cardOld = cardOld.concat(list).sort((a, b) => (a.t < b.t ? 1 : a.t > b.t ? -1 : 0));
    }
  } catch (e) { sQuiet('keep', e); toast('現在讀不到更早的，晚點再試'); }
  finally { mailOldBusy = false; }
}
// 紀念冊、朋友面板點到一張主存檔裡沒有的明信片：去記憶體、這台裝置、雲端找。找不到回 null
async function keepCardFind(id){
  let c = cardOld.find(x => x.id === id) || keepBag(keepUid()).cards[id] || null;
  const net = sNet();
  if (!c && net && keepUid()) c = await net.keepCardGet(id);
  if (c && !cardOld.some(x => x.id === c.id)) cardOld.push(c);
  return c || null;
}
async function keepCardOpen(id){
  if ((S.mail && (S.mail.pcx || []).includes(id)) || typeof cardShow !== 'function'){ toast('這張明信片已經不在了'); return; }
  try { const c = await keepCardFind(id); if (c && c.snap) cardShow(c, true); else toast('這張明信片已經不在了'); }
  catch (e) { sQuiet('keep', e); toast('現在讀不到這張，晚點再試'); }
}
// 主存檔裡沒有、但可能搬出去了的明信片（紀念冊那一行要不要做成可以點）
const keepCardMaybe = id => !!id && !!S.mail && !(S.mail.pcx || []).includes(id) && (!!S.mail.pcA || !!keepBag(keepUid()).cards[id]);
// 丟掉一張明信片：這台裝置的那一份馬上刪；雲端那一份記下來，刪成功才從清單拿掉（不然會從舊的那邊又跑回來）
function keepCardGone(id, old){
  cardOld = cardOld.filter(c => c.id !== id);
  const u = keepUid(), b = keepBag(u);
  if (b.cards[id]){ delete b.cards[id]; keepBagPut(u, b); }
  const m = S.mail; if (!m) return;
  if (u && (old || m.pcA)){ m.pcx = Array.isArray(m.pcx) ? m.pcx : []; if (!m.pcx.includes(id)) m.pcx.push(id); if (m.pcx.length > 100) m.pcx.splice(0, m.pcx.length - 100); }
  save(); keepLater(1500);
}

/* ---------- 接起來 ---------- */
// 存檔之後看一下有沒有要搬的（只是數一數，不讀雲端）
{ const prev = save; save = function(){ const r = prev.apply(this, arguments); try { if (!keepT && !keepBusy && keepNeed()) keepLater(); } catch (e) {} return r; }; }
addEventListener('nestnet', () => { try { if (keepNeed()) keepLater(5000); } catch (e) {} });
setTimeout(() => { try { if (keepNeed()) keepLater(); } catch (e) {} }, 12000);
