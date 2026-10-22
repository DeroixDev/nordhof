
/* ---------- Eigene Gebäudeformen ---------- */
/* Jede Gebäudeart hat ihre eigene Silhouette und ihr Zeichen (Sägegatter, Backofen, Esse, Webstuhl …). Die Bauweise wächst mit der Stufe:
   Holz (1–2) → Fachwerk (3–4) → Stein (5–6) → Halle (7–8). Gezeichnet wird in einer lokalen Ebene: die Tür zeigt nach +v, +u ist die sichtbare
   Seitenwand. rot 1/3 spiegelt an der Diagonale (u↔v), rot 2/3 versteckt die Tür hinten. Licht hängt an den Weltflächen (+y hell, +x dunkel). */
let RM=0,RB=0;
const TIER=lv=>lv<=2?0:lv<=4?1:lv<=6?2:3;
const MW=(u,v,z)=>RM?[v,u,z]:[u,v,z];
function lq(sx,sy,L,f){pq(sx,sy,RM?L.map(p=>[p[1],p[0],p[2]]):L,f);}
function ll(sx,sy,a,b,c,w){pl(sx,sy,MW(...a),MW(...b),c,w);}
function lp(sx,sy,u,v,z){return RM?spt(sx,sy,v,u,z):spt(sx,sy,u,v,z);}
function W4(cu,cv,eu,ev){return RM?[cv,cu,ev,eu]:[cu,cv,eu,ev];}
const WF=lf=>(lf==='v')!==!!RM?'y':'x';
const SG=()=>RM?-1:1;
const CM={wood:'#9C7048',plas:'#EAE0CC',beam:'#5A3B24',beamD:'#3E2A1A',stone:'#B7B0A3',hall:'#5E4230',plinth:'#8C8A84',gold:'#D9A43A',thatch:'#B99A5C',turf:'#8BA65F',post:'#6E4A2E'};
/* Dach je Bauweise: Holz = Stroh oder Grassoden, Fachwerk = Schindeln, Stein = Ziegel, Halle = Schiefer mit Goldfirst */
const RF=(t,col,turf)=>t===0?{rc:turf?CM.turf:CM.thatch,rp:turf?'turf':'thatch'}:t===1?{rc:col,rp:'shingle'}:t===2?{rc:col,rp:'tile'}:{rc:shade(col,-.18),rp:'slate'};
const GWALL=(t,col)=>t===0?(col||CM.wood):t===1?CM.plas:t===2?CM.stone:CM.hall;
/* Wände je Bauweise (Weltmaße) */
function fachwerk(sx,sy,cx,cy,ex,ey,h,z){
  const t=z+h,m=z+h*.5;
  const face=(a0,a1,P,col)=>{const n=Math.max(2,Math.round((a1-a0)/.17)),d=(a1-a0)/n;
    for(let k=0;k<=n;k++)pl(sx,sy,P(a0+k*d,z),P(a0+k*d,t),col,k===0||k===n?1.6:1.1);
    for(const q of[z+.7,m,t-.6])pl(sx,sy,P(a0,q),P(a1,q),col,1.1);
    for(let k=0;k<n;k++)pl(sx,sy,P(a0+k*d,k%2?m:z+.7),P(a0+(k+1)*d,k%2?z+.7:m),col,.9);};
  face(cx-ex,cx+ex,(a,q)=>[a,cy+ey,q],CM.beam);face(cy-ey,cy+ey,(a,q)=>[cx+ex,a,q],CM.beamD);
}
function wallsT(sx,sy,cu,cv,eu,ev,h,t,col,z){
  z=z||0;const[cx,cy,ex,ey]=W4(cu,cv,eu,ev);
  if(t===0)walls(sx,sy,ex,ey,h,col||CM.wood,'wood',z,cx,cy);
  else if(t===1){walls(sx,sy,ex,ey,h,CM.plas,'',z,cx,cy);fachwerk(sx,sy,cx,cy,ex,ey,h,z);}
  else if(t===2)walls(sx,sy,ex,ey,h,CM.stone,'stone',z,cx,cy);
  else{const p=Math.min(4.5,h*.4);walls(sx,sy,ex,ey,p,CM.plinth,'stone',z,cx,cy);walls(sx,sy,ex,ey,h-p,CM.hall,'wood',z+p,cx,cy);
    pl(sx,sy,[cx-ex,cy+ey,z+h-1.3],[cx+ex,cy+ey,z+h-1.3],CM.gold,1.1);pl(sx,sy,[cx+ex,cy+ey,z+h-1.3],[cx+ex,cy-ey,z+h-1.3],shade(CM.gold,-.3),1.1);}
}
/* Satteldach als geschlossener Körper (Weltmaße): Rückfläche, Giebel mit Schmuck je Bauweise, Vorderfläche mit Deckung, Traufe, Ortgang, First */
function roofW(sx,sy,cx,cy,ex,ey,H,rh,ax,rL,pat,gw,t,o){
  o=o||{};const ov=o.ov!==undefined?o.ov:.07,th=pat==='thatch'||pat==='turf'?2.8:t>=2?2.2:1.8,P=(a,b,hh)=>ax==='x'?[cx+a,cy+b,hh]:[cx+b,cy+a,hh],A=ax==='x'?ex:ey,Bw=ax==='x'?ey:ex,E0=H-1,R=H+rh;
  const edge=pat==='turf'?'#6E5236':shade(rL,-.5),front=ax==='x'?rL:shade(rL,-.24),back=ax==='x'?shade(rL,-.32):shade(rL,.06);
  pq(sx,sy,[P(-A-ov,-Bw-ov,E0),P(A+ov,-Bw-ov,E0),P(A+ov,0,R),P(-A-ov,0,R)],back);
  pq(sx,sy,[P(-A-ov,-Bw-ov,E0),P(A+ov,-Bw-ov,E0),P(A+ov,-Bw-ov,E0-th),P(-A-ov,-Bw-ov,E0-th)],edge);
  pq(sx,sy,[P(A,-Bw,H),P(A,Bw,H),P(A,0,R-.5)],ax==='x'?shade(gw,-.3):shade(gw,-.03));
  const gl=ax==='x'?'rgba(25,16,8,.32)':'rgba(50,34,20,.26)';
  if(t===1){const bc=ax==='x'?CM.beamD:CM.beam;pl(sx,sy,P(A,0,H),P(A,0,R-1),bc,1.2);pl(sx,sy,P(A,-Bw,H+.6),P(A,Bw,H+.6),bc,1.2);pl(sx,sy,P(A,-Bw*.6,H+.6),P(A,0,H+rh*.6),bc,.9);pl(sx,sy,P(A,Bw*.6,H+.6),P(A,0,H+rh*.6),bc,.9);}
  else if(t===2)for(let q=H+3;q<R-2;q+=3.2){const f=1-(q-H)/rh;pl(sx,sy,P(A,-Bw*f,q),P(A,Bw*f,q),gl,.6);}
  else for(const f of[-.66,-.33,0,.33,.66])pl(sx,sy,P(A,Bw*f,H),P(A,Bw*f,H+rh*(1-Math.abs(f))-1),gl,.7);
  if(t===3){const[x,y]=spt(sx,sy,...P(A,0,H+rh*.42));ell(x,y,2.4,2.4,CM.gold);ell(x,y,1,1,shade(CM.gold,-.45));}
  pq(sx,sy,[P(-A,Bw,H),P(A,Bw,H),P(A,Bw,H-2.5),P(-A,Bw,H-2.5)],'rgba(0,0,0,.17)');
  pq(sx,sy,[P(-A-ov,Bw+ov,E0),P(A+ov,Bw+ov,E0),P(A+ov,0,R),P(-A-ov,0,R)],front);
  const F=(a,f)=>spt(sx,sy,...P(a,(Bw+ov)*(1-f),E0+(rh+1)*f)),a0=-A-ov,a1=A+ov;
  ctx.lineWidth=.7;
  if(pat==='turf'){ctx.strokeStyle=ax==='x'?'rgba(70,95,45,.55)':'rgba(60,85,40,.6)';ctx.lineWidth=.8;ctx.beginPath();const n=Math.round(14*(a1-a0)/.5);
    for(let k=0;k<n;k++){const[x,y]=F(a0+((k*.37)%1)*(a1-a0),((k*.61)%1)*.9+.04);ctx.moveTo(x,y);ctx.lineTo(x+.6,y-2.2);}ctx.stroke();
    ctx.fillStyle='#6E9050';for(let k=0;k<5;k++){const[x,y]=F(a0+(k+.5)*(a1-a0)/5,.02);ctx.beginPath();ctx.ellipse(x,y+1,1.6,1,0,0,TAU);ctx.fill();}}
  else if(pat==='thatch'){ctx.strokeStyle=shade(rL,-.25);ctx.beginPath();for(let r=0;r<5;r++){const f=.06+r*.18;for(let a=a0+(r%2)*.035;a<a1;a+=.07){const p=F(a,f),q=F(a,f+.13);ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);}}ctx.stroke();
    for(const f of[.24,.6])pl(sx,sy,P(a0,(Bw+ov)*(1-f),E0+(rh+1)*f),P(a1,(Bw+ov)*(1-f),E0+(rh+1)*f),'rgba(255,240,200,.25)',.8);}
  else if(pat==='shingle')for(const f of[.2,.4,.6,.8])pl(sx,sy,P(a0,(Bw+ov)*(1-f),E0+(rh+1)*f),P(a1,(Bw+ov)*(1-f),E0+(rh+1)*f),'rgba(0,0,0,.14)',.7);
  else{const rows=pat==='tile'?7:6,cl=pat==='tile'?'rgba(60,10,0,.24)':'rgba(255,255,255,.13)';
    for(let r=1;r<rows;r++){const f=r/rows,g=P(a0,(Bw+ov)*(1-f),E0+(rh+1)*f),h2=P(a1,(Bw+ov)*(1-f),E0+(rh+1)*f);pl(sx,sy,g,h2,cl,.7);
      if(pat==='tile'){ctx.strokeStyle=cl;ctx.lineWidth=.5;ctx.beginPath();for(let a=a0+(r%2?.05:.1);a<a1;a+=.1){const p=F(a,f),q=F(a,f-1/rows);ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);}ctx.stroke();}}}
  pq(sx,sy,[P(a0,Bw+ov,E0),P(a1,Bw+ov,E0),P(a1,Bw+ov,E0-th),P(a0,Bw+ov,E0-th)],edge);
  const gx=a1;
  pq(sx,sy,[P(gx,Bw+ov,E0-th),P(gx,0,R-th),P(gx,0,R+.6),P(gx,Bw+ov,E0+.6)],shade(rL,-.42));
  pq(sx,sy,[P(gx,-Bw-ov,E0-th),P(gx,0,R-th),P(gx,0,R+.6),P(gx,-Bw-ov,E0+.6)],shade(rL,-.36));
  const rc=t===3?CM.gold:o.ridge||shade(rL,-.3);
  pq(sx,sy,[P(a0,-.025,R+.5),P(a1,-.025,R+.5),P(a1,.025,R+.5),P(a0,.025,R+.5)],rc);
  pl(sx,sy,P(a0,.025,R+.5),P(a1,.025,R+.5),'rgba(255,255,255,.3)',.9);
  /* Giebelkreuz: gekreuzte Windbretter über dem First */
  if(o.cross){const cc=t===3?CM.gold:shade(rL,-.55);pl(sx,sy,P(gx,Bw*.3,E0+rh*.7),P(gx,-Bw*.16,R+4.5),cc,1.6);pl(sx,sy,P(gx,-Bw*.3,E0+rh*.7),P(gx,Bw*.16,R+4.5),cc,1.6);}
  /* Drachenköpfe an beiden Firstenden */
  if(o.dragon){const col=t===3?'#C08A2A':'#3B2A1E';for(const s of[-1,1]){const p=spt(sx,sy,...P(s*a1,0,R)),q=spt(sx,sy,...P(s*(a1-.2),0,R));dragon(p,q,col,s<0?.8:1);}}
}
function dragon(p,q,col,k){
  const dx=p[0]-q[0],dy=p[1]-q[1],l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,hx=p[0]+ux*4*k,hy=p[1]+uy*4*k-11*k;
  ctx.strokeStyle=col;ctx.lineWidth=2.2*k;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.quadraticCurveTo(p[0]+ux*7*k,p[1]+uy*7*k-4*k,hx,hy);ctx.stroke();
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(hx-ux*1.5,hy-2*k);ctx.lineTo(hx+ux*6*k,hy+(uy*3-.5)*k);ctx.lineTo(hx-ux*.5,hy+1.6*k);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(hx-ux*1.4,hy-1.5*k);ctx.lineTo(hx-ux*3.5*k,hy-4.5*k);ctx.lineTo(hx,hy-2*k);ctx.fill();
  ell(hx+ux*1.4,hy-.7*k,.7,.7,'#E7B54C');
}
/* Haus in der lokalen Ebene. ax: Firstrichtung 'u' oder 'v'. Bei ax 'v' sitzt die Tür im Giebel (darf in das Giebeldreieck ragen). */
function hut(sx,sy,o,lit){
  const t=o.t,z=o.z||0,h=o.h,cu=o.cu||0,cv=o.cv||0,eu=o.eu,ev=o.ev,[cx,cy,ex,ey]=W4(cu,cv,eu,ev),axW=(o.ax==='u')!==!!RM?'x':'y',H=z+h,gd=o.ax==='v',dc=(o.du===undefined?cu:o.du)-cu;
  if(!o.ns)shadowBox(sx,sy,ex,ey,H+o.rh*.6,cx,cy);
  wallsT(sx,sy,cu,cv,eu,ev,h,t,o.col,z);
  const fy=WF('v'),fx=WF('u'),W=(f,c,e,z0,z1,l)=>win(sx,sy,f,c,ex,ey,z0,z1,l,cx,cy);
  if(!o.nw){const rows=o.fl===2?[z+h*.16,z+h*.6]:[z+h*.36];
    for(const r of rows){const z1=r+Math.min(5,h*(o.fl===2?.24:.4));
      if(!gd||h>=8){const n=Math.max(1,Math.round(eu/.18));for(let k=0;k<n;k++){const c=-eu+(k+.5)*2*eu/n;if(r===rows[0]&&o.door!==false&&Math.abs(c-dc)<.13)continue;W(fy,c,0,r,z1,lit&&k%2===0);}}
      if(gd||h>=8){const n=Math.max(1,Math.round(ev/.2));for(let k=0;k<n;k++)W(fx,-ev+(k+.5)*2*ev/n,0,r,z1,lit&&k%2===1);}}}
  const dr=()=>{if(o.door===false)return;if(RB){if(h>=8)W(fy,dc,0,z+h*.4,z+h*.4+Math.min(5,h*.35),lit);return;}door(sx,sy,fy,dc,ex,ey,DOORH,cx,cy,o.wide);};
  if(!gd)dr();
  if(o.shields){const n=Math.max(2,Math.round(eu/.2));for(let k=0;k<n;k++){const c=-eu+(k+.5)*2*eu/n;if(!gd&&Math.abs(c-dc)<.15)continue;const[x,y]=lp(sx,sy,cu+c,cv+ev,z+h*.62);ell(x,y,2.4,2.6,['#9A3224','#E7B54C','#3F5E6B','#F1E9DA'][k%4]);ell(x,y,.8,.8,'#3B3532');}}
  roofW(sx,sy,cx,cy,ex,ey,H,o.rh,axW,o.rc,o.rp,o.gw||GWALL(t,o.col),t,o);
  if(gd)dr();
  if(o.chim){const[u,v]=o.chim,top=o.ax==='u'?H+o.rh*(1-Math.abs(v-cv)/(ev+.06)):H+o.rh*(1-Math.abs(u-cu)/(eu+.06));chimney(sx,sy,MW(u,v,0),top-2,t>=2?'#8C8A84':'#7D7A72');}
  return H+o.rh;
}
/* Kiste in der lokalen Ebene, Licht nach Weltfläche */
function lbox(sx,sy,cu,cv,eu,ev,h,col,z,noTop){z=z||0;const t=z+h,fy=WF('v')==='y';
  lq(sx,sy,[[cu-eu,cv+ev,z],[cu+eu,cv+ev,z],[cu+eu,cv+ev,t],[cu-eu,cv+ev,t]],shade(col,fy?-.03:-.3));
  lq(sx,sy,[[cu+eu,cv+ev,z],[cu+eu,cv-ev,z],[cu+eu,cv-ev,t],[cu+eu,cv+ev,t]],shade(col,fy?-.3:-.03));
  if(!noTop)lq(sx,sy,[[cu-eu,cv-ev,t],[cu+eu,cv-ev,t],[cu+eu,cv+ev,t],[cu-eu,cv+ev,t]],shade(col,.12));}
/* Pultdach: hoch bei u0/v0, fällt nach +dir ab */
function shed(sx,sy,u0,u1,v0,v1,zh,zl,dir,col){
  const th=1.8,Z=(u,v)=>dir==='v'?zh+(zl-zh)*(v-v0)/(v1-v0):zh+(zl-zh)*(u-u0)/(u1-u0),lit=WF(dir)==='y';
  lq(sx,sy,[[u0,v0,Z(u0,v0)],[u1,v0,Z(u1,v0)],[u1,v1,Z(u1,v1)],[u0,v1,Z(u0,v1)]],lit?col:shade(col,-.2));
  for(const f of[.25,.5,.75]){if(dir==='v'){const v=v0+(v1-v0)*f;ll(sx,sy,[u0,v,Z(u0,v)],[u1,v,Z(u1,v)],'rgba(0,0,0,.14)',.7);}else{const u=u0+(u1-u0)*f;ll(sx,sy,[u,v0,Z(u,v0)],[u,v1,Z(u,v1)],'rgba(0,0,0,.14)',.7);}}
  const ef=f=>shade(col,WF(f)==='y'?-.38:-.52);
  lq(sx,sy,[[u0,v1,Z(u0,v1)],[u1,v1,Z(u1,v1)],[u1,v1,Z(u1,v1)-th],[u0,v1,Z(u0,v1)-th]],ef('v'));
  lq(sx,sy,[[u1,v1,Z(u1,v1)],[u1,v0,Z(u1,v0)],[u1,v0,Z(u1,v0)-th],[u1,v1,Z(u1,v1)-th]],ef('u'));
}
/* Pfosten als kleine Kiste */
const post=(sx,sy,u,v,z0,z1,col,e)=>lbox(sx,sy,u,v,e||.03,e||.03,z1-z0,col||CM.post,z0);
/* Pyramidendach (Weltmaße, symmetrisch) */
function pyr(sx,sy,cx,cy,e,z,hh,col,pat){
  pq(sx,sy,[[cx-e,cy+e,z],[cx+e,cy+e,z],[cx,cy,z+hh]],col);pq(sx,sy,[[cx+e,cy+e,z],[cx+e,cy-e,z],[cx,cy,z+hh]],shade(col,-.3));
  if(pat)for(const f of[.3,.6]){pl(sx,sy,[cx-e*(1-f),cy+e*(1-f),z+hh*f],[cx+e*(1-f),cy+e*(1-f),z+hh*f],'rgba(0,0,0,.15)',.6);pl(sx,sy,[cx+e*(1-f),cy+e*(1-f),z+hh*f],[cx+e*(1-f),cy-e*(1-f),z+hh*f],'rgba(0,0,0,.15)',.6);}
  pq(sx,sy,[[cx-e,cy+e,z],[cx+e,cy+e,z],[cx+e,cy+e,z-1.5],[cx-e,cy+e,z-1.5]],shade(col,-.45));pq(sx,sy,[[cx+e,cy+e,z],[cx+e,cy-e,z],[cx+e,cy-e,z-1.5],[cx+e,cy+e,z-1.5]],shade(col,-.55));
}
/* Kegelstumpf (Ofen, Turm) in der lokalen Ebene */
function frust(sx,sy,cu,cv,e0,e1,h,col,z){z=z||0;const fy=WF('v')==='y';
  lq(sx,sy,[[cu-e0,cv+e0,z],[cu+e0,cv+e0,z],[cu+e1,cv+e1,z+h],[cu-e1,cv+e1,z+h]],shade(col,fy?-.03:-.3));
  lq(sx,sy,[[cu+e0,cv+e0,z],[cu+e0,cv-e0,z],[cu+e1,cv-e1,z+h],[cu+e1,cv+e1,z+h]],shade(col,fy?-.3:-.03));
  lq(sx,sy,[[cu-e1,cv-e1,z+h],[cu+e1,cv-e1,z+h],[cu+e1,cv+e1,z+h],[cu-e1,cv+e1,z+h]],shade(col,.12));}
/* Bildschirm-Teile: Zylinder (links hell, rechts dunkel), Kuppel, Fass, Sack */
function cyl(x,y,r,h,col,top){const ry=r*.45;
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x-r,y-h);ctx.lineTo(x-r,y);ctx.ellipse(x,y,r,ry,0,Math.PI,0,true);ctx.lineTo(x+r,y-h);ctx.closePath();ctx.fill();
  ctx.fillStyle=shade(col,-.24);ctx.beginPath();ctx.moveTo(x+r*.3,y-h);ctx.lineTo(x+r*.3,y+ry*.95);ctx.ellipse(x,y,r,ry,0,Math.PI*.4,0,true);ctx.lineTo(x+r,y-h);ctx.closePath();ctx.fill();
  ell(x,y-h,r,ry,top||shade(col,.14));}
function hoops(x,y,r,zs,col){ctx.strokeStyle=col;ctx.lineWidth=.9;for(const z of zs){ctx.beginPath();ctx.ellipse(x,y-z,r,r*.45,0,0,Math.PI);ctx.stroke();}}
function barrel(x,y,s){s=s||1;cyl(x,y,2.8*s,6.5*s,'#7A4E2C','#9C7048');hoops(x,y,2.8*s,[1.5*s,4.8*s],'#4A3222');}
function sack(x,y,col){col=col||'#D9CBA8';ell(x,y-2.6,3,3,col);ctx.fillStyle=shade(col,-.2);ctx.beginPath();ctx.ellipse(x+.8,y-2.4,2.2,2.8,0,-1.2,1.6);ctx.fill();ctx.fillStyle=shade(col,-.3);ctx.fillRect(x-1,y-6.6,2,1.4);}
function dome(x,y,r,col,brick){
  ell(x+3,y+1.5,r+3,r*.42,SHADOW);
  ctx.save();ctx.beginPath();ctx.ellipse(x,y,r,r*.45,0,0,Math.PI);ctx.ellipse(x,y,r,r*.9,0,Math.PI,TAU);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.clip();
  ctx.fillStyle=shade(col,-.22);ctx.beginPath();ctx.ellipse(x+r*.75,y-r*.15,r*.85,r*1.2,0,0,TAU);ctx.fill();
  if(brick){ctx.strokeStyle='rgba(60,20,10,.3)';ctx.lineWidth=.6;for(let k=1;k<4;k++){ctx.beginPath();ctx.ellipse(x,y-r*.22*k,r*Math.sqrt(1-(k*.24)**2),r*.42*Math.sqrt(1-(k*.24)**2),0,0,Math.PI);ctx.stroke();}}
  ell(x-r*.4,y-r*.55,r*.25,r*.16,'rgba(255,255,255,.22)');ctx.restore();}
/* Holzstapel: Stämme entlang ax ('u' oder 'v'), Stirnseiten nach +ax */
function logs(sx,sy,u,v,rows,ax,len,r){r=r||2.2;const st=r*2/35.8;
  for(let row=0;row<rows;row++){const n=rows-row;for(let k=0;k<n;k++){const o=(k-(n-1)/2)*st*1.05,z=r+row*r*1.7;
    const a=ax==='v'?[u+o,v-len,z]:[u-len,v+o,z],b=ax==='v'?[u+o,v+len,z]:[u+len,v+o,z],p=lp(sx,sy,...a),q=lp(sx,sy,...b);
    ctx.lineCap='round';ctx.strokeStyle='#7A5236';ctx.lineWidth=r*2;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();
    ctx.strokeStyle='#94683F';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(p[0],p[1]-r*.55);ctx.lineTo(q[0],q[1]-r*.55);ctx.stroke();
    ell(q[0],q[1],r*.9,r,'#DDB27A');ell(q[0],q[1],r*.42,r*.48,'#C4975E');}}}
function planks(sx,sy,u,v,n,ax){for(let k=0;k<n;k++)lbox(sx,sy,u,v,ax==='u'?.24:.07,ax==='u'?.07:.24,1.3,k%2?'#D4AE78':'#C49A62',k*1.3);}
function crate(sx,sy,u,v,e,z){lbox(sx,sy,u,v,e,e,e*80,'#B58A5A',z);const h=e*80;ll(sx,sy,[u-e,v+e,z||0],[u+e,v+e,(z||0)+h],'rgba(70,46,26,.5)',.7);ll(sx,sy,[u+e,v+e,z||0],[u+e,v-e,(z||0)+h],'rgba(50,30,16,.5)',.7);}
/* Mensch in einfacher Form (für Bogenposten) */
function figure(x,y,col){ctx.fillStyle='#3B3532';ctx.fillRect(x-1.4,y-4,1,4);ctx.fillRect(x+.4,y-4,1,4);ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(x-2.4,y-9.5,4.8,6,1.5);ctx.fill();ell(x,y-11.3,2,2,'#F0C9A8');}
/* Rauch und Glut (pro Bild, klein gehalten) */
function smk(x,y,n,tt,dark){const c=puffSprite(dark?1:0);for(let k=0;k<n;k++){const p=(tt*.45+k/n)%1,r=2.2+p*4.5;ctx.globalAlpha=.55*(1-p);ctx.drawImage(c,x+p*7+Math.sin(tt+k)*1.5-r,y-p*24-r,r*2,r*2);}ctx.globalAlpha=1;}
function glow(x,y,r,tt,k){const f=.6+.4*Math.sin(tt*9+k)*Math.sin(tt*5.3+k*2);ctx.globalAlpha=.35+.35*f;ell(x,y,r*1.6,r*.9,'#F4A43A');ctx.globalAlpha=1;ell(x,y,r*.7,r*.45,'#FFE08A');}
function spk(x,y,tt){for(let k=0;k<3;k++){const p=(tt*1.3+k/3)%1;ctx.globalAlpha=1-p;ell(x+Math.sin(k*2.3+tt)*4*p,y-p*12,.8,.8,'#FFC24A');}ctx.globalAlpha=1;}
/* Hängende Stücke an einer Stange von a nach b (lokal): Fisch, Fell, Tuch */
function hang(sx,sy,a,b,n,kind,cols){
  for(let k=0;k<n;k++){const f=(k+.5)/n,u=a[0]+(b[0]-a[0])*f,v=a[1]+(b[1]-a[1])*f,[x,y]=lp(sx,sy,u,v,a[2]),c=cols[k%cols.length];
    if(kind==='fish'){ell(x,y+3,.9,2.8,c);ctx.fillStyle=shade(c,-.3);ctx.beginPath();ctx.moveTo(x,y+5.4);ctx.lineTo(x-1.3,y+7);ctx.lineTo(x+1.3,y+7);ctx.fill();}
    else{const w=(Math.hypot(...[(b[0]-a[0]),(b[1]-a[1])])/n)*.36*35.8,du=(b[0]-a[0])/n*.38,dv=(b[1]-a[1])/n*.38,hh=kind==='tunic'?6:5;
      if(kind==='tunic')lq(sx,sy,[[u-du,v-dv,a[2]],[u+du,v+dv,a[2]],[u+du*.7,v+dv*.7,a[2]-hh],[u-du*.7,v-dv*.7,a[2]-hh]],c);
      else lq(sx,sy,[[u-du,v-dv,a[2]],[u+du,v+dv,a[2]],[u+du*.8,v+dv*.8,a[2]-hh-1],[u,v,a[2]-hh+.5],[u-du*.9,v-dv*.9,a[2]-hh-1.5]],c);}}
  ll(sx,sy,a,b,'#4A3222',.9);
}
/* Rahmen mit gespanntem Fell in der Ebene u=const */
function hideFrame(sx,sy,u,v0,v1,h,col){
  post(sx,sy,u,v0,0,h,CM.post,.022);post(sx,sy,u,v1,0,h,CM.post,.022);
  const m=(v0+v1)/2,d=(v1-v0)/2;
  lq(sx,sy,[[u,m-d*.8,2.5],[u,m,1.8],[u,m+d*.8,2.8],[u,m+d*.9,h*.55],[u,m+d*.7,h-1.5],[u,m,h-.8],[u,m-d*.75,h-1.8],[u,m-d*.9,h*.5]],WF('u')==='y'?col:shade(col,-.18));
  for(const z of[1.2,h-.4])ll(sx,sy,[u,v0,z],[u,v1,z],'#5A3B24',1.1);
}
/* Fensterloses Wandstück (Innenseite, im Schatten) */
function inner(sx,sy,L,col){lq(sx,sy,L,shade(col,-.42));}
/* Wasserrad in der Ebene u=const, dreht sich wenn der Betrieb läuft */
function wheel(sx,sy,u,v,zc,R,a,col){
  const rv=R/35.8*1.25,P=th=>lp(sx,sy,u,v+Math.cos(th)*rv,zc+Math.sin(th)*R);
  ctx.strokeStyle=shade(col,-.25);ctx.lineWidth=1.2;ctx.beginPath();for(let k=0;k<6;k++){const th=a+k*Math.PI/3,c=lp(sx,sy,u,v,zc),p=P(th);ctx.moveTo(c[0],c[1]);ctx.lineTo(p[0],p[1]);}ctx.stroke();
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<=20;k++){const p=P(k*TAU/20);if(k)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);}ctx.stroke();
  ctx.strokeStyle=shade(col,-.35);ctx.lineWidth=1.6;ctx.beginPath();for(let k=0;k<10;k++){const th=a+k*TAU/10,p=P(th),q=lp(sx,sy,u,v+Math.cos(th)*rv*1.25,zc+Math.sin(th)*R*1.25);ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);}ctx.stroke();
  const c=lp(sx,sy,u,v,zc);ell(c[0],c[1],1.6,1.6,'#3B3532');
}
/* Fahne an einer Stange (Spitze bei x,y) */
function flag(x,y,tt,col,k){const w=Math.sin(tt*3+(k||0));ctx.fillStyle=col||'#B03A2A';ctx.beginPath();ctx.moveTo(x+.6,y);ctx.quadraticCurveTo(x+6,y+1+w,x+11,y+2+w*1.5);ctx.lineTo(x+11,y+9+w*1.5);ctx.quadraticCurveTo(x+6,y+8+w,x+.6,y+7);ctx.fill();ctx.fillStyle='#F1E9DA';ctx.fillRect(x+4,y+2+w*.8,2,6);}
const pole=(sx,sy,u,v,h)=>{const[x,y]=lp(sx,sy,u,v,0);ctx.fillStyle='#3B3532';ctx.fillRect(x-.6,y-h,1.2,h);ell(x,y-h,1,1,CM.gold);};

/* ---------- Die Gebäudearten ---------- */
/* p(lv): Maße, b: festes Bild, l: lebendige Teile je Bild, h: Höhe für Schilder und Zeitbalken */
const SHP={};
SHP.huette={p(lv){const t=TIER(lv),g=1+(lv-1)*.04;return{t,cu:0,cv:-.04,eu:.2*g,ev:.17*g,h:[5,7,9,10][t],rh:[13,12,12,13][t],ax:'v',col:'#A27C55',...(t===0?{rc:CM.turf,rp:'turf'}:t===1?{rc:CM.thatch,rp:'thatch'}:RF(t,'#9A3224')),cross:t!==2,chim:t>=2?[.02,-.04-.17*g*.45]:0};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    if(t>=1)logs(sx,sy,-.3,-.34,2,'u',.1,1.8);
    hut(sx,sy,o,lit);
    if(t===0){const[x,y]=lp(sx,sy,.3,.26,0);cyl(x,y,2.6,3,'#8B5E34','#D9B07A');}
    else{lbox(sx,sy,-.3,.3,.1,.03,3,'#8A6440');if(t>=2){const[x,y]=lp(sx,sy,.33,.3,0);barrel(x,y,.9);}}
    if(t===3){const[x,y]=lp(sx,sy,.36,-.1,0);pole(sx,sy,.36,-.1,22);}},
  l(sx,sy,b,tt){const o=this.p(b.lvl);if(o.chim){const[x,y]=lp(sx,sy,o.chim[0],o.chim[1],o.h+o.rh+4);smk(x,y,2,tt);}else{const[x,y]=lp(sx,sy,0,o.cv,o.h+o.rh);smk(x,y,2,tt);}
    if(o.t===3){const[x,y]=lp(sx,sy,.36,-.1,22);flag(x,y,tt,'#3F5E6B');}},
  h(lv){const o=this.p(lv);return o.h+o.rh+(o.t===3?6:2);}};
SHP.langhaus={p(lv){const t=TIER(lv),g=1+(lv-1)*.035;return{t,cu:.05,cv:-.08,eu:.34*g,ev:.72*g,h:[7,9,11,12][t],rh:[17,16,16,18][t],ax:'v',col:'#9C7048',...(t===0?{rc:CM.turf,rp:'turf'}:RF(t,'#5C4A3A')),cross:1,shields:t===3,chim:t>=2?[.07,-.4]:0};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    if(t>=1)lbox(sx,sy,-.62,-.55,.1,.2,4,'#8A6440');
    hut(sx,sy,o,lit);
    logs(sx,sy,.6,-.2,t>=1?3:2,'v',.32,2);
    if(t>=2){const[x,y]=lp(sx,sy,-.55,.62,0);barrel(x,y);const[a,c]=lp(sx,sy,-.38,.72,0);barrel(a,c,.85);}
    if(t===0)lbox(sx,sy,-.5,.62,.16,.04,3,'#8A6440');
    if(t===3)pole(sx,sy,.62,.72,30);},
  l(sx,sy,b,tt){const o=this.p(b.lvl);const[x,y]=o.chim?lp(sx,sy,o.chim[0],o.chim[1],o.h+o.rh+4):lp(sx,sy,o.cu,o.cv,o.h+o.rh);smk(x,y,2,tt);if(o.t===3){const[a,c]=lp(sx,sy,.62,.72,30);flag(a,c,tt);}},
  h(lv){const o=this.p(lv);return o.h+o.rh+5;}};
SHP.steinhaus={p(lv){const t=TIER(lv),g=1+(lv-1)*.03;return{t,cu:0,cv:-.05,eu:.52*g,ev:.42*g,h:[16,18,21,23][t],rh:[13,13,14,15][t],ax:'u',fl:2,col:'#9C7048',...RF(t,'#9A3224'),du:0,shields:t===3};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    if(t===3){const e=.16,cu=-o.eu+.04,cv=o.cv-o.ev+.04,[cx,cy]=MW(cu,cv,0);shadowBox(sx,sy,e,e,44,cx,cy);walls(sx,sy,e,e,36,CM.stone,'stone',0,cx,cy);pyr(sx,sy,cx,cy,e+.04,36,14,'#4A4440',1);}
    lbox(sx,sy,0,.5,.18,.05,1.6,'#A7A89E');
    hut(sx,sy,o,lit);
    const H=o.h,R=o.rh;for(const s of t>=2?[-1,1]:[1]){const u=s*o.eu*.7;chimney(sx,sy,MW(u,o.cv,0),H+R-2,t>=1?'#8C8A84':'#7D7A72');}
    if(t>=1){for(const u of[-.7,.7]){lbox(sx,sy,u,.62,.12,.05,3.5,t>=2?'#8C8A84':'#7A5636');}const[x,y]=lp(sx,sy,-.7,.62,3.5);ell(x,y-2,3.5,2.6,'#6F8F48');const[a,c]=lp(sx,sy,.7,.62,3.5);ell(a,c-2,3.5,2.6,'#6F8F48');ell(a-1,c-3,1,1,'#B03A2A');}},
  l(sx,sy,b,tt){const o=this.p(b.lvl);const[x,y]=lp(sx,sy,o.eu*.7,o.cv,o.h+o.rh+5);smk(x,y,2,tt);},
  h(lv){const o=this.p(lv);return Math.max(o.h+o.rh+4,o.t===3?50:0);}};
SHP.hof={p(lv){const t=TIER(lv),g=Math.min(1.3,1+(lv-1)*.045);return{t,cu:0,cv:-.18,eu:.95*g,ev:.46*g,h:[12,13,15,16][t],rh:[16,17,18,20][t],ax:'u',col:'#8A5A32',...(t===0?{rc:CM.turf,rp:'turf'}:RF(t,'#6E7F4E')),du:0,wide:1,cross:t<3,dragon:t===3,shields:t>=2};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    if(t>=2){const e=.2,cu=-1.1,cv=-1.05,[cx,cy]=MW(cu,cv,0),h=t===3?42:34;shadowBox(sx,sy,e,e,h+8,cx,cy);walls(sx,sy,e,e,h,CM.stone,'stone',0,cx,cy);
      win(sx,sy,WF('v'),0,e,e,h*.7,h*.7+4,lit,cx,cy);pyr(sx,sy,cx,cy,e+.05,h,15,t===3?'#4A4440':'#9A3224',1);}
    hut(sx,sy,o,lit);
    if(t>=1){const w={t,cu:1.0,cv:.32,eu:.32,ev:.42,h:o.h-2,rh:o.rh-4,ax:'v',col:o.col,rc:o.rc,rp:o.rp,door:false,cross:t<3};hut(sx,sy,w,lit);}
    if(t===3){const w={t,cu:-1.0,cv:.32,eu:.32,ev:.42,h:o.h-2,rh:o.rh-4,ax:'v',col:o.col,rc:o.rc,rp:o.rp,door:false};hut(sx,sy,w,lit);}
    for(const p of this.poles(t))pole(sx,sy,p[0],p[1],28);
    if(t>=1){const[x,y]=lp(sx,sy,-.5,.85,0);barrel(x,y);}},
  poles:t=>t>=2?[[-1.3,1.2],[1.32,1.2]]:[[-1.14,1.08]],
  l(sx,sy,b,tt){const o=this.p(b.lvl);const[x,y]=lp(sx,sy,o.eu*.5,o.cv,o.h+o.rh);smk(x,y,2,tt);this.poles(o.t).forEach((p,k)=>{const[a,c]=lp(sx,sy,p[0],p[1],28);flag(a,c,tt,'#B03A2A',k);});},
  h(lv){const o=this.p(lv);return o.h+o.rh+(o.t===3?18:10);}};
SHP.holzfaeller={p(lv){const t=TIER(lv),g=1+(lv-1)*.035;return{t,cu:-.12,cv:-.14,eu:.17*g,ev:.15*g,h:[6,8,10,11][t],rh:[11,11,11,12][t],ax:'v',col:'#B9A07A',...RF(t,'#6E4A2E'),cross:t===0};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    if(t>=2)logs(sx,sy,-.12,-.4,2,'u',.16,1.8);
    hut(sx,sy,o,lit);
    logs(sx,sy,.28,-.04,t>=1?3:2,'v',.19,t>=1?2.4:2.2);
    if(t===3)logs(sx,sy,.12,.33,2,'u',.1,1.8);
    const[x,y]=lp(sx,sy,-.3,.3,0);ell(x+2,y+1,4,1.6,SHADOW);cyl(x,y,3,3.5,'#8B5E34','#D9B07A');
    ctx.save();ctx.translate(x+SG()*.5,y-3.5);ctx.rotate(SG()*.5);ctx.fillStyle='#6E4A2E';ctx.fillRect(-.6,-8,1.2,8);ctx.fillStyle='#9CA6AA';ctx.beginPath();ctx.moveTo(-.6,-8.5);ctx.lineTo(-.6*SG()-3.2*SG(),-9.5);ctx.lineTo(-.6*SG()-3.2*SG(),-5.5);ctx.lineTo(-.6,-6);ctx.fill();ctx.restore();
    for(const[dx,dy]of[[-5,1],[4,2],[-2,3]])ell(x+dx,y+dy,1.1,.6,'#D9B07A');},
  h(lv){const o=this.p(lv);return o.h+o.rh+2;}};
SHP.jaeger={p(lv){const t=TIER(lv),g=1+(lv-1)*.035;return{t,cu:-.1,cv:-.1,eu:.18*g,ev:.19*g,h:[5,7,9,10][t],rh:[12,12,12,13][t],ax:'v',col:'#7F6B57',...(t===0?{rc:'#4C6B45',rp:'turf'}:RF(t,'#4C6B45'))};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    const top=hut(sx,sy,o,lit);
    const[x,y]=lp(sx,sy,o.cu,o.cv+o.ev+.08,top-1),k=t===3?1.25:1,c=t===3?'#E7C25A':'#EDE3CC';
    ctx.strokeStyle=c;ctx.lineWidth=1.1;ctx.beginPath();for(const s of[-1,1]){ctx.moveTo(x,y);ctx.quadraticCurveTo(x+s*6*k,y-1,x+s*7*k,y-8*k);ctx.moveTo(x+s*3.5*k,y-1.4);ctx.lineTo(x+s*2.5*k,y-5*k);ctx.moveTo(x+s*6*k,y-3.5*k);ctx.lineTo(x+s*9*k,y-6*k);}ctx.stroke();ell(x,y,1.6,1.2,'#5A3B24');
    hideFrame(sx,sy,.3,-.24,.12,13,'#B98454');
    if(t>=1)hideFrame(sx,sy,.36,.2,.42,10,'#8A6440');
    ll(sx,sy,[-.42,.3,0],[-.42,.3,9],CM.post,1.2);ll(sx,sy,[-.16,.3,0],[-.16,.3,9],CM.post,1.2);
    hang(sx,sy,[-.42,.3,9],[-.16,.3,9],t>=2?3:2,'pelt',['#8A5A32','#5E4632','#A27C55']);},
  h(lv){const o=this.p(lv);return o.h+o.rh+8;}};
SHP.sammler={p(lv){const t=TIER(lv),g=1+(lv-1)*.03;return{t,cu:-.14,cv:-.14,eu:.17*g,ev:.17*g,h:[7,8,10,11][t],rh:[11,11,11,12][t],ax:'v',col:'#C9B08A',...RF(t,'#7E8A6A',1),cross:1};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    hut(sx,sy,o,lit);
    post(sx,sy,.3,-.3,0,13,CM.post,.02);post(sx,sy,.3,.12,0,13,CM.post,.02);
    for(let z=3;z<=12;z+=2.2)ll(sx,sy,[.3,-.3,z],[.3,.12,z+.5],'rgba(90,80,60,.75)',.6);
    for(let v=-.26;v<=.1;v+=.07)ll(sx,sy,[.3,v,2.5],[.3,v+.02,12.5],'rgba(90,80,60,.75)',.6);
    for(const v of[-.2,-.04,.08]){const[x,y]=lp(sx,sy,.3,v,5);ell(x,y,1,1,'#E7B54C');}
    for(const[u,v]of(t>=1?[[.08,.3],[.28,.36],[-.32,.28]]:[[.1,.32],[.28,.36]])){const[x,y]=lp(sx,sy,u,v,0);cyl(x,y,3.4,4,'#A07A4E','#7A5636');for(let k=0;k<5;k++)ell(x-2+k,y-4.6-(k%2)*.8,1.1,.9,k%2?'#F4A43A':'#E7B54C');}
    if(t>=2)crate(sx,sy,-.35,.1,.06,0);if(t===3){const[x,y]=lp(sx,sy,-.35,.1,5);ell(x,y-1,3,1.4,'#F4A43A');}},
  h(lv){const o=this.p(lv);return o.h+o.rh+2;}};
SHP.saegewerk={p(lv){const t=TIER(lv),g=Math.min(1.12,1+(lv-1)*.02);return{t,cv:-.4,eu:.56*g,ev:.32*g,h:[14,15,16,17][t],rh:[8,8,9,10][t],...RF(t,'#8A5A32')};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t,eu=o.eu,ev=o.ev,cv=o.cv,h=o.h,[cx,cy,ex,ey]=W4(0,cv,eu,ev),wc=t===0?'#9C7048':t===1?CM.plas:t===2?CM.stone:CM.hall,v0=cv-ev,v1=cv+ev;
    if(t>=1){lq(sx,sy,[[.74,-1,0],[.94,-1,0],[.94,1,0],[.74,1,0]],'#6F98A2');ll(sx,sy,[.74,-1,0],[.74,1,0],'#5A4A36',1);ll(sx,sy,[.94,-1,0],[.94,1,0],'#8A7A5A',1);}
    logs(sx,sy,-.1,-.88,2,'u',.4,2.2);
    shadowBox(sx,sy,ex,ey,h+o.rh*.6,cx,cy);
    lq(sx,sy,[[-eu,v0,0],[eu,v0,0],[eu,v1,0],[-eu,v1,0]],'#8A6440');
    inner(sx,sy,[[-eu,v0,0],[eu,v0,0],[eu,v0,h],[-eu,v0,h]],wc);inner(sx,sy,[[-eu,v0,0],[-eu,v1,0],[-eu,v1,h],[-eu,v0,h]],shade(wc,.15));
    const pc=t>=2?'#8C8A84':CM.post;for(const[u,v]of[[-eu,v0],[0,v0],[eu,v0],[-eu,v1]])post(sx,sy,u,v,0,h,pc,.035);
    planks(sx,sy,-.25,cv,2+t,'u');planks(sx,sy,.25,cv-.05,1+t,'u');
    for(const[u,v]of[[0,v1],[eu,v1],[eu,cv]])post(sx,sy,u,v,0,h,pc,.035);
    if(RB){lq(sx,sy,[[-eu,v1,0],[eu,v1,0],[eu,v1,h],[-eu,v1,h]],shade(wc,WF('v')==='y'?-.03:-.3));for(let u=-eu+.08;u<eu;u+=.08)ll(sx,sy,[u,v1,0],[u,v1,h],'rgba(50,34,20,.2)',.7);win(sx,sy,WF('v'),0,ex,ey,h*.4,h*.4+5,lit,cx,cy);}
    roofW(sx,sy,cx,cy,ex,ey,h,o.rh,WF('v')==='y'?'x':'y',o.rc,o.rp,wc,t,{});
    if(t>=1){lbox(sx,sy,.84,-.72,.05,.26,1.6,'#7A5636',20);post(sx,sy,.84,-.95,0,20,CM.post,.025);ll(sx,sy,[.84,-.95,21.5],[.84,-.5,21.5],'#6F98A2',1);}
    /* Sägegatter im Hof: Stamm auf Böcken läuft durch den Rahmen */
    const lv=.48,fu=-.42,fh=t===0?16:19;
    for(const u of[-.8,-.15]){ll(sx,sy,[u-.06,lv,0],[u+.04,lv,5],CM.post,1.2);ll(sx,sy,[u+.06,lv,0],[u-.04,lv,5],CM.post,1.2);}
    post(sx,sy,fu,lv-.16,0,fh,'#5A3B24',.028);
    const a=lp(sx,sy,-.95,lv,6.5),c=lp(sx,sy,-.05,lv,6.5);ctx.lineCap='round';ctx.strokeStyle='#7A5236';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(c[0],c[1]);ctx.stroke();ctx.strokeStyle='#94683F';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a[0],a[1]-2);ctx.lineTo(c[0],c[1]-2);ctx.stroke();ell(c[0],c[1],2.3,2.5,'#DDB27A');
    for(const v of t>=2?[lv-.05,lv,lv+.05]:[lv])ll(sx,sy,[fu,v,2],[fu,v,fh-1],'#C9D0D2',1.1);
    ll(sx,sy,[fu,lv-.18,fh],[fu,lv+.18,fh],'#4A3222',2.2);ll(sx,sy,[fu,lv-.16,10],[fu,lv+.16,10],'#4A3222',1.4);
    post(sx,sy,fu,lv+.16,0,fh,'#5A3B24',.028);
    if(t>=1){ll(sx,sy,[fu,lv-.18,fh],[fu+.02,lv-.18,fh+5],'#4A3222',1);const[x,y]=lp(sx,sy,fu,lv,fh+5);ell(x,y,1.6,1.6,'#5A3B24');}
    planks(sx,sy,.35,.62,2+t,'u');if(t>=2)planks(sx,sy,.35,.82,2,'u');},
  l(sx,sy,b,tt){const t=TIER(b.lvl);if(t<1)return;const R=t>=2?10.5:9;wheel(sx,sy,.84,-.4,R+1,R,b.run?tt*1.4:0,'#7A5636');if(b.run){const[x,y]=lp(sx,sy,.84,-.2,1);ell(x,y,3,1,'rgba(255,255,255,.6)');}},
  h(lv){const o=this.p(lv);return o.h+o.rh+2;}};
SHP.baeckerei={p(lv){const t=TIER(lv),g=Math.min(1.2,1+(lv-1)*.03);return{t,cu:-.32,cv:-.34,eu:.42*g,ev:.38*g,h:[11,11,12,13][t],rh:[12,12,12,13][t],ax:'u',col:'#B9A07A',...RF(t,'#9A3224'),du:-.1,chim:[-.6,-.42]};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    if(t===3)this.oven(sx,sy,.62,-.42,11,t);
    hut(sx,sy,o,lit);
    const[x,y]=lp(sx,sy,.32,.02,0);sack(x,y);sack(x+5,y+2,'#CDBE98');
    this.oven(sx,sy,.5,.42,[11,12,14,15][t],t);
    logs(sx,sy,.85,-.05,2,'v',.12,1.8);
    lbox(sx,sy,-.6,.6,.16,.08,.8,'#8A6440',5);for(const[u,v]of[[-.6,.6,5]])for(const d of[-.12,.12])ll(sx,sy,[u+d,v+.06,0],[u+d,v+.06,5],'#5A3B24',1);
    for(const d of[-.1,0,.1]){const[a,c]=lp(sx,sy,-.6+d,.6,5.8);ell(a,c-1,2.2,1.4,'#B07A3E');ell(a-.6,c-1.6,.9,.5,'#D9A86A');}},
  oven(sx,sy,u,v,r,t){const[x,y]=lp(sx,sy,u,v,0),col=t>=2?'#B5694A':'#C9925E';dome(x,y,r,col,t>=2);
    if(t>=1){ctx.fillStyle=t>=2?'#8C8A84':'#A07050';ctx.fillRect(x+r*.25,y-r*1.25,4,r*.6);ctx.fillStyle='#2A2624';ctx.fillRect(x+r*.25+.8,y-r*1.25,2.4,1);}
    const mx=x-SG()*r*.42,my=y+r*.08;ctx.fillStyle='#2A2220';ctx.beginPath();ctx.moveTo(mx-3,my);ctx.lineTo(mx-3,my-3.5);ctx.arc(mx,my-3.5,3,Math.PI,0);ctx.lineTo(mx+3,my);ctx.fill();ell(mx,my-1,2,1,'#C0602A');},
  l(sx,sy,b,tt){const t=TIER(b.lvl),r=[11,12,14,15][t];const[x,y]=lp(sx,sy,.5,.42,0);if(b.run){glow(x-SG()*r*.42,y+r*.08-1.5,2.2,tt,0);if(t>=1)smk(x+r*.25+2,y-r*1.25,2,tt);}const o=this.p(b.lvl);if(b.run){const[a,c]=lp(sx,sy,-.6,-.42,o.h+o.rh+3);smk(a,c,2,tt);}},
  h(lv){const o=this.p(lv);return o.h+o.rh+4;}};
SHP.raeucherei={p(lv){const t=TIER(lv),g=Math.min(1.2,1+(lv-1)*.03);return{t,cu:-.18,cv:-.12,eu:.34*g,ev:.6*g,h:[7,8,9,10][t],rh:[11,11,12,12][t],ax:'v',col:'#5E4E40',...RF(t,'#3E3A36'),nw:1};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    const top=hut(sx,sy,o,lit);
    const[cx,cy,ex,ey]=W4(o.cu,o.cv,.07,.15),zb=top-3;lbox(sx,sy,o.cu,o.cv,.07,.15,3.5,'#3B3532',zb,1);
    for(const f of[-.08,0,.08])ll(sx,sy,[o.cu+.07,o.cv+f,zb+.6],[o.cu+.07,o.cv+f,zb+3],'#1E1C1A',.8);
    roofW(sx,sy,cx,cy,ex,ey,zb+3.5,4,WF('v')==='y'?'y':'x',o.rc,o.rp==='turf'?'thatch':o.rp,'#3B3532',Math.min(t,2),{ov:.04});
    const n=[4,5,6,7][t];ll(sx,sy,[.62,-.6,0],[.62,-.6,13],CM.post,1.3);ll(sx,sy,[.62,.45,0],[.62,.45,13],CM.post,1.3);ll(sx,sy,[.62,-.08,0],[.62,-.08,13],CM.post,1.1);
    hang(sx,sy,[.62,-.6,12.5],[.62,.45,12.5],n,'fish',['#8DA9B2','#A9BEC4','#7D98A0']);hang(sx,sy,[.62,-.6,7.5],[.62,.45,7.5],n-1,'fish',['#B9A07A','#8DA9B2']);
    if(t>=1){ll(sx,sy,[-.85,.72,0],[-.85,.72,11],CM.post,1.2);ll(sx,sy,[-.35,.72,0],[-.35,.72,11],CM.post,1.2);hang(sx,sy,[-.85,.72,10.5],[-.35,.72,10.5],n-1,'fish',['#8DA9B2','#C9925E']);}
    if(t>=2){const[x,y]=lp(sx,sy,.62,.78,0);sack(x,y,'#C9B48A');sack(x+5,y+2,'#BCA67A');}},
  l(sx,sy,b,tt){if(!b.run)return;const o=this.p(b.lvl);const[x,y]=lp(sx,sy,o.cu,o.cv,o.h+o.rh+3);smk(x,y,3,tt,1);},
  h(lv){const o=this.p(lv);return o.h+o.rh+6;}};
SHP.schmelze={p(lv){const t=TIER(lv),g=Math.min(1.15,1+(lv-1)*.025);return{t,cu:-.3,cv:.05,eu:.36*g,ev:.3*g,h:[11,11,12,13][t],rh:[8,9,9,10][t],ax:'u',col:'#7A6450',...RF(t,'#2F3436'),du:-.1,fh:[18,22,28,33][t],e0:[.2,.22,.25,.27][t]};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    if(t===3)this.furn(sx,sy,-.25,-.68,.2,24,t);
    const[cx,cy]=lp(sx,sy,-.62,.66,0);ell(cx,cy-1,7,3.2,'#2A2624');ell(cx-1,cy-2.5,4.5,2,'#3B3532');
    hut(sx,sy,o,lit);
    this.furn(sx,sy,.52,-.36,o.e0,o.fh,t);
    const[bx,by]=lp(sx,sy,.25,.05,0);ctx.fillStyle='#6E4A2E';ctx.beginPath();ctx.moveTo(bx-SG()*5,by-1);ctx.lineTo(bx+SG()*4,by-4.5);ctx.lineTo(bx+SG()*4,by+.5);ctx.closePath();ctx.fill();ctx.fillStyle='#8A5A32';ctx.fillRect(bx+SG()*4-(SG()<0?2:0),by-5,2,6);
    const[ox,oy]=lp(sx,sy,.55,.55,0);ell(ox,oy-1,6.5,3,'#7A4A36');for(const[dx,dy]of[[-2,-2],[2,-1.5],[0,-3.5],[3.5,-.5]])ell(ox+dx,oy+dy,1.5,1.1,'#9C5A3E');
    if(t>=2)for(let k=0;k<3;k++)lbox(sx,sy,.82,.4,.1,.03,1.2,'#5A5E62',k*1.2);},
  furn(sx,sy,u,v,e0,h,t){const col=t>=2?'#8C8A84':'#A3704A',[cx,cy]=MW(u,v,0);shadowBox(sx,sy,e0,e0,h,cx,cy);frust(sx,sy,u,v,e0,e0*.62,h,col);
    if(t>=2)for(let z=4;z<h-1;z+=4){const f=1-.38*z/h;ll(sx,sy,[u-e0*f,v+e0*f,z],[u+e0*f,v+e0*f,z],'rgba(40,36,30,.22)',.6);ll(sx,sy,[u+e0*f,v+e0*f,z],[u+e0*f,v-e0*f,z],'rgba(20,18,16,.25)',.6);}
    else for(const z of[h*.3,h*.65]){const f=1-.38*z/h;ll(sx,sy,[u-e0*f,v+e0*f,z],[u+e0*f,v+e0*f,z],'#4A3222',1.2);ll(sx,sy,[u+e0*f,v+e0*f,z],[u+e0*f,v-e0*f,z],'#3B2A1E',1.2);}
    if(!RB)lq(sx,sy,[[u-.06,v+e0*.98,0],[u+.06,v+e0*.98,0],[u+.06,v+e0*.95,4],[u,v+e0*.94,5.5],[u-.06,v+e0*.95,4]],'#2A1A14');
    const e1=e0*.62;lq(sx,sy,[[u-e1*.6,v-e1*.6,h],[u+e1*.6,v-e1*.6,h],[u+e1*.6,v+e1*.6,h],[u-e1*.6,v+e1*.6,h]],'#2A2220');},
  l(sx,sy,b,tt){if(!b.run)return;const o=this.p(b.lvl);const[x,y]=lp(sx,sy,.52,-.36,o.fh);glow(x,y,2,tt,1);spk(x,y-2,tt);smk(x,y-3,2,tt,1);if(!RB){const[a,c]=lp(sx,sy,.52,-.36+o.e0,2);glow(a,c,1.8,tt,3);}},
  h(lv){return this.p(lv).fh+4;}};
SHP.schmiede={p(lv){const t=TIER(lv),g=Math.min(1.15,1+(lv-1)*.025);return{t,cu:-.4,cv:-.42,eu:.36*g,ev:.32*g,h:[11,11,12,13][t],rh:[10,10,10,11][t],ax:'u',col:'#6B5A4A',...RF(t,'#9A3224'),du:-.3};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t,u0=o.cu+o.eu,u1=.42,v0=-.78,v1=-.02,zh=o.h,zl=o.h-3,rc=RF(t,'#6E4A2E').rc,wc=GWALL(t,'#6B5A4A'),hu=.68,hv=-.38,cz=[22,24,27,30][t];
    hut(sx,sy,o,lit);
    /* offenes Schutzdach am Werkhaus: Blasebalg und Werkzeug */
    inner(sx,sy,[[u0,v0,0],[u1,v0,0],[u1,v0,zl],[u0,v0,zh]],t>=2?CM.stone:wc);post(sx,sy,u1,v0,0,zl,CM.post,.03);
    if(t>=1)for(let k=0;k<3;k++){const u=u0+.06+k*.07,[x,y]=lp(sx,sy,u,v0+.02,4);ctx.fillStyle='#9CA6AA';ctx.fillRect(x-.5,y-8,1,8);ctx.fillStyle='#6E4A2E';ctx.fillRect(x-1.5,y-1,3,1);}
    const[bx,by]=lp(sx,sy,(u0+u1)/2,-.38,0);ctx.fillStyle='#6E4A2E';ctx.beginPath();ctx.moveTo(bx-SG()*4,by-1);ctx.lineTo(bx+SG()*4,by-6);ctx.lineTo(bx+SG()*4,by);ctx.closePath();ctx.fill();ctx.fillStyle='#4A3222';ctx.fillRect(bx+SG()*4-1,by-6,2,6);
    post(sx,sy,u1,v1,0,zl,CM.post,.03);shed(sx,sy,u0,u1+.03,v0,v1+.03,zh,zl,'u',rc);
    /* Esse: Steinherd mit Glut, Rauchfang dahinter */
    const hc=t>=2?'#8C8A84':'#9C8A74',[hx,hy]=MW(hu,hv,0);shadowBox(sx,sy,.22,.22,cz*.7,hx,hy);
    lbox(sx,sy,hu,hv,.22,.2,6,hc);lbox(sx,sy,hu,hv-.13,.15,.08,cz-6,'#7D7A72',6);lbox(sx,sy,hu,hv-.13,.19,.11,2,'#6B6F6C',cz-8);
    lq(sx,sy,[[hu-.09,hv-.17,cz+.05],[hu+.09,hv-.17,cz+.05],[hu+.09,hv-.09,cz+.05],[hu-.09,hv-.09,cz+.05]],'#2A2624');
    lq(sx,sy,[[hu-.17,hv-.03,6.05],[hu+.17,hv-.03,6.05],[hu+.17,hv+.16,6.05],[hu-.17,hv+.16,6.05]],'#3B2A22');
    for(const[du,dv]of[[-.08,.06],[.04,.1],[.1,.02],[-.02,.02]]){const[x,y]=lp(sx,sy,hu+du,hv+dv,6.1);ell(x,y,1.4,.8,'#E07B39');}
    const[ax,ay]=lp(sx,sy,.45,.32,0);cyl(ax,ay,2.8,4,'#7A5236','#9C7048');ctx.fillStyle='#3B3532';ctx.fillRect(ax-1.5,ay-6,3,2.2);ctx.beginPath();ctx.moveTo(ax-4.5,ay-6);ctx.lineTo(ax+3.5,ay-6);ctx.lineTo(ax+3.5+SG()*2,ay-8.2);ctx.lineTo(ax-4.5,ay-8.2);ctx.closePath();ctx.fill();ctx.fillStyle='#5E5852';ctx.fillRect(ax-4.5,ay-8.2,8,.8);
    const[qx,qy]=lp(sx,sy,.8,.45,0);cyl(qx,qy,3,5,'#7A4E2C','#3F5E6B');hoops(qx,qy,3,[1.2,3.8],'#4A3222');
    if(t>=2){const[gx,gy]=lp(sx,sy,-.7,.55,0);ctx.fillStyle='#6E4A2E';ctx.fillRect(gx-4,gy-4,8,2);ell(gx,gy-6,4.5,4.5,'#A7A89E');ell(gx,gy-6,1,1,'#5A3B24');}},
  l(sx,sy,b,tt){if(!b.run)return;const t=TIER(b.lvl),hu=.68,hv=-.38,cz=[22,24,27,30][t];const[x,y]=lp(sx,sy,hu,hv+.07,6.3);glow(x,y,2.6,tt,2);const[a,c]=lp(sx,sy,.45,.32,8);spk(a,c,tt*1.6);const[mx,my]=lp(sx,sy,hu,hv-.13,cz+1);smk(mx,my,3,tt,1);},
  h(lv){return[22,24,27,30][TIER(lv)]+4;}};
SHP.ziegelei={p(lv){const t=TIER(lv),g=Math.min(1.15,1+(lv-1)*.025);return{t,cu:-.38,cv:-.22,eu:.34*g,ev:.34*g,h:[10,12,14,16][t],ch:[4,9,12,15][t]};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t,cu=o.cu,cv=o.cv,eu=o.eu,ev=o.ev,h=o.h,[cx,cy,ex,ey]=W4(cu,cv,eu,ev),bc='#B5694A';
    shadowBox(sx,sy,ex,ey,h+8,cx,cy);walls(sx,sy,ex,ey,h,bc,'stone',0,cx,cy);
    lq(sx,sy,[[cu-eu,cv-ev,h],[cu+eu,cv-ev,h],[cu+eu,cv+ev,h],[cu-eu,cv+ev,h]],shade(bc,.12));lq(sx,sy,[[cu-eu+.06,cv-ev+.06,h],[cu+eu-.06,cv-ev+.06,h],[cu+eu-.06,cv+ev-.06,h],[cu-eu+.06,cv+ev-.06,h]],'#5A3828');
    if(!RB)for(const d of[-.16,.16]){const u=cu+d;lq(sx,sy,[[u-.07,cv+ev,0],[u+.07,cv+ev,0],[u+.07,cv+ev,4.5],[u,cv+ev,6.5],[u-.07,cv+ev,4.5]],'#2A1A14');}
    else win(sx,sy,WF('v'),0,ex,ey,h*.5,h*.5+4,lit,cx,cy);
    if(t>=1){const e=.08,[a,c]=MW(cu-.02,cv-.05,0);walls(sx,sy,e,e,o.ch+3,'#9A5A40','stone',h-3,a,c);pq(sx,sy,[[a-e,c-e,h+o.ch],[a+e,c-e,h+o.ch],[a+e,c+e,h+o.ch],[a-e,c+e,h+o.ch]],'#2A2624');}
    if(t===3){const e=.07,[a,c]=MW(cu-.02,cv+.18,0);walls(sx,sy,e,e,o.ch,'#9A5A40','stone',h-3,a,c);pq(sx,sy,[[a-e,c-e,h+o.ch-3],[a+e,c-e,h+o.ch-3],[a+e,c+e,h+o.ch-3],[a-e,c+e,h+o.ch-3]],'#2A2624');}
    const u0=.2,u1=.9,v0=-.85,v1=.2,sh=t===0?12:14;
    for(const[u,v]of[[u0,v0],[u1,v0]])post(sx,sy,u,v,0,sh,CM.post,.025);
    for(const z of[1.5,4.5,7.5].slice(0,t===0?2:3)){if(z>sh-1)continue;lq(sx,sy,[[u0+.05,v0+.05,z],[u1-.05,v0+.05,z],[u1-.05,v1-.05,z],[u0+.05,v1-.05,z]],'#8A6440');
      for(let u=u0+.12;u<u1-.06;u+=.14){const p=lp(sx,sy,u,v0+.1,z+.9),q=lp(sx,sy,u,v1-.1,z+.9);ctx.setLineDash([2.2,1.2]);ctx.strokeStyle='#A85E40';ctx.lineWidth=1.8;ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.setLineDash([]);ctx.lineCap='round';}}
    for(const[u,v]of[[u0,v1],[u1,v1]])post(sx,sy,u,v,0,sh,CM.post,.025);
    const[rx,ry,rex,rey]=W4((u0+u1)/2,(v0+v1)/2,(u1-u0)/2,(v1-v0)/2),rf=RF(t,'#6E4A2E');roofW(sx,sy,rx,ry,rex,rey,sh,6,WF('v')==='y'?'y':'x',rf.rc,rf.rp,GWALL(t),Math.min(t,2),{});
    const[mx,my]=lp(sx,sy,-.65,.62,0);ell(mx,my-1,8,3.6,'#8E5E3E');ell(mx-1.5,my-2.6,5,2.4,'#A86F4A');
    /* Ziegelhagen: luftig gestapelte Rohlinge zum Trocknen */
    for(const v of[.5,.78].slice(0,t>=1?2:1)){lbox(sx,sy,.55,v,.3,.06,6,'#C98A66');for(let z=1;z<6;z+=1.6)for(let u=.3+(z%3.2>1?.04:0);u<.82;u+=.08){lq(sx,sy,[[u,v+.06,z],[u+.035,v+.06,z],[u+.035,v+.06,z+.8],[u,v+.06,z+.8]],'#7A3E28');}}
    for(let k=0;k<1+t;k++)lbox(sx,sy,-.1,.75,.12,.07,1.6,k%2?'#A85E40':'#C07756',k*1.6);},
  l(sx,sy,b,tt){if(!b.run)return;const o=this.p(b.lvl);if(o.t>=1){const[x,y]=lp(sx,sy,o.cu-.02,o.cv-.05,o.h+o.ch+2);smk(x,y,3,tt,1);}else{const[x,y]=lp(sx,sy,o.cu,o.cv,o.h);smk(x,y,2,tt,1);}
    if(!RB)for(const d of[-.16,.16]){const[x,y]=lp(sx,sy,o.cu+d,o.cv+o.ev,1.5);glow(x,y,1.6,tt,d*10);}},
  h(lv){const o=this.p(lv);return o.h+o.ch+2;}};
SHP.webstuhl={p(lv){const t=TIER(lv),g=Math.min(1.2,1+(lv-1)*.03);return{t,cu:-.34,cv:-.3,eu:.4*g,ev:.4*g,h:[11,11,12,13][t],rh:[12,12,12,13][t],ax:'u',col:'#A88A66',...RF(t,'#5C7246'),du:-.2};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t,u0=o.cu+o.eu,u1=.92,v0=-.72,v1=-.46,zh=o.h,zl=o.h-3.5,lu=(u0+u1)/2;
    hut(sx,sy,o,lit);
    inner(sx,sy,[[u0,v0,0],[u1,v0,0],[u1,v0,zl],[u0,v0,zh]],GWALL(t,o.col));post(sx,sy,u1,v0,0,zl,CM.post,.03);
    lbox(sx,sy,lu,.0,.16,.04,3,'#8A6440');
    for(const[u,v]of[[u1,v1],[u0+.02,v1]])post(sx,sy,u,v,0,u===u1?zl:zh,CM.post,.03);
    shed(sx,sy,u0,u1+.04,v0,v1+.04,zh,zl,'u',RF(t,'#5C7246').rc);
    const lv0=-.3,l0=u0+.06,l1=u1-.06,lh=17;
    ll(sx,sy,[l0,lv0,0],[l0,lv0-.06,lh],'#5A3B24',1.8);ll(sx,sy,[l1,lv0,0],[l1,lv0-.06,lh],'#5A3B24',1.8);ll(sx,sy,[l0-.03,lv0-.06,lh],[l1+.03,lv0-.06,lh],'#4A3222',2);
    const cl=[['#3F5E6B','#9A3224'],['#9A3224','#E7B54C'],['#3F5E6B','#E7DFC8'],['#7A2418','#D9A43A']][t];
    lq(sx,sy,[[l0+.02,lv0-.055,lh-1],[l1-.02,lv0-.055,lh-1],[l1-.02,lv0-.03,lh-7],[l0+.02,lv0-.03,lh-7]],cl[0]);
    for(const z of[lh-3,lh-5.5])ll(sx,sy,[l0+.02,lv0-.045,z],[l1-.02,lv0-.04,z],cl[1],1);
    for(let u=l0+.04;u<l1-.02;u+=.035)ll(sx,sy,[u,lv0-.03,lh-7],[u,lv0-.005,2.5],'rgba(240,232,214,.85)',.5);
    for(let u=l0+.05;u<l1-.02;u+=.07){const[x,y]=lp(sx,sy,u,lv0,2);ell(x,y,1,1,'#5E5852');}
    for(let k=0;k<2+t;k++)lbox(sx,sy,-.62,.62,.13,.05,1.4,['#3F5E6B','#E7DFC8','#9A3224','#C4862A','#5C7246'][k%5],k*1.4);
    const[wx,wy]=lp(sx,sy,.6,.62,0);cyl(wx,wy,3.6,4.5,'#A07A4E','#7A5636');for(let k=0;k<4;k++)ell(wx-1.8+k*1.2,wy-5-(k%2),1.6,1.2,'#F4F0E6');
    if(t>=2){const[x,y]=lp(sx,sy,.25,.72,0);ctx.strokeStyle='#5A3B24';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y-7,1.6,5.5,0,0,TAU);ctx.moveTo(x,y-7);ctx.lineTo(x+SG()*5,y);ctx.moveTo(x,y-1.5);ctx.lineTo(x-SG()*3,y);ctx.stroke();}},
  h(lv){const o=this.p(lv);return o.h+o.rh+2;}};
SHP.schneiderei={p(lv){const t=TIER(lv),g=Math.min(1.2,1+(lv-1)*.03);return{t,cu:-.3,cv:-.26,eu:.38*g,ev:.42*g,h:[12,13,15,17][t],rh:[13,13,14,15][t],ax:'v',fl:t>=2?2:1,col:'#B39270',...RF(t,'#7A2418'),du:-.3,shields:0};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t,su=.74,v0=-.62,v1=.42,z0=7,z1=[22,24,26,28][t];
    hut(sx,sy,o,lit);
    post(sx,sy,su,v0-.05,0,z1+2,'#5A3B24',.025);
    const sc=WF('u')==='y'?0:-.16,n=5;for(let k=0;k<n;k++){const a=v0+(v1-v0)*k/n,c=v0+(v1-v0)*(k+1)/n,bu=(k===0||k===n-1)?0:.04;lq(sx,sy,[[su,a,z1],[su,c,z1],[su+bu,c,z0+(k===n-1?1:0)],[su+bu,a,z0+(k===0?1:0)]],shade(k%2?'#F1E9DA':'#B03A2A',sc));}
    ll(sx,sy,[su,v0-.08,z1+.5],[su,v1+.08,z1+.5],'#4A3222',1.8);ll(sx,sy,[su,v0,z0],[su,v0-.05,0],'rgba(60,40,20,.6)',.6);ll(sx,sy,[su,v1,z0],[su,v1+.05,0],'rgba(60,40,20,.6)',.6);
    post(sx,sy,su,v1+.05,0,z1+2,'#5A3B24',.025);
    ll(sx,sy,[-.98,.62,0],[-.98,.62,12],CM.post,1.3);ll(sx,sy,[-.4,.62,0],[-.4,.62,12],CM.post,1.3);
    hang(sx,sy,[-.98,.62,11.5],[-.4,.62,11.5],2+t,'tunic',['#3F5E6B','#C4862A','#9A3224','#E7DFC8','#5C7246']);
    if(t>=1){const[x,y]=lp(sx,sy,.2,.62,0);ctx.fillStyle='#5A3B24';ctx.fillRect(x-.5,y-5,1,5);ctx.fillStyle='#9A3224';ctx.beginPath();ctx.roundRect(x-2.6,y-12,5.2,7,2);ctx.fill();ell(x,y-12.5,1.6,1,'#5A3B24');}},
  h(lv){const o=this.p(lv);return Math.max(o.h+o.rh+2,[22,24,26,28][o.t]+4);}};
SHP.metbrauerei={p(lv){const t=TIER(lv),g=Math.min(1.2,1+(lv-1)*.03);return{t,cu:-.36,cv:-.32,eu:.36*g,ev:.42*g,h:[11,11,12,13][t],rh:[12,12,12,13][t],ax:'v',col:'#A07A4E',...RF(t,'#5A3B24'),du:-.36,vr:[10,11,12,13][t]};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    if(t>=2){const[x,y]=lp(sx,sy,.62,-.55,0);ell(x,y,4,1.6,'#3B3532');cyl(x,y-2,5.5,6,'#B0603A','#7A3A22');ell(x,y-8,3.5,1.4,'#E7B54C');}
    hut(sx,sy,o,lit);
    const[vx,vy]=lp(sx,sy,.42,.1,0),r=o.vr,vh=r*.9;ell(vx+4,vy+2,r+3,r*.45,SHADOW);cyl(vx,vy,r,vh,'#8A5A32','#5A3B24');
    ctx.strokeStyle='rgba(40,24,12,.35)';ctx.lineWidth=.6;ctx.beginPath();for(let k=-3;k<=3;k++){const x=vx+k*r/4;ctx.moveTo(x,vy-vh+r*.45*Math.sqrt(1-(k/4)**2));ctx.lineTo(x,vy+r*.45*Math.sqrt(1-(k/4)**2));}ctx.stroke();
    hoops(vx,vy,r,[vh*.25,vh*.7],'#3B3532');ell(vx,vy-vh,r-1.5,(r-1.5)*.45,'#C9922E');ell(vx-r*.3,vy-vh-.4,r*.3,r*.1,'rgba(255,240,180,.5)');
    ctx.strokeStyle='#6E4A2E';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(vx+SG()*2,vy-vh);ctx.lineTo(vx+SG()*6,vy-vh-9);ctx.stroke();
    for(const[u,v,s]of[[-.72,.5,1],[-.55,.62,1],[-.38,.74,1],[-.62,.58,.9]].slice(0,t>=1?4:3)){const[x,y]=lp(sx,sy,u,v,s<1?6:0);barrel(x,y,s);}
    if(t>=1){const[x,y]=lp(sx,sy,.0,.55,0);ctx.fillStyle='#5A3B24';ctx.fillRect(x-.6,y-8,1.2,8);for(let k=0;k<3;k++)ell(x,y-9-k*2.2,3.6-k*.9,1.8,k%2?'#C9A060':'#D9B270');ell(x,y-8.6,.9,.8,'#3B3532');}},
  l(sx,sy,b,tt){if(!b.run)return;const o=this.p(b.lvl);const[x,y]=lp(sx,sy,.42,.1,o.vr*.9);smk(x,y,2,tt);},
  h(lv){const o=this.p(lv);return o.h+o.rh+2;}};
SHP.molkerei={p(lv){const t=TIER(lv),g=Math.min(1.2,1+(lv-1)*.03);return{t,cu:-.34,cv:-.34,eu:.4*g,ev:.36*g,h:[11,11,12,13][t],rh:[12,12,12,13][t],ax:'u',col:'#C8B79A',...RF(t,'#3F5E6B',1),du:-.2};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t,ru=.68,v0=-.78,v1=-.12;
    hut(sx,sy,o,lit);
    for(const v of[v0,v1])post(sx,sy,ru,v,0,13,CM.post,.022);
    for(const z of[3,7,11]){lbox(sx,sy,ru,(v0+v1)/2,.12,(v1-v0)/2,.8,'#8A6440',z);
      for(let v=v0+.1;v<v1-.04;v+=.15){const[x,y]=lp(sx,sy,ru+.04,v,z+.8);cyl(x,y,2.4,2,'#E7C25A','#F4D978');}}
    lbox(sx,sy,ru,(v0+v1)/2,.16,(v1-v0)/2+.05,1,shade(RF(t,'#3F5E6B').rc,0),13.5);
    lbox(sx,sy,-.62,.62,.2,.08,2.8,'#7A5636');lq(sx,sy,[[-.8,.56,2.85],[-.44,.56,2.85],[-.44,.68,2.85],[-.8,.68,2.85]],'#7FA2AA');
    const n=[3,4,5,6][t];for(let k=0;k<n;k++){const[x,y]=lp(sx,sy,.12+k*.13,.58+(k%2)*.1,0);cyl(x,y,2.4,6.5,'#C9CDCB','#E2E4E0');ell(x,y-6.8,1.4,.6,'#5E5852');ctx.strokeStyle='#8C979C';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-2.4,y-5);ctx.lineTo(x-3.2,y-4);ctx.stroke();}
    if(t>=2){const[x,y]=lp(sx,sy,-.05,.55,0);ctx.fillStyle='#5A3B24';ctx.fillRect(x-.6,y-10,1.2,10);ell(x,y-11,4,3,'#F1ECE0');ell(x-1.5,y-11.5,1.4,1.2,'#3B3532');ell(x,y-9.4,1.6,1,'#E7A8A0');}},
  h(lv){const o=this.p(lv);return o.h+o.rh+2;}};
SHP.gerberei={p(lv){const t=TIER(lv),g=Math.min(1.25,1+(lv-1)*.035);return{t,cu:-.12,cv:-.58,eu:.5*g,ev:.3,h:[11,11,12,13][t],rh:[9,10,10,11][t],ax:'u',col:'#8B6A48',...RF(t,'#4E4A46'),du:-.1};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    hut(sx,sy,o,lit);
    const pits=[[-.72,0],[-.38,0],[-.72,.36],[-.38,.36],[-.72,.72]].slice(0,[2,3,4,5][t]),liq=['#7A5A2E','#A88438','#8A4A2E','#5A4630','#9C7A3A'],rim=t>=2?'#A7A89E':'#8A6440';
    pits.forEach(([u,v],k)=>{const e=.14;lq(sx,sy,[[u-e,v-e,0],[u+e,v-e,0],[u+e,v+e,0],[u-e,v+e,0]],rim);lq(sx,sy,[[u-e+.03,v-e+.03,0],[u+e-.03,v-e+.03,0],[u+e-.03,v+e-.03,0],[u-e+.03,v+e-.03,0]],shade(rim,-.4));
      lq(sx,sy,[[u-e+.04,v-e+.06,-.5],[u+e-.03,v-e+.06,-.5],[u+e-.03,v+e-.03,-.5],[u-e+.04,v+e-.03,-.5]],liq[k]);const[x,y]=lp(sx,sy,u-.03,v,0);ell(x,y,1.6,.6,'rgba(255,255,255,.25)');});
    if(t>=1){ll(sx,sy,[-.75,.18,0],[-.75,.18,2],'#5A3B24',1);const[x,y]=lp(sx,sy,-.55,.18,0);ctx.strokeStyle='#6E4A2E';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+SG()*3,y-11);ctx.stroke();}
    hideFrame(sx,sy,.42,.0,.5,13,'#C49A6A');hideFrame(sx,sy,.8,-.1,.45,12,'#9C6B42');if(t>=2)hideFrame(sx,sy,.6,-.55,-.15,11,'#B98454');
    for(let k=0;k<1+t;k++)lbox(sx,sy,.1,.72,.12,.08,.9,k%2?'#8A5A32':'#A07040',k*.9);},
  h(lv){const o=this.p(lv);return o.h+o.rh+2;}};
SHP.taverne={p(lv){const t=TIER(lv),g=Math.min(1.25,1+(lv-1)*.035);return{t,cu:0,cv:-.15,eu:1.02*g,ev:.48*g,h:[11,12,14,15][t],rh:[18,18,19,21][t],ax:'u',col:'#7A5636',...RF(t,'#3E3A36'),du:0,wide:1,dragon:1,shields:1};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t;
    hut(sx,sy,o,lit);
    for(const[u,v,s]of[[1.18,.55,1.1],[1.3,.72,1.1],[1.05,.75,1],[1.2,.66,1]].slice(0,2+Math.min(2,t))){const[x,y]=lp(sx,sy,u,v,s<1.1&&u===1.2?7:0);barrel(x,y,s);}
    const[sx2,sy2]=lp(sx,sy,-.32,o.cv+o.ev+.22,0);ctx.fillStyle='#4A3222';ctx.fillRect(sx2-.7,sy2-15,1.4,15);ctx.fillRect(sx2-.7,sy2-15,SG()*6,1.2);
    ctx.fillStyle='#A07A4E';ctx.fillRect(sx2+SG()*4-3.5,sy2-13.5,7,5.5);ctx.strokeStyle='#E7DFC8';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(sx2+SG()*4-2.4,sy2-12.4);ctx.quadraticCurveTo(sx2+SG()*4,sy2-8,sx2+SG()*4+2.4,sy2-11.2);ctx.stroke();
    if(t>=1){lbox(sx,sy,-.85,.95,.3,.07,4,'#8A6440');lbox(sx,sy,-.85,1.12,.3,.04,2.2,'#7A5636');}
    if(t>=2){const[x,y]=lp(sx,sy,.55,1.0,0);ctx.strokeStyle='#3B3532';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x,y-6);ctx.lineTo(x+3,y);ctx.stroke();ell(x,y-6,4,1.6,'#3B3532');}
    if(t===3)for(const u of[-.6,.6]){const[x,y]=lp(sx,sy,u,o.cv+o.ev,o.h-1.5);ctx.fillStyle='#9A3224';ctx.fillRect(x-2,y,4,8);ctx.fillStyle=CM.gold;ctx.fillRect(x-2,y+2,4,1);}},
  l(sx,sy,b,tt){const o=this.p(b.lvl);const[x,y]=lp(sx,sy,0,o.cv,o.h+o.rh+1);smk(x,y,2,tt);if(o.t>=2&&b.run){const[a,c]=lp(sx,sy,.55,1.0,6.5);glow(a,c-1,1.8,tt,4);}},
  h(lv){const o=this.p(lv);return o.h+o.rh+10;}};
SHP.bauhuette={p(lv){const t=TIER(lv),g=Math.min(1.2,1+(lv-1)*.03);return{t,cu:-.3,cv:-.38,eu:.3*g,ev:.32*g,h:[11,11,12,13][t],rh:[10,10,11,11][t],ax:'v',col:'#C49A62',...RF(t,'#C4862A'),du:-.3,ch:[24,30,34,38][t]};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t,mu=.55,mv=-.5;
    hut(sx,sy,o,lit);
    if(t===0){const ap=[mu,mv+.1,o.ch];for(const[u,v]of[[mu-.22,mv-.12],[mu+.2,mv-.1],[mu,mv+.38]])ll(sx,sy,[u,v,0],ap,'#7A5636',1.6);}
    else{const tp=this.tip(o);post(sx,sy,mu,mv,0,o.ch,'#7A5636',.04);ll(sx,sy,[mu,mv,o.ch*.5],tp,'#6E4A2E',2.4);ll(sx,sy,[mu,mv,o.ch],[(mu+tp[0])/2,(mv+tp[1])/2,(o.ch*.5+tp[2])/2],'#6E4A2E',1.3);ll(sx,sy,[mu,mv,o.ch+1],tp,'#4A3222',.7);for(const s2 of[-1,1])ll(sx,sy,[mu+s2*.2,mv-.15,0],[mu,mv,o.ch*.35],'#6E4A2E',1.3);
      lbox(sx,sy,mu,mv,.12,.1,3,'#8A6440');
      if(t>=2)wheel(sx,sy,mu+.16,mv,8.5,8,0,'#8A6440');}
    for(let r=0;r<2+Math.min(t,2);r++)for(let k=0;k<3-r%2;k++)lbox(sx,sy,.42+(k-(r%2?.5:1))*.11,.68,.05,.28,2.4,r%2?'#C49A62':'#B58A5A',r*2.4);
    const sc=[[-.85,.1],[-.85,.65],[-.45,.65]];for(const[u,v]of sc)ll(sx,sy,[u,v,0],[u,v,16],'#8A6440',1.3);for(const z of[6,12]){ll(sx,sy,[-.85,.1,z],[-.85,.65,z],'#A88050',1.6);ll(sx,sy,[-.85,.65,z],[-.45,.65,z],'#A88050',1.6);}ll(sx,sy,[-.85,.65,0],[-.45,.65,12],'rgba(122,86,54,.7)',.8);
    if(t>=2)for(const[u,v]of[[-.15,.8],[.0,.86]])lbox(sx,sy,u,v,.06,.05,4,'#A7A89E');},
  l(sx,sy,b,tt){const o=this.p(b.lvl),mu=.55,mv=-.5,tip=o.t===0?[mu,mv+.1,o.ch]:this.tip(o),sw=Math.sin(tt*1.4)*(b.run?.05:.015),lo=o.t===0?6:9;
    const a=lp(sx,sy,...tip),c=lp(sx,sy,tip[0]+sw,tip[1],lo);ctx.strokeStyle='#3B3532';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(c[0],c[1]);ctx.stroke();
    if(o.t===0){ctx.fillStyle='#A7A89E';ctx.fillRect(c[0]-3,c[1],6,4);}else{ctx.save();ctx.translate(c[0],c[1]);ctx.fillStyle='#B58A5A';ctx.beginPath();ctx.moveTo(-8,1);ctx.lineTo(8,-3);ctx.lineTo(8,-1);ctx.lineTo(-8,3);ctx.fill();ctx.restore();}},
  tip:o=>[.68,.25,o.ch+10],
  h(lv){return this.p(lv).ch+14;}};
SHP.lager={p(lv){const t=TIER(lv),g=Math.min(1.25,1+(lv-1)*.035);return{t,cu:-.05,cv:-.12,eu:.55*g,ev:.6*g,h:[12,13,14,15][t],rh:[16,17,18,19][t],ax:'v',col:'#8E3A2A',...RF(t,'#5A3B24'),door:false};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t,fv=o.cv+o.ev,H=o.h;
    hut(sx,sy,o,lit);
    const fy=WF('v')==='y',dc=shade('#5A3B24',fy?0:-.25);
    if(!RB){for(const s of[-1,1]){const a=o.cu+s*.005,c=o.cu+s*.21;lq(sx,sy,[[a,fv,0],[c,fv,0],[c,fv,DOORH],[a,fv,DOORH]],dc);ll(sx,sy,[a,fv,.5],[c,fv,DOORH-.5],shade('#8A6440',fy?0:-.25),.9);ll(sx,sy,[c,fv,.5],[a,fv,DOORH-.5],shade('#8A6440',fy?0:-.25),.9);}
      lq(sx,sy,[[o.cu-.23,fv,DOORH],[o.cu+.23,fv,DOORH],[o.cu+.23,fv,DOORH+1.3],[o.cu-.23,fv,DOORH+1.3]],'#7A5636');for(const s of[-1,1])ll(sx,sy,[o.cu+s*.235,fv,0],[o.cu+s*.235,fv,DOORH+1.3],'#E8E0D0',1);}
    lq(sx,sy,[[o.cu-.09,fv,H+1.5],[o.cu+.09,fv,H+1.5],[o.cu+.09,fv,H+8],[o.cu-.09,fv,H+8]],'#2E241C');const[hx,hy]=lp(sx,sy,o.cu,fv,H+2);ell(hx,hy,3.6,1.6,'#E2C46A');ell(hx-1,hy-1.4,2,1,'#F0D68A');
    ll(sx,sy,[o.cu,fv-.05,H+o.rh*.62],[o.cu,fv+.16,H+o.rh*.62],'#4A3222',1.8);const[px,py]=lp(sx,sy,o.cu,fv+.15,H+o.rh*.62-1);ctx.strokeStyle='#3B3532';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py+9);ctx.stroke();ell(px,py,1.2,1.2,'#3B3532');
    if(t>=2){const u0=o.cu+o.eu,u1=.95;shed(sx,sy,u0,u1,-.7,.45,H-1,H-5,'u',o.rc);for(const v of[-.7,.45])post(sx,sy,u1-.03,v,0,H-5,CM.post,.025);}
    crate(sx,sy,.82,.62,.07,0);crate(sx,sy,.82,.78,.06,0);crate(sx,sy,.82,.66,.055,5.6);
    const[x,y]=lp(sx,sy,-.75,.75,0);sack(x,y);sack(x+5,y+1.5,'#CDBE98');sack(x+2,y-3.5);
    if(t>=1){const[a,c]=lp(sx,sy,-.82,.3,0);barrel(a,c);}},
  h(lv){const o=this.p(lv);return o.h+o.rh+2;}};
SHP.turm={p(lv){const t=TIER(lv);return{t,e:.17,h:22+lv*2};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t,e=o.e,h=o.h,[ex,ey]=[e,e];
    shadowBox(sx,sy,e+.05,e+.05,h+16);
    const sb=t===1?h*.55:h;walls(sx,sy,e,e,sb,'#8B8F8A','stone');if(sb<h){walls(sx,sy,e,e,h-sb,CM.plas,'',sb);fachwerk(sx,sy,0,0,e,e,h-sb,sb);}
    for(const f of['y','x'])for(const z of[h*.35,h*.62]){const L=f==='y'?[[-.012,e,z],[.012,e,z],[.012,e,z+4],[-.012,e,z+4]]:[[e,.012,z],[e,-.012,z],[e,-.012,z+4],[e,.012,z+4]];pq(sx,sy,L,'#2A2624');}
    if(!RB)door(sx,sy,WF('v'),0,e,e,DOORH,0,0);
    const g=e+.06,hz=h,hh=7,hc=t>=3?CM.hall:t===2?'#8C8A84':'#7A5636';
    for(const k of[-1,0,1]){pl(sx,sy,[k*e*.7,g,hz-2.5],[k*e*.7,e,hz-4],'#4A3222',1.2);pl(sx,sy,[g,k*e*.7,hz-2.5],[e,k*e*.7,hz-4],'#3B2A1E',1.2);}
    walls(sx,sy,g,g,hh,hc,t===2?'stone':'wood',hz);
    for(const f of['y','x'])for(const c of[-.08,.08]){const L=f==='y'?[[c-.015,g,hz+2],[c+.015,g,hz+2],[c+.015,g,hz+5.5],[c-.015,g,hz+5.5]]:[[g,c+.015,hz+2],[g,c-.015,hz+2],[g,c-.015,hz+5.5],[g,c+.015,hz+5.5]];pq(sx,sy,L,lit?'#FFCE6E':'#1E1C1A');}
    if(t===3)pl(sx,sy,[-g,g,hz+hh-1],[g,g,hz+hh-1],CM.gold,1);
    pyr(sx,sy,0,0,g+.05,hz+hh,t>=2?15:13,t===3?'#4A4440':'#9A3224',1);
    if(t===3){const[x,y]=spt(sx,sy,0,0,hz+hh+15);ell(x,y,1.6,1.6,CM.gold);}},
  l(sx,sy,b,tt){const o=this.p(b.lvl),[x,y]=spt(sx,sy,0,0,o.h+7+(o.t>=2?15:13));ctx.fillStyle='#3B3532';ctx.fillRect(x-.6,y-10,1.2,10);const w=Math.sin(tt*3.3)*1.5;ctx.fillStyle='#B03A2A';ctx.beginPath();ctx.moveTo(x+.6,y-10);ctx.lineTo(x+9+w,y-7.5);ctx.lineTo(x+.6,y-5);ctx.fill();},
  h(lv){const o=this.p(lv);return o.h+7+(o.t>=2?15:13)+10;}};
SHP.bogenposten={p(lv){const t=TIER(lv);return{t,e:.17,h:14+lv*1.4};},
  b(sx,sy,b,lit){const o=this.p(b.lvl),t=o.t,e=o.e,h=o.h,g=e+.05;
    shadowBox(sx,sy,g,g,h+8);
    const base=t>=2?h*.45:0;if(base){walls(sx,sy,e+.02,e+.02,base,'#8B8F8A','stone');pq(sx,sy,[[-e-.02,-e-.02,base],[e+.02,-e-.02,base],[e+.02,e+.02,base],[-e-.02,e+.02,base]],'#A7A89E');}
    for(const[u,v]of[[-e,-e],[e,-e],[-e,e],[e,e]])post(sx,sy,u,v,base,h,'#7A5636',.025);
    const bc='#6E4A2E';ll(sx,sy,[-e,e,base+1],[e,e,h-1],bc,1);ll(sx,sy,[e,e,base+1],[-e,e,h-1],bc,1);ll(sx,sy,[e,e,base+1],[e,-e,h-1],shade(bc,-.3),1);ll(sx,sy,[e,-e,base+1],[e,e,h-1],shade(bc,-.3),1);
    if(!RB){for(const s of[-1,1])ll(sx,sy,[s*.045,e+.06,0],[s*.045,e+.02,h],'#8A6440',1);for(let z=2;z<h;z+=2.6)ll(sx,sy,[-.045,e+.055,z],[.045,e+.055,z],'#8A6440',.9);}
    lbox(sx,sy,0,0,g,g,2,'#8A6440',h);
    const stake=(a,b2,col)=>{for(let k=0;k<=6;k++){const f=k/6,u=a[0]+(b2[0]-a[0])*f,v=a[1]+(b2[1]-a[1])*f;const[x,y]=lp(sx,sy,u,v,h+2);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x-1.2,y);ctx.lineTo(x-1.2,y-5.5);ctx.lineTo(x,y-7);ctx.lineTo(x+1.2,y-5.5);ctx.lineTo(x+1.2,y);ctx.fill();}};
    stake([-g,-g],[g,-g],'#6E5236');stake([-g,-g],[-g,g],'#7A5C3A');
    const[fx,fy]=lp(sx,sy,0,0,h+2);figure(fx,fy,'#5C7246');ctx.strokeStyle='#4A3222';ctx.lineWidth=.9;ctx.beginPath();ctx.arc(fx+SG()*3,fy-7,4,-1.2,1.2);ctx.stroke();
    stake([g,-g],[g,g],'#6E5236');stake([-g,g],[g,g],'#8F6C46');
    if(t>=1){for(const[u,v]of[[-g,g],[g,g],[g,-g]])ll(sx,sy,[u,v,h+2],[u,v,h+16],'#5A3B24',1);pyr(sx,sy,0,0,g+.04,h+16,9,t===3?'#4A4440':'#5C7246',1);}},
  l(sx,sy,b,tt){if(TIER(b.lvl)<3)return;const o=this.p(b.lvl),[x,y]=spt(sx,sy,0,0,o.h+25);ctx.fillStyle='#3B3532';ctx.fillRect(x-.6,y-8,1.2,8);flag(x,y-8,tt,'#5C7246');},
  h(lv){const o=this.p(lv);return o.h+(o.t>=1?27:10);}};
/* Einstieg aus 05-draw-buildings.js: true, wenn die Art hier gezeichnet wurde */
function shapeB(sx,sy,b,lit,n){const X=SHP[b.type];if(!X)return false;const r=rotOf(b);RM=r%2;RB=r>=2?1:0;try{X.b(sx,sy,b,lit,n);}finally{RM=RB=0;}return true;}
function shapeL(sx,sy,b,n){const X=SHP[b.type];if(!X)return false;if(X.l){const r=rotOf(b);RM=r%2;RB=r>=2?1:0;try{X.l(sx,sy,b,T0/1000,n);}finally{RM=RB=0;}}return true;}
function shapeH(b){const X=SHP[b.type];return X?X.h(b.lvl):0;}
