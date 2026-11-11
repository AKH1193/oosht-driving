/* ================= WISE CITY: Kempegowda International Airport, planes, flying ================= */
const AIR={runways:[],planes:[],ops:[],t:30,isKIA:false};
const FLY={on:false,pl:null,x:0,y:0,z:0,h:0,pitch:0,roll:0,v:0,thr:0,ground:true};
COL.runway=[.2,.2,.21];COL.taxiway=[.27,.27,.28];COL.apron=[.55,.55,.53];
function nearKIA(){const o=MAP.origin;return !!o&&o.lat>13.13&&o.lat<13.27&&o.lon>77.64&&o.lon<77.77;}
function rectPoly(ax,ay,bx,by,hw){const dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1,nx=-dy/l*hw,ny=dx/l*hw;return [ax+nx,ay+ny,bx+nx,by+ny,bx-nx,by-ny,ax-nx,ay-ny];}
function buildAirport(data){
  const keep=AIR.planes.length&&AIR.home===MAP.origin;AIR.runways=[];if(!keep){AIR.planes=[];AIR.ops=[];}AIR.home=MAP.origin;AIR.isKIA=nearKIA();
  for(const l of data.aero||[]){if(l.cls!=='runway'||l.p.length<4)continue;const n=l.p.length;AIR.runways.push({ax:l.p[0],ay:l.p[1],bx:l.p[n-2],by:l.p[n-1]});
    for(let i=2;i<n;i+=2)W.areas.push({pts:rectPoly(l.p[i-2],l.p[i-1],l.p[i],l.p[i+1],22.5),kind:'runway'});}
  for(const l of data.aero||[]){if(l.cls!=='taxiway'||l.p.length<4)continue;for(let i=2;i<l.p.length;i+=2)W.areas.push({pts:rectPoly(l.p[i-2],l.p[i-1],l.p[i],l.p[i+1],10),kind:'taxiway'});}
  if(!AIR.runways.length)for(const a of W.areas){if(a.kind!=='runway')continue;let best=0,A=null,B=null;const p=a.pts;for(let i=0;i<p.length;i+=2)for(let j=i+2;j<p.length;j+=2){const d=Math.hypot(p[i]-p[j],p[i+1]-p[j+1]);if(d>best){best=d;A=[p[i],p[i+1]];B=[p[j],p[j+1]];}}
    if(best>800)AIR.runways.push({ax:A[0],ay:A[1],bx:B[0],by:B[1]});}
  /* no airport data but this is Kempegowda: lay out two east-west runways and the terminal apron */
  if(!AIR.runways.length&&AIR.isKIA){
    for(const yy of[-900,950]){AIR.runways.push({ax:-2000,ay:yy,bx:2000,by:yy});W.areas.push({pts:rectPoly(-2000,yy,2000,yy,22.5),kind:'runway'});W.areas.push({pts:rectPoly(-1800,yy+(yy<0?160:-160),1800,yy+(yy<0?160:-160),11),kind:'taxiway'});}
    W.areas.push({pts:[-450,-120,450,-120,450,260,-450,260],kind:'apron'});
    const tb={pts:[-320,280,320,280,320,360,-320,360],minx:-320,miny:280,maxx:320,maxy:360,cx:0,cy:320,h:22,area:51200,col:[.75,.8,.85],tank:false,_q:0,ik:'mall',terminal:true};W.bld.push(tb);gAddBox(W.bG,tb.minx,tb.miny,tb.maxx,tb.maxy,tb);
  }
  if(!AIR.runways.length||keep)return;
  /* parked planes on the apron or beside the runway */
  const aprons=W.areas.filter(a=>a.kind==='apron');const rnd=mulberry32(42);
  for(const ap of aprons.slice(0,4)){let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9;for(let i=0;i<ap.pts.length;i+=2){mnx=Math.min(mnx,ap.pts[i]);mxx=Math.max(mxx,ap.pts[i]);mny=Math.min(mny,ap.pts[i+1]);mxy=Math.max(mxy,ap.pts[i+1]);}
    for(let k=0;k<30&&AIR.planes.length<10;k++){const x=mnx+rnd()*(mxx-mnx),y=mny+rnd()*(mxy-mny);if(!inPoly(x,y,ap.pts)||AIR.planes.some(p=>Math.hypot(p.x-x,p.y-y)<55))continue;AIR.planes.push({x,y,z:0,h:rnd()*TAU,pilot:rnd()<.7,liv:Math.floor(rnd()*4)});}}
  if(!AIR.planes.length){const r=AIR.runways[0];const dx=r.bx-r.ax,dy=r.by-r.ay,l=Math.hypot(dx,dy);for(let k=0;k<4;k++){const t=.2+k*.15;AIR.planes.push({x:r.ax+dx*t-dy/l*120,y:r.ay+dy*t+dx/l*120,z:0,h:hAng(dx,dy)+Math.PI/2,pilot:k%2===0,liv:k});}}
}
/* a twin-engine airliner in a made-up local livery */
const PLANEM=[];
function planeModel(liv){if(PLANEM[liv])return PLANEM[liv];const mb=new MB();const W0=[.95,.95,.96],acc=hexRGB(['#1B4F9C','#E35205','#0B7A4B','#7A1F5C'][liv%4]);
  mb.cyl(0,2.8,0,2,30,'z',16,W0);mb.blob(0,2.75,-15,2,1.95,3.6,W0);mb.blob(0,3.0,15.5,1.7,1.6,5.5,W0);mb.box(0,3.6,-16.8,1.4,.5,.6,[.1,.12,.16],.2);
  mb.box(-2.01,2.5,0,.02,.35,30,acc);mb.box(2.01,2.5,0,.02,.35,30,acc);
  for(let z=-12;z<=12;z+=1)for(const s of[-1,1])mb.box(s*1.98,3.35,z,.03,.32,.22,[.15,.18,.22],.6);
  for(const s of[-1,1]){for(let i=0;i<7;i++)mb.box(s*(2+i*2.2),1.9+i*.08,1.5+i*.85,2.3,.35,5.8-i*.6,W0);mb.cyl(s*6.2,1.1,-1.5,.95,3.8,'z',12,[.8,.8,.82]);mb.cyl(s*6.2,1.1,-3.4,.75,.1,'z',12,[.15,.15,.15]);
    for(let i=0;i<4;i++)mb.box(s*(1.5+i*1.4),3.6+i*.05,16.5+i*.5,1.5,.25,3-i*.5,W0);mb.cyl(s*2.6,.5,1.5,.5,.4,'x',10,[.1,.1,.1]);}
  for(let i=0;i<5;i++)mb.box(0,4.6+i*1.1,16+i*.6,.3,1.2,4-i*.4,acc);mb.cyl(0,.45,-12,.4,.3,'x',10,[.1,.1,.1]);
  PLANEM[liv]={body:mb.mesh(),len:38,wid:34};return PLANEM[liv];}
function runwayOp(){
  const r=AIR.runways[Math.floor(Math.random()*AIR.runways.length)];const dx=r.bx-r.ax,dy=r.by-r.ay,L=Math.hypot(dx,dy),h=hAng(dx,dy);
  if(Math.random()<.5)AIR.ops.push({k:'land',r,L,h,s:-3500,v:75,liv:Math.floor(Math.random()*4)});else AIR.ops.push({k:'off',r,L,h,s:60,v:0,liv:Math.floor(Math.random()*4)});
}
function updateAir(dt){
  if(!AIR.runways.length)return;
  if((AIR.t-=dt)<=0){AIR.t=60+Math.random()*60;if(AIR.ops.length<2)runwayOp();}
  for(let i=AIR.ops.length-1;i>=0;i--){const o=AIR.ops[i];
    if(o.k==='land'){if(o.s<0){o.z=Math.max(0,-o.s*Math.tan(.052));}else{o.z=0;o.v=Math.max(12,o.v-3*dt);}o.s+=o.v*dt;if(o.s>o.L*.85)AIR.ops.splice(i,1);}
    else{o.v=Math.min(85,o.v+2.6*dt);o.s+=o.v*dt;const lift=o.v>68?(o.s-o.lift0):0;if(o.v>68&&o.lift0==null)o.lift0=o.s;o.z=o.lift0!=null?Math.max(0,(o.s-o.lift0)*Math.tan(.14)):0;if(o.z>600)AIR.ops.splice(i,1);}
    const t=o.s/o.L;o.x=o.r.ax+(o.r.bx-o.r.ax)*t;o.y=o.r.ay+(o.r.by-o.r.ay)*t;}
  if(FLY.on)updateFlight(dt);
}
function drawAir(night){
  for(const p of AIR.planes){if(p===FLY.pl)continue;if(Math.hypot(p.x-CAM.eye[0],p.y-CAM.eye[2])>1500)continue;M4.model(TM,p.x,0,p.y,-p.h,0,0);drawLit(planeModel(p.liv).body,TM,{emiK:.3+night});}
  for(const o of AIR.ops){if(Math.hypot(o.x-CAM.eye[0],o.y-CAM.eye[2])>3000)continue;const pit=o.k==='land'?(o.s<0?-.05:0):(o.z>0?.14:0);M4.model(TM,o.x,o.z,o.y,-o.h,pit,0);drawLit(planeModel(o.liv).body,TM,{emiK:.3+night});
    if(night>.3){DGr.bill(o.x,o.z+2,o.y,1.2,[1,1,.9],CAM.right);}}
  if(FLY.on){M4.model(TM,FLY.x,FLY.z,FLY.y,-FLY.h,FLY.pitch,-FLY.roll);drawLit(planeModel(FLY.pl.liv).body,TM,{emiK:.3+night});}
}
function planeContext(){
  for(const p of AIR.planes){const fx=Math.sin(p.h),fy=-Math.cos(p.h),lx=-fy*-1,ly=fx*-1;const door=[p.x+fx*-11-fy*2.6,p.y+fy*-11+fx*2.6];
    if(Math.hypot(door[0]-P.x,door[1]-P.y)<5||Math.hypot(p.x-P.x,p.y-P.y)<9)return {k:'plane',p,label:p.pilot?'Pull out the pilot':profile.flags&&profile.flags.pilot?'Rent this plane (₹5,000)':'Board the empty plane'};}
  return null;
}
function startFlight(p){
  if(p.pilot){const fx=Math.sin(p.h),fy=-Math.cos(p.h);peds.push({x:p.x-fy*4,y:p.y+fx*4,h:p.h,state:'flee',v:0,pose:0,pt:0,t:0,sc:1,run:true,speed:1.6,fx:p.x,fy:p.y,side:1,role:''});p.pilot=false;say('help','man',true);}
  if(!p.pilot&&profile.flags&&profile.flags.pilot){if(profile.wallet<5000){toast('Renting a plane costs ₹5,000','bad');return;}profile.wallet-=5000;saveProfile();toast('Plane rented · ₹5,000','good');}
  else crime('plane',4);
  const pk=FOOT.parked;leaveFoot();FOOT.parked=pk;FLY.on=true;FLY.pl=p;FLY.x=p.x;FLY.y=p.y;FLY.z=0;FLY.h=p.h;FLY.pitch=0;FLY.roll=0;FLY.v=0;FLY.thr=0;FLY.ground=true;
  const i=AIR.planes.indexOf(p);if(i>=0)AIR.planes.splice(i,1);
  Snd.startEngine({base:70,range:140,wave:'sawtooth',putt:0,gears:1,vol:.9},'bus');toast('GO = throttle, BRAKE = brakes and less throttle, joystick = steer and climb. Take off above 230 km/h.','gold');
}
function updateFlight(dt){
  const F=FLY;const jx=clamp((input.jx||0)+(input.R?1:0)-(input.L?1:0),-1,1),jy=input.jy||0;
  F.thr=clamp(F.thr+((input.gas?1:0)-(input.brake?1:0))*.8*dt,0,1);
  let acc=F.thr*10-.0009*F.v*F.v;if(F.ground){acc-=.4;if(input.brake)acc-=5;}
  F.v=Math.max(0,F.v+acc*dt);
  if(F.ground){F.h+=jx*(F.v<25?.6:.15)*dt;F.roll*=.9;F.pitch=F.v>64?Math.max(0,F.pitch+(jy*.22-F.pitch)*dt*1.5):0;if(F.v>64&&F.pitch>.06){F.ground=false;toast('Airborne!','gold');}}
  else{F.roll+=(jx*.85-F.roll)*dt*2.2;F.h+=Math.sin(F.roll)*dt*(9.8/Math.max(F.v,30))*1.8;F.pitch+=(jy*.42-F.pitch)*dt*1.3;if(F.v<50)F.pitch-=dt*.3*(50-F.v)/20;}
  const vz=F.v*Math.sin(F.pitch);F.z=Math.max(0,F.z+(F.ground?0:vz*dt));
  F.x+=Math.sin(F.h)*F.v*Math.cos(F.pitch)*dt;F.y+=-Math.cos(F.h)*F.v*Math.cos(F.pitch)*dt;
  if(!F.ground&&F.z<=0){if(vz<-6.5||Math.abs(F.roll)>.45){planeCrash();return;}F.ground=true;F.pitch=0;F.roll=0;toast('Touchdown','good');Hap.bump&&Hap.bump(.6,80);}
  const b=F.z<120?inBuilding(F.x,F.y):null;if(b&&F.z<(b.h||8)+1){planeCrash();return;}
  P.x=F.x;P.y=F.y;P.h=F.h;P.s=F.v;P.vx=Math.sin(F.h)*F.v;P.vy=-Math.cos(F.h)*F.v;M4.model(P.M,F.x,F.z,F.y,-F.h,F.pitch,-F.roll);
  Snd.engine(.3+F.thr*.7,F.thr);
  $('#flyHud').hidden=false;$('#flyHud').textContent=`ALT ${Math.round(F.z)} m · THR ${Math.round(F.thr*100)}% · ${F.ground?'ON GROUND':vz>1?'CLIMB':vz<-1?'DESCEND':'LEVEL'}`;
}
function planeCrash(){const F=FLY;LIFE.fx.push({k:'boom',p:[F.x,F.z+2,F.y],t:.7});Snd.crash();CAM.shake=9;Hap.bigCrash();F.on=false;$('#flyHud').hidden=true;Snd.stopEngine();goFoot(null,true);P.x=F.x;P.y=F.y;lfDamage(999,'crash');}
function exitPlane(){const F=FLY;if(!F.ground||F.v>3){toast('Land and stop before getting out','','px',1500);return;}AIR.planes.push({x:F.x,y:F.y,z:0,h:F.h,pilot:false,liv:F.pl.liv});F.on=false;$('#flyHud').hidden=true;
  goFoot(null,true);const fx=Math.sin(F.h),fy=-Math.cos(F.h);P.x=F.x-fy*5-fx*8;P.y=F.y+fx*5-fy*8;P.h=F.h;M4.model(P.M,P.x,0,P.y,-P.h,0,0);}
function flightCam(){if(!FLY.on)return;const F=FLY;const fx=Math.sin(F.h),fy=-Math.cos(F.h);const back=CAM.mode==='cockpit'?-16:CAM.mode==='far'?70:42,up=CAM.mode==='cockpit'?3.6:CAM.mode==='far'?26:11;
  const eye=[F.x-fx*back,F.z+up,F.y-fy*back],tgt=CAM.mode==='cockpit'?[F.x+fx*60,F.z+3+Math.sin(F.pitch)*60,F.y+fy*60]:[F.x+fx*20,F.z+4,F.y+fy*20];
  CAM.eye=eye;CAM.tgt=tgt;M4.lookAt(CAM.view,eye,tgt,[Math.sin(F.roll)*Math.cos(F.h)*.5,1,Math.sin(F.roll)*Math.sin(F.h)*.5]);M4.mul(CAM.vp,CAM.proj,CAM.view);M4.invert(CAM.inv,CAM.vp);CAM.right=[CAM.view[0],0,CAM.view[8]];}
AREAS.splice(AREAS.length-1,0,{label:'Kempegowda Airport',sub:'Devanahalli · fly planes',lat:13.1986,lon:77.7066});
(function(){const box=$('#areas');const a=AREAS[AREAS.length-2];const b=document.createElement('button');b.className='area';b.innerHTML='<b></b><small></small>';b.querySelector('b').textContent=a.label;b.querySelector('small').textContent=a.sub;
  b.addEventListener('click',()=>{currentLoc={lat:a.lat,lon:a.lon,label:a.label};go('showroom');});box.insertBefore(b,box.lastElementChild);})();
Object.assign(window.__oosht||{},{AIR,FLY,startFlight,exitPlane,buildAirport,planeContext,INT,enterBuilding,leaveBuilding,doorOf,kindOf,poshAt,STREET,openLoot,peopleContext,peopleUse,policeWitness,PATROL,LIFE,FOOT,profile,crime,hurtPed,
  applyEffect:(e,v)=>applyEffect(e,v),openVenue:v=>openVenue(v),MENUS,clearChunks,findContext,exitVehicle,show,caught,settings,COP,peds:()=>peds,agents:()=>agents,goFoot,setLoc(v){currentLoc=v;},getRelease(){return RELEASE;},setState(v){state=v;},updatePatrols,W,pedLook});
