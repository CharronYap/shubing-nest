/* 去朋友家拍合照（第二批 06，2026-11-28）
   - 去朋友家時，下面那排多一顆「拍合照」：選一隻自己在家的娃娃（去旅行、去別人家過夜的不列，看 js/main.js 的 dollAway），
     牠站到朋友這間房間下面中間，不疊到家具和朋友的娃娃；找不到位置就站中間。閃一下就拍好，只有「存下來」。
   - 白邊：「{朋友}的小窩・{房間}」，下面一行小字「{我的名字}家的{娃娃}來玩」。火腿那句照舊：朋友家有火腿才說。
   - 照片本身不上傳。寫進 nestRooms/{朋友}/pics/{日子}_{我}：{from, fromName, day, doll, look, x, y, snap}，
     snap 是朋友那間房間按快門時的樣子（跟明信片 js/card.js 的 snap 同一種格式，多記了誰睡著 zz:1）。
     一位朋友一天一張（firestore.rules 擋：不能改），同一天再拍的只存在自己這裡。
   - 兩邊的紀念冊（js/memo.js）：拍的人記 picOut，屋主打開小窩時讀 pics 記 picIn；點那一行就用那份文件重畫。
   - 重畫：photoScene 把房間暫時換成 snap、固定成 600×800（3:4，跟裝置、螢幕大小無關），再叫 photoShoot。
     在朋友家拍的和紀念冊重畫走同一個函式，所以兩邊畫出來一樣。這一版不認得的家具、娃娃照 visitClean 跳過。 */
let picBusy = false;

// 可以帶去的：有這隻、而且在家
const picCan = () => DOLLS.filter(d => DOLL_N[d] && !(typeof dollAway === 'function' && dollAway(d)));

// 按快門那一刻，朋友這間房間的樣子。晃到別的地方的照牠現在的位置記，睡著的記 zz
// 在朋友家的花園（yard）上按的：拍客廳
function picSnap(){
  const rid = ROOM_NAME[roomId] ? roomId : 'living', here = rid === roomId;
  const r = here ? cur() : VISIT.home[rid], look = {}, its = [];
  r.items.forEach(i => {
    if (i.kind === 'doll' ? !SPR[i.id] : !(i.kind === 'furn' && FURN[i.id])) return;
    const o = JSON.parse(JSON.stringify(i)); delete o.drag; delete o.zz;
    if (i.kind === 'doll'){
      const st = here && typeof RS !== 'undefined' ? RS[i.uid] : null;
      if (st && typeof roamAway === 'function' && roamAway(st)){
        const [x, y, f] = roamPos(i);
        o.x = Math.round(x * 10) / 10; o.y = Math.round(y * 10) / 10; o.sit = f ? f.uid : null; o.seat = f ? st.seat | 0 : 0;
      }
      const el = here ? room.querySelector(`.it[data-u="${i.uid}"]`) : null;
      if (el && el.classList.contains('sleep')) o.zz = 1;
      if (VISIT && VISIT.look && VISIT.look[i.id]) look[i.id] = VISIT.look[i.id];
    }
    its.push(o);
  });
  return JSON.parse(JSON.stringify({rid, room: {wall: r.wall, floor: r.floor, items: its, ...(r.light === false ? {light: false} : {})}, look, night: isNight()}));
}

// 帶去的那隻站哪裡：下面中間開始往兩邊找，不疊到家具和站著的娃娃（照片固定 3:4、牆 52%，所以 y 就是畫面上的 %）
function picSpot(list){
  const box = (x, y, w, h) => ({l: x - w / 2, r: x + w / 2, t: y - h, b: y});
  const dollBox = (x, y) => { const w = 22 * depth(y); return box(x, y, w, w * .75); };
  const solid = list.map(i => {
    if (i.kind === 'doll') return i.sit ? null : dollBox(i.x, i.y);   // 坐著的在家具的框裡面
    const f = FURN[i.id]; if (!f || f.wall || f.floor) return null;  // 壁掛、地毯不算擋
    const w = f.w * depth(i.y); return box(i.x, i.y, w, w * (f.vb[1] / f.vb[0]) * .75);
  }).filter(Boolean);
  const hit = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
  for (const y of [86, 92, 80]) for (const x of [50, 41, 59, 32, 68, 23, 77, 15, 85]){
    const a = dollBox(x, y), cx = x, cy = (a.t + a.b) / 2, k = .8;   // 框縮一點再比，邊邊碰到一點點沒關係
    const s = {l: cx - (cx - a.l) * k, r: cx + (a.r - cx) * k, t: cy - (cy - a.t) * k, b: cy + (a.b - cy) * k};
    if (!solid.some(o => hit(s, o))) return {x, y};
  }
  return {x: 50, y: 86};
}

// 火腿那句要兩邊一樣：照文件名字算
const picQuip = pid => { let h = 0; for (const ch of String(pid)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
const picWait = ms => new Promise(ok => setTimeout(ok, ms));
async function picImgs(){
  const ims = [...room.querySelectorAll('img')].filter(im => !im.complete);
  await Promise.race([Promise.all(ims.map(im => (im.decode ? im.decode() : Promise.resolve()).catch(() => {}))), picWait(3000)]);
  await Promise.race([new Promise(ok => requestAnimationFrame(() => ok())), picWait(60)]);
}

/* 照一份房間資料拍：sc = {owner:屋主名字, from:帶娃娃去的人的名字, pid:文件名字, snap, guest:{doll, look, x, y}}
   畫面先蓋一層白，房間暫時換成 snap，拍完全部換回去 */
async function photoScene(sc){
  const sn = sc.snap || {};
  const rid = ROOM_NAME[sn.rid] && sn.rid !== 'yard' ? sn.rid : 'living';
  const one = visitClean({home: {living: sn.room || {}}, look: sn.look}), clean = one.home.living;
  const g = sc.guest || {}, its = clean.items;
  const gu = Math.max(0, ...its.map(i => +i.uid || 0)) + 1000;   // 帶去的那隻：跟房間裡的東西不撞號
  if (SPR[g.doll]) its.push({uid: gu, kind: 'doll', id: g.doll, x: Math.max(5, Math.min(95, +g.x || 50)), y: Math.max(60, Math.min(96, +g.y || 86)), sit: null, seat: 0, look: g.look && typeof g.look === 'object' ? g.look : {}});
  const homeS = {}; [...new Set([...RIDS, rid])].forEach(r => { homeS[r] = clean; });
  const owner = sText(sc.owner, 12) || '朋友', from = sText(sc.from, 12) || '朋友';

  const keep = {VISIT, roomId, roamHold, RATIO, WALL, w: stage.style.width, h: stage.style.height, wh: room.style.getPropertyValue('--wh')};
  const cover = document.createElement('div'); cover.className = 'pic-cover'; screen.appendChild(cover);
  window.PIC_LOCK = true;
  try {
    VISIT = {name: owner, uid: '', home: homeS, look: one.look, card: true, night: !!sn.night};
    roomId = rid; roamHold = Date.now() + 3600e3;
    stage.style.width = '600px'; stage.style.height = '800px'; room.style.setProperty('--wh', '52%'); RATIO = .75; WALL = .52;
    room.classList.add('ph-still');
    load();
    await picImgs();
    // 睡著的照按快門那一刻；帶去的那隻醒著
    room.querySelectorAll('.it.doll').forEach(el => { const it = items.find(i => String(i.uid) === el.dataset.u); if (it) el.classList.toggle('sleep', !!it.zz && it.uid !== gu); });
    return await photoShoot({place: `${owner}的小窩・${ROOM_NAME[rid]}`, sub: SPR[g.doll] ? `${from}家的${DOLL_NAME[g.doll]}來玩` : '', quip: picQuip(sc.pid), notMe: gu});
  } finally {
    room.classList.remove('ph-still');
    VISIT = keep.VISIT; roomId = keep.roomId; roamHold = keep.roamHold; RATIO = keep.RATIO; WALL = keep.WALL;
    stage.style.width = keep.w; stage.style.height = keep.h; room.style.setProperty('--wh', keep.wh);
    window.PIC_LOCK = false;
    try { load(); } finally { layout(); }
    if (REDUCE) cover.remove(); else { cover.classList.add('out'); setTimeout(() => cover.remove(), 450); }
  }
}

/* ---------- 在朋友家：按鈕、選娃娃、拍、寫上去 ---------- */
visitExtras.push((f, more) => {
  if (!sNet()) return;
  const can = picCan(), b = document.createElement('button');
  b.className = 'btn'; b.disabled = !can.length;
  b.innerHTML = `${CAM_ICON}<span>${can.length ? '拍合照' : '大家都出門了'}</span>`;
  b.onclick = () => picPick(f);
  more.appendChild(b);
});
function picPick(f){
  const can = picCan();
  if (!can.length || !VISIT || VISIT.card) return;
  const s = openSheet(`<div class="hd">${CAM_ICON}<span>拍合照</span></div><div class="st-box">
    <div class="ng-dolls">${can.map(d => `<button class="tile" data-pic="${d}" aria-label="${DOLL_NAME[d]}"><img src="${SPR[d]}" alt=""></button>`).join('')}</div></div>`);
  evOpen = false; alOpen = false;
  s.querySelectorAll('[data-pic]').forEach(b => { b.onclick = () => picGo(f, b.dataset.pic); });
}
async function picGo(f, d){
  const net = sNet();
  if (!net || picBusy || !VISIT || VISIT.card || !picCan().includes(d)) return;
  picBusy = true;
  $('#sheet').hidden = true;
  const day = nestDayN(), pid = `${day}_${net.me.uid}`;
  const snap = picSnap(), spot = picSpot(snap.room.items);
  const sc = {owner: f.name, from: sText(net.me.name, 24) || '朋友', pid, snap, guest: {doll: d, look: stayLook(lookOf(d)), x: spot.x, y: spot.y}};
  let shot = null, err = '';
  try { photoFlash(); shot = await photoScene(sc); } catch (e) { console.info('[pic] 沒拍成', e); err = String((e && e.message) || e); }
  finally { picBusy = false; }
  if (!shot){ toast(err ? '沒拍成：' + err.slice(0, 60) : '沒拍成，再試一次'); return; }
  photoPreview(shot);
  picSend(f, sc, net);
}
// 寫上朋友那邊：今天在這位朋友家已經有一張，就只存在自己這裡
async function picSend(f, sc, net){
  const day = +sc.pid.split('_')[0], g = sc.guest, only = `今天已經留一張在${f.name}家了，這張只存在你這裡`;
  try {
    if (await net.picMine(f.uid, day)){ toast(only); return; }
    await net.picAdd(f.uid, day, {fromName: sc.from, doll: g.doll, look: g.look, x: g.x, y: g.y, snap: sc.snap});
    memoAdd('picOut', f.uid, f.name, {id: 'po' + f.uid + sc.pid, d: g.doll, c: sc.pid, day});
    toast(`拍好了，${f.name}的紀念冊也會有一張`);
  } catch (e) {
    sQuiet('pic', e);
    let had = null; try { had = await net.picMine(f.uid, day); } catch (e2) {}   // 同一天另一台裝置先寫了：規則擋下來是 permission-denied
    toast(had ? only : sErr(e));
  }
}

/* ---------- 屋主：打開小窩時讀朋友留下的，記進紀念冊 ---------- */
// S.album.picD = 上次讀到哪一天。同一天的下次還會再讀一次，用 id 認，不會重記
let picPulled = false;
async function picPull(){
  const net = sNet(); if (!net || picPulled || typeof net.pics !== 'function') return;
  picPulled = true;
  const A = S.album, today = nestDayN(), since = Math.max(A.picD | 0, today - 30);
  try {
    const L = await net.pics(since);
    (L || []).forEach(p => {
      if (p && typeof p.id === 'string' && typeof p.from === 'string' && p.from !== net.me.uid && DOLLS.includes(p.doll))
        memoAdd('picIn', p.from, p.fromName, {id: 'pi' + p.id, in: 1, d: p.doll, c: p.id, day: p.day});
    });
    A.picD = today; save();
  } catch (e) { picPulled = false; sQuiet('pic', e); }
}
addEventListener('nestnet', () => { picPulled = false; picPull(); });
if (sNet()) picPull();

/* ---------- 紀念冊點那一行：讀那份文件重畫 ---------- */
async function picOpen(e){
  const net = sNet();
  if (VISIT || picBusy || !e || !e.c) return;
  picBusy = true;
  if (page !== 'room') setPage('room');
  $('#sheet').hidden = true;
  let shot = null;
  try {
    const mine = e.k === 'picIn', p = net ? await net.pic(mine ? net.me.uid : e.u, e.c) : null;
    if (p && p.snap && SPR[p.doll]) shot = await photoScene({owner: mine ? net.me.name : e.n, from: p.fromName, pid: p.id, snap: p.snap, guest: {doll: p.doll, look: p.look, x: p.x, y: p.y}});
  } catch (err) { sQuiet('pic', err); }
  finally { picBusy = false; }
  if (!shot){ toast('這張照片找不到了'); return; }
  photoPreview(shot);
}
