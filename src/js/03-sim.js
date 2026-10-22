/* ---------- Simulation ---------- */
let LIVE=false;const popAcc={};
/* Flüsse je Rohstoff (pro Sekunde), gleitend gemittelt für die Statistik */
const FLOW={p:{},c:{}};let ACC={p:{},c:{}};
function gain(k,a){const b=S.res[k]||0;add(k,a);const d=Math.max(0,S.res[k]-b);ACC.p[k]=(ACC.p[k]||0)+d;return d;}
function use(k,a){const v=Math.min(a,S.res[k]||0);S.res[k]-=v;ACC.c[k]=(ACC.c[k]||0)+v;return v;}
function tick(dt){
  finishJobs();mood();logistics();
  for(const i of BL){
    const b=S.tiles[i].b;if(busy(b)||b.hurt)continue;const d=B[b.type];
    if(d.kind==='prod'){toBuf(b,prodRate(i)*dt);const got=haul(i,d.out,dt);if(LIVE&&got>0)popAcc[i]=(popAcc[i]||Math.random()*2)+got;continue;}
    if((d.kind==='joy'||d.kind==='trans')&&d.uses){for(const k in d.uses)use(k,d.uses[k]*b.lvl*dt);continue;}
    if(d.kind!=='craft')continue;
    const key=b.recipe||d.rec[0],r=RECIPES[key];let time=dt*craftSpeed(i),guard=0;
    while(time>0&&guard++<500){
      if(!b.run){if(has(r.in)&&bufCap(b)-(b.buf||0)>=r.out){for(const k in r.in)use(k,r.in[k]);b.run=1;}else break;}
      const need=r.t-b.prog;
      if(time>=need){time-=need;b.prog=0;b.run=0;toBuf(b,r.out);}else{b.prog+=time;time=0;}
    }
    {const got=haul(i,key,dt);if(LIVE&&got>0)popAcc[i]=(popAcc[i]||Math.random()*2)+got;}
  }
  people(dt);
  const a=1-Math.exp(-dt/20);
  for(const k in RES){FLOW.p[k]=(FLOW.p[k]||0)*(1-a)+(ACC.p[k]||0)/dt*a;FLOW.c[k]=(FLOW.c[k]||0)*(1-a)+(ACC.c[k]||0)/dt*a;}
  ACC={p:{},c:{}};
}
/* Einwohner essen, tragen Kleidung ab, zahlen Steuern und ziehen zu oder weg */
function people(dt){
  const P=S.pop,n=P.n;
  let need=n/60*dt;const foods=FOOD.filter(k=>S.res[k]>0);
  for(let q=0;q<3&&need>1e-9;q++){const fs=FOOD.filter(k=>S.res[k]>0);if(!fs.length)break;const each=need/fs.length;for(const k of fs)need-=use(k,each);}
  const fed=need<=1e-6;
  if(S.res.kleidung>0)use('kleidung',n/2400*dt);
  gain('muenzen',n*.025*(.5+D.h/100)*(1+D.tax)*dt);
  P.g+=dt;
  if(fed&&n<D.house&&D.h>=45){P.hunger=0;if(P.g>=8){P.n++;P.g=0;if(LIVE)toast(IC('leute','i24')+'Neue Einwohner: '+P.n);}}
  else if(!fed){P.hunger=Math.min(20,P.hunger+dt);if(P.hunger>=20&&n>3){P.n--;P.hunger=0;if(LIVE)toast(IC('sauer','i24')+'Hunger: jemand zieht weg');}P.g=0;}
  else P.g=Math.min(P.g,8);
  if(P.n>D.house)P.n=D.house;
  if(P.n!==n){D.staff=D.jobs?Math.min(1,P.n/D.jobs):1;villagersFit();}
}
function raiders(n){return{hp:Math.round(50*Math.pow(1.3,n)),dmg:Math.round(50*Math.pow(1.22,n))/10};}
function raidOutcome(win){
  const n=S.raid.n,out={win,coins:0,silber:0,lost:{}};
  if(win){out.coins=25*(n+1);out.silber=Math.random()<.35+n*.05?1+Math.floor(n/3):0;S.res.muenzen+=out.coins;S.res.silber+=out.silber;S.raid.n++;}
  else{for(const k in RES)if(capped(k)&&S.res[k]>0){const l=Math.floor(S.res[k]*.15);if(l>0){out.lost[k]=l;S.res[k]-=l;}}}
  S.raid.pending=false;S.raid.next=(S._simT||now())+15*60e3;
  S.raid.log.unshift({t:S._simT||now(),n,win,coins:out.coins,silber:out.silber});S.raid.log=S.raid.log.slice(0,8);
  return out;
}
function autoBattle(){
  const R=raiders(S.raid.n),P=defPow();let ih=D.hp+P.hp,rh=R.hp,g=0;
  while(ih>0&&rh>0&&g++<200){rh-=(D.dmg+P.dmg)*rand(.85,1.15);if(rh<=0)break;ih-=R.dmg*rand(.85,1.15);}
  const o=raidOutcome(rh<=0);if(!o.win)raidHurt();return o;
}
function catchUp(ms){
  const before={...S.res},raids=[];let t=S.t;const end=S.t+Math.min(ms,8*3600e3);
  LIVE=false;REPORT={done:[],reg:[]};
  while(t<end){
    const step=Math.min(5000,end-t);S._simT=t;tick(step/1000);t+=step;
    if(!raids.length&&S.raid.next&&t>=S.raid.next&&!S.run){S._simT=S.raid.next;raids.push(autoBattle());}
  }
  S._simT=0;S.t=now();finishJobs();const done=REPORT.done,regs=REPORT.reg;REPORT=null;
  if(S.raid.next&&S.raid.next<S.t+60e3)S.raid.next=S.t+5*60e3;
  const gain={};for(const k in RES){const d=Math.floor(S.res[k]-before[k]);if(d)gain[k]=d;}
  return{ms,gain,raids,done,regs};
}
function rollBoat(){const ks=Object.keys(RES).filter(k=>capped(k));S.boat={k:pick(ks),until:now()+10*60e3};}
function producible(){
  const set=new Set(['holz']);
  for(const i of BL){const d=B[S.tiles[i].b.type];if(d.out)set.add(d.out);if(d.rec)d.rec.forEach(r=>set.add(r));}
  return [...set].filter(k=>k!=='waffe'&&k!=='ruestung');
}
function newOrder(){
  const k=pick(producible().filter(x=>KNOWN.has(x))),kind=RES[k].k;
  const amt=kind==='roh'?10*Math.floor(rand(3,8)):kind==='ware'?5*Math.floor(rand(1,5)):Math.floor(rand(2,5));
  return{k,a:amt,rew:Math.round(RES[k].p*amt*1.8+10),who:pick(['haendler','dorf','jarl'])};
}
function fillOrders(){S.orders.forEach(o=>{if(!o.who)o.who='dorf';});while(S.orders.length<3)S.orders.push(newOrder());}

