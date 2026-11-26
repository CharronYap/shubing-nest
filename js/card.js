/* 明信片（第五版）：拍照的預覽畫面多一顆「寄給朋友」。
   - 選一個朋友、寫一句話（自己打字，80 字以內），寄出。一天最多寄 3 張。
   - 不傳圖片檔。傳的是那一間房間的擺法（哪一間、壁紙地板、每件家具和娃娃的位置、娃娃穿什麼、白天還是晚上），
     朋友那邊照這份擺法把房間擺出來（跟去朋友家同一套畫法），要存成圖片時用拍照的同一段程式畫。
   - 朋友的信箱最上面多一張明信片：點「看明信片」看那間房間，下面是背面：寫的話、名字和日期。可以「存成圖片」。
   - 信箱裡留最近 10 張，舊的自動收掉；也可以自己收掉。
   不懲罰、不催人：明信片不會過期，沒看也不會怎樣。
   別人打的字和名字一律走 txSlot（textContent）。
   雲端：nestCards/{自動編號} = {from, fromName, to, snap, msg, t}。收的人打開時抄進自己的存檔，再刪雲端那筆。
   存檔（都放在 S.mail 裡）：pc = [{id, w:名字, t:'日期', msg, snap, r:看過}]（最多 10 張）、pcd = [抄過的編號]（最多 40 個）、pcn = {d:'日期', n:今天寄了幾張} */
const CARD_DAY = 3, CARD_KEEP = 10, CARD_LEN = 80;
const CARD_ICON = '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="currentColor"/><rect x="14.5" y="7.5" width="4.5" height="5" rx=".8" fill="#fff"/><path d="M5.5 10h6M5.5 13h6M5.5 16h4" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>';
let cardDraft = null, cardBusy = false, cardView = null;

function cardMail(){ const m = mailInit(); m.pc = m.pc || []; m.pcd = m.pcd || []; if (!m.pcn || m.pcn.d !== todayStr()) m.pcn = {d: todayStr(), n: 0}; return m; }
const cardUnread = () => (S.mail && S.mail.pc ? S.mail.pc.filter(c => !c.r).length : 0);
// 現在這間房間的擺法（按下快門那一刻）
function cardSnap(){
  const r = cur(), look = {};
  r.items.forEach(i => { if (i.kind === 'doll' && S.look && S.look[i.id]) look[i.id] = S.look[i.id]; });
  // 照畫面上看得到的：這一間出門去別間串門子的不放（js/roam2.js 的 rvOut）
  const its = r.items.filter(i => !(i.kind === 'doll' && typeof rvOut === 'function' && rvOut(i)));
  const snap = JSON.parse(JSON.stringify({rid: roomId, room: {wall: r.wall, floor: r.floor, items: its, ...(r.light === false ? {light: false} : {})}, look, night: isNight()}));
  let u = Math.max(0, ...snap.room.items.map(i => +i.uid || 0)) + 1000;
  // 從別間來串門子的（js/roam2.js）：是自己的娃娃，衣服照自己的
  if (typeof RV !== 'undefined' && !VISIT) Object.values(RV).forEach(v => {
    if (v.to !== roomId || !SPR[v.id]) return;
    snap.room.items.push({uid: u++, kind: 'doll', id: v.id, x: Math.round(v.x), y: Math.round(v.y), sit: null, seat: 0});
    if (S.look && S.look[v.id]) snap.look[v.id] = JSON.parse(JSON.stringify(S.look[v.id]));
  });
  // 來過夜的客人（js/stay.js，只會在客廳）：當成一隻娃娃放進去，位置照現在畫面上的、衣服帶在那一筆上（look），
  // 收到的人打開就看得到自己的娃娃在你家。格式還是「一間房間的東西」，規則不用改
  if (typeof stGuests !== 'undefined' && roomId === 'living' && !VISIT){
    room.querySelectorAll('.gst.st-guest').forEach(el => {
      const g = stGuests.find(x => String(x.id) === el.dataset.pu); if (!g || !SPR[g.doll]) return;
      snap.room.items.push({uid: u++, kind: 'doll', id: g.doll, x: Math.round(parseFloat(el.style.left) || +g.x || 50), y: Math.round(+g.y || 85), sit: null, seat: 0, look: stayLook(g.look), gn: sText(g.fromName, 12) || ''});
    });
  }
  return snap;
}

/* ---------- 寄 ---------- */
function cardCompose(snap){
  if (!sNet()) return;
  cardDraft = {snap, to: null, msg: '', friends: null};
  cardPaint();
  sNet().friends().then(l => { if (cardDraft){ cardDraft.friends = l || []; if ($('#sheet .pc-box')) cardPaint(); } }).catch(() => { if (cardDraft){ cardDraft.friends = []; if ($('#sheet .pc-box')) cardPaint(); } });
}
function cardPaint(){
  const d = cardDraft; if (!d) return;
  const left = CARD_DAY - cardMail().pcn.n;
  let body;
  if (left <= 0) body = `<p class="al-em">今天寄了 ${CARD_DAY} 張，明天再寄。</p>`;
  else if (!d.friends) body = '<p class="al-em">找好友中……</p>';
  else if (!d.friends.length) body = '<p class="al-em">還沒有好友。在帳號那裡輸入朋友的好友碼，加了之後就能寄。</p>';
  else body = `<div class="al-sec">寄給誰</div>
    <div class="ng-chips">${d.friends.map((f, i) => f.hasMe === false
      ? `<button class="ng-chip off" disabled aria-label="還沒加你為好友，不能寄">${txSlot(sText(f.name, 12))}</button>`
      : `<button class="ng-chip ${d.to === f.uid ? 'on' : ''}" data-pcf="${i}" aria-pressed="${d.to === f.uid}">${txSlot(sText(f.name, 12))}</button>`).join('')}</div>
    ${d.friends.some(f => f.hasMe === false) ? '<small class="bk-note">灰色的朋友還沒加你為好友，等他加你之後才能寄給他。</small>' : ''}
    <div class="al-sec">寫一句話</div>
    <input class="tx-in pc-in" type="text" maxlength="${CARD_LEN}" placeholder="想跟朋友說的話" aria-label="明信片上的話，${CARD_LEN} 字以內">
    <small class="bk-note">明信片上是剛剛拍的這間房間。只有收到的朋友看得到。</small>`;
  const ok = left > 0 && d.friends && d.friends.length;
  openSheet(`<div class="hd">${CARD_ICON}<span>寄明信片</span>${left > 0 ? `<small class="pc-left">今天還能寄 ${left} 張</small>` : ''}</div><div class="pc-box">${body}</div>
    ${ok ? `<div class="ml-ft"><button class="btn y" data-pc="send" ${d.to ? '' : 'disabled'}>寄出</button></div>` : ''}`);
  const inp = $('#sheet .pc-in');
  if (inp){ inp.value = d.msg; inp.oninput = () => { d.msg = inp.value; }; }
  evOpen = false; alOpen = false;
}
async function cardSend(){
  const d = cardDraft, net = sNet();
  if (!d || !net || cardBusy || !d.to || cardMail().pcn.n >= CARD_DAY) return;
  cardBusy = true;
  const f = (d.friends || []).find(x => x.uid === d.to);
  if (!f || f.hasMe === false){ cardBusy = false; return; }
  try {
    await net.cardSend({to: d.to, snap: d.snap, msg: sText(d.msg, CARD_LEN), fromName: net.me.name});
    cardMail().pcn.n++; save();
    cardDraft = null; $('#sheet').hidden = true;
    toast(`明信片寄給${sText(f && f.name, 12) || '朋友'}了`);
  } catch (e) { sQuiet('card', e); toast(sErr(e)); }
  cardBusy = false;
}

/* ---------- 收 ---------- */
// 朋友那份擺法：格式不對的不收；裡面的家具、娃娃到要畫的時候再用 visitClean 濾
function cardOk(c){
  const s = c && c.snap;
  return !!(s && typeof s === 'object' && s.room && typeof s.room === 'object' && Array.isArray(s.room.items) && s.room.items.length <= 300);
}
async function cardRefresh(redraw){
  const net = sNet(); if (!net || VISIT) return;
  let list;
  try { list = await net.cardsTo(); } catch (e) { sQuiet('card', e); return; }
  const m = cardMail();
  let changed = false;
  list.sort((a, b) => (a.t || 0) - (b.t || 0)).forEach(c => {
    if (!c || typeof c.id !== 'string') return;
    if (!m.pcd.includes(c.id) && cardOk(c)){
      m.pc.unshift({id: c.id, w: sText(c.fromName, 12) || '朋友', t: ngDay(c.t), msg: sText(c.msg, CARD_LEN), snap: c.snap, r: 0, ...(typeof c.from === 'string' && /^[\w-]{1,64}$/.test(c.from) ? {u: c.from} : {})});   // u：寄的人的帳號，用來對「我的娃娃是不是正住在他家」
      m.pcd.push(c.id); if (m.pcd.length > 40) m.pcd.splice(0, m.pcd.length - 40);
      changed = true;
    }
    // 抄好了：等自己的存檔上了雲端才刪雲端那筆（js/social.js sAfterSave）；格式不對的直接刪
    if (m.pcd.includes(c.id)) sAfterSave(() => net.cardDel(c.id)); else net.cardDel(c.id).catch(e => sQuiet('card', e));
  });
  if (m.pc.length > CARD_KEEP){ m.pc.length = CARD_KEEP; changed = true; }
  if (changed){ save(); mailBadge(); if (redraw && !$('#sheet').hidden && $('#sheet .ml-box')) openMail(true); }
}
// 信箱最上面那一區
function cardSection(){
  const pc = (S.mail && S.mail.pc) || [];
  return pc.map((c, i) => `<div class="ml pc ${c.r ? '' : 'unread'}">
    <div class="ml-hd"><span class="pc-st">${CARD_ICON}</span><span><b>${txSlot(c.w)}寄來的明信片</b><small>${md(c.t)}</small>${c.msg ? `<i>${txSlot(c.msg)}</i>` : ''}</span></div>
    <div class="ml-ft"><button class="btn y sm" data-pc="open" data-i="${i}">看明信片</button><button class="btn sm" data-pc="del" data-i="${i}">丟掉</button></div></div>`).join('');
}
function cardOpen(i){
  const c = cardMail().pc[i]; if (!c || VISIT) return;
  if (!c.r){ c.r = 1; save(); mailBadge(); }
  const s = c.snap, rid = RIDS.includes(s.rid) ? s.rid : 'living';
  // 借「去朋友家」那一套把房間擺出來：三間都放同一份，只看得到這一間
  const v = visitClean({home: Object.fromEntries(RIDS.map(r => [r, s.room])), look: s.look});
  visitBack = roomId;
  VISIT = {name: c.w, uid: '', home: v.home, look: v.look, card: true, night: !!s.night};
  cardView = c;
  screen.classList.add('visiting', 'incard');
  setPage('room');
  roomId = rid;
  load();
  // 這一頁要一眼看得出是「朋友寄來的一張明信片」（2026-11-27 使用者說看不懂）：
  // 最上面一行標題；房間縮小、畫成有白邊的卡片放在暗掉的背景中間（css 的 .incard）；
  // 背面有寫字才畫橫線紙，沒寫就一行淡淡的小字；三顆鈕：丟掉這張（最淡、要按兩次）｜存到手機｜看完了
  let top = document.getElementById('pcTop');
  if (!top){ top = document.createElement('div'); top.id = 'pcTop'; top.className = 'pc-top'; screen.appendChild(top); }
  // 自己有一隻娃娃正住在寄的人家、而且那一隻真的在這張裡面：多一行小字。用自己這邊的借住紀錄（js/stay.js 的 stayOut）對帳號，
  // 不比名字；舊的明信片沒有記寄的人是誰，判斷不出來就不顯示
  const so = typeof stayOut === 'function' ? stayOut() : null;
  const mine = so && c.u && so.to === c.u && s.room.items.some(i => i && i.kind === 'doll' && i.id === so.d && i.gn !== undefined) ? so.d : '';
  top.innerHTML = `<b>${txSlot(c.w)}寄來的明信片</b><small>${md(c.t)}</small>${mine ? `<small class="pc-mine">你家的${DOLL_NAME[mine]}也在裡面喔</small>` : ''}`;
  const bar = $('#vbar');
  bar.innerHTML = `${c.msg ? `<div class="pc-back"><p class="pc-msg">${txSlot(c.msg)}</p></div>` : '<p class="pc-none">這張沒有寫字。</p>'}
    <div class="vb-row pc-row"><button class="btn pc-del">丟掉這張</button><button class="btn pc-save">存到手機</button><button class="btn y vb-home">看完了</button></div>`;
  bar.querySelector('.vb-home').onclick = cardClose;
  // 丟掉：按兩次才真的丟（第一次只是問，三秒沒按就變回來），丟了就沒有了
  const del = bar.querySelector('.pc-del');
  del.onclick = () => {
    if (!del.dataset.sure){ del.dataset.sure = '1'; del.textContent = '真的要丟掉嗎？再按一次'; setTimeout(() => { if (del.isConnected){ delete del.dataset.sure; del.textContent = '丟掉這張'; } }, 3000); return; }
    const m = cardMail(), k = m.pc.indexOf(c);
    if (k >= 0) m.pc.splice(k, 1);
    save(); mailBadge();
    cardClose();
    toast('這張明信片丟掉了');
  };
  bar.querySelector('.pc-save').onclick = async () => {
    let shot = null;
    try { shot = await photoShoot(); } catch (e) { sQuiet('card', e); }
    if (shot) photoPreview(shot); else toast('沒拍成，再試一次');
  };
  bar.hidden = false;
}
function cardClose(){
  if (!cardView) return;
  cardView = null;
  screen.classList.remove('incard');
  const top = document.getElementById('pcTop'); if (top) top.remove();
  visitClose();
  // 收到的明信片現在收在朋友面板（js/friend.js）
  if (typeof frOpen === 'function' && typeof sNet === 'function' && sNet()) frOpen('in'); else openMail();
}
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.pcf !== undefined && cardDraft && cardDraft.friends){ const f = cardDraft.friends[+b.dataset.pcf]; if (f){ cardDraft.to = f.uid; cardPaint(); } return; }
  const a = b.dataset.pc; if (!a) return;
  if (a === 'send') cardSend();
  else if (a === 'open') cardOpen(+b.dataset.i);
  else if (a === 'del'){ const m = cardMail(); m.pc.splice(+b.dataset.i, 1); save(); mailBadge(); openMail(true); }
});
addEventListener('nestnet', () => cardRefresh(true));
document.addEventListener('visibilitychange', () => { if (!document.hidden) cardRefresh(true); });
setInterval(() => { if (!document.hidden) cardRefresh(true); }, 5 * 60000);
