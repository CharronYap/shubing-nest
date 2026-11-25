/* 電視小遊戲（賺幣第二步）：點客廳的電視，或從「現在可以賺幣的事」進來。兩個都是自己畫、自己寫的小遊戲。
   - 接點心：貓咪老師在下面左右移動，接掉下來的點心。漏接不扣分，30 秒一局。
   - 翻牌：12 張牌，八隻娃娃抽六隻各兩張，翻到一樣的就收走，翻完算翻了幾次。
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

/* ---------- 選單 ---------- */
function gameMenu(){
  if (VISIT) return;
  openSheet(`<div class="hd">${GAME_TV}<span>電視小遊戲</span></div>
    <div class="er-box"><p class="er-hi">${typeof earnGameNote === 'function' ? earnGameNote() : ''}</p>
      <div class="er-it"><span class="ic"><img src="${SPR.nyanko}" alt=""></span><span class="tx2"><b>接點心</b><small>30 秒，幫貓咪老師接掉下來的點心</small></span><button class="btn y sm" data-gm="catch">玩</button></div>
      <div class="er-it"><span class="ic">${HEART('#ffb3d3', '#fff')}</span><span class="tx2"><b>翻牌</b><small>12 張牌，找出一樣的兩張</small></span><button class="btn y sm" data-gm="flip">玩</button></div>
    </div>`);
  evOpen = false; alOpen = false;
}
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('[data-gm]'); if (!b) return;
  if (b.dataset.gm === 'catch') gameCatch(); else gameFlip();
});
// 點電視（接在衣櫃的 onFurnTap 後面）
{
  const prev = typeof onFurnTap === 'function' ? onFurnTap : null;
  onFurnTap = function(it){ if (it.id === 'tv' && !VISIT){ gameMenu(); return true; } return prev ? prev(it) : false; };
}
