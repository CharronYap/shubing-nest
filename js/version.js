/* 版本和「有新版」的提示（2026-11-27）。
   版本字串在 index.html 最前面的 NEST_V，每次推上去換一次；所有 css 和 js 的網址都帶著它，手機才不會一直用快取裡的舊檔。
   - 小窩指南最下面顯示版本（js/guide.js），使用者截圖回報時看得出是不是最新的。
   - 開著的頁面回到前景時抓一次 index.html（不走快取），裡面的版本跟現在的不一樣，就跳一條「小窩有新的樣子，點一下換上」。
     點了才重新整理，不會自己偷偷重整。同一個新版只問一次（關掉就不再跳，下一個新版才會再問）。 */
const nestVer = () => (typeof NEST_V === 'string' ? NEST_V : '');
let verSeen = '', verBusy = false;
async function verCheck(){
  if (document.hidden || verBusy || !nestVer()) return;
  verBusy = true;
  try {
    const r = await fetch('index.html?t=' + Date.now(), {cache: 'no-store'});
    const m = r.ok ? /NEST_V\s*=\s*'([^']+)'/.exec(await r.text()) : null;
    if (m && m[1] !== nestVer() && m[1] !== verSeen){ verSeen = m[1]; verShow(m[1]); }
  } catch (e) {}
  verBusy = false;
}
function verShow(v){
  const old = document.getElementById('verBar'); if (old) old.remove();
  const b = document.createElement('div'); b.id = 'verBar'; b.className = 'verbar';
  b.innerHTML = '<button class="vb-go">小窩有新的樣子，點一下換上</button><button class="vb-x" aria-label="先不要">×</button>';
  b.querySelector('.vb-go').onclick = () => {
    try { if (typeof writeLocal === 'function') writeLocal(); } catch (e) {}
    // 網址多帶一個參數，確定抓到的是新的 index.html
    const u = new URL(location.href); u.searchParams.set('r', v); location.replace(u.href);
  };
  b.querySelector('.vb-x').onclick = () => b.remove();
  document.getElementById('screen').appendChild(b);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) verCheck(); });
setTimeout(verCheck, 90000);
setInterval(verCheck, 20 * 60000);
