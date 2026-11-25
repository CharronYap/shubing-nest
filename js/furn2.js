/* 家具第一批（2026-11-26）：17 件，加兩個湊齊才送的獎品。照 data.js 原本的畫法用程式畫（SVG），線條和配色跟雲朵系列一致。
   全部自己畫，沒有用外面的圖，也沒有用別的遊戲或卡通的造型。
   - 八隻娃娃的專屬家具（8 件）：那隻娃娃放上去會做牠自己的動作（own，動作在 js/furnfx.js 和 css）；別隻放上去是一般的坐姿。湊齊送「全家福相框牆」
   - 甜點系列（6 件）：湊齊送「奶油壁紙」
   - 牆上的東西（3 件）：沒有獎品
   name 名字、price 小店的價錢、own 專屬的娃娃、gift 湊齊才送（扭蛋夾不到、小店不賣）
   拿到的方式：娃娃機的扭蛋、火腿的小店（js/shop.js）。 */
const fstar = (x, y, s, c, d) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-8l2.4 5 5.4.6-4 3.7 1 5.3L0 9.8l-4.8 2.8 1-5.3-4-3.7 5.4-.6z" fill="${c}" ${st(d, 1.4 / s)}/>`;
Object.assign(FURN, {
  // ---------- 八隻娃娃的專屬家具 ----------
  hammock:{room:'living',name:'薯餅的吊床',price:35,own:'sloth',vb:[120,70],w:38,seats:[[.5,.6]],svg:()=>`
    <path d="M12 66V12M108 66V12" ${st('#b9773f',4.4)} fill="none"/><path d="M3 66h18M99 66h18" ${st('#b9773f',4.4)} fill="none"/>
    <path d="M12 18C30 60 90 60 108 18C90 42 30 42 12 18Z" fill="#ffe2ad" ${st('#d99a00',2.2)}/>
    <path d="M27 39c22 10 44 10 66 0M36 47c16 6 32 6 48 0" ${st('#ff9cc8',2)} fill="none"/>
    <circle cx="12" cy="18" r="3.4" fill="#ffd75e" ${st('#d99a00',1.4)}/><circle cx="108" cy="18" r="3.4" fill="#ffd75e" ${st('#d99a00',1.4)}/>`},
  beanbag:{room:'bed',name:'蛋黃哥的懶骨頭',price:25,own:'egg',vb:[90,62],w:27,seats:[[.5,.5]],svg:()=>`
    <path d="M9 52C3 30 22 8 46 8s40 20 35 44c-2 8-68 8-72 0z" fill="#ffe58f" ${st('#d99a00',2.2)}/>
    <ellipse cx="45" cy="35" rx="23" ry="10" fill="#fff3c4"/>
    <path d="M22 20c6-5 15-6 22-5" ${st('#fff',2.6)} fill="none" opacity=".75"/>
    <path d="M12 50c20 5 46 5 66 0" ${st('#e8b52a',1.8)} fill="none"/>`},
  sliprack:{room:'living',name:'皮蛋的拖鞋架',price:15,own:'dog',vb:[70,64],w:19,seats:[[1.25,1]],svg:()=>`
    <rect x="6" y="6" width="58" height="54" rx="7" fill="#f2b880" ${st('#b9773f',2.2)}/>
    <rect x="11" y="11" width="48" height="20" rx="4" fill="#d99a5e"/><rect x="11" y="36" width="48" height="20" rx="4" fill="#d99a5e"/>
    <ellipse cx="25" cy="23" rx="9" ry="5.2" fill="#ff9cc8" ${st('#e0609d',1.6)}/><ellipse cx="45" cy="23" rx="9" ry="5.2" fill="#ff9cc8" ${st('#e0609d',1.6)}/>
    <path d="M19 21c3-3 9-3 12 0M39 21c3-3 9-3 12 0" ${st('#fff',1.6)} fill="none"/>
    <ellipse cx="25" cy="48" rx="9" ry="5.2" fill="#8fd3ef" ${st('#4a9fd0',1.6)}/><ellipse cx="45" cy="48" rx="9" ry="5.2" fill="#ffd75e" ${st('#d99a00',1.6)}/>`},
  trampoline:{room:'bed',name:'彈跳豬的彈簧床',price:30,own:'moodeng',vb:[100,52],w:31,seats:[[.5,.36]],svg:()=>`
    <path d="M14 30v18M86 30v18M34 36v14M66 36v14" ${st('#9d8fe0',3.2)} fill="none"/>
    <ellipse cx="50" cy="24" rx="46" ry="17" fill="#cbbfff" ${st('#9d8fe0',2.4)}/>
    <ellipse cx="50" cy="23" rx="36" ry="11.5" fill="#fff" ${st('#ff9cc8',2)}/>
    ${fstar(50, 23, .9, '#ffd75e', '#d99a00')}`},
  snackcab:{room:'living',name:'貓咪老師的點心櫃',price:25,own:'nyanko',vb:[70,92],w:21,seats:[[-.3,1]],svg:()=>`
    <path d="M20 9c3-8 27-8 30 0z" fill="#ffd75e" ${st('#d99a00',1.8)}/>
    <rect x="6" y="8" width="58" height="80" rx="8" fill="#fff" ${st('#e0a85a',2.2)}/>
    <rect x="12" y="14" width="46" height="30" rx="5" fill="#eaf8ff" ${st('#8fc6e6',1.6)}/>
    <circle cx="23" cy="34" r="6" fill="#e9b872" ${st('#b9823f',1.4)}/><circle cx="21" cy="32" r="1.2" fill="#7a4a22"/><circle cx="25" cy="36" r="1.2" fill="#7a4a22"/>
    <circle cx="38" cy="32" r="6" fill="#ff9cc8" ${st('#e0609d',1.4)}/><rect x="47" y="24" width="8" height="16" rx="2" fill="#ffd75e" ${st('#d99a00',1.2)}/>
    <path d="M14 40h42" ${st('#8fc6e6',1.4)} fill="none"/>
    <rect x="12" y="50" width="46" height="32" rx="5" fill="#ffe3ef" ${st('#ff9cc8',1.6)}/><path d="M35 52v28" ${st('#ff9cc8',1.4)} fill="none"/>
    <circle cx="30" cy="66" r="2.2" fill="#e0609d"/><circle cx="40" cy="66" r="2.2" fill="#e0609d"/>`},
  cavetent:{room:'bed',name:'龍龍的山洞帳篷',price:35,own:'dino',vb:[100,78],w:31,seats:[[.5,.95]],svg:()=>`
    <path d="M28 18l5-11 7 9M46 10l4-9 5 9M63 15l7-9 2 12" fill="#8fd47a" ${st('#78b84a',2)}/>
    <path d="M6 74C6 32 26 10 50 10s44 22 44 64z" fill="#b8e986" ${st('#78b84a',2.4)}/>
    <path d="M31 74c0-23 8-36 19-36s19 13 19 36z" fill="#4f7a3a"/>
    <path d="M31 74c0-23 8-36 19-36" ${st('#78b84a',2)} fill="none"/>
    <circle cx="22" cy="42" r="3.2" fill="#fff" opacity=".6"/><circle cx="80" cy="50" r="2.6" fill="#fff" opacity=".6"/><circle cx="72" cy="30" r="2" fill="#fff" opacity=".6"/>`},
  writedesk:{room:'bed',name:'史努比的寫字桌',price:30,own:'snoopy',vb:[96,68],w:29,seats:[[.26,1]],svg:()=>`
    <rect x="10" y="28" width="6" height="38" rx="2.5" fill="#c98f56" ${st('#9a6431',1.6)}/><rect x="80" y="28" width="6" height="38" rx="2.5" fill="#c98f56" ${st('#9a6431',1.6)}/>
    <rect x="54" y="30" width="28" height="20" rx="3" fill="#e2a868" ${st('#b9773f',1.8)}/><circle cx="68" cy="40" r="2.2" fill="#b9773f"/>
    <rect x="4" y="20" width="88" height="12" rx="5" fill="#f2b880" ${st('#b9773f',2.2)}/>
    <rect x="22" y="8" width="26" height="13" rx="3.5" fill="#8fd3ef" ${st('#4a9fd0',1.8)}/>
    <rect x="27" y="1" width="16" height="10" rx="1.5" fill="#fff" ${st('#cfc3ca',1.4)}/><path d="M30 4.500h10M30 7.500h7" ${st('#cfc3ca',1)} fill="none"/>
    <path d="M65 10V3M69 10V4" ${st('#ff9cc8',2.2)} fill="none"/><rect x="61" y="9" width="12" height="11" rx="2.5" fill="#ffd75e" ${st('#d99a00',1.4)}/>`},
  podium:{room:'living',name:'火腿的小講台',price:20,own:'piggy',vb:[64,60],w:20,seats:[[.44,.34]],svg:()=>`
    <path d="M55 22V7" ${st('#9a8f96',2.4)} fill="none"/><ellipse cx="55" cy="5.500" rx="4" ry="5" fill="#6b5f66"/>
    <rect x="6" y="26" width="52" height="30" rx="6" fill="#ff9e7a" ${st('#d9623a',2.2)}/>
    <rect x="2" y="19" width="60" height="11" rx="5.500" fill="#ffc2a8" ${st('#d9623a',2.2)}/>
    ${fstar(32, 43, .95, '#ffd75e', '#d99a00')}`},
  // ---------- 甜點系列 ----------
  puddingtable:{room:'living',name:'布丁桌',price:25,ser:'sweet',vb:[84,58],w:25,svg:()=>`
    <ellipse cx="42" cy="51" rx="38" ry="5.500" fill="#fff" ${st('#e3cfd8',2)}/>
    <path d="M15 51L24 19h36l9 32z" fill="#ffd66b" ${st('#d99a1c',2.2)}/>
    <path d="M22 23c4-9 36-9 40 0-2 6-6 7-9 5-3 3-8 3-11 0-3 2-8 2-11 0-3 2-7 1-9-5z" fill="#8a5a3a" ${st('#6b3f22',2)}/>
    <path d="M27 30l-4 15" ${st('#fff',2.4)} fill="none" opacity=".6"/>`},
  donutseat:{room:'living',name:'甜甜圈坐墊',price:15,ser:'sweet',vb:[72,38],w:21,seats:[[.5,.4]],svg:()=>`
    <ellipse cx="36" cy="21" rx="32" ry="14.500" fill="#f2b880" ${st('#b9773f',2.2)}/>
    <path d="M6 18c4-13 56-13 60 0-3 4-7 2-10 5-4-3-8 1-12-1-4 3-9-1-13 1-4-2-8 2-12-1-4-2-9 0-13-4z" fill="#ff9cc8" ${st('#e0609d',2)}/>
    <ellipse cx="36" cy="16" rx="9" ry="4" fill="#fff6ea" ${st('#b9773f',1.6)}/>
    <path d="M18 14l3-2M27 9l1 3M46 9l3 2M55 15l2-3M22 20l3 1M50 20l3-1" ${st('#fff',2)} fill="none"/>`},
  macaron:{room:'bed',name:'馬卡龍凳',price:10,ser:'sweet',vb:[56,44],w:16,seats:[[.5,.12]],svg:()=>`
    <ellipse cx="28" cy="32" rx="24" ry="9.500" fill="#b8e986" ${st('#78b84a',2)}/>
    <rect x="6" y="19" width="44" height="9" rx="4.500" fill="#fff8ee" ${st('#e3cfd8',1.6)}/>
    <ellipse cx="28" cy="14" rx="24" ry="10.500" fill="#b8e986" ${st('#78b84a',2)}/>
    <ellipse cx="20" cy="10" rx="8" ry="3" fill="#fff" opacity=".55"/>`},
  cakecab:{room:'living',name:'蛋糕櫃',price:30,ser:'sweet',vb:[84,86],w:25,svg:()=>`
    <rect x="6" y="42" width="72" height="40" rx="8" fill="#ffe3ef" ${st('#ff9cc8',2.2)}/>
    <path d="M18 58h48M18 68h48" ${st('#ffc2d9',2.2)} fill="none"/>
    <path d="M10 42C10 18 28 6 42 6s32 12 32 36z" fill="#eaf8ff" ${st('#8fc6e6',2.2)}/>
    <rect x="25" y="25" width="34" height="15" rx="3.500" fill="#fff8ee" ${st('#e0a85a',1.6)}/>
    <path d="M26 30c5 4 8-2 12 2s8-3 12 1 5-2 8 0" ${st('#ff9cc8',2.2)} fill="none"/>
    <circle cx="42" cy="21" r="4.200" fill="#ff6f8a" ${st('#d9435f',1.4)}/>
    <path d="M18 22c3-6 8-9 12-10" ${st('#fff',2.4)} fill="none" opacity=".8"/>`},
  lollilamp:{room:'bed',name:'棒棒糖燈',price:15,ser:'sweet',vb:[40,96],w:12,glow:[.5,.23],svg:()=>`
    <ellipse cx="20" cy="90" rx="12" ry="4.200" fill="#ffc2d9" ${st('#e0609d',1.8)}/>
    <rect x="18" y="36" width="4.400" height="53" rx="2.200" fill="#fff" ${st('#cfc3ca',1.4)}/>
    <circle cx="20" cy="22" r="17" fill="#ff9cc8" ${st('#e0609d',2.2)}/>
    <path d="M20 22c0-4 5-5 6-1s-5 8-10 5-5-11 2-14 14 3 13 10" fill="none" ${st('#fff',2.4)}/>`},
  wafflerug:{room:'living',name:'鬆餅地毯',price:20,ser:'sweet',vb:[120,40],w:50,floor:1,svg:()=>`
    <ellipse cx="60" cy="20" rx="56" ry="17" fill="#f2c27a" ${st('#c48a3a',2.2)}/>
    <path d="M25 8l-8 23M44 4.500l-6 31M64 3.500v33M84 5l6 30M103 9l8 21M9 14h102M5 24h110" ${st('#d9a04e',2)} fill="none"/>
    <path d="M49 13c7-3 17-3 23 1-2 6-8 4-12 6-4-2-10 0-11-7z" fill="#fff3c4" ${st('#e8c66a',1.6)}/>`},
  // ---------- 牆上的東西 ----------
  bunting:{room:'living',name:'星星掛旗',price:15,ser:'wall',vb:[112,38],w:34,wall:1,svg:()=>`
    <path d="M4 6c30 15 74 15 104 0" ${st('#b9773f',1.8)} fill="none"/>
    ${fstar(18, 20, .95, '#ffd75e', '#d99a00')}${fstar(37, 26, .95, '#ff9cc8', '#e0609d')}${fstar(56, 28, .95, '#8fd3ef', '#4a9fd0')}${fstar(75, 26, .95, '#b8e986', '#78b84a')}${fstar(94, 20, .95, '#cbbfff', '#9d8fe0')}`},
  curtain:{room:'bed',name:'小窗簾',price:15,ser:'wall',vb:[80,60],w:24,wall:1,svg:()=>`
    <path d="M8 9h30c0 22-8 35-22 45-6-10-8-27-8-45z" fill="#ffc2d9" ${st('#e0609d',2)}/>
    <path d="M72 9H42c0 22 8 35 22 45 6-10 8-27 8-45z" fill="#ffc2d9" ${st('#e0609d',2)}/>
    <path d="M17 12c0 14 0 24-2 34M27 12c-1 12-4 22-8 30M63 12c0 14 0 24 2 34M53 12c1 12 4 22 8 30" ${st('#ffe3ef',2)} fill="none"/>
    <rect x="3" y="3" width="74" height="7" rx="3.500" fill="#c98f56" ${st('#9a6431',1.6)}/>
    <circle cx="18" cy="42" r="3.200" fill="#ffd75e" ${st('#d99a00',1.2)}/><circle cx="62" cy="42" r="3.200" fill="#ffd75e" ${st('#d99a00',1.2)}/>`},
  memoboard:{room:'bath',name:'留言板',price:10,ser:'wall',vb:[66,52],w:19,wall:1,svg:()=>`
    <rect x="4" y="4" width="58" height="44" rx="6" fill="#e2b98e" ${st('#a8714f',2.2)}/>
    <rect x="10" y="10" width="46" height="32" rx="3" fill="#f6dcc0"/>
    <rect x="14" y="14" width="16" height="14" rx="2" fill="#fff8c9" ${st('#e6d98a',1.2)} transform="rotate(-5 22 21)"/><path d="M17 19h9M17 23h6" ${st('#e6d98a',1.2)} fill="none" transform="rotate(-5 22 21)"/>
    <rect x="36" y="15" width="15" height="13" rx="2" fill="#cdeeff" ${st('#8fc6e6',1.2)} transform="rotate(4 43 22)"/>
    <path d="M24 39s-5-3-5-6.200c0-1.600 1.200-2.600 2.500-2.600.9 0 1.800.5 2.500 1.400.7-.9 1.600-1.400 2.500-1.400 1.300 0 2.500 1 2.500 2.600C29 36 24 39 24 39z" fill="#ff6fb0"/>
    <path d="M38 34h12M38 38h8" ${st('#c9a27c',1.6)} fill="none"/>
    <circle cx="22" cy="14" r="2" fill="#ff6f8a"/><circle cx="44" cy="15" r="2" fill="#ffd75e"/>`},
  // ---------- 湊齊才送 ----------
  familywall:{room:'living',name:'全家福相框牆',gift:1,vb:[112,62],w:36,wall:1,svg:()=>`
    <rect x="4" y="14" width="30" height="36" rx="4" fill="#fff" ${st('#e0a85a',2.2)}/><rect x="8" y="18" width="22" height="28" rx="2" fill="#ffe9c9"/><circle cx="19" cy="31" r="8" fill="#c98f56"/><circle cx="16" cy="29" r="1.300" fill="#5a3a22"/><circle cx="22" cy="29" r="1.300" fill="#5a3a22"/>
    <rect x="40" y="4" width="36" height="28" rx="4" fill="#fff" ${st('#ff9cc8',2.2)}/><rect x="44" y="8" width="28" height="20" rx="2" fill="#eaf8ff"/><circle cx="52" cy="19" r="6" fill="#ffd75e"/><circle cx="64" cy="19" r="6" fill="#fff" ${st('#cfc3ca',1.2)}/>
    <rect x="82" y="16" width="26" height="34" rx="4" fill="#fff" ${st('#9d8fe0',2.2)}/><rect x="86" y="20" width="18" height="26" rx="2" fill="#f0ecff"/><circle cx="95" cy="33" r="7" fill="#ffc2d9"/><circle cx="92.500" cy="31.500" r="1.200" fill="#8a4a62"/><circle cx="97.500" cy="31.500" r="1.200" fill="#8a4a62"/>
    <rect x="44" y="38" width="28" height="20" rx="4" fill="#fff" ${st('#78b84a',2.2)}/><path d="M58 54s-7-4-7-8.400c0-2.200 1.700-3.600 3.500-3.600 1.300 0 2.500.7 3.500 2 1-1.300 2.200-2 3.500-2 1.800 0 3.500 1.400 3.500 3.600C65 50 58 54 58 54z" fill="#ff6fb0"/>`},
});
// 系列：ids 湊齊就送 gift（沒有 gift 的系列只是分組）
const FURN_SERIES = {
  dollset:{name:'娃娃的專屬家具', ids:['hammock','beanbag','sliprack','trampoline','snackcab','cavetent','writedesk','podium'], gift:{kind:'furn', id:'familywall', name:'全家福相框牆'}},
  sweet:{name:'甜點系列', ids:['puddingtable','donutseat','macaron','cakecab','lollilamp','wafflerug'], gift:{kind:'wall', id:'cream', name:'奶油壁紙'}},
  wallset:{name:'牆上的東西', ids:['bunting','curtain','memoboard']},
};
// 收納架照房間列家具：新家具排在原本的後面
Object.keys(FURN).forEach(id => { const f = FURN[id]; if (!f.season && ROOM_FURN[f.room] && !ROOM_FURN[f.room].includes(id)) ROOM_FURN[f.room].push(id); });
// 新壁紙：奶油（湊齊甜點系列送）。湊齊才送的壁紙、地板，扭蛋夾不到、小店不賣
WALLS.push('cream');
const GIFT_WALL = {cream: '湊齊甜點系列送你'}, GIFT_FLOOR = {cloud: '湊齊雲朵系列送你'};
