/* ================= WISE CITY: intro movie, Material-style menus, settings sliders, sound toggle ================= */

/* ---------- the intro movie that follows the production credit ---------- */
/* ---------- the intro film: production credit, then a game-styled trailer with live HUD moments ---------- */
const INTRO_THEME={name:'intro',bpm:108,scale:[0,2,3,5,7,8,10],root:50,kit:'cine',lead:'sawtooth',pad:true,prog:[0,5,3,4]};
const FNT={d:"WCDisplay, Impact, 'Arial Narrow', sans-serif",l:"WCLogo, Impact, 'Arial Black', sans-serif",s:"WCScript, 'Brush Script MT', cursive",h:"WCHud, 'Roboto Mono', monospace"};
const MOV={started:false,cues:[],bld:null,w:0};
const FILM_END=24.2,LOGO_AT=19.5;
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
  if(!MOV.started){MOV.started=true;MOV.cues=[[.25,'rev'],[2.15,'shot'],[2.35,'shot'],[2.6,'shot'],[3.25,'boom'],[3.8,'buzz'],[5.6,'music'],[9.6,'siren'],[10.1,'ding'],[10.6,'ding'],[11.1,'ding'],[14.4,'whoosh'],[16.2,'land'],[17.1,'passed'],[19.75,'logo']];}
  while(MOV.cues.length&&MOV.cues[0][0]<=T){const k=MOV.cues.shift()[1];
    if(k==='rev'||k==='shot'||k==='boom'){introSound(k);if(k==='shot')Hap.play([0,40],[0,255],true);if(k==='boom')Hap.play([0,90,60,200],[0,255,0,140],true);if(k==='rev')Hap.play([0,500],[0,70],true);}
    else if(k==='buzz'){Snd.burst&&Snd.burst(.35,120,6,.06,'bandpass');}
    else if(k==='music'&&Snd.ctx){MUS.menu=true;musPlay(INTRO_THEME,.36);}
    else if(k==='siren')sirenSnd(3.8);
    else if(k==='ding'){Snd.tone&&Snd.tone([1320],.12,'square',.07);Hap.play([0,30],[0,200],true);}
    else if(k==='whoosh'){Snd.burst&&Snd.burst(1.4,700,.6,.18,'bandpass');}
    else if(k==='land'){Snd.burst&&Snd.burst(.4,90,.8,.5,'lowpass');Hap.play([0,120],[0,255],true);}
    else if(k==='passed'&&Snd.tone){[[523,0],[659,120],[784,240],[1047,380]].forEach(([f,d])=>setTimeout(()=>Snd.tone([f,f*1.5],.32,'square',.08),d));Hap.play([0,60,80,60,80,200],[0,180,0,180,0,255],true);}
    else if(k==='logo'){introSound('boom');Hap.play([0,80,60,240],[0,255,0,200],true);}}
  let base=h*.8;const cine=T<LOGO_AT;
  if(T<5.6){/* ---- 1. the production credit over a night street ---- */
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#05030C');sky.addColorStop(.7,'#171230');sky.addColorStop(1,'#2A1424');c.fillStyle=sky;c.fillRect(0,0,w,h);
    cityBack(c,w,h,dpr,T*.4,base);c.fillStyle='#07060D';c.fillRect(0,base,w,h-base);c.fillStyle='rgba(255,199,44,.5)';for(let x=(-(T*900*dpr))%(80*dpr);x<w;x+=80*dpr)c.fillRect(x,base+(h-base)*.45,36*dpr,3*dpr);
    if(T>.2&&T<1.9){const k=(T-.2)/1.7,x=-w*.2+k*w*1.4,y=base+(h-base)*.3;const g=c.createRadialGradient(x,y,0,x,y,w*.25);g.addColorStop(0,'rgba(255,245,215,.9)');g.addColorStop(.25,'rgba(255,230,170,.25)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);c.fillStyle='rgba(255,40,30,.8)';c.fillRect(x-w*.12,y-2*dpr,10*dpr,5*dpr);}
    for(const s of[2.15,2.35,2.6])if(T>s&&T<s+.09){const x=w*(.3+((s*7)%1)*.4),y=base-h*.18;const g=c.createRadialGradient(x,y,0,x,y,h*.35);g.addColorStop(0,'rgba(255,240,180,1)');g.addColorStop(.2,'rgba(255,160,40,.5)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);}
    c.fillStyle=`rgba(0,0,0,${T>3.2?Math.min(.55,(T-3.2)*.8):0})`;c.fillRect(0,0,w,h);
    if(T>3.25){const k=(T-3.25)/.28,sc=1+Math.max(0,1-k)*.9,sp=Math.max(0,1-k)*h*.03+Math.sin(T*40)*Math.max(0,.4-(T-3.25))*h*.01,px=Math.round(Math.min(h*.13,w*.075));const fo=clamp((5.5-T)/.4,0,1);
      gText(c,'AN ANIRUDH PRODUCTION',w/2-sp,h*.44,px,{fill:'#FF3FA4',sc,ls:px*.1,a:.7*fo,sw:0,drop:false});gText(c,'AN ANIRUDH PRODUCTION',w/2+sp,h*.44,px,{fill:'#2EE6E6',sc,ls:px*.1,a:.7*fo,sw:0,drop:false});
      gText(c,'AN ANIRUDH PRODUCTION',w/2,h*.44,px,{sc,ls:px*.1,a:fo,fill:(cc,p)=>{const g=cc.createLinearGradient(0,-p*.5,0,p*.5);g.addColorStop(0,'#FFFFFF');g.addColorStop(.55,'#E8EEF5');g.addColorStop(.56,'#9AA6B8');g.addColorStop(1,'#F4F7FB');return g;}});
      const on=T>3.8&&!(T>3.92&&T<4)&&!(T>4.12&&T<4.17);neon(c,'(ARK CREATIONS)',w/2,h*.62,Math.round(px*.82),'#FF3FA4',on?fo:0);}
    if(T>3.2&&T<3.6){c.fillStyle=`rgba(255,240,230,${.7*(1-(T-3.2)/.4)})`;c.fillRect(0,0,w,h);}}
  else if(T<9.6){/* ---- 2. Bengaluru at sunset, the HUD comes alive ---- */
    const t=T-5.6;synthSky(c,w,h,base,t);cityBack(c,w,h,dpr,t*1.2,base,'rgba(255,220,150,.7)',.6);vidhana(c,w*.3-t*8*dpr,base,h/420);
    c.fillStyle='#090512';c.fillRect(0,base,w,h-base);c.fillStyle='rgba(255,199,44,.55)';for(let x=(-(t*700*dpr))%(90*dpr);x<w;x+=90*dpr)c.fillRect(x,base+(h-base)*.5,44*dpr,4*dpr);
    sportSil(c,w*(.2+t*.06),base+(h-base)*.42,h/260,0);
    filmHud(c,w,h,dpr,T,2450+Math.min(1,t/3)*0,0);
    const a=win(T,6.3,8.2,.3);neon(c,'MG Road',w-h*.08,h*.6,Math.round(h*.16),'#FF3FA4',a,{align:'right'});gText(c,'NEON MILE',w-h*.12,h*.73,Math.round(h*.05),{align:'right',ls:h*.012,a,fill:'#2EE6E6'});
    {const b=win(T,8.15,9.45,.2);if(b>0){gText(c,'TONY',w*.3,h*.42,Math.round(h*.2),{skew:.14,sc:pop((T-8.15)/.3),ls:h*.01,a:b,glow:'rgba(255,63,164,.8)',fill:(cc,p)=>{const g=cc.createLinearGradient(0,-p*.5,0,p*.5);g.addColorStop(0,'#FFFFFF');g.addColorStop(1,'#FFC9E6');return g;}});gText(c,'THAT’S YOU',w*.3,h*.56,Math.round(h*.05),{ls:h*.014,a:b*clamp((T-8.4)*4,0,1),fill:'#2EE6E6'});}}
    const fade=clamp((T-9.3)/.3,0,1);if(fade>0){c.fillStyle=`rgba(0,0,0,${fade})`;c.fillRect(0,0,w,h);}}
  else if(T<13.6){/* ---- 3. the chase: stars, speed and a radio voice ---- */
    const t=T-9.6,k=t/4;c.fillStyle='#070512';c.fillRect(0,0,w,h);cityBack(c,w,h,dpr,t*6,base,'rgba(255,90,170,.55)');
    c.fillStyle='#0C0A14';c.fillRect(0,base,w,h-base);c.fillStyle='rgba(255,255,255,.35)';for(let x=-(t*900*dpr)%(90*dpr);x<w;x+=90*dpr)c.fillRect(x,base+(h-base)*.5,44*dpr,4*dpr);
    const s=h/300,ax=w*(.2+k*.45),ay=base+(h-base)*.18;autoSil(c,ax,ay,s);const px=ax-w*(.36-k*.1);copSil(c,px,ay,s,T);
    const gl=c.createRadialGradient(px,ay-48*s,0,px,ay-48*s,h*.5);gl.addColorStop(0,Math.floor(T*8)%2?'rgba(255,40,40,.35)':'rgba(40,90,255,.35)');gl.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gl;c.fillRect(0,0,w,h);
    const st=T<10.1?0:T<10.6?1:T<11.1?2:3;filmHud(c,w,h,dpr,T,2450,st);
    if(T>10.1&&T<11.6){const kk=(T-[10.1,10.6,11.1][st-1])/.3;gText(c,'WANTED',w-h*.32,h*.44,Math.round(h*.06),{fill:'#FFC72C',sc:pop(kk),ls:h*.01,a:clamp((11.6-T)/.3,0,1)});}
    const spd=Math.round(Math.min(1,t/3.2)*128);digits(c,String(spd).padStart(3,'0'),w-h*.2,h*.79,Math.round(h*.12),'#FFF','right');gText(c,'KM/H',w-h*.07,h*.81,Math.round(h*.04),{fill:'#FFC72C',drop:false});
    subtitle(c,w,h,dpr,'ARJUN:','#2EE6E6',t<2?'Tony! Hoysala on our tail!':'Floor it, Tony! Lose them in the side roads!',win(T,9.9,13.4,.25));}
  else if(T<17.1){/* ---- 4. stunt jump in slow motion ---- */
    const t=T-13.6;synthSky(c,w,h,base,t);cityBack(c,w,h,dpr,t*3,base,'rgba(255,220,150,.6)',.6);c.fillStyle='#090512';c.fillRect(0,base,w,h-base);
    const rx=w*.42;c.fillStyle='#FFC72C';c.beginPath();c.moveTo(rx-w*.12,base);c.lineTo(rx,base-h*.08);c.lineTo(rx,base);c.closePath();c.fill();c.fillStyle='#0B0614';for(let i=0;i<5;i++){c.beginPath();const a=i/5,b=(i+.5)/5;c.moveTo(rx-w*.12*(1-a),base-h*.08*a);c.lineTo(rx-w*.12*(1-b),base-h*.08*b);c.lineTo(rx-w*.12*(1-b),base);c.lineTo(rx-w*.12*(1-a),base);c.closePath();c.fill();}
    const tt=t<.8?t:t<2.4?.8+(t-.8)*.35:1.36+(t-2.4)*1.4;const x=w*.05+tt*w*.42;let y=base-h*.05,rot=0;
    if(x>rx-w*.12&&x<rx){const q=(x-(rx-w*.12))/(w*.12);y=base-h*.05-q*h*.08;rot=-.55;}else if(x>=rx){const q=(x-rx)/(w*.5);y=base-h*.13-Math.sin(Math.min(1,q)*Math.PI)*h*.22;rot=-.5+q*.9;if(q>=1)y=base-h*.05,rot=0;}
    const sh=T>16.2&&T<16.5?(Math.random()-.5)*h*.03:0;c.save();c.translate(sh,sh);sportSil(c,x,y,h/240,rot);c.restore();
    filmHud(c,w,h,dpr,T,2450+(T>15.2?Math.min(1,(T-15.2)/1.2)*1200:0),0);
    if(T>14.9){const kk=(T-14.9)/.35;gText(c,'STUNT JUMP!',w/2,h*.3,Math.round(h*.15),{skew:.18,sc:pop(kk),ls:h*.008,a:clamp((16.9-T)/.3,0,1),fill:(cc,p)=>{const g=cc.createLinearGradient(0,-p*.5,0,p*.5);g.addColorStop(0,'#FFF3A0');g.addColorStop(.5,'#FFC72C');g.addColorStop(1,'#FF7A1A');return g;}});
      gText(c,'+₹1,200',w*.8,h*.3,Math.round(h*.07),{font:FNT.h,fill:'#7CFF8A',sc:pop((T-15.2)/.3),a:clamp((16.9-T)/.3,0,1)*clamp((T-15.2)*4,0,1)});}}
  else if(T<LOGO_AT){/* ---- 5. MISSION PASSED ---- */
    const t=T-17.1;synthSky(c,w,h,base,t);cityBack(c,w,h,dpr,t,base,'rgba(255,220,150,.6)',.6);c.fillStyle='#090512';c.fillRect(0,base,w,h-base);c.fillStyle='rgba(6,2,14,.55)';c.fillRect(0,0,w,h);
    const kk=t/.35,px=Math.round(Math.min(h*.2,w*.1));const a=clamp((LOGO_AT-.15-T)/.25,0,1);
    gText(c,'MISSION PASSED',w/2,h*.42,px,{skew:.14,sc:pop(kk),ls:px*.03,a,glow:'rgba(255,63,164,.8)',gb:px*.5,fill:(cc,p)=>{const g=cc.createLinearGradient(0,-p*.5,0,p*.5);g.addColorStop(0,'#FFF3A0');g.addColorStop(.48,'#FFC72C');g.addColorStop(.52,'#F59B00');g.addColorStop(1,'#FFD84D');return g;}});
    gText(c,'RESPECT +',w/2,h*.58,Math.round(px*.32),{fill:'#2EE6E6',ls:px*.04,a:a*clamp((t-.35)*4,0,1)});digits(c,rupees(Math.min(1,Math.max(0,t-.5)/1)*25000),w/2,h*.68,Math.round(px*.38),'#FFF','center');c.globalAlpha=1;}
  else{/* ---- 6. the WISE CITY logo over a synthwave Bengaluru ---- */
    const t=T-LOGO_AT;base=h*.62;synthSky(c,w,h,base,t);cityBack(c,w,h,dpr,t*.6,base,'rgba(255,220,150,.75)',.5);gridFloor(c,w,h,base,T,dpr);
    if(t<.35){c.fillStyle=`rgba(255,240,250,${.85*(1-t/.35)})`;c.fillRect(0,0,w,h);}
    const px=Math.round(Math.min(h*.26,w*.13)),sc=t<.3?2.2-ease(t/.3)*1.2:1,a=clamp(t/.15,0,1)*clamp((FILM_END-T)/.5,0,1);
    gText(c,'WISE CITY',w/2+h*.012,h*.36+h*.012,px,{font:FNT.l,skew:.12,sc,a:a*.85,fill:'#2EE6E6',sw:0,drop:false});
    gText(c,'WISE CITY',w/2,h*.36,px,{font:FNT.l,skew:.12,sc,a,sw:px*.1,stroke:'#14082A',glow:'rgba(255,63,164,.9)',gb:px*.35,fill:(cc,p)=>{const g=cc.createLinearGradient(0,-p*.5,0,p*.5);g.addColorStop(0,'#FFF6B0');g.addColorStop(.42,'#FFC72C');g.addColorStop(.5,'#FF8A3D');g.addColorStop(1,'#FF3FA4');return g;}});
    if(t>.4&&t<1.3){const k=(t-.4)/.9;c.save();c.globalCompositeOperation='lighter';const sx=w*(.15+k*.7);const g=c.createLinearGradient(sx-w*.06,0,sx+w*.06,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,h*.2,w,h*.32);c.restore();}
    if(t>1.6&&Math.floor(T*2.2)%2===0)gText(c,'TAP TO PLAY',w/2,h*.86,Math.round(h*.055),{font:FNT.h,ls:h*.012,fill:'#FFF',a:clamp((FILM_END-T)/.5,0,1)});
    if(T>FILM_END)return true;}
  if(cine){c.fillStyle='#000';c.fillRect(0,0,w,h*.07);c.fillRect(0,h*.93,w,h*.07);}
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
