/* 躲貓貓（2026-11-26）：不用同時在線的兩個人玩法
   主人：在自己家點一隻娃娃，腳邊冒出「躲起來」，按了再點房間裡一件家具，牠就躲到那件家具後面（只露出一點點，你自己看得到）。
     一次只能有一隻在躲；當天躲好就不能換，隔天可以換一隻、換地方。把牠拖走就是不躲了。
   朋友：來你家時木牌寫「有一隻娃娃躲起來了」，那隻不會畫出來。點家具找，一天 3 次。
     點錯：家具晃一下，給一句提示（不在這一間／很近了／在這一間，再找找）。
     找到：娃娃跳出來，朋友拿 1 枚；主人下次打開看到「○○找到躲起來的薯餅了」，也拿 1 枚，那隻就出來了。
     3 次都沒找到：隔天可以再找，躲的人不用重躲。
   不懲罰、不催人：沒人來找不會怎樣，牠一直躲著等；沒找到也沒有任何損失。
   雲端（規則 2026-11-26 下午 4:36 已發布。保險留著：讀寫被擋時都安靜，只是朋友那邊不會出現躲貓貓）：
     公開資料 nestRooms/{自己}.hide = {d:哪一隻, r:哪一間, f:家具的編號, day:哪天躲的}
     nestRooms/{主人}/found/{日子_找的人} = {from, fromName, day, ok:有沒有找到, n:用了幾次}（跟澆水同一種寫法）
     躲在哪裡放在公開資料裡，懂程式的人看得到答案；兩個人玩，不防這個。
   存檔（都放在 S.album 裡）：hide = {d, r, f, t:'日期', day, x, y, sit}、hideGot = [處理過的 found 編號]、
     seek = {朋友的 uid: {day, n, ok}}（今天在他家找了幾次） */
const HIDE_TRY = 3, HIDE_COIN = 1;
const hideGet = () => (S.album && S.album.hide && DOLLS.includes(S.album.hide.d) ? S.album.hide : null);
const hideCover = f => f && f.kind === 'furn' && FURN[f.id] && !FURN[f.id].wall && !FURN[f.id].floor;
let hidePicking = null;

/* ---------- 主人：躲起來 ---------- */
// 給公開資料用的那一份（js/account.js pushRoom）
function hidePublic(){
  const h = hideGet(); if (!h || !home[h.r]) return null;
  if (!home[h.r].items.some(i => i.uid === h.f && hideCover(i)) || !home[h.r].items.some(i => i.kind === 'doll' && i.id === h.d)) return null;
  return {d: h.d, r: h.r, f: h.f | 0, day: h.day | 0};
}
function hideStop(msg){
  const h = hideGet(); if (!h) return;
  delete S.album.hide;
  save();
  const net = sNet(); if (net) net.push().catch(() => {});
  if (!VISIT && typeof render === 'function'){ quiet = true; render(); quiet = false; }
  if (msg) toast(msg);
}
function hideChip(it, text, fn){
  room.querySelectorAll('.hide-chip').forEach(c => c.remove());
  const [x, y] = typeof roamPos === 'function' ? roamPos(it) : [it.x, it.y];
  const b = document.createElement('button');
  b.className = 'hide-chip'; b.textContent = text;
  b.style.left = Math.max(14, Math.min(86, x)) + '%'; b.style.top = Math.min(96, roomY(y) + 1.5) + '%';
  b.addEventListener('pointerdown', e => e.stopPropagation());
  b.addEventListener('click', e => { e.stopPropagation(); b.remove(); fn(); });
  room.appendChild(b);
  // 娃娃站得高、泡泡改放到腳下的時候：小按鈕讓到泡泡下面
  const s = room.querySelector('.say.dn');
  // 用版面的數字算，不用畫面上量到的（兩個都還在跑出現的動畫，量到的位置會差幾 px）
  const H = room.clientHeight;
  if (s && H && Math.abs(b.offsetLeft - s.offsetLeft) < (b.offsetWidth + s.offsetWidth) / 2 && b.offsetTop < s.offsetTop + s.offsetHeight + 4)
    b.style.top = Math.min(96, (s.offsetTop + s.offsetHeight + 6) / H * 100) + '%';
  setTimeout(() => b.remove(), 4200);
}
// 點娃娃：登入了才有。正在躲的那隻給「出來吧」，其他的（今天還沒躲過）給「躲起來」
{ const prev = onDollTap; onDollTap = function(it){
    prev(it);
    try {
      // 正在演小劇場（包含點「！」開始演的那一下）：不冒出來，原本冒著的也收掉
      if (typeof skitOn !== 'undefined' && skitOn){ room.querySelectorAll('.hide-chip').forEach(c => c.remove()); return; }
      // 點了之後開了面板（今天的小事）就不冒出來，免得被蓋在下面
      if (VISIT || !sNet() || hidePicking || !$('#sheet').hidden || (typeof asleep === 'function' && asleep(it.id))) return;
      const h = hideGet(), t = todayStr();
      if (h && h.d === it.id && h.r === roomId) hideChip(it, '出來吧', () => hideStop(`${DOLL_NAME[it.id]}出來了`));
      else if ((!h || h.t !== t) && items.some(hideCover)) hideChip(it, '躲起來', () => hidePickStart(it));
    } catch (e) { console.info('[hide]', e); }
  }; }
function hidePickStart(it){
  hidePicking = it;
  room.classList.add('hide-pick');
  toast(`點一件家具，${DOLL_NAME[it.id]}會躲到後面`);
  if (typeof roamHold !== 'undefined') roamHold = Date.now() + 15000;
}
function hidePickEnd(){ hidePicking = null; room.classList.remove('hide-pick'); }
// 選家具：搶在拖家具之前
room.addEventListener('pointerdown', e => {
  if (!hidePicking) return;
  const el = e.target.closest && e.target.closest('.it');
  const f = el && items.find(i => String(i.uid) === el.dataset.u);
  const it = hidePicking;
  e.stopPropagation(); e.preventDefault();
  hidePickEnd();
  if (!hideCover(f) || !items.includes(it)){ toast('先不躲了'); return; }
  S.album.hide = {d: it.id, r: roomId, f: f.uid, t: todayStr(), day: nestDayN(), x: it.x, y: it.y, sit: it.sit || 0};
  if (typeof roamHome === 'function') roamHome(it);
  save();
  const net = sNet(); if (net) net.push().catch(() => {});
  quiet = true; render(); quiet = false;
  toast(`${DOLL_NAME[it.id]}躲到${typeof furnName === 'function' ? furnName(f.id) : '家具'}後面了。朋友來的時候可以找牠`);
}, true);
// 畫：躲著的那隻放到家具後面，只露出一點點
function hidePaint(){
  room.querySelectorAll('.it.doll.hiding').forEach(el => el.classList.remove('hiding'));
  if (VISIT) return;
  const h = hideGet(); if (!h || h.r !== roomId) return;
  const it = items.find(i => i.kind === 'doll' && i.id === h.d), f = items.find(i => i.uid === h.f);
  // 家具收走了、娃娃被拿走或被拖到別的地方：不躲了
  if (!it || !hideCover(f) || Math.abs(it.x - h.x) > .01 || Math.abs(it.y - h.y) > .01 || (it.sit || 0) !== (h.sit || 0)){ if (!drag) hideStop(); return; }
  const el = room.querySelector(`.it[data-u="${it.uid}"]`); if (!el) return;
  const [fw, fh] = sizeOf(f);
  el.classList.add('hiding'); el.classList.remove('sit', 'breathe');
  el.style.left = Math.max(8, Math.min(92, f.x + fw * .3)) + '%';
  el.style.top = (roomY(f.y) - fh * .42) + '%';
  el.style.zIndex = Math.max(1, zOf(f) - 1);
}
{ const prev = render; render = function(){ prev(); try { hidePaint(); } catch (e) { console.info('[hide]', e); } }; }
// 躲著的那隻不會自己到處走
if (typeof roamDolls !== 'undefined'){ const prev = roamDolls; roamDolls = () => { const h = hideGet(); return prev().filter(i => !(h && !VISIT && !i.guest && i.id === h.d)); }; }   // 客人（js/stay.js）不算：跟躲起來的那隻同一種也照樣晃
if (typeof roamPaint === 'function'){ const prev = roamPaint; roamPaint = function(){ prev(); try { hidePaint(); } catch (e) {} }; }

/* ---------- 主人：朋友找的結果 ---------- */
let hideBusy = false;
async function hideFetch(){
  const net = sNet(); if (!net || VISIT || hideBusy) return;
  hideBusy = true;
  try {
    const list = (await net.founds()).filter(w => w && typeof w.id === 'string' && w.from).sort((a, b) => (a.day | 0) - (b.day | 0));
    if (VISIT) return;
    const got = S.album.hideGot = Array.isArray(S.album.hideGot) ? S.album.hideGot : [];
    for (const w of list){
      if (!got.includes(w.id)){
        const h = hideGet(), d = h ? h.d : null, name = sText(w.fromName, 12) || '朋友';
        got.push(w.id); if (got.length > 30) got.splice(0, got.length - 30);
        if (w.ok === true){
          S.coins += HIDE_COIN; if (typeof renderHud === 'function') renderHud();
          if (typeof memoAdd === 'function') memoAdd('hideFound', w.from, name, {id: 'hf' + w.id, d, day: w.day, in: 1});
          const n = d ? DOLL_NAME[d] : '娃娃';
          if (h && (w.day | 0) >= (h.day | 0)) hideStop();
          setTimeout(() => toast(`${name}找到躲起來的${n}了，你也拿到 ${HIDE_COIN} 枚幣`), 1500);
        } else if (typeof memoAdd === 'function') memoAdd('hideMiss', w.from, name, {id: 'hm' + w.id, d, day: w.day, in: 1});
        save();
      }
      sAfterSave(() => net.foundDel(w.id));   // 等存檔上了雲端才刪
    }
  } catch (e) { sQuiet('hide', e); }   // 讀不到（斷線、規則被換回舊版）：安靜
  finally { hideBusy = false; }
}
addEventListener('nestnet', hideFetch);
document.addEventListener('visibilitychange', () => { if (!document.hidden) hideFetch(); });

/* ---------- 朋友：來找 ---------- */
function hideSeek(uid){
  const a = S.album, day = nestDayN();
  a.seek = a.seek && typeof a.seek === 'object' ? a.seek : {};
  if (!a.seek[uid] || a.seek[uid].day !== day) a.seek[uid] = {day, n: 0, ok: false};
  const keys = Object.keys(a.seek); if (keys.length > 10) keys.filter(k => k !== uid).slice(0, keys.length - 10).forEach(k => delete a.seek[k]);
  return a.seek[uid];
}
function hideSign(){
  const el = $('#vbar .vb-hide'); if (!el || !VISIT || !VISIT.hide) return;
  const st = hideSeek(VISIT.uid), left = HIDE_TRY - st.n;
  el.innerHTML = `${WANT_STAR}<span>${st.ok ? '今天找到躲起來的娃娃了' : left > 0 ? `有一隻娃娃躲起來了。點家具找找看，今天還有 ${left} 次` : '有一隻娃娃躲起來了。今天的三次用完了，明天再來找'}</span>`;
}
visitExtras.push((f, more) => {
  const h = f.data && f.data.hide, net = sNet();
  if (!net || !VISIT || !h || typeof h !== 'object' || !DOLLS.includes(h.d) || !VISIT.home[h.r]) return;
  const fu = VISIT.home[h.r].items.find(i => i.uid === h.f && hideCover(i));
  if (!fu) return;
  VISIT.hide = {d: h.d, r: h.r, f: h.f, day: h.day | 0};
  // 躲著的那隻不畫出來
  let cut = false;
  Object.keys(VISIT.home).forEach(r => { const L = VISIT.home[r].items; for (let i = L.length - 1; i >= 0; i--) if (L[i].kind === 'doll' && L[i].id === h.d){ L.forEach(x => { if (x.sit === L[i].uid) x.sit = null; }); L.splice(i, 1); cut = true; } });
  if (cut){ quiet = true; render(); quiet = false; }
  const sign = document.createElement('span'); sign.className = 'vb-want vb-hide';
  more.appendChild(sign);
  hideSign();
  // 別台裝置今天找過了：照雲端那一筆
  const st = hideSeek(f.uid), uid = f.uid;
  net.foundMine(uid, nestDayN()).then(x => { if (x && VISIT && VISIT.uid === uid){ st.n = Math.max(st.n, x.ok ? st.n : HIDE_TRY); if (x.ok) st.ok = true; hideSign(); } }).catch(e => sQuiet('hide', e));
});
// 點家具
{ const prev = visitTap; visitTap = function(it){
    if (it.kind === 'furn' && VISIT && VISIT.hide){ try { hideGuess(it); } catch (e) { console.info('[hide]', e); } return; }
    return prev(it);
  }; }
function hideGuess(it){
  const h = VISIT.hide, uid = VISIT.uid, st = hideSeek(uid), net = sNet();
  if (st.ok){ toast('今天已經找到了'); return; }
  if (st.n >= HIDE_TRY){ toast('今天的三次用完了，明天再來找'); return; }
  if (!hideCover(it)){ toast('牠躲不進這裡，找找別的家具'); return; }
  st.n++;
  const el = elFor(it), who = sText(VISIT.name, 12) || '朋友';
  const send = ok => { if (net) net.foundAdd(uid, nestDayN(), {fromName: net.me.name, ok, n: st.n}).catch(e => sQuiet('hide', e)); };
  if (roomId === h.r && it.uid === h.f){
    st.ok = true;
    S.coins += HIDE_COIN; if (typeof renderHud === 'function') renderHud();
    if (typeof memoAdd === 'function') memoAdd('seekFound', uid, who, {id: 'sf' + nestDayN() + uid, d: h.d});
    save(); send(true);
    // 娃娃從家具後面跳出來
    const [fw, fh] = sizeOf(it), d = document.createElement('div');
    room.querySelectorAll('.hidepop').forEach(x => x.remove());
    // 不用 .it／.rv：那兩種會被重畫房間、串門子的程式收掉
    d.className = 'hidepop doll'; d.innerHTML = `<span class="body">${dollPic(h.d, VISIT.look[h.d] || {})}</span>`;
    d.style.left = Math.max(10, Math.min(90, it.x + fw * .3)) + '%'; d.style.top = (roomY(it.y) - fh * .2) + '%';
    d.style.width = sizeOf({kind: 'doll', id: h.d, x: it.x, y: it.y})[0] + '%'; d.style.zIndex = zOf(it) + 2;
    room.appendChild(d);
    toast(`找到${DOLL_NAME[h.d]}了，拿到 ${HIDE_COIN} 枚幣`);
  } else {
    el.classList.remove('hide-no'); void el.offsetWidth; el.classList.add('hide-no');
    setTimeout(() => el.classList.remove('hide-no'), 600);
    const fu = VISIT.home[h.r].items.find(i => i.uid === h.f);
    const hint = roomId !== h.r ? '不在這一間' : fu && Math.abs(fu.x - it.x) < 28 ? '很近了' : '在這一間，再找找';
    save();
    if (st.n >= HIDE_TRY){ send(false); toast(`${hint}。今天的三次用完了，明天再來找`); }
    else toast(`${hint}。還有 ${HIDE_TRY - st.n} 次`);
  }
  hideSign();
}
// 一開始就畫一次（躲著的那隻在這一間的話）
try { hidePaint(); } catch (e) {}
// 換房間、進出朋友家：跳出來的那隻、腳邊的小鈕、選家具的狀態都收掉
{ const prev = load; load = function(){ room.querySelectorAll('.hidepop,.hide-chip').forEach(x => x.remove()); hidePickEnd(); prev(); }; }
