/* ---------- Welt zeichnen ---------- */
/* T0: Spielzeit für Animationen (steht bei Pause, läuft mit dem Tempo), UT: echte Zeit für Bedienung und Effekte */
let T0=0,UT=0,night=0;
const anim={};const parts=[];
function tilePos(x,y){return[(x-y)*TW/2,(x+y)*TH/2-(N-1)*TH/2];}
function bPos(i){return tilePos(...bCtr(i));}
function posOf(i){return S.tiles[i].b?bPos(i):tilePos(i%N,(i/N)|0);}
function popAt(i,k,amt){if(parts.length>60)return;const b=S.tiles[i].b,[sx,sy]=posOf(i);parts.push({kind:'pop',x:sx,y:sy-(b?topH(b):8)-12,t0:UT,life:1500,k,txt:'+'+Math.floor(amt)});}
function dust(i){const b=S.tiles[i].b,n=b?fpOf(b.type):1,[sx,sy]=posOf(i),m=8+n*4;for(let k=0;k<m;k++){const a=k/m*TAU;parts.push({kind:'dust',x:sx+Math.cos(a)*10*n,y:sy+Math.sin(a)*5*n,vx:Math.cos(a)*22,vy:Math.sin(a)*10-6,t0:UT,life:700});}}
function sparks(i){const b=S.tiles[i].b,n=b?fpOf(b.type):1,[sx,sy]=posOf(i);for(let k=0;k<10+n*4;k++)parts.push({kind:'spark',x:sx+rand(-16,16)*n,y:sy-rand(0,24)*n,vx:rand(-12,12),vy:rand(-50,-20),t0:UT+k*30,life:900,r:rand(0,TAU)});}

/* Figuren: tragen Waren von den Betrieben zum Lager und gehen zwischen Haus, Arbeit und Dorfplatz. Mit Weganschluss laufen sie über die Wege, sonst querfeldein. */
const vill=[];const VCOL=['#9A3224','#3F5E6B','#5C7246','#C4862A','#7F6B57','#B9A07A'];
function walkable(){return BL.filter(i=>B[S.tiles[i].b.type].kind!=='def');}
function villagersFit(){
  if(!S||!BL.length)return;const want=Math.min(40,3+Math.floor(S.pop.n/2)),ws=walkable();if(!ws.length)return;
  while(vill.length<want){const at=pick(ws),[x,y]=doorPos(at);vill.push({x,y,at,path:[],k:0,wait:rand(0,2),col:pick(VCOL),hat:Math.random()<.5,carry:null,ph:rand(0,TAU),lane:rand(-.1,.1)});}
  vill.length=Math.min(vill.length,want);
}
/* Nächstes Ziel: aus Betrieben zum Lager mit Ware, vom Lager zu Werkstätten mit Zutaten, sonst irgendwohin in der Nähe */
function nextGoal(v,ws){
  const from=S.tiles[v.at]&&S.tiles[v.at].b?v.at:pick(ws),d=B[S.tiles[from].b.type],[fx,fy]=bCtr(from);
  const near=ws.filter(i=>{const[x,y]=bCtr(i);return i!==from&&Math.abs(x-fx)+Math.abs(y-fy)<22;}),pool=near.length?near:ws;
  const hs=hubs().filter(h=>h!==from&&connected(h)===connected(from));
  if((d.kind==='prod'||d.kind==='craft')&&hs.length&&Math.random()<.75){let best=hs[0],bd=1e9;for(const h of hs){const[x,y]=bCtr(h),dd=Math.abs(x-fx)+Math.abs(y-fy);if(dd<bd){bd=dd;best=h;}}
    v.cart=LOG[from]?LOG[from].mode:0;return[best,d.out||(S.tiles[from].b.recipe||d.rec[0])];}
  if(from===S.hof||S.tiles[from].b.type==='lager'){const cr=pool.filter(i=>B[S.tiles[i].b.type].kind==='craft');if(cr.length&&Math.random()<.6){const t=pick(cr),tb=S.tiles[t].b,r=RECIPES[tb.recipe||B[tb.type].rec[0]];return[t,pick(Object.keys(r.in))];}}
  return[pick(pool),null];
}
/* Laufweg als Punktliste: Tür, Wegfelder, Tür. Ohne gemeinsamen Weg geht es querfeldein. */
function routeOf(a,b){
  const pa=doorPos(a),pb=doorPos(b),ea=connected(a)?entryOf(a):-1,eb=connected(b)?entryOf(b):-1;
  if(ea>=0&&eb>=0){const rp=roadPath(ea,eb);if(rp)return[pa,...rp.map(t=>[t%N,(t/N)|0]),pb];}
  return[pa,[pb[0],pa[1]],pb];
}
function updVill(dt){
  if(dt<=0)return;let ws=null;
  for(const v of vill){
    if(v.k>=v.path.length){
      v.wait-=dt;if(v.wait>0)continue;
      ws=ws||walkable();if(!ws.length)continue;
      if(!S.tiles[v.at]||!S.tiles[v.at].b){v.at=pick(ws);[v.x,v.y]=doorPos(v.at);}
      v.cart=0;const[t,carry]=nextGoal(v,ws);if(t===undefined)continue;
      v.path=routeOf(v.at,t);v.k=0;v.to=t;v.carry=carry;v.wait=rand(1.2,3.5);continue;
    }
    let left=dt*WALK*(v.road||OFFROAD)*(1+(v.lane+.1)*.6);
    while(left>0&&v.k<v.path.length){const[tx,ty]=v.path[v.k],dx=tx-v.x,dy=ty-v.y,dd=Math.hypot(dx,dy);
      if(dd<=left){v.x=tx;v.y=ty;left-=dd;v.k++;const ti=idx(Math.round(v.x),Math.round(v.y));v.road=inb(Math.round(v.x),Math.round(v.y))&&S.tiles[ti].rd?ROADS[S.tiles[ti].rd].sp:OFFROAD;}
      else{v.x+=dx/dd*left;v.y+=dy/dd*left;v.dx=dx/dd;v.dy=dy/dd;left=0;}}
    if(v.k>=v.path.length){v.at=v.to;v.carry=null;}
    v.ph+=dt*10;
  }
}
/* Figuren sind so groß wie die Türen: eine Person etwa 9 Pixel, eine Tür 9,5 */
const FIG=.5;
function figAt(sx,sy){ctx.save();ctx.translate(sx,sy);ctx.scale(FIG,FIG);ctx.translate(-sx,-sy);}
function drawVill(v){
  const moving=v.k<v.path.length;if(!moving&&v.wait>.6)return;
  const ox=moving?-(v.dy||0)*v.lane:0,oy=moving?(v.dx||0)*v.lane:0;
  const[sx0,sy0]=tilePos(v.x+ox,v.y+oy);let sx=sx0,sy=sy0;figAt(sx,sy);
  const sw=moving?Math.sin(v.ph)*2.2:0,bob=moving?Math.abs(Math.sin(v.ph)):0;
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(sx,sy,4,1.8,0,0,TAU);ctx.fill();
  ctx.strokeStyle='#3B3532';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(sx-1.2,sy-5);ctx.lineTo(sx-1.2-sw*.6,sy);ctx.moveTo(sx+1.2,sy-5);ctx.lineTo(sx+1.2+sw*.6,sy);ctx.stroke();
  sy-=bob;
  ctx.fillStyle=v.col;ctx.beginPath();ctx.roundRect(sx-3.2,sy-12,6.4,8,2);ctx.fill();
  ctx.fillStyle='#F0C9A8';ctx.beginPath();ctx.arc(sx,sy-14.5,2.8,0,TAU);ctx.fill();
  if(v.hat){ctx.fillStyle='#5A3B24';ctx.beginPath();ctx.ellipse(sx,sy-16.5,3.6,1.5,0,0,TAU);ctx.fill();}
  if(v.carry&&moving&&!v.cart)ctx.drawImage(iconC(v.carry),sx+1,sy-15,11,11);
  ctx.restore();
  if(v.cart&&v.carry&&moving)drawCart(sx0,sy0,v);
}
/* Handkarren vor dem Träger, beim Ochsenkarren geht der Ochse voran */
function drawCart(x,y,v){
  let ux=((v.dx||0)-(v.dy||0))*TW/2,uy=((v.dx||0)+(v.dy||0))*TH/2;const l=Math.hypot(ux,uy)||1;ux/=l;uy/=l;
  const cx=x+ux*6,cy=y+uy*6;
  if(v.cart===2){const ox=x+ux*14,oy=y+uy*14,f=ux>=0?1:-1,st=Math.sin(v.ph*.6)*.8;ell(ox,oy,5,2,'rgba(0,0,0,.16)');ctx.fillStyle='#3B3532';ctx.fillRect(ox-3,oy-3+st*.3,1,3);ctx.fillRect(ox+2,oy-3-st*.3,1,3);ell(ox,oy-4.5,4.6,2.6,'#8A5A32');ell(ox+4.2*f,oy-5.5,1.9,1.6,'#7A4E2C');ctx.fillStyle='#EDE6D6';ctx.fillRect(ox+3.6*f-.4,oy-8,.8,1.6);ctx.strokeStyle='#5A3B24';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(ox-3*f,oy-4);ctx.lineTo(cx,cy-3);ctx.stroke();}
  ell(cx,cy+.5,4.5,1.6,'rgba(0,0,0,.16)');ctx.fillStyle='#8A6440';ctx.fillRect(cx-4,cy-5,8,3.4);ctx.fillStyle='#A87C52';ctx.fillRect(cx-4,cy-5.6,8,1);
  ctx.drawImage(iconC(v.carry),cx-3.5,cy-10,7,7);ell(cx-1,cy-1.2,1.8,1.8,'#4A3222');ell(cx-1,cy-1.2,.7,.7,'#C49A62');
}
/* Boote */
let tradeA=0;
function boatAt(gx,gy,ang,kind,t){
  const[sx,sy0]=tilePos(gx,gy);const sy=sy0+Math.sin(t/600+gx)*1.4;
  const fl=Math.cos(ang)>0?1:-1;
  ctx.save();ctx.translate(sx,sy);ctx.scale(fl,1);
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(-14,4,10,2,0,0,TAU);ctx.fill();
  ctx.fillStyle=kind==='lang'?'#5A3B24':'#8A5A32';
  ctx.beginPath();ctx.moveTo(-18,-2);ctx.quadraticCurveTo(0,10,18,-2);ctx.closePath();ctx.fill();
  if(kind==='lang'){ctx.beginPath();ctx.moveTo(15,-2);ctx.lineTo(21,-12);ctx.lineTo(24,-12);ctx.lineTo(18,-1);ctx.fill();
    for(let k=-12;k<=10;k+=5){ctx.fillStyle=(k+12)%10?'#C4862A':'#9A3224';ctx.beginPath();ctx.arc(k,0,2,0,TAU);ctx.fill();}}
  ctx.fillStyle='#3B3532';ctx.fillRect(-.7,-22,1.4,20);
  ctx.fillStyle='#F1E9DA';ctx.fillRect(-9,-21,18,13);
  ctx.fillStyle=kind==='lang'?'#9A3224':'#5C7246';for(let k=-9;k<9;k+=6)ctx.fillRect(k,-21,3,13);
  ctx.restore();
}
/* Wellen: zwei gekachelte Muster, fest auf der Karte, treiben langsam gegeneinander und atmen in der Helligkeit. Laufen mit der Spieluhr, stehen also in der Pause */
const WVW=192,WVH=96;let WAVEP=null;
function waveTex(seed){const c=document.createElement('canvas');c.width=WVW*2;c.height=WVH*2;const g=c.getContext('2d');g.scale(2,2);g.lineCap='round';
  const r=rng(seed);for(let k=0;k<22;k++){const x=r()*WVW,y=r()*WVH,w=5+r()*9,a=.18+r()*.22;
    for(const ox of[-WVW,0,WVW])for(const oy of[-WVH,0,WVH]){const px=x+ox,py=y+oy;g.strokeStyle='rgba(255,255,255,'+a+')';g.lineWidth=1+r()*.0;g.beginPath();g.moveTo(px-w,py);g.quadraticCurveTo(px,py-w*.35,px+w,py);g.stroke();
      if(k%3===0){g.strokeStyle='rgba(40,80,95,'+(a*.5)+')';g.beginPath();g.moveTo(px-w*.8,py+1.6);g.quadraticCurveTo(px,py+1.6-w*.25,px+w*.8,py+1.6);g.stroke();}}}
  return c;}
function drawWaves(){
  if(!WAVEP)WAVEP=[waveTex(17),waveTex(91)].map(c=>ctx.createPattern(c,'repeat'));
  const z=view.z,k=dpr*z,ox=dpr*(W/2+view.x),oy=dpr*(H/2+view.y),t=T0/1000,fade=Math.min(1,Math.max(0,(z-.3)/.4));if(fade<=0)return;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  for(let l=0;l<2;l++){const p=WAVEP[l],dx=((l?-3.2:4.5)*t)%WVW,dy=((l?1.1:-.8)*t+(l?WVH/2:0))%WVH;
    p.setTransform(new DOMMatrix([k/2,0,0,k/2,ox+dx*k,oy+dy*k]));
    ctx.globalAlpha=fade*(.55+.45*Math.sin(t*.7+l*Math.PI));ctx.fillStyle=p;ctx.fillRect(0,0,cv.width,cv.height);}
  ctx.restore();
}

/* ---------- Boden ---------- */
/* Farbe je Feld mit leiser Fleckung; an den Ecken gemittelt, so laufen Gebiete weich ineinander */
const TBASE={grass:[160,180,122],forest:[118,142,92],rock:[160,161,150],sand:[226,211,166],tundra:[204,214,206],heide:[170,154,128],moor:[128,146,110],berg:[140,143,136],water:[127,162,170]};
let TCOL=null,GM=null,GH=null,GW=null,GV=null,GTEX=null,GTT=null,GKEY=-1;const GTS=4,GTI={grass:1,forest:2,rock:3,sand:4,tundra:5,heide:6,moor:7,berg:8,water:9};
function tileColors(){
  const v=vnoise(S.seed+77,7),w=vnoise(S.seed+78,2.6);TCOL=new Float32Array(N*N*3);
  /* feines Rauschen: Fleckung des Grundes (GM Helligkeit, GH Wärme) und Verwerfung der Grenzen für die Kleinteile (GW, GV) */
  GM=vnoise(S.seed+79,1.1);GH=vnoise(S.seed+80,1.7);GW=vnoise(S.seed+81,2.3);GV=vnoise(S.seed+82,2.3);
  for(let i=0;i<N*N;i++){const T=S.tiles[i],x=i%N,y=(i/N)|0,b=TBASE[T.t],a=v(x,y),c=w(x,y);let r=b[0],g=b[1],bl=b[2];
    if(T.t==='grass'){const dry=Math.max(0,a-.56)*1.6;r+=(186-r)*dry;g+=(184-g)*dry;bl+=(116-bl)*dry;const lush=Math.max(0,.42-a)*1.4;r+=(128-r)*lush;g+=(168-g)*lush;bl+=(100-bl)*lush;}
    else if(T.t==='heide'){const p=Math.max(0,a-.5)*1.2;r+=(166-r)*p;g+=(132-g)*p;bl+=(150-bl)*p;}
    else if(T.t==='sand'){const p=Math.max(0,.5-a);r-=p*20;g-=p*16;bl-=p*10;}
    [r,g,bl]=gTint(T.t,r,g,bl);const f=1+(c-.5)*.09+(a-.5)*.05;TCOL[i*3]=r*f;TCOL[i*3+1]=g*f;TCOL[i*3+2]=bl*f;}
  /* Grundbild: GTS Texel je Feld, Eckfarben bilinear plus Fleckung; beim Zeichnen geglättet gestreckt, also ohne Rautenmuster.
     Neu gemalt wird nur, wo sich Böden geändert haben (samt Nachbarn, deren Ecken mitwandern) */
  const fresh=!GTEX||GKEY!==S.seed;if(fresh){GTT=new Uint8Array(N*N);GKEY=S.seed;}
  let x0=N,y0=N,x1=-1,y1=-1;
  for(let i=0;i<N*N;i++){const c=GTI[S.tiles[i].t];if(fresh||GTT[i]!==c){GTT[i]=c;const x=i%N,y=(i/N)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
  if(x1<0)return;x0=Math.max(0,x0-1);y0=Math.max(0,y0-1);x1=Math.min(N-1,x1+1);y1=Math.min(N-1,y1+1);
  if(fresh){GTEX=document.createElement('canvas');GTEX.width=GTEX.height=N*GTS;}
  const W0=(x1-x0+1)*GTS,H0=(y1-y0+1)*GTS,g=GTEX.getContext('2d'),im=g.createImageData(W0,H0),d=im.data,C=[C00,C10,C01,C11];
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    if(S.tiles[idx(x,y)].t==='water'){/* Wasserfelder: Farbe der Landecken, damit das Glätten an der Küste nichts Fremdes einmischt; offenes Meer bleibt leer */
      if(!N8.some(([dx,dy])=>inb(x+dx,y+dy)&&S.tiles[idx(x+dx,y+dy)].t!=='water'))continue;let n=0;const o=[0,0,0];for(let k=0;k<4;k++){cornerCol(x+(k&1),y+(k>>1),C[k]);if(C[k][0]===C[k][0]){o[0]+=C[k][0];o[1]+=C[k][1];o[2]+=C[k][2];n++;}}
      for(let k=0;k<4;k++)if(C[k][0]!==C[k][0])C[k][0]=n?o[0]/n:TBASE.sand[0],C[k][1]=n?o[1]/n:TBASE.sand[1],C[k][2]=n?o[2]/n:TBASE.sand[2];}
    else{cornerCol(x,y,C00);cornerCol(x+1,y,C10);cornerCol(x,y+1,C01);cornerCol(x+1,y+1,C11);}
    for(let b=0;b<GTS;b++)for(let a=0;a<GTS;a++){const u=(a+.5)/GTS,v=(b+.5)/GTS,k0=(1-u)*(1-v),k1=u*(1-v),k2=(1-u)*v,k3=u*v,wx=x+u-.5,wy=y+v-.5,m=1+(GM(wx,wy)-.5)*.16,h=(GH(wx,wy)-.5)*.06,p=(((y-y0)*GTS+b)*W0+(x-x0)*GTS+a)*4;
      d[p]=(C00[0]*k0+C10[0]*k1+C01[0]*k2+C11[0]*k3)*(m+h);d[p+1]=(C00[1]*k0+C10[1]*k1+C01[1]*k2+C11[1]*k3)*m;d[p+2]=(C00[2]*k0+C10[2]*k1+C01[2]*k2+C11[2]*k3)*(m-h);d[p+3]=255;}}
  g.putImageData(im,x0*GTS,y0*GTS);
}
function cornerCol(cx,cy,out){let r=0,g=0,b=0,n=0;for(let dy=-1;dy<=0;dy++)for(let dx=-1;dx<=0;dx++){const x=cx+dx,y=cy+dy;if(!inb(x,y))continue;const i=idx(x,y);if(S.tiles[i].t==='water')continue;r+=TCOL[i*3];g+=TCOL[i*3+1];b+=TCOL[i*3+2];n++;}out[0]=r/n;out[1]=g/n;out[2]=b/n;return out;}
const rgb=(r,g,b)=>'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';
const C00=[0,0,0],C10=[0,0,0],C01=[0,0,0],C11=[0,0,0];
/* Grundbild in die Rauten der Landfelder legen: ein Pfad, ein Bild, keine Nähte zwischen den Feldern */
function groundTex(list){if(!GTEX)return;ctx.save();ctx.beginPath();
  for(const[x,y]of list){if(S.tiles[idx(x,y)].t==='water')continue;const[sx,sy]=tilePos(x,y);ctx.moveTo(sx-TW/2,sy);ctx.lineTo(sx,sy-TH/2);ctx.lineTo(sx+TW/2,sy);ctx.lineTo(sx,sy+TH/2);ctx.closePath();}
  ctx.clip();ctx.transform(TW/2/GTS,TH/2/GTS,-TW/2/GTS,TH/2/GTS,0,-N*TH/2);ctx.imageSmoothingEnabled=true;ctx.drawImage(GTEX,0,0);ctx.restore();}
/* Bodenstücke von Gebäuden: Acker, Weide, Pflaster, sonst gestampfter Hof */
function yardOf(i){const a=anc(i);if(a<0)return null;const b=S.tiles[a].b;if(!b)return null;const st=B[b.type].st;
  if(st.s==='field')return st.crop==='flachs'?'#8FA86C':'#B79A55';if(st.s==='pasture')return yardSeason('#9DB678');if(st.s==='market')return '#B8AD94';if(st.s==='dock')return null;return 'rgba(150,128,92,.28)';}
/* Hofboden: innen bis an die Feldkante, außen eingerückt mit runden Ecken und weichem Saum. Grundflächen sind Quadrate, daher reicht ein Rechteck je Feld */
const YRGB={};
function yardTile(x,y,sx,sy,col){const a=anc(idx(x,y)),same=(dx,dy)=>inb(x+dx,y+dy)&&anc(idx(x+dx,y+dy))===a;
  const L=same(-1,0),R=same(1,0),U=same(0,-1),D=same(0,1),solid=col[0]==='#';
  let base=YRGB[col];if(!base){if(solid){const n=parseInt(col.slice(1),16);base=[n>>16,n>>8&255,n&255,1];}else{const m=col.match(/[\d.]+/g).map(Number);base=m;}YRGB[col]=base;}
  const rg=(k)=>'rgba('+base[0]+','+base[1]+','+base[2]+','+(base[3]*k)+')';
  for(const[e,k]of solid?[[.06,.3],[0,1]]:[[.1,.3],[.05,.4],[0,.75]]){const w=(solid?.46:.4)+e,x0=L?-.5:-w,x1=R?.5:w,y0=U?-.5:-w,y1=D?.5:w,c=w*.45,pts=[];
    if(!L&&!U)pts.push([x0,y0+c],[x0+c,y0]);else pts.push([x0,y0]);
    if(!R&&!U)pts.push([x1-c,y0],[x1,y0+c]);else pts.push([x1,y0]);
    if(!R&&!D)pts.push([x1,y1-c],[x1-c,y1]);else pts.push([x1,y1]);
    if(!L&&!D)pts.push([x0+c,y1],[x0,y1-c]);else pts.push([x0,y1]);
    pq(sx,sy,pts.map(([u,v])=>[u,v,0]),rg(k));}
  /* ausgefranster Rand: getretene Flecken über der Kante, damit keine Linie bleibt */
  const r=rng(S.seed*17+idx(x,y)*389),sides=[[!L,-1,0],[!R,1,0],[!U,0,-1],[!D,0,1]];
  for(const[out,dx,dy]of sides){if(!out)continue;for(let k=0;k<5;k++){const t=r()*1-.5,o=(solid?.44:.38)+r()*.12,u=dx?dx*o:t,v=dy?dy*o:t,[px,py]=spt(sx,sy,u,v,0);
    ell(px,py,3+r()*5,1.5+r()*2.2,rg(solid?.35+r()*.3:.35+r()*.35));}}}
/* Kleinteile: jeder Stempel fragt an einer verwackelten Stelle (Rauschen ±.15, Zufall ±.35 Feld), zu welchem Boden er gehört.
   So mischen sich an Grenzen Halme, Heidekraut und Schnee wie getupft, statt feldweise zu wechseln */
let gX=0,gY=0,gSX=0,gSY=0,gR=Math.random,gMix=false,gRg=0;
const tAt=(wx,wy,own)=>{const x=Math.floor(wx+.5),y=Math.floor(wy+.5);if(!inb(x,y))return own;const t=S.tiles[idx(x,y)].t;return t==='water'?own:t;};
function gp(n,t){const r=gR,out=[];n=Math.floor(n+r());for(let k=0;k<n;k++){const u=r()*.9-.45,v=r()*.9-.45;
  if(gMix){const wx=gX+u,wy=gY+v;if(tAt(wx+(GW(wx,wy)-.5)*.5+r()*.7-.35,wy+(GV(wx,wy)-.5)*.5+r()*.7-.35,t)!==t)continue;}
  out.push(spt(gSX,gSY,u,v,0));}return out;}
/* gleichfarbige Ellipsen in einem Pfad; s>0 streut die Größe */
function ells(P,rx,ry,col,dy,s){if(!P.length)return;const r=gR;dy=dy||0;ctx.beginPath();for(const[x,y]of P){const f=s?1-s+r()*s*2:1;ctx.moveTo(x+rx*f,y+dy);ctx.ellipse(x,y+dy,rx*f,ry*f,0,0,TAU);}ctx.fillStyle=col;ctx.fill();}
function tufts(P,col){if(!P.length)return;ctx.strokeStyle=col;ctx.lineWidth=.8;ctx.beginPath();for(const[x,y]of P){ctx.moveTo(x-1,y);ctx.lineTo(x-1.4,y-2.4);ctx.moveTo(x,y);ctx.lineTo(x+.3,y-3);ctx.moveTo(x+1,y);ctx.lineTo(x+1.6,y-2.2);}ctx.stroke();}
function strokes(P,col,lw,f){if(!P.length)return;ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();for(const[x,y]of P)f(x,y);ctx.stroke();}
function cracks(P,col){if(!P.length)return;const r=gR;ctx.strokeStyle=col;ctx.lineWidth=.8;ctx.beginPath();for(let[x,y]of P){ctx.moveTo(x,y);for(let q=0;q<3;q++){x+=r()*8-4;y+=r()*4-2;ctx.lineTo(x,y);}}ctx.stroke();}
/* Flecken mit Schattenkante (Schnee, Tümpel): erst alle Kanten, dann alle Flächen */
function patches(P,rx,ry,sx,sy,col0,col1){if(!P.length)return;const r=gR,R=P.map(()=>[rx[0]+r()*rx[1],ry[0]+r()*ry[1]]);
  ctx.beginPath();P.forEach(([x,y],k)=>{const[a,b]=R[k];ctx.moveTo(x+sx+a+1,y+sy);ctx.ellipse(x+sx,y+sy,a+1,b+.6,0,0,TAU);});ctx.fillStyle=col0;ctx.fill();
  ctx.beginPath();P.forEach(([x,y],k)=>{const[a,b]=R[k];ctx.moveTo(x+a,y);ctx.ellipse(x,y,a,b,0,0,TAU);});ctx.fillStyle=col1;ctx.fill();}
const GD={
  sand(t){const r=gR;ells(gp(.6,t),9,3.2,'rgba(255,248,222,.15)',0,.3);
    ells(gp(7,t),.8,.5,'#CDBB8A');ells(gp(7,t),.8,.5,'#F2E6C2');ells(gp(3,t),.6,.4,'rgba(150,130,95,.4)');
    strokes(gp(2,t),'rgba(180,160,110,.4)',.8,(x,y)=>{ctx.moveTo(x-7,y);ctx.quadraticCurveTo(x,y-2.5,x+7,y);});
    for(const[x,y]of gp(.3,t)){ell(x,y,1.6,1,'#F4EDE0');ell(x+.3,y+.4,1,.4,'rgba(190,160,130,.5)');}
    if(REG[gRg].id==='duene'&&r()<.6)strokes(gp(4,t),'rgba(130,150,80,.6)',.8,(x,y)=>{ctx.moveTo(x,y);ctx.lineTo(x-1.5,y-4);ctx.moveTo(x,y);ctx.lineTo(x+1.2,y-4.5);});},
  berg(t){cracks(gp(3,t),'rgba(60,62,58,.3)');ells(gp(5,t),.9,.55,'rgba(90,92,88,.32)');ells(gp(4,t),.8,.5,'rgba(232,234,230,.45)');ells(gp(1.5,t),2,1,'rgba(168,172,118,.3)',0,.3);},
  tundra(t){patches(gp(4,t),[4,6],[1.6,2],.3,.7,'rgba(150,168,178,.18)','rgba(250,252,250,.7)');
    strokes(gp(8,t),'rgba(90,110,95,.35)',.8,(x,y)=>{ctx.moveTo(x,y);ctx.lineTo(x+.4,y-2.4);});
    ells(gp(3,t),1.1,.6,'rgba(160,148,100,.3)');ells(gp(.2,t),1.8,1,'#9AA19C');},
  moor(t){patches(gp(2,t),[5,4],[2,1.5],0,.4,'rgba(84,98,64,.35)','#55706E');ells(gp(2,t),2,.6,'rgba(255,255,255,.12)',0,.4);
    ells(gp(5,t),.9,.6,'rgba(158,104,68,.38)');
    strokes(gp(10,t),'rgba(70,85,45,.6)',.8,(x,y)=>{ctx.moveTo(x,y);ctx.lineTo(x-.8,y-4.5);ctx.moveTo(x+1,y);ctx.lineTo(x+1.4,y-3.6);});
    const P=gp(3,t);if(P.length){ctx.fillStyle='#7A5636';for(const[x,y]of P)ctx.fillRect(x-.6,y-6,1.2,2.6);}},
  heide(t){ells(gp(1.6,t),6,2.4,'rgba(112,82,122,.08)',0,.3);
    for(const c of['#9C7BB0','#B58FC4','#8A6A9E','#7D8A5A'])ells(gp(5.5,t),1.3,1,c,-1);
    strokes(gp(8,t),'rgba(90,80,55,.4)',.7,(x,y)=>{ctx.moveTo(x,y);ctx.lineTo(x-.6,y-2);});},
  grass(t){const r=gR;ells(gp(.8,t),10,3.4,'rgba(96,130,64,.07)',0,.3);ells(gp(.5,t),9,3,'rgba(226,222,150,.07)',0,.3);
    tufts(gp(7,t),'rgba(70,100,45,.38)');tufts(gp(7,t),'rgba(110,140,70,.35)');
    for(const[x,y]of gp(.4,t)){const c=['#F4F0E6','#E7C25A','#B9A6D8','#E7A0A0'][Math.floor(r()*4)];for(let k=0;k<2+r()*3;k++)ell(x+r()*6-3,y+r()*3-1.5,1,1,c);}
    for(const[x,y]of gp(.12,t)){ell(x,y,1.8,1.1,'#A8A69A');ell(x-.4,y-.4,1,.5,'rgba(255,255,255,.35)');}},
  forest(t){ells(gp(1,t),9,3.2,'rgba(44,64,34,.1)',0,.3);
    tufts(gp(7,t),'rgba(40,60,30,.35)');tufts(gp(7,t),'rgba(70,90,40,.3)');
    ells(gp(3.5,t),1.4,.7,'rgba(90,70,40,.32)');ells(gp(3.5,t),1.4,.7,'rgba(70,100,50,.35)');ells(gp(2,t),.9,.5,'rgba(150,120,70,.35)');},
  rock(t){const r=gR;cracks(gp(2,t),'rgba(60,62,58,.35)');ells(gp(4,t),.9,.55,'rgba(90,92,88,.35)');
    for(const[x,y]of gp(2.6,t)){boulder(x,y,.5+r()*.55,r);if(r()<.25)boulder(x+6+r()*4,y+2,.25+r()*.2,r);}}
};
const GORD=['sand','berg','tundra','moor','heide','grass','forest','rock'],GHAS=[];
/* pass: 8 Grundbild, 1 Kante und Hof, 2 Kleinteile, 4 Nebel; ohne Angabe alles. chunk() malt jede Stufe für alle Felder, so schneidet kein Nachbar Kleinteile ab */
function groundTile(x,y,pass){
  const i=idx(x,y),T=S.tiles[i];if(T.t==='water')return;pass=pass||15;
  const[sx,sy]=tilePos(x,y),open=unlocked(i),dep=12,yd=yardOf(i);
  if(pass&8)groundTex([[x,y]]);
  if(pass&1){
  const wl=isSea(x,y+1),wr=isSea(x+1,y);
  if(wl){pq(sx,sy,[[-.5,.5,0],[.5,.5,0],[.5,.5,-dep],[-.5,.5,-dep]],open?'#9C8762':'#6F6450');pq(sx,sy,[[-.5,.5,-dep*.55],[.5,.5,-dep*.55],[.5,.5,-dep],[-.5,.5,-dep]],'rgba(40,30,20,.16)');pl(sx,sy,[-.5,.5,-dep*.3],[.5,.5,-dep*.3],'rgba(255,255,255,.1)',.8);}
  if(wr){pq(sx,sy,[[.5,.5,0],[.5,-.5,0],[.5,-.5,-dep],[.5,.5,-dep]],open?'#7A6A4A':'#5B523F');pq(sx,sy,[[.5,.5,-dep*.55],[.5,-.5,-dep*.55],[.5,-.5,-dep],[.5,.5,-dep]],'rgba(40,30,20,.16)');}
  if(yd)yardTile(x,y,sx,sy,yd);}
  if(pass&2){const r=rng(S.seed*31+i*977);
  if(yd){const pt=()=>spt(sx,sy,r()*.9-.45,r()*.9-.45,0),st=B[S.tiles[anc(i)].b.type].st;
    if(st.s==='market'){for(let k=-.33;k<.5;k+=.333){pl(sx,sy,[k,-.5,0],[k,.5,0],'rgba(90,80,64,.22)',.6);pl(sx,sy,[-.5,k,0],[.5,k,0],'rgba(90,80,64,.22)',.6);}}
    else if(st.s==='pasture'){ctx.strokeStyle='rgba(70,100,45,.4)';ctx.lineWidth=.8;ctx.beginPath();for(let k=0;k<10;k++){const[x2,y2]=pt();ctx.moveTo(x2,y2);ctx.lineTo(x2+.3,y2-2.6);}ctx.stroke();}
    else if(st.s!=='field'){for(let k=0;k<4;k++){const[x2,y2]=pt();ell(x2,y2,1.2,.6,'rgba(110,95,70,.35)');}}}
  else{/* welche Böden reichen mit ihren Stempeln in dieses Feld hinein */
    GHAS.length=0;GHAS.push(T.t);for(const[dx,dy]of N8){if(!inb(x+dx,y+dy))continue;const t=S.tiles[idx(x+dx,y+dy)].t;if(t!=='water'&&!GHAS.includes(t))GHAS.push(t);}
    gX=x;gY=y;gSX=sx;gSY=sy;gR=r;gRg=T.r;gMix=GHAS.length>1;
    for(const t of GORD)if(GHAS.includes(t))GD[t](t);gSeasonDetail(T.t);}}
  if((pass&4)&&!open){const ex=S.explore&&S.explore.r===T.r;pq(sx,sy,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],ex?'rgba(220,226,226,.22)':'rgba(40,52,58,.28)');pq(sx,sy,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],'rgba(220,226,226,.16)');}
}
/* Binnenseen: Wasser ohne Verbindung zum Meer. Sie liegen auf Bodenhöhe, ohne Klippenkanten */
let LAKE=null,LAKEW=null;
function lakes(){if(LAKEW===S.tiles)return LAKE;LAKEW=S.tiles;const sea=new Uint8Array(N*N),st=[];
  for(let i=0;i<N*N;i++){const x=i%N,y=(i/N)|0;if((x===0||y===0||x===N-1||y===N-1)&&S.tiles[i].t==='water'){sea[i]=1;st.push(i);}}
  while(st.length){const i=st.pop(),x=i%N,y=(i/N)|0;for(const[dx,dy]of N4){const xx=x+dx,yy=y+dy;if(!inb(xx,yy))continue;const j=idx(xx,yy);if(!sea[j]&&S.tiles[j].t==='water'){sea[j]=1;st.push(j);}}}
  LAKE=new Uint8Array(N*N);for(let i=0;i<N*N;i++)if(S.tiles[i].t==='water'&&!sea[i])LAKE[i]=1;return LAKE;}
const isSea=(x,y)=>!inb(x,y)||(S.tiles[idx(x,y)].t==='water'&&!lakes()[idx(x,y)]);
/* Binnensee: Uferband auf dem Land, dann das Feld ausstanzen. Darunter scheint das Meer mit seinen treibenden Wellen durch */
function lakeTile(x,y,ps){const[sx,sy]=tilePos(x,y);
  if(ps===0){pq(sx,sy,[[-.62,-.62,0],[.62,-.62,0],[.62,.62,0],[-.62,.62,0]],'rgba(96,104,80,.35)');pq(sx,sy,[[-.56,-.56,0],[.56,-.56,0],[.56,.56,0],[-.56,.56,0]],'rgba(214,220,200,.45)');}
  else{const g=ctx.globalCompositeOperation;ctx.globalCompositeOperation='destination-out';pq(sx,sy,[[-.51,-.51,0],[.51,-.51,0],[.51,.51,0],[-.51,.51,0]],'#000');ctx.globalCompositeOperation=g;}}
function shoreTile(x,y){
  const i=idx(x,y),T=S.tiles[i];if(T.t==='water')return;
  if(!N8.some(([dx,dy])=>isSea(x+dx,y+dy)))return;
  const[sx,sy]=tilePos(x,y);
  pq(sx,sy+12,[[-.82,-.82,0],[.82,-.82,0],[.82,.82,0],[-.82,.82,0]],'rgba(170,205,200,.28)');
  pq(sx,sy+12,[[-.64,-.64,0],[.64,-.64,0],[.64,.64,0],[-.64,.64,0]],'rgba(240,248,244,.22)');
}
/* Findling mit zufälliger Form: rund, flach oder spitz, warme oder kühle Tönung, manchmal Moos */
const BTONE=[['#9A9C96','#6F716B'],['#A49F93','#78736A'],['#8E958F','#656B66'],['#A9A8A0','#7E7D76']];
function boulder(x,y,s,r){
  const k=r(),w=9*s*(k<.25?1.45:k>.85?.8:1),h=8*s*(k<.25?.55:k>.85?1.7:1),[c1,c2]=BTONE[Math.floor(r()*BTONE.length)];
  const px=x+(r()-.5)*w*.6,py=y-h*(.9+r()*.25),bx=x+(r()-.5)*w*.2,by=y+w*.3,lx=x-w*(.55+r()*.25),ly=y-h*(.45+r()*.35),rx=x+w*(.55+r()*.25),ry=y-h*(.35+r()*.35);
  ell(x+3,y+1.5,w*.95,w*.36,SHADOW);
  ctx.fillStyle=c1;ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(lx,ly);ctx.lineTo(px,py);ctx.lineTo(bx,by);ctx.closePath();ctx.fill();
  ctx.fillStyle=c2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(rx,ry);ctx.lineTo(x+w,y-h*.05);ctx.lineTo(x+w*.6,y+w*.25);ctx.lineTo(bx,by);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(px,py);ctx.lineTo((lx+px+bx)/3,(ly+py+by)/3);ctx.closePath();ctx.fill();
  if(r()<.3){ctx.fillStyle='rgba(110,135,70,.55)';ctx.beginPath();ctx.ellipse((lx+px)/2,(ly+py)/2+1,w*.3,h*.12,-.4,0,TAU);ctx.fill();}
  if(r()<.4){ctx.strokeStyle='rgba(40,42,38,.3)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(px,py+h*.15);ctx.lineTo(px+(r()-.5)*w*.4,py+h*.6);ctx.stroke();}
}
/* Bodenkacheln zu 256 Weltpixeln in Bildschirmauflösung; fehlende werden nach und nach gebaut, darunter liegt die Übersicht */
const GCH=new Map();const CW=256;
let gZ=0,gZT=0;
function tilesInRect(X0,Y0,X1,Y1){
  const off=(N-1)*TH/2,out=[],s0=Math.max(0,Math.floor((Y0-30+off)/(TH/2))),s1=Math.min(2*N-2,Math.ceil((Y1+20+off)/(TH/2))),d0=Math.floor((X0-40)/(TW/2)),d1=Math.ceil((X1+40)/(TW/2));
  for(let s=s0;s<=s1;s++){let da=Math.max(d0,-s,s-2*(N-1));const db=Math.min(d1,s,2*(N-1)-s);if((da+s)&1)da++;for(let d=da;d<=db;d+=2)out.push([(s+d)>>1,(s-d)>>1]);}
  return out;
}
function chunk(cx,cy,sc){
  const X0=cx*CW,Y0=cy*CW,all=tilesInRect(X0,Y0,X0+CW,Y0+CW),L=lakes(),list=all.filter(([x,y])=>S.tiles[idx(x,y)].t!=='water'),lk=all.filter(([x,y])=>L[idx(x,y)]);
  if(!list.length&&!lk.length)return null;
  const c=document.createElement('canvas');c.width=Math.ceil(CW*sc)+2;c.height=Math.ceil(CW*sc)+2;
  const keep=ctx;ctx=c.getContext('2d');ctx.setTransform(sc,0,0,sc,1-X0*sc,1-Y0*sc);ctx.lineCap='round';ctx.lineJoin='round';
  try{for(const[x,y]of list)shoreTile(x,y);groundTex(list);for(const[x,y]of lk)lakeTile(x,y,0);for(const p of[1,2,4])for(const[x,y]of list)groundTile(x,y,p);for(const[x,y]of lk)lakeTile(x,y,1);
    const rl=list.filter(([x,y])=>S.tiles[idx(x,y)].rd);for(let ps=0;ps<4;ps++)for(const[x,y]of rl)roadTile(x,y,ps);}finally{ctx=keep;}
  return c;
}
/* Übersicht der ganzen Insel in kleinem Maßstab: für weite Zoomstufen, als Unterlage und für die Minikarte */
let OV=null,OVdirty=true,OVT=-1e9;const OVS=.25;
const ovW=()=>Math.ceil(N*TW*OVS)+4,ovH=()=>Math.ceil((N*TH+40)*OVS)+4,ovOY=()=>2+((N-1)*TH/2+TH/2)*OVS;
function buildOverview(){
  if(!TCOL)tileColors();
  const w=ovW(),h=ovH(),c=OV||document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  g.setTransform(OVS,0,0,OVS,w/2,ovOY());
  for(let s=0;s<=2*N-2;s++)for(let x=Math.max(0,s-N+1);x<=Math.min(N-1,s);x++){const y=s-x,i=idx(x,y),T=S.tiles[i];if(T.t==='water'){if(lakes()[i]){const[sx,sy]=tilePos(x,y);g.fillStyle='#6F99A3';g.beginPath();g.moveTo(sx-TW/2-1,sy);g.lineTo(sx,sy-TH/2-1);g.lineTo(sx+TW/2+1,sy);g.lineTo(sx,sy+TH/2+1);g.fill();}continue;}const[sx,sy]=tilePos(x,y);
    const yd=yardOf(i),open=unlocked(i);let col=rgb(TCOL[i*3],TCOL[i*3+1],TCOL[i*3+2]);
    if(T.t==='forest')col=rgb(TCOL[i*3]*.72,TCOL[i*3+1]*.8,TCOL[i*3+2]*.72);if(T.t==='berg')col='#B9BCB6';if(yd&&yd[0]==='#')col=yd;
    if(isSea(x,y+1)){g.fillStyle=open?'#9C8762':'#6F6450';g.beginPath();g.moveTo(sx-TW/2,sy);g.lineTo(sx,sy+TH/2);g.lineTo(sx,sy+TH/2+12);g.lineTo(sx-TW/2,sy+12);g.fill();}
    if(isSea(x+1,y)){g.fillStyle=open?'#7A6A4A':'#5B523F';g.beginPath();g.moveTo(sx+TW/2,sy);g.lineTo(sx,sy+TH/2);g.lineTo(sx,sy+TH/2+12);g.lineTo(sx+TW/2,sy+12);g.fill();}
    g.fillStyle=col;g.beginPath();g.moveTo(sx-TW/2-1,sy);g.lineTo(sx,sy-TH/2-1);g.lineTo(sx+TW/2+1,sy);g.lineTo(sx,sy+TH/2+1);g.fill();
    if(yd&&yd[0]!=='#'){g.fillStyle='#8E7B5A';g.fill();}
    if(T.rd){g.fillStyle=ROADS[T.rd].c;g.fill();}
    if(!open){g.fillStyle='rgba(40,52,58,.3)';g.fill();}}
  OV=c;OVdirty=false;
}
function drawOverview(){if(OV)ctx.drawImage(OV,-ovW()/2/OVS,-ovOY()/OVS,ovW()/OVS,ovH()/OVS);}
function groundDirty(cells){
  OVdirty=true;MINI.dirty=true;
  if(!cells){GCH.clear();TCOL=null;return;}
  TCOL=null;
  for(const i of cells){const[sx,sy]=tilePos(i%N,(i/N)|0);
    for(let cy=Math.floor((sy-40)/CW);cy<=Math.floor((sy+40)/CW);cy++)for(let cx=Math.floor((sx-60)/CW);cx<=Math.floor((sx+60)/CW);cx++){const e=GCH.get(cx+','+cy);if(e)e.stale=1;}}
}
function drawGround(){
  if(!TCOL)tileColors();
  if(OVdirty&&(UT-OVT>500||!OV)){buildOverview();OVT=UT;}
  const want=Math.min(4,dpr*view.z);
  if(want<.55){drawOverview();return;}
  if(want!==gZ){gZ=want;gZT=UT;}
  const settled=UT-gZT>160,t0=performance.now();
  const x0=(-W/2-view.x)/view.z,x1=(W/2-view.x)/view.z,y0=(-H/2-view.y)/view.z,y1=(H/2-view.y)/view.z;
  const exact=want===dpr*view.z,ox=dpr*(W/2+view.x),oy=dpr*(H/2+view.y),vis=[];let under=false,built=0;
  for(let cy=Math.floor(y0/CW);cy<=Math.floor(y1/CW);cy++)for(let cx=Math.floor(x0/CW);cx<=Math.floor(x1/CW);cx++){
    const k=cx+','+cy;let e=GCH.get(k);
    const need=!e||e.stale||(e.sc!==want&&settled);
    if(need&&(built===0||performance.now()-t0<7)&&(settled||!e||e.stale)){const c=chunk(cx,cy,want);e={c,sc:want};GCH.delete(k);GCH.set(k,e);built++;}
    else if(!e)under=true;
    if(e)vis.push([cx,cy,e]);
  }
  const lim=Math.max(80,vis.length*2);while(GCH.size>lim)GCH.delete(GCH.keys().next().value);
  if(under)drawOverview();
  for(const[cx,cy,e]of vis){const c=e.c;if(!c)continue;
    if(exact&&e.sc===want){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(c,Math.round(ox+cx*CW*want)-1,Math.round(oy+cy*CW*want)-1);ctx.restore();}
    else{const pad=1/e.sc;ctx.drawImage(c,cx*CW-pad,cy*CW-pad,c.width/e.sc,c.height/e.sc);}}
}

/* ---------- Markierungen auf dem Boden ---------- */
function fpPath(x0,y0,n,ins){ins=ins||0;const a=tilePos(x0-.5+ins,y0-.5+ins),b=tilePos(x0+n-.5-ins,y0-.5+ins),c=tilePos(x0+n-.5-ins,y0+n-.5-ins),d=tilePos(x0-.5+ins,y0+n-.5-ins);
  ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.lineTo(d[0],d[1]);ctx.closePath();}
function tileFill(i,col){const[sx,sy]=tilePos(i%N,(i/N)|0);ctx.beginPath();ctx.moveTo(sx-TW/2+2,sy);ctx.lineTo(sx,sy-TH/2+1);ctx.lineTo(sx+TW/2-2,sy);ctx.lineTo(sx,sy+TH/2-1);ctx.closePath();ctx.fillStyle=col;ctx.fill();}
function areaRing(cx,cy,R,col){const[sx,sy]=tilePos(cx,cy);ctx.save();ctx.beginPath();ctx.ellipse(sx,sy,R*TW/2*Math.SQRT2,R*TH/2*Math.SQRT2,0,0,TAU);ctx.setLineDash([8,6]);ctx.lineDashOffset=-UT/70;ctx.strokeStyle=col;ctx.lineWidth=1.8;ctx.stroke();ctx.restore();}
/* Arbeitsbereich zeigen: gezählte Felder grün, mit anderen geteilte gold */
function drawArea(type,i0,own){
  const d=B[type];if(!d.ar)return;const n=fpOf(type),cx=i0%N+(n-1)/2,cy=((i0/N)|0)+(n-1)/2;
  for(const t of areaCells(i0,type)){const k=COVER[type+':'+t]||0;tileFill(t,(own?k>1:k>0)?'rgba(226,176,74,.42)':'rgba(207,227,184,.42)');}
  areaRing(cx,cy,d.ar+(n-1)/2+.25,'#E8F2DC');
}
function drawMarks(){
  if(roadMode()){
    const ok=new Set(place.plan?place.plan.ok:[]);for(const i of place.cells)tileFill(i,ok.has(i)?(place.road?'rgba(141,179,107,.55)':'rgba(208,88,63,.5)'):'rgba(208,88,63,.3)');
    if(!place.cells.length&&hov>=0)tileFill(hov,'rgba(255,248,230,.25)');
    for(const i of BL)if(!connected(i)){const n=fpOf(S.tiles[i].b.type);fpPath(i%N,(i/N)|0,n,.04);ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle='#F2B3A4';ctx.lineWidth=1.6;ctx.stroke();ctx.restore();}
    return;}
  const pl0=place&&place.i0>=0;
  if(battle){if(!battle.done)for(const i of BL)if(RANGE[S.tiles[i].b.type])drawRange(i,.35);}
  else if(sel>=0&&S.tiles[sel].b&&!pl0){const b=S.tiles[sel].b,n=fpOf(b.type);
    if(RANGE[b.type])drawRange(sel,1);
    if(B[b.type].ar)drawArea(b.type,sel,true);
    fpPath(sel%N,(sel/N)|0,n,.04);ctx.fillStyle='rgba(255,246,214,.22)';ctx.fill();ctx.save();ctx.setLineDash([6,4]);ctx.lineDashOffset=-UT/60;ctx.strokeStyle='#FFF8E6';ctx.lineWidth=1.8;ctx.stroke();ctx.restore();}
  else if(sel>=0&&!pl0){fpPath(sel%N,(sel/N)|0,1,.06);ctx.fillStyle='rgba(255,246,214,.35)';ctx.fill();ctx.save();ctx.setLineDash([5,4]);ctx.lineDashOffset=-UT/60;ctx.strokeStyle='#FFF8E6';ctx.lineWidth=1.8;ctx.stroke();ctx.restore();}
  if(pl0){const n=fpOf(place.type);drawArea(place.type,place.i0,false);
    {const dt=doorTileAt(place.i0,n,place.rot);if(dt>=0)tileFill(dt,place.noRoad?'rgba(226,176,74,.45)':'rgba(255,248,230,.45)');}fpPath(place.i0%N,(place.i0/N)|0,n,.03);ctx.fillStyle=place.err?'rgba(208,88,63,.38)':'rgba(141,179,107,.42)';ctx.fill();ctx.strokeStyle=place.err?'#F2B3A4':'#F1ECE2';ctx.lineWidth=2;ctx.stroke();}
  else if(hov>=0&&!battle){const a=anc(hov);if(a>=0){fpPath(a%N,(a/N)|0,fpOf(S.tiles[a].b.type),.04);}else fpPath(hov%N,(hov/N)|0,1,.06);ctx.strokeStyle='rgba(255,248,230,.7)';ctx.lineWidth=1.4;ctx.stroke();}
}

/* ---------- Zeichnen pro Bild ---------- */
/* Große Gebäude werden zu Beginn der Diagonale ihres vordersten Feldes gezeichnet. Was seitlich davor steht, aber auf einer früheren Diagonale liegt, wartet, bis das Gebäude gezeichnet ist. */
let DEFER=new Map();
function deferMap(){DEFER=new Map();for(const i of BL){const n=fpOf(S.tiles[i].b.type);if(n<3)continue;const x0=i%N,y0=(i/N)|0,key=x0+y0+2*(n-1);
  for(let j=0;j<n;j++)for(let k=0;x0+n+k+y0+j<key;k++){if(inb(x0+n+k,y0+j))DEFER.set(idx(x0+n+k,y0+j),i);}
  for(let j=0;j<n;j++)for(let k=0;y0+n+k+x0+j<key;k++){if(inb(x0+j,y0+n+k))DEFER.set(idx(x0+j,y0+n+k),i);}}}
function drawBuilding(i){
  const b=S.tiles[i].b,n=fpOf(b.type),[sx,sy]=bPos(i),bz=busy(b);
  const px=W/2+view.x+sx*view.z,py=H/2+view.y+sy*view.z,m=(60+n*40)*view.z;if(px<-m||px>W+m||py<-40*view.z||py>H+(150+n*30)*view.z)return;
  if(bz&&b.job==='build'){
    pq(sx,sy,[[-.4*n,-.4*n,1],[.4*n,-.4*n,1],[.4*n,.4*n,1],[-.4*n,.4*n,1]],'#B9A27E');pq(sx,sy,[[-.4*n,.4*n,1],[.4*n,.4*n,1],[.4*n,.4*n,0],[-.4*n,.4*n,0]],'#8E7A5C');pq(sx,sy,[[.4*n,.4*n,1],[.4*n,-.4*n,1],[.4*n,-.4*n,0],[.4*n,.4*n,0]],'#76664C');
    const tot=bTime(b.type,0)*1000,fr=Math.max(0,Math.min(1,1-(b.until-now())/tot));
    ctx.globalAlpha=.3+fr*.45;blitB(sx,sy,'b'+b.type+b.lvl+'0',()=>bodyB(0,0,b,0),n);ctx.globalAlpha=1;
    drawScaffold(sx,sy,b);drawBuilder(sx,sy,i,n);drawTimer(sx,sy-topH(b)-8,b,b.until,tot/1000);return;}
  const a=anim[i];
  if(a!==undefined){const k=Math.min(1,Math.max(0,(UT-a)/500));if(k>=1)delete anim[i];const s=Math.max(.01,easeBack(k));ctx.save();ctx.translate(sx,sy);ctx.scale(s,s);ctx.translate(-sx,-sy);drawB(sx,sy,b);ctx.restore();}
  else drawB(sx,sy,b);
  if(!battle)drawIdle(i,sx,sy-topH(b)-10);
  if(bz){drawScaffold(sx,sy,b);drawBuilder(sx,sy,i,n);drawTimer(sx,sy-topH(b)-8,b,b.until,bTime(b.type,b.lvl));}
}
function drawTileObj(i,far){const T=S.tiles[i],[sx,sy]=tilePos(i%N,(i/N)|0),open=unlocked(i);
  if(T.t==='water'){if(T.rd)drawBridge(i,sx,sy);return;}
  if(T.t==='forest')drawTrees(i,sx,sy,open,far);else if(T.t==='berg')drawPeak(i,sx,sy,open);
  if(RCENT&&RCENT[T.r]===i&&!open)drawSign(i,T.r);}
let lastFrame=0;
function draw(ts){
  const dt=Math.min(.05,(ts-lastFrame)/1000||0),gdt=dt*CLK.k;lastFrame=ts;UT=ts;T0+=gdt*1000;
  keyPan(dt);sprFrame();updVill(Math.min(.4,gdt));tradeA+=gdt*.012;
  if(glide){const k=1-Math.exp(-dt*9);view.x+=(glide.x-view.x)*k;view.y+=(glide.y-view.y)*k;if(Math.abs(glide.x-view.x)+Math.abs(glide.y-view.y)<.5)glide=null;}
  clampView();
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle=seaGrad;ctx.fillRect(0,0,W,H);
  drawWaves();
  const z=view.z,far=dpr*z<.55;ctx.setTransform(dpr*z,0,0,dpr*z,dpr*(W/2+view.x),dpr*(H/2+view.y));WTK=dpr*z;WTX=dpr*(W/2+view.x);WTY=dpr*(H/2+view.y);
  drawGround();
  drawMarks();
  const off=(N-1)*TH/2,wx0=(-W/2-view.x)/z,wx1=(W/2-view.x)/z,wy0=(-H/2-view.y)/z,wy1=(H/2-view.y)/z;
  const s0=Math.max(0,Math.floor((wy0+off)/(TH/2))-2),s1=Math.min(2*N-2,Math.ceil((wy1+off+170)/(TH/2))),d0=Math.floor((wx0-100)/(TW/2)),d1=Math.ceil((wx1+100)/(TW/2));
  const bs=new Map(),late=[];
  for(const i of BL){const n=fpOf(S.tiles[i].b.type),x0=i%N,y0=(i/N)|0,k=x0+y0+2*(n-1),d=x0-y0;if(d<d0-2*n||d>d1+2*n||k<s0)continue;if(k>s1){if(k-2*(n-1)<=s1)late.push(i);continue;}let L=bs.get(k);if(!L)bs.set(k,L=[]);L.push(i);}
  const ents=[];
  const ent=(x,y,d,f)=>{const rx=Math.round(x),ry=Math.round(y);ents.push({d,f,t:inb(rx,ry)?idx(rx,ry):-1});};
  for(const v of vill)ent(v.x,v.y,v.x+v.y+.05,()=>drawVill(v));
  {const gx=IC0+50*Math.cos(tradeA),gy=IC0+50*Math.sin(tradeA);ent(gx,gy,gx+gy,()=>boatAt(gx,gy,tradeA+Math.PI/2,'knarr',ts));}
  if(battle){for(const r of battle.rs)ent(r.x,r.y,r.x+r.y+.1,()=>drawRaider(r));for(const l of battle.L)ent(l.bx,l.by,l.bx+l.by,()=>boatAt(l.bx,l.by,l.a+Math.PI,'lang',ts));}
  else if(S.raid.pending){const k=Math.min(1,(now()-S.raid.since)/15000);for(const l of landingPoints()){const gx=l.bx+l.dx*(1-k)*6,gy=l.by+l.dy*(1-k)*6;ent(gx,gy,gx+gy,()=>boatAt(gx,gy,l.a+Math.PI,'lang',ts));}}
  ents.sort((a,b)=>a.d-b.d);
  const drawn=new Set(),pend=new Map();
  const wait=(o,it)=>{let p=pend.get(o);if(!p)pend.set(o,p=[]);p.push(it);};
  const run=it=>{if(it.f)it.f();else drawTileObj(it.i,far);};
  const doIt=(t,it)=>{const o=t>=0?DEFER.get(t):undefined;if(o!==undefined&&!drawn.has(o))wait(o,it);else run(it);};
  const doB=i=>{drawBuilding(i);drawn.add(i);const p=pend.get(i);if(p){pend.delete(i);p.forEach(run);}};
  let e=0;
  while(e<ents.length&&ents[e].d<s0)doIt(ents[e].t,ents[e++]);
  for(let s=s0;s<=s1;s++){
    const L=bs.get(s);if(L)for(const i of L)doB(i);
    let da=Math.max(d0,-s,s-2*(N-1));const db=Math.min(d1,s,2*(N-1)-s);if((da+s)&1)da++;
    for(let d=da;d<=db;d+=2){const i=((s-d)>>1)*N+((s+d)>>1),T=S.tiles[i];if(T.t==='water'&&T.rd){doIt(i,{i});continue;}if(T.o!==undefined||T.t==='water')continue;
      if(T.t==='forest'||T.t==='berg'||(RCENT&&RCENT[T.r]===i&&!unlocked(i)))doIt(i,{i});}
    while(e<ents.length&&ents[e].d<s+1)doIt(ents[e].t,ents[e++]);
  }
  for(const i of late)doB(i);
  while(e<ents.length)run(ents[e++]);
  for(const p of pend.values())p.forEach(run);
  if(place&&!roadMode()&&place.i0>=0){const n=fpOf(place.type),x0=place.i0%N,y0=(place.i0/N)|0,[gx,gy]=tilePos(x0+(n-1)/2,y0+(n-1)/2);ctx.globalAlpha=place.err?.45:.72;const gb={type:place.type,lvl:1,run:0,rot:place.rot};blitB(gx,gy,'b'+place.type+'10r'+gb.rot,()=>bodyB(0,0,gb,0),n);ctx.globalAlpha=1;}
  if(battle)drawBattleTop();
  if(sel>=0&&!place)drawMarker(sel);
  drawParts();drawJuice();
  WTK=0;ctx.setTransform(dpr,0,0,dpr,0,0);
  drawWeather(gdt);
  if(night>0){ctx.fillStyle='rgba(18,28,58,'+(night*.36)+')';ctx.fillRect(0,0,W,H);}
}
/* Zeichen über Gebäuden ohne Weganschluss */
function drawNoRoad(x,y){const k=1+Math.sin(UT/300)*.06;ctx.save();ctx.translate(x,y);ctx.scale(k,k);ell(0,0,8,8,'#D0583F');ctx.strokeStyle='#172125';ctx.lineWidth=1.4;ctx.stroke();ctx.drawImage(iconC('pfad'),-6,-6,12,12);L(ctx,[-5,5,5,-5],'#FFF8E6',1.6);ctx.restore();}
function drawMarker(i){
  const T=S.tiles[i],[sx,sy]=posOf(i);
  const h=T.b?topH(T.b)+6:(T.t==='forest'?26:6);
  const y=sy-h-12-Math.abs(Math.sin(UT/260))*5;
  ctx.beginPath();ctx.moveTo(sx-7,y-9);ctx.lineTo(sx+7,y-9);ctx.lineTo(sx,y);ctx.closePath();
  ctx.fillStyle='#E2B04A';ctx.fill();ctx.strokeStyle='#172125';ctx.lineWidth=1.8;ctx.stroke();
}
function drawParts(){
  for(let k=parts.length-1;k>=0;k--){
    const p=parts[k],t=(UT-p.t0)/p.life;if(t<0)continue;if(t>=1){parts.splice(k,1);continue;}
    if(p.kind==='pop'){
      const e=easeBack(Math.min(1,t/.22)),y=p.y-e*22-t*12,a=t<.1?t/.1:t>.65?1-(t-.65)/.35:1,s=.55+.45*e;
      ctx.globalAlpha=a;ctx.drawImage(iconC(p.k),p.x-14*s,y-9*s,18*s,18*s);
      ctx.font='700 10px Work Sans, sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(34,52,58,.85)';ctx.strokeText(p.txt,p.x+5,y);ctx.fillStyle='#FFF8E6';ctx.fillText(p.txt,p.x+5,y);
      ctx.globalAlpha=1;
    } else if(p.kind==='dust'){
      const tt=t*p.life/1000;ctx.globalAlpha=(1-t)*.7;ctx.fillStyle='#E8DEC6';ctx.beginPath();ctx.arc(p.x+p.vx*tt,p.y+p.vy*tt,3+t*6,0,TAU);ctx.fill();ctx.globalAlpha=1;
    } else {
      const tt=t*p.life/1000,x=p.x+p.vx*tt,y=p.y+p.vy*tt+30*tt*tt,r=3*(1-t)+1;
      ctx.globalAlpha=1-t;ctx.fillStyle='#F4C04E';ctx.save();ctx.translate(x,y);ctx.rotate(p.r+t*4);ctx.beginPath();for(let q=0;q<4;q++){ctx.lineTo(0,-r*2);ctx.rotate(TAU/8);ctx.lineTo(0,-r*.7);ctx.rotate(TAU/8);}ctx.fill();ctx.restore();ctx.globalAlpha=1;
    }
  }
}
function screenToTile(px,py){
  const wx=(px-W/2-view.x)/view.z,wy=(py-H/2-view.y)/view.z+(N-1)*TH/2;
  const fx=(wx/(TW/2)+wy/(TH/2))/2,fy=(wy/(TH/2)-wx/(TW/2))/2;
  const x=Math.floor(fx+.5),y=Math.floor(fy+.5);
  return inb(x,y)?idx(x,y):-1;
}
let fpsN=0,fpsT=0;
function loop(ts){
  if(tab==='insel')draw(ts);else lastFrame=ts;
  if(battle){battleStep(Math.min(.05,(ts-(loop.lt||ts))/1000)*CLK.k);updBattleHud();}loop.lt=ts;
  if(MINI.on)drawMini(ts);
  if(S.opt.fps){fpsN++;if(ts-fpsT>500){$('#fps').textContent=Math.round(fpsN*1000/(ts-fpsT))+' fps';fpsN=0;fpsT=ts;}}
  requestAnimationFrame(loop);
}
function updNight(){const dn=S&&S.opt&&S.opt.dn;if(dn==='tag'){night=0;return;}if(dn==='nacht'){night=1;return;}const d=new Date(),h=d.getHours()+d.getMinutes()/60;night=h>=22||h<5?1:h>=19?(h-19)/3:h<7?(7-h)/2:0;}

/* Gebäude-Vorschaubilder aus denselben Zeichenfunktionen */
const THUMB={};
function thumb(type,lvl){
  const key=type+(lvl||1);if(THUMB[key])return THUMB[key];
  const n=fpOf(type),sc=1.7*[1,.66,.47][n-1];
  const c=mkc(180,170,g=>{
    const keep=ctx,kn=night,kt=T0;ctx=g;night=0;T0=0;g.lineJoin='round';g.lineCap='round';
    try{
      g.setTransform(sc,0,0,sc,90,112+6*n);
      const st=B[type].st,terr=B[type].need==='rock'?'#A7A89E':B[type].need==='coast'?'#E2D3A6':st.s==='field'?(st.crop==='flachs'?'#8FA86C':'#B79A55'):st.s==='pasture'?'#9FB879':st.s==='market'?'#BDB29A':'#A3B57E';
      FK=n;pq(0,0,[[-.5,.5,0],[.5,.5,0],[.5,.5,-10/n],[-.5,.5,-10/n]],'#9C8762');pq(0,0,[[.5,.5,0],[.5,-.5,0],[.5,-.5,-10/n],[.5,.5,-10/n]],'#7A6A4A');
      pq(0,0,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],terr);FK=1;
      const b={type,lvl:lvl||1,run:0};bodyB(0,0,b,0);liveB(0,0,{...b,lvl:1});
    }finally{FK=1;ctx=keep;night=kn;T0=kt;}
  });
  THUMB[key]=c.toDataURL();return THUMB[key];
}
