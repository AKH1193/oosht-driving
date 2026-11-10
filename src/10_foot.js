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
  const add=(a,b,L,w)=>{let l=adj.get(a);if(!l){l=[];adj.set(a,l);}l.push([b,L,w]);};
  for(const w of W.ways){const n=w.pts.length/2;for(let k=0;k<n;k++)pos.set(w.nodes[k],[w.pts[2*k],w.pts[2*k+1]]);
    for(let k=0;k<n-1;k++){const a=w.nodes[k],b=w.nodes[k+1];const L=Math.hypot(w.pts[2*k+2]-w.pts[2*k],w.pts[2*k+3]-w.pts[2*k+1]);if(!w.oneway||!w.rev)add(a,b,L,w);if(!w.oneway||w.rev)add(b,a,L,w);}}
  GR={adj,pos};GRV=W.version;return GR;
}
function nodeNear(x,y){const n=nearestSeg(x,y,120,s=>!s.w.br);if(!n.seg)return null;const s=n.seg;const da=Math.hypot(s.ax-x,s.ay-y),db=Math.hypot(s.bx-x,s.by-y);return s.w.nodes[da<db?s.i:s.i+1];}
function findPath(a,b){
  const G=graph();if(a==null||b==null)return null;const goal=G.pos.get(b);if(!goal)return null;
  const g=new Map([[a,0]]),from=new Map(),heap=[[0,a]],done=new Set();
  const push=it=>{heap.push(it);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
  let guard=0;
  while(heap.length&&guard++<200000){const[,u]=pop();if(u===b)break;if(done.has(u))continue;done.add(u);
    for(const[v,L]of G.adj.get(u)||[]){const ng=g.get(u)+L;if(ng<(g.has(v)?g.get(v):1e18)){g.set(v,ng);from.set(v,u);const p=G.pos.get(v);push([ng+Math.hypot(p[0]-goal[0],p[1]-goal[1]),v]);}}}
  if(!g.has(b))return null;
  const keys=[b];let k=b;while(k!==a){k=from.get(k);if(k==null)return null;keys.push(k);}keys.reverse();
  return keys.map(k=>G.pos.get(k));
}
function laneShift(pts,off){const out=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;out.push([pts[i][0]+dy/l*off,pts[i][1]-dx/l*off]);}return out;}
const pathLen=pts=>{let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;};

/* ---------- switching between driving and walking ---------- */
function goFoot(why,keep){
  FOOT.on=true;FOOT.tip=9;FOOT.ride=null;FOOT.lift=null;FOOT.stam=keep?Math.min(FOOT.stam||maxStam(),maxStam()):maxStam();FOOT.walk=0;
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

/* ---------- walking and running ---------- */
function updateFoot(dt){
  if(FOOT.ride){updateRide(dt);if(FOOT.ride&&FOOT.ride.phase!=='pickup')return;}
  if(LIFE.dead)return;
  let steerIn=(input.R?1:0)-(input.L?1:0);if(settings.steer==='tilt')steerIn=clamp(input.tilt,-1,1);
  P.h+=steerIn*2.4*dt;
  const run=input.horn&&FOOT.stam>2;const top=run?6.2:2.3;
  if(input.gas)P.s+=clamp(top-P.s,-8*dt,6*dt);else P.s=Math.max(0,P.s-9*dt);
  if(input.brake)P.s=Math.max(0,P.s-14*dt);
  if(run&&P.s>2.6)FOOT.stam=Math.max(0,FOOT.stam-10*dt*(100/maxStam()));else FOOT.stam=Math.min(maxStam(),FOOT.stam+(P.s<.3?12:6)*dt*(LIFE.boost>0?2:1));
  const fx=Math.sin(P.h),fy=-Math.cos(P.h);P.vx=fx*P.s;P.vy=fy*P.s;
  const ox=P.x,oy=P.y,sx=P.vx*dt,sy=P.vy*dt;
  const blocked=(x,y)=>inBuilding(x,y)||inBuilding(x+fx*.32,y+fy*.32)||inBuilding(x-fy*.24+fx*.1,y+fx*.24+fy*.1)||inBuilding(x+fy*.24+fx*.1,y-fx*.24+fy*.1);
  if(inBuilding(ox,oy)){P.x+=sx;P.y+=sy;}
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
  const tk=kind==='auto'?'auto':kind==='cab'?'taxi':['sakhi','pratham','hatch','suv','maharaja','regent'][Math.floor(Math.random()*6)];
  const t=TT.find(q=>q.k===tk);const col=t.cols?t.cols[Math.floor(Math.random()*t.cols.length)]:null;
  const me=nodeNear(P.x,P.y);if(me==null){toast('Walk to a road first','bad');return;}
  const G=graph();let start=null;
  for(let tries=0;tries<40&&!start;tries++){const s=W.segs[Math.floor(Math.random()*W.segs.length)];const d=Math.hypot(s.ax-P.x,s.ay-P.y);if(d>60&&d<180&&!s.w.br)start=s.w.nodes[s.i];}
  let path=start!=null?findPath(start,me):null;if(!path||path.length<2){const p=G.pos.get(me);path=[[p[0]+40,p[1]],p];}
  const pick=nearestSeg(P.x,P.y,20);let px=P.x,py=P.y;if(pick.seg){const s=pick.seg;const tt=clamp(((P.x-s.ax)*(s.bx-s.ax)+(P.y-s.ay)*(s.by-s.ay))/(s.len*s.len),0,1);px=s.ax+(s.bx-s.ax)*tt;py=s.ay+(s.by-s.ay)*tt;}
  path.push([px,py]);
  const rate=kind==='cab'?{base:60,km:22,name:'cab'}:kind==='auto'?{base:36,km:18,name:'auto'}:{base:0,km:0,name:'lift'};
  const pts=laneRoad(path,!!t.two);
  FOOT.ride={kind,t,col,model:trafficModel(t,col),pts,i:0,x:pts[0][0],y:pts[0][1],h:hAng(pts[1][0]-pts[0][0],pts[1][1]-pts[0][1]),v:0,phase:'pickup',rate,meter:0,dist:0,tt:0,segT:0,lim:8};
  toast(kind==='lift'?'Someone is stopping for you':`Your ${rate.name} is on the way`,'good');
  $('#footBar').hidden=true;$('#rideBar').hidden=false;$('#rbSkip').hidden=true;
}
/* keep to the left lane of each road along the route */
function laneRoad(path,two){
  const out=[];const n=path.length;
  for(let i=0;i<n;i++){const a=path[Math.max(0,i-1)],b=path[Math.min(n-1,i+1)];const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;
    const e0=path[Math.min(i,n-2)],e1=path[Math.min(i+1,n-1)];const ns=nearestSeg((e0[0]+e1[0])/2,(e0[1]+e1[1])/2,12);
    let off=1.6;if(ns.seg){const w=ns.seg.w;off=w.oneway?(two?w.hw*.45:0):w.hw*(two?.62:.42);}
    if(i===n-1)off=ns.seg?ns.seg.w.hw*.7:2.2;
    out.push([path[i][0]+dy/l*off,path[i][1]-dx/l*off]);}
  return out;
}
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
  const me=nodeNear(R.x,R.y);
  for(const o of rideDest()){const path=findPath(me,nodeNear(o.x,o.y));const L=path?pathLen(path):Math.hypot(o.x-P.x,o.y-P.y)*1.3;const fare=Math.round(R.rate.base+L/1000*R.rate.km);
    const b=document.createElement('button');b.className='btn';b.textContent=`${o.name} · ${(L/1000).toFixed(1)} km${R.kind==='lift'?'':' · about ₹'+fare}`;
    b.disabled=R.kind!=='lift'&&profile.wallet<fare;
    b.addEventListener('click',()=>startRide(o,path));box.appendChild(b);}
  show('rideScr');
}
function startRide(o,path){
  const R=FOOT.ride;if(!path||path.length<2)path=[[R.x,R.y],[o.x,o.y]];
  path=[[R.x,R.y]].concat(path.slice());const ns=nearestSeg(o.x,o.y,60,q=>!q.w.br);if(ns.seg){const q=ns.seg;const t=clamp(((o.x-q.ax)*(q.bx-q.ax)+(o.y-q.ay)*(q.by-q.ay))/(q.len*q.len),0,1);path.push([q.ax+(q.bx-q.ax)*t,q.ay+(q.by-q.ay)*t]);}
  const lp=laneRoad(path,!!R.t.two);lp[0]=[R.x,R.y];R.pts=lp;R.i=0;R.phase='ride';R.dest=o;R.meter=R.rate.base;R.dist=0;R.tt=0;
  P.len=R.t.len;P.wid=R.t.wid;
  state='play';show('play');footHud(true);$('#footBar').hidden=true;$('#rideBar').hidden=false;$('#rbSkip').hidden=false;
  const vk=vehKeyFor(R.t.k);Snd.startEngine(VEH[vk].engine,vk);Hap.tick();
}
const boardPoint=R=>{const lx=-Math.cos(R.h),ly=-Math.sin(R.h),fx=Math.sin(R.h),fy=-Math.cos(R.h);const off=R.t.wid/2+.45,back=R.t.two?.45:R.t.k==='auto'?.5:0;return [R.x+lx*off-fx*back,R.y+ly*off-fy*back];};
function seatAnchor(R){const e=R.model.eye;if(R.t.two)return [0,e[1]-1.55,e[2]+.52];if(R.t.k==='auto')return [0,-.1,.55];return [-e[0],e[1]-1.6,e[2]];}
/* the driver follows the same rules as everyone else: red lights, queues, people crossing */
function rideRules(R,vt){
  const gap=R.t.len/2+3;
  for(const b of agents)if(inFront(R.x,R.y,R.h,b.x,b.y,gap+b.t.len/2+1.5,(R.t.wid+b.t.wid)/2+.2))vt=Math.min(vt,Math.max(0,b.v-1));
  for(const c of COP.list)if(inFront(R.x,R.y,R.h,c.x,c.y,gap+4,2.2))vt=0;
  for(const w of LIFE.wrecks)if(inFront(R.x,R.y,R.h,w.x,w.y,gap+4,(R.t.wid+1.8)/2))vt=0;
  for(const p of peds)if((p.state==='cross'||p.state==='play'||p.state==='flee')&&inFront(R.x,R.y,R.h,p.x,p.y,gap+7,R.t.wid/2+1.2))vt=0;
  for(const n of animals)if(n.onRoad&&inFront(R.x,R.y,R.h,n.x,n.y,gap+6,R.t.wid/2+1.2))vt=0;
  const sa=signalAhead(R.x,R.y,R.h,55);
  if(sa&&sa.d>sa.S.R-.5){const arm=sigArmFor(sa.S,R.x,R.y);const st=sigState(sa.S,arm.ph,GT);
    if(st[0]==='R'||(st[0]==='A'&&sa.d-sa.S.R>9)){const stop=sa.d-sa.S.R-R.t.len/2-.6;vt=Math.min(vt,Math.sqrt(Math.max(0,2*3.2*stop)));R.redWait=true;}else R.redWait=false;}
  else R.redWait=false;
  return vt;
}
function rideToTraffic(R){
  const n=nearestSeg(R.x,R.y,15,s=>!s.w.br);if(!n.seg)return;const s=n.seg;
  const fwd=Math.abs(angDiff(R.h,s.h))<Math.PI/2;const dir=fwd?1:-1;if(s.w.oneway&&((s.w.rev?-1:1)!==dir))return;
  const t=clamp(((R.x-s.ax)*(s.bx-s.ax)+(R.y-s.ay)*(s.by-s.ay))/(s.len*s.len),0,1);
  const a={w:s.w,i:dir===1?s.i:s.i+1,dir,d:(dir===1?t:1-t)*s.len,v:Math.max(R.v,2),t:R.t,col:R.col,model:R.model,x:R.x,y:R.y,h:R.h,th:R.h,stop:1.2,brake:false,laneJ:1,turnSlow:0,k:1,horn:0,lean:0};
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
  const pts=R.pts;
  if(R.i>=pts.length-1){if(R.phase==='pickup'){R.v=0;R.phase='board';R.tt=0;$('#rideTxt').textContent='Getting on…';return;}arrive();return;}
  if((R.segT-=dt)<=0){R.segT=.5;const n=nearestSeg(R.x,R.y,20);R.lim=n.seg?(CRUISE[n.seg.w.cls]||8):8;}
  const tx=pts[R.i+1][0],ty=pts[R.i+1][1],dx=tx-R.x,dy=ty-R.y,d=Math.hypot(dx,dy);
  let vt=Math.min(R.lim*(R.t.cruise||1)*1.05,R.t.k==='auto'?11:16);
  const nx=pts[Math.min(pts.length-1,R.i+2)];const turn=Math.abs(angDiff(hAng(dx,dy),hAng(nx[0]-tx,nx[1]-ty)));if(d<16&&turn>.5)vt=Math.min(vt,turn>1.2?4:6);
  let left=d;for(let k=R.i+1;k<pts.length-1;k++)left+=Math.hypot(pts[k+1][0]-pts[k][0],pts[k+1][1]-pts[k][1]);
  vt=Math.min(vt,Math.sqrt(2*2.6*Math.max(0,left-.5))+.4);
  vt=rideRules(R,vt);
  R.v+=clamp(vt-R.v,-8*dt,2.6*dt);if(R.v<0)R.v=0;
  const step=Math.min(d,R.v*dt);if(d>.01){R.x+=dx/d*step;R.y+=dy/d*step;R.h+=angDiff(R.h,hAng(dx,dy))*Math.min(1,dt*4);}
  if(d<.6)R.i++;
  if(R.phase==='ride'){R.dist+=step;R.meter=R.rate.base+R.dist/1000*R.rate.km;P.x=R.x;P.y=R.y;P.h=R.h;P.s=R.v;P.vx=Math.sin(R.h)*R.v;P.vy=-Math.cos(R.h)*R.v;M4.model(P.M,R.x,0,R.y,-R.h,0,0);Snd.engine(R.v/14,R.v<vt-.5?1:0);
    $('#rideTxt').textContent=(R.kind==='lift'?'Riding along':`${R.kind==='auto'?'Auto meter':'Cab fare'} ₹${Math.round(R.meter)}`)+` · ${Math.round(left)} m to go`+(R.redWait&&R.v<1?' · waiting at the signal':'');}
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
  if(skip){let L=0;for(let k=R.i;k<R.pts.length-1;k++)L+=Math.hypot(R.pts[k+1][0]-R.pts[k][0],R.pts[k+1][1]-R.pts[k][1]);R.dist+=L;R.meter=R.rate.base+R.dist/1000*R.rate.km;
    const n=R.pts.length;const end=R.pts[n-1],pre=R.pts[Math.max(0,n-2)];R.x=end[0];R.y=end[1];R.h=hAng(end[0]-pre[0],end[1]-pre[1]);R.i=n-1;}
  arrive();
}
$('#rbSkip').addEventListener('click',()=>endRide(true));
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
$('#fbJob').addEventListener('click',()=>{
  state='job';releaseAll();const box=$('#jbOpts');box.innerHTML='';
  let target=null;for(let tries=0;tries<120&&!target;tries++){const s=W.segs[Math.floor(Math.random()*W.segs.length)];if(!s.w.name)continue;const mx=(s.ax+s.bx)/2,my=(s.ay+s.by)/2,d=Math.hypot(mx-P.x,my-P.y);if(d>300&&d<900)target={x:mx,y:my,name:s.w.name,d};}
  if(target){const pay=Math.round(30+target.d/1000*90),time=Math.round(target.d/2.6+40);const b=document.createElement('button');b.className='btn';
    b.textContent=`Deliver a parcel to ${target.name} · ${Math.round(target.d)} m · ₹${pay} if you reach in ${Math.floor(time/60)} min ${time%60} s`;
    b.addEventListener('click',()=>{FOOT.job={kind:'deliver',x:target.x,y:target.y,name:target.name,pay,left:time};state='play';show('play');footHud(true);toast('Parcel picked up. Follow the yellow beam.','gold');});box.appendChild(b);}
  const shop=W.pois.filter(q=>Math.hypot(q.x-P.x,q.y-P.y)<400)[0];
  const b2=document.createElement('button');b2.className='btn';b2.textContent=`Help unload a lorry${shop?' at '+shop.name:''} · tap 30 times in 15 s · ₹45`;
  b2.addEventListener('click',()=>{FOOT.unload={n:0,left:15};$('#ulTxt').textContent='Tap UNLOAD 30 times';$('#unload').hidden=false;state='play';show('play');footHud(true);});box.appendChild(b2);
  const b3=document.createElement('button');b3.className='btn';b3.textContent='Wash a parked car · tap 20 times in 12 s · ₹30';
  b3.addEventListener('click',()=>{FOOT.unload={n:0,left:12,need:20,pay:30,word:'SCRUB'};$('#ulTxt').textContent='Tap SCRUB 20 times';$('#ulBtn').textContent='SCRUB';$('#unload').hidden=false;state='play';show('play');footHud(true);});box.appendChild(b3);
  show('jobScr');
});
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
    if(!R.pm){const m=R.model;const two=!!m.two;const e=m.eye;R.pm=Object.assign({},m,{ride:true,eye:two||R.t.k==='auto'?e.slice():[-e[0],e[1],e[2]]});}
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
  if(CAM.mode!=='cockpit')drawPlayerRig(P.M,playerPose(),playerWeaponShown());
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
  el.sig.hidden=true;
  condLbl.textContent='Stamina';el.condbar.style.width=(FOOT.stam/maxStam()*100)+'%';el.condbar.style.background=FOOT.stam>40?'#80DEEA':FOOT.stam>15?'var(--auto-yellow)':'var(--danger)';el.condTxt.textContent=Math.round(FOOT.stam)+' / '+maxStam();
  el.trip.innerHTML='';
  const a=document.createElement('div'),b=document.createElement('div');
  if(FOOT.job&&FOOT.job.kind==='deliver'){const j=FOOT.job;a.innerHTML='Deliver to <b></b>';a.querySelector('b').textContent=j.name;b.textContent=`${fm(Math.hypot(j.x-P.x,j.y-P.y))} · ${Math.ceil(j.left)} s left · ₹${j.pay}`;}
  else if(W.court){a.innerHTML='<b>District Magistrate Court</b>';const due=pendingTotal();b.textContent=`${fm(Math.hypot(W.court.x-P.x,W.court.y-P.y))} · due ₹${fmtINR(due)}${profile.wallet<due?' · short ₹'+fmtINR(due-profile.wallet):''}`;}
  el.trip.append(a,b);
  let key='foot',html='';
  if(FOOT.ride)key='';
  else if(FOOT.stam<8){key='tired';html='<b>Out of breath.</b> Walk for a bit to get your stamina back.';}
  else if(FOOT.tip>0){key='tip';html=`On foot · <b>+₹5</b> for every 10 s you keep moving · hold <b>RUN</b> to run`;}
  else key='';
  if(key!==noticeKey){noticeKey=key;el.notice.hidden=!key;el.notice.innerHTML=html;}
  return true;
}
Object.assign(window.__oosht||{},{inBuilding,FOOT,profile,goFoot,findPath,nodeNear,openCourt,caught:()=>caught(),hitPed,pendingTotal,addChallan,sendRide,endRide});
