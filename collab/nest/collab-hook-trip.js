/* 聯名旅行地點接進小窩（草稿，Claude B，2026-11-28）。目前沒有被小窩載入，只給測試用。
   放的位置：index.html 的 NEST_JS 裡 'abroad' 後面（要在 'claw'、'main' 前面：main 一載入就畫房間，那時候土產要已經在 FURN 裡）。
   照 js/abroad.js 最後那段的寫法放進 TV_PLACES / TV_CARDS / TV_LINES / TV_DUO / TV_SOUV / FURN。
   ★ 這裡先用 tier 4（跟出國一樣要機票、兩三天回來）只是為了測試能跑；正式要不要另開「蛋蛋島」分類、用什麼票，
     是 Claude A 的旅行系統要決定的（交接紀錄 H-03）。回家日記 diary 和土產回憶 memo 需要 js/travel.js 讀，現在只放在 TV_EGG。 */
(function () {
  if (typeof TV_PLACES === 'undefined' || typeof EGM_TRIP === 'undefined') return;
  window.TV_EGG = window.TV_EGG || {};
  Object.keys(EGM_TRIP).forEach(p => {
    if (TV_PLACES[p]) { console.warn('[collab] 旅行地點已經有了，跳過', p); return; }
    const a = EGM_TRIP[p];
    TV_PLACES[p] = {name: a.name, short: a.short, country: a.country, city: a.city, stamp: a.stamp, tier: 4, abroad: 1, collab: a.collab, fav: a.fav, sv: Object.keys(a.sv), dir: `坐船去${a.country}`};
    TV_CARDS[p] = a.cards; TV_LINES[p] = a.lines; TV_DUO[p] = a.duo;
    window.TV_EGG[p] = {diary: a.diary, memo: a.memo};
    Object.keys(a.sv).forEach(k => {
      if (TV_SOUV[k]) { console.warn('[collab] 土產 id 已經有了，跳過', k); return; }
      const s = a.sv[k];
      TV_SOUV[k] = {name: s.name, unit: s.unit || '一個', from: p, vb: s.vb, w: s.w, svg: s.svg};
      FURN[tvSouvId(k)] = {room: 'tv', name: s.name, gift: 1, souv: 1, collab: a.collab, vb: s.vb, w: s.w, svg: s.svg};
    });
  });
})();
