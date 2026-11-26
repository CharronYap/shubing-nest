/* 新房間（2026-11-26）：廚房和閣樓。不是一開始就有，在火腿的小店買「廚房的鑰匙」「閣樓的梯子」各 40 枚。
   - 廚房：貓咪老師的地盤，多幾件跟吃有關的小事。
   - 閣樓：斜屋頂、一扇圓天窗，晚上偶爾有流星。史努比喜歡在這裡寫小說，薯餅喜歡在這裡睡。
   - 買了之後 RIDS（js/room.js）多一間，存檔的 home 多一格；上面的房間鈕超過四顆時可以左右滑。
   - 新房間跟著存檔和公開房間一起上雲端（規則 2026-11-26 發布）。js/cloud.js 留著保險：被擋時先拿掉這兩間再寫。
   - 去朋友家時只看得到自己也有的房間（朋友有廚房、你沒有，就看不到他的廚房）。 */
const ROOM_KEY = {kitchen: {name: '廚房', key: '廚房的鑰匙', price: 40, wall: 'tile', floor: 'check'}, attic: {name: '閣樓', key: '閣樓的梯子', price: 40, wall: 'stripe', floor: 'wood'}};
const ROOM_LABEL = {living: '客廳', bed: '臥室', bath: '浴室', kitchen: '廚房', attic: '閣樓', yard: '門外小島'};
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
  if (!RIDS.includes(r)){ const i = RIDS.indexOf('yard'); if (i >= 0) RIDS.splice(i, 0, r); else RIDS.push(r); }   // 小島排最後
  $('#sheet').hidden = true;
  renderNav();
  setTimeout(() => { toast(`${k.name}打開了，上面多了一顆房間鈕`); goRoom(r); }, 300);
}

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
   切換鈕最左邊的小房子：打開整棟雲上小屋的剖面圖。最上面是閣樓，二樓是臥室和浴室，一樓是客廳和廚房，門外是小島。
   - 每一格看得到那一間現在的壁紙和地板、有沒有開燈、哪幾隻娃娃在裡面（小頭像）
   - 還沒開的房間畫成關燈，掛一把鑰匙和價錢，點了去小店
   - 現在在的那一格有亮框和「你在這裡」；點任何一格就過去
   - 去朋友家時畫的是朋友的家 */
const MAP_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 11.500L12 4l9 7.500V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M12 4v17M3 13.500h18" stroke="#fff" stroke-width="1.600"/></svg>';
const MAP_KEY = '<svg viewBox="0 0 24 24"><circle cx="8" cy="9" r="5" fill="#ffd75e" stroke="#d99a00" stroke-width="1.800"/><circle cx="8" cy="9" r="1.800" fill="#fff8e0"/><path d="M12 13l8 8M17 18l2-2" fill="none" stroke="#d99a00" stroke-width="2.400" stroke-linecap="round"/></svg>';
function mapCell(r){
  const H = VISIT ? VISIT.home : home, here = (typeof yardOn !== 'undefined' && yardOn ? 'yard' : roomId) === r;
  const nm = `<span class="hm-nm">${ICON[r] || ''}${ROOM_LABEL[r]}</span>`, tag = here ? '<span class="hm-here">你在這裡</span>' : '';
  if (r === 'yard'){
    const has = VISIT ? !!VISIT.yard : true;
    const st = ((H.yard && H.yard.items) || []).filter(i => i.kind === 'doll' && SPR[i.id]).map(i => i.id);   // 小島現在是房間，列在上面的娃娃
    return `<button class="hm-c hm-y ${here ? 'cur' : ''} ${has ? '' : 'none'}" data-hm="yard" ${has ? '' : 'disabled'} aria-label="門外小島${here ? '，你在這裡' : ''}"><span class="hm-isle"></span>
      <span class="hm-dolls">${st.map(d => `<img src="${SPR[d]}" alt="${DOLL_NAME[d]}">`).join('')}</span>${nm}${tag}</button>`;
  }
  const rm = H[r];
  if (!rm){
    const k = ROOM_KEY[r];
    return VISIT
      ? `<button class="hm-c lock none" disabled aria-label="${ROOM_LABEL[r]}，這裡看不到"><span class="hm-wall"></span>${nm}</button>`
      : `<button class="hm-c lock" data-hm="${r}" aria-label="${ROOM_LABEL[r]}還沒開，${k.key} ${k.price} 枚幣"><span class="hm-wall"></span><span class="hm-key">${MAP_KEY}<b>${COIN}${k.price}</b></span>${nm}</button>`;
  }
  // 現在誰在這一間：出門去隔壁的不算、來作客的算（js/roam2.js）；沒有那個檔案就照擺設
  const dolls = (typeof roamIn === 'function' ? roamIn(r, rm) : rm.items.filter(i => i.kind === 'doll' && SPR[i.id]).map(i => i.id)).slice(0, 6).map(id => ({id}));
  return `<button class="hm-c ${here ? 'cur' : ''} ${rm.light === false ? 'off' : ''}" data-hm="${r}" aria-label="${ROOM_LABEL[r]}${here ? '，你在這裡' : ''}，${dolls.length ? dolls.map(i => DOLL_NAME[i.id]).join('、') + '在這裡' : '沒有娃娃'}">
    <span class="hm-wall w-${rm.wall}"></span><span class="hm-floor f-${rm.floor}"></span>
    <span class="hm-dolls">${dolls.map(i => `<img src="${SPR[i.id]}" alt="">`).join('')}</span>${nm}${tag}</button>`;
}
function mapOpen(){
  if (VISIT && VISIT.card) return;
  const who = VISIT ? `${typeof txSlot === 'function' ? txSlot(VISIT.name) : ''}的小窩` : '小屋地圖';
  openSheet(`<div class="hd">${MAP_ICON}<span>${who}</span></div>
    <div class="hm"><div class="hm-roof"></div>
      <div class="hm-house"><div class="hm-row one">${mapCell('attic')}</div><div class="hm-row">${mapCell('bed')}${mapCell('bath')}</div><div class="hm-row">${mapCell('living')}${mapCell('kitchen')}</div></div>
      <div class="hm-out">${mapCell('yard')}</div>
      ${!VISIT && typeof tvMapNote === 'function' ? tvMapNote() : ''}
      <p class="bk-note">點一間就過去。${VISIT ? '' : '還沒開的房間在火腿的小店買。'}</p>
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
  if (r !== 'yard' && !(VISIT ? VISIT.home : home)[r]){ if (!VISIT && typeof shopOpen === 'function') shopOpen(); return; }
  $('#sheet').hidden = true;
  goRoom(r);
});

/* ---------- 每一間固定的樣子（看得出自己在哪一間 3） ----------
   房間本身的構造，不管換什麼壁紙地板都在，用來一眼認出是哪一間：
   - 客廳：窗戶比較大；牆上右邊有一扇開著的門，門外看得到小島的一角（點了去小島）
   - 臥室：窗戶比較小；牆上有一盞星星小夜燈
   - 浴室：牆的下半截是磁磚，窗戶小小的在高處
   - 廚房：窗戶下面是流理台，牆上一排掛勾
   - 閣樓：斜屋頂和圓天窗（css）
   - 左右兩邊是通往隔壁的門口，門框上有隔壁那一間的圖示，點了過去。順序跟上面的切換鈕一樣
   每一樣都是房間裡的一個 .fx 元素（裡面是 SVG），畫在家具後面。拍照、明信片、去朋友家都是用同一個房間畫面，
   拍照時 js/photo.js 會把 .fx 的 SVG 一起畫進去。全部自己畫的。 */
const fxIcon = r => (ICON[r] || '').replace(/currentColor/g, '#ff6fb0');
const FIX = {
  // 開著的門，門外是天空和小島的一角
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
  // 房間邊上的門口：side 'l' 貼左邊、'r' 貼右邊，門框上是隔壁那一間的圖示
  pass: (r, side) => `<svg viewBox="0 0 34 100"><g ${side === 'l' ? 'transform="translate(34 0) scale(-1 1)"' : ''}>
    <path d="M6 100V22c0-9 6-14 14-14h14v92z" fill="#7a5a48"/><path d="M11 100V24c0-6 4-10 10-10h13v86z" fill="#fde9d2"/>
    <path d="M11 100V24c0-6 4-10 10-10h13" fill="none" stroke="#c98f56" stroke-width="2.400"/><path d="M6 100V22c0-9 6-14 14-14h14" fill="none" stroke="#9a6431" stroke-width="2.400"/>
    <path d="M24 50l6 6-6 6" fill="none" stroke="#ff9cc8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
    <circle cx="${side === 'l' ? 14 : 20}" cy="30" r="9.500" fill="#fff" stroke="#ffd3e6" stroke-width="1.800"/><g transform="translate(${side === 'l' ? 6.500 : 12.500} 22.500) scale(.625)" fill="#ff6fb0">${fxIcon(r).replace(/<\/?svg[^>]*>/g, '')}</g></svg>`,
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
  if (r === 'living'){ const can = !VISIT || !!VISIT.yard; add('fx-door', FIX.yardDoor(), `left:79%;width:15%;${base}`, can && !(VISIT && VISIT.card) ? 'yard' : '', '門外小島'); }
  else if (r === 'bed') add('fx-star', FIX.star(), 'left:79%;width:8%;top:calc(var(--wh,52%)*.38)');
  else if (r === 'bath') add('fx-tiles', FIX.tiles(), `left:50%;width:100%;height:calc(var(--wh,52%)*.4);${base}`);
  else if (r === 'kitchen'){ add('fx-counter', FIX.counter(), `left:50%;width:44%;${base}`); add('fx-hooks', FIX.hooks(), 'left:81%;width:24%;top:calc(var(--wh,52%)*.3)'); }
  // 通往隔壁的門口（照切換鈕的順序）。看明信片時只有一間，不畫
  if (VISIT && VISIT.card) return;
  // 小島不排在「隔壁」裡：它是從客廳的門走出去的，所以小島左邊的門口通客廳，最後一間的右邊沒有門口
  const L = roomList().filter(x => x !== 'yard'), i = L.indexOf(r), prev = r === 'yard' ? 'living' : L[i - 1], next = r === 'yard' ? null : L[i + 1];
  if (prev) add('fx-pass l', FIX.pass(prev, 'l'), `left:0;width:9%;${base}`, prev, `去${ROOM_LABEL[prev]}`);
  if (next) add('fx-pass r', FIX.pass(next, 'r'), `left:100%;width:9%;${base}`, next, `去${ROOM_LABEL[next]}`);
}
