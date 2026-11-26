/* 上面的按鈕版面（2026-11-26 使用者指定的排法，所有人的預設）
   第一排（最上面那條）：左 回封面｜中 地圖鈕（現在這間的圖示和名字，左右各一個箭頭）｜右 幣、相機
   第二排（浮在房間上方）：左 娃娃機、小店（一組）｜右 信箱、訪客簿、今天的小事（一組）
   第三排：左 相簿｜右 音樂
   - 地圖鈕：點中間開小屋地圖（js/rooms.js），點箭頭換到上一間、下一間（照房間的順序，小島排最後，頭尾相接）。
     原本那排要左右捲的房間圖示拿掉了：電腦上用滑鼠拖不動。換房間靠箭頭、小屋地圖、房間兩邊的門口，都不用橫向捲。
   - 同一組的按鈕包在同一個膠囊形的底裡；紅點和數字照舊在各自那顆上。
   - 娃娃機那一頁：回房間的鈕、幣、音樂的位置跟房間頁一樣；小店、信箱、訪客簿、相簿、相機、地圖鈕在那一頁藏起來。
   - 回封面：不登出、不清東西，只是回到封面，再按開始回到剛剛那一間。
   做法：按鈕還是原本各個檔案做出來的那幾顆（事件都在上面），這裡只是把它們搬進新的容器裡。 */
// 以前的版面調整模式（?layout=1）已經整個拿掉，沒有任何地方再讀它的設定；這台裝置如果還留著舊設定，順手清掉
try { localStorage.removeItem('shubingNest.layout'); } catch (e) {}
const HUD_HOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.500L12 4.500l8 7"/><path d="M6.500 10.500V19.500h11V10.500"/><path d="M10 19.500v-5h4v5"/></svg>';
(function(){
  const top = $('.top'), topr = top.querySelector('.topr');
  const mk = (tag, cls, html) => { const e = document.createElement(tag); e.className = cls; if (html) e.innerHTML = html; return e; };
  // 第一排：回封面｜#nav（地圖鈕）｜保底點（娃娃機那頁）｜幣、相機
  const homeB = mk('button', 'ib w sm', HUD_HOME); homeB.id = 'homeBtn'; homeB.setAttribute('aria-label', '回封面');
  homeB.addEventListener('click', () => {
    const cv = $('#cover'); if (!cv) return;
    $('#sheet').hidden = true;
    cv.classList.remove('cv-out'); cv.hidden = false;
  });
  top.insertBefore(homeB, top.firstChild);
  const cam = $('#camBtn'); if (cam) topr.appendChild(cam);
  // 第二、三排：緊接在第一排下面。房間頁是浮在房間上方（不佔位置），娃娃機那頁佔位置（娃娃機會自己縮小）
  const wrap = mk('div', 'hudwrap'), hud = mk('div', 'hud'); hud.id = 'hud';
  const r2 = mk('div', 'hud-row'), r3 = mk('div', 'hud-row');
  const gL = mk('div', 'hud-g hud-l'), gR = mk('div', 'hud-g hud-r'), aL = mk('div', 'hud-g hud-a'), aR = mk('div', 'hud-g hud-m');
  [['#swap', gL], ['#shopBtn', gL], ['#mailBtn', gR], ['#bookBtn', gR], ['#evBtn', gR], ['#albBtn', aL], ['#musicBtn', aR]].forEach(([sel, box]) => { const e = $(sel); if (e) box.appendChild(e); });
  r2.append(gL, gR); r3.append(aL, aR); hud.append(r2, r3); wrap.appendChild(hud);
  top.parentNode.insertBefore(wrap, top.nextSibling);
})();
// 地圖鈕：‹ 現在這間 ›。箭頭帶 data-r（js/room.js 原本的點擊處理會換房間），中間是 .rmap（js/rooms.js 開小屋地圖）
renderNav = function(cur){
  const list = VISIT && !VISIT.yard ? RIDS.slice() : [...RIDS, 'yard'];
  const r = cur || (typeof yardOn !== 'undefined' && yardOn ? 'yard' : (goingTo ?? roomId));
  const i = Math.max(0, list.indexOf(r)), prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
  const name = ROOM_LABEL[r] || '';
  $('#nav').innerHTML = `<div class="mapc">
    <button class="mc-a" data-r="${prev}" aria-label="上一間：${ROOM_LABEL[prev]}">‹</button>
    <button class="mc-m rmap" aria-label="小屋地圖，現在在${name}">${ICON[r] || ''}<span class="nm">${name}</span></button>
    <button class="mc-a" data-r="${next}" aria-label="下一間：${ROOM_LABEL[next]}">›</button></div>`;
};
renderNavTo = function(r){ renderNav(r); };
// 在哪一頁（房間／娃娃機）記在畫面上，css 才知道哪幾顆要藏
{
  const prev = setPage;
  setPage = function(p){ prev(p); screen.classList.toggle('pg-claw', p === 'claw'); };
  screen.classList.toggle('pg-claw', typeof page !== 'undefined' && page === 'claw');
}
renderNav();
