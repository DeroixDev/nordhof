/* ---------- Rückmeldung: Hüpfen, Staub, Splitter, Konfetti, Banner, Ruhe-Zeichen ---------- */
var JP=[],SHAKE={t:0,a:0},IDLE={t:-1e9,m:{}};
const CONF=['#E2B04A','#F0C76A','#D0583F','#8DB36B','#6E929B','#FFF8E6'];
/* Kurzer, sehr dezenter Kameraschüttler; bei "Weniger Animationen" aus */
function shake(a){if(S.opt.calm)return;if(a>SHAKE.a*(1-(UT-SHAKE.t)/300))SHAKE={t:UT,a};}
/* Splitter: kleine Holz- und Steinstücke, fliegen und fallen */
function chips(i,n){const b=S.tiles[i].b,s=b?fpOf(b.type):1,[sx,sy]=posOf(i);n=S.opt.calm?Math.ceil(n/3):n;
  for(let k=0;k<n&&JP.length<160;k++){const a=rand(-2.6,-.5);JP.push({k:'chip',x:sx+rand(-12,12)*s,y:sy-rand(4,16)*s,vx:Math.cos(a)*rand(20,60),vy:Math.sin(a)*rand(50,110),t0:UT,life:rand(700,1000),r:rand(0,TAU),vr:rand(-9,9),c:pick(['#8B5E34','#C49A62','#A7A89E','#E0B77E']),w:rand(2,4)});}}
/* Bau oder Ausbau fertig: Gebäude schwillt und setzt sich, Staub, Splitter, Funken, kurzes Zittern, Ton */
function juiceDone(i,j){
  anim[i]=UT-200;dust(i);chips(i,10);sparks(i);shake(1.6);
  const b=S.tiles[i].b;if(!(b&&b.type==='hof'&&j==='up'))sfx(j==='up'?'up':'built');
}
/* Neue Hofstufe als Fest: Fanfare, Konfetti über dem Hof, Banner, danach das Kapitel */
function hofFest(L){
  sfx('hof');shake(3);
  if(S.hof>=0&&S.tiles[S.hof].b){const b=S.tiles[S.hof].b,[sx,sy]=posOf(S.hof),h=topH(b),n=S.opt.calm?24:80;
    for(let k=0;k<n&&JP.length<220;k++){const a=rand(-2.4,-.7),v=rand(70,150);JP.push({k:'conf',x:sx+rand(-20,20),y:sy-h-rand(0,10),vx:Math.cos(a)*v,vy:Math.sin(a)*v,t0:UT+rand(0,500),life:rand(1800,2600),r:rand(0,TAU),vr:rand(-8,8),c:pick(CONF),w:rand(4.5,7.5),ph:rand(0,TAU)});}}
  const old=$('#hofban');if(old)old.remove();
  const el=document.createElement('div');el.id='hofban';el.className='hofban';el.innerHTML='<div class="r"><small>Der Hof wächst</small><b>Hofstufe '+L+'</b></div>';
  document.body.appendChild(el);
  setTimeout(()=>{el.remove();showChapter(L);},2700);
}
/* Feld je Frame: Splitter und Konfetti zeichnen (Weltkoordinaten), Schüttler auf die Leinwand */
function drawJuice(){
  for(let k=JP.length-1;k>=0;k--){const p=JP[k],t=(UT-p.t0)/p.life;if(t<0)continue;if(t>=1){JP.splice(k,1);continue;}
    const tt=t*p.life/1000;
    if(p.k==='chip'){const x=p.x+p.vx*tt,y=p.y+p.vy*tt+140*tt*tt;ctx.globalAlpha=t>.7?(1-t)/.3:1;ctx.save();ctx.translate(x,y);ctx.rotate(p.r+p.vr*tt);ctx.fillStyle=p.c;ctx.fillRect(-p.w,-p.w*.4,p.w*2,p.w*.8);ctx.restore();}
    else{const dr=1-Math.exp(-tt*2.2),x=p.x+p.vx*dr/2.2+Math.sin(tt*5+p.ph)*6,y=p.y+p.vy*dr/2.2+28*tt*tt;
      ctx.globalAlpha=t>.75?(1-t)/.25:1;ctx.save();ctx.translate(x,y);ctx.rotate(p.r+p.vr*tt);ctx.scale(1,Math.cos(tt*9+p.ph));ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.w*.35,p.w,p.w*.7);ctx.restore();}}
  ctx.globalAlpha=1;
  const cv=ctx.canvas,k=SHAKE.a?1-(UT-SHAKE.t)/300:0;
  if(k>0){const a=SHAKE.a*k;cv.style.transform='translate('+(Math.sin(UT*.09)*a).toFixed(1)+'px,'+(Math.cos(UT*.113)*a*.7).toFixed(1)+'px)';}
  else if(SHAKE.a){SHAKE.a=0;cv.style.transform='';}
}

/* ---------- Warum ruht ein Betrieb? Nur der wichtigste Grund ---------- */
/* k: staff (keine Arbeiter), input (Zutaten fehlen), full (Lager voll), buf (Vorrat vor der Tür voll), road (kein Weg) */
function idleWhy(i){
  const b=S.tiles[i].b;if(!b)return null;const d=B[b.type];
  if(!busy(b)&&(d.kind==='prod'||d.kind==='craft')){
    const j=jobsOf(b);if(j>0&&Math.round(j*D.staff)<1)return{k:'staff',ic:'leute',t:'Keine Arbeiter: zu wenig Einwohner'};
    const key=outOf(b);
    if(d.kind==='craft'&&!b.run){const r=RECIPES[key],miss=Object.keys(r.in).filter(k=>(S.res[k]||0)<r.in[k]);if(miss.length)return{k:'input',ic:miss[0],t:'Zutaten fehlen: '+miss.map(k=>RES[k].n).join(', ')};}
    if(key&&capped(key)&&S.res[key]>=D.cap-.5)return{k:'full',ic:'lager',t:RES[key].n+': Lager voll, der Betrieb ruht'};
    if(key&&(b.buf||0)>=bufCap(b)*.95)return{k:'buf',ic:'karren',t:'Vorrat vor der Tür voll: Träger kommen nicht nach'};
  }
  if(!connected(i))return{k:'road',ic:'pfad',t:'Kein Weg zum Hof: halbe Leistung'};
  return null;
}
/* Gründe werden höchstens alle 0,4 s neu bestimmt, nicht in jedem Bild */
function idleOf(i){if(UT-IDLE.t>400||UT<IDLE.t){IDLE.t=UT;IDLE.m={};}let w=IDLE.m[i];if(w===undefined)w=IDLE.m[i]=idleWhy(i);return w;}
/* Zeichen über dem Gebäude: farbige Plakette mit Symbol, sanft pulsierend */
function drawIdle(i,x,y){
  const w=idleOf(i);if(!w)return;if(w.k==='road'){drawNoRoad(x,y);return;}
  const red=w.k==='staff'||w.k==='input',ph=(i*.37)%TAU,k=1+Math.sin(UT/320+ph)*.07,al=.82+Math.sin(UT/320+ph)*.18;
  ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.globalAlpha=al;
  ell(0,0,8.5,8.5,red?'#D0583F':'#C4862A');ctx.strokeStyle='#172125';ctx.lineWidth=1.4;ctx.stroke();
  ctx.drawImage(iconC(w.ic),-6.5,-6.5,13,13);
  if(w.k==='staff')L(ctx,[-5.5,5.5,5.5,-5.5],'#FFF8E6',1.6);
  else if(w.k==='full'){ctx.fillStyle='#FFF8E6';for(let q=0;q<3;q++)ctx.fillRect(9.5,3.5-q*3.4,3.2,2.4);}
  else if(w.k==='buf'){ctx.fillStyle='#FFF8E6';ctx.beginPath();ctx.arc(9.5,-5,2.6,0,TAU);ctx.fill();ctx.fillStyle='#C4862A';ctx.fillRect(9,-6.6,1,2.2);ctx.fillRect(9,-4.6,2,1);}
  else if(w.k==='input'){ctx.fillStyle='#FFF8E6';ctx.font='700 9px Work Sans, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',9.5,-6);}
  ctx.restore();
}
/* Tooltip: Grund in Worten, wenn er dort noch nicht steht */
function idleTip(i,o){const w=idleWhy(i);if(w&&(w.k==='staff'||w.k==='full'||w.k==='buf'))o.push([w.ic,w.t,'bad']);}
/* Inspector: Hinweiszeile für Gründe, die dort noch fehlen */
function idleNote(i){const w=idleWhy(i);if(!w)return '';
  if(w.k==='staff')return '<p class="note warn">'+IC('leute','i16')+' Keine Arbeiter. Mehr Wohnhäuser bringen mehr Einwohner.</p>';
  if(w.k==='full')return '<p class="note warn">'+IC('lager','i16')+' '+w.t+'. Verkaufen, verarbeiten oder ein Lagerhaus bauen.</p>';
  return '';}
{const st=document.createElement('style');st.textContent=
  '.hofban{position:fixed;left:50%;top:28%;z-index:25;pointer-events:none;transform:translate(-50%,-50%);animation:hbIn 2.7s cubic-bezier(.2,1.3,.4,1) both}'+
  '.hofban .r{background:linear-gradient(180deg,#2A3A40,#1B272B);border:2px solid var(--gold);border-radius:14px;padding:12px 34px 14px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.5),0 0 40px rgba(226,176,74,.35);white-space:nowrap}'+
  '.hofban small{display:block;font:700 12px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--gold2);margin-bottom:6px}'+
  '.hofban b{display:block;font:700 46px/1 var(--display);color:#FFF8E6;text-shadow:0 2px 0 rgba(0,0,0,.35)}'+
  '@keyframes hbIn{0%{transform:translate(-50%,-50%) scale(2.6);opacity:0}14%{transform:translate(-50%,-50%) scale(.94);opacity:1}22%{transform:translate(-50%,-50%) scale(1.03)}30%,82%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-62%) scale(.96);opacity:0}}'+
  'body.calm .hofban{animation-duration:2.7s;animation-timing-function:ease}'+
  '@media (max-width:600px){.hofban b{font-size:36px}.hofban .r{padding:10px 24px 12px}}';
  document.head.appendChild(st);}
