/* 娃娃送的小禮物：做完一件小事，大約四次有一次，帶頭的那隻娃娃會送東西
   送的東西直接算進原本的 S.wish（點心盒、泡泡球）和幣，不另外存
   送過什麼記在相簿：S.album.gifts = {娃娃:[{t:'日期', s:'卡片上的字', k:'snack'|'bubble'|'coin'}, …]}，每隻留最近幾張
   ★ 2026-11-26 以前存成 [['日期', '字', 種類]]（陣列裡面又放陣列）。Firestore 不收這種形狀，
     只要有一隻娃娃送過一次小禮物，之後每一次雲端存檔都會整份失敗。現在改成一筆一個物件，舊存檔打開時自動轉。 */
const GIFT_KEEP = 8;
// 照個性送：貓咪老師送點心、彈跳豬送泡泡球、火腿給零用錢；其他隻點心或泡泡球隨機
const GIFT_BY = {nyanko:'snack', moodeng:'bubble', piggy:'coin'};
const GIFT_THING = {snack:'一盒點心', bubble:'一顆泡泡球'};
const GIFT_LINE = {
  sloth:x => `薯餅想了很久，決定把${x}送你。`,
  egg:x => `蛋黃哥懶得收，${x}就給你了。`,
  dog:x => `皮蛋叼來${x}，尾巴搖個不停。`,
  moodeng:() => '彈跳豬塞給你一顆泡泡球，自己留了一顆。',
  nyanko:() => '貓咪老師從藏起來的那包點心，分了你一盒。',
  dino:x => `龍龍拿來${x}，說是撿到的，不是偷的。`,
  snoopy:x => `史努比開飛機經過，丟下${x}。`,
  piggy:n => `火腿給你 ${n} 枚幣：「零用錢，省著點用。」`,
};
const GIFT_COIN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffd75e" stroke="#d98e00" stroke-width="2"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="#fff3b8" stroke-width="1.6"/><path d="M12 15.6s-3.4-2-3.4-4.2c0-1.1.8-1.9 1.8-1.9.7 0 1.2.4 1.6.9.4-.5.9-.9 1.6-.9 1 0 1.8.8 1.8 1.9 0 2.2-3.4 4.2-3.4 4.2z" fill="#ff8fbf"/></svg>';
const giftIcon = k => k === 'coin' ? GIFT_COIN : WISH[k].svg;

S.album.gifts = S.album.gifts || {};
// 舊的形狀轉成新的（見最上面的說明）；轉了就存一次，讓雲端存檔恢復
{
  let fixed = false;
  Object.keys(S.album.gifts).forEach(d => {
    const l = S.album.gifts[d];
    if (!Array.isArray(l)){ delete S.album.gifts[d]; fixed = true; return; }
    l.forEach((g, i) => { if (Array.isArray(g)){ l[i] = {t: String(g[0] || ''), s: String(g[1] || ''), k: String(g[2] || 'snack')}; fixed = true; } });
  });
  if (fixed) setTimeout(() => { try { save(); } catch (e) {} }, 0);
}

/* 小事做完時 main.js 會叫這個；有送就回傳 true */
function giftAfter(e){
  if (Math.random() >= GIFT_RATE) return false;
  const d = e.d[0];
  const k = GIFT_BY[d] || (Math.random() < .5 ? 'snack' : 'bubble');
  let text;
  if (k === 'coin'){
    const n = 1 + Math.floor(Math.random() * 3);
    S.coins += n;
    text = GIFT_LINE.piggy(n);
  } else {
    S.wish[k] = (S.wish[k] || 0) + 1;
    text = GIFT_LINE[d](GIFT_THING[k]);
  }
  const list = S.album.gifts[d] = S.album.gifts[d] || [];
  list.push({t: todayStr(), s: text, k});   // 一筆一個物件，不能用陣列（Firestore 不收陣列包陣列）
  if (list.length > GIFT_KEEP) list.splice(0, list.length - GIFT_KEEP);
  giftCard(d, k, text);
  return true;
}

function giftCard(d, k, text){
  const o = document.createElement('div'); o.className = 'over';
  o.innerHTML = `<div class="pcard gcard" role="dialog" aria-label="${DOLL_NAME[d]}送你的">
      <h3>${DOLL_NAME[d]}送你的</h3>
      <div class="pic"><img alt="" src="${SPR[d]}"><span class="gi">${giftIcon(k)}</span></div>
      <p>${text}</p>
      <button class="btn y ok" aria-label="收下">${CKS}</button></div>`;
  screen.appendChild(o);
  const ok = o.querySelector('.ok'); ok.focus({preventScroll:true});
  ok.onclick = () => o.remove();
}

/* 相簿那一頁的「送你的東西」 */
function giftRows(d){
  const list = S.album.gifts[d] || [];
  if (!list.length) return '';
  return `<div class="al-sec">送你的東西</div>${list.slice().reverse().map(g => Array.isArray(g) ? {t: g[0], s: g[1], k: g[2]} : g).map(g =>
    `<div class="al-cd al-gf"><span class="fa">${giftIcon(g.k === 'coin' || WISH[g.k] ? g.k : 'snack')}</span><p>${g.s}</p><small>${md(g.t)}</small></div>`).join('')}`;
}
