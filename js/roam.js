/* 娃娃自己動（第一步，2026-11-26）
   娃娃是玩偶的照片，沒有走路的分解圖，所以移動是「一跳一跳」。每隻每隔一陣子自己決定做一件事：
   跳到別的位置、找空座位坐、去自己的專屬家具、原地小動作、自言自語；晚上自己找地方睡。個性在 js/roamdata.js。
   跟玩家的擺設怎麼並存：
   - 玩家擺的位置（存檔裡的 x、y、坐哪裡）是那隻娃娃的「家」，這裡完全不改它。娃娃晃到哪裡只記在記憶體（RS），
     畫的時候蓋過去而已；不存檔，也不會因為娃娃在動就觸發存檔或雲端寫入。重新打開、換房間再回來，都從家開始。
   - 晃出去兩三次之後會自己回家。
   - 玩家抓起一隻正在外面晃的娃娃：從牠現在的位置開始拖，放下去的地方變成新的家；只是點一下的話，家不變。
   - 剛被玩家拖過的娃娃先待一分鐘。
   - 玩家正在拖東西、剛動過收納架、開著面板、拍照時，全部停下來。
   - 同時最多兩隻在移動。裝置開了「減少動態效果」的話不移動，只冒字。
   - 小屋地圖最下面有開關「讓娃娃自己玩」，預設開，只記在這台裝置。
   去朋友家時朋友的娃娃也會動，只是畫面效果，不寫任何資料。 */
const ROAM_KEY = 'shubingNest.roam';
let roamOn = true;
try { roamOn = localStorage.getItem(ROAM_KEY) !== '0'; } catch (e) {}
const RS = {};                 // uid → {x, y, sit, seat, busy, next, trips, rest, …}；x 是 null = 在家
let roamHold = 0, roamTimer = 0;
const rnd = (a, b) => a + Math.random() * (b - a);
let roamDolls = () => items.filter(i => i.kind === 'doll' && ROAM_P[i.id]);   // 第二步（js/roam2.js）會再包一層：出門去隔壁的不算
const roamSt = it => (RS[it.uid] = RS[it.uid] || {x: null, y: null, sit: null, seat: 0, busy: false, next: Date.now() + rnd(4, 12) * 1000, trips: 0, rest: 0});
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
  if (!roamAway(st)) return false;
  const [x, y, f] = roamPos(it);
  if (!roamAway(st)) return false;   // 坐的家具被收走了：回到家
  const v = {kind: 'doll', id: it.id, x, y, sit: f ? f.uid : null, seat: st.seat, uid: it.uid};
  el.style.left = x + '%'; el.style.top = roomY(y) + '%'; el.style.width = sizeOf(v)[0] + '%';
  el.style.zIndex = f ? zOf(f) + 1 + st.seat : 20 + Math.round(y * 3) + 1;
  el.classList.toggle('sit', !!f); el.classList.toggle('breathe', !f);
  [...el.classList].forEach(c => { if (c.startsWith('sp-')) el.classList.remove(c); });
  if (f && FURN[f.id].own === it.id) el.classList.add('sp-' + f.id);
  return true;
}
function roamPaint(){
  room.querySelectorAll('.it.doll').forEach(el => { const it = items.find(i => String(i.uid) === el.dataset.u); if (it) roamApply(it, el); });
}
// 回到家：把蓋過去的位置拿掉，照存檔的樣子畫回去
function roamHome(it){
  const st = RS[it.uid]; if (!st) return;
  clearTimeout(st.timer); st.busy = false; st.x = null; st.y = null; st.sit = null; st.trips = 0;
  const el = room.querySelector(`.it[data-u="${it.uid}"]`);
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
const roamSeatTaken = (f, k, me) => items.some(o => o.kind === 'doll' && o.uid !== me && ((o.sit === f.uid && o.seat === k) || (RS[o.uid] && RS[o.uid].sit === f.uid && RS[o.uid].seat === k)));
function roamSeats(it, want){
  const out = [];
  items.forEach(f => { if (f.kind !== 'furn' || !FURN[f.id].seats) return; if (want && !want(f)) return; FURN[f.id].seats.forEach((_, k) => { if (!roamSeatTaken(f, k, it.uid)) out.push([f, k]); }); });
  return out;
}
function roamSitOn(it, f, k){
  const [x, y] = seatPos(f, k), st = roamSt(it);
  roamHopTo(it, x, Math.max(56, Math.min(95, y)), () => { if (roamSeatTaken(f, k, it.uid) || !items.includes(f)) return; st.x = null; st.y = null; st.sit = f.uid; st.seat = k; roamApply(it, elFor(it)); });
}
function roamSay(it, text){ const [x, y] = roamPos(it), st = RS[it.uid]; say({kind: 'doll', id: it.id, x, y, sit: (st && st.sit) || it.sit}, text); }
function roamIdle(it, kind){
  const b = elFor(it).querySelector('.body'), c = 'roam-' + kind;
  b.classList.remove(c); void b.offsetWidth; b.classList.add(c);
  setTimeout(() => b.classList.remove(c), 1500);
}

/* ---------- 每隻自己決定做什麼 ---------- */
function roamPaused(){
  return !roamOn || document.hidden || (typeof page !== 'undefined' && page !== 'room') || (typeof yardOn !== 'undefined' && yardOn) || !!drag
    || (typeof photoBusy !== 'undefined' && photoBusy) || !$('#sheet').hidden || !$('#cover').hidden || !!screen.querySelector('.over') || Date.now() < roamHold;
}
function roamAct(it, st, canMove){
  const P = ROAM_P[it.id], seated = st.sit !== null || (!roamAway(st) && !!it.sit);
  const w = Object.assign({}, P.w);
  if (!canMove || REDUCE) ['move', 'sit', 'own', 'follow', 'hide'].forEach(k => delete w[k]);
  if (REDUCE) delete w.idle;
  const own = roamSeats(it, f => FURN[f.id].own === it.id);
  const onOwn = st.sit !== null && own.length === 0 && items.some(f => f.uid === st.sit && FURN[f.id].own === it.id);
  if (!own.length) delete w.own;
  const seats = w.sit ? roamSeats(it, f => !FURN[f.id].own || FURN[f.id].own === it.id) : [];
  if (!seats.length) delete w.sit;
  const others = roamDolls().filter(o => o !== it);
  if (!others.length) delete w.follow;
  const cover = items.filter(f => f.kind === 'furn' && !FURN[f.id].wall && !FURN[f.id].floor);
  if (!cover.length) delete w.hide;
  if (onOwn){ delete w.move; delete w.follow; delete w.hide; delete w.sit; }   // 在自己的專屬家具上：多待一下
  // 晃出去夠久了：回家
  if (st.trips >= 3 && canMove && !REDUCE){
    const hf = it.sit ? items.find(o => o.uid === it.sit && o.kind === 'furn') : null, [hx, hy] = hf ? seatPos(hf, it.seat) : [it.x, it.y];
    roamHopTo(it, hx, Math.max(40, hy), () => roamHome(it)); st.trips = 0; return;
  }
  const keys = Object.keys(w); if (!keys.length) return;
  let r = Math.random() * keys.reduce((a, k) => a + w[k], 0), act = keys[0];
  for (const k of keys){ r -= w[k]; if (r <= 0){ act = k; break; } }
  const [x, y] = roamPos(it);
  if (act === 'move'){ st.trips++; roamHopTo(it, Math.max(10, Math.min(90, x + rnd(-28, 28))), Math.max(60, Math.min(94, y + rnd(-14, 14)))); }
  else if (act === 'sit'){ st.trips++; const [f, k] = seats[Math.floor(Math.random() * seats.length)]; roamSitOn(it, f, k); }
  else if (act === 'own'){ st.trips = 1; const [f, k] = own[0]; roamSitOn(it, f, k); }
  else if (act === 'follow'){ st.trips++; const o = others[Math.floor(Math.random() * others.length)], [ox, oy] = roamPos(o); roamHopTo(it, Math.max(10, Math.min(90, ox + (ox > 50 ? -9 : 9))), Math.max(60, Math.min(94, oy + 1))); }
  else if (act === 'hide'){ st.trips++; const f = cover[Math.floor(Math.random() * cover.length)]; roamHopTo(it, Math.max(10, Math.min(90, f.x + rnd(-3, 3))), Math.max(58, Math.min(92, f.y - 2))); }
  else if (act === 'idle'){ const list = seated ? P.idle.filter(k => k !== 'jump') : P.idle; if (list.length) roamIdle(it, list[Math.floor(Math.random() * list.length)]); }
  else if (act === 'talk'){ const L = ROAM_LINES[it.id]; let i = Math.floor(Math.random() * L.length); if (i === st.last) i = (i + 1) % L.length; st.last = i; roamSay(it, L[i]); }
}
function roamTick(){
  if (roamPaused()) return;
  const now = Date.now(), dolls = roamDolls();
  let moving = dolls.filter(d => RS[d.uid] && RS[d.uid].busy).length;
  for (const it of dolls){
    const st = roamSt(it);
    if (st.busy || now < st.rest) continue;
    if (typeof asleep === 'function' && asleep(it.id)){
      // 晚上：還沒坐著的，自己找一個空位睡（床優先），之後就不動了
      if (!st.slept && !REDUCE && moving < 2 && !it.sit && st.sit === null){
        const s = roamSeats(it, f => !FURN[f.id].own || FURN[f.id].own === it.id).sort((a, b) => (b[0].id === 'bed') - (a[0].id === 'bed'));
        if (s.length){ roamSitOn(it, s[0][0], s[0][1]); moving++; }
      }
      st.slept = true; continue;
    }
    if (st.slept){ st.slept = false; st.trips = 3; }   // 睡醒：下一個動作是回家
    if (now < st.next) continue;
    const before = st.busy;
    roamAct(it, st, moving < 2);
    if (st.busy && !before) moving++;
    const [a, b] = ROAM_P[it.id].every; st.next = now + rnd(a, b) * 1000;
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
  const el = e.target.closest && e.target.closest('.it'); if (!el) return;
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
