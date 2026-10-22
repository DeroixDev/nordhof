/* ---------- Raubzug ---------- */
function warStats(w){return{max:20+(w.ruestung?15:0),atk:4+(w.waffe?6:0)+storyAtk()};}
function idx5(x,y){return y*5+x;}
function makeMap(diff){
  const cells=[];
  for(let i=0;i<30;i++)cells.push({t:wpick([['truhe',30],['feind',30],['grab',15],['leer',25]]),done:false,loot:[]});
  const ship=idx5(2,5);cells[ship]={t:'ship',done:true,loot:[]};
  let f;do{f=Math.floor(Math.random()*15);}while(f===idx5(2,0)&&diff===3);
  cells[f]={t:'feuer',done:false,loot:[]};
  if(diff===3)cells[idx5(2,0)]={t:'boss',done:false,loot:[]};
  cells[idx5(2,4)].t=pick(['leer','truhe']);
  return{cells,pos:ship,seen:[ship]};
}
function lootItem(diff){const k=wpick(DIFF[diff].loot);return{k,a:k==='muenzen'?Math.round(rand(20,60)*diff):1};}
function bagCap(){return S.run.crew.filter(w=>w.hp>0).length*4;}
function runLog(s){S.run.log.unshift(s);S.run.log=S.run.log.slice(0,3);}
function itemName(it){return it.k==='muenzen'?it.a+' Münzen':RES[it.k].n;}
function giveLoot(items,cell){
  const got=[];
  for(const it of items){if(S.run.bag.length<bagCap()){S.run.bag.push(it);got.push(it);}else{cell.loot.push(it);runLog('Beutel voll, '+itemName(it)+' bleibt liegen.');}}
  if(got.length)toast(got.map(it=>IC(it.k,'i24')).join('')+' gefunden');
}
let fx=null;
function fight(kind){
  const R=S.run,base=DIFF[R.diff];
  const m=kind==='grab'?1.4:kind==='boss'?3:kind==='draugr'?1.2:1;
  const sc=R.step>base.storm?1+.15*(R.step-base.storm):1;
  let hp=base.hp*m*sc,atk=base.atk*(kind==='boss'?1.6:1)*sc,g=0;const dmg={};
  while(hp>0&&g++<100){
    const alive=R.crew.filter(w=>w.hp>0);if(!alive.length)break;
    hp-=alive.reduce((s,w)=>s+w.atk,0)*rand(.85,1.15);if(hp<=0)break;
    const w=pick(alive),h=atk*rand(.8,1.2);w.hp=Math.max(0,w.hp-h);dmg[w.n]=(dmg[w.n]||0)+h;
  }
  const fallen=R.crew.filter(w=>w.hp<=0&&!w.gone);fallen.forEach(w=>{w.gone=true;});
  const win=hp<=0;
  runLog((win?'Sieg gegen ':'Niederlage gegen ')+ENEMYN[kind]+'.'+(fallen.length?' Gefallen: '+fallen.map(w=>w.n).join(', ')+'.':''));
  fx={kind,win,dmg};
  while(R.bag.length>bagCap()){const it=R.bag.pop();runLog(itemName(it)+' geht verloren.');}
  return win;
}
function startRun(diff){
  const sel=S.crew.map((c,i)=>S.prep.sel[i]&&c.wounded<=now()?i:-1).filter(i=>i>=0);
  const need=sel.length+S.prep.extra;
  if(!sel.length||S.res.proviant<need)return;
  S.res.proviant-=need;
  const crew=sel.map(i=>{const c={n:S.crew[i].n,ci:i,waffe:S.res.waffe>0,ruestung:S.res.ruestung>0};if(c.waffe)S.res.waffe--;if(c.ruestung)S.res.ruestung--;const st=warStats(c);c.max=st.max;c.hp=st.max;c.atk=st.atk;return c;});
  S.run={diff,...makeMap(diff),crew,bag:[],safe:null,extra:S.prep.extra,step:0,log:[],over:null};
  runLog('Ihr landet. Das Schiff wartet am Strand.');
  lastTok=-1;render(true);
}
function move(i){
  const R=S.run;if(R.over)return;
  const px=R.pos%5,py=(R.pos/5)|0,x=i%5,y=(i/5)|0;
  if(Math.abs(px-x)+Math.abs(py-y)!==1)return;
  R.pos=i;R.step++;if(!R.seen.includes(i))R.seen.push(i);
  const c=R.cells[i],base=DIFF[R.diff];
  if(R.step===base.storm){runLog('Der Sturm zieht auf.');toast(IC('sturm','i24')+'Sturm! Jeder Schritt wird gefährlicher');}
  if(R.step>base.storm&&Math.random()<.25&&c.t!=='ship'){if(!fight('draugr'))return checkWipe();}
  if(!c.done){
    c.done=true;
    if(c.t==='truhe')giveLoot([lootItem(R.diff)].concat(Math.random()<.4?[lootItem(R.diff)]:[]),c);
    else if(c.t==='feind'){if(fight('feind')&&Math.random()<.5)giveLoot([lootItem(R.diff)],c);}
    else if(c.t==='grab'){if(fight('grab'))giveLoot([lootItem(R.diff),lootItem(R.diff)],c);}
    else if(c.t==='boss'){if(fight('boss'))giveLoot([{k:'rune',a:1},{k:'silber',a:1},{k:'silber',a:1},lootItem(3),lootItem(3)],c);}
    else if(c.t==='leer'){if(Math.random()<.3){R.crew.forEach(w=>{if(w.hp>0)w.hp=Math.min(w.max,w.hp+6);});toast(IC('herz','i24')+'Heilkräuter: alle +6');}}
    else if(c.t==='feuer'){runLog('Signalfeuer: Von hier holt euch ein Boot ab.');toast(IC('feuer','i24')+'Fluchtpunkt gefunden');}
  }
  checkWipe();
}
function checkWipe(){if(S.run.crew.every(w=>w.hp<=0))endRun(false);render();}
function endRun(ok){
  const R=S.run;const got={};
  const items=ok?R.bag.slice():[];if(R.safe)items.push(R.safe);
  for(const it of items)got[it.k]=(got[it.k]||0)+it.a;
  for(const k in got)S.res[k]+=got[k];
  R.crew.forEach(w=>{
    if(w.hp>0&&ok){if(w.waffe)S.res.waffe++;if(w.ruestung)S.res.ruestung++;}
    else S.crew[w.ci].wounded=now()+10*60e3;
  });
  if(ok)S.wins[R.diff]++;
  R.over={ok,got};
}
