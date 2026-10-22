/* ---------- Jahreszeiten: Kalender und Wirkung ---------- */
/* Die Spielzeit läuft in S.cal.e (Sekunden seit Frühlingsbeginn Jahr 1). Jeder Sim-Takt rückt sie vor, auch beim Nachholen. */
const SEAS=360;                        // Sekunden Spielzeit je Jahreszeit (ein Jahr = 4 × SEAS)
const SEASN=['Frühling','Sommer','Herbst','Winter'],SEASI=['fruehling','sommer','herbst','winter'];
/* Felder: Wachsen bis GROW_END des Jahres, Ernte bis HARV_END (Anteile am Jahr; Herbst = .5 bis .75) */
const GROW_END=.6,HARV_END=.7;
const WFOOD=1.25,HEAT=.012,FEED=.02,HARVCAP=2,PREPJOY=10,COLDJOY=-10;
/* Faktor je Jahreszeit (Frühling, Sommer, Herbst, Winter); im Mittel 1, die Jahressumme bleibt gleich */
const SEASF={steg:[1.1,1.25,1.05,.6],sammler:[1.05,1.15,1.2,.6],jaeger:[.9,.9,1.05,1.15],imkerei:[1.3,1.4,1,.3],schafweide:[1.1,1.15,1.05,.7],kuhweide:[1.1,1.15,1.05,.7]};
const SEAST=['Saat auf den Feldern. Die Bienen schwärmen aus.','Die Felder stehen hoch. Beste Zeit für Fischer und Imker.','Erntezeit. Jetzt Vorräte für den Winter anlegen.','Die Felder ruhen unter Schnee. Die Leute essen mehr und heizen mit Holz.'];
const isField=b=>B[b.type].st.s==='field';
const isPasture=b=>B[b.type].kind==='prod'&&B[b.type].st.s==='pasture';
/* Kalender anlegen: neue Inseln und alte Spielstände beginnen im Frühling Jahr 1. Felder aus alten Spielständen haben Garben vom letzten Jahr. */
function calInit(){
  if(S.cal)return S.cal;
  S.cal={e:0,warn:-1,prep:0,hv:{},hd:-1};if(S.opt.wetter===undefined)S.opt.wetter=true;
  for(const i of BL){const b=S.tiles[i].b;if(isField(b)&&!b.until)b.korn=(b.korn||0)+B[b.type].rate*b.lvl*SEAS*.6;}
  return S.cal;
}
function seasonOf(e){const a=Math.floor(e/SEAS);return{a,s:a%4,y:Math.floor(a/4)+1,f:(e-a*SEAS)/SEAS,yf:(e%(4*SEAS))/(4*SEAS)};}
const calE=()=>S&&S.cal?S.cal.e:0;
const curSeason=()=>Math.floor(calE()/SEAS)%4;
const yearF=()=>(calE()%(4*SEAS))/(4*SEAS);
const winter=()=>curSeason()===3;
function seasonF(b,s){const f=SEASF[b.type];if(!f)return 1;if(s===undefined)s=curSeason();if(s===3&&isPasture(b)&&D.feedOk===false)return .3;return f[s];}
const foodMul=()=>winter()?WFOOD:1;
/* Im Sim-Takt: Kalender vorrücken, Wechsel auslösen, im Winter heizen und Tiere füttern */
function seasonTick(dt){
  const C=calInit(),yf0=yearF(),a0=Math.floor(C.e/SEAS);C.e+=dt;const a1=Math.floor(C.e/SEAS),yf1=yearF();
  for(let a=a0+1;a<=a1;a++)seasonStart(a);
  if(yf0<GROW_END&&yf1>=GROW_END&&a1%4===2)harvestStart();
  if(a1%4===2&&yf1>=HARV_END&&C.hd!==a1)harvestEnd(a1);
  const s=a1%4;
  /* Mitte Herbst: noch einmal mahnen, wenn der Vorrat nicht reicht */
  if(s===2&&C.e-a1*SEAS>=SEAS*.6&&C.warn!==a1){C.warn=a1;const w=winterNeed(),st=foodStock();if(LIVE&&(st<w.food||S.res.holz<w.holz))toast(IC('winter','i24')+'Winter naht: '+fmt(Math.max(0,w.food-st))+' Nahrung, '+fmt(Math.max(0,w.holz-S.res.holz))+' Holz fehlen noch');}
  if(s===3){
    const h=S.pop.n*HEAT*dt,got=use('holz',h);D.cold=got<h*.98;
    let need=0;for(const i of BL){const b=S.tiles[i].b;if(isPasture(b)&&!busy(b))need+=FEED*b.lvl*dt;}
    if(need>0){const g=use('weizen',need);D.feedOk=g>=need*.98;}else D.feedOk=true;
  } else {D.cold=false;D.feedOk=true;}
}
function seasonStart(a){
  const C=S.cal,s=a%4,y=Math.floor(a/4)+1;
  if(s===2){C.hv={};const w=winterNeed();if(LIVE)toast(IC('winter','i24')+'Winter naht: '+fmt(w.food)+' Nahrung, '+fmt(w.holz)+' Holz nötig');}
  else if(s===3){const w=winterNeed();C.prep=foodStock()>=w.food&&S.res.holz>=w.holz?1:0;C.wn=w;
    if(C.hd!==a-1)harvestEnd(a-1);
    if(LIVE)toast(IC('winter','i24')+(C.prep?'Winter, Jahr '+y+'. Gut vorbereitet: Zufriedenheit +'+PREPJOY:'Winter, Jahr '+y+'. Die Vorräte sind knapp'));}
  else if(s===0){if(LIVE)toast(IC('fruehling','i24')+'Frühling, Jahr '+y+(C.prep?'. Der Winter ist gut überstanden':''));C.prep=0;C.wn=null;}
  else if(LIVE)toast(IC('sommer','i24')+'Sommer, Jahr '+y);
  if(LIVE)derive();
}
function harvestStart(){if(!LIVE)return;let n=0;for(const i of BL){const b=S.tiles[i].b;if(isField(b)&&b.ripe>0){sparks(i);n++;}}if(n)toast(IC('weizen','i24')+'Erntezeit! Die Felder werden eingebracht');}
function harvestEnd(a){const C=S.cal;C.hd=a;const ks=Object.keys(C.hv).filter(k=>C.hv[k]>=1);
  if(LIVE&&ks.length)toast(IC(ks[0],'i24')+'Ernte eingebracht: '+ks.map(k=>'+'+fmt(C.hv[k])+' '+RES[k].n).join(', '));C.hv={};}
/* Feld im Sim-Takt: im Frühjahr und Sommer reift der Jahresertrag (b.ripe), im Herbst wird er geballt eingefahren.
   Die Ernte darf das Lager bis zum Doppelten füllen; was darüber liegt, bleibt als Garben (b.korn) und kommt über die Träger nach. */
function fieldTick(i,b,d,dt){
  const yf=yearF(),k=d.out;
  if(yf<GROW_END)b.ripe=(b.ripe||0)+prodRate(i)*dt/GROW_END;
  else if(b.ripe>0){
    const m=yf<HARV_END?b.ripe*Math.min(1,dt/Math.max(1,(HARV_END-yf)*4*SEAS)):b.ripe;b.ripe-=m;if(b.ripe<1e-6)b.ripe=0;
    const o=S.res[k]||0,room=Math.max(0,D.cap*HARVCAP-o),put=Math.min(m,room);S.res[k]=o+put;ACC.p[k]=(ACC.p[k]||0)+put;b.korn=(b.korn||0)+m-put;
    const C=S.cal;C.hv[k]=(C.hv[k]||0)+put;if(LIVE&&put>0)popAcc[i]=(popAcc[i]||Math.random()*2)+put;}
  if(b.korn>D.cap)b.korn=D.cap;if(b.korn>0){b.korn-=toBuf(b,Math.min(b.korn,4*dt));if(b.korn<1e-6)b.korn=0;}
  const got=haul(i,k,dt);if(LIVE&&got>0)popAcc[i]=(popAcc[i]||Math.random()*2)+got;
}
/* Zufriedenheit: gut vorbereiteter Winter oder Kälte ohne Holz */
function seasonMood(parts){
  if(!winter())return;
  if(S.cal&&S.cal.prep)parts.push(['herz',PREPJOY,'Gut vorbereiteter Winter']);
  if(D.cold)parts.push(['winter',COLDJOY,'Kalt: kein Holz zum Heizen']);
}
const foodStock=()=>FOOD.reduce((s,k)=>s+(S.res[k]||0),0);
/* Was der nächste Winter braucht: Essen und Heizholz, abzüglich dessen, was im Winter noch hereinkommt. Gedeckelt, damit es ins Lager passt. */
function winterNeed(){
  const n=S.pop.n,eat=n/60*WFOOD*SEAS,heat=n*HEAT*SEAS;let fp=0,wp=0;const prod=new Set();
  for(const i of BL){const b=S.tiles[i].b;if(b.job==='build'&&busy(b))continue;const d=B[b.type];
    if(d.kind==='prod'){const r=prodRate(i)/Math.max(.01,seasonF(b))*seasonF(b,3);if(RES[d.out].food){fp+=r;prod.add(d.out);}if(d.out==='holz')wp+=r;}
    else if(d.kind==='craft'){const k=b.recipe||d.rec[0];if(RES[k].food){prod.add(k);fp+=(FLOW.p[k]||0)*.5/Math.max(1,countType(b.type));}}}
  const types=Math.max(1,prod.size),r5=v=>Math.ceil(v/5)*5;
  const food=Math.min(D.cap*types*.8,Math.max(eat*.25,eat-fp*SEAS*.8)),holz=Math.min(D.cap*.8,Math.max(heat*.4,heat-wp*SEAS*.4));
  return{food:r5(food),holz:r5(holz),eat,heat};
}
/* Hinweis im Feld-Inspektor */
function fieldNote(i){
  const b=S.tiles[i].b;if(!isField(b))return '';const k=B[b.type].out,yf=yearF(),r=b.ripe||0;
  const t=yf<GROW_END?'Reift: '+fmt(r)+' '+RES[k].n+' stehen auf dem Feld, Ernte im Herbst.':yf<HARV_END?'Ernte läuft: noch '+fmt(r)+' auf dem Feld.':'Abgeerntet. Im Frühling wird neu gesät.';
  return '<p class="note">'+IC('herbst','i16')+' '+t+(b.korn>=1?' '+fmt(b.korn)+' Garben warten auf die Träger.':'')+'</p>';
}
/* Entwicklermenü: an den Anfang der nächsten Jahreszeit springen */
function seasonSkip(){const C=calInit();let left=(Math.floor(C.e/SEAS)+1)*SEAS-C.e+.01;
  while(left>0){const st=Math.min(5,left);left-=st;LIVE=left<=0;try{tick(st);}finally{LIVE=false;}}}
