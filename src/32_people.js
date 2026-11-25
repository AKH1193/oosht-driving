/* ================= WISE CITY: people 2.0. Proper faces (eyes with whites and irises, brows, nose, lips, ears, cheeks), hair styles,
   facial hair, spectacles, bindis and earrings, slim, average and heavy builds, different heights, collars, sleeves, belts, shoes,
   bags and watches; a smooth 8-frame walk and run cycle with head bob; scared faces; Tony's signature look and a wardrobe ================= */
/* more skin tones (index stays stable for existing looks) */
SKINS.push([.5,.34,.23],[.72,.55,.42],[.33,.22,.15]);
/* extra looks: salwar kameez, lungi, jackets, hoodies, t-shirts, a security guard, a delivery rider look, a nurse */
PED_LOOKS.push(
  {kind:'walk',kurta:'#2BB3A3',pants:'#F6F1E7',salwar:true,dupatta:'#F6F1E7',w:3},{kind:'office',kurta:'#C2185B',pants:'#2E2E38',salwar:true,dupatta:'#F8BBD0',w:2},
  {kind:'walk',kurta:'#FFB300',pants:'#5D4037',salwar:true,dupatta:'#5D4037',w:2},{kind:'walk',shirt:'#ECEFF1',pants:'#4E6E58',lungi:true,w:2},
  {kind:'walk',shirt:'#37474F',pants:'#263238',jacket:'#90A4AE',w:2},{kind:'walk',shirt:'#B71C1C',pants:'#1C1C1C',hoodie:true,w:2},
  {kind:'walk',shirt:'#FFFFFF',pants:'#3F51B5',tee:true,w:3},{kind:'walk',shirt:'#00897B',pants:'#212121',tee:true,w:2},
  {kind:'office',shirt:'#1E3A5F',pants:'#1E3A5F',guard:true,cap:'#1E3A5F',w:1},{kind:'office',shirt:'#F5F5F5',pants:'#90A4AE',nurse:true,w:1},
  {kind:'kid',kurta:'#8E24AA',pants:'#8E24AA',frock:true,scale:.6,w:0},{kind:'kid',shirt:'#29B6F6',pants:'#37474F',shorts:true,scale:.6,w:0});
/* give every look a body, a hairstyle and small personal details, fixed per look so the same person always looks the same */
PED_LOOKS.forEach((l,i)=>{const fem=!!(l.saree||l.frock||l.salwar||l.nurse||(l.kurta&&l.kind==='office'&&!l.salwar));l.female=fem;const kid=l.kind==='kid'||l.frock;
  const h=(i*7919+13)%97;
  l.build=kid?'kid':l.kind==='run'?'slim':h%5===0?'heavy':h%3===0?'slim':'avg';
  l.ht=kid?1:l.kind==='elder'?.95:.94+(h%7)*.02;
  if(fem){l.hair=l.saree?['bun','plait','bun','open'][h%4]:l.frock?'pigtails':['open','plait','ponytail','bun'][h%4];l.mous=false;l.beard=false;l.longHair=true;
    l.bindi=!!(l.saree||l.salwar||h%2);l.earrings=h%3!==0;l.bangles=!!(l.saree||l.salwar);}
  else if(kid){l.hair=['crop','side','spiky'][h%3];l.mous=false;l.beard=false;}
  else{l.hair=l.grey?(h%2?'bald':'crop'):['crop','side','spiky','side','crop','wavy'][h%6];l.mous=l.grey?true:h%3!==1;l.beard=h%5===2;l.stubble=!l.beard&&h%4===1;}
  l.specs=!kid&&(l.kind==='elder'?h%2===0:h%6===0);l.watch=!fem&&!kid&&h%2===0;l.belt=!fem&&!kid&&!l.dhoti&&!l.lungi&&!l.brief;
});
/* Tony: his own face, hair and clothes; the wardrobe at a safehouse changes the clothes and saves them */
Object.assign(PLOOK,{hair:'side',stubble:true,mous:false,beard:false,build:'avg',ht:1.03,watch:true,belt:true,tony:true});
const WARD={shirts:[['#2F6FB2','Blue'],['#F2F2EE','White'],['#1C1C1E','Black'],['#B3121F','Red'],['#2E7D32','Green'],['#F9A825','Yellow'],['#7B1FA2','Purple'],['#E64A19','Orange'],['#546E7A','Grey'],['#E91E63','Pink']],
  pants:[['#2B2F3A','Dark'],['#1F4E8C','Denim'],['#C8B99A','Khaki'],['#ECEFF1','White'],['#5D4037','Brown'],['#1B5E20','Olive']],
  shoes:[['#15110F','Black'],['#F4F4F2','White'],['#8D6E63','Tan'],['#B71C1C','Red']],
  hair:[['side','Side part'],['crop','Cropped'],['spiky','Spiky'],['wavy','Wavy'],['bald','Shaved']],
  face:[['stubble','Stubble'],['clean','Clean shaven'],['mous','Moustache'],['beard','Beard']],
  eyes:[['none','No glasses'],['shades','Sunglasses'],['specs','Spectacles']],
  top:[['tee','T-shirt'],['shirt','Shirt'],['jacket','Jacket'],['hoodie','Hoodie']],
  hat:[['none','No cap'],['cap','Cap']]};
function wardApply(){const w=profile.wear||(profile.wear={});PLOOK.shoeCol=w.shoes||'#15110F';PLOOK.hair=w.hair||'side';
  PLOOK.stubble=(w.face||'stubble')==='stubble';PLOOK.mous=w.face==='mous';PLOOK.beard=w.face==='beard';PLOOK.shades=w.eyes==='shades';PLOOK.specs=w.eyes==='specs';
  PLOOK.tee=(w.top||'tee')==='tee';PLOOK.jacket=w.top==='jacket'?'#263238':null;PLOOK.hoodie=w.top==='hoodie';PLOOK.cap=w.hat==='cap'?'#1C1C1E':null;}
wardApply();
function wardSig(l){return [l.shirt,l.pants,l.shoeCol,l.hair,l.stubble?1:0,l.mous?1:0,l.beard?1:0,l.shades?1:0,l.specs?1:0,l.tee?1:0,l.jacket||'',l.hoodie?1:0,l.cap||''].join(',');}
rig=function(look,sk,pn,wk,far){
  if(look._id==null&&look!==PLOOK)look._id=LOOKN++;const id=look===PLOOK?'P'+wardSig(look):look._id;
  const key=(far?'F':'')+id+'|'+(SKINS.indexOf(sk))+'|'+pn+'|'+(wk||'');let m=HRIGS.get(key);if(m)return m;
  if(HRIGS.size>700){for(const v of HRIGS.values())freeMesh(v);HRIGS.clear();}
  HG_FAR=!!far;try{m=humanRig(look,sk,pn,wk);}finally{HG_FAR=false;}HRIGS.set(key,m);return m;};

/* smooth-shaded ellipsoids and tapered tubes, so bodies and heads look round instead of faceted */
MB.prototype.ell=function(cx,cy,cz,rx,ry,rz,col,U,V){const big=Math.max(rx,ry,rz);if(!U){if(big<.03)return this.blob(cx,cy,cz,rx,ry,rz,col);U=big>.09?10:big>.05?8:6;V=big>.09?7:big>.05?5:4;}
  const pts=[];for(let j=0;j<=V;j++){const ph=j/V*Math.PI,sy=Math.cos(ph),sr=Math.sin(ph);const row=[];for(let i=0;i<=U;i++){const th=i/U*TAU,ux=Math.cos(th)*sr,uz=Math.sin(th)*sr;
    const q=this.P([cx+ux*rx,cy+sy*ry,cz+uz*rz]);const n=this.D([ux/rx,sy/ry,uz/rz]);const l=Math.hypot(n[0],n[1],n[2])||1;row.push([q,[n[0]/l,n[1]/l,n[2]/l]]);}pts.push(row);}
  for(let j=0;j<V;j++)for(let i=0;i<U;i++){const a=pts[j][i],b=pts[j][i+1],c=pts[j+1][i+1],d=pts[j+1][i];if(j>0)this.stri(a,b,c,col);if(j<V-1)this.stri(a,c,d,col);}return this;};
MB.prototype.stri=function(a,b,c,col){const A=a[0],B=b[0],C=c[0];const ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;if(nx*(a[1][0]+b[1][0]+c[1][0])+ny*(a[1][1]+b[1][1]+c[1][1])+nz*(a[1][2]+b[1][2]+c[1][2])<0){const t=b;b=c;c=t;}
  const d=this.d;for(const v of[a,b,c])d.push(v[0][0],v[0][1],v[0][2],v[1][0],v[1][1],v[1][2],col[0],col[1],col[2],0,0,0);};
/* tube along y: radius r at the top, r2 (default r*.86) at the bottom */
MB.prototype.tb=function(cx,cy,cz,r,len,col,r2){r2=r2==null?r*.86:r2;const U=8,h=len/2;const ring=(y,rr)=>{const o=[];for(let i=0;i<=U;i++){const th=i/U*TAU,ux=Math.cos(th),uz=Math.sin(th);const n=this.D([ux,0,uz]);const l=Math.hypot(n[0],n[1],n[2])||1;o.push([this.P([cx+ux*rr,y,cz+uz*rr]),[n[0]/l,n[1]/l,n[2]/l]]);}return o;};
  const t=ring(cy+h,r),b=ring(cy-h,r2);for(let i=0;i<U;i++){this.stri(t[i],t[i+1],b[i+1],col);this.stri(t[i],b[i+1],b[i],col);}return this;};
/* ---------- the figure ---------- */
const HAIRC={black:[.07,.06,.06],brown:[.2,.12,.07],grey:[.78,.78,.76],white:[.9,.9,.88]};
const HG_OLD=humanGeo;let HG_FAR=false;
humanGeo=function(mb,look,sk,o){if(HG_FAR)return HG_OLD(mb,look,sk,o);
  o=o||{};const fem=!!look.female,kid=look.build==='kid'||look.kind==='kid'||look.frock;
  const hair=look.grey?HAIRC.grey:(look._id!=null&&look._id%4===1?HAIRC.brown:HAIRC.black);
  const top=hexRGB(look.shirt||look.kurta||look.blouse||'#888');const pc=hexRGB(look.pants||look.saree||'#333');
  const shoe=look.shoeCol?hexRGB(look.shoeCol):look.kind==='run'?[.92,.92,.94]:look.brief?sk:look.female&&!kid?[.35,.18,.12]:[.12,.1,.09];
  const skD=sk.map(v=>v*.84),skL=sk.map(v=>Math.min(1,v*1.08));const stub=look.stubble?sk.map(v=>v*.8):null;
  const full=look.kind==='office'||look.kurta||look.saree||look.kind==='elder'||look.jacket||look.hoodie||look.guard||look.nurse;
  const bw=look.build==='heavy'?1.2:look.build==='slim'?.9:1,bh=look.build==='heavy'?1.08:1;const fear=!!o.fear;
  mb.save();const s=(look.ht||1)*(kid?1:1);mb._rot([s,0,0,0,s,0,0,0,s]);
  const bob=o.bob||0;
  const leg=q=>{const a=q<0?(o.lL||0):(o.lR||0),k=q<0?(o.kL||0):(o.kR||0);
    mb.save().tr(q*.1*bw,.9,0).rotX(a);const th=look.brief?sk:pc,sh=look.shorts||look.brief?sk:pc;
    mb.tb(0,-.22,0,.08*bw,.44,th);mb.ell(0,-.44,0,.068*bw,.07,.074,sh);
    mb.save().tr(0,-.44,0).rotX(-k);mb.tb(0,-.21,0,.06*bw,.42,sh);
    /* ankle, shoe with a sole, trouser cuff */
    if(!look.shorts&&!look.brief)mb.tb(0,-.4,0,.065*bw,.05,pc);
    mb.ell(0,-.44,-.045,.058,.042,.135,shoe);mb.box(0,-.465,-.05,.1,.016,.26,shoe.map(v=>v*.6));mb.restore();mb.restore();};
  if(look.saree){const sw=(o.lR||0);mb.tbox(0,.04,0,.46*bw,.36,.34*bw,.26,.9,pc);for(const q of[-1,1])mb.ell(q*.08,.04,q*sw*.14-.04,.055,.04,.12,[.3,.16,.1]);}
  else if(look.frock){leg(-1);leg(1);mb.tbox(0,.5,0,.5,.38,.3,.22,.45,top);}
  else{leg(-1);leg(1);if(look.dhoti||look.lungi)mb.tbox(0,.18,0,.44*bw,.32,.36*bw,.26,.74,pc);
    if(look.lungi)mb.box(0,.5,-.17,.05,.6,.01,pc.map(v=>v*.7));}
  mb.save().tr(0,.9+bob,0).rotX(-(o.bend||0));
  /* hips, torso, chest, shoulders */
  mb.ell(0,.03,0,.17*bw,.1,.115*bw,pc);
  if(look.belt&&!look.kurta)mb.box(0,.06,0,.33*bw,.035,.22*bw,[.18,.12,.08]);
  const tc=look.brief&&!look.vest?sk:top;
  mb.tbox(0,.02,0,.31*bw,.2*bw,.34*bw,.21*bw,.3,tc);
  mb.ell(0,.35,0,.19*bw,.16*bh,.125*bw,tc);if(fem&&!kid)mb.ell(0,.33,-.07,.13,.06,.05,tc);
  if(look.build==='heavy'&&!fem)mb.ell(0,.12,-.03,.17,.12,.13,tc);
  mb.ell(0,.45,0,.21*bw,.065,.105*bw,look.vest?sk:tc);
  if(look.vest)mb.ell(0,.4,-.02,.12,.06,.1,sk);
  /* collars, placket, pockets, jacket and hoodie */
  if(!look.tee&&!look.kurta&&!look.saree&&!look.brief&&!look.hoodie){mb.box(0,.47,-.1,.16,.05,.03,top.map(v=>v*.85));mb.box(0,.3,-.124,.012,.3,.008,top.map(v=>v*.75));}
  if(look.jacket){const jc=hexRGB(look.jacket);mb.tbox(0,.0,0,.34*bw,.23*bw,.37*bw,.24*bw,.3,jc,0,0,0,true);mb.ell(0,.35,.0,.2*bw,.14,.135*bw,jc);mb.box(0,.3,-.13,.07,.42,.006,top);}
  if(look.hoodie){mb.ell(0,.5,.07,.16,.08,.1,top.map(v=>v*.8));mb.box(0,.1,-.125,.2,.1,.008,top.map(v=>v*.8));}
  if(look.kurta&&!look.frock)mb.tbox(0,-.24,0,.36*bw,.25,.33*bw,.22,.3,top);
  if(look.salwar&&look.dupatta){const dc=hexRGB(look.dupatta);mb.save().tr(-.03,.26,-.12).rotZ(.55);mb.box(0,0,0,.12,.5,.012,dc);mb.restore();mb.save().tr(.03,.26,.12).rotZ(-.55);mb.box(0,0,0,.12,.5,.012,dc);mb.restore();}
  if(look.saree){mb.save().tr(.02,.24,-.118).rotZ(-.5);mb.box(0,0,0,.14,.52,.015,pc);mb.restore();}
  if(look.kind==='office'&&!fem&&!look.guard)mb.box(0,.29,-.128,.035,.28,.01,[.45,.08,.12]);
  if(look.guard){mb.box(0,.4,-.126,.14,.03,.006,[.9,.75,.2]);for(const q of[-1,1])mb.box(q*.17,.47,0,.1,.02,.08,[.9,.75,.2]);}
  if(look.nurse)mb.box(0,.36,-.126,.05,.05,.006,[.85,.1,.1]);
  /* arms: upper arm, elbow, forearm, hand with a thumb */
  for(const q of[-1,1]){const a=q<0?(o.aL||0):(o.aR||0),e=q<0?(o.eL??.22):(o.eR??.22);
    mb.save().tr(q*.235*bw,.44,0).rotX(a);mb.ell(0,-.005,0,.062,.066,.066,look.vest?sk:tc);
    const sl=full&&!look.vest;mb.tb(0,-.14,0,.05,.28,sl?top:sk);if(!sl&&!look.vest)mb.tb(0,-.06,0,.058,.12,top);
    if(look.jacket)mb.tb(0,-.14,0,.056,.28,hexRGB(look.jacket));
    mb.save().tr(0,-.28,0).rotX(e);mb.ell(0,0,0,.045,.045,.045,sl?top:sk);mb.tb(0,-.13,0,.043,.26,sl?top:sk);
    if(sl)mb.tb(0,-.25,0,.046,.03,top.map(v=>v*.85));
    if(look.watch&&q<0){mb.tb(0,-.245,0,.047,.025,[.12,.12,.13]);mb.box(0,-.245,-.047,.03,.03,.01,[.85,.85,.9]);}
    if(look.bangles&&q>0)for(let b=0;b<3;b++)mb.tb(0,-.23-b*.015,0,.047,.008,b%2?[.9,.75,.2]:[.8,.1,.15]);
    mb.ell(0,-.29,0,.042,.06,.03,sk);mb.ell(q*.03,-.27,-.02,.014,.028,.016,sk);
    if(q>0&&o.wk){mb.save().tr(0,.27,0);weaponGeo(mb,o.wk);mb.restore();}
    if(q<0&&o.plate){mb.cyl(0,-.3,-.12,.13,.02,'y',14,[.85,.86,.88]);mb.ell(0,-.27,-.12,.08,.03,.08,o.plate);}
    mb.restore();mb.restore();}
  /* neck and head */
  mb.save();if(o.hd)mb.rotY(o.hd);
  const hs=kid?1.14:1;mb.save().tr(0,.5,0);mb._rot([hs,0,0,0,hs,0,0,0,hs]);mb.tr(0,-.5,0);
  mb.tb(0,.53,0,.056,.12,sk);
  mb.ell(0,.7,0,.104,.126,.114,sk,14,10);mb.ell(0,.64,-.02,.082,.062,.08,look.beard?hair:stub||sk);
  if(look.beard)mb.ell(0,.625,-.035,.088,.065,.085,hair);
  for(const q of[-1,1]){mb.ell(q*.105,.695,.005,.018,.034,.024,skD);
    /* cheekbone, eye socket shade, eye white, iris, pupil highlight, brow */
    
    const ew=fear?.028:.023,eh=fear?.02:.013;
    mb.ell(q*.04,.712,-.1,ew,eh,.008,[.96,.95,.93]);mb.ell(q*.041,.712,-.106,fear?.009:.012,fear?.009:.012,.005,[.1,.07,.05]);mb.ell(q*.038,.716,-.109,.004,.004,.002,[1,1,1]);
    mb.box(q*.042,fear?.748:.74,-.102,.046,.009,.008,look.grey?[.6,.6,.6]:hair);
    if(fem&&!kid)mb.box(q*.042,.7,-.103,.046,.004,.006,[.1,.07,.05]);}
  /* nose, lips, cheeks */
  mb.ell(0,.69,-.108,.013,.028,.018,skD);mb.ell(0,.676,-.113,.019,.012,.014,sk);
  if(fear){mb.ell(0,.652,-.104,.02,.022,.01,[.2,.06,.06]);mb.ell(0,.662,-.107,.022,.006,.008,fem?[.6,.16,.2]:[.36,.2,.18]);}
  else{mb.box(0,.655,-.103,.044,.008,.009,fem?[.65,.18,.22]:[.42,.22,.19]);mb.box(0,.646,-.1,.04,.007,.008,fem?[.55,.14,.18]:[.36,.18,.16]);}
  if(look.mous)mb.box(0,.667,-.106,.056,.014,.012,hair);
  if(look.bindi)mb.ell(0,.74,-.112,.008,.008,.004,[.8,.05,.1]);
  if(look.earrings)for(const q of[-1,1])mb.ell(q*.107,.665,.008,.01,.016,.008,[.9,.75,.2]);
  if(look.specs||look.shades){const fc=look.shades?[.06,.06,.07]:[.15,.12,.1];for(const q of[-1,1]){if(look.shades)mb.box(q*.042,.712,-.114,.05,.03,.006,[.05,.05,.06]);else{mb.box(q*.042,.712,-.112,.05,.028,.004,fc,0);mb.box(q*.042,.712,-.112,.042,.02,.006,look.shades?[.05,.05,.06]:[.75,.8,.9]);}
      mb.box(q*.085,.712,-.06,.006,.006,.1,fc);}mb.box(0,.712,-.112,.03,.005,.005,fc);}
  /* hair */
  const H=look.hair||(fem&&look.longHair?'open':look.grey&&look.dhoti?'bald':'crop');
  if(H==='bald'){mb.ell(0,.7,.06,.1,.06,.07,hair);}
  else if(H==='crop'){mb.ell(0,.765,.008,.111,.07,.122,hair);mb.ell(0,.72,.045,.108,.085,.088,hair);}
  else if(H==='side'){mb.ell(0,.768,.01,.113,.072,.124,hair);mb.ell(0,.72,.045,.108,.085,.088,hair);mb.ell(-.045,.77,-.07,.065,.03,.05,hair);}
  else if(H==='spiky'){mb.ell(0,.765,.008,.111,.07,.122,hair);mb.ell(0,.72,.045,.108,.085,.088,hair);for(const q of[-.06,-.02,.02,.06])mb.box(q,.82,-.02+Math.abs(q)*.4,.03,.05,.03,hair);}
  else if(H==='wavy'){mb.ell(0,.775,.01,.12,.08,.13,hair);mb.ell(0,.72,.05,.115,.09,.095,hair);for(const q of[-1,1])mb.ell(q*.1,.73,-.02,.03,.06,.07,hair);}
  else if(H==='bun'){mb.ell(0,.765,.008,.111,.07,.122,hair);mb.ell(0,.72,.045,.108,.085,.088,hair);mb.ell(0,.73,.12,.05,.05,.045,hair);}
  else if(H==='plait'){mb.ell(0,.765,.008,.111,.07,.122,hair);mb.ell(0,.72,.045,.108,.085,.088,hair);for(let k=0;k<5;k++)mb.ell(0,.62-k*.08,.11+k*.004,.03,.05,.03,hair);}
  else if(H==='ponytail'){mb.ell(0,.765,.008,.111,.07,.122,hair);mb.ell(0,.72,.045,.108,.085,.088,hair);mb.ell(0,.62,.12,.035,.14,.03,hair);mb.box(0,.7,.1,.05,.02,.03,[.8,.1,.15]);}
  else if(H==='open'){mb.ell(0,.765,.008,.113,.072,.124,hair);mb.ell(0,.68,.05,.11,.14,.09,hair);mb.ell(0,.58,.075,.1,.12,.055,hair);}
  else if(H==='pigtails'){mb.ell(0,.765,.008,.111,.07,.122,hair);for(const q of[-1,1]){mb.ell(q*.11,.68,.02,.03,.07,.03,hair);mb.ell(q*.11,.72,.02,.02,.02,.02,[.9,.3,.5]);}}
  if(look.cap){mb.ell(0,.78,.0,.115,.045,.125,hexRGB(look.cap));mb.box(0,.77,-.13,.2,.015,.1,hexRGB(look.cap));}
  mb.restore();mb.restore();
  if(look.backpack)mb.box(0,.24,.17,.3,.36,.14,hexRGB(look.backpack));
  mb.restore();
  if(look.bag&&!o.noBag){mb.box(.27,.82,0,.08,.26,.32,hexRGB(look.bag));limb(mb,[.27,.95,0],[-.12,1.35,0],.025,hexRGB(look.bag));}
  if(look.stick)limb(mb,[.3,1.0,-.12],[.34,0,-.25],.035,[.45,.32,.2]);
  mb.restore();};
HRIGS.clear();

/* ---------- 8-frame walk and run cycles, with a head bob; scared versions for people fleeing ---------- */
function cyc(ph,run,fear){const w=ph*TAU,S=Math.sin(w),C=Math.cos(w);const A=run?.62:.4,K=run?1.0:.35;
  return {lL:S*A,lR:-S*A,kL:Math.max(0,-S)*K+(run?.15:.05),kR:Math.max(0,S)*K+(run?.15:.05),aL:-S*(run?.7:.32),aR:S*(run?.7:.32),eL:run?1.35:.3,eR:run?1.35:.3,
    bend:run?.22:.03,bob:Math.abs(C)*(run?.05:.02),hd:fear?0:0,fear:fear};}
{const _rp=rigPose;rigPose=function(n){const hi=n.indexOf('~h');if(hi>0){const o=Object.assign({},rigPose(n.slice(0,hi)));o.hd=+n.slice(hi+2)*.3;return o;}const m=/^(wk|rn|fr)(\d)$/.exec(n);if(m)return cyc(+m[2]/8,m[1]!=='wk',m[1]==='fr');return _rp(n);};}
function pedFrame(p){const run=!!p.run;const per=run?.2:.32;const f=((p.pose?.5:0)+clamp((p.pt||0)/per,0,.999)*.5);const i=Math.floor(f*8)%8;return (p.state==='flee'?'fr':run?'rn':'wk')+i;}
pedRig=function(p){
  const look=pedLook(p),sk=SKINS[(p.v||0)%SKINS.length];
  if(p.state==='down'){M4.model(TM,p.x,.15,p.y,-p.fall,-Math.PI/2,0,p.sc||1);drawLit(rig(look,sk,'pose'),TM,PEDLIT);return;}
  let pn=p.rp;if(!pn)pn=(p.state==='flee'||p.state==='walk'||p.state==='cross')?pedFrame(p):'pose';
  else if(pn==='walk0'||pn==='walk1'||pn==='run0'||pn==='run1')pn=pedFrame(Object.assign({},p,{run:pn[0]==='r',pose:+pn[pn.length-1]}));
  const far=CAM.eye&&Math.hypot(p.x-CAM.eye[0],p.y-CAM.eye[2])>28;
  /* people glance at Tony when he comes close */
  if(!far&&p.state!=='flee'&&!p.rp){const dx=P.x-p.x,dy=P.y-p.y,d=Math.hypot(dx,dy);if(d<6&&d>.4){const fx=Math.sin(p.h),fy=-Math.cos(p.h);const side=(dx*Math.cos(p.h)+dy*Math.sin(p.h))/d,fw=(dx*fx+dy*fy)/d;if(fw>-.3){const k=Math.max(-2,Math.min(2,Math.round(-side*2.4)));if(k)pn+='~h'+k;}}}M4.model(TM,p.x,0,p.y,-p.h,0,0,p.sc||1);drawLit(rig(look,sk,pn,p.rw||null,far),TM,PEDLIT);
  if(p.culprit&&!p.caught){const b=2.35+Math.sin(GT*5)*.08;DGr.bill(p.x,b,p.y,.45,[1,.15,.1],CAM.right);}};
{const _pp=playerPose;playerPose=function(){const n=_pp();if(n==='run0'||n==='run1'||n==='walk0'||n==='walk1'){const run=n[0]==='r';const f=(FOOT.pose?.5:0)+clamp(FOOT.pt/.33,0,.999)*.5;return (run?'rn':'wk')+(Math.floor(f*8)%8);}return n;};}

/* ---------- wardrobe at a safehouse ---------- */
const WRD={el:null};
function wardUI(){if(WRD.el)return WRD.el;const e=document.createElement('div');e.id='wardScr';e.hidden=true;
  e.style.cssText='position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:14px;background:rgba(6,8,12,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)';
  const st=document.createElement('style');st.textContent=`#wardScr[hidden]{display:none!important}#wardScr .card{width:min(720px,100%);max-height:94vh;overflow-y:auto}
#wardScr h2{font-family:WCDisplay,Impact,sans-serif;font-weight:400;font-size:30px;letter-spacing:.04em;margin:0;color:#FFC72C;transform:skewX(-8deg);transform-origin:left}
#wardScr .wr{display:grid;gap:6px;padding:8px 0;border-top:1px solid rgba(255,255,255,.08)}#wardScr .wr b{font-size:14px}
#wardScr .wsw{display:flex;flex-wrap:wrap;gap:8px}#wardScr .wsw button{height:32px;border-radius:16px;border:2px solid rgba(255,255,255,.3);padding:0 12px;background:#222;color:#fff;font-size:12px}
#wardScr .wsw button.c{width:32px;padding:0;border-radius:50%}#wardScr .wsw button.on{border-color:#fff;box-shadow:0 0 0 3px #FFC72C}`;document.head.appendChild(st);document.body.appendChild(e);WRD.el=e;
  e.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const d=b.dataset;if(d.close){e.hidden=true;return;}
    const w=profile.wear||(profile.wear={});if(d.k==='shirt'||d.k==='pants'){PLOOK[d.k]=d.v;profile.look={shirt:PLOOK.shirt,pants:PLOOK.pants};}else w[d.k]=d.v;saveProfile();wardApply();wardDraw();Snd.click&&Snd.click();});return e;}
function wardDraw(){const e=wardUI(),w=profile.wear||{};const cur={shirt:PLOOK.shirt,pants:PLOOK.pants,shoes:PLOOK.shoeCol,hair:PLOOK.hair,face:w.face||'stubble',eyes:w.eyes||'none',top:w.top||'tee',hat:w.hat||'none'};
  const row=(k,title,opts,col)=>`<div class="wr"><b>${title}</b><div class="wsw">${opts.map(([v,n])=>col?`<button class="c ${cur[k]===v?'on':''}" data-k="${k}" data-v="${v}" style="background:${v}" aria-label="${n}"></button>`:`<button class="${cur[k]===v?'on':''}" data-k="${k}" data-v="${v}">${n}</button>`).join('')}</div></div>`;
  e.innerHTML=`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2>Tony's Wardrobe</h2><button class="btn primary" data-close="1">Done</button></div>
  ${row('top','Top',WARD.top)}${row('shirt','Colour',WARD.shirts,1)}${row('pants','Trousers',WARD.pants,1)}${row('shoes','Shoes',WARD.shoes,1)}${row('hair','Hair',WARD.hair)}${row('face','Face',WARD.face)}${row('eyes','Eyes',WARD.eyes)}${row('hat','Cap',WARD.hat)}</div>`;}
function wardOpen(){wardDraw();wardUI().hidden=false;}
{const _mm=misModal;misModal=function(title,text,btns){if(typeof SAFES!=='undefined'&&SAFES.some(s=>s.name===title)&&btns.some(b=>b.label==='Rest & save'))btns=btns.concat([{label:'Wardrobe',fn:()=>setTimeout(wardOpen,50)}]);return _mm(title,text,btns);};}
Object.assign(window.__oosht||{},{MBc:MB,humanGeoF:(a,b,c,d)=>humanGeo(a,b,c,d),wardOpen,wardApply,PLOOK,PED_LOOKS,pedFrame});
/* test hook: a line-up of looks drawn where the tests ask for it */
const LINEUP=[];RLAYERS.push(()=>{for(const d of LINEUP){M4.model(TM,d.x,0,d.y,-d.h,0,0,d.sc||1);drawLit(rig(PED_LOOKS[d.v%PED_LOOKS.length],SKINS[d.v%SKINS.length],d.pn||'pose'),TM,PEDLIT);}});
Object.assign(window.__oosht||{},{LINEUP});
const DBGCAM={on:false,eye:null,tgt:null,fov:30};
{const _scP=setupCamera;setupCamera=function(dt,P_,V,model){_scP(dt,P_,V,model);if(!DBGCAM.on)return;CAM.eye=DBGCAM.eye;CAM.tgt=DBGCAM.tgt;CAM.fov=DBGCAM.fov;const asp=glc.width/glc.height;
  M4.persp(CAM.proj,CAM.fov*Math.PI/180,asp,.1,1400);M4.lookAt(CAM.view,CAM.eye,CAM.tgt,[0,1,0]);M4.mul(CAM.vp,CAM.proj,CAM.view);M4.invert(CAM.inv,CAM.vp);
  const dx=CAM.tgt[0]-CAM.eye[0],dz=CAM.tgt[2]-CAM.eye[2],dl=Math.hypot(dx,dz)||1;CAM.fwd=[dx/dl,0,dz/dl];CAM.right=[-dz/dl,0,dx/dl];};}
Object.assign(window.__oosht||{},{DBGCAM});
Object.assign(window.__oosht||{},{updateFoot:dt=>updateFoot(dt),inBuilding:(x,y)=>inBuilding(x,y)});
