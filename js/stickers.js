/* 貼圖（第一步：訪客簿先用；之後朋友聊天、娃娃頭上冒的貼圖也用這一套）
   做法：正方形色紙底（底色照那一張的心情換）＋色紙剪的小東西（SVG）＋遊戲現有的娃娃去背照片（可以歪、躺、跳）＋一張手寫字的小字條。
   顏色只用遊戲的色票（css/paper.css 的 --p-*）和它們淡一點的版本；不畫品牌、商標、卡通人物。
   ★ 代號（id）一旦上線就不能改：訪客簿、聊天存的都是代號，改了舊的那則會變成不認得的愛心。要換畫法只改內容，不改代號。
   舊的八張娃娃臉（d-<娃娃>）對到那隻娃娃的第一張，見 STK_OLD。
   尺寸：貼圖裡的字、圓角、陰影都用 cqw（貼圖寬度的百分比），放多大都一樣比例。外面只要給 .stk 一個寬度。 */
const STK_LEAF = (x, y, r, s, f = '#4c9a78', flip) => `<g transform="translate(${x} ${y})${flip ? ' scale(-1 1)' : ''} rotate(${r}) scale(${s})"><path d="M0 0c7 1 11 6 10 13-7 0-11-5-10-13z" fill="${f}"/><path d="M1 1c3 4 6 7 9 11" fill="none" stroke="#3a7a5e" stroke-width="1"/></g>`;
const STK_SP = (x, y, r, f, o = 1) => { const k = Math.round(r * 28) / 100; return `<path d="M${x} ${y - r}L${x + k} ${y - k}L${x + r} ${y}L${x + k} ${y + k}L${x} ${y + r}L${x - k} ${y + k}L${x - r} ${y}L${x - k} ${y - k}z" fill="${f}"${o < 1 ? ` opacity="${o}"` : ''}/>`; };
const STK_HT = (x, y, s, f) => `<path transform="translate(${Math.round((x - 12 * s) * 10) / 10} ${Math.round((y - 13 * s) * 10) / 10}) scale(${s})" d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.6 5 7 5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 16.4 12 21 12 21z" fill="${f}"/>`;
const STK_ZZ = '<g fill="none" stroke="#fbf6ea" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M70 13h8l-8 9h8"/><path d="M84 25h5.5l-5.5 6h5.5" stroke-width="2"/></g>';
const STK_COIN = y => `<rect x="72" y="${y}" width="20" height="4.6" fill="#e0ad3e"/><ellipse cx="82" cy="${y + 4.6}" rx="10" ry="3.4" fill="#e0ad3e"/><ellipse cx="82" cy="${y}" rx="10" ry="3.4" fill="#ffd36e"/>`;

/* 每一張：id 代號、d 娃娃（沒有就空字串）、t 字條上的字、bg 底色、r 整張歪幾度、a 小東西（畫在娃娃下面）、
   up 畫在娃娃上面的小東西、o 其他：dr 娃娃轉幾度、dt/dl 娃娃中心的位置、dw 娃娃寬度、sx 娃娃左右翻（-1）、
   lbg/lc 字條底色和字色、lr 字條歪幾度、fs 字的大小（cqw，預設 13） */
const STK = [
  // 薯餅
  {id: 's-sloth-slow', d: 'sloth', t: '慢慢來', bg: '#f6ecd6', r: -1.5,
    a: '<circle cx="13" cy="50" r="2.6" fill="#b9bde0"/><circle cx="21" cy="47" r="3.2" fill="#b9bde0"/><circle cx="30" cy="45" r="3.8" fill="#b9bde0"/>' + STK_LEAF(79, 16, 0, 1) + '<path d="M70 30c5 0 8 3 8 8-5 0-8-3-8-8z" fill="#7dbb96"/>',
    o: {dr: -4, lbg: '#3f9aa5', lc: '#fbf6ea'}},
  {id: 's-sloth-hmm', d: 'sloth', t: '好……', bg: '#e6e3f5', r: 1.5,
    a: '<path d="M69 9h20a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H78l-7 6 1.5-6H69a5 5 0 0 1-5-5v-8a5 5 0 0 1 5-5z" fill="#fbf6ea"/><g fill="#3f9aa5"><circle cx="72.5" cy="18.5" r="2.2"/><circle cx="79" cy="18.5" r="2.2"/><circle cx="85.5" cy="18.5" r="2.2"/></g><circle cx="16" cy="30" r="2.4" fill="#b9bde0"/><circle cx="22" cy="24" r="1.7" fill="#b9bde0"/>',
    o: {dr: 10, dl: '46%', lr: -1}},
  {id: 's-sloth-night', d: 'sloth', t: '晚安', bg: '#39406a', r: 1.5,
    a: '<path d="M77 12a13 13 0 1 0 11 19A11 11 0 0 1 77 12z" fill="#ffd36e"/>' + STK_SP(17, 22.5, 5.5, '#fbf6ea') + STK_SP(33, 12.3, 3.3, '#fbf6ea', .8) + STK_SP(88, 49.3, 3.3, '#fbf6ea', .8) + '<g fill="none" stroke="#fbf6ea" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M52 13h8l-8 9h8"/><path d="M41 25h5.5l-5.5 6h5.5" stroke-width="2"/></g>',
    o: {dr: 6, dt: '47%', lr: 2}},
  // 蛋黃哥
  {id: 's-egg-lazy', d: 'egg', t: '不想動', bg: '#fdf0c8', r: -1,
    a: '<ellipse cx="50" cy="63" rx="33" ry="5" fill="#e8d59a"/><path d="M76 20q4 6 0 9a4.5 4.5 0 0 1 0-9z" fill="#9fd0e6"/><path d="M14 26q4-4 8 0t8 0" fill="none" stroke="#d9b65a" stroke-width="2.4" stroke-linecap="round"/><path d="M12 35q3-3 6 0t6 0" fill="none" stroke="#d9b65a" stroke-width="2" stroke-linecap="round"/>',
    o: {dr: 78, dt: '45%', lr: -1}},
  {id: 's-egg-later', d: 'egg', t: '明天再說', bg: '#d9ecf3', r: -1.5,
    a: '<g transform="rotate(8 81 21)"><rect x="70" y="10" width="22" height="22" rx="3" fill="#fbf6ea"/><path d="M70 13a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v4H70z" fill="#ff8a66"/><rect x="74" y="7" width="2.4" height="6" rx="1.2" fill="#8a5a45"/><rect x="85.6" y="7" width="2.4" height="6" rx="1.2" fill="#8a5a45"/><g fill="#c9cfe6"><rect x="73" y="20" width="4" height="3.4" rx=".8"/><rect x="79" y="20" width="4" height="3.4" rx=".8"/><rect x="85" y="20" width="4" height="3.4" rx=".8"/><rect x="73" y="25.5" width="4" height="3.4" rx=".8"/></g><rect x="79" y="25.5" width="4" height="3.4" rx=".8" fill="#ff8a66"/><circle cx="81" cy="27.2" r="4.2" fill="none" stroke="#3f9aa5" stroke-width="1.4"/></g><path d="M18 22q4 6 0 9a4.5 4.5 0 0 1 0-9z" fill="#9fd0e6"/>',
    o: {dr: -12, dl: '45%', lbg: '#3f9aa5', lc: '#fbf6ea', lr: 2, fs: 11.5}},
  {id: 's-egg-tired', d: 'egg', t: '好累', bg: '#e4e2ec', r: 1,
    a: '<ellipse cx="50" cy="63" rx="33" ry="5" fill="#c9cfe6"/><g fill="none" stroke="#23264a" stroke-opacity=".38" stroke-width="2.2" stroke-linecap="round"><path d="M15 40q-3-4 0-8t0-8"/><path d="M23 35q-3-4 0-8t0-8"/><path d="M31 40q-3-4 0-8t0-8"/></g>',
    o: {dr: -82, dt: '46%', lr: -2}},
  // 皮蛋
  {id: 's-dog-hey', d: 'dog', t: '汪！在嗎', bg: '#dcefe6', r: 1,
    a: '<g stroke="#ff8a66" stroke-width="3.4" stroke-linecap="round"><path d="M78 12l5-7"/><path d="M85 20l8-3"/><path d="M86 30l8 2"/><path d="M22 12l-5-7"/><path d="M15 20l-8-3"/><path d="M14 30l-8 2"/></g>',
    o: {dr: -5, dw: '62%', lbg: '#ff8a66', lc: '#fbf6ea', lr: -3}},
  {id: 's-dog-play', d: 'dog', t: '陪我玩', bg: '#fdf0c8', r: 2,
    a: '<path d="M68 30q10-18 20 6" fill="none" stroke="#e0ad3e" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 5"/><circle cx="84" cy="55" r="9" fill="#ff8a66"/><path d="M75.5 51.5q8.5 3.5 17-1" fill="none" stroke="#fbf6ea" stroke-width="2"/><path d="M77 60q7 2.5 13.5-2" fill="none" stroke="#fbf6ea" stroke-width="1.6"/>' + STK_SP(15, 22, 4.5, '#ffd36e'),
    o: {dr: 8, dl: '44%', dw: '60%', lbg: '#ff8a66', lc: '#fbf6ea', lr: 2}},
  {id: 's-dog-miss', d: 'dog', t: '想你', bg: '#fde3dc', r: -2,
    a: STK_HT(80, 19, 1.15, '#ff8a66') + STK_HT(19, 19, .72, '#ffb199') + STK_HT(88, 47, .52, '#ffb199'),
    o: {dr: 5, dw: '60%', lr: 2}},
  // 彈跳豬
  {id: 's-moodeng-fun', d: 'moodeng', t: '好玩！！', bg: '#d9ecf3', r: 2,
    a: '<path d="M24 62q26 10 52 0" fill="none" stroke="#3f9aa5" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="1 6"/><path d="M30 68q20 7 40 0" fill="none" stroke="#3f9aa5" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 6" opacity=".6"/>' + STK_SP(15, 28.6, 8.6, '#ffd36e') + STK_SP(86, 18.6, 6.6, '#ffd36e') + STK_SP(90, 44.6, 4.6, '#ff8a66'),
    o: {dr: -10, dt: '36%', dw: '64%', lbg: '#ffd36e', lr: -2}},
  {id: 's-moodeng-hmph', d: 'moodeng', t: '哼！！', bg: '#fbd9d0', r: -2,
    a: '<g fill="#fbf6ea"><circle cx="74" cy="16" r="6"/><circle cx="82" cy="11.5" r="7"/><circle cx="89.5" cy="17" r="5.5"/><circle cx="81" cy="20" r="6"/><circle cx="67.5" cy="26" r="3"/><circle cx="63" cy="31" r="2"/></g><g stroke="#d96f50" stroke-width="2.8" stroke-linecap="round" fill="none"><path d="M13 17q4 1 5 5"/><path d="M27 17q-4 1-5 5"/><path d="M13 31q4-1 5-5"/><path d="M27 31q-4-1-5-5"/></g>',
    o: {dr: 4, dt: '40%', lbg: '#d96f50', lc: '#fbf6ea', lr: 2}},
  {id: 's-moodeng-here', d: 'moodeng', t: '我來了！！', bg: '#fdf0c8', r: 1.5,
    a: '<g stroke="#3f9aa5" stroke-width="3" stroke-linecap="round"><path d="M5 30l18-3"/><path d="M3 43l21-3"/><path d="M7 56l16-2.5"/></g><g fill="#e8d59a"><circle cx="25" cy="67" r="3.6"/><circle cx="17" cy="65" r="2.5"/><circle cx="11" cy="68" r="1.6"/></g>' + STK_SP(88, 16, 4.5, '#ff8a66'),
    o: {dr: 16, dl: '57%', dt: '43%', dw: '60%', lbg: '#3f9aa5', lc: '#fbf6ea', lr: -3, fs: 11.2}},
  // 貓咪老師
  {id: 's-nyanko-snack', d: 'nyanko', t: '有點心嗎', bg: '#f3e7d3', r: -2,
    a: '<ellipse cx="80" cy="33" rx="13" ry="3.4" fill="#c9cfe6"/><path d="M69 32a11 10 0 0 1 22 0z" fill="#fffdf6"/><path d="M76 26q2-3 5 0" fill="none" stroke="#e6dcc6" stroke-width="1.4" stroke-linecap="round"/><g fill="none" stroke="#b9a98c" stroke-width="2" stroke-linecap="round"><path d="M75 17q-3-3 0-6t0-6"/><path d="M83 16q-3-3 0-6t0-6"/></g>',
    o: {dr: -3, dl: '44%', lr: 1}},
  {id: 's-nyanko-wait', d: 'nyanko', t: '才沒有在等你', bg: '#e6e3f5', r: 1,
    a: '<g transform="rotate(-8 20 22)"><circle cx="12" cy="11" r="3.2" fill="#3f9aa5"/><circle cx="28" cy="11" r="3.2" fill="#3f9aa5"/><circle cx="20" cy="22" r="11" fill="#fbf6ea" stroke="#3f9aa5" stroke-width="2.6"/><path d="M20 22v-6.5M20 22l4.5 2.5" stroke="#8a5a45" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="22" r="1.4" fill="#8a5a45"/></g><g stroke="#e0ad3e" stroke-width="2" stroke-linecap="round"><path d="M35 12l3.5-2.5"/><path d="M36 20h4.5"/></g>',
    o: {dr: 4, dl: '55%', sx: -1, lr: 2, fs: 10.2}},
  {id: 's-nyanko-whatever', d: 'nyanko', t: '隨便你', bg: '#e9e7e3', r: -1.5,
    a: '<g fill="#23264a" fill-opacity=".42"><circle cx="72" cy="22" r="2.6"/><circle cx="80" cy="22" r="2.6"/><circle cx="88" cy="22" r="2.6"/></g><path d="M12 30q4-4 8 0" fill="none" stroke="#b9a98c" stroke-width="2" stroke-linecap="round"/>',
    o: {dr: -24, dl: '47%', dt: '46%', lbg: '#c9cfe6', lr: -2}},
  // 龍龍
  {id: 's-dino-hehe', d: 'dino', t: '嘿嘿', bg: '#dcefdc', r: 1.5,
    a: STK_SP(12, 20.6, 4.6, '#ffd36e') + STK_SP(88, 27.6, 3.6, '#ffd36e') + '<path d="M12 48q4 3 8 0" fill="none" stroke="#3a7a5e" stroke-width="2.2" stroke-linecap="round"/><path d="M82 50q4 3 8 0" fill="none" stroke="#3a7a5e" stroke-width="2.2" stroke-linecap="round"/>',
    up: '<path d="M52 5c8 0 14 5 14 12-9 2-15-3-14-12z" fill="#4c9a78" transform="rotate(-18 58 12)"/><path d="M53 6c4 4 8 8 12 10" fill="none" stroke="#3a7a5e" stroke-width="1" transform="rotate(-18 58 12)"/>',
    o: {dr: 4, dw: '62%', lbg: '#4c9a78', lc: '#fbf6ea', lr: -2}},
  {id: 's-dino-innocent', d: 'dino', t: '我什麼都沒做', bg: '#fdf0c8', r: -2,
    a: '<path d="M76 14q0-7 7.5-7t7.5 7q0 5-7.5 7.5v4" fill="none" stroke="#3f9aa5" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="83.5" cy="31.5" r="2.1" fill="#3f9aa5"/><path d="M67 21q3 5 0 7.5a3.8 3.8 0 0 1 0-7.5z" fill="#9fd0e6"/>',
    up: STK_LEAF(14, 56, -20, 1.15),
    o: {dr: -3, dl: '52%', lr: 1, fs: 10.2}},
  {id: 's-dino-play', d: 'dino', t: '來玩', bg: '#d9ecf3', r: 2,
    a: STK_LEAF(8, 10, 8, 1.1) + STK_LEAF(92, 10, 8, 1.1, '#7dbb96', 1) + '<g stroke="#e0ad3e" stroke-width="3.2" stroke-linecap="round"><path d="M84 38l8-1.5"/><path d="M83 49l7 3.5"/><path d="M16 38l-8-1.5"/><path d="M17 49l-7 3.5"/></g>',
    o: {dr: -6, dw: '62%', lbg: '#ffd36e', lr: 2}},
  // 史努比
  {id: 's-snoopy-idea', d: 'snoopy', t: '靈感來了', bg: '#e6e3f5', r: -1,
    a: '<path d="M79 8a10 10 0 0 1 6 18v4h-12v-4a10 10 0 0 1 6-18z" fill="#ffd36e"/><rect x="74" y="31" width="10" height="3" rx="1.5" fill="#8a5a45"/><rect x="75.5" y="35" width="7" height="2.6" rx="1.3" fill="#8a5a45"/><g stroke="#e0ad3e" stroke-width="2.4" stroke-linecap="round"><path d="M64 9l-5-3"/><path d="M62 19h-6"/><path d="M94 9l5-3"/></g>',
    o: {dr: -4, dl: '45%', lr: 2}},
  {id: 's-snoopy-report', d: 'snoopy', t: '報告', bg: '#dcefe6', r: 1.5,
    a: '<g transform="rotate(10 81 21)"><rect x="71" y="8" width="20" height="26" rx="2" fill="#fbf6ea"/><g stroke="#c9cfe6" stroke-width="1.8" stroke-linecap="round"><path d="M75 15h12"/><path d="M75 20h12"/><path d="M75 25h7"/></g><path d="M75 29.5l2 2 4-4" fill="none" stroke="#ff8a66" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g><g transform="rotate(-35 18 26)"><rect x="15" y="10" width="6" height="26" rx="1.5" fill="#3f9aa5"/><rect x="15" y="10" width="6" height="5" rx="1.5" fill="#2f7781"/><path d="M15 36h6l-3 6z" fill="#e6dcc6"/><path d="M17.2 40.4h1.6l-.8 1.6z" fill="#23264a"/></g>',
    o: {dr: 3, dl: '47%', lbg: '#3f9aa5', lc: '#fbf6ea', lr: -2}},
  {id: 's-snoopy-nap', d: 'snoopy', t: '午睡中', bg: '#39406a', r: -1,
    a: '<rect x="20" y="51" width="56" height="17" rx="8.5" fill="#b9bde0"/><path d="M28 59.5h40" stroke="#dfe3f0" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 3"/>' + STK_ZZ + STK_SP(16, 18, 4.5, '#fbf6ea') + STK_SP(30, 9, 2.6, '#fbf6ea', .8),
    o: {dr: -76, dt: '45%', dl: '49%', lr: 2}},
  // 火腿
  {id: 's-piggy-told', d: 'piggy', t: '我早就說了', bg: '#fbe9d6', r: 2,
    a: '<circle cx="82" cy="20" r="10" fill="#ffd36e"/><circle cx="82" cy="20" r="6.6" fill="none" stroke="#fbf6ea" stroke-width="1.6"/>' + STK_HT(82, 20.6, .3, '#ff8a66') + '<circle cx="92" cy="36" r="5.6" fill="#ffd36e"/><path d="M10 22l5 5 9-11" fill="none" stroke="#3f9aa5" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>',
    o: {dr: 5, dl: '47%', lr: -2, fs: 11.7}},
  {id: 's-piggy-good', d: 'piggy', t: '還不錯', bg: '#dcefdc', r: -1,
    a: STK_SP(18, 22, 9, '#ffd36e') + STK_SP(30, 10, 3.2, '#ff8a66') + '<path d="M73 22l5.5 5.5 10.5-13" fill="none" stroke="#3f9aa5" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>',
    o: {dr: -4, lr: 2}},
  {id: 's-piggy-save', d: 'piggy', t: '存起來', bg: '#fdf0c8', r: 2,
    a: STK_COIN(50) + STK_COIN(43.5) + STK_COIN(37) + '<ellipse cx="82" cy="37" rx="6" ry="1.9" fill="none" stroke="#fbf6ea" stroke-width="1.3"/>' + STK_SP(72, 22, 4, '#ff8a66') + STK_SP(91, 26, 2.6, '#e0ad3e'),
    o: {dr: 6, dl: '44%', lbg: '#4c9a78', lc: '#fbf6ea', lr: -2}},
  // 沒有娃娃的
  {id: 's-heart', d: '', t: '愛心', bg: '#fde3dc', r: -1.5,
    a: STK_HT(50, 38, 2.5, '#ff8a66') + '<ellipse cx="37" cy="29" rx="4.5" ry="3" fill="#fbf6ea" opacity=".55" transform="rotate(-30 37 29)"/>' + STK_HT(16, 18, .8, '#ffb199') + STK_HT(85, 60, .62, '#ffb199'),
    o: {lr: 2, fs: 14.3}},
  {id: 's-thanks', d: '', t: '謝謝', bg: '#fbf6ea', r: -2,
    a: '<path d="M50 44v26" stroke="#4c9a78" stroke-width="3.4" stroke-linecap="round"/><path d="M50 60c-9-1-14-6-14-12 8 0 13 4 14 12z" fill="#7dbb96"/><path d="M50 56c8-1 12-5 12-10-7 0-11 3-12 10z" fill="#4c9a78"/><g fill="#ff8a66"><circle cx="50" cy="17" r="8.6"/><circle cx="62" cy="26" r="8.6"/><circle cx="57.5" cy="40" r="8.6"/><circle cx="42.5" cy="40" r="8.6"/><circle cx="38" cy="26" r="8.6"/></g><circle cx="50" cy="30" r="7.4" fill="#ffd36e"/>',
    o: {lbg: '#ff8a66', lc: '#fbf6ea', lr: 1, fs: 14.3}},
  {id: 's-morning', d: '', t: '早安', bg: '#fbe9d6', r: 1.5,
    a: '<g stroke="#e0ad3e" stroke-width="3.4" stroke-linecap="round"><path d="M50 13v8"/><path d="M27.5 22.5l5.5 5.5"/><path d="M72.5 22.5L67 28"/><path d="M15 41h8"/><path d="M77 41h8"/></g><path d="M28 54a22 22 0 0 1 44 0z" fill="#ffd36e"/><path d="M42 45q2 2.2 4 0M54 45q2 2.2 4 0" fill="none" stroke="#8a5a45" stroke-width="2" stroke-linecap="round"/><path d="M4 54q23-5 46 0t46 0v14H4z" fill="#7dbb96"/><path d="M4 60q23-4 46 0t46 0v8H4z" fill="#4c9a78"/>',
    o: {lbg: '#ff8a66', lc: '#fbf6ea', lr: -2, fs: 14.3}},
  {id: 's-night', d: '', t: '晚安', bg: '#39406a', r: -1,
    a: '<path d="M54 13a24 24 0 1 0 22 35A20 20 0 0 1 54 13z" fill="#ffd36e"/>' + STK_SP(20, 20, 5.5, '#fbf6ea') + STK_SP(82, 18, 3.6, '#fbf6ea', .8) + STK_SP(14, 50, 3, '#fbf6ea', .7) + STK_SP(86, 52, 4.2, '#fbf6ea') + STK_SP(70, 8, 2.4, '#fbf6ea', .7),
    o: {lr: 2, fs: 14.3}},
  {id: 's-haha', d: '', t: '哈哈', bg: '#fdf0c8', r: 2,
    a: '<circle cx="23" cy="49" r="4.5" fill="#ffb199" opacity=".75"/><circle cx="77" cy="49" r="4.5" fill="#ffb199" opacity=".75"/><g fill="none" stroke="#8a5a45" stroke-width="3.6" stroke-linecap="round"><path d="M27 33q7-9 14 0"/><path d="M59 33q7-9 14 0"/></g><path d="M32 42h36q0 20-18 20t-18-20z" fill="#d96f50"/><path d="M40 55.5q10-7 20 0q-4 6-10 6t-10-6z" fill="#ff8a66"/><path d="M17 33q4 6 0 9a4.5 4.5 0 0 1 0-9z" fill="#9fd0e6"/><path d="M83 33q4 6 0 9a4.5 4.5 0 0 1 0-9z" fill="#9fd0e6"/>',
    o: {lbg: '#ff8a66', lc: '#fbf6ea', lr: -2, fs: 14.3}},
  {id: 's-sorry', d: '', t: '對不起', bg: '#e4e2ec', r: -2,
    a: '<path d="M44 70q-2-34 14-40q10-3 12 8" fill="none" stroke="#4c9a78" stroke-width="3.2" stroke-linecap="round"/><path d="M45 58c-8-1-12-6-12-11 7 0 11 4 12 11z" fill="#7dbb96"/><g fill="#ffb199"><circle cx="64.5" cy="44" r="5"/><circle cx="75.5" cy="44" r="5"/><circle cx="66" cy="52" r="5"/><circle cx="74" cy="52" r="5"/><circle cx="70" cy="55.5" r="5"/></g><circle cx="70" cy="46.5" r="4" fill="#ffd36e"/><ellipse cx="83" cy="66" rx="3.2" ry="2" fill="#ffb199" transform="rotate(30 83 66)"/>',
    o: {lr: 1, fs: 13.5}},
  {id: 's-ok', d: '', t: '好', bg: '#dcefe6', r: 1,
    a: '<circle cx="50" cy="38" r="23" fill="#fbf6ea" stroke="#3f9aa5" stroke-width="5"/><path d="M38.5 38.5l8 8 15.5-17" fill="none" stroke="#ff8a66" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>',
    o: {lbg: '#3f9aa5', lc: '#fbf6ea', lr: -2, fs: 15}},
  {id: 's-cheer', d: '', t: '加油', bg: '#d9ecf3', r: 1,
    a: '<g stroke="#e0ad3e" stroke-width="3.4" stroke-linecap="round"><path d="M50 8v8"/><path d="M50 58v8"/><path d="M21 37h8"/><path d="M71 37h8"/><path d="M29.5 16.5l5.6 5.6"/><path d="M64.9 51.9l5.6 5.6"/><path d="M70.5 16.5l-5.6 5.6"/><path d="M35.1 51.9l-5.6 5.6"/></g><circle cx="50" cy="37" r="16" fill="#ffd36e"/><path d="M43 39q7 7 14 0" fill="none" stroke="#8a5a45" stroke-width="2.6" stroke-linecap="round"/><circle cx="44" cy="33" r="1.9" fill="#8a5a45"/><circle cx="56" cy="33" r="1.9" fill="#8a5a45"/>',
    o: {lbg: '#3f9aa5', lc: '#fbf6ea', lr: -2, fs: 14.3}},
];
const STK_BY = Object.fromEntries(STK.map(s => [s.id, s]));
// 舊的八張娃娃臉 → 那隻娃娃的第一張（舊留言照樣畫得出來）
const STK_OLD = {'d-sloth': 's-sloth-slow', 'd-egg': 's-egg-lazy', 'd-dog': 's-dog-hey', 'd-moodeng': 's-moodeng-fun', 'd-nyanko': 's-nyanko-snack', 'd-dino': 's-dino-hehe', 'd-snoopy': 's-snoopy-idea', 'd-piggy': 's-piggy-told'};

function stkGet(id){ id = String(id || ''); return STK_BY[STK_OLD[id] || id] || null; }
function stkDoll(id){ const s = stkGet(id); return s ? s.d : ''; }
function stkName(id){ const s = stkGet(id); return s ? (s.d ? `${DOLL_NAME[s.d]}「${s.t}」` : s.t) : ''; }
// 一張貼圖的 HTML（不認得的代號回空字串，呼叫的人自己決定要畫什麼）。內容全是上面寫死的，沒有別人打的字。
function stkHTML(id){
  const s = stkGet(id); if (!s) return '';
  const o = s.o || {}, v = [`--bg:${s.bg}`, `--rot:${s.r || 0}deg`];
  [['lbg', 'lbg'], ['lc', 'lc']].forEach(([k, c]) => { if (o[k]) v.push(`--${c}:${o[k]}`); });
  if (o.lr != null) v.push(`--lr:${o.lr}deg`);
  if (o.fs) v.push(`--fs:${o.fs}cqw`);
  const dv = [];
  if (o.dr != null) dv.push(`--dr:${o.dr}deg`);
  if (o.dt) dv.push(`--dt:${o.dt}`);
  if (o.dl) dv.push(`--dl:${o.dl}`);
  if (o.dw) dv.push(`--dw:${o.dw}`);
  if (o.sx) dv.push(`--sx:${o.sx}`);
  return `<span class="stk" style="${v.join(';')}"><span class="stk-c">`
    + (s.a ? `<svg class="stk-p" viewBox="0 0 100 100" aria-hidden="true">${s.a}</svg>` : '')
    + (s.d && SPR[s.d] ? `<img class="stk-d" src="${SPR[s.d]}" alt="" style="${dv.join(';')}">` : '')
    + (s.up ? `<svg class="stk-p up" viewBox="0 0 100 100" aria-hidden="true">${s.up}</svg>` : '')
    + `<b class="stk-t">${s.t}</b></span></span>`;
}
