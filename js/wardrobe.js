/* 玩偶衣櫃：一隻娃娃一套，帽子和衣服的圖、位置在 js/looks.js（從蛋蛋島複製）
   S.look = {娃娃:{hat:'bow', outfit:'sailor'}}，沒寫的就是不戴、原本的樣子
   S.closet = ['hat.none', 'outfit.none', 'outfit.sailor', …]：擁有的東西，八隻共用
   這個檔放在 room.js 前面載入：房間畫娃娃時就要用 dollPic()，所以最上面不能用 room.js 的 $ */

// 價錢（小窩的幣）。蛋蛋島有些要星星、寶箱才拿得到，小窩一律用幣買，或從扭蛋夾到
const HATS = [
  ['none', '不戴', 0], ['bow', '粉紅蝴蝶結', 8], ['blush', '害羞紅腮紅', 8], ['clip', '星星髮夾', 8],
  ['shades', '酷炫黑墨鏡', 12], ['bunny', '兔耳朵', 12], ['beret', '貝雷帽', 12], ['heartglasses', '愛心眼鏡', 12],
  ['crown', '迷你金皇冠', 16], ['tophat', '小禮帽', 16], ['chef', '小廚師帽', 16], ['flowers', '小花圈', 16],
  ['halo', '發光天使光環', 20], ['eggshell', '蛋殼帽', 20], ['santa', '聖誕帽', 20],
  ['scarf', '紅圍巾', null],   // 不賣，十二月送（js/season.js）
];
const OUTFIT_LIST = [
  ['none', '原本的樣子', 0], ['sailor', '碼頭水手', 0], ['night', '晚安睡帽', 12], ['party', '生日派對', 20],
  ['berry', '草莓帽', 24], ['snow', '雪地毛帽', 24], ['painter', '小畫家', 24], ['detective', '小偵探', 28],
  ['chef', '甜點師傅', 28], ['pumpkin', '南瓜帽', 28], ['dino', '小恐龍', 30], ['wizard', '小魔法師', 30],
  ['king', '國王披風', 36], ['space', '太空頭盔', 36],
];
const LOOK_ITEMS = {};
HATS.forEach(([id, name, price]) => LOOK_ITEMS['hat.' + id] = {kind:'hat', id, name, price});
OUTFIT_LIST.forEach(([id, name, price]) => LOOK_ITEMS['outfit.' + id] = {kind:'outfit', id, name, price});
const CLOSET_START = ['hat.none', 'outfit.none', 'outfit.sailor'];
// 衣服現在只有薯餅和蛋黃哥對好位置（蛋蛋島的 OUTFIT_FIT），其他隻顯示「這套還在做」
const OUTFIT_OK = d => !!LOOKS.OUTFIT_FIT[d];

// 換好之後講一句，照個性
const DRESS_LINE = {
  sloth:'……嗯，這樣好像可以', egg:'好麻煩……不過可以', dog:'好看嗎！好看嗎！', moodeng:'穿這樣跳起來會不會掉',
  nyanko:'哼，勉強可以見人', dino:'吼～我變帥了', snoopy:'這套適合寫小說', piggy:'你的品味我不予置評',
};

/* ---------- 舊存檔補上衣櫃 ---------- */
S.look = S.look || {};
S.closet = S.closet || [];
CLOSET_START.forEach(k => { if (!S.closet.includes(k)) S.closet.push(k); });
if (!FURN_OWN.closet){
  // 舊存檔沒有衣櫃家具：送一個，放在臥室左邊
  FURN_OWN.closet = 1;
  const b = home.bed.items;
  if (!b.some(i => i.kind === 'furn' && i.id === 'closet')) b.push({uid:uid++, kind:'furn', id:'closet', x:12, y:68, sit:null, seat:0});
  save();
}
const lookOf = d => S.look[d] || {};
const hasLook = k => S.closet.includes(k);

/* ---------- 把帽子、衣服疊在娃娃圖上 ---------- */
// 小窩 img/*.png（112 像素）不透明部分的外框，用 bbox.py 量的
const NEST_BOX = {
  sloth:{x0:.080, y0:.161, x1:.920, y1:.848}, egg:{x0:.152, y0:.080, x1:.848, y1:.938},
  dog:{x0:.080, y0:.098, x1:.920, y1:.920}, piggy:{x0:.107, y0:.080, x1:.893, y1:.938},
  nyanko:{x0:.188, y0:.080, x1:.812, y1:.938}, moodeng:{x0:.080, y0:.223, x1:.920, y1:.795},
  snoopy:{x0:.107, y0:.089, x1:.893, y1:.929}, dino:{x0:.089, y0:.170, x1:.857, y1:.848},
};
// 蛋蛋島頭像圖的外框（main.js SLOTH_BOX、TOY_BOX.egg）。衣服是照蛋蛋島的圖對的，要換算到小窩的圖上
const ISLAND_BOX = { sloth:{x0:.051, y0:.148, x1:.949, y1:.852}, egg:{x0:.125, y0:.043, x1:.875, y1:.961} };
const svgSrc = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
const pc = v => (v * 100).toFixed(2) + '%';

// 穿了衣服就不戴頭頂的帽子（會疊在一起），臉上的照戴；太空頭盔全部不戴
// 從蛋蛋島 js/main.js hatHiddenBy() 複製（2026-11-25，commit 5b53aff）
function hatHiddenBy(outfit, hat){
  outfit = String(outfit || 'none').replace(/^outfit\./, '');
  if (outfit === 'none' || !hat || hat === 'none') return false;
  if (outfit === 'space') return true;
  return ((LOOKS.ACCESSORY_PLACE[hat] && LOOKS.ACCESSORY_PLACE[hat].anchor) || 'top') === 'top';
}
// 帽子的位置：照蛋蛋島 js/main.js avatarHat() 的算法，外框換成小窩的圖
// data-a（對齊頭頂還是臉）、data-u（帽子中心離圖正中間多遠）、data-fw（臉寬）：娃娃轉身時 js/spin.js 用這三個算帽子該挪到哪
function hatImg(name, d){
  const svg = name && name !== 'none' ? LOOKS.ACCESSORY_SVG[name] : '';
  const face = LOOKS.TOY_FACE[d], b = NEST_BOX[d];
  if (!svg || !face || !b) return '';
  const vb = /viewBox="([^"]+)"/.exec(svg), v = vb ? vb[1].trim().split(/[\s,]+/).map(Number) : [0, 0, 1, 1];
  const place = LOOKS.ACCESSORY_PLACE[name] || {anchor:'top', size:.6, ay:.8, dx:0}, tune = LOOKS.accTune(d, name);
  const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  const fw = face.w * bw, aw = place.size * fw * tune.scale, ah = aw * (v[3] || 1) / (v[2] || 1);
  const ax = b.x0 + face.x * bw + place.dx * fw + tune.offsetX * bw;
  const ay = b.y0 + (face[place.anchor] != null ? face[place.anchor] : face.top) * bh - place.ay * ah + tune.offsetY * bh;
  const rot = tune.rot ? `transform:rotate(${tune.rot}deg);` : '';
  return `<img class="dz-hat" alt="" data-a="${place.anchor}" data-u="${(ax - .5).toFixed(3)}" data-fw="${fw.toFixed(3)}" src="${svgSrc(svg)}" style="left:${pc(ax - aw / 2)};top:${pc(ay)};width:${pc(aw)};height:${pc(ah)};${rot}">`;
}
// 衣服：蛋蛋島疊在整張照片上（左移 6%），這裡把蛋蛋島圖的外框對到小窩圖的外框
function outfitImg(id, layer, d){
  const svg = LOOKS.outfitSvg(id, layer, d);
  if (!svg) return '';
  const n = NEST_BOX[d], i = ISLAND_BOX[d];
  const sx = (n.x1 - n.x0) / (i.x1 - i.x0), sy = (n.y1 - n.y0) / (i.y1 - i.y0);
  return `<img class="dz-out" alt="" src="${svgSrc(svg)}" style="left:${pc(n.x0 + (-.06 - i.x0) * sx)};top:${pc(n.y0 - i.y0 * sy)};width:${pc(sx)};height:${pc(sy)}">`;
}
// 穿好的娃娃：房間、相簿、衣櫃都用這個。look 沒給就用存檔裡那隻穿的
function dollPic(d, look){
  const l = look || lookOf(d);
  const outfit = OUTFIT_OK(d) && l.outfit && l.outfit !== 'none' ? l.outfit : '';
  const back = outfit ? outfitImg(outfit, 'back', d) : '', front = outfit ? outfitImg(outfit, 'front', d) : '';
  const hat = (back || front) && hatHiddenBy(outfit, l.hat) ? '' : hatImg(l.hat, d);
  if (!back && !front && !hat) return `<img src="${SPR[d]}" alt="">`;
  return `<span class="dz">${back}<img src="${SPR[d]}" alt="">${front}${hat}</span>`;
}
// 換了衣服：房間裡那隻重畫
function redressRoom(d){
  document.querySelectorAll('#room .doll').forEach(el => {
    const it = items.find(i => String(i.uid) === el.dataset.u);
    if (it && (!d || it.id === d)) el.querySelector('.body').innerHTML = dollPic(it.id);
  });
}

/* ---------- 扭蛋：claw.js 的 rollCap() 會先問這裡 ---------- */
function lookRoll(){
  // 不賣的（圍巾）平常開不到，十二月才會在扭蛋裡
  const dec = todayStr().slice(5, 7) === '12';
  const left = Object.keys(LOOK_ITEMS).filter(k => !hasLook(k) && (LOOK_ITEMS[k].price != null || dec));
  if (!left.length || Math.random() >= .35) return null;
  return {kind:'look', id:left[Math.floor(Math.random() * left.length)]};
}
function lookGet(k){ if (!hasLook(k)) S.closet.push(k); save(); }
// 卡片和衣櫃格子上的小圖：帽子只畫帽子，衣服畫薯餅穿著
function lookIcon(k){
  const it = LOOK_ITEMS[k];
  if (it.kind === 'hat') return it.id === 'none' ? NONE_ICON : `<img alt="" src="${svgSrc(LOOKS.ACCESSORY_SVG[it.id])}">`;
  return dollPic('sloth', {outfit:it.id, hat:'none'});
}
const NONE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="#d9c9d3" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M6 18L18 6"/></svg>';
const HANGER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4V11"/><path d="M12 11L3 17.5c-.8.6-.4 1.5.5 1.5h17c.9 0 1.3-.9.5-1.5z"/></svg>';

/* ---------- 衣櫃 ---------- */
let wdDoll = 'sloth', wdTab = 'hat', wdTry = null;   // wdTry：還沒買、先試穿的那件
function wdPage(){
  const d = wdDoll, l = lookOf(d);
  const tryLook = wdTry ? Object.assign({}, l, {[LOOK_ITEMS[wdTry].kind]: LOOK_ITEMS[wdTry].id}) : l;
  const list = Object.keys(LOOK_ITEMS).filter(k => LOOK_ITEMS[k].kind === wdTab && (LOOK_ITEMS[k].price != null || hasLook(k)));
  const cant = wdTab === 'outfit' && !OUTFIT_OK(d);
  const tiles = list.map(k => {
    const it = LOOK_ITEMS[k], own = hasLook(k);
    const on = (l[it.kind] || 'none') === it.id;
    return `<button class="tile wd-it ${own ? '' : 'lock'} ${on ? 'cur' : ''} ${wdTry === k ? 'try' : ''} ${cant && it.id !== 'none' ? 'dim' : ''}" data-wk="${k}" aria-label="${it.name}${own ? '' : `，${it.price} 枚幣`}" aria-pressed="${on}">
      ${lookIcon(k)}${own ? '' : `<span class="pr">${it.price}</span>`}</button>`;
  }).join('');
  let bar = '';
  if (wdTry){
    const it = LOOK_ITEMS[wdTry], short = it.price - S.coins;
    bar = `<div class="wd-buy"><span><b>${it.name}</b>　${it.price} 枚幣</span>
      <button class="btn y" data-wbuy="${wdTry}" ${short > 0 ? 'disabled' : ''}>${short > 0 ? `還差 ${short} 枚` : '買下來'}</button></div>`;
  }
  return `<div class="wd-top"><span class="wd-ph">${dollPic(d, tryLook)}</span>
      <div><b>${DOLL_NAME[d]}</b><small>${wdTry ? '試穿中' : '現在穿的'}</small></div></div>
    <div class="wd-tabs"><button class="${wdTab === 'hat' ? 'on' : ''}" data-wt="hat">帽子・配件</button><button class="${wdTab === 'outfit' ? 'on' : ''}" data-wt="outfit">衣服</button></div>
    ${cant ? `<p class="wd-note">${DOLL_NAME[d]}這套還在做，現在只有薯餅和蛋黃哥穿得下衣服。</p>` : ''}
    <div class="wd-grid">${tiles}</div>${bar}`;
}
function openWardrobe(d){
  if (d) wdDoll = d;
  if (!DOLL_N[wdDoll]) wdDoll = DOLLS.find(x => DOLL_N[x]) || 'sloth';
  const tabs = DOLLS.filter(x => DOLL_N[x]).map(x =>
    `<button class="${x === wdDoll ? 'on' : ''}" data-wd="${x}" aria-label="${DOLL_NAME[x]}" aria-pressed="${x === wdDoll}"><img src="${SPR[x]}" alt=""></button>`).join('');
  openSheet(`<div class="hd">${HANGER}<span>衣櫃</span><span class="wd-coin">${S.coins} 枚幣</span></div>
    <div class="al-tabs wd-dolls">${tabs}</div><div class="wd-pg">${wdPage()}</div>`);
  if (typeof alOpen !== 'undefined') alOpen = false;
  if (typeof evOpen !== 'undefined') evOpen = false;
}
// 穿上：存起來，房間重畫，娃娃講一句
function wear(k){
  const it = LOOK_ITEMS[k], d = wdDoll;
  if (it.kind === 'outfit' && !OUTFIT_OK(d) && it.id !== 'none'){ toast(`${DOLL_NAME[d]}這套還在做`); return; }
  const l = S.look[d] = Object.assign({}, lookOf(d), {[it.kind]: it.id});
  if (l.hat === 'none') delete l.hat;
  if (l.outfit === 'none') delete l.outfit;
  if (!l.hat && !l.outfit) delete S.look[d];
  save(); redressRoom(d);
  const here = items.find(i => i.kind === 'doll' && i.id === d);
  if (here) say(here, DRESS_LINE[d]); else toast(`${DOLL_NAME[d]}：「${DRESS_LINE[d]}」`);
}
document.querySelector('#sheet').addEventListener('click', e => {
  const t = e.target;
  const dz = t.closest('[data-wd]'), tab = t.closest('[data-wt]'), tile = t.closest('[data-wk]'), buy = t.closest('[data-wbuy]');
  if (!dz && !tab && !tile && !buy) return;
  if (dz){ wdTry = null; openWardrobe(dz.dataset.wd); return; }
  if (tab){ wdTab = tab.dataset.wt; wdTry = null; }
  else if (tile){
    const k = tile.dataset.wk;
    if (hasLook(k)){ wdTry = null; wear(k); }
    else if (LOOK_ITEMS[k].kind === 'outfit' && !OUTFIT_OK(wdDoll)){ toast(`${DOLL_NAME[wdDoll]}這套還在做`); return; }
    else wdTry = wdTry === k ? null : k;
  } else if (buy){
    const k = buy.dataset.wbuy, it = LOOK_ITEMS[k];
    if (S.coins < it.price) return;
    S.coins -= it.price; lookGet(k); wdTry = null;
    if (typeof renderHud === 'function') renderHud();
    wear(k);
  }
  openWardrobe();
});

/* 點臥室的衣櫃（沒拖動）就打開；room.js 的 onUp 會問這裡 */
function onFurnTap(it){
  if (it.id !== 'closet') return false;
  wdTry = null; openWardrobe();
  return true;
}
