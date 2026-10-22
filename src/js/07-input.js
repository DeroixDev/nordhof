/* Eingabe: ziehen, kneifen, tippen */
const ptrs=new Map();let drag=null,pinch=null;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
  if(ptrs.size===1)drag={x:e.offsetX,y:e.offsetY,vx:view.x,vy:view.y,moved:false};
  if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:view.z};if(drag)drag.moved=true;}});
cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
  if(pinch&&ptrs.size===2){const[a,b]=[...ptrs.values()];zoomTo(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d);return;}
  if(drag){glide=null;const dx=e.offsetX-drag.x,dy=e.offsetY-drag.y;if(Math.abs(dx)+Math.abs(dy)>6)drag.moved=true;if(drag.moved){view.x=drag.vx+dx;view.y=drag.vy+dy;}}});
cv.addEventListener('pointerup',e=>{
  if(drag&&!drag.moved&&ptrs.size===1)selectTile(screenToTile(e.offsetX,e.offsetY));
  ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(ptrs.size===0)drag=null;
});
cv.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);drag=null;pinch=null;});
cv.addEventListener('wheel',e=>{e.preventDefault();zoomTo(view.z*(e.deltaY<0?1.1:.9));},{passive:false});
function zoomTo(z){const nz=Math.max(.5,Math.min(3.2,z)),f=nz/view.z;view.x*=f;view.y*=f;view.z=nz;}
function selectTile(i){sel=(i<0||S.tiles[i].t==='water')?-1:i;demolishArm=false;renderSheet();
  if(sel>=0){const[wx,wy]=tilePos(sel%N,(sel/N)|0),py=H/2+view.y+wy*view.z,px=W/2+view.x+wx*view.z,want=H*.24;if(W>=880){const cx=(290+W-440)/2;glide={x:view.x+(cx-px),y:view.y+(H/2-py)};}else glide={x:view.x+(W/2-px)*.5,y:view.y+(want-py)};}}
let glide=null;

