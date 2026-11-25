/* 背景音樂：要按過畫面才會開始放，音量放小；開或關記在這台裝置 */
const music = (() => {
  const KEY = 'shubingNest.music';
  const VOL = 0.32;
  const a = new Audio('audio/apple_cider.m4a');
  a.loop = true; a.preload = 'none'; a.volume = VOL;
  let on = true, started = false;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) {}

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
  return { start };
})();
