
/* ---------- Kampf um die Insel: live auf der Karte ---------- */
/* Reichweite in Feldern, wächst mit jeder Stufe */
const RANGE={hof:2.6,turm:3.2,bogenposten:2.6};
function rangeOf(b){const r=RANGE[b.type];return r?r+.45*(b.lvl-1):0;}
function shotDmg(b){return b.type==='hof'?4:(B[b.type].dmg||0)*b.lvl;}
function bHP(b){const d=B[b.type];return 14+b.lvl*8+(d.hp||0)*b.lvl*2.5;}
let battle=null;
function landingPoints(){
  const pts=[];
  for(const a of[2.4,2.9]){const dx=Math.cos(a),dy=Math.sin(a);let last=null;
    for(let r=0;r<16;r+=.25){const x=Math.round(MID+dx*r),y=Math.round(MID+dy*r);if(!inb(x,y))break;const i=idx(x,y),T=S.tiles[i];
      if(T.t!=='water'&&unlocked(i)&&T.t!=='berg')last={x,y,i,a};else if(last&&(T.t==='water'||!unlocked(i)))break;}
    if(!last)last={x:MID,y:MID,i:idx(MID,MID),a};
    last.bx=last.x+dx*1.6;last.by=last.y+dy*1.6;pts.push(last);}
  return pts;
}
function openBattle(){
  if(!S.raid.pending||battle)return;
  const R=raiders(S.raid.n),n=Math.min(10,3+Math.floor(S.raid.n/2)),L=landingPoints(),rs=[];
  for(let k=0;k<n;k++){const l=L[k%2];rs.push({x:l.bx,y:l.by,lx:l.x+rand(-.3,.3),ly:l.y+rand(-.3,.3),hp:R.hp/n,max:R.hp/n,dmg:R.dmg/n,st:'land',wait:.6+k*.45,cd:rand(0,1),ph:rand(0,TAU),tgt:-1,hit:0});}
  const shooters=[];S.tiles.forEach((T,i)=>{if(T.b&&RANGE[T.b.type]&&!(T.b.job==='build'&&busy(T.b)))shooters.push({i,cd:rand(0,.6)});});
  battle={t:0,R,rs,L,shooters,vh:D.hp,vmax:D.hp,arrows:[],fx:[],burnt:{},dmgB:{},fire:1,boost:0,done:null,kills:0,n};
  if(tab!=='insel'){tab='insel';render();}
  $('#modal').hidden=true;selectTile(-1);
  view.z=Math.max(view.z,Math.min(1.5,W/(7*TW)));
  const cx=(L[0].x+L[1].x)/2*.6+MID*.4,cy=(L[0].y+L[1].y)/2*.6+MID*.4,[wx,wy]=tilePos(cx,cy);glide={x:-wx*view.z,y:-wy*view.z};
  renderBattleHud();toast(IC('schiff','i24')+'Plünderer landen!');
}
function nearestB(x,y,burnt){let best=-1,bd=1e9;S.tiles.forEach((T,i)=>{if(!T.b||burnt[i])return;const d=Math.hypot(i%N-x,((i/N)|0)-y);if(d<bd){bd=d;best=i;}});return best;}
function battleStep(dt){
  const b=battle;if(!b||b.done)return;b.t+=dt;
  for(const r of b.rs){
    if(r.st==='dead')continue;r.ph+=dt*9;
    if(r.st==='land'){r.wait-=dt;if(r.wait<=0){const p=Math.min(1,dt*1.4);r.x+=(r.lx-r.x)*p*2;r.y+=(r.ly-r.y)*p*2;if(Math.hypot(r.lx-r.x,r.ly-r.y)<.1)r.st='walk';}continue;}
    if(r.tgt<0||b.burnt[r.tgt]||!S.tiles[r.tgt].b)r.tgt=nearestB(r.x,r.y,b.burnt);
    if(r.tgt<0){r.st='walk';continue;}
    const tx=r.tgt%N+.32,ty=((r.tgt/N)|0)+.32,d=Math.hypot(tx-r.x,ty-r.y);
    if(d>.18){r.st='walk';const v=Math.min(d,dt*.95);r.x+=(tx-r.x)/d*v;r.y+=(ty-r.y)/d*v;}
    else{r.st='fight';r.cd-=dt;if(r.cd<=0){r.cd=1.1;const h=r.dmg*rand(.85,1.15);b.vh=Math.max(0,b.vh-h);b.dmgB[r.tgt]=(b.dmgB[r.tgt]||0)+h;r.hit=b.t;
        const[sx,sy]=tilePos(r.tgt%N,(r.tgt/N)|0);b.fx.push({k:'dmg',x:sx+rand(-8,8),y:sy-30,t:b.t,txt:'−'+Math.round(h),col:'#B03A2A'});
        if(b.dmgB[r.tgt]>=bHP(S.tiles[r.tgt].b)){b.burnt[r.tgt]=b.t;r.tgt=-1;}}}
  }
  const boost=b.boost>b.t?3:1;
  for(const sh of b.shooters){
    const T=S.tiles[sh.i];if(!T.b||b.burnt[sh.i])continue;sh.cd-=dt;if(sh.cd>0)continue;
    const rg=rangeOf(T.b),x=sh.i%N,y=(sh.i/N)|0;let best=null,bd=1e9;
    for(const r of b.rs){if(r.st==='dead'||r.st==='land'&&r.wait>0)continue;const d=Math.hypot(r.x-x,r.y-y);if(d<=rg&&d<bd){bd=d;best=r;}}
    if(!best){sh.cd=.2;continue;}
    sh.cd=1.1/(boost>1?1.5:1);b.arrows.push({from:sh.i,r:best,t0:b.t,dur:.32+bd*.07,dmg:shotDmg(T.b)*rand(.85,1.15)*boost,fire:boost>1});
  }
  for(let k=b.arrows.length-1;k>=0;k--){const a=b.arrows[k];if(b.t-a.t0<a.dur)continue;b.arrows.splice(k,1);const r=a.r;if(r.st==='dead')continue;
    r.hp-=a.dmg;r.hit=b.t;const[sx,sy]=tilePos(r.x,r.y);b.fx.push({k:'dmg',x:sx,y:sy-24,t:b.t,txt:'−'+Math.round(a.dmg),col:a.fire?'#E07B39':'#22343A'});
    if(r.hp<=0){r.st='dead';r.dieT=b.t;b.kills++;}}
  b.fx=b.fx.filter(f=>b.t-f.t<1);
  if(b.kills>=b.rs.length)endBattle(true);else if(b.vh<=0)endBattle(false);else if(b.t>150)endBattle(b.kills*2>=b.rs.length);
}
function endBattle(win){
  const b=battle;b.done=raidOutcome(win);b.end=b.t;derive();save();
  if(win)toast(IC('muenzen','i24')+'+'+b.done.coins);
  setTimeout(showBattleResult,win?900:1400);
}
function showBattleResult(){
  const b=battle;if(!b||!b.done)return;const o=b.done,l=Object.keys(o.lost),burnt=Object.keys(b.burnt).length;
  let h='<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px">'+(o.win?IC('schild','i64'):IC('abriss','i64'))+'<h2>'+(o.win?'Abgewehrt!':'Geplündert')+'</h2><p class="sub">Welle '+(S.raid.n+(o.win?0:1))+'</p></div>';
  h+='<div class="gains" style="justify-content:center;margin-top:12px"><div>'+POR('raider',24)+b.kills+' / '+b.rs.length+'</div><div>'+IC('feuer','i24')+burnt+' Gebäude</div><div>'+IC('uhr','i24')+Math.round(b.end)+' s</div></div>';
  h+='<div class="gains" style="justify-content:center;margin-top:8px">'+(o.win?'<div>'+IC('muenzen','i24')+'+'+o.coins+'</div>'+(o.silber?'<div>'+IC('silber','i24')+'+'+o.silber+'</div>':''):l.map(k=>'<div>'+IC(k,'i24')+'−'+o.lost[k]+'</div>').join(''))+'</div>';
  h+='<div class="btns"><button class="btn wide" data-act="closebattle">Weiter</button></div>';
  $('#modalCard').innerHTML=h;$('#modal').hidden=false;
}
function closeBattle(){battle=null;const e=$('#bhud');if(e)e.remove();$('#modal').hidden=true;render();}
function renderBattleHud(){
  let e=$('#bhud');if(!e){e=document.createElement('div');e.id='bhud';$('#stage').appendChild(e);}
  e.innerHTML='<div class="bh">'+IC('haus','i24')+'<div class="bar"><i id="bVH"></i></div><span class="n" id="bVHn"></span></div><div class="bh">'+POR('raider',24)+'<span class="n" id="bRn"></span></div>'+
    '<button class="btn red" id="bFire" data-act="fire">'+IC('feuer','i24')+'Brandpfeile</button>';
}
function updBattleHud(){const b=battle;if(!b)return;const a=$('#bVH');if(!a)return;a.style.width=(b.vh/b.vmax*100)+'%';$('#bVHn').textContent=Math.ceil(b.vh);$('#bRn').textContent=(b.rs.length-b.kills)+' / '+b.rs.length;
  const f=$('#bFire');f.classList.toggle('off',!b.fire||!!b.done);if(b.done)$('#bhud').classList.add('over');}
/* Zeichnen: Reichweiten auf dem Boden, Plünderer als Figuren, Pfeile, Feuer, Schadenszahlen */
function drawRange(i,alpha){
  const T=S.tiles[i],rg=rangeOf(T.b);if(!rg)return;const[sx,sy]=tilePos(i%N,(i/N)|0),rx=rg*TW/2*Math.SQRT2,ry=rg*TH/2*Math.SQRT2;
  ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='rgba(255,246,214,.16)';ctx.beginPath();ctx.ellipse(sx,sy,rx,ry,0,0,TAU);ctx.fill();
  ctx.setLineDash([7,5]);ctx.lineDashOffset=-T0/80;ctx.strokeStyle='#FFF8E6';ctx.lineWidth=1.6;ctx.stroke();ctx.restore();
}
function drawRaider(r){
  const b=battle,[sx,sy0]=tilePos(r.x,r.y);let sy=sy0;
  if(r.st==='dead'){const k=Math.min(1,(b.t-r.dieT)/1.2);if(k>=1)return;ctx.globalAlpha=1-k;ctx.save();ctx.translate(sx,sy);ctx.rotate(-k*1.4);ctx.translate(-sx,-sy);}
  if(r.st==='land'&&r.wait>0){return;}
  const mv=r.st==='walk',sw=mv?Math.sin(r.ph)*2.4:0,bob=mv?Math.abs(Math.sin(r.ph))*1.2:0,hitF=b.t-r.hit<.15;
  ell(sx,sy,4.5,2,'rgba(0,0,0,.2)');
  ctx.strokeStyle='#2F2724';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(sx-1.3,sy-5);ctx.lineTo(sx-1.3-sw*.6,sy);ctx.moveTo(sx+1.3,sy-5);ctx.lineTo(sx+1.3+sw*.6,sy);ctx.stroke();
  sy-=bob;
  ctx.fillStyle=hitF?'#FFFFFF':'#4A3B36';ctx.beginPath();ctx.roundRect(sx-3.6,sy-13,7.2,8.5,2);ctx.fill();
  ctx.fillStyle='#D9A982';ctx.beginPath();ctx.arc(sx,sy-15.6,2.9,0,TAU);ctx.fill();
  ctx.fillStyle='#2F2724';ctx.beginPath();ctx.ellipse(sx,sy-14.2,2.6,1.6,0,0,Math.PI);ctx.fill();
  ctx.fillStyle='#8C979C';ctx.beginPath();ctx.arc(sx,sy-16.6,3.1,Math.PI,0);ctx.fill();
  ctx.fillStyle='#F1E9DA';ctx.beginPath();ctx.moveTo(sx-3,sy-17.5);ctx.lineTo(sx-5.5,sy-21);ctx.lineTo(sx-2,sy-18.6);ctx.fill();ctx.beginPath();ctx.moveTo(sx+3,sy-17.5);ctx.lineTo(sx+5.5,sy-21);ctx.lineTo(sx+2,sy-18.6);ctx.fill();
  ell(sx-4,sy-9,3.4,3.8,'#9A3224');ell(sx-4,sy-9,1.1,1.2,'#C4862A');
  const sa=r.st==='fight'?Math.sin(b.t*12)*.9:.3;ctx.save();ctx.translate(sx+3.5,sy-10);ctx.rotate(-.6+sa);ctx.fillStyle='#5A3B24';ctx.fillRect(-.6,-8,1.2,8);ctx.fillStyle='#AEB8BC';ctx.beginPath();ctx.moveTo(-.6,-8);ctx.lineTo(3.4,-10);ctx.lineTo(3.4,-6);ctx.lineTo(-.6,-6.5);ctx.fill();ctx.restore();
  if(r.st!=='dead'&&r.hp<r.max){ctx.fillStyle='rgba(34,52,58,.8)';ctx.fillRect(sx-7,sy-26,14,3);ctx.fillStyle='#C2452F';ctx.fillRect(sx-6.5,sy-25.5,13*Math.max(0,r.hp/r.max),2);}
  if(r.st==='dead'){ctx.restore();ctx.globalAlpha=1;}
}
function drawBattleTop(){
  const b=battle;
  for(const i in b.burnt){const[sx,sy]=tilePos(i%N,(i/N)|0),bb=S.tiles[i].b,h=bb?topH(bb)*.7:10;
    for(let k=0;k<3;k++){const f=Math.sin(T0/90+k*2)*1.5,x=sx-8+k*8,y=sy-h+4;ctx.fillStyle=k%2?'#F6CA52':'#E07B39';ctx.beginPath();ctx.moveTo(x-4,y);ctx.quadraticCurveTo(x-3,y-8-f,x,y-13-f);ctx.quadraticCurveTo(x+3,y-8,x+4,y);ctx.fill();}
    for(let k=0;k<3;k++){const p=((T0/1600)+k/3)%1;ctx.fillStyle='rgba(70,66,64,'+(.45*(1-p))+')';ctx.beginPath();ctx.arc(sx-4+p*10,sy-h-6-p*34,3+p*7,0,TAU);ctx.fill();}}
  for(const a of b.arrows){const p=Math.min(1,(b.t-a.t0)/a.dur),i=a.from,bb=S.tiles[i].b,[x0,y00]=tilePos(i%N,(i/N)|0),y0=y00-(bb?topH(bb):10),[x1,y10]=tilePos(a.r.x,a.r.y),y1=y10-10;
    const x=x0+(x1-x0)*p,y=y0+(y1-y0)*p-Math.sin(p*Math.PI)*22,ang=Math.atan2((y1-y0)-Math.cos(p*Math.PI)*22*Math.PI,x1-x0);
    ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.strokeStyle=a.fire?'#E07B39':'#3B3532';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(4,0);ctx.stroke();if(a.fire){ell(4,0,2,2,'#F6CA52');}ctx.restore();}
  for(const f of b.fx){const k=(b.t-f.t);ctx.globalAlpha=Math.max(0,1-k);ctx.font='800 10px Work Sans, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.strokeText(f.txt,f.x,f.y-k*16);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y-k*16);ctx.globalAlpha=1;}
}

function showReport(rep){
  const g=Object.keys(rep.gain).filter(k=>rep.gain[k]>0);
  let h='<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px">'+IC('uhr','i48')+'<h2>Willkommen zurück</h2><p class="sub">'+fmtT(rep.ms)+' weg'+(rep.ms>8*3600e3?', gezählt werden höchstens 8 h':'')+'</p></div>';
  if(g.length)h+='<div class="gains" style="justify-content:center;margin-top:14px">'+g.map((k,j)=>'<div style="animation-delay:'+(j*.06)+'s">'+IC(k,'i28')+'+'+fmt(rep.gain[k])+'</div>').join('')+'</div>';
  if(rep.done&&rep.done.length)h+='<div class="gains" style="justify-content:center;margin-top:10px">'+rep.done.map(([t,l])=>'<div><img class="ico i28" src="'+thumb(t,l)+'" alt="">'+B[t].n+(l>1?' '+l:'')+' fertig</div>').join('')+'</div>';
  if(rep.regs&&rep.regs.length)h+='<div class="gains" style="justify-content:center;margin-top:6px">'+rep.regs.map(r=>'<div>'+IC(REG[r].ic,'i28')+REG[r].n+' erkundet</div>').join('')+'</div>';
  if(rep.raids.length)h+='<div class="btns" style="justify-content:center">'+rep.raids.map(r=>'<span class="tag '+(r.win?'green':'red')+'">'+IC(r.win?'schild':'abriss','i16')+(r.win?'Überfall abgewehrt +'+r.coins:'Überfall: 15 % geplündert')+'</span>').join('')+'</div>';
  h+='<div class="btns"><button class="btn wide" data-act="closemodal">Weiter</button></div>';
  $('#modalCard').innerHTML=h;$('#modal').hidden=false;
}
