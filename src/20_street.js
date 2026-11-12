/* ================= WISE CITY: easier driving, skid marks, scattering garbage, ambulances, angry crowds,
   smoking and drugs, people at home, and easier police escapes ================= */

/* ---------- driving help ---------- */
/* in narrow lanes, nudge the nose away from a wall that is about to be hit */
function steerAssist(dt,sp){if(sp<3||P.s<0)return;const fx=Math.sin(P.h),fy=-Math.cos(P.h),rx=-fy,ry=fx;const ahead=P.len*.5+1.6+sp*.12;const w=P.wid*.5+.35;
  const L=inBuilding(P.x+fx*ahead-rx*w,P.y+fy*ahead-ry*w),R=inBuilding(P.x+fx*ahead+rx*w,P.y+fy*ahead+ry*w);
  if(L&&!R)P.h+=1.1*dt;else if(R&&!L)P.h-=1.1*dt;}
/* scrape along a wall instead of stopping dead, unless it is head-on */
function slideWall(ox,oy,fx,fy,sg,n,dt){const mx=P.vx*dt/n,my=P.vy*dt/n,m=Math.hypot(mx,my)||1e-6;
  const ok=(x,y)=>!inBuilding(x,y)&&!inBuilding(x+fx*P.len*.5*sg,y+fy*P.len*.5*sg);
  for(const[ax,ay]of[[mx,0],[0,my]]){const part=Math.hypot(ax,ay)/m;if(part<.42)continue;if(ok(ox+ax,oy+ay)){P.x=ox+ax;P.y=oy+ay;
    if(ax===0)P.vx*=.4;else P.vy*=.4;P.s*=1-.6*dt*n;if(P.s>0){const want=hAng(ax,ay);P.h+=angDiff(P.h,want)*Math.min(1,dt*n*4);}
    if((P.scrapeT||0)<GT){P.scrapeT=GT+.35;Snd.burst(.08,2400,.7,.08,'bandpass');Hap.tick();}return true;}}
  /* walls at any angle: try sliding along directions turned away from the heading */
  const hd=Math.atan2(my,mx);for(const da of[.35,-.35,.7,-.7,1.05,-1.05]){const a=hd+da,k=Math.cos(da);const ax=Math.cos(a)*m*k,ay=Math.sin(a)*m*k;
    if(ok(ox+ax,oy+ay)){P.x=ox+ax;P.y=oy+ay;P.vx=ax/dt*n;P.vy=ay/dt*n;P.s*=1-(1-k)*.9-.3*dt*n;if(P.s>0){const want=hAng(ax,ay);P.h+=angDiff(P.h,want)*Math.min(1,dt*n*4);}
      if((P.scrapeT||0)<GT){P.scrapeT=GT+.35;Snd.burst(.08,2400,.7,.08,'bandpass');Hap.tick();}return true;}}
  return false;}
/* skid marks behind the rear wheels */
const SKID=[];const DSK=new GlowBatch(720);let skidD=0;
function addSkid(){const V=VEH[P.type];const d=Math.hypot(P.x-(P.skx||0),P.y-(P.sky||0));if(d<.35)return;P.skx=P.x;P.sky=P.y;
  const fx=Math.sin(P.h),fy=-Math.cos(P.h),rx=-fy,ry=fx,b=P.len*.32;const two=V.cat==='two';
  for(const s of two?[0]:[-1,1]){const w=two?0:P.wid*.38*s;SKID.push({x:P.x-fx*b+rx*w,y:P.y-fy*b+ry*w,h:Math.atan2(P.vx,-P.vy)||P.h});}
  while(SKID.length>700)SKID.shift();if((skidD+=1)%6===0)Snd.burst(.12,900,.5,.05,'bandpass');}
function drawSkids(){if(!SKID.length)return;DSK.reset();const ex=CAM.eye[0],ez=CAM.eye[2];for(const k of SKID){if(Math.abs(k.x-ex)>160||Math.abs(k.y-ez)>160)continue;DSK.quad(k.x,.032,k.y,Math.sin(k.h),-Math.cos(k.h),.42,.11,ZERO3);}DSK.draw(1,.55);}

/* ---------- garbage bags (the old heaps) ---------- */
{const _pm=pickMeshes;pickMeshes=function(){const M=_pm();if(!M.bag){const mb=new MB();mb.blob(0,.2,0,.3,.22,.26,[.09,.09,.1]);mb.blob(.05,.4,0,.08,.08,.08,[.09,.09,.1]);M.bag=mb.mesh();}return M;};}

/* ---------- ambulances pick up the injured and the dead ---------- */
const AMB={list:[],queue:[],cool:0,model:null};
function ambModel(){if(AMB.model)return AMB.model;const mb=new MB();const Wc=[.96,.96,.95],R=[.85,.1,.1];
  mb.box(0,1.35,.4,2,2.3,3.6,Wc);mb.box(0,1.1,-1.95,1.9,1.6,1.2,Wc);mb.box(0,1.55,-2.5,1.7,.7,.1,[.12,.15,.2],.3);
  for(const s of[-1,1]){mb.box(s*1.01,1.4,.4,.02,.3,3.6,R);mb.box(s*1.01,1.9,.6,.02,.6,.18,R);mb.box(s*1.01,1.9,.6,.02,.18,.6,R);for(const z of[-1.7,1.4])mb.cyl(s*.95,.38,z,.38,.25,'x',10,[.08,.08,.08]);}
  mb.box(0,2.55,-1.2,1.2,.14,.3,[1,.15,.1],.9);const m={body:mb.mesh(),len:5.6,wid:2.05,lights:{head:[[-.7,.8,-2.6],[.7,.8,-2.6]],tail:[[-.8,.9,2.2],[.8,.9,2.2]]}};AMB.model=m;return m;}
function ambNeed(x,y,what,ped){if(INT.on)return;if(AMB.queue.some(q=>Math.hypot(q.x-x,q.y-y)<8)||AMB.list.some(a=>Math.hypot(a.inc.x-x,a.inc.y-y)<8))return;AMB.queue.push({x,y,what,ped,t:0});}
function ambDispatch(inc){
  let st=null;for(let k=0;k<60;k++){const s=W.segs[Math.floor(Math.random()*W.segs.length)];if(!s||s.w.br)continue;const d=Math.hypot(s.ax-inc.x,s.ay-inc.y);if(d>120&&d<260){st=s;break;}}if(!st)return false;
  const a=nodeNear(st.ax,st.ay),b=nodeNear(inc.x,inc.y);let pts=null;try{pts=findPath(a,b);}catch(e){}if(!pts||pts.length<2)return false;pts.push([inc.x,inc.y]);
  const A={x:pts[0][0],y:pts[0][1],h:0,pts,i:1,state:'go',inc,t:0,v:0};AMB.list.push(A);toast('Ambulance on the way','', 'amb',6000);return true;}
function ambUpdate(dt){
  if(INT.on)return;AMB.cool-=dt;
  for(const q of AMB.queue)q.t+=dt;
  if(AMB.queue.length&&AMB.list.length<2&&AMB.cool<=0){const q=AMB.queue.shift();if(Math.hypot(q.x-P.x,q.y-P.y)<300){if(!ambDispatch(q))AMB.cool=5;else AMB.cool=3;}}
  for(let i=AMB.list.length-1;i>=0;i--){const A=AMB.list[i];A.t+=dt;
    if(A.state==='go'||A.state==='leave'){const tgt=A.pts[A.i];if(!tgt){if(A.state==='go'){A.state='load';A.t=0;A.v=0;}else{AMB.list.splice(i,1);}continue;}
      const dx=tgt[0]-A.x,dy=tgt[1]-A.y,d=Math.hypot(dx,dy);const last=A.i===A.pts.length-1;
      const vt=A.state==="go"&&last?Math.min(17,d*.9+1):17;A.v+=clamp(vt-A.v,-10*dt,8*dt);
      if(d<1.5){A.i++;continue;}A.h+=angDiff(A.h,hAng(dx,dy))*Math.min(1,dt*5);const s=Math.min(d,A.v*dt);A.x+=dx/d*s;A.y+=dy/d*s;
      const pd=Math.hypot(P.x-A.x,P.y-A.y);if(pd<2.6){const nx=(P.x-A.x)/(pd||1),ny=(P.y-A.y)/(pd||1);P.x+=nx*.3;P.y+=ny*.3;A.v*=.5;}
      if(A.t>90){AMB.list.splice(i,1);}}
    else if(A.state==='load'){
      if(A.t>3.5){for(let k=peds.length-1;k>=0;k--){const p=peds[k];if(p.state==='down'&&Math.hypot(p.x-A.x,p.y-A.y)<9)peds.splice(k,1);}
        if(A.inc.what==='player'&&FOOT.on&&Math.hypot(P.x-A.x,P.y-A.y)<12&&LIFE.hp<100){LIFE.hp=100;toast('Paramedics patched you up','good');Snd.chime();}
        toast(A.inc.what==='player'?'The ambulance is leaving':'The injured were taken to hospital','', 'amb2',4000);
        A.state='leave';A.pts=A.pts.slice().reverse();A.i=1;A.t=0;}}}
  if(FOOT.on&&!FOOT.ride&&LIFE.hp<40&&!LIFE.dead&&!AMB.list.some(a=>a.inc.what==='player')&&!AMB.queue.some(q=>q.what==='player'))ambNeed(P.x,P.y,'player');
}
function ambDraw(night){for(const A of AMB.list){if(Math.hypot(A.x-CAM.eye[0],A.y-CAM.eye[2])>300)continue;const m=ambModel();M4.model(TM,A.x,0,A.y,-A.h,0,0);drawLit(m.body,TM,{emiK:.5+night});lightsFor(m,TM,night>.25,A.state==='load',night);
  const fl=Math.floor(GT*5)%2,p=M4.xform(TM,fl?-.4:.4,2.65,-1.2);DGr.bill(p[0],p[1],p[2],1.4,fl?[1,.1,.08]:[.15,.35,1],CAM.right);}}
{const _hp=hurtPed;hurtPed=function(p,dmg,nx,ny,how){_hp(p,dmg,nx,ny,how);if(p.state==='down'&&(p.dead||how==='gun'||dmg>=40)){p.t=Math.min(p.t,-60);ambNeed(p.x,p.y,'ped',p);}};
 const _hit=hitPed;hitPed=function(p){_hit(p);if(p.state==='down'){p.t=-60;ambNeed(p.x,p.y,'ped',p);}};}

/* ---------- run into someone from behind and the crowd turns on the driver ---------- */
const MOB={cool:0,events:[]};
function mobCheck(dt){MOB.cool-=dt;if(MOB.cool>0||INT.on||FLY.on)return;
  const fx=Math.sin(P.h),fy=-Math.cos(P.h);
  for(const a of agents){if(a.patrol||a.mis)continue;const dx=a.x-P.x,dy=a.y-P.y;const along=dx*fx+dy*fy,lat=Math.abs(-dx*fy+dy*fx);
    const reach=(FOOT.on?.3:P.len*.5)+a.t.len*.5+.5;const closing=a.v-Math.max(0,FOOT.on?0:P.s*Math.cos(angDiff(a.h,P.h)));
    if(along<0&&-along<reach&&lat<(FOOT.on?.8:P.wid*.5+a.t.wid*.4)&&closing>2.2&&Math.abs(angDiff(a.h,P.h))<1.1){mobStart(a);MOB.cool=20;return;}}}
function mobStart(a){a.stop=40;a.v=0;CAM.shake=Math.max(CAM.shake,6);Snd.crash();Hap.crash();if(FOOT.on)lfDamage(18,'hit');else damage(6);
  const lx=-Math.cos(a.h),ly=-Math.sin(a.h),side=a.t.wid/2+.7;
  const v=misPed(PED_LOOKS[pickLook(false)],a.x+lx*side,a.y+ly*side,{state:'victim',rp:'pose',calm:999});v.h=a.h;
  const mob=[];for(let i=0;i<6;i++){const ang=Math.random()*TAU,r=14+Math.random()*12;const m=misPed(PED_LOOKS[pickLook(false)],v.x+Math.cos(ang)*r,v.y+Math.sin(ang)*r,{state:'mob',ring:i/6*TAU,speed:4.6});mob.push(m);}
  MOB.events.push({a,v,mob,t:0});toast('People are rushing at the driver who hit you','', 'mob',4000);say('argue','man',true);}
function mobUpdate(dt){for(let i=MOB.events.length-1;i>=0;i--){const e=MOB.events[i];e.t+=dt;const v=e.v;
  if(e.t>14||Math.hypot(v.x-P.x,v.y-P.y)>230){for(const m of e.mob){m.mis=false;m.state='flee';m.fx=v.x;m.fy=v.y;m.t=0;}if(v.state!=='down'){v.mis=false;v.state='flee';v.fx=v.x+1;v.fy=v.y;v.t=0;}e.a.stop=0;MOB.events.splice(i,1);continue;}
  if(e.t>8&&v.state!=='down'){v.state='down';v.ko=true;v.fall=v.h;v.t=-60;ambNeed(v.x,v.y,'ped',v);}
  if(v.state==='victim'){v.rp=Math.floor(e.t*3)%2?'carry':'pose';}
  if(e.t>1&&Math.floor(e.t/1.7)!==Math.floor((e.t-dt)/1.7)&&Math.hypot(v.x-P.x,v.y-P.y)<40)say('argue','man',true);
  for(const m of e.mob){if(m.state==='down')continue;const tx=v.x+Math.cos(m.ring)*1.05,ty=v.y+Math.sin(m.ring)*1.05,dx=tx-m.x,dy=ty-m.y,d=Math.hypot(dx,dy);
    if(d>.25){const s=Math.min(d,m.speed*dt);const nx=m.x+dx/d*s,ny=m.y+dy/d*s;if(!inBuilding(nx,ny)){m.x=nx;m.y=ny;}else{m.x+=dy/d*s;m.y-=dx/d*s;}m.h=hAng(dx,dy);m.pt+=dt;if(m.pt>.18){m.pt=0;m.pose^=1;}m.rp=m.pose?'run1':'run0';}
    else{m.h=hAng(v.x-m.x,v.y-m.y);m.pt+=dt;if(m.pt>.32){m.pt=0;m.pose=(m.pose+1)%3;if(Math.random()<.3)Snd.thud(.12);}m.rp=['punch','kick','pose'][m.pose%3];}}}}
{const _mp=misPedUpdate;misPedUpdate=function(p,dt){if(p.state==='mob'||p.state==='victim')return;_mp(p,dt);};}

/* ---------- cigarettes, beedis and ganja ---------- */
MENUS.juice.push(['Cigarette (single)',20,{smoke:8,st:10}],['Beedi bundle',30,{smoke:10,st:8}]);MENUS.hotel.push(['Cigarette (single)',20,{smoke:8,st:10}]);MENUS.bar.push(['Cigarette pack',350,{smoke:8,st:12}]);
for(const k of['juice','hotel','bar'])for(const it of MENUS[k])if(it._base==null)it._base=it[1];
{const _ae=applyEffect;applyEffect=function(e,v){if(e.smoke){state='play';show('play');footHud(true);if(e.st)FOOT.stam=Math.min(maxStam(),FOOT.stam+e.st);LIFE.smoke=e.smoke;LIFE.hp=Math.max(5,LIFE.hp-2);toast('Smoking…','',null,1200);return;}if(e.high){LIFE.high=e.high;toast('Everything feels slow and bright…','',null,1800);return;}_ae(e,v);};}
FINES.drugs=['Possession of ganja',10000];HEAT.drugs=2;
const DEAL={p:null,t:0};
function dealUpdate(dt){if(INT.on)return;DEAL.t-=dt;const p=DEAL.p;
  if(p&&(Math.hypot(p.x-P.x,p.y-P.y)>220||pedDown(p))){if(!pedDown(p)){const i=peds.indexOf(p);if(i>=0)peds.splice(i,1);}DEAL.p=null;DEAL.t=60;}
  if(!DEAL.p&&DEAL.t<=0){DEAL.t=90;const s=spotAt(50,110,0);if(s.s){DEAL.p=misPed({kind:'walk',shirt:'#20262E',pants:'#14181E',cap:'#14181E'},s.x,s.y,{idle:'pose',dealer:true,calm:3});}}
  if(LIFE.smoke>0){LIFE.smoke-=dt;}
  if(LIFE.high>0){LIFE.high-=dt;const k=Math.min(1,LIFE.high/10);glc.style.filter=`saturate(${1+k*1.4}) hue-rotate(${Math.sin(GT*.6)*25*k}deg) contrast(${1+k*.15})`;CAM.shake=Math.max(CAM.shake,1.2*k);P.h+=Math.sin(GT*.9)*.25*k*dt*(FOOT.on?1:.4);if(LIFE.high<=0)glc.style.filter='';}}
function dealCtx(){const p=DEAL.p;if(!p||pedDown(p)||!FOOT.on||FOOT.ride)return null;if(Math.hypot(p.x-P.x,p.y-P.y)>1.7)return null;
  return {k:'mis',label:'Buy ganja (₹500)',fn:()=>{if(profile.wallet<500){toast('He wants ₹500','bad');return;}profile.wallet-=500;saveProfile();Snd.coin();p.h=hAng(P.x-p.x,P.y-p.y);LIFE.high=60;toast('Everything feels slow and bright…','',null,1800);crime('drugs',1);}};}
/* the smoking hand and a wisp of smoke */
{const _pp=playerPose;playerPose=function(){if(LIFE.smoke>0&&P.s<.3&&LIFE.anim<=0)return Math.floor(GT*.8)%3===0?'eatS0':'eatS1';return _pp();};}
function smokeDraw(){if(!(LIFE.smoke>0)||!FOOT.on)return;const fx=Math.sin(P.h),fy=-Math.cos(P.h);for(let k=0;k<4;k++){const t=(GT*.7+k*.25)%1;DGr.bill(P.x+fx*.25+Math.sin(GT+k)*.08*t,1.62+t*.7,P.y+fy*.25,.12+t*.25,[.22*(1-t),.22*(1-t),.24*(1-t)],CAM.right);}}

/* ---------- people at home: talk to them, or hit them ---------- */
const HOMELINES=[['ನಮಸ್ಕಾರ, ಬನ್ನಿ ಕೂತ್ಕೊಳ್ಳಿ','Namaskara, banni koothkolli'],['ಕಾಫಿ ಕುಡೀತೀರಾ?','Coffee kudithira?'],['ಯಾರು ನೀವು? ಯಾಕೆ ಬಂದ್ರಿ?','Yaaru neevu? Yaake bandri?'],['ಊಟ ಆಯ್ತಾ?','Oota aaytha?'],['ಟಿವಿ ಸೌಂಡ್ ಕಮ್ಮಿ ಮಾಡು','TV sound kammi maadu']];
function intLocal(){return toLocal(P.x,P.y);}
function intNpcAt(range,cone){const[ix,iz]=intLocal();const fh=P.h-hAng(INT.f[0],INT.f[1]);let best=null,bd=range;
  for(const n of INT.npcs){if(n.down)continue;const dx=n.ix-ix,dz=n.iz-iz,d=Math.hypot(dx,dz);if(d>bd)continue;const a=Math.atan2(dx,dz);if(cone&&Math.abs(angDiff(fh,a))>cone)continue;bd=d;best=n;}return best;}
{const _da=doAttack;doAttack=function(){
  if(!INT.on){_da();return;}
  if(FOOT.job&&FOOT.job.carry)return;const k=LIFE.cur,w=WPN[k];LIFE.atkT=w.rate;
  if(w.gun&&(profile.inv.ammo[w.gun]||0)<=0){toast('Out of ammo','bad','ammo',1200);LIFE.cur='fist';return;}
  if(w.melee){if(k==='fist'){LIFE.punchAlt=!LIFE.punchAlt;LIFE.animK=LIFE.punchAlt?'punch':'kick';}else LIFE.animK=k==='bat'?'bat':'stab';LIFE.anim=k==='bat'?.36:.28;}
  else{profile.inv.ammo[w.gun]--;LIFE.aimT=2;LIFE.anim=.1;LIFE.animK='aim';Snd.burst(.08,1700,.6,.55,'bandpass');Snd.burst(.22,150,1,.55);}
  const n=intNpcAt(w.melee?1.5:9,w.melee?1:.35);if(!n){if(w.melee)Snd.tone([180],.06,'triangle',.04);return;}
  const[ix,iz]=intLocal();P.h=hAng(INT.f[0],INT.f[1])+Math.atan2(n.ix-ix,n.iz-iz);
  setTimeout(()=>{if(!INT.on)return;n.hp=(n.hp??100)-(w.dmg*(k==='fist'?profile.fit.str:1)*(LIFE.animK==='kick'?1.3:1));Snd.thud(.35);Hap.tick();
    if(n.hp<=0||(w.melee&&Math.random()<.3)){n.down=true;n.dead=n.hp<=0;n.anim=null;n.pose='pose';}
    INT.hurt=(INT.hurt||0)+1;if(INT.kind==='police'){crime('cop',3);}
    for(const o of INT.npcs)if(!o.down&&o!==n){o.anim='flee';o.t=0;}say('help',n.look&&n.look.female?'woman':'man',true);},w.melee?110:20);};}
{const _ui=updateInterior;updateInterior=function(dt){_ui(dt);const[ix,iz]=intLocal();
  for(const n of INT.npcs){if(n.down)continue;if(n.anim==='flee'){n.t=(n.t||0)+dt;const dx=n.ix-ix,dz=n.iz-iz,d=Math.hypot(dx,dz)||1;n.ix=clamp(n.ix+dx/d*2.4*dt,-INT.W/2+.4,INT.W/2-.4);n.iz=clamp(n.iz+dz/d*2.4*dt,.6,INT.D-.4);n.h=Math.atan2(dx,dz);n.pose=Math.floor(n.t*5)%2?'run1':'run0';}}};}
{const _ic=interiorContext;interiorContext=function(){const c=_ic();if(c&&c.k==='exitb')return c;if(c)return c;
  const n=intNpcAt(1.4,0);if(n&&INT.kind!=='mall')return {k:'item',it:{fn:()=>{const L=HOMELINES[Math.floor(Math.random()*HOMELINES.length)];const kn=ttsLang()==='kn';say('man','man',false);toast(`"${L[1]}"`,'',null,2500);
    try{if(window.OoshtNative&&OoshtNative.speak)OoshtNative.speak(kn?L[0]:L[1],n.look&&n.look.female?1.3:.9,1);}catch(e){}n.h=Math.atan2(ix0()-n.ix,iz0()-n.iz);}},label:INT.kind==='police'?'Talk to the constable':INT.kind==='house'||INT.kind==='apartment'?'Talk to the family':'Talk'};return null;};}
const ix0=()=>intLocal()[0],iz0=()=>intLocal()[1];
/* knocked-down people lie on the floor */
{const _ri=renderInterior;renderInterior=function(dt){const keep=INT.npcs;const up=keep.filter(n=>!n.down);INT.npcs=up;_ri(dt);INT.npcs=keep;
  for(const n of keep){if(!n.down)continue;const w=IL(n.ix,n.iz);M4.model(TM,w[0],.15,w[1],-(hAng(INT.f[0],INT.f[1])+n.h),-Math.PI/2,0);drawLit(rig(n.look,SKINS[1],'pose'),TM);}};}
{const _lb=leaveBuilding;leaveBuilding=function(){const hurt=INT.hurt;INT.hurt=0;_lb();if(hurt&&INT.kind!=='police'&&Math.random()<.4){forceChase(1,'assault');toast('The family called the police!','bad');}};}

/* ---------- getting away from the police ---------- */
const ESC={still:0,hidden:0};
function escapeCheck(dt){
  if(!COP.list.length&&!LIFE.copPeds.some(c=>!c.dead&&!c.patrol)){ESC.still=ESC.hidden=0;return;}
  if(INT.on){escaped();toast('You hid inside. The police lost you.','good');return;}
  const seen=COP.list.some(c=>Math.hypot(c.x-P.x,c.y-P.y)<120&&lineClear(c.x,c.y,P.x,P.y)!==false)||LIFE.copPeds.some(c=>!c.dead&&!c.patrol&&Math.hypot(c.x-P.x,c.y-P.y)<60&&lineClear(c.x,c.y,P.x,P.y)!==false);
  ESC.hidden=seen?0:ESC.hidden+dt;
  const md=Math.min(1e9,...COP.list.map(c=>Math.hypot(c.x-P.x,c.y-P.y)),...LIFE.copPeds.filter(c=>!c.dead).map(c=>Math.hypot(c.x-P.x,c.y-P.y)));
  ESC.still=Math.abs(P.s)<.3&&md>12?ESC.still+dt:0;
  if(ESC.hidden>5){escaped();toast('Out of sight. The police gave up.','good');}
  else if(ESC.still>5){escaped();toast('You lay low. The police moved on.','good');}
}
{const _ex=escaped;escaped=function(){_ex();LIFE.copPeds=LIFE.copPeds.filter(c=>c.dead||c.patrol);COP.heat=0;ESC.still=ESC.hidden=0;};}
/* the police only catch you in a vehicle when they are right on you and you have been stopped for a while */
{const _uc=updateCops;updateCops=function(dt){if(COP.list.length){const md=Math.min(...COP.list.map(c=>Math.hypot(c.x-P.x,c.y-P.y)));if(md>6)COP.caughtT=0;}_uc(dt);};}

/* ---------- wiring ---------- */
{const _lu=lifeUpdate;lifeUpdate=function(dt){_lu(dt);if(state!=='play')return;ambUpdate(dt);mobCheck(dt);mobUpdate(dt);dealUpdate(dt);escapeCheck(dt);};
 const _ds=drawStations;drawStations=function(n){_ds(n);ambDraw(n);smokeDraw();};
 const _fc=findContext;findContext=function(){if(!INT.on){const c=dealCtx();if(c)return c;}return _fc();};}
Object.assign(window.__oosht||{},{AMB,MOB,SKID,DEAL,ESC,ambNeed,mobStart});
