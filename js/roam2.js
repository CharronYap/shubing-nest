/* 兩隻互動和串門子（第二步，2026-11-26）。接在 js/roam.js 後面。
   兩隻互動：一隻會跳到另一隻旁邊，然後——面對面講兩句（js/roamdata.js 的 PAIR_TALK，照這兩隻的個性寫）、一起跳、
     一隻跑一隻追、搶同一個座位。每互動一次交情加一點（沿用 js/pals.js 的 S.album.pals，不另外開欄位）。
   吵架：偶爾（一天最多一次，同時只有一對）講完話會吵起來，兩隻碰面只會各說一句賭氣的話。
     點其中一隻（另一隻也在這間）牠們就和好；不管牠們，30 分鐘後自己和好。記在 S.album.fight = {k:'a|b', t:時間}。
     只有朋友、吵架、和好，沒有別的關係。
   串門子：娃娃會自己跳到房間邊的門口去隔壁，過一陣子回來；隔壁的娃娃也會過來坐一下。
     去了哪裡只記在記憶體（RV），不存檔、不改房間的擺設。小屋地圖顯示的是「現在」誰在哪一間。
     來串門子的娃娃可以點（會回一句），不能拖；拍照時照牠當下的位置拍。去朋友家時不串門子。
     （2026-11-28 多串門子：去隔壁的機會 7%→10%（15% 時客廳常少兩隻以上，像娃娃不見了）、待 60～150 秒、隔壁的過來每秒 1/30、同時在外面最多 4 隻。）
   點娃娃：除了原本的冒愛心和說話，牠會歪頭看你一下。
   不懲罰、不催人：吵架不會扣交情，不理牠們也會自己和好。 */
const RV = {};   // uid → {id, from:原本的房間, to:去了哪一間, back:什麼時候回去, side:'l'|'r'（在 to 那間是從哪一邊進來的）, x, y}
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

/* ---------- 串門子 ---------- */
const rvDoor = side => [side === 'l' ? 4 : 96, 58];
function rvNeighbors(){ const i = RIDS.indexOf(roomId), out = []; if (RIDS[i - 1]) out.push([RIDS[i - 1], 'l']); if (RIDS[i + 1]) out.push([RIDS[i + 1], 'r']); return out; }
// 這間的娃娃自己走去隔壁
function roamVisit(it){
  if (VISIT || it.sit && Math.random() < .5) return false;
  const nb = rvNeighbors(); if (!nb.length || Object.keys(RV).length >= 4) return false;
  const [to, side] = nb[Math.floor(Math.random() * nb.length)], [dx, dy] = rvDoor(side), from = roomId;
  roamHopTo(it, dx, dy, () => {
    if (roomId !== from || !items.includes(it)) return;
    RV[it.uid] = {id: it.id, from, to, back: Date.now() + rnd(60, 150) * 1000, side: side === 'l' ? 'r' : 'l', x: side === 'l' ? rnd(64, 80) : rnd(20, 36), y: rnd(64, 80)};
    const st = RS[it.uid]; if (st){ st.x = null; st.y = null; st.sit = null; st.trips = 0; st.busy = false; }
    roamPaint();
  });
  return true;
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
}
function rvTick(){
  if (VISIT) return;
  const now = Date.now();
  for (const [u, v] of Object.entries(RV)){
    const src = home[v.from] && home[v.from].items.find(i => String(i.uid) === String(u));
    if (!src){ delete RV[u]; continue; }                    // 被收進收納架了
    if (now < v.back) continue;
    delete RV[u];
    if (v.to === roomId && page === 'room'){
      // 我正看著牠作客的那間：牠跳回門口走掉
      const el = room.querySelector(`.rv[data-rv="${u}"]`);
      if (el){ const [dx, dy] = rvDoor(v.side); el.style.transition = 'left .9s linear, top .9s linear'; el.style.left = dx + '%'; el.style.top = roomY(dy) + '%'; el.dataset.rv = 'gone'; setTimeout(() => el.remove(), 950); }
    } else if (v.from === roomId && items.includes(src)){
      // 我在牠家：牠從門口跳回自己的位置
      const side = v.side === 'l' ? 'r' : 'l', [dx, dy] = rvDoor(side), st = roamSt(src);
      st.x = dx; st.y = dy; st.sit = null; roamPaint();
      const hf = src.sit ? items.find(o => o.uid === src.sit && o.kind === 'furn') : null, [hx, hy] = hf ? seatPos(hf, src.seat) : [src.x, src.y];
      roamHopTo(src, hx, Math.max(40, hy), () => roamHome(src));
    }
  }
  if (roamPaused()) return;
  // 隔壁的娃娃偶爾自己過來坐一下（同時最多兩隻客人）
  const guests = Object.values(RV).filter(v => v.to === roomId).length;
  if (guests < 2 && Object.keys(RV).length < 4 && Math.random() < 1 / 30){
    const nb = rvNeighbors().filter(([r]) => home[r]);
    if (nb.length){
      const [r, side] = nb[Math.floor(Math.random() * nb.length)];
      const c = home[r].items.filter(i => i.kind === 'doll' && ROAM_P[i.id] && !RV[i.uid] && !(typeof asleep === 'function' && asleep(i.id)) && !items.some(o => o.kind === 'doll' && o.id === i.id));
      if (c.length){ const it = c[Math.floor(Math.random() * c.length)]; RV[it.uid] = {id: it.id, from: r, to: roomId, back: now + rnd(60, 150) * 1000, side, x: side === 'l' ? rnd(20, 36) : rnd(64, 80), y: rnd(64, 80)}; rvPaint(); }
    }
  }
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
      if (!it.guest && Math.random() < .1 && roamVisit(it)) return;   // 客人只在客廳，不串門子
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
