/* 出國旅行第一批（2026-11-27）：吉隆坡雙峰塔、台北101、富士山和河口湖、巴黎艾菲爾鐵塔。玩法在 js/travel.js，國內四個地方在 js/traveldata.js。
   畫的東西照「出國旅行_在地查證.md」裡標「確定」的：
   - 雙峰塔：兩座一樣高，天橋在塔身一半偏下，塔身一圈一圈、越往上越細，頂端細長尖塔上有一顆圓環的球。名稱寫「雙峰塔」。
   - 台北101：下面一段往上收，上面八節、每節上寬下窄往外斜，藍綠色，頂端尖塔。不畫煙火。
   - 富士山：春天，山頂有雪、櫻花；倒影那一張是清晨、湖面平。不畫船、不畫紅葉。
   - 艾菲爾鐵塔：褐色偏暖（下面深上面淺）、三道橫的平台、四隻腳往上收。只畫白天和黃昏沒亮燈的，不畫夜間燈光、不畫船。
   四個地方都不寫店名、不放品牌和人物。全部自己畫、自己寫。
   要多一個地方：在 TV_ABROAD 加一筆（名字、國家、愛去的娃娃、土產、三張明信片、每隻的話、兩隻的對話），其他地方不用改。
   這個檔要排在 js/traveldata.js 後面、js/main.js 前面載入（土產要先進家具表）。 */
const AB_C = {dusk1: '#b7a3cf', dusk2: '#eeb09a', dusk3: '#f7d3a6', steel: '#e6ecf2', steel2: '#b9c5d4', steel3: '#8794aa', lit: '#fff2c4', lit2: '#f4d58a', lit3: '#d9a94f',
  glass: '#63b8ac', glass2: '#3f918c', glass3: '#b4e2d6', glassd: '#3a7f86', glassd2: '#2c6068', glassd3: '#8ec9c0',
  pink: '#f7c4d4', pink2: '#f09ab8', pinkl: '#fde6ee', snow: '#fbf8f2', fuji: '#7f93c4', fuji2: '#6076ad', dawn: '#f6dfe0', dawn2: '#cfdcf0', lake: '#b9cfe6', mist: '#eef2f6',
  iron: '#8a5f45', iron2: '#6e4a36', iron3: '#a87a58', irond: '#5c3a2a', irond2: '#7a5038', stone: '#ded2bd', stone2: '#bfb198', stone3: '#9c8f78', city: '#5d6f9e', city2: '#6e80ad'};

/* ---------- 畫圖的小工具 ---------- */
// 棕櫚樹（熱帶的公園）
const abPalm = (x, y, k = 1, c = TV_C.leafd) => `<path d="M${x} ${y}c${2 * k} ${-12 * k} ${-1 * k} ${-24 * k} ${3 * k} ${-34 * k}" fill="none" stroke="${TV_C.wood}" stroke-width="${3.4 * k}" stroke-linecap="round"/>`
  + [[-18, 5, -8, -10], [-13, -7, -5, -11], [0, -15, -1, -8], [13, -7, 6, -11], [18, 5, 9, -10]].map(([ex, ey, cx, cy]) => `<path d="M${x + 3 * k} ${y - 34 * k}q${cx * k} ${cy * k} ${ex * k} ${ey * k}" fill="none" stroke="${c}" stroke-width="${4 * k}" stroke-linecap="round"/>`).join('');
// 一排一般的矮樓（不寫名字）：xs = [[x, 寬, 高]…]，底在 y
const abBlocks = (y, xs, c, win) => xs.map(([x, w, h], i) => `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${c}"/>` + (win ? Array.from({length: Math.max(1, Math.floor(h / 9))}, (_, r) => Array.from({length: Math.max(1, Math.floor(w / 8))}, (_, q) => ((i + r * 2 + q) % 3 ? `<rect x="${x + 2.5 + q * 8}" y="${y - h + 3 + r * 9}" width="3" height="3.6" fill="${win}"/>` : '')).join('')).join('') : '')).join('');
// 雙峰塔的一座：x 中心、y0 地面、h 塔身直的那一段、w 寬。上面五層往上收，再上去是細長的尖塔和一顆圓環的球
// 塔身：中間亮、兩邊暗（平面是八角星，所以有凹凸），加一圈一圈的橫紋。整座高度大約是 h 的 1.55 倍
function abTwin(x, y0, h, w, c, c2, c3){
  const top = y0 - h;
  let s = tvSh(`<rect x="${x - w / 2}" y="${top}" width="${w}" height="${h}" rx="${w * .1}"/>`, c2, 1.6)
    + `<rect x="${x - w * .3}" y="${top}" width="${w * .6}" height="${h}" fill="${c}"/><rect x="${x - w * .06}" y="${top}" width="${w * .12}" height="${h}" fill="${c2}" opacity=".55"/>`;
  for (let yy = top + 3; yy < y0 - 2; yy += 4.6) s += `<rect x="${x - w / 2}" y="${yy}" width="${w}" height="1.1" fill="${c3}" opacity=".55"/>`;
  let y = top;
  [[.84, .1], [.68, .085], [.52, .07], [.36, .055], [.22, .04]].forEach(([k, hh]) => {
    const sh = h * hh; y -= sh;
    s += `<rect x="${x - w * k / 2}" y="${y}" width="${w * k}" height="${sh + .6}" rx="${w * k * .12}" fill="${c2}"/><rect x="${x - w * k * .3}" y="${y}" width="${w * k * .6}" height="${sh + .6}" fill="${c}"/><rect x="${x - w * k / 2}" y="${y + sh - 1}" width="${w * k}" height="1" fill="${c3}" opacity=".55"/>`;
  });
  const sp = h * .2;
  return s + `<rect x="${x - w * .04}" y="${y - sp}" width="${w * .08}" height="${sp + .5}" fill="${c}"/><circle cx="${x}" cy="${y - sp * .42}" r="${w * .1}" fill="${c}"/><rect x="${x - w * .1}" y="${y - sp * .42 - .5}" width="${w * .2}" height="1" fill="${c3}"/>`;
}
// 兩座塔中間的天橋：兩層樓高，下面有兩根斜的支架撐在比較低的樓層。位置大約在整座高度的四成（塔身一半偏下）
function abBridge(x1, x2, y0, h, w, c, c3){
  const yb = y0 - h * .585, a = x1 + w / 2, b = x2 - w / 2, m = (a + b) / 2, t = Math.max(3, h * .042);
  return `<path d="M${a} ${yb + t + h * .2}L${m} ${yb + t}L${b} ${yb + t + h * .2}" fill="none" stroke="${c3}" stroke-width="${Math.max(1.4, w * .07)}" stroke-linecap="round"/>` + tvSh(`<rect x="${a - 1}" y="${yb}" width="${b - a + 2}" height="${t}"/>`, c, 1) + `<rect x="${a - 1}" y="${yb + t / 2 - .4}" width="${b - a + 2}" height=".8" fill="${c3}"/>`;
}
// 台北101：H 是到屋頂的高度（不含尖塔）。下面四分之一是往上收的底座，中間八節每節上寬下窄，最上面幾層小的和一根尖塔
function ab101(x, y0, H, c, c2, c3){
  const w = H * .2, bh = H * .25, mh = H * .62 / 8;
  let s = tvSh(`<path d="M${x - w * .64} ${y0}L${x - w * .4} ${y0 - bh}h${w * .8}L${x + w * .64} ${y0}z"/>`, c2, 1.6)
    + `<path d="M${x - w * .2} ${y0}L${x - w * .14} ${y0 - bh}h${w * .28}L${x + w * .2} ${y0}z" fill="${c}" opacity=".6"/>`
    // 塔身中段的圓形圖案（古錢幣只有一個來源，畫成簡單的圓圈）
    + `<circle cx="${x}" cy="${y0 - bh * .82}" r="${w * .1}" fill="none" stroke="${c3}" stroke-width="${Math.max(.8, w * .035)}"/>`;
  let y = y0 - bh;
  for (let i = 0; i < 8; i++){
    const yt = y - mh;
    s += `<path d="M${x - w * .39} ${y}L${x - w * .5} ${yt}h${w}L${x + w * .39} ${y}z" fill="${i % 2 ? c : c2}"/><path d="M${x - w * .5} ${yt}h${w}l${-w * .025} ${mh * .24}h${-w * .95}z" fill="${c3}"/>`
      // 每一節上的如意圖案：畫成中間一個小小的捲
      + `<path d="M${x - w * .1} ${yt + mh * .62}q${w * .1} ${-mh * .3} ${w * .2} 0" fill="none" stroke="${c3}" stroke-width="${Math.max(.7, w * .03)}" stroke-linecap="round"/>`;
    y = yt;
  }
  const ch = H * .13;
  s += `<rect x="${x - w * .32}" y="${y - ch * .42}" width="${w * .64}" height="${ch * .42 + .5}" fill="${c2}"/><rect x="${x - w * .2}" y="${y - ch * .74}" width="${w * .4}" height="${ch * .32 + .5}" fill="${c}"/><rect x="${x - w * .11}" y="${y - ch}" width="${w * .22}" height="${ch * .26 + .5}" fill="${c2}"/>`;
  return s + `<path d="M${x - w * .05} ${y - ch}L${x} ${y - ch - H * .13}L${x + w * .05} ${y - ch}z" fill="${c3}"/>`;
}
// 富士山：左右對稱的錐形，山頂平平的一小段，上面有雪。x 中心、y0 山腳、a 半個底寬、h 高
function abFuji(x, y0, a, h, c, snow){
  const top = y0 - h, t = a * .075;
  const body = `<path d="M${x - a} ${y0}C${x - a * .5} ${y0 - h * .3} ${x - a * .2} ${y0 - h * .86} ${x - t} ${top}Q${x} ${top - 2} ${x + t} ${top}C${x + a * .2} ${y0 - h * .86} ${x + a * .5} ${y0 - h * .3} ${x + a} ${y0}z"/>`;
  const sy = top + h * .3, sx = a * .245;   // 雪線：大約在上面三成
  const cap = `<path d="M${x - t} ${top}Q${x} ${top - 2} ${x + t} ${top}C${x + a * .1} ${top + h * .13} ${x + a * .17} ${top + h * .22} ${x + sx} ${sy}l${-sx * .28} ${-h * .07}l${-sx * .24} ${h * .1}l${-sx * .26} ${-h * .09}l${-sx * .22} ${h * .1}l${-sx * .22} ${-h * .09}l${-sx * .26} ${h * .1}l${-sx * .24} ${-h * .1}l${-sx * .28} ${h * .07}C${x - a * .17} ${top + h * .22} ${x - a * .1} ${top + h * .13} ${x - t} ${top}z" fill="${snow}"/>`;
  return body.replace('/>', ` fill="${c}"/>`) + cap;
}
// 櫻花樹：樹幹加幾團粉紅色
const abSakura = (x, y, k = 1, c = AB_C.pink, c2 = AB_C.pinkl) => `<path d="M${x - 3 * k} ${y}c${1 * k} ${-12 * k} ${-2 * k} ${-20 * k} ${-6 * k} ${-28 * k}M${x + 2 * k} ${y}c0 ${-12 * k} ${4 * k} ${-20 * k} ${8 * k} ${-27 * k}" fill="none" stroke="${TV_C.wood2}" stroke-width="${3.4 * k}" stroke-linecap="round"/><rect x="${x - 3.5 * k}" y="${y - 16 * k}" width="${7 * k}" height="${16 * k}" rx="${2 * k}" fill="${TV_C.wood2}"/>`
  + tvSh(`<path d="M${x - 26 * k} ${y - 30 * k}a${13 * k} ${13 * k} 0 0 1 ${10 * k} ${-18 * k}a${15 * k} ${15 * k} 0 0 1 ${27 * k} ${-3 * k}a${12 * k} ${12 * k} 0 0 1 ${14 * k} ${17 * k}a${10 * k} ${10 * k} 0 0 1 ${-8 * k} ${13 * k}h${-34 * k}a${10 * k} ${10 * k} 0 0 1 ${-9 * k} ${-9 * k}z"/>`, c, 2 * k)
  + `<circle cx="${x - 12 * k}" cy="${y - 44 * k}" r="${8 * k}" fill="${c2}"/><circle cx="${x + 9 * k}" cy="${y - 38 * k}" r="${6 * k}" fill="${c2}"/><circle cx="${x - 2 * k}" cy="${y - 30 * k}" r="${4.5 * k}" fill="${c2}" opacity=".8"/>`;
const abPetals = pts => pts.map(([x, y, r], i) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.5" transform="rotate(${r || i * 40} ${x} ${y})" fill="${i % 2 ? AB_C.pink : AB_C.pinkl}"/>`).join('');
// 艾菲爾鐵塔：x 中心、y0 地面、H 整座高（含天線）。四隻腳往上收成一支，三道橫的平台；下面最深、上面最淺。flat：黃昏的剪影（一個顏色）
function abEiffel(x, y0, H, flat){
  const w = H * .44, y1 = y0 - H * .18, y2 = y0 - H * .36, y3 = y0 - H * .84;
  const c1 = flat ? AB_C.irond : AB_C.iron2, c2 = flat ? AB_C.irond : AB_C.iron, c3 = flat ? AB_C.irond : AB_C.iron3, pl = flat ? AB_C.irond2 : AB_C.iron2, lt = flat ? AB_C.irond2 : AB_C.iron3;
  // 最下面一段：兩邊的腳往內彎，中間是一個大拱
  let s = `<path d="M${x - w / 2} ${y0}Q${x - w * .36} ${y0 - H * .1} ${x - w * .3} ${y1}L${x + w * .3} ${y1}Q${x + w * .36} ${y0 - H * .1} ${x + w / 2} ${y0}L${x + w * .35} ${y0}C${x + w * .31} ${y0 - H * .12} ${x + w * .17} ${y1 + H * .04} ${x} ${y1 + H * .04}C${x - w * .17} ${y1 + H * .04} ${x - w * .31} ${y0 - H * .12} ${x - w * .35} ${y0}z" fill="${c1}"/>`;
  // 第二段：兩隻腳之間有一個小一點的開口
  s += `<path d="M${x - w * .27} ${y1}Q${x - w * .2} ${y1 - H * .1} ${x - w * .155} ${y2}L${x + w * .155} ${y2}Q${x + w * .2} ${y1 - H * .1} ${x + w * .27} ${y1}L${x + w * .14} ${y1}Q${x + w * .1} ${y1 - H * .07} ${x} ${y1 - H * .1}Q${x - w * .1} ${y1 - H * .07} ${x - w * .14} ${y1}z" fill="${c2}"/>`;
  // 最上面一段：往上收成一支
  s += `<path d="M${x - w * .135} ${y2}C${x - w * .07} ${y2 - H * .16} ${x - w * .035} ${y2 - H * .34} ${x - w * .028} ${y3}L${x + w * .028} ${y3}C${x + w * .035} ${y2 - H * .34} ${x + w * .07} ${y2 - H * .16} ${x + w * .135} ${y2}z" fill="${c3}"/>`;
  // 鐵架的交叉（很淡，幾道就好）
  if (!flat) s += `<path d="M${x - w * .44} ${y0 - H * .02}L${x - w * .3} ${y1 + 2}M${x - w * .36} ${y0 - H * .02}L${x - w * .36} ${y0 - H * .1}M${x + w * .44} ${y0 - H * .02}L${x + w * .3} ${y1 + 2}M${x - w * .22} ${y1 - 2}L${x - w * .13} ${y2 + 2}M${x + w * .22} ${y1 - 2}L${x + w * .13} ${y2 + 2}M${x - w * .09} ${y2 - H * .06}L${x + w * .07} ${y2 - H * .16}M${x + w * .09} ${y2 - H * .06}L${x - w * .07} ${y2 - H * .16}M${x - w * .055} ${y2 - H * .2}L${x + w * .045} ${y2 - H * .3}M${x + w * .055} ${y2 - H * .2}L${x - w * .045} ${y2 - H * .3}" fill="none" stroke="${lt}" stroke-width="${Math.max(.7, H * .008)}" opacity=".7"/>`;
  // 三道平台，最上面是小小的塔頂和天線
  s += `<rect x="${x - w * .33}" y="${y1 - H * .016}" width="${w * .66}" height="${H * .032}" rx="1" fill="${pl}"/><rect x="${x - w * .185}" y="${y2 - H * .014}" width="${w * .37}" height="${H * .028}" rx="1" fill="${pl}"/><rect x="${x - w * .055}" y="${y3 - H * .012}" width="${w * .11}" height="${H * .024}" rx=".8" fill="${pl}"/>`;
  return s + `<rect x="${x - w * .03}" y="${y3 - H * .06}" width="${w * .06}" height="${H * .05}" fill="${c3}"/><rect x="${x - Math.max(.6, w * .01)}" y="${y0 - H}" width="${Math.max(1.2, w * .02)}" height="${H * .11}" fill="${c3}"/>`;
}
// 修剪過的樹（公園裡一排一排的）
const abClip = (x, y, k = 1, c = TV_C.leaf) => `<rect x="${x - 1.6 * k}" y="${y - 12 * k}" width="${3.2 * k}" height="${12 * k}" fill="${TV_C.wood2}"/>` + tvSh(`<rect x="${x - 9 * k}" y="${y - 30 * k}" width="${18 * k}" height="${20 * k}" rx="${7 * k}"/>`, c, 1.6 * k);

/* ---------- 四個地方 ----------
   name：寫在明信片、紙條、相簿上的名字；short：收納架格子裡的短字；country：護照那一頁的國家；stamp：護照上蓋的章中間畫什麼（24×24 的小圖）；
   fav：特別愛去的娃娃；sv：土產（一樣）；cards：三張明信片；lines：每隻娃娃兩句；duo：兩隻一起去的對話 */
const TV_ABROAD = {
  kl: {name: '雙峰塔', short: '雙峰塔', country: '馬來西亞', city: '吉隆坡', fav: ['dog', 'piggy'],
    stamp: '<path d="M7 21V9l1.200-3 1.200 3v12zM14.600 21V9l1.200-3L17 9v12zM9.400 13.500h5.200" fill="none" stroke="currentColor" stroke-width="1.700" stroke-linejoin="round"/><path d="M8.200 6V3M15.800 6V3" stroke="currentColor" stroke-width="1.200" stroke-linecap="round"/>',
    sv: {kltower: {name: '雙峰塔的小模型', vb: [34, 42], w: 8, svg: () => tvSh('<rect x="3" y="35" width="28" height="5" rx="2.200"/>', '#8a5a45', 1)
      + [11, 23].map(x => tvSh(`<path d="M${x - 4} 35V15l1.300-3 .900-3.500L${x} 3l1.800 5.500.900 3.500 1.300 3v20z"/>`, AB_C.steel2, 1) + `<rect x="${x - 1.4}" y="12" width="2.800" height="23" fill="${AB_C.steel}"/><path d="M${x - 4} 19h8M${x - 4} 24h8M${x - 4} 29h8" stroke="${AB_C.steel3}" stroke-width=".8"/>`).join('')
      + `<rect x="14.500" y="22.500" width="5" height="2.400" fill="${AB_C.steel}"/><path d="M15 29l2-4 2 4" fill="none" stroke="${AB_C.steel3}" stroke-width="1"/>`}},
    cards: [
      {name: '湖邊的噴泉', at: [20, 94, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/>${tvCloud(14, 44, .9)}${tvCloud(232, 62, .8)}<circle cx="266" cy="28" r="14" fill="${TV_C.sun}"/>
        ${abBlocks(150, [[44, 22, 26], [70, 16, 18], [214, 20, 22], [238, 24, 30]], TV_C.sky2)}
        ${abTwin(116, 150, 86, 27, AB_C.steel, AB_C.steel2, AB_C.steel3)}${abTwin(184, 150, 86, 27, AB_C.steel, AB_C.steel2, AB_C.steel3)}${abBridge(116, 184, 150, 86, 27, AB_C.steel, AB_C.steel3)}
        ${tvSh('<path d="M94 152c0-18 112-18 112 0z"/>', AB_C.stone, 1.5)}<rect x="100" y="143" width="100" height="2" fill="${AB_C.stone2}"/>
        ${tvSh('<path d="M0 150c80-8 220-8 300 0v50H0z"/>', TV_C.leafl, 2)}
        ${tvTree(40, 168, 1, TV_C.leafd, TV_C.leaf)}${tvTree(262, 166, 1.1, TV_C.leaf, TV_C.leafl)}${abPalm(76, 164, .9)}${abPalm(228, 162, .8)}
        ${tvSh('<ellipse cx="180" cy="180" rx="104" ry="20"/>', TV_C.teal, 2)}<ellipse cx="172" cy="177" rx="78" ry="11" fill="${TV_C.teall}" opacity=".5"/>
        ${[[150, 14], [176, 20], [202, 14]].map(([x, h]) => `<path d="M${x} 178q-5 ${-h * .8} 0 ${-h}q5 ${h * .2} 0 ${h}z" fill="${TV_C.paper}" opacity=".9"/><ellipse cx="${x}" cy="178" rx="7" ry="2" fill="${TV_C.paper}" opacity=".7"/>`).join('')}`},
      {name: '傍晚亮起來', at: [80, 95, 24], svg: () => `<rect width="300" height="200" fill="${AB_C.dusk3}"/><rect width="300" height="56" fill="${AB_C.dusk1}"/><rect y="56" width="300" height="44" fill="${AB_C.dusk2}"/>
        <ellipse cx="150" cy="96" rx="92" ry="80" fill="${AB_C.lit}" opacity=".22"/>
        ${abBlocks(172, [[0, 26, 34], [26, 20, 50], [48, 28, 30], [76, 16, 40], [206, 20, 44], [226, 26, 28], [254, 22, 52], [276, 24, 36]], AB_C.city, AB_C.lit2)}
        ${abTwin(120, 172, 92, 27, AB_C.lit, AB_C.lit2, AB_C.lit3)}${abTwin(180, 172, 92, 27, AB_C.lit, AB_C.lit2, AB_C.lit3)}${abBridge(120, 180, 172, 92, 27, AB_C.lit, AB_C.lit3)}
        ${tvSh('<path d="M92 174c0-16 116-16 116 0z"/>', AB_C.city2, 1.5)}
        ${tvSh('<path d="M0 172c70-10 230-10 300 0v28H0z"/>', TV_C.night3, 2)}
        ${tvTree(26, 190, 1, TV_C.night2, TV_C.night3)}${abPalm(70, 190, .9, TV_C.night2)}${abPalm(198, 192, 1, TV_C.night2)}${tvTree(286, 192, .9, TV_C.night2, TV_C.night3)}`},
      {name: '從下面往上看', at: [50, 98, 19], svg: () => {
        const tower = m => { const X = v => (m ? 300 - v : v); let s = `<path d="M${X(8)} 200L${X(124)} 30L${X(133)} 30L${X(114)} 200z" fill="${AB_C.steel2}"/><path d="M${X(40)} 200L${X(126.500)} 30L${X(130.500)} 30L${X(84)} 200z" fill="${AB_C.steel}"/>`;
          for (let i = 1; i < 17; i++){ const t = i / 17, y = 200 - 170 * t, a = 8 + 116 * t, b = 114 + 19 * t; s += `<path d="M${X(a)} ${y}Q${X((a + b) / 2)} ${y - 7 * (1 - t)} ${X(b)} ${y}" fill="none" stroke="${AB_C.steel3}" stroke-width="${.6 + 1.3 * (1 - t)}" opacity=".6"/>`; }
          return s + `<path d="M${X(125)} 30L${X(127.500)} 19L${X(131)} 19L${X(132)} 30z" fill="${AB_C.steel2}"/><path d="M${X(128.200)} 19L${X(130)} 5L${X(130.800)} 19z" fill="${AB_C.steel}"/><circle cx="${X(129.700)}" cy="13" r="1.700" fill="${AB_C.steel}"/>`; };
        return `<rect width="300" height="200" fill="${TV_C.sky2}"/><rect width="300" height="110" fill="${TV_C.sky}"/>${tvCloud(132, 70, .8)}${tvCloud(20, 34, .6)}${tvCloud(238, 44, .6)}
        ${tower(false)}${tower(true)}
        <path d="M121.500 132L150 107L178.500 132" fill="none" stroke="${AB_C.steel3}" stroke-width="2.600" stroke-linecap="round"/>${tvSh('<path d="M124.500 97q25.500-5 51 0v9q-25.500-5-51 0z"/>', AB_C.steel, 1.5)}<path d="M124.500 101.500q25.500-5 51 0" fill="none" stroke="${AB_C.steel3}" stroke-width="1"/>
        ${tvSh('<path d="M0 190c90-8 210-8 300 0v10H0z"/>', AB_C.stone, 1.5)}`; }},
    ],
    lines: {
      sloth: ['兩座塔長得一模一樣。我左邊看完看右邊，看了很久，真的一樣。', '這裡整年都是夏天。我躺在公園的樹下，葉子好大一片。'],
      egg: ['好熱。塔很高。我沒有要上去，光抬頭就累了。', '湖邊有噴泉，風吹過來涼涼的。就待這裡吧。'],
      dog: ['兩座塔中間有一座橋！在好高好高的地方！我想從上面跑過去！', '噴泉噴水的時候我追過去！全身都濕了！好涼！'],
      moodeng: ['我跳了好多下，還是沒有塔高。它有八十八層，不公平。', '兩座一樣高，那誰是哥哥？沒有人回答我。'],
      nyanko: ['本大爺抬頭看了三秒，脖子就痠了。塔太高是塔的問題。', '天氣這麼熱，本大爺需要一點冰的。這是合理的要求。'],
      dino: ['我躲在大樹後面看塔。塔那麼高，它一定也看到我了。', '傍晚塔亮起來，我的影子變得好長。嘿嘿，我也很高。'],
      snoopy: ['兩座一樣的塔，中間一座橋。我的主角們要在橋上碰面。', '塔尖在太陽下面會發亮。我在筆記本上寫，像兩枝銀色的筆。'],
      piggy: ['一座八十八層，兩座一樣高。天橋在四十一樓和四十二樓，我記得很清楚。', '外面是不鏽鋼和玻璃，所以會反光。這個要知道。'],
    },
    duo: [
      ['dog', 'sloth', '我繞著兩座塔跑了一圈！', '我看完左邊那座了。右邊的明天看。'],
      ['moodeng', 'piggy', '兩座一樣高，到底誰比較高？', '一樣高就是一樣高。我用看的就知道。'],
      ['nyanko', 'egg', '太熱了，本大爺要找涼的地方。', '我跟你去。不是因為熱，是因為可以坐著。'],
    ]},
  taipei: {name: '台北101', short: '101', country: '台灣', city: '台北', fav: ['nyanko', 'moodeng'],
    stamp: '<path d="M9.500 21l1-4h3l1 4zM10 17l-.800-3h5.600l-.800 3zM9.600 14l-.800-3h6.400l-.800 3zM9.600 11l-.800-3h6.400l-.800 3zM12 8V3" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round" stroke-linecap="round"/>',
    sv: {boba: {name: '珍珠奶茶', unit: '一杯', vb: [30, 42], w: 7, svg: () => `<path d="M17 3l-3 30" stroke="${TV_C.a1}" stroke-width="3" stroke-linecap="round"/>` + tvSh('<path d="M5 12h20l-2.600 25a3 3 0 0 1-3 2.700h-8.800a3 3 0 0 1-3-2.700z"/>', '#e9c9a0', 1.4)
      + `<path d="M5.800 20h18.400l-1.800 17a3 3 0 0 1-3 2.700h-8.800a3 3 0 0 1-3-2.700z" fill="#d2a777"/>${[[10, 35], [14.500, 36.500], [19, 35], [12, 31.500], [17, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.900" fill="#4a3228"/>`).join('')}`
      + tvSh('<path d="M3.500 12c0-5 23-5 23 0z"/>', TV_C.paper, 1) + `<rect x="3" y="11" width="24" height="2.600" rx="1.300" fill="${TV_C.sandd}"/>`}},
    cards: [
      {name: '街上往上看', at: [22, 96, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/><rect y="120" width="300" height="80" fill="${TV_C.sky2}"/>
        ${abBlocks(184, [[0, 34, 44], [34, 26, 30], [222, 30, 36], [252, 48, 52]], AB_C.stone, AB_C.steel3)}
        ${ab101(150, 190, 158, AB_C.glass, AB_C.glass2, AB_C.glass3)}
        ${tvCloud(84, 44, .9)}${tvCloud(172, 30, .8)}${tvCloud(6, 78, .7)}${tvCloud(232, 86, .7)}
        ${tvSh('<path d="M96 190c0-10 108-10 108 0z"/>', AB_C.stone2, 1.5)}
        ${tvSh('<path d="M0 184c80-6 220-6 300 0v16H0z"/>', AB_C.stone3, 1.5)}${tvTree(62, 194, .8)}${tvTree(246, 196, .9, TV_C.leafd, TV_C.leaf)}${tvTree(284, 194, .7)}`},
      {name: '山上的傍晚', at: [30, 88, 24], svg: () => `<rect width="300" height="200" fill="${AB_C.dusk3}"/><rect width="300" height="50" fill="${AB_C.dusk1}"/><rect y="50" width="300" height="40" fill="${AB_C.dusk2}"/><circle cx="246" cy="104" r="15" fill="${TV_C.sun}" opacity=".9"/>
        ${tvSh('<path d="M0 132c50-18 110-22 170-10 50-12 90-10 130 0v40H0z"/>', AB_C.city2, 1.5)}
        ${abBlocks(152, [[0, 20, 20], [20, 16, 30], [36, 24, 18], [60, 18, 34], [78, 22, 24], [100, 16, 38], [116, 26, 22], [142, 14, 30], [212, 18, 32], [230, 24, 20], [254, 16, 36], [270, 30, 24]], AB_C.city, AB_C.lit2)}
        ${ab101(184, 152, 104, AB_C.glassd, AB_C.glassd2, AB_C.glassd3)}
        ${tvSh('<path d="M0 150c60-10 240-10 300 0v50H0z"/>', TV_C.leafd, 2)}
        ${tvTree(268, 186, 1.2, '#2f6650', TV_C.leafd)}${tvTree(214, 196, .9, TV_C.leafd, TV_C.leaf)}${tvTree(8, 170, .9, '#2f6650', TV_C.leafd)}
        ${tvSh('<path d="M32 200l10-30 34-12 42 10 16 32z"/>', TV_C.rock, 2.5)}${tvSh('<path d="M126 200l8-18 28-6 22 24z"/>', TV_C.rockd, 2)}<path d="M52 176l22-8M96 174l14 8" stroke="${TV_C.paper}" stroke-width="1.600" stroke-linecap="round" opacity=".35"/>`},
      {name: '起霧的早上', at: [26, 96, 24], svg: () => `<rect width="300" height="200" fill="${AB_C.mist}"/><rect width="300" height="70" fill="${AB_C.dawn2}"/><circle cx="58" cy="40" r="13" fill="${TV_C.paper}" opacity=".9"/>
        ${abBlocks(176, [[66, 22, 30], [200, 26, 40], [232, 20, 26], [258, 42, 34]], AB_C.steel2)}
        ${ab101(168, 186, 150, AB_C.glass, AB_C.glass2, AB_C.glass3)}
        <rect x="-10" y="96" width="320" height="26" rx="13" fill="${TV_C.paper}" opacity=".92"/><rect x="60" y="88" width="170" height="20" rx="10" fill="${TV_C.paper}" opacity=".85"/><rect x="110" y="114" width="200" height="22" rx="11" fill="${TV_C.paper}" opacity=".9"/>
        <rect x="-10" y="134" width="330" height="44" rx="20" fill="${TV_C.paper}" opacity=".78"/><rect x="-30" y="152" width="210" height="26" rx="13" fill="${TV_C.paper}" opacity=".7"/>
        ${tvCloud(196, 74, .7)}
        ${tvSh('<path d="M0 174c70-12 190-10 300 6v20H0z"/>', TV_C.leafl, 2)}${tvTree(270, 196, .9)}${tvPine(84, 190, .8)}${tvPine(108, 194, .6)}`},
    ],
    lines: {
      sloth: ['樓一節一節的，像一枝很大的竹子。我數到第五節，脖子就痠了。', '爬到山上看它。山上有大石頭，我坐著看到天黑。'],
      egg: ['一百零一層。我站在下面看就好，一層都不想爬。', '今天有霧，樓頂不見了。看不到也好，不用抬頭。'],
      dog: ['好高好高！我往後退了好多步，才看得到最上面！', '我爬上山了！從山上看，它比旁邊的樓高出一大截！'],
      moodeng: ['我問它有幾層，一百零一層。多那一層是故意的吧。', '霧把樓頂吃掉了！等一下，又吐出來了。'],
      nyanko: ['本大爺買了珍珠奶茶。珍珠要咬很久，這是在考驗本大爺。', '樓是藍綠色的，像一枝冰棒。本大爺只是說說，沒有餓。'],
      dino: ['我躲在山上的大石頭後面。它那麼高，還是看到我了。', '起霧的時候，連這麼高的樓都會躲起來。我學到了。'],
      snoopy: ['一節一節往上，像小說的章節。我的小說還在第一節。', '傍晚從山上看，天空是橘色的。我決定最後一章就在這裡。'],
      piggy: ['一共八節，每一節八層。上面寬下面窄，我一眼就看出來了。', '加上最上面那根尖尖的，五百零八公尺。有人說五百，差八公尺也是差。'],
    },
    duo: [
      ['piggy', 'moodeng', '一共八節，你數數看。', '我數到九！好啦，尖尖的那個不算。'],
      ['snoopy', 'dino', '霧這麼大，樓頂不見了。一定有祕密。', '是我叫霧來的。嘿嘿。'],
      ['nyanko', 'dog', '珍珠奶茶本大爺喝一杯就好。', '貓咪老師把我的珍珠也吸走了！'],
    ]},
  fuji: {name: '富士山', short: '富士山', country: '日本', city: '河口湖', fav: ['sloth', 'egg'],
    stamp: '<path d="M3 20C8 16 10 9 10.800 6h2.400C14 9 16 16 21 20z" fill="none" stroke="currentColor" stroke-width="1.600" stroke-linejoin="round"/><path d="M9.300 10.500l1.400 1.300 1.300-1.500 1.300 1.500 1.400-1.300" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linejoin="round"/>',
    sv: {sakuramark: {name: '櫻花書籤', unit: '一張', vb: [26, 44], w: 6, svg: () => `<path d="M13 8c-3-5 3-7 0-7" fill="none" stroke="${AB_C.pink2}" stroke-width="1.600" stroke-linecap="round"/>` + tvSh('<rect x="5" y="7" width="16" height="34" rx="2.500"/>', TV_C.paper, 1.4) + `<circle cx="13" cy="11.500" r="1.700" fill="${TV_C.sandd}"/>`
      + [[13, 22, 0], [9.500, 30, -30], [16.500, 32, 30]].map(([x, y, r]) => `<path d="M${x} ${y - 4}c3 1.500 3 5 0 7.500-3-2.500-3-6 0-7.500z" transform="rotate(${r} ${x} ${y})" fill="${AB_C.pink}"/><path d="M${x} ${y - 4}l.700 1.400-.700.400-.700-.400z" transform="rotate(${r} ${x} ${y})" fill="${TV_C.paper}"/>`).join('')}},
    cards: [
      {name: '清晨的倒影', at: [76, 97, 24], svg: () => `<rect width="300" height="200" fill="${AB_C.dawn2}"/><rect y="60" width="300" height="52" fill="${AB_C.dawn}"/>
        ${abFuji(158, 112, 112, 80, AB_C.fuji, AB_C.snow)}
        <rect y="112" width="300" height="88" fill="${AB_C.lake}"/><rect y="112" width="300" height="34" fill="${AB_C.dawn}" opacity=".5"/>
        <g transform="translate(0 224) scale(1 -1)" opacity=".5">${abFuji(158, 112, 112, 80, AB_C.fuji, AB_C.snow)}</g>
        <path d="M0 112v-5c10-4 22-3 30-1 12-5 26-4 36 0 14-4 30-4 42 1 10-3 22-3 30 0 16-5 34-4 46 1 12-4 26-4 36 0 14-4 30-3 40 0 12-3 26-3 40 0v9c-14-3-28-3-40 0-10-3-26-4-40 0-10-4-24-4-36 0-12-5-30-6-46-1-8-3-20-3-30 0-12-5-28-5-42-1-10-4-24-5-36 0-8-2-20-3-30 1z" fill="${AB_C.fuji2}"/>
        ${tvSh('<path d="M150 200c20-18 80-26 150-22v22z"/>', TV_C.leafl, 2)}
        <path d="M0 20c30 4 60 0 86 14 16 8 34 8 52 6M40 24c8 12 20 18 34 22M86 34c4-10 14-16 26-18" fill="none" stroke="${TV_C.wood2}" stroke-width="3.400" stroke-linecap="round"/>
        ${[[10, 18, 9], [34, 20, 10], [58, 26, 9], [84, 36, 10], [110, 40, 8], [136, 40, 7], [52, 38, 8], [74, 48, 7], [100, 20, 8], [114, 14, 6]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 3 ? AB_C.pink : AB_C.pinkl}"/><circle cx="${x + 1}" cy="${y + 1}" r="${r * .28}" fill="${AB_C.pink2}"/>`).join('')}
        ${abPetals([[150, 62, 20], [128, 78, 70], [168, 90, 120]])}`},
      {name: '櫻花和大橋', at: [58, 94, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/>${tvCloud(14, 30, .8)}${tvCloud(246, 22, .7)}
        ${abFuji(176, 106, 122, 74, AB_C.fuji, AB_C.snow)}
        ${tvSh('<path d="M0 108c30-12 60-12 90-2 20-8 40-8 60 0 40-10 100-10 150 2v6H0z"/>', TV_C.hill2, 1)}
        <rect y="108" width="300" height="40" fill="${TV_C.sea}"/><rect y="124" width="300" height="24" fill="${TV_C.seal}"/>
        ${Array.from({length: 11}, (_, i) => `<rect x="${i * 30 + 10}" y="120" width="3.400" height="9" fill="${AB_C.stone2}"/>`).join('')}${tvSh('<rect x="0" y="116.500" width="300" height="4.200"/>', TV_C.paper, 1)}<rect y="115" width="300" height="1.400" fill="${AB_C.stone2}"/>
        ${tvSh('<path d="M0 144c70-8 230-8 300 0v56H0z"/>', TV_C.leafl, 2)}${tvSh('<path d="M96 200c10-22 40-36 80-42l16 3c-34 8-52 20-60 39z"/>', TV_C.sand, 1)}
        ${abSakura(250, 176, 1.1)}${abSakura(196, 160, .8, AB_C.pink2, AB_C.pink)}${abSakura(40, 178, 1.3)}${abSakura(112, 158, .7, AB_C.pink2, AB_C.pink)}
        ${abPetals([[84, 150], [140, 172], [172, 190], [224, 186], [280, 192], [20, 192], [100, 188], [150, 140], [232, 134]])}`},
      {name: '晚上的櫻花', at: [50, 96, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.night}"/>${tvStars(16)}
        ${abFuji(160, 118, 124, 78, '#2a3358', '#5c6894')}
        ${tvSh('<path d="M0 118c40-8 90-8 130-2 50-8 120-8 170 2v10H0z"/>', '#232b4c', 1)}
        <rect y="124" width="300" height="30" fill="#27325a"/>${[[40, 136, 30], [110, 142, 22], [200, 138, 30], [266, 144, 22]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="3.200" fill="${AB_C.pinkl}" opacity=".22"/>`).join('')}
        <path d="M0 152c70-8 230-8 300 0v48H0z" fill="${TV_C.night3}"/>
        ${[[38, 176, 1.25], [118, 166, .8], [206, 168, .85], [270, 178, 1.2]].map(([x, y, k]) => `<circle cx="${x}" cy="${y - 34 * k}" r="${34 * k}" fill="${AB_C.pinkl}" opacity=".16"/>` + abSakura(x, y, k, AB_C.pinkl, '#ffffff')
          + `<rect x="${x + 12 * k}" y="${y - 5 * k}" width="${5 * k}" height="${5 * k}" rx="1" fill="${TV_C.glow}"/><ellipse cx="${x + 14.5 * k}" cy="${y}" rx="${12 * k}" ry="${3 * k}" fill="${TV_C.glow}" opacity=".25"/>`).join('')}
        ${abPetals([[80, 140], [150, 176], [176, 150], [240, 190], [96, 192]])}`},
    ],
    lines: {
      sloth: ['湖裡面也有一座山，倒過來的。我看了很久，分不出哪一座是真的。', '櫻花一片一片掉下來。掉得比我走路還慢。我喜歡。'],
      egg: ['躺在櫻花樹下，花瓣掉在我身上。不用動就有被子。', '山上有雪，看起來好冷。我在下面看就好。'],
      dog: ['湖裡有另一座山！我想跳下去找，被拉住了！', '花瓣一直掉！我接到三片！有一片黏在鼻子上！'],
      moodeng: ['山頂戴著白色的帽子。我也想要一頂。', '我在樹下跳了一下，花瓣全部掉下來。不是我弄的，是風。'],
      nyanko: ['櫻花不能吃。本大爺問過了。', '晚上櫻花會打燈，亮亮的。本大爺站在燈下面，也很好看。'],
      dino: ['我躲在櫻花樹後面。花瓣掉在我頭上，就被找到了。', '清晨湖面平平的，像鏡子。我做了鬼臉，湖裡的我也做了。'],
      snoopy: ['山和山的影子，上面一座，下面一座。我的小說需要這種開頭。', '橋那麼長，後面是山。我站在橋頭想了一句話，風太大，忘了。'],
      piggy: ['三千七百七十六公尺。山頂的雪到春天還在，我早就知道了。', '要看到湖裡的倒影，要清晨、不能有風。我算好時間才來的。'],
    },
    duo: [
      ['sloth', 'egg', '我們在櫻花樹下躺了一整天。', '花瓣把我們蓋起來了。很好，不用起來。'],
      ['dog', 'dino', '湖裡的山是假的！我丟了一顆石頭！', '山就皺起來了。嘿嘿，牠嚇了一跳。'],
      ['snoopy', 'piggy', '我想把這座山寫得再高一點。', '三千七百七十六公尺，一公尺都不能加。'],
    ]},
  paris: {name: '艾菲爾鐵塔', short: '鐵塔', country: '法國', city: '巴黎', fav: ['snoopy', 'dino'],
    stamp: '<path d="M5 21c3-2 5.500-9 6.400-17h1.200C13.500 12 16 19 19 21h-3.200c-.800-2-2.200-3-3.800-3s-3 1-3.800 3zM8.300 14.500h7.400M9.600 10h4.800" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round"/>',
    sv: {eiffelkey: {name: '鐵塔鑰匙圈', vb: [28, 46], w: 6, svg: () => `<circle cx="14" cy="7" r="5" fill="none" stroke="${AB_C.steel3}" stroke-width="2.200"/><path d="M14 12v5" stroke="${AB_C.steel3}" stroke-width="1.800" stroke-linecap="round" stroke-dasharray="1.600 1.400"/>`
      + tvSh('<path d="M4 44c4-3 7-12 8.500-26h3C17 32 20 41 24 44h-5.500c-.800-3-2.400-4.500-4.500-4.500S10.300 41 9.500 44z"/>', AB_C.iron, 1.2) + `<rect x="8" y="32.500" width="12" height="2" rx="1" fill="${AB_C.iron2}"/><rect x="10.200" y="25" width="7.600" height="1.800" rx=".9" fill="${AB_C.iron2}"/>`}},
    cards: [
      {name: '草地野餐', at: [30, 93, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/>${tvCloud(26, 48, .9)}${tvCloud(222, 30, .8)}
        ${abBlocks(130, [[0, 40, 16], [40, 30, 22], [230, 34, 20], [264, 36, 14]], AB_C.stone)}
        ${abEiffel(150, 130, 118)}
        ${tvSh('<path d="M0 128c80-4 220-4 300 0v72H0z"/>', TV_C.leaf, 2)}
        <path d="M118 130h64l112 70H6z" fill="${TV_C.leafl}"/><path d="M118 130L6 200h-6v-20zM182 130l112 70h6v-20z" fill="${TV_C.sand}"/>
        ${[[98, 134, .5], [84, 142, .65], [64, 153, .85], [36, 168, 1.1], [202, 134, .5], [216, 142, .65], [236, 153, .85], [264, 168, 1.1]].map(([x, y, k]) => abClip(x, y, k, TV_C.leafd)).join('')}
        ${tvSh('<path d="M40 170l76-6 24 26-92 8z"/>', TV_C.paper, 2)}<path d="M59 168.500l19-1.500 6 29-21 1.800zM97 165.500l19-1.500 24 26-21 1.700zM44 177l80-6.500 8.500 9-84 7z" fill="${TV_C.a1}" opacity=".55"/>
        ${tvSh('<path d="M112 170h24l-3 15h-18z"/>', '#c98a5a', 1.5)}<path d="M113 170c2-11 20-11 22 0" fill="none" stroke="${TV_C.wood2}" stroke-width="2"/><ellipse cx="96" cy="182" rx="7" ry="3.600" fill="${TV_C.sun}"/><ellipse cx="96" cy="181" rx="5" ry="2.200" fill="#f2b96a"/>`},
      {name: '河邊的石橋', at: [76, 97, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.sky2}"/><rect width="300" height="64" fill="${TV_C.sky}"/>${tvCloud(176, 36, .9)}${tvCloud(238, 70, .6)}
        ${abBlocks(112, [[150, 30, 16], [180, 40, 22], [220, 34, 14], [254, 46, 20]], AB_C.stone)}
        ${abEiffel(86, 112, 104)}
        ${tvSh('<path d="M0 104c30-8 60-8 90 0 30-6 60-6 80 0 40-8 90-8 130 0v10H0z"/>', TV_C.leaf, 1.5)}
        <rect y="132" width="300" height="68" fill="${TV_C.teal}"/><rect y="150" width="300" height="50" fill="${TV_C.teall}" opacity=".45"/>
        ${tvSh('<rect x="0" y="108" width="300" height="7"/>', AB_C.stone, 1.5)}<rect y="115" width="300" height="20" fill="${AB_C.stone2}"/>
        ${[8, 66, 124, 182, 240].map(x => `<path d="M${x} 136v-4a22 15 0 0 1 44 0v4z" fill="${TV_C.hill2}"/><path d="M${x + 4} 136a18 9 0 0 1 36 0z" fill="${TV_C.teal}"/><ellipse cx="${x + 22}" cy="146" rx="20" ry="5" fill="${AB_C.stone2}" opacity=".35"/>`).join('')}
        ${[0, 58, 116, 174, 232, 290].map(x => `<rect x="${x - 4}" y="113" width="10" height="24" rx="2" fill="${AB_C.stone3}"/>`).join('')}<rect y="106.500" width="300" height="2.400" fill="${AB_C.stone3}"/>
        ${tvSh('<path d="M0 184h300v16H0z"/>', AB_C.stone, 2)}<path d="M0 189h300" stroke="${AB_C.stone2}" stroke-width="1.400"/>${[30, 110, 190, 270].map(x => `<rect x="${x}" y="184" width="1.400" height="5" fill="${AB_C.stone2}"/>`).join('')}`},
      {name: '黃昏的鐵塔', at: [24, 96, 24], svg: () => `<rect width="300" height="200" fill="#f9d8ac"/><rect width="300" height="54" fill="${AB_C.dusk1}"/><rect y="54" width="300" height="50" fill="#f4b6a6"/>
        <circle cx="226" cy="140" r="20" fill="#fde9b8"/>${tvSh('<rect x="20" y="40" width="70" height="9" rx="4.500"/>', '#f7d6c4', 1)}${tvSh('<rect x="190" y="70" width="90" height="8" rx="4"/>', '#fbe3c8', 1)}
        ${abBlocks(166, [[0, 30, 26], [30, 24, 34], [54, 34, 22], [88, 22, 30], [190, 28, 24], [218, 20, 36], [238, 34, 26], [272, 28, 32]], '#7a5868')}
        ${[[36, 132], [100, 136], [226, 130], [282, 134]].map(([x, y]) => `<rect x="${x}" y="${y - 5}" width="4" height="6" fill="#7a5868"/>`).join('')}
        ${abEiffel(150, 166, 142, true)}
        ${tvSh('<path d="M0 164c70-8 230-8 300 0v36H0z"/>', '#5a4060', 2)}${tvTree(280, 194, 1, '#4a3352', '#5a4060')}${tvTree(84, 198, .8, '#4a3352', '#5a4060')}${tvTree(200, 198, .7, '#4a3352', '#5a4060')}`},
    ],
    lines: {
      sloth: ['鐵塔下面有好長的草地。我躺下來，從腳看到塔頂，看了一個下午。', '塔有四隻腳，站得很穩。我也想站得那麼穩，可是我比較想躺。'],
      egg: ['草地很好躺。塔很高，可是我是橫的，所以沒差。', '有三層可以上去。我選第零層。'],
      dog: ['好大的鐵塔！四隻腳！我在它的腳中間跑來跑去！', '草地好長！我從這頭跑到那頭，再跑回來！塔都沒有動！'],
      moodeng: ['它全身都是洞洞，風都吹得過去。這樣不冷嗎。', '我跳起來想摸第一層。差一點點。真的只差一點點。'],
      nyanko: ['本大爺在草地上野餐。麵包很好吃，塔只是剛好在後面。', '黃昏的時候塔變成暖暖的顏色。本大爺看了一下，只有一下。'],
      dino: ['我躲在塔的腳後面。腳是空的，一下就被看到了。', '河邊有一座石頭的橋。我躲在橋下面，聽到自己的回音。嘿嘿。'],
      snoopy: ['在鐵塔下面寫小說，每一句看起來都很厲害。回家再看就不一定了。', '黃昏的天空是粉橘色的。我寫了「天空很美」，然後就寫不下去了。'],
      piggy: ['連最上面的天線，大概三百三十公尺。全部是鐵做的。', '顏色是褐色，分三種深淺，下面最深、上面最淺。很少人注意到，我有。'],
    },
    duo: [
      ['nyanko', 'piggy', '野餐的麵包本大爺吃了三個。', '四個。草地上的屑屑我數過了。'],
      ['moodeng', 'dog', '我跳起來快要摸到第一層了！', '我在下面幫牠加油！加油了一百次！'],
      ['sloth', 'snoopy', '我看鐵塔看了一個下午。', '我在旁邊寫了一個下午。寫的都是牠看鐵塔。'],
    ]},
};

/* ---------- 放進旅行的資料表（js/traveldata.js 的那幾張）：tier 4 = 出國 ---------- */
Object.keys(TV_ABROAD).forEach(p => {
  const a = TV_ABROAD[p];
  TV_PLACES[p] = {name: a.name, short: a.short, country: a.country, city: a.city, stamp: a.stamp, tier: 4, abroad: 1, fav: a.fav, sv: Object.keys(a.sv), dir: `搭飛機去${a.country}`};
  TV_CARDS[p] = a.cards; TV_LINES[p] = a.lines; TV_DUO[p] = a.duo;
  Object.keys(a.sv).forEach(k => { const s = a.sv[k]; TV_SOUV[k] = {name: s.name, unit: s.unit || '一個', from: p, vb: s.vb, w: s.w, svg: s.svg}; FURN[tvSouvId(k)] = {room: 'tv', name: s.name, gift: 1, souv: 1, vb: s.vb, w: s.w, svg: s.svg}; });
});
TV_HOURS[4] = [48, 72];   // 一趟兩到三天
TV_TIER_NAME[4] = '出國';
// 機票：用一次（跟野餐籃一樣算個數）。放進背包，下一趟就是出國；再放野餐籃就是全家一起出國。一趟一張，不管幾隻
TV_GOODS.ticket = {slot: 'tool', once: 1, name: '機票', price: 60, tip: '下一趟出國，兩三天回來', ic: tvIc('<path d="M3 9h26v5a3 3 0 0 0 0 6v5H3v-5a3 3 0 0 0 0-6z" fill="#1b2140" opacity=".2" transform="translate(0 1.5)"/><path d="M3 9h26v5a3 3 0 0 0 0 6v5H3v-5a3 3 0 0 0 0-6z" fill="#fbf6ea"/><path d="M21 9v16" stroke="#d9c29c" stroke-width="1.400" stroke-dasharray="2 1.800"/><path d="M7 19.500l8-2.800 2.600-4 1.500.300-1.300 3.200 2.500-.900.700 1-2.600 1.800-9.400 3.200z" fill="#3f9aa5"/><rect x="23.500" y="13" width="3" height="8" rx="1" fill="#ff8a66"/>')};
TV_SLOTS[2][2] = '可以一起帶，籃子和機票用一次';
