/* 背景音樂：一打開就試著放；瀏覽器不准自己出聲（手機一定會擋）就等第一次碰畫面再放。
   音量放小；開或關記在這台裝置，關掉的人什麼都不做 */
const music = (() => {
  const KEY = 'shubingNest.music';
  const VOL = 0.32;
  const a = new Audio('audio/apple_cider.m4a');
  a.loop = true; a.preload = 'none'; a.volume = VOL;
  let on = true, started = false;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) {}
  // 先下載好，碰到畫面時馬上有聲音
  if (on){ a.preload = 'auto'; a.load(); }

  const paint = () => document.querySelectorAll('.mbtn').forEach(b => {
    b.classList.toggle('off', !on);
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', on ? '關掉音樂' : '打開音樂');
  });
  const play = () => { if (on && !document.hidden) a.play().catch(() => {}); };
  const start = () => { started = true; play(); };
  const toggle = () => {
    // 還沒開始放時，第一次按就是開始放，不是關掉
    if (on && !started){ start(); return; }
    on = !on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
    paint();
    if (on){ started = true; play(); } else a.pause();
  };
  document.querySelectorAll('.mbtn').forEach(b => b.addEventListener('click', toggle));
  // 切到別的分頁或鎖螢幕時先停，回來再接著放
  document.addEventListener('visibilitychange', () => { if (document.hidden) a.pause(); else if (started) play(); });
  paint();

  // 第一次碰畫面任何地方（封面也算）就開始放；碰的是音樂按鈕就交給按鈕自己處理
  const EVS = ['pointerdown', 'keydown'];
  const first = e => {
    if (!started && on && e.target.closest && e.target.closest('.mbtn')) return;
    EVS.forEach(t => document.removeEventListener(t, first, true));
    if (!started && on) start();
  };
  const waitTouch = () => EVS.forEach(t => document.addEventListener(t, first, true));
  if (on){
    if (document.hidden) waitTouch();
    else a.play().then(() => { started = true; }).catch(waitTouch);   // 被擋就安靜等
  }
  return { start };
})();
