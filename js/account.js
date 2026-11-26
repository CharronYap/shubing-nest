/* 雲端帳號：登入、把這台的進度帶上雲端、換裝置接著玩、好友碼
 *
 * Firebase 專案是小窩自己的 shubing-nest（帳號和好友不跟蛋蛋島共用），小窩的存檔放在 nestSaves/{uid}。
 * 只有幣跟蛋蛋島共用（js/wallet.js、docs/WALLET.md）：登入時用同一組名字和密碼順便登入蛋蛋島，錢包放在蛋蛋島的專案。
 * 沒登入也能玩，存在這台裝置（訪客存檔）。登入後每個帳號在這台裝置有一份自己的存檔（save.js 的 saveKeyFor），
 * 有改動就等 1.5 秒合成一次寫上雲端。
 *
 * 換帳號、拿雲端的存檔來用時，會把存檔寫好再重新整理一次頁面，畫面上的東西就全部換成新的那份。
 */
import { FIREBASE_CONFIG, EGG_FIREBASE_CONFIG } from './cloud-config.js';
import { createWallet } from './wallet.js';

const params = new URLSearchParams(location.search);
// 測試：?emu=1 連本機的 Firebase 模擬器，永遠用假專案，不碰真的存檔（docs/CLOUD.md）
const EMU = params.has('emu') && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const CFG = EMU ? { apiKey: 'demo-key', authDomain: 'demo-plush.firebaseapp.com', projectId: 'demo-plush', appId: 'demo' } : FIREBASE_CONFIG;
const MSG_KEY = 'shubingNest.msg';

const btn = document.getElementById('coverAcct');
const box = document.getElementById('acct');
let cloud = null, me = null, state = 'guest', pushT = 0, pushing = null, friends = null;
let failN = 0, failWhy = '', failTold = false, retryT = 0;   // 雲端存檔連續失敗幾次、原因、有沒有跟玩家講過
const afterSaved = [];                                        // 等「存檔真的寫上雲端」才做的事（刪朋友寄來的那一筆）

/* ---------- 跟蛋蛋島共用的錢包（js/wallet.js、docs/WALLET.md） ----------
   登入小窩時用同一組名字和密碼順便登入蛋蛋島；已經登入的，在帳號視窗打一次蛋蛋島的密碼。
   EGG_LINK：這個小窩帳號連的是哪個蛋蛋島帳號（記在這台裝置）。蛋蛋島那邊登入的不是它，就不碰錢包。 */
const EGG_CFG = EMU ? null : EGG_FIREBASE_CONFIG;
const EGG_LINK = u => 'shubingNest.egg.' + u;
let wallet = null, walletOn = false, wState = '', wT = 0, wBusy = null;
let wLooks = null;   // 上次對帳時錢包裡的帽子和衣服；小窩多了它沒有的（剛買、剛夾到）就再對一次
// 小窩擁有、可以跟蛋蛋島共用的帽子和衣服（不戴、原本的樣子不算）
const myLooks = () => (Array.isArray(S.closet) ? S.closet : []).filter(k => /^(hat|outfit)\./.test(k) && k !== 'hat.none' && k !== 'outfit.none');
const looksDirty = () => !wLooks || myLooks().some(k => !wLooks.has(k));
const eggLinked = () => { try { return !!(me && wallet && wallet.user && localStorage.getItem(EGG_LINK(me.uid)) === wallet.user.uid); } catch (e) { return false; } };
// 用名字和密碼連蛋蛋島（登入小窩時、帳號視窗按「連起來」時）。回傳 true = 連上了
async function walletLink(name, password, nestUid) {
  if (!wallet) return false;
  try {
    const eu = await Promise.race([wallet.link(name, password), new Promise((_, no) => setTimeout(() => no(Object.assign(new Error('timeout'), { code: 'wallet/timeout' })), 10000))]);
    localStorage.setItem(EGG_LINK(nestUid), eu.uid);
    return true;
  } catch (e) { console.info('[wallet] 沒連上蛋蛋島', e && e.code); walletLink.err = e; return false; }
}
// 對一次帳：這段時間在小窩賺的減花的放進錢包，再把 S.coins 換成錢包的數字（中間又有變動的保留）
async function walletSync() {
  if (!walletOn || !me || wBusy || saveLock) return;
  clearTimeout(wT); wT = 0;
  const eu = wallet.user && wallet.user.uid; if (!eu || !eggLinked()) { walletOn = false; return; }
  const E0 = S.earn || {}, first = !(Number.isInteger(E0.wb) && E0.wu === eu);
  const c0 = S.coins, who = me.uid;
  wBusy = (async () => {
    try {
      const r = await wallet.syncNest(who, c0, first ? null : E0.wb, eu, myLooks());
      if (!me || me.uid !== who || saveLock) return;
      const E = S.earn = S.earn || {};
      S.coins = Math.max(0, Math.min(1000000, r.coins + (S.coins - c0)));
      E.wb = r.coins; E.wu = eu;
      // 蛋蛋島那邊有、小窩還沒有的帽子和衣服：直接放進衣櫃（小窩不認得的，例如蛋蛋島的特效、底座，本來就不在錢包裡）
      wLooks = new Set(r.looks || []);
      S.closet = Array.isArray(S.closet) ? S.closet : [];
      const got = (r.looks || []).filter(k => typeof LOOK_ITEMS !== 'undefined' && LOOK_ITEMS[k] && !S.closet.includes(k));
      got.forEach(k => S.closet.push(k));
      wState = 'ok';
      save();
      try { renderHud(); } catch (e) {}
      if (got.length && !document.querySelector('#sheet').hidden && document.querySelector('#sheet .wd-pg') && typeof openWardrobe === 'function') openWardrobe();
      if (first) say(`跟蛋蛋島連上了，兩邊的幣合在一起，現在有 ${S.coins} 枚${got.length ? `，衣櫃多了 ${got.length} 件` : ''}`);
      else if (got.length) say(`從蛋蛋島帶來 ${got.length} 件衣服和配件，衣櫃裡有了`);
    } catch (e) {
      // 規則還沒在 plush-crush 主控台發布：這次開著的時候先不試了，幣照舊自己算
      if (e && e.code === 'permission-denied') { wState = 'denied'; walletOn = false; }
      else wState = 'offline';
      console.info('[wallet] 錢包沒有對上', e && (e.code || e.message));
    }
  })();
  try { await wBusy; } finally { wBusy = null; }
  if (!box.hidden && box.querySelector('.ac-wl')) paintWallet();
  if (walletOn && S.earn && (S.coins !== S.earn.wb || (wLooks && looksDirty()))) walletSoon();
}
function walletSoon() { clearTimeout(wT); wT = setTimeout(walletSync, 2000); }
// 存檔寫好時（save.js 的 onNestSave）：幣有變就排一次對帳
function onSaved() { schedulePush(); if (walletOn && !wBusy && S.earn && (S.coins !== S.earn.wb || looksDirty())) walletSoon(); }
async function walletStart() {
  if (!wallet || !me) return;
  try { await wallet.ready; } catch (e) { return; }
  if (eggLinked()) { walletOn = true; walletSync(); return; }
  if (wallet.user) wallet.signOut();             // 蛋蛋島那邊登入的是別人（換過小窩帳號）：登出，不碰別人的錢包
  setTimeout(walletAsk, 3000);
}
// 用名字和密碼連起來、對一次帳。成功回傳 ''，不成功回傳要給玩家看的一句話（帳號視窗、房間裡的小卡片共用）
async function walletTry(name, password) {
  if (String(password || '').length < 6) return '密碼至少要 6 個字';
  if (!(await walletLink(name, password, me.uid))) {
    const c = (walletLink.err && walletLink.err.code) || '';
    return c === 'wallet/timeout' ? '蛋蛋島那邊沒有回應，晚點再試'
      : /referer|referrer|api-key|unauthorized/.test(c) ? '蛋蛋島那邊還不讓小窩的網址登入（看 docs/WALLET.md）' : loginError(walletLink.err);
  }
  walletOn = true; wState = '';
  await walletSync();
  try { localStorage.setItem(EGG_ASK(me.uid), '1'); } catch (e) {}
  return '';
}
/* 登入了、還沒連蛋蛋島：進房間時跳一張小卡片要蛋蛋島的密碼（2026-11-26，使用者連上線後兩邊數字不一樣，
   原因是還沒到帳號視窗去連；改成直接在房間裡問）。這台、這個帳號只問一次：連好了或按「之後再說」就不再跳，帳號視窗裡照樣可以連。
   封面、面板、別的卡片、薯餅帶路開著時先等一下 */
const EGG_ASK = u => 'shubingNest.eggAsk.' + u;
function walletAsk() {
  if (!wallet || !me || eggLinked()) return;
  try { if (localStorage.getItem(EGG_ASK(me.uid))) return; } catch (e) { return; }
  const scr = document.getElementById('screen'), cover = document.getElementById('cover'), sheet = document.getElementById('sheet');
  if (!scr) return;
  if (document.hidden || (cover && !cover.hidden) || (sheet && !sheet.hidden) || scr.querySelector('.over') || document.getElementById('tour') || !box.hidden
    || (typeof page !== 'undefined' && page !== 'room')) { setTimeout(walletAsk, 4000); return; }
  const o = document.createElement('div'); o.className = 'over';
  o.innerHTML = `<div class="pcard who wl-ask" role="dialog" aria-label="跟蛋蛋島共用幣和衣服">
    <h3>跟蛋蛋島共用</h3>
    <p class="who-l">有在玩薯餅蛋蛋島的話，打一次蛋蛋島的密碼，兩邊的幣、帽子和衣服就合在一起，在哪邊賺、在哪邊買都算。</p>
    <form class="ac-form" novalidate>
      <label>蛋蛋島的名字<input name="wn" autocomplete="username" maxlength="24" value="${esc(me.name)}"></label>
      <label>蛋蛋島的密碼<input name="wp" type="password" autocomplete="current-password" placeholder="至少 6 個字"></label>
      <p class="ac-err" role="alert"></p>
      <div class="pz-row wl-row"><button class="btn y" type="submit">連起來</button><button class="btn" type="button" data-wl="later">之後再說</button></div>
    </form>
    <small class="st-where">之後也可以在封面左上角的帳號裡連。</small></div>`;
  scr.appendChild(o);
  const f = o.querySelector('form'), err = o.querySelector('.ac-err');
  o.querySelector('[data-wl=later]').onclick = () => { try { localStorage.setItem(EGG_ASK(me.uid), '1'); } catch (e) {} o.remove(); };
  f.onsubmit = async e => {
    e.preventDefault();
    f.querySelectorAll('input,button').forEach(x => x.disabled = true);
    err.textContent = '連線中…';
    const m = await walletTry(f.wn.value, f.wp.value);
    if (!m) {
      o.remove();
      if (wState === 'denied') say('連上蛋蛋島了，但蛋蛋島那邊的雲端還沒開好，幣先各算各的');
      return;
    }
    err.textContent = m;
    f.querySelectorAll('input,button').forEach(x => x.disabled = false);
  };
  setTimeout(() => { try { f.wp.focus({ preventScroll: true }); } catch (e) {} }, 60);
}

const USER_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8.2" r="4.4"/><path d="M3.8 20.2c.9-4.2 4.2-6.6 8.2-6.6s7.3 2.4 8.2 6.6c.1.6-.3 1.1-.9 1.1H4.7c-.6 0-1-.5-.9-1.1z"/></svg>';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const say = t => { try { toast(t); } catch (e) {} };

/* ---------- 封面左上角的帳號按鈕 ---------- */
function paintBtn() {
  if (!btn) return;
  const name = me ? me.name : '登入';
  btn.innerHTML = `${USER_ICON}<span>${esc(name)}</span>${me ? `<i class="st ${state}"></i>` : ''}`;
  btn.setAttribute('aria-label', me ? `雲端帳號：${me.name}${state === 'failed' ? '，雲端存檔沒有成功' : ''}` : '登入雲端帳號');
  // 遊戲裡看不到封面那顆鈕：存檔連續失敗時，「回封面」的鈕上也亮一個點
  const hb = document.getElementById('homeBtn');
  if (hb) hb.classList.toggle('warn', !!me && failN >= 2);
}
const STATE_TEXT = {
  syncing: '存檔中…',
  synced: '已經存到雲端',
  offline: '離線中，連上網路會自動存到雲端',
  blocked: '雲端存檔還沒開好，進度先存在這台裝置',
  failed: '雲端存檔沒有成功，進度先存在這台裝置。先不要登出，也不要清除瀏覽器資料，等它存上去。',
};

/* ---------- 存檔：上傳、下載、換帳號 ---------- */
/* 存檔送出前檢查一次（2026-11-26 加）：Firestore 不收「陣列裡面直接放陣列」，規則也只收固定的幾個欄位和型別。
   有一個地方不合格，整份存檔就寫不上去，而且以前只在 console 留一行，玩家看不出來。
   這裡能修的先修（數字變整數、不認得的最上層欄位先不傳、小禮物的舊形狀），修不了的印出是哪個路徑。回傳問題清單 */
const NEST_KEYS = ['v', 't', 'coins', 'misses', 'wins', 'opened', 'lastDaily', 'seed', 'dollN', 'furnOwn', 'wallOwn', 'floorOwn', 'wish',
  'clawStyle', 'day', 'home', 'uid', 'album', 'away', 'look', 'closet', 'season', 'mail', 'yard', 'earn'];
function checkSave(d) {
  const bad = [];
  // 規則的白名單和型別（firestore.rules 的 okNest）
  Object.keys(d).forEach(k => { if (!NEST_KEYS.includes(k)) { bad.push(`最上層多了規則不收的欄位「${k}」（這次先不傳）`); delete d[k]; } });
  const int = (k, need) => { if (!(k in d)) { if (need) bad.push(`少了 ${k}`); return; } if (typeof d[k] !== 'number' || !isFinite(d[k])) { bad.push(`${k} 不是數字（${JSON.stringify(d[k])}）`); d[k] = 0; } else if (!Number.isInteger(d[k])) { bad.push(`${k} 不是整數（${d[k]}，已四捨五入）`); d[k] = Math.round(d[k]); } };
  int('v', true); int('t', true); int('coins', true); ['misses', 'wins', 'uid', 'seed'].forEach(k => int(k));
  if (typeof d.coins === 'number' && (d.coins < 0 || d.coins > 1000000)) { bad.push(`coins 超出範圍（${d.coins}）`); d.coins = Math.max(0, Math.min(1000000, d.coins)); }
  if ('opened' in d && typeof d.opened !== 'boolean') { bad.push('opened 不是布林'); d.opened = !!d.opened; }
  ['lastDaily', 'clawStyle'].forEach(k => { if (k in d && typeof d[k] !== 'string') { bad.push(`${k} 不是文字`); d[k] = String(d[k] ?? ''); } });
  const size = x => (Array.isArray(x) ? x.length : x && typeof x === 'object' ? Object.keys(x).length : -1);
  ['dollN', 'furnOwn', 'wallOwn', 'floorOwn'].forEach(k => { if (size(d[k]) < 0 || Array.isArray(d[k])) bad.push(`${k} 不是物件`); else if (size(d[k]) > 200) bad.push(`${k} 超過 200 項`); });
  ['album', 'away', 'look', 'closet', 'season', 'mail', 'yard', 'earn', 'wish'].forEach(k => { if (k in d && (size(d[k]) < 0 || size(d[k]) > 200)) bad.push(`${k} 不是物件或超過 200 項（${size(d[k])}）`); });
  if ('day' in d && (size(d.day) < 0 || Array.isArray(d.day) || size(d.day) > 10)) bad.push(`day 超過 10 項（${size(d.day)}）`);
  if (!d.home || typeof d.home !== 'object') bad.push('少了 home');
  else Object.keys(d.home).forEach(r => {
    const rm = d.home[r];
    if (!['living', 'bed', 'bath', 'kitchen', 'attic'].includes(r)) { bad.push(`home 多了規則不收的房間「${r}」`); return; }
    if (!rm || typeof rm !== 'object') { bad.push(`home.${r} 不是物件`); return; }
    Object.keys(rm).forEach(k => { if (!['wall', 'floor', 'items', 'light'].includes(k)) bad.push(`home.${r} 多了規則不收的欄位「${k}」`); });
    if (!Array.isArray(rm.items) || rm.items.length > 300) bad.push(`home.${r}.items 不是清單或超過 300 件`);
  });
  // Firestore 本身不收的：陣列裡面直接放陣列、空的或 __x__ 的欄位名字
  const walk = (x, path, inArr) => {
    if (Array.isArray(x)) {
      if (inArr) { bad.push(`陣列裡面直接放陣列：${path}`); return; }
      x.forEach((v, i) => walk(v, `${path}[${i}]`, true));
    } else if (x && typeof x === 'object') {
      Object.keys(x).forEach(k => { if (k === '' || /^__.*__$/.test(k)) bad.push(`欄位名字雲端不收：${path}.${JSON.stringify(k)}`); walk(x[k], path ? `${path}.${k}` : k, false); });
    }
  };
  // 小禮物的舊形狀（js/gift.js 打開時會轉，這裡再保險一次）
  const g = d.album && d.album.gifts;
  if (g && typeof g === 'object') Object.keys(g).forEach(k => { if (Array.isArray(g[k])) g[k] = g[k].map(x => (Array.isArray(x) ? { t: String(x[0] || ''), s: String(x[1] || ''), k: String(x[2] || 'snack') } : x)); });
  walk(d, '', false);
  let bytes = 0; try { bytes = JSON.stringify(d).length; } catch (e) {}
  if (bytes > 900000) bad.push(`存檔太大（約 ${Math.round(bytes / 1024)} KB，上限 1024 KB）`);
  return bad;
}
// 上傳的那份：拿掉只有這台裝置要用的 base
function packSave() {
  const d = JSON.parse(JSON.stringify(S));
  delete d.base;
  d.t = d.t || Date.now();
  d.uid = uid;
  const bad = checkSave(d);
  if (bad.length) console.error('[account] 這份存檔有雲端不收的地方：\n- ' + bad.join('\n- '));
  packSave.bad = bad;
  return d;
}
// 等自己的存檔真的寫上雲端之後才做 fn（js/social.js 的 sAfterSave 用）。現在就是存好的狀態就馬上做
function whenSaved(fn) {
  if (!me) return;
  if (state === 'synced' && !pushing && !pushT && S.t <= (S.base || 0)) { try { fn(); } catch (e) { console.info('[account]', e); } return; }
  if (afterSaved.length < 200) afterSaved.push(fn);
  if (!pushing && !pushT) schedulePush();
}
function flushSaved() {
  if (S.t > (S.base || 0)) return;     // 存上去之後又有新的改動：等下一次
  afterSaved.splice(0).forEach(fn => { try { fn(); } catch (e) { console.info('[account]', e); } });
}
// 用另一份存檔（雲端的、合併好的），或換到另一個帳號：寫好、重新整理
// base：這份存檔是從雲端哪一版來的。不給就當它等於自己（完全同步）；合併過、還要再傳上去的給雲端那一版的時間
function useSave(data, acct, msg, base) {
  lockSave();
  try {
    if (acct) localStorage.setItem(ACCT_KEY, acct); else localStorage.removeItem(ACCT_KEY);
    if (data) { data.base = base === undefined ? data.t : base; localStorage.setItem(saveKeyFor(acct), JSON.stringify(data)); }
    if (msg) sessionStorage.setItem(MSG_KEY, msg);
  } catch (e) {}
  location.reload();
}
function setState(s) { state = s; paintBtn(); if (!box.hidden && me) paintStatus(); }
// 寫不上去：真的沒網路才說離線；其他都算「存檔沒成功」，要讓玩家看得到，過一陣子自己再試
function failState(e) {
  console.warn('[account] 雲端存檔沒有成功', e);
  const code = (e && e.code) || '', offline = code === 'unavailable' || (typeof navigator !== 'undefined' && navigator.onLine === false);
  failN++;
  const bad = packSave.bad || [];
  failWhy = offline ? '' : (bad.length ? bad[0] : code === 'permission-denied' ? '雲端的規則不收這份存檔' : String((e && e.message) || code || '不知道原因').slice(0, 120));
  setState(offline ? 'offline' : failN >= 2 ? 'failed' : code === 'permission-denied' ? 'blocked' : 'offline');
  if (!offline && failN >= 2 && !failTold) { failTold = true; say('雲端存檔沒有成功，進度先存在這台裝置。回封面點帳號可以看原因'); }
  // 自己再試：15 秒、30 秒、60 秒……最久兩分鐘一次
  clearTimeout(retryT);
  if (me) retryT = setTimeout(() => { if (me && S.t > (S.base || 0)) push(); }, Math.min(120000, 15000 * Math.pow(2, Math.min(4, failN - 1))));
}
function okState() { failN = 0; failWhy = ''; failTold = false; clearTimeout(retryT); setState('synced'); }

/* 這台有還沒傳上去的進度，雲端那份又不是從這台寫的（別台裝置改過）：不能整份換掉。
   以前是直接拿雲端的蓋過來，這台剛領到的明信片、娃娃、過夜的信就不見了，而那幾筆在雲端已經被刪掉，找不回來。
   現在以雲端那份為底，把這台有的東西併進去（mergeSave），再傳上去 */
function mergeBack(remote, local) {
  const m = mergeSave(remote, local);
  m.t = Date.now();
  return m;
}
// 換到某個帳號之前：這台如果留著那個帳號「還沒傳上去」的進度，用它（或跟雲端的合併），不要被雲端那份舊的蓋掉
function withLocal(remote, acct) {
  let L = null;
  try { L = JSON.parse(localStorage.getItem(saveKeyFor(acct)) || 'null'); } catch (e) {}
  if (!L || L.v !== 1 || !L.home || !(L.t > (L.base || 0))) return { data: remote, base: undefined };
  if (!remote || L.base === remote.t) return { data: L, base: L.base || 0 };       // 雲端還是這台上次同步的那一版：這台的比較新，直接用
  return { data: mergeBack(remote, L), base: remote.t };
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
      if (remote && S.base && remote.t !== S.base) {
        // 別台裝置改過。這台也有還沒傳的進度：合併（以雲端為底，這台領到的東西留著），重新整理後再傳
        if (S.t > S.base) { writeLocal(); useSave(mergeBack(remote, JSON.parse(JSON.stringify(S))), who, '另一台裝置也改過，兩邊的進度合在一起了', remote.t); }
        else useSave(remote, who, '另一台裝置改過，換成最新的進度');
        return;
      }
      const d = packSave();
      await cloud.save(d, who);
      S.base = d.t; writeLocal();
      okState();
      flushSaved();
      pushRoom();
    } catch (e) { failState(e); }
  })();
  try { await pushing; } finally { pushing = null; }
  if (me && S.t > (S.base || 0) && state === 'synced') schedulePush();
  else if (me && afterSaved.length && state === 'synced') flushSaved();
}
// 公開房間（朋友來家裡看的那份）：只有擺設、燈、娃娃穿什麼。跟上次一樣就不寫。
// 規則還沒發布時會被擋，不影響存檔，也不出聲
let roomSent = '';
const pubRoom = r => ({ wall: r.wall, floor: r.floor, items: r.items, ...(r.light === false ? { light: false } : {}) });
async function pushRoom() {
  if (!me) return;
  const data = { name: me.name.slice(0, 24), home: { living: pubRoom(home.living), bed: pubRoom(home.bed), bath: pubRoom(home.bath) }, look: S.look || {} };
  ['kitchen', 'attic'].forEach(r => { if (home[r] && Array.isArray(home[r].items)) data.home[r] = pubRoom(home[r]); });   // 買了才有的房間（js/rooms.js）
  // 第五版：願望清單（最多 3 隻還沒有的娃娃）和小島給朋友看的樣子（每塊地是什麼，不含種子、次數）
  const want = typeof wantList === 'function' ? wantList() : [];
  if (want.length) data.want = want;
  if (S.yard && Array.isArray(S.yard.p) && S.yard.day) data.yard = { p: S.yard.p.map(p => (p.k ? { s: p.s, k: p.k } : { s: p.s })) };
  // 躲貓貓：哪一隻躲在哪一間的哪一件家具後面（js/hide.js）。規則還沒收這一欄時 cloud.saveRoom 會拿掉再寫
  const hide = typeof hidePublic === 'function' ? hidePublic() : null;
  if (hide) data.hide = hide;
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
  try { remote = await cloud.load(); } catch (e) { failState(e); window.onNestSave = onSaved; return; }
  if (remote && remote.t !== S.base) {
    // 雲端那份不是這台上次同步的那一版。這台如果有還沒傳上去的進度，合併，不要整份換掉
    if (S.base && S.t > S.base) useSave(mergeBack(remote, JSON.parse(JSON.stringify(S))), me.uid, '另一台裝置也改過，兩邊的進度合在一起了', remote.t);
    else useSave(remote, me.uid);
    return;
  }
  window.onNestSave = onSaved;
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
    // 從雲端領走的東西：收到的明信片、領過的編號（明信片、送來的娃娃）。兩邊都留，同一筆只留一份
    const pcs = new Set((mm.pc || []).map(c => c && c.id));
    mm.pc = [...(mm.pc || []), ...(gm.pc || []).filter(c => c && !pcs.has(c.id))].sort((a, b) => (a.t < b.t ? 1 : -1)).slice(0, 30);
    for (const k of ['pcd', 'gin']) { const u = [...new Set([...(mm[k] || []), ...(gm[k] || [])])]; if (u.length) mm[k] = u.slice(-60); }
  }
  // 紀念冊、娃娃送的小禮物、過夜去過哪、看過的小劇場、處理過的躲貓貓結果：兩邊都留
  const memoIds = new Set((ma.memo || []).map(e => e && e.id));
  const memo = [...(ma.memo || []), ...(ga.memo || []).filter(e => e && !memoIds.has(e.id))].sort((a, b) => (a.t < b.t ? 1 : a.t > b.t ? -1 : (b.ts || 0) - (a.ts || 0))).slice(0, 100);
  if (memo.length) ma.memo = memo;
  for (const k of ['gifts', 'trips']) {
    const src = ga[k] || {}; if (!Object.keys(src).length) continue;
    ma[k] = ma[k] || {};
    for (const [d, l] of Object.entries(src)) {
      const seen = new Set((ma[k][d] || []).map(x => JSON.stringify(x)));
      ma[k][d] = [...(ma[k][d] || []), ...(Array.isArray(l) ? l : []).filter(x => !seen.has(JSON.stringify(x)))].slice(-12);
    }
  }
  if (ga.skit && ga.skit.s) { ma.skit = ma.skit || {}; ma.skit.s = Object.assign({}, ga.skit.s, ma.skit.s || {}); }
  if (Array.isArray(ga.hideGot)) ma.hideGot = [...new Set([...(ma.hideGot || []), ...ga.hideGot])].slice(-30);
  if (ga.tour && !ma.tour) ma.tour = ga.tour;
  // 旅行：行李、明信片、土產、在外面的旅程（js/travel.js 的 tvMerge；同一隻在兩台各出門一趟，留比較早出門的那一趟）
  if (typeof tvMerge === 'function') { try { tvMerge(m, guest); } catch (e) { console.info('[account] 旅行的進度合不起來，先用雲端那份', e); } }
  // 門外小島：用帳號裡的那份，帳號裡還沒有才用這台的；種子數量取比較多的
  if (guest.yard) {
    if (!m.yard) m.yard = guest.yard;
    else { const ms = m.yard.seeds = m.yard.seeds || {}; for (const [k, n] of Object.entries(guest.yard.seeds || {})) ms[k] = Math.max(ms[k] || 0, n || 0); }
  }
  // 幣取比較多的。拿的是這台的，跟錢包對帳用的 base（earn.wb）也要用這台的，不然這段差額會重複算進蛋蛋島的錢包
  if ((guest.coins || 0) > (m.coins || 0) && guest.earn && Number.isInteger(guest.earn.wb) && m.earn) { m.earn.wb = guest.earn.wb; m.earn.wu = guest.earn.wu; }
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
  // 這台如果留著這個帳號「還沒傳上去」的進度（之前存檔一直失敗、後來登出或登入過期）：用它，不要被雲端那份舊的蓋掉
  const kept = withLocal(remote, u.uid);
  if (kept.base !== undefined) { useSave(kept.data, u.uid, `歡迎回來，${u.name}。這台還沒存上雲端的進度都還在`, kept.base); return; }
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
  // 還是沒存上去：這個帳號的進度留在這台裝置（不會刪），下次在這台登入同一個帳號會接回來
  const left = S.t > (S.base || 0);
  if (left) writeLocal();
  await cloud.signOut().catch(() => {});
  if (wallet) await wallet.signOut();
  useSave(null, '', left ? '登出了。剛剛的進度還沒存上雲端，留在這台裝置，下次在這台登入會接回來' : '登出了，現在用這台裝置的訪客存檔');
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
    // 蛋蛋島用的是同一組名字和密碼的話，順便連上共用的錢包（連不上也照樣登入小窩，之後可以在帳號視窗再連）
    if (wallet) { f.querySelector('button').textContent = '連蛋蛋島…'; await walletLink(n, p, u.uid); }
    const m = await afterLogin(u);
    if (m) openLogin('in', m);
  };
  setTimeout(() => { try { box.querySelector('[name=n]').focus({ preventScroll: true }); } catch (e) {} }, 50);
}

function paintStatus() {
  const s = box.querySelector('.ac-st');
  if (s) { s.className = `ac-st ${state}`; s.textContent = (STATE_TEXT[state] || '') + (state === 'failed' && failWhy ? `（原因：${failWhy}）` : ''); }
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
    ${wallet ? '<div class="ac-fr ac-wl"></div>' : ''}
    <button class="ac-link out" data-a="out">登出</button>`);
  paintStatus();
  paintWallet();
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
      else { await cloud.addFriend(found[0].uid); f.c.value = ''; say(`加了 ${found[0].name}`); if (window.nestMemo) window.nestMemo('friend', found[0].uid, found[0].name); await loadFriends(); }
    } catch (e2) { console.warn('[account]', e2); err.textContent = '沒有成功，請再試一次'; }
    f.querySelector('button').disabled = false;
  };
  loadFriends();
  loadHearts();
}

/* 帳號視窗裡「跟蛋蛋島共用的幣」那一塊 */
function paintWallet() {
  const el = box.querySelector('.ac-wl'); if (!el || !me) return;
  const linked = eggLinked();
  const txt = !linked ? '蛋蛋島用同一組名字和密碼的話，連一次，兩邊的幣就是同一個錢包（1 比 1），在哪邊賺、在哪邊花都算同一堆。'
    : wState === 'denied' ? '已經連上蛋蛋島，但蛋蛋島那邊的雲端還沒開好（規則還沒發布），幣先各算各的。'
    : wState === 'offline' ? '已經連上蛋蛋島。現在連不上雲端，幣先記在這台，連上會自動合在一起。'
    : '已經跟蛋蛋島連上了，兩邊的幣是同一個錢包。';
  el.innerHTML = `<div class="ac-sub">跟蛋蛋島共用的幣</div><p class="ac-p">${txt}</p>
    ${linked ? '' : `<form class="ac-form ac-wlf" novalidate>
      <label>蛋蛋島的名字<input name="wn" autocomplete="username" maxlength="24" value="${esc(me.name)}"></label>
      <label>蛋蛋島的密碼<input name="wp" type="password" autocomplete="current-password" placeholder="至少 6 個字"></label>
      <p class="ac-err" role="alert"></p>
      <button class="ac-b sm" type="submit">連起來</button></form>`}`;
  const f = el.querySelector('form'); if (!f) return;
  f.onsubmit = async e => {
    e.preventDefault();
    const err = f.querySelector('.ac-err');
    f.querySelectorAll('input,button').forEach(x => x.disabled = true);
    const m = await walletTry(f.wn.value, f.wp.value);
    if (!m) { paintWallet(); return; }
    f.querySelectorAll('input,button').forEach(x => x.disabled = false);
    err.textContent = m;
  };
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
    visitOpen({ name: p.name, uid: p.uid, hasMe: p.hasMe !== false, data, sent, send: () => cloud.sendHeart(p.uid, day) });
  } finally { visiting = false; }
}

// 好友：自己加的 + 加了自己的（兩個方向都算，跟留愛心、送娃娃的規則一樣）
async function fetchFriends() {
  const mine = await cloud.ensurePlayer();
  const ids = new Set(mine.friends || []);
  const back = await cloud.addedMe();
  back.forEach(p => ids.delete(p.uid));
  const fwd = (await Promise.all([...ids].map(id => cloud.player(id).catch(() => null)))).filter(Boolean);
  // mine：我的名單裡有他（我加過他）；hasMe：他的名單裡有我。自己打的字要對方加過你才寫得進去（firestore.rules）
  const mineSet = new Set(mine.friends || []), backSet = new Set(back.map(p => p.uid));
  friends = [...fwd, ...back].filter((p, i, a) => p.uid !== me.uid && a.findIndex(q => q.uid === p.uid) === i)
    .map(p => ({ ...p, mine: mineSet.has(p.uid), hasMe: backSet.has(p.uid) || (p.friends || []).includes(me.uid) }));
  return friends;
}
async function loadFriends() {
  const list = box.querySelector('.ac-list');
  if (!list) return;
  try {
    await fetchFriends();
    const el = box.querySelector('.ac-list');
    if (!el) return;
    el.innerHTML = friends.length
      ? friends.map((p, i) => `<li><button class="ac-fv" data-fi="${i}" aria-label="去${esc(p.name)}家">${HOUSE}<span class="nm">${esc(p.name)}</span><span class="cd">${p.mine ? (p.hasMe ? '' : '還沒加你') : '他加了你'}</span></button>${p.mine
          ? `<button class="ac-fa rm" data-rm="${i}" aria-label="把${esc(p.name)}從好友移除">移除</button>`
          : `<button class="ac-fa" data-add="${i}" aria-label="把${esc(p.name)}加回去">加回去</button>`}</li>`).join('')
        + '<li class="ac-empty ac-fnote">兩邊都加了對方，才能互相在訪客簿寫字、寄明信片。移除之後，對方就寫不進來了。</li>'
      : '<li class="ac-empty">還沒有好友。把好友碼給朋友，或輸入朋友的好友碼。</li>';
    el.onclick = async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('ac-fv')){ if (friends[b.dataset.fi]) goVisit(friends[b.dataset.fi]); return; }
      const p = friends[b.dataset.add ?? b.dataset.rm]; if (!p || b.disabled) return;
      // 移除要按兩次（第一次只是問）
      if (b.dataset.rm !== undefined && !b.dataset.sure){ b.dataset.sure = '1'; b.textContent = '確定移除'; setTimeout(() => { if (b.isConnected){ delete b.dataset.sure; b.textContent = '移除'; } }, 4000); return; }
      b.disabled = true;
      try {
        if (b.dataset.add !== undefined){ await cloud.addFriend(p.uid); say(`加了 ${p.name}`); if (window.nestMemo) window.nestMemo('friend', p.uid, p.name); }
        else { await cloud.removeFriend(p.uid); say(`把 ${p.name} 從好友移除了`); }
        friends = null; await loadFriends();
      } catch (e2) { console.warn('[account]', e2); say('沒有成功，請再試一次'); b.disabled = false; }
    };
  } catch (e) {
    console.warn('[account]', e);
    const fr = box.querySelector('.ac-fr'); if (fr) fr.hidden = true;
  }
}

/* ---------- 給一般 script 用（js/nestgift.js 送娃娃） ---------- */
// 沒登入時 me 是 null；登入好、存檔同步過一次之後發一個 nestnet 事件
window.nestNet = {
  get me() { return cloud && me ? { uid: me.uid, name: me.name } : null; },
  friends: () => friends ? Promise.resolve(friends) : fetchFriends(),
  sendGift: o => cloud.sendGift(o),
  giftsTo: () => cloud.giftsTo(),
  giftsFrom: () => cloud.giftsFrom(),
  gift: id => cloud.gift(id),
  delGift: id => cloud.delGift(id),
  push: () => push(),
  whenSaved: fn => whenSaved(fn),   // 等自己的存檔寫上雲端才做（js/social.js sAfterSave）
  // 朋友面板的「去他家」（js/friend.js）
  visit: async uid => { const l = friends || await fetchFriends(); const p = l.find(f => f.uid === uid); if (p) return goVisit(p); },
  // 查問題用：在瀏覽器的 console 打 nestNet.check()，列出這份存檔有哪些地方雲端不收（空的清單 = 沒問題），和現在的同步狀態
  check: () => { packSave(); return { bad: (packSave.bad || []).slice(), state, failN, failWhy, unsaved: S.t > (S.base || 0), waiting: afterSaved.length, wallet: { linked: eggLinked(), on: walletOn, state: wState, base: S.earn && S.earn.wb } }; },
  room: uid => cloud.room(uid),
  heartsToday: () => cloud.heartsToday(nestDay()),   // 愛心換幣（js/earn.js）
  idToken: () => cloud.idToken(),   // AI 寫信（js/mailai.js）
};
// 第五版的雲端動作，原樣轉給 cloud.js
['bookAdd', 'bookMine', 'book', 'bookDel', 'waterAdd', 'waterMine', 'waters', 'waterDel', 'foundAdd', 'foundMine', 'founds', 'foundDel',
  'stayGo', 'stayMine', 'stayGuests', 'staySet', 'stayEnd', 'cardSend', 'cardsTo', 'cardDel']
  .forEach(k => { window.nestNet[k] = (...a) => cloud[k](...a); });

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
  if (EGG_CFG) { try { wallet = createWallet(EGG_CFG); } catch (e) { wallet = null; } }
  const acct = acctUid(), u = cloud.user;
  if (acct && !u) { useSave(null, '', '登入過期了，現在用訪客存檔'); return; }   // 在別的地方登出、或登入被清掉
  if (u && acct !== u.uid) { const m = await afterLogin(u); if (m) say(m); return; }   // 有登入但這台還沒用這個帳號的存檔
  me = u; paintBtn();
  if (me) {
    await syncStart();
    dispatchEvent(new Event('nestnet'));
    walletStart();
    // 回到這個分頁、每兩分鐘：看一下錢包（蛋蛋島那邊可能賺了或花了）
    document.addEventListener('visibilitychange', () => { if (!document.hidden && walletOn) walletSync(); });
    setInterval(() => { if (!document.hidden && walletOn) walletSync(); }, 120000);
    addEventListener('online', () => { if (me && state !== 'synced') push(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && me && (pushT || S.t > (S.base || 0))) push(); });
  }
}
if (CFG && btn && box) start(); else if (btn) btn.remove();
