/* ================= WISE CITY: landmarks, safehouses, stunt ramps and district colours on the real Bengaluru map ================= */

/* ---------- districts: each real neighbourhood gets a colour and a name banner ---------- */
const DISTRICTS=[
  {id:'mg',name:'MG Road',tag:'Neon Mile',col:'#FF4FA3',c:[[12.9745,77.6060,1700]]},
  {id:'core',name:'Vidhana Soudha',tag:'Heritage Core',col:'#FFC24B',c:[[12.9790,77.5880,1500],[12.9770,77.5720,1100]]},
  {id:'old',name:'Old Bengaluru',tag:'Basavanagudi · Malleshwaram',col:'#FF8A3D',c:[[12.9420,77.5700,1800],[13.0030,77.5700,1700],[12.9600,77.5650,1000]]},
  {id:'party',name:'Koramangala & Indiranagar',tag:'Party Quarter',col:'#2EE6E6',c:[[12.9352,77.6245,1900],[12.9719,77.6412,1800]]},
  {id:'south',name:'South Bengaluru',tag:'Jayanagar · JP Nagar · Banashankari',col:'#6BD66B',c:[[12.9250,77.5838,1900],[12.9063,77.5857,1900],[12.9255,77.5468,1900]]},
  {id:'tech',name:'Tech Belt',tag:'Whitefield · ORR · Electronic City',col:'#4A7DFF',c:[[12.9698,77.7400,3600],[12.8456,77.6603,3000],[13.0450,77.6200,2000],[12.9260,77.6762,2600]]},
  {id:'ind',name:'Peenya Industrial',tag:'Factories & lorries',col:'#D0643A',c:[[13.0285,77.5197,3000],[13.0237,77.5530,1400]]},
  {id:'air',name:'Airport Frontier',tag:'Devanahalli',col:'#B388FF',c:[[13.1986,77.7066,6000]]},
];
const DIST={cur:null,t:0,ban:null,tint:[0,0,0],k:0};
for(const d of DISTRICTS){d.rgb=hexRgb(d.col);d.w=d.c.map(([la,lo,r])=>{const p=ll2wSafe(la,lo);return p?{x:p[0],y:p[1],r}:null;});}
function hexRgb(h){const n=parseInt(h.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
function ll2wSafe(la,lo){try{return ll2w(la,lo);}catch(e){return null;}}
/* world coordinates depend on the map origin, so refresh them whenever the map is (re)loaded */
function cityPlusPlace(){
  for(const d of DISTRICTS)d.w=d.c.map(([la,lo,r])=>{const p=ll2wSafe(la,lo);return p?{x:p[0],y:p[1],r}:null;});
  for(const l of LANDMARKS){const p=ll2wSafe(l.lat,l.lon);if(p){l.x=p[0];l.y=p[1];}}
  for(const s of SAFES){const p=ll2wSafe(s.lat,s.lon);if(p){s.x=s.rx=p[0];s.y=s.ry=p[1];s.snapped=false;}}
  RAMPS.cache.clear();RAMPS.near=[];
}
function districtAt(x,y){let best=null,bk=1e9;for(const d of DISTRICTS)for(const c of d.w){if(!c)continue;const k=Math.hypot(c.x-x,c.y-y)/c.r;if(k<1&&k<bk){bk=k;best=d;}}return best;}
function distBanner(d){
  if(!DIST.ban){const b=document.createElement('div');b.id='distBan';
    b.style.cssText='position:fixed;left:0;right:0;top:26%;text-align:center;pointer-events:none;z-index:40;opacity:0;transition:opacity .8s;font-family:Roboto,Arial,sans-serif;text-shadow:0 2px 10px rgba(0,0,0,.75)';
    b.innerHTML='<div class="dn" style="font-weight:900;font-size:clamp(22px,4.6vw,38px);letter-spacing:.04em;font-style:italic"></div><div class="dt" style="font-weight:600;font-size:clamp(12px,2.6vw,16px);letter-spacing:.22em;text-transform:uppercase;color:#fff;opacity:.85;margin-top:2px"></div>';
    document.body.appendChild(b);DIST.ban=b;}
  const b=DIST.ban;b.querySelector('.dn').textContent=d?d.name:'Greater Bengaluru';b.querySelector('.dn').style.color=d?d.col:'#E8EEF5';
  b.querySelector('.dt').textContent=d?d.tag:'Open roads';b.style.opacity='1';clearTimeout(DIST.bt);DIST.bt=setTimeout(()=>{b.style.opacity='0';},3200);
}

/* ---------- landmarks: sky beams you can see from anywhere in the city ---------- */
const LANDMARKS=[
  {id:'vs',name:'Vidhana Soudha',lat:12.9794,lon:77.5910,col:'#FFC24B'},
  {id:'ub',name:'UB City',lat:12.9716,lon:77.5960,col:'#FF4FA3'},
  {id:'cs',name:'Chinnaswamy Stadium',lat:12.9788,lon:77.5996,col:'#2EE6E6'},
  {id:'bp',name:'Bangalore Palace',lat:12.9987,lon:77.5921,col:'#FFC24B'},
  {id:'lb',name:'Lalbagh Glass House',lat:12.9507,lon:77.5848,col:'#6BD66B'},
  {id:'kb',name:'Majestic Bus Station',lat:12.9774,lon:77.5713,col:'#FF8A3D'},
  {id:'is',name:'ISKCON Temple',lat:13.0098,lon:77.5511,col:'#FF8A3D'},
  {id:'wt',name:'World Trade Center',lat:13.0127,lon:77.5550,col:'#4A7DFF'},
  {id:'bt',name:'Bull Temple',lat:12.9428,lon:77.5681,col:'#FF8A3D'},
  {id:'fm',name:'Forum Mall',lat:12.9346,lon:77.6113,col:'#2EE6E6'},
  {id:'sh',name:'Shiva Temple, Old Airport Road',lat:12.9592,lon:77.6481,col:'#E8EEF5'},
  {id:'mt',name:'Manyata Tech Park',lat:13.0475,lon:77.6214,col:'#4A7DFF'},
  {id:'it',name:'ITPL Whitefield',lat:12.9857,lon:77.7360,col:'#4A7DFF'},
  {id:'ec',name:'Electronic City',lat:12.8452,lon:77.6602,col:'#4A7DFF'},
  {id:'ap',name:'Kempegowda Airport',lat:13.1986,lon:77.7066,col:'#B388FF'},
];
for(const l of LANDMARKS){l.rgb=hexRgb(l.col);const p=ll2wSafe(l.lat,l.lon);if(p){l.x=p[0];l.y=p[1];}}
if(!profile.lmk)profile.lmk=[];
function landmarkTick(){
  for(const l of LANDMARKS){if(l.x==null||profile.lmk.includes(l.id))continue;if(Math.hypot(l.x-P.x,l.y-P.y)<90){profile.lmk.push(l.id);profile.wallet+=500;saveProfile();
    toast(`Landmark found: ${l.name} · +₹500 (${profile.lmk.length}/${LANDMARKS.length})`,'gold');Snd.chime();Hap.success&&Hap.success();}}
}
function drawLandmarkBeams(ex,ez){
  const ey=CAM.eye[1],near=Math.max(90,(FU.fog?FU.fog[0]:150)*.85);
  for(const l of LANDMARKS){if(l.x==null)continue;const D=Math.hypot(l.x-ex,l.y-ez);if(D<40)continue;
    const found=profile.lmk.includes(l.id);const k=D>near?near/D:1;
    const x=ex+(l.x-ex)*k,z=ez+(l.y-ez)*k,y=ey+(0-ey)*k;
    const w=(D>near?Math.max(14,D*.012):6)*k,h=(D>near?420:160)*k;
    const c=l.rgb.map(v=>v*(found?.55:1));drawSprite(beamTex().tex,x,y,z,w,h,c);}
}

/* ---------- safehouses: rest, heal, lie low and save ---------- */
const SAFES=[
  {id:'jaya',name:'Jayanagar 4th Block flat',lat:12.9293,lon:77.5826,price:0},
  {id:'mall',name:'Malleshwaram old house',lat:13.0035,lon:77.5710,price:30000},
  {id:'white',name:'Whitefield apartment',lat:12.9698,lon:77.7500,price:35000},
  {id:'indi',name:'Indiranagar 12th Main loft',lat:12.9716,lon:77.6412,price:40000},
  {id:'kora',name:'Koramangala 5th Block flat',lat:12.9345,lon:77.6190,price:45000},
  {id:'mg',name:'MG Road penthouse',lat:12.9752,lon:77.6070,price:120000},
];
if(!profile.safe)profile.safe=['jaya'];
for(const s of SAFES){const p=ll2wSafe(s.lat,s.lon);if(p){s.x=s.rx=p[0];s.y=s.ry=p[1];}}
const owned=s=>profile.safe.includes(s.id);
function safeSnap(){for(const s of SAFES){if(s.snapped||s.rx==null||Math.hypot(s.rx-P.x,s.ry-P.y)>500)continue;
  const n=nearestSeg(s.rx,s.ry,220,q=>!q.w.br);if(!n.seg)continue;const q=n.seg;const dx=(q.bx-q.ax)/q.len,dy=(q.by-q.ay)/q.len;
  const t=clamp((s.rx-q.ax)*dx+(s.ry-q.ay)*dy,4,Math.max(4,q.len-4));let side=1;const px=dy,py=-dx;
  for(const sg of[1,-1]){const x=q.ax+dx*t-px*sg*(q.w.hw+2.2),y=q.ay+dy*t-py*sg*(q.w.hw+2.2);if(!inBuilding(x,y)){side=sg;break;}}
  s.x=q.ax+dx*t-px*side*(q.w.hw+2.2);s.y=q.ay+dy*t-py*side*(q.w.hw+2.2);s.snapped=true;}}
function safeCtx(){if(!FOOT.on||FOOT.ride||INT.on)return null;for(const s of SAFES){if(!s.snapped)continue;if(Math.hypot(s.x-P.x,s.y-P.y)<3.2)
  return {k:'item',it:{fn:()=>safeUse(s)},label:owned(s)?'Enter safehouse':`Buy safehouse ₹${s.price.toLocaleString('en-IN')}`};}return null;}
function safeUse(s){
  if(!owned(s)){misModal(s.name,`Buy this safehouse for ₹${s.price.toLocaleString('en-IN')}?\nRest here to heal, lie low from the police and save.\nWallet: ₹${Math.floor(profile.wallet).toLocaleString('en-IN')}`,
    [{label:'Buy',fn:()=>{if(profile.wallet<s.price){toast('Not enough money','bad');return;}profile.wallet-=s.price;profile.safe.push(s.id);saveProfile();toast(`${s.name} is yours`,'gold');Snd.chime();}},{label:'Not now',fn:()=>{}}]);return;}
  const copNear=COP.list.some(c=>Math.hypot(c.x-P.x,c.y-P.y)<30);
  misModal(s.name,copNear?'The police are right behind you. Lose them first.':'Home sweet home.\nRest to heal fully and lie low. The game is saved here.',
    copNear?[{label:'OK',fn:()=>{}}]:[{label:'Rest & save',fn:()=>{LIFE.hp=100;FOOT.stam=maxStam();if(COP.list.length||COP.level)escaped();LIFE.drunk=0;LIFE.high=0;
      profile.lastLoc={lat:w2ll(s.x,s.y)[0],lon:w2ll(s.x,s.y)[1],label:s.name};saveProfile();toast('Rested · health full · game saved','good');Snd.chime();}},{label:'Leave',fn:()=>{}}]);
}

/* ---------- stunt ramps on long main roads ---------- */
const RAMPS={cache:new Map(),near:[],t:0,mesh:null};
const RAMP_L=6.4,RAMP_H=1.35,RAMP_W=3.2;
function rampMesh(){if(RAMPS.mesh)return RAMPS.mesh;const mb=new MB();const hl=RAMP_L/2,hw=RAMP_W/2,n=8;
  for(let i=0;i<n;i++){const z0=hl-i*RAMP_L/n,z1=hl-(i+1)*RAMP_L/n,y0=RAMP_H*i/n,y1=RAMP_H*(i+1)/n;const col=i%2?[.08,.08,.08]:[1,.78,.05];
    mb.quad([-hw,y0,z0],[hw,y0,z0],[hw,y1,z1],[-hw,y1,z1],col,[0,1,.2],null,i%2?0:.35);}
  const g=[.42,.42,.44];
  mb.tri([-hw,0,hl],[-hw,RAMP_H,-hl],[-hw,0,-hl],g,[-1,0,0]);mb.tri([hw,0,hl],[hw,RAMP_H,-hl],[hw,0,-hl],g,[1,0,0]);
  mb.quad([-hw,0,-hl],[hw,0,-hl],[hw,RAMP_H,-hl],[-hw,RAMP_H,-hl],g,[0,0,-1]);
  for(const sx of[-1,1])mb.box(sx*(hw-.08),RAMP_H+.35,-hl+.1,.1,.7,.1,[.95,.2,.2],.9);
  RAMPS.mesh=mb.mesh();return RAMPS.mesh;}
function rampFor(s){const key=Math.round(s.ax*2)+','+Math.round(s.ay*2)+','+Math.round(s.bx*2)+','+Math.round(s.by*2);
  if(RAMPS.cache.has(key))return RAMPS.cache.get(key);let r=null;
  if(s.len>=60&&s.w.hw>=3.4&&!s.w.br){const hh=((Math.round(s.ax)*73856093)^(Math.round(s.ay)*19349663)^(Math.round(s.bx)*83492791))>>>0;
    if(hh%7===0){const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len,rx=-dy,ry=dx;const off=Math.max(0,s.w.hw-RAMP_W/2-.4);
      const flip=(hh>>4)&1;const fx=flip?-dx:dx,fy=flip?-dy:dy;const sd=flip?-1:1;
      const x=s.ax+dx*s.len*.5+rx*off*sd*-1,y=s.ay+dy*s.len*.5+ry*off*sd*-1;
      if(!inBuilding(x,y))r={x,y,h:hAng(fx,fy),fx,fy};}}
  RAMPS.cache.set(key,r);if(RAMPS.cache.size>4000)RAMPS.cache.clear();return r;}
function rampScan(){const tmp=[];gQuery(W.sG,P.x,P.y,320,tmp);const out=[];for(const s of tmp){const r=rampFor(s);if(r&&!out.includes(r))out.push(r);}RAMPS.near=out;}
function rampAt(x,y,h){for(const r of RAMPS.near){const dx=x-r.x,dy=y-r.y;const u=dx*r.fx+dy*r.fy,v=-dx*r.fy+dy*r.fx;
  if(Math.abs(u)<RAMP_L/2+.2&&Math.abs(v)<RAMP_W/2+.4)return {r,u,c:Math.cos(angDiff(h,r.h))};}return null;}
function drawRamps(night){const m=rampMesh();for(const r of RAMPS.near){if(Math.hypot(r.x-CAM.eye[0],r.y-CAM.eye[2])>220)continue;M4.model(TM,r.x,0,r.y,-r.h,0,0);drawLit(m,TM,{emiK:.4+night*1.4});}}
RLAYERS.push((A,n)=>drawRamps(n));

/* vehicle jump physics: P.jz height, P.jv vertical speed, P.fly airborne */
function rampTick(dt){
  if(FOOT.on||FLY.on)return;
  if(P.fly){P.airT+=dt;P.jv-=15*dt;P.jz+=P.jv*dt;
    if(P.jz<=0){const hard=P.jv<-11;P.jz=0;P.fly=false;P.bounce=Math.min(1.5,P.bounce+(hard?1.2:.6));CAM.shake=Math.max(CAM.shake,hard?9:4);Snd.burst&&Snd.burst(.25,120,1,.4);
      if(hard){damage(4);Hap.crash&&Hap.crash();}else Hap.rumble&&Hap.rumble();
      if(P.airT>.55){const pay=Math.round(P.airT*120/10)*10;profile.wallet+=pay;saveProfile();toast(`Stunt jump! ${P.airT.toFixed(1)} s in the air · +₹${pay}`,'gold');Snd.chime();}
      P.airT=0;}
  }else{const hit=rampAt(P.x,P.y,P.h);
    if(hit&&hit.c>.55&&P.s>2.5){P.jz=clamp((hit.u+RAMP_L/2)/RAMP_L,0,1)*RAMP_H;P.onRamp=hit.r;}
    else if(P.onRamp){const r=P.onRamp;const u=(P.x-r.x)*r.fx+(P.y-r.y)*r.fy;P.onRamp=null;
      if(u>RAMP_L/2-.3&&P.s>6){P.fly=true;P.airT=0;P.jz=RAMP_H;P.jv=Math.min(13,P.s*.42);Hap.play&&Hap.play([40],[160]);}else P.jz=0;}
    else P.jz=0;}
  if(P.jz>0){const V=VEH[P.type];const tilt=P.fly?clamp(P.jv*.035,-.35,.3):Math.atan2(RAMP_H,RAMP_L);
    M4.model(P.M,P.x,P.jz+Math.sin(P.wh||0)*P.len*.42,P.y,-P.h,tilt+(P.wh||0),V.cat==='two'?-P.lean:0);}
}
{const _up=updatePlayer;updatePlayer=function(dt){_up(dt);try{rampTick(dt);}catch(e){}};}

/* ---------- frame hooks ---------- */
{const _fc=findContext;findContext=function(){const c=safeCtx();if(c)return c;return _fc();};}
{const _fb=drawFootBeams;drawFootBeams=function(ex,ez){_fb(ex,ez);try{drawLandmarkBeams(ex,ez);
  for(const s of SAFES){if(!s.snapped)continue;const d=Math.hypot(s.x-ex,s.y-ez);if(d>700||d<10)continue;const f=Math.min(1,(d-10)/30)*.7;drawSprite(beamTex().tex,s.x,0,s.y,2.4+d*.01,40,(owned(s)?[.3,1,.5]:[1,1,1]).map(v=>v*f));}}catch(e){}};}
{const _wf=wxFrame;wxFrame=function(){_wf();const d=DIST.cur,n=FU.night||0;const tgt=d&&n>.15?d.rgb.map(v=>v*.32):null;DIST.k+=((tgt?.2*n:0)-DIST.k)*.03;if(tgt)DIST.tint=tgt;
  if(DIST.k>.002)FU.fogCol=FU.fogCol.map((v,i)=>v*(1-DIST.k)+DIST.tint[i]*DIST.k);};}
{const _fm=footMini;footMini=function(m,R,arrow){_fm(m,R,arrow);
  for(const s of SAFES){if(!s.snapped||Math.abs(s.x-P.x)>R||Math.abs(s.y-P.y)>R)continue;m.fillStyle=owned(s)?'#43D17A':'#E8EEF5';m.beginPath();m.moveTo(s.x,s.y-16);m.lineTo(s.x+14,s.y-2);m.lineTo(s.x+10,s.y-2);m.lineTo(s.x+10,s.y+12);m.lineTo(s.x-10,s.y+12);m.lineTo(s.x-10,s.y-2);m.lineTo(s.x-14,s.y-2);m.closePath();m.fill();}
  for(const r of RAMPS.near){if(Math.abs(r.x-P.x)>R||Math.abs(r.y-P.y)>R)continue;m.fillStyle='#FFC72C';m.beginPath();m.arc(r.x,r.y,6,0,TAU);m.fill();}};}
/* big-map icons, called from drawBigMap */
function mapExtras(m,dot,k,s){
  if(s<.6)for(const d of DISTRICTS)for(const c of d.w){if(!c)continue;m.globalAlpha=.08;m.fillStyle=d.col;m.beginPath();m.arc(c.x,c.y,c.r,0,TAU);m.fill();m.globalAlpha=1;}
  if(s>.3)for(const r of RAMPS.near)dot(r.x,r.y,'#E0A800',5,'');
  for(const sf of SAFES){if(sf.x==null)continue;dot(sf.x,sf.y,owned(sf)?'#2E9E5B':'#5A6675',9,'⌂');}
  for(const l of LANDMARKS){if(l.x==null)continue;dot(l.x,l.y,profile.lmk.includes(l.id)?l.col:'#3A4452',8,'★');}
}
let cpT=0,distT=0;
{const _lu=lifeUpdate;lifeUpdate=function(dt){_lu(dt);if(state!=='play')return;
  if((cpT-=dt)<=0){cpT=.5;try{rampScan();safeSnap();landmarkTick();}catch(e){}}
  if((distT-=dt)<=0){distT=1;const d=districtAt(P.x,P.y);if(d!==DIST.cur){DIST.cur=d;if(!INT.on)distBanner(d);}}};}
DIST.cur=undefined;
{const _sd=startDrive;startDrive=async function(loc){const r=await _sd(loc);try{cityPlusPlace();DIST.cur=undefined;}catch(e){}return r;};}

Object.assign(window.__oosht||{},{getAgents:()=>agents,findContext:()=>findContext(),LANDMARKS,SAFES,RAMPS,DISTRICTS,DIST,rampScan,rampAt,safeUse,cityPlusPlace,districtAt,distBanner});
