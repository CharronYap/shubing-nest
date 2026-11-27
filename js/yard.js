/* 門外小島（2026-11-26 重做，企劃「小島重做」）。原本是斜 45 度的 12 塊地，使用者說不好看、玩法看不懂，整個換掉。
   現在的小島是「第六個房間」：跟房間同一種看法（正面），可以拖娃娃進來、擺戶外家具，娃娃會自己走動、演小劇場。
   畫面是紙雕畫法手畫的：一層層紙雲、浮在上面的一塊草地（邊緣看得到土的層次）、遠山和天空跟著時間換、後面一條小路通往遠方。
   草地上固定四樣：左邊大樹、中間一排 6 格花圃、右邊小池塘、前面野餐墊和點心盤。晚上樹上的小燈會亮。
   玩法只有三件事，都是點一下：
   - 種花：點空位選花種下去，照真的時間長（芽 4 小時 → 花苞 → 12 小時開花），不會枯；一天可以澆一次水快 2 小時；開花點一下收成。
     一開始 3 種，一共 12 種（小客人會帶新的來）。
   - 搖樹：樹每天結 3 顆果子，點樹掉下來、再點撿起來；偶爾掉別的小東西。
   - 招待小客人：點心盤放一份點心，過一陣子有小客人來（12 種），走的時候留小東西；不在的時候也會來。
   不懲罰、不催人：沒有任何東西會枯掉、過期、變回去。
   存檔：全部在 S.yard（規則本來就收這一欄，內容不限），所以不用等規則發布。
     yard = {v:2, rm:{wall,floor,items}（小島這間房間的擺設）, bed:[null 或 {k:花, t:種下的時間, w:'澆水那天'}×6], kinds:[有哪幾種花],
             fl:{花:收過幾朵}, tree:{d:'日期', n:樹上幾顆}, drop:[{k,x,y}]（地上的東西）, plate:{k:點心, g:客人, at, till, gift}, left:[{g,gift}]（客人留的）,
             gs:{客人:來過幾次}, dig:'皮蛋挖到幣那天', rec:{…舊的事蹟}, ws:[{p,n}]（朋友澆水的牌子）, wd, wn}
     小島的擺設照理要放 home.yard，但規則的 home 只收五間，放進去整份存檔會被擋。所以實際存在 yard.rm，
     跑的時候掛在 home.yard（不會被存進 home），房間的程式照常用 home[房間]。公開給朋友看的那份才需要改規則（firestore.rules）。
   舊進度：打開時轉一次（yardMigrate）。整好的草地、花圃、樹每塊 2 枚幣，花圃另外在新花圃種好一朵開的花；
     三種裝飾變成戶外家具；種子每顆 1 枚幣；薯餅寫一封信附上幣。 */
const YARD_ICON = ICON.yard;
let yardOn = false;   // 以前小島是另外一頁，別的檔案會看這個；現在是房間，一直是 false
const YD_H = 36e5, YD_SPROUT_H = 4, YD_BLOOM_H = 12, YD_WATER_H = 2, YD_FRIEND_H = 3, YD_FRUIT = 3, YD_LEFT_MAX = 3;
const ydNow = () => Date.now() + (typeof tvSkew === 'number' ? tvSkew : 0);   // 測試時跟旅行一起把時間往後撥

/* ---------- 顏色：新風格用色票，舊風格用同一組的白天／晚上 ---------- */
const ydHex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const ydMix = (a, b, t) => { const x = ydHex(a), y = ydHex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const YD_TONE = {
  day: {sky: '#a9c8ea', hill: '#3f6f93', hill2: '#6f9fc0', sun: '#ffd36e', cloud: '#ffffff', wood: '#8a5a45', wood2: '#623f30', a1: '#ff8a66', a2: '#3f9aa5', leaf: '#4c9a78', ink: '#23264a', paper: '#fbf6ea', sand: '#e9dccb'},
  night: {sky: '#1f2a4a', hill: '#16324a', hill2: '#24486a', sun: '#ffe9a8', cloud: '#3b4a78', wood: '#8a5a45', wood2: '#623f30', a1: '#ff8a66', a2: '#4fb0b8', leaf: '#4c9a78', ink: '#12152a', paper: '#f7f0df', sand: '#6f6890'},
};
function ydC(){
  const night = (VISIT && typeof VISIT.night === 'boolean') ? VISIT.night : isNight();
  const c = window.PAPER ? window.PAPER.tone() : Object.assign({}, night ? YD_TONE.night : YD_TONE.day);
  const dark = typeof c.dark === 'boolean' ? c.dark : night, k = dark ? .42 : 0;
  c.dark = dark;
  c.grass = ydMix(ydMix(c.leaf, c.paper, .18), c.ink, k); c.grass2 = ydMix(ydMix(c.leaf, c.paper, .36), c.ink, k); c.grassd = ydMix(c.leaf, c.ink, .2 + k * .6);
  c.soil = ydMix(c.wood, c.ink, k * .5); c.soil2 = ydMix(c.wood2, c.ink, k * .5); c.soil3 = ydMix(ydMix(c.wood, c.paper, .25), c.ink, k * .5);
  c.cl = dark ? ydMix(c.cloud, c.paper, .12) : c.cloud; c.cl2 = ydMix(c.cl, c.sky, .35);
  c.water = ydMix(c.a2, c.ink, k * .6); c.water2 = ydMix(ydMix(c.a2, c.paper, .45), c.ink, k * .6);
  c.stone = ydMix(ydMix(c.ink, c.paper, .55), c.ink, k * .5);
  c.path = ydMix(c.sand, c.ink, dark ? .1 : 0);
  return c;
}
// 一片色紙：下面先畫一塊往下錯開的影子
const ydSh = (shape, fill, dy = 1.2, op = .22) => shape.replace('/>', ` fill="#12152a" opacity="${op}" transform="translate(0 ${dy})"/>`) + shape.replace('/>', ` fill="${fill}"/>`);
const ydCloud = (x, y, k, c) => ydSh(`<path d="M${x} ${y}a${5 * k} ${5 * k} 0 0 1 ${9 * k} ${-2 * k} ${6 * k} ${6 * k} 0 0 1 ${11 * k} ${1 * k} ${4 * k} ${4 * k} 0 0 1 ${2 * k} ${7 * k}h${-24 * k}a${3.5 * k} ${3.5 * k} 0 0 1 ${2 * k} ${-6 * k}z"/>`, c, .8 * k, .16);

/* ---------- 12 種花 ---------- */
const YD_FLOWERS = {
  daisy:  {name: '雛菊', c: '#fbf6ea', c2: '#ffd36e', sh: 'ray'},
  tulip:  {name: '鬱金香', c: '#ff8a66', c2: '#d96f50', sh: 'cup'},
  sunf:   {name: '向日葵', c: '#ffd36e', c2: '#8a5a45', sh: 'ray', big: 1},
  rose:   {name: '玫瑰', c: '#e8647a', c2: '#c94a62', sh: 'swirl'},
  hydr:   {name: '繡球花', c: '#9fb4ea', c2: '#c9b5e6', sh: 'ball'},
  lav:    {name: '薰衣草', c: '#a48ad6', c2: '#8a70c0', sh: 'spike'},
  lily:   {name: '鈴蘭', c: '#fbf6ea', c2: '#dfe9d6', sh: 'bell'},
  cosmos: {name: '波斯菊', c: '#f6a6c1', c2: '#ffd36e', sh: 'ray'},
  bellf:  {name: '風鈴草', c: '#7fa8e8', c2: '#5f88c8', sh: 'bell'},
  glory:  {name: '牽牛花', c: '#6f7fd6', c2: '#fbf6ea', sh: 'star'},
  dand:   {name: '蒲公英', c: '#ffe27a', c2: '#f2c84a', sh: 'ball'},
  camel:  {name: '山茶花', c: '#f0707a', c2: '#ffd36e', sh: 'swirl'},
};
const YD_KINDS0 = ['daisy', 'tulip', 'sunf'];
const YD_STAGE = ['', '冒芽了', '長花苞了', '開花了'];
// stage：1 芽、2 花苞、3 開花。30×44，莖從最下面長上來
function ydFlowerSVG(k, stage){
  const f = YD_FLOWERS[k] || YD_FLOWERS.daisy, g = '#4c9a78', g2 = '#7dbb96';
  let s;
  if (stage <= 1) s = `<rect x="14" y="36" width="2" height="8" fill="${g}"/>` + ydSh('<path d="M15 38c-5 0-7-3-7-6 4 0 7 2 7 6z"/>', g2, .8) + ydSh('<path d="M15 37c5 0 7-3 7-7-4 0-7 3-7 7z"/>', g, .8);
  else {
    const top = stage === 2 ? 24 : 15;
    s = `<rect x="14" y="${top}" width="2" height="${44 - top}" fill="${g}"/>` + ydSh('<path d="M15 36c-6 0-8-3-8-7 5 0 8 3 8 7z"/>', g2, .8) + ydSh('<path d="M15 33c6 0 8-3 8-7-5 0-8 3-8 7z"/>', g, .8);
    if (stage === 2) s += ydSh('<path d="M15 14c4 3 5 7 4 11h-8c-1-4 0-8 4-11z"/>', f.c, 1) + `<path d="M11 25c0-3 1.5-4.5 4-4.5s4 1.5 4 4.5z" fill="${g}"/>`;
    else {
      const cx = 15, cy = 13, R = f.big ? 1.2 : 1;
      if (f.sh === 'ray') s += `<circle cx="${cx}" cy="${cy + 1.2}" r="${10.6 * R}" fill="#12152a" opacity=".13"/>`
        + Array.from({length: 8}, (_, i) => `<ellipse cx="${cx}" cy="${cy - 6.5 * R}" rx="${2.6 * R}" ry="${4.8 * R}" transform="rotate(${i * 45} ${cx} ${cy})" fill="${f.c}"/>`).join('') + `<circle cx="${cx}" cy="${cy}" r="${3.8 * R}" fill="${f.c2}"/>`;
      else if (f.sh === 'cup') s += ydSh('<path d="M7 9c2 2 3 2 4 0 1.5-3 2.5-4 4-4s2.5 1 4 4c1 2 2 2 4 0 0 8-2 13-8 13S7 17 7 9z"/>', f.c, 1) + `<path d="M11 9c1.5-3 2.5-4 4-4s2.5 1 4 4c0 6-1 10-4 12-3-2-4-6-4-12z" fill="${f.c2}"/>`;
      else if (f.sh === 'swirl') s += ydSh(`<circle cx="${cx}" cy="${cy}" r="9"/>`, f.c, 1) + `<path d="M15 6a7 7 0 1 0 7 7 5 5 0 1 1-5-5 3 3 0 1 0 3 3" fill="none" stroke="${f.c2}" stroke-width="1.8" stroke-linecap="round"/>`;
      else if (f.sh === 'ball') s += [[15, 7], [9, 10], [21, 10], [11, 16], [19, 16], [15, 12]].map(([x, y], i) => ydSh(`<circle cx="${x}" cy="${y}" r="4.4"/>`, i % 2 ? f.c2 : f.c, .8)).join('');
      else if (f.sh === 'spike') s += [[15, 3], [12, 7], [18, 8], [13, 12], [17, 13], [14, 17], [16.5, 18.5], [15, 22]].map(([x, y], i) => ydSh(`<ellipse cx="${x}" cy="${y}" rx="2.7" ry="3.2"/>`, i % 2 ? f.c2 : f.c, .6)).join('');
      else if (f.sh === 'bell') s += `<path d="M15 16c0-8 6-10 9-6M15 20c0-6-5-9-9-6" fill="none" stroke="${g}" stroke-width="1.6"/>` + [[24, 12], [6, 16], [17, 8]].map(([x, y]) => ydSh(`<path d="M${x - 4} ${y + 5}c0-6 1.5-8 4-8s4 2 4 8z"/>`, f.c, .8) + `<circle cx="${x}" cy="${y + 5.5}" r="1.3" fill="${f.c2}"/>`).join('');
      else s += ydSh('<path d="M15 3l3.5 6 6.5 1-4.5 5 1 6.5-6.5-3-6.5 3 1-6.5-4.5-5 6.5-1z"/>', f.c, 1) + `<path d="M15 8l1.6 3.4 3.6.5-2.6 2.6.6 3.7-3.2-1.7-3.2 1.7.6-3.7-2.6-2.6 3.6-.5z" fill="${f.c2}"/>`;
    }
  }
  return `<svg viewBox="0 0 30 44">${s}</svg>`;
}

/* ---------- 12 種小客人（40×32）。like：喜歡哪種點心；其他條件在 ydGuestPick ---------- */
const ydG = body => `<svg viewBox="0 0 40 32">${body}</svg>`;
const YD_GUESTS = {
  butterfly: {name: '蝴蝶', like: ['flower'], say: '在盤子上停了一下，翅膀一開一合。', svg: () => ydG(ydSh('<path d="M20 16C12 2 2 6 5 14c1 4 6 5 15 2zM20 16c8-14 18-10 15-2-1 4-6 5-15 2z"/>', '#ff8a66') + ydSh('<path d="M20 17c-7 2-10 7-7 10 3 2 6-2 7-10zM20 17c7 2 10 7 7 10-3 2-6-2-7-10z"/>', '#ffd36e', .8) + '<rect x="19" y="10" width="2" height="16" rx="1" fill="#23264a"/>')},
  bee:       {name: '蜜蜂', like: ['flower'], say: '繞著盤子飛了三圈，才肯停下來。', svg: () => ydG('<ellipse cx="15" cy="9" rx="7" ry="4.5" fill="#fbf6ea" opacity=".85"/><ellipse cx="24" cy="8" rx="7" ry="4.5" fill="#fbf6ea" opacity=".85"/>' + ydSh('<ellipse cx="20" cy="18" rx="11" ry="8"/>', '#ffd36e') + '<path d="M15 11.5v13M21 10v16M27 12v12" stroke="#23264a" stroke-width="3"/><circle cx="12" cy="17" r="1.3" fill="#23264a"/>')},
  ladybug:   {name: '瓢蟲', like: ['flower', 'fruit'], say: '慢慢爬上盤子，背上有幾個黑點。', svg: () => ydG(ydSh('<path d="M6 22a14 12 0 0 1 28 0z"/>', '#e8564a') + '<path d="M20 10v12" stroke="#23264a" stroke-width="1.6"/><circle cx="13" cy="16" r="2.2" fill="#23264a"/><circle cx="26" cy="15" r="2.2" fill="#23264a"/><circle cx="15" cy="20.5" r="1.6" fill="#23264a"/><circle cx="25" cy="20.5" r="1.6" fill="#23264a"/><path d="M4 22a4 4 0 0 1 4-5v5z" fill="#23264a"/>')},
  bird:      {name: '小鳥', like: ['fruit', 'cookie'], say: '跳了兩下，啄一口就抬頭看一次。', svg: () => ydG(ydSh('<path d="M8 20c0-8 6-13 13-13 6 0 10 4 10 9 0 7-6 11-13 11-6 0-10-3-10-7z"/>', '#6fa9d2') + '<path d="M31 14l6 2-6 2z" fill="#ffd36e"/><path d="M12 20c3 3 8 3 12 0-2-4-9-5-12 0z" fill="#3f86b8"/><circle cx="26" cy="13" r="1.4" fill="#23264a"/><path d="M8 20l-6 3 6 1z" fill="#3f86b8"/>')},
  squirrel:  {name: '松鼠', like: ['fruit'], say: '把點心塞進嘴巴，臉鼓得圓圓的。', svg: () => ydG(ydSh('<path d="M6 26c-5-8-2-18 5-18 5 0 6 5 3 9 3 0 4 4 2 9z"/>', '#c98a5a') + ydSh('<path d="M15 27c-1-8 3-14 9-14 5 0 8 4 8 8 0 4-3 6-7 6z"/>', '#a9735c') + '<path d="M27 9l2 5h-5z" fill="#a9735c"/><circle cx="28" cy="18" r="1.3" fill="#23264a"/><ellipse cx="22" cy="23" rx="3" ry="3.5" fill="#f2dcc4"/>')},
  snail:     {name: '蝸牛', like: ['fruit', 'flower', 'cookie'], say: '花了很久才走到盤子旁邊。牠不急。', svg: () => ydG(ydSh('<path d="M3 26h28c4 0 6-3 6-7l-3-1c0 3-1 4-3 4H6c-2 0-3 2-3 4z"/>', '#f2dcc4') + ydSh('<circle cx="17" cy="15" r="10"/>', '#c98a5a') + '<path d="M17 9a6 6 0 1 0 6 6 3.5 3.5 0 1 1-3.5-3.5" fill="none" stroke="#8a5a45" stroke-width="1.8" stroke-linecap="round"/><path d="M34 19V12M36 19l2-6" stroke="#f2dcc4" stroke-width="1.6" stroke-linecap="round"/>')},
  frog:      {name: '青蛙', like: ['fruit', 'cookie'], say: '從池塘那邊跳過來，一口吞掉。', svg: () => ydG(ydSh('<path d="M5 24c0-8 6-13 15-13s15 5 15 13c0 3-3 4-6 4H11c-3 0-6-1-6-4z"/>', '#6fbf7a') + ydSh('<circle cx="13" cy="10" r="4.5"/>', '#6fbf7a', .8) + ydSh('<circle cx="27" cy="10" r="4.5"/>', '#6fbf7a', .8) + '<circle cx="13" cy="10" r="2" fill="#23264a"/><circle cx="27" cy="10" r="2" fill="#23264a"/><path d="M13 21c4 3 10 3 14 0" fill="none" stroke="#23264a" stroke-width="1.6" stroke-linecap="round"/>')},
  dragonfly: {name: '蜻蜓', like: ['flower', 'cookie'], say: '停在盤子邊上，尾巴翹得高高的。', svg: () => ydG('<path d="M20 14C12 6 4 6 4 10s8 6 16 4zM20 14c8-8 16-8 16-4s-8 6-16 4z" fill="#d4f0ec" opacity=".9"/><path d="M20 16c-6 0-10 2-10 4s5 1 10-2zM20 16c6 0 10 2 10 4s-5 1-10-2z" fill="#d4f0ec" opacity=".8"/>' + ydSh('<rect x="18.5" y="12" width="3" height="18" rx="1.5"/>', '#3f9aa5', .8) + '<circle cx="20" cy="11" r="3.2" fill="#3f9aa5"/>')},
  firefly:   {name: '螢火蟲', like: ['fruit', 'flower', 'cookie'], night: 1, say: '屁股一閃一閃的，把盤子照得黃黃的。', svg: () => ydG('<circle cx="26" cy="19" r="11" fill="#ffe9a8" opacity=".3"/>' + ydSh('<ellipse cx="17" cy="17" rx="8" ry="5"/>', '#4f5674') + '<circle cx="26" cy="19" r="5" fill="#ffe27a"/><path d="M14 13c0-6 6-8 9-4" fill="none" stroke="#d4f0ec" stroke-width="3" stroke-linecap="round" opacity=".8"/><circle cx="11" cy="16" r="1.2" fill="#fbf6ea"/>')},
  hedgehog:  {name: '刺蝟', like: ['fruit'], night: 1, say: '把點心頂在背上的刺，搖搖晃晃地走了。', svg: () => ydG(ydSh('<path d="M4 25c0-3 1-5 3-6l-2-3 4 1 0-4 3 3 2-5 2 4 3-4 1 5 4-3 0 4 4-1-1 4c2 1 3 3 3 5z"/>', '#8a5a45') + ydSh('<path d="M24 25c0-5 3-8 7-8 4 0 6 3 7 6l-3 2z"/>', '#f2dcc4', .8) + '<circle cx="32" cy="21" r="1.2" fill="#23264a"/><circle cx="37.5" cy="23" r="1.3" fill="#23264a"/>')},
  rabbit:    {name: '兔子', like: ['flower', 'cookie'], say: '耳朵先從草裡冒出來，然後才是臉。', svg: () => ydG(ydSh('<path d="M12 14C10 4 12 1 14.5 1S18 5 17 14zM22 14c-1-9 0-13 2.5-13S28 4 26 14z"/>', '#fbf6ea', .8) + ydSh('<ellipse cx="19" cy="21" rx="12" ry="9"/>', '#fbf6ea') + '<circle cx="15" cy="19" r="1.3" fill="#23264a"/><circle cx="23" cy="19" r="1.3" fill="#23264a"/><ellipse cx="19" cy="23" rx="1.8" ry="1.2" fill="#f6a6c1"/>')},
  turtle:    {name: '烏龜', like: ['cookie', 'fruit'], say: '從池塘爬上來，脖子伸得好長。', svg: () => ydG('<ellipse cx="8" cy="25" rx="4" ry="2.5" fill="#7dbb96"/><ellipse cx="28" cy="25" rx="4" ry="2.5" fill="#7dbb96"/>' + ydSh('<path d="M30 19c3-3 8-2 8 2 0 3-4 4-8 2z"/>', '#7dbb96', .8) + ydSh('<path d="M4 23a14 12 0 0 1 28 0z"/>', '#4c9a78') + '<path d="M11 14l5 9M25 14l-5 9M14 12h8" fill="none" stroke="#3a7a5e" stroke-width="1.6"/><circle cx="35" cy="19.5" r="1.1" fill="#23264a"/>')},
};
const YD_SNACKS = {
  fruit:  {name: '果子', cost: '用 1 顆果子'},
  flower: {name: '花蜜', cost: '用 1 朵花'},
  cookie: {name: '餅乾', cost: '2 枚幣'},
};
const YD_COOKIE = 2;
const ydSnackSVG = (k, c) => (k === 'fruit' ? `<circle cx="20" cy="9" r="5" fill="${c.a1}"/><path d="M20 4c0-2 1-3 3-3" fill="none" stroke="${c.wood2}" stroke-width="1.4"/>` : k === 'flower' ? `${[0, 72, 144, 216, 288].map(a => `<ellipse cx="20" cy="5" rx="2.2" ry="3.4" transform="rotate(${a} 20 9)" fill="#f6a6c1"/>`).join('')}<circle cx="20" cy="9" r="2" fill="${c.sun}"/>` : `<circle cx="20" cy="9" r="5.5" fill="#e9c28a"/><circle cx="18" cy="8" r="1" fill="${c.wood2}"/><circle cx="22" cy="10" r="1" fill="${c.wood2}"/><circle cx="20.5" cy="6.5" r=".8" fill="${c.wood2}"/>`);

/* ---------- 戶外家具：原本長在地上的三種裝飾（蘑菇燈、雲朵長椅、小木牌），現在可以自己擺。小店也買得到 ---------- */
Object.assign(FURN, {
  ydlamp:  {room: 'yard', name: '蘑菇燈', vb: [40, 54], w: 11, svg: () => '<ellipse cx="20" cy="51" rx="11" ry="2.5" fill="#12152a" opacity=".18"/>' + ydSh('<rect x="15" y="24" width="10" height="26" rx="4"/>', '#fbf6ea', 1.4) + ydSh('<path d="M2 26C2 12 10 4 20 4s18 8 18 22z"/>', '#ff8a66', 1.6) + '<circle cx="12" cy="16" r="3" fill="#fbf6ea"/><circle cx="24" cy="11" r="2.4" fill="#fbf6ea"/><circle cx="28" cy="20" r="2.6" fill="#fbf6ea"/>'},
  ydbench: {room: 'yard', name: '雲朵長椅', vb: [90, 46], w: 26, seats: [[.3, .5], [.7, .5]], svg: () => '<rect x="14" y="30" width="6" height="14" rx="2.5" fill="#8a5a45"/><rect x="70" y="30" width="6" height="14" rx="2.5" fill="#8a5a45"/>' + ydSh('<path d="M8 22a8 8 0 0 1 10-9 11 11 0 0 1 20-3 12 12 0 0 1 22 1 10 10 0 0 1 18 5 8 8 0 0 1 4 6z"/>', '#fbf6ea', 1.6) + ydSh('<rect x="4" y="22" width="82" height="11" rx="5.5"/>', '#dfe3f0', 1.6)},
  ydsign:  {room: 'yard', name: '小木牌', vb: [40, 46], w: 11, svg: () => '<rect x="18" y="20" width="4" height="24" rx="1.5" fill="#623f30"/>' + ydSh('<path d="M4 6h26l7 8-7 8H4z"/>', '#c98a5a', 1.4) + '<rect x="9" y="11" width="16" height="2" rx="1" fill="#fbf6ea"/><rect x="9" y="15" width="11" height="2" rx="1" fill="#fbf6ea"/>'},
});
ROOM_FURN.yard = ['ydlamp', 'ydbench', 'ydsign'];
// 舊信裡還沒領的種子附件：現在沒有種子了，領的時候換成 1 枚幣（js/mail.js）
const YARD_SEED = {grass: {name: '草的種子（現在換成 1 枚幣）'}, flower: {name: '花的種子（現在換成 1 枚幣）'}, tree: {name: '樹苗（現在換成 1 枚幣）'}};
const yardAtt = a => (a && a.startsWith('seed-') && YARD_SEED[a.slice(5)] ? {name: YARD_SEED[a.slice(5)].name, svg: ydFlowerSVG('daisy', 1)} : null);
const yardPickSeed = () => 'flower';   // 留著給舊的呼叫用；現在信裡不會再附種子（要 S.yard.day，新的存檔沒有）

/* ---------- 存檔 ---------- */
function yardFresh(){ return {v: 2, rm: {wall: 'yard', floor: 'yard', items: []}, bed: [null, null, null, null, null, null], kinds: YD_KINDS0.slice(), fl: {}, tree: {d: '', n: 0}, drop: [], plate: null, left: [], gs: {}}; }
// 舊的 12 塊地轉成新的：只做一次
function yardMigrate(o){
  const y = yardFresh(), P = Array.isArray(o.p) ? o.p : [];
  let coins = 0, fl = 0;
  P.forEach(p => {
    if (!p) return;
    if (['grass', 'flower', 'tree'].includes(p.s)) coins += 2;
    if (p.s === 'flower' && fl < 6){ y.bed[fl] = {k: YD_KINDS0[fl % YD_KINDS0.length], t: Date.now() - (YD_BLOOM_H + 1) * YD_H, w: ''}; fl++; }
    if (p.s === 'deco' && FURN['yd' + p.k]) FURN_OWN['yd' + p.k] = 1;
  });
  Object.values(o.seeds || {}).forEach(n => { coins += Math.max(0, n | 0); });
  // 在小島「放一晚」的娃娃：回到原本的房間
  Object.keys(o.stay || {}).forEach(d => {
    if (!DOLL_N[d] || RIDS.some(r => home[r] && home[r].items.some(i => i.kind === 'doll' && i.id === d))) return;
    const st = o.stay[d] || {}, r = home[st.from] ? st.from : 'living';
    home[r].items.push({uid: uid++, kind: 'doll', id: d, x: 50, y: 92, sit: null, seat: 0});
  });
  ['rec', 'ws', 'wd', 'wn'].forEach(k => { if (o[k]) y[k] = o[k]; });
  y.ws = [];   // 舊的牌子對不上新的花圃
  if (o.day && !P.some(p => p && (p.s === 'rock' || p.s === 'bush'))) y.old12 = 1;   // 以前 12 塊地都整好了：里程碑照樣算
  y.mig = {c: coins, d: todayStr()};   // 等信箱載好了，薯餅寄一封信附上幣（yardMigMail）
  return y;
}
function yardInit(){
  let y = S.yard;
  if (!y || typeof y !== 'object' || Array.isArray(y)) y = S.yard = yardFresh();
  else if (y.v !== 2) y = S.yard = (Array.isArray(y.p) ? yardMigrate(y) : Object.assign(yardFresh(), {rec: y.rec || {}}));
  if (!y.rm || typeof y.rm !== 'object' || !Array.isArray(y.rm.items)) y.rm = {wall: 'yard', floor: 'yard', items: []};
  y.rm.wall = 'yard'; y.rm.floor = 'yard';
  if (!Array.isArray(y.bed)) y.bed = [];
  for (let i = 0; i < 6; i++){ const b = y.bed[i]; y.bed[i] = b && YD_FLOWERS[b.k] && typeof b.t === 'number' ? b : null; }
  y.bed.length = 6;
  y.kinds = (Array.isArray(y.kinds) ? y.kinds : []).filter(k => YD_FLOWERS[k]); YD_KINDS0.forEach(k => { if (!y.kinds.includes(k)) y.kinds.push(k); });
  ['fl', 'gs', 'rec'].forEach(k => { if (!y[k] || typeof y[k] !== 'object' || Array.isArray(y[k])) y[k] = {}; });
  if (!y.tree || typeof y.tree !== 'object') y.tree = {d: '', n: 0};
  if (!Array.isArray(y.drop)) y.drop = [];
  if (!Array.isArray(y.left)) y.left = [];
  if (!Array.isArray(y.ws)) y.ws = [];
  if (y.plate && !(YD_SNACKS[y.plate.k] && YD_GUESTS[y.plate.g])) y.plate = null;
  return y;
}
yardInit();
// 小島這間房間：掛在 home.yard，但不會被存進 home（存在 S.yard.rm）
function yardHook(){ Object.defineProperty(home, 'yard', {value: S.yard.rm, enumerable: false, configurable: true, writable: true}); }
yardHook();
if (!RIDS.includes('yard')) RIDS.push('yard');
const yardHas = s => !s || ['tree', 'pond', 'grass', 'flower'].includes(s);   // 小島的小事（js/data.js）：新的小島一開始就有樹、池塘、草地
function yardRec(d, line){ const r = S.yard.rec[d] = S.yard.rec[d] || []; r.push(`${todayStr()}|${line}`); if (r.length > 12) r.splice(0, r.length - 12); }
function yardRows(d){
  const r = ((S.yard || {}).rec || {})[d] || []; if (!r.length) return '';
  return `<div class="al-sec">小島</div><ul class="al-ln al-st">${r.slice().reverse().slice(0, 6).map(x => `<li>${md(x.slice(0, 10))}　${x.slice(11)}</li>`).join('')}</ul>`;
}
/* 兩台裝置的小島合在一起（js/account.js 的 mergeSave 會叫；m 是雲端那份，g 是這台的，都是純資料）。
   擺設（rm）跟其他房間一樣用雲端的。花的種類、收過幾朵、來過的客人：兩邊合起來。
   花圃每一格：只有一邊有就用那一邊；兩邊都有，用比較晚種的。樹、地上的東西、點心盤、客人留的東西：用這台的（玩家剛剛看到的是這台）。 */
function yardMerge(m, g){
  const obj = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : {}), arr = x => (Array.isArray(x) ? x : []);
  m.kinds = [...new Set([...arr(m.kinds), ...arr(g.kinds)])];
  ['fl', 'gs'].forEach(k => { m[k] = obj(m[k]); Object.entries(obj(g[k])).forEach(([id, n]) => { m[k][id] = Math.max(m[k][id] || 0, n | 0); }); });
  if (g.old12) m.old12 = 1;
  const mb = arr(m.bed), gb = arr(g.bed); m.bed = [0, 1, 2, 3, 4, 5].map(i => { const a = mb[i] || null, b = gb[i] || null; return a && b ? (b.t > a.t ? b : a) : a || b; });
  ['tree', 'drop', 'plate', 'left', 'dig', 'ws'].forEach(k => { if (k in g) m[k] = g[k]; });
  m.wd = [...new Set([...arr(m.wd), ...arr(g.wd)])].slice(-30);
  m.rec = obj(m.rec); Object.entries(obj(g.rec)).forEach(([d, l]) => { m.rec[d] = [...new Set([...arr(m.rec[d]), ...arr(l)])].sort().slice(-12); });
  return m;
}
// 別的檔案還會叫的舊名字
function yardOpen(){ if (roomId !== 'yard') goRoom('yard'); }
function yardClose(){}
function yardRecall(){}
function yardPaint(){ if (roomId === 'yard' && (typeof page === 'undefined' || page === 'room')) ydPaint(); }

/* ---------- 花圃 ---------- */
const ydStage = b => { if (!b) return 0; const h = (ydNow() - b.t) / YD_H; return h >= YD_BLOOM_H ? 3 : h >= YD_SPROUT_H ? 2 : 1; };
function ydBloomWhen(b){
  const ms = b.t + YD_BLOOM_H * YD_H, d = new Date(ms), n = new Date(ydNow());
  const day0 = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(), diff = Math.round((day0(d) - day0(n)) / 864e5), h = d.getHours();
  return (diff <= 0 ? '今天' : diff === 1 ? '明天' : '後天') + (h < 5 ? '半夜' : h < 11 ? '早上' : h < 13 ? '中午' : h < 17 ? '下午' : h < 19 ? '傍晚' : '晚上');
}
function ydBedTap(i){
  const y = S.yard, b = y.bed[i];
  const sign = y.ws.find(w => w.p === i);
  if (sign){ y.ws = y.ws.filter(w => w !== sign); save(); ydPaint(); toast(`${sText(sign.n, 12) || '朋友'}來澆過水，這朵長得比較快`); return; }
  if (!b){ ydPick(i); return; }
  const st = ydStage(b), f = YD_FLOWERS[b.k];
  if (st === 3){
    y.bed[i] = null; y.fl[b.k] = (y.fl[b.k] || 0) + 1;
    if (typeof earnData === 'function') earnData().bag.flower++;
    save(); ydPaint();
    toast(`收了一朵${f.name}，可以拿去火腿的小店換幣`);
    return;
  }
  if (b.w !== todayStr()){
    b.w = todayStr(); b.t -= YD_WATER_H * YD_H;
    save(); ydPaint(); ydSplash(i);
    toast(ydStage(b) === 3 ? `澆了水，${f.name}開了` : `澆了水，${f.name}會長快一點`);
  } else toast(`${f.name}${YD_STAGE[st]}，大概${ydBloomWhen(b)}開花。今天澆過水了`);
}
function ydSplash(i){
  const el = room.querySelector(`.yd-slot[data-i="${i}"]`); if (!el || REDUCE) return;
  el.animate([{transform: 'translateX(-50%) scale(1)'}, {transform: 'translateX(-50%) scale(1.12,.92)'}, {transform: 'translateX(-50%) scale(1)'}], {duration: 420, easing: 'ease-out'});
}
function ydPick(i){
  const y = S.yard;
  openSheet(`<div class="hd">${YARD_ICON}<span>種一朵花</span></div>
    <div class="yd-box"><p class="st-hi">選一種種下去。大約半天開花，不會枯，放多久都在。</p>
      <div class="yd-grid">${y.kinds.map(k => `<button class="tile yd-kind" data-ydk="${k}:${i}" aria-label="${YD_FLOWERS[k].name}">${ydFlowerSVG(k, 3)}<small>${YD_FLOWERS[k].name}</small></button>`).join('')}</div>
      <p class="bk-note">現在有 ${y.kinds.length} 種，一共 12 種。小客人有時候會帶新的花來。</p></div>`);
  evOpen = false; alOpen = false;
}
function ydPlant(k, i){
  const y = S.yard; if (!YD_FLOWERS[k] || !y.kinds.includes(k) || y.bed[i]) return;
  y.bed[i] = {k, t: ydNow(), w: ''};
  $('#sheet').hidden = true; save(); ydPaint();
  toast(`種了${YD_FLOWERS[k].name}，大概${ydBloomWhen(y.bed[i])}開花`);
}
// 下雨天：全部的花都算澆過了（js/sky.js）
function yardRain(){
  const y = S.yard, t = todayStr(); let n = 0;
  y.bed.forEach(b => { if (b && ydStage(b) < 3 && b.w !== t){ b.w = t; b.t -= YD_WATER_H * YD_H; n++; } });
  if (n){ save(); yardPaint(); }
}

/* ---------- 樹 ---------- */
function ydTreeDay(){ const tr = S.yard.tree, t = todayStr(); if (tr.d !== t){ tr.d = t; tr.n = YD_FRUIT; } return tr; }
function ydTreeTap(){
  const y = S.yard, tr = ydTreeDay();
  const el = room.querySelector('.yd-tree');
  if (el && !REDUCE) el.animate([{transform: 'translateX(-50%) rotate(0)'}, {transform: 'translateX(-50%) rotate(-2.5deg)'}, {transform: 'translateX(-50%) rotate(2deg)'}, {transform: 'translateX(-50%) rotate(-1deg)'}, {transform: 'translateX(-50%) rotate(0)'}], {duration: 520, easing: 'ease-out'});
  if (!tr.n){ toast('今天的果子都搖下來了，明天還會結'); return; }
  const spots = [[14, 68], [24, 72], [31, 66], [19, 78], [28, 80]];
  for (let i = 0; i < tr.n && y.drop.length < 8; i++){ const s = spots[y.drop.length % spots.length]; y.drop.push({k: 'fruit', x: s[0] + Math.round(Math.random() * 3), y: s[1]}); }
  tr.n = 0;
  // 偶爾掉別的：一片葉子、一隻睡著的小蟲，或龍龍藏的東西
  if (Math.random() < .3 && y.drop.length < 8){ const r = Math.random(); y.drop.push({k: r < .45 ? 'leaf' : r < .8 || !DOLL_N.dino ? 'bug' : 'toy', x: 35, y: 76}); }
  save(); setTimeout(ydPaint, REDUCE ? 0 : 260);
}
function ydDropTap(j){
  const y = S.yard, d = y.drop[j]; if (!d) return;
  y.drop.splice(j, 1);
  if (d.k === 'fruit'){ if (typeof earnData === 'function') earnData().bag.fruit++; toast('撿到一顆果子，可以換幣，也可以放在點心盤'); }
  else if (d.k === 'leaf'){ S.coins += 1; toast('一片很漂亮的葉子。火腿說值 1 枚幣'); }
  else if (d.k === 'coin'){ S.coins += 1; toast('皮蛋挖出來的 1 枚幣'); }
  else if (d.k === 'toy'){ S.coins += 3; toast('龍龍藏在樹上的東西。牠說找到就是你的，3 枚幣'); }
  else toast('一隻睡著的小蟲。把牠放回樹上了');
  if (typeof renderHud === 'function') renderHud();
  save(); ydPaint();
}

/* ---------- 點心盤和小客人 ---------- */
const ydInYard = d => S.yard.rm.items.some(i => i.kind === 'doll' && i.id === d);
function ydGuestPick(snack, at){
  const y = S.yard, h = new Date(at).getHours(), night = h >= 19 || h < 5;
  const rain = typeof skyWeather === 'function' && skyWeather(todayStr()) === 'rain', bloom = y.bed.some(b => ydStage(b) === 3);
  const ids = Object.keys(YD_GUESTS).filter(g => YD_GUESTS[g].like.includes(snack) && (!YD_GUESTS[g].night || night));
  const w = g => (y.gs[g] ? 1 : 1.6)   // 還沒來過的機會高一點
    * (night && YD_GUESTS[g].night ? 3 : 1) * (bloom && (g === 'butterfly' || g === 'bee') ? 2 : 1)
    * (ydInYard('moodeng') && (g === 'frog' || g === 'dragonfly') ? 2.5 : 1) * (rain && (g === 'snail' || g === 'frog') ? 2.5 : 1);
  const ws = ids.map(w), sum = ws.reduce((a, b) => a + b, 0); let r = Math.random() * sum;
  for (let i = 0; i < ids.length; i++){ r -= ws[i]; if (r <= 0) return ids[i]; }
  return ids[0] || 'snail';
}
function ydPlateSet(k){
  const y = S.yard; if (y.plate || !YD_SNACKS[k]) return;
  const e = typeof earnData === 'function' ? earnData() : null;
  if (k === 'cookie'){ if (S.coins < YD_COOKIE){ toast(`還差 ${YD_COOKIE - S.coins} 枚幣`); return; } S.coins -= YD_COOKIE; }
  else { if (!e || !(e.bag[k] > 0)){ toast(k === 'fruit' ? '手上沒有果子。搖一搖樹就有' : '手上沒有花。花圃開花了點一下就收得到'); return; } e.bag[k]--; }
  const now = ydNow(), wait = (10 + Math.random() * 30) * (ydInYard('nyanko') ? .5 : 1) * 60000;   // 貓咪老師在小島的時候，客人來得比較快
  const g = ydGuestPick(k, now + wait), locked = Object.keys(YD_FLOWERS).filter(f => !y.kinds.includes(f) && !y.left.some(l => l.gift === 'kind-' + f));
  const r = Math.random();
  const gift = r < .28 && locked.length ? 'kind-' + locked[Math.floor(Math.random() * locked.length)] : 'coin-' + (r > .88 ? 5 : 2 + Math.floor(Math.random() * 3));
  y.plate = {k, g, at: Math.round(now + wait), till: Math.round(now + wait + (20 + Math.random() * 20) * 60000), gift};
  $('#sheet').hidden = true;
  if (typeof renderHud === 'function') renderHud();
  save(); ydPaint();
  toast('點心放好了。過一陣子會有小客人來，不用等');
}
// 客人來過、走了：留下的東西放在盤子旁邊
function ydGuestTick(){
  const y = S.yard, p = y.plate; if (!p || ydNow() < p.till) return false;
  y.left.push({g: p.g, gift: p.gift}); if (y.left.length > YD_LEFT_MAX) y.left.splice(0, y.left.length - YD_LEFT_MAX);
  y.gs[p.g] = (y.gs[p.g] || 0) + 1;
  y.plate = null;
  return true;
}
function ydPlateTap(){
  const y = S.yard;
  if (y.left.length){ ydLeftTake(); return; }
  const p = y.plate;
  if (p){ toast(ydNow() >= p.at ? `${YD_GUESTS[p.g].name}正在吃` : '點心放著了。過一陣子會有小客人來，不用等'); return; }
  const e = typeof earnData === 'function' ? earnData().bag : {fruit: 0, flower: 0};
  const have = {fruit: e.fruit || 0, flower: e.flower || 0, cookie: Math.floor(S.coins / YD_COOKIE)};
  const c = ydC();
  openSheet(`<div class="hd">${YARD_ICON}<span>放一份點心</span></div>
    <div class="yd-box"><p class="st-hi">放好之後過一陣子，會有小客人來。你不在的時候牠也會來，走的時候留一個小東西。</p>
      <div class="yd-grid three">${Object.keys(YD_SNACKS).map(k => `<button class="tile yd-kind ${have[k] ? '' : 'dim'}" data-ydsn="${k}" aria-label="${YD_SNACKS[k].name}，${YD_SNACKS[k].cost}"><svg viewBox="8 0 24 18">${ydSnackSVG(k, c)}</svg><small>${YD_SNACKS[k].name}</small><i>${YD_SNACKS[k].cost}${k === 'cookie' ? '' : `，有 ${have[k]}`}</i></button>`).join('')}</div>
      <p class="bk-note">放的點心不一樣，來的客人也不一樣。有幾種只在晚上來。</p></div>
    <div class="ml-ft"><button class="btn" data-yd="book">花和小客人</button></div>`);
  evOpen = false; alOpen = false;
}
function ydLeftTake(){
  const y = S.yard, out = [];
  y.left.forEach(l => {
    const g = YD_GUESTS[l.g] ? YD_GUESTS[l.g].name : '小客人';
    if (l.gift.startsWith('kind-')){
      const k = l.gift.slice(5);
      if (YD_FLOWERS[k] && !y.kinds.includes(k)){ y.kinds.push(k); out.push(`${g}來過，留了一種新的花：${YD_FLOWERS[k].name}`); }
      else { S.coins += 2; out.push(`${g}來過，留了 2 枚幣`); }
    } else { const n = Math.max(1, Math.min(9, +l.gift.slice(5) || 2)); S.coins += n; out.push(`${g}來過，留了 ${n} 枚幣`); }
  });
  y.left = [];
  if (typeof renderHud === 'function') renderHud();
  save(); ydPaint();
  toast(out.length > 1 ? `${out[0]}。還有 ${out.length - 1} 樣也收下了` : out[0] || '收下了');
}
function ydGuestTap(){
  const p = S.yard.plate; if (!p) return;
  const el = room.querySelector('.yd-guest');
  if (el && !REDUCE) el.animate([{transform: 'translateX(-50%) translateY(0)'}, {transform: 'translateX(-50%) translateY(-18%)'}, {transform: 'translateX(-50%) translateY(0)'}], {duration: 380, easing: 'ease-out'});
  toast(`${YD_GUESTS[p.g].name}${YD_GUESTS[p.g].say}`);
}

/* ---------- 圖鑑：花和小客人 ---------- */
let ydBookPlate = false;   // 這一次是從點心盤面板點「花和小客人」進來的：返回回點心盤面板；從主畫面的本子進來就直接關掉
function yardBookOpen(from){
  ydBookPlate = from === 'plate';
  const y = S.yard;
  const fl = Object.keys(YD_FLOWERS).map(k => (y.kinds.includes(k)
    ? `<span class="tile yd-kind">${ydFlowerSVG(k, 3)}<small>${YD_FLOWERS[k].name}</small><i>${y.fl[k] ? `收過 ${y.fl[k]} 朵` : '還沒收過'}</i></span>`
    : `<span class="tile yd-kind no"><span class="yd-sil">${ydFlowerSVG(k, 3)}</span><small>？</small></span>`)).join('');
  const gs = Object.keys(YD_GUESTS).map(g => (y.gs[g]
    ? `<span class="tile yd-kind">${YD_GUESTS[g].svg()}<small>${YD_GUESTS[g].name}</small><i>來過 ${y.gs[g]} 次</i></span>`
    : `<span class="tile yd-kind no"><span class="yd-sil">${YD_GUESTS[g].svg()}</span><small>？</small></span>`)).join('');
  openSheet(`<div class="hd">${YARD_ICON}<span>小島</span></div>
    <div class="yd-box yd-book"><div class="al-sec">花<small>${y.kinds.length} / 12 種</small></div><div class="yd-grid">${fl}</div>
      <div class="al-sec">小客人<small>${Object.keys(y.gs).filter(g => YD_GUESTS[g]).length} / 12 種</small></div><div class="yd-grid">${gs}</div>
      <p class="bk-note">新的花是小客人帶來的。點心盤放不一樣的點心，來的客人也不一樣；有幾種只在晚上來。</p></div>
    <div class="ml-ft"><button class="btn" data-yd="go">去小島</button><button class="btn" data-yd="album">返回</button></div>`);
  evOpen = false; alOpen = false;
}

/* ---------- 畫 ---------- */
// 天空那一半（100×60，下緣對齊地平線）：天空、太陽月亮、遠山、通往遠方的小路、後面的紙雲
function ydSkySVG(c){
  const stars = c.dark ? Array.from({length: 16}, (_, i) => `<circle cx="${(i * 37 + 7) % 100}" cy="${(i * 23 + 5) % 34}" r="${i % 3 ? .35 : .55}" fill="${c.sun}"/>`).join('') : '';
  const sun = c.dark ? `<circle cx="78" cy="13" r="5" fill="${c.sun}"/><circle cx="75.8" cy="11.8" r="4.3" fill="${c.sky}"/>` : `<circle cx="78" cy="14" r="6" fill="${c.sun}"/>`;
  return `<svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMax slice"><rect width="100" height="60" fill="${c.sky}"/>${stars}${sun}
    ${ydCloud(8, 18, .8, c.cl)}${ydCloud(46, 10, .6, c.cl)}
    ${ydSh('<path d="M0 46c14-12 26-14 40-4 12-12 30-14 44-2 6-4 12-4 16-2v22H0z"/>', c.hill2, 1)}
    ${ydSh('<path d="M0 52c16-8 34-8 50-2 16-8 34-8 50 0v10H0z"/>', c.hill, 1)}
    <path d="M56 60c-1-4 2-6 1-9-1-2-3-3-2-5h1.6c-.5 2 2 3 3 5 1 3-1 5 1 9z" fill="${c.path}"/>
    ${ydCloud(-6, 50, 1.3, c.cl2)}${ydCloud(74, 52, 1.2, c.cl2)}</svg>`;
}
// 地面那一半（100×50，會拉伸）：浮在雲上的一塊草地，邊緣看得到一層一層的土
function ydGroundSVG(c){
  return `<svg viewBox="0 0 100 50" preserveAspectRatio="none"><rect width="100" height="50" fill="${c.sky}"/>
    ${ydCloud(-10, 30, 2.2, c.cl2)}${ydCloud(62, 34, 2.4, c.cl2)}
    <path d="M3 0h94v36c0 8-6 13-14 13H17C9 49 3 44 3 36z" fill="${c.soil2}"/>
    <path d="M2 0h96v34c0 7-6 12-13 12H15C8 46 2 41 2 34z" fill="${c.soil}"/>
    <path d="M1 0h98v32c0 6-5 11-12 11H13C6 43 1 38 1 32z" fill="${c.soil3}"/>
    ${ydSh('<path d="M0 0h100v29c0 6-5 11-12 11H12C5 40 0 35 0 29z"/>', c.grass, .9, .2)}
    <path d="M52 0h9c1 5-3 8-2 13 1 4 5 6 4 10h-9c1-4-3-6-4-10-1-5 3-8 2-13z" fill="${c.path}" opacity=".85"/>
    ${[[8, 8], [22, 30], [40, 20], [70, 12], [88, 26], [78, 34], [14, 20], [94, 10]].map(([x, y]) => `<path d="M${x} ${y}q1.5-3.5 3 0zM${x + 2.5} ${y + .4}q1.2-2.6 2.4 0z" fill="${c.grass2}"/>`).join('')}
    ${[[30, 9], [66, 30], [84, 15], [6, 30], [46, 34]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r=".8" fill="${i % 2 ? c.paper : c.sun}"/>`).join('')}
    </svg>`;
}
// 最前面的幾朵雲：另外一張，貼在最下面、不拉伸（收納架收起來時房間變高，雲才不會被拉長）
const ydFrontSVG = c => `<svg viewBox="0 0 100 13" preserveAspectRatio="xMidYMax meet">${ydCloud(-7, 5, 1.5, c.cl)}${ydCloud(77, 6, 1.4, c.cl)}${ydCloud(36, 8, 1.1, c.cl)}</svg>`;
function ydTreeSVG(c, n, lights){
  const fr = [[18, 30], [40, 24], [30, 40]].slice(0, n).map(([x, y]) => ydSh(`<circle cx="${x}" cy="${y}" r="3.2"/>`, c.a1, .7, .25)).join('');
  const li = lights ? [[10, 34], [18, 44], [30, 47], [42, 44], [50, 34], [24, 16], [38, 14]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${c.sun}" opacity=".28"/><circle cx="${x}" cy="${y}" r="1.7" fill="${i % 2 ? c.sun : c.paper}"/>`).join('') : '';
  return `<svg viewBox="0 0 60 84"><ellipse cx="30" cy="80" rx="20" ry="3.5" fill="#12152a" opacity=".18"/>
    ${ydSh('<path d="M25 80c1-12 1-22-1-34h12c-2 12-2 22-1 34z"/>', c.soil, 1)}<path d="M30 52l8-8" stroke="${c.soil}" stroke-width="3.4" stroke-linecap="round"/>
    ${ydSh('<circle cx="30" cy="30" r="24"/>', c.grassd, 2)}${ydSh('<circle cx="16" cy="36" r="14"/>', ydMix(c.grassd, c.grass, .5), 1.6)}${ydSh('<circle cx="44" cy="34" r="13"/>', ydMix(c.grassd, c.grass, .5), 1.6)}
    ${ydSh('<circle cx="27" cy="19" r="14"/>', c.grass, 1.6)}${ydSh('<circle cx="40" cy="15" r="9"/>', c.grass2, 1.2)}${fr}${li}</svg>`;
}
const ydBedSVG = c => `<svg viewBox="0 0 120 14" preserveAspectRatio="none">${ydSh('<rect x="1" y="3" width="118" height="10" rx="5"/>', c.soil2, 1)}<rect x="3" y="2" width="114" height="8" rx="4" fill="${c.soil}"/>${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${12 + i * 19.2}" cy="6" rx="7" ry="2.6" fill="${c.soil3}"/>`).join('')}</svg>`;
const ydPondSVG = c => `<svg viewBox="0 0 60 32">${ydSh('<ellipse cx="30" cy="17" rx="28" ry="13"/>', c.stone, 1.4)}<ellipse cx="30" cy="16" rx="24" ry="10" fill="${c.water}"/><ellipse cx="26" cy="14" rx="14" ry="4.5" fill="${c.water2}" opacity=".6"/>
  <path d="M38 19m-5 0a5 2.6 0 1 0 10 0a5 2.6 0 1 0-10 0M38 19l5-1.5" fill="${c.grass}"/><circle cx="40" cy="17.8" r="1.3" fill="${c.a1}"/>
  ${[[5, 22, 4], [54, 21, 4.5], [14, 28, 3.5], [45, 28, 3.8]].map(([x, y, r]) => ydSh(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .7}"/>`, ydMix(c.stone, c.ink, .25), 1)).join('')}</svg>`;
function ydMatSVG(c, plate){
  const sq = [0, 1, 2, 3, 4, 5, 6, 7].map(i => [0, 1, 2].map(j => ((i + j) % 2 ? '' : `<rect x="${6 + i * 11}" y="${5 + j * 8}" width="11" height="8" fill="${c.paper}"/>`)).join('')).join('');
  return `<svg viewBox="0 0 100 34">${ydSh('<rect x="6" y="5" width="88" height="24" rx="3"/>', c.a1, 1.4)}<g opacity=".9">${sq}</g>
    ${ydSh('<ellipse cx="66" cy="16" rx="13" ry="5.5"/>', c.paper, 1)}<ellipse cx="66" cy="15.5" rx="9" ry="3.4" fill="${ydMix(c.paper, c.ink, .1)}"/>
    ${plate ? `<g transform="translate(46 4)">${ydSnackSVG(plate, c)}</g>` : ''}</svg>`;
}
const YD_ICON_DROP = {
  fruit: c => `<svg viewBox="0 0 20 20">${ydSh('<circle cx="10" cy="12" r="6.5"/>', c.a1, 1)}<path d="M10 6c0-3 1.5-4 3.5-4" fill="none" stroke="${c.wood2}" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  leaf: c => `<svg viewBox="0 0 20 20">${ydSh('<path d="M3 15C3 7 9 3 17 4c1 8-4 13-11 12z"/>', c.sun, 1)}<path d="M5 15c4-4 7-6 11-9" fill="none" stroke="${c.wood}" stroke-width="1.2"/></svg>`,
  bug: c => `<svg viewBox="0 0 20 20">${ydSh('<ellipse cx="10" cy="13" rx="7" ry="4.5"/>', c.grass2, 1)}<circle cx="15" cy="12" r="2.4" fill="${c.grass}"/><path d="M4 8h3M6 6l2 2" stroke="${c.paper}" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  toy: c => `<svg viewBox="0 0 20 20">${ydSh('<rect x="4" y="7" width="12" height="10" rx="2"/>', c.a2, 1)}<path d="M4 11h12M10 7v10" stroke="${c.sun}" stroke-width="1.8"/><path d="M10 7c-3-4-6-1-3 0zM10 7c3-4 6-1 3 0z" fill="${c.sun}"/></svg>`,
  coin: c => `<svg viewBox="0 0 20 20">${ydSh('<circle cx="10" cy="11" r="6.5"/>', c.sun, 1)}<circle cx="10" cy="11" r="3.6" fill="none" stroke="${ydMix(c.sun, c.ink, .3)}" stroke-width="1.4"/></svg>`,
  gift: c => `<svg viewBox="0 0 20 20">${ydSh('<path d="M4 9h12v8H4z"/>', c.paper, 1)}<rect x="3" y="6" width="14" height="4" rx="1" fill="${c.a1}"/><rect x="9" y="6" width="2" height="11" fill="${c.a1}"/></svg>`,
};
function ydPaint(){
  room.querySelectorAll('.ydx').forEach(e => e.remove());
  if (roomId !== 'yard') return;
  const own = !VISIT, y = own ? S.yard : null, vy = VISIT ? VISIT.yard : null, c = ydC();
  if (own){ ydTreeDay(); if (ydGuestTick()) save(); }
  const add = (cls, html, style, fn, label) => {
    const el = document.createElement(fn ? 'button' : 'div');
    el.className = 'fx ydx ' + cls; el.innerHTML = html; el.setAttribute('style', style);
    if (fn){ el.onclick = fn; el.setAttribute('aria-label', label || ''); } else el.setAttribute('aria-hidden', 'true');
    room.appendChild(el); return el;
  };
  const base = n => `bottom:calc(100% - var(--wh,52%) - ${n}%)`;
  add('yd-bg yd-sky', ydSkySVG(c), 'left:50%;width:100%;top:0;height:var(--wh,52%)');
  add('yd-bg yd-ground', ydGroundSVG(c), 'left:50%;width:100%;top:var(--wh,52%);bottom:0');
  add('yd-bg yd-front', ydFrontSVG(c), 'left:50%;width:100%;bottom:0');
  const gb = n => `bottom:calc((100% - var(--wh,52%)) * ${n})`;   // 從下面算起、照地面的高度（野餐墊要留在草地上）
  add('yd-tree', ydTreeSVG(c, own ? y.tree.n : 0, c.dark), `left:21%;width:30%;${base(8)}`, own ? ydTreeTap : null, own && y.tree.n ? '搖一搖樹' : '樹');
  add('yd-bedbg', ydBedSVG(c), `left:53.5%;width:47%;height:3.2%;${base(10.5)}`);
  const bed = own ? y.bed.map(b => (b ? {k: b.k, g: ydStage(b)} : null)) : (vy ? vy.bed : [null, null, null, null, null, null]);
  bed.forEach((b, i) => {
    const sign = own ? y.ws.some(w => w.p === i) : !!(vy && vy.done === i);
    const html = (b ? ydFlowerSVG(b.k, b.g) : '<svg viewBox="0 0 30 44"></svg>') + (sign ? '<i class="yd-sign"></i>' : '') + (own && b && b.g === 3 ? '<i class="yd-ready"></i>' : '');
    const el = add(`yd-slot ${b ? 'g' + b.g : 'empty'}`, html, `left:${33.9 + i * 7.85}%;width:7.6%;${base(9.2)}`,
      own ? () => ydBedTap(i) : (typeof waterTap === 'function' ? () => waterTap(i) : null), b ? `${YD_FLOWERS[b.k].name}，${YD_STAGE[b.g]}` : '空的花圃');
    el.dataset.i = i;
  });
  add('yd-pond', ydPondSVG(c), `left:85%;width:26%;${base(24)}`);
  const pl = own ? y.plate : null;
  add('yd-mat', ydMatSVG(c, pl ? pl.k : ''), `left:50%;width:44%;${gb(.25)}`, own ? ydPlateTap : null, pl ? '點心盤（有點心）' : '點心盤');
  if (own && pl && ydNow() >= pl.at) add('yd-guest', YD_GUESTS[pl.g].svg(), `left:44%;width:13%;${gb(.37)}`, ydGuestTap, YD_GUESTS[pl.g].name);
  if (own && y.left.length) add('yd-left', YD_ICON_DROP.gift(c) + (y.left.length > 1 ? `<b>${y.left.length}</b>` : ''), `left:71%;width:8%;${gb(.36)}`, ydLeftTake, '小客人留下的東西');
  if (own) y.drop.forEach((d, j) => {
    const el = add('yd-drop', (YD_ICON_DROP[d.k] || YD_ICON_DROP.fruit)(c), `left:${d.x}%;width:6.5%;top:${roomY(d.y)}%`, () => ydDropTap(j), d.k === 'fruit' ? '果子' : '掉在地上的東西');
    el.style.transform = 'translate(-50%,-100%)';
  });
}
// 房間固定的構造重畫時（換房間、換天色）一起畫；收納架的牆和地板那一頁在小島不用
if (typeof fixPaint === 'function'){ const fp = fixPaint; fixPaint = function(){ fp.apply(this, arguments); ydPaint(); }; }
{
  const prev = renderTray;
  renderTray = function(){
    prev.apply(this, arguments);
    if (roomId === 'yard' && tab === 'deco') $('#items').innerHTML = '<p class="al-em yd-nodeco">小島的天空和草地跟著時間換，不用貼壁紙。</p>';
  };
}

/* ---------- 娃娃在小島上自己會做的事（照個性，不用派）。開著「讓娃娃自己玩」才會動 ---------- */
const YD_SPOT = {
  sloth: [26, 66, ['樹下的影子剛剛好。', '……我在聽葉子的聲音。']],
  dog: [36, 72, ['我在挖洞！', '這裡的土很好挖！']],
  moodeng: [80, 80, ['踩水！', '池塘的水是我的！']],
  dino: [11, 62, ['你看不到我。', '嘿嘿，樹後面最好躲。']],
  snoopy: [42, 86, ['那朵雲很像下一章的開頭。', '躺著看天空，故事會自己掉下來。']],
  egg: [58, 86, ['墊子軟軟的。不想動。', '躺在外面跟躺在裡面一樣累。']],
  nyanko: [68, 85, ['點心是給客人的。本大爺知道。', '本大爺只是幫忙顧盤子。']],
  piggy: [60, 70, null],
};
function ydPiggyLine(){
  const b = S.yard.bed, n = b.filter(Boolean).length, bloom = b.filter(x => ydStage(x) === 3).length;
  if (!n) return '花圃是空的。空的東西沒什麼好評論的。';
  if (bloom) return bloom > 1 ? '開了這麼多還不收，是要辦花展嗎。' : '這朵開了。再不收我要幫它取名字了。';
  if (n < 6) return '還有空位。空著也是空著。';
  return '種滿了。排得不太整齊，但我可以接受。';
}
function ydAct(){
  if (roomId !== 'yard' || VISIT || document.hidden || (typeof page !== 'undefined' && page !== 'room')) return;
  if (typeof roamOn === 'undefined' || !roamOn || (typeof drag !== 'undefined' && drag) || !$('#sheet').hidden) return;
  if (typeof skitOn !== 'undefined' && skitOn) return;
  const ds = items.filter(i => i.kind === 'doll' && YD_SPOT[i.id] && !i.sit && !(typeof asleep === 'function' && asleep(i.id)));
  if (!ds.length || typeof roamHopTo !== 'function') return;
  const it = ds[Math.floor(Math.random() * ds.length)], [x, y, lines] = YD_SPOT[it.id];
  const line = lines ? lines[Math.floor(Math.random() * lines.length)] : ydPiggyLine();
  try {
    roamHopTo(it, x, y, () => {
      if (roomId !== 'yard') return;
      if (typeof roamSay === 'function') roamSay(it, line);
      // 皮蛋挖洞：一天最多挖出一枚幣
      if (it.id === 'dog' && S.yard.dig !== todayStr() && Math.random() < .5 && S.yard.drop.length < 8){ S.yard.dig = todayStr(); S.yard.drop.push({k: 'coin', x: 40, y: 76}); save(); ydPaint(); }
    });
  } catch (e) {}
}
setInterval(() => {
  ydAct();
  // 客人來了、走了：人在小島的時候畫面要跟著換
  if (roomId === 'yard' && !VISIT && !document.hidden){ const p = S.yard.plate, had = !!room.querySelector('.yd-guest'); if (p && ((ydNow() >= p.at) !== had || ydNow() >= p.till)) ydPaint(); }
}, 28000);

/* ---------- 按鈕 ---------- */
$('#sheet').addEventListener('click', e => {
  const k = e.target.closest('[data-ydk]'); if (k){ const [kind, i] = k.dataset.ydk.split(':'); ydPlant(kind, +i); return; }
  const sn = e.target.closest('[data-ydsn]'); if (sn){ ydPlateSet(sn.dataset.ydsn); return; }
  const b = e.target.closest('[data-yd]'); if (!b) return;
  if (b.dataset.yd === 'book') yardBookOpen('plate');   // 只剩點心盤面板有這顆
  else if (b.dataset.yd === 'go'){ $('#sheet').hidden = true; setPage('room'); goRoom('yard'); }
  else if (b.dataset.yd === 'album'){ if (ydBookPlate){ ydPlateTap(); if ($('#sheet .yd-book')) $('#sheet').hidden = true; } else $('#sheet').hidden = true; }   // 返回
});
// 賺幣清單用（js/earn.js）：小島現在有沒有東西可以收
const yardReady = () => { const y = S.yard; if (!y || y.v !== 2) return false; return y.bed.some(b => ydStage(b) === 3) || y.tree.d !== todayStr() || y.tree.n > 0 || y.drop.length > 0 || y.left.length > 0; };
// 舊進度換算的幣：薯餅寫一封信附上（信箱載好之後由 js/mail.js 的 mailCheck 叫）
function yardMigMail(){
  const y = S.yard, g = y && y.mig; if (!g || typeof mailInit !== 'function') return false;
  if (!(g.c > 0)){ delete y.mig; return false; }   // 沒有東西可以換：收大家都有的那一封（yard2n）
  const m = mailInit();
  if (!m.s['news-yard2']){ m.s['news-yard2'] = g.d; m.l.unshift({k: 'sloth.news.0#id=yard2', t: g.d, r: 0, a: g.c > 0 ? 'coin-' + Math.min(999, g.c) : null, g: 0}); }
  delete y.mig;
  return true;
}
