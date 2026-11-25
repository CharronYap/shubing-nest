/* 幫朋友的小島澆水（第五版）
   去朋友家：上面房間鈕多一顆小島（朋友去過自己的小島才有），點了看他的島，只能看。
   - 種下去還沒長大的地（種好的、冒芽的）可以幫忙澆一次。每個朋友每天一次、一次一塊地，澆的人拿 1 枚幣。
   - 沒有東西可以澆時只能看，不出現澆水鈕。
   主人：下次打開遊戲，那塊地直接長大一步（種好的→冒芽，冒芽的→長好），地上插一支小牌子「○○來澆過水」，點那塊地可以收掉。
   - 朋友幫忙不算自己一天 3 次。一天最多收 3 個朋友的澆水，多的留到隔天。
   不懲罰、不催人：沒人來澆不會怎樣，種子一樣一直等著；牌子不收也不會怎樣。
   雲端：公開資料 nestRooms/{自己}.yard = {p:[{s, k}×12]}（只給人看）
         nestRooms/{主人}/water/{日子_澆的人} = {from, fromName, day, plot}
   存檔（都放在 S.yard 裡）：wd = [套用過的編號]（最多 30 個，刪除失敗也不會長兩次）、ws = [{p:第幾塊, n:名字}]（小牌子）、wn = {d:'日期', n:今天收了幾個} */
const WATER_DAY = 3, WATER_COIN = 1;
const WATER_ICON = '<svg viewBox="0 0 24 24"><path d="M12 3c-3.6 4.6-5.6 7.4-5.6 10.2a5.6 5.6 0 0 0 11.2 0C17.6 10.4 15.6 7.6 12 3z" fill="currentColor"/><path d="M9.4 13.4c0 1.6 1 2.8 2.4 3.1" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>';
let wg = null, waterBusy = false;

// 朋友公開的那份：格式不對就當作沒有小島；不認得的地當空地
function waterClean(y){
  if (!y || !Array.isArray(y.p) || y.p.length !== YARD_COLS * YARD_ROWS) return null;
  return {p: y.p.map(p => {
    const s = p && YARD_GROUND[p.s] ? p.s : 'empty', o = {s};
    if (p && typeof p.k === 'string' && (YARD_SEED[p.k] || YARD_DECO[p.k])) o.k = p.k;
    if (s === 'deco' && !YARD_DECO[o.k]) o.s = 'empty';
    return o;
  })};
}
const waterCan = p => p && (p.s === 'seed' || p.s === 'sprout');

/* ---------- 去朋友家：看他的小島 ---------- */
function waterOpen(){
  if (!VISIT || !VISIT.yard) return;
  const uid = VISIT.uid;
  if (!wg || wg.uid !== uid) wg = {uid, name: VISIT.name, y: VISIT.yard, done: null, busy: false};
  yardOn = true; ySel = -1;
  $('#yard').hidden = false; screen.classList.add('inyard');
  $('#sheet').hidden = true;
  waterPaint(); renderNav();
  if (!REDUCE) $('#yard').animate([{opacity:0, transform:'translateY(12px)'}, {opacity:1, transform:'none'}], {duration:240, easing:'ease-out'});
  const net = sNet(), g = wg;
  if (net && g.done === null) net.waterMine(uid, nestDayN()).then(x => { g.done = !!x; if (wg === g && yardOn && VISIT) waterPaint(); }).catch(e => sQuiet('water', e));
}
function waterPaint(){
  const g = wg; if (!g || !VISIT) return;
  $('#yard').classList.toggle('night', isNight());
  $('#ydMap').innerHTML = yardSVG(g.y);
  const any = g.y.p.some(waterCan);
  let body;
  if (ySel < 0) body = `<p class="yd-hi">${any ? '種下去還沒長大的地，可以幫忙澆一次水。' : '現在沒有要澆水的地，四處看看就好。'}</p>`;
  else {
    const p = g.y.p[ySel];
    const name = p.s === 'deco' ? YARD_DECO[p.k] : YARD_NAME[p.s], desc = p.s === 'deco' ? YARD_DECO_DESC[p.k] : YARD_DESC[p.s];
    let act = '';
    if ((g.y.ws || []).some(w => w.p === ySel)) act = '<p class="yd-nt">你澆過水了。他下次打開小窩，這塊地就會長大一點。</p>';
    else if (waterCan(p)) act = g.done ? '<p class="yd-nt">今天幫他澆過了，明天可以再來。</p>'
      : sNet() ? `<div class="yd-acts"><button class="yd-a" data-wg="go"><span class="yd-hand">${WATER_ICON}</span><span>幫忙澆水</span></button></div>` : '';
    body = `<div class="yd-hd"><b>${name}</b><small>${desc}</small></div>${act}`;
  }
  $('#ydPanel').innerHTML = `<div class="yd-top"><b class="wg-ttl">${txSlot(g.name)}的小島</b><button class="btn sm" data-wg="back">回房間</button></div>${body}`;
}
function waterClick(e){
  const g = wg; if (!g || g.busy) return;
  const t = e.target.closest('.yd-p');
  if (t){ const i = +t.dataset.p; ySel = ySel === i ? -1 : i; waterPaint(); return; }
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.wg === 'back'){ yardClose(); renderNav(); return; }
  if (b.dataset.wg === 'go') waterGive();
}
async function waterGive(){
  const g = wg, net = sNet(), plot = ySel;
  if (!g || !net || g.busy || g.done || !waterCan(g.y.p[plot])) return;
  g.busy = true;
  try {
    await net.waterAdd(g.uid, nestDayN(), {fromName: net.me.name, plot});
    g.done = true;
    g.y.ws = [{p: plot}];
    S.coins += WATER_COIN; save();
    if (typeof renderHud === 'function') renderHud();
    toast(`幫${sText(g.name, 12)}澆了水，拿到 ${WATER_COIN} 枚幣`);
  } catch (e) { sQuiet('water', e); toast(e && e.code === 'permission-denied' ? '現在澆不了，晚點再試' : sErr(e)); }
  g.busy = false;
  if (wg === g && yardOn && VISIT) waterPaint();
}

/* ---------- 自己家：朋友來澆過的水 ---------- */
async function waterApply(){
  const net = sNet(); if (!net || VISIT || waterBusy) return;
  waterBusy = true;
  try {
    const list = (await net.waters()).filter(w => w && typeof w.id === 'string').sort((a, b) => (a.day | 0) - (b.day | 0));
    if (VISIT) return;
    const y = yardInit(), t = todayStr();
    y.wd = y.wd || []; y.ws = y.ws || [];
    if (!y.wn || y.wn.d !== t) y.wn = {d: t, n: 0};
    const gone = [];
    let changed = false;
    for (const w of list){
      if (y.wd.includes(w.id)){ gone.push(w.id); continue; }   // 套用過、上次沒刪掉的
      if (y.wn.n >= WATER_DAY) break;                            // 多的留到隔天
      // 那塊地已經長好了，就澆另一塊還沒長大的；都沒有的話只留牌子
      let i = w.plot | 0;
      if (!waterCan(y.p[i])){ const j = y.p.findIndex(waterCan); if (j >= 0) i = j; }
      const p = y.p[i];
      if (p && p.s === 'seed'){ p.s = 'sprout'; p.t = t; }
      else if (p && p.s === 'sprout'){ p.s = p.k; delete p.k; delete p.t; }
      if (p){
        y.ws = y.ws.filter(x => x.p !== i);
        y.ws.push({p: i, n: sText(w.fromName, 12) || '朋友'});
        if (y.ws.length > 6) y.ws.splice(0, y.ws.length - 6);
      }
      y.wd.push(w.id); if (y.wd.length > 30) y.wd.splice(0, y.wd.length - 30);
      y.wn.n++; gone.push(w.id); changed = true;
    }
    if (changed){ save(); if (yardOn) yardPaint(); }
    gone.forEach(id => net.waterDel(id).catch(e => sQuiet('water', e)));
  } catch (e) { sQuiet('water', e); }
  finally { waterBusy = false; }
}
// 選到有牌子的地：下面多一行「○○來澆過水」和收掉的按鈕
function waterSignNote(i){
  const w = ((S.yard && S.yard.ws) || []).find(x => x.p === i);
  return w ? `<p class="yd-nt wg-nt"><span>${txSlot(w.n)}來澆過水</span><button class="btn sm" data-wsok="${i}">收起牌子</button></p>` : '';
}
function waterSignClick(e){
  const b = e.target.closest('[data-wsok]'); if (!b) return false;
  const y = S.yard; y.ws = (y.ws || []).filter(x => x.p !== +b.dataset.wsok);
  save(); yardPaint();
  return true;
}
addEventListener('nestnet', waterApply);
document.addEventListener('visibilitychange', () => { if (!document.hidden) waterApply(); });
