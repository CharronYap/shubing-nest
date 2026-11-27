/* 家具第四批（2026-11-27）：小小遊樂園系列 6 件。畫法跟 js/furn2.js、js/furn3.js 一樣：自己用程式畫的 SVG，
   線條粗細和配色照前三批（粉紅、黃、藍、木頭色），多一個薄荷綠。沒有用外面的圖，也沒有照任何真的樂園或別的作品的造型。
   - 客廳：木馬搖椅（可以坐）、摩天輪燈（會亮）、爆米花機
   - 臥室：小火車櫃（可以坐）、熱氣球吊飾（掛在牆上）、售票亭
   - 湊齊送「旋轉木馬」（客廳，兩隻可以各坐一匹馬）：跟全家福相框牆一樣是家具獎品，gift:1，扭蛋夾不到、小店不賣。
     發獎品用 js/furnfx.js 原本的 setCheck（讀 FURN_SERIES 的 gift），里程碑「湊齊小小遊樂園系列」+10 枚是 js/earn.js 自動加的。
   新風格（紙片）不用另外畫：js/paper.js 會自動轉（拿掉描邊和反光，每一塊下面墊一塊影子）。
   所以每一個部位都有自己的填色，細的線條用 fill="none" 畫，轉過去還看得到。
   獎品只能是家具：壁紙、地板的獎品在新風格要另外在 js/paper.js 的 PWALL、PFLOOR 加一筆，不然會變成素色。
   index.html 的 NEST_JS 要排在 furn3 後面、main 前面（main 一載入就會畫房間）。 */
// 木馬的身體（腳、尾巴、頭、鬃毛、馬鞍）：搖椅木馬和旋轉木馬共用。m 鬃毛和尾巴、sd 馬鞍布的顏色 [填色, 線]
const parkHorse = (m = ['#a8e6cf', '#5cb592'], sd = ['#ff9cc8', '#e0609d']) => `
    <rect x="30" y="44" width="6" height="22" rx="3" fill="#fff" ${st('#cfc3ca',1.6)}/><rect x="40" y="46" width="6" height="21" rx="3" fill="#fff" ${st('#cfc3ca',1.6)}/>
    <rect x="58" y="46" width="6" height="21" rx="3" fill="#fff" ${st('#cfc3ca',1.6)}/><rect x="68" y="44" width="6" height="22" rx="3" fill="#fff" ${st('#cfc3ca',1.6)}/>
    <path d="M77 34c8-3 15 1 17 10-6 0-11-2-15-6z" fill="${m[0]}" ${st(m[1],1.8)}/>
    <path d="M33 8l1-6 5 5z" fill="#fff" ${st('#cfc3ca',1.6)}/>
    <path d="M41 33C39 24 38 16 36 11c-2-4-6-5-10-4-5 1-10 5-12 10-1 4 1 7 5 7h6c0 6 1 11 3 17z" fill="#fff" ${st('#cfc3ca',2.2)}/>
    <ellipse cx="52" cy="40" rx="27" ry="11" fill="#fff" ${st('#cfc3ca',2.2)}/>
    <path d="M36 9c4 1 6 4 6 8 3 3 3 6 1 9 2 3 2 6 0 9l-3-2c0-7-1-15-4-20z" fill="${m[0]}" ${st(m[1],1.8)}/>
    <path d="M42 31h20l3 13c-8 2.400-18 2.400-26 0z" fill="${sd[0]}" ${st(sd[1],2)}/>
    <circle cx="44.500" cy="44.600" r="1.600" fill="#ffd75e"/><circle cx="52" cy="45.400" r="1.600" fill="#ffd75e"/><circle cx="59.500" cy="44.600" r="1.600" fill="#ffd75e"/>
    <path d="M43 31.500c1-5.500 17-5.500 18 0z" fill="#ffd75e" ${st('#d99a00',1.6)}/>
    <circle cx="26" cy="13" r="1.700" fill="#5a4a52"/><circle cx="19" cy="19.500" r="2" fill="#ffc2d9"/><circle cx="15" cy="18.500" r=".9" fill="#cfc3ca"/>
    <path d="M30 38c3 2 6 3 9 3" ${st('#fff',1.6)} fill="none" opacity=".8"/>`;
Object.assign(FURN, {
  rockhorse:{room:'living',name:'木馬搖椅',price:30,ser:'park',vb:[100,78],w:29,seats:[[.53,.4]],svg:()=>`
    <path d="M4 61c16 12 76 12 92 0-2 8-15 14-46 14S6 69 4 61z" fill="#c98f56" ${st('#9a6431',2.2)}/>${parkHorse()}`},
  ferrislamp:{room:'living',name:'摩天輪燈',price:20,ser:'park',vb:[72,96],w:20,glow:[.5,.36],svg:()=>{
    const cab = ['#ff9cc8|#e0609d','#a8e6cf|#5cb592','#ffd66b|#d99a1c','#8fd3ef|#4a9fd0'];
    let cabins = '';
    for (let k = 0; k < 8; k++){ const a = k * Math.PI / 4, x = 36 + 26 * Math.cos(a), y = 34 + 26 * Math.sin(a), [c, d] = cab[k % 4].split('|');
      cabins += `<rect x="${(x - 4.6).toFixed(1)}" y="${(y - 1.4).toFixed(1)}" width="9.2" height="8" rx="3" fill="${c}" ${st(d,1.4)}/>`; }
    return `
    <ellipse cx="36" cy="90" rx="20" ry="4.500" fill="#ffc2d9" ${st('#e0609d',1.8)}/>
    <path d="M34 34L19 89h6L37 40zM38 34l15 55h-6L35 40z" fill="#fff" ${st('#cfc3ca',1.6)}/>
    <circle cx="36" cy="34" r="26" fill="none" ${st('#9d8fe0',3)}/>
    <path d="M36 8v52M10 34h52M17.600 15.600l36.800 36.800M54.400 15.600L17.600 52.400" ${st('#cbbfff',1.6)} fill="none"/>
    <circle cx="36" cy="34" r="19" fill="none" ${st('#cbbfff',1.4)}/>
    ${cabins}
    <circle cx="36" cy="34" r="5.200" fill="#ffd75e" ${st('#d99a00',1.6)}/>`;
  }},
  popcorn:{room:'living',name:'爆米花機',price:25,ser:'park',vb:[62,92],w:18,svg:()=>`
    <rect x="8" y="54" width="46" height="28" rx="5" fill="#ffe3ef" ${st('#ff9cc8',2.2)}/>
    <rect x="15" y="60" width="32" height="14" rx="3" fill="#fff" ${st('#ff9cc8',1.6)}/><circle cx="31" cy="67" r="3" fill="#ffd75e" ${st('#d99a00',1.2)}/>
    <circle cx="17" cy="84" r="5.500" fill="#ff6f8a" ${st('#d9435f',1.8)}/><circle cx="45" cy="84" r="5.500" fill="#ff6f8a" ${st('#d9435f',1.8)}/>
    <circle cx="17" cy="84" r="1.800" fill="#fff"/><circle cx="45" cy="84" r="1.800" fill="#fff"/>
    <rect x="10" y="24" width="42" height="31" rx="4" fill="#eaf8ff" ${st('#8fc6e6',2.2)}/>
    <path d="M13 53c-1-5 2-8 6-7 1-4 6-5 8-2 2-4 8-4 9 0 3-3 8-2 8 2 3-1 6 2 5 7z" fill="#fff8ee" ${st('#e6c98a',1.4)}/>
    <circle cx="20" cy="49" r="1.300" fill="#ffd66b"/><circle cx="29" cy="46" r="1.300" fill="#ffd66b"/><circle cx="38" cy="48" r="1.300" fill="#ffd66b"/><circle cx="45" cy="50" r="1.300" fill="#ffd66b"/>
    <circle cx="24" cy="36" r="2.200" fill="#fff8ee" ${st('#e6c98a',1.2)}/><circle cx="36" cy="32" r="2.200" fill="#fff8ee" ${st('#e6c98a',1.2)}/><circle cx="42" cy="39" r="2" fill="#fff8ee" ${st('#e6c98a',1.2)}/>
    <path d="M15 30c0-3 2-4 4-4" ${st('#fff',2)} fill="none" opacity=".8"/>
    <path d="M6 25C6 15 17 6 31 6s25 9 25 19z" fill="#fff" ${st('#ff6f8a',2.2)}/>
    <path d="M30 8.400c-5 3-8.400 9-9.400 15.600h6.400c0-6.600 1-11.600 3-15.600zM32 8.400c5 3 8.400 9 9.400 15.600H35c0-6.600-1-11.600-3-15.600z" fill="#ff9cc8"/>
    <path d="M5 24h52v2c-2 4-7 4-8.700 0-2 4-7 4-8.700 0-2 4-7 4-8.600 0-2 4-7 4-8.700 0-2 4-7 4-8.700 0-2 4-7 4-8.600 0z" fill="#ffd66b" ${st('#d99a1c',1.6)}/>
    <circle cx="31" cy="5" r="2.800" fill="#ffd75e" ${st('#d99a00',1.4)}/>`},
  traincab:{room:'bed',name:'小火車櫃',price:35,ser:'park',vb:[112,74],w:33,seats:[[.31,.44]],svg:()=>`
    <path d="M10 22c-4-1-6-5-3-8 1-4 6-5 9-2 3-3 9-1 9 3 4 1 4 6 0 7z" fill="#fff" ${st('#cfc3ca',1.6)}/>
    <rect x="13" y="22" width="11" height="12" fill="#ff6f8a" ${st('#d9435f',2)}/><rect x="10" y="20" width="17" height="5" rx="2.500" fill="#ff9cc8" ${st('#d9435f',1.8)}/>
    <rect x="4" y="52" width="104" height="7" rx="3.500" fill="#f2b880" ${st('#b9773f',1.8)}/>
    <rect x="6" y="32" width="54" height="22" rx="8" fill="#a8e6cf" ${st('#5cb592',2.4)}/>
    <rect x="24" y="37" width="28" height="12" rx="3" fill="#e6f8ee" ${st('#5cb592',1.4)}/><rect x="35" y="41.500" width="6" height="3" rx="1.500" fill="#ffd75e"/>
    <circle cx="12" cy="40" r="3.600" fill="#ffd75e" ${st('#d99a00',1.4)}/>
    <path d="M2 50l6-4v10H3z" fill="#ffd66b" ${st('#d99a1c',1.6)}/>
    <rect x="58" y="14" width="46" height="40" rx="6" fill="#a8e6cf" ${st('#5cb592',2.4)}/>
    <rect x="66" y="21" width="30" height="13" rx="4" fill="#cdeeff" ${st('#8fc6e6',1.6)}/><path d="M70 30c1-4 4-6 8-6" ${st('#fff',1.8)} fill="none" opacity=".8"/>
    <rect x="65" y="38" width="32" height="11" rx="3" fill="#e6f8ee" ${st('#5cb592',1.4)}/><rect x="78" y="41.500" width="6" height="3" rx="1.500" fill="#ffd75e"/>
    <rect x="54" y="8" width="54" height="9" rx="4.500" fill="#ffd66b" ${st('#d99a1c',2)}/>
    <circle cx="20" cy="62" r="8.500" fill="#ff9cc8" ${st('#e0609d',2)}/><circle cx="44" cy="62" r="8.500" fill="#ff9cc8" ${st('#e0609d',2)}/>
    <circle cx="72" cy="62" r="8.500" fill="#ff9cc8" ${st('#e0609d',2)}/><circle cx="94" cy="62" r="8.500" fill="#ff9cc8" ${st('#e0609d',2)}/>
    <circle cx="20" cy="62" r="2.800" fill="#ffd75e"/><circle cx="44" cy="62" r="2.800" fill="#ffd75e"/><circle cx="72" cy="62" r="2.800" fill="#ffd75e"/><circle cx="94" cy="62" r="2.800" fill="#ffd75e"/>`},
  balloonwall:{room:'bed',name:'熱氣球吊飾',price:15,ser:'park',vb:[60,86],w:15,wall:1,svg:()=>`
    <path d="M30 0v7" ${st('#b9773f',1.6)} fill="none"/>
    <path d="M23 53l-1 10M37 53l1 10" ${st('#b9773f',1.4)} fill="none"/>
    <path d="M30 7c13 0 23 9 23 21 0 11-10 19-16 26H23C17 47 7 39 7 28 7 16 17 7 30 7z" fill="#ffd66b" ${st('#d99a1c',2.2)}/>
    <path d="M28.600 9.200C19.400 11.400 13.400 19 13.400 28c0 8.400 5 16.400 10.400 23.800h3.200C23 44 20 36 20 28c0-8 2.600-14.600 8.600-18.800z" fill="#a8e6cf"/>
    <path d="M31.400 9.200C40.600 11.400 46.600 19 46.600 28c0 8.400-5 16.400-10.400 23.800H33C37 44 40 36 40 28c0-8-2.600-14.600-8.600-18.800z" fill="#ff9cc8"/>
    <path d="M17 22c2-5 5-8 9-9" ${st('#fff',2)} fill="none" opacity=".8"/>
    <rect x="20" y="62" width="20" height="13" rx="3" fill="#c98f56" ${st('#9a6431',1.8)}/><path d="M22 67h16M22 71h16" ${st('#9a6431',1.2)} fill="none"/>
    <path d="M6 80c-3 0-5-2-4-4 0-2 3-3 5-2 1-2 5-2 6 0 3 0 4 3 2 5z" fill="#fff" ${st('#8fc6e6',1.4)}/>
    <path d="M47 84c-3 0-4-2-3-3 0-2 2-3 4-2 1-2 4-2 5 0 2 0 3 3 1 4z" fill="#fff" ${st('#8fc6e6',1.4)}/>`},
  ticketbooth:{room:'bed',name:'售票亭',price:25,ser:'park',vb:[72,100],w:21,svg:()=>`
    <path d="M36 12V2" ${st('#b9773f',2)} fill="none"/><path d="M36 2l10 3.400L36 9z" fill="#ff6f8a" ${st('#d9435f',1.4)}/>
    <rect x="10" y="40" width="52" height="56" rx="5" fill="#fff" ${st('#ff9cc8',2.2)}/>
    <rect x="17" y="46" width="7" height="48" fill="#ffe3ef"/><rect x="32.500" y="46" width="7" height="48" fill="#ffe3ef"/><rect x="48" y="46" width="7" height="48" fill="#ffe3ef"/>
    <rect x="17" y="48" width="38" height="19" rx="4" fill="#cdeeff" ${st('#8fc6e6',1.8)}/><path d="M21 61c1-5 4-8 9-9" ${st('#fff',1.8)} fill="none" opacity=".8"/>
    <rect x="13" y="66" width="46" height="6" rx="2.500" fill="#f2b880" ${st('#b9773f',1.6)}/>
    <path d="M40 60h11v5.200h-11z" fill="#ffd66b" ${st('#d99a1c',1.2)} transform="rotate(-8 45 62.600)"/>
    <rect x="25" y="77" width="22" height="19" rx="3" fill="#a8e6cf" ${st('#5cb592',1.6)}/><circle cx="42" cy="87" r="1.600" fill="#ffd75e"/>
    <path d="M4 41L36 12l32 29z" fill="#a8e6cf" ${st('#5cb592',2.2)}/>
    <path d="M36 22.600l1.700 4.200 4.400.3-3.400 2.800 1.100 4.300L36 31.800l-3.800 2.400 1.100-4.300-3.400-2.800 4.400-.3z" fill="#ffd75e" ${st('#d99a00',1.4)}/>
    <path d="M3 40h66v3c-2 4-7 4-8.300 0-2 4-7 4-8.200 0-2 4-7 4-8.300 0-2 4-7 4-8.200 0-2 4-7 4-8.300 0-2 4-7 4-8.200 0-2 4-7 4-8.300 0-2 4-7 4-8.200 0z" fill="#ffd66b" ${st('#d99a1c',1.6)}/>`},
  // ---------- 湊齊小小遊樂園系列才送 ----------
  carousel:{room:'living',name:'旋轉木馬',gift:1,vb:[120,124],w:46,seats:[[.25,.6],[.75,.6]],svg:()=>{
    let lights = '';
    [16, 30, 45, 60, 75, 90, 104].forEach(x => { const y = 104 + 9 * Math.sqrt(1 - ((x - 60) / 55) ** 2) + 3.6; lights += `<circle cx="${x}" cy="${y.toFixed(1)}" r="1.900" fill="#ffd75e" ${st('#d99a00',1)}/>`; });
    return `
    <path d="M60 9V1" ${st('#b9773f',2)} fill="none"/><path d="M60 1l10 3.400L60 8z" fill="#ff6f8a" ${st('#d9435f',1.4)}/>
    <path d="M5 104v6c0 6 25 11 55 11s55-5 55-11v-6z" fill="#ff9cc8" ${st('#e0609d',2.2)}/>
    <ellipse cx="60" cy="104" rx="55" ry="9" fill="#ffe3ef" ${st('#ff9cc8',2.2)}/>
    ${lights}
    <rect x="53" y="40" width="14" height="66" rx="4" fill="#fff3c4" ${st('#d99a00',1.8)}/><rect x="56" y="50" width="8" height="40" rx="3" fill="#a8e6cf" ${st('#5cb592',1.4)}/>
    <path d="M30 42v64M90 42v64" ${st('#d99a00',2.6)} fill="none"/>
    <g transform="translate(8 60) scale(.42)">${parkHorse()}</g>
    <g transform="translate(112 60) scale(-.42 .42)">${parkHorse(['#ff9cc8', '#e0609d'], ['#a8e6cf', '#5cb592'])}</g>
    <path d="M60 9C40 14 18 26 6 42h108C102 26 80 14 60 9z" fill="#fff" ${st('#ff6f8a',2.2)}/>
    <path d="M57.600 12.400C50 18 45 28 43.400 40h8C52.600 29 55 19 57.600 12.400zM62.400 12.400C70 18 75 28 76.600 40h-8C67.400 29 65 19 62.400 12.400z" fill="#ff9cc8"/>
    <path d="M49 15C36 20 25 29 17.400 40H26c6.400-10 14-19 23-25zM71 15c13 5 24 14 31.600 25H94c-6.400-10-14-19-23-25z" fill="#ff9cc8"/>
    <path d="M4 41h112v3c-2 4-6.600 4-8.600 0-2 4-6.600 4-8.600 0-2 4-6.600 4-8.600 0-2 4-6.600 4-8.600 0-2 4-6.600 4-8.600 0-2 4-6.600 4-8.600 0-2 4-6.600 4-8.600 0-2 4-6.600 4-8.600 0-2 4-6.600 4-8.600 0-2 4-6.600 4-8.600 0-2 4-6.600 4-8.600 0-2 4-6.600 4-8.600 0-2 4-6.600 4-8.800 0z" fill="#ffd66b" ${st('#d99a1c',1.6)}/>
    <circle cx="60" cy="9" r="3.200" fill="#ffd75e" ${st('#d99a00',1.4)}/>
    <path d="M14 36c6-8 14-14 22-17" ${st('#fff',2)} fill="none" opacity=".8"/>`;
  }},
});
// 系列：6 件湊齊送旋轉木馬（js/furnfx.js 的 setCheck 會發，js/earn.js 會自動多一個湊齊的里程碑）
Object.assign(FURN_SERIES, {
  park:{name:'小小遊樂園系列', ids:['rockhorse','ferrislamp','popcorn','traincab','balloonwall','ticketbooth'], gift:{kind:'furn', id:'carousel', name:'旋轉木馬'}},
});
// 收納架照房間列家具：新家具排在原本的後面
Object.keys(FURN).forEach(id => { const f = FURN[id]; if (!f.season){ const l = ROOM_FURN[f.room] = ROOM_FURN[f.room] || []; if (!l.includes(id)) l.push(id); } });
