
/* ---------- Insel zeichnen ---------- */
const cv=$('#cv');let ctx=cv.getContext('2d');
let W=0,H=0,dpr=1,view={x:0,y:0,z:1},sel=-1,fitted=false,seaGrad=null;
function resize(){
  const app=$('#app'),top=$('#top'),nav=$('#mnav');
  if(top)app.style.setProperty('--tb',Math.round(top.getBoundingClientRect().height)+'px');
  if(nav)app.style.setProperty('--nav',(nav.offsetParent?Math.round(nav.getBoundingClientRect().height):0)+'px');
  const r=$('#stage').getBoundingClientRect();if(!r.width)return;W=r.width;H=r.height;dpr=Math.min(S&&S.opt&&S.opt.eco?2:3,window.devicePixelRatio||1);
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  seaGrad=ctx.createLinearGradient(0,0,0,H);seaGrad.addColorStop(0,'#93B3B9');seaGrad.addColorStop(1,'#6A909A');
  if(S){fitRes();sizeBB();if(typeof MINI!=='undefined')MINI.on=isDesk()&&tab==='insel';}
}
const SHADE=new Map();
function shade(hex,f){const key=hex+f;let v=SHADE.get(key);if(v)return v;if(hex[0]!=='#')return hex;const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;if(f<0){r*=1+f;g*=1+f;b*=1+f;}else{r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f;}v='rgb('+(r|0)+','+(g|0)+','+(b|0)+')';SHADE.set(key,v);return v;}
function poly(p,fill){ctx.beginPath();ctx.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)ctx.lineTo(p[i],p[i+1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
/* Geometrie: Punkte als [wx,wy,h] in Feldern relativ zur Feldmitte, h in Pixeln nach oben. Licht kommt von links oben. */
/* FK: Flächenmaßstab für mehrfeldrige Gebäude (Höhen bleiben) */
let FK=1;
function pq(sx,sy,L,fill){ctx.beginPath();for(let k=0;k<L.length;k++){const p=L[k],x=sx+(p[0]-p[1])*FK*TW/2,y=sy+(p[0]+p[1])*FK*TH/2-p[2];if(k)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}}
function pl(sx,sy,a,b,col,w){ctx.beginPath();ctx.moveTo(sx+(a[0]-a[1])*FK*TW/2,sy+(a[0]+a[1])*FK*TH/2-a[2]);ctx.lineTo(sx+(b[0]-b[1])*FK*TW/2,sy+(b[0]+b[1])*FK*TH/2-b[2]);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke();}
function spt(sx,sy,wx,wy,h){return[sx+(wx-wy)*FK*TW/2,sy+(wx+wy)*FK*TH/2-h];}
function ell(x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=fill;ctx.fill();}
const SHADOW='rgba(38,48,30,.24)';
function shadowBox(sx,sy,ex,ey,h,cx,cy){
  cx=cx||0;cy=cy||0;const ox=h*.024,oy=h*.009;
  pq(sx,sy,[[cx-ex,cy-ey,0],[cx+ex,cy-ey,0],[cx+ex+ox,cy-ey+oy,0],[cx+ex+ox,cy+ey+oy,0],[cx-ex+ox,cy+ey+oy,0],[cx-ex,cy+ey,0]],SHADOW);
}
function walls(sx,sy,ex,ey,h,col,mat,z,cx,cy){
  z=z||0;cx=cx||0;cy=cy||0;const t=z+h;
  pq(sx,sy,[[cx-ex,cy+ey,z],[cx+ex,cy+ey,z],[cx+ex,cy+ey,t],[cx-ex,cy+ey,t]],shade(col,-.03));
  pq(sx,sy,[[cx+ex,cy+ey,z],[cx+ex,cy-ey,z],[cx+ex,cy-ey,t],[cx+ex,cy+ey,t]],shade(col,-.3));
  const dk='rgba(50,34,20,.2)';
  if(mat==='wood'){
    for(let u=-ex+.07;u<ex-.02;u+=.075)pl(sx,sy,[cx+u,cy+ey,z],[cx+u,cy+ey,t],dk,.7);
    for(let u=-ey+.07;u<ey-.02;u+=.075)pl(sx,sy,[cx+ex,cy+u,z],[cx+ex,cy+u,t],'rgba(30,20,10,.22)',.7);
  } else if(mat==='stone'){
    let r=0;for(let q=z+3;q<t-1;q+=3.2,r++){pl(sx,sy,[cx-ex,cy+ey,q],[cx+ex,cy+ey,q],'rgba(40,36,30,.2)',.6);pl(sx,sy,[cx+ex,cy+ey,q],[cx+ex,cy-ey,q],'rgba(20,18,16,.25)',.6);
      for(let u=-ex+(r%2?.05:.11);u<ex;u+=.12)pl(sx,sy,[cx+u,cy+ey,q],[cx+u,cy+ey,q-3.2],'rgba(40,36,30,.16)',.6);}
  } else if(mat==='plaster'){
    const bm='#6E4A2E';
    pl(sx,sy,[cx-ex,cy+ey,z+h*.55],[cx+ex,cy+ey,z+h*.55],bm,1.1);pl(sx,sy,[cx+ex,cy+ey,z+h*.55],[cx+ex,cy-ey,z+h*.55],shade(bm,-.3),1.1);
    pl(sx,sy,[cx-ex+.02,cy+ey,z],[cx-ex+.02,cy+ey,t],bm,1.3);pl(sx,sy,[cx+ex,cy-ey+.02,z],[cx+ex,cy-ey+.02,t],shade(bm,-.3),1.3);
  }
  pq(sx,sy,[[cx-ex,cy+ey,z],[cx+ex,cy+ey,z],[cx+ex,cy+ey,z+2.2],[cx-ex,cy+ey,z+2.2]],'rgba(0,0,0,.13)');
  pq(sx,sy,[[cx+ex,cy+ey,z],[cx+ex,cy-ey,z],[cx+ex,cy-ey,z+2.2],[cx+ex,cy+ey,z+2.2]],'rgba(0,0,0,.13)');
  pl(sx,sy,[cx+ex,cy+ey,z+.5],[cx+ex,cy+ey,t],'rgba(255,255,255,.22)',.8);
}
function win(sx,sy,face,c,ex,ey,z0,z1,lit,cx,cy){
  cx=cx||0;cy=cy||0;const w=.045;
  const Q=face==='y'?[[cx+c-w,cy+ey,z0],[cx+c+w,cy+ey,z0],[cx+c+w,cy+ey,z1],[cx+c-w,cy+ey,z1]]:[[cx+ex,cy+c+w,z0],[cx+ex,cy+c-w,z0],[cx+ex,cy+c-w,z1],[cx+ex,cy+c+w,z1]];
  pq(sx,sy,Q,'#E9DFC9');
  const I=face==='y'?[[cx+c-w+.012,cy+ey,z0+.8],[cx+c+w-.012,cy+ey,z0+.8],[cx+c+w-.012,cy+ey,z1-.8],[cx+c-w+.012,cy+ey,z1-.8]]:[[cx+ex,cy+c+w-.012,z0+.8],[cx+ex,cy+c-w+.012,z0+.8],[cx+ex,cy+c-w+.012,z1-.8],[cx+ex,cy+c+w-.012,z1-.8]];
  pq(sx,sy,I,lit?'#FFCE6E':'#2F3A3E');
  if(!lit){const a=I[0],b=I[2];pl(sx,sy,[(a[0]+b[0])/2,(a[1]+b[1])/2,a[2]],[(a[0]+b[0])/2,(a[1]+b[1])/2,b[2]],'rgba(233,223,201,.9)',.6);}
}
/* Türen passen zu den Leuten: immer gleich hoch, große Häuser bekommen ein Doppeltor */
const DOORH=9.5;
function door(sx,sy,face,c,ex,ey,hh,cx,cy,wide){
  cx=cx||0;cy=cy||0;const w=wide?.085:.05;
  const Q=face==='y'?[[cx+c-w,cy+ey,0],[cx+c+w,cy+ey,0],[cx+c+w,cy+ey,hh],[cx+c-w,cy+ey,hh]]:[[cx+ex,cy+c+w,0],[cx+ex,cy+c-w,0],[cx+ex,cy+c-w,hh],[cx+ex,cy+c+w,hh]];
  pq(sx,sy,Q,'#4A3222');
  const T=face==='y'?[[cx+c-w-.015,cy+ey,hh],[cx+c+w+.015,cy+ey,hh],[cx+c+w+.015,cy+ey,hh+1.2],[cx+c-w-.015,cy+ey,hh+1.2]]:[[cx+ex,cy+c+w+.015,hh],[cx+ex,cy+c-w-.015,hh],[cx+ex,cy+c-w-.015,hh+1.2],[cx+ex,cy+c+w+.015,hh+1.2]];
  pq(sx,sy,T,'#7A5636');
}
/* Satteldach-Haus; gibt die Kaminposition zurück */
function gable(sx,sy,o,lit){
  const{ex,ey,h,rh,wall,roof,ax,mat,turf}=o,z=o.z||0,cx=o.cx||0,cy=o.cy||0,ov=.07,H=z+h,th=1.8;
  walls(sx,sy,ex,ey,h,wall,mat,z,cx,cy);
  const rL=turf?'#8BA65F':roof,rD=shade(rL,-.24),edge=shade(rL,-.5);
  /* Dach als geschlossener Körper: hintere Fläche, Giebel, vordere Fläche, Traufkante, Ortgang auf beiden Seiten, Firstbalken */
  const P=(wx,wy,hh)=>ax==='x'?[cx+wx,cy+wy,hh]:[cx+wy,cy+wx,hh];
  const A=ax==='x'?ex:ey,Bw=ax==='x'?ey:ex;
  const E0=H-1,R=H+rh;
  let chim=null;
  if(!z){
    if(ax==='x'){const nw=Math.max(1,Math.round(ex/.18));for(let k=0;k<nw;k++){const c=-ex+(k+.5)*(2*ex/nw);win(sx,sy,'y',c,ex,ey,h*.35,h*.35+Math.min(5,h*.4),lit&&k%2===0,cx,cy);}if(o.back)win(sx,sy,'x',0,ex,ey,h*.4,h*.4+Math.min(5,h*.4),lit,cx,cy);else door(sx,sy,'x',0,ex,ey,DOORH,cx,cy,o.wide);}
    else{const nw=Math.max(1,Math.round(ey/.18));for(let k=0;k<nw;k++){const c=-ey+(k+.5)*(2*ey/nw);win(sx,sy,'x',c,ex,ey,h*.35,h*.35+Math.min(5,h*.4),lit&&k%2===1,cx,cy);}if(o.back)win(sx,sy,'y',0,ex,ey,h*.4,h*.4+Math.min(5,h*.4),lit,cx,cy);else door(sx,sy,'y',0,ex,ey,DOORH,cx,cy,o.wide);}
  }
  const front=ax==='x'?rL:rD,back=ax==='x'?shade(rL,-.32):shade(rL,.06);
  // hintere Dachfläche (schaut über den First, wenn das Dach flach genug ist)
  pq(sx,sy,[P(-A-ov,-Bw-ov,E0),P(A+ov,-Bw-ov,E0),P(A+ov,0,R),P(-A-ov,0,R)],back);
  pq(sx,sy,[P(-A-ov,-Bw-ov,E0),P(A+ov,-Bw-ov,E0),P(A+ov,-Bw-ov,E0-th),P(-A-ov,-Bw-ov,E0-th)],edge);
  // Giebelwand bis unter den First
  pq(sx,sy,[P(A,-Bw,H),P(A,Bw,H),P(A,0,R-.5)],ax==='x'?shade(wall,-.3):shade(wall,-.03));
  pl(sx,sy,P(A,0,H),P(A,0,R-3),'rgba(40,28,18,.25)',.7);
  // Schatten der Traufe auf der Längswand
  pq(sx,sy,[P(-A,Bw,H),P(A,Bw,H),P(A,Bw,H-2.5),P(-A,Bw,H-2.5)],'rgba(0,0,0,.17)');
  // vordere Dachfläche
  pq(sx,sy,[P(-A-ov,Bw+ov,E0),P(A+ov,Bw+ov,E0),P(A+ov,0,R),P(-A-ov,0,R)],front);
  if(turf){ctx.strokeStyle=ax==='x'?'rgba(70,95,45,.55)':'rgba(60,85,40,.6)';ctx.lineWidth=.8;ctx.beginPath();
    for(let k=0;k<16;k++){const u=-A+((k*.37)%1)*2*A,v=((k*.61)%1)*.92+.04,[x,y]=spt(sx,sy,...P(u,(Bw+ov)*(1-v),E0+(rh+1)*v).slice(0,2),E0+(rh+1)*v);ctx.moveTo(x,y);ctx.lineTo(x+.6,y-2.2);}ctx.stroke();}
  else for(const f of[.2,.4,.6,.8])pl(sx,sy,P(-A-ov,(Bw+ov)*(1-f),E0+(rh+1)*f),P(A+ov,(Bw+ov)*(1-f),E0+(rh+1)*f),'rgba(0,0,0,.13)',.7);
  // Traufkante vorne als Dachdicke
  pq(sx,sy,[P(-A-ov,Bw+ov,E0),P(A+ov,Bw+ov,E0),P(A+ov,Bw+ov,E0-th),P(-A-ov,Bw+ov,E0-th)],edge);
  // Ortgang: Brett auf beiden Schrägen der sichtbaren Giebelseite
  const gx=A+ov;
  pq(sx,sy,[P(gx,Bw+ov,E0-th),P(gx,0,R-th),P(gx,0,R+.6),P(gx,Bw+ov,E0+.6)],shade(rL,-.42));
  pq(sx,sy,[P(gx,-Bw-ov,E0-th),P(gx,0,R-th),P(gx,0,R+.6),P(gx,-Bw-ov,E0+.6)],shade(rL,-.36));
  // Firstbalken
  pq(sx,sy,[P(-A-ov,-.02,R+.4),P(A+ov,-.02,R+.4),P(A+ov,.02,R+.4),P(-A-ov,.02,R+.4)],shade(rL,-.3));
  pl(sx,sy,P(-A-ov,.02,R+.4),P(A+ov,.02,R+.4),'rgba(255,255,255,.28)',.9);
  chim=ax==='x'?[cx+ex*.45,cy-.02]:[cx+.02,cy-ey*.45];
  return chim;
}
function chimney(sx,sy,c,top,col){
  const e=.055;walls(sx,sy,e,e,7,col||'#6B6F6C','stone',top-3,c[0],c[1]);
  pq(sx,sy,[[c[0]-e,c[1]-e,top+4],[c[0]+e,c[1]-e,top+4],[c[0]+e,c[1]+e,top+4],[c[0]-e,c[1]+e,top+4]],'#A9A69E');pq(sx,sy,[[c[0]-e*.5,c[1]-e*.5,top+4],[c[0]+e*.5,c[1]-e*.5,top+4],[c[0]+e*.5,c[1]+e*.5,top+4],[c[0]-e*.5,c[1]+e*.5,top+4]],'#2A2624');
}
function roofTopAt(o,c){return(o.z||0)+o.h+o.rh*(o.ax==='x'?1-Math.abs(c[1]-(o.cy||0))/(o.ey+.06):1-Math.abs(c[0]-(o.cx||0))/(o.ex+.06));}
function houseOf(st,lv,n,rot){n=n||1;const k=1+(lv-1)*.08,cap=.5*n-.06;const o={...st,wide:n>=3,h:Math.max(DOORH+1.5,(st.h*k+(lv-1)*1.2)*(1+(n-1)*.3)),rh:st.rh*(1+(n-1)*.6),ex:Math.min(cap,st.ex*n*(1+(lv-1)*.05)),ey:Math.min(cap,st.ey*n*(1+(lv-1)*.04))};
  /* Drehen: die Giebelseite mit der Tür zeigt zur gewählten Seite; nach hinten gedreht bleibt die Tür unsichtbar */
  if(rot!==undefined){const f=rot%2?'x':'y';if(o.ax!==f){[o.ex,o.ey]=[o.ey,o.ex];o.ax=f;}o.back=rot>=2;}
  return o;}
/* Kleinkram neben den Häusern */
function prop(sx,sy,kind,at){
  const[px,py]=spt(sx,sy,at[0],at[1],0);
  if(kind==='logs'){for(let k=0;k<3;k++){const y=py-k*2.6,x=px+(k===2?2:0)+(k%2?-3:0);ctx.fillStyle='#8B5E34';ctx.beginPath();ctx.roundRect(x-6,y-2.6,11,5,2);ctx.fill();ell(x+5,y-.1,1.8,2.5,'#E0B77E');}
    ell(px-11,py+3,3.5,1.8,'#7A5236');ell(px-11,py+2.2,3.2,1.5,'#D9B07A');}
  else if(kind==='planks'){for(let k=0;k<4;k++){pq(sx,sy,[[at[0]-.1,at[1]-.04,k*1.6],[at[0]+.12,at[1]-.04,k*1.6],[at[0]+.12,at[1]+.04,k*1.6],[at[0]-.1,at[1]+.04,k*1.6]],k%2?'#D4AE78':'#C49A62');}}
  else if(kind==='fishrack'){ctx.strokeStyle='#5A3B24';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px-7,py);ctx.lineTo(px-7,py-9);ctx.moveTo(px+7,py+1);ctx.lineTo(px+7,py-8);ctx.moveTo(px-7,py-8.5);ctx.lineTo(px+7,py-7.5);ctx.stroke();for(let k=-5;k<=5;k+=3.3)ell(px+k,py-5,1,2.6,'#8DA9B2');}
  else if(kind==='bricks'){for(const[dx,dy]of[[-5,0],[3,2],[-1,-3]]){ctx.fillStyle='#A85E40';ctx.fillRect(px+dx-3,py+dy-4,6,4);ctx.fillStyle='#C07756';ctx.fillRect(px+dx-3,py+dy-5.2,6,1.6);}}
  else if(kind==='barrels'){for(const[dx,dy]of[[-4,0],[3,1.5],[-.5,-2.2]]){const x=px+dx,y=py+dy;ctx.fillStyle='#7A4E2C';ctx.beginPath();ctx.roundRect(x-2.6,y-6,5.2,6.5,1.6);ctx.fill();ctx.fillStyle='#5A3B24';ctx.fillRect(x-2.6,y-4.6,5.2,.8);ctx.fillRect(x-2.6,y-1.8,5.2,.8);ell(x,y-6,2.6,1,'#9C7048');}}
  else if(kind==='hides'){ctx.strokeStyle='#5A3B24';ctx.lineWidth=1;ctx.strokeRect(px-6,py-11,10,10);ctx.fillStyle='#B98454';ctx.beginPath();ctx.moveTo(px-5,py-10);ctx.quadraticCurveTo(px-1,py-12,px+3,py-10);ctx.quadraticCurveTo(px+2,py-6,px+3,py-2);ctx.quadraticCurveTo(px-1,py-3,px-5,py-2);ctx.quadraticCurveTo(px-4,py-6,px-5,py-10);ctx.fill();}
  else if(kind==='anvil'){ctx.fillStyle='#3B3532';ctx.fillRect(px-2,py-4,4,4);ctx.beginPath();ctx.moveTo(px-6,py-4);ctx.lineTo(px+5,py-4);ctx.lineTo(px+7,py-6.5);ctx.lineTo(px-6,py-6.5);ctx.fill();ell(px+9,py-1,3.5,1.8,'#E07B39');}
  else if(kind==='cloth'){ctx.strokeStyle='#5A3B24';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px-9,py+1);ctx.lineTo(px-9,py-11);ctx.moveTo(px+9,py-2);ctx.lineTo(px+9,py-13);ctx.moveTo(px-9,py-10.5);ctx.lineTo(px+9,py-12.5);ctx.stroke();ctx.fillStyle='#9A3224';ctx.fillRect(px-7,py-10.6,5,6);ctx.fillStyle='#3F5E6B';ctx.fillRect(px-1,py-11.4,4.5,7);ctx.fillStyle='#E7DFC8';ctx.fillRect(px+4.5,py-12,3.5,5);}
  else if(kind==='crates'){for(const[dx,dy,z]of[[-4,0,0],[3,2,0],[-1,0,5]]){walls(sx,sy,.06,.06,5,'#B58A5A','wood',z,at[0]+dx/40,at[1]+dy/40);pq(sx,sy,[[at[0]-.06+dx/40,at[1]-.06+dy/40,z+5],[at[0]+.06+dx/40,at[1]-.06+dy/40,z+5],[at[0]+.06+dx/40,at[1]+.06+dy/40,z+5],[at[0]-.06+dx/40,at[1]+.06+dy/40,z+5]],'#CFA676');}}
}
const PROPAT={x:[-.12,.4],y:[.4,-.1]};
/* Bäume als Sprites, im Wind leicht geneigt */
const TREES={};
/* Bäume eines Feldes: wenige Varianten je Gebiet, jede als ein fertiges Bild */
function treesOf(i){
  const id=REG[S.tiles[i].r].id,g=id==='taiga'?'t':id==='heide'||id==='moor'?'h':'n',v=g+((Math.imul(i+S.seed,2654435761)>>>0)%7);
  if(TREES[v])return TREES[v];const r=rng(S.seed+v.charCodeAt(0)*31+(+v.slice(1))*7919),a=[];
  const n=(g==='t'?4:3)+Math.floor(r()*3);
  for(let k=0;k<n;k++){const q=r();a.push({x:r()*.7-.35,y:r()*.7-.35,s:.65+r()*.4,k:g==='t'?(q<.85?'schnee':'tanne'):g==='h'?(q<.7?'birke':'tanne'):(q<.22?'birke':'tanne')});}
  a.sort((p,q)=>(p.x+p.y)-(q.x+q.y));a.key=v;return TREES[v]=a;
}
function treeSprite(kind,s){
  return spr('t'+kind+Math.round(s*10),30,44,15,38,()=>{
    if(kind==='tanne'||kind==='schnee'){
      const sn=kind==='schnee';
      ell(3,0,8*s,3*s,SHADOW);
      ctx.fillStyle='#5B4632';ctx.fillRect(-1.2*s,-4*s,2.4*s,5*s);
      for(let k=0;k<3;k++){const y=-3*s-k*7*s,w=(8-k*2)*s,hh=12*s;
        ctx.beginPath();ctx.moveTo(-w,y);ctx.lineTo(0,y-hh);ctx.lineTo(0,y+1.5*s);ctx.closePath();ctx.fillStyle=k?'#56784C':'#4E6F46';ctx.fill();
        ctx.beginPath();ctx.moveTo(w,y);ctx.lineTo(0,y-hh);ctx.lineTo(0,y+1.5*s);ctx.closePath();ctx.fillStyle=k?'#3D5B3A':'#38533A';ctx.fill();
        if(sn){ctx.fillStyle='#F4F6F3';ctx.beginPath();ctx.moveTo(-w*.45,y-hh*.55);ctx.lineTo(0,y-hh);ctx.lineTo(w*.45,y-hh*.55);ctx.lineTo(w*.2,y-hh*.48);ctx.lineTo(0,y-hh*.58);ctx.lineTo(-w*.25,y-hh*.46);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(244,246,243,.85)';ctx.fillRect(-w*.9,y-1*s,w*.7,1.2*s);}}
    } else {
      ell(3,0,7*s,2.6*s,SHADOW);
      ctx.fillStyle='#ECE8DE';ctx.fillRect(-1*s,-12*s,2*s,12.5*s);ctx.fillStyle='#3B3532';ctx.fillRect(-1*s,-8*s,1.2*s,.8*s);ctx.fillRect(0,-4*s,1*s,.8*s);
      ell(0,-16*s,7*s,8*s,'#8CAA5C');ell(2*s,-14*s,5.5*s,6*s,'#6F8F48');ell(-2.5*s,-18.5*s,3.5*s,3.5*s,'#A9C276');
    }
  });
}
function peakSprite(v){
  return spr('peak'+v,80,96,40,82,()=>{
    const h=44+v*9,w=30+v*3,sk=v%2?4:-5;
    ell(10,4,w*.9,10,SHADOW);
    ctx.fillStyle='#A3A59D';ctx.beginPath();ctx.moveTo(-w,6);ctx.lineTo(sk,-h);ctx.lineTo(sk+2,8+TH/4);ctx.closePath();ctx.fill();
    ctx.fillStyle='#6F716B';ctx.beginPath();ctx.moveTo(sk,-h);ctx.lineTo(w,4);ctx.lineTo(sk+2,8+TH/4);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.moveTo(-w*.6,0);ctx.lineTo(sk,-h);ctx.lineTo(-w*.1,-h*.3);ctx.closePath();ctx.fill();
    const sh=h*.32;ctx.fillStyle='#F4F5F2';ctx.beginPath();ctx.moveTo(sk,-h);ctx.lineTo(sk-w*sh/h*1.05,-h+sh);ctx.lineTo(sk-w*.12,-h+sh*.7);ctx.lineTo(sk-w*.02,-h+sh*1.05);ctx.lineTo(sk+w*.1,-h+sh*.75);ctx.lineTo(sk+w*sh/h*.95,-h+sh);ctx.closePath();ctx.fill();
    ctx.fillStyle='#D5DBDD';ctx.beginPath();ctx.moveTo(sk,-h);ctx.lineTo(sk+w*sh/h*.95,-h+sh);ctx.lineTo(sk+w*.1,-h+sh*.75);ctx.lineTo(sk+1,-h+sh*.9);ctx.closePath();ctx.fill();
    ctx.fillStyle='#8E918A';ctx.beginPath();ctx.moveTo(w*.3,5);ctx.lineTo(w*.62,-h*.38);ctx.lineTo(w*1.05,6);ctx.closePath();ctx.fill();ctx.fillStyle='#5E605B';ctx.beginPath();ctx.moveTo(w*.62,-h*.38);ctx.lineTo(w*1.05,6);ctx.lineTo(w*.75,7);ctx.closePath();ctx.fill();
  });
}
function drawPeak(i,sx,sy,open){if(!open)ctx.globalAlpha=.78;ctx.drawImage(peakSprite(i%3),sx-40,sy-82,80,96);ctx.globalAlpha=1;}
function drawScaffold(sx,sy,b){
  const st=B[b.type].st,n=fpOf(b.type),o=st.s==='house'?houseOf(st,b.lvl,n,rotOf(b)):{ex:.32*n,ey:.32*n},ex=Math.min(.5*n-.08,o.ex+.05),ey=Math.min(.5*n-.08,o.ey+.05),h=Math.max(14,topH(b)*.85),col='#8A6440';
  for(const[u,v]of[[-ex,ey],[ex,ey],[ex,-ey]])pl(sx,sy,[u,v,0],[u,v,h],col,1.3);
  for(const z of[h*.35,h*.7,h]){pl(sx,sy,[-ex,ey,z],[ex,ey,z],'#A88050',1.6);pl(sx,sy,[ex,ey,z],[ex,-ey,z],'#7A5636',1.6);}
  pl(sx,sy,[-ex,ey,0],[ex,ey,h*.7],'rgba(122,86,54,.7)',.8);
}
function drawTimer(sx,sy,b,until,total){
  const rem=(until-now())/1000,fr=Math.max(0,Math.min(1,1-rem/total)),txt=fmtDur(rem);
  ctx.font='700 8.5px Work Sans, sans-serif';const tw=ctx.measureText(txt).width,w=tw+22,x=sx-w/2,y=sy-12;
  ctx.fillStyle='rgba(34,52,58,.88)';ctx.beginPath();ctx.roundRect(x,y,w,13,6.5);ctx.fill();
  ctx.drawImage(iconC('uhr'),x+3,y+1.5,10,10);
  ctx.fillStyle='#FFF8E6';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(txt,x+15,y+7);
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.roundRect(x+3,y+15,w-6,3,1.5);ctx.fill();
  ctx.fillStyle='#E7B54C';ctx.beginPath();ctx.roundRect(x+3,y+15,Math.max(3,(w-6)*fr),3,1.5);ctx.fill();
}
function drawBuilder(sx,sy,k,n){
  n=n||1;const[x,y]=spt(sx,sy,.42*n,.15*n,0),sw=Math.sin(T0/140+k)*.9;figAt(x,y);
  ell(x,y,3.6,1.6,SHADOW);ctx.strokeStyle='#3B3532';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-1,y-5);ctx.lineTo(x-1.2,y);ctx.moveTo(x+1,y-5);ctx.lineTo(x+1.2,y);ctx.stroke();
  ctx.fillStyle='#5C7246';ctx.beginPath();ctx.roundRect(x-3,y-12,6,7.5,2);ctx.fill();ell(x,y-14.3,2.6,2.6,'#F0C9A8');ctx.fillStyle='#E7B54C';ctx.beginPath();ctx.ellipse(x,y-16,3.4,1.6,0,Math.PI,0);ctx.fill();
  ctx.save();ctx.translate(x-2.5,y-10);ctx.rotate(-1.1+sw);ctx.fillStyle='#7A4E2C';ctx.fillRect(-.6,-8,1.2,8);ctx.fillStyle='#8C979C';ctx.fillRect(-2.2,-9.5,4.4,2.4);ctx.restore();
  if(sw>.75){ell(x-9,y-12,1.2,1.2,'#F4C04E');ell(x-11,y-10,.9,.9,'#F4C04E');}
  ctx.restore();
}
let RCENT=null;
function regionCenters(){const acc=REG.map(()=>[0,0,0]);S.tiles.forEach((T,i)=>{if(T.t==='water')return;const a=acc[T.r];a[0]+=i%N;a[1]+=(i/N)|0;a[2]++;});
  return acc.map((a,r)=>{if(!a[2])return null;let best=-1,bd=1e9;const mx=a[0]/a[2],my=a[1]/a[2];S.tiles.forEach((T,i)=>{if(T.r!==r||T.t==='water'||T.t==='berg'||T.t==='forest')return;const d=Math.hypot(i%N-mx,((i/N)|0)-my);if(d<bd){bd=d;best=i;}});return best;});}
function drawSign(i,r){
  const[sx,sy]=tilePos(i%N,(i/N)|0),R=REG[r],ex=S.explore&&S.explore.r===r;
  ell(sx+3,sy+1,6,2,SHADOW);ctx.fillStyle='#5A3B24';ctx.fillRect(sx-1,sy-26,2,26);
  ctx.fillStyle='#A07A4E';ctx.beginPath();ctx.roundRect(sx-15,sy-38,30,16,3);ctx.fill();ctx.fillStyle='#8A6440';ctx.fillRect(sx-15,sy-26,30,3);
  ctx.drawImage(iconC(R.ic),sx-12,sy-37,13,13);ctx.drawImage(iconC(ex?'uhr':'schloss'),sx+1,sy-36,11,11);
  if(ex){drawTimer(sx,sy-40,null,S.explore.until,R.t);const f=Math.sin(T0/300);ctx.fillStyle='#3B3532';ctx.fillRect(sx+12,sy-20,1,20);ctx.fillStyle='#B03A2A';ctx.beginPath();ctx.moveTo(sx+13,sy-20);ctx.lineTo(sx+21+f,sy-17);ctx.lineTo(sx+13,sy-14);ctx.fill();}
}
function drawTrees(i,sx,sy,open,far){
  const ts=treesOf(i);if(!open)ctx.globalAlpha=.75;
  const t=trimmed('f'+S.seed+ts.key,84,76,42,56,()=>{for(const q of ts){const[x,y]=spt(0,0,q.x,q.y,0);ctx.drawImage(treeSprite(q.k,q.s),x-15,y-38,30,44);}});
  if(far)ctx.drawImage(t.c,sx+t.x,sy+t.y,t.w,t.h);
  else{const sw=Math.sin(T0/900+i*1.7)*.03;ctx.save();ctx.translate(sx,sy);ctx.transform(1,0,sw,1,0,0);ctx.drawImage(t.c,t.x,t.y,t.w,t.h);ctx.restore();}
  ctx.globalAlpha=1;
}
/* Sprite-Zwischenspeicher: statische Teile werden einmal pro Zoomstufe gezeichnet */
const SPR=new Map();let sprScale=0;
function spr(key,w,h,ax,ay,fn){
  const sc=Math.min(4.5,Math.pow(2,Math.ceil(Math.log2(dpr*view.z)*6-1e-6)/6));
  if(sc!==sprScale){SPR.clear();sprScale=sc;}
  let c=SPR.get(key);
  if(!c){c=document.createElement('canvas');c.width=Math.ceil(w*sc);c.height=Math.ceil(h*sc);const keep=ctx,kt=T0;ctx=c.getContext('2d');ctx.setTransform(sc,0,0,sc,ax*sc,ay*sc);ctx.lineJoin='round';ctx.lineCap='round';T0=0;fn();ctx=keep;T0=kt;SPR.set(key,c);}
  return c;
}
const SW=120,SH=150,SAX=60,SAY=118;
/* Bildgröße je Grundfläche: n Felder breit */
const SPRS=n=>{const w=SW+(n-1)*72,h=SH+(n-1)*70;return[w,h,w/2,h-32-(n-1)*16];};
/* Gebäudebilder auf ihren sichtbaren Inhalt zuschneiden: weniger Pixel pro Bild und Frame */
const TRIM=new Map();let trimScale=0;
function trimmed(key,w,h,ax,ay,fn){
  const c=spr(key,w,h,ax,ay,fn);
  if(trimScale!==sprScale){TRIM.clear();trimScale=sprScale;}
  let t=TRIM.get(key);
  if(!t){const k=w/c.width;t={c,x:-ax,y:-ay,w,h};try{const W2=c.width,H2=c.height,d=c.getContext('2d').getImageData(0,0,W2,H2).data;let x0=W2,y0=H2,x1=-1,y1=-1;
      for(let y=0;y<H2;y++)for(let x=0;x<W2;x++)if(d[(y*W2+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
      if(x1>=0){x0=Math.max(0,x0-1);y0=Math.max(0,y0-1);x1=Math.min(W2-1,x1+1);y1=Math.min(H2-1,y1+1);const cw=x1-x0+1,ch=y1-y0+1,n=document.createElement('canvas');n.width=cw;n.height=ch;n.getContext('2d').drawImage(c,x0,y0,cw,ch,0,0,cw,ch);
        t={c:n,x:x0*k-ax,y:y0*k-ay,w:cw*k,h:ch*k};SPR.set(key,n);}}catch(e){}
    TRIM.set(key,t);}
  return t;
}
function blitB(sx,sy,key,fn,n){const[w,h,ax,ay]=SPRS(n||1),t=trimmed(key,w,h,ax,ay,fn);ctx.drawImage(t.c,sx+t.x,sy+t.y,t.w,t.h);}
function topH(b){const st=B[b.type].st,lv=b.lvl,n=fpOf(b.type);
  if(st.s==='house'){const o=houseOf(st,lv,n);return o.h+o.rh+(b.type==='hof'?10:0);}
  return topH0(st,lv)*usOf(st,n);}
function topH0(st,lv){
  if(st.s==='tower')return st.h+lv*4+20;if(st.s==='temple')return 64;if(st.s==='mine')return st.h+6;
  return {well:18,market:20,kiln:16,hives:12,pit:8,wall:20}[st.s]||8;}
function drawB(sx,sy,b){
  const lit=night>.3?1:0;
  blitB(sx,sy,'b'+b.type+b.lvl+lit+'r'+rotOf(b),()=>bodyB(0,0,b,lit),fpOf(b.type));
  liveB(sx,sy,b);
}
/* Mehrfeldrige Gebäude: Häuser wachsen über ihre Maße, alles andere wird gleichmäßig um us vergrößert und in der Fläche um FK gestreckt */
const US={mine:1.4,field:1,pasture:1,kiln:1.5,hives:1.2,pit:1.3,market:1.6,temple:2};
function usOf(st,n){return n===1||st.s==='house'?1:(US[st.s]||Math.sqrt(n));}
function scaled(sx,sy,b,fn){
  const st=B[b.type].st,n=fpOf(b.type),us=usOf(st,n);
  if(n===1||st.s==='house')return fn(sx,sy,n);
  ctx.save();ctx.translate(sx,sy);ctx.scale(us,us);FK=n/us;try{fn(0,0,n);}finally{FK=1;ctx.restore();}
}
function bodyB(sx,sy,b,lit){scaled(sx,sy,b,(x,y,n)=>bodyB0(x,y,b,lit,n));}
function liveB(sx,sy,b){scaled(sx,sy,b,(x,y,n)=>liveB0(x,y,b,n));
  if(b.lvl>1){const n=fpOf(b.type),[bx,by]=spt(sx,sy,.5*n,.5*n,0);ctx.drawImage(badgeSprite(b.lvl),bx-10,by-12,20,12);}}
function bodyB0(sx,sy,b,lit,n){
  const st=B[b.type].st,lv=b.lvl,s=st.s;
  const rot=rotOf(b),odd=rot%2===1;
  if(s==='house'){
    const o=houseOf(st,lv,n,rot);
    if(st.prop&&st.prop!=='banner')prop(sx,sy,st.prop,PROPAT[o.ax].map(v=>v*n));
    shadowBox(sx,sy,o.ex,o.ey,o.h+o.rh*.6);
    const c=gable(sx,sy,o,lit);
    if(st.chim){chimney(sx,sy,c,roofTopAt(o,c)-2,st.mat==='stone'?'#8C8A84':'#7D7A72');if(st.chim>1)chimney(sx,sy,[c[0]-(o.ax==='x'?.3:0),c[1]+(o.ax==='y'?.3:0)],roofTopAt(o,[c[0]-(o.ax==='x'?.3:0),c[1]+(o.ax==='y'?.3:0)])-2,'#5E5450');}
    if(b.type==='hof'){ctx.fillStyle='#3B3532';const[x,y]=spt(sx,sy,-.38*n,.36*n,0);ctx.fillRect(x-.6,y-28,1.2,28);}
  } else if(s==='mine'){
    const f=st.f/2,h=st.h+(lv-1)*2;
    shadowBox(sx,sy,f,f,h);
    walls(sx,sy,f,f,h,st.body,'stone');
    pq(sx,sy,[[-f,-f,h],[f,-f,h],[f,f,h],[-f,f,h]],shade(st.body,.12));
    for(const[u,v,r]of[[-.1,-.08,4],[.12,.05,3],[0,.12,2.5]]){const[x,y]=spt(sx,sy,u,v,h);ell(x,y-1,r,r*.6,shade(st.body,-.12));ell(x-.6,y-1.6,r*.5,r*.3,shade(st.body,.25));}
    const M=(u,v,z)=>odd?[v,u,z]:[u,v,z];
    pq(sx,sy,[M(-.09,f,0),M(.09,f,0),M(.09,f,h*.62),M(0,f,h*.75),M(-.09,f,h*.62)],'#1E1C1A');
    pl(sx,sy,M(-.11,f,0),M(-.11,f,h*.66),'#7A5636',1.6);pl(sx,sy,M(.11,f,0),M(.11,f,h*.66),'#7A5636',1.6);pl(sx,sy,M(-.13,f,h*.68),M(.13,f,h*.68),'#8A5A32',1.8);
    const[cx,cy]=spt(sx,sy,...M(.32,.4,0));ctx.fillStyle='#5A3B24';ctx.beginPath();ctx.roundRect(cx-5,cy-6,10,5,1.5);ctx.fill();ell(cx-3,cy-.5,1.6,1.6,'#3B3532');ell(cx+3,cy-.5,1.6,1.6,'#3B3532');ell(cx,cy-6.5,4,1.6,b.type==='erzmine'?'#B0603A':'#A3A6A0');
  } else if(s==='field'){
    const fl=st.crop==='flachs',rows=4+lv;
    const M=(u,v)=>odd?[v,u]:[u,v];
    for(let k=1;k<rows;k++){const t=k/rows-.5;
      pl(sx,sy,[...M(t,-.46),0],[...M(t,.46),0],fl?'#6F8A4A':'#A88A36',1.6);
      for(let q=-.42;q<.44;q+=.07){const[x,y]=spt(sx,sy,...M(t,q),0);
        if(fl){ctx.fillStyle='#5E7E43';ctx.fillRect(x-.4,y-3,.8,3);ell(x,y-3.4,1.1,1.1,(Math.round(q*100)%3)?'#7C95D0':'#9BB0E0');}
        else{ctx.fillStyle='#C9A13E';ctx.fillRect(x-.5,y-4,1,4);ell(x+.2,y-4.5,1,1.8,'#E7C25A');}}}
    for(const[u,v]of[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]){const[x,y]=spt(sx,sy,u*.96,v*.96,0);ctx.fillStyle='#7A5636';ctx.fillRect(x-.6,y-4,1.2,4);}
  } else if(s==='pasture'){
    const P=[[-.46,-.46],[.46,-.46],[.46,.46],[-.46,.46]];
    for(let k=0;k<4;k++){const a=P[k],c2=P[(k+1)%4];
      for(let q=0;q<4;q++){const u=a[0]+(c2[0]-a[0])*q/4,v=a[1]+(c2[1]-a[1])*q/4;const[x,y]=spt(sx,sy,u,v,0);ctx.fillStyle='#6E4A2E';ctx.fillRect(x-.7,y-6,1.4,6);}
      pl(sx,sy,[a[0],a[1],4.5],[c2[0],c2[1],4.5],'#8A6440',1);pl(sx,sy,[a[0],a[1],2.2],[c2[0],c2[1],2.2],'#8A6440',1);}
    shadowBox(sx,sy,.1,.08,8,-.28,-.28);walls(sx,sy,.1,.08,6,'#8A6440','wood',0,-.28,-.28);
    pq(sx,sy,[[-.4,-.38,6],[-.16,-.38,6],[-.16,-.2,9],[-.4,-.2,9]],'#6E4A2E');
    const[tx,ty]=spt(sx,sy,.25,-.3,0);ctx.fillStyle='#7A5636';ctx.fillRect(tx-5,ty-2.5,10,2.5);ctx.fillStyle='#8DA9B2';ctx.fillRect(tx-4,ty-2.6,8,1);
  } else if(s==='dock'){
    for(const[u,v]of[[-.3,.1],[-.3,.45],[.3,.1],[.3,.45],[0,.62],[0,-.2]]){const[x,y]=spt(sx,sy,u*.7,v*.7,0);ctx.fillStyle='#4A3222';ctx.fillRect(x-1,y-2,2,6);}
    pq(sx,sy,[[-.24,-.3,2],[.24,-.3,2],[.24,.5,2],[-.24,.5,2]],'#A38158');
    for(let q=-.26;q<.5;q+=.085)pl(sx,sy,[-.24,q,2],[.24,q,2],'rgba(70,46,26,.45)',.6);
    pq(sx,sy,[[.24,-.3,2],[.24,.5,2],[.24,.5,0],[.24,-.3,0]],'#6E5236');
    const[bx,by]=spt(sx,sy,-.12,-.18,2);ctx.fillStyle='#5A3B24';ctx.fillRect(bx-4,by-4,8,4);ell(bx,by-4.2,4,1.5,'#7A5636');
  } else if(s==='wall'){
    const n=7,h=13+lv*2;
    if(odd)shadowBox(sx,sy,.06,.42,h*.6);else shadowBox(sx,sy,.42,.06,h*.6);
    for(let k=0;k<n;k++){const u=-.42+k*.84/(n-1),[x,y]=odd?spt(sx,sy,0,u,0):spt(sx,sy,u,0,0);
      ctx.fillStyle=k%2?'#7A5C3A':'#8F6C46';ctx.beginPath();ctx.moveTo(x-2.6,y+1);ctx.lineTo(x-2.6,y-h);ctx.lineTo(x,y-h-4);ctx.lineTo(x,y+1.5);ctx.fill();
      ctx.fillStyle=k%2?'#5E452B':'#6E5236';ctx.beginPath();ctx.moveTo(x,y+1.5);ctx.lineTo(x,y-h-4);ctx.lineTo(x+2.6,y-h);ctx.lineTo(x+2.6,y+1);ctx.fill();}
    if(odd)pl(sx,sy,[.02,-.45,h*.45],[.02,.45,h*.45],'#5A3B24',1.4);else pl(sx,sy,[-.45,.02,h*.45],[.45,.02,h*.45],'#5A3B24',1.4);
  } else if(s==='tower'){
    const f=st.f/2,h=st.h+(lv-1)*4;
    shadowBox(sx,sy,f,f,h+10);
    walls(sx,sy,f,f,h,st.body,b.type==='turm'?'stone':'wood');
    win(sx,sy,'y',0,f,f,h*.55,h*.55+4,lit);win(sx,sy,'x',0,f,f,h*.75,h*.75+3,lit);
    const g=f+.06;
    pq(sx,sy,[[-g,g,h],[g,g,h],[g,g,h+2],[-g,g,h+2]],shade(st.body,-.2));pq(sx,sy,[[g,g,h],[g,-g,h],[g,-g,h+2],[g,g,h+2]],shade(st.body,-.4));
    const[tx,ty]=spt(sx,sy,0,0,h+16);const[l]=spt(sx,sy,-g,g,h+2),[m,my]=spt(sx,sy,g,g,h+2),[r]=spt(sx,sy,g,-g,h+2);
    ctx.fillStyle=st.roof;ctx.beginPath();ctx.moveTo(l,spt(sx,sy,-g,g,h+2)[1]);ctx.lineTo(m,my);ctx.lineTo(tx,ty);ctx.fill();
    ctx.fillStyle=shade(st.roof,-.3);ctx.beginPath();ctx.moveTo(m,my);ctx.lineTo(r,spt(sx,sy,g,-g,h+2)[1]);ctx.lineTo(tx,ty);ctx.fill();
  } else if(s==='pit'){
    pq(sx,sy,[[-.36,-.3,0],[.3,-.36,0],[.38,.26,0],[-.28,.36,0]],'#8E5E3E');
    pq(sx,sy,[[-.3,-.24,-3],[.24,-.3,-3],[.32,.2,-3],[-.22,.3,-3]],'#6E4630');
    pq(sx,sy,[[-.36,-.3,0],[.3,-.36,0],[.24,-.3,-3],[-.3,-.24,-3]],'#5A3828');
    ell(...spt(sx,sy,-.05,0,-3),6,2.5,'rgba(120,150,150,.5)');
    for(const[u,v]of[[.38,.4],[.28,.48]]){const[x,y]=spt(sx,sy,u,v,0);ell(x,y-2,5,3,'#B07A55');ell(x-1,y-3,2.5,1.4,'#C99470');}
    const[x,y]=spt(sx,sy,-.4,.38,0);ctx.strokeStyle='#5A3B24';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4,y-12);ctx.stroke();ctx.fillStyle='#8C979C';ctx.fillRect(x-1.5,y-1,3.5,3.5);
  } else if(s==='hives'){
    const[bx,by]=spt(sx,sy,0,.18,0);ctx.fillStyle='#6E4A2E';ctx.fillRect(bx-16,by-4,32,2);ctx.fillRect(bx-14,by-2,2,4);ctx.fillRect(bx+12,by-2,2,4);
    for(const[u,v]of[[-.22,.1],[0,.2],[.22,.3],[-.05,-.15],[.2,-.05]].slice(0,2+lv)){const[x,y]=spt(sx,sy,u,v,0);
      ell(x+3,y+1,6,2.2,SHADOW);
      for(let k=0;k<4;k++){ell(x,y-2-k*2.6,6-k*1.1,2.6,k%2?'#C9A060':'#D9B270');}
      ell(x-1.5,y-9,1.5,1,'rgba(255,255,255,.45)');ell(x,y-2,1.6,1.4,'#3B3532');}
    for(const[u,v]of[[.36,-.36],[-.38,.36]]){const[x,y]=spt(sx,sy,u,v,0);for(let k=0;k<5;k++)ell(x+Math.cos(k)*3,y-2+Math.sin(k*2)*1.5,1.2,1.2,k%2?'#F4F0E6':'#E7C25A');}
  } else if(s==='kiln'){
    const[x,y]=spt(sx,sy,0,0,0),r=14+lv;
    ell(x+5,y+2,r+2,r*.5,SHADOW);
    ctx.fillStyle='#4E4038';ctx.beginPath();ctx.ellipse(x,y,r,r*.5,0,Math.PI,0,true);ctx.fill();
    ctx.fillStyle='#5E4E44';ctx.beginPath();ctx.ellipse(x,y,r,r*.95,0,Math.PI,TAU);ctx.fill();
    ctx.fillStyle='#4A3C34';ctx.beginPath();ctx.ellipse(x+r*.3,y-r*.2,r*.7,r*.7,0,-1.2,.2);ctx.lineTo(x+r*.3,y-r*.2);ctx.fill();
    for(let k=0;k<6;k++){ell(x-r*.6+k*r*.24,y-r*.5+Math.sin(k)*2,1.6,1,'#3B3532');}
    ell(x,y-r*.92,3,1.4,'#2A2624');
    for(let k=0;k<3;k++){const[lx,ly]=spt(sx,sy,-.38,.25+k*.06,0);ctx.fillStyle='#8B5E34';ctx.beginPath();ctx.roundRect(lx-5,ly-2.4-k*.4,10,4,1.5);ctx.fill();ell(lx+5,ly-.4-k*.4,1.6,2,'#E0B77E');}
  } else if(s==='well'){
    const[x,y]=spt(sx,sy,0,0,0),r=9;
    ell(x+4,y+2,r+3,r*.45,SHADOW);
    ctx.fillStyle='#8C8F88';ctx.fillRect(x-r,y-8,2*r,8);ell(x,y,r,r*.5,'#8C8F88');
    ctx.fillStyle='#A7A89E';ctx.fillRect(x-r,y-8,r*.9,8);
    ctx.fillStyle='rgba(0,0,0,.15)';for(let k=0;k<3;k++)ctx.fillRect(x-r,y-6+k*2.6,2*r,.6);
    ell(x,y-8,r,r*.5,'#B5B8B0');ell(x,y-8,r-2.2,(r-2.2)*.5,'#2F4650');ell(x-1.5,y-8.6,2.5,.8,'rgba(255,255,255,.35)');
    ctx.fillStyle='#5A3B24';ctx.fillRect(x-r+1,y-24,1.8,17);ctx.fillRect(x+r-2.8,y-24,1.8,17);
    ctx.fillStyle='#9A3224';ctx.beginPath();ctx.moveTo(x-r-3,y-21);ctx.lineTo(x,y-30);ctx.lineTo(x+r+3,y-21);ctx.lineTo(x,y-25);ctx.closePath();ctx.fill();
    ctx.fillStyle='#7A2418';ctx.beginPath();ctx.moveTo(x,y-30);ctx.lineTo(x+r+3,y-21);ctx.lineTo(x,y-25);ctx.fill();
    ctx.strokeStyle='#3B3532';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,y-22);ctx.lineTo(x,y-14);ctx.stroke();ctx.fillStyle='#7A5636';ctx.fillRect(x-1.6,y-14,3.2,3);
  } else if(s==='market'){
    for(let q=0;q<10;q++){const u=((q*.37)%1)-.5,v=((q*.61)%1)-.5;const[x,y]=spt(sx,sy,u*.8,v*.8,0);ell(x,y,3,1.4,'rgba(120,110,95,.25)');}
    const stall=(cx,cy,c1)=>{shadowBox(sx,sy,.14,.1,10,cx,cy);
      walls(sx,sy,.14,.1,5,'#8A6440','wood',0,cx,cy);pq(sx,sy,[[cx-.14,cy-.1,5],[cx+.14,cy-.1,5],[cx+.14,cy+.1,5],[cx-.14,cy+.1,5]],'#B58A5A');
      for(const[u,v]of[[-.1,.06],[0,.04],[.09,.06]]){const[x,y]=spt(sx,sy,cx+u,cy+v,5);ell(x,y-1,1.8,1.2,pick2(u));}
      for(const[u,v]of[[-.15,.11],[.15,.11],[.15,-.11]])pl(sx,sy,[cx+u,cy+v,0],[cx+u,cy+v,13],'#5A3B24',1);
      for(let k=0;k<4;k++){const u0=-.17+k*.085;pq(sx,sy,[[cx+u0,cy-.13,15],[cx+u0+.085,cy-.13,15],[cx+u0+.085,cy+.17,11],[cx+u0,cy+.17,11]],k%2?'#F1E9DA':c1);}};
    const pick2=u=>u<-.05?'#E7B54C':u<.05?'#B03A2A':'#7FA6B2';
    stall(-.2,-.15,'#9A3224');stall(.18,.16,'#3F5E6B');
  } else if(s==='temple'){
    const o={ex:.24,ey:.24,h:12,rh:14,ax:'y',wall:'#5A3B24',roof:'#3E3A36',mat:'wood'};
    shadowBox(sx,sy,.26,.26,40);
    gable(sx,sy,o,lit);
    const o2={ex:.15,ey:.15,h:9,rh:13,ax:'x',wall:'#4A3222',roof:'#2F2B28',mat:'wood',z:16};
    gable(sx,sy,o2,lit);
    const[x,y]=spt(sx,sy,0,0,16+9+13);ctx.fillStyle='#2F2B28';ctx.beginPath();ctx.moveTo(x-3,y+2);ctx.lineTo(x,y-14);ctx.lineTo(x+3,y+2);ctx.fill();ctx.fillStyle='#C4862A';ell(x,y-14,1.4,1.4,'#C4862A');
    for(const sgn of[-1,1]){const[dx,dy]=spt(sx,sy,sgn*.21,.24,26);ctx.strokeStyle='#2F2B28';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(dx,dy);ctx.quadraticCurveTo(dx+sgn*4,dy-5,dx+sgn*6,dy-3);ctx.stroke();}
  }
}
/* Lebendige Teile: Rauch, Flaggen, Tiere, Bienen, Boot */
function liveB0(sx,sy,b,n){
  const st=B[b.type].st,lv=b.lvl,s=st.s,tt=T0/1000;
  const smoke=(x,y,n,col)=>{const c=puffSprite(col?1:0);for(let k=0;k<n;k++){const p=(tt*.45+k/n)%1,r=2.2+p*4.5;ctx.globalAlpha=.55*(1-p);ctx.drawImage(c,x+p*7+Math.sin(tt+k)*1.5-r,y-p*24-r,r*2,r*2);}ctx.globalAlpha=1;};
  if(s==='house'){
    const o=houseOf(st,lv,n,rotOf(b));
    if(st.chim&&(b.run||B[b.type].kind==='home'||B[b.type].kind==='joy')){const c=o.ax==='x'?[o.ex*.45,-.02]:[.02,-o.ey*.45];const[x,y]=spt(sx,sy,c[0],c[1],roofTopAt(o,c)+6);smoke(x,y,b.run?3:2);}
    else if(b.run&&!st.chim){const[x,y]=spt(sx,sy,0,0,o.h+o.rh);smoke(x,y,2);}
    if(b.type==='hof'){const[x,y]=spt(sx,sy,-.38*n,.36*n,0),w=Math.sin(tt*3);ctx.fillStyle='#B03A2A';ctx.beginPath();ctx.moveTo(x+.6,y-28);ctx.quadraticCurveTo(x+6,y-27+w,x+11,y-26+w*1.5);ctx.lineTo(x+11,y-19+w*1.5);ctx.quadraticCurveTo(x+6,y-20+w,x+.6,y-21);ctx.fill();ctx.fillStyle='#F1E9DA';ctx.fillRect(x+4,y-26+w*.8,2,6);}
  } else if(s==='tower'){
    const h=st.h+(lv-1)*4,[x,y]=spt(sx,sy,0,0,h+16);ctx.fillStyle='#3B3532';ctx.fillRect(x-.6,y-11,1.2,11);
    const w=Math.sin(T0/300)*1.5;ctx.fillStyle='#B03A2A';ctx.beginPath();ctx.moveTo(x+.6,y-11);ctx.lineTo(x+9+w,y-8.5);ctx.lineTo(x+.6,y-6);ctx.fill();
  } else if(s==='pasture'){
    const n=1+Math.min(3,lv),cow=st.animal!=='schaf',ox=st.animal==='ochse';
    for(let k=0;k<n;k++){const u=Math.sin(tt*.25+k*2.1)*.22+(k%2?.1:-.05),v=Math.cos(tt*.2+k*1.3)*.18+(k-1.5)*.08;const[x,y]=spt(sx,sy,u,v,0);const fl=Math.cos(tt*.25+k*2.1)>0?1:-1;
      ell(x+1,y+.5,cow?5.5:4,1.6,SHADOW);
      if(cow){ctx.fillStyle='#3B3532';ctx.fillRect(x-3.5,y-3,1,3);ctx.fillRect(x+2.5,y-3,1,3);ell(x,y-4.5,5.2,3.2,ox?'#8A5A32':'#F1ECE0');if(!ox)ell(x-1.5*fl,y-5,2,1.8,'#3B3532');ell(x+5*fl,y-5.5,2,1.7,ox?'#6E4426':'#8A5A32');if(ox){ctx.fillStyle='#EDE6D6';ctx.fillRect(x+4.4*fl-.4,y-8.4,.8,2);ctx.fillRect(x+5.8*fl-.4,y-8.4,.8,2);}}
      else{ell(x,y-3.4,4.5,3,'#F4F0E6');ell(x-1,y-4.4,2.5,1.4,'#FFFFFF');ell(x+4*fl,y-4,1.8,1.6,'#2E2A27');}}
  } else if(s==='dock'){
    const bob=Math.sin(T0/700)*1.2,[x,y]=spt(sx,sy,.5,.1,0);
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(x,y+3+bob*.3,10,2,0,0,TAU);ctx.fill();
    ctx.fillStyle='#6E4A2E';ctx.beginPath();ctx.moveTo(x-10,y-1+bob);ctx.quadraticCurveTo(x,y+5+bob,x+10,y-1+bob);ctx.closePath();ctx.fill();
    ctx.fillStyle='#8A5A32';ctx.fillRect(x-8,y-2+bob,16,1.4);
  } else if(s==='hives'){
    for(let k=0;k<5+lv*2;k++){const a=tt*2.2+k*1.9,r=10+Math.sin(tt*1.3+k)*5;const[x,y]=spt(sx,sy,0,.05,10);ell(x+Math.cos(a)*r,y+Math.sin(a*1.3)*r*.45,1,1,'#3B3532');}
  } else if(s==='kiln'){
    if(b.run){const[x,y]=spt(sx,sy,0,0,0);smoke(x,y-15-lv,3,'120,115,110');}
  }
}
/* kleine, oft gezeichnete Teile als fertige Bilder */
function puffSprite(v){return spr('puff'+v,16,16,8,8,()=>{ctx.fillStyle=v?'rgb(120,115,110)':'rgb(235,232,226)';ctx.beginPath();ctx.arc(0,0,8,0,TAU);ctx.fill();});}
function badgeSprite(lv){return spr('lvb'+lv,20,12,10,6,()=>{ctx.fillStyle='rgba(34,52,58,.88)';ctx.beginPath();ctx.roundRect(-9,-4.5,18,9,4.5);ctx.fill();ctx.fillStyle='#E7B54C';ctx.beginPath();ctx.moveTo(-4.5,-3);ctx.lineTo(-1.5,0);ctx.lineTo(-4.5,3);ctx.lineTo(-7.5,0);ctx.closePath();ctx.fill();
    ctx.font='800 7.5px Work Sans, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#FFF8E6';ctx.fillText(lv,3,.4);});}

