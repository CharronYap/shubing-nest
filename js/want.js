/* 願望清單（第五版）：相簿裡還沒來的娃娃，可以點星星放進願望清單，最多 3 隻。
   - 朋友來家裡時，下面那條有一塊小木牌「想要：○○、○○」。
   - 朋友剛好同一隻有兩隻以上，木牌旁邊出現「送牠過去」，按了回自己家、直接走送娃娃（js/nestgift.js）。
   - 夾到或收到之後自動從清單拿掉。這版只放娃娃。
   不懲罰、不催人：清單放多久都可以，沒有人送也不會怎樣。
   存檔：S.album.want = [娃娃]；公開資料 nestRooms/{自己}.want（存檔裡的 wish 是點心和泡泡球，是另一件事） */
const WANT_MAX = 3;
const WANT_STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.7l-5.4 2.9 1.1-6.1L3.2 9.2l6.1-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
// 還沒有的才算：夾到、收到就不在清單裡了
function wantList(){
  const a = S.album || {};
  const l = (Array.isArray(a.want) ? a.want : []).filter((d, i, arr) => DOLLS.includes(d) && !DOLL_N[d] && !(a.met || {})[d] && arr.indexOf(d) === i).slice(0, WANT_MAX);
  if (Array.isArray(a.want) && a.want.length !== l.length) a.want = l;
  return l;
}
// 相簿裡還沒來的那一頁
function wantBtn(d){
  const l = wantList(), on = l.includes(d), full = !on && l.length >= WANT_MAX;
  return `<button class="btn sm want-b ${on ? 'on' : ''}" data-want="${d}" aria-pressed="${on}">${WANT_STAR}<span>${on ? '在願望清單裡' : '放進願望清單'}</span></button>
    <small class="want-h">${on ? '朋友來家裡時，木牌上會寫你想要牠。再點一下拿掉。' : full ? `願望清單最多 ${WANT_MAX} 隻，先拿掉一隻再放。` : '放進去之後，朋友來家裡時看得到，有多的可以送你。'}</small>`;
}
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('[data-want]'); if (!b) return;
  const d = b.dataset.want, l = wantList();
  if (l.includes(d)) S.album.want = l.filter(x => x !== d);
  else if (l.length >= WANT_MAX){ toast(`願望清單最多 ${WANT_MAX} 隻`); return; }
  else S.album.want = [...l, d];
  save();
  openAlbum(d);
});

/* 朋友家的小木牌 */
visitExtras.push((f, more) => {
  const want = (Array.isArray(f.data.want) ? f.data.want : []).filter(d => DOLLS.includes(d)).slice(0, WANT_MAX);
  if (!want.length) return;
  const sign = document.createElement('span');
  sign.className = 'vb-want';
  sign.innerHTML = `${WANT_STAR}<span>想要：${want.map(d => DOLL_NAME[d]).join('、')}</span>`;
  more.appendChild(sign);
  const have = want.find(d => (DOLL_N[d] || 0) >= 2);
  if (!have || !sNet() || typeof ngOpenPick !== 'function') return;
  const b = document.createElement('button');
  b.className = 'btn y'; b.innerHTML = `<img src="${SPR[have]}" alt=""><span>送${DOLL_NAME[have]}過去</span>`;
  b.onclick = () => {
    const uid = f.uid;
    visitClose();
    ngPick = {doll: have, to: uid, m: null, msg: ''};
    ngOpenPick();
  };
  more.appendChild(b);
});
