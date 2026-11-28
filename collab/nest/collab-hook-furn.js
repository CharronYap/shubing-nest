/* 聯名家具接進小窩（草稿，Claude B，2026-11-28）。目前沒有被小窩載入，只給測試用。
   放的位置：index.html 的 NEST_JS 裡 'furn4' 後面接 'collab-moon'、'collab-hook-furn'（要在 'paper' 前面：
   js/paper.js 載入的時候把當下 FURN 裡的家具轉成新風格，排在後面的不會轉）。
   只把家具放進 FURN 和收納架（ROOM_FURN）；家具都有 gift: 1，娃娃機、小店都不會出現。怎麼拿到另外接。 */
(function () {
  if (typeof FURN === 'undefined' || typeof EGM_FURN === 'undefined') return;
  Object.keys(EGM_FURN).forEach(id => {
    if (FURN[id]) { console.warn('[collab] 家具 id 已經有了，跳過', id); return; }
    FURN[id] = EGM_FURN[id];
    const l = ROOM_FURN[FURN[id].room] = ROOM_FURN[FURN[id].room] || [];
    if (!l.includes(id)) l.push(id);
  });
})();
