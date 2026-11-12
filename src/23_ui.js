/* ================= WISE CITY: intro movie, Material-style menus, settings sliders, sound toggle ================= */

/* ---------- the intro movie that follows the production credit ---------- */
const INTRO_THEME={name:'intro',bpm:100,scale:[0,2,3,5,7,8,10],root:50,kit:'cine',lead:'sawtooth',pad:true,prog:[0,5,3,4]};
const MOV={started:false,cues:[]};
const PIN=new Path2D('M54,93 L32.4,62.2 A27,27 0 1,1 75.6,62.2 Z');
function sirenSnd(dur){const c=Snd.ctx;if(!c||c.state!=='running')return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();o.type='square';lp.type='lowpass';lp.frequency.value=1800;
  for(let k=0;k<dur*2;k++){o.frequency.setValueAtTime(k%2?650:900,t+k*.5);}o.connect(lp);lp.connect(g);g.connect(Snd.master);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.4);g.gain.setValueAtTime(.05,t+dur-.6);g.gain.linearRampToValueAtTime(0,t+dur);o.start(t);o.stop(t+dur+.1);}
function thunderSnd(){const c=Snd.ctx;if(!c||c.state!=='running')return;Snd.burst(1.8,180,.7,.5,'lowpass');}
function caption(c,w,h,dpr,txt,t0,t,y){const a=clamp((t-t0)/.6,0,1)*clamp((t0+3.6-t)/.6,0,1);if(a<=0)return;c.save();c.globalAlpha=a*.92;c.fillStyle='#F4F1E8';c.font=`500 ${Math.round(h*.055)}px Roboto, system-ui, sans-serif`;c.textAlign='center';
  c.shadowColor='rgba(0,0,0,.8)';c.shadowBlur=12*dpr;const n=Math.floor(clamp((t-t0)/1.2,0,1)*txt.length);c.fillText(txt.slice(0,n),w/2,y||h*.2);c.restore();}
function skyline(c,w,h,dpr,off,col,seed,hmax,base){const r=mulberry32(seed);c.fillStyle=col;let x=-((off*dpr)%(w*1.2));while(x<w*1.3){const bw=(24+r()*60)*dpr,bh=h*(.08+r()*hmax);c.fillRect(x,base-bh,bw,bh);
  if(r()<.25){c.fillRect(x+bw*.4,base-bh-12*dpr,3*dpr,12*dpr);}x+=bw+r()*5*dpr;}}
function vidhana(c,cx,base,s){c.save();c.translate(cx,base);c.scale(s,s);c.fillStyle='#0B0E15';c.fillRect(-120,-60,240,60);c.fillRect(-150,-38,300,38);c.fillRect(-40,-90,80,30);
  c.beginPath();c.arc(0,-90,26,Math.PI,0);c.fill();c.fillRect(-2,-128,4,14);for(let i=-5;i<=5;i++){c.fillStyle='rgba(255,210,140,.35)';c.fillRect(i*20-3,-52,6,40);}c.restore();}
function introMovie(c,w,h,dpr,T){
  if(!MOV.started){MOV.started=true;MOV.cues=[[0,'music'],[4.6,'siren'],[9.2,'thunder'],[11,'thunder'],[13,'hit']];}
  while(MOV.cues.length&&MOV.cues[0][0]<=T){const k=MOV.cues.shift()[1];
    if(k==='music'&&Snd.ctx){MUS.menu=true;musPlay(INTRO_THEME,.34);}else if(k==='siren')sirenSnd(4.2);else if(k==='thunder'){thunderSnd();Hap.play([0,120],[0,160],true);}else if(k==='hit'){introSound('boom');Hap.play([0,80,60,220],[0,255,0,180],true);}}
  const base=h*.78;
  if(T<4.6){/* dusk over the city, Vidhana Soudha, a metro crossing */
    const k=T/4.6;const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1B1530');g.addColorStop(.55,'#C75B39');g.addColorStop(.8,'#F2A65A');g.addColorStop(1,'#2A1A14');c.fillStyle=g;c.fillRect(0,0,w,h);
    c.fillStyle='rgba(255,220,150,.9)';c.beginPath();c.arc(w*.7,base-h*.12+k*h*.08,h*.07,0,TAU);c.fill();
    skyline(c,w,h,dpr,T*20,'#3B2433',7,.35,base);vidhana(c,w*.38,base,h/420);skyline(c,w,h,dpr,T*45,'#170F18',11,.2,base+4*dpr);
    const ty=base-h*.3;c.fillStyle='#10131A';c.fillRect(0,ty,w,6*dpr);for(let x=(T*60*dpr)%(w/6);x<w;x+=w/6)c.fillRect(x,ty,8*dpr,base-ty);
    const tx=-w*.6+k*w*1.9;c.fillStyle='#5E2D79';c.fillRect(tx,ty-h*.06,w*.55,h*.06);c.fillStyle='rgba(255,240,200,.85)';for(let i=0;i<14;i++)c.fillRect(tx+i*w*.038+6*dpr,ty-h*.05,w*.022,h*.022);
    caption(c,w,h,dpr,'BENGALURU · 6:00 PM',.4,T);}
  else if(T<9.2){/* a chase down the street at night */
    const t2=T-4.6,k=t2/4.6;c.fillStyle='#070A12';c.fillRect(0,0,w,h);skyline(c,w,h,dpr,t2*240,'#121826',3,.42,base);
    c.fillStyle='rgba(255,199,90,.4)';const r=mulberry32(4);for(let i=0;i<70;i++){c.fillRect(((r()*w*2-t2*240*dpr)%(w*1.2)+w*1.2)%(w*1.2),base-r()*h*.4,4*dpr,6*dpr);}
    c.fillStyle='#0C0E12';c.fillRect(0,base,w,h-base);c.fillStyle='rgba(255,255,255,.35)';for(let x=-(t2*900*dpr)%(90*dpr);x<w;x+=90*dpr)c.fillRect(x,base+(h-base)*.5,44*dpr,4*dpr);
    const ax=w*(.15+k*.55),ay=base+(h-base)*.18,s=h/300;c.save();c.translate(ax,ay);c.scale(s,s);c.fillStyle='#1E7A43';c.beginPath();c.moveTo(-40,0);c.lineTo(-40,-34);c.quadraticCurveTo(-20,-52,20,-48);c.lineTo(34,-20);c.lineTo(36,0);c.closePath();c.fill();
    c.fillStyle='#F2C21B';c.fillRect(-40,-46,58,10);c.fillStyle='#111';for(const x of[-28,26])c.beginPath(),c.arc(x,2,9,0,TAU),c.fill();c.fillStyle='#FFF4C8';c.fillRect(32,-16,6,6);c.restore();
    const px=ax-w*(.35-k*.12);c.save();c.translate(px,ay);c.scale(s,s);c.fillStyle='#E9EDF2';c.fillRect(-60,-30,120,26);c.fillRect(-36,-48,64,20);c.fillStyle='#1F3E8F';c.fillRect(-60,-20,120,6);c.fillStyle='#111';for(const x of[-38,38])c.beginPath(),c.arc(x,0,10,0,TAU),c.fill();
    const fl=Math.floor(T*8)%2;c.fillStyle=fl?'#FF2A2A':'#2A5BFF';c.fillRect(-20,-54,18,6);c.fillStyle=fl?'#2A5BFF':'#FF2A2A';c.fillRect(2,-54,18,6);c.restore();
    const gl=c.createRadialGradient(px,ay-48*s,0,px,ay-48*s,h*.5);gl.addColorStop(0,Math.floor(T*8)%2?'rgba(255,40,40,.35)':'rgba(40,90,255,.35)');gl.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gl;c.fillRect(0,0,w,h);
    caption(c,w,h,dpr,'Every street is real.',.3,t2);}
  else if(T<13){/* rain, neon and lightning */
    const t3=T-9.2;c.fillStyle='#05070C';c.fillRect(0,0,w,h);const fl=(T>9.2&&T<9.4)||(T>11&&T<11.15);if(fl){c.fillStyle='rgba(220,230,255,.75)';c.fillRect(0,0,w,h);}
    skyline(c,w,h,dpr,t3*30,'#0E1220',5,.5,base);const signs=[['DARSHINI','#FFC72C',.12],['BAR & PUB','#FF4FA0',.36],['METRO','#9B59D0',.6],['MEDICALS','#4FE38A',.82]];
    for(const[s,col,x]of signs){const on=Math.sin(T*9+x*20)>-.6;c.save();c.font=`700 ${Math.round(h*.06)}px Roboto, system-ui`;c.textAlign='center';c.shadowColor=col;c.shadowBlur=on?24*dpr:0;c.fillStyle=on?col:'#333';c.fillText(s,w*x,base-h*.32+((x*100)%3)*h*.05);c.restore();}
    c.strokeStyle='rgba(170,190,230,.35)';c.lineWidth=1.2*dpr;c.beginPath();const r=mulberry32(Math.floor(T*30));for(let i=0;i<160;i++){const x=r()*w,y=r()*h;c.moveTo(x,y);c.lineTo(x-6*dpr,y+22*dpr);}c.stroke();
    c.fillStyle='#090B10';c.fillRect(0,base,w,h-base);const rf=c.createLinearGradient(0,base,0,h);rf.addColorStop(0,'rgba(255,199,44,.18)');rf.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=rf;c.fillRect(0,base,w,h-base);
    caption(c,w,h,dpr,'Every choice is yours.',.3,t3);}
  else{/* the title */
    const t4=T-13,a=clamp(t4/.7,0,1),out=clamp((18-T)/.8,0,1);c.fillStyle='#07090D';c.fillRect(0,0,w,h);
    const g=c.createRadialGradient(w/2,h*.48,0,w/2,h*.48,h*.9);g.addColorStop(0,`rgba(255,199,44,${.22*a})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
    c.save();c.globalAlpha=out;const s=h/190*(.9+.1*a);c.translate(w/2-h*.36,h*.53-50*s);c.scale(s,s);c.translate(-54,0);c.fillStyle='#FFC72C';c.shadowColor='rgba(255,199,44,.7)';c.shadowBlur=24;c.fill(PIN);
    c.shadowBlur=0;c.fillStyle='#16294A';c.beginPath();c.arc(54,46,21,0,TAU);c.fill();c.save();c.beginPath();c.arc(54,46,21,0,TAU);c.clip();c.fillStyle='#0D1116';c.fillRect(30,57,48,14);c.fillRect(35,39,7,18);c.fillRect(43,45,5,12);c.fillRect(60,42,5,15);c.fillRect(66,36,6,21);c.beginPath();c.arc(54,50,5.5,Math.PI,0);c.fill();c.fillRect(47,50,14,7);c.restore();c.restore();
    c.save();c.globalAlpha=a*out;c.textAlign='left';c.fillStyle='#F4F1E8';c.shadowColor='rgba(255,199,44,.6)';c.shadowBlur=20*dpr;c.font=`${Math.round(h*.17)}px Bungee, Impact, 'Arial Black', sans-serif`;
    const x0=w/2-h*.14;c.fillText('WISE',x0,h*.47);c.fillStyle='#FFC72C';c.fillText('CITY',x0,h*.64);c.restore();
    if(T>18)return true;}
  /* letterbox bars give it a film look */
  c.fillStyle='#000';c.fillRect(0,0,w,h*.07);c.fillRect(0,h*.93,w,h*.07);
  return false;}
$('#introSkip').addEventListener('click',e=>{e.stopPropagation();Snd.init();Snd.resume();introEnd();});
$('#introSkip').addEventListener('pointerdown',e=>e.stopPropagation());
$('#introBtn').addEventListener('click',()=>{const s=$('#splash');s.hidden=false;s.style.opacity='1';s.style.transition='';splashDone=false;INTRO.done=false;MOV.started=false;state='splash';$('#title').hidden=true;
  for(const el of document.querySelectorAll('#splash .l1,#splash .l2,#splash .rule')){el.style.animation='none';void el.offsetWidth;el.style.animation='';}Snd.resume();introRun();});

/* ---------- ripples on every button ---------- */
document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('.btn,.back,.vitem,.area,.seg button,.iconbtn,.abtn,.usebtn,#footBar button');if(!b)return;const r=b.getBoundingClientRect();const d=Math.max(r.width,r.height)*2;
  const s=document.createElement('span');s.className='ripple';s.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
  if(getComputedStyle(b).position==='static')b.style.position='relative';b.style.overflow='hidden';b.appendChild(s);setTimeout(()=>s.remove(),520);},true);

/* ---------- sound on/off everywhere ---------- */
function soundUI(){for(const b of document.querySelectorAll('.sndToggle'))b.classList.toggle('off',!settings.sound);}
function toggleSound(){settings.sound=!settings.sound;saveSettings();Snd.init();Snd.resume();Snd.setOn(settings.sound);soundUI();Hap.tick();toast(settings.sound?'Sound on':'Sound off','',null,900);}
for(const b of document.querySelectorAll('.sndToggle'))b.addEventListener('click',toggleSound);soundUI();

/* ---------- settings: grouped, with sliders ---------- */
for(const[k,v]of Object.entries({vol:100,musVol:80,hapN:{off:0,low:45,med:75,high:100}[settings.haptics]??75}))if(settings[k]==null)settings[k]=v;
if(typeof settings.mapSize!=='number')settings.mapSize={S:84,M:108,L:144}[settings.mapSize]||108;
if(typeof settings.lookSens!=='number')settings.lookSens={low:.0045,med:.0075,high:.012}[settings.lookSens]||.0075;
applyHudStyle();
const UIS=[
  ['Sound',[['sound','Sound','switch'],['vol','Master volume','slider',0,100,5,v=>v+'%'],['musVol','Music & radio','slider',0,100,5,v=>v+'%'],['hapN','Vibration','slider',0,100,5,v=>v?v+'%':'Off']]],
  ['Controls',[['btnOp','Button visibility','slider',.15,1,.05,v=>Math.round(v*100)+'%'],['btnSize','Button size','slider',.7,1.5,.05,v=>Math.round(v*100)+'%'],
    ['btnShape','Button shape','seg'],['joyMode','Joystick','seg'],['lookSens','Camera swipe speed','slider',.003,.016,.0005,v=>Math.round(v/.0075*100)+'%'],['steer','Steering','seg']]],
  ['Display',[['hudOp','Panels & map visibility','slider',.2,1,.05,v=>Math.round(v*100)+'%'],['mapSize','Minimap size','slider',70,180,5,v=>v+' px'],['cam','Camera','seg'],['gfx','Graphics','seg']]]];
function onSetting(key,val){settings[key]=val;saveSettings();
  if(key==='sound'){Snd.init();Snd.resume();Snd.setOn(val);soundUI();}
  if(key==='vol')Snd.setOn(settings.sound);
  if(key==='musVol'&&MUS.bus&&MUS.st)MUS.bus.gain.setTargetAtTime((MUS.vol||.3)*val/80,Snd.ctx.currentTime,.1);
  if(key==='cam')CAM.mode=val;if(key==='gfx'){clearChunks();for(const k in THUMBS)delete THUMBS[k];}
  if(key==='steer'){if(val==='tilt')requestTilt();calibrateTilt();}
  applyHudStyle();}
buildSettings=function(){
  const box=$('#setOpts');box.innerHTML='';
  for(const[sect,rows]of UIS){const h=document.createElement('div');h.className='sect';h.textContent=sect;box.appendChild(h);
    for(const[key,label,kind,mn,mx,st,fmt]of rows){const row=document.createElement('div');row.className='opt';const sp=document.createElement('span');sp.textContent=label;row.appendChild(sp);
      if(kind==='switch'){const b=document.createElement('button');b.className='sw'+(settings[key]?' on':'');b.setAttribute('role','switch');b.setAttribute('aria-checked',!!settings[key]);b.setAttribute('aria-label',label);
        b.addEventListener('click',()=>{onSetting(key,!settings[key]);b.classList.toggle('on',!!settings[key]);b.setAttribute('aria-checked',!!settings[key]);});row.appendChild(b);}
      else if(kind==='slider'){const w=document.createElement('div');w.className='sl';const inp=document.createElement('input');inp.type='range';inp.min=mn;inp.max=mx;inp.step=st;inp.value=settings[key];inp.setAttribute('aria-label',label);
        const out=document.createElement('output');const paint=()=>{const p=(inp.value-mn)/(mx-mn)*100;inp.style.setProperty('--p',p+'%');out.textContent=fmt(+inp.value);};paint();
        inp.addEventListener('input',()=>{paint();onSetting(key,+inp.value);});inp.addEventListener('change',()=>{if(key==='hapN'&&+inp.value>0)Hap.play([0,60],[0,180],true);});w.append(inp,out);row.appendChild(w);}
      else{const def=SETS.find(s=>s[0]===key);if(!def)continue;const seg=document.createElement('div');seg.className='seg';
        for(const[val,txt]of def[2]){const b=document.createElement('button');b.textContent=txt;if(settings[key]===val)b.className='on';b.addEventListener('click',()=>{onSetting(key,val);buildSettings();});seg.appendChild(b);}row.appendChild(seg);}
      box.appendChild(row);}}};
/* the intro no longer ends on a tap: taps only switch the sound on; use Skip */
Object.assign(window.__oosht||{},{introMovie,toggleSound});
