/* ---------- Aktionen ---------- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el||el.classList.contains('off')||el.disabled)return;
  const a=el.dataset.act;
  const A={
    tab(){const t=el.dataset.t;if(t===tab&&t!=='insel')return;tab=t;if(tab!=='insel')sel=-1;render(true);},
    chip(){showInfo('r:'+el.dataset.k);},
    info(){showInfo(el.dataset.info);},
    close(){sel=-1;renderSheet();},
    zoom(){zoomTo(view.z*+el.dataset.z);},
    build(){const k=el.dataset.k,d=B[k];if(!has(d.cost)||!canPlace(k,sel)||!reqOK(k)||freeB()<=0)return;pay(d.cost);const T=S.tiles[sel];if(T.t==='forest')T.t='grass';T.b={type:k,lvl:1,prog:0,run:0,until:now()+bTime(k,0)*1000,job:'build'};if(d.rec)T.b.recipe=d.rec[0];anim[sel]=T0;dust(sel);derive();renderSheet();},
    upgrade(){const b=S.tiles[sel].b,c=upCost(b);if(!has(c)||b.lvl>=MAXLVL||B[b.type].hidden||busy(b)||freeB()<=0)return;pay(c);b.until=now()+bTime(b.type,b.lvl)*1000;b.job='up';dust(sel);derive();renderSheet();},
    explore(){const r=+el.dataset.reg,R=REG[r];if(S.explore||!has(R.cost)||freeB()<=0||S.pop.n<R.req)return;pay(R.cost);S.explore={r,until:now()+R.t*1000};gkV='';toast(IC('schiff','i24')+R.n+': Expedition aufgebrochen');renderSheet();},
    rush(){const w=el.dataset.rush;const u=w==='x'?(S.explore&&S.explore.until):(S.tiles[+w].b&&S.tiles[+w].b.until);if(!u)return;const c=rushCost(u-now());if(S.res.muenzen<c){toast(IC('muenzen','i24')+'Zu wenig Münzen');return;}S.res.muenzen-=c;
      if(w==='x')S.explore.until=now();else S.tiles[+w].b.until=now();LIVE=true;finishJobs();LIVE=false;gkV='';renderSheet();},
    builders(){toast(IC('arbeit','i24')+'Baumeister: '+freeB()+' frei von '+builders());},
    demolish(){if(B[S.tiles[sel].b.type].hidden)return;if(!demolishArm){demolishArm=true;renderSheet();return;}const b=S.tiles[sel].b,d=B[b.type];for(const k in d.cost)S.res[k]+=Math.floor(d.cost[k]/2);if(b.run&&b.recipe){const r=RECIPES[b.recipe];for(const k in r.in)S.res[k]+=r.in[k];}dust(sel);S.tiles[sel].b=null;demolishArm=false;derive();renderSheet();},
    recipe(){const b=S.tiles[sel].b;if(b.run){const r=RECIPES[b.recipe||B[b.type].rec[0]];for(const k in r.in)S.res[k]+=r.in[k];}b.recipe=el.dataset.k;b.run=0;b.prog=0;renderSheet();},
    sell(){const k=el.dataset.k,n=el.dataset.n==='all'?Math.floor(S.res[k]):Math.min(10,Math.floor(S.res[k]));if(n<=0)return;S.res[k]-=n;const c=n*price(k);S.res.muenzen+=c;toast(IC(k,'i24')+'−'+n+' '+IC('muenzen','i24')+'+'+c);render();},
    buy(){const k=el.dataset.k,c=RES[k].p*15;if(S.res.muenzen<c)return;S.res.muenzen-=c;add(k,5);toast(IC(k,'i24')+'+5');render();},
    order(){const j=+el.dataset.j,o=S.orders[j];if(!o||S.res[o.k]<o.a)return;S.res[o.k]-=o.a;S.res.muenzen+=o.rew;S.orders.splice(j,1);fillOrders();toast(IC('truhe','i24')+'Auftrag erledigt '+IC('muenzen','i24')+'+'+o.rew);render();},
    defend(){openBattle();},
    fire(){if(battle&&battle.fire&&!battle.done){battle.fire=0;battle.boost=battle.t+6;toast(IC('feuer','i24')+'Brandpfeile!');}},
    closebattle(){closeBattle();},
    closemodal(){$('#modal').hidden=true;},
    mpage(){showMenu(el.dataset.p);},
    side(){const sd=$('#side');if(window.innerWidth>=900)return;sd.classList.toggle('open');$('#scrim').classList.toggle('on',sd.classList.contains('open'));if(sd.classList.contains('open')){renderSide();const t=el.dataset.s&&$('#'+el.dataset.s);if(t)t.parentElement.scrollIntoView({block:'start'});}},
    goto(){const i=+el.dataset.i;if(tab!=='insel'){tab='insel';render();}$('#side').classList.remove('open');$('#scrim').classList.remove('on');selectTile(i);},
    setspeed(){const k=+el.dataset.k;setSpeed(k);updTempo();save();},
    pause(){setSpeed(CLK.k?0:(S.opt.lastSpeed||1));updTempo();save();},
    speed(){const k=CLK.k||S.opt.lastSpeed||1,n=SPEEDS[(SPEEDS.indexOf(k)+1)%SPEEDS.length];setSpeed(n);updTempo();save();toast(IC('uhr','i24')+'Tempo '+n+'×');},
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
      S=fresh();setSpeed(1);vill.length=0;for(const k in TREES)delete TREES[k];RCENT=regionCenters();derive();fillOrders();rollBoat();save();sel=-1;fitted=false;resize();$('#modal').hidden=true;tab='insel';render(true);}
  };
  if(A[a]){A[a]();save();}
});

document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button][data-act]')){e.preventDefault();e.target.click();}});
/* ---------- Start ---------- */
function boot(){
  document.querySelectorAll('img[data-icon]').forEach(im=>{im.src=iconURL(im.dataset.icon);});
  S=load();let rep=null;
  if(!S)S=fresh();
  else{restoreClock();derive();const gap=now()-S.t;if(gap>60e3)rep=catchUp(gap);}
  derive();fillOrders();if(!S.boat.until)rollBoat();RCENT=regionCenters();
  applyOpt();
  resize();updNight();render();save();
  if(rep&&(Object.keys(rep.gain).length||rep.raids.length||rep.done.length||rep.regs.length))showReport(rep);
  requestAnimationFrame(loop);
  setInterval(()=>{
    const t=now(),dt=(t-S.t)/1000;
    if(dt>60){const r=catchUp(t-S.t);if(Object.keys(r.gain).length||r.raids.length||r.done.length||r.regs.length)showReport(r);}
    else{LIVE=true;tick(dt);LIVE=false;S.t=t;}
    for(const i in popAcc){const T=S.tiles[i];if(!T.b||!B[T.b.type].out){delete popAcc[i];continue;}if(popAcc[i]>=3){const n=Math.floor(popAcc[i]);popAt(+i,B[T.b.type].out,n);popAcc[i]-=n;}}
    if(!S.raid.pending&&t>=S.raid.next&&!S.run){S.raid.pending=true;S.raid.since=t;toast(IC('schiff','i24')+'Plünderer in Sicht!');if(tab==='wehr')render();}
    if(S.raid.pending&&!battle&&t-S.raid.since>120e3){if(document.visibilityState==='visible'&&$('#modal').hidden)openBattle();else{autoBattle();if(tab==='wehr')render();}}
    if(tab==='handel'&&t>S.boat.until)render();
    document.querySelectorAll('[data-wound]').forEach(el=>{const c=S.crew[+el.dataset.wound];if(c.wounded<=t)render();else el.textContent=fmtT(c.wounded-t);});
    refresh();
  },1000);
  setInterval(save,5000);
  setInterval(updNight,60e3);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
  window.addEventListener('pagehide',save);
  {const ro=new ResizeObserver(()=>resize());ro.observe($('#stage'));ro.observe($('#hud'));}
}
boot();
