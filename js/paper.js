/* 新風格：紙雕立體・夜燈（2026-11-26）。同一天晚上使用者看過封面、娃娃機、小島後說「現在就改」，改成預設：
   不加參數就是新風格（從主畫面圖示開也是）；網址加 ?look=old 回到原本的樣子，這個檔就什麼都不做。選過的不記在存檔，網址有帶才算。
   index.html 最前面有一小段程式看同一個參數，先把 .look-paper 掛上去，第一眼才不會閃一下舊的顏色。
   第一版只換客廳（使用者看過說「可以，繼續換」）。現在五間房間都是新風格：牆、地板、窗戶和窗外、門口、每一間固定的構造、所有家具、
   上面的按鈕、收納架、對話框和提示。門外小島、娃娃機那一頁、封面還是原本的樣子。不改存檔、不改規則、不動玩法。
   家具：71 件都是手畫的，在 PF（客廳最早那 7 件、第一批 16 件、第二批 13 件、第三批 35 件）。旅行的土產、小島的戶外家具和之後新增還沒手畫的，用 paperize() 自動轉：拿掉描邊和亮面的反光、顏色換成色票裡最接近的那一個、
   每一塊下面加一塊往下錯開的影子。之後新增的家具不用另外畫，會自動轉。
   畫法（照 樣張/小窩風格樣板.html 的 B 款）：
   - 每一樣東西是色紙剪出來的色塊，沒有描邊；每一層下面有一塊往下錯開的深色影子，越前面錯得越多。
   - 窗戶是割開的洞：看得到後面的天空、遠山，洞的上緣和左緣有牆的厚度的影子；晚上周圍有一圈暖光。
   - 紙纖維紋理是一張小圖（img/paper/fiber.png），用色彩增值疊在牆、地板、收納架這些不會動的底上。
   - 娃娃的照片不重畫，當貼紙貼上去，腳下一塊橢圓的影子（不用濾鏡，娃娃在動的時候不會卡）。
   - 顏色直接寫進圖裡（不是用 CSS 變數），這樣拍照把家具轉成圖的時候顏色還在；天色換了就把家具重畫一次。
   字：2026-11-27 曾經整個用 LXGW WenKai TC。2026-11-28 起只有娃娃說話用文楷，一個檔 lxgw-00（css/lxgw.css）；其他是源泉圓體和粉圓。
   色票：晚上「夜燈」、白天「夜燈的白天」，清晨和傍晚取兩組中間。壁紙和地板：每一款對應一張色紙加一層很淡的花紋（見 PWALL、PFLOOR）。
   放在 rooms.js 後面、main.js 前面載入：main.js 第一次畫房間之前，這裡要先把畫法換掉。 */
const PAPER_ON = (() => { try { return new URLSearchParams(location.search).get('look') !== 'old'; } catch (e) { return true; } })();
if (PAPER_ON) (() => {
  const TONES = {
    night: {sky: '#1f2a4a', hill: '#16324a', hill2: '#24486a', sun: '#ffe9a8', cloud: '#3b4a78', wall: '#39406a', wall2: '#2e3458', floor: '#4b3f5a', wood: '#8a5a45', wood2: '#623f30',
      a1: '#ff8a66', a2: '#4fb0b8', leaf: '#4c9a78', ink: '#12152a', paper: '#f7f0df', sea: '#25507a', sand: '#6f6890', rug: '#5b5788'},
    day: {sky: '#a9c8ea', hill: '#3f6f93', hill2: '#6f9fc0', sun: '#ffd36e', cloud: '#ffffff', wall: '#dfe3f0', wall2: '#c9cfe6', floor: '#cdb5c9', wood: '#8a5a45', wood2: '#623f30',
      a1: '#ff8a66', a2: '#3f9aa5', leaf: '#4c9a78', ink: '#23264a', paper: '#fbf6ea', sea: '#3f86b8', sand: '#e9dccb', rug: '#b9bde0'},
  };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  // 清晨偏白天一點、帶一點暖；傍晚偏晚上一點、天空帶一點橘
  const blend = (t, warmSky) => { const o = {}; Object.keys(TONES.day).forEach(k => o[k] = mix(TONES.night[k], TONES.day[k], t)); o.sky = mix(o.sky, warmSky, .28); return o; };
  const C = {};
  // 紙纖維那張小圖：用完整的網址。css 裡寫的是相對路徑（相對於 css 檔），但這個變數被 js 產生的 <style> 用到時會從網頁那一層算，
  // 網站放在子資料夾（GitHub Pages 的 /shubing-nest/）就會找錯地方（2026-11-27 線上 404）
  const FIBER = 'url("' + new URL('img/paper/fiber.png', document.baseURI).href + '")';
  let phase = '';
  const curPhase = () => (typeof skyPhase === 'function' ? skyPhase() : (typeof isNight === 'function' && isNight() ? 'night' : 'day'));
  function tone(){
    const p = curPhase();
    Object.assign(C, p === 'night' ? TONES.night : p === 'day' ? TONES.day : p === 'dawn' ? blend(.62, '#ffd9c0') : blend(.4, '#ff9d7a'));
    C.dark = p === 'night' || p === 'dusk';
    // 衍生的深淺
    C.a1d = mix(C.a1, C.ink, .2); C.a1l = mix(C.a1, C.paper, .22); C.a2d = mix(C.a2, C.ink, .22); C.a2l = mix(C.a2, C.paper, .25);
    C.wood3 = mix(C.wood, C.paper, .22); C.leafd = mix(C.leaf, C.ink, .22); C.leafl = mix(C.leaf, C.paper, .22); C.paperd = mix(C.paper, C.ink, .14);
    const st = screen.style;
    Object.keys(C).forEach(k => { if (typeof C[k] === 'string') st.setProperty('--p-' + k, C[k]); });
    st.setProperty('--p-fiber', FIBER);
    // 畫面外面那一圈（電腦上看得到）的底色也跟著天色
    document.documentElement.style.setProperty('--bg', C.dark ? mix(C.wall2, C.ink, .4) : mix(C.wall, C.paper, .45));
    const changed = p !== phase; phase = p;
    if (changed) deco();
    return changed;
  }
  /* ---------- 壁紙和地板：每一款對應一張色紙，加一層很淡的剪紙花紋（2026-11-26 使用者同意的做法） ----------
     玩家夾到、買到的每一款要認得出來，所以顏色和花紋都留；但花紋只比底色深（晚上是淺）一點點，近看才看得出來，遠看是一張素色的紙。
     每一款：[往色票的哪個顏色偏, 牆上半偏多少, 牆下半偏多少, 花紋]；地板：[往哪個顏色偏, 偏多少, 花紋]。null = 就是色票的牆色、地板色。
     預設那幾款（客廳圓點＋格子、臥室條紋＋木頭、浴室磁磚＋薄荷）的數字是照改之前每一間的樣子定的。
     房間、收納架的小色塊、小店、小屋地圖、去朋友家、明信片、拍照都用這一份。之後新增款式在這裡加一行，沒寫到的用色票的牆色、不加花紋。 */
  const PWALL = {
    dots: [null, 0, 0, 'dots'], stripe: ['a1', .07, .09, 'stripe'], tile: ['a2', .2, .28, 'grid'], sky: ['sky', .34, .4, 'cloud'], star: ['rug', .3, .36, 'star'],
    cream: ['sun', .13, .19, 'dots'], wave: ['sea', .22, .28, 'scallop'], peach: ['a1', .15, .19, 'check'], lav: ['rug', .2, .26, 'stripe'], mintdot: ['leaf', .15, .2, 'dots'], forest: ['leaf', .24, .3, 'scallop'],
  };
  const PFLOOR = {
    check: [null, 0, 'check'], wood: ['wood', .16, 'plank'], mint: ['a2', .24, 'check'], cloud: ['paper', .3, 'cloud'], grass: ['leaf', .36, 'dots'], space: ['sea', .5, 'star'],
    honey: ['sun', .3, 'check'], pinkwood: ['a1', .22, 'plank'], stone: ['paperd', .3, 'check'], sand: ['sand', .5, 'dots'],
  };
  // 花紋：一小塊可以平鋪的圖，只有形狀；顏色和濃淡在外面定
  const PTILE = {
    dots: [28, 28, '<circle cx="7" cy="7" r="3.2"/><circle cx="21" cy="21" r="3.2"/>'],
    stripe: [28, 8, '<rect width="14" height="8"/>'],
    grid: [24, 24, '<rect width="24" height="1.6"/><rect width="1.6" height="24"/>'],
    check: [32, 32, '<rect width="16" height="16"/><rect x="16" y="16" width="16" height="16"/>'],
    star: [46, 40, '<path d="M11 6l1.600 3.300 3.600.500-2.600 2.500.600 3.600L11 14.200l-3.200 1.700.600-3.600-2.600-2.500 3.600-.500z"/><circle cx="34" cy="28" r="1.700"/><circle cx="30" cy="8" r="1.100"/>'],
    cloud: [72, 44, '<ellipse cx="20" cy="15" rx="13" ry="5.500"/><ellipse cx="28" cy="11" rx="8" ry="6"/><ellipse cx="54" cy="35" rx="11" ry="4.600"/>'],
    scallop: [30, 16, '<path d="M0 16a15 15 0 0 1 30 0h-3a12 12 0 0 0-24 0z"/>'],
    plank: [72, 22, '<rect y="20.400" width="72" height="1.600"/><rect x="24" width="1.600" height="11"/><rect x="58" y="11" width="1.600" height="11"/>'],
  };
  const DECO_IMG = {};   // 拍照用：花紋先載成圖
  const patURL = name => {
    const t = PTILE[name]; if (!t) return '';
    const [r, g, b] = hex(C.dark ? C.paper : C.ink), op = C.dark ? .03 : .045;   // 很淡：近看才看得出來，晚上更淡
    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${t[0]}" height="${t[1]}"><g fill="rgb(${r},${g},${b})" fill-opacity="${op}">${t[2]}</g></svg>`)}")`;
  };
  const wallOf = k => { const d = PWALL[k] || [null, 0, 0, '']; return {c: d[0] ? mix(C.wall, C[d[0]], d[1]) : C.wall, c2: d[0] ? mix(C.wall2, C[d[0]], d[2]) : C.wall2, pat: d[3]}; };
  const floorOf = k => { const d = PFLOOR[k] || [null, 0, '']; return {c: d[0] ? mix(C.floor, C[d[0]], d[1]) : C.floor, pat: d[2]}; };
  // 照現在的天色產生一份樣式。牆和地板本身、收納架和小店的小色塊（.sw）、小屋地圖的小格子都用它
  function deco(){
    if (!C.wall) return;
    const veil = c => { const [r, g, b] = hex(c); return `linear-gradient(rgba(${r},${g},${b},.56),rgba(${r},${g},${b},.56))`; };
    const bg = (c, pat, tex) => `background:${pat ? patURL(pat) + ',' : ''}${tex ? veil(c) + ',var(--p-fiber),' : ''}${c}!important;background-size:${pat ? 'auto,' : ''}${tex ? 'auto,192px 192px,' : ''}auto!important;background-blend-mode:${pat ? 'normal,' : ''}${tex ? 'normal,multiply,' : ''}normal!important`;
    const css = [];
    const walls = typeof WALLS !== 'undefined' ? WALLS : Object.keys(PWALL), floors = typeof FLOORS !== 'undefined' ? FLOORS : Object.keys(PFLOOR);
    walls.forEach(k => {
      const w = wallOf(k);
      css.push(`.screen.ppon .wall.w-${k}{${bg(w.c, w.pat, true)}}`);
      css.push(`.screen.ppon .wall.w-${k}::before{background:${veil(w.c2)},var(--p-fiber),${w.c2};background-size:auto,192px 192px,auto;background-blend-mode:normal,multiply,normal}`);
      css.push(`.look-paper .sw.w-${k},.look-paper .hm-c .hm-wall.w-${k}{${bg(w.c, w.pat, false)}}`);
      if (w.pat){ const im = new Image(); im.src = patURL(w.pat).slice(5, -2); DECO_IMG['w-' + k] = im; }
    });
    floors.forEach(k => {
      const f = floorOf(k);
      css.push(`.screen.ppon .floor.f-${k}{${bg(f.c, f.pat, true)}}`);
      css.push(`.look-paper .sw.f-${k},.look-paper .hm-c .hm-floor.f-${k}{${bg(f.c, f.pat, false)}}`);
      if (f.pat){ const im = new Image(); im.src = patURL(f.pat).slice(5, -2); DECO_IMG['f-' + k] = im; }
    });
    let st = document.getElementById('pp-deco');
    if (!st){ st = document.createElement('style'); st.id = 'pp-deco'; document.head.appendChild(st); }
    st.textContent = css.join('\n');
  }

  /* ---------- 畫圖的小工具：f 是「給顏色、回傳形狀」的函式；L 會先畫一塊往下錯開的影子，再畫本體 ---------- */
  const sh = (f, d = 1) => `<g opacity="${(.17 + .05 * d).toFixed(2)}" transform="translate(0 ${(1.15 * d).toFixed(2)})">${f(C.ink)}</g>`;
  const L = (f, col, d = 1) => sh(f, d) + f(col);
  const rect = (x, y, w, h, r = 0, tf = '') => c => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c}"${tf ? ` transform="${tf}"` : ''}/>`;
  const path = d => c => `<path d="${d}" fill="${c}"/>`;
  const ell = (cx, cy, rx, ry) => c => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}"/>`;
  const circ = (cx, cy, r) => c => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;
  const both = (...fs) => c => fs.map(f => f(c)).join('');
  // 五角星：中心、外圈和內圈的半徑
  const star = (cx, cy, R, r) => path('M' + Array.from({length: 10}, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; return (cx + q * Math.cos(a)).toFixed(2) + ' ' + (cy + q * Math.sin(a)).toFixed(2); }).join('L') + 'z');
  const strip = (d, c, w = 2) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  /* ---------- 客廳的家具：外框（viewBox）、坐的位置都跟原本一樣，只換畫法 ---------- */
  const PF = {
    sofa: () => rect(18, 62, 6, 9, 1.5)(C.wood2) + rect(86, 62, 6, 9, 1.5)(C.wood2)
      + L(rect(12, 6, 86, 42, 14), C.a1d, 1)
      + L(rect(16, 36, 78, 24, 8), C.a1, 1.2)
      + L(both(rect(2, 26, 22, 38, 10), rect(86, 26, 22, 38, 10)), C.a1l, 1.5)
      + L(rect(45, 22, 20, 15, 4, 'rotate(-7 55 30)'), C.a2, .8),
    tv: () => strip('M30 12L22 3M50 12l8-9', C.wood2, 2.2) + circ(22, 3, 2.7)(C.a1) + circ(58, 3, 2.7)(C.sun)
      + L(rect(12, 10, 56, 38, 8), C.paper, 1.2)
      + `<clipPath id="pp-tv"><rect x="18" y="16" width="44" height="26" rx="4"/></clipPath><g clip-path="url(#pp-tv)">`
      + rect(18, 16, 44, 26)(C.sky) + circ(52, 24, 4.2)(C.sun) + path('M16 44V37q11-9 23-3t25-6v16z')(C.hill2) + path('M16 44v-3q14-6 26-1t22-3v7z')(C.hill)
      + `<rect x="18" y="16" width="44" height="3.2" fill="${C.ink}" opacity=".2"/></g>`
      + L(rect(6, 52, 68, 22, 4), C.wood, 1.3) + rect(39.2, 55, 1.6, 16, .8)(C.wood2) + circ(34, 63, 2)(C.paper) + circ(46, 63, 2)(C.paper),
    table: () => rect(16, 20, 7, 24, 3)(C.wood2) + rect(67, 20, 7, 24, 3)(C.wood2)
      + L(ell(45, 20, 42, 12), C.wood, 1.3) + ell(45, 18, 33, 7)(C.paper)
      + L(both(rect(52, 4, 11, 12, 2.5), path('M62 7h3.2a3 3 0 0 1 0 6H62v-1.8h3a1.2 1.2 0 0 0 0-2.4h-3z')), C.a1, .7)
      + L(circ(32, 14.5, 5), C.sun, .6),
    shelf: () => L(rect(4, 4, 64, 92, 5), C.wood, 1.4)
      + rect(10, 12, 52, 34, 2)(C.wood2) + rect(10, 54, 52, 34, 2)(C.wood2)
      + `<rect x="10" y="12" width="52" height="3.4" fill="${C.ink}" opacity=".22"/><rect x="10" y="54" width="52" height="3.4" fill="${C.ink}" opacity=".22"/>`
      + L(both(rect(14, 22, 7, 24, 1.2), rect(30, 25, 6, 21, 1.2)), C.a2, .5) + L(rect(22, 18, 7, 28, 1.2), C.a1, .5) + L(rect(37, 21, 5, 25, 1.2), C.sun, .5)
      + L(ell(51, 38, 6.5, 8), C.paper, .5)
      + L(rect(15, 68, 16, 20, 2), C.leaf, .5) + L(rect(36, 62, 7, 26, 1.2), C.paper, .5) + L(rect(45, 66, 7, 22, 1.2), C.a1l, .5),
    plant: () => L(path('M22 44C10 40 4 28 8 18c8 2 14 12 14 26z'), C.leafd, .7) + L(path('M22 44c12-4 18-16 14-26-8 2-14 12-14 26z'), C.leaf, .9) + L(path('M22 42C18 28 20 12 22 4c3 8 4 24 0 38z'), C.leafl, 1.1)
      + L(path('M9 44h26l-4 28H13z'), C.a2, 1.2) + L(rect(7, 42, 30, 7, 2.5), C.a2l, 1.3),
    clock: () => L(circ(24, 24, 21), C.a2, 1.2) + circ(24, 24, 16.5)(C.paper)
      + [[24, 11], [37, 24], [24, 37], [11, 24]].map(([x, y]) => circ(x, y, 1.7)(C.a1)).join('')
      + strip('M24 24V14.5M24 24l7 4.5', C.ink, 2.4) + circ(24, 24, 2.4)(C.a1),

    /* ---- 手畫第一批（2026-11-26，使用者看了自動轉的說「幫我手畫」）：每個玩家一開始就有的 8 件、八隻的專屬家具 8 件。
       一片一片色紙疊起來：大塊、少細節、邊角圓，每片下面有往下錯開的影子。外框和坐的位置跟原本一樣 ---- */
    bed: () => rect(12, 70, 8, 12, 3)(C.wood2) + rect(100, 70, 8, 12, 3)(C.wood2)
      + L(path('M8 56V32c0-11 9-17 18-14 5-10 19-12 27-5 7-6 20-5 26 2 9-5 23 1 23 15v26z'), C.paper, 1)
      + L(rect(6, 50, 108, 24, 9), C.wood, 1.2)
      + L(rect(8, 40, 104, 20, 9), C.paperd, 1.1)
      + L(rect(13, 34, 30, 15, 7.5), C.a2l, .9)
      + L(path('M42 38h60a10 10 0 0 1 10 10v8a10 10 0 0 1-10 10H50a8 8 0 0 1-8-8z'), C.a1, 1.5)
      + L(rect(46, 38, 62, 8, 4), C.a1l, .6),
    rug: () => L(ell(60, 19, 57, 16), C.a2, .8) + ell(60, 19, 45, 11)(C.a2l) + ell(60, 19, 33, 6.6)(C.a2),
    lamp: () => L(ell(20, 90, 14, 5), C.paperd, .8) + rect(16.5, 34, 7, 56, 3.5)(C.paper)
      + L(path('M3 34C3 14 11 4 20 4s17 10 17 30z'), C.a1, 1.3)
      + both(circ(13, 19, 3), circ(26, 13, 2.4), circ(27, 26, 2.7))(C.paper),
    closet: () => rect(8, 76, 7, 9, 2.5)(C.wood2) + rect(45, 76, 7, 9, 2.5)(C.wood2)
      + L(path('M6 14q0-8 8-8h32q8 0 8 8v64H6z'), C.a1l, 1.3)
      + L(both(rect(11, 14, 18, 58, 4), rect(31, 14, 18, 58, 4)), C.a1, .7)
      + circ(26, 44, 2.4)(C.sun) + circ(34, 44, 2.4)(C.sun)
      + path('M40 21l1.800 3.600 4 .600-2.900 2.800.700 4-3.600-1.900-3.600 1.900.700-4-2.900-2.800 4-.600z')(C.paper),
    tub: () => strip('M98 26V12a6 6 0 0 0-6-6h-8', C.paperd, 3.2) + circ(84, 6, 3)(C.paperd)
      + L(both(circ(20, 22, 9), circ(36, 15, 11), circ(54, 19, 8), circ(76, 17, 10), circ(92, 23, 7)), C.paper, .7)
      + circ(25, 76, 5)(C.sun) + circ(85, 76, 5)(C.sun)
      + L(path('M6 30h98v12c0 17-14 30-31 30H37C20 72 6 59 6 42z'), C.paper, 1.5)
      + strip('M20 48c6 6 16 9 30 9', C.a2l, 3)
      + L(rect(2, 25, 106, 10, 5), C.paperd, 1.1),
    sink: () => L(circ(28, 20, 18), C.a2, 1.1) + circ(28, 20, 14)(C.a2l)
      + path('M22 58h12l-2 42h-8z')(C.paperd)
      + strip('M28 46v-7h7', C.paperd, 3)
      + L(path('M4 48h48c0 10-10 16-24 16S4 58 4 48z'), C.paper, 1.3)
      + L(rect(2, 44, 52, 7, 3.5), C.paperd, .8),
    mat: () => L(rect(4, 4, 92, 26, 13), C.leaf, .8) + rect(12, 10, 76, 14, 7)(C.leafl),
    towel: () => L(rect(2, 4, 56, 6, 3), C.wood2, .8)
      + L(path('M10 8h40v36a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z'), C.a1, 1.2)
      + rect(10, 33, 40, 2.8)(C.paper) + rect(10, 39, 40, 2.8)(C.paper),
    hammock: () => rect(9.8, 12, 4.4, 54, 2)(C.wood2) + rect(105.8, 12, 4.4, 54, 2)(C.wood2)
      + rect(3, 63.800, 18, 4.4, 2.2)(C.wood2) + rect(99, 63.800, 18, 4.4, 2.2)(C.wood2)
      + L(path('M12 18C30 60 90 60 108 18C90 42 30 42 12 18Z'), mix(C.sun, C.paper, .35), 1.4)
      + strip('M27 39c22 10 44 10 66 0', C.a1, 2.4)
      + circ(12, 18, 3.4)(C.sun) + circ(108, 18, 3.4)(C.sun),
    beanbag: () => L(path('M9 52C3 30 22 8 46 8s40 20 35 44c-2 8-68 8-72 0z'), C.sun, 1.4)
      + ell(45, 35, 23, 10)(mix(C.sun, C.paper, .5))
      + strip('M14 51c20 4 44 4 62 0', mix(C.sun, C.ink, .22), 1.8),
    sliprack: () => L(rect(6, 6, 58, 54, 5), C.wood, 1.3)
      + rect(11, 11, 48, 20, 2)(C.wood2) + rect(11, 36, 48, 20, 2)(C.wood2)
      + `<rect x="11" y="11" width="48" height="3" fill="${C.ink}" opacity=".22"/><rect x="11" y="36" width="48" height="3" fill="${C.ink}" opacity=".22"/>`
      + L(both(ell(25, 24, 9, 5), ell(45, 24, 9, 5)), C.a1, .5)
      + L(ell(25, 49, 9, 5), C.a2, .5) + L(ell(45, 49, 9, 5), C.sun, .5),
    trampoline: () => rect(12.400, 30, 3.2, 18, 1.6)(C.a2d) + rect(84.400, 30, 3.2, 18, 1.6)(C.a2d) + rect(32.400, 36, 3.2, 14, 1.6)(C.a2d) + rect(64.400, 36, 3.2, 14, 1.6)(C.a2d)
      + L(ell(50, 24, 46, 17), C.a2, 1.3)
      + ell(50, 23, 36, 11.5)(C.paper)
      + path('M50 15.500l2.200 4.600 5 .600-3.700 3.500 1 5-4.500-2.500-4.500 2.500 1-5-3.700-3.500 5-.600z')(C.sun),
    snackcab: () => path('M20 9c3-8 27-8 30 0z')(C.sun)
      + L(rect(6, 8, 58, 80, 6), C.paper, 1.4)
      + rect(12, 14, 46, 30, 3)(C.a2l) + `<rect x="12" y="14" width="46" height="3" fill="${C.ink}" opacity=".2"/>`
      + L(circ(23, 34, 6), C.wood3, .5) + L(circ(38, 33, 6), C.a1, .5) + L(rect(47, 24, 8, 16, 2), C.sun, .5)
      + L(rect(12, 50, 46, 32, 3), C.a1l, .7) + rect(34.300, 52, 1.4, 28, .7)(C.a1)
      + circ(30, 66, 2.2)(C.a1d) + circ(40, 66, 2.2)(C.a1d),
    cavetent: () => L(path('M28 18l5-11 7 9M46 10l4-9 5 9M63 15l7-9 2 12z'), C.leafl, .6)
      + L(path('M6 74C6 32 26 10 50 10s44 22 44 64z'), C.leaf, 1.5)
      + path('M27 74c0-26 9-40 23-40s23 14 23 40z')(C.leafl)
      + path('M31 74c0-23 8-36 19-36s19 13 19 36z')(mix(C.leafd, C.ink, .4))
      + circ(21, 46, 3)(C.leafl) + circ(81, 52, 2.6)(C.leafl),
    writedesk: () => rect(10, 28, 6, 38, 2.5)(C.wood2) + rect(80, 28, 6, 38, 2.5)(C.wood2)
      + L(rect(54, 30, 28, 20, 2.5), C.wood3, .7) + circ(68, 40, 2.2)(C.wood2)
      + L(rect(27, 1, 16, 10, 1.5), C.paper, .5) + rect(30, 4, 10, 1.2)(C.paperd) + rect(30, 7, 7, 1.2)(C.paperd)
      + L(rect(22, 8, 26, 13, 3.5), C.a2, .8)
      + strip('M65 10V3M69 10V4', C.a1, 2.2) + L(rect(61, 9, 12, 11, 2.5), C.sun, .6)
      + L(rect(4, 20, 88, 12, 4.5), C.wood, 1.3),
    podium: () => strip('M55 22V8', mix(C.paper, C.ink, .45), 2.4) + ell(55, 5.500, 4, 5)(mix(C.ink, C.paper, .22))
      + L(rect(6, 26, 52, 30, 4.5), C.a1, 1.2)
      + path('M32 34.500l2.500 5.200 5.700.700-4.200 4 1.100 5.600L32 47.200l-5.100 2.800 1.100-5.600-4.200-4 5.700-.700z')(C.sun)
      + L(rect(2, 19, 60, 11, 5.5), C.a1l, 1.4),
    // 星星掛旗：一條線上掛七面小旗
    bunting: () => strip('M3 5Q56 27 109 5', C.wood2, 1.4)
      + [[12, 8.6], [27, 13.6], [42, 16.6], [56, 17.6], [70, 16.6], [85, 13.6], [100, 8.6]].map(([x, y], i) =>
        L(path(`M${x - 6} ${y}h12l-6 13z`), [C.a1, C.leaf, C.a2, C.sun][i % 4], .6)).join(''),

    /* ---- 手畫第二批（2026-11-27）：最早那 18 件裡剩下的 4 件（蛋椅、相框、玩具箱、小鴨）、甜點系列 6 件、牆上的 3 件。
       畫法跟第一批一樣。外框、坐的位置、燈會亮的位置都跟原本一樣 ---- */
    eggchair: () => L(ell(33, 83, 15, 3.2), C.paperd, .7) + rect(31, 70, 4, 13, 2)(C.paperd)
      + L(path('M33 4C52 4 62 30 62 48c0 16-12 26-29 26S4 64 4 48C4 30 14 4 33 4z'), C.paper, 1.5)
      + path('M10 41l7-6 6 6 6-7 6 7 6-6 6 6 7-6 3 5c1 4 1 6 1 9 0 13-10 22-25 22S8 65 8 52c0-4 1-8 2-11z')(C.paperd)
      + `<path d="M10 41l7-6 6 6 6-7 6 7 6-6 6 6 7-6 3 5v4l-3-5-7 6-6-6-6 6-6-7-6 7-6-6-7 6z" fill="${C.ink}" opacity=".16"/>`
      + L(ell(33, 57, 19, 10.5), C.sun, 1) + ell(33, 54.5, 13, 5.5)(mix(C.sun, C.paper, .45)),
    frame: () => L(rect(3, 3, 48, 38, 6), C.paper, 1.2)
      + rect(9, 9, 36, 26, 3)(C.sky) + `<rect x="9" y="9" width="36" height="3" rx="1.500" fill="${C.ink}" opacity=".2"/>`
      + circ(33, 20, 5)(C.sun)
      + path('M15 30c-3-1-3-6 1-7 1-5 8-6 11-3 4-2 9 1 8 5 3 1 3 5-1 5z')(C.cloud),
    toybox: () => L(rect(4, 16, 58, 36, 6), C.a2, 1.3)
      + rect(4, 20, 58, 5)(C.a2d)
      + L(rect(2, 8, 62, 12, 5), C.a2l, 1.5)
      + L(path('M33 27l3 6.200 6.800 1-4.900 4.800 1.200 6.800L33 42.600l-6.100 3.200 1.200-6.800-4.900-4.800 6.800-1z'), C.sun, .7)
      + rect(8, 28, 4, 10, 2)(C.a2l) + rect(54, 28, 4, 10, 2)(C.a2l),
    duck: () => L(path('M6 22c0-4 4-6 8-6h6c-4-2-4-12 4-13 8 0 10 8 6 12 6 0 12 0 14 4 0 12-10 19-22 19S6 32 6 22z'), C.sun, 1.1)
      + path('M13 23c4-3 13-3 16 1-1 7-14 8-16-1z')(mix(C.sun, C.wood, .3))
      + L(path('M33 9l9.500 3-8.500 3.600z'), C.a1, .5) + circ(28.500, 9, 1.900)(C.ink),
    // 甜點系列
    puddingtable: () => L(ell(42, 51, 38, 5.5), C.paper, .9)
      + L(path('M15 51L24 19h36l9 32z'), C.sun, 1.3)
      + path('M24 19h10L27 51H15z')(mix(C.sun, C.paper, .4))
      + L(path('M22 23c4-9 36-9 40 0-2 6-6 7-9 5-3 3-8 3-11 0-3 2-8 2-11 0-3 2-7 1-9-5z'), C.wood, .9)
      + ell(42, 19, 13, 3)(C.wood3),
    donutseat: () => L(ell(36, 21, 32, 14.5), mix(C.sun, C.wood, .38), 1.2)
      + L(path('M6 18c4-13 56-13 60 0-3 4-7 2-10 5-4-3-8 1-12-1-4 3-9-1-13 1-4-2-8 2-12-1-4-2-9 0-13-4z'), C.a1l, .8)
      + ell(36, 16, 9, 4)(mix(C.wood, C.ink, .25)) + ell(36, 17.200, 7, 2.800)(mix(C.sun, C.wood, .55))
      + [[18, 13, -30, 'paper'], [27, 9.500, 70, 'sun'], [47, 9.500, -60, 'a2'], [56, 14, 40, 'paper'], [23, 20, 10, 'a2'], [51, 20, -15, 'sun']].map(([x, y, r, k]) => rect(x - 2.2, y - .9, 4.4, 1.8, .9, `rotate(${r} ${x} ${y})`)(C[k])).join(''),
    macaron: () => L(ell(28, 32, 24, 9.5), C.leafl, 1.2)
      + L(rect(6, 19, 44, 9, 4.5), C.paper, .7)
      + L(ell(28, 14, 24, 10.5), C.leafl, 1)
      + ell(28, 11.500, 17, 5.500)(mix(C.leafl, C.paper, .4)),
    cakecab: () => rect(12, 80, 7, 6, 2)(C.a1d) + rect(65, 80, 7, 6, 2)(C.a1d)
      + L(path('M10 44C10 18 28 6 42 6s32 12 32 38z'), mix(C.sky, C.paper, .55), 1.2)
      + L(rect(25, 26, 34, 15, 3.5), C.paper, .6) + path('M25 31c5 4 8-2 12 2s8-3 12 1 6-2 10 0v-4.500a3.500 3.500 0 0 0-3.500-3.500h-27a3.500 3.500 0 0 0-3.500 3.500z')(C.a1) + L(circ(42, 21.500, 4.200), C.a1d, .4)
      + path('M17 24c3-7 8-10 13-11l1 3c-4 1-8 4-11 9z')(C.paper)
      + L(rect(6, 42, 72, 40, 8), C.a1l, 1.4)
      + L(rect(13, 51, 58, 10, 3), C.paper, .5) + L(rect(13, 65, 58, 10, 3), C.paper, .5) + circ(42, 56, 2)(C.a1) + circ(42, 70, 2)(C.a1)
      + L(rect(4, 39, 76, 6, 3), C.paper, .9),
    lollilamp: () => L(ell(20, 90, 12, 4.2), C.a1l, .8) + rect(17.800, 36, 4.400, 53, 2.200)(C.paper)
      + L(circ(20, 22, 17), C.a1, 1.3)
      + strip('M20 22c0-4 5-5 6-1s-5 8-10 5-5-11 2-14 14 3 13 10', C.paper, 2.8),
    wafflerug: () => L(ell(60, 20, 56, 17), mix(C.sun, C.wood, .34), .8) + ell(60, 20, 50, 13.5)(mix(C.sun, C.wood, .16))
      + strip('M27 9l-7 21M45 6.500l-5 27M64 6v28M83 6.500l5 27M101 9l7 21M13 15h94M10 25h100', mix(C.sun, C.wood, .42), 1.8)
      + L(rect(52, 13.500, 16, 10, 2.5, 'rotate(-6 60 18.500)'), mix(C.sun, C.paper, .6), .5),
    // 牆上的
    curtain: () => L(path('M8 9h30c0 22-8 35-22 45-6-10-8-27-8-45z'), C.a1l, 1.2) + L(path('M72 9H42c0 22 8 35 22 45 6-10 8-27 8-45z'), C.a1l, 1.2)
      + both(path('M15 10h5c0 15 0 26-3 38l-3-4c1-10 1-22 1-34z'), path('M26 10h5c-1 13-5 24-10 33l-2-4c4-8 6-18 7-29z'), path('M65 10h-5c0 15 0 26 3 38l3-4c-1-10-1-22-1-34z'), path('M54 10h-5c1 13 5 24 10 33l2-4c-4-8-6-18-7-29z'))(C.a1)
      + L(circ(18, 43, 3.4), C.sun, .5) + L(circ(62, 43, 3.4), C.sun, .5)
      + L(rect(3, 3, 74, 7, 3.5), C.wood, .9) + circ(5, 6.500, 4)(C.wood2) + circ(75, 6.500, 4)(C.wood2),
    memoboard: () => L(rect(4, 4, 58, 44, 6), C.wood, 1.2)
      + rect(10, 10, 46, 32, 3)(C.wood3) + `<rect x="10" y="10" width="46" height="3" rx="1.500" fill="${C.ink}" opacity=".2"/>`
      + L(rect(14, 14, 16, 14, 2, 'rotate(-5 22 21)'), mix(C.sun, C.paper, .5), .5) + rect(17, 18.500, 9, 1.400, .7, 'rotate(-5 22 21)')(C.wood) + rect(17, 22.500, 6, 1.400, .7, 'rotate(-5 22 21)')(C.wood)
      + L(rect(36, 15, 15, 13, 2, 'rotate(4 43 22)'), C.a2l, .5)
      + L(path('M24 39.500s-5.400-3.200-5.400-6.600c0-1.700 1.300-2.800 2.700-2.800 1 0 1.900.500 2.700 1.500.800-1 1.700-1.500 2.700-1.500 1.400 0 2.700 1.100 2.700 2.800 0 3.400-5.400 6.600-5.400 6.600z'), C.a1, .4)
      + rect(37, 33, 13, 1.800, .9)(C.wood) + rect(37, 37, 9, 1.800, .9)(C.wood)
      + circ(22, 14, 2.1)(C.a1d) + circ(44, 15, 2.1)(C.a2d),
    familywall: () => L(rect(4, 14, 30, 36, 4), C.paper, 1) + rect(8, 18, 22, 28, 2)(mix(C.sun, C.paper, .55)) + circ(19, 32, 8)(C.wood) + circ(19, 34, 4.500)(C.wood3) + circ(16, 30.500, 1.300)(C.ink) + circ(22, 30.500, 1.300)(C.ink)
      + L(rect(40, 4, 36, 28, 4), C.a1l, 1) + rect(44, 8, 28, 20, 2)(mix(C.a2, C.paper, .7)) + circ(52, 19, 6)(C.sun) + circ(64, 19, 6)(C.paper) + circ(62.500, 18, 1)(C.ink) + circ(66, 18, 1)(C.ink)
      + L(rect(82, 16, 26, 34, 4), C.rug, 1) + rect(86, 20, 18, 26, 2)(mix(C.rug, C.paper, .6)) + circ(95, 33, 7)(C.a1l) + circ(92.500, 31.500, 1.200)(C.ink) + circ(97.500, 31.500, 1.200)(C.ink)
      + L(rect(44, 38, 28, 20, 4), C.leafl, 1) + rect(48, 42, 20, 12, 2)(C.paper) + path('M58 53s-5.600-3.200-5.600-6.700c0-1.800 1.400-2.900 2.800-2.900 1 0 2 .600 2.800 1.600.800-1 1.800-1.600 2.800-1.600 1.400 0 2.800 1.100 2.800 2.900 0 3.500-5.600 6.700-5.600 6.700z')(C.a1),

    /* ---- 手畫第三批的前半（2026-11-27）：森林露營 6 件、海邊 6 件、太空 6 件、客廳的魚缸。畫法跟前兩批一樣。
       外框、坐的位置、燈會亮的位置都跟原本一樣；魚缸裡的魚和泡泡照舊會動（class fz、fzb，css 在 style.css） ---- */
    // 森林露營
    campfire: () => L(rect(8, 40, 44, 7, 3.5, 'rotate(-14 30 43.500)'), C.wood, .9) + circ(51, 38.300, 3.2)(C.wood3)
      + L(rect(8, 40, 44, 7, 3.5, 'rotate(14 30 43.500)'), C.wood3, 1) + circ(9, 38.300, 3.2)(C.wood)
      + L(path('M30 6c8 9 14 15 14 23a14 14 0 0 1-28 0c0-6 4-9 6-14 3 3 4 5 4 8 3-5 5-10 4-17z'), C.a1, 1)
      + path('M30 22c4 5 7 8 7 12a7 7 0 0 1-14 0c0-4 4-6 7-12z')(C.sun),
    stump: () => L(path('M6 14v20c0 4 9 6 19 6s19-2 19-6V14z'), C.wood, 1.2)
      + rect(13, 23, 2.6, 9, 1.3)(C.wood2) + rect(33, 26, 2.6, 8, 1.3)(C.wood2)
      + L(ell(25, 14, 19, 8), C.wood3, .7) + ell(25, 14, 11, 4.4)(mix(C.wood3, C.wood, .45)) + ell(25, 14, 6.5, 2.5)(C.wood3) + ell(25, 14, 3, 1.2)(C.wood)
      + L(path('M41 24c2-5 7-6 9-3-1 4-5 6-9 3z'), C.leaf, .5),
    minitent: () => L(rect(2, 64.500, 92, 4.5, 2.2), C.wood, .6)
      + L(path('M48 6L6 66h84z'), mix(C.a1, C.sun, .45), 1.4)
      + path('M48 6L30 66h36z')(C.wood2)
      + path('M48 6L30 66h-9z')(mix(C.a1, C.sun, .7)) + path('M48 6l18 60h9z')(mix(C.a1, C.sun, .7))
      + rect(47, 0, 2, 8, 1)(C.wood2) + L(path('M49 .500l9 3-9 3z'), C.a1, .4),
    lightstring: () => strip('M4 6c30 13 74 13 104 0', C.wood2, 1.4)
      + [[18, 15, 'sun'], [37, 20, 'a1'], [56, 22, 'a2'], [75, 20, 'leafl'], [94, 15, 'sun']].map(([x, y, k]) => rect(x - 2.5, y - 2, 5, 4, 1)(C.wood2) + L(ell(x, y + 7, 5, 6.5), C[k], .5) + ell(x - 1.4, y + 5, 1.5, 2.2)(mix(C[k], C.paper, .55))).join(''),
    picnicmat: () => { const top = f => 22 + 76 * f, bot = f => 4 + 112 * f, xl = y => 22 - 18 * (y - 4) / 36, xr = y => 98 + 18 * (y - 4) / 36;
      const v = [[.16, .28], [.44, .56], [.72, .84]].map(([f0, f1]) => `M${top(f0)} 4H${top(f1)}L${bot(f1)} 40H${bot(f0)}z`).join('');
      const h = [[11, 17], [25, 32]].map(([y0, y1]) => `M${xl(y0)} ${y0}H${xr(y0)}L${xr(y1)} ${y1}H${xl(y1)}z`).join('');
      return L(path('M22 4h76l18 36H4z'), C.paper, .8) + `<path d="${v}" fill="${C.a1}" opacity=".5"/><path d="${h}" fill="${C.a1}" opacity=".5"/>`; },
    crate: () => L(rect(4, 6, 52, 40, 4), C.wood3, 1.3)
      + rect(4, 17.500, 52, 2.6)(C.wood) + rect(4, 31.500, 52, 2.6)(C.wood) + rect(11, 6, 6, 40)(C.wood) + rect(43, 6, 6, 40)(C.wood)
      + [[14, 11.500], [46, 11.500], [14, 40], [46, 40]].map(([x, y]) => circ(x, y, 1.3)(C.wood2)).join(''),
    // 海邊
    deckchair: () => strip('M14 58l20-34M60 58l18-22M30 58h54', C.wood, 3.2)
      + L(path('M8 44L30 8l14 6-12 26 50 4-2 10z'), C.paper, 1.2)
      + `<path d="M14.500 33.500l12 5.500M21 22.500l14 6M27.500 12l14 6M44 41l-1 10M58 42.500l-1 9.500M72 43.500l-1 9.500" fill="none" stroke="${C.a2}" stroke-width="4"/>`,
    swimring: () => L(ell(32, 19, 28, 14), C.paper, 1.1)
      + `<clipPath id="pp-ring"><ellipse cx="32" cy="19" rx="28" ry="14"/></clipPath><path clip-path="url(#pp-ring)" d="M6 8l14 10M58 8L44 18M6 30l14-9M58 30l-14-9" fill="none" stroke="${C.a1}" stroke-width="8"/>`
      + ell(32, 17, 11, 5)(mix(C.a2, C.paper, .45)) + `<path d="M21 17a11 5 0 0 1 22 0a11 3.600 0 0 0-22 0z" fill="${C.ink}" opacity=".22"/>`,
    shelllamp: () => L(ell(26, 44, 14, 4), C.a1l, .7)
      + L(path('M26 42C8 40 4 22 10 12c5-8 27-8 32 0 6 10 2 28-16 30z'), mix(C.a1l, C.paper, .5), 1.2)
      + strip('M26 40V10M26 40L14 15M26 40l12-25M26 40L9 25M26 40l17-15', C.a1l, 1.8)
      + L(circ(26, 38, 3.6), C.sun, .4),
    sandcastle: () => { const sl = mix(C.sun, C.paper, .5), sd = mix(C.sun, C.wood, .34), dk = mix(C.wood, C.sun, .25);
      return L(path('M6 54c2-6 50-6 52 0z'), sd, .7)
        + L(both(rect(12, 28, 40, 24, 3), rect(13, 24, 5, 6, 1), rect(22, 24, 5, 6, 1), rect(37, 24, 5, 6, 1), rect(46, 24, 5, 6, 1)), sl, 1)
        + L(both(rect(8, 20, 14, 32, 3), rect(42, 20, 14, 32, 3), rect(8, 16, 4, 6, 1), rect(18, 16, 4, 6, 1), rect(42, 16, 4, 6, 1), rect(52, 16, 4, 6, 1)), mix(sl, sd, .3), 1.2)
        + L(both(rect(24, 12, 16, 24, 3), rect(24, 8, 4, 6, 1), rect(30, 8, 4, 6, 1), rect(36, 8, 4, 6, 1)), sl, 1)
        + path('M27 52v-9a5 5 0 0 1 10 0v9z')(dk) + circ(15, 31, 1.9)(dk) + circ(49, 31, 1.9)(dk)
        + rect(31, 1, 1.8, 9, .9)(C.wood2) + L(path('M32.800 1.500l8 2.800-8 2.800z'), C.a1, .4); },
    parasol: () => rect(40.500, 22, 3, 70, 1.5)(C.wood) + L(ell(42, 93, 12, 3.5), C.wood3, .7)
      + L(path('M4 34C8 14 24 6 42 6s34 8 38 28c-6-5-13-5-19 0-6-5-13-5-19 0-6-5-13-5-19 0-6-5-13-5-19 0z'), C.paper, 1.4)
      + path('M42 6c-7 6-10 16-10 28 6-5 13-5 19 0 0-12-3-22-9-28zM42 6C28 8 16 16 4 34c6-5 13-5 19 0 2-12 8-22 19-28zM42 6c14 2 26 10 38 28-6-5-13-5-19 0-2-12-8-22-19-28z')(mix(C.a1, C.sun, .4))
      + circ(42, 5, 2.6)(C.a1d),
    boatbed: () => rect(60.500, 8, 3, 34, 1.5)(C.wood) + L(path('M64 9l26 28H64z'), C.paper, .9) + L(path('M60 14L42 37h18z'), C.a2l, .8)
      + L(path('M6 42h112c-2 16-12 26-28 26H34C18 68 8 58 6 42z'), C.a2, 1.5)
      + path('M9.500 52h105l-2.200 5H11.700z')(C.paper)
      + L(rect(18, 36, 88, 12, 6), C.paper, .8) + L(rect(22, 33, 26, 12, 6), C.a1l, .7),
    // 太空
    rocketbed: () => rect(18, 58, 4, 10, 2)(C.rug) + rect(98, 58, 4, 10, 2)(C.rug)
      + L(path('M14 20l-10-8v48l10-8z'), C.a1, 1)
      + L(path('M14 18h74c20 0 34 10 40 18-6 8-20 18-40 18H14z'), C.paper, 1.5)
      + path('M94 18.500c16 2 28 10 33 17.500-5 7.500-17 15.500-33 17.500z')(C.a1) + rect(88, 18, 6, 36)(C.rug)
      + L(circ(74, 36, 9), C.rug, .6) + circ(74, 36, 6.2)(C.sky) + circ(72, 34, 1)(C.paper) + circ(76.500, 38, .8)(C.paper)
      + L(rect(22, 26, 36, 20, 8), C.a1l, .7),
    planetlamp: () => L(ell(27, 86, 13, 4), C.rug, .7) + rect(25, 44, 4, 42, 2)(C.paper)
      + L(circ(27, 24, 16), C.sun, 1.3)
      + strip('M13 19c8 3 20 3 28 0M12 28c9 3 21 3 30 0', mix(C.sun, C.wood, .3), 2.2)
      + `<ellipse cx="27" cy="25" rx="25" ry="6.500" fill="none" stroke="${C.a1}" stroke-width="2.600" transform="rotate(-16 27 25)"/>`,
    moonchair: () => L(ell(34, 67, 20, 4), C.rug, .7)
      + L(path('M44 6C22 8 8 22 8 40s14 26 34 26c8 0 14-2 18-6-14 0-26-8-26-22 0-14 4-24 10-32z'), C.sun, 1.5)
      + L(ell(42, 50, 14, 6), C.paper, .7)
      + circ(20, 30, 2.6)(mix(C.sun, C.wood, .3)) + circ(24, 46, 2)(mix(C.sun, C.wood, .3)) + circ(15, 41, 1.4)(mix(C.sun, C.wood, .3)),
    telescope: () => strip('M36 44L18 78M36 44l18 34M36 44v36', C.wood, 3)
      + `<g transform="rotate(-28 36 34)">` + L(rect(6, 26, 46, 16, 6), C.rug, 1.2) + L(rect(48, 23, 16, 22, 5), C.paper, 1) + rect(60, 25, 4, 18, 2)(C.a2l) + rect(0, 29, 9, 10, 3)(mix(C.ink, C.paper, .3)) + rect(20, 26, 4, 16)(mix(C.rug, C.paper, .4)) + `</g>`
      + L(circ(36, 44, 4.4), C.sun, .5),
    meteorstool: () => { const st = mix(C.rug, C.paper, .22), dk = mix(C.rug, C.ink, .22);
      return L(path('M8 26c-4-10 6-20 20-20s24 8 20 20c-3 10-12 12-20 12S11 36 8 26z'), st, 1.2)
        + ell(27, 12, 15, 4.5)(mix(st, C.paper, .35))
        + ell(20, 19, 5, 3.4)(dk) + ell(35, 26, 4, 2.8)(dk) + ell(36, 14, 2.6, 1.8)(dk) + ell(16, 28, 2.2, 1.5)(dk); },
    capsulecab: () => rect(12, 84, 4, 6, 2)(C.rug) + rect(48, 84, 4, 6, 2)(C.rug)
      + L(rect(8, 6, 48, 80, 24), C.paper, 1.5)
      + L(circ(32, 30, 13), C.rug, .7) + circ(32, 30, 9.5)(C.sky) + circ(28.500, 27, 1.100)(C.paper) + circ(35, 33, .9)(C.paper) + circ(35.500, 25.500, .7)(C.paper)
      + L(rect(16, 52, 32, 24, 6), mix(C.rug, C.paper, .55), .6) + circ(32, 64, 2.4)(C.rug)
      + circ(20, 46, 1.8)(C.a1) + circ(26.500, 46, 1.8)(C.sun) + circ(33, 46, 1.8)(C.a2),
    // 魚缸：兩條魚（fz1、fz2）和泡泡（fzb）會動
    fishtank: () => { const gl = mix(C.a2, C.paper, .62), wt = mix(C.a2, C.paper, .38);
      return L(rect(10, 56, 64, 8, 3), C.wood3, .8)
        + L(rect(6, 8, 72, 50, 10), gl, 1.4)
        + path('M8 22c10-4 16 4 26 0s16-4 26 0 12 2 16 0v26a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8z')(wt)
        + path('M12 56c6-6 16-5 22-2 8-4 18-4 24 0 6-3 12-2 14 2z')(mix(C.sun, C.paper, .5))
        + strip('M18 55c0-8 3-10 2-16M26 55c1-6-2-9 0-13M64 55c0-7 3-9 2-14', C.leaf, 2.4)
        + `<g class="fz fz1">${path('M30 30c5-5 13-5 17 0-4 5-12 5-17 0z')(C.a1)}${path('M31 30l-7-4.500v9z')(C.a1)}${circ(43, 29, 1)(C.ink)}</g>`
        + `<g class="fz fz2">${path('M60 43c-4-4-10-4-13 0 3 4 9 4 13 0z')(C.sun)}${path('M59 43l6-3.500v7z')(C.sun)}${circ(50, 42.200, .9)(C.ink)}</g>`
        + `<g class="fzb" fill="none" stroke="${C.paper}" stroke-width="1.300"><circle cx="66" cy="34" r="2"/><circle cx="63" cy="26" r="1.400"/><circle cx="67" cy="19" r="1"/></g>`
        + path('M13 17c3-4 8-5.500 13-5.500l.500 2.600c-4 0-8 1.300-11 4.500z')(C.paper)
        + rect(6, 8, 72, 5, 2.5)(mix(gl, C.paper, .5)); },

    /* ---- 手畫第三批的後半（2026-11-27）：廚房 3 件、閣樓 3 件、節日 10 件。到這裡 71 件家具都是手畫的了。
       節日的照一般的樣子畫（燈籠、春字、南瓜、小松樹……），不仿現成的角色或商品 ---- */
    // 廚房
    fridge: () => rect(10, 97, 7, 5, 2)(C.paperd) + rect(45, 97, 7, 5, 2)(C.paperd)
      + L(rect(6, 4, 50, 96, 9), C.paper, 1.5)
      + rect(6, 37, 50, 2.6)(C.paperd) + rect(45, 14, 5, 16, 2.5)(C.a2) + rect(45, 46, 5, 26, 2.5)(C.a2)
      + L(rect(14, 12, 14, 11, 2, 'rotate(-6 21 17)'), mix(C.sun, C.paper, .45), .4) + rect(17, 15.500, 8, 1.300, .6, 'rotate(-6 21 17)')(C.wood3) + rect(17, 18.500, 5, 1.300, .6, 'rotate(-6 21 17)')(C.wood3)
      + L(path('M22 62s-6-3.600-6-7.400c0-2 1.400-3.200 3-3.200 1.100 0 2.200.600 3 1.700.800-1.100 1.900-1.700 3-1.700 1.600 0 3 1.200 3 3.200C28 58.400 22 62 22 62z'), C.a1, .4),
    stove: () => strip('M48 10c-2-3 2-4 0-7M58 10c-2-3 2-4 0-7', C.paperd, 1.8)
      + L(rect(42, 13.500, 24, 8, 2), C.a2, .6) + rect(66, 15, 10, 2.6, 1.3)(C.a2d) + rect(39, 12, 30, 2.8, 1.4)(C.a2l)
      + L(rect(6, 26, 74, 48, 7), C.a1l, 1.4)
      + L(rect(16, 41, 54, 26, 5), C.paper, .6) + rect(22, 47, 42, 14, 3)(mix(C.ink, C.paper, .25)) + rect(28, 36.200, 30, 2.8, 1.4)(C.a1d)
      + L(rect(4, 20, 78, 10, 5), C.paper, 1.1)
      + circ(15, 34.500, 2.1)(C.a1d) + circ(22.500, 34.500, 2.1)(C.a1d),
    dinetable: () => rect(18, 26, 7, 34, 3)(C.wood2) + rect(87, 26, 7, 34, 3)(C.wood2)
      + L(ell(56, 26, 52, 14), C.wood3, 1.4) + ell(56, 24, 42, 9)(C.paper)
      + ell(34, 23.500, 10, 4)(C.paperd) + L(circ(34, 21.500, 4), C.sun, .3)
      + ell(76, 24.500, 10, 4)(C.paperd) + L(path('M70 23c3-5.500 9-5.500 12 0z'), C.a1l, .3)
      + L(rect(52, 9, 8, 12, 2.5), C.a2, .5) + rect(53.500, 10.500, 5, 2, 1)(C.a2l),
    // 閣樓
    trunk: () => strip('M33 11c0-7 16-7 16 0', C.wood2, 2.6)
      + L(rect(6, 10, 70, 40, 7), C.wood, 1.4)
      + rect(6, 23, 70, 2.6)(C.wood2)
      + L(both(rect(20, 8, 8, 44, 2), rect(54, 8, 8, 44, 2)), C.wood3, .6)
      + L(rect(36, 19, 10, 10, 2), C.sun, .5) + circ(41, 24, 1.5)(C.wood2)
      + [[11, 15], [71, 15], [11, 45], [71, 45]].map(([x, y]) => circ(x, y, 1.6)(C.wood3)).join(''),
    floorpad: () => L(ell(42, 22, 38, 14), C.rug, 1.1)
      + ell(42, 18, 30, 9)(mix(C.rug, C.paper, .5))
      + strip('M42 18L20 14M42 18l22-4M42 18l-14 8M42 18l14 8', mix(C.rug, C.paper, .15), 1.4)
      + circ(42, 18, 2.8)(C.rug),
    starlight: () => L(ell(23, 56, 12, 4), mix(C.sun, C.paper, .4), .7) + rect(21, 40, 4, 16, 2)(C.paper)
      + L(star(23, 23, 21, 10), C.sun, 1.1)
      + circ(19, 21.500, 1.4)(C.wood2) + circ(27, 21.500, 1.4)(C.wood2) + strip('M20 26c2 2 4 2 6 0', C.wood2, 1.4),
    // 節日
    lantern: () => { const red = mix(C.a1, '#d93a34', .6), gold = mix(C.sun, C.wood, .25);
      return rect(19, 0, 2, 9, 1)(gold) + [16, 20, 24].map((x, i) => rect(x - 1, 50, 2, i === 1 ? 13 : 10, 1)(gold)).join('')
        + L(ell(20, 30, 17, 18), red, 1.2) + ell(20, 30, 10.500, 18)(mix(red, C.paper, .16)) + ell(20, 30, 4, 18)(red)
        + L(rect(13, 7, 14, 5, 2), gold, .4) + L(rect(13, 46, 14, 5, 2), gold, .4); },
    couplet: () => { const red = mix(C.a1, '#d93a34', .6), gold = mix(C.sun, C.paper, .2);
      return L(rect(10, 10, 28, 28, 3, 'rotate(45 24 24)'), red, 1)
        + `<rect x="14" y="14" width="20" height="20" rx="2" transform="rotate(45 24 24)" fill="none" stroke="${gold}" stroke-width="1.400"/>`
        + `<text x="24" y="30.500" text-anchor="middle" font-size="17" font-weight="700" fill="${gold}" font-family="GenSenRounded,PingFang TC,Noto Sans TC,sans-serif">春</text>`; },
    petal: () => { const pk = mix(C.a1l, C.paper, .4), fl = both(...[0, 72, 144, 216, 288].map(a => c => `<ellipse cx="0" cy="-4" rx="3" ry="4.400" transform="translate(0 10) rotate(${a})" fill="${c}"/>`));
      return strip('M4 6c22 16 62 16 84 0', C.wood2, 1.4)
        + [[14, 12], [28, 17], [46, 19], [64, 17], [78, 12]].map(([x, y]) => `<g transform="translate(${x} ${y})">${rect(-.6, 0, 1.2, 5)(C.wood2)}${L(fl, pk, .5)}${circ(0, 10, 1.9)(C.sun)}</g>`).join(''); },
    melon: () => L(path('M4 16v8c0 8 14 13 31 13s31-5 31-13v-8z'), C.leaf, 1.2)
      + strip('M14 23v10M26 25v11M44 25v11M56 23v10', C.leafd, 2.6)
      + L(ell(35, 16, 31, 11), C.paper, .6) + ell(35, 16, 27, 8.4)(mix(C.a1, '#ee5068', .5))
      + [[22, 14], [30, 19], [38, 13], [46, 18], [28, 11], [42, 10]].map(([x, y]) => ell(x, y, 1.2, 1.9)(C.wood2)).join(''),
    moonlamp: () => L(ell(22, 57, 14, 4), mix(C.sun, C.paper, .5), .7) + rect(20.500, 43, 3, 13, 1.5)(mix(C.sun, C.wood, .3))
      + L(path('M29 5a20 20 0 1 0 0 40a25 25 0 0 1 0-40z'), C.sun, 1.2)
      + circ(13.500, 20, 2)(mix(C.sun, C.wood, .25)) + circ(14.500, 32, 1.4)(mix(C.sun, C.wood, .25))
      + L(star(35.500, 18, 5, 2.200), mix(C.sun, C.a1, .35), .3),
    rabbit: () => { const gold = mix(C.sun, C.wood, .25);
      return rect(10, 43, 34, 2, 1)(gold) + L(circ(15, 44, 4), C.sun, .4) + L(circ(39, 44, 4), C.sun, .4)
        + L(both(path('M37 22c-3-10 0-19 4-19s4 9-1 19z'), path('M42 23c0-9 5-16 8-15s1 9-5 16z')), C.paper, .8)
        + path('M39 19c-1.500-7 0-12 1.800-12s2 5-.300 12z')(C.a1l) + path('M44.500 20c.500-5 3-8.500 4.500-8s.500 4.500-3 8.500z')(C.a1l)
        + L(ell(26, 31, 21, 11), C.paper, 1.1)
        + strip('M14 23c4 3 4 12 0 16M23 21c4 4 4 15 0 20', C.a1l, 2.2)
        + circ(40, 28, 1.8)(mix(C.a1, '#d93a34', .6)) + ell(44, 32, 2.4, 1.4)(C.a1l); },
    pumpkin: () => { const og = mix(C.a1, C.sun, .38), lt = mix(C.sun, C.paper, .4);
      return strip('M25 11c0-5 2-8 6-9', C.leaf, 2.8)
        + L(ell(25, 28, 22, 16), og, 1.2) + ell(25, 28, 13.500, 16)(mix(og, C.paper, .16)) + ell(25, 28, 5, 16)(og)
        + path('M14 25l4.500-5 4.500 5zM27 25l4.500-5 4.500 5z')(lt) + path('M15 31c4 5 16 5 20 0l-3 2-3-2-4 2-4-2-3 2z')(lt); },
    pine: () => L(path('M16 68h18l-3 12H19z'), C.a1, .7) + rect(21, 62, 8, 7)(C.wood)
      + L(path('M25 10L9 36h8L4 62h42L33 36h8z'), C.leaf, 1.3) + path('M25 10L9 36h32z')(C.leafl)
      + `<path d="M14 46c8 4 16 4 24-2M18 28c5 3 10 3 15-1" fill="none" stroke="${C.paper}" stroke-width="2" stroke-dasharray=".1 4.200" stroke-linecap="round"/>`
      + circ(18, 52, 3)(mix(C.a1, '#d93a34', .6)) + circ(33, 54, 3)(C.sun) + circ(27, 40, 2.6)(C.a2l) + circ(21, 33, 2.2)(C.a1l)
      + L(star(25, 9, 8.500, 3.800), C.sun, .5),
    snowflake: () => { const f = c => `<g fill="none" stroke="${c}" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="3" d="M20 3v34M5.300 11.500l29.400 17M5.300 28.500l29.400-17"/><path stroke-width="2.200" d="M15 5l5 5 5-5M15 35l5-5 5 5M4.500 17.500l6.600-1.600-1.600-6.600M35.500 22.500l-6.600 1.600 1.600 6.600M4.500 22.500l6.600 1.600-1.600 6.600M35.500 17.500l-6.600-1.600 1.600-6.600"/></g>`;
      return L(f, mix(C.a2, C.paper, .6), .6) + circ(20, 20, 3.2)(C.paper); },
    cake: () => L(ell(23, 48, 22, 3.4), C.paper, .5)
      + L(rect(3, 31, 40, 15, 4), C.a1l, .9)
      + L(rect(7, 19, 32, 14, 4), C.paper, .8)
      + path('M7 25v-2a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v2c-3 3-5 3-8 0s-5 3-8 0-5 3-8 0-5 3-8 0z')(C.a1l)
      + circ(12, 18, 2.6)(mix(C.a1, '#d93a34', .6)) + circ(34, 18, 2.6)(mix(C.a1, '#d93a34', .6))
      + rect(21.500, 9, 3, 10, 1)(C.a2) + path('M23 2c-3 3-3 6 0 7 3-1 3-4 0-7z')(C.sun),
  };
  /* ---------- 其他家具、每一間固定的構造：自動轉成紙雕的畫法 ---------- */
  // 一個顏色換成色票裡最接近的：先看是白、灰還是有顏色，有顏色的照色相分到木頭、主色、黃、綠、青、紫幾家，再照深淺挑
  function pick(c){
    if (typeof c !== 'string') return c;
    let h = c.trim().toLowerCase();
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(h)) return c;
    if (h.length === 4) h = '#' + [1, 2, 3].map(i => h[i] + h[i]).join('');
    const [r, g, b] = hex(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let hue = 0;
    if (d){ hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hue = (hue * 60 + 360) % 360; }
    if (l > .93 && sat < .5) return C.paper;
    if (sat < .14) return l > .72 ? C.paperd : l > .42 ? mix(C.paper, C.ink, .45) : mix(C.ink, C.paper, .22);
    const lv = (lo, mid, hi) => (l > .78 ? hi : l > .5 ? mid : lo);
    if (hue < 14 || hue >= 318) return lv(C.a1d, C.a1, C.a1l);                                   // 紅、粉紅 → 主色
    if (hue < 42) return sat < .62 || l < .55 ? lv(C.wood2, C.wood, C.wood3) : lv(C.a1d, mix(C.a1, C.sun, .35), mix(C.sun, C.a1l, .4));   // 咖啡、橘
    if (hue < 68) return lv(mix(C.sun, C.wood, .45), C.sun, mix(C.sun, C.paper, .45));           // 黃
    if (hue < 170) return lv(C.leafd, C.leaf, C.leafl);                                          // 綠
    if (hue < 252) return lv(C.a2d, C.a2, C.a2l);                                                // 青、藍
    return lv(mix(C.rug, C.ink, .3), C.rug, mix(C.rug, C.paper, .4));                            // 紫
  }
  // 線（紋路、縫線）：比同一家的色塊深一點，疊在色塊上才看得到；白線照舊是紙色
  const line = c => { const v = pick(c); return v === C.paper ? v : mix(v, C.ink, .22); };
  const PZ = new Map(), SER = new XMLSerializer();
  const isWhite = v => /^#(fff|ffffff)$/i.test((v || '').trim());
  // 處理一個元素：回傳 false 表示這個元素整個拿掉（亮面的反光）
  function pz(el, inh){
    if (el.nodeType !== 1) return true;
    const tag = el.nodeName.toLowerCase();
    if (tag === 'defs' || tag === 'clippath'){ return true; }
    const fill = el.getAttribute('fill'), stroke = el.getAttribute('stroke'), op = el.getAttribute('opacity');
    // 半透明的白色塊、白色線：原本用來做亮面的反光，紙沒有反光
    if (op !== null && +op < 1 && (isWhite(fill) || (isWhite(stroke) && (!fill || fill === 'none')))) return false;
    const effFill = fill !== null ? fill : inh.fill;
    if (tag === 'g'){
      if (fill !== null && fill !== 'none') el.setAttribute('fill', pick(fill));
      if (stroke !== null){ if (effFill && effFill !== 'none') ['stroke', 'stroke-width', 'stroke-linejoin', 'stroke-linecap'].forEach(a => el.removeAttribute(a)); else el.setAttribute('stroke', line(stroke)); }
      const next = {fill: effFill, stroke: el.getAttribute('stroke') !== null ? el.getAttribute('stroke') : inh.stroke};
      [...el.children].forEach(ch => { if (pz(ch, next) === false) ch.remove(); });
      return true;
    }
    const filled = effFill && effFill !== 'none';
    if (filled){
      if (fill !== null) el.setAttribute('fill', pick(fill));
      // 色塊不要描邊。只有「沒有面積的線」（例如一條直線）還是要靠線才看得到
      const d = tag === 'path' ? el.getAttribute('d') || '' : '';
      const isLine = tag === 'path' && fill === null && !/[zZ]/.test(d) && stroke !== null;
      if (isLine) el.setAttribute('stroke', line(stroke));
      else ['stroke', 'stroke-width', 'stroke-linejoin', 'stroke-linecap', 'stroke-dasharray'].forEach(a => el.removeAttribute(a));
    } else {
      if (stroke !== null) el.setAttribute('stroke', line(stroke));
      // 沒寫 fill 也沒寫線的 path：瀏覽器會用黑色填，換成墨色
      if (fill === null && stroke === null && !inh.stroke && !inh.fill && tag !== 'text') el.setAttribute('fill', C.ink);
    }
    if (tag === 'text' && fill !== null) el.setAttribute('fill', pick(fill));
    [...el.children].forEach(ch => { if (pz(ch, {fill: effFill, stroke: stroke !== null ? stroke : inh.stroke}) === false) ch.remove(); });
    return true;
  }
  // 影子：把一塊複製一份、全部塗成墨色、往下錯開一點放在它下面。會動的（有 class 的）不加，不然影子不會跟著動
  function shadowOf(el){
    const tag = el.nodeName.toLowerCase();
    if (el.nodeType !== 1 || tag === 'defs' || tag === 'clippath' || tag === 'text' || el.getAttribute('class')) return null;
    const f = el.getAttribute('fill');
    const hasArea = tag === 'g' ? !!el.querySelector('[fill]:not([fill="none"])') || (f && f !== 'none') : f && f !== 'none';
    if (!hasArea) return null;
    const c = el.cloneNode(true);
    const g = el.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
    [c, ...c.querySelectorAll('*')].forEach(n => {
      if (n.getAttribute('fill') && n.getAttribute('fill') !== 'none') n.setAttribute('fill', C.ink);
      if (n.getAttribute('stroke')) n.setAttribute('stroke', C.ink);
      n.removeAttribute('id'); n.removeAttribute('opacity'); n.removeAttribute('class');
      [...n.attributes].forEach(at => { if (at.name.startsWith('data-')) n.removeAttribute(at.name); });
    });
    g.setAttribute('pointer-events', 'none');
    g.setAttribute('opacity', '.2'); g.setAttribute('transform', 'translate(0 1.15)');
    g.appendChild(c);
    return g;
  }
  const noNs = t => t.replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');
  // inner：<svg> 裡面的東西（家具）。full：整個 <svg …>…</svg>（固定的構造）
  function paperize(markup, key, full){
    const k = key === null ? null : key + '|' + phase;
    if (k !== null && PZ.has(k)) return PZ.get(k);
    let out = markup;
    try {
      const doc = new DOMParser().parseFromString(full ? markup.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ') : `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml');
      const root = doc.documentElement;
      if (root && root.nodeName.toLowerCase() === 'svg' && !doc.querySelector('parsererror')){
        [...root.children].forEach(ch => { if (pz(ch, {fill: null, stroke: null}) === false) ch.remove(); });
        [...root.children].forEach(ch => { const sdw = shadowOf(ch); if (sdw) root.insertBefore(sdw, ch); });
        out = full ? noNs(SER.serializeToString(root)).replace('<svg ', '<svg ') : [...root.childNodes].map(n => noNs(SER.serializeToString(n))).join('');
      }
    } catch (e) { console.info('[paper] 這一件轉不了，先用原本的畫法', key, e); }
    if (k === null) return out;
    PZ.set(k, out);
    if (PZ.size > 600) PZ.delete(PZ.keys().next().value);
    return out;
  }
  const PAPER_FURN = Object.keys(PF);      // 手畫的那幾件
  if (typeof FURN !== 'undefined') Object.keys(FURN).forEach(id => {
    if (PF[id]){ FURN[id].svg = PF[id]; return; }
    const orig = FURN[id].svg; if (typeof orig !== 'function') return;
    FURN[id].svg = () => paperize(orig(), 'f-' + id, false);
  });

  /* ---------- 窗戶：割開的洞 ---------- */
  function winPaper(){
    const night = C.dark, w = typeof skyWeather === 'function' && !(VISIT && VISIT.card) ? skyWeather() : 'sun';
    const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${both(ell(0, 0, 9, 3.6), ell(6, -2.6, 6.5, 4), ell(-5, -1.6, 5, 3))(w === 'rain' ? mix(C.cloud, C.ink, .25) : C.cloud)}</g>`;
    const sun = phase === 'night' ? circ(57, 19, 6.2)(C.sun) + circ(60, 16.6, 5.4)(C.sky)
      : w === 'sun' ? circ(57, 19, 6)(C.sun) : '';
    const stars = phase === 'night' ? [[18, 16], [30, 24], [46, 14], [24, 34], [64, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="${C.paper}" opacity=".85"/>`).join('') : '';
    const rain = w === 'rain' ? `<g stroke="${C.paper}" stroke-width="1.1" stroke-linecap="round" opacity=".5">${[[14, 14], [24, 24], [34, 12], [44, 28], [54, 16], [64, 26], [20, 36], [40, 40], [58, 38]].map(([x, y]) => `<path d="M${x} ${y}l-2 5"/>`).join('')}</g>` : '';
    return `<svg viewBox="0 0 80 62">
      ${L(rect(2, 2, 76, 54, 6), C.wood, 1.5)}
      <clipPath id="pp-win"><rect x="8" y="8" width="64" height="42" rx="3"/></clipPath>
      <g clip-path="url(#pp-win)">${rect(8, 8, 64, 42)(C.sky)}${stars}${sun}
        ${w === 'sun' ? cloud(24, 21, 1) : cloud(22, 19, 1.15) + cloud(50, 25, .95)}
        ${sh(path('M6 44Q24 28 40 39T74 34V52H6Z'), .8)}${path('M6 44Q24 28 40 39T74 34V52H6Z')(C.hill2)}
        ${sh(path('M6 48Q28 37 46 46T74 43V52H6Z'), .8)}${path('M6 48Q28 37 46 46T74 43V52H6Z')(C.hill)}
        ${rain}${typeof winSeason === 'function' && !(VISIT && VISIT.card) ? paperize(winSeason(phase === 'night'), 'win-season-' + todayStr().slice(5, 7), false) : ''}
        <path d="M8 8h64v3.6H11.6V50H8z" fill="${C.ink}" opacity=".26"/></g>
      ${rect(39.1, 8, 1.8, 42)(C.wood)}${rect(8, 28.1, 64, 1.8)(C.wood)}
      ${L(rect(0, 54, 80, 6, 2.5), C.wood2, 1.2)}
      ${L(path('M1 0h15c1 19-3 40-9 54H1z'), C.a2, 1.6)}</svg>`;
  }
  /* ---------- 門口：通往小島的門、通往隔壁的拱門 ---------- */
  const doorPaper = () => `<svg viewBox="0 0 60 100">
    ${L(rect(2, 4, 56, 96, 4), C.wood, 1.6)}
    <clipPath id="pp-door"><rect x="7" y="9" width="46" height="91"/></clipPath>
    <g clip-path="url(#pp-door)">${rect(7, 9, 46, 91)(C.sky)}${phase === 'night' ? circ(41, 24, 5.6)(C.sun) + circ(43.6, 21.8, 4.8)(C.sky) : circ(41, 24, 5.6)(C.sun)}
      ${both(ell(18, 38, 8, 3.2), ell(23, 35.6, 5.5, 3.6))(C.cloud)}
      ${path('M7 78q12-9 24-4t22-5v20H7z')(C.sea)}
      ${L(path('M7 90l22-13 24 12v11H7z'), C.leaf, .9)}${rect(37, 70, 2.4, 12, 1)(C.wood2)}${L(circ(38.2, 66, 6.4), C.leafl, .7)}
      <path d="M7 9h46v4H11v87H7z" fill="${C.ink}" opacity=".24"/></g>
    ${L(path('M7 9h11v91H7z'), C.wood3, 1.2)}${circ(14, 57, 1.9)(C.wood2)}</svg>`;
  const passPaper = (r, side) => `<svg viewBox="0 0 34 100"><g ${side === 'l' ? 'transform="translate(34 0) scale(-1 1)"' : ''}>
      ${L(path('M6 100V22c0-9 6-14 14-14h14v92z'), C.wood, 1.5)}
      ${path('M11 100V24c0-6 4-10 10-10h13v86z')(mix(C.wall2, C.ink, .35))}
      <path d="M11 100V24c0-6 4-10 10-10h13v4H23c-5 0-8 3-8 8v74z" fill="${C.ink}" opacity=".3"/>
      <g class="ph-no">${path('M24.500 50l6.500 6-6.500 6z')(C.sun)}</g></g>
    <g class="ph-no">${L(circ(side === 'l' ? 14 : 20, 30, 9.5), C.paper, 1.2)}</g>
    <g class="ph-no" transform="translate(${side === 'l' ? 6.5 : 12.5} 22.5) scale(.625)" fill="${C.ink}" style="color:${C.ink}">${(ICON[r] || '').replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;
  const lswPaper = () => `<svg viewBox="0 0 24 32">${L(rect(2, 2, 20, 28, 4), C.paper, 1)}${rect(7.5, 6.5, 9, 19, 3)(C.paperd)}<rect class="nub" x="9" y="7.6" width="6" height="8" rx="2.4" fill="${C.a1}"/></svg>`;

  const inLiving = () => typeof RIDS !== 'undefined' && RIDS.includes(roomId);   // 名字是第一版留下來的：現在五間房間都算
  // room.js 的 winSVG、rooms.js 的 FIX：換成紙雕的畫法
  { const prev = winSVG; winSVG = function(night){ return inLiving() ? winPaper() : prev(night); }; }
  { const d0 = FIX.yardDoor, p0 = FIX.pass;
    FIX.yardDoor = () => (inLiving() ? doorPaper() : d0());
    FIX.pass = (r, side) => (inLiving() ? passPaper(r, side) : p0(r, side));
    // 其他幾間固定的構造（臥室的小夜燈、浴室的磁磚、廚房的流理台和掛勾）：自動轉
    Object.keys(FIX).forEach(k => { if (k === 'yardDoor' || k === 'pass') return; const o = FIX[k]; FIX[k] = (...a) => paperize(o(...a), 'fix-' + k + '-' + a.join('-'), true); }); }
  const lsw = $('#lsw'), lsw0 = lsw ? lsw.innerHTML : '';
  // 每次畫房間：先定色調、標上「現在是不是新風格的客廳」，再照原本的流程畫
  { const prev = paintRoom; paintRoom = function(){
      const changed = tone();
      screen.classList.toggle('pp', inLiving());
      if (lsw) lsw.innerHTML = inLiving() ? lswPaper() : lsw0;
      prev();
      if (changed) refurnish();
    }; }
  // 天色換了：家具的顏色是寫在圖裡的，重畫一次（房間裡的和收納架上的）
  function refurnish(){
    room.querySelectorAll('.it:not(.doll)').forEach(el => { const it = items.find(i => String(i.uid) === el.dataset.u); if (it && FURN[it.id]) el.innerHTML = furnSVG(it.id); });
    if (typeof renderTray === 'function' && typeof tab !== 'undefined') try { renderTray(); } catch (e) {}
  }
  // 只有「房間那一頁的客廳」才算（小島、娃娃機不算）：合成一個 class，樣式都掛在 .ppon 下面
  const sync = () => {
    const on = screen.classList.contains('pp');   // 第一版只算客廳那一頁；現在房間、小島、娃娃機都算
    if (screen.classList.contains('ppon') !== on) screen.classList.toggle('ppon', on);
  };
  new MutationObserver(sync).observe(screen, {attributes: true, attributeFilter: ['class']});
  // 開著不關的時候，每五分鐘看一次天色有沒有換
  setInterval(() => { if (!document.hidden && curPhase() !== phase && typeof paintRoom === 'function') paintRoom(); }, 5 * 60000);
  // 拍照、明信片（js/photo.js 比這個檔晚載入，等全部載完再換）：牆和地板照新風格畫，不看玩家選的壁紙。紙紋理在照片裡不畫
  addEventListener('DOMContentLoaded', () => {
    const a = (c, o) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${o})`; };
    // 花紋：SVG 圖先畫成一張小畫布，再拿畫布做花紋。直接拿 SVG 圖做花紋（createPattern），iPhone 的瀏覽器會讓整張照片讀不出來（2026-11-27）
    const DECO_CV = {};
    const patFill = (ctx, key, x, y, w, h) => {
      const im = DECO_IMG[key]; if (!im || !im.complete || !im.naturalWidth) return;
      let e = DECO_CV[key];
      if (!e || e.src !== im.src) e = DECO_CV[key] = {src: im.src, cv: typeof photoRaster === 'function' ? photoRaster(im, im.naturalWidth * 3, im.naturalHeight * 3) : null};
      if (!e.cv){ if (typeof photoNote === 'function') photoNote('花紋 ' + key); return; }
      try { const p = ctx.createPattern(e.cv, 'repeat'); p.setTransform(new DOMMatrix().scale(1 / 3)); ctx.fillStyle = p; ctx.fillRect(x, y, w, h); } catch (err) {}
    };
    if (typeof paintWall === 'function') paintWall = async function(ctx, s, W, wh, kind){
      const w = wallOf(kind);
      ctx.fillStyle = w.c; ctx.fillRect(0, 0, W, wh);
      patFill(ctx, 'w-' + kind, 0, 0, W, wh);
      if (roomId !== 'attic'){ ctx.fillStyle = a(C.ink, .2); ctx.fillRect(0, wh * .69 - 2, W, 2); ctx.fillStyle = w.c2; ctx.fillRect(0, wh * .69, W, wh * .31); }
    };
    if (typeof paintFloor === 'function') paintFloor = function(ctx, s, W, H, wh, kind){
      const fh = H - wh, f = floorOf(kind);
      ctx.fillStyle = f.c; ctx.fillRect(0, wh, W, fh);
      patFill(ctx, 'f-' + kind, 0, wh, W, fh);
      const g = ctx.createLinearGradient(0, wh, 0, wh + fh * .26); g.addColorStop(0, a(C.ink, .26)); g.addColorStop(1, a(C.ink, 0));
      ctx.fillStyle = g; ctx.fillRect(0, wh, W, fh * .26);
      if (roomId === 'living'){
        const cx = W / 2, cy = wh + fh * .49, rx = W * .43, ry = fh * .25;
        ctx.fillStyle = a(C.ink, .24); ctx.beginPath(); ctx.ellipse(cx, cy + 3, rx, ry, 0, 0, 7); ctx.fill();
        ctx.fillStyle = C.rug; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = a(C.paper, .38); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 9, ry - 9, 0, 0, 7); ctx.stroke();
      }
    };
  });
  /* ---------- 娃娃機：是畫在畫布上的。把畫筆換顏色的那一步攔下來，每個顏色換成色票裡最接近的 ---------- */
  // 顏色對照記起來（一秒畫幾十次，不能每次都重算）；天色換了就清掉
  const CMAP = new Map(); let cmapPhase = '';
  const cmap = v => {
    if (typeof v !== 'string' || v[0] !== '#') return v;
    if (cmapPhase !== phase){ CMAP.clear(); cmapPhase = phase; }
    let m = CMAP.get(v); if (m === undefined){ m = pick(v); CMAP.set(v, m); }
    return m;
  };
  try {
    const cv = document.getElementById('claw'), cx = cv && cv.getContext('2d');
    if (cx){
      const proto = Object.getPrototypeOf(cx);
      ['fillStyle', 'strokeStyle', 'shadowColor'].forEach(k => {
        const d = Object.getOwnPropertyDescriptor(proto, k); if (!d || !d.set) return;
        Object.defineProperty(cx, k, {configurable: true, get(){ return d.get.call(this); }, set(v){ d.set.call(this, cmap(v)); }});
      });
      // 漸層的每一站也換
      ['createLinearGradient', 'createRadialGradient'].forEach(k => {
        const f = cx[k]; if (typeof f !== 'function') return;
        cx[k] = function(...a){ const g = f.apply(this, a), add = g.addColorStop; g.addColorStop = function(o, c){ return add.call(this, o, cmap(c)); }; return g; };
      });
    }
  } catch (e) { console.info('[paper] 娃娃機的顏色換不了，先用原本的', e); }
  // 小島：地圖是另外畫的一張圖（js/yard.js 比這個檔晚載入）。每次畫都轉一次，不記
  addEventListener('DOMContentLoaded', () => {
    if (typeof yardSVG === 'function'){ const y0 = yardSVG; yardSVG = function(...a){ const m = y0.apply(this, a); try { return paperize(m, null, /^\s*<svg/.test(m)); } catch (e) { return m; } }; }
  });
  document.documentElement.classList.add('look-paper');
  tone();
  window.PAPER = {furn: PAPER_FURN.slice(), tone: () => Object.assign({}, C), phase: () => phase};
})();
