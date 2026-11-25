/* 封面：每次打開先看到封面，按薯餅進房間，右上角直接去娃娃機 */
(() => {
  const cover = $('#cover');
  if (!cover) return;
  $('#coverTitle').innerHTML = [...'薯餅的小窩'].map(c => `<span class="cv-t"><i></i><span>${c}</span></span>`).join('');
  $('#coverClaw').innerHTML = CLAW_ICON;

  // 375×780 的畫布照畫面大小縮放，地板帶跟著一起縮
  const fit = () => {
    const k = Math.min(cover.clientWidth / 375, cover.clientHeight / 780);
    cover.style.setProperty('--k', k.toFixed(4));
  };
  fit();
  addEventListener('resize', fit);

  const close = () => {
    if (cover.classList.contains('cv-out')) return;
    cover.classList.add('cv-out');
    const done = () => { cover.hidden = true; };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) done();
    else setTimeout(done, 460);
  };
  $('#coverGo').addEventListener('click', () => { music.start(); setPage('room'); close(); });
  $('#coverClaw').addEventListener('click', () => { music.start(); setPage('claw'); close(); });
})();
