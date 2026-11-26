/* 娃娃不要被家具擋住（2026-11-26）
   房間是前後疊的：位置比較前面（y 比較大）的家具會蓋住後面的娃娃。使用者回報「我的玩偶很常被家具擋住」。
   1. 坐在家具上的娃娃本來就畫在那件家具上面（js/room.js 的 zOf、js/roam.js 的 roamApply），這裡不用改。
   2. 娃娃自己動的時候，落點如果有超過四分之一被前面的家具蓋住，就換一個看得到的點（路過不管，只管停下來的地方）。
   3. 已經停在被擋住的地方的（家具後來才擺上去、玩家把牠拖到家具後面放開）：過兩三秒自己跳到前面或旁邊。
      玩家擺的「家」不改（存檔不動），只是牠站的位置蓋過去；家如果是被擋住的，牠晃完就不回那個位置了。
   4. 例外：龍龍「躲在家具後面」的小動作（躲 7 秒就出來）、躲貓貓躲起來的那隻（js/hide.js，本來就不在會動的名單裡）。
   5. 來串門子的、來過夜的客人娃娃也一樣：出現的位置被擋住就挪到看得到的地方（只挪畫面，不改雲端上的位置）。
   「讓娃娃自己玩」關掉的時候不挪：那時候娃娃要乖乖待在玩家擺的位置。
   放在 roam.js、roam2.js、skit.js、spin.js、hide.js 後面載入。 */
const SEEN_MAX = .25, SEEN_HIDE_MS = 7000;
// 娃娃的圖四邊有一點透明的邊，家具也是：算的時候各往內縮一點，不然會太保守
function seenBox(id, x, y){
  const [w, h] = sizeOf({kind: 'doll', id, x, y, sit: null}), by = roomY(y);
  return [x - w * .38, by - h * .9, x + w * .38, by - h * .04];
}
// 站在 (x, y) 的話，有多少比例被前面的家具蓋住（0～1）
function seenCover(id, x, y, list){
  const b = seenBox(id, x, y), area = (b[2] - b[0]) * (b[3] - b[1]), z = 20 + Math.round(y * 3) + 1;
  let cov = 0;
  (list || items).forEach(f => {
    if (f.kind !== 'furn') return;
    const F = FURN[f.id]; if (!F || F.floor || F.wall) return;
    if (20 + Math.round(f.y * 3) <= z) return;            // 家具在牠後面（或一樣前後）：蓋不到
    const [fw, fh] = sizeOf(f), fy = roomY(f.y), r = [f.x - fw * .46, fy - fh * .94, f.x + fw * .46, fy];
    const ox = Math.min(b[2], r[2]) - Math.max(b[0], r[0]), oy = Math.min(b[3], r[3]) - Math.max(b[1], r[1]);
    if (ox > 0 && oy > 0) cov += ox * oy;
  });
  return area > 0 ? Math.min(1, cov / area) : 0;
}
const seenHidden = (id, x, y, list) => seenCover(id, x, y, list) > SEEN_MAX;
// 離 (x, y) 最近、看得到的點。找不到回傳 null
function seenSpot(id, x, y, list){
  const cand = [];
  for (const dy of [0, 3, 6, 9, 13, 17, 22, 28, -3, -6, -10]) for (const dx of [0, -6, 6, -12, 12, -19, 19, -27, 27, -36, 36, -46, 46]){
    const nx = Math.max(10, Math.min(90, x + dx)), ny = Math.max(58, Math.min(95, y + dy));
    cand.push([nx, ny, Math.hypot(nx - x, (ny - y) * 1.4) + (dy < 0 ? 4 : 0)]);
  }
  cand.sort((a, b) => a[2] - b[2]);
  for (const [nx, ny] of cand) if (!seenHidden(id, nx, ny, list)) return [nx, ny];
  return null;
}

/* ---------- 選落點：被擋住就換一個點 ---------- */
// roamFree（js/roam.js）：去坐家具、龍龍去躲的時候是故意靠著家具的，不換
{ const prev = roamHopTo; roamHopTo = function(it, tx, ty, done){
    try {
      if (!roamFree && seenHidden(it.id, tx, ty)){ const p = seenSpot(it.id, tx, ty); if (p){ tx = p[0]; ty = p[1]; } }
    } catch (e) { console.info('[seen]', e); }
    return prev(it, tx, ty, done);
  }; }

/* ---------- 已經停在被擋住的地方：自己跳出來 ---------- */
function seenTick(){
  if (!roamOn || VISIT && VISIT.card || roamPaused()) return;
  const now = Date.now();
  for (const it of roamDolls()){
    const st = RS[it.uid];
    if (st && st.busy) continue;
    if (st && st.hid){ if (now - st.hid < SEEN_HIDE_MS) continue; delete st.hid; }     // 龍龍躲夠久了
    if ((st && st.sit !== null) || (!(st && roamAway(st)) && it.sit)) continue;          // 坐著的畫在家具上面，不會被擋
    const [x, y] = roamPos(it);
    if (!seenHidden(it.id, x, y)) continue;
    const p = seenSpot(it.id, x, y); if (!p) continue;
    if (REDUCE){ const s = roamSt(it); s.sit = null; s.x = p[0]; s.y = p[1]; roamApply(it, elFor(it)); }
    else roamHopTo(it, p[0], p[1]);
    return;      // 一次只挪一隻
  }
}
setInterval(() => { if (!document.hidden) try { seenTick(); } catch (e) { console.info('[seen]', e); } }, 2500);

/* ---------- 客人：來串門子的、來過夜的 ---------- */
if (typeof rvPlace === 'function'){ const prev = rvPlace; rvPlace = function(el, v){
    try { if (seenHidden(v.id, v.x, v.y)){ const p = seenSpot(v.id, v.x, v.y); if (p){ v.x = p[0]; v.y = p[1]; } } } catch (e) {}
    return prev(el, v);
  }; }
if (typeof stayPaint === 'function'){ const prev = stayPaint; stayPaint = function(){
    prev();
    try {
      if (VISIT || roomId !== 'living' || typeof stGuests === 'undefined') return;
      const els = room.querySelectorAll('.gst.st-guest');
      stGuests.forEach((g, i) => {
        const el = els[i]; if (!el) return;
        const x = Math.max(8, Math.min(92, +g.x || 50)), y = Math.max(56, Math.min(98, +g.y || 85));
        if (!seenHidden(g.doll, x, y)) return;
        const p = seenSpot(g.doll, x, y); if (!p) return;
        const it = {kind: 'doll', id: g.doll, x: p[0], y: p[1]};
        el.style.left = p[0] + '%'; el.style.top = roomY(p[1]) + '%'; el.style.width = sizeOf(it)[0] + '%'; el.style.zIndex = 20 + Math.round(p[1] * 3) + 1;
      });
    } catch (e) { console.info('[seen]', e); }
  }; }
