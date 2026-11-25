/* 訪客簿和貼紙（第五版）：每個人的小窩門邊一本訪客簿（房間左上角的小本子）。
   - 去朋友家時點開：貼一張貼紙、寫一句話（40 字以內，可以不寫）。每個朋友每天一則，跟愛心分開算。
   - 自己家點開：看朋友留的，最新的在前面，一頁 5 則，留最近 50 則。每一則有貼紙、名字、日期和那句話。
   - 訪客簿的字，來家裡的朋友都看得到。主人可以刪任何一則，寫的人可以刪自己的。
   - 主人第一次看到新的一則，貼紙上那隻娃娃在房間裡跳一下。沒有紅點、不跳通知。
   不懲罰、不催人：沒人留言不會怎樣，留言不會過期（只是超過 50 則時收掉最舊的）。
   別人打的字和名字一律走 txSlot（textContent），不接進 innerHTML。
   雲端：nestRooms/{主人}/book/{日子_寫的人} = {from, fromName, day, sticker, msg}
   存檔：S.mail.bk = [看過的編號]（最多 60 個），不另外加欄位 */
const BOOK_KEEP = 50, BOOK_PAGE = 5, BOOK_LEN = 40;
const BOOK_ICON = '<svg viewBox="0 0 24 24"><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 19.5z" fill="currentColor"/><path d="M8.5 3v18" stroke="#fff" stroke-width="1.6"/><path d="M14 13.6s-3-1.8-3-3.8c0-1 .7-1.7 1.6-1.7.6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8.9 0 1.6.7 1.6 1.7 0 2-3 3.8-3 3.8z" fill="#fff"/></svg>';
const BOOK_BFLY = '<svg viewBox="0 0 40 40"><path d="M20 20c-3-8-9-11-13-9-3 2-2 9 3 11-4 1-5 6-2 8 4 2 9-2 12-10z" fill="#ffb3d3" stroke="#e0609d" stroke-width="2" stroke-linejoin="round"/><path d="M20 20c3-8 9-11 13-9 3 2 2 9-3 11 4 1 5 6 2 8-4 2-9-2-12-10z" fill="#ffd66b" stroke="#e0a020" stroke-width="2" stroke-linejoin="round"/><path d="M20 13v17" stroke="#6b2d4a" stroke-width="2.4" stroke-linecap="round"/></svg>';
const BOOK_BIRD = '<svg viewBox="0 0 40 40"><path d="M9 24c0-8 6-13 13-13 5 0 9 3 9 8 0 7-6 12-13 12-5 0-9-3-9-7z" fill="#9ed8f5" stroke="#4a9fd0" stroke-width="2"/><path d="M31 17l6-1-5 5z" fill="#ffb400" stroke="#d48a00" stroke-width="1.6" stroke-linejoin="round"/><circle cx="26" cy="16.5" r="1.8" fill="#3a2a35"/><path d="M13 23c3 3 8 3 11-1" fill="none" stroke="#4a9fd0" stroke-width="2" stroke-linecap="round"/><path d="M17 31v4M22 31v4" stroke="#d48a00" stroke-width="2" stroke-linecap="round"/></svg>';
let bk = null;

/* 貼紙：八隻娃娃的臉一開始就有；季節家具有哪幾樣、貓咪老師在小島招來過蝴蝶或小鳥，就各多一張 */
function bookStickers(){
  const l = DOLLS.map(d => 'd-' + d);
  if (typeof SEASON_FURN !== 'undefined') SEASON_FURN.forEach(id => { if (FURN_OWN[id]) l.push('f-' + id); });
  const rec = ((S.yard && S.yard.rec && S.yard.rec.nyanko) || []).join('');
  if (rec.includes('蝴蝶')) l.push('y-bfly');
  if (rec.includes('小鳥')) l.push('y-bird');
  return l;
}
function bookStickerName(id){
  const [k, x] = [id.slice(0, 1), id.slice(2)];
  if (k === 'd' && DOLL_NAME[x]) return DOLL_NAME[x];
  if (k === 'f' && FURN[x]) return FURN[x].name || '裝飾';
  return id === 'y-bfly' ? '蝴蝶' : id === 'y-bird' ? '小鳥' : '愛心';
}
// 不認得的貼紙（朋友的版本比較新）畫成一顆愛心
function bookStickerHTML(id){
  id = String(id || '');
  const [k, x] = [id.slice(0, 1), id.slice(2)];
  if (k === 'd' && SPR[x]) return `<img src="${SPR[x]}" alt="">`;
  if (k === 'f' && FURN[x]) return furnSVG(x);
  if (id === 'y-bfly') return BOOK_BFLY;
  if (id === 'y-bird') return BOOK_BIRD;
  return HEART();
}

function bookSeen(){ const m = mailInit(); m.bk = m.bk || []; return m.bk; }

async function bookOpen(){
  const net = sNet();
  if (!net){ toast('登入之後才有訪客簿'); return; }
  const owner = !VISIT;
  bk = {uid: owner ? net.me.uid : VISIT.uid, name: owner ? '' : VISIT.name, owner, list: null, mine: null, page: 0, sticker: null, msg: '', busy: false, fail: false};
  bookPaint();
  await bookLoad();
}
async function bookLoad(){
  const net = sNet(), b = bk; if (!net || !b) return;
  try {
    const list = await net.book(b.uid);
    if (bk !== b) return;
    b.list = list.slice(0, BOOK_KEEP);
    b.mine = b.owner ? null : list.find(e => e.id === `${nestDayN()}_${net.me.uid}`) || null;
    if (b.owner){
      // 超過 50 則的收掉；新的那幾則，貼紙上的娃娃跳一下
      list.slice(BOOK_KEEP).forEach(e => net.bookDel(b.uid, e.id).catch(() => {}));
      const seen = bookSeen(), fresh = b.list.filter(e => !seen.includes(e.id));
      if (fresh.length){
        b.fresh = fresh.map(e => e.id);
        fresh.forEach(e => bookHop(String(e.sticker || '').slice(2)));
        const m = mailInit(); m.bk = b.list.slice(0, 60).map(e => e.id); save();
      }
    }
  } catch (e) { sQuiet('book', e); if (bk === b) b.fail = true; }
  if (bk === b && !$('#sheet').hidden && $('#sheet .bk-box')) bookPaint();
}
function bookHop(d){
  const it = items.find(i => i.kind === 'doll' && i.id === d);
  if (!it || VISIT) return;
  const el = elFor(it).querySelector('.body');
  el.classList.remove('r-heart'); void el.offsetWidth; el.classList.add('r-heart');
  setTimeout(() => el.classList.remove('r-heart'), 900);
}
function bookPaint(){
  const b = bk, net = sNet(); if (!b || !net) return;
  let body;
  if (b.fail) body = '<p class="al-em">訪客簿現在打不開，晚點再試。</p>';
  else if (!b.list) body = '<p class="al-em">翻開中……</p>';
  else {
    let form = '';
    if (!b.owner){
      if (b.mine) form = '<p class="al-em bk-done">今天留過了，明天可以再留一則。</p>';
      else {
        const st = bookStickers();
        if (!b.sticker) b.sticker = st[0];
        form = `<div class="bk-form">
          <div class="al-sec">貼一張貼紙</div>
          <div class="bk-st">${st.map(id => `<button class="${b.sticker === id ? 'on' : ''}" data-bks="${id}" aria-label="${bookStickerName(id)}貼紙" aria-pressed="${b.sticker === id}">${bookStickerHTML(id)}</button>`).join('')}</div>
          <input class="bk-in" type="text" maxlength="${BOOK_LEN}" placeholder="寫一句話（可以不寫）" aria-label="寫一句話，${BOOK_LEN} 字以內">
          <div class="bk-go"><small>來這裡的朋友都看得到，一天一則。</small><button class="btn y sm" data-bk="add">貼上去</button></div></div>`;
      }
    }
    const n = b.list.length, pages = Math.max(1, Math.ceil(n / BOOK_PAGE));
    b.page = Math.max(0, Math.min(pages - 1, b.page));
    const rows = b.list.slice(b.page * BOOK_PAGE, (b.page + 1) * BOOK_PAGE).map(e => {
      const can = b.owner || e.from === net.me.uid;
      return `<div class="bk-it ${b.fresh && b.fresh.includes(e.id) ? 'new' : ''}"><span class="bk-s">${bookStickerHTML(e.sticker)}</span>
        <div class="bk-tx"><b>${txSlot(sText(e.fromName, 24) || '朋友')}</b><small>${dayMd(e.day | 0)}</small>${e.msg ? `<p>${txSlot(sText(e.msg, BOOK_LEN))}</p>` : ''}</div>
        ${can ? `<button class="bk-del" data-bkd="${e.id.replace(/[^\w-]/g, '')}" aria-label="刪掉這一則"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>` : ''}</div>`;
    }).join('');
    const pager = pages > 1 ? `<div class="bk-pg"><button data-bkp="-1" aria-label="上一頁" ${b.page ? '' : 'disabled'}>‹</button><span>${b.page + 1} / ${pages}</span><button data-bkp="1" aria-label="下一頁" ${b.page < pages - 1 ? '' : 'disabled'}>›</button></div>` : '';
    const empty = b.owner ? '<p class="al-em">還沒有人留言。朋友來家裡時，可以在這裡貼一張貼紙、寫一句話。</p>' : '<p class="al-em">還沒有人留言，你是第一個。</p>';
    body = form + (n ? rows + pager : empty) + (b.owner ? '<p class="bk-note">訪客簿的字，來你家的朋友都看得到。不想留的那一則可以按叉叉刪掉。</p>' : '');
  }
  openSheet(`<div class="hd">${BOOK_ICON}<span>${b.owner ? '訪客簿' : txSlot(b.name) + '的訪客簿'}</span></div><div class="bk-box">${body}</div>`);
  const inp = $('#sheet .bk-in');
  if (inp){ inp.value = b.msg; inp.oninput = () => { b.msg = inp.value; }; }
  evOpen = false; alOpen = false;
}
async function bookAdd(){
  const b = bk, net = sNet(); if (!b || !net || b.busy || b.owner || b.mine) return;
  b.busy = true;
  const day = nestDayN(), msg = sText(b.msg, BOOK_LEN), sticker = b.sticker || 'd-sloth';
  try {
    await net.bookAdd(b.uid, day, {fromName: net.me.name, sticker, msg});
    const e = {id: `${day}_${net.me.uid}`, from: net.me.uid, fromName: net.me.name, day, sticker, ...(msg ? {msg} : {})};
    b.mine = e; b.list = [e, ...(b.list || []).filter(x => x.id !== e.id)]; b.page = 0; b.msg = '';
    toast(`在${b.name}的訪客簿貼了一張`);
  } catch (e) { sQuiet('book', e); toast(sErr(e)); }
  b.busy = false;
  if (bk === b && $('#sheet .bk-box')) bookPaint();
}
async function bookDel(id){
  const b = bk, net = sNet(); if (!b || !net || b.busy) return;
  const e = (b.list || []).find(x => x.id.replace(/[^\w-]/g, '') === id); if (!e) return;
  b.busy = true;
  try {
    await net.bookDel(b.uid, e.id);
    b.list = b.list.filter(x => x !== e);
    if (b.mine && b.mine.id === e.id) b.mine = null;
    toast('刪掉了');
  } catch (err) { sQuiet('book', err); toast(sErr(err)); }
  b.busy = false;
  if (bk === b && $('#sheet .bk-box')) bookPaint();
}
$('#sheet').addEventListener('click', e => {
  if (!bk || !$('#sheet .bk-box')) return;
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.bks){ bk.sticker = b.dataset.bks; bookPaint(); }
  else if (b.dataset.bk === 'add') bookAdd();
  else if (b.dataset.bkd) bookDel(b.dataset.bkd);
  else if (b.dataset.bkp){ bk.page += +b.dataset.bkp; bookPaint(); }
});

/* 門邊的小本子：自己家登入了才出現；去朋友家時是朋友的訪客簿 */
(function(){
  const b = document.createElement('button');
  b.className = 'rbtn bookb'; b.id = 'bookBtn'; b.setAttribute('aria-label', '訪客簿'); b.innerHTML = BOOK_ICON; b.hidden = true;
  b.addEventListener('click', () => {
    if (!$('#sheet').hidden && $('#sheet .bk-box')){ $('#sheet').hidden = true; return; }
    bookOpen();
  });
  room.appendChild(b);
  const show = () => { b.hidden = !sNet(); };
  addEventListener('nestnet', show);
  show();
})();
// 去朋友家：下面那排也放一顆，比較好找
visitExtras.push((f, more) => {
  const b = document.createElement('button');
  b.className = 'btn'; b.innerHTML = `${BOOK_ICON}<span>訪客簿</span>`;
  b.onclick = bookOpen;
  more.appendChild(b);
});
