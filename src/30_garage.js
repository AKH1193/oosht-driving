/* ================= WISE CITY: Pay 'n' Spray and mod garage (at every mechanic). Repaint, gold rims, GT wing,
   neon underglow, hydraulics that bounce to the radio, NOS and armour plating. Saved per vehicle with the profile ================= */
const MODP={paint:1500,neon:4000,rims:6000,wing:5000,hydro:12000,nos:18000,armor:60000};
const NEONS=[['Vice pink','#FF1493'],['Electric cyan','#00F2FF'],['Lime','#33FF26'],['Saffron','#FFA600'],['Royal purple','#A61AFF']];
const PAINTS=['#B3121F','#F2B705','#15171C','#E8E8E4','#0F3D7A','#1F7A3A','#FF3FA4','#7A1FA2','#FF6A00','#2EE6E6'];
const GOLD=[.95,.74,.18];
function modsOf(t){if(!profile.mods)profile.mods={};return profile.mods[t]||(profile.mods[t]={});}
function modCaps(t){const two=!!TWO_SPECS[t];const car=!two&&!['auto','bus','lorry','tractor','truck'].includes(t);return {paint:car||two,rims:car||two,wing:car,hydro:car,nos:true,neon:true,armor:true};}
const MODM=new Map();
function modModel(t){const m=modsOf(t),c=modCaps(t);const paint=c.paint&&m.paint,rims=c.rims&&m.rims,wing=c.wing&&m.wing;if(!paint&&!rims&&!wing)return null;
  const lk=typeof PLOOK!=='undefined'?PLOOK:{shirt:'#2F6FB2',pants:'#2B2F3A'};const key=[t,paint||'',rims?1:0,wing?1:0,lk.shirt,lk.pants].join('|');let mm=MODM.get(key);if(mm)return mm;
  if(TWO_SPECS[t])mm=buildTwo(Object.assign({},TWO_SPECS[t],{shirt:lk.shirt,pants:lk.pants},paint?{col:paint,lampShell:paint}:{},rims?{rim:GOLD}:{}));
  else mm=buildCar(t,paint||VEH[t].col,{rim:rims?GOLD:null,wing:!!wing});
  if(MODM.size>24)MODM.clear();MODM.set(key,mm);return mm;}
/* put the saved look on Tony's own vehicle (never on a stolen one, which keeps its own skin) */
function applyMods(){if(FOOT.on||FLY.on)return;if(P.skin&&!P.skin.mod)return;const mm=modModel(P.type);P.skin=mm?{model:mm,k:P.type,mod:true}:null;}
{const _spG=startPlay;startPlay=function(k){_spG(k);try{applyMods();}catch(e){}};}
{const _evG=enterVehicle;enterVehicle=function(c){const r=_evG(c);try{applyMods();}catch(e){}return r;};}
/* armour plating: no crash damage at all */
{const _dmG=damage;damage=function(n,silent){if(!FOOT.on&&modsOf(P.type).armor&&(!P.skin||P.skin.mod))return;_dmG(n,silent);};}

/* ---------- garage screen ---------- */
const GAR={el:null};
function garUI(){if(GAR.el)return GAR.el;const e=document.createElement('div');e.id='modScr';e.hidden=true;
  e.style.cssText='position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:14px;background:rgba(6,8,12,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)';
  const st=document.createElement('style');st.textContent=`
#modScr[hidden]{display:none!important}
#modScr .card{width:min(720px,100%);max-height:96vh}
#modScr h2{font-family:WCDisplay,Impact,sans-serif;font-weight:400;font-size:30px;letter-spacing:.04em;margin:0;color:#FFC72C;transform:skewX(-8deg);transform-origin:left}
#modScr .mr{display:grid;grid-template-columns:1fr auto;gap:6px 12px;align-items:center;padding:8px 0;border-top:1px solid rgba(255,255,255,.08)}
#modScr .mr b{font-size:15px}#modScr .mr small{display:block;opacity:.7;font-size:12px}
#modScr .sw8{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px}
#modScr .sw8 button{width:34px;height:34px;border-radius:50%;border:2px solid rgba(255,255,255,.35);padding:0}
#modScr .sw8 button.on{border-color:#fff;box-shadow:0 0 0 3px #FFC72C}
#modScr .sw8 button.off{background:#222;color:#fff;font-size:11px;width:auto;padding:0 12px;border-radius:17px}
#modScr .btn[disabled]{opacity:.4}`;document.head.appendChild(st);document.body.appendChild(e);GAR.el=e;return e;}
const rs=n=>'₹'+fmtINR(n);
function garPay(n){if(profile.wallet<n){toast('Not enough money','bad');return false;}profile.wallet-=n;saveProfile();return true;}
function garOpen(){const e=garUI();garDraw();e.hidden=false;}
function garClose(){if(GAR.el)GAR.el.hidden=true;try{$('#repWallet').textContent=rs(profile.wallet);}catch(e){}}
function garDraw(){const e=garUI(),t=P.type,m=modsOf(t),c=modCaps(t),V=VEH[t];const stolen=P.skin&&!P.skin.mod;
  const row=(title,desc,btn)=>`<div class="mr"><div><b>${title}</b><small>${desc}</small></div>${btn||''}</div>`;
  const tog=(k,name,desc,ok)=>!ok?row(name,'Not available for this vehicle','<button class="btn" disabled>N/A</button>'):m[k+'Own']?row(name,desc,`<button class="btn ${m[k]?'primary':''}" data-tog="${k}">${m[k]?'Fitted':'Fit'}</button>`):row(name,desc,`<button class="btn" data-buy="${k}">${rs(MODP[k])}</button>`);
  let h=`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2>Pay 'n' Spray &amp; Mods</h2><button class="btn primary" data-close="1">Done</button></div><p style="margin:0;opacity:.8">${V.name} · Wallet <b>${rs(profile.wallet)}</b>${stolen?' · This is not your vehicle, so mods cannot be fitted.':''}</p>`;
  if(!stolen){
    h+=c.paint?`<div class="mr"><div><b>Respray · ${rs(MODP.paint)}</b><small>Pick a colour. A respray also loses the police if none of them is watching.</small></div><span></span><div class="sw8">${PAINTS.map(p=>`<button data-paint="${p}" class="${m.paint===p?'on':''}" style="background:${p}" aria-label="Paint ${p}"></button>`).join('')}${m.paint?'<button class="off" data-paint="">Factory</button>':''}</div></div>`:row('Respray','Not available for this vehicle','<button class="btn" disabled>N/A</button>');
    h+=m.neonOwn?`<div class="mr"><div><b>Neon underglow</b><small>Glows at night and pulses to the radio.</small></div><span></span><div class="sw8">${NEONS.map((n,i)=>`<button data-neon="${i}" class="${m.neon===i?'on':''}" style="background:${n[1]}" aria-label="${n[0]}"></button>`).join('')}<button class="off ${m.neon==null?'on':''}" data-neon="-1">Off</button></div></div>`:row('Neon underglow','Glows at night and pulses to the radio.',`<button class="btn" data-buy="neon">${rs(MODP.neon)}</button>`);
    h+=tog('rims','Gold wire rims','Lowrider gold wheels.',c.rims)+tog('wing','Carbon GT wing','A big rear wing.',c.wing)
      +tog('hydro','Hydraulics','Hold HORN while stopped to bounce; steer to tilt. Bounces in time with the radio.',c.hydro)
      +tog('nos','NOS nitrous','Hold the NOS button for a 3-second boost. Refills as you drive.',c.nos)
      +tog('armor','Armour plating','Bulletproof tyres and an indestructible body: no crash damage.',c.armor);}
  h+=`</div>`;e.innerHTML=h;}
function garClick(ev){const b=ev.target.closest('button');if(!b||b.disabled)return;const t=P.type,m=modsOf(t);const d=b.dataset;
  if(d.close){garClose();return;}
  if(d.paint!==undefined){if(d.paint===''){delete m.paint;}else{if(m.paint===d.paint)return;if(!garPay(MODP.paint))return;m.paint=d.paint;Snd.burst&&Snd.burst(.7,3200,.6,.2,'highpass');
      if((COP.level||COP.list.length)&&!COP.list.some(c=>Math.hypot(c.x-P.x,c.y-P.y)<45)){escaped();toast('Fresh paint · the police lost you','good');}else toast('Resprayed','good');}}
  else if(d.neon!==undefined){const i=+d.neon;if(i<0)delete m.neon;else m.neon=i;}
  else if(d.buy){const k=d.buy;if(!garPay(MODP[k]))return;m[k+'Own']=true;if(k==='neon'){m.neon=0;}else m[k]=true;Snd.chime();toast('Fitted','good');}
  else if(d.tog){m[d.tog]=!m[d.tog];}
  saveProfile();applyMods();garDraw();}
garUI().addEventListener('click',garClick);
$('#repMods').addEventListener('click',garOpen);

/* ---------- NOS ---------- */
const NOS={tank:3,on:false,snd:0};
hold($('#btnNos'),()=>{input.nos=1;},()=>{input.nos=0;});
window.addEventListener('keydown',e=>{if(e.key==='n'||e.key==='N')input.nos=1;});window.addEventListener('keyup',e=>{if(e.key==='n'||e.key==='N')input.nos=0;});
/* ---------- hydraulics ---------- */
const HYD={y:0,vy:0,p:0,r:0,beat:0,hold:0,side:1,on:false};
function ownMods(){return !FOOT.on&&!FLY.on&&(!P.skin||P.skin.mod)?modsOf(P.type):null;}
{const _upG=updatePlayer;updatePlayer=function(dt){_upG(dt);const m=ownMods();if(!m){NOS.on=false;HYD.on=false;return;}const V=VEH[P.type];
  /* NOS: strong push beyond the normal top speed while the tank lasts */
  NOS.on=!!(m.nos&&input.nos&&NOS.tank>0&&P.s>1);
  if(NOS.on){NOS.tank=Math.max(0,NOS.tank-dt);const cap=V.top/3.6*1.3;if(P.s<cap)P.s=Math.min(cap,P.s+8*dt);CAM.shake=Math.max(CAM.shake,1.2);
    if((NOS.snd-=dt)<=0){NOS.snd=.18;Snd.burst&&Snd.burst(.25,2600,.8,.1,'bandpass');}}
  else if(!input.nos)NOS.tank=Math.min(3,NOS.tank+dt*.2);
  /* hydraulics: hold HORN while stopped or crawling */
  HYD.hold=input.horn?HYD.hold+dt:0;HYD.on=!!(m.hydro&&HYD.hold>.35&&Math.abs(P.s)<4.5);
  if(HYD.on){if(HYD.hold-dt<=.35)Snd.hornOff();const iv=typeof RADIO!=='undefined'&&RADIO.on>=0&&STATIONS[RADIO.on]&&STATIONS[RADIO.on].bpm?60/STATIONS[RADIO.on].bpm:.45;
    if((HYD.beat-=dt)<=0){HYD.beat=iv;HYD.vy=2.3;HYD.side=-HYD.side;Snd.burst&&Snd.burst(.09,85,1,.5,'lowpass');Hap.tick&&Hap.tick();}}
  if(HYD.y>0||HYD.vy>0){HYD.y+=HYD.vy*dt;HYD.vy-=14*dt;if(HYD.y<=0){HYD.y=0;HYD.vy=0;}}
  const tp=HYD.on?HYD.side*.07+ (HYD.y*.25*HYD.side):0,tr=HYD.on?clamp(P.steer,-1,1)*.11:0;HYD.p+=(tp-HYD.p)*Math.min(1,dt*10);HYD.r+=(tr-HYD.r)*Math.min(1,dt*8);
  if(HYD.y>.001||Math.abs(HYD.p)>.002||Math.abs(HYD.r)>.002){M4.model(TM,0,HYD.y+(HYD.on?.06:0),0,0,HYD.p,HYD.r);M4.mul(TM2,P.M,TM);for(let i=0;i<16;i++)P.M[i]=TM2[i];}};}
setInterval(()=>{const b=$('#btnNos');if(!b)return;const m=state==='play'?ownMods():null;b.hidden=!(m&&m.nos);if(m&&m.nos){b.style.opacity=(.4+.6*NOS.tank/3).toFixed(2);}},250);

/* ---------- neon underglow and NOS flames (drawn in the additive glow pass) ---------- */
const DNE=new GlowBatch(12);
function neonFor(type,x,y,h,len,wid,own){const m=modsOf(type);if(m.neon==null||!m.neonOwn)return;const c=hexRGB(NEONS[m.neon][1]);
  const bpm=typeof RADIO!=='undefined'&&RADIO.on>=0&&STATIONS[RADIO.on]?STATIONS[RADIO.on].bpm:0;const ph=bpm?(GT*bpm/60)%1:0;const pulse=bpm&&own?.6+.6*Math.pow(1-ph,2):.8+.2*Math.sin(GT*6.5);
  DNE.quad(x,.045,y,Math.sin(h),-Math.cos(h),len*.72,wid*1.05,c.map(v=>v*pulse));}
{const _fbG=drawFootBeams;drawFootBeams=function(ex,ez){_fbG(ex,ez);try{DNE.reset();const n=FU.night||0;
  if(!FOOT.on&&!FLY.on&&(!P.skin||P.skin.mod)){const pm=curModel();neonFor(P.type,P.x,P.y,P.h,pm.len||4,pm.wid||1.8,true);
    if(NOS.on){const fx=Math.sin(P.h),fy=-Math.cos(P.h),rx=Math.cos(P.h),ry=Math.sin(P.h),L=(pm.len||4)/2+.25;for(const s of[-.35,.35]){const x=P.x-fx*L+rx*s,y=P.y-fy*L+ry*s;DNE.bill(x,.38,y,.55+Math.random()*.25,[.35,.6,1],CAM.right);DNE.bill(x-fx*.5,.38,y-fy*.5,.4,[1,.55,.15],CAM.right);}}}
  else if(FOOT.on&&FOOT.parked&&(!FOOT.parked.skin||FOOT.parked.skin.mod)){const pk=FOOT.parked,pm=pk.skin?pk.skin.model:playerModel(pk.type);neonFor(pk.type,pk.x,pk.y,pk.h,pm.len||4,pm.wid||1.8,false);}
  if(DNE.n)DNE.draw(0,.35+n*.9);}catch(e){}};}
Object.assign(window.__oosht||{},{modsOf,applyMods,garOpen,garClose,NOS,HYD,modModel,setTod:k=>{settings.tod=k;computeTod();}});
