/* ---------- Ton: alles per WebAudio erzeugt, keine Dateien ---------- */
/* Start erst nach der ersten Berührung oder Taste (iOS verlangt das). Drei Regler: Musik, Effekte, Umgebung (mit Arbeitsgeräuschen).
   Dauerklänge (Wind, Brandung, Bienen, Bordun) werden einmal angelegt und nur in der Lautstärke geführt. */
var AU={c:null,next:{},voices:0,last:{},amb:{},mus:null,t:0,sc:null,scT:0};
/* Standardwerte für Spielstände ohne Toneinstellungen */
function aOpt(){const o=S.opt;if(o.snd===undefined)o.snd=true;if(o.vMus===undefined)o.vMus=.4;if(o.vSfx===undefined)o.vSfx=.6;if(o.vAmb===undefined)o.vAmb=.5;return o;}
function auStart(){
  if(AU.c){if(AU.c.state!=='running'&&!document.hidden&&aOpt().snd)AU.c.resume();return;}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC||!S)return;
  let c;try{c=new AC({latencyHint:'interactive'});}catch(e){try{c=new AC();}catch(e2){return;}}
  AU.c=c;try{const sb=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=sb;s.connect(c.destination);s.start(0);}catch(e){}
  if(c.resume)c.resume();
  /* Rauschen: weiß und braun, je ein Puffer für alles */
  const sr=c.sampleRate,len=sr*2,wb=c.createBuffer(1,len,sr),bb=c.createBuffer(1,len*1.5,sr),w=wb.getChannelData(0),br=bb.getChannelData(0);
  for(let i=0;i<len;i++)w[i]=Math.random()*2-1;
  let l=0;for(let i=0;i<br.length;i++){l=(l+.02*(Math.random()*2-1))/1.02;br[i]=l*3.5;}
  /* Übergang an der Schleifennaht glätten */
  for(let i=0;i<2000;i++){const k=i/2000;br[br.length-2000+i]=br[br.length-2000+i]*(1-k)+br[i]*k;}
  AU.nb=wb;AU.bb=bb;
  const G=v=>{const g=c.createGain();g.gain.value=v;return g;};
  AU.master=G(.8);const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;AU.master.connect(comp);comp.connect(c.destination);
  AU.mus=G(0);AU.sfx=G(0);AU.ambB=G(0);AU.work=G(1);AU.work.connect(AU.ambB);
  for(const b of[AU.mus,AU.sfx,AU.ambB])b.connect(AU.master);
  /* Nachhall: Rückkopplung mit Tiefpass, für Musik und Fanfaren */
  const dl=c.createDelay(1),fb=G(.32),lp=c.createBiquadFilter();dl.delayTime.value=.31;lp.type='lowpass';lp.frequency.value=1800;
  AU.rev=G(1);AU.rev.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);const wet=G(.5);lp.connect(wet);wet.connect(AU.master);
  /* Umgebung */
  const loop=(buf,ft,f,q,off)=>{const s=c.createBufferSource();s.buffer=buf;s.loop=true;const fl=c.createBiquadFilter();fl.type=ft;fl.frequency.value=f;fl.Q.value=q;const g=G(0);s.connect(fl);fl.connect(g);g.connect(AU.ambB);s.start(0,off);return{s,f:fl,g};};
  AU.amb.wind=loop(wb,'bandpass',500,.6,0);AU.amb.surf=loop(bb,'lowpass',520,.5,.7);
  {const g=G(0),bp=c.createBiquadFilter(),tr=G(.6),lfo=c.createOscillator(),lg=G(.35);bp.type='bandpass';bp.frequency.value=420;bp.Q.value=1.4;
    for(const f of[196,199.3,392.6]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(bp);o.start();}
    lfo.frequency.value=4.3;lfo.connect(lg);lg.connect(tr.gain);lfo.start();bp.connect(tr);tr.connect(g);g.connect(AU.ambB);AU.amb.bees={g,f:bp};}
  /* Bordun der Musik: Grundton und Quinte, leise atmend */
  {const g=G(0),lp2=c.createBiquadFilter();lp2.type='lowpass';lp2.frequency.value=420;
    for(const[f,v]of[[55,.6],[82.4,.35],[110.3,.25]]){const o=c.createOscillator(),og=G(v);o.type='triangle';o.frequency.value=f;o.connect(og);og.connect(lp2);o.start();}
    lp2.connect(g);g.connect(AU.mus);AU.drone={g};}
  AU.ml={next:c.currentTime+4,left:0,rest:1,deg:5,inst:'lyra'};
  auVol();setInterval(auTick,120);
  document.addEventListener('visibilitychange',()=>{if(!AU.c)return;if(document.hidden)AU.c.suspend();else if(aOpt().snd)AU.c.resume();});
}
for(const ev of['pointerdown','touchend','keydown'])window.addEventListener(ev,auStart,{capture:true,passive:true});
/* Regler anwenden; ganz aus heißt: Audio anhalten, spart Akku */
function auVol(){
  const c=AU.c;if(!c)return;const o=aOpt(),t=c.currentTime,q=v=>o.snd?v*v:0;
  AU.mus.gain.setTargetAtTime(q(o.vMus)*.9,t,.1);AU.sfx.gain.setTargetAtTime(q(o.vSfx),t,.05);AU.ambB.gain.setTargetAtTime(q(o.vAmb)*.9,t,.1);
  const off=!o.snd||(o.vMus+o.vSfx+o.vAmb)<.01;
  if(off&&c.state==='running')setTimeout(()=>{if(!aOpt().snd||(S.opt.vMus+S.opt.vSfx+S.opt.vAmb)<.01)c.suspend();},300);
  else if(!off&&c.state!=='running'&&!document.hidden)c.resume();
}

/* ---------- Bausteine ---------- */
function aEnv(g,t,a,v,d){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);}
function aVoice(s){AU.voices++;s.onended=()=>{AU.voices--;};}
function aTone(type,f,t,a,d,v,out,f2){const c=AU.c,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+a+d);aEnv(g,t,a,v,d);o.connect(g);g.connect(out);o.start(t);o.stop(t+a+d+.05);return o;}
function aNoise(t,a,d,v,out,ft,f,q,f2,bb){const c=AU.c,s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=bb?AU.bb:AU.nb;fl.type=ft;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+a+d);fl.Q.value=q||1;aEnv(g,t,a,v,d);s.connect(fl);fl.connect(g);g.connect(out);s.start(t,Math.random()*1.4);s.stop(t+a+d+.05);return s;}
function aPan(p,out){const c=AU.c;if(!c.createStereoPanner)return out;const n=c.createStereoPanner();n.pan.value=Math.max(-1,Math.min(1,p));n.connect(out);return n;}
const mtof=m=>440*Math.pow(2,(m-69)/12);
/* Leier: gezupft, Obertöne klingen schnell ab */
function aLyre(m,t,v,out,dur){const f=mtof(m),d=dur||1.6;aTone('triangle',f,t,.004,d,v,out);aTone('sine',f*2,t,.003,d*.5,v*.35,out);aVoice(aTone('sine',f*3.01,t,.002,d*.25,v*.12,out));}
/* Flöte: weicher Einsatz, Vibrato, etwas Atem */
function aFlute(m,t,v,out,d){const c=AU.c,f=mtof(m),o=c.createOscillator(),g=c.createGain(),vb=c.createOscillator(),vg=c.createGain();o.type='sine';o.frequency.value=f;vb.frequency.value=5.2;vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(f*.006,t+d*.6);vb.connect(vg);vg.connect(o.frequency);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.14);g.gain.setTargetAtTime(v*.7,t+.2,d*.4);g.gain.setTargetAtTime(.0001,t+d,.12);o.connect(g);g.connect(out);o.start(t);vb.start(t);o.stop(t+d+.7);vb.stop(t+d+.7);aVoice(o);
  aNoise(t,.08,.25,v*.18,out,'bandpass',f*2,3);}
/* Horn: Sägezahn durch Tiefpass, langsamer Einsatz */
function aHorn(f,t,d,v,out,bend){const c=AU.c,g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(300,t);lp.frequency.linearRampToValueAtTime(f*5,t+.18);lp.frequency.setTargetAtTime(f*3,t+.3,.3);lp.Q.value=2;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.12);g.gain.setTargetAtTime(v*.8,t+.2,.4);g.gain.setTargetAtTime(.0001,t+d,.15);
  for(const dt of[0,4]){const o=c.createOscillator();o.type='sawtooth';o.detune.value=dt;o.frequency.setValueAtTime(bend?f*.9:f,t);if(bend)o.frequency.exponentialRampToValueAtTime(f,t+.25);o.connect(lp);o.start(t);o.stop(t+d+.8);if(!dt)aVoice(o);}
  lp.connect(g);g.connect(out);}

/* ---------- Ereignisgeräusche ---------- */
function sfx(k){
  const c=AU.c;if(!c||c.state!=='running'||!S||!aOpt().snd||S.opt.vSfx<.01)return;
  const t=c.currentTime+.01,now=performance.now();if(now-(AU.last[k]||0)<(k==='click'?45:90))return;AU.last[k]=now;
  const o=AU.sfx,r=AU.rev;
  if(k==='click'){aVoice(aTone('triangle',1500,t,.002,.035,.09,o,1100));}
  else if(k==='build'){for(const[dt,f]of[[0,260],[.13,210]]){aTone('triangle',f,t+dt,.002,.08,.35,o,f*.7);aNoise(t+dt,.002,.06,.25,o,'bandpass',900,1.5);}}
  else if(k==='built'){aNoise(t,.003,.12,.25,o,'lowpass',500,1);[69,72,76].forEach((m,j)=>aLyre(m,t+.05+j*.09,.22,o,1.1));aLyre(76,t+.32,.08,r,1);}
  else if(k==='up'){[69,72,76,81].forEach((m,j)=>{aLyre(m,t+j*.08,.2,o,1.3);aTone('sine',mtof(m+12),t+j*.08,.002,.9,.05,r);});}
  else if(k==='hof'){
    aTone('sine',90,t,.005,.4,.5,o,45);aNoise(t,.005,.25,.25,o,'lowpass',300,1,0,1);
    aHorn(110,t+.05,.5,.22,o);aHorn(110,t+.05,.5,.08,r);aHorn(164.8,t+.6,.4,.22,o);aHorn(220,t+1.05,1.3,.26,o);aHorn(220,t+1.05,1.3,.1,r);
    aTone('sine',90,t+1.05,.005,.5,.45,o,45);[81,84,88,93].forEach((m,j)=>aLyre(m,t+1.15+j*.1,.09,r,1.4));}
  else if(k==='raid'){for(const dt of[0,1.5]){aHorn(98,t+dt,1.0,.3,o,1);aHorn(98,t+dt,1.0,.12,r,1);aHorn(146.8,t+dt+.05,.9,.1,o,1);}}
  else if(k==='coins'){for(let j=0;j<4;j++){const tt=t+j*.055+Math.random()*.02,f=2600+Math.random()*1500;aTone('sine',f,tt,.001,.18,.09,o);aTone('sine',f*1.47,tt,.001,.1,.04,o);}aVoice(aTone('sine',3800,t+.24,.001,.3,.05,r));}
  else if(k==='err'){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;lp.connect(o);aTone('square',185,t,.004,.09,.12,lp,160);aVoice(aTone('square',150,t+.12,.004,.14,.12,lp,130));}
}

/* ---------- Umgebung ---------- */
const AWIND={taiga:1,berg:1},ATERR={berg:1,rock:.6,tundra:.8};
/* Bildausschnitt abtasten: wie viel Meer, Bergwind, Heide und Land; Ergebnis nur alle 0,4 s neu */
function auScene(){
  if(AU.sc&&UT-AU.scT<400)return AU.sc;AU.scT=UT;
  let sea=0,wind=0,heide=0,land=0,n=0;
  for(let gy=-3;gy<=3;gy++)for(let gx=-3;gx<=3;gx++){const w=1/(1+.25*(gx*gx+gy*gy)),t=screenToTile(W/2+gx*W/7,H/2+gy*H/7);n+=w;
    if(t<0){sea+=w;continue;}const T=S.tiles[t];if(T.t==='water'){sea+=w*(T.r===0?.5:.8);continue;}
    land+=w;const id=REG[T.r]&&REG[T.r].id;wind+=w*Math.max(AWIND[id]||0,ATERR[T.t]||0);if(id==='heide'||T.t==='heide')heide+=w;}
  return AU.sc={sea:sea/n,wind:wind/n,heide:heide/n,land:land/n};
}
function auAmb(t){
  const A=AU.amb,on=tab==='insel'&&!document.hidden,z=view.z,near=Math.max(0,Math.min(1,(z-.45)/.7)),far=1-near,s=auScene(),day=1-night;
  const k=on?1:.35,sw=Math.sin(t*.9)*.5+.5,sw2=Math.sin(t*.37+1)*.5+.5,gust=Math.sin(t*.23)*Math.sin(t*.61+2)*.5+.5;
  A.wind.g.gain.setTargetAtTime(k*(.14+s.wind*.9+far*.3)*(.55+gust*.6),t,.6);A.wind.f.frequency.setTargetAtTime(280+gust*520+s.wind*200,t,.5);
  A.surf.g.gain.setTargetAtTime(k*Math.min(1,s.sea*1.6)*(.35+.65*Math.pow(sw*sw2,.7))*(.5+near*.4),t,.4);A.surf.f.frequency.setTargetAtTime(300+near*500+sw*250,t,.4);
  A.bees.g.gain.setTargetAtTime(k*s.heide*day*near*.09,t,.8);
  /* Vögel am Tag, Grillen und Eule in der Nacht: kurze Einzelstimmen */
  if(!on||AU.voices>14)return;const o=AU.ambB,land=s.land*(.4+near*.6);
  if(day>.3&&Math.random()<.05*day*land){const f=2200+Math.random()*1800,n=2+Math.floor(Math.random()*4),p=aPan(Math.random()*1.4-.7,o),v=.03+near*.03;
    for(let j=0;j<n;j++){const tt=t+j*(.09+Math.random()*.05);aVoice(aTone('sine',f*(1+Math.random()*.15),tt,.01,.07,v,p,f*(Math.random()<.5?1.35:.8)));}}
  if(night>.4){if(Math.random()<.12*night*land){const f=4300+Math.random()*500,p=aPan(Math.random()*1.6-.8,o);for(let j=0;j<3;j++)aVoice(aTone('sine',f,t+j*.055,.005,.03,.012*night,p));}
    if(Math.random()<.0035*night*land){const p=aPan(Math.random()-.5,AU.rev);aTone('sine',392,t,.06,.35,.05,p,370);aVoice(aTone('sine',370,t+.55,.08,.6,.045,p,340));}}
}

/* ---------- Arbeitsgeräusche sichtbarer Betriebe ---------- */
const WORKS={holzfaeller:'axe',jaeger:'axe',steinbruch:'pick',erzmine:'pick',silbermine:'pick',schmiede:'anvil',schmelze:'anvil',saegewerk:'saw',baeckerei:'mill'};
const WPER={axe:1.8,pick:1.35,anvil:.9,saw:1.3,mill:2.6};
function auHit(kind,t,v,p,n){
  const o=aPan(p,AU.work);
  if(kind==='axe'){aTone('sine',150,t,.002,.12,v*.6,o,70);aTone('triangle',430,t,.001,.05,v*.35,o,300);aVoice(aNoise(t,.001,.07,v*.5,o,'bandpass',1700,1.3));}
  else if(kind==='pick'){aTone('sine',2350,t,.001,.16,v*.18,o);aTone('sine',3420,t,.001,.09,v*.1,o);aVoice(aNoise(t,.001,.04,v*.4,o,'bandpass',3000,2));}
  else if(kind==='anvil'){const s=n%3===2?.5:1;aTone('sine',1250,t,.001,.45*s,v*.2*s,o);aTone('sine',1880,t,.001,.3*s,v*.12*s,o);aTone('sine',2930,t,.001,.18,v*.07*s,o);aVoice(aNoise(t,.001,.03,v*.3*s,o,'highpass',2000,1));}
  else if(kind==='saw'){const up=n%2;aVoice(aNoise(t,.18,.32,v*.32,o,'bandpass',up?900:1400,4,up?1400:900));}
  else if(kind==='mill'){aTone('sawtooth',62,t,.4,.9,v*.12,o,58);aVoice(aTone('triangle',190,t+.5,.002,.09,v*.25,o,150));aNoise(t,.3,.9,v*.15,o,'lowpass',250,1,0,1);}
}
/* Läuft der Betrieb gerade? Nicht im Bau, nicht ruhend, Werkstatt mit laufendem Auftrag */
function working(i){const b=S.tiles[i].b;if(!b||busy(b))return false;const d=B[b.type];if(typeof idleWhy==='function'){const w=idleWhy(i);if(w&&w.k!=='road')return false;}return d.kind==='craft'?!!b.run:prodRate(i)>0;}
function auWork(t){
  const paused=!CLK.k||tab!=='insel'||!!battle||document.hidden;
  AU.work.gain.setTargetAtTime(paused?0:1,t,paused?.02:.2);if(paused){AU.next={};return;}
  const zf=Math.max(0,Math.min(1,(view.z-.35)/.75));if(zf<=0)return;
  const R=Math.min(W,H)*.65,cand=[];
  for(const i of BL){const b=S.tiles[i].b,kind=WORKS[b.type];if(!kind)continue;const[wx,wy]=bPos(i),px=W/2+view.x+wx*view.z,py=H/2+view.y+wy*view.z;
    if(px<-40||py<-40||px>W+40||py>H+40)continue;const d=Math.hypot(px-W/2,py-H/2)/R;if(d>=1)continue;const v=(1-d)*(1-d)*zf;if(v<.04)continue;cand.push([v,i,kind,(px-W/2)/(W/2)]);}
  cand.sort((a,b)=>b[0]-a[0]);const keep={},sp=Math.min(2,Math.sqrt(CLK.k));
  for(let q=0;q<cand.length&&q<4;q++){const[v,i,kind,px]=cand[q];if(!working(i))continue;let nx=AU.next[i];
    if(!nx||nx.t<t-.5)nx={t:t+Math.random()*WPER[kind],n:0};
    while(nx.t<t+.2){if(AU.voices<24)auHit(kind,Math.max(t,nx.t),v*.7,px*.7,nx.n);nx.n++;nx.t+=WPER[kind]*(.85+Math.random()*.3)/sp*(kind==='anvil'&&nx.n%3===0?1.8:1);}
    keep[i]=nx;}
  AU.next=keep;
}

/* ---------- Musik: Leier und Flöte, a-Moll pentatonisch über Bordun, mit langen Pausen ---------- */
const PENTA=[45,48,50,52,55,57,60,62,64,67,69,72,74,76,79,81];
function auMusic(t){
  const M=AU.ml,o=AU.mus,on=S.opt.vMus>.01;
  if(t<M.next-.25||!on)return;
  if(M.left<=0){/* Pause, dann neue Phrase */
    if(M.rest){M.rest=0;M.left=4+Math.floor(Math.random()*6);M.inst=Math.random()<(.35+night*.4)?'floete':'lyra';M.deg=6+Math.floor(Math.random()*5);
      AU.drone.g.gain.setTargetAtTime(.16,t,2.5);return;}
    M.rest=1;M.next=t+6+Math.random()*10;AU.drone.g.gain.setTargetAtTime(.05,t+1,3);return;}
  const st=[-2,-1,-1,1,1,2,0][Math.floor(Math.random()*7)];M.deg=Math.max(4,Math.min(PENTA.length-1,M.deg+st));
  if(M.left===1)M.deg=Math.random()<.6?10:5;/* am Ende zum Grundton */
  const m=PENTA[M.deg]+(M.inst==='floete'?12:0),tt=Math.max(t,M.next);
  if(M.inst==='lyra'){const d=[.45,.6,.9,.9,1.3][Math.floor(Math.random()*5)];aLyre(m,tt,.16,o,2.2);aLyre(m,tt,.05,AU.rev,1.5);if(Math.random()<.25)aLyre(m-12,tt,.08,o,2.4);M.next=tt+d;}
  else{const d=[.8,1.1,1.6,2.2][Math.floor(Math.random()*4)];aFlute(m,tt,.07,o,d*.92);aFlute(m,tt,.025,AU.rev,d*.9);M.next=tt+d;}
  M.left--;
}
function auTick(){
  const c=AU.c;if(!c||c.state!=='running'||!S)return;const t=c.currentTime;
  if(AU.voices<0)AU.voices=0;
  try{auAmb(t);auWork(t);auMusic(t);}catch(e){}
}

/* ---------- Einstellungen im Menü ---------- */
function sndHTML(){
  const o=aOpt(),row=(k,ic,n)=>'<div class="vrow"><span class="n">'+IC(ic,'i24')+n+'</span><input type="range" min="0" max="100" step="1" value="'+Math.round(o[k]*100)+'" data-vol="'+k+'" aria-label="'+n+'"'+(o.snd?'':' disabled')+'></div>';
  return '<h3>Ton</h3>'+TOG('snd','Ton','ton')+row('vMus','musik','Musik')+row('vSfx','hoch','Effekte')+row('vAmb','wald','Umgebung');
}
document.addEventListener('input',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.vol;if(!k)return;S.opt[k]=Math.max(0,Math.min(1,+e.target.value/100));auStart();auVol();});
document.addEventListener('change',e=>{if(e.target&&e.target.dataset&&e.target.dataset.vol){save();sfx('click');}});
/* Klickgeräusch für alle Knöpfe; Schalter für Ton sofort anwenden */
document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('button,[data-act]');if(!el)return;if(el.dataset.act==='opt'&&el.dataset.k==='snd'){auStart();auVol();}sfx('click');});
{const st=document.createElement('style');st.textContent='.vrow{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)}.vrow .n{width:112px;flex-shrink:0}.vrow input{flex:1;min-width:0;accent-color:var(--gold);height:28px}.vrow input:disabled{opacity:.4}';document.head.appendChild(st);}
