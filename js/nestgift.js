/* 送娃娃（第四版）：夾到家裡已經有的娃娃，那一隻可以留著送給好友（DOLL_N = 2，見 js/earn.js dollGain）。入口在信箱、娃娃機的店員、獎品卡。
   朋友收到自己已經有的：他沒有留著的就留著當店員，已經留著一隻了就換成 3 枚幣，信裡會寫。
   不懲罰、不催人：送出去的娃娃會一直在朋友門口等，不會過期、不會自己退回；朋友多久沒領都不會怎樣。
   朋友讓牠進門之前，寄的人隨時可以收回。
   雲端：nestGifts/{id} = {from, fromName, to, toName, doll, line, t, msg}（js/cloud.js，規則在 firestore.rules）
   第五版：那句話可以自己打（msg，40 字以內，可以不填）；原本寫好的 6 句留著當「快速選」。有 msg 就顯示 msg，沒有照舊用 line。
     自己打的字走 txSlot（textContent），不接進 innerHTML；領了之後放在信的代號最後（;x=）。
   不用 transaction，照這個順序做：
     寄：先寫 nestGifts，成功了才把自己的數量減一
     領：先確認還在 → 加進自己的存檔、編號記進 S.mail.gin → 存檔 → 再刪 nestGifts
     收回：先確認還在 → 刪 nestGifts → 自己的數量加一
   收回和領取幾乎同時按下去時，兩邊可能都多一隻；存檔是自己的，有人改存檔多送，這個遊戲不防。
   S.mail.gout = {d:'日期', n:今天送了幾次}   S.mail.gin = [領過的 nestGifts 編號]（最多留 60 個）
   一次最多 3 隻在朋友門口等、一天最多送 3 次，只在畫面這邊擋。去朋友家時不能用。 */
const NG_MAX_OUT = 3, NG_MAX_DAY = 3, NG_LEN = 40;
const ngX = g => (g && typeof g.msg === 'string' && sText(g.msg, NG_LEN) ? encodeURIComponent(sText(g.msg, NG_LEN)) : '');
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
    a.filter(g => gin.includes(g.id)).forEach(g => sAfterSave(() => net.delGift(g.id)));   // 等存檔上了雲端才刪
    ngIn = a.filter(g => ngOk(g) && !gin.includes(g.id)).sort((x, y) => x.t - y.t);
    ngOut = b.filter(ngOk).sort((x, y) => y.t - x.t);
    ngLoaded = true;
  } catch (e) { console.info('[nestgift] 讀不到送娃娃（規則可能還沒發布）', e && e.code); return; }
  mailBadge();
  if (redraw && ngSheetOpen('.ml-box')) openMail(true);
}

/* ---------- 信箱裡的區塊 ---------- */
function ngInCard(g){
  const w = ngName(g.fromName), have = DOLL_N[g.doll] || 0;
  // 家裡已經有這一隻：開門之前先講清楚會怎麼樣
  const x = {d: g.doll, type: 'gift', body: mailFill(MAIL_TPL[g.doll].gift[0], {w, m: g.line, x: ngX(g)}) + (have ? '\n' + mailGiftNote(g.doll, have >= 2 ? 2 : 1, true) : '')};
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
      const got = dollGain(g.doll);   // 'new' 第一隻、'spare' 留著當店員、'coin' 換成幣
      const w = ngName(g.fromName), t = todayStr(), k = `${g.doll}.gift.0#w=${w};m=${Math.max(0, Math.min(5, g.line | 0))}${got === 'spare' ? ';e=1' : got === 'coin' ? ';e=2' : ''}${ngX(g) ? ';x=' + ngX(g) : ''}`;
      m.gin.push(id); if (m.gin.length > 60) m.gin.splice(0, m.gin.length - 60);
      // 變成一封看過的信，相簿「寫給你的信」會留下「從○○家來的」；不算在一天一封裡
      m.l.unshift({k, t, r: 1, a: null, g: 0});
      if (typeof mailTrim === 'function') mailTrim(m.l);
      const ar = m.arch[g.doll] = m.arch[g.doll] || [];
      ar.push(`${t}|${k}`); if (ar.length > MAIL_ARCH) ar.splice(0, ar.length - MAIL_ARCH);
      save();
      net.push().catch(() => {});
      toast(got === 'spare' ? `${DOLL_NAME[g.doll]}進來了。家裡已經有一隻，這隻先在娃娃機當店員` : got === 'coin' ? `家裡的${DOLL_NAME[g.doll]}夠了，這隻換成 ${SPARE_COIN} 枚幣` : `${DOLL_NAME[g.doll]}進來了`);
      if (typeof earnClerks === 'function') earnClerks();
      if (typeof memoAdd === 'function') memoAdd('giftIn', g.from, g.fromName, {id: 'gi' + id, d: g.doll});
    }
    ngIn = ngIn.filter(x => x.id !== id);
    // 娃娃已經進自己的存檔了：等那份存檔上了雲端，才刪朋友寄來的那一筆（沒存成功就先留著，下次再刪）
    sAfterSave(() => net.delGift(id));
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
    const got = dollGain(g.doll);   // 等牠的時候又夾到一隻留著：回來的這隻換成幣
    ngOut = ngOut.filter(x => x.id !== id);
    save(); if (typeof render === 'function') render();
    toast(got === 'coin' ? `${DOLL_NAME[g.doll]}回來了。已經留著一隻，這隻換成 ${SPARE_COIN} 枚幣` : `${DOLL_NAME[g.doll]}回來了，先在娃娃機當店員`);
    if (typeof earnClerks === 'function') earnClerks();
  } catch (e) { toast(ngErr(e)); }
  finally { ngBusy = false; if (ngSheetOpen('.ml-box')) openMail(true); }
}

/* ---------- 送出去 ---------- */
async function ngOpenPick(){
  const net = ngNet(); if (!net) return;
  ngPick = ngPick || {doll: null, to: null, m: null, msg: ''};
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
  else if (!can.length) stop = '現在沒有可以送的娃娃。夾到家裡已經有的娃娃時，那一隻就可以留著送給朋友。';
  else if (!loading && !ngFriends.length) stop = '還沒有好友。在帳號那裡輸入朋友的好友碼，加了之後就能送。';
  if (p.doll && !can.includes(p.doll)) p.doll = null;
  // 自己打的字要對方加過你才送得出去（firestore.rules）；還沒加的只能選寫好的句子
  const ngCanType = () => { const f = ngFriends.find(x => x.uid === p.to); return !f || f.hasMe !== false; };
  const said = () => p.m !== null || (ngCanType() && !!sText(p.msg, NG_LEN));
  const ready = !stop && !loading && p.doll && p.to && said();
  openSheet(`<div class="hd ml-top">${MAIL_ICON}<span>送娃娃給朋友</span><small>今天還能送 ${Math.max(0, NG_MAX_DAY - today)} 次</small></div>
    <div class="ng-box">${stop ? `<p class="al-em">${stop}</p>` : `
      <div class="al-sec">送哪一隻</div>
      <div class="ng-dolls">${can.map(d => `<button class="tile ${p.doll === d ? 'on' : ''}" data-ngd="${d}" aria-label="${DOLL_NAME[d]}" aria-pressed="${p.doll === d}"><img src="${SPR[d]}" alt=""></button>`).join('')}</div>
      <small class="bk-note">送的是留著等送人的那一隻，家裡原本的那隻不會動。</small>
      <div class="al-sec">送給誰</div>
      <div class="ng-chips">${loading ? '<p class="al-em">找好友中……</p>' : ngFriends.map(f => `<button class="ng-chip ${p.to === f.uid ? 'on' : ''}" data-ngf="${f.uid}" aria-pressed="${p.to === f.uid}">${ngName(f.name)}</button>`).join('')}</div>
      <div class="al-sec">想跟朋友說的話</div>
      <div class="ng-chips">${MAIL_GIFT_LINES.map((l, i) => `<button class="ng-chip ${p.m === i ? 'on' : ''}" data-ngm="${i}" aria-pressed="${p.m === i}">${l}</button>`).join('')}</div>
      ${ngCanType() ? `<input class="tx-in ng-in" type="text" maxlength="${NG_LEN}" placeholder="或是自己寫一句" aria-label="自己寫一句，${NG_LEN} 字以內">
      <small class="bk-note">自己寫了就用自己寫的；沒寫就用上面選的那一句。</small>` : '<small class="bk-note">這位朋友還沒加你為好友，先用上面寫好的句子；等他加你之後就能自己寫。</small>'}`}
    </div>
    <div class="ml-ft"><button class="btn" data-ng="mail">返回</button>${stop ? '' : `<button class="btn y" data-ng="send" ${ready ? '' : 'disabled'}>送出</button>`}</div>`);
  // 打字時不整個重畫（游標會跑掉），只更新「送出」能不能按
  const inp = $('#sheet .ng-in'), go = $('#sheet [data-ng="send"]');
  if (inp){ inp.value = p.msg || ''; inp.oninput = () => { p.msg = inp.value; if (go) go.disabled = !(!loading && p.doll && p.to && said()); }; }
}
async function ngSend(){
  const net = ngNet(), p = ngPick; if (!net || ngBusy || !p || !p.doll || !p.to) return;
  const tf = ngFriends.find(f => f.uid === p.to);
  const msg = tf && tf.hasMe === false ? '' : sText(p.msg, NG_LEN), line = p.m === null ? 0 : p.m;
  if (p.m === null && !msg) return;
  if ((DOLL_N[p.doll] || 0) < 2 || ngOut.length >= NG_MAX_OUT || ngSentToday() >= NG_MAX_DAY){ ngPaint(false); return; }
  ngBusy = true;
  const to = ngFriends.find(f => f.uid === p.to), w = ngName(to && to.name);
  try {
    const id = await net.sendGift({to: p.to, toName: w, doll: p.doll, line, fromName: ngName(net.me.name), msg});
    // 寫進 nestGifts 成功了才減
    DOLL_N[p.doll]--; ngMail().gout.n++; if (typeof earnClerks === 'function') earnClerks();
    ngOut.unshift({id, from: net.me.uid, to: p.to, toName: w, doll: p.doll, line, t: Date.now(), ...(msg ? {msg} : {})});
    save(); if (typeof render === 'function') render();
    toast(`${DOLL_NAME[p.doll]}出發去${w}家了`);
    ngPick = null;
    if (typeof frOpen === 'function') frOpen('out'); else openMail(true);
  } catch (e) {
    // 雲端規則還沒收 msg 這一欄時，自己寫的送不出去：說一聲，娃娃不會被扣
    if (msg && e && e.code === 'permission-denied'){ console.info('[nestgift] msg 還送不出去', e.code); toast('自己寫的話現在還送不出去，把字清掉、用上面選的就可以送'); }
    else toast(ngErr(e));
  }
  finally { ngBusy = false; }
}

$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.ng === 'in') ngClaim(b.dataset.id);
  else if (b.dataset.ng === 'back') ngBack(b.dataset.id);
  else if (b.dataset.ng === 'pick') ngOpenPick();
  else if (b.dataset.ng === 'mail'){ if (typeof frOpen === 'function') frOpen(); else openMail(true); }
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
