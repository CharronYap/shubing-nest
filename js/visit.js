/* 去朋友家：從帳號頁的好友清單點進來（account.js 讀好朋友的公開房間 nestRooms/{uid} 再叫 visitOpen）
   - 房間照朋友擺的樣子畫，三個房間可以換著看；不能拖、不能點家具、不能開關燈，也不會存檔
   - 點娃娃冒一顆愛心
   - 下面一條：「留一顆愛心」，每個朋友一天一顆（firestore.rules 擋）。不顯示誰送的，對方只看得到今天收到幾顆
   - 「回家」回自己的房間 */
const VB_HEART = HEART('#ff6fb0', '#fff');
let visitBack = 'living';

// 朋友那份資料可能是比較新的版本：這台不認得的娃娃、家具先不畫，免得整個房間畫不出來
function visitClean(data){
  const home = {};
  RIDS.forEach(r => {
    const src = (data.home || {})[r] || {};
    const its = (Array.isArray(src.items) ? src.items : [])
      .filter(i => i && (i.kind === 'doll' ? SPR[i.id] : i.kind === 'furn' && FURN[i.id]))
      .map(i => ({...i}));
    // 坐在家具上：家具要在、而且那個位子真的存在，不然就讓牠站在原地
    its.forEach(i => {
      if (!i.sit) return;
      const f = its.find(o => o.uid === i.sit && o.kind === 'furn');
      if (!f || !(FURN[f.id].seats || [])[i.seat]) i.sit = null;
    });
    home[r] = {wall: WALLS.includes(src.wall) ? src.wall : WALLS[0], floor: FLOORS.includes(src.floor) ? src.floor : FLOORS[0], items: its, light: src.light !== false};
  });
  return {home, look: data.look && typeof data.look === 'object' ? data.look : {}};
}

function visitTap(it){
  if (it.kind !== 'doll') return;
  const el = elFor(it), b = el.querySelector('.body');
  b.classList.remove('r-heart'); void b.offsetWidth; b.classList.add('r-heart');
  setTimeout(() => b.classList.remove('r-heart'), 900);
  const [, h] = sizeOf(it);
  const hx = document.createElement('div'); hx.className = 'hfx';
  hx.style.left = it.x + '%'; hx.style.top = (roomY(it.y) - h * .8) + '%';
  hx.innerHTML = HEART(); room.appendChild(hx); setTimeout(() => hx.remove(), 1300);
}

/* f = {name, data, sent: true/false/null（查不到）, send: () => Promise} */
function visitOpen(f){
  const v = visitClean(f.data);
  if (!VISIT) visitBack = roomId;
  VISIT = {name: f.name, home: v.home, look: v.look};
  screen.classList.add('visiting');
  setPage('room');
  roomId = 'living';
  load();
  const bar = $('#vbar');
  bar.innerHTML = `<div class="vb-hd"><b></b><small>點娃娃會冒愛心</small></div>
    <div class="vb-row"><button class="btn vb-home">${HOUSE}<span>回家</span></button><button class="btn y vb-heart"></button></div>`;
  bar.querySelector('b').textContent = `${f.name}的小窩`;
  const hb = bar.querySelector('.vb-heart');
  const paint = sent => {
    hb.disabled = !!sent;
    hb.innerHTML = `${VB_HEART}<span>${sent ? '今天留過愛心了' : '留一顆愛心'}</span>`;
  };
  paint(f.sent);
  hb.onclick = async () => {
    hb.disabled = true;
    try {
      await f.send();
      paint(true);
      visitRain();
      toast(`在${f.name}家留了一顆愛心`);
    } catch (e) {
      console.info('[visit] 愛心沒送出去', e && e.code);
      hb.disabled = false;
      toast('愛心沒送出去，晚點再試');
    }
  };
  bar.querySelector('.vb-home').onclick = visitClose;
  bar.hidden = false;
}

function visitClose(){
  if (!VISIT) return;
  VISIT = null;
  screen.classList.remove('visiting');
  $('#vbar').hidden = true;
  roomId = visitBack;
  load();
  setTimeout(layout, 0);
}

// 留了愛心：房間裡飄幾顆
function visitRain(){
  if (REDUCE) return;
  for (let i = 0; i < 6; i++){
    const hx = document.createElement('div'); hx.className = 'hfx';
    hx.style.left = (20 + Math.random() * 60) + '%'; hx.style.top = (45 + Math.random() * 30) + '%';
    hx.style.animation = `hup 1.2s ease-out ${i * .12}s both`;
    hx.innerHTML = HEART(); room.appendChild(hx); setTimeout(() => hx.remove(), 2000);
  }
}
