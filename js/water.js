/* 幫朋友的小島澆水（第五版；2026-11-26 跟著小島重做改寫）
   去朋友家：走到他的小島（客廳的門，或上面的房間鈕），點一朵還沒開的花，幫他澆一次水。
   - 每個朋友每天一次、一次一朵，澆的人拿 1 枚幣。已經開的花、空的格子不用澆。
   主人：下次打開遊戲，那朵花快 3 小時（那一格已經開了或空了，就換另一朵還沒開的），那一格插一支小牌子，點一下看是誰、順便收掉。
   - 一天最多收 3 個朋友的澆水，多的留到隔天。
   不懲罰、不催人：沒人來澆不會怎樣，花一樣會開；牌子不收也不會怎樣。
   雲端：公開資料 nestRooms/{自己}.yard = {p:[12 格]}。規則要剛好 12 格，所以前 6 格是花圃（{s:'f', k:花, g:長到哪} 或 {s:'e'} 空的），後 6 格填 {s:'x'}。
         舊版的 12 塊地沒有 x，看到就當作對方還沒有新的小島。
         nestRooms/{主人}/water/{日子_澆的人} = {from, fromName, day, plot}，plot 是第幾格（0～5）
   存檔（都放在 S.yard 裡）：wd = [套用過的編號]（最多 30 個，刪除失敗也不會算兩次）、ws = [{p:第幾格, n:名字}]（小牌子）、wn = {d:'日期', n:今天收了幾個} */
const WATER_DAY = 3, WATER_COIN = 1;
const WATER_ICON = '<svg viewBox="0 0 24 24"><path d="M12 3c-3.6 4.6-5.6 7.4-5.6 10.2a5.6 5.6 0 0 0 11.2 0C17.600 10.400 15.600 7.600 12 3z" fill="currentColor"/><path d="M9.400 13.400c0 1.600 1 2.800 2.400 3.100" fill="none" stroke="#fff" stroke-width="1.600" stroke-linecap="round"/></svg>';
let waterBusy = false;

// 自己公開給朋友看的那一份（js/account.js 的 pushRoom 用）
function waterPublic(){
  const y = S.yard; if (!y || y.v !== 2 || !Array.isArray(y.bed)) return null;
  return {p: [...y.bed.slice(0, 6).map(b => (b ? {s: 'f', k: b.k, g: ydStage(b)} : {s: 'e'})), ...Array.from({length: 6}, () => ({s: 'x'}))]};
}
// 朋友公開的那一份：格式不對、或還是舊版的 12 塊地，就當作他還沒有新的小島
function waterClean(y){
  if (!y || !Array.isArray(y.p) || y.p.length !== 12 || !y.p.slice(6).every(p => p && p.s === 'x')) return null;
  return {bed: y.p.slice(0, 6).map(p => (p && p.s === 'f' && YD_FLOWERS[p.k] ? {k: p.k, g: Math.max(1, Math.min(3, p.g | 0))} : null)), done: null, asked: false, busy: false};
}

/* ---------- 去朋友家：點他的一朵花 ---------- */
async function waterTap(i){
  const v = VISIT, y = v && v.yard; if (!y || y.busy) return;
  const b = y.bed[i], net = sNet();
  if (y.done === i){ toast('你澆過水了。他下次打開小窩，這朵會長快一點'); return; }
  if (!b){ toast('這一格還沒種東西'); return; }
  if (b.g >= 3){ toast(`${YD_FLOWERS[b.k].name}已經開了，不用澆`); return; }
  if (!net){ toast('登入之後才能幫朋友澆水'); return; }
  y.busy = true;
  try {
    if (!y.asked){ const mine = await net.waterMine(v.uid, nestDayN()); y.asked = true; if (mine) y.done = mine && typeof mine.plot === 'number' ? mine.plot : -1; }
    if (y.done !== null){ toast('今天幫他澆過了，明天可以再來'); return; }
    await net.waterAdd(v.uid, nestDayN(), {fromName: net.me.name, plot: i});
    y.done = i;
    S.coins += WATER_COIN; save();
    if (typeof renderHud === 'function') renderHud();
    toast(`幫${sText(v.name, 12)}的${YD_FLOWERS[b.k].name}澆了水，拿到 ${WATER_COIN} 枚幣`);
  } catch (e) { sQuiet('water', e); toast(e && e.code === 'permission-denied' ? '現在澆不了，晚點再試' : sErr(e)); }
  finally { y.busy = false; if (VISIT === v && roomId === 'yard') ydPaint(); }
}

/* ---------- 自己家：朋友來澆過的水 ---------- */
async function waterApply(){
  const net = sNet(); if (!net || VISIT || waterBusy) return;
  waterBusy = true;
  try {
    const list = (await net.waters()).filter(w => w && typeof w.id === 'string').sort((a, b) => (a.day | 0) - (b.day | 0));
    if (VISIT) return;
    const y = yardInit(), t = todayStr();
    y.wd = Array.isArray(y.wd) ? y.wd : [];
    if (!y.wn || y.wn.d !== t) y.wn = {d: t, n: 0};
    const can = j => !!y.bed[j] && ydStage(y.bed[j]) < 3, gone = [];
    let changed = false;
    for (const w of list){
      if (y.wd.includes(w.id)){ gone.push(w.id); continue; }   // 套用過、上次沒刪掉的
      if (y.wn.n >= WATER_DAY) break;                            // 多的留到隔天
      // 那一格已經開了或空了，就澆另一朵還沒開的；都沒有的話只留牌子
      let i = Math.max(0, Math.min(5, w.plot | 0));
      if (!can(i)){ const j = [0, 1, 2, 3, 4, 5].find(can); if (j !== undefined) i = j; }
      if (can(i)) y.bed[i].t -= YD_FRIEND_H * YD_H;
      y.ws = y.ws.filter(x => x.p !== i);
      y.ws.push({p: i, n: sText(w.fromName, 12) || '朋友'});
      if (y.ws.length > 6) y.ws.splice(0, y.ws.length - 6);
      y.wd.push(w.id); if (y.wd.length > 30) y.wd.splice(0, y.wd.length - 30);
      y.wn.n++; gone.push(w.id); changed = true;
    }
    if (changed){ save(); yardPaint(); }
    gone.forEach(id => sAfterSave(() => net.waterDel(id)));   // 等存檔上了雲端才刪
  } catch (e) { sQuiet('water', e); }
  finally { waterBusy = false; }
}
addEventListener('nestnet', waterApply);
document.addEventListener('visibilitychange', () => { if (!document.hidden) waterApply(); });
