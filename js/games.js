/* 電視小遊戲（賺幣第二步）：點客廳的電視，或從「現在可以賺幣的事」進來。兩個都是自己畫、自己寫的小遊戲。
   - 接點心：貓咪老師在下面左右移動，接掉下來的點心。漏接不扣分，30 秒一局。
   - 翻牌：12 張牌，八隻娃娃抽六隻各兩張，翻到一樣的就收走，翻完算翻了幾次。
   - 這是誰的（2026-11-27）：中間出現一樣東西，點牠的主人（家裡有的娃娃才會出現），40 秒算送回幾樣。點錯那隻只會搖頭，不扣東西。
     樣式寫在這個檔裡（gm3Css，class 都是 gm3- 開頭），沒有放進 css/style.css。
   給幣：每天前 3 局照成績給 3～5 枚，之後每一局固定 1 枚，沒有次數上限（js/earn.js 的 earnGameDone）。
   不懲罰、不催人：漏接、翻錯都不扣東西，中途關掉也不會怎樣（只是那一局沒有幣）。 */
const GAME_TV = '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="3" fill="currentColor"/><rect x="5.5" y="8.5" width="10" height="7" rx="1.5" fill="#fff"/><circle cx="18" cy="10" r="1" fill="#fff"/><circle cx="18" cy="13.5" r="1" fill="#fff"/><path d="M9 3l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const GAME_SNACK = [
  '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#e9b872" stroke="#b9823f" stroke-width="2.4"/><circle cx="14" cy="15" r="2.4" fill="#7a4a22"/><circle cx="25" cy="14" r="2" fill="#7a4a22"/><circle cx="23" cy="25" r="2.6" fill="#7a4a22"/><circle cx="13" cy="25" r="1.8" fill="#7a4a22"/></svg>',
  '<svg viewBox="0 0 40 40"><path d="M8 26c0-9 5-15 12-15s12 6 12 15z" fill="#ffd66b" stroke="#d99a1c" stroke-width="2.4" stroke-linejoin="round"/><path d="M10 15c3-5 17-5 20 0-1 3-4 4-6 3-2 2-6 2-8 0-2 1-5 0-6-3z" fill="#8a5a3a" stroke="#6b3f22" stroke-width="2" stroke-linejoin="round"/><rect x="5" y="26" width="30" height="5" rx="2.5" fill="#fff" stroke="#e3cfd8" stroke-width="2"/></svg>',
  '<svg viewBox="0 0 40 40"><path d="M5 14l8 6-8 6zM35 14l-8 6 8 6z" fill="#ffb3d3" stroke="#e0609d" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="20" cy="20" rx="10" ry="8" fill="#ff8fc0" stroke="#e0609d" stroke-width="2.4"/><path d="M15 16c3 2 3 6 0 8M21 15c3 3 3 7 0 10" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',
];
let gmRaf = 0;
function gameClose(){ cancelAnimationFrame(gmRaf); const o = screen.querySelector('.over.gm'); if (o) o.remove(); }
function gameShell(title, inner){
  gameClose(); $('#sheet').hidden = true;
  const o = document.createElement('div'); o.className = 'over gm';
  o.innerHTML = `<div class="gm-card" role="dialog" aria-label="${title}"><div class="gm-hd"><b>${title}</b><span class="gm-st"></span><button class="gm-x" aria-label="關閉"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button></div>${inner}</div>`;
  screen.appendChild(o);
  o.querySelector('.gm-x').onclick = gameClose;
  return o;
}
// 結束：算幣、問要不要再玩。tier = 這一局的成績換成 3～5
function gameEnd(o, line, tier, again){
  const n = typeof earnGameDone === 'function' ? earnGameDone(tier) : 0;
  const body = o.querySelector('.gm-body');
  body.innerHTML = `<div class="gm-end"><p class="gm-res">${line}</p><p class="gm-coin">${COIN}<b>+${n}</b></p>
    <small>${typeof earnGameNote === 'function' ? earnGameNote() : ''}</small>
    <div class="row"><button class="btn y gm-again">再玩一局</button><button class="btn gm-ok">好了</button></div></div>`;
  body.querySelector('.gm-again').onclick = again;
  body.querySelector('.gm-ok').onclick = gameClose;
}

/* ---------- 接點心 ---------- */
function gameCatch(){
  const SEC = 30;
  const o = gameShell('接點心', `<div class="gm-body"><div class="gc-field" tabindex="0" aria-label="左右移動貓咪老師接點心，可以用方向鍵"><img class="gc-cat" src="${SPR.nyanko}" alt=""></div><p class="gm-tip">手指左右滑，讓貓咪老師接點心。漏接不扣分。</p></div>`);
  const f = o.querySelector('.gc-field'), cat = o.querySelector('.gc-cat'), st = o.querySelector('.gm-st');
  let cx = 50, score = 0, t0 = performance.now(), last = t0, next = 0, over = false;
  const drops = [];
  const move = e => { const r = f.getBoundingClientRect(); cx = Math.max(8, Math.min(92, (e.clientX - r.left) / r.width * 100)); };
  f.addEventListener('pointerdown', e => { move(e); f.setPointerCapture(e.pointerId); });
  f.addEventListener('pointermove', e => { if (e.buttons || e.pointerType !== 'mouse') move(e); else move(e); });
  f.addEventListener('keydown', e => { if (e.key === 'ArrowLeft'){ cx = Math.max(8, cx - 8); e.preventDefault(); } if (e.key === 'ArrowRight'){ cx = Math.min(92, cx + 8); e.preventDefault(); } });
  f.focus({preventScroll: true});
  const tick = now => {
    if (over || !o.isConnected) return;
    const dt = Math.min(50, now - last) / 1000, el = (now - t0) / 1000; last = now;
    cat.style.left = cx + '%';
    if (now >= next && el < SEC - .8){
      const d = document.createElement('span'); d.className = 'gc-d';
      d.innerHTML = GAME_SNACK[Math.floor(Math.random() * GAME_SNACK.length)];
      const it = {x: 8 + Math.random() * 84, y: -8, v: 38 + Math.random() * 22 + el * .9, el: d};
      d.style.left = it.x + '%'; f.appendChild(d); drops.push(it);
      next = now + 520 + Math.random() * 420;
    }
    for (let i = drops.length - 1; i >= 0; i--){
      const it = drops[i]; it.y += it.v * dt; it.el.style.top = it.y + '%';
      if (it.y > 76 && it.y < 92 && Math.abs(it.x - cx) < 13){
        score++; it.el.remove(); drops.splice(i, 1);
        cat.classList.remove('yum'); void cat.offsetWidth; cat.classList.add('yum');
      } else if (it.y > 104){ it.el.remove(); drops.splice(i, 1); }
    }
    st.textContent = `${score} 個・${Math.max(0, Math.ceil(SEC - el))} 秒`;
    if (el >= SEC){
      over = true;
      gameEnd(o, `接到 ${score} 個點心`, score >= 25 ? 5 : score >= 15 ? 4 : 3, gameCatch);
      st.textContent = '';
      return;
    }
    gmRaf = requestAnimationFrame(tick);
  };
  gmRaf = requestAnimationFrame(tick);
}

/* ---------- 翻牌 ---------- */
function gameFlip(){
  const pool = DOLLS.slice();
  for (let i = pool.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const cards = [...pool.slice(0, 6), ...pool.slice(0, 6)];
  for (let i = cards.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  const o = gameShell('翻牌', `<div class="gm-body"><div class="gf-grid">${cards.map((d, i) => `<button class="gf-c" data-i="${i}" aria-label="第 ${i + 1} 張牌，還沒翻"><span class="bk">${HEART('#ffb3d3', '#fff')}</span><img src="${SPR[d]}" alt=""></button>`).join('')}</div><p class="gm-tip">翻到兩張一樣的就收走。翻錯不扣東西。</p></div>`);
  const st = o.querySelector('.gm-st');
  let open = [], steps = 0, done = 0, lock = false;
  st.textContent = '翻了 0 次';
  o.querySelector('.gf-grid').addEventListener('click', e => {
    const b = e.target.closest('.gf-c'); if (!b || lock || b.classList.contains('on') || b.classList.contains('ok')) return;
    const i = +b.dataset.i;
    b.classList.add('on'); b.setAttribute('aria-label', DOLL_NAME[cards[i]]);
    open.push(b);
    if (open.length < 2) return;
    steps++; st.textContent = `翻了 ${steps} 次`;
    const [a, c] = open; open = [];
    if (cards[+a.dataset.i] === cards[+c.dataset.i]){
      a.classList.add('ok'); c.classList.add('ok'); done++;
      if (done === 6) setTimeout(() => { if (o.isConnected){ st.textContent = ''; gameEnd(o, `翻了 ${steps} 次，全部配對完成`, steps <= 9 ? 5 : steps <= 13 ? 4 : 3, gameFlip); } }, 500);
    } else {
      lock = true;
      setTimeout(() => { [a, c].forEach(x => { x.classList.remove('on'); x.setAttribute('aria-label', `第 ${+x.dataset.i + 1} 張牌，還沒翻`); }); lock = false; }, 750);
    }
  });
}

/* ---------- 這是誰的 ---------- */
// 每隻一樣東西（照個性挑的）。p 是幾塊形狀：[標籤, 屬性, 顏色, 深色]；顏色寫 'none' 的只有線（葉脈、亮光這種）。g 是整個轉一下
const GM3_IT = {
  sloth: {n: '一小朵雲', p: [['path', 'd="M11 29h19a7 7 0 0 0 1.2-13.9A9 9 0 0 0 14 13.6 7.6 7.6 0 0 0 11 29z"', '#ffffff', '#8fc6e6'], ['path', 'd="M15 18c1.5-2 4-3 6.5-2.6"', 'none', '#cdeeff']]},
  egg: {n: '一顆枕頭', p: [['path', 'd="M7 12c9-3.4 17-3.4 26 0 2 5.4 2 10.6 0 16-9 3.4-17 3.4-26 0-2-5.4-2-10.6 0-16z"', '#fff3c4', '#d99a00'], ['circle', 'cx="8" cy="12" r="2.2"', '#ffe58f', '#d99a00'], ['circle', 'cx="32" cy="12" r="2.2"', '#ffe58f', '#d99a00'], ['circle', 'cx="8" cy="28" r="2.2"', '#ffe58f', '#d99a00'], ['circle', 'cx="32" cy="28" r="2.2"', '#ffe58f', '#d99a00']]},
  dog: {n: '一隻拖鞋', g: 'rotate(-18 20 20)', p: [['ellipse', 'cx="20" cy="21" rx="9" ry="14.5"', '#ff9cc8', '#e0609d'], ['path', 'd="M11 15c5-4.4 13-4.4 18 0v6c-5-2.8-13-2.8-18 0z"', '#ffffff', '#e0609d']]},
  moodeng: {n: '一盆水', p: [['path', 'd="M4 18h32l-3.6 11.4a3.4 3.4 0 0 1-3.2 2.4H10.8a3.4 3.4 0 0 1-3.2-2.4z"', '#8fd3ef', '#4a9fd0'], ['ellipse', 'cx="20" cy="18" rx="16" ry="4"', '#cdeeff', '#4a9fd0'], ['path', 'd="M11 6.4c0 2.2-1.8 3.4-1.8 4.8a1.8 1.8 0 0 0 3.6 0c0-1.4-1.8-2.6-1.8-4.8zM20 3c0 2.2-1.8 3.4-1.8 4.8a1.8 1.8 0 0 0 3.6 0c0-1.4-1.8-2.6-1.8-4.8zM29 6.4c0 2.2-1.8 3.4-1.8 4.8a1.8 1.8 0 0 0 3.6 0c0-1.4-1.8-2.6-1.8-4.8z"', '#8fd3ef', '#4a9fd0']]},
  nyanko: {n: '一顆饅頭', p: [['path', 'd="M6 28c0-10.4 6.4-17.4 14-17.4S34 17.6 34 28c0 2-1.6 3.4-3.6 3.4H9.6C7.6 31.4 6 30 6 28z"', '#fff8ee', '#d9b48a'], ['path', 'd="M16 14.6c1.4 2 2.6 2.8 4 2.8s2.6-.8 4-2.8"', 'none', '#d9b48a'], ['circle', 'cx="20" cy="11.4" r="1.7"', '#ff9cc8', '#e0609d']]},
  dino: {n: '一片葉子', p: [['path', 'd="M8 32C8 18 18 8 33 7c1 15-9 25-25 25z"', '#b8e986', '#78b84a'], ['path', 'd="M10 30C16 22 22 16 29 11"', 'none', '#78b84a']]},
  snoopy: {n: '一枝筆', g: 'rotate(-38 20 20)', p: [['rect', 'x="9" y="16" width="20" height="8" rx="1.4"', '#ffd66b', '#d99a1c'], ['path', 'd="M29 16l7.4 4-7.4 4z"', '#f2cf9c', '#b9773f'], ['rect', 'x="3.6" y="16" width="6.4" height="8" rx="2.4"', '#ff9cc8', '#e0609d']]},
  piggy: {n: '一枚硬幣', p: [['circle', 'cx="20" cy="20" r="13"', '#ffd66b', '#d99a1c'], ['circle', 'cx="20" cy="20" r="8.4"', '#ffe58f', '#e8b52a'], ['path', 'd="M15 15.4c1.4-1.6 3.2-2.4 5-2.4"', 'none', '#ffffff']]},
};
// 點對了牠說的（兩句輪流）、點錯了牠說的。對話框只有一行，所以每句都短
const GM3_YES = {sloth: ['是我的雲。謝謝。', '雲回來了。好。'], egg: ['枕頭。好，躺了。', '剛好想躺。'], dog: ['汪！我的拖鞋！', '拖鞋！我要藏好！'], moodeng: ['水！！我的！！', '再來一盆！！'],
  nyanko: ['饅頭！本大爺的。', '哼，送得好。'], dino: ['嘿嘿，我的葉子。', '這片要放誰頭上。'], snoopy: ['作家的筆，謝啦。', '靈感回來了。'], piggy: ['收進肚子，謝了。', '一枚，記下來。']};
const GM3_NO = {sloth: '……不是我的耶。', egg: '不是我的。好累。', dog: '汪？不是我的！', moodeng: '不是我的！！', nyanko: '不是本大爺的。', dino: '不是我的啦。', snoopy: '作家不用這個。', piggy: '不是我的，我確定。'};
const GM3_BOX = '<svg viewBox="0 0 40 40"><rect x="7" y="15" width="26" height="19" rx="3" fill="#f2b880" stroke="#b9773f" stroke-width="2.2"/><rect x="5" y="10" width="30" height="7" rx="2.4" fill="#ffd8a8" stroke="#b9773f" stroke-width="2.2"/><path d="M20 10v24" stroke="#e0609d" stroke-width="3.4"/><path d="M20 10c-3-6-9-5-7-1s7 1 7 1c0 0 5 3 7-1s-4-5-7 1" fill="#ff9cc8" stroke="#e0609d" stroke-width="1.8" stroke-linejoin="round"/></svg>';
// 紙片風格（預設）：沒有描邊，每一塊下面墊一塊往下錯開的深色；?look=old 的時候照原本的畫法描邊
function gm3Svg(it){
  const paper = document.documentElement.classList.contains('look-paper');
  const one = ([t, a, c, d]) => c === 'none' ? `<${t} ${a} fill="none" stroke="${d}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
    : paper ? `<${t} ${a} fill="${d}" opacity=".55" transform="translate(0 1.8)"/><${t} ${a} fill="${c}"/>` : `<${t} ${a} fill="${c}" stroke="${d}" stroke-width="2.2" stroke-linejoin="round"/>`;
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><g${it.g ? ` transform="${it.g}"` : ''}>${it.p.map(one).join('')}</g></svg>`;
}
function gm3Css(){
  if (document.getElementById('gm3-css')) return;
  const s = document.createElement('style'); s.id = 'gm3-css';
  s.textContent = `
.gm3-field{position:relative;height:min(58dvh,420px);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;background:linear-gradient(var(--p-sky,#e9f6ff),var(--p-wall,#fff6e6) 56%,var(--p-floor,#f6e3ec) 56%);user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.gm3-next{position:absolute;top:8px;right:8px;display:flex;align-items:center;gap:3px;padding:3px 6px;border-radius:10px;background:color-mix(in srgb,var(--p-sky,#cdeeff) 30%,var(--p-paper,#fff))}
.gm3-next small{font-size:11px;color:var(--p-ink,var(--soft,#9a8a94));opacity:.75;margin-right:2px}
.gm3-next span{width:22px;height:22px;display:block}
.gm3-next svg,.gm3-plate svg,.gm3-fly svg{width:100%;height:100%;display:block;overflow:visible}
.gm3-ask{flex:none;display:grid;justify-items:center;gap:6px;padding:18px 0 4px}
.gm3-plate{width:32%;aspect-ratio:1;box-sizing:border-box;border-radius:50%;padding:4%;background:color-mix(in srgb,var(--p-sky,#cdeeff) 24%,var(--p-paper,#fff));box-shadow:0 4px 0 var(--p-edge,#ead9e2)}
.gm3-name{margin:0;font-size:15px;font-weight:800;color:var(--p-ink,var(--ink,#5a4650))}
.gm3-dolls{flex:1;display:flex;flex-wrap:wrap;justify-content:center;align-content:flex-end;gap:26px 0;padding:0 2px 8px}
.gm3-d{position:relative;border:0;background:none;padding:0;margin:0;display:grid;justify-items:center;cursor:pointer;color:var(--p-ink,var(--ink,#5a4650));font:inherit;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.gm3-d img{width:70%;aspect-ratio:1;object-fit:contain;position:relative;z-index:1;transform-origin:50% 100%;pointer-events:none}
.gm3-sh{position:absolute;left:50%;bottom:20px;width:54%;height:8px;border-radius:50%;background:var(--p-ink,#7a5a6a);opacity:.14;transform:translateX(-50%)}
.gm3-d b{position:relative;z-index:2;margin-top:1px;padding:1px 8px;border-radius:9px;font-size:12px;font-weight:800;white-space:nowrap;background:var(--p-paper,#fff);box-shadow:0 2px 0 var(--p-edge,#ead9e2)}
.gm3-d:focus-visible{outline:3px solid var(--p-sun,#ffd66b);outline-offset:1px;border-radius:12px}
.gm3-d.no{opacity:.55}
.gm3-d.no img{animation:gm3No .4s}
.gm3-d.yes img{animation:gm3Hop .45s ease-out}
.gm3-say{position:absolute;z-index:3;bottom:calc(100% - 4px);left:50%;transform:translateX(-50%);white-space:nowrap;padding:3px 8px;border-radius:10px;font-size:12px;font-weight:800;font-style:normal;line-height:1.3;background:var(--p-paper,#fff);color:var(--p-ink,var(--ink,#5a4650));box-shadow:0 2px 0 var(--p-edge,#ead9e2);pointer-events:none;animation:gm3Say 1.6s forwards}
.gm3-say[data-al=l]{left:0;transform:none}
.gm3-say[data-al=r]{left:auto;right:0;transform:none}
.gm3-fly{position:absolute;z-index:4;pointer-events:none}
.gm3-pop{animation:gm3Pop .3s ease-out}
@keyframes gm3Hop{0%,100%{transform:none}40%{transform:translateY(-16%) scale(1.05,.95)}}
@keyframes gm3No{0%,100%{transform:none}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
@keyframes gm3Say{0%{opacity:0;margin-bottom:-4px}12%,78%{opacity:1;margin-bottom:0}100%{opacity:0}}
@keyframes gm3Pop{0%{transform:scale(.6);opacity:.3}100%{transform:none;opacity:1}}`;
  document.head.appendChild(s);
}
function gameWhose(){
  gm3Css();
  const SEC = 40;
  const own = DOLLS.filter(d => DOLL_N[d] > 0), pool = own.length >= 2 ? own : DOLLS.slice();
  const o = gameShell('這是誰的', `<div class="gm-body"><div class="gm3-field">
      <div class="gm3-next" aria-hidden="true"><small>下一個</small><span></span><span></span></div>
      <div class="gm3-ask"><div class="gm3-plate"></div><p class="gm3-name" aria-live="polite"></p></div>
      <div class="gm3-dolls"></div>
    </div><p class="gm-tip">點一下東西的主人。點錯不扣東西，換一隻再點就好。</p></div>`);
  const field = o.querySelector('.gm3-field'), plate = o.querySelector('.gm3-plate'), name = o.querySelector('.gm3-name'), row = o.querySelector('.gm3-dolls'), st = o.querySelector('.gm-st');
  const nexts = [...o.querySelectorAll('.gm3-next span')];
  // 娃娃一直站在同一個位置：4 隻以下排一排，5 隻以上排兩排
  const cols = pool.length <= 4 ? pool.length : Math.ceil(pool.length / 2);
  row.innerHTML = pool.map((d, i) => { const c = i < cols ? i : i - cols, n = i < cols ? cols : pool.length - cols;
    return `<button class="gm3-d" data-d="${d}" data-al="${c === 0 && n > 1 ? 'l' : c === n - 1 && n > 1 ? 'r' : 'c'}" style="width:${(100 / cols).toFixed(2)}%" aria-label="${DOLL_NAME[d]}"><span class="gm3-sh"></span><img src="${SPR[d]}" alt=""><b>${DOLL_NAME[d]}</b></button>`; }).join('');
  let score = 0, over = false, busy = true, said = {}, got = {};
  const t0 = performance.now(), queue = [];
  const fill = () => { while (queue.length < 3){ const prev = queue[queue.length - 1]; let d, k = 0; do d = pool[Math.floor(Math.random() * pool.length)]; while (d === prev && k++ < 20); queue.push(d); } };
  const say = (btn, text) => { row.querySelectorAll('.gm3-say').forEach(x => x.remove()); const b = document.createElement('i'); b.className = 'gm3-say'; b.dataset.al = btn.dataset.al; b.textContent = text; btn.appendChild(b); setTimeout(() => b.remove(), 1600); };
  const anim = (btn, cls) => { btn.classList.remove(cls); void btn.offsetWidth; btn.classList.add(cls); };
  const round = () => {
    fill();
    const d = queue[0];
    plate.innerHTML = gm3Svg(GM3_IT[d]);
    if (!REDUCE) anim(plate, 'gm3-pop');
    name.textContent = `${GM3_IT[d].n}，是誰的？`;
    nexts.forEach((s, i) => { s.innerHTML = gm3Svg(GM3_IT[queue[i + 1]]); });
    row.querySelectorAll('.gm3-d.no').forEach(b => b.classList.remove('no'));
    busy = false;
  };
  // 點對了：東西飛過去，牠跳一下說一句，換下一樣
  const right = btn => {
    const d = btn.dataset.d; busy = true; score++; got[d] = (got[d] || 0) + 1;
    queue.shift();
    const land = () => {
      if (over || !o.isConnected) return;
      if (!REDUCE) anim(btn, 'yes');
      const k = said[d] = ((said[d] ?? -1) + 1) % GM3_YES[d].length; say(btn, GM3_YES[d][k]);
      round();
    };
    if (REDUCE){ land(); return; }
    const F = field.getBoundingClientRect(), a = plate.getBoundingClientRect(), b = btn.querySelector('img').getBoundingClientRect();
    const f = document.createElement('div'); f.className = 'gm3-fly'; f.innerHTML = plate.innerHTML; plate.innerHTML = '';
    const sz = a.width * .8; f.style.cssText = `left:${a.left - F.left + a.width * .1}px;top:${a.top - F.top + a.height * .1}px;width:${sz}px;height:${sz}px`;
    field.appendChild(f);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height * .45 - (a.top + a.height / 2);
    f.animate([{transform: 'none'}, {transform: `translate(${dx}px,${dy}px) scale(.35)`, opacity: .85}], {duration: 380, easing: 'cubic-bezier(.5,0,.6,1)'}).onfinish = () => { f.remove(); land(); };
  };
  row.addEventListener('click', e => {
    const btn = e.target.closest('.gm3-d'); if (!btn || busy || over) return;
    if (btn.dataset.d === queue[0]) right(btn);
    else { btn.classList.add('no'); if (!REDUCE) anim(btn, 'no'); say(btn, GM3_NO[btn.dataset.d]); }
  });
  const tick = now => {
    if (over || !o.isConnected) return;
    const el = (now - t0) / 1000;
    st.textContent = `${score} 個・${Math.max(0, Math.ceil(SEC - el))} 秒`;
    if (el >= SEC){
      over = true; st.textContent = '';
      const top = Object.keys(got).sort((x, y) => got[y] - got[x])[0];
      gameEnd(o, score ? `送回 ${score} 樣東西，${DOLL_NAME[top]}收到最多` : '這一局還沒送到，下次再來', score >= 24 ? 5 : score >= 14 ? 4 : 3, gameWhose);
      return;
    }
    gmRaf = requestAnimationFrame(tick);
  };
  round();
  gmRaf = requestAnimationFrame(tick);
}

/* ---------- 選單 ---------- */
function gameMenu(){
  if (VISIT) return;
  openSheet(`<div class="hd">${GAME_TV}<span>電視小遊戲</span></div>
    <div class="er-box"><p class="er-hi">${typeof earnGameNote === 'function' ? earnGameNote() : ''}</p>
      <div class="er-it"><span class="ic"><img src="${SPR.nyanko}" alt=""></span><span class="tx2"><b>接點心</b><small>30 秒，幫貓咪老師接掉下來的點心</small></span><button class="btn y sm" data-gm="catch">玩</button></div>
      <div class="er-it"><span class="ic">${HEART('#ffb3d3', '#fff')}</span><span class="tx2"><b>翻牌</b><small>12 張牌，找出一樣的兩張</small></span><button class="btn y sm" data-gm="flip">玩</button></div>
      <div class="er-it"><span class="ic">${GM3_BOX}</span><span class="tx2"><b>這是誰的</b><small>40 秒，把東西送回給牠的主人</small></span><button class="btn y sm" data-gm="whose">玩</button></div>
    </div>`);
  evOpen = false; alOpen = false;
}
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('[data-gm]'); if (!b) return;
  if (b.dataset.gm === 'catch') gameCatch(); else if (b.dataset.gm === 'whose') gameWhose(); else gameFlip();
});
// 點電視（接在衣櫃的 onFurnTap 後面）
{
  const prev = typeof onFurnTap === 'function' ? onFurnTap : null;
  onFurnTap = function(it){ if (it.id === 'tv' && !VISIT){ gameMenu(); return true; } return prev ? prev(it) : false; };
}
