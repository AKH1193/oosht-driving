/* ================= WISE CITY: natural-looking people, voices, street crime, road rage, armed goons, looting ================= */
/* facial hair and hair styles, set once per look */
PED_LOOKS.forEach((l,i)=>{const fem=!!(l.saree||l.frock||(l.kurta&&l.kind==='office'));l.female=fem;if(!fem&&l.kind!=='kid'){l.mous=i%3!==1;l.beard=i%4===2;}if(fem)l.longHair=true;});
const UNDIES={kind:'walk',shirt:'#EEEDE6',pants:'#2B3A8C',vest:true,brief:true};

/* rounded body: capsule limbs with knees and elbows, shaped torso, a face with eyes, brows, nose and lips */
function humanGeo(mb,look,sk,o){
  o=o||{};const hair=look.grey?[.78,.78,.76]:[.07,.06,.06];const fem=!!look.female;
  const top=hexRGB(look.shirt||look.kurta||look.blouse||'#888');const pc=hexRGB(look.pants||look.saree||'#333');
  const shoe=look.kind==='run'?[.92,.92,.94]:look.brief?sk:[.12,.1,.09];const skD=sk.map(v=>v*.86);
  const full=look.kind==='office'||look.kurta||look.saree||look.kind==='elder';
  const leg=q=>{const a=q<0?(o.lL||0):(o.lR||0),k=q<0?(o.kL||0):(o.kR||0);
    mb.save().tr(q*.095,.9,0).rotX(a);const th=look.brief?sk:pc,sh=look.shorts||look.brief?sk:pc;
    mb.cyl(0,-.22,0,.078,.44,'y',8,th);mb.blob(0,-.44,0,.066,.07,.072,sh);
    mb.save().tr(0,-.44,0).rotX(-k);mb.cyl(0,-.21,0,.058,.42,'y',8,sh);mb.blob(0,-.43,-.05,.058,.045,.13,shoe);mb.restore();mb.restore();};
  if(look.saree){const sw=(o.lR||0);mb.tbox(0,.04,0,.46,.36,.34,.26,.9,pc);for(const q of[-1,1])mb.blob(q*.08,.04,q*sw*.14-.04,.055,.04,.12,[.15,.1,.08]);}
  else if(look.frock){leg(-1);leg(1);mb.tbox(0,.5,0,.5,.38,.3,.22,.45,top);}
  else{leg(-1);leg(1);if(look.dhoti)mb.tbox(0,.18,0,.44,.32,.36,.26,.74,pc);}
  mb.save().tr(0,.9,0).rotX(-(o.bend||0));
  mb.blob(0,.03,0,.17,.1,.115,look.brief?pc:look.saree?pc:pc);
  if(!look.brief||look.vest)mb.tbox(0,.02,0,.31,.2,.34,.21,.3,top);else mb.tbox(0,.02,0,.31,.2,.34,.21,.3,sk);
  mb.blob(0,.35,0,.19,.16,.125,look.brief&&!look.vest?sk:top);if(fem&&look.kind!=='kid')mb.blob(0,.33,-.07,.13,.06,.05,top);
  mb.blob(0,.45,0,.21,.065,.105,look.vest?sk:top);
  if(look.vest)mb.blob(0,.4,-.02,.12,.06,.1,sk);
  if(look.kurta&&!look.frock)mb.tbox(0,-.24,0,.36,.25,.33,.22,.3,top);
  if(look.saree){mb.save().tr(.02,.24,-.118).rotZ(-.5);mb.box(0,0,0,.14,.52,.015,pc);mb.restore();}
  if(look.kind==='office'&&!fem)mb.box(0,.29,-.128,.035,.28,.01,[.45,.08,.12]);
  for(const q of[-1,1]){const a=q<0?(o.aL||0):(o.aR||0),e=q<0?(o.eL??.22):(o.eR??.22);
    mb.save().tr(q*.235,.44,0).rotX(a);mb.blob(0,0,0,.068,.068,.068,look.vest?sk:top);
    const sl=full&&!look.vest;mb.cyl(0,-.14,0,.05,.28,'y',8,sl?top:sk);if(!sl&&!look.vest)mb.cyl(0,-.06,0,.058,.12,'y',8,top);
    mb.save().tr(0,-.28,0).rotX(e);mb.blob(0,0,0,.045,.045,.045,sl?top:sk);mb.cyl(0,-.13,0,.043,.26,'y',8,sl?top:sk);mb.blob(0,-.28,0,.044,.06,.032,sk);
    if(q>0&&o.wk){mb.save().tr(0,.27,0);weaponGeo(mb,o.wk);mb.restore();}
    if(q<0&&o.plate){mb.cyl(0,-.3,-.12,.13,.02,'y',14,[.85,.86,.88]);mb.blob(0,-.27,-.12,.08,.03,.08,o.plate);}
    mb.restore();mb.restore();}
  /* neck and head */
  mb.cyl(0,.535,0,.048,.1,'y',8,sk);
  mb.blob(0,.7,0,.102,.125,.112,sk);mb.blob(0,.635,-.025,.078,.058,.075,sk);
  for(const q of[-1,1]){mb.blob(q*.103,.695,.005,.018,.034,.024,skD);
    mb.blob(q*.04,.712,-.098,.022,.012,.008,[.95,.94,.92]);mb.blob(q*.041,.712,-.104,.011,.011,.005,[.07,.05,.04]);
    mb.box(q*.04,.738,-.101,.042,.009,.008,look.grey?[.6,.6,.6]:[.1,.08,.07]);}
  mb.blob(0,.685,-.112,.016,.026,.02,skD);mb.box(0,.652,-.1,.042,.011,.01,fem?[.6,.16,.2]:[.36,.2,.18]);
  if(look.mous)mb.box(0,.667,-.104,.054,.013,.01,hair);
  if(look.beard)mb.blob(0,.625,-.035,.085,.06,.08,hair);
  if(look.grey&&look.dhoti&&!fem){mb.blob(0,.71,.05,.1,.06,.08,hair);}
  else{mb.blob(0,.765,.008,.111,.072,.122,hair);mb.blob(0,.72,.045,.108,.085,.088,hair);}
  if(fem&&look.longHair){mb.blob(0,.6,.075,.1,.16,.055,hair);if(look.saree)mb.blob(0,.71,.115,.055,.055,.045,hair);}
  if(look.saree)mb.blob(0,.735,-.108,.009,.009,.004,[.8,.05,.1]);
  if(look.cap)mb.box(0,.8,-.03,.245,.055,.29,hexRGB(look.cap));
  if(look.backpack)mb.box(0,.24,.17,.3,.36,.14,hexRGB(look.backpack));
  mb.restore();
  if(look.bag&&!o.noBag){mb.box(.27,.82,0,.08,.26,.32,hexRGB(look.bag));limb(mb,[.27,.95,0],[-.12,1.35,0],.025,hexRGB(look.bag));}
  if(look.stick)limb(mb,[.3,1.0,-.12],[.34,0,-.25],.035,[.45,.32,.2]);
}
/* every pedestrian and the player now use the same rounded figure */
function humanPed(look,pose,skin,run){const sw=(pose?1:-1)*(run?.7:.35);const mb=new MB();
  humanGeo(mb,look,skin||SKINS[0],{lL:-sw,lR:sw,kL:run&&!pose?.9:.15,kR:run&&pose?.9:.15,aL:sw*.9,aR:-sw*.9,eL:.3,eR:.3,bend:look.kind==='elder'?.18:run?.22:0});return mb.mesh();}
function humanRig(look,sk,pn,wk){const o=Object.assign({},rigPose(pn),{wk});const mb=new MB();humanGeo(mb,look,sk,o);return mb.mesh();}
/* the old blocky figures are replaced everywhere: street crowds, the player, police, people indoors */
buildPed=humanPed;
const _rigPose=rigPose;
rigPose=function(n){switch(n){
  case 'eatS0':return{lL:.05,lR:-.05,aL:.9,eL:1.2,aR:1.9,eR:1.9,plate:[.85,.6,.25]};case 'eatS1':return{lL:.05,lR:-.05,aL:.9,eL:1.2,aR:1.2,eR:1.0,plate:[.85,.6,.25]};
  case 'eatT0':return{lL:1.45,lR:1.45,kL:1.5,kR:1.5,aL:.9,eL:.9,aR:1.7,eR:2.0,bend:.12};case 'eatT1':return{lL:1.45,lR:1.45,kL:1.5,kR:1.5,aL:.9,eL:.9,aR:1.1,eR:1.0,bend:.08};
  case 'seat':return{lL:1.45,lR:1.45,kL:1.5,kR:1.5,aL:.7,aR:.7,eL:.6,eR:.6};
  default:return _rigPose(n);}};
let LOOKN=0;const HRIGS=new Map();
rig=function(look,sk,pn,wk){
  if(look._id==null&&look!==PLOOK)look._id=LOOKN++;const id=look===PLOOK?'P'+look.shirt+look.pants:look._id;
  const key=id+'|'+(SKINS.indexOf(sk))+'|'+pn+'|'+(wk||'');let m=HRIGS.get(key);if(m)return m;
  if(HRIGS.size>600){for(const v of HRIGS.values())freeMesh(v);HRIGS.clear();}
  m=humanRig(look,sk,pn,wk);HRIGS.set(key,m);return m;};
function pedLook(p){return p.strip?UNDIES:PED_LOOKS[p.v%PED_LOOKS.length]||PED_LOOKS[0];}
function pedRig(p){
  const look=pedLook(p),sk=SKINS[(p.v||0)%SKINS.length];
  if(p.state==='down'){M4.model(TM,p.x,.15,p.y,-p.fall,-Math.PI/2,0,p.sc||1);drawLit(rig(look,sk,'pose'),TM,PEDLIT);return;}
  const pn=p.rp||(p.state==='flee'||p.state==='walk'||p.state==='cross'?(p.run?(p.pose?'run1':'run0'):(p.pose?'walk1':'walk0')):'pose');
  M4.model(TM,p.x,0,p.y,-p.h,0,0,p.sc||1);drawLit(rig(look,sk,pn,p.rw||null),TM,PEDLIT);
  if(p.culprit&&!p.caught){const b=2.35+Math.sin(GT*5)*.08;DGr.bill(p.x,b,p.y,.45,[1,.15,.1],CAM.right);}
}

/* ---------- voices: people say everyday things in Kannada (Kanglish where no Kannada voice) ---------- */
const LINES={
  man:[['ಸ್ವಲ್ಪ ಅಡ್ಜಸ್ಟ್ ಮಾಡಿ','Swalpa adjust maadi'],['ಏನ್ ಗುರು, ಹೇಗಿದೀಯಾ?','Yen guru, hegidiya?'],['ಊಟ ಆಯ್ತಾ?','Oota aaytha?'],['ಇವತ್ತು ಟ್ರಾಫಿಕ್ ತುಂಬಾ ಜಾಸ್ತಿ','Ivattu traffic thumba jaasti'],['ಮೆಟ್ರೋದಲ್ಲಿ ಹೋಗೋಣ','Metro alli hogona'],['ಮೀಟರ್ ಹಾಕಿ ಸಾರ್','Meter haaki saar'],['ಕಾಫಿ ಕುಡಿಯೋಣ ಬಾ','Coffee kudiyona baa'],['ಆಫೀಸ್‌ಗೆ ಲೇಟ್ ಆಯ್ತು','Office ge late aaytu'],['ಸಕ್ಕತ್ತಾಗಿದೆ ಮಗಾ','Sakkattagide maga'],['ಮ್ಯಾಚ್ ನೋಡಿದ್ಯಾ ನಿನ್ನೆ?','Match nodidya ninne?']],
  woman:[['ತರಕಾರಿ ಬೆಲೆ ತುಂಬಾ ಜಾಸ್ತಿ ಆಗಿದೆ','Tarakari bele thumba jaasti aagide'],['ಹೂವು ತಗೊಂಡು ಬನ್ನಿ','Hoovu tagondu banni'],['ಮನೆಗೆ ಬೇಗ ಹೋಗಬೇಕು','Manege bega hogabeku'],['ಮಳೆ ಬರೋ ಹಾಗಿದೆ','Male baro haagide'],['ಮಕ್ಕಳು ಸ್ಕೂಲಿಂದ ಬರ್ತಾರೆ','Makkalu schoolinda bartaare']],
  kid:[['ಅಮ್ಮ, ಐಸ್ ಕ್ರೀಮ್ ಬೇಕು','Amma, ice cream beku'],['ಕ್ರಿಕೆಟ್ ಆಡೋಣ!','Cricket aadona!'],['ಔಟ್! ಔಟ್!','Out! Out!'],['ನಾನೇ ಫಸ್ಟ್!','Naane first!']],
  elder:[['ಸ್ವಲ್ಪ ನಿಧಾನ ಮಗು','Swalpa nidhaana magu'],['ಈ ಕಾಲದಲ್ಲಿ ಯಾರೂ ಕೇಳಲ್ಲ','Ee kaaladalli yaaru kelalla'],['ದೇವರೇ ಕಾಪಾಡು','Devare kaapaadu'],['ನಮ್ಮ ಕಾಲದಲ್ಲಿ ಹೀಗಿರಲಿಲ್ಲ','Namma kaaladalli heegiralilla']],
  vendor:[['ತರಕಾರಿ, ತರಕಾರಿ!','Tarakari, tarakari!'],['ಮಲ್ಲಿಗೆ ಹೂವು, ಮಲ್ಲಿಗೆ!','Mallige hoovu, mallige!'],['ಬಿಸಿ ಬಿಸಿ ಮಸಾಲೆ ಪುರಿ!','Bisi bisi masala puri!']],
  argue:[['ನೋಡ್ಕೊಂಡು ಓಡ್ಸಪ್ಪ!','Nodkondu odsappa!'],['ಕಣ್ಣು ಕಾಣಲ್ವಾ?','Kannu kaanalva?'],['ಯಾಕೆ ಹಾರ್ನ್ ಹೊಡಿತೀಯಾ?','Yaake horn hoditiya?'],['ನಿಂಗೇನ್ ಪ್ರಾಬ್ಲಮ್?','Ningen problem?'],['ಹೊಡೀತೀನಿ ನೋಡು!','Hoditeeni nodu!']],
  thief:[['ಕಳ್ಳ! ಕಳ್ಳ! ಹಿಡೀರಿ!','Kalla! Kalla! Hidiri!'],['ನನ್ನ ಮೊಬೈಲ್! ಕಳ್ಳ!','Nanna mobile! Kalla!']],
  help:[['ಕಾಪಾಡಿ! ಕಾಪಾಡಿ!','Kaapaadi! Kaapaadi!'],['ಪೊಲೀಸ್! ಪೊಲೀಸ್!','Police! Police!']]};
const TTS={lang:null,next:5,last:0};
function ttsLang(){try{if(window.OoshtNative&&OoshtNative.ttsLang)return OoshtNative.ttsLang();}catch(e){}if(TTS.lang)return TTS.lang;
  if(!TTS.lang&&window.speechSynthesis){const v=speechSynthesis.getVoices();if(v.length)TTS.lang=v.some(x=>/^kn/i.test(x.lang))?'kn':'en';}return TTS.lang||'en';}
function say(set,who,force){
  if(!settings.sound)return;const now=performance.now();if(!force&&now-TTS.last<2500)return;TTS.last=now;
  const L=LINES[set];if(!L)return;const line=L[Math.floor(Math.random()*L.length)];const kn=ttsLang()==='kn';const text=kn?line[0]:line[1];
  const pitch={man:.85,woman:1.3,kid:1.7,elder:.72,vendor:1.0}[who]||1,rate=who==='elder'?.82:who==='kid'?1.12:1;
  try{if(window.OoshtNative&&OoshtNative.speak){OoshtNative.speak(text,pitch,rate);return;}}catch(e){}
  try{if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(text);u.lang=kn?'kn-IN':'en-IN';u.pitch=Math.min(2,pitch);u.rate=rate;u.volume=.85;speechSynthesis.speak(u);}}catch(e){}
}
function whoOf(p){const l=pedLook(p);return l.kind==='kid'?'kid':l.kind==='elder'?'elder':l.female?'woman':'man';}
/* a low crowd murmur when people are around */
const BAB={src:null,g:null};
function babble(v){const c=Snd.ctx;if(!c||!Snd.noise)return;if(!BAB.src){if(v<.02)return;const s=c.createBufferSource();s.buffer=Snd.noise;s.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=650;f.Q.value=1.2;const f2=c.createBiquadFilter();f2.type='peaking';f2.frequency.value=1800;f2.gain.value=8;const am=c.createGain();am.gain.value=.5;
  const l=c.createOscillator();l.frequency.value=3.3;const lg=c.createGain();lg.gain.value=.45;l.connect(lg);lg.connect(am.gain);const g=c.createGain();g.gain.value=0;s.connect(f);f.connect(f2);f2.connect(am);am.connect(g);g.connect(Snd.master);s.start();l.start();BAB.src=s;BAB.g=g;}
  BAB.g.gain.setTargetAtTime(v*.09,c.currentTime,.6);}

/* ---------- street life: pickpockets, chain snatchers, arguments, road rage, armed goons ---------- */
const STREET={pickT:20,argueT:40,rageT:70,events:[],rewardN:0};
function adultMan(p){const l=pedLook(p);return l&&!l.female&&l.kind!=='kid'&&l.kind!=='elder';}
function updateStreet(dt){
  if(state!=='play'||INT.on)return;
  const near=[];for(const p of peds)if(!p.dead&&p.state!=='down'&&Math.hypot(p.x-P.x,p.y-P.y)<60)near.push(p);
  babble(clamp(near.filter(p=>Math.hypot(p.x-P.x,p.y-P.y)<22).length/8,0,1)*(state==='play'?1:0));
  /* someone nearby says something */
  if((TTS.next-=dt)<=0){TTS.next=4+Math.random()*6;const c=near.filter(p=>Math.hypot(p.x-P.x,p.y-P.y)<14&&!p.rp);if(c.length){const p=c[Math.floor(Math.random()*c.length)];const w=whoOf(p);say(p.kind==='vendor'?'vendor':w,p.kind==='vendor'?'vendor':w);}}
  /* roles: a few pickpockets and armed goons among the crowd */
  for(const p of near){if(p.role!==undefined)continue;p.role='';if(p.state==='walk'&&adultMan(p)){const r=Math.random();if(r<.05)p.role='pick';else if(r<(profile.flags&&profile.flags.racket?.07:.1)){p.role='goon';p.armed=true;}}}
  /* pickpocket strikes */
  if((STREET.pickT-=dt)<=0){STREET.pickT=25+Math.random()*35;
    const th=near.find(p=>p.role==='pick'&&p.state==='walk');
    if(th){const tgtPlayer=FOOT.on&&!FOOT.ride&&!INT.on&&profile.wallet>300&&Math.random()<.35&&Math.hypot(th.x-P.x,th.y-P.y)<30;
      const vic=tgtPlayer?null:near.find(p=>p!==th&&p.state==='walk'&&Math.hypot(p.x-th.x,p.y-th.y)<25);
      if(tgtPlayer||vic){th.state='stalk';th.vic=vic;th.t=0;th.rp=null;}}}
  /* arguments on the footpath */
  if((STREET.argueT-=dt)<=0){STREET.argueT=45+Math.random()*50;
    const a=near.find(p=>p.state==='walk'&&adultMan(p)&&!p.role&&Math.hypot(p.x-P.x,p.y-P.y)<40);const b=a&&near.find(p=>p!==a&&p.state==='walk'&&adultMan(p)&&!p.role&&Math.hypot(p.x-a.x,p.y-a.y)<20);
    if(a&&b){const h=a.h;b.x=a.x+Math.sin(h)*1.1;b.y=a.y-Math.cos(h)*1.1;for(const p of[a,b]){p.state='argue';p.t=0;p.foe=p===a?b:a;}STREET.events.push({k:'argue',a,b,t:0});}}
  /* road rage: two drivers stop and get out to argue */
  if(!FOOT.ride&&(STREET.rageT-=dt)<=0){STREET.rageT=80+Math.random()*80;
    for(const a of agents){if(a.t.two||a.t.len>6||a.patrol||Math.hypot(a.x-P.x,a.y-P.y)>130)continue;
      const b=agents.find(o=>o!==a&&!o.t.two&&o.t.len<6&&!o.patrol&&Math.hypot(o.x-a.x,o.y-a.y)<10&&Math.abs(angDiff(o.h,a.h))<.4);if(!b)continue;
      a.stop=30;b.stop=30;a.v=b.v=0;const mk=(c)=>{const lx=-Math.cos(c.h)*-1,ly=-Math.sin(c.h)*-1;return {x:c.x+lx*(c.t.wid/2+.6),y:c.y+ly*(c.t.wid/2+.6),h:0,state:'argue',v:pickLook(false),pose:0,pt:0,t:0,sc:1,speed:1.3,role:'',car:c};};
      const p1=mk(a),p2=mk(b);let lx=(p1.x+p2.x)/2,ly=(p1.y+p2.y)/2;p1.x=lx-Math.sin(a.h)*.6;p1.y=ly+Math.cos(a.h)*.6;p2.x=lx+Math.sin(a.h)*.6;p2.y=ly-Math.cos(a.h)*.6;p1.foe=p2;p2.foe=p1;
      peds.push(p1,p2);STREET.events.push({k:'rage',a:p1,b:p2,cars:[a,b],t:0});Snd.tone([420,420],.5,'square',.04);toast('Road rage up ahead!','','rage',2000);break;}}
  /* run the events */
  for(let i=STREET.events.length-1;i>=0;i--){const e=STREET.events[i];e.t+=dt;const{a,b}=e;
    const alive=p=>p&&!p.dead&&p.state!=='down'&&p.state!=='flee';
    if(!alive(a)||!alive(b)||e.t>22){for(const p of[a,b])if(p&&(p.state==='argue'||p.state==='brawl')){p.state='walk';p.rp=null;if(e.k==='rage'){p.gone=true;}}
      if(e.k==='rage'){for(const c of e.cars)c.stop=0;for(const p of[a,b]){const k=peds.indexOf(p);if(k>=0&&p.gone)peds.splice(k,1);}}STREET.events.splice(i,1);continue;}
    for(const p of[a,b]){p.h=hAng(p.foe.x-p.x,p.foe.y-p.y);}
    if(e.t<7){for(const p of[a,b]){p.state='argue';p.rp=Math.floor((e.t+(p===a?0:.4))*2.2)%2?'punch':'pose';p.rp=p.rp==='punch'?'swing1':'pose';}
      if(Math.floor(e.t/1.6)!==Math.floor((e.t-dt)/1.6)&&Math.hypot(a.x-P.x,a.y-P.y)<30)say('argue','man',true);}
    else if(e.t<14&&Math.random()<.95){for(const p of[a,b]){p.state='brawl';const ph=Math.floor((e.t*3+(p===a?0:1)))%3;p.rp=ph===0?'punch':ph===1?'kick':'pose';}
      if(Math.random()<dt*1.5)Snd.thud(.2);if(e.t>12.5&&!e.ko){e.ko=true;const loser=Math.random()<.5?a:b;loser.state='down';loser.ko=true;loser.t=-4;loser.fall=loser.h+Math.PI;loser.rp=null;}}
  }
  /* pickpockets and goons */
  for(const p of near){
    if(p.state==='stalk'){p.t+=dt;const tx=p.vic?p.vic.x:P.x,ty=p.vic?p.vic.y:P.y;const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);
      if(p.t>25||(p.vic&&(p.vic.dead||p.vic.state==='down'))){p.state='walk';p.rp=null;continue;}
      p.h=hAng(dx,dy);if(d>.75){const sp=1.7;p.x+=dx/d*sp*dt;p.y+=dy/d*sp*dt;p.pt+=dt;if(p.pt>.3){p.pt=0;p.pose^=1;}p.rp=p.pose?'walk1':'walk0';}
      else{p.rp='stab';p.steal=(p.steal||0)+dt;if(p.steal>1.1){p.culprit=true;p.rp=null;
        if(p.vic){p.loot=0;const w=whoOf(p.vic);setFlee(p.vic,p.x,p.y);say('thief',w==='kid'?'kid':w,true);toast('Pickpocket! Catch the thief (red marker) for a ₹10,000 reward','gold','thief',3500);}
        else{const amt=Math.min(Math.round(profile.wallet*.15),3000);profile.wallet-=amt;p.loot=amt;saveProfile();toast(`Pickpocketed! You lost ₹${fmtINR(amt)}. Catch him!`,'bad','thief',3500);Hap.crash();}
        setFlee(p,tx,ty);p.speed=2.1;p.t=0;}}}
    if(p.armed&&p.state==='hostile'){const dx=P.x-p.x,dy=P.y-p.y,d=Math.hypot(dx,dy);p.h=hAng(dx,dy);p.t=(p.t||0)+dt;
      if(d>60||p.t>60){p.state='walk';p.rp=null;continue;}
      if(d>11&&lineClear(p.x,p.y,P.x,P.y)===false||d>14){const sp=3.6;let nx=p.x+dx/d*sp*dt,ny=p.y+dy/d*sp*dt;if(!inBuilding(nx,ny)){p.x=nx;p.y=ny;}p.pt+=dt;if(p.pt>.2){p.pt=0;p.pose^=1;}p.rp=p.pose?'run1':'run0';p.rw=null;}
      else{p.rp='aim';p.rw='pistol';p.shoot=(p.shoot??.8)-dt;if(p.shoot<=0){p.shoot=1.2+Math.random()*1.2;goonShoot(p,d);}}}
  }
  /* run into a thief to tackle him */
  if(FOOT.on&&P.s>3.5)for(const p of near)if(p.culprit&&!p.caught&&p.state==='flee'&&Math.hypot(p.x-P.x,p.y-P.y)<.8)hurtPed(p,30,(p.x-P.x),(p.y-P.y),'melee');
}
function goonShoot(p,d){Snd.burst(.07,1500,.6,.4*clamp(1-d/60,.2,1),'bandpass');const hit=Math.random()<clamp(.65-d/40,.15,.55)*(P.s>4?.6:1);
  const tx=P.x+(hit?0:(Math.random()-.5)*2.5),ty=P.y+(hit?0:(Math.random()-.5)*2.5);LIFE.fx.push({k:'tracer',a:[p.x+Math.sin(p.h)*.6,1.32,p.y-Math.cos(p.h)*.6],b:[tx,1.1,ty],t:.06});
  if(hit){if(FOOT.on)lfDamage(6+Math.random()*5,'shot');else{P.cond=Math.max(0,P.cond-3);spark(P.x,1,P.y);}}else spark(tx,.2,ty);}
/* armed people near a fight or gunfire turn on you */
function provokeGoons(x,y,r){for(const p of peds){if(p.armed&&!p.dead&&p.state!=='down'&&p.state!=='hostile'&&Math.hypot(p.x-x,p.y-y)<r){p.state='hostile';p.t=0;p.rp=null;}}}
/* catching a culprit */
function rewardCulprit(p){if(p.caught)return;p.caught=true;STREET.rewardN++;const back=p.loot||0;profile.wallet+=10000+back;session.fare+=10000;saveProfile();
  toast(`You caught the thief! Police reward ₹10,000${back?` + ₹${fmtINR(back)} back`:''}`,'gold');Snd.chime();Hap.success();}

/* ---------- looting people you knock out ---------- */
function lootOf(p){if(p.loot2)return p.loot2;const posh=poshAt(p.x,p.y);const l=pedLook(p);const kid=l.kind==='kid';
  p.loot2={cash:kid?Math.floor(Math.random()*50):Math.round((40+Math.random()*900)*(posh>.5?4:1)/10)*10+(p.loot||0),phone:!kid&&Math.random()<.75,phoneVal:Math.round((1500+Math.random()*(posh>.5?60000:12000))/100)*100,
    keys:!kid&&Math.random()<.4,clothes:adultMan(p)&&!p.strip,gun:!!p.armed};return p.loot2;}
function openLoot(p){
  state='loot';releaseAll();const L=lootOf(p);const box=$('#ltItems');box.innerHTML='';const posh=poshAt(p.x,p.y);
  const add=(n,e,fn,dis)=>{const b=document.createElement('button');b.className='vitem';b.innerHTML='<span class="n"></span><span class="e"></span><b>Take</b>';b.querySelector('.n').textContent=n;b.querySelector('.e').textContent=e;b.disabled=!!dis;b.addEventListener('click',()=>{fn();lootCrime(p);openLoot(p);});box.appendChild(b);};
  $('#ltTitle').textContent=p.dead?'Search the body':'Search his pockets';$('#ltSub').textContent=p.culprit?'A thief. Whatever he stole goes back to its owner.':'Taking things is theft if anyone sees you.';
  add(`Cash · ₹${fmtINR(L.cash)}`,'Wallet',()=>{profile.wallet+=L.cash;L.cash=0;saveProfile();Snd.coin();},L.cash<=0);
  if(L.phone)add('Mobile phone',`Sells for about ₹${fmtINR(L.phoneVal)} at any shop`,()=>{profile.inv.phones=(profile.inv.phones||0)+1;profile.inv.phoneVal=(profile.inv.phoneVal||0)+L.phoneVal;L.phone=false;saveProfile();});
  if(L.keys){const v=nearestParkedFor(p);add(v?`Vehicle keys · ${VEH[vehKeyFor(v.t.k)].sub}`:'Vehicle keys','The vehicle is parked nearby (key icon on the map)',()=>{if(v){v.mine=true;LIFE.keyV=v;}L.keys=false;toast(v?'Keys taken. Find the key icon on the map.':'Keys taken','good');},false);}
  if(L.gun)add('Pistol + 12 rounds','He was carrying a gun',()=>{profile.inv.pistol=1;profile.inv.ammo.pistol+=12;L.gun=false;p.armed=false;saveProfile();});
  if(L.clothes)add('His shirt and trousers','You change into them; he is left in his baniyan and undies',()=>{const l=pedLook(p);PLOOK.shirt=l.shirt||l.kurta||PLOOK.shirt;PLOOK.pants=l.pants||PLOOK.pants;profile.look={shirt:PLOOK.shirt,pants:PLOOK.pants};p.strip=true;L.clothes=false;saveProfile();});
  show('lootScr');
}
function lootCrime(p){if(p.culprit)return;if(nearCop(90)||peds.some(q=>q!==p&&!q.dead&&q.state!=='down'&&Math.hypot(q.x-p.x,q.y-p.y)<14))crime('theft',1);}
function nearestParkedFor(p){let b=null,bd=150;for(const v of W.parkedV||[]){if(CITY.taken.has(v.key))continue;const d=Math.hypot(v.x-p.x,v.y-p.y);if(d<bd){bd=d;b=v;}}return b;}
$('#ltClose').addEventListener('click',()=>{state='play';show('play');footHud(true);});
if(profile.look){PLOOK.shirt=profile.look.shirt;PLOOK.pants=profile.look.pants;}

/* ---------- your own crimes: pickpocketing, robbing at gunpoint ---------- */
function peopleContext(){
  for(const p of peds){if(p.dead&&p.state!=='down')continue;const d=Math.hypot(p.x-P.x,p.y-P.y);
    if(p.state==='down'&&d<1.5)return {k:'loot',p,label:p.dead?'Search the body':'Search pockets'};}
  const w=WPN[LIFE.cur];
  for(const p of peds){if(p.dead||p.state==='down'||p.state==='static'||p.kind)continue;const d=Math.hypot(p.x-P.x,p.y-P.y);
    if(w.gun&&d<6&&Math.abs(angDiff(P.h,hAng(p.x-P.x,p.y-P.y)))<.5&&!p.mugged)return {k:'mug',p,label:'Rob at gunpoint'};
    if(d<1.15&&p.state==='walk'&&!p.picked&&Math.abs(angDiff(p.h,hAng(P.x-p.x,P.y-p.y)))>2)return {k:'pick',p,label:'Pickpocket'};}
  return null;
}
function peopleUse(c){const p=c.p;
  if(c.k==='loot')openLoot(p);
  else if(c.k==='pick'){p.picked=true;if(Math.random()<.65){const amt=Math.round((50+Math.random()*700)*(poshAt(p.x,p.y)>.5?3:1));profile.wallet+=amt;saveProfile();toast(`Lifted ₹${fmtINR(amt)}${Math.random()<.3?' and a phone':''}`,'gold');Snd.coin();}
    else{setFlee(p,P.x,P.y);say('thief',whoOf(p),true);toast('He felt it! Run!','bad');crime('theft',1);}}
  else if(c.k==='mug'){p.mugged=true;const amt=Math.round((200+Math.random()*1800)*(poshAt(p.x,p.y)>.5?3:1));profile.wallet+=amt;saveProfile();say('help',whoOf(p),true);setFlee(p,P.x,P.y);toast(`They handed over ₹${fmtINR(amt)}`,'gold');crime('robbery',2);}
}
FINES.robbery=['Robbery',5000];FINES.plane=['Stealing an aircraft',25000];HEAT.robbery=2.5;HEAT.plane=6;
Object.assign(window.__oosht||{},{STREET,say,openLoot,peopleContext,humanRig});
