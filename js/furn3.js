/* 家具第二批、第三批和新房間的家具（2026-11-26），加新的壁紙和地板。畫法跟 js/furn2.js 一樣：自己用程式畫的 SVG，沒有用外面的圖或別的作品的造型。
   第二批 13 件：森林露營系列 6 件（湊齊送草皮地板）、海邊系列 6 件（湊齊送海浪壁紙）、魚缸（魚會游，貓咪老師會盯著看）
   第三批 12 件：太空系列 6 件（湊齊送星空地板）、廚房 3 件、閣樓 3 件
   壁紙加 5 款（含海浪）、地板加 6 款（含草皮、星空）：做完是壁紙 11 款、地板 10 款。
   新的壁紙地板用 DECO 的資料同時產生 css 和拍照用的畫法（decoPaint），不用兩邊各寫一次。 */
Object.assign(FURN, {
  // ---------- 森林露營系列 ----------
  campfire:{room:'living',name:'營火燈',price:15,ser:'camp',vb:[60,56],w:17,glow:[.5,.45],svg:()=>`
    <path d="M10 48l40-10M10 38l40 10" ${st('#8a5a3a',6)} fill="none"/><path d="M10 48l40-10M10 38l40 10" ${st('#c98f56',3)} fill="none"/>
    <path d="M30 6c8 9 14 15 14 23a14 14 0 0 1-28 0c0-6 4-9 6-14 3 3 4 5 4 8 3-5 5-10 4-17z" fill="#ff9e4a" ${st('#e0672a',2)}/>
    <path d="M30 22c4 5 7 8 7 12a7 7 0 0 1-14 0c0-4 4-6 7-12z" fill="#ffe27a"/>`},
  stump:{room:'living',name:'木樁椅',price:10,ser:'camp',vb:[50,42],w:15,seats:[[.5,.14]],svg:()=>`
    <path d="M6 14v20c0 4 9 6 19 6s19-2 19-6V14z" fill="#c98f56" ${st('#9a6431',2)}/>
    <ellipse cx="25" cy="14" rx="19" ry="8" fill="#f2cf9c" ${st('#9a6431',2)}/><ellipse cx="25" cy="14" rx="11" ry="4.400" fill="none" ${st('#d9a868',1.6)}/><ellipse cx="25" cy="14" rx="4" ry="1.600" fill="#d9a868"/>
    <path d="M14 24v8M34 26v8" ${st('#9a6431',1.6)} fill="none"/>`},
  minitent:{room:'bed',name:'小帳篷',price:30,ser:'camp',vb:[96,72],w:29,seats:[[.5,.96]],svg:()=>`
    <path d="M48 6L6 66h84z" fill="#ffb86b" ${st('#d9843a',2.4)}/><path d="M48 6L30 66h36z" fill="#7a4a2a"/>
    <path d="M48 6L30 66" ${st('#d9843a',2)} fill="none"/><path d="M48 6l18 60" ${st('#d9843a',2)} fill="none"/>
    <path d="M48 6V0" ${st('#9a6431',2.4)} fill="none"/><path d="M48 1l9 3-9 3z" fill="#ff6f8a"/>
    <path d="M4 68h88" ${st('#9a6431',2.4)} fill="none"/>`},
  lightstring:{room:'bed',name:'吊燈串',price:15,ser:'camp',vb:[112,34],w:34,wall:1,svg:()=>`
    <path d="M4 6c30 13 74 13 104 0" ${st('#6b5f66',1.8)} fill="none"/>
    ${[[18,15,'#ffd75e'],[37,20,'#ff9cc8'],[56,22,'#8fd3ef'],[75,20,'#b8e986'],[94,15,'#ffd75e']].map(([x,y,c])=>`<rect x="${x-2.500}" y="${y-2}" width="5" height="4" rx="1" fill="#6b5f66"/><ellipse cx="${x}" cy="${y+7}" rx="5" ry="6.500" fill="${c}" stroke="#fff" stroke-width="1.400"/>`).join('')}`},
  picnicmat:{room:'living',name:'野餐墊',price:20,ser:'camp',vb:[120,44],w:48,floor:1,svg:()=>`
    <path d="M22 4h76l18 36H4z" fill="#fff" ${st('#e0609d',2.2)}/>
    <path d="M41 4L32 40M60 4v36M79 4l9 36M17.500 13h85M11 26h98" ${st('#ff9cc8',5)} fill="none" opacity=".75"/>
    <path d="M22 4h76l18 36H4z" fill="none" ${st('#e0609d',2.2)}/>`},
  crate:{room:'living',name:'木箱',price:15,ser:'camp',vb:[60,50],w:17,seats:[[.5,.08]],svg:()=>`
    <rect x="4" y="6" width="52" height="40" rx="4" fill="#e2b98e" ${st('#a8714f',2.2)}/>
    <path d="M4 19h52M4 33h52" ${st('#a8714f',1.8)} fill="none"/><path d="M14 6v40M46 6v40" ${st('#a8714f',1.8)} fill="none"/>
    <circle cx="9" cy="12.500" r="1.300" fill="#a8714f"/><circle cx="51" cy="12.500" r="1.300" fill="#a8714f"/><circle cx="9" cy="39.500" r="1.300" fill="#a8714f"/><circle cx="51" cy="39.500" r="1.300" fill="#a8714f"/>`},
  // ---------- 海邊系列 ----------
  deckchair:{room:'bath',name:'躺椅',price:25,ser:'beach',vb:[100,62],w:29,seats:[[.42,.55]],svg:()=>`
    <path d="M14 58l20-34M60 58l18-22M30 58h54" ${st('#b9773f',3.200)} fill="none"/>
    <path d="M8 44L30 8l14 6-12 26 50 4-2 10z" fill="#fff" ${st('#4a9fd0',2.2)}/>
    <path d="M14.500 33.500l12 5.500M21 22.500l14 6M27.500 12l14 6M44 41l-1 10M58 42.500l-1 9.500M72 43.500l-1 9.500" ${st('#8fd3ef',4)} fill="none"/>
    <path d="M8 44L30 8l14 6-12 26 50 4-2 10z" fill="none" ${st('#4a9fd0',2.2)}/>`},
  swimring:{room:'bath',name:'游泳圈',price:10,ser:'beach',vb:[64,36],w:19,seats:[[.5,.38]],svg:()=>`
    <ellipse cx="32" cy="19" rx="28" ry="14" fill="#fff" ${st('#e0609d',2.2)}/>
    <path d="M10 11l10 7M54 11l-10 7M10 27l10-6M54 27l-10-6" ${st('#ff6f8a',7)} fill="none"/>
    <ellipse cx="32" cy="19" rx="28" ry="14" fill="none" ${st('#e0609d',2.2)}/>
    <ellipse cx="32" cy="17" rx="11" ry="5" fill="#cdeeff" ${st('#e0609d',1.8)}/>`},
  shelllamp:{room:'bath',name:'貝殼燈',price:15,ser:'beach',vb:[52,50],w:15,glow:[.5,.42],svg:()=>`
    <ellipse cx="26" cy="44" rx="14" ry="4" fill="#ffe3ef" ${st('#e0609d',1.8)}/>
    <path d="M26 42C8 40 4 22 10 12c5-8 27-8 32 0 6 10 2 28-16 30z" fill="#ffd6e6" ${st('#e0609d',2.2)}/>
    <path d="M26 41V9M26 41L13 14M26 41l13-27M26 41L8 24M26 41l18-17" ${st('#ff9cc8',1.8)} fill="none"/>
    <circle cx="26" cy="38" r="3.400" fill="#fff8c9" ${st('#e8c66a',1.4)}/>`},
  sandcastle:{room:'bath',name:'沙堡',price:15,ser:'beach',vb:[64,58],w:18,svg:()=>`
    <path d="M6 54c2-6 50-6 52 0z" fill="#f2d49a" ${st('#c9a25e',2)}/>
    <rect x="12" y="28" width="40" height="24" rx="3" fill="#f6dfb0" ${st('#c9a25e',2)}/>
    <rect x="8" y="20" width="14" height="32" rx="3" fill="#f6dfb0" ${st('#c9a25e',2)}/><rect x="42" y="20" width="14" height="32" rx="3" fill="#f6dfb0" ${st('#c9a25e',2)}/>
    <rect x="24" y="12" width="16" height="22" rx="3" fill="#f6dfb0" ${st('#c9a25e',2)}/>
    <path d="M27 52v-9a5 5 0 0 1 10 0v9z" fill="#b98c4a"/><path d="M32 12V3" ${st('#9a6431',2)} fill="none"/><path d="M32 3l9 3-9 3z" fill="#ff6f8a"/>
    <circle cx="15" cy="30" r="1.800" fill="#c9a25e"/><circle cx="49" cy="30" r="1.800" fill="#c9a25e"/>`},
  parasol:{room:'bath',name:'遮陽傘',price:20,ser:'beach',vb:[84,98],w:24,svg:()=>`
    <path d="M42 22v70" ${st('#b9773f',3)} fill="none"/><ellipse cx="42" cy="93" rx="12" ry="3.500" fill="#e2b98e" ${st('#a8714f',1.8)}/>
    <path d="M4 34C8 14 24 6 42 6s34 8 38 28c-6-5-13-5-19 0-6-5-13-5-19 0-6-5-13-5-19 0-6-5-13-5-19 0z" fill="#fff" ${st('#e0672a',2.2)}/>
    <path d="M42 6c-7 6-10 16-10 28 6-5 13-5 19 0 0-12-3-22-9-28zM42 6C28 8 16 16 4 34c6-5 13-5 19 0 2-12 8-22 19-28zM42 6c14 2 26 10 38 28-6-5-13-5-19 0-2-12-8-22-19-28z" fill="#ffb86b" opacity=".9"/>
    <path d="M4 34C8 14 24 6 42 6s34 8 38 28c-6-5-13-5-19 0-6-5-13-5-19 0-6-5-13-5-19 0-6-5-13-5-19 0z" fill="none" ${st('#e0672a',2.2)}/><circle cx="42" cy="5" r="2.600" fill="#e0672a"/>`},
  boatbed:{room:'bed',name:'小船床',price:40,ser:'beach',vb:[124,74],w:39,seats:[[.4,.56],[.66,.56]],svg:()=>`
    <path d="M62 8v34" ${st('#b9773f',3)} fill="none"/><path d="M64 9l26 28H64z" fill="#fff" ${st('#4a9fd0',2)}/><path d="M60 14L42 37h18z" fill="#cdeeff" ${st('#4a9fd0',2)}/>
    <path d="M6 42h112c-2 16-12 26-28 26H34C18 68 8 58 6 42z" fill="#8fd3ef" ${st('#4a9fd0',2.4)}/>
    <path d="M12 54h100" ${st('#fff',3)} fill="none" opacity=".8"/>
    <rect x="18" y="36" width="88" height="12" rx="6" fill="#fff6ea" ${st('#e0a85a',2)}/><rect x="22" y="33" width="26" height="12" rx="6" fill="#ffe3ef" ${st('#ff9cc8',1.8)}/>`},
  fishtank:{room:'living',name:'魚缸',price:30,vb:[84,66],w:24,svg:()=>`
    <rect x="10" y="56" width="64" height="8" rx="3" fill="#f2b880" ${st('#b9773f',2)}/>
    <rect x="6" y="8" width="72" height="50" rx="10" fill="#cdeeff" ${st('#4a9fd0',2.4)}/>
    <path d="M8 22c10-4 16 4 26 0s16-4 26 0 12 2 16 0v26a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8z" fill="#9ad8f5" opacity=".8"/>
    <path d="M18 56c0-8 3-10 2-16M26 56c1-6-2-9 0-13M64 56c0-7 3-9 2-14" ${st('#78b84a',2.4)} fill="none"/>
    <g class="fz fz1"><path d="M30 30c5-5 13-5 17 0-4 5-12 5-17 0z" fill="#ff9e4a" stroke="#e0672a" stroke-width="1.400"/><path d="M30 30l-6-4v8z" fill="#ff9e4a" stroke="#e0672a" stroke-width="1.400" stroke-linejoin="round"/><circle cx="43" cy="29" r="1" fill="#3a2a35"/></g>
    <g class="fz fz2"><path d="M60 43c-4-4-10-4-13 0 3 4 9 4 13 0z" fill="#ff9cc8" stroke="#e0609d" stroke-width="1.300"/><path d="M60 43l5-3v6z" fill="#ff9cc8" stroke="#e0609d" stroke-width="1.300" stroke-linejoin="round"/><circle cx="50" cy="42.200" r=".9" fill="#3a2a35"/></g>
    <g class="fzb" fill="none" stroke="#fff" stroke-width="1.300"><circle cx="66" cy="34" r="2"/><circle cx="63" cy="26" r="1.400"/><circle cx="67" cy="19" r="1"/></g>
    <path d="M14 16c3-3 8-4 12-4" ${st('#fff',2.4)} fill="none" opacity=".8"/>`},
  // ---------- 太空系列 ----------
  rocketbed:{room:'bed',name:'火箭床',price:40,ser:'space',vb:[132,72],w:40,seats:[[.5,.5]],svg:()=>`
    <path d="M20 58v10M100 58v10" ${st('#9d8fe0',4)} fill="none"/>
    <path d="M14 20l-10-8v48l10-8z" fill="#ff6f8a" ${st('#d9435f',2)}/>
    <path d="M14 18h74c20 0 34 10 40 18-6 8-20 18-40 18H14z" fill="#fff" ${st('#9d8fe0',2.4)}/>
    <path d="M94 18.500c16 2 28 10 33 17.500-5 7.500-17 15.500-33 17.500z" fill="#ff6f8a" ${st('#d9435f',2)}/>
    <circle cx="76" cy="36" r="9" fill="#cdeeff" ${st('#4a9fd0',2.2)}/><path d="M71 33c2-3 5-4 8-3" ${st('#fff',2)} fill="none"/>
    <rect x="22" y="26" width="38" height="20" rx="8" fill="#ffe3ef" ${st('#ff9cc8',1.8)}/>`},
  planetlamp:{room:'bed',name:'星球燈',price:15,ser:'space',vb:[54,92],w:15,glow:[.5,.26],svg:()=>`
    <ellipse cx="27" cy="86" rx="13" ry="4" fill="#cbbfff" ${st('#9d8fe0',1.8)}/><rect x="25" y="44" width="4" height="42" rx="2" fill="#fff" ${st('#cfc3ca',1.4)}/>
    <circle cx="27" cy="24" r="16" fill="#ffd66b" ${st('#d99a1c',2.2)}/>
    <path d="M13 19c8 3 20 3 28 0M12 28c9 3 21 3 30 0" ${st('#f0b040',2)} fill="none"/>
    <ellipse cx="27" cy="25" rx="25" ry="6.500" fill="none" ${st('#ff9cc8',2.6)} transform="rotate(-16 27 25)"/>`},
  moonchair:{room:'living',name:'月亮椅',price:25,ser:'space',vb:[66,72],w:20,seats:[[.56,.62]],svg:()=>`
    <ellipse cx="34" cy="67" rx="20" ry="4" fill="#e6defc" ${st('#9d8fe0',1.8)}/>
    <path d="M44 6C22 8 8 22 8 40s14 26 34 26c8 0 14-2 18-6-14 0-26-8-26-22 0-14 4-24 10-32z" fill="#ffe58f" ${st('#d99a00',2.4)}/>
    <ellipse cx="42" cy="50" rx="14" ry="6" fill="#fff3c4" ${st('#d99a00',1.8)}/>
    <circle cx="20" cy="30" r="2.400" fill="#f0c94a"/><circle cx="24" cy="46" r="1.800" fill="#f0c94a"/>`},
  telescope:{room:'living',name:'望遠鏡',price:20,ser:'space',vb:[72,82],w:20,svg:()=>`
    <path d="M36 44L18 78M36 44l18 34M36 44v36" ${st('#b9773f',3)} fill="none"/>
    <g transform="rotate(-28 36 34)"><rect x="6" y="26" width="46" height="16" rx="6" fill="#cbbfff" ${st('#9d8fe0',2.2)}/><rect x="48" y="23" width="16" height="22" rx="5" fill="#fff" ${st('#9d8fe0',2.2)}/><rect x="0" y="29" width="9" height="10" rx="3" fill="#6b5f66"/></g>
    <circle cx="36" cy="44" r="4.400" fill="#ffd75e" ${st('#d99a00',1.6)}/>`},
  meteorstool:{room:'bed',name:'隕石凳',price:10,ser:'space',vb:[54,42],w:15,seats:[[.5,.16]],svg:()=>`
    <path d="M8 26c-4-10 6-20 20-20s24 8 20 20c-3 10-12 12-20 12S11 36 8 26z" fill="#b9b3c9" ${st('#7d7494',2.2)}/>
    <ellipse cx="20" cy="18" rx="5" ry="3.400" fill="#9d96b3"/><ellipse cx="35" cy="26" rx="4" ry="2.800" fill="#9d96b3"/><ellipse cx="34" cy="13" rx="2.600" ry="1.800" fill="#9d96b3"/>
    <path d="M14 12c4-3 9-4 13-4" ${st('#fff',2)} fill="none" opacity=".6"/>`},
  capsulecab:{room:'bed',name:'太空艙櫃',price:25,ser:'space',vb:[64,92],w:19,svg:()=>`
    <path d="M14 84v6M50 84v6" ${st('#9d8fe0',3.400)} fill="none"/>
    <rect x="8" y="6" width="48" height="80" rx="24" fill="#fff" ${st('#9d8fe0',2.4)}/>
    <circle cx="32" cy="30" r="13" fill="#cdeeff" ${st('#4a9fd0',2.2)}/><path d="M25 26c2-4 6-6 10-5" ${st('#fff',2.2)} fill="none"/>
    <rect x="16" y="52" width="32" height="24" rx="6" fill="#f0ecff" ${st('#9d8fe0',1.8)}/><circle cx="32" cy="64" r="2.400" fill="#9d8fe0"/>
    <circle cx="20" cy="46" r="1.800" fill="#ff6f8a"/><circle cx="27" cy="46" r="1.800" fill="#ffd75e"/>`},
  // ---------- 廚房 ----------
  fridge:{room:'kitchen',name:'冰箱',price:30,vb:[62,104],w:20,svg:()=>`
    <rect x="6" y="4" width="50" height="96" rx="9" fill="#fff" ${st('#8fc6e6',2.4)}/>
    <path d="M6 38h50" ${st('#8fc6e6',2.2)} fill="none"/><rect x="45" y="14" width="5" height="16" rx="2.500" fill="#8fc6e6"/><rect x="45" y="46" width="5" height="26" rx="2.500" fill="#8fc6e6"/>
    <rect x="14" y="12" width="14" height="11" rx="2" fill="#fff8c9" ${st('#e6d98a',1.2)} transform="rotate(-6 21 17)"/>
    <path d="M22 62s-6-3.600-6-7.400c0-2 1.400-3.200 3-3.200 1.100 0 2.200.6 3 1.700.8-1.100 1.900-1.700 3-1.700 1.600 0 3 1.200 3 3.200C28 58.400 22 62 22 62z" fill="#ff6fb0"/>`},
  stove:{room:'kitchen',name:'爐台',price:25,vb:[86,78],w:26,svg:()=>`
    <rect x="6" y="26" width="74" height="48" rx="7" fill="#ffe3ef" ${st('#ff9cc8',2.4)}/>
    <rect x="16" y="40" width="54" height="26" rx="5" fill="#fff" ${st('#ff9cc8',1.8)}/><rect x="22" y="46" width="42" height="14" rx="3" fill="#5a4a52"/><path d="M28 38h30" ${st('#e0609d',2.4)} fill="none"/>
    <rect x="4" y="20" width="78" height="10" rx="5" fill="#fff" ${st('#ff9cc8',2.2)}/>
    <circle cx="16" cy="33.500" r="2" fill="#e0609d"/><circle cx="24" cy="33.500" r="2" fill="#e0609d"/>
    <path d="M40 20v-6h28v6z" fill="#8fd3ef" ${st('#4a9fd0',2)}/><path d="M68 16h8" ${st('#4a9fd0',2.6)} fill="none"/><path d="M48 10c-2-3 2-4 0-7M58 10c-2-3 2-4 0-7" ${st('#cfc3ca',1.8)} fill="none"/>`},
  dinetable:{room:'kitchen',name:'餐桌',price:30,vb:[112,62],w:34,svg:()=>`
    <rect x="18" y="26" width="7" height="34" rx="3" fill="#c98f56" ${st('#9a6431',1.6)}/><rect x="87" y="26" width="7" height="34" rx="3" fill="#c98f56" ${st('#9a6431',1.6)}/>
    <ellipse cx="56" cy="26" rx="52" ry="14" fill="#fff" ${st('#e0a85a',2.4)}/><ellipse cx="56" cy="24" rx="42" ry="9" fill="#fff3d6"/>
    <ellipse cx="34" cy="23" rx="10" ry="4" fill="#fff" ${st('#cfc3ca',1.6)}/><circle cx="34" cy="21.500" r="4" fill="#ffd75e" ${st('#d99a00',1.2)}/>
    <ellipse cx="74" cy="24" rx="10" ry="4" fill="#fff" ${st('#cfc3ca',1.6)}/><path d="M68 22c3-5 9-5 12 0z" fill="#ff9cc8" ${st('#e0609d',1.2)}/>
    <rect x="52" y="10" width="8" height="12" rx="2.500" fill="#8fd3ef" ${st('#4a9fd0',1.4)}/>`},
  // ---------- 閣樓 ----------
  trunk:{room:'attic',name:'舊皮箱',price:20,vb:[82,54],w:24,seats:[[.5,.1]],svg:()=>`
    <rect x="6" y="10" width="70" height="40" rx="7" fill="#c98f56" ${st('#8a5a3a',2.4)}/>
    <path d="M6 24h70" ${st('#8a5a3a',2.2)} fill="none"/><rect x="20" y="8" width="8" height="44" rx="2" fill="#e2b98e" ${st('#8a5a3a',1.6)}/><rect x="54" y="8" width="8" height="44" rx="2" fill="#e2b98e" ${st('#8a5a3a',1.6)}/>
    <rect x="36" y="20" width="10" height="9" rx="2" fill="#ffd75e" ${st('#d99a00',1.6)}/><path d="M33 10c0-6 16-6 16 0" ${st('#8a5a3a',2.4)} fill="none"/>`},
  floorpad:{room:'attic',name:'懶人墊',price:15,vb:[84,38],w:25,seats:[[.5,.42]],svg:()=>`
    <ellipse cx="42" cy="22" rx="38" ry="14" fill="#cbbfff" ${st('#9d8fe0',2.2)}/>
    <ellipse cx="42" cy="18" rx="30" ry="9" fill="#e6defc"/>
    <circle cx="42" cy="18" r="2.600" fill="#9d8fe0"/><path d="M42 18L20 14M42 18l22-4M42 18l-14 8M42 18l14 8" ${st('#b9adf0',1.4)} fill="none"/>`},
  starlight:{room:'attic',name:'星星夜燈',price:15,vb:[46,62],w:13,glow:[.5,.4],svg:()=>`
    <ellipse cx="23" cy="56" rx="12" ry="4" fill="#ffe9a8" ${st('#d99a00',1.8)}/><rect x="21" y="40" width="4" height="16" rx="2" fill="#fff" ${st('#cfc3ca',1.4)}/>
    ${fstar(23, 23, 2.3, '#ffe27a', '#d99a00')}<circle cx="19" cy="21" r="1.400" fill="#8a5a22"/><circle cx="27" cy="21" r="1.400" fill="#8a5a22"/><path d="M20 26c2 2 4 2 6 0" ${st('#8a5a22',1.4)} fill="none"/>`},
});
Object.assign(FURN_SERIES, {
  camp:{name:'森林露營系列', ids:['campfire','stump','minitent','lightstring','picnicmat','crate'], gift:{kind:'floor', id:'grass', name:'草皮地板'}},
  beach:{name:'海邊系列', ids:['deckchair','swimring','shelllamp','sandcastle','parasol','boatbed'], gift:{kind:'wall', id:'wave', name:'海浪壁紙'}},
  space:{name:'太空系列', ids:['rocketbed','planetlamp','moonchair','telescope','meteorstool','capsulecab'], gift:{kind:'floor', id:'space', name:'星空地板'}},
});
Object.keys(FURN).forEach(id => { const f = FURN[id]; if (!f.season){ const l = ROOM_FURN[f.room] = ROOM_FURN[f.room] || []; if (!l.includes(id)) l.push(id); } });

/* 新的壁紙和地板。type：check 格子 {a,b,n}、stripe 直條 {a,b,n}、dots 點點 {bg,bg2,dot,n,r}、scallop 一排一排的圓弧 {bg,bg2,c,w,h} */
const DECO = {
  wall: {
    wave:{type:'scallop', bg:'#bfe8ff', bg2:'#e6f6ff', c:'#8fd3ef', w:30, h:15},
    peach:{type:'check', a:'#ffe0d2', b:'#fff3ec', n:26},
    lav:{type:'stripe', a:'#ece6ff', b:'#f7f4ff', n:13},
    mintdot:{type:'dots', bg:'#e6f8ee', bg2:'#f3fcf7', dot:'#a9e3c4', n:24, r:3.400},
    forest:{type:'scallop', bg:'#e3f3d6', bg2:'#f2faea', c:'#b8dd9a', w:26, h:20},
  },
  floor: {
    grass:{type:'dots', bg:'#b9e39a', bg2:'#a6dc86', dot:'#8fcf6e', n:18, r:2.600},
    space:{type:'dots', bg:'#3b3f8f', bg2:'#5a5fb0', dot:'#fff6c4', n:30, r:1.600},
    honey:{type:'check', a:'#ffe7a8', b:'#fff6da', n:28},
    pinkwood:{type:'stripe', a:'#ffd9e4', b:'#ffc9d8', n:22},
    stone:{type:'check', a:'#e3e0ea', b:'#f2f0f6', n:32},
    sand:{type:'dots', bg:'#f6e3b8', bg2:'#f2d9a4', dot:'#e6c98a', n:16, r:1.600},
  },
};
Object.assign(GIFT_WALL, {wave: '湊齊海邊系列送你'});
Object.assign(GIFT_FLOOR, {grass: '湊齊森林露營系列送你', space: '湊齊太空系列送你'});
Object.keys(DECO.wall).forEach(id => { if (!WALLS.includes(id)) WALLS.push(id); });
Object.keys(DECO.floor).forEach(id => { if (!FLOORS.includes(id)) FLOORS.push(id); });
const decoDef = (kind, id) => (DECO[kind] || {})[id] || null;
function decoCss(d){
  if (d.type === 'check') return `repeating-conic-gradient(${d.a} 0 25%,${d.b} 0 50%) 0 0/${d.n}px ${d.n}px`;
  if (d.type === 'stripe') return `repeating-linear-gradient(90deg,${d.a} 0 ${d.n}px,${d.b} ${d.n}px ${d.n * 2}px)`;
  if (d.type === 'dots') return `radial-gradient(circle at ${d.n / 2}px ${d.n / 2}px,${d.dot} 0 ${d.r}px,transparent ${d.r + .8}px) 0 0/${d.n}px ${d.n}px,linear-gradient(${d.bg},${d.bg2 || d.bg})`;
  return `radial-gradient(circle at 50% 100%,${d.c} 0 58%,transparent 60%) 0 0/${d.w}px ${d.h}px,linear-gradient(${d.bg},${d.bg2 || d.bg})`;
}
{
  const css = [...Object.entries(DECO.wall).map(([id, d]) => `.w-${id}{background:${decoCss(d)}}`), ...Object.entries(DECO.floor).map(([id, d]) => `.f-${id}{background:${decoCss(d)}}`)].join('\n');
  const el = document.createElement('style'); el.textContent = css; document.head.appendChild(el);
}
// 拍照用：把同一份資料畫在 canvas 上（js/photo.js 的 paintWall、paintFloor 不認得的款式會來問）
function decoPaint(ctx, s, y0, W, H, d){
  const fill = f => { ctx.fillStyle = f; ctx.fillRect(0, y0, W, H); };
  if (d.type === 'check') fill(tile(ctx, s, d.n, d.n, t => { const h = d.n / 2; t.fillStyle = d.b; t.fillRect(0, 0, d.n, d.n); t.fillStyle = d.a; t.fillRect(0, 0, h, h); t.fillRect(h, h, h, h); }, 0, y0));
  else if (d.type === 'stripe') fill(tile(ctx, s, d.n * 2, 4, t => { t.fillStyle = d.a; t.fillRect(0, 0, d.n, 4); t.fillStyle = d.b; t.fillRect(d.n, 0, d.n, 4); }, 0, y0));
  else {
    fill(grad(ctx, y0, y0 + H, d.bg, d.bg2 || d.bg));
    if (d.type === 'dots') fill(tile(ctx, s, d.n, d.n, t => dot(t, d.n / 2, d.n / 2, d.r, d.dot), 0, y0));
    else fill(tile(ctx, s, d.w, d.h, t => { t.fillStyle = d.c; t.beginPath(); t.arc(d.w / 2, d.h, d.w * .3, Math.PI, 0); t.fill(); }, 0, y0));
  }
}
