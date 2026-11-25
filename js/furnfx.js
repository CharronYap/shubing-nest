/* 家具第一批的動作和獎品（家具本身在 js/furn2.js）
   - 專屬家具的特別反應：那隻娃娃坐上自己的家具，就做牠自己的動作（css 的 .sp-家具）。別隻坐上去是一般坐姿。
   - 湊齊一個系列送獎品（setCheck）：夾到、買到、打開小窩時各看一次。 */
function furnSpecial(){
  room.querySelectorAll('.doll').forEach(el => {
    const it = items.find(i => String(i.uid) === el.dataset.u);
    let cls = '';
    if (it && it.sit){ const f = items.find(o => o.uid === it.sit); if (f && FURN[f.id] && FURN[f.id].own === it.id) cls = 'sp-' + f.id; }
    [...el.classList].forEach(c => { if (c.startsWith('sp-') && c !== cls) el.classList.remove(c); });
    if (cls) el.classList.add(cls);
  });
}
{
  const prev = typeof afterRoomRender === 'function' ? afterRoomRender : null;
  afterRoomRender = function(){ if (prev) prev(); furnSpecial(); };
}
function setCheck(quiet){
  let got = null;
  Object.values(FURN_SERIES).forEach(s => {
    if (!s.gift || !s.ids.every(id => FURN_OWN[id])) return;
    const own = s.gift.kind === 'furn' ? FURN_OWN : s.gift.kind === 'wall' ? WALL_OWN : FLOOR_OWN;
    if (own[s.gift.id]) return;
    own[s.gift.id] = 1; got = s;
  });
  if (got){ save(); if (!VISIT) renderTray(); if (!quiet) setTimeout(() => toast(`湊齊${got.name}，送你${got.gift.name}`), 600); }
  return !!got;
}
setCheck(true);
