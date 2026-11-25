/* 娃娃之間的感情：兩隻放在同一個房間，待得越久越好，只會變好不會變差
   S.album.pals = {'dino|moodeng': 一起待了幾分鐘}（名字照字母排，兩隻一組）
   - 開著遊戲時，每 5 分鐘替同房間的每一對加 5
   - 你不在的時候牠們也待在一起：隔多久回來就加多久，一次最多算 60 分鐘
   - 到「變熟了」那一級，如果這兩隻有一起的小事（data.js 的 EVENTS），當天多排一件 */
const PAL_LV = [20, 90, 240];          // 認識 → 變熟了 → 好朋友，要一起待幾分鐘
const PAL_LV_NAME = ['認識了', '變熟了', '好朋友'];
const PAL_TICK = 5;                     // 開著時幾分鐘算一次
const PAL_AWAY_MAX = 60;                // 不在的時候，一次最多算幾分鐘
const palKey = (a, b) => a < b ? `${a}|${b}` : `${b}|${a}`;
const palLv = n => PAL_LV.filter(v => n >= v).length;   // 0～3
const palPairEv = (a, b) => EVENTS.find(e => e.d.length === 2 && e.d.includes(a) && e.d.includes(b));

function palsData(){ return S.album.pals = S.album.pals || {}; }

/* 每個房間裡的娃娃，兩兩一組加分；回傳這次升級的那幾對 */
function palsAdd(mins){
  const p = palsData(), up = [];
  RIDS.forEach(r => {
    const ds = [...new Set(home[r].items.filter(i => i.kind === 'doll').map(i => i.id))];
    for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++){
      const k = palKey(ds[i], ds[j]), before = palLv(p[k] || 0);
      p[k] = Math.round((p[k] || 0) + mins);
      const after = palLv(p[k]);
      if (after > before) up.push([ds[i], ds[j], after]);
    }
  });
  return up;
}

/* 升級時說一聲；剛變熟的那一對有一起的小事，今天多排一件（已經在今天的清單裡就不加） */
function palsUp(up){
  if (!up.length) return;
  let added = false;
  const msg = [];
  up.forEach(([a, b, lv]) => {
    if (lv < 2) return;   // 剛認識的不打擾你，相簿看得到
    msg.push(`${DOLL_NAME[a]}和${DOLL_NAME[b]}${PAL_LV_NAME[lv - 1]}`);
    const e = palPairEv(a, b);
    if (lv === 2 && e){
      if (S.day.date !== todayStr()) planDay();
      if (!S.day.ids.includes(e.id)){ S.day.ids.push(e.id); added = true; }
    }
  });
  if (added){ renderEvBadge(); markDolls(); }
  if (msg.length) setTimeout(() => toast(msg[0] + (added ? '，今天多一件小事' : '')), 1200);
}

function palsTick(mins){
  const up = palsAdd(mins);
  save();
  palsUp(up);
}

/* 相簿那一頁：跟誰比較好，一顆到三顆心 */
const PAL_HEART = on => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}"><path d="M12 20.5s-8-4.8-8-10.4C4 7.3 6 5.4 8.4 5.4c1.5 0 2.8.8 3.6 2 .8-1.2 2.1-2 3.6-2C18 5.4 20 7.3 20 10.1c0 5.6-8 10.4-8 10.4z"/></svg>`;
function palRows(d){
  const p = S.album.pals || {};
  const list = DOLLS.filter(x => x !== d && palLv(p[palKey(d, x)] || 0) > 0)
    .sort((x, y) => (p[palKey(d, y)] || 0) - (p[palKey(d, x)] || 0));
  if (!list.length) return '';
  return `<div class="al-sec">跟誰比較好</div><div class="al-pal">${list.map(x => {
    const lv = palLv(p[palKey(d, x)]);
    return `<span aria-label="${DOLL_NAME[x]}，${PAL_LV_NAME[lv - 1]}"><img src="${SPR[x]}" alt=""><b>${DOLL_NAME[x]}</b><i>${[1, 2, 3].map(n => PAL_HEART(n <= lv)).join('')}</i></span>`;
  }).join('')}</div>`;
}

/* 開始：上次存檔到現在，牠們也一起待著 */
const palAway = ms => Math.min(PAL_AWAY_MAX, Math.floor(ms / 60000));
if (LAST_T && palAway(Date.now() - LAST_T) >= 1) palsTick(palAway(Date.now() - LAST_T));
setInterval(() => { if (!document.hidden) palsTick(PAL_TICK); }, PAL_TICK * 60000);
let palHid = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ palHid = Date.now(); return; }
  if (palHid && palAway(Date.now() - palHid) >= 1) palsTick(palAway(Date.now() - palHid));
  palHid = 0;
});
