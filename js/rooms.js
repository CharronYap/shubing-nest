/* 新房間（2026-11-26）：廚房和閣樓。不是一開始就有，在火腿的小店買「廚房的鑰匙」「閣樓的梯子」各 40 枚。
   - 廚房：貓咪老師的地盤，多幾件跟吃有關的小事。
   - 閣樓：斜屋頂、一扇圓天窗，晚上偶爾有流星。史努比喜歡在這裡寫小說，薯餅喜歡在這裡睡。
   - 買了之後 RIDS（js/room.js）多一間，存檔的 home 多一格；上面的房間鈕超過四顆時可以左右滑。
   - 新房間跟著存檔和公開房間一起上雲端（規則 2026-11-26 發布）。js/cloud.js 留著保險：被擋時先拿掉這兩間再寫。
   - 去朋友家時只看得到自己也有的房間（朋友有廚房、你沒有，就看不到他的廚房）。 */
const ROOM_KEY = {kitchen: {name: '廚房', key: '廚房的鑰匙', price: 40, wall: 'tile', floor: 'check'}, attic: {name: '閣樓', key: '閣樓的梯子', price: 40, wall: 'stripe', floor: 'wood'}};
const ROOM_LABEL = {living: '客廳', bed: '臥室', bath: '浴室', kitchen: '廚房', attic: '閣樓', yard: '咕嚕嚕秘密花園'};
ICON.kitchen = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.500a4 4 0 0 1 3-6.300 4.500 4.500 0 0 1 8 0 4 4 0 0 1 3 6.300V13H5z"/><rect x="5" y="14.500" width="14" height="6" rx="2"/></svg>';
ICON.attic = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.500 13L12 4l9.500 9v7a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1z"/><circle cx="12" cy="13.500" r="3.200" fill="#fff"/></svg>';
ROOM_FURN.kitchen = ROOM_FURN.kitchen || []; ROOM_FURN.attic = ROOM_FURN.attic || [];
Object.keys(ROOM_KEY).forEach(r => { if (home[r] && Array.isArray(home[r].items) && !RIDS.includes(r)) RIDS.push(r); });

/* 小店（js/shop.js）：還沒買的房間排在最前面 */
const shopKeys = () => Object.keys(ROOM_KEY).filter(r => !home[r]);
const shopKeyOwned = r => !!home[r];
const shopKeyName = r => ROOM_KEY[r].key;
const shopKeyPic = r => (r === 'kitchen'
  ? '<svg viewBox="0 0 60 60"><circle cx="20" cy="22" r="12" fill="#ffd75e" stroke="#d99a00" stroke-width="2.4"/><circle cx="20" cy="22" r="4.500" fill="#fff8e0" stroke="#d99a00" stroke-width="2"/><path d="M29 30l20 20M41 42l5-5M46 47l4-4" fill="none" stroke="#d99a00" stroke-width="4" stroke-linecap="round"/></svg>'
  : '<svg viewBox="0 0 60 60"><path d="M18 6v50M42 6v50" fill="none" stroke="#b9773f" stroke-width="5" stroke-linecap="round"/><path d="M18 15h24M18 27h24M18 39h24M18 51h24" fill="none" stroke="#e2a868" stroke-width="4.400" stroke-linecap="round"/></svg>');
function shopKeyBuy(r){
  const k = ROOM_KEY[r]; if (!k || home[r]) return;
  home[r] = {wall: k.wall, floor: k.floor, items: []};
  if (!RIDS.includes(r)){ const i = RIDS.indexOf('yard'); if (i >= 0) RIDS.splice(i, 0, r); else RIDS.push(r); }   // 花園排最後
  $('#sheet').hidden = true;
  renderNav();
  setTimeout(() => { toast(`${k.name}打開了，上面的箭頭和小屋地圖都可以過去`); goRoom(r); }, 300);
}

/* 還沒開的房間：直接問要不要打開（2026-11-27 使用者從地圖點閣樓被帶到小店，看到「閣樓的梯子」不知道是在買什麼）。
   小屋地圖、小窩指南都走這裡；小店裡那兩樣照舊可以買，下面多一行字說是開哪一間。back：按「先不要」回到哪裡（沒有就關掉） */
let roomAskBack = null;
function roomAsk(r, back){
  const k = ROOM_KEY[r]; if (!k || home[r] || VISIT) return;
  roomAskBack = typeof back === 'function' ? back : null;
  const lack = k.price - S.coins;
  openSheet(`<div class="hd">${ICON[r]}<span>${k.name}</span><small class="pc-left">${COIN}${S.coins}</small></div>
    <div class="rk-box"><span class="tile rk-pic">${shopKeyPic(r)}</span>
      <p class="rk-q">${k.name}還沒開。${lack > 0 ? `打開要 ${k.price} 枚幣。` : `用 ${k.price} 枚幣打開嗎？`}</p>
      ${lack > 0 ? `<p class="rk-lack">還差 ${lack} 枚</p>` : ''}
      <div class="rk-row">${lack > 0 ? '<button class="btn y" data-rk="earn">去賺幣</button>' : `<button class="btn y" data-rk="${r}">打開（${k.price}）</button>`}<button class="btn" data-rk="no">先不要</button></div></div>`);
  evOpen = false; alOpen = false;
}
// 付幣、打開、走進去。跟在小店買那一樣是同一件事（js/shop.js 的 shopBuy）
function roomKeyPay(r){
  const k = ROOM_KEY[r]; if (!k || home[r] || VISIT) return;
  if (S.coins < k.price){ roomAsk(r, roomAskBack); return; }
  S.coins -= k.price;
  shopKeyBuy(r);
  if (typeof shopStock === 'function') shopStock().bought.push('k:' + r);
  renderHud(); save();
}
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('[data-rk]'); if (!b) return;
  const v = b.dataset.rk, back = roomAskBack; roomAskBack = null;
  if (v === 'no'){ $('#sheet').hidden = true; if (back) back(); }
  else if (v === 'earn'){ if (typeof earnOpen === 'function') earnOpen(); else $('#sheet').hidden = true; }
  else { roomAskBack = back; roomKeyPay(v); }
});

/* 新房間的小事：when 是房間名，只有買了那一間才會排進來，一天最多多一件（main.js 的 planDay） */
EVENTS.push(
  {id:'kit-nyanko', d:['nyanko'], when:'kitchen', t:'貓咪老師坐在廚房正中間，說這裡以後歸牠管。', end:'摸了牠的頭。貓咪老師說可以，但冰箱不能亂開。'},
  {id:'kit-egg', d:['egg'], when:'kitchen', t:'蛋黃哥躺在盤子上，說牠今天是早餐。', end:'把牠連盤子端回房間，牠說這樣也不錯。'},
  {id:'kit-dino', d:['dino'], when:'kitchen', need:'snack', t:'龍龍踮腳想拿櫃子上的點心，快要搆到了。', end:'拿了一盒給牠。龍龍說牠本來就拿得到。'},
  {id:'kit-piggy', d:['piggy'], when:'kitchen', t:'火腿在廚房清點食材，說有人偷吃，牠要查。', end:'陪牠數了一遍。火腿說嫌犯有白色的毛。'},
  {id:'att-snoopy', d:['snoopy'], when:'attic', t:'史努比在閣樓的天窗下面打字，打了一行又停下來。', end:'在旁邊坐了一下，牠說下一句想到了。'},
  {id:'att-sloth', d:['sloth'], when:'attic', t:'薯餅在閣樓找到一塊照得到太陽的地方，不動了。', end:'沒有吵牠。薯餅翻了個身，繼續曬。'},
  {id:'att-dog', d:['dog'], when:'attic', t:'皮蛋對著閣樓的舊箱子一直聞。', end:'打開給牠看，裡面有一隻很舊的拖鞋。'},
  {id:'att-moodeng', d:['moodeng'], when:'attic', t:'彈跳豬發現閣樓的地板會咚咚響！！', end:'讓牠跳了十下。樓下的燈有晃一下。'},
);
function roomEvents(t){
  const pool = EVENTS.filter(e => ROOM_KEY[e.when] && home[e.when] && e.d.every(d => DOLL_N[d]));
  return pool.length ? [pool[skyHash('rm' + t) % pool.length]] : [];
}

/* 閣樓：晚上偶爾有流星（畫在牆上，不用存檔） */
setInterval(() => {
  if (typeof roomId === 'undefined' || roomId !== 'attic' || !isNight() || document.hidden || REDUCE || Math.random() > .3) return;
  const w = $('#wall'); if (!w || w.querySelector('.shoot')) return;
  const s = document.createElement('i'); s.className = 'shoot';
  s.style.left = (20 + Math.random() * 50) + '%'; s.style.top = (6 + Math.random() * 20) + '%';
  w.appendChild(s); setTimeout(() => s.remove(), 1300);
}, 7000);

/* ---------- 小屋地圖（看得出自己在哪一間 2） ----------
   上面中間的地圖鈕：打開整棟雲上小屋的剖面圖。最上面是紅瓦屋頂底下的閣樓，二樓是臥室和浴室，一樓是客廳和廚房，門外是浮在雲上的花園。
   2026-11-27 照使用者用 Gemini 畫的設計圖重畫（娃娃不照那張圖，還是原本的照片貼紙）：
   - 畫法跟房間一樣是紙雕：色紙色塊、沒有描邊、每一塊下面墊一塊往下錯開的影子。顏色用 js/paper.js 寫在 #screen 上的色票，
     跟著天色換；?look=old 沒有色票時用白天那一組（HM_K）。
   - 屋頂一排一排的紅瓦；閣樓是屋頂底下那個三角形，有圓天窗、紙箱、梯子。
   - 每一間畫上自己的家具（臥室：床、衣櫃、星星小夜燈；浴室：磁磚、蓮蓬頭、浴缸；客廳：電視、沙發、書櫃；廚房：掛勾和鍋子、流理台、冰箱），
     牆和地板還是那一間現在的壁紙地板（w-、f-，顏色和花紋在 js/paper.js 的 deco()），關燈的那一間變暗，娃娃是小頭像。
   - 還沒開的房間：畫面變暗，中間一把鑰匙和價錢，點了直接問要不要打開（roomAsk）
   - 現在在的那一格有珊瑚色的框和「你在這裡」（閣樓的框會被屋頂蓋住、又跟紅瓦同色，所以是名牌變成珊瑚色、寫「閣樓・你在這裡」）；點任何一格就過去
   - 去朋友家時畫的是朋友的家 */
const MAP_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 11.500L12 4l9 7.500V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M12 4v17M3 13.500h18" stroke="#fff" stroke-width="1.600"/></svg>';
const MAP_KEY = '<svg viewBox="0 0 24 24"><circle cx="8" cy="9" r="5" fill="#ffd75e" stroke="#d99a00" stroke-width="1.800"/><circle cx="8" cy="9" r="1.800" fill="#fff8e0"/><path d="M12 13l8 8M17 18l2-2" fill="none" stroke="#d99a00" stroke-width="2.400" stroke-linecap="round"/></svg>';
/* 畫圖的小工具：hv('a1') 是色票的顏色；hR、hC、hE、hP 回傳「給顏色、畫出形狀」的函式；hL 先畫一塊往下錯開的影子再畫本體 */
const HM_K = (() => {
  const k = {sky: '#a9c8ea', hill: '#3f6f93', hill2: '#6f9fc0', sun: '#ffd36e', cloud: '#ffffff', wall: '#dfe3f0', wall2: '#c9cfe6', floor: '#cdb5c9', wood: '#8a5a45', wood2: '#623f30',
    a1: '#ff8a66', a2: '#3f9aa5', leaf: '#4c9a78', ink: '#23264a', paper: '#fbf6ea', sea: '#3f86b8', sand: '#e9dccb', rug: '#b9bde0'};
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  return Object.assign(k, {a1d: mix(k.a1, k.ink, .2), a1l: mix(k.a1, k.paper, .22), a2l: mix(k.a2, k.paper, .25), wood3: mix(k.wood, k.paper, .22),
    leafd: mix(k.leaf, k.ink, .22), leafl: mix(k.leaf, k.paper, .22), paperd: mix(k.paper, k.ink, .14)});
})();
const hv = k => `var(--p-${k},${HM_K[k]})`;
const hn = v => Math.round(v * 10) / 10;
const hS = (tag, a) => c => `<${tag} ${a} style="fill:${hv(c)}"/>`;
const hR = (x, y, w, h, r = 0) => hS('rect', `x="${hn(x)}" y="${hn(y)}" width="${hn(w)}" height="${hn(h)}" rx="${r}"`);
const hC = (cx, cy, r) => hS('circle', `cx="${hn(cx)}" cy="${hn(cy)}" r="${hn(r)}"`);
const hE = (cx, cy, rx, ry) => hS('ellipse', `cx="${hn(cx)}" cy="${hn(cy)}" rx="${hn(rx)}" ry="${hn(ry)}"`);
const hP = d => hS('path', `d="${d}"`);
const hAll = (...fs) => c => fs.map(f => f(c)).join('');
const hL = (f, c, d = 1) => `<g opacity="${(.16 + .05 * d).toFixed(2)}" transform="translate(0 ${hn(1.2 * d)})">${f('ink')}</g>${f(c)}`;
const hLine = (d, w) => c => `<path d="${d}" style="fill:none;stroke:${hv(c)}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const hFade = (f, op) => `<g opacity="${op}">${f}</g>`;
const hStar = (cx, cy, R, r) => hP('M' + Array.from({length: 10}, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; return hn(cx + q * Math.cos(a)) + ' ' + hn(cy + q * Math.sin(a)); }).join('L') + 'z');
// 牆上割開的窗：木框、天空和遠山、洞的上緣和左緣有牆的厚度的影子、十字窗框、窗台
const hWin = (x, y, w, h) => hL(hR(x - 2.2, y - 2.2, w + 4.4, h + 4.4, 1.6), 'wood', 1)
  + hR(x, y, w, h, .6)('sky') + hC(x + w * .72, y + h * .3, Math.min(w, h) * .14)('sun')
  + hP(`M${hn(x)} ${hn(y + h)}V${hn(y + h * .72)}Q${hn(x + w * .3)} ${hn(y + h * .42)} ${hn(x + w * .58)} ${hn(y + h * .66)}T${hn(x + w)} ${hn(y + h * .58)}V${hn(y + h)}z`)('hill2')
  + hP(`M${hn(x)} ${hn(y + h)}V${hn(y + h * .86)}Q${hn(x + w * .4)} ${hn(y + h * .7)} ${hn(x + w * .7)} ${hn(y + h * .84)}T${hn(x + w)} ${hn(y + h * .8)}V${hn(y + h)}z`)('hill')
  + hFade(hR(x, y, w, h * .14)('ink') + hR(x, y, w * .07, h)('ink'), .2)
  + hR(x + w / 2 - .7, y, 1.4, h)('wood') + hR(x, y + h / 2 - .7, w, 1.4)('wood')
  + hL(hR(x - 4, y + h + 1.4, w + 8, 2.8, 1), 'wood2', .6);
// 房間格子共用：牆和地板的交界、上緣和左緣被房子的木框擋住的影子
const hRoomEdge = (W, H, y) => hR(0, y - 1.4, W, 2.8)('wood2') + hFade(hR(0, 0, W, 2.6)('ink') + hR(0, 0, 2.2, H)('ink'), .2);
const HM_ART = {
  bed: () => hRoomEdge(160, 90, 58) + hWin(60, 9, 26, 19)
    + hFade(hStar(36, 15, 2.4, 1)('sun') + hStar(116, 9, 2, .8)('sun') + hStar(146, 14, 1.8, .75)('sun'), .8)
    + hFade(hC(104, 20, 9)('sun'), .3) + hR(103.3, 25, 1.4, 8)('paperd') + hL(hR(100, 32, 8, 3, 1), 'paper', .5) + hL(hStar(104, 20, 6.4, 2.8), 'sun', .8)
    + hL(hE(88, 80, 22, 4.5), 'rug', .6)
    + hR(10, 72, 3, 6, 1)('wood2') + hR(52, 72, 3, 6, 1)('wood2')
    + hL(hR(7, 40, 9, 35, 3), 'wood', 1) + hL(hR(9, 62, 50, 11, 2), 'wood', 1)
    + hL(hR(13, 56, 44, 9, 3), 'paper', .8) + hL(hR(28, 54.5, 30, 11.5, 3), 'a1', .9) + hL(hE(21, 55, 7, 3.8), 'paper', .7)
    + hL(hR(54, 51, 6, 23, 2.5), 'wood', 1.1)
    + hR(124, 74, 3, 4, 1)('wood2') + hR(145, 74, 3, 4, 1)('wood2')
    + hL(hR(121, 28, 30, 47, 3), 'wood', 1.4) + hL(hAll(hR(124, 31, 10.5, 41, 1.5), hR(137.5, 31, 10.5, 41, 1.5)), 'wood3', .5)
    + hC(132.5, 52, 1.3)('sun') + hC(139.5, 52, 1.3)('sun') + hL(hR(119, 25, 34, 4, 1.5), 'wood2', .6),
  bath: () => hRoomEdge(160, 90, 58)
    + hFade(hR(0, 30, 160, 27)('a2'), .22)
    + hFade(Array.from({length: 16}, (_, i) => hR(5 + i * 10, 31, .8, 26)('paper')).join('') + hR(0, 39.6, 160, .8)('paper') + hR(0, 48.6, 160, .8)('paper'), .55)
    + hFade(hR(0, 29, 160, 2.2)('a2'), .7)
    + hWin(16, 6, 18, 13)
    + hR(46, 21, 18, 1.6, .8)('paperd') + hL(hR(49, 22.5, 12, 15, 1.5), 'sun', .7) + hR(49, 33, 12, 1.6)('a1')
    + hR(148, 5, 2.4, 13)('paperd') + hR(134, 15.4, 16, 2.4, 1)('paperd') + hL(hP('M128 16h10l-2 5h-6z'), 'paperd', .6)
    + hFade([[130, 24], [133.5, 28], [136.5, 24.5], [131, 32], [135.5, 34]].map(([x, y]) => hR(x, y, 1.1, 3.2, .5)('a2')).join(''), .85)
    + hL(hR(20, 70, 26, 7, 3), 'a1l', .5)
    + hR(104, 74, 3, 4, 1)('wood2') + hR(144, 74, 3, 4, 1)('wood2')
    + hR(150, 47, 2.4, 8, 1)('paperd')
    + hL(hAll(hC(108, 53, 3.2), hC(115, 51, 4), hC(122, 53, 3)), 'paper', .5)
    + hL(hP('M98 56h56v8c0 8-6 12-14 12h-28c-8 0-14-4-14-12z'), 'paper', 1.3) + hL(hR(96, 54, 60, 4, 2), 'paperd', .6),
  living: () => hRoomEdge(160, 90, 58) + hWin(54, 8, 46, 27)
    + hL(hE(84, 80, 40, 6), 'rug', .6)
    + hLine('M20 43l-4-6M28 43l4-6', 1.2)('wood2') + hC(16, 37, 1.4)('a1') + hC(32, 37, 1.4)('sun')
    + hL(hR(10, 42, 28, 20, 3), 'paper', 1) + hR(13, 45, 22, 14, 1.5)('sky') + hP('M13 59v-4q6-4 11-1t11-2v7z')('hill2')
    + hR(9, 75, 3, 3)('wood2') + hR(36, 75, 3, 3)('wood2') + hL(hR(6, 62, 36, 13, 2), 'wood', 1.1)
    + hR(23.4, 64, 1.2, 9)('wood2') + hC(20, 68.5, 1)('paper') + hC(27, 68.5, 1)('paper')
    + hR(63, 74, 3, 4)('wood2') + hR(102, 74, 3, 4)('wood2')
    + hL(hR(60, 50, 48, 18, 6), 'a1d', 1) + hL(hR(62, 62, 44, 11, 4), 'a1', 1.1)
    + hL(hAll(hR(55, 57, 10, 17, 4.5), hR(103, 57, 10, 17, 4.5)), 'a1l', 1.3) + hL(hR(68, 53, 10, 9, 2), 'a2', .6)
    + hL(hR(124, 26, 28, 50, 2.5), 'wood', 1.3) + hR(127, 30, 22, 20, 1)('wood2') + hR(127, 53, 22, 19, 1)('wood2')
    + hL(hAll(hR(129, 34, 3, 16, .5), hR(137.5, 36, 3, 14, .5)), 'a2', .4) + hL(hR(133, 33, 3.4, 17, .5), 'a1', .4) + hL(hR(141.5, 35, 3, 15, .5), 'sun', .4)
    + hL(hR(129, 59, 7, 13, .8), 'leaf', .4) + hL(hE(143, 67, 4, 5), 'paper', .4),
  kitchen: () => hRoomEdge(160, 90, 58) + hWin(96, 8, 26, 18)
    + hL(hR(14, 10, 48, 2.4, 1.2), 'wood2', .5) + hR(21.2, 12, 1.6, 4)('paperd') + hR(35.2, 12, 1.6, 4)('paperd') + hR(49.2, 12, 1.6, 4)('paperd')
    + hR(21.2, 15, 1.6, 8, .8)('wood2') + hL(hC(22, 28, 6), 'hill', .8) + hFade(hC(20, 26, 2)('paper'), .25)
    + hL(hR(30.5, 18, 11, 10, 2.5), 'a1', .7) + hR(34.5, 15.5, 3, 3, 1)('a1d')
    + hR(49.3, 15, 1.4, 12, .7)('paperd') + hL(hE(50, 27, 3.6, 2.6), 'paperd', .5)
    + hL(hAll(hR(11, 36, 7, 8, 1.5), hR(30, 35, 8, 9, 1.5)), 'paper', .5) + hL(hR(21, 38, 6, 6, 1.5), 'sun', .5) + hR(11, 35, 7, 2, .6)('a2') + hR(30, 34, 8, 2, .6)('a1')
    + hL(hR(7, 44, 38, 2.6, 1), 'wood', .8)
    + hR(13, 65, 2.4, 11)('wood2') + hR(35, 65, 2.4, 11)('wood2') + hL(hR(10, 62, 30, 3.5, 1.5), 'wood', 1) + hL(hR(22, 56.5, 6, 5.5, 1.2), 'a1', .5)
    + hL(hR(84, 58, 44, 18, 2), 'wood', 1.2) + hL(hAll(hR(87, 61, 18, 13, 1.2), hR(107, 61, 18, 13, 1.2)), 'wood3', .4)
    + hC(102, 67.5, 1)('sun') + hC(110, 67.5, 1)('sun')
    + hL(hR(82, 54, 48, 5, 1.5), 'paperd', 1)
    + hFade(hAll(hE(92, 54, 4, 1.2), hE(102, 54, 4, 1.2))('ink'), .35) + hL(hP('M88.5 53c0-6.5 10-6.5 10 0z'), 'a2', .6)
    + hR(112, 54, 12, 1.6, .6)('a2l') + hLine('M118 54v-5h4', 1.4)('paperd')
    + hR(136, 75, 3, 3)('wood2') + hR(151, 75, 3, 3)('wood2')
    + hL(hR(134, 22, 22, 54, 3), 'paper', 1.4) + hR(134, 40, 22, 1.2)('paperd') + hR(137, 29, 1.6, 7, .8)('paperd') + hR(137, 44, 1.6, 10, .8)('paperd'),
  // 閣樓：屋頂底下的三角形（250×120，頂點在中間）。圓天窗、紙箱、梯子
  attic: () => hR(0, 99, 250, 2.8)('wood2')
    + hFade(hR(96, 0, 3, 100)('wood') + hR(151, 0, 3, 100)('wood'), .18)
    + hL(hC(125, 50, 15.5), 'wood', 1) + hC(125, 50, 12.5)('sky') + hC(129.5, 45.5, 3)('sun')
    + hP('M112.5 58q6-6 12.5-2t12.5-4v.5a12.5 12.5 0 0 1-25 0z')('hill2') + hFade(hP('M112.5 50a12.5 12.5 0 0 1 25 0h-2.5a10 10 0 0 0-20 0z')('ink'), .2)
    + hR(124.3, 37.5, 1.4, 25)('wood') + hR(112.5, 49.3, 25, 1.4)('wood')
    + hL(hE(125, 109, 46, 5.5), 'rug', .6)
    + hL(hR(58, 80, 28, 20, 1.5), 'sand', 1.1) + hFade(hR(58, 86, 28, 2.2)('wood'), .5)
    + hL(hR(64, 65, 19, 15, 1.5), 'wood3', 1) + hL(hR(88, 89, 13, 11, 1.2), 'sand', .8)
    + hL(hAll(hR(150, 54, 2.6, 46, 1), hR(165, 54, 2.6, 46, 1)), 'wood', .8)
    + [62, 72, 82, 92].map(y => hL(hR(150, y, 17.6, 2.2, 1), 'wood3', .5)).join('')
    + hL(hR(176, 92, 12, 8, 1.5), 'a1', .6) + hR(179, 89, 6, 3, 1)('a1d'),
  // 門外的花園：浮在雲上，看得到底下一層一層的土；小路、池塘、果樹
  yard: () => hL(hAll(hE(52, 88, 24, 8), hC(42, 83, 9), hC(58, 79, 11), hC(72, 85, 8)), 'cloud', 1)
    + hL(hAll(hE(262, 28, 16, 5), hC(256, 25, 6), hC(266, 23, 7)), 'cloud', .8) + hL(hAll(hE(32, 24, 12, 4), hC(30, 21, 5)), 'cloud', .7)
    + hL(hP('M78 64Q150 140 222 64z'), 'wood2', 1.4)
    + hL(hP('M62 58Q62 78 100 86Q150 96 200 86Q238 78 238 58z'), 'wood', 1.2)
    + hL(hE(150, 56, 90, 22), 'leaf', 1.3) + hFade(hE(138, 50, 60, 12)('leafl'), .5)
    + hL(hP('M143 77C146 70 160 64 155 56C151 50 145 46 149 37h4.5C150 45 157 50 160 56C165 65 154 71 155 77z'), 'sand', .6)
    + hL(hE(196, 62, 20, 8), 'paperd', .8) + hE(196, 61, 17, 6.5)('a2') + hE(191, 59.4, 8, 2.4)('a2l')
    + hR(126, 30, 3, 13, 1)('wood') + hL(hC(127.5, 26, 8), 'leafd', .9)
    + hR(102, 38, 4, 17, 1.5)('wood') + hL(hAll(hC(104, 32, 12), hC(94, 38, 8), hC(114, 38, 8)), 'leaf', 1.2)
    + hC(98, 31, 2.3)('a1') + hC(110, 36, 2.3)('a1') + hC(104, 41, 2.1)('a1')
    + hR(212, 38, 3.4, 13, 1)('wood') + hL(hP('M213.7 14l11 25h-22z'), 'leafd', 1)
    + hFade([[76, 60], [170, 70], [224, 54], [120, 70]].map(([x, y]) => hP(`M${x} ${y}l2-5 1.4 5 1.6-4 1 4z`)('leafd')).join(''), .7)
    + hL(hAll(hE(250, 88, 24, 8), hC(240, 84, 9), hC(256, 80, 11), hC(268, 86, 8)), 'cloud', 1),
};
// 屋頂：外面的三角形減掉閣樓那個三角形，一排一排紅瓦（下面的先畫，上面那一排的波浪邊蓋在下面那一排上）。後面那一層是房子的牆和閣樓的地板
const HM_BAND = 'M170 2L340 166H294.4L170 46L45.6 166H0z';
function hmBack(){
  return `<svg class="hm-back" viewBox="0 0 340 178" aria-hidden="true">${hL(hAll(hR(250, 38, 16, 70, 1.5), hR(247, 34, 22, 6, 1.5)), 'wood', 1)}${hP('M13 178V153.5L170 2L327 153.5V178z')('wood')}${hR(40, 165, 260, 3)('wood2')}</svg>`;
}
function hmRoof(){
  let rows = '';
  for (let k = 13; k >= 0; k--){
    const y = 2 + k * 12.4, off = k % 2 ? 6.5 : 0;
    let d = `M0 ${hn(y)}H340V${hn(y + 12.4)}H0z`;
    for (let x = -off; x < 346; x += 13) d += `M${hn(x - 6.5)} ${hn(y + 12.4)}a6.5 6.5 0 0 0 13 0z`;
    rows += hL(hP(d), 'a1', 1.4);
  }
  return `<svg class="hm-roofs" viewBox="0 0 340 178" aria-hidden="true"><defs><clipPath id="hm-band"><path d="${HM_BAND}"/></clipPath></defs>
    <g clip-path="url(#hm-band)">${rows}</g>
    ${hL(hLine('M45.6 166L170 46L294.4 166', 4.2), 'a1d', 1.6)}${hL(hLine('M2 165L170 3L338 165', 5), 'a1d', 1)}
    ${hL(hAll(hR(0, 163, 47, 5.5, 2.2), hR(293, 163, 47, 5.5, 2.2)), 'a1d', .8)}</svg>`;
}
const hmDolls = ids => `<span class="hm-dolls">${ids.map(d => `<img src="${SPR[d]}" alt="">`).join('')}</span>`;
function mapCell(r){
  const H = VISIT ? VISIT.home : home, here = (typeof yardOn !== 'undefined' && yardOn ? 'yard' : roomId) === r;
  const nm = `<span class="hm-nm">${ICON[r] || ''}${ROOM_LABEL[r]}${here && r === 'attic' ? '・你在這裡' : ''}</span>`, tag = here && r !== 'attic' ? '<span class="hm-here">你在這裡</span>' : '';
  if (r === 'yard'){
    const has = VISIT ? !!VISIT.yard : true;
    const st = ((H.yard && H.yard.items) || []).filter(i => i.kind === 'doll' && SPR[i.id]).map(i => i.id).slice(0, 6);   // 花園現在是房間，列在上面的娃娃
    return `<button class="hm-c hm-y ${here ? 'cur' : ''} ${has ? '' : 'lock none'}" data-hm="yard" ${has ? '' : 'disabled'} aria-label="${ROOM_LABEL.yard}${here ? '，你在這裡' : ''}${st.length ? '，' + st.map(d => DOLL_NAME[d]).join('、') + '在這裡' : ''}">
      <span class="hm-pic"><svg class="hm-art" viewBox="0 0 300 110" aria-hidden="true">${HM_ART.yard()}</svg>${hmDolls(st)}${tag}</span>${nm}</button>`;
  }
  const rm = H[r], at = r === 'attic';
  const vb = at ? '0 0 250 120' : '0 0 160 90';
  const pic = (w, f, inner) => `<span class="hm-pic"><span class="hm-wall w-${w}"></span><span class="hm-floor f-${f}"></span><svg class="hm-art" viewBox="${vb}" aria-hidden="true">${HM_ART[r]()}</svg>${inner}</span>`;
  const cls = `hm-c ${at ? 'hm-at' : ''}`;
  if (!rm){
    const k = ROOM_KEY[r];
    return VISIT
      ? `<button class="${cls} lock none" disabled aria-label="${ROOM_LABEL[r]}，這裡看不到">${pic(k.wall, k.floor, '')}${nm}</button>`
      : `<button class="${cls} lock" data-hm="${r}" aria-label="${ROOM_LABEL[r]}還沒開，點一下打開，${k.price} 枚幣">${pic(k.wall, k.floor, `<span class="hm-key">${MAP_KEY}<b>點一下打開・${COIN}${k.price}</b></span>`)}${nm}</button>`;
  }
  // 現在誰在這一間：出門去隔壁的不算、來作客的算（js/roam2.js）；沒有那個檔案就照擺設
  const dolls = (typeof roamIn === 'function' ? roamIn(r, rm) : rm.items.filter(i => i.kind === 'doll' && SPR[i.id]).map(i => i.id)).slice(0, 6);
  return `<button class="${cls} ${here ? 'cur' : ''} ${rm.light === false ? 'off' : ''}" data-hm="${r}" aria-label="${ROOM_LABEL[r]}${here ? '，你在這裡' : ''}${rm.light === false ? '，關著燈' : ''}，${dolls.length ? dolls.map(d => DOLL_NAME[d]).join('、') + '在這裡' : '沒有娃娃'}">
    ${pic(rm.wall, rm.floor, hmDolls(dolls) + tag)}${nm}</button>`;
}
function mapOpen(){
  if (VISIT && VISIT.card) return;
  const who = VISIT ? `${typeof txSlot === 'function' ? txSlot(VISIT.name) : ''}的小窩` : '小屋地圖';
  openSheet(`<div class="hd">${MAP_ICON}<span>${who}</span></div>
    <div class="hm"><div class="hm-top">${hmBack()}${mapCell('attic')}${hmRoof()}</div>
      <div class="hm-house"><div class="hm-row">${mapCell('bed')}${mapCell('bath')}</div><div class="hm-row">${mapCell('living')}${mapCell('kitchen')}</div></div>
      <div class="hm-out">${mapCell('yard')}</div>
      ${!VISIT && typeof tvMapNote === 'function' ? tvMapNote() : ''}
      <p class="bk-note">點一間就過去。${VISIT ? '' : '還沒開的房間點一下就能打開。'}</p>
      ${!VISIT && typeof roamToggleHTML === 'function' ? roamToggleHTML() : ''}</div>`);
  evOpen = false; alOpen = false;
}
$('#nav').addEventListener('click', e => {
  if (!e.target.closest('.rmap')) return;
  if (!$('#sheet').hidden && $('#sheet .hm')){ $('#sheet').hidden = true; return; }
  mapOpen();
});
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('[data-hm]'); if (!b || !$('#sheet .hm')) return;
  const r = b.dataset.hm;
  if (r !== 'yard' && !(VISIT ? VISIT.home : home)[r]){ if (!VISIT) roomAsk(r, mapOpen); return; }
  $('#sheet').hidden = true;
  goRoom(r);
});

/* ---------- 每一間固定的樣子（看得出自己在哪一間 3） ----------
   房間本身的構造，不管換什麼壁紙地板都在，用來一眼認出是哪一間：
   - 客廳：窗戶比較大；牆上右邊有一扇開著的門，門外看得到花園的一角（點了去花園）
   - 臥室：窗戶比較小；牆上有一盞星星小夜燈
   - 浴室：牆的下半截是磁磚，窗戶小小的在高處
   - 廚房：窗戶下面是流理台，牆上一排掛勾
   - 閣樓：斜屋頂和圓天窗（css）
   - 左右兩邊是通往隔壁的門口，門框上有隔壁那一間的圖示，點了過去。順序跟上面的切換鈕一樣
   每一樣都是房間裡的一個 .fx 元素（裡面是 SVG），畫在家具後面。拍照、明信片、去朋友家都是用同一個房間畫面，
   拍照時 js/photo.js 會把 .fx 的 SVG 一起畫進去。全部自己畫的。 */
const fxIcon = r => (ICON[r] || '').replace(/currentColor/g, '#ff6fb0');
const FIX = {
  // 開著的門，門外是天空和花園的一角
  yardDoor: () => `<svg viewBox="0 0 60 100"><rect x="2" y="4" width="56" height="96" rx="6" fill="#c98f56"/><rect x="7" y="9" width="46" height="91" rx="3" fill="#bfe8ff"/>
    <circle cx="42" cy="24" r="6" fill="#fff3b0"/><path d="M12 40c-3 0-4-4-1-5 1-4 6-4 8-2 3-1 7 1 6 4 3 1 2 3-1 3z" fill="#fff"/>
    <path d="M7 86l22-13 24 12v15H7z" fill="#bfe6a0"/><path d="M7 86l22-13 24 12" fill="none" stroke="#9fd17f" stroke-width="2"/>
    <path d="M38 80v-12" stroke="#a8714f" stroke-width="2.600" stroke-linecap="round"/><circle cx="38" cy="64" r="6.500" fill="#8fd47a"/>
    <path d="M7 9h10v91H7z" fill="#e2b98e"/><path d="M17 9v91" stroke="#a8714f" stroke-width="1.600"/><circle cx="13" cy="56" r="1.800" fill="#a8714f"/>
    <rect x="2" y="4" width="56" height="96" rx="6" fill="none" stroke="#9a6431" stroke-width="2.400"/></svg>`,
  star: () => `<svg viewBox="0 0 40 46"><circle cx="20" cy="20" r="19" fill="#fff3b8" opacity=".55"/><path d="M20 5l4.200 8.600 9.400 1.200-6.900 6.500 1.800 9.300L20 26l-8.500 4.600 1.800-9.300-6.900-6.500 9.400-1.200z" fill="#ffe27a" stroke="#d99a00" stroke-width="1.800" stroke-linejoin="round"/>
    <circle cx="16.500" cy="17" r="1.200" fill="#8a5a22"/><circle cx="23.500" cy="17" r="1.200" fill="#8a5a22"/><path d="M17.500 21c1.600 1.400 3.400 1.400 5 0" fill="none" stroke="#8a5a22" stroke-width="1.200" stroke-linecap="round"/>
    <path d="M20 31v10" stroke="#cfc3ca" stroke-width="2.400" stroke-linecap="round"/><rect x="15" y="40" width="10" height="5" rx="2" fill="#fff" stroke="#cfc3ca" stroke-width="1.400"/></svg>`,
  // 浴室下半截的磁磚：整面橫的，寬高照元素拉開
  tiles: () => `<svg viewBox="0 0 200 60" preserveAspectRatio="none"><rect width="200" height="60" fill="#f4fbfe"/>
    <g stroke="#bfe3f2" stroke-width="1.200">${Array.from({length: 13}, (_, i) => `<path d="M${i * 16 + 4} 4V60"/>`).join('')}<path d="M0 22H200M0 41H200"/></g>
    <rect width="200" height="5" fill="#8fd3ef"/><rect y="5" width="200" height="1.600" fill="#fff"/></svg>`,
  counter: () => `<svg viewBox="0 0 130 48"><rect x="4" y="12" width="122" height="36" rx="4" fill="#fff6ea" stroke="#e0a85a" stroke-width="2.200"/>
    <path d="M46 14v32M86 14v32" stroke="#e0a85a" stroke-width="1.800"/><circle cx="40" cy="30" r="2" fill="#e0a85a"/><circle cx="52" cy="30" r="2" fill="#e0a85a"/><circle cx="92" cy="30" r="2" fill="#e0a85a"/>
    <rect x="1" y="6" width="128" height="9" rx="4" fill="#ffd9a0" stroke="#d99a00" stroke-width="2"/>
    <rect x="54" y="8" width="24" height="5" rx="2" fill="#cdeeff" stroke="#8fc6e6" stroke-width="1.400"/><path d="M66 8V2h7" fill="none" stroke="#9a8f96" stroke-width="2.400" stroke-linecap="round"/>
    <rect x="100" y="0" width="14" height="7" rx="2" fill="#ff9cc8" stroke="#e0609d" stroke-width="1.400"/><path d="M114 3h5" stroke="#e0609d" stroke-width="2" stroke-linecap="round"/></svg>`,
  hooks: () => `<svg viewBox="0 0 80 44"><rect x="2" y="3" width="76" height="5" rx="2.500" fill="#c98f56" stroke="#9a6431" stroke-width="1.400"/>
    <path d="M16 8v6M40 8v6M64 8v6" stroke="#9a8f96" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 14v12" stroke="#b9773f" stroke-width="2.600" stroke-linecap="round"/><ellipse cx="16" cy="32" rx="6" ry="7" fill="#ffd9a0" stroke="#d99a00" stroke-width="1.600"/>
    <path d="M40 14v10" stroke="#b9773f" stroke-width="2.600" stroke-linecap="round"/><rect x="34" y="24" width="12" height="15" rx="3" fill="#cdeeff" stroke="#4a9fd0" stroke-width="1.600"/><path d="M38 27v9M42 27v9" stroke="#4a9fd0" stroke-width="1.200"/>
    <path d="M58 16c0-3 12-3 12 0v14c0 8-12 8-12 0z" fill="#ff9cc8" stroke="#e0609d" stroke-width="1.600"/><path d="M58 22h12" stroke="#fff" stroke-width="1.600"/></svg>`,
  // 房間邊上的門口：side 'l' 貼左邊、'r' 貼右邊，門框上是隔壁那一間的圖示。箭頭和圖示是給人點的（class ph-no），拍照時不畫、門本身留著
  pass: (r, side) => `<svg viewBox="0 0 34 100"><g ${side === 'l' ? 'transform="translate(34 0) scale(-1 1)"' : ''}>
    <path d="M6 100V22c0-9 6-14 14-14h14v92z" fill="#7a5a48"/><path d="M11 100V24c0-6 4-10 10-10h13v86z" fill="#fde9d2"/>
    <path d="M11 100V24c0-6 4-10 10-10h13" fill="none" stroke="#c98f56" stroke-width="2.400"/><path d="M6 100V22c0-9 6-14 14-14h14" fill="none" stroke="#9a6431" stroke-width="2.400"/>
    <path class="ph-no" d="M24 50l6 6-6 6" fill="none" stroke="#ff9cc8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
    <circle class="ph-no" cx="${side === 'l' ? 14 : 20}" cy="30" r="9.500" fill="#fff" stroke="#ffd3e6" stroke-width="1.800"/><g class="ph-no" transform="translate(${side === 'l' ? 6.500 : 12.500} 22.500) scale(.625)" fill="#ff6fb0">${fxIcon(r).replace(/<\/?svg[^>]*>/g, '')}</g></svg>`,
};
function fixPaint(){
  room.querySelectorAll('.fx').forEach(e => e.remove());
  const add = (cls, html, style, go, label) => {
    const el = document.createElement(go ? 'button' : 'div');
    el.className = 'fx ' + cls; el.innerHTML = html; el.setAttribute('style', style);
    if (go){ el.dataset.go = go; el.setAttribute('aria-label', label); el.addEventListener('click', () => goRoom(go)); } else el.setAttribute('aria-hidden', 'true');
    room.appendChild(el);
  };
  const base = 'bottom:calc(100% - var(--wh,52%))';
  const r = roomId;
  if (r === 'living'){ const can = !VISIT || !!VISIT.yard; add('fx-door', FIX.yardDoor(), `left:79%;width:15%;${base}`, can && !(VISIT && VISIT.card) ? 'yard' : '', ROOM_LABEL.yard); }
  else if (r === 'bed') add('fx-star', FIX.star(), 'left:79%;width:8%;top:calc(var(--wh,52%)*.38)');
  else if (r === 'bath') add('fx-tiles', FIX.tiles(), `left:50%;width:100%;height:calc(var(--wh,52%)*.4);${base}`);
  else if (r === 'kitchen'){ add('fx-counter', FIX.counter(), `left:50%;width:44%;${base}`); add('fx-hooks', FIX.hooks(), 'left:81%;width:24%;top:calc(var(--wh,52%)*.3)'); }
  // 通往隔壁的門口（照切換鈕的順序）。看明信片時只有一間，不畫
  if (VISIT && VISIT.card) return;
  // 花園不排在「隔壁」裡：它是從客廳的門走出去的，所以花園左邊的門口通客廳，最後一間的右邊沒有門口
  const L = roomList().filter(x => x !== 'yard'), i = L.indexOf(r), prev = r === 'yard' ? 'living' : L[i - 1], next = r === 'yard' ? null : L[i + 1];
  if (prev) add('fx-pass l', FIX.pass(prev, 'l'), `left:0;width:9%;${base}`, prev, `去${ROOM_LABEL[prev]}`);
  if (next) add('fx-pass r', FIX.pass(next, 'r'), `left:100%;width:9%;${base}`, next, `去${ROOM_LABEL[next]}`);
}
