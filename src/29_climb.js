/* ================= WISE CITY: climbing. Gates, railings and compound walls are solid; face one and press JUMP
   (or the Climb over button) and Tony vaults across ================= */
const VAULT={on:false,t:0,dur:.6,x0:0,y0:0,x1:0,y1:0,h:1.4};
function climbTarget(){if(!FOOT.on||FOOT.ride||INT.on||ROOF.a||VAULT.on||LIFE.downT>0||(P.elev||0)>.5||LIFE.z>.05)return null;
  const fx=Math.sin(P.h),fy=-Math.cos(P.h);const q=[];gQuery(W.tG,P.x,P.y,2.5,q);let best=null,bd=9;
  for(const t of q){if(!t.climb)continue;const dx=t.x-P.x,dy=t.y-P.y,d=Math.hypot(dx,dy);if(d>t.r+.95)continue;const al=dx*fx+dy*fy;if(al<.05)continue;if(d<bd){bd=d;best={t,al};}}
  if(!best)return null;
  for(let e=.75;e<=2.4;e+=.35){const x=P.x+fx*(best.al+best.t.r+e),y=P.y+fy*(best.al+best.t.r+e);if(footFree(x,y))return {x,y,h:best.t.climb};}
  return null;}
function startVault(c){c=c||climbTarget();if(!c)return false;VAULT.on=true;VAULT.t=0;VAULT.x0=P.x;VAULT.y0=P.y;VAULT.x1=c.x;VAULT.y1=c.y;VAULT.h=c.h;VAULT.dur=.62;
  P.h=hAng(c.x-P.x,c.y-P.y);Snd.tone&&Snd.tone([260,330],.08,'triangle',.04);Hap.tick&&Hap.tick();return true;}
{const _ufV=updateFoot;updateFoot=function(dt){
  if(!VAULT.on){_ufV(dt);return;}
  if(!FOOT.on||FOOT.ride||INT.on){VAULT.on=false;LIFE.z=0;LIFE.vz=0;_ufV(dt);return;}
  VAULT.t+=dt;const k=Math.min(1,VAULT.t/VAULT.dur),e=k*k*(3-2*k);P.x=VAULT.x0+(VAULT.x1-VAULT.x0)*e;P.y=VAULT.y0+(VAULT.y1-VAULT.y0)*e;P.s=2;P.vx=P.vy=0;
  LIFE.z=Math.sin(k*Math.PI)*(VAULT.h+.12);LIFE.vz=0;M4.model(P.M,P.x,LIFE.z,P.y,-P.h,Math.sin(k*Math.PI)*.35,0);
  if(k>=1){VAULT.on=false;LIFE.z=0;LIFE.vz=0;P.s=0;Snd.burst&&Snd.burst(.08,200,1.2,.25,'lowpass');Hap.tick&&Hap.tick();}};}
/* JUMP in front of a gate or wall climbs it instead of hopping on the spot */
{const _luV=lifeUpdate;lifeUpdate=function(dt){if(state==='play'&&input.jump&&FOOT.on&&!FOOT.ride&&LIFE.z<=0&&!VAULT.on){const c=climbTarget();if(c&&startVault(c))input.jump=0;}
  if(VAULT.on)input.jump=0;_luV(dt);if(VAULT.on){LIFE.vz=0;}};}
{const _fcV=findContext;findContext=function(){if(VAULT.on)return null;const c=climbTarget();if(c)return {k:'item',it:{fn:()=>startVault()},label:'Climb over'};return _fcV();};}
Object.assign(window.__oosht||{},{VAULT,climbTarget,startVault,vehRefs,vehDims,vehTop,roofLand});
