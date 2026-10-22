/* ---------- Hilfen ---------- */
const $=s=>document.querySelector(s);
/* Spielzeit: läuft mit wählbarem Tempo (0 = angehalten). Alle Zeitpunkte im Spielstand sind Spielzeit. */
const CLK={r:Date.now(),v:Date.now(),k:1};
const now=()=>CLK.v+(Date.now()-CLK.r)*CLK.k;
const SPEEDS=[1,2,4,8];
function setSpeed(k){CLK.v=now();CLK.r=Date.now();CLK.k=k;if(S){S.opt.speed=k;if(k)S.opt.lastSpeed=k;}}
/* Offline läuft die Zeit normal weiter, außer das Spiel war angehalten */
function restoreClock(){const c=S.clk,k=S.opt.speed===0?0:(S.opt.speed||1);CLK.r=Date.now();CLK.v=c?c.v+(Date.now()-c.r)*(k?1:0):Date.now();CLK.k=k;}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
function wpick(tab){let s=0;for(const t of tab)s+=t[1];let r=Math.random()*s;for(const t of tab){r-=t[1];if(r<=0)return t[0];}return tab[0][0];}
function fmt(n){n=Math.floor(n);if(n<1000)return String(n);if(n<1e6)return(n/1000).toFixed(n<1e4?1:0).replace('.',',')+'k';return(n/1e6).toFixed(1).replace('.',',')+'M';}
function fmtT(ms){ms=Math.max(0,ms);const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60);if(h>0)return h+' h '+String(m%60).padStart(2,'0');return m+':'+String(s%60).padStart(2,'0');}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
const idx=(x,y)=>y*N+x;
const inb=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
const N8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]], N4=N8.slice(0,4);
const easeBack=t=>{const c=1.7;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};

/* ---------- Gezeichnete Icons ---------- */
const OUT='rgba(30,36,38,.78)';
function pth(g,p){g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.closePath();}
function fs(g,fill,st){g.fillStyle=fill;g.fill();if(st!==false){g.strokeStyle=st||OUT;g.lineWidth=3.5;g.stroke();}}
function P(g,p,fill,st){pth(g,p);fs(g,fill,st);}
function E(g,x,y,rx,ry,fill,st){g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);fs(g,fill,st);}
function RR(g,x,y,w,h,r,fill,st){g.beginPath();g.roundRect(x,y,w,h,r);fs(g,fill,st);}
function L(g,pts,col,w){g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.strokeStyle=col;g.lineWidth=w;g.stroke();}
const DRAW={
  holz(g){const log=(x,y,l)=>{RR(g,x,y-11,l,22,7,'#8B5E34');L(g,[x+8,y-3,x+l-12,y-3],'#6E4626',2.5);E(g,x+l,y,9,11,'#E0B77E');g.beginPath();g.ellipse(x+l,y,4,5,0,0,TAU);g.strokeStyle='#A8784A';g.lineWidth=2;g.stroke();};log(-36,14,54);log(-26,-8,54);},
  stein(g){E(g,-14,14,18,13,'#8E9494');E(g,15,15,16,12,'#7A8080');E(g,0,-6,19,15,'#B0B5B2');E(g,-5,-11,6,3,'rgba(255,255,255,.55)',false);},
  weizen(g){for(const a of[-.5,-.17,.17,.5]){const ex=Math.sin(a)*42,ey=-30+Math.abs(a)*18;L(g,[0,30,ex,ey],'#A67C26',4);for(let k=0;k<3;k++){g.save();g.translate(ex*(1-k*.13),ey+k*8);g.rotate(a);E(g,0,0,5,8,'#E2B94B','#A67C26');g.restore();}}RR(g,-10,8,20,9,3,'#8A5A32');},
  fisch(g){P(g,[-24,0,-42,-16,-40,16],'#5E8794');P(g,[-4,-13,6,-25,12,-12],'#5E8794');E(g,2,0,30,16,'#7FA6B2');E(g,6,6,19,6,'#C5D9DE',false);E(g,18,-4,4.5,4.5,'#fff',false);E(g,19,-4,2.2,2.2,'#1E2426',false);},
  wolle(g){E(g,0,2,32,30,'#F1EBDD');g.strokeStyle='#CFC3AA';g.lineWidth=3;for(const[a,b,r]of[[-.4,1.6,20],[2.2,3.9,14],[3.6,5.6,22],[.5,2.3,10]]){g.beginPath();g.arc(0,2,r,a,b);g.stroke();}},
  erz(g){P(g,[-32,18,-26,-14,0,-28,26,-16,34,14,8,28],'#5E5450');E(g,-10,-4,6,5,'#D07A3A',false);E(g,12,6,5,4,'#C8743A',false);E(g,-4,14,4,3,'#E0A060',false);E(g,10,-14,3,3,'#E0A060',false);},
  bretter(g){const c=['#D4AE78','#C49A62','#B88E57'];for(let k=2;k>=0;k--){g.save();g.translate(0,14-k*14);g.rotate(-.2);RR(g,-36,-6,72,13,3,c[k]);L(g,[-26,0,20,0],'rgba(120,80,40,.4)',2);g.restore();}},
  brot(g){E(g,0,8,36,22,'#B97A30');E(g,0,2,31,16,'#D59B4B',false);for(const x of[-14,0,14])L(g,[x-6,8,x+6,-4],'#8E5A22',3.5);},
  proviant(g){g.beginPath();g.moveTo(-26,32);g.quadraticCurveTo(-40,2,-15,-14);g.lineTo(15,-14);g.quadraticCurveTo(40,2,26,32);g.closePath();fs(g,'#A97D52');RR(g,-11,-28,22,15,6,'#8F6640');RR(g,-17,-17,34,7,3,'#6E4A2E');E(g,6,10,9,7,'#8F6640',false);},
  eisen(g){const bar=(y,s)=>{P(g,[-34*s,y,34*s,y,24*s,y-17,-24*s,y-17],'#6E7B82');P(g,[-24*s,y-17,24*s,y-17,18*s,y-28,-18*s,y-28],'#A7B3B9');};bar(30,1);bar(4,.8);},
  stoff(g){RR(g,-36,-16,54,32,6,'#C9B596');for(const x of[-26,-12,2])RR(g,x,-16,6,32,0,'#9A3224',false);E(g,18,0,11,16,'#E0D0B2');g.beginPath();g.arc(18,0,6,0,5);g.strokeStyle='#A8946F';g.lineWidth=2.5;g.stroke();},
  werkzeug(g){g.save();g.rotate(-.7);RR(g,-5,-8,10,50,4,'#8A5A32');RR(g,-24,-28,48,20,5,'#8C979C');RR(g,-24,-28,48,6,3,'#B7C1C5',false);g.restore();},
  waffe(g){g.save();g.rotate(.55);RR(g,-4,-38,8,78,3,'#7A4E2C');g.beginPath();g.moveTo(2,-32);g.quadraticCurveTo(22,-44,34,-26);g.quadraticCurveTo(36,-6,26,6);g.quadraticCurveTo(14,-8,2,-6);g.closePath();fs(g,'#BCC5C9');L(g,[30,-24,26,2],'#E8EEF0',2.5);g.restore();},
  ruestung(g){g.beginPath();g.arc(0,8,31,Math.PI,0);g.closePath();fs(g,'#9AA3A7');RR(g,-33,4,66,10,4,'#6B7377');RR(g,-4,10,8,22,3,'#6B7377');L(g,[0,-22,0,4],'#7E878B',5);E(g,-12,-8,6,4,'rgba(255,255,255,.5)',false);},
  bernstein(g){P(g,[0,-36,24,-6,17,26,-17,26,-24,-6],'#D08A22');P(g,[0,-36,10,-4,0,26,-17,26,-24,-6],'#E9A53A',false);E(g,-8,-10,4,9,'rgba(255,255,255,.65)',false);},
  silber(g){P(g,[-32,30,32,30,24,14,-24,14],'#9FA9AD');P(g,[-24,14,24,14,18,4,-18,4],'#D3DADC');P(g,[-22,4,26,4,20,-12,-16,-12],'#A9B3B7');P(g,[-16,-12,20,-12,15,-22,-11,-22],'#DCE2E4');},
  rune(g){P(g,[-24,32,-30,-8,-12,-34,14,-32,30,-8,24,32],'#7D8584');g.shadowColor='#7FE0F0';g.shadowBlur=10;L(g,[-4,-18,-4,20],'#8DE6F2',5);L(g,[-4,-18,10,-6,-4,4,12,20],'#8DE6F2',5);g.shadowBlur=0;},
  muenzen(g){for(let k=0;k<3;k++){const y=20-k*11;E(g,0,y+5,27,10,'#A8761F');E(g,0,y,27,10,'#E7B54C');}L(g,[-8,-2,8,-2],'#B88426',3);},
  herz(g){g.beginPath();g.moveTo(0,32);g.bezierCurveTo(-44,4,-30,-34,0,-14);g.bezierCurveTo(30,-34,44,4,0,32);fs(g,'#C9432F');E(g,-14,-10,6,4,'rgba(255,255,255,.55)',false);},
  schwert(g){P(g,[0,-40,7,-29,7,12,-7,12,-7,-29],'#CFD6D9');L(g,[0,-32,0,8],'#A9B3B7',2);RR(g,-18,10,36,8,3,'#8A5A32');RR(g,-4,18,8,15,3,'#5A3B24');E(g,0,37,6,5,'#C4862A');},
  ziel(g){for(const[r,c]of[[38,'#9A3224'],[28,'#F1E9DA'],[18,'#9A3224'],[8,'#F1E9DA']])E(g,0,0,r,r,c);L(g,[30,-30,4,-4],'#5A3B24',4);L(g,[30,-30,24,-36],'#C4862A',3);L(g,[30,-30,36,-24],'#C4862A',3);},
  schild(g){E(g,0,0,35,35,'#9A3224');for(const x of[-17,0,17])L(g,[x,-31,x,31],'rgba(90,20,14,.45)',3);g.beginPath();g.arc(0,0,33,0,TAU);g.strokeStyle='#C4862A';g.lineWidth=4;g.stroke();E(g,0,0,10,10,'#B7C1C5');},
  schiff(g){g.beginPath();g.moveTo(-40,6);g.quadraticCurveTo(0,34,40,6);g.lineTo(28,6);g.lineTo(-28,6);g.closePath();fs(g,'#8A5A32');P(g,[30,8,40,-10,46,-16,38,-14,34,6],'#7A4E2C');P(g,[-30,8,-40,-8,-44,-12,-34,4],'#7A4E2C');RR(g,-2,-36,4,42,1,'#5A3B24',false);RR(g,-22,-32,44,26,3,'#F1E9DA');RR(g,-12,-32,7,26,0,'#B03A2A',false);RR(g,5,-32,7,26,0,'#B03A2A',false);for(const x of[-20,-8,4,16])E(g,x,10,5,5,'#C4862A','#6E4A2E');},
  haus(g){P(g,[-26,2,0,14,0,34,-26,22],'#B03A2A');P(g,[0,14,26,2,26,22,0,34],'#862A1E');P(g,[-30,2,0,16,0,-30],'#2B3A3F');P(g,[0,16,30,2,0,-30],'#1E2A2E');RR(g,-17,12,7,8,1,'#FFCE6E',false);},
  waage(g){RR(g,-3,-30,6,60,2,'#8A5A32');RR(g,-34,-26,68,6,3,'#8A5A32');L(g,[-26,-22,-34,6],OUT,2);L(g,[-26,-22,-18,6],OUT,2);L(g,[26,-22,18,6],OUT,2);L(g,[26,-22,34,6],OUT,2);for(const x of[-26,26]){g.beginPath();g.arc(x,6,11,0,Math.PI);g.closePath();fs(g,'#E2B04A');}RR(g,-14,26,28,8,3,'#6E4A2E');},
  truhe(g){g.beginPath();g.moveTo(-32,-6);g.quadraticCurveTo(0,-34,32,-6);g.closePath();fs(g,'#A06A3A');RR(g,-32,-6,64,36,4,'#8A5A32');RR(g,-22,-20,7,50,2,'#D9A33A',false);RR(g,15,-20,7,50,2,'#D9A33A',false);RR(g,-6,-4,12,14,3,'#E7B54C');},
  schaedel(g){E(g,0,-6,27,25,'#F1ECE0');RR(g,-14,12,28,16,5,'#F1ECE0');E(g,-10,-4,7,8,'#2A2422',false);E(g,10,-4,7,8,'#2A2422',false);P(g,[0,6,-4,13,4,13],'#2A2422',false);for(const x of[-7,0,7])L(g,[x,18,x,27],'#8E8679',2);},
  grab(g){E(g,-15,24,15,9,'#8E9494');E(g,13,24,15,9,'#7A8080');E(g,0,12,16,10,'#A3A8A5');RR(g,-9,-36,18,42,7,'#7D8584');L(g,[0,-28,0,-6],'#5E6766',3);L(g,[0,-24,6,-16],'#5E6766',3);},
  pfad(g){for(const[x,y]of[[-20,22],[-6,8],[6,-6],[20,-20]]){g.save();g.translate(x,y);g.rotate(-.4);E(g,0,0,6,9,'#8C7A5C',false);g.restore();}},
  feuer(g){g.save();g.rotate(.4);RR(g,-30,18,60,10,4,'#7A4E2C');g.rotate(-.8);RR(g,-30,18,60,10,4,'#8A5A32');g.restore();g.beginPath();g.moveTo(0,-38);g.quadraticCurveTo(30,-2,16,20);g.lineTo(-16,20);g.quadraticCurveTo(-30,-2,0,-38);fs(g,'#E07B39');g.beginPath();g.moveTo(0,-14);g.quadraticCurveTo(14,4,8,18);g.lineTo(-8,18);g.quadraticCurveTo(-14,4,0,-14);fs(g,'#F6CA52',false);},
  krone(g){P(g,[-32,22,-32,-14,-16,2,0,-26,16,2,32,-14,32,22],'#E7B54C');RR(g,-32,14,64,10,2,'#C4862A');E(g,0,-2,5,5,'#B03A2A',false);E(g,-18,10,4,4,'#3F5E6B',false);E(g,18,10,4,4,'#3F5E6B',false);},
  sturm(g){E(g,-12,-6,18,14,'#7F8C92');E(g,10,-10,20,16,'#93A0A6');E(g,0,2,30,12,'#87949A');P(g,[2,10,-10,26,0,24,-6,38,12,18,2,20,8,10],'#F4C04E');},
  hoch(g){P(g,[0,-36,28,-6,11,-6,11,32,-11,32,-11,-6,-28,-6],'#5C7246');},
  ab(g){P(g,[0,36,28,6,11,6,11,-32,-11,-32,-11,6,-28,6],'#53656B');},
  nehmen(g){P(g,[0,-36,28,-6,11,-6,11,32,-11,32,-11,-6,-28,-6],'#C4862A');},
  abriss(g){g.save();g.rotate(-.5);RR(g,-30,-8,28,14,3,'#B88E57');g.restore();g.save();g.rotate(.4);RR(g,2,-2,28,14,3,'#C49A62');g.restore();P(g,[-4,-30,2,-14,-6,-12,0,4],'#9A3224');},
  uhr(g){RR(g,-24,-36,48,8,3,'#8A5A32');RR(g,-24,28,48,8,3,'#8A5A32');P(g,[-18,-28,18,-28,2,0,18,28,-18,28,-2,0],'#E8DEC6');P(g,[-12,22,12,22,0,10],'#D9A33A',false);P(g,[-8,-18,8,-18,0,-8],'#D9A33A',false);},
  schloss(g){g.beginPath();g.arc(0,-6,16,Math.PI,0);g.strokeStyle='#5E6766';g.lineWidth=8;g.stroke();RR(g,-24,-8,48,38,8,'#C4862A');E(g,0,8,5,6,'#5A3B24',false);},
  wald(g){for(const[x,s]of[[-14,.9],[12,1]]){P(g,[x-16*s,22,x+16*s,22,x,-30*s],'#4C6B45');RR(g,x-3,22,6,10,2,'#5B4632',false);}},
  wasser(g){for(const y of[-14,4,22]){g.beginPath();g.moveTo(-34,y);for(let x=-34;x<34;x+=17)g.quadraticCurveTo(x+8.5,y-10,x+17,y);g.strokeStyle='#5E8794';g.lineWidth=5;g.stroke();}},
  wiese(g){E(g,0,28,30,6,'#9DB37A',false);for(const[x,h]of[[-18,30],[-6,40],[6,34],[18,28]])P(g,[x-5,26,x+5,26,x+(x>0?6:-6),26-h],'#7E9A55',false);},
  plus(g){RR(g,-6,-28,12,56,5,'#5C7246');RR(g,-28,-6,56,12,5,'#5C7246');},
  lager(g){RR(g,-32,-14,64,44,5,'#A87C52');L(g,[-32,-14,32,30],'#7A5636',3);L(g,[32,-14,-32,30],'#7A5636',3);RR(g,-32,-22,64,10,3,'#8A5A32');},
  lehm(g){g.beginPath();g.moveTo(-34,22);g.quadraticCurveTo(-30,-14,0,-18);g.quadraticCurveTo(30,-14,34,22);g.closePath();fs(g,'#B07A55');E(g,-8,-4,9,5,'rgba(255,255,255,.25)',false);L(g,[-20,10,-4,6],'#8E5E3E',3);L(g,[6,12,20,8],'#8E5E3E',3);},
  honig(g){g.beginPath();g.moveTo(-22,-18);g.lineTo(22,-18);g.quadraticCurveTo(34,10,22,32);g.lineTo(-22,32);g.quadraticCurveTo(-34,10,-22,-18);g.closePath();fs(g,'#C9A060');RR(g,-24,-30,48,12,4,'#E2B04A');g.beginPath();g.moveTo(-10,-18);g.quadraticCurveTo(-10,-4,-4,-2);g.quadraticCurveTo(2,0,2,-18);fs(g,'#F2C04A',false);E(g,-12,6,4,9,'rgba(255,255,255,.45)',false);},
  milch(g){g.beginPath();g.moveTo(-16,-30);g.lineTo(16,-30);g.lineTo(20,-16);g.quadraticCurveTo(28,10,24,32);g.lineTo(-24,32);g.quadraticCurveTo(-28,10,-20,-16);g.closePath();fs(g,'#9AA7AB');RR(g,-20,-6,40,22,4,'#F5F2EA',false);RR(g,-18,-36,36,8,3,'#7E8A8E');E(g,-12,-12,4,8,'rgba(255,255,255,.5)',false);},
  flachs(g){for(const a of[-.45,-.15,.15,.45]){const ex=Math.sin(a)*40,ey=-26+Math.abs(a)*16;L(g,[0,32,ex,ey],'#6E8A4A',4);for(let q=0;q<5;q++){const ang=q*TAU/5;E(g,ex+Math.cos(ang)*5,ey+Math.sin(ang)*5,4.5,4.5,'#7C95D0',false);}E(g,ex,ey,3,3,'#F2D16B',false);}RR(g,-9,14,18,8,3,'#C4A66A');},
  fell(g){g.beginPath();g.moveTo(-30,-24);g.quadraticCurveTo(-18,-34,0,-30);g.quadraticCurveTo(18,-34,30,-24);g.quadraticCurveTo(38,-6,28,4);g.quadraticCurveTo(36,22,22,32);g.quadraticCurveTo(0,26,-22,32);g.quadraticCurveTo(-36,22,-28,4);g.quadraticCurveTo(-38,-6,-30,-24);g.closePath();fs(g,'#9C6B3E');E(g,0,0,14,18,'#B98454',false);for(const[x,y]of[[-10,-14],[8,-8],[-4,12],[12,14]])L(g,[x,y,x+5,y+3],'#7A4E2C',2.5);},
  kohle(g){P(g,[-30,22,-24,-4,-6,-14,4,4,-8,26],'#3B3532');P(g,[2,26,6,-6,22,-18,34,6,24,28],'#2A2624');P(g,[-14,-6,-4,-30,14,-24,10,-4],'#4A4542');E(g,-16,4,4,3,'rgba(255,255,255,.25)',false);E(g,18,-4,3,2,'#E07B39',false);},
  ziegel(g){const br=(x,y,c)=>{P(g,[x-22,y,x+10,y+12,x+28,y+4,x-4,y-8],shade(c,.12));P(g,[x-22,y,x+10,y+12,x+10,y+22,x-22,y+10],c);P(g,[x+10,y+12,x+28,y+4,x+28,y+14,x+10,y+22],shade(c,-.25));};br(-8,10,'#B5694A');br(4,-8,'#A85E40');br(-14,-20,'#C07756');},
  met(g){g.beginPath();g.moveTo(-26,-30);g.quadraticCurveTo(-30,10,-14,30);g.lineTo(14,30);g.quadraticCurveTo(30,10,26,-30);g.closePath();fs(g,'#E8B44A');g.beginPath();g.ellipse(0,-30,26,7,0,0,TAU);fs(g,'#F6E7C2');RR(g,-28,-10,56,6,2,'#A8761F',false);RR(g,-24,14,48,6,2,'#A8761F',false);E(g,-14,-12,4,10,'rgba(255,255,255,.4)',false);},
  kaese(g){P(g,[-34,8,20,-22,36,0,36,24,-34,30],'#E9C25A');P(g,[-34,8,20,-22,36,0,-18,22],'#F4D57A');P(g,[-34,8,-18,22,-18,32,-34,30],'#D4A93E',false);E(g,4,0,5,3,'#D4A93E',false);E(g,18,-8,3.5,2,'#D4A93E',false);E(g,10,16,4,4,'#D4A93E',false);},
  leder(g){g.beginPath();g.moveTo(-32,-20);g.lineTo(28,-28);g.quadraticCurveTo(38,0,30,26);g.lineTo(-30,30);g.quadraticCurveTo(-40,4,-32,-20);g.closePath();fs(g,'#8A5A32');g.setLineDash([5,5]);g.beginPath();g.moveTo(-24,-12);g.lineTo(22,-18);g.quadraticCurveTo(28,2,22,18);g.lineTo(-22,22);g.quadraticCurveTo(-30,4,-24,-12);g.strokeStyle='#D9B07A';g.lineWidth=2.5;g.stroke();g.setLineDash([]);},
  leinen(g){RR(g,-34,-18,52,36,6,'#E7DFC8');for(const y of[-8,2,12])L(g,[-28,y,12,y],'#C9BE9E',2);E(g,20,0,12,18,'#F2ECDA');g.beginPath();g.arc(20,0,6,0,5);g.strokeStyle='#BDB08C';g.lineWidth=2.5;g.stroke();},
  kleidung(g){P(g,[-14,-30,-34,-18,-38,4,-26,8,-24,32,24,32,26,8,38,4,34,-18,14,-30,0,-20],'#3F5E6B');P(g,[-14,-30,0,-20,14,-30,8,-34,-8,-34],'#2E4650',false);RR(g,-24,12,48,6,2,'#C4862A',false);E(g,0,-8,3,3,'#E2B04A',false);E(g,0,2,3,3,'#E2B04A',false);},
  segel(g){RR(g,-3,-40,6,76,2,'#5A3B24');g.beginPath();g.moveTo(-30,-32);g.quadraticCurveTo(0,-24,30,-32);g.lineTo(32,18);g.quadraticCurveTo(0,26,-32,18);g.closePath();fs(g,'#F1E9DA');for(const x of[-18,6])RR(g,x,-28,12,48,0,'#B03A2A',false);RR(g,-36,-36,72,6,3,'#7A4E2C');},
  leute(g){const p=(x,y,s,c)=>{g.save();g.translate(x,y);g.scale(s,s);g.beginPath();g.moveTo(-16,30);g.quadraticCurveTo(-16,0,0,0);g.quadraticCurveTo(16,0,16,30);g.closePath();fs(g,c);E(g,0,-12,10,10,'#F0C9A8');g.restore();};p(-16,0,.85,'#5C7246');p(16,0,.85,'#3F5E6B');p(0,6,1,'#9A3224');},
  froh(g){E(g,0,0,34,34,'#E7B54C');E(g,-11,-8,4,5,'#3B3532',false);E(g,11,-8,4,5,'#3B3532',false);g.beginPath();g.arc(0,4,16,.2,Math.PI-.2);g.strokeStyle='#3B3532';g.lineWidth=4.5;g.stroke();},
  mittel(g){E(g,0,0,34,34,'#D9C38A');E(g,-11,-8,4,5,'#3B3532',false);E(g,11,-8,4,5,'#3B3532',false);L(g,[-13,14,13,14],'#3B3532',4.5);},
  sauer(g){E(g,0,0,34,34,'#D58A6A');E(g,-11,-6,4,5,'#3B3532',false);E(g,11,-6,4,5,'#3B3532',false);g.beginPath();g.arc(0,24,14,Math.PI+.35,-.35);g.strokeStyle='#3B3532';g.lineWidth=4.5;g.stroke();L(g,[-18,-18,-6,-14],'#3B3532',3.5);L(g,[18,-18,6,-14],'#3B3532',3.5);},
  arbeit(g){g.save();g.rotate(-.6);RR(g,-4,-6,8,44,3,'#8A5A32');RR(g,-20,-26,40,18,5,'#8C979C');RR(g,-20,-26,40,6,3,'#B7C1C5',false);g.restore();},
  heide(g){E(g,0,24,32,8,'#8E8466',false);for(const[x,h]of[[-20,26],[-8,36],[6,30],[18,24]]){L(g,[x,24,x+(x>0?3:-3),24-h],'#6B5E46',3);for(let k=0;k<4;k++)E(g,x+(x>0?1:-1)*k*.8,24-h+k*6,4.5,3.5,k%2?'#9C7BB0':'#B58FC4',false);}},
  moor(g){E(g,0,14,36,16,'#7F9070');E(g,-6,16,18,7,'#4E6A6A',false);E(g,-10,14,6,2,'rgba(255,255,255,.35)',false);for(const x of[14,20,26]){L(g,[x,16,x-2,-24],'#6E7F4E',3);}RR(g,15,-30,6,14,3,'#7A5636',false);},
  berg(g){P(g,[-38,30,-6,-34,30,30],'#8E918A');P(g,[-6,-34,30,30,8,30],'#6F716B',false);P(g,[-6,-34,4,-14,-2,-10,-10,-16,-18,-12],'#F4F4F0',false);P(g,[10,30,26,-6,40,30],'#A3A59D');},
  duene(g){g.beginPath();g.moveTo(-40,28);g.quadraticCurveTo(-14,-14,10,10);g.quadraticCurveTo(24,-6,40,28);g.closePath();fs(g,'#E6D3A0');for(const[x,h]of[[-14,22],[-6,30],[18,20]])L(g,[x,0,x+(x%2?3:-3),-h],'#9DAE6A',3);E(g,18,20,5,4,'#E9A53A',false);},
  bauhuette(g){RR(g,-6,-30,12,60,3,'#8A5A32');g.save();g.rotate(-.5);RR(g,-26,-20,52,10,3,'#C49A62');g.restore();RR(g,-30,16,60,12,4,'#C4862A');},
  karren(g){P(g,[-34,-6,22,-6,26,14,-30,14],'#A87C52');RR(g,-34,-12,58,8,3,'#C49A62');L(g,[22,0,44,-18],'#7A4E2C',5);E(g,-8,20,13,13,'#5A3B24');E(g,-8,20,5,5,'#C49A62');P(g,[-28,-12,-20,-26,-6,-14],'#E2B94B',false);E(g,8,-16,10,7,'#D59B4B',false);},
  ochse(g){E(g,0,6,26,22,'#8A5A32');E(g,0,20,14,10,'#C49A7A');E(g,-6,18,2.5,2,'#3B3532',false);E(g,6,18,2.5,2,'#3B3532',false);E(g,-10,0,4,4,'#1E2426',false);E(g,10,0,4,4,'#1E2426',false);
    g.beginPath();g.moveTo(-20,-10);g.quadraticCurveTo(-40,-14,-38,-34);g.quadraticCurveTo(-30,-18,-14,-16);g.closePath();fs(g,'#EDE6D6');g.beginPath();g.moveTo(20,-10);g.quadraticCurveTo(40,-14,38,-34);g.quadraticCurveTo(30,-18,14,-16);g.closePath();fs(g,'#EDE6D6');},
  info(g){E(g,0,0,34,34,'#3F5E6B');E(g,0,-16,5,5,'#fff',false);RR(g,-5,-6,10,28,4,'#fff',false);}

};
const ICON={},ICONC={};
function mkc(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),c);return c;}
function iconC(k){if(!ICONC[k])ICONC[k]=mkc(96,96,g=>{g.translate(48,48);g.lineJoin='round';g.lineCap='round';(DRAW[k]||DRAW.stein)(g);});return ICONC[k];}
function iconURL(k){if(!ICON[k])ICON[k]=iconC(k).toDataURL();return ICON[k];}
const IC=(k,c)=>'<img class="ico '+(c||'')+'" src="'+iconURL(k)+'" alt="">';

/* Porträts */
const PORT={};
const PCFG={
  ragna:{bg:'#D7E1CF',tun:'#5C7246',skin:'#F0C9A8',hair:'#B5502E',helm:1,braids:1},
  bjorn:{bg:'#EBD3C8',tun:'#9A3224',skin:'#E8B892',hair:'#6B4428',helm:1,beard:'#6B4428'},
  sigrid:{bg:'#CFDDE3',tun:'#3F5E6B',skin:'#F3D2B5',hair:'#E0BF6A',band:'#9A3224',braids:1},
  raider:{bg:'#E8CFC8',tun:'#3B3532',skin:'#D9A982',hood:'#3B3532',beard:'#2F2724',scar:1},
  draugr:{bg:'#C9D6D8',tun:'#2F3B3E',skin:'#9FB3B5',hood:'#2F3B3E',glow:1},
  jarl:{bg:'#EADBB0',tun:'#7A2418',skin:'#E8B892',helm:2,beard:'#EDEDE6',fur:1},
  haendler:{bg:'#D9E6E3',tun:'#5C7246',skin:'#EBC09C',cap:'#3F5E6B',beard:'#8A5A32'},
  dorf:{bg:'#EEE6D6',tun:'#B9A07A',skin:'#F0C9A8',hair:'#8A5A32'}
};
function portrait(kind){
  if(PORT[kind])return PORT[kind];
  const cfg=PCFG[kind];
  const c=mkc(120,120,g=>{
    g.save();g.beginPath();g.arc(60,60,60,0,TAU);g.clip();
    g.fillStyle=cfg.bg;g.fillRect(0,0,120,120);
    if(cfg.hood)E(g,60,58,34,38,cfg.hood,false);
    if(cfg.braids){RR(g,30,50,12,52,6,cfg.hair,false);RR(g,78,50,12,52,6,cfg.hair,false);}
    if(cfg.fur)E(g,60,122,56,30,'#8B7355',false);
    g.beginPath();g.ellipse(60,124,44,34,0,Math.PI,0);g.fillStyle=cfg.tun;g.fill();
    RR(g,52,72,16,16,4,cfg.skin,false);
    E(g,60,58,22,25,cfg.skin,false);
    if(cfg.hair&&!cfg.helm){g.beginPath();g.ellipse(60,48,24,20,0,Math.PI,0);g.fillStyle=cfg.hair;g.fill();}
    if(cfg.band)RR(g,36,40,48,7,3,cfg.band,false);
    if(cfg.cap){g.beginPath();g.ellipse(60,42,26,16,0,Math.PI,0);g.fillStyle=cfg.cap;g.fill();RR(g,32,40,56,7,3,'#2E4650',false);}
    const ey=58;
    if(cfg.glow){g.shadowColor='#7FE0F0';g.shadowBlur=12;E(g,51,ey,4.5,3.5,'#9BF0FA',false);E(g,69,ey,4.5,3.5,'#9BF0FA',false);g.shadowBlur=0;RR(g,52,72,16,4,2,'#2A3436',false);}
    else{E(g,51,ey,3,3.5,'#1E2426',false);E(g,69,ey,3,3.5,'#1E2426',false);L(g,[45,ey-8,55,ey-6],'rgba(40,30,25,.7)',2.5);L(g,[65,ey-6,75,ey-8],'rgba(40,30,25,.7)',2.5);}
    E(g,60,66,3,4,'rgba(0,0,0,.12)',false);
    if(cfg.beard){g.beginPath();g.moveTo(38,62);g.quadraticCurveTo(40,98,60,102);g.quadraticCurveTo(80,98,82,62);g.quadraticCurveTo(72,76,60,74);g.quadraticCurveTo(48,76,38,62);g.fillStyle=cfg.beard;g.fill();RR(g,50,70,20,4,2,cfg.beard,false);}
    else if(!cfg.glow)L(g,[54,76,66,76],'rgba(120,60,50,.6)',2.5);
    if(cfg.scar)L(g,[66,50,74,66],'#A0563E',2.5);
    if(cfg.helm===1){g.beginPath();g.arc(60,52,25,Math.PI,0);g.closePath();g.fillStyle='#8E979B';g.fill();RR(g,34,48,52,7,3,'#6B7377',false);RR(g,57,50,6,18,2,'#6B7377',false);E(g,50,36,6,3,'rgba(255,255,255,.5)',false);}
    if(cfg.helm===2){g.beginPath();g.arc(60,52,25,Math.PI,0);g.closePath();g.fillStyle='#D9A33A';g.fill();RR(g,34,48,52,7,3,'#A8761F',false);P(g,[48,30,60,12,72,30],'#E7B54C',false);}
    g.restore();
  });
  PORT[kind]=c.toDataURL();return PORT[kind];
}
const POR=(k,s)=>'<img class="por" src="'+portrait(k)+'" width="'+s+'" height="'+s+'" alt="">';

/* Szenen für Raubziele */
const SCENE={};
function scene(d){
  if(SCENE[d])return SCENE[d];
  const c=mkc(960,420,g=>{g.scale(3,3);
    const sky=g.createLinearGradient(0,0,0,140);
    sky.addColorStop(0,['','#BFD3D8','#AAB5BA','#B7A9A0'][d]);sky.addColorStop(1,['','#E7EEEE','#D4D9D6','#E5D4C2'][d]);
    g.fillStyle=sky;g.fillRect(0,0,320,140);
    g.fillStyle='#7FA2AA';g.fillRect(0,104,320,36);
    g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=2;for(let i=0;i<8;i++){g.beginPath();g.moveTo(i*42+10,118+(i%2)*8);g.quadraticCurveTo(i*42+20,114+(i%2)*8,i*42+30,118+(i%2)*8);g.stroke();}
    if(d===1){P(g,[20,106,90,70,200,64,300,106],'#A3B57E',false);for(const[x,s]of[[110,1],[160,.8],[205,.9]]){P(g,[x-20*s,86,x,70-20*s,x+20*s,86],'#5A3B24',false);RR(g,x-16*s,86,32*s,20*s,2,'#B9A07A',false);}
      g.save();g.translate(262,104);g.scale(.8,.8);DRAW.schiff(g);g.restore();}
    if(d===2){P(g,[0,106,60,74,160,66,260,72,320,106],'#8D9A7C',false);for(const[x,r]of[[90,34],[180,42],[255,28]]){g.beginPath();g.ellipse(x,100,r,r*.7,0,Math.PI,0);g.fillStyle='#7C8B6C';g.fill();}
      for(const x of[132,146,222])RR(g,x,58,10,40,4,'#6F7776',false);g.fillStyle='rgba(235,240,240,.45)';g.fillRect(0,86,320,18);}
    if(d===3){P(g,[40,106,120,40,220,38,300,106],'#8C8F88',false);for(let x=106;x<234;x+=9)P(g,[x,46,x+4,32,x+8,46,x+8,68,x,68],'#7A5C3A',false);RR(g,150,14,28,40,2,'#6B6F6C',false);P(g,[146,16,164,0,182,16],'#9A3224',false);RR(g,176,4,3,26,1,'#3B3532',false);P(g,[179,6,198,12,179,18],'#B03A2A',false);}
  });
  SCENE[d]=c.toDataURL();return SCENE[d];
}

