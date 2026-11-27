/* 出國旅行。第一批（2026-11-27）：吉隆坡雙峰塔、台北101、富士山和河口湖、巴黎艾菲爾鐵塔。第二批（同一天）：曼谷鄭王廟、比薩斜塔、伊斯坦堡聖索菲亞、雷克雅維克哈爾格林姆教堂，說明在下面第二批的畫圖工具那一段。玩法在 js/travel.js，國內四個地方在 js/traveldata.js。
   畫的東西照「出國旅行_在地查證.md」裡標「確定」的：
   - 雙峰塔：兩座一樣高，天橋在塔身一半偏下，塔身一圈一圈、越往上越細，頂端細長尖塔上有一顆圓環的球。名稱寫「雙峰塔」。
   - 台北101：下面一段往上收，上面八節、每節上寬下窄往外斜，藍綠色，頂端尖塔。不畫煙火。
   - 富士山：春天，山頂有雪、櫻花；倒影那一張是清晨、湖面平。不畫船、不畫紅葉。
   - 艾菲爾鐵塔：褐色偏暖（下面深上面淺）、三道橫的平台、四隻腳往上收。只畫白天和黃昏沒亮燈的，不畫夜間燈光、不畫船。
   四個地方都不寫店名、不放品牌和人物。全部自己畫、自己寫。
   要多一個地方：在 TV_ABROAD 加一筆（名字、國家、愛去的娃娃、土產、三張明信片、每隻的話、兩隻的對話），其他地方不用改。
   這個檔要排在 js/traveldata.js 後面、js/main.js 前面載入（土產要先進家具表）。 */
const AB_C = {dusk1: '#b7a3cf', dusk2: '#eeb09a', dusk3: '#f7d3a6', steel: '#e6ecf2', steel2: '#b9c5d4', steel3: '#8794aa', lit: '#fffdf6', lit2: '#f1eadb', lit3: '#cdc3b0', win: '#f4d58a',
  glass: '#63b8ac', glass2: '#3f918c', glass3: '#b4e2d6', glassd: '#3a7f86', glassd2: '#2c6068', glassd3: '#8ec9c0',
  pink: '#f7c4d4', pink2: '#f09ab8', pinkl: '#fde6ee', snow: '#fbf8f2', fuji: '#7f93c4', fuji2: '#6076ad', dawn: '#f6dfe0', dawn2: '#cfdcf0', lake: '#b9cfe6', mist: '#eef2f6',
  iron: '#8a5f45', iron2: '#6e4a36', iron3: '#a87a58', irond: '#5c3a2a', irond2: '#8f5f44', stone: '#ded2bd', stone2: '#bfb198', stone3: '#9c8f78', city: '#5d6f9e', city2: '#6e80ad'};

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
  s += `<rect x="${x - w * .34}" y="${y1 - H * .018}" width="${w * .68}" height="${H * .036}" rx="1" fill="${pl}"/><rect x="${x - w * .2}" y="${y2 - H * .017}" width="${w * .4}" height="${H * .034}" rx="1" fill="${pl}"/><rect x="${x - w * .1}" y="${y3 - H * .016}" width="${w * .2}" height="${H * .032}" rx="1" fill="${pl}"/>`;
  return s + `<rect x="${x - w * .03}" y="${y3 - H * .06}" width="${w * .06}" height="${H * .05}" fill="${c3}"/><rect x="${x - Math.max(.6, w * .01)}" y="${y0 - H}" width="${Math.max(1.2, w * .02)}" height="${H * .11}" fill="${c3}"/>`;
}
// 修剪過的樹（公園裡一排一排的）
const abClip = (x, y, k = 1, c = TV_C.leaf) => `<rect x="${x - 1.6 * k}" y="${y - 12 * k}" width="${3.2 * k}" height="${12 * k}" fill="${TV_C.wood2}"/>` + tvSh(`<rect x="${x - 9 * k}" y="${y - 30 * k}" width="${18 * k}" height="${20 * k}" rx="${7 * k}"/>`, c, 1.6 * k);

/* ---------- 第二批（2026-11-27）的畫圖工具：鄭王廟、比薩斜塔、聖索菲亞、哈爾格林姆教堂 ----------
   照「出國旅行_在地查證.md」後半標「確定」的畫。三個是宗教建築：只畫外觀，不畫裡面、神像、人；娃娃站在地上或公園裡，不爬到建築上。
   這一批都不畫：船、極光、鬱金香、海鷗、貓；冰島地上不畫積雪（遠山的山頂有雪）。畫法、顏色的做法、明信片的版面跟第一批一樣。 */
Object.assign(AB_C, {prang: '#f7f3ea', prang2: '#dfd8cb', prang3: '#b5ac9c', gold: '#fff3cc', gold2: '#f4d98f', gold3: '#c9a45e', dawnp: '#f3c7c2', dawno: '#f9dab6', dawny: '#fdecd2', river: '#a9c4d8',
  marble: '#f8f6f1', marble2: '#e0ddd5', marble3: '#b1aea6', warm: '#fae4b4', warm2: '#ebc790', warm3: '#c39a74',
  rose: '#dca896', rose2: '#c68d7b', rose3: '#a46b5d', lead: '#aeb5be', lead2: '#8f97a3', brick: '#b9624c', brick2: '#95483a', sil: '#8a5564', sil2: '#6c4158',
  conc: '#f0f2f3', conc2: '#d7dce1', conc3: '#a7b0ba', road: '#b9bfca'});
// 鄭王廟的塔：下面寬、一層一層往上收、頂端是尖的。x 中心、y0 地面、H 整座高。遠看是白色偏淺灰。
// near：近看，塔身上有彩色瓷片拼的小花，中間是又窄又陡的階梯
function abPrang(x, y0, H, c, c2, c3, near){
  const W = H * .58, FL = [TV_C.a1, TV_C.teal, TV_C.sun, AB_C.pink2, TV_C.leaf, TV_C.sea], lw = Math.max(.8, H * .008);
  let s = '', y = y0, k = 0;
  const band = (w, h, sh) => { y -= h; const r = `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h + .5}"/>`;
    s += (sh ? tvSh(r, c2, 1.4) : r.replace('/>', ` fill="${c2}"/>`)) + `<rect x="${x - w * .3}" y="${y}" width="${w * .6}" height="${h + .5}" fill="${c}"/><rect x="${x - w / 2}" y="${y + h - lw}" width="${w}" height="${lw}" fill="${c3}" opacity=".6"/>`;
    if (near){ const n = Math.max(2, Math.round(w / 9)); for (let i = 0; i < n; i++){ const fx = x - w / 2 + (i + .5) * w / n, fy = y + h * .45; s += `<circle cx="${fx}" cy="${fy}" r="1.900" fill="${FL[(k + i) % FL.length]}"/><circle cx="${fx}" cy="${fy}" r=".700" fill="${TV_C.paper}"/>`; } k += 2; } };
  band(W, H * .06, true); band(W * .86, H * .06); band(W * .72, H * .06);   // 三層平台
  [[.6, .1], [.54, .09], [.48, .085], [.42, .08], [.37, .075], [.32, .07], [.28, .065]].forEach(([w, h]) => band(W * w, H * h));   // 塔身一段一段往上收
  const a = W * .13, th = H * .15;
  s += `<path d="M${x - a} ${y + .5}Q${x - a * .9} ${y - th * .55} ${x} ${y - th}Q${x + a * .9} ${y - th * .55} ${x + a} ${y + .5}z" fill="${c2}"/><path d="M${x - a * .45} ${y + .5}Q${x - a * .4} ${y - th * .5} ${x} ${y - th}Q${x + a * .4} ${y - th * .5} ${x + a * .45} ${y + .5}z" fill="${c}"/><rect x="${x - Math.max(.5, W * .012)}" y="${y0 - H}" width="${Math.max(1, W * .024)}" height="${H - (y0 - y) - th + 1}" fill="${c3}"/>`;
  const sw = W * .09, st = H * .42;
  s += `<path d="M${x - sw / 2} ${y0}L${x - sw * .3} ${y0 - st}h${sw * .6}L${x + sw / 2} ${y0}z" fill="${c3}" opacity="${near ? .75 : .5}"/>`;
  if (near) for (let yy = y0 - 3; yy > y0 - st; yy -= 3.4) s += `<rect x="${x - sw * .42}" y="${yy}" width="${sw * .84}" height=".800" fill="${TV_C.paper}" opacity=".7"/>`;
  return s;
}
// 隔著河看的整座廟：中間一座大塔，四個角各一座小塔（後面兩座小一點、顏色淡一點）
const abWat = (y0, H, c, c2, c3) => abPrang(150 - H * .38, y0 - 1, H * .4, c2, c2, c3) + abPrang(150 + H * .38, y0 - 1, H * .4, c2, c2, c3) + abPrang(150 - H * .68, y0, H * .46, c, c2, c3) + abPrang(150 + H * .68, y0, H * .46, c, c2, c3) + abPrang(150, y0, H, c, c2, c3);
// 比薩斜塔：圓柱形的鐘塔，八層。最下面一層是貼在牆上的拱，中間六層是一圈一圈鏤空的拱廊，最上面放鐘的那一層細一圈。
// x 底的中心、y0 地面、H 高、deg 歪幾度（實際大約 4 度，畫 5 度才看得出來）
function abPisa(x, y0, H, c, c2, c3, deg = 5){
  const W = H * .27, h0 = H * .19, g = H * .1, lw = Math.max(.7, H * .007), n0 = 5, b0 = W / n0, n = 7, bw = W * .96 / n;
  let s = tvSh(`<rect x="${x - W / 2}" y="${y0 - h0}" width="${W}" height="${h0}"/>`, c, 1.6);
  for (let i = 0; i < n0; i++){ const bx = x - W / 2 + i * b0 + b0 * .16, r = b0 * .34; s += `<path d="M${bx} ${y0 - 1}v${-h0 * .58}a${r} ${r} 0 0 1 ${r * 2} 0v${h0 * .58}z" fill="${c2}"/>`; }
  s += `<rect x="${x - W * .07}" y="${y0 - h0 * .42}" width="${W * .14}" height="${h0 * .42}" rx="${W * .05}" fill="${c3}"/>`;
  for (let i = 0; i < 6; i++){ const y = y0 - h0 - (i + 1) * g;
    s += `<rect x="${x - W * .48}" y="${y}" width="${W * .96}" height="${g + .4}" fill="${c}"/>`;
    for (let j = 0; j < n; j++){ const bx = x - W * .48 + j * bw + bw * .18, r = bw * .32; s += `<path d="M${bx} ${y + g}v${-g * .42}a${r} ${r} 0 0 1 ${r * 2} 0v${g * .42}z" fill="${c3}" opacity=".7"/>`; }
    s += `<rect x="${x - W / 2}" y="${y + g - lw * 1.6}" width="${W}" height="${lw * 1.6}" fill="${c2}"/>`; }
  const yt = y0 - h0 - 6 * g, bh = H * .13, tw = W * .76;
  s += `<rect x="${x - W / 2}" y="${yt - lw}" width="${W}" height="${lw * 2}" fill="${c2}"/><rect x="${x - tw / 2}" y="${yt - bh}" width="${tw}" height="${bh}" fill="${c}"/>`;
  for (let j = 0; j < 4; j++){ const b = tw / 4, bx = x - tw / 2 + j * b + b * .2, r = b * .3; s += `<path d="M${bx} ${yt - lw}v${-bh * .5}a${r} ${r} 0 0 1 ${r * 2} 0v${bh * .5}z" fill="${c3}" opacity=".75"/>`; }
  s += `<rect x="${x - tw * .53}" y="${yt - bh - lw * 1.4}" width="${tw * 1.06}" height="${lw * 2}" fill="${c2}"/>`;
  // 圓柱：一邊亮、一邊暗
  s += `<rect x="${x + W * .26}" y="${yt}" width="${W * .24}" height="${h0 + 6 * g}" fill="${c3}" opacity=".28"/><rect x="${x + tw * .26}" y="${yt - bh}" width="${tw * .24}" height="${bh}" fill="${c3}" opacity=".28"/>`;
  return `<g transform="rotate(${deg} ${x} ${y0})">${s}</g>`;
}
// 旁邊的大教堂：只畫成一棟白色的大建築，有一個圓頂，不畫細節。x 左邊、y0 地面、w 長
function abDuomo(x, y0, w, c, c2, c3){
  const h = w * .2;
  return `<rect x="${x + w * .63}" y="${y0 - h * 2.25}" width="${w * .14}" height="${h * .5}" fill="${c2}"/>` + tvSh(`<path d="M${x + w * .615} ${y0 - h * 2.22}a${w * .085} ${w * .1} 0 0 1 ${w * .17} 0z"/>`, c2, 1) + `<rect x="${x + w * .696}" y="${y0 - h * 2.22 - w * .135}" width="${Math.max(1, w * .008)}" height="${w * .04}" fill="${c3}"/>`
    + tvSh(`<rect x="${x + w * .02}" y="${y0 - h * 1.7}" width="${w * .86}" height="${h * 1.7}"/>`, c, 1.6) + `<rect x="${x + w * .02}" y="${y0 - h * 1.7}" width="${w * .86}" height="${h * .13}" fill="${c2}"/>`
    + `<rect x="${x + w * .6}" y="${y0 - h * 1.9}" width="${w * .2}" height="${h * 1.9}" fill="${c}"/><path d="M${x + w * .59} ${y0 - h * 1.88}L${x + w * .7} ${y0 - h * 2.12}L${x + w * .81} ${y0 - h * 1.88}z" fill="${c2}"/>`
    + `<rect x="${x + w * .88}" y="${y0 - h * 1.3}" width="${w * .12}" height="${h * 1.3}" rx="${w * .02}" fill="${c2}"/>`
    + tvSh(`<rect x="${x}" y="${y0 - h}" width="${w * .9}" height="${h}"/>`, c, 1.2) + `<rect x="${x}" y="${y0 - h}" width="${w * .9}" height="${h * .12}" fill="${c2}"/>`
    + `<path d="M${x} ${y0}V${y0 - h * 1.7}L${x + w * .07} ${y0 - h * 2.08}L${x + w * .14} ${y0 - h * 1.7}V${y0}z" fill="${c}"/><path d="M${x} ${y0 - h * 1.7}L${x + w * .07} ${y0 - h * 2.08}L${x + w * .14} ${y0 - h * 1.7}" fill="none" stroke="${c2}" stroke-width="${Math.max(1, w * .01)}"/>`
    + [.45, .85, 1.25].map(k => `<rect x="${x}" y="${y0 - h * k}" width="${w * .14}" height="${Math.max(.8, w * .006)}" fill="${c3}" opacity=".6"/>`).join('')
    + Array.from({length: 9}, (_, i) => `<rect x="${x + w * (.2 + i * .075)}" y="${y0 - h * .7}" width="${w * .018}" height="${h * .42}" rx="${w * .009}" fill="${c3}" opacity=".5"/>`).join('');
}
// 廣場外面的舊城牆：一道矮矮的牆，上面有一格一格的缺口
const abWall = (y, c, c2) => `<rect x="0" y="${y - 10}" width="300" height="12" fill="${c}"/>` + Array.from({length: 34}, (_, i) => `<rect x="${i * 9}" y="${y - 13}" width="5" height="3.500" fill="${c}"/>`).join('') + `<rect x="0" y="${y - 3}" width="300" height="1.200" fill="${c2}" opacity=".6"/>`;
// 聖索菲亞：中間一個很大的扁圓頂，下面的建築又寬又厚，外面是一塊一塊的扶壁；四個角各一座尖塔，高度不一樣，其中一座是紅磚砌的。
// x 中心、y0 地面、W 寬。flat：傍晚的剪影（暖色，兩個深淺）
function abSophia(x, y0, W, flat){
  const h = W * .2, P = flat ? {w: AB_C.sil, w2: AB_C.sil2, w3: AB_C.sil2, d: AB_C.sil2, d2: AB_C.sil2, m: AB_C.sil, m2: AB_C.sil2, br: AB_C.sil, br2: AB_C.sil2, cap: AB_C.sil2}
    : {w: AB_C.rose, w2: AB_C.rose2, w3: AB_C.rose3, d: AB_C.lead, d2: AB_C.lead2, m: AB_C.lit2, m2: AB_C.lit3, br: AB_C.brick, br2: AB_C.brick2, cap: AB_C.lead2};
  const tower = (mx, mh, brick) => { const mw = Math.max(2.2, W * .028), c = brick ? P.br : P.m, c2 = brick ? P.br2 : P.m2, top = y0 - mh * .84;
    return `<rect x="${mx - mw / 2}" y="${top}" width="${mw}" height="${mh * .84}" fill="${c}"/><rect x="${mx + mw * .12}" y="${top}" width="${mw * .38}" height="${mh * .84}" fill="${c2}" opacity=".6"/><rect x="${mx - mw * .95}" y="${y0 - mh * .62}" width="${mw * 1.9}" height="${Math.max(1.4, mw * .5)}" rx=".600" fill="${c2}"/><path d="M${mx - mw * .64} ${top + .4}L${mx} ${y0 - mh}L${mx + mw * .64} ${top + .4}z" fill="${P.cap}"/>`; };
  let s = tower(x - W * .36, W * .6) + tower(x + W * .35, W * .65);   // 後面兩座
  s += `<path d="M${x - W * .44} ${y0 - h * .95}a${W * .13} ${h * .62} 0 0 1 ${W * .26} 0z" fill="${P.d2}"/><path d="M${x + W * .18} ${y0 - h * .95}a${W * .13} ${h * .62} 0 0 1 ${W * .26} 0z" fill="${P.d2}"/>`;   // 兩邊的半圓頂
  s += tvSh(`<rect x="${x - W * .23}" y="${y0 - h * 1.78}" width="${W * .46}" height="${h * 1.78}"/>`, P.w, 1.6);
  s += `<path d="M${x - W * .17} ${y0 - h * .98}v${-h * .3}a${W * .17} ${h * .4} 0 0 1 ${W * .34} 0v${h * .3}z" fill="${P.w2}"/>`;
  if (!flat) s += Array.from({length: 7}, (_, i) => `<rect x="${x - W * .13 + i * W * .26 / 6 - W * .008}" y="${y0 - h * 1.26}" width="${W * .016}" height="${h * .14}" rx="${W * .008}" fill="${P.w3}"/>`).join('');
  s += `<rect x="${x - W * .2}" y="${y0 - h * 1.94}" width="${W * .4}" height="${h * .18}" fill="${P.w2}"/>`;
  if (!flat) s += Array.from({length: 11}, (_, i) => `<rect x="${x - W * .183 + i * W * .0352}" y="${y0 - h * 1.9}" width="${W * .014}" height="${h * .1}" fill="${P.w3}"/>`).join('');
  s += tvSh(`<path d="M${x - W * .2} ${y0 - h * 1.93}a${W * .2} ${h * .62} 0 0 1 ${W * .4} 0z"/>`, P.d, 1.2)
    + `<path d="M${x + W * .2} ${y0 - h * 1.93}a${W * .2} ${h * .62} 0 0 0 ${-W * .2} ${-h * .62}Q${x + W * .1} ${y0 - h * 2.3} ${x + W * .1} ${y0 - h * 1.93}z" fill="${P.d2}" opacity=".7"/><rect x="${x - Math.max(.5, W * .004)}" y="${y0 - h * 2.66}" width="${Math.max(1, W * .008)}" height="${h * .12}" fill="${P.d2}"/>`;
  s += tvSh(`<rect x="${x - W * .43}" y="${y0 - h}" width="${W * .86}" height="${h}"/>`, P.w, 1.6) + `<rect x="${x - W * .43}" y="${y0 - h}" width="${W * .86}" height="${h * .09}" fill="${P.w2}"/>`;
  if (!flat) s += [-.27, -.07, .25].map(k => `<rect x="${x + W * k}" y="${y0 - h * .66}" width="${W * .022}" height="${h * .3}" rx="${W * .011}" fill="${P.w3}"/><rect x="${x + W * (k + .04)}" y="${y0 - h * .66}" width="${W * .022}" height="${h * .3}" rx="${W * .011}" fill="${P.w3}"/>`).join('')
    + `<path d="M${x + W * .03} ${y0}v${-h * .34}a${W * .03} ${W * .03} 0 0 1 ${W * .06} 0v${h * .34}z" fill="${P.w3}"/>`;
  [-.38, -.2, .12, .3].forEach(k => { s += `<path d="M${x + W * k} ${y0}V${y0 - h * 1.22}l${W * .08} ${h * .16}V${y0}z" fill="${P.w2}"/>` + (flat ? '' : `<rect x="${x + W * k}" y="${y0 - h * .52}" width="${W * .08}" height="${h * .06}" fill="${P.w3}" opacity=".7"/>`); });   // 扶壁
  return s + tower(x - W * .5, W * .72) + tower(x + W * .5, W * .58, true);   // 前面兩座，右邊這座是紅磚的
}
// 公園中間的噴水池：圓形的水池加幾道水柱。lit：傍晚打了燈
const abFount = (x, y, rx, lit) => { const ry = rx * .27;
  return (lit ? `<ellipse cx="${x}" cy="${y - ry}" rx="${rx * 1.5}" ry="${rx * .95}" fill="${TV_C.glow}" opacity=".08"/><ellipse cx="${x}" cy="${y - ry}" rx="${rx * 1.05}" ry="${rx * .62}" fill="${TV_C.glow}" opacity=".1"/>` : '')
    + tvSh(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`, lit ? '#8f7389' : AB_C.stone, 2) + `<ellipse cx="${x}" cy="${y - ry * .12}" rx="${rx * .86}" ry="${ry * .72}" fill="${lit ? AB_C.gold2 : TV_C.teal}"/><ellipse cx="${x - rx * .1}" cy="${y - ry * .2}" rx="${rx * .6}" ry="${ry * .4}" fill="${lit ? TV_C.glow : TV_C.teall}" opacity=".6"/>`
    + [[-.5, .7], [-.25, 1.05], [0, 1.5], [.25, 1.05], [.5, .7]].map(([k, hh]) => { const jx = x + rx * k, jh = rx * .5 * hh; return `<path d="M${jx} ${y - ry * .1}q${-rx * .09} ${-jh * .8} 0 ${-jh}q${rx * .09} ${jh * .2} 0 ${jh}z" fill="${lit ? TV_C.glow : TV_C.paper}" opacity=".92"/><ellipse cx="${jx}" cy="${y - ry * .1}" rx="${rx * .1}" ry="${ry * .14}" fill="${lit ? TV_C.glow : TV_C.paper}" opacity=".7"/>`; }).join('');
};
// 公園的長椅：x 中心、y 椅面、w 寬
const abBench = (x, y, w) => [-.42, .42].map(k => `<rect x="${x + w * k - 2}" y="${y - 23}" width="4" height="40" rx="1.500" fill="${TV_C.ink}" opacity=".7"/>`).join('')
  + tvSh(`<rect x="${x - w / 2}" y="${y - 25}" width="${w}" height="7" rx="2"/>`, TV_C.wood, 1.4) + tvSh(`<rect x="${x - w / 2}" y="${y - 14}" width="${w}" height="7" rx="2"/>`, TV_C.wood, 1.4)
  + tvSh(`<rect x="${x - w / 2 - 3}" y="${y}" width="${w + 6}" height="6" rx="2"/>`, '#a06c52', 1.6);
// 哈爾格林姆教堂：中間一座很高的塔，左右兩邊是一根一根直的柱子，從外面往中間越來越高，整個正面像一座往上收的山。x 中心、y0 地面、H 高
function abHallgrim(x, y0, H, c, c2, c3){
  const tw = H * .15, n = 10, cw = H * .031, lw = Math.max(.8, H * .008);
  let s = '';
  for (let i = n; i >= 1; i--){ const hc = H * (.09 + .5 * Math.pow(1 - i / (n + .6), 1.45));
    [-1, 1].forEach(d => { const cx = x + d * (tw / 2 + (i - .5) * cw); s += `<rect x="${cx - cw / 2}" y="${y0 - hc}" width="${cw + .3}" height="${hc}" fill="${i % 2 ? c : c2}"/><rect x="${cx - cw / 2}" y="${y0 - hc}" width="${cw + .3}" height="${lw}" fill="${c3}" opacity=".5"/>`; }); }
  s += tvSh(`<path d="M${x - tw / 2} ${y0}V${y0 - H * .72}h${tw * .1}V${y0 - H * .82}h${tw * .12}V${y0 - H * .89}L${x} ${y0 - H}L${x + tw * .28} ${y0 - H * .89}V${y0 - H * .82}h${tw * .12}V${y0 - H * .72}h${tw * .1}V${y0}z"/>`, c, 1.6);
  s += `<rect x="${x + tw * .2}" y="${y0 - H * .72}" width="${tw * .3}" height="${H * .72}" fill="${c2}" opacity=".7"/><rect x="${x + tw * .14}" y="${y0 - H * .82}" width="${tw * .26}" height="${H * .1}" fill="${c2}" opacity=".7"/>`
    + [-.22, 0, .22].map(k => `<rect x="${x + tw * k - tw * .05}" y="${y0 - H * .805}" width="${tw * .1}" height="${H * .06}" rx="${tw * .03}" fill="${c3}"/>`).join('')
    + `<circle cx="${x}" cy="${y0 - H * .665}" r="${tw * .19}" fill="${c3}"/><circle cx="${x}" cy="${y0 - H * .665}" r="${tw * .135}" fill="${TV_C.paper}"/>`   // 小圓鐘
    + `<rect x="${x - tw * .06}" y="${y0 - H * .58}" width="${tw * .12}" height="${H * .36}" rx="${tw * .06}" fill="${c3}" opacity=".85"/>`
    + `<path d="M${x - tw * .2} ${y0}v${-H * .07}a${tw * .2} ${tw * .2} 0 0 1 ${tw * .4} 0v${H * .07}z" fill="${c3}"/>`;
  return s;
}
// 街上的小房子：彩色的牆、斜屋頂
const abHouse = (x, y, w, h, wall, roof) => tvSh(`<path d="M${x} ${y}V${y - h}L${x + w / 2} ${y - h - w * .32}L${x + w} ${y - h}V${y}z"/>`, wall, 1.4)
  + `<path d="M${x - w * .06} ${y - h + 1}L${x + w / 2} ${y - h - w * .37}L${x + w * 1.06} ${y - h + 1}h${-w * .08}L${x + w / 2} ${y - h - w * .26}L${x + w * .02} ${y - h + 1}z" fill="${roof}"/>`
  + [.2, .6].map(k => `<rect x="${x + w * k}" y="${y - h * .74}" width="${w * .2}" height="${h * .32}" fill="${TV_C.paper}"/><rect x="${x + w * k}" y="${y - h * .74}" width="${w * .2}" height="${h * .32}" fill="${TV_C.sky}" opacity=".5"/>`).join('');
// 從高的地方看下去的小房子：只看到彩色的屋頂和一點點牆
const abTop = (x, y, w, col) => `<rect x="${x}" y="${y}" width="${w * .8}" height="${w * .24}" fill="${TV_C.paper}"/><path d="M${x + w * .8} ${y}l${w * .2} ${-w * .26}v${w * .24}l${-w * .2} ${w * .26}z" fill="${AB_C.stone2}"/>`
  + tvSh(`<path d="M${x} ${y}l${w * .2} ${-w * .3}h${w * .8}l${-w * .2} ${w * .3}z"/>`, col, 1) + `<path d="M${x + w * .1} ${y - w * .15}h${w * .8}" stroke="${TV_C.paper}" stroke-width=".800" opacity=".45"/>`;

/* ---------- 八個地方（第一批四個、第二批四個） ----------
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
        <ellipse cx="150" cy="96" rx="92" ry="80" fill="#fff6e4" opacity=".3"/>
        ${abBlocks(172, [[0, 26, 34], [26, 20, 50], [48, 28, 30], [76, 16, 40], [206, 20, 44], [226, 26, 28], [254, 22, 52], [276, 24, 36]], AB_C.city, AB_C.win)}
        ${abTwin(120, 172, 92, 27, AB_C.lit, AB_C.lit2, AB_C.lit3)}${abTwin(180, 172, 92, 27, AB_C.lit, AB_C.lit2, AB_C.lit3)}${abBridge(120, 180, 172, 92, 27, AB_C.lit, AB_C.lit3)}
        ${tvSh('<path d="M92 174c0-16 116-16 116 0z"/>', AB_C.city2, 1.5)}
        ${tvSh('<path d="M0 172c70-10 230-10 300 0v28H0z"/>', TV_C.night3, 2)}
        ${tvTree(26, 190, 1, TV_C.night2, TV_C.night3)}${abPalm(70, 190, .9, TV_C.night2)}${abPalm(198, 192, 1, TV_C.night2)}${tvTree(286, 192, .9, TV_C.night2, TV_C.night3)}`},
      {name: '從下面往上看', at: [16, 98, 19], svg: () => {
        const tower = m => { const X = v => (m ? 300 - v : v); let s = `<path d="M${X(8)} 200L${X(124)} 30L${X(133)} 30L${X(114)} 200z" fill="${AB_C.steel2}"/><path d="M${X(40)} 200L${X(126.500)} 30L${X(130.500)} 30L${X(84)} 200z" fill="${AB_C.steel}"/>`;
          for (let i = 1; i < 17; i++){ const t = i / 17, y = 200 - 170 * t, a = 8 + 116 * t, b = 114 + 19 * t; s += `<path d="M${X(a)} ${y}Q${X((a + b) / 2)} ${y - 7 * (1 - t)} ${X(b)} ${y}" fill="none" stroke="${AB_C.steel3}" stroke-width="${.6 + 1.3 * (1 - t)}" opacity=".6"/>`; }
          return s + `<path d="M${X(125)} 30L${X(127.500)} 19L${X(131)} 19L${X(132)} 30z" fill="${AB_C.steel2}"/><path d="M${X(128.200)} 19L${X(130)} 5L${X(130.800)} 19z" fill="${AB_C.steel}"/><circle cx="${X(129.700)}" cy="13" r="1.700" fill="${AB_C.steel}"/>`; };
        return `<rect width="300" height="200" fill="${TV_C.sky2}"/><rect width="300" height="110" fill="${TV_C.sky}"/>${tvCloud(132, 70, .8)}${tvCloud(20, 34, .6)}${tvCloud(238, 44, .6)}
        ${tower(false)}${tower(true)}
        <path d="M122 128L150 104.500L178 128" fill="none" stroke="${AB_C.steel3}" stroke-width="2.600" stroke-linecap="round"/>${tvSh('<rect x="124.500" y="95" width="51" height="9.500"/>', AB_C.steel, 1.5)}<rect x="124.500" y="99.300" width="51" height="1" fill="${AB_C.steel3}"/>
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
        ${abBlocks(152, [[0, 20, 20], [20, 16, 30], [36, 24, 18], [60, 18, 34], [78, 22, 24], [100, 16, 38], [116, 26, 22], [142, 14, 30], [212, 18, 32], [230, 24, 20], [254, 16, 36], [270, 30, 24]], AB_C.city, AB_C.win)}
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
        ${tvSh('<path d="M0 174c70-12 190-10 300 6v20H0z"/>', TV_C.leafl, 2)}${tvTree(270, 196, .9)}${tvTree(86, 196, .8, TV_C.leafd, TV_C.leaf)}${tvTree(118, 198, .55)}`},
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
  /* ----- 第二批 ----- */
  bangkok: {name: '鄭王廟', short: '鄭王廟', country: '泰國', city: '曼谷', fav: ['moodeng'],
    stamp: '<path d="M12 2.500l1.300 4 .900 5.500 2.300 2v7h-9v-7l2.300-2 .900-5.500zM4.500 21v-5l1.200-3 1.200 3M17.100 16l1.200-3 1.200 3v5M3 21h18" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round" stroke-linecap="round"/>',
    sv: {flowermag: {name: '瓷片小花磁鐵', vb: [36, 36], w: 6, svg: () => tvSh('<circle cx="18" cy="18" r="16"/>', TV_C.paper, 1.2) + `<circle cx="18" cy="18" r="14" fill="none" stroke="${AB_C.prang2}" stroke-width="1"/>`
      + [TV_C.a1, TV_C.teal, TV_C.sun, AB_C.pink2, TV_C.leaf, TV_C.sea].map((c, i) => `<g transform="rotate(${i * 60} 18 18)"><ellipse cx="18" cy="9.800" rx="4.100" ry="5.800" fill="${c}"/><path d="M14.600 10.500l6.800-1.600" stroke="${TV_C.paper}" stroke-width=".800"/></g>`).join('')
      + `<circle cx="18" cy="18" r="4.300" fill="${TV_C.sun}"/><circle cx="18" cy="18" r="1.900" fill="${TV_C.a1d}"/>`}},
    cards: [
      {name: '清晨的對岸', at: [22, 97, 24], svg: () => { const wat = abWat(122, 100, AB_C.prang, AB_C.prang2, AB_C.prang3);
        return `<rect width="300" height="200" fill="${AB_C.dawny}"/><rect width="300" height="52" fill="${AB_C.dawnp}"/><rect y="52" width="300" height="40" fill="${AB_C.dawno}"/>
        <circle cx="240" cy="104" r="15" fill="#fff6dc"/>${tvSh('<rect x="26" y="34" width="72" height="8" rx="4"/>', '#f9dcd2', 1)}${tvSh('<rect x="196" y="60" width="84" height="7" rx="3.500"/>', '#fde8d0', 1)}
        ${[[18, .5], [44, .42], [226, .4], [256, .5], [284, .44]].map(([x, k]) => tvTree(x, 124, k, '#5f9480', '#86b39c')).join('')}
        ${tvSh('<rect x="72" y="115" width="156" height="8" rx="1"/>', AB_C.prang2, 1)}${wat}
        ${tvSh('<path d="M0 121c60-3 240-3 300 0v6H0z"/>', '#7ba58f', 1)}
        <rect y="126" width="300" height="74" fill="${AB_C.river}"/><rect y="126" width="300" height="30" fill="${AB_C.dawno}" opacity=".55"/>
        <g transform="translate(0 250) scale(1 -1)" opacity=".3">${wat}</g>
        ${[[60, 140, 44], [190, 150, 60], [110, 164, 70], [236, 172, 40]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="2" rx="1" fill="${TV_C.paper}" opacity=".45"/>`).join('')}
        ${tvSh('<path d="M0 186c80-8 220-8 300 0v14H0z"/>', AB_C.stone, 2)}`; }},
      {name: '站在塔下面', at: [67, 97, 23], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/><rect y="120" width="300" height="80" fill="${TV_C.sky2}"/>${tvCloud(4, 44, .8)}${tvCloud(210, 26, .9)}${tvCloud(236, 96, .6)}
        ${abPrang(20, 184, 84, AB_C.prang, AB_C.prang2, AB_C.prang3, true)}${abPrang(268, 184, 84, AB_C.prang, AB_C.prang2, AB_C.prang3, true)}
        ${abPrang(112, 186, 178, AB_C.prang, AB_C.prang2, AB_C.prang3, true)}
        ${tvSh('<path d="M0 184c80-5 220-5 300 0v16H0z"/>', AB_C.stone, 1.5)}<path d="M0 191h300" stroke="${AB_C.stone2}" stroke-width="1.200"/>`},
      {name: '晚上打了燈', at: [78, 97, 24], svg: () => { const wat = abWat(120, 104, AB_C.gold, AB_C.gold2, AB_C.gold3);
        return `<rect width="300" height="200" fill="${TV_C.night}"/>${tvStars(14)}<ellipse cx="150" cy="88" rx="124" ry="78" fill="${TV_C.glow}" opacity=".06"/><ellipse cx="150" cy="92" rx="92" ry="58" fill="${TV_C.glow}" opacity=".07"/>
        ${[[20, .5], [48, .4], [250, .42], [280, .5]].map(([x, k]) => tvTree(x, 122, k, '#232b4c', TV_C.night2)).join('')}
        ${tvSh('<rect x="70" y="113" width="160" height="8" rx="1"/>', AB_C.gold3, 1)}${wat}
        <path d="M0 119c60-3 240-3 300 0v7H0z" fill="#232b4c"/>
        <rect y="124" width="300" height="76" fill="#27325a"/>
        <g transform="translate(0 246) scale(1 -1)" opacity=".26">${wat}</g>
        ${[[150, 138, 40], [150, 150, 54], [146, 164, 36], [156, 176, 26], [88, 144, 18], [212, 146, 18]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="2.400" fill="${AB_C.gold2}" opacity=".3"/>`).join('')}
        <path d="M0 186c80-8 220-8 300 0v14H0z" fill="${TV_C.night3}"/>`; }},
    ],
    lines: {
      sloth: ['隔著河看塔。太陽慢慢爬上來，塔一點一點亮起來。我跟它差不多慢。', '遠遠看是白色的。走到很近，才看到上面有一朵一朵的小花。我走了很久才看到。'],
      egg: ['階梯好陡。我看了一眼，決定待在下面。', '這裡整年都是夏天。我找到一塊有影子的地方，就不動了。'],
      dog: ['一座大的！四座小的！我繞著跑了一圈，五座都看到了！', '塔上面有好多小花，太陽一照亮亮的！我一直看一直看！'],
      moodeng: ['塔在河的另一邊！我想跳過去，河太寬了。', '大塔旁邊有四座小塔，一個角一座。那我要當第五座。'],
      nyanko: ['花是用碎掉的瓷片拼的。本大爺以前打破的碗，早知道留著。', '晚上塔打了燈，從對岸看很亮。本大爺多看了兩眼，就兩眼。'],
      dino: ['我躲在小塔後面。小塔有四座，牠們找了三座才找到我。嘿嘿。', '清晨第一道太陽先照到塔，再照到我。我本來躲得好好的。'],
      snoopy: ['它的名字有黎明的意思。我的小說第一句就寫清晨，寫完又睡著了。', '越往上越細，最上面是尖的。我的故事也要這樣收尾。'],
      piggy: ['一座大塔，四個角各一座小塔，一共五座。我數過了，沒有錯。', '塔上的花是瓷片和貝殼拼的。遠看是白的，近看是彩色的，這個要走近才知道。'],
    },
    duo: [
      ['moodeng', 'sloth', '我們隔著河看塔，我跳了一百下！', '我數到第七下，太陽就出來了。'],
      ['piggy', 'dog', '階梯很陡，在下面看就好。', '我在下面跑了五圈！五座塔一座一圈！'],
      ['nyanko', 'dino', '晚上塔會打燈，本大爺要坐最前面。', '我躲在牠後面。燈很亮，牠的影子把我遮住了。嘿嘿。'],
    ]},
  pisa: {name: '比薩斜塔', short: '斜塔', country: '義大利', city: '比薩', fav: ['dino'],
    stamp: '<g transform="rotate(7 12 21)"><path d="M8.300 21V7h7.400v14zM8.300 11h7.400M8.300 14.500h7.400M8.300 18h7.400M9.600 7V4h4.800v3" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round"/></g><path d="M4 21h17" stroke="currentColor" stroke-width="1.500" stroke-linecap="round"/>',
    sv: {pisatoy: {name: '歪歪的小塔', vb: [34, 46], w: 7, svg: () => tvSh('<rect x="4" y="39" width="26" height="5" rx="2.200"/>', TV_C.wood, 1)
      + `<g transform="rotate(8 16 39)">` + tvSh('<rect x="10" y="10" width="12" height="29" rx="1"/>', AB_C.marble, 1.2) + [14, 19, 24, 29, 34].map(y => `<rect x="10" y="${y}" width="12" height="1" fill="${AB_C.marble3}"/>` + [11.200, 14.100, 17, 19.900].map(x => `<rect x="${x}" y="${y - 3.4}" width="1.500" height="3.400" rx=".700" fill="${AB_C.marble3}" opacity=".8"/>`).join('')).join('')
      + `<rect x="11.500" y="5" width="9" height="5" fill="${AB_C.marble2}"/><rect x="10.800" y="4.300" width="10.400" height="1.200" fill="${AB_C.marble3}"/><rect x="19" y="10" width="3" height="29" fill="${AB_C.marble3}" opacity=".3"/></g>`}},
    cards: [
      {name: '草地看過去', at: [20, 96, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/>${tvCloud(20, 36, .9)}${tvCloud(132, 16, .7)}<circle cx="270" cy="28" r="13" fill="${TV_C.sun}"/>
        ${abWall(116, AB_C.stone2, AB_C.stone3)}
        ${abPisa(232, 124, 102, AB_C.marble, AB_C.marble2, AB_C.marble3)}${abDuomo(34, 124, 162, AB_C.marble, AB_C.marble2, AB_C.marble3)}
        ${tvSh('<path d="M0 122c80-3 220-3 300 0v78H0z"/>', TV_C.leaf, 2)}
        ${[[-60, 40], [90, 150], [200, 250], [310, 400]].map(([a, b]) => `<path d="M${150 + (a - 150) * .3} 124L${150 + (b - 150) * .3} 124L${b} 200L${a} 200z" fill="${TV_C.leafl}" opacity=".45"/>`).join('')}
        <path d="M178 124h9l70 76h-44z" fill="${TV_C.sand}"/>`},
      {name: '伸手扶一下', at: [74, 97, 26], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/><rect y="110" width="300" height="60" fill="${TV_C.sky2}"/>${tvCloud(182, 30, .9)}${tvCloud(20, 58, .7)}
        ${abWall(162, AB_C.stone2, AB_C.stone3)}${abDuomo(-74, 168, 150, AB_C.marble, AB_C.marble2, AB_C.marble3)}
        ${abPisa(122, 170, 156, AB_C.marble, AB_C.marble2, AB_C.marble3, 6)}
        ${tvSh('<path d="M0 166c80-4 220-4 300 0v34H0z"/>', TV_C.leaf, 2)}<path d="M0 178c90-4 210-4 300 0v8c-90-4-210-4-300 0z" fill="${TV_C.leafl}" opacity=".5"/>`},
      {name: '傍晚的斜塔', at: [24, 96, 24], svg: () => `<rect width="300" height="200" fill="${AB_C.dusk3}"/><rect width="300" height="54" fill="${AB_C.dusk1}"/><rect y="54" width="300" height="46" fill="${AB_C.dusk2}"/>
        <circle cx="38" cy="112" r="16" fill="#fde9b8"/>${tvSh('<rect x="150" y="38" width="80" height="8" rx="4"/>', '#f7d6c4', 1)}${tvSh('<rect x="40" y="66" width="70" height="7" rx="3.500"/>', '#fbe3c8', 1)}
        ${abWall(122, '#8f7180', '#7a5868')}
        ${abDuomo(44, 128, 150, '#f3d9c4', '#ddb9a8', '#b48c84')}${abPisa(230, 128, 108, AB_C.warm, AB_C.warm2, AB_C.warm3)}
        ${tvSh('<path d="M0 126c80-3 220-3 300 0v74H0z"/>', TV_C.leafd, 2)}
        <path d="M216 128h29l55 26v14z" fill="#1b2140" opacity=".16"/><path d="M0 150c90-5 210-5 300 0v10c-90-5-210-5-300 0z" fill="${TV_C.leaf}" opacity=".5"/>`},
    ],
    lines: {
      sloth: ['塔是歪的。我歪著頭看，它就直了。這樣看了一個下午。', '草地很平，很大一片。我躺下來，塔看起來更歪了。'],
      egg: ['它歪歪的也沒有倒。我躺著也沒有怎樣。我們差不多。', '草地是綠的，修得很平。很好躺，我不走了。'],
      dog: ['塔歪了！我跑過去想把它推回來！推不動！', '好大一片草地！我從這邊跑到那邊，回頭看，塔還是歪的！'],
      moodeng: ['我學它歪歪地站，站了三秒就倒了。它站了好久好久。', '一共八層，我跳一下數一層。最上面那層比較細，是放鐘的。'],
      nyanko: ['本大爺伸手扶了一下。塔沒有倒，這是本大爺的功勞。', '旁邊的大教堂比塔還大，大家卻只看塔。本大爺懂那種心情。'],
      dino: ['歪歪的塔！好奇怪！我最喜歡奇怪的東西了。嘿嘿。', '我躲在塔後面，身體也跟著歪一邊，這樣就看不到我了。'],
      snoopy: ['一座歪了很久的塔。我的小說主角也要有一個這樣的毛病。', '傍晚塔的一邊被照成暖黃色。我寫下來了，字也寫歪了。'],
      piggy: ['大概歪四度，高五十六公尺左右。我站在旁邊，用看的就知道。', '白色大理石，一共八層。它其實是旁邊那座大教堂的鐘樓，很多人不知道。'],
    },
    duo: [
      ['dino', 'dog', '塔歪歪的，一定藏著祕密。', '我幫牠聞了一圈！只有草的味道！'],
      ['nyanko', 'piggy', '本大爺一隻手就把塔扶住了。', '你的手離塔還有很遠。我站在旁邊都看到了。'],
      ['sloth', 'egg', '我們在草地上躺著看塔。', '躺著看，它就不歪了。是我們歪了。'],
    ]},
  istanbul: {name: '聖索菲亞', short: '聖索菲亞', country: '土耳其', city: '伊斯坦堡', fav: ['sloth', 'nyanko'],
    stamp: '<path d="M4 21V6.500L4.800 4l.800 2.500V21M18.400 21V6.500l.800-2.500.800 2.500V21M7.500 21v-6h9v6M8 15a4 4.200 0 0 1 8 0M3 21h18" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round" stroke-linecap="round"/>',
    sv: {glasslamp: {name: '彩色玻璃小燈', unit: '一盞', vb: [30, 46], w: 6, svg: () => `<circle cx="15" cy="4.500" r="3" fill="none" stroke="${AB_C.gold3}" stroke-width="1.800"/><rect x="14.200" y="7" width="1.600" height="5" fill="${AB_C.gold3}"/>`
      + tvSh('<path d="M9.500 15c0-4 11-4 11 0z"/>', AB_C.gold3, 1) + tvSh('<circle cx="15" cy="26" r="11.500"/>', TV_C.teal, 1.4)
      + [[15, 18, TV_C.sun], [9.500, 21.500, TV_C.a1], [20.500, 21.500, AB_C.pink2], [15, 25.500, TV_C.paper], [7.500, 27.500, TV_C.sun], [22.500, 27.500, TV_C.a1], [11, 31.500, AB_C.pink2], [19, 31.500, TV_C.sun], [15, 34.500, TV_C.a1]].map(([x, y, c]) => `<path d="M${x} ${y - 3}l2.600 3-2.600 3-2.600-3z" fill="${c}"/>`).join('')
      + tvSh('<path d="M11 37h8l-1.500 5h-5z"/>', AB_C.gold3, 1) + `<circle cx="15" cy="43.500" r="1.600" fill="${AB_C.gold3}"/>`}},
    cards: [
      {name: '公園的噴水池', at: [16, 97, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/>${tvCloud(10, 26, .8)}${tvCloud(228, 16, .8)}
        ${abSophia(150, 130, 178)}
        ${tvSh('<path d="M0 128c80-4 220-4 300 0v72H0z"/>', TV_C.leafl, 2)}
        ${tvTree(20, 152, .9, TV_C.leafd, TV_C.leaf)}${tvTree(280, 152, .95)}${tvTree(50, 138, .45)}${tvTree(252, 138, .45, TV_C.leafd, TV_C.leaf)}
        <ellipse cx="150" cy="174" rx="96" ry="26" fill="${TV_C.sand}"/><path d="M118 196h64l14 4h-92z" fill="${TV_C.sand}"/>
        ${abFount(150, 172, 56)}`},
      {name: '公園的長椅', at: [66, 91, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/>${tvCloud(206, 24, .9)}${tvCloud(250, 70, .6)}
        ${abSophia(112, 118, 164)}
        ${tvSh('<path d="M0 116c80-4 220-4 300 0v84H0z"/>', TV_C.leafl, 2)}
        ${tvTree(236, 140, .9)}${tvTree(284, 152, 1.1, TV_C.leafd, TV_C.leaf)}${tvTree(8, 146, .8, TV_C.leafd, TV_C.leaf)}
        <path d="M0 170c80-6 220-6 300 0v30H0z" fill="${TV_C.sand}"/>
        ${abBench(198, 176, 168)}`},
      {name: '傍晚的噴水池', at: [83, 97, 24], svg: () => `<rect width="300" height="200" fill="#f6c796"/><rect width="300" height="54" fill="#9483bd"/><rect y="54" width="300" height="44" fill="#e99d8c"/>
        ${tvSh('<rect x="18" y="30" width="76" height="8" rx="4"/>', '#b7a3cf', 1)}${tvSh('<rect x="204" y="70" width="80" height="7" rx="3.500"/>', '#f4b6a6', 1)}
        ${abSophia(150, 132, 182, true)}
        ${tvSh('<path d="M0 130c80-4 220-4 300 0v70H0z"/>', '#5a4060', 2)}
        ${tvTree(20, 154, .9, '#4a3352', '#5a4060')}${tvTree(280, 154, .95, '#4a3352', '#5a4060')}${tvTree(52, 140, .45, '#4a3352', '#5a4060')}
        <ellipse cx="150" cy="176" rx="96" ry="24" fill="#6d5373"/>
        ${abFount(150, 174, 56, true)}`},
    ],
    lines: {
      sloth: ['公園有長椅。我坐下來看大圓頂，看到噴水池的燈都亮了。', '四座尖塔不一樣高。我一座一座慢慢比，比到第三座，天就黑了。'],
      egg: ['有長椅。很好。今天的行程就是這張長椅。', '圓頂好大，扁扁的。跟我有點像，我看了很安心。'],
      dog: ['噴水池！水一直往上噴！我繞著跑了好多圈！', '四個角各有一座尖尖的塔！有一座是紅色的磚頭！我發現的！'],
      moodeng: ['噴水池的水跳得比我高。我不服氣，又跳了十下。', '外面的牆一塊一塊的，好厚。我在旁邊跳，它動都不動。'],
      nyanko: ['本大爺在公園慢慢走了一圈，又一圈。長椅每一張都坐過了。', '四座尖塔有一座是紅磚砌的，跟另外三座不一樣。本大爺一眼就看出來。'],
      dino: ['我躲在噴水池後面。水噴起來的時候看不到我，停下來就被看到了。', '那麼大的圓頂，下面一定可以躲很多隻我。我在公園裡想了很久。'],
      snoopy: ['一個大圓頂，四座尖塔。我坐在長椅上，把它寫成故事裡的城堡。', '傍晚噴水池亮起來。我寫了三行，都在寫水的聲音。'],
      piggy: ['圓頂的直徑大概三十一公尺。這麼大的圓頂，要靠外面那些厚厚的牆撐著。', '尖塔四座，高度都不一樣，三座石頭的、一座紅磚的。要看仔細才會發現。'],
    },
    duo: [
      ['sloth', 'nyanko', '我們在長椅上坐了一整天。', '本大爺是在欣賞建築。牠是在睡覺。'],
      ['dog', 'moodeng', '噴水池的水噴好高！', '我跳起來跟它比！輸了三次，贏了零次。'],
      ['piggy', 'snoopy', '四座尖塔，高度都不一樣。', '我本來寫「四座一樣的塔」。好吧，改掉。'],
    ]},
  reykjavik: {name: '哈爾格林姆教堂', short: '冰島教堂', country: '冰島', city: '雷克雅維克', fav: ['snoopy'],
    stamp: '<path d="M10.800 21V6L12 2.500 13.200 6v15M8.500 21v-9M6.300 21v-6M4.200 21v-3.500M15.500 21v-9M17.700 21v-6M19.800 21v-3.500M3 21h18" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round" stroke-linecap="round"/>',
    sv: {woolhat: {name: '毛線帽', unit: '一頂', vb: [36, 36], w: 7, svg: () => tvSh('<path d="M5 27c0-20 26-20 26 0z"/>', TV_C.a1, 1.4) + tvSh('<circle cx="18" cy="8" r="5.200"/>', TV_C.sun, 1)
      + `<path d="M7 21l3-3.400 3 3.400 3-3.400 3 3.400 3-3.400 3 3.400 3-3.400 1.500 1.700" fill="none" stroke="${TV_C.paper}" stroke-width="1.600" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 24.200h18" stroke="${TV_C.sun}" stroke-width="1.600" stroke-linecap="round" stroke-dasharray=".2 3"/>`
      + tvSh('<rect x="3" y="26" width="30" height="7.500" rx="3.700"/>', TV_C.a1d, 1.2) + [7, 11, 15, 19, 23, 27].map(x => `<rect x="${x}" y="27.500" width="1.200" height="4.500" rx=".600" fill="${TV_C.paper}" opacity=".5"/>`).join('')}},
    cards: [
      {name: '一路往上的街', at: [36, 98, 22], svg: () => { const WL = [TV_C.a1d, TV_C.hill, TV_C.sun, TV_C.leaf, TV_C.paper, TV_C.teal, AB_C.pink2, TV_C.sea], RF = [TV_C.wood2, AB_C.steel3, TV_C.rockd, TV_C.wood];
        const row = [[98, 124, 30, 18], [76, 137, 40, 25], [48, 155, 52, 33], [10, 181, 68, 44], [-46, 212, 84, 56]];
        return `<rect width="300" height="200" fill="${TV_C.sky}"/>${tvCloud(14, 22, .8)}${tvCloud(216, 40, .9)}
        ${abHallgrim(150, 116, 104, AB_C.conc, AB_C.conc2, AB_C.conc3)}
        <path d="M0 115h300v85H0z" fill="${AB_C.stone}"/><path d="M135 115h30l70 85H65z" fill="${AB_C.road}"/><path d="M149 115h2l4 85h-10z" fill="${TV_C.paper}" opacity=".35"/>
        ${row.map(([x, y, w, h], i) => abHouse(x, y, w, h, WL[(i * 3) % WL.length], RF[i % RF.length]) + abHouse(300 - x - w, y, w, h, WL[(i * 3 + 1) % WL.length], RF[(i + 2) % RF.length])).join('')}`; }},
      {name: '教堂的正面', at: [17, 97, 23], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/><rect y="140" width="300" height="60" fill="${TV_C.sky2}"/>${tvCloud(16, 34, .9)}${tvCloud(226, 22, .8)}${tvCloud(238, 92, .6)}
        ${abHouse(2, 174, 34, 20, TV_C.a1d, TV_C.wood2)}${abHouse(40, 174, 30, 17, TV_C.sun, AB_C.steel3)}${abHouse(74, 174, 26, 15, TV_C.teal, TV_C.rockd)}${abHouse(244, 174, 26, 16, TV_C.hill, TV_C.rockd)}${abHouse(272, 174, 32, 20, TV_C.leaf, TV_C.wood2)}
        ${abHallgrim(174, 176, 164, AB_C.conc, AB_C.conc2, AB_C.conc3)}
        ${tvSh('<path d="M0 174c80-4 220-4 300 0v26H0z"/>', AB_C.stone, 1.5)}<path d="M0 184h300M0 193h300" stroke="${AB_C.stone2}" stroke-width="1"/>${[40, 120, 200, 280].map(x => `<rect x="${x}" y="184" width="1" height="9" fill="${AB_C.stone2}"/>`).join('')}`},
      {name: '塔頂看出去', at: [16, 98, 22], svg: () => { const RC = [TV_C.a1d, TV_C.hill, TV_C.leaf, TV_C.sun, AB_C.steel3, TV_C.teal, TV_C.a1]; let h = '';
        for (let r = 0; r < 4; r++){ const w = 22 + r * 7, y = 108 + r * 22, st = w * 1.3; for (let i = 0, x = -14 - (r % 2) * w * .55; x < 310; i++, x += st){ h += abTop(x, y, w, RC[(i * 3 + r * 2) % RC.length]); if ((i + r) % 4 === 1) h += `<circle cx="${x + w * 1.12}" cy="${y - w * .1}" r="${w * .16}" fill="${TV_C.leaf}"/>`; } }
        return `<rect width="300" height="200" fill="${TV_C.sky2}"/><rect width="300" height="34" fill="${TV_C.sky}"/>${tvCloud(20, 14, .7)}${tvCloud(232, 22, .6)}
        <path d="M0 68c24-12 60-16 104-4v6H0z" fill="${TV_C.hill}" opacity=".7"/>
        <path d="M92 68l46-30h46l14 6h42l44 24z" fill="${TV_C.hill}"/><path d="M129 44l9-6h46l14 6h42l9 6-9 3-9-4-12 5-11-5-14 4-12-5-15 5-13-4-11 5z" fill="${AB_C.snow}"/>
        <rect y="66" width="300" height="30" fill="${TV_C.sea}"/><rect y="80" width="300" height="16" fill="${TV_C.seal}"/>
        <path d="M0 92c40-6 80 2 120-2 50-6 110 4 180-2v112H0z" fill="#cfd5db"/>
        ${h}
        ${tvSh('<rect x="-4" y="178" width="308" height="26"/>', AB_C.conc, -1.6)}<rect x="-4" y="178" width="308" height="3.500" fill="${AB_C.conc2}"/>${[60, 150, 240].map(x => `<rect x="${x}" y="181.500" width="1" height="19" fill="${AB_C.conc3}" opacity=".6"/>`).join('')}`; }},
    ],
    lines: {
      sloth: ['街一路往上，教堂在最上面。我走得很慢，還好它很高，一直看得到。', '兩邊的柱子一根比一根高。我從最矮的看到最高的，看了很久。'],
      egg: ['上坡。我在街的最下面看就好，反正很遠也看得到。', '這裡有點冷。我把自己縮起來，變成一顆更圓的蛋。'],
      dog: ['街的最上面有一座好高的塔！我一路跑上去！中間都沒有停！', '從塔頂看出去，屋頂紅的藍的綠的！後面還有海！'],
      moodeng: ['兩邊的柱子像樓梯，一階一階往上。我在下面跟著跳，一階跳一下。', '很遠就看得到它。我走到哪裡回頭，它都在。它是不是在跟著我。'],
      nyanko: ['本大爺圍了圍巾。冷是冷，本大爺沒有發抖，是風在抖。', '柱子是照著這裡的石頭柱子設計的。本大爺聽了一遍就記住了。'],
      dino: ['兩邊那麼多根柱子，我躲在其中一根後面。牠們一根一根找，找了好久。嘿嘿。', '遠遠的山，山頂是白的。它也戴了帽子躲起來。'],
      snoopy: ['全城最高的地方。我站在前面抬頭看，決定小說的最後一幕就在這裡。', '從塔頂看出去，一片彩色的屋頂，再過去是海。這一頁我寫得特別慢。'],
      piggy: ['塔大概七十四公尺，是混凝土蓋的。在這座城裡，走到哪裡都看得到它。', '柱子從外面往中間越來越高，像一座往上收的山。設計的人有想過。'],
    },
    duo: [
      ['snoopy', 'dog', '我要把這座塔寫進小說的最後一章。', '我先跑到前面幫你看！好高！脖子都仰酸了！'],
      ['moodeng', 'piggy', '柱子一階一階的，我可以跳上去嗎？', '不行。在下面數就好，我陪你數。'],
      ['egg', 'nyanko', '好冷。我不想動。', '本大爺的圍巾分你一半。只有一半。'],
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
// 機票：用一次（跟野餐籃一樣算個數）。放進背包，下一趟就是出國；再放野餐籃就是全家一起出國。一趟一張，不管幾隻。
// 火腿的小店一開始就賣；第一張是薯餅的更新信附送的（js/mail.js 的 air1，領的時候在 js/travel.js 的 tvTicketTake）
TV_GOODS.ticket = {slot: 'tool', once: 1, name: '機票', price: 60, tip: '下一趟出國，兩三天回來', ic: tvIc('<path d="M3 9h26v5a3 3 0 0 0 0 6v5H3v-5a3 3 0 0 0 0-6z" fill="#1b2140" opacity=".2" transform="translate(0 1.5)"/><path d="M3 9h26v5a3 3 0 0 0 0 6v5H3v-5a3 3 0 0 0 0-6z" fill="#fbf6ea"/><path d="M21 9v16" stroke="#d9c29c" stroke-width="1.400" stroke-dasharray="2 1.800"/><path d="M7 19.500l8-2.800 2.600-4 1.500.300-1.300 3.200 2.500-.900.700 1-2.600 1.800-9.400 3.200z" fill="#3f9aa5"/><rect x="23.500" y="13" width="3" height="8" rx="1" fill="#ff8a66"/>')};
TV_SLOTS[2][2] = '可以一起帶，籃子和機票用一次';
