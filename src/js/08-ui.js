/* ---------- Oberfläche ---------- */
let tab='insel',demolishArm=false,resetArm=false,lastTok=-1,prevHp={};
function toast(html){const box=$('#toasts');const t=document.createElement('div');t.className='toast';t.innerHTML=html;box.appendChild(t);setTimeout(()=>t.remove(),2700);while(box.children.length>3)box.firstChild.remove();}
function costHTML(c){return '<span class="costs">'+Object.keys(c).map(k=>'<span class="cost" data-need="'+k+':'+c[k]+'">'+IC(k,'i16')+fmt(c[k])+'</span>').join('')+'</span>';}
function btnCost(c){return' data-cost="'+esc(JSON.stringify(c))+'"';}
function renderStrip(){
  const keys=Object.keys(RES).filter(k=>k!=='muenzen'&&(S.res[k]>=1||['holz','stein','weizen'].includes(k)));
  const sig=keys.join(',');const el=$('#strip');
  if(el.dataset.sig!==sig){el.dataset.sig=sig;el.innerHTML=keys.map(k=>'<button class="chip" data-act="chip" data-k="'+k+'" data-chip="'+k+'" aria-label="'+RES[k].n+'">'+IC(k,'i20')+'<span data-r="'+k+'">'+fmt(S.res[k]||0)+'</span></button>').join('')+'<button class="chip more" data-act="side" data-s="store" aria-label="Lager">'+IC('truhe','i20')+'<span>Lager</span></button>';fitStrip();}
  renderSide();
  if(window.innerWidth<900)fitStrip();
}
/* Handy: eine Reihe, was nicht passt, steht im Lager */
function fitStrip(){
  const el=$('#strip');if(!el||!el.firstChild||!el.offsetParent)return;const ch=[...el.querySelectorAll('[data-chip]')],more=el.querySelector('.more');
  ch.forEach(c=>c.hidden=false);const lim=el.firstChild.offsetTop+el.firstChild.offsetHeight*.6;
  for(let k=ch.length-1;k>=0&&more.offsetTop>=lim;k--)ch[k].hidden=true;
}
/* Seitenleiste: Baumeister-Aufträge und Lager, immer im Blick (Desktop) oder als Schublade (Handy) */
function renderSide(){
  const jobs=[];S.tiles.forEach((T,i)=>{if(busy(T.b))jobs.push(i);});
  const free=Math.max(0,freeB()),js=jobs.join(',')+'|'+(S.explore?S.explore.r:'')+'|'+free;const je=$('#jobs');
  if(je.dataset.sig!==js){je.dataset.sig=js;let h='';
    for(const i of jobs){const b=S.tiles[i].b;h+='<div class="job"><button class="jl" data-act="goto" data-i="'+i+'"><img src="'+thumb(b.type,b.lvl)+'" alt=""><span class="jn"><b>'+B[b.type].n+'</b><small>'+(b.job==='up'?'Stufe '+(b.lvl+1):'Neubau')+' · <span data-jobt="'+i+'"></span></small><span class="bar thin gold"><i data-jobbar="'+i+'"></i></span></span></button><button class="rbtn" data-act="rush" data-rush="'+i+'" aria-label="Sofort fertig"><span data-rushc="'+i+'"></span></button></div>';}
    if(S.explore){const R=REG[S.explore.r];h+='<div class="job"><span class="jl">'+IC(R.ic,'i28')+'<span class="jn"><b>'+R.n+'</b><small>Erkundung · <span data-jobt="x"></span></small><span class="bar thin gold"><i data-jobbar="x"></i></span></span></span><button class="rbtn" data-act="rush" data-rush="x" aria-label="Sofort fertig"><span data-rushc="x"></span></button></div>';}
    for(let k=0;k<free;k++)h+='<div class="job free">'+IC('arbeit','i20')+'<span>frei, Feld antippen und bauen</span></div>';
    je.innerHTML=h;}
  const groups=[['Rohstoffe','roh'],['Waren','ware'],['Ausrüstung','ausr'],['Beute','beute']],ps=producibleSet();
  const list=groups.map(([gn,gk])=>[gn,Object.keys(RES).filter(k=>RES[k].k===gk&&(S.res[k]>=1||FLOW.p[k]>0||FLOW.c[k]>0||ps.has(k)))]).filter(g=>g[1].length);
  const ss=list.map(g=>g[1].join(',')).join('|'),se=$('#store');
  if(se.dataset.sig!==ss){se.dataset.sig=ss;se.innerHTML=list.map(([gn,ks])=>'<h5>'+gn+'</h5>'+ks.map(k=>'<button class="srow2" data-act="info" data-info="r:'+k+'">'+IC(k,'i20')+'<span class="sn">'+RES[k].n+'</span><b data-r="'+k+'"></b><span data-net="'+k+'"></span>'+(capped(k)?'<span class="bar thin"><i data-fill="'+k+'"></i></span>':'')+'</button>').join('')).join('');}
}
const lastVal={};
function refresh(){
  renderStrip();
  document.querySelectorAll('[data-r]').forEach(el=>{const t=fmt(S.res[el.dataset.r]||0);if(el.textContent!==t)el.textContent=t;});
  document.querySelectorAll('[data-chip]').forEach(el=>{const k=el.dataset.chip,v=Math.floor(S.res[k]||0);
    if(lastVal[k]!==undefined&&v>lastVal[k]){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}lastVal[k]=v;
    el.classList.toggle('full',capped(k)&&S.res[k]>=D.cap);});
  document.querySelectorAll('[data-cost]').forEach(el=>{let ok=true;try{ok=has(JSON.parse(el.dataset.cost));}catch(e){}el.classList.toggle('off',!ok||el.dataset.block==='1');});
  document.querySelectorAll('[data-need]').forEach(el=>{const[k,a]=el.dataset.need.split(':');el.classList.toggle('no',(S.res[k]||0)<+a);});
  document.querySelectorAll('[data-prog]').forEach(el=>{const b=S.tiles[+el.dataset.prog].b;if(!b)return;const d=B[b.type],r=RECIPES[b.recipe||(d.rec&&d.rec[0])];if(r)el.style.width=(b.run?Math.min(100,b.prog/r.t*100):0)+'%';});
  document.querySelectorAll('[data-fill]').forEach(el=>{el.style.width=Math.min(100,(S.res[el.dataset.fill]||0)/D.cap*100)+'%';});
  document.querySelectorAll('[data-timer]').forEach(el=>{const w=el.dataset.timer;
    if(w==='raid')el.textContent=S.raid.pending?'jetzt':fmtT(S.raid.next-now());
    if(w==='boat')el.textContent=fmtT(S.boat.until-now());});
  document.querySelectorAll('[data-jobbar]').forEach(el=>{const w=el.dataset.jobbar;let u,tot;if(w==='x'){if(!S.explore)return;u=S.explore.until;tot=REG[S.explore.r].t;}else{const b=S.tiles[+w].b;if(!b||!b.until)return;u=b.until;tot=b.job==='up'?bTime(b.type,b.lvl):bTime(b.type,0);}el.style.width=Math.max(0,Math.min(100,(1-(u-now())/1000/tot)*100))+'%';});
  document.querySelectorAll('[data-jobt]').forEach(el=>{const w=el.dataset.jobt;const u=w==='x'?(S.explore&&S.explore.until):(S.tiles[+w].b&&S.tiles[+w].b.until);if(u)el.textContent=fmtDur((u-now())/1000);});
  document.querySelectorAll('[data-rushc]').forEach(el=>{const w=el.dataset.rushc;const u=w==='x'?(S.explore&&S.explore.until):(S.tiles[+w].b&&S.tiles[+w].b.until);if(u)el.innerHTML=IC('muenzen','i14')+rushCost(u-now());});
  const bn=$('#bldN');if(bn){const t=Math.max(0,freeB())+'/'+builders();if(bn.textContent!==t)bn.textContent=t;$('#bldF').textContent=t+' frei';$('#capT').textContent='je '+fmt(D.cap);}
  const pn=$('#popN');if(pn){const t=S.pop.n+'/'+D.house;if(pn.textContent!==t)pn.textContent=t;const mk=moodKey();const mi=$('#moodI');if(mi.dataset.k!==mk){mi.dataset.k=mk;mi.src=iconURL(mk);}}
  document.querySelectorAll('[data-rp]').forEach(el=>{const k=el.dataset.rp,v=FLOW.p[k]||0;el.textContent=v*60>=.05?'+'+fmtN(v*60):el.dataset.z?'0':'';});
  document.querySelectorAll('[data-rc]').forEach(el=>{const k=el.dataset.rc,v=FLOW.c[k]||0;el.textContent=v*60>=.05?'−'+fmtN(v*60):el.dataset.z?'0':'';});
  document.querySelectorAll('[data-net]').forEach(el=>{const k=el.dataset.net,v=((FLOW.p[k]||0)-(FLOW.c[k]||0))*60;el.textContent=Math.abs(v)<.05?'±0':(v>0?'+':'−')+fmtN(Math.abs(v));el.className='net '+(v>.05?'up':v<-.05?'down':'');});
  document.querySelectorAll('[data-live]').forEach(el=>{const w=el.dataset.live;let t='';
    if(w==='pop')t=S.pop.n;else if(w==='house')t=D.house;else if(w==='jobs')t=D.jobs;else if(w==='work')t=Math.min(S.pop.n,D.jobs);else if(w==='mood')t=Math.round(D.h)+' %';else if(w==='tax')t='+'+fmtN(S.pop.n*.025*(.5+D.h/100)*(1+D.tax)*60)+'/min';else if(w==='eff')t=Math.round(D.eff*100)+' %';else if(w==='eat')t='−'+fmtN(S.pop.n)+'/min';
    t=String(t);if(el.textContent!==t)el.textContent=t;});
  document.querySelectorAll('[data-wbar]').forEach(el=>{const w=el.dataset.wbar;el.style.width=(w==='house'?S.pop.n/Math.max(1,D.house):w==='jobs'?(D.jobs?Math.min(1,S.pop.n/D.jobs):1):D.h/100)*100+'%';});
  $('#raidT').textContent=S.raid.pending?'Angriff!':fmtT(S.raid.next-now());if(Math.floor(now()/1000)%3===0||!$('#jobs').dataset.sig)renderSide();$('#raidChip').classList.toggle('alarm',S.raid.pending);
  const wb=document.querySelector('.tabs [data-t="wehr"]');let bd=wb.querySelector('.dot');
  if(S.raid.pending&&!bd){bd=document.createElement('span');bd.className='dot';wb.appendChild(bd);}else if(!S.raid.pending&&bd)bd.remove();
}
function render(enter){
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
  const p=$('#panel');$('#app').classList.toggle('paneled',tab!=='insel');
  if(tab==='insel'){p.hidden=true;renderSheet();}
  else{
    $('#sheet').classList.remove('open');p.hidden=false;
    p.innerHTML=tab==='handel'?panelHandel():tab==='wehr'?panelWehr():tab==='dorf'?panelDorf():panelRaub();
    p.classList.toggle('enter',!!enter);
    if(tab==='raub'&&S.run&&!S.run.over)afterRun();
    if(tab==='wehr')requestAnimationFrame(()=>requestAnimationFrame(()=>{const m=$('#meter i');if(m)m.style.left=m.dataset.l;}));
  }
  refresh();
}
function renderSheet(){
  const sh=$('#sheet');
  if(sel<0||tab!=='insel'){sh.classList.remove('open');return;}
  sh.innerHTML='<div class="grab"></div>'+sheetHTML(sel);sh.classList.add('open');refresh();
}
function lvlPips(l){let h='<div class="pips">';for(let k=1;k<=MAXLVL;k++)h+='<i class="'+(k<=l?'on':'')+'"></i>';return h+'</div>';}
function adjBadge(type){const a=B[type].adj;if(!a)return'';return '<span class="badge">'+(a.t?IC(ADJICON[a.t]):'<img class="ico" src="'+thumb(a.b)+'" alt="">')+'+'+Math.round(a.v*100)+'%</span>';}
function sheetHTML(i){
  const T=S.tiles[i],close='<button class="x" data-act="close" aria-label="Schließen"></button>';
  if(!unlocked(i)){
    const r=T.r,R=REG[r],ex=S.explore;
    let h='<div class="head">'+IC(R.ic,'i48')+'<div class="t"><h2>'+R.n+'</h2><p class="sub">'+(R.desc||'')+'</p></div>'+close+'</div>';
    h+='<h3>'+IC('truhe','i16')+'Nur hier</h3><div class="ichips">'+R.finds.map(k=>'<button class="ichip" data-act="info" data-info="r:'+k+'">'+IC(k,'i28')+RES[k].n+'</button>').join('')+Object.keys(B).filter(k=>B[k].reg&&B[k].reg.includes(R.id)).map(k=>'<button class="ichip" data-act="info" data-info="b:'+k+'"><img src="'+thumb(k)+'" alt="">'+B[k].n+'</button>').join('')+'</div>';
    if(ex&&ex.r===r){h+='<div class="flow">'+IC('uhr','i28')+'<div class="bar gold"><i data-jobbar="x"></i></div><span class="n" data-jobt="x"></span></div><div class="btns"><button class="btn gold wide" data-act="rush" data-rush="x">'+IC('muenzen','i16')+'Sofort fertig <span data-rushc="x"></span></button></div>';}
    else if(ex)h+='<p class="note">'+IC('uhr','i14')+' Gerade wird '+REG[ex.r].n+' erkundet. Immer nur ein Gebiet zugleich.</p>';
    else if(S.pop.n<R.req)h+='<div class="btns"><span class="tag">'+IC('leute','i16')+'ab '+R.req+' Einwohnern</span></div>';
    else h+='<div class="btns"><button class="btn wide"'+btnCost(R.cost)+(freeB()>0?'':' data-block="1"')+' data-act="explore" data-reg="'+r+'">'+IC('schiff','i16')+'Erkunden '+costHTML(R.cost)+'<span class="cost">'+IC('uhr','i14')+fmtDur(R.t)+'</span></button></div>'+(freeB()>0?'':'<p class="note">'+IC('arbeit','i14')+' Alle Baumeister sind beschäftigt.</p>');
    return h;
  }
  if(!T.b){
    const opts=Object.keys(B).filter(k=>!B[k].hidden&&canPlace(k,i));
    const away=Object.keys(B).filter(k=>!B[k].hidden&&B[k].reg&&!B[k].reg.includes(REG[T.r].id));
    const tic={grass:'wiese',forest:'wald',rock:'stein',sand:'wasser'}[T.t];
    let h='<div class="head">'+IC(tic,'i36')+'<div class="t"><h2>'+TERR[T.t].n+'</h2>'+(T.t==='forest'?'<p class="sub">Bauen rodet den Wald.</p>':'')+'</div>'+close+'</div>';
    for(const g of GROUPS){const ks=opts.filter(k=>B[k].g===g);if(!ks.length)continue;
      h+='<h3>'+g+'</h3><div class="bgrid">'+ks.map(k=>{const d=B[k],ok=reqOK(k);
        return '<div class="bcard'+(ok?'':' locked')+'" role="button" tabindex="0"'+btnCost(d.cost)+(ok&&freeB()>0?'':' data-block="1"')+' data-act="build" data-k="'+k+'">'+IB('b:'+k)+adjBadge(k)+'<img class="th" src="'+thumb(k)+'" alt=""><span class="nm">'+d.n+'</span>'+(ok?costHTML(d.cost)+'<span class="costs mini"><span class="cost">'+IC('uhr','i14')+fmtDur(bTime(k,0))+'</span></span>'+miniStats(k):'<span class="tag">'+IC('leute','i14')+d.req+' Einwohner</span>')+'</div>';}).join('')+'</div>';
    }
    if(freeB()<=0)h=h.replace('<h3>','<p class="note warn">'+IC('arbeit','i16')+' Alle Baumeister sind beschäftigt. Warte, beschleunige mit Münzen oder baue eine Bauhütte.</p><h3>');
    if(away.length)h+='<h3>'+IC('schiff','i16')+'In anderen Gebieten</h3><div class="bgrid">'+away.map(k=>'<div class="bcard locked">'+IB('b:'+k)+'<img class="th" src="'+thumb(k)+'" alt=""><span class="nm">'+B[k].n+'</span><span class="tag">'+B[k].reg.map(g=>IC(REG[REGI[g]].ic,'i14')+REG[REGI[g]].n).join(' ')+'</span></div>').join('')+'</div>';
    if(!opts.length)h+='<p class="note">Hier passt gerade nichts hin.</p>';
    return h;
  }
  const b=T.b,d=B[b.type],bo=bonus(i);
  if(busy(b)){
    return '<div class="binfo"><img class="th" src="'+thumb(b.type,b.job==='up'?b.lvl+1:b.lvl)+'" alt=""><div style="flex:1;min-width:0"><h2>'+d.n+'</h2><p class="sub">'+(b.job==='up'?'Ausbau auf Stufe '+(b.lvl+1):'Wird gebaut')+'</p></div>'+IB('b:'+b.type)+close+'</div>'+
      '<div class="flow">'+IC('arbeit','i28')+'<div class="bar gold"><i data-jobbar="'+i+'"></i></div><span class="n" data-jobt="'+i+'"></span></div>'+
      (b.job==='up'?'<p class="note">'+IC('uhr','i14')+' Während des Ausbaus ruht der Betrieb.</p>':'')+
      '<div class="btns"><button class="btn gold wide" data-act="rush" data-rush="'+i+'">'+IC('muenzen','i16')+'Sofort fertig <span data-rushc="'+i+'"></span></button></div>';
  }
  let h='<div class="binfo"><img class="th" src="'+thumb(b.type,b.lvl)+'" alt=""><div style="flex:1;min-width:0"><h2>'+d.n+'</h2>'+(d.hidden?'':lvlPips(b.lvl))+(bo?'<div style="margin-top:6px"><span class="tag green">'+IC(d.adj.t?ADJICON[d.adj.t]:'plus','i16')+'Lage +'+Math.round(bo*100)+' %</span></div>':'')+'</div>'+IB('b:'+b.type)+close+'</div>';
  if(d.jobs){const j=jobsOf(b),f=Math.round(j*D.staff);h+='<div class="flow">'+IC('arbeit','i28')+'<div class="workers">'+Array.from({length:j},(_,k)=>'<i class="'+(k<f?'on':'')+'"></i>').join('')+'</div><span class="n">'+f+'/'+j+'</span><span style="flex:1"></span>'+IC(moodKey(),'i24')+'<span class="n">'+Math.round(D.eff*100)+' %</span></div>';}
  if(d.kind==='home')h+='<div class="flow">'+IC('leute','i36')+'<span class="n" style="font-size:18px">'+(d.cap?'+'+d.cap*b.lvl:BASEHOUSE)+'</span><span class="note" style="margin:0">Wohnplätze</span><span style="flex:1"></span><span class="n">'+IC('leute','i16')+'<span data-live="pop"></span>/<span data-live="house"></span></span></div>';
  if(d.kind==='joy')h+='<div class="flow">'+IC('froh','i36')+'<span class="n" style="font-size:18px">+'+d.joy*b.lvl+'</span><span class="note" style="margin:0">Zufriedenheit'+(d.uses?' · braucht '+IC('met','i16'):'')+(d.tax?' · +'+Math.round(d.tax*b.lvl*100)+' % Steuern':'')+'</span></div>';
  if(d.kind==='prod')h+='<div class="flow">'+IC(d.out,'i36')+'<span class="n" style="font-size:18px">'+fmtRate(prodRate(i))+'</span><div class="bar gold"><i data-fill="'+d.out+'"></i></div>'+IC('lager','i24')+'<span class="n">'+fmt(D.cap)+'</span></div>';
  if(d.kind==='craft'){
    const key=b.recipe||d.rec[0],r=RECIPES[key];
    h+='<div class="flow">'+Object.keys(r.in).map(x=>'<span class="n">'+r.in[x]+'×'+IC(x,'i28')+'</span>').join('')+'<span class="arrow"></span><span class="n">'+r.out+'×'+IC(key,'i36')+'</span><div class="bar"><i data-prog="'+i+'"></i></div><span class="n" style="font-size:12px">'+IC('uhr','i16')+(r.t/Math.max(.01,craftSpeed(i))).toFixed(1).replace('.',',')+' s</span></div>';
    if(d.rec.length>1)h+='<h3>Rezept</h3><div class="seg">'+d.rec.map(k=>'<button data-act="recipe" data-k="'+k+'" class="'+(k===key?'on':'')+'">'+IC(k,'i28')+RES[k].n+'</button>').join('')+'</div>';
  }
  if(d.kind==='store')h+='<div class="flow">'+IC('lager','i36')+'<span class="n" style="font-size:18px">'+fmt(D.cap)+'</span><span class="note" style="margin:0">Platz je Rohstoff</span></div>';
  if(d.kind==='def'||RANGE[b.type])h+='<div class="flow">'+(RANGE[b.type]?'<span class="n">'+IC('ziel','i28')+String(rangeOf(b).toFixed(1)).replace('.',',')+' Felder'+(b.lvl<MAXLVL?' <small style="opacity:.6">→ '+String((rangeOf(b)+.45).toFixed(1)).replace('.',',')+'</small>':'')+'</span>':'')+(d.hp?'<span class="n">'+IC('herz','i28')+'+'+d.hp*b.lvl+'</span>':'')+(d.dmg?'<span class="n">'+IC('schwert','i28')+'+'+d.dmg*b.lvl+'</span>':'')+'<span style="flex:1"></span><span class="n">'+IC('schild','i28')+Math.round(D.hp)+' / '+Math.round(D.dmg)+'</span></div>';
  if(d.hidden)return h;
  if(freeB()<=0&&b.lvl<MAXLVL)h+='<p class="note warn">'+IC('arbeit','i16')+' Alle Baumeister sind beschäftigt.</p>';
  h+='<div class="btns">'+(b.lvl<MAXLVL?'<button class="btn gold" style="flex:1"'+btnCost(upCost(b))+(freeB()>0?'':' data-block="1"')+' data-act="upgrade">'+IC('hoch','i16')+'Stufe '+(b.lvl+1)+' '+costHTML(upCost(b))+'<span class="cost">'+IC('uhr','i14')+fmtDur(bTime(b.type,b.lvl))+'</span></button>':'<span class="tag green">'+IC('krone','i16')+'Höchste Stufe</span><span style="flex:1"></span>')+
     '<button class="btn '+(demolishArm?'red':'alt')+' small" data-act="demolish" aria-label="Abreißen">'+IC('abriss','i24')+(demolishArm?'Sicher?':'')+'</button></div>';
  return h;
}
function fmtN(v){return v>=100?String(Math.round(v)):v>=10?v.toFixed(0):v.toFixed(1).replace('.',',');}
function moodKey(){return D.h>=60?'froh':D.h>=40?'mittel':'sauer';}
const IB=info=>'<button class="ibtn" data-act="info" data-info="'+info+'" aria-label="Info">i</button>';
function reqOK(k){return !B[k].req||S.pop.n>=B[k].req;}
function miniStats(k){const d=B[k],a=[];
  if(d.kind==='home'&&d.cap)a.push('<span class="cost">'+IC('leute','i14')+'+'+d.cap+'</span>');
  if(d.jobs)a.push('<span class="cost">'+IC('arbeit','i14')+d.jobs+'</span>');
  if(d.kind==='joy')a.push('<span class="cost">'+IC('froh','i14')+'+'+d.joy+'</span>');
  if(d.out)a.push('<span class="cost">'+IC(d.out,'i14')+'</span>');
  if(d.rec)a.push(d.rec.map(r=>'<span class="cost">'+IC(r,'i14')+'</span>').join(''));
  return a.length?'<span class="costs mini">'+a.join('')+'</span>':'';}
function fmtRate(r){return(r*60).toFixed(r*60<10?1:0).replace('.',',')+'/min';}

function panelHandel(){
  if(now()>S.boat.until)rollBoat();fillOrders();
  let h='<div class="trader">'+POR('haendler',64)+'<div class="bubble">Heute zahle ich doppelt für '+IC(S.boat.k,'i24')+' <b>'+RES[S.boat.k].n+'</b>.<br>'+IC('uhr','i14')+' <span data-timer="boat"></span></div><img class="ico i64" src="'+iconURL('schiff')+'" style="margin-left:auto" alt=""></div>';
  h+='<h3>'+IC('truhe','i16')+'Aufträge</h3><div style="display:flex;flex-direction:column;gap:8px">'+S.orders.map((o,j)=>'<div class="order">'+POR(o.who,40)+'<div class="flowi"><span class="n">'+o.a+'×'+IC(o.k,'i28')+'</span><span class="arrow"></span><span class="n">'+IC('muenzen','i24')+o.rew+'</span></div><button class="btn small"'+btnCost({[o.k]:o.a})+' data-act="order" data-j="'+j+'">Liefern</button></div>').join('')+'</div>';
  const ks=Object.keys(RES).filter(k=>k!=='muenzen'&&S.res[k]>=1);
  h+='<h3>'+IC('muenzen','i16')+'Verkaufen</h3>'+(ks.length?'<div class="tiles">'+ks.map(k=>'<div class="rtile"><span class="'+(k===S.boat.k?'hot':'')+'">'+IC(k,'i36')+'</span><span class="amt" data-r="'+k+'"></span><span class="cost">'+IC('muenzen','i14')+price(k)+'</span><div class="row2"><button class="btn small alt"'+btnCost({[k]:10})+' data-act="sell" data-k="'+k+'" data-n="10">10</button><button class="btn small" data-act="sell" data-k="'+k+'" data-n="all">Alle</button></div></div>').join('')+'</div>':'<p class="note">Noch nichts zu verkaufen.</p>');
  const buy=['holz','stein','lehm','weizen','fisch','bretter','kohle','proviant','eisen'];
  h+='<h3>'+IC('waage','i16')+'Kaufen, 5 Stück</h3><div class="tiles">'+buy.map(k=>{const c=RES[k].p*15;return '<div class="rtile">'+IC(k,'i36')+'<button class="btn small alt"'+btnCost({muenzen:c})+' data-act="buy" data-k="'+k+'">'+IC('muenzen','i14')+c+'</button></div>';}).join('')+'</div>';
  return h;
}
function panelDorf(){
  let h='<div class="town"><div class="big">'+IC('leute','i48')+'<div><div class="bn"><span data-live="pop"></span><small> / <span data-live="house"></span></small></div><div class="note" style="margin:0">Einwohner / Wohnplätze</div></div>'+IB('p:pop')+'</div>'+
    '<div class="trow">'+'<img class="ico i24" src="'+thumb('huette')+'" alt="">'+'<span class="lbl">Wohnraum</span><div class="bar"><i data-wbar="house"></i></div></div>'+
    '<div class="trow">'+IC('arbeit','i24')+'<span class="lbl">Arbeit <b data-live="work"></b>/<b data-live="jobs"></b></span><div class="bar gold"><i data-wbar="jobs"></i></div></div>'+
    '<div class="trow">'+IC(moodKey(),'i24')+'<span class="lbl">Laune <b data-live="mood"></b></span><div class="bar mood"><i data-wbar="mood"></i></div></div>'+
    '<div class="kpis"><div>'+IC('arbeit','i24')+'<b data-live="eff"></b><small>Tempo</small></div><div>'+IC('muenzen','i24')+'<b data-live="tax"></b><small>Steuern</small></div><div>'+IC('fisch','i24')+'<b data-live="eat"></b><small>Nahrung</small></div></div></div>';
  h+='<h3>'+IC('froh','i16')+'Was die Laune macht</h3><div class="moodparts">'+D.parts.map(([k,v,n])=>'<div class="'+(v>0?'up':v<0?'down':'')+'">'+(B[k]?'<img class="ico i24" src="'+thumb(k)+'" alt="">':IC(k,'i24'))+'<span>'+esc(n)+'</span><b>'+(v>0?'+':'')+v+'</b></div>').join('')+'</div>';
  if(S.pop.n>=D.house)h+='<p class="note">'+IC('huette','i16')+' Alle Plätze belegt. Baue Hütten oder Langhäuser, dann ziehen neue Leute zu.</p>';
  else if(D.h<45)h+='<p class="note">'+IC('sauer','i16')+' Erst ab 45 % Laune ziehen Leute zu.</p>';
  const groups=[['Rohstoffe','roh'],['Waren','ware'],['Ausrüstung','ausr'],['Beute','beute']];
  for(const[gn,gk]of groups){const ks=Object.keys(RES).filter(k=>RES[k].k===gk&&(S.res[k]>=1||FLOW.p[k]>0||FLOW.c[k]>0||producibleSet().has(k)));if(!ks.length)continue;
    h+='<h3>'+gn+'</h3><div class="stats2">'+ks.map(k=>'<button class="srow" data-act="info" data-info="r:'+k+'">'+IC(k,'i28')+'<div class="sm"><div class="sn"><span>'+RES[k].n+'</span><b data-r="'+k+'"></b></div>'+(capped(k)?'<div class="bar thin"><i data-fill="'+k+'"></i></div>':'')+'</div><div class="fl"><span class="p" data-rp="'+k+'"></span><span class="c" data-rc="'+k+'"></span></div><span data-net="'+k+'"></span></button>').join('')+'</div>';}
  h+='<p class="note">Werte pro Minute, gemittelt über die letzte halbe Minute.</p>';
  return h;
}
function producibleSet(){const set=new Set();for(const T of S.tiles){if(!T.b)continue;const d=B[T.b.type];if(d.out)set.add(d.out);if(d.rec)d.rec.forEach(r=>set.add(r));}return set;}
/* Info-Karten */
function showInfo(spec){
  const[t,k]=spec.split(':');let h='';
  const close='<button class="x" data-act="closemodal" aria-label="Schließen"></button>';
  const row=(ic,label,val)=>'<div class="irow">'+ic+'<span>'+label+'</span><b>'+val+'</b></div>';
  if(t==='b'){const d=B[k];
    h+='<div class="head"><img class="ith" src="'+thumb(k)+'" alt=""><div class="t"><h2>'+d.n+'</h2><p class="sub">'+(DESC[k]||'')+'</p></div>'+close+'</div><div class="igrid">';
    if(Object.keys(d.cost).length)h+=row(IC('hoch','i24'),'Baukosten',costHTML(d.cost));
    if(d.kind==='home')h+=row(IC('leute','i24'),'Wohnplätze',d.cap?'+'+d.cap+' je Stufe':BASEHOUSE);
    if(d.jobs)h+=row(IC('arbeit','i24'),'Arbeitsplätze',d.jobs+' (+1 je Stufe)');
    if(d.out)h+=row(IC(d.out,'i24'),'Erzeugt',fmtRate(d.rate)+' je Stufe');
    if(d.rec)h+=d.rec.map(r=>{const R=RECIPES[r];return row(IC(r,'i24'),RES[r].n,'<span class="costs">'+Object.keys(R.in).map(x=>'<span class="cost">'+R.in[x]+'×'+IC(x,'i16')+'</span>').join('')+'<span class="arrow"></span><span class="cost">'+R.out+'×'+IC(r,'i16')+'</span><span class="cost">'+IC('uhr','i14')+R.t+' s</span></span>');}).join('');
    if(d.kind==='joy')h+=row(IC('froh','i24'),'Zufriedenheit','+'+d.joy+' je Stufe'+(d.uses?', braucht Met':''));
    if(d.tax)h+=row(IC('muenzen','i24'),'Steuern','+'+Math.round(d.tax*100)+' % je Stufe');
    if(d.kind==='store')h+=row(IC('lager','i24'),'Lager','+150 je Stufe');
    if(d.hp)h+=row(IC('herz','i24'),'Lebenspunkte Insel','+'+d.hp+' je Stufe');
    if(d.dmg)h+=row(IC('schwert','i24'),'Schaden','+'+d.dmg+' je Stufe');
    if(d.adj)h+=row(d.adj.t?IC(ADJICON[d.adj.t],'i24'):'<img class="ico i24" src="'+thumb(d.adj.b)+'" alt="">','Nachbarbonus','+'+Math.round(d.adj.v*100)+' % je '+(d.adj.t?TERR[d.adj.t]?TERR[d.adj.t].n:'Wasser':B[d.adj.b].n)+', bis +'+Math.round(d.adj.max*100)+' %');
    if(d.need)h+=row(IC(d.need==='coast'?'wasser':'stein','i24'),'Bauplatz',d.need==='coast'?'an der Küste':'am Fels');
    if(d.req)h+=row(IC('leute','i24'),'Freigabe','ab '+d.req+' Einwohnern');
    if(d.reg)h+=row(IC(REG[REGI[d.reg[0]]].ic,'i24'),'Gebiet','nur '+d.reg.map(g=>REG[REGI[g]].n).join(' oder '));
    if(d.max)h+=row(IC('bauhuette','i24'),'Anzahl','höchstens '+d.max);
    if(!d.hidden)h+=row(IC('uhr','i24'),'Bauzeit',fmtDur(bTime(k,0))+', Ausbau auf Stufe 2: '+fmtDur(bTime(k,1))+', auf Stufe 8: '+fmtDur(bTime(k,7)));
    if(!d.hidden)h+=row(IC('werkzeug','i24'),'Ausbau','bis Stufe 8, ab Stufe 4 mit Werkzeug, ab 6 mit Silber, ab 8 mit Runenstein');
    h+='</div>';}
  else if(t==='r'){const R=RES[k],from=Object.keys(B).filter(b=>B[b].out===k||(B[b].rec&&B[b].rec.includes(k))),to=Object.keys(RECIPES).filter(r=>RECIPES[r].in[k]),bc=Object.keys(B).filter(b=>!B[b].hidden&&B[b].cost[k]);
    h+='<div class="head">'+IC(k,'i64')+'<div class="t"><h2>'+R.n+'</h2><p class="sub">'+(RDESC[k]||'')+'</p></div>'+close+'</div><div class="igrid">';
    h+=row(IC('lager','i24'),'Bestand','<span data-r="'+k+'"></span>'+(capped(k)?' / '+fmt(D.cap):''));
    h+=row(IC('hoch','i24'),'Herstellung','<span data-z="1" data-rp="'+k+'"></span> pro Minute');
    h+=row(IC('ab','i24'),'Verbrauch','<span data-z="1" data-rc="'+k+'"></span> pro Minute');
    h+=row(IC('muenzen','i24'),'Preis im Hafen',price(k));
    if(R.food)h+=row(IC('leute','i24'),'Nahrung','jeder Einwohner isst 1 pro Minute');
    h+='</div>';
    if(from.length)h+='<h3>Kommt aus</h3><div class="ichips">'+from.map(b=>'<button class="ichip" data-act="info" data-info="b:'+b+'"><img src="'+thumb(b)+'" alt="">'+B[b].n+'</button>').join('')+'</div>';
    if(to.length)h+='<h3>Wird verarbeitet zu</h3><div class="ichips">'+to.map(r=>'<button class="ichip" data-act="info" data-info="r:'+r+'">'+IC(r,'i28')+RES[r].n+'</button>').join('')+'</div>';
    if(bc.length)h+='<h3>Baustoff für</h3><div class="ichips">'+bc.map(b=>'<button class="ichip" data-act="info" data-info="b:'+b+'"><img src="'+thumb(b)+'" alt="">'+B[b].n+'</button>').join('')+'</div>';}
  else if(t==='p'){
    h+='<div class="head">'+IC('leute','i64')+'<div class="t"><h2>Einwohner</h2><p class="sub">Leute wohnen in Häusern, arbeiten in den Betrieben und zahlen Steuern.</p></div>'+close+'</div><div class="igrid">'+
      row(IC('huette','i24'),'Zuzug','alle 8 s jemand Neues, wenn Platz frei ist, es Essen gibt und die Laune ab 45 % liegt')+
      row(IC('fisch','i24'),'Essen','1 Nahrung pro Kopf und Minute: Fisch, Brot oder Käse')+
      row(IC('sauer','i24'),'Hunger','ohne Essen zieht alle 20 s jemand weg')+
      row(IC('arbeit','i24'),'Arbeit','fehlen Leute, arbeiten alle Betriebe langsamer')+
      row(IC('froh','i24'),'Laune','macht Betriebe bis 30 % schneller oder langsamer und erhöht die Steuern')+'</div>';}
  else if(t==='c'){const i=+k,c=S.crew[i];
    h+='<div class="head">'+POR(CREWP[i],64)+'<div class="t"><h2>'+c.n+'</h2><p class="sub">'+['Schildmaid mit ruhiger Hand.','Hitzkopf mit breiten Schultern.','Jüngste der Sippe, schnell auf den Beinen.'][i]+'</p></div>'+close+'</div><div class="igrid">'+
      row(IC('herz','i24'),'Leben','20, mit Rüstung 35')+row(IC('schwert','i24'),'Angriff','4, mit Waffe 10')+row(IC('proviant','i24'),'Tragen','4 Beutefächer')+row(IC('uhr','i24'),'Verwundet','10 Minuten Pause nach einem Fall')+'</div>';}
  else if(t==='d'){const D2=DIFF[+k];
    h+='<div class="head"><div class="t"><h2>'+D2.n+'</h2></div>'+close+'</div><img class="scene" style="width:100%;border-radius:14px;margin-top:10px" src="'+scene(+k)+'" alt=""><div class="igrid">'+
      row(IC('schaedel','i24'),'Gegner','Leben '+D2.hp+', Angriff '+String(D2.atk).replace('.',','))+row(IC('sturm','i24'),'Sturm','ab Schritt '+D2.storm+' wird es gefährlicher')+
      row(IC('truhe','i24'),'Beute','<span class="costs">'+D2.loot.map(l=>'<span class="cost">'+IC(l[0],'i16')+(l[1]>=25?'oft':l[1]>=12?'mal':'selten')+'</span>').join('')+'</span>')+'</div>';}
  $('#modalCard').innerHTML=h;$('#modal').hidden=false;refresh();
}
function price(k){return RES[k].p*(k===S.boat.k?2:1);}
function chanceQ(){const R=raiders(S.raid.n);return Math.ceil(D.hp/R.dmg)/Math.ceil(R.hp/D.dmg);}
function panelWehr(){
  const R=raiders(S.raid.n),q=chanceQ(),pos=Math.max(4,Math.min(96,(q-.5)/1.2*100));
  let h='<div class="vs"><div class="side"><img class="ico i64" src="'+iconURL('haus')+'" alt=""><span class="nm">Nordhof</span><div class="stats"><span class="n">'+IC('herz','i16')+Math.round(D.hp)+'</span><span class="n">'+IC('schwert','i16')+Math.round(D.dmg)+'</span></div></div>'+
    '<div class="vsx">vs</div><div class="side">'+POR('raider',64)+'<span class="nm">Welle '+(S.raid.n+1)+'</span><div class="stats"><span class="n">'+IC('herz','i16')+R.hp+'</span><span class="n">'+IC('schwert','i16')+String(R.dmg).replace('.',',')+'</span></div></div></div>';
  h+='<div><div class="meter" id="meter"><i style="left:50%" data-l="'+pos+'%"></i></div><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--fjord-2);margin-top:4px"><span>riskant</span><span>sicher</span></div></div>';
  if(S.raid.pending)h+='<div class="btns"><button class="btn red wide" data-act="defend">'+IC('schild','i24')+'Plünderer abwehren</button></div>';
  else h+='<div class="btns"><span class="tag">'+IC('uhr','i16')+'<b data-timer="raid"></b></span><span class="note" style="margin:0">bis zur nächsten Welle</span></div>';
  h+='<h3>'+IC('plus','i16')+'Stärker werden</h3><div class="bgrid">'+['palisade','turm','bogenposten'].map(k=>'<div class="bcard" style="cursor:default">'+IB('b:'+k)+'<img class="th" src="'+thumb(k)+'" alt=""><span class="nm">'+B[k].n+'</span><span class="costs">'+(B[k].hp?'<span class="cost">'+IC('herz','i14')+'+'+B[k].hp+'</span>':'')+(B[k].dmg?'<span class="cost">'+IC('schwert','i14')+'+'+B[k].dmg+'</span>':'')+'</span></div>').join('')+'</div>';
  if(S.raid.log.length)h+='<h3>'+IC('uhr','i16')+'Chronik</h3><div class="chron">'+S.raid.log.map(l=>'<div>'+IC(l.win?'schild':'abriss','i16')+new Date(l.t).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+(l.win?' +'+l.coins+IC('muenzen','i14'):'')+'</div>').join('')+'</div>';
  return h;
}
function panelRaub(){
  if(S.run)return runHTML();
  const ready=S.crew.map(c=>c.wounded<=now());
  const selIdx=S.crew.map((c,i)=>S.prep.sel[i]&&ready[i]?i:-1).filter(i=>i>=0);
  const need=selIdx.length+S.prep.extra;
  let w=S.res.waffe,r=S.res.ruestung;
  let h='<h3 style="margin-top:0">'+IC('schwert','i16')+'Mannschaft</h3><div class="crew">'+S.crew.map((c,i)=>{const on=S.prep.sel[i]&&ready[i];let ww=false,rr=false;
    if(on){ww=w>0;rr=r>0;if(ww)w--;if(rr)r--;}const st=warStats({waffe:ww,ruestung:rr});
    return '<div role="button" tabindex="0" class="war'+(on?' sel':' off')+'" data-act="crew" data-i="'+i+'">'+IB('c:'+i)+POR(CREWP[i],56)+'<span class="nm">'+c.n+'</span>'+(ready[i]?'<div class="stats"><span class="n">'+IC('herz','i14')+st.max+'</span><span class="n">'+IC('schwert','i14')+st.atk+'</span></div><div class="gear">'+IC('waffe','i16 '+(ww?'':'no'))+IC('ruestung','i16 '+(rr?'':'no'))+'</div>':'<span class="tag">'+IC('uhr','i14')+'<span data-wound="'+i+'">'+fmtT(c.wounded-now())+'</span></span>')+'</div>';}).join('')+'</div>';
  h+='<div class="btns" style="margin-top:8px"><span class="tag">'+IC('waffe','i16')+fmt(S.res.waffe)+'</span><span class="tag">'+IC('ruestung','i16')+fmt(S.res.ruestung)+'</span><span class="note" style="margin:0">aus der Schmiede, wird verteilt</span></div>';
  h+='<h3>'+IC('proviant','i16')+'Proviant</h3><div class="btns" style="margin-top:0"><div class="sacks">'+Array.from({length:Math.max(need,1)},(_,k)=>IC('proviant','i28 '+(k<S.res.proviant?'':'no'))).join('')+'</div><span class="n">'+need+' / <span data-r="proviant"></span></span></div>';
  h+='<div class="btns"><span class="note" style="margin:0">Extra zum Rasten</span><div class="seg">'+[0,1,2,3].map(n=>'<button data-act="extra" data-n="'+n+'" class="'+(S.prep.extra===n?'on':'')+'">'+IC('feuer','i16')+n+'</button>').join('')+'</div></div>';
  h+='<h3>'+IC('schiff','i16')+'Ziel</h3><div style="display:flex;flex-direction:column;gap:10px">'+[1,2,3].map(d=>{const open=d===1||S.wins[d-1]>=(d===2?1:2);
    return '<div class="target'+(open?'':' locked')+'"><img class="scene" src="'+scene(d)+'" alt="">'+(open?'':'<div class="lockover">'+IC('schloss','i48')+'</div>')+'<div class="info">'+IB('d:'+d)+'<div class="t"><div class="nm">'+DIFF[d].n+'</div><div class="costs" style="margin-top:2px"><span class="cost">'+IC('sturm','i16')+DIFF[d].storm+'</span>'+DIFF[d].loot.slice(0,3).map(l=>IC(l[0],'i16')).join('')+(S.wins[d]?'<span class="tag green">'+S.wins[d]+'×</span>':'')+(open?'':'<span class="cost">'+(d===2?'1':'2')+'× '+DIFF[d-1].n+'</span>')+'</div></div><button class="btn"'+btnCost({proviant:Math.max(1,need)})+(open&&selIdx.length?'':' data-block="1"')+' data-act="start" data-d="'+d+'">'+IC('schiff','i24')+'Los</button></div></div>';}).join('')+'</div>';
  return h;
}
function runHTML(){
  const R=S.run,base=DIFF[R.diff];
  if(R.over){
    const g=Object.keys(R.over.got);
    return '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding-top:10px">'+IC(R.over.ok?'schiff':'grab','i64')+'<h2>'+(R.over.ok?'Heimgekehrt!':'Gescheitert')+'</h2><div class="crew" style="width:100%">'+R.crew.map(w=>'<div class="war'+(w.hp>0&&R.over.ok?'':' dead')+'" style="cursor:default">'+POR(CREWP[w.ci],48)+'<span class="nm">'+w.n+'</span></div>').join('')+'</div>'+
      (g.length?'<div class="gains" style="justify-content:center">'+g.map((k,j)=>'<div style="animation-delay:'+(j*.08)+'s">'+IC(k,'i28')+(k==='muenzen'?R.over.got[k]:R.over.got[k]+'×')+'</div>').join('')+'</div>':'<p class="note">Keine Beute.</p>')+
      (R.crew.some(w=>w.hp<=0||!R.over.ok)?'<p class="note">'+IC('uhr','i14')+' Gefallene erholen sich 10 Minuten, ihre Ausrüstung ist weg.</p>':'')+
      '<button class="btn wide" data-act="closerun">Weiter</button></div>';
  }
  const px=R.pos%5,py=(R.pos/5)|0,here=R.cells[R.pos];
  const vis=new Set();R.seen.forEach(s=>{vis.add(s);const x=s%5,y=(s/5)|0;N4.forEach(([dx,dy])=>{const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<5&&yy<6)vis.add(idx5(xx,yy));});});
  const stormP=Math.min(100,R.step/base.storm*100),storm=R.step>=base.storm;
  const fresh=runVis?[...vis].filter(v=>!runVis.includes(v)):[];runVis=[...vis];
  const lead=R.crew.find(w=>w.hp>0)||R.crew[0];
  let h='<div class="runhead"><h2 style="font-size:22px">'+base.n+'</h2><span style="flex:1"></span>'+IC('sturm','i24')+'<div class="stormbar"><i style="width:'+stormP+'%"></i></div>'+(storm?'<span class="tag red">Sturm</span>':'<span class="n">'+R.step+'/'+base.storm+'</span>')+'</div>';
  h+='<div class="grid" id="rgrid">'+R.cells.map((c,i)=>{const x=i%5,y=(i/5)|0,adj=Math.abs(x-px)+Math.abs(y-py)===1;
    if(!vis.has(i))return '<div class="cell fog"></div>';
    const cl='cell'+(adj?' near':'')+(c.done&&c.t!=='ship'&&c.t!=='feuer'?' done':'')+(c.loot.length?' loot':'')+(fresh.includes(i)?' reveal':'');
    return '<button class="'+cl+'"'+(adj?' data-act="move" data-i="'+i+'"':' tabindex="-1"')+' aria-label="'+c.t+'"><img src="'+iconURL(CELLICON[c.t])+'" alt=""></button>';}).join('')+'<div class="token" id="tok"><img src="'+portrait(CREWP[lead.ci])+'" alt=""></div></div>';
  h+='<div class="log">'+R.log.slice(0,2).map(l=>'<p>'+esc(l)+'</p>').join('')+'</div>';
  h+='<div class="crew" style="margin-top:6px">'+R.crew.map((w,j)=>'<div class="war'+(w.hp<=0?' dead':'')+'" id="w'+j+'" style="cursor:default">'+POR(CREWP[w.ci],44)+'<span class="nm">'+w.n+'</span><div class="bar'+(w.hp<w.max*.35?' red':'')+'" style="width:100%"><i style="width:'+Math.max(0,w.hp/w.max*100)+'%"></i></div><div class="gear">'+IC('waffe','i14 '+(w.waffe?'':'no'))+IC('ruestung','i14 '+(w.ruestung?'':'no'))+'</div></div>').join('')+'</div>';
  const cap=bagCap();
  h+='<h3>'+IC('proviant','i16')+'Beutel '+R.bag.length+'/'+cap+'</h3><div class="bag">'+R.bag.map((it,j)=>'<div class="slot full">'+IC(it.k)+(it.k==='muenzen'?'<span class="q">'+it.a+'</span>':'')+'<div class="acts">'+(R.safe?'<span></span>':'<button data-act="safe" data-j="'+j+'" aria-label="Ins Runenfach">'+IC('rune')+'</button>')+'<button data-act="drop" data-j="'+j+'" aria-label="Ablegen">'+IC('ab')+'</button></div></div>').join('')+Array.from({length:Math.max(0,cap-R.bag.length)},()=>'<div class="slot"></div>').join('')+
    '<div class="slot safe'+(R.safe?' full':'')+'">'+(R.safe?IC(R.safe.k)+(R.safe.k==='muenzen'?'<span class="q">'+R.safe.a+'</span>':'')+'<div class="acts"><span></span><button data-act="unsafe" aria-label="Herausnehmen">'+IC('nehmen')+'</button></div>':IC('rune','i24'))+'</div></div>';
  if(here.loot.length)h+='<h3>'+IC('truhe','i16')+'Liegt hier</h3><div class="bag">'+here.loot.map((it,j)=>'<div class="slot full">'+IC(it.k)+'<div class="acts"><span></span><button data-act="take" data-j="'+j+'" aria-label="Nehmen"'+(R.bag.length>=cap?' disabled':'')+'>'+IC('nehmen')+'</button></div></div>').join('')+'</div>';
  const canEx=here.t==='ship'||here.t==='feuer';
  h+='<div class="btns" style="margin-top:16px"><button class="btn gold'+(canEx?'':' off')+'" style="flex:1" data-act="extract">'+IC(here.t==='feuer'?'feuer':'schiff','i24')+'Heimfahren</button><button class="btn alt'+(R.extra>0?'':' off')+'" data-act="rest">'+IC('feuer','i24')+'Rasten '+R.extra+'</button></div>';
  return h;
}
let runVis=null;
function afterRun(){
  const R=S.run,g=$('#rgrid'),tok=$('#tok');if(!g||!tok)return;
  const place=i=>{const c=g.children[i];return 'translate('+(c.offsetLeft+c.offsetWidth/2-20)+'px,'+(c.offsetTop+c.offsetHeight/2-20)+'px)';};
  if(lastTok>=0&&lastTok!==R.pos){tok.style.transition='none';tok.style.transform=place(lastTok);void tok.offsetWidth;tok.style.transition='';}
  tok.style.transform=place(R.pos);lastTok=R.pos;
  R.crew.forEach((w,j)=>{const before=prevHp[w.n];if(before!==undefined&&w.hp<before-.5){const el=$('#w'+j);if(el){el.classList.add('hit');const d=document.createElement('span');d.className='dmg';d.textContent='−'+Math.round(before-w.hp);el.appendChild(d);}}prevHp[w.n]=w.hp;});
  if(fx){showFx(fx);fx=null;}
}
function showFx(f){
  const el=document.createElement('div');el.className='fx';
  el.innerHTML='<div class="ttl" style="color:'+(f.win?'var(--moss)':'var(--falun)')+'">'+(f.win?'Sieg!':'Niederlage')+'</div><div class="row"><div class="who enemy">'+POR(ENEMYP[f.kind],64)+ENEMYN[f.kind]+'</div>'+IC('schwert','i28')+
    '<div class="row" style="gap:6px">'+S.run.crew.map(w=>'<div class="who">'+POR(CREWP[w.ci],40)+(f.dmg[w.n]?'<b>−'+Math.round(f.dmg[w.n])+'</b>':'<b style="color:var(--moss)">0</b>')+'</div>').join('')+'</div></div>';
  $('#stage').appendChild(el);setTimeout(()=>el.remove(),1950);
}
