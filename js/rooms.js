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
  if (!RIDS.includes(r)) RIDS.push(r);
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
    const st = !VISIT && S.yard && S.yard.stay ? Object.keys(S.yard.stay).filter(d => SPR[d]) : [];
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
  const dolls = rm.items.filter(i => i.kind === 'doll' && SPR[i.id]).slice(0, 6);
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
      <p class="bk-note">點一間就過去。${VISIT ? '' : '還沒開的房間在火腿的小店買。'}</p></div>`);
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
