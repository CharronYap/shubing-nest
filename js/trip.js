/* 出遊背景（2026-11-26）：拍照的預覽下面多一排「房間／公園／海邊／夜市」。
   選了之後重拍一張：娃娃照房間裡的位置站著，背景換成那個地方（牆、地板、窗戶、家具都不畫）。
   只是換背景，不是新房間；不用存檔、不花幣。背景是用 canvas 自己畫的。
   出遊的照片不能當明信片寄（明信片是把房間重新擺出來）。 */
const TRIPS = {
  park: {name: '公園', paint(ctx, W, H, wh){
    ctx.fillStyle = grad(ctx, 0, wh, '#bfe8ff', '#eaf8ff'); ctx.fillRect(0, 0, W, wh);
    dot(ctx, W * .82, wh * .22, W * .06, '#ffe27a');
    [[.16, .34, 1], [.52, .2, .8]].forEach(([x, y, k]) => { ctx.fillStyle = '#fff'; [[0, 0, 22], [20, 4, 17], [-20, 5, 15]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(W * x + dx * k, wh * y + dy * k, r * k, 0, 7); ctx.fill(); }); });
    ctx.fillStyle = '#cdeeb4'; ctx.beginPath(); ctx.ellipse(W * .3, wh, W * .5, wh * .2, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#bfe6a0'; ctx.beginPath(); ctx.ellipse(W * .8, wh, W * .4, wh * .16, 0, Math.PI, 0); ctx.fill();
    [[.1, 1.1], [.9, .95], [.68, .7]].forEach(([x, k]) => {
      const bx = W * x, by = wh + 4, tw = W * .03 * k, th = wh * .34 * k;
      ctx.fillStyle = '#a8714f'; ctx.fillRect(bx - tw / 2, by - th, tw, th);
      [[0, -th, W * .11], [-W * .07, -th * .82, W * .08], [W * .07, -th * .82, W * .08]].forEach(([dx, dy, r]) => dot(ctx, bx + dx * k, by + dy, r * k, '#8fd47a'));
      dot(ctx, bx - W * .03 * k, by - th * 1.04, W * .02 * k, '#b8e986');
    });
    ctx.fillStyle = grad(ctx, wh, H, '#a6dc86', '#8fcf6e'); ctx.fillRect(0, wh, W, H - wh);
    ctx.fillStyle = '#f3e3c0'; ctx.beginPath(); ctx.moveTo(W * .42, wh); ctx.lineTo(W * .58, wh); ctx.lineTo(W * .86, H); ctx.lineTo(W * .14, H); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 16; i++){ const x = (i * 97 % 100) / 100 * W, y = wh + ((i * 53 % 100) / 100) * (H - wh); if (x > W * .2 && x < W * .8) continue; dot(ctx, x, y, 4, i % 2 ? '#ffb3d3' : '#fff6c4'); dot(ctx, x, y, 1.6, '#ffd75e'); }
  }},
  beach: {name: '海邊', paint(ctx, W, H, wh){
    ctx.fillStyle = grad(ctx, 0, wh * .7, '#9edcff', '#dff4ff'); ctx.fillRect(0, 0, W, wh * .7);
    dot(ctx, W * .2, wh * .2, W * .07, '#fff3b0');
    ctx.fillStyle = '#fff'; [[.62, .16, 20], [.68, .18, 15], [.56, .19, 14]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(W * x, wh * y, r, 0, 7); ctx.fill(); });
    ctx.fillStyle = grad(ctx, wh * .7, wh + 20, '#6cc6ee', '#a8e3f7'); ctx.fillRect(0, wh * .7, W, wh * .3 + 20);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let j = 0; j < 3; j++){ ctx.globalAlpha = .5 + j * .2; ctx.beginPath(); for (let x = -10; x < W + 20; x += 24){ const y = wh * (.78 + j * .08); ctx.moveTo(x + j * 8, y); ctx.quadraticCurveTo(x + 6 + j * 8, y - 6, x + 12 + j * 8, y); } ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad(ctx, wh, H, '#f8e8c0', '#f2d9a4'); ctx.fillRect(0, wh + 12, W, H - wh);
    ctx.fillStyle = '#fff'; ctx.beginPath(); for (let x = 0; x <= W; x += 30){ ctx.arc(x, wh + 12, 17, 0, Math.PI); } ctx.fill();
    for (let i = 0; i < 14; i++){ const x = (i * 71 % 100) / 100 * W, y = wh + 40 + ((i * 37 % 100) / 100) * (H - wh - 50); dot(ctx, x, y, 3, i % 3 ? '#e6c98a' : '#ffc2d9'); }
  }},
  market: {name: '夜市', paint(ctx, W, H, wh){
    ctx.fillStyle = grad(ctx, 0, wh, '#2f3478', '#5a5fb0'); ctx.fillRect(0, 0, W, wh);
    for (let i = 0; i < 18; i++) dot(ctx, (i * 59 % 100) / 100 * W, (i * 31 % 100) / 100 * wh * .5, 1.4, '#fff');
    const cols = [['#ff9cc8', '#e0609d'], ['#ffd75e', '#d99a00'], ['#8fd3ef', '#4a9fd0']];
    cols.forEach(([a, b], k) => {
      const x = W * (.04 + k * .33), w = W * .26, top = wh * .46, hh = wh * .54;
      ctx.fillStyle = '#fff6ea'; ctx.fillRect(x, top + hh * .26, w, hh * .74);
      ctx.fillStyle = '#6b4a3a'; ctx.fillRect(x, top + hh * .62, w, hh * .38);
      const n = 6; for (let i = 0; i < n; i++){ ctx.fillStyle = i % 2 ? '#fff' : a; ctx.beginPath(); ctx.moveTo(x + w / n * i, top); ctx.lineTo(x + w / n * (i + 1), top); ctx.lineTo(x + w / n * (i + 1), top + hh * .22); ctx.arc(x + w / n * (i + .5), top + hh * .22, w / n / 2, 0, Math.PI); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = b; ctx.fillRect(x, top - 4, w, 5);
      dot(ctx, x + w * .3, top + hh * .46, w * .09, a); dot(ctx, x + w * .7, top + hh * .46, w * .09, '#fff3b0');
    });
    ctx.strokeStyle = '#3a2a35'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, wh * .2); ctx.quadraticCurveTo(W / 2, wh * .42, W, wh * .2); ctx.stroke();
    for (let i = 0; i <= 10; i++){ const t = i / 10, x = W * t, y = wh * (.2 + .44 * t * (1 - t)); dot(ctx, x, y + 7, 9, 'rgba(255,230,150,.35)'); dot(ctx, x, y + 7, 5, ['#ffd75e', '#ff9cc8', '#8fd3ef', '#b8e986'][i % 4]); }
    ctx.fillStyle = grad(ctx, wh, H, '#7d74a8', '#5f5890'); ctx.fillRect(0, wh, W, H - wh);
    [[.18, .2], [.5, .5], [.82, .25]].forEach(([x, y]) => { const g = ctx.createRadialGradient(W * x, wh + (H - wh) * y, 0, W * x, wh + (H - wh) * y, W * .3); g.addColorStop(0, 'rgba(255,226,150,.4)'); g.addColorStop(1, 'rgba(255,226,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, wh, W, H - wh); });
  }},
};
let photoBgSel = 'room';
const tripBg = () => (typeof VISIT !== 'undefined' && VISIT ? null : TRIPS[photoBgSel] || null);
// 預覽下面那一排
function tripRow(){
  return `<div class="ph-bgs" role="group" aria-label="換背景">${[['room', '房間'], ...Object.entries(TRIPS).map(([k, t]) => [k, t.name])].map(([k, n]) => `<button class="ng-chip ${photoBgSel === k ? 'on' : ''}" data-phbg="${k}" aria-pressed="${photoBgSel === k}">${n}</button>`).join('')}</div>`;
}
function tripWire(o){
  o.querySelectorAll('[data-phbg]').forEach(b => { b.onclick = () => { if (photoBgSel === b.dataset.phbg) return; photoBgSel = b.dataset.phbg; o.remove(); setTimeout(photoTake, 80); }; });
}
