/* 娃娃去朋友家過夜（第五版）：讓一隻娃娃去朋友家住一晚，隔天帶著日記回來。跟送娃娃是兩件事，牠還是你的。
   出門：去朋友家時按下面的「讓娃娃過夜」，選一隻。一次只能有一隻在外面。
     - 自己的房間裡，牠原本的位置留一張小紙條「去○○家過夜了」；收納架那隻標月亮。點紙條可以提早叫牠回來。
   朋友那邊：牠出現在客廳，頭上有名牌「○○家的薯餅」，穿著出門時的衣服。主人可以點牠冒愛心、拖到想放的地方、
     塞一張小紙條讓牠帶回去（自己打字，40 字以內），不想留就「送牠回家」，不用理由。同時最多顯示 3 隻客人。
     牠會跟家裡的娃娃一樣自己到處晃、坐下、晚上找地方睡，也會跟家裡的娃娃講話（2026-11-27，見下面 stayIt）。
   回家：隔天早上 5 點以後打開小窩，牠就回來了，回到原本的位置，帶著：
     - 一封信：一句過夜日記（data.js 的 STAY_DIARY，照朋友家實際擺的家具和娃娃挑）＋主人塞的小紙條
     - 相簿那一頁記一行「○月○日去○○家過夜」
   不懲罰、不催人：朋友一直沒打開遊戲也沒關係，娃娃照樣隔天回來、日記照樣有；被主人提早送回家也一樣有日記，不寫原因。
   雲端：nestStays/{出門的人} = {from, fromName, to, doll, look, day, note, x, y}，一人一筆所以一次一隻。
     出門的人建立和刪除；主人只能改 note、x、y，也能刪（送牠回家）。不用 transaction：回家是出門的人打開遊戲時自己刪掉那筆。
   存檔：S.album.out = {d, to, w:朋友名字, t:'出門那天', from:原本的房間, x, y}   S.album.trips = {娃娃:['日期|朋友名字']}（一隻留 12 筆）

   小紙條不能弄丟（2026-11-26，使用者回報「別人家寵物來我家，我留言塞給他回去，他都找不到留言在哪裡」）：
   - 主人「送牠回家」時：有紙條（包括框裡打了字、還沒按「塞給牠」的）就不刪那一筆，改成把位置設成 x=0、y=0 當「送回家了」的記號
     （畫面上客人的位置一定在 x 8～92、y 56～98，0,0 不會自己出現），紙條留在雲端等出門的人來拿。
     用位置當記號是因為規則只准主人改 note、x、y，這樣不用重新發布規則。沒有紙條的照舊直接刪掉。
   - 出門的人：看到 0,0 就當作被送回家，帶日記和紙條回來，再刪掉那一筆。提早叫回來的，有紙條也照樣帶一封信。
   - 回家時雲端還沒連上（例如打開遊戲前 3 秒、斷線），娃娃先回來，那一筆留在雲端；之後連上時看到還留著、上面有紙條，
     就補進那封日記（沒有日記就補寫一封），不再直接丟掉（stayLateNote）。
   - 帶著紙條回來的那一次，房間裡跳一張卡片把紙條直接給你看（stayNoteShow），之後在朋友面板「他那邊來的」那一行也看得到。 */
const STAY_HOME_H = 5, STAY_GUESTS = 3, STAY_LEN = 40;
const stayBye = g => !!g && g.x === 0 && g.y === 0;   // 主人按了「送牠回家」、上面還有紙條（見上面）
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
  const can = DOLLS.filter(d => DOLL_N[d] && whereDoll(d) !== 'trip');   // 去旅行的不能再去過夜
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
      // 坐在家具上的：存檔裡牠的位置是畫的時候才算的（平常是 0,0），這裡自己算一次，紙條才會貼在那個座位上；回來坐回同一個位子
      const f = it.sit ? home[r].items.find(x => x.uid === it.sit && x.kind === 'furn' && FURN[x.id] && FURN[x.id].seats) : null;
      if (f){ try { const [sx, sy] = seatPos(f, it.seat || 0); Object.assign(o, {x: Math.round(sx), y: Math.round(sy), sit: f.uid, seat: it.seat || 0}); } catch (e) { Object.assign(o, {x: Math.round(f.x), y: Math.round(f.y)}); } }
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
  // 舊資料：出門前坐在家具上、位置記成 0,0 的，放到房間中間，不要貼在左上角
  if (!o.sit && !it.x && !it.y){ it.x = 50; it.y = 90; }
  // 原本坐著的那件家具還在、位子也還空著，就坐回去
  const f = o.sit ? home[r].items.find(x => x.uid === o.sit && x.kind === 'furn' && FURN[x.id] && FURN[x.id].seats) : null;
  if (f && !home[r].items.some(x => x.kind === 'doll' && x.sit === f.uid && (x.seat || 0) === (o.seat || 0))){ it.sit = f.uid; it.seat = o.seat || 0; }
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
// 寫一封過夜日記（信箱的 m.l，畫在朋友面板和信箱的「朋友家」），有紙條就一起放。回傳那封信
// uid：朋友的帳號，記在 ;u=，信下面的「回信」（js/letter.js）用它知道要寄給誰（2026-11-27 以前的信沒有）
function stayLetter(d, w, note, room, uid){
  const t = todayStr(), u = typeof uid === 'string' && /^[\w-]{1,64}$/.test(uid) ? ';u=' + uid : '';
  const k = `${d}.trip.${stayDiary(d, room)}#w=${w}${u}${note ? ';x=' + encodeURIComponent(note) : ''}`;
  const m = mailInit(), o = {k: mailWithH(k, mailHmOf()), t, r: 0, a: null, g: 0};   // 日期是今天，時間也用現在（js/mail.js）
  m.l.unshift(o);
  if (typeof mailTrim === 'function') mailTrim(m.l);
  const ar = m.arch[d] = m.arch[d] || [];
  ar.push(`${t}|${k}`); if (ar.length > MAIL_ARCH) ar.splice(0, ar.length - MAIL_ARCH);
  return o;
}
// 回家。diary：帶不帶日記（自己提早叫回來的不帶；但主人塞了紙條的話，一樣寫一封把紙條帶回來）
async function stayHome(diary){
  const o = stayOut(), net = sNet(); if (!o) return;
  let doc = null, room = null;
  if (net) try { doc = await net.stayMine(); } catch (e) { sQuiet('stay', e); }
  const mine = !!doc && doc.to === o.to && doc.doll === o.d;
  const note = mine ? sText(doc.note, STAY_LEN) : '';
  if (net && (diary || note)) try { room = await net.room(o.to); } catch (e) { sQuiet('stay', e); }
  if (!stayOut() || S.album.out.d !== o.d) return;
  stayPutBack(o);
  delete S.album.out;
  if (diary || note){
    stayLetter(o.d, o.w, note, room, o.to);
    const tr = S.album.trips = S.album.trips || {}, l = tr[o.d] = tr[o.d] || [];
    l.push(`${o.t}|${o.w}`); if (l.length > 12) l.splice(0, l.length - 12);
    // 日記在朋友面板（登入了才有），信箱的「朋友家」那一類也有
    const where = net ? '在朋友那裡' : '在信箱';
    setTimeout(() => toast(note ? `${DOLL_NAME[o.d]}從${o.w}家回來了，帶回一張小紙條` : `${DOLL_NAME[o.d]}從${o.w}家回來了，日記${where}`), 800);
    if (typeof memoAdd === 'function') memoAdd('stayBack', o.to, o.w, {id: 'sb' + o.t + o.d, d: o.d, m: note});
    if (note) setTimeout(stayNoteShow, 1800);
  } else toast(`${DOLL_NAME[o.d]}回來了`);
  if (doc && !mine) stayLateNote(doc);   // 雲端留著的是更早那一次的（上面可能有紙條）
  save();
  if (!VISIT){ if (RIDS.includes(roomId)) load(); mailBadge(); }
  // 日記和娃娃都回到自己的存檔了：等存檔上了雲端才結束雲端那一筆
  if (net && doc) sAfterSave(() => net.stayEnd(net.me.uid));
}
// 娃娃已經回來了，雲端那一筆卻還在、上面有紙條（回家那時候還沒連上雲端，或是更早那一次留下的）：
// 把紙條補進那一次的日記；那一次沒有日記（提早叫回來）就補寫一封。回傳 true = 補了
function stayLateNote(doc){
  const note = sText(doc && doc.note, STAY_LEN), d = doc && doc.doll;
  if (!note || !DOLLS.includes(d) || typeof doc.to !== 'string') return false;
  const memo = typeof memoList === 'function' ? memoList() : [];
  const named = memo.find(e => e.u === doc.to && e.n);
  const w = ngName(named ? named.n : ''), dep = new Date((doc.day | 0) * 864e5).toISOString().slice(0, 10);
  const m = mailInit();
  // 那一次的日記：同一隻、同一個朋友、出門那天以後寫的
  const hit = m.l.find(o => { try { const p = mailParse(o.k); return p.type === 'trip' && p.d === d && (p.p.w || '') === w && o.t >= dep; } catch (e) { return false; } });
  if (hit){
    if (mailParse(hit.k).p.x) return false;   // 已經帶回來了（回家和刪掉雲端那一筆之間又看了一次）
    const k = hit.k + (hit.k.includes('#') ? ';' : '#') + 'x=' + encodeURIComponent(note);
    const ar = m.arch[d] || [], j = ar.lastIndexOf(`${hit.t}|${hit.k}`);
    if (j >= 0) ar[j] = `${hit.t}|${k}`;
    hit.k = k; hit.r = 0; delete hit.sn;
  } else stayLetter(d, w, note, null, doc.to);
  const back = memo.find(e => e.k === 'stayBack' && e.u === doc.to && e.d === d && e.t >= dep);
  if (back){ back.m = note; back.ts = Date.now(); }
  else if (typeof memoAdd === 'function') memoAdd('stayBack', doc.to, w, {id: 'sl' + (doc.day | 0) + d, d, m: note});
  save();
  if (!VISIT) mailBadge();
  setTimeout(stayNoteShow, 1800);
  return true;
}
// 帶著紙條回來：房間裡跳一張卡片，把紙條直接給你看（還沒看過的才跳，一次一張）。
// 封面、面板、別的卡片開著，或不在房間那一頁時，先等一下再看
let stNoteT = 0;
function stayNoteShow(){
  clearTimeout(stNoteT);
  if (VISIT || !S.mail || !Array.isArray(S.mail.l)) return;
  const o = S.mail.l.find(o => {
    if (o.sn || o.r || !/^[a-z]+\.trip\./.test(o.k || '')) return false;
    try { return !!mailParse(o.k).p.x; } catch (e) { return false; }
  });
  if (!o) return;
  if (document.hidden || !$('#cover').hidden || !$('#sheet').hidden || screen.querySelector('.over') || $('#tour') || (typeof page !== 'undefined' && page !== 'room')){
    stNoteT = setTimeout(stayNoteShow, 5000); return;
  }
  o.sn = 1; save();
  const x = mailParse(o.k), name = DOLL_NAME[x.d] || '娃娃';
  const ov = document.createElement('div'); ov.className = 'over';
  ov.innerHTML = `<div class="pcard who st-back" role="dialog" aria-label="${name}帶回一張小紙條">
    <div class="pic"><img src="${SPR[x.d]}" alt=""></div>
    <h3>${name}回來了</h3>
    <p class="who-l">牠從<b>${txSlot(x.p.w || '朋友')}</b>家帶回一張小紙條：</p>
    <p class="st-paper">${txSlot(mailDec(x.p.x))}</p>
    <div class="pz-row"><button class="btn y ok" aria-label="收好了">${CKS}</button><button class="btn who-mm">看日記</button></div>
    <small class="st-where">之後在上面的「朋友」→「他那邊來的」也看得到。</small></div>`;
  screen.appendChild(ov);
  const next = () => { stNoteT = setTimeout(stayNoteShow, 1500); };
  ov.querySelector('.ok').onclick = () => { o.r = 1; save(); ov.remove(); next(); };
  ov.querySelector('.who-mm').onclick = () => { ov.remove(); if (typeof frLetterOpen === 'function') frLetterOpen(o); next(); };
}
// 打開小窩、回到這個分頁時看一次：時間到了就回家；還沒到但朋友已經送牠回家，也回來（一樣有日記）
let stChecking = false;
let stayLeft = false;
async function stayCheck(){
  // 沒有娃娃在外面，雲端卻還留著一筆（上次回家後還沒來得及結束）：補結束，不然牠會一直顯示在朋友家
  // 上面有紙條的話先補進日記（stayLateNote），不直接丟掉
  if (!stayOut() && !stayLeft && !VISIT){
    const net0 = sNet();
    if (net0){
      stayLeft = true;
      net0.stayMine().then(doc => { if (doc && !stayOut()){ stayLateNote(doc); sAfterSave(() => net0.stayEnd(net0.me.uid)); } })
        .catch(e => { stayLeft = false; sQuiet('stay', e); });
    }
  }
  const o = stayOut(); if (!o || stChecking || VISIT) return;
  stChecking = true;
  try {
    if (stayDue(o)){ await stayHome(true); return; }
    const net = sNet(); if (!net) return;
    let doc; try { doc = await net.stayMine(); } catch (e) { sQuiet('stay', e); return; }
    // 那一筆不見了（主人沒塞紙條就送牠回家）、或主人送牠回家但留著紙條（stayBye）：回來
    if (!doc || doc.to !== o.to || doc.doll !== o.d || stayBye(doc)) await stayHome(true);
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
    // 太久沒被接回去的（出門的人一直沒打開遊戲）收掉，牠在對方那邊照樣會回家。塞了紙條的多留一陣子，等對方來拿
    all.filter(g => (g.day | 0) <= today - (g.note ? 30 : 7)).forEach(g => net.stayEnd(g.id).catch(() => {}));
    // 當天來的，和昨天來、還沒到早上 5 點的；已經送回家（帶著紙條等對方來拿）的不畫
    stGuests = all.filter(g => !stayBye(g) && (g.day === today || (g.day === today - 1 && h < STAY_HOME_H))).sort((a, b) => a.day - b.day).slice(0, STAY_GUESTS);
  } catch (e) { sQuiet('stay', e); return; }
  stayPaint();
}
/* 客人自己活動、跟家裡的娃娃互動（2026-11-27，使用者說朋友家來的娃娃都不會動、也沒有互動）
   客人不在 items 裡，所以給亂晃那一套（js/roam.js）一隻「假娃娃」：{kind:'doll', id, x, y, uid:'g'+編號, guest:1}。
   x、y 是雲端上的位置，也就是牠的家；晃到哪裡只記在記憶體（RS），不寫雲端。主人拖牠，放下的地方才是新的家，這時才寫一次雲端。
   只在客廳。名牌在同一個元素裡，會跟著走。打過招呼沒有只記在這台裝置（localStorage），不進存檔也不進雲端。 */
const stIts = {};
const stClampX = v => Math.max(8, Math.min(92, +v || 50)), stClampY = v => Math.max(56, Math.min(98, +v || 85));
const ST_HI_KEY = 'shubingNest.gHi';
function stayHiGet(){ try { const o = JSON.parse(localStorage.getItem(ST_HI_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
/* 客人坐家具（2026-11-27）：雲端不加欄位（nestStays 主人只能改 note、x、y），坐下時 x、y 直接寫座位的位置（room.js 的 seatPos）。
   畫的時候反過來找：x、y 跟這間某個家具的座位差不到 1，就當成坐在那裡；對不上（家具被搬走、被別隻坐了）就站著，y 夾回地板 */
function staySeatAt(x, y, me){
  if (roomId !== 'living' || typeof seatPos !== 'function') return null;
  for (const f of items){
    if (f.kind !== 'furn' || !FURN[f.id] || !FURN[f.id].seats) continue;
    for (let k = 0; k < FURN[f.id].seats.length; k++){
      const [sx, sy] = seatPos(f, k);
      if (Math.abs(sx - x) >= 1 || Math.abs(sy - y) >= 1) continue;
      // 那一格已經有別隻（自家坐著的、別的客人坐著的）：不疊上去，站著
      if (items.some(o => o.kind === 'doll' && o.sit === f.uid && o.seat === k) || Object.values(stIts).some(o => o.uid !== me && o.sit === f.uid && o.seat === k)) return null;
      return [f, k];
    }
  }
  return null;
}
// 照雲端上的 x、y 擺回牠的家：坐著的就坐回那一格
function stayHome(it, x, y){
  const s = typeof x === 'number' && typeof y === 'number' ? staySeatAt(x, y, it.uid) : null;
  if (s){ const [sx, sy] = seatPos(s[0], s[1]); it.sit = s[0].uid; it.seat = s[1]; it.x = sx; it.y = sy + .5; }
  else { it.sit = null; it.seat = 0; it.x = stClampX(x); it.y = stClampY(y); }
}
function stayIt(g){
  const it = stIts[g.id] = stIts[g.id] || {kind: 'doll', uid: 'g' + g.id, guest: 1};
  it.id = g.doll; it.g = g;
  if (!it.drag) stayHome(it, +g.x, +g.y);
  // 剛到的那一天、今天還沒有人跟牠打過招呼（js/roam2.js 的 guestTalk）
  it.hi = () => (it.g.day | 0) === nestDayN() && stayHiGet()[it.g.id] !== it.g.day;
  it.hiDone = () => { const h = stayHiGet(), keep = {}; stGuests.forEach(x => { if (h[x.id] !== undefined) keep[x.id] = h[x.id]; }); keep[it.g.id] = it.g.day; try { localStorage.setItem(ST_HI_KEY, JSON.stringify(keep)); } catch (e) {} };
  return it;
}
// 現在在這一間、會自己活動的客人（js/roam.js 的 roamGuests 來問）。去朋友家時：自己在他家過夜的那一隻
function stayRoamList(){
  if (roomId !== 'living') return [];
  if (VISIT) return VISIT.stIt && !VISIT.card ? [VISIT.stIt] : [];
  return stGuests.map(g => stIts[g.id]).filter(Boolean);
}
// 畫一隻客人。drag：可以拖（自己家的客人）；不能拖的（去朋友家看到自己的那一隻）點了只冒愛心、說一句
function stayGuestEl(it, tag, look, g){
  const el = document.createElement('div');
  el.className = 'gst st-guest doll breathe' + (g ? '' : ' st-mine');
  el.dataset.gu = it.uid; el.dataset.d = it.id; el.dataset.pd = it.id;   // pd、pn、pu：拍照（js/photo.js）要知道這是誰家的哪一隻
  if (g){ el.dataset.pn = sText(g.fromName, 12) || '朋友'; el.dataset.pu = g.id; }
  el.innerHTML = `<span class="st-tag">${tag}</span><span class="body">${dollPic(it.id, look)}</span>`;
  const place = () => {
    // 坐著的：家具被搬過就跟著座位走，被收走就站起來
    if (it.sit && !it.drag){ const f = items.find(o => o.uid === it.sit && o.kind === 'furn'); if (f){ const [x, y] = seatPos(f, it.seat); it.x = x; it.y = y + .5; } else { it.sit = null; it.y = stClampY(it.y); } }
    el.style.left = it.x + '%'; el.style.top = roomY(it.y) + '%'; el.style.width = sizeOf(it)[0] + '%'; el.style.zIndex = it.drag ? 500 : zOf(it);
    el.classList.toggle('sit', !!it.sit); el.classList.toggle('breathe', !it.sit);
  };
  place();
  const hold = ms => { if (typeof roamHold !== 'undefined') roamHold = Math.max(roamHold, Date.now() + ms); };
  // 拖：從牠現在晃到的地方開始，放開才寫上雲端（一次）；沒拖：冒愛心、打開牠的小視窗
  // 拖的時候跟自家的娃娃一樣（js/room.js 的 onMove）：家具上空著的座位會亮，靠近就貼上去預覽，放開就坐上去
  let d0 = null, moved = false, hot = null;
  const unDrag = () => { room.classList.remove('dragdoll'); if (typeof clearSeats === 'function') clearSeats(); hot = null; };
  el.addEventListener('pointerdown', e => { d0 = pt(e); moved = false; try { el.setPointerCapture(e.pointerId); } catch (err) {} hold(1500); });
  el.addEventListener('pointermove', e => {
    if (!d0 || !g) return;
    const [px, py] = pt(e);
    if (!moved && Math.hypot(px - d0[0], py - d0[1]) < 2.5) return;
    if (!moved){
      moved = true; it.drag = 1;
      const st = typeof RS !== 'undefined' ? RS[it.uid] : null;
      if (st){ clearTimeout(st.timer); st.busy = false; st.x = null; st.y = null; st.sit = null; }
      el.style.transition = ''; const b = el.querySelector('.body'); if (b) b.classList.remove('roam-hop');
      it.sit = null;
      room.classList.add('dragdoll'); if (typeof showSeats === 'function') showSeats(it);
    }
    // 找最近的座位用手指的位置，不用夾過的：書櫃頂這種高的座位在地板範圍上面，夾過就搆不到
    const fx = px, fy = roomV(py);
    it.x = Math.max(8, Math.min(92, fx)); it.y = Math.max(56, Math.min(98, fy));
    let bd = 10; hot = null;
    room.querySelectorAll('.seat').forEach(s => { const d = Math.hypot(+s.dataset.x - fx, (+s.dataset.y - fy) * .85); if (d < bd){ bd = d; hot = s; } s.classList.remove('hot'); });
    if (hot){ hot.classList.add('hot'); it.x = +hot.dataset.x; it.y = +hot.dataset.y + .5; }
    place(); hold(2500);
  });
  el.addEventListener('pointerup', () => {
    if (!d0) return; d0 = null;
    if (moved && g){
      it.drag = 0;
      const f = hot ? items.find(o => o.uid === +hot.dataset.f && o.kind === 'furn') : null, k = hot ? +hot.dataset.k : 0;
      unDrag();
      if (f){
        // 坐上去：雲端記座位的位置（不四捨五入到整數，重新打開才對得上）
        const [sx, sy] = seatPos(f, k);
        g.x = Math.round(sx * 100) / 100; g.y = Math.round(sy * 100) / 100;
        it.sit = f.uid; it.seat = k; place();
      } else { it.sit = null; g.x = Math.round(it.x); g.y = Math.round(it.y); it.x = g.x; it.y = g.y; place(); }
      if (typeof roamSt === 'function'){
        const st = roamSt(it); st.rest = Date.now() + 60000; st.trips = 0;   // 放到新的地方：那裡是新的家，先待一分鐘
        if (f){ st.x = null; st.y = null; st.sit = f.uid; st.seat = k; if (typeof roamApply === 'function') roamApply(it, el); }
      }
      const net = sNet(); if (net) net.staySet(g.id, {x: g.x, y: g.y}).catch(e => sQuiet('stay', e));
    } else if (g){ stayHeart(it, el); stayGuestOpen(g); }
    else { stayHeart(it, el); const L = typeof ROAM_LINES !== 'undefined' && ROAM_LINES[it.id]; if (L && typeof roamSay === 'function') roamSay(it, L[Math.floor(Math.random() * L.length)]); }
  });
  el.addEventListener('pointercancel', () => { d0 = null; if (moved && g){ it.drag = 0; unDrag(); stayHome(it, +g.x, +g.y); place(); } });
  room.appendChild(el);
  if (typeof asleep === 'function') el.classList.toggle('sleep', asleep(it.id));
  if (typeof spinMount === 'function') try { spinMount(el, it.id); } catch (e) {}
  if (typeof roamApply === 'function') roamApply(it, el);   // 房間重畫之後：牠剛剛晃到哪裡就畫回哪裡
  return el;
}
// 去朋友家：自己有一隻正在他家過夜，就在他家客廳看得到牠（只畫自己那一隻，位置讀自己那一筆 nestStays，不能拖）
function stayMinePaint(){
  const o = stayOut(), net = sNet(), v = VISIT;
  if (!o || !net || !v || v.card || !v.uid || v.uid !== o.to) return;
  if (v.stDoc === undefined){
    v.stDoc = null;
    net.stayMine().then(doc => { if (VISIT !== v) return; v.stDoc = doc && doc.to === o.to && doc.doll === o.d && !stayBye(doc) ? doc : null; if (v.stDoc) stayPaint(); }).catch(e => sQuiet('stay', e));
    return;
  }
  const g = v.stDoc; if (!g || roomId !== 'living') return;
  const it = v.stIt = v.stIt || {kind: 'doll', uid: 'gmine', guest: 1, mine: 1, id: g.doll, hi: () => !v.stHi, hiDone: () => { v.stHi = 1; }};
  if (it.x === undefined) stayHome(it, +g.x, +g.y);   // 主人讓牠坐在家具上的話，在他家看到的也是坐著
  stayGuestEl(it, `你家的${DOLL_NAME[g.doll]}`, stayLook(g.look), null);
}
function stayPaint(){
  room.querySelectorAll('.gst').forEach(e => e.remove());
  if (VISIT){ try { stayMinePaint(); } catch (e) { sQuiet('stay', e); } return; }
  const o = stayOut();
  if (o && o.from === roomId){
    const n = document.createElement('button');
    n.className = 'gst st-note'; n.setAttribute('aria-label', `${DOLL_NAME[o.d]}去過夜了`);
    const old0 = !o.sit && !o.x && !o.y;   // 舊資料：坐在家具上出門、位置記成 0,0 的，紙條放房間中間
    n.style.left = (typeof o.x === 'number' && !old0 ? o.x : 50) + '%'; n.style.top = roomY(typeof o.y === 'number' && !old0 ? o.y : 90) + '%';
    n.style.zIndex = 60 + Math.round((o.y || 90) * 3);   // 牠原本坐在家具上的話，紙條貼在家具前面
    n.innerHTML = `<span>去${txSlot(o.w)}家<br>過夜了</span>`;
    n.onclick = stayTap;
    room.appendChild(n);
  }
  Object.keys(stIts).forEach(k => { if (!stGuests.some(g => g.id === k)) delete stIts[k]; });
  if (roomId !== 'living') return;
  stGuests.forEach(g => stayGuestEl(stayIt(g), `${txSlot(sText(g.fromName, 12) || '朋友')}家的${DOLL_NAME[g.doll]}`, stayLook(g.look), g));
}
function stayHeart(it, el){
  const b = el.querySelector('.body');
  b.classList.remove('r-heart'); void b.offsetWidth; b.classList.add('r-heart');
  setTimeout(() => b.classList.remove('r-heart'), 900);
  const hx = document.createElement('div'); hx.className = 'hfx';
  const [px, py] = typeof roamPos === 'function' ? roamPos(it) : [it.x, it.y];   // 牠晃到哪裡，愛心就冒在哪裡
  hx.style.left = px + '%'; hx.style.top = (roomY(py) - sizeOf({kind: 'doll', id: it.id, x: px, y: py})[1] * .8) + '%';
  hx.innerHTML = HEART(); room.appendChild(hx); setTimeout(() => hx.remove(), 1300);
}
function stayGuestOpen(g){
  stSheet = g;
  openSheet(`<div class="hd"><img class="st-hdimg" src="${SPR[g.doll]}" alt=""><span>${txSlot(sText(g.fromName, 12) || '朋友')}家的${DOLL_NAME[g.doll]}</span></div>
    <div class="st-box"><p class="st-hi">牠來住一晚，明天早上會自己回家。可以拖牠到想放的地方。</p>
      <div class="al-sec">塞一張小紙條讓牠帶回去</div>
      <input class="tx-in st-in" type="text" maxlength="${STAY_LEN}" placeholder="寫一句話（可以不寫）" aria-label="小紙條，${STAY_LEN} 字以內">
      <div class="bk-go"><small>只有牠的主人看得到。牠回家時會交給主人，直接按「送牠回家」也會帶著。</small><button class="btn y sm" data-st="note">塞給牠</button></div></div>
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
      // 框裡打的字：按「塞給牠」或直接按「送牠回家」都算數（以前直接送回家，打了的字和塞過的紙條都會不見）
      const inp = $('#sheet .st-in'), note = inp ? sText(inp.value, STAY_LEN) : sText(g.note, STAY_LEN);
      if (a === 'note'){
        await net.staySet(g.id, {note}); g.note = note;
        toast(note ? `塞給牠了，牠回家時會交給${sText(g.fromName, 12) || '主人'}` : '紙條拿掉了');
      } else {
        // 有紙條：不刪，標成送回家了（stayBye），紙條留著讓對方帶回去；沒紙條照舊直接刪
        if (note) await net.staySet(g.id, {note, x: 0, y: 0}); else await net.stayEnd(g.id);
        stGuests = stGuests.filter(x => x !== g); stayPaint();
        toast(note ? `${DOLL_NAME[g.doll]}帶著小紙條回家了` : `${DOLL_NAME[g.doll]}回家了`);
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
// 雲端連不上也要能回家：時間到了一樣回來，紙條之後連上時再補（stayLateNote）。
// 用帳號存檔的人多等一下，雲端通常幾秒內就連上了，紙條可以跟日記一起回來
setTimeout(() => { if (!sNet()) stayCheck(); }, acctUid() ? 20000 : 3000);
// 帶回來的紙條還沒看過（上次還沒跳卡片就關掉了）：進房間時跳
setTimeout(stayNoteShow, 4000);
