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
  return JSON.parse(JSON.stringify({rid: roomId, room: {wall: r.wall, floor: r.floor, items: r.items, ...(r.light === false ? {light: false} : {})}, look, night: isNight()}));
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
      m.pc.unshift({id: c.id, w: sText(c.fromName, 12) || '朋友', t: ngDay(c.t), msg: sText(c.msg, CARD_LEN), snap: c.snap, r: 0});
      m.pcd.push(c.id); if (m.pcd.length > 40) m.pcd.splice(0, m.pcd.length - 40);
      changed = true;
    }
    net.cardDel(c.id).catch(e => sQuiet('card', e));   // 抄好了（或格式不對）就刪雲端那筆，刪失敗下次再刪
  });
  if (m.pc.length > CARD_KEEP){ m.pc.length = CARD_KEEP; changed = true; }
  if (changed){ save(); mailBadge(); if (redraw && !$('#sheet').hidden && $('#sheet .ml-box')) openMail(true); }
}
// 信箱最上面那一區
function cardSection(){
  const pc = (S.mail && S.mail.pc) || [];
  return pc.map((c, i) => `<div class="ml pc ${c.r ? '' : 'unread'}">
    <div class="ml-hd"><span class="pc-st">${CARD_ICON}</span><span><b>${txSlot(c.w)}寄來的明信片</b><small>${md(c.t)}</small>${c.msg ? `<i>${txSlot(c.msg)}</i>` : ''}</span></div>
    <div class="ml-ft"><button class="btn y sm" data-pc="open" data-i="${i}">看明信片</button><button class="btn sm" data-pc="del" data-i="${i}">收掉</button></div></div>`).join('');
}
function cardOpen(i){
  const c = cardMail().pc[i]; if (!c || VISIT) return;
  if (!c.r){ c.r = 1; save(); mailBadge(); }
  const s = c.snap, rid = RIDS.includes(s.rid) ? s.rid : 'living';
  // 借「去朋友家」那一套把房間擺出來：三間都放同一份，只看得到這一間
  const v = visitClean({home: {living: s.room, bed: s.room, bath: s.room}, look: s.look});
  visitBack = roomId;
  VISIT = {name: c.w, uid: '', home: v.home, look: v.look, card: true, night: !!s.night};
  cardView = c;
  screen.classList.add('visiting', 'incard');
  setPage('room');
  roomId = rid;
  load();
  const bar = $('#vbar');
  bar.innerHTML = `<div class="pc-back"><p class="pc-msg">${c.msg ? txSlot(c.msg) : ''}</p><div class="pc-from"><b>${txSlot(c.w)}</b><small>${md(c.t)}</small></div></div>
    <div class="vb-row"><button class="btn vb-home">收起來</button><button class="btn y pc-save">存成圖片</button></div>`;
  bar.querySelector('.vb-home').onclick = cardClose;
  bar.querySelector('.pc-save').onclick = async () => {
    let shot = null;
    try { shot = await photoShoot(); } catch (e) { sQuiet('card', e); }
    if (shot) photoSave(shot.canvas); else toast('這台存不了照片');
  };
  bar.hidden = false;
}
function cardClose(){
  if (!cardView) return;
  cardView = null;
  screen.classList.remove('incard');
  visitClose();
  openMail();
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
