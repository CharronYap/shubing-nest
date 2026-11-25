/* 賺幣（2026-11-27）
   第一步：幣不夠、或點上面的幣時，列出「現在就能做、做了就有幣」的事，點了直接過去。
     每天領 20 枚、小事一件 3 枚、每天第一次夾不用幣的數字在 data.js 和 claw.js。
   不懲罰、不催人：這張清單只在你自己點開、或幣真的不夠時出現，不會自己跳出來。 */
const EARN_ICON = COIN;
// 現在能賺幣的事。每一項 {ic, t, s, n:大約幾枚, go:點了做什麼}；off = 今天做完了，列出來讓人知道明天還有
function earnList(){
  const L = [], t = todayStr();
  planDay();
  const ev = pending();
  if (ev.length) L.push({ic: `<img src="${SPR[ev[0].d[0]]}" alt="">`, t: `還有 ${ev.length} 件小事`, s: `做完一件 ${EVENT_COINS} 枚`, go: () => { setPage('room'); openEvents(); }});
  const a = S.away;
  if (a && a.drops && a.drops.length && (a.date !== t || (a.picked || 0) < 3)){
    const r = a.drops[0].r, left = a.date === t ? 3 - (a.picked || 0) : 3;
    L.push({ic: DROP_SVG[a.drops[0].k], t: `${{living: '客廳', bed: '臥室', bath: '浴室'}[r] || '房間'}地上有東西沒撿`, s: `今天還能撿 ${Math.min(left, a.drops.length)} 個，一個 1 枚`, go: () => { setPage('room'); $('#sheet').hidden = true; if (roomId !== r) goRoom(r); }});
  }
  const m = S.mail;
  const coins = m ? m.l.filter(o => o.a && !o.g && o.a.startsWith('coin-')).reduce((n, o) => n + (+o.a.slice(5) || 0), 0) : 0;
  if (coins) L.push({ic: MAIL_ICON, t: '信箱裡有幣還沒收', s: `${coins} 枚`, go: () => { setPage('room'); openMail(); }});
  if (!S.day.free) L.push({ic: CLAW_ICON, t: '今天第一次夾娃娃', s: '不用幣', go: () => { $('#sheet').hidden = true; setPage('claw'); }});
  if (typeof earnMore === 'function') earnMore(L);   // 第二步的小遊戲、打工、收成接在這裡
  return L;
}
let erList = [];
// short：幣不夠時跳出來的，最上面多一句
function earnOpen(short){
  if (VISIT) return;
  erList = earnList();
  const rows = erList.map((x, i) => `<div class="er-it ${x.off ? 'off' : ''}"><span class="ic">${x.ic}</span><span class="tx2"><b>${x.t}</b><small>${x.s}</small></span>${x.go ? `<button class="btn y sm" data-er="${i}">${x.btn || '去看看'}</button>` : ''}</div>`).join('');
  const none = `<p class="er-hi">今天能賺的都做完了。明天打開會有 ${DAILY_COINS} 枚，第一次夾娃娃也不用幣。</p>`;
  openSheet(`<div class="hd">${EARN_ICON}<span>${short ? '幣不夠了' : `現在有 ${S.coins} 枚幣`}</span></div>
    <div class="er-box">${erList.length ? `<p class="er-hi">${short ? '夾一次要 ' + COST + ' 枚。現在還有這些事可以賺：' : '現在可以賺幣的事：'}</p>${rows}` : none}</div>`);
  evOpen = false; alOpen = false;
}
$('#sheet').addEventListener('click', e => {
  const b = e.target.closest('[data-er]'); if (!b) return;
  const x = erList[+b.dataset.er]; if (x && x.go) x.go();
});
$('#coinPill').addEventListener('click', () => earnOpen(false));
$('#coinPill').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); earnOpen(false); } });
