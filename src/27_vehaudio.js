/* ================= WISE CITY: dynamic vehicle audio. Exhaust and diesel layers, gear-shift blips, turbo blow-off,
   air-brake hiss, tyre screech, nearby traffic engines, air horns for heavies and a Doppler siren ================= */
const VA={screech:null,traffic:[],lastGear:-1,lastThr:0,wasMoving:false,crashT:0,tick:0};
/* archetype profiles: exhaust/sub layer strength, turbo, shift pop, air brakes */
function vaProfile(key){const cat=VEH[key]?VEH[key].cat:'car';
  if(cat==='posh')return {sub:.55,growl:'sawtooth',turbo:true,pop:true,air:false};
  if(cat==='heavy')return {sub:.8,growl:'triangle',turbo:false,pop:false,air:true};
  if(cat==='three')return {sub:.35,growl:'square',turbo:false,pop:false,air:false};
  if(cat==='two')return {sub:.12,growl:'square',turbo:false,pop:key==='agni'||key==='kesari',air:false};
  return {sub:.25,growl:'triangle',turbo:false,pop:false,air:false};}

/* a sub-octave exhaust layer mixed under the main engine */
{const _se=Snd.startEngine.bind(Snd);Snd.startEngine=function(E,key){_se(E,key);const e=this.eng;if(!e||!e.osc||e.EP.ev)return;
  try{const c=this.ctx,pr=vaProfile(key||this.lastKey);const o=c.createOscillator();o.type=pr.growl;o.frequency.value=e.osc.frequency.value*.5;
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=key&&VEH[key]&&VEH[key].cat==='heavy'?240:420;const g=c.createGain();g.gain.value=0;
    o.connect(lp);lp.connect(g);g.connect(this.master);o.start();e.sub={o,g,lp,pr};
    const _stop=e.osc.stop.bind(e.osc);e.osc.stop=function(){try{o.stop();}catch(_){}return _stop();};}catch(_){}};}
{const _en=Snd.engine.bind(Snd);Snd.engine=function(ratio,thr){_en(ratio,thr);const e=this.eng;if(!e)return;const t=this.ctx.currentTime;
  if(e.sub){e.sub.o.frequency.setTargetAtTime(e.osc.frequency.value*.5,t,.05);e.sub.g.gain.setTargetAtTime(.06*e.sub.pr.sub*(.35+thr*.8+clamp(ratio,0,1)*.4),t,.08);}
  /* gear changes: a short rev drop blip (and an exhaust pop on sports machines) */
  const gears=e.EP.gears||1;if(gears>1&&thr){const gi=Math.min(gears-1,Math.floor(clamp(ratio,0,1.2)*gears));if(VA.lastGear>=0&&gi>VA.lastGear){
    if(e.sub&&e.sub.pr.pop)Snd.burst(.07,180,2,.25,'bandpass');else Snd.burst(.05,900,1,.06,'bandpass');}VA.lastGear=gi;}
  /* lifting off at high revs: turbo blow-off */
  if(e.sub&&e.sub.pr.turbo&&VA.lastThr&&!thr&&ratio>.45){Snd.burst(.35,3800,1.2,.12,'bandpass');Snd.tone([2400],.18,'sine',.025,.5);}
  VA.lastThr=thr;};}

/* ---------- tyre screech: drifting, hard cornering or locking up at speed ---------- */
function screechNode(){if(VA.screech||!Snd.ctx||!Snd.noise)return VA.screech;const c=Snd.ctx;const s=c.createBufferSource();s.buffer=Snd.noise;s.loop=true;
  const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1150;f.Q.value=6;const f2=c.createBiquadFilter();f2.type='peaking';f2.frequency.value=2300;f2.gain.value=9;
  const g=c.createGain();g.gain.value=0;s.connect(f);f.connect(f2);f2.connect(g);g.connect(Snd.master);s.start();VA.screech={s,f,g};return VA.screech;}
function vehAudioTick(dt){if(!Snd.ctx)return;const t=Snd.ctx.currentTime;const sp=Math.abs(P.s);
  const n=screechNode();if(n){let slip=0;if(!FOOT.on&&!FLY.on&&state==='play'){if(P.drift)slip=.9;else{const lat=Math.abs(P.steer)*sp/14;if(lat>.55)slip=(lat-.55)*1.4;if(input.brake&&sp>12)slip=Math.max(slip,.5);}
      if(VEH[P.type]&&VEH[P.type].cat==='two')slip*=.5;}
    n.g.gain.setTargetAtTime(clamp(slip,0,1)*.11,t,.06);n.f.frequency.setTargetAtTime(1000+sp*12,t,.1);}
  /* heavy vehicles: pneumatic air-brake hiss as they come to a stop */
  if(!FOOT.on&&state==='play'&&VEH[P.type]){const heavy=VEH[P.type].cat==='heavy';if(sp>4)VA.wasMoving=true;
    if(heavy&&VA.wasMoving&&sp<.6&&!input.gas){VA.wasMoving=false;Snd.burst(.75,4200,.6,.18,'highpass');}}
  trafficVoices(t);sirenDoppler(t);}

/* ---------- traffic engines: only the 4 closest vehicles within 35 m are heard, quieter and duller with distance ---------- */
function trafficVoices(t){const c=Snd.ctx;if(!c||!settings.sound)return;
  if(!VA.traffic.length){for(let i=0;i<4;i++){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=40;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=500;
    const g=c.createGain();g.gain.value=0;let pan=null;try{pan=c.createStereoPanner();}catch(_){}o.connect(lp);lp.connect(g);if(pan){g.connect(pan);pan.connect(Snd.master);}else g.connect(Snd.master);o.start();VA.traffic.push({o,lp,g,pan});}}
  const near=state==='play'?agents.map(a=>[a,Math.hypot(a.x-P.x,a.y-P.y)]).filter(x=>x[1]<35&&!x[0].fallen).sort((a,b)=>a[1]-b[1]).slice(0,4):[];
  const rx=CAM.right?CAM.right[0]:1,rz=CAM.right?CAM.right[2]:0;
  VA.traffic.forEach((v,i)=>{const it=near[i];if(!it){v.g.gain.setTargetAtTime(0,t,.2);return;}const[a,d]=it;const k=a.t.k;
    const base=a.t.two?55:k==='auto'?38:k==='bus'||k==='truck'||k==='tanker'?24:32;const f=base*(1+a.v/9);
    v.o.frequency.setTargetAtTime(f,t,.1);v.lp.frequency.setTargetAtTime(220+2400*(1-d/35)*(a.t.two?1.3:1),t,.15);
    const vol=(1-d/35)*(k==='bus'||k==='truck'?.03:.018)*(.4+Math.min(1,a.v/10)*.6);v.g.gain.setTargetAtTime(FOOT.on?vol*1.4:vol*.6,t,.15);
    if(v.pan){const dx=a.x-P.x,dz=a.y-P.y;v.pan.pan.setTargetAtTime(clamp((dx*rx+dz*rz)/Math.max(6,d),-.9,.9),t,.1);}});}

/* ---------- Doppler on the Hoysala siren: higher as it closes in, lower as it pulls away ---------- */
function sirenDoppler(t){const s=Snd.siren;if(!s||!s.o||!COP.list.length)return;let best=null,bd=1e9;for(const c of COP.list){const d=Math.hypot(c.x-P.x,c.y-P.y);if(d<bd){bd=d;best=c;}}
  if(!best)return;const dx=P.x-best.x,dy=P.y-best.y,d=Math.hypot(dx,dy)||1;const cv=(Math.sin(best.h)*dx-Math.cos(best.h)*dy)/d*(best.v||0);const pv=-(P.vx*dx+P.vy*dy)/d;
  const vr=clamp(cv+pv,-60,60);s.o.detune.setTargetAtTime(1731*vr/343,t,.1);}

/* ---------- air horns on buses and lorries: a two-chord blast ---------- */
{const _ho=Snd.hornOn.bind(Snd);Snd.hornOn=function(type){if(this.hornNodes)return;const cat=VEH[this.lastKey]?VEH[this.lastKey].cat:'';
  if(cat==='heavy'&&!FOOT.on&&this.ctx&&!this.sample(this.lastKey,cat,'horn')){const c=this.ctx,t=c.currentTime;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=1500;
    const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.08,t+.04);const os=[185,233,277].map(fq=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=fq;
      o.frequency.setValueAtTime(fq,t+.35);o.frequency.setValueAtTime(fq*1.122,t+.36);o.connect(f);o.start();return o;});f.connect(g);g.connect(this.master);this.hornNodes={os,g};return;}
  _ho(type);};}

/* ---------- impact sounds never stack: 0.15 s cooldown ---------- */
{const _sc=Snd.crash;Snd.crash=function(){const now=performance.now();if(now-VA.crashT<150){SFX.kind=null;SFX.k=null;return;}VA.crashT=now;return _sc.apply(this,arguments);};}

{const _lu4=lifeUpdate;lifeUpdate=function(dt){_lu4(dt);try{vehAudioTick(dt);}catch(e){}};}
setInterval(()=>{if(state!=='play'&&VA.traffic.length&&Snd.ctx){const t=Snd.ctx.currentTime;VA.traffic.forEach(v=>v.g.gain.setTargetAtTime(0,t,.1));if(VA.screech)VA.screech.g.gain.setTargetAtTime(0,t,.05);}},300);
Object.assign(window.__oosht||{},{VA,vaProfile});
