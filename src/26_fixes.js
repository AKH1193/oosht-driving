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
  const rel=Math.abs(P.s);P.s*=.78;CAM.shake=Math.max(CAM.shake,4);Snd.thud&&Snd.thud(.7);Hap.crash&&Hap.crash();damage(2,true);
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
  const busy=COP.level>0||COP.list.length||input.atk||(typeof CUT!=='undefined'&&CUT.on);
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
