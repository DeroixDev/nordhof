/* ---------- Logistik: Träger, Handkarren, Ochsenkarren ---------- */
/* Betriebe legen ihre Ware vor die Tür (b.buf). Träger bringen sie zum nächsten Lager (Hof oder Lagerhaus).
   Wie viel ankommt, hängt an Ladung, Anzahl der Träger und Laufzeit hin und zurück. Ist der Vorrat voll, ruht der Betrieb. */
const TRANS=[{n:'zu Fuß',cap:5,sp:1},{n:'Handkarren',cap:10,sp:.9},{n:'Ochsenkarren',cap:25,sp:.8}];
/* Rechnerisches Tempo der Träger in Feldern je Sekunde (die Figuren auf der Karte gehen gemütlicher) und Ladezeit */
const CWALK=1.4,LOAD=2;
const outOf=b=>{const d=B[b.type];return d.out||(d.rec?b.recipe||d.rec[0]:null);};
const bufCap=b=>8+4*b.lvl;
const carriers=b=>1+Math.floor(b.lvl/3);
/* Beste Transportstufe im Dorf: Stellmacher gibt Handkarren, Ochsenstall Ochsenkarren (solange es Weizen gibt) */
function transLevel(){let t=0;for(const i of BL){const b=S.tiles[i].b,d=B[b.type];if(d.kind!=='trans'||(b.job==='build'&&busy(b))||!connected(i))continue;
  if(d.uses&&!Object.keys(d.uses).every(k=>S.res[k]>=1))continue;t=Math.max(t,d.tl);}return t;}
let LOG={};
/* Laufzeit in Sekunden je Richtung: über Wege nach Netz, sonst querfeldein zum nächsten Lager */
function logistics(){
  LOG={};const tl=transLevel(),hs=hubs();
  for(const i of BL){const b=S.tiles[i].b,d=B[b.type];if(d.kind!=='prod'&&d.kind!=='craft')continue;
    const con=CONN[i]&&HUBD[i]>=0;let walk,mode;
    if(con){walk=HUBD[i]/CWALK;mode=tl>=2&&HUBL[i]>=2?2:Math.min(tl,1);}
    else{const[cx,cy]=bCtr(i);let dm=1e9;for(const h of hs){const[x,y]=bCtr(h);dm=Math.min(dm,Math.abs(x-cx)+Math.abs(y-cy));}walk=(dm<1e9?dm:30)/(CWALK*OFFROAD);mode=Math.min(tl,1);}
    const T=TRANS[mode],trip=2*walk/T.sp+LOAD,n=carriers(b);
    LOG[i]={walk,trip,mode,n,cap:T.cap,rate:n*T.cap/trip};}
}
/* Ware vor die Tür legen; gibt zurück, wie viel Platz war */
function toBuf(b,amt){const room=Math.max(0,bufCap(b)-(b.buf||0)),a=Math.min(room,amt);b.buf=(b.buf||0)+a;return a;}
/* Träger holen ab: so viel, wie sie in dt schaffen, und nur so viel, wie ins Lager passt */
function haul(i,k,dt){
  const b=S.tiles[i].b;if(!b.buf)return 0;const L=LOG[i],can=HUBD[i]===0?b.buf:Math.min(b.buf,(L?L.rate:1)*dt);
  const got=gain(k,can);b.buf-=got;if(b.buf<1e-6)b.buf=0;return got;
}
