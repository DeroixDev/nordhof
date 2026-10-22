/* ---------- Oberfläche: Leitstand ---------- */
let tab='insel',demolishArm=false,resetArm=false,lastTok=-1,prevHp={},inspTab='betrieb',buildCat='Wohnen';
const TABS=['insel','dorf','waren','handel','wehr','raub','chronik'];
const TABN={insel:'Insel',dorf:'Dorf',waren:'Waren',handel:'Hafen',wehr:'Wehr',raub:'Raubzug',chronik:'Chronik'};
const tabHL=t=>TABHL[t]||1;
const ROM=['','I','II','III','IV','V','VI','VII','VIII'];
const TIERN=L=>L<=2?'Holz':L<=4?'Fachwerk':L<=6?'Stein':'Halle';
const isDesk=()=>window.innerWidth>=900;
function toast(html){const box=$('#toasts');const t=document.createElement('div');t.className='toast';t.innerHTML=html;box.appendChild(t);setTimeout(()=>t.remove(),2900);while(box.children.length>3)box.firstChild.remove();}
function costHTML(c){return '<span class="costs">'+Object.keys(c).map(k=>'<span class="cost" data-need="'+k+':'+c[k]+'">'+IC(k,'i16')+fmt(c[k])+'</span>').join('')+'</span>';}
function btnCost(c){return' data-cost="'+esc(JSON.stringify(c))+'"';}
function fmtN(v){return v>=100?String(Math.round(v)):v>=10?v.toFixed(0):v.toFixed(1).replace('.',',');}
function fmtRate(r){return(r*60).toFixed(r*60<10?1:0).replace('.',',')+'/min';}
function moodKey(){return D.h>=60?'froh':D.h>=40?'mittel':'sauer';}
const IB=info=>'<button class="ibtn" data-act="info" data-info="'+info+'" aria-label="Info">i</button>';
function closeModal(){$('#modal').hidden=true;$('#modalCard').className='mcard';}
function openModal(h,cls){const c=$('#modalCard');c.className='mcard'+(cls?' '+cls:'');c.innerHTML=h;$('#modal').hidden=false;c.scrollTop=0;}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal'&&!battle)closeModal();});

/* ---------- Obere Leiste ---------- */
function resKeys(){return Object.keys(RES).filter(k=>capped(k)&&KNOWN.has(k));}
function renderTop(){
  const L=hofL(),el=$('#res'),keys=resKeys(),sig=keys.join(',')+'|'+isDesk();
  if(el.dataset.sig!==sig){el.dataset.sig=sig;
    el.innerHTML=keys.map(k=>'<button class="chip" data-act="chip" data-k="'+k+'" data-chip="'+k+'" aria-label="'+RES[k].n+'">'+IC(k)+'<b><span data-r="'+k+'">'+fmt(S.res[k]||0)+'</span><small data-capt="1"></small></b><span class="rt" data-rt="'+k+'"></span><span class="cb"><i data-fill="'+k+'"></i></span></button>').join('')+'<button class="more" id="moreB" data-act="pop" aria-label="Ganzes Lager"></button>';
    fitRes();}
  const hl=L+'|'+(busy(S.tiles[S.hof].b)?1:0);
  if($('#hofB').dataset.l!==hl){$('#hofB').dataset.l=hl;const src=thumb('hof',L);$('#hofI').src=src;$('#mHofI').src=src;$('#hofN').textContent='Hofstufe '+L;}
  const g=goalState(),gt=L>=MAXLVL?'Höchste Stufe':busy(S.tiles[S.hof].b)?'Ausbau läuft':'Ziel '+g.ok+' von '+g.n;
  if($('#hofG').textContent!==gt)$('#hofG').textContent=gt;$('#hofP').style.width=(L>=MAXLVL?100:g.f*100)+'%';
  $('#hofB').classList.toggle('ready',g.ready);
  document.querySelectorAll('#rail [data-t],#mnav [data-t]').forEach(b=>{const lk=tabHL(b.dataset.t)>L;b.classList.toggle('locked',lk);b.classList.toggle('on',b.dataset.t===tab);b.title=lk?TABN[b.dataset.t]+': ab Hofstufe '+tabHL(b.dataset.t):TABN[b.dataset.t];b.dataset.hl='Hof '+tabHL(b.dataset.t);});
  const raid=$('#raidChip');raid.classList.toggle('off',L<2);
}
/* So viele Rohstoffe wie Platz haben, der Rest steckt hinter dem Knopf */
function fitRes(){
  const el=$('#res');if(!el||!el.offsetParent||!$('#moreB'))return;const ch=[...el.querySelectorAll('[data-chip]')],more=$('#moreB');
  ch.forEach(c=>c.hidden=false);let hid=0;
  if(!isDesk()){for(let k=4;k<ch.length;k++){ch[k].hidden=true;hid++;}}
  else for(let k=ch.length-1;k>=0&&el.scrollWidth>el.clientWidth+1;k--){ch[k].hidden=true;hid++;}
  more.innerHTML=hid?'+'+hid:IC('lager','i20');
}
/* Was für den nächsten Hof gebraucht wird */
function goalState(){
  const L=hofL();if(L>=MAXLVL)return{n:0,ok:0,f:1,ready:false,c:{}};
  const c=HOFUP[L+1],ks=Object.keys(c);let ok=0,f=0;for(const k of ks){const v=Math.min(1,(S.res[k]||0)/c[k]);f+=v;if(v>=1)ok++;}
  const hb=S.tiles[S.hof].b;return{n:ks.length,ok,f:ks.length?f/ks.length:1,ready:ok===ks.length&&!busy(hb)&&freeB()>0,c};
}

/* ---------- Linke Tafel ---------- */
function renderLeft(){
  if(!$('#app').classList.contains('lopen')||!isDesk())return;
  const L=hofL(),hb=S.tiles[S.hof].b,g=goalState();
  let gs=L+'|'+busy(hb)+'|'+g.ok+'|'+g.ready,ge=$('#goal');
  if(ge.dataset.sig!==gs){ge.dataset.sig=gs;let h;
    if(L>=MAXLVL)h='<div class="ghead"><img src="'+thumb('hof',L)+'" alt=""><div><b>Jarl des Nordens</b><small>Der Hof hat die höchste Stufe.</small></div></div>';
    else{const C=CHAPTER[L+1];
      h='<div class="sech"><img class="ico i16" data-icon="krone" src="'+iconURL('krone')+'" alt=""><span class="lbl">Nächstes Ziel</span></div><button class="ghead" data-act="hof" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:10px;margin-bottom:8px"><img src="'+thumb('hof',L+1)+'" alt="" style="width:46px;height:42px;object-fit:contain"><div><b style="font-family:var(--display);font-size:19px">Hofstufe '+(L+1)+'</b><small style="display:block;font-size:11.5px;color:var(--mut)">Kapitel '+ROM[L+1]+': '+C.n+'</small></div></button>';
      if(busy(hb))h+='<div class="flow" style="margin-top:0">'+IC('arbeit','i24')+'<div class="bar gold"><i data-jobbar="'+S.hof+'"></i></div><span class="n" data-jobt="'+S.hof+'"></span></div>';
      else{h+=Object.keys(g.c).map(k=>'<div class="goal" data-gk="'+k+'">'+IC(k,'i20')+'<span class="gn">'+RES[k].n+'<span class="gb"><i></i></span></span><b></b></div>').join('');
        h+='<div class="btns" style="margin-top:10px"><button class="btn '+(g.ready?'gold':'alt')+' wide" data-act="hofup">'+IC('hoch','i16')+(g.ready?'Hof ausbauen':'Hof ansehen')+'</button></div>';}}
    ge.innerHTML=h;}
  ge.querySelectorAll('[data-gk]').forEach(el=>{const k=el.dataset.gk,need=g.c[k],v=S.res[k]||0;el.classList.toggle('ok',v>=need);el.querySelector('i').style.width=Math.min(100,v/need*100)+'%';const t=fmt(Math.min(v,need))+'/'+fmt(need);const b=el.querySelector('b');if(b.textContent!==t)b.textContent=t;});
  /* Baumeister */
  const jobs=BL.filter(i=>busy(S.tiles[i].b)),free=Math.max(0,freeB()),js=jobs.join(',')+'|'+(S.explore?S.explore.r:'')+'|'+free;const je=$('#jobs');
  if(je.dataset.sig!==js){je.dataset.sig=js;let h='';
    for(const i of jobs){const b=S.tiles[i].b;h+='<div class="job"><button class="jl" data-act="goto" data-i="'+i+'"><img src="'+thumb(b.type,b.job==='up'?b.lvl+1:b.lvl)+'" alt=""><span class="jn"><b>'+B[b.type].n+'</b><small>'+(b.job==='up'?'Stufe '+(b.lvl+1):'Neubau')+' · <span data-jobt="'+i+'"></span></small><span class="bar thin gold"><i data-jobbar="'+i+'"></i></span></span></button><button class="rbtn" data-act="rush" data-rush="'+i+'" title="Sofort fertig"><span data-rushc="'+i+'"></span></button></div>';}
    if(S.explore){const R=REG[S.explore.r];h+='<div class="job"><span class="jl">'+IC(R.ic,'i28')+'<span class="jn"><b>'+R.n+'</b><small>Erkundung · <span data-jobt="x"></span></small><span class="bar thin gold"><i data-jobbar="x"></i></span></span></span><button class="rbtn" data-act="rush" data-rush="x" title="Sofort fertig"><span data-rushc="x"></span></button></div>';}
    for(let k=0;k<free;k++)h+='<div class="job free">'+IC('arbeit','i20')+'<span>frei: unten ein Gebäude wählen</span></div>';
    je.innerHTML=h;}
  const bf=Math.max(0,freeB())+' von '+builders()+' frei';if($('#bldF').textContent!==bf)$('#bldF').textContent=bf;
  /* Engpässe */
  const ws=warnings(),wsig=ws.map(w=>w.key).join('|'),we=$('#warns');
  if(we.dataset.sig!==wsig){we.dataset.sig=wsig;
    we.innerHTML=ws.length?ws.map(w=>'<button class="warn'+(w.mild?' mild':'')+'"'+(w.i>=0?' data-act="goto" data-i="'+w.i+'"':' data-act="'+(w.act||'noop')+'"'+(w.t?' data-t="'+w.t+'"':''))+'>'+w.img+'<span>'+w.n+'<small>'+w.why+'</small></span></button>').join(''):'<div class="calm-ok">'+IC('froh','i20')+'Alles läuft.</div>';}
}
/* Was gerade hakt: fehlende Zutaten, zu wenig Arbeitsfläche, volles Lager, Hunger, fehlende Leute */
function warnings(){
  const out=[];
  if(!FOOD.some(k=>S.res[k]>=1))out.push({key:'hunger',i:-1,img:IC('sauer','i24'),n:'Hunger',why:'Keine Nahrung im Lager. Leute ziehen weg.',act:'tab',t:'dorf'});
  if(D.staff<.999)out.push({key:'staff',i:-1,img:IC('leute','i24'),n:'Zu wenig Leute',why:S.pop.n+' Einwohner für '+D.jobs+' Arbeitsplätze',act:'tab',t:'dorf',mild:1});
  const nc=BL.filter(i=>!connected(i)&&!(S.tiles[i].b.job==='build'&&busy(S.tiles[i].b)));
  if(nc.length)out.push({key:'road'+nc.length,i:nc[0],img:'<img src="'+roadThumb(1)+'" alt="">',n:nc.length===1?B[S.tiles[nc[0]].b.type].n+' ohne Weg':nc.length+' Gebäude ohne Weg',why:'Halbe Leistung. Mit einem Weg zum Hof verbinden.'});
  for(const i of BL){const b=S.tiles[i].b;if(busy(b))continue;const d=B[b.type],img='<img src="'+thumb(b.type,b.lvl)+'" alt="">';
    const ok=outOf(b);if(ok&&b.buf>=bufCap(b)*.95&&S.res[ok]<D.cap-1){out.push({key:'t'+i,i,img,n:d.n,why:'Träger kommen nicht nach. Lager näher, besserer Weg oder Karren.',mild:1});if(out.length>=7)break;continue;}
    if(d.kind==='craft'){const key=b.recipe||d.rec[0],r=RECIPES[key];if(!b.run){const miss=Object.keys(r.in).filter(k=>(S.res[k]||0)<r.in[k]);if(miss.length)out.push({key:'c'+i,i,img,n:d.n,why:'wartet auf '+miss.map(k=>RES[k].n).join(', ')});else if(capped(key)&&S.res[key]>=D.cap)out.push({key:'f'+i,i,img,n:d.n,why:RES[key].n+': Lager voll',mild:1});}}
    else if(d.kind==='prod'){const a=AREA[i];if(a&&a.f<.5)out.push({key:'a'+i,i,img,n:d.n,why:'nur '+Math.round(a.f*100)+' % Arbeitsfläche',mild:a.f>=.25});
      else if(S.res[d.out]>=D.cap)out.push({key:'f'+i,i,img,n:d.n,why:RES[d.out].n+': Lager voll',mild:1});}
    if(out.length>=7)break;}
  return out.slice(0,7);
}
/* Zustand eines Gebäudes in einem Satz: für Tooltip und Auswahl */
function bStatus(i){
  const b=S.tiles[i].b,d=B[b.type],o=[];
  if(busy(b)){o.push(['uhr',(b.job==='up'?'Ausbau auf Stufe '+(b.lvl+1):'Wird gebaut')+', noch '+fmtDur((b.until-now())/1000),'']);return o;}
  if(!connected(i))o.push(['pfad','Kein Weg zum Hof: halbe Leistung','bad']);
  idleTip(i,o);
  if(d.kind==='prod'){const r=prodRate(i);o.push([d.out,'+'+fmtRate(r)+' '+RES[d.out].n,r>0?'good':'bad']);const a=AREA[i];if(a)o.push([ADJICON[d.adj.t]||'wiese','Arbeitsfläche '+Math.round(a.f*100)+' %',a.f<.5?'bad':'']);}
  if(d.kind==='craft'){const key=b.recipe||d.rec[0],r=RECIPES[key],miss=Object.keys(r.in).filter(k=>(S.res[k]||0)<r.in[k]);
    if(!b.run&&miss.length)o.push([miss[0],'wartet auf '+miss.map(k=>RES[k].n).join(', '),'bad']);else o.push([key,'macht '+RES[key].n,'good']);}
  if(d.kind==='home')o.push(['leute',(b.type==='hof'?BASEHOUSE+d.cap*b.lvl:d.cap*b.lvl)+' Wohnplätze','']);
  if(d.kind==='joy')o.push(['froh','+'+d.joy*b.lvl+' Zufriedenheit','']);
  if(d.kind==='store')o.push(['lager','Lager '+fmt(D.cap)+' je Rohstoff','']);
  if(RANGE[b.type])o.push(['ziel','Reichweite '+rangeOf(b).toFixed(1).replace('.',',')+' Felder','']);
  return o;
}
function tipHTML(i){
  const T=S.tiles[i];if(T.t==='water')return '';
  const a=anc(i);
  if(a>=0){const b=S.tiles[a].b,d=B[b.type];return '<b>'+d.n+'</b>'+(d.hidden&&b.type!=='hof'?'':' · Stufe '+b.lvl)+bStatus(a).map(s=>'<div class="tr '+s[2]+'">'+IC(s[0],'i16')+s[1]+'</div>').join('');}
  const R=REG[T.r];
  if(T.rd)return '<b>'+(T.t==='water'?'Brücke · ':'')+ROADS[T.rd].n+'</b><div class="tr">'+IC('pfad','i16')+'Laufen ×'+String(ROADS[T.rd].sp).replace('.',',')+(RCH[i]?'':' · nicht mit dem Hof verbunden')+'</div>';
  if(!unlocked(i))return '<b>'+R.n+'</b><div class="tr">'+IC('schloss','i16')+(R.hl>hofL()?'Erkunden ab Hofstufe '+R.hl:'Antippen zum Erkunden')+'</div>';
  return '<b>'+TERR[T.t].n+'</b><div class="tr">'+IC(R.ic,'i16')+R.n+'</div>';
}

/* ---------- Auswahl (rechte Tafel) ---------- */
function renderSheet(){
  const sh=$('#insp'),open=sel>=0&&tab==='insel';
  $('#app').classList.toggle('iopen',open);
  if(!open)return;
  sh.innerHTML=inspHTML(sel);refresh();
  if(!isDesk())$('#app').classList.remove('bopen');
}
function lvlRow(b){let h='<div class="lvl">';const m=maxLvl(b);for(let k=1;k<=MAXLVL;k++)h+='<i class="'+(k<=b.lvl?'on':k>m?'cap':'')+'"></i>';return h+'<span class="tag gold" style="margin-left:6px">'+TIERN(b.lvl)+'</span></div>';}
function inspHTML(i){
  const T=S.tiles[i],close='<button class="x" data-act="close" aria-label="Schließen"></button>';
  if(!unlocked(i)){
    const r=T.r,R=REG[r],ex=S.explore,lock=R.hl>hofL();
    let h='<div class="ihead">'+IC(R.ic,'i48')+'<div class="t"><h2>'+R.n+'</h2><p class="sub">'+(R.desc||'')+'</p></div>'+close+'</div>';
    h+='<h3>'+IC('truhe','i16')+'Nur hier</h3><div class="ichips">'+R.finds.map(k=>'<button class="ichip" data-act="info" data-info="r:'+k+'">'+IC(k,'i28')+RES[k].n+'</button>').join('')+Object.keys(B).filter(k=>B[k].reg&&B[k].reg.includes(R.id)).map(k=>'<button class="ichip" data-act="info" data-info="b:'+k+'"><img src="'+thumb(k)+'" alt="">'+B[k].n+'</button>').join('')+'</div>';
    if(ex&&ex.r===r){h+='<div class="flow">'+IC('uhr','i28')+'<div class="bar gold"><i data-jobbar="x"></i></div><span class="n" data-jobt="x"></span></div><div class="btns"><button class="btn gold wide" data-act="rush" data-rush="x">'+IC('muenzen','i16')+'Sofort fertig <span data-rushc="x"></span></button></div>';}
    else if(lock)h+='<div class="btns"><span class="tag gold">'+IC('krone','i16')+'Erkunden ab Hofstufe '+R.hl+'</span></div>';
    else if(ex)h+='<p class="note">'+IC('uhr','i14')+' Gerade wird '+REG[ex.r].n+' erkundet. Immer nur ein Gebiet zugleich.</p>';
    else h+='<div class="btns"><button class="btn gold wide"'+btnCost(R.cost)+(freeB()>0?'':' data-block="1"')+' data-act="explore" data-reg="'+r+'">'+IC('schiff','i16')+'Erkunden '+costHTML(R.cost)+'<span class="cost">'+IC('uhr','i14')+fmtDur(R.t)+'</span></button></div>'+(freeB()>0?'':'<p class="note">'+IC('arbeit','i14')+' Alle Baumeister sind beschäftigt.</p>');
    return h;
  }
  if(!T.b&&T.rd){
    const R=ROADS[T.rd];let h='<div class="ihead"><img class="th" src="'+roadThumb(T.rd)+'" alt=""><div class="t"><h2>'+(T.t==='water'?'Brücke':R.n)+'</h2><p class="sub">'+R.desc+'</p></div>'+close+'</div>';
    h+='<div class="igrid"><div class="irow">'+IC('pfad','i24')+'<span>Laufen</span><b>×'+String(R.sp).replace('.',',')+'</b></div><div class="irow">'+IC('krone','i24')+'<span>Netz</span><b>'+(RCH[i]?'mit dem Hof verbunden':'nicht verbunden')+'</b></div></div>';
    const up=[2,3].filter(l=>l>T.rd&&ROADS[l].hl<=hofL());
    h+='<div class="btns">'+up.map(l=>'<button class="btn gold small" data-act="road" data-k="'+l+'"'+btnCost(ROADS[l].cost)+'>'+IC('hoch','i16')+ROADS[l].n+'</button>').join('')+'<span style="flex:1"></span><button class="btn alt small" data-act="delroad">'+IC('abriss','i16')+'Entfernen</button></div>';
    return h;
  }
  if(!T.b){
    const tic={grass:'wiese',forest:'wald',rock:'stein',sand:'duene',tundra:'wald',heide:'heide',moor:'moor',berg:'berg'}[T.t]||'wiese';
    let h='<div class="ihead">'+IC(tic,'i48')+'<div class="t"><h2>'+TERR[T.t].n+'</h2><p class="sub">'+REG[T.r].n+(T.t==='forest'?'. Bauen rodet den Wald.':'')+'</p></div>'+close+'</div>';
    const fits=Object.keys(B).filter(k=>!B[k].hidden&&B[k].hl<=hofL()&&placeErr(k,i)==='');
    h+='<h3>'+IC('plus','i16')+'Passt hierher</h3>'+(fits.length?'<div class="bgrid">'+fits.map(k=>'<button class="bc" style="flex:none" data-act="place" data-k="'+k+'"><img class="th" src="'+thumb(k)+'" alt=""><span class="nm">'+B[k].n+'</span>'+costHTML(B[k].cost)+'</button>').join('')+'</div>':'<p class="note">Hier passt gerade nichts hin.</p>');
    return h;
  }
  const b=T.b,d=B[b.type],bz=busy(b),isHof=b.type==='hof';
  let h='<div class="ihead"><img class="th" src="'+thumb(b.type,bz&&b.job==='up'?b.lvl+1:b.lvl)+'" alt=""><div class="t"><h2>'+d.n+'</h2>'+(bz?'<p class="sub">'+(b.job==='up'?'Ausbau auf Stufe '+(b.lvl+1):'Wird gebaut')+'</p>':lvlRow(b))+'</div>'+IB('b:'+b.type)+close+'</div>';
  if(bz){
    return h+'<div class="flow">'+IC('arbeit','i28')+'<div class="bar gold"><i data-jobbar="'+i+'"></i></div><span class="n" data-jobt="'+i+'"></span></div>'+
      (b.job==='up'?'<p class="note">'+IC('uhr','i14')+' Während des Ausbaus ruht der Betrieb.</p>':'')+
      '<div class="btns"><button class="btn gold wide" data-act="rush" data-rush="'+i+'">'+IC('muenzen','i16')+'Sofort fertig <span data-rushc="'+i+'"></span></button></div>';
  }
  if(b.hurt)h+=repairHTML(i);
  h+='<div class="itabs">'+[['betrieb','Betrieb'],['ausbau','Ausbau'],['lage','Lage']].map(([k,n])=>'<button data-act="itab" data-k="'+k+'" class="'+(inspTab===k?'on':'')+'">'+n+'</button>').join('')+'</div>';
  if(inspTab==='betrieb')h+=betriebHTML(i);else if(inspTab==='ausbau')h+=ausbauHTML(i);else h+=lageHTML(i);
  return h;
}
function betriebHTML(i){
  const b=S.tiles[i].b,d=B[b.type];let h=idleNote(i);
  if(!connected(i))h+='<p class="note warn">'+IC('pfad','i16')+' Kein Weg zum Hof. '+(d.kind==='home'?'Nur halb so viele Wohnplätze':d.kind==='joy'?'Keine Wirkung':'Halbe Leistung')+', bis ein Weg anliegt.</p><div class="btns"><button class="btn gold small" data-act="road" data-k="1">'+IC('pfad','i16')+'Pfad legen</button></div>';
  if(d.jobs){const j=jobsOf(b),f=Math.round(j*D.staff);h+='<div class="flow">'+IC('arbeit','i28')+'<div class="workers">'+Array.from({length:j},(_,k)=>'<i class="'+(k<f?'on':'')+'"></i>').join('')+'</div><span class="n">'+f+'/'+j+'</span><span style="flex:1"></span>'+IC(moodKey(),'i24')+'<span class="n">'+Math.round(D.eff*100)+' %</span></div>';}
  if(d.kind==='home')h+='<div class="flow">'+IC('leute','i36')+'<span class="n" style="font-size:18px">+'+(b.type==='hof'?BASEHOUSE+d.cap*b.lvl:d.cap*b.lvl)+'</span><span class="note" style="margin:0">Wohnplätze</span><span style="flex:1"></span><span class="n">'+IC('leute','i16')+'<span data-live="pop"></span>/<span data-live="house"></span></span></div>';
  if(d.kind==='joy')h+='<div class="flow">'+IC('froh','i36')+'<span class="n" style="font-size:18px">+'+d.joy*b.lvl+'</span><span class="note" style="margin:0">Zufriedenheit'+(d.uses?' · braucht '+IC('met','i16'):'')+(d.tax?' · +'+Math.round(d.tax*b.lvl*100)+' % Steuern':'')+'</span></div>';
  if(d.kind==='prod'){const a=AREA[i];h+='<div class="flow">'+IC(d.out,'i36')+'<span class="n" style="font-size:18px">'+fmtRate(prodRate(i))+'</span><div class="bar gold"><i data-fill="'+d.out+'"></i></div>'+IC('lager','i24')+'<span class="n">'+fmt(D.cap)+'</span></div>';
    if(a&&a.f<1)h+='<p class="note'+(a.f<.5?' warn':'')+'">'+IC(ADJICON[d.adj.t]||'wiese','i16')+' Nur '+Math.round(a.f*100)+' % Arbeitsfläche. Mehr '+TERR[d.adj.t].n+' im Umkreis oder weniger gleiche Betriebe daneben.</p>';h+=fieldNote(i);}
  if(d.kind==='craft'){
    const key=b.recipe||d.rec[0],r=RECIPES[key];
    h+='<div class="flow">'+Object.keys(r.in).map(x=>'<span class="n">'+r.in[x]+'×'+IC(x,'i28')+'</span>').join('')+'<span class="arrow"></span><span class="n">'+r.out+'×'+IC(key,'i36')+'</span><div class="bar"><i data-prog="'+i+'"></i></div><span class="n" style="font-size:12px">'+IC('uhr','i16')+(r.t/Math.max(.01,craftSpeed(i))).toFixed(1).replace('.',',')+' s</span></div>';
    const miss=Object.keys(r.in).filter(k=>(S.res[k]||0)<r.in[k]);if(!b.run&&miss.length)h+='<p class="note warn">'+IC(miss[0],'i16')+' Wartet auf '+miss.map(k=>RES[k].n).join(', ')+'.</p>';
    if(d.rec.length>1)h+='<h3>Rezept</h3><div class="seg">'+d.rec.map(k=>'<button data-act="recipe" data-k="'+k+'" class="'+(k===key?'on':'')+'">'+IC(k,'i28')+RES[k].n+'</button>').join('')+'</div>';
  }
  if(LOG[i]){const L=LOG[i],T=TRANS[L.mode],cap=bufCap(b),bf=b.buf||0;
    h+='<h3>'+IC('proviant','i16')+'Träger</h3><div class="flow">'+'<span class="n">'+L.n+'×</span>'+IC(L.mode===2?'ochse':L.mode?'karren':'leute','i28')+'<span class="note" style="margin:0">'+T.n+' · '+T.cap+' Stück · hin und zurück '+fmtDur(L.trip)+'</span><span style="flex:1"></span><span class="n">bis '+fmtRate(L.rate)+'</span></div>'+
      '<div class="flow">'+IC(outOf(b),'i28')+'<span class="note" style="margin:0">Vorrat vor der Tür</span><div class="bar'+(bf>=cap*.95?' red':'')+'"><i style="width:'+Math.min(100,bf/cap*100)+'%"></i></div><span class="n">'+Math.floor(bf)+'/'+cap+'</span></div>';
    if(bf>=cap*.95&&S.res[outOf(b)]<D.cap-1)h+='<p class="note warn">'+IC('proviant','i16')+' Die Träger kommen nicht nach, der Betrieb wartet. Ein Lagerhaus in der Nähe, ein schnellerer Weg oder Karren helfen.</p>';
    else if(!L.mode&&hofL()>=2&&!countType('stellmacher'))h+='<p class="note">'+IC('bretter','i16')+' Ein Stellmacher baut Handkarren: 10 statt 5 Stück je Gang.</p>';
    else if(L.mode===1&&countType('ochsenstall')&&HUBL[i]<2)h+='<p class="note">'+IC('stein','i16')+' Ochsenkarren fahren nur, wenn der Weg bis zum Lager Schotter oder Pflaster ist.</p>';}
  if(d.kind==='store')h+='<div class="flow">'+IC('lager','i36')+'<span class="n" style="font-size:18px">'+fmt(D.cap)+'</span><span class="note" style="margin:0">Platz je Rohstoff</span></div>';
  if(d.kind==='builder')h+='<div class="flow">'+IC('arbeit','i36')+'<span class="note" style="margin:0">Hier wohnt ein Baumeister. Zusammen '+builders()+' von höchstens 5.</span></div>';
  if(d.kind==='def'||RANGE[b.type])h+='<div class="flow">'+(RANGE[b.type]?'<span class="n">'+IC('ziel','i28')+rangeOf(b).toFixed(1).replace('.',',')+' Felder</span>':'')+(d.hp?'<span class="n">'+IC('herz','i28')+'+'+d.hp*b.lvl+'</span>':'')+(d.dmg?'<span class="n">'+IC('schwert','i28')+'+'+d.dmg*b.lvl+'</span>':'')+'<span style="flex:1"></span><span class="n">'+IC('schild','i28')+Math.round(D.hp)+' / '+Math.round(D.dmg)+'</span></div>';
  if(b.type==='hof')h+='<p class="note">'+CHAPTER[hofL()].t+'</p><div class="btns"><button class="btn gold wide" data-act="hof">'+IC('krone','i16')+'Hof und Geschichte</button></div>';
  return h;
}
function ausbauHTML(i){
  const b=S.tiles[i].b,d=B[b.type],m=maxLvl(b),isHof=b.type==='hof';let h='';
  const show=[b.lvl,b.lvl+1,Math.min(MAXLVL,b.lvl+2)].filter((v,k,a)=>v<=MAXLVL&&a.indexOf(v)===k);
  h+='<div class="tiers">'+show.map(L=>'<div class="'+(L===b.lvl?'now':L>m?'lock':'')+'"><img src="'+thumb(b.type,L)+'" alt=""><b>Stufe '+L+'</b><small>'+(L===b.lvl?'jetzt':L>m?'Hofstufe '+L:TIERN(L))+'</small></div>').join('')+'</div>';
  if(isHof){const g=goalState();h+='<p class="note">Jede Hofstufe schaltet neue Gebäude, Gebiete und Stufen frei. Kein Gebäude steht höher als der Hof.</p><div class="btns"><button class="btn '+(g.ready?'gold':'alt')+' wide" data-act="hof">'+IC('krone','i16')+'Hofstufe '+(b.lvl+1)+' ansehen</button></div>';return h;}
  if(b.lvl>=MAXLVL)return h+'<div class="btns"><span class="tag green">'+IC('krone','i16')+'Höchste Stufe</span></div>'+demoBtn();
  if(b.lvl>=m)return h+'<p class="note warn">'+IC('krone','i16')+' Erst Hofstufe '+(b.lvl+1)+', dann geht es hier weiter.</p>'+demoBtn();
  const c=upCost(b);
  if(freeB()<=0)h+='<p class="note warn">'+IC('arbeit','i16')+' Alle Baumeister sind beschäftigt.</p>';
  h+='<div class="btns"><button class="btn gold wide"'+btnCost(c)+(freeB()>0?'':' data-block="1"')+' data-act="upgrade">'+IC('hoch','i16')+'Stufe '+(b.lvl+1)+' '+costHTML(c)+'<span class="cost">'+IC('uhr','i14')+fmtDur(bTime(b.type,b.lvl))+'</span></button></div>';
  const gain=[];if(d.kind==='prod')gain.push(IC(d.out,'i16')+'+'+fmtRate(prodRate(i)/b.lvl));if(d.kind==='craft')gain.push(IC('arbeit','i16')+'schneller');if(d.jobs)gain.push(IC('leute','i16')+'+1 Arbeitsplatz');if(d.kind==='home'&&d.cap)gain.push(IC('leute','i16')+'+'+d.cap+' Wohnplätze');if(d.kind==='store')gain.push(IC('lager','i16')+'+150 Lager');if(RANGE[b.type])gain.push(IC('ziel','i16')+'+0,45 Reichweite');
  if(gain.length)h+='<p class="note">Bringt: '+gain.join(' · ')+'</p>';
  return h+demoBtn();
}
function demoBtn(){const b=S.tiles[sel].b;if(B[b.type].hidden)return '';return '<div class="btns"><span style="flex:1"></span><button class="btn '+(demolishArm?'red':'alt')+' small" data-act="demolish" title="Abreißen (X)">'+IC('abriss','i20')+(demolishArm?'Wirklich abreißen?':'Abreißen')+'</button></div>';}
function lageHTML(i){
  const b=S.tiles[i].b,d=B[b.type],n=fpOf(b.type),R=REG[S.tiles[i].r];let h='<div class="igrid">';
  const row=(ic,l,v)=>'<div class="irow">'+ic+'<span>'+l+'</span><b>'+v+'</b></div>';
  h+=row(IC(R.ic,'i24'),'Gebiet',R.n)+row(IC('plus','i24'),'Grundfläche',n+' × '+n+' Felder');
  const a=AREA[i];if(a)h+=row(IC(ADJICON[d.adj.t]||'wiese','i24'),'Arbeitsfläche',a.n+' Felder '+TERR[d.adj.t].n+', davon '+fmtN(a.sh)+' für sich. Braucht '+a.need+' für 100 %.');
  if(d.adj&&d.adj.b){const bo=bonus(i);h+=row('<img class="ico i24" src="'+thumb(d.adj.b)+'" alt="">','Zulieferer',B[d.adj.b].n+' bis 6 Felder entfernt: +'+Math.round(bo*100)+' % (höchstens +'+Math.round(d.adj.max*100)+' %)');}
  if(d.need)h+=row(IC(d.need==='coast'?'wasser':'stein','i24'),'Bauplatz',d.need==='coast'?'an der Küste':d.need==='peak'?'am Gipfel':'am Fels');
  if(!noRoad(b.type))h+=row(IC('pfad','i24'),'Weg',!connected(i)?'Kein Anschluss: halbe Leistung':HUBD[i]>0?'Laufweg zum nächsten Lager '+fmtN(HUBD[i])+' · Leistung '+Math.round(roadF(i)*100)+' %':'Angeschlossen');
  h+='</div>';
  h+='<div class="btns"><button class="btn alt small" data-act="rotate" title="Drehen (R)">↻ Drehen</button><span class="note" style="margin:0">Die Tür zeigt zum Weg.</span></div>';
  if(d.ar)h+='<p class="note">Auf der Karte: grüne Felder gehören diesem Betrieb, goldene teilt er mit gleichen Betrieben.</p>';
  return h;
}

/* ---------- Bauleiste ---------- */
function buildList(cat){const L=hofL();return Object.keys(B).filter(k=>!B[k].hidden&&B[k].g===cat&&B[k].hl<=L+1).sort((a,b)=>B[a].hl-B[b].hl);}
function renderBuild(){
  const el=$('#build'),L=hofL();if(!el)return;
  const cats=['Wege',...GROUPS.filter(g=>buildList(g).length)];if(!cats.includes(buildCat))buildCat=cats[1]||cats[0];
  const closed=el.classList.contains('closed')&&isDesk();
  $('#bcats').innerHTML=(isDesk()?'<button class="tgl" data-act="buildtoggle" title="Bauleiste (B)">'+IC('bauhuette','i16')+(closed?'Bauen':'Zu')+'</button>':'')+cats.map(g=>'<button data-act="bcat" data-g="'+g+'" class="'+(g===buildCat&&!closed?'on':'')+'">'+g+'</button>').join('')+(isDesk()?'<span class="bkey"><kbd>B</kbd> Bauen · <kbd>P</kbd> Pfad · <kbd>R</kbd> Drehen</span>':'');
  if(closed){$('#bcards').innerHTML='';sizeBB();return;}
  const fb=freeB()>0;
  if(buildCat==='Wege'){$('#bcards').innerHTML=[1,2,3,0].filter(lv=>!lv||ROADS[lv].hl<=L+2).map(lv=>{const R=ROADS[lv],lock=lv&&R.hl>L,on=roadMode()&&place.road===lv;
      return '<button class="bc'+(lock?' lock':'')+(on?' on':'')+'" data-act="road" data-k="'+lv+'" title="'+esc(lv?R.n+': '+R.desc:'Wege entfernen')+'"><span class="fp">'+(lv?'×'+String(R.sp).replace('.',','):'')+'</span><img class="th" src="'+roadThumb(lv)+'" alt=""><span class="nm">'+(lv?R.n:'Entfernen')+'</span>'+
        (lock?'<span class="why g">'+IC('krone','i14')+' Hofstufe '+R.hl+'</span>':lv?(Object.keys(R.cost).length?costHTML(R.cost):'<span class="costs"><span class="cost">frei</span></span>')+'<span class="costs" style="opacity:.75"><span class="cost">je Feld</span></span>':'<span class="costs" style="opacity:.75"><span class="cost">'+IC('abriss','i14')+'kostenlos</span></span>')+'</button>';}).join('');
    sizeBB();refresh();return;}
  $('#bcards').innerHTML=buildList(buildCat).map(k=>{const d=B[k],n=fpOf(k);let why='',cls='bc';
    const regOpen=!d.reg||d.reg.some(g=>S.open.includes(REGI[g]));
    if(d.hl>L){cls+=' lock';why='<span class="why g">'+IC('krone','i14')+' Hofstufe '+d.hl+'</span>';}
    else if(!regOpen){cls+=' lock';why='<span class="why g">'+IC(REG[REGI[d.reg[0]]].ic,'i14')+' '+d.reg.map(g=>REG[REGI[g]].n).join(' / ')+'</span>';}
    else if(d.max&&countType(k)>=d.max){cls+=' lock';why='<span class="why">Höchstens '+d.max+'</span>';}
    else if(!has(d.cost)||!fb)cls+=' off';
    if(place&&place.type===k)cls+=' on';
    return '<button class="'+cls+'" data-act="place" data-k="'+k+'"'+btnCost(d.cost)+' title="'+esc(d.n+': '+(DESC[k]||''))+'"><span class="fp">'+n+'×'+n+'</span><img class="th" src="'+thumb(k)+'" alt=""><span class="nm">'+d.n+'</span>'+(why||costHTML(d.cost)+'<span class="costs" style="opacity:.75"><span class="cost">'+IC('uhr','i14')+fmtDur(bTime(k,0))+'</span>'+(d.reg?'<span class="cost">'+IC(REG[REGI[d.reg[0]]].ic,'i14')+'</span>':'')+'</span>')+'</button>';}).join('');
  sizeBB();refresh();
}
function sizeBB(){const el=$('#build');requestAnimationFrame(()=>{const h=isDesk()?el.offsetHeight+10:0;$('#app').style.setProperty('--bb',h+'px');});}
function toggleBuild(){
  if(!isDesk()){$('#app').classList.toggle('bopen');if($('#app').classList.contains('bopen')){selectTile(-1);renderBuild();}return;}
  $('#build').classList.toggle('closed');renderBuild();
}
function renderPlacebar(){
  const p=$('#placebar');if(!place){p.hidden=true;return;}
  if(roadMode()){const lv=place.road,pl=place.plan;let st;
    if(!place.cells.length)st='<small>'+(isDesk()?'Mit gedrückter Maustaste ziehen.':'Mit dem Finger ziehen.')+'</small>';
    else if(place.err)st='<small class="err">'+place.err+'</small>';
    else st='<small class="ok">'+pl.ok.length+' Feld'+(pl.ok.length>1?'er':'')+(lv?' · '+(Object.keys(pl.cost).length?costHTML(pl.cost):'kostenlos'):' entfernen')+'</small>';
    p.innerHTML='<img src="'+roadThumb(lv)+'" alt=""><span class="t"><b>'+(lv?ROADS[lv].n+' legen':'Wege entfernen')+'</b>'+st+'</span><span class="desk lbl" style="white-space:nowrap;text-transform:none;letter-spacing:0;font-weight:600">Ziehen legt · <kbd>Esc</kbd> fertig</span><span class="touch"><button class="btn small gold" data-act="endplace">Fertig</button></span>';
    p.hidden=false;return;}
  const d=B[place.type];let st;
  if(place.i0<0)st='<small>Zeige auf die Insel.</small>';
  else if(place.err)st='<small class="err">'+place.err+'</small>';
  else if(d.ar){const g=areaGuess(place.type,place.i0);st='<small class="ok">Passt. Arbeitsfläche '+Math.round(g.f*100)+' %</small>';}
  else st='<small class="ok">Passt.</small>';
  if(place.i0>=0&&!place.err&&place.noRoad)st+='<small class="err" style="color:#E2B04A">Kein Weg: halbe Leistung, bis ein Weg an der Tür liegt.</small>';
  p.innerHTML='<img src="'+thumb(place.type)+'" alt=""><span class="t"><b>'+d.n+' setzen</b>'+st+'</span><span class="desk lbl" style="white-space:nowrap;text-transform:none;letter-spacing:0;font-weight:600">Klick baut · <kbd>R</kbd> drehen · <kbd>Shift</kbd> mehrere · <kbd>Esc</kbd> abbrechen</span><span class="touch"><button class="btn small alt" data-act="endplace">Abbrechen</button><button class="btn small alt" data-act="rotate" aria-label="Drehen">↻</button><button class="btn small gold" data-act="doplace"'+(place.err||place.i0<0?' data-block="1"':'')+'>Bauen</button></span>';
  p.hidden=false;const db=p.querySelector('[data-act=doplace]');if(db)db.classList.toggle('off',!!(place.err||place.i0<0));
}

/* ---------- Werte laufend auffrischen ---------- */
const lastVal={};
function refresh(){
  renderTop();renderLeft();fitRes();
  document.querySelectorAll('[data-r]').forEach(el=>{const t=fmt(S.res[el.dataset.r]||0);if(el.textContent!==t)el.textContent=t;});
  document.querySelectorAll('[data-capt]').forEach(el=>{const t='/'+fmt(D.cap);if(el.textContent!==t)el.textContent=t;});
  document.querySelectorAll('[data-chip]').forEach(el=>{const k=el.dataset.chip,v=Math.floor(S.res[k]||0);
    if(lastVal[k]!==undefined&&v>lastVal[k]){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}lastVal[k]=v;
    el.classList.toggle('full',capped(k)&&S.res[k]>=D.cap);});
  document.querySelectorAll('[data-rt]').forEach(el=>{const k=el.dataset.rt,v=((FLOW.p[k]||0)-(FLOW.c[k]||0))*60,t=Math.abs(v)<.05?'±0/min':(v>0?'+':'−')+fmtN(Math.abs(v))+'/min',c='rt '+(v>.05?'up':v<-.05?'down':'');if(el.textContent!==t)el.textContent=t;if(el.className!==c)el.className=c;});
  document.querySelectorAll('[data-cost]').forEach(el=>{let ok=true;try{ok=has(JSON.parse(el.dataset.cost));}catch(e){}if(el.classList.contains('bc')){if(!el.classList.contains('lock'))el.classList.toggle('off',!ok||freeB()<=0);}else el.classList.toggle('off',!ok||el.dataset.block==='1');});
  document.querySelectorAll('[data-need]').forEach(el=>{const[k,a]=el.dataset.need.split(':');el.classList.toggle('no',(S.res[k]||0)<+a);});
  document.querySelectorAll('[data-prog]').forEach(el=>{const b=S.tiles[+el.dataset.prog].b;if(!b)return;const d=B[b.type],r=RECIPES[b.recipe||(d.rec&&d.rec[0])];if(r)el.style.width=(b.run?Math.min(100,b.prog/r.t*100):0)+'%';});
  document.querySelectorAll('[data-fill]').forEach(el=>{el.style.width=Math.min(100,(S.res[el.dataset.fill]||0)/D.cap*100)+'%';});
  document.querySelectorAll('[data-timer]').forEach(el=>{const w=el.dataset.timer;
    if(w==='raid')el.textContent=hofL()<2?'ab Hofstufe 2':S.raid.pending?'jetzt':fmtT(S.raid.next-now());
    if(w==='boat')el.textContent=fmtT(S.boat.until-now());});
  document.querySelectorAll('[data-jobbar]').forEach(el=>{const w=el.dataset.jobbar;let u,tot;if(w==='x'){if(!S.explore)return;u=S.explore.until;tot=REG[S.explore.r].t;}else{const b=S.tiles[+w].b;if(!b||!b.until)return;u=b.until;tot=b.job==='up'?bTime(b.type,b.lvl):bTime(b.type,0);}el.style.width=Math.max(0,Math.min(100,(1-(u-now())/1000/tot)*100))+'%';});
  document.querySelectorAll('[data-jobt]').forEach(el=>{const w=el.dataset.jobt;const u=w==='x'?(S.explore&&S.explore.until):(S.tiles[+w].b&&S.tiles[+w].b.until);if(u)el.textContent=fmtDur((u-now())/1000);});
  document.querySelectorAll('[data-rushc]').forEach(el=>{const w=el.dataset.rushc;const u=w==='x'?(S.explore&&S.explore.until):(S.tiles[+w].b&&S.tiles[+w].b.until);if(u)el.innerHTML=IC('muenzen','i14')+rushCost(u-now());});
  const bn=$('#bldN'),fb=Math.max(0,freeB()),bt=builders(),t=fb+'/'+bt;if(bn.textContent!==t){bn.textContent=t;$('#bldP').innerHTML=Array.from({length:bt},(_,k)=>'<i class="'+(k<fb?'on':'busy')+'"></i>').join('');}
  const pn=$('#popN'),pt=S.pop.n+'/'+D.house;if(pn.textContent!==pt)pn.textContent=pt;const mk=moodKey(),mi=$('#moodI');if(mi.dataset.k!==mk){mi.dataset.k=mk;mi.src=iconURL(mk);}
  document.querySelectorAll('[data-rp]').forEach(el=>{const k=el.dataset.rp,v=FLOW.p[k]||0;el.textContent=v*60>=.05?'+'+fmtN(v*60):el.dataset.z?'0':'';});
  document.querySelectorAll('[data-rc]').forEach(el=>{const k=el.dataset.rc,v=FLOW.c[k]||0;el.textContent=v*60>=.05?'−'+fmtN(v*60):el.dataset.z?'0':'';});
  document.querySelectorAll('[data-net]').forEach(el=>{const k=el.dataset.net,v=((FLOW.p[k]||0)-(FLOW.c[k]||0))*60;el.textContent=Math.abs(v)<.05?'±0':(v>0?'+':'−')+fmtN(Math.abs(v));el.className='net '+(v>.05?'up':v<-.05?'down':'');});
  document.querySelectorAll('[data-live]').forEach(el=>{const w=el.dataset.live;let t='';
    if(w==='pop')t=S.pop.n;else if(w==='house')t=D.house;else if(w==='jobs')t=D.jobs;else if(w==='work')t=Math.min(S.pop.n,D.jobs);else if(w==='mood')t=Math.round(D.h)+' %';else if(w==='tax')t='+'+fmtN(S.pop.n*.025*(.5+D.h/100)*(1+D.tax)*60)+'/min';else if(w==='eff')t=Math.round(D.eff*100)+' %';else if(w==='eat')t='−'+fmtN(S.pop.n)+'/min';
    t=String(t);if(el.textContent!==t)el.textContent=t;});
  document.querySelectorAll('[data-wbar]').forEach(el=>{const w=el.dataset.wbar;el.style.width=(w==='house'?S.pop.n/Math.max(1,D.house):w==='jobs'?(D.jobs?Math.min(1,S.pop.n/D.jobs):1):D.h/100)*100+'%';});
  const rt=hofL()<2?'ruhig':S.raid.pending?'Angriff!':fmtT(S.raid.next-now());if($('#raidT').textContent!==rt)$('#raidT').textContent=rt;$('#raidChip').classList.toggle('alarm',S.raid.pending);
  document.querySelectorAll('#rail [data-t="wehr"],#mnav [data-t="wehr"]').forEach(wb=>{let bd=wb.querySelector('.dot');if(S.raid.pending&&!bd){bd=document.createElement('span');bd.className='dot';wb.appendChild(bd);}else if(!S.raid.pending&&bd)bd.remove();});
  if(!$('#pop').hidden)renderPop(false);
}
function setTab(t){
  if(tabHL(t)>hofL()){toast(IC('schloss','i24')+TABN[t]+' gibt es ab Hofstufe '+tabHL(t));return;}
  if(t===tab&&t!=='insel')return;tab=t;if(tab!=='insel'){sel=-1;if(place)endPlace();}$('#app').classList.remove('bopen');render(true);
}
function render(enter){
  const p=$('#panel');$('#app').classList.toggle('paneled',tab!=='insel');
  if(tab==='insel'){p.hidden=true;renderSheet();renderBuild();}
  else{
    $('#app').classList.remove('iopen');p.hidden=false;
    p.innerHTML=tab==='handel'?panelHandel():tab==='wehr'?panelWehr():tab==='dorf'?panelDorf():tab==='waren'?panelWaren():tab==='chronik'?panelChronik():panelRaub();
    p.classList.toggle('enter',!!enter);if(enter)p.scrollTop=0;
    if(tab==='raub'&&S.run&&!S.run.over)afterRun();
    if(tab==='wehr')requestAnimationFrame(()=>requestAnimationFrame(()=>{const m=$('#meter i');if(m)m.style.left=m.dataset.l;}));
  }
  MINI.on=isDesk()&&tab==='insel';
  renderTop();refresh();
}
function miniStats(k){const d=B[k],a=[];
  if(d.kind==='home'&&d.cap)a.push('<span class="cost">'+IC('leute','i14')+'+'+d.cap+'</span>');
  if(d.jobs)a.push('<span class="cost">'+IC('arbeit','i14')+d.jobs+'</span>');
  if(d.kind==='joy')a.push('<span class="cost">'+IC('froh','i14')+'+'+d.joy+'</span>');
  if(d.out)a.push('<span class="cost">'+IC(d.out,'i14')+'</span>');
  if(d.rec)a.push(d.rec.map(r=>'<span class="cost">'+IC(r,'i14')+'</span>').join(''));
  return a.length?'<span class="costs">'+a.join('')+'</span>':'';}
const PT=(ic,t,s,extra)=>'<div class="ptitle">'+ic+'<div style="flex:1;min-width:0"><h1>'+t+'</h1>'+(s?'<p>'+s+'</p>':'')+'</div>'+(extra||'')+'</div>';

/* ---------- Lager-Popover ---------- */
function renderPop(build){
  const p=$('#pop');const groups=[['Rohstoffe','roh'],['Waren','ware'],['Ausrüstung','ausr'],['Beute','beute']];
  const list=groups.map(([gn,gk])=>[gn,Object.keys(RES).filter(k=>RES[k].k===gk&&KNOWN.has(k))]).filter(g=>g[1].length),sig=list.map(g=>g[1].join(',')).join('|');
  if(build||p.dataset.sig!==sig){p.dataset.sig=sig;p.innerHTML='<div class="sech"><span class="lbl">Lager · je '+fmt(D.cap)+'</span><button class="btn small alt" data-act="tab" data-t="waren">Alle Waren</button></div>'+list.map(([gn,ks])=>'<h5>'+gn+'</h5>'+ks.map(k=>'<button class="prow" data-act="info" data-info="r:'+k+'">'+IC(k,'i20')+'<span class="sn2">'+RES[k].n+'</span><b data-r="'+k+'"></b><span data-net="'+k+'"></span>'+(capped(k)?'<span class="bar thin" style="grid-column:2 / 5;height:3px"><i data-fill="'+k+'"></i></span>':'')+'</button>').join('')).join('');}
}
function showPop(){
  const p=$('#pop');if(!p.hidden){p.hidden=true;return;}renderPop(true);p.hidden=false;refresh();
  const r=$('#moreB').getBoundingClientRect(),w=p.offsetWidth;p.style.left=Math.max(8,Math.min(window.innerWidth-w-8,r.right-w))+'px';p.style.top=(r.bottom+8)+'px';
}
document.addEventListener('pointerdown',e=>{const p=$('#pop');if(!p.hidden&&!p.contains(e.target)&&!e.target.closest('#moreB'))p.hidden=true;});

/* ---------- Tafeln ---------- */
function panelHandel(){
  if(now()>S.boat.until)rollBoat();fillOrders();
  let h=PT(IC('waage','i48'),'Hafen','Händler legen an. Verkaufen, kaufen und Aufträge erfüllen.');
  h+='<div class="cols"><div class="box"><div class="trader">'+POR('haendler',64)+'<div class="bubble">Heute zahle ich doppelt für '+IC(S.boat.k,'i24')+' <b>'+RES[S.boat.k].n+'</b>.<br>'+IC('uhr','i14')+' <span data-timer="boat"></span></div></div>';
  h+='<h3>'+IC('truhe','i16')+'Aufträge</h3><div style="display:flex;flex-direction:column;gap:8px">'+S.orders.map((o,j)=>'<div class="order">'+POR(o.who,40)+'<div class="flowi"><span class="n">'+o.a+'×'+IC(o.k,'i28')+'</span><span class="arrow"></span><span class="n">'+IC('muenzen','i24')+o.rew+'</span></div><button class="btn small gold"'+btnCost({[o.k]:o.a})+' data-act="order" data-j="'+j+'">Liefern</button></div>').join('')+'</div>';
  const buy=['holz','stein','lehm','weizen','fisch','bretter','kohle','proviant','eisen'].filter(k=>KNOWN.has(k));
  h+='<h3>'+IC('waage','i16')+'Kaufen, 5 Stück</h3><div class="tiles">'+buy.map(k=>{const c=RES[k].p*15;return '<div class="rtile">'+IC(k,'i36')+'<button class="btn small alt"'+btnCost({muenzen:c})+' data-act="buy" data-k="'+k+'">'+IC('muenzen','i14')+c+'</button></div>';}).join('')+'</div></div>';
  const ks=Object.keys(RES).filter(k=>k!=='muenzen'&&S.res[k]>=1);
  h+='<div class="box"><h3>'+IC('muenzen','i16')+'Verkaufen</h3>'+(ks.length?'<div class="tiles">'+ks.map(k=>'<div class="rtile"><span class="'+(k===S.boat.k?'hot':'')+'">'+IC(k,'i36')+'</span><span class="amt" data-r="'+k+'"></span><span class="cost">'+IC('muenzen','i14')+price(k)+'</span><div class="row2"><button class="btn small alt"'+btnCost({[k]:10})+' data-act="sell" data-k="'+k+'" data-n="10">10</button><button class="btn small" data-act="sell" data-k="'+k+'" data-n="all">Alle</button></div></div>').join('')+'</div>':'<p class="note">Noch nichts zu verkaufen.</p>')+'</div></div>';
  return h;
}
function panelDorf(){
  let h=PT(IC('leute','i48'),'Dorf','Einwohner wohnen, arbeiten, essen und zahlen Steuern. Gute Laune macht alles schneller.');
  h+='<div class="cols"><div class="town"><div class="big">'+IC('leute','i48')+'<div><div class="bn"><span data-live="pop"></span><small> / <span data-live="house"></span></small></div><div class="note" style="margin:0">Einwohner / Wohnplätze</div></div>'+IB('p:pop')+'</div>'+
    '<div class="trow"><img class="ico i24" src="'+thumb('huette')+'" alt=""><span>Wohnraum</span><div class="bar"><i data-wbar="house"></i></div></div>'+
    '<div class="trow">'+IC('arbeit','i24')+'<span>Arbeit <b data-live="work"></b>/<b data-live="jobs"></b></span><div class="bar gold"><i data-wbar="jobs"></i></div></div>'+
    '<div class="trow">'+IC(moodKey(),'i24')+'<span>Laune <b data-live="mood"></b></span><div class="bar mood"><i data-wbar="mood"></i></div></div>'+
    '<div class="kpis"><div>'+IC('arbeit','i24')+'<b data-live="eff"></b><small>Tempo</small></div><div>'+IC('muenzen','i24')+'<b data-live="tax"></b><small>Steuern</small></div><div>'+IC('fisch','i24')+'<b data-live="eat"></b><small>Nahrung</small></div></div></div>';
  h+='<div class="box"><h3>'+IC('froh','i16')+'Was die Laune macht</h3><div class="moodparts">'+D.parts.map(([k,v,n])=>'<div class="'+(v>0?'up':v<0?'down':'')+'">'+(B[k]?'<img class="ico i24" src="'+thumb(k)+'" alt="">':IC(k,'i24'))+'<span>'+esc(n)+'</span><b>'+(v>0?'+':'')+v+'</b></div>').join('')+'</div>';
  if(S.pop.n>=D.house)h+='<p class="note">'+IC('huette','i16')+' Alle Plätze belegt. Baue Hütten oder Langhäuser, dann ziehen neue Leute zu.</p>';
  else if(D.h<45)h+='<p class="note">'+IC('sauer','i16')+' Erst ab 45 % Laune ziehen Leute zu.</p>';
  h+='</div></div>';
  if(!isDesk())h+='<div class="btns"><button class="btn alt" data-act="tab" data-t="waren">'+IC('lager','i20')+'Waren</button><button class="btn alt" data-act="tab" data-t="handel">'+IC('waage','i20')+'Hafen</button><button class="btn alt" data-act="tab" data-t="chronik">'+IC('rune','i20')+'Chronik</button></div>';
  return h;
}
function panelWaren(){
  let h=PT(IC('lager','i48'),'Waren','Bestand, Herstellung und Verbrauch pro Minute, gemittelt über die letzte halbe Minute.','<span class="tag">'+IC('lager','i16')+'je '+fmt(D.cap)+'</span>');
  const groups=[['Rohstoffe','roh'],['Waren','ware'],['Ausrüstung','ausr'],['Beute','beute']];h+='<div class="cols">';
  for(const[gn,gk]of groups){const ks=Object.keys(RES).filter(k=>RES[k].k===gk&&KNOWN.has(k));if(!ks.length)continue;
    h+='<div class="box"><h3>'+gn+'</h3><div class="stats2">'+ks.map(k=>'<button class="srow" data-act="info" data-info="r:'+k+'">'+IC(k,'i28')+'<div class="sm"><div class="sn"><span>'+RES[k].n+'</span><b data-r="'+k+'"></b></div>'+(capped(k)?'<div class="bar thin"><i data-fill="'+k+'"></i></div>':'')+'</div><div class="fl"><span class="p" data-rp="'+k+'"></span><span class="c" data-rc="'+k+'"></span></div><span data-net="'+k+'"></span></button>').join('')+'</div></div>';}
  return h+'</div>';
}
function panelChronik(){
  const L=hofL();let h=PT(IC('rune','i48'),'Chronik','Die Geschichte eurer Sippe, Kapitel für Kapitel.');
  h+=sagaHTML();
  h+='<div class="cols">';
  for(let k=L;k>=1;k--){const C=CHAPTER[k];h+='<div class="box"><span class="lbl" style="color:var(--gold)">Kapitel '+ROM[k]+'</span><h2 style="margin:4px 0 10px">'+C.n+'</h2><div style="display:flex;gap:12px;align-items:flex-start">'+POR(C.p,56)+'<p class="sub" style="margin:0;font-size:14px;color:#D8DFE0">'+C.t+'</p></div></div>';}
  h+='</div>';
  let bs=0,lv=0;for(const i of BL){bs++;lv+=S.tiles[i].b.lvl;}
  h+='<div class="box" style="margin-top:16px"><h3>'+IC('krone','i16')+'Bisher</h3><div class="gains">'+[['uhr',fmtDur((now()-(S.started||now()))/1000)],['leute',S.pop.n+' Einwohner'],['haus',bs+' Gebäude'],['schiff',S.open.length+' / '+REG.length+' Gebiete'],['schild',(S.raid.n||0)+' Überfälle abgewehrt'],['schwert',S.wins.reduce((a,b)=>a+b,0)+' Raubzüge']].map(r=>'<div>'+IC(r[0],'i24')+r[1]+'</div>').join('')+'</div></div>';
  return h;
}
function producibleSet(){const set=new Set();for(const i of BL){const d=B[S.tiles[i].b.type];if(d.out)set.add(d.out);if(d.rec)d.rec.forEach(r=>set.add(r));}return set;}
/* Info-Karten */
function showInfo(spec){
  const[t,k]=spec.split(':');let h='';
  const close='<button class="x" data-act="closemodal" aria-label="Schließen"></button>';
  const row=(ic,label,val)=>'<div class="irow">'+ic+'<span>'+label+'</span><b>'+val+'</b></div>';
  if(t==='b'){const d=B[k];
    h+='<div class="head"><img class="ith" src="'+thumb(k)+'" alt=""><div class="t"><h2>'+d.n+'</h2><p class="sub">'+(DESC[k]||'')+'</p></div>'+close+'</div><div class="igrid">';
    if(Object.keys(d.cost).length)h+=row(IC('hoch','i24'),'Baukosten',costHTML(d.cost));
    h+=row(IC('plus','i24'),'Grundfläche',fpOf(k)+' × '+fpOf(k)+' Felder');
    if(!d.hidden)h+=row(IC('krone','i24'),'Freigabe','ab Hofstufe '+d.hl);
    if(d.kind==='home')h+=row(IC('leute','i24'),'Wohnplätze',d.cap?'+'+d.cap+' je Stufe':BASEHOUSE);
    if(d.jobs)h+=row(IC('arbeit','i24'),'Arbeitsplätze',d.jobs+' (+1 je Stufe)');
    if(d.out)h+=row(IC(d.out,'i24'),'Erzeugt',fmtRate(d.rate)+' je Stufe');
    if(d.ar)h+=row(IC(ADJICON[d.adj.t]||'wiese','i24'),'Arbeitsfläche',TERR[d.adj.t].n+' im Umkreis von '+d.ar+' Feldern, '+(AREANEED[d.adj.t]||8)+' Felder für volle Leistung');
    if(d.rec)h+=d.rec.map(r=>{const R=RECIPES[r];return row(IC(r,'i24'),RES[r].n,'<span class="costs">'+Object.keys(R.in).map(x=>'<span class="cost">'+R.in[x]+'×'+IC(x,'i16')+'</span>').join('')+'<span class="arrow"></span><span class="cost">'+R.out+'×'+IC(r,'i16')+'</span><span class="cost">'+IC('uhr','i14')+R.t+' s</span></span>');}).join('');
    if(d.kind==='joy')h+=row(IC('froh','i24'),'Zufriedenheit','+'+d.joy+' je Stufe'+(d.uses?', braucht Met':''));
    if(d.tax)h+=row(IC('muenzen','i24'),'Steuern','+'+Math.round(d.tax*100)+' % je Stufe');
    if(d.kind==='store')h+=row(IC('lager','i24'),'Lager','+150 je Stufe');
    if(d.hp)h+=row(IC('herz','i24'),'Lebenspunkte Insel','+'+d.hp+' je Stufe');
    if(d.dmg)h+=row(IC('schwert','i24'),'Schaden','+'+d.dmg+' je Stufe');
    if(d.adj&&d.adj.b)h+=row('<img class="ico i24" src="'+thumb(d.adj.b)+'" alt="">','Zulieferer','+'+Math.round(d.adj.v*100)+' % je '+B[d.adj.b].n+' bis 6 Felder entfernt, höchstens +'+Math.round(d.adj.max*100)+' %');
    if(d.need)h+=row(IC(d.need==='coast'?'wasser':'stein','i24'),'Bauplatz',d.need==='coast'?'an der Küste':d.need==='peak'?'am Gipfel':'am Fels');
    if(d.reg)h+=row(IC(REG[REGI[d.reg[0]]].ic,'i24'),'Gebiet','nur '+d.reg.map(g=>REG[REGI[g]].n).join(' oder '));
    if(d.max)h+=row(IC('bauhuette','i24'),'Anzahl','höchstens '+d.max);
    if(!d.hidden)h+=row(IC('uhr','i24'),'Bauzeit',fmtDur(bTime(k,0))+', Ausbau auf Stufe 2: '+fmtDur(bTime(k,1))+', auf Stufe 8: '+fmtDur(bTime(k,7)));
    if(!d.hidden)h+=row(IC('werkzeug','i24'),'Ausbau','nie höher als der Hof. Ab Stufe 5 mit Werkzeug, ab 7 mit Silber, auf 8 mit Runenstein');
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
  openModal(h);refresh();
}
/* ---------- Hof und Geschichte ---------- */
function unlocksOf(L){
  const u=[];
  for(const k in B){const d=B[k];if(d.hl===L&&!d.hidden)u.push(['<img src="'+thumb(k)+'" alt="">',d.n,(d.reg?'nur '+d.reg.map(g=>REG[REGI[g]].n).join(' / ')+'. ':'')+(DESC[k]||'').split('.')[0]]);}
  for(const R of REG)if(R.hl===L)u.push([IC(R.ic,'i36'),R.n+' erkunden',R.finds.map(k=>RES[k].n).join(', ')]);
  for(const t in TABHL)if(TABHL[t]===L&&L>1)u.push([IC({handel:'waage',wehr:'schild',raub:'schiff'}[t]||'haus','i36'),TABN[t],{handel:'Händler, Aufträge, Kauf und Verkauf',wehr:'Abwehr gegen Plünderer',raub:'Raubzüge über das Meer'}[t]||'']);
  if(L===2)u.push([IC('schiff','i36'),'Plünderer','Ab jetzt kommen Überfälle. Türme und Palisaden helfen.']);
  if(L>1)u.push([IC('hoch','i36'),'Gebäude bis Stufe '+L,TIERN(L)+(L%2?'':', neue Bauweise')]);
  if(L>1)u.push([IC('lager','i36'),'Mehr Lagerplatz','+50 je Rohstoff']);
  return u;
}
function showHof(){
  const L=hofL(),hb=S.tiles[S.hof].b,C=CHAPTER[L],g=goalState(),nx=L+1;
  let l='<div class="hofL chap"><span class="lbl" style="color:var(--gold)">Kapitel '+ROM[L]+'</span><h1>'+C.n+'</h1><div class="story">'+POR(C.p,72)+'<p>'+C.t+'</p></div><div style="height:1px;background:var(--line)"></div><span class="lbl">Chronik</span><div class="chl">'+
    CHAPTER.slice(1).map((c,k)=>'<div class="'+(k+1<L?'done':k+1===L?'on':'fut')+'"><i>'+ROM[k+1]+'</i>'+(k+1<=L?c.n:'Noch nicht erzählt')+'</div>').join('')+'</div></div>';
  let r='<div class="hofR"><div class="head"><img src="'+thumb('hof',Math.min(MAXLVL,L))+'" alt="" style="width:96px;height:88px;object-fit:contain"><div class="t"><h2 style="font-size:34px">Häuptlingshof</h2><p class="sub">Jede Stufe schaltet Neues frei. Kein Gebäude steht höher als der Hof.</p></div><button class="x" data-act="closemodal" aria-label="Schließen"></button></div>';
  r+='<div class="lpath">'+Array.from({length:MAXLVL},(_,k)=>{const n=k+1;return '<span class="'+(n<L?'done':n===L?'now':n===nx?'next':'')+'">'+n+'</span>'+(n<MAXLVL?'<em class="'+(n<L?'done':'')+'"></em>':'');}).join('')+'</div>';
  if(L>=MAXLVL)r+='<div class="hgrid"><div><span class="lbl" style="color:var(--gold)">Geschafft</span><p class="sub">Nordhof ist das Herz der Inseln. Weitere Kapitel folgen mit den nächsten Versionen.</p></div></div>';
  else{
    let goal='<div><span class="lbl">Für Hofstufe '+nx+'</span>';
    if(busy(hb))goal+='<div class="flow">'+IC('arbeit','i28')+'<div class="bar gold"><i data-jobbar="'+S.hof+'"></i></div><span class="n" data-jobt="'+S.hof+'"></span></div><button class="btn gold wide" data-act="rush" data-rush="'+S.hof+'">'+IC('muenzen','i16')+'Sofort fertig <span data-rushc="'+S.hof+'"></span></button>';
    else{goal+=Object.keys(g.c).map(k=>'<div class="goal" data-gk2="'+k+'">'+IC(k,'i24')+'<span class="gn">'+RES[k].n+'<span class="gb"><i style="width:'+Math.min(100,(S.res[k]||0)/g.c[k]*100)+'%"></i></span></span><b>'+fmt(Math.min(S.res[k]||0,g.c[k]))+'/'+fmt(g.c[k])+'</b></div>').join('');
      goal+='<div class="note" style="display:flex;align-items:center;gap:6px;margin:0">'+IC('uhr','i20')+'Bauzeit '+fmtDur(HOFT[nx])+', braucht einen freien Baumeister</div>';
      const miss=Object.keys(g.c).filter(k=>(S.res[k]||0)<g.c[k]);
      goal+='<button class="btn '+(g.ready?'gold':'alt')+' wide" data-act="hofup"'+btnCost(g.c)+(g.ready?'':' data-block="1"')+'>'+(g.ready?IC('hoch','i16')+'Auf Stufe '+nx+' ausbauen':miss.length?'Noch '+miss.map(k=>fmt(g.c[k]-(S.res[k]||0))+' '+RES[k].n).join(', '):'Kein Baumeister frei')+'</button>';}
    goal+='</div>';
    r+='<div class="hgrid">'+goal+'<div><span class="lbl" style="color:var(--gold)">Stufe '+nx+' schaltet frei</span>'+unlocksOf(nx).map(u=>'<div class="unl">'+u[0]+'<span><b>'+u[1]+'</b><small>'+u[2]+'</small></span></div>').join('')+'</div>';
    r+='</div></div>';}
  r+='</div>';
  openModal(l+r,'wide');refresh();
  document.querySelectorAll('[data-gk2]').forEach(el=>el.classList.toggle('ok',(S.res[el.dataset.gk2]||0)>=g.c[el.dataset.gk2]));
}
/* Kapitel erzählen, wenn der Hof eine Stufe erreicht */
function showChapter(L){
  if(storyChapter(L))return;
  const C=CHAPTER[L];if(!C)return;S.chap=Math.max(S.chap||0,L);save();
  const u=L>1?unlocksOf(L):[];
  openModal('<span class="k2">Kapitel '+ROM[L]+'</span><h1>'+C.n+'</h1><div style="display:flex;gap:16px;align-items:flex-start">'+POR(C.p,80)+'<p>'+C.t+'</p></div>'+
    (u.length?'<h3>Neu freigeschaltet</h3><div style="display:flex;flex-direction:column;gap:8px">'+u.slice(0,6).map(x=>'<div class="unl">'+x[0]+'<span><b>'+x[1]+'</b><small>'+x[2]+'</small></span></div>').join('')+'</div>':'')+
    '<div class="btns" style="margin-top:18px"><button class="btn gold wide" data-act="closemodal">'+(L===1?'Los geht es':'Weiter')+'</button></div>','chapcard');
  renderTop();renderBuild();
}

/* ---------- Minikarte ---------- */
const MINI={on:true,dirty:true,t:0,box:null};
function drawMini(ts){
  if(ts-MINI.t<120&&!MINI.dirty)return;MINI.t=ts;MINI.dirty=false;
  const c=$('#mcv');if(!c||!OV)return;const r=c.getBoundingClientRect();if(!r.width)return;
  const d=Math.min(2,window.devicePixelRatio||1),w=Math.round(r.width*d),h=Math.round(r.height*d);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  const g=c.getContext('2d'),ow=ovW(),oh=ovH(),m=Math.min(w/ow,h/oh)*1.04,ox=(w-ow*m)/2,oy=(h-oh*m)/2;
  MINI.box={m,ox,oy,d};
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#5D8790';g.fillRect(0,0,w,h);g.drawImage(OV,ox,oy,ow*m,oh*m);
  const toM=(wx,wy)=>[ox+(ow/2+wx*OVS)*m,oy+(ovOY()+wy*OVS)*m];
  for(const i of BL){const[wx,wy]=bPos(i),[x,y]=toM(wx,wy),hof=i===S.hof;g.fillStyle=hof?'#E2B04A':'#F1ECE2';g.fillRect(x-(hof?2.5:1.5)*d,y-(hof?2.5:1.5)*d,(hof?5:3)*d,(hof?5:3)*d);}
  const[x0,y0]=toM((-W/2-view.x)/view.z,(-H/2-view.y)/view.z),[x1,y1]=toM((W/2-view.x)/view.z,(H/2-view.y)/view.z);
  g.strokeStyle='#E2B04A';g.lineWidth=1.5*d;g.strokeRect(x0,y0,x1-x0,y1-y0);
}
$('#mcv').addEventListener('pointerdown',e=>{
  const B0=MINI.box;if(!B0)return;const c=$('#mcv'),r=c.getBoundingClientRect();
  const go=ev=>{const px=(ev.clientX-r.left)*B0.d,py=(ev.clientY-r.top)*B0.d,wx=((px-B0.ox)/B0.m-ovW()/2)/OVS,wy=((py-B0.oy)/B0.m-ovOY())/OVS;view.x=-wx*view.z;view.y=-wy*view.z;glide=null;MINI.dirty=true;};
  go(e);c.setPointerCapture(e.pointerId);const mv=ev=>go(ev),up=()=>{c.removeEventListener('pointermove',mv);c.removeEventListener('pointerup',up);};c.addEventListener('pointermove',mv);c.addEventListener('pointerup',up);
});

function price(k){return storyPrice(RES[k].p*(k===S.boat.k?2:1));}
function chanceQ(){const R=raiders(S.raid.n),P=defPow();return Math.ceil((D.hp+P.hp)/R.dmg)/Math.ceil(R.hp/(D.dmg+P.dmg));}
function panelWehr(){
  const R=raiders(S.raid.n),q=chanceQ(),pos=Math.max(4,Math.min(96,(q-.5)/1.2*100));
  let h=PT(IC('schild','i48'),'Wehr','Plünderer landen an der Küste. Türme schießen, Palisaden halten auf.');
  h+='<div class="cols"><div class="box"><div class="vs"><div class="side"><img class="ico i64" src="'+thumb('hof',hofL())+'" alt="" style="object-fit:contain"><span class="nm">Nordhof</span><div class="stats"><span class="n">'+IC('herz','i16')+Math.round(D.hp)+'</span><span class="n">'+IC('schwert','i16')+Math.round(D.dmg)+'</span></div></div>'+
    '<div class="vsx">vs</div><div class="side">'+POR('raider',64)+'<span class="nm">Welle '+(S.raid.n+1)+'</span><div class="stats"><span class="n">'+IC('herz','i16')+R.hp+'</span><span class="n">'+IC('schwert','i16')+String(R.dmg).replace('.',',')+'</span></div></div></div>';
  h+='<div><div class="meter" id="meter"><i style="left:50%" data-l="'+pos+'%"></i></div><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--mut);margin-top:4px"><span>riskant</span><span>sicher</span></div></div>';
  if(S.raid.pending)h+='<div class="btns"><button class="btn red wide" data-act="defend">'+IC('schild','i24')+'Plünderer abwehren</button></div>';
  else h+='<div class="btns"><span class="tag">'+IC('uhr','i16')+'<b data-timer="raid"></b></span><span class="note" style="margin:0">bis zur nächsten Welle</span></div>';
  h+='</div><div class="box"><h3 style="margin-top:0">'+IC('plus','i16')+'Stärker werden</h3><div class="bgrid">'+['palisade','bogenposten','turm'].map(k=>'<div class="bcard">'+IB('b:'+k)+'<img class="th" src="'+thumb(k)+'" alt=""><span class="nm">'+B[k].n+'</span><span class="costs">'+(B[k].hl>hofL()?'<span class="tag gold">Hofstufe '+B[k].hl+'</span>':(B[k].hp?'<span class="cost">'+IC('herz','i14')+'+'+B[k].hp+'</span>':'')+(B[k].dmg?'<span class="cost">'+IC('schwert','i14')+'+'+B[k].dmg+'</span>':''))+'</span></div>').join('')+'</div>';
  if(S.raid.log.length)h+='<h3>'+IC('uhr','i16')+'Chronik</h3><div class="chron">'+S.raid.log.map(l=>'<div>'+IC(l.win?'schild':'abriss','i16')+new Date(l.t).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+(l.win?' +'+l.coins+IC('muenzen','i14'):'')+'</div>').join('')+'</div>';
  return h+'</div></div>';
}
function panelRaub(){
  if(S.run)return '<div style="max-width:560px;margin:0 auto">'+runHTML()+'</div>';
  const ready=S.crew.map(c=>c.wounded<=now());
  const selIdx=S.crew.map((c,i)=>S.prep.sel[i]&&ready[i]?i:-1).filter(i=>i>=0);
  const need=selIdx.length+S.prep.extra;
  let w=S.res.waffe,r=S.res.ruestung;
  let h=PT(IC('schiff','i48'),'Raubzug','Mit bis zu drei Kriegern übers Meer. Beute einsammeln und rechtzeitig heimfahren.');
  h+='<div class="cols"><div class="box"><h3 style="margin-top:0">'+IC('schwert','i16')+'Mannschaft</h3><div class="crew">'+S.crew.map((c,i)=>{const on=S.prep.sel[i]&&ready[i];let ww=false,rr=false;
    if(on){ww=w>0;rr=r>0;if(ww)w--;if(rr)r--;}const st=warStats({waffe:ww,ruestung:rr});
    return '<div role="button" tabindex="0" class="war'+(on?' sel':' off')+'" data-act="crew" data-i="'+i+'">'+IB('c:'+i)+POR(CREWP[i],56)+'<span class="nm">'+c.n+'</span>'+(ready[i]?'<div class="stats"><span class="n">'+IC('herz','i14')+st.max+'</span><span class="n">'+IC('schwert','i14')+st.atk+'</span></div><div class="gear">'+IC('waffe','i16 '+(ww?'':'no'))+IC('ruestung','i16 '+(rr?'':'no'))+'</div>':'<span class="tag">'+IC('uhr','i14')+'<span data-wound="'+i+'">'+fmtT(c.wounded-now())+'</span></span>')+'</div>';}).join('')+'</div>';
  h+='<div class="btns" style="margin-top:8px"><span class="tag">'+IC('waffe','i16')+fmt(S.res.waffe)+'</span><span class="tag">'+IC('ruestung','i16')+fmt(S.res.ruestung)+'</span><span class="note" style="margin:0">aus der Schmiede, wird verteilt</span></div>';
  h+='<h3>'+IC('proviant','i16')+'Proviant</h3><div class="btns" style="margin-top:0"><div class="sacks">'+Array.from({length:Math.max(need,1)},(_,k)=>IC('proviant','i28 '+(k<S.res.proviant?'':'no'))).join('')+'</div><span class="n">'+need+' / <span data-r="proviant"></span></span></div>';
  h+='<div class="btns"><span class="note" style="margin:0">Extra zum Rasten</span><div class="seg">'+[0,1,2,3].map(n=>'<button data-act="extra" data-n="'+n+'" class="'+(S.prep.extra===n?'on':'')+'">'+IC('feuer','i16')+n+'</button>').join('')+'</div></div></div>';
  h+='<div class="box"><h3 style="margin-top:0">'+IC('schiff','i16')+'Ziel</h3><div style="display:flex;flex-direction:column;gap:10px">'+[1,2,3].map(d=>{const open=d===1||S.wins[d-1]>=(d===2?1:2);
    return '<div class="target'+(open?'':' locked')+'"><img class="scene" src="'+scene(d)+'" alt="">'+(open?'':'<div class="lockover">'+IC('schloss','i48')+'</div>')+'<div class="info">'+IB('d:'+d)+'<div class="t"><div class="nm">'+DIFF[d].n+'</div><div class="costs" style="margin-top:2px"><span class="cost">'+IC('sturm','i16')+DIFF[d].storm+'</span>'+DIFF[d].loot.slice(0,3).map(l=>IC(l[0],'i16')).join('')+(S.wins[d]?'<span class="tag green">'+S.wins[d]+'×</span>':'')+(open?'':'<span class="cost">'+(d===2?'1':'2')+'× '+DIFF[d-1].n+'</span>')+'</div></div><button class="btn gold"'+btnCost({proviant:Math.max(1,need)})+(open&&selIdx.length?'':' data-block="1"')+' data-act="start" data-d="'+d+'">'+IC('schiff','i24')+'Los</button></div></div>';}).join('')+'</div></div></div>';
  return h;
}
function runHTML(){
  const R=S.run,base=DIFF[R.diff];
  if(R.over){
    const g=Object.keys(R.over.got);
    return '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding-top:10px">'+IC(R.over.ok?'schiff':'grab','i64')+'<h2>'+(R.over.ok?'Heimgekehrt!':'Gescheitert')+'</h2><div class="crew" style="width:100%">'+R.crew.map(w=>'<div class="war'+(w.hp>0&&R.over.ok?'':' dead')+'" style="cursor:default">'+POR(CREWP[w.ci],48)+'<span class="nm">'+w.n+'</span></div>').join('')+'</div>'+
      (g.length?'<div class="gains" style="justify-content:center">'+g.map((k,j)=>'<div style="animation-delay:'+(j*.08)+'s">'+IC(k,'i28')+(k==='muenzen'?R.over.got[k]:R.over.got[k]+'×')+'</div>').join('')+'</div>':'<p class="note">Keine Beute.</p>')+
      (R.crew.some(w=>w.hp<=0||!R.over.ok)?'<p class="note">'+IC('uhr','i14')+' Gefallene erholen sich 10 Minuten, ihre Ausrüstung ist weg.</p>':'')+
      '<button class="btn gold wide" data-act="closerun">Weiter</button></div>';
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
  const at=i=>{const c=g.children[i];return 'translate('+(c.offsetLeft+c.offsetWidth/2-20)+'px,'+(c.offsetTop+c.offsetHeight/2-20)+'px)';};
  if(lastTok>=0&&lastTok!==R.pos){tok.style.transition='none';tok.style.transform=at(lastTok);void tok.offsetWidth;tok.style.transition='';}
  tok.style.transform=at(R.pos);lastTok=R.pos;
  R.crew.forEach((w,j)=>{const before=prevHp[w.n];if(before!==undefined&&w.hp<before-.5){const el=$('#w'+j);if(el){el.classList.add('hit');const d=document.createElement('span');d.className='dmg';d.textContent='−'+Math.round(before-w.hp);el.appendChild(d);}}prevHp[w.n]=w.hp;});
  if(fx){showFx(fx);fx=null;}
}
function showFx(f){
  const el=document.createElement('div');el.className='fx';
  el.innerHTML='<div class="ttl" style="color:'+(f.win?'var(--green)':'var(--red2)')+'">'+(f.win?'Sieg!':'Niederlage')+'</div><div class="row"><div class="who enemy">'+POR(ENEMYP[f.kind],64)+ENEMYN[f.kind]+'</div>'+IC('schwert','i28')+
    '<div class="row" style="gap:6px">'+S.run.crew.map(w=>'<div class="who">'+POR(CREWP[w.ci],40)+(f.dmg[w.n]?'<b>−'+Math.round(f.dmg[w.n])+'</b>':'<b style="color:var(--green)">0</b>')+'</div>').join('')+'</div></div>';
  $('#app').appendChild(el);setTimeout(()=>el.remove(),1950);
}
