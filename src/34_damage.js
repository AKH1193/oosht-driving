/* ================= WISE CITY: visible vehicle damage. Every hit dents the side it lands on: creased and popped bonnets,
   hanging bumpers, smashed and flickering headlights, broken tail lights, cracked windscreens, dented doors,
   radiator steam, black smoke and fire. Traffic you hit shows its dents too. A full repair at the mechanic fixes it all ================= */
function dzNew(){return {f:0,r:0,l:0,s:0};}
P.dz=dzNew();
/* which side of a vehicle a blow from direction (ix,iy) lands on (ix,iy points from the vehicle to what hit it) */
function dzSide(h,ix,iy){const fx=Math.sin(h),fy=-Math.cos(h),rx=Math.cos(h),ry=Math.sin(h);const a=ix*fx+iy*fy,b=ix*rx+iy*ry;
  return Math.abs(a)>=Math.abs(b)*.8?(a>0?'f':'r'):(b>0?'s':'l');}
function dzHit(dz,z,rel){const add=rel>15?1.6:rel>9?1:rel>5?.6:rel>2.5?.3:0;dz[z]=Math.min(3,dz[z]+add);}
{const _crD=crash;crash=function(rel,what,ra){
  if(!FOOT.on&&!FLY.on){let z;if(P.hitN){z=dzSide(P.h,-P.hitN[0],-P.hitN[1]);}else z=(P.s<=0)?'f':'r';P.hitN=null;
    const before=P.dz.f;dzHit(P.dz,z,rel);if(z==='f'&&Math.floor(P.dz.f)>Math.floor(before)){try{Snd.burst(.18,3600,.5,.18,'highpass');}catch(e){}}}
  _crD(rel,what,ra);};}
function dmgAgent(a,nx,ny,rel){if(!a.dz)a.dz=dzNew();dzHit(a.dz,dzSide(a.h,nx,ny),rel);}
/* a fresh vehicle or a full repair starts clean */
{const _evD=enterVehicle;enterVehicle=function(c){const pk=FOOT.parked;const r=_evD(c);try{P.dz=(c&&c.k==='own'&&pk&&pk.dz)?pk.dz:(c&&c.a&&c.a.dz)?c.a.dz:dzNew();P.skinCol=c&&c.k==='own'&&pk?pk.skinCol:c&&c.a&&c.a.col&&String(c.a.col)[0]==='#'?c.a.col:null;}catch(e){P.dz=dzNew();}return r;};}
{const _gfD=goFoot;goFoot=function(why,keep){const dz=P.dz,sc=P.skinCol;const r=_gfD(why,keep);try{if(FOOT.parked){FOOT.parked.dz=dz;FOOT.parked.skinCol=sc;}}catch(e){}return r;};}
{const _spD=startPlay;startPlay=function(k){_spD(k);P.dz=dzNew();P.skinCol=null;};}
setInterval(()=>{if(P.cond>=99.5&&(P.dz.f||P.dz.r||P.dz.l||P.dz.s))P.dz=dzNew();},500);

/* ---------- lights: flicker as the front takes hits, die when smashed ---------- */
function hlK(dz,i,model){if(!dz)return 1;const f=dz.f,two=model&&model.lights&&model.lights.head.length===1;
  if(two?f>=2.6:(f>=3||(f>=2&&i===1)))return 0;
  if(f>=.6||(two&&P.cond<45)){const t=GT*(9+i*3.7)+i*11;const n=Math.sin(t*3.1)*Math.sin(t*1.7+2)+Math.sin(t*7.3);
    const cut=f>=1.5?.35:.75;if(n>cut)return .08;return .85+.15*Math.sin(t*23);}
  return 1;}
function tlK(dz,i){if(!dz)return 1;const r=dz.r;if(r>=3||(r>=2&&i===0))return 0;if(r>=1){const n=Math.sin(GT*13+i*5)*Math.sin(GT*4.1+i);if(n>.6)return .1;}return 1;}

/* ---------- the dented panels, built once per look and level ---------- */
const DMGM=new Map();
function dmgMesh(type,colHex,dz){const d=CARDIM[type];if(!d)return null;
  const q=k=>Math.min(3,Math.floor(dz[k]+.0001));const lv={f:q('f'),r:q('r'),l:q('l'),s:q('s')};if(!lv.f&&!lv.r&&!lv.l&&!lv.s)return null;
  const key=type+'|'+colHex+'|'+lv.f+lv.r+lv.l+lv.s;let m=DMGM.get(key);if(m)return m;
  const mb=new MB();const L=d.L,W=d.W,H=d.H,b=d.belt;const col=hexRGB(colHex||'#888'),dk=col.map(v=>v*.5),mid=col.map(v=>v*.72);
  const scr=[.78,.78,.8],blk=[.05,.05,.06],shard=[.82,.86,.9],rust=[.22,.2,.19];
  const fz=-L/2,rz=L/2,bon=d.cf-fz;
  /* FRONT */
  if(lv.f>=1){for(const k of[.28,.52]){mb.save().tr(0,b+.006,fz+bon*k).rotY(.12*(k>.4?1:-1));mb.box(0,0,0,W*.62,.012,.05,dk);mb.restore();}
    for(const x of[-.3,.1,.35])mb.box(x*W,.4,fz-.045,.22,.025,.012,scr);mb.box(W*.18,.5,fz-.04,.3,.02,.012,scr);}
  if(lv.f>=2){const a=lv.f>=3?.42:.2;mb.save().tr(0,b+.03,d.cf-.05).rotX(a);mb.box(0,0,-(bon-.12)/2,W-.16,.035,bon-.12,mid);
      mb.box(0,-.02,-(bon-.12),W-.2,.04,.06,dk);mb.restore();/* bonnet popped up from the latch */
    mb.save().tr(W/2-.05,.4,fz-.06).rotZ(.32);mb.box(-W*.32,0,0,W*.64,.18,.07,dk);mb.restore();/* bumper hanging off one side */
    mb.box(W/2-.24,.72,fz-.022,.36,.15,.02,blk);for(const k of[-1,1])mb.box(W/2-.24+k*.07,.72+k*.03,fz-.034,.1,.012,.008,shard);/* smashed right headlight */
    /* cracks spreading across the windscreen */
    const g=(t,x)=>[x,b+(H-b)*t,d.cf+(d.rf-d.cf)*t];const cr=(p0,p1)=>{const dx=p1[0]-p0[0],dy=p1[1]-p0[1],dz2=p1[2]-p0[2];const l=Math.hypot(dx,dy,dz2);mb.save().tr((p0[0]+p1[0])/2,(p0[1]+p1[1])/2+.012,(p0[2]+p1[2])/2);mb.rotY(Math.atan2(dx,dz2));mb.rotX(-Math.atan2(dy,Math.hypot(dx,dz2)));mb.box(0,0,0,.012,.012,l,shard);mb.restore();};
    const o=g(.38,.18);for(const[t,x]of[[.85,.5],[.9,-.05],[.1,.55],[.05,-.2],[.6,-.45],[.3,.62]])cr(o,g(t,x*(W-.3)/2));}
  if(lv.f>=3){mb.box(-(W/2-.24),.72,fz-.022,.36,.15,.02,blk);mb.box(0,.62,fz-.02,W*.42,.18,.02,blk);
    for(const x of[-.25,0,.25])mb.box(x,.6,fz-.03,.05,.16,.02,rust);}
  /* REAR */
  if(lv.r>=1){for(const x of[-.3,.05,.32])mb.box(x*W,.42,rz+.045,.22,.025,.012,scr);}
  if(lv.r>=2){mb.save().tr(-(W/2-.05),.4,rz+.06).rotZ(.3);mb.box(W*.32,0,0,W*.64,.18,.07,dk);mb.restore();
    mb.box(-(W/2-.18),.76,rz+.022,.32,.14,.02,blk);
    if(d.trunk){const tl=rz-d.cb-.1;mb.save().tr(0,b+.04,d.cb+.05).rotX(.22);mb.box(0,0,tl/2,W-.16,.035,tl,mid);mb.restore();}}
  if(lv.r>=3){mb.box(W/2-.18,.76,rz+.022,.32,.14,.02,blk);mb.box(0,.55,rz+.03,W*.5,.2,.02,rust);}
  /* SIDES: dents with scraped paint, then shattered side glass */
  for(const[k,sx]of[['l',-1],['s',1]]){const n=lv[k];if(!n)continue;const x=sx*(W/2+.006);
    mb.box(x,.6,-.25,.012,.26,1.05,mid);for(const z of[-.5,-.15,.2])mb.box(x+sx*.003,.55+z*.12,z,.008,.018,.5,scr);
    if(n>=2){mb.box(x,.55,.75,.012,.3,.7,dk);mb.box(sx*(W/2-.1),b+(H-b)*.45,(d.cf+d.cb)/2,.012,(H-b)*.6,.9,shard);}
    if(n>=3){mb.box(x+sx*.002,.38,0,.012,.1,L*.7,rust);mb.box(sx*(W/2+.07),b+.14,d.cf+.18,.1,.08,.05,blk);}}
  m=mb.mesh();if(DMGM.size>60){for(const v of DMGM.values())freeMesh(v);DMGM.clear();}DMGM.set(key,m);return m;}
function bodyCol(type,skin,sc){if(skin&&!skin.mod&&sc)return sc;if(skin&&skin.mod){const pm=profile.mods&&profile.mods[type];if(pm&&pm.paint)return pm.paint;}return VEH[type]&&VEH[type].col||'#888';}

/* ---------- smoke and fire from a beaten engine ---------- */
const SMK=[];let SMKT=0;let PUFF=null;
function puffMesh(){if(PUFF)return PUFF;const mb=new MB();mb.ell(0,0,0,.5,.42,.5,[1,1,1],8,6);mb.ell(.28,.1,.1,.32,.28,.32,[1,1,1],7,5);mb.ell(-.22,.06,-.12,.3,.26,.3,[1,1,1],7,5);PUFF=mb.mesh();return PUFF;}
function smokeFrom(x,y,z,dark,dt){SMK.push({x,y,z,t:0,life:1.6+Math.random()*.8,dark,vx:(Math.random()-.5)*.5,vz:(Math.random()-.5)*.5,s:.14+Math.random()*.1});}
function smokeTick(dt){for(let i=SMK.length-1;i>=0;i--){const p=SMK[i];p.t+=dt;p.y+=dt*(1.1+p.t*.4);p.x+=p.vx*dt;p.z+=p.vz*dt;if(p.t>p.life)SMK.splice(i,1);}while(SMK.length>40)SMK.shift();
  if(state!=='play'||FOOT.on||FLY.on)return;const c=P.cond;if(c>=55)return;const V=VEH[P.type];if(!V)return;
  SMKT-=dt;if(SMKT>0)return;SMKT=c<20?.09:c<35?.16:.3;
  const pm=curModel();const nose=V.cat==='two'?.2:-(pm.len||4)/2+.6;const w=M4.xform(P.M,0,(V.cat==='two'?.7:(CARDIM[P.type]?CARDIM[P.type].belt:1))+.1,nose);
  smokeFrom(w[0],w[1],w[2],c<30,dt);}
{const _lgD=lifeUpdate;lifeUpdate=function(dt){_lgD(dt);try{smokeTick(dt);}catch(e){}};}

/* ---------- drawing ---------- */
RLAYERS.push((A,n,ex,ez)=>{
  /* dents on Tony's vehicle and on traffic he has hit */
  if(!FOOT.on&&!FLY.on&&CAM.mode!=='cockpit'&&CARDIM[P.type]){const m=dmgMesh(P.type,bodyCol(P.type,P.skin,P.skinCol),P.dz);if(m)drawLit(m,P.M,{emiK:.3});}
  if(FOOT.on&&FOOT.parked&&FOOT.parked.dz&&CARDIM[FOOT.parked.type]){const pk=FOOT.parked;const m=dmgMesh(pk.type,bodyCol(pk.type,pk.skin,pk.skinCol),pk.dz);if(m){M4.model(TM,pk.x,0,pk.y,-pk.h,0,0);drawLit(m,TM,{emiK:.3});}}
  for(const a of agents){if(!a.dz||!CARDIM[a.t.k])continue;if(Math.hypot(a.x-ex,a.y-ez)>120)continue;const m=dmgMesh(a.t.k,a.col&&a.col[0]==='#'?a.col:'#9A9A9A',a.dz);if(m){M4.model(TM,a.x,0,a.y,-a.h,0,-(a.lean||0));drawLit(m,TM,{emiK:.3});}}
  /* smoke puffs: white steam first, black smoke when the engine is nearly gone */
  if(SMK.length){const pm=puffMesh();for(const p of SMK){const k=p.t/p.life,sc=p.s+k*.85;const g=p.dark?.16+k*.2:.82-k*.15;
    M4.model(TM,p.x,p.y,p.z,p.t*.7,0,0,sc);drawLit(pm,TM,{tint:[g,g,g*1.02],emiK:p.dark?0:.25,noHL:true});}}});
{const _fbD=drawFootBeams;drawFootBeams=function(ex,ez){_fbD(ex,ez);
  try{if(!FOOT.on&&!FLY.on&&P.cond<16){const V=VEH[P.type];const pm=curModel();const nose=V.cat==='two'?.2:-(pm.len||4)/2+.55;for(let k=0;k<3;k++){const w=M4.xform(P.M,(k-1)*.3,(CARDIM[P.type]?CARDIM[P.type].belt:.8)+.15+Math.random()*.2,nose);
      DGr.bill(w[0],w[1],w[2],.35+Math.random()*.35,[1,.45+Math.random()*.2,.08],CAM.right);}}}catch(e){}};}
Object.assign(window.__oosht||{},{dmgMesh,hlK,dzNew,SMK,dmgAgent:(a,b,c,d)=>dmgAgent(a,b,c,d),crash:(a,b,c)=>crash(a,b,c)});
