/* ================= the game ================= */
const P={x:0,y:0,h:0,s:0,vx:0,vy:0,steer:0,type:'auto',cond:100,bounce:0,air:0,lean:0,len:2.7,wid:1.34,M:M4.create(),rash:0,offroad:false,wet:false,overT:0,wrongT:0,lastBad:0};
const input={L:0,R:0,gas:0,brake:0,horn:0,tilt:0};
let state='splash',session={m:0,trips:0,fare:0,savedKm:0},trip=null,currentLoc=null;
let lastToast={},hudT=0,todT=0,saveT=0,poiT=0,streamT=0,miniT=0,offT=0,garageLock=null,rashCool=0,sigInside=new Map();
const DGr=new GlowBatch(400),DGb=new GlowBatch(120),DS=new GlowBatch(200);
let GROUND=null,LAMP=null,BEAM=null,nearPois=[];

function toast(msg,cls,key,gap){
  const now=performance.now();if(key){if(lastToast[key]&&now-lastToast[key]<(gap||2600))return;lastToast[key]=now;}
  const box=$('#toast');while(box.children.length>2)box.firstChild.remove();
  const d=document.createElement('div');d.className='toast '+(cls||'');d.textContent=msg;box.appendChild(d);setTimeout(()=>d.remove(),2250);
}
function flash(){const f=$('#flash');f.style.transition='none';f.style.opacity='.9';requestAnimationFrame(()=>{f.style.transition='opacity .6s';f.style.opacity='0';});}
function damage(n,silent){
  P.cond=Math.max(0,P.cond-n);P.lastBad=performance.now();if(trip)trip.clean=false;
  if(P.cond<=0&&!P.broke){P.broke=true;toast('Your vehicle broke down','bad');Snd.stopEngine();setTimeout(()=>{if(state==='play'&&P.cond<=0&&!P.dry)Snd.startEngine(Object.assign({},VEH[P.type].engine,{vol:.4}),P.type);},400);}
}
const licenceSuspended=()=>!!profile.seized;
const timeStr=ms=>new Date(ms).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'});

/* ---------- hazards felt in the seat ---------- */
function hitPothole(z){
  const V=VEH[P.type];const sev=clamp(Math.abs(P.s)/13,.15,1);const k=clamp(sev*V.susp,0,1.6);
  P.s*=1-.18*clamp(k,0,1);P.bounce=Math.min(1.3,P.bounce+.6*k);CAM.shake=Math.max(CAM.shake,6*k);
  Hap.pothole(clamp(k,0,1));Snd.thud(clamp(k,0,1));
  const dmg=+(1+3.2*k).toFixed(1);damage(dmg);
  if(sev>.35)toast(`Pothole! −${Math.round(dmg)}%`,'bad','pot',2200);
}
function hitBump(z){
  const V=VEH[P.type];const kmh=Math.abs(P.s)*3.6;
  const gap=clamp(Math.round(P.len*.75/Math.max(.8,Math.abs(P.s))*1000),55,420);
  if(kmh>25){
    const sev=clamp((kmh-25)/40,.12,1);const k=sev*V.susp;
    P.s*=.75;P.bounce=Math.min(1.5,P.bounce+.9*k);P.air=V.cat==='two'?.2*k:.12*k;CAM.shake=Math.max(CAM.shake,10*k);
    Hap.bump(clamp(k,0,1),gap);Snd.thud(clamp(k,0,1));setTimeout(()=>Snd.thud(clamp(k*.8,0,1)),gap);
    const dmg=+(1.5+6.5*k).toFixed(1);damage(dmg);P.rash+=10*k;
    toast(`Speed breaker at ${Math.round(kmh)} km/h! −${Math.round(dmg)}%`,'bad','bump',1500);
  }else{
    Hap.bump(.12,gap);Snd.thud(.1);
    if(kmh>4){profile.wallet+=2;session.fare+=2;toast('Gently over the breaker +₹2','good','gentle',3500);Snd.coin();}
  }
}
function enterWater(z){
  const kmh=Math.abs(P.s)*3.6;const s=clamp(kmh/50,.1,1);
  Hap.water(s);Snd.splash(s);
  if(kmh>15)toast('Water logging! Slippery','','wet',4000);
  if(kmh>45)damage(1);
  if(z.hidden&&!z.revealed){z.revealed=true;setTimeout(()=>{if(state!=='play')return;const k=clamp(kmh/40,.2,1)*VEH[P.type].susp;P.bounce+=.8*k;CAM.shake=Math.max(CAM.shake,6*k);Hap.pothole(clamp(k,0,1));Snd.thud(clamp(k,0,1));damage(+(2+4*k).toFixed(1));toast('Hidden pothole under the water!','bad','hidden',1500);},140);}
}
function crash(rel,what,rashAdd){
  const k=clamp(rel/12,.2,1);Hap.crash();Snd.crash();CAM.shake=Math.max(CAM.shake,12*k);P.bounce=1;
  const dmg=+(3+10*k).toFixed(1);damage(dmg);P.rash+=rashAdd||0;if(rel>9)lfDamage((rel-9)*(VEH[P.type].cat==='two'?3:1.4),'crash');
  toast(`${what} −${Math.round(dmg)}%`,'bad','crash'+what,1200);
}
function hitPed(p){
  if(p.state==='static'&&p.kind==='vendor'){p.state='down';p.t=0;p.fall=hAng(p.x-P.x,p.y-P.y);p.cart=null;}
  if(p.state==='static'&&p.kind==='lie'){p.kind='lie';}
  p.state='down';p.t=0;p.fall=hAng(p.x-P.x,p.y-P.y);if(p.kind==='lie'||p.kind==='sit'){p.v=0;}
  Snd.crash();Hap.bigCrash();CAM.shake=10;flash();
  if(COP.level===0&&!COP.list.length&&!policeWitness('ped')){toast('You hit a pedestrian! No police saw it.','bad');panic(p.x,p.y,30);trip=null;return;}
  addChallan('ped');profile.seized=true;saveProfile();
  COP.pedHit=true;toast('You hit a pedestrian! Licence seized','bad');
  offence('ped',3);
  trip=null;
}

/* ---------- player physics ---------- */
const tq=[];
function updatePlayer(dt){
  const V=VEH[P.type];
  let top=V.top/3.6;
  if(P.dry)top=6/3.6;else if(P.cond<=0)top=10/3.6;else if(P.cond<50)top*=.55+.45*P.cond/50;
  let steerIn=clamp((input.R?1:0)-(input.L?1:0)+(input.jx||0)*1.1,-1,1);if(settings.steer==='tilt'&&!input.jx)steerIn=clamp(input.tilt,-1,1);
  P.steer+=(steerIn-P.steer)*Math.min(1,dt*(steerIn?6:9));
  const nr=nearestSeg(P.x,P.y,14);P.road=nr.seg;
  P.offroad=!nr.seg||nr.edge>1.4;
  const cap=P.offroad?Math.min(top,26/3.6):top;
  if(input.gas){if(P.s<cap){const f=1-Math.pow(clamp(P.s/cap,0,1),1.7);P.s+=V.accel*f*dt*(P.s<0?3:1)*(P.s<3?1.25:1);}}
  /* holding brake keeps you stopped; tap brake twice quickly to reverse */
  if(input.brake){if(P.s>.3)P.s-=V.brake*dt;else if(P.rev){if(P.s>-4)P.s-=2.4*dt;}else if(P.s<-.3)P.s+=V.brake*dt;else P.s=0;}
  else if(P.rev&&P.s<0){P.s=Math.min(0,P.s+3*dt);}
  if(!input.gas&&!input.brake){const c=(1.0+Math.abs(P.s)*.02)*dt;P.s=Math.abs(P.s)<c?0:P.s-Math.sign(P.s)*c;}
  if(P.offroad){P.s-=P.s*1.5*dt;if(P.s>cap)P.s-=5*dt;}
  if(P.s>top+.5)P.s-=4*dt;
  const sp=Math.abs(P.s);
  const turn=P.steer*V.handling*1.8*clamp(sp/3,0,1)/(1+sp/24)*Math.sign(P.s||1);
  P.h+=turn*dt;
  if(V.cat==='two'){const tl=clamp(Math.atan(sp*turn/9.8),-.5,.5);P.lean+=(tl-P.lean)*Math.min(1,dt*6);}else P.lean=0;
  /* hazards */
  P.wet=false;const now=performance.now();
  gQuery(W.hG,P.x,P.y,10,tq);
  for(const z of tq){const dx=P.x-z.x,dy=P.y-z.y;
    if(z.type==='pot'){if(z.cd<now&&Math.hypot(dx,dy)<z.r+P.wid*.42){z.cd=now+1600;hitPothole(z);}}
    else if(z.type==='bump'){const ca=Math.cos(z.ang),sa=Math.sin(z.ang);const al=dx*ca+dy*sa,ac=-dx*sa+dy*ca;if(z.cd<now&&Math.abs(al)<.9&&Math.abs(ac)<z.len+.3){z.cd=now+1300;hitBump(z);}}
    else if(z.type==='water'){const ca=Math.cos(z.ang),sa=Math.sin(z.ang);const al=(dx*ca+dy*sa)/(z.r*1.6),ac=(-dx*sa+dy*ca)/z.r;if(al*al+ac*ac<1){P.wet=true;if(z.cd<now)enterWater(z);z.cd=now+700;}}}
  if(P.wet)P.s-=P.s*1.0*dt;
  const fx=Math.sin(P.h),fy=-Math.cos(P.h);
  const grip=P.wet?1.6:P.offroad?4:9;
  P.vx+=(fx*P.s-P.vx)*Math.min(1,grip*dt);P.vy+=(fy*P.s-P.vy)*Math.min(1,grip*dt);
  /* move in small steps so fast vehicles cannot skip through walls */
  const dist=Math.hypot(P.vx,P.vy)*dt;const n=Math.max(1,Math.ceil(dist/.45));
  for(let i=0;i<n;i++){
    const ox=P.x,oy=P.y;P.x+=P.vx*dt/n;P.y+=P.vy*dt/n;
    const sg=Math.sign(P.s||1);const px=P.x+fx*P.len*.5*sg,py=P.y+fy*P.len*.5*sg;
    if(inBuilding(px,py)||inBuilding(P.x,P.y)){P.x=ox;P.y=oy;const rel=Math.abs(P.s);P.s*=-.25;P.vx=P.vy=0;P.bumped=true;if(rel>2.5)crash(rel,'Hit a wall!',rel>8?25:0);else Hap.rumble();break;}
    gQuery(W.tG,P.x,P.y,2,tq);let tree=null;for(const t of tq)if(Math.hypot(t.x-P.x,t.y-P.y)<(t.r||.45)+P.wid*.5)tree=t;
    if(tree){P.x=ox;P.y=oy;const rel=Math.abs(P.s);P.s*=-.2;P.vx=P.vy=0;P.bumped=true;if(rel>2.5)crash(rel,'Hit a tree!',rel>8?20:0);else Hap.rumble();break;}
  }
  /* stuck against a wall with the throttle open: put the vehicle back on the road */
  if(P.bumped&&(input.gas||input.brake))P.stuckT=(P.stuckT||0)+dt;else P.stuckT=Math.max(0,(P.stuckT||0)-dt);P.bumped=false;
  if(P.stuckT>2.2){P.stuckT=0;const n=nearestSeg(P.x,P.y,60,s=>!s.w.br);if(n.seg){const s=n.seg;const t=clamp(((P.x-s.ax)*(s.bx-s.ax)+(P.y-s.ay)*(s.by-s.ay))/(s.len*s.len),0,1);P.x=s.ax+(s.bx-s.ax)*t;P.y=s.ay+(s.by-s.ay)*t;const hh=s.h+(Math.cos(angDiff(P.h,s.h))<0?Math.PI:0);P.h=hh;P.s=0;P.vx=P.vy=0;toast('Back on the road','', 'unstuck',2000);}}
  /* animals */
  for(const c of animals){const d=Math.hypot(c.x-P.x,c.y-P.y);const r=c.kind==='cow'?1.1:c.kind==='dog'?.45:.3;
    if(d<r+P.wid*.55){const rel=Math.abs(P.s);const nx=(P.x-c.x)/(d||1),ny=(P.y-c.y)/(d||1);
      if(c.kind==='cow'){P.x=c.x+nx*(r+P.wid*.55+.02);P.y=c.y+ny*(r+P.wid*.55+.02);P.s*=.1;P.vx=P.vy=0;if(rel>1.5){crash(rel,'Hit a cow!',25);Snd.moo();}}
      else if(rel>2&&!c.event){c.state='flee';c.tx=c.x-nx*8;c.ty=c.y-ny*8;c.speed=6;c.t=1.5;Snd.yelp();damage(2);P.rash+=15;toast(c.kind==='dog'?'You hit a street dog!':'You hit a cat!','bad','ani',2000);}}}
  /* traffic */
  for(const a of agents){
    const dx=P.x-a.x,dy=P.y-a.y;const lim=(P.len+a.t.len)*.5;if(Math.abs(dx)>lim+2||Math.abs(dy)>lim+2)continue;
    const pf=P.len*.28,af=a.t.len*.32,pr=P.wid*.55,ar=a.t.wid*.55;const afx=Math.sin(a.h),afy=-Math.cos(a.h);
    let hit=false,nx=0,ny=0,md=1e9;
    for(const s1 of[-1,1])for(const s2 of[-1,1]){const x1=P.x+fx*pf*s1,y1=P.y+fy*pf*s1,x2=a.x+afx*af*s2,y2=a.y+afy*af*s2;const d=Math.hypot(x1-x2,y1-y2);if(d<pr+ar&&d<md){md=d;hit=true;nx=(x1-x2)/(d||1);ny=(y1-y2)/(d||1);}}
    if(a.t.len>6){for(let s2=-1;s2<=1;s2+=.5){const x2=a.x+afx*a.t.len*.42*s2,y2=a.y+afy*a.t.len*.42*s2;const d=Math.hypot(P.x-x2,P.y-y2);if(d<pr+ar&&d<md){md=d;hit=true;nx=(P.x-x2)/(d||1);ny=(P.y-y2)/(d||1);}}}
    if(hit){const push=(pr+ar-md)+.05;P.x+=nx*push;P.y+=ny*push;const rel=Math.hypot(P.vx-afx*a.v,P.vy-afy*a.v);P.s*=-.2;P.vx=P.vy=0;a.stop=2.5;a.v=0;
      if(rel>1.8)crash(rel,{auto:'Hit an auto!',bus:'Hit a bus!',truck:'Hit a truck!',tanker:'Hit a water tanker!',hatch:'Hit a car!',sedan:'Hit a car!',suv:'Hit an SUV!',taxi:'Hit a taxi!'}[a.t.k]||'Hit a two-wheeler!',rel>7?35:10);}
  }
  /* pedestrians */
  for(const p of peds){if(p.state==='down')continue;
    if(p.cart!=null){const d=Math.hypot(p.cx-P.x,p.cy-P.y);if(d<1.1+P.wid*.5){const rel=Math.abs(P.s);const nx=(P.x-p.cx)/(d||1),ny=(P.y-p.cy)/(d||1);P.x=p.cx+nx*(1.12+P.wid*.5);P.y=p.cy+ny*(1.12+P.wid*.5);P.s*=.1;P.vx=P.vy=0;if(rel>1.5)crash(rel,'Hit a vendor cart!',25);}}
    const dx=p.x-P.x,dy=p.y-P.y;const al=dx*fx+dy*fy,ac=Math.abs(dx*-fy+dy*fx);const pr=p.state==='static'&&p.kind==='lie'?.9:.3;
    if(Math.abs(al)<P.len*.5+pr&&ac<P.wid*.5+pr){if(Math.abs(P.s)>1.2)hitPed(p);else if(p.state!=='static'){p.x+=(-fy)*Math.sign(dx*-fy+dy*fx||1)*.5;p.y+=fx*Math.sign(dx*-fy+dy*fx||1)*.5;toast('Careful! Pedestrian','', 'pedn',3000);}else{P.s=0;P.vx=P.vy=0;}}}
  if(P.offroad&&sp>1.5){offT-=dt;if(offT<=0){offT=.16;Hap.rumble();}}
  if(P.offroad&&sp>3)toast('Off the road','','off',5000);
  P.bounce*=Math.pow(.02,dt);P.air=Math.max(0,P.air-dt);
  session.m+=Math.hypot(P.vx,P.vy)*dt;
  {const F=FUEL[P.type];P.fuel=Math.max(0,P.fuel-Math.hypot(P.vx,P.vy)*dt/1000/F[0]*100*(input.gas?1.15:.8));
   if(P.fuel<=0&&!P.dry){P.dry=true;Snd.stopEngine();toast(F[2]==='ev'?'Battery empty':'Out of fuel','bad');}}
  const pitch=-P.bounce*.05*Math.sin(now/45)-(input.brake&&sp>3?.02:0)+(input.gas&&sp<top*.5?.012:0);
  M4.model(P.M,P.x,P.bounce*.05+P.air*.5,P.y,-P.h,pitch,V.cat==='two'?-P.lean:0);
  rules(dt,nr,sp);
  Snd.engine(sp/top,input.gas?1:0);
}

/* ---------- traffic rules: signals, speed limits, one-ways ---------- */
let sigHud=null;
function rules(dt,nr,sp){
  /* signals */
  sigHud=null;
  const sa=signalAhead(P.x,P.y,P.h,90);
  if(sa&&sa.d>sa.S.R-1){const arm=sigArmFor(sa.S,P.x,P.y);const st=sigState(sa.S,arm.ph,GT);sigHud={st,d:sa.d-sa.S.R,S:sa.S};
    if(st[0]==='R'&&sp<.6&&sa.d-sa.S.R<16)sa.S.waited=true;}
  gQuery(W.sigG,P.x,P.y,40,tmpS);
  for(const S of tmpS){const d=Math.hypot(S.x-P.x,S.y-P.y);const inside=d<S.R;const was=sigInside.get(S);
    if(inside&&was===false){const arm=sigArmFor(S,P.px,P.py);const st=sigState(S,arm.ph,GT);
      if(st[0]==='R'&&sp>2.5){toast('You jumped a red signal!','bad');offence('signal',1);Snd.whistle();}
      else if(S.waited){S.waited=false;profile.wallet+=5;session.fare+=5;toast('Waited at the signal +₹5','good','sigok',4000);}}
    sigInside.set(S,inside);if(!inside&&d>S.R+20)S.waited=false;}
  if(sigInside.size>40)sigInside=new Map();
  P.px=P.x;P.py=P.y;
  /* speed limit and one-way */
  if(nr.seg&&!P.offroad){const w=nr.seg.w;P.limit=w.limit;
    if(sp*3.6>w.limit+25){P.overT+=dt;P.rash+=6*dt;if(P.overT>3)toast(`Overspeeding! Limit ${w.limit} km/h`,'bad','over',6000);}else P.overT=Math.max(0,P.overT-dt);
    if(w.oneway&&sp>3){const allowed=nr.seg.h+(w.rev?Math.PI:0);if(Math.cos(angDiff(P.h,allowed))<-.5){P.wrongT+=dt;P.rash+=12*dt;if(P.wrongT>1)toast('Wrong way on a one-way road!','bad','wrong',5000);}else P.wrongT=0;}
  }
  P.rash=Math.max(0,P.rash-2.5*dt);rashCool-=dt;
  if(P.rash>=100&&rashCool<=0){rashCool=12;P.rash=70;offence(P.overT>1?'speed':P.wrongT>1?'wrong':'rash',1);}
}

/* ---------- police outcome ---------- */
function caught(){
  if(state!=='play')return;
  markRelease();if(FLY.on){FLY.on=false;$('#flyHud').hidden=true;}if(INT.on)leaveBuilding();
  state='outcome';Snd.stopEngine();Snd.sirenOff();Snd.hornOff();releaseAll();apshReset();
  const codes=COP.off.filter(c=>FINES[c]&&c!=='ped');for(const c of codes)addChallan(c);
  const box=$('#outChallan');box.innerHTML='';
  for(const c of profile.pending){const d=document.createElement('div');d.className='ln';d.innerHTML='<span></span><b></b>';d.querySelector('span').textContent=c.l;d.querySelector('b').textContent='₹'+fmtINR(c.f);box.appendChild(d);}
  const t=document.createElement('div');t.className='ln tot';t.innerHTML='<span>Pending at the court</span><b></b>';t.querySelector('b').textContent='₹'+fmtINR(pendingTotal());box.appendChild(t);
  const n=profile.pending.length;const end=profile.seized;
  if(COP.pedHit){$('#outTitle').textContent='Arrested by the Hoysala';$('#outText').textContent='You hit a pedestrian. Your licence is seized. Until you pay every pending challan at the District Magistrate Court, you go on foot.';}
  else if(end){$('#outTitle').textContent='Licence seized';$('#outText').textContent=`That makes ${n} unpaid challans. Your licence and vehicle stay with the police until you pay ₹${fmtINR(pendingTotal())} at the District Magistrate Court. Walk, ride or hitch there.`;}
  else{$('#outTitle').textContent='e-Challan issued';$('#outText').textContent=`Challan ${n} of ${MAXCH}. Fines are paid only at the District Magistrate Court; at ${MAXCH} unpaid challans your licence is seized.`;}
  saveProfile();
  COP.list=[];COP.level=0;COP.off=[];COP.caughtT=0;COP.lostT=0;COP.pedHit=false;P.rash=0;$('#wanted').hidden=true;
  $('#outPrimary').textContent=end?'Continue on foot':'Drive on';$('#outPrimary').dataset.end=end?'1':'';
  show('outcome');
}

/* ---------- mechanic shop ---------- */
let repairG=null,jugaadUsed=false;
function openRepair(g){
  repairG=g;state='repair';releaseAll();Snd.stopEngine();
  const V=VEH[P.type];const need=Math.round(100-P.cond);const cost=need*V.cost;
  $('#repTitle').textContent=g.name;
  $('#repText').textContent=need<=0?'Your vehicle is in perfect shape. The mechanic offers you a cup of tea.':P.cond<=0?'Your vehicle is broken down. The mechanic can fix it fully, or patch it up with what you can pay.':`Your ${V.name} has taken a beating from Bengaluru roads.`;
  $('#repCond').textContent=Math.round(P.cond)+'%';$('#repCost').textContent='₹'+fmtINR(cost);$('#repWallet').textContent='₹'+fmtINR(profile.wallet);
  $('#repFull').disabled=need<=0||profile.wallet<cost;
  const afford=Math.floor(profile.wallet/V.cost);
  $('#repHalf').disabled=need<=0||(afford<=0&&jugaadUsed);
  $('#repHalf').textContent=afford<=0?'Jugaad fix (free)':`Patch it up (₹${fmtINR(Math.min(need,afford)*V.cost)})`;
  show('repair');
}
function doRepair(full){
  const V=VEH[P.type];const need=Math.round(100-P.cond);
  if(full){const cost=need*V.cost;if(profile.wallet<cost)return;profile.wallet-=cost;P.cond=100;toast('Fully repaired','good');}
  else{const afford=Math.floor(profile.wallet/V.cost);
    if(afford<=0){if(jugaadUsed)return;jugaadUsed=true;P.cond=Math.max(P.cond,35);toast('The mechanic did a jugaad fix for free','good');}
    else{const fix=Math.min(need,afford);profile.wallet-=fix*V.cost;P.cond=Math.min(100,P.cond+fix);toast(`Patched up to ${Math.round(P.cond)}%`,'good');}}
  if(P.cond>0)P.broke=false;saveProfile();resumeDrive();
}
function towToGarage(){
  const ng=nearestGarage(P.x,P.y);if(!ng)return;const fee=Math.min(400,profile.wallet);profile.wallet-=fee;saveProfile();
  const g=ng.g;P.x=g.x;P.y=g.y;const n=nearestSeg(g.x,g.y,10);if(n.seg)P.h=n.seg.h;P.s=P.vx=P.vy=0;
  agents=agents.filter(a=>Math.hypot(a.x-P.x,a.y-P.y)>25);flash();toast(`Towed to ${g.name} · ₹${fee}`,'');
  garageLock=g;openRepair(g);
}
function resumeDrive(){state='play';show('play');if(FOOT.on){footHud(true);if(FOOT.ride){$('#footBar').hidden=true;$('#rideBar').hidden=false;$('#rbSkip').hidden=FOOT.ride.phase!=='ride';}return;}const V=VEH[P.type];if(!P.dry)Snd.startEngine(P.cond<=0?Object.assign({},V.engine,{vol:.4}):V.engine,P.type);}

/* ---------- fuel ---------- */
let fuelLock=null,fuelG=null;
function openFuel(g){
  fuelG=g;state='fuel';releaseAll();Snd.stopEngine();
  const F=FUEL[P.type],pr=FUELPRICE[F[2]];const need=(100-P.fuel)/100*F[1];const cost=Math.ceil(need*pr[0]);
  $('#fuTitle').textContent=g.name+(g.real?'':' fuel station');
  $('#fuText').textContent=F[2]==='ev'?`Your ${VEH[P.type].name} has a ${F[1]} kWh battery. Charging at this station.`:`${pr[1]} for your ${VEH[P.type].name}: ${F[1]} ${pr[2]} tank. Bengaluru prices, approximate.`;
  $('#fuLvlL').textContent=F[2]==='ev'?'Battery':'Tank';$('#fuLvl').textContent=Math.round(P.fuel)+'%';
  $('#fuPriceL').textContent=`${pr[1]} per ${pr[2]}`;$('#fuPrice').textContent='₹'+pr[0].toFixed(2);$('#fuWallet').textContent='₹'+fmtINR(profile.wallet);
  $('#fuFull').textContent=profile.wallet>=cost?`Fill up (₹${fmtINR(cost)})`:`Fill what you can (₹${fmtINR(profile.wallet)})`;$('#fuFull').disabled=need<.05||profile.wallet<1;
  $('#fuSome').disabled=profile.wallet<200||need<.05;
  show('fuelScr');
}
function buyFuel(rupees){
  const F=FUEL[P.type],pr=FUELPRICE[F[2]];const need=(100-P.fuel)/100*F[1];
  const spend=Math.min(rupees,profile.wallet,Math.ceil(need*pr[0]));const litres=spend/pr[0];
  profile.wallet-=spend;P.fuel=Math.min(100,P.fuel+litres/F[1]*100);P.dry=false;saveProfile();
  toast(`${F[2]==='ev'?'Charged':'Filled'} ${litres.toFixed(1)} ${pr[2]} · ₹${fmtINR(spend)}`,'good');resumeDrive();
}
function fuelCan(){const fee=Math.min(250,profile.wallet);profile.wallet-=fee;P.fuel=Math.max(P.fuel,12);P.dry=false;saveProfile();toast(`Help arrived · ₹${fee}`,'good');Snd.startEngine(VEH[P.type].engine,P.type);noticeKey='~';}
$('#fuFull').addEventListener('click',()=>buyFuel(1e9));$('#fuSome').addEventListener('click',()=>buyFuel(200));$('#fuLeave').addEventListener('click',()=>resumeDrive());

/* ---------- trips ---------- */
function newTrip(){
  if(licenceSuspended()){trip=null;return;}
  let best=null;
  for(let tries=0;tries<300&&!best;tries++){
    const s=W.segs[Math.floor(Math.random()*W.segs.length)];if(!s||!s.w.name||s.w.cls==='service')continue;
    const x=(s.ax+s.bx)/2,y=(s.ay+s.by)/2,d=Math.hypot(x-P.x,y-P.y);
    if(d>380&&d<1300&&x>W.bounds.x0+150&&x<W.bounds.x1-150&&y>W.bounds.y0+150&&y<W.bounds.y1-150)best={x,y,name:s.w.name,d0:d};
  }
  if(!best){for(let tries=0;tries<200&&!best;tries++){const s=W.segs[Math.floor(Math.random()*W.segs.length)];if(!s)continue;const x=(s.ax+s.bx)/2,y=(s.ay+s.by)/2,d=Math.hypot(x-P.x,y-P.y);if(d>150)best={x,y,name:s.w.name||'the marked spot',d0:d};}}
  const V=VEH[P.type];const rate=V.cat==='car'?28:V.cat==='three'?22:16;
  trip=best?Object.assign(best,{clean:true,fare:Math.round(30+best.d0/1000*rate)}):null;
}
function checkTrip(){
  if(!trip)return;
  const d=Math.hypot(trip.x-P.x,trip.y-P.y);
  if(d<18&&Math.abs(P.s)<6){
    const bonus=trip.clean?15:0;const fare=trip.fare+bonus;
    profile.wallet+=fare;profile.trips++;session.trips++;session.fare+=fare;saveProfile();
    toast(`Trip done · ₹${fare}${bonus?' incl. smooth-ride bonus':''}`,'gold');Hap.success();Snd.chime();
    trip=null;setTimeout(()=>{if(state==='play'||state==='pause')newTrip();},1200);
  }
}

/* ---------- HUD ---------- */
const el={};['spd','limit','condbar','condTxt','fuelbar','fuelTxt','fuelLbl','wallet','licChip','road','clock','sig','sigN','sigT','trip','wanted','wantedTxt','rashbar','notice'].forEach(k=>el[k]=$('#'+k));
let lastRoad='',clockT=0,noticeKey='';
function placeName(){let best=null,bd=1800;for(const p of W.places){const d=Math.hypot(p.x-P.x,p.y-P.y);if(d<bd){bd=d;best=p;}}return best?best.name:'';}
function updateHud(){
  const sp=Math.abs(P.s)*3.6;el.spd.textContent=Math.round(sp);
  const lim=P.limit||40;el.limit.textContent=lim;el.limit.classList.toggle('over',sp>lim+10);
  el.condbar.style.width=P.cond+'%';el.condbar.style.background=P.cond>55?'var(--ok)':P.cond>25?'var(--auto-yellow)':'var(--danger)';el.condTxt.textContent=Math.round(P.cond)+'%';
  el.wallet.textContent=fmtINR(profile.wallet);el.licChip.hidden=!licenceSuspended();
  el.fuelbar.style.width=P.fuel+'%';el.fuelbar.style.background=P.fuel>25?'#4FC3F7':P.fuel>12?'var(--auto-yellow)':'var(--danger)';el.fuelTxt.textContent=Math.round(P.fuel)+'%';el.fuelLbl.textContent=FUEL[P.type][2]==='ev'?'Charge':'Fuel';
  const nm=INT.on?(INT.b&&INT.b.vname||({house:'House',apartment:'Apartment',shop:'Shop',restaurant:'Restaurant',cafe:'Cafe',bar:'Bar & pub',mall:'Shopping mall',office:'Office',police:'Police station',gym:'Gym'})[INT.kind]||'Indoors'):FLY.on?'Kempegowda Airspace':P.offroad?'Off road':(P.road&&(P.road.w.name||'Unnamed road'))||'Off road';if(nm!==lastRoad){lastRoad=nm;el.road.textContent=nm;}
  clockT-=.1;if(clockT<=0){clockT=5;const pn=placeName();el.clock.textContent=(pn?pn+' · ':'')+clockText();}
  if(sigHud&&sigHud.d<85){el.sig.hidden=false;const c=sigHud.st[0];el.sig.querySelectorAll('.lamps i').forEach(i=>i.classList.toggle('on',i.classList.contains(c==='R'?'r':c==='A'?'a':'g')));el.sigN.textContent=Math.ceil(sigHud.st[1]);el.sigT.textContent=(c==='R'?'Stop at the line':c==='A'?'Signal changing':'Go')+'\n'+Math.max(0,Math.round(sigHud.d))+' m';el.sigT.style.whiteSpace='pre';}
  else el.sig.hidden=true;
  if(COP.list.length){el.wanted.hidden=false;el.wanted.querySelectorAll('.stars i').forEach((s,i)=>s.classList.toggle('on',i<COP.level));let md=1e9;for(const c of COP.list)md=Math.min(md,Math.hypot(c.x-P.x,c.y-P.y));el.wantedTxt.textContent=`Hoysala ${Math.round(md)} m behind`;}
  else if(P.rash>5){el.wanted.hidden=false;el.wanted.querySelectorAll('.stars i').forEach(s=>s.classList.remove('on'));el.wantedTxt.textContent='Drive carefully';}
  else el.wanted.hidden=true;
  el.rashbar.style.width=clamp(P.rash,0,100)+'%';
  lifeHud();
  el.limit.hidden=FOOT.on||FLY.on;
  if(FLY.on){el.sig.hidden=true;el.trip.innerHTML='<div><b>Flying</b></div><div>Land on a runway and stop to get out</div>';if(noticeKey!=='fly'){noticeKey='fly';el.notice.hidden=true;}return;}
  if(footHudTick(el))return;
  if(trip){const d=Math.hypot(trip.x-P.x,trip.y-P.y);el.trip.innerHTML='';const a=document.createElement('div');a.innerHTML='Drop at <b></b>';a.querySelector('b').textContent=trip.name;const b=document.createElement('div');b.textContent=`${d<1000?Math.round(d/10)*10+' m':(d/1000).toFixed(1)+' km'} · fare ₹${trip.fare}`;el.trip.append(a,b);}
  else el.trip.textContent=licenceSuspended()?'No passengers: licence suspended':'Finding a passenger';
  /* breakdown, fuel and repair notices */
  const ng=nearestGarage(P.x,P.y),nf=nearestFuel(P.x,P.y);let key='',html='';const fm=d=>d<1000?Math.round(d/10)*10+' m':(d/1000).toFixed(1)+' km';
  const ev=FUEL[P.type][2]==='ev';
  if(P.cond<=0){key='broke';html=`<b>Broken down.</b> Limp to a mechanic${ng?' '+fm(ng.d)+' away':''}, or call a tow.<div class="row" style="margin-top:6px"><button class="sbtn y" id="towBtn">Call tow (₹400)</button></div>`;}
  else if(P.dry){key='dry';html=`<b>${ev?'Battery empty':'Out of fuel'}.</b> Push to ${nf?nf.g.name+' '+fm(nf.d)+' away':'a bunk'}, or call for help.<div class="row" style="margin-top:6px"><button class="sbtn y" id="canBtn">${ev?'Call for a charge':'Call for fuel'} (₹250)</button></div>`;}
  else if(P.fuel<15&&nf){key='low'+Math.round(nf.d/50);html=`${ev?'Low charge':'Low fuel'} · <b>${nf.g.name}</b> ${fm(nf.d)} away (blue beam)`;}
  else if(P.cond<35&&ng){key='rep'+Math.round(ng.d/50);html=`Needs repair · mechanic <b>${fm(ng.d)}</b> away (green beam)`;}
  if(key!==noticeKey){noticeKey=key;el.notice.hidden=!key;el.notice.innerHTML=html;const tb=$('#towBtn');if(tb)tb.addEventListener('click',towToGarage);const cb=$('#canBtn');if(cb)cb.addEventListener('click',fuelCan);}
  if(nf){if(fuelLock&&Math.hypot(fuelLock.x-P.x,fuelLock.y-P.y)>25)fuelLock=null;
    if(!fuelLock&&nf.d<10&&Math.abs(P.s)<1.5&&P.fuel<97){fuelLock=nf.g;openFuel(nf.g);return;}}
  /* arrive at a mechanic */
  if(ng){if(garageLock&&Math.hypot(garageLock.x-P.x,garageLock.y-P.y)>25)garageLock=null;
    if(!garageLock&&ng.d<9&&Math.abs(P.s)<1.5&&P.cond<99.5){garageLock=ng.g;openRepair(ng.g);}}
}
function clockText(){
  const o=MAP.origin||{lat:12.97,lon:77.59};const inIndia=o.lat>6&&o.lat<37&&o.lon>68&&o.lon<98;let t;
  try{t=new Intl.DateTimeFormat('en-IN',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:inIndia?'Asia/Kolkata':undefined}).format(new Date());}catch(e){t=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});}
  return `${TOD.label} · ${settings.tod!=='auto'?'set in Settings':t}`;
}
const mini=$('#mini'),mctx=mini.getContext('2d');
function renderMini(){
  const m=mctx,S=mini.width,R=260,sc=(S/2)/R;
  m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,S,S);m.save();m.beginPath();m.arc(S/2,S/2,S/2-2,0,TAU);m.clip();
  m.fillStyle='rgba(20,26,34,.9)';m.fillRect(0,0,S,S);
  m.translate(S/2,S/2);m.rotate(-P.h);m.scale(sc,sc);m.translate(-P.x,-P.y);
  const segs=[];gQuery(W.sG,P.x,P.y,R,segs);m.lineCap='round';
  for(const k of ORDER){m.strokeStyle=RANK[k]>=3?'#E7D9A6':k==='tertiary'?'#B8BCC2':'#7D848D';m.lineWidth=HW[k]*1.6;m.beginPath();for(const s of segs){if(s.w.cls!==k)continue;m.moveTo(s.ax,s.ay);m.lineTo(s.bx,s.by);}m.stroke();}
  for(const g of W.garages){if(Math.abs(g.x-P.x)>R||Math.abs(g.y-P.y)>R)continue;m.fillStyle='#53D68E';m.fillRect(g.x-9,g.y-9,18,18);}
  for(const g of W.fuels){if(Math.abs(g.x-P.x)>R||Math.abs(g.y-P.y)>R)continue;m.fillStyle='#4FC3F7';m.fillRect(g.x-10,g.y-10,20,20);}
  footMini(m,R);
  if(trip){m.fillStyle='#FFC72C';m.beginPath();m.arc(trip.x,trip.y,12,0,TAU);m.fill();}
  policeMini(m,R);
  m.restore();
  const arrow=(tx,ty,col)=>{const ang=hAng(tx-P.x,ty-P.y)-P.h;const d=Math.hypot(tx-P.x,ty-P.y);if(d>R*.9){m.save();m.translate(S/2,S/2);m.rotate(ang);m.fillStyle=col;m.beginPath();m.moveTo(0,-S/2+6);m.lineTo(-11,-S/2+26);m.lineTo(11,-S/2+26);m.closePath();m.fill();m.restore();}};
  if(trip)arrow(trip.x,trip.y,'#FFC72C');footArrows(arrow);
  if(!FOOT.on&&P.cond<35){const ng=nearestGarage(P.x,P.y);if(ng)arrow(ng.g.x,ng.g.y,'#53D68E');}
  if(!FOOT.on&&P.fuel<15){const nf=nearestFuel(P.x,P.y);if(nf)arrow(nf.g.x,nf.g.y,'#4FC3F7');}
  m.fillStyle='#FFFFFF';m.beginPath();m.moveTo(S/2,S/2-11);m.lineTo(S/2-8,S/2+9);m.lineTo(S/2,S/2+4);m.lineTo(S/2+8,S/2+9);m.closePath();m.fill();
}

/* ---------- signboards for real shops and places ---------- */
const BOARD={restaurant:['#B71C1C','#FFE082'],fast_food:['#B71C1C','#FFE082'],cafe:['#4E342E','#FFE0B2'],bakery:['#6D4C41','#FFF3E0'],confectionery:['#AD1457','#FFF'],
  place_of_worship:['#E65100','#FFF8E1'],school:['#1B5E20','#FFF'],college:['#1B5E20','#FFF'],hospital:['#FFFFFF','#C62828'],pharmacy:['#FFFFFF','#2E7D32'],clinic:['#FFFFFF','#C62828'],
  bank:['#0D2B6B','#FFF'],atm:['#0D2B6B','#FFF'],fuel:['#F9A825','#1A1A1A'],dairy:['#1565C0','#FFF'],grocery:['#2E7D32','#FFF'],convenience:['#2E7D32','#FFF'],supermarket:['#2E7D32','#FFF'],clothes:['#6A1B9A','#FFF'],hardware:['#37474F','#FFEB3B']};
function boardTex(q){
  const key='poi:'+q.name+'|'+q.sub;
  return textTex(key,(c,w,h)=>{const sty=BOARD[q.sub]||BOARD[q.cls]||['#263238','#FFFFFF'];
    c.fillStyle=sty[0];c.fillRect(0,0,w,h);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=6;c.strokeRect(3,3,w-6,h-6);
    c.fillStyle=sty[1];c.textAlign='center';c.textBaseline='middle';let fs=56;const t=q.name.length>26?q.name.slice(0,25)+'…':q.name;
    c.font=`700 ${fs}px "Barlow Semi Condensed", Arial, sans-serif`;while(c.measureText(t).width>w-30&&fs>24){fs-=3;c.font=`700 ${fs}px "Barlow Semi Condensed", Arial, sans-serif`;}
    c.fillText(t,w/2,h*.44);if(q.sub){c.font='500 26px "Barlow Semi Condensed", Arial, sans-serif';c.globalAlpha=.85;c.fillText(q.sub.replace(/_/g,' ').toUpperCase(),w/2,h*.82);c.globalAlpha=1;}},512,128);
}
function garageTex(g){return textTex('gar:'+g.name,(c,w,h)=>{c.fillStyle='#C62828';c.fillRect(0,0,w,h);c.fillStyle='#FFD54F';c.textAlign='center';c.textBaseline='middle';c.font='700 50px "Barlow Semi Condensed", Arial, sans-serif';c.fillText('MECHANIC · PUNCTURE',w/2,h*.36);c.fillStyle='#FFF';let fs=34;c.font=`600 ${fs}px "Barlow Semi Condensed", Arial, sans-serif`;c.fillText(g.name.length>30?g.name.slice(0,29)+'…':g.name,w/2,h*.76);},512,128);}
function fuelTex(g){return textTex('fuel:'+g.name,(c,w,h)=>{c.fillStyle='#24303F';c.fillRect(0,0,w,h);c.strokeStyle='#F2F2EE';c.lineWidth=6;c.strokeRect(8,8,w-16,h-16);c.fillStyle='#FFFFFF';c.textAlign='center';c.textBaseline='middle';let fs=58;c.font=`700 ${fs}px Arial, sans-serif`;while(c.measureText(g.name).width>w-40&&fs>26){fs-=3;c.font=`700 ${fs}px Arial, sans-serif`;}c.fillText(g.name,w/2,h*.4);c.font='600 26px Arial, sans-serif';c.fillStyle='#CFE8FF';c.fillText('PETROL · DIESEL · AIR',w/2,h*.76);},256,128);}
function beamTex(){return textTex('beam',(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.6,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,.9)');c.fillStyle=g;c.fillRect(0,0,w,h);const g2=c.createLinearGradient(0,0,w,0);g2.addColorStop(0,'rgba(0,0,0,1)');g2.addColorStop(.5,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,1)');c.globalCompositeOperation='destination-out';c.fillStyle=g2;c.fillRect(0,0,w,h);},32,256);}

/* ---------- drawing the frame ---------- */
const TM=M4.create(),TM2=M4.create();
function resizeGL(){
  const r=settings.gfx==='fast'?1:settings.gfx==='ultra'?Math.min(2,window.devicePixelRatio||1):Math.min(1.5,window.devicePixelRatio||1);
  const w=Math.round(glc.clientWidth*r),h=Math.round(glc.clientHeight*r);if(glc.width!==w||glc.height!==h){glc.width=w;glc.height=h;}
}
function setFrameUniforms(){
  frameId++;
  FU.vp=CAM.vp;FU.inv=CAM.inv;FU.cam=CAM.eye;FU.right=CAM.right;
  const night=TOD.night;
  FU.fog=settings.gfx==='fast'?[90,330]:[130+(1-night)*60,(settings.gfx==='ultra'?560:470)-night*170];
  FU.fogCol=TOD.fog;FU.sunDir=TOD.sunDir;FU.sunCol=TOD.sun;FU.sky=TOD.sky;FU.gnd=TOD.gnd;FU.night=night;
  FU.hl=night>.15?night*1.4:0;
  const V=curModel();const hp=V.lights.head[0];const hw=M4.xform(P.M,hp[0],hp[1],hp[2]);
  FU.hlPos=hw;FU.hlDir=(()=>{const d=[Math.sin(P.h),-.12,-Math.cos(P.h)];const l=Math.hypot(...d);return d.map(v=>v/l);})();
  wxFrame();
}
function lightsFor(model,M,headOn,brake,night){
  if(!model.lights)return;
  if(headOn)for(const p of model.lights.head){const w=M4.xform(M,p[0],p[1],p[2]-.05);DGr.bill(w[0],w[1],w[2],.55,[1,.9,.7],CAM.right);}
  const tk=brake?1:night*.6;if(tk>.05)for(const p of model.lights.tail){const w=M4.xform(M,p[0],p[1],p[2]+.05);DGr.bill(w[0],w[1],w[2],brake?.5:.35,[1*tk,.1*tk,.05*tk],CAM.right);}
}
function renderScene(dt){
  resizeGL();
  let V=VEH[P.type],pm=curModel();const fv=FOOT.on?footView():null;if(fv){V=fv.V;pm=fv.pm;}
  setupCamera(dt,P,V,pm);metroCam();flightCam();setFrameUniforms();shadowPass(dt);
  const night=TOD.night;
  gl.viewport(0,0,glc.width,glc.height);
  gl.clearColor(FU.fogCol[0],FU.fogCol[1],FU.fogCol[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.BLEND);
  {const sk=wxSky();drawSky(sk[0],sk[1],sk[2],TOD.sunC.map(v=>v*(1-WX.rain*.9)),night*.9*(1-WX.rain));}
  /* ground layers are painted in order, without depth */
  gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
  M4.model(TM,Math.round(P.x/100)*100,0,Math.round(P.y/100)*100,0,0,0);drawLit(GROUND,TM,{cull:false,tex:TEX.dirt,emTex:TEX.black});
  drawLit(AREAMESH,null,{cull:false,tex:TEX.dirt,emTex:TEX.black});
  const vis=[];const ex=CAM.eye[0],ez=CAM.eye[2];const R=(settings.gfx==='fast'?360:settings.gfx==='ultra'?560:460)+CH*.75;
  for(const[,c]of CHUNKS){const cx=(c.cx+.5)*CH-ex,cz=(c.cy+.5)*CH-ez;const d=Math.hypot(cx,cz);if(d>R)continue;if(d>CH*1.2&&(cx*CAM.fwd[0]+cz*CAM.fwd[2])/d<-.35)continue;vis.push(c);}
  for(const c of vis)drawLit(c.cas,null,{cull:false,tex:TEX.pave,emTex:TEX.black});
  for(const c of vis)drawLit(c.asp,null,{cull:false,tex:TEX.asph,emTex:TEX.black});
  for(const L of['mrk','dec'])for(const c of vis)drawLit(c[L],null,{cull:false});
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  if(!FU.shOn)for(const c of vis)drawGlowMesh(c.shad,1,.32*(1-night*.7)*(1-WX.rain*.6));
  DS.reset();
  const sh=(x,y,h,l,w)=>DS.quad(x,.03,y,Math.sin(h),-Math.cos(h),l,w,ZERO3);
  if(fv&&fv.foot){sh(P.x,P.y,P.h,.35,.35);if(FOOT.ride)sh(FOOT.ride.x,FOOT.ride.y,FOOT.ride.h,FOOT.ride.t.len*.6,FOOT.ride.t.wid*.72);}else sh(P.x,P.y,P.h,(pm.len||P.len)*.62,(pm.wid||P.wid)*.75);
  for(const a of agents)sh(a.x,a.y,a.h,a.t.len*.6,a.t.wid*.72);
  for(const c of COP.list)sh(c.x,c.y,c.h,2.6,1.3);
  for(const p of peds){if(p.state==='down')continue;if(p.cart!=null)sh(p.cx,p.cy,p.h,1.1,.7);sh(p.x,p.y,p.h,p.kind==='lie'?1:.35*(p.sc||1),.35*(p.sc||1));}
  for(const n of animals)sh(n.x,n.y,n.h,n.kind==='cow'?1.1:.45,n.kind==='cow'?.6:.25);
  if(intruder)sh(intruder.x,intruder.y,intruder.h,intruder.t.len*.6,intruder.t.wid*.72);
  DS.draw(1,.42*(1-night*.6));
  gl.disable(gl.BLEND);
  /* solid world */
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
  for(const c of vis)drawLit(c.sol,null,{tex:TEX.wall,emTex:TEX.wallE,emiK:night*1.8});
  {const G=glassTex();for(const c of vis)if(c.gls&&c.gls.n)drawLit(c.gls,null,{tex:G.t,emTex:G.e,emiK:.15+night*1.6});}
  for(const c of vis)drawLit(c.shp,null,{tex:TEX.shop,emTex:TEX.shopE});
  {const at=adsTex().tex;for(const c of vis)drawLit(c.ads,null,{tex:at,emTex:at,emiK:.2+night*.7});}
  /* live signal lamps */
  for(const c of vis)for(const hd of c.heads){if(Math.hypot(hd.x-ex,hd.y-ez)>200)continue;
    const st=sigState(hd.arm.S,hd.arm.ph,GT);const i=st[0]==='R'?0:st[0]==='A'?1:2;
    const col=[[1,.12,.08],[1,.62,.08],[.15,1,.4]][i];
    M4.model(TM,hd.x,4.6,hd.y,-hd.ang,0,0);M4.model(TM2,0,.32-i*.32,-.165,0,0,0);M4.mul(TM2,TM,TM2);
    drawLit(LAMP,TM2,{tint:col,emiAdd:col.map(v=>v*1.1),noHL:true});
    const w=M4.xform(TM2,0,0,-.05);DGr.bill(w[0],w[1],w[2],.6,col,CAM.right);}
  /* traffic, people, animals */
  const A=animalModels();
  for(const a of agents){const d=Math.hypot(a.x-ex,a.y-ez);if(d>R)continue;M4.model(TM,a.x,0,a.y,-a.h,0,-a.lean);drawLit(a.model.body,TM,{emiK:.5+night});if(a.model.glass)drawLit(a.model.glass,TM);if(a.model.rider)drawLit(a.model.rider,TM);if(a.patrol&&a.model.decal){drawLit(a.model.decal.mesh,TM,{tex:hoysalaTex().tex,emTex:TEX.black});const lb=a.model.lightbar;if(lb){drawLit(lb.red,TM,{emiAdd:[.25,.02,.02]});drawLit(lb.blue,TM,{emiAdd:[.02,.05,.3]});}}if(a.model.decal2&&d<120){const tx=a.model.decal2.tex().tex;drawLit(a.model.decal2.mesh,TM,{tex:tx,emTex:tx,emiK:.15+night*.4});}
    if(d<160)lightsFor(a.model,TM,night>.25,a.brake&&a.v>.5,night);}
  for(const p of peds){if(Math.hypot(p.x-ex,p.y-ez)>180)continue;
    if(p.state==='static'){
      if(p.kind==='vendor'){M4.model(TM,p.cx,0,p.cy,-p.h,0,0);drawLit(A.cart[p.cart],TM);M4.model(TM,p.x,0,p.y,-p.h,0,0);drawLit(A.vendor[p.vv],TM);}
      else if(p.kind==='sit'){M4.model(TM,p.x,0,p.y,-p.h,0,0);drawLit(A.sit[p.v],TM);}
      else{M4.model(TM,p.x,0,p.y,-p.h,0,0);drawLit(A.lie[p.v],TM);}
      continue;}
    if(p.rp||p.strip||p.culprit||p.state==='stalk'||p.state==='hostile'||p.state==='argue'||p.state==='brawl'||(p.state==='down'&&Math.hypot(p.x-ex,p.y-ez)<40)){pedRig(p);continue;}
    const moving=p.state==='walk'||p.state==='cross'||p.state==='play'||p.state==='flee';const m=A.ped[p.v][moving?p.pose:0];
    if(p.state==='down')M4.model(TM,p.x,.15,p.y,-p.fall,-Math.PI/2,0,p.sc||1);else M4.model(TM,p.x,0,p.y,-p.h,0,0,p.sc||1);drawLit(m,TM);}
  for(const n of animals){if(Math.hypot(n.x-ex,n.y-ez)>200)continue;let m;
    if(n.kind==='cow')m=n.lie?A.cowLie[n.v]:A.cow[n.v*2+(n.state==='wander'||n.state==='cross'?n.pose:0)];
    else if(n.kind==='dog')m=A.dog[n.v][n.state==='idle'?0:n.pose];else m=A.cat[n.v][n.event||n.state!=='idle'?n.pose:0];
    M4.model(TM,n.x,0,n.y,-n.h,0,0,n.event?1.8:1);drawLit(m,TM,{emiK:.6+night});}
  lifeRender(A,night,ex,ez);drawPoiSigns(night);drawVenues(ex,ez,night,A);drawFixedSigns(ex,ez,night);drawStations(night);drawAir(night);
  const fl=(GT*4|0)%2;
  for(const c of COP.list){const cm=c.model;M4.model(TM,c.x,0,c.y,-c.h,0,0);drawLit(cm.body,TM,{emiK:.5+night});
    drawLit(cm.decal.mesh,TM,{tex:hoysalaTex().tex,emTex:TEX.black});
    drawLit(cm.lightbar.red,TM,{emiAdd:fl?[1.2,.1,.1]:ZERO3});drawLit(cm.lightbar.blue,TM,{emiAdd:fl?ZERO3:[.1,.25,1.4]});
    const lp=M4.xform(TM,cm.lightbar.pos[0]+(fl?-.26:.26),cm.lightbar.pos[1],cm.lightbar.pos[2]);DGr.bill(lp[0],lp[1],lp[2],2.2,fl?[1,.1,.08]:[.15,.3,1],CAM.right);
    lightsFor(cm,TM,night>.25,false,night);}
  if(intruder){M4.model(TM,intruder.x,0,intruder.y,-intruder.h,0,0);drawLit(intruder.model.body,TM,{emiK:.5+night});if(intruder.model.glass)drawLit(intruder.model.glass,TM);if(intruder.model.rider)drawLit(intruder.model.rider,TM);lightsFor(intruder.model,TM,true,false,night);}
  /* player */
  if(FLY.on){}
  else if(fv)drawFootPlayer(fv,A,night);
  else if(CAM.mode==='cockpit'){
    drawLit(pm.body,P.M,{emiK:.4+night*.6});drawLit(pm.cockpit,P.M,{emiK:.6+night*.8,noHL:true});
    if(pm.steer){const sp=pm.steerPos;M4.model(TM,sp[0],sp[1],sp[2],0,-.42,-P.steer*1.9);M4.mul(TM2,P.M,TM);drawLit(pm.steer,TM2,{noHL:true});}
  }else{drawLit(pm.body,P.M,{emiK:.5+night});if(pm.glass)drawLit(pm.glass,P.M);if(pm.rider)drawLit(pm.rider,P.M);if(pm.decal)drawLit(pm.decal.mesh,P.M,{tex:hoysalaTex().tex,emTex:TEX.black});if(pm.decal2){const tx=pm.decal2.tex().tex;drawLit(pm.decal2.mesh,P.M,{tex:tx,emTex:tx,emiK:.15});}}
  if(!fv&&!FLY.on&&CAM.mode!=='cockpit')lightsFor(pm,P.M,night>.2,input.brake&&Math.abs(P.s)>.5,night);
  /* light, glow and signboards */
  gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
  if(night>.05){for(const c of vis)drawGlowMesh(c.glow,0,night*.5);
    DGb.reset();const beam=(M,model)=>{for(const p of model.lights.head){const w=M4.xform(M,p[0],.05,p[2]);DGb.quad(w[0],.06,w[2],Math.sin(model._h),-Math.cos(model._h),16,4.5,[1,.88,.65],true);}};
    if(!fv&&!FLY.on){pm._h=P.h;beam(P.M,pm);}
    for(const a of agents){if(Math.hypot(a.x-ex,a.y-ez)>140)continue;a.model._h=a.h;M4.model(TM,a.x,0,a.y,-a.h,0,0);beam(TM,a.model);}
    DGb.draw(2,night*.55);}
  DGr.draw(0,.75+night*.6);DGr.reset();
  drawRain();
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
  if(trip){const d=Math.hypot(trip.x-ex,trip.y-ez);drawSprite(beamTex().tex,trip.x,0,trip.y,3.2+d*.01,45,[1,.8,.25]);}
  drawFootBeams(ex,ez);
  if(!FOOT.on&&P.cond<35){const ng=nearestGarage(P.x,P.y);if(ng)drawSprite(beamTex().tex,ng.g.x,0,ng.g.y,3+ng.d*.01,40,[.3,1,.45]);}
  if(!FOOT.on&&P.fuel<15){const nf=nearestFuel(P.x,P.y);if(nf)drawSprite(beamTex().tex,nf.g.x,0,nf.g.y,3+nf.d*.01,40,[.3,.7,1]);}
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.BLEND);gl.depthMask(true);
}

/* ---------- main loop ---------- */
let lastT=performance.now(),fpsAcc=0,fpsN=0;
function frame(t){
  const dt=Math.min(.05,(t-lastT)/1000);lastT=t;
  if(state==='play'){GT+=dt;update(dt);}
  if(['play','pause','repair','outcome','fuel'].includes(state)){
    if(state!=='play')updateChunks(P.x,P.y,4);
    try{if(INT.on)renderInterior(dt);else renderScene(dt);}catch(e){console.error(e);}
  }
  requestAnimationFrame(frame);
}
function update(dt){
  if(INT.on){updateInterior(dt);lifeUpdate(dt);if((hudT-=dt)<=0){hudT=.1;updateHud();}if((todT-=dt)<=0){todT=30;computeTod();}return;}
  if(FLY.on){updateAir(dt);updateAgents(dt);updatePeds(dt);updateAnimals(dt);updateCops(dt);lifeUpdate(dt);updateChunks(P.x,P.y,settings.gfx==='fast'?5:8);
    if((hudT-=dt)<=0){hudT=.1;updateHud();}if((miniT-=dt)<=0){miniT=.12;renderMini();}if((streamT-=dt)<=0){streamT=1.5;streamMap();}if((todT-=dt)<=0){todT=30;computeTod();}return;}
  updateAir(dt);
  if(FOOT.on){updateFoot(dt);updateAgents(dt);updatePeds(dt);updateAnimals(dt);updateCops(dt);}
  else{updatePlayer(dt);
  updateAgents(dt);updatePeds(dt);updateAnimals(dt);updateCops(dt);updateIntruder(dt);apshakunTick(dt);
  checkTrip();}
  lifeUpdate(dt);
  updateChunks(P.x,P.y,settings.gfx==='fast'?5:8);
  if((todT-=dt)<=0){todT=30;computeTod();}
  if((hudT-=dt)<=0){hudT=.1;updateHud();}
  if((miniT-=dt)<=0){miniT=.12;renderMini();}
  if((poiT-=dt)<=0){poiT=.5;const tmp=[];gQuery(W.pG,P.x,P.y,140,tmp);tmp.sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y));nearPois=tmp.slice(0,settings.gfx==='fast'?8:16);}
  if((saveT-=dt)<=0){saveT=10;profile.km+=session.m/1000-(session.savedKm||0);session.savedKm=session.m/1000;saveProfile();}
  if((streamT-=dt)<=0){streamT=1.5;streamMap();}
}

/* ---------- loading the real map ---------- */
let streaming=false;
async function streamMap(){
  if(streaming)return;
  if(W.source==='tiles'){
    const need=tilesAround(P.x,P.y,900).filter(([x,y])=>{const k=x+','+y;return !TILES.loaded.has(k)&&!TILES.pending.has(k)&&!(TILES.failed.get(k)>Date.now());});
    if(!need.length)return;streaming=true;
    try{await loadTiles(need);}catch(e){for(const[x,y]of need)if(!TILES.loaded.has(x+','+y))TILES.failed.set(x+','+y,Date.now()+20000);}
    for(const[k,T]of TILES.loaded){const c=g2w((T.tx+.5)*EXT,(T.ty+.5)*EXT);if(Math.hypot(c[0]-P.x,c[1]-P.y)>3600)TILES.loaded.delete(k);}
    if(state==='play'||state==='pause'){const data=tilesToWorld([...TILES.loaded.values()]);if(data.roads.length>5){buildWorld(data);buildAreaMesh();}}
    streaming=false;
  }else if(W.source==='osm'){
    if(Math.hypot(P.x-W.center.x,P.y-W.center.y)<W.radius*.55)return;streaming=true;
    try{const ll=w2ll(P.x,P.y);const data=await overpassWorld(ll[0],ll[1],W.radius);if(state==='play'||state==='pause'){buildWorld(data);buildAreaMesh();W.center={x:P.x,y:P.y};}}
    catch(e){W.center={x:W.center.x+(P.x-W.center.x)*.3,y:W.center.y+(P.y-W.center.y)*.3};}
    streaming=false;
  }
}
function resetActors(){agents=[];peds=[];animals=[];intruder=null;COP.list=[];COP.level=0;COP.off=[];COP.trail=[];COP.lastTr=null;COP.pedHit=false;COP.caughtT=COP.lostT=0;apshReset();sigInside=new Map();Snd.sirenOff();}
async function startDrive(loc){
  currentLoc=loc;if(FOOT.on)leaveFoot();state='loading';show('loading');
  $('#loadActions').hidden=true;$('#loadWheel').hidden=false;const lt=$('#loadText');
  resetActors();clearChunks();
  if(loc.demo){lt.textContent='Building the demo city';await sleep(60);
    setOrigin(12.9716,77.5946);W.source='demo';W.realSignals=null;buildWorld(buildDemo());buildAreaMesh();W.label='Demo city';$('#attrib').textContent='Demo city · not a real map';
    return startPlay(false);}
  setOrigin(loc.lat,loc.lon);TILES.loaded.clear();TILES.failed.clear();W.realSignals=null;
  lt.textContent=`Loading the streets around ${loc.label}`;
  let why1='';
  try{
    await loadTiles(tilesAround(0,0,1100),m=>{lt.textContent=`${m} · ${loc.label}`;});
    lt.textContent='Laying roads and buildings';await sleep(30);
    const data=tilesToWorld([...TILES.loaded.values()]);
    if(data.roads.length<5)throw new Error('no streets were found at this spot');
    W.source='tiles';buildWorld(data);buildAreaMesh();W.label=loc.label;$('#attrib').textContent='© OpenStreetMap contributors · OpenFreeMap';
    startPlay(false);
    overpassSignals(loc.lat,loc.lon,2500).then(sig=>{if(sig.length>2&&W.source==='tiles'){W.realSignals=sig;buildSignals(sig);W.version++;}}).catch(()=>{});
    return;
  }catch(e){why1=(e&&e.message)||'unknown error';}
  try{
    lt.textContent=`Main map server failed (${why1}). Trying OpenStreetMap directly…`;
    const data=await overpassWorld(loc.lat,loc.lon,1000,m=>{lt.textContent=`${m} · ${loc.label}`;});
    W.source='osm';W.realSignals=data.signals&&data.signals.length>2?data.signals:null;buildWorld(data);buildAreaMesh();W.center={x:0,y:0};W.radius=1000;W.label=loc.label;$('#attrib').textContent='© OpenStreetMap contributors';
    startPlay(false);
  }catch(e2){
    $('#loadWheel').hidden=true;$('#loadActions').hidden=false;
    lt.textContent=`Couldn't load the map. Vector tiles: ${why1}. OpenStreetMap: ${(e2&&e2.message)||'failed'}. Check mobile data, then try again or drive the demo city.`;
  }
}
function startPlay(keepPos){
  if(!keepPos)P.skin=null;
  const V=VEH[P.type];const pm=curModel();P.len=pm.len;P.wid=pm.wid;
  if(!keepPos){
    let best=null,bd=1e9;
    const clear=s=>{const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;for(let t=s.len*.5-6;t<=s.len*.5+12;t+=3){const x=s.ax+dx*t,y=s.ay+dy*t;for(const o of[-1.5,0,1.5])if(inBuilding(x+dy*o,y-dx*o))return false;}return true;};
    for(const s of W.segs){if(s.len<30||s.w.br)continue;const pref=s.w.cls==='service'?400:RANK[s.w.cls]>=3?0:s.w.cls==='tertiary'?20:60;const d=Math.hypot((s.ax+s.bx)/2,(s.ay+s.by)/2)+pref;if(d<bd&&!nearSignal((s.ax+s.bx)/2,(s.ay+s.by)/2,30)&&clear(s)){bd=d;best=s;}}
    if(!best)best=W.segs[0];
    const dx=(best.bx-best.ax)/best.len,dy=(best.by-best.ay)/best.len,off=best.w.oneway?0:best.w.hw*.45;
    const dir=best.w.oneway&&best.w.rev?-1:1;
    P.x=(best.ax+best.bx)/2+dy*off*dir*.6;P.y=(best.ay+best.by)/2-dx*off*dir*.6;P.h=hAng(dx*dir,dy*dir);
    session={m:0,trips:0,fare:0,savedKm:0};trip=null;P.cond=100;P.broke=false;jugaadUsed=false;P.fuel=35+Math.random()*30;P.dry=false;
    for(let i=0;i<16;i++){const a=spawnAgent(true);if(a)agents.push(a);}
  }
  if(keepPos){P.fuel=45;P.dry=false;}
  P.s=0;P.vx=P.vy=0;P.steer=0;P.bounce=0;P.lean=0;P.rash=0;P.px=P.x;P.py=P.y;CAM.yaw=P.h;
  M4.model(P.M,P.x,0,P.y,-P.h,0,0);
  computeTod();clockT=0;hudT=0;lastRoad='';noticeKey='~';garageLock=null;fuelLock=null;
  const t0=performance.now();while(performance.now()-t0<1500&&updateChunks(P.x,P.y,400)>0){}
  if(!trip)newTrip();
  state='play';show('play');
  Snd.init();Snd.resume();Snd.startEngine(V.engine,P.type);
  calibrateTilt();
  toast(`${W.label} · ${TOD.label}`,'gold');
  if(licenceSuspended())goFoot(`Licence seized. Pay ₹${fmtINR(pendingTotal())} at the District Magistrate Court. Walk, ride or hitch there.`);
  else if(profile.pending.length)toast(`${profile.pending.length} unpaid challan${profile.pending.length>1?'s':''}: pay at the court (red beam)`,'');
}

/* ---------- screens ---------- */
const SCREENS=['title','where','showroom','loading','pause','repair','fuelScr','outcome','court','rideScr','jobScr','venueScr','hospScr','metroScr','lootScr','quitScr','settings'];
function show(id){
  for(const s of SCREENS)$('#'+s).hidden=s!==id;
  $('#hud').hidden=id!=='play';
  if(!['play','pause','repair','outcome','fuelScr'].includes(id)){Snd.stopEngine();Snd.sirenOff();}
  if(id==='title')renderTitle();
}
function go(id){
  if(id==='title'){state='menu';show('title');}
  else if(id==='where'){state='menu';show('where');}
  else if(id==='showroom'){state='menu';buildShowroom();show('showroom');}
}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
let splashDone=false;
function endSplash(){if(splashDone)return;splashDone=true;const s=$('#splash');s.style.transition='opacity .5s';s.style.opacity='0';setTimeout(()=>{s.hidden=true;},500);if(!gl){$('#glerr').hidden=false;return;}state='menu';show('title');}
$('#splash').addEventListener('pointerdown',()=>{Snd.init();Snd.resume();endSplash();});
setTimeout(endSplash,3900);
function renderTitle(){
  const t=$('#titlebg'),c=t.getContext('2d');const w=t.clientWidth,h=t.clientHeight;if(!w)return;
  t.width=w;t.height=h;const r=mulberry32(77);const base=h*.78;
  c.fillStyle='rgba(20,18,40,.85)';for(let x=0;x<w;){const bw=18+r()*46,bh=h*(.08+r()*.22);c.fillRect(x,base-bh,bw,bh);x+=bw+r()*6;}
  c.fillStyle='rgba(20,18,40,.95)';c.fillRect(w*.72,base-h*.42,10,h*.42);c.fillRect(w*.72-6,base-h*.30,22,h*.30);
  c.fillStyle='#14121F';c.fillRect(0,base,w,h-base);c.fillStyle='#F2C230';for(let x=0;x<w;x+=60)c.fillRect(x,base+(h-base)*.45,30,4);
  $('#titleStats').textContent=`Wallet ₹${fmtINR(profile.wallet)} · ${profile.km.toFixed(1)} km driven · ${profile.trips} trips`+(licenceSuspended()?` · Licence seized: pay ₹${fmtINR(pendingTotal())} at the court`:profile.pending.length?` · ${profile.pending.length} unpaid challan${profile.pending.length>1?'s':''}`:'');
}
$('#playBtn').addEventListener('click',()=>{Snd.init();Snd.resume();go('where');});

const AREAS=[
  {label:'MG Road',sub:'Central',lat:12.9755,lon:77.6068},{label:'Koramangala',sub:'80 Feet Road',lat:12.9352,lon:77.6245},
  {label:'Indiranagar',sub:'100 Feet Road',lat:12.9719,lon:77.6412},{label:'Jayanagar',sub:'4th Block',lat:12.9250,lon:77.5838},
  {label:'Malleshwaram',sub:'Sampige Road',lat:12.9967,lon:77.5713},{label:'Majestic',sub:'Kempegowda Bus Station',lat:12.9767,lon:77.5713},
  {label:'Whitefield',sub:'ITPL Main Road',lat:12.9698,lon:77.7500},{label:'Bannerghatta Road',sub:'Arekere',lat:12.8857,lon:77.5970},
  {label:'Demo city',sub:'Offline, no download',demo:true},
];
(function(){const box=$('#areas');for(const a of AREAS){const b=document.createElement('button');b.className='area';b.innerHTML='<b></b><small></small>';b.querySelector('b').textContent=a.label;b.querySelector('small').textContent=a.sub;
  b.addEventListener('click',()=>{currentLoc=a.demo?{demo:true,label:'Demo city'}:{lat:a.lat,lon:a.lon,label:a.label};go('showroom');});box.appendChild(b);}})();
const gpsNote=$('#gpsNote');
function gpsResult(r){
  $('#gpsBtn').disabled=false;
  if(r&&r.ok){currentLoc={lat:r.lat,lon:r.lon,label:'your street',acc:r.acc};gpsNote.className='note';gpsNote.textContent=`Found you (within ${Math.round(r.acc||0)} m).`;setTimeout(()=>go('showroom'),400);}
  else{gpsNote.className='note err';gpsNote.textContent=(r&&r.msg)||'Could not get your location. Pick an area below.';}
}
window.__nativeLocation=gpsResult;
$('#gpsBtn').addEventListener('click',()=>{
  gpsNote.className='note';gpsNote.textContent='Asking your phone for its location';$('#gpsBtn').disabled=true;
  if(window.OoshtNative&&OoshtNative.requestLocation){OoshtNative.requestLocation();return;}
  if(!navigator.geolocation){gpsResult({ok:false,msg:'This browser has no location access. Pick an area below.'});return;}
  navigator.geolocation.getCurrentPosition(p=>gpsResult({ok:true,lat:p.coords.latitude,lon:p.coords.longitude,acc:p.coords.accuracy}),
    e=>gpsResult({ok:false,msg:e.code===1?'Location permission is off. Allow it, or pick an area below.':e.code===2?'GPS is off or has no fix. Turn on location, or pick an area below.':'Location took too long. Try again outdoors, or pick an area below.'}),
    {enableHighAccuracy:true,timeout:15000,maximumAge:60000});
});

/* ---------- showroom with rendered thumbnails ---------- */
let selVeh=profile.vehicle in VEH?profile.vehicle:'auto',vcat=VEH[selVeh].cat,changingVehicle=false;const THUMBS={};
function thumb(k){
  if(THUMBS[k])return THUMBS[k];
  const m=playerModel(k);const w=240,h=160;
  resizeGL();if(glc.width<w||glc.height<h)return '';
  const L=Math.max(m.len,1.8);const eye=[L*.95,L*.55+.6,-L*.95],tgt=[0,.6+(m.len>3?.2:0),0];
  M4.persp(CAM.proj,.62,w/h,.1,100);M4.lookAt(CAM.view,eye,tgt,[0,1,0]);M4.mul(CAM.vp,CAM.proj,CAM.view);M4.invert(CAM.inv,CAM.vp);
  frameId++;Object.assign(FU,{vp:CAM.vp,inv:CAM.inv,cam:eye,right:[1,0,0],fog:[500,900],fogCol:[.07,.09,.11],sunDir:[.4,.8,-.45],sunCol:[.95,.92,.85],sky:[.45,.48,.55],gnd:[.25,.24,.22],night:0,hl:0,hlPos:[0,0,0],hlDir:[0,0,-1]});
  gl.viewport(0,0,w,h);gl.enable(gl.SCISSOR_TEST);gl.scissor(0,0,w,h);gl.clearColor(.07,.09,.11,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);
  drawLit(m.body,IDENT,{emiK:.6});if(m.glass)drawLit(m.glass,IDENT);
  gl.disable(gl.SCISSOR_TEST);
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(glc,0,glc.height-h,w,h,0,0,w,h);
  try{THUMBS[k]=cv.toDataURL('image/jpeg',.85);}catch(e){THUMBS[k]='';}
  return THUMBS[k];
}
function vstat(v){return{Speed:(v.top-55)/200,Pickup:(v.accel-2)/7.5,Handling:(v.handling-.8)/.6,Comfort:1-(v.susp-.5)/1.1};}
function buildShowroom(){
  const tabs=$('#vtabs');tabs.innerHTML='';
  for(const[c,l]of VCATS){const b=document.createElement('button');b.textContent=l;if(c===vcat)b.className='on';b.addEventListener('click',()=>{vcat=c;buildShowroom();});tabs.appendChild(b);}
  const box=$('#vlist');box.innerHTML='';
  for(const k of VKEYS){const v=VEH[k];if(v.cat!==vcat)continue;const b=document.createElement('button');b.className='veh'+(k===selVeh?' sel':'');
    const src=thumb(k);let im;if(src){im=document.createElement('img');im.src=src;im.alt=v.name;}else{im=document.createElement('div');im.className='ph';}
    const nm=document.createElement('b');nm.textContent=v.name;const sb=document.createElement('small');sb.textContent=`${v.sub} · ${v.top} km/h`;
    const ms=document.createElement('div');ms.className='meters';
    for(const[lab,val]of Object.entries(vstat(v))){const r=document.createElement('div');r.className='meter';r.innerHTML=`<span>${lab}</span><i style="--v:${Math.round(clamp(val,.08,1)*100)}%"></i>`;ms.appendChild(r);}
    b.append(im,nm,sb,ms);b.addEventListener('click',()=>{selVeh=k;buildShowroom();});box.appendChild(b);}
  $('#vehNote').textContent=`${VEH[selVeh].name}: repairs cost ₹${VEH[selVeh].cost} per 1% damage.`;
}
$('#driveBtn').addEventListener('click',()=>{profile.vehicle=selVeh;saveProfile();P.type=selVeh;Snd.init();Snd.preload(selVeh,VEH[selVeh].cat);
  if(changingVehicle&&W.segs.length){changingVehicle=false;startPlay(true);return;}
  startDrive(currentLoc||{demo:true,label:'Demo city'});});
$('#retryBtn').addEventListener('click',()=>startDrive(currentLoc));
$('#demoBtn').addEventListener('click',()=>startDrive({demo:true,label:'Demo city'}));

function pause(){if(state!=='play')return;state='pause';show('pause');releaseAll();profile.km+=session.m/1000-(session.savedKm||0);session.savedKm=session.m/1000;saveProfile();}
function resume(){if(state!=='pause')return;resumeDrive();if(COP.list.length)Snd.sirenOn();}
$('#pauseBtn').addEventListener('click',pause);$('#resumeBtn').addEventListener('click',resume);
$('#quitBtn').addEventListener('click',()=>{resetActors();go('title');});
$('#changeBtn').addEventListener('click',()=>{changingVehicle=true;go('showroom');});
$('#repFull').addEventListener('click',()=>doRepair(true));$('#repHalf').addEventListener('click',()=>doRepair(false));
$('#repLeave').addEventListener('click',()=>resumeDrive());
$('#outPrimary').addEventListener('click',()=>{if($('#outPrimary').dataset.end){goFoot();toast('Head to the court: follow the red beam','bad');}else{resumeDrive();}});
$('#outMenu').addEventListener('click',()=>{resetActors();go('title');});
$('#camBtn').addEventListener('click',()=>{const order=['chase','cockpit','far'];CAM.mode=order[(order.indexOf(CAM.mode)+1)%3];settings.cam=CAM.mode;saveSettings();toast({chase:'Chase view',cockpit:'Cockpit view',far:'Top view'}[CAM.mode],'','cam',300);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();Snd.hornOff();if(Snd.ctx&&Snd.ctx.suspend)Snd.ctx.suspend();}else Snd.resume();});
window.__onBack=()=>{
  if(!$('#settings').hidden){closeSettings();return true;}
  if(state==='play'){pause();return true;}if(state==='pause'){resume();return true;}
  if(state==='venue'){$('#vnClose').click();return true;}if(state==='metro'){$('#mtClose').click();return true;}if(state==='hosp')return true;
  if(state==='court'){$('#ctLeave').click();return true;}if(state==='ride'){$('#rdCancel').click();return true;}if(state==='job'){$('#jbClose').click();return true;}
  if(state==='repair'||state==='fuel'){resumeDrive();return true;}if(state==='outcome'){$('#outPrimary').click();return true;}
  if(!$('#showroom').hidden){go(changingVehicle?'title':'where');changingVehicle=false;return true;}
  if(!$('#where').hidden||!$('#loading').hidden||false){go('title');return true;}
  return false;
};

/* ---------- settings ---------- */
const SETS=[
  ['sound','Sound',[[true,'On'],[false,'Off']]],
  ['haptics','Vibration',[['off','Off'],['low','Low'],['med','Medium'],['high','Strong']]],
  ['steer','Steering',[['buttons','Buttons'],['tilt','Tilt phone']]],
  ['cam','Camera',[['chase','Chase'],['cockpit','Cockpit'],['far','Top']]],
  ['tod','Time of day',[['auto','Live (sun)'],['dawn','Dawn'],['noon','Noon'],['evening','Evening'],['night','Night']]],
  ['gfx','Graphics',[['fast','Fast'],['balanced','Balanced'],['ultra','Ultra']]],
];
let prevState=null;
function buildSettings(){
  const box=$('#setOpts');box.innerHTML='';
  for(const[key,label,opts]of SETS){const row=document.createElement('div');row.className='opt';const sp=document.createElement('span');sp.textContent=label;const seg=document.createElement('div');seg.className='seg';
    for(const[val,txt]of opts){const b=document.createElement('button');b.textContent=txt;if(settings[key]===val)b.className='on';
      b.addEventListener('click',()=>{settings[key]=val;saveSettings();
        if(key==='sound')Snd.setOn(val);if(key==='haptics'&&val!=='off')Hap.play([0,60],[0,180],true);
        if(key==='tod'){computeTod();clockT=0;}if(key==='cam')CAM.mode=val;if(key==='gfx'){clearChunks();for(const k in THUMBS)delete THUMBS[k];}
        if(key==='steer'){if(val==='tilt')requestTilt();calibrateTilt();}
        applyHudStyle();
        buildSettings();});seg.appendChild(b);}
    row.append(sp,seg);box.appendChild(row);}
}
function openSettings(){buildSettings();$('#settings').hidden=false;}
function closeSettings(){$('#settings').hidden=true;}
$('#setBtn1').addEventListener('click',openSettings);$('#setBtn2').addEventListener('click',openSettings);$('#setClose').addEventListener('click',closeSettings);

/* ---------- controls ---------- */
function hold(e,on,off){
  const pts=new Set();
  e.addEventListener('pointerdown',ev=>{ev.preventDefault();try{e.setPointerCapture(ev.pointerId);}catch(_){}pts.add(ev.pointerId);e.classList.add('on');on();});
  const up=ev=>{if(!pts.has(ev.pointerId))return;pts.delete(ev.pointerId);if(!pts.size){e.classList.remove('on');off();}};
  e.addEventListener('pointerup',up);e.addEventListener('pointercancel',up);e.addEventListener('lostpointercapture',up);e.addEventListener('contextmenu',ev=>ev.preventDefault());
}
const scareAnimals=()=>{for(const a of animals){if(a.event||a.lie)continue;const d=Math.hypot(a.x-P.x,a.y-P.y);if(d<24&&d>.1&&a.kind!=='cow'){a.state='flee';a.tx=a.x+(a.x-P.x)/d*7;a.ty=a.y+(a.y-P.y)/d*7;a.speed=5;a.t=1.5;}else if(a.kind==='cow'&&d<20&&!a.lie&&a.state!=='cross'){a.state='flee';a.tx=a.x+(a.x-P.x)/d*4;a.ty=a.y+(a.y-P.y)/d*4;a.speed=1;a.t=3;}}};
hold($('#btnGas'),()=>{input.gas=1;P.rev=false;},()=>input.gas=0);hold($('#btnBrake'),brakeDown,()=>{input.brake=0;P.brakeUp=performance.now();});
function brakeDown(){input.brake=1;if(Math.abs(P.s)<.5&&performance.now()-(P.brakeUp||0)<400){P.rev=true;toast('Reverse','', 'rev',800);}else if(P.s>.5)P.rev=false;}
hold($('#btnHorn'),()=>{input.horn=1;if(FOOT.on)return;Snd.hornOn(VEH[P.type].horn);scareAnimals();},()=>{input.horn=0;Snd.hornOff();});
function releaseAll(){input.L=input.R=input.gas=input.brake=input.horn=0;document.querySelectorAll('.on').forEach(e=>{if(e.closest('#hud'))e.classList.remove('on');});Snd.hornOff();}
const KEYS={ArrowLeft:'L',a:'L',ArrowRight:'R',d:'R',ArrowUp:'gas',w:'gas',ArrowDown:'brake',s:'brake',' ':'brake'};
window.addEventListener('keydown',e=>{if(e.repeat)return;const k=KEYS[e.key]||KEYS[(e.key||'').toLowerCase()];if(k&&state==='play'){if(k==='brake')brakeDown();else{input[k]=1;if(k==='gas')P.rev=false;}e.preventDefault();}
  if((e.key==='h'||e.key==='H')&&state==='play'&&FOOT.on){input.horn=1;}
  else if((e.key==='h'||e.key==='H')&&state==='play'){Snd.hornOn(VEH[P.type].horn);scareAnimals();}
  if((e.key==='c'||e.key==='C')&&state==='play')$('#camBtn').click();
  if(e.key==='Escape'||e.key==='p'){if(state==='play')pause();else if(state==='pause')resume();}});
window.addEventListener('keyup',e=>{const k=KEYS[e.key]||KEYS[(e.key||'').toLowerCase()];if(k){input[k]=0;if(k==='brake')P.brakeUp=performance.now();}if(e.key==='h'||e.key==='H'){input.horn=0;Snd.hornOff();}});
let tiltZero=0,tiltRaw=0;
function orientAngle(){return (screen.orientation&&screen.orientation.angle)||window.orientation||0;}
window.addEventListener('deviceorientation',e=>{const a=orientAngle();let v=Math.abs(a)===90?(a===90?e.beta:-e.beta):e.gamma;if(v==null)return;tiltRaw=v;input.tilt=clamp((v-tiltZero)/22,-1,1);});
function calibrateTilt(){tiltZero=tiltRaw||0;}
function requestTilt(){try{if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission)DeviceOrientationEvent.requestPermission().catch(()=>{});}catch(e){}}
$('#portraitBtn').addEventListener('click',()=>{$('#rotate').classList.add('dismissed');});
try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(()=>{});}catch(e){}
if(IS_NATIVE)$('#rotate').classList.add('dismissed');
let wake=null;async function keepAwake(){try{if(navigator.wakeLock&&!wake){wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>wake=null);}}catch(e){}}
document.addEventListener('pointerdown',keepAwake,{once:true});

/* ---------- boot ---------- */
let bootOk=false;
try{bootOk=initGL();}catch(e){console.error(e);bootOk=false;gl=null;}
if(bootOk){
  const g=new MB();g.d.push(...[[-2500,0,-2500],[2500,0,-2500],[2500,0,2500],[-2500,0,-2500],[2500,0,2500],[-2500,0,2500]].flatMap(p=>[p[0],p[1],p[2],0,1,0,...COL.ground,p[0]/12.5,p[2]/12.5,0]));GROUND=g.mesh();
  const l=new MB();l.box(0,0,0,.24,.24,.04,[1,1,1]);LAMP=l.mesh();
  computeTod();
  requestAnimationFrame(frame);
}
window.__oosht={P,W,input,CAM,sigState,get GT(){return GT;},get state(){return state;},startDrive,go,update,COP,APSH,agents:()=>agents,peds:()=>peds,animals:()=>animals,tod:()=>TOD,offence,openRepair,towToGarage,launchIntruder,TILES,decodeMVT,tilesToWorld,parseTile,setOrigin};
