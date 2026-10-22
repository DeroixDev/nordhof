/* ---------- Eingabe: Maus und Tastatur zuerst, Finger gehen auch ---------- */
/* Linke Taste ziehen oder rechte/mittlere Taste ziehen verschiebt, Rad zoomt zur Mausposition, WASD und Pfeile schieben */
const ptrs=new Map();let drag=null,pinch=null,hov=-1,place=null,glide=null,mouse={x:-1,y:-1,in:false};
const ZMIN=.25,ZMAX=3;
function screenToF(px,py){
  const wx=(px-W/2-view.x)/view.z,wy=(py-H/2-view.y)/view.z+(N-1)*TH/2;
  return[(wx/(TW/2)+wy/(TH/2))/2+.5,(wy/(TH/2)-wx/(TW/2))/2+.5];
}
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{
  cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.offsetX,y:e.offsetY});hideTip();
  if(ptrs.size===1){drag={x:e.offsetX,y:e.offsetY,vx:view.x,vy:view.y,moved:false,btn:e.button,touch:e.pointerType!=='mouse'};
    if(roadMode()&&e.button===0){drag.road=true;place.i0=tileAt(e.offsetX,e.offsetY);place.a=place.i0;roadUpd();}}
  if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:view.z,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};if(drag){drag.moved=true;if(drag.road){drag.road=false;place.a=-1;roadUpd();}}}
});
cv.addEventListener('pointermove',e=>{
  if(e.pointerType==='mouse'){mouse.x=e.offsetX;mouse.y=e.offsetY;mouse.in=true;}
  if(ptrs.has(e.pointerId)){
    ptrs.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
    if(pinch&&ptrs.size===2){const[a,b]=[...ptrs.values()];zoomAt(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d,(a.x+b.x)/2,(a.y+b.y)/2);return;}
    if(drag&&drag.road){roadAt(e.offsetX,e.offsetY);return;}
    if(drag){const dx=e.offsetX-drag.x,dy=e.offsetY-drag.y;if(Math.abs(dx)+Math.abs(dy)>(drag.touch?8:4)){drag.moved=true;glide=null;$('#stage').classList.add('panning');}
      if(drag.moved){view.x=drag.vx+dx;view.y=drag.vy+dy;}}
    if(drag&&drag.moved)return;
  }
  if(e.pointerType==='mouse')hoverAt(e.offsetX,e.offsetY);
});
cv.addEventListener('pointerleave',()=>{mouse.in=false;if(!ptrs.size){hov=-1;hideTip();}});
cv.addEventListener('pointerup',e=>{
  const d=drag;ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;
  if(ptrs.size===0){drag=null;$('#stage').classList.remove('panning');}
  if(d&&d.road){roadCommit();return;}
  if(!d||d.moved||ptrs.size)return;
  if(d.btn===2){if(place)endPlace();else selectTile(-1);return;}
  if(d.btn!==0)return;
  if(place){placeAt(e.offsetX,e.offsetY);if(d.touch){renderPlacebar();return;}tryPlace(e.shiftKey);return;}
  selectTile(tileAt(e.offsetX,e.offsetY));
});
cv.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);drag=null;pinch=null;$('#stage').classList.remove('panning');});
cv.addEventListener('wheel',e=>{e.preventDefault();const f=Math.exp(-Math.max(-60,Math.min(60,e.deltaY*(e.deltaMode?16:1)))*.0022);zoomAt(view.z*f,e.offsetX,e.offsetY);},{passive:false});
/* Zoomen, der Punkt unter dem Zeiger bleibt stehen */
function zoomAt(z,px,py){const nz=Math.max(ZMIN,Math.min(ZMAX,z));if(px===undefined){px=visCX();py=visCY();}
  const wx=(px-W/2-view.x)/view.z,wy=(py-H/2-view.y)/view.z;view.x=px-W/2-wx*nz;view.y=py-H/2-wy*nz;view.z=nz;glide=null;}
function zoomTo(z){zoomAt(z);}
/* Freie Kartenmitte zwischen den Tafeln */
function visBox(){const cs=getComputedStyle($('#app')),l=parseFloat(cs.getPropertyValue('--lw'))||0,r=parseFloat(cs.getPropertyValue('--rw'))||0,t=parseFloat(cs.getPropertyValue('--tb'))||0,bt=(parseFloat(cs.getPropertyValue('--nav'))||0)+(parseFloat(cs.getPropertyValue('--bb'))||0);return{l,r:W-r,t,b:H-bt};}
function visCX(){const v=visBox();return(v.l+v.r)/2;}
function visCY(){const v=visBox();return(v.t+v.b)/2;}
/* Ansicht sanft zu einem Weltpunkt schieben */
function glideTo(wx,wy,z){if(z)view.z=z;const v=visBox();glide={x:(v.l+v.r)/2-W/2-wx*view.z,y:(v.t+v.b)/2-H/2-wy*view.z};}
function tileAt(px,py){const[fx,fy]=screenToF(px,py),x=Math.floor(fx),y=Math.floor(fy);return inb(x,y)?idx(x,y):-1;}
function hoverAt(px,py){
  if(roadMode()){roadAt(px,py);hideTip();return;}
  if(place){placeAt(px,py);hideTip();return;}
  const i=tileAt(px,py);if(i!==hov){hov=i;}showTip(px,py);
}
/* Platzieren: Geist folgt dem Zeiger, das Feld unter dem Zeiger ist die Mitte */
function placeAt(px,py){const n=fpOf(place.type),[fx,fy]=screenToF(px,py),x0=Math.floor(fx-(n-1)/2),y0=Math.floor(fy-(n-1)/2);
  let i0=inb(x0,y0)?idx(x0,y0):-1;
  /* Einrasten: liegt ein Weg ein Feld daneben, rückt das Gebäude bündig an den Weg */
  if(i0>=0&&!noRoad(place.type)&&!ringTiles(i0,n).some(t=>S.tiles[t].rd)){let best=-1,bd=9;
    for(const[dx,dy]of N8){const xx=x0+dx,yy=y0+dy;if(!inb(xx,yy))continue;const j=idx(xx,yy);if(placeErr(place.type,j)||!ringTiles(j,n).some(t=>S.tiles[t].rd))continue;
      const dd=Math.hypot(xx+(n-1)/2-fx+.5,yy+(n-1)/2-fy+.5);if(dd<bd){bd=dd;best=j;}}
    if(best>=0)i0=best;}
  if(i0!==place.i0){place.i0=i0;if(i0>=0&&!place.manual)place.rot=autoRot(place.type,i0,place.rot);place.err=placeErr(place.type,i0);
    place.noRoad=i0>=0&&!noRoad(place.type)&&!ringTiles(i0,n).some(t=>RCH[t]);if(!place.err&&!has(B[place.type].cost))place.err='Zu wenig Rohstoffe';if(!place.err&&freeB()<=0)place.err='Kein Baumeister frei';renderPlacebar();}}
function startPlace(type){
  if(battle)return;selectTile(-1);place={type,i0:-1,err:'',rot:defRot(type),manual:false};$('#app').classList.add('placing');$('#stage').classList.add('placing');
  if(mouse.in)placeAt(mouse.x,mouse.y);else{const v=visBox();placeAt((v.l+v.r)/2,(v.t+v.b)/2);}
  renderPlacebar();renderBuild();if(window.innerWidth<900)$('#app').classList.remove('bopen');
}
/* Wege ziehen: gedrückt halten und ziehen legt eine Kette, ein Klick ein Feld. lv 0 entfernt Wege. */
const roadMode=()=>!!place&&place.road!==undefined;
function startRoad(lv){
  if(battle)return;selectTile(-1);place={road:lv,a:-1,i0:-1,cells:[],plan:null,err:''};$('#app').classList.add('placing');$('#stage').classList.add('placing');
  if(mouse.in)roadAt(mouse.x,mouse.y);renderPlacebar();renderBuild();if(window.innerWidth<900)$('#app').classList.remove('bopen');
}
function roadAt(px,py){const i=tileAt(px,py);if(i!==place.i0){place.i0=i;roadUpd();}}
function roadUpd(){
  const p=place;p.cells=p.a>=0&&p.i0>=0?roadLine(p.a,p.i0):p.i0>=0?[p.i0]:[];p.plan=roadPlan(p.cells,p.road);
  p.err=!p.cells.length?'':!p.plan.ok.length?(p.plan.err||(p.road?'Hier liegt schon dieser Weg':'Hier ist kein Weg')):p.road&&!has(p.plan.cost)?'Zu wenig Rohstoffe':'';
  renderPlacebar();
}
function roadCommit(){
  const p=place;if(!roadMode())return;
  if(p.cells.length&&p.plan&&p.plan.ok.length){const e=buildRoad(p.cells,p.road);if(e)toast(IC('schloss','i24')+e);else{save();renderBuild();}}
  else if(p.err)toast(IC('schloss','i24')+p.err);
  p.a=-1;roadUpd();
}
function endPlace(){place=null;$('#app').classList.remove('placing');$('#stage').classList.remove('placing');$('#placebar').hidden=true;renderBuild();}
function selectTile(i){
  if(i>=0){const a=anc(i);if(a>=0)i=a;}
  sel=(i<0||S.tiles[i].t==='water')?-1:i;demolishArm=false;inspTab='betrieb';renderSheet();
  if(sel>=0){const v=visBox(),[wx,wy]=posOf(sel),px=W/2+view.x+wx*view.z,py=H/2+view.y+wy*view.z,m=60;
    if(px<v.l+m||px>v.r-m||py<v.t+m||py>v.b-m)glideTo(wx,wy);}
}
/* Tastatur */
const KEYS=new Set();
function typing(e){const t=e.target;return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT');}
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[role=button][data-act]')){e.preventDefault();e.target.click();return;}
  if(typing(e)||e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.toLowerCase(),modal=!$('#modal').hidden;
  if(k==='escape'){if(modal){closeModal();return;}if(!$('#pop').hidden){$('#pop').hidden=true;return;}if(place){endPlace();return;}if(sel>=0){selectTile(-1);return;}if(tab!=='insel'){setTab('insel');return;}if(window.innerWidth<900)$('#app').classList.remove('bopen');return;}
  if(modal)return;
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){KEYS.add(k);e.preventDefault();return;}
  if(k===' '){e.preventDefault();setSpeed(CLK.k?0:(S.opt.lastSpeed||1));updTempo();save();return;}
  if(k>='1'&&k<='4'){setSpeed(SPEEDS[+k-1]);updTempo();save();return;}
  if(k==='b'){toggleBuild();return;}
  if(k==='h'){showHof();return;}
  if(k==='+'||k==='='){zoomAt(view.z*1.2);return;}
  if(k==='-'){zoomAt(view.z/1.2);return;}
  if(k==='x'&&sel>=0&&S.tiles[sel].b){doDemolish();return;}
  if(k==='r'){if(place&&!roadMode()){place.rot=(place.rot+1)%4;place.manual=true;renderPlacebar();return;}if(sel>=0&&S.tiles[sel].b){doRotate();return;}}
  if(k==='p'){startRoad(1);return;}
  if(k==='u'&&sel>=0&&S.tiles[sel].b){doUpgrade();return;}
});
document.addEventListener('keyup',e=>KEYS.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>KEYS.clear());
function keyPan(dt){
  if(!KEYS.size)return;let dx=0,dy=0;
  if(KEYS.has('a')||KEYS.has('arrowleft'))dx+=1;if(KEYS.has('d')||KEYS.has('arrowright'))dx-=1;
  if(KEYS.has('w')||KEYS.has('arrowup'))dy+=1;if(KEYS.has('s')||KEYS.has('arrowdown'))dy-=1;
  if(!dx&&!dy)return;const sp=720*dt/Math.hypot(dx,dy);view.x+=dx*sp;view.y+=dy*sp;glide=null;
  if(place&&mouse.in){if(roadMode())roadAt(mouse.x,mouse.y);else placeAt(mouse.x,mouse.y);}
}
/* Tooltip über der Karte */
function hideTip(){const t=$('#tip');if(!t.hidden)t.hidden=true;}
function showTip(px,py){
  const t=$('#tip');if(hov<0||battle||ptrs.size){hideTip();return;}
  const h=tipHTML(hov);if(!h){hideTip();return;}
  if(t.dataset.h!==h){t.innerHTML=h;t.dataset.h=h;}t.hidden=false;
  const r=t.getBoundingClientRect(),v=visBox();let x=px+18,y=py+18;
  if(x+r.width>v.r-8)x=px-r.width-14;if(y+r.height>H-8)y=py-r.height-14;
  t.style.left=Math.max(v.l+4,x)+'px';t.style.top=Math.max(v.t+4,y)+'px';
}
