/* 季節裝飾：過年、四月、七月、中秋、萬聖節、十二月，還有娃娃來小窩滿一年
   - 季節家具放進 FURN（有 season 欄），擁有記在 S.furnOwn，跟一般家具一樣；娃娃機抽不到（claw.js 的 rollCap 排除）
   - 收納架的家具分頁：一般家具照房間分，季節家具每個房間都列，擺在別的房間就搬過來（room.js）
   - 圍巾放在衣櫃的帽子那一格（S.closet 的 'hat.scarf'），不賣，只有十二月送；十二月扭蛋也開得到（wardrobe.js 的 lookRoll）
   - S.season = ['2027-lny', 'anniv-sloth-2027', 'ev-moon-cake-2027', …]：今年送過了、做過了。只留今年和去年的
   - 窗外的景色跟著月份換（winSeason，room.js 的 winSVG 會叫）
   不懲罰、不催人：
   - 錯過就算了，沒有補領，也沒有「快過期」的提醒；下一年會再來
   - 送東西時只跳一次小提示，不開視窗擋住房間
   - 節日的小事每天只多排一件，不算在「沒做完」裡；相簿的回憶數也只算做過的 */

// 這台在載入時就補上欄位（舊存檔沒有）
S.season = Array.isArray(S.season) ? S.season : [];

// 農曆新年（初一）和中秋的日子。憑記憶寫的，待使用者決定.md 有寫要核對
const LNY_DAY = {2027:'2027-02-06', 2028:'2028-01-26', 2029:'2029-02-13', 2030:'2030-02-03', 2031:'2031-01-23'};
const MOON_DAY = {2027:'2027-09-15', 2028:'2028-10-03', 2029:'2029-09-22', 2030:'2030-09-12', 2031:'2031-10-01'};
const RED_ENVELOPE = 6;   // 過年火腿給的紅包（枚幣）

const dnum = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5;
// 這段時間有沒有在今天：有的話回傳算在哪一年（過年和中秋看那一年的日子，其他看今天的年份）
function seasonOn(w, t){
  if (w.near){
    for (const [y, d] of Object.entries(w.near)) if (Math.abs(dnum(t) - dnum(d)) <= w.span) return y;
    return null;
  }
  if (w.m) return w.m.includes(+t.slice(5, 7)) ? t.slice(0, 4) : null;
  if (w.md){ const md = t.slice(5); return md >= w.md[0] && md <= w.md[1] ? t.slice(0, 4) : null; }
  return null;
}

/* ---------- 季節家具 ---------- */
Object.assign(FURN, {
  lantern:{room:'living',season:'lny',name:'紅燈籠',vb:[40,64],w:10,wall:1,svg:()=>`
    <path d="M20 0v8" ${st('#d99a00',2)}/>
    <rect x="13" y="7" width="14" height="5" rx="2" fill="#ffd75e" ${st('#d99a00',1.6)}/>
    <ellipse cx="20" cy="30" rx="17" ry="18" fill="#ff5a5a" ${st('#c9302c',2.2)}/>
    <path d="M20 12c-8 5-8 31 0 36M20 12c8 5 8 31 0 36" fill="none" ${st('#c9302c',1.6)}/>
    <ellipse cx="12" cy="24" rx="3" ry="5" fill="#fff" opacity=".45"/>
    <rect x="13" y="46" width="14" height="5" rx="2" fill="#ffd75e" ${st('#d99a00',1.6)}/>
    <path d="M16 52v9M20 52v11M24 52v9" ${st('#ffb020',2)}/>`},
  couplet:{room:'living',season:'lny',name:'春字貼',vb:[48,48],w:11,wall:1,svg:()=>`
    <rect x="10" y="10" width="28" height="28" rx="3" transform="rotate(45 24 24)" fill="#ff4d4d" ${st('#c9302c',2)}/>
    <rect x="14" y="14" width="20" height="20" rx="2" transform="rotate(45 24 24)" fill="none" stroke="#ffd75e" stroke-width="1.4"/>
    <text x="24" y="30.5" text-anchor="middle" font-size="17" font-weight="700" fill="#ffd75e" font-family="serif">春</text>`},
  petal:{room:'bed',season:'spring',name:'櫻花花串',vb:[92,34],w:30,wall:1,svg:()=>`
    <path d="M4 6c22 16 62 16 84 0" fill="none" ${st('#c98aa8',1.6)}/>
    ${[[14,12],[28,17],[46,19],[64,17],[78,12]].map(([x, y]) => `<g transform="translate(${x} ${y})">
      <path d="M0 0v5" ${st('#c98aa8',1.2)}/>
      ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-4" rx="3" ry="4.4" transform="translate(0 10) rotate(${a})" fill="#ffc2dc" ${st('#ff8fbf',1)}/>`).join('')}
      <circle cx="0" cy="10" r="1.8" fill="#ffd75e"/></g>`).join('')}`},
  melon:{room:'living',season:'summer',name:'西瓜坐墊',vb:[70,40],w:20,seats:[[.5,.42]],svg:()=>`
    <path d="M4 16v8c0 8 14 13 31 13s31-5 31-13v-8" fill="#7ccf5a" ${st('#4f9a37',2.2)}/>
    <path d="M14 23v10M26 25v11M44 25v11M56 23v10" stroke="#4f9a37" stroke-width="2.6" opacity=".55" stroke-linecap="round"/>
    <ellipse cx="35" cy="16" rx="31" ry="11" fill="#fff6e0" ${st('#4f9a37',2.2)}/>
    <ellipse cx="35" cy="16" rx="27" ry="8.4" fill="#ff6b7a"/>
    <g fill="#4a2b2b">${[[22,14],[30,19],[38,13],[46,18],[28,11],[42,10]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.2" ry="1.9"/>`).join('')}</g>`},
  moonlamp:{room:'bed',season:'moon',name:'月亮燈',vb:[44,62],w:12,glow:[.5,.4],svg:()=>`
    <ellipse cx="22" cy="57" rx="14" ry="4" fill="#fff4d6" ${st('#d9b46a')}/>
    <path d="M22 44v12" ${st('#d9b46a',3)}/>
    <path d="M27 6a19 19 0 1 0 0 38a15 15 0 1 1 0-38z" fill="#fff3b0" ${st('#e0b84a',2)}/>
    <g fill="#ffe27a"><circle cx="12" cy="20" r="2"/><circle cx="14" cy="32" r="1.4"/></g>
    <path d="M36 14l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#ffd75e"/>`},
  rabbit:{room:'living',season:'moon',name:'兔子燈籠',vb:[54,50],w:13,svg:()=>`
    <path d="M10 44h34" ${st('#d9b46a',2)}/>
    <circle cx="15" cy="44" r="4" fill="#ffd75e" ${st('#d99a00',1.4)}/><circle cx="39" cy="44" r="4" fill="#ffd75e" ${st('#d99a00',1.4)}/>
    <path d="M37 22c-3-10 0-19 4-19s4 9-1 19z" fill="#fff" ${st('#ff8fbf',1.8)}/>
    <path d="M42 23c0-9 5-16 8-15s1 9-5 16z" fill="#fff" ${st('#ff8fbf',1.8)}/>
    <ellipse cx="26" cy="31" rx="21" ry="11" fill="#fff" ${st('#ff8fbf',2)}/>
    <path d="M14 23c4 3 4 12 0 16M23 21c4 4 4 15 0 20" fill="none" stroke="#ffc2dc" stroke-width="2.4"/>
    <circle cx="40" cy="28" r="1.8" fill="#ff4d6d"/><ellipse cx="44" cy="32" rx="2.4" ry="1.4" fill="#ffc2dc"/>`},
  pumpkin:{room:'living',season:'hallo',name:'南瓜燈',vb:[50,46],w:12,glow:[.5,.6],svg:()=>`
    <path d="M25 11c0-5 2-8 6-9" ${st('#5ea33c',2.6)} fill="none"/>
    <ellipse cx="25" cy="28" rx="22" ry="16" fill="#ff9a3c" ${st('#d9671f',2.2)}/>
    <path d="M25 12c-6 4-6 28 0 32M25 12c6 4 6 28 0 32M12 16c-4 6-4 18 0 24M38 16c4 6 4 18 0 24" fill="none" ${st('#d9671f',1.4)}/>
    <path d="M14 25l4.5-5 4.5 5zM27 25l4.5-5 4.5 5z" fill="#ffe58f"/>
    <path d="M15 31c4 5 16 5 20 0l-3 2-3-2-4 2-4-2-3 2z" fill="#ffe58f"/>`},
  pine:{room:'living',season:'winter',name:'小松樹',vb:[50,82],w:14,svg:()=>`
    <path d="M16 68h18l-3 12H19z" fill="#ff7a7a" ${st('#d84f4f',1.8)}/>
    <rect x="21" y="62" width="8" height="7" fill="#c98a5a"/>
    <path d="M25 10L9 36h8L4 62h42L33 36h8z" fill="#6cc36a" ${st('#3f8f3c',2.2)}/>
    <path d="M14 46c8 4 16 4 24-2M18 28c5 3 10 3 15-1" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 3" opacity=".8"/>
    <g ${st('#fff',1)}><circle cx="18" cy="52" r="3" fill="#ff5a5a"/><circle cx="33" cy="54" r="3" fill="#ffd75e"/><circle cx="27" cy="40" r="2.6" fill="#8fc6ff"/><circle cx="21" cy="33" r="2.2" fill="#ff8fbf"/></g>
    <path d="M25 1l2.4 5 5.4.6-4 3.7 1.1 5.4-4.9-2.8-4.9 2.8 1.1-5.4-4-3.7 5.4-.6z" fill="#ffd75e" ${st('#d99a00',1.2)}/>`},
  snowflake:{room:'bed',season:'winter',name:'雪花窗貼',vb:[40,40],w:9,wall:1,svg:()=>`
    <g fill="none" ${st('#8fc6e6',3)}><path d="M20 3v34M5.3 11.5l29.4 17M5.3 28.5l29.4-17"/>
    <path d="M15 5l5 5 5-5M15 35l5-5 5 5M4.5 17.5l6.6-1.6-1.6-6.6M35.5 22.5l-6.6 1.6 1.6 6.6M4.5 22.5l6.6 1.6-1.6 6.6M35.5 17.5l-6.6-1.6 1.6-6.6" stroke-width="2.2"/></g>
    <circle cx="20" cy="20" r="3" fill="#fff" ${st('#8fc6e6',1.6)}/>`},
  cake:{room:'living',season:'anniv',name:'週年蛋糕',vb:[46,52],w:12,svg:()=>`
    <ellipse cx="23" cy="48" rx="22" ry="3.4" fill="#fff" ${st('#e9dff2',1.6)}/>
    <rect x="3" y="31" width="40" height="15" rx="4" fill="#ffd8e8" ${st('#ff8fbf',2)}/>
    <rect x="7" y="19" width="32" height="14" rx="4" fill="#fff" ${st('#ffb3d3',2)}/>
    <path d="M7 25c3 3 5 3 8 0s5 3 8 0 5 3 8 0 5 3 8 0" fill="none" ${st('#ff8fbf',1.6)}/>
    <g fill="#ff5a6e"><circle cx="12" cy="18" r="2.6"/><circle cx="34" cy="18" r="2.6"/></g>
    <rect x="21.5" y="9" width="3" height="10" rx="1" fill="#8fc6ff"/>
    <path d="M23 2c-3 3-3 6 0 7 3-1 3-4 0-7z" fill="#ffb020"/>`},
});
const SEASON_FURN = Object.keys(FURN).filter(id => FURN[id].season);
// 收納架家具分頁，季節家具那一組的小標（一片葉子）
const SEASON_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 19C5 10 10 4 20 4c0 10-6 15-15 15z"/><path d="M5 19l8-8" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>';

/* ---------- 圍巾：衣櫃帽子那一格 ---------- */
LOOKS.ACCESSORY_SVG.scarf = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><path d="M6 10c18 10 90 10 108 0l2 13c-20 12-92 12-112 0z" fill="#ff5a5a" stroke="#c9302c" stroke-width="3" stroke-linejoin="round"/><path d="M76 22l3 31h17l-3-32z" fill="#ff5a5a" stroke="#c9302c" stroke-width="3" stroke-linejoin="round"/><path d="M80 30h14M81 40h14" stroke="#fff" stroke-width="3" opacity=".7"/><path d="M83 54v4M88 54v4M93 54v4" stroke="#c9302c" stroke-width="2.4" stroke-linecap="round"/><path d="M18 18c22 6 62 6 84 0" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/></svg>`;
LOOKS.ACCESSORY_PLACE.scarf = {anchor:'cheeks', size:1.05, ay:-.18, dx:0};

/* ---------- 一年裡的幾段 ---------- */
const SEASONS = [
  {id:'lny', near:LNY_DAY, span:14, furn:['lantern','couplet'], coins:RED_ENVELOPE},
  {id:'spring', m:[4], furn:['petal']},
  {id:'summer', m:[7], furn:['melon']},
  {id:'moon', near:MOON_DAY, span:14, furn:['moonlamp','rabbit']},
  {id:'hallo', md:['10-25','11-07'], furn:['pumpkin']},
  {id:'winter', m:[12], furn:['pine','snowflake'], look:['hat.scarf']},
];
// 節日的小事：只在這幾天排得到
const FEST_WHEN = {
  lny:{near:LNY_DAY, span:3}, moon:{near:MOON_DAY, span:3},
  hallo:{md:['10-25','10-31']}, xmas:{md:['12-20','12-25']},
};
EVENTS.push(
  {id:'lny-red', d:['piggy'], when:'lny', t:'火腿把紅包排成一排，說要先算一下利息。', end:'算完了。火腿說利息明年再給你。'},
  {id:'moon-cake', d:['nyanko'], when:'moon', t:'中秋的月餅少了一個，貓咪老師的嘴邊有餅屑。', end:'貓咪老師交出半個月餅，說另一半是證據。'},
  {id:'hallo-ghost', d:['snoopy'], when:'hallo', t:'史努比披著床單在房間裡飄，說自己是幽靈。', end:'幽靈被床腳絆了一下，掀開還是史努比。'},
  {id:'xmas-sock', d:['dino'], when:'xmas', t:'龍龍把襪子掛在別人的床頭，說聖誕老人比較常去那邊。', end:'襪子收回來了，裡面多了一顆糖。龍龍說不是牠放的。'},
);

/* ---------- 送東西（打開時、過午夜時，main.js 的 grantCoins 會叫） ---------- */
const seasonHas = k => S.season.includes(k);
function seasonMark(k){ if (!seasonHas(k)) S.season.push(k); }
// 只留今年和去年的紀錄，免得越存越多
function seasonTrim(t){
  const y = +t.slice(0, 4);
  S.season = S.season.filter(k => { const m = /(\d{4})/.exec(k); return !m || +m[1] >= y - 1; });
}
function seasonGrant(t = todayStr()){
  seasonTrim(t);
  const msg = [];
  SEASONS.forEach(s => {
    const y = seasonOn(s, t);
    if (!y || seasonHas(`${y}-${s.id}`)) return;
    seasonMark(`${y}-${s.id}`);
    const nf = s.furn.filter(id => !FURN_OWN[id]);
    nf.forEach(id => FURN_OWN[id] = 1);
    const nl = (s.look || []).filter(k => !hasLook(k));
    nl.forEach(k => S.closet.push(k));
    if (s.coins){ S.coins += s.coins; msg.push(`火腿給你一個紅包：${s.coins} 枚幣`); }
    if (nf.length) msg.push(`${nf.map(id => FURN[id].name).join('和')}收在收納架了`);
    if (nl.length) msg.push(`衣櫃多了${nl.map(k => LOOK_ITEMS[k].name).join('和')}`);
  });
  msg.push(...seasonAnniv(t));
  if (msg.length){
    if (typeof renderHud === 'function') renderHud();
    renderTray(); save();
    seasonToast(msg);
  }
}
// 娃娃來小窩滿一年（album.met 的月日）：送一個週年蛋糕，同一天來的寫在同一句
function seasonAnniv(t){
  const y = +t.slice(0, 4), leap = (y % 4 === 0 && y % 100) || y % 400 === 0;
  const due = Object.entries(S.album.met || {}).filter(([d, m]) => {
    let md = m.slice(5);
    if (md === '02-29' && !leap) md = '02-28';
    return SPR[d] && +m.slice(0, 4) < y && md === t.slice(5) && !seasonHas(`anniv-${d}-${y}`);
  });
  if (!due.length) return [];
  due.forEach(([d]) => seasonMark(`anniv-${d}-${y}`));
  const cake = !FURN_OWN.cake;
  FURN_OWN.cake = 1;
  // 同樣滿幾年的寫在同一句
  const by = {};
  due.forEach(([d, m]) => (by[y - +m.slice(0, 4)] = by[y - +m.slice(0, 4)] || []).push(DOLL_NAME[d]));
  const yr = n => n === 1 ? '一' : n === 2 ? '兩' : n;
  return [...Object.entries(by).map(([n, who]) => `今天是${who.join('、')}來小窩滿${yr(+n)}年`), ...(cake ? ['收納架多了一個週年蛋糕'] : [])];
}
// 提示一則一則來（toast 只有一個，連著叫會蓋掉）。封面還開著就等進房間再說
function seasonToast(msgs){
  let i = 0;
  const next = () => {
    const c = $('#cover');
    if (c && !c.hidden){ setTimeout(next, 700); return; }
    toast(msgs[i++]);
    if (i < msgs.length) setTimeout(next, 1900);
  };
  setTimeout(next, 1600);
}

/* ---------- 節日的小事：main.js 的 planDay 每天最多多排一件 ---------- */
function festEvents(t = todayStr()){
  return EVENTS.filter(e => {
    if (!e.when || !e.d.every(d => DOLL_N[d])) return false;
    const y = seasonOn(FEST_WHEN[e.when], t);
    return y && !seasonHas(`ev-${e.id}-${y}`);
  });
}
function festDone(e){
  const y = seasonOn(FEST_WHEN[e.when], todayStr()) || todayStr().slice(0, 4);
  seasonMark(`ev-${e.id}-${y}`);
}

/* ---------- 窗外：跟著月份換（照片也會拍到，photo.js 是直接複製窗戶的圖） ---------- */
function winSeason(night, t = todayStr()){
  const m = +t.slice(5, 7);
  const clip = 'clip-path="url(#wclip)"';
  const defs = '<defs><clipPath id="wclip"><rect x="9" y="9" width="62" height="44" rx="9"/></clipPath></defs>';
  if (m >= 3 && m <= 5)   // 春：飄花瓣
    return defs + `<g ${clip} fill="#ffc2dc" opacity="${night ? .7 : 1}">${[[16,16,30],[30,40,-20],[48,30,50],[63,44,10],[22,28,-40],[60,14,25]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.5" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g>`;
  if (m >= 6 && m <= 8)   // 夏：綠色山坡
    return defs + `<g ${clip}><path d="M9 47c12-8 26-9 36-3s18 4 26-2v11H9z" fill="${night ? '#3f6b5a' : '#8fd88a'}"/><path d="M40 53c6-6 18-8 31-5v5z" fill="${night ? '#335a4b' : '#6cc36a'}"/></g>`;
  if (m >= 9 && m <= 11)  // 秋：落葉
    return defs + `<g ${clip} opacity="${night ? .75 : 1}">${[[18,20,'#ff9a3c',20],[34,42,'#d9671f',-30],[52,26,'#ffb020',60],[64,46,'#ff9a3c',-10],[26,34,'#e0803a',45]].map(([x, y, c, a]) => `<path d="M${x} ${y - 3}c3 1 3 5 0 6c-3-1-3-5 0-6z" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g>`;
  // 冬：小雪和積雪
  return defs + `<g ${clip}><g fill="#fff">${[[15,15],[27,24],[44,14],[36,36],[58,28],[66,16],[20,40],[52,44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4"/>`).join('')}</g><path d="M9 49c14-4 30-5 62-1v5H9z" fill="#fff"/></g>`;
}
