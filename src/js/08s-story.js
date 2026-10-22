/* ---------- Geschichte: Szenen, Ereignisse, Gunst und Saga ---------- */
/* Neue Gesichter und Zeichen */
Object.assign(PCFG,{
  hrafn:{bg:'#C8C3D0',tun:'#1F2326',skin:'#E2B48E',helm:1,beard:'#1C1C20',scar:1,fur:1},
  bote:{bg:'#D5CEC8',tun:'#2F2B2A',skin:'#D9A982',hood:'#2F2B2A',beard:'#4A3B36'},
  skalde:{bg:'#E6DCC2',tun:'#6E4F80',skin:'#F0C9A8',cap:'#5C3F6E',beard:'#C9A86A'}
});
Object.assign(DRAW,{
  rabe(g){P(g,[-36,8,-10,-2,-6,14,-32,24],'#2A2D33');E(g,0,4,24,15,'#33373E');E(g,20,-12,12,11,'#33373E');P(g,[30,-15,44,-8,30,-6],'#C4862A');E(g,22,-15,2.6,2.6,'#F1E9DA',false);
    g.beginPath();g.moveTo(-10,-4);g.quadraticCurveTo(6,-24,22,0);g.quadraticCurveTo(6,8,-10,-4);fs(g,'#22252A');L(g,[-2,18,-4,32],'#C4862A',3);L(g,[8,18,9,32],'#C4862A',3);},
  buch(g){RR(g,-36,-28,72,58,6,'#7A2418');RR(g,-31,-24,30,48,3,'#F1E9DA',false);RR(g,1,-24,30,48,3,'#E8DEC6',false);L(g,[0,-26,0,28],'#5A1A10',3);
    for(const y of[-14,-6,2,10])L(g,[-25,y,-7,y],'#B9A07A',2);for(const y of[-14,-6,2])L(g,[7,y,25,y],'#B9A07A',2);E(g,16,12,6,6,'#9A3224',false);}
});

/* ---------- Zustand (S.story) ---------- */
let SC=null,SCT=0;const SNOTE=[];
const SEAS=['Frühling','Sommer','Herbst','Winter'],ORDW=['','ersten','zweiten','dritten','vierten','fünften','sechsten','siebten','achten','neunten','zehnten','elften','zwölften'];
const YEARMS=40*60e3;
function ST(){if(!S.story)S.story=storyNew();return S.story;}
function homesDone(){let n=0;for(const i of BL){const b=S.tiles[i].b;if(b.type!=='hof'&&B[b.type].kind==='home'&&!(b.job==='build'&&busy(b)))n++;}return n;}
/* Alte Spielstände: Erreichtes gilt als erzählt, die Saga beginnt mit einer Rückschau */
function storyNew(){
  const st={f:{bjorn:0,sigrid:0},seen:{},q:[],saga:[],joy:[],ev:{acc:0,wait:rand(EVGAP[0],EVGAP[1]),cur:null,last:[]},raidT:0,lt:Date.now(),hrafn:0,fl:{}},L=S.chap||0;
  if(L>=1){
    for(let k=1;k<=L;k++)st.seen['ch'+k]=1;
    if(BL.length&&homesDone()>1)st.seen.haus1=1;
    if(S.raid.log.length||S.raid.n)st.fl.raid1=1;
    if(S.wins.some(x=>x))st.fl.run1=1;
    for(const n of[10,20,40])if(S.pop.n>=n)st.seen['pop'+n]=1;
    st.raidT=S.raid.log.length?S.raid.log[0].t:0;
    st.saga.push({y:1,s:S.cal?-1:0,x:'landete Ragna mit der Sippe an einer fremden Küste',ic:'schiff'});
    if(L>1){const d=calInfo();st.saga.push({y:d.y,s:d.s,x:'war der Häuptlingshof bis zur '+ORDW[L]+' Stufe gewachsen, als diese Saga aufgeschrieben wurde',ic:'krone'});}
  }
  return st;
}
/* Datum: Kalender, falls vorhanden (S.cal), sonst 40 Spielminuten je Jahr, 10 je Jahreszeit */
function calInfo(){
  const c=S.cal&&typeof S.cal==='object'?S.cal:null;let y=c?(c.y??c.year??c.jahr):undefined,s=c?(c.s??c.season??c.sz??c.saison):undefined;
  if(typeof s==='string'){const t=s.toLowerCase();s=/win/.test(t)?3:/herb|autu|fall/.test(t)?2:/som|sum/.test(t)?1:/fr|spr|lenz/.test(t)?0:-1;}
  const el=Math.max(0,nowT()-(S.started||nowT()));
  if(typeof y!=='number'||!(y>=0))y=1+Math.floor(el/YEARMS);else y=Math.max(1,Math.round(y)+(y<1?1:0));
  if(typeof s!=='number'||s<0||s>3)s=c?-1:Math.floor(el%YEARMS/(YEARMS/4));
  return{y,s,cal:!!c};
}
const ordY=y=>ORDW[y]||y+'.';
function sagaSent(e){const d=e.s>=0?'im '+SEAS[e.s]+' des '+ordY(e.y)+' Jahres':'im '+ordY(e.y)+' Jahr';return d[0].toUpperCase()+d.slice(1)+' '+e.x+'.';}
function sagaAdd(x,ic){if(!x)return;const st=ST(),d=calInfo();st.saga.push({y:d.y,s:d.s,x,ic:ic||'buch'});if(st.saga.length>200)st.saga.splice(0,st.saga.length-200);}

/* ---------- Gunst und ihre Folgen (Haken in mood, warStats, price) ---------- */
const favClamp=v=>Math.max(GUNST.min,Math.min(GUNST.max,v));
function storyMood(parts){const st=S&&S.story;if(!st)return;const t=nowT();
  for(const e of st.joy)if(e.until>t)parts.push([e.v>0?'froh':'sauer',e.v,e.n]);
  for(const k of['bjorn','sigrid'])if(st.f[k]<=GUNST.lo)parts.push(['sauer',GUNST.murr,FIGS[k].n+' murrt']);}
function storyAtk(){return S&&S.story&&S.story.f.bjorn>=GUNST.hi?GUNST.atk:0;}
function storyPrice(p){return S&&S.story&&S.story.f.sigrid>=GUNST.hi?Math.max(p+1,Math.round(p*GUNST.price)):p;}

/* ---------- Folgen ---------- */
function fxOf(o,p){const f=o&&o.fx;return typeof f==='function'?f(p||{}):(f||{});}
const foodSum=()=>FOOD.reduce((a,k)=>a+Math.floor(S.res[k]||0),0);
function canFx(fx){if(fx.r){const c={};for(const k in fx.r)if(fx.r[k]<0)c[k]=-fx.r[k];if(!has(c))return false;}return !(fx.food&&foodSum()<-fx.food);}
/* Vorschau ohne Wirkung, gleiche Form wie das Ergebnis von applyFx */
function previewFx(fx){const o=[];
  if(fx.r)for(const k in fx.r)o.push([k,fx.r[k]]);if(fx.food)o.push(['fisch',fx.food]);
  if(fx.pct)for(const k in fx.pct)o.push([k,'−'+Math.round(-fx.pct[k]*100)+' %']);if(fx.sell)o.push(['muenzen','+']);
  if(fx.f)for(const k in fx.f)if(fx.f[k])o.push(['f:'+k,fx.f[k]]);if(fx.joy)o.push(['joy',fx.joy[0],fx.joy[1]]);if(fx.pop)o.push(['leute',fx.pop]);
  if(fx.raid)o.push(['raid',fx.raid]);if(fx.wound)o.push(['wound',fx.wound[1],fx.wound[0]]);if(fx.stop)o.push(['stop',fx.stop[1],fx.stop[0]]);return o;}
function applyFx(fx){
  const st=ST(),o=[];
  if(fx.r)for(const k in fx.r){let v=fx.r[k];if(v<0)v=-Math.min(-v,Math.floor(S.res[k]||0));if(!v)continue;if(v>0)add(k,v);else S.res[k]+=v;o.push([k,v]);}
  if(fx.food){let need=-fx.food;const tot=need;for(const k of FOOD){const u=Math.min(need,Math.floor(S.res[k]||0));S.res[k]-=u;need-=u;if(need<=0)break;}if(tot-need>0)o.push(['fisch',-(tot-need)]);}
  if(fx.pct)for(const k in fx.pct){const l=Math.floor((S.res[k]||0)*-fx.pct[k]);if(l>0){S.res[k]-=l;o.push([k,-l]);}}
  if(fx.sell){const ks=Object.keys(RES).filter(k=>capped(k)&&KNOWN.has(k)).sort((a,b)=>S.res[b]-S.res[a]).slice(0,2);let c=0;
    for(const k of ks){const n=Math.min(fx.sell,Math.floor(S.res[k]));if(n<=0)continue;S.res[k]-=n;c+=n*price(k);o.push([k,-n]);}if(c){S.res.muenzen+=c;o.push(['muenzen',c]);}}
  if(fx.f)for(const k in fx.f){if(!fx.f[k])continue;st.f[k]=favClamp((st.f[k]||0)+fx.f[k]);o.push(['f:'+k,fx.f[k]]);}
  if(fx.joy){const[v,m,n]=fx.joy;st.joy.push({v,n,until:nowT()+m*60e3});o.push(['joy',v,m]);}
  if(fx.pop){const n=Math.min(fx.pop,Math.max(0,Math.floor(D.house)-S.pop.n));if(n>0){S.pop.n+=n;o.push(['leute',n]);}}
  if(fx.raid&&S.raid.next&&!S.raid.pending){S.raid.next=Math.max(now()+30e3,S.raid.next+fx.raid*1000);o.push(['raid',fx.raid]);}
  if(fx.wound){const i=CREWP.indexOf(fx.wound[0]);if(i>=0){S.crew[i].wounded=Math.max(S.crew[i].wounded||0,now()+fx.wound[1]*60e3);o.push(['wound',fx.wound[1],fx.wound[0]]);}}
  if(fx.stop){const[t,m]=fx.stop,i=BL.find(j=>{const b=S.tiles[j].b;return b.type===t&&!busy(b);});if(i!==undefined){const b=S.tiles[i].b;b.until=now()+m*60e3;b.job='fix';o.push(['stop',m,t]);}}
  mood();return o;
}
const sgn=v=>v>0?'+'+fmt(v):'−'+fmt(-v);
function chipHTML(c){
  const[k,v,x]=c;let ic,t,cls=typeof v==='number'?(v>0?'up':'dn'):'';
  if(k.startsWith('f:')){const w=k.slice(2);ic='<img class="por" src="'+portrait(w)+'" alt="">'+IC(v>0?'hoch':'ab','i14');t=sgn(v);}
  else if(k==='joy'){ic=IC(v>0?'froh':'sauer','i20');t=sgn(v)+'<small>'+x+' min</small>';}
  else if(k==='raid'){ic=IC('schiff','i20');t=(v>0?'+':'−')+fmtDur(Math.abs(v))+'<small>bis Überfall</small>';}
  else if(k==='wound'){ic='<img class="por" src="'+portrait(x)+'" alt="">'+IC('herz','i14');t=v+' min<small>verwundet</small>';cls='dn';}
  else if(k==='stop'){ic='<img class="ico i20" src="'+thumb(x)+'" alt="">';t=v+' min<small>still</small>';cls='dn';}
  else{ic=IC(k,'i20');t=typeof v==='number'?sgn(v):v;}
  return '<span class="'+cls+'">'+ic+'<b>'+t+'</b></span>';
}
const chipsHTML=a=>a.length?'<span class="scfx">'+a.map(chipHTML).join('')+'</span>':'';

/* ---------- Szene spielen ---------- */
function scDef(id){return SCN[id];}
function scPlay(id,ev,p){
  const d=ev?{t:ev.t,lines:ev.lines,ch:ev.ch}:scDef(id);if(!d)return;
  SC={id,d,ev:ev||null,p:p||{},i:0,phase:'talk',pick:null,who:'',ic:ev?ev.ic:d.kap?'krone':SCIC[id]||'buch',lines:d.lines.map(([w,t])=>[w,typeof t==='function'?t(p||{}):t])};
  if(place)endPlace();
  const lbl=d.kap?'Kapitel '+ROM[d.kap]:ev?'Ereignis':'Saga',ttl=d.kap?CHAPTER[d.kap].n:d.t;
  openModal('<div class="sc"><div class="scp"><div class="scpor" id="scPor"><img id="scImg" alt=""></div><div class="scnm"><b id="scNm"></b><small id="scRo"></small></div></div>'+
    '<div class="scm"><div class="sck">'+(ev?IC(ev.ic,'i16'):'')+lbl+'</div><h1 class="sch">'+esc(ttl)+'</h1><div class="scbox" id="scBox"><p class="sct" id="scT"></p><i class="scmore" id="scMore"></i></div>'+
    '<div class="scpips" id="scPips">'+SC.lines.map(()=>'<i></i>').join('')+'</div><div class="scch" id="scCh"><span class="schint">'+(isDesk()?'Leertaste oder Klick':'Tippen')+': weiter</span></div></div></div>','scard');
  scLine();
}
function scSpeaker(w){
  if(SC.who===w)return;SC.who=w;const f=FIGS[w]||{n:w,r:''},por=$('#scPor');
  $('#scImg').src=portrait(w,3);$('#scNm').textContent=f.n;$('#scRo').textContent=f.r;
  por.classList.remove('swap');void por.offsetWidth;por.classList.add('swap');
}
function scSay(t){SC.txt=t;SC.n=0;SC.t0=Date.now();SC.typing=true;$('#scMore').classList.remove('on');clearInterval(SCT);SCT=setInterval(scType,22);scType();}
function scType(){
  if(!SC){clearInterval(SCT);SCT=0;return;}const el=$('#scT');if(!el)return;
  SC.n=Math.min(SC.txt.length,Math.max(SC.n,Math.floor((Date.now()-SC.t0)/14)));el.textContent=SC.txt.slice(0,SC.n);
  if(SC.n>=SC.txt.length){SC.typing=false;clearInterval(SCT);SCT=0;$('#scMore').classList.add('on');if(SC.phase==='talk'&&SC.i>=SC.lines.length-1)scEnd();}
}
function scLine(){const[w,t]=SC.lines[SC.i];scSpeaker(w);scSay(t);document.querySelectorAll('#scPips i').forEach((e,k)=>e.classList.toggle('on',k<=SC.i));}
function scAdv(){
  if(!SC)return;if(SC.typing){SC.n=SC.txt.length;scType();return;}
  if(SC.phase==='talk'){if(SC.i<SC.lines.length-1){SC.i++;scLine();}else scEnd();return;}
  if(SC.phase==='result')scFinish();
}
/* Ende des Gesprächs: Wahl oder Ergebnis */
function scUnl(){const d=SC.d;let h='';
  if(d.kap>1){const u=unlocksOf(d.kap).slice(0,8);if(u.length)h+='<div class="scunl"><span class="lbl">Neu freigeschaltet</span><div>'+u.map(x=>'<span title="'+esc(x[2])+'">'+x[0]+'<b>'+x[1]+'</b></span>').join('')+'</div></div>';}
  if(d.perk)h+='<div class="scperk">'+IC(/murr/.test(d.perk)?'sauer':'krone','i28')+'<span>'+d.perk+'</span></div>';return h;}
function scEnd(){
  if(SC.phase!=='talk')return;const d=SC.d;
  if(d.ch&&SC.pick==null){SC.phase='choice';
    $('#scCh').innerHTML=scUnl()+d.ch.map((c,j)=>{const fx=fxOf(c,SC.p),ok=canFx(fx),t=typeof c.t==='function'?c.t(SC.p):c.t;
      return '<button class="scbtn'+(ok?'':' off')+'" data-sc="c" data-j="'+j+'"><span class="k">'+(j+1)+'</span><span class="t">'+esc(t)+(ok?'':'<small>Zu wenig Vorrat</small>')+'</span>'+chipsHTML(previewFx(fx))+'</button>';}).join('');
  }else{scResolve();scResult();}
}
function scResult(){SC.phase='result';const d=SC.d;
  $('#scCh').innerHTML=scUnl()+(SC.chips&&SC.chips.length?'<div class="scres"><span class="lbl">Folgen</span>'+chipsHTML(SC.chips)+'</div>':'')+
    '<button class="btn gold wide scgo" data-sc="end">'+(d.end||(d.kap===1?'Los geht es':'Weiter'))+'</button>';}
function scChoose(j){
  if(!SC||SC.phase!=='choice')return;const c=SC.d.ch[j];if(!c)return;
  if(!canFx(fxOf(c,SC.p))){toast(IC('lager','i24')+'Zu wenig Vorrat');return;}
  SC.pick=j;scResolve();scResult();if(c.re){scSpeaker(c.re[0]);scSay(c.re[1]);}refresh();
}
/* Saga-Kopf eines Kapitels, dann die Folgen (bei Abbruch die Standardwahl) */
function scResolve(){
  if(SC.applied)return;SC.applied=true;const d=SC.d;
  if(d.kap){sagaAdd(d.kap===1?d.saga:'wurde der Häuptlingshof zur '+ORDW[d.kap]+' Stufe ausgebaut','krone');if(d.saga2)sagaAdd(d.saga2,'rabe');}
  if(d.ch){let j=SC.pick;if(j==null){j=d.def||0;if(!canFx(fxOf(d.ch[j],SC.p))){const k=d.ch.findIndex(c=>canFx(fxOf(c,SC.p)));if(k>=0)j=k;}SC.pick=j;}
    const c=d.ch[j];SC.chips=applyFx(fxOf(c,SC.p));sagaAdd(c.saga,SC.ic);}
  else{SC.chips=d.fx?applyFx(d.fx):[];if(!d.kap)sagaAdd(d.saga,SC.ic);}
}
function scDone(){
  const st=ST(),d=SC.d;clearInterval(SCT);SCT=0;
  if(SC.ev)evClear(SC.ev.id);else if(!d.rep)st.seen[SC.id]=1;
  if(d.hrafn&&!st.hrafn){st.hrafn=1;if(!S.raid.pending)S.raid.next=Math.min(S.raid.next||Infinity,now()+90e3);}
  SC=null;derive();save();setTimeout(storyPump,900);
}
function scFinish(){if(!SC)return;const go=SC.d.go;scResolve();scDone();closeModal();if(go&&tabHL(go)<=hofL())setTab(go);else{renderTop();renderBuild();render();}}
/* Fenster wurde von außen geschlossen oder ersetzt */
function scAbort(replaced){
  clearInterval(SCT);SCT=0;
  if(SC.ev&&!SC.applied){SC=null;return;}
  if(replaced&&!SC.applied){const st=ST();if(!st.q.includes(SC.id))st.q.unshift(SC.id);SC=null;return;}
  scResolve();scDone();
}
function enq(id,front){const st=ST(),d=SCN[id];if(!d||(st.seen[id]&&!d.rep)||st.q.includes(id)||(SC&&SC.id===id))return;if(front)st.q.unshift(id);else st.q.push(id);}
function storyPump(force){
  if(!S||SC||battle)return;const st=ST();
  while(st.q.length){
    if(!force&&(!$('#modal').hidden||(tab==='raub'&&S.run)))return;
    const id=st.q.shift(),d=SCN[id];if(!d||(st.seen[id]&&!d.rep))continue;scPlay(id);return;}
}
/* Haken in showChapter: Kapitel als Szene erzählen, schon erzählte nicht nochmal */
function storyChapter(L){
  if(!S||!SCN['ch'+L])return false;const st=ST();S.chap=Math.max(S.chap||0,L);
  if(!st.seen['ch'+L]){st.q=st.q.filter(x=>x!=='ch'+L);st.q.unshift('ch'+L);storyPump(true);}
  save();return true;
}

/* ---------- Ereignisse ---------- */
function pickEvent(){const st=ST(),c=EVENTS.filter(e=>{try{return e.c();}catch(x){return false;}}),a=c.filter(e=>!st.ev.last.includes(e.id)),pool=a.length?a:c.filter(e=>e.id!==st.ev.last[0]);return pool.length?pick(pool):null;}
function evAnnounce(ev){const st=ST();st.ev.cur={id:ev.id,p:ev.prep?ev.prep():{},age:0};toast(POR(ev.p,24)+ev.t);bell();}
function evClear(id){const e=ST().ev;e.cur=null;e.last.unshift(id);e.last=e.last.slice(0,3);e.acc=0;e.wait=rand(EVGAP[0],EVGAP[1]);}
/* Keine Antwort (oder offline): Standardfolge, als Bericht */
function evNone(off){
  const st=ST(),cur=st.ev.cur,ev=cur&&EVENTS.find(e=>e.id===cur.id);if(!ev){st.ev.cur=null;return;}
  const n=ev.none||{},o=applyFx(fxOf(n,cur.p));sagaAdd(n.saga,ev.ic);evClear(ev.id);
  SNOTE.push(POR(ev.p,24)+'<span>'+(off?'Während ihr fort wart: ':'')+'<b>'+ev.t+'</b>'+(off?'':' ohne Antwort')+'</span>'+chipsHTML(o));
  save();
}
function evPlay(){const st=ST(),cur=st.ev.cur;if(!cur||SC||battle)return;const ev=EVENTS.find(e=>e.id===cur.id);if(!ev){st.ev.cur=null;return;}scPlay('e:'+ev.id,ev,cur.p);bell();}
/* Hinweis am Rand: pulsierendes Porträt, Ring zeigt die Zeit bis zur Standardfolge */
function bell(){
  let el=$('#sbell');const st=S&&S.story,cur=st&&st.ev.cur,ev=cur&&EVENTS.find(e=>e.id===cur.id),on=!!ev&&!SC;
  if(!el){if(!on)return;el=document.createElement('button');el.id='sbell';el.setAttribute('aria-label','Ereignis');el.onclick=evPlay;$('#app').appendChild(el);}
  el.hidden=!on;if(!on)return;
  if(el.dataset.id!==cur.id){el.dataset.id=cur.id;el.innerHTML='<span class="ring"><img src="'+portrait(ev.p,2)+'" alt=""></span><em>'+IC(ev.ic,'i16')+'</em><span class="lb">'+esc(ev.t)+'</span>';el.title=ev.t;}
  el.style.setProperty('--p',Math.min(1,cur.age/EVWAIT).toFixed(3));
}
function storyEvent(id){const ev=id?EVENTS.find(e=>e.id===id):pickEvent();if(!ev)return false;const st=ST();if(st.ev.cur)evClear(st.ev.cur.id);evAnnounce(ev);return true;}

/* ---------- Takt: Wegmarken, Ereignisse, Hinweise ---------- */
function milestones(st){
  if(homesDone()>1)enq('haus1');
  const log=S.raid.log;
  if(log.length&&log[0].t>st.raidT){const nw=log.filter(r=>r.t>st.raidT).reverse();st.raidT=log[0].t;
    for(const r of nw){
      if(st.hrafn===1){enq(r.win?'hrafnWin':'hrafnLose');if(r.win)st.hrafn=2;continue;}
      sagaAdd(r.win?'wehrte die Sippe die '+(r.n+1)+'. Welle von Hrafns Plünderern ab':'plünderten Hrafns Männer die Speicher von Nordhof',r.win?'schild':'abriss');
      if(!st.fl.raid1){st.fl.raid1=1;enq(r.win?'raid1w':'raid1l');}}}
  const R=S.run;if(R&&R.over&&!R.sg){R.sg=1;const z=['','zum Fischerdorf','zu den Grabhügeln','zur Festung des Jarls'][R.diff]||'';
    sagaAdd(R.over.ok?'kehrte die Mannschaft vom Raubzug '+z+' mit Beute heim':'scheiterte ein Raubzug '+z,'schiff');if(!st.fl.run1){st.fl.run1=1;enq(R.over.ok?'run1ok':'run1bad');}}
  if(hofL()>=2&&now()-(S.started||now())>5*60e3&&Object.keys(RES).some(k=>capped(k)&&KNOWN.has(k)&&S.res[k]>=D.cap))enq('lagervoll');
  for(const n of[10,20,40])if(S.pop.n>=n)enq('pop'+n);
  if(typeof S.cal!=='undefined'&&S.cal&&calInfo().s===3)enq('winter1');
  for(const k of['bjorn','sigrid']){const v=st.f[k];if(v>=GUNST.hi)enq(k+'Hi');if(v<=GUNST.lo&&!st.fl[k+'Lo']){st.fl[k+'Lo']=1;enq(k+'Lo');}if(v>GUNST.lo+2)st.fl[k+'Lo']=0;}
}
function storyTick(){
  if(!S||!S.tiles||!BL.length)return;const st=ST(),t=Date.now();
  if(st.lt&&t-st.lt>10*60e3&&st.seen.ch1){if(!st.ev.cur){const ev=pickEvent();if(ev)st.ev.cur={id:ev.id,p:ev.prep?ev.prep():{},age:0};}if(st.ev.cur)evNone(true);}
  st.lt=t;
  if(SC){if($('#modal').hidden)scAbort(false);else if(!$('#modalCard').classList.contains('scard'))scAbort(true);}
  const tn=nowT();if(st.joy.length&&st.joy.some(e=>e.until<=tn))st.joy=st.joy.filter(e=>e.until>tn);
  if(st.seen.ch1)milestones(st);
  const free=CLK.k>0&&!battle&&!SC&&!document.hidden&&$('#modal').hidden;
  if(st.ev.cur){if(free&&++st.ev.cur.age>=EVWAIT)evNone(false);}
  else if(free&&st.seen.ch1&&!(S.run&&!S.run.over)&&++st.ev.acc>=st.ev.wait){const ev=pickEvent();if(ev)evAnnounce(ev);else st.ev.acc=0;}
  storyPump();bell();
  if(SNOTE.length&&$('#modal').hidden&&!SC)toast(SNOTE.shift());
}
setInterval(storyTick,1000);

/* ---------- Bedienung: Klick, Tippen, Tasten ---------- */
document.addEventListener('click',e=>{
  if(!SC)return;const m=$('#modal');if(m.hidden||!m.contains(e.target))return;e.stopPropagation();
  const b=e.target.closest('[data-sc]');
  if(b&&b.dataset.sc==='c'){scChoose(+b.dataset.j);return;}
  if(b&&b.dataset.sc==='end'){scFinish();return;}
  if(SC.phase==='talk'||SC.typing)scAdv();
},true);
window.addEventListener('keydown',e=>{
  if(!SC||$('#modal').hidden)return;const k=e.key;
  if(k===' '||k==='Enter'){e.preventDefault();e.stopImmediatePropagation();if(SC.phase!=='choice')scAdv();}
  else if((k==='1'||k==='2')&&SC.phase==='choice'){e.preventDefault();e.stopImmediatePropagation();scChoose(+k-1);}
  else if(k==='Escape'&&!SC.ev&&SC.phase==='talk'){e.preventDefault();e.stopImmediatePropagation();SC.i=SC.lines.length-1;scLine();SC.n=SC.txt.length;scType();}
},true);

/* ---------- Chronik: Figuren und Saga-Buch ---------- */
function figCard(k){
  const st=ST(),f=FIGS[k];let bar='',stat;
  if(k==='bjorn'||k==='sigrid'){const v=st.f[k]||0,w=Math.abs(v)/(GUNST.max-GUNST.min)*100;
    bar='<div class="fbar"><i class="'+(v>=0?'up':'dn')+'" style="left:'+(v>=0?50:50-w)+'%;width:'+w+'%"></i><em></em></div>';
    stat=v>=GUNST.hi?'<span class="up">'+(k==='bjorn'?'Gefolge: +'+GUNST.atk+' Angriff':'Handel: +20 % Verkauf')+'</span>':v<=GUNST.lo?'<span class="dn">murrt: '+GUNST.murr+' Zufriedenheit</span>':'Gunst '+(v>0?'+':'')+v+' · ab +'+GUNST.hi+' Bonus';}
  else if(k==='hrafn')stat=['lauert jenseits des Meeres','greift Nordhof an','besiegt'][st.hrafn]||'';
  else stat='hält die Sippe zusammen';
  return '<div class="figc">'+POR(k,52)+'<div><b>'+f.n+'</b><small>'+f.r+'</small>'+bar+'<p>'+stat+'</p></div></div>';
}
function sagaHTML(){
  const st=ST(),ks=['ragna','bjorn','sigrid'].concat((S.chap||0)>=2?['hrafn']:[]);
  let h='<div class="saga"><div class="sagaf">'+ks.map(figCard).join('')+'</div><div class="sagab"><h2>'+IC('buch','i36')+'Die Saga von Nordhof</h2>';
  if(!st.saga.length)h+='<p class="sub">Noch ist nichts erzählt.</p>';
  let y=-1;for(let i=st.saga.length-1;i>=0;i--){const e=st.saga[i];if(e.y!==y){y=e.y;h+='<h4>Das '+(ORDW[y]?ORDW[y].replace(/n$/,''):y+'.')+' Jahr</h4>';}
    h+='<p>'+IC(e.ic||'buch','i20')+'<span>'+esc(sagaSent(e))+'</span></p>';}
  return h+'</div></div>';
}

/* ---------- Aussehen ---------- */
{const css=document.createElement('style');css.textContent=`
.mcard.scard{max-width:780px;padding:0;overflow:hidden auto;background:radial-gradient(120% 80% at 0% 0%,#2A3F45 0%,#1A262A 55%,#172125 100%);border-color:rgba(226,176,74,.22)}
.sc{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:360px}
.scp{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:26px 14px 22px;background:linear-gradient(180deg,rgba(226,176,74,.08),transparent 70%);border-right:1px solid var(--line);overflow:hidden}
.scp::before{content:"";position:absolute;left:-20%;right:-20%;bottom:-30px;height:120px;background:repeating-radial-gradient(ellipse at 50% 120%,rgba(110,146,155,.1) 0 6px,transparent 6px 20px);pointer-events:none}
.scpor{position:relative;width:180px;height:180px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 4px var(--gold),0 0 0 10px rgba(226,176,74,.16),0 22px 46px rgba(0,0,0,.5)}
.scpor img{width:100%;height:100%;display:block}
.scpor.swap{animation:scin .38s cubic-bezier(.2,1.3,.4,1)}
@keyframes scin{from{transform:scale(.82) translateY(10px);opacity:.2}}
.scnm{position:relative;margin-top:16px;text-align:center;display:flex;flex-direction:column;gap:3px}
.scnm b{font-family:var(--display);font-size:32px;line-height:1;color:var(--tx)}
.scnm small{color:var(--gold);font-weight:700;font-size:12px;letter-spacing:.04em}
.scm{padding:22px 22px 20px;display:flex;flex-direction:column;gap:12px;min-width:0}
.sck{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--gold)}
.sch{font-family:var(--display);font-size:38px;line-height:1;margin:0}
.scbox{position:relative;background:rgba(8,14,16,.42);border:1px solid var(--line);border-radius:16px;padding:16px 18px 24px;min-height:104px;cursor:pointer;box-sizing:border-box}
.sct{margin:0;font-size:17px;line-height:1.55;color:#EEF2F2;white-space:pre-wrap}
.scmore{position:absolute;right:14px;bottom:9px;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid var(--gold);opacity:0}
.scmore.on{opacity:1;animation:scbob 1s ease-in-out infinite}
@keyframes scbob{50%{transform:translateY(3px)}}
.scpips{display:flex;gap:5px}.scpips i{width:18px;height:4px;border-radius:2px;background:var(--soft2)}.scpips i.on{background:var(--gold)}
.scch{display:flex;flex-direction:column;gap:8px;min-height:44px}
.schint{font-size:12px;color:var(--mut2);font-weight:600;align-self:flex-end}
.scbtn{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;padding:11px 14px;border-radius:14px;background:var(--card2);border:1px solid rgba(226,176,74,.28);transition:transform .12s,border-color .15s,background .15s;animation:popin .35s cubic-bezier(.2,1.5,.4,1) both}
.scbtn + .scbtn{animation-delay:.07s}
.scbtn:hover,.scbtn:focus-visible{border-color:var(--gold);background:#2B3D44;transform:translateX(3px)}
.scbtn .k{width:24px;height:24px;border-radius:50%;background:var(--gold);color:#1B272B;font-weight:800;font-size:13px;display:grid;place-items:center;flex-shrink:0}
.scbtn .t{font-weight:700;font-size:15.5px;flex:1 1 auto;display:flex;flex-direction:column}
.scbtn .t small{font-size:11px;color:var(--red2);font-weight:700}
.scbtn.off{opacity:.45;cursor:default;pointer-events:none}
.scfx{display:flex;gap:4px;flex-wrap:wrap}
.scfx span{display:inline-flex;align-items:center;gap:2px;padding:2px 7px 2px 3px;border-radius:9px;background:rgba(241,236,226,.07);animation:popin .4s cubic-bezier(.2,1.6,.4,1) both}
.scfx b{font-size:12.5px;font-weight:800;display:flex;align-items:baseline;gap:3px}.scfx b small{font-size:10.5px;font-weight:600;color:var(--mut)}
.scfx .up b{color:var(--green)}.scfx .dn b{color:var(--red2)}
.scfx img.por{width:20px;height:20px}
.scres{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.scunl{display:flex;flex-direction:column;gap:6px}.scunl > div{display:flex;flex-wrap:wrap;gap:5px}
.scunl span:not(.lbl){display:inline-flex;align-items:center;gap:5px;padding:3px 9px 3px 3px;border-radius:10px;background:var(--card);border:1px solid var(--line);font-size:12px}
.scunl img{width:28px;height:28px;object-fit:contain}
.scperk{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(226,176,74,.12);border:1px solid rgba(226,176,74,.35);font-weight:700}
.scgo{margin-top:2px}
#sbell{position:absolute;z-index:7;right:calc(var(--rw) + 16px);top:calc(var(--tb) + 16px);border:none;background:none;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--tx)}
#sbell .ring{width:64px;height:64px;border-radius:50%;padding:4px;box-sizing:border-box;background:conic-gradient(var(--gold) calc((1 - var(--p,0)) * 1turn),rgba(19,28,31,.92) 0);animation:sbp 1.5s ease-out infinite;display:block}
#sbell img{width:100%;height:100%;border-radius:50%;display:block;border:2px solid #172125;box-sizing:border-box}
#sbell em{position:absolute;top:40px;right:-4px;width:26px;height:26px;border-radius:50%;background:#172125;border:1.5px solid var(--gold);display:grid;place-items:center}
#sbell .lb{font-size:11px;font-weight:800;background:rgba(19,28,31,.92);border:1px solid rgba(226,176,74,.4);border-radius:999px;padding:2px 8px;white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis}
#sbell:hover .ring{transform:scale(1.06)}
@keyframes sbp{0%{box-shadow:0 0 0 0 rgba(226,176,74,.55)}70%{box-shadow:0 0 0 16px rgba(226,176,74,0)}100%{box-shadow:0 0 0 0 rgba(226,176,74,0)}}
.saga{display:grid;grid-template-columns:minmax(0,320px) minmax(0,1fr);gap:16px;margin-bottom:16px;align-items:start}
.sagaf{display:flex;flex-direction:column;gap:8px}
.figc{display:flex;gap:10px;align-items:center;background:var(--bg2);border:1px solid var(--line);border-radius:16px;padding:10px 12px}
.figc > div{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.figc b{font-family:var(--display);font-size:22px;line-height:1}.figc small{font-size:11px;color:var(--mut2);font-weight:600}
.figc p{margin:2px 0 0;font-size:12px;color:var(--mut);font-weight:600}.figc .up{color:var(--green)}.figc .dn{color:var(--red2)}
.fbar{position:relative;height:6px;border-radius:3px;background:var(--soft2);margin-top:5px}
.fbar i{position:absolute;top:0;bottom:0;border-radius:3px}.fbar i.up{background:var(--green)}.fbar i.dn{background:var(--red)}
.fbar em{position:absolute;left:50%;top:-2px;bottom:-2px;width:2px;margin-left:-1px;background:var(--mut2)}
.sagab{background:linear-gradient(180deg,#2A2620,#211F1B);border:1px solid rgba(226,176,74,.25);border-radius:18px;padding:16px 18px;max-height:560px;overflow-y:auto;box-shadow:inset 0 0 40px rgba(0,0,0,.25)}
.sagab h2{font-family:var(--display);font-size:30px;margin:0 0 6px;display:flex;align-items:center;gap:10px;color:#F3E6C8}
.sagab h4{font-family:var(--display);font-size:20px;color:var(--gold);margin:12px 0 4px;font-weight:500}
.sagab p{display:flex;gap:8px;align-items:flex-start;margin:0;padding:6px 0;border-bottom:1px dashed rgba(226,176,74,.14);font-family:var(--display);font-size:17px;line-height:1.35;color:#E9DFC9}
.sagab p img{margin-top:1px}
@media (max-width:899px){.saga{grid-template-columns:1fr}.sagaf{display:grid;grid-template-columns:1fr 1fr;gap:8px}.figc{padding:8px;gap:8px}.figc .por{width:40px;height:40px}.figc b{font-size:19px}
  #sbell{right:auto;left:10px;top:calc(var(--tb) + 10px)}#sbell .ring{width:56px;height:56px}#sbell em{top:34px}#sbell .lb{display:none}}
@media (max-width:599px){
  .mcard.scard{border-radius:20px}
  .sc{grid-template-columns:1fr;min-height:0}
  .scp{flex-direction:row;justify-content:flex-start;gap:14px;padding:16px 16px 12px;border-right:none;border-bottom:1px solid var(--line)}
  .scp::before{display:none}
  .scpor{width:92px;height:92px;box-shadow:0 0 0 3px var(--gold),0 0 0 7px rgba(226,176,74,.16),0 12px 26px rgba(0,0,0,.45)}
  .scnm{margin:0;text-align:left}.scnm b{font-size:28px}
  .scm{padding:14px 16px 16px;gap:10px}.sch{font-size:30px}
  .sct{font-size:16px}.scbox{min-height:96px;padding:14px 14px 22px}
  .sagaf{grid-template-columns:1fr}
}`;document.head.appendChild(css);}
