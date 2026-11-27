/* 你不在的時候：隔超過 3 小時再打開，娃娃換了位置、地上多了小東西，進房間時有一張便條
   S.away = {date:'今天', picked:今天撿了幾個, drops:[{r:房間, k:'leaf'|'slipper'|'paper', x, y}], note:[一兩句] 或 null}
   家具不會動。晚上各自的時間睡到早上 7 點（data.js 的 SLEEP_FROM），點睡著的娃娃看牠做的夢，不會吵醒牠 */
const AWAY_GAP = 3 * 3600e3;   // 隔多久算「不在」
const AWAY_MAX = 3;            // 一次最多變幾件
const PICK_MAX = 3;            // 一天最多撿幾個小東西拿幣
// 會跑的程度：薯餅和蛋黃哥幾乎不動；跑到別的房間只有龍龍、皮蛋、彈跳豬
const AWAY_W = {sloth:.08, egg:.08, dog:1, moodeng:1, nyanko:.8, dino:1.2, snoopy:.8, piggy:.7};
const ROAM = ['dino', 'dog', 'moodeng'];
// 誰會在地上留東西
const DROP_BY = {dino:'leaf', dog:'slipper', snoopy:'paper'};
// 便條：mv 是換位置時用的，drop 是留東西時用的，still 是沒動的時候
const AWAY_LINES = {
  sloth:{mv:['薯餅看了一整個下午的雲。'], still:['薯餅還在原來的位置，看起來想了很多事。', '薯餅看了一整個下午的雲。']},
  egg:{mv:['蛋黃哥翻了一次身，然後覺得太累。'], still:['蛋黃哥翻了一次身，然後覺得太累。', '蛋黃哥說今天份的努力用完了。']},
  dog:{mv:['皮蛋在門口等你，等到睡著。'], drop:'皮蛋把一隻拖鞋叼到沙發底下。'},
  moodeng:{mv:['彈跳豬在床上跳了很久。', '彈跳豬說沒人看的時候牠才不跳。']},
  nyanko:{mv:['貓咪老師把點心櫃檢查了三次。', '貓咪老師說牠沒有在等你。']},
  dino:{mv:['龍龍玩捉迷藏，沒有人來找牠。'], drop:'龍龍把一片葉子藏在某個地方。'},
  snoopy:{mv:['史努比開著浴缸飛了一圈。'], drop:'史努比寫了小說的第一句，又撕掉。'},
  piggy:{mv:['火腿說你不在的時候，牠管得很好。', '火腿列了一張大家的壞話清單。']},
};
const DROP_SVG = {
  leaf:'<svg viewBox="0 0 40 30"><path d="M4 22C8 8 22 3 36 6c-2 13-14 21-30 18z" fill="#8fd47a" stroke="#4f9a3c" stroke-width="2.4" stroke-linejoin="round"/><path d="M8 22C16 16 24 12 32 9" fill="none" stroke="#4f9a3c" stroke-width="2" stroke-linecap="round"/><path d="M5 23l-3 4" stroke="#4f9a3c" stroke-width="2.4" stroke-linecap="round"/></svg>',
  slipper:'<svg viewBox="0 0 44 26"><path d="M4 16c0-6 5-10 12-10h12c7 0 13 4 13 9 0 4-3 7-8 7H10c-4 0-6-2-6-6z" fill="#ffb8d4" stroke="#d9649c" stroke-width="2.4" stroke-linejoin="round"/><path d="M17 7c4-3 11-3 15 1 2 3 1 7-1 9H17z" fill="#fff" stroke="#d9649c" stroke-width="2.2" stroke-linejoin="round"/><circle cx="24" cy="11" r="2.4" fill="#ff6fb0"/></svg>',
  paper:'<svg viewBox="0 0 36 30"><path d="M6 10l7-6 9 3 8-2 3 9-4 7 2 5-10 2-8-3-8 1-1-8 3-4z" fill="#fffdf6" stroke="#b9a9b2" stroke-width="2.2" stroke-linejoin="round"/><path d="M11 10l6 5 6-6M10 19l7-2 9 4M20 15l2 9" fill="none" stroke="#d9cdd3" stroke-width="1.6" stroke-linecap="round"/></svg>',
};
const DROP_NAME = {leaf:'葉子', slipper:'拖鞋', paper:'稿紙'};

function awayData(){
  const a = S.away = S.away || {};
  a.drops = a.drops || [];
  if (a.date !== todayStr()){ a.date = todayStr(); a.picked = 0; }
  return a;
}
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function pickW(list){
  const sum = list.reduce((s, d) => s + AWAY_W[d], 0);
  let r = Math.random() * sum;
  for (const d of list){ r -= AWAY_W[d]; if (r <= 0) return d; }
  return list[list.length - 1];
}
function dollAt(d){ for (const r of RIDS){ const it = home[r].items.find(i => i.kind === 'doll' && i.id === d); if (it) return [r, it]; } return [null, null]; }

/* 某個房間裡的空位：家具的空座位，或沒被擋住的地板 */
function freeSeats(list, me){
  const out = [];
  list.filter(f => f.kind === 'furn' && FURN[f.id].seats).forEach(f => FURN[f.id].seats.forEach((_, k) => {
    if (!list.some(o => o !== me && o.kind === 'doll' && o.sit === f.uid && o.seat === k) && !(me.sit === f.uid && me.seat === k)) out.push([f.uid, k]);
  }));
  return out;
}
// 地上一點：不要被站著的家具擋住，也不要疊在娃娃身上
function floorSpot(list, me, gap = 10){
  const blocks = list.filter(f => f.kind === 'furn' && !FURN[f.id].floor && !FURN[f.id].wall).map(f => { const [w, h] = sizeOf(f); return [f.x - w / 2, f.x + w / 2, f.y - h, f.y + 4]; });
  for (let n = 0; n < 40; n++){
    const x = 12 + Math.random() * 76, y = 72 + Math.random() * 22;
    if (blocks.some(([x0, x1, y0, y1]) => x > x0 - 3 && x < x1 + 3 && y > y0 && y < y1)) continue;
    if (list.some(o => o !== me && o.kind === 'doll' && Math.hypot(o.x - x, o.y - y) < gap)) continue;
    if (S.away.drops.some(o => Math.hypot(o.x - x, o.y - y) < 8)) continue;
    if (me && Math.hypot(me.x - x, me.y - y) < 14) continue;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  }
  return null;
}
function moveDoll(d){
  let [r, it] = dollAt(d);
  if (!it) return false;
  // 會跑的那幾隻，三次有一次跑到別的房間
  if (ROAM.includes(d) && Math.random() < .35){
    const to = pick(RIDS.filter(x => x !== r));
    const from = home[r].items;
    from.splice(from.indexOf(it), 1);
    home[to].items.push(it);
    r = to;
  }
  const list = home[r].items;
  const seats = freeSeats(list, it);
  if (seats.length && Math.random() < .6){
    const [f, k] = pick(seats);
    it.sit = f; it.seat = k;
    return true;
  }
  const p = floorSpot(list, it);
  if (!p) return false;
  it.sit = null; [it.x, it.y] = p;
  return true;
}
function dropThing(d){
  const a = S.away;
  if (a.drops.length >= 3) return false;
  const [r0] = dollAt(d);
  const r = r0 || pick(RIDS);
  const p = floorSpot(home[r].items, null, 7);
  if (!p) return false;
  a.drops.push({r, k: DROP_BY[d], x: p[0], y: p[1]});
  return true;
}

/* 隔了很久才回來：最多變三件，寫一張便條 */
function awayRun(){
  const a = awayData();
  const n = 1 + Math.floor(Math.random() * AWAY_MAX);
  const lines = [], used = new Set();
  for (let i = 0; i < n * 3 && lines.length < n; i++){
    const pool = DOLLS.filter(d => DOLL_N[d] && !used.has(d));
    if (!pool.length) break;
    const d = pickW(pool);
    used.add(d);
    const L = AWAY_LINES[d];
    const placed = !!dollAt(d)[1];
    if (DROP_BY[d] && (!placed || Math.random() < .45) && dropThing(d)){ lines.push(L.drop); continue; }
    if (placed && moveDoll(d)) lines.push(pick(L.mv));
  }
  // 薯餅、蛋黃哥沒動的時候，有時候便條寫牠們
  if (lines.length < 2){
    const still = ['sloth', 'egg'].filter(d => !used.has(d) && dollAt(d)[1]);
    if (still.length) lines.push(pick(AWAY_LINES[pick(still)].still));
  }
  if (!lines.length) return;
  a.note = lines.slice(0, 2);
  quiet = true; render(); quiet = false;
  save();
}

/* 地上的小東西：點一下收起來，一天前三個各給 1 幣 */
function renderDrops(){
  if (!S.away) return;
  room.querySelectorAll('.drop').forEach(e => e.remove());
  S.away.drops.forEach((o, i) => {
    if (o.r !== roomId) return;
    const b = document.createElement('button');
    b.className = 'drop'; b.dataset.i = i;
    b.setAttribute('aria-label', `撿起${DROP_NAME[o.k]}`);
    b.style.left = o.x + '%'; b.style.top = roomY(o.y) + '%'; b.style.zIndex = 20 + Math.round(o.y * 3);
    b.innerHTML = DROP_SVG[o.k];
    room.appendChild(b);
  });
}
room.addEventListener('click', e => {
  const b = e.target.closest('.drop'); if (!b) return;
  const a = awayData();
  const o = a.drops[+b.dataset.i]; if (!o) return;
  a.drops.splice(+b.dataset.i, 1);
  if (a.picked < PICK_MAX){ a.picked++; S.coins += 1; renderHud(); toast(`收好${DROP_NAME[o.k]}，+1 枚幣`); }
  else toast(`收好${DROP_NAME[o.k]}`);
  renderDrops(); save();
});

/* 睡覺：每隻從 SLEEP_FROM 的時間睡到早上 7 點。點一下跳一張夢卡，不叫醒、不扣東西
   S.album.night = {date:'那一晚的日期', d:{娃娃:第幾個夢}}：同一晚再點，看到的是同一個夢
   S.album.dreams = {娃娃:位元}：看過的夢，相簿那隻的頁面會列出來 */
const asleep = d => { const h = new Date().getHours(), f = SLEEP_FROM[d]; return f !== undefined && (h >= f || h < WAKE_AT); };
// 那一晚算哪一天：過了半夜、早上 7 點前，還算前一天晚上
function nightKey(){ const t = new Date(); if (t.getHours() < WAKE_AT) t.setDate(t.getDate() - 1); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
function paintSleep(){
  room.querySelectorAll('.doll').forEach(el => {
    const it = items.find(i => String(i.uid) === el.dataset.u);
    const gd = !it && el.classList.contains('st-guest') ? el.dataset.pd : '';   // 來過夜的客人（js/stay.js）晚上也睡
    el.classList.toggle('sleep', it ? asleep(it.id) : !!gd && asleep(gd));
  });
}
function dreamOf(d){
  const a = S.album, key = nightKey();
  if (!a.night || a.night.date !== key) a.night = {date: key, d: {}};
  let i = a.night.d[d];
  if (i === undefined){
    const n = DREAMS[d].length, bits = (a.dreams = a.dreams || {})[d] || 0;
    const fresh = [...Array(n).keys()].filter(k => !(bits & (1 << k)));
    i = a.night.d[d] = pick(fresh.length ? fresh : [...Array(n).keys()]);
  }
  a.dreams = a.dreams || {};
  a.dreams[d] = (a.dreams[d] || 0) | (1 << i);
  save();
  return DREAMS[d][i];
}
const MOON = '<svg viewBox="0 0 24 24"><path d="M15.5 3.2A8.6 8.6 0 1 0 20.8 15 7 7 0 0 1 15.5 3.2z" fill="#ffe07a" stroke="#d9a400" stroke-width="1.6" stroke-linejoin="round"/><circle cx="17.5" cy="6" r="1" fill="#fff"/><circle cx="20.5" cy="9.5" r=".8" fill="#fff"/></svg>';
function dreamCard(d, text){
  const o = document.createElement('div'); o.className = 'over';
  o.innerHTML = `<div class="pcard gcard dcard" role="dialog" aria-label="${DOLL_NAME[d]}的夢">
      <h3>${DOLL_NAME[d]}的夢</h3>
      <div class="pic"><img alt="" src="${SPR[d]}"><span class="gi">${MOON}</span></div>
      <p>${text}</p>
      <button class="btn y ok" aria-label="好，讓牠繼續睡">${CKS}</button></div>`;
  screen.appendChild(o);
  const ok = o.querySelector('.ok'); ok.focus({preventScroll:true});
  ok.onclick = () => o.remove();
}
// main.js 點娃娃時先問這裡：睡著的就看夢，回傳 true
function awayWake(it){
  if (!DREAMS[it.id] || !asleep(it.id)) return false;
  dreamCard(it.id, dreamOf(it.id));
  return true;
}
function afterRoomRender(){ renderDrops(); paintSleep(); }
setInterval(paintSleep, 60000);

/* 便條：進房間時跳出來，點一下收掉 */
function showNote(){
  const a = S.away;
  const cover = $('#cover');
  if (!a || !a.note || page !== 'room' || (cover && !cover.hidden)) return;
  if ($('.anote')) return;
  const n = document.createElement('button');
  n.className = 'anote';
  n.setAttribute('aria-label', '你不在的時候，點一下收起來');
  n.innerHTML = `<b>你不在的時候</b>${a.note.map(l => `<span>${l}</span>`).join('')}`;
  n.addEventListener('click', () => {
    a.note = null; save();
    n.classList.add('out');
    setTimeout(() => n.remove(), REDUCE ? 0 : 260);
  });
  $('#area').appendChild(n);
}
// 封面按進房間、從娃娃機回房間時看看有沒有便條
$('#coverGo')?.addEventListener('click', () => setTimeout(showNote, 520));
$('#swap').addEventListener('click', () => setTimeout(showNote, 50));

/* 開著的分頁放著很久，回來也算 */
let hidAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ hidAt = Date.now(); return; }
  if (hidAt && Date.now() - hidAt > AWAY_GAP){ awayRun(); showNote(); }
  hidAt = 0;
  paintSleep();
});

/* 開始：用上一次存檔的時間算隔了多久 */
awayData();
if (LAST_T && Date.now() - LAST_T > AWAY_GAP) awayRun();
afterRoomRender();
showNote();
