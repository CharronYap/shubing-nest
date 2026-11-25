/* 薯餅的小窩：娃娃機 */
const W = 360, H = 440, RAIL = 74, FLOOR = 410, CHUTE = {x0:16, x1:100, top:318};
const HOME = RAIL + 44; // 爪子平常停的高度（機身在軌道下面）
const POW = { mid:{p:.4, slip:1/3} };   // 約 40% 夾到；沒夾到的有三分之一演成半路掉下去
let pow = 'mid';
const RM = REDUCE;
const imgs = {};
const cv = $('#claw'); let g = cv.getContext('2d');
let toys = [];
const claw = { x:58, y:HOME, open:1, state:'idle', hold:null, dir:0, t:0, plan:null };

// 機台裡的東西：娃娃，或是扭蛋（裡面是鎖住的家具、壁紙，或願望道具）
const CAP_RATE = .2;
function pickToy(){ return Math.random() < CAP_RATE ? 'cap' : DOLLS[Math.floor(Math.random()*DOLLS.length)]; }
function pile(){
  toys = [];
  const spots = [[140,392],[190,396],[240,392],[290,396],[330,390],[165,354],[215,350],[265,356],[310,352],[238,316]];
  spots.forEach(([x,y]) => toys.push({ t:pickToy(), x:x+(Math.random()*10-5), y, s:66+Math.random()*8, r:(Math.random()-.5)*.35, vy:0, wob:0 }));
}
function refill(){
  if (toys.filter(t=>!t.gone).length >= 9) return;
  const x = 150 + Math.random()*170;
  toys.push({ t:pickToy(), x, y:RAIL+60, s:66+Math.random()*8, r:(Math.random()-.5)*.35, vy:0, wob:0, fall:true, rest:restY(x) });
}
function restY(x){ // 簡單的堆疊高度
  let y = 396;
  for (const t of toys) if (!t.gone && !t.held && !t.fall && Math.abs(t.x-x) < 34) y = Math.min(y, t.y - 38);
  return Math.max(y, 250);
}
function fit(){
  const d = Math.min(3, devicePixelRatio||1), r = cv.getBoundingClientRect();
  const w = Math.round(r.width*d), h = Math.round(r.height*d);
  if (cv.width!==w || cv.height!==h){ cv.width=w; cv.height=h; }
  g.setTransform(cv.width/W,0,0,cv.height/H,0,0);
}
function rr(x,y,w,h,r){ g.beginPath(); g.roundRect ? g.roundRect(x,y,w,h,r) : g.rect(x,y,w,h); }
let tick = 0;
function drawCabinet(){
  // 外框
  let gr = g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#ff9ccb'); gr.addColorStop(1,'#ff5aa5');
  g.fillStyle = gr; rr(0,0,W,H,22); g.fill();
  // 招牌
  g.fillStyle = '#fff3c4'; rr(14,10,W-28,40,16); g.fill();
  for (let i=0;i<12;i++){ const on = RM ? i%2===0 : ((i + Math.floor(tick/30)) % 3 === 0);
    g.fillStyle = on ? '#ffc928' : '#ffe8f2'; g.beginPath(); g.arc(30 + i*27.3, 30, 5, 0, 7); g.fill(); }
  // 招牌上的小蛋
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(W/2, 30, 13, 16, 0, 0, 7); g.fill();
  g.fillStyle = '#ffc928'; g.beginPath(); g.arc(W/2, 33, 7, 0, 7); g.fill();
  // 玻璃內部
  gr = g.createLinearGradient(0,58,0,H-14); gr.addColorStop(0,'#fffafd'); gr.addColorStop(1,'#ffe1ef');
  g.fillStyle = gr; rr(12,58,W-24,H-72,16); g.fill();
  // 底部地板
  g.fillStyle = '#ffd1e6'; rr(12,FLOOR,W-24,H-14-FLOOR,[0,0,16,16]); g.fill();
  // 軌道
  g.fillStyle = '#e14f93'; rr(22,RAIL-6,W-44,8,4); g.fill();
  g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(26,RAIL-5,W-52,2);
}
function drawChute(front){
  if (!front){
    g.fillStyle = 'rgba(225,79,147,.18)'; rr(CHUTE.x0, CHUTE.top, CHUTE.x1-CHUTE.x0, FLOOR-CHUTE.top+6, 8); g.fill();
    return;
  }
  // 透明壓克力牆
  g.fillStyle = 'rgba(255,255,255,.5)'; rr(CHUTE.x0, CHUTE.top, CHUTE.x1-CHUTE.x0, FLOOR-CHUTE.top, 8); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#ff6fb0'; rr(CHUTE.x0+8, CHUTE.top+28, CHUTE.x1-CHUTE.x0-16, 22, 11); g.fill();
  g.fillStyle = '#fff'; g.font = '800 12px "PingFang TC",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.fillText('出口', (CHUTE.x0+CHUTE.x1)/2, CHUTE.top+39.5);
}
function drawCap(s){
  const r = s*0.34;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(0,0,r,0,7); g.fill();
  g.fillStyle = '#ff9cc8'; g.beginPath(); g.arc(0,0,r,Math.PI,0); g.closePath(); g.fill();
  g.strokeStyle = '#e14f93'; g.lineWidth = 2.4; g.beginPath(); g.arc(0,0,r,0,7); g.stroke();
  g.beginPath(); g.moveTo(-r,0); g.lineTo(r,0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-r*.4,-r*.5,r*.25,r*.13,-.5,0,7); g.fill();
  heart(0, r*.48, r*.22, '#ffc2dc');
}
function drawToy(t){
  if (t.t === 'cap'){ g.save(); g.translate(t.x, t.y); g.rotate(t.r + Math.sin(t.wob)*0.18*(t.wobA||0)); drawCap(t.s); g.restore(); return; }
  const im = imgs[t.t]; if (!im) return;
  g.save(); g.translate(t.x, t.y); g.rotate(t.r + Math.sin(t.wob)*0.18*(t.wobA||0));
  g.drawImage(im, -t.s/2, -t.s/2, t.s, t.s); g.restore();
}
/* ---------- 爪子：五種樣子（形狀和轉軸都一樣，只換外觀） ---------- */
let clawStyle = S.clawStyle;
function armAt(x, y, th, s, fn){ g.save(); g.translate(x + s*6, y + 4); g.scale(s, 1); g.rotate(th); fn(); g.restore(); }
function curve(){ g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(20,2,26,14); g.quadraticCurveTo(33,30,30,44); g.quadraticCurveTo(28,57,20,61); }
function cable(x, rail, y, col, w){ g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x, rail); g.lineTo(x, y); g.stroke(); }
function heart(cx, cy, r, col){ g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy+r*0.9); g.bezierCurveTo(cx-r*1.3, cy, cx-r*0.8, cy-r*1.1, cx, cy-r*0.45); g.bezierCurveTo(cx+r*0.8, cy-r*1.1, cx+r*1.3, cy, cx, cy+r*0.9); g.fill(); }
function eyes(x, ey, gap, holding, blink, ink){
  g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 1.8;
  for (const s of [-1,1]){
    const ex = x + s*gap;
    if (holding){ g.beginPath(); g.arc(ex, ey+1.2, 2.6, Math.PI*1.15, Math.PI*1.85); g.stroke(); }
    else if (blink){ g.beginPath(); g.moveTo(ex-2.2, ey); g.lineTo(ex+2.2, ey); g.stroke(); }
    else { g.fillStyle = ink; g.beginPath(); g.ellipse(ex, ey, 1.9, 2.4, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex+0.6, ey-0.9, 0.7, 0, 7); g.fill(); }
  }
}
function wmouth(x, my, ink){ g.beginPath(); g.moveTo(x-2.4, my); g.quadraticCurveTo(x-1.2, my+2, x, my+0.2); g.quadraticCurveTo(x+1.2, my+2, x+2.4, my); g.strokeStyle = ink; g.lineWidth = 1.3; g.stroke(); }
function blush(x, by, dx, col){ g.fillStyle = col; g.beginPath(); g.ellipse(x-dx, by, 3, 1.9, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x+dx, by, 3, 1.9, 0, 0, 7); g.fill(); }
function star(cx, cy, r){ g.beginPath(); for (let i = 0; i < 10; i++){ const a = -Math.PI/2 + i*Math.PI/5, d = i%2 ? r*0.48 : r; g.lineTo(cx + Math.cos(a)*d, cy + Math.sin(a)*d); } g.closePath(); }

const CLAW_STYLES = {
  // 蛋蛋：白蛋小臉、頭上蝴蝶結、黃爪粉紅小球
  egg(x, y, open, holding, blink, rail){
    cable(x, rail, y-44, '#f08cbc', 2.4);
    g.fillStyle = '#e14f93'; rr(x-15, rail-11, 30, 15, 7.5); g.fill();
    heart(x, rail-4.5, 4, '#fff');
    const th = 0.38 - open*0.62;
    for (const s of [-1,1]) armAt(x, y, th, s, () => {
      curve(); g.strokeStyle = '#e89a2e'; g.lineWidth = 9; g.stroke();
      curve(); g.strokeStyle = '#ffd95e'; g.lineWidth = 5.6; g.stroke();
      g.beginPath(); g.moveTo(8,1.5); g.quadraticCurveTo(19,3.5,23,11); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.8; g.stroke();
      g.fillStyle = '#ff8fc0'; g.strokeStyle = '#e8669f'; g.lineWidth = 1.6; g.beginPath(); g.arc(19, 61.5, 4.6, 0, 7); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(17.6, 60, 1.3, 0, 7); g.fill();
    });
    g.fillStyle = '#ffd95e'; g.strokeStyle = '#e89a2e'; g.lineWidth = 2; rr(x-13, y-5, 26, 11, 5.5); g.fill(); g.stroke();
    g.fillStyle = '#fffdf8'; g.strokeStyle = '#f3b9d3'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y-20, 15.5, 18, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(x-7, y-28, 3, 5, -0.4, 0, 7); g.fill();
    eyes(x, y-21, 5.5, holding, blink, '#4a2f3a');
    blush(x, y-15.5, 9.5, 'rgba(255,128,180,.55)'); wmouth(x, y-16, '#4a2f3a');
    g.fillStyle = '#ff6fb0'; g.strokeStyle = '#e14f93'; g.lineWidth = 1.4;
    for (const s of [-1,1]){ g.beginPath(); g.moveTo(x, y-38); g.quadraticCurveTo(x+s*10, y-47, x+s*9, y-36); g.quadraticCurveTo(x+s*5, y-34, x, y-38); g.fill(); g.stroke(); }
    g.beginPath(); g.arc(x, y-38, 2.6, 0, 7); g.fill(); g.stroke();
  },
  // 貓掌：橘貓頭、鈴鐺項圈、爪子尖端是有肉球的小貓掌
  cat(x, y, open, holding, blink, rail){
    cable(x, rail, y-40, '#e7b98f', 2.4);
    g.fillStyle = '#f08a3c'; rr(x-15, rail-11, 30, 15, 7.5); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, rail-2.8, 3.2, 2.6, 0, 0, 7); g.fill();
    for (const d of [-3.6, 0, 3.6]){ g.beginPath(); g.arc(x+d, rail-7.2, 1.4, 0, 7); g.fill(); }
    const th = 0.38 - open*0.62;
    for (const s of [-1,1]) armAt(x, y, th, s, () => {
      curve(); g.strokeStyle = '#d9803a'; g.lineWidth = 10; g.stroke();
      curve(); g.strokeStyle = '#fff1df'; g.lineWidth = 6.6; g.stroke();
      g.strokeStyle = '#f5a25a'; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(25,17); g.lineTo(31,15); g.moveTo(28,30); g.lineTo(34,30); g.stroke();
      g.fillStyle = '#fff1df'; g.strokeStyle = '#d9803a'; g.lineWidth = 1.8;
      g.beginPath(); g.ellipse(18.5, 61, 6.4, 5.6, -0.5, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#ff9fbf'; g.beginPath(); g.ellipse(17.6, 62.2, 2.6, 2.1, -0.5, 0, 7); g.fill();
      for (const [px,py] of [[13.6,59.6],[16.2,56.6],[20.4,56.2]]){ g.beginPath(); g.arc(px, py, 1.15, 0, 7); g.fill(); }
    });
    g.fillStyle = '#ff6fb0'; g.strokeStyle = '#e14f93'; g.lineWidth = 1.6; rr(x-13, y-6, 26, 8, 4); g.fill(); g.stroke();
    g.fillStyle = '#ffd23c'; g.strokeStyle = '#d98e00'; g.beginPath(); g.arc(x, y+3, 3.6, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x-2.4, y+3); g.lineTo(x+2.4, y+3); g.stroke();
    g.fillStyle = '#ffb26b'; g.strokeStyle = '#d9803a'; g.lineWidth = 2;
    for (const s of [-1,1]){ g.beginPath(); g.moveTo(x+s*5, y-31); g.lineTo(x+s*14, y-41); g.lineTo(x+s*16, y-23); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle = '#ffc6d8'; for (const s of [-1,1]){ g.beginPath(); g.moveTo(x+s*8, y-31); g.lineTo(x+s*13.2, y-37); g.lineTo(x+s*14, y-27); g.closePath(); g.fill(); }
    g.fillStyle = '#ffb26b'; g.strokeStyle = '#d9803a'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y-19, 17.5, 15, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#fff1df'; g.beginPath(); g.ellipse(x, y-13, 9.5, 6.5, 0, 0, 7); g.fill();
    g.strokeStyle = '#e8853a'; g.lineWidth = 2; g.beginPath(); for (const d of [-4,0,4]){ g.moveTo(x+d, y-33); g.lineTo(x+d*0.7, y-28.5); } g.stroke();
    eyes(x, y-20, 6.5, holding, blink, '#4a2f3a');
    g.fillStyle = '#ff7fa8'; g.beginPath(); g.moveTo(x-1.8, y-15.8); g.lineTo(x+1.8, y-15.8); g.lineTo(x, y-14); g.closePath(); g.fill();
    wmouth(x, y-13.4, '#4a2f3a');
    g.strokeStyle = 'rgba(122,70,40,.55)'; g.lineWidth = 1;
    g.beginPath(); for (const s of [-1,1]){ g.moveTo(x+s*9, y-15); g.lineTo(x+s*16, y-16.5); g.moveTo(x+s*9, y-13); g.lineTo(x+s*16, y-12); } g.stroke();
    blush(x, y-14.5, 12, 'rgba(255,110,150,.45)');
  },
  // 小雞：黃色圓身體、頭上一撮毛、兩邊小翅膀會拍
  chick(x, y, open, holding, blink, rail){
    cable(x, rail, y-42, '#8fcff0', 2.4);
    g.fillStyle = '#4fb3e8'; rr(x-15, rail-11, 30, 15, 7.5); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x-5, rail-3.5, 2.6, 0, 7); g.arc(x, rail-5.5, 3, 0, 7); g.arc(x+5, rail-3.5, 2.6, 0, 7); g.fill();
    const th = 0.38 - open*0.62;
    const toes = () => { g.beginPath(); g.moveTo(20,61); g.lineTo(13.5,62.5); g.moveTo(20,61); g.lineTo(15,56.5); g.moveTo(20,61); g.lineTo(19,66.5); };
    for (const s of [-1,1]) armAt(x, y, th, s, () => {
      curve(); g.strokeStyle = '#e0731a'; g.lineWidth = 8; g.stroke();
      curve(); g.strokeStyle = '#ffa646'; g.lineWidth = 4.6; g.stroke();
      toes(); g.strokeStyle = '#e0731a'; g.lineWidth = 4.2; g.stroke();
      toes(); g.strokeStyle = '#ffa646'; g.lineWidth = 1.8; g.stroke();
    });
    g.fillStyle = '#fff'; g.strokeStyle = '#8fcff0'; g.lineWidth = 2; rr(x-12, y-5, 24, 10, 5); g.fill(); g.stroke();
    const flap = (RM || typeof claw === 'undefined') ? 0 : Math.sin(tick*0.25) * (claw.state === 'idle' ? 0.08 : 0.3);
    g.fillStyle = '#ffd23c'; g.strokeStyle = '#e8a800'; g.lineWidth = 1.8;
    for (const s of [-1,1]){ g.save(); g.translate(x+s*14, y-18); g.rotate(s*(0.5+flap)); g.beginPath(); g.ellipse(s*3, 0, 6, 4, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
    g.fillStyle = '#ffe45e'; g.strokeStyle = '#e8b400'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y-20, 15.5, 17, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(x-7, y-28, 2.8, 4.6, -0.4, 0, 7); g.fill();
    g.strokeStyle = '#e8b400'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, y-36); g.quadraticCurveTo(x-2, y-44, x-6, y-42); g.moveTo(x, y-36); g.quadraticCurveTo(x+1, y-45, x+5, y-44); g.stroke();
    eyes(x, y-23, 5.6, holding, blink, '#3d2a1e');
    g.fillStyle = '#ff8a2a'; g.strokeStyle = '#d9640e'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x-3.6, y-17.5); g.lineTo(x, y-20.2); g.lineTo(x+3.6, y-17.5); g.lineTo(x, y-14.6); g.closePath(); g.fill(); g.stroke();
    blush(x, y-17, 10, 'rgba(255,120,90,.45)');
  },
  // 糖果：馬卡龍身體、拐杖糖條紋爪、尖端小星星、頂上一顆櫻桃
  candy(x, y, open, holding, blink, rail){
    cable(x, rail, y-38, '#9fdcc5', 2.6);
    g.fillStyle = '#5cc9a7'; rr(x-15, rail-11, 30, 15, 7.5); g.fill();
    g.fillStyle = '#fff'; for (const d of [-7,0,7]){ g.beginPath(); g.arc(x+d, rail-3.5, 1.6, 0, 7); g.fill(); }
    const th = 0.38 - open*0.62;
    for (const s of [-1,1]) armAt(x, y, th, s, () => {
      curve(); g.strokeStyle = '#e8669f'; g.lineWidth = 9.4; g.stroke();
      curve(); g.strokeStyle = '#fff'; g.lineWidth = 6.4; g.stroke();
      g.setLineDash([4.2, 4.2]); g.lineCap = 'butt'; curve(); g.strokeStyle = '#ff7fb5'; g.lineWidth = 6.4; g.stroke(); g.setLineDash([]); g.lineCap = 'round';
      star(19.5, 61.5, 6.6); g.fillStyle = '#ffd23c'; g.strokeStyle = '#e09b00'; g.lineWidth = 1.6; g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(18, 59.6, 1.2, 0, 7); g.fill();
    });
    g.fillStyle = '#fff'; g.strokeStyle = '#e8669f'; g.lineWidth = 2; rr(x-12, y-5, 24, 10, 5); g.fill(); g.stroke();
    g.fillStyle = '#b8ecd9'; g.strokeStyle = '#5cc9a7'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(x, y-11, 16.5, 7.5, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#fffaf0'; g.strokeStyle = '#f0d9b5'; g.lineWidth = 1.4;
    g.beginPath(); for (let i = 0; i <= 8; i++) g.lineTo(x-15 + i*3.75, y-16.5 + (i%2 ? 1.6 : -0.4)); g.lineTo(x+15, y-13.5); g.lineTo(x-15, y-13.5); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffc1d9'; g.strokeStyle = '#e8669f'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(x, y-25, 17, 11, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(x-8, y-30, 4, 2, -0.3, 0, 7); g.fill();
    eyes(x, y-25.5, 6, holding, blink, '#4a2f3a');
    blush(x, y-21.5, 10.5, 'rgba(255,90,150,.5)'); wmouth(x, y-22, '#4a2f3a');
    g.strokeStyle = '#3f9a5c'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y-36); g.quadraticCurveTo(x+2, y-42, x+6, y-43); g.stroke();
    g.fillStyle = '#ff4d6d'; g.strokeStyle = '#c4224a'; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y-36.5, 3.6, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x-1.2, y-37.8, 1, 0, 7); g.fill();
  },
  // 金色：照真的娃娃機爪子
  gold(x, y, open, holding, blink, rail){
    cable(x, rail, y-36, '#9c8792', 2);
    g.fillStyle = '#e14f93'; rr(x-16, rail-10, 32, 14, 6); g.fill();
    const th = 0.38 - open*0.62, c = Math.cos(th), sn = Math.sin(th);
    for (const s of [-1,1]){
      const lx = 24*c - 10*sn, ly = 24*sn + 10*c;
      g.strokeStyle = '#5a4630'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x + s*10, y-9); g.lineTo(x + s*(6+lx), y+4+ly); g.stroke();
      armAt(x, y, th, s, () => {
        const path = () => { g.beginPath(); g.moveTo(0,0); g.lineTo(24,10); g.lineTo(30,40); g.quadraticCurveTo(32,57,21,63); };
        path(); g.strokeStyle = '#9a6a00'; g.lineWidth = 5.5; g.stroke();
        path(); g.strokeStyle = '#ffcf3a'; g.lineWidth = 2.6; g.stroke();
        g.fillStyle = '#6b4e00'; g.beginPath(); g.arc(24,10,2.3,0,7); g.fill();
      });
    }
    g.fillStyle = '#8d8a92'; g.fillRect(x-2, y-6, 4, 11);
    g.fillStyle = '#4a3a44'; rr(x-10, y+1, 20, 6, 3); g.fill();
    const gr = g.createLinearGradient(x-12, 0, x+12, 0);
    gr.addColorStop(0, '#a26f00'); gr.addColorStop(.35, '#ffd95a'); gr.addColorStop(.62, '#f2b705'); gr.addColorStop(1, '#8f6100');
    g.fillStyle = gr; rr(x-11, y-34, 22, 30, 4); g.fill();
    g.fillStyle = '#3a2a33'; rr(x-12.5, y-38, 25, 6, 3); g.fill();
    g.fillStyle = '#8a5c00'; rr(x-7, y-29, 5, 7, 1.5); g.fill(); rr(x+2, y-29, 5, 7, 1.5); g.fill();
    g.fillStyle = '#2b2228'; g.fillRect(x-11, y-20, 22, 7);
    g.fillStyle = '#ff6fb0'; g.beginPath(); g.arc(x, y-16.5, 1.8, 0, 7); g.fill();
    g.fillStyle = '#8a5c00'; rr(x-6, y-10, 12, 3, 1.5); g.fill();
    g.fillStyle = '#9a6a00'; rr(x-13, y-6, 26, 4, 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(x-6, y-33, 2, 12);
  },
};
function drawClaw(){
  const holding = toys.some(t => t.held);
  const blink = !RM && claw.state === 'idle' && (tick % 190) < 7;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  CLAW_STYLES[clawStyle](claw.x, claw.y, claw.open, holding, blink, RAIL);
  g.restore();
}
// 選爪子按鈕上的小圖（張開、不動的樣子）
function clawThumbs(){
  document.querySelectorAll('#optClaw canvas').forEach(c => {
    const d = Math.min(3, devicePixelRatio || 1), k = 0.58;
    c.width = 64*d; c.height = 74*d;
    const keep = g; g = c.getContext('2d');
    g.setTransform(d*k, 0, 0, d*k, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round';
    CLAW_STYLES[c.dataset.s](55, 56, 0.85, false, false, 12);
    g = keep;
  });
}
function draw(){
  fit(); tick++;
  g.clearRect(0,0,W,H);
  drawCabinet(); drawChute(false);
  const order = toys.filter(t=>!t.gone && !t.held).sort((a,b)=>a.y-b.y);
  order.forEach(drawToy);
  const h = toys.find(t=>t.held); if (h) drawToy(h);
  drawClaw();
  drawChute(true);
  // 玻璃反光
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(W-70,64); g.lineTo(W-48,64); g.lineTo(W-118,H-20); g.lineTo(W-140,H-20); g.fill();
}


const SPEED = 130;
function topToyAt(x){
  let best = null;
  for (const t of toys) if (!t.gone && !t.fall && Math.abs(t.x - x) < 26) if (!best || t.y < best.y) best = t;
  return best;
}
function startDrop(){
  if (claw.state !== 'idle') return;
  // 每天第一次夾不用幣（記在 S.day.free，換一天 planDay 會整個重排）
  planDay();
  const free = !S.day.free;
  // 幣不夠：不只說「明天再來」，列出現在還能賺幣的事（js/earn.js）
  if (!free && S.coins < COST){ if (typeof earnOpen === 'function') earnOpen(true); else toast('幣不夠了，明天再來領'); return; }
  if (free){ S.day.free = 1; toast('今天第一次，不用幣'); } else S.coins -= COST;
  S.misses++; renderHud(); save();
  const target = topToyAt(claw.x);
  const guaranteed = S.misses >= 10;
  const win = target && (guaranteed || Math.random() < POW[pow].p);
  let fail = null;
  if (target && !win) fail = Math.random() < POW[pow].slip ? 'slip' : 'wiggle';
  claw.plan = { target, win, fail, stopY: target ? target.y - target.s*0.42 : FLOOR - 64, slipAt: 0.25 + Math.random()*0.55 };
  claw.state = 'drop'; claw.dir = 0; renderCtrl();
}
let last = 0;
function step(ts){
  const dt = Math.max(0, Math.min(0.05, (ts - (last||ts)) / 1000)); last = ts;
  // 移動
  if (claw.state === 'idle' && claw.dir){ claw.x = Math.max(58, Math.min(W-58, claw.x + claw.dir*SPEED*dt)); }
  const P = claw.plan;
  if (claw.state === 'drop'){
    claw.y += 150*dt;
    if (claw.y >= P.stopY){ claw.y = P.stopY; claw.state = 'close'; claw.t = 0; }
  } else if (claw.state === 'close'){
    claw.t += dt; claw.open = Math.max(P.target ? 0.25 : 0, 1 - claw.t*2.2);
    if (claw.t > 0.5){
      if (P.target && (P.win || P.fail === 'slip')){ P.target.held = true; claw.state = 'lift'; }
      else { if (P.target){ P.target.wobA = 1; P.target.wob = 0; } claw.state = 'lift'; }
    }
  } else if (claw.state === 'lift'){
    claw.y -= 120*dt;
    if (P.target && !P.target.held && P.fail === 'wiggle'){ P.target.wob += dt*14; P.target.wobA = Math.max(0, (P.target.wobA||0) - dt*1.2); }
    if (claw.y <= HOME){ claw.y = HOME; claw.state = 'carry'; claw.carry0 = claw.x; }
  } else if (claw.state === 'carry'){
    claw.x -= SPEED*dt;
    const h = toys.find(t=>t.held);
    if (h && P.fail === 'slip' && (claw.carry0 - claw.x) / Math.max(1, claw.carry0 - 58) > P.slipAt){
      h.held = false; h.fall = true; h.vy = 0; h.rest = restY(h.x); claw.open = 0.6;
      toast('啊，掉下去了…');
    }
    if (claw.x <= 58){ claw.x = 58; claw.state = 'release'; claw.t = 0; }
  } else if (claw.state === 'release'){
    claw.t += dt; claw.open = Math.min(1, claw.open + dt*3);
    const h = toys.find(t=>t.held);
    if (h && claw.t > 0.2){ h.held = false; h.fall = true; h.vy = 0; h.rest = FLOOR + 60; h.toChute = true; }
    if (claw.t > 0.6){
      claw.state = 'idle'; claw.open = 1; claw.plan = null;
      if (!P.win){ if (P.fail !== 'slip') toast(P.target ? '差一點點' : '沒夾到東西'); }
      renderCtrl();
    }
  }
  if (claw.state !== 'idle' && claw.state !== 'drop' && claw.state !== 'close'){ if (claw.state!=='release') claw.open = Math.min(claw.open, P && P.target && (P.win||P.fail==='slip') && toys.some(t=>t.held) ? 0.25 : claw.open); }
  // 拿著的玩偶跟著爪子
  const h = toys.find(t=>t.held);
  if (h){ h.x = claw.x; h.y = claw.y + h.s*0.42; }
  // 掉落
  for (const t of toys){
    if (t.fall){
      t.vy += 900*dt; t.y += t.vy*dt;
      if (t.y >= t.rest){
        t.y = t.rest; t.fall = false; t.wobA = .6; t.wob = 0;
        if (t.toChute){ t.gone = true; S.misses = 0; S.wins++; renderHud(); save(); showPrize(t.t); }
      }
    }
    if (t.wobA > 0 && !t.held && claw.state !== 'lift'){ t.wob += dt*12; t.wobA = Math.max(0, t.wobA - dt*1.4); }
  }
  if (page === 'claw') draw();
  requestAnimationFrame(step);
}


const CICON = {
  l:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  r:'<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  go:'<svg viewBox="0 0 24 24"><path d="M12 3v11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M6 13c0 4 2.5 7 6 7s6-3 6-7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M8 13l4 3 4-3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  hold:'<svg viewBox="0 0 24 24"><path d="M5 12h13" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
function holdBtn(el, onDown, onUp){
  const down = e => { e.preventDefault(); el.classList.add('press'); el.setPointerCapture && el.setPointerCapture(e.pointerId); onDown(); };
  const up = () => { if (!el.classList.contains('press')) return; el.classList.remove('press'); onUp(); };
  el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
}

/* ---------- 上方的幣和保底點、下方按鈕 ---------- */
const COIN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffd75e" stroke="#d98e00" stroke-width="2"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="#fff3b8" stroke-width="1.6"/><path d="M12 15.6s-3.4-2-3.4-4.2c0-1.1.8-1.9 1.8-1.9.7 0 1.2.4 1.6.9.4-.5.9-.9 1.6-.9 1 0 1.8.8 1.8 1.9 0 2.2-3.4 4.2-3.4 4.2z" fill="#ff8fbf"/></svg>';
function renderHud(){
  $('#coins').textContent = S.coins;
  const p = $('#pity'); p.innerHTML = '';
  for (let i=0;i<9;i++){ const d=document.createElement('i'); if (i < S.misses) d.className='on'; p.appendChild(d); }
  const s = document.createElement('i'); s.className='last';
  s.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" fill="${S.misses>=9?'#ffc928':'#f3d3e2'}"/></svg>`;
  p.appendChild(s);
  p.setAttribute('aria-label', `再 ${Math.max(1,10-S.misses)} 次內一定夾到`);
}
function renderCtrl(){
  const c = $('#ctrl'), busy = claw.state !== 'idle';
  c.innerHTML = '';
  const l = document.createElement('button'); l.className='rb'; l.innerHTML=CICON.l; l.setAttribute('aria-label','往左');
  const go = document.createElement('button'); go.className='rb go'; const freeNow = S.day && S.day.date === todayStr() && !S.day.free;   // 今天第一次不用幣
  go.innerHTML=CICON.go+`<span class="cost">${COIN}${freeNow ? 0 : COST}</span>`; go.setAttribute('aria-label', freeNow ? '放下爪子（今天第一次，不用幣）' : `放下爪子（${COST} 枚幣）`);
  const r = document.createElement('button'); r.className='rb'; r.innerHTML=CICON.r; r.setAttribute('aria-label','往右');
  [l,go,r].forEach(b => { b.disabled = busy; c.appendChild(b); });
  holdBtn(l, () => claw.dir = -1, () => claw.dir = 0);
  holdBtn(r, () => claw.dir = 1, () => claw.dir = 0);
  go.onclick = startDrop;
}
window.addEventListener('keydown', e => {
  if (page !== 'claw' || !$('#sheet').hidden || document.querySelector('.over')) return;
  if (e.key==='ArrowLeft'){ claw.dir = -1; e.preventDefault(); }
  else if (e.key==='ArrowRight'){ claw.dir = 1; e.preventDefault(); }
  else if (e.key===' ' || e.key==='ArrowDown'){ e.preventDefault(); if (!e.repeat) startDrop(); }
});
window.addEventListener('keyup', e => { if (e.key==='ArrowLeft' || e.key==='ArrowRight') claw.dir = 0; });

/* ---------- 扭蛋裡是什麼 ---------- */
const pickOne = a => a[Math.floor(Math.random()*a.length)];
function rollCap(){
  const need = wishNeeded();
  if (need.length && Math.random() < .5) return {kind:'wish', id:pickOne(need)};
  const look = typeof lookRoll === 'function' && lookRoll();   // 衣櫃的帽子、衣服（js/wardrobe.js）
  if (look) return look;
  const pool = [
    ...Object.keys(FURN).filter(id=>!FURN_OWN[id]&&!FURN[id].season&&!FURN[id].gift).map(id=>({kind:'furn', id})),   // 季節的、湊齊才送的夾不到
    ...WALLS.filter(id=>!WALL_OWN[id]&&!(typeof GIFT_WALL!=='undefined'&&GIFT_WALL[id])).map(id=>({kind:'wall', id})),
  ];
  if (pool.length) return pickOne(pool);
  return {kind:'wish', id:pickOne(Object.keys(WISH))};
}

/* ---------- 夾到了：卡片只放東西的圖 ---------- */
function showPrize(t){
  let pic, bonus = false;
  if (t === 'cap'){
    const r = rollCap();
    if (r.kind === 'furn'){
      FURN_OWN[r.id] = 1; pic = furnSVG(r.id);
      if (!FLOOR_OWN.cloud && CLOUD_SET.every(i=>FURN_OWN[i])){ FLOOR_OWN.cloud = 1; bonus = true; }
    } else if (r.kind === 'look'){ lookGet(r.id); pic = `<span class="lk-pic">${lookIcon(r.id)}</span>`; }
    else if (r.kind === 'wall'){ WALL_OWN[r.id] = 1; pic = `<span class="sw w-${r.id}"></span>`; }
    else { S.wish[r.id] = (S.wish[r.id]||0) + 1; pic = WISH[r.id].svg; renderEvBadge(); markDolls(); }
  } else {
    DOLL_N[t] = (DOLL_N[t]||0) + 1; albumMet(t); pic = `<img alt="" src="${SPR[t]}">`;
  }
  save();
  const o = document.createElement('div'); o.className = 'over';
  o.innerHTML = `<div class="pcard" role="dialog" aria-label="夾到了"><div class="pic">${pic}</div>
    ${bonus ? '<div class="bonus"><span class="cl"></span><span class="sw f-cloud"></span></div>' : ''}
    <button class="btn y ok" aria-label="收下">${CKS}</button></div>`;
  screen.appendChild(o);
  const ok = o.querySelector('.ok'); ok.focus({preventScroll:true});
  ok.onclick = () => { o.remove(); refill(); renderTray(); renderSet(); afterPrize(); save(); };
}

/* ---------- 開機 ---------- */
function loadImg(src){ return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
async function initClaw(){
  await Promise.all(DOLLS.map(async t => { imgs[t] = await loadImg(SPR[t]); }));
  pile(); renderHud(); renderCtrl();
  requestAnimationFrame(step);
}
