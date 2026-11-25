/* 拍照：房間右上角的相機鈕。按下去閃一下，把現在的房間畫成一張拍立得（3:4 直式，下面留白邊寫字）
   - 用 canvas 照房間現在的樣子重畫：牆、地板、窗戶、家具、娃娃（穿的衣服和帽子）、關燈的暗色和檯燈的光
   - 娃娃各有反應：史努比轉過來擺姿勢、彈跳豬有時候正好跳起來拍糊了、蛋黃哥背對鏡頭也懶得轉、火腿在白邊上留一句吐槽
   - 「存下來」：手機叫出分享（可以存到相簿），電腦下載成 PNG。照片不上傳雲端
   - 照片裡有的娃娃，相簿那一頁記一行「○月○日一起拍了照」
   - 拍幾張都可以，不花幣，也沒有次數限制
   S.album.photos = {娃娃: ['日期', ...]}，同一天只記一次，每隻留最近 12 天 */
const CAM_ICON = '<svg viewBox="0 0 24 24"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.2-1.8c.3-.5.8-.7 1.3-.7h2.8c.5 0 1 .2 1.3.7L15.9 6h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" fill="currentColor"/><circle cx="12" cy="12.4" r="3.6" fill="#fff"/><circle cx="12" cy="12.4" r="1.9" fill="currentColor"/><circle cx="17" cy="9" r=".9" fill="#fff"/></svg>';
const PIGGY_QUIPS = ['拍我要先付錢', '這張我拍得比較好', '又拍？手機容量夠嗎', '記得把我拍瘦一點', '剛剛有人閉眼睛', '我早就知道你會拍', '拍完要請吃點心', '構圖普通，可以啦'];
const PH = {W: 960, H: 1380, pad: 30, pw: 900, ph: 1200};   // 整張、照片四周的白邊、照片的寬高
const ROOM_NAME = {living: '客廳', bed: '臥室', bath: '浴室'};

/* ---------- 讀圖 ---------- */
const imgCache = {};
function loadImg(src){
  if (imgCache[src]) return imgCache[src];
  return imgCache[src] = new Promise(ok => {
    const im = new Image();
    im.onload = () => ok(im); im.onerror = () => ok(null);
    im.src = src;
  });
}
const svgUrl = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
// 畫面上的 SVG 元素換成圖片；寬高設成要畫的大小，放大不會糊
function svgImg(el, w, h){
  const c = el.cloneNode(true);
  c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  c.setAttribute('width', Math.max(1, Math.round(w))); c.setAttribute('height', Math.max(1, Math.round(h)));
  c.removeAttribute('style');
  return loadImg(svgUrl(new XMLSerializer().serializeToString(c)));
}

/* ---------- 牆和地板的花紋（照 css/style.css 的 .w-* .f-* 畫） ---------- */
function tile(ctx, s, w, h, draw, ox = 0, oy = 0){
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
  const t = c.getContext('2d'); t.scale(c.width / w, c.height / h); draw(t);
  const p = ctx.createPattern(c, 'repeat');
  p.setTransform(new DOMMatrix().translate(ox, oy).scale(w / c.width, h / c.height));
  return p;
}
function grad(ctx, y0, y1, a, b){ const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
const dot = (t, x, y, r, c) => { t.fillStyle = c; t.beginPath(); t.arc(x, y, r, 0, 7); t.fill(); };
async function paintWall(ctx, s, W, wh, kind){
  const fill = f => { ctx.fillStyle = f; ctx.fillRect(0, 0, W, wh); };
  if (kind === 'stripe') fill(tile(ctx, s, 28, 4, t => { t.fillStyle = '#ffe3ef'; t.fillRect(0, 0, 14, 4); t.fillStyle = '#fff2f7'; t.fillRect(14, 0, 14, 4); }));
  else if (kind === 'dots') fill(tile(ctx, s, 24, 24, t => {
    t.fillStyle = '#fff9e3'; t.fillRect(0, 0, 24, 24);
    dot(t, 12, 12, 4, '#ffd75e'); [[0, 0], [24, 0], [0, 24], [24, 24]].forEach(([x, y]) => dot(t, x, y, 2.3, '#ffe9a8'));
  }));
  else if (kind === 'sky'){
    fill(grad(ctx, 0, wh, '#bfe8ff', '#eaf8ff'));
    const css = getComputedStyle(document.documentElement).getPropertyValue('--cloud').trim();
    const m = /^url\(["']?(.*?)["']?\)$/s.exec(css), im = m && await loadImg(m[1]);
    if (im) [[.14, .26, 64, 34], [.88, .62, 52, 28], [.46, .84, 40, 21]].forEach(([px, py, w, h]) => ctx.drawImage(im, (W - w) * px, (wh - h) * py, w, h));
  }
  else if (kind === 'tile'){
    fill(grad(ctx, 0, wh, '#d4f1fb', '#e6f8fd'));
    ctx.fillStyle = '#fff';
    for (let x = 0; x < W; x += 20) ctx.fillRect(x, 0, 2, wh);
    for (let y = wh; y > 0; y -= 20) ctx.fillRect(0, y - 2, W, 2);
  }
  else if (kind === 'star'){
    fill(grad(ctx, 0, wh, '#3b3f8f', '#5a5fb0'));
    fill(tile(ctx, s, 30, 26, t => dot(t, 8, 9, 1.8, '#fff6c4')));
    fill(tile(ctx, s, 34, 30, t => dot(t, 20, 20, 1.4, '#fff')));
  }
  else fill('#ffe3ef');
}
function paintFloor(ctx, s, W, H, wh, kind){
  const fill = f => { ctx.fillStyle = f; ctx.fillRect(0, wh, W, H - wh); };
  const check = (n, a, b) => tile(ctx, s, n, n, t => {
    const h = n / 2; t.fillStyle = b; t.fillRect(0, 0, n, n); t.fillStyle = a; t.fillRect(h, 0, h, h); t.fillRect(0, h, h, h);
  }, 0, wh);
  if (kind === 'wood') fill(tile(ctx, s, 64, 4, t => {
    [[0, 30, '#f3cb9a'], [30, 2, '#e2ad72'], [32, 30, '#f0c48f'], [62, 2, '#e2ad72']].forEach(([x, w, c]) => { t.fillStyle = c; t.fillRect(x, 0, w, 4); });
  }, 0, wh));
  else if (kind === 'check') fill(check(28, '#ffd0e3', '#fff'));
  else if (kind === 'mint') fill(check(24, '#c6efdc', '#effcf5'));
  else if (kind === 'cloud') fill(tile(ctx, s, 48, 30, t => {
    t.fillStyle = '#e6defc'; t.fillRect(0, 0, 48, 30);
    t.fillStyle = '#fff'; t.beginPath(); t.ellipse(20, 14, 13.6, 7.4, 0, 0, 7); t.fill();
  }, 0, wh));
  else fill('#f3cb9a');
  // 牆腳下面的淡影子（.floor::before）
  const g = ctx.createLinearGradient(0, wh, 0, wh + (H - wh) * .4);
  g.addColorStop(0, 'rgba(90,50,80,.13)'); g.addColorStop(1, 'rgba(90,50,80,0)');
  ctx.fillStyle = g; ctx.fillRect(0, wh, W, (H - wh) * .4);
}

/* ---------- 房間裡的東西 ---------- */
// 元素在房間裡的位置（房間的 CSS px），含動畫的縮放
function boxIn(el, R){ const r = el.getBoundingClientRect(); return {x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height}; }
function sparkle(ctx, x, y, r){
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#ffd75e'; ctx.strokeStyle = '#fff'; ctx.lineWidth = r * .25;
  ctx.beginPath();
  for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4, l = i % 2 ? r * .38 : r; ctx.lineTo(Math.sin(a) * l, -Math.cos(a) * l); }
  ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
}
// 一隻娃娃：本體 png，穿衣服的話照 .dz 裡每一層的 % 疊上去（帽子可能有轉角度）
function drawDollLayers(ctx, body, b){
  const pic = body.firstElementChild;
  if (!pic) return;
  if (pic.tagName === 'IMG'){ if (pic.complete && pic.naturalWidth) ctx.drawImage(pic, b.x, b.y, b.w, b.h); return; }
  pic.querySelectorAll('img').forEach(im => {
    if (!im.complete || !im.naturalWidth) return;
    if (!im.classList.contains('dz-hat') && !im.classList.contains('dz-out')){ ctx.drawImage(im, b.x, b.y, b.w, b.h); return; }
    const p = k => parseFloat(im.style[k]) / 100 || 0;
    const x = b.x + p('left') * b.w, y = b.y + p('top') * b.h, w = p('width') * b.w, h = p('height') * b.h;
    const rot = /rotate\((-?[\d.]+)deg\)/.exec(im.style.transform || '');
    ctx.save();
    if (rot){ ctx.translate(x + w / 2, y + h / 2); ctx.rotate(+rot[1] * Math.PI / 180); ctx.drawImage(im, -w / 2, -h / 2, w, h); }
    else ctx.drawImage(im, x, y, w, h);
    ctx.restore();
  });
}
function drawDoll(ctx, el, R, it, fx){
  const body = el.querySelector('.body'), pic = body && body.firstElementChild;
  if (!pic) return;
  const b = boxIn(pic, R), d = it.id, bx = b.x + b.w / 2, by = b.y + b.h;
  ctx.save();
  if (d === 'snoopy' && fx.pose){
    // 轉過來擺姿勢：往鏡頭歪一點，旁邊冒星星
    ctx.translate(bx, by); ctx.rotate(-7 * Math.PI / 180); ctx.translate(-bx, -by);
    drawDollLayers(ctx, body, b);
    ctx.restore();
    sparkle(ctx, b.x + b.w * .92, b.y + b.h * .14, b.w * .09);
    sparkle(ctx, b.x + b.w * .06, b.y + b.h * .3, b.w * .06);
    return;
  }
  if (d === 'moodeng' && fx.jump){
    // 正好跳起來：往上一點、上下拉出殘影，腳下兩條動作線
    const up = b.h * .16;
    for (let i = 4; i >= 1; i--){ ctx.globalAlpha = .16; drawDollLayers(ctx, body, {...b, y: b.y - up + i * b.h * .035}); }
    ctx.globalAlpha = .85; drawDollLayers(ctx, body, {...b, y: b.y - up});
    ctx.globalAlpha = .7; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, b.w * .025); ctx.lineCap = 'round';
    [[.3, .1], [.5, .16], [.7, .1]].forEach(([px, l]) => { ctx.beginPath(); ctx.moveTo(b.x + b.w * px, by - up * .35); ctx.lineTo(b.x + b.w * px, by - up * .35 + b.h * l); ctx.stroke(); });
    ctx.restore();
    return;
  }
  if (d === 'egg'){
    // 背對鏡頭，也懶得轉回來
    ctx.translate(bx, 0); ctx.scale(-1, 1); ctx.translate(-bx, 0);
  }
  drawDollLayers(ctx, body, b);
  ctx.restore();
  if (el.classList.contains('sleep')){
    const z = (t, x, y, sz) => {
      ctx.font = `900 ${sz}px "GenSenRounded","PingFang TC",sans-serif`;
      ctx.lineWidth = sz * .22; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.strokeText(t, x, y);
      ctx.fillStyle = '#7d6ed6'; ctx.fillText(t, x, y);
    };
    const eb = boxIn(el, R);
    z('z', eb.x + eb.w * .68, eb.y + eb.h * .14, 19); z('z', eb.x + eb.w * .82, eb.y + eb.h * .02, 14);
  }
}

/* ---------- 拍一張 ---------- */
async function photoShoot(){
  const R = room.getBoundingClientRect(), W = R.width, H = R.height;
  if (!W || !H) return null;
  // 照片是 3:4：房間比較寬就切兩邊，比較長就切上下（上面少切一點，留住窗戶）
  let cw = W, ch = H, cx = 0, cy = 0;
  if (W / H > .75){ cw = H * .75; cx = (W - cw) / 2; } else { ch = W / .75; cy = (H - ch) * .4; }
  const s = PH.pw / cw;
  const c = document.createElement('canvas'); c.width = PH.W; c.height = PH.H;
  const ctx = c.getContext('2d');
  try { await document.fonts.load('900 40px "GenSenRounded"'); } catch (e) {}

  // 白邊
  ctx.fillStyle = '#fffdf8'; ctx.fillRect(0, 0, PH.W, PH.H);
  ctx.save();
  ctx.beginPath(); ctx.rect(PH.pad, PH.pad, PH.pw, PH.ph); ctx.clip();
  ctx.setTransform(s, 0, 0, s, PH.pad - cx * s, PH.pad - cy * s);

  const r = cur(), wh = WALL * H, night = isNight();
  await paintWall(ctx, s, W, wh, r.wall);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, wh - 4, W, 7);   // 牆腳的白條
  paintFloor(ctx, s, W, H, wh, r.floor);
  const winEl = $('#win svg');
  if (winEl){ const b = boxIn(winEl, R), im = await svgImg(winEl, b.w * s, b.h * s); if (im) ctx.drawImage(im, b.x, b.y, b.w, b.h); }

  // 家具、娃娃、地上的小東西：照前後順序（z-index）畫
  const fx = {pose: true, jump: Math.random() < .5};
  const els = [...room.querySelectorAll('.it,.drop')].filter(e => e.offsetParent !== null)
    .map((e, i) => ({e, i, z: +getComputedStyle(e).zIndex || 0})).sort((a, b) => a.z - b.z || a.i - b.i);
  const inShot = new Set();
  for (const {e} of els){
    const it = items.find(o => String(o.uid) === e.dataset.u);
    if (e.classList.contains('doll') && it){
      drawDoll(ctx, e, R, it, fx);
      const b = boxIn(e, R);
      if (b.x + b.w * .5 > cx && b.x + b.w * .5 < cx + cw && b.y + b.h * .5 > cy && b.y + b.h * .5 < cy + ch) inShot.add(it.id);
    } else {
      const svg = e.querySelector('svg'); if (!svg) continue;
      const b = boxIn(svg, R), im = await svgImg(svg, b.w * s, b.h * s);
      if (im) ctx.drawImage(im, b.x, b.y, b.w, b.h);
    }
  }

  // 關燈：跟畫面一樣蓋一層暗色，有檯燈的話再把光畫上去
  if (room.classList.contains('off')){
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    if (night){ ctx.fillStyle = 'rgba(18,18,70,.74)'; } else { ctx.globalAlpha = .9; ctx.fillStyle = 'rgba(40,40,110,.42)'; }
    ctx.fillRect(0, 0, W, H); ctx.restore();
    room.querySelectorAll('.glow').forEach(g => {
      const b = boxIn(g, R), x = b.x + b.w / 2, y = b.y + b.h / 2, rr = b.w / 2;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, 'rgba(255,226,150,.85)'); gr.addColorStop(.4, 'rgba(255,210,120,.35)'); gr.addColorStop(.7, 'rgba(255,200,120,0)');
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gr; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); ctx.restore();
    });
  }
  ctx.restore();

  // 照片四周一條細線，像相紙
  ctx.strokeStyle = 'rgba(107,45,74,.08)'; ctx.lineWidth = 2; ctx.strokeRect(PH.pad, PH.pad, PH.pw, PH.ph);
  // 下面的白邊：薯餅的小窩、房間、日期；火腿在的話右邊留一句
  const by = PH.pad + PH.ph, font = (w, z) => `${w} ${z}px "GenSenRounded","PingFang TC","Noto Sans TC",sans-serif`;
  const d = new Date();
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.fillStyle = '#e14f93'; ctx.font = font(900, 42); ctx.fillText('薯餅的小窩', PH.pad + 6, by + 66);
  ctx.fillStyle = '#a8708c'; ctx.font = font(800, 26); ctx.fillText(`${ROOM_NAME[roomId] || ''}・${d.getMonth() + 1}月${d.getDate()}日`, PH.pad + 8, by + 110);
  let quip = '';
  if (inShot.has('piggy')){
    quip = PIGGY_QUIPS[Math.floor(Math.random() * PIGGY_QUIPS.length)];
    ctx.save(); ctx.translate(PH.W - PH.pad - 8, by + 78); ctx.rotate(-3 * Math.PI / 180);
    ctx.textAlign = 'right'; ctx.fillStyle = '#6b2d4a'; ctx.font = font(900, 30); ctx.fillText(`「${quip}」`, 0, 0);
    ctx.fillStyle = '#a8708c'; ctx.font = font(800, 22); ctx.fillText('火腿', -10, 38);
    ctx.restore();
  }
  return {canvas: c, dolls: [...inShot]};
}

/* 相簿：一起拍了照 */
function photoRecord(dolls){
  const a = S.album, t = todayStr();
  a.photos = a.photos || {};
  dolls.forEach(d => {
    const l = a.photos[d] = a.photos[d] || [];
    if (l[l.length - 1] !== t){ l.push(t); if (l.length > 12) l.splice(0, l.length - 12); }
  });
  save();
}
function photoRows(d){
  const l = ((S.album.photos || {})[d]) || [];
  if (!l.length) return '';
  return `<div class="al-sec">一起拍的照</div><ul class="al-ln al-ph-ln">${l.slice().reverse().map(t => { const [, m, dd] = t.split('-'); return `<li>${+m}月${+dd}日一起拍了照</li>`; }).join('')}</ul>`;
}

/* ---------- 按鈕、閃光、預覽 ---------- */
function photoFlash(){
  if (REDUCE) return;
  const f = document.createElement('div'); f.className = 'flash';
  stage.appendChild(f); setTimeout(() => f.remove(), 450);
}
const photoName = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `薯餅的小窩-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`; };
async function photoSave(canvas){
  const blob = await new Promise(ok => { try { canvas.toBlob(ok, 'image/png'); } catch (e) { ok(null); } });
  if (!blob){ toast('這台存不了照片'); return; }
  const file = new File([blob], photoName(), {type: 'image/png'});
  // 手機：叫出分享（可以存到相簿或傳給別人）；電腦：直接下載
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({files: [file]})){
    try { await navigator.share({files: [file], title: '薯餅的小窩'}); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('照片存好了');
}
let photoBusy = false;
async function photoTake(){
  if (photoBusy || VISIT) return;
  photoBusy = true;
  $('#sheet').hidden = true;
  photoFlash();
  let shot = null;
  try { shot = await photoShoot(); } catch (e) { console.info('[photo] 沒拍成', e); }
  photoBusy = false;
  if (!shot){ toast('沒拍成，再試一次'); return; }
  photoRecord(shot.dolls);
  let url = '';
  try { url = shot.canvas.toDataURL('image/png'); } catch (e) {}
  if (!url){ toast('這台存不了照片'); return; }
  const old = screen.querySelector('.over.phov'); if (old) old.remove();
  const o = document.createElement('div'); o.className = 'over phov';
  o.innerHTML = `<div class="pcard phcard" role="dialog" aria-label="拍好的照片">
      <img class="phimg" alt="拍好的照片" src="${url}">
      <div class="row"><button class="btn y ph-save">存下來</button><button class="btn ph-again">再拍一張</button></div>
      <button class="ph-x" aria-label="關閉"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button></div>`;
  screen.appendChild(o);
  o.addEventListener('click', e => { if (e.target === o) o.remove(); });
  o.querySelector('.ph-x').onclick = () => o.remove();
  o.querySelector('.ph-save').onclick = () => photoSave(shot.canvas);
  o.querySelector('.ph-again').onclick = () => { o.remove(); setTimeout(photoTake, 120); };
  o.querySelector('.ph-save').focus({preventScroll: true});
}

(function(){
  const b = document.createElement('button');
  b.className = 'cam'; b.id = 'camBtn'; b.setAttribute('aria-label', '拍照'); b.innerHTML = CAM_ICON;
  b.addEventListener('click', photoTake);
  room.appendChild(b);
})();
