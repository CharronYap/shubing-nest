/* 娃娃相簿：一隻娃娃一頁。記下牠哪天來、說過哪些話、一起做完哪些小事
   S.album = {met:{娃娃:'日期'}, heard:{娃娃:位元（第 i 句聽過就是 1<<i）}, cards:{小事 id:'日期'}, dreams:{娃娃:位元}} */
const ALB_ICON = '<svg viewBox="0 0 24 24"><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v14H6.5A1.5 1.5 0 0 0 5 19.5z" fill="currentColor"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 14s-3.2-1.9-3.2-4c0-1 .8-1.8 1.7-1.8.6 0 1.1.3 1.5.8.4-.5.9-.8 1.5-.8.9 0 1.7.8 1.7 1.8 0 2.1-3.2 4-3.2 4z" fill="#fff"/></svg>';

/* 舊存檔沒有相簿：已經有的娃娃算在開始玩的那天來的 */
function albumInit(){
  const a = S.album = S.album || {};
  a.met = a.met || {}; a.heard = a.heard || {}; a.cards = a.cards || {};
  const first = Object.values(a.met).sort()[0] || S.lastDaily || todayStr();
  let changed = false;
  DOLLS.forEach(d => { if (DOLL_N[d] && !a.met[d]){ a.met[d] = first; changed = true; } });
  // 舊存檔今天已經做完的小事也收進來
  if (S.day.date === todayStr()) S.day.done.forEach(id => { if (!a.cards[id]){ a.cards[id] = S.day.date; changed = true; } });
  if (changed) save();
}
function albumMet(d){ if (!S.album.met[d]) S.album.met[d] = todayStr(); }
function albumHear(d, i){ S.album.heard[d] = (S.album.heard[d] || 0) | (1 << i); save(); }
function albumCard(id){ if (!S.album.cards[id]) S.album.cards[id] = todayStr(); }

/* 做過的夢：晚上點睡著的娃娃看到的（away.js）。一個都還沒看過就先不出現 */
const dreamSeen = d => DREAMS[d].filter((_, i) => ((S.album.dreams || {})[d] || 0) & (1 << i)).length;
function dreamRows(d){
  const bits = (S.album.dreams || {})[d] || 0;
  if (!bits) return '';
  return `<div class="al-sec">做過的夢</div><ul class="al-ln al-dr">${DREAMS[d].map((l, i) => bits & (1 << i) ? `<li>${l}</li>` : '<li class="no" aria-label="還沒看過">……</li>').join('')}</ul>`;
}
const md = s => { const [, m, d] = s.split('-'); return `${+m}月${+d}日`; };
let alOpen = false, alCur = 'sloth';
function albumPage(d){
  const a = S.album;
  if (!a.met[d]) return `<div class="al-no"><img src="${SPR[d]}" alt=""><p>娃娃機夾得到</p>${typeof wantBtn === 'function' ? wantBtn(d) : ''}</div>`;
  const lines = LINES[d], bits = a.heard[d] || 0;
  const heard = lines.filter((_, i) => bits & (1 << i)).length;
  const evs = EVENTS.filter(e => e.d.includes(d) && (!e.when || a.cards[e.id]));   // 節日的小事做過才算
  const done = evs.filter(e => a.cards[e.id]).sort((x, y) => a.cards[x.id] < a.cards[y.id] ? -1 : 1);
  return `<div class="al-top"><span class="al-ph">${dollPic(d)}</span>
      <div><b class="al-nm">${DOLL_NAME[d]}</b><div class="al-tr">${DOLL_TRAIT[d].map(t => `<span>${t}</span>`).join('')}</div><small>${md(a.met[d])}來到小窩</small><button class="btn al-dress" data-wd="${d}">換衣服</button></div></div>
    <div class="al-sec">說過的話</div>
    <ul class="al-ln">${lines.map((l, i) => bits & (1 << i) ? `<li>${l}</li>` : '<li class="no" aria-label="還沒聽過">……</li>').join('')}</ul>
    <div class="al-sec">回憶</div>
    ${done.length ? done.map(e => `<div class="al-cd"><span class="fa">${e.d.map(x => `<img src="${SPR[x]}" alt="">`).join('')}</span><p>${e.end}</p><small>${md(a.cards[e.id])}</small></div>`).join('')
      : '<p class="al-em">每天的小事做完，會留在這裡。</p>'}
    ${typeof palRows === 'function' ? palRows(d) : ''}
    ${dreamRows(d)}
    ${typeof giftRows === 'function' ? giftRows(d) : ''}
    ${typeof photoRows === 'function' ? photoRows(d) : ''}
    ${typeof yardRows === 'function' ? yardRows(d) : ''}
    ${typeof stayRows === 'function' ? stayRows(d) : ''}
    ${typeof mailRows === 'function' ? mailRows(d) : ''}
    <div class="al-ft">說過的話 ${heard}/${lines.length}・回憶 ${done.length}/${evs.length}${dreamSeen(d) ? `・夢 ${dreamSeen(d)}/${DREAMS[d].length}` : ''}</div>`;
}
function openAlbum(d){
  if (d) alCur = d;
  const met = DOLLS.filter(x => S.album.met[x]).length;
  const tabs = DOLLS.map(x => {
    const m = !!S.album.met[x];
    return `<button class="${x === alCur ? 'on' : ''} ${m ? '' : 'no'}" data-al="${x}" aria-label="${m ? DOLL_NAME[x] : '還沒來的娃娃'}" aria-pressed="${x === alCur}"><img src="${SPR[x]}" alt=""></button>`;
  }).join('');
  openSheet(`<div class="hd">${ALB_ICON}<span>${met} / ${DOLLS.length}</span></div>
    <div class="al-tabs">${tabs}</div><div class="al-pg">${albumPage(alCur)}</div>`);
  evOpen = false; alOpen = true;
}
$('#albBtn').addEventListener('click', () => {
  if (alOpen && !$('#sheet').hidden){ $('#sheet').hidden = true; alOpen = false; return; }
  openAlbum();
});
$('#evBtn').addEventListener('click', () => { alOpen = false; });
$('#sheet').addEventListener('click', e => {
  if (e.target.closest('.x')){ alOpen = false; return; }
  const b = e.target.closest('[data-al]'); if (b) openAlbum(b.dataset.al);
});
// 左右滑換一頁
let alX = null;
$('#sheet').addEventListener('pointerdown', e => { alX = alOpen && e.target.closest('.al-pg') ? e.clientX : null; });
$('#sheet').addEventListener('pointerup', e => {
  if (alX === null) return;
  const dx = e.clientX - alX; alX = null;
  if (Math.abs(dx) < 50) return;
  const i = DOLLS.indexOf(alCur), n = DOLLS.length;
  openAlbum(DOLLS[(i + (dx < 0 ? 1 : n - 1)) % n]);
});

albumInit();
