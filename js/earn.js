/* 賺幣（2026-11-26）
   第一步：幣不夠、或點上面的幣時，列出「現在就能做、做了就有幣」的事，點了直接過去。
     每天領 20 枚、小事一件 3 枚、每天第一次夾不用幣的數字在 data.js 和 claw.js。
   不懲罰、不催人：這張清單只在你自己點開、或幣真的不夠時出現，不會自己跳出來。 */
const EARN_ICON = COIN;
// 現在能賺幣的事。每一項 {ic, t, s, n:大約幾枚, go:點了做什麼}；off = 今天做完了，列出來讓人知道明天還有
function earnList(){
  const L = [], t = todayStr();
  planDay();
  const ev = pending();
  if (ev.length) L.push({ic: `<img src="${SPR[ev[0].d[0]]}" alt="">`, t: `還有 ${ev.length} 件小事`, s: `做完一件 ${EVENT_COINS} 枚`, go: () => { setPage('room'); openEvents(); }});
  const a = S.away;
  if (a && a.drops && a.drops.length && (a.date !== t || (a.picked || 0) < 3)){
    const r = a.drops[0].r, left = a.date === t ? 3 - (a.picked || 0) : 3;
    L.push({ic: DROP_SVG[a.drops[0].k], t: `${{living: '客廳', bed: '臥室', bath: '浴室'}[r] || '房間'}地上有東西沒撿`, s: `今天還能撿 ${Math.min(left, a.drops.length)} 個，一個 1 枚`, go: () => { setPage('room'); $('#sheet').hidden = true; if (roomId !== r) goRoom(r); }});
  }
  const m = S.mail;
  const coins = m ? m.l.filter(o => o.a && !o.g && o.a.startsWith('coin-')).reduce((n, o) => n + (+o.a.slice(5) || 0), 0) : 0;
  if (coins) L.push({ic: MAIL_ICON, t: '信箱裡有幣還沒收', s: `${coins} 枚`, go: () => { setPage('room'); openMail(); }});
  if (!S.day.free) L.push({ic: CLAW_ICON, t: '今天第一次夾娃娃', s: '不用幣', go: () => { $('#sheet').hidden = true; setPage('claw'); }});
  if (typeof earnMore === 'function') earnMore(L);   // 第二步的小遊戲、店員、收成接在這裡
  return L;
}
let erList = [];
// short：幣不夠時跳出來的，最上面多一句
function earnOpen(short){
  if (VISIT) return;
  erList = earnList();
  const rows = erList.map((x, i) => `<div class="er-it ${x.off ? 'off' : ''}"><span class="ic">${x.ic}</span><span class="tx2"><b>${x.t}</b><small>${x.s}</small></span>${x.go ? `<button class="btn y sm" data-er="${i}">${x.btn || '去看看'}</button>` : ''}</div>`).join('');
  const none = `<p class="er-hi">今天能賺的都做完了。明天打開會有 ${DAILY_COINS} 枚，第一次夾娃娃也不用幣。</p>`;
  openSheet(`<div class="hd">${EARN_ICON}<span>${short ? '幣不夠了' : `現在有 ${S.coins} 枚幣`}</span></div>
    <div class="er-box">${erList.length ? `<p class="er-hi">${short ? '夾一次要 ' + COST + ' 枚。現在還有這些事可以賺：' : '現在可以賺幣的事：'}</p>${rows}` : none}</div>`);
  evOpen = false; alOpen = false;
}
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('[data-er]'); if (!b) return;
  const x = erList[+b.dataset.er]; if (x && x.go) x.go();
});
$('#coinPill').addEventListener('click', () => earnOpen(false));
$('#coinPill').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); earnOpen(false); } });

/* ================= 第二步：可以一直賺的方式 =================
   存檔：S.earn = {
     d:'今天', g:今天玩了幾局小遊戲,
     work:[{d:娃娃, t:'上次領錢的日子'}],        等著送人的娃娃自動當店員（照 DOLL_N 算出來，不用手動派），最多算 3 隻
     hv:{第幾塊地:'上次收成的日子'}, bag:{flower, fruit},   小島收成，拿去小店換幣
     hc:{d:第幾天, n:今天朋友的愛心換了幾枚},
     ms:[領過的里程碑],
     shop:{d:'今天', items:[今天擺的], bought:[今天買過的]}   （js/shop.js）
   }
   earn 跟著存檔一起上雲端（規則 2026-11-26 發布）。js/cloud.js 留著保險：存檔被擋時會先拿掉 earn 再寫。 */
const EARN_GAME_TOP = 3, EARN_WORK_MAX = 3, EARN_WORK_PAY = 2, EARN_HEART_MAX = 5;
// 家具系列：湊齊一個 10 枚。雲朵系列，加上 js/furn2.js 裡有獎品的系列
const EARN_SETS = {cloud: CLOUD_SET}, EARN_SET_NAME = {cloud: '雲朵系列'};
if (typeof FURN_SERIES !== 'undefined') Object.entries(FURN_SERIES).forEach(([k, s]) => { if (s.gift){ EARN_SETS[k] = s.ids; EARN_SET_NAME[k] = s.name; } });
function earnData(){
  const e = S.earn = S.earn || {}, t = todayStr();
  if (e.d !== t){ e.d = t; e.g = 0; }
  // 店員名單照 DOLL_N 算：有留著一隻要送人的（DOLL_N = 2）就是店員，送掉了就不是。原本就在名單上的，領錢的日子照舊
  const was = Array.isArray(e.work) ? e.work : [];
  e.work = DOLLS.filter(d => (DOLL_N[d] || 0) >= 2).slice(0, EARN_WORK_MAX).map(d => was.find(w => w && w.d === d) || {d, t});
  e.hv = e.hv || {}; e.bag = Object.assign({flower: 0, fruit: 0}, e.bag || {}); e.ms = Array.isArray(e.ms) ? e.ms : [];
  return e;
}
const earnDays = (a, b) => Math.round((new Date(b + 'T00:00') - new Date(a + 'T00:00')) / 864e5);

/* ---------- 小遊戲（js/games.js） ---------- */
function earnGameDone(tier){
  const e = earnData(), n = e.g < EARN_GAME_TOP ? Math.max(3, Math.min(5, tier | 0)) : 1;
  e.g++; S.coins += n; renderHud(); save();
  return n;
}
function earnGameNote(){
  const left = EARN_GAME_TOP - earnData().g;
  return left > 0 ? `今天前 ${EARN_GAME_TOP} 局照成績給 3～5 枚，還有 ${left} 局。之後每局 1 枚，想玩幾局都可以。` : `今天前 ${EARN_GAME_TOP} 局玩過了，現在每局 1 枚，想玩幾局都可以。`;
}

/* ---------- 娃娃一種一隻，多的留著送人、順便當店員（2026-11-26 改） ----------
   DOLL_N：1 = 家裡有，2 = 家裡有＋一隻留著要送人的。不會超過 2。
   留著的那隻自動站在娃娃機旁邊當店員，每隻一天帶回 2 枚，最多算 3 隻；送出去就不是店員了。 */
const SPARE_COIN = 3;
// 拿到一隻娃娃（夾到、朋友送來、送出去又收回）。回傳 'new' 第一隻、'spare' 留著送人、'coin' 已經留著一隻了，換成幣
function dollGain(d){
  const n = DOLL_N[d] || 0;
  if (n >= 2){ S.coins += SPARE_COIN; renderHud(); return 'coin'; }
  DOLL_N[d] = n + 1; albumMet(d);
  return n ? 'spare' : 'new';
}
// 舊存檔同一種超過兩隻的：多的一次換成幣
function dollCap(){
  let extra = 0;
  DOLLS.forEach(d => { const n = DOLL_N[d] || 0; if (n > 2){ extra += n - 2; DOLL_N[d] = 2; } });
  if (!extra) return 0;
  S.coins += extra * SPARE_COIN; renderHud(); save();
  if (typeof renderTray === 'function') renderTray();
  return extra * SPARE_COIN;
}
// 把留著的那隻送給朋友：直接開送娃娃、選好這一隻
function spareGive(d){
  if (VISIT) return;
  if (typeof ngOpenPick !== 'function' || !ngNet()){ toast('登入、加了好友之後才能送。牠會先在娃娃機當店員'); return; }
  setPage('room');
  ngPick = {doll: d, to: null, m: null, msg: ''};
  ngOpenPick();
}
// 每隻一天帶回 2 枚：隔天第一次打開時領昨天的（好幾天沒來也只領一次，不會累積、也不會被扣）
function earnWorkPay(){
  const e = earnData(), t = todayStr();
  const due = e.work.filter(w => w.t < t);
  if (!due.length) return 0;
  due.forEach(w => w.t = t);
  const n = due.length * EARN_WORK_PAY;
  S.coins += n; renderHud(); save();
  return n;
}
// 娃娃機旁邊站著的店員：點一下可以送給朋友
function earnClerks(){
  let el = $('#clerks');
  if (!el){
    el = document.createElement('div'); el.id = 'clerks'; el.className = 'wk-row'; $('#clawPage').appendChild(el);
    el.addEventListener('click', e => { const b = e.target.closest('[data-clerk]'); if (b) clerkOpen(b.dataset.clerk); });
  }
  earnData();
  const sp = DOLLS.filter(d => (DOLL_N[d] || 0) >= 2);
  if (el.dataset.k === sp.join()) return;   // 沒變就不重畫
  el.dataset.k = sp.join();
  el.hidden = !sp.length;
  el.innerHTML = sp.length ? `<small>店員</small>${sp.map(d => `<button data-clerk="${d}" aria-label="店員${DOLL_NAME[d]}，點一下可以送給朋友"><img src="${SPR[d]}" alt=""></button>`).join('')}` : '';
}
function clerkOpen(d){
  if (VISIT || (DOLL_N[d] || 0) < 2) return;
  const paid = earnData().work.some(w => w.d === d);
  openSheet(`<div class="hd"><img class="st-hdimg" src="${SPR[d]}" alt=""><span>店員${DOLL_NAME[d]}</span></div>
    <div class="er-box"><p class="er-hi">家裡已經有一隻${DOLL_NAME[d]}，這隻在等你把牠送給朋友。等的時候牠在娃娃機當店員${paid ? `，每天帶回 ${EARN_WORK_PAY} 枚` : `（店員的幣最多算 ${EARN_WORK_MAX} 隻，牠先站著陪大家）`}。</p></div>
    <div class="ml-ft"><button class="btn" data-clerkx="1">讓牠繼續顧店</button><button class="btn y" data-clerkg="${d}">送給朋友</button></div>`);
  evOpen = false; alOpen = false;
}
$('#sheet').addEventListener('click', e => {
  if (e.target.closest('[data-clerkx]')){ $('#sheet').hidden = true; return; }
  const b = e.target.closest('[data-clerkg]'); if (b) spareGive(b.dataset.clerkg);
});

/* ---------- 小島收成：花圃每天摘一次花，樹每兩天掉一顆果子。不算自己一天 3 次 ---------- */
const EARN_FLOWER = '<svg viewBox="0 0 40 40"><path d="M20 36V22" stroke="#4f9a3c" stroke-width="3" stroke-linecap="round"/><g fill="#ffb3d3" stroke="#e0609d" stroke-width="2"><circle cx="20" cy="9" r="5"/><circle cx="12" cy="15" r="5"/><circle cx="28" cy="15" r="5"/><circle cx="15" cy="23" r="5"/><circle cx="25" cy="23" r="5"/></g><circle cx="20" cy="16.5" r="4.4" fill="#ffd75e" stroke="#d99a1c" stroke-width="1.8"/></svg>';
const EARN_FRUIT = '<svg viewBox="0 0 40 40"><circle cx="20" cy="23" r="12" fill="#ff9aa8" stroke="#d95a70" stroke-width="2.4"/><path d="M20 12c0-4 2-6 5-7" fill="none" stroke="#8a5a3a" stroke-width="2.4" stroke-linecap="round"/><path d="M22 9c4-3 8-2 9 1-3 2-7 2-9-1z" fill="#8fd47a" stroke="#4f9a3c" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 20c1-3 3-4 5-4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
function earnHvCan(i){
  const p = S.yard && S.yard.p[i]; if (!p) return false;
  const last = earnData().hv[i], t = todayStr();
  if (p.s === 'flower') return last !== t;
  if (p.s === 'tree') return !last || earnDays(last, t) >= 2;
  return false;
}
function earnYardBtns(i){
  const p = S.yard.p[i];
  if (p.s !== 'flower' && p.s !== 'tree') return '';
  const fl = p.s === 'flower';
  return earnHvCan(i)
    ? `<div class="yd-acts"><button class="yd-a" data-hv="${i}"><span class="yd-hand">${fl ? EARN_FLOWER : EARN_FRUIT}</span><span>${fl ? '摘一朵花' : '撿果子'}</span></button></div>`
    : `<p class="yd-nt">${fl ? '今天摘過了，明天還會開。' : '果子還沒長出來，兩天一顆。'}</p>`;
}
$('#yard').addEventListener('click', e => {
  const b = e.target.closest('[data-hv]'); if (!b || VISIT) return;
  const i = +b.dataset.hv; if (!earnHvCan(i)) return;
  const e2 = earnData(), fl = S.yard.p[i].s === 'flower';
  e2.hv[i] = todayStr(); e2.bag[fl ? 'flower' : 'fruit']++;
  save(); yardPaint();
  toast(fl ? '摘了一朵花，可以拿去火腿的小店換幣' : '撿到一顆果子，可以拿去火腿的小店換幣');
});
const earnBagN = () => { const b = earnData().bag; return (b.flower || 0) + (b.fruit || 0); };
function earnSellBag(){
  const b = earnData().bag, n = earnBagN(); if (!n) return 0;
  b.flower = 0; b.fruit = 0; S.coins += n; renderHud(); save();
  return n;
}

/* ---------- 愛心換幣：朋友留一顆你多 1 枚（一天最多 5 枚），你去朋友家留愛心自己也拿 1 枚 ---------- */
async function earnHearts(){
  const net = typeof sNet === 'function' ? sNet() : null;
  if (!net || !net.heartsToday || VISIT) return;
  try {
    const n = await net.heartsToday(), e = earnData(), day = nestDayN();
    if (!e.hc || e.hc.d !== day) e.hc = {d: day, n: 0};
    const add = Math.min(EARN_HEART_MAX, n | 0) - e.hc.n;
    if (add > 0){ e.hc.n += add; S.coins += add; renderHud(); save(); toast(`朋友來留了愛心，+${add} 枚幣`); }
  } catch (err) { if (typeof sQuiet === 'function') sQuiet('earn', err); }
}
function earnHeartSent(){ S.coins += 1; renderHud(); save(); }

/* ---------- 里程碑：每項只給一次；已經達成的，更新後第一次打開一次補發 ---------- */
function earnMsList(){
  const L = [], met = (S.album && S.album.met) || {}, cnt = (S.mail && S.mail.n) || {};
  DOLLS.forEach(d => L.push({k: 'doll-' + d, n: 5, ok: !!met[d], t: `第一次遇到${DOLL_NAME[d]}`}));
  Object.entries(EARN_SETS).forEach(([k, ids]) => L.push({k: 'set-' + k, n: 10, ok: ids.every(i => FURN_OWN[i]), t: `湊齊${EARN_SET_NAME[k] || '一個系列'}`}));
  DOLLS.forEach(d => [10, 30].forEach(c => L.push({k: `n${c}-${d}`, n: 10, ok: (cnt[d] || 0) >= c, t: `跟${DOLL_NAME[d]}一起做完 ${c} 件小事`})));
  // 整好 = 石頭和草叢都清掉了
  L.push({k: 'yard', n: 20, ok: !!(S.yard && S.yard.day && !S.yard.p.some(p => p.s === 'rock' || p.s === 'bush')), t: '小島 12 塊地都整好'});
  return L;
}
function earnMsCheck(){
  if (VISIT) return 0;
  const e = earnData(), got = earnMsList().filter(m => m.ok && !e.ms.includes(m.k));
  if (!got.length) return 0;
  const n = got.reduce((a, m) => a + m.n, 0);
  got.forEach(m => e.ms.push(m.k));
  S.coins += n; renderHud(); save();
  toast(got.length === 1 ? `${got[0].t}，+${n} 枚幣` : `達成 ${got.length} 個里程碑，+${n} 枚幣`);
  return n;
}
function earnMsOpen(){
  const e = earnData(), L = earnMsList();
  openSheet(`<div class="hd">${EARN_ICON}<span>里程碑 ${L.filter(m => e.ms.includes(m.k)).length} / ${L.length}</span></div>
    <div class="er-box er-ms">${L.map(m => `<div class="er-it ${e.ms.includes(m.k) ? 'off' : ''}"><span class="tx2"><b>${m.t}</b><small>${e.ms.includes(m.k) ? '領過了' : `${m.n} 枚`}</small></span>${e.ms.includes(m.k) ? CK : ''}</div>`).join('')}</div>
    <div class="ml-ft"><button class="btn" data-erb="1">回上一頁</button></div>`);
}

/* ---------- 接到「現在可以賺幣的事」那張清單 ---------- */
function earnMore(L){
  const e = earnData();
  L.push({ic: `<img src="${SPR.nyanko}" alt="">`, t: '電視小遊戲', s: e.g < EARN_GAME_TOP ? `今天前 ${EARN_GAME_TOP} 局 3～5 枚，還有 ${EARN_GAME_TOP - e.g} 局` : '每局 1 枚，想玩幾局都可以', btn: '玩', go: gameMenu});
  if (S.yard && S.yard.p.some((p, i) => earnHvCan(i))) L.push({ic: EARN_FLOWER, t: '小島有花或果子可以收', s: '收了拿去小店，一個 1 枚', go: () => { $('#sheet').hidden = true; setPage('room'); goRoom('yard'); }});
  if (earnBagN()) L.push({ic: EARN_FRUIT, t: `手上有 ${earnBagN()} 個花和果子`, s: '拿去火腿的小店換幣', btn: '去小店', go: () => { if (typeof shopOpen === 'function') shopOpen(); }});
  // 等著送人的娃娃自動當店員，不用手動派
  if (e.work.length) L.push({ic: `<img src="${SPR[e.work[0].d]}" alt="">`, t: '等著送人的娃娃在娃娃機當店員', s: `每隻一天 ${EARN_WORK_PAY} 枚，現在 ${e.work.length} 隻。點店員可以送給朋友`, btn: '去看', go: () => { $('#sheet').hidden = true; setPage('claw'); }});
  else L.push({ic: CLAW_ICON, t: '夾到已經有的娃娃，可以留著送朋友', s: `等的時候牠會在娃娃機當店員，每隻一天 ${EARN_WORK_PAY} 枚`});
  const ms = earnMsList(), left = ms.filter(m => !e.ms.includes(m.k));
  if (left.length) L.push({ic: CK, t: `里程碑還有 ${left.length} 個`, s: `下一個：${left[0].t}（${left[0].n} 枚）`, btn: '看全部', go: earnMsOpen});
}
$('#sheet').addEventListener('click', e => { if (e.target.closest('[data-erb]')) earnOpen(false); });

// 打開小窩：舊存檔多的娃娃換成幣、店員的幣、補發里程碑（跟每天領幣的提示錯開，才看得到）
setTimeout(() => {
  if (VISIT) return;
  const c = dollCap(), n = earnWorkPay();
  if (c) toast(`每一種娃娃現在家裡一隻、再留一隻送朋友。多的換成了 ${c} 枚幣`);
  else if (n) toast(`店員帶回 ${n} 枚幣`);
  if (c && n) setTimeout(() => toast(`店員帶回 ${n} 枚幣`), 3200);
  earnClerks();
}, 2400);
setTimeout(earnMsCheck, 4400);
setInterval(() => { if (!document.hidden && !VISIT){ dollCap(); earnWorkPay(); earnClerks(); earnMsCheck(); } }, 6000);
addEventListener('nestnet', earnHearts);
document.addEventListener('visibilitychange', () => { if (!document.hidden) earnHearts(); });
