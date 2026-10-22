/* ---------- Wege und Straßen ---------- */
/* Ein Feld mit Weg hat T.rd = Stufe 1 bis 3. Leute laufen darauf schneller, Gebäude brauchen einen Anschluss ans Wegenetz des Hofes. */
const ROADS=[null,
  {n:'Pfad',hl:1,cost:{},sp:1.3,w:.19,c:'#B49B6E',desc:'Festgetretene Erde. Kostet nichts, Leute laufen etwas schneller.'},
  {n:'Schotterweg',hl:2,cost:{stein:1},sp:1.7,w:.23,c:'#BAB4A4',desc:'Fester Schotter. Leute und Waren kommen deutlich schneller voran.'},
  {n:'Pflasterstraße',hl:4,cost:{stein:2,ziegel:1},sp:2.2,w:.27,c:'#A29E94',desc:'Gepflastert mit Bordstein. Am schnellsten, für die großen Wege der Stadt.'}];
const BRIDGE={holz:8},WALK=.7,OFFROAD=1;
/* Wer keinen Weganschluss braucht */
const noRoad=type=>{const d=B[type];return d.kind==='def'||type==='hof';};
const roadSp=i=>{const r=S.tiles[i].rd;return r?ROADS[r].sp:OFFROAD;};

/* Ausrichtung: rot = Seite der Tür. 0 = vorne links (+y), 1 = vorne rechts (+x), 2 = hinten rechts (−y), 3 = hinten links (−x) */
const RDIR=[[0,1],[1,0],[0,-1],[-1,0]];
function defRot(type){const st=B[type].st;return st.s==='house'&&st.ax==='x'?1:0;}
const rotOf=b=>b.rot===undefined?defRot(b.type):b.rot;
/* Feld vor der Tür (außerhalb der Grundfläche) */
function doorTileAt(i0,n,rot){const x0=i0%N,y0=(i0/N)|0,c=(n-1)>>1,[dx,dy]=RDIR[rot];
  const x=dx>0?x0+n:dx<0?x0-1:x0+c,y=dy>0?y0+n:dy<0?y0-1:y0+c;return inb(x,y)?idx(x,y):-1;}
function doorTile(i){const b=S.tiles[i].b;return doorTileAt(i,fpOf(b.type),rotOf(b));}
/* Punkt an der Tür, wo Leute hinein- und herausgehen */
function doorPos(i){const b=S.tiles[i].b,n=fpOf(b.type),[cx,cy]=bCtr(i),[dx,dy]=RDIR[rotOf(b)];return[cx+dx*(n/2+.08),cy+dy*(n/2+.08)];}
/* Felder rund um eine Grundfläche, je Seite */
function sideTiles(i0,n,rot){const x0=i0%N,y0=(i0/N)|0,[dx,dy]=RDIR[rot],out=[];
  for(let k=0;k<n;k++){const x=dx>0?x0+n:dx<0?x0-1:x0+k,y=dy>0?y0+n:dy<0?y0-1:y0+k;if(inb(x,y))out.push(idx(x,y));}return out;}
function ringTiles(i0,n){return[0,1,2,3].flatMap(r=>sideTiles(i0,n,r));}
/* Beim Bauen zur Straße drehen: zuerst die Seite, deren Türfeld ein Weg ist, dann irgendeine Seite mit Weg */
function autoRot(type,i0,cur){
  const n=fpOf(type);let best=-1,bs=0;
  for(const r of[0,1,2,3]){const dt=doorTileAt(i0,n,r);let s=0;if(dt>=0&&S.tiles[dt].rd)s=10+(r<2?1:0);else if(sideTiles(i0,n,r).some(t=>S.tiles[t].rd))s=5+(r<2?1:0);if(s>bs){bs=s;best=r;}}
  return best<0?cur:best;
}

/* Netz: was vom Hof aus erreichbar ist und wie weit es zum nächsten Lager (Hof oder Lagerhaus) ist */
let RCH=new Uint8Array(N*N),RDIST=new Float32Array(N*N),CONN={},HUBD={},ROADV=0;
function hubs(){return BL.filter(i=>{const b=S.tiles[i].b;return(b.type==='hof'||b.type==='lager')&&!(b.job==='build'&&busy(b));});}
function roadNet(){
  RCH=new Uint8Array(N*N);RDIST=new Float32Array(N*N).fill(1e9);CONN={};HUBD={};
  const hof=S.hof,st=[];
  if(hof===undefined||!S.tiles[hof].b)return;
  for(const t of ringTiles(hof,fpOf('hof')))if(S.tiles[t].rd&&!RCH[t]){RCH[t]=1;st.push(t);}
  while(st.length){const i=st.pop(),x=i%N,y=(i/N)|0;for(const[dx,dy]of N4){const xx=x+dx,yy=y+dy;if(!inb(xx,yy))continue;const j=idx(xx,yy);if(!RCH[j]&&S.tiles[j].rd){RCH[j]=1;st.push(j);}}}
  /* Entfernung in Laufzeit vom nächsten Lager, Dijkstra über die Wege */
  const hp=[],push=(i,d)=>{if(d>=RDIST[i])return;RDIST[i]=d;hp.push([d,i]);let k=hp.length-1;while(k){const p=(k-1)>>1;if(hp[p][0]<=hp[k][0])break;[hp[p],hp[k]]=[hp[k],hp[p]];k=p;}};
  const pop=()=>{const top=hp[0],l=hp.pop();if(hp.length){hp[0]=l;let k=0;for(;;){const a=2*k+1,b=a+1;let m=k;if(a<hp.length&&hp[a][0]<hp[m][0])m=a;if(b<hp.length&&hp[b][0]<hp[m][0])m=b;if(m===k)break;[hp[m],hp[k]]=[hp[k],hp[m]];k=m;}}return top;};
  for(const h of hubs())for(const t of ringTiles(h,fpOf(S.tiles[h].b.type)))if(RCH[t])push(t,1/roadSp(t));
  while(hp.length){const[d,i]=pop();if(d>RDIST[i])continue;const x=i%N,y=(i/N)|0;for(const[dx,dy]of N4){const xx=x+dx,yy=y+dy;if(!inb(xx,yy))continue;const j=idx(xx,yy);if(RCH[j])push(j,d+1/roadSp(j));}}
  for(const i of BL){const b=S.tiles[i].b,ring=ringTiles(i,fpOf(b.type));let c=false,d=1e9;for(const t of ring)if(RCH[t]){c=true;d=Math.min(d,RDIST[t]);}
    CONN[i]=c||noRoad(b.type);HUBD[i]=(b.type==='hof'||b.type==='lager')&&c?0:c?d:-1;}
  CONN[hof]=true;HUBD[hof]=0;
}
const connected=i=>CONN[i]!==false;
/* Leistung je nach Anschluss: ohne Weg die Hälfte, mit Weg je nach Laufzeit zum nächsten Lager */
function roadF(i){
  const b=S.tiles[i].b;if(noRoad(b.type))return 1;if(!connected(i))return .5;
  const d=HUBD[i];if(d===undefined||d<0)return 1;return d<=12?1:Math.max(.75,1-(d-12)/100);
}

/* Weg legen oder entfernen */
function roadErr(i,lv){
  if(i<0)return 'Außerhalb';const T=S.tiles[i];
  if(lv&&ROADS[lv].hl>hofL())return ROADS[lv].n+' ab Hofstufe '+ROADS[lv].hl;
  if(!S.open.includes(T.r))return 'Gebiet noch nicht erkundet';
  if(T.o!==undefined)return 'Hier steht ein Gebäude';
  if(!lv)return T.rd?'':'Hier ist kein Weg';
  if(T.t==='rock'||T.t==='berg')return 'Durch Fels geht kein Weg';
  if(T.t==='water'&&!bridgeOk(i))return 'Zu breites Wasser für eine Brücke';
  return '';
}
/* Brücken nur über schmales Wasser: Land oder Weg auf zwei gegenüberliegenden Seiten in höchstens 2 Feldern */
function bridgeOk(i){const x=i%N,y=(i/N)|0,land=(xx,yy)=>inb(xx,yy)&&(S.tiles[idx(xx,yy)].t!=='water'||S.tiles[idx(xx,yy)].rd);
  return(land(x-1,y)||land(x-2,y))&&(land(x+1,y)||land(x+2,y))||(land(x,y-1)||land(x,y-2))&&(land(x,y+1)||land(x,y+2));}
/* Feldkette von a nach b: erst entlang der längeren Richtung, dann um die Ecke */
function roadLine(a,b){
  if(a<0||b<0)return[];let x=a%N,y=(a/N)|0;const bx=b%N,by=(b/N)|0,out=[idx(x,y)],xf=Math.abs(bx-x)>=Math.abs(by-y);
  const stepX=()=>{while(x!==bx){x+=Math.sign(bx-x);out.push(idx(x,y));}},stepY=()=>{while(y!==by){y+=Math.sign(by-y);out.push(idx(x,y));}};
  if(xf){stepX();stepY();}else{stepY();stepX();}return out;
}
/* Kosten und Fehler einer geplanten Kette */
function roadPlan(cells,lv){
  const cost={},ok=[];let err='',bad=0;
  for(const i of cells){const T=S.tiles[i],e=roadErr(i,lv);if(e){bad++;if(!err)err=e;continue;}
    if(lv&&T.rd>=lv)continue;ok.push(i);if(!lv)continue;
    for(const k in ROADS[lv].cost)cost[k]=(cost[k]||0)+ROADS[lv].cost[k];
    if(T.t==='water'&&!T.rd)for(const k in BRIDGE)cost[k]=(cost[k]||0)+BRIDGE[k];}
  return{ok,cost,err,bad};
}
function roadsChanged(cells){
  const all=new Set();for(const i of cells){all.add(i);const x=i%N,y=(i/N)|0;for(const[dx,dy]of N4)if(inb(x+dx,y+dy))all.add(idx(x+dx,y+dy));}
  ROADV++;PATHC.clear();groundDirty([...all]);derive();
}
function buildRoad(cells,lv){
  const p=roadPlan(cells,lv);if(!p.ok.length)return p.err||'';
  if(lv&&!has(p.cost))return 'Zu wenig Rohstoffe';
  if(lv)pay(p.cost);
  for(const i of p.ok){const T=S.tiles[i];if(lv){T.rd=lv;if(T.t==='forest')T.t='grass';}else delete T.rd;}
  roadsChanged(p.ok);return '';
}

/* Trampelpfade: verbindet jedes Gebäude ohne Anschluss auf kürzestem Weg mit dem Netz (beim Start und für ältere Spielstände) */
function autoRoads(){
  const hof=S.hof;if(hof===undefined)return;
  const hd=doorTile(hof),pass=i=>{const T=S.tiles[i];return T.t!=='water'&&T.t!=='rock'&&T.t!=='berg'&&T.o===undefined;};
  if(hd>=0&&pass(hd))S.tiles[hd].rd=S.tiles[hd].rd||1;
  roadNet();
  const goal=new Uint8Array(N*N);for(let i=0;i<N*N;i++)if(RCH[i])goal[i]=1;for(const t of ringTiles(hof,fpOf('hof')))if(pass(t))goal[t]=1;
  const list=BL.filter(i=>!noRoad(S.tiles[i].b.type)&&!CONN[i]).sort((a,b)=>{const[hx,hy]=bCtr(hof),[ax,ay]=bCtr(a),[bx,by]=bCtr(b);return Math.hypot(ax-hx,ay-hy)-Math.hypot(bx-hx,by-hy);});
  for(const i of list){const b=S.tiles[i].b,n=fpOf(b.type);
    const prev=new Int32Array(N*N).fill(-2),q=[];let qi=0,hit=-1;
    const start=[doorTile(i),...ringTiles(i,n)].filter(t=>t>=0&&pass(t));
    for(const t of start)if(prev[t]===-2){prev[t]=-1;q.push(t);}
    while(qi<q.length&&qi<4000){const c=q[qi++];if(goal[c]){hit=c;break;}const x=c%N,y=(c/N)|0;for(const[dx,dy]of N4){const xx=x+dx,yy=y+dy;if(!inb(xx,yy))continue;const j=idx(xx,yy);if(prev[j]===-2&&pass(j)){prev[j]=c;q.push(j);}}}
    if(hit<0)continue;
    for(let c=hit;c>=0;c=prev[c]){const T=S.tiles[c];if(!T.rd){T.rd=1;if(T.t==='forest')T.t='grass';}goal[c]=1;if(prev[c]===-1){b.rot=sideOf(i,n,c);}}
  }
}
/* Auf welcher Seite der Grundfläche liegt ein Nachbarfeld */
function sideOf(i0,n,t){for(const r of[0,1,2,3])if(sideTiles(i0,n,r).includes(t))return r;return defRot(S.tiles[i0].b.type);}

/* Laufwege der Leute über das Netz, zwischengespeichert bis sich Wege ändern */
const PATHC=new Map();
function entryOf(i){const dt=doorTile(i);if(dt>=0&&RCH[dt])return dt;const b=S.tiles[i].b,ring=ringTiles(i,fpOf(b.type)).filter(t=>RCH[t]);if(!ring.length)return -1;
  const dx=dt%N,dy=(dt/N)|0;ring.sort((a,c)=>Math.abs(a%N-dx)+Math.abs(((a/N)|0)-dy)-Math.abs(c%N-dx)-Math.abs(((c/N)|0)-dy));return ring[0];}
function roadPath(a,b){
  const key=a+'>'+b;if(PATHC.has(key))return PATHC.get(key);
  let out=null;
  if(a===b)out=[a];
  else if(a>=0&&b>=0){const prev=new Int32Array(N*N).fill(-2),q=[a];prev[a]=-1;let qi=0;
    while(qi<q.length){const c=q[qi++];if(c===b)break;const x=c%N,y=(c/N)|0;for(const[dx,dy]of N4){const xx=x+dx,yy=y+dy;if(!inb(xx,yy))continue;const j=idx(xx,yy);if(prev[j]===-2&&RCH[j]){prev[j]=c;q.push(j);}}}
    if(prev[b]!==-2){out=[];for(let c=b;c>=0;c=prev[c])out.push(c);out.reverse();}}
  if(PATHC.size>400)PATHC.delete(PATHC.keys().next().value);
  PATHC.set(key,out);return out;
}
