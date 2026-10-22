/* ---------- Spielstand ---------- */
let S, D={cap:100,hp:40,dmg:4};
/* Welt: glattes Wertrauschen in mehreren Größen, dann auf Rangplätze gestreckt, damit Schwellen Flächenanteile bedeuten */
function vnoise(seed,scale){
  const r=rng(seed),G=Math.ceil(N/scale)+3,g=new Float32Array(G*G);for(let i=0;i<G*G;i++)g[i]=r();
  return(x,y)=>{const fx=x/scale+1,fy=y/scale+1,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,u=tx*tx*(3-2*tx),v=ty*ty*(3-2*ty),k=iy*G+ix;
    const a=g[k],b=g[k+1],c=g[k+G],d=g[k+G+1];return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
}
function fbm(seed,s){const a=vnoise(seed,s),b=vnoise(seed+7,s/2.2),c=vnoise(seed+13,s/5);return(x,y)=>a(x,y)*.6+b(x,y)*.28+c(x,y)*.12;}
function ranked(f){const v=new Float32Array(N*N);for(let i=0;i<N*N;i++)v[i]=f(i%N,(i/N)|0);const o=Array.from(v.keys()).sort((a,b)=>v[a]-v[b]),out=new Float32Array(N*N);o.forEach((i,k)=>{out[i]=k/(N*N);});return out;}
const IC0=(N-1)/2;
/* Heimat: Hof, erste Hütte, Holzfäller (Ankerfelder, jeweils obere linke Ecke) */
const HOME={hof:[61,61],huette:[59,60],holzfaeller:[59,64],wood:[55.5,65.5],rock:[67,57]};
function genIsland(seed){
  const shape=fbm(seed,18),w1=fbm(seed+101,16),w2=fbm(seed+202,16),A=ranked(fbm(seed+303,9)),Bn=ranked(fbm(seed+404,7)),Cn=ranked(fbm(seed+505,6));
  const tiles=new Array(N*N);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const i=idx(x,y),dc=Math.hypot(x-IC0,y-IC0)/43,land=dc<1-(shape(x,y)-.5)*.8&&x>1&&y>1&&x<N-2&&y<N-2;
    const px=x+(w1(x,y)-.5)*20,py=y+(w2(x,y)-.5)*20;let rg=0,bd=1e9;
    REG.forEach((R,k)=>{const d=Math.hypot(px-R.sx,py-R.sy);if(d<bd){bd=d;rg=k;}});
    let t='water';
    if(land){const id=REG[rg].id,a=A[i],b=Bn[i],c=Cn[i];
      if(id==='heim')t=a>.62?'forest':b>.92?'rock':'grass';
      else if(id==='taiga')t=c>.95?'water':a>.42?'forest':b>.86?'rock':'tundra';
      else if(id==='heide')t=c>.96?'water':a>.74?'forest':b>.86?'rock':'heide';
      else if(id==='moor')t=c>.84?'water':b>.72?'grass':a>.8?'forest':'moor';
      else if(id==='berg')t=a>.56?'berg':b>.48?'rock':a>.3?'grass':'forest';
      else if(id==='duene')t=a>.72?'grass':b>.93?'rock':'sand';}
    tiles[i]={t,r:rg};
  }
  /* Flüsse: vom Bergland weg von der Heimat zur Küste */
  const rr=rng(seed+909),H=REG[0],G=REG[REGI.berg];
  for(let q=0;q<2;q++){
    const cand=[];tiles.forEach((T,i)=>{if(T.r===REGI.berg&&T.t!=='berg'&&T.t!=='water'&&Math.hypot(i%N-G.sx,((i/N)|0)-G.sy)<9)cand.push(i);});
    if(!cand.length)break;let i=cand[Math.floor(rr()*cand.length)],x=i%N,y=(i/N)|0;
    const base=Math.atan2(G.sy-H.sy,G.sx-H.sx)+(q?1:-1)*(.5+rr()*.6);let ang=base;
    for(let step=0;step<140;step++){
      const T=tiles[idx(x,y)];if(T.r===0)break;if(T.t==='water'&&step>2&&!T.riv)break;
      T.t='water';T.riv=1;ang=base+(ang-base)*.7+(rr()-.5)*1.1;
      if(Math.abs(Math.cos(ang))>Math.abs(Math.sin(ang)))x+=Math.sign(Math.cos(ang));else y+=Math.sign(Math.sin(ang));
      if(!inb(x,y))break;
    }
  }
  /* Meer von außen fluten; Land am Meer wird Strand */
  const sea=new Uint8Array(N*N),st=[0];sea[0]=1;
  while(st.length){const i=st.pop(),x=i%N,y=(i/N)|0;for(const[dx,dy]of N4){const xx=x+dx,yy=y+dy;if(!inb(xx,yy))continue;const j=idx(xx,yy);if(!sea[j]&&tiles[j].t==='water'){sea[j]=1;st.push(j);}}}
  for(let i=0;i<N*N;i++){const T=tiles[i];if(T.t==='water'||T.t==='rock'||T.t==='berg')continue;const x=i%N,y=(i/N)|0;if(N4.some(([dx,dy])=>inb(x+dx,y+dy)&&sea[idx(x+dx,y+dy)]))T.t='sand';}
  /* Startplatz: Lichtung um den Hof, ein Wäldchen für den Holzfäller, etwas Fels */
  const cx=HOME.hof[0]+1,cy=HOME.hof[1]+1;
  for(let i=0;i<N*N;i++){const T=tiles[i];if(T.t==='water')continue;const x=i%N,y=(i/N)|0;
    if(Math.hypot(x-cx,y-cy)<4.6){T.t='grass';T.r=0;}
    else if(Math.hypot(x-HOME.wood[0],y-HOME.wood[1])<2.7){T.t='forest';T.r=0;}
    else if(Math.hypot(x-HOME.rock[0],y-HOME.rock[1])<1.7){T.t='rock';T.r=0;}}
  for(const T of tiles)delete T.riv;
  return {tiles};
}
function fresh(){
  const seed=Math.floor(Math.random()*1e9),g=genIsland(seed);
  const res={};for(const k in RES)res[k]=0;
  Object.assign(res,{holz:30,stein:10,muenzen:30,fisch:20});
  const s={v:4,pop:{n:4,g:0,hunger:0},seed,t:now(),res,tiles:g.tiles,open:[0],explore:null,
    raid:{next:0,n:0,pending:false,since:0,log:[]},
    boat:{k:'holz',until:0},orders:[],crew:CREW.map(n=>({n,wounded:0})),
    run:null,wins:[0,0,0,0],prep:{sel:[true,true,false],extra:0},opt:{fps:false,dn:'auto',eco:false,calm:false,speed:1,lastSpeed:2},started:now(),chap:0,roadsInit:false};
  for(const k of['hof','huette','holzfaeller']){const[x,y]=HOME[k];placeB(idx(x,y),Object.assign({type:k,lvl:1,prog:0,run:0},k==='hof'?{rot:0}:{}),s.tiles);}
  return s;
}
/* Speichern kompakt: Boden als Buchstaben, Gebiete als Ziffern, Gebäude als Liste. Belegte Felder werden beim Laden neu gesetzt. */
const TCH={grass:'g',forest:'f',rock:'r',sand:'s',tundra:'t',heide:'h',moor:'m',berg:'b',water:'w'},TCR=Object.fromEntries(Object.entries(TCH).map(([k,v])=>[v,k]));
function serialize(){
  const o=Object.assign({},S);delete o.tiles;delete o._simT;let t='',r='';const bl=[];
  let rd='';S.tiles.forEach((T,i)=>{t+=TCH[T.t];r+=T.r;rd+=T.rd||0;if(T.b)bl.push([i,T.b]);});o.map={t,r,rd,bl};return o;
}
function deserialize(o){
  if(!o||o.v!==4||!o.map||!o.res)throw new Error('kein Spielstand 0.7');
  const m=o.map,tiles=[];for(let i=0;i<N*N;i++){const T={t:TCR[m.t[i]]||'grass',r:+m.r[i]||0};if(m.rd&&+m.rd[i])T.rd=+m.rd[i];tiles.push(T);}
  for(const[i,b]of m.bl)if(B[b.type])placeB(i,b,tiles);
  const s=Object.assign({},o);delete s.map;s.tiles=tiles;if(!m.rd)s.roadsInit=false;
  for(const k in RES)if(typeof s.res[k]!=='number')s.res[k]=0;
  s.opt=Object.assign({fps:false,dn:'auto',eco:false,calm:false,speed:1,lastSpeed:2},s.opt);if(!s.started)s.started=s.t||now();if(s.chap===undefined)s.chap=0;
  return s;
}
function load(){try{const raw=localStorage.getItem(SAVE);if(raw)return deserialize(JSON.parse(raw));}catch(e){}return null;}
function oldSave(){try{return !!localStorage.getItem('nordhof-save-v1');}catch(e){return false;}}
function save(){if(!S)return;S.t=now();S.clk={v:now(),r:Date.now()};try{localStorage.setItem(SAVE,JSON.stringify(serialize()));}catch(e){}}

/* ---------- Grundflächen ---------- */
/* Ein Gebäude liegt auf seinem Ankerfeld (obere linke Ecke); alle belegten Felder zeigen mit o auf den Anker */
const fpOf=type=>B[type].sz||1;
function cellsOf(i0,s){const x0=i0%N,y0=(i0/N)|0,a=[];for(let y=y0;y<y0+s;y++)for(let x=x0;x<x0+s;x++)if(inb(x,y))a.push(idx(x,y));return a;}
function placeB(i0,b,tiles){tiles=tiles||S.tiles;for(const c of cellsOf(i0,fpOf(b.type))){const T=tiles[c];T.o=i0;if(T.t==='forest')T.t='grass';}tiles[i0].b=b;}
function removeB(i0){const b=S.tiles[i0].b;for(const c of cellsOf(i0,fpOf(b.type)))delete S.tiles[c].o;S.tiles[i0].b=null;}
function anc(i){if(i<0)return -1;const o=S.tiles[i].o;return o===undefined?-1:o;}
function bCtr(i){const s=fpOf(S.tiles[i].b.type);return[i%N+(s-1)/2,((i/N)|0)+(s-1)/2];}
let BL=[];
/* Neue Welt oder Spielstand ohne Wege: Trampelpfade zwischen allen Gebäuden anlegen */
function initRoads(){if(S.roadsInit!==false)return;reindex();autoRoads();S.roadsInit=true;}
function reindex(){BL=[];S.tiles.forEach((T,i)=>{if(T.b){BL.push(i);if(T.b.type==='hof')S.hof=i;}});deferMap();}
function hofL(){const T=S.tiles[S.hof];return T&&T.b?T.b.lvl:1;}
function maxLvl(b){return b.type==='hof'?MAXLVL:hofL();}

/* ---------- Ableitungen ---------- */
function unlocked(i){return S.open.includes(S.tiles[i].r);}
const nowT=()=>S._simT||now();
function busy(b){return !!(b&&b.until&&b.until>nowT());}
function bTime(type,L){if(type==='hof')return L?HOFT[L+1]||HOFT[8]:30;const d=B[type],bt=BT[type]||BTK[d.kind]||30;return Math.round(L?bt*Math.pow(2.4,L):bt);}
function builders(){let n=2;for(const i of BL){const b=S.tiles[i].b;if(b.type==='bauhuette'&&!(b.job==='build'&&busy(b)))n++;}return Math.min(5,n);}
function busyCount(){let n=S.explore?1:0;for(const i of BL)if(busy(S.tiles[i].b))n++;return n;}
function freeB(){return builders()-busyCount();}
function rushCost(rem){return Math.max(1,Math.ceil(Math.sqrt(Math.max(0,rem)/1000)*3));}
function fmtDur(sec){sec=Math.max(0,Math.ceil(sec));if(sec<60)return sec+' s';const m=Math.floor(sec/60);if(m<60)return m+' min'+(m<10&&sec%60?' '+(sec%60)+' s':'');const h=Math.floor(m/60);return h+' h'+(m%60?' '+(m%60)+' min':'');}
function countType(t){let n=0;for(const i of BL)if(S.tiles[i].b.type===t)n++;return n;}
/* Fertige Baustellen und Erkundungen abschließen */
function finishJobs(){
  const t=nowT();let changed=false;
  for(const i of BL){const b=S.tiles[i].b;if(!b.until||b.until>t)continue;
    if(b.job==='up')b.lvl++;const j=b.job;delete b.until;delete b.job;changed=true;
    if(b.type==='hof'&&j==='up')hofUp(b.lvl);
    if(LIVE){juiceDone(i,j);toast('<img class="ico i24" src="'+thumb(b.type,b.lvl)+'" alt="">'+B[b.type].n+(j==='up'?' Stufe '+b.lvl:'')+' fertig');}
    else if(REPORT)REPORT.done.push([b.type,b.lvl]);}
  if(S.explore&&S.explore.until<=t){const r=S.explore.r;S.open.push(r);S.explore=null;changed=true;groundDirty();
    if(LIVE)toast(IC(REG[r].ic,'i24')+REG[r].n+' erkundet');else if(REPORT)REPORT.reg.push(r);}
  if(changed){derive();if(LIVE&&tab==='insel')renderSheet();if(LIVE)renderBuild();}
}
/* Neue Hofstufe: Überfälle beginnen ab Stufe 2, das nächste Kapitel wird erzählt */
function hofUp(L){
  if(L>=2&&!S.raid.next)S.raid.next=nowT()+12*60e3;
  if(LIVE)hofFest(L);else S.chapPending=L;
}
let REPORT=null;
function jobsOf(b){const d=B[b.type];return d.jobs?d.jobs+b.lvl-1:0;}
function derive(){
  reindex();roadNet();logistics();
  let lager=0,hp=0,dmg=0,house=BASEHOUSE,jobs=0,tax=0;const joy={};
  for(const i of BL){const b=S.tiles[i].b;if(b.job==='build'&&busy(b))continue;const d=B[b.type],L=b.lvl;
    if(d.kind==='store')lager+=L;if(d.kind==='def'){hp+=(d.hp||0)*L;dmg+=(d.dmg||0)*L;}
    const ok=connected(i);
    if(d.kind==='home')house+=d.cap*L*(ok?1:.5);jobs+=jobsOf(b);
    if(d.kind==='joy'&&ok){joy[b.type]=(joy[b.type]||0)+L;if(d.tax)tax+=d.tax*L;}}
  D.cap=100+50*(hofL()-1)+150*lager;D.hp=40+hp;D.dmg=4+dmg;D.house=Math.floor(house);D.jobs=jobs;D.joyB=joy;D.tax=tax;
  if(S.pop.n>house)S.pop.n=house;
  areas();known();mood();villagersFit();
}
/* Arbeitsbereich: Felder mit dem passenden Boden im Umkreis. Gleiche Betriebe teilen sich überlappende Felder. */
let AREA={},COVER={};
function areaCells(i0,type){
  const d=B[type],r=d.ar||0;if(!r||!d.adj||!d.adj.t)return[];
  const s=fpOf(type),cx=i0%N+(s-1)/2,cy=((i0/N)|0)+(s-1)/2,R=r+(s-1)/2,out=[];
  for(let y=Math.max(0,Math.floor(cy-R));y<=Math.min(N-1,Math.ceil(cy+R));y++)for(let x=Math.max(0,Math.floor(cx-R));x<=Math.min(N-1,Math.ceil(cx+R));x++){
    if(Math.hypot(x-cx,y-cy)>R+.25)continue;const i=idx(x,y),T=S.tiles[i];if(T.t===d.adj.t&&T.o===undefined&&S.open.includes(T.r))out.push(i);}
  return out;
}
function areas(){
  AREA={};COVER={};const cells={};
  for(const i of BL){const b=S.tiles[i].b;if(!B[b.type].ar)continue;const c=areaCells(i,b.type);cells[i]=c;for(const t of c){const k=b.type+':'+t;COVER[k]=(COVER[k]||0)+1;}}
  for(const i in cells){const b=S.tiles[i].b,need=AREANEED[B[b.type].adj.t]||8;let sh=0;for(const t of cells[i])sh+=1/COVER[b.type+':'+t];AREA[i]={n:cells[i].length,sh,need,f:Math.min(1,sh/need)};}
}
function areaF(i){const a=AREA[i];return a?a.f:1;}
/* Vorschau: wie gut wäre ein neuer Betrieb an dieser Stelle */
function areaGuess(type,i0){const c=areaCells(i0,type),need=AREANEED[B[type].adj.t]||8;let sh=0;for(const t of c)sh+=1/(1+(COVER[type+':'+t]||0));return{n:c.length,sh,need,f:Math.min(1,sh/need)};}
/* Nur Rohstoffe zeigen, mit denen man auf der aktuellen Hofstufe arbeiten kann */
let KNOWN=new Set();
function known(){
  const k=new Set(['muenzen']),H=hofL();
  for(const t in B){const d=B[t];if(d.hl>H)continue;if(d.out)k.add(d.out);if(d.uses)Object.keys(d.uses).forEach(x=>k.add(x));Object.keys(d.cost).forEach(x=>k.add(x));
    if(d.rec)d.rec.forEach(r=>{k.add(r);Object.keys(RECIPES[r].in).forEach(x=>k.add(x));});}
  if(H<MAXLVL)Object.keys(HOFUP[H+1]).forEach(x=>k.add(x));
  if(H>=3)['proviant','waffe','ruestung','bernstein','silber','rune'].forEach(x=>k.add(x));
  for(const r in RES)if(S.res[r]>=1)k.add(r);
  KNOWN=k;
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
  if(S.pop.n<D.house*.5&&D.house>8)parts.push(['huette',-5,'Leere Häuser']);
  seasonMood(parts);storyMood(parts);for(const p of parts)h+=p[1];
  D.h=Math.max(0,Math.min(100,h));D.parts=parts;
  D.staff=D.jobs?Math.min(1,S.pop.n/D.jobs):1;
  D.eff=D.staff*(.7+.6*D.h/100);
}
/* Nähe zu Zulieferern: jeder passende Betrieb im Umkreis von 6 Feldern gibt Bonus */
function bonus(i){
  const b=S.tiles[i].b,d=B[b.type];if(!d.adj||!d.adj.b)return 0;
  const[cx,cy]=bCtr(i);let s=0;
  for(const j of BL){const u=S.tiles[j].b;if(u.type!==d.adj.b)continue;const[x,y]=bCtr(j);if(Math.hypot(x-cx,y-cy)<=6)s+=d.adj.v;}
  return Math.min(s,d.adj.max);
}
/* Bauplatz prüfen; gibt den Grund zurück, warum es nicht geht, oder einen leeren Text */
function placeErr(type,i0){
  if(i0<0)return 'Außerhalb';
  const d=B[type],s=fpOf(type),x0=i0%N,y0=(i0/N)|0;
  if(x0+s>N||y0+s>N)return 'Außerhalb';
  if(d.hl>hofL())return 'Ab Hofstufe '+d.hl;
  if(d.max&&countType(type)>=d.max)return 'Höchstens '+d.max+' Stück';
  let coast=false;
  for(const c of cellsOf(i0,s)){const T=S.tiles[c];
    if(T.t==='water')return 'Im Wasser';
    if(!S.open.includes(T.r))return 'Gebiet noch nicht erkundet';
    if(T.o!==undefined)return 'Hier steht schon etwas';
    if(T.rd)return 'Hier ist ein Weg';
    if(T.t==='berg')return 'Zu steil';if(T.t==='rock')return 'Auf Fels kann man nicht bauen';
    if(!coast){const x=c%N,y=(c/N)|0;coast=N4.some(([dx,dy])=>inb(x+dx,y+dy)&&S.tiles[idx(x+dx,y+dy)].t==='water');}}
  const ctr=idx(x0+((s-1)>>1),y0+((s-1)>>1));
  if(d.reg&&!d.reg.includes(REG[S.tiles[ctr].r].id))return 'Nur im '+d.reg.map(g=>REG[REGI[g]].n).join(' oder ');
  if(d.need==='coast'&&!coast)return 'Muss ans Wasser grenzen';
  if(d.ar&&!areaCells(i0,type).length)return 'Kein '+TERR[d.adj.t].n+' in Reichweite';
  return '';
}
function canPlace(type,i0){return !placeErr(type,i0);}
const capped=k=>RES[k].k==='roh'||RES[k].k==='ware';
function add(k,a){const o=S.res[k]||0;S.res[k]=o+a;if(capped(k)&&S.res[k]>D.cap)S.res[k]=Math.max(D.cap,Math.min(o,S.res[k]));}
function has(c){for(const k in c)if((S.res[k]||0)<c[k]-1e-9)return false;return true;}
function pay(c){for(const k in c)S.res[k]-=c[k];}
function upCost(b){
  if(b.type==='hof')return Object.assign({},HOFUP[b.lvl+1]||{});
  const d=B[b.type],L=b.lvl,c={};for(const k in d.cost)c[k]=Math.ceil(d.cost[k]*Math.pow(1.7,L));if(L>=4)c.werkzeug=L-3;if(L>=6)c.silber=L-5;if(L>=7)c.rune=1;return c;
}
function prodRate(i){const b=S.tiles[i].b,d=B[b.type];return d.rate*b.lvl*(1+bonus(i))*areaF(i)*roadF(i)*D.eff*seasonF(b);}
function craftSpeed(i){const b=S.tiles[i].b;return b.lvl*(1+bonus(i))*roadF(i)*D.eff;}
