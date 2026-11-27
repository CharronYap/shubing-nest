/* 娃娃自己動（第一步，2026-11-26）
   娃娃是玩偶的照片，沒有走路的分解圖，所以移動是「一跳一跳」。每隻每隔一陣子自己決定做一件事：
   跳到別的位置、找空座位坐、去自己的專屬家具、原地小動作、自言自語；晚上自己找地方睡。個性在 js/roamdata.js。
   跟玩家的擺設怎麼並存：
   - 玩家擺的位置（存檔裡的 x、y、坐哪裡）是那隻娃娃的「家」，這裡完全不改它。娃娃晃到哪裡只記在記憶體（RS），
     畫的時候蓋過去而已；不存檔，也不會因為娃娃在動就觸發存檔或雲端寫入。重新打開、換房間再回來，都從家開始。
   - 晃出去四到六次之後會自己回家（每次回家後重新抽）。
   - 玩家抓起一隻正在外面晃的娃娃：從牠現在的位置開始拖，放下去的地方變成新的家；只是點一下的話，家不變。
   - 剛被玩家拖過的娃娃先待一分鐘。
   - 玩家正在拖東西、剛動過收納架、開著面板時，全部停下來。拍照不停（2026-11-28）：照片照按下快門那一刻的畫面畫（js/photo.js）。
   - 同時在移動的上限：這一間有四隻以上是三隻，不然兩隻。裝置開了「減少動態效果」的話不移動，只冒字。
   - 小屋地圖最下面有開關「讓娃娃自己玩」，預設開，只記在這台裝置。
   去朋友家時朋友的娃娃也會動，只是畫面效果，不寫任何資料。
   來過夜的客人（2026-11-27）：不在 items 裡，js/stay.js 另外畫。用一隻「假娃娃」{kind:'doll', id, x, y, uid:'g…', guest:1} 進這一套，
   x、y 是雲端上的位置（牠的家）。只在客廳、不去坐別隻的專屬家具、不去躲、不串門子；其他跟家裡的娃娃一樣。 */
const ROAM_KEY = 'shubingNest.roam';
let roamOn = true;
try { roamOn = localStorage.getItem(ROAM_KEY) !== '0'; } catch (e) {}
const RS = {};                 // uid → {x, y, sit, seat, busy, next, trips, rest, …}；x 是 null = 在家
let roamHold = 0, roamTimer = 0;
let roamFree = false;        // 故意靠著家具的移動（去坐、龍龍去躲）：js/seen.js 不要把落點換掉
const rnd = (a, b) => a + Math.random() * (b - a);
let roamGuests = () => (typeof stayRoamList === 'function' ? stayRoamList() : []);   // 來過夜的客人（js/stay.js）
const roamEvery = () => [...items.filter(i => i.kind === 'doll'), ...roamGuests()];   // 這一間看得到的每一隻（含客人）
const roamHas = it => items.includes(it) || roamGuests().includes(it);
let roamDolls = () => [...items.filter(i => i.kind === 'doll' && ROAM_P[i.id]), ...roamGuests().filter(i => ROAM_P[i.id])];   // 第二步（js/roam2.js）會再包一層：出門去隔壁的不算
const roamTripMax = () => 4 + Math.floor(Math.random() * 3);   // 晃幾次就回家：4～6，每次回家後重抽
const roamSt = it => (RS[it.uid] = RS[it.uid] || {x: null, y: null, sit: null, seat: 0, busy: false, next: Date.now() + rnd(4, 12) * 1000, trips: 0, tripMax: roamTripMax(), rest: 0});
const roamAway = st => !!st && (st.x !== null || st.sit !== null);
// 這隻現在畫在哪裡（在外面晃就是晃到的位置，不然就是家）
function roamPos(it){
  const st = RS[it.uid];
  if (st && st.sit !== null){ const f = items.find(o => o.uid === st.sit && o.kind === 'furn'); if (f){ const [x, y] = seatPos(f, st.seat); return [x, y + .5, f]; } st.sit = null; }
  if (st && st.x !== null) return [st.x, st.y, null];
  return [it.x, it.y, it.sit ? items.find(o => o.uid === it.sit) : null];
}
// 把一隻娃娃畫到牠現在該在的地方（只動畫面上的元素，不動存檔）
function roamApply(it, el){
  const st = RS[it.uid];
  if (!el || !roamAway(st)) return false;
  const [x, y, f] = roamPos(it);
  if (!roamAway(st)) return false;   // 坐的家具被收走了：回到家
  const v = {kind: 'doll', id: it.id, x, y, sit: f ? f.uid : null, seat: st.seat, uid: it.uid};
  el.style.left = x + '%'; el.style.top = roomY(y) + '%'; el.style.width = sizeOf(v)[0] + '%';
  el.style.zIndex = f ? zOf(f) + 1 + st.seat : 20 + Math.round(y * 3) + 1;
  el.classList.toggle('sit', !!f); el.classList.toggle('breathe', !f);
  [...el.classList].forEach(c => { if (c.startsWith('sp-')) el.classList.remove(c); });
  if (f && FURN[f.id].own === it.id && !it.guest) el.classList.add('sp-' + f.id);
  return true;
}
/* 同一個位置不能有兩隻：自己晃去坐的那隻，碰到存檔裡坐在那裡的（玩家剛拖上去、旅行或過夜回來坐回原位）
   或另一隻也晃去坐同一格的，就讓晃去的那隻起來回家。不然兩隻畫在同一個點、層級一樣，後面那隻整個被蓋住 */
function roamUnstack(){
  const all = roamEvery();
  all.forEach((o, i) => {
    const st = RS[o.uid]; if (!st || st.sit === null) return;
    const k = st.seat || 0;
    // 兩隻都是晃去的：排前面的留著，後面的起來
    const clash = all.some((p, j) => p !== o && ((p.sit === st.sit && (p.seat || 0) === k) || (j < i && RS[p.uid] && RS[p.uid].sit === st.sit && (RS[p.uid].seat || 0) === k)));
    if (clash) roamHome(o);
  });
}
function roamPaint(){
  roamUnstack();
  room.querySelectorAll('.it.doll').forEach(el => { const it = items.find(i => String(i.uid) === el.dataset.u); if (it) roamApply(it, el); });
  roamGuests().forEach(it => roamApply(it, elFor(it)));
}
// 回到家：把蓋過去的位置拿掉，照存檔的樣子畫回去
function roamHome(it){
  const st = RS[it.uid]; if (!st) return;
  clearTimeout(st.timer); st.busy = false; st.x = null; st.y = null; st.sit = null; st.trips = 0; st.tripMax = roamTripMax();
  const el = it.guest ? elFor(it) : room.querySelector(`.it[data-u="${it.uid}"]`);
  if (!el) return;
  el.style.transition = ''; const b = el.querySelector('.body'); if (b) b.classList.remove('roam-hop');
  // 照存檔的樣子畫回去。不叫 render()：它會順便存檔，娃娃自己回家不應該觸發存檔
  el.style.left = it.x + '%'; el.style.top = roomY(it.y) + '%'; el.style.width = sizeOf(it)[0] + '%'; el.style.zIndex = zOf(it);
  el.classList.toggle('sit', !!it.sit); el.classList.toggle('breathe', !it.sit);
  if (typeof furnSpecial === 'function') furnSpecial();
  roamPaint();
}
function roamReset(){ Object.keys(RS).forEach(k => { clearTimeout(RS[k].timer); delete RS[k]; }); }

/* ---------- 一跳一跳 ---------- */
function roamHopTo(it, tx, ty, done){
  if (it.guest && !elFor(it)) return;   // 客人還沒畫出來
  const st = roamSt(it), P = ROAM_P[it.id], el = elFor(it), [sx, sy] = roamPos(it);
  st.sit = null; st.x = sx; st.y = sy; st.busy = true;
  const n = Math.max(1, Math.ceil(Math.hypot(tx - sx, (ty - sy) * .8) / 10));
  let i = 0;
  const end = ok => { const b = el.querySelector('.body'); if (b) b.classList.remove('roam-hop'); el.style.transition = ''; st.busy = false; if (ok && done) done(); };
  const step = () => {
    if (!el.isConnected || RS[it.uid] !== st || st.x === null){ end(false); return; }
    i++;
    st.x = sx + (tx - sx) * i / n; st.y = sy + (ty - sy) * i / n;
    el.style.transition = `left ${P.hop}ms linear, top ${P.hop}ms linear`;
    roamApply(it, el);
    const b = el.querySelector('.body');
    b.style.setProperty('--hop', P.high ? '-52%' : '-26%'); b.style.setProperty('--hopt', P.hop + 'ms');
    b.classList.remove('roam-hop'); void b.offsetWidth; b.classList.add('roam-hop');
    st.timer = setTimeout(i < n ? step : () => end(true), P.hop + 40);
  };
  step();
}
const roamSeatTaken = (f, k, me) => roamEvery().some(o => o.uid !== me && ((o.sit === f.uid && o.seat === k) || (RS[o.uid] && RS[o.uid].sit === f.uid && RS[o.uid].seat === k)));
function roamSeats(it, want){
  const out = [];
  items.forEach(f => { if (f.kind !== 'furn' || !FURN[f.id].seats) return; if (want && !want(f)) return; FURN[f.id].seats.forEach((_, k) => { if (!roamSeatTaken(f, k, it.uid)) out.push([f, k]); }); });
  return out;
}
function roamSitOn(it, f, k){
  const [x, y] = seatPos(f, k), st = roamSt(it);
  roamFree = true;
  try { roamHopTo(it, x, Math.max(56, Math.min(95, y)), () => { if (roamSeatTaken(f, k, it.uid) || !items.includes(f)) return; st.x = null; st.y = null; st.sit = f.uid; st.seat = k; roamApply(it, elFor(it)); }); }
  finally { roamFree = false; }
}
function roamSay(it, text){
  const [x, y] = roamPos(it), st = RS[it.uid], o = {kind: 'doll', id: it.id, x, y, sit: (st && st.sit) || it.sit};
  // 客人頭上有名牌（js/stay.js）：泡泡要放在名牌上面，不然看不出是哪一隻在講（js/main.js 的 sayFit 會用 tagH）
  if (it.guest){ const el = elFor(it), t = el && el.querySelector('.st-tag'); if (t) o.tagH = t.offsetHeight; }
  say(o, text);
}
/* 不要每次都一樣（2026-11-28）：
   - 台詞：每隻最近講過的 4 句記在這台裝置（localStorage），抽的時候避開。只是畫面效果，不進存檔、不上雲端。
   - 小動作：蛋黃哥多一種歪頭看、火腿多一種轉一圈（個性資料在 js/roamdata.js，這裡只補，不改那個檔）。 */
const ROAM_RECENT_KEY = 'shubingNest.roamRecent', ROAM_RECENT_N = 4;
const ROAM_IDLE_ADD = {egg: ['look'], piggy: ['spin']};
let roamRecent = {};
try { const o = JSON.parse(localStorage.getItem(ROAM_RECENT_KEY) || '{}'); if (o && typeof o === 'object' && !Array.isArray(o)) roamRecent = o; } catch (e) {}
function roamLine(id, avoid){
  const L = ROAM_LINES[id]; if (!L || !L.length) return '';
  const r = Array.isArray(roamRecent[id]) ? roamRecent[id] : [];
  let c = L.filter(s => !r.includes(s) && s !== avoid);
  if (!c.length) c = L.filter(s => s !== avoid);
  if (!c.length) c = L;
  const s = c[Math.floor(Math.random() * c.length)];
  roamRecent[id] = [...r.filter(x => x !== s), s].slice(-ROAM_RECENT_N);
  try { localStorage.setItem(ROAM_RECENT_KEY, JSON.stringify(roamRecent)); } catch (e) {}
  return s;
}
const roamIdles = id => [...(ROAM_P[id] ? ROAM_P[id].idle : []), ...(ROAM_IDLE_ADD[id] || [])];
function roamIdle(it, kind){
  const el = elFor(it); if (!el) return;
  const b = el.querySelector('.body'), c = 'roam-' + kind;
  b.classList.remove(c); void b.offsetWidth; b.classList.add(c);
  setTimeout(() => b.classList.remove(c), 1500);
}

/* ---------- 每隻自己決定做什麼 ---------- */
function roamPaused(){
  return !roamOn || document.hidden || (typeof page !== 'undefined' && page !== 'room') || (typeof yardOn !== 'undefined' && yardOn) || !!drag
    || !$('#sheet').hidden || !$('#cover').hidden || !!screen.querySelector('.over:not(.phov)') || Date.now() < roamHold;   // 拍照、拍完的預覽（.phov）不停
}
/* 專屬家具（2026-11-28 修）：
   - 坐在自己的專屬家具上時不再抽 own（以前 roamSeatTaken 把自己坐的位子算成空位，會在原地一直重跳）。
   - 晃過去坐上之後待 60～120 秒才離開；離開後 3～5 分鐘內不再去。玩家本來就擺在專屬家具上的（在家）不限制。
   - own 跟其他出門的動作一樣 trips++，晃夠了真的會回家。 */
const roamOwnOf = (it, uid) => uid !== null && uid !== undefined && items.some(f => f.uid === uid && f.kind === 'furn' && FURN[f.id].own === it.id);
const roamOwnStay = (it, st) => !!st && st.sit !== null && !!st.ownAt && Date.now() < st.ownAt + st.ownStay && roamOwnOf(it, st.sit);   // js/roam2.js 也會看
function roamAct(it, st, canMove){
  const P = ROAM_P[it.id], seated = st.sit !== null || (!roamAway(st) && !!it.sit);
  const w = Object.assign({}, P.w);
  if (!canMove || REDUCE) ['move', 'sit', 'own', 'follow', 'hide'].forEach(k => delete w[k]);
  if (REDUCE) delete w.idle;
  const now = Date.now();
  const onOwn = roamOwnOf(it, st.sit) || (!roamAway(st) && roamOwnOf(it, it.sit));   // 現在坐在自己的專屬家具上（晃過去的或本來就在家）
  const stay = roamOwnStay(it, st);
  if (st.ownOn && !roamOwnOf(it, st.sit)){ st.ownOn = false; st.ownOff = now; st.ownCool = rnd(180, 300) * 1000; }   // 剛離開（或沒坐成）：開始冷卻
  const own = it.guest || onOwn || st.ownOn || now < (st.ownOff || 0) + (st.ownCool || 0) ? [] : roamSeats(it, f => FURN[f.id].own === it.id);   // 客人不去坐專屬家具
  if (!own.length) delete w.own;
  const seats = w.sit ? roamSeats(it, f => !FURN[f.id].own) : [];   // 自己的專屬家具只從 own 去（才有待多久、冷卻）
  if (!seats.length) delete w.sit;
  const others = roamDolls().filter(o => o !== it);
  if (!others.length) delete w.follow;
  const cover = items.filter(f => f.kind === 'furn' && !FURN[f.id].wall && !FURN[f.id].floor);
  if (!cover.length || it.guest) delete w.hide;
  if (stay){ delete w.move; delete w.follow; delete w.hide; delete w.sit; }   // 剛坐上自己的專屬家具：多待一下
  if (!st.acted && w.own) w.own /= 2;                 // 重新打開、換房間後的第一個動作：少一點直接跳去專屬家具
  if (st.lastAct && w[st.lastAct]) w[st.lastAct] /= 2;   // 同一個動作不要連著來
  st.acted = true;
  // 晃出去夠久了：回家
  if (st.trips >= (st.tripMax || 3) && canMove && !REDUCE && !stay){
    const hf = it.sit ? items.find(o => o.uid === it.sit && o.kind === 'furn') : null, [hx, hy] = hf ? seatPos(hf, it.seat) : [it.x, it.y];
    // 家（玩家擺的位置）如果會被家具擋住，就不回去了，繼續在看得到的地方晃（js/seen.js）
    if (!hf && typeof seenHidden === 'function' && seenHidden(it.id, hx, hy)){ st.trips = 0; st.tripMax = roamTripMax(); }
    else { roamFree = !!hf; try { roamHopTo(it, hx, Math.max(40, hy), () => roamHome(it)); } finally { roamFree = false; } st.trips = 0; st.tripMax = roamTripMax(); return; }
  }
  const keys = Object.keys(w); if (!keys.length) return;
  let r = Math.random() * keys.reduce((a, k) => a + w[k], 0), act = keys[0];
  for (const k of keys){ r -= w[k]; if (r <= 0){ act = k; break; } }
  st.lastAct = act;
  const [x, y] = roamPos(it);
  if (act === 'move'){ st.trips++; if (Math.random() < .5) roamWalk(it, st, x, y); else roamHopTo(it, Math.max(10, Math.min(90, x + rnd(-28, 28))), Math.max(60, Math.min(94, y + rnd(-14, 14)))); }
  else if (act === 'sit'){ st.trips++; const [f, k] = seats[Math.floor(Math.random() * seats.length)]; roamSitOn(it, f, k); }
  else if (act === 'own'){ st.trips++; st.ownOn = true; st.ownAt = Date.now(); st.ownStay = rnd(60, 120) * 1000; const [f, k] = own[0]; roamSitOn(it, f, k); }
  else if (act === 'follow'){ st.trips++; const o = others[Math.floor(Math.random() * others.length)], [ox, oy] = roamPos(o); roamHopTo(it, Math.max(10, Math.min(90, ox + (ox > 50 ? -9 : 9))), Math.max(60, Math.min(94, oy + 1))); }
  else if (act === 'hide'){
    // 躲在家具後面：故意被擋住，躲一下就出來（js/seen.js 過 7 秒會讓牠跳到看得到的地方）
    st.trips++; const f = cover[Math.floor(Math.random() * cover.length)];
    roamFree = true;
    try { roamHopTo(it, Math.max(10, Math.min(90, f.x + rnd(-3, 3))), Math.max(58, Math.min(92, f.y - 2)), () => { st.hid = Date.now(); }); } finally { roamFree = false; }
    st.hid = Date.now();
  }
  else if (act === 'idle'){ const all = roamIdles(it.id), list = seated ? all.filter(k => k !== 'jump') : all; if (list.length) roamIdle(it, list[Math.floor(Math.random() * list.length)]); }
  else if (act === 'talk'){ const s = roamLine(it.id, st.last); st.last = s; if (s) roamSay(it, s); }
}
/* 走遠一點（2026-11-28）：move 有一半是在整個地板上挑一個點。離得遠的話，先跳到半路停一下再走完，像在散步。
   落點一樣會經過 js/seen.js（被家具擋住就換位置）。半路停的時候有別的事插進來（被拖、回家、去坐、睡覺、停下來），就留在半路。 */
const roamCap = () => (roamDolls().length >= 4 ? 3 : 2);   // 同時在跳的上限
const roamMoving = () => roamDolls().filter(d => RS[d.uid] && RS[d.uid].busy).length;
function roamWalk(it, st, x, y){
  const tx = rnd(10, 90), ty = rnd(60, 94);
  if (Math.hypot(tx - x, (ty - y) * .8) < 30){ roamHopTo(it, tx, ty); return; }
  const mx = Math.max(10, Math.min(90, (x + tx) / 2 + rnd(-8, 8))), my = Math.max(60, Math.min(94, (y + ty) / 2 + rnd(-6, 6)));
  roamHopTo(it, mx, my, () => {
    if (RS[it.uid] !== st) return;
    const px = st.x, py = st.y, wait = rnd(1, 2.5) * 1000;
    st.next = Math.max(st.next, Date.now() + wait + 1000);
    st.timer = setTimeout(() => {
      if (RS[it.uid] !== st || st.x !== px || st.y !== py || st.sit !== null || st.busy || !roamHas(it)) return;
      if (roamPaused() || REDUCE || roamMoving() >= roamCap() || (typeof asleep === 'function' && asleep(it.id))) return;
      roamHopTo(it, tx, ty);
    }, wait);
  });
}
// 兩個動作之間隔幾秒（2026-11-28 比 js/roamdata.js 的 every 短大約三分之一，快慢照舊；那個檔不改，這裡蓋過去）
const ROAM_EVERY = {sloth: [15, 28], egg: [25, 45], dog: [4, 8], moodeng: [5, 10], nyanko: [8, 15], dino: [7, 13], snoopy: [8, 15], piggy: [8, 15]};
const roamEveryOf = id => ROAM_EVERY[id] || ROAM_P[id].every.map(v => v * 2 / 3);
function roamTick(){
  if (roamPaused()) return;
  const now = Date.now(), dolls = roamDolls();
  let moving = dolls.filter(d => RS[d.uid] && RS[d.uid].busy).length;
  const cap = dolls.length >= 4 ? 3 : 2;
  for (const it of dolls){
    const st = roamSt(it);
    if (st.busy || now < st.rest) continue;
    if (typeof asleep === 'function' && asleep(it.id)){
      // 晚上：還沒坐著的，自己找一個空位睡（床優先），之後就不動了
      if (!st.slept && !REDUCE && moving < cap && !it.sit && st.sit === null){
        const s = roamSeats(it, f => !FURN[f.id].own || (FURN[f.id].own === it.id && !it.guest)).sort((a, b) => (b[0].id === 'bed') - (a[0].id === 'bed'));
        if (s.length){ roamSitOn(it, s[0][0], s[0][1]); moving++; }
      }
      st.slept = true; continue;
    }
    if (st.slept){ st.slept = false; st.trips = st.tripMax || 3; }   // 睡醒：下一個動作是回家
    if (now < st.next) continue;
    const before = st.busy;
    roamAct(it, st, moving < cap);
    if (st.busy && !before) moving++;
    const [a, b] = roamEveryOf(it.id); st.next = Math.max(st.next, now + rnd(a, b) * 1000);
  }
}
function roamStart(){ clearInterval(roamTimer); if (roamOn && !document.hidden) roamTimer = setInterval(roamTick, 1000); }
document.addEventListener('visibilitychange', roamStart);   // 頁面在背景時停掉計時器

/* ---------- 跟原本的畫房間、拖娃娃接起來 ---------- */
// 房間每次重畫完，把在外面晃的娃娃蓋回牠晃到的位置
{ const prev = render; render = function(){ prev(); roamPaint(); }; }
// 換房間、進出朋友家：全部從家開始
{ const prev = load; load = function(){ roamReset(); prev(); }; }
// 玩家抓起一隻在外面晃的娃娃：從牠現在的位置開始拖（先把那個位置暫時當成家）
let roamGrab = null;
room.addEventListener('pointerdown', e => {
  const el = (typeof dollUnder === 'function' && dollUnder(e)) || (e.target.closest && e.target.closest('.it')); if (!el) return;   // 被家具、背包蓋住的娃娃也算（room.js 的 dollUnder）
  const it = items.find(i => String(i.uid) === el.dataset.u); if (!it) return;
  if (it.kind !== 'doll'){ roamHold = Date.now() + 15000; return; }
  if (VISIT) return;
  const st = RS[it.uid];
  roamGrab = {it, home: {x: it.x, y: it.y, sit: it.sit, seat: it.seat}, away: false};
  if (st && roamAway(st)){
    const [x, y, f] = roamPos(it);
    clearTimeout(st.timer); st.busy = false; el.style.transition = ''; const b = el.querySelector('.body'); if (b) b.classList.remove('roam-hop');
    roamGrab.away = true; roamGrab.vis = {x, y, sit: f ? f.uid : null, seat: f ? st.seat : 0};
    it.x = x; it.y = y; it.sit = roamGrab.vis.sit; it.seat = roamGrab.vis.seat;
    st.x = null; st.y = null; st.sit = null;
  }
}, true);
addEventListener('pointerup', () => {
  const g = roamGrab; if (!g) return; roamGrab = null;
  const it = g.it, st = roamSt(it);
  const ref = g.away ? g.vis : g.home;
  const moved = !items.includes(it) || Math.abs(it.x - ref.x) > .01 || Math.abs(it.y - ref.y) > .01 || it.sit !== ref.sit;
  if (moved){ st.rest = Date.now() + 60000; st.trips = 0; }   // 放到新的地方：那裡就是新的家，先乖乖待一分鐘
  else if (g.away){
    // 只是點一下：家不變，牠留在原本晃到的地方
    Object.assign(it, g.home);
    if (g.vis.sit !== null){ st.sit = g.vis.sit; st.seat = g.vis.seat; } else { st.x = g.vis.x; st.y = g.vis.y; }
    quiet = true; render(); quiet = false;
  }
  // 玩家把別隻放到某個座位上：原本晃過去坐在那裡的讓開，回自己家
  roamDolls().forEach(o => { const s = RS[o.uid]; if (s && s.sit !== null && items.some(q => q !== o && q.kind === 'doll' && q.sit === s.sit && q.seat === s.seat)) roamHome(o); });
});
// 動收納架（放東西、換分頁）時先停一下
['#items', '.tabs'].forEach(sel => { const e = document.querySelector(sel); if (e) e.addEventListener('pointerdown', () => { roamHold = Date.now() + 15000; }); });

/* ---------- 開關：小屋地圖最下面 ---------- */
function roamToggleHTML(){
  return `<div class="roam-sw"><span>讓娃娃自己玩</span><button class="roam-tg ${roamOn ? 'on' : ''}" data-roam="${roamOn ? 0 : 1}" role="switch" aria-checked="${roamOn}" aria-label="讓娃娃自己玩">${roamOn ? '開' : '關'}</button></div>`;
}
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('[data-roam]'); if (!b) return;
  roamOn = b.dataset.roam === '1';
  try { localStorage.setItem(ROAM_KEY, roamOn ? '1' : '0'); } catch (err) {}
  if (!roamOn){ roamDolls().forEach(roamHome); roamReset(); }
  roamStart();
  toast(roamOn ? '娃娃會自己到處玩了' : '娃娃會乖乖待在你擺的位置');
  if (typeof mapOpen === 'function') mapOpen();
});
roamStart();
