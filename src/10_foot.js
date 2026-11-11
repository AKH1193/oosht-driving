/* ================= licence seizure, the court, life on foot ================= */
const FOOT={on:false,walk:0,stam:100,ride:null,lift:null,job:null,unload:null,begCool:0,liftCool:0,look:11,pose:0,pt:0};
const MAXCH=5;
if(!Array.isArray(profile.pending))profile.pending=[];
if(profile.seized==null)profile.seized=false;
const pendingTotal=()=>profile.pending.reduce((s,c)=>s+c.f,0);
function addChallan(code){const f=FINES[code];if(!f)return;profile.pending.push({c:code,l:f[0],f:f[1],t:Date.now()});if(profile.pending.length>=MAXCH)profile.seized=true;saveProfile();}

/* ---------- the court: a real courthouse from the map, otherwise one on a main road ---------- */
function buildCourt(){
  W.court=null;
  const lot=(s,t,name,real)=>{const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len,lx=dy,ly=-dx,mx=s.ax+dx*t,my=s.ay+dy*t;
    const h=hAng(-lx,-ly),sx=mx+lx*(s.w.hw+13),sy=my+ly*(s.w.hw+13);clearLot(sx,sy,h,13,10,true);
    W.court={x:mx+lx*(s.w.hw-1.4),y:my+ly*(s.w.hw-1.4),sx,sy,h,name,real};};
  for(const q of W.pois){if(!/court/i.test(q.cls+' '+q.sub+' '+q.name))continue;const n=nearestSeg(q.x,q.y,60,s=>s.len>30&&!s.w.br);if(n.seg){lot(n.seg,n.seg.len*.5,'District Magistrate Court',true);return;}}
  /* about 1.5 km from where you started, on the best main road there */
  let best=null,bs=-1e9;
  for(const s of W.segs){if(s.len<50||s.w.br||RANK[s.w.cls]<2)continue;const mx=(s.ax+s.bx)/2,my=(s.ay+s.by)/2,d=Math.hypot(mx,my);
    const sc=-Math.abs(d-1500)+RANK[s.w.cls]*60-(nearSignal(mx,my,40)?500:0)-(W.fuels||[]).concat(W.garages).some(g=>Math.hypot(g.x-mx,g.y-my)<60)*800;if(sc>bs){bs=sc;best=s;}}
  if(!best)best=W.segs.reduce((b,s)=>s.len>(b?b.len:0)?s:b,null);
  if(best)lot(best,best.len*.5,'District Magistrate Court',false);
}
function courtAt(mb,c){
  mb.save();mb.tr(c.sx,0,c.sy);mb.rotY(-c.h);
  const wall=[.72,.32,.24],trim=[.95,.93,.88],roof=[.45,.45,.47];
  mb.box(0,.3,-1,26,.6,4,[.82,.8,.76]);for(let i=0;i<3;i++)mb.box(0,.12+i*.2,-3.4+i*.5,20,.2,1,[.85,.83,.79]);
  mb.box(0,5,4,24,10,14,wall);mb.box(0,10.3,4,24.6,.6,14.6,trim);mb.box(0,11.4,4,10,1.6,8,wall);mb.box(0,12.4,4,10.6,.4,8.6,trim);
  for(let i=-4;i<=4;i++)mb.cyl(i*2.3,4.8,-3,.4,8.4,'y',10,trim);
  mb.box(0,9.4,-3,22,1.2,1.6,trim);mb.tbox(0,10,-3,22,1.6,.4,1.2,2.6,trim);
  for(const x of[-9,-5.5,5.5,9])for(const y of[2.6,6.6])mb.box(x,y,-3.05,1.6,2.4,.1,[.2,.24,.3]);
  mb.box(0,2.2,-3.05,3,4,.1,[.28,.18,.1]);
  mb.box(-11,7,-6,.15,14,.15,[.8,.8,.8]);mb.box(-10.2,13,-6,1.5,.9,.05,[1,.55,.15]);mb.box(-10.2,12.1,-6,1.5,.9,.05,[.95,.95,.95]);mb.box(-10.2,11.2,-6,1.5,.9,.05,[.1,.5,.2]);
  mb.restore();
}
function courtTex(){return textTex('court',(c,w,h)=>{c.fillStyle='#F4F1E8';c.fillRect(0,0,w,h);c.strokeStyle='#5A1F14';c.lineWidth=8;c.strokeRect(6,6,w-12,h-12);c.fillStyle='#5A1F14';c.textAlign='center';c.textBaseline='middle';c.font='700 42px Arial, sans-serif';c.fillText('DISTRICT MAGISTRATE COURT',w/2,h*.38);c.font='600 26px Arial, sans-serif';c.fillStyle='#333';c.fillText('Traffic challans are paid here',w/2,h*.74);},640,128);}

/* ---------- road graph and shortest routes for rides ---------- */
let GR=null,GRV=-1;
function graph(){
  if(GRV===W.version&&GR)return GR;const adj=new Map(),pos=new Map();
  const add=(a,b,L,leg)=>{let l=adj.get(a);if(!l){l=[];adj.set(a,l);}l.push([b,L,leg]);};
  for(const w of W.ways){const n=w.pts.length/2;for(let k=0;k<n;k++)pos.set(w.nodes[k],[w.pts[2*k],w.pts[2*k+1]]);
    for(let k=0;k<n-1;k++){const a=w.nodes[k],b=w.nodes[k+1];const L=Math.hypot(w.pts[2*k+2]-w.pts[2*k],w.pts[2*k+3]-w.pts[2*k+1]);if(L<.01)continue;
      if(!w.oneway||!w.rev)add(a,b,L,{w,i:k,dir:1});if(!w.oneway||w.rev)add(b,a,L,{w,i:k+1,dir:-1});}}
  GR={adj,pos};GRV=W.version;return GR;
}
function nodeNear(x,y){const n=nearestSeg(x,y,120,s=>!s.w.br);if(!n.seg)return null;const s=n.seg;const da=Math.hypot(s.ax-x,s.ay-y),db=Math.hypot(s.bx-x,s.by-y);return s.w.nodes[da<db?s.i:s.i+1];}
/* shortest route between two road nodes, as a list of road legs that vehicles follow lane by lane */
function findLegs(a,b){
  const G=graph();if(a==null||b==null)return null;if(a===b)return {legs:[],len:0};const goal=G.pos.get(b);if(!goal)return null;
  const g=new Map([[a,0]]),from=new Map(),heap=[[0,a]],done=new Set();
  const push=it=>{heap.push(it);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
  let guard=0;
  while(heap.length&&guard++<200000){const[,u]=pop();if(u===b)break;if(done.has(u))continue;done.add(u);
    for(const[v,L,leg]of G.adj.get(u)||[]){const ng=g.get(u)+L;if(ng<(g.has(v)?g.get(v):1e18)){g.set(v,ng);from.set(v,[u,leg]);const p=G.pos.get(v);push([ng+Math.hypot(p[0]-goal[0],p[1]-goal[1]),v]);}}}
  if(!g.has(b))return null;
  const legs=[];let k=b;while(k!==a){const f=from.get(k);if(!f)return null;legs.push(f[1]);k=f[0];}legs.reverse();
  return {legs,len:g.get(b)};
}
function findPath(a,b){const r=findLegs(a,b);if(!r)return null;const G=graph();const pts=[G.pos.get(a)];for(const l of r.legs){const q=legPts(l);pts.push([q[2],q[3]]);}return pts;}
function legPts(l){const w=l.w,i=l.i,j=l.i+l.dir;return [w.pts[2*i],w.pts[2*i+1],w.pts[2*j],w.pts[2*j+1]];}
function legLen(l){const p=legPts(l);return Math.hypot(p[2]-p[0],p[3]-p[1]);}
const legEnd=l=>l.w.nodes[l.i+l.dir];
/* route from a node to the kerb nearest a point: road legs, then part of the last road up to the stop */
function routeTo(startKey,x,y){
  const e=nearestSeg(x,y,80,q=>!q.w.br);if(!e.seg)return null;const s=e.seg;
  const t=clamp(((x-s.ax)*(s.bx-s.ax)+(y-s.ay)*(s.by-s.ay))/(s.len*s.len),0,1);
  let best=null;
  for(const[k,leg,stop]of[[s.w.nodes[s.i],{w:s.w,i:s.i,dir:1},t*s.len],[s.w.nodes[s.i+1],{w:s.w,i:s.i+1,dir:-1},(1-t)*s.len]]){
    const p=findLegs(startKey,k);if(!p)continue;const L=p.len+stop;if(!best||L<best.L)best={legs:p.legs.concat([leg]),stop:Math.max(.5,stop),L};}
  return best;
}
function laneShift(pts,off){const out=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;out.push([pts[i][0]+dy/l*off,pts[i][1]-dx/l*off]);}return out;}
const pathLen=pts=>{let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;};

/* ---------- switching between driving and walking ---------- */
function goFoot(why,keep){
  FOOT.on=true;FOOT.tip=6;FOOT.ride=null;FOOT.lift=null;FOOT.stam=keep?Math.min(FOOT.stam||maxStam(),maxStam()):maxStam();FOOT.walk=0;
  Snd.stopEngine();Snd.hornOff();apshReset();intruder=null;trip=null;
  if(!keep){Snd.sirenOff();resetChase();FOOT.parked=null;
    const n=nearestSeg(P.x,P.y,30);if(n.seg){const s=n.seg;const t=clamp(((P.x-s.ax)*(s.bx-s.ax)+(P.y-s.ay)*(s.by-s.ay))/(s.len*s.len),0,1);const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;P.x=s.ax+dx*t*s.len+dy*(s.w.hw+1.1);P.y=s.ay+dy*t*s.len-dx*(s.w.hw+1.1);P.h=s.h;}}
  P.s=P.vx=P.vy=0;P.len=.6;P.wid=.5;P.cond=100;P.skin=keep?P.skin:null;
  state='play';show('play');footHud(true);
  if(why)toast(why,'bad');
}
function resetChase(){COP.list=[];COP.level=0;COP.off=[];COP.caughtT=0;COP.lostT=0;COP.pedHit=false;P.rash=0;$('#wanted').hidden=true;Snd.sirenOff();}
function footHud(on){
  $('#footBar').hidden=!on;$('#rideBar').hidden=true;$('#btnHorn').textContent=on?'RUN':'HORN';
  $('#limit').hidden=on;$('#fuelbar').parentElement.parentElement.hidden=on;
  noticeKey='~';
}
function leaveFoot(){FOOT.on=false;FOOT.ride=null;footHud(false);const pm=curModel();P.len=pm.len;P.wid=pm.wid;}

/* nearest point just outside the building that contains (x,y) */
function pushOutOf(x,y){
  for(let k=0;k<4;k++){const b=inBuilding(x,y);if(!b)break;const p=b.pts,n=p.length/2;let best=null,bd=1e9;
    for(let i=0;i<n;i++){const j=(i+1)%n;const ax=p[2*i],ay=p[2*i+1],bx=p[2*j],by=p[2*j+1];const L2=(bx-ax)**2+(by-ay)**2||1;const t=clamp(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/L2,0,1);const qx=ax+(bx-ax)*t,qy=ay+(by-ay)*t;const d=Math.hypot(qx-x,qy-y);if(d<bd){bd=d;best=[qx,qy];}}
    if(!best)break;const dx=best[0]-x,dy=best[1]-y,l=Math.hypot(dx,dy)||1;x=best[0]+dx/l*.45;y=best[1]+dy/l*.45;}
  return [x,y];}
/* ---------- walking and running ---------- */
function updateFoot(dt){
  if(FOOT.ride){updateRide(dt);if(FOOT.ride&&FOOT.ride.phase!=='pickup')return;}
  if(LIFE.dead||METRO.ride)return;
  const jm=Math.min(1,Math.hypot(input.jx||0,input.jy||0));
  const carrying=FOOT.job&&FOOT.job.carry;const run=(input.horn||input.sprint||jm>.97&&FOOT.runHold>.35)&&FOOT.stam>2&&!carrying;const top=carrying?1.8:run?6.2:2.3;
  FOOT.runHold=jm>.97?(FOOT.runHold||0)+dt:0;
  if(jm>.15){/* joystick: push the way you want to go, relative to the camera; push all the way to run */
    if(CAM.mode==='cockpit'){P.h+=input.jx*2.2*dt;P.s+=clamp(top*Math.max(0,input.jy)-P.s,-8*dt,6*dt);}
    else{const rel=Math.atan2(input.jx,input.jy),tgt=CAM.yaw+rel;P.h+=angDiff(P.h,tgt)*Math.min(1,dt*10);
      P.s+=clamp(top*Math.min(1,jm*1.1)-P.s,-8*dt,6*dt);
      /* the camera drifts in behind you only while you walk roughly away from it */
      if(Math.abs(rel)<1.1&&!CAM.lookHeld)CAM.yaw+=angDiff(CAM.yaw,P.h)*Math.min(1,dt*.9);}}
  else{let steerIn=(input.R?1:0)-(input.L?1:0);if(settings.steer==='tilt')steerIn=clamp(input.tilt,-1,1);
    P.h+=steerIn*2.4*dt;
    if(input.gas)P.s+=clamp(top-P.s,-8*dt,6*dt);else P.s=Math.max(0,P.s-9*dt);}
  if(input.brake)P.s=Math.max(0,P.s-14*dt);
  if(run&&P.s>2.6)FOOT.stam=Math.max(0,FOOT.stam-10*dt*(100/maxStam()));else FOOT.stam=Math.min(maxStam(),FOOT.stam+(P.s<.3?12:6)*dt*(LIFE.boost>0?2:1));
  const fx=Math.sin(P.h),fy=-Math.cos(P.h);P.vx=fx*P.s;P.vy=fy*P.s;
  const ox=P.x,oy=P.y,sx=P.vx*dt,sy=P.vy*dt;
  const treeAt2=(x,y)=>{const tq=[];gQuery(W.tG,x,y,2,tq);for(const t of tq)if(Math.hypot(t.x-x,t.y-y)<(t.r||.3)+.22)return true;const pq=[];gQuery(W.pvG||new Map(),x,y,4,pq);for(const v of pq)if(!CITY.taken.has(v.key)&&carDist(v,v.len,v.wid,x,y)<.28)return true;return false;};
  const blocked=(x,y)=>treeAt2(x,y)||inBuilding(x,y)||inBuilding(x+fx*.32,y+fy*.32)||inBuilding(x-fy*.24+fx*.1,y+fx*.24+fy*.1)||inBuilding(x+fy*.24+fx*.1,y-fx*.24+fy*.1);
  if(inBuilding(ox,oy)){const o=pushOutOf(ox,oy);P.x=o[0];P.y=o[1];P.s*=.5;}
  else if(!blocked(ox+sx,oy+sy)){P.x=ox+sx;P.y=oy+sy;}
  else if(Math.abs(sx)>1e-4&&!blocked(ox+sx,oy)){P.x=ox+sx;P.s*=.97;}
  else if(Math.abs(sy)>1e-4&&!blocked(ox,oy+sy)){P.y=oy+sy;P.s*=.97;}
  else{P.s*=.4;}
  for(const a of agents){const d=Math.hypot(a.x-P.x,a.y-P.y);const r=a.t.wid*.55+.35;if(d<r){P.x=a.x+(P.x-a.x)/(d||1)*r;P.y=a.y+(P.y-a.y)/(d||1)*r;}}
  for(const c of animals){const d=Math.hypot(c.x-P.x,c.y-P.y);const r=(c.kind==='cow'?1:.35)+.3;if(d<r){P.x=c.x+(P.x-c.x)/(d||1)*r;P.y=c.y+(P.y-c.y)/(d||1)*r;}}
  const nr=nearestSeg(P.x,P.y,14);P.road=nr.seg;P.offroad=!nr.seg||nr.edge>1.4;
  /* sweat coins: every 10 seconds on the move earns 5 */
  if(P.s>.9){FOOT.walk+=dt;if(FOOT.walk>=10){FOOT.walk-=10;profile.wallet+=5;session.fare+=5;saveProfile();toast('+5 sweat coins (₹5)','good','sweat',500);Snd.coin();}}
  FOOT.pt+=dt*(P.s>.3?Math.min(P.s,4.5)/1.2:0);if(FOOT.pt>.33){FOOT.pt=0;FOOT.pose^=1;}
  M4.model(P.M,P.x,LIFE.z,P.y,-P.h,0,0);
  session.m+=P.s*dt;
  if(FOOT.lift){FOOT.lift.t-=dt;if(FOOT.lift.t<=0){const ok=Math.random()<.4;FOOT.lift=null;if(ok)sendRide('lift');else{toast('Nobody stopped. Try again in a bit.','');FOOT.liftCool=6;}}}
  FOOT.liftCool-=dt;FOOT.begCool-=dt;FOOT.tip-=dt;
  if(FOOT.job&&FOOT.job.kind==='deliver'){const j=FOOT.job;j.left-=dt;if(Math.hypot(j.x-P.x,j.y-P.y)<14){profile.wallet+=j.pay;session.fare+=j.pay;saveProfile();toast(`Parcel delivered · ₹${j.pay}`,'gold');Snd.chime();Hap.success();FOOT.job=null;}
    else if(j.left<=0){toast('Too late. The delivery was cancelled.','bad');FOOT.job=null;}}
  if(FOOT.unload){const u=FOOT.unload;u.left-=dt;$('#ulTime').textContent=Math.ceil(Math.max(0,u.left))+' s';if(u.left<=0){$('#unload').hidden=true;FOOT.unload=null;$('#ulBtn').textContent='UNLOAD';toast(u.gym?'Too slow. Rest and try again.':'Not fast enough. No pay this time.','bad');}}
  if(W.court&&profile.pending.length&&Math.hypot(W.court.x-P.x,W.court.y-P.y)<14&&P.s<.5&&!FOOT.courtLock){FOOT.courtLock=true;openCourt();}
  if(W.court&&FOOT.courtLock&&Math.hypot(W.court.x-P.x,W.court.y-P.y)>25)FOOT.courtLock=false;
}

/* ---------- autos, cabs and lifts ---------- */
function sendRide(kind){
  const tk=kind==='auto'?'auto':kind==='cab'?'taxi':kind==='bus'?'bus':['sakhi','pratham','hatch','suv','maharaja','regent'][Math.floor(Math.random()*6)];
  const t=TT.find(q=>q.k===tk);const col=t.cols?t.cols[Math.floor(Math.random()*t.cols.length)]:null;
  const ns=nearestSeg(P.x,P.y,60,q=>!q.w.br);if(!ns.seg){toast('Walk to a road first','bad');return;}
  let route=null;
  for(let tries=0;tries<50&&!route;tries++){const s=W.segs[Math.floor(Math.random()*W.segs.length)];if(s.w.br)continue;const d=Math.hypot(s.ax-P.x,s.ay-P.y);if(d<50||d>150)continue;
    const r=routeTo(s.w.nodes[s.i],P.x,P.y);if(r&&r.L>40&&r.L<320)route=r;}
  if(!route)route=routeTo(ns.seg.w.nodes[ns.seg.i],P.x,P.y)||routeTo(ns.seg.w.nodes[ns.seg.i+1],P.x,P.y);
  if(!route){toast('No vehicle can reach this spot. Walk to a bigger road.','bad');return;}
  const rate=kind==='cab'?{base:60,km:22,name:'cab'}:kind==='auto'?{base:36,km:18,name:'auto'}:kind==='bus'?{base:15,km:3,name:'BMTC bus'}:{base:0,km:0,name:'lift'};
  FOOT.ride={kind,t,col,model:trafficModel(t,kind==='bus'?bmtcLivery():col),legs:route.legs,li:0,d:0,stop:route.stop,first:true,x:0,y:0,h:0,v:0,phase:'pickup',rate,meter:0,dist:0,tt:0,segT:0,lim:8};
  rideStep(FOOT.ride,0);
  toast(kind==='lift'?'Someone is stopping for you':kind==='bus'?'A BMTC bus is coming to the stop':`Your ${rate.name} is on the way`,'good');
  $('#footBar').hidden=true;$('#rideBar').hidden=false;$('#rbSkip').hidden=true;
}
/* move along the road legs exactly like traffic does: lane by lane, never across buildings */
function rideStep(R,dt){
  let leg=R.legs[R.li];R.d+=R.v*dt;
  for(let guard=0;guard<8;guard++){const L=legLen(leg);const last=R.li===R.legs.length-1;const end=last?Math.min(R.stop,L):L;
    if(R.d<end)break;if(last){R.d=end;R.done=true;break;}R.d-=L;R.li++;leg=R.legs[R.li];}
  const a={w:leg.w,i:leg.i,dir:leg.dir,d:R.d,t:R.t,laneJ:1};placeAgent(a);
  if(R.first){R.x=a.x;R.y=a.y;R.h=a.th;R.first=false;}
  const k=Math.min(1,dt*7);R.x+=(a.x-R.x)*k;R.y+=(a.y-R.y)*k;R.h+=angDiff(R.h,a.th)*Math.min(1,dt*5);
}
function rideLeft(R){let L=0;for(let i=R.li;i<R.legs.length;i++){const ll=i===R.legs.length-1?Math.min(R.stop,legLen(R.legs[i])):legLen(R.legs[i]);L+=ll;}return Math.max(0,L-R.d);}
function rideDest(){
  const opts=[];
  if(W.court)opts.push({name:'District Magistrate Court',x:W.court.x,y:W.court.y});
  if(FOOT.job&&FOOT.job.kind==='deliver')opts.push({name:'Delivery: '+FOOT.job.name,x:FOOT.job.x,y:FOOT.job.y});
  const nf=nearestFuel(P.x,P.y);if(nf)opts.push({name:nf.g.name+' fuel station',x:nf.g.x,y:nf.g.y});
  const far=W.places.filter(p=>Math.hypot(p.x-P.x,p.y-P.y)>250).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y));for(const pl of far.slice(0,2))opts.push({name:pl.name,x:pl.x,y:pl.y});
  return opts;
}
function openRideMenu(){
  const R=FOOT.ride;state='ride';R.phase='wait';releaseAll();
  $('#rdTitle').textContent=R.kind==='lift'?'Where are you headed?':'Where to?';
  $('#rdText').textContent=R.kind==='lift'?'The rider offers a free lift.':`${R.kind==='auto'?'Auto meter':'Cab fare'}: ₹${R.rate.base} plus ₹${R.rate.km} per km. Wallet ₹${fmtINR(profile.wallet)}.`;
  const box=$('#rdOpts');box.innerHTML='';
  const cur=R.legs[R.li],rest=legLen(cur)-R.d;
  for(const o of rideDest()){const route=routeTo(legEnd(cur),o.x,o.y);if(!route)continue;const L=route.L+rest;const fare=Math.round(R.rate.base+L/1000*R.rate.km);
    const b=document.createElement('button');b.className='btn';b.textContent=`${o.name} · ${(L/1000).toFixed(1)} km${R.kind==='lift'?'':' · about ₹'+fare}`;
    b.disabled=R.kind!=='lift'&&profile.wallet<fare;
    b.addEventListener('click',()=>startRide(o,route));box.appendChild(b);}
  if(!box.children.length){const d=document.createElement('p');d.textContent='No road route from here. Cancel and try from a bigger road.';box.appendChild(d);}
  show('rideScr');
}
function startRide(o,route){
  const R=FOOT.ride;const cur=R.legs[R.li];
  R.legs=[cur].concat(route.legs);R.li=0;R.stop=route.stop;R.done=false;R.phase='ride';R.dest=o;R.meter=R.rate.base;R.dist=0;R.tt=0;
  P.len=R.t.len;P.wid=R.t.wid;
  state='play';show('play');footHud(true);$('#footBar').hidden=true;$('#rideBar').hidden=false;$('#rbSkip').hidden=false;
  const vk=vehKeyFor(R.t.k);Snd.startEngine(VEH[vk].engine,vk);Hap.tick();
}
const boardPoint=R=>{const lx=-Math.cos(R.h),ly=-Math.sin(R.h),fx=Math.sin(R.h),fy=-Math.cos(R.h);const off=R.t.wid/2+.45,back=R.t.two?.45:R.t.k==='auto'?.5:0;return [R.x+lx*off-fx*back,R.y+ly*off-fy*back];};
function seatAnchor(R){const e=R.model.eye||[.7,2.1,-R.t.len/2+1.2];if(R.t.k==='bus')return [-.6,.95,0];if(R.t.two)return [0,e[1]-1.55,e[2]+.52];if(R.t.k==='auto')return [0,-.1,.55];return [-e[0],e[1]-1.6,e[2]];}
/* the driver follows the same rules as everyone else: red lights, queues, people crossing */
function rideRules(R,vt){
  const gap=R.t.len/2+3,lat=R.t.wid/2+.55;
  for(const b of agents)if(inFront(R.x,R.y,R.h,b.x,b.y,gap+b.t.len/2+1.5,(R.t.wid+b.t.wid)/2+.2))vt=Math.min(vt,Math.max(0,b.v-1));
  for(const c of COP.list)if(inFront(R.x,R.y,R.h,c.x,c.y,gap+4,(R.t.wid+1.9)/2+.2))vt=0;
  for(const w of LIFE.wrecks)if(inFront(R.x,R.y,R.h,w.x,w.y,gap+4,(R.t.wid+1.8)/2))vt=0;
  if(FOOT.parked&&inFront(R.x,R.y,R.h,FOOT.parked.x,FOOT.parked.y,gap+4,(R.t.wid+1.8)/2))vt=0;
  for(const p of peds){if(p.state==='static'&&p.kind!=='vendor')continue;if(inFront(R.x,R.y,R.h,p.x,p.y,gap+6,lat))vt=0;else if(p.cart!=null&&inFront(R.x,R.y,R.h,p.cx,p.cy,gap+5,lat+.4))vt=0;}
  for(const n of animals)if(inFront(R.x,R.y,R.h,n.x,n.y,gap+6,lat+(n.kind==='cow'?.6:0)))vt=0;
  for(const c of LIFE.copPeds)if(!c.dead&&inFront(R.x,R.y,R.h,c.x,c.y,gap+5,lat))vt=0;
  if(R.phase!=='ride'&&inFront(R.x,R.y,R.h,P.x,P.y,gap+3,lat))vt=0;
  const sa=signalAhead(R.x,R.y,R.h,55);
  if(sa&&sa.d>sa.S.R-.5){const arm=sigArmFor(sa.S,R.x,R.y);const st=sigState(sa.S,arm.ph,GT);
    if(st[0]==='R'||(st[0]==='A'&&sa.d-sa.S.R>9)){const stop=sa.d-sa.S.R-R.t.len/2-.6;vt=Math.min(vt,Math.sqrt(Math.max(0,2*3.2*stop)));R.redWait=true;}else R.redWait=false;}
  else R.redWait=false;
  return vt;
}
function rideToTraffic(R){
  const leg=R.legs&&R.legs[R.li];if(!leg)return;
  const a={w:leg.w,i:leg.i,dir:leg.dir,d:R.d,v:Math.max(R.v,2),t:R.t,col:R.col,model:R.model,x:R.x,y:R.y,h:R.h,th:R.h,stop:1.2,brake:false,laneJ:1,turnSlow:0,k:1,horn:0,lean:0};
  placeAgent(a);a.h=R.h;agents.push(a);
}
function updateRide(dt){
  const R=FOOT.ride;R.tt+=dt;
  const walkAnim=()=>{FOOT.pt+=dt*1.6;if(FOOT.pt>.33){FOOT.pt=0;FOOT.pose^=1;}};
  if(R.phase==='board'){const bp=boardPoint(R);const dx=bp[0]-P.x,dy=bp[1]-P.y,d=Math.hypot(dx,dy);
    if(d>.25&&R.tt<3.5){const sp=Math.min(d/dt,1.9);P.x+=dx/d*sp*dt;P.y+=dy/d*sp*dt;P.h=hAng(dx,dy);P.s=1.9;walkAnim();$('#rideTxt').textContent='Getting on…';}
    else{P.s=0;P.h=R.h;M4.model(P.M,P.x,0,P.y,-P.h,0,0);openRideMenu();return;}
    M4.model(P.M,P.x,0,P.y,-P.h,0,0);return;}
  if(R.phase==='wait')return;
  if(R.phase==='alight'){if(R.tt<1){const lx=-Math.cos(R.h),ly=-Math.sin(R.h);if(!inBuilding(P.x+lx*.5,P.y+ly*.5)){P.x+=lx*1.4*dt;P.y+=ly*1.4*dt;}P.h=hAng(lx,ly);P.s=1.4;walkAnim();M4.model(P.M,P.x,0,P.y,-P.h,0,0);}
    else{P.s=0;rideToTraffic(R);finishRide();}return;}
  if(R.done){R.v=0;if(R.phase==='pickup'){R.phase='board';R.tt=0;$('#rideTxt').textContent='Getting on…';return;}arrive();return;}
  if((R.segT-=dt)<=0){R.segT=.5;const n=nearestSeg(R.x,R.y,20);R.lim=n.seg?(CRUISE[n.seg.w.cls]||8):8;}
  let vt=Math.min(R.lim*(R.t.cruise||1)*1.05,R.t.k==='auto'?11:R.t.k==='bus'?11:16);
  const leg=R.legs[R.li],nxt=R.legs[R.li+1];
  if(nxt){const q0=legPts(leg),q1=legPts(nxt);const turn=Math.abs(angDiff(hAng(q0[2]-q0[0],q0[3]-q0[1]),hAng(q1[2]-q1[0],q1[3]-q1[1])));if(legLen(leg)-R.d<16&&turn>.5)vt=Math.min(vt,turn>1.2?4:6);}
  const left=rideLeft(R);
  vt=Math.min(vt,Math.sqrt(2*2.6*Math.max(0,left-.3))+.3);
  vt=rideRules(R,vt);
  R.v+=clamp(vt-R.v,-8*dt,2.6*dt);if(R.v<0)R.v=0;
  const before=R.d+R.li*1e5;rideStep(R,dt);const step=R.v*dt;
  if(R.phase==='ride'){R.dist+=step;R.meter=R.rate.base+R.dist/1000*R.rate.km;P.x=R.x;P.y=R.y;P.h=R.h;P.s=R.v;P.vx=Math.sin(R.h)*R.v;P.vy=-Math.cos(R.h)*R.v;M4.model(P.M,R.x,0,R.y,-R.h,0,0);Snd.engine(R.v/14,R.v<vt-.5?1:0);
    $('#rideTxt').textContent=(R.kind==='lift'?'Riding along':`${R.kind==='auto'?'Auto meter':R.kind==='bus'?'Bus ticket':'Cab fare'} ₹${Math.round(R.meter)}`)+` · ${Math.round(left)} m to go`+(R.redWait&&R.v<1?' · waiting at the signal':'');}
  else $('#rideTxt').textContent=`Your ${R.rate.name} is ${Math.round(Math.hypot(R.x-P.x,R.y-P.y))} m away`+(R.redWait&&R.v<1?' · stopped at a signal':'');
}
function arrive(){
  const R=FOOT.ride;const fare=R.kind==='lift'?0:Math.round(R.meter);const paid=Math.min(fare,profile.wallet);profile.wallet-=paid;saveProfile();
  Snd.stopEngine();R.v=0;R.phase='alight';R.tt=0;P.len=.6;P.wid=.5;
  const bp=boardPoint(R);P.x=bp[0];P.y=bp[1];P.s=P.vx=P.vy=0;P.h=R.h;M4.model(P.M,P.x,0,P.y,-P.h,0,0);
  toast(R.kind==='lift'?`Dropped at ${R.dest.name}. Say thanks!`:`Arrived · paid ₹${paid}${paid<fare?' (all you had)':''}`,'good');
  $('#rbSkip').hidden=true;$('#rideTxt').textContent='Getting off…';
}
function finishRide(){FOOT.ride=null;FOOT.courtLock=false;P.len=.6;P.wid=.5;$('#rideBar').hidden=true;$('#footBar').hidden=false;}
function endRide(skip){
  const R=FOOT.ride;if(!R||R.phase!=='ride')return;
  if(skip){const L=rideLeft(R);R.dist+=L;R.meter=R.rate.base+R.dist/1000*R.rate.km;R.li=R.legs.length-1;R.d=R.stop;R.first=true;rideStep(R,0);}
  arrive();
}
$('#rbSkip').addEventListener('click',()=>{if(METRO.ride){metroArrive();return;}endRide(true);});
$('#rdCancel').addEventListener('click',()=>{const R=FOOT.ride;if(R)rideToTraffic(R);FOOT.ride=null;P.len=.6;P.wid=.5;state='play';show('play');footHud(true);toast('Ride cancelled','');});
$('#fbAuto').addEventListener('click',()=>{if(profile.wallet<40){toast('You need at least ₹40 for an auto','bad');return;}sendRide('auto');});
$('#fbCab').addEventListener('click',()=>{if(profile.wallet<70){toast('You need at least ₹70 for a cab','bad');return;}sendRide('cab');});
$('#fbLift').addEventListener('click',()=>{if(FOOT.lift||FOOT.liftCool>0){toast('Keep waving…','','lw',1500);return;}FOOT.lift={t:3+Math.random()*3};toast('Waving for a lift…','');});

/* ---------- asking for money ---------- */
$('#fbBeg').addEventListener('click',()=>{
  if(FOOT.begCool>0)return;FOOT.begCool=3;
  const busy=nearSignal(P.x,P.y,45)||W.pois.some(q=>q.sub==='place_of_worship'&&Math.hypot(q.x-P.x,q.y-P.y)<70)||peds.filter(p=>Math.hypot(p.x-P.x,p.y-P.y)<20).length>3;
  if(Math.random()<(busy?.45:.18)){const amt=[1,2,5,5,10,10,10,20,20,50][Math.floor(Math.random()*10)];profile.wallet+=amt;session.fare+=amt;saveProfile();toast(`Someone gave you ₹${amt}`,'good');Snd.coin();}
  else toast(busy?'People walked past':'Hardly anyone here. Try near a signal or temple.','');
});

/* ---------- odd jobs ---------- */
$('#fbJob').addEventListener('click',jobsMenu);
$('#jbClose').addEventListener('click',()=>{state='play';show('play');footHud(true);});
$('#ulBtn').addEventListener('pointerdown',e=>{e.preventDefault();const u=FOOT.unload;if(!u)return;u.n++;Hap.tick();const need=u.need||30;$('#ulTxt').textContent=`${u.n} / ${need}`;
  if(u.n>=need){const pay=u.gym?0:(u.pay||45);FOOT.unload=null;$('#unload').hidden=true;$('#ulBtn').textContent='UNLOAD';if(u.gym){gymDone();return;}profile.wallet+=pay;session.fare+=pay;saveProfile();toast(`Job done · ₹${pay}`,'gold');Snd.chime();}});

/* ---------- paying at the court ---------- */
function openCourt(){
  state='court';releaseAll();Snd.stopEngine();
  const list=$('#ctList');list.innerHTML='';const tot=pendingTotal();
  for(const c of profile.pending){const d=document.createElement('div');d.className='ln';d.innerHTML='<span></span><b></b>';d.querySelector('span').textContent=c.l;d.querySelector('b').textContent='₹'+fmtINR(c.f);list.appendChild(d);}
  const t=document.createElement('div');t.className='ln tot';t.innerHTML='<span>Total due</span><b></b>';t.querySelector('b').textContent='₹'+fmtINR(tot);list.appendChild(t);
  list.hidden=!profile.pending.length;
  if(!profile.pending.length)$('#ctText').textContent='You have no pending challans. The clerk waves you on.';
  else if(profile.wallet>=tot)$('#ctText').textContent=`${profile.pending.length} pending challan${profile.pending.length>1?'s':''}. Pay the full amount to ${profile.seized?'get your licence and vehicle back':'clear your record'}. Wallet ₹${fmtINR(profile.wallet)}.`;
  else $('#ctText').textContent=`You need ₹${fmtINR(tot-profile.wallet)} more (wallet ₹${fmtINR(profile.wallet)}). Walk, work or ask around to earn it, then come back.`;
  $('#ctPay').hidden=!profile.pending.length;$('#ctPay').disabled=profile.wallet<tot;$('#ctPay').textContent=`Pay ₹${fmtINR(tot)}`;
  show('court');
}
$('#ctPay').addEventListener('click',()=>{
  const tot=pendingTotal();if(profile.wallet<tot)return;profile.wallet-=tot;const was=profile.seized;profile.pending=[];profile.seized=false;saveProfile();
  if(was&&FOOT.on){leaveFoot();const c=W.court;P.x=c.x;P.y=c.y;const n=nearestSeg(c.x,c.y,15);if(n.seg)P.h=n.seg.h;P.cond=100;P.fuel=Math.max(P.fuel||0,40);P.dry=false;P.broke=false;
    M4.model(P.M,P.x,0,P.y,-P.h,0,0);toast('Licence returned. Your vehicle is waiting outside.','gold');}
  else toast('Challans paid','good');
  Snd.chime();resumeAfterCourt();
});
$('#ctLeave').addEventListener('click',resumeAfterCourt);
function resumeAfterCourt(){if(FOOT.on){state='play';show('play');footHud(true);}else resumeDrive();}

/* ---------- what the camera and renderer use while on foot ---------- */
const FOOTV={top:22,cat:'foot'},FOOTPM={len:.7,wid:.5,eye:[0,1.62,-.14],foot:true};
function footView(){
  const R=FOOT.ride;
  if(R&&R.phase==='ride'){
    if(!R.pm){const m=R.model;const two=!!m.two;const e=m.eye||[.7,2.1,-R.t.len/2+1.2];R.pm=Object.assign({},m,{ride:true,len:R.t.len,wid:R.t.wid,eye:R.t.k==='bus'?[-.6,2.35,-1.5]:two||R.t.k==='auto'?e.slice():[-e[0],e[1],e[2]]});}
    return {V:{top:50,cat:R.pm.two?'two':'car'},pm:R.pm,ride:true};}
  return {V:FOOTV,pm:FOOTPM,foot:true};
}
function drawFootPlayer(fv,A,night){
  const R=FOOT.ride;
  const car=(M,m,inside)=>{drawLit(m.body,M,{emiK:.5+night});if(m.glass&&!inside)drawLit(m.glass,M);if(m.rider&&!(inside&&R.t.two))drawLit(m.rider,M);lightsFor(m,M,night>.25,R&&R.v<.5,night);};
  if(fv.ride){const inside=CAM.mode==='cockpit';car(P.M,R.model,inside);
    if(!inside){const an=seatAnchor(R);const w=M4.xform(P.M,an[0],an[1],an[2]);M4.model(TM2,w[0],w[1],w[2],-R.h,0,0);drawPlayerRig(TM2,'seat');}return;}
  if(R&&R.phase!=='ride'){M4.model(TM,R.x,0,R.y,-R.h,0,0);car(TM,R.model,false);
    if(R.phase==='wait'){const an=seatAnchor(R);const w=M4.xform(TM,an[0],an[1],an[2]);M4.model(TM2,w[0],w[1],w[2],-R.h,0,0);drawPlayerRig(TM2,'seat');return;}}
  if(METRO.ride)return;
  if(CAM.mode!=='cockpit')drawPlayerRig(P.M,FOOT.job&&FOOT.job.carry?'carry':playerPose(),FOOT.job&&FOOT.job.carry?null:playerWeaponShown());
}
function drawFootBeams(ex,ez){
  if(W.court&&(FOOT.on||profile.pending.length)){const d=Math.hypot(W.court.x-ex,W.court.y-ez);drawSprite(beamTex().tex,W.court.x,0,W.court.y,3.4+d*.012,55,[1,.25,.2]);}
  if(FOOT.job&&FOOT.job.kind==='deliver'){const j=FOOT.job,d=Math.hypot(j.x-ex,j.y-ez);drawSprite(beamTex().tex,j.x,0,j.y,3.2+d*.01,45,[1,.85,.2]);}
}
function footMini(m,R,arrow){
  if(W.court&&Math.abs(W.court.x-P.x)<R&&Math.abs(W.court.y-P.y)<R){m.fillStyle='#E53935';m.fillRect(W.court.x-12,W.court.y-12,24,24);m.fillStyle='#FFF';m.fillRect(W.court.x-6,W.court.y-2,12,4);}
  if(FOOT.job&&FOOT.job.kind==='deliver'){m.fillStyle='#FFC72C';m.beginPath();m.arc(FOOT.job.x,FOOT.job.y,12,0,TAU);m.fill();}
}
function footArrows(arrow){
  if(W.court&&(FOOT.on||profile.seized))arrow(W.court.x,W.court.y,'#E53935');
  if(FOOT.job&&FOOT.job.kind==='deliver')arrow(FOOT.job.x,FOOT.job.y,'#FFC72C');
}
let condLbl=null;
function footHudTick(el){
  if(!condLbl)condLbl=el.condTxt.previousElementSibling;
  const fm=d=>d<1000?Math.round(d/10)*10+' m':(d/1000).toFixed(1)+' km';
  const ch=$('#chChip');ch.hidden=!profile.pending.length||profile.seized;ch.textContent=`${profile.pending.length}/${MAXCH} challans`;
  if(!FOOT.on){condLbl.textContent='Condition';return false;}
  el.sig.hidden=true;if(INT.on)$('#footBar').hidden=true;
  condLbl.textContent='Stamina';el.condbar.style.width=(FOOT.stam/maxStam()*100)+'%';el.condbar.style.background=FOOT.stam>40?'#80DEEA':FOOT.stam>15?'var(--auto-yellow)':'var(--danger)';el.condTxt.textContent=Math.round(FOOT.stam)+' / '+maxStam();
  el.trip.innerHTML='';
  const a=document.createElement('div'),b=document.createElement('div');
  if(FOOT.job&&FOOT.job.kind==='deliver'){const j=FOOT.job;a.innerHTML='Deliver to <b></b>';a.querySelector('b').textContent=j.name;b.textContent=`${fm(Math.hypot(j.x-P.x,j.y-P.y))} · ${Math.ceil(j.left)} s left · ₹${j.pay}`;}
  else if(FOOT.job&&(FOOT.job.kind==='sacks'||FOOT.job.kind==='wash')){a.innerHTML='<b></b>';a.querySelector('b').textContent=jobTitle();b.textContent=jobLine();}
  else if(W.court){a.innerHTML='<b>District Magistrate Court</b>';const due=pendingTotal();b.textContent=`${fm(Math.hypot(W.court.x-P.x,W.court.y-P.y))} · due ₹${fmtINR(due)}${profile.wallet<due?' · short ₹'+fmtINR(due-profile.wallet):''}`;}
  el.trip.append(a,b);
  let key='foot',html='';
  if(FOOT.ride)key='';
  else if(FOOT.stam<8){key='tired';html='<b>Out of breath.</b> Walk for a bit to get your stamina back.';}
  else if(INT.on){key='int'+INT.kind;html=`Inside · <b>${({house:'a family home',apartment:'apartment lobby',shop:'shop',restaurant:'restaurant',cafe:'cafe',bar:'bar',mall:'shopping mall',office:'office',police:'police station',gym:'gym'})[INT.kind]||'building'}</b> · walk to the door to go out`;}
  else if(FOOT.tip>0){key='tip';html=`On foot · push the joystick all the way to <b>run</b> · swipe the screen to look around · <b>+₹5</b> every 10 s on the move`;}
  else key='';
  if(key!==noticeKey){noticeKey=key;el.notice.hidden=!key;el.notice.innerHTML=html;}
  return true;
}
Object.assign(window.__oosht||{},{inBuilding,FOOT,profile,goFoot,findPath,nodeNear,openCourt,caught:()=>caught(),hitPed,pendingTotal,addChallan,sendRide,endRide});
