/* 廚房：娃娃會煮東西，煮好的放冰箱（2026-11-27）。不複雜：沒有食材、不給幣、不催人。
   - 點爐台：選一隻在這一間、醒著的娃娃和一道菜。牠走到爐台前煮一下（冒煙、講兩三句），煮好一份放進冰箱。
     一天煮 3 次，冰箱最多放 8 份。演的時候借用小劇場的演出（js/skit.js 的 skitPlay，重看模式：不記相簿、不給幣）。
   - 點冰箱：看裡面有什麼、是誰煮的。拿一份給這一間的娃娃吃（牠跳一下講一句，跟煮的那隻交情加一點），也可以自己吃。
   - 爐台、冰箱是廚房的家具（js/furn3.js），擺在哪一間都能用；去朋友家時點了沒反應。
   存檔：放在相簿裡的一格 S.album.kitchen = {d:'今天', n:今天煮了幾次, f:['菜.誰煮的', …]}（跟小劇場的 S.album.skit 一樣，不用改雲端規則）。
   f 存成字串，不存成兩層的清單：雲端的資料庫不收清單裡面再放清單。
   每一道菜的圖都是自己用 SVG 畫的。樣式寫在這個檔裡（kcCss），class 都是 kc- 開頭。 */
const KC_MAX = 8, KC_DAY = 3;
const kcSvg = s => `<svg viewBox="0 0 40 40">${s}</svg>`;
const KC_DISH = {
  bun: {n: '饅頭', s: '貓咪老師最喜歡', svg: kcSvg('<path d="M6 28c0-10.400 6.400-17.400 14-17.400S34 17.600 34 28c0 2-1.600 3.400-3.600 3.400H9.600C7.600 31.400 6 30 6 28z" fill="#fff8ee" stroke="#d9b48a" stroke-width="2.200" stroke-linejoin="round"/><path d="M16 14.600c1.400 2 2.600 2.800 4 2.800s2.600-.8 4-2.800" fill="none" stroke="#d9b48a" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="11.400" r="1.800" fill="#ff9cc8"/>')},
  pancake: {n: '鬆餅', s: '一片一片疊起來', svg: kcSvg('<ellipse cx="20" cy="31" rx="16" ry="4.600" fill="#fff" stroke="#e3cfd8" stroke-width="2"/><ellipse cx="20" cy="27" rx="13" ry="4.400" fill="#f2b880" stroke="#b9773f" stroke-width="2"/><ellipse cx="20" cy="22" rx="13" ry="4.400" fill="#f2b880" stroke="#b9773f" stroke-width="2"/><ellipse cx="20" cy="17" rx="13" ry="4.400" fill="#f6c99a" stroke="#b9773f" stroke-width="2"/><path d="M11 17c4 3.400 14 3.400 18 0" fill="none" stroke="#a8622a" stroke-width="2.400" stroke-linecap="round"/><rect x="16.500" y="12.400" width="7" height="5" rx="1.500" fill="#ffe58f" stroke="#d99a00" stroke-width="1.400"/>')},
  pudding: {n: '布丁', s: '會抖一抖', svg: kcSvg('<path d="M8 26c0-9 5-15 12-15s12 6 12 15z" fill="#ffd66b" stroke="#d99a1c" stroke-width="2.400" stroke-linejoin="round"/><path d="M10 15c3-5 17-5 20 0-1 3-4 4-6 3-2 2-6 2-8 0-2 1-5 0-6-3z" fill="#8a5a3a" stroke="#6b3f22" stroke-width="2" stroke-linejoin="round"/><rect x="5" y="26" width="30" height="5" rx="2.500" fill="#fff" stroke="#e3cfd8" stroke-width="2"/>')},
  omelet: {n: '蛋包飯', s: '上面淋紅紅的醬', svg: kcSvg('<ellipse cx="20" cy="26" rx="17" ry="7" fill="#fff" stroke="#e3cfd8" stroke-width="2"/><path d="M7 24c0-7 6-11 13-11s13 4 13 11c-3 3-23 3-26 0z" fill="#ffe27a" stroke="#d99a1c" stroke-width="2.200" stroke-linejoin="round"/><path d="M13 18.600l3 2.400 3-2.400 3 2.400 3-2.400 3 2.400" fill="none" stroke="#ff6f8a" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/>')},
  potato: {n: '烤地瓜', s: '熱熱的，要剝皮', svg: kcSvg('<path d="M7 26c-3-6 3-14 13-16 9-2 16 2 14 9-2 8-12 12-20 12-4 0-6-2-7-5z" fill="#b56a8a" stroke="#7a3f5a" stroke-width="2.200" stroke-linejoin="round"/><ellipse cx="22" cy="20" rx="8" ry="5.600" fill="#ffd66b" stroke="#d99a1c" stroke-width="1.800" transform="rotate(-18 22 20)"/><path d="M14 8c0-2 1-3 2-4M20 7c0-2 1-3 2-4" fill="none" stroke="#cfc3ca" stroke-width="1.800" stroke-linecap="round"/>')},
  soup: {n: '玉米湯', s: '喝了暖暖的', svg: kcSvg('<path d="M5 19h30c0 8-6 14-15 14S5 27 5 19z" fill="#8fd3ef" stroke="#4a9fd0" stroke-width="2.200" stroke-linejoin="round"/><ellipse cx="20" cy="19" rx="15" ry="4" fill="#ffe58f" stroke="#4a9fd0" stroke-width="2"/><circle cx="15" cy="19" r="1.400" fill="#e8b52a"/><circle cx="21" cy="18" r="1.400" fill="#e8b52a"/><circle cx="25" cy="20" r="1.400" fill="#e8b52a"/><path d="M15 12c-1.600-2 1.600-3 0-5M22 12c-1.600-2 1.600-3 0-5" fill="none" stroke="#cfc3ca" stroke-width="1.800" stroke-linecap="round"/>')},
};
// 煮的時候講的三句：開始、煮到一半、好了。對話框只有一行，每句 14 個字以內
const KC_COOK = {
  sloth: ['我來煮。慢慢煮。', '……要翻面了嗎。', '好了。應該好了。'],
  egg: ['煮東西好累喔。', '鍋子，你自己顧。', '好了。我要躺了。'],
  dog: ['汪！我會煮！', '好香！汪汪！', '煮好了！先聞一下！'],
  moodeng: ['我來煮！！', '鍋子在跳！！', '好了！！我煮的！！'],
  nyanko: ['本大爺親自下廚。', '火候剛好。哼。', '好了。先試吃一口。'],
  dino: ['嘿嘿，我有秘方。', '秘方是……不告訴你。', '好了！很好吃喔！'],
  snoopy: ['主廚上工了。', '這道菜有故事。', '完成。請鼓掌。'],
  piggy: ['照食譜來，不會錯。', '火太大了，我早說。', '好了。成本很低。'],
};
// 吃的時候講的。貓咪老師吃到饅頭另外一句
const KC_EAT = {sloth: '好吃。我慢慢吃。', egg: '好吃。躺著吃可以嗎。', dog: '汪！好吃！還有嗎！', moodeng: '好吃！！再一個！！',
  nyanko: '哼，還可以。再來。', dino: '嘿嘿，一口就吃掉了。', snoopy: '美味。寫進小說裡。', piggy: '不錯，給你八分。'};
const KC_EAT_FAV = {nyanko: {bun: '饅頭！這個好。'}};
const KC_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 11h16v2a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7z"/><rect x="2" y="9" width="20" height="2.400" rx="1.200"/><path d="M9 7c-1-1.400 1-2 0-3.600M15 7c-1-1.400 1-2 0-3.600" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round"/></svg>';

function kcData(){
  const a = S.album, t = todayStr();
  const k = a.kitchen = a.kitchen && typeof a.kitchen === 'object' && !Array.isArray(a.kitchen) ? a.kitchen : {};
  if (k.d !== t){ k.d = t; k.n = 0; }
  k.f = (Array.isArray(k.f) ? k.f : []).filter(x => typeof x === 'string' && KC_DISH[x.split('.')[0]]);
  return k;
}
const kcFood = s => { const [dish, by] = s.split('.'); return {dish, by: DOLL_NAME[by] ? by : ''}; };
// 這一間、醒著、是自己家的娃娃（客人、去隔壁串門子的不算）
const kcDolls = () => roamDolls().filter(i => items.includes(i) && !i.guest && DOLL_N[i.id] && !(typeof asleep === 'function' && asleep(i.id)));
const kcSleepy = () => items.some(i => i.kind === 'doll' && !i.guest && typeof asleep === 'function' && asleep(i.id));
let kcWho = '', kcPick = -1;

function kcCss(){
  if (document.getElementById('kc-css')) return;
  const s = document.createElement('style'); s.id = 'kc-css';
  s.textContent = `
.kc-lab{margin:8px 2px 4px;font-size:12px;font-weight:800;color:var(--p-ink,var(--soft,#9a8a94));opacity:.8}
.kc-who{display:flex;flex-wrap:wrap;gap:6px;padding:2px 0 4px}
.kc-d,.kc-f{border:0;border-radius:12px;padding:5px 4px 4px;background:var(--p-card,#fff);color:var(--p-ink,var(--ink,#5a4650));box-shadow:0 2px 0 var(--p-edge,#ead9e2);display:grid;justify-items:center;gap:2px;cursor:pointer;font:inherit;-webkit-tap-highlight-color:transparent}
.kc-d{width:62px}
.kc-d img{width:40px;height:40px;object-fit:contain}
.kc-d b,.kc-f b{font-size:12px;font-weight:800;white-space:nowrap}
.kc-f small{font-size:10.5px;opacity:.7;white-space:nowrap}
.kc-d.on,.kc-f.on{box-shadow:0 0 0 3px var(--p-sun,#ffd66b),0 2px 0 var(--p-edge,#ead9e2)}
.kc-d:focus-visible,.kc-f:focus-visible{outline:3px solid var(--p-sun,#ffd66b);outline-offset:1px}
.kc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.kc-f svg{width:38px;height:38px;display:block}
.kc-none{margin:6px 2px;font-size:13px;line-height:1.6;color:var(--p-ink,var(--ink,#5a4650))}
.kc-steam{position:absolute;z-index:400;width:8%;aspect-ratio:1/2;transform:translate(-50%,-100%);pointer-events:none}
.kc-steam i{position:absolute;bottom:0;left:50%;width:62%;aspect-ratio:1;border-radius:50%;background:#fff;box-shadow:0 1px 0 rgba(90,70,80,.22),0 0 0 1px rgba(90,70,80,.08);opacity:0;animation:kcSteam 1.8s ease-out infinite}
.kc-steam i:nth-child(2){left:28%;animation-delay:.6s}
.kc-steam i:nth-child(3){left:70%;animation-delay:1.2s}
@keyframes kcSteam{0%{transform:translate(-50%,0) scale(.5);opacity:0}25%{opacity:.85}100%{transform:translate(-50%,-170%) scale(1.25);opacity:0}}
@media (prefers-reduced-motion:reduce){.kc-steam i{animation:none;opacity:.7}}`;
  document.head.appendChild(s);
}

/* ---------- 爐台 ---------- */
function kcStove(){
  if (VISIT) return;
  kcCss();
  const k = kcData(), who = kcDolls();
  if (!who.some(i => i.id === kcWho)) kcWho = who.length ? who[0].id : '';
  const left = KC_DAY - k.n, full = k.f.length >= KC_MAX;
  let body;
  if (left <= 0) body = `<p class="kc-none">今天煮了 ${KC_DAY} 次，鍋子要休息了，明天再來煮。</p>`;
  else if (full) body = `<p class="kc-none">冰箱滿了（${KC_MAX} 份）。先點冰箱，拿一些出來吃吧。</p>`;
  else if (!who.length) body = `<p class="kc-none">${kcSleepy() ? '這一間的娃娃都睡著了，明天再請牠們煮。' : '這一間沒有娃娃。把娃娃帶到爐台這一間，再點一次爐台。'}</p>`;
  else body = `<p class="kc-lab">誰來煮</p><div class="kc-who">${who.map(i => `<button class="kc-d ${i.id === kcWho ? 'on' : ''}" data-kcd="${i.id}" aria-pressed="${i.id === kcWho}"><img src="${SPR[i.id]}" alt=""><b>${DOLL_NAME[i.id]}</b></button>`).join('')}</div>
    <p class="kc-lab">煮什麼</p>${Object.entries(KC_DISH).map(([id, d]) => `<div class="er-it"><span class="ic">${d.svg}</span><span class="tx2"><b>${d.n}</b><small>${d.s}</small></span><button class="btn y sm" data-kcook="${id}" aria-label="煮${d.n}">煮</button></div>`).join('')}`;
  openSheet(`<div class="hd">${KC_ICON}<span>爐台</span></div>
    <div class="er-box"><p class="er-hi">${left > 0 ? `今天還可以煮 ${left} 次。` : ''}煮好的會放進冰箱（現在 ${k.f.length}／${KC_MAX} 份）。</p>${body}</div>`);
  evOpen = false; alOpen = false;
}
function kcCook(dish){
  const k = kcData(), d = KC_DISH[dish], it = items.find(i => i.kind === 'doll' && i.id === kcWho);
  if (!d || !it || k.n >= KC_DAY || k.f.length >= KC_MAX || !kcDolls().includes(it)){ kcStove(); return; }
  // 先放進冰箱再演：演到一半換房間、按跳過，煮好的都不會不見
  k.n++; k.f.push(dish + '.' + it.id); save();
  $('#sheet').hidden = true;
  const who = it.id, [a, b, c] = KC_COOK[who] || KC_COOK.sloth, stove = items.find(i => i.kind === 'furn' && i.id === 'stove');
  const steps = [...(stove ? [`m ${who} stove`] : []), `s ${who} ${a}`, 'n （鍋子冒煙了）', `a ${who} look`, `s ${who} ${b}`, 'w', `s ${who} ${c}`, `n （${d.n}放進冰箱了）`];
  const steam = stove ? kcSteam(stove) : null;
  const done = () => { if (steam) steam.remove(); };
  if (typeof skitPlay === 'function' && !(typeof skitOn !== 'undefined' && skitOn)){
    Promise.resolve(skitPlay({id: 'kc-cook', title: `${DOLL_NAME[who]}在煮${d.n}`, cast: [who], need: {}, steps, end: ''}, true)).catch(e => console.info('[kitchen]', e)).finally(done);
  } else { roamSay(it, c); toast(`${DOLL_NAME[who]}煮好了${d.n}，放進冰箱了`); setTimeout(done, 2500); }
}
// 爐台上冒煙：放在鍋子上面，演完拿掉（換房間時房間的東西會清掉，也一起不見）
function kcSteam(stove){
  const [w, h] = sizeOf(stove), el = document.createElement('div');
  el.className = 'kc-steam'; el.innerHTML = '<i></i><i></i><i></i>';
  el.style.left = (stove.x + (54 / 86 - .5) * w) + '%'; el.style.top = (roomY(stove.y) - h * (1 - 12 / 78)) + '%';
  room.appendChild(el);
  setTimeout(() => el.remove(), 20000);   // 保險：最多冒 20 秒
  return el;
}

/* ---------- 冰箱 ---------- */
function kcFridge(){
  if (VISIT) return;
  kcCss();
  const k = kcData(), who = kcDolls();
  if (kcPick >= k.f.length) kcPick = -1;
  let body;
  if (!k.f.length) body = '<p class="kc-none">冰箱是空的。點爐台，請娃娃煮一點東西放進來。</p>';
  else {
    body = `<p class="kc-lab">點一份拿出來</p><div class="kc-grid">${k.f.map((s, i) => { const f = kcFood(s), d = KC_DISH[f.dish];
      return `<button class="kc-f ${i === kcPick ? 'on' : ''}" data-kfood="${i}" aria-pressed="${i === kcPick}" aria-label="${d.n}${f.by ? '，' + DOLL_NAME[f.by] + '煮的' : ''}">${d.svg}<b>${d.n}</b><small>${f.by ? DOLL_NAME[f.by] + '煮的' : ''}</small></button>`; }).join('')}</div>`;
    if (kcPick >= 0){
      const d = KC_DISH[kcFood(k.f[kcPick]).dish];
      body += `<p class="kc-lab">${d.n}給誰吃</p><div class="kc-who">${who.map(i => `<button class="kc-d" data-keat="${i.id}"><img src="${SPR[i.id]}" alt=""><b>${DOLL_NAME[i.id]}</b></button>`).join('')}<button class="btn sm" data-keat="me">我自己吃</button></div>
        ${who.length ? '' : `<p class="kc-none">${kcSleepy() ? '這一間的娃娃都睡著了。' : '這一間沒有娃娃。'}可以自己吃，或帶一隻娃娃到冰箱這一間。</p>`}`;
    }
  }
  openSheet(`<div class="hd">${KC_ICON}<span>冰箱</span></div>
    <div class="er-box"><p class="er-hi">裡面有 ${k.f.length}／${KC_MAX} 份。不會壞，放著也沒關係。</p>${body}</div>`);
  evOpen = false; alOpen = false;
}
function kcEat(who){
  const k = kcData(), i = kcPick;
  if (i < 0 || i >= k.f.length){ kcFridge(); return; }
  const f = kcFood(k.f[i]), d = KC_DISH[f.dish];
  if (who === 'me'){
    k.f.splice(i, 1); kcPick = -1; save(); $('#sheet').hidden = true;
    toast(f.by ? `你吃了${DOLL_NAME[f.by]}煮的${d.n}` : `你吃了${d.n}`);
    return;
  }
  const it = kcDolls().find(x => x.id === who);
  if (!it){ kcFridge(); return; }
  k.f.splice(i, 1); kcPick = -1;
  if (f.by && f.by !== who && typeof palBump === 'function') palBump(f.by, who, 2);   // 吃別隻煮的：兩隻交情多一點
  save(); $('#sheet').hidden = true;
  if (!REDUCE) roamIdle(it, 'jump');
  roamSay(it, (KC_EAT_FAV[who] && KC_EAT_FAV[who][f.dish]) || KC_EAT[who] || '好吃。');
  toast(f.by && f.by !== who ? `${DOLL_NAME[who]}吃了${DOLL_NAME[f.by]}煮的${d.n}` : `${DOLL_NAME[who]}吃了${d.n}`);
}

$('#sheet').addEventListener('click', e => {
  const t = e.target.closest('[data-kcd],[data-kcook],[data-kfood],[data-keat]'); if (!t) return;
  if (t.dataset.kcd){ kcWho = t.dataset.kcd; kcStove(); }
  else if (t.dataset.kcook) kcCook(t.dataset.kcook);
  else if (t.dataset.kfood !== undefined){ const i = +t.dataset.kfood; kcPick = kcPick === i ? -1 : i; kcFridge(); }
  else if (t.dataset.keat) kcEat(t.dataset.keat);
});
// 點爐台、冰箱（接在原本的 onFurnTap 後面，跟電視一樣）
{
  const prev = typeof onFurnTap === 'function' ? onFurnTap : null;
  onFurnTap = function(it){
    if (!VISIT && it.id === 'stove'){ kcStove(); return true; }
    if (!VISIT && it.id === 'fridge'){ kcPick = -1; kcFridge(); return true; }
    return prev ? prev(it) : false;
  };
}
