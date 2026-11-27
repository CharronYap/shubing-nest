/* 回信（2026-11-27，規格：薯餅小窩/回信_規格.md 第 3 節）
   朋友送來的娃娃的信、過夜的日記、朋友寄的明信片、朋友寫來的信，下面都有一顆「回信」，可以寫一段字寄回去。只有字，100 字以內。
   - 雲端：nestLetters/{自動編號} = {from, fromName, to, msg, re, d, t}（firestore.rules）。收的人打開時抄進信箱（S.mail.l），等存檔上了雲端再刪雲端那筆。
   - 抄進信箱的樣子：`{娃娃}.re.0#w=名字;u=寄的人;x=寫的字;rt=回哪一種;rd=哪一隻;id=編號`，放在「朋友家」那一類（js/mail.js）。
   - 收過的編號記在 S.mail.led（最多 40 個），一天寄給同一個朋友幾封記在 S.mail.lsn = {d: 日期, u: {帳號: 封數}}，一天最多 5 封。
   - 換行會被 sText 換成空白（跟明信片、訪客簿一樣）。
   - 寄的、收的都記進紀念冊（js/memo.js 的 letterOut、letterIn），朋友面板也列得到（js/friend.js）。
   要放在 friend.js 後面、keep.js 前面載入。 */
const LT_LEN = 100, LT_DAY = 5, LT_KEEP = 40;
const LT_RE = ['gift', 'trip', 'pc', 're'];
let ltFriends = null, ltCur = null, ltBusy = false, ltPull = false, ltN = 0;
const ltMap = new Map();   // 畫面上的回信鈕 → {t: 要寄給誰、回哪一封, back: 看完、寄完回哪裡}
const ltUid = s => typeof s === 'string' && /^[\w-]{1,64}$/.test(s);
function ltMail(){
  const m = mailInit();
  if (!Array.isArray(m.led)) m.led = [];
  if (!m.lsn || typeof m.lsn !== 'object' || m.lsn.d !== todayStr() || !m.lsn.u || typeof m.lsn.u !== 'object') m.lsn = {d: todayStr(), u: {}};
  return m;
}
// 朋友名單：朋友面板讀過就用那一份，不然自己讀一次（下次畫的時候就有）
const ltList = () => (typeof frList !== 'undefined' && frList) || ltFriends;
function ltLoad(){
  const net = sNet(); if (!net || ltFriends) return;
  ltFriends = [];
  net.friends().then(l => { ltFriends = l || []; }).catch(e => { ltFriends = null; sQuiet('letter', e); });
}
// 找寄給誰：有帳號就用帳號；舊的信只有名字，名單裡剛好一位同名才用
function ltWho(uid, name){
  const L = ltList();
  if (!L) ltLoad();
  if (ltUid(uid)){ const f = (L || []).find(p => p.uid === uid); return {uid, name: (f && sText(f.name, 12)) || name || '朋友', hasMe: f ? f.hasMe : undefined}; }
  if (!L || !name) return null;
  const same = L.filter(p => typeof ngName === 'function' && ngName(p.name) === name);
  return same.length === 1 ? {uid: same[0].uid, name: sText(same[0].name, 12) || name, hasMe: same[0].hasMe} : null;
}
// 信箱裡的一封（送來的娃娃、過夜日記、朋友寫的信）→ 回信要寄給誰
function letterOf(o){
  let x; try { x = mailParse(o.k); } catch (e) { return null; }
  if (!['gift', 'trip', 're'].includes(x.type)) return null;
  const f = ltWho(x.p.u, x.p.w || ''); if (!f) return null;
  let title = ''; try { title = mailText(o.k).title; } catch (e) {}
  return {to: f.uid, name: f.name, hasMe: f.hasMe, re: x.type, d: x.type !== 're' && DOLLS.includes(x.d) ? x.d : '', title};
}
// 朋友寄的明信片（S.mail.pc 的一張）
function letterOfCard(c){
  if (!c || !ltUid(c.u)) return null;
  const f = ltWho(c.u, c.w); if (!f) return null;
  return {to: f.uid, name: f.name, hasMe: f.hasMe, re: 'pc', d: '', title: `${c.w || f.name}寄來的明信片`};
}
function ltKey(t, back){
  const n = ++ltN; ltMap.set(String(n), {t, back});
  if (ltMap.size > 40) ltMap.delete(ltMap.keys().next().value);
  return n;
}
// 信下面那顆鈕。bare：只要鈕，不包一層（放進現成的 .ml-ft 裡）
function letterBtn(o, back, bare){
  if (VISIT || !sNet()) return '';
  const t = letterOf(o); if (!t) return '';
  const b = `<button class="btn sm lt-btn" data-ltr="${ltKey(t, back)}">回信</button>`;
  return bare ? b : `<div class="lt-row">${b}</div>`;
}
// 信最下面那一行小字：回的是哪一封（mail.js 的 mailText 叫）
function letterReNote(p){
  const d = DOLLS.includes(p.rd) ? DOLL_NAME[p.rd] : '娃娃';
  return p.rt === 'gift' ? `回：從你家去的${d}` : p.rt === 'trip' ? `回：來你家過夜的${d}` : p.rt === 'pc' ? '回：你寄的明信片' : p.rt === 're' ? '回：你寫的信' : '';
}
// 信箱裡編號是 id 的那一封（朋友面板用）
function letterById(id){
  if (!id) return null;
  return ((S.mail && S.mail.l) || []).find(o => o && typeof o.k === 'string' && mailBare(o.k).endsWith(';id=' + id)) || null;   // 新的信最後面多一個收到的時間 h（js/mail.js）
}

/* ---------- 寫信 ---------- */
function letterOpen(t, back){
  if (!t || VISIT) return;
  ltCur = {t, back: typeof back === 'function' ? back : () => openMail()};
  const nm = t.name || '朋友';
  openSheet(`<div class="hd">${MAIL_ICON}<span>回信給${txSlot(nm)}</span></div>
    <div class="lt-box">
      ${t.title ? `<small class="lt-re">回：${txSlot(t.title)}</small>` : ''}
      ${t.hasMe === false ? `<small class="bk-note">${txSlot(nm)}還沒加你當朋友，信寄不過去。</small>` : ''}
      <div class="lt-pad"><textarea class="tx-in lt-ta" id="ltTx" rows="5" maxlength="${LT_LEN}" aria-label="信的內容，${LT_LEN} 字以內"></textarea><small class="lt-n" id="ltN" aria-hidden="true">0/${LT_LEN}</small></div>
    </div>
    <div class="ml-ft"><button class="btn" data-lt="back">返回</button><button class="btn y" data-lt="send" disabled>寄出</button></div>`);
  evOpen = false; alOpen = false;
  const ta = $('#ltTx'); if (ta){ ta.placeholder = `想跟${nm}說什麼？`; ltCount(); }
}
function ltCount(){
  const ta = $('#ltTx'), n = $('#ltN'), b = $('#sheet [data-lt="send"]'); if (!ta) return;
  if (n) n.textContent = `${ta.value.length}/${LT_LEN}`;
  if (b && !ltBusy) b.disabled = !sText(ta.value, LT_LEN);
}
async function letterSend(){
  if (!ltCur || ltBusy) return;
  const {t} = ltCur, nm = t.name || '朋友', net = sNet(), ta = $('#ltTx'), b = $('#sheet [data-lt="send"]');
  if (!net || !net.letterSend){ toast('登入之後才能寄信'); return; }
  const msg = sText(ta && ta.value, LT_LEN); if (!msg) return;
  if (t.hasMe === false){ toast(`${nm}還沒加你當朋友，信寄不過去。`); return; }
  const m = ltMail();
  if ((m.lsn.u[t.to] | 0) >= LT_DAY){ toast('今天寫好多封了，明天再寄吧。'); return; }
  ltBusy = true; if (b){ b.disabled = true; b.textContent = '寄送中……'; }
  try {
    const o = {to: t.to, msg, fromName: net.me.name};
    if (LT_RE.includes(t.re)) o.re = t.re;
    if (t.d) o.d = t.d;
    const id = await net.letterSend(o);
    const mm = ltMail(); mm.lsn.u[t.to] = (mm.lsn.u[t.to] | 0) + 1;
    memoAdd('letterOut', t.to, nm, {id: 'lo' + id, d: t.d, m: msg});
    save();
    ltBusy = false;
    toast(`寄出去了。${nm}打開小窩就會收到。`);
    const back = ltCur.back; ltCur = null; back();
  } catch (e) {
    sQuiet('letter', e);
    ltBusy = false;
    // 打的字留著，可以再按一次
    if (b && b.isConnected){ b.textContent = '寄出'; ltCount(); }
    toast(e && e.code === 'permission-denied' && t.hasMe !== true ? `${nm}還沒加你當朋友，信寄不過去。` : sErr(e));
  }
}
document.addEventListener('input', e => { if (e.target && e.target.id === 'ltTx') ltCount(); });
$('#sheet').addEventListener('click', e => {
  const r = e.target.closest('[data-ltr]');
  if (r){ const x = ltMap.get(r.dataset.ltr); if (x) letterOpen(x.t, x.back); return; }
  const b = e.target.closest('[data-lt]'); if (!b || !ltCur) return;
  if (b.dataset.lt === 'back'){ const back = ltCur.back; ltCur = null; back(); }
  else if (b.dataset.lt === 'send') letterSend();
});

/* ---------- 收 ---------- */
async function letterRefresh(redraw){
  const net = sNet(); if (!net || VISIT || !net.lettersTo || ltPull) return;
  ltPull = true;
  let list;
  try { list = await net.lettersTo(); } catch (e) { sQuiet('letter', e); ltPull = false; return; }
  ltPull = false;
  const m = ltMail(), me = net.me && net.me.uid;
  let changed = false;
  (list || []).sort((a, b) => (a.t || 0) - (b.t || 0)).forEach(c => {
    if (!c || typeof c.id !== 'string' || !/^[\w-]{1,64}$/.test(c.id)) return;
    if (c.to !== me) return;   // 自己寄出去、對方還沒收的那幾封不管
    const msg = sText(c.msg, LT_LEN), ok = ltUid(c.from) && c.from !== me && !!msg;
    const have = m.led.includes(c.id) || !!letterById(c.id);
    if (!have && ok){
      const re = LT_RE.includes(c.re) ? c.re : '', d = typeof c.d === 'string' && DOLLS.includes(c.d) ? c.d : '';
      const icon = (re === 'gift' || re === 'trip') && d ? d : 'sloth';
      const k = `${icon}.re.0#w=${ngName(c.fromName)};u=${c.from};x=${encodeURIComponent(msg)}${re ? ';rt=' + re : ''}${d ? ';rd=' + d : ''};id=${c.id}`;
      m.l.unshift({k: mailWithH(k, mailHmOf(c.t || Date.now())), t: ngDay(c.t), r: 0, a: null, g: 0});   // 時間用朋友寄出的那一刻，和日期一樣
      memoAdd('letterIn', c.from, sText(c.fromName, 12) || '朋友', {id: 'li' + c.id, c: c.id, in: 1, d, m: msg});
      changed = true;
    }
    if (ok && !m.led.includes(c.id)){ m.led.push(c.id); if (m.led.length > LT_KEEP) m.led.splice(0, m.led.length - LT_KEEP); }
    // 抄好了：等自己的存檔上了雲端才刪雲端那筆；格式不對的直接刪
    if (ok) sAfterSave(() => net.letterDel(c.id)); else net.letterDel(c.id).catch(e => sQuiet('letter', e));
  });
  if (changed){
    mailTrim(m.l);
    save(); mailBadge();
    if (typeof frBadge === 'function') frBadge();
    if (redraw && !$('#sheet').hidden){
      if ($('#sheet .ml-box')) openMail(true);
      else if ($('#sheet .fr-box') && typeof frPaint === 'function') frPaint();
    }
  }
}
addEventListener('nestnet', () => { ltFriends = null; letterRefresh(true); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) letterRefresh(true); });
setInterval(() => { if (!document.hidden) letterRefresh(true); }, 5 * 60000);
