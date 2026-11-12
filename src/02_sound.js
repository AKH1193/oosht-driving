/* ================= audio ================= */
const Snd={
  ctx:null,master:null,eng:null,noise:null,hornNodes:null,siren:null,
  init(){
    if(this.ctx)return;
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    try{this.ctx=new AC();}catch(e){return;}
    this.master=this.ctx.createGain();this.master.gain.value=settings.sound?.7*(settings.vol??100)/100:0;this.master.connect(this.ctx.destination);
    const len=this.ctx.sampleRate;const b=this.ctx.createBuffer(1,len,this.ctx.sampleRate);const d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;this.noise=b;
  },
  resume(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();},
  setOn(on){if(this.master)this.master.gain.setTargetAtTime(on?.7*(settings.vol??100)/100:0,this.ctx.currentTime,.05);},
  /* optional real recordings: put files in www/sounds/ (engine_<vehicle>.ogg, engine_<two|three|car>.ogg, horn_<vehicle>.ogg ...) */
  bufs:{},tried:{},
  async loadSample(name){
    if(!this.ctx||this.tried[name])return this.bufs[name]||null;this.tried[name]=true;
    for(const ext of['ogg','mp3','m4a','wav']){try{const r=await fetch(`sounds/${name}.${ext}`);if(!r.ok)continue;const ab=await r.arrayBuffer();const b=await this.ctx.decodeAudioData(ab);this.bufs[name]=b;return b;}catch(e){}}
    return null;
  },
  preload(key,cat){if(!this.ctx)return;for(const n of[`engine_${key}`,`engine_${cat}`,`horn_${key}`,`horn_${cat}`])this.loadSample(n);},
  sample(key,cat,kind){return this.bufs[`${kind}_${key}`]||this.bufs[`${kind}_${cat}`]||null;},
  startEngine(E,key){
    if(!this.ctx)return;this.stopEngine();
    key=key||this.lastKey;this.lastKey=key;
    const c=this.ctx,EP=ENG[key]||{cyl:4,idle:800,max:6000,gears:5};const cat=VEH[key]?VEH[key].cat:'car';
    const g=c.createGain();g.gain.value=0;g.connect(this.master);
    const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=800;f.Q.value=1.2;f.connect(g);
    const nz=c.createBufferSource();nz.buffer=this.noise;nz.loop=true;const nf=c.createBiquadFilter();nf.type='bandpass';nf.frequency.value=EP.diesel?2600:1800;nf.Q.value=.8;const ng=c.createGain();ng.gain.value=0;nz.connect(nf);nf.connect(ng);ng.connect(this.master);nz.start();
    const buf=this.sample(key,cat,'engine');let src=null,osc=null;
    if(buf){src=c.createBufferSource();src.buffer=buf;src.loop=true;src.connect(f);f.frequency.value=12000;src.start();}
    else if(EP.ev){osc=c.createOscillator();osc.type='sine';osc.frequency.value=200;osc.connect(f);osc.start();}
    else{
      /* a pulse train at the cylinder firing rate: rich harmonics give the putt-putt of a single and the hum of a four */
      const n=72,re=new Float32Array(n),im=new Float32Array(n);
      for(let k=1;k<n;k++){let a=Math.pow(k,-(EP.p||.72));if(EP.thump&&k%2===0)a*=1.7;if(EP.rattle&&k%5===0)a*=1.8;if(EP.diesel&&k>20)a*=1.6;im[k]=a*(k%2?1:.85);re[k]=EP.thump?a*.3*Math.sin(k):0;}
      osc=c.createOscillator();osc.setPeriodicWave(c.createPeriodicWave(re,im));osc.frequency.value=EP.idle/60*EP.cyl/2;
      const ws=c.createWaveShaper();const cv=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;cv[i]=Math.tanh(x*2.2);}ws.curve=cv;
      osc.connect(ws);ws.connect(f);osc.start();
    }
    this.eng={g,f,src,osc,nz,ng,EP,E,buf};
  },
  stopEngine(){if(!this.eng)return;const e=this.eng;this.eng=null;try{const t=this.ctx.currentTime;e.g.gain.setTargetAtTime(0,t,.05);e.ng.gain.setTargetAtTime(0,t,.05);setTimeout(()=>{try{e.osc&&e.osc.stop();e.src&&e.src.stop();e.nz.stop();}catch(_){}} ,300);}catch(_){}},
  engine(ratio,throttle){
    if(!this.eng)return;const e=this.eng,t=this.ctx.currentTime,EP=e.EP;const r=clamp(ratio,0,1.25);
    const gears=EP.gears||1;let rr=r;if(gears>1){const gp=Math.min(gears-1,Math.floor(r*gears));rr=(r*gears-gp)*.7+.22+gp*.04;}else rr=.2+r*.8;
    rr=Math.max(rr,throttle?.26:.1);
    const rpm=EP.idle+(EP.max-EP.idle)*clamp(rr,0,1.1);
    if(e.buf){e.src.playbackRate.setTargetAtTime(clamp(rpm/(EP.sampleRpm||3000),.35,3),t,.08);}
    else if(EP.ev){e.osc.frequency.setTargetAtTime(180+r*900,t,.08);}
    else e.osc.frequency.setTargetAtTime(rpm/60*EP.cyl/2,t,.05);
    e.f.frequency.setTargetAtTime(e.buf?12000:(300+rpm/EP.max*3200+throttle*900),t,.08);
    const vol=(EP.ev?.05:.085)*(e.E&&e.E.vol||1);
    e.g.gain.setTargetAtTime(vol*(.55+throttle*.6+r*.35),t,.08);
    e.ng.gain.setTargetAtTime((EP.ev?.012:.02)*(throttle*.8+r*.6),t,.1);
  },
  burst(dur,freq,q,vol,type){
    if(!this.ctx)return;const c=this.ctx,t=c.currentTime;
    const s=c.createBufferSource();s.buffer=this.noise;
    const f=c.createBiquadFilter();f.type=type||'lowpass';f.frequency.value=freq;f.Q.value=q;
    const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
    s.connect(f);f.connect(g);g.connect(this.master);s.start(t);s.stop(t+dur+.05);
  },
  thud(k){this.burst(.18+.12*k,140,1,.35+.5*k);},
  crash(){this.burst(.6,900,.6,.7,'lowpass');this.burst(.3,90,1,.9);this.burst(.9,3200,.4,.25,'highpass');},
  splash(k){this.burst(.6,1800,.7,.18+.3*k,'bandpass');},
  tone(freqs,dur,wave,vol,slide){
    if(!this.ctx)return;const c=this.ctx,t=c.currentTime;
    for(const fq of freqs){const o=c.createOscillator();o.type=wave;o.frequency.setValueAtTime(fq,t);if(slide)o.frequency.exponentialRampToValueAtTime(fq*slide,t+dur);
      const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.setValueAtTime(vol,t+dur*.7);g.gain.linearRampToValueAtTime(0,t+dur);
      o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02);}
  },
  chime(){this.tone([660],.12,'triangle',.18);setTimeout(()=>this.tone([990],.22,'triangle',.18),110);},
  coin(){this.tone([1320],.08,'square',.06);},
  tick(){this.tone([1800],.04,'square',.05);},
  moo(){this.tone([150],.7,'sawtooth',.12,.72);},
  bark(){this.tone([520],.09,'sawtooth',.12,.6);setTimeout(()=>this.tone([480],.1,'sawtooth',.1,.6),140);},
  meow(){this.tone([700],.35,'triangle',.08,1.5);},
  yelp(){this.tone([900],.18,'triangle',.12,.5);},
  whistle(){this.tone([2400],.5,'sine',.08,1.05);},
  hornOn(type){
    if(!this.ctx||this.hornNodes)return;const c=this.ctx,t=c.currentTime;
    const hb=this.sample(this.lastKey,VEH[this.lastKey]?VEH[this.lastKey].cat:'car','horn');
    if(hb){const s=c.createBufferSource();s.buffer=hb;s.loop=true;const g=c.createGain();g.gain.value=.8;s.connect(g);g.connect(this.master);s.start();this.hornNodes={os:[s],g};return;}
    if(type==='pom'){this.tone([330],.22,'triangle',.3,.75);setTimeout(()=>this.tone([330],.22,'triangle',.3,.75),260);return;}
    const map={beep:[[470],'square',.09],beep2:[[410,520],'square',.07],car:[[415,520],'square',.08],suv:[[350,440],'sawtooth',.09],sport:[[520,650],'square',.08]};
    const [fs,w,v]=map[type]||map.car;
    const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=2200;
    const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);
    const os=fs.map(fq=>{const o=c.createOscillator();o.type=w;o.frequency.value=fq;o.connect(f);o.start();return o;});
    f.connect(g);g.connect(this.master);this.hornNodes={os,g};
  },
  hornOff(){if(!this.hornNodes)return;const h=this.hornNodes;this.hornNodes=null;try{h.g.gain.setTargetAtTime(0,this.ctx.currentTime,.02);setTimeout(()=>h.os.forEach(o=>{try{o.stop();}catch(_){}}),150);}catch(_){}},
  sirenOn(){
    if(!this.ctx||this.siren)return;const c=this.ctx;
    const o=c.createOscillator();o.type='sawtooth';o.frequency.value=700;
    const l=c.createOscillator();l.type='triangle';l.frequency.value=.55;
    const lg=c.createGain();lg.gain.value=260;l.connect(lg);lg.connect(o.frequency);
    const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=.8;
    const g=c.createGain();g.gain.value=0;o.connect(f);f.connect(g);g.connect(this.master);
    o.start();l.start();this.siren={o,l,g};
  },
  sirenVol(v){if(this.siren)this.siren.g.gain.setTargetAtTime(v,this.ctx.currentTime,.2);},
  sirenOff(){if(!this.siren)return;const s=this.siren;this.siren=null;try{s.g.gain.setTargetAtTime(0,this.ctx.currentTime,.1);setTimeout(()=>{try{s.o.stop();s.l.stop();}catch(_){}} ,500);}catch(_){}}
};

/* ================= haptics ================= */
const Hap={
  scale(){if(typeof settings.hapN==='number')return settings.hapN/100;return {off:0,low:.45,med:.75,high:1}[settings.haptics]??.75;},
  last:0,
  play(times,amps,force){
    const k=this.scale();if(!k)return;
    const now=performance.now();if(!force&&now-this.last<60)return;this.last=now;
    const a=amps.map(v=>Math.round(clamp(v*k,0,255)));times=times.map(t=>Math.max(0,Math.round(t)));
    try{
      if(window.OoshtNative&&OoshtNative.vibrate){OoshtNative.vibrate(times.join(','),a.join(','));return;}
      if(navigator.vibrate){
        const segs=[];times.forEach((t,i)=>{if(t<=0)return;const on=a[i]>0;if(segs.length&&segs[segs.length-1][1]===on)segs[segs.length-1][0]+=t;else segs.push([t,on]);});
        const pat=[];if(segs.length&&!segs[0][1])pat.push(0);segs.forEach(q=>pat.push(Math.round(q[0])));
        if(pat.length)navigator.vibrate(pat);
      }
    }catch(e){}
  },
  pothole(s){this.play([0,28+40*s,24,30+40*s],[0,120+135*s,0,80+120*s]);},
  bump(s,gap){this.play([0,40,gap,40],[0,70+185*s,0,60+170*s],true);},
  water(s){this.play([0,110,40,130,40,170],[0,70+60*s,25,60+50*s,20,45+40*s]);},
  rumble(){this.play([0,32],[0,60]);},
  tick(){this.play([0,18],[0,90],true);},
  crash(){this.play([0,220,60,120],[0,255,0,170],true);},
  bigCrash(){this.play([0,350,80,200,60,160],[0,255,0,230,0,180],true);},
  success(){this.play([0,40,70,60],[0,90,0,170],true);},
};
