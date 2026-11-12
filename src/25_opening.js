/* ================= WISE CITY: the live opening. Played in the real 3D city the first time you press Play:
   aerial sweep over MG Road, Tony and Arjun's deal goes wrong, a Hoysala arrives, Tony takes the pink coupe,
   and the camera swoops behind the car straight into play ================= */
const CUT={on:false,t:0,k:null,cam:null,arjun:null,stage:0,hold:0,ui:null,subT:0};
const CUT_END=11.6;
function cutUI(){if(CUT.ui)return CUT.ui;const u=document.createElement('div');u.id='cutUI';
  u.innerHTML=`<div class="lb t"></div><div class="lb b"></div><div class="nm"><div class="n">TONY</div><div class="s">THAT’S YOU</div></div><div class="sub"></div><button class="hs" aria-label="Hold to skip"><span class="ring"></span>Hold to skip</button>`;
  const st=document.createElement('style');st.textContent=`
#cutUI{position:fixed;inset:0;z-index:45;pointer-events:none}
#cutUI .lb{position:absolute;left:0;right:0;height:9vh;background:#000;transition:transform .6s ease}
#cutUI .lb.t{top:0}#cutUI .lb.b{bottom:0}
#cutUI.out .lb.t{transform:translateY(-100%)}#cutUI.out .lb.b{transform:translateY(100%)}
#cutUI .nm{position:absolute;left:8%;top:30%;opacity:0;transform:scale(1.25) skewX(-10deg);transition:opacity .25s,transform .35s cubic-bezier(.2,1.6,.4,1)}
#cutUI .nm.on{opacity:1;transform:scale(1) skewX(-10deg)}
#cutUI .nm .n{font-family:WCDisplay,Impact,sans-serif;font-size:clamp(64px,17vh,130px);line-height:.9;letter-spacing:.03em;background:linear-gradient(180deg,#fff,#FFC9E6);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:3px #14082A;paint-order:stroke fill;filter:drop-shadow(0 0 16px rgba(255,63,164,.8)) drop-shadow(4px 5px 0 rgba(0,0,0,.5))}
#cutUI .nm .s{font-family:WCDisplay,Impact,sans-serif;font-size:clamp(16px,4vh,24px);letter-spacing:.3em;color:#2EE6E6;text-shadow:0 2px 0 #000;margin-top:4px}
#cutUI .sub{position:absolute;left:50%;bottom:calc(9vh + 14px);transform:translateX(-50%);max-width:min(80vw,640px);text-align:center;padding:6px 14px;border-radius:8px;background:rgba(6,6,12,.6);font-family:WCDisplay,Impact,sans-serif;font-size:clamp(17px,4.4vh,24px);letter-spacing:.03em;color:#fff;opacity:0;transition:opacity .25s}
#cutUI .sub b{color:#2EE6E6;font-weight:400;margin-right:.5em}
#cutUI .hs{pointer-events:auto;position:absolute;right:calc(16px + env(safe-area-inset-right,0px));top:calc(9vh + 10px);display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(10,10,18,.55);color:#fff;font:600 13px Roboto,system-ui,sans-serif;letter-spacing:.04em}
#cutUI .hs .ring{width:16px;height:16px;border-radius:50%;background:conic-gradient(#FFC72C calc(var(--p,0)*1turn),rgba(255,255,255,.25) 0)}
#hud.cut > *{visibility:hidden!important}`;
  document.head.appendChild(st);document.body.appendChild(u);CUT.ui=u;
  const hs=u.querySelector('.hs');const down=e=>{e.preventDefault();e.stopPropagation();CUT.holding=true;};const up=e=>{e.stopPropagation();CUT.holding=false;CUT.hold=0;hs.style.setProperty('--p',0);};
  hs.addEventListener('pointerdown',down);hs.addEventListener('pointerup',up);hs.addEventListener('pointercancel',up);hs.addEventListener('pointerleave',up);
  return u;}
function cutSub(who,txt){const s=CUT.ui.querySelector('.sub');if(!txt){s.style.opacity=0;return;}s.innerHTML='';const b=document.createElement('b');b.textContent=who;s.appendChild(b);s.appendChild(document.createTextNode(txt));s.style.opacity=1;CUT.subT=3.2;}

/* camera keyframes are relative to the car: f = forward, r = right, u = height */
function cutPt(f,r,u){const K=CUT.k,fx=Math.sin(K.h),fy=-Math.cos(K.h),rx=Math.cos(K.h),ry=Math.sin(K.h);return [K.x+fx*f+rx*r,u,K.y+fy*f+ry*r];}
const mix3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
const sm=k=>{k=clamp(k,0,1);return k*k*(3-2*k);};
function cutCamera(T){const K=CUT.k;
  if(T<4){const k=sm(T/4);return {eye:mix3(cutPt(-95,0,85),cutPt(-24,0,13),k),tgt:mix3(cutPt(30,0,0),cutPt(2,-2,1),k),fov:58};}
  if(T<7.5){const m=CUT.mid;const k=sm((T-4)/3.5);const fx=Math.sin(K.h),fy=-Math.cos(K.h),rx=Math.cos(K.h),ry=Math.sin(K.h);
    const e0=[m[0]-rx*5.2+fx*1.6,1.55,m[1]-ry*5.2+fy*1.6],e1=[m[0]-rx*4.2-fx*.6,1.45,m[1]-ry*4.2-fy*.6];return {eye:mix3(e0,e1,k),tgt:[m[0],1.25,m[1]],fov:48};}
  if(T<9.8){const k=sm((T-7.5)/2.3);const c=COP.list[0];let tg=mix3(cutPt(-60,0,1.2),cutPt(-20,-1,1.1),k);if(c)tg=mix3([c.x,1.3,c.y],[(c.x+K.x)/2,1.1,(c.y+K.y)/2],k*.6);return {eye:mix3(cutPt(3.5,-3.4,1.9),cutPt(4.5,-2.6,2.3),k),tgt:tg,fov:50};}
  const k=sm((T-9.8)/1.8);const fx=Math.sin(P.h),fy=-Math.cos(P.h),rx=Math.cos(P.h),ry=Math.sin(P.h);
  const chaseEye=CAM.eyeLive||[P.x-fx*6.5,2.6,P.y-fy*6.5];
  const e0=[P.x-rx*8+fx*2,2.4,P.y-ry*8+fy*2];return {eye:mix3(e0,chaseEye,k),tgt:mix3([P.x,1.1,P.y],CAM.tgtLive||[P.x+fx*6,1.1,P.y+fy*6],k),fov:52+(62-52)*k};}

function openingStart(){
  const K={x:P.x,y:P.y,h:P.h};CUT.k=K;CUT.on=true;CUT.t=0;CUT.stage=0;CUT.hold=0;CUT.holding=false;
  P.skin={model:buildCar('zephyr','#FF3FA4'),k:'zephyr'};
  exitVehicle();Snd.stopEngine&&Snd.stopEngine();
  const fx=Math.sin(K.h),fy=-Math.cos(K.h),rx=Math.cos(K.h),ry=Math.sin(K.h);
  /* clear traffic from the road behind, so the Hoysala's arrival reads clearly */
  agents=agents.filter(a=>{const dx=a.x-K.x,dy=a.y-K.y,u=dx*fx+dy*fy,w=dx*rx+dy*ry;return !(u<15&&u>-110&&Math.abs(w)<12);});
  /* Tony stands a few steps from the coupe's door, Arjun faces him */
  const tx=K.x-rx*3.2+fx*1.4,ty=K.y-ry*3.2+fy*1.4;const o=pushOutOf(tx,ty);P.x=o[0];P.y=o[1];
  CUT.arjun=misPed({kind:'walk',shirt:'#F2C21B',pants:'#2B2F3A',mous:true},P.x+fx*2,P.y+fy*2,{state:'mis',idle:'pose',speed:0});
  CUT.arjun.h=hAng(P.x-CUT.arjun.x,P.y-CUT.arjun.y);P.h=hAng(CUT.arjun.x-P.x,CUT.arjun.y-P.y);
  CUT.mid=[(P.x+CUT.arjun.x)/2,(P.y+CUT.arjun.y)/2];
  const u=cutUI();u.classList.remove('out');u.hidden=false;$('#hud').classList.add('cut');
  if(typeof TUT!=='undefined')tutHint('');
  setTimeout(()=>{if(CUT.on&&Snd.ctx){MUS.menu=false;musPlay(INTRO_THEME,.32);}},350);}

function openingTick(dt){if(!CUT.on)return;CUT.t+=dt;CUT.beat=performance.now();const T=CUT.t;
  if(CUT.holding){CUT.hold+=dt;CUT.ui.querySelector('.hs').style.setProperty('--p',Math.min(1,CUT.hold/.6));if(CUT.hold>=.6){openingSkip();return;}}
  if((CUT.subT-=dt)<=0)cutSub();
  const nm=CUT.ui.querySelector('.nm');nm.classList.toggle('on',T>4.4&&T<6.9);
  const at=(t,f)=>{if(CUT.stage<t&&T>=t){CUT.stage=t;f();}};
  at(4.8,()=>{cutSub('ARJUN:','Tony! The buyer was a police informer!');Hap.play&&Hap.play([0,40],[0,120],true);});
  at(6.3,()=>cutSub('ARJUN:','Hoysala! Take my car. Go, go!'));
  at(6.6,()=>{forceChase(1,'open');Snd.sirenOn&&Snd.sirenOn();});
  at(8,()=>{const a=CUT.arjun;if(a){a.state='flee';a.calm=99;a.fleeSp=4.5;a.side=1;}});
  at(9.4,()=>{if(FOOT.on&&FOOT.parked){enterVehicle({k:'own'});}});
  at(9.9,()=>cutSub('ARJUN:','Lose them, then lie low at your Jayanagar flat!'));
  /* Tony walks to the driver's door */
  if(T>7.8&&T<9.4&&FOOT.on&&FOOT.parked){const pk=FOOT.parked,pm=curModel();const lx=-Math.cos(pk.h),ly=-Math.sin(pk.h);const dx=pk.x+lx*(1.4)-P.x,dy=pk.y+ly*1.4-P.y,d=Math.hypot(dx,dy);
    if(d>.15){const sp=Math.min(d,3.4*dt);P.x+=dx/d*sp;P.y+=dy/d*sp;P.h=hAng(dx,dy);P.s=3.4;FOOT.pt+=dt*2.8;if(FOOT.pt>.33){FOOT.pt=0;FOOT.pose^=1;}}else P.s=0;}
  else if(FOOT.on)P.s=0;
  if(FOOT.on)M4.model(P.M,P.x,0,P.y,-P.h,0,0);
  if(T>=CUT_END)openingEnd();}
function openingSkip(){if(FOOT.on&&FOOT.parked)enterVehicle({k:'own'});if(!COP.list.length)forceChase(1,'open');const a=CUT.arjun;if(a){a.state='flee';a.calm=99;a.fleeSp=4.5;}openingEnd();}
function openingEnd(){if(!CUT.on)return;CUT.on=false;CUT.cam=null;profile.opened=1;saveProfile();cutSub();
  CUT.ui.querySelector('.nm').classList.remove('on');CUT.ui.classList.add('out');setTimeout(()=>{if(!CUT.on)CUT.ui.hidden=true;},650);
  $('#hud').classList.remove('cut');CAM.yaw=P.h;CAM.look=0;CAM.cd=null;
  if(!FOOT.on){try{Snd.startEngine(VEH[P.type].engine,P.type);}catch(e){}}
  /* the theme hands over to the car radio */
  setTimeout(()=>{try{if(state==='play'&&!FOOT.on&&hasRadio())radioSet(1);}catch(e){}},900);}
/* self-healing handoff: whatever went wrong in the scene, gameplay is guaranteed to be visible and controllable */
function handoffCheck(){
  try{const ok=v=>Array.isArray(v)&&v.every(Number.isFinite);
    if(!Number.isFinite(P.x)||!Number.isFinite(P.y)){const K=CUT.k;if(K){P.x=K.x;P.y=K.y;P.h=K.h;}}
    if(!ok(CAM.eye)||!ok(CAM.tgt)){CAM.eye=[P.x,2.6,P.y+6];CAM.tgt=[P.x,1,P.y];}CAM.cd=null;CAM.eyeLive=CAM.tgtLive=null;
    if(!Number.isFinite(CAM.fov)||CAM.fov<30||CAM.fov>110)CAM.fov=62;
    const hud=$('#hud');hud.classList.remove('cut');if(CUT.ui){CUT.ui.hidden=true;}
    if(['loading','splash','title'].includes(state)||(state==='play'&&hud.hidden)){state='play';show('play');if(FOOT.on&&!FOOT.ride)footHud(true);}
  }catch(e){console.error(e);}}
{const _oe=openingEnd;openingEnd=function(){try{_oe();}catch(e){console.error(e);}finally{CUT.on=false;handoffCheck();setTimeout(handoffCheck,600);setTimeout(handoffCheck,2000);}};}
/* watchdog: if the scene stops advancing for 3 seconds (an error, a lost frame loop), skip to gameplay */
setInterval(()=>{if(CUT.on&&state==='play'&&CUT.beat&&performance.now()-CUT.beat>3000){try{openingSkip();}catch(e){openingEnd();}}},1000);

/* hooks: lock input during the scene, drive the camera, run the timeline */
{const _u=update;update=function(dt){if(CUT.on){for(const k of['gas','brake','jx','jy','L','R','atk','jump','run'])if(k in input)input[k]=typeof input[k]==='number'?0:false;}_u(dt);if(CUT.on){COP.caughtT=0;{const c=COP.list[0],K=CUT.k;if(c&&CUT.t<9.9){const k=sm((CUT.t-6.6)/3.1),dd=85-57*k,fx=Math.sin(K.h),fy=-Math.cos(K.h);c.x=K.x-fx*dd;c.y=K.y-fy*dd;c.h=K.h;c.v=k<1?12:0;}}if(state!=='play'){CUT.on=false;$('#hud').classList.remove('cut');if(CUT.ui)CUT.ui.hidden=true;}}if(CUT.on&&state==='play')try{openingTick(dt);}catch(e){console.error(e);openingSkip();}};}
{const _sc=setupCamera;setupCamera=function(dt,P_,V,model){_sc(dt,P_,V,model);if(!CUT.on){CAM.eyeLive=null;return;}
  if(CUT.t>9.4){/* remember where the live chase camera wants to be, so the swoop lands exactly there */CAM.eyeLive=CAM.eye.slice();CAM.tgtLive=CAM.tgt.slice();}
  const c=cutCamera(CUT.t);if(![...c.eye,...c.tgt].every(Number.isFinite))return;CAM.eye=c.eye;CAM.tgt=c.tgt;CAM.fov=c.fov;const asp=glc.width/glc.height;
  M4.persp(CAM.proj,CAM.fov*Math.PI/180,asp,.15,1400);M4.lookAt(CAM.view,CAM.eye,CAM.tgt,[0,1,0]);M4.mul(CAM.vp,CAM.proj,CAM.view);M4.invert(CAM.inv,CAM.vp);
  const dx=CAM.tgt[0]-CAM.eye[0],dz=CAM.tgt[2]-CAM.eye[2],dl=Math.hypot(dx,dz)||1;CAM.fwd=[dx/dl,0,dz/dl];CAM.right=[-dz/dl,0,dx/dl];};}
/* the first time Play is pressed, skip the showroom and start the opening */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#playBtn');if(!b||profile.opened)return;e.stopPropagation();e.preventDefault();
  Snd.init();Snd.resume();P.type='zephyr';CUT.pending=true;startDrive(CITY_START);},true);
{const _sp=startPlay;startPlay=function(keep){_sp(keep);if(CUT.pending&&!keep){CUT.pending=false;try{openingStart();}catch(e){console.error(e);CUT.on=false;$('#hud').classList.remove('cut');if(CUT.ui)CUT.ui.hidden=true;}}};}
Object.assign(window.__oosht||{},{CUT,openingStart,openingSkip,cutCamera,update:dt=>update(dt),startPlay:k=>startPlay(k)});
