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
    return[best,d.out||(S.tiles[from].b.recipe||d.rec[0])];}
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
      const[t,carry]=nextGoal(v,ws);if(t===undefined)continue;
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
  if(v.carry&&moving)ctx.drawImage(iconC(v.carry),sx+1,sy-15,11,11);
  ctx.restore();
}
/* Boote, Möwen */
const gulls=[0,1,2,3].map(()=>({x:rand(0,400),y:rand(20,200),s:rand(18,30),ph:rand(0,TAU),sc:rand(.7,1.1)}));
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
function drawGulls(dt){
  ctx.strokeStyle='rgba(250,250,247,.9)';ctx.lineWidth=1.6;ctx.lineCap='round';
  for(const g of gulls){
    g.x+=g.s*dt;g.ph+=dt*7;if(g.x>W+30){g.x=-30;g.y=rand(20,H*.5);}
    const y=g.y+Math.sin(g.ph*.2)*6,f=Math.sin(g.ph)*3.5*g.sc,w=7*g.sc;
    ctx.beginPath();ctx.moveTo(g.x-w,y-f);ctx.quadraticCurveTo(g.x-w*.4,y-3,g.x,y);ctx.quadraticCurveTo(g.x+w*.4,y-3,g.x+w,y-f);ctx.stroke();
  }
}

/* ---------- Boden ---------- */
/* Farbe je Feld mit leiser Fleckung; an den Ecken gemittelt, so laufen Gebiete weich ineinander */
const TBASE={grass:[160,180,122],forest:[118,142,92],rock:[160,161,150],sand:[226,211,166],tundra:[204,214,206],heide:[170,154,128],moor:[128,146,110],berg:[140,143,136],water:[127,162,170]};
let TCOL=null;
function tileColors(){
  const v=vnoise(S.seed+77,7),w=vnoise(S.seed+78,2.6);TCOL=new Float32Array(N*N*3);
  for(let i=0;i<N*N;i++){const T=S.tiles[i],x=i%N,y=(i/N)|0,b=TBASE[T.t],a=v(x,y),c=w(x,y);let r=b[0],g=b[1],bl=b[2];
    if(T.t==='grass'){const dry=Math.max(0,a-.56)*1.6;r+=(186-r)*dry;g+=(184-g)*dry;bl+=(116-bl)*dry;const lush=Math.max(0,.42-a)*1.4;r+=(128-r)*lush;g+=(168-g)*lush;bl+=(100-bl)*lush;}
    else if(T.t==='heide'){const p=Math.max(0,a-.5)*1.2;r+=(166-r)*p;g+=(132-g)*p;bl+=(150-bl)*p;}
    else if(T.t==='sand'){const p=Math.max(0,.5-a);r-=p*20;g-=p*16;bl-=p*10;}
    const f=1+(c-.5)*.09+(a-.5)*.05;TCOL[i*3]=r*f;TCOL[i*3+1]=g*f;TCOL[i*3+2]=bl*f;}
}
function cornerCol(cx,cy,out){let r=0,g=0,b=0,n=0;for(let dy=-1;dy<=0;dy++)for(let dx=-1;dx<=0;dx++){const x=cx+dx,y=cy+dy;if(!inb(x,y))continue;const i=idx(x,y);if(S.tiles[i].t==='water')continue;r+=TCOL[i*3];g+=TCOL[i*3+1];b+=TCOL[i*3+2];n++;}out[0]=r/n;out[1]=g/n;out[2]=b/n;return out;}
const rgb=(r,g,b)=>'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';
const C00=[0,0,0],C10=[0,0,0],C01=[0,0,0],C11=[0,0,0];
/* Bodenstücke von Gebäuden: Acker, Weide, Pflaster, sonst gestampfter Hof */
function yardOf(i){const a=anc(i);if(a<0)return null;const b=S.tiles[a].b;if(!b)return null;const st=B[b.type].st;
  if(st.s==='field')return st.crop==='flachs'?'#8FA86C':'#B79A55';if(st.s==='pasture')return '#9DB678';if(st.s==='market')return '#B8AD94';if(st.s==='dock')return null;return 'rgba(150,128,92,.28)';}
function groundTile(x,y){
  const i=idx(x,y),T=S.tiles[i];if(T.t==='water')return;
  const[sx,sy]=tilePos(x,y),open=unlocked(i),dep=12,r=rng(S.seed*31+i*977);
  const wl=!inb(x,y+1)||S.tiles[idx(x,y+1)].t==='water',wr=!inb(x+1,y)||S.tiles[idx(x+1,y)].t==='water';
  if(wl){pq(sx,sy,[[-.5,.5,0],[.5,.5,0],[.5,.5,-dep],[-.5,.5,-dep]],open?'#9C8762':'#6F6450');pq(sx,sy,[[-.5,.5,-dep*.55],[.5,.5,-dep*.55],[.5,.5,-dep],[-.5,.5,-dep]],'rgba(40,30,20,.16)');pl(sx,sy,[-.5,.5,-dep*.3],[.5,.5,-dep*.3],'rgba(255,255,255,.1)',.8);}
  if(wr){pq(sx,sy,[[.5,.5,0],[.5,-.5,0],[.5,-.5,-dep],[.5,.5,-dep]],open?'#7A6A4A':'#5B523F');pq(sx,sy,[[.5,.5,-dep*.55],[.5,-.5,-dep*.55],[.5,-.5,-dep],[.5,.5,-dep]],'rgba(40,30,20,.16)');}
  cornerCol(x,y,C00);cornerCol(x+1,y,C10);cornerCol(x,y+1,C01);cornerCol(x+1,y+1,C11);
  const M=3,e=.012;
  for(let b=0;b<M;b++)for(let a=0;a<M;a++){const u=(a+.5)/M,v=(b+.5)/M,k0=(1-u)*(1-v),k1=u*(1-v),k2=(1-u)*v,k3=u*v;
    const u0=-.5+a/M-e,u1=-.5+(a+1)/M+e,v0=-.5+b/M-e,v1=-.5+(b+1)/M+e;
    pq(sx,sy,[[u0,v0,0],[u1,v0,0],[u1,v1,0],[u0,v1,0]],rgb(C00[0]*k0+C10[0]*k1+C01[0]*k2+C11[0]*k3,C00[1]*k0+C10[1]*k1+C01[1]*k2+C11[1]*k3,C00[2]*k0+C10[2]*k1+C01[2]*k2+C11[2]*k3));}
  const pt=()=>spt(sx,sy,r()*.9-.45,r()*.9-.45,0);
  const yd=yardOf(i);
  if(yd){pq(sx,sy,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],yd);
    const st=B[S.tiles[anc(i)].b.type].st;
    if(st.s==='market'){ctx.strokeStyle='rgba(90,80,64,.25)';ctx.lineWidth=.6;for(let k=-.33;k<.5;k+=.333){pl(sx,sy,[k,-.5,0],[k,.5,0],'rgba(90,80,64,.22)',.6);pl(sx,sy,[-.5,k,0],[.5,k,0],'rgba(90,80,64,.22)',.6);}}
    else if(st.s==='pasture'){ctx.strokeStyle='rgba(70,100,45,.4)';ctx.lineWidth=.8;ctx.beginPath();for(let k=0;k<10;k++){const[x2,y2]=pt();ctx.moveTo(x2,y2);ctx.lineTo(x2+.3,y2-2.6);}ctx.stroke();}
    else if(st.s!=='field'){for(let k=0;k<4;k++){const[x2,y2]=pt();ell(x2,y2,1.2,.6,'rgba(110,95,70,.35)');}}
  } else if(T.t==='grass'||T.t==='forest'){
    const fo=T.t==='forest';
    if(!fo&&r()<.35){const[x2,y2]=pt();ell(x2,y2,6+r()*5,2.6+r()*2,'rgba(90,120,60,.12)');}
    ctx.lineWidth=.8;for(const col of fo?['rgba(40,60,30,.35)','rgba(70,90,40,.3)']:['rgba(70,100,45,.38)','rgba(110,140,70,.35)']){ctx.strokeStyle=col;ctx.beginPath();for(let k=0;k<7;k++){const[x2,y2]=pt();ctx.moveTo(x2-1,y2);ctx.lineTo(x2-1.4,y2-2.4);ctx.moveTo(x2,y2);ctx.lineTo(x2+.3,y2-3);ctx.moveTo(x2+1,y2);ctx.lineTo(x2+1.6,y2-2.2);}ctx.stroke();}
    if(!fo&&r()<.4){const[x2,y2]=pt(),c=['#F4F0E6','#E7C25A','#B9A6D8','#E7A0A0'][Math.floor(r()*4)];for(let k=0;k<2+r()*3;k++)ell(x2+r()*6-3,y2+r()*3-1.5,1,1,c);}
    if(!fo&&r()<.12){const[x2,y2]=pt();ell(x2,y2,1.8,1.1,'#A8A69A');ell(x2-.4,y2-.4,1,.5,'rgba(255,255,255,.35)');}
    if(fo)for(let k=0;k<7;k++){const[x2,y2]=pt();ell(x2,y2,1.4,.7,k%2?'rgba(90,70,40,.32)':'rgba(70,100,50,.35)');}}
  else if(T.t==='tundra'){for(let k=0;k<4;k++){const[x2,y2]=pt();ell(x2,y2,4+r()*6,1.6+r()*2,'rgba(250,252,250,.7)');}ctx.strokeStyle='rgba(90,110,95,.35)';ctx.lineWidth=.8;ctx.beginPath();for(let k=0;k<8;k++){const[x2,y2]=pt();ctx.moveTo(x2,y2);ctx.lineTo(x2+.4,y2-2.4);}ctx.stroke();if(r()<.2){const[x2,y2]=pt();ell(x2,y2,1.8,1,'#9AA19C');}}
  else if(T.t==='heide'){for(let k=0;k<22;k++){const[x2,y2]=pt();ell(x2,y2-1,1.3,1,['#9C7BB0','#B58FC4','#8A6A9E','#7D8A5A'][k%4]);}ctx.strokeStyle='rgba(90,80,55,.4)';ctx.lineWidth=.7;ctx.beginPath();for(let k=0;k<8;k++){const[x2,y2]=pt();ctx.moveTo(x2,y2);ctx.lineTo(x2-.6,y2-2);}ctx.stroke();}
  else if(T.t==='moor'){for(let k=0;k<2;k++){const[x2,y2]=pt();ell(x2,y2,5+r()*4,2+r()*1.5,'#55706E');ell(x2-1.5,y2-.6,2,.6,'rgba(255,255,255,.3)');}ctx.strokeStyle='rgba(70,85,45,.6)';ctx.lineWidth=.8;ctx.beginPath();for(let k=0;k<10;k++){const[x2,y2]=pt();ctx.moveTo(x2,y2);ctx.lineTo(x2-.8,y2-4.5);ctx.moveTo(x2+1,y2);ctx.lineTo(x2+1.4,y2-3.6);}ctx.stroke();for(let k=0;k<3;k++){const[x2,y2]=pt();ctx.fillStyle='#7A5636';ctx.fillRect(x2-.6,y2-6,1.2,2.6);}}
  else if(T.t==='berg'){ctx.strokeStyle='rgba(60,62,58,.3)';ctx.lineWidth=.8;for(let k=0;k<3;k++){let[x2,y2]=pt();ctx.beginPath();ctx.moveTo(x2,y2);for(let q=0;q<3;q++){x2+=r()*8-4;y2+=r()*4-2;ctx.lineTo(x2,y2);}ctx.stroke();}}
  else if(T.t==='sand'){for(let k=0;k<14;k++){const[x2,y2]=pt();ell(x2,y2,.8,.5,r()<.5?'#CDBB8A':'#F2E6C2');}ctx.strokeStyle='rgba(180,160,110,.4)';ctx.lineWidth=.8;for(let k=0;k<2;k++){const[x2,y2]=pt();ctx.beginPath();ctx.moveTo(x2-7,y2);ctx.quadraticCurveTo(x2,y2-2.5,x2+7,y2);ctx.stroke();}
    if(r()<.3){const[x2,y2]=pt();ell(x2,y2,1.6,1,'#F4EDE0');}if(REG[T.r].id==='duene'&&r()<.6){ctx.strokeStyle='rgba(130,150,80,.6)';ctx.beginPath();for(let k=0;k<4;k++){const[x2,y2]=pt();ctx.moveTo(x2,y2);ctx.lineTo(x2-1.5,y2-4);ctx.moveTo(x2,y2);ctx.lineTo(x2+1.2,y2-4.5);}ctx.stroke();}}
  else if(T.t==='rock'){ctx.strokeStyle='rgba(60,62,58,.35)';ctx.lineWidth=.8;for(let k=0;k<2;k++){let[x2,y2]=pt();ctx.beginPath();ctx.moveTo(x2,y2);for(let q=0;q<3;q++){x2+=r()*8-4;y2+=r()*4-2;ctx.lineTo(x2,y2);}ctx.stroke();}
    for(const[u,v,sz]of[[-.15,.05,1],[.15,-.12,.8],[-.02,.2,.6]]){const[x2,y2]=spt(sx,sy,u+r()*.1,v+r()*.1,0),w=9*sz,h=8*sz;
      ell(x2+3,y2+1,w*.9,w*.35,SHADOW);ctx.fillStyle='#9A9C96';ctx.beginPath();ctx.moveTo(x2-w,y2);ctx.lineTo(x2-w*.5,y2-h);ctx.lineTo(x2+w*.2,y2-h*1.1);ctx.lineTo(x2,y2+w*.3);ctx.fill();ctx.fillStyle='#6F716B';ctx.beginPath();ctx.moveTo(x2+w*.2,y2-h*1.1);ctx.lineTo(x2+w,y2-h*.2);ctx.lineTo(x2+w*.6,y2+w*.25);ctx.lineTo(x2,y2+w*.3);ctx.fill();ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.moveTo(x2-w*.5,y2-h);ctx.lineTo(x2+w*.2,y2-h*1.1);ctx.lineTo(x2-w*.1,y2-h*.5);ctx.fill();}}
  if(!open){const ex=S.explore&&S.explore.r===T.r;pq(sx,sy,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],ex?'rgba(220,226,226,.22)':'rgba(40,52,58,.28)');pq(sx,sy,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],'rgba(220,226,226,.16)');}
}
function shoreTile(x,y){
  const i=idx(x,y),T=S.tiles[i];if(T.t==='water')return;
  if(!N8.some(([dx,dy])=>!inb(x+dx,y+dy)||S.tiles[idx(x+dx,y+dy)].t==='water'))return;
  const[sx,sy]=tilePos(x,y);
  pq(sx,sy+12,[[-.82,-.82,0],[.82,-.82,0],[.82,.82,0],[-.82,.82,0]],'rgba(170,205,200,.28)');
  pq(sx,sy+12,[[-.64,-.64,0],[.64,-.64,0],[.64,.64,0],[-.64,.64,0]],'rgba(240,248,244,.22)');
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
  const X0=cx*CW,Y0=cy*CW,list=tilesInRect(X0,Y0,X0+CW,Y0+CW).filter(([x,y])=>S.tiles[idx(x,y)].t!=='water');
  if(!list.length)return null;
  const c=document.createElement('canvas');c.width=Math.ceil(CW*sc)+2;c.height=Math.ceil(CW*sc)+2;
  const keep=ctx;ctx=c.getContext('2d');ctx.setTransform(sc,0,0,sc,1-X0*sc,1-Y0*sc);ctx.lineCap='round';ctx.lineJoin='round';
  try{for(const[x,y]of list)shoreTile(x,y);for(const[x,y]of list)groundTile(x,y);
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
  for(let s=0;s<=2*N-2;s++)for(let x=Math.max(0,s-N+1);x<=Math.min(N-1,s);x++){const y=s-x,i=idx(x,y),T=S.tiles[i];if(T.t==='water')continue;const[sx,sy]=tilePos(x,y);
    const yd=yardOf(i),open=unlocked(i);let col=rgb(TCOL[i*3],TCOL[i*3+1],TCOL[i*3+2]);
    if(T.t==='forest')col=rgb(TCOL[i*3]*.72,TCOL[i*3+1]*.8,TCOL[i*3+2]*.72);if(T.t==='berg')col='#B9BCB6';if(yd&&yd[0]==='#')col=yd;
    if(!inb(x,y+1)||S.tiles[idx(x,y+1)].t==='water'){g.fillStyle=open?'#9C8762':'#6F6450';g.beginPath();g.moveTo(sx-TW/2,sy);g.lineTo(sx,sy+TH/2);g.lineTo(sx,sy+TH/2+12);g.lineTo(sx-TW/2,sy+12);g.fill();}
    if(!inb(x+1,y)||S.tiles[idx(x+1,y)].t==='water'){g.fillStyle=open?'#7A6A4A':'#5B523F';g.beginPath();g.moveTo(sx+TW/2,sy);g.lineTo(sx,sy+TH/2);g.lineTo(sx,sy+TH/2+12);g.lineTo(sx+TW/2,sy+12);g.fill();}
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
  if(!connected(i)&&!battle)drawNoRoad(sx,sy-topH(b)-10);
  if(bz){drawScaffold(sx,sy,b);drawBuilder(sx,sy,i,n);drawTimer(sx,sy-topH(b)-8,b,b.until,bTime(b.type,b.lvl));}
}
function drawTileObj(i,far){const T=S.tiles[i],[sx,sy]=tilePos(i%N,(i/N)|0),open=unlocked(i);
  if(T.t==='water'){if(T.rd)drawBridge(i,sx,sy);return;}
  if(T.t==='forest')drawTrees(i,sx,sy,open,far);else if(T.t==='berg')drawPeak(i,sx,sy,open);
  if(RCENT&&RCENT[T.r]===i&&!open)drawSign(i,T.r);}
let lastFrame=0;
function draw(ts){
  const dt=Math.min(.05,(ts-lastFrame)/1000||0),gdt=dt*CLK.k;lastFrame=ts;UT=ts;T0+=gdt*1000;
  keyPan(dt);updVill(Math.min(.4,gdt));tradeA+=gdt*.012;
  if(glide){const k=1-Math.exp(-dt*9);view.x+=(glide.x-view.x)*k;view.y+=(glide.y-view.y)*k;if(Math.abs(glide.x-view.x)+Math.abs(glide.y-view.y)<.5)glide=null;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle=seaGrad;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=1.2;ctx.lineCap='round';
  ctx.beginPath();for(let i=0;i<30;i++){const x=((i*137.5+T0*.006*(i%3+1))%(W+80))-40,y=(i*71.3)%H;ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y-3,x+16,y);}ctx.stroke();
  const z=view.z,far=dpr*z<.55;ctx.setTransform(dpr*z,0,0,dpr*z,dpr*(W/2+view.x),dpr*(H/2+view.y));
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
  drawParts();
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawGulls(gdt);
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
      const y=p.y-t*26,a=t<.15?t/.15:t>.6?1-(t-.6)/.4:1,s=t<.15?.6+t/.15*.4:1;
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
