/* ================= WISE CITY: controls v2 =================
   floating joystick with a radial dead zone, swipe-to-look camera, context-swapped button clusters
   (on foot / driving / flying / riding), and physical gamepad support that hides the touch overlay */
for(const[k,v]of Object.entries({joyMode:'float',lookSens:'med'}))if(settings[k]==null)settings[k]=v;
SETS.splice(1,0,['joyMode','Joystick',[['float','Floating'],['fixed','Fixed']]],['lookSens','Camera swipe',[['low','Slow'],['med','Medium'],['high','Fast']]]);

/* ---------- joystick ---------- */
const JOY={id:null,cx:0,cy:0,R:64,dz:.14,run:false};
const jz=$('#joyZone'),jb=$('#joy'),jk=$('#joyKnob');
function joyR(){return 64*(+settings.btnSize||1);}
function joyRest(){const z=jz.getBoundingClientRect(),R=joyR();return [z.left+Math.max(24,parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sal'))||0)+R+10,z.bottom-R-18];}
function joyPlace(cx,cy){const z=jz.getBoundingClientRect(),R=joyR();jb.style.left=(cx-z.left-R)+'px';jb.style.top=(cy-z.top-R)+'px';}
function joyKnob(dx,dy){jk.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;}
function joyReset(){JOY.id=null;input.jx=input.jy=0;JOY.run=false;jz.classList.remove('on','run');joyKnob(0,0);const r=joyRest();joyPlace(r[0],r[1]);}
function joyMove(e){const R=JOY.R;let dx=(e.clientX-JOY.cx)/R,dy=(e.clientY-JOY.cy)/R;const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}
  const mm=Math.min(1,m);const k=mm<JOY.dz?0:(mm-JOY.dz)/(1-JOY.dz)/(mm||1);
  input.jx=dx*k;input.jy=-dy*k;joyKnob(dx*R*.62,dy*R*.62);
  const run=mm>.97;if(run!==JOY.run){JOY.run=run;jz.classList.toggle('run',run&&FOOT.on);}}
jz.addEventListener('pointerdown',e=>{if(JOY.id!=null)return;e.preventDefault();try{jz.setPointerCapture(e.pointerId);}catch(_){}
  JOY.id=e.pointerId;JOY.R=joyR();const z=jz.getBoundingClientRect();
  if(settings.joyMode==='fixed'){const r=joyRest();JOY.cx=r[0];JOY.cy=r[1];}
  else{JOY.cx=clamp(e.clientX,z.left+JOY.R+6,z.right-JOY.R-6);JOY.cy=clamp(e.clientY,z.top+JOY.R+6,z.bottom-JOY.R-6);}
  joyPlace(JOY.cx,JOY.cy);jz.classList.add('on');joyMove(e);});
jz.addEventListener('pointermove',e=>{if(e.pointerId===JOY.id)joyMove(e);});
for(const ev of['pointerup','pointercancel','lostpointercapture'])jz.addEventListener(ev,e=>{if(e.pointerId===JOY.id)joyReset();});
window.addEventListener('resize',()=>{if(JOY.id==null)setTimeout(joyReset,60);});
setTimeout(joyReset,0);

/* ---------- swipe anywhere else to look around ---------- */
const LOOK={id:null,x:0,y:0,t:0,lastTap:0,moved:0};
const lz=$('#lookZone');
const lookK=()=>({low:.0045,med:.0075,high:.012}[settings.lookSens]||.0075);
function lookBy(dx,dy){
  if(CAM.mode==='cockpit'){if(FOOT.on&&!FOOT.ride)P.h+=dx*lookK();return;}
  if(CAM.free)CAM.yaw+=dx*lookK();else CAM.look=clamp((CAM.look||0)+dx*lookK(),-2.8,2.8);
  CAM.pitch=clamp((CAM.pitch||0)-dy*.012,-.6,2.6);}
lz.addEventListener('pointerdown',e=>{if(LOOK.id!=null)return;e.preventDefault();try{lz.setPointerCapture(e.pointerId);}catch(_){}LOOK.id=e.pointerId;LOOK.x=e.clientX;LOOK.y=e.clientY;LOOK.t=performance.now();LOOK.moved=0;CAM.lookHeld=true;});
lz.addEventListener('pointermove',e=>{if(e.pointerId!==LOOK.id)return;const dx=e.clientX-LOOK.x,dy=e.clientY-LOOK.y;LOOK.x=e.clientX;LOOK.y=e.clientY;LOOK.moved+=Math.abs(dx)+Math.abs(dy);if(state==='play')lookBy(dx,dy);});
for(const ev of['pointerup','pointercancel','lostpointercapture'])lz.addEventListener(ev,e=>{if(e.pointerId!==LOOK.id)return;LOOK.id=null;CAM.lookHeld=false;
  const now=performance.now();if(LOOK.moved<10&&now-LOOK.t<250){/* double tap: snap the camera behind you */if(now-LOOK.lastTap<350){CAM.yaw=P.h;CAM.look=0;CAM.pitch=0;}LOOK.lastTap=now;}});

/* ---------- weapon button and context clusters ---------- */
$('#btnWpn').addEventListener('click',()=>{cycleWeapon(false);Snd.tick();});
const hudEl=$('#hud');let modeKey='',hudWasHidden=true;
function ctlFrame(){
  if(hudEl.hidden!==hudWasHidden){hudWasHidden=hudEl.hidden;if(!hudWasHidden&&JOY.id==null)setTimeout(joyReset,0);}
  const ride=METRO.ride||(FOOT.on&&FOOT.ride&&FOOT.ride.phase==='ride');
  const m=ride?'m-ride':FLY.on?'m-fly':FOOT.on?'m-foot':'m-drive';const k=m+(PAD.active?'|pad':'');
  if(k!==modeKey){modeKey=k;for(const c of['m-ride','m-fly','m-foot','m-drive'])hudEl.classList.toggle(c,c===m);hudEl.classList.toggle('m-pad',PAD.active);$('#padChip').hidden=!PAD.active;
    if(m!=='m-foot'){input.sprint=0;}if(JOY.id==null)joyReset();
    $('#padChip').textContent=m==='m-foot'?'Controller · RT hit/fire · A jump · X sprint · Y use · RB weapon · right stick camera':m==='m-fly'?'Controller · RT throttle up · LT throttle down · left stick fly · Y exit':'Controller · RT gas · LT brake · left stick steer · Y exit · X horn';}
  if(FOOT.on){const w=WPN[LIFE.cur];const t=(w.name.split(' ')[0]||'').toUpperCase().slice(0,6)+(w.gun?' '+(profile.inv.ammo[w.gun]||0):'');const b=$('#btnWpn');if(b.textContent!==t)b.textContent=t;}
}

/* ---------- physical controllers (Xbox, PlayStation, Backbone, Kishi) via the Gamepad API ---------- */
const PAD={active:false,prev:[],focus:-1,navT:0,wrote:false};
window.addEventListener('gamepadconnected',e=>{toast(`Controller connected · ${(e.gamepad.id||'gamepad').replace(/\(.*\)/,'').slice(0,28)}`,'good','pad',2500);});
window.addEventListener('gamepaddisconnected',()=>{padOff();toast('Controller disconnected · touch controls are back','', 'pad',2500);});
document.addEventListener('pointerdown',e=>{if(PAD.active&&e.pointerType!=='mouse')padOff();},true);
function padOff(){if(!PAD.active)return;PAD.active=false;if(PAD.wrote){input.jx=input.jy=0;input.gas=input.brake=input.atk=input.sprint=input.horn=0;Snd.hornOff();PAD.wrote=false;}document.querySelectorAll('.padfocus').forEach(x=>x.classList.remove('padfocus'));}
function padGet(){const gs=navigator.getGamepads?navigator.getGamepads():[];for(const g of gs)if(g&&g.connected)return g;return null;}
function padPoll(dt){
  const g=padGet();if(!g){if(PAD.active)padOff();return;}
  const B=i=>{const x=g.buttons[i];return !!x&&(x.pressed||x.value>.45);},BV=i=>{const x=g.buttons[i];return x?x.value:0;};
  const AX=i=>{const v=g.axes[i]||0;return Math.abs(v)<.16?0:(v-Math.sign(v)*.16)/.84;};
  if(!PAD.active){if(g.buttons.some(x=>x.pressed)||g.axes.some(v=>Math.abs(v)>.4)){PAD.active=true;toast('Controller active · touch the screen to go back to touch controls','good','pad',2500);}else{PAD.prev=g.buttons.map((_,i)=>B(i));return;}}
  const P1=i=>B(i)&&!PAD.prev[i];
  if(state==='play'){
    PAD.wrote=true;
    const lx=AX(0),ly=AX(1),rx=AX(2),ry=AX(3);
    input.jx=lx;input.jy=-ly;
    if(rx||ry){CAM.lookHeld=true;lookBy(rx*dt*340,ry*dt*200);}else CAM.lookHeld=false;
    const dpL=B(14),dpR=B(15);input.L=dpL?1:0;input.R=dpR?1:0;
    if(FOOT.on&&!FOOT.ride){
      input.atk=B(7)?1:0;if(P1(7)&&LIFE.atkT<=0)doAttack();
      if(B(6)&&WPN[LIFE.cur].gun)LIFE.aimT=Math.max(LIFE.aimT,.3);
      if(P1(0))input.jump=1;input.sprint=B(2)?1:0;
      if(P1(3)||P1(12))useContext();if(P1(5))cycleWeapon(false);if(P1(4))cycleWeapon(true);
      if(P1(1)&&INT.on){const c=interiorContext();if(c&&c.k==='exitb')leaveBuilding();}
      input.gas=0;input.brake=0;}
    else if(!FOOT.on){
      input.gas=BV(7)>.15?1:0;if(P1(6)||P1(0))brakeDown();if(!B(6)&&!B(0)&&input.brake){input.brake=0;P.brakeUp=performance.now();}
      if(P1(2)||P1(4)){input.horn=1;Snd.hornOn(VEH[P.type].horn);scareAnimals();}if((!B(2)&&!B(4))&&input.horn&&!FOOT.on){input.horn=0;Snd.hornOff();}
      if(P1(3))exitVehicle();}
    if(P1(9))pause();if(P1(8))$('#camBtn').click();
  }else padMenu(g,B,P1,AX,dt);
  PAD.prev=g.buttons.map((_,i)=>B(i));
}
/* menus: d-pad or stick moves a highlight, A presses, B backs out */
function padMenu(g,B,P1,AX,dt){
  const scr=[...document.querySelectorAll('.screen')].filter(s=>!s.hidden&&s.offsetParent!==null).pop();if(!scr)return;
  const list=[...scr.querySelectorAll('button')].filter(b=>!b.disabled&&b.offsetParent!==null);if(!list.length)return;
  PAD.navT-=dt;const v=AX(1)+(B(13)?1:0)-(B(12)?1:0)+AX(0)+(B(15)?1:0)-(B(14)?1:0);
  let f=list.indexOf(document.querySelector('.padfocus'));if(f<0){f=0;list[0].classList.add('padfocus');}
  if(Math.abs(v)>.5&&PAD.navT<=0){PAD.navT=.18;list[f].classList.remove('padfocus');f=(f+(v>0?1:list.length-1))%list.length;list[f].classList.add('padfocus');list[f].scrollIntoView({block:'nearest'});}
  if(Math.abs(v)<=.5)PAD.navT=0;
  if(P1(0)){const b=list[f];b.classList.remove('padfocus');b.click();}
  if(P1(1)||P1(9)){const back=list.find(b=>/close|resume|no$|back|done|leave|keep/i.test(b.id+' '+b.textContent));if(back){back.classList.remove('padfocus');back.click();}}
}
/* controller rumble mirrors the phone's vibration */
{const _play=Hap.play.bind(Hap);Hap.play=function(times,amps,force){_play(times,amps,force);if(!PAD.active)return;const g=padGet();const va=g&&g.vibrationActuator;if(!va||!va.playEffect)return;
  const dur=times.reduce((a,b)=>a+b,0),mx=Math.max(...amps)/255*this.scale();try{va.playEffect('dual-rumble',{duration:Math.min(600,dur||80),strongMagnitude:mx,weakMagnitude:mx*.6});}catch(_){}};}

/* ---------- per-frame driver ---------- */
{let last=performance.now();const tick=t=>{const dt=Math.min(.05,(t-last)/1000);last=t;try{padPoll(dt);ctlFrame();}catch(e){console.error(e);}requestAnimationFrame(tick);};requestAnimationFrame(tick);}
Object.assign(window.__oosht||{},{JOY,PAD,LOOK,lookBy,ctlFrame});
