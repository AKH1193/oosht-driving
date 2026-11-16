/* ================= WISE CITY: street barks. Every spoken line also shows as a one-line subtitle with a coloured speaker label.
   New pools: drivers thrown out of their vehicles, Hoysala megaphone warnings, drivers fed up with honking ================= */
LINES2.hijack=[['ಅಯ್ಯೋ! ನನ್ನ ಗಾಡಿ!','Ayyo! My vehicle! Leave it!','shout'],['ಏಯ್! ಇಳಿ ಕೆಳಗೆ!','Hey! Get out of my vehicle!','angry'],['ದಯವಿಟ್ಟು ಏನೂ ಮಾಡ್ಬೇಡಿ!','Please, don’t hurt me! Take it, take it!','shout'],
  ['ಕಳ್ಳ! ಗಾಡಿ ಕದೀತಿದಾನೆ!','Thief! He’s stealing my vehicle!','shout'],['ಇದಕ್ಕೆ ಇನ್ನೂ ಇಎಂಐ ಕಟ್ತಿದೀನಿ!','I’m still paying EMI on that!','shout'],['ಪೊಲೀಸ್! ನನ್ನ ಗಾಡಿ ತಗೊಂಡು ಹೋಗ್ತಿದಾನೆ!','Police! He’s taking my vehicle!','shout']];
LINES2.police=[['ಗಾಡಿ ಸೈಡಿಗೆ ಹಾಕಿ!','Hoysala here. Pull over to the left, now!','angry'],['ಗಾಡಿ ನಿಲ್ಲಿಸಿ! ಇದು ಕೊನೆ ವಾರ್ನಿಂಗ್!','Stop the vehicle! This is your last warning!','shout'],
  ['ಇಂಜಿನ್ ಆಫ್ ಮಾಡಿ, ಕೆಳಗೆ ಇಳೀರಿ!','Switch off the engine and step out!','angry'],['ಎಲ್ಲಿಗೆ ಓಡ್ತೀಯಾ? ನಿಲ್ಲು!','Where will you run? Stop right there!','shout'],
  ['ಕಂಟ್ರೋಲ್ ರೂಮ್, ಬ್ಯಾಕಪ್ ಕಳಿಸಿ!','Control room, suspect is running. Send backup!','stressed'],['ತಪ್ಪಿಸ್ಕೊಳ್ಳೋಕೆ ಆಗಲ್ಲ, ನಿಲ್ಲಿಸು!','You cannot escape. Stop the vehicle!','angry']];
LINES2.honk=[['ಹಾರ್ನ್ ಹೊಡೆದ್ರೆ ಸಿಗ್ನಲ್ ಬದಲಾಗುತ್ತಾ?','Will honking turn the signal green, ah?','angry'],['ಎಲ್ಲಿ ಹೋಗ್ಲಿ? ಹಾರಿ ಹೋಗ್ಲಾ?','Where do I go? Should I fly?','angry'],
  ['ಸ್ವಲ್ಪ ತಾಳ್ಮೆ ಇರಲಿ ಗುರು!','Have some patience, guru!','tired'],['ಹಾರ್ನ್ ಮೇಲೆ ಮಲಗಿದ್ಯಾ?','Did you fall asleep on the horn?','angry'],['ನಿನ್ನ ಅಪ್ಪನ ರೋಡಾ ಇದು?','Is this your father’s road?','angry']];
const BARK={el:null,t:0,pol:6,honk:0};
const BARKWHO={man:'Passerby',woman:'Passerby',kid:'Kid',elder:'Elder',vendor:'Vendor'};
const BARKSET={argue:'Angry man',thief:'Victim',help:'Bystander',fear:'Pedestrian',hurt:'Pedestrian',hijack:'Driver',police:'Hoysala',honk:'Driver'};
function barkUI(){if(BARK.el)return BARK.el;const e=document.createElement('div');e.id='bark';e.hidden=true;
  const st=document.createElement('style');st.textContent=`#bark{position:absolute;left:50%;bottom:calc(26px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:min(46vw,520px);padding:6px 14px;border-radius:10px;background:rgba(8,10,14,.62);color:#fff;font-size:14px;line-height:1.3;text-align:center;pointer-events:none;z-index:5;text-shadow:0 1px 2px #000}
#bark b{font-family:WCHud,system-ui,sans-serif;font-weight:600;color:#FFD166;letter-spacing:.04em;margin-right:6px;text-transform:uppercase;font-size:12px}
#hud.cut #bark{display:none}`;document.head.appendChild(st);($('#hud')||document.body).appendChild(e);BARK.el=e;return e;}
function barkShow(who,text){const e=barkUI();e.innerHTML='';const b=document.createElement('b');b.textContent=who+':';e.appendChild(b);e.appendChild(document.createTextNode(text));e.hidden=false;clearTimeout(BARK.t);BARK.t=setTimeout(()=>{e.hidden=true;},1900+text.length*45);}
say=function(set,who,force){
  const now=performance.now();if(now-TTS.last<(force?900:4500))return;
  const L=LINES2[set];if(!L)return;
  const fresh=L.filter(l=>!(now-(SPOKE.get(l[1])||-1e9)<90000));const line=(fresh.length?fresh:L)[Math.floor(Math.random()*(fresh.length||L.length))];
  TTS.last=now;SPOKE.set(line[1],now);
  if(state==='play')barkShow(BARKSET[set]||BARKWHO[who]||'Passerby',line[1]);
  if(!settings.sound)return;const kn=ttsLang()==='kn';const m=MOOD[line[2]]||MOOD.calm;
  const base=set==='police'?.8:({man:.9,woman:1.25,kid:1.6,elder:.78,vendor:1.0}[who]||1);const jit=(Math.random()-.5)*.12;
  if(set==='police'&&Snd.burst)Snd.burst(.06,1900,2,.12,'bandpass');
  speakLine(kn?line[0]:line[1],kn,base+m[1]+jit,(who==='elder'?.84:who==='kid'?1.1:1)*m[0]);};
/* thrown out of the vehicle */
{const _ejB=ejectDriver;ejectDriver=function(a){const r=_ejB(a);try{if(!(a.t&&a.t.two))say('hijack',Math.random()<.3?'woman':'man',true);}catch(e){}return r;};}
/* Hoysala megaphone during a chase; drivers answer back when honked at in a jam */
{const _luB=lifeUpdate;lifeUpdate=function(dt){_luB(dt);try{if(state!=='play'||(typeof CUT!=='undefined'&&CUT.on))return;
  if(COP.list.length){if((BARK.pol-=dt)<=0){BARK.pol=9+Math.random()*7;if(COP.list.some(c=>Math.hypot(c.x-P.x,c.y-P.y)<40))say('police','man',true);}}else BARK.pol=Math.min(BARK.pol,5);
  BARK.honk-=dt;if(!FOOT.on&&input.horn&&Math.abs(P.s)<3&&BARK.honk<=0&&!(typeof HYD!=='undefined'&&HYD.on)){const fx=Math.sin(P.h),fy=-Math.cos(P.h);
    if(agents.some(a=>{const dx=a.x-P.x,dy=a.y-P.y,u=dx*fx+dy*fy;return u>1&&u<11&&Math.abs(dx*fy-dy*fx)<2.2&&(a.v||0)<2;})){BARK.honk=7;say('honk','man',true);}}}catch(e){}};}
Object.assign(window.__oosht||{},{BARK,barkShow});
