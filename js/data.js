/* 薯餅的小窩：資料（娃娃、個性、每天的小事、家具） */
const SPR = {sloth:'img/sloth.png',egg:'img/egg.png',dog:'img/dog.png',moodeng:'img/moodeng.png',nyanko:'img/nyanko.png',dino:'img/dino.png?v=1128-08',snoopy:'img/snoopy.png',piggy:'img/piggy.png'};
const DOLLS = ['sloth','egg','dog','moodeng','nyanko','dino','snoopy','piggy'];
// 名字和個性：房間裡不顯示，相簿（js/album.js）每頁會寫
const DOLL_NAME = {sloth:'薯餅',egg:'蛋黃哥',dog:'皮蛋',moodeng:'彈跳豬',nyanko:'貓咪老師',dino:'龍龍',snoopy:'史努比',piggy:'火腿'};
const DOLL_TRAIT = {sloth:['愛發呆','好脾氣'],egg:['懶','厭世'],dog:['黏人','愛藏東西'],moodeng:['脾氣大','愛鬧'],nyanko:['貪吃','嘴硬心軟'],dino:['調皮','活潑'],snoopy:['愛幻想','愛演'],piggy:['愛吐槽','萬事通']};

/* 點一下娃娃會說的話（照個性寫） */
const LINES = {
  sloth:['……嗯？','雲剛剛變成一隻兔子','慢慢來就好','我在想事情，想什麼忘了'],
  egg:['好麻煩……','可以不要動嗎','再躺五分鐘','躺著比較舒服'],
  dog:['陪我玩！','我什麼都沒藏喔','你回來了！','汪！'],
  moodeng:['哼！','不要碰我……好啦可以','我要跳了喔','誰在看我'],
  nyanko:['有吃的嗎','才不是在等你','本大爺餓了','點心呢'],
  dino:['嘿嘿','剛剛不是我','吼～','要不要玩捉迷藏'],
  snoopy:['我是王牌飛行員','今天要寫小說','噓，我在想故事','飛機準備起飛'],
  piggy:['你又在發呆','這個我知道','哼哼，計畫進行中','那個不能吃啦'],
};

/* 願望道具：娃娃機的扭蛋裡夾得到 */
const WISH = {
  snack:{name:'點心盒', need:'要一盒點心', svg:'<svg viewBox="0 0 40 40"><rect x="6" y="10" width="28" height="22" rx="6" fill="#ffd8a8" stroke="#d98e3a" stroke-width="2.2"/><g fill="#b8682a"><circle cx="14" cy="18" r="2"/><circle cx="24" cy="16" r="2"/><circle cx="20" cy="25" r="2"/><circle cx="28" cy="24" r="1.8"/></g><path d="M10 10l3-4h14l3 4" fill="#ff9cc8" stroke="#e0609d" stroke-width="2" stroke-linejoin="round"/></svg>'},
  bubble:{name:'泡泡球', need:'要一顆泡泡球', svg:'<svg viewBox="0 0 40 40"><circle cx="18" cy="22" r="12" fill="#e8f6ff" stroke="#8fc6e6" stroke-width="2.2"/><circle cx="30" cy="12" r="6" fill="#fff0f7" stroke="#ffb3d3" stroke-width="2"/><circle cx="13" cy="17" r="3" fill="#fff"/><circle cx="28" cy="10" r="1.6" fill="#fff"/></svg>'},
};

/* 每天的小事：d 是要有的娃娃，need 是要用的願望道具，tap 是要點幾次 */
// 晚上睡著時點一下看到的夢，每隻每晚一個，記在相簿那隻的頁面
const DREAMS = {
  sloth:['薯餅夢到自己變成一朵雲，飄得很慢，也沒有人催。','薯餅夢到大家排隊找牠幫忙，牠每個都說好，說到最後睡著了。','薯餅夢到早餐吃完了。醒來前才發現，夢裡也只吃到一半。'],
  egg:['蛋黃哥夢到自己在床上，翻身翻到一半就放棄了。','蛋黃哥夢到有人要牠起來運動，牠在夢裡又睡著了。','蛋黃哥夢到一個不用出門的星期一。'],
  dog:['皮蛋夢到你回家了，牠衝到門口，尾巴搖到停不下來。','皮蛋夢到一座全是拖鞋的院子，每一隻都可以藏。','皮蛋夢到牠把骨頭藏好了，然後忘記藏在哪裡。'],
  moodeng:['彈跳豬夢到一個比房間還大的浴缸，牠把水踢得到處都是。','彈跳豬夢到有人叫牠的名字，牠在夢裡大聲回了一句。','彈跳豬夢到自己跳到雲上，彈了三下才落地。'],
  nyanko:['貓咪老師夢到一整櫃點心，每一盒都寫著牠的名字。','貓咪老師夢到你迷路了，牠一邊抱怨一邊去找你。','貓咪老師夢到自己在試毒，試了十二盒，盒盒都沒毒。'],
  dino:['龍龍夢到在薯餅頭上放了一整座森林的葉子，薯餅都沒發現。','龍龍夢到大家陪牠玩捉迷藏，這次每個人都來找牠了。','龍龍夢到自己變成很大的恐龍，結果還是被火腿吐槽。'],
  snoopy:['史努比夢到自己是王牌飛行員，開著狗屋飛過三朵雲。','史努比夢到小說寫完了，第一句跟最後一句都很滿意。','史努比夢到自己在做夢，夢裡牠是一隻普通的狗。'],
  piggy:['火腿夢到邪惡豬排博士終於贏了一次，然後覺得有點寂寞。','火腿夢到大家問牠問題，牠每一題都答得出來。','火腿夢到自己的肚子裝滿了幣，重到走不動。'],
};
// 幾點睡（都睡到早上 7 點）：薯餅、蛋黃哥最早睡，龍龍、彈跳豬玩到半夜
const SLEEP_FROM = {sloth:22, egg:22, dog:23, nyanko:23, snoopy:23, piggy:23, dino:24, moodeng:24};
const WAKE_AT = 7;

const EVENTS = [
  {id:'egg-shell', d:['egg'], need:'snack', t:'蛋黃哥趴著不想動，翻都不翻身。', end:'吃到點心，蛋黃哥慢吞吞翻過來了。'},
  {id:'nyanko-taste', d:['nyanko','piggy'], need:'snack', t:'要給火腿的點心少了一塊。貓咪老師說牠在幫你試毒。', end:'補上新的點心，這次貓咪老師說不碰。'},
  {id:'snoopy-pilot', d:['snoopy'], t:'史努比趴在沙發椅背上，說這是牠的飛機。', end:'陪牠飛了一圈，史努比滿意地降落。'},
  {id:'piggy-dr', d:['piggy'], t:'火腿把自己叫做邪惡豬排博士。', end:'博士宣布今天的邪惡計畫是睡午覺。'},
  {id:'moodeng-bath', d:['moodeng'], need:'bubble', t:'彈跳豬洗澡亂踢水，來幫忙的娃娃全被噴濕。', end:'丟進泡泡球，彈跳豬忙著玩泡泡，終於安靜了。'},
  {id:'sloth-cloud', d:['sloth'], tap:3, t:'薯餅盯著窗外的雲發呆，要叫三次才會回頭。', end:'叫到第三次，薯餅慢慢轉過頭來。'},
  {id:'dog-slipper', d:['dog'], t:'拖鞋又少一隻，皮蛋蹲在門邊搖尾巴。', end:'跟著皮蛋找了一圈，拖鞋藏在沙發後面。'},
  {id:'dino-leaf', d:['dino','sloth'], t:'龍龍趁薯餅發呆，在牠頭上放了一片葉子。', end:'葉子拿下來了，薯餅到現在都沒發現。'},
  {id:'mess', d:['dino','moodeng'], t:'龍龍和彈跳豬把房間弄得一團亂。', end:'收好了。兩隻假裝什麼事都沒發生。'},
  {id:'dog-snoopy', d:['dog','snoopy'], t:'皮蛋一直找史努比玩，史努比假裝在想事情。', end:'丟出一顆球，兩隻一起追出去了。'},
  {id:'roast', d:['piggy','nyanko'], t:'火腿和貓咪老師又在互相吐槽。', end:'吵到最後，兩隻分著吃了同一包餅乾。'},
  {id:'prank', d:['dino','piggy'], t:'龍龍的惡作劇失敗了，火腿在旁邊說風涼話。', end:'龍龍說下次一定會成功。'},
  {id:'still', d:['sloth','egg'], t:'薯餅和蛋黃哥湊在一起，一整天都沒動。', end:'牠們動了一下，換了個更舒服的姿勢。'},
  // 小島的小事：小島上有那種地才會出現（js/yard.js 的 yardHas）
  {id:'sloth-tree', d:['sloth'], yard:'tree', t:'薯餅想去小島的樹下發呆。', end:'薯餅在樹下坐了一個下午，說今天很有收穫。'},
  {id:'moodeng-pond', d:['moodeng'], yard:'pond', t:'彈跳豬想去池塘泡水。', end:'彈跳豬在池塘泡到睡著，鼻子還露在外面。'},
  {id:'snoopy-runway', d:['snoopy'], yard:'grass', t:'史努比想在小島的草地上開飛機。', end:'史努比在草地上起飛又降落，降落得有點歪。'},
];
const EVENTS_PER_DAY = 3;

/* 幣 */
const COST = 2;          // 夾一次
const OPEN_COINS = 20;   // 第一次進來送
const DAILY_COINS = 20;  // 每天第一次打開（2026-11-26 從 10 調成 20）
const EVENT_COINS = 3;   // 處理一件小事（2026-11-26 從 2 調成 3）
const GIFT_RATE = .25;   // 做完小事後娃娃送東西的機率（js/gift.js）

/* 爪子：夾到幾次解鎖 */
const CLAW_UNLOCK = {egg:0, chick:0, cat:3, candy:8, gold:15};

/* ---------- 家具圖 ---------- */
const st = (c,w=2)=>`stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const FURN = {
  bed:{room:'bed',vb:[120,84],w:40,seats:[[.3,.5],[.64,.48]],set:1,svg:()=>`
    <rect x="12" y="70" width="8" height="12" rx="3" fill="#c98f56" ${st('#9a6431')}/><rect x="100" y="70" width="8" height="12" rx="3" fill="#c98f56" ${st('#9a6431')}/>
    <g fill="#fff" ${st('#c9bdf2',2.2)}><circle cx="22" cy="30" r="16"/><circle cx="46" cy="20" r="18"/><circle cx="74" cy="22" r="17"/><circle cx="98" cy="30" r="16"/></g>
    <rect x="8" y="28" width="104" height="26" fill="#fff"/>
    <path d="M10 44h100" ${st('#c9bdf2',2.2)} fill="none"/>
    <rect x="6" y="50" width="108" height="24" rx="10" fill="#f6c38f" ${st('#b9773f')}/>
    <rect x="8" y="40" width="104" height="20" rx="10" fill="#fff" ${st('#d8cfee')}/>
    <ellipse cx="26" cy="42" rx="15" ry="8" fill="#fff" ${st('#d8cfee')}/>
    <path d="M42 38h60a10 10 0 0 1 10 10v8a10 10 0 0 1-10 10H50a8 8 0 0 1-8-8z" fill="#ff9cc8" ${st('#e0609d')}/>
    <g fill="#fff" opacity=".85"><circle cx="56" cy="47" r="2.4"/><circle cx="72" cy="55" r="2.4"/><circle cx="88" cy="46" r="2.4"/><circle cx="101" cy="56" r="2.4"/></g>`},
  rug:{room:'bed',vb:[120,38],w:54,floor:1,set:1,svg:()=>`
    <ellipse cx="60" cy="19" rx="57" ry="16" fill="#cbbfff" ${st('#9d8fe0',2.2)}/>
    <ellipse cx="60" cy="19" rx="46" ry="11" fill="#e2dbff" stroke="#fff" stroke-width="2" stroke-dasharray="4 5"/>
    <ellipse cx="44" cy="15" rx="9" ry="3" fill="#fff" opacity=".7"/>`},
  lamp:{room:'bed',vb:[40,96],w:12,glow:[.5,.24],set:1,svg:()=>`
    <ellipse cx="20" cy="90" rx="14" ry="5" fill="#fff4d6" ${st('#d9b46a')}/>
    <rect x="16" y="34" width="8" height="56" rx="4" fill="#fff4d6" ${st('#d9b46a')}/>
    <path d="M3 34C3 14 11 4 20 4s17 10 17 30z" fill="#ff7aa8" ${st('#d84f84',2.2)}/>
    <g fill="#fff"><circle cx="13" cy="18" r="3.2"/><circle cx="26" cy="13" r="2.4"/><circle cx="28" cy="26" r="2.8"/><circle cx="16" cy="29" r="2"/></g>`},
  eggchair:{room:'bed',vb:[66,86],w:20,seats:[[.5,.62]],set:1,svg:()=>`
    <path d="M33 72v10M20 84h26" ${st('#b9a36a',3)} fill="none"/>
    <path d="M33 4C52 4 62 30 62 48c0 16-12 26-29 26S4 64 4 48C4 30 14 4 33 4z" fill="#fff" ${st('#e5c97a',2.2)}/>
    <path d="M10 40l7-6 6 6 6-7 6 7 6-6 6 6 7-6 4 4c1 4 1 7 1 10 0 14-10 24-25 24S8 66 8 52c0-4 1-8 2-12z" fill="#fff7d9" ${st('#e5c97a',1.6)}/>
    <ellipse cx="33" cy="56" rx="19" ry="11" fill="#ffd75e" ${st('#d99a00',1.8)}/>`},
  frame:{room:'bed',vb:[54,44],w:17,wall:1,set:1,svg:()=>`
    <rect x="3" y="3" width="48" height="38" rx="6" fill="#fff" ${st('#e0a85a',3)}/>
    <rect x="9" y="9" width="36" height="26" rx="3" fill="#bfe8ff"/>
    <path d="M17 26c-4-1-5-6-1-8 1-5 8-6 11-3 4-2 10 1 9 6 4 2 2 8-3 7-4 3-12 2-16-2z" fill="#fff"/>
    <circle cx="27" cy="22" r="5" fill="#ffc928"/>`},
  toybox:{room:'bed',vb:[66,54],w:18,svg:()=>`
    <rect x="4" y="16" width="58" height="36" rx="6" fill="#8fd3ef" ${st('#3f97c4',2.2)}/>
    <rect x="2" y="8" width="62" height="12" rx="5" fill="#b4e3f7" ${st('#3f97c4',2.2)}/>
    <path d="M33 26l3.2 6.4 7 1-5.1 5 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5.1-5 7-1z" fill="#ffd75e" ${st('#d99a00',1.4)}/>`},
  closet:{room:'bed',vb:[60,86],w:17,svg:()=>`
    <rect x="8" y="76" width="7" height="9" rx="2.5" fill="#c98f56" ${st('#9a6431')}/><rect x="45" y="76" width="7" height="9" rx="2.5" fill="#c98f56" ${st('#9a6431')}/>
    <path d="M6 14q0-8 8-8h32q8 0 8 8v64H6z" fill="#ffc2dc" ${st('#d9649c',2.2)}/>
    <path d="M14 6q16-7 32 0" fill="#ffe0ee" ${st('#d9649c',2.2)}/>
    <rect x="11" y="14" width="18" height="58" rx="5" fill="#ffe0ee" ${st('#d9649c',2)}/><rect x="31" y="14" width="18" height="58" rx="5" fill="#ffe0ee" ${st('#d9649c',2)}/>
    <circle cx="26" cy="44" r="2.4" fill="#ffd75e" ${st('#d99a00',1.4)}/><circle cx="34" cy="44" r="2.4" fill="#ffd75e" ${st('#d99a00',1.4)}/>
    <path d="M18.5 24.5a1.8 1.8 0 1 1 2.4 1.7c-.4.2-.6.5-.6 1V28M20.3 28l-6 4.3h12z" fill="none" ${st('#d9649c',1.6)}/>
    <path d="M40 22l1.6 3.2 3.5.5-2.5 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.5 3.5-.5z" fill="#fff" ${st('#d9649c',1.3)}/>`},

  sofa:{room:'living',vb:[110,72],w:36,seats:[[.33,.6],[.67,.6]],svg:()=>`
    <rect x="18" y="62" width="6" height="9" rx="2" fill="#a3683a"/><rect x="86" y="62" width="6" height="9" rx="2" fill="#a3683a"/>
    <rect x="12" y="6" width="86" height="42" rx="18" fill="#ffd75e" ${st('#d99a00',2.2)}/>
    <path d="M55 12v30" ${st('#e8b52a',2)} fill="none"/>
    <rect x="16" y="36" width="78" height="24" rx="10" fill="#ffe58f" ${st('#d99a00',2.2)}/>
    <rect x="2" y="26" width="22" height="38" rx="11" fill="#ffd75e" ${st('#d99a00',2.2)}/>
    <rect x="86" y="26" width="22" height="38" rx="11" fill="#ffd75e" ${st('#d99a00',2.2)}/>
    <ellipse cx="32" cy="16" rx="10" ry="4" fill="#fff" opacity=".55"/>`},
  tv:{room:'living',vb:[80,78],w:24,svg:()=>`
    <path d="M30 12L22 3M50 12l8-9" ${st('#9d8fe0',2.4)} fill="none"/><circle cx="22" cy="3" r="2.6" fill="#ff9cc8"/><circle cx="58" cy="3" r="2.6" fill="#ffd75e"/>
    <rect x="12" y="10" width="56" height="38" rx="10" fill="#fff" ${st('#9d8fe0',2.4)}/>
    <rect x="18" y="16" width="44" height="26" rx="6" fill="#bfe8ff"/>
    <path d="M26 34c-3 0-4-4-1-5 1-4 6-4 8-2 3-1 7 1 6 4 3 1 2 4-1 4z" fill="#fff"/><circle cx="52" cy="24" r="4" fill="#ffd75e"/>
    <rect x="6" y="52" width="68" height="22" rx="6" fill="#f2b880" ${st('#b9773f',2.2)}/>
    <path d="M40 54v18" ${st('#b9773f',1.8)} fill="none"/><circle cx="34" cy="63" r="2" fill="#b9773f"/><circle cx="46" cy="63" r="2" fill="#b9773f"/>`},
  table:{room:'living',vb:[90,46],w:26,svg:()=>`
    <rect x="16" y="20" width="7" height="24" rx="3" fill="#c98f56" ${st('#9a6431',1.6)}/><rect x="67" y="20" width="7" height="24" rx="3" fill="#c98f56" ${st('#9a6431',1.6)}/>
    <ellipse cx="45" cy="20" rx="42" ry="12" fill="#fff" ${st('#e0a85a',2.4)}/>
    <ellipse cx="45" cy="18" rx="33" ry="7" fill="#ffe3ef"/>
    <rect x="52" y="4" width="11" height="12" rx="3" fill="#ff9cc8" ${st('#e0609d',1.4)}/><path d="M63 8h3a2 2 0 0 1 0 5h-3" fill="none" ${st('#e0609d',1.4)}/>
    <circle cx="32" cy="15" r="5" fill="#ffd75e" ${st('#d99a00',1.2)}/>`},
  shelf:{room:'living',vb:[72,100],w:22,seats:[[.5,.03]],svg:()=>`
    <rect x="4" y="4" width="64" height="92" rx="8" fill="#f2b880" ${st('#b9773f',2.2)}/>
    <rect x="10" y="12" width="52" height="34" rx="4" fill="#d99a5e"/><rect x="10" y="54" width="52" height="34" rx="4" fill="#d99a5e"/>
    <rect x="14" y="22" width="7" height="24" rx="2" fill="#8fd3ef"/><rect x="22" y="18" width="7" height="28" rx="2" fill="#ff9cc8"/><rect x="30" y="24" width="6" height="22" rx="2" fill="#ffd75e"/>
    <ellipse cx="50" cy="38" rx="7" ry="8.5" fill="#fff" ${st('#e5c97a',1.6)}/>
    <rect x="15" y="68" width="16" height="20" rx="3" fill="#b8e986" ${st('#78b84a',1.4)}/><rect x="36" y="62" width="7" height="26" rx="2" fill="#cbbfff"/><rect x="45" y="66" width="7" height="22" rx="2" fill="#ff9e7a"/>`},
  plant:{room:'living',vb:[44,76],w:12,svg:()=>`
    <path d="M22 44C10 40 4 28 8 18c8 2 14 12 14 26zM22 44c12-4 18-16 14-26-8 2-14 12-14 26zM22 42C18 28 20 12 22 4c3 8 4 24 0 38z" fill="#8fd16a" ${st('#5ea33c',1.8)}/>
    <path d="M9 44h26l-4 28H13z" fill="#ff9e7a" ${st('#d9673f',2)}/><rect x="7" y="42" width="30" height="7" rx="3" fill="#ffb898" ${st('#d9673f',2)}/>`},
  clock:{room:'living',vb:[48,48],w:13,wall:1,svg:()=>`
    <circle cx="24" cy="24" r="21" fill="#fff" ${st('#ff8fbf',3.4)}/>
    <g fill="#ffc2dc"><circle cx="24" cy="9" r="2"/><circle cx="39" cy="24" r="2"/><circle cx="24" cy="39" r="2"/><circle cx="9" cy="24" r="2"/></g>
    <path d="M24 24V13M24 24l8 5" ${st('#6b2d4a',2.6)} fill="none"/><circle cx="24" cy="24" r="2.6" fill="#ffd75e"/>`},

  tub:{room:'bath',vb:[110,82],w:40,seats:[[.5,.4]],svg:()=>`
    <path d="M98 26V12a6 6 0 0 0-6-6h-8" ${st('#b8c4dc',3.2)} fill="none"/><circle cx="84" cy="6" r="3" fill="#b8c4dc"/>
    <g fill="#fff" ${st('#bfe0f2',1.6)}><circle cx="20" cy="22" r="9"/><circle cx="36" cy="15" r="11"/><circle cx="54" cy="19" r="8"/><circle cx="76" cy="17" r="10"/><circle cx="92" cy="23" r="7"/></g>
    <circle cx="25" cy="76" r="5" fill="#ffd75e" ${st('#d99a00',1.4)}/><circle cx="85" cy="76" r="5" fill="#ffd75e" ${st('#d99a00',1.4)}/>
    <path d="M6 30h98v12c0 17-14 30-31 30H37C20 72 6 59 6 42z" fill="#fff" ${st('#8fc6e6',2.4)}/>
    <rect x="2" y="25" width="106" height="10" rx="5" fill="#fff" ${st('#8fc6e6',2.4)}/>
    <path d="M20 48c6 6 16 9 30 9" ${st('#d6eef9',3)} fill="none"/>`},
  sink:{room:'bath',vb:[56,104],w:18,svg:()=>`
    <ellipse cx="28" cy="20" rx="18" ry="18" fill="#dff3ff" ${st('#ffb3d3',3.4)}/>
    <path d="M18 14l6-6M20 22l10-10" ${st('#fff',2.4)} fill="none"/>
    <path d="M22 58h12l-2 42h-8z" fill="#fff" ${st('#8fc6e6',2)}/>
    <path d="M28 46v-7h7" ${st('#b8c4dc',3)} fill="none"/>
    <path d="M4 48h48c0 10-10 16-24 16S4 58 4 48z" fill="#fff" ${st('#8fc6e6',2.2)}/>
    <rect x="2" y="44" width="52" height="7" rx="3.5" fill="#fff" ${st('#8fc6e6',2.2)}/>`},
  mat:{room:'bath',vb:[100,34],w:40,floor:1,svg:()=>`
    <rect x="4" y="4" width="92" height="26" rx="13" fill="#bdeedd" ${st('#6cc3a0',2.2)}/>
    <rect x="12" y="10" width="76" height="14" rx="7" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 4"/>`},
  towel:{room:'bath',vb:[60,52],w:18,wall:1,svg:()=>`
    <rect x="2" y="4" width="56" height="6" rx="3" fill="#d6dce8" ${st('#a9b4c8',1.6)}/>
    <path d="M10 8h40v36a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#ffb3d3" ${st('#e0609d',2)}/>
    <path d="M10 34h40M10 40h40" ${st('#fff',2.4)} fill="none"/>`},
  duck:{room:'bath',vb:[46,40],w:10,svg:()=>`
    <path d="M6 22c0-4 4-6 8-6h6c-4-2-4-12 4-13 8 0 10 8 6 12 6 0 12 0 14 4 0 12-10 19-22 19S6 32 6 22z" fill="#ffd75e" ${st('#d99a00',2)}/>
    <path d="M34 10l8 2-7 3" fill="#ff9e7a" ${st('#d9673f',1.4)}/><circle cx="29" cy="9" r="1.8" fill="#6b2d4a"/>`},
};
const ROOM_FURN={living:['sofa','tv','table','shelf','plant','clock'],bed:['bed','rug','lamp','eggchair','frame','toybox','closet'],bath:['tub','sink','mat','towel','duck']};
const WALLS=['stripe','dots','sky','tile','star'], FLOORS=['wood','check','mint','cloud'];
const CLOUD_SET=['bed','rug','lamp','eggchair','frame'];
const furnSVG=(id)=>{const f=FURN[id];return `<svg viewBox="0 0 ${f.vb[0]} ${f.vb[1]}" style="overflow:visible">${f.svg()}</svg>`};

/* 過夜日記（第五版，js/stay.js）：娃娃去朋友家住一晚，回來帶一句。照朋友家實際有的東西挑：
   need 'f:家具' = 朋友家有擺這樣家具，'d:娃娃' = 朋友家有擺這隻娃娃，'' = 都可以。{w} 是朋友的名字。
   順序不要動、只能往後加：信的代號記的是第幾句 */
const STAY_DIARY = {
  sloth: [
    {need:'f:sofa', t:'在{w}家的沙發上發呆，發到睡著，醒來還是同一個姿勢。'},
    {need:'f:tub', t:'在{w}家的浴缸泡了澡，水都涼了還不出來。'},
    {need:'f:plant', t:'盯著{w}家的盆栽看了一個晚上，說它有長高一點。'},
    {need:'d:nyanko', t:'貓咪老師分了半塊點心給牠，另外半塊藏起來了。'},
    {need:'', t:'在{w}家找了一個角落坐著，一整晚都很滿意。'},
    {need:'', t:'{w}家的地板跟家裡的不一樣，牠趴著研究了很久。'},
  ],
  egg: [
    {need:'f:bed', t:'一進{w}家就趴到床上，說出門好累。'},
    {need:'f:eggchair', t:'發現{w}家有蛋椅，窩進去就沒有再出來。'},
    {need:'f:rug', t:'在{w}家的地毯上攤平，被當成抱枕也沒有反應。'},
    {need:'d:sloth', t:'跟{w}家的薯餅比誰比較晚起，沒有分出勝負。'},
    {need:'', t:'到了{w}家，換一個地方繼續懶。'},
    {need:'', t:'說{w}家很好，因為沒有人叫牠起來。'},
  ],
  dog: [
    {need:'f:mat', t:'把{w}家浴室的踏墊叼到客廳，又叼回去。'},
    {need:'f:toybox', t:'把{w}家的玩具箱翻了一遍，每一樣都聞過。'},
    {need:'f:sofa', t:'在{w}家的沙發底下找到一隻拖鞋，很想帶回來。'},
    {need:'d:dog', t:'跟{w}家的皮蛋互相聞了很久，確認彼此都是皮蛋。'},
    {need:'', t:'在{w}家每個房間都跑了一圈，才肯坐下來。'},
    {need:'', t:'在{w}家門口守了一下，確定這裡也很安全。'},
  ],
  moodeng: [
    {need:'f:tub', t:'在{w}家的浴缸裡噴水，天花板也洗到了。'},
    {need:'f:bed', t:'在{w}家的床上跳了三十七下，第三十八下被請下來。'},
    {need:'f:sink', t:'發現{w}家的洗手台有水，開心了一整晚。'},
    {need:'d:moodeng', t:'跟{w}家的彈跳豬一起跳，樓下應該聽得到。'},
    {need:'', t:'在{w}家從這頭跳到那頭，再跳回來，說這樣比較快。'},
    {need:'', t:'{w}家的地板比較滑，牠多滑了幾次。'},
  ],
  nyanko: [
    {need:'f:tv', t:'佔著{w}家的電視前面不走，說這個位置是牠的。'},
    {need:'f:shelf', t:'跳上{w}家的櫃子最上層，從上面看大家。'},
    {need:'f:table', t:'在{w}家的桌上找點心，找到了，沒有分給別人。'},
    {need:'d:sloth', t:'嫌{w}家的薯餅太慢，還是在牠旁邊睡了一晚。'},
    {need:'', t:'說{w}家普普通通，回來之後一直提。'},
    {need:'', t:'在{w}家吃了點心。牠說沒有，嘴邊有屑屑。'},
  ],
  dino: [
    {need:'f:plant', t:'偷咬了{w}家盆栽的一片葉子，再裝作沒事。'},
    {need:'f:clock', t:'一直去撥{w}家的時鐘，現在那個鐘快了十分鐘。'},
    {need:'f:toybox', t:'躲進{w}家的玩具箱等人來找，等到睡著。'},
    {need:'d:dog', t:'跟{w}家的皮蛋搶拖鞋，贏了一次，輸了三次。'},
    {need:'', t:'在{w}家到處躲，嚇到人了就很得意。'},
    {need:'', t:'把{w}家的東西都摸過一遍，說是參觀。'},
  ],
  snoopy: [
    {need:'f:lamp', t:'借了{w}家的檯燈寫小說，寫了一行，劃掉了。'},
    {need:'f:bed', t:'爬到{w}家的床頭上躺著，說這樣比較有靈感。'},
    {need:'f:frame', t:'看著{w}家牆上的畫，說下一章要寫這個。'},
    {need:'d:snoopy', t:'跟{w}家的史努比交換稿子看，互相說對方寫得不錯。'},
    {need:'', t:'在{w}家寫了小說的新開頭：那是一個在別人家的晚上。'},
    {need:'', t:'把{w}家當成前線基地，巡了一整晚。'},
  ],
  piggy: [
    {need:'f:tv', t:'看著{w}家的電視，每個節目都有意見。'},
    {need:'f:shelf', t:'把{w}家櫃子上的東西重新排過，說這樣才對。'},
    {need:'f:closet', t:'打開{w}家的衣櫃看了一眼，說了一句「嗯」就關上。'},
    {need:'d:piggy', t:'跟{w}家的火腿吵了一晚誰比較聰明，沒有結論。'},
    {need:'', t:'說{w}家的擺設有三個地方可以改，還列了清單。'},
    {need:'', t:'嘴上說{w}家還好而已，回來的路上一直講。'},
  ],
};
