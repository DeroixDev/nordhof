/* ---------- Spielstand ---------- */
let S, D={cap:100,hp:40,dmg:4};
function regionOf(x,y,n){
  const c=Math.hypot(x-MID,y-MID);if(c<=6.3+(n-.5)*1.6)return 0;
  const a=Math.atan2(y-MID,x-MID)*180/Math.PI;let best=1,bd=999;
  for(let k=1;k<REG.length;k++){let d=Math.abs(a-REG[k].a);if(d>180)d=360-d;if(d<bd){bd=d;best=k;}}
  return best;
}
function genIsland(seed){
  const r=rng(seed), base=[];
  for(let i=0;i<N*N;i++)base.push(r());
  const sm=a=>a.map((v,i)=>{const x=i%N,y=(i/N)|0;let s=0,c=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(inb(x+dx,y+dy)){s+=a[idx(x+dx,y+dy)];c++;}}return s/c;});
  const n1=sm(sm(base)), n2=sm(sm(base.map(()=>r()))), n3=sm(base.map(()=>r()));
  const tiles=[];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const i=idx(x,y),c=Math.hypot(x-MID,y-MID),d=c+(n1[i]-.5)*5,rg=regionOf(x,y,n1[i]);
    let t='water';
    if(d<12.8){
      const id=REG[rg].id,a=n2[i],b=n3[i];
      if(id==='heim'){t='grass';if(c>1.6){if(a>.56)t='forest';else if(b>.62)t='rock';}}
      else if(id==='taiga')t=a>.44?'forest':b>.66?'rock':'tundra';
      else if(id==='heide')t=a>.62?'forest':b>.7?'rock':'heide';
      else if(id==='moor')t=b>.6?'grass':a>.68?'forest':'moor';
      else if(id==='berg')t=a>.5?'berg':b>.45?'rock':'grass';
      else if(id==='duene')t=a>.62?'grass':'sand';
    }
    tiles.push({t,b:null,r:rg});
  }
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const T=tiles[idx(x,y)];if(T.t==='water'||T.t==='rock'||T.t==='berg')continue;if(N4.some(([dx,dy])=>!inb(x+dx,y+dy)||tiles[idx(x+dx,y+dy)].t==='water'))T.t='sand';}
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)tiles[idx(MID+dx,MID+dy)].t='grass';
  tiles[idx(MID-2,MID+1)].t='forest';tiles[idx(MID-2,MID+2)].t='forest';tiles[idx(MID-1,MID+2)].t='forest';
  tiles[idx(MID+2,MID-1)].t='rock';tiles[idx(MID+2,MID-2)].t='rock';
  return {tiles};
}
function fresh(){
  const seed=Math.floor(Math.random()*1e9), g=genIsland(seed);
  const res={};for(const k in RES)res[k]=0;
  Object.assign(res,{holz:40,stein:20,muenzen:50,proviant:3,fisch:30,brot:10});
  const s={v:3,pop:{n:BASEHOUSE,g:0,hunger:0},seed,t:now(),res,tiles:g.tiles,open:[0],explore:null,
    raid:{next:now()+12*60e3,n:0,pending:false,since:0,log:[]},
    boat:{k:'bretter',until:0},orders:[],crew:CREW.map(n=>({n,wounded:0})),
    run:null,wins:[0,0,0,0],prep:{sel:[true,true,false],extra:0},opt:{fps:false,dn:'auto',eco:false,calm:false,speed:1,lastSpeed:2},started:now()};
  s.tiles[idx(MID,MID)].b={type:'hof',lvl:1,prog:0,run:0};
  s.tiles[idx(MID-1,MID+1)].b={type:'holzfaeller',lvl:1,prog:0,run:0};
  s.tiles[idx(MID+1,MID)].b={type:'feld',lvl:1,prog:0,run:0};
  return s;
}
function load(){try{const raw=localStorage.getItem(SAVE);if(raw){const s=JSON.parse(raw);if(s&&s.v>=1&&s.v<=3)return migrate(s);}}catch(e){}return null;}
function migrate(s){
  for(const k in RES)if(typeof s.res[k]!=='number')s.res[k]=0;
  if(!s.pop)s.pop={n:BASEHOUSE,g:0,hunger:0};
  s.opt=Object.assign({fps:false,dn:'auto',eco:false,calm:false,speed:1,lastSpeed:2},s.opt);if(!s.started)s.started=s.t||now();
  if(s.v===1){s.res.fisch+=60;s.res.brot+=30;s.v=2;}
  if(s.v===2){
    /* 0.3 hatte eine 15er-Insel: alte Felder in die Mitte der neuen Welt legen */
    const g=genIsland(s.seed),on=Math.round(Math.sqrt(s.tiles.length)),off=MID-((on-1)>>1);
    s.tiles.forEach((o,k)=>{if(o.t==='water')return;const x=k%on+off,y=((k/on)|0)+off;if(!inb(x,y))return;const T=g.tiles[idx(x,y)];T.r=0;if(o.t==='sand'&&!o.b){if(!['grass','forest','rock'].includes(T.t))T.t='grass';return;}T.t=o.t;T.b=o.b;});
    s.tiles=g.tiles;s.open=[0];s.explore=null;delete s.radius;delete s.expand;s.v=3;
  }
  s.tiles.forEach(T=>{if(T.b&&!B[T.b.type])T.b=null;});
  return s;
}
function save(){S.t=now();S.clk={v:now(),r:Date.now()};try{localStorage.setItem(SAVE,JSON.stringify(S));}catch(e){}}

/* ---------- Ableitungen ---------- */
function unlocked(i){return S.open.includes(S.tiles[i].r);}
const nowT=()=>S._simT||now();
function busy(b){return !!(b&&b.until&&b.until>nowT());}
function bTime(type,L){const d=B[type],bt=BT[type]||BTK[d.kind]||30;return Math.round(L?bt*Math.pow(2.4,L):bt);}
function builders(){let n=2;for(const T of S.tiles)if(T.b&&T.b.type==='bauhuette'&&!(T.b.job==='build'&&busy(T.b)))n++;return Math.min(5,n);}
function busyCount(){let n=S.explore?1:0;for(const T of S.tiles)if(busy(T.b))n++;return n;}
function freeB(){return builders()-busyCount();}
function rushCost(rem){return Math.max(1,Math.ceil(Math.sqrt(Math.max(0,rem)/1000)*3));}
function fmtDur(sec){sec=Math.max(0,Math.ceil(sec));if(sec<60)return sec+' s';const m=Math.floor(sec/60);if(m<60)return m+' min'+(m<10&&sec%60?' '+(sec%60)+' s':'');const h=Math.floor(m/60);return h+' h'+(m%60?' '+(m%60)+' min':'');}
function countType(t){return S.tiles.filter(T=>T.b&&T.b.type===t).length;}
/* Fertige Baustellen und Erkundungen abschließen */
function finishJobs(){
  const t=nowT();let changed=false;
  S.tiles.forEach((T,i)=>{const b=T.b;if(!b||!b.until||b.until>t)return;
    if(b.job==='up')b.lvl++;const j=b.job;delete b.until;delete b.job;changed=true;
    if(LIVE){sparks(i);anim[i]=T0-250;toast('<img class="ico i24" src="'+thumb(b.type,b.lvl)+'" alt="">'+B[b.type].n+(j==='up'?' Stufe '+b.lvl:'')+' fertig');}
    else if(REPORT)REPORT.done.push([b.type,b.lvl]);});
  if(S.explore&&S.explore.until<=t){const r=S.explore.r;S.open.push(r);S.explore=null;changed=true;
    if(LIVE)toast(IC(REG[r].ic,'i24')+REG[r].n+' erkundet');else if(REPORT)REPORT.reg.push(r);}
  if(changed){derive();if(LIVE&&tab==='insel')renderSheet();}
}
let REPORT=null;
function jobsOf(b){const d=B[b.type];return d.jobs?d.jobs+b.lvl-1:0;}
function derive(){
  let lager=0,hp=0,dmg=0,house=BASEHOUSE,jobs=0,tax=0;const joy={};
  for(const T of S.tiles){if(!T.b||(T.b.job==='build'&&busy(T.b)))continue;const d=B[T.b.type],L=T.b.lvl;
    if(d.kind==='store')lager+=L;if(d.kind==='def'){hp+=(d.hp||0)*L;dmg+=(d.dmg||0)*L;}
    if(d.kind==='home')house+=d.cap*L;jobs+=jobsOf(T.b);
    if(d.kind==='joy'){joy[T.b.type]=(joy[T.b.type]||0)+L;if(d.tax)tax+=d.tax*L;}}
  D.cap=100+150*lager;D.hp=40+hp;D.dmg=4+dmg;D.house=house;D.jobs=jobs;D.joyB=joy;D.tax=tax;
  if(S.pop.n>house)S.pop.n=house;
  mood();villagersFit();
}
/* Zufriedenheit: Grundwert plus Nahrung, Kleidung, Dorfleben. Bestimmt Arbeitstempo, Wachstum und Steuern. */
function mood(){
  const parts=[];let h=35;
  const foods=FOOD.filter(k=>S.res[k]>=1);
  if(!foods.length)parts.push(['sauer',-25,'Hunger']);
  else{parts.push([foods[0],15,'Nahrung']);if(foods.length>1)parts.push(['kaese',8*(foods.length-1),'Abwechslung']);}
  if(S.res.kleidung>=1)parts.push(['kleidung',10,'Kleidung']);
  const jb=D.joyB||{};
  for(const k in jb){const d=B[k];let v=d.joy*jb[k];if(d.uses&&!Object.keys(d.uses).every(r=>S.res[r]>=1))v=0;parts.push([k,Math.min(30,v),d.n+(v?'':' (kein Met)')]);}
  if(S.pop.n<D.house*.5&&D.house>BASEHOUSE)parts.push(['huette',-5,'Leere Häuser']);
  for(const p of parts)h+=p[1];
  D.h=Math.max(0,Math.min(100,h));D.parts=parts;
  D.staff=D.jobs?Math.min(1,S.pop.n/D.jobs):1;
  D.eff=D.staff*(.7+.6*D.h/100);
}
function bonus(i){
  const T=S.tiles[i],d=B[T.b.type];if(!d.adj)return 0;
  const x=i%N,y=(i/N)|0;let s=0;
  for(const[dx,dy]of N8){
    const xx=x+dx,yy=y+dy;
    if(!inb(xx,yy)){if(d.adj.t==='water')s+=d.adj.v;continue;}
    const U=S.tiles[idx(xx,yy)];
    if(d.adj.t&&U.t===d.adj.t&&!U.b)s+=d.adj.v;
    if(d.adj.b&&U.b&&U.b.type===d.adj.b)s+=d.adj.v;
  }
  return Math.min(s,d.adj.max);
}
function canPlace(type,i){
  const T=S.tiles[i],d=B[type],x=i%N,y=(i/N)|0;
  if(T.t==='water'||T.t==='berg'||T.b||!unlocked(i))return false;
  if(d.reg&&!d.reg.includes(REG[T.r].id))return false;
  if(d.max&&countType(type)>=d.max)return false;
  if(d.need==='peak')return N8.some(([dx,dy])=>inb(x+dx,y+dy)&&S.tiles[idx(x+dx,y+dy)].t==='berg');
  if(d.need==='coast')return T.t==='sand'||N4.some(([dx,dy])=>!inb(x+dx,y+dy)||S.tiles[idx(x+dx,y+dy)].t==='water');
  if(d.need==='rock')return T.t==='rock'||N8.some(([dx,dy])=>inb(x+dx,y+dy)&&S.tiles[idx(x+dx,y+dy)].t==='rock');
  return T.t!=='rock';
}
const capped=k=>RES[k].k==='roh'||RES[k].k==='ware';
function add(k,a){S.res[k]=(S.res[k]||0)+a;if(capped(k)&&S.res[k]>D.cap)S.res[k]=D.cap;}
function has(c){for(const k in c)if((S.res[k]||0)<c[k]-1e-9)return false;return true;}
function pay(c){for(const k in c)S.res[k]-=c[k];}
function upCost(b){const d=B[b.type],L=b.lvl,c={};for(const k in d.cost)c[k]=Math.ceil(d.cost[k]*Math.pow(1.7,L));if(L>=3)c.werkzeug=L-2;if(L>=5)c.silber=L-4;if(L>=7)c.rune=L-6;return c;}
function prodRate(i){const b=S.tiles[i].b,d=B[b.type];return d.rate*b.lvl*(1+bonus(i))*D.eff;}
function craftSpeed(i){const b=S.tiles[i].b;return b.lvl*(1+bonus(i))*D.eff;}

