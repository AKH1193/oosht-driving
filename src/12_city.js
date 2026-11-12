/* ================= WISE CITY: Bengaluru street life, weather, shadows, metro, buses, parking, jobs, police helicopter ================= */
for(const[k,v]of Object.entries({weather:'auto',btnOp:.85,btnSize:1,btnShape:'rounded',hudOp:1,mapSize:'M'}))if(settings[k]==null)settings[k]=v;
SETS.push(['weather','Weather',[['auto','Live (random rain)'],['clear','Always clear'],['rain','Raining']]],
  ['btnOp','Button opacity',[[.3,'30%'],[.55,'55%'],[.85,'85%'],[1,'100%']]],
  ['btnSize','Button size',[[.8,'Small'],[1,'Medium'],[1.15,'Large'],[1.3,'Extra large']]],
  ['btnShape','Button shape',[['round','Round'],['rounded','Rounded'],['square','Square']]],
  ['hudOp','HUD & map opacity',[[.45,'45%'],[.7,'70%'],[1,'100%']]],
  ['mapSize','Map size',[['S','Small'],['M','Medium'],['L','Large']]]);
function applyHudStyle(){
  const h=$('#hud').style;h.setProperty('--bo',settings.btnOp);h.setProperty('--bs',settings.btnSize);h.setProperty('--ho',settings.hudOp);
  const sh={round:['50%','40px','50%'],rounded:['20px','16px','50%'],square:['6px','6px','8px']}[settings.btnShape]||['20px','16px','50%'];
  h.setProperty('--rp',sh[0]);h.setProperty('--rq',sh[1]);h.setProperty('--rc',sh[2]);h.setProperty('--mm',typeof settings.mapSize==='number'?settings.mapSize+'px':({S:'84px',M:'108px',L:'144px'}[settings.mapSize]||'108px'));
}
applyHudStyle();
const mixv=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const polyLen=p=>{let L=0;for(let i=2;i<p.length;i+=2)L+=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1]);return L;};

/* ---------- weather: rain spells, wet roads, thunder ---------- */
const WX={rain:0,target:0,wet:0,next:150+Math.random()*200,flash:0,thunderT:20};
function updateWeather(dt){
  if(settings.weather==='rain')WX.target=1;else if(settings.weather==='clear')WX.target=0;
  else{WX.next-=dt;if(WX.next<=0){if(WX.target>0){WX.target=0;WX.next=300+Math.random()*420;}else if(Math.random()<.5){WX.target=.55+Math.random()*.45;WX.next=100+Math.random()*160;toast('Clouds rolling in. It is starting to rain.','');}else WX.next=200+Math.random()*260;}}
  WX.rain+=clamp(WX.target-WX.rain,-dt/25,dt/18);WX.wet=clamp(WX.wet+(WX.rain>.15?dt/35:-dt/150),0,1);
  WX.flash=Math.max(0,WX.flash-dt*3);
  if(WX.rain>.7){WX.thunderT-=dt;if(WX.thunderT<=0){WX.thunderT=15+Math.random()*30;WX.flash=1;setTimeout(()=>{Snd.burst(1.8,90,.7,.6);Snd.burst(.9,200,1,.25);},700+Math.random()*1500);}}
  rainSound(state==='play'?WX.rain:0);
}
const RAINS={src:null,g:null};
function rainSound(v){const c=Snd.ctx;if(!c||!Snd.noise)return;
  if(!RAINS.src){if(v<.02)return;const s=c.createBufferSource();s.buffer=Snd.noise;s.loop=true;const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=800;const f2=c.createBiquadFilter();f2.type='lowpass';f2.frequency.value=5200;const g=c.createGain();g.gain.value=0;s.connect(f);f.connect(f2);f2.connect(g);g.connect(Snd.master);s.start();RAINS.src=s;RAINS.g=g;}
  RAINS.g.gain.setTargetAtTime(v*.2,c.currentTime,.4);}
function wxFrame(){
  FU.wet=WX.wet;const r=WX.rain;if(r<=.01&&WX.flash<=0)return;
  const n=TOD.night,g=[.5,.53,.56].map(v=>v*(1-n*.82));
  FU.fogCol=mixv(FU.fogCol,g,r*.75);FU.sunCol=FU.sunCol.map(v=>v*(1-.78*r));FU.sky=mixv(FU.sky,[.42,.45,.5].map(v=>v*(1-n*.8)),r*.6);
  FU.fog=[FU.fog[0]*(1-.6*r),FU.fog[1]*(1-.5*r)];
  if(WX.flash>0){const f=WX.flash*.8;FU.sky=FU.sky.map(v=>v+f);FU.fogCol=FU.fogCol.map(v=>v+f*.4);}
}
function wxSky(){const r=WX.rain,n=TOD.night;if(r<=.01&&WX.flash<=0)return [TOD.top,TOD.hor,TOD.gnd.map(v=>v*1.2)];
  const g=[.42,.45,.5].map(v=>v*(1-n*.85)+WX.flash*.5);return [mixv(TOD.top,g.map(v=>v*.85),r*.85),mixv(TOD.hor,g,r*.8),mixv(TOD.gnd.map(v=>v*1.2),g.map(v=>v*.7),r*.7)];}
const RB=new GlowBatch(1000);let RP=null;
function drawRain(){
  const r=WX.rain;if(r<.03)return;
  if(!RP){RP=[];const rnd=mulberry32(77);for(let i=0;i<1000;i++)RP.push([rnd()*44-22,rnd()*44-22,rnd()*14,.75+rnd()*.5]);}
  RB.reset();const n=Math.floor(1000*r),ex=CAM.eye[0],ey=CAM.eye[1],ez=CAM.eye[2],T=performance.now()/1000,w=v=>v-44*Math.floor((v+22)/44);
  const col=[.78,.82,.9].map(v=>v*(1-TOD.night*.45));
  for(let i=0;i<n;i++){const q=RP[i];const x=ex+w(q[0]-ex),z=ez+w(q[1]-ez);const y=ey-7+((((q[2]-T*16*q[3])%14)+14)%14);RB.streak(x,y,z,.85,.022,col,CAM.right);}
  RB.draw(0,1.1);
  /* splashes on the ground near you */
  RB.reset();for(let i=0;i<n/5;i++){const q=RP[i];const ph=((T*2.2+q[3]*7)%1);const x=ex+w(q[1]*1.3-ex),z=ez+w(q[0]*1.3-ez);RB.bill(x,.04,z,.06+ph*.12,col.map(v=>v*(1-ph)),CAM.right);}RB.draw(0,.5);
}

/* ---------- sunlight shadows ---------- */
const SHV={view:M4.create(),proj:M4.create(),lvp:M4.create(),t:0,cx:1e9,cy:1e9,on:false,sun:[0,1,0]};
function ortho(o,l,r,b,t,n,f){o.fill(0);o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);o[15]=1;return o;}
function shadowPass(dt){
  const sd=FU.sunDir;
  if(settings.gfx==='fast'||TOD.night>.45||sd[1]<.1||WX.rain>.55||!SHM){FU.shOn=0;SHV.on=false;return;}
  const size=settings.gfx==='ultra'?2048:1536;if(!shadowTarget(size)){FU.shOn=0;return;}
  const ext=settings.gfx==='ultra'?150:125,dyn=settings.gfx==='ultra';
  SHV.t-=dt;const moved=Math.hypot(P.x-SHV.cx,P.y-SHV.cy),sunMoved=Math.abs(sd[0]-SHV.sun[0])+Math.abs(sd[2]-SHV.sun[2]);
  FU.lvp=SHV.lvp;FU.shTx=1/size;
  if(!dyn&&SHV.on&&SHV.t>0&&moved<12&&sunMoved<.02){FU.shOn=1;return;}
  SHV.t=.5;SHV.cx=P.x;SHV.cy=P.y;SHV.sun=sd.slice();
  const cx=P.x+Math.sin(CAM.yaw||P.h)*ext*.3,cz=P.y-Math.cos(CAM.yaw||P.h)*ext*.3;
  const up=Math.abs(sd[1])>.97?[0,0,1]:[0,1,0];
  M4.lookAt(SHV.view,[cx+sd[0]*350,sd[1]*350,cz+sd[2]*350],[cx,0,cz],up);
  const c=M4.xform(SHV.view,cx,0,cz),tx=2*ext/size,sx=Math.round(c[0]/tx)*tx,sy=Math.round(c[1]/tx)*tx;
  ortho(SHV.proj,sx-ext,sx+ext,sy-ext,sy+ext,1,800);M4.mul(SHV.lvp,SHV.proj,SHV.view);
  shadowBegin(SHV.lvp);
  for(const[,ch]of CHUNKS){const d=Math.hypot((ch.cx+.5)*CH-cx,(ch.cy+.5)*CH-cz);if(d>ext*1.45+CH)continue;drawShadow(ch.sol);drawShadow(ch.ads);if(ch.gls)drawShadow(ch.gls);}
  for(const s of METRO.sections)if(Math.hypot(s.x-cx,s.y-cz)<ext*1.5+160)drawShadow(s.mesh);
  for(const v of W.parkedV||[]){if(Math.hypot(v.x-cx,v.y-cz)>ext*1.4)continue;M4.model(TM,v.x,0,v.y,-v.h,0,0);drawShadow(pvModel(v).body,TM);}
  if(dyn){
    for(const a of agents){if(Math.hypot(a.x-P.x,a.y-P.y)>90)continue;M4.model(TM,a.x,0,a.y,-a.h,0,-a.lean);drawShadow(a.model.body,TM);if(a.model.rider)drawShadow(a.model.rider,TM);}
    if(FLY.on){}
    else if(!FOOT.on){const pm=curModel();drawShadow(pm.body,P.M);if(pm.rider)drawShadow(pm.rider,P.M);}
    else if(!METRO.ride&&!(FOOT.ride&&FOOT.ride.phase==='ride'))drawShadow(rig(PLOOK,SKINS[2],playerPose(),playerWeaponShown()),P.M);
    for(const p of peds){if(p.state==='down'||Math.hypot(p.x-P.x,p.y-P.y)>50)continue;M4.model(TM,p.x,0,p.y,-p.h,0,0,p.sc||1);const A=ANIM;const m=p.kind==='sit'?A.sit[p.v%A.sit.length]:p.kind==='lie'?null:A.ped[p.v%A.ped.length][p.pose||0];if(m)drawShadow(m,TM);}
  }
  shadowEnd();FU.shOn=1;SHV.on=true;
}

/* ---------- metro: elevated viaduct, stations, trains, smart card, rides ---------- */
const METRO={lines:[],sections:[],stations:[],trains:[],ride:null,v:-1};
const MCOL=[['#7B2D8E','Purple'],['#1E8A3C','Green'],['#E6A817','Yellow'],['#D9358A','Pink'],['#2F6FD0','Blue']];
function chainRails(pieces){
  const segs=pieces.map(p=>({pts:p.pts.slice(),tun:!!p.tun,used:false}));const out=[];const near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<2;
  const head=s=>[s.pts[0],s.pts[1]],tail=s=>[s.pts[s.pts.length-2],s.pts[s.pts.length-1]];
  for(const s of segs){if(s.used)continue;s.used=true;let line=s.pts.slice(),tun=s.tun,grew=true;
    while(grew){grew=false;for(const o of segs){if(o.used)continue;const lt=[line[line.length-2],line[line.length-1]],lh=[line[0],line[1]];
      if(near(lt,head(o))){line=line.concat(o.pts.slice(2));}else if(near(lt,tail(o))){const r=[];for(let i=o.pts.length-2;i>=0;i-=2)r.push(o.pts[i],o.pts[i+1]);line=line.concat(r.slice(2));}
      else if(near(lh,tail(o))){line=o.pts.slice(0,-2).concat(line);}else if(near(lh,head(o))){const r=[];for(let i=o.pts.length-2;i>=0;i-=2)r.push(o.pts[i],o.pts[i+1]);line=r.slice(0,-2).concat(line);}
      else continue;o.used=true;tun=tun&&o.tun;grew=true;}}
    out.push({pts:line,tun});}
  return out;
}
function resample(pts,step){const o=[pts[0],pts[1]];let carry=0;for(let i=2;i<pts.length;i+=2){const ax=pts[i-2],ay=pts[i-1],bx=pts[i],by=pts[i+1];const L=Math.hypot(bx-ax,by-ay);let t=step-carry;while(t<=L){o.push(ax+(bx-ax)*t/L,ay+(by-ay)*t/L);t+=step;}carry=L-(t-step);}
  if(Math.hypot(o[o.length-2]-pts[pts.length-2],o[o.length-1]-pts[pts.length-1])>1)o.push(pts[pts.length-2],pts[pts.length-1]);return o;}
function lineAt(l,s){s=clamp(s,0,l.len);let i=Math.min(l.cum.length-2,Math.max(0,Math.floor(s/l.step)));while(i>0&&l.cum[i]>s)i--;while(i<l.cum.length-2&&l.cum[i+1]<s)i++;
  const p=l.pts,ax=p[2*i],ay=p[2*i+1],bx=p[2*i+2],by=p[2*i+3],L=(l.cum[i+1]-l.cum[i])||1,t=(s-l.cum[i])/L;return {x:ax+(bx-ax)*t,y:ay+(by-ay)*t,h:hAng(bx-ax,by-ay)};}
function lineProject(l,x,y){let best=1e9,bs=0;const p=l.pts;for(let i=0;i<l.cum.length-1;i++){const ax=p[2*i],ay=p[2*i+1],bx=p[2*i+2],by=p[2*i+3];const L=l.cum[i+1]-l.cum[i]||1;const t=clamp(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/(L*L),0,1);const d=Math.hypot(ax+(bx-ax)*t-x,ay+(by-ay)*t-y);if(d<best){best=d;bs=l.cum[i]+t*L;}}return {d:best,s:bs};}
function buildMetro(data){
  for(const s of METRO.sections)freeMesh(s.mesh);METRO.sections=[];METRO.piers=[];METRO.lines=[];METRO.stations=[];METRO.trains=[];
  let raw=[];
  if(data.rails&&data.rails.length)raw=chainRails(data.rails).filter(l=>polyLen(l.pts)>250);
  if(!raw.length){const groups=new Map();for(const w of W.ways){if(RANK[w.cls]<2||w.br)continue;const k=(w.name||w.cls)+(w.oneway?'|1':'');if(!groups.has(k))groups.set(k,[]);groups.get(k).push({pts:w.pts,tun:false,w});}
    const ws=[];for(const[k,g]of groups){for(const ch of chainRails(g))ws.push({w:{oneway:/\|1$/.test(k),hw:g[0].w.hw},pts:ch.pts,L:polyLen(ch.pts)});}
    ws.sort((a,b)=>(b.w.oneway?0:1)-(a.w.oneway?0:1)||b.L-a.L);
    const c=ws.find(o=>o.L>400)||ws[0];if(c&&c.L>300){let pts=c.pts.slice();if(c.w.oneway){const o=[];for(let i=0;i<pts.length;i+=2){const a=Math.max(0,i-2),b=Math.min(pts.length-2,i+2);const dx=pts[b]-pts[a],dy=pts[b+1]-pts[a+1],l=Math.hypot(dx,dy)||1;o.push(pts[i]-dy/l*(c.w.hw+1.5),pts[i+1]+dx/l*(c.w.hw+1.5));}pts=o;}raw=[{pts,tun:false,proc:true}];}}
  raw.forEach((r,k)=>{const pts=resample(r.pts,8);const cum=[0];for(let i=2;i<pts.length;i+=2)cum.push(cum[cum.length-1]+Math.hypot(pts[i]-pts[i-2],pts[i+1]-pts[i-1]));
    METRO.lines.push({pts,cum,len:cum[cum.length-1],step:8,tun:r.tun,col:MCOL[k%MCOL.length],idx:k});});
  /* stations: real ones from the map, otherwise every kilometre */
  for(const q of W.pois){if(!(q.cls==='railway'||/metro/i.test(q.name))||!/station|subway|halt|light_rail|metro/i.test(q.sub+' '+q.name))continue;
    for(const l of METRO.lines){const pr=lineProject(l,q.x,q.y);if(pr.d<70&&pr.s>30&&pr.s<l.len-30&&!METRO.stations.some(s=>s.l===l&&Math.abs(s.s-pr.s)<250)){METRO.stations.push({l,s:pr.s,name:q.name.replace(/\s*(metro station|metro|station)$/i,'')});break;}}}
  for(const l of METRO.lines){if(METRO.stations.filter(s=>s.l===l).length>=2)continue;
    for(let s=280;s<l.len-120;s+=950){if(METRO.stations.some(t=>t.l===l&&Math.abs(t.s-s)<400))continue;const p=lineAt(l,s);
      let nm=null,bd=900;for(const pl of W.places){const d=Math.hypot(pl.x-p.x,pl.y-p.y);if(d<bd){bd=d;nm=pl.name;}}
      if(!nm){const n=nearestSeg(p.x,p.y,60);nm=n.seg&&n.seg.w.name?n.seg.w.name:'Central';}
      if(METRO.stations.some(t=>t.name===nm))nm=nm+' Cross';METRO.stations.push({l,s,name:nm});}}
  METRO.stations.sort((a,b)=>a.l.idx-b.l.idx||a.s-b.s);
  for(const st of METRO.stations){const p=lineAt(st.l,st.s);st.x=p.x;st.y=p.y;st.h=p.h;const nx=-Math.cos(p.h),ny=-Math.sin(p.h);
    st.e=[[p.x+nx*12.5,p.y+ny*12.5],[p.x-nx*12.5,p.y-ny*12.5]].map(e=>{for(let k=0;k<6&&inBuilding(e[0],e[1]);k++){e[0]-=nx*Math.sign((e[0]-p.x)*nx+(e[1]-p.y)*ny);e[1]-=ny*Math.sign((e[0]-p.x)*nx+(e[1]-p.y)*ny);}return e;});}
  /* geometry in 240 m pieces */
  const grey=[.72,.71,.68],dk=[.45,.45,.46];
  for(const l of METRO.lines){if(l.tun)continue;const n=l.pts.length/2;
    for(let i0=0;i0<n-1;i0+=30){const mb=new MB();const i1=Math.min(n-1,i0+30);
      for(let i=i0;i<i1;i++){const ax=l.pts[2*i],ay=l.pts[2*i+1],bx=l.pts[2*i+2],by=l.pts[2*i+3];const L=Math.hypot(bx-ax,by-ay);if(L<.1)continue;const h=hAng(bx-ax,by-ay);
        mb.save();mb.tr((ax+bx)/2,0,(ay+by)/2);mb.rotY(-h);
        mb.tbox(0,9.2,0,3.2,L+.05,8.6,L+.05,1.1,grey);mb.box(0,10.45,0,8.8,.3,L+.05,grey);
        for(const s of[-1,1]){mb.box(s*4.3,11.05,0,.22,.9,L+.05,[.8,.79,.76]);mb.box(s*1.6,10.66,0,.12,.12,L+.05,dk);mb.box(s*2.6,10.66,0,.12,.12,L+.05,dk);}
        if(i%4===0){mb.cyl(0,4.6,0,.85,9.2,'y',12,grey);mb.tbox(0,8.4,0,1.8,1.8,3.4,2.2,.8,grey);}
        if(i%2===0)mb.box(3.6,12.6,0,.08,3.4,.08,dk);
        mb.restore();}
      if(i0===0)for(const st of METRO.stations)if(st.l===l)stationGeo(mb,st);
      const mid=lineAt(l,l.cum[Math.floor((i0+i1)/2)]);METRO.sections.push({mesh:mb.mesh(),x:mid.x,y:mid.y});
      /* pier collisions */
      for(let i=Math.ceil(i0/4)*4;i<i1;i+=4){const x=(l.pts[2*i]+l.pts[2*i+2])/2,y=(l.pts[2*i+1]+l.pts[2*i+3])/2;const o={x,y,r:.95,pier:true,_q:0};METRO.piers.push(o);gAdd(W.tG,Math.floor(x/CELL),Math.floor(y/CELL),o);}}}
  for(const l of METRO.lines){if(l.tun)continue;for(let k=0;k<2;k++)METRO.trains.push({l,s:k?l.len*.7:l.len*.2,dir:k?-1:1,v:0,dwell:0,cars:3});}
}
function stationGeo(mb,st){
  mb.save();mb.tr(st.x,0,st.y);mb.rotY(-st.h);
  const wall=[.9,.89,.86],gl=[.35,.5,.6],col=hexRGB(st.l.col[0]);
  mb.box(0,9.6,0,24,1.2,64,[.7,.69,.66]);mb.box(0,11.9,0,24,.25,62,[.82,.81,.79]);
  for(const s of[-1,1]){mb.box(s*11.8,14.2,0,.3,4.6,60,gl,.15);mb.box(s*11.8,16.7,0,.4,.5,62,col,.3);}
  mb.box(0,17.2,0,25,.5,66,[.85,.85,.86]);mb.tbox(0,17.4,0,25,66,10,60,2.2,[.78,.79,.82]);
  for(const z of[-24,-8,8,24])for(const s of[-1,1])mb.cyl(s*7,4.8,z,.7,9.6,'y',10,[.72,.71,.68]);
  /* staircases down to both footpaths */
  for(const s of[-1,1]){for(let k=0;k<14;k++){const y=k*.72,zz=-6+k*.95;mb.box(s*13.4,y/2+.05,zz,2.6,y+.1,.95,[.75,.74,.71]);}
    mb.box(s*12.4,5.6,7,.12,11.2,.12,[.5,.5,.5]);mb.box(s*14.6,5.6,7,.12,11.2,.12,[.5,.5,.5]);mb.box(s*13.5,11,6.5,3.2,.25,3.4,[.7,.69,.66]);}
  mb.restore();
}
function metroCar(colHex,front){
  const key='mcar:'+colHex+front;let m=MODELS.get(key);if(m)return m;const mb=new MB();const c=hexRGB(colHex),L=20.5,W=2.9;
  mb.box(0,1.95,0,W,2.9,L,[.88,.89,.9]);mb.box(0,1.15,0,W+.02,.45,L-.2,c);mb.box(0,3.05,0,W+.02,.18,L-.2,c);
  mb.box(0,2.15,0,W+.03,.9,L-1.2,[.12,.15,.2],.1);
  for(const z of[-6,0,6])for(const s of[-1,1])mb.box(s*(W/2+.02),1.85,z,.02,2.1,1.3,[.75,.76,.78]);
  if(front){mb.box(0,2.3,-L/2-.05,W-.3,1.2,.1,[.1,.12,.16],.2);mb.box(0,1.1,-L/2-.06,W-.4,.3,.08,c);for(const s of[-1,1])mb.box(s*1,1.4,-L/2-.08,.25,.12,.04,[1,.95,.8],1);}
  mb.box(0,3.5,0,1.6,.18,L*.5,[.6,.6,.62]);
  m={body:mb.mesh(),len:L};MODELS.set(key,m);return m;
}
function updateMetro(dt){
  for(const t of METRO.trains){const l=t.l;if(t.dwell>0){t.dwell-=dt;t.v=0;continue;}
    const sts=METRO.stations.filter(s=>s.l===l&&(s.s-t.s)*t.dir>2);const next=sts.length?sts.reduce((a,b)=>Math.abs(a.s-t.s)<Math.abs(b.s-t.s)?a:b):null;
    const end=t.dir>0?l.len-12:12;const stopAt=next?next.s:end;const dist=Math.abs(stopAt-t.s);
    const vt=Math.min(22,Math.sqrt(2*1.1*dist));t.v+=clamp(vt-t.v,-2.5*dt,1.2*dt);t.s+=t.dir*Math.max(t.v,dist>1?.6:0)*dt;
    if(dist<1.2){t.s=stopAt;t.v=0;t.dwell=next?14:8;if(!next)t.dir=-t.dir;}}
  const R=METRO.ride;if(!R)return;
  R.t+=dt;
  if(R.phase==='wait'){$('#rideTxt').textContent=`Platform ${R.dir>0?1:2} · train arriving in ${Math.max(0,Math.ceil(5-R.t))} s`;if(R.t>5){R.phase='ride';R.t=0;Snd.tone([660,550],.25,'sine',.05);}return;}
  const dist=Math.abs(R.s1-R.s);const vt=Math.min(24,Math.sqrt(2*1.2*dist)+.5);R.v+=clamp(vt-R.v,-3*dt,1.4*dt);R.s+=R.dir*R.v*dt;
  const p=lineAt(R.l,R.s);P.x=p.x;P.y=p.y;P.h=R.dir>0?p.h:p.h+Math.PI;P.s=R.v;
  $('#rideTxt').textContent=`Metro to ${R.to.name} · ${Math.round(dist)} m`;
  if(dist<1||(R.dir>0?R.s>=R.s1:R.s<=R.s1))metroArrive();
}
function metroArrive(){
  const R=METRO.ride;if(!R)return;const st=R.to;const e=st.e[0];P.x=e[0];P.y=e[1];P.h=st.h;P.s=0;M4.model(P.M,P.x,0,P.y,-P.h,0,0);
  METRO.ride=null;$('#rideBar').hidden=true;$('#footBar').hidden=false;toast(`Arrived at ${st.name} Metro`,'good');Snd.chime();
}
function metroCam(){
  const R=METRO.ride;if(!R)return;const p=lineAt(R.l,R.s),h=R.dir>0?p.h:p.h+Math.PI;const fx=Math.sin(h),fy=-Math.cos(h);
  let eye,tgt;
  if(R.phase==='wait'){const st=R.from;eye=[st.x-fx*42-fy*20,19,st.y-fy*42+fx*20];tgt=[st.x,12,st.y];}
  else if(CAM.mode==='cockpit'){eye=[p.x-fy*1.1+fx*2,12.4,p.y+fx*1.1+fy*2];tgt=[p.x-fy*8+fx*12,11.6,p.y+fx*8+fy*12];}
  else{eye=[p.x-fx*26-fy*9,17,p.y-fy*26+fx*9];tgt=[p.x+fx*10,11,p.y+fy*10];}
  CAM.eye=eye;CAM.tgt=tgt;M4.lookAt(CAM.view,eye,tgt,[0,1,0]);M4.mul(CAM.vp,CAM.proj,CAM.view);M4.invert(CAM.inv,CAM.vp);
  const rx=CAM.view[0],rz=CAM.view[8];CAM.right=[rx,0,rz];
}
function drawMetro(ex,ez,night){
  for(const s of METRO.sections)if(Math.hypot(s.x-ex,s.y-ez)<700)drawLit(s.mesh,null,{emiK:.3+night*.5});
  for(const t of METRO.trains){const cs=t.l.col[0];for(let k=0;k<t.cars;k++){const s=t.s-t.dir*k*21;if(s<0||s>t.l.len)continue;const p=lineAt(t.l,s);if(Math.hypot(p.x-ex,p.y-ez)>650)continue;
    const h=t.dir>0?p.h:p.h+Math.PI;M4.model(TM,p.x-Math.cos(h)*1.6*0,10.62,p.y,-h,0,0);drawLit(metroCar(cs,k===0).body,TM,{emiK:.4+night*.8});}}
  const R=METRO.ride;if(R&&R.phase==='ride'){const cs=R.l.col[0];for(let k=0;k<3;k++){const s=R.s-R.dir*k*21;const p=lineAt(R.l,clamp(s,0,R.l.len));const h=R.dir>0?p.h:p.h+Math.PI;M4.model(TM,p.x,10.62,p.y,-h,0,0);drawLit(metroCar(cs,k===0).body,TM,{emiK:.4+night*.8});}}
  for(const st of METRO.stations){if(Math.hypot(st.x-ex,st.y-ez)>500)continue;
    const sg=makeSign('metro:'+st.name+st.x.toFixed(0),(mb,fb)=>{const nx=-Math.cos(st.h),ny=-Math.sin(st.h);for(const s of[-1,1])signQuad(mb,st.x+nx*12.1*s,st.y+ny*12.1*s,12.3,nx*s,ny*s,14,1.75);
      for(const e of st.e){const ox=e[0]-st.x,oy=e[1]-st.y,l=Math.hypot(ox,oy)||1;fb.box(e[0],1.4,e[1],.12,2.8,.12,[.4,.4,.42]);signQuad(mb,e[0],e[1],2.8,ox/l,oy/l,2.4,.6,null,true);}});
    drawSignMesh(sg,stationTex(st).tex,night);}
}
function stationTex(st){return textTex('stn:'+st.name+st.l.idx,(c,w,h)=>{c.fillStyle='#FFFFFF';c.fillRect(0,0,w,h);c.fillStyle=st.l.col[0];c.fillRect(0,0,h,h);c.fillStyle='#FFF';c.font='800 74px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('M',h/2,h/2+4);
  c.fillStyle='#222';c.textAlign='left';let fs=58;c.font=`700 ${fs}px "Barlow Semi Condensed", Arial, sans-serif`;const t=st.name.toUpperCase()+' METRO STATION';while(c.measureText(t).width>w-h-30&&fs>26){fs-=3;c.font=`700 ${fs}px "Barlow Semi Condensed", Arial, sans-serif`;}c.fillText(t,h+18,h/2+2);},1024,128);}
function openMetro(st){
  state='metro';releaseAll();const card=profile.metro;
  $('#mtTitle').textContent=`${st.name} Metro Station`;
  $('#mtSub').textContent=card?`${st.l.col[1]} Line · smart card balance ₹${fmtINR(card.bal)} · wallet ₹${fmtINR(profile.wallet)}`:`${st.l.col[1]} Line · buy a smart card to travel · wallet ₹${fmtINR(profile.wallet)}`;
  const box=$('#mtItems');box.innerHTML='';
  const add=(n,e,price,fn,dis)=>{const b=document.createElement('button');b.className='vitem';b.innerHTML='<span class="n"></span><span class="e"></span><b></b>';b.querySelector('.n').textContent=n;b.querySelector('.e').textContent=e;b.querySelector('b').textContent=price;b.disabled=!!dis;b.addEventListener('click',fn);box.appendChild(b);};
  if(!card)add('Metro smart card','Pay ₹50 at the counter, then top it up','₹50',()=>{profile.wallet-=50;profile.metro={bal:0};saveProfile();Snd.coin();openMetro(st);},profile.wallet<50);
  else{for(const amt of[100,200,500])add(`Top up ₹${amt}`,'Adds to your card balance','₹'+amt,()=>{profile.wallet-=amt;profile.metro.bal+=amt;saveProfile();Snd.coin();openMetro(st);},profile.wallet<amt);
    for(const t of METRO.stations){if(t===st||t.l!==st.l)continue;const km=Math.abs(t.s-st.s)/1000;const fare=Math.min(60,Math.round(10+km*4));
      add(`To ${t.name}`,`${km.toFixed(1)} km · ${t.l.col[1]} Line`,'₹'+fare,()=>{profile.metro.bal-=fare;saveProfile();startMetro(st,t);},card.bal<fare||st.l.tun);}}
  if(st.l.tun)add('Underground line','Trains run below ground here; this station only sells cards','',()=>{},true);
  show('metroScr');
}
function startMetro(from,to){
  state='play';show('play');footHud(true);METRO.ride={l:from.l,from,to,s:from.s,s1:to.s,dir:to.s>from.s?1:-1,v:0,t:0,phase:'wait'};
  $('#footBar').hidden=true;$('#rideBar').hidden=false;$('#rbSkip').hidden=false;Snd.chime();toast('Tap in at the gate. Head up to the platform.','good');
}
$('#mtClose').addEventListener('click',()=>{state='play';show('play');footHud(true);});

/* ---------- BMTC buses and bus stops ---------- */
const LIVERIES={ordinary:['#B5272D','#F2F0EA','500D'],vajra:['#2B5BB8','#C9CED6','V-335E'],green:['#2E8B3E','#F2F0EA','G-4'],ev:['#F4F6F4','#2FA84F','201R']};
function bmtcLivery(){const k=Object.keys(LIVERIES);return k[Math.floor(Math.random()*k.length)];}
function buildBMTC(liv){
  const Lv=LIVERIES[liv]||LIVERIES.ordinary;const mb=new MB();const L=11.6,W=2.55,H=3.15;const A=hexRGB(Lv[0]),B=hexRGB(Lv[1]);
  mb.box(0,.85,0,W,1.0,L,A);mb.box(0,1.95,0,W+.01,1.15,L-.1,liv==='vajra'?[.08,.1,.13]:C.glass);
  if(liv!=='vajra')for(let z=-L/2+.9;z<L/2-.5;z+=1.25)for(const s of[-1,1])mb.box(s*(W/2+.008),1.95,z,.02,1.15,.1,A);
  mb.box(0,2.8,0,W,.55,L,B);mb.box(0,1.38,0,W+.02,.1,L,B);if(liv==='ev')mb.box(0,1.2,0,W+.03,.18,L,hexRGB('#2FA84F'));
  mb.box(0,1.8,-L/2-.005,W-.2,1.45,.02,C.glass);mb.box(0,.95,-L/2-.01,W,.4,.04,A);
  for(const s of[-1,1]){mb.box(s*(W/2-.3),.62,-L/2-.005,.3,.14,.02,C.light,1);mb.box(s*(W/2-.25),.8,L/2+.005,.2,.3,.02,C.tail,.7);}
  mb.box(-W/2-.005,1.3,-L/2+1.5,.02,2.2,.95,C.dark);mb.box(-W/2-.005,1.3,1.4,.02,2.2,.95,C.dark);
  for(const z of[-L/2+2.1,L/2-2.6])for(const s of[-1,1])wheel(mb,s*(W/2-.2),.52,z,.52,.34);
  mb.box(0,.5,L/2+.01,.5,.14,.02,C.plateY);mb.box(0,3.12,1,1.8,.14,3,[.5,.5,.52]);
  const dm=new MB();
  for(const s of[-1,1]){const x=s*(W/2+.012);const z0=-L/2+3,z1=L/2-1;dm.quad([x,2.55,s>0?z0:z1],[x,2.55,s>0?z1:z0],[x,3.05,s>0?z1:z0],[x,3.05,s>0?z0:z1],[1,1,1],[s,0,0],[0,.5,1,.5,1,0,0,0]);}
  dm.quad([-.85,2.6,-L/2-.03],[.85,2.6,-L/2-.03],[.85,3.0,-L/2-.03],[-.85,3.0,-L/2-.03],[1,1,1],[0,0,-1],[0,1,1,1,1,.5,0,.5]);
  return {body:mb.mesh(),len:L,wid:W,eye:[.75,2.2,-L/2+.9],lights:{head:[[-.95,.62,-L/2],[.95,.62,-L/2]],tail:[[-1,.8,L/2],[1,.8,L/2]]},decal2:{mesh:dm.mesh(),tex:()=>bmtcTex(liv)}};
}
function bmtcTex(liv){const Lv=LIVERIES[liv]||LIVERIES.ordinary;return textTex('bmtc:'+liv,(c,w,h)=>{
  c.fillStyle=Lv[1];c.fillRect(0,0,w,h/2);c.fillStyle=liv==='ev'?'#1B6E33':Lv[0];c.font='800 42px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('BMTC',w*.3,h/4);
  c.font='600 26px Arial, sans-serif';c.fillText(liv==='vajra'?'VAJRA · A/C':liv==='ev'?'ELECTRIC':liv==='green'?'BIG CIRCLE':'CITY SERVICE',w*.72,h/4);
  c.fillStyle='#111';c.fillRect(0,h/2,w,h/2);c.fillStyle='#FFB300';c.font='700 46px "Courier New", monospace';c.fillText(Lv[2]+'  MAJESTIC',w/2,h*.75);},512,128);}
function busStopTex(){return textTex('busstop',(c,w,h)=>{c.fillStyle='#0E4D92';c.fillRect(0,0,w,h);c.fillStyle='#FFF';c.font='800 50px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('BUS STOP',w*.42,h*.42);c.font='600 22px Arial, sans-serif';c.fillText('BMTC · 500D · 201R · G-4 · V-335E',w*.42,h*.8);c.fillStyle='#FFC72C';c.beginPath();c.arc(w*.9,h/2,h*.32,0,TAU);c.fill();c.fillStyle='#0E4D92';c.font='800 40px Arial';c.fillText('B',w*.9,h/2+2);},512,128);}

/* ---------- city layout extras: bus stops, parked vehicles, parking lots, work sites ---------- */
const CITY={taken:new Set(),works:[],workers:[],heli:null,alarmT:0};
function buildCity(data){
  W.busStops=[];W.parkedV=[];W.lots=[];W.bsG=new Map();W.pvG=new Map();
  for(const s of W.segs){
    if(s.len<25||s.w.br)continue;const rk=RANK[s.w.cls]??0;const hs=hash2(Math.round(s.ax*3+s.by*7),Math.round(s.ay*3-s.bx*5))>>>0;const r=mulberry32(hs);
    const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;
    /* bus stops on main roads, one each side */
    if(rk>=2&&s.len>60&&r()<.32){for(const side of[1,-1]){const t=s.len*(.3+r()*.4);const[x,y]=segPt(s,t,(s.w.hw+1.7)*side);if(inBuilding(x,y)||nearSignal(x,y,18)||!roadClear(x,y,.6))continue;
      if(W.busStops.some(b=>Math.hypot(b.x-x,b.y-y)<250))continue;const b={x,y,h:side>0?s.h:s.h+Math.PI,side,s,key:'b'+hs+side};W.busStops.push(b);gAddBox(W.bsG,x,y,x,y,b);}}
    /* cars parked along wide roads, bikes on footpath edges */
    if(s.w.hw>=4.6&&!s.w.oneway&&r()<.35){const side=r()<.5?1:-1;const n=1+Math.floor(r()*3);for(let k=0;k<n;k++){const t=s.len*(.15+r()*.7);const[x,y]=segPt(s,t,(s.w.hw+1.15)*side);if(inBuilding(x,y)||!roadClear(x,y,.2)||nearSignal(x,y,15)||W.parkedV.some(v=>Math.hypot(v.x-x,v.y-y)<5.6))continue;
      const tk=['hatch','hatch','sedan','suv','auto','regent','monarch'][Math.floor(r()*7)];addParked(tk,x,y,side>0?s.h:s.h+Math.PI,'k'+hs+'_'+k,r);}}
    if(rk<=2&&r()<.28){const side=r()<.5?1:-1;const t=s.len*(.2+r()*.6);const n=2+Math.floor(r()*4);for(let k=0;k<n;k++){const[x,y]=segPt(s,t+k*.9,(s.w.hw+.9)*side);if(inBuilding(x,y)||!roadClear(x,y,.2))continue;
      const tk=['saathi','sakhi','pratham','bijli','rocket','maharaja'][Math.floor(r()*6)];addParked(tk,x,y,s.h+(side>0?Math.PI/2:-Math.PI/2)+(r()-.5)*.2,'w'+hs+'_'+k,r);}}
    /* parking lots on empty plots beside main roads */
    if(rk>=2&&s.len>70&&r()<.05){const side=r()<.5?1:-1;const t=s.len*.5;const[x,y]=segPt(s,t,(s.w.hw+11)*side);const h=side>0?s.h+Math.PI/2:s.h-Math.PI/2;
      if(!W.lots.some(l=>Math.hypot(l.x-x,l.y-y)<150)&&clearLot(x,y,h,12.5,8,false)){const lot={x,y,h};W.lots.push(lot);const fx=Math.sin(h),fy=-Math.cos(h),rx=-fy,ry=fx;
        for(let k=-4;k<=4;k++){if(r()<.35)continue;const bx=x+rx*k*2.7+fx*3.5,by=y+ry*k*2.7+fy*3.5;addParked(['hatch','sedan','suv','monarch','regent','zephyr'][Math.floor(r()*6)],bx,by,h,'L'+hs+'_'+k,r);}}}
  }
  /* work sites: godowns with lorries to load or unload */
  CITY.works=[];CITY.workers=[];
  const segsN=W.segs.filter(s=>s.len>35&&!s.w.br&&s.w.hw>=3).map(s=>({s,d:Math.hypot((s.ax+s.bx)/2-P.x,(s.ay+s.by)/2-P.y)})).filter(o=>o.d>60&&o.d<900).sort((a,b)=>a.d-b.d);
  const names=['Sri Lakshmi Traders godown','KR Market wholesale','Annapoorna Rice Depot','Balaji Cement Agency','Yeshwanthpur APMC yard','Ganesh Kirana Wholesale'];
  for(const o of segsN){if(CITY.works.length>=4)break;const s=o.s;for(const side of[1,-1]){const[x,y]=segPt(s,s.len*.5,(s.w.hw+1.6)*side);const ux=(x-(s.ax+s.bx)/2),uy=(y-(s.ay+s.by)/2),ul=Math.hypot(ux,uy)||1;
      const wf=wallFacing(x+ux/ul*2.5,y+uy/ul*2.5,-ux/ul,-uy/ul);if(!wf)continue;if(CITY.works.some(w=>Math.hypot(w.gx-x,w.gy-y)<250))continue;
      const h=side>0?s.h:s.h+Math.PI;const[lx,ly]=segPt(s,s.len*.5+(side>0?-3:3),(s.w.hw-1.25)*side);const fx=Math.sin(h),fy=-Math.cos(h);
      const kind=CITY.works.length%2?'load':'unload';
      CITY.works.push({x:lx,y:ly,h,rx:lx-fx*4.6,ry:ly-fy*4.6,gx:x,gy:y,wall:wf,name:names[CITY.works.length%names.length],kind,onLorry:kind==='unload'?12:0,inGodown:kind==='unload'?0:12,reset:0});break;}}
  for(const w of CITY.works)for(let k=0;k<2;k++)CITY.workers.push({w,t:k*4.5,carry:k===0,x:w.gx,y:w.gy,h:0});
}
function addParked(tk,x,y,h,key,r){if(CITY.taken.has(key))return;const t=TT.find(q=>q.k===tk);if(!t)return;const col=t.cols?t.cols[Math.floor(r()*t.cols.length)]:null;
  const v={x,y,h,t,col,key,len:t.len,wid:t.wid};W.parkedV.push(v);gAddBox(W.pvG,x,y,x,y,v);}
function pvModel(v){return v.m||(v.m=trafficModel(v.t,v.col));}
/* chunk geometry: poles and wires, garbage heaps, bus shelters, parking lot paint */
function cityChunk(sol,dec,mine,inC){
  const cem=[.66,.65,.62],wireC=[.08,.08,.08];
  for(const s of mine){const w=s.w;if(w.br||s.len<20)continue;const rk=RANK[w.cls]??0;if(rk>3)continue;
    const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;const hs=hash2(Math.round(s.ax*11),Math.round(s.ay*13))>>>0;const r=mulberry32(hs);
    const side=(hs&1)?1:-1,off=w.hw+3.0;const poles=[];
    for(let t=6+r()*8;t<s.len-4;t+=32){const x=s.ax+dx*t+dy*off*side,y=s.ay+dy*t-dx*off*side;if(inBuilding(x,y)||nearSignal(x,y,6)||!roadClear(x,y,.6)){poles.push(null);continue;}
      const pkey='pole'+Math.round(x*10)+'_'+Math.round(y*10);if(PDOWN.has(pkey)){poles.push(null);continue;}
      sol.box(x,4.25,y,.24,8.5,.24,cem);gAdd(W.tG,Math.floor(x/CELL),Math.floor(y/CELL),{x,y,r:.22,col:true,pole:{key:pkey,x,y,h:s.h},_q:0});sol.save();sol.tr(x,7.9,y);sol.rotY(-s.h);sol.box(0,0,0,1.6,.12,.12,cem);for(const q of[-.7,0,.7])sol.box(q,.13,0,.06,.14,.06,[.85,.85,.8]);sol.restore();
      if(poles.length%4===2){sol.box(x-dy*side*.55,5.2,y+dx*side*.55,.9,1.2,.7,[.4,.42,.4]);sol.box(x-dy*side*.55,4.4,y+dx*side*.55,1,.12,.8,[.3,.3,.3]);}
      poles.push([x,y]);}
    for(let i=1;i<poles.length;i++){const a=poles[i-1],b=poles[i];if(!a||!b)continue;const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const h=hAng(b[0]-a[0],b[1]-a[1]);
      for(const q of[-.7,0,.7])for(const half of[0,1]){const mx=a[0]+(b[0]-a[0])*(.25+half*.5)+dy*side*0,my=a[1]+(b[1]-a[1])*(.25+half*.5);const qx=-Math.cos(h)*q*0+Math.cos(s.h)*q,qy=Math.sin(s.h)*q;
        sol.save();sol.tr(mx+qx,8.0-.35,my+qy);sol.rotY(-h);sol.rotX(half?-.05:.05);sol.box(0,0,0,.025,.025,L/2+.05,wireC);sol.restore();}}
    /* garbage heap or twin bins near the kerb */
    const poshS=poshAt((s.ax+s.bx)/2,(s.ay+s.by)/2)>.5;
    if(poshS&&!w.br&&s.len>12){/* posh streets: granite planters with clipped shrubs and bollard lights */
      for(let t=6;t<s.len-4;t+=16)for(const sd of[-1,1]){const x=s.ax+dx*t+dy*(w.hw+1.5)*sd,y=s.ay+dy*t-dx*(w.hw+1.5)*sd;if(inBuilding(x,y)||nearSignal(x,y,4)||!roadClear(x,y,.4))continue;
        sol.box(x,.3,y,.9,.6,.9,[.42,.42,.44]);sol.blob(x,.85,y,.5,.42,.5,[.16,.42,.2]);const bx2=x+dx*4,by2=y+dy*4;sol.cyl(bx2,.45,by2,.08,.9,'y',8,[.18,.18,.2]);sol.box(bx2,.93,by2,.14,.06,.14,[1,.95,.8],.9);}}
    if(r()<.12&&!poshS){const t=s.len*(.2+r()*.6),sd=r()<.5?1:-1;const x=s.ax+dx*t+dy*(w.hw+1.3)*sd,y=s.ay+dy*t-dx*(w.hw+1.3)*sd;if(!inBuilding(x,y)&&roadClear(x,y,.4)){
      {const hk=W.props._hk||(W.props._hk=new Set());const key='heap'+Math.round(x*10)+'_'+Math.round(y*10);if(!hk.has(key)){hk.add(key);for(let k=0;k<7;k++){const a=r()*TAU,rr=r()*.8;const kk=key+'_'+k;const st=LIFE.propState.get(kk);const o={key:kk,kind:'bag',x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr,h:r()*TAU,z:0,vx:0,vy:0,vz:0,down:false,pitch:0,col:k%5};if(st)Object.assign(o,st);W.props.push(o);gAddBox(W.prG,o.x,o.y,o.x,o.y,o);}}}
      dec.quad([x-1.3,.04,y-1.1],[x+1.3,.04,y-1.1],[x+1.3,.04,y+1.1],[x-1.3,.04,y+1.1],[.24,.22,.18],[0,1,0]);}}
    else if(r()<.1){const t=s.len*(.2+r()*.6),sd=r()<.5?1:-1;const x=s.ax+dx*t+dy*(w.hw+1.2)*sd,y=s.ay+dy*t-dx*(w.hw+1.2)*sd;if(!inBuilding(x,y)){sol.save();sol.tr(x,0,y);sol.rotY(-s.h);
      sol.box(-.4,.5,0,.7,1,.6,[.15,.45,.2]);sol.box(.4,.5,0,.7,1,.6,[.2,.35,.7]);sol.box(-.4,1.03,0,.74,.06,.64,[.1,.3,.15]);sol.box(.4,1.03,0,.74,.06,.64,[.12,.22,.5]);sol.restore();}}
  }
  for(const b of W.busStops||[]){if(!inC(b.x,b.y))continue;{const fx=Math.sin(b.h),fy=-Math.cos(b.h),nx=-Math.cos(b.h)*b.side,ny=-Math.sin(b.h)*b.side;for(const k of[-1.6,0,1.6])colAdd(b.x+fx*k+nx*.9,b.y+fy*k+ny*.9,.45);}}
  for(const b of W.busStops||[]){if(!inC(b.x,b.y))continue;sol.save();sol.tr(b.x,0,b.y);sol.rotY(-b.h+(b.side>0?Math.PI/2:-Math.PI/2));
    for(const x of[-1.9,1.9])sol.box(x,1.25,.6,.1,2.5,.1,[.55,.56,.58]);sol.box(0,2.55,0,4.6,.12,1.8,[.2,.35,.6]);sol.box(1.9,1.3,.4,.05,1.8,.9,[.85,.75,.2],.3);sol.box(0,.45,.45,3.4,.08,.45,[.6,.6,.62]);for(const x of[-1.5,1.5])sol.box(x,.22,.45,.08,.44,.08,[.4,.4,.42]);sol.restore();}
  for(const l of W.lots||[]){if(!inC(l.x,l.y))continue;const fx=Math.sin(l.h),fy=-Math.cos(l.h),rx=-fy,ry=fx;const c=(u,v)=>[l.x+rx*u+fx*v,.035,l.y+ry*u+fy*v];
    dec.quad(c(-12.5,-8),c(12.5,-8),c(12.5,8),c(-12.5,8),[.27,.27,.29],[0,1,0]);
    for(let k=-4;k<=5;k++){const u=k*2.7-1.35;dec.quad([...c(u-.06,1)].map((v,i)=>i===1?.045:v),[...c(u+.06,1)].map((v,i)=>i===1?.045:v),[...c(u+.06,6)].map((v,i)=>i===1?.045:v),[...c(u-.06,6)].map((v,i)=>i===1?.045:v),[.9,.9,.88],[0,1,0]);}
    const px=l.x+rx*12-fx*7.5,py=l.y+ry*12-fy*7.5;sol.box(px,1.5,py,.1,3,.1,[.5,.5,.5]);sol.box(px,3.1,py,.9,.9,.08,[.1,.3,.75],.6);sol.box(px,3.1,py-.05,.5,.6,.02,[1,1,1],1);}
}

/* ---------- vehicles: tractors and lorries ---------- */
function buildTractor(colHex){
  const mb=new MB();const c=hexRGB(colHex||'#C8102E');const L=7.6;const tz=-L/2+1.7;
  mb.box(0,1.15,tz-.6,.9,.75,1.8,c);mb.box(0,1.1,tz-1.52,.85,.6,.06,[.2,.2,.2]);mb.box(0,1.55,tz-.5,.95,.06,1.9,c);
  mb.box(0,1.25,tz+.6,.5,.5,.5,[.15,.15,.15]);mb.box(0,1.7,tz+.75,.55,.12,.5,[.1,.1,.1]);mb.box(0,1.95,tz+.95,.55,.5,.1,[.1,.1,.1]);
  mb.cyl(.32,2.0,tz-1.1,.05,1.2,'y',8,[.2,.2,.2]);
  for(const s of[-1,1]){wheel(mb,s*.82,.68,tz+.6,.68,.42);mb.box(s*.82,1.4,tz+.6,.46,.06,1.3,c);wheel(mb,s*.62,.38,tz-1.25,.38,.22);}
  mb.box(0,.75,tz+1.6,.12,.12,1.1,[.25,.25,.25]);
  const bz=L/2-2.0;mb.box(0,1.05,bz,2.05,.12,3.8,[.4,.3,.2]);for(const s of[-1,1])mb.box(s*1.0,1.45,bz,.06,.8,3.8,hexRGB('#2B6CB0'));mb.box(0,1.45,bz+1.88,2.05,.8,.06,hexRGB('#2B6CB0'));mb.box(0,1.45,bz-1.88,2.05,.8,.06,hexRGB('#2B6CB0'));
  for(let k=0;k<6;k++)mb.cyl(-.75+k*.3,2.0,bz,.13,3.6,'z',8,[.42,.52,.22]);for(let k=0;k<5;k++)mb.cyl(-.6+k*.3,2.25,bz,.13,3.6,'z',8,[.5,.45,.25]);
  for(const s of[-1,1])wheel(mb,s*.95,.45,bz,.45,.25);
  return {body:mb.mesh(),len:L,wid:2.1,eye:[0,2.25,tz+.6],lights:{head:[[-.3,1.3,tz-1.55],[.3,1.3,tz-1.55]],tail:[[-.9,1.0,L/2],[.9,1.0,L/2]]}};
}
function buildLorry(colHex){
  const mb=new MB();const c=hexRGB(colHex||'#F2A007');const L=7.6,W=2.4;const cz=-L/2+1.0;
  mb.box(0,1.55,cz,W,1.9,1.9,c);mb.box(0,1.95,cz-.96,W-.2,.9,.04,C.glass);mb.box(0,1.0,cz-.97,W,.5,.06,[.2,.2,.22]);
  for(const s of[-1,1]){mb.box(s*(W/2+.005),1.9,cz,.02,.7,.9,C.glass);mb.box(s*(W/2-.3),.95,cz-.99,.35,.18,.02,C.light,1);}
  mb.box(0,2.62,cz+.2,W-.1,.25,1.4,hexRGB('#D93E2B'));
  const bz=cz+1.05+2.7;mb.box(0,1.0,bz,W,.2,5.4,[.25,.22,.2]);
  const p=[hexRGB('#1D5FB8'),hexRGB('#C62828'),hexRGB('#F2C230')];
  for(const s of[-1,1]){mb.box(s*(W/2-.03),1.75,bz,.06,1.3,5.4,p[0]);mb.box(s*(W/2-.02),2.25,bz,.07,.18,5.4,p[2]);mb.box(s*(W/2-.02),1.3,bz,.07,.12,5.4,p[1]);}
  mb.box(0,1.75,bz-2.68,W,1.3,.06,p[0]);mb.box(0,1.75,bz+2.68,W,1.3,.06,p[1]);
  for(const z of[cz+.2,bz+1.2,bz+2.2])for(const s of[-1,1])wheel(mb,s*(W/2-.22),.52,z,.52,.32);
  mb.box(0,.75,L/2+.02,.6,.16,.02,C.plateY);for(const s of[-1,1])mb.box(s*.95,.95,L/2+.02,.18,.18,.02,C.tail,.7);
  const dm=new MB();dm.quad([-1.1,1.25,L/2+.03],[1.1,1.25,L/2+.03],[1.1,2.3,L/2+.03],[-1.1,2.3,L/2+.03],[1,1,1],[0,0,1],[0,1,1,1,1,0,0,0]);
  return {body:mb.mesh(),len:L,wid:W,eye:[.65,2.35,cz-.1],bedZ:bz,lights:{head:[[-.9,.95,-L/2],[.9,.95,-L/2]],tail:[[-.95,.95,L/2],[.95,.95,L/2]]},decal2:{mesh:dm.mesh(),tex:lorryTex}};
}
function lorryTex(){return textTex('hornok',(c,w,h)=>{c.fillStyle='#1D5FB8';c.fillRect(0,0,w,h);c.fillStyle='#F2C230';c.fillRect(0,h*.78,w,h*.22);c.fillStyle='#FFF';c.textAlign='center';c.textBaseline='middle';c.font='800 58px Arial, sans-serif';c.fillText('HORN OK',w/2,h*.28);c.font='800 52px Arial, sans-serif';c.fillStyle='#F2C230';c.fillText('PLEASE',w/2,h*.56);c.fillStyle='#C62828';c.font='700 26px Arial';c.fillText('USE DIPPER AT NIGHT',w/2,h*.89);},512,256);}
let SACKM=null;function sackMesh(){if(!SACKM){const mb=new MB();mb.blob(0,.18,0,.36,.18,.24,[.86,.8,.62]);mb.box(0,.3,-.2,.12,.06,.08,[.75,.68,.5]);SACKM=mb.mesh();}return SACKM;}

/* ---------- jobs: loading and unloading, washing cars ---------- */
const WORKLOOK={shirt:'#8D6E63',pants:'#5D4037'},WORKLOOK2={shirt:'#E0E0E0',pants:'#37474F'};
function jobsMenu(){
  state='job';releaseAll();const box=$('#jbOpts');box.innerHTML='';
  const add=(txt,fn)=>{const b=document.createElement('button');b.className='btn';b.textContent=txt;b.addEventListener('click',fn);box.appendChild(b);};
  const sites=CITY.works.map(w=>({w,d:Math.hypot(w.gx-P.x,w.gy-P.y)})).sort((a,b)=>a.d-b.d).slice(0,3);
  for(const{w,d}of sites){const n=w.kind==='unload'?w.onLorry:w.inGodown;if(n<3)continue;
    add(`${w.kind==='unload'?'Unload':'Load'} a lorry at ${w.name} · ${n} sacks · ₹20 a sack · ${Math.round(d)} m`,()=>{FOOT.job={kind:'sacks',w,carry:false,done:0,left:300,pay:20};state='play';show('play');footHud(true);toast('Head to the lorry (yellow beam). Pick up sacks at the back of the lorry.','gold');});}
  const car=(W.parkedV||[]).filter(v=>!v.t.two&&v.t.k!=='auto').map(v=>({v,d:Math.hypot(v.x-P.x,v.y-P.y)})).sort((a,b)=>a.d-b.d)[0];
  if(car&&car.d<250)add(`Wash a parked car · ${Math.round(car.d)} m · scrub all four sides · ₹70`,()=>{FOOT.job={kind:'wash',v:car.v,spot:0,prog:0,left:240};state='play';show('play');footHud(true);toast('Walk to the glowing spots around the car and stand still to scrub.','gold');});
  let target=null;for(let tries=0;tries<120&&!target;tries++){const s=W.segs[Math.floor(Math.random()*W.segs.length)];if(!s.w.name)continue;const mx=(s.ax+s.bx)/2,my=(s.ay+s.by)/2,d=Math.hypot(mx-P.x,my-P.y);if(d>300&&d<900)target={x:mx,y:my,name:s.w.name,d};}
  if(target){const pay=Math.round(30+target.d/1000*90),time=Math.round(target.d/2.6+40);add(`Deliver a parcel to ${target.name} · ${Math.round(target.d)} m · ₹${pay} within ${Math.floor(time/60)} min ${time%60} s`,()=>{FOOT.job={kind:'deliver',x:target.x,y:target.y,name:target.name,pay,left:time};state='play';show('play');footHud(true);toast('Parcel picked up. Follow the yellow beam.','gold');});}
  if(!box.children.length)add('No work nearby right now. Try another area.',()=>{state='play';show('play');footHud(true);});
  show('jobScr');
}
function jobSpots(j){const v=j.v,fx=Math.sin(v.h),fy=-Math.cos(v.h),rx=-fy,ry=fx,L=v.len/2+.8,Wd=v.wid/2+.8;return [[v.x+fx*L,v.y+fy*L],[v.x+rx*Wd,v.y+ry*Wd],[v.x-fx*L,v.y-fy*L],[v.x-rx*Wd,v.y-ry*Wd]];}
function jobContext(){
  const j=FOOT.job;if(!j)return null;
  if(j.kind==='sacks'){const w=j.w;const nearLorry=Math.hypot(w.rx-P.x,w.ry-P.y)<2.3,nearDoor=Math.hypot(w.gx-P.x,w.gy-P.y)<2.6;
    if(w.kind==='unload'){if(!j.carry&&nearLorry&&w.onLorry>0)return {k:'jpick',label:'Pick up sack'};if(j.carry&&nearDoor)return {k:'jdrop',label:'Stack sack'};}
    else{if(!j.carry&&nearDoor&&w.inGodown>0)return {k:'jpick',label:'Pick up sack'};if(j.carry&&nearLorry)return {k:'jdrop',label:'Load on lorry'};}}
  return null;
}
function jobUse(c){const j=FOOT.job;if(!j)return;const w=j.w;
  if(c.k==='jpick'){j.carry=true;if(w.kind==='unload')w.onLorry--;else w.inGodown--;Hap.tick();Snd.thud(.2);}
  else if(c.k==='jdrop'){j.carry=false;if(w.kind==='unload')w.inGodown++;else w.onLorry++;j.done++;profile.wallet+=j.pay;session.fare+=j.pay;saveProfile();Snd.coin();toast(`+₹${j.pay} · ${j.done} sacks done`,'gold','sack',900);
    FOOT.stam=Math.max(0,FOOT.stam-6);
    const left=w.kind==='unload'?w.onLorry:w.inGodown;if(left<=0){profile.wallet+=50;saveProfile();toast(`Lorry ${w.kind==='unload'?'unloaded':'loaded'}! Bonus ₹50 · earned ₹${j.done*j.pay+50}`,'gold');Hap.success();FOOT.job=null;w.reset=45;}}
  LIFE.ctxT=0;
}
function updateJobs(dt){
  for(const w of CITY.works){if(w.reset>0){w.reset-=dt;if(w.reset<=0){if(w.kind==='unload'){w.onLorry=12;w.inGodown=0;}else{w.onLorry=0;w.inGodown=12;}}}}
  for(const k of CITY.workers){k.t+=dt;const w=k.w;const T=9,ph=(k.t%T)/T;const a=ph<.5?[w.rx,w.ry]:[w.gx,w.gy],b=ph<.5?[w.gx,w.gy]:[w.rx,w.ry];const q=(ph%.5)*2;
    const m=clamp((q-.1)/.8,0,1);k.x=a[0]+(b[0]-a[0])*m;k.y=a[1]+(b[1]-a[1])*m;k.h=hAng(b[0]-a[0],b[1]-a[1]);k.carry=(w.kind==='unload')===(ph<.5);k.moving=m>0&&m<1;k.pose=Math.floor(k.t*3)%2;}
  const j=FOOT.job;if(!j)return;
  if(j.kind==='sacks'||j.kind==='wash'){j.left-=dt;if(j.left<=0){toast(j.kind==='sacks'?`Shift over. You carried ${j.done} sacks.`:'Too slow, the owner drove off.','bad');FOOT.job=null;return;}}
  if(j.kind==='wash'){const sp=jobSpots(j)[j.spot];if(Math.hypot(sp[0]-P.x,sp[1]-P.y)<1.1&&P.s<.6){j.prog+=dt;LIFE.anim=.2;LIFE.animK=(Math.floor(GT*6)%2)?'stab':'punch';if(j.prog>=2.2){j.prog=0;j.spot++;Snd.tone([900],.08,'sine',.04);
      if(j.spot>=4){profile.wallet+=70;session.fare+=70;saveProfile();toast('Car is spotless · ₹70','gold');Hap.success();FOOT.job=null;}}}}
}
function jobTitle(){const j=FOOT.job;return j.kind==='sacks'?`${j.w.kind==='unload'?'Unloading':'Loading'} · ${j.w.name}`:j.kind==='wash'?'Washing a car':'';}
function jobLine(){const j=FOOT.job;if(j.kind==='sacks'){const left=j.w.kind==='unload'?j.w.onLorry:j.w.inGodown;return `${j.carry?'Carrying a sack':'Fetch a sack'} · ${left} left · ${Math.ceil(j.left)} s`;}if(j.kind==='wash')return `Side ${Math.min(4,j.spot+1)} of 4 · ${Math.ceil(j.left)} s`;return '';}
/* gym: lift on the beat */
const REP={on:false,x:0,dir:1,zone:.4,zw:.22,reps:0,miss:0,need:10,speed:.9};
function startGym(){REP.on=true;REP.x=0;REP.dir=1;REP.reps=0;REP.miss=0;REP.speed=.9;newZone();$('#rep').hidden=false;$('#repTxt').textContent='Tap LIFT when the marker is in the green';repSub();}
function newZone(){REP.zw=Math.max(.1,.24-REP.reps*.012);REP.zone=.1+Math.random()*(.8-REP.zw);$('#repZone').style.left=REP.zone*100+'%';$('#repZone').style.width=REP.zw*100+'%';}
function repSub(){$('#repSub').textContent=`Reps ${REP.reps} / ${REP.need} · misses ${REP.miss} / 3`;}
function updateRep(dt){if(!REP.on)return;REP.x+=REP.dir*REP.speed*dt;if(REP.x>1){REP.x=1;REP.dir=-1;}if(REP.x<0){REP.x=0;REP.dir=1;}$('#repCur').style.left=REP.x*100+'%';}
$('#repBtn').addEventListener('pointerdown',e=>{e.preventDefault();if(!REP.on)return;
  if(REP.x>=REP.zone&&REP.x<=REP.zone+REP.zw){REP.reps++;REP.speed+=.08;Hap.tick();Snd.tone([520+REP.reps*30],.06,'triangle',.05);if(REP.reps>=REP.need){REP.on=false;$('#rep').hidden=true;gymDone();return;}newZone();}
  else{REP.miss++;Snd.tone([160],.12,'square',.04);if(REP.miss>=3){REP.on=false;$('#rep').hidden=true;FOOT.stam=Math.max(0,FOOT.stam-30);toast('You lost the rhythm. Rest and try again.','bad');return;}}
  repSub();});

/* ---------- police: heat, more cars at higher stars, helicopter ---------- */
const HEAT={assault:1,kill:4,cop:3,arms:2,theft:1.5,damage:.6,nolic:.5,drunk:1,ped:3,signal:.5,rash:.5,speed:.4,wrong:.4,crash:.8};
const starsFor=h=>h>=24?5:h>=15?4:h>=8?3:h>=3?2:1;
function addHeat(code){COP.heat=(COP.heat||0)+(HEAT[code]||.5);return starsFor(COP.heat);}
function updateHeli(dt){
  if(COP.level>=4&&!CITY.heli){const a=Math.random()*TAU;CITY.heli={x:P.x+Math.cos(a)*200,y:P.y+Math.sin(a)*200,z:45,h:0,ang:a,t:0};toast('Police helicopter overhead!','bad');}
  if(CITY.heli&&COP.level<3){CITY.heli.leave=(CITY.heli.leave||0)+dt;if(CITY.heli.leave>6){CITY.heli=null;heliSound(0);return;}}
  const H=CITY.heli;if(!H){heliSound(0);return;}
  H.t+=dt;H.ang+=dt*.25;const tx=P.x+Math.cos(H.ang)*34,ty=P.y+Math.sin(H.ang)*34;const dx=tx-H.x,dy=ty-H.y,d=Math.hypot(dx,dy);const sp=Math.min(d,30*dt);if(d>.1){H.x+=dx/d*sp;H.y+=dy/d*sp;}H.h=hAng(P.x-H.x,P.y-H.y);H.z=lerp(H.z,H.leave?80:24,dt*.5);
  heliSound(clamp(1-Math.hypot(H.x-P.x,H.y-P.y)/400,0,1));
  if(COP.level>=5&&FOOT.on&&!FOOT.ride){H.shoot=(H.shoot||2)-dt;if(H.shoot<=0){H.shoot=2.2+Math.random()*1.5;LIFE.fx.push({k:'tracer',a:[H.x,H.z-1,H.y],b:[P.x+(Math.random()-.5)*2,1,P.y+(Math.random()-.5)*2],t:.06});Snd.burst(.07,1300,.6,.35,'bandpass');if(Math.random()<.35)lfDamage(8,'shot');}}
}
const HELIS={src:null,g:null,lfo:null};
function heliSound(v){const c=Snd.ctx;if(!c||!Snd.noise)return;if(!HELIS.src){if(v<.02)return;const s=c.createBufferSource();s.buffer=Snd.noise;s.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=320;const g=c.createGain();g.gain.value=0;const am=c.createGain();am.gain.value=.5;const l=c.createOscillator();l.frequency.value=11;const lg=c.createGain();lg.gain.value=.5;l.connect(lg);lg.connect(am.gain);s.connect(f);f.connect(am);am.connect(g);g.connect(Snd.master);s.start();l.start();HELIS.src=s;HELIS.g=g;}
  HELIS.g.gain.setTargetAtTime(v*.5,c.currentTime,.3);}
let HELIM=null;function heliModel(){if(HELIM)return HELIM;const mb=new MB();const b=[.12,.18,.42],w=[.92,.92,.94];
  mb.blob(0,0,0,1.3,1.2,2.4,b);mb.blob(0,.1,-1.3,1.05,.9,1.1,[.15,.2,.3]);mb.box(0,.3,3.2,.35,.35,4,w);mb.box(0,.9,5.1,.08,1.2,.8,b);mb.box(.45,.4,5.1,.9,.08,.5,b);
  for(const s of[-1,1]){mb.box(s*.9,-1.35,0,.08,.08,3.2,[.3,.3,.3]);for(const z of[-.8,.8])mb.box(s*.75,-1.1,z,.06,.5,.06,[.3,.3,.3]);}
  mb.box(0,-.3,0,2.62,.3,4.2,w);mb.box(0,1.3,0,.25,.4,.25,[.2,.2,.2]);
  const rm=new MB();rm.box(0,0,0,11,.05,.35,[.1,.1,.1]);rm.box(0,0,0,.35,.05,11,[.1,.1,.1]);
  HELIM={body:mb.mesh(),rotor:rm.mesh()};return HELIM;}
function drawHeli(night){const H=CITY.heli;if(!H)return;const m=heliModel();M4.model(TM,H.x,H.z,H.y,-H.h,.08,Math.sin(H.t)*.05);drawLit(m.body,TM,{emiK:.6});
  M4.model(TM2,H.x,H.z+1.55,H.y,GT*40,0,0);drawLit(m.rotor,TM2,{cull:false});
  DGr.bill(H.x,H.z-1.4,H.y,.5,Math.floor(GT*3)%2?[1,.15,.1]:[.15,.3,1],CAM.right);
  if(night>.3){DGr.quad(P.x+Math.sin(GT*.7)*2,.06,P.y+Math.cos(GT*.6)*2,1,0,4.5,4.5,[.9,.9,.8]);}}

/* ---------- per-frame hooks ---------- */
function cityUpdate(dt){
  updateWeather(dt);updateMetro(dt);updateJobs(dt);updateRep(dt);updateHeli(dt);
  if(COP.level===0)COP.heat=0;else if(!nearCop(160))COP.heat=Math.max(0,(COP.heat||0)-.06*dt);
  /* buses stop at bus stops */
  for(const a of agents){if(a.t.k!=='bus'||a.stop>0)continue;const q=[];gQuery(W.bsG||new Map(),a.x,a.y,9,q);for(const b of q){if(a.lastStop===b)continue;const lx=-Math.cos(a.h),ly=-Math.sin(a.h);if(((b.x-a.x)*lx+(b.y-a.y)*ly)>0&&Math.hypot(b.x-a.x,b.y-a.y)<7){a.stop=5;a.v=0;a.lastStop=b;}}}
  /* parked vehicles are solid */
  const q=[];gQuery(W.pvG||new Map(),P.x,P.y,8,q);
  for(const v of q){if(CITY.taken.has(v.key))continue;const d=carDist(v,v.len,v.wid,P.x,P.y);
    if(FOOT.on&&!FOOT.ride&&!METRO.ride){if(d<.3){const dx=P.x-v.x,dy=P.y-v.y,l=Math.hypot(dx,dy)||1;P.x+=dx/l*(.3-d);P.y+=dy/l*(.3-d);}}
    else if(!FOOT.on&&d<P.wid*.45){const dx=P.x-v.x,dy=P.y-v.y,l=Math.hypot(dx,dy)||1;P.x+=dx/l*.6;P.y+=dy/l*.6;if(Math.abs(P.s)>3){crash(Math.abs(P.s)*.8,'a parked vehicle',4);CITY.alarmT=4;}P.s*=-.2;}}
  if(CITY.alarmT>0){CITY.alarmT-=dt;if(Math.floor(CITY.alarmT*4)%2===0&&Math.random()<.2)Snd.tone([950,700],.18,'square',.03);}
  /* work lorries block traffic like parked cars */
  for(const w of CITY.works)OBST.push({x:w.x,y:w.y,len:7.6,wid:2.4});
}
function cityContext(){
  const q=[];gQuery(W.pvG||new Map(),P.x,P.y,4,q);let best=null,bd=1.5;
  for(const v of q){if(CITY.taken.has(v.key))continue;const d=carDist(v,v.len,v.wid,P.x,P.y);if(d<bd){bd=d;best={k:'park',v,label:v.mine?(v.t.two?'Ride with the keys':'Drive with the keys'):v.t.two?'Take parked bike':'Steal parked car'};}}
  if(best)return best;
  for(const st of METRO.stations)for(const e of st.e)if(Math.hypot(e[0]-P.x,e[1]-P.y)<4)return {k:'metro',st,label:'Enter metro station'};
  const b=[];gQuery(W.bsG||new Map(),P.x,P.y,4,b);if(b.length)return {k:'bus',label:'Wait for a BMTC bus'};
  for(const w of CITY.works)if(!FOOT.job&&Math.hypot(w.gx-P.x,w.gy-P.y)<4)return {k:'askwork',w,label:'Ask for work'};
  return null;
}
function cityUse(c){
  if(c.k==='metro')openMetro(c.st);
  else if(c.k==='bus'){if(profile.wallet<20){toast('You need ₹20 for a bus ticket','bad');return;}sendRide('bus');}
  else if(c.k==='askwork'){const w=c.w;const n=w.kind==='unload'?w.onLorry:w.inGodown;if(n<1){toast('Nothing to carry right now. Come back in a bit.','');return;}FOOT.job={kind:'sacks',w,carry:false,done:0,left:300,pay:20};toast(`Hired! ${w.kind==='unload'?'Unload':'Load'} the lorry. ₹20 a sack.`,'gold');}
  else if(c.k==='park'){const v=c.v;CITY.taken.add(v.key);const i=W.parkedV.indexOf(v);if(i>=0)W.parkedV.splice(i,1);
    const a={t:v.t,model:pvModel(v),x:v.x,y:v.y,h:v.h,hp:150,v:0};agents.push(a);enterVehicle({k:'jack',a,silent:true});
    if(v.mine){if(LIFE.keyV===v)LIFE.keyV=null;toast('Unlocked with the keys','good');}
    else if(!v.t.two){CITY.alarmT=5;if(nearCop(100)||peds.some(p=>!p.dead&&Math.hypot(p.x-v.x,p.y-v.y)<15))crime('theft',1);}}
  else if(c.k==='jpick'||c.k==='jdrop')jobUse(c);
}
function cityRender(A,night,ex,ez){
  drawMetro(ex,ez,night);drawHeli(night);
  for(const v of W.parkedV||[]){if(Math.hypot(v.x-ex,v.y-ez)>170)continue;const m=pvModel(v);M4.model(TM,v.x,0,v.y,-v.h,0,0);drawLit(m.body,TM,{emiK:.3});if(m.glass)drawLit(m.glass,TM);if(m.decal2){const t=m.decal2.tex().tex;drawLit(m.decal2.mesh,TM,{tex:t,emTex:t,emiK:.1});}}
  for(const b of W.busStops||[]){if(Math.hypot(b.x-ex,b.y-ez)>150)continue;const sg=makeSign('bs:'+b.key,(mb,fb)=>{const f=[Math.sin(b.h),-Math.cos(b.h)];const sx=b.x+f[0]*2.6,sy=b.y+f[1]*2.6;const nx=-Math.cos(b.h)*b.side,ny=-Math.sin(b.h)*b.side;
    fb.box(sx,1.6,sy,.09,3.2,.09,[.5,.5,.5]);signQuad(mb,sx,sy,2.6,-nx,-ny,2.4,.6,null,true);});drawSignMesh(sg,busStopTex().tex,night);}
  /* work sites */
  const lm=buildLorryCached();
  for(const w of CITY.works){if(Math.hypot(w.x-ex,w.y-ez)>220)continue;M4.model(TM,w.x,0,w.y,-w.h,0,0);drawLit(lm.body,TM,{emiK:.3});drawLit(lm.decal2.mesh,TM,{tex:lorryTex().tex,emTex:TEX.black});
    for(let k=0;k<w.onLorry;k++){const row=Math.floor(k/4),col=k%4;M4.model(TM2,0,0,0,0,0,0);const lx=-.75+col*.5,ly=1.15+Math.floor(row/3)*.36,lz=lm.bedZ-1.8+(row%3)*1.2;const p=M4.xform(TM,lx,ly,lz);M4.model(TM2,p[0],p[1],p[2],-w.h,0,0);drawLit(sackMesh(),TM2);}
    const gx=w.gx+(w.wall?w.wall.nx:0)*-.2,gy=w.gy+(w.wall?w.wall.ny:0)*-.2;
    for(let k=0;k<w.inGodown;k++){const row=Math.floor(k/4),col=k%4;M4.model(TM2,gx+Math.cos(w.h)*(col-1.5)*.55,row*.34,gy+Math.sin(w.h)*(col-1.5)*.55,-w.h,0,0);drawLit(sackMesh(),TM2);}}
  for(const k of CITY.workers){if(Math.hypot(k.x-ex,k.y-ez)>140)continue;M4.model(TM,k.x,0,k.y,-k.h,0,0);const look=k===CITY.workers[0]?WORKLOOK:WORKLOOK2;drawLit(rig(look,SKINS[1],k.carry?'carry':k.moving?(k.pose?'walk1':'walk0'):'pose'),TM);
    if(k.carry){M4.model(TM2,k.x,1.62,k.y,-k.h+.4,0,0);drawLit(sackMesh(),TM2);}}
  if(FOOT.on&&FOOT.job&&FOOT.job.carry){M4.model(TM2,P.x,1.62+LIFE.z,P.y,-P.h+.4,0,0);drawLit(sackMesh(),TM2);}
  const j=FOOT.job;
  if(j&&j.kind==='sacks'){const w=j.w;const tgt=(j.carry===(w.kind==='unload'))?[w.gx,w.gy]:[w.rx,w.ry];const d=Math.hypot(tgt[0]-ex,tgt[1]-ez);drawSprite(beamTex().tex,tgt[0],0,tgt[1],2+d*.01,30,[1,.85,.2]);}
  if(j&&j.kind==='wash'){const sp=jobSpots(j);if(j.spot<4){const s=sp[j.spot];DGr.quad(s[0],.05,s[1],1,0,.8,.8,[.2,.8,1]);drawSprite(beamTex().tex,s[0],0,s[1],1.2,6,[.3,.8,1]);}}
}
let LORRYM=null;function buildLorryCached(){return LORRYM||(LORRYM=buildLorry('#F2A007'));}
$('#btnRun').hidden=true;
hold($('#btnRun'),()=>{input.horn=1;},()=>{input.horn=0;});
Object.assign(window.__oosht||{},{crimeX:(c,l)=>crime(c,l),buildMetro,WX,METRO,CITY,REP,startGym,jobsMenu,openMetro,cityContext,shadowPass,SHV,FU});
