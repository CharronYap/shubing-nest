/* 雲端帳號：登入、把這台的進度帶上雲端、換裝置接著玩、好友碼
 *
 * Firebase 專案是小窩自己的 shubing-nest（帳號和好友不跟蛋蛋島共用），小窩的存檔放在 nestSaves/{uid}。
 * 沒登入也能玩，存在這台裝置（訪客存檔）。登入後每個帳號在這台裝置有一份自己的存檔（save.js 的 saveKeyFor），
 * 有改動就等 1.5 秒合成一次寫上雲端。
 *
 * 換帳號、拿雲端的存檔來用時，會把存檔寫好再重新整理一次頁面，畫面上的東西就全部換成新的那份。
 */
import { FIREBASE_CONFIG } from './cloud-config.js';

const params = new URLSearchParams(location.search);
// 測試：?emu=1 連本機的 Firebase 模擬器，永遠用假專案，不碰真的存檔（docs/CLOUD.md）
const EMU = params.has('emu') && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const CFG = EMU ? { apiKey: 'demo-key', authDomain: 'demo-plush.firebaseapp.com', projectId: 'demo-plush', appId: 'demo' } : FIREBASE_CONFIG;
const MSG_KEY = 'shubingNest.msg';

const btn = document.getElementById('coverAcct');
const box = document.getElementById('acct');
let cloud = null, me = null, state = 'guest', pushT = 0, pushing = null, friends = null;

const USER_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8.2" r="4.4"/><path d="M3.8 20.2c.9-4.2 4.2-6.6 8.2-6.6s7.3 2.4 8.2 6.6c.1.6-.3 1.1-.9 1.1H4.7c-.6 0-1-.5-.9-1.1z"/></svg>';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const say = t => { try { toast(t); } catch (e) {} };

/* ---------- 封面左上角的帳號按鈕 ---------- */
function paintBtn() {
  if (!btn) return;
  const name = me ? me.name : '登入';
  btn.innerHTML = `${USER_ICON}<span>${esc(name)}</span>${me ? `<i class="st ${state}"></i>` : ''}`;
  btn.setAttribute('aria-label', me ? `雲端帳號：${me.name}` : '登入雲端帳號');
}
const STATE_TEXT = {
  syncing: '存檔中…',
  synced: '已經存到雲端',
  offline: '離線中，連上網路會自動存到雲端',
  blocked: '雲端存檔還沒開好，進度先存在這台裝置',
};

/* ---------- 存檔：上傳、下載、換帳號 ---------- */
// 上傳的那份：拿掉只有這台裝置要用的 base
function packSave() {
  const d = JSON.parse(JSON.stringify(S));
  delete d.base;
  d.t = d.t || Date.now();
  d.uid = uid;
  return d;
}
// 用另一份存檔（雲端的、合併好的），或換到另一個帳號：寫好、重新整理
function useSave(data, acct, msg) {
  lockSave();
  try {
    if (acct) localStorage.setItem(ACCT_KEY, acct); else localStorage.removeItem(ACCT_KEY);
    if (data) { data.base = data.t; localStorage.setItem(saveKeyFor(acct), JSON.stringify(data)); }
    if (msg) sessionStorage.setItem(MSG_KEY, msg);
  } catch (e) {}
  location.reload();
}
function setState(s) { state = s; paintBtn(); if (!box.hidden && me) paintStatus(); }
function failState(e) {
  console.warn('[account]', e);
  setState(e && e.code === 'permission-denied' ? 'blocked' : 'offline');
}

// 寫上雲端。寫之前先看一下雲端那份：別台裝置後來改過，就換成那份（不拿舊的蓋掉新的）
async function push() {
  if (!me || pushing) return pushing;
  clearTimeout(pushT); pushT = 0;
  const who = me.uid;
  pushing = (async () => {
    setState('syncing');
    try {
      const remote = await cloud.load();
      if (remote && S.base && remote.t !== S.base) { useSave(remote, who, '另一台裝置改過，換成最新的進度'); return; }
      const d = packSave();
      await cloud.save(d, who);
      S.base = d.t; writeLocal();
      setState('synced');
      pushRoom();
    } catch (e) { failState(e); }
  })();
  try { await pushing; } finally { pushing = null; }
  if (me && S.t > (S.base || 0) && state === 'synced') schedulePush();
}
// 公開房間（朋友來家裡看的那份）：只有擺設、燈、娃娃穿什麼。跟上次一樣就不寫。
// 規則還沒發布時會被擋，不影響存檔，也不出聲
let roomSent = '';
const pubRoom = r => ({ wall: r.wall, floor: r.floor, items: r.items, ...(r.light === false ? { light: false } : {}) });
async function pushRoom() {
  if (!me) return;
  const data = { name: me.name.slice(0, 24), home: { living: pubRoom(home.living), bed: pubRoom(home.bed), bath: pubRoom(home.bath) }, look: S.look || {} };
  const key = JSON.stringify(data);
  if (key === roomSent) return;
  try { await cloud.saveRoom({ ...data, t: Date.now() }); roomSent = key; }
  catch (e) { roomSent = key; console.info('[account] 公開房間沒寫上去（規則可能還沒發布）', e && e.code); }
}
function schedulePush() { clearTimeout(pushT); pushT = setTimeout(push, 1500); }

// 打開遊戲、已經登入：雲端那份比較新就換過來，這台比較新就傳上去
async function syncStart() {
  setState('syncing');
  let remote;
  try { remote = await cloud.load(); } catch (e) { failState(e); window.onNestSave = schedulePush; return; }
  if (remote && remote.t !== S.base) { useSave(remote, me.uid); return; }
  window.onNestSave = schedulePush;
  if (!remote || S.t > (S.base || 0)) push(); else setState('synced');
}

// 這台之前沒登入時有沒有玩過（夾過娃娃機、做過小事）
const guestPlayed = g => (g.wins || 0) > 0 || (g.misses || 0) > 0 || (g.day && g.day.done && g.day.done.length > 0);
// 帶進帳號：房間擺設用帳號裡的，娃娃、家具、壁紙、道具、幣取兩邊比較多的
function mergeSave(remote, guest) {
  const m = JSON.parse(JSON.stringify(remote));
  for (const k of ['dollN', 'furnOwn', 'wallOwn', 'floorOwn', 'wish']) {
    m[k] = m[k] || {};
    for (const [id, n] of Object.entries(guest[k] || {})) m[k][id] = Math.max(m[k][id] || 0, n || 0);
  }
  // 相簿：兩邊都留，來的日子和做完的日子取比較早的，聽過的話合在一起
  const ga = guest.album || {}, ma = m.album = m.album || {};
  for (const k of ['met', 'cards']) {
    ma[k] = ma[k] || {};
    for (const [id, d] of Object.entries(ga[k] || {})) if (!ma[k][id] || d < ma[k][id]) ma[k][id] = d;
  }
  ma.heard = ma.heard || {};
  for (const [id, b] of Object.entries(ga.heard || {})) ma.heard[id] = (ma.heard[id] || 0) | b;
  // 看過的夢也合在一起；娃娃之間的感情取比較高的
  ma.dreams = ma.dreams || {};
  for (const [id, b] of Object.entries(ga.dreams || {})) ma.dreams[id] = (ma.dreams[id] || 0) | b;
  ma.pals = ma.pals || {};
  for (const [k, n] of Object.entries(ga.pals || {})) ma.pals[k] = Math.max(ma.pals[k] || 0, n || 0);
  // 衣櫃：擁有的東西合在一起；穿什麼用帳號裡的，帳號裡沒換過的娃娃才用這台的
  m.closet = [...new Set([...(m.closet || []), ...(guest.closet || [])])];
  m.season = [...new Set([...(m.season || []), ...(guest.season || [])])];
  m.look = Object.assign({}, guest.look || {}, m.look || {});
  // 信箱：寄過的、寫過的信合在一起，信箱裡的信兩邊都留（同一封只留一份）
  if (guest.mail) {
    const gm = guest.mail, mm = m.mail = m.mail || {};
    mm.s = Object.assign({}, gm.s || {}, mm.s || {});
    mm.n = mm.n || {};
    for (const [d, n] of Object.entries(gm.n || {})) mm.n[d] = Math.max(mm.n[d] || 0, n || 0);
    mm.arch = mm.arch || {};
    for (const [d, a] of Object.entries(gm.arch || {})) mm.arch[d] = [...new Set([...(mm.arch[d] || []), ...a])].sort().slice(-24);
    const seen = new Set((mm.l || []).map(o => o.t + o.k));
    mm.l = [...(mm.l || []), ...(gm.l || []).filter(o => !seen.has(o.t + o.k))].sort((a, b) => a.t < b.t ? 1 : -1).slice(0, 30);
    mm.last = [mm.last || '', gm.last || ''].sort().pop();
    mm.att = [mm.att || '', gm.att || ''].sort().pop();
  }
  // 門外小島：用帳號裡的那份，帳號裡還沒有才用這台的；種子數量取比較多的
  if (guest.yard) {
    if (!m.yard) m.yard = guest.yard;
    else { const ms = m.yard.seeds = m.yard.seeds || {}; for (const [k, n] of Object.entries(guest.yard.seeds || {})) ms[k] = Math.max(ms[k] || 0, n || 0); }
  }
  m.coins = Math.max(m.coins || 0, guest.coins || 0);
  m.wins = Math.max(m.wins || 0, guest.wins || 0);
  m.t = Date.now();
  return m;
}

// 剛按了登入／開帳號
async function afterLogin(u) {
  me = u; paintBtn();
  let remote;
  try { remote = await cloud.load(); }
  catch (e) {
    await cloud.signOut().catch(() => {});
    me = null; paintBtn();
    return e && e.code === 'permission-denied' ? '帳號登入了，但雲端存檔還沒開好（管理員還沒發布規則），先用訪客玩' : '連不上雲端，晚點再試';
  }
  if (acctUid()) { useSave(remote, u.uid); return; }          // 原本就是另一個帳號：直接換過去
  if (!remote) {
    // 帳號裡還沒有小窩：這台的進度直接搬上去
    const d = packSave(); d.t = Date.now();
    try { await cloud.save(d, u.uid); }
    catch (e) {
      await cloud.signOut().catch(() => {});
      me = null; paintBtn();
      return e && e.code === 'permission-denied' ? '帳號登入了，但雲端存檔還沒開好（管理員還沒發布規則），先用訪客玩' : '連不上雲端，晚點再試';
    }
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    useSave(d, u.uid, '這台的進度已經存進帳號');
    return;
  }
  if (!guestPlayed(S)) { useSave(remote, u.uid, `歡迎回來，${u.name}`); return; }
  askMerge(remote, u);
}
function askMerge(remote, u) {
  open(`<div class="ac-hd">${USER_ICON}<b>${esc(u.name)}</b></div>
    <p class="ac-p">這個帳號已經有小窩了。這台裝置之前玩的娃娃、家具和幣，要一起帶進帳號嗎？</p>
    <p class="ac-note">房間擺設用帳號裡的；娃娃、家具、壁紙和幣，兩邊取比較多的。</p>
    <div class="ac-row2"><button class="ac-b" data-a="merge">帶進去</button><button class="ac-b ghost" data-a="skip">不用</button></div>`, true);
  box.onclick = async e => {
    const a = e.target.closest('[data-a]'); if (!a) return;
    box.querySelectorAll('button').forEach(b => b.disabled = true);
    if (a.dataset.a === 'skip') { useSave(remote, u.uid, `歡迎回來，${u.name}`); return; }
    const m = mergeSave(remote, S);
    try { await cloud.save(m, u.uid); } catch (err) { failState(err); }
    try { localStorage.removeItem(SAVE_KEY); } catch (err) {}
    useSave(m, u.uid, '這台的進度已經帶進帳號');
  };
}

async function signOut() {
  box.querySelectorAll('button').forEach(b => b.disabled = true);
  if (pushT || S.t > (S.base || 0)) await Promise.race([push(), new Promise(r => setTimeout(r, 4000))]);
  await cloud.signOut().catch(() => {});
  useSave(null, '', '登出了，現在用這台裝置的訪客存檔');
}

/* ---------- 帳號視窗 ---------- */
const X = '<button class="ac-x" aria-label="關閉"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>';
function open(html, noClose) {
  box.innerHTML = `<div class="ac-card" role="dialog" aria-modal="true" aria-label="雲端帳號">${noClose ? '' : X}${html}</div>`;
  box.hidden = false;
  const x = box.querySelector('.ac-x'); if (x) x.onclick = close;
}
function close() { box.hidden = true; box.innerHTML = ''; box.onclick = null; }
box.addEventListener('pointerdown', e => { if (e.target === box && box.querySelector('.ac-x')) close(); });

function loginError(e) {
  const c = (e && e.code) || '';
  if (c === 'cloud/bad-name') return e.hint;
  if (c === 'auth/invalid-credential' || c === 'auth/invalid-login-credentials' || c === 'auth/wrong-password' || c === 'auth/user-not-found') return '名字或密碼不對（英文不分大小寫）';
  if (c === 'auth/email-already-in-use') return '這個名字已經有人用了，換一個吧';
  if (c === 'auth/weak-password') return '密碼至少要 6 個字';
  if (c === 'auth/too-many-requests') return '試太多次了，等幾分鐘再試';
  if (c === 'auth/network-request-failed') return '連不上網路，晚點再試';
  if (c === 'auth/unauthorized-domain' || /referer|referrer/.test(c)) return '這個網址還不能登入（Firebase 的授權網域還沒加）';
  if (c === 'auth/user-disabled') return '這個帳號被停用了';
  if (c === 'cloud/not-ready') return '雲端還在準備，等一下再按一次';
  return '沒有成功，請再試一次';
}

function openLogin(mode = 'in', msg = '') {
  const up = mode === 'up';
  open(`<div class="ac-hd">${USER_ICON}<b>${up ? '開一個新帳號' : '登入雲端帳號'}</b></div>
    <p class="ac-p">${up ? '取一個名字、設一組密碼。換手機時用同一組登入，就能接著玩。' : '登入後，娃娃、家具和房間會存到雲端，換手機也能接著玩。'}</p>
    <form class="ac-form" novalidate>
      <label>名字<input name="n" autocomplete="username" maxlength="24" placeholder="2～12 個字" required></label>
      <label>密碼<input name="p" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="至少 6 個字" required></label>
      ${up ? '<label>再輸入一次密碼<input name="p2" type="password" autocomplete="new-password" required></label>' : ''}
      <p class="ac-err" role="alert">${esc(msg)}</p>
      <button class="ac-b" type="submit">${up ? '開帳號' : '登入'}</button>
    </form>
    <button class="ac-link" data-a="${up ? 'in' : 'up'}">${up ? '已經有帳號了，回去登入' : '還沒有帳號？開一個新的'}</button>`);
  const f = box.querySelector('form'), err = box.querySelector('.ac-err');
  box.querySelector('.ac-link').onclick = () => openLogin(up ? 'in' : 'up');
  f.onsubmit = async e => {
    e.preventDefault();
    const n = f.n.value, p = f.p.value;
    const chk = cloud.checkName(n);
    if (chk.error) { err.textContent = chk.error; return; }
    if (p.length < 6) { err.textContent = '密碼至少要 6 個字'; return; }
    if (up && p !== f.p2.value) { err.textContent = '兩次的密碼不一樣'; return; }
    err.textContent = '';
    f.querySelectorAll('input,button').forEach(el => el.disabled = true);
    f.querySelector('button').textContent = '等一下…';
    let u;
    try { u = await (up ? cloud.signUpWithName(n, p) : cloud.signInWithName(n, p)); }
    catch (e2) { openLogin(mode, loginError(e2)); box.querySelector('[name=n]').value = n; return; }
    const m = await afterLogin(u);
    if (m) openLogin('in', m);
  };
  setTimeout(() => { try { box.querySelector('[name=n]').focus({ preventScroll: true }); } catch (e) {} }, 50);
}

function paintStatus() {
  const s = box.querySelector('.ac-st');
  if (s) { s.className = `ac-st ${state}`; s.textContent = STATE_TEXT[state] || ''; }
}
function openAccount() {
  open(`<div class="ac-hd">${USER_ICON}<b>${esc(me.name)}</b></div>
    <p class="ac-st"></p>
    <div class="ac-fr">
      <div class="ac-sub">好友</div>
      <p class="ac-code">我的好友碼 <b>${esc(cloud.friendCode(me.uid))}</b></p>
      <p class="ac-hearts" hidden></p>
      <form class="ac-add" novalidate><input name="c" maxlength="6" autocapitalize="characters" autocomplete="off" placeholder="輸入朋友的好友碼" aria-label="朋友的好友碼"><button class="ac-b sm" type="submit">加好友</button></form>
      <p class="ac-err" role="alert"></p>
      <ul class="ac-list"><li class="ac-empty">讀取中…</li></ul>
      <p class="ac-note">把好友碼給朋友，對方輸入後就會出現在這裡。點朋友的名字，可以去他家看看。</p>
    </div>
    <button class="ac-link out" data-a="out">登出</button>`);
  paintStatus();
  box.querySelector('[data-a=out]').onclick = signOut;
  const f = box.querySelector('.ac-add'), err = box.querySelector('.ac-fr .ac-err');
  f.onsubmit = async e => {
    e.preventDefault();
    const code = f.c.value.trim().toUpperCase();
    err.textContent = '';
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) { err.textContent = '好友碼是 6 個英文字母和數字'; return; }
    if (code === cloud.friendCode(me.uid)) { err.textContent = '這是你自己的好友碼'; return; }
    f.querySelector('button').disabled = true;
    try {
      const found = (await cloud.findCode(code)).filter(p => p.uid !== me.uid);
      if (!found.length) err.textContent = '找不到這個好友碼';
      else { await cloud.addFriend(found[0].uid); f.c.value = ''; say(`加了 ${found[0].name}`); await loadFriends(); }
    } catch (e2) { console.warn('[account]', e2); err.textContent = '沒有成功，請再試一次'; }
    f.querySelector('button').disabled = false;
  };
  loadFriends();
  loadHearts();
}

/* 今天收到幾顆愛心：只顯示數字，不顯示誰送的；0 顆或讀不到（規則還沒發布）就不出現 */
const nestDay = () => Math.floor((Date.now() + 288e5) / 864e5);   // 台灣時間的第幾天
async function loadHearts() {
  try {
    const n = await cloud.heartsToday(nestDay());
    const el = box.querySelector('.ac-hearts');
    if (!el || !n) return;
    el.innerHTML = `今天收到 <b>${n}</b> 顆愛心`;
    el.hidden = false;
  } catch (e) { console.info('[account] 讀不到今天的愛心', e && e.code); }
}

/* 去朋友家：讀對方的公開房間（nestRooms/{uid}），讀不到就說一聲，不報錯 */
let visiting = false;
async function goVisit(p) {
  if (visiting) return;
  visiting = true;
  try {
    let data;
    try { data = await cloud.room(p.uid); }
    catch (e) { console.info('[account] 讀不到朋友的房間', e && e.code); say('朋友的房間現在還看不到，晚點再試'); return; }
    if (!data || !data.home) { say(`${p.name}的房間還沒放上來，等對方打開一次小窩就看得到`); return; }
    const day = nestDay();
    let sent = null;
    try { sent = await cloud.sentHeart(p.uid, day); } catch (e) { sent = null; }
    close();
    $('#cover').hidden = true;
    music.start?.();
    visitOpen({ name: p.name, data, sent, send: () => cloud.sendHeart(p.uid, day) });
  } finally { visiting = false; }
}

async function loadFriends() {
  const list = box.querySelector('.ac-list');
  if (!list) return;
  try {
    const mine = await cloud.ensurePlayer();
    const ids = new Set(mine.friends || []);
    const back = await cloud.addedMe();
    back.forEach(p => ids.delete(p.uid));
    const fwd = (await Promise.all([...ids].map(id => cloud.player(id).catch(() => null)))).filter(Boolean);
    friends = [...fwd, ...back].filter((p, i, a) => p.uid !== me.uid && a.findIndex(q => q.uid === p.uid) === i);
    const el = box.querySelector('.ac-list');
    if (!el) return;
    el.innerHTML = friends.length
      ? friends.map((p, i) => `<li><button class="ac-fv" data-fi="${i}" aria-label="去${esc(p.name)}家">${HOUSE}<span class="nm">${esc(p.name)}</span><span class="cd">${esc(p.code)}</span></button></li>`).join('')
      : '<li class="ac-empty">還沒有好友。把好友碼給朋友，或輸入朋友的好友碼。</li>';
    el.onclick = e => { const b = e.target.closest('.ac-fv'); if (b && friends[b.dataset.fi]) goVisit(friends[b.dataset.fi]); };
  } catch (e) {
    console.warn('[account]', e);
    const fr = box.querySelector('.ac-fr'); if (fr) fr.hidden = true;
  }
}

/* ---------- 開始 ---------- */
async function start() {
  paintBtn();
  btn.hidden = false;
  btn.addEventListener('click', () => {
    if (!cloud || !cloud.isReady) { say('雲端還在準備，等一下再按'); return; }
    if (me) openAccount(); else openLogin('in');
  });
  try {
    const m = sessionStorage.getItem(MSG_KEY);
    if (m) { sessionStorage.removeItem(MSG_KEY); setTimeout(() => say(m), 600); }
  } catch (e) {}
  try {
    const mod = await import('./cloud.js');
    cloud = mod.createCloud(CFG, { emulator: EMU });
    await cloud.ready;
  } catch (e) { console.warn('[account] 雲端載不起來，照樣可以玩，存在這台裝置', e); cloud = null; btn.hidden = true; return; }
  const acct = acctUid(), u = cloud.user;
  if (acct && !u) { useSave(null, '', '登入過期了，現在用訪客存檔'); return; }   // 在別的地方登出、或登入被清掉
  if (u && acct !== u.uid) { const m = await afterLogin(u); if (m) say(m); return; }   // 有登入但這台還沒用這個帳號的存檔
  me = u; paintBtn();
  if (me) {
    await syncStart();
    addEventListener('online', () => { if (me && state !== 'synced') push(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && me && (pushT || S.t > (S.base || 0))) push(); });
  }
}
if (CFG && btn && box) start(); else if (btn) btn.remove();
