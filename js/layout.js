/* 版面調整模式（2026-11-26）：讓使用者在自己的手機上，對著真的按鈕調位置，調完把設定複製出來。
   打開：網址加 ?layout=1。平常玩不會看到這個模式。
   - 上面那一排（娃娃機、小屋地圖、房間切換、相簿、音樂、幣、小事）：每一顆可以放第一排、第二排或「收進更多」（多一顆 ⋯，點開才看到），
     同一排裡可以往左往右換順序；整排的大小、間距、對齊；房間切換一次露出幾間、現在這間要不要寫名字。
   - 浮在房間上的按鈕（小店、訪客簿、信箱、相機、電燈開關、收起來的收納架鈕）：可以拖，放開吸到格線和邊；也可以用上下左右微調；大小可以調；也可以收進更多。
   - 調整模式裡點按鈕是「選起來」，不會真的打開東西。
   設定存在這台裝置（localStorage 的 shubingNest.layout），不進存檔、不上雲端。關掉調整模式後，這台裝置就照調好的樣子。
   位置記的是「離哪一邊多遠」的比例（不是像素），換一支手機也合理。
   沒有存過設定、也不在調整模式時，這個檔案什麼都不動，畫面跟原本一模一樣。 */
const LAY_KEY = 'shubingNest.layout';
const LAY_ON = new URLSearchParams(location.search).has('layout');
const LAY_TOP = [
  {id: 'swap', name: '娃娃機', el: () => $('#swap')},
  {id: 'map', name: '小屋地圖', el: () => $('#nav .rmap')},
  {id: 'nav', name: '房間切換', el: () => $('#nav .rnav')},
  {id: 'alb', name: '相簿', el: () => $('#albBtn')},
  {id: 'music', name: '音樂', el: () => $('#musicBtn')},
  {id: 'coin', name: '幣', el: () => $('#coinPill')},
  {id: 'ev', name: '今天的小事', el: () => $('#evBtn')},
];
const LAY_FLOAT = [
  {id: 'shop', name: '火腿的小店', el: () => $('#shopBtn')},
  {id: 'book', name: '訪客簿', el: () => $('#bookBtn')},
  {id: 'mail', name: '信箱', el: () => $('#mailBtn')},
  {id: 'cam', name: '相機', el: () => $('#camBtn')},
  {id: 'lsw', name: '電燈開關', el: () => $('#lsw')},
  {id: 'tray', name: '收納架的開關（收起來時）', el: () => $('#tray')},
];
const layDefault = () => ({v: 1, top: {zoom: 1, gap: 6, align: 'between', navRooms: 0, navName: true, items: Object.fromEntries(LAY_TOP.map((t, i) => [t.id, [1, i]]))}, float: {}});
function layLoad(){
  try {
    const c = JSON.parse(localStorage.getItem(LAY_KEY) || 'null');
    if (!c || c.v !== 1 || !c.top || !c.top.items) return null;
    const d = layDefault();
    c.top = Object.assign(d.top, c.top, {items: Object.assign(d.top.items, c.top.items)});
    c.float = c.float || {};
    return c;
  } catch (e) { return null; }
}
let LAY = layLoad();
const laySave = () => { try { localStorage.setItem(LAY_KEY, JSON.stringify(LAY)); } catch (e) {} };

/* ---------- 套用設定 ---------- */
// 上面那一排：把 #nav 和右邊那組攤平（css 的 display:contents），每一顆用 order 排；第二排、更多那一排用換行的小元素隔開
function layApplyTop(){
  const top = $('.top'); if (!top) return;
  if (!LAY){ top.classList.remove('lay', 'noname'); return; }
  const T = LAY.top;
  top.classList.add('lay'); top.classList.toggle('noname', T.navName === false);
  top.style.zoom = T.zoom || 1; top.style.setProperty('--tg', (T.gap ?? 6) + 'px');
  top.style.justifyContent = {between: 'space-between', left: 'flex-start', center: 'center', right: 'flex-end'}[T.align] || 'space-between';
  ['lay-br1', 'lay-br2'].forEach((c, i) => { if (!top.querySelector('.' + c)){ const b = document.createElement('i'); b.className = 'lay-br ' + c; b.style.order = i ? 199 : 99; top.appendChild(b); } });
  let more = false;
  LAY_TOP.forEach(t => {
    const el = t.el(); if (!el) return;
    const [row, ord] = T.items[t.id] || [1, 0];
    el.style.order = (row === 'more' ? 200 : row === 2 ? 100 : 0) + ord;
    el.classList.toggle('in-more', row === 'more');
    if (row === 'more') more = true;
    el.dataset.lay = t.id;
  });
  const nav = $('#nav .rnav');
  if (nav){
    if (T.navRooms > 0){ const b = 30, on = T.navName === false ? b : 64; nav.style.flex = '0 0 auto'; nav.style.width = ((T.navRooms - 1) * (b + 2) + on + 8) + 'px'; }
    else { nav.style.flex = ''; nav.style.width = ''; }
  }
  const pity = $('#pity'); if (pity) pity.style.order = 50;
  // 沒有東西的那一排不要留空行
  const rows = LAY_TOP.map(t => String(T.items[t.id][0]));
  top.querySelector('.lay-br1').hidden = !rows.includes('2') && !rows.includes('more');
  top.querySelector('.lay-br2').hidden = !rows.includes('more');
  LAY_FLOAT.forEach(f => { if ((LAY.float[f.id] || {}).more) more = true; });
  // ⋯：有東西收進更多才出現，排在第一排最後
  let mb = $('#moreBtn');
  if (more && !mb){
    mb = document.createElement('button'); mb.id = 'moreBtn'; mb.className = 'ib w sm'; mb.setAttribute('aria-label', '更多'); mb.setAttribute('aria-expanded', 'false');
    mb.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2.200"/><circle cx="12" cy="12" r="2.200"/><circle cx="19" cy="12" r="2.200"/></svg>';
    mb.style.order = 98;
    mb.addEventListener('click', () => { const on = screen.classList.toggle('more-open'); mb.setAttribute('aria-expanded', on); });
    top.appendChild(mb);
  }
  if (mb) mb.hidden = !more;
  if (LAY_ON) screen.classList.add('more-open');   // 調整模式裡「更多」一直攤開，才選得到裡面的東西
  else if (!more) screen.classList.remove('more-open');
}
// 浮在房間上的按鈕：位置用 css 變數（離哪一邊多遠，比例）
function layApplyFloat(){
  LAY_FLOAT.forEach(f => {
    const el = f.el(); if (!el) return;
    const c = LAY && LAY.float[f.id];
    el.dataset.lay = f.id;
    if (!c){ el.classList.remove('lf', 'in-more'); ['--l-l', '--l-r', '--l-t', '--l-b', '--l-s', '--l-o'].forEach(k => el.style.removeProperty(k)); return; }
    el.classList.add('lf'); el.classList.toggle('in-more', !!c.more);
    el.style.setProperty('--l-l', c.ax === 'l' ? (c.x * 100).toFixed(2) + '%' : 'auto');
    el.style.setProperty('--l-r', c.ax === 'r' ? (c.x * 100).toFixed(2) + '%' : 'auto');
    el.style.setProperty('--l-t', c.ay === 't' ? (c.y * 100).toFixed(2) + '%' : 'auto');
    el.style.setProperty('--l-b', c.ay === 'b' ? (c.y * 100).toFixed(2) + '%' : 'auto');
    el.style.setProperty('--l-s', c.s || 1);
    // 放大縮小時，靠著的那個角不動，離邊的距離才不會跟著變
    el.style.setProperty('--l-o', `${c.ax === 'l' ? '0' : '100%'} ${c.ay === 't' ? '0' : '100%'}`);
  });
}
function layApply(){ layApplyTop(); layApplyFloat(); }
// 房間切換鈕每次重畫（換房間）都要再套一次順序
{
  const prev = renderNav;
  renderNav = function(){ prev(); if (LAY) layApplyTop(); if (LAY_ON && typeof laySelPaint === 'function') laySelPaint(); };
}
if (LAY) layApply();

/* ---------- 調整模式 ---------- */
let laySel = null, layDrag = null, layMin = false;
const layFind = id => LAY_TOP.find(t => t.id === id) || LAY_FLOAT.find(f => f.id === id);
const layIsTop = id => LAY_TOP.some(t => t.id === id);
// 現在畫面上這顆的位置 → 設定（離比較近的那一邊多遠，比例）
function layMeasure(el){
  const p = el.offsetParent || screen, P = p.getBoundingClientRect(), r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2 - P.left, cy = r.top + r.height / 2 - P.top;
  const ax = cx <= P.width / 2 ? 'l' : 'r', ay = cy <= P.height / 2 ? 't' : 'b';
  return {ax, x: +((ax === 'l' ? r.left - P.left : P.right - r.right) / P.width).toFixed(4), ay, y: +((ay === 't' ? r.top - P.top : P.bottom - r.bottom) / P.height).toFixed(4)};
}
function layFloatCfg(id){
  if (!LAY.float[id]){ const el = layFind(id).el(); LAY.float[id] = Object.assign(layMeasure(el), {s: 1, more: false}); }
  return LAY.float[id];
}
// 把這顆放到畫面上的 (left, top)（相對它的容器，像素），吸到 6px 的格線，離邊 30px 內吸到邊上留 10px
function layPlace(id, left, top, snap){
  const el = layFind(id).el(), P = (el.offsetParent || screen).getBoundingClientRect(), r = el.getBoundingClientRect();
  const w = r.width, h = r.height;
  left = Math.max(0, Math.min(P.width - w, left)); top = Math.max(0, Math.min(P.height - h, top));
  if (snap){
    const g = v => Math.round(v / 6) * 6;
    left = g(left); top = g(top);
    if (left < 30) left = 10; if (P.width - w - left < 30) left = P.width - w - 10;
    if (top < 30) top = 10; if (P.height - h - top < 30) top = P.height - h - 10;
  }
  const c = layFloatCfg(id);
  c.ax = left + w / 2 <= P.width / 2 ? 'l' : 'r'; c.ay = top + h / 2 <= P.height / 2 ? 't' : 'b';
  c.x = +((c.ax === 'l' ? left : P.width - w - left) / P.width).toFixed(4);
  c.y = +((c.ay === 't' ? top : P.height - h - top) / P.height).toFixed(4);
  layApplyFloat();
}
function layExport(){
  const out = JSON.parse(JSON.stringify(LAY));
  // 沒動過的浮動按鈕也量出現在的位置，設定才完整
  LAY_FLOAT.forEach(f => { const el = f.el(); if (!out.float[f.id] && el && el.offsetParent && (f.id !== 'tray' || tray.classList.contains('min'))) out.float[f.id] = Object.assign(layMeasure(el), {s: 1, more: false, auto: 1}); });
  return 'SHUBING-LAYOUT v1\n' + JSON.stringify(out);
}
function laySelPaint(){
  document.querySelectorAll('.lay-sel').forEach(e => e.classList.remove('lay-sel'));
  const it = laySel && layFind(laySel), el = it && it.el();
  if (el) el.classList.add('lay-sel');
}
function layPanel(){
  const p = $('#layPanel'); if (!p) return;
  if (layMin){ p.className = 'lay-panel min'; p.innerHTML = '<button class="btn sm" data-la="max">版面調整 ▲</button>'; return; }
  p.className = 'lay-panel';
  const T = LAY.top, it = laySel && layFind(laySel);
  const seg = (name, cur, opts) => `<div class="lay-seg" role="group">${opts.map(([v, t]) => `<button data-la="${name}" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}" aria-pressed="${String(cur) === String(v)}">${t}</button>`).join('')}</div>`;
  let sel = '<p class="lay-hint">點畫面上的按鈕把它選起來。浮在房間上的按鈕可以直接拖。</p>';
  if (it && layIsTop(it.id)){
    const [row] = T.items[it.id];
    sel = `<div class="lay-row"><b>${it.name}</b>${seg('row', row, [[1, '第一排'], [2, '第二排'], ['more', '收進更多']])}</div>
      <div class="lay-row"><span>順序</span><button class="btn sm" data-la="ord" data-v="-1">← 往左</button><button class="btn sm" data-la="ord" data-v="1">往右 →</button></div>
      ${it.id === 'nav' ? `<div class="lay-row"><span>露出幾間</span>${seg('navRooms', T.navRooms, [[0, '自動'], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]])}</div>
      <div class="lay-row"><span>現在這間寫名字</span>${seg('navName', T.navName !== false, [[true, '要'], [false, '不要']])}</div>` : ''}`;
  } else if (it){
    const c = layFloatCfg(it.id);
    sel = `<div class="lay-row"><b>${it.name}</b>${seg('fmore', !!c.more, [[false, '放在畫面上'], [true, '收進更多']])}</div>
      <div class="lay-row"><span>微調</span><button class="btn sm" data-la="mv" data-v="l" aria-label="往左">←</button><button class="btn sm" data-la="mv" data-v="u" aria-label="往上">↑</button><button class="btn sm" data-la="mv" data-v="d" aria-label="往下">↓</button><button class="btn sm" data-la="mv" data-v="r" aria-label="往右">→</button><button class="btn sm" data-la="freset">回原位</button></div>
      <div class="lay-row"><span>大小</span><input type="range" min="70" max="150" step="5" value="${Math.round((c.s || 1) * 100)}" data-li="fs" aria-label="大小"><output>${Math.round((c.s || 1) * 100)}%</output></div>`;
  }
  p.innerHTML = `<div class="lay-hd"><b>版面調整</b><button class="btn sm" data-la="min">收起來 ▼</button></div>
    ${sel}
    <div class="lay-sec">上面那一排</div>
    <div class="lay-row"><span>大小</span><input type="range" min="75" max="130" step="5" value="${Math.round(T.zoom * 100)}" data-li="zoom" aria-label="上排大小"><output>${Math.round(T.zoom * 100)}%</output></div>
    <div class="lay-row"><span>間距</span><input type="range" min="0" max="14" step="1" value="${T.gap}" data-li="gap" aria-label="上排間距"><output>${T.gap}</output></div>
    <div class="lay-row"><span>對齊</span>${seg('align', T.align, [['between', '分散'], ['left', '靠左'], ['center', '置中'], ['right', '靠右']])}</div>
    <div class="lay-row"><span>收納架</span>${seg('tray', tray.classList.contains('min'), [[true, '收起來（調它的鈕）'], [false, '打開']])}</div>
    <div class="lay-ft"><button class="btn y sm" data-la="copy">複製設定</button><button class="btn sm" data-la="reset">重設</button><button class="btn sm" data-la="done">完成</button></div>
    <textarea class="lay-out" id="layOut" readonly hidden aria-label="設定文字，長按可以全選"></textarea>`;
}
function layAct(b){
  const a = b.dataset.la, v = b.dataset.v, T = LAY.top;
  if (a === 'min' || a === 'max'){ layMin = a === 'min'; layPanel(); return; }
  if (a === 'row' && laySel){ const row = v === 'more' ? 'more' : +v; const n = LAY_TOP.filter(t => String(T.items[t.id][0]) === String(row)).length; T.items[laySel] = [row, n]; layNorm(); }
  else if (a === 'ord' && laySel){
    const [row, ord] = T.items[laySel];
    const same = LAY_TOP.filter(t => String(T.items[t.id][0]) === String(row)).sort((x, y) => T.items[x.id][1] - T.items[y.id][1]);
    const i = same.findIndex(t => t.id === laySel), j = i + (+v);
    if (j >= 0 && j < same.length){ const o = same[j].id; T.items[laySel] = [row, T.items[o][1]]; T.items[o] = [row, ord]; }
  }
  else if (a === 'navRooms') T.navRooms = +v;
  else if (a === 'navName') T.navName = v === 'true';
  else if (a === 'align') T.align = v;
  else if (a === 'tray'){ tray.classList.toggle('min', v === 'true'); if (typeof layout === 'function') layout(); }
  else if (a === 'fmore' && laySel) layFloatCfg(laySel).more = v === 'true';
  else if (a === 'freset' && laySel){ delete LAY.float[laySel]; }
  else if (a === 'mv' && laySel){
    const el = layFind(laySel).el(), P = (el.offsetParent || screen).getBoundingClientRect(), r = el.getBoundingClientRect(), d = 4;
    layPlace(laySel, r.left - P.left + (v === 'l' ? -d : v === 'r' ? d : 0), r.top - P.top + (v === 'u' ? -d : v === 'd' ? d : 0), false);
  }
  else if (a === 'copy'){
    const txt = layExport(), out = $('#layOut');
    out.hidden = false; out.value = txt; out.focus(); out.select();
    const ok = () => toast('設定複製好了，貼給研究對話'), no = () => toast('沒複製成功，長按下面的框全選再複製');
    try { navigator.clipboard.writeText(txt).then(ok, no); } catch (e) { try { document.execCommand('copy') ? ok() : no(); } catch (e2) { no(); } }
    laySave(); return;
  }
  else if (a === 'reset'){ LAY = layDefault(); laySel = null; try { localStorage.removeItem(LAY_KEY); } catch (e) {} layApply(); layPanel(); laySelPaint(); toast('回到原本的樣子了'); return; }
  else if (a === 'done'){ laySave(); location.href = location.pathname; return; }
  laySave(); layApply(); layPanel(); laySelPaint();
}
// 每一排的順序重新編成 0、1、2…
function layNorm(){
  const T = LAY.top;
  [1, 2, 'more'].forEach(row => LAY_TOP.filter(t => String(T.items[t.id][0]) === String(row)).sort((x, y) => T.items[x.id][1] - T.items[y.id][1]).forEach((t, i) => { T.items[t.id] = [row, i]; }));
}
function layStart(){
  if (!LAY) LAY = layDefault();
  screen.classList.add('laymode', 'more-open');
  const cv = $('#cover'); if (cv) cv.hidden = true;
  if (typeof setPage === 'function') setPage('room');
  $('#sheet').hidden = true;
  layApply();
  const p = document.createElement('div'); p.id = 'layPanel'; p.className = 'lay-panel'; screen.appendChild(p);
  layPanel();
  // 調整模式裡，畫面上的東西點了只會「選起來」；面板以外的點擊都攔下來，不會真的打開相簿、小店
  const inPanel = e => e.target.closest && e.target.closest('#layPanel');
  // 收納架打開時整塊不算「收納架的開關」，要收起來變成圓鈕才選得到
  const hit = e => { const el = e.target.closest && e.target.closest('[data-lay]'); const id = el ? el.dataset.lay : null; return id === 'tray' && !tray.classList.contains('min') ? null : id; };
  ['click', 'pointerup', 'pointercancel'].forEach(t => screen.addEventListener(t, e => {
    if (inPanel(e)) return;
    e.stopPropagation(); e.preventDefault();
    if (t !== 'click' && layDrag){
      const d = layDrag; layDrag = null;
      if (d.moved){ const el = layFind(d.id).el(), P = (el.offsetParent || screen).getBoundingClientRect(), r = el.getBoundingClientRect(); layPlace(d.id, r.left - P.left, r.top - P.top, true); laySave(); layPanel(); }
    }
  }, true));
  screen.addEventListener('pointerdown', e => {
    if (inPanel(e)) return;
    e.stopPropagation(); e.preventDefault();
    const id = hit(e);
    laySel = id; laySelPaint(); layPanel();
    if (id && !layIsTop(id)){
      const el = layFind(id).el(), P = (el.offsetParent || screen).getBoundingClientRect(), r = el.getBoundingClientRect();
      layDrag = {id, ox: e.clientX - (r.left - P.left), oy: e.clientY - (r.top - P.top), sx: e.clientX, sy: e.clientY, moved: false};
    }
  }, true);
  screen.addEventListener('pointermove', e => {
    if (!layDrag) return;
    e.stopPropagation(); e.preventDefault();
    if (!layDrag.moved && Math.hypot(e.clientX - layDrag.sx, e.clientY - layDrag.sy) < 5) return;
    layDrag.moved = true;
    layPlace(layDrag.id, e.clientX - layDrag.ox, e.clientY - layDrag.oy, false);
  }, true);
  p.addEventListener('click', e => { const b = e.target.closest('[data-la]'); if (b) layAct(b); });
  p.addEventListener('input', e => {
    const i = e.target.closest('[data-li]'); if (!i) return;
    const v = +i.value, o = i.nextElementSibling;
    if (i.dataset.li === 'zoom'){ LAY.top.zoom = v / 100; if (o) o.textContent = v + '%'; }
    else if (i.dataset.li === 'gap'){ LAY.top.gap = v; if (o) o.textContent = v; }
    else if (i.dataset.li === 'fs' && laySel){ layFloatCfg(laySel).s = v / 100; if (o) o.textContent = v + '%'; }
    laySave(); layApply();
  });
}
if (LAY_ON) setTimeout(layStart, 400);
