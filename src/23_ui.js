/* ================= WISE CITY: intro movie, Material-style menus, settings sliders, sound toggle ================= */

/* ---------- the intro movie that follows the production credit ---------- */
/* ---------- the intro film: production credit, then a game-styled trailer with live HUD moments ---------- */
const INTRO_THEME={name:'intro',bpm:108,scale:[0,2,3,5,7,8,10],root:50,kit:'cine',lead:'sawtooth',pad:true,prog:[0,5,3,4]};
const FNT={d:"WCDisplay, Impact, 'Arial Narrow', sans-serif",l:"WCLogo, Impact, 'Arial Black', sans-serif",s:"WCScript, 'Brush Script MT', cursive",h:"WCHud, 'Roboto Mono', monospace"};
const MOV={started:false,cues:[],bld:null,w:0};
const FILM_END=14,LOGO_AT=9;
function sirenSnd(dur){const c=Snd.ctx;if(!c||c.state!=='running')return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();o.type='square';lp.type='lowpass';lp.frequency.value=1800;
  for(let k=0;k<dur*2;k++){o.frequency.setValueAtTime(k%2?650:900,t+k*.5);}o.connect(lp);lp.connect(g);g.connect(Snd.master);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.4);g.gain.setValueAtTime(.05,t+dur-.6);g.gain.linearRampToValueAtTime(0,t+dur);o.start(t);o.stop(t+dur+.1);}
const ease=k=>1-Math.pow(1-clamp(k,0,1),3);
const pop=k=>{k=clamp(k,0,1);return k<.6?ease(k/.6)*1.18:1.18-(k-.6)/.4*.18;};
const win=(T,a,b,f)=>clamp((T-a)/f,0,1)*clamp((b-T)/f,0,1);

/* game-style text: hard drop shadow, thick dark outline, then fill (colour or gradient) */
function gText(c,txt,x,y,px,o){o=o||{};c.save();c.translate(x,y);if(o.skew)c.transform(1,0,-o.skew,1,0,0);if(o.sc)c.scale(o.sc,o.sc);
  c.font=`${px}px ${o.font||FNT.d}`;c.textAlign=o.align||'center';c.textBaseline='middle';try{c.letterSpacing=(o.ls||0)+'px';}catch(e){}
  c.lineJoin='round';c.globalAlpha=o.a==null?1:o.a;const sw=o.sw==null?px*.12:o.sw;
  if(o.drop!==false){c.fillStyle='rgba(0,0,0,.55)';c.fillText(txt,px*.05,px*.07);if(sw){c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=sw;c.strokeText(txt,px*.05,px*.07);}}
  if(o.glow){c.shadowColor=o.glow;c.shadowBlur=o.gb||px*.4;}
  if(sw){c.strokeStyle=o.stroke||'#0B0614';c.lineWidth=sw;c.strokeText(txt,0,0);}
  c.shadowBlur=0;c.fillStyle=typeof o.fill==='function'?o.fill(c,px):(o.fill||'#FFF');c.fillText(txt,0,0);c.restore();}
/* neon tube script with a white-hot core */
function neon(c,txt,x,y,px,col,a,o){o=o||{};if(a<=0)return;c.save();c.translate(x,y);c.rotate(o.rot||-.06);c.font=`${px}px ${FNT.s}`;c.textAlign=o.align||'center';c.textBaseline='middle';c.globalAlpha=a;
  c.lineJoin='round';c.strokeStyle='rgba(10,4,20,.85)';c.lineWidth=px*.16;c.strokeText(txt,0,0);
  c.shadowColor=col;c.shadowBlur=px*.6;c.fillStyle=col;c.fillText(txt,0,0);c.shadowBlur=px*.25;c.fillText(txt,0,0);
  c.shadowBlur=0;c.globalAlpha=a*.75;c.fillStyle='#FFF4FB';c.lineWidth=px*.02;c.strokeStyle='#FFF4FB';c.strokeText(txt,0,0);c.restore();}
function star(c,x,y,r,fill){c.save();c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();
  c.lineJoin='round';c.lineWidth=r*.28;c.strokeStyle='#0B0614';c.stroke();c.fillStyle=fill;c.fill();c.restore();}
/* fixed-width digits so a ticking number never jitters */
function digits(c,txt,x,y,px,fill,align){c.save();c.font=`${px}px ${FNT.h}`;c.textBaseline='middle';c.textAlign='center';const adv=px*.66;const W=[...txt].reduce((s,ch)=>s+(/[0-9]/.test(ch)?adv:c.measureText(ch).width+px*.06),0);
  let cx=align==='right'?x-W:align==='left'?x:x-W/2;c.lineJoin='round';
  for(const ch of txt){const cw=/[0-9]/.test(ch)?adv:c.measureText(ch).width+px*.06;const mx=cx+cw/2;c.lineWidth=px*.16;c.strokeStyle='#0B0614';c.strokeText(ch,mx,y);c.fillStyle=fill;c.fillText(ch,mx,y);cx+=cw;}c.restore();}
const rupees=n=>'₹'+Math.round(n).toLocaleString('en-IN');

function cityBack(c,w,h,dpr,T,base,lit,hk){hk=hk||1;if(!MOV.bld||MOV.w!==w){const r=mulberry32(9);MOV.w=w;MOV.bld=[];for(let L=0;L<2;L++){const row=[];for(let x=0;x<w*2.4;){const bw=(26+r()*70)*dpr,bh=h*(L?.1+r()*.3:.16+r()*.44);row.push({x,bw,bh,win:[...Array(24)].map(()=>r()<.42)});x+=bw+r()*6*dpr;}MOV.bld.push(row);}}
  MOV.bld.forEach((row,L)=>{const off=(T*(L?60:25)*dpr)%(w*1.2);for(const b of row){const x=b.x-off;if(x>w||x+b.bw<0)continue;c.fillStyle=L?'#06070D':'#0D0F1C';c.fillRect(x,base-b.bh*hk,b.bw,b.bh*hk);
    if(!L){c.fillStyle=lit||'rgba(255,199,90,.5)';for(let i=0;i<b.win.length;i++)if(b.win[i]){const cx=x+4*dpr+(i%3)*(b.bw-10*dpr)/3,cy=base-b.bh*hk+8*dpr+Math.floor(i/3)*15*dpr;if(cy<base-8*dpr)c.fillRect(cx,cy,5*dpr,7*dpr);}}}});}
function synthSky(c,w,h,base,k){const g=c.createLinearGradient(0,0,0,base);g.addColorStop(0,'#0E0726');g.addColorStop(.5,'#3B0F4F');g.addColorStop(.82,'#B4246B');g.addColorStop(1,'#FF8A3D');c.fillStyle=g;c.fillRect(0,0,w,base);
  const sr=h*.27,sx=w/2,sy=base-h*.08;c.save();c.beginPath();c.rect(0,0,w,base);c.clip();const sg=c.createLinearGradient(0,sy-sr,0,sy);sg.addColorStop(0,'#FFE66B');sg.addColorStop(1,'#FF3FA4');c.fillStyle=sg;c.shadowColor='#FF5FA0';c.shadowBlur=h*.12;
  c.beginPath();c.arc(sx,sy,sr,0,TAU);c.fill();c.shadowBlur=0;c.fillStyle='#3B0F4F';for(let i=0;i<7;i++){const yy=sy-sr*.05-i*sr*.13-((k*sr*.13)%(sr*.13));const th=sr*(.09-i*.011);if(th>0)c.fillRect(sx-sr,yy,sr*2,th);}c.restore();}
function gridFloor(c,w,h,base,T,dpr){c.fillStyle='#0A0418';c.fillRect(0,base,w,h-base);c.strokeStyle='rgba(255,63,164,.75)';c.lineWidth=1.6*dpr;c.shadowColor='#FF3FA4';c.shadowBlur=8*dpr;c.beginPath();
  for(let i=-14;i<=14;i++){c.moveTo(w/2+i*w*.012,base);c.lineTo(w/2+i*w*.16,h);}for(let i=0;i<10;i++){const k=((i+(T*1.4)%1)/10);const y=base+(h-base)*k*k;c.moveTo(0,y);c.lineTo(w,y);}c.stroke();c.shadowBlur=0;}
function autoSil(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#1E7A43';c.beginPath();c.moveTo(-40,0);c.lineTo(-40,-34);c.quadraticCurveTo(-20,-52,20,-48);c.lineTo(34,-20);c.lineTo(36,0);c.closePath();c.fill();
  c.fillStyle='#F2C21B';c.fillRect(-40,-46,58,10);c.fillStyle='#111';for(const xx of[-28,26]){c.beginPath();c.arc(xx,2,9,0,TAU);c.fill();}c.fillStyle='#FFF4C8';c.fillRect(32,-16,6,6);c.restore();}
function copSil(c,x,y,s,T){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#E9EDF2';c.fillRect(-60,-30,120,26);c.fillRect(-36,-48,64,20);c.fillStyle='#1F3E8F';c.fillRect(-60,-20,120,6);c.fillStyle='#111';for(const xx of[-38,38]){c.beginPath();c.arc(xx,0,10,0,TAU);c.fill();}
  const fl=Math.floor(T*8)%2;c.fillStyle=fl?'#FF2A2A':'#2A5BFF';c.fillRect(-20,-54,18,6);c.fillStyle=fl?'#2A5BFF':'#FF2A2A';c.fillRect(2,-54,18,6);c.restore();}
function sportSil(c,x,y,s,rot){c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);c.fillStyle='#FF3FA4';c.beginPath();c.moveTo(-62,-6);c.lineTo(-58,-22);c.lineTo(-22,-26);c.lineTo(-6,-40);c.lineTo(26,-40);c.lineTo(46,-24);c.lineTo(64,-20);c.lineTo(66,-6);c.closePath();c.fill();
  c.fillStyle='#2EE6E6';c.beginPath();c.moveTo(-2,-37);c.lineTo(24,-37);c.lineTo(38,-25);c.lineTo(-14,-25);c.closePath();c.fill();c.fillStyle='#0B0614';for(const xx of[-38,40]){c.beginPath();c.arc(xx,-4,11,0,TAU);c.fill();}c.fillStyle='#FFF7C8';c.fillRect(60,-18,6,5);c.restore();}

/* the in-game HUD as it appears in the trailer */
function filmHud(c,w,h,dpr,T,cash,stars){const top=h*.07,pad=h*.05,a=clamp((T-6)/.5,0,1);if(a<=0)return;c.save();c.globalAlpha=a;
  digits(c,rupees(cash),w-pad,top+h*.15,Math.round(h*.075),'#7CFF8A','right');
  for(let i=0;i<stars;i++){const on=Math.floor(T*6)%2||T%1<.5;star(c,w-pad-h*.03-i*h*.07,top+h*.24,h*.028,on?'#FFF':'#FFC72C');}
  const mr=h*.1,mx=pad+mr,my=h*.07+pad*.6+mr;c.fillStyle='rgba(8,10,18,.82)';c.beginPath();c.arc(mx,my,mr,0,TAU);c.fill();c.save();c.beginPath();c.arc(mx,my,mr,0,TAU);c.clip();c.translate(mx,my);c.rotate(-T*.15);
  c.strokeStyle='#C9CFD8';c.lineWidth=3*dpr;for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*mr*.42,-mr);c.lineTo(i*mr*.42,mr);c.stroke();c.beginPath();c.moveTo(-mr,i*mr*.38+((T*20*dpr)%(mr*.38)));c.lineTo(mr,i*mr*.38+((T*20*dpr)%(mr*.38)));c.stroke();}
  c.strokeStyle='#B388FF';c.lineWidth=5*dpr;c.beginPath();c.moveTo(0,0);c.lineTo(mr*.42,-mr*.3);c.lineTo(mr*.42,-mr);c.stroke();c.restore();
  c.lineWidth=3*dpr;c.strokeStyle='#0B0614';c.beginPath();c.arc(mx,my,mr,0,TAU);c.stroke();c.fillStyle='#FFF';c.beginPath();c.moveTo(mx,my-9*dpr);c.lineTo(mx-7*dpr,my+7*dpr);c.lineTo(mx,my+3*dpr);c.lineTo(mx+7*dpr,my+7*dpr);c.closePath();c.fill();c.restore();}
function subtitle(c,w,h,dpr,who,col,line,a){if(a<=0)return;c.save();c.globalAlpha=a;const px=Math.round(h*.05);c.font=`${px}px ${FNT.d}`;try{c.letterSpacing='1px';}catch(e){}
  const tw=c.measureText(who+'  '+line).width;const y=h*.93-h*.08;c.fillStyle='rgba(6,6,12,.6)';const bw=tw+px*1.4,bh=px*1.5;c.beginPath();c.roundRect?c.roundRect(w/2-bw/2,y-bh/2,bw,bh,bh*.3):c.rect(w/2-bw/2,y-bh/2,bw,bh);c.fill();
  c.textBaseline='middle';c.textAlign='left';let x=w/2-tw/2;c.fillStyle=col;c.fillText(who,x,y);x+=c.measureText(who+'  ').width;c.fillStyle='#FFF';c.fillText(line,x,y);c.restore();}

function introFilm(c,w,h,dpr,T){
  /* Three strictly sequential beats; nothing is ever drawn on top of the production credit.
     1) 0.0-4.0  black CRT card: AN ANIRUDH PRODUCTION / (ARK CREATIONS), fully faded out before anything else
     2) 4.0-9.0  slow skyline pan, one credit card at a time in the empty sky
     3) 9.0-14.0 WISE CITY logo reveal with the synth swell, then fade to black */
  if(!MOV.started){MOV.started=true;MOV.cues=[[.35,'tick'],[.5,'tick'],[.65,'tick'],[.8,'tick'],[.95,'tick'],[1.1,'tick'],[1.25,'tick'],[1.45,'thud'],[1.9,'buzz'],[4.05,'music'],[9.3,'logo']];}
  while(MOV.cues.length&&MOV.cues[0][0]<=T){const k=MOV.cues.shift()[1];
    if(k==='tick'){Snd.tone&&Snd.tone([1800],.02,'square',.025);}
    else if(k==='thud'){introSound('boom');Hap.play([0,60,40,120],[0,200,0,120],true);}
    else if(k==='buzz'){Snd.burst&&Snd.burst(.35,120,6,.06,'bandpass');}
    else if(k==='music'&&Snd.ctx){MUS.menu=true;musPlay(INTRO_THEME,.36);}
    else if(k==='logo'){introSound('boom');Hap.play([0,80,60,240],[0,255,0,200],true);}}
  c.globalAlpha=1;
  if(T<4){/* ---- Beat 1: black CRT title card, credit alone in the centre ---- */
    c.fillStyle='#000';c.fillRect(0,0,w,h);
    const a=clamp((T-.25)/.3,0,1)*clamp((3.85-T)/.6,0,1);
    if(a>0){const px=Math.round(Math.min(h*.11,w*.062)),full='AN ANIRUDH PRODUCTION',n=Math.min(full.length,Math.floor(clamp((T-.35)/1.05,0,1)*full.length+.001));
      const sp=T<1.6?Math.max(0,1.6-T)*h*.004:0;
      c.save();c.globalAlpha=a;
      gText(c,full.slice(0,n),w/2,h*.45,px,{ls:px*.12,fill:(cc,p)=>{const g=cc.createLinearGradient(0,-p*.5,0,p*.5);g.addColorStop(0,'#FFFFFF');g.addColorStop(.55,'#E8EEF5');g.addColorStop(.56,'#9AA6B8');g.addColorStop(1,'#F4F7FB');return g;},glow:'rgba(255,255,255,.35)',gb:px*.3});
      if(sp>0){gText(c,full.slice(0,n),w/2-sp,h*.45,px,{ls:px*.12,fill:'#FF3FA4',a:.35*a,sw:0,drop:false});gText(c,full.slice(0,n),w/2+sp,h*.45,px,{ls:px*.12,fill:'#2EE6E6',a:.35*a,sw:0,drop:false});}
      const on=T>1.9&&!(T>2.02&&T<2.1)&&!(T>2.22&&T<2.27);neon(c,'(ARK CREATIONS)',w/2,h*.6,Math.round(px*.78),'#FF3FA4',on?a:0);c.restore();}
    /* scanlines and a soft vignette give the CRT feel */
    c.fillStyle='rgba(255,255,255,.035)';for(let y=0;y<h;y+=3*dpr)c.fillRect(0,y,w,dpr);
    const vg=c.createRadialGradient(w/2,h/2,h*.3,w/2,h/2,w*.7);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.65)');c.fillStyle=vg;c.fillRect(0,0,w,h);}
  else if(T<9){/* ---- Beat 2: slow skyline pan, one credit card at a time in the sky ---- */
    const t=T-4,base=h*.8;synthSky(c,w,h,base,t*.3);cityBack(c,w,h,dpr,t*.5,base,'rgba(255,220,150,.7)',.55);vidhana(c,w*.32-t*6*dpr,base,h/420);
    c.fillStyle='#090512';c.fillRect(0,base,w,h-base);c.fillStyle='rgba(255,199,44,.5)';for(let x=(-(t*120*dpr))%(90*dpr);x<w;x+=90*dpr)c.fillRect(x,base+(h-base)*.5,44*dpr,4*dpr);
    const card=(t0,t1,top,big)=>{const a=clamp((T-t0)/.45,0,1)*clamp((t1-T)/.45,0,1);if(a<=0)return;
      gText(c,top,w/2,h*.2,Math.round(h*.045),{ls:h*.014,a,fill:'#2EE6E6',drop:false,sw:h*.006});
      gText(c,big,w/2,h*.31,Math.round(Math.min(h*.1,w*.06)),{ls:h*.01,a,skew:.08,fill:'#FFFFFF',glow:'rgba(255,63,164,.7)'});};
    card(4.35,6.55,'STARRING','TONY');card(6.75,8.75,'AND THE STREETS OF','BENGALURU');
    const fin=clamp((T-4)/.6,0,1),fout=clamp((T-8.75)/.25,0,1);c.fillStyle=`rgba(0,0,0,${Math.max(1-fin,fout)})`;c.fillRect(0,0,w,h);}
  else{/* ---- Beat 3: the WISE CITY logo ---- */
    const t=T-9,base=h*.62;synthSky(c,w,h,base,t);cityBack(c,w,h,dpr,t*.6,base,'rgba(255,220,150,.75)',.5);gridFloor(c,w,h,base,T,dpr);
    if(t>.3&&t<.65){c.fillStyle=`rgba(255,240,250,${.85*(1-(t-.3)/.35)})`;c.fillRect(0,0,w,h);}
    const px=Math.round(Math.min(h*.26,w*.13)),k=t-.3,sc=k<.3?2.2-ease(Math.max(0,k)/.3)*1.2:1,a=clamp(k/.15,0,1);
    if(k>0){gText(c,'WISE CITY',w/2+h*.012,h*.38+h*.012,px,{font:FNT.l,skew:.12,sc,a:a*.85,fill:'#2EE6E6',sw:0,drop:false});
      gText(c,'WISE CITY',w/2,h*.38,px,{font:FNT.l,skew:.12,sc,a,sw:px*.1,stroke:'#14082A',glow:'rgba(255,63,164,.9)',gb:px*.35,fill:(cc,p)=>{const g=cc.createLinearGradient(0,-p*.5,0,p*.5);g.addColorStop(0,'#FFF6B0');g.addColorStop(.42,'#FFC72C');g.addColorStop(.5,'#FF8A3D');g.addColorStop(1,'#FF3FA4');return g;}});}
    if(k>.4&&k<1.3){const q=(k-.4)/.9;c.save();c.globalCompositeOperation='lighter';const sx=w*(.15+q*.7);const g=c.createLinearGradient(sx-w*.06,0,sx+w*.06,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,h*.22,w,h*.32);c.restore();}
    const fo=clamp((T-13.3)/.7,0,1);if(fo>0){c.fillStyle=`rgba(0,0,0,${fo})`;c.fillRect(0,0,w,h);}
    if(T>=FILM_END)return true;}
  return false;}
function vidhana(c,cx,base,s){c.save();c.translate(cx,base);c.scale(s,s);c.fillStyle='#0B0E15';c.fillRect(-120,-60,240,60);c.fillRect(-150,-38,300,38);c.fillRect(-40,-90,80,30);
  c.beginPath();c.arc(0,-90,26,Math.PI,0);c.fill();c.fillRect(-2,-128,4,14);for(let i=-5;i<=5;i++){c.fillStyle='rgba(255,210,140,.35)';c.fillRect(i*20-3,-52,6,40);}c.restore();}
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
Object.assign(window.__oosht||{},{introFilm,toggleSound});

/* ---------- the single map remembers where you were ---------- */
setInterval(()=>{if(state==='play'&&W.source==='tiles'&&!INT.on&&!FLY.on){const ll=w2ll(P.x,P.y);if(ll&&isFinite(ll[0])){profile.lastLoc={lat:+ll[0].toFixed(5),lon:+ll[1].toFixed(5)};saveProfile();}}},15000);
/* the airport is far out in Devanahalli: a cab takes you there for the flight mission */
{const m=MISSIONS.find(q=>q.id==='flight');m.need='Kempegowda Airport is far out of town. Tap again to take a cab there for ₹1,500.';
 const _ok=m.ok;m.ok=function(){return _ok();};
 const _start=misStart;misStart=function(q){if(q.id==='flight'&&!q.ok()){if(profile.wallet<1500){toast('The cab to the airport costs ₹1,500','bad');return;}
   profile.wallet-=1500;saveProfile();MIS.pendingFlight=true;state='play';show('play');startDrive({lat:13.1986,lon:77.7066,label:'Bengaluru'});return;}_start(q);};}
{const _sp=startPlay;startPlay=function(a){_sp(a);if(MIS.pendingFlight){MIS.pendingFlight=false;setTimeout(()=>{const m=MISSIONS.find(q=>q.id==='flight');if(m.ok())misStart(m);else toast('No planes found at the airport right now','bad');},1500);}};}
