/* 薯餅的小窩：娃娃房間（拖曳、坐家具、收納架、夜晚） */
const $ = s=>document.querySelector(s);
const room=$('#room'), stage=$('#stage'), area=$('#area'), screen=$('#screen'), tray=$('#tray');
/* 房間寬高比：依畫面空間算，layout() 會更新。位置和大小都用 % 記，所以比例變了也不會跑掉 */
let RATIO = 340/400;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HEART = (c='#ff6fb0',s='#fff')=>`<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.6 5 7 5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 16.4 12 21 12 21z" fill="${c}" stroke="${s}" stroke-width="1.6"/></svg>`;
const CKS = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2l2.4 2.3 4.6-5"/></svg>';
const HOUSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M12 18s-3-1.8-3-3.6c0-1 .8-1.7 1.6-1.7.6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8.8 0 1.6.7 1.6 1.7 0 1.8-3 3.6-3 3.6z" fill="currentColor" stroke="none"/></svg>';
const ICON = {
  living:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="6" width="16" height="9" rx="4"/><rect x="2" y="10" width="5" height="8" rx="2.5"/><rect x="17" y="10" width="5" height="8" rx="2.5"/><rect x="5" y="13" width="14" height="5" rx="2"/><rect x="5" y="18" width="2" height="3" rx="1"/><rect x="17" y="18" width="2" height="3" rx="1"/></svg>',
  bed:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="12" width="20" height="6" rx="2"/><rect x="2" y="6" width="3.2" height="15" rx="1.6"/><rect x="6" y="8.5" width="6" height="4" rx="2"/><rect x="19.5" y="11" width="2.5" height="10" rx="1.2"/></svg>',
  bath:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 12h20v2a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6z"/><path d="M5 12V6.5a2.5 2.5 0 0 1 5 0" fill="none" stroke="currentColor" stroke-width="2"/><rect x="6" y="19" width="2" height="3" rx="1"/><rect x="16" y="19" width="2" height="3" rx="1"/><circle cx="14" cy="8" r="1.6"/><circle cx="18" cy="6" r="1.2"/></svg>',
};
const RIDS=['living','bed','bath'];
let roomId='living', items=[];
const cur=()=>home[roomId];
/* ---------- 牆和地板 ----------
   存檔裡的 y 是「牆和地板各自裡面的位置」：0～52 在牆上（0 頂端、52 牆腳），52～100 在地板上（52 牆腳、100 最前面）。
   收納架收起來時牆的高度不變，多出來的高度全給地板，所以要換算成畫面上的 %：roomY() 存檔→畫面，roomV() 畫面→存檔。
   收納架打開時牆正好佔 52%，兩個數字一樣，舊存檔不用換算 */
const WALL_V=52;
let WALL=.52;   // 現在牆佔房間高度的比例，layout() 會更新
function roomY(v){return v<=WALL_V?v/WALL_V*WALL*100:WALL*100+(v-WALL_V)/(100-WALL_V)*(1-WALL)*100;}
function roomV(y){const w=WALL*100;return y<=w?y/w*WALL_V:WALL_V+(y-w)/(100-w)*(100-WALL_V);}

/* ---------- 大小、前後 ---------- */
function depth(y){return .8+.2*Math.max(0,Math.min(1,(y-52)/42));}
function sizeOf(it){
  if(it.kind==='doll'){const s=depth(it.y)*(it.sit?.92:1);const w=22*s;return [w,w*RATIO];}
  const f=FURN[it.id];const s=f.wall?1:depth(it.y);const w=f.w*s;return [w,w*(f.vb[1]/f.vb[0])*RATIO];
}
function seatPos(f,k){const [w,h]=sizeOf(f);const [sx,sy]=FURN[f.id].seats[k];return [f.x+(sx-.5)*w,roomV(roomY(f.y)-(1-sy)*h)];}
function syncSeated(){items.forEach(d=>{if(d.kind==='doll'&&d.sit){const f=items.find(o=>o.uid===d.sit);if(!f){d.sit=null;return;}const [x,y]=seatPos(f,d.seat);d.x=x;d.y=y+.5;}});}
function zOf(it){
  if(it.kind==='furn'){const f=FURN[it.id];if(f.floor)return 6;if(f.wall)return 8;return 20+Math.round(it.y*3);}
  if(it.sit){const f=items.find(o=>o.uid===it.sit);return zOf(f)+1+it.seat;}
  return 20+Math.round(it.y*3)+1;
}

let quiet=false;
function elFor(it){
  let el=room.querySelector(`.it[data-u="${it.uid}"]`);
  if(!el){
    el=document.createElement('div');el.className='it';el.dataset.u=it.uid;
    if(it.kind==='doll'){el.classList.add('doll');el.innerHTML=`<span class="body">${dollPic(it.id)}</span>`;}
    else el.innerHTML=furnSVG(it.id);
    el.addEventListener('pointerdown',e=>startDrag(e,it.uid));
    room.appendChild(el);
    if(!quiet){el.classList.add('pop');setTimeout(()=>el.classList.remove('pop'),500);}
  }
  return el;
}
function render(){
  syncSeated();
  const alive=new Set(items.map(i=>String(i.uid)));
  room.querySelectorAll('.it').forEach(e=>{if(!alive.has(e.dataset.u))e.remove();});
  items.forEach(it=>{
    const el=elFor(it);const [w]=sizeOf(it);
    el.style.left=it.x+'%';el.style.top=roomY(it.y)+'%';el.style.width=w+'%';el.style.zIndex=zOf(it);
    if(it.kind==='doll'){
      el.classList.toggle('sit',!!it.sit);el.classList.toggle('breathe',!it.sit);
      el.querySelector('.body').style.animationDelay=(-(it.uid*0.7)%3.2)+'s';
    }
  });
  renderGlow();
  renderTray();renderSet();afterRender();
}
function renderGlow(){
  room.querySelectorAll('.glow').forEach(g=>g.remove());
  items.filter(i=>i.kind==='furn'&&FURN[i.id].glow).forEach(l=>{
    const [w,h]=sizeOf(l);const [gx,gy]=FURN[l.id].glow;
    const g=document.createElement('div');g.className='glow';g.style.left=(l.x+(gx-.5)*w)+'%';g.style.top=(roomY(l.y)-(1-gy)*h)+'%';room.appendChild(g);
  });
}

/* ---------- 拖曳 ---------- */
let drag=null;
// 畫面上的 %（y 還沒換算成存檔的位置）
function pt(e){const r=room.getBoundingClientRect();return [(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100];}
function overTray(e){if(tray.hidden||tray.classList.contains('min'))return false;const r=tray.getBoundingClientRect();return e.clientY>r.top-6&&e.clientX>r.left&&e.clientX<r.right;}
function startDrag(e,u){
  const it=items.find(i=>i.uid===u);if(!it)return;
  e.preventDefault();
  const el=elFor(it);el.setPointerCapture(e.pointerId);
  const [px,py]=pt(e);
  drag={it,el,sx:e.clientX,sy:e.clientY,dx:it.x-px,dy:roomY(it.y)-py,moved:false,seatHot:null,ro:false};
  el.addEventListener('pointermove',onMove);el.addEventListener('pointerup',onUp);el.addEventListener('pointercancel',onUp);
}
function limits(it){
  if(it.kind==='furn'&&FURN[it.id].wall)return [10,90,12,44];
  const [w]=sizeOf(it);return [Math.max(4,w/2-2),Math.min(96,100-w/2+2),56,95];
}
function onMove(e){
  if(!drag||drag.ro)return;const {it,el}=drag;
  if(!drag.moved&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)<6)return;
  if(!drag.moved){drag.moved=true;el.classList.add('drag');tray.classList.add('ghost');if(it.kind==='doll'){room.classList.add('dragdoll');showSeats(it);}if(it.sit)it.sit=null;}
  const [px,py]=pt(e);const [x0,x1,y0,y1]=limits(it);
  it.x=Math.max(x0,Math.min(x1,px+drag.dx));it.y=Math.max(y0,Math.min(y1,roomV(py+drag.dy)));
  if(it.kind==='doll'){
    let best=null,bd=9;
    room.querySelectorAll('.seat').forEach(s=>{const d=Math.hypot(+s.dataset.x-it.x,(+s.dataset.y-it.y)*.85);if(d<bd){bd=d;best=s;}s.classList.remove('hot');});
    if(best)best.classList.add('hot');drag.seatHot=best;
  }
  tray.classList.toggle('over',overTray(e));
  render();el.style.zIndex=500;
}
function onUp(e){
  if(!drag)return;const {it,el}=drag;
  el.removeEventListener('pointermove',onMove);el.removeEventListener('pointerup',onUp);el.removeEventListener('pointercancel',onUp);
  el.classList.remove('drag');room.classList.remove('dragdoll');tray.classList.remove('over','ghost');
  if(!drag.moved){drag=null;if(it.kind==='doll')react(it);else if(!(typeof onFurnTap==='function'&&onFurnTap(it)))nudge(el);return;}
  if(overTray(e)){removeItem(it.uid);drag=null;clearSeats();return;}
  if(it.kind==='doll'&&drag.seatHot){it.sit=+drag.seatHot.dataset.f;it.seat=+drag.seatHot.dataset.k;}
  drag=null;clearSeats();render();
}
function nudge(el){if(REDUCE)return;el.animate([{transform:'translate(-50%,-100%)'},{transform:'translate(-50%,-100%) scale(1.04,.96)'},{transform:'translate(-50%,-100%)'}],{duration:320,easing:'ease-out'});}
function removeItem(u,list=items){
  list.forEach(d=>{if(d.sit===u){d.sit=null;d.y=Math.min(95,d.y+8);}});
  const i=list.findIndex(o=>o.uid===u);if(i>=0)list.splice(i,1);
  if(list===items)render();
}
function showSeats(d){
  items.filter(f=>f.kind==='furn'&&FURN[f.id].seats).forEach(f=>{
    FURN[f.id].seats.forEach((_,k)=>{
      if(items.some(o=>o!==d&&o.sit===f.uid&&o.seat===k))return;
      const [x,y]=seatPos(f,k);const s=document.createElement('div');s.className='seat';
      s.style.left=x+'%';s.style.top=(roomY(y)-3)+'%';s.dataset.x=x;s.dataset.y=y;s.dataset.f=f.uid;s.dataset.k=k;room.appendChild(s);
    });
  });
}
function clearSeats(){room.querySelectorAll('.seat').forEach(s=>s.remove());}

/* ---------- 點娃娃 ---------- */
function react(it){
  const el=elFor(it);const b=el.querySelector('.body');
  b.classList.remove('r-heart');void b.offsetWidth;b.classList.add('r-heart');
  setTimeout(()=>b.classList.remove('r-heart'),900);
  const [,h]=sizeOf(it);const hx=document.createElement('div');hx.className='hfx';hx.style.left=it.x+'%';hx.style.top=(roomY(it.y)-h*.8)+'%';
  hx.innerHTML=HEART();room.appendChild(hx);setTimeout(()=>hx.remove(),1300);
  onDollTap(it);
}

/* ---------- 收納架 ---------- */
let tab='doll';
const LOCK='<span class="lk"><svg viewBox="0 0 10 12"><rect x="1" y="5" width="8" height="6.5" rx="1.6" fill="currentColor"/><path d="M3 5V3.6a2 2 0 0 1 4 0V5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>';
const CK=`<span class="ck">${CKS}</span>`;
function whereDoll(id){for(const r of RIDS){if(home[r].items.some(i=>i.kind==='doll'&&i.id===id))return r;}return null;}
function renderTray(){
  document.querySelectorAll('.tab[data-tab]').forEach(t=>t.classList.toggle('on',t.dataset.tab===tab));
  const box=$('#items');let h='';
  if(tab==='doll'){
    DOLLS.forEach(id=>{const n=DOLL_N[id]||0;const w=whereDoll(id);const here=w===roomId;const away=w&&!here;
      h+=`<button class="tile ${n?'':'lock'} ${here?'placed':''} ${away?'away':''}" data-doll="${id}" aria-label="娃娃"><img src="${SPR[id]}" alt="">${n?`<span class="n">×${n}</span>`:''}${here?CK:''}${away?`<span class="rm">${ICON[w]}</span>`:''}</button>`;});
  } else if(tab==='furn'){
    ROOM_FURN[roomId].forEach(id=>{const own=FURN_OWN[id];const placed=items.some(i=>i.kind==='furn'&&i.id===id);
      h+=`<button class="tile ${own?'':'lock'} ${placed?'placed':''}" data-furn="${id}" aria-label="家具">${furnSVG(id)}${own?'':LOCK}${placed?CK:''}</button>`;});
  } else {
    const wi='<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="11" rx="2.5"/></svg>', fl='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 20l4-8h12l4 8z"/></svg>';
    h+=`<span class="grp">${wi}</span>`;
    WALLS.forEach(id=>{const own=WALL_OWN[id];h+=`<button class="tile ${own?'':'lock'} ${cur().wall===id?'cur':''}" data-wall="${id}" aria-label="壁紙"><span class="sw w-${id}"></span>${own?'':LOCK}</button>`;});
    h+=`<span class="grp">${fl}</span>`;
    FLOORS.forEach(id=>{const own=FLOOR_OWN[id];h+=`<button class="tile ${own?'':'lock'} ${cur().floor===id?'cur':''}" data-floor="${id}" aria-label="地板"><span class="sw f-${id}"></span>${own?'':LOCK}</button>`;});
  }
  box.innerHTML=h;
}
function freeSpot(it){
  const cand=[[50,92],[34,94],[66,94],[20,90],[80,90],[50,80],[30,82],[70,82]];
  for(const c of cand){if(!items.some(o=>o!==it&&!o.sit&&Math.hypot(o.x-c[0],o.y-c[1])<9))return c;}
  return cand[0];
}
$('#items').addEventListener('click',e=>{
  const t=e.target.closest('.tile');if(!t)return;
  if(t.dataset.doll){const id=t.dataset.doll;if(!DOLL_N[id]){toast('還沒夾到');return;}
    const w=whereDoll(id);
    if(w===roomId){removeItem(items.find(i=>i.kind==='doll'&&i.id===id).uid);return;}
    if(w){const o=home[w].items.find(i=>i.kind==='doll'&&i.id===id);removeItem(o.uid,home[w].items);}
    const it={uid:uid++,kind:'doll',id,x:50,y:92,sit:null,seat:0};[it.x,it.y]=freeSpot(it);items.push(it);render();}
  else if(t.dataset.furn){const id=t.dataset.furn;if(!FURN_OWN[id]){toast('娃娃機夾得到');return;}
    const ex=items.find(i=>i.kind==='furn'&&i.id===id);if(ex){removeItem(ex.uid);return;}
    const f=FURN[id];const it={uid:uid++,kind:'furn',id,x:50,y:f.wall?28:82,sit:null,seat:0};
    if(!f.wall&&!f.floor)[it.x,it.y]=freeSpot(it);items.push(it);render();}
  else if(t.dataset.wall){if(!WALL_OWN[t.dataset.wall]){toast('娃娃機夾得到');return;}cur().wall=t.dataset.wall;paintRoom();renderTray();}
  else if(t.dataset.floor){if(!FLOOR_OWN[t.dataset.floor]){toast('湊齊雲朵系列送你');return;}cur().floor=t.dataset.floor;paintRoom();renderTray();}
});
document.querySelectorAll('.tab[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;renderTray();}));
/* 收起來：縮成房間右下角的圓按鈕，房間一直延伸到底。收著還是打開記在這台裝置（個人設定，不上雲端） */
const TRAY_KEY='shubingNest.trayMin';
function setTray(min){
  tray.classList.toggle('min',min);
  $('#trayOpen').setAttribute('aria-expanded',!min);
  try{localStorage.setItem(TRAY_KEY,min?'1':'0');}catch(e){}
}
try{if(localStorage.getItem(TRAY_KEY)==='1')setTray(true);}catch(e){}
$('#trayOpen').addEventListener('click',()=>setTray(false));
// 上緣的拉把：點一下收起，或往下滑
let gripY=null;
$('#grip').addEventListener('pointerdown',e=>{gripY=e.clientY;$('#grip').setPointerCapture(e.pointerId);});
$('#grip').addEventListener('pointerup',e=>{if(gripY===null)return;const dy=e.clientY-gripY;gripY=null;if(dy>-10)setTray(true);});
$('#grip').addEventListener('pointercancel',()=>{gripY=null;});
$('#grip').addEventListener('click',e=>{if(!e.detail)setTray(true);});   // 鍵盤按的

/* ---------- 雲朵系列 ---------- */
const SET=CLOUD_SET;
const X='<button class="x" aria-label="關閉"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>';
function renderSet(){$('#setdots').innerHTML=SET.map(id=>`<i class="${FURN_OWN[id]?'on':''}"></i>`).join('');}
function openSheet(html){const s=$('#sheet');s.innerHTML=X+html;s.hidden=false;s.querySelector('.x').onclick=()=>s.hidden=true;return s;}
$('#setb').addEventListener('click',()=>{
  openSheet(`<div class="hd"><span class="cl"></span>${SET.filter(i=>FURN_OWN[i]).length} / ${SET.length}</div>
  <div class="row">${SET.map(id=>`<div class="tile ${FURN_OWN[id]?'':'lock'}">${furnSVG(id)}${FURN_OWN[id]?'':LOCK}</div>`).join('')}</div>
  <div class="rw"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 9h18v12H3z" fill="#ffd75e" stroke="#d99a00" stroke-width="1.6"/><path d="M2 6h20v4H2z" fill="#ffe58f" stroke="#d99a00" stroke-width="1.6"/><path d="M12 6v15" stroke="#ff6fb0" stroke-width="3"/></svg><span class="sw f-cloud"></span></div>`);
});

/* ---------- 房子、窗戶、夜晚 ---------- */
function isNight(){const h=new Date().getHours();return h>=19||h<5;}
function winSVG(night){
  return `<svg viewBox="0 0 80 62"><rect x="3" y="3" width="74" height="56" rx="14" fill="#fff" stroke="#e9dff2" stroke-width="2"/>
  <rect x="9" y="9" width="62" height="44" rx="9" fill="${night?'#2f3478':'#aee0ff'}"/>
  ${night?'<circle cx="54" cy="22" r="8" fill="#fff3b0"/><circle cx="58" cy="19" r="7" fill="#2f3478"/><g fill="#fff"><circle cx="20" cy="18" r="1.3"/><circle cx="32" cy="30" r="1"/><circle cx="24" cy="40" r="1.2"/><circle cx="46" cy="42" r="1"/></g>'
  :'<circle cx="58" cy="20" r="6" fill="#ffd75e"/><path d="M16 40c-5 0-6-7-1-8 1-6 9-7 12-3 5-2 11 2 10 7 4 1 3 6-1 6z" fill="#fff"/>'}
  <path d="M40 9v44M9 31h62" stroke="#fff" stroke-width="4"/>
  <path d="M6 6c10 6 14 18 12 40-6 1-10-1-12-4z" fill="#ffc2dc" opacity=".9"/><path d="M74 6c-10 6-14 18-12 40 6 1 10-1 12-4z" fill="#ffc2dc" opacity=".9"/></svg>`;
}
function paintRoom(){
  const night=isNight();
  $('#wall').className='wall w-'+cur().wall;$('#floor').className='floor f-'+cur().floor;
  $('#win').innerHTML=winSVG(night);
  screen.classList.toggle('night',night);
  paintLight();
  layout();
}
/* 開燈關燈：每個房間各記各的，沒記過就是開著 */
const lightOn=()=>cur().light!==false;
function paintLight(){
  const on=lightOn(),b=$('#lsw');
  room.classList.toggle('off',!on);
  b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',on?'關燈':'開燈');
}
$('#lsw').addEventListener('click',()=>{cur().light=!lightOn();paintLight();save();});
// 房間直接鋪滿房間頁的空間；太扁或太長時才留邊
function fitStage(W,H){const ratio=Math.max(.5,Math.min(1,W/H));const w=Math.min(W,H*ratio);return [w,w/ratio,ratio];}
function layout(){
  const r=area.getBoundingClientRect();
  if(!r.width||!r.height)return;
  const [w,h,ratio]=fitStage(r.width,r.height);
  // 牆的高度用收納架打開時的牆高：收著的時候先打開量一下房間有多高，再收回去（同一刻做完，畫面不會閃）
  let oh=h;
  if(tray.classList.contains('min')){tray.classList.remove('min');const o=area.getBoundingClientRect();tray.classList.add('min');if(o.height)oh=fitStage(o.width,o.height)[1];}
  const wall=Math.min(.52,.52*oh/h);
  stage.style.width=w+'px';stage.style.height=h+'px';
  room.style.setProperty('--wh',(wall*100)+'%');
  if(Math.abs(ratio-RATIO)>.001||Math.abs(wall-WALL)>.001){RATIO=ratio;WALL=wall;if(items.length)render();}
}
new ResizeObserver(layout).observe(area);
setInterval(()=>{if(isNight()!==screen.classList.contains('night'))paintRoom();},60000);

/* 換房間 */
function renderNav(){
  $('#nav').innerHTML=`<div class="rnav">${RIDS.map(r=>`<button data-r="${r}" class="${r===roomId?'on':''}" aria-label="${{living:'客廳',bed:'臥室',bath:'浴室'}[r]}">${ICON[r]}</button>`).join('')}</div>`;
}
function slide(dir,swap){
  if(REDUCE){swap();return;}
  // 連點時先把還在跑的動畫收掉，不然會疊在一起
  stage.getAnimations().forEach(a=>a.cancel());
  const out=stage.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${-dir*16}%)`,opacity:0}],{duration:170,easing:'ease-in',fill:'forwards'});
  out.onfinish=()=>{
    swap();
    // 淡出停在透明，要取消掉，淡入播完才會留在看得到的狀態
    out.cancel();
    stage.animate([{transform:`translateX(${dir*16}%)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:260,easing:'ease-out'});
  };
}
function load(){
  items=cur().items;quiet=true;
  room.querySelectorAll('.it').forEach(e=>e.remove());
  $('#sheet').hidden=true;
  paintRoom();render();renderNav();quiet=false;
}
// goingTo：正在切過去、還沒換好的房間。連點時用它判斷，不然點回原房間會被略過
let goingTo=null;
function goRoom(r){const from=goingTo??roomId;if(r===from)return;const d=RIDS.indexOf(r)>RIDS.indexOf(from)?1:-1;goingTo=r;slide(d,()=>{roomId=r;goingTo=null;load();});renderNavTo(r);}
function renderNavTo(r){document.querySelectorAll('.rnav button').forEach(b=>b.classList.toggle('on',b.dataset.r===r));}
$('#nav').addEventListener('click',e=>{const b=e.target.closest('button[data-r]');if(b)goRoom(b.dataset.r);});
let toastT;function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),1400);}
