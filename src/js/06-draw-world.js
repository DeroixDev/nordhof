
/* Figuren auf der Insel */
const vill=[];const VCOL=['#9A3224','#3F5E6B','#5C7246','#C4862A','#7F6B57','#B9A07A'];
function landTiles(){const a=[];S.tiles.forEach((T,i)=>{if(T.t!=='water'&&T.t!=='rock'&&T.t!=='berg'&&unlocked(i))a.push(i);});return a;}
function villagersFit(){
  if(!S)return;const want=Math.min(18,2+Math.floor(S.pop.n/3));
  const land=landTiles();if(!land.length)return;
  while(vill.length<want){const i=pick(land);vill.push({x:i%N,y:(i/N)|0,tx:i%N,ty:(i/N)|0,wait:rand(0,2),col:pick(VCOL),hat:Math.random()<.5,carry:null,ph:rand(0,TAU)});}
  vill.length=Math.min(vill.length,want);
}
function updVill(dt){
  let targets=null;
  for(const v of vill){
    const dx=v.tx-v.x,dy=v.ty-v.y;
    if(Math.abs(dx)<.02&&Math.abs(dy)<.02){
      v.wait-=dt;if(v.wait>0)continue;
      targets=targets||S.tiles.map((T,i)=>T.b&&B[T.b.type].st.s!=='wall'&&unlocked(i)?i:-1).filter(i=>i>=0);
      const i=pick(targets.length?targets:landTiles());
      v.tx=i%N+rand(-.25,.25);v.ty=((i/N)|0)+rand(-.25,.25);v.wait=rand(1.5,4);
      const bb=S.tiles[i].b;v.carry=bb&&Math.random()<.6?(B[bb.type].out||(B[bb.type].rec&&B[bb.type].rec[0])||null):null;
      continue;
    }
    const sp=.7*dt;
    if(Math.abs(dx)>.02)v.x+=Math.sign(dx)*Math.min(Math.abs(dx),sp);else v.y+=Math.sign(dy)*Math.min(Math.abs(dy),sp);
    v.ph+=dt*10;
  }
}
function drawVill(v){
  let[sx,sy]=tilePos(v.x,v.y);
  const moving=Math.abs(v.tx-v.x)+Math.abs(v.ty-v.y)>.02;
  const sw=moving?Math.sin(v.ph)*2.2:0,bob=moving?Math.abs(Math.sin(v.ph)):0;
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(sx,sy,4,1.8,0,0,TAU);ctx.fill();
  ctx.strokeStyle='#3B3532';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(sx-1.2,sy-5);ctx.lineTo(sx-1.2-sw*.6,sy);ctx.moveTo(sx+1.2,sy-5);ctx.lineTo(sx+1.2+sw*.6,sy);ctx.stroke();
  sy-=bob;
  ctx.fillStyle=v.col;ctx.beginPath();ctx.roundRect(sx-3.2,sy-12,6.4,8,2);ctx.fill();
  ctx.fillStyle='#F0C9A8';ctx.beginPath();ctx.arc(sx,sy-14.5,2.8,0,TAU);ctx.fill();
  if(v.hat){ctx.fillStyle='#5A3B24';ctx.beginPath();ctx.ellipse(sx,sy-16.5,3.6,1.5,0,0,TAU);ctx.fill();}
  if(v.carry&&moving)ctx.drawImage(iconC(v.carry),sx+1,sy-14,9,9);
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
let lastFrame=0;
function draw(ts){
  const dt=Math.min(.05,(ts-lastFrame)/1000||0);lastFrame=ts;T0=ts;
  updVill(dt);tradeA+=dt*.035;
  if(glide){const k=1-Math.exp(-dt*9);view.x+=(glide.x-view.x)*k;view.y+=(glide.y-view.y)*k;if(Math.abs(glide.x-view.x)+Math.abs(glide.y-view.y)<.5)glide=null;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle=seaGrad;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=1.2;ctx.lineCap='round';
  ctx.beginPath();for(let i=0;i<24;i++){const x=((i*137.5+ts*.006*(i%3+1))%(W+80))-40,y=(i*71.3)%H;ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y-3,x+16,y);}ctx.stroke();
  const z=view.z;ctx.setTransform(dpr*z,0,0,dpr*z,dpr*(W/2+view.x),dpr*(H/2+view.y));
  drawGround();
  if(battle){if(!battle.done)S.tiles.forEach((T,i)=>{if(T.b&&RANGE[T.b.type])drawRange(i,.35);});}
  else if(sel>=0&&S.tiles[sel].b&&RANGE[S.tiles[sel].b.type])drawRange(sel,1);
  const ents=[];
  for(const v of vill)ents.push({d:v.x+v.y+.05,f:()=>drawVill(v)});
  {const gx=MID+15.2*Math.cos(tradeA),gy=MID+15.2*Math.sin(tradeA);ents.push({d:gx+gy,f:()=>boatAt(gx,gy,tradeA+Math.PI/2,'knarr',ts)});}
  if(battle){for(const r of battle.rs)ents.push({d:r.x+r.y+.1,f:()=>drawRaider(r)});for(const l of battle.L){ents.push({d:l.bx+l.by,f:()=>boatAt(l.bx,l.by,l.a+Math.PI,'lang',ts)});}}
  else if(S.raid.pending){const k=Math.min(1,(now()-S.raid.since)/15000);for(const a of[2.4,2.9]){const r=19-6*k,gx=MID+r*Math.cos(a),gy=MID+r*Math.sin(a);ents.push({d:gx+gy,f:()=>boatAt(gx,gy,a+Math.PI,'lang',ts)});}}
  ents.sort((a,b)=>a.d-b.d);
  let e=0;
  for(let s=0;s<=2*(N-1);s++){
    for(let x=0;x<N;x++){const y=s-x;if(y<0||y>=N)continue;drawTile(x,y);}
    while(e<ents.length&&ents[e].d<s+1)ents[e++].f();
  }
  while(e<ents.length)ents[e++].f();
  if(battle)drawBattleTop();
  if(sel>=0)drawMarker(sel);
  drawParts();
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawGulls(dt);
  if(night>0){ctx.fillStyle='rgba(18,28,58,'+(night*.36)+')';ctx.fillRect(0,0,W,H);}
}
/* Boden (Seitenflächen, Oberflächen, Felsen) ändert sich selten: einmal in eine Ebene zeichnen und pro Frame nur kopieren. */
/* Boden in Kacheln zu 256 Weltpixeln, pro Zoomstufe einmal gezeichnet */
const GCH=new Map();let gKey='';const CW=256;
function groundKey(){let h=0;for(let i=0;i<N*N;i++){const T=S.tiles[i];h=(h*31+(T.t.charCodeAt(0)+T.t.length*3+(T.b?T.b.type.length*7+(T.b.type.charCodeAt(0)<<3):0)+(unlocked(i)?1:0)))|0;}return h+'|'+dpr+'|'+(S.explore?S.explore.r:0);}
let gkT=0,gkV='';
let gZ=0,gZT=0;
function drawGround(){
  if(T0-gkT>250||!gkV){gkV=groundKey();gkT=T0;}
  if(gkV!==gKey){GCH.clear();gKey=gkV;}
  /* Kacheln in genau der Bildschirmauflösung: dann ist das Kopieren pixelgenau und billig.
     Während gezoomt wird, werden alte Kacheln skaliert weiterbenutzt und danach nach und nach erneuert. */
  const want=Math.min(4,dpr*view.z);if(want!==gZ){gZ=want;gZT=T0;}
  const settled=T0-gZT>160;let budget=settled?3:0;
  const x0=(-W/2-view.x)/view.z,x1=(W/2-view.x)/view.z,y0=(-H/2-view.y)/view.z,y1=(H/2-view.y)/view.z;
  const exact=want===dpr*view.z,ox=dpr*(W/2+view.x),oy=dpr*(H/2+view.y);
  for(let cy=Math.floor(y0/CW);cy<=Math.floor(y1/CW);cy++)for(let cx=Math.floor(x0/CW);cx<=Math.floor(x1/CW);cx++){
    const k=cx+','+cy;let e=GCH.get(k);
    if(!e||(e.sc!==want&&budget-->0)){e={c:chunk(cx,cy,want),sc:want};GCH.delete(k);GCH.set(k,e);if(GCH.size>40)GCH.delete(GCH.keys().next().value);}
    const c=e.c;if(!c)continue;
    if(exact&&e.sc===want){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(c,Math.round(ox+cx*CW*want)-1,Math.round(oy+cy*CW*want)-1);ctx.restore();}
    else{const pad=1/e.sc;ctx.drawImage(c,cx*CW-pad,cy*CW-pad,c.width/e.sc,c.height/e.sc);}
  }
  if(sel>=0){const[sx,sy]=tilePos(sel%N,(sel/N)|0);
    ctx.beginPath();ctx.moveTo(sx-TW/2,sy);ctx.lineTo(sx,sy-TH/2);ctx.lineTo(sx+TW/2,sy);ctx.lineTo(sx,sy+TH/2);ctx.closePath();ctx.fillStyle='rgba(255,246,214,.4)';ctx.fill();
    ctx.save();ctx.setLineDash([5,4]);ctx.lineDashOffset=-T0/60;ctx.strokeStyle='#FFF8E6';ctx.lineWidth=1.8;
    ctx.beginPath();ctx.moveTo(sx-TW/2+4,sy);ctx.lineTo(sx,sy-TH/2+2);ctx.lineTo(sx+TW/2-4,sy);ctx.lineTo(sx,sy+TH/2-2);ctx.closePath();ctx.stroke();ctx.restore();}
}
function chunk(cx,cy,sc){
  const X0=cx*CW,Y0=cy*CW,list=[];
  for(let s=0;s<=2*(N-1);s++)for(let x=0;x<N;x++){const y=s-x;if(y<0||y>=N)continue;const i=idx(x,y);if(S.tiles[i].t==='water')continue;
    const[sx,sy]=tilePos(x,y);if(sx+60<X0||sx-60>X0+CW||sy+44<Y0||sy-26>Y0+CW)continue;list.push([x,y]);}
  if(!list.length)return null;
  const c=document.createElement('canvas');c.width=Math.ceil(CW*sc)+2;c.height=Math.ceil(CW*sc)+2;
  const keep=ctx;ctx=c.getContext('2d');ctx.setTransform(sc,0,0,sc,1-X0*sc,1-Y0*sc);ctx.lineCap='round';ctx.lineJoin='round';
  for(const[x,y]of list)shoreTile(x,y);
  for(const[x,y]of list)groundTile(x,y);
  ctx=keep;return c;
}
function groundTile(x,y){
  const i=idx(x,y),T=S.tiles[i];if(T.t==='water')return;
  const[sx,sy]=tilePos(x,y),open=unlocked(i),dep=12,r=rng(S.seed*31+i*977);
  let top=TERR[T.t].c;
  const bs=T.b&&B[T.b.type].st.s;
  if(bs==='field')top=B[T.b.type].st.crop==='flachs'?'#9DB37A':'#C9AE5A';
  if(bs==='pasture')top='#9FB879';
  if(bs==='market')top='#BDB29A';
  top=shade(top,(r()-.5)*.06);
  const tc=open?top:shade(top,-.3);
  pq(sx,sy,[[-.5,.5,0],[.5,.5,0],[.5,.5,-dep],[-.5,.5,-dep]],open?'#9C8762':'#6F6450');
  pq(sx,sy,[[.5,.5,0],[.5,-.5,0],[.5,-.5,-dep],[.5,.5,-dep]],open?'#7A6A4A':'#5B523F');
  pq(sx,sy,[[-.5,.5,-dep*.55],[.5,.5,-dep*.55],[.5,-.5,-dep*.55],[.5,-.5,-dep],[.5,.5,-dep],[-.5,.5,-dep]],'rgba(40,30,20,.16)');
  pl(sx,sy,[-.5,.5,-dep*.3],[.5,.5,-dep*.3],'rgba(255,255,255,.1)',.8);
  pq(sx,sy,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],tc);
  const g=ctx.createLinearGradient(sx-TW/4,sy-TH/4,sx+TW/4,sy+TH/4);g.addColorStop(0,'rgba(255,250,235,.13)');g.addColorStop(1,'rgba(0,0,0,.07)');
  pq(sx,sy,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],g);
  const pt=()=>spt(sx,sy,r()*.9-.45,r()*.9-.45,0);
  if(T.t==='tundra'){for(let k=0;k<5;k++){const[x,y]=pt();ell(x,y,4+r()*5,1.6+r()*1.6,'rgba(250,252,250,.75)');}ctx.strokeStyle='rgba(90,110,95,.35)';ctx.lineWidth=.8;ctx.beginPath();for(let k=0;k<6;k++){const[x,y]=pt();ctx.moveTo(x,y);ctx.lineTo(x+.4,y-2.4);}ctx.stroke();}
  else if(T.t==='heide'&&!T.b){for(let k=0;k<26;k++){const[x,y]=pt();ell(x,y-1,1.3,1,['#9C7BB0','#B58FC4','#8A6A9E'][k%3]);}ctx.strokeStyle='rgba(90,80,55,.4)';ctx.lineWidth=.7;ctx.beginPath();for(let k=0;k<8;k++){const[x,y]=pt();ctx.moveTo(x,y);ctx.lineTo(x-.6,y-2);}ctx.stroke();}
  else if(T.t==='moor'){for(let k=0;k<2;k++){const[x,y]=pt();ell(x,y,5+r()*4,2+r()*1.5,'#55706E');ell(x-1.5,y-.6,2,.6,'rgba(255,255,255,.3)');}ctx.strokeStyle='rgba(70,85,45,.6)';ctx.lineWidth=.8;ctx.beginPath();for(let k=0;k<10;k++){const[x,y]=pt();ctx.moveTo(x,y);ctx.lineTo(x-.8,y-4.5);ctx.moveTo(x+1,y);ctx.lineTo(x+1.4,y-3.6);}ctx.stroke();for(let k=0;k<3;k++){const[x,y]=pt();ctx.fillStyle='#7A5636';ctx.fillRect(x-.6,y-6,1.2,2.6);}}
  else if(T.t==='berg'){ctx.strokeStyle='rgba(60,62,58,.3)';ctx.lineWidth=.8;for(let k=0;k<3;k++){let[x,y]=pt();ctx.beginPath();ctx.moveTo(x,y);for(let q=0;q<3;q++){x+=r()*8-4;y+=r()*4-2;ctx.lineTo(x,y);}ctx.stroke();}}
  else if(T.t==='sand'&&REG[T.r].id==='duene'){ctx.strokeStyle='rgba(180,160,110,.45)';ctx.lineWidth=.8;for(let k=0;k<3;k++){const[x,y]=pt();ctx.beginPath();ctx.moveTo(x-7,y);ctx.quadraticCurveTo(x,y-2.5,x+7,y);ctx.stroke();}ctx.strokeStyle='rgba(130,150,80,.6)';ctx.beginPath();for(let k=0;k<4;k++){const[x,y]=pt();ctx.moveTo(x,y);ctx.lineTo(x-1.5,y-4);ctx.moveTo(x,y);ctx.lineTo(x+1.2,y-4.5);}ctx.stroke();}
  if(!T.b||bs==='house'||bs==='mine'||bs==='tower'||bs==='well'||bs==='kiln'||bs==='hives'||bs==='wall'){
    if(T.t==='grass'||T.t==='forest'){ctx.strokeStyle=T.t==='forest'?'rgba(50,70,35,.35)':'rgba(70,100,45,.4)';ctx.lineWidth=.8;ctx.beginPath();for(let k=0;k<14;k++){const[x,y]=pt();ctx.moveTo(x-1,y);ctx.lineTo(x-1.4,y-2.4);ctx.moveTo(x,y);ctx.lineTo(x+.3,y-3);ctx.moveTo(x+1,y);ctx.lineTo(x+1.6,y-2.2);}ctx.stroke();
      if(T.t==='grass'&&r()<.45)for(let k=0;k<1+r()*3;k++){const[x,y]=pt();ell(x,y-.5,1,1,['#F4F0E6','#E7C25A','#B9A6D8'][Math.floor(r()*3)]);}
      if(T.t==='forest')for(let k=0;k<6;k++){const[x,y]=pt();ell(x,y,1.4,.7,'rgba(90,70,40,.3)');}}
    else if(T.t==='sand'){for(let k=0;k<16;k++){const[x,y]=pt();ell(x,y,.8,.5,r()<.5?'#CDBB8A':'#F2E6C2');}if(r()<.4){const[x,y]=pt();ell(x,y,1.6,1,'#F4EDE0');}}
    else if(T.t==='rock'&&!T.b){ctx.strokeStyle='rgba(60,62,58,.35)';ctx.lineWidth=.8;for(let k=0;k<2;k++){let[x,y]=pt();ctx.beginPath();ctx.moveTo(x,y);for(let q=0;q<3;q++){x+=r()*8-4;y+=r()*4-2;ctx.lineTo(x,y);}ctx.stroke();}
      for(const[u,v,sz]of[[-.15,.05,1],[.15,-.12,.8],[-.02,.2,.6]]){const[x,y]=spt(sx,sy,u+r()*.1,v+r()*.1,0),w=9*sz,h=8*sz;
        ell(x+3,y+1,w*.9,w*.35,SHADOW);ctx.fillStyle='#9A9C96';ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(x-w*.5,y-h);ctx.lineTo(x+w*.2,y-h*1.1);ctx.lineTo(x,y+w*.3);ctx.fill();ctx.fillStyle='#6F716B';ctx.beginPath();ctx.moveTo(x+w*.2,y-h*1.1);ctx.lineTo(x+w,y-h*.2);ctx.lineTo(x+w*.6,y+w*.25);ctx.lineTo(x,y+w*.3);ctx.fill();ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.moveTo(x-w*.5,y-h);ctx.lineTo(x+w*.2,y-h*1.1);ctx.lineTo(x-w*.1,y-h*.5);ctx.fill();}}
  }
  if(!open){const ex=S.explore&&S.explore.r===T.r;ctx.globalAlpha=ex?.18:.34;pq(sx,sy,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],'#DCE2E2');ctx.globalAlpha=1;}
}
function shoreTile(x,y){
  const i=idx(x,y),T=S.tiles[i];if(T.t==='water')return;
  if(!N8.some(([dx,dy])=>!inb(x+dx,y+dy)||S.tiles[idx(x+dx,y+dy)].t==='water'))return;
  const[sx,sy]=tilePos(x,y);
  pq(sx,sy+12,[[-.82,-.82,0],[.82,-.82,0],[.82,.82,0],[-.82,.82,0]],'rgba(170,205,200,.28)');
  pq(sx,sy+12,[[-.64,-.64,0],[.64,-.64,0],[.64,.64,0],[-.64,.64,0]],'rgba(240,248,244,.22)');
}
function drawTile(x,y){
  const i=idx(x,y),T=S.tiles[i];if(T.t==='water')return;
  const[sx,sy]=tilePos(x,y);
  const px=W/2+view.x+sx*view.z,py=H/2+view.y+sy*view.z;if(px<-80*view.z||px>W+80*view.z||py<-30*view.z||py>H+130*view.z)return;
  if(!T.b){if(T.t==='forest')drawTrees(i,sx,sy,unlocked(i));else if(T.t==='berg')drawPeak(i,sx,sy,unlocked(i));
    if(RCENT&&RCENT[T.r]===i&&!unlocked(i))drawSign(i,T.r);return;}
  const b=T.b,bz=busy(b);
  if(bz&&b.job==='build'){
    pq(sx,sy,[[-.4,-.4,1],[.4,-.4,1],[.4,.4,1],[-.4,.4,1]],'#B9A27E');pq(sx,sy,[[-.4,.4,1],[.4,.4,1],[.4,.4,0],[-.4,.4,0]],'#8E7A5C');pq(sx,sy,[[.4,.4,1],[.4,-.4,1],[.4,-.4,0],[.4,.4,0]],'#76664C');
    const tot=bTime(b.type,0)*1000,fr=Math.max(0,Math.min(1,1-(b.until-now())/tot));
    ctx.globalAlpha=.3+fr*.45;blitB(sx,sy,'b'+b.type+b.lvl+'0',()=>bodyB(0,0,b,0));ctx.globalAlpha=1;
    drawScaffold(sx,sy,b);drawBuilder(sx,sy,i);drawTimer(sx,sy-topH(b)-8,b,b.until,tot/1000);return;}
  const a=anim[i];
  if(a!==undefined){const k=Math.min(1,Math.max(0,(T0-a)/500));if(k>=1)delete anim[i];const s=Math.max(.01,easeBack(k));ctx.save();ctx.translate(sx,sy);ctx.scale(s,s);ctx.translate(-sx,-sy);drawB(sx,sy,b);ctx.restore();}
  else drawB(sx,sy,b);
  if(bz){drawScaffold(sx,sy,b);drawBuilder(sx,sy,i);drawTimer(sx,sy-topH(b)-8,b,b.until,bTime(b.type,b.lvl));}
}
function drawMarker(i){
  const T=S.tiles[i];const[sx,sy]=tilePos(i%N,(i/N)|0);
  const st=T.b?B[T.b.type].st:null;
  const h=st?topH(T.b)+6:(T.t==='forest'?26:6);
  const y=sy-h-12-Math.abs(Math.sin(T0/260))*5;
  ctx.beginPath();ctx.moveTo(sx-7,y-9);ctx.lineTo(sx+7,y-9);ctx.lineTo(sx,y);ctx.closePath();
  ctx.fillStyle='#9A3224';ctx.fill();ctx.strokeStyle='#FFF8E6';ctx.lineWidth=1.8;ctx.stroke();
}
function drawParts(){
  for(let k=parts.length-1;k>=0;k--){
    const p=parts[k],t=(T0-p.t0)/p.life;if(t<0)continue;if(t>=1){parts.splice(k,1);continue;}
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
  if(S.opt.fps){fpsN++;if(ts-fpsT>500){$('#fps').textContent=Math.round(fpsN*1000/(ts-fpsT))+' fps';fpsN=0;fpsT=ts;}}
  requestAnimationFrame(loop);
}
function updNight(){const dn=S&&S.opt&&S.opt.dn;if(dn==='tag'){night=0;return;}if(dn==='nacht'){night=1;return;}const d=new Date(),h=d.getHours()+d.getMinutes()/60;night=h>=22||h<5?1:h>=19?(h-19)/3:h<7?(7-h)/2:0;}

/* Gebäude-Vorschaubilder aus denselben Zeichenfunktionen */
const THUMB={};
function thumb(type,lvl){
  const key=type+(lvl||1);if(THUMB[key])return THUMB[key];
  const c=mkc(180,170,g=>{
    const keep=ctx,kn=night,kt=T0;ctx=g;night=0;T0=0;g.lineJoin='round';g.lineCap='round';
    g.setTransform(1.7,0,0,1.7,90,118);
    const st=B[type].st,terr=B[type].need==='rock'?'#A7A89E':B[type].need==='coast'?'#E2D3A6':st.s==='field'?(st.crop==='flachs'?'#9DB37A':'#C9AE5A'):st.s==='pasture'?'#9FB879':st.s==='market'?'#BDB29A':'#A3B57E';
    pq(0,0,[[-.5,.5,0],[.5,.5,0],[.5,.5,-10],[-.5,.5,-10]],'#9C8762');pq(0,0,[[.5,.5,0],[.5,-.5,0],[.5,-.5,-10],[.5,.5,-10]],'#7A6A4A');
    pq(0,0,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],terr);
    const gr=g.createLinearGradient(-16,-8,16,8);gr.addColorStop(0,'rgba(255,250,235,.14)');gr.addColorStop(1,'rgba(0,0,0,.07)');pq(0,0,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],gr);
    const b={type,lvl:lvl||1,run:0};bodyB(0,0,b,0);liveB(0,0,{...b,lvl:1});
    ctx=keep;night=kn;T0=kt;
  });
  THUMB[key]=c.toDataURL();return THUMB[key];
}

