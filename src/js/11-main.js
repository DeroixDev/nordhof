/* ---------- Aktionen ---------- */
/* Bauen: zahlen, Fläche belegen, Baustelle starten */
function tryPlace(keep){
  if(!place||roadMode()||place.i0<0)return;
  if(place.err){toast(IC('schloss','i24')+place.err);return;}
  const k=place.type,i0=place.i0,d=B[k];if(!has(d.cost)||freeB()<=0||placeErr(k,i0))return;
  pay(d.cost);const b={type:k,lvl:1,prog:0,run:0,until:now()+bTime(k,0)*1000,job:'build',rot:place.rot};if(d.rec)b.recipe=d.rec[0];
  placeB(i0,b);groundDirty([...cellsOf(i0,fpOf(k)),...ringTiles(i0,fpOf(k))]);anim[i0]=UT;derive();dust(i0);save();
  if(keep&&has(d.cost)&&freeB()>0){place.i0=-1;if(mouse.in)placeAt(mouse.x,mouse.y);renderBuild();refresh();return;}
  endPlace();selectTile(i0);refresh();
}
function doUpgrade(){
  const b=S.tiles[sel]&&S.tiles[sel].b;if(!b||b.type==='hof')return;const c=upCost(b);
  if(busy(b)||b.lvl>=maxLvl(b)){if(b.lvl>=maxLvl(b))toast(IC('krone','i24')+'Erst den Hof ausbauen');return;}
  if(!has(c)){toast(IC('lager','i24')+'Zu wenig Rohstoffe');return;}if(freeB()<=0){toast(IC('arbeit','i24')+'Kein Baumeister frei');return;}
  pay(c);b.until=now()+bTime(b.type,b.lvl)*1000;b.job='up';dust(sel);derive();renderSheet();
}
function doHofUp(){
  const b=S.tiles[S.hof].b,g=goalState();if(!g.ready){showHof();return;}
  pay(g.c);b.until=now()+bTime('hof',b.lvl)*1000;b.job='up';dust(S.hof);derive();closeModal();renderSheet();refresh();
  toast('<img class="ico i24" src="'+thumb('hof',b.lvl+1)+'" alt="">Hofstufe '+(b.lvl+1)+' wird gebaut');
}
function doDemolish(){
  const i=sel,b=S.tiles[i]&&S.tiles[i].b;if(!b||B[b.type].hidden)return;
  if(!demolishArm){demolishArm=true;inspTab='ausbau';renderSheet();toast(IC('abriss','i24')+'Nochmal bestätigen zum Abreißen');return;}
  const d=B[b.type];for(const k in d.cost)S.res[k]+=Math.floor(d.cost[k]/2);if(b.run&&b.recipe){const r=RECIPES[b.recipe];for(const k in r.in)S.res[k]+=r.in[k];}
  dust(i);const cells=[...cellsOf(i,fpOf(b.type)),...ringTiles(i,fpOf(b.type))];removeB(i);groundDirty(cells);demolishArm=false;sel=-1;derive();renderSheet();save();
}
/* Drehen kostet nichts: die Tür zeigt danach auf die nächste Seite */
function doRotate(){
  const i=sel,b=S.tiles[i]&&S.tiles[i].b;if(!b)return;const n=fpOf(b.type);b.rot=(rotOf(b)+1)%4;
  groundDirty(ringTiles(i,n));derive();renderSheet();save();
}
function centerHof(){const[wx,wy]=bPos(S.hof);view.z=isDesk()?1:.8;const v=visBox();view.x=(v.l+v.r)/2-W/2-wx*view.z;view.y=(v.t+v.b)/2-H/2-wy*view.z;glide=null;}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el||el.disabled)return;
  const a=el.dataset.act;if(el.classList.contains('off')&&a!=='place')return;
  const A={
    tab(){setTab(el.dataset.t);},
    chip(){showInfo('r:'+el.dataset.k);},
    info(){showInfo(el.dataset.info);},
    close(){selectTile(-1);},
    itab(){inspTab=el.dataset.k;demolishArm=false;renderSheet();},
    left(){if(!isDesk()){setTab('insel');return;}$('#app').classList.toggle('lopen');renderLeft();sizeBB();},
    pop(){showPop();},
    hof(){showHof();},
    hofup(){doHofUp();},
    bcat(){buildCat=el.dataset.g;$('#build').classList.remove('closed');renderBuild();},
    buildtoggle(){toggleBuild();},
    road(){const k=+el.dataset.k;if(el.classList.contains('lock'))return;if(roadMode()&&place.road===k){endPlace();return;}startRoad(k);},
    rotate(){if(place&&!roadMode()){place.rot=(place.rot+1)%4;place.manual=true;renderPlacebar();}else doRotate();},
    delroad(){if(sel<0)return;const e=buildRoad([sel],0);if(e)toast(IC('schloss','i24')+e);renderSheet();},
    place(){const k=el.dataset.k;if(el.classList.contains('lock'))return;if(place&&place.type===k){endPlace();return;}startPlace(k);},
    endplace(){endPlace();},
    roadcommit(){roadCommit();},
    doplace(){tryPlace(false);},
    upgrade(){doUpgrade();},
    explore(){const r=+el.dataset.reg,R=REG[r];if(S.explore||!has(R.cost)||freeB()<=0||R.hl>hofL())return;pay(R.cost);S.explore={r,until:now()+R.t*1000};groundDirty();toast(IC('schiff','i24')+R.n+': Expedition aufgebrochen');renderSheet();},
    rush(){const w=el.dataset.rush;const u=w==='x'?(S.explore&&S.explore.until):(S.tiles[+w].b&&S.tiles[+w].b.until);if(!u)return;const c=rushCost(u-now());if(S.res.muenzen<c){toast(IC('muenzen','i24')+'Zu wenig Münzen');return;}S.res.muenzen-=c;
      if(w==='x')S.explore.until=now();else S.tiles[+w].b.until=now();LIVE=true;finishJobs();LIVE=false;renderSheet();if(!$('#modal').hidden&&$('#modalCard').classList.contains('wide'))showHof();},
    demolish(){doDemolish();},
    recipe(){const b=S.tiles[sel].b;if(b.run){const r=RECIPES[b.recipe||B[b.type].rec[0]];for(const k in r.in)S.res[k]+=r.in[k];}b.recipe=el.dataset.k;b.run=0;b.prog=0;renderSheet();},
    sell(){const k=el.dataset.k,n=el.dataset.n==='all'?Math.floor(S.res[k]):Math.min(10,Math.floor(S.res[k]));if(n<=0)return;S.res[k]-=n;const c=n*price(k);S.res.muenzen+=c;toast(IC(k,'i24')+'−'+n+' '+IC('muenzen','i24')+'+'+c);render();},
    buy(){const k=el.dataset.k,c=RES[k].p*15;if(S.res.muenzen<c)return;S.res.muenzen-=c;add(k,5);toast(IC(k,'i24')+'+5');render();},
    order(){const j=+el.dataset.j,o=S.orders[j];if(!o||S.res[o.k]<o.a)return;S.res[o.k]-=o.a;S.res.muenzen+=o.rew;S.orders.splice(j,1);fillOrders();toast(IC('truhe','i24')+'Auftrag erledigt '+IC('muenzen','i24')+'+'+o.rew);render();},
    defend(){openBattle();},
    fire(){if(battle&&battle.fire&&!battle.done){battle.fire=0;battle.boost=battle.t+6;toast(IC('feuer','i24')+'Brandpfeile!');}},
    closebattle(){closeBattle();},
    closemodal(){closeModal();},
    mpage(){showMenu(el.dataset.p);},
    goto(){const i=+el.dataset.i;if(tab!=='insel')setTab('insel');selectTile(i);const[wx,wy]=posOf(i);glideTo(wx,wy);},
    setspeed(){const k=+el.dataset.k;setSpeed(k);updTempo();save();},
    pause(){setSpeed(CLK.k?0:(S.opt.lastSpeed||1));updTempo();save();},
    speed(){const k=CLK.k,ord=[0,1,2,4,8],n=ord[(ord.indexOf(k)+1)%ord.length];setSpeed(n);updTempo();save();toast(IC('uhr','i24')+(n?'Tempo '+n+'×':'Angehalten'));},
    opt(){const k=el.dataset.k;S.opt[k]=!S.opt[k];applyOpt();if(k==='eco'){resize();}save();showMenu(mPage);},
    dn(){S.opt.dn=el.dataset.v;applyOpt();save();showMenu(mPage);},
    dev(){devAct(el.dataset.d);},
    exp(){exportSave(el.dataset.how);},
    imp(){importSave($('#impTxt').value);},
    impfile(){const f=$('#impF');f.onchange=()=>{const file=f.files[0];if(!file)return;file.text().then(importSave);};f.click();},
    crew(){const i=+el.dataset.i;if(S.crew[i].wounded>now())return;S.prep.sel[i]=!S.prep.sel[i];render();},
    extra(){S.prep.extra=+el.dataset.n;render();},
    start(){prevHp={};runVis=null;startRun(+el.dataset.d);},
    move(){move(+el.dataset.i);},
    take(){const R=S.run,c=R.cells[R.pos],j=+el.dataset.j;if(R.bag.length>=bagCap())return;R.bag.push(c.loot.splice(j,1)[0]);render();},
    drop(){const R=S.run,j=+el.dataset.j;R.cells[R.pos].loot.push(R.bag.splice(j,1)[0]);render();},
    safe(){const R=S.run,j=+el.dataset.j;if(R.safe)return;R.safe=R.bag.splice(j,1)[0];render();},
    unsafe(){const R=S.run;if(!R.safe||R.bag.length>=bagCap())return;R.bag.push(R.safe);R.safe=null;render();},
    rest(){const R=S.run;if(R.extra<=0)return;R.extra--;R.step++;R.crew.forEach(w=>{if(w.hp>0)w.hp=Math.min(w.max,w.hp+10);});runLog('Rast am Feuer: alle +10.');toast(IC('herz','i24')+'Rast: alle +10');render();},
    extract(){const R=S.run,c=R.cells[R.pos];if(c.t!=='ship'&&c.t!=='feuer')return;endRun(true);save();render(true);},
    closerun(){S.run=null;render(true);},
    menu(){showMenu('main');},
    reset(){if(!resetArm){resetArm=true;el.textContent='Wirklich? Alles weg';el.classList.remove('alt');el.classList.add('red');return;}
      S=fresh();setSpeed(1);resetWorld();fillOrders();rollBoat();save();closeModal();tab='insel';render(true);setTimeout(()=>showChapter(1),400);}
  };
  if(A[a]){A[a]();save();}
});

/* ---------- Start ---------- */
function boot(){
  document.querySelectorAll('img[data-icon]').forEach(im=>{im.src=iconURL(im.dataset.icon);});
  $('#fabI').src=thumb('bauhuette');
  S=load();let rep=null;
  if(!S){S=fresh();initRoads();}
  else{initRoads();restoreClock();derive();const gap=now()-S.t;if(gap>60e3)rep=catchUp(gap);}
  derive();fillOrders();if(!S.boat.until)rollBoat();RCENT=regionCenters();
  if(window.innerWidth<1200)$('#app').classList.remove('lopen');
  applyOpt();
  resize();centerHof();updNight();render();save();
  if(S.chap<1)setTimeout(()=>showChapter(1),500);
  else if(S.chapPending){const L=S.chapPending;delete S.chapPending;setTimeout(()=>showChapter(L),500);}
  else if(rep&&(Object.keys(rep.gain).length||rep.raids.length||rep.done.length||rep.regs.length))showReport(rep);
  requestAnimationFrame(loop);
  setInterval(()=>{
    const t=now(),dt=(t-S.t)/1000;
    if(dt>60){const r=catchUp(t-S.t);if(S.chapPending){const L=S.chapPending;delete S.chapPending;showChapter(L);}else if(Object.keys(r.gain).length||r.raids.length||r.done.length||r.regs.length)showReport(r);}
    else{LIVE=true;tick(dt);LIVE=false;S.t=t;}
    for(const i in popAcc){const T=S.tiles[i],k=T.b&&outOf(T.b);if(!k){delete popAcc[i];continue;}if(popAcc[i]>=3){const n=Math.floor(popAcc[i]);popAt(+i,k,n);popAcc[i]-=n;}}
    if(S.raid.next&&!S.raid.pending&&t>=S.raid.next&&!S.run){S.raid.pending=true;S.raid.since=t;toast(IC('schiff','i24')+'Plünderer in Sicht!');if(tab==='wehr')render();}
    if(S.raid.pending&&!battle&&t-S.raid.since>120e3){if(document.visibilityState==='visible'&&$('#modal').hidden)openBattle();else{autoBattle();if(tab==='wehr')render();}}
    if(tab==='handel'&&t>S.boat.until)render();
    document.querySelectorAll('[data-wound]').forEach(el=>{const c=S.crew[+el.dataset.wound];if(c.wounded<=t)render();else el.textContent=fmtT(c.wounded-t);});
    if(place&&!roadMode()){const e=placeErr(place.type,place.i0)||(!has(B[place.type].cost)?'Zu wenig Rohstoffe':freeB()<=0?'Kein Baumeister frei':'');if(place.i0>=0&&e!==place.err){place.err=e;renderPlacebar();}}
    refresh();
  },1000);
  setInterval(save,5000);
  setInterval(updNight,60e3);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
  window.addEventListener('pagehide',save);
  {const ro=new ResizeObserver(()=>resize());ro.observe($('#app'));ro.observe($('#top'));}
}
boot();
/* Für Tests und Fehlersuche im Browser */
window.nordhof={get S(){return S;},view,bPos,tilePos,derive,hofUp,placeErr,get W(){return W;},get H(){return H;},get place(){return place;},freeB,connected,roadF,buildRoad,roadLine,startPlace,startRoad,get vill(){return vill;},groundDirty,ev:s=>eval(s)};
