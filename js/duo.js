/* 玩偶之間的互動（2026-11-28 起）：照使用者家裡真的玩偶會做的事，一組一組加。接在 js/roam.js、roam2.js、spin.js、seen.js、photo.js 後面。
   第一組：蛋黃哥側著塞進龍龍裡。塞好的樣子直接用使用者的照片（img/duo/egg-dino.webp：照片去背、加跟其他娃娃一樣的白邊，
   龍龍下面薯餅的腳和背景都切掉了）。使用者說要跟照片一模一樣。
   - 蛋黃哥跟龍龍在同一間、兩隻都醒著、龍龍站在地上沒在忙：蛋黃哥自己決定做什麼的時候，有時候會去塞。
     玩家把兩隻放在一起（把蛋黃哥放到龍龍旁邊，或反過來），蛋黃哥會馬上去塞（2026-11-28）；冷卻中就講一句，一次冷卻最多講一次。
     1. 蛋黃哥跳到龍龍旁邊。
     2. 蛋黃哥往龍龍那邊倒、側著身體從龍龍側邊擠進去（一邊扭、一邊縮、身體被龍龍蓋住）。龍龍不轉。
     3. 擠進去之後龍龍鼓一下，換成照片的樣子：龍龍長長一條，蛋黃哥只露出頭。這時候蛋黃哥自己那張圖不畫。
   - 在裡面待 1 分半～3 分半。龍龍照樣會左右跳、講話（照片是臉朝左，往右跳時左右翻過來），兩隻輪流講幾句。
     龍龍不去坐家具、不去躲、不串門子、不轉身。時間到了蛋黃哥從同一邊側著擠出來、站起來。出來之後隔 4～8 分鐘才會再塞。
   - 點露出來的頭是蛋黃哥講話，點龍龍身體是龍龍講話（那隻有小事、小劇場、正在吵架、睡著的時候照原本的反應；
     點頭的時候蛋黃哥有小事要做，牠就先出來）。拖龍龍的話兩隻一起被拿走；放到座位上（龍龍坐下）蛋黃哥就出來。
   - 跟娃娃自己動一樣：塞在哪裡只記在記憶體，不存檔、不會因為這樣寫雲端；重新打開、換房間都從家開始。
     相簿記「一共塞了幾次、第一次是哪天」（S.album.duo，跟著下一次存檔寫；第一次那天馬上存一次）。每塞一次交情加 3。
   - 拍照照畫面拍：拍到的是照片那張；蛋黃哥也算有入鏡（相簿的「一起拍了照」）。
   - 去朋友家時朋友的蛋黃哥和龍龍也會塞，只是畫面效果，不寫任何資料。來過夜的客人不塞。「減少動態效果」時不塞。
   要加新的一組：DUO_TUCK 多一筆（a 塞進 b 裡），照片、大小、台詞都在那一筆裡。 */
const DUO_TUCK = [{
  id: 'egg-dino', a: 'egg', b: 'dino', name: '蛋黃哥會側著塞進龍龍裡',
  pic: 'img/duo/egg-dino.webp?v=1128-10',
  pw: 1.04, pb: .13,        // 照片在 b 的框裡：寬度是 b 的幾倍、底部離框底多少（b 的圖底下本來就有一點空白）
  head: [.51, .05, .14],    // 照片裡 a 的頭：中間的 x、頭頂的 y、頭中間的 y（照片寬高的幾成）
  face: 'l',                // 照片裡 b 的臉朝哪邊
  p: .4, near: .2,          // a 自己決定做什麼時：去塞的機會、沒塞的話跑去 b 旁邊待著的機會
  stay: [90, 210], cool: [240, 480],   // 在裡面待幾秒、出來後隔幾秒才會再塞
  hi: [['a', '借我塞一下。', '欸？好、好啊。'], ['a', '外面好累。我進去了。', '等一下，我還沒說好——'], ['b', '你又要進來喔。', '嗯。這裡剛剛好。'],
       ['a', '讓一下……好，塞好了。', '嘿嘿，我變重了。'], ['b', '蛋黃哥，你怎麼在我身體裡。', '不要問。很舒服。']],
  inA: ['這裡剛剛好。', '暖暖的。', '不要搖。', '我住這裡了。', '外面的事明天再說。', '只露一顆頭就夠了。', '這樣就不用走路了。', '嗯……好想睡。'],
  inB: ['我現在是蛋黃龍。', '坐穩了喔！', '肚子裡有一顆蛋。', '嘿嘿，載你去玩。', '你都不用走路耶。', '好重喔。但是好好玩。', '要出發囉！', '吼——兩個一起吼。'],
  tapA: ['我不在這裡。', '噓。我在龍龍裡面。', '不要拉我出去。', '再五分鐘。', '這裡不用動。'],
  tapB: ['裡面有蛋黃哥喔。', '噓，牠快睡著了。', '不能搖，會掉出來。', '我們現在是一隻。'],
  bye: [['a', '好熱。出來一下。', '下次再來喔！'], ['b', '到站囉！', '……再坐一站不行嗎。'], ['a', '腳麻了。', '你明明沒有在用腳。'], ['b', '我要去玩了，你下車。', '好啦。']],
  pull: ['欸，被拉走了。', '我的蛋黃哥！', '下次再來喔。'],
  wait: ['剛出來，等一下再進去。', '腳還麻麻的，晚點。', '讓我在外面躺一下。'],   // 玩家放到旁邊、可是還在冷卻：a 講一句
}];
const DUO_PUSH = 1700, DUO_OUT = 1300;   // 擠進去、擠出來各要多久（毫秒）
let duoT = null;                          // 正在塞的那一組：{c 設定, a, b, ph:'go'|'in'|'on'|'out', side, t0, until, …}
const duoCool = {};                       // 設定 id → 什麼時候之後才可以再塞（只記在記憶體）
const duoPick = L => L[Math.floor(Math.random() * L.length)];
const duoEl = it => room.querySelector(`.it[data-u="${it.uid}"]`);
const duoAsleep = it => typeof asleep === 'function' && asleep(it.id);
const duoSps = el => (el && typeof SPS !== 'undefined' ? SPS.get(el) : null);
let duoTap = null;                        // 最後一次按在房間的哪裡（點頭還是點身體）
room.addEventListener('pointerdown', e => { duoTap = [e.clientX, e.clientY]; }, true);
{ const img = new Image(); img.src = DUO_TUCK[0].pic; }   // 先載好，換上去的時候不會空一下

// b 現在可不可以讓 a 塞：站在地上、沒在忙、醒著、沒在躲。dropped：玩家剛放下的，放下時的 st.rest 不擋
function duoHostOk(b, dropped){
  const st = RS[b.uid], el = duoEl(b);
  if (!el || !el.offsetParent || el.classList.contains('hiding') || duoAsleep(b) || b.guest) return false;
  if (st && (st.busy || st.sit !== null || (!dropped && Date.now() < st.rest) || st.hid || roamOwnStay(b, st))) return false;
  return !(!(st && roamAway(st)) && b.sit);
}
function duoCan(){ return roamOn && !REDUCE && !(VISIT && VISIT.card) && !(typeof skitOn !== 'undefined' && skitOn); }

/* ---------- 位置：照 b 在畫面上的樣子算（跳起來、呼吸、被拖著走都跟著） ---------- */
function duoGeo(){
  const bEl = duoEl(duoT.b), body = bEl && bEl.querySelector('.body'), R = room.getBoundingClientRect();
  if (!body || !R.width || !R.height) return null;
  const r = body.getBoundingClientRect();
  const cx = (r.left + r.width / 2 - R.left) / R.width * 100, top = (r.top - R.top) / R.height * 100, h = r.height / R.height * 100;
  const bw = parseFloat(bEl.style.width) || 18;
  // a 側躺著貼在 b 的側邊（頭碰到 b、腳在外面），和擠到最裡面的位置（縮成一半，整隻被 b 蓋住）
  const ew = bw * .85, side = duoT.side;
  return {cx, top, h, bw, z: +bEl.style.zIndex || 0, bEl, R,
    edge: [cx + side * (bw * .36 + ew * .78), top + h * .71, ew], inn: [cx + side * bw * .1, top + h * .66, bw * .5]};
}
function duoPut(el, x, y, w, z, rot){
  el.style.transition = ''; el.style.left = x + '%'; el.style.top = y + '%'; el.style.width = w + '%'; el.style.zIndex = z;
  const bd = el.querySelector('.body'); if (bd) bd.style.rotate = rot ? rot.toFixed(1) + 'deg' : '';   // 以腳為中心倒（.body 的原點在底部中間）
}
// b 換成照片／換回來
function duoCombo(bEl, on){
  const body = bEl && bEl.querySelector('.body'); if (!body) return null;
  let pic = body.querySelector('.duo-pic');
  if (on && !pic){
    pic = document.createElement('img'); pic.className = 'duo-pic'; pic.alt = ''; pic.src = duoT.c.pic; pic.draggable = false;
    pic.style.width = duoT.c.pw * 100 + '%'; pic.style.bottom = duoT.c.pb * 100 + '%';
    body.prepend(pic);   // 放第一個：拍照（js/photo.js 的 phSnapDoll）拿 .body 的第一個圖
  }
  if (!on && pic) pic.remove();
  bEl.classList.toggle('duo-combo', !!on);
  if (!on) bEl.classList.remove('flipx');
  return pic;
}
// 照片裡 a 的頭在房間的哪裡（%）。給泡泡、點頭用
function duoHead(bEl, R){
  const pic = bEl.querySelector('.duo-pic'); if (!pic) return null;
  const r = pic.getBoundingClientRect(), c = duoT.c, fx = bEl.classList.contains('flipx') ? 1 - c.head[0] : c.head[0];
  return {x: (r.left + r.width * fx - R.left) / R.width * 100, top: (r.top + r.height * c.head[1] - R.top) / R.height * 100,
    px: r.left + r.width * fx, py: r.top + r.height * c.head[2], rr: r.width * .14};
}
function duoSayA(text){
  if (!duoT || !text) return;
  const st = RS[duoT.a.uid]; if (!st || st.x === null) return;
  say({kind: 'doll', id: duoT.a.id, x: st.x, y: st.y, sit: null}, text);
}
const duoSay = (who, text) => { if (!duoT) return; if (who === 'a') duoSayA(text); else roamSay(duoT.b, text); };
function duoFx(it, cls, ms){
  const el = duoEl(it), b = el && el.querySelector('.body'); if (!b || REDUCE) return;
  b.classList.remove(cls); void b.offsetWidth; b.classList.add(cls); setTimeout(() => b.classList.remove(cls), ms || 700);
}
const duoEase = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
// 扭來扭去：左右小搖，越到後面越小
const duoWiggle = t => Math.sin(t * Math.PI * 8) * 7 * (1 - t * .7);

/* ---------- 開始：a 跳到 b 旁邊 ---------- */
function duoTry(it, st){
  if (duoT || !duoCan() || it.guest) return false;
  const c = DUO_TUCK.find(x => x.a === it.id); if (!c) return false;
  if (roamOwnStay(it, st) || duoAsleep(it)) return false;
  const bs = roamDolls().filter(o => o !== it && o.id === c.b && duoHostOk(o)); if (!bs.length) return false;
  const [x, y] = roamPos(it), dist = o => { const [ox, oy] = roamPos(o); return Math.hypot(ox - x, (oy - y) * .8); };
  const b = bs.sort((p, q) => dist(p) - dist(q))[0], [bx, by] = roamPos(b), far = dist(b);   // 有兩隻龍龍：找近的那隻
  if (Date.now() >= (duoCool[c.id] || 0) && Math.random() < c.p) return duoStart(c, it, b);
  if (far > 22 && Math.random() < c.near){   // 待在一起：跳到 b 旁邊
    st.trips++;
    roamHopTo(it, Math.max(10, Math.min(90, bx + (x < bx ? -13 : 13))), Math.max(58, Math.min(94, by + .5)));
    return true;
  }
  return false;
}
function duoStart(c, a, b){
  if (duoT) return false;   // 一次只塞一組
  const sa = roamSt(a), sb = roamSt(b), [x] = roamPos(a), [bx, by] = roamPos(b);
  // a 從哪一邊來就從哪一邊塞；那一邊靠牆、站不下的話換另一邊
  let side = x < bx ? -1 : 1;
  if (bx + side * 13 > 90 || bx + side * 13 < 10) side = -side;
  duoT = {c, a, b, ph: 'go', t0: Date.now(), side};
  sa.trips++; sb.next = Math.max(sb.next, Date.now() + 9000);   // b 先別走開
  roamHopTo(a, Math.max(10, Math.min(90, bx + side * 13)), Math.max(58, Math.min(94, by + .3)), () => {
    if (!duoT || duoT.a !== a || duoT.ph !== 'go') return;
    const [ax, ay] = roamPos(a), [cx, cy] = roamPos(b);
    // 到了：b 只要還站在附近（剛好被別隻拉去跳一下也沒關係，位置會跟著 b）就擠進去
    const bEl = duoEl(b), sb = RS[b.uid], bSit = (sb && sb.sit !== null) || (!(sb && roamAway(sb)) && !!b.sit);
    if (!duoCan() || !bEl || !bEl.offsetParent || bEl.classList.contains('hiding') || bSit || duoAsleep(b) || Math.hypot(cx - ax, (cy - ay) * .8) > 30){ duoDrop(); return; }
    duoPushIn();
  });
  duoLoop();
  return true;
}

/* ---------- 玩家把兩隻放在一起：過一下下蛋黃哥就去塞 ---------- */
// 放下的是 a 或 b、另一隻在同一間、照 duoTry 的算法離 25 以內、放下的那隻站在地上。等 0.6～1 秒讓放下的動作停好再看一次。
// 玩家剛放下設的 st.rest（兩隻都是）這次不擋，其他條件照 duoTry。冷卻還沒到：a 講一句 wait，一次冷卻最多講一次
let duoDropTm = 0;
const duoWaitSaid = {};                   // 設定 id → 已經講過 wait 的那一次冷卻（duoCool 的值）
function duoNear(it){
  if (VISIT || it.guest || it.sit || !items.includes(it)) return null;
  for (const c of DUO_TUCK){
    if (it.id !== c.a && it.id !== c.b) continue;
    const other = it.id === c.a ? c.b : c.a, [x, y] = roamPos(it);
    const dist = o => { const [ox, oy] = roamPos(o); return Math.hypot(ox - x, (oy - y) * .8); };
    const L = roamDolls().filter(o => o !== it && o.id === other && !o.guest && dist(o) <= 25).sort((p, q) => dist(p) - dist(q));
    if (L.length) return it.id === c.a ? {c, a: it, b: L[0]} : {c, a: L[0], b: it};
  }
  return null;
}
roamDropped.push(it => {
  clearTimeout(duoDropTm);
  if (!duoNear(it)) return;
  const rid = roomId;
  duoDropTm = setTimeout(() => {
    if (roomId !== rid || VISIT || duoT || !duoCan()) return;
    if (drag && drag.it && drag.it.kind === 'doll') return;   // 又被拿起來了
    const n = duoNear(it); if (!n) return;
    const {c, a, b} = n, sa = RS[a.uid];
    if (!items.includes(a) || !items.includes(b) || roamOwnStay(a, sa) || duoAsleep(a) || !duoHostOk(b, true)) return;
    const el = duoEl(a); if (!el || !el.offsetParent || el.classList.contains('hiding') || (sa && sa.hid)) return;
    const cool = duoCool[c.id] || 0;
    if (Date.now() < cool){
      if (duoWaitSaid[c.id] !== cool && c.wait){ duoWaitSaid[c.id] = cool; roamSay(a, duoPick(c.wait)); }
      return;
    }
    duoStart(c, a, b);
  }, rnd(600, 1000));
});
function duoPushIn(){
  const el = duoEl(duoT.a); if (!el){ duoDrop(); return; }
  duoT.ph = 'in'; duoT.t0 = Date.now(); duoT.from = [parseFloat(el.style.left), parseFloat(el.style.top), parseFloat(el.style.width)];
  duoT.fx = 0;
  const s = duoSps(el); if (s){ s.hold = true; spinTo(el, 0, {rest: false}); }   // 臉朝前面，側著倒過去
  el.classList.remove('flipx');
  const sb = roamSt(duoT.b); sb.next = Math.max(sb.next, Date.now() + DUO_PUSH + 6000);
}
// 塞好了：換成照片、講兩句、記相簿
function duoSettle(){
  const c = duoT.c, a = duoT.a, b = duoT.b, aEl = duoEl(a), bEl = duoEl(b);
  duoT.ph = 'on'; duoT.until = Date.now() + rnd(c.stay[0], c.stay[1]) * 1000; duoT.talk = Date.now() + rnd(16, 26) * 1000;
  if (aEl){ aEl.style.display = 'none'; const bd = aEl.querySelector('.body'); if (bd) bd.style.rotate = ''; }
  duoCombo(bEl, true); duoFx(b, 'duo-squish', 600);
  roamSt(b).next = Date.now() + rnd(5, 9) * 1000;
  const [who, l1, l2] = duoPick(c.hi);
  setTimeout(() => { if (duoT && duoT.a === a && duoT.ph === 'on') duoSay(who, l1); }, 400);
  setTimeout(() => { if (duoT && duoT.a === a && duoT.ph === 'on') duoSay(who === 'a' ? 'b' : 'a', l2); }, 2600);
  if (VISIT) return;
  if (typeof palBump === 'function') palBump(a.id, b.id, 3);
  const all = S.album.duo = S.album.duo && typeof S.album.duo === 'object' ? S.album.duo : {};
  const r = all[c.id] = all[c.id] || {n: 0, d: todayStr()};
  r.n = (r.n | 0) + 1;
  if (r.n === 1){ save(); setTimeout(() => toast(`${DOLL_NAME[a.id]}塞進${DOLL_NAME[b.id]}裡了`), 5000); }   // 第一次：馬上存，也說一聲
}

/* ---------- 每一格畫面 ---------- */
// 擠進去、擠出來的時候每一格都算；塞好之後照片就在 b 的圖裡跟著 b 走，一秒看五次就好（省電）
let duoRaf = 0, duoTm = 0;
function duoLoop(){
  if (duoRaf || duoTm) return;
  if (duoT && duoT.ph === 'on') duoTm = setTimeout(duoFrame, 200); else duoRaf = requestAnimationFrame(duoFrame);
}
function duoStopLoop(){ if (duoRaf) cancelAnimationFrame(duoRaf); clearTimeout(duoTm); duoRaf = duoTm = 0; }
function duoFrame(){
  duoRaf = 0; duoTm = 0;
  if (!duoT) return;
  try { duoStep(); } catch (e) { console.info('[duo]', e); duoDrop(); }
  if (duoT) duoLoop();
}
function duoStep(){
  const {a, b} = duoT, aEl = duoEl(a), bEl = duoEl(b), sa = RS[a.uid], now = Date.now();
  if (!aEl || !bEl || !items.includes(a) || !items.includes(b) || !sa){ duoDrop(); return; }
  // 玩家抓 a（還沒塞好之前）：還沒拖動先不動它；拖動了就不塞了
  if (drag && drag.it === a){ if (drag.moved) duoDrop(true); return; }
  if (duoT.ph === 'go'){ if (now - duoT.t0 > 9000 || !duoCan()) duoDrop(); return; }
  const g = duoGeo(); if (!g) return;
  const sb = RS[b.uid], bSit = (sb && sb.sit !== null) || (!(sb && roamAway(sb)) && !!b.sit) || bEl.classList.contains('hiding');
  if (!duoCan() || bEl.style.display === 'none'){ duoDrop(); return; }
  if (bSit || duoAsleep(b)){ if (duoT.ph === 'on') duoOut(); else if (duoT.ph === 'in'){ duoDrop(); return; } }
  if (sb && duoT.ph !== 'on') sb.next = Math.max(sb.next, now + 1500);   // 擠進去、擠出來的時候 b 不要跳走
  sa.busy = true; sa.sit = null; aEl.classList.remove('sit', 'flipx'); aEl.classList.add('breathe');
  const sbs = duoSps(bEl);
  if (duoT.ph === 'in'){
    // 1. 往 b 那邊倒下去、側躺著貼到 b 的側邊（腰的高度，頭碰到 b）
    // 2. 從側邊往裡面擠：一邊扭、一邊縮，畫在 b 後面，身體慢慢被蓋住
    const t = Math.min(1, (now - duoT.t0) / DUO_PUSH), [x0, y0, w0] = duoT.from, [ex, ey, ew] = g.edge, [ix, iy, iw] = g.inn, A = .35;
    aEl.style.display = '';
    if (t < A){
      const k = duoEase(t / A);
      duoPut(aEl, x0 + (ex - x0) * k, y0 + (ey - y0) * k - Math.sin(Math.PI * t / A) * g.h * .08, w0 + (ew - w0) * k, g.z + 1, -duoT.side * 82 * k);
    } else {
      const u = (t - A) / (1 - A), k = duoEase(u);
      duoPut(aEl, ex + (ix - ex) * k, ey + (iy - ey) * k, ew + (iw - ew) * k, g.z - 1, -duoT.side * 82 + duoWiggle(u));
    }
    if (duoT.fx === 0 && t > .5){ duoT.fx = 1; duoFx(b, 'duo-squish', 600); }
    if (t >= 1) duoSettle();
  } else if (duoT.ph === 'on'){
    aEl.style.display = 'none';
    duoCombo(bEl, true);   // 換衣服重畫了 b 的圖：補回來
    if (sbs){ sbs.hold = true; sbs.turn = null; sbs.f = sbs.t = 0; spinLive.delete(bEl); }   // 照片不會轉：b 一直當正面（拍照才會拍照片那張）
    if (now >= duoT.talk && !roamPaused()){
      duoT.talk = now + rnd(24, 44) * 1000;
      if (Math.random() < .5) duoSayA(duoPick(duoT.c.inA)); else roamSay(b, duoPick(duoT.c.inB));
    }
    // 時間到了：b 沒在跳、玩家沒在看面板的時候出來
    if (now >= duoT.until && !(sb && sb.busy) && !roamPaused() && !duoT.byeAt){
      const [who, l1, l2] = duoPick(duoT.c.bye);
      duoSay(who, l1); duoT.byeAt = now + 1400; duoT.bye2 = [who === 'a' ? 'b' : 'a', l2];
    }
    if (duoT.byeAt && now >= duoT.byeAt) duoOut();
    // 點頭、泡泡用的位置：照片裡頭的位置
    const hd = duoHead(bEl, g.R);
    if (hd){ const h = sizeOf({kind: 'doll', id: a.id, x: hd.x, y: b.y, sit: null})[1]; sa.x = hd.x; sa.y = Math.max(40, Math.min(99, roomV(hd.top + h))); }
  } else if (duoT.ph === 'out'){
    // 從同一邊側躺著擠出來（扭著、長回來），整隻出來之後站起來、小跳一下落地
    const t = Math.min(1, (now - duoT.t0) / DUO_OUT), [ix, iy, iw] = g.inn, [ex, ey, ew] = g.edge, [lx, ly] = duoT.land, A = .55;
    const lw = sizeOf({kind: 'doll', id: a.id, x: lx, y: ly, sit: null})[0], lt = roomY(ly);
    aEl.style.display = '';
    if (t < A){
      const u = t / A, k = duoEase(u);
      duoPut(aEl, ix + (ex - ix) * k, iy + (ey - iy) * k, iw + (ew - iw) * k, g.z - 1, -duoT.side * 82 + duoWiggle(u));
    } else {
      const u = (t - A) / (1 - A), k = duoEase(u);
      duoPut(aEl, ex + (lx - ex) * k, ey + (lt - ey) * k - Math.sin(Math.PI * u) * g.h * .14, ew + (lw - ew) * k, g.z + 1, -duoT.side * 82 * (1 - k));
    }
    if (t >= 1) duoLand();
    return;
  }
}
function duoOut(){
  if (!duoT || duoT.ph === 'out') return;
  const [bx, by] = roamPos(duoT.b);
  if (bx + duoT.side * 15 > 90 || bx + duoT.side * 15 < 10) duoT.side = -duoT.side;   // 那一邊靠牆：從另一邊出來
  duoT.ph = 'out'; duoT.t0 = Date.now();
  duoT.land = [Math.max(10, Math.min(90, bx + duoT.side * 15)), Math.max(58, Math.min(95, by + 1))];
  duoCombo(duoEl(duoT.b), false);
  const s = duoSps(duoEl(duoT.b)); if (s){ s.f = s.t = 0; spinDraw(duoEl(duoT.b), s); }
  duoFx(duoT.b, 'duo-squish', 600);
}
function duoLand(){
  const {a, c} = duoT, [lx, ly] = duoT.land, bye = duoT.bye2, b = duoT.b;
  duoCool[c.id] = Date.now() + rnd(c.cool[0], c.cool[1]) * 1000;
  duoFree(lx, ly);
  if (bye) setTimeout(() => { if (bye[0] === 'a'){ if (items.includes(a)) roamSay(a, bye[1]); } else if (items.includes(b)) roamSay(b, bye[1]); }, 500);
}
// 結束：a 回到一般的娃娃（站在 x, y；沒給就照 roam 的狀態畫），b 換回自己的圖
function duoFree(x, y){
  if (!duoT) return;
  const a = duoT.a, b = duoT.b, c = duoT.c, sa = RS[a.uid], el = duoEl(a), bEl = duoEl(b);
  duoCombo(bEl, false);
  duoT = null;
  duoStopLoop();
  if (sa){
    sa.busy = false; clearTimeout(sa.timer);
    if (x !== undefined){ sa.x = x; sa.y = y; sa.sit = null; }
    sa.next = Math.max(sa.next, Date.now() + rnd(8, 16) * 1000);
  }
  if (el){
    el.style.transition = ''; el.style.display = ''; const bd = el.querySelector('.body'); if (bd) bd.style.rotate = '';
    if (!(sa && roamApply(a, el))){ el.style.left = a.x + '%'; el.style.top = roomY(a.y) + '%'; el.style.width = sizeOf(a)[0] + '%'; el.style.zIndex = zOf(a); el.classList.toggle('sit', !!a.sit); el.classList.toggle('breathe', !a.sit); }
    const s = duoSps(el); if (s){ s.hold = false; spinTo(el, 0, {slow: true, rest: false}); }
  }
  const sbs = duoSps(bEl); if (sbs){ sbs.hold = false; spinDraw(bEl, sbs); }
  if (c && !duoCool[c.id]) duoCool[c.id] = Date.now() + 60000;
}
// 中途不塞了（被拖走、換房間、小劇場開演……）。dragged：玩家正拖著 a，位置交給拖曳
function duoDrop(dragged){
  if (!duoT) return;
  const c = duoT.c; duoCool[c.id] = Math.max(duoCool[c.id] || 0, Date.now() + 90000);
  if (dragged || duoT.ph === 'go'){
    const a = duoT.a, sa = RS[a.uid], el = duoEl(a), bEl = duoEl(duoT.b);
    duoCombo(bEl, false);
    duoT = null; duoStopLoop();
    if (sa) sa.busy = false;
    if (el){ el.style.display = ''; const bd = el.querySelector('.body'); if (bd) bd.style.rotate = ''; const s = duoSps(el); if (s) s.hold = false; }
    const sbs = duoSps(bEl); if (sbs) sbs.hold = false;
    return;
  }
  const [bx, by] = items.includes(duoT.b) ? roamPos(duoT.b) : [duoT.a.x, duoT.a.y];
  duoFree(Math.max(10, Math.min(90, bx + (bx > 50 ? -15 : 15))), Math.max(58, Math.min(95, by + 1)));
}

/* ---------- b 載著 a 的時候：只做小小的事（左右跳、講話；照片不會轉，往右跳時左右翻過來） ---------- */
function duoCarry(b, st, canMove){
  if (duoT.ph !== 'on' || duoT.byeAt) return;
  const r = Math.random(), [x, y] = roamPos(b), bEl = duoEl(b);
  if (r < .4 && canMove && !REDUCE){
    const dir = x > 75 ? -1 : x < 25 ? 1 : (Math.random() < .5 ? -1 : 1);
    if (bEl) bEl.classList.toggle('flipx', (dir > 0) === (duoT.c.face === 'l'));
    roamHopTo(b, Math.max(14, Math.min(86, x + dir * rnd(8, 18))), Math.max(62, Math.min(92, y + rnd(-3, 3))));
  } else if (r < .6 && !REDUCE) roamIdle(b, 'jump');
  else roamSay(b, duoPick(duoT.c.inB));
}

/* ---------- 接到娃娃自己動 ---------- */
{
  const act = roamAct;
  roamAct = function(it, st, canMove){
    if (duoT && it === duoT.b){ duoCarry(it, st, canMove); return; }
    if (duoT && it === duoT.a) return;
    if (canMove && duoTry(it, st)) return;
    act(it, st, canMove);
  };
  const dolls = roamDolls;
  roamDolls = () => dolls().filter(i => !(duoT && i === duoT.a));   // 鑽在裡面（或正要去鑽）的那隻自己不動、別隻也不來找牠
  const home = roamHome;
  roamHome = function(it){ if (duoT && it === duoT.a) duoDrop(); return home(it); };
  const reset = roamReset;
  // 換房間、關掉「讓娃娃自己玩」：不鑽了，直接回家
  roamReset = function(){ if (duoT){ const a = duoT.a; duoDrop(); try { if (items.includes(a)) roamHome(a); } catch (e) {} } return reset(); };
}
// 房間重畫時 js/roam2.js 會把娃娃的 display 清掉：塞好的時候馬上把 a 藏回去，b 的照片補回來
{ const prev = roamPaint; roamPaint = function(){ prev(); try { if (duoT && duoT.ph === 'on'){ const e = duoEl(duoT.a); if (e) e.style.display = 'none'; duoCombo(duoEl(duoT.b), true); } } catch (e) {} }; }
// 講話時 spin.js 會讓旁邊那隻轉過來：鑽在一起的兩隻不要互相轉（會變成背對玩家）
if (typeof spinFacePal === 'function'){ const prev = spinFacePal; spinFacePal = function(a, b){ if (duoT && ((a === duoT.a && b === duoT.b) || (a === duoT.b && b === duoT.a))) return; return prev(a, b); }; }
// 點牠們：講一句在裡面時的話（有小事、小劇場、在吵架、睡著的時候照原本的）
{
  const prev = onDollTap;
  const plain = it => {
    try {
      if (duoAsleep(it) || (typeof doable === 'function' && doable().some(e => e.d.includes(it.id)))) return false;
      const f = typeof fightNow === 'function' && fightNow(); if (f && f.k.split('|').includes(it.id)) return false;
      const el = duoEl(it); return !(el && el.querySelector('.skit-bang'));
    } catch (e) { return false; }
  };
  onDollTap = function(it){
    if (duoT && duoT.ph === 'on' && !duoT.byeAt && it === duoT.b){
      // 塞好的時候蛋黃哥那張圖不畫，點到的都是龍龍：按在照片裡頭的位置就當作點蛋黃哥
      const bEl = duoEl(it), hd = bEl && duoHead(bEl, room.getBoundingClientRect());
      const onHead = hd && duoTap && Math.hypot(duoTap[0] - hd.px, duoTap[1] - hd.py) < hd.rr * 1.3;
      if (onHead){
        if (plain(duoT.a)){ duoSayA(duoPick(duoT.c.tapA)); duoFx(it, 'duo-squish', 600); return; }
        // 蛋黃哥有小事、睡著了……：先出來，再照原本點蛋黃哥的反應（泡泡冒在頭的位置）
        const a = duoT.a, sa = RS[a.uid], o = {x: a.x, y: a.y};
        duoOut();
        if (sa && sa.x !== null){ a.x = sa.x; a.y = sa.y; }
        try { return prev(a); } finally { a.x = o.x; a.y = o.y; }
      }
      if (plain(it)){ say(it, duoPick(duoT.c.tapB)); duoFx(it, 'duo-bob', 700); return; }
    }
    return prev(it);
  };
}

// 拍照：塞在裡面的那隻不畫（照片那張已經有牠），但算有入鏡（相簿的「一起拍了照」）
if (typeof phSnapAll === 'function'){ const prev = phSnapAll; phSnapAll = function(R){
    const list = prev(R);
    try {
      if (duoT && duoT.ph === 'on'){
        const host = list.find(o => o && o.D && o.who === duoT.b);
        if (host) list.splice(list.indexOf(host) + 1, 0, {D: {d: duoT.a.id, b: host.D.b, L: [], hop: false, sleep: false, flip: false, eb: host.D.eb}, who: duoT.a, guest: false});
      }
    } catch (e) { console.info('[duo]', e); }
    return list;
  }; }

/* ---------- 相簿：那兩隻的頁面寫一行 ---------- */
function duoRows(d){
  const all = (S.album && S.album.duo) || {};
  const list = DUO_TUCK.filter(c => (c.a === d || c.b === d) && all[c.id] && all[c.id].n > 0);
  if (!list.length) return '';
  return `<div class="al-sec">小習慣</div>${list.map(c => { const r = all[c.id];
    return `<div class="al-cd"><span class="fa"><img src="${SPR[c.a]}" alt=""><img src="${SPR[c.b]}" alt=""></span><p>${c.name}。一共 ${r.n | 0} 次。</p><small>第一次 ${md(r.d)}</small></div>`; }).join('')}`;
}
