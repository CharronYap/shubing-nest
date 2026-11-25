/* 送娃娃（第四版）：同一隻有兩隻以上，可以送一隻給好友。入口在信箱。
   不懲罰、不催人：送出去的娃娃會一直在朋友門口等，不會過期、不會自己退回；朋友多久沒領都不會怎樣。
   朋友讓牠進門之前，寄的人隨時可以收回。
   雲端：nestGifts/{id} = {from, fromName, to, toName, doll, line, t}（js/cloud.js，規則在 firestore.rules）
   不用 transaction，照這個順序做：
     寄：先寫 nestGifts，成功了才把自己的數量減一
     領：先確認還在 → 加進自己的存檔、編號記進 S.mail.gin → 存檔 → 再刪 nestGifts
     收回：先確認還在 → 刪 nestGifts → 自己的數量加一
   收回和領取幾乎同時按下去時，兩邊可能都多一隻；存檔是自己的，有人改存檔多送，這個遊戲不防。
   S.mail.gout = {d:'日期', n:今天送了幾次}   S.mail.gin = [領過的 nestGifts 編號]（最多留 60 個）
   一次最多 3 隻在朋友門口等、一天最多送 3 次，只在畫面這邊擋。去朋友家時不能用。 */
const NG_MAX_OUT = 3, NG_MAX_DAY = 3;
let ngIn = [], ngOut = [], ngBusy = false, ngLoaded = false, ngPick = null, ngFriends = [];

const ngNet = () => (typeof VISIT !== 'undefined' && VISIT) || !window.nestNet || !window.nestNet.me ? null : window.nestNet;
// 名字放進信的代號（# ; = . | 是分隔符號），也直接放進畫面，所以拿掉會出事的字
const ngName = s => String(s || '').replace(/[#;=.|<>&"'\\\n]/g, '').slice(0, 12) || '朋友';
const ngDay = t => { const d = new Date(t || Date.now()); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const ngOk = g => g && DOLLS.includes(g.doll);
function ngMail(){ const m = mailInit(); m.gin = m.gin || []; if (!m.gout || m.gout.d !== todayStr()) m.gout = {d: todayStr(), n: 0}; return m; }
const ngSentToday = () => ngMail().gout.n;
const ngCanGive = () => DOLLS.filter(d => (DOLL_N[d] || 0) >= 2);
function ngWaiting(){ return ngNet() ? ngIn.length : 0; }
function ngErr(e){
  console.warn('[nestgift]', e);
  return e && e.code === 'permission-denied' ? '雲端還沒開好送娃娃（規則還沒發布），先不能送' : '連不上雲端，晚點再試';
}
const ngSheetOpen = sel => !$('#sheet').hidden && $('#sheet ' + sel);

/* ---------- 讀雲端 ---------- */
async function ngRefresh(redraw){
  const net = ngNet(); if (!net) return;
  try {
    const [a, b] = await Promise.all([net.giftsTo(), net.giftsFrom()]);
    const gin = ngMail().gin;
    // 領過了但上次沒刪掉的，這次補刪
    a.filter(g => gin.includes(g.id)).forEach(g => net.delGift(g.id).catch(() => {}));
    ngIn = a.filter(g => ngOk(g) && !gin.includes(g.id)).sort((x, y) => x.t - y.t);
    ngOut = b.filter(ngOk).sort((x, y) => y.t - x.t);
    ngLoaded = true;
  } catch (e) { console.info('[nestgift] 讀不到送娃娃（規則可能還沒發布）', e && e.code); return; }
  mailBadge();
  if (redraw && ngSheetOpen('.ml-box')) openMail(true);
}

/* ---------- 信箱裡的區塊 ---------- */
function ngInCard(g){
  const w = ngName(g.fromName), x = {d: g.doll, type: 'gift', body: mailFill(MAIL_TPL[g.doll].gift[0], {w, m: g.line})};
  return `<div class="ml ng-in unread open">
    <div class="ml-hd"><img src="${SPR[g.doll]}" alt=""><span><b>${DOLL_NAME[g.doll]}從${w}家來了</b><small>${w}・${md(ngDay(g.t))}</small></span></div>
    <div class="ml-bd">${mailBodyHTML(x)}<div class="ml-ft"><button class="btn y" data-ng="in" data-id="${g.id}">讓牠進來</button></div></div></div>`;
}
function ngSection(){
  if (!ngNet()) return '';
  let h = ngIn.map(ngInCard).join('');
  if (ngOut.length){
    h += `<div class="al-sec ng-sec">在朋友門口等的</div>` + ngOut.map(g =>
      `<div class="ng-out"><img src="${SPR[g.doll]}" alt=""><span><b>${DOLL_NAME[g.doll]} → ${ngName(g.toName || ngFriendName(g.to))}</b><small>${md(ngDay(g.t))}出發・朋友還沒開門</small></span><button class="btn sm" data-ng="back" data-id="${g.id}">收回</button></div>`).join('');
  }
  return h;
}
function ngSendBtn(){ return ngNet() ? '<button class="btn ng-go" data-ng="pick">送娃娃給朋友</button>' : ''; }
function ngFriendName(uid){ const f = ngFriends.find(p => p.uid === uid); return f ? f.name : '朋友'; }

/* ---------- 讓牠進來 ---------- */
async function ngClaim(id){
  const net = ngNet(); if (!net || ngBusy) return;
  ngBusy = true;
  try {
    const g = await net.gift(id);
    if (!ngOk(g)){ ngIn = ngIn.filter(x => x.id !== id); toast('牠已經回家了，朋友收回去了'); return; }
    const m = ngMail();
    if (!m.gin.includes(id)){
      const w = ngName(g.fromName), t = todayStr(), k = `${g.doll}.gift.0#w=${w};m=${Math.max(0, Math.min(5, g.line | 0))}`;
      DOLL_N[g.doll] = (DOLL_N[g.doll] || 0) + 1; albumMet(g.doll);
      m.gin.push(id); if (m.gin.length > 60) m.gin.splice(0, m.gin.length - 60);
      // 變成一封看過的信，相簿「寫給你的信」會留下「從○○家來的」；不算在一天一封裡
      m.l.unshift({k, t, r: 1, a: null, g: 0});
      const ar = m.arch[g.doll] = m.arch[g.doll] || [];
      ar.push(`${t}|${k}`); if (ar.length > MAIL_ARCH) ar.splice(0, ar.length - MAIL_ARCH);
      save();
      try { await net.push(); } catch (e) {}
      toast(`${DOLL_NAME[g.doll]}進來了`);
    }
    ngIn = ngIn.filter(x => x.id !== id);
    await net.delGift(id).catch(e => console.info('[nestgift] 先不刪，下次打開信箱再刪', e && e.code));
    if (typeof render === 'function') render();
  } catch (e) { toast(ngErr(e)); }
  finally { ngBusy = false; mailBadge(); if (ngSheetOpen('.ml-box')) openMail(true); }
}

/* ---------- 收回 ---------- */
async function ngBack(id){
  const net = ngNet(); if (!net || ngBusy) return;
  ngBusy = true;
  try {
    const g = await net.gift(id);
    if (!ngOk(g)){ ngOut = ngOut.filter(x => x.id !== id); toast('朋友已經讓牠進門了'); return; }
    await net.delGift(id);
    DOLL_N[g.doll] = (DOLL_N[g.doll] || 0) + 1;
    ngOut = ngOut.filter(x => x.id !== id);
    save(); if (typeof render === 'function') render();
    toast(`${DOLL_NAME[g.doll]}回來了`);
  } catch (e) { toast(ngErr(e)); }
  finally { ngBusy = false; if (ngSheetOpen('.ml-box')) openMail(true); }
}

/* ---------- 送出去 ---------- */
async function ngOpenPick(){
  const net = ngNet(); if (!net) return;
  ngPick = ngPick || {doll: null, to: null, m: null};
  ngPaint(true);
  try { ngFriends = await net.friends(); } catch (e) { ngFriends = []; }
  await ngRefresh(false);
  if (ngSheetOpen('.ng-box')) ngPaint(false);
}
function ngPaint(loading){
  const p = ngPick, can = ngCanGive(), today = ngSentToday();
  let stop = '';
  if (ngOut.length >= NG_MAX_OUT) stop = `已經有 ${NG_MAX_OUT} 隻在朋友門口等了。等牠們進門，或收回一隻之後再送。`;
  else if (today >= NG_MAX_DAY) stop = `今天送了 ${NG_MAX_DAY} 次，明天再送。`;
  else if (!can.length) stop = '同一隻有兩隻以上才能送。再夾到一樣的，就可以分一隻給朋友。';
  else if (!loading && !ngFriends.length) stop = '還沒有好友。在帳號那裡輸入朋友的好友碼，加了之後就能送。';
  if (p.doll && !can.includes(p.doll)) p.doll = null;
  const ready = !stop && !loading && p.doll && p.to && p.m !== null;
  openSheet(`<div class="hd ml-top">${MAIL_ICON}<span>送娃娃給朋友</span><small>今天還能送 ${Math.max(0, NG_MAX_DAY - today)} 次</small></div>
    <div class="ng-box">${stop ? `<p class="al-em">${stop}</p>` : `
      <div class="al-sec">送哪一隻</div>
      <div class="ng-dolls">${can.map(d => `<button class="tile ${p.doll === d ? 'on' : ''}" data-ngd="${d}" aria-label="${DOLL_NAME[d]}" aria-pressed="${p.doll === d}"><img src="${SPR[d]}" alt=""><span class="n">×${DOLL_N[d]}</span></button>`).join('')}</div>
      <div class="al-sec">送給誰</div>
      <div class="ng-chips">${loading ? '<p class="al-em">找好友中……</p>' : ngFriends.map(f => `<button class="ng-chip ${p.to === f.uid ? 'on' : ''}" data-ngf="${f.uid}" aria-pressed="${p.to === f.uid}">${ngName(f.name)}</button>`).join('')}</div>
      <div class="al-sec">想跟朋友說的話</div>
      <div class="ng-chips">${MAIL_GIFT_LINES.map((l, i) => `<button class="ng-chip ${p.m === i ? 'on' : ''}" data-ngm="${i}" aria-pressed="${p.m === i}">${l}</button>`).join('')}</div>`}
    </div>
    <div class="ml-ft"><button class="btn" data-ng="mail">回信箱</button>${stop ? '' : `<button class="btn y" data-ng="send" ${ready ? '' : 'disabled'}>送出</button>`}</div>`);
}
async function ngSend(){
  const net = ngNet(), p = ngPick; if (!net || ngBusy || !p || !p.doll || !p.to || p.m === null) return;
  if ((DOLL_N[p.doll] || 0) < 2 || ngOut.length >= NG_MAX_OUT || ngSentToday() >= NG_MAX_DAY){ ngPaint(false); return; }
  ngBusy = true;
  const to = ngFriends.find(f => f.uid === p.to), w = ngName(to && to.name);
  try {
    const id = await net.sendGift({to: p.to, toName: w, doll: p.doll, line: p.m, fromName: ngName(net.me.name)});
    // 寫進 nestGifts 成功了才減
    DOLL_N[p.doll]--; ngMail().gout.n++;
    ngOut.unshift({id, from: net.me.uid, to: p.to, toName: w, doll: p.doll, line: p.m, t: Date.now()});
    save(); if (typeof render === 'function') render();
    toast(`${DOLL_NAME[p.doll]}出發去${w}家了`);
    ngPick = null;
    openMail(true);
  } catch (e) { toast(ngErr(e)); }
  finally { ngBusy = false; }
}

$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.ng === 'in') ngClaim(b.dataset.id);
  else if (b.dataset.ng === 'back') ngBack(b.dataset.id);
  else if (b.dataset.ng === 'pick') ngOpenPick();
  else if (b.dataset.ng === 'mail') openMail(true);
  else if (b.dataset.ng === 'send') ngSend();
  else if (!$('#sheet .ng-box') || !ngPick) return;
  else if (b.dataset.ngd){ ngPick.doll = b.dataset.ngd; ngPaint(false); }
  else if (b.dataset.ngf){ ngPick.to = b.dataset.ngf; ngPaint(false); }
  else if (b.dataset.ngm !== undefined){ ngPick.m = +b.dataset.ngm; ngPaint(false); }
});

// 登入好了看一次，之後回到這個分頁、每 5 分鐘再看一次（只是讓信封上的數字跟上，不會跳出來催）
addEventListener('nestnet', () => ngRefresh(true));
document.addEventListener('visibilitychange', () => { if (!document.hidden) ngRefresh(true); });
setInterval(() => { if (!document.hidden) ngRefresh(true); }, 5 * 60000);
