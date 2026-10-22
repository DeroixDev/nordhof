/* ---------- Wege auf dem Boden ---------- */
/* Ein Weg ist ein Mittelstück mit Armen zu jedem Nachbarweg und zur Tür eines anliegenden Gebäudes. Gezeichnet in vier Lagen: weicher Rand, Bordstein, Belag, Kleinkram. */
function roadArms(x,y){const a=[],me=idx(x,y);for(const[dx,dy]of N4){const xx=x+dx,yy=y+dy;if(!inb(xx,yy))continue;const T=S.tiles[idx(xx,yy)];
  if(T.rd)a.push([dx,dy]);else if(T.o!==undefined&&S.tiles[T.o].b&&doorTile(T.o)===me)a.push([dx,dy,1]);}return a;}
function roadShape(sx,sy,arms,w){
  /* alle Teilflächen gleich herum, damit Überlappungen nicht als Loch ausgespart werden */
  const P=L=>{let A=0;for(let k=0;k<L.length;k++){const p=L[k],q=L[(k+1)%L.length];A+=p[0]*q[1]-q[0]*p[1];}if(A<0)L=L.slice().reverse();for(let k=0;k<L.length;k++){const[u,v]=L[k],px=sx+(u-v)*TW/2,py=sy+(u+v)*TH/2;if(k)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.closePath();};
  const c=w*.42;P([[-w+c,-w],[w-c,-w],[w,-w+c],[w,w-c],[w-c,w],[-w+c,w],[-w,w-c],[-w,-w+c]]);
  for(const[dx,dy]of arms){const e=.52;if(dx)P([[0,-w],[dx*e,-w],[dx*e,w],[0,w]]);else P([[-w,0],[w,0],[w,dy*e],[-w,dy*e]]);}
}
function roadTile(x,y,ps){
  const i=idx(x,y),T=S.tiles[i];if(T.t==='water')return;
  const R=ROADS[T.rd],[sx,sy]=tilePos(x,y),arms=roadArms(x,y),w=arms.length?R.w:R.w+.05;
  if(ps===0){for(const[e,a]of[[.14,.1],[.07,.16]]){ctx.beginPath();roadShape(sx,sy,arms,w+e);ctx.fillStyle='rgba(105,88,58,'+a+')';ctx.fill();}return;}
  if(ps===1){if(T.rd>1){ctx.beginPath();roadShape(sx,sy,arms,w+(T.rd===3?.035:.025));ctx.fillStyle=T.rd===3?'#77736A':'#9C9584';ctx.fill();}return;}
  if(ps===2){ctx.beginPath();roadShape(sx,sy,arms,w);ctx.fillStyle=R.c;ctx.fill();return;}
  const r=rng(S.seed*7+i*131),pt=()=>spt(sx,sy,(r()*2-1)*w*.85,(r()*2-1)*w*.85,0);
  const seg=(a,b)=>{const p=spt(sx,sy,a[0],a[1],0),q=spt(sx,sy,b[0],b[1],0);ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);};
  if(T.rd===1){for(let k=0;k<7;k++){const[px,py]=pt();ell(px,py,1.3,.6,k%2?'rgba(120,96,62,.45)':'rgba(214,196,156,.55)');}
    ctx.strokeStyle='rgba(110,88,56,.3)';ctx.lineWidth=.9;ctx.beginPath();
    for(const[dx,dy]of arms.length?arms:[[1,0]])for(const s of[-.08,.08]){if(dx)seg([0,s],[dx*.5,s]);else seg([s,0],[s,dy*.5]);}ctx.stroke();
    if(r()<.5){const[px,py]=pt();ctx.strokeStyle='rgba(90,120,60,.5)';ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-.6,py-2.2);ctx.moveTo(px+.8,py);ctx.lineTo(px+1.2,py-2);ctx.stroke();}}
  else if(T.rd===2){for(let k=0;k<16;k++){const[px,py]=pt();ell(px,py,.9,.5,['#8E887A','#D6D1C4','#A39C8C'][k%3]);}}
  else{ctx.strokeStyle='rgba(70,66,58,.35)';ctx.lineWidth=.6;ctx.beginPath();
    for(let t=-w+.09;t<w;t+=.09){seg([t,-w],[t,w]);seg([-w,t],[w,t]);}
    for(const[dx,dy]of arms)for(let t=w+.02;t<.5;t+=.09){if(dx)seg([dx*t,-w],[dx*t,w]);else seg([-w,dy*t],[w,dy*t]);}
    ctx.stroke();for(let k=0;k<5;k++){const[px,py]=pt();ell(px,py,1.6,.8,'rgba(255,255,255,.12)');}}
}
/* Brücke über schmales Wasser: Bohlen, Balken, Geländer */
function drawBridge(i,sx,sy){
  const x=i%N,y=(i/N)|0,isL=(xx,yy)=>inb(xx,yy)&&(S.tiles[idx(xx,yy)].t!=='water'||!!S.tiles[idx(xx,yy)].rd);
  const ax=(isL(x-1,y)||isL(x+1,y))&&!(isL(x,y-1)&&isL(x,y+1)&&!(isL(x-1,y)&&isL(x+1,y)));
  const M=(u,v,h)=>ax?[u,v,h]:[v,u,h],w=.26,z=3;
  pq(sx,sy+3,[M(-.52,-w,0),M(.52,-w,0),M(.52,w,0),M(-.52,w,0)],'rgba(20,40,50,.18)');
  for(const u of[-.3,.3])for(const v of[-w+.03,w-.03]){const[px,py]=spt(sx,sy,...M(u,v,0));ctx.fillStyle='#4A3222';ctx.fillRect(px-1,py-z,2,z+5);}
  pq(sx,sy,[M(-.52,w,z),M(.52,w,z),M(.52,w,z-1.6),M(-.52,w,z-1.6)],ax?'#6E5236':'#5A4430');pq(sx,sy,[M(.52,-w,z),M(.52,w,z),M(.52,w,z-1.6),M(.52,-w,z-1.6)],ax?'#5A4430':'#6E5236');
  pq(sx,sy,[M(-.52,-w,z),M(.52,-w,z),M(.52,w,z),M(-.52,w,z)],'#A68560');
  for(let u=-.48;u<.5;u+=.08)pl(sx,sy,M(u,-w,z),M(u,w,z),'rgba(70,46,26,.4)',.6);
  for(const v of[-w,w]){for(const u of[-.45,0,.45])pl(sx,sy,M(u,v,z),M(u,v,z+5),'#5A3B24',1.1);pl(sx,sy,M(-.5,v,z+5),M(.5,v,z+5),'#7A5636',1.3);}
}
/* Vorschaubild für die Bauleiste */
const RTHUMB={};
function roadThumb(lv){
  if(RTHUMB[lv])return RTHUMB[lv];
  const c=mkc(180,170,g=>{const keep=ctx;ctx=g;g.lineJoin='round';g.lineCap='round';
    try{g.setTransform(1.7,0,0,1.7,90,98);FK=1;
      pq(0,0,[[-.5,.5,0],[.5,.5,0],[.5,.5,-10],[-.5,.5,-10]],'#9C8762');pq(0,0,[[.5,.5,0],[.5,-.5,0],[.5,-.5,-10],[.5,.5,-10]],'#7A6A4A');
      pq(0,0,[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],'#A3B57E');
      if(lv===0){const R=ROADS[1];for(let ps=0;ps<3;ps++){ctx.beginPath();roadShape(0,0,[[1,0],[-1,0]],R.w+(ps===0?.1:0));ctx.fillStyle=ps===0?'rgba(105,88,58,.16)':R.c;if(ps!==1)ctx.fill();}
        L(g,[-30,-14,30,14],'#C9432F',7);L(g,[30,-14,-30,14],'#C9432F',7);}
      else{const R=ROADS[lv],arms=[[1,0],[-1,0],[0,1]];
        ctx.beginPath();roadShape(0,0,arms,R.w+.1);ctx.fillStyle='rgba(105,88,58,.18)';ctx.fill();
        if(lv>1){ctx.beginPath();roadShape(0,0,arms,R.w+.035);ctx.fillStyle=lv===3?'#77736A':'#9C9584';ctx.fill();}
        ctx.beginPath();roadShape(0,0,arms,R.w);ctx.fillStyle=R.c;ctx.fill();
        const r=rng(lv*99);for(let k=0;k<14;k++){const[px,py]=spt(0,0,(r()*2-1)*R.w*.8,(r()*2-1)*.45,0);ell(px,py,1.2,.6,lv===3?'rgba(70,66,58,.35)':lv===2?'#8E887A':'rgba(120,96,62,.5)');}}
    }finally{ctx=keep;FK=1;}});
  return RTHUMB[lv]=c.toDataURL();
}
