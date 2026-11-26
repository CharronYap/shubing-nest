/* 新風格：紙雕立體・夜燈（2026-11-26）。同一天晚上使用者看過封面、娃娃機、小島後說「現在就改」，改成預設：
   不加參數就是新風格（從主畫面圖示開也是）；網址加 ?look=old 回到原本的樣子，這個檔就什麼都不做。選過的不記在存檔，網址有帶才算。
   index.html 最前面有一小段程式看同一個參數，先把 .look-paper 掛上去，第一眼才不會閃一下舊的顏色。
   第一版只換客廳（使用者看過說「可以，繼續換」）。現在五間房間都是新風格：牆、地板、窗戶和窗外、門口、每一間固定的構造、所有家具、
   上面的按鈕、收納架、對話框和提示。門外小島、娃娃機那一頁、封面還是原本的樣子。不改存檔、不改規則、不動玩法。
   家具：客廳最早那 7 件是手畫的（PF）；其他的用 paperize() 自動轉：拿掉描邊和亮面的反光、顏色換成色票裡最接近的那一個、
   每一塊下面加一塊往下錯開的影子。之後新增的家具不用另外畫，會自動轉。
   畫法（照 樣張/小窩風格樣板.html 的 B 款）：
   - 每一樣東西是色紙剪出來的色塊，沒有描邊；每一層下面有一塊往下錯開的深色影子，越前面錯得越多。
   - 窗戶是割開的洞：看得到後面的天空、遠山，洞的上緣和左緣有牆的厚度的影子；晚上周圍有一圈暖光。
   - 紙纖維紋理是一張小圖（img/paper/fiber.png），用色彩增值疊在牆、地板、收納架這些不會動的底上。
   - 娃娃的照片不重畫，當貼紙貼上去，腳下一塊橢圓的影子（不用濾鏡，娃娃在動的時候不會卡）。
   - 顏色直接寫進圖裡（不是用 CSS 變數），這樣拍照把家具轉成圖的時候顏色還在；天色換了就把家具重畫一次。
   字用 LXGW WenKai TC 的子集（fonts/，在 css/paper.css 宣告），只有新風格的畫面會載。
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
      ${path('M24.500 50l6.500 6-6.500 6z')(C.sun)}</g>
    ${L(circ(side === 'l' ? 14 : 20, 30, 9.5), C.paper, 1.2)}
    <g transform="translate(${side === 'l' ? 6.5 : 12.5} 22.5) scale(.625)" fill="${C.ink}" style="color:${C.ink}">${(ICON[r] || '').replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;
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
    const patFill = (ctx, key, x, y, w, h) => { const im = DECO_IMG[key]; if (!im || !im.complete || !im.naturalWidth) return; try { ctx.fillStyle = ctx.createPattern(im, 'repeat'); ctx.fillRect(x, y, w, h); } catch (e) {} };
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
