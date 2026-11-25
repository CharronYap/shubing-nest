/* 火腿的小店：房間左邊（門邊）的小店鈕。店長是火腿，每次進去吐槽一句。
   - 每天擺 6 件：還沒有的家具、壁紙、地板混著來，隔天換一批（照日期排，同一天打開幾次都一樣）。已經有的不會出現。
   - 價錢看大小：小東西 10 枚、一般家具 15～25 枚、大件 30～40 枚，壁紙地板 20 枚。
   - 娃娃機的扭蛋照舊夾得到家具，小店是另一條路。季節家具、湊齊系列送的東西小店不賣。
   - 小島收成的花和果子在這裡換幣，一個 1 枚。
   不懲罰、不催人：今天沒買，那件東西之後還會再出現；不買也不會怎樣。
   存檔：S.earn.shop = {d:'今天', items:['f:sofa','w:star',…], bought:[…]}（js/earn.js） */
const SHOP_N = 6, SHOP_DECO = 20;
const SHOP_ICON = '<svg viewBox="0 0 24 24"><path d="M3.5 9.5L5 4.5h14l1.5 5a2.6 2.6 0 0 1-5 .6 2.6 2.6 0 0 1-5 0 2.6 2.6 0 0 1-5-.6z" fill="currentColor"/><path d="M5 12.5V20h14v-7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="10" y="14.5" width="4" height="5.5" rx="1" fill="currentColor"/></svg>';
const SHOP_QUIPS = ['今天進的貨都是我挑的，眼光不用懷疑。', '只看不買也可以，我會記住你的臉。', '價錢很公道。我說的。', '這件昨天沒有，明天也不一定有。', '買東西送吐槽，吐槽不用錢。', '老闆是我，店員是我，客訴也是找我。', '錢包空了？電視那邊可以賺，別說我沒教你。'];
// 湊齊系列才送、小店不賣的（之後新系列的獎品加在這裡）
const SHOP_NO = {floor: ['cloud'], wall: [], furn: []};
function shopPrice(x){
  if (x.kind !== 'furn') return x.kind === 'key' ? 40 : SHOP_DECO;
  const f = FURN[x.id]; if (f.price) return f.price;
  const w = f.w || 14;
  return w < 12 ? 10 : w < 17 ? 15 : w < 22 ? 20 : w < 27 ? 25 : w < 32 ? 30 : 40;
}
const shopOwned = x => !!(x.kind === 'furn' ? FURN_OWN[x.id] : x.kind === 'wall' ? WALL_OWN[x.id] : x.kind === 'floor' ? FLOOR_OWN[x.id] : (typeof shopKeyOwned === 'function' && shopKeyOwned(x.id)));
const shopParse = s => { const [k, id] = String(s).split(':'); return {kind: {f: 'furn', w: 'wall', l: 'floor', k: 'key'}[k], id}; };
const shopValid = x => (x.kind === 'furn' ? !!FURN[x.id] : x.kind === 'wall' ? WALLS.includes(x.id) : x.kind === 'floor' ? FLOORS.includes(x.id) : x.kind === 'key');
function shopStock(){
  const e = earnData(), t = todayStr();
  if (e.shop && e.shop.d === t && Array.isArray(e.shop.items)) return e.shop;
  const pool = [
    ...Object.keys(FURN).filter(id => !FURN_OWN[id] && !FURN[id].season && !FURN[id].gift && !SHOP_NO.furn.includes(id)).map(id => 'f:' + id),
    ...WALLS.filter(id => !WALL_OWN[id] && !SHOP_NO.wall.includes(id)).map(id => 'w:' + id),
    ...FLOORS.filter(id => !FLOOR_OWN[id] && !SHOP_NO.floor.includes(id)).map(id => 'l:' + id),
  ];
  const rnd = mulberry32(hashStr('shop' + t) ^ (S.seed || 1));
  for (let i = pool.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  e.shop = {d: t, items: pool.slice(0, SHOP_N), bought: []};
  save();
  return e.shop;
}
const shopPic = x => (x.kind === 'furn' ? furnSVG(x.id) : x.kind === 'wall' ? `<span class="sw w-${x.id}"></span>` : x.kind === 'floor' ? `<span class="sw f-${x.id}"></span>` : (typeof shopKeyPic === 'function' ? shopKeyPic(x.id) : ''));
// 原本 18 件家具的名字（新家具自己帶 name）
const FURN_NAME = {bed:'床', rug:'地毯', lamp:'檯燈', eggchair:'蛋椅', frame:'相框', toybox:'玩具箱', closet:'衣櫃', sofa:'沙發', tv:'電視', table:'茶几', shelf:'櫃子', plant:'盆栽', clock:'時鐘', tub:'浴缸', sink:'洗手台', mat:'踏墊', towel:'毛巾架', duck:'小鴨'};
const shopName = x => (x.kind === 'furn' ? FURN[x.id].name || FURN_NAME[x.id] || '家具' : x.kind === 'wall' ? '壁紙' : x.kind === 'floor' ? '地板' : (typeof shopKeyName === 'function' ? shopKeyName(x.id) : ''));
let shopQuip = '';
function shopOpen(keep){
  if (VISIT) return;
  setPage('room');
  const st = shopStock(), e = earnData();
  if (!keep || !shopQuip) shopQuip = SHOP_QUIPS[Math.floor(Math.random() * SHOP_QUIPS.length)];
  // 固定賣的大東西（新房間的鑰匙和梯子，js/rooms.js）排在最前面
  const keys = typeof shopKeys === 'function' ? shopKeys().map(id => 'k:' + id) : [];
  const list = [...keys, ...st.items].map(shopParse).filter(shopValid);
  const cards = list.map((x, i) => {
    const own = shopOwned(x), p = shopPrice(x);
    return `<div class="sp-it ${own ? 'own' : ''}"><span class="tile">${shopPic(x)}</span><b>${shopName(x)}</b>
      ${own ? '<small>有了</small>' : `<button class="btn y sm" data-sp="${i}" aria-label="買${shopName(x)}，${p} 枚幣">${COIN}${p}</button>`}</div>`;
  }).join('');
  const bag = earnBagN();
  openSheet(`<div class="hd">${SHOP_ICON}<span>火腿的小店</span><small class="pc-left">${COIN}${S.coins}</small></div>
    <div class="sp-box"><div class="yd-pg sp-pg"><img src="${SPR.piggy}" alt=""><p>${shopQuip}</p></div>
      ${list.length ? `<div class="sp-grid">${cards}</div>` : '<p class="al-em">今天沒有新東西了。能買的你都有了，明天再來看看。</p>'}
      <div class="er-it sp-sell ${bag ? '' : 'off'}"><span class="ic">${EARN_FLOWER}</span><span class="tx2"><b>收花和果子</b><small>${bag ? `你有 ${e.bag.flower} 朵花、${e.bag.fruit} 顆果子，一個 1 枚` : '小島的花圃每天可以摘花，樹兩天掉一顆果子'}</small></span>${bag ? `<button class="btn y sm" data-sp="sell">換 ${bag} 枚</button>` : ''}</div>
      <small class="bk-note">每天換一批。娃娃機的扭蛋也夾得到家具。</small></div>`);
  shopOpen.list = list;
  evOpen = false; alOpen = false;
}
function shopBuy(i){
  const x = (shopOpen.list || [])[i]; if (!x || shopOwned(x)) return;
  const p = shopPrice(x);
  if (S.coins < p){ toast(`還差 ${p - S.coins} 枚幣`); return; }
  S.coins -= p;
  if (x.kind === 'furn') FURN_OWN[x.id] = 1; else if (x.kind === 'wall') WALL_OWN[x.id] = 1; else if (x.kind === 'floor') FLOOR_OWN[x.id] = 1;
  else if (typeof shopKeyBuy === 'function') shopKeyBuy(x.id);
  const st = shopStock(); st.bought.push(`${x.kind[0]}:${x.id}`);
  if (typeof setCheck === 'function') setCheck();   // 湊齊系列的獎品（js/furn2.js）
  renderHud(); save(); render();
  toast(`買了${shopName(x)}，在收納架裡`);
  shopOpen(true);
}
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('[data-sp]'); if (!b) return;
  if (b.dataset.sp === 'sell'){ const n = earnSellBag(); if (n) toast(`換了 ${n} 枚幣`); shopOpen(true); }
  else shopBuy(+b.dataset.sp);
});
(function(){
  const b = document.createElement('button');
  b.className = 'rbtn shopb'; b.id = 'shopBtn'; b.setAttribute('aria-label', '火腿的小店'); b.innerHTML = SHOP_ICON;
  b.addEventListener('click', () => { if (!$('#sheet').hidden && $('#sheet .sp-box')){ $('#sheet').hidden = true; return; } shopOpen(); });
  room.appendChild(b);
})();
