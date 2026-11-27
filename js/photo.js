/* 拍照：房間右上角的相機鈕。按下去閃一下，把現在的房間畫成一張拍立得（3:4 直式，下面留白邊寫字）
   - 用 canvas 照房間現在的樣子重畫：牆、地板、窗戶、家具、娃娃（穿的衣服和帽子）、關燈的暗色和檯燈的光
   - 像隨手抓拍（2026-11-28）：照按下快門那一刻的畫面畫，娃娃不停下來、不擺姿勢。正在跳的那隻拍糊了，
     蛋黃哥背對鏡頭也懶得轉，火腿在白邊上留一句吐槽
   - 「存下來」：手機叫出分享（可以存到相簿），電腦下載成 PNG。照片不上傳雲端
   - 照片裡有的娃娃，相簿那一頁記一行「○月○日一起拍了照」
   - 拍幾張都可以，不花幣，也沒有次數限制
   - 第五版：登入後預覽多一顆「寄給朋友」，把這間房間當明信片寄出去（js/card.js）
   S.album.photos = {娃娃: ['日期', ...]}，同一天只記一次，每隻留最近 12 天 */
const CAM_ICON = '<svg viewBox="0 0 24 24"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.2-1.8c.3-.5.8-.7 1.3-.7h2.8c.5 0 1 .2 1.3.7L15.9 6h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" fill="currentColor"/><circle cx="12" cy="12.4" r="3.6" fill="#fff"/><circle cx="12" cy="12.4" r="1.9" fill="currentColor"/><circle cx="17" cy="9" r=".9" fill="#fff"/></svg>';
const PIGGY_QUIPS = ['拍我要先付錢', '這張我拍得比較好', '又拍？手機容量夠嗎', '記得把我拍瘦一點', '剛剛有人閉眼睛', '我早就知道你會拍', '拍完要請吃點心', '構圖普通，可以啦'];
const PH = {W: 960, H: 1380, pad: 30, pw: 900, ph: 1200};   // 整張、照片四周的白邊、照片的寬高
const ROOM_NAME = {living: '客廳', bed: '臥室', bath: '浴室', kitchen: '廚房', attic: '閣樓'};

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
/* ---------- 畫布不能被「污染」（2026-11-27，使用者的 iPhone 一按相機就跳「存不了照片」）----------
   iPhone 的瀏覽器（WebKit）比電腦嚴：有些圖一畫上去，整張畫布就再也讀不出來（toDataURL、toBlob 丟例外），照片就沒了。
   已知會這樣的：拿 SVG 圖直接做花紋（createPattern）、SVG 裡有 foreignObject、SVG 裡再放 <image> 或指到外面的東西。電腦的 Chrome 不會，所以要靠這裡擋。
   做法：每一樣圖先畫在小的暫存畫布上試一次，讀得回來才畫到照片上；讀不回來的換成拿掉可疑東西的版本，還是不行就跳過那一樣、記下名字。
   拍完還是讀不回來的話，提示會寫是畫到哪一樣之後開始壞的（photoBad），截圖就知道要查哪裡。 */
let photoBad = [];
const photoNote = name => { if (name && !photoBad.includes(name)){ photoBad.push(name); console.info('[photo] 這一樣畫上去照片會存不了，跳過：' + name); } };
const photoClean = cv => { try { cv.getContext('2d').getImageData(0, 0, 1, 1); return true; } catch (e) { return false; } };
const photoImgSeen = new WeakMap();
function photoImgOk(im){
  if (!im) return false;
  if (photoImgSeen.has(im)) return photoImgSeen.get(im);
  const t = document.createElement('canvas'); t.width = t.height = 4;
  let ok = false;
  try { t.getContext('2d').drawImage(im, 0, 0, 4, 4); ok = photoClean(t); } catch (e) {}
  photoImgSeen.set(im, ok);
  return ok;
}
// 給別的檔案用：把一張圖（例如花紋的 SVG）先畫成畫布；讀不回來就回 null。花紋要用畫布做，不能直接拿 SVG 圖做
function photoRaster(im, w, h){
  if (!im || !im.complete || !im.naturalWidth) return null;
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  try { c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); } catch (e) { return null; }
  return photoClean(c) ? c : null;
}
const photoElName = el => { const it = el.closest && el.closest('.it'); if (it){ const o = items.find(x => String(x.uid) === it.dataset.u); return o ? o.id : 'it'; } const fx = el.closest && el.closest('.fx'); if (fx) return [...fx.classList].filter(c => c !== 'fx' && c !== 'ydx' && c !== 'tvx').join('.') || 'fx'; return el.closest && el.closest('#win') ? 'win' : el.closest && el.closest('.drop') ? 'drop' : 'svg'; };
// 畫面上的 SVG 元素換成圖片；寬高設成要畫的大小，放大不會糊。回 null = 這一樣不畫
async function svgImg(el, w, h, name){
  const make = strip => {
    const c = el.cloneNode(true);
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    c.setAttribute('width', Math.max(1, Math.round(w))); c.setAttribute('height', Math.max(1, Math.round(h)));
    c.removeAttribute('style');
    if (strip){
      c.querySelectorAll('foreignObject,image,feImage,filter,script,style').forEach(n => n.remove());
      c.querySelectorAll('*').forEach(n => { ['filter', 'mask', 'clip-path'].forEach(a => n.removeAttribute(a)); [...n.attributes].forEach(a => { if (/href$/.test(a.name) && !/^#/.test(a.value)) n.removeAttribute(a.name); }); });
    }
    return loadImg(svgUrl(new XMLSerializer().serializeToString(c)));
  };
  let im = await make(false);
  if (im && photoImgOk(im)) return im;
  im = await make(true);
  if (im && photoImgOk(im)) return im;
  photoNote(name || photoElName(el));
  return null;
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
    if (im && !photoImgOk(im)) photoNote('wall-cloud');
    else if (im) [[.14, .26, 64, 34], [.88, .62, 52, 28], [.46, .84, 40, 21]].forEach(([px, py, w, h]) => ctx.drawImage(im, (W - w) * px, (wh - h) * py, w, h));
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
  else if (kind === 'cream'){
    fill(grad(ctx, 0, wh, '#fff3d6', '#ffe9bd'));
    fill(tile(ctx, s, 26, 26, t => dot(t, 10, 10, 2.8, '#fff')));
  }
  else if (typeof decoDef === 'function' && decoDef('wall', kind)) decoPaint(ctx, s, 0, W, wh, decoDef('wall', kind));   // 新的壁紙（js/furn3.js）
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
  else if (typeof decoDef === 'function' && decoDef('floor', kind)) decoPaint(ctx, s, wh, W, H - wh, decoDef('floor', kind));   // 新的地板（js/furn3.js）
  else fill('#f3cb9a');
  // 牆腳下面的淡影子（.floor::before）
  const g = ctx.createLinearGradient(0, wh, 0, wh + (H - wh) * .4);
  g.addColorStop(0, 'rgba(90,50,80,.13)'); g.addColorStop(1, 'rgba(90,50,80,0)');
  ctx.fillStyle = g; ctx.fillRect(0, wh, W, (H - wh) * .4);
}

/* ---------- 房間裡的東西 ---------- */
// 元素在房間裡的位置（房間的 CSS px），含動畫的縮放
function boxIn(el, R){ const r = el.getBoundingClientRect(); return {x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height}; }
/* 拍照不用停、不用擺姿勢（2026-11-28 使用者說照片要像隨手抓拍）：
   按下快門那一刻（photoShoot 第一個 await 之前）先把每個入鏡的東西記下來：位置、大小、前後順序、當下的樣子
   （正在跳、睡著、側身的旋轉格、左右翻、衣服帽子這一刻的位置）。之後載圖、載字型的時候娃娃繼續動，照片照那一刻畫，
   不會一隻拍到前一刻、一隻拍到後一刻。
   - 正在跳（.body 有 roam-hop）的任何一隻：跳起來拍糊了（往上一點、殘影、腳下的動作線）。
   - 側身就畫旋轉圖的那一格（img/spin，js/spin.js），沒有 3D 的四隻照畫面左右翻；睡著、坐著照畫面。
   - 蛋黃哥照舊左右翻（牠本來就懶得看鏡頭，不算擺姿勢）。畫面上牠剛好側身的時候照那一格畫、不再翻，不然方向會跟畫面相反。 */
const phSpinImg = {};   // 側身用的旋轉圖：畫之前先載好（photoShoot 的 phSpinReady）
async function phSpinReady(){
  await Promise.all(Object.keys(typeof SPIN === 'object' ? SPIN : {}).map(d => phSpinImg[d] && phSpinImg[d].complete ? null : new Promise(ok => {
    const im = new Image(); im.onload = () => { phSpinImg[d] = im; ok(); }; im.onerror = () => ok(); im.src = SPIN[d].src;
  })));
}
// 記下一隻娃娃這一刻的樣子：每一層圖在房間裡的位置（帽子、衣服照 .dz 裡每一層的 %，可能有轉角度、變窄、淡出）
function phSnapDoll(el, R, d){
  const body = el.querySelector('.body'), pic = body && body.firstElementChild;
  if (!pic) return null;
  const hop = body.classList.contains('roam-hop');
  let dy = 0;   // 跳到一半：先放回地上，再照拍糊的畫法往上
  if (hop && body.offsetParent === el){
    // 動畫的 translate 是百分比，直接讀不好換算：.body 的原點在底部中間，所以底部往上移了多少就是跳起來的高度
    const er = el.getBoundingClientRect(), k = el.offsetHeight ? er.height / el.offsetHeight : 1;
    dy = body.getBoundingClientRect().bottom - (er.top + (body.offsetTop + body.offsetHeight) * k);
  }
  const at = e => { const r = boxIn(e, R); r.y -= dy; return r; };
  const b = at(pic);
  const sst = typeof SPS !== 'undefined' ? SPS.get(el) : null, sp3 = body.querySelector('.sp3');
  const f = sst && sp3 && typeof spinMod === 'function' ? spinMod(sst.f) : 0;
  const spin = f ? {d, f, s: at(sp3)} : null;   // 側身：畫旋轉圖的那一格（第 0 格跟正面的 png 一樣）
  const L = [], base = im => (spin && im.classList.contains('sp-base') ? {...b, im, spin} : {...b, im, a: 1});
  if (pic.tagName === 'IMG') L.push(base(pic));
  else pic.querySelectorAll('img').forEach(im => {
    if (!im.classList.contains('dz-hat') && !im.classList.contains('dz-out')){ L.push(base(im)); return; }
    const p = k => parseFloat(im.style[k]) / 100 || 0;
    const rot = /rotate\((-?[\d.]+)deg\)/.exec(im.style.transform || ''), op = im.style.opacity;
    L.push({im, x: b.x + p('left') * b.w, y: b.y + p('top') * b.h, w: p('width') * b.w, h: p('height') * b.h,
      rot: rot ? +rot[1] : 0, sx: parseFloat(String(im.style.scale || '').split(' ')[0]) || 1, a: op === '' ? 1 : +op});
  });
  return {d, b: spin ? spin.s : b, L, hop,   // 側身時畫的是旋轉圖：拍糊的動作線、左右翻都照它的框（皮蛋的旋轉圖有放大，框跟正面的 png 不一樣）
    sleep: el.classList.contains('sleep'), flip: (d === 'egg' && !spin) !== el.classList.contains('flipx'), eb: boxIn(el, R)};
}
function phLayers(ctx, D, off){
  D.L.forEach(l => {
    const sp = l.spin ? phSpinImg[l.spin.d] : null;
    if (sp){
      // 旋轉圖 6×4 格；位置照畫面上 .sp3 的框（皮蛋的取景放大、挪過的也算在裡面）
      const cw = sp.naturalWidth / 6, ch = sp.naturalHeight / 4, f = l.spin.f, r = l.spin.s;
      ctx.drawImage(sp, (f % 6) * cw, Math.floor(f / 6) * ch, cw, ch, r.x, r.y + off, r.w, r.h);
      return;
    }
    if (!(l.a > 0) && !l.spin) return;
    if (!l.im || !l.im.complete || !l.im.naturalWidth) return;
    ctx.save(); if (!l.spin) ctx.globalAlpha *= l.a;
    ctx.translate(l.x + l.w / 2, l.y + off + l.h / 2);
    if (l.rot) ctx.rotate(l.rot * Math.PI / 180);
    if (l.sx && l.sx !== 1) ctx.scale(l.sx, 1);
    ctx.drawImage(l.im, -l.w / 2, -l.h / 2, l.w, l.h);
    ctx.restore();
  });
}
function drawDoll(ctx, D){
  const b = D.b, bx = b.x + b.w / 2, by = b.y + b.h;
  ctx.save();
  if (D.flip){ ctx.translate(bx, 0); ctx.scale(-1, 1); ctx.translate(-bx, 0); }
  if (D.hop){
    // 正好跳起來：往上一點、上下拉出殘影，腳下三條動作線
    const up = b.h * .16;
    for (let i = 4; i >= 1; i--){ ctx.globalAlpha = .16; phLayers(ctx, D, -up + i * b.h * .035); }
    ctx.globalAlpha = .85; phLayers(ctx, D, -up);
    ctx.globalAlpha = .7; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, b.w * .025); ctx.lineCap = 'round';
    [[.3, .1], [.5, .16], [.7, .1]].forEach(([px, l]) => { ctx.beginPath(); ctx.moveTo(b.x + b.w * px, by - up * .35); ctx.lineTo(b.x + b.w * px, by - up * .35 + b.h * l); ctx.stroke(); });
  } else phLayers(ctx, D, 0);
  ctx.restore();
  if (D.sleep){
    const z = (t, x, y, sz) => {
      ctx.font = `900 ${sz}px ${cvFam('z', 'head')}`;
      ctx.lineWidth = sz * .22; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.strokeText(t, x, y);
      ctx.fillStyle = '#7d6ed6'; ctx.fillText(t, x, y);
    };
    const eb = D.eb;
    z('z', eb.x + eb.w * .68, eb.y + eb.h * .14, 19); z('z', eb.x + eb.w * .82, eb.y + eb.h * .02, 14);
  }
}
// 按下快門那一刻：這一間看得到的東西照前後順序（z-index）記下來
// 這一間看得到的娃娃都要入鏡（2026-11-27 使用者說朋友帶來過夜的玩偶拍不到）：自己的、朋友家來過夜的客人（.gst.st-guest，穿著牠出門時的衣服）、
// 從隔壁房間來串門子的（.rv）。客人頭上的名牌、紙條不畫
function phSnapAll(R){
  return [...room.querySelectorAll('.it,.drop,.gst.st-guest,.rv,.fx-bag')].filter(e => e.offsetParent !== null)
    .map((e, i) => ({e, i, z: +getComputedStyle(e).zIndex || 0})).sort((a, b) => a.z - b.z || a.i - b.i)
    .map(({e}) => {
      const it = items.find(o => String(o.uid) === e.dataset.u), other = !it && e.dataset.pd && SPR[e.dataset.pd] ? {id: e.dataset.pd} : null;
      if (e.classList.contains('doll') && (it || other)){
        const who = it || other, D = phSnapDoll(e, R, who.id);
        if (!D) return null;
        const guest = e.classList.contains('st-guest') && !e.classList.contains('st-mine');   // st-mine：去朋友家時看到自己在他家過夜的那一隻，是自己的娃娃
        return {D, who, guest, pn: e.dataset.pn, pu: e.dataset.pu};
      }
      const svg = e.querySelector('svg'); if (!svg) return null;
      return {svg, b: boxIn(svg, R), name: it ? it.id : e.classList.contains('fx-bag') ? 'fx-bag' : 'drop'};
    }).filter(Boolean);
}

/* ---------- 拍一張 ---------- */
// 合照上的字用 js/cvfont.js（跟娃娃機、明信片存照片同一套）：畫之前 cvFonts 先載好，一行沒載好就整行用系統字。
async function photoShoot(){
  const R = room.getBoundingClientRect(), W = R.width, H = R.height;
  if (!W || !H) return null;
  // 照片是 3:4：房間比較寬就切兩邊，比較長就切上下（上面少切一點，留住窗戶）
  let cw = W, ch = H, cx = 0, cy = 0;
  if (W / H > .75){ cw = H * .75; cx = (W - cw) / 2; } else { ch = W / .75; cy = (H - ch) * .4; }
  const s = PH.pw / cw;
  const c = document.createElement('canvas'); c.width = PH.W; c.height = PH.H;
  const ctx = c.getContext('2d');
  photoBad = [];
  let dirty = '';
  const chk = name => { if (!dirty && !photoClean(c)){ dirty = name; photoNote('畫完' + name + '之後'); } };
  const shot = phSnapAll(R);   // 按下快門那一刻（一定要在第一個 await 之前）
  await cvFonts(['z'], 'head');   // 睡覺的 z 也是源泉圓體；一樣最多等 3 秒

  // 白邊
  ctx.fillStyle = '#fffdf8'; ctx.fillRect(0, 0, PH.W, PH.H);
  ctx.save();
  ctx.beginPath(); ctx.rect(PH.pad, PH.pad, PH.pw, PH.ph); ctx.clip();
  ctx.setTransform(s, 0, 0, s, PH.pad - cx * s, PH.pad - cy * s);

  const r = cur(), wh = WALL * H, night = isNight();
  const trip = typeof tripBg === 'function' ? tripBg() : null;   // 出遊背景（js/trip.js）：只畫背景和娃娃
  if (trip) trip.paint(ctx, W, H, wh);
  else {
    await paintWall(ctx, s, W, wh, r.wall); chk('牆');
    ctx.fillStyle = window.PAPER ? window.PAPER.tone().wood2 : '#fff'; ctx.fillRect(0, wh - 4, W, 7);   // 牆腳的白條（新風格 js/paper.js 是一條木色的紙）
    paintFloor(ctx, s, W, H, wh, r.floor); chk('地板');
    const winEl = $('#win svg');
    if (winEl){ const b = boxIn(winEl, R), im = await svgImg(winEl, b.w * s, b.h * s, 'win'); if (im) ctx.drawImage(im, b.x, b.y, b.w, b.h); chk('窗戶'); }
    // 房間固定的構造（門、磁磚、流理台、通往隔壁的門口…，js/rooms.js 的 .fx）：照片要跟畫面一樣
    // 門口上的箭頭和隔壁那一間的圖示是按鈕（class ph-no）：拍照時先藏起來，門本身留著
    // 背包（js/travel.js）掛在牆上、圖層在家具和娃娃上面：不在這裡畫，放到下面照 z-index 的那一段
    for (const fx of room.querySelectorAll('.fx:not(.fx-bag) svg')){
      const hid = [...fx.querySelectorAll('.ph-no')]; hid.forEach(e => e.setAttribute('display', 'none'));
      try { const b = boxIn(fx, R), im = await svgImg(fx, b.w * s, b.h * s); if (im) ctx.drawImage(im, b.x, b.y, b.w, b.h); }
      finally { hid.forEach(e => e.removeAttribute('display')); }
      chk(photoElName(fx));
    }
  }

  // 家具、娃娃、地上的小東西：照按下快門那一刻記下的前後順序畫
  await phSpinReady();
  const inShot = new Set(), guests = [];
  for (const o of shot){
    if (o.D){
      drawDoll(ctx, o.D); chk('娃娃 ' + o.who.id);
      const b = o.D.eb;
      if (b.x + b.w * .5 > cx && b.x + b.w * .5 < cx + cw && b.y + b.h * .5 > cy && b.y + b.h * .5 < cy + ch){
        if (o.guest) guests.push({d: o.who.id, n: o.pn || '朋友', u: o.pu || ''}); else inShot.add(o.who.id);
      }
    } else {
      if (trip) continue;   // 出遊：家具和地上的東西不畫
      const b = o.b, im = await svgImg(o.svg, b.w * s, b.h * s);
      if (im) ctx.drawImage(im, b.x, b.y, b.w, b.h);
      chk(o.name);
    }
  }

  // 關燈：跟畫面一樣蓋一層暗色，有檯燈的話再把光畫上去
  if (room.classList.contains('off') && !trip){
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
  const up = guests.length ? 12 : 0;   // 有朋友家的娃娃入鏡時下面多一行，上面兩行往上讓一點
  const by = PH.pad + PH.ph, font = (w, z, t) => `${w} ${z}px ${cvFam(t, 'head')}`;
  const d = new Date();
  const place = `${trip ? trip.name : ROOM_NAME[roomId] || ''}・${d.getMonth() + 1}月${d.getDate()}日`;
  const quip = inShot.has('piggy') ? PIGGY_QUIPS[Math.floor(Math.random() * PIGGY_QUIPS.length)] : '';
  const gline = guests.length ? '和' + guests.slice(0, 2).map(g => `${g.n}家的${DOLL_NAME[g.d]}`).join('、') + (guests.length > 2 ? `和另外 ${guests.length - 2} 隻` : '') : '';
  await cvFonts(['薯餅的小窩', place, `「${quip}」`, '火腿', gline]);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const pt = window.PAPER ? window.PAPER.tone() : null;   // 新風格（js/paper.js）：標題用主色深一階、小字用墨色
  ctx.fillStyle = pt ? pt.a1d : '#e14f93'; ctx.font = font(900, 42, '薯餅的小窩'); ctx.fillText('薯餅的小窩', PH.pad + 6, by + 66 - up);
  ctx.fillStyle = pt ? '#5a5c78' : '#a8708c'; ctx.font = font(800, 26, place); ctx.fillText(place, PH.pad + 8, by + 110 - up);
  if (quip){
    ctx.save(); ctx.translate(PH.W - PH.pad - 8, by + 78); ctx.rotate(-3 * Math.PI / 180);
    ctx.textAlign = 'right'; ctx.fillStyle = pt ? '#23264a' : '#6b2d4a'; ctx.font = font(900, 30, `「${quip}」`); ctx.fillText(`「${quip}」`, 0, 0);
    ctx.fillStyle = pt ? '#5a5c78' : '#a8708c'; ctx.font = font(800, 22, '火腿'); ctx.fillText('火腿', -10, 38);
    ctx.restore();
  }
  // 有朋友家的娃娃入鏡：白邊多一行小字
  if (guests.length){ ctx.textAlign = 'left'; ctx.fillStyle = pt ? '#5a5c78' : '#a8708c'; ctx.font = font(800, 22, gline); ctx.fillText(gline, PH.pad + 8, by + 131, 560); }
  chk('字');
  return {canvas: c, dolls: [...inShot], guests, skipped: photoBad.slice(), dirty};
}

/* 相簿：一起拍了照 */
// S.album.photos = {娃娃:['日期' 或 '日期|朋友的名字|朋友家的哪一隻']}（一隻留 12 筆）
function photoRecord(dolls, guests){
  const a = S.album, t = todayStr(), gs = guests || [];
  a.photos = a.photos || {};
  dolls.forEach(d => {
    const l = a.photos[d] = a.photos[d] || [];
    // 有朋友家的娃娃一起入鏡：記「和○○家的□□一起拍了照」（同一天同一位只記一次）；沒有就照舊只記日期
    const rows = gs.length ? gs.map(g => `${t}|${g.n}|${g.d}`) : [t];
    rows.forEach(r => { if (!l.includes(r)){ if (gs.length){ const k = l.indexOf(t); if (k >= 0) l.splice(k, 1); } l.push(r); } });
    if (l.length > 12) l.splice(0, l.length - 12);
  });
  // 兩個人的紀念冊也記一筆（js/memo.js）
  if (typeof memoAdd === 'function') gs.forEach(g => { if (g.u) memoAdd('photoWith', g.u, g.n, {id: 'pw' + t + g.u + g.d, d: g.d}); });
  save();
}
function photoRows(d){
  const l = ((S.album.photos || {})[d]) || [];
  if (!l.length) return '';
  return `<div class="al-sec">一起拍的照</div><ul class="al-ln al-ph-ln">${l.slice().reverse().map(t => { const [day, n, gd] = String(t).split('|'), [, m, dd] = day.split('-'); return `<li>${+m}月${+dd}日${n && DOLL_NAME[gd] ? `和${txSlot(n)}家的${DOLL_NAME[gd]}` : ''}一起拍了照</li>`; }).join('')}</ul>`;
}

/* ---------- 按鈕、閃光、預覽 ---------- */
function photoFlash(){
  if (REDUCE) return;
  const f = document.createElement('div'); f.className = 'flash';
  stage.appendChild(f); setTimeout(() => f.remove(), 450);
}
// pre：檔名中間多一段，例如「明信片-山上的小木屋」（js/travel.js）；沒給就照舊
const photoName = pre => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `薯餅的小窩-${pre ? String(pre).replace(/[\\/:*?"<>|\s]+/g, '') + '-' : ''}${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`; };
/* 存照片。iPhone 的規矩：分享（navigator.share）一定要在手指按下去的當下叫，中間不能等任何東西，不然會被擋。
   所以檔案在照片拍好、預覽出來的時候就先做好（photoFile），按「存下來」時直接叫分享。
   分享不能用或失敗（不是自己取消）：不走下載連結（iPhone 從主畫面圖示開的時候，下載連結按了沒反應），
   改成請使用者長按照片存，iPhone 長按圖片一定存得了。電腦照舊直接下載。真的分享出去了才說好了。 */
async function photoFile(shot){
  if (shot.file !== undefined) return shot.file;
  let blob = null;
  try { blob = await new Promise(ok => { try { shot.canvas.toBlob(ok, 'image/png'); } catch (e) { ok(null); } }); } catch (e) {}
  shot.file = blob ? new File([blob], photoName(shot.name), {type: 'image/png'}) : null;
  return shot.file;
}
function photoHold(o, why){
  const card = o && o.querySelector('.phcard'); if (!card){ toast('長按照片就可以存'); return; }
  card.classList.add('hold');
  let p = card.querySelector('.ph-hold');
  if (!p){ p = document.createElement('p'); p.className = 'ph-hold'; card.querySelector('.phimg').after(p); }
  p.textContent = '長按上面這張照片，選「加入照片」或「儲存影像」，就存到手機了。';
  if (why) console.info('[photo] 分享沒成功，改用長按存', why);
}
// 不能是 async：前面一等，iPhone 就不給分享了
function photoSave(shot, o){
  const file = shot.file, touch = matchMedia('(pointer: coarse)').matches;
  if (touch){
    let can = false;
    try { can = !!(file && navigator.share && navigator.canShare && navigator.canShare({files: [file]})); } catch (e) {}
    if (!can){ photoHold(o, file ? '這台不能分享檔案' : '檔案沒做出來'); return; }
    navigator.share({files: [file], title: '薯餅的小窩'}).then(() => toast('好了')).catch(e => { if (e && e.name === 'AbortError') return; photoHold(o, e); });
    return;
  }
  if (!file){ toast('這台存不了照片'); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('照片存好了');
}
// 拍好的照片：預覽、存下來、再拍一張、寄給朋友。opt.again／opt.snap 沒給就沒有那兩顆（看明信片時存成圖片也用這個）
async function photoPreview(shot, opt = {}){
  let url = '', why = '';
  try { url = shot.canvas.toDataURL('image/png'); } catch (e) { why = String((e && e.message) || e); }
  if (!url){
    // 暫時把原因寫在提示裡，方便截圖回報：哪一樣畫上去之後開始讀不回來，或瀏覽器給的錯誤
    toast('拍不了：' + ((shot.skipped && shot.skipped.length ? shot.skipped.join('、') : why) || '不知道原因').slice(0, 60));
    console.info('[photo] 畫布讀不回來', shot.skipped, why);
    return null;
  }
  await photoFile(shot);
  const old = screen.querySelector('.over.phov'); if (old) old.remove();
  const o = document.createElement('div'); o.className = 'over phov';
  o.innerHTML = `<div class="pcard phcard" role="dialog" aria-label="拍好的照片">
      <img class="phimg" alt="拍好的照片" src="${url}">
      ${opt.again && typeof tripRow === 'function' ? tripRow() : ''}
      <div class="row"><button class="btn y ph-save">存下來</button>${opt.again ? '<button class="btn ph-again">再拍一張</button>' : ''}${opt.snap ? '<button class="btn ph-card">寄給朋友</button>' : ''}</div>
      <button class="ph-x" aria-label="關閉"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button></div>`;
  screen.appendChild(o);
  o.addEventListener('click', e => { if (e.target === o) o.remove(); });
  o.querySelector('.ph-x').onclick = () => o.remove();
  o.querySelector('.ph-save').onclick = () => photoSave(shot, o);
  if (opt.again){ if (typeof tripWire === 'function') tripWire(o); o.querySelector('.ph-again').onclick = () => { o.remove(); setTimeout(photoTake, 120); }; }
  if (opt.snap) o.querySelector('.ph-card').onclick = () => { o.remove(); cardCompose(opt.snap); };
  o.querySelector('.ph-save').focus({preventScroll: true});
  if (shot.skipped && shot.skipped.length) toast('有 ' + shot.skipped.length + ' 樣沒拍進去：' + shot.skipped.join('、').slice(0, 40));
  return o;
}
let photoBusy = false;
async function photoTake(){
  if (photoBusy || VISIT) return;
  photoBusy = true;
  $('#sheet').hidden = true;
  photoFlash();
  let shot = null, err = '';
  try { shot = await photoShoot(); } catch (e) { console.info('[photo] 沒拍成', e); err = String((e && e.message) || e); }
  photoBusy = false;
  if (!shot){ toast(err ? '沒拍成：' + err.slice(0, 60) : '沒拍成，再試一次'); return; }
  const snap = typeof cardSnap === 'function' && typeof sNet === 'function' && sNet() && !(typeof tripBg === 'function' && tripBg()) ? cardSnap() : null;   // 寄明信片用（js/card.js）
  if (await photoPreview(shot, {again: true, snap})) photoRecord(shot.dolls, shot.guests);
}

(function(){
  const b = document.createElement('button');
  b.className = 'cam'; b.id = 'camBtn'; b.setAttribute('aria-label', '拍照'); b.innerHTML = CAM_ICON;
  b.addEventListener('click', photoTake);
  room.appendChild(b);
})();
