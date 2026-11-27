/* 娃娃轉得動（2026-11-26）
   薯餅、蛋黃哥、皮蛋、貓咪老師是 3D 掃描的，各有一張 24 格的旋轉圖（img/spin/<id>.webp，6×4 格、每格 384 像素、一格 15 度，
   白色貼紙邊那一版，第 0 格跟 img/<id>.png 是同一個角度）。蛋蛋島的 assets/sprites/<id>_spin.webp 每格只有 192 像素，
   手機上會糊，所以用蛋蛋島的模型（assets/models/<id>.glb）和同一套渲染、後製、調色設定重算成兩倍大；
   蛋蛋島那邊的檔案沒有動。重算用的腳本在 ~/Desktop/GitHub收藏/薯餅小窩/工具/旋轉圖/。
   格數越大，娃娃越往畫面右邊轉：第 6 格臉朝右、第 12 格背對、第 18 格臉朝左。
   - 房間裡：跳去別的地方時臉朝移動的方向；講話、互動時轉向對方；「look」是轉 30 度看一下再轉回來；「spin」用真的 24 格轉一圈。
     轉的時候一格一格過去。停下來一陣子，慢慢轉回正面或 3/4 側面。點牠、抓起牠：轉回正面。
   - 相簿那一隻的頁面：手指左右滑可以轉 360 度。
   - 帽子跟著轉：戴頭頂的照頭的位置挪，戴臉上的（墨鏡、腮紅）跟著臉移、轉到側面淡出。
   - 衣服是照正面畫的：穿著衣服的娃娃在房間裡最多轉 30 度，不做轉圈；相簿裡轉超過 30 度衣服先淡出，轉回來再出現。
   - 彈跳豬、龍龍、史努比、火腿沒有 3D 掃描：移動時左右翻面朝移動的方向。
   角度只記在記憶體，不存檔。拍照、明信片照按下快門那一刻的角度畫（側身就畫旋轉圖的那一格，js/photo.js），不先轉回正面。
   這個檔要放在 roam.js、roam2.js、skit.js 後面載入（包它們的函式）。 */
const SPIN = {
  sloth: {src: 'img/spin/sloth.webp', fr: .5},
  egg: {src: 'img/spin/egg.webp', fr: .42},
  // 皮蛋的旋轉圖取景比 img/dog.png 遠（趴著的狗轉起來比較佔位置），放大、挪一點對回原本的大小；頭不在轉軸上（hz＝頭在轉軸前面多少）
  dog: {src: 'img/spin/dog.webp', fit: 'translate(1.7%,-.4%) scale(1.28)', fr: .3, hz: .16},
  nyanko: {src: 'img/spin/nyanko.webp', fr: .4},
};
const SPIN_N = 24, SPIN_STEP = 42;                       // 一格 42 毫秒：轉 90 度大約四分之一秒
const SPIN_FLAT = {piggy: 'l', snoopy: 'l', dino: 'r', moodeng: 'r'};   // 沒有 3D 的四隻：照片本來臉朝哪邊
const SPS = new WeakMap();                               // 元素 → {d, f 現在第幾格, t 要轉到第幾格, …}
const spinLive = new Set();
const spinImg = {};                                      // 娃娃 → 0 還沒載、1 載入中、2 好了
let spinTimer = 0, spinTouch = 0;
const spinMod = f => ((Math.round(f) % SPIN_N) + SPIN_N) % SPIN_N;
const spinSigned = f => f > 12 ? f - 24 : f;             // 0～23 → -11～12

function spinLoad(d){
  if (spinImg[d]) return;
  spinImg[d] = 1;
  const im = new Image();
  im.onload = () => { spinImg[d] = 2; spinMountAll(); };
  im.onerror = () => { spinImg[d] = 0; };                // 載不到：照舊用平面的圖
  im.src = SPIN[d].src;
}
// 把旋轉圖疊在原本那張圖的位置上。可以重複叫，換衣服重畫之後再叫一次就會補回來
function spinMount(host, d){
  if (!SPIN[d]) return null;
  let st = SPS.get(host);
  if (!st){ st = {d, f: 0, t: 0}; SPS.set(host, st); }
  if (spinImg[d] !== 2){ spinLoad(d); return st; }
  const box = host.querySelector('.body') || host;
  if (!box.querySelector('.sp3')){
    const base = [...box.querySelectorAll('img')].find(i => !i.classList.contains('dz-hat') && !i.classList.contains('dz-out'));
    if (!base) return st;
    const sp = document.createElement('i');
    sp.className = 'sp3'; sp.style.backgroundImage = `url(${SPIN[d].src})`;
    if (SPIN[d].fit) sp.style.transform = SPIN[d].fit;
    base.classList.add('sp-base'); base.after(sp);
  }
  spinDraw(host, st);
  return st;
}
function spinMountAll(){
  room.querySelectorAll('.doll[data-d]').forEach(el => spinMount(el, el.dataset.d));
  document.querySelectorAll('.al-ph[data-spin]').forEach(spinAlbum);
}
function spinDraw(host, st){
  const sp = host.querySelector('.sp3'); if (!sp) return;
  const f = spinMod(st.f);
  sp.style.backgroundPosition = `${(f % 6) * 20}% ${Math.floor(f / 6) * 100 / 3}%`;
  spinWear(host, st.d, f);
}
// 帽子、衣服跟著角度調整。位置原本是照正面算的（left、top 是百分比），第一次先記下來
function spinWear(host, d, f){
  const list = host.querySelectorAll('.dz-hat,.dz-out'); if (!list.length) return;
  const a = f * 15 * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), P = SPIN[d];
  list.forEach(e => {
    if (e.dataset.l === undefined){ e.dataset.l = parseFloat(e.style.left) || 0; e.dataset.t = parseFloat(e.style.top) || 0; }
    const L = +e.dataset.l, T = +e.dataset.t;
    if (e.classList.contains('dz-out')){
      // 衣服：30 度以內照常，再過去淡出（60 度全部不見）
      e.style.opacity = Math.max(0, Math.min(1, (c - .5) / .36)).toFixed(2);
      e.style.left = (L + s * 3) + '%';
      return;
    }
    const u = +e.dataset.u || 0, fw = +e.dataset.fw || .4;
    if (e.dataset.a === 'top'){
      // 頭頂的帽子：頭在轉軸上就留在原地；偏一邊的（蝴蝶結、髮夾）或頭不在轉軸上的（皮蛋）繞著轉軸走
      const w = P.hz || 0, x = u * c + w * s, z = -u * s + w * c;
      e.style.left = (L + (x - u) * 100).toFixed(2) + '%';
      e.style.top = (T + (z - w) * 30).toFixed(2) + '%';
    } else {
      // 臉上的（墨鏡、腮紅）：跟著臉往旁邊移、變窄，轉到側面淡出
      const r = fw * (P.fr || .45), w = P.hz || 0;
      e.style.left = (L + (u * c + (w + r) * s - u) * 100).toFixed(2) + '%';
      e.style.scale = Math.max(.05, c).toFixed(3) + ' 1';
      e.style.opacity = Math.max(0, Math.min(1, (c - .3) / .3)).toFixed(2);
    }
  });
}

/* ---------- 一格一格轉 ---------- */
function spinGo(host){ spinLive.add(host); if (!spinTimer) spinTimer = setInterval(spinStep, SPIN_STEP); }
function spinStep(){
  spinLive.forEach(host => {
    const st = SPS.get(host);
    if (!st || !host.isConnected){ spinLive.delete(host); return; }
    if (st.slow && (st.tick = (st.tick || 0) + 1) % 3) return;      // 慢慢轉：三拍走一格
    if (st.turn){ st.f = spinMod(st.f + st.turn.dir); if (--st.turn.n <= 0) st.turn = null; }
    else if (st.f !== st.t){ const diff = ((st.t - st.f + 36) % 24) - 12; st.f = spinMod(st.f + (diff >= 0 ? 1 : -1)); }
    spinDraw(host, st);
    if (!st.turn && st.f === st.t){ spinLive.delete(host); const fn = st.then; st.then = null; if (fn) fn(); }
  });
  if (!spinLive.size){ clearInterval(spinTimer); spinTimer = 0; }
}
// 穿著衣服的娃娃在房間裡最多轉 30 度（衣服是照正面畫的）
const spinDressed = host => !!host.querySelector('.dz-out');
function spinLimit(host, f){
  f = spinMod(f);
  if (!spinDressed(host) || host.classList.contains('al-ph')) return f;
  const g = spinSigned(f);
  return spinMod(Math.max(-2, Math.min(2, g)));
}
// 轉到第幾格。o.slow 慢慢轉、o.then 轉到之後做什麼、o.rest === false 之後不自動轉回正面
function spinTo(host, frame, o){
  o = o || {};
  const st = host && SPS.get(host);
  if (!st){ if (o.then) o.then(); return; }
  clearTimeout(st.restT);
  st.t = spinLimit(host, frame); st.slow = !!o.slow; st.then = o.then || null; st.turn = null;
  if (REDUCE || !host.querySelector('.sp3')){ st.f = st.t; spinDraw(host, st); const fn = st.then; st.then = null; if (fn) fn(); }
  else if (st.f !== st.t) spinGo(host);
  else { const fn = st.then; st.then = null; if (fn) fn(); }
  if (o.rest !== false) spinRestLater(host, st);
}
// 停下來一陣子之後，慢慢轉回面向玩家附近：正面或 3/4 側面（坐著、睡著的轉回正面）
function spinRestLater(host, st, ms){
  clearTimeout(st.restT);
  st.restT = setTimeout(() => {
    if (!host.isConnected) return;
    const rs = host.dataset.u !== undefined ? RS[host.dataset.u] : null;
    if ((rs && rs.busy) || spinLive.has(host) || st.hold){ spinRestLater(host, st, 1500); return; }
    const g = spinSigned(st.f), side = g > 0 ? 1 : g < 0 ? -1 : 0;
    let to = 0;
    if (!host.classList.contains('sit') && !host.classList.contains('sleep')){
      if (Math.abs(g) <= 3 && g !== 0) return;                         // 已經是 3/4 側面以內：不用動
      const opts = side ? [0, 2 * side, 3 * side] : [0];
      to = opts[Math.floor(Math.random() * opts.length)];
    }
    if (spinMod(to) !== st.f) spinTo(host, to, {slow: true, rest: false});
  }, ms || 2400 + Math.random() * 1800);
}
// 真的轉一圈
function spinFull(host){
  const st = SPS.get(host); if (!st || REDUCE || !host.querySelector('.sp3')) return false;
  clearTimeout(st.restT);
  st.t = st.f; st.slow = false; st.then = null; st.turn = {dir: Math.random() < .5 ? 1 : -1, n: SPIN_N};
  spinGo(host); spinRestLater(host, st, 3200);
  return true;
}
// 轉 30 度看一下，再看另一邊，轉回來
function spinLook(host){
  const st = SPS.get(host); if (!st || REDUCE || !host.querySelector('.sp3')) return false;
  const base = st.f, dir = Math.random() < .5 ? 1 : -1;
  const wait = (ms, fn) => setTimeout(() => { if (host.isConnected && !spinLive.has(host)) fn(); }, ms);
  st.hold = true;
  spinTo(host, base + 2 * dir, {rest: false, then: () => wait(520, () =>
    spinTo(host, base - 2 * dir, {rest: false, then: () => wait(520, () => { st.hold = false; spinTo(host, base); })})) });
  setTimeout(() => { st.hold = false; }, 4000);
  return true;
}
// 往 (dx, dy) 的方向看是第幾格。dy 正的是往畫面下方（靠近玩家）＝正面；房間是從前面往下看的，前後的距離看起來比較短，所以乘大一點
function spinDirFrame(dx, dy){
  if (Math.hypot(dx, dy) < 1.5) return null;
  return spinMod(Math.atan2(dx, dy * 1.8) * 180 / Math.PI / 15);
}
const spinHost = it => (it.guest ? elFor(it) : room.querySelector(`.it[data-u="${it.uid}"]`));   // 來過夜的客人（js/stay.js）是另外畫的元素
// 這隻朝 (dx, dy) 看：3D 的轉過去，沒有 3D 的左右翻面
function spinFace(host, d, dx, dy, o){
  if (!host) return;
  if (SPIN[d]){
    let f = spinDirFrame(dx, dy); if (f === null) return;
    if (o && o.soft) f = spinMod(Math.max(-5, Math.min(5, spinSigned(f))));   // 跟別隻講話：最多轉 75 度，看得到臉，不會背對玩家
    spinTo(host, f, o);
  } else if (SPIN_FLAT[d] && Math.abs(dx) > 3){
    host.classList.toggle('flipx', (dx > 0) !== (SPIN_FLAT[d] === 'r'));
  }
}

/* ---------- 接到房間 ---------- */
// 畫娃娃的時候順便掛上旋轉圖
{ const prev = elFor; elFor = function(it){
    const el = prev(it);
    if (it.kind === 'doll'){ if (!el.dataset.d) el.dataset.d = it.id; if (SPIN[it.id] && !el.querySelector('.sp3')) spinMount(el, it.id); }
    return el;
  }; }
// 換衣服會把娃娃的圖整個重畫：補掛一次
{ const prev = redressRoom; redressRoom = function(d){ prev(d); spinMountAll(); }; }
// 跳去別的地方：臉朝移動的方向
{ const prev = roamHopTo; roamHopTo = function(it, tx, ty, done){
    try { const [sx, sy] = roamPos(it); spinFace(elFor(it), it.id, tx - sx, ty - sy); } catch (e) {}
    return prev(it, tx, ty, done);
  }; }
// 回到家：轉回正面
{ const prev = roamHome; roamHome = function(it){ prev(it); const el = spinHost(it); if (el){ el.classList.remove('flipx'); spinTo(el, 0, {slow: true, rest: false}); } }; }
// 小動作：3D 的四隻用真的轉；穿著衣服的不轉圈，改成跳兩下
{ const prev = roamIdle; roamIdle = function(it, kind){
    const el = SPIN[it.id] ? spinHost(it) : null;
    if (el && el.querySelector('.sp3')){
      if (kind === 'spin'){ if (spinDressed(el)) return prev(it, 'jump'); if (spinFull(el)) return; }
      if (kind === 'look' && Date.now() - spinTouch > 1200 && spinLook(el)) return;
    }
    return prev(it, kind);
  }; }
// 講話：旁邊有別隻就轉向牠（牠沒在忙的話也轉過來），旁邊沒有就對著玩家講
function spinNear(it){
  const [x, y] = roamPos(it);
  let best = null, bd = 1e9;
  items.forEach(o => {
    if (o === it || o.kind !== 'doll' || !spinHost(o)) return;
    const [ox, oy] = roamPos(o), dd = Math.hypot(ox - x, (oy - y) * 1.5);
    if (dd < 36 && dd < bd){ bd = dd; best = [o, ox - x, oy - y]; }
  });
  return best;
}
function spinFacePal(a, b){
  const [ax, ay] = roamPos(a), [bx, by] = roamPos(b);
  if (!(RS[a.uid] && RS[a.uid].busy)) spinFace(spinHost(a), a.id, bx - ax, by - ay, {soft: true});
  if (!(RS[b.uid] && RS[b.uid].busy)) spinFace(spinHost(b), b.id, ax - bx, ay - by, {soft: true});
}
{ const prev = roamSay; roamSay = function(it, text){
    try {
      const st = RS[it.uid];
      if (!(st && st.busy)){ const n = spinNear(it); if (n) spinFacePal(it, n[0]); else { const el = spinHost(it); if (el && SPIN[it.id]) spinTo(el, 0); } }
    } catch (e) {}
    return prev(it, text);
  }; }
// 兩隻湊在一起：先面對面
if (typeof roamTogether === 'function'){ const prev = roamTogether; roamTogether = function(a, b){ try { spinFacePal(a, b); } catch (e) {} return prev(a, b); }; }
// 來串門子的娃娃：從門口進來時臉朝裡面
if (typeof rvEl === 'function'){ const prev = rvEl; rvEl = function(uid, v){
    const had = !!room.querySelector(`.rv[data-rv="${uid}"]`), el = prev(uid, v);
    if (!had && el){
      el.dataset.d = v.id;
      const dx = v.side === 'l' ? 30 : -30;
      if (SPIN[v.id]){ const st = spinMount(el, v.id); if (st){ st.f = st.t = spinLimit(el, dx > 0 ? 5 : 19); spinDraw(el, st); spinRestLater(el, st, 2600); } }
      else spinFace(el, v.id, dx, 0);
    }
    return el;
  }; }
// 點牠、抓起牠：轉回正面看你（在自己家、在朋友家都一樣）
room.addEventListener('pointerdown', e => {
  const el = (typeof dollUnder === 'function' && dollUnder(e)) || (e.target.closest && e.target.closest('.doll')); if (!el) return;
  spinTouch = Date.now();
  el.classList.remove('flipx');
  if (SPS.get(el)) spinTo(el, 0, {rest: false});
}, true);

/* ---------- 相簿：手指左右滑，轉 360 度 ---------- */
function spinAlbum(ph){
  const d = ph.dataset.spin;
  if (!SPIN[d]) return;
  const st = spinMount(ph, d);
  if (ph.dataset.on || !ph.querySelector('.sp3')) return;
  ph.dataset.on = '1'; ph.classList.add('spin-on');
  ph.tabIndex = 0; ph.setAttribute('role', 'slider'); ph.setAttribute('aria-label', `${DOLL_NAME[d]}，左右滑可以轉一圈`);
  const set = f => { st.f = st.t = spinMod(f); st.turn = null; spinLive.delete(ph); spinDraw(ph, st); ph.setAttribute('aria-valuenow', st.f * 15); ph.classList.add('spun'); };
  ph.setAttribute('aria-valuemin', 0); ph.setAttribute('aria-valuemax', 345); ph.setAttribute('aria-valuenow', 0);
  const tip = document.createElement('small'); tip.className = 'spin-tip'; tip.textContent = '左右滑，轉一圈'; ph.appendChild(tip);
  let down = false, sx = 0, sf = 0;
  // 相簿本來有「左右滑換一頁」（js/album.js，掛在 #sheet 上）：在照片上滑是轉娃娃，不要讓它換頁
  ph.addEventListener('pointerdown', e => { e.stopPropagation(); down = true; sx = e.clientX; sf = st.f; try { ph.setPointerCapture(e.pointerId); } catch (err) {} });
  ph.addEventListener('pointermove', e => { if (!down) return; const f = spinMod(sf + (e.clientX - sx) / 9); if (f !== st.f) set(f); });
  const up = () => { down = false; };
  ph.addEventListener('pointerup', up); ph.addEventListener('pointercancel', up);
  ph.addEventListener('keydown', e => { if (e.key === 'ArrowRight'){ set(st.f + 1); e.preventDefault(); } else if (e.key === 'ArrowLeft'){ set(st.f - 1); e.preventDefault(); } });
}
new MutationObserver(() => { document.querySelectorAll('.al-ph[data-spin]:not([data-on])').forEach(spinAlbum); })
  .observe(document.querySelector('#sheet'), {childList: true, subtree: true});

// 一開始就在畫面上的娃娃
spinMountAll();
room.querySelectorAll('.it.doll').forEach(el => { const it = items.find(i => String(i.uid) === el.dataset.u); if (it){ el.dataset.d = it.id; spinMount(el, it.id); } });
