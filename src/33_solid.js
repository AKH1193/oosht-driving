/* ================= WISE CITY: solid world. Traffic keeps its lanes clear of buildings, stale button presses
   can never freeze Tony, a last-resort rescue when he cannot move, and colliders that never pile up ================= */

/* ---------- traffic lanes measured against the buildings beside each road segment ---------- */
function segClear(w,i){const c=w.clr||(w.clr=[]);if(c[i])return c[i];
  const ax=w.pts[2*i],ay=w.pts[2*i+1],bx=w.pts[2*i+2],by=w.pts[2*i+3];const L=Math.hypot(bx-ax,by-ay)||1,dx=(bx-ax)/L,dy=(by-ay)/L;
  const lim=w.hw+1.2,r={p:lim,m:lim};
  for(const sd of[1,-1]){let best=lim;for(let t=1;t<L-1;t+=3.5){const x0=ax+dx*t,y0=ay+dy*t;
      for(let o=.6;o<best;o+=.45)if(inBuilding(x0+dy*o*sd,y0-dx*o*sd)){best=Math.max(0,o-.45);break;}}
    if(sd>0)r.p=best;else r.m=best;}
  c[i]=r;return r;}
placeAgent=function(a){
  const[ax,ay,bx,by]=segOfA(a);const L=Math.hypot(bx-ax,by-ay)||1;const dx=(bx-ax)/L,dy=(by-ay)/L;
  const t=clamp(a.d/L,0,1);
  let off=a.w.oneway?(a.t.two?a.w.hw*.45:0):a.w.hw*(a.t.two?.66:.45)*a.laneJ;
  if(off){const si=a.dir===1?a.i:a.i-1,sg=a.dir===1?1:-1;if(si>=0&&si<a.w.pts.length/2-1){const c=segClear(a.w,si);const room=(off*sg>0?c.p:c.m)-(a.t.wid||1.8)/2-.15;
    if(Math.abs(off)>room)off=Math.sign(off)*Math.max(0,room);}}
  a.x=ax+(bx-ax)*t+dy*off;a.y=ay+(by-ay)*t-dx*off;a.th=hAng(dx,dy);a.segLen=L;};

/* police, ambulances and anything else that drives freely: slide back out of a building instead of passing through it */
function unBld(o,len){if(!o)return;const fx=Math.sin(o.h),fy=-Math.cos(o.h);
  for(const k of[0,len*.45,-len*.45]){const x=o.x+fx*k,y=o.y+fy*k;const b=inBuilding(x,y);if(b){const q=pushOutOf(x,y);o.x+=q[0]-x;o.y+=q[1]-y;if(o.v)o.v*=.6;}}}
{const _uc=updateCops;updateCops=function(dt){_uc(dt);for(const c of COP.list)unBld(c,4.5);if(typeof AMB!=='undefined')for(const m of AMB.list)unBld(m,5.4);};}

/* ---------- stale presses: leaving the app, a notification shade or a hidden button never leaves a control held ---------- */
function releaseAll(){for(const k of['gas','brake','L','R','horn','atk','jump','sprint','nos'])input[k]=0;try{Snd.hornOff();}catch(e){}try{joyReset();}catch(e){}
  document.querySelectorAll('#hud .on').forEach(b=>{if(b.id!=='joyZone')b.classList.remove('on');});}
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
window.addEventListener('blur',releaseAll);window.addEventListener('pagehide',releaseAll);
/* the brake pedal does not exist on foot, so a brake press left over from driving can never hold Tony still */
{const _ufS=updateFoot;updateFoot=function(dt){if(FOOT.on&&!FOOT.ride)input.brake=0;_ufS(dt);};}
{const _gf=goFoot;goFoot=function(why,keep){input.gas=input.brake=input.L=input.R=input.nos=0;return _gf(why,keep);};}

/* ---------- last-resort rescue: pushing the stick for 2.4 s without getting anywhere resets every on-foot state ---------- */
const RESC={t:0,x:0,y:0,n:0};
function footRescue(){RESC.n++;
  try{if(ROOF.a)roofDown(false);}catch(e){}try{VAULT.on=false;SIT.on=false;}catch(e){}
  LIFE.downT=0;LIFE.z=0;LIFE.vz=0;P.elev=0;P.metroSt=null;input.brake=0;
  if(!unstick()||RESC.n>1){getUnstuck();RESC.n=0;}}
{const _ufR=updateFoot;updateFoot=function(dt){const bx=P.x,by=P.y;_ufR(dt);
  if(!FOOT.on||FOOT.ride||INT.on||LIFE.dead||METRO.ride||state!=='play'||(typeof SIT!=='undefined'&&SIT.on)||(typeof CUT!=='undefined'&&CUT.on)){RESC.t=0;return;}
  const push=Math.hypot(input.jx||0,input.jy||0)>.35||input.gas;
  if(!push){RESC.t=0;RESC.x=P.x;RESC.y=P.y;return;}
  if(RESC.t===0){RESC.x=bx;RESC.y=by;}RESC.t+=dt;
  if(RESC.t>2.4){const net=Math.hypot(P.x-RESC.x,P.y-RESC.y);RESC.t=0;if(net<.6)footRescue();else RESC.n=0;}};}

/* ---------- colliders: rebuilding a chunk no longer adds a second copy of every tree, pole and wall ---------- */
{const _ga=gAdd;gAdd=function(g,ix,iy,v){if(g===W.tG&&v&&v.x!=null){const a=g.get(ck(ix,iy));if(a)for(const o of a)if(o!==v&&Math.abs(o.x-v.x)<.01&&Math.abs(o.y-v.y)<.01&&o.r===v.r){if(v.pole&&!o.pole)o.pole=v.pole;if(v.climb&&!o.climb)o.climb=v.climb;return;}}_ga(g,ix,iy,v);};}

Object.assign(window.__oosht||{},{gAddBox:(...a)=>gAddBox(...a),segClear,releaseAll,footRescue,RESC,carCorners:(x,y,a,b)=>carCorners(x,y,a,b)});
