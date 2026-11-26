/* 娃娃去朋友家過夜（第五版）：讓一隻娃娃去朋友家住一晚，隔天帶著日記回來。跟送娃娃是兩件事，牠還是你的。
   出門：去朋友家時按下面的「讓娃娃過夜」，選一隻。一次只能有一隻在外面。
     - 自己的房間裡，牠原本的位置留一張小紙條「去○○家過夜了」；收納架那隻標月亮。點紙條可以提早叫牠回來。
   朋友那邊：牠出現在客廳，頭上有名牌「○○家的薯餅」，穿著出門時的衣服。主人可以點牠冒愛心、拖到想放的地方、
     塞一張小紙條讓牠帶回去（自己打字，40 字以內），不想留就「送牠回家」，不用理由。同時最多顯示 3 隻客人。
   回家：隔天早上 5 點以後打開小窩，牠就回來了，回到原本的位置，帶著：
     - 一封信：一句過夜日記（data.js 的 STAY_DIARY，照朋友家實際擺的家具和娃娃挑）＋主人塞的小紙條
     - 相簿那一頁記一行「○月○日去○○家過夜」
   不懲罰、不催人：朋友一直沒打開遊戲也沒關係，娃娃照樣隔天回來、日記照樣有；被主人提早送回家也一樣有日記，不寫原因。
   雲端：nestStays/{出門的人} = {from, fromName, to, doll, look, day, note, x, y}，一人一筆所以一次一隻。
     出門的人建立和刪除；主人只能改 note、x、y，也能刪（送牠回家）。不用 transaction：回家是出門的人打開遊戲時自己刪掉那筆。
   存檔：S.album.out = {d, to, w:朋友名字, t:'出門那天', from:原本的房間, x, y}   S.album.trips = {娃娃:['日期|朋友名字']}（一隻留 12 筆） */
const STAY_HOME_H = 5, STAY_GUESTS = 3, STAY_LEN = 40;
const STAY_MOON = '<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/><path d="M17 3.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="currentColor"/></svg>';
ICON.out = STAY_MOON;
const stayOut = () => (S.album && S.album.out && DOLLS.includes(S.album.out.d) ? S.album.out : null);
const stayLook = l => { const o = {}; ['hat', 'outfit'].forEach(k => { if (l && typeof l[k] === 'string' && /^[\w-]{1,40}$/.test(l[k])) o[k] = l[k]; }); return o; };
let stGuests = [], stBusy = false, stPick = null, stSheet = null;

/* ---------- 出門 ---------- */
visitExtras.push((f, more) => {
  if (!sNet()) return;
  const b = document.createElement('button');
  b.className = 'btn'; b.innerHTML = `${STAY_MOON}<span>讓娃娃過夜</span>`;
  b.onclick = () => { stPick = {uid: f.uid, name: f.name, d: null}; stayPickPaint(); };
  more.appendChild(b);
});
function stayPickPaint(){
  const p = stPick; if (!p) return;
  const out = stayOut();
  const can = DOLLS.filter(d => DOLL_N[d] && whereDoll(d) !== 'yard' && whereDoll(d) !== 'trip');   // 在小島幫忙的、去旅行的不能再去過夜
  let body;
  if (out) body = `<p class="al-em">${DOLL_NAME[out.d]}已經在${txSlot(out.w)}家過夜了。一次只能有一隻在外面，等牠回來再換別隻。</p>`;
  else if (!can.length) body = '<p class="al-em">還沒有可以出門的娃娃。</p>';
  else body = `<p class="st-hi">選一隻去住一晚。牠還是你的，明天早上 ${STAY_HOME_H} 點以後打開小窩，牠就帶著日記回來。</p>
    <div class="ng-dolls">${can.map(d => `<button class="tile ${p.d === d ? 'on' : ''}" data-std="${d}" aria-label="${DOLL_NAME[d]}" aria-pressed="${p.d === d}"><img src="${SPR[d]}" alt=""></button>`).join('')}</div>`;
  openSheet(`<div class="hd">${STAY_MOON}<span>去${txSlot(p.name)}家過夜</span></div><div class="st-box">${body}</div>
    <div class="ml-ft">${out || !can.length ? '' : `<button class="btn y" data-st="go" ${p.d ? '' : 'disabled'}>去過夜</button>`}</div>`);
  evOpen = false; alOpen = false;
}
async function stayGo(){
  const p = stPick, net = sNet();
  if (!p || !p.d || !net || stBusy || stayOut()) return;
  stBusy = true;
  const d = p.d, w = ngName(p.name);
  try {
    await net.stayGo({to: p.uid, doll: d, look: stayLook(lookOf(d)), day: nestDayN(), x: Math.round(22 + Math.random() * 56), y: Math.round(72 + Math.random() * 18), fromName: net.me.name});
    // 寫上去了才把牠從自己的房間拿走，記下原本在哪
    const o = {d, to: p.uid, w, t: todayStr()};
    const r = RIDS.find(r => home[r].items.some(i => i.kind === 'doll' && i.id === d));
    if (r){
      const it = home[r].items.find(i => i.kind === 'doll' && i.id === d);
      Object.assign(o, {from: r, x: Math.round(it.x), y: Math.round(it.y)});
      home[r].items.forEach(x => { if (x.sit === it.uid) x.sit = null; });
      home[r].items.splice(home[r].items.indexOf(it), 1);
    }
    S.album.out = o; save();
    try { await net.push(); } catch (e) {}
    $('#sheet').hidden = true; stPick = null;
    toast(`${DOLL_NAME[d]}去${w}家過夜了，明天早上回來`);
  } catch (e) { sQuiet('stay', e); toast(sErr(e)); }
  stBusy = false;
}

/* ---------- 自己家：牠不在的時候 ---------- */
function stayTap(){
  const o = stayOut(); if (!o) return;
  stSheet = 'out';
  openSheet(`<div class="hd">${STAY_MOON}<span>${DOLL_NAME[o.d]}去過夜了</span></div>
    <div class="st-box"><p class="st-hi">${DOLL_NAME[o.d]}在${txSlot(o.w)}家。明天早上 ${STAY_HOME_H} 點以後打開小窩，牠就回來了，不用特別等。</p></div>
    <div class="ml-ft"><button class="btn" data-st="call">現在叫牠回來</button></div>`);
  evOpen = false; alOpen = false;
}
// 回到原本的位置（那個位置被佔了、房間不見了就找個空位）
function stayPutBack(o){
  if (!DOLL_N[o.d] || RIDS.some(r => home[r].items.some(i => i.kind === 'doll' && i.id === o.d))) return;
  const r = RIDS.includes(o.from) ? o.from : null; if (!r) return;
  const it = {uid: uid++, kind: 'doll', id: o.d, x: typeof o.x === 'number' ? o.x : 50, y: typeof o.y === 'number' ? o.y : 90, sit: null, seat: 0};
  home[r].items.push(it);
}
function stayDue(o){
  const [y, m, d] = o.t.split('-').map(Number);
  return Date.now() >= new Date(y, m - 1, d + 1, STAY_HOME_H).getTime();
}
// 挑一句日記：朋友家有對應的家具或娃娃的句子優先
function stayDiary(d, room){
  const L = STAY_DIARY[d] || [], has = new Set();
  RIDS.forEach(r => ((room && room.home && room.home[r] && room.home[r].items) || []).forEach(i => { if (i && typeof i.id === 'string') has.add((i.kind === 'doll' ? 'd:' : 'f:') + i.id); }));
  const hit = L.map((e, i) => i).filter(i => L[i].need && has.has(L[i].need));
  const any = L.map((e, i) => i).filter(i => !L[i].need);
  const pool = hit.length && Math.random() < .8 ? hit : any.length ? any : hit;
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : 0;
}
// 回家。diary：帶不帶日記（自己提早叫回來的不帶）
async function stayHome(diary){
  const o = stayOut(), net = sNet(); if (!o) return;
  let doc = null, room = null;
  if (net){
    try { doc = await net.stayMine(); } catch (e) { sQuiet('stay', e); }
    if (diary) try { room = await net.room(o.to); } catch (e) { sQuiet('stay', e); }
  }
  if (!stayOut() || S.album.out.d !== o.d) return;
  stayPutBack(o);
  delete S.album.out;
  if (diary){
    const t = todayStr(), note = doc && doc.to === o.to ? sText(doc.note, STAY_LEN) : '';
    const k = `${o.d}.trip.${stayDiary(o.d, room)}#w=${o.w}${note ? ';x=' + encodeURIComponent(note) : ''}`;
    const m = mailInit();
    m.l.unshift({k, t, r: 0, a: null, g: 0});
    const ar = m.arch[o.d] = m.arch[o.d] || [];
    ar.push(`${t}|${k}`); if (ar.length > MAIL_ARCH) ar.splice(0, ar.length - MAIL_ARCH);
    const tr = S.album.trips = S.album.trips || {}, l = tr[o.d] = tr[o.d] || [];
    l.push(`${o.t}|${o.w}`); if (l.length > 12) l.splice(0, l.length - 12);
    setTimeout(() => toast(`${DOLL_NAME[o.d]}從${o.w}家回來了，信箱有牠的日記`), 800);
    if (typeof memoAdd === 'function') memoAdd('stayBack', o.to, o.w, {id: 'sb' + o.t + o.d, d: o.d});
  } else toast(`${DOLL_NAME[o.d]}回來了`);
  save();
  if (!VISIT){ if (RIDS.includes(roomId)) load(); mailBadge(); }
  // 日記和娃娃都回到自己的存檔了：等存檔上了雲端才結束雲端那一筆
  if (net && doc) sAfterSave(() => net.stayEnd(net.me.uid));
}
// 打開小窩、回到這個分頁時看一次：時間到了就回家；還沒到但朋友已經送牠回家，也回來（一樣有日記）
let stChecking = false;
let stayLeft = false;
async function stayCheck(){
  // 沒有娃娃在外面，雲端卻還留著一筆（上次回家後還沒來得及結束）：補結束，不然牠會一直顯示在朋友家
  if (!stayOut() && !stayLeft && !VISIT){
    const net0 = sNet();
    if (net0){ stayLeft = true; net0.stayMine().then(doc => { if (doc && !stayOut()) sAfterSave(() => net0.stayEnd(net0.me.uid)); }).catch(e => sQuiet('stay', e)); }
  }
  const o = stayOut(); if (!o || stChecking || VISIT) return;
  stChecking = true;
  try {
    if (stayDue(o)){ await stayHome(true); return; }
    const net = sNet(); if (!net) return;
    let doc; try { doc = await net.stayMine(); } catch (e) { sQuiet('stay', e); return; }
    if (!doc || doc.to !== o.to || doc.doll !== o.d) await stayHome(true);
  } finally { stChecking = false; }
}
// 相簿那一頁
function stayRows(d){
  const l = ((S.album.trips || {})[d]) || [], o = stayOut();
  if (!l.length && !(o && o.d === d)) return '';
  return `<div class="al-sec">去朋友家過夜</div><ul class="al-ln al-st">${o && o.d === d ? `<li>現在在${txSlot(o.w)}家過夜</li>` : ''}${l.slice().reverse().map(x => `<li>${md(x.slice(0, 10))}去${txSlot(x.slice(11))}家過夜</li>`).join('')}</ul>`;
}

/* ---------- 朋友家的娃娃來住（自己是主人） ---------- */
async function stayGuestsLoad(){
  const net = sNet(); if (!net) return;
  try {
    const today = nestDayN(), h = new Date().getHours();
    const all = (await net.stayGuests()).filter(g => g && DOLLS.includes(g.doll) && typeof g.id === 'string');
    // 太久沒被接回去的（出門的人一直沒打開遊戲）收掉，牠在對方那邊照樣會回家
    all.filter(g => (g.day | 0) <= today - 7).forEach(g => net.stayEnd(g.id).catch(() => {}));
    // 當天來的，和昨天來、還沒到早上 5 點的
    stGuests = all.filter(g => g.day === today || (g.day === today - 1 && h < STAY_HOME_H)).sort((a, b) => a.day - b.day).slice(0, STAY_GUESTS);
  } catch (e) { sQuiet('stay', e); return; }
  stayPaint();
}
function stayPaint(){
  room.querySelectorAll('.gst').forEach(e => e.remove());
  if (VISIT) return;
  const o = stayOut();
  if (o && o.from === roomId){
    const n = document.createElement('button');
    n.className = 'gst st-note'; n.setAttribute('aria-label', `${DOLL_NAME[o.d]}去過夜了`);
    n.style.left = (typeof o.x === 'number' ? o.x : 50) + '%'; n.style.top = roomY(typeof o.y === 'number' ? o.y : 90) + '%';
    n.style.zIndex = 60 + Math.round((o.y || 90) * 3);   // 牠原本坐在家具上的話，紙條貼在家具前面
    n.innerHTML = `<span>去${txSlot(o.w)}家<br>過夜了</span>`;
    n.onclick = stayTap;
    room.appendChild(n);
  }
  if (roomId !== 'living') return;
  stGuests.forEach(g => {
    const x = Math.max(8, Math.min(92, +g.x || 50)), y = Math.max(56, Math.min(98, +g.y || 85));
    const it = {kind: 'doll', id: g.doll, x, y, uid: 'g' + g.id};
    const el = document.createElement('div');
    el.className = 'gst st-guest doll breathe';
    el.innerHTML = `<span class="st-tag">${txSlot(sText(g.fromName, 12) || '朋友')}家的${DOLL_NAME[g.doll]}</span><span class="body">${dollPic(g.doll, stayLook(g.look))}</span>`;
    const place = () => { el.style.left = it.x + '%'; el.style.top = roomY(it.y) + '%'; el.style.width = sizeOf(it)[0] + '%'; el.style.zIndex = zOf(it); };
    place();
    // 拖：換位置（放開才寫上雲端）；沒拖：冒愛心、打開牠的小視窗
    let d0 = null, moved = false;
    el.addEventListener('pointerdown', e => { d0 = pt(e); moved = false; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => {
      if (!d0) return;
      const [px, py] = pt(e);
      if (!moved && Math.hypot(px - d0[0], py - d0[1]) < 2.5) return;
      moved = true;
      it.x = Math.max(8, Math.min(92, px)); it.y = Math.max(56, Math.min(98, roomV(py)));
      place();
    });
    el.addEventListener('pointerup', () => {
      if (!d0) return; d0 = null;
      if (moved){
        g.x = Math.round(it.x); g.y = Math.round(it.y);
        const net = sNet(); if (net) net.staySet(g.id, {x: g.x, y: g.y}).catch(e => sQuiet('stay', e));
      } else { stayHeart(it, el); stayGuestOpen(g); }
    });
    el.addEventListener('pointercancel', () => { d0 = null; });
    room.appendChild(el);
  });
}
function stayHeart(it, el){
  const b = el.querySelector('.body');
  b.classList.remove('r-heart'); void b.offsetWidth; b.classList.add('r-heart');
  setTimeout(() => b.classList.remove('r-heart'), 900);
  const hx = document.createElement('div'); hx.className = 'hfx';
  hx.style.left = it.x + '%'; hx.style.top = (roomY(it.y) - sizeOf(it)[1] * .8) + '%';
  hx.innerHTML = HEART(); room.appendChild(hx); setTimeout(() => hx.remove(), 1300);
}
function stayGuestOpen(g){
  stSheet = g;
  openSheet(`<div class="hd"><img class="st-hdimg" src="${SPR[g.doll]}" alt=""><span>${txSlot(sText(g.fromName, 12) || '朋友')}家的${DOLL_NAME[g.doll]}</span></div>
    <div class="st-box"><p class="st-hi">牠來住一晚，明天早上會自己回家。可以拖牠到想放的地方。</p>
      <div class="al-sec">塞一張小紙條讓牠帶回去</div>
      <input class="tx-in st-in" type="text" maxlength="${STAY_LEN}" placeholder="寫一句話（可以不寫）" aria-label="小紙條，${STAY_LEN} 字以內">
      <div class="bk-go"><small>只有牠的主人看得到。</small><button class="btn y sm" data-st="note">塞給牠</button></div></div>
    <div class="ml-ft"><button class="btn" data-st="bye">送牠回家</button></div>`);
  $('#sheet .st-in').value = sText(g.note, STAY_LEN);
  evOpen = false; alOpen = false;
}
$('#sheet').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.std && stPick){ stPick.d = b.dataset.std; stayPickPaint(); return; }
  const a = b.dataset.st; if (!a) return;
  const net = sNet();
  if (a === 'go') stayGo();
  else if (a === 'call'){ $('#sheet').hidden = true; if (!stChecking){ stChecking = true; try { await stayHome(false); } finally { stChecking = false; } } }
  else if ((a === 'note' || a === 'bye') && stSheet && stSheet.id && net && !stBusy){
    const g = stSheet;
    stBusy = true;
    try {
      if (a === 'note'){
        const note = sText($('#sheet .st-in').value, STAY_LEN);
        await net.staySet(g.id, {note}); g.note = note;
        toast(note ? '塞給牠了' : '紙條拿掉了');
      } else {
        await net.stayEnd(g.id);
        stGuests = stGuests.filter(x => x !== g); stayPaint();
        toast(`${DOLL_NAME[g.doll]}回家了`);
      }
      $('#sheet').hidden = true;
    } catch (err) { sQuiet('stay', err); toast(err && err.code === 'not-found' ? '牠已經回家了' : sErr(err)); if (err && err.code === 'not-found'){ stGuests = stGuests.filter(x => x !== g); stayPaint(); $('#sheet').hidden = true; } }
    stBusy = false;
  }
});

// 房間每次重畫完，把紙條和客人補回去（接在 away.js 的 afterRoomRender 後面）
{
  const prev = typeof afterRoomRender === 'function' ? afterRoomRender : null;
  afterRoomRender = function(){ if (prev) prev(); stayPaint(); };
}
addEventListener('nestnet', () => { stayCheck(); stayGuestsLoad(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden){ stayCheck(); stayGuestsLoad(); } });
setInterval(() => { if (!document.hidden){ stayCheck(); stayGuestsLoad(); } }, 5 * 60000);
// 沒登入也要能回家（例如出門後登出了）：時間到了一樣回來，只是沒有小紙條
setTimeout(() => { if (!sNet()) stayCheck(); }, 3000);
