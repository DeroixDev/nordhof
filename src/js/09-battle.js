/* ---------- Kampf um die Insel: live auf der großen Karte ---------- */
/* Plünderer landen an der Küste, suchen sich über das Gelände den Weg zu wertvollen Gebäuden, reißen Palisaden ein oder gehen außen herum.
   Türme, Bogenposten und der Hof schießen, Helden und Wachen laufen ihnen entgegen, die Leute flüchten in den Hof. Gitter, Wege und Figuren: 09b-defense.js */
/* Reichweite in Feldern, wächst mit jeder Stufe */
const RANGE={hof:2.6,turm:3.2,bogenposten:2.6};
function rangeOf(b){const r=RANGE[b.type];return r?r+.45*(b.lvl-1):0;}
function shotDmg(b){return b.type==='hof'?4:(B[b.type].dmg||0)*b.lvl;}
function bHP(b){const d=B[b.type];return 14+b.lvl*8+(d.hp||0)*b.lvl*2.5;}
/* Wert als Ziel: Lager und Hof zuerst, dann Werkstätten, Felder zuletzt. Mauern sind Hindernisse, keine Ziele */
function bVal(b){const d=B[b.type];if(isWall(b))return 0;if(d.kind==='store')return 10;if(b.type==='hof')return 9;if(d.kind==='craft')return 7;if(d.kind==='trans'||d.kind==='builder'||d.kind==='joy')return 5;
  if(d.kind==='prod')return d.st.s==='field'||d.st.s==='pasture'?2:4;if(d.kind==='def')return 2;return 3;}
const hash01=k=>{const s=Math.sin(k*12.9898)*43758.5453;return s-Math.floor(s);};
let battle=null,BID=0;
const RSP=.95;
/* auto: niemand hat das Horn geblasen, die Verteidiger kommen später und ohne Mut */
function openBattle(auto){
  if(!S.raid.pending||battle)return;
  const R=raiders(S.raid.n),n=Math.min(10,3+Math.floor(S.raid.n/2)),L=landingPoints(),horn=!auto,rs=[];
  const bt=battle={id:++BID,t:0,R,rs,L,n,horn,mut:horn?1.25:1,ready:horn?0:6,vh:0,vmax:0,arrows:[],fx:[],burnt:{},dmgB:{},wh:{},broke:[],plun:0,fire:1,boost:0,done:null,kills:0,
    gv:0,flows:new Map(),bad:new Set(),fb:1,pb:2,dps:R.dmg/n/1.1,hx:0,hy:0};
  bt.g=kGrid(bt);[bt.hx,bt.hy]=bCtr(S.hof);
  /* Lebenspunkte des Dorfes ohne die Mauern: die stehen jetzt selbst im Weg */
  let wl=0;for(const i of BL){const b=S.tiles[i].b;if(isWall(b)&&!b.hurt)wl+=(B[b.type].hp||0)*b.lvl;}bt.vh=bt.vmax=Math.max(40,D.hp-wl);
  for(let k=0;k<n;k++){const l=L[k%2];rs.push({id:k,x:l.bx+rand(-.3,.3),y:l.by+rand(-.3,.3),lx:l.x+rand(-.25,.25),ly:l.y+rand(-.25,.25),hp:R.hp/n,max:R.hp/n,dmg:R.dmg/n,st:'boat',wait:.8+k*.5,cd:rand(0,1),ph:rand(0,TAU),tgt:-1,at:-1,wa:-1,hit:-9,foe:null,loot:0});}
  bt.shooters=[];for(const i of BL){const b=S.tiles[i].b;if(RANGE[b.type]&&!b.hurt&&!(b.job==='build'&&busy(b)))bt.shooters.push({i,cd:rand(0,.6)});}
  bt.ds=mkDefs(bt);
  if(place)endPlace();if(tab!=='insel'){tab='insel';render();}
  closeModal();selectTile(-1);
  const[hx,hy]=bCtr(S.hof),cx=(L[0].x+L[1].x)/2*.5+hx*.5,cy=(L[0].y+L[1].y)/2*.5+hy*.5,[wx,wy]=tilePos(cx,cy);glideTo(wx,wy,Math.max(view.z,1));
  renderBattleHud();
  if(horn){sparks(S.hof);toast(IC('horn','i24')+'Das Horn ruft! '+bt.ds.length+' Verteidiger, alle anderen in den Hof.');}
  else toast(IC('schiff','i24')+'Plünderer landen!');
}
function fxNum(bt,x,y,h,col){if(bt.fx.length>40)return;const[sx,sy]=tilePos(x,y);bt.fx.push({x:sx+rand(-5,5),y:sy-24,t:bt.t,txt:'−'+Math.max(1,Math.round(h)),col});}
function hurtR(bt,r,h,col){if(r.st==='dead')return;r.hp-=h;r.hit=bt.t;fxNum(bt,r.x,r.y,h,col);if(r.hp<=0){r.st='dead';r.dieT=bt.t;r.foe=null;bt.kills++;}}
/* Wertvollstes erreichbares Ziel, mit etwas Eigensinn je Plünderer, damit sie sich verteilen */
function pickTarget(bt,r){let best=-1,bs=0;
  for(const i of BL){const b=S.tiles[i].b;if(bt.burnt[i]!==undefined||b.hurt||bt.bad.has(i)||(b.job==='build'&&busy(b)))continue;const v=bVal(b);if(!v)continue;
    const[cx,cy]=bCtr(i),s=v*(1+.08*b.lvl)/(6+Math.hypot(cx-r.x,cy-r.y))*(.7+.6*hash01(r.id*131+i+bt.id*7));if(s>bs){bs=s;best=i;}}
  return best;}
function stepTo(r,tx,ty,sp){const dx=tx-r.x,dy=ty-r.y,dd=Math.hypot(dx,dy);if(dd<1e-3)return 0;const v=Math.min(dd,sp);r.x+=dx/dd*v;r.y+=dy/dd*v;return dd-v;}
function hitWall(bt,r,a,dt){
  r.cd-=dt;if(r.cd>0)return;r.cd=1.1;const b=S.tiles[a].b;if(!b||b.hurt){bt.gv++;bt.g=kGrid(bt);return;}
  const h=r.dmg*rand(.85,1.15);bt.wh[a]=(bt.wh[a]!==undefined?bt.wh[a]:wallHP(b))-h;r.hit=bt.t;const[x,y]=bCtr(a);fxNum(bt,x,y,h,'#7A5636');
  if(bt.wh[a]<=0){b.hurt=1;bt.broke.push(a);bt.gv++;bt.g=kGrid(bt);dust(a);toast(IC('abriss','i24')+B[b.type].n+' eingerissen');}
}
function raiderStep(bt,r,dt){
  if(r.st==='dead')return;r.ph+=dt*9;
  if(r.st==='boat'){r.wait-=dt;if(r.wait<=0)r.st='land';return;}
  if(r.st==='land'){if(stepTo(r,r.lx,r.ly,dt*1.3)<.05)r.st='walk';return;}
  /* Nahkampf geht vor; an einer Mauer auch über die Mauer hinweg */
  const f=r.foe;if(f&&(f.st==='down'||Math.hypot(f.x-r.x,f.y-r.y)>(r.wa>=0?1.8:.85)))r.foe=null;
  if(r.foe){r.st='fight';r.fx=r.foe.x-r.x;r.cd-=dt;if(r.cd<=0){r.cd=1.1;const d=r.foe,h=r.dmg*rand(.85,1.15);d.hp-=h;d.hit=bt.t;r.swing=bt.t;fxNum(bt,d.x,d.y,h,'#B03A2A');if(d.hp<=0){d.st='down';d.dieT=bt.t;r.foe=null;}}return;}
  r.wa=-1;r.fx=0;
  if(r.tgt>=0&&(bt.burnt[r.tgt]!==undefined||!S.tiles[r.tgt].b))r.tgt=-1;
  if(r.tgt<0){r.at=-1;r.tgt=pickTarget(bt,r);if(r.tgt<0){r.st='walk';stepTo(r,bt.hx,bt.hy,dt*RSP*.5);return;}}
  const b=S.tiles[r.tgt].b,[tx,ty]=bCtr(r.tgt),n=fpOf(b.type);
  if(r.at!==r.tgt){
    const fl=kFlow(bt,r.tgt);if(!fl)return;if(!fl.ok){bt.bad.add(r.tgt);r.tgt=-1;return;}
    const c=cellOf(r.x,r.y),g=bt.g;
    if(c>=0&&fl.d[c]===0)r.at=r.tgt;
    else{const nx=c>=0?kNext(bt,fl,c):-1;if(nx<0){bt.bad.add(r.tgt);r.tgt=-1;return;}
      if(g.Wl[nx]>=0){r.wa=g.Wl[nx];r.st='wall';const wx=nx%N,wy=(nx/N)|0,dd=Math.hypot(wx-r.x,wy-r.y);r.fx=wx-r.x;if(dd>.8)stepTo(r,wx,wy,Math.min(dt*RSP,dd-.78));else hitWall(bt,r,r.wa,dt);return;}
      r.st='walk';r.fx=(nx%N)-r.x;stepTo(r,nx%N,(nx/N)|0,dt*RSP/Math.max(.45,g.C[c]||1));return;}
  }
  /* Am Ziel: anlaufen, zuschlagen, anzünden */
  r.fx=tx-r.x;if(Math.hypot(tx-r.x,ty-r.y)>n/2+.3){r.st='walk';stepTo(r,tx,ty,dt*RSP*.6);return;}
  r.st='raid';r.cd-=dt;if(r.cd>0)return;r.cd=1.1;const h=r.dmg*rand(.85,1.15);bt.vh=Math.max(0,bt.vh-h);bt.dmgB[r.tgt]=(bt.dmgB[r.tgt]||0)+h;r.hit=bt.t;r.swing=bt.t;
  const[sx,sy]=bPos(r.tgt);if(bt.fx.length<40)bt.fx.push({x:sx+rand(-8,8),y:sy-30,t:bt.t,txt:'−'+Math.round(h),col:'#B03A2A'});
  if(bt.dmgB[r.tgt]>=bHP(b)){bt.burnt[r.tgt]=bt.t;b.hurt=1;if(B[b.type].kind==='store'||b.type==='hof'){bt.plun++;r.loot=1;}r.tgt=-1;r.at=-1;}
}
/* Figuren nicht übereinander: sanft auseinanderschieben, nur auf begehbare Felder */
function nudge(bt,o,dx,dy){const c=cellOf(o.x+dx,o.y+dy),A=o.k?bt.g.F:bt.g.C;if(c>=0&&A[c]>0&&bt.g.Wl[c]<0){o.x+=dx;o.y+=dy;}}
function separate(bt,dt){const L=[];for(const r of bt.rs)if(r.st!=='dead'&&r.st!=='boat'&&r.st!=='land')L.push(r);for(const d of bt.ds)if(d.st!=='down')L.push(d);
  const f=Math.min(1,dt*6);for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++){const p=L[a],q=L[b];let dx=q.x-p.x,dy=q.y-p.y,dd=dx*dx+dy*dy;if(dd>.1)continue;
    if(dd<1e-6){dx=rand(-.01,.01);dy=rand(-.01,.01);dd=dx*dx+dy*dy;}const d=Math.sqrt(dd),k=(.32-d)*.5*f/d;nudge(bt,p,-dx*k,-dy*k);nudge(bt,q,dx*k,dy*k);}}
function battleStep(dt){
  const bt=battle;if(!bt||bt.done||dt<=0)return;bt.t+=dt;bt.fb=1;bt.pb=2;
  for(const r of bt.rs)raiderStep(bt,r,dt);
  defStep(bt,dt);separate(bt,dt);
  const boost=bt.boost>bt.t?3:1;
  for(const sh of bt.shooters){
    const T=S.tiles[sh.i];if(!T.b||T.b.hurt||bt.burnt[sh.i]!==undefined)continue;sh.cd-=dt;if(sh.cd>0)continue;
    const rg=rangeOf(T.b),[x,y]=bCtr(sh.i);let best=null,bd=1e9;
    for(const r of bt.rs){if(r.st==='dead'||r.st==='boat')continue;const d=Math.hypot(r.x-x,r.y-y);if(d<=rg&&d<bd){bd=d;best=r;}}
    if(!best){sh.cd=.2;continue;}
    sh.cd=1.1/(boost>1?1.5:1);bt.arrows.push({from:sh.i,r:best,t0:bt.t,dur:.32+bd*.07,dmg:shotDmg(T.b)*rand(.85,1.15)*boost,fire:boost>1});
  }
  for(let k=bt.arrows.length-1;k>=0;k--){const a=bt.arrows[k];if(bt.t-a.t0<a.dur)continue;bt.arrows.splice(k,1);hurtR(bt,a.r,a.dmg,a.fire?'#E07B39':'#22343A');}
  for(let k=bt.fx.length-1;k>=0;k--)if(bt.t-bt.fx[k].t>=1)bt.fx.splice(k,1);
  if(bt.kills>=bt.rs.length)endBattle(true);else if(bt.vh<=0)endBattle(false);else if(bt.t>180)endBattle(bt.kills*2>=bt.rs.length);
}
function endBattle(win){
  const bt=battle,o=raidOutcome(win);
  /* Geplünderte Lager kosten auch beim Sieg Waren */
  if(win&&bt.plun){const f=Math.min(.12,.04*bt.plun);for(const k in RES)if(capped(k)&&S.res[k]>0){const l=Math.floor(S.res[k]*f);if(l>0){o.lost[k]=(o.lost[k]||0)+l;S.res[k]-=l;}}}
  const hurt=[];for(const i in bt.burnt){if(S.tiles[i].b){BURN[i]=T0+14000;hurt.push(+i);}}
  for(const a of bt.broke)if(!hurt.includes(a)&&S.tiles[a].b)hurt.push(a);
  for(const d of bt.ds)if(d.k==='held'&&d.st==='down')S.crew[d.ci].wounded=now()+10*60e3;
  o.hurt=hurt;o.fallen=bt.ds.filter(d=>d.st==='down').length;bt.done=o;bt.end=bt.t;derive();save();
  if(win)toast(IC('muenzen','i24')+'+'+o.coins);
  setTimeout(showBattleResult,win?900:1400);
}
function showBattleResult(){
  const bt=battle;if(!bt||!bt.done)return;const o=bt.done,l=Object.keys(o.lost),hurt=(o.hurt||[]).filter(i=>S.tiles[i].b&&S.tiles[i].b.hurt);
  let h='<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px">'+(o.win?IC('schild','i64'):IC('abriss','i64'))+'<h2>'+(o.win?'Verteidigt!':'Geplündert')+'</h2><p class="sub">Welle '+(S.raid.n+(o.win?0:1))+(bt.horn?' · das Horn hat gerufen':'')+'</p></div>';
  h+='<div class="gains" style="justify-content:center;margin-top:12px"><div>'+POR('raider',24)+bt.kills+' / '+bt.rs.length+'</div>'+(bt.ds.length?'<div>'+IC('schild','i24')+(bt.ds.length-o.fallen)+' / '+bt.ds.length+' stehen</div>':'')+'<div>'+IC('uhr','i24')+Math.round(bt.end)+' s</div></div>';
  if(o.win)h+='<div class="gains" style="justify-content:center;margin-top:8px"><div>'+IC('muenzen','i24')+'+'+o.coins+'</div>'+(o.silber?'<div>'+IC('silber','i24')+'+'+o.silber+'</div>':'')+'</div>';
  if(l.length){l.sort((a,b)=>o.lost[b]*RES[b].p-o.lost[a]*RES[a].p);const top=l.filter(k=>KNOWN.has(k)).slice(0,8),rest=l.length-top.length;
    h+='<h3 style="text-align:center">Verlorene Waren</h3><div class="gains" style="justify-content:center">'+top.map(k=>'<div>'+IC(k,'i24')+'−'+fmt(o.lost[k])+'</div>').join('')+(rest>0?'<div>+'+rest+' weitere</div>':'')+'</div>';}
  if(o.fallen&&bt.ds.some(d=>d.k==='held'&&d.st==='down'))h+='<p class="note" style="text-align:center">'+IC('herz','i16')+' Verwundet: '+bt.ds.filter(d=>d.k==='held'&&d.st==='down').map(d=>d.n).join(', ')+'. 10 Minuten keine Raubzüge.</p>';
  if(hurt.length){const c=repairAllCost();
    h+='<h3 style="text-align:center">Beschädigt</h3><div class="gains" style="justify-content:center">'+hurt.slice(0,8).map(i=>{const b=S.tiles[i].b;return '<div><img class="ico i24" src="'+thumb(b.type,b.lvl)+'" alt="">'+B[b.type].n+'</div>';}).join('')+(hurt.length>8?'<div>+'+(hurt.length-8)+'</div>':'')+'</div>'+
      '<div class="btns" style="justify-content:center"><button class="btn alt"'+btnCost(c)+' data-act="repairall">'+IC('arbeit','i16')+'Alles reparieren '+costHTML(c)+'</button></div>';}
  h+='<div class="btns"><button class="btn gold wide" data-act="closebattle">Weiter</button></div>';
  openModal(h);
}
function closeBattle(){battle=null;for(const v of vill)if(v.flee){v.flee=0;v.path=[];v.k=0;v.wait=rand(.3,2);}const e=$('#bhud');if(e)e.remove();closeModal();derive();render();}
function renderBattleHud(){
  let e=$('#bhud');if(!e){e=document.createElement('div');e.id='bhud';e.className='pn';$('#app').appendChild(e);}
  e.innerHTML='<div class="bh">'+IC('haus','i24')+'<div class="bar"><i id="bVH"></i></div><span class="n" id="bVHn"></span></div><div class="bh">'+IC('schild','i24')+'<span class="n" id="bDn"></span></div><div class="bh">'+POR('raider',24)+'<span class="n" id="bRn"></span></div>'+
    '<button class="btn red" id="bFire" data-act="fire">'+IC('feuer','i24')+'Brandpfeile</button>';
}
let hudTxt='';
function updBattleHud(){const bt=battle;if(!bt)return;const a=$('#bVH');if(!a)return;const dl=bt.ds.filter(d=>d.st!=='down').length,t=Math.ceil(bt.vh)+'|'+dl+'|'+bt.kills+'|'+!!bt.done+'|'+bt.fire;if(t===hudTxt)return;hudTxt=t;
  a.style.width=(bt.vh/bt.vmax*100)+'%';$('#bVHn').textContent=Math.ceil(bt.vh);$('#bDn').textContent=dl;$('#bRn').textContent=(bt.rs.length-bt.kills)+' / '+bt.rs.length;
  const f=$('#bFire');f.classList.toggle('off',!bt.fire||!!bt.done);if(bt.done)$('#bhud').classList.add('over');}
/* Zeichnen: Reichweiten auf dem Boden, Plünderer als Figuren, Pfeile, Feuer, Schadenszahlen */
function drawRange(i,alpha){const T=S.tiles[i],rg=rangeOf(T.b);if(!rg)return;drawRangeAt(...bCtr(i),rg,alpha);}
function drawRaider(r){
  const bt=battle,[sx,sy0]=tilePos(r.x,r.y);let sy=sy0;
  if(r.st==='dead'){const k=Math.min(1,(bt.t-r.dieT)/1.2);if(k>=1)return;ctx.globalAlpha=1-k;ctx.save();ctx.translate(sx,sy);ctx.rotate(-k*1.4);ctx.translate(-sx,-sy);}
  figAt(sx,sy);
  const mv=r.st==='walk'||r.st==='land',sw=mv?Math.sin(r.ph)*2.4:0,bob=mv?Math.abs(Math.sin(r.ph))*1.2:0,hitF=bt.t-r.hit<.15,fl=(r.fx||0)<0?-1:1;
  ell(sx,sy,4.5,2,'rgba(0,0,0,.2)');
  ctx.strokeStyle='#2F2724';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(sx-1.3,sy-5);ctx.lineTo(sx-1.3-sw*.6,sy);ctx.moveTo(sx+1.3,sy-5);ctx.lineTo(sx+1.3+sw*.6,sy);ctx.stroke();
  sy-=bob;
  if(r.loot){ell(sx+3*fl,sy-11,3.2,3.6,'#B9A07A');ell(sx+3*fl,sy-14,1.4,.8,'#8A6440');}
  ctx.fillStyle=hitF?'#FFFFFF':'#4A3B36';ctx.beginPath();ctx.roundRect(sx-3.6,sy-13,7.2,8.5,2);ctx.fill();
  ctx.fillStyle='#D9A982';ctx.beginPath();ctx.arc(sx,sy-15.6,2.9,0,TAU);ctx.fill();
  ctx.fillStyle='#2F2724';ctx.beginPath();ctx.ellipse(sx,sy-14.2,2.6,1.6,0,0,Math.PI);ctx.fill();
  ctx.fillStyle='#8C979C';ctx.beginPath();ctx.arc(sx,sy-16.6,3.1,Math.PI,0);ctx.fill();
  ctx.fillStyle='#F1E9DA';ctx.beginPath();ctx.moveTo(sx-3,sy-17.5);ctx.lineTo(sx-5.5,sy-21);ctx.lineTo(sx-2,sy-18.6);ctx.fill();ctx.beginPath();ctx.moveTo(sx+3,sy-17.5);ctx.lineTo(sx+5.5,sy-21);ctx.lineTo(sx+2,sy-18.6);ctx.fill();
  ell(sx-4*fl,sy-9,3.4,3.8,'#9A3224');ell(sx-4*fl,sy-9,1.1,1.2,'#C4862A');
  const busyA=r.st==='fight'||r.st==='raid'||r.st==='wall',sa=busyA?Math.sin((bt.t-(r.swing||0))*12)*.9:.3;
  ctx.save();ctx.translate(sx+3.5*fl,sy-10);ctx.scale(fl,1);ctx.rotate(-.6+sa);ctx.fillStyle='#5A3B24';ctx.fillRect(-.6,-8,1.2,8);ctx.fillStyle='#AEB8BC';ctx.beginPath();ctx.moveTo(-.6,-8);ctx.lineTo(3.4,-10);ctx.lineTo(3.4,-6);ctx.lineTo(-.6,-6.5);ctx.fill();ctx.restore();
  ctx.restore();
  if(r.st!=='dead'&&r.hp<r.max){const y=sy0-17;ctx.fillStyle='rgba(34,52,58,.8)';ctx.fillRect(sx-7,y,14,3);ctx.fillStyle='#C2452F';ctx.fillRect(sx-6.5,y+.5,13*Math.max(0,r.hp/r.max),2);}
  if(r.st==='dead'){ctx.restore();ctx.globalAlpha=1;}
}
function drawBattleTop(){
  const bt=battle;
  for(const i in bt.burnt){const bb=S.tiles[i].b,[sx,sy]=bb?bPos(+i):tilePos(i%N,(i/N)|0),h=bb?topH(bb)*.7:10;flames(sx,sy,h,1);smoke(sx,sy,h,1);}
  for(const a of bt.arrows){const p=Math.min(1,(bt.t-a.t0)/a.dur),i=a.from,bb=S.tiles[i].b,[x0,y00]=bb?bPos(i):tilePos(i%N,(i/N)|0),y0=y00-(bb?topH(bb)*.8:10),[x1,y10]=tilePos(a.r.x,a.r.y),y1=y10-6;
    const x=x0+(x1-x0)*p,y=y0+(y1-y0)*p-Math.sin(p*Math.PI)*22,ang=Math.atan2((y1-y0)-Math.cos(p*Math.PI)*22*Math.PI,x1-x0);
    ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.strokeStyle=a.fire?'#E07B39':'#3B3532';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(4,0);ctx.stroke();ctx.fillStyle='#EDE6D6';ctx.fillRect(-7,-1.2,2.4,2.4);if(a.fire){ell(4,0,2,2,'#F6CA52');}ctx.restore();}
  ctx.font='800 10px Work Sans, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#fff';
  for(const f of bt.fx){const k=(bt.t-f.t);ctx.globalAlpha=Math.max(0,1-k);ctx.strokeText(f.txt,f.x,f.y-k*16);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y-k*16);}ctx.globalAlpha=1;
}

function showReport(rep){
  const g=Object.keys(rep.gain).filter(k=>rep.gain[k]>0);
  let h='<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px">'+IC('uhr','i48')+'<h2>Willkommen zurück</h2><p class="sub">'+fmtT(rep.ms)+' weg'+(rep.ms>8*3600e3?', gezählt werden höchstens 8 h':'')+'</p></div>';
  if(g.length)h+='<div class="gains" style="justify-content:center;margin-top:14px">'+g.map((k,j)=>'<div style="animation-delay:'+(j*.06)+'s">'+IC(k,'i28')+'+'+fmt(rep.gain[k])+'</div>').join('')+'</div>';
  if(rep.done&&rep.done.length)h+='<div class="gains" style="justify-content:center;margin-top:10px">'+rep.done.map(([t,l])=>'<div><img class="ico i28" src="'+thumb(t,l)+'" alt="">'+B[t].n+(l>1?' '+l:'')+' fertig</div>').join('')+'</div>';
  if(rep.regs&&rep.regs.length)h+='<div class="gains" style="justify-content:center;margin-top:6px">'+rep.regs.map(r=>'<div>'+IC(REG[r].ic,'i28')+REG[r].n+' erkundet</div>').join('')+'</div>';
  if(rep.raids.length)h+='<div class="btns" style="justify-content:center">'+rep.raids.map(r=>'<span class="tag '+(r.win?'green':'red')+'">'+IC(r.win?'schild':'abriss','i16')+(r.win?'Überfall abgewehrt +'+r.coins:'Überfall: geplündert, Gebäude beschädigt')+'</span>').join('')+'</div>';
  h+='<div class="btns"><button class="btn gold wide" data-act="closemodal">Weiter</button></div>';
  openModal(h);
}
