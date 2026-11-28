/* 兩隻互動和串門子（第二步，2026-11-26）。接在 js/roam.js 後面。
   兩隻互動：一隻會跳到另一隻旁邊，然後——面對面講兩句（js/roamdata.js 的 PAIR_TALK，照這兩隻的個性寫）、一起跳、
     一隻跑一隻追、搶同一個座位。每互動一次交情加一點（沿用 js/pals.js 的 S.album.pals，不另外開欄位）。
   吵架：偶爾（一天最多一次，同時只有一對）講完話會吵起來，兩隻碰面只會各說一句賭氣的話。
     點其中一隻（另一隻也在這間）牠們就和好；不管牠們，30 分鐘後自己和好。記在 S.album.fight = {k:'a|b', t:時間}。
     只有朋友、吵架、和好，沒有別的關係。
   串門子：娃娃會自己走到門口去別間，過一陣子回來；別間的娃娃也會過來坐一下（2026-11-28 D 改成哪一間都去，寫在下面「串門子」那一段）。
     去了哪裡只記在記憶體（RV），不存檔、不改房間的擺設。小屋地圖顯示的是「現在」誰在哪一間。
     來串門子的娃娃可以點（會回一句），不能拖；拍照時照牠當下的位置拍。去朋友家時不串門子。
     （2026-11-28 多串門子：去隔壁的機會 7%→10%（15% 時客廳常少兩隻以上，像娃娃不見了）、待 60～150 秒、隔壁的過來每秒 1/30、同時在外面最多 4 隻。）
   點娃娃：除了原本的冒愛心和說話，牠會歪頭看你一下。
   不懲罰、不催人：吵架不會扣交情，不理牠們也會自己和好。 */
const RV = {};   // uid → {id, from:原本的房間, to:去了哪一間, back:什麼時候回去, out:'l'|'r'|'y'（從 from 哪個門出去的）, side:'l'|'r'|'y'（在 to 那間是從哪個門進來的）, x, y}
const FIGHT_MS = 30 * 60000;
const rvOut = it => !VISIT && RV[it.uid] && RV[it.uid].from === roomId;
const palBump = (a, b, n) => { if (VISIT || typeof palsData !== 'function') return; const p = palsData(), k = palKey(a, b); p[k] = Math.round((p[k] || 0) + n); };   // 不在這裡存檔，跟著下一次存檔一起寫
const fightNow = () => { const f = S.album && S.album.fight; return f && f.k && Date.now() - f.t < FIGHT_MS ? f : null; };
const fightOf = (a, b) => { const f = fightNow(); return !!f && f.k === palKey(a, b); };

/* ---------- 兩隻互動 ---------- */
function roamMeet(it, st){
  const others = roamDolls().filter(o => o !== it && !(RS[o.uid] && (RS[o.uid].busy || Date.now() < RS[o.uid].rest || roamOwnStay(o, RS[o.uid]))) && !(typeof asleep === 'function' && asleep(o.id)));   // 剛坐上專屬家具的不去打擾
  if (!others.length) return false;
  const o = others[Math.floor(Math.random() * others.length)], os = roamSt(o), [ox, oy] = roamPos(o);
  st.trips++;
  os.next = Math.max(os.next, Date.now() + 9000);   // 對方先別走開
  roamHopTo(it, Math.max(10, Math.min(90, ox + (ox > 50 ? -10 : 10))), Math.max(58, Math.min(94, oy + 1)), () => roamTogether(it, o));
  return true;
}
/* 其中一隻是來過夜的客人（js/stay.js）時講什麼（2026-11-27，台詞在 js/roamdata.js）：
   1. 客人剛到的那一天，第一隻靠近牠的先打招呼（那一隻講 GUEST_HI，客人回 GUEST_BACK），每位客人每天一次；
   2. 兩隻同一種：SAME_TALK；
   3. 其他：回 null，用原本的 PAIR_TALK（客人當成那一種娃娃）。
   回傳 {hi, say:[先講的, 句子, 後講的, 句子], done}。有客人的互動不加交情、不吵架（交情是家裡娃娃之間的）。 */
function guestTalk(a, b){
  const g = a.guest ? a : b, h = g === a ? b : a, one = L => L[Math.floor(Math.random() * L.length)];
  if (typeof g.hi === 'function' && g.hi() && GUEST_HI[h.id] && GUEST_BACK[g.id]) return {hi: 1, say: [h, one(GUEST_HI[h.id]), g, one(GUEST_BACK[g.id])], done: g.hiDone};
  if (a.id === b.id && SAME_TALK[a.id]){ const [x, y] = one(SAME_TALK[a.id]); return {say: [h, x, g, y]}; }
  return null;
}
function roamTogether(a, b){
  if (!roamHas(a) || !roamHas(b) || roamPaused()) return;   // 走到一半玩家開了面板、或小劇場開演了：這次就不互動
  const k = palKey(a.id, b.id), sa = roamSt(a), sb = roamSt(b), gst = !!(a.guest || b.guest), bump = n => { if (!gst) palBump(a.id, b.id, n); };
  sa.next = sb.next = Date.now() + 7000;
  if (!gst && fightOf(a.id, b.id)){ roamSay(a, FIGHT_LINE[a.id]); setTimeout(() => { if (items.includes(b)) roamSay(b, FIGHT_LINE[b.id]); }, 2000); return; }
  const gt = gst ? guestTalk(a, b) : null;
  const seats = roamSeats(a, f => !FURN[f.id].own);
  const pick = [['talk', 5], ['jump', 2], ['chase', 2], ['seat', seats.length ? 1 : 0]];
  let r = Math.random() * pick.reduce((n, p) => n + p[1], 0), act = 'talk';
  for (const [n, w] of pick){ r -= w; if (r <= 0){ act = n; break; } }
  if (gt && gt.hi) act = 'talk';   // 還沒打過招呼：先打招呼
  if (act === 'talk'){
    let first, second, l1, l2;
    if (gt){ [first, l1, second, l2] = gt.say; if (gt.done) gt.done(); }
    else { const L = PAIR_TALK[k]; if (!L) return; const [who, x1, x2] = L[Math.floor(Math.random() * L.length)]; first = who === a.id ? a : b; second = first === a ? b : a; l1 = x1; l2 = x2; }
    roamSay(first, l1);
    setTimeout(() => {
      if (!roamHas(second) || roamPaused()) return;
      roamSay(second, l2); bump(2);
      // 偶爾吵起來：一天最多一次，同時只有一對
      const f = S.album.fight;
      if (!gst && !VISIT && !fightNow() && !(f && f.d === todayStr()) && Math.random() < .05) setTimeout(() => fightStart(a, b), 2400);
    }, 2200);
  } else if (act === 'jump'){ roamIdle(a, 'jump'); roamIdle(b, 'jump'); bump(1); }
  else if (act === 'chase'){
    const [x, y] = roamPos(a), tx = Math.max(12, Math.min(88, x + (x > 50 ? -1 : 1) * rnd(20, 34))), ty = Math.max(62, Math.min(92, y + rnd(-10, 10)));
    roamHopTo(a, tx, ty);
    setTimeout(() => { if (roamHas(b) && !roamPaused() && !sb.busy) roamHopTo(b, Math.max(10, Math.min(90, tx + (tx > 50 ? -9 : 9))), ty); }, 700);
    bump(1);
  } else {
    const [f, s] = seats[Math.floor(Math.random() * seats.length)];
    roamSitOn(a, f, s);
    setTimeout(() => {
      if (!roamHas(b) || roamPaused() || sb.busy) return;
      const [x, y] = seatPos(f, s);
      roamHopTo(b, Math.max(10, Math.min(90, x + (x > 50 ? -11 : 11))), Math.max(58, Math.min(94, y + 4)), () => roamSay(b, SEAT_LINE[b.id]));
    }, 500);
    bump(1);
  }
}
function fightStart(a, b){
  if (VISIT || fightNow() || !items.includes(a) || !items.includes(b)) return;
  S.album.fight = {k: palKey(a.id, b.id), t: Date.now(), d: todayStr()};
  save();
  roamSay(a, FIGHT_LINE[a.id]);
  setTimeout(() => { if (items.includes(b)) roamSay(b, FIGHT_LINE[b.id]); }, 2000);
  setTimeout(() => toast(`${DOLL_NAME[a.id]}和${DOLL_NAME[b.id]}吵架了。點其中一隻幫牠們和好`), 4200);
}
// 和好。byYou：玩家點的（多加一點交情）；不然是時間到自己和好
function fightEnd(byYou){
  const f = S.album && S.album.fight; if (!f || !f.k) return;
  const [x, y] = f.k.split('|');
  palBump(x, y, byYou ? 6 : 3);
  S.album.fight = {d: f.d};   // 只留「今天吵過了」
  save();
  const a = items.find(i => i.kind === 'doll' && i.id === x), b = items.find(i => i.kind === 'doll' && i.id === y);
  if (a && b && !VISIT){
    roamSay(a, MAKEUP_LINE[x]);
    setTimeout(() => { if (items.includes(b)){ roamSay(b, MAKEUP_LINE[y]); roamIdle(a, 'jump'); roamIdle(b, 'jump'); } }, 2000);
  }
  toast(`${DOLL_NAME[x]}和${DOLL_NAME[y]}${byYou ? '和好了' : '自己和好了'}`);
}
// 相簿那一頁：正在吵架的話寫一行
function fightRow(d){
  const f = fightNow(); if (!f || !f.k.split('|').includes(d)) return '';
  const o = f.k.split('|').find(x => x !== d);
  return `<p class="al-fight">正在跟${DOLL_NAME[o]}吵架。點其中一隻可以幫牠們和好，不管牠們，過一陣子也會自己和好。</p>`;
}

/* ---------- 點娃娃：歪頭看你；吵架中的話幫牠們和好 ---------- */
{
  const prev = onDollTap;
  onDollTap = function(it){
    const f = !VISIT && fightNow();
    if (f && f.k.split('|').includes(it.id)){
      const o = f.k.split('|').find(x => x !== it.id);
      if (items.some(i => i.kind === 'doll' && i.id === o && !rvOut(i))){ fightEnd(true); return; }
    }
    prev(it);
    if (!REDUCE && !(typeof asleep === 'function' && asleep(it.id))){ try { roamIdle(it, 'look'); } catch (e) {} }
  };
}

/* ---------- 串門子（2026-11-28 D：哪一間都去） ----------
   - 哪一間都可以去：浴室、廚房、閣樓、花園都算，還沒開的房間不算。娃娃少的房間比較容易被選到：沒有娃娃 3、1 隻 2、2 隻以上 1。
   - 走哪個門跟畫面上的門口一樣（js/rooms.js 的 fixPaint）：去花園走客廳牆上那扇門（'y'），從花園出去走左邊的門口（通客廳）；
     其他照房間的順序，目的地在左邊走左門、在右邊走右門。例如臥室去花園：從左門往客廳那邊出去，到花園從左邊的門口進來。
   - 正在看的那一間：娃娃自己走到門口出去（roamVisit）。沒在看的房間：每 1～2 分鐘可能有一隻自己換去另一間（rvBg），
     切過去就看得到，小屋地圖照實顯示（roamIn）。打開一間沒有娃娃的房間：10～20 秒內從別間來一隻（rvCall）。
   - 待 3～8 分鐘。出門的那一間，門口留一個小腳印，點了說「火腿去臥室玩了」。
   - 房間裡自己的娃娃只剩 1 隻時不出門；同時在外面最多 4 隻、每間最多 2 個客人。 */
const RV_MAX = 4, RV_GUEST_MAX = 2, rvStay = () => rnd(180, 480) * 1000;
const rvDoor = side => side === 'y' ? [79, 58] : [side === 'l' ? 4 : 96, 58];
const rvEnterX = side => side === 'l' ? rnd(20, 36) : side === 'y' ? rnd(62, 76) : rnd(64, 80);
const rvOpen = () => VISIT ? [] : RIDS.filter(r => home[r] && Array.isArray(home[r].items));   // 已經開的房間（花園一直都在）
// 從 from 去 to：在 from 走哪一個門出去、在 to 從哪一個門進來（'l' 左邊的門口、'r' 右邊的門口、'y' 客廳牆上通花園的門）
function rvSides(from, to){
  const L = RIDS.filter(r => r !== 'yard'), at = r => L.indexOf(r === 'yard' ? 'living' : r);   // 花園接在客廳外面
  const out = to === 'yard' ? (from === 'living' ? 'y' : 'l') : from === 'yard' ? 'l' : at(to) < at(from) ? 'l' : 'r';
  const inn = to === 'yard' ? 'l' : from === 'yard' && to === 'living' ? 'y' : at(from) < at(to) ? 'l' : 'r';
  return [out, inn];
}
const rvGone = (r, i) => !!RV[i.uid] && RV[i.uid].from === r;
const rvHome = r => home[r] ? home[r].items.filter(i => i.kind === 'doll' && !rvGone(r, i)) : [];   // 這間自己的娃娃、現在在家的
const rvGuests = r => Object.values(RV).filter(v => v.to === r).length;
const rvHas = (r, id) => rvHome(r).some(i => i.id === id) || Object.values(RV).some(v => v.to === r && v.id === id);
// 這隻可以出門嗎（房間 r 是牠家）
const rvFree = (r, i) => i.kind === 'doll' && ROAM_P[i.id] && !RV[i.uid] && rvHome(r).length >= 2
  && !(typeof asleep === 'function' && asleep(i.id)) && !(typeof hideGet === 'function' && (hideGet() || {}).d === i.id)
  && !(S.album && S.album.out && S.album.out.d === i.id) && !(S.yard && S.yard.stay && S.yard.stay[i.id]) && !(typeof duoT !== 'undefined' && duoT && (i === duoT.a || i === duoT.b));
// 去哪一間：照比重抽，客人滿了、已經有同一隻的不去
function rvPickTo(from, id){
  const c = rvOpen().filter(r => r !== from && rvGuests(r) < RV_GUEST_MAX && !rvHas(r, id)).map(r => { const n = rvHome(r).length + rvGuests(r); return [r, n === 0 ? 3 : n === 1 ? 2 : 1]; });
  let w = Math.random() * c.reduce((n, p) => n + p[1], 0);
  for (const [r, n] of c){ w -= n; if (w <= 0) return r; }
  return c.length ? c[c.length - 1][0] : null;
}
// 記下一隻出門了（不管有沒有在看）。回傳那一筆
function rvGo(i, from, to){
  const [out, inn] = rvSides(from, to);
  return (RV[i.uid] = {id: i.id, from, to, back: Date.now() + rvStay(), out, side: inn, x: rvEnterX(inn), y: rnd(64, 80)});
}
// 這間的娃娃自己走到門口出門
function roamVisit(it){
  if (VISIT || it.guest || it.sit && Math.random() < .5) return false;
  if (Object.keys(RV).length >= RV_MAX || !rvFree(roomId, it)) return false;
  const from = roomId, to = rvPickTo(from, it.id); if (!to) return false;
  const [dx, dy] = rvDoor(rvSides(from, to)[0]);
  const ok = () => roomId === from && items.includes(it) && Object.keys(RV).length < RV_MAX && rvFree(from, it) && rvGuests(to) < RV_GUEST_MAX && !rvHas(to, it.id);
  roamFree = true;   // 走去門口：js/seen.js 不要把落點換到別的地方
  try {
    roamHopTo(it, dx, dy, () => {
      if (!ok()) return;   // 走到門口這段時間情況變了：這次不出門
      rvGo(it, from, to);
      const st = RS[it.uid]; if (st){ st.x = null; st.y = null; st.sit = null; st.trips = 0; st.busy = false; }
      roamPaint();
    });
  } finally { roamFree = false; }
  return true;
}
// 從別間叫一隻過來 to（打開空房間、在看的那一間偶爾來客人、沒在看的房間互相串門子都用這個）。from 不指定就從每一間裡抽
function rvBring(to, src){
  if (Object.keys(RV).length >= RV_MAX || rvGuests(to) >= RV_GUEST_MAX) return null;
  const c = [];
  rvOpen().filter(r => r !== to && r !== roomId && (!src || r === src)).forEach(r => home[r].items.forEach(i => { if (rvFree(r, i) && !rvHas(to, i.id)) c.push([r, i]); }));
  if (!c.length) return null;
  const [r, i] = c[Math.floor(Math.random() * c.length)];
  return rvGo(i, r, to);
}
// 沒在看的房間：抽一隻自己換去另一間（可能就是正在看的這一間，那就看得到牠從門口進來）
function rvBg(){
  if (Object.keys(RV).length >= RV_MAX) return;
  const c = [];
  rvOpen().filter(r => r !== roomId).forEach(r => home[r].items.forEach(i => { if (rvFree(r, i)) c.push([r, i]); }));
  if (!c.length) return;
  const [r, i] = c[Math.floor(Math.random() * c.length)], to = rvPickTo(r, i.id);
  if (to) rvGo(i, r, to);
}
// 出門的那一間：門口留一個小腳印（同一個門出去的共用一個），點了說誰去哪裡玩了。不是房間的東西，拍照不畫
const RV_PAW = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="#b98a6a" opacity=".8"><ellipse cx="12" cy="15.6" rx="5" ry="4.3"/><circle cx="5.8" cy="9.6" r="2.2"/><circle cx="9.8" cy="6.2" r="2.2"/><circle cx="14.2" cy="6.2" r="2.2"/><circle cx="18.2" cy="9.6" r="2.2"/></g></svg>';
function rvPaws(){
  const out = {};
  if (!VISIT && !window.PIC_LOCK) Object.values(RV).forEach(v => { if (v.from === roomId) (out[v.out] = out[v.out] || []).push(v); });
  room.querySelectorAll('.rvp').forEach(el => { if (!out[el.dataset.door]) el.remove(); });
  Object.entries(out).forEach(([door, L]) => {
    let el = room.querySelector(`.rvp[data-door="${door}"]`);
    if (!el){
      el = document.createElement('button'); el.className = 'rvp'; el.dataset.door = door; el.innerHTML = RV_PAW;
      const x = door === 'l' ? 5.5 : door === 'r' ? 94.5 : rvDoor(door)[0];   // 門口正下方的地板上
      el.setAttribute('style', `position:absolute;left:${x}%;top:${roomY(52.6)}%;width:9%;padding:1.5%;transform:translateX(-50%);background:none;border:0;cursor:pointer;z-index:300;-webkit-tap-highlight-color:transparent`);
      el.addEventListener('click', e => { e.stopPropagation(); const L = Object.values(RV).filter(v => v.from === roomId && v.out === el.dataset.door); if (L.length) toast(L.map(v => `${DOLL_NAME[v.id]}去${ROOM_SHORT[v.to] || ROOM_LABEL[v.to]}玩了`).join('，')); });
      room.appendChild(el);
    }
    el.setAttribute('aria-label', L.map(v => `${DOLL_NAME[v.id]}去${ROOM_SHORT[v.to] || ROOM_LABEL[v.to]}玩了`).join('，'));
  });
}
// 來串門子的娃娃：畫成另外的元素（不是這間的東西，不進存檔）
function rvEl(uid, v){
  let el = room.querySelector(`.rv[data-rv="${uid}"]`);
  if (el) return el;
  el = document.createElement('div'); el.className = 'rv doll breathe'; el.dataset.rv = uid;
  el.dataset.pd = v.id;   // 拍照（js/photo.js）要知道這是哪一隻
  el.innerHTML = `<span class="body">${dollPic(v.id)}</span>`;
  el.addEventListener('click', () => {
    const L = ROAM_LINES[v.id]; say({kind: 'doll', id: v.id, x: v.x, y: v.y}, L[Math.floor(Math.random() * L.length)]);
    const b = el.querySelector('.body'); b.classList.remove('r-heart'); void b.offsetWidth; b.classList.add('r-heart');
  });
  const [dx, dy] = rvDoor(v.side);
  el.style.left = dx + '%'; el.style.top = roomY(dy) + '%';
  room.appendChild(el);
  // 從門口跳進來
  setTimeout(() => { if (!el.isConnected) return; el.style.transition = 'left .9s linear, top .9s linear'; rvPlace(el, v); const b = el.querySelector('.body'); b.style.setProperty('--hopt', '.45s'); b.classList.add('roam-hop'); setTimeout(() => { b.classList.remove('roam-hop'); el.style.transition = ''; }, 950); }, 40);
  return el;
}
function rvPlace(el, v){
  const it = {kind: 'doll', id: v.id, x: v.x, y: v.y};
  el.style.left = v.x + '%'; el.style.top = roomY(v.y) + '%'; el.style.width = sizeOf(it)[0] + '%'; el.style.zIndex = 20 + Math.round(v.y * 3) + 1;
}
function rvPaint(){
  const here = VISIT ? [] : Object.entries(RV).filter(([, v]) => v.to === roomId);
  room.querySelectorAll('.rv').forEach(el => { if (!here.some(([u]) => String(u) === el.dataset.rv)) el.remove(); });
  here.forEach(([u, v]) => { const el = rvEl(u, v); if (!el.style.transition) rvPlace(el, v); });
  // 這間出門去的：先不畫
  room.querySelectorAll('.it.doll').forEach(el => { const it = items.find(i => String(i.uid) === el.dataset.u); el.style.display = it && rvOut(it) ? 'none' : ''; });
  rvPaws();
}
let rvSeen = null, rvCallAt = 0, rvBgAt = Date.now() + rnd(60, 120) * 1000;
function rvTick(){
  rvPaws();
  if (VISIT) return;
  const now = Date.now();
  for (const [u, v] of Object.entries(RV)){
    const src = home[v.from] && home[v.from].items.find(i => String(i.uid) === String(u));
    if (!src || !home[v.to]){ delete RV[u]; continue; }     // 被收進收納架了
    if (now < v.back) continue;
    delete RV[u];
    if (v.to === roomId && page === 'room'){
      // 我正看著牠作客的那間：牠跳回進來的那個門口走掉
      const el = room.querySelector(`.rv[data-rv="${u}"]`);
      if (el){ const [dx, dy] = rvDoor(v.side); el.style.transition = 'left .9s linear, top .9s linear'; el.style.left = dx + '%'; el.style.top = roomY(dy) + '%'; el.dataset.rv = 'gone'; setTimeout(() => el.remove(), 950); }
    } else if (v.from === roomId && items.includes(src)){
      // 我在牠家：牠從出去的那個門口跳回自己的位置
      const [dx, dy] = rvDoor(v.out), st = roamSt(src);
      st.x = dx; st.y = dy; st.sit = null; roamPaint();
      const hf = src.sit ? items.find(o => o.uid === src.sit && o.kind === 'furn') : null, [hx, hy] = hf ? seatPos(hf, src.seat) : [src.x, src.y];
      roamHopTo(src, hx, Math.max(40, hy), () => roamHome(src));
    }
  }
  rvPaws();
  // 打開一間沒有娃娃的房間：10～20 秒內從別間來一隻
  if (rvSeen !== roomId){ rvSeen = roomId; rvCallAt = rvHome(roomId).length + rvGuests(roomId) === 0 ? now + rnd(10, 18) * 1000 : 0; }   // 18：加上每秒檢查一次和跳進門的時間，20 秒內到
  if (roamPaused()) return;
  if (rvCallAt && now >= rvCallAt){ rvCallAt = 0; if (rvHome(roomId).length + rvGuests(roomId) === 0 && rvBring(roomId)) rvPaint(); }
  // 沒在看的房間：每 1～2 分鐘可能有一隻換去另一間
  if (now >= rvBgAt){ rvBgAt = now + rnd(60, 120) * 1000; rvBg(); rvPaint(); }
  // 別間的娃娃偶爾自己過來坐一下
  if (Math.random() < 1 / 30 && rvBring(roomId)) rvPaint();
  // 客人偶爾自己說一句
  Object.values(RV).filter(v => v.to === roomId).forEach(v => { if (Math.random() < 1 / 18){ const L = ROAM_LINES[v.id]; say({kind: 'doll', id: v.id, x: v.x, y: v.y}, L[Math.floor(Math.random() * L.length)]); } });
}
// 小屋地圖：現在誰在這一間（出門的不算、來作客的算）
function roamIn(r, rm){
  const ids = rm.items.filter(i => i.kind === 'doll' && SPR[i.id] && !(!VISIT && RV[i.uid] && RV[i.uid].from === r)).map(i => i.id);
  if (!VISIT) Object.values(RV).forEach(v => { if (v.to === r) ids.push(v.id); });
  return ids;
}

/* ---------- 接到第一步 ---------- */
{
  const act = roamAct;
  roamAct = function(it, st, canMove){
    if (canMove && !REDUCE && !roamOwnStay(it, st)){   // 剛坐上自己的專屬家具：先待著，不去找別隻、不串門子
      if (Math.random() < .25 && roamMeet(it, st)) return;
      if (Math.random() < .1 && roamVisit(it)) return;   // 客人只在客廳，不串門子（roamVisit 裡擋）
    }
    act(it, st, canMove);
  };
  const paint = roamPaint;
  roamPaint = function(){ paint(); rvPaint(); };
  const dolls = roamDolls;
  roamDolls = () => dolls().filter(i => !rvOut(i));
}
setInterval(() => {
  if (document.hidden) return;
  rvTick();
  const f = S.album && S.album.fight;
  if (f && f.k && Date.now() - f.t >= FIGHT_MS) fightEnd(false);
}, 1000);
