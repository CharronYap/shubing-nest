/* 薯餅的小窩：把房間、娃娃機、每天的小事串起來 */
let page = 'room';
const CLAW_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M4 8h16"/><path d="M12 8v3"/><path d="M9.5 14l2.5-3 2.5 3"/><path d="M7 17.5h4"/></svg>';
const EV_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.6 3.6c-.5.4-1.2 0-1.2-.6V16h.3A2.5 2.5 0 0 1 4 13.5z"/><g fill="#fff"><circle cx="8.5" cy="9.6" r="1.4"/><circle cx="12" cy="9.6" r="1.4"/><circle cx="15.5" cy="9.6" r="1.4"/></g></svg>';
const PAW = '<svg viewBox="0 0 24 24" fill="#6b3a00"><ellipse cx="12" cy="15.5" rx="5" ry="4.2"/><circle cx="6.2" cy="10.2" r="2.1"/><circle cx="10" cy="6.8" r="2.1"/><circle cx="14" cy="6.8" r="2.1"/><circle cx="17.8" cy="10.2" r="2.1"/></svg>';

/* ---------- 換頁：房間 ⇄ 娃娃機 ---------- */
function setPage(p){
  page = p;
  $('#roomPage').hidden = p !== 'room';
  $('#clawPage').hidden = p !== 'claw';
  $('#nav').hidden = p !== 'room';
  $('#pity').hidden = p !== 'claw';
  $('#albBtn').hidden = p !== 'room';   // 相簿只在房間裡開
  const sw = $('#swap');
  sw.innerHTML = p === 'room' ? CLAW_ICON : HOUSE;
  sw.setAttribute('aria-label', p === 'room' ? '去娃娃機' : '回房間');
  $('#sheet').hidden = true;
  claw.dir = 0;
  if (p === 'claw'){ renderOpt(); planDay(); if (!S.day.free) setTimeout(() => toast('今天第一次夾，不用幣'), 300); } else layout();
}
$('#swap').addEventListener('click', () => setPage(page === 'room' ? 'claw' : 'room'));

/* ---------- 幣：第一次送 20，之後每天送 10 ---------- */
function grantCoins(){
  const today = todayStr();
  if (!S.opened){ S.opened = true; S.lastDaily = today; S.coins += OPEN_COINS; setTimeout(() => toast(`送你 ${OPEN_COINS} 枚幣`), 500); }
  else if (S.lastDaily !== today){ S.lastDaily = today; S.coins += DAILY_COINS; setTimeout(() => toast(`今天的 ${DAILY_COINS} 枚幣到了`), 500); }
  renderHud(); save();
  if (typeof seasonGrant === 'function') seasonGrant(today);   // 節日家具、週年（js/season.js）
}

/* ---------- 每天的小事 ---------- */
function mulberry32(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s){ let h = 2166136261; for (const c of s){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
// 不在家的娃娃（2026-11-28）：去旅行（'trip'）或去朋友家過夜（'out'），跟 travel.js 的 tvHomeDolls 同一套，在小島上的算在家。
// 直接看存檔，不靠 whereDoll：planDay 第一次跑的時候 travel.js 還沒載入，whereDoll 還沒包上旅行那一層。
// 旅行的回家時間已經過了、只是還沒結算的，算在家（tvCheck 馬上會把牠放回來）
function dollAway(d){
  const A = S.album || {};
  if (A.out && A.out.d === d) return 'out';
  const now = typeof tvNow === 'function' ? tvNow() : Date.now();
  return A.tv && Array.isArray(A.tv.out) && A.tv.out.some(o => o && Array.isArray(o.ds) && o.ds.includes(d) && !(o.t1 <= now)) ? 'trip' : '';
}
const evAway = e => (e.d || []).filter(dollAway);
// 排好以後才出門的：清單那一行灰掉，寫這句；按了也是 toast 這句
function evAwayLine(e){
  const a = evAway(e); if (!a.length) return '';
  if (a.length > 1) return `${a.map(d => DOLL_NAME[d]).join('和')}還沒回家，回來再做。`;
  const d = a[0], n = DOLL_NAME[d];
  if (dollAway(d) === 'out') return `${n}在朋友家過夜，回來再做。`;
  const o = S.album.tv.out.find(o => o && Array.isArray(o.ds) && o.ds.includes(d));
  return o && typeof tvDest === 'function' && typeof TV_PLACES !== 'undefined' && TV_PLACES[o.p] ? `${n}去${tvDest(o.p)}了，回來再做。` : `${n}還沒回家，回來再做。`;
}
function planDay(){
  const today = todayStr();
  if (S.day.date === today) return;
  if (!S.seed) S.seed = Math.floor(Math.random() * 1e9);
  const rnd = mulberry32(hashStr(today) ^ S.seed);
  const pool = EVENTS.filter(e => !e.when && e.d.every(d => DOLL_N[d] && !dollAway(d)) && (typeof yardHas === 'function' ? yardHas(e.yard) : !e.yard));
  for (let i = pool.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  // 節日的小事（js/season.js）：那幾天多排一件，放在最前面
  const fest = typeof festEvents === 'function' ? festEvents(today).slice(0, 1) : [];
  // 下雨天的小事（js/sky.js）：那天多排一件
  const rain = typeof skyEvents === 'function' ? skyEvents(today) : [];
  // 廚房、閣樓的小事（js/rooms.js）：有那一間才排，一天多一件；下雨那天就不再加
  const rm = !rain.length && typeof roomEvents === 'function' ? roomEvents(today) : [];
  S.day = { date: today, ids: [...fest, ...rain, ...rm, ...pool.slice(0, EVENTS_PER_DAY)].map(e => e.id), done: [], tap: {} };
  save();
}
const evById = id => EVENTS.find(e => e.id === id);
function pending(){ return S.day.ids.filter(id => !S.day.done.includes(id)).map(evById).filter(Boolean); }
function wishNeeded(){ return [...new Set(pending().filter(e => e.need && !S.wish[e.need]).map(e => e.need))]; }
// 現在就做得到的：不用道具，或道具已經有了。紅點和娃娃頭上的泡泡只算這些，缺道具的等夾到再亮
const canDo = e => !e.need || S.wish[e.need] > 0;
// 出門的娃娃的那幾件也不算（2026-11-28），回家了才亮
function doable(){ return pending().filter(e => canDo(e) && !evAway(e).length); }
function renderEvBadge(){
  const n = doable().length, all = pending(), left = all.filter(e => !evAway(e).length).length, b = $('#evBtn .bd');
  b.textContent = n; b.hidden = !n;
  $('#evBtn').setAttribute('aria-label', n ? `今天的小事，現在可以做 ${n} 件` : left ? `今天的小事，還有 ${left} 件要先去娃娃機夾道具` : all.length ? '今天的小事，等出門的娃娃回來再做' : '今天的小事都做完了');
}
let evOpen = false;
function openEvents(focus){
  const list = S.day.ids.map(evById).filter(Boolean);
  const done = list.filter(e => S.day.done.includes(e.id)).length;
  const wishes = Object.keys(WISH).map(k => `<span class="${S.wish[k] ? '' : 'none'}" aria-label="${WISH[k].name} ${S.wish[k] || 0} 個">${WISH[k].svg}${S.wish[k] || 0}</span>`).join('');
  const rows = list.map(e => {
    const isDone = S.day.done.includes(e.id), aw = isDone ? '' : evAwayLine(e);
    let btn;
    if (isDone) btn = `<span class="ck">${CKS}</span>`;
    else if (aw) btn = '';
    else if (e.need && !S.wish[e.need]) btn = `<button class="evb go" data-go="claw" aria-label="${WISH[e.need].need}，去娃娃機夾">${CLAW_ICON}<span>去夾</span></button>`;
    else if (e.need) btn = `<button class="evb" data-ev="${e.id}" aria-label="給牠${WISH[e.need].name}">${WISH[e.need].svg}</button>`;
    else if (e.tap){ const n = S.day.tap[e.id] || 0; btn = `<button class="evb" data-ev="${e.id}" aria-label="叫牠（${n}/${e.tap}）">${PAW}<span class="tp">${Array.from({length: e.tap}, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span></button>`; }
    else btn = `<button class="evb" data-ev="${e.id}" aria-label="去看看">${HEART('#ff6fb0', '#fff')}</button>`;
    const need = aw ? `<small class="nd aw">${aw}</small>` : !isDone && e.need ? `<small class="nd ${S.wish[e.need] ? 'have' : ''}">${WISH[e.need].svg}${S.wish[e.need] ? `用掉一個${WISH[e.need].name}` : `${WISH[e.need].need}，娃娃機夾得到`}</small>` : '';
    return `<div class="ev ${isDone ? 'done' : ''} ${aw ? 'away' : ''} ${focus === e.id ? 'hi' : ''}"><span class="fa">${e.d.map(d => `<img src="${SPR[d]}" alt="">`).join('')}</span><p>${isDone ? e.end : e.t}${need}</p>${btn}</div>`;
  }).join('');
  openSheet(`<div class="hd">${EV_ICON}<span>${done} / ${list.length}</span><span class="wishes">${wishes}</span></div>
    <div class="evs">${rows || '<p class="empty">今天很安靜。</p>'}</div>`);
  evOpen = true;
}
function doEvent(id){
  const e = evById(id);
  if (!e || S.day.done.includes(id)) return;
  const aw = evAwayLine(e); if (aw){ toast(aw); return; }   // 有娃娃不在家：不做、不給幣
  if (e.need && !S.wish[e.need]){ toast(`${WISH[e.need].need}，娃娃機夾得到`); return; }
  if (e.tap){
    S.day.tap[id] = (S.day.tap[id] || 0) + 1;
    if (S.day.tap[id] < e.tap){ save(); if (evOpen && !$('#sheet').hidden) openEvents(id); return S.day.tap[id]; }
  }
  if (e.need) S.wish[e.need]--;
  S.day.done.push(id);
  albumCard(id);
  if (typeof mailCount === 'function') mailCount(e);   // 信箱：一起做完幾件（js/mail.js）
  if (e.when && typeof FEST_WHEN !== 'undefined' && FEST_WHEN[e.when] && typeof festDone === 'function') festDone(e);
  S.coins += EVENT_COINS;
  if (typeof giftAfter === 'function') giftAfter(e);   // 有時候娃娃會送東西
  renderHud(); renderEvBadge(); markDolls(); save();
  toast(`+${EVENT_COINS} 枚幣`);
  if (evOpen && !$('#sheet').hidden) openEvents(id);
  return true;
}
$('#evBtn').addEventListener('click', () => { if (evOpen && !$('#sheet').hidden){ $('#sheet').hidden = true; return; } openEvents(); });
$('#sheet').addEventListener('click', e => {
  if (e.target.closest('.x')){ evOpen = false; return; }
  if (e.target.closest('[data-go="claw"]')){ evOpen = false; setPage('claw'); return; }
  const b = e.target.closest('[data-ev]'); if (b) doEvent(b.dataset.ev);
});
$('#setb').addEventListener('click', () => { evOpen = false; });

/* ---------- 房間裡的娃娃：有小事的頭上冒泡泡，點了會說話 ---------- */
function markDolls(){
  if (VISIT) return;
  const who = new Set(doable().map(e => e.d[0]));
  room.querySelectorAll('.doll').forEach(el => {
    const it = items.find(i => String(i.uid) === el.dataset.u);
    el.classList.toggle('has-ev', !!it && who.has(it.id));
  });
}
function afterRender(){ markDolls(); if (typeof afterRoomRender === 'function') afterRoomRender(); save(); }
function say(it, text){
  room.querySelectorAll('.say').forEach(s => s.remove());
  const [, h] = sizeOf(it);
  const b = document.createElement('div'); b.className = 'say';
  b.textContent = text;
  // 字多的時候對話框比較寬，靠邊的娃娃說話才不會被切掉
  const half = Math.min(42, 6 + [...String(text)].length * 1.9);
  b.style.left = Math.max(half, Math.min(100 - half, it.x)) + '%';
  b.style.top = Math.max(6, roomY(it.y) - h - 2) + '%';
  room.appendChild(b);
  try { sayFit(b, it, h); } catch (e) { console.info('[say]', e); }
  setTimeout(() => b.classList.add('out'), 1900);
  setTimeout(() => b.remove(), 2300);
}
/* 泡泡放上去之後量一次位置（2026-11-27）：
   左右：整個泡泡留在畫面裡，小尖角還是指著娃娃。
   上下：平常放在娃娃頭上。上緣會碰到上面那幾排按鈕、小劇場那一條、房間的木牌（各留 6px），娃娃自己被它們擋到，或超出房間上緣，就改放到娃娃腳下、小尖角朝上。
   這幾樣都疊在泡泡上面，所以是泡泡讓開，不是把泡泡往上疊。 */
const SAY_OVER = '#skitBar,.hud-g,.rsign.on';
function sayFit(b, it, h){
  const R = room.getBoundingClientRect(), w = b.offsetWidth, bh = b.offsetHeight;
  if (!R.width || !R.height || !w) return;
  const PAD = 6, TIP = 6, GAP = 6, px = R.width * it.x / 100;
  const cx = w + PAD * 2 >= R.width ? R.width / 2 : Math.max(PAD + w / 2, Math.min(R.width - PAD - w / 2, px));
  b.style.left = cx / R.width * 100 + '%';
  const lim = Math.max(0, w / 2 - 13);
  b.style.setProperty('--ax', Math.max(-lim, Math.min(lim, px - cx)).toFixed(1) + 'px');
  const over = [...document.querySelectorAll(SAY_OVER)].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
    .map(e => { const q = e.getBoundingClientRect(); return {l: q.left - R.left, r: q.right - R.left, t: q.top - R.top, b: q.bottom - R.top}; })
    .filter(o => o.l < cx + w / 2 + 4 && o.r > cx - w / 2 - 4).sort((a, c) => a.t - c.t);
  // foot：泡泡的下緣；feet：娃娃的腳。頭上有名牌的（來過夜的客人）：泡泡下緣的小尖角在名牌上緣之上，留 4px
  const head = R.height * (roomY(it.y) - h) / 100, foot = it.tagH ? head - 2 - it.tagH - 4 - TIP : head - R.height * .02, top = foot - bh, feet = R.height * roomY(it.y) / 100;
  // 從泡泡上緣一路看到娃娃的腳：娃娃自己被那一條擋住一半的時候，泡泡也不留在那一條上面，免得看不出是誰在講
  if (top >= 4 && !over.some(o => top < o.b + GAP && feet > o.t)){ b.style.top = foot / R.height * 100 + '%'; return; }
  let y = R.height * (roomY(it.y) + 1.5) / 100 + TIP;
  over.forEach(o => { if (y - TIP < o.b + GAP && y + bh > o.t) y = o.b + GAP + TIP; });
  b.classList.add('dn');
  b.style.top = Math.max(TIP, Math.min(y, R.height - bh - 4)) / R.height * 100 + '%';
}
const lastLine = {};
function onDollTap(it){
  if (typeof awayWake === 'function' && awayWake(it)) return;   // 晚上睡著的不吵醒，看牠的夢
  const ev = doable().find(e => e.d[0] === it.id) || doable().find(e => e.d.includes(it.id));
  if (ev && ev.tap){
    const r = doEvent(ev.id);
    say(it, r === true ? '……嗯？' : '……');
    return;
  }
  if (ev){ openEvents(ev.id); return; }
  const wet = typeof skyLine === 'function' ? skyLine(it.id) : '';   // 下雨天偶爾說一句跟雨有關的
  if (wet){ say(it, wet); return; }
  const lines = LINES[it.id];
  let i = Math.floor(Math.random() * lines.length);
  if (i === lastLine[it.id]) i = (i + 1) % lines.length;
  lastLine[it.id] = i;
  albumHear(it.id, i);
  say(it, lines[i]);
}

/* ---------- 選爪子 ---------- */
const CLAW_ORDER = ['egg', 'chick', 'cat', 'candy', 'gold'];
function renderOpt(){
  $('#optClaw').innerHTML = CLAW_ORDER.map(s => {
    const lock = S.wins < CLAW_UNLOCK[s];
    return `<button class="${s === clawStyle ? 'on' : ''} ${lock ? 'lock' : ''}" data-s="${s}" aria-label="${lock ? '還沒解鎖的爪子' : '換這個爪子'}" aria-pressed="${s === clawStyle}"><canvas data-s="${s}"></canvas>${lock ? LOCK : ''}</button>`;
  }).join('');
  clawThumbs();
}
$('#optClaw').addEventListener('click', e => {
  const b = e.target.closest('button[data-s]'); if (!b) return;
  const s = b.dataset.s, need = CLAW_UNLOCK[s] - S.wins;
  if (need > 0){ toast(`再夾到 ${need} 次就有`); return; }
  clawStyle = S.clawStyle = s; save(); renderOpt();
});
function afterPrize(){
  if (CLAW_ORDER.some(s => CLAW_UNLOCK[s] === S.wins && S.wins > 0)) toast('有新的爪子了');
  renderOpt();
  if (typeof setCheck === 'function') setCheck();   // 湊齊家具系列的獎品（js/furnfx.js）
  // 夾到新娃娃後，如果今天還沒排滿，補一件跟牠有關的小事
  if (S.day.ids.length < EVENTS_PER_DAY){
    const more = EVENTS.filter(e => !e.when && !S.day.ids.includes(e.id) && e.d.every(d => DOLL_N[d] && !dollAway(d)) && (typeof yardHas === 'function' ? yardHas(e.yard) : !e.yard));
    if (more.length){ S.day.ids.push(more[Math.floor(Math.random() * more.length)].id); renderEvBadge(); }
  }
}

/* ---------- 開始 ---------- */
// 每一步各自包起來：一步出錯不能擋住後面（2026-11-27：畫房間丟例外，娃娃機和每天的幣都沒跑）
const startStep = (name, fn) => { try { fn(); } catch (e) { console.error('[start] ' + name + ' 出錯，後面照常跑', e); } };
startStep('不認得的東西', () => { if (typeof roomQuarantine === 'function') roomQuarantine(); });
startStep('今天的小事', planDay);
startStep('畫房間', load);
startStep('每天的幣', grantCoins);
startStep('小事的數字', renderEvBadge);
startStep('切到房間', () => setPage('room'));
startStep('娃娃機', initClaw);
startStep('收納架的高度', () => { trayTo('c'); });   // 一律從收著開始（以前記的 h、f 都不用了，js/room.js）
// 開著過了午夜：換新的一天
setInterval(() => { if (S.day.date !== todayStr()){ planDay(); grantCoins(); renderEvBadge(); markDolls(); } }, 60000);

/* 1127-25 手機防誤觸：iOS Safari 的雙指縮放不看 touch-action（css/style.css 的 #screen），遊戲畫面裡另外擋 gesturestart。
   只擋 #screen 裡面，畫面外照樣能縮放；也不動 viewport。圖片、按鈕不能被拖走（輸入框裡的字照樣能拖） */
['gesturestart', 'gesturechange'].forEach(ty => document.addEventListener(ty, e => { if (e.target instanceof Element && e.target.closest('#screen')) e.preventDefault(); }, {passive: false}));
$('#screen').addEventListener('dragstart', e => { if (!(e.target instanceof Element && e.target.closest('input,textarea'))) e.preventDefault(); });
