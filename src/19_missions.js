/* ================= WISE CITY: missions =================
   six story missions built from the open-world systems; every location is placed on the real streets around you */
if(!profile.missions)profile.missions={};if(!profile.flags)profile.flags={};
const MIS={cur:null,st:0,t:0,d:{},obj:'',sub:'',timer:null,timerLbl:'',cars:[],beams:[],ctx:null};
const LOOKS={guard:{kind:'walk',shirt:'#3A4A5C',pants:'#1E2228',cap:'#1E2228',mous:true},metro:{kind:'walk',shirt:'#1E5AA8',pants:'#22283A',cap:'#1E5AA8'},
  conductor:{kind:'walk',shirt:'#B9A06A',pants:'#5A4A2A',mous:true},goon:{kind:'walk',shirt:'#7A1F1F',pants:'#1E1E22',beard:true,mous:true},
  collector:{kind:'walk',shirt:'#2B2B2B',pants:'#1F1F1F',mous:true,beard:true},leader:{kind:'walk',shirt:'#F5F5F0',pants:'#F5F5F0',dhoti:true,mous:true,beard:true},
  thief:{kind:'walk',shirt:'#5D4037',pants:'#263238',cap:'#263238'}};
const _pedLook=pedLook;pedLook=function(p){return p.look||_pedLook(p);};

/* ---------- helpers ---------- */
function spotAt(minD,maxD,minRank){
  for(let pass=0;pass<3;pass++){const lo=minD*(1-pass*.35),hi=maxD*(1+pass*.5);
    for(let k=0;k<260;k++){const s=W.segs[Math.floor(Math.random()*W.segs.length)];if(!s||s.w.br||s.len<18||(RANK[s.w.cls]??0)<(pass?0:minRank||0))continue;
      const side=Math.random()<.5?1:-1;const[x,y]=segPt(s,s.len/2,(s.w.hw+1.6)*side);const d=Math.hypot(x-P.x,y-P.y);if(d<lo||d>hi||inBuilding(x,y))continue;
      return {x,y,h:s.h,s,side};}}
  const[x,y]=[P.x+60,P.y];return {x,y,h:0,s:null,side:1};}
function near(o,r){return Math.hypot(o.x-P.x,o.y-P.y)<r;}
function misPed(look,x,y,o){const q=pushOutOf(x,y);const p=Object.assign({x:q[0],y:q[1],h:Math.random()*TAU,state:'mis',mis:true,look,v:Math.floor(Math.random()*5),pose:0,pt:0,t:0,sc:1,role:'x',hp:100,speed:1.2},o||{});peds.push(p);return p;}
function setObj(text,sub,at,label){MIS.obj=text;MIS.sub=sub||'';if(at){setPin(at.x,at.y);WP.name=label||WP.name;}Snd.tick&&Snd.tick();}
function misTimer(sec,lbl){MIS.timer=sec;MIS.timerLbl=lbl||'';}
function addBeam(x,y,col){const b={x,y,col:col||[1,.85,.2]};MIS.beams.push(b);return b;}
function forceChase(level,code){COP.off.includes(code)||COP.off.push(code);COP.level=Math.max(COP.level,level);const want=COP.level>=4?2:1;while(COP.list.length<want){const c=spawnCop();if(!c)break;COP.list.push(c);}}
const pedDown=p=>!p||p.dead||p.state==='down';

/* mission people that the normal crowd code leaves alone */
function misPedUpdate(p,dt){
  if(p.state==='down'||p.state==='static'||p.state==='hostile')return;
  if(p.state==='flee'){const dx=p.x-P.x,dy=p.y-P.y,d=Math.hypot(dx,dy)||1;let a=Math.atan2(dy,dx);const sp=p.fleeSp||4.2;
    for(const r of[0,.6,-.6,1.2,-1.2,2,-2]){const b=a+r*(p.side||1),nx=p.x+Math.cos(b)*sp*dt,ny=p.y+Math.sin(b)*sp*dt;if(!inBuilding(nx,ny)){p.x=nx;p.y=ny;p.h=hAng(Math.cos(b),Math.sin(b));break;}}
    p.pt+=dt;if(p.pt>.18){p.pt=0;p.pose^=1;}p.rp=p.pose?'run1':'run0';
    if(p.calm&&p.t>p.calm){p.state='mis';p.t=0;}return;}
  /* walking a route of points, or patrolling a circle */
  let tx=null,ty=null;
  if(p.guard){const g=p.guard;g.a+=dt*(g.dir||1)*.22;tx=g.cx+Math.cos(g.a)*g.r;ty=g.cy+Math.sin(g.a)*g.r;}
  else if(p.route&&p.route.length){const q=p.route[p.ri||0];tx=q.x;ty=q.y;if(Math.hypot(tx-p.x,ty-p.y)<.6){p.wait=(p.wait||0)+dt;if(p.wait>(p.dwell||3)){p.wait=0;p.ri=((p.ri||0)+1)%p.route.length;}p.rp='pose';return;}}
  if(tx==null){p.rp=p.idle||'pose';return;}
  const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);if(d>.05){const sp=Math.min(d,p.speed*dt);const nx=p.x+dx/d*sp,ny=p.y+dy/d*sp;if(!inBuilding(nx,ny)){p.x=nx;p.y=ny;}p.h=hAng(dx,dy);}
  p.pt+=dt;if(p.pt>.32){p.pt=0;p.pose^=1;}p.rp=p.pose?'walk1':'walk0';
}
{const _up=updatePeds;updatePeds=function(dt){const mine=peds.filter(p=>p.mis);for(const p of mine){peds.splice(peds.indexOf(p),1);p.t+=dt;misPedUpdate(p,dt);}_up(dt);for(const p of mine)peds.push(p);};}

/* guards see you inside a cone with nothing in between; a disguise lets you get much closer */
function guardSees(g){if(pedDown(g))return false;const dx=P.x-g.x,dy=P.y-g.y,d=Math.hypot(dx,dy);const disg=PLOOK.shirt===LOOKS.metro.shirt;
  const R=disg&&P.s<3.5?7:18;if(d>R)return false;if(d>3.5&&Math.abs(angDiff(g.h,hAng(dx,dy)))>.9)return false;return lineClear(g.x,g.y,P.x,P.y)!==false;}
function guardsAlarm(gs){for(const g of gs){if(pedDown(g))continue;const c=newCopPed(g.x,g.y);c.h=g.h;LIFE.copPeds.push(c);const i=peds.indexOf(g);if(i>=0)peds.splice(i,1);g.gone=true;}Snd.whistle();forceChase(1,'trespass');}
FINES.trespass=['Trespassing',2000];HEAT.trespass=1.5;

/* ---------- the six missions ---------- */
const MISSIONS=[
{id:'payroll',name:'The Silk Board Payroll',giver:'Shetty, moneylender (Balepet)',kind:'Heist',pay:250000,
 brief:'A construction firm\'s payroll van carries ₹40 lakh and a ledger of bribes. Stop the van, take the bag, and decide who gets the ledger.',
 start(d){d.office=spotAt(240,520,2);d.shetty=spotAt(500,950,1);setObj('Scout the payroll office','Get within 25 m of the office',d.office,'Payroll office');d.beam=addBeam(d.office.x,d.office.y);},
 update(d,dt){
  if(MIS.st===0&&near(d.office,25)){MIS.st=1;MIS.beams=[];
    const a=spawnAgent(true);if(!a){MIS.st=0;return;}a.t=TT.find(q=>q.k==='truck')||a.t;a.col='#2E86C1';a.model=trafficModel(a.t,a.col);a.mis='van';a.hp=260;placeAgent(a);agents.push(a);d.van=a;
    setObj('Stop the payroll van','Ram it, shoot it or take it before it reaches the site');misTimer(240,'Van reaches the site');toast('The payroll van is moving. Follow the yellow marker.','gold');}
  if(MIS.st===1){const a=d.van;
    if(a&&!a.wreck&&!agents.includes(a)&&!(P.skin&&P.skin.model===a.model)){if(Math.hypot(a.x-P.x,a.y-P.y)<180){agents.push(a);placeAgent(a);}else{misFail('The van got away');return;}}
    const jacked=P.skin&&a&&P.skin.model===a.model;const stopped=a&&(a.wreck||jacked||(a.hp!=null&&a.hp<140));
    if(a&&a.hp!=null&&a.hp<140&&!a.wreck&&!jacked){a.stop=999;a.v=0;}
    if(stopped){MIS.st=2;MIS.timer=null;d.stopT=0;d.bag={x:a.x+Math.cos(a.h)*2.2,y:a.y+Math.sin(a.h)*2.2};const b=pushOutOf(d.bag.x,d.bag.y);d.bag.x=b[0];d.bag.y=b[1];
      for(const s of[-1,1])misPed(LOOKS.guard,a.x+s*3,a.y+2,{state:'hostile',armed:true,role:'goon'});
      if(jacked){d.got=true;}else addBeam(d.bag.x,d.bag.y,[.4,1,.4]);
      setObj(jacked?'Get away with the van':'Grab the cash bag','The guards are armed');toast('The van is stopped!','gold');}}
  if(MIS.st===2){d.stopT+=dt;if(d.stopT>40&&!d.escort){d.escort=true;forceChase(2,'robbery');toast('A paid Hoysala escort was tailing the van!','bad');}
    if(d.got||(d.bag&&FOOT.on&&near(d.bag,1.8))){d.got=true;MIS.beams=[];MIS.st=3;
      misChoice('The ledger','The bag holds the cash and a ledger of bribes. Who gets the ledger?',[
        {label:'Shetty in Balepet · ₹2,50,000',fn:()=>{d.to='shetty';setObj('Take the bag to Shetty','',d.shetty,'Shetty\'s office');}},
        {label:'The District Magistrate Court · ₹1,00,000 and challans cleared',fn:()=>{d.to='court';const c=W.court||d.shetty;setObj('Take the ledger to the court','',c,'District Magistrate Court');}}]);}}
  if(MIS.st===3&&d.to){const tgt=d.to==='court'?(W.court||d.shetty):d.shetty;if(near(tgt,16)){
    if(d.to==='court'){profile.pending=[];profile.seized=false;misPass(100000,'Challans cleared. Shetty will not forget this.');profile.flags.shettyHostile=true;}
    else misPass(250000,'Shetty will remember the favour.');profile.flags.shetty=true;}}
 }},
{id:'depot',name:'Namma Metro Ghost Ride',giver:'Leela, journalist',kind:'Stealth',pay:60000,
 brief:'Photograph three spots in the metro depot yard without being seen. Steal a metro worker\'s uniform to walk right past the guards.',
 start(d){let c=null;const st=(METRO.stations||[]).slice().sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
   if(st&&Math.hypot(st.x-P.x,st.y-P.y)<900){const e=st.e[0];c={x:e[0],y:e[1]};}else c=spotAt(250,550,1);d.c=c;
   setObj('Get to the metro depot yard','Use the metro or the road',c,'Metro depot yard');},
 update(d,dt){
  if(MIS.st===0&&near(d.c,140)&&!d.spawned){d.spawned=true;d.guards=[];
    for(let i=0;i<3;i++)d.guards.push(misPed(LOOKS.guard,d.c.x,d.c.y,{guard:{cx:d.c.x,cy:d.c.y,a:i*2.1,r:9+i*3,dir:i%2?1:-1},speed:1.1}));
    d.shots=[[11,0],[-8,9],[2,-12]].map(([ox,oy])=>{const q=pushOutOf(d.c.x+ox,d.c.y+oy);return {x:q[0],y:q[1],done:false};});
    const w=spotAt(25,45,0);d.worker=misPed(LOOKS.metro,w.x,w.y,{idle:'pose',calm:5});}
  if(MIS.st===0&&near(d.c,40)){MIS.st=1;d.t0=0;MIS.beams=d.shots.map(s=>addBeam(s.x,s.y));
    setObj('Photograph 3 spots (yellow beams)','Stay out of the guards\' sight. A metro worker nearby has a uniform you could borrow.');misTimer(null);}
  if(MIS.st>=1&&MIS.st<3){d.t0+=dt;
    if(!d.spotted){let s=false;for(const g of d.guards)if(!g.gone&&guardSees(g))s=true;d.seen=clamp((d.seen||0)+(s?dt*1.4:-dt*.6),0,1);MIS.sub=d.seen>0?`Being noticed ${'▮'.repeat(Math.ceil(d.seen*5))}`:MIS.sub.startsWith('Being')?'':MIS.sub;
      if(d.seen>=1){d.spotted=true;guardsAlarm(d.guards);toast('Spotted! Security is calling the police.','bad');}}
    if(d.t0>90&&!d.lorry){d.lorry=true;toast('The contractor\'s lorry is here. More guards on a sweep.','');for(let i=0;i<2;i++)d.guards.push(misPed(LOOKS.guard,d.c.x,d.c.y,{guard:{cx:d.c.x,cy:d.c.y,a:i*3,r:6,dir:i?1:-1},speed:1.5}));}}
  if(MIS.st===1&&d.shots.every(s=>s.done)){MIS.st=2;MIS.beams=[];setObj('Get out of the depot','Get 80 m away');}
  if(MIS.st===2&&!near(d.c,80)){MIS.st=3;misPass(d.spotted?30000:60000,d.spotted?'You were seen, so the story is about the break-in. Half pay.':'Clean run. You now carry a press pass.');if(!d.spotted)profile.flags.press=true;}
 },
 ctx(d){if(MIS.st!==1)return null;for(const s of d.shots)if(!s.done&&near(s,2.6))return {k:'mis',label:'Take photo',fn:()=>{s.done=true;MIS.beams=MIS.beams.filter(b=>!(b.x===s.x&&b.y===s.y));$('#flash').style.opacity=.8;setTimeout(()=>$('#flash').style.opacity=0,90);Snd.tone([1800,900],.05,'square',.05);toast(`Photo ${d.shots.filter(q=>q.done).length} of 3`,'good');}};return null;}},
{id:'getaway',name:'Outer Ring Road Getaway',giver:'Arjun, mechanic (Koramangala)',kind:'Chase',pay:150000,
 brief:'Take back the Veloce supercar an executive never paid for, shake off his security SUVs, and deliver it to Arjun\'s garage in one piece.',
 start(d){d.apt=spotAt(220,480,1);d.gar=spotAt(900,1500,2);setObj('Go to the executive\'s apartment','',d.apt,'Apartment basement');},
 update(d,dt){
  if(MIS.st===0&&near(d.apt,40)){MIS.st=1;CITY.taken.delete('misveloce');const h=d.apt.h+Math.PI/2;addParked('veloce',d.apt.x,d.apt.y,d.apt.s?d.apt.s.h:0,'misveloce',Math.random);
    d.car=(W.parkedV||[]).find(v=>v.key==='misveloce');MIS.beams=[addBeam(d.apt.x,d.apt.y)];setObj('Steal the Veloce','Walk up and take it');}
  if(MIS.st===1&&CITY.taken.has('misveloce')&&!FOOT.on){MIS.st=2;MIS.beams=[];Snd.tone([900,700,900,700],.9,'square',.06);toast('Car alarm! His security SUVs are coming.','bad');
    d.dist0=Math.hypot(d.gar.x-P.x,d.gar.y-P.y);const fx=Math.sin(P.h),fy=-Math.cos(P.h);
    for(const k of[0,1]){const t=TT.find(q=>q.k==='suv');const sp=nearestSeg(P.x-fx*(45+k*15),P.y-fy*(45+k*15),40);const s=sp.seg;const x=s?(s.ax+s.bx)/2:P.x-fx*45,y=s?(s.ay+s.by)/2:P.y-fy*45;
      MIS.cars.push({x,y,h:P.h,v:8,model:trafficModel(t,'#15171C'),len:t.len,wid:t.wid,hitT:0});}
    d.ownModel=P.skin&&P.skin.model;setObj('Deliver the Veloce to Arjun\'s garage','Lose or wreck the SUVs. Keep the car above 15% condition.',d.gar,'Arjun\'s garage');}
  if(MIS.st===2){
    if(FOOT.on&&!(FOOT.parked&&FOOT.parked.skin&&FOOT.parked.skin.model===d.ownModel)){misFail('You lost the Veloce');return;}
    if(!FOOT.on&&P.cond<15){misFail('The Veloce is wrecked');return;}
    if(!d.stolen&&Math.hypot(d.gar.x-P.x,d.gar.y-P.y)<d.dist0*.55){d.stolen=true;toast('He reported it stolen. Police who see you will chase.','bad');}
    if(!FOOT.on&&P.skin&&P.skin.model===d.ownModel&&near(d.gar,14)){MIS.st=3;MIS.cars=[];misPass(150000,'Keep the Veloce. Every mechanic now gives you 30% off repairs (Arjun\'s network).');profile.flags.arjun=true;}}
 }},
{id:'mela',name:'Avenue Road Mela Mayhem',giver:'The vendors\' association',kind:'Sandbox',pay:75000,
 brief:'Four collectors from a protection racket are squeezing the fair\'s vendors. Stop all four. Hurt the vendors and the deal is off.',
 start(d){d.f=spotAt(220,480,1);d.hurtV=0;setObj('Go to the street fair','',d.f,'Street fair');},
 update(d,dt){
  if(MIS.st===0&&near(d.f,110)&&!d.spawned){d.spawned=true;const s=d.f.s;d.stalls=[];
    for(let i=0;i<6;i++){const t=s?clamp(s.len/2+(i-2.5)*4.5,2,s.len-2):0;const side=i%2?d.f.side:-d.f.side;const[x,y]=s?segPt(s,t,(s.w.hw+1)*side):[d.f.x+i*3,d.f.y];
      const o={x,y,h:s?s.h+(side>0?Math.PI/2:-Math.PI/2):0,state:'static',kind:'vendor',t:0,v:i%3,sc:1,cart:i%3,cx:x,cy:y,vv:i%2,mis:true,misVendor:true};const[vx,vy]=s?segPt(s,t+1.4,(s.w.hw+1.6)*side):[x+1,y];o.x=vx;o.y=vy;peds.push(o);d.stalls.push(o);}
    d.col=[];for(let i=0;i<4;i++){const r=d.stalls.slice(i).concat(d.stalls.slice(0,i)).map(v=>({x:v.x+.8,y:v.y+.8}));d.col.push(misPed(LOOKS.collector,r[0].x,r[0].y,{route:r,dwell:4,speed:1.1,marked:true,calm:12}));}}
  if(MIS.st===0&&near(d.f,45)){MIS.st=1;setObj('Stop the 4 collectors (red markers)','Knock them out, or tackle them. Do not hurt the vendors.');}
  if(MIS.st===1){const n=d.col.filter(pedDown).length;MIS.sub=`${n} of 4 collectors stopped · vendors hurt ${d.hurtV}/3`;
    if(n>=2&&!d.goons){d.goons=true;toast('The racket\'s boss sent armed men!','bad');for(let i=0;i<3;i++)misPed(LOOKS.goon,d.f.x+(i-1)*4,d.f.y+3,{state:'hostile',armed:true,role:'goon'});}
    if(d.hurtV>=3){misFail('Too many vendors got hurt');return;}
    if(n>=4){MIS.st=2;misPass(75000,'The racket is finished here. Fewer goons on the streets from now on. Search the collectors for their takings.');profile.flags.racket=true;}}
 }},
{id:'flight',name:'Devanahalli Night Flight',giver:'Shetty (or Leela)',kind:'Heist finale',pay:1000000,need:'Play at Kempegowda Airport (pick it on the area list).',
 brief:'Steal the cargo plane carrying seized gold, beat the runway block, and land on the Jakkur strip before the air force radar locks on.',
 ok(){return AIR.runways.length&&AIR.planes.length;},
 start(d){d.pl=AIR.planes.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];d.strip=AIR.runways[AIR.runways.length>1?1:0];d.main=AIR.runways[0];
   for(const s of[-1,1])misPed(LOOKS.guard,d.pl.x+s*14,d.pl.y+10,{guard:{cx:d.pl.x,cy:d.pl.y,a:s>0?0:3,r:16,dir:s},speed:1.1});d.guards=peds.filter(p=>p.mis&&p.guard);
   setObj('Get to the cargo plane','Apron guards are watching',d.pl,'Cargo plane');},
 update(d,dt){
  if(MIS.st===0){if(!d.alarm){for(const g of d.guards)if(guardSees(g)){d.alarm=true;guardsAlarm(d.guards);toast('Apron security spotted you!','bad');break;}}
    if(FLY.on&&FLY.pl===d.pl){MIS.st=1;forceChase(2,'plane');misTimer(50,'Runway blocked');setObj('Take off before the runway is blocked','Full throttle, lift off above 230 km/h');}}
  if(MIS.st===1){if(!FLY.on){misFail('You left the plane');return;}if(!FLY.ground&&FLY.z>15){MIS.st=2;misTimer(240,'Air force lock-on');d.air=0;
      const r=d.strip;const sx=(r.ax+r.bx)/2,sy=(r.ay+r.by)/2;setObj('Land on the Jakkur strip','Fly under 60 m to stall the radar. Land, then stop.',{x:sx,y:sy},'Jakkur strip');}}
  if(MIS.st===2){d.air+=dt;if(FLY.on&&FLY.z<60&&!FLY.ground)MIS.timer+=dt*.85;
    if(!FLY.on){misFail(LIFE.dead?'The plane crashed':'You left the plane');return;}
    if(FLY.ground&&FLY.v<3&&d.air>25){const onR=r=>segDistXY(FLY.x,FLY.y,r.ax,r.ay,r.bx,r.by)<30;
      if(onR(d.strip)){MIS.st=3;misPass(1000000,'The gold is unloaded. Planes can now be rented legally at the airport.');profile.flags.pilot=true;}
      else if(onR(d.main)){MIS.st=3;forceChase(5,'plane');misPass(1500000,'Landed on the main runway. Five stars!');profile.flags.pilot=true;}}}
 }},
{id:'majestic',name:'The Pickpocket King of Majestic',giver:'Majestic police inspector',kind:'Bounty',pay:50000,
 brief:'A gang stole a BMTC conductor\'s phone with his daughter\'s college fees on it. Catch three pickpockets, take down their leader, and return the phone.',
 start(d){let b=(W.busStops||[]).slice().sort((a,c)=>Math.abs(Math.hypot(a.x-P.x,a.y-P.y)-300)-Math.abs(Math.hypot(c.x-P.x,c.y-P.y)-300))[0];d.bus=b&&Math.hypot(b.x-P.x,b.y-P.y)<700?{x:b.x,y:b.y}:spotAt(200,420,2);
   d.caught=0;setObj('Go to the bus station','',d.bus,'Bus station');},
 update(d,dt){
  const spawnThief=()=>{const a=Math.random()*TAU;const p=misPed(LOOKS.thief,d.bus.x+Math.cos(a)*10,d.bus.y+Math.sin(a)*10,{culprit:true,state:'flee',fleeSp:4.4,loot:0});d.th=p;say('thief','man',true);toast('Pickpocket! Catch him (red marker).','gold');};
  if(MIS.st===0&&near(d.bus,40)){MIS.st=1;d.cond=misPed(LOOKS.conductor,d.bus.x+2,d.bus.y,{idle:'pose',calm:4});spawnThief();setObj('Catch the pickpockets','Run into them or knock them down');}
  if(MIS.st===1){const p=d.th;MIS.sub=`${d.caught} of 3 caught`;
    if(p&&p.caught){d.caught++;d.th=null;if(d.caught<3)setTimeout(()=>{if(MIS.cur&&MIS.cur.id==='majestic'&&MIS.st===1)spawnThief();},2500);}
    else if(p&&Math.hypot(p.x-P.x,p.y-P.y)>160){toast('He got away. Another one is working the crowd.','');const i=peds.indexOf(p);if(i>=0)peds.splice(i,1);d.th=null;setTimeout(()=>{if(MIS.cur&&MIS.st===1)spawnThief();},2000);}
    if(d.caught>=3){MIS.st=2;d.hide=spotAt(140,300,0);d.leader=misPed(LOOKS.leader,d.hide.x,d.hide.y,{state:'hostile',armed:true,role:'goon',hp:160});
      for(let i=0;i<2;i++)misPed(LOOKS.goon,d.hide.x+3,d.hide.y+(i?3:-3),{state:'hostile',armed:true,role:'goon'});setObj('Take down the gang leader at the lodge','He is armed',d.hide,'Lodge hideout');}}
  if(MIS.st===2&&pedDown(d.leader)){MIS.st=3;setObj('Return the phone to the conductor','',d.cond,'Conductor');}
  if(MIS.st===3&&FOOT.on&&near(d.cond,3)){MIS.st=4;for(const c of profile.pending)c.f=Math.round(c.f*.8);misPass(50000,'The inspector knocked 20% off your pending challans.');profile.flags.inspector=true;}
 }},
];

/* ---------- running a mission ---------- */
function misStart(m){if(MIS.cur)misEnd();if(m.ok&&!m.ok()){toast('Get to the airport first','bad');return;}
  MIS.cur=m;MIS.st=0;MIS.t=0;MIS.d={};MIS.timer=null;MIS.cars=[];MIS.beams=[];clearPin();
  state='play';show('play');if(FOOT.on&&!FOOT.ride)footHud(true);
  m.start(MIS.d);toast(`Mission: ${m.name}`,'gold');Snd.chime();}
function misEnd(){for(const p of peds)if(p.mis){p.mis=false;if(p.state==='mis'){p.state='flee';p.fx=P.x;p.fy=P.y;p.t=0;}}MIS.cur=null;MIS.cars=[];MIS.beams=[];MIS.timer=null;clearPin();$('#misHud').hidden=true;}
function misPass(cash,note){const m=MIS.cur;const first=!profile.missions[m.id];const pay=first?cash:Math.round(cash/2);profile.missions[m.id]=(profile.missions[m.id]||0)+1;profile.wallet+=pay;session.fare+=pay;saveProfile();misEnd();Snd.chime();Hap.success();
  misModal('Mission passed',`${m.name}\n+₹${fmtINR(pay)}${first?'':' (replay pays half)'}\n${note||''}`,[{label:'Continue',fn:()=>{}}]);}
function misFail(why){const m=MIS.cur;if(!m)return;misEnd();Snd.tone([300,200],.5,'sawtooth',.06);misModal('Mission failed',`${m.name}\n${why}`,[{label:'Retry',fn:()=>misStart(m)},{label:'Continue',fn:()=>{}}]);}
function misModal(title,text,btns){state='misres';releaseAll();$('#msTitle').textContent=title;const t=$('#msText');t.textContent='';for(const ln of text.split('\n')){const d=document.createElement('div');d.textContent=ln;t.appendChild(d);}
  const box=$('#msList');box.innerHTML='';for(const b of btns){const e=document.createElement('button');e.className='btn'+(b===btns[0]?' primary':'');e.textContent=b.label;e.addEventListener('click',()=>{state='play';show('play');if(FOOT.on&&!FOOT.ride)footHud(true);b.fn();});box.appendChild(e);}
  $('#msClose').hidden=true;show('misScr');}
function misChoice(title,text,opts){misModal(title,text,opts);}
function misUpdate(dt){
  const m=MIS.cur;if(!m||state!=='play')return;MIS.t+=dt;
  if(LIFE.dead){misFail('You were knocked out');return;}
  if(MIS.timer!=null){MIS.timer-=dt;if(MIS.timer<=0){misFail(MIS.timerLbl||'Out of time');return;}}
  m.update(MIS.d,dt);if(!MIS.cur)return;
  updateChasers(dt);
  const h=$('#misHud');h.hidden=false;$('#mhTitle').textContent=m.name;$('#mhObj').textContent=MIS.obj+(WP.on?` · ${fmD(WP.len)}`:'');
  const tm=MIS.timer!=null?` · ${Math.floor(MIS.timer/60)}:${String(Math.floor(MIS.timer%60)).padStart(2,'0')}`:'';$('#mhSub').textContent=(MIS.sub||'')+tm;$('#mhSub').hidden=!(MIS.sub||tm);
  $('#wpChip').hidden=true;
}
/* security SUVs that ram you (mission 3) */
function updateChasers(dt){
  for(let i=MIS.cars.length-1;i>=0;i--){const c=MIS.cars[i];const tx=P.x+P.vx*.6,ty=P.y+P.vy*.6;const dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy);
    if(c.wreck){c.t=(c.t||0)+dt;if(c.t>20)MIS.cars.splice(i,1);continue;}
    if(d>260){MIS.cars.splice(i,1);toast('One SUV lost you','good');continue;}
    const want=hAng(dx,dy);const da=angDiff(c.h,want);c.h+=clamp(da,-2.2*dt,2.2*dt);const vt=Math.min(31,Math.abs(P.s)+(d>25?9:3))*(Math.abs(da)>.8?.55:1);c.v+=clamp(vt-c.v,-12*dt,9*dt);
    const nx=c.x+Math.sin(c.h)*c.v*dt,ny=c.y-Math.cos(c.h)*c.v*dt;if(inBuilding(nx,ny)){c.v*=.3;c.h+=1.2*dt*(da>0?1:-1);c.hp=(c.hp??100)-c.v*.5;}else{c.x=nx;c.y=ny;}
    c.hitT-=dt;if(d<(c.len+P.len)*.5&&c.hitT<=0){c.hitT=.8;if(!FOOT.on){P.cond=Math.max(0,P.cond-6);P.s*=.75;}else lfDamage(12,'hit');const l=d||1;P.x+=dx/l*-.0+(P.x-c.x)/l*.5;P.y+=(P.y-c.y)/l*.5;CAM.shake=Math.max(CAM.shake,5);Hap.rumble();Snd.thud(.6);c.hp=(c.hp??100)-14;}
    for(const p of METRO.piers||[])if(Math.hypot(p.x-c.x,p.y-c.y)<1.8){c.hp=(c.hp??100)-c.v*2;c.v=0;}
    if((c.hp??100)<=0){c.wreck=true;c.t=0;LIFE.fx.push({k:'boom',p:[c.x,1.2,c.y],t:.6});Snd.crash();toast('SUV wrecked!','good');}}
}
function misDraw(night){
  for(const c of MIS.cars){M4.model(TM,c.x,0,c.y,-c.h,0,0);drawLit(c.model.body,TM,c.wreck?{tint:[.22,.2,.19],emiK:0}:{emiK:.5+night});if(c.model.glass&&!c.wreck)drawLit(c.model.glass,TM);if(!c.wreck)lightsFor(c.model,TM,night>.25,false,night);}
  for(const p of peds)if(p.mis&&p.marked&&!pedDown(p))DGr.bill(p.x,2.35+Math.sin(GT*5)*.08,p.y,.45,[1,.15,.1],CAM.right);
}
{const _ds=drawStations;drawStations=function(n){_ds(n);if(MIS.cur)misDraw(n);};
 const _fb=drawFootBeams;drawFootBeams=function(ex,ez){_fb(ex,ez);for(const b of MIS.beams){const d=Math.hypot(b.x-ex,b.y-ez);drawSprite(beamTex().tex,b.x,0,b.y,2.6+d*.01,40,b.col);}};
 const _fc=findContext;findContext=function(){if(MIS.cur&&MIS.cur.ctx&&FOOT.on&&!FOOT.ride){const c=MIS.cur.ctx(MIS.d);if(c)return c;}return _fc();};
 const _lu=lifeUpdate;lifeUpdate=function(dt){_lu(dt);misUpdate(dt);};
 const _ca=caught;caught=function(){const m=MIS.cur;_ca();if(m){misEnd();setTimeout(()=>toast(`Mission failed: ${m.name} · busted`,'bad'),400);}};
 const _hp=hurtPed;hurtPed=function(p,dmg,nx,ny,how){if(p.misVendor&&MIS.cur){MIS.d.hurtV=(MIS.d.hurtV||0)+1;}_hp(p,dmg,nx,ny,how);};}

/* ---------- mission board ---------- */
function openMissions(){if(state!=='play'&&state!=='pause')return;state='misres';releaseAll();$('#msTitle').textContent='Missions';$('#msText').textContent=MIS.cur?`Now playing: ${MIS.cur.name}`:'Every mission is set on the streets around you. Replays pay half.';
  const box=$('#msList');box.innerHTML='';
  if(MIS.cur){const b=document.createElement('button');b.className='btn';b.textContent='Abandon current mission';b.addEventListener('click',()=>{misEnd();openMissions();});box.appendChild(b);}
  for(const m of MISSIONS){const n=profile.missions[m.id]||0;const ok=!m.ok||m.ok();const b=document.createElement('button');b.className='vitem';
    b.innerHTML='<span class="n"></span><span class="e"></span><b></b>';b.querySelector('.n').textContent=`${m.name} · ${m.kind}`;
    b.querySelector('.e').textContent=`${m.giver}. ${m.brief}${ok?'':' '+m.need}`;b.querySelector('b').textContent=(n?'✓ ':'')+'₹'+fmtINR(n?Math.round(m.pay/2):m.pay);
    b.addEventListener('click',()=>misStart(m));box.appendChild(b);}
  $('#msClose').hidden=false;show('misScr');}
$('#msClose').addEventListener('click',()=>{state='play';show('play');if(FOOT.on&&!FOOT.ride)footHud(true);});
$('#misBtn').addEventListener('click',openMissions);$('#misBtn2').addEventListener('click',()=>{openMissions();});
Object.assign(window.__oosht||{},{MIS,MISSIONS,misStart,misEnd,openMissions,spotAt});
