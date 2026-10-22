/* ---------- Wehr auf der großen Karte: Gelände, Wege der Plünderer, Mauern, Verteidiger, Schäden, Beute im Dorf ---------- */
const WALLT={palisade:1,tor:1},LINKT={palisade:1,tor:1,turm:1,bogenposten:1};
const isWall=b=>!!(b&&WALLT[b.type]);
const wallHP=b=>(B[b.type].hp||20)*(1+.5*(b.lvl-1));
/* Mauerform: Bit 1 = +x, 2 = −x, 4 = +y, 8 = −y Nachbar; 16 = einzelnes Tor quer zur Achse y. Neu bestimmt in derive() */
const WMASK=new WeakMap();let HURT=[];
function wallMasks(){
  HURT=[];
  for(const i of BL){const b=S.tiles[i].b;if(b.hurt)HURT.push(i);if(!isWall(b))continue;const x=i%N,y=(i/N)|0;let m=0,rx=0,ry=0;
    for(let k=0;k<4;k++){const xx=x+N4[k][0],yy=y+N4[k][1];if(!inb(xx,yy))continue;const j=idx(xx,yy),a=anc(j);if(a>=0&&LINKT[S.tiles[a].b.type])m|=1<<k;if(S.tiles[j].rd){if(k<2)rx++;else ry++;}}
    if(b.type==='tor'&&!m&&(rx>ry||(!rx&&!ry&&rotOf(b)%2)))m=16;
    WMASK.set(b,m);}
}
/* Zusatz für den Bildschlüssel: Mauerform, Schaden, Tor zu im Kampf */
function bKey(b){if(!isWall(b))return b.hurt?'h':'';return 'm'+(WMASK.has(b)?WMASK.get(b):-1)+(b.hurt?'h':'')+(b.type==='tor'&&battle&&!battle.done?'c':'');}
/* Verbrannt: Ruß über das fertige Gebäudebild legen */
function sootB(){ctx.save();ctx.globalCompositeOperation='source-atop';ctx.fillStyle='rgba(40,28,22,.5)';ctx.fillRect(-300,-420,600,640);
  const r=rng(11);ctx.fillStyle='rgba(18,12,10,.22)';for(let k=0;k<7;k++){ctx.beginPath();ctx.ellipse(r()*60-30,-r()*50,3+r()*5,2+r()*3,0,0,TAU);ctx.fill();}ctx.restore();}

/* ---------- Palisade und Tor: verbinden sich zu Nachbarn ---------- */
function stake(x,y,h,c1,c2,tl){ctx.fillStyle=c1;ctx.beginPath();ctx.moveTo(x-2.5,y+1);ctx.lineTo(x-2.5+tl,y-h);ctx.lineTo(x+tl,y-h-4);ctx.lineTo(x,y+1.5);ctx.fill();
  ctx.fillStyle=c2;ctx.beginPath();ctx.moveTo(x,y+1.5);ctx.lineTo(x+tl,y-h-4);ctx.lineTo(x+2.5+tl,y-h);ctx.lineTo(x+2.5,y+1);ctx.fill();}
const PALC=[['#8F6C46','#6E5236'],['#7A5C3A','#5E452B']];
function palArm(sx,sy,dx,dy,h,t,hurt,r){
  const st=hurt?.25:.125,ks=[];for(let f=st;f<=.5+1e-6;f+=st)ks.push(f);if(dx<0||dy<0)ks.reverse();
  pq(sx,sy,[[0,0,0],[dx*.5,dy*.5,0],[dx*.5+.05,dy*.5+.05,0],[.05,.05,0]],'rgba(70,52,36,.28)');
  for(const f of ks){const[x,y]=spt(sx,sy,dx*f,dy*f,0),c=PALC[Math.round(f*8)%2],hh=hurt?h*(.35+r()*.3):h;stake(x,y,hh,hurt?'#4E3B2A':c[0],hurt?'#3A2C20':c[1],hurt?(r()-.5)*6:0);}
  if(!hurt){pl(sx,sy,[0,0,h*.42],[dx*.5,dy*.5,h*.42],t>=2?'#4E4A46':'#5A3B24',1.4);if(t>=1)pl(sx,sy,[0,0,h*.78],[dx*.5,dy*.5,h*.78],t>=2?'#4E4A46':'#5A3B24',1.1);}
}
SHP.palisade={p(lv){return{t:TIER(lv),h:12+lv*1.4};},
  b(sx,sy,b){const o=this.p(b.lvl),r=rng(7),hurt=!!b.hurt;let m=WMASK.has(b)?WMASK.get(b):3;if(!m)m=rotOf(b)%2?12:3;
    if(o.t>=2&&!hurt)pq(sx,sy,[[-.12,-.12,0],[.12,-.12,0],[.12,.12,0],[-.12,.12,0]],'#8C8A84');
    if(m&2)palArm(sx,sy,-1,0,o.h,o.t,hurt,r);if(m&8)palArm(sx,sy,0,-1,o.h,o.t,hurt,r);
    const[x,y]=spt(sx,sy,0,0,0);stake(x,y,hurt?o.h*.4:o.h+2,hurt?'#4E3B2A':'#8F6C46',hurt?'#3A2C20':'#6E5236',0);
    if(m&1)palArm(sx,sy,1,0,o.h,o.t,hurt,r);if(m&4)palArm(sx,sy,0,1,o.h,o.t,hurt,r);},
  h(lv){return 18+lv*1.4;}};
SHP.tor={p(lv){return{t:TIER(lv),h:14+lv*1.4};},
  b(sx,sy,b){const o=this.p(b.lvl),h=o.h,hurt=!!b.hurt,m=WMASK.has(b)?WMASK.get(b):3,ay=m&16||(!(m&3)&&(m&12)),closed=!!(battle&&!battle.done);
    const P=(u,w,z)=>ay?[w,u,z]:[u,w,z],e=.06,ph=h+9;
    const post=u=>{const[cx,cy]=ay?[0,u]:[u,0];shadowBox(sx,sy,e,e,ph,cx,cy);walls(sx,sy,e,e,ph,hurt?'#4E3B2A':'#6E4A2E','wood',0,cx,cy);pq(sx,sy,[[cx-e,cy-e,ph],[cx+e,cy-e,ph],[cx+e,cy+e,ph],[cx-e,cy+e,ph]],'#8A6440');};
    pq(sx,sy,[P(-.45,-.1,0),P(.45,-.1,0),P(.45,.1,0),P(-.45,.1,0)],'rgba(110,90,62,.35)');
    post(-.4);
    if(!hurt){
      const leaf=(u0,u1,sw)=>{const a=P(u0,0,1),b2=closed?P(u1,0,1):P(u0+(u1-u0)*.25,sw,1),c=[b2[0],b2[1],h-1],d=[a[0],a[1],h-1];pq(sx,sy,[a,b2,c,d],'#9C7048');
        for(let k=1;k<4;k++){const f=k/4,p0=[a[0]+(b2[0]-a[0])*f,a[1]+(b2[1]-a[1])*f];pl(sx,sy,[p0[0],p0[1],1],[p0[0],p0[1],h-1],'rgba(70,46,26,.55)',.7);}
        pl(sx,sy,[a[0],a[1],h*.3],[b2[0],b2[1],h*.3],'#4E3B2A',1.2);pl(sx,sy,[a[0],a[1],h*.75],[b2[0],b2[1],h*.75],'#4E3B2A',1.2);};
      leaf(-.36,0,-.3);leaf(.36,0,-.3);}
    else for(const u of[-.25,.2]){const p=P(u,.05,0),[x,y]=spt(sx,sy,p[0],p[1],0);stake(x,y,h*.35,'#4E3B2A','#3A2C20',3);}
    post(.4);
    if(!hurt){const a=P(-.47,0,ph-2),b2=P(.47,0,ph-2);pq(sx,sy,[a,b2,[b2[0],b2[1],ph+2],[a[0],a[1],ph+2]],'#5A3B24');
      pq(sx,sy,[P(-.5,-.12,ph+2),P(.5,-.12,ph+2),P(.5,.12,ph+2),P(-.5,.12,ph+2)],o.t>=2?'#9A3224':'#6E7F4E');
      const[x,y]=spt(sx,sy,0,0,ph+4);ell(x,y,3.4,3.4,'#C4862A');ell(x,y,1.4,1.4,'#7A2418');}},
  h(lv){return 30+lv*1.4;}};

/* ---------- Gitter für den Kampf ---------- */
/* C: Laufkosten der Plünderer je Feld (0 = unpassierbar), Wege schneller, Wald und Marsch langsamer, Mauern so teuer wie das Einreißen.
   F: dasselbe für Dorfbewohner und Verteidiger, Tore offen, Mauern zu. Wl: Mauer-Anker je Feld */
const D8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
function kGrid(bt){
  const C=new Float32Array(N*N),F=new Float32Array(N*N),Wl=new Int32Array(N*N).fill(-1),dps=bt?bt.dps:2;
  for(let i=0;i<N*N;i++){const T=S.tiles[i];let c;
    if(T.o!==undefined){const a=T.o,b=S.tiles[a].b;if(isWall(b)){if(b.hurt){C[i]=F[i]=1.3;}else{Wl[i]=a;C[i]=2+(bt&&bt.wh[a]!==undefined?bt.wh[a]:wallHP(b))/dps*.5;F[i]=b.type==='tor'?(T.rd?1/ROADS[T.rd].sp:1):0;}}continue;}
    if(T.t==='water')c=T.rd?1:0;else if(T.t==='berg'||T.t==='rock')c=0;
    else c=T.rd?1/ROADS[T.rd].sp:(T.t==='forest'||T.t==='moor')?1.8:T.t==='sand'||T.t==='tundra'?1.15:1;
    C[i]=F[i]=c;}
  return{C,F,Wl};
}
/* Nachbarfeld k von i, wenn begehbar; schräg nur, wenn beide Ecken frei sind (kein Schneiden von Ecken) */
function kStep(g,i,k,raid){const x=i%N,y=(i/N)|0,s=D8[k],xx=x+s[0],yy=y+s[1];if(!inb(xx,yy))return -1;const j=idx(xx,yy),A=raid?g.C:g.F;if(!(A[j]>0))return -1;
  if(s[2]>1){const a=idx(xx,y),c=idx(x,yy);if(!(A[a]>0)||!(A[c]>0)||g.Wl[a]>=0||g.Wl[c]>=0||g.Wl[i]>=0||g.Wl[j]>=0)return -1;}return j;}
/* Binärer Heap auf festen Feldern, für Dijkstra und A* */
const KH={k:new Float32Array(1<<17),v:new Int32Array(1<<17),n:0,top:0};
function hPush(k,v){if(KH.n>=KH.k.length)return;const K=KH.k,V=KH.v;let i=KH.n++;while(i>0){const p=(i-1)>>1;if(K[p]<=k)break;K[i]=K[p];V[i]=V[p];i=p;}K[i]=k;V[i]=v;}
function hPop(){const K=KH.k,V=KH.v,top=V[0];KH.top=K[0];const n=--KH.n;if(n>0){const k=K[n],v=V[n];let i=0;for(;;){let c=2*i+1;if(c>=n)break;if(c+1<n&&K[c+1]<K[c])c++;if(K[c]>=k)break;K[i]=K[c];V[i]=V[c];i=c;}K[i]=k;V[i]=v;}return top;}
/* Wegfeld zu einem Gebäude: Kosten von jedem Feld bis an seinen Rand. Je Ziel einmal, neu nur wenn eine Mauer fällt (gv) */
function kFlow(bt,tgt){
  let f=bt.flows.get(tgt);if(f&&f.gv===bt.gv)return f;
  if(bt.fb<=0)return null;bt.fb--;
  const g=bt.g,C=g.C,d=f?f.d:new Float32Array(N*N);d.fill(1e9);KH.n=0;let seeds=0;
  for(const t of ringTiles(tgt,fpOf(S.tiles[tgt].b.type)))if(C[t]>0){d[t]=0;hPush(0,t);seeds++;}
  while(KH.n){const i=hPop(),di=KH.top;if(di>d[i])continue;const ci=C[i];for(let k=0;k<8;k++){const j=kStep(g,i,k,1);if(j<0)continue;const nd=di+ci*D8[k][2];if(nd<d[j]){d[j]=nd;hPush(nd,j);}}}
  f={gv:bt.gv,d,ok:seeds>0};bt.flows.set(tgt,f);return f;
}
function kNext(bt,fl,c){const d=fl.d,C=bt.g.C;let best=-1,bv=1e9;for(let k=0;k<8;k++){const j=kStep(bt.g,c,k,1);if(j<0)continue;const v=d[j]+C[j]*D8[k][2];if(v<bv){bv=v;best=j;}}return bv<1e8?best:-1;}
/* A* für Dorfbewohner und Verteidiger (Tore offen) */
const KA={g:new Float32Array(N*N),st:new Uint32Array(N*N),p:new Int32Array(N*N),gen:0};
function kPath(g,a,b,lim){
  if(a<0||b<0)return null;const G=KA.g,ST=KA.st,P=KA.p,gen=++KA.gen,bx=b%N,by=(b/N)|0,hh=j=>Math.hypot(j%N-bx,((j/N)|0)-by)*.45;
  KH.n=0;G[a]=0;ST[a]=gen;P[a]=-1;hPush(hh(a),a);let n=0,hit=-1;lim=lim||3000;
  while(KH.n&&n++<lim){const i=hPop();if(i===b){hit=i;break;}const gi=G[i];
    for(let k=0;k<8;k++){const j=kStep(g,i,k,0);if(j<0)continue;const ng=gi+g.F[j]*D8[k][2];if(ST[j]!==gen||ng<G[j]){ST[j]=gen;G[j]=ng;P[j]=i;hPush(ng+hh(j),j);}}}
  if(hit<0)return null;const out=[];for(let c=hit;c>=0;c=P[c])out.push(c);return out.reverse();
}
const cellOf=(x,y)=>{const rx=Math.round(x),ry=Math.round(y);return inb(rx,ry)?idx(rx,ry):-1;};
/* Nächstes begehbares Feld für Freunde in der Nähe eines Punkts */
function freeNear(g,x,y){const c=cellOf(x,y);if(c>=0&&g.F[c]>0)return c;let best=-1,bd=1e9;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const j=cellOf(x+dx,y+dy);if(j<0||!(g.F[j]>0))continue;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=j;}}return best;}

/* ---------- Küste: Landestellen und Hafen ---------- */
/* Küstenfelder am offenen Meer, die vom Hof aus zu Fuß erreichbar sind, nach Entfernung zum Hof */
let LPC=null;
function coastCands(){
  const key=S.hof+'|'+BL.length+'|'+S.open.join(',')+'|'+ROADV;if(LPC&&LPC.key===key)return LPC;
  const g=kGrid(null),[hx,hy]=bCtr(S.hof),reach=new Uint8Array(N*N),st=[];
  for(const t of ringTiles(S.hof,fpOf('hof')))if(g.C[t]>0&&!reach[t]){reach[t]=1;st.push(t);}
  while(st.length){const i=st.pop();for(let k=0;k<4;k++){const j=kStep(g,i,k,1);if(j>=0&&!reach[j]){reach[j]=1;st.push(j);}}}
  const cand=[];
  for(let i=0;i<N*N;i++){const T=S.tiles[i];if(!reach[i]||T.o!==undefined||T.t==='water')continue;const x=i%N,y=(i/N)|0;
    for(const[dx,dy]of N4){if(!inb(x+dx,y+dy)||!isSea(x+dx,y+dy))continue;let open=0;for(let r=1;r<7;r++)if(isSea(x+dx*r,y+dy*r))open++;
      if(open>=6){cand.push({x,y,i,d:Math.hypot(x-hx,y-hy),dx,dy,lock:!unlocked(i)});break;}}}
  cand.sort((a,b)=>a.d+(a.lock?40:0)-b.d-(b.lock?40:0));
  LPC={key,cand,pts:null,hb:null};return LPC;
}
/* Hafen: am Fischersteg, sonst die nächste Küste am Hof */
function harbor(){
  const L=coastCands();if(L.hb)return L.hb;let h=null;
  for(const i of BL){if(S.tiles[i].b.type!=='steg')continue;const x=i%N,y=(i/N)|0;for(const[dx,dy]of N4)if(isSea(x+dx,y+dy)&&isSea(x+dx*2,y+dy*2)){h={x,y,dx,dy,side:.9};break;}if(h)break;}
  if(!h&&L.cand.length){const c=L.cand[0];h={x:c.x,y:c.y,dx:c.dx,dy:c.dy,side:0};}
  if(h){h.bx=h.x+h.dx*1.7-h.dy*h.side;h.by=h.y+h.dy*1.7+h.dx*h.side;h.a=Math.atan2(h.dy,h.dx);}
  L.hb=h;return h;
}
/* Landestellen: echte Küstenpunkte nahe am Dorf, zwei aus verschiedenen Richtungen, nicht im eigenen Hafen */
function landingPoints(){
  const L=coastCands();if(L.pts)return L.pts;const[hx,hy]=bCtr(S.hof),hb=harbor(),pts=[];
  for(const c of L.cand){if(c.d<5)continue;if(hb&&Math.hypot(c.x-hb.x,c.y-hb.y)<4)continue;const ang=Math.atan2(c.y-hy,c.x-hx);
    if(pts.length&&Math.abs(Math.atan2(Math.sin(ang-pts[0].ang),Math.cos(ang-pts[0].ang)))<.9)continue;c.ang=ang;pts.push(Object.assign({},c));if(pts.length===2)break;}
  if(!pts.length&&L.cand.length)pts.push(Object.assign({},L.cand[0]));
  if(!pts.length)pts.push({x:hx+3,y:hy+3,i:idx(Math.round(hx+3),Math.round(hy+3)),dx:1,dy:0});
  if(pts.length<2)pts.push(Object.assign({},pts[0]));
  for(const p of pts){p.a=Math.atan2(p.dy,p.dx);p.bx=p.x+p.dx*1.6;p.by=p.y+p.dy*1.6;}
  L.pts=pts;return pts;
}

/* ---------- Verteidiger ---------- */
/* Die Helden der Sippe (wer daheim und gesund ist) kommen aus dem Hof, jeder Wachturm schickt eine Wache, ab Stufe 4 zwei */
function crewHome(){const away=S.run&&!S.run.over?S.run.crew.map(c=>c.ci):[];return S.crew.map((c,ci)=>c.wounded<=now()&&!away.includes(ci)?ci:-1).filter(ci=>ci>=0);}
const heroStat=()=>{const H=hofL(),w=S.res.waffe>=1,ru=S.res.ruestung>=1;return{hp:14+5*H+(ru?10:0),atk:2+.6*H+(w?3:0),w,ru};};
const guardStat=L=>({hp:12+5*L,atk:1.6+.7*L});
function guards(){const out=[];for(const i of BL){const b=S.tiles[i].b;if(b.type!=='turm'||b.hurt||(b.job==='build'&&busy(b)))continue;for(let q=0;q<(b.lvl>=4?2:1);q++)out.push(i);}return out;}
/* Stärke für die rechnerische Lösung offline */
function defPow(){let hp=0,dmg=0;const h=heroStat();for(const ci of crewHome()){hp+=h.hp;dmg+=h.atk*.6;}for(const i of guards()){const s=guardStat(S.tiles[i].b.lvl);hp+=s.hp;dmg+=s.atk*.6;}return{hp,dmg};}
const DCOL=['#5C7246','#9A3224','#3F5E6B'];
function mkDefs(bt){
  const ds=[],hs=heroStat(),hc=freeNear(bt.g,...doorPos(S.hof));
  for(const ci of crewHome()){const c=hc>=0?[hc%N,(hc/N)|0]:doorPos(S.hof);ds.push({k:'held',ci,n:S.crew[ci].n,col:DCOL[ci%3],x:c[0]+rand(-.2,.2),y:c[1]+rand(-.2,.2),hp:hs.hp,max:hs.hp,atk:hs.atk,helm:1});}
  for(const i of guards()){const s=guardStat(S.tiles[i].b.lvl),sp=ringTiles(i,1).find(t=>bt.g.F[t]>0);if(sp===undefined)continue;
    ds.push({k:'wache',n:'Wache',col:'#6B5A4A',x:sp%N+rand(-.2,.2),y:((sp/N)|0)+rand(-.2,.2),hp:s.hp,max:s.hp,atk:s.atk,helm:0});}
  ds.forEach((d,k)=>Object.assign(d,{hx:d.x,hy:d.y,st:'wait',cd:rand(0,.6),ph:rand(0,TAU),tgt:null,path:null,pk:0,rp:k*.11,retgt:0,hit:-9,id:k}));
  return ds.slice(0,10);
}
const LEASH=16,DSP=1.15;
/* Gehen entlang eines A*-Wegs, neu gesucht alle 0,8 s oder wenn das Ziel weit gewandert ist */
function walkTo(bt,o,tx,ty,dt){
  const g=bt.g;o.rp-=dt;const goal=freeNear(g,tx,ty);
  if((!o.path||o.rp<=0||(o.goal!==goal&&o.path))&&bt.pb>0&&goal>=0){const a=freeNear(g,o.x,o.y);if(a>=0){bt.pb--;o.path=kPath(g,a,goal,2500);o.pk=1;o.goal=goal;o.rp=.8;}}
  let px=tx,py=ty;if(o.path&&o.pk<o.path.length){const c=o.path[o.pk];px=c%N;py=(c/N)|0;if(Math.hypot(px-o.x,py-o.y)<.15){o.pk++;return;}}
  const c=cellOf(o.x,o.y),sp=dt*DSP/Math.max(.45,c>=0&&g.F[c]>0?g.F[c]:1),dx=px-o.x,dy=py-o.y,dd=Math.hypot(dx,dy);if(dd<1e-3)return;
  const v=Math.min(dd,sp),nx=o.x+dx/dd*v,ny=o.y+dy/dd*v,ok=(x,y)=>{const j=cellOf(x,y);return j>=0&&(g.F[j]>0||j===c);};
  if(ok(nx,ny)){o.x=nx;o.y=ny;}else if(ok(nx,o.y))o.x=nx;else if(ok(o.x,ny))o.y=ny;
}
function defStep(bt,dt){
  for(const d of bt.ds){
    if(d.st==='down')continue;d.ph+=dt*9;if(bt.t<bt.ready)continue;
    if(d.tgt&&d.tgt.st==='dead')d.tgt=null;
    d.retgt-=dt;if(!d.tgt||d.retgt<=0){d.retgt=.7;let best=null,bd=1e9;
      for(const r of bt.rs){if(r.st==='dead'||r.st==='boat'||r.st==='land')continue;if(Math.hypot(r.x-bt.hx,r.y-bt.hy)>LEASH)continue;const dd=Math.hypot(r.x-d.x,r.y-d.y)+(r.foe&&r.foe!==d?1.5:0);if(dd<bd){bd=dd;best=r;}}
      if(best!==d.tgt){d.tgt=best;d.path=null;}}
    const r=d.tgt;
    if(!r){if(Math.hypot(d.hx-d.x,d.hy-d.y)>.3){d.st='go';walkTo(bt,d,d.hx,d.hy,dt);}else d.st='wait';continue;}
    const dd=Math.hypot(r.x-d.x,r.y-d.y),reach=r.wa>=0?1.7:.62;
    if(dd<=reach){d.st='fight';d.fx=r.x-d.x;if(!r.foe||r.foe.st==='down')r.foe=d;d.cd-=dt;
      if(d.cd<=0){d.cd=1;hurtR(bt,r,d.atk*bt.mut*rand(.85,1.15),'#2E4650');d.swing=bt.t;}continue;}
    d.st='go';walkTo(bt,d,r.x,r.y,dt);
  }
}

/* ---------- Dorfbewohner flüchten zum Hof (Haken in updVill) ---------- */
function fleeV(v){
  const bt=battle;if(!bt)return false;
  if(bt.done){if(v.flee){v.flee=0;v.path=[];v.k=0;v.wait=rand(.3,3);}return false;}
  if(v.flee===bt.id){if(v.k>=v.path.length){v.wait=1;v.carry=null;return true;}return false;}
  if(bt.pb<=0)return false;bt.pb--;
  const hd=doorPos(S.hof),a=freeNear(bt.g,v.x,v.y),b=freeNear(bt.g,hd[0],hd[1]),p=a>=0&&b>=0?kPath(bt.g,a,b,4000):null;
  v.flee=bt.id;v.path=(p?p.map(c=>[c%N,(c/N)|0]):[]).concat([hd]);v.k=0;v.to=S.hof;v.carry=null;v.cart=0;v.wait=0;return false;
}

/* ---------- Schäden: kurz brennen, dann reparieren ---------- */
const BURN={};
function repairCost(b){const base=b.type==='hof'?{holz:20,stein:10}:B[b.type].cost,c={};for(const k in base)c[k]=Math.max(1,Math.ceil(base[k]*.25*Math.sqrt(b.lvl)));if(!Object.keys(c).length)c.holz=10;return c;}
function hurtList(){return BL.filter(i=>S.tiles[i].b.hurt);}
function repairAllCost(){const c={};for(const i of hurtList()){const r=repairCost(S.tiles[i].b);for(const k in r)c[k]=(c[k]||0)+r[k];}return c;}
function fixB(i){const b=S.tiles[i].b;delete b.hurt;delete BURN[i];sparks(i);anim[i]=UT-250;}
function doRepair(i){
  const b=S.tiles[i]&&S.tiles[i].b;if(!b||!b.hurt)return;if(battle&&!battle.done){toast(IC('schloss','i24')+'Erst nach dem Kampf');return;}
  const c=repairCost(b);if(!has(c)){toast(IC('schloss','i24')+'Zu wenig Rohstoffe');return;}pay(c);fixB(i);derive();toast(IC('arbeit','i24')+B[b.type].n+' repariert');save();
}
function repairAll(){
  const l=hurtList();if(!l.length)return;const c=repairAllCost();if(!has(c)){toast(IC('schloss','i24')+'Zu wenig Rohstoffe');return;}
  pay(c);l.forEach(fixB);derive();toast(IC('arbeit','i24')+l.length+' Gebäude repariert');save();if(battle&&battle.done)showBattleResult();
}
function repairHTML(i){const b=S.tiles[i].b,c=repairCost(b);
  return '<p class="note warn">'+IC('feuer','i16')+' Beschädigt. '+(B[b.type].kind==='def'?'Schützt und schießt erst wieder nach der Reparatur.':'Arbeitet erst wieder nach der Reparatur.')+'</p><div class="btns"><button class="btn gold wide"'+btnCost(c)+' data-act="repair" data-i="'+i+'">'+IC('arbeit','i16')+'Reparieren '+costHTML(c)+'</button></div>';}
/* Rechnerische Niederlage: ein bis zwei wertvolle Gebäude werden beschädigt */
function raidHurt(){const l=BL.filter(i=>{const b=S.tiles[i].b;return !b.hurt&&!isWall(b)&&bVal(b)>=5;}).sort((a,b)=>bVal(S.tiles[b].b)-bVal(S.tiles[a].b));for(const i of l.slice(0,1+(Math.random()<.5?1:0)))S.tiles[i].b.hurt=1;wallMasks();}

/* ---------- Ankündigung: Horn blasen, Kamera zur Landestelle ---------- */
function raidAnnounce(){
  toast(IC('horn','i24')+'Plünderer in Sicht! Blast das Horn.');
  if(tab==='insel'&&!place&&$('#modal').hidden){const L=landingPoints(),[hx,hy]=bCtr(S.hof),[wx,wy]=tilePos(L[0].x*.7+hx*.3,L[0].y*.7+hy*.3);glideTo(wx,wy);}
}
let annEl=null,annTxt='';
function annUpd(){
  const show=S.raid.pending&&!battle&&tab==='insel';
  if(!show){if(annEl){annEl.remove();annEl=null;}return;}
  if(!annEl||!annEl.isConnected){annEl=document.createElement('div');annEl.id='rann';annEl.className='pn';
    annEl.innerHTML=IC('horn','i36')+'<div class="t"><b>Plünderer in Sicht!</b><small>Landung in <span id="rannT"></span>. Das Horn ruft Helden und Wachen.</small></div><button class="btn red" data-act="defend">'+IC('horn','i24')+'Horn blasen</button>';$('#app').appendChild(annEl);annTxt='';}
  const s=fmtT(Math.max(0,120e3-(now()-S.raid.since)));if(s!==annTxt){annTxt=s;$('#rannT').textContent=s;}
}
/* Pro Bild aus loop(): Kampf weiterrechnen (steht in der Pause), Ankündigung zeigen */
function defLoop(rdt){if(!S)return;if(battle){battleStep(rdt*CLK.k);updBattleHud();}annUpd();}

/* ---------- Zeichnen ---------- */
function drawRangeAt(cx,cy,rg,alpha,col){const[sx,sy]=tilePos(cx,cy),rx=rg*TW/2*Math.SQRT2,ry=rg*TH/2*Math.SQRT2;
  ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=col||'rgba(255,246,214,.16)';ctx.beginPath();ctx.ellipse(sx,sy,rx,ry,0,0,TAU);ctx.fill();
  ctx.setLineDash([7,5]);ctx.lineDashOffset=-UT/80;ctx.strokeStyle='#FFF8E6';ctx.lineWidth=1.6;ctx.stroke();ctx.restore();}
/* Beim Platzieren von Türmen: vorhandene Reichweiten blass, die neue hell */
function placeRange(){if(!place||place.i0<0||!RANGE[place.type])return;for(const i of BL)if(RANGE[S.tiles[i].b.type]&&!S.tiles[i].b.hurt)drawRange(i,.3);drawRangeAt(place.i0%N,(place.i0/N)|0,RANGE[place.type],1,'rgba(226,176,74,.2)');}
function drawDef(d){
  const bt=battle,[sx,sy0]=tilePos(d.x,d.y);let sy=sy0;
  if(d.st==='down'){const k=Math.min(1,(bt.t-d.dieT)/1.5);ctx.globalAlpha=1-k*.6;figAt(sx,sy);ell(sx,sy,6,2.2,'rgba(0,0,0,.2)');ctx.fillStyle=d.col;ctx.beginPath();ctx.roundRect(sx-7,sy-4,9,4.5,2);ctx.fill();ell(sx+4.5,sy-2,2.6,2.4,'#F0C9A8');ell(sx-3,sy-6,3.4,1.6,'#C4862A');ctx.restore();ctx.globalAlpha=1;return;}
  figAt(sx,sy);
  const mv=d.st==='go',sw=mv?Math.sin(d.ph)*2.4:0,bob=mv?Math.abs(Math.sin(d.ph))*1.2:0,hf=bt.t-d.hit<.15,fl=(d.fx||0)<0?-1:1;
  ell(sx,sy,4.5,2,'rgba(0,0,0,.2)');
  ctx.strokeStyle='#2F2724';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(sx-1.3,sy-5);ctx.lineTo(sx-1.3-sw*.6,sy);ctx.moveTo(sx+1.3,sy-5);ctx.lineTo(sx+1.3+sw*.6,sy);ctx.stroke();
  sy-=bob;
  ctx.fillStyle=hf?'#FFFFFF':d.col;ctx.beginPath();ctx.roundRect(sx-3.6,sy-13,7.2,8.5,2);ctx.fill();
  ctx.fillStyle='#5A3B24';ctx.fillRect(sx-3.6,sy-8.4,7.2,1.3);
  ctx.fillStyle='#F0C9A8';ctx.beginPath();ctx.arc(sx,sy-15.6,2.9,0,TAU);ctx.fill();
  if(d.helm){ctx.fillStyle='#A9B3B7';ctx.beginPath();ctx.arc(sx,sy-16.4,3.2,Math.PI,0);ctx.fill();ctx.fillRect(sx-.5,sy-16.4,1,3);}else{ctx.fillStyle='#6E4A2E';ctx.beginPath();ctx.arc(sx,sy-16.4,3,Math.PI,0);ctx.fill();}
  const sa=d.st==='fight'?Math.sin((bt.t-(d.swing||0))*14)*1.1:.2;
  ctx.save();ctx.translate(sx+3.5*fl,sy-10);ctx.scale(fl,1);ctx.rotate(-.5+sa);ctx.fillStyle='#5A3B24';ctx.fillRect(-.6,-2,1.2,3);ctx.fillStyle='#D5DCDF';ctx.beginPath();ctx.moveTo(-.9,-2);ctx.lineTo(-.6,-11);ctx.lineTo(0,-12.5);ctx.lineTo(.6,-11);ctx.lineTo(.9,-2);ctx.fill();ctx.fillStyle='#C4862A';ctx.fillRect(-2,-2.4,4,1);ctx.restore();
  ell(sx-4*fl,sy-9,3.6,4,d.col);ell(sx-4*fl,sy-9,2.6,3,'#E7B54C');ell(sx-4*fl,sy-9,1,1.1,'#5A3B24');
  ctx.restore();
  if(d.hp<d.max){const y=sy0-17;ctx.fillStyle='rgba(34,52,58,.8)';ctx.fillRect(sx-7,y,14,3);ctx.fillStyle='#7BAE5A';ctx.fillRect(sx-6.5,y+.5,13*Math.max(0,d.hp/d.max),2);}
}
/* Langschiff: Drachenkopf, Schilde an der Reling, Segel gesetzt oder gerefft, Beutekisten */
function longship(gx,gy,ang,furl,cargo,t){
  const[sx,sy0]=tilePos(gx,gy),sy=sy0+Math.sin(t/650+gx)*1.3,fl=Math.cos(ang)-Math.sin(ang)>0?1:-1;
  ctx.save();ctx.translate(sx,sy);ctx.scale(fl,1);
  ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(0,5,26,3.4,0,0,TAU);ctx.fill();
  ctx.fillStyle='#4A3222';ctx.beginPath();ctx.moveTo(-24,-3);ctx.quadraticCurveTo(0,12,24,-3);ctx.closePath();ctx.fill();
  ctx.fillStyle='#5A3B24';ctx.beginPath();ctx.moveTo(-24,-3);ctx.lineTo(24,-3);ctx.lineTo(22,0);ctx.lineTo(-22,0);ctx.fill();
  ctx.beginPath();ctx.moveTo(21,-2);ctx.quadraticCurveTo(28,-8,26,-16);ctx.lineTo(30,-17);ctx.lineTo(28,-13);ctx.quadraticCurveTo(30,-6,23,0);ctx.fill();
  ctx.beginPath();ctx.moveTo(-21,-2);ctx.quadraticCurveTo(-28,-8,-27,-13);ctx.lineTo(-24,-12);ctx.quadraticCurveTo(-24,-6,-19,0);ctx.fill();
  for(let k=-16;k<=16;k+=6){ell(k,-2.5,2.4,2.4,(k/6|0)%2?'#E7B54C':'#9A3224');ell(k,-2.5,.8,.8,'#4A3222');}
  if(cargo){for(let k=0;k<cargo;k++){const x=-10+k*7;ctx.fillStyle='#8A5A32';ctx.fillRect(x,-8,6,4.5);ctx.fillStyle='#D9A33A';ctx.fillRect(x+2.4,-8,1.2,4.5);}}
  ctx.fillStyle='#3B3532';ctx.fillRect(-.7,furl?-20:-30,1.4,furl?18:28);
  if(furl){ctx.fillStyle='#E8DFCC';ctx.beginPath();ctx.ellipse(0,-19,11,1.8,0,0,TAU);ctx.fill();}
  else{ctx.fillStyle='#F1E9DA';ctx.fillRect(-12,-29,24,17);ctx.fillStyle='#9A3224';for(let k=-12;k<12;k+=8)ctx.fillRect(k,-29,4,17);}
  ctx.restore();
}
/* Schiffszustand: daheim im Hafen, auf Raubzug draußen auf See, auf der Heimfahrt mit Beute */
let SHIPS={k:'',t:0};
function shipEnt(ent,ts){
  const h=harbor();if(!h)return;const R=S.run,k=!R?'dock':R.over?'back':'away';
  if(SHIPS.k!==k){SHIPS={k,t:T0,from:SHIPS.dist||0};}
  const s=(T0-SHIPS.t)/1000;let dist=0;
  if(k==='away')dist=Math.min(15,SHIPS.from+s*1.2);else dist=Math.max(0,(k==='back'?SHIPS.from||15:SHIPS.from)-s*1.6);
  SHIPS.dist=dist;const wob=dist>0?Math.sin(T0/2600)*Math.min(1,dist/6)*2:0;
  const gx=h.bx+h.dx*dist-h.dy*wob,gy=h.by+h.dy*dist+h.dx*wob,head=k==='away'?h.a:h.a+Math.PI,cargo=k==='back'&&R.over.ok?Math.min(4,1+Math.floor(Object.keys(R.over.got||{}).length)):0;
  ent(gx,gy,gx+gy,()=>longship(gx,gy,head,k==='dock'||dist===0,cargo,ts));
}
/* Trophäen am Hof: Schilde, Banner und Truhen, je gewonnenem Raubzug eine mehr (höchstens 12) */
const TROK=['schild','truhe','schild','banner','schild','truhe','banner','schild','truhe','schild','banner','truhe'];
let TRC=null;
function trophySpots(){
  const key=S.hof+'|'+BL.length+'|'+ROADV;if(TRC&&TRC.key===key)return TRC.sp;const n=fpOf('hof'),sp=[];
  for(const r of[0,1,3,2])for(const t of sideTiles(S.hof,n,r)){const T=S.tiles[t];if(T.o!==undefined||T.rd||T.t==='water'||T.t==='rock'||T.t==='berg'||T.t==='forest')continue;sp.push(t);if(sp.length>=4)break;}
  TRC={key,sp:sp.slice(0,4)};return TRC.sp;
}
function trophyItem(x,y,k,j,t){
  if(k==='schild'){ctx.fillStyle='#5A3B24';ctx.fillRect(x-.6,y-11,1.2,11);const c=['#9A3224','#3F5E6B','#5C7246','#C4862A'][j%4];ell(x,y-7,4.6,5.2,'#C4862A');ell(x,y-7,3.8,4.4,c);ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x,y-11);ctx.lineTo(x,y-3);ctx.moveTo(x-3.6,y-7);ctx.lineTo(x+3.6,y-7);ctx.stroke();ell(x,y-7,1.2,1.2,'#B7C1C5');}
  else if(k==='truhe'){ell(x,y+.5,5,1.8,'rgba(0,0,0,.18)');ctx.fillStyle='#7A4E2C';ctx.fillRect(x-4.5,y-5,9,5);ctx.fillStyle='#A06A3A';ctx.beginPath();ctx.moveTo(x-4.5,y-5);ctx.quadraticCurveTo(x,y-9,x+4.5,y-5);ctx.fill();ctx.fillStyle='#D9A33A';ctx.fillRect(x-.8,y-6.5,1.6,6.5);ell(x+2,y-7.5,1.2,.7,'#F6CA52');}
  else{ctx.fillStyle='#3B3532';ctx.fillRect(x-.6,y-24,1.2,24);flag(x,y-23,t+j,j%2?'#9A3224':'#3F5E6B');}
}
function trophyEnt(ent){
  const w=S.wins.reduce((a,b)=>a+b,0);if(!w||S.hof===undefined)return;const sp=trophySpots(),m=Math.min(12,w,sp.length*3);
  for(let s=0;s<sp.length&&s*3<m;s++){const t=sp[s],x=t%N,y=(t/N)|0;
    ent(x,y,x+y+.02,()=>{const[sx,sy]=tilePos(x,y),tt=T0/1000;for(let j=s*3;j<Math.min(m,s*3+3);j++){const u=(j%3-1)*.26;const[px,py]=spt(sx,sy,u,-u*.3,0);trophyItem(px,py,TROK[j],j,tt);}});}
}
/* Figuren, Boote, Schiff und Trophäen in die Tiefensortierung von draw() geben */
function defEnts(ent,ts){
  const bt=battle;
  if(bt){for(const r of bt.rs)if(r.st!=='boat')ent(r.x,r.y,r.x+r.y+.1,()=>drawRaider(r));for(const d of bt.ds)ent(d.x,d.y,d.x+d.y+.1,()=>drawDef(d));for(const l of bt.L)ent(l.bx,l.by,l.bx+l.by,()=>boatAt(l.bx,l.by,l.a+Math.PI,'lang',ts));}
  else if(S.raid.pending){const k=Math.min(1,(now()-S.raid.since)/15000);for(const l of landingPoints()){const gx=l.bx+l.dx*(1-k)*6,gy=l.by+l.dy*(1-k)*6;ent(gx,gy,gx+gy,()=>boatAt(gx,gy,l.a+Math.PI,'lang',ts));}}
  shipEnt(ent,ts);trophyEnt(ent);
}
/* Über allem: Kampfeffekte, nachbrennende und beschädigte Gebäude mit Rauch und Hammer */
function flames(sx,sy,h,k){for(let q=0;q<3;q++){const f=Math.sin(T0/90+q*2)*1.5,x=sx-8*k+q*8*k,y=sy-h+4;ctx.fillStyle=q%2?'#F6CA52':'#E07B39';ctx.beginPath();ctx.moveTo(x-4*k,y);ctx.quadraticCurveTo(x-3*k,y-8*k-f,x,y-13*k-f);ctx.quadraticCurveTo(x+3*k,y-8*k,x+4*k,y);ctx.fill();}}
function smoke(sx,sy,h,a){for(let q=0;q<3;q++){const p=((T0/1600)+q/3)%1;ctx.fillStyle='rgba(70,66,64,'+(a*.45*(1-p))+')';ctx.beginPath();ctx.arc(sx-4+p*10,sy-h-6-p*34,3+p*7,0,TAU);ctx.fill();}}
function defTop(){
  if(battle)drawBattleTop();
  for(const i of HURT){const b=S.tiles[i].b;if(!b||!b.hurt||battle&&battle.burnt[i]!==undefined)continue;const[sx,sy]=bPos(i),h=topH(b)*.7;
    const px=W/2+view.x+sx*view.z,py=H/2+view.y+sy*view.z;if(px<-80||px>W+80||py<-40||py>H+200)continue;
    if(BURN[i]>T0)flames(sx,sy,h,1);smoke(sx,sy,h,BURN[i]>T0?1:.4);
    if(!battle&&!isWall(b)){const k=1+Math.sin(UT/320)*.06,y=sy-topH(b)-12;ctx.save();ctx.translate(sx,y);ctx.scale(k,k);ell(0,0,8,8,'#E2B04A');ctx.strokeStyle='#172125';ctx.lineWidth=1.4;ctx.stroke();ctx.drawImage(iconC('arbeit'),-6,-6,12,12);ctx.restore();}}
}
/* Leiste für die Ankündigung, gleich gestellt wie die Kampfleiste */
{const st=document.createElement('style');st.textContent='#rann{position:absolute;left:calc(var(--lw) + (100% - var(--lw) - var(--rw)) / 2);transform:translateX(-50%);bottom:calc(var(--bb) + 20px);z-index:7;display:flex;align-items:center;gap:10px;border-radius:16px;padding:8px 10px;width:min(460px, calc(100% - 24px));box-sizing:border-box;animation:popin .4s cubic-bezier(.2,1.6,.4,1) both}#rann .t{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}#rann small{opacity:.8;font-size:12px}#rann .btn{padding:6px 10px;white-space:nowrap}@media (max-width:899px){#rann{left:50%;bottom:calc(var(--nav) + 12px)}}';document.head.appendChild(st);}
