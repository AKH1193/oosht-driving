/* ================= WISE CITY: walking up into metro stations, crash falls, blood ================= */

/* ---------- metro stations you can walk into ---------- */
function stLocal(st,x,y){const dx=x-st.x,dy=y-st.y,c=Math.cos(st.h),s=Math.sin(st.h);return [dx*c+dy*s,-dx*s+dy*c];}
function stHeight(u,v,cur){const au=Math.abs(u);
  if(au>=11.9&&au<=14.8&&v>=-7&&v<=8.4)return clamp((v+6.4)*.86,0,12.05);      /* staircase, then the landing */
  if(au<11.9&&Math.abs(v)<31.5&&cur>6)return 12.05;                               /* platform level */
  return 0;}
function metroWalk(ox,oy,sx,sy,dt){
  if(!METRO.stations||!METRO.stations.length){P.elev=0;return false;}
  let st=null,bd=46;for(const s of METRO.stations){const d=Math.hypot(s.x-ox,s.y-oy);if(d<bd){bd=d;st=s;}}
  const cur=P.elev||0;if(!st){if(cur>0)P.elev=0;return false;}
  const[u0,v0]=stLocal(st,ox,oy);const h0=stHeight(u0,v0,cur);
  if(cur<.3&&h0<.3){/* still at street level: only take over once a foot is on the stairs */
    const[u1,v1]=stLocal(st,ox+sx,oy+sy);const h1=stHeight(u1,v1,cur);if(h1<.3)return false;if(h1>1.3){P.s*=.5;return true;}}
  const nx=ox+sx,ny=oy+sy;const[u,v]=stLocal(st,nx,ny);const h=stHeight(u,v,cur);
  if(Math.abs(h-cur)>1.3){P.s*=.5;return true;}                                   /* edge of the stairs, the glass wall, the end of the platform */
  P.x=nx;P.y=ny;P.elev=cur+(h-cur)*Math.min(1,dt*14);if(P.elev<.05&&h===0)P.elev=0;
  P.metroSt=P.elev>6?st:null;return true;}
/* street-level pillars under each station */
{const _bm=buildMetro;buildMetro=function(data){_bm(data);for(const st of METRO.stations){const c=Math.cos(st.h),s=Math.sin(st.h);
  for(const z of[-24,-8,8,24])for(const u of[-7,7]){const x=st.x+u*c-z*s,y=st.y+u*s+z*c;const o={x,y,r:.75,pier:true,_q:0};METRO.piers.push(o);gAdd(W.tG,Math.floor(x/CELL),Math.floor(y/CELL),o);}}};}
/* on the platform you can take the train */
{const _fc=findContext;findContext=function(){if(FOOT.on&&!FOOT.ride&&P.elev>6&&P.metroSt)return {k:'metro',st:P.metroSt,label:'Take the metro'};return _fc();};
 const _cu=cityUse;cityUse=function(c){if(c.k==='metro'&&P.elev>6){P.elev=0;const e=c.st.e[0];P.x=e[0];P.y=e[1];}_cu(c);};}

/* ---------- blood ---------- */
const BLOOD=[];const DBL=new GlowBatch(160);
function bleed(x,y,size){BLOOD.push({x,y,r:size||.7,h:Math.random()*TAU,t:0});while(BLOOD.length>140)BLOOD.shift();}
function bloodBurst(x,y,z){for(let k=0;k<5;k++)LIFE.fx.push({k:'spark',p:[x+(Math.random()-.5)*.3,z+(Math.random()-.5)*.3,y+(Math.random()-.5)*.3],t:.18,c:[.75,.02,.02]});}
function drawBlood(){if(!BLOOD.length)return;DBL.reset();const ex=CAM.eye[0],ez=CAM.eye[2];for(const b of BLOOD){if(Math.abs(b.x-ex)>140||Math.abs(b.y-ez)>140)continue;const g=Math.min(1,b.t/2.5);DBL.quad(b.x,.035,b.y,Math.sin(b.h),-Math.cos(b.h),b.r*(.5+.5*g),b.r*(.4+.4*g),[.36,.02,.02]);}DBL.draw(1,.82);}
{const _ds=drawSkids;drawSkids=function(){_ds();drawBlood();};}

/* ---------- falling over: people drop instead of snapping flat ---------- */
{const _pr=pedRig;pedRig=function(p){
  if(p.state==='down'){if(p.dA==null){p.dA=GT;if(p.dead||p.ko)bleed(p.x,p.y,p.dead?1:.55);}
    const k=Math.min(1,(GT-p.dA)/.45),e=1-(1-k)*(1-k);const look=pedLook(p),sk=SKINS[(p.v||0)%SKINS.length];
    M4.model(TM,p.x,.15*e,p.y,-p.fall,-Math.PI/2*e,0,p.sc||1);drawLit(rig(look,sk,k<1?'jump':'pose'),TM,PEDLIT);return;}
  p.dA=null;_pr(p);};}
/* shots and heavy blows draw blood */
{const _hp=hurtPed;hurtPed=function(p,dmg,nx,ny,how){_hp(p,dmg,nx,ny,how);bloodBurst(p.x,p.y,1.2);if(how==='gun'||dmg>=30)bleed(p.x+nx*.4,p.y+ny*.4,.45);};
 const _hc=hurtCop;hurtCop=function(c,dmg,nx,ny){_hc(c,dmg,nx,ny);bloodBurst(c.x,c.y,1.2);};
 const _hit=hitPed;hitPed=function(p){_hit(p);bloodBurst(p.x,p.y,.9);bleed(p.x,p.y,.9);};}

/* ---------- you get knocked down, and thrown off a bike in a hard crash ---------- */
{const _lf=lfDamage;lfDamage=function(d,why){const before=LIFE.hp;_lf(d,why);if(LIFE.dead)return;const lost=before-LIFE.hp;
  if(lost>4&&FOOT.on){bloodBurst(P.x,P.y,1.2);if(lost>10)bleed(P.x,P.y,.5);}
  if(FOOT.on&&!FOOT.ride&&(lost>=14||why==='crash'||why==='hit'||why==='boom')&&!(LIFE.downT>0)){LIFE.downT=1.9;LIFE.fallH=P.h;P.s=0;Snd.thud(.6);Hap.crash();}};}
{const _cr=crash;crash=function(rel,what,ra){_cr(rel,what,ra);const V=VEH[P.type];
  if(rel>9&&(V.cat==='two'||P.type==='auto'&&rel>13)&&!FOOT.on&&!FLY.on){/* thrown off */
    const pk={type:P.type,skin:P.skin,x:P.x,y:P.y,h:P.h,cond:P.cond,fuel:P.fuel};const h=P.h;goFoot(null,true);FOOT.parked=pk;
    const fx=Math.sin(h),fy=-Math.cos(h);let tx=P.x-fx*1.2,ty=P.y-fy*1.2;for(let k=2;k<5;k++){const x=pk.x+fx*k*.6,y=pk.y+fy*k*.6;if(!inBuilding(x,y)){tx=x;ty=y;}}
    P.x=tx;P.y=ty;P.h=h;M4.model(P.M,P.x,0,P.y,-P.h,0,0);CAM.shake=Math.max(CAM.shake,10);lfDamage(6,'crash');LIFE.downT=2.6;bleed(P.x,P.y,.7);toast('Thrown off the bike!','bad','thrown',3000);}
  else if(rel>12&&!FOOT.on){$('#hitfx').style.opacity=.7;}};}
{const _uf=updateFoot;updateFoot=function(dt){if(LIFE.downT>0){LIFE.downT-=dt;P.s=0;P.vx=P.vy=0;return;}_uf(dt);};
 const _dpr=drawPlayerRig;drawPlayerRig=function(M,pose,wk){
  if(LIFE.downT>0&&FOOT.on&&!FOOT.ride){const k=Math.min(1,(2.6-LIFE.downT)/.4),g=LIFE.downT<.5?LIFE.downT/.5:1,a=Math.min(k,g);
    M4.model(TM2,P.x,.15*a+(P.elev||0),P.y,-(LIFE.fallH??P.h),-Math.PI/2*a,0);_dpr(TM2,a<1?'jump':'pose',null);return;}
  _dpr(M,pose,wk);};}
{const _lu=lifeUpdate;lifeUpdate=function(dt){_lu(dt);for(const b of BLOOD)b.t+=dt;};}
Object.assign(window.__oosht||{},{BLOOD,metroWalk,bleed});
