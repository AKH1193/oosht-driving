/* ================= WISE CITY: intro, music and radio, city ambience, falling poles, smoke ================= */

/* ---------- electric poles that go down when you hit them ---------- */
const PDOWN=new Map();let POLEM=null;
function poleMesh(){if(POLEM)return POLEM;const mb=new MB(),c=[.66,.65,.62];mb.box(0,4.25,0,.24,8.5,.24,c);mb.box(0,7.9,0,1.6,.12,.12,c);for(const q of[-.7,0,.7])mb.box(q,8.03,0,.06,.14,.06,[.85,.85,.8]);POLEM=mb.mesh();return POLEM;}
function knockPole(pl,vx,vy){if(PDOWN.has(pl.key))return;PDOWN.set(pl.key,{x:pl.x,y:pl.y,dir:hAng(vx||1,vy||0),t:0});
  const ck=Math.floor(pl.x/CH)+','+Math.floor(pl.y/CH);const c=CHUNKS.get(ck);if(c)c.v=-1;
  Snd.crash();Snd.burst(.5,3200,.9,.25,'highpass');Hap.crash();for(let k=0;k<10;k++)LIFE.fx.push({k:'spark',p:[pl.x,7.6+Math.random(),pl.y],t:.35,c:[1,.85,.4]});
  if(Math.random()<.5)crime('damage',1);}
function drawPoles(night){for(const[,d]of PDOWN){if(Math.hypot(d.x-CAM.eye[0],d.y-CAM.eye[2])>260)continue;d.t=Math.min(1.2,d.t+1/60);const k=Math.min(1,d.t/1.1),e=k*k;
  M4.model(TM,d.x,0,d.y,-d.dir,-Math.PI/2*e*.97,0);drawLit(poleMesh(),TM);
  if(k<1&&Math.random()<.3)LIFE.fx.push({k:'spark',p:[d.x+Math.sin(d.dir)*8*Math.sin(e*1.5),.3+7.8*Math.cos(e*1.5),d.y-Math.cos(d.dir)*8*Math.sin(e*1.5)],t:.25,c:[1,.8,.3]});}}

/* ---------- a small synthesiser for the radio and the menu music ---------- */
const MUS={bus:null,out:null,st:null,cur:-1,step:0,nextT:0,timer:null,bar:0,seed:1,menu:false,talkT:0};
const STATIONS=[
  {name:'Namma FM 92.7',tag:'Kannada film hits',bpm:98,scale:[0,2,4,5,7,9,11],root:57,kit:'filmi',lead:'sawtooth',prog:[0,5,3,4]},
  {name:'Bengaluru Beats 98.3',tag:'Electronic',bpm:124,scale:[0,2,3,5,7,8,10],root:52,kit:'house',lead:'square',prog:[0,5,2,6]},
  {name:'Carnatic Classics 100.1',tag:'Veena and mridangam',bpm:84,scale:[0,1,4,5,7,8,11],root:50,kit:'mridangam',lead:'veena',drone:true,prog:[0,0,0,0]},
  {name:'Dollu Kunitha 104.0',tag:'Folk drums',bpm:138,scale:[0,2,4,7,9],root:55,kit:'dollu',lead:'triangle',prog:[0,4,0,3]},
  {name:'Lo-fi Lalbagh 89.6',tag:'Chill beats',bpm:78,scale:[0,2,3,5,7,9,10],root:53,kit:'lofi',lead:'sine',prog:[1,4,0,5],pad:true},
  {name:'Traffic & Talk 95.0',tag:'News and chatter',bpm:90,scale:[0,2,4,7,9],root:60,kit:'soft',lead:'sine',talk:true,prog:[0,3,4,0]},
];
const MENU_THEME={name:'menu',bpm:92,scale:[0,2,3,5,7,8,10],root:50,kit:'cine',lead:'sawtooth',pad:true,prog:[0,5,3,6]};
const mtof=m=>440*Math.pow(2,(m-69)/12);
function musBus(){const c=Snd.ctx;if(!c)return null;if(MUS.bus)return MUS.bus;
  const g=c.createGain();g.gain.value=0;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=90;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=7000;
  const comp=c.createDynamicsCompressor();g.connect(hp);hp.connect(lp);lp.connect(comp);comp.connect(Snd.master);MUS.bus=g;MUS.lp=lp;return g;}
function env(g,t,a,peak,d,sus,r){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(Math.max(.0001,peak*sus),t+a+d);g.gain.exponentialRampToValueAtTime(.0001,t+a+d+r);}
function tone(type,f,t,dur,vol,opt){const c=Snd.ctx,o=c.createOscillator(),g=c.createGain();o.type=type==='veena'?'sawtooth':type;o.frequency.setValueAtTime(f,t);
  if(opt&&opt.bend)o.frequency.exponentialRampToValueAtTime(f*opt.bend,t+dur*.6);let n=o;
  if(type==='veena'||(opt&&opt.lp)){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(type==='veena'?3200:opt.lp,t);lp.frequency.exponentialRampToValueAtTime(type==='veena'?500:opt.lp*.4,t+dur);o.connect(lp);n=lp;}
  n.connect(g);g.connect(MUS.bus);env(g,t,.008,vol,dur*.35,.35,dur*.65);o.start(t);o.stop(t+dur+.05);}
function noiseHit(t,dur,vol,type,freq,q){const c=Snd.ctx,s=c.createBufferSource();s.buffer=Snd.noise;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q||1;const g=c.createGain();s.connect(f);f.connect(g);g.connect(MUS.bus);env(g,t,.002,vol,dur*.3,.2,dur*.7);s.start(t,Math.random()*.5);s.stop(t+dur+.05);}
function drum(kind,t,v){const c=Snd.ctx;
  if(kind==='kick'){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);o.connect(g);g.connect(MUS.bus);env(g,t,.003,.9*v,.08,.4,.22);o.start(t);o.stop(t+.4);}
  else if(kind==='snare'){noiseHit(t,.18,.45*v,'bandpass',1900,.8);tone('triangle',190,t,.1,.25*v);}
  else if(kind==='hat'){noiseHit(t,.05,.18*v,'highpass',7500);}
  else if(kind==='clap'){for(const d of[0,.012,.024])noiseHit(t+d,.12,.3*v,'bandpass',1400,1.5);}
  else if(kind==='tha'){tone('sine',330,t,.16,.5*v,{bend:.72});noiseHit(t,.03,.12*v,'bandpass',3000,2);}       /* mridangam / tabla */
  else if(kind==='dhi'){tone('sine',150,t,.32,.6*v,{bend:.8});tone('sine',300,t,.12,.25*v,{bend:.8});}
  else if(kind==='dollu'){tone('sine',85,t,.35,.95*v,{bend:.7});noiseHit(t,.06,.25*v,'lowpass',600);}
  else if(kind==='rim'){noiseHit(t,.04,.25*v,'bandpass',3500,4);}}
const KITS={
  filmi:   s=>[[s%8===0,'kick'],[s%8===4,'snare'],[s%2===1,'hat'],[s%16===14,'tha']],
  house:   s=>[[s%4===0,'kick'],[s%8===4,'clap'],[s%4===2,'hat'],[s%2===1&&s%4!==3,'hat']],
  mridangam:s=>[[[0,3,6,8,11,14].includes(s%16),'tha'],[[0,8].includes(s%16),'dhi'],[s%4===2,'rim']],
  dollu:   s=>[[[0,3,6,8,10,12,14].includes(s%16),'dollu'],[s%2===1,'rim']],
  lofi:    s=>[[[0,7,10].includes(s%16),'kick'],[s%8===4,'snare'],[s%2===0,'hat']],
  soft:    s=>[[s%8===0,'kick'],[s%4===2,'hat']],
  cine:    s=>[[[0,10].includes(s%16),'kick'],[s%16===8,'snare'],[s%4===2,'hat'],[s%32===30,'dollu']]};
function rnd(){MUS.seed=(MUS.seed*16807)%2147483647;return MUS.seed/2147483647;}
function schedStep(st,t,s){const beat=60/st.bpm/4;const bar=Math.floor(s/16),ch=st.prog[bar%st.prog.length],sc=st.scale,root=st.root;
  const deg=i=>root+sc[((i%sc.length)+sc.length)%sc.length]+12*Math.floor(i/sc.length);
  for(const[on,k]of KITS[st.kit](s))if(on)drum(k,t,.9);
  if(s%4===0&&st.kit!=='mridangam')tone('triangle',mtof(deg(ch)-12),t,beat*3.6,.32);
  if(s%16===0){if(st.pad)for(const i of[0,2,4])tone('sawtooth',mtof(deg(ch+i)),t,beat*15,.045,{lp:900});
    if(st.drone){tone('sine',mtof(root-12),t,beat*16,.12);tone('sine',mtof(root-5),t,beat*16,.08);}}
  if(!MUS.mel||s%16===0){MUS.mel=[];let i=ch+7;for(let k=0;k<16;k++){if(rnd()<(st.kit==='lofi'?.35:.55)){i+=Math.round((rnd()-.5)*4);i=clamp(i,ch+3,ch+12);MUS.mel.push(i);}else MUS.mel.push(null);}}
  const m=MUS.mel[s%16];if(m!=null)tone(st.lead,mtof(deg(m)),t,beat*(st.lead==='veena'?3:1.8),st.lead==='square'?.06:.09,st.lead==='sawtooth'?{lp:2400}:null);}
function musTick(){const c=Snd.ctx;if(!c||!MUS.st)return;const st=MUS.st,beat=60/st.bpm/4;
  if(MUS.nextT<c.currentTime)MUS.nextT=c.currentTime+.05;
  while(MUS.nextT<c.currentTime+.25){schedStep(st,MUS.nextT,MUS.step);MUS.step++;MUS.nextT+=beat;}
  if(st.talk&&!MUS.menu){MUS.talkT-=.05;if(MUS.talkT<=0){MUS.talkT=22+Math.random()*12;rjTalk();}}}
function musPlay(st,vol){if(!Snd.ctx)return;musBus();MUS.st=st;MUS.step=0;MUS.mel=null;MUS.seed=1+Math.floor(Math.random()*1e6);MUS.nextT=Snd.ctx.currentTime+.08;MUS.talkT=4;
  MUS.vol=vol;MUS.bus.gain.cancelScheduledValues(Snd.ctx.currentTime);MUS.bus.gain.setTargetAtTime(vol*(settings.musVol??80)/80,Snd.ctx.currentTime,.4);if(!MUS.timer)MUS.timer=setInterval(musTick,50);}
function musStop(){if(!MUS.bus)return;MUS.bus.gain.setTargetAtTime(0,Snd.ctx.currentTime,.25);const s=MUS.st;setTimeout(()=>{if(MUS.st===s){MUS.st=null;}},900);}
/* the talk station: an RJ with traffic updates */
const RJ=[['ನಮಸ್ಕಾರ ಬೆಂಗಳೂರು! ಸಿಲ್ಕ್ ಬೋರ್ಡ್ ಹತ್ರ ಟ್ರಾಫಿಕ್ ಜಾಮ್ ಇದೆ','Namaskara Bengaluru! Silk Board hatra traffic jam ide'],['ಇವತ್ತು ಸಂಜೆ ಮಳೆ ಬರಬಹುದು, ಕೊಡೆ ತಗೊಳ್ಳಿ','Ivattu sanje male barabahudu, kode tagolli'],['ಔಟರ್ ರಿಂಗ್ ರೋಡ್ ನಲ್ಲಿ ಸ್ಲೋ ಮೂವಿಂಗ್ ಟ್ರಾಫಿಕ್','Outer Ring Road nalli slow moving traffic'],['ಮೆಟ್ರೋ ಎಲ್ಲಾ ಲೈನ್ ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಓಡ್ತಿದೆ','Metro ella line samayakke sariyaagi odtide'],['ಎಂ ಜಿ ರೋಡ್ ನಲ್ಲಿ ಹೊಸ ಕೆಫೆ ಓಪನ್ ಆಗಿದೆ','MG Road nalli hosa cafe open aagide']];
function rjTalk(){const L=RJ[Math.floor(Math.random()*RJ.length)];const kn=ttsLang()==='kn';if(MUS.bus)MUS.bus.gain.setTargetAtTime(.08,Snd.ctx.currentTime,.2);
  try{if(window.OoshtNative&&OoshtNative.speak)OoshtNative.speak(kn?L[0]:L[1],1.05,1.05);else if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(L[1]);u.lang='en-IN';u.rate=1.05;speechSynthesis.speak(u);}}catch(e){}
  setTimeout(()=>{if(MUS.bus&&RADIO.on>=0&&STATIONS[RADIO.on]&&STATIONS[RADIO.on].talk)MUS.bus.gain.setTargetAtTime(RADIO.vol,Snd.ctx.currentTime,.4);},4500);}

/* ---------- the car radio ---------- */
const RADIO={on:-1,last:0,vol:.34};
const hasRadio=()=>!FOOT.on&&!FLY.on&&VEH[P.type]&&VEH[P.type].cat!=='two';
function radioSet(i){RADIO.on=i;if(i>=0){RADIO.last=i;const st=STATIONS[i];MUS.menu=false;musPlay(st,RADIO.vol);$('#radioChip').innerHTML='';const b=document.createElement('span');b.textContent='📻 ';const n=document.createElement('i');n.textContent=st.name;const t=document.createElement('span');t.textContent=' · '+st.tag;$('#radioChip').append(b,n,t);$('#radioChip').hidden=false;Hap.tick();}
  else{musStop();$('#radioChip').hidden=true;}}
function radioNext(){Snd.init();Snd.resume();radioSet(RADIO.on+1>=STATIONS.length?-1:RADIO.on+1);}
$('#btnRadio').addEventListener('click',radioNext);
window.addEventListener('keydown',e=>{if((e.key==='r'||e.key==='R')&&!e.repeat&&state==='play'&&hasRadio())radioNext();});

/* ---------- city ambience: distant traffic, horns, birds by day, dogs at night ---------- */
const AMB2={g:null,t:3};
function ambStart(){const c=Snd.ctx;if(!c||AMB2.g)return;const s=c.createBufferSource();s.buffer=Snd.noise;s.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=380;const g=c.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(Snd.master);s.start();AMB2.g=g;}
function ambTick(dt){const c=Snd.ctx;if(!c)return;ambStart();const want=state==='play'&&!INT.on?(.05-TOD.night*.02)*(FOOT.on?1.3:.6):0;AMB2.g.gain.setTargetAtTime(want,c.currentTime,.6);
  if(state!=='play'||INT.on)return;AMB2.t-=dt;if(AMB2.t>0)return;AMB2.t=3+Math.random()*7;const t=c.currentTime,r=Math.random();
  const far=(f,d,v,type)=>{const o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1600;o.type=type||'square';o.frequency.value=f;o.connect(lp);lp.connect(g);g.connect(Snd.master);env(g,t,.02,v,d*.3,.6,d*.7);o.start(t);o.stop(t+d+.1);};
  if(r<.45){const f=[360,420,480,540][Math.floor(Math.random()*4)];far(f,.28,.03);if(Math.random()<.5)setTimeout(()=>{const t2=c.currentTime;const o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.value=f;o.connect(g);g.connect(Snd.master);env(g,t2,.02,.025,.1,.6,.2);o.start(t2);o.stop(t2+.35);},330);}
  else if(r<.75&&TOD.night<.4){for(let k=0;k<3;k++){const o=c.createOscillator(),g=c.createGain();o.type='sine';const t2=t+k*.13;o.frequency.setValueAtTime(2600+Math.random()*900,t2);o.frequency.exponentialRampToValueAtTime(1800,t2+.09);o.connect(g);g.connect(Snd.master);env(g,t2,.005,.02,.04,.3,.06);o.start(t2);o.stop(t2+.15);}}
  else if(TOD.night>.5){for(let k=0;k<2;k++){const t2=t+k*.32;const o=c.createOscillator(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(420,t2);o.frequency.exponentialRampToValueAtTime(260,t2+.12);const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;o.connect(lp);lp.connect(g);g.connect(Snd.master);env(g,t2,.005,.03,.05,.4,.1);o.start(t2);o.stop(t2+.2);}}}

/* ---------- the opening: night city, a car tearing past, gunfire, then the credit ---------- */
const INTRO={t0:0,done:false,ev:[]};
function introSound(k){const c=Snd.ctx;if(!c||c.state!=='running')return;const t=c.currentTime;
  if(k==='rev'){const o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(55,t);o.frequency.exponentialRampToValueAtTime(190,t+.9);o.frequency.exponentialRampToValueAtTime(70,t+1.6);lp.type='lowpass';lp.frequency.value=900;o.connect(lp);lp.connect(g);g.connect(Snd.master);env(g,t,.05,.35,.6,.6,1);o.start(t);o.stop(t+1.8);
    const s=c.createBufferSource();s.buffer=Snd.noise;const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=.8;f.frequency.setValueAtTime(400,t);f.frequency.exponentialRampToValueAtTime(2400,t+.8);f.frequency.exponentialRampToValueAtTime(300,t+1.5);const g2=c.createGain();s.connect(f);f.connect(g2);g2.connect(Snd.master);env(g2,t,.3,.4,.5,.4,.8);s.start(t);s.stop(t+1.7);}
  else if(k==='shot'){Snd.burst(.12,1700,.6,.55,'bandpass');Snd.burst(.35,150,1,.6);Snd.burst(.9,300,.5,.08,'lowpass');}
  else if(k==='boom'){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(28,t+1.4);o.connect(g);g.connect(Snd.master);env(g,t,.01,.9,.4,.3,1.4);o.start(t);o.stop(t+2);Snd.burst(1.2,500,.6,.3,'lowpass');
    for(const[m,d]of[[62,0],[69,.05],[74,.1]]){const o2=c.createOscillator(),g2=c.createGain();o2.type='sawtooth';o2.frequency.value=mtof(m);const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1400;o2.connect(lp);lp.connect(g2);g2.connect(Snd.master);env(g2,t+d,.6,.06,1,.5,1.6);o2.start(t+d);o2.stop(t+d+3.3);}}}
function introRun(){
  const cv=$('#intro'),c=cv.getContext('2d');const dpr=Math.min(2,devicePixelRatio||1);const w=cv.clientWidth*dpr,h=cv.clientHeight*dpr;cv.width=w;cv.height=h;
  MOV.started=false;INTRO.t0=performance.now();
  const go=()=>{INTRO.t0=performance.now();MOV.started=false;const frame=()=>{if(INTRO.done)return;const t=(performance.now()-INTRO.t0)/1000;let end=false;try{end=introFilm(c,w,h,dpr,t);}catch(e){console.error(e);end=true;}if(end){introEnd();return;}requestAnimationFrame(frame);};requestAnimationFrame(frame);};
  /* wait (briefly) for the game fonts so the first titles never flash in a fallback face */
  const fl=document.fonts&&document.fonts.load?Promise.all(['WCDisplay','WCLogo','WCScript','WCHud'].map(f=>document.fonts.load(`40px ${f}`))):Promise.resolve();
  Promise.race([fl,new Promise(r=>setTimeout(r,700))]).then(go,go);}
function introEnd(){if(INTRO.done)return;INTRO.done=true;endSplash();setTimeout(()=>menuMusic(),400);}
$('#splash').addEventListener('pointerdown',()=>{Snd.init();const was=Snd.ctx&&Snd.ctx.state==='running';Snd.resume();$('#introTap').hidden=true;const t=(performance.now()-INTRO.t0)/1000;
  if(t>LOGO_AT+.8){introEnd();return;}
  if(!was&&t<5.6){INTRO.t0=performance.now();MOV.started=false;}});
Snd.init();setTimeout(()=>{if(Snd.ctx&&Snd.ctx.state==='running')$('#introTap').hidden=true;},300);
setTimeout(introRun,0);

/* ---------- menu music: plays on every screen outside the game ---------- */
function menuMusic(){if(!Snd.ctx)return;MUS.menu=true;musPlay(MENU_THEME,.22);}
let lastMode='';
setInterval(()=>{const inGame=['play','pause','map','misres','repair','fuel','outcome'].includes(state)||state==='splash';
  const mode=state==='splash'?'splash':inGame?'game':'menu';
  if(mode!==lastMode){lastMode=mode;if(mode==='menu'){RADIO.on=-1;$('#radioChip').hidden=true;menuMusic();}else if(mode==='game'&&MUS.menu){MUS.menu=false;musStop();}}
  if(mode==='game'){if(RADIO.on>=0&&!hasRadio()){musStop();$('#radioChip').hidden=true;RADIO.wasOn=RADIO.on;RADIO.on=-1;}
    else if(RADIO.on<0&&RADIO.wasOn>=0&&hasRadio()&&state==='play'){radioSet(RADIO.wasOn);RADIO.wasOn=-1;}}
  $('#btnRadio').hidden=!(state==='play'&&hasRadio());try{ambTick(.2);}catch(e){}
  if(MUS.lp&&Snd.ctx)MUS.lp.frequency.setTargetAtTime(state==='pause'?900:7000,Snd.ctx.currentTime,.2);
},200);
document.addEventListener('pointerdown',()=>{if(Snd.ctx&&Snd.ctx.state!=='running'){Snd.resume();if(lastMode==='menu')setTimeout(menuMusic,100);}},true);

/* ---------- smoke from a damaged vehicle, sparks when scraping walls ---------- */
function smokeFx(){if(FOOT.on||FLY.on||P.cond>40)return;const k=(40-P.cond)/40;const fx=Math.sin(P.h),fy=-Math.cos(P.h);const n=VEH[P.type].cat==='two'?1:3;
  for(let i=0;i<n;i++){const t=((GT*.6+i/n)%1);DGr.bill(P.x+fx*P.len*.38+Math.sin(GT*2+i)*.2*t,1.1+t*2.2,P.y+fy*P.len*.38,.25+t*.7*(.6+k),[.16*(1-t)*(.5+k),.16*(1-t)*(.5+k),.17*(1-t)*(.5+k)],CAM.right);}}
{const _sw=slideWall;slideWall=function(ox,oy,fx,fy,sg,n,dt){const r=_sw(ox,oy,fx,fy,sg,n,dt);if(r&&Math.abs(P.s)>5&&Math.random()<.5)LIFE.fx.push({k:'spark',p:[P.x+fx*P.len*.45,.5,P.y+fy*P.len*.45],t:.2,c:[1,.75,.3]});return r;};}

/* ---------- wiring ---------- */
{const _ds=drawStations;drawStations=function(n){_ds(n);drawPoles(n);smokeFx();};
}
Object.assign(window.__oosht||{},{PDOWN,knockPole,RADIO,STATIONS,radioSet,MUS,INTRO});
