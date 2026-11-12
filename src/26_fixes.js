/* ================= WISE CITY: bug-fix pass. Natural street dialogue, climbing onto BMTC buses,
   a HUD watchdog so controls never vanish, and spoken lines in the opening ================= */

/* ---------- natural dialogue: Kannada when the phone has a Kannada voice, otherwise everyday Bengaluru English ---------- */
/* each line: [Kannada, natural English, mood]; mood sets pace and pitch like a voice direction */
const MOOD={calm:[1,0],casual:[1.04,.02],excited:[1.12,.1],angry:[1.1,-.06],tired:[.88,-.04],stressed:[1.14,.04],warm:[.96,.04],shout:[1.08,.12]};
const LINES2={
  man:[['ಸ್ವಲ್ಪ ಅಡ್ಜಸ್ಟ್ ಮಾಡಿ','Swalpa adjust maadi, boss, just a little space.','casual'],['ಏನ್ ಗುರು, ಹೇಗಿದೀಯಾ?','Guru! Long time, how are you?','warm'],['ಊಟ ಆಯ್ತಾ?','Had lunch or not?','casual'],
    ['ಇವತ್ತು ಟ್ರಾಫಿಕ್ ತುಂಬಾ ಜಾಸ್ತಿ','This traffic, every single day... I tell you.','tired'],['ಮೆಟ್ರೋದಲ್ಲಿ ಹೋಗೋಣ','Let’s just take the metro, it’s faster.','casual'],
    ['ಕಾಫಿ ಕುಡಿಯೋಣ ಬಾ','Come, one strong filter coffee, then we’ll go.','warm'],['ಆಫೀಸ್‌ಗೆ ಲೇಟ್ ಆಯ್ತು','Already late for office. My manager will finish me.','stressed'],
    ['ಲೊಕೇಶನ್ ಕಳಿಸು, ಬರ್ತೀನಿ','Send me the location, I’ll be there in ten minutes.','casual'],['ಮ್ಯಾಚ್ ನೋಡಿದ್ಯಾ ನಿನ್ನೆ?','Did you watch the match last night? What a finish!','excited']],
  woman:[['ತರಕಾರಿ ಬೆಲೆ ತುಂಬಾ ಜಾಸ್ತಿ ಆಗಿದೆ','Tomatoes are eighty rupees now. Eighty!','tired'],['ಹೂವು ತಗೊಂಡು ಬನ್ನಿ','On the way back, get some jasmine, okay?','warm'],
    ['ಮನೆಗೆ ಬೇಗ ಹೋಗಬೇಕು','I have to get home early today.','stressed'],['ಮಳೆ ಬರೋ ಹಾಗಿದೆ','Looks like it’s going to rain again.','calm'],
    ['ಮಕ್ಕಳು ಸ್ಕೂಲಿಂದ ಬರ್ತಾರೆ','The kids will be back from school soon.','calm'],['ಹುಷಾರು, ಫುಟ್‌ಪಾತ್ ಒಡೆದಿದೆ','Careful, the footpath is broken here.','warm']],
  kid:[['ಅಮ್ಮ, ಐಸ್ ಕ್ರೀಮ್ ಬೇಕು','Amma, I want ice cream. Please?','excited'],['ಕ್ರಿಕೆಟ್ ಆಡೋಣ!','Come, come, let’s play cricket!','excited'],['ಔಟ್! ಔಟ್!','Out! That’s clean out!','shout'],['ನಾನೇ ಫಸ್ಟ್!','I’m first! I’m first!','excited']],
  elder:[['ಸ್ವಲ್ಪ ನಿಧಾನ ಮಗು','Slowly, child. What’s the hurry?','calm'],['ಈ ಕಾಲದಲ್ಲಿ ಯಾರೂ ಕೇಳಲ್ಲ','Nobody listens these days.','tired'],['ದೇವರೇ ಕಾಪಾಡು','God, please save us from this traffic.','tired'],['ನಮ್ಮ ಕಾಲದಲ್ಲಿ ಹೀಗಿರಲಿಲ್ಲ','In our time, Bangalore was full of trees.','calm']],
  vendor:[['ತರಕಾರಿ, ತರಕಾರಿ!','Fresh vegetables! Fresh vegetables!','shout'],['ಮಲ್ಲಿಗೆ ಹೂವು, ಮಲ್ಲಿಗೆ!','Mallige! Fresh mallige!','shout'],['ಬಿಸಿ ಬಿಸಿ ಮಸಾಲೆ ಪುರಿ!','Hot hot masala puri, come!','shout'],['ಎಳನೀರು, ಸಿಹಿ ಎಳನೀರು!','Tender coconut! Sweet tender coconut!','shout']],
  argue:[['ನೋಡ್ಕೊಂಡು ಓಡ್ಸಪ್ಪ!','Hey! Watch where you’re driving!','angry'],['ಕಣ್ಣು ಕಾಣಲ್ವಾ?','Can’t you see? Eyes are for what?','angry'],['ಯಾಕೆ ಹಾರ್ನ್ ಹೊಡಿತೀಯಾ?','Why are you honking like that? Where will I go?','angry'],
    ['ನಿಂಗೇನ್ ಪ್ರಾಬ್ಲಮ್?','What’s your problem, ah?','angry'],['ಹೊಡೀತೀನಿ ನೋಡು!','Say that again. Come, say it!','shout']],
  thief:[['ಕಳ್ಳ! ಕಳ್ಳ! ಹಿಡೀರಿ!','Thief! Thief! Somebody catch him!','shout'],['ನನ್ನ ಮೊಬೈಲ್! ಕಳ್ಳ!','My phone! He took my phone!','shout']],
  help:[['ಕಾಪಾಡಿ! ಕಾಪಾಡಿ!','Help! Somebody help!','shout'],['ಪೊಲೀಸ್! ಪೊಲೀಸ್!','Police! Call the police!','shout']]};
const SPOKE=new Map();
function speakLine(text,kn,pitch,rate){
  try{if(window.OoshtNative&&OoshtNative.speak){OoshtNative.speak(text,pitch,rate);return;}}catch(e){}
  try{if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(text);u.lang=kn?'kn-IN':'en-IN';u.pitch=clamp(pitch,.5,2);u.rate=rate;u.volume=.85;speechSynthesis.speak(u);}}catch(e){}}
say=function(set,who,force){
  if(!settings.sound)return;const now=performance.now();if(!force&&now-TTS.last<2500)return;
  const L=LINES2[set];if(!L)return;
  /* never repeat the same line within 90 seconds */
  const fresh=L.filter(l=>!(now-(SPOKE.get(l[1])||-1e9)<90000));const line=(fresh.length?fresh:L)[Math.floor(Math.random()*(fresh.length||L.length))];
  TTS.last=now;SPOKE.set(line[1],now);const kn=ttsLang()==='kn';const m=MOOD[line[2]]||MOOD.calm;
  const base={man:.9,woman:1.25,kid:1.6,elder:.78,vendor:1.0}[who]||1;const jit=(Math.random()-.5)*.12;
  speakLine(kn?line[0]:line[1],kn,base+m[1]+jit,(who==='elder'?.84:who==='kid'?1.1:1)*m[0]);};

/* Arjun speaks his lines in the opening */
{const _cs=cutSub;cutSub=function(who,txt){_cs(who,txt);if(txt&&settings.sound)speakLine(txt,false,.92,1.08);};}

/* ---------- climb onto a BMTC bus from its rear ladder, ride on the roof, climb down ---------- */
const ROOF={a:null,u:0,w:0,t:0};const ROOF_H=3.15;
function busAgentNear(){for(const a of agents){if(a.t.k!=='bus')continue;const fx=Math.sin(a.h),fy=-Math.cos(a.h);const dx=P.x-a.x,dy=P.y-a.y;const u=dx*fx+dy*fy,w=-dx*fy+dy*fx;
  if(u<-a.t.len/2-1.6||u>-a.t.len/2+1.2||Math.abs(w)>a.t.wid/2+.8)continue;if(a.v>2.2)continue;return a;}return null;}
function roofCtx(){if(!FOOT.on||FOOT.ride||INT.on)return null;
  if(ROOF.a)return {k:'item',it:{fn:roofDown},label:'Climb down'};
  const a=busAgentNear();return a?{k:'item',it:{fn:()=>roofUp(a)},label:'Climb onto the bus'}:null;}
function roofUp(a){ROOF.a=a;ROOF.u=-a.t.len/2+1;ROOF.w=0;ROOF.t=0;Snd.thud&&Snd.thud(.3);Hap.play&&Hap.play([0,40],[0,120],true);}
function roofDown(fall){const a=ROOF.a;ROOF.a=null;P.elev=0;if(!a)return;const fx=Math.sin(a.h),fy=-Math.cos(a.h);
  const sx=fall?Math.sign(ROOF.w||1):0;const bx=a.x+fx*(-a.t.len/2-1.2)+(-fy)*sx*0,by=a.y+fy*(-a.t.len/2-1.2);
  if(fall){const rx=Math.cos(a.h),ry=Math.sin(a.h);P.x=a.x+fx*ROOF.u+rx*(ROOF.w>=0?1:-1)*(a.t.wid/2+.9);P.y=a.y+fy*ROOF.u+ry*(ROOF.w>=0?1:-1)*(a.t.wid/2+.9);if(a.v>7)lfDamage(10,'crash');else Snd.thud&&Snd.thud(.5);}
  else{P.x=bx;P.y=by;}M4.model(P.M,P.x,0,P.y,-P.h,0,0);}
{const _uf=updateFoot;updateFoot=function(dt){
  if(!ROOF.a){_uf(dt);return;}
  const a=ROOF.a;if(!agents.includes(a)||!FOOT.on||FOOT.ride||INT.on||LIFE.dead){roofDown(true);_uf(dt);return;}
  const ox=P.x,oy=P.y;_uf(dt);const mx=P.x-ox,my=P.y-oy;
  const fx=Math.sin(a.h),fy=-Math.cos(a.h),rx=Math.cos(a.h),ry=Math.sin(a.h);
  ROOF.u+=mx*fx+my*fy;ROOF.w+=mx*rx+my*ry;ROOF.t+=dt;
  if(Math.abs(ROOF.u)>a.t.len/2+.25||Math.abs(ROOF.w)>a.t.wid/2+.25){roofDown(true);return;}
  P.x=a.x+fx*ROOF.u+rx*ROOF.w;P.y=a.y+fy*ROOF.u+ry*ROOF.w;P.elev=ROOF_H*Math.min(1,ROOF.t/.5);
  M4.model(P.M,P.x,LIFE.z+P.elev,P.y,-P.h,0,0);};}
{const _fc=findContext;findContext=function(){const c=roofCtx();if(c)return c;return _fc();};}

/* ---------- HUD watchdog: the on-screen controls can never stay hidden by a stale state ---------- */
setInterval(()=>{if(state!=='play'||(typeof CUT!=='undefined'&&CUT.on))return;const h=$('#hud');if(!h)return;
  if(h.hidden)h.hidden=false;if(h.classList.contains('cut'))h.classList.remove('cut');
  if(PAD.active){try{const g=padGet();if(!g||g.mapping!=='standard')padOff();}catch(e){}}
  const want=METRO.ride||(FOOT.on&&FOOT.ride&&FOOT.ride.phase==='ride')?'m-ride':FLY.on?'m-fly':FOOT.on?'m-foot':'m-drive';
  if(!h.classList.contains(want)){for(const c of['m-ride','m-fly','m-foot','m-drive'])h.classList.toggle(c,c===want);}
  for(const sel of['#joyZone','.ctl-right','.ctl-foot','.ctl-act','.ctl-left']){const e=h.querySelector(sel);if(e&&e.style.display==='none')e.style.display='';}},700);

Object.assign(window.__oosht||{},{ROOF,roofUp,roofDown,busAgentNear,LINES2,say:(a,b,c)=>say(a,b,c),findContext:()=>findContext()});

/* ---------- a car hitting a biker: the rider falls on the spot, the bike tips over, the car keeps going ---------- */
function knockBiker(a,nx,ny){
  a.fallen=true;a.fallenT=25;a.v=0;a.stop=99;a.lean=1.35*(Math.random()<.5?-1:1);
  try{const p=ejectDriver(a);}catch(e){}
  const rel=Math.abs(P.s);P.s*=.78;CAM.shake=Math.max(CAM.shake,4);try{SFX.metal(.6);SFX.ped(.8);scream('man');say('hurt','man',true);}catch(e){}Hap.crash&&Hap.crash();damage(2,true);
  try{bloodBurst(a.x,a.y,.8);}catch(e){}
  toast('Knocked a biker off!','bad','biker',1500);
  try{crime('assault',1);}catch(e){}}
{const _ua=updateAgents;updateAgents=function(dt){_ua(dt);for(const a of agents)if(a.fallen)a.lean=a.lean>0?1.35:-1.35;};}

/* ---------- clean HUD: fewer panels, health ring on the minimap, idle ghosting, single-line hints ---------- */
{const st=document.createElement('style');st.textContent=`
#hud .hud-tl .cond{display:none}#hud .hud-tl .cond.show{display:block}
#hud .hud-tl{min-width:0;padding:8px 12px;gap:4px}
#wanted .t,#wanted .rash{display:none!important}#wanted{padding:6px 10px}
#hud .trip.gone{display:none}
#hud .ctl-left,#hud .ctl-right,#hud .ctl-act,#hud .ctl-foot,#hud #joyZone,#hud .hud-tc,#hud #footBar,#hud .trip,#hud .hud-tl,#hud .btncol{transition:opacity .45s ease}
#hud.idle .ctl-left,#hud.idle .ctl-right,#hud.idle .ctl-act,#hud.idle .ctl-foot{opacity:calc(var(--bo,1)*.42)!important}
#hud.idle #joyZone,#hud.idle .hud-tc,#hud.idle .trip,#hud.idle .btncol{opacity:.4}
#hud.idle .hud-tl{opacity:.75}
#hud.moving #footBar{opacity:0;pointer-events:none}
#hud .notice{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(70vw,560px);font-size:13px;padding:6px 14px;transition:opacity .5s}
#hud .notice.faded{opacity:0;pointer-events:none}`;document.head.appendChild(st);}
const HUDI={last:performance.now(),still:0};
const hudWake=()=>{HUDI.last=performance.now();$('#hud').classList.remove('idle');};
document.addEventListener("pointerdown",hudWake,true);document.addEventListener("keydown",hudWake,true);
setInterval(()=>{const hud=$('#hud');if(!hud||state!=='play')return;
  const busy=COP.level>0||COP.list.length||input.atk||(typeof CUT!=='undefined'&&(CUT.on||(CUT.grace&&GT<CUT.grace)))||(typeof TUT!=='undefined'&&TUT.el&&TUT.el.style.opacity==='1');
  hud.classList.toggle('idle',!busy&&performance.now()-HUDI.last>3000);
  /* condition / stamina and fuel rows only appear when they matter; health lives on the minimap ring */
  const rows=hud.querySelectorAll('.hud-tl .cond');if(rows.length>=3){
    rows[0].classList.toggle('show',FOOT.on?FOOT.stam<maxStam()*.6:P.cond<60);
    rows[1].classList.toggle('show',!FOOT.on&&P.fuel<30);rows[2].classList.remove('show');}
  HUDI.still=FOOT.on&&P.s<.4?HUDI.still+.25:0;hud.classList.toggle('moving',FOOT.on&&HUDI.still<1.2);
  const tr=$('#trip');if(tr)tr.classList.toggle('gone',/Finding a passenger/.test(tr.textContent)||!tr.textContent.trim());},250);
/* one-line notices fade out 4 seconds after they change */
{const n=$('#notice');if(n){let tm=0;new MutationObserver(()=>{n.classList.remove('faded');clearTimeout(tm);tm=setTimeout(()=>n.classList.add('faded'),4000);}).observe(n,{childList:true,characterData:true,subtree:true});}}
/* health and armour as rings around the minimap */
{const _rm=renderMini;renderMini=function(){_rm();try{const m=mctx,S=mini.width,c=S/2,r=S/2-5;m.setTransform(1,0,0,1,0,0);m.lineCap='round';
  m.lineWidth=7;m.strokeStyle='rgba(10,12,18,.85)';m.beginPath();m.arc(c,c,r,0,TAU);m.stroke();
  const hp=clamp(LIFE.hp/100,0,1);m.strokeStyle=hp>.35?'#43D17A':'#E53935';m.beginPath();m.arc(c,c,r,Math.PI*.75,Math.PI*.75+Math.PI*1.5*hp);m.stroke();
  const ar=clamp(profile.armor/200,0,1);if(ar>0){m.strokeStyle='#4FA3FF';m.beginPath();m.arc(c,c,r,Math.PI*.25-Math.PI*.5*ar,Math.PI*.25);m.stroke();}}catch(e){}};}
Object.assign(window.__oosht||{},{knockBiker});

/* ---------- distinct impact sounds: walls, vehicles, trees, poles, people, animals ---------- */
const SFX={kind:null,
  rnd:(a,b)=>a+Math.random()*(b-a),
  wall(k){const r=this.rnd;Snd.burst(.32,r(60,85),1,.9*k+.2);Snd.burst(.45,r(1500,2200),.5,.28*k,'bandpass');setTimeout(()=>Snd.burst(.3,r(3500,5000),.8,.1*k,'highpass'),70);},
  metal(k){const r=this.rnd;Snd.burst(.5,r(380,620),.7,.6*k+.15,'lowpass');Snd.tone([r(170,210),r(260,300),r(410,460)],.55,'square',.035*k+.01,.7);
    if(k>.5)for(let i=0;i<5;i++)setTimeout(()=>Snd.tone([r(2600,4400)],.05,'sine',.035),90+i*r(30,70));},
  heavy(k){const r=this.rnd;Snd.burst(.8,r(55,75),1,1);Snd.tone([r(90,110),r(140,160)],.9,'sawtooth',.05,.6);Snd.burst(.6,r(700,900),.6,.35,'lowpass');},
  tree(k){const r=this.rnd;Snd.burst(.14,r(220,300),3,.6*k+.2,'bandpass');Snd.tone([r(100,130)],.25,'triangle',.15,.5);Snd.burst(.7,r(4500,6000),.3,.12,'highpass');},
  pole(k){const r=this.rnd;Snd.tone([r(590,650),r(900,960)],1.1,'sine',.07,.97);Snd.burst(.18,r(280,340),1,.45);},
  ped(k){const r=this.rnd;Snd.burst(.12,r(160,210),1.5,.55,'lowpass');Snd.tone([r(80,100)],.16,'sine',.25,.5);},
  cow(k){Snd.burst(.25,90,1,.7);Snd.moo&&Snd.moo();},
  boom(k){Snd.burst(1.2,60,1,1);Snd.burst(.9,500,.5,.5,'lowpass');Snd.burst(1.4,3000,.4,.25,'highpass');}};
const _sndCrash=Snd.crash.bind(Snd);
Snd.crash=function(){const w=SFX.kind||'';SFX.kind=null;const k=SFX.k==null?.8:SFX.k;SFX.k=null;
  try{if(/wall|building/i.test(w))return SFX.wall(k);if(/tree/i.test(w))return SFX.tree(k);if(/pole|lamp|signal/i.test(w))return SFX.pole(k);
    if(/cow/i.test(w))return SFX.cow(k);if(/ped/.test(w))return SFX.ped(k);if(/bus|truck|lorry|tanker/i.test(w))return SFX.heavy(k);
    if(/car|auto|taxi|suv|two-wheeler|hoysala|vehicle/i.test(w))return SFX.metal(k);if(/boom/.test(w))return SFX.boom(k);}catch(e){}
  _sndCrash();};
{const _cr=crash;crash=function(rel,what,ra){SFX.kind=typeof what==='string'?what:'';SFX.k=clamp(rel/12,.25,1);_cr(rel,what,ra);};}
{const _hp=hitPed;hitPed=function(p){SFX.kind='ped';SFX.k=clamp(Math.abs(P.s)/12,.3,1);_hp(p);if(!FOOT.on&&Math.abs(P.s)>2)say('hurt',whoOf(p),true);};}
LINES2.hurt=[['ಅಯ್ಯೋ ಅಮ್ಮಾ!','Aaah! Ayyo amma!','shout'],['ಅಯ್ಯಯ್ಯೋ!','Ayyayyo! My leg!','shout'],['ಕಾಪಾಡಿ!','Aaargh! Help!','shout']];
LINES2.fear=[['ಅಯ್ಯೋ! ನೋಡ್ಕೊಂಡು ಓಡ್ಸು!','Ayyo! Watch out!','shout'],['ನಿಧಾನ! ನಿಧಾನ!','Slow down! Slow down!','shout'],['ತಲೆ ಕೆಟ್ಟಿದ್ಯಾ? ಸಾಯಿಸ್ತೀಯಾ!','Are you mad? You’ll kill someone!','shout'],
  ['ಓಡಿ! ಓಡಿ!','Run! Run!','shout'],['ಏಯ್ ಏಯ್ ಏಯ್!','Hey hey hey! Stop!','shout'],['ಅಮ್ಮಾ!','Amma!','shout']];
/* a short synthesised scream so fear reads instantly, even before the voice speaks */
function scream(who){const c=Snd.ctx;if(!c||!settings.sound)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();o.type='sawtooth';
  const b={woman:820,kid:1000,elder:520,man:430}[who]||600;o.frequency.setValueAtTime(b,t);o.frequency.linearRampToValueAtTime(b*1.35,t+.12);o.frequency.exponentialRampToValueAtTime(b*.8,t+.5);
  f.type='bandpass';f.frequency.value=b*2.2;f.Q.value=2;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06,t+.04);g.gain.linearRampToValueAtTime(0,t+.5);o.connect(f);f.connect(g);g.connect(Snd.master);o.start(t);o.stop(t+.55);}

/* ---------- people panic when a vehicle bears down on them ---------- */
const FEAR={t:0,shoutT:0};
{const _lu3=lifeUpdate;lifeUpdate=function(dt){_lu3(dt);if(state!=='play'||FOOT.on||FLY.on)return;FEAR.t-=dt;FEAR.shoutT-=dt;if(FEAR.t>0)return;FEAR.t=.2;
  const sp=Math.abs(P.s);if(sp<4)return;const reach=6+sp*.9;let shouted=false;
  for(const p of peds){if(p.dead||p.mis||p.state==='down'||p.state==='flee'||p.state==='hostile'||p.state==='brawl')continue;
    const d=Math.hypot(p.x-P.x,p.y-P.y);if(d>reach)continue;if(!inFront(P.x,P.y,P.h,p.x,p.y,reach,3.8))continue;
    try{setFlee(p,P.x,P.y);}catch(e){continue;}p.fear=1;
    if(!shouted&&FEAR.shoutT<=0){shouted=true;FEAR.shoutT=1.6+Math.random()*1.2;const w=whoOf(p);scream(w);say('fear',w,true);}}};}

/* ---------- never stuck on foot: if Tony is pushing the stick but cannot move, step to the nearest free spot ---------- */
function footFree(x,y){if(inBuilding(x,y))return false;const q=[];gQuery(W.tG,x,y,2.5,q);for(const t of q){if(t.pole&&PDOWN.has(t.pole.key))continue;if(Math.hypot(t.x-x,t.y-y)<(t.r||.3)+.35)return false;}
  if(typeof pierAt==='function'&&pierAt(x,y))return false;
  const box=(cx,cy,h,len,wid)=>{const fx=Math.sin(h),fy=-Math.cos(h),dx=x-cx,dy=y-cy;return Math.abs(dx*fx+dy*fy)<len/2+.4&&Math.abs(-dx*fy+dy*fx)<wid/2+.4;};
  for(const a of agents)if(box(a.x,a.y,a.h,a.t.len,a.t.wid))return false;const pk=FOOT.parked;if(pk){const pm=playerModel(pk.type);if(box(pk.x,pk.y,pk.h,pm.len||2,pm.wid||1))return false;}return true;}
function unstick(){for(let r=.6;r<=8.2;r+=.4)for(let i=0;i<16;i++){const a=i/16*TAU+r;const x=P.x+Math.cos(a)*r,y=P.y+Math.sin(a)*r;if(footFree(x,y)){P.x=x;P.y=y;M4.model(P.M,P.x,0,P.y,-P.h,0,0);return true;}}return false;}
const STK={x:0,y:0,t:0};
{const _uf2=updateFoot;updateFoot=function(dt){_uf2(dt);
  if(!FOOT.on||FOOT.ride||INT.on||ROOF.a||LIFE.downT>0||METRO.ride||(P.elev||0)>.5){STK.t=0;return;}
  const push=Math.hypot(input.jx||0,input.jy||0)>.3;if(!push){STK.t=0;STK.x=P.x;STK.y=P.y;return;}
  if(STK.t===0){STK.x=P.x;STK.y=P.y;}STK.t+=dt;
  if(STK.t>.8){const net=Math.hypot(P.x-STK.x,P.y-STK.y);STK.t=0;if(net<.35)unstick();}};}
/* when a crash throws Tony off, land him on open ground, never inside a tree, pole or vehicle */
{const _cr2=crash;crash=function(rel,what,ra){const was=FOOT.on;_cr2(rel,what,ra);if(!was&&FOOT.on&&!footFree(P.x,P.y))unstick();};}
Object.assign(window.__oosht||{},{SFX,unstick,footFree,FEAR,scream});

/* ---------- Pause > Get unstuck: always returns Tony (or the vehicle) to open road ---------- */
function getUnstuck(){try{joyReset();}catch(e){}input.jx=input.jy=0;input.gas=input.brake=0;LIFE.downT=0;
  if(ROOF.a)roofDown(false);P.elev=0;
  const n=nearestSeg(P.x,P.y,200,s=>!s.w.br);if(n.seg){const s=n.seg,dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;const t=clamp((P.x-s.ax)*dx+(P.y-s.ay)*dy,1,Math.max(1,s.len-1));
    if(FOOT.on){P.x=s.ax+dx*t+dy*(s.w.hw*.8);P.y=s.ay+dy*t-dx*(s.w.hw*.8);if(!footFree(P.x,P.y))unstick();}
    else{P.x=s.ax+dx*t;P.y=s.ay+dy*t;P.h=hAng(dx,dy);P.s=0;P.vx=P.vy=0;}}
  else if(FOOT.on)unstick();
  M4.model(P.M,P.x,0,P.y,-P.h,0,0);toast('Back on the road','good');}
$('#unstuckBtn').addEventListener('click',()=>{$('#resumeBtn').click();setTimeout(getUnstuck,60);});
Object.assign(window.__oosht||{},{getUnstuck});
