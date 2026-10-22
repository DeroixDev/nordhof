/* ---------- Jahreszeiten zeichnen: Boden, Bäume, Felder, Schnee auf Dächern, Wetter, Kalender-Anzeige ---------- */
/* Icons der Jahreszeiten */
Object.assign(DRAW,{
  fruehling(g){E(g,0,26,32,9,'#8A6440');L(g,[0,24,0,-12],'#4E7A34',6);g.beginPath();g.moveTo(0,-4);g.quadraticCurveTo(-30,-10,-30,-34);g.quadraticCurveTo(-6,-30,0,-4);g.closePath();fs(g,'#7FAE52');
    g.beginPath();g.moveTo(0,-10);g.quadraticCurveTo(28,-14,30,-38);g.quadraticCurveTo(6,-36,0,-10);g.closePath();fs(g,'#93C062');},
  sommer(g){for(let k=0;k<8;k++){const a=k*TAU/8;g.save();g.rotate(a);P(g,[-6,-24,0,-40,6,-24],'#F0C76A');g.restore();}E(g,0,0,20,20,'#E7B54C');E(g,-6,-6,6,4,'rgba(255,255,255,.5)',false);},
  herbst(g){g.save();g.rotate(-.5);g.beginPath();g.moveTo(0,-38);g.bezierCurveTo(30,-26,30,14,0,32);g.bezierCurveTo(-30,14,-30,-26,0,-38);g.closePath();fs(g,'#D9822B');L(g,[0,-30,0,40],'#8A4A1E',4);for(const y of[-14,0,14]){L(g,[0,y+6,14,y-4],'#B5651E',3);L(g,[0,y+6,-14,y-4],'#B5651E',3);}g.restore();},
  winter(g){for(let k=0;k<3;k++){g.save();g.rotate(k*Math.PI/3);L(g,[0,-36,0,36],OUT,10);g.restore();}
    for(let k=0;k<6;k++){g.save();g.rotate(k*Math.PI/3);L(g,[0,-36,0,0],'#EAF4F8',6);L(g,[0,-22,-10,-32],'#EAF4F8',4.5);L(g,[0,-22,10,-32],'#EAF4F8',4.5);g.restore();}E(g,0,0,7,7,'#9CC3D6',false);}
});

/* Welche Jahreszeit Boden und Bäume gerade zeigen. Wechselt sie, werden die Bodenstücke nach und nach neu gemalt (alte bleiben bis dahin sichtbar). */
let GSEA=-1,TSEA=0;
function seasonGfx(){
  const s=S?curSeason():0;if(s===GSEA)return;const first=GSEA<0;GSEA=s;TSEA=s===2?1:s===3?2:0;
  if(!first){TCOL=null;GKEY=-1;for(const e of GCH.values())e.stale=1;OVdirty=true;MINI.dirty=true;}
}
/* Bodenfarbe je Jahreszeit leicht verschieben: Frühling frischer, Herbst wärmer, Winter Schnee */
const GTN={0:{grass:[[146,192,108],.2]},
  2:{grass:[[186,168,98],.38],forest:[[152,118,72],.32],heide:[[152,108,104],.2],moor:[[148,132,92],.28]},
  3:{grass:[[228,233,230],.56],forest:[[206,214,210],.42],heide:[[222,226,226],.5],moor:[[204,214,210],.4],sand:[[234,234,226],.28],rock:[[214,218,216],.28],berg:[[238,240,238],.5],tundra:[[242,246,244],.35]}};
function gTint(t,r,g,b){if(GSEA<0)seasonGfx();const m=GTN[GSEA],q=m&&m[t];if(!q)return[r,g,b];const[c,k]=q;return[r+(c[0]-r)*k,g+(c[1]-g)*k,b+(c[2]-b)*k];}
/* Kleinteile auf dem Boden: Laub im Herbst, Schneeflecken im Winter */
const GSNOW={grass:4,forest:3,heide:3,moor:2,sand:1.5,rock:1.5};
function gSeasonDetail(t){
  if(GSEA===2&&(t==='grass'||t==='forest')){ells(gp(4,t),1,.6,'rgba(205,120,48,.5)');ells(gp(3,t),.9,.55,'rgba(226,170,60,.5)');}
  else if(GSEA===3&&GSNOW[t])patches(gp(GSNOW[t],t),[3,5],[1.2,1.8],.3,.6,'rgba(140,160,172,.16)','rgba(250,252,251,.72)');
}
const yardSeason=c=>GSEA===3?'#D6DCD7':GSEA===2?'#A8AE70':c;

/* Felder: Wuchsstufe aus dem Jahreslauf. 0 Acker, 1 Keime, 2 jung, 3 hoch, 4 reif, 5 Ernte, 6 Stoppeln, 7 Schnee */
const FSTG=[.05,.14,.27,.42,GROW_END,HARV_END,.75];
function fieldStage(){const y=yearF();let g=0;while(g<FSTG.length&&y>=FSTG[g])g++;return g;}
let SKIN='';
/* Beim Wechsel nicht alle Bilder in einem Frame neu malen: ist das Bildbudget verbraucht, bleibt das alte Bild noch stehen */
const LASTSK=new Map();
function seasonKeyFor(k0,sk){const o=LASTSK.get(k0);if(o===undefined||o===sk||SPR.has('T'+k0+sk)||!sprBusy()||!SPR.has('T'+k0+o)){LASTSK.set(k0,sk);return sk;}return o;}
function seasonKey(b){if(isField(b))return 'f'+fieldStage();return curSeason()===3?'w':'';}
/* Gebäudebild der Jahreszeit: Felder je Stufe, im Winter liegt Schnee auf den Dächern (oben weiß, nach unten auslaufend) */
function seasonBody(b,lit,sk){
  SKIN=sk;try{bodyB(0,0,b,lit);}finally{SKIN='';}
  if(sk!=='w')return;const h=topH(b);if(h<10)return;
  ctx.save();ctx.globalCompositeOperation='source-atop';const g=ctx.createLinearGradient(0,-h-2,0,-h*.22);
  g.addColorStop(0,'rgba(247,250,252,.95)');g.addColorStop(.55,'rgba(244,248,250,.72)');g.addColorStop(1,'rgba(244,248,250,0)');
  ctx.fillStyle=g;ctx.fillRect(-300,-h-60,600,h*.78+60);ctx.restore();
}
function sheaf(x,y,fl){ell(x+1.4,y,3,1,SHADOW);ctx.fillStyle=fl?'#C9B27A':'#DDB95C';ctx.beginPath();ctx.moveTo(x-2.6,y);ctx.lineTo(x-.6,y-6.5);ctx.lineTo(x+.6,y-6.5);ctx.lineTo(x+2.6,y);ctx.closePath();ctx.fill();ctx.fillStyle=fl?'#8E7A48':'#A07A2C';ctx.fillRect(x-1.7,y-3.4,3.4,.9);}
/* Feld je Wuchsstufe; gibt false zurück, wenn das bisherige Bild (reifer Weizen) passt */
function fieldBody(sx,sy,st,lv,odd){
  const g=+SKIN.slice(1),fl=st.crop==='flachs';if(g===4&&!fl)return false;
  const rows=4+lv,M=(u,v)=>odd?[v,u]:[u,v],Q=[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]];
  pq(sx,sy,Q,g===7?'#E4EAE7':g===6?'#BDA66B':g<=1?'#8C6B49':g===2?(fl?'#7E9256':'#8A9455'):g===3?(fl?'#6F8D4E':'#7A964C'):fl?'#A99A5E':'#B79A55');
  const ripe=(x,y)=>{if(fl){ctx.fillStyle='#9E8A48';ctx.fillRect(x-.4,y-3.6,.8,3.6);ell(x,y-3.9,1.1,1.1,'#C6AC62');}else{ctx.fillStyle='#C9A13E';ctx.fillRect(x-.5,y-4,1,4);ell(x+.2,y-4.5,1,1.8,'#E7C25A');}};
  const stub=(x,y)=>{ctx.fillStyle='#9C8648';ctx.fillRect(x-.4,y-1.4,.8,1.4);};
  for(let k=1;k<rows;k++){const t=k/rows-.5,a=[...M(t,-.46),0],e=[...M(t,.46),0];
    if(g<=1){pl(sx,sy,a,e,'#6B4F33',2.4);pl(sx,sy,[...M(t+.03,-.46),0],[...M(t+.03,.46),0],'rgba(176,140,98,.55)',.9);}
    else if(g===7)pl(sx,sy,a,e,'rgba(140,128,110,.32)',1.4);
    else pl(sx,sy,a,e,g===3||g===2?'rgba(70,96,46,.45)':'rgba(150,120,60,.5)',1.2);
    let j=0;for(let q=-.42;q<.44;q+=.07,j++){const[x,y]=spt(sx,sy,...M(t,q),0);
      if(g===1){if((k+j)%2===0)ell(x,y-.8,.9,.7,'#8DB45A');}
      else if(g===2){ctx.fillStyle=fl?'#6E9A48':'#79A24C';ctx.fillRect(x-.45,y-2.2,.9,2.2);}
      else if(g===3){ctx.fillStyle='#5E8A3E';ctx.fillRect(x-.5,y-4.4,1,4.4);if(fl)ell(x,y-4.4,1.15,1.15,(k+j)%3?'#7C95D0':'#9BB0E0');else ell(x+.2,y-4.8,.95,1.6,'#8DB45A');}
      else if(g===4)ripe(x,y);
      else if(g===5){if(k>rows/2)ripe(x,y);else stub(x,y);}
      else if(g===6)stub(x,y);
      else if(g===7&&(k+j)%4===0){ctx.fillStyle='rgba(120,104,80,.55)';ctx.fillRect(x-.4,y-1.1,.8,1.1);}}}
  if(g===5||g===6){const pts=g===5?[[-.3,-.05],[-.15,.25],[-.38,.32]]:[[-.3,-.25],[.05,-.3],[-.2,.1],[.25,.05],[0,.32],[.32,.35]];for(const[u,v]of pts){const[x,y]=spt(sx,sy,...M(u,v),0);sheaf(x,y,fl);}}
  for(const[u,v]of[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]){const[x,y]=spt(sx,sy,u*.96,v*.96,0);ctx.fillStyle='#7A5636';ctx.fillRect(x-.6,y-4,1.2,4);if(g===7)ell(x,y-4.2,1,.6,'#F4F7F6');}
  return true;
}
/* Bäume im Herbst und Winter: Birken gelb und orange, Büsche rot, im Winter kahl oder verschneit. Gibt true zurück, wenn gezeichnet. */
function seasonTree(kind,s,t){
  if(!TSEA)return false;
  if(kind==='birke'){
    ell(3,0,7*s,2.6*s,SHADOW);ctx.fillStyle='#ECE8DE';ctx.fillRect(-1*s,-12*s,2*s,12.5*s);ctx.fillStyle='#3B3532';ctx.fillRect(-1*s,-8*s,1.2*s,.8*s);ctx.fillRect(0,-4*s,1*s,.8*s);
    if(TSEA===1){const g=[['#E0B23A','#C48A2A','#F0CF5C'],['#D9822B','#B5651E','#EDA04A'],['#C9A23A','#A87A28','#E6C65E']][t];ell(0,-16*s,7*s,8*s,g[0]);ell(2*s,-14*s,5.5*s,6*s,g[1]);ell(-2.5*s,-18.5*s,3.5*s,3.5*s,g[2]);}
    else{ell(0,-16*s,6.5*s,7.5*s,'rgba(118,100,88,.32)');ctx.strokeStyle='#6E625A';ctx.lineWidth=.8*s;ctx.beginPath();
      for(const[a,b,c,d]of[[0,-12,-5,-19],[0,-14,4,-21],[0,-16,-2,-23],[-2,-16,-6,-14],[1,-18,5,-16]]){ctx.moveTo(a*s,b*s);ctx.lineTo(c*s,d*s);}ctx.stroke();
      ell(-4.5*s,-19*s,1.6*s,.7*s,'#F4F7F6');ell(3.5*s,-20.5*s,1.6*s,.7*s,'#F4F7F6');}
    return true;}
  if(kind==='busch'){const C=TSEA===1?['#B5552A','#9A4422','#C9733A']:['#DDE3E0','#B9C3C1','#F2F5F3'];
    ell(3,.5,6*s,2.2*s,SHADOW);ell(-2.5*s,-3*s,4*s,3.2*s,C[1]);ell(2*s,-3.5*s,4.2*s,3.5*s,C[0]);ell(0,-5.5*s,4*s,3.4*s,C[2]);if(TSEA===2){ell(-2*s,-2*s,3*s,1.2*s,'rgba(70,90,70,.35)');}return true;}
  if(kind==='kiefer'&&TSEA===2){const C=TTINT[t];
    ell(4,0,7*s,2.6*s,SHADOW);ctx.fillStyle='#8A5236';ctx.fillRect(-1*s,-17*s,2*s,17.5*s);ctx.fillStyle='#6E4026';ctx.fillRect(0,-17*s,1*s,17.5*s);
    for(const[dx,dy,rx]of[[-4,-19,5],[3,-21,5.5],[0,-24,4.5],[-1,-17.5,3.5]]){ell(dx*s,dy*s,rx*s,2.6*s,C[0]);ell(dx*s+1.6*s,dy*s+.8*s,rx*.7*s,1.8*s,C[2]);ell(dx*s-.4*s,dy*s-1.2*s,rx*.75*s,1.2*s,'#F4F7F6');}
    return true;}
  return false;
}

/* ---------- Wetter ---------- */
/* Leichte Partikel über dem Bild, an der Karte verankert (sie wandern beim Schieben mit). Laufen mit der Spieluhr, stehen also in der Pause. */
const WX={k:'klar',cur:'klar',a:0,until:0,sea:-1,P:[],F:[]};
const WXT=[[['klar',5],['regen',2.5],['nebel',2.5]],[['klar',8.5],['regen',1],['nebel',.5]],[['klar',4],['regen',3],['nebel',3]],[['schnee',6],['klar',2.5],['nebel',1.5]]];
const WXF=['regen','klar','nebel','schnee'];
const WXN={klar:'Klar',regen:'Regen',nebel:'Morgennebel',schnee:'Schneefall'};
const wxOn=()=>S.opt.wetter!==false;
const wxMax=()=>S.opt.eco||S.opt.calm?70:150;
let FOGC=null;
function fogSprite(){if(FOGC)return FOGC;FOGC=mkc(128,128,g=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(238,242,244,.9)');r.addColorStop(.55,'rgba(238,242,244,.45)');r.addColorStop(1,'rgba(238,242,244,0)');g.fillStyle=r;g.fillRect(0,0,128,128);});return FOGC;}
function drawWeather(gdt){
  seasonGfx();if(!S)return;
  const s=curSeason();
  if(WX.sea!==s){WX.k=WXF[s];WX.until=T0+rand(50,90)*1000;WX.sea=s;}
  else if(T0>=WX.until){WX.k=wpick(WXT[s]);WX.until=T0+rand(45,100)*1000;}
  if(!wxOn()){WX.a=0;WX.cur='klar';return;}
  if(WX.cur!==WX.k){WX.a-=gdt/2.5;if(WX.a<=0){WX.a=0;WX.cur=WX.k;WX.P.length=0;WX.F.length=0;}}
  else if(WX.cur!=='klar')WX.a=Math.min(1,WX.a+gdt/4);
  if(WX.cur==='klar'||WX.a<=0)return;
  const z=view.z,ox=W/2+view.x,oy=H/2+view.y,a=WX.a,k=WX.cur;
  ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
  if(k==='nebel'){
    ctx.fillStyle='rgba(232,238,240,'+(.16*a)+')';ctx.fillRect(0,0,W,H);
    const F=WX.F,R=Math.max(W,H)*.32;while(F.length<6)F.push({x:(rand(-R,W+R)-ox)/z,y:(rand(0,H)-oy)/z,s:rand(.8,1.3)});
    const im=fogSprite();ctx.globalAlpha=.55*a;
    for(const f of F){f.x+=7*gdt/z;let sx=ox+f.x*z,sy=oy+f.y*z;const r=R*f.s;
      if(sx-r>W){sx=-r;sy=rand(0,H);}else if(sx+r<-W*.5||sy-r>H*1.5||sy+r<-H*.5){sx=rand(-r,W);sy=rand(0,H);}
      f.x=(sx-ox)/z;f.y=(sy-oy)/z;ctx.drawImage(im,sx-r,sy-r*.5,2*r,r);}
  } else {
    const snow=k==='schnee',P=WX.P,max=wxMax(),n=Math.ceil(max*a);
    while(P.length<max)P.push({x:(rand(-20,W+20)-ox)/z,y:(rand(-20,H)-oy)/z,d:rand(.4,1),ph:rand(0,TAU)});
    P.length=max;
    ctx.fillStyle=snow?'rgba(226,234,240,'+(.08*a)+')':'rgba(40,58,72,'+(.12*a)+')';ctx.fillRect(0,0,W,H);
    const t=T0/1000;ctx.beginPath();
    for(let q=0;q<n;q++){const p=P[q];
      const vy=snow?(16+26*p.d):(380+220*p.d),vx=snow?(8+9*Math.sin(t*.8+p.ph))*p.d:60;
      p.x+=vx*gdt/z;p.y+=vy*gdt/z;let sx=ox+p.x*z,sy=oy+p.y*z;
      if(sy>H+12){sy=-12-rand(0,30);sx=rand(-20,W+20);}else if(sy<-80)sy=rand(-10,H);
      if(sx>W+20)sx-=W+40;else if(sx<-20)sx+=W+40;
      p.x=(sx-ox)/z;p.y=(sy-oy)/z;
      if(snow){const r=.8+1.5*p.d;ctx.moveTo(sx+r,sy);ctx.arc(sx,sy,r,0,TAU);}
      else{ctx.moveTo(sx,sy);ctx.lineTo(sx-vx*.022,sy-vy*.022);}}
    if(snow){ctx.fillStyle='rgba(255,255,255,'+Math.min(.92,a)+')';ctx.fill();}
    else{ctx.strokeStyle='rgba(208,222,234,'+(.55*a)+')';ctx.lineWidth=1;ctx.stroke();}
  }
  ctx.restore();
}

/* ---------- Kalender-Anzeige ---------- */
{const st=document.createElement('style');st.textContent=
'.kcal .cring{position:relative;width:30px;height:30px;flex-shrink:0}'+
'.kcal svg{position:absolute;left:0;top:0;width:30px;height:30px;transform:rotate(-90deg)}'+
'.kcal circle{fill:none;stroke-width:3}.kcal .bg{stroke:var(--soft2)}.kcal .fg{stroke:var(--gold);stroke-linecap:round;transition:stroke-dasharray .6s}'+
'.kcal.s0 .fg{stroke:var(--green)}.kcal.s2 .fg{stroke:#D9822B}.kcal.s3 .fg{stroke:#9CC3D6}'+
'.kcal .cring img.ico{position:absolute;left:6px;top:6px;width:18px;height:18px}'+
'.kcal.warn .cring::after{content:"";position:absolute;right:-1px;top:-1px;width:8px;height:8px;border-radius:50%;background:var(--red);box-shadow:0 0 0 2px rgba(19,28,31,.95)}'+
'#calTip{position:fixed;z-index:30;width:300px;max-width:calc(100vw - 24px);border-radius:14px;padding:12px 14px;font-size:12.5px;line-height:1.4;box-sizing:border-box;pointer-events:none}'+
'#calTip b.t,.calh b.t{font-family:var(--display);font-size:20px;line-height:1}'+
'.calh{display:flex;align-items:center;gap:10px;margin-bottom:6px}.calh small{display:block;color:var(--mut);font-size:11.5px;margin-top:2px}'+
'.calp{color:var(--mut);margin:4px 0 8px}.cale{display:flex;flex-wrap:wrap;gap:4px 10px;margin:4px 0}.cale span{display:flex;align-items:center;gap:4px;font-weight:600;font-size:12px}'+
'.cale .up{color:var(--green)}.cale .down{color:var(--red2)}'+
'.wg{margin-top:8px}.wg .goal{padding:2px 0}.wg .wn{font-size:11.5px;color:var(--mut);margin-top:6px}.wg .wn.ok{color:var(--green)}'+
'.calyr{display:flex;gap:4px;margin:10px 0 2px}.calyr i{flex:1;height:6px;border-radius:3px;background:var(--soft2);position:relative;overflow:hidden}.calyr i b{position:absolute;left:0;top:0;bottom:0;background:var(--gold)}'+
'#calM{display:none}'+
'@media (max-width:899px){#top .kcal{display:none!important}#calM{display:grid;place-items:center;position:absolute;right:10px;top:calc(var(--tb) + 58px);z-index:6;width:44px;height:44px;padding:0;border-radius:12px;border:1px solid var(--line);background:rgba(19,28,31,.92);cursor:pointer}#calM .cring{width:32px;height:32px}#calM svg{width:32px;height:32px}#calM .cring img.ico{left:7px;top:7px}}';
document.head.appendChild(st);}
{const kp=document.querySelector('#top .kp'),rc=document.getElementById('raidChip');
  if(kp){const b=document.createElement('button');b.className='k kcal';b.id='calChip';b.dataset.act='cal';b.setAttribute('aria-label','Jahreszeit');
    const ring='<span class="cring"><svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="15"/><circle class="fg" data-calring="1" cx="18" cy="18" r="15" pathLength="100" stroke-dasharray="0 100"/></svg><img class="ico" data-cali="1" alt=""></span>';
    b.innerHTML=ring+'<span class="v"><b id="calN">Frühling</b><small id="calY">Jahr 1</small></span>';kp.insertBefore(b,rc);
    /* Handy: kompakter Ring auf der Karte unter dem Tempo-Knopf */
    const m=document.createElement('button');m.className='kcal';m.id='calM';m.dataset.act='cal';m.setAttribute('aria-label','Jahreszeit');m.innerHTML=ring;const st=document.getElementById('stage');if(st)st.appendChild(m);}
  const g=document.getElementById('goal');if(g){const w=document.createElement('section');w.className='sec';w.id='wgoal';w.style.display='none';g.after(w);}
  const tip=document.createElement('div');tip.id='calTip';tip.className='pn';tip.hidden=true;document.body.appendChild(tip);}
/* Wirkung einer Jahreszeit als kurze Liste */
function seasonEffects(s){
  const L=hofL(),o=[];
  if(s===0)o.push(['fruehling','Felder werden gesät','']);if(s===1)o.push(['weizen','Felder wachsen, ab Spätsommer golden','']);
  if(s===2)o.push(['weizen','Ernte: der Jahresertrag kommt auf einmal','up']);if(s===3)o.push(['winter','Felder ruhen','down']);
  for(const t in SEASF){if(B[t].hl>L+1)continue;const v=SEASF[t][s];if(Math.abs(v-1)<.04)continue;o.push([B[t].out,B[t].n+' '+(v>1?'+':'−')+Math.round(Math.abs(v-1)*100)+' %',v>1?'up':'down']);}
  if(s===3){o.push(['fisch','Leute essen '+Math.round((WFOOD-1)*100)+' % mehr','down']);o.push(['holz','Heizen kostet Holz','down']);if(L+1>=3)o.push(['weizen','Weiden brauchen Weizen als Futter','down']);o.push(['herz','Gut vorbereitet: Zufriedenheit +'+PREPJOY,'up']);}
  return o;
}
/* Vor dem Winter: Vorrat gegen Bedarf. Im Winter: was noch gebraucht wird, anteilig. */
function winterGoal(){
  const sn=seasonOf(calE());if(sn.s<2)return null;const w=sn.s===3&&S.cal&&S.cal.wn?S.cal.wn:winterNeed(),left=sn.s===3?1-sn.f:1;
  const food=Math.ceil(w.food*left/5)*5,holz=Math.ceil(w.holz*left/5)*5,fs=foodStock(),hs=S.res.holz||0;
  return{s:sn.s,food,holz,fs,hs,ok:fs>=food&&hs>=holz,rest:(1-sn.f)*SEAS};
}
function winterGoalHTML(g){
  const row=(k,n,v,need)=>'<div class="goal'+(v>=need?' ok':'')+'">'+IC(k,'i20')+'<span class="gn">'+n+'<span class="gb"><i style="width:'+(need?Math.min(100,v/need*100):100)+'%"></i></span></span><b>'+fmt(Math.min(v,need))+'/'+fmt(need)+'</b></div>';
  let h=row('fisch','Nahrung',g.fs,g.food)+row('holz','Holz',g.hs,g.holz);
  if(g.s===2)h+='<div class="wn'+(g.ok?' ok':'')+'">'+(g.ok?'Vorrat reicht. Im Winter gibt das +'+PREPJOY+' Zufriedenheit.':'Gut vorbereitet gibt im Winter +'+PREPJOY+' Zufriedenheit.')+'</div>';
  else h+='<div class="wn'+(S.cal.prep&&!D.cold?' ok':'')+'">'+(S.cal.prep?'Gut vorbereitet: +'+PREPJOY+' Zufriedenheit.':'Nicht vorbereitet, die Vorräte sind knapp.')+(D.cold?' Kein Holz zum Heizen: −'+(-COLDJOY)+' Zufriedenheit.':'')+'</div>';
  return h;
}
function calHTML(full){
  const sn=seasonOf(calE()),nx=(sn.s+1)%4,rest=(1-sn.f)*SEAS/Math.max(1,CLK.k||1),wx=wxOn()&&WX.cur!=='klar'&&WX.a>.3?' · '+WXN[WX.cur]:'';
  let h='<div class="calh">'+IC(SEASI[sn.s],full?'i48':'i36')+'<div><b class="t">'+SEASN[sn.s]+', Jahr '+sn.y+'</b><small>'+SEASN[nx]+' in '+fmtDur(rest)+wx+'</small></div></div>';
  h+='<div class="calp">'+SEAST[sn.s]+'</div><div class="cale">'+seasonEffects(sn.s).map(e=>'<span class="'+e[2]+'">'+IC(e[0],'i16')+e[1]+'</span>').join('')+'</div>';
  const g=winterGoal();if(g)h+='<div class="wg">'+(full?'<h3>'+IC('winter','i16')+(g.s===2?'Vor dem Winter':'Winter')+'</h3>':'')+winterGoalHTML(g)+'</div>';
  if(full){h+='<div class="calyr">'+[0,1,2,3].map(k=>'<i title="'+SEASN[k]+'"><b style="width:'+(k<sn.s?100:k===sn.s?sn.f*100:0)+'%"></b></i>').join('')+'</div><div class="cale">'+SEASN.map((n,k)=>'<span style="flex:1;justify-content:center;color:var(--'+(k===sn.s?'tx':'mut2')+')">'+IC(SEASI[k],'i16')+n+'</span>').join('')+'</div>';
    h+='<p class="note">Eine Jahreszeit dauert '+fmtDur(SEAS)+' Spielzeit. Felder bringen ihren Ertrag im Herbst auf einmal. Wetter lässt sich in den Einstellungen abschalten.</p>';}
  return h;
}
function showCal(){openModal('<div class="head"><div class="t" style="flex:1"><h2 style="margin:0">Jahreszeiten</h2></div><button class="x" data-act="closemodal" aria-label="Schließen"></button></div>'+calHTML(true));}
document.addEventListener('click',e=>{const el=e.target.closest('[data-act="cal"]');if(!el)return;$('#calTip').hidden=true;showCal();});
{const chip=document.getElementById('calChip'),tip=document.getElementById('calTip');
  if(chip){chip.addEventListener('mouseenter',()=>{if(!isDesk()||!S)return;tip.innerHTML=calHTML(false);const r=chip.getBoundingClientRect();tip.style.top=(r.bottom+8)+'px';tip.style.left=Math.max(12,Math.min(window.innerWidth-312,r.left+r.width/2-150))+'px';tip.hidden=false;});
    chip.addEventListener('mouseleave',()=>{tip.hidden=true;});}}
/* Jede Sekunde: Topbar, Hinweis-Tafel links, offener Tooltip */
let calSig='';
function renderCal(){
  if(!S)return;const sn=seasonOf(calE()),c=$('#calChip');if(!c)return;
  const g=winterGoal(),warn=!!(g&&g.s===2&&!g.ok&&sn.f>.4);
  const sig=sn.s+'|'+sn.y+'|'+warn;if(sig!==calSig){calSig=sig;c.className='k kcal s'+sn.s+(warn?' warn':'');const cm=$('#calM');if(cm)cm.className='kcal s'+sn.s+(warn?' warn':'');document.querySelectorAll('[data-cali]').forEach(im=>im.src=iconURL(SEASI[sn.s]));$('#calN').textContent=SEASN[sn.s];$('#calY').textContent='Jahr '+sn.y;c.title='';}
  document.querySelectorAll('[data-calring]').forEach(el=>el.setAttribute('stroke-dasharray',(sn.f*100).toFixed(1)+' 100'));
  const w=$('#wgoal');
  if(w){const show=!!g&&isDesk()&&$('#app').classList.contains('lopen');w.style.display=show?'':'none';
    if(show)w.innerHTML='<div class="sech">'+IC('winter','i16')+'<span class="lbl">'+(g.s===2?'Vor dem Winter':'Winter')+'</span><b>'+(g.s===2?'noch ':'Frühling in ')+fmtDur(g.rest/Math.max(1,CLK.k||1))+'</b></div><div class="wg" style="margin-top:0">'+winterGoalHTML(g)+'</div>';}
  const tip=$('#calTip');if(!tip.hidden)tip.innerHTML=calHTML(false);
}
setInterval(renderCal,1000);
