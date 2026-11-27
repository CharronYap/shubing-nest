/* 旅行第一版的資料（2026-11-26）：地方、行李用品、土產、明信片的圖和背面的話。玩法在 js/travel.js。
   全部自己寫、自己畫。明信片是印好的圖，顏色固定（不跟天色換）；畫法跟新風格一樣：色紙剪的色塊、沒有描邊、
   每一塊下面有一塊往下錯開的影子。娃娃的照片貼在上面（位置寫在每張的 at）。 */

/* ---------- 地方 ---------- */
// tier：1 近（2～3 小時）、2 中等（6～8 小時）、3 遠（20～30 小時）。fav：特別愛去的。sv：土產兩種
const TV_PLACES = {
  park:   {name: '公園', tier: 1, fav: ['dog', 'dino'], sv: ['acorn', 'leaf'], dir: '往公園的方向'},
  beach:  {name: '海邊', tier: 2, fav: ['moodeng', 'snoopy'], sv: ['shell', 'glass'], dir: '往海邊的方向'},
  market: {name: '夜市', tier: 2, fav: ['nyanko', 'piggy'], sv: ['snackbag', 'ringtoy'], dir: '往夜市的方向', night: 1},
  onsen:  {name: '山上的溫泉', tier: 3, fav: ['sloth', 'egg'], sv: ['onsenegg', 'woodtag'], dir: '往山上的方向'},
};
const TV_HOURS = {1: [2, 3], 2: [6, 8], 3: [20, 30]};
const TV_TIER_NAME = {1: '近的', 2: '中等的', 3: '遠的'};
// 愛不愛出門（數字越大越常出門）。蛋黃哥最低，而且背包裡要有便當才肯
const TV_LOVE = {dog: 3, moodeng: 3, snoopy: 3, sloth: 1.5, nyanko: 1.5, dino: 1.5, piggy: 1.5, egg: .6};

/* ---------- 行李用品（火腿的小店多一櫃） ---------- */
const tvIc = body => `<svg viewBox="0 0 32 32">${body}</svg>`;
const TV_GOODS = {
  rice:  {slot: 'food', name: '飯糰', price: 5, tip: '去近的地方', ic: tvIc('<path d="M16 5c3 0 12 14 11 18s-5 4-11 4-10 0-11-4S13 5 16 5z" fill="#1b2140" opacity=".2" transform="translate(0 1.5)"/><path d="M16 5c3 0 12 14 11 18s-5 4-11 4-10 0-11-4S13 5 16 5z" fill="#fbf6ea"/><rect x="10" y="17" width="12" height="10" rx="1.500" fill="#23264a"/>')},
  sand:  {slot: 'food', name: '三明治', price: 10, tip: '去中等的地方', ic: tvIc('<path d="M4 25L16 6l12 19z" fill="#1b2140" opacity=".2" transform="translate(0 1.5)"/><path d="M4 25L16 6l12 19z" fill="#fbf6ea"/><path d="M8.500 19h15l1.800 3H6.700z" fill="#4c9a78"/><path d="M7.500 21.500h17l1 1.800h-19z" fill="#ff8a66"/><path d="M4 25l1.200-2h21.600l1.200 2z" fill="#e9c28a"/>')},
  bento: {slot: 'food', name: '便當', price: 20, tip: '去遠的地方', ic: tvIc('<rect x="3" y="8" width="26" height="18" rx="3" fill="#1b2140" opacity=".2" transform="translate(0 1.5)"/><rect x="3" y="8" width="26" height="18" rx="3" fill="#8a5a45"/><rect x="5.500" y="10.500" width="10" height="13" rx="1.500" fill="#fbf6ea"/><circle cx="10.500" cy="17" r="2" fill="#ff8a66"/><rect x="17" y="10.500" width="9.500" height="6" rx="1.500" fill="#ffd36e"/><rect x="17" y="18" width="9.500" height="5.500" rx="1.500" fill="#4c9a78"/>')},
  luck:  {slot: 'charm', name: '幸運符', price: 15, tip: '多寄一張明信片', ic: tvIc('<path d="M12 6c0-3 8-3 8 0" fill="none" stroke="#8a5a45" stroke-width="1.800"/><path d="M9 8h14l2 5v12a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V13z" fill="#1b2140" opacity=".2" transform="translate(0 1.5)"/><path d="M9 8h14l2 5v12a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V13z" fill="#ff8a66"/><path d="M16 14.500l1.700 3.400 3.800.500-2.800 2.600.700 3.700-3.400-1.800-3.400 1.800.700-3.700-2.800-2.600 3.800-.500z" fill="#ffd36e"/>')},
  meet:  {slot: 'charm', name: '相遇符', price: 15, tip: '容易兩隻一起去', ic: tvIc('<path d="M12 6c0-3 8-3 8 0" fill="none" stroke="#8a5a45" stroke-width="1.800"/><path d="M9 8h14l2 5v12a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V13z" fill="#1b2140" opacity=".2" transform="translate(0 1.5)"/><path d="M9 8h14l2 5v12a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V13z" fill="#3f9aa5"/><circle cx="13" cy="19" r="3.600" fill="#fbf6ea"/><circle cx="19" cy="19" r="3.600" fill="#ffd36e"/>')},
  torch: {slot: 'tool', name: '手電筒', price: 25, tip: '晚上的地方去得了', ic: tvIc('<path d="M18 4l-12 8 5 8 13-6z" fill="#ffd36e" opacity=".5"/><path d="M11 17l6-4 9 12-6 4z" fill="#1b2140" opacity=".2" transform="translate(0 1.5)"/><path d="M11 17l6-4 9 12-6 4z" fill="#3f6f93"/><path d="M8.500 15.500l8-5.500 2 3-8 5.500z" fill="#fbf6ea"/><rect x="17.500" y="19" width="3" height="5" rx="1.500" transform="rotate(-34 19 21.500)" fill="#ff8a66"/>')},
  umb:   {slot: 'tool', name: '摺疊傘', price: 25, tip: '下雨天也肯出門', ic: tvIc('<path d="M16 15v10a3 3 0 0 0 6 0" fill="none" stroke="#8a5a45" stroke-width="2.200" stroke-linecap="round"/><path d="M3 16C4 8 10 4 16 4s12 4 13 12c-2-2-4.500-2-6.500 0-2-2-4.500-2-6.500 0-2-2-4.500-2-6.500 0-2-2-4.500-2-6.500 0z" fill="#1b2140" opacity=".2" transform="translate(0 1.5)"/><path d="M3 16C4 8 10 4 16 4s12 4 13 12c-2-2-4.500-2-6.500 0-2-2-4.500-2-6.500 0-2-2-4.500-2-6.500 0-2-2-4.500-2-6.500 0z" fill="#3f9aa5"/><path d="M16 4c-2 3-3.200 7-3.200 12 2-2 4.500-2 6.400 0C19.200 11 18 7 16 4z" fill="#7dbfc6"/>')},
  // 用一次的道具（once）：跟點心一樣算個數，出門就用掉
  basket: {slot: 'tool', once: 1, name: '野餐籃', price: 30, tip: '下一趟全家一起去', ic: tvIc('<path d="M8 15C8 6 24 6 24 15" fill="none" stroke="#8a5a45" stroke-width="2.400" stroke-linecap="round"/><path d="M4 14h24l-2.500 12a3 3 0 0 1-3 2.500h-13a3 3 0 0 1-3-2.500z" fill="#1b2140" opacity=".2" transform="translate(0 1.5)"/><path d="M4 14h24l-2.500 12a3 3 0 0 1-3 2.500h-13a3 3 0 0 1-3-2.500z" fill="#c98a5a"/><path d="M5 18h22M6 22.500h20M11 14.500l1.500 13.500M16 14.500v14M21 14.500l-1.500 13.500" stroke="#8a5a45" stroke-width="1.300" fill="none"/><path d="M3 12.500h26v3.500H3z" fill="#ff8a66"/><path d="M7 12.500h3.500v3.500H7zM14 12.500h3.500v3.500H14zM21 12.500h3.500v3.500H21z" fill="#fbf6ea"/>')},
};
const TV_SLOTS = [['food', '點心', '決定走多遠'], ['charm', '護身符', '用一次就沒了'], ['tool', '道具', '會帶回來，可以兩樣都帶']];

/* ---------- 土產：可以擺在房間裡的小東西（每一間都能擺）。重複拿到的換成幣 ---------- */
const TV_SOUV_COIN = 3;
const tvSh = (shape, fill, dy = 1.4) => shape.replace('/>', ` fill="#1b2140" opacity=".2" transform="translate(0 ${dy})"/>`) + shape.replace('/>', ` fill="${fill}"/>`);
const TV_SOUV = {
  acorn:    {name: '橡實', from: 'park', vb: [30, 34], w: 7, svg: () => tvSh('<path d="M6 15c0 10 4 16 9 16s9-6 9-16z"/>', '#c98a5a') + tvSh('<path d="M4 15c0-6 5-9 11-9s11 3 11 9z"/>', '#8a5a45', 1) + '<rect x="13.800" y="2" width="2.400" height="5" rx="1.200" fill="#623f30"/><path d="M11 20c0 4 1.500 6 3 7" fill="none" stroke="#e9c9a8" stroke-width="1.600" stroke-linecap="round"/>'},
  leaf:     {name: '漂亮的葉子', from: 'park', vb: [40, 30], w: 9, svg: () => tvSh('<path d="M4 24C4 10 16 3 36 5c1 14-8 22-22 21-3 0-6-1-10-2z"/>', '#ff8a66') + '<path d="M6 23c8-7 16-11 26-15M16 17l1-7M22 14l6 1M12 20l5 2" fill="none" stroke="#fbf6ea" stroke-width="1.400" stroke-linecap="round"/>'},
  shell:    {name: '貝殼', from: 'beach', vb: [36, 30], w: 8, svg: () => tvSh('<path d="M18 27C8 27 3 20 3 14 3 8 9 4 18 4s15 4 15 10c0 6-5 13-15 13z"/>', '#f6d9c9') + '<path d="M18 27L7 9M18 27l-4-22M18 27l4-22M18 27L29 9" fill="none" stroke="#e2a98f" stroke-width="1.600" stroke-linecap="round"/><path d="M13 25h10l-2 4h-6z" fill="#e2a98f"/>'},
  glass:    {name: '海玻璃', from: 'beach', vb: [34, 26], w: 7, svg: () => tvSh('<path d="M5 17c-2-6 3-12 11-13 8-1 14 3 14 9 0 6-6 10-14 10-6 0-9-2-11-6z"/>', '#7dc6c0') + '<path d="M10 12c2-3 6-4.500 10-4.500" fill="none" stroke="#d4f0ec" stroke-width="2" stroke-linecap="round"/>'},
  snackbag: {name: '紙袋點心', from: 'market', vb: [30, 36], w: 8, svg: () => '<circle cx="11" cy="9" r="5" fill="#ffd36e"/><circle cx="19" cy="8" r="5" fill="#f2b96a"/>' + tvSh('<path d="M5 11l3 1 3-1 3 1 3-1 3 1 3-1 2 1v20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/>', '#e9c9a0') + '<circle cx="15" cy="23" r="4.500" fill="#ff8a66"/>'},
  ringtoy:  {name: '套圈圈的小獎品', from: 'market', vb: [34, 36], w: 8, svg: () => tvSh('<rect x="7" y="29" width="20" height="5" rx="2.500"/>', '#8a5a45', 1) + tvSh('<path d="M10 30c0-9 2-19 7-19s7 10 7 19z"/>', '#3f9aa5') + tvSh('<circle cx="17" cy="9" r="6"/>', '#fbf6ea', 1) + '<circle cx="15" cy="8.500" r="1" fill="#23264a"/><circle cx="19" cy="8.500" r="1" fill="#23264a"/><ellipse cx="17" cy="21" rx="9" ry="3" fill="none" stroke="#ffd36e" stroke-width="2.200"/>'},
  onsenegg: {name: '溫泉蛋', from: 'onsen', vb: [34, 30], w: 8, svg: () => tvSh('<path d="M3 16h28c0 7-6 12-14 12S3 23 3 16z"/>', '#8a5a45') + tvSh('<ellipse cx="13" cy="14" rx="6" ry="7.500"/>', '#fbf6ea', 1) + tvSh('<ellipse cx="22" cy="15" rx="5.500" ry="7"/>', '#f6e3c9', 1) + '<path d="M3 16h28c0 2-.500 4-1.500 5.500h-25C3.500 20 3 18 3 16z" fill="#a9735c"/>'},
  woodtag:  {name: '木牌', from: 'onsen', vb: [28, 38], w: 7, svg: () => '<path d="M14 9V3" stroke="#ff8a66" stroke-width="2" stroke-linecap="round"/>' + tvSh('<path d="M6 12l8-6 8 6v20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/>', '#c98a5a') + '<circle cx="14" cy="13" r="1.800" fill="#623f30"/><path d="M10 26c1.500-2 3-2 4 0s2.500 2 4 0M10 21c1.500-2 3-2 4 0s2.500 2 4 0" fill="none" stroke="#fbf6ea" stroke-width="1.500" stroke-linecap="round"/>'},
};
const tvSouvId = k => 'tvs_' + k;
// 放進家具表：每一間都能擺、小店和娃娃機都不會出現（gift）。
// 這個檔一定要排在 js/main.js 前面載入（index.html）：main.js 一開始就會畫房間，那時候家具表裡要已經有土產。room 不屬於任何一間，收納架由 js/travel.js 另外列
Object.keys(TV_SOUV).forEach(k => { const s = TV_SOUV[k]; FURN[tvSouvId(k)] = {room: 'tv', name: s.name, gift: 1, souv: 1, vb: s.vb, w: s.w, svg: s.svg}; });

/* ---------- 明信片的圖：300×200，每個地方 3 張 ---------- */
const TV_C = {sky: '#a9c8ea', sky2: '#cfe0f2', cloud: '#ffffff', hill: '#6f9fc0', hill2: '#3f6f93', leaf: '#4c9a78', leafl: '#7dbb96', leafd: '#3a7a5e', sun: '#ffd36e', a1: '#ff8a66', a1d: '#d96f50',
  paper: '#fbf6ea', wood: '#8a5a45', wood2: '#623f30', teal: '#3f9aa5', teall: '#8fcfd0', sand: '#ead9bd', sandd: '#d9c29c', sea: '#3f86b8', seal: '#6fa9d2', rug: '#b9bde0', ink: '#23264a',
  night: '#1f2a4a', night2: '#2e3458', night3: '#39406a', glow: '#ffe9a8', rock: '#6c7391', rockd: '#4f5674'};
const tvCloud = (x, y, k = 1) => tvSh(`<path d="M${x} ${y}a${9 * k} ${9 * k} 0 0 1 ${17 * k} ${-4 * k} ${11 * k} ${11 * k} 0 0 1 ${20 * k} ${2 * k} ${7 * k} ${7 * k} 0 0 1 ${3 * k} ${13 * k}h${-42 * k}a${6 * k} ${6 * k} 0 0 1 ${2 * k} ${-11 * k}z"/>`, TV_C.cloud, 1.6);
const tvTree = (x, y, k = 1, c = TV_C.leaf, c2 = TV_C.leafl) => `<rect x="${x - 3 * k}" y="${y - 30 * k}" width="${6 * k}" height="${30 * k}" rx="${2 * k}" fill="${TV_C.wood}"/>` + tvSh(`<circle cx="${x}" cy="${y - 42 * k}" r="${20 * k}"/>`, c, 2 * k) + tvSh(`<circle cx="${x - 9 * k}" cy="${y - 50 * k}" r="${11 * k}"/>`, c2, 1.5 * k);
const tvPine = (x, y, k = 1, c = TV_C.leafd) => `<rect x="${x - 2 * k}" y="${y - 10 * k}" width="${4 * k}" height="${10 * k}" fill="${TV_C.wood2}"/>` + tvSh(`<path d="M${x} ${y - 46 * k}l${13 * k} ${22 * k}h${-6 * k}l${9 * k} ${16 * k}h${-32 * k}l${9 * k} ${-16 * k}h${-6 * k}z"/>`, c, 1.6 * k);
const tvStars = n => Array.from({length: n}, (_, i) => `<circle cx="${(i * 67 + 13) % 300}" cy="${(i * 41 + 9) % 86}" r="${i % 3 ? 1 : 1.6}" fill="${TV_C.glow}"/>`).join('');
const tvLights = (y, sag, cols) => `<path d="M0 ${y}Q150 ${y + sag * 2} 300 ${y}" fill="none" stroke="${TV_C.ink}" stroke-width="1.400"/>` + Array.from({length: 11}, (_, i) => { const t = i / 10, x = 300 * t, yy = y + sag * 4 * t * (1 - t) * 2 / 2 + 5; return `<circle cx="${x}" cy="${yy}" r="7" fill="${TV_C.glow}" opacity=".22"/><circle cx="${x}" cy="${yy}" r="3.600" fill="${cols[i % cols.length]}"/>`; }).join('');
const tvStall = (x, w, c) => { const n = 6, sw = w / n; let s = tvSh(`<rect x="${x}" y="96" width="${w}" height="62"/>`, TV_C.paper, 2) + `<rect x="${x}" y="128" width="${w}" height="30" fill="${TV_C.wood}"/><rect x="${x}" y="126" width="${w}" height="5" fill="${TV_C.wood2}"/>`;
  for (let i = 0; i < n; i++) s += tvSh(`<path d="M${x + sw * i} 78h${sw}v16a${sw / 2} ${sw / 2} 0 0 1 ${-sw} 0z"/>`, i % 2 ? TV_C.paper : c, 2);
  return s + `<rect x="${x - 2}" y="74" width="${w + 4}" height="6" rx="2" fill="${TV_C.wood2}"/>`; };
// at：娃娃貼在哪裡 [x%, y%（腳底）, 寬%]；兩隻一起去的時候左右各讓開一點
const TV_CARDS = {
  park: [
    {name: '大樹下', at: [62, 90, 25], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/><circle cx="246" cy="36" r="17" fill="${TV_C.sun}"/>${tvCloud(40, 44)}${tvCloud(150, 30, .7)}
      ${tvSh('<path d="M0 132c50-32 110-34 160-8 40-22 96-20 140 2v74H0z"/>', TV_C.hill, 2)}${tvSh('<path d="M0 150c70-18 220-18 300 0v50H0z"/>', TV_C.leafl, 2)}
      ${tvSh('<path d="M122 200c8-22 30-34 62-40l14 4c-26 8-40 20-44 36z"/>', TV_C.sand, 1)}${tvTree(78, 168, 2.1)}
      ${tvSh('<rect x="196" y="150" width="62" height="7" rx="3"/>', TV_C.wood, 2)}<rect x="202" y="157" width="5" height="14" fill="${TV_C.wood2}"/><rect x="247" y="157" width="5" height="14" fill="${TV_C.wood2}"/>${tvSh('<rect x="196" y="136" width="62" height="6" rx="3"/>', TV_C.wood, 1.5)}
      ${[[20, 178], [44, 190], [272, 184], [232, 192], [150, 186]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.400" fill="${i % 2 ? TV_C.a1 : TV_C.paper}"/><circle cx="${x}" cy="${y}" r="1.300" fill="${TV_C.sun}"/>`).join('')}`},
    {name: '池塘邊', at: [28, 92, 25], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/>${tvCloud(196, 34)}${tvCloud(60, 26, .7)}
      ${tvSh('<path d="M0 118c60-26 120-20 170 0 44-16 90-14 130 4v78H0z"/>', TV_C.hill, 2)}${tvPine(248, 128, .9)}${tvPine(272, 132, 1.1)}
      ${tvSh('<path d="M0 138c80-14 220-14 300 0v62H0z"/>', TV_C.leafl, 2)}
      ${tvSh('<ellipse cx="190" cy="168" rx="96" ry="26"/>', TV_C.teal, 2)}<ellipse cx="184" cy="164" rx="70" ry="15" fill="${TV_C.teall}" opacity=".55"/>
      ${[[150, 170, 9], [226, 176, 11], [198, 158, 7]].map(([x, y, r]) => `<path d="M${x} ${y}m${-r} 0a${r} ${r * .5} 0 1 0 ${r * 2} 0a${r} ${r * .5} 0 1 0 ${-r * 2} 0M${x} ${y}l${r} ${-r * .3}" fill="${TV_C.leaf}"/>`).join('')}
      <circle cx="226" cy="173" r="3" fill="${TV_C.a1}"/>
      ${[[262, 150], [270, 156], [278, 148]].map(([x, y]) => `<rect x="${x}" y="${y - 30}" width="2.400" height="34" fill="${TV_C.leafd}"/><rect x="${x - 1.300}" y="${y - 34}" width="5" height="12" rx="2.500" fill="${TV_C.wood}"/>`).join('')}
      ${tvSh('<path d="M96 150c14-16 40-16 54 0l-5 4c-12-11-32-11-44 0z"/>', TV_C.wood, 2)}`},
    {name: '放風箏的草地', at: [66, 92, 25], svg: () => `<rect width="300" height="200" fill="${TV_C.sky2}"/><rect width="300" height="70" fill="${TV_C.sky}"/>${tvCloud(204, 58, .9)}${tvCloud(22, 30, .7)}
      <path d="M122 40C140 80 170 110 196 150" fill="none" stroke="${TV_C.ink}" stroke-width="1" opacity=".5"/>
      ${tvSh('<path d="M122 14l16 22-16 26-16-26z"/>', TV_C.a1, 2)}<path d="M122 14v48M106 36h32" stroke="${TV_C.paper}" stroke-width="1.400"/>
      <path d="M122 62c-6 8 6 12 0 20s6 10 1 18" fill="none" stroke="${TV_C.sun}" stroke-width="2.200" stroke-linecap="round"/>
      ${tvSh('<path d="M0 140c60-22 130-22 180-4 40-14 84-12 120 2v62H0z"/>', TV_C.leafl, 2)}${tvSh('<path d="M0 166c90-12 210-12 300 0v34H0z"/>', TV_C.leaf, 2)}
      ${tvTree(264, 150, 1.1)}${tvTree(22, 152, .9, TV_C.leafd, TV_C.leaf)}
      ${[[40, 180], [70, 188], [110, 182], [240, 186], [276, 178], [150, 192]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.400" fill="${[TV_C.paper, TV_C.sun, TV_C.a1][i % 3]}"/>`).join('')}`},
  ],
  beach: [
    {name: '陽傘下', at: [34, 92, 25], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/><circle cx="52" cy="34" r="18" fill="${TV_C.sun}"/>${tvCloud(170, 30)}
      <rect y="86" width="300" height="50" fill="${TV_C.sea}"/><rect y="104" width="300" height="32" fill="${TV_C.seal}"/>
      ${tvSh('<path d="M0 134c20-8 30-8 50 0s30 8 50 0 30-8 50 0 30 8 50 0 30-8 50 0 30 8 50 0v66H0z"/>', TV_C.paper, 2)}${tvSh('<path d="M0 144c60-8 240-8 300 0v56H0z"/>', TV_C.sand, 1.5)}
      <rect x="212" y="92" width="4" height="86" rx="2" fill="${TV_C.wood}"/>${tvSh('<path d="M156 108c6-34 110-34 116 0z"/>', TV_C.a1, 2.5)}<path d="M184 108c4-22 16-25 30-25.500V108zM244 108c-4-22-16-25-30-25.500V108z" fill="${TV_C.paper}"/>
      ${tvSh('<path d="M246 158h26l-4 24h-18z"/>', TV_C.teal, 2)}<path d="M246 158c2-12 24-12 26 0" fill="none" stroke="${TV_C.wood2}" stroke-width="2"/>
      ${[[96, 176], [130, 188], [286, 190], [18, 182]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3.400" fill="${i % 2 ? TV_C.a1 : TV_C.sandd}"/>`).join('')}`},
    {name: '礁石和潮池', at: [68, 90, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.sky}"/>${tvCloud(34, 36)}
      <path d="M200 40q7-8 14 0M222 30q6-7 12 0" fill="none" stroke="${TV_C.paper}" stroke-width="2.400" stroke-linecap="round"/>
      <rect y="78" width="300" height="60" fill="${TV_C.sea}"/><rect y="100" width="300" height="38" fill="${TV_C.seal}"/>
      ${tvSh('<path d="M0 96l26-22 30 10 18 34-74 20z"/>', TV_C.rockd, 2)}${tvSh('<path d="M226 138l22-48 34-8 18 20v40z"/>', TV_C.rockd, 2)}
      ${tvSh('<path d="M0 142c50-10 250-10 300 0v58H0z"/>', TV_C.sand, 2)}
      ${tvSh('<path d="M14 200l10-40 44-12 40 16 8 36z"/>', TV_C.rock, 2.5)}
      ${tvSh('<ellipse cx="66" cy="176" rx="30" ry="11"/>', TV_C.teall, 1)}
      ${tvSh('<path d="M70 166l2.400 5.400 5.800.600-4.400 4 1.300 5.800-5.100-3-5.100 3 1.300-5.800-4.400-4 5.800-.600z"/>', TV_C.a1, 1)}
      ${tvSh('<ellipse cx="256" cy="180" rx="9" ry="6"/>', TV_C.a1d, 1.5)}<path d="M246 178l-6-4M246 183l-6 2M266 178l6-4M266 183l6 2" stroke="${TV_C.a1d}" stroke-width="2" stroke-linecap="round"/>`},
    {name: '傍晚的燈塔', at: [30, 92, 25], svg: () => `<rect width="300" height="200" fill="#f3c9a0"/><rect width="300" height="46" fill="#c9b5d6"/><rect y="46" width="300" height="30" fill="#f0b89a"/>
      <circle cx="96" cy="112" r="24" fill="${TV_C.sun}"/><rect y="112" width="300" height="40" fill="#5d7fae"/><rect x="72" y="118" width="48" height="3" fill="${TV_C.sun}" opacity=".7"/><rect x="82" y="126" width="28" height="3" fill="${TV_C.sun}" opacity=".5"/>
      <path d="M232 62L60 20v62z" fill="${TV_C.glow}" opacity=".3"/>
      ${tvSh('<path d="M150 152c30-40 100-56 150-50v98H150z"/>', TV_C.leafd, 2)}
      ${tvSh('<path d="M220 108l5-48h14l5 48z"/>', TV_C.paper, 2)}<path d="M223.300 76h17.400l.900 9h-19.200zM221.500 94h21l.900 9h-22.800z" fill="${TV_C.a1}"/>
      ${tvSh('<rect x="222" y="48" width="20" height="13" rx="2"/>', TV_C.ink, 1)}<rect x="226" y="51" width="12" height="8" fill="${TV_C.glow}"/><path d="M220 49l12-10 12 10z" fill="${TV_C.a1d}"/>
      ${tvSh('<path d="M0 156c50-10 110-8 160 2l20 42H0z"/>', TV_C.sand, 2)}`},
  ],
  market: [
    {name: '熱鬧的攤位', at: [50, 94, 25], svg: () => `<rect width="300" height="200" fill="${TV_C.night}"/>${tvStars(16)}${tvLights(24, 14, [TV_C.sun, TV_C.a1, TV_C.teall, TV_C.paper])}
      ${tvStall(14, 124, TV_C.a1)}${tvStall(162, 124, TV_C.teal)}
      <circle cx="46" cy="114" r="8" fill="${TV_C.sun}"/><circle cx="76" cy="114" r="8" fill="${TV_C.a1}"/><circle cx="106" cy="114" r="8" fill="${TV_C.sun}"/>
      <rect x="182" y="104" width="8" height="20" rx="3" fill="${TV_C.a1}"/><rect x="200" y="100" width="8" height="24" rx="3" fill="${TV_C.sun}"/><rect x="218" y="104" width="8" height="20" rx="3" fill="${TV_C.paper}"/><rect x="236" y="100" width="8" height="24" rx="3" fill="${TV_C.a1}"/>
      <rect y="158" width="300" height="42" fill="${TV_C.night3}"/><ellipse cx="76" cy="176" rx="70" ry="14" fill="${TV_C.glow}" opacity=".18"/><ellipse cx="224" cy="176" rx="70" ry="14" fill="${TV_C.glow}" opacity=".18"/>`},
    {name: '燈籠街', at: [50, 94, 25], svg: () => `<rect width="300" height="200" fill="${TV_C.night}"/>${tvStars(12)}
      ${tvSh('<path d="M0 60l70 30v80H0z"/>', TV_C.night2, 2)}${tvSh('<path d="M300 60l-70 30v80h70z"/>', TV_C.night2, 2)}
      ${[[14, 96], [40, 106], [14, 128], [40, 134], [262, 106], [286, 96], [262, 134], [286, 128]].map(([x, y]) => `<rect x="${x}" y="${y}" width="12" height="14" rx="2" fill="${TV_C.glow}"/>`).join('')}
      <path d="M0 40L150 92 300 40" fill="none" stroke="${TV_C.ink}" stroke-width="1.400"/>
      ${[[20, 47, 13], [52, 58, 12], [82, 68.500, 10.500], [110, 78, 9], [134, 86.500, 7.500], [166, 86.500, 7.500], [190, 78, 9], [218, 68.500, 10.500], [248, 58, 12], [280, 47, 13]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y + r + 2}" r="${r * 1.900}" fill="${TV_C.glow}" opacity=".16"/><rect x="${x - r * .4}" y="${y}" width="${r * .8}" height="3" fill="${TV_C.wood2}"/><ellipse cx="${x}" cy="${y + r + 2}" rx="${r * .85}" ry="${r}" fill="${i % 2 ? TV_C.sun : TV_C.a1}"/><rect x="${x - r * .4}" y="${y + r * 2 + 1}" width="${r * .8}" height="3" fill="${TV_C.wood2}"/>`).join('')}
      <path d="M70 170L130 110h40l60 60v30H70z" fill="${TV_C.night3}"/><ellipse cx="150" cy="182" rx="76" ry="14" fill="${TV_C.glow}" opacity=".2"/>`},
    {name: '套圈圈', at: [26, 94, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.night}"/>${tvStars(10)}${tvLights(18, 10, [TV_C.sun, TV_C.paper, TV_C.a1])}
      ${tvSh('<rect x="92" y="62" width="196" height="100"/>', TV_C.wood, 2)}<rect x="100" y="70" width="180" height="56" fill="${TV_C.wood2}"/>
      ${tvSh('<rect x="100" y="92" width="180" height="5"/>', TV_C.wood, 1)}
      ${[[118, TV_C.a1], [146, TV_C.paper], [174, TV_C.teall], [202, TV_C.sun], [230, TV_C.a1], [258, TV_C.paper]].map(([x, c], i) => `<rect x="${x - 6}" y="${i % 2 ? 76 : 72}" width="12" height="${i % 2 ? 16 : 20}" rx="5" fill="${c}"/>`).join('')}
      ${[[124, 118], [158, 114], [192, 118], [226, 114], [260, 118]].map(([x, y]) => `<rect x="${x - 2}" y="${y - 14}" width="4" height="14" rx="2" fill="${TV_C.paper}"/>`).join('')}
      <ellipse cx="158" cy="110" rx="9" ry="3" fill="none" stroke="${TV_C.sun}" stroke-width="2.400"/><ellipse cx="238" cy="96" rx="9" ry="3" fill="none" stroke="${TV_C.a1}" stroke-width="2.400" transform="rotate(-18 238 96)"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(i => tvSh(`<path d="M${86 + i * 30} 50h30v14a15 15 0 0 1-30 0z"/>`, i % 2 ? TV_C.paper : TV_C.sun, 2)).join('')}<rect x="84" y="46" width="214" height="6" rx="2" fill="${TV_C.wood2}"/>
      <rect y="162" width="300" height="38" fill="${TV_C.night3}"/><ellipse cx="180" cy="178" rx="100" ry="13" fill="${TV_C.glow}" opacity=".18"/>`},
  ],
  onsen: [
    {name: '露天的池子', at: [76, 92, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.sky2}"/>
      ${tvSh('<path d="M0 120L70 44l40 40 40-58 70 70 80-40v124H0z"/>', TV_C.hill, 2)}<path d="M150 26l16 23-10-4-8 8-6-6-8 7z" fill="${TV_C.paper}"/><path d="M70 44l12 13-8-2-6 6-6-5z" fill="${TV_C.paper}"/>
      ${tvPine(22, 138, 1.1)}${tvPine(52, 132, .8)}${tvPine(280, 136, 1.2)}
      ${tvSh('<path d="M0 138c80-12 220-12 300 0v62H0z"/>', TV_C.leafl, 2)}
      ${tvSh('<ellipse cx="130" cy="164" rx="104" ry="30"/>', TV_C.rock, 3)}<ellipse cx="130" cy="162" rx="92" ry="23" fill="${TV_C.teall}"/><ellipse cx="120" cy="158" rx="60" ry="11" fill="${TV_C.paper}" opacity=".45"/>
      ${[[40, 176, 13], [226, 172, 15], [74, 190, 11], [186, 190, 12]].map(([x, y, r]) => tvSh(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .7}"/>`, TV_C.rockd, 2)).join('')}
      ${[[96, 132], [130, 118], [164, 134]].map(([x, y]) => `<path d="M${x} ${y}c-8-8 8-12 0-22s8-12 2-20" fill="none" stroke="${TV_C.paper}" stroke-width="5" stroke-linecap="round" opacity=".75"/>`).join('')}
      <path d="M300 0v40l-50-26z" fill="${TV_C.wood2}"/>${[[262, 22], [280, 36], [244, 14], [290, 14]].map(([x, y]) => tvSh(`<path d="M${x} ${y}l4 6 7-1-4 6 4 6-7-1-4 6-4-6-7 1 4-6-4-6 7 1z"/>`, TV_C.a1, 1)).join('')}`},
    {name: '上山的階梯', at: [34, 94, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.sky2}"/><circle cx="60" cy="38" r="15" fill="${TV_C.paper}"/>
      ${tvSh('<path d="M60 200L190 30l110 120v50z"/>', TV_C.hill, 2)}${tvSh('<path d="M0 200V110l90 90z"/>', TV_C.hill2, 2)}
      <rect y="92" width="300" height="12" rx="6" fill="${TV_C.paper}" opacity=".6"/><rect x="120" y="66" width="180" height="9" rx="4.500" fill="${TV_C.paper}" opacity=".5"/>
      ${[[150, 190, 78], [158, 172, 62], [166, 156, 50], [174, 142, 40], [181, 130, 30], [187, 120, 22], [191, 112, 16]].map(([x, y, w]) => tvSh(`<rect x="${x}" y="${y}" width="${w}" height="${Math.max(6, w * .16)}" rx="2"/>`, TV_C.paper, 2)).join('')}
      ${tvPine(118, 196, 1.5)}${tvPine(262, 200, 1.7)}${tvPine(238, 150, .9)}${tvPine(140, 140, .7)}
      <rect x="92" y="150" width="5" height="44" fill="${TV_C.wood2}"/>${tvSh('<path d="M70 150h44l8 8-8 8H70z"/>', TV_C.wood, 2)}<rect x="78" y="156" width="26" height="3" rx="1.500" fill="${TV_C.paper}"/>`},
    {name: '晚上的旅館', at: [70, 94, 24], svg: () => `<rect width="300" height="200" fill="${TV_C.night}"/>${tvStars(14)}<circle cx="250" cy="34" r="14" fill="${TV_C.glow}"/><circle cx="244" cy="30" r="12" fill="${TV_C.night}"/>
      ${tvSh('<path d="M0 150l60-70 50 50 50-60 140 80v50H0z"/>', TV_C.night2, 2)}
      ${[[40, 80], [62, 64], [84, 82]].map(([x, y]) => `<path d="M${x} ${y}c-8-8 8-12 0-22s8-12 2-20" fill="none" stroke="${TV_C.paper}" stroke-width="5" stroke-linecap="round" opacity=".35"/>`).join('')}
      ${tvSh('<rect x="24" y="100" width="150" height="70"/>', TV_C.wood, 2)}${tvSh('<path d="M8 104l92-40 92 40-6 8H14z"/>', TV_C.wood2, 3)}
      <rect x="38" y="118" width="30" height="24" rx="2" fill="${TV_C.glow}"/><path d="M53 118v24M38 130h30" stroke="${TV_C.wood2}" stroke-width="2"/>
      <rect x="92" y="122" width="46" height="48" fill="${TV_C.ink}"/>${tvSh('<path d="M90 120h50v20h-12v-8h-12v8h-12v-8h-14z"/>', TV_C.teal, 1.5)}<circle cx="115" cy="127" r="3.600" fill="${TV_C.paper}"/>
      <rect x="152" y="112" width="3" height="10" fill="${TV_C.wood2}"/><circle cx="153.500" cy="130" r="16" fill="${TV_C.glow}" opacity=".2"/><ellipse cx="153.500" cy="130" rx="7" ry="9" fill="${TV_C.a1}"/>
      <rect y="170" width="300" height="30" fill="${TV_C.night3}"/>${[[150, 176], [176, 184], [206, 178], [236, 188], [266, 180]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="13" ry="5" fill="${TV_C.rock}"/>`).join('')}`},
  ],
};

/* ---------- 明信片背面的話：每隻每個地方 2 句，照個性寫 ---------- */
const TV_LINES = {
  park: {
    sloth: ['樹下的風剛剛好。我看一片葉子掉下來，看了很久。', '長椅是暖的。我坐下去，就不想起來了。'],
    egg: ['走到公園就累了。草地可以躺，還不錯。', '有人在跑步。光看就覺得累。'],
    dog: ['我在樹下埋了一個東西！回去不告訴你是什麼！', '池塘裡有另一隻我！我叫牠，牠也叫我！'],
    moodeng: ['鴿子一直看我。我跳了一下，牠們全飛走了。哼。', '草地軟軟的，跳起來沒有聲音。不好玩……再跳一下。'],
    nyanko: ['公園沒有賣吃的。本大爺白走一趟。……花還可以。', '有人在野餐。本大爺只是路過，沒有在看便當。'],
    dino: ['我躲在樹後面，沒有人來找我。我自己出來了。', '風箏的線好長。我想知道另一頭綁在哪裡。'],
    snoopy: ['這棵樹適合當小說的第一幕。主角從樹上掉下來。', '我在長椅上想劇情，想到天都亮了。其實本來就是白天。'],
    piggy: ['花圃的花種得太密，明年一定擠在一起。我說的。', '這條路繞了三個彎才到池塘。設計的人沒走過直線嗎。'],
  },
  beach: {
    sloth: ['海浪一直來，一直走。我數到第七個就睡著了。', '沙子是暖的。我躺著看雲，雲也躺著。'],
    egg: ['沙子好燙。海水好冰。沒有剛剛好的地方。', '躺在陽傘下面，哪裡都不想去。這樣就好。'],
    dog: ['我撿到一個貝殼！又撿到一個！口袋放不下了！', '海浪追我，我追海浪。到底誰贏了？'],
    moodeng: ['我踩水踩得最高！海浪不服氣，又來了一次。', '有一隻螃蟹橫著走。我學牠走，牠竟然不理我。'],
    nyanko: ['海邊的烤魚呢。本大爺聞到了，可是找不到。', '海水是鹹的。本大爺只是不小心喝到，不是想喝。'],
    dino: ['我把自己埋在沙子裡，只露出頭。路過的人都嚇一跳。嘿嘿。', '潮池裡有海星。我戳了一下，牠不理我。'],
    snoopy: ['燈塔一閃一閃的。我決定下一章寫一個守燈塔的人。', '我站在礁石上，風很大，很像書的封面。'],
    piggy: ['退潮的時間跟我算的一樣。我早就說過了。', '陽傘插歪了，風一來就倒。果然倒了。'],
  },
  market: {
    sloth: ['燈籠好多。我每一顆都看了一下，所以走得很慢。', '大家都走很快。我站在中間，像一顆石頭。'],
    egg: ['好多人。好吵。……不過烤玉米還不錯。', '排隊排了很久。輪到我的時候，我忘記要買什麼了。'],
    dog: ['套圈圈我套中了！套中的是旁邊那個人的包包。', '好多味道！我的鼻子不知道要先聞哪一個！'],
    moodeng: ['撈金魚的網子一下就破了。這個網子有問題。', '人太多了不能跳。我忍了一整條街。'],
    nyanko: ['從第一攤吃到最後一攤。本大爺只是在做調查。', '這一攤的丸子比上一攤大。本大爺兩攤都吃了才知道。'],
    dino: ['我躲在攤子下面，老闆給了我一塊糖，叫我出來。', '燈籠後面有影子。我比了一隻恐龍，大家都說像兔子。'],
    snoopy: ['夜市是寫偵探故事的好地方。每個人看起來都有祕密。', '我假裝是有名的美食作家。老闆多給了我一顆丸子。'],
    piggy: ['這攤的價錢比隔壁貴兩塊，分量少一口。我算過了。', '套圈圈的圈比瓶口小。這種遊戲我一眼就看穿。'],
  },
  onsen: {
    sloth: ['泡在裡面，什麼都不用想。我本來就沒在想。', '山上的霧慢慢地走。我跟它比慢，我贏了。'],
    egg: ['終於有一個地方，躺著不動是對的。', '路好遠。可是泡下去的時候覺得，算了，原諒這條路。'],
    dog: ['水是熱的！我跳進去又跳出來，跳了五次！', '我把毛巾藏在石頭後面，現在找不到了。'],
    moodeng: ['水太燙了！……再泡一下。……還是很燙！', '我在池子裡踩水，旁邊的人都被我濺到。他們沒有生氣。奇怪。'],
    nyanko: ['溫泉蛋本大爺吃了三顆。泡湯只是順便。', '泡完有牛奶可以喝。這個地方本大爺認可了。'],
    dino: ['霧好大。我躲進霧裡，連我自己都找不到我。', '我在水裡吹泡泡，假裝溫泉是我煮開的。'],
    snoopy: ['我在池邊寫了三行。紙濕掉了，三行都不見了。', '山這麼高，適合讓主角在這裡想通一件事。我也順便想了一下。'],
    piggy: ['水溫大概四十一度。我不用量，泡了就知道。', '上山的階梯一共三百多階。有人說兩百，他數錯了。'],
  },
};
// 一趟寄到第三張的時候（帶了幸運符），那個地方的兩句都寫過了，改寫這裡的：哪裡都能用的兩句
const TV_MORE = {
  sloth: ['這裡的雲走得比家裡的慢。我喜歡。', '我在想家裡的沙發。它應該也在想我。'],
  egg: ['還沒到。不想走了。可是也不想走回去。', '風景還可以。躺著看更好。'],
  dog: ['我想你了！可是我還要再玩一下！', '我聞到好多沒聞過的味道！全部記起來了！'],
  moodeng: ['才沒有想家。……家裡有沒有人動我的東西？', '這裡的地板跳起來聲音不一樣。我試了很多次。'],
  nyanko: ['帶的點心吃完了。本大爺考慮提早回去。', '路上有人餵本大爺。本大爺是勉強吃的。'],
  dino: ['我跟在一個路人後面走了很久，他都沒發現。', '這裡有一個很適合躲的洞。我不告訴你在哪裡。'],
  snoopy: ['旅行的人看起來都像小說的主角。我也是。', '我在路邊寫了一段。寫得很好，可是被風吹走了。'],
  piggy: ['地圖畫錯了一條路。我幫他們改好了。', '路上的人問我路。我當然知道。'],
};
const tvLinesOf = (p, d) => [...((TV_LINES[p] || {})[d] || []), ...(TV_MORE[d] || [])];
// 兩隻一起去：合照背面是兩隻的對話。每個地方 6 組常見的搭配 [甲, 乙, 甲說的, 乙說的]；沒寫到的搭配各寫各的
const TV_DUO = {
  park: [
    ['dog', 'sloth', '我跑了三圈，薯餅還在同一張椅子上！', '我有動。我換了一隻腳。'],
    ['dino', 'dog', '我們玩捉迷藏，我躲在樹上。', '我在樹下找了好久！牠一直笑！'],
    ['nyanko', 'piggy', '公園沒有吃的，本大爺要回去了。', '你包包裡明明有三個飯糰。我看到了。'],
    ['snoopy', 'sloth', '我把薯餅寫進小說了，牠演一棵樹。', '我覺得這個角色很適合我。'],
    ['moodeng', 'dino', '龍龍說草地下面有寶藏。我跳了半天。', '嘿嘿。我沒有說是哪一塊草地。'],
    ['egg', 'sloth', '我們躺在草地上，誰都沒有說話。', '這是我去過最好的一次公園。'],
  ],
  beach: [
    ['moodeng', 'dog', '我踩水，皮蛋追浪。', '我們兩個都濕了！是海先動手的！'],
    ['snoopy', 'piggy', '我說那座燈塔有一百年了。', '六十年。你每次都亂加。'],
    ['sloth', 'egg', '陽傘下面剛好躺得下兩個。', '我們說好了，誰都不要叫誰起來。'],
    ['dino', 'moodeng', '我把彈跳豬埋在沙子裡了。', '是我自己要埋的！出不來也是我自己的事！'],
    ['nyanko', 'dog', '皮蛋撿的貝殼太多，本大爺只好幫忙拿。', '貓咪老師偷偷留了一個最漂亮的！'],
    ['piggy', 'sloth', '薯餅看海看了兩個小時，一動也沒動。', '海也看了我兩個小時。'],
  ],
  market: [
    ['nyanko', 'piggy', '這一攤好吃，再買一份。', '這是第四份。我有在數。'],
    ['dog', 'dino', '龍龍不見了！我找了三條街！', '我一直跟在你後面。嘿嘿。'],
    ['snoopy', 'nyanko', '我跟老闆說，這位是有名的美食家。', '所以本大爺多吃了兩串。不是本大爺要的。'],
    ['moodeng', 'piggy', '撈金魚的網子又破了！', '你用跳的去撈，當然會破。'],
    ['sloth', 'nyanko', '我還在看第一攤的燈籠。', '本大爺已經吃完一輪回來了。牠還在那裡。'],
    ['egg', 'dog', '皮蛋拉著我走完整條街。', '蛋黃哥今天走了好多路！我有幫牠數！'],
  ],
  onsen: [
    ['sloth', 'egg', '我們泡到手都皺了。', '皺就皺吧。不想起來。'],
    ['nyanko', 'sloth', '溫泉蛋本大爺吃三顆，薯餅吃一顆。', '我那一顆吃了很久。很好吃。'],
    ['moodeng', 'dog', '水太燙了！皮蛋你先下去！', '我下去了！很燙！可是很舒服！你快來！'],
    ['piggy', 'egg', '上山三百多階，蛋黃哥休息了十一次。', '十二次。最後一次你沒看到。'],
    ['snoopy', 'dino', '霧這麼大，一定有什麼故事要開始了。', '是我躲在霧裡拉牠的尾巴。'],
    ['dog', 'nyanko', '我把貓咪老師的牛奶藏起來了。', '本大爺聞得到。在第二顆石頭後面。'],
  ],
};
// 回家時的一句旅行日記（記進相簿那一隻的頁面）。{p} 換成地方的名字
const TV_DIARY = {
  sloth: ['去了{p}。走得很慢，所以看到很多東西。', '從{p}回來了。路上睡了一下，醒來就到家了。'],
  egg: ['{p}很遠。回家的路也很遠。現在要躺很久。', '去了{p}。還可以。下次可以再去，但不是明天。'],
  dog: ['我去了{p}！我記得回家的路！一次都沒有走錯！', '{p}好好玩！我有帶東西回來！不是藏起來的那個！'],
  moodeng: ['{p}還可以啦。……好啦，很好玩。', '我在{p}跳了很多下。腳有一點痠，不要問。'],
  nyanko: ['{p}的東西本大爺都吃過了。可以回家了。', '本大爺才沒有想家。只是{p}的點心吃完了。'],
  dino: ['我在{p}躲了三個地方，都沒有人找到我。', '{p}有很多可以躲的地方。我記下來了。'],
  snoopy: ['{p}這一趟夠我寫三章。', '我在{p}想到一個很棒的開頭，回來就忘了。'],
  piggy: ['{p}跟我想的差不多。該看的我都看了。', '去{p}的路我記起來了，下次可以省十分鐘。'],
};
// 回家日記照地方多寫（2026-11-27 歡迎回家改版）：每隻在四個地方各一句、出國兩句，接在 TV_DIARY 那兩句後面。
// 舊的兩句排最前面，以前存的「第幾句」（0、1）照樣對得上。{p} 一樣換成地方的名字
const TV_DIARY_AT = {
  sloth: {
    park: ['公園的長椅曬得到太陽。我坐到影子換邊才走。'],
    beach: ['海浪一直來，我就一直看。看了一個下午。'],
    market: ['夜市人好多。我走得慢，大家都從我旁邊過去。'],
    onsen: ['泡溫泉的時候睡著了。醒來水還是熱的。'],
    abroad: ['{p}好高。我抬頭看了很久，脖子有點痠。', '坐飛機睡了一路，到{p}的時候剛好醒。'],
  },
  egg: {
    park: ['公園的草地可以躺。我躺了。'],
    beach: ['沙子很軟。我在上面躺出一個坑。'],
    market: ['夜市要一直走。我吃了一根香腸就想回家了。'],
    onsen: ['溫泉不用動也很舒服。這種地方可以常去。'],
    abroad: ['去{p}要坐很久的飛機。是坐著的，所以還好。', '大家都在{p}前面跳起來拍照。我沒有跳。'],
  },
  dog: {
    park: ['公園有一隻鴿子跟我賽跑！我贏了！應該吧！'],
    beach: ['我挖了一個好大的洞！海水跑進來幫我填好了！'],
    market: ['夜市每一攤都好香！我每一攤都聞過了！'],
    onsen: ['溫泉好熱！我一直跳進去又跳出來！'],
    abroad: ['我在{p}交到一個朋友！牠聽不懂我說話，可是牠有搖尾巴！', '飛機好大！{p}也好大！我好小！可是我好開心！'],
  },
  moodeng: {
    park: ['公園的溜滑梯我只溜了五次。……八次啦。'],
    beach: ['海浪打到我的時候，我才沒有叫。叫的是海鷗。'],
    market: ['撈魚一條都沒撈到。網子太薄了，不關我的事。'],
    onsen: ['溫泉蛋我只吃一顆。……兩顆。不要再問了。'],
    abroad: ['{p}普普通通啦。照片我拍了四十張而已。', '在{p}跳起來拍照，跳得比旁邊的人都高。剛好而已。'],
  },
  nyanko: {
    park: ['公園的長椅本大爺坐過了。曬太陽這種事，本大爺很專業。'],
    beach: ['海邊的烤魷魚，本大爺給它八分。'],
    market: ['夜市本大爺從頭吃到尾，再從尾吃回頭。'],
    onsen: ['泡完溫泉要喝牛奶。這是規矩。'],
    abroad: ['{p}旁邊的點心攤，本大爺都試過了。勉強及格。', '本大爺在{p}也很有名。至少那裡的鴿子認得本大爺。'],
  },
  dino: {
    park: ['我躲在公園的溜滑梯下面，等到天黑都沒人發現。'],
    beach: ['我把自己埋在沙子裡，只露出尾巴。'],
    market: ['夜市太擠了，躲在哪裡都會被擠出來。'],
    onsen: ['溫泉的霧很大，我站著不動就沒人看得到我。'],
    abroad: ['我在{p}找到一個很好躲的角落，可惜帶不回來。', '去{p}的飛機上，我躲在毯子下面躲了一整趟。'],
  },
  snoopy: {
    park: ['在公園的樹下寫了一頁。後來被葉子蓋住了。'],
    beach: ['我在沙灘上寫了一個書名，海浪幫我改掉了。'],
    market: ['夜市的燈很適合當故事的最後一幕。'],
    onsen: ['在溫泉的霧裡想到一個推理故事。兇手是霧。'],
    abroad: ['坐在{p}前面，我寫好了第一句。第二句還在想。', '{p}的故事太多了，我只帶回來一個開頭。'],
  },
  piggy: {
    park: ['公園繞一圈要二十分鐘。我十八分鐘就繞完了。'],
    beach: ['退潮的時間我查好了，一退潮就去撿貝殼。'],
    market: ['夜市我照順序吃：先鹹的，再甜的，最後喝的。'],
    onsen: ['上山的路我算過了，休息三次剛好。'],
    abroad: ['去{p}的行程我排好了，最後還多出半天。', '{p}附近的路我記起來了。下次可以帶大家去。'],
  },
};
// 這隻在這個地方抽得到的日記句：舊的兩句＋這個地方的（出國的地方都用 abroad 那幾句）
const tvDiaryOf = (p, d) => [...(TV_DIARY[d] || []), ...((TV_DIARY_AT[d] || {})[TV_PLACES[p] && TV_PLACES[p].abroad ? 'abroad' : p] || [])];
