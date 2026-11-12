/* ================= WISE CITY: free-roam activities. Cash van sightings, street-race challenges, gang fights,
   near-miss combos, roadside chai, and hidden Namma Tokens (some on metro platforms) ================= */
const SB={t:40,ev:null,combo:0,comboT:0,nmT:0,pop:null,tok:new Map(),tokT:0,coin:null};
if(!profile.tok)profile.tok=[];

/* ---------- combo / reward popup (one line, centre-right, fades fast) ---------- */
function sbPop(big,small,col){if(!SB.pop){const e=document.createElement('div');e.id='sbPop';e.style.cssText="position:fixed;right:calc(24px + env(safe-area-inset-right,0px));top:34%;z-index:31;pointer-events:none;text-align:right;transition:opacity .35s,transform .35s;opacity:0";
  e.innerHTML='<div class="b" style="font-family:WCDisplay,Impact,sans-serif;font-size:clamp(24px,6vh,40px);letter-spacing:.03em;transform:skewX(-10deg);-webkit-text-stroke:1.5px #14082A;paint-order:stroke fill;text-shadow:0 3px 0 rgba(0,0,0,.45)"></div><div class="s" style="font-family:WCHud,monospace;font-size:clamp(14px,3.4vh,20px);color:#7CFF8A;text-shadow:0 2px 0 #000"></div>';document.body.appendChild(e);SB.pop=e;}
  const e=SB.pop;e.querySelector('.b').textContent=big;e.querySelector('.b').style.color=col||'#FFC72C';e.querySelector('.s').textContent=small||'';e.style.opacity='1';e.style.transform='scale(1.08)';
  setTimeout(()=>{e.style.transform='scale(1)';},120);clearTimeout(SB.popT);SB.popT=setTimeout(()=>{e.style.opacity='0';},1800);}

/* ---------- near misses: passing traffic within 1.5 m above 60 km/h, chained into a combo ---------- */
function nearMissTick(dt){SB.comboT-=dt;if(SB.comboT<=0&&SB.combo){SB.combo=0;}
  if(FOOT.on||FLY.on||P.s<16.7||P.bumped)return;const fx=Math.sin(P.h),fy=-Math.cos(P.h);
  for(const a of agents){if(a.fallen||(a.nmT||0)>GT)continue;const dx=a.x-P.x,dy=a.y-P.y;if(dx*dx+dy*dy>64)continue;
    const u=dx*fx+dy*fy,w=-dx*fy+dy*fx;if(Math.abs(u)>(P.len+a.t.len)/2)continue;const gap=Math.abs(w)-(P.wid+a.t.wid)/2;
    if(gap>0&&gap<1.5){a.nmT=GT+4;SB.combo=Math.min(10,SB.combo+1);SB.comboT=4;const pay=25*SB.combo;profile.wallet+=pay;saveProfile();
      sbPop(SB.combo>1?`NEAR MISS x${SB.combo}`:'NEAR MISS',`+₹${pay}`,SB.combo>3?'#FF3FA4':'#FFC72C');Snd.tone&&Snd.tone([660+SB.combo*60],.08,'triangle',.08);Hap.tick&&Hap.tick();}}}
{const _up2=updatePlayer;updatePlayer=function(dt){P.bumped=false;_up2(dt);try{nearMissTick(dt);}catch(e){}};}

/* ---------- roadside chai: every vendor cart sells tea ---------- */
function chaiCtx(){if(!FOOT.on||FOOT.ride||INT.on)return null;for(const p of peds){if(p.kind!=='vendor'||p.state!=='static'||p.dead)continue;
  if(Math.hypot(p.x-P.x,p.y-P.y)<2.3||(p.cx!=null&&Math.hypot(p.cx-P.x,p.cy-P.y)<2.3))return {k:'item',it:{fn:()=>buyChai(p)},label:'Buy chai ₹10'};}return null;}
function buyChai(p){if(profile.wallet<10){toast('You need ₹10','bad');return;}profile.wallet-=10;saveProfile();LIFE.hp=Math.min(100,LIFE.hp+15);FOOT.stam=maxStam();
  toast('Cutting chai · +15 health','good');Snd.chime();try{say('vendor','vendor',true);}catch(e){}}
{const _fc=findContext;findContext=function(){const c=chaiCtx();if(c)return c;return _fc();};}

/* ---------- Namma Tokens: stable spots tied to real coordinates, plus one on every metro platform ---------- */
function tokCells(){const out=[];const ll=w2ll(P.x,P.y);const G=.0027;/* about 300 m */const ci=Math.floor(ll[0]/G),cj=Math.floor(ll[1]/G);
  for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const a=ci+i,b=cj+j,key=a+'_'+b;if((hash2(a*7+3,b*13+5)>>>0)%3!==0)continue;out.push({key,lat:(a+.5)*G,lon:(b+.5)*G});}return out;}
function tokScan(){
  for(const c of tokCells()){if(SB.tok.has(c.key))continue;const w=ll2w(c.lat,c.lon);const n=nearestSeg(w[0],w[1],160,s=>!s.w.br);if(!n.seg)continue;const s=n.seg;
    const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;const t=clamp((w[0]-s.ax)*dx+(w[1]-s.ay)*dy,2,Math.max(2,s.len-2));let x=s.ax+dx*t+dy*(s.w.hw+1.4),y=s.ay+dy*t-dx*(s.w.hw+1.4);
    if(inBuilding(x,y)){x=s.ax+dx*t-dy*(s.w.hw+1.4);y=s.ay+dy*t+dx*(s.w.hw+1.4);}if(inBuilding(x,y))continue;SB.tok.set(c.key,{key:c.key,x,y,z:.9});}
  for(const st of METRO.stations||[]){const key='m_'+(st.name||Math.round(st.x)+'_'+Math.round(st.y));if(SB.tok.has(key))continue;SB.tok.set(key,{key,x:st.x,y:st.y,z:12.05+.9,elev:true});}
  for(const[k,t]of SB.tok)if(Math.hypot(t.x-P.x,t.y-P.y)>1600)SB.tok.delete(k);}
function tokTick(){for(const[k,t]of SB.tok){if(profile.tok.includes(k))continue;const d=Math.hypot(t.x-P.x,t.y-P.y);if(d>2)continue;
  if(t.elev&&!(FOOT.on&&(P.elev||0)>10))continue;if(!t.elev&&(P.elev||0)>2)continue;
  profile.tok.push(k);const pay=t.elev?750:250;profile.wallet+=pay;saveProfile();sbPop('NAMMA TOKEN',`${profile.tok.length} found · +₹${pay}`,'#FFD84D');Snd.chime();Hap.success&&Hap.success();}}
function coinMesh(){if(SB.coin)return SB.coin;const mb=new MB();mb.cyl(0,0,0,.42,.1,'z',16,[1,.8,.15],[1,.88,.3],.8,.6);mb.box(0,0,0,.18,.5,.12,[1,.95,.6],1);SB.coin=mb.mesh();return SB.coin;}
RLAYERS.push((A,n)=>{const m=coinMesh();for(const[k,t]of SB.tok){if(profile.tok.includes(k))continue;if(Math.hypot(t.x-CAM.eye[0],t.y-CAM.eye[2])>180)continue;
  M4.model(TM,t.x,t.z+Math.sin(GT*2.5+t.x)*.12,t.y,GT*2.2,0,0);drawLit(m,TM,{emiK:1.4,emiAdd:[.5,.38,.05],noHL:true});DGr.bill(t.x,t.z,t.y,.9,[1,.75,.15],CAM.right);}});
{const _fm2=footMini;footMini=function(m,R,arrow){_fm2(m,R,arrow);for(const[k,t]of SB.tok){if(profile.tok.includes(k)||Math.abs(t.x-P.x)>R||Math.abs(t.y-P.y)>R)continue;m.fillStyle='#FFD84D';m.beginPath();m.arc(t.x,t.y,7,0,TAU);m.fill();}};}

/* ---------- random world events within 150 m, cleaned up when you leave ---------- */
function evCashVan(){const a=spawnAgent(false);if(!a)return null;const base=TT.find(q=>q.k==='suv')||a.t;a.t=Object.assign({},base,{k:'suv',cash:true,cruise:.85});a.model=trafficModel(a.t,'#E8E8E2');a.cashVan=true;a.vanHits=0;agents.push(a);
  toast('Armoured cash van spotted nearby · ram it to spill the cash','gold','ev',4000);return {k:'van',a,t:0};}
function evGang(){const n=nearestSeg(P.x+Math.sin(P.h)*45,P.y-Math.cos(P.h)*45,40,s=>!s.w.br);if(!n.seg)return null;const s=n.seg;const cx=(s.ax+s.bx)/2+(s.by-s.ay)/s.len*(s.w.hw+2),cy=(s.ay+s.by)/2-(s.bx-s.ax)/s.len*(s.w.hw+2);
  const red={kind:'walk',shirt:'#B71C1C',pants:'#111',cap:'#111'},org={kind:'walk',shirt:'#E65100',pants:'#3E2723',cap:'#E65100'};const g=[];
  for(let i=0;i<3;i++){g.push(misPed(red,cx-1.2,cy+i*1.2-1.2,{state:'brawl',role:'gang',side:0}));g.push(misPed(org,cx+1.2,cy+i*1.2-1.2,{state:'brawl',role:'gang',side:1}));}
  toast('Gang fight up ahead · stay clear or get involved','bad','ev',3500);return {k:'gang',g,t:0,x:cx,y:cy};}
function evRace(){if(FOOT.on||P.s>3)return null;const ang=P.h+(Math.random()-.5)*1.2,dist=900+Math.random()*500;const tx=P.x+Math.sin(ang)*dist,ty=P.y-Math.cos(ang)*dist;
  const n=nearestSeg(tx,ty,200,s=>!s.w.br);if(!n.seg)return null;const s=n.seg;const x=(s.ax+s.bx)/2,y=(s.ay+s.by)/2;
  toast('A street racer revs at you · honk within 8 s to race','gold','ev',5000);Snd.burst&&Snd.burst(.6,120,1,.5);return {k:'race',x,y,t:0,state:'offer',d:Math.hypot(x-P.x,y-P.y)};}
function evTick(dt){const E=SB.ev;if(!E)return;E.t+=dt;
  if(E.k==='van'){const a=E.a;if(!agents.includes(a)){SB.ev=null;return;}
    if(!a.burst&&!FOOT.on&&Math.hypot(a.x-P.x,a.y-P.y)<(a.t.len+P.len)/2+.3&&Math.abs(P.s)>4&&(a.hitCD||0)<GT){a.hitCD=GT+.6;a.vanHits++;SFX&&SFX.metal(.8);
      if(a.vanHits>=3||Math.abs(P.s)>14){a.burst=true;a.stop=99;a.v=0;for(let i=0;i<6;i++)dropCash(a.x+(Math.random()-.5)*3,a.y+(Math.random()-.5)*3,1500+Math.floor(Math.random()*2000));
        sbPop('CASH VAN DOWN','grab the money','#7CFF8A');forceChase(2,'van');}else toast(`Van hit ${a.vanHits}/3`,'','van',900);}
    if(E.t>150||Math.hypot(a.x-P.x,a.y-P.y)>320){if(!a.burst){const i=agents.indexOf(a);if(i>=0)agents.splice(i,1);}SB.ev=null;}}
  else if(E.k==='gang'){for(const p of E.g){if(p.state==='brawl'){const ph=Math.floor(E.t*3+(p.side?1:0))%3;p.rp=ph===0?'punch':ph===1?'kick':'pose';const o=E.g.find(q=>q.side!==p.side&&q.state==='brawl');if(o)p.h=hAng(o.x-p.x,o.y-p.y);}}
    if(E.g.some(p=>p.hp<100||p.state==='down')){for(const p of E.g)if(p.state==='brawl'){p.state='hostile';p.armed=Math.random()<.3;p.rp=null;}}
    if(E.t>40||Math.hypot(E.x-P.x,E.y-P.y)>260){for(const p of E.g)if(!p.dead&&p.state!=='down')p.gone=true;SB.ev=null;}}
  else if(E.k==='race'){
    if(E.state==='offer'){if(input.horn&&!FOOT.on){E.state='go';E.t=0;E.limit=Math.round(E.d/15+12);try{setPin(E.x,E.y);WP.name='Race finish';}catch(e){}sbPop('RACE!',`beat ${E.limit} s`,'#FF3FA4');Snd.tone&&Snd.tone([880,1320],.3,'square',.08);}
      else if(E.t>8)SB.ev=null;return;}
    const left=E.limit-E.t;if(Math.floor(left)!==E.last&&left>=0){E.last=Math.floor(left);if(left<=5)Snd.tone&&Snd.tone([520],.06,'square',.05);}
    if(Math.hypot(E.x-P.x,E.y-P.y)<14){const pay=3000;profile.wallet+=pay;saveProfile();sbPop('RACE WON',`+₹${pay.toLocaleString('en-IN')} · ${Math.round(E.t)} s`,'#7CFF8A');Snd.chime();try{clearPin();}catch(e){}SB.ev=null;}
    else if(left<0||FOOT.on){sbPop('RACE LOST','the racer got there first','#E53935');try{clearPin();}catch(e){}SB.ev=null;}}}
{const _lu5=lifeUpdate;lifeUpdate=function(dt){_lu5(dt);if(state!=='play'||(typeof CUT!=='undefined'&&CUT.on))return;
  try{evTick(dt);SB.tokT-=dt;if(SB.tokT<=0){SB.tokT=2;tokScan();}tokTick();
    if(!SB.ev&&!MIS.cur&&!COP.level){SB.t-=dt;if(SB.t<=0){SB.t=70+Math.random()*80;const r=Math.random();SB.ev=r<.35?evCashVan():r<.65?evGang():evRace();}}}catch(e){}};}
Object.assign(window.__oosht||{},{SB,evCashVan,evGang,evRace,tokScan,sbPop,nearMissTick});
