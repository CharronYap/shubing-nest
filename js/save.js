/* 存檔：只存在這台裝置的瀏覽器（localStorage） */
const SAVE_KEY = 'shubingNest.v1';
let uid = 1;
function mk(wall,floor,list){
  const arr=[];
  list.forEach(s=>{const p=s.split(' ');const id=p[0];const kind=FURN[id]?'furn':'doll';
    if(p[1][0]==='>')arr.push({uid:uid++,kind,id,x:0,y:0,sit:p[1].slice(1),seat:+p[2]});
    else arr.push({uid:uid++,kind,id,x:+p[1],y:+p[2],sit:null,seat:0});});
  arr.forEach(it=>{if(typeof it.sit==='string'){const f=arr.find(o=>o.kind==='furn'&&o.id===it.sit);it.sit=f?f.uid:null;}});
  return {wall,floor,items:arr};
}
function newGame(){
  uid = 1;
  return {
    v:1, coins:0, misses:0, wins:0, opened:false, lastDaily:'',
    dollN:{sloth:1,egg:1,dog:1,piggy:1,snoopy:1},
    furnOwn:{bed:1,rug:1,lamp:1,sofa:1,tv:1,table:1,shelf:1,plant:1,tub:1,sink:1,mat:1,towel:1},
    wallOwn:{stripe:1,dots:1,sky:1,tile:1}, floorOwn:{wood:1,check:1,mint:1},
    wish:{snack:0,bubble:0},
    clawStyle:'egg',
    day:{date:'',ids:[],done:[],tap:{}},
    home:{
      living:mk('dots','check',['shelf 14 66','tv 48 63','plant 84 62','sofa 66 82','table 34 90','sloth >sofa 0','piggy 86 94']),
      bed:mk('stripe','wood',['rug 50 89','bed 32 76','lamp 88 72','dog >bed 1','egg 68 91']),
      bath:mk('tile','mint',['mat 40 91','sink 17 72','tub 64 82','towel 80 34','snoopy >tub 0']),
    },
    uid:0,
  };
}
function loadGame(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(raw){const s=JSON.parse(raw); if(s&&s.v===1&&s.home){uid=s.uid||1000;return s;}}
  }catch(e){}
  return newGame();
}
const S = loadGame();
const home = S.home, DOLL_N = S.dollN, FURN_OWN = S.furnOwn, WALL_OWN = S.wallOwn, FLOOR_OWN = S.floorOwn;
let saveT;
function save(){
  clearTimeout(saveT);
  saveT = setTimeout(()=>{S.uid=uid;try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}},250);
}
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
