/* 蛋蛋島 × 小窩 聯名第一批：月亮島四件樣品（2026-11-28，Claude B，草稿・待審）
   ─────────────────────────────────────────────────────────────────────────────
   ★ 這個檔目前「沒有」被小窩載入（index.html 的 NEST_JS 沒有它），只給 collab/tests/nest_room_mix.cjs 測試時插進去。
     要正式放進小窩，請 Claude A 照 collab/HANDOFF_B_TO_A.md 的步驟接（排在 abroad 後面、claw 前面）。
   ★ 名稱、價格、取得方式都還沒核准（見 DEVELOPMENT_PROGRESS_B.md 的「需要決定的事」），所以 price 先不寫。

   來源：蛋蛋島第 42 章「月亮島」（206–210 關，js/mapart.js 第 179 行）：
     地圖配色 #f1e2ff → #4a5596 → #33397a → #2f3370；地圖物件 moon / star / boat / star；
     劇情「月亮好圓。好睏。」「燈籠跟熱氣球一起飄上天了」；蛋蛋島的開場字「划船上島中…」。
     蛋蛋島整條主線是「找回龍龍的蛋」，所以每件都放一顆有彩色點點的龍龍蛋（蛋蛋島地圖的 dinoegg 配色）當聯名記號。

   四件（PDF LINK-02）：
     A 小窩重繪   egm_moonlamp  月亮島夜燈       家具（臥室，會亮）。跟中秋的「月亮燈」（js/season.js moonlamp：
                                                 直立彎月插在燈座上）分開：這盞是彎月躺在小船裡、底下是夜裡的海，帶一顆龍龍蛋。
     B 保留造型   moonmodel     月亮島小模型     土產（每一間都能擺）。木頭底座上的小島、彎月插在小棍子上、小船、星星。
     C 原風格圖案 moonbadge     月亮島徽章       土產。圓形別針，中間印蛋蛋島地圖原本的月亮、星星、小船（形狀照抄，月亮照原意修正，見下面）。
     D 旅行明信片 moonisle      月亮島（旅行地點）三張明信片 + 每隻兩句 + 兩隻一起的對話 + 回家日記 + 土產回憶。

   畫法：
     - 家具照 js/data.js、js/furn2～4.js：程式畫 SVG、用 st() 描邊；每一塊都有自己的填色，細線用 fill="none"，
       js/paper.js 會自動轉成新風格（紙片），不用另外寫 PF。
     - 土產、明信片照 js/traveldata.js、js/abroad.js：色紙剪的色塊、沒有描邊、下面墊一塊往下錯開的影子（tvSh）。
     - 全部自己畫，沒有用外面的圖。
   全域名稱一律用 EGM / egm 開頭（小窩的 js 是一般 script，最上層的 const 共用同一個範圍，不能撞名）。

   蛋蛋島地圖的 moon 物件（mapart.js 第 63 行 M6-40A18 18 0 1 0 6-4A14 14 0 1 1 6-40Z）兩段弧都是半圓、走同一邊，
   畫出來是空的（2026-11-28 用 Chromium 實測）。徽章照它的「原意」畫成彎月：外圈半徑 18、內圈改成半徑 22 的小弧。 */

/* ---------- 小工具 ---------- */
// 五角星的 path：中心 (x, y)、外半徑 R、內半徑 r
const egmStarD = (x, y, R, r = R * .45) => Array.from({length: 10}, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r : R; return (i ? 'L' : 'M') + (x + Math.cos(a) * k).toFixed(2) + ' ' + (y + Math.sin(a) * k).toFixed(2); }).join('') + 'Z';
// 彎月的 path：外圓中心 (x, y)、半徑 R；挖掉的圓半徑 r、圓心往 deg 方向偏 d（deg 0 = 往右挖，開口朝右）
function egmMoonD(x, y, R, r, d, deg = 0){
  const ix = (R * R - r * r + d * d) / (2 * d), iy = Math.sqrt(Math.max(0, R * R - ix * ix));
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const P = (u, v) => `${(x + u * c - v * s).toFixed(2)} ${(y + u * s + v * c).toFixed(2)}`;
  return `M${P(ix, -iy)}A${R} ${R} 0 1 0 ${P(ix, iy)}A${r} ${r} 0 ${ix - d > 0 ? 1 : 0} 1 ${P(ix, -iy)}Z`;
}
// 龍龍蛋（蛋蛋島地圖 dinoegg 的配色）：家具版有描邊
const egmEgg = (x, y, k = 1) => `<ellipse cx="${x}" cy="${y}" rx="${6.4 * k}" ry="${8.4 * k}" fill="#fff6e4" ${st('#d9c29c', 1.8)}/>`
  + [[-2, -4, 1.9, '#7fd6a6'], [2.6, 2, 1.6, '#8fc9ff'], [-2.4, 4, 1.3, '#ffb36b'], [2.2, -5.6, 1.1, '#8fc9ff']].map(([u, v, r, f]) => `<circle cx="${x + u * k}" cy="${y + v * k}" r="${r * k}" fill="${f}"/>`).join('');
// 月亮島的顏色（從蛋蛋島地圖第 42 站和棋盤主題 moon 抄來）
const EGM_C = {lilac: '#f1e2ff', sea: '#4a5596', night: '#33397a', deep: '#2f3370', ring: '#c8cdf2', ring2: '#8f97d8', moon: '#fff1b0', moonD: '#e0b84a', star: '#ffe27a',
  boat: '#ff8fb8', boat2: '#ffb36b', mast: '#a5657f', sail: '#fff', sail2: '#ffe9f1', egg: '#fff6e4', eggG: '#7fd6a6', eggB: '#8fc9ff', eggO: '#ffb36b'};

/* ---------- A：月亮島夜燈（家具） ----------
   LINK-03 欄位：itemId egm_moonlamp｜來源 collab:egg/moon（蛋蛋島第 42 章）｜vb 70×74、w 16（跟星球燈 15、中秋月亮燈 12 差不多大）
   ｜放地上（不是 wall / floor）｜glow 在月亮中間｜不能坐（不寫 seats）｜一般圖層（room.js zOf 照 y 算）。
   gift: 1 = 娃娃機（js/claw.js 第 445 行）和小店（js/shop.js 第 28 行）都不會出現；取得方式核准前一定要留著，不然會混進娃娃機的獎品池。 */
const EGM_FURN = {
  egm_moonlamp: {room: 'bed', name: '月亮島夜燈', gift: 1, collab: 'egg', theme: 'moon', vb: [70, 74], w: 16, glow: [.44, .36], svg: () => `
    <ellipse cx="35" cy="66" rx="31" ry="7" fill="${EGM_C.sea}" ${st(EGM_C.deep, 2.2)}/>
    <path d="M11 65q6-3.400 12 0t12 0 12 0 12 0" ${st(EGM_C.ring2, 1.8)} fill="none"/>
    <path d="${egmMoonD(30, 29, 22, 19, 12, -24)}" fill="${EGM_C.moon}" ${st(EGM_C.moonD, 2.2)}/>
    <path d="M14 23.500q3 2.600 6 0" ${st('#c99a3a', 1.6)} fill="none"/><circle cx="15.500" cy="30" r="2.400" fill="#ffc2dc"/>
    ${egmEgg(49, 44)}
    <path d="M12 47H58L50 61H20Z" fill="${EGM_C.boat}" ${st('#e0609d', 2.2)}/>
    <path d="M15.500 51.500H54.500" ${st('#fff', 2)} fill="none"/>
    <path d="M61 31V15" ${st(EGM_C.ring2, 1.4)} fill="none"/><path d="${egmStarD(61, 11.500, 5.600)}" fill="${EGM_C.star}" ${st(EGM_C.moonD, 1.4)}/>
    <path d="M6 33V22" ${st(EGM_C.ring2, 1.2)} fill="none"/><path d="${egmStarD(6, 19, 3.800)}" fill="${EGM_C.star}" ${st(EGM_C.moonD, 1.2)}/>`},
};

/* ---------- B、C：土產（旅行帶回來；每一間都能擺，跟 js/abroad.js 的 sv 一樣的寫法） ---------- */
const EGM_SV = {
  // B 月亮島小模型：保留月亮島的輪廓（小島 + 彎月 + 小船 + 星星），加上木頭底座的厚度和接地影子
  moonmodel: {name: '月亮島小模型', unit: '一個', vb: [40, 46], w: 9, svg: () =>
    tvSh('<ellipse cx="20" cy="41" rx="17" ry="4.600"/>', '#8a5a45', 1.2) + `<ellipse cx="20" cy="39.400" rx="15" ry="3.200" fill="#a9735c"/>`
    + tvSh('<path d="M6 39.400C7 29 13 24 20 24s13 5 14 15.400z"/>', EGM_C.sea, 1)
    + `<path d="M11 31c3-3 8-4.600 13-3.800" fill="none" stroke="${EGM_C.ring2}" stroke-width="1.400" stroke-linecap="round"/>`
    + `<rect x="13.300" y="12" width="1.400" height="14" rx=".7" fill="#e9c9a8"/>`
    + tvSh(`<path d="${egmMoonD(14, 11, 7, 6, 4, -20)}"/>`, EGM_C.moon, 1)
    + tvSh(`<path d="${egmStarD(29, 9, 3.600)}"/>`, EGM_C.star, .8)
    + tvSh('<path d="M21 34h11l-2.400 3.400h-6.200z"/>', EGM_C.boat, .8) + `<rect x="25.900" y="27" width="1" height="7" fill="${EGM_C.mast}"/><path d="M27.200 27.600l4 5.400h-4z" fill="${EGM_C.sail}"/>`
    + `<ellipse cx="17" cy="33" rx="2.200" ry="2.900" fill="${EGM_C.egg}"/><circle cx="16.300" cy="31.800" r=".7" fill="${EGM_C.eggG}"/><circle cx="17.800" cy="34" r=".6" fill="${EGM_C.eggB}"/>`},
  // C 月亮島徽章：圓形別針，裡面是蛋蛋島地圖原本的月亮、星星、小船（照 mapart.js 的形狀縮小，月亮照原意修正）
  moonbadge: {name: '月亮島徽章', unit: '一個', vb: [36, 40], w: 7, svg: () =>
    `<path d="M11 30l-3 9 5-2.400 2.600 3.400 2-9zM25 30l3 9-5-2.400-2.600 3.400-2-9z" fill="#ff8a66"/>`
    + tvSh('<circle cx="18" cy="18" r="16"/>', '#e6ecf2', 1.4) + `<circle cx="18" cy="18" r="14" fill="${EGM_C.night}"/>`
    + `<path d="M4.400 21.500h27.200A14 14 0 0 1 4.400 21.500z" fill="${EGM_C.sea}"/>`
    + `<g transform="translate(13 22) scale(.36)"><path d="M6-40A18 18 0 1 0 6-4A22 22 0 0 1 6-40Z" fill="${EGM_C.moon}"/></g>`
    + `<g transform="translate(25 11) scale(.4)"><path d="${egmStarD(0, -12, 10, 4.400)}" fill="${EGM_C.star}" stroke="${EGM_C.star}" stroke-width="2" stroke-linejoin="round"/></g>`
    + `<g transform="translate(23.400 27) scale(.22)"><path d="M-30-14H30L20 0H-20Z" fill="${EGM_C.boat}"/><path d="M-27-12H27" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M0-14V-54" stroke="${EGM_C.mast}" stroke-width="3"/><path d="M3-52L26-18H3Z" fill="${EGM_C.sail}"/><path d="M-3-46L-20-18H-3Z" fill="${EGM_C.sail2}"/></g>`
    + `<circle cx="8.800" cy="10" r=".9" fill="${EGM_C.star}"/><circle cx="29" cy="18" r=".7" fill="${EGM_C.star}"/>`
    + `<path d="M7 10.500a13 13 0 0 1 9-6.600" fill="none" stroke="#fff" stroke-width="1.600" stroke-linecap="round" opacity=".55"/>`},
};

/* ---------- D：旅行地點「月亮島」 ----------
   跟 js/abroad.js 的 TV_ABROAD 同一個格式（name、short、country、city、stamp、fav、sv、cards、lines、duo），多兩欄：
     diary：回家日記（每隻 2 句，{p} 換成地方的名字）；memo：娃娃偶爾對擺出來的土產說的回憶（LINK-04「回憶對話」）。
   要怎麼去（船票？跟機票一樣算一次？不照蛋蛋島關卡順序）是 Claude A 的旅行系統要決定的，見交接紀錄。 */
const EGM_TRIP = {
  moonisle: {name: '月亮島', short: '月亮島', country: '蛋蛋島', city: '月亮島', collab: 'egg', fav: ['dino', 'sloth'],
    // 護照上的章（24×24，currentColor）：彎月 + 兩道海浪
    stamp: `<path d="${egmMoonD(11, 10, 6.500, 5.600, 3.600, -20)}" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round"/><path d="M3 18.500q2.600-1.800 5.200 0t5.200 0 5.200 0M5 22q2.300-1.600 4.600 0t4.600 0 4.600 0" fill="none" stroke="currentColor" stroke-width="1.400" stroke-linecap="round"/><path d="${egmStarD(19, 6.500, 2.600)}" fill="currentColor"/>`,
    sv: EGM_SV,
    // at：娃娃貼在哪裡 [x%, y%（腳底）, 寬%]
    cards: [
      {name: '月亮升起來', at: [72, 93, 23], svg: () => `<rect width="300" height="200" fill="${EGM_C.deep}"/><rect width="300" height="120" fill="${EGM_C.night}"/><rect width="300" height="64" fill="${EGM_C.sea}"/>
        ${tvStars(22)}<circle cx="96" cy="58" r="46" fill="${EGM_C.moon}" opacity=".12"/>
        ${tvSh(`<path d="${egmMoonD(96, 58, 30, 26, 15, -28)}"/>`, EGM_C.moon, 2)}
        ${tvSh('<path d="M0 132c40-6 70-30 112-30s60 26 92 26 60-18 96-14v86H0z"/>', '#3d4488', 2)}
        ${tvSh('<path d="M0 150c80-10 200-10 300 0v50H0z"/>', EGM_C.deep, 2)}
        ${[[30, 160], [120, 172], [210, 158], [262, 176]].map(([x, y]) => `<path d="M${x} ${y}q8-4 16 0" fill="none" stroke="${EGM_C.ring2}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`).join('')}
        ${[[80, 158, 30], [88, 166, 20], [84, 174, 12]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="3" rx="1.500" fill="#f6e7a0" opacity=".85"/>`).join('')}
        ${tvSh('<path d="M28 146h36l-6 8H34z"/>', EGM_C.boat, 1.2)}<rect x="44.500" y="126" width="2" height="20" fill="${EGM_C.mast}"/>${tvSh('<path d="M47 128l13 16H47z"/>', EGM_C.sail, 1)}
        ${tvSh('<ellipse cx="168" cy="118" rx="5" ry="6.500"/>', EGM_C.egg, 1)}<circle cx="166.600" cy="116" r="1.300" fill="${EGM_C.eggG}"/><circle cx="169.600" cy="120" r="1.100" fill="${EGM_C.eggB}"/>
        ${tvSh(`<path d="${egmStarD(234, 40, 7)}"/>`, EGM_C.star, 1.2)}${tvSh(`<path d="${egmStarD(40, 96, 5)}"/>`, EGM_C.star, 1)}`},
      {name: '划船上島', at: [30, 96, 22], svg: () => `<rect width="300" height="200" fill="${EGM_C.lilac}"/><rect y="70" width="300" height="60" fill="#c9c4ef"/>
        <circle cx="236" cy="46" r="22" fill="#fff8e2"/>${tvCloud(26, 40, .8)}${tvCloud(170, 26, .6)}
        ${tvSh('<path d="M150 124c10-34 40-52 76-52s62 20 74 52z"/>', '#7f88c8', 2)}${tvSh('<path d="M196 124c8-18 24-28 44-28s36 12 42 28z"/>', '#9aa2d8', 1.5)}
        ${tvSh(`<path d="${egmMoonD(238, 58, 8, 7, 4.400, -20)}"/>`, EGM_C.moon, 1)}<rect x="237.400" y="64" width="1.600" height="12" fill="#e9c9a8"/>
        ${tvSh('<path d="M0 124h300v76H0z"/>', EGM_C.sea, 2)}
        ${[[24, 140], [96, 150], [170, 138], [244, 156], [60, 176], [200, 182]].map(([x, y]) => `<path d="M${x} ${y}q10-5 20 0t20 0" fill="none" stroke="${EGM_C.ring}" stroke-width="2.200" stroke-linecap="round" opacity=".6"/>`).join('')}
        ${tvSh('<path d="M96 156h86l-14 18h-58z"/>', EGM_C.boat, 2)}<path d="M100 160h78" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <rect x="137" y="104" width="3" height="52" fill="${EGM_C.mast}"/>${tvSh('<path d="M141 106l32 44h-32z"/>', EGM_C.sail, 1.5)}${tvSh('<path d="M136 114l-22 36h22z"/>', EGM_C.sail2, 1.5)}
        <path d="M182 168q14 6 30 4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`},
      {name: '燈籠和熱氣球', at: [50, 95, 22], svg: () => {
        const lan = (x, y, c, k = 1) => `<path d="M${x} ${y - 14 * k}v-6" stroke="#6a4a3a" stroke-width="1.400"/>` + tvSh(`<ellipse cx="${x}" cy="${y}" rx="${10 * k}" ry="${12 * k}"/>`, c, 1.2) + `<rect x="${x - 4 * k}" y="${y - 13.500 * k}" width="${8 * k}" height="${3 * k}" rx="1" fill="#d6a63a"/><rect x="${x - 4 * k}" y="${y + 10.500 * k}" width="${8 * k}" height="${3 * k}" rx="1" fill="#d6a63a"/><circle cx="${x}" cy="${y}" r="${18 * k}" fill="${EGM_C.star}" opacity=".14"/>`;
        const bal = (x, y, c, c2, k = 1) => tvSh(`<path d="M${x} ${y + 22 * k}C${x - 20 * k} ${y + 6 * k} ${x - 22 * k} ${y - 20 * k} ${x} ${y - 22 * k}C${x + 22 * k} ${y - 20 * k} ${x + 20 * k} ${y + 6 * k} ${x} ${y + 22 * k}z"/>`, c, 1.5)
          + `<path d="M${x} ${y - 22 * k}C${x - 8 * k} ${y - 10 * k} ${x - 7 * k} ${y + 10 * k} ${x} ${y + 22 * k}" fill="none" stroke="${c2}" stroke-width="2"/>`
          + `<path d="M${x - 6 * k} ${y + 24 * k}l2 ${7 * k}M${x + 6 * k} ${y + 24 * k}l-2 ${7 * k}" stroke="#6a4a3a" stroke-width="1.200"/>` + tvSh(`<rect x="${x - 5 * k}" y="${y + 30 * k}" width="${10 * k}" height="${7 * k}" rx="1.500"/>`, '#c98a5a', 1);
        return `<rect width="300" height="200" fill="${EGM_C.night}"/><rect width="300" height="70" fill="${EGM_C.deep}"/>${tvStars(26)}
        ${tvSh(`<path d="${egmMoonD(250, 40, 20, 17, 10, -30)}"/>`, EGM_C.moon, 1.5)}
        ${bal(70, 64, '#ff8fb8', '#ffc2dc', 1.1)}${bal(210, 92, EGM_C.boat2, '#ffd8a8', .8)}
        ${lan(130, 46, '#ff6b6b', .9)}${lan(168, 78, '#ff8fb8', .7)}${lan(26, 116, '#ffb36b', .6)}${lan(270, 120, '#ff6b6b', .6)}
        ${tvSh('<path d="M0 150c60-14 120-16 170-6 50-8 96-6 130 4v52H0z"/>', '#3d4488', 2)}
        ${tvSh('<path d="M0 172c90-8 210-8 300 0v28H0z"/>', EGM_C.deep, 2)}`; }},
    ],
    // 明信片背面：每隻兩句（照 docs/gpt 的個性；不寫其他娃娃的名字以外的規則照 js/traveldata.js TV_LINES）
    lines: {
      sloth: ['月亮好大，就在船旁邊。我想摸摸看，手伸到一半就睡著了。', '這裡的人說月亮很圓所以大家都很睏。我覺得很有道理。'],
      egg: ['島上的月亮會發光，不用開燈。很省事。', '划船上島要划很久。我沒有划，我負責躺。'],
      dog: ['我在沙灘上挖到一顆蛋！有點點的！我沒有帶走，牠的家人在等牠！', '晚上的海是藍色的，月亮掉在水裡，我一直想去叼它！'],
      moodeng: ['我在水裡跳了一下，月亮就碎掉了。過一下又好了。再跳一次。', '這邊的浪很溫柔，跟我完全相反。'],
      nyanko: ['島上沒有饅頭。本大爺吃了月亮形狀的餅，勉強可以。', '燈籠飄上天了，本大爺有看到。沒有很感動，只是看很久。'],
      dino: ['這裡有好多跟我一樣的蛋！我數了，數到一半有一顆跑走了。', '我躲在一顆大蛋後面，等人來嚇。等太久，我自己先笑出來了。'],
      snoopy: ['月亮島。這個名字我先記下來，下一本小說要用。', '我坐在船頭，假裝在找新大陸。其實已經找到了，就是這裡。'],
      piggy: ['月亮島的月亮比家裡的大兩號。我量過，用眼睛。', '划船上島要四十分鐘，划回來要三十八分鐘，因為比較想回家。'],
    },
    // 兩隻一起去：[甲, 乙, 甲說的, 乙說的]
    duo: [
      ['dino', 'sloth', '薯餅薯餅，這裡的蛋都有點點，跟我小時候一樣！', '嗯，你小時候也是蛋喔。我剛剛才知道。'],
      ['sloth', 'egg', '月亮好圓，我好睏。', '一樣。躺著看就好。'],
      ['dog', 'dino', '我找到你的親戚了！一整排！', '那不是親戚，是我躲起來的地方啦！'],
      ['snoopy', 'nyanko', '我是夜航的船長，月亮是我的燈塔。', '船長，你的點心本大爺先幫你保管了。'],
      ['moodeng', 'piggy', '燈籠飄好高！我也要飄！', '你太重了。這不是批評，是物理。'],
      ['piggy', 'egg', '划船的是我，休息的是你。', '分工合作。很好。'],
    ],
    // 回家日記：每隻 2 句（{p} 換成地方的名字）
    diary: {
      sloth: ['去了{p}。月亮很近，近到我以為可以帶回家。', '從{p}回來了。船搖啊搖，醒來就到了。'],
      egg: ['{p}的晚上很安靜。適合躺。', '去了{p}。划船的不是我。很好。'],
      dog: ['{p}的蛋我都有好好打招呼！一顆都沒有叼！', '我在{p}追浪花！浪花跑得比我快！'],
      moodeng: ['{p}的水我都踩過了。月亮也踩過了，在水裡的那個。', '在{p}跳了很多下，船晃了很多下。'],
      nyanko: ['{p}的月亮餅本大爺評過了：還行。', '本大爺在{p}守了一整晚的燈籠。沒有睡著。只閉了一下眼睛。'],
      dino: ['我在{p}找到好多蛋！我跟牠們說我會再來玩！', '{p}的捉迷藏好難，大家都長得跟我小時候一樣。'],
      snoopy: ['{p}是一個適合當結局的地方。可是我還沒寫開頭。', '我在{p}當了一晚的船長。回來又變回作家。'],
      piggy: ['{p}的路我記好了：划船、上島、看月亮、回家。', '{p}還可以。月亮那麼大，總要有人去看一下。'],
    },
    // 擺在房間的土產，娃娃偶爾經過會說一句（LINK-04 回憶對話）
    memo: {
      moonmodel: ['這是月亮島，小小的。我們真的去過喔。', '小船還在。月亮也還在。'],
      moonbadge: ['別針上的月亮跟那天晚上一樣。', '這個徽章是蛋蛋島給的，要好好放。'],
    },
  },
};
