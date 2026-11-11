/* ================= WISE CITY: health, fighting, weapons, venues, pickups, props, carjacking ================= */
if(!profile.inv)profile.inv={bat:0,knife:0,pistol:0,smg:0,ammo:{pistol:0,smg:0}};
if(!profile.inv.ammo)profile.inv.ammo={pistol:0,smg:0};
if(!profile.fit)profile.fit={stam:100,str:1};
if(profile.armor==null)profile.armor=0;
const LIFE={hp:100,cur:'fist',atkT:0,anim:0,animK:'',aimT:0,z:0,vz:0,drunk:0,boost:0,ctx:null,ctxT:0,copPeds:[],fx:[],wrecks:[],carts:[],near:[],nearT:0,hurtT:0,arrest:0,
  taken:new Map(),propState:new Map(),crimeT:{},dead:false,punchAlt:false,saveT:0,ramT:new WeakMap(),drunkSeen:0};
const WPN={fist:{name:'Fists',dmg:11,range:1.45,rate:.42,melee:true},
  bat:{name:'Cricket bat',dmg:32,range:1.95,rate:.62,melee:true},
  knife:{name:'Knife',dmg:44,range:1.5,rate:.45,melee:true},
  pistol:{name:'Pistol',dmg:34,range:42,rate:.36,gun:'pistol'},
  smg:{name:'SMG',dmg:19,range:38,rate:.1,gun:'smg',auto:true}};
const WORDER=['fist','bat','knife','pistol','smg'];
const hasW=k=>k==='fist'||profile.inv[k]>0;
const maxStam=()=>profile.fit.stam||100;
function curModel(){return P.skin?P.skin.model:playerModel(P.type);}
function vehKeyFor(k){return VEH[k]?k:k==='taxi'?'sedan':k==='tanker'?'truck':'hatch';}

/* ---------- jointed figure for the player and the police: walking, running, fighting, aiming, sitting ---------- */
const PLOOK={shirt:'#23252B',pants:'#34465E'},COPLOOK={shirt:'#BFA77A',pants:'#A68B5B',cap:'#6B4F2A'};
function rigPose(n){switch(n){
  case 'walk0':return{lL:.35,lR:-.35,kR:.25,aL:-.35,aR:.35};case 'walk1':return{lL:-.35,lR:.35,kL:.25,aL:.35,aR:-.35};
  case 'run0':return{lL:.8,lR:-.6,kR:1.0,aL:-.9,aR:.9,bend:.2};case 'run1':return{lL:-.6,lR:.8,kL:1.0,aL:.9,aR:-.9,bend:.2};
  case 'punch':return{lL:.25,lR:-.2,aL:.7,aR:1.57,bend:.12};case 'kick':return{lL:-.2,lR:1.3,aL:.6,aR:-.5,bend:-.15};
  case 'swing0':return{lL:.2,lR:-.2,aL:3.3,aR:3.5,bend:-.12};case 'swing1':return{lL:.35,lR:-.3,aL:1.1,aR:1.2,bend:.3};
  case 'stab':return{lL:.4,lR:-.25,aL:.4,aR:1.35,bend:.18};case 'aim':return{lL:.12,lR:-.12,aL:1.4,aR:1.55};
  case 'seat':return{lL:1.45,lR:1.45,kL:1.5,kR:1.5,aL:.7,aR:.7};case 'jump':return{lL:.9,lR:-.2,kL:1.1,kR:.5,aL:2.4,aR:2.6};
  case 'pose':return{aL:.15,aR:.15};case 'carry':return{lL:.15,lR:-.15,aL:2.8,aR:2.9,bend:.08};default:return{};}}
function weaponGeo(mb,k){const dk=[.12,.12,.13];
  if(k==='bat'){mb.box(0,-.6,0,.04,.24,.04,[.15,.1,.08]);mb.box(0,-1.02,0,.11,.62,.05,[.86,.73,.5]);}
  else if(k==='knife'){mb.box(0,-.59,0,.035,.11,.04,C.black);mb.box(0,-.74,0,.012,.22,.038,[.82,.84,.88],.15);}
  else if(k==='pistol'){mb.box(0,-.58,.06,.035,.06,.12,dk);mb.box(0,-.67,0,.04,.24,.055,dk);}
  else if(k==='smg'){mb.box(0,-.72,0,.05,.44,.07,dk);mb.box(0,-.64,.11,.04,.06,.18,dk);mb.box(0,-.44,.02,.04,.2,.06,dk);}
}
const RIGS=new Map();
function rig(look,sk,pn,wk){
  const key=(look.shirt+look.pants)+'|'+pn+'|'+(wk||'');let m=RIGS.get(key);if(m)return m;
  const o=rigPose(pn);const mb=new MB();const top=hexRGB(look.shirt),pc=hexRGB(look.pants);
  for(const q of[-1,1]){const a=q<0?(o.lL||0):(o.lR||0),k=q<0?(o.kL||0):(o.kR||0);
    mb.save().tr(q*.1,.88,0).rotX(a);mb.box(0,-.22,0,.14,.46,.15,pc);
    mb.save().tr(0,-.44,0).rotX(-k);mb.box(0,-.22,0,.12,.46,.13,pc);mb.box(0,-.43,-.05,.12,.07,.25,[.12,.1,.09]);mb.restore();mb.restore();}
  mb.save().tr(0,.88,0).rotX(-(o.bend||0));
  mb.tbox(0,0,0,.38,.22,.42,.24,.5,top);if(look.cap)mb.box(0,.36,0,.44,.06,.27,[.25,.2,.12]);
  for(const q of[-1,1]){const a=q<0?(o.aL||0):(o.aR||0);mb.save().tr(q*.24,.46,0).rotX(a).box(0,-.28,0,.08,.56,.09,sk).box(0,-.12,0,.09,.24,.1,top);if(q>0&&wk)weaponGeo(mb,wk);mb.restore();}
  mb.box(0,.54,0,.1,.08,.1,sk);mb.blob(0,.68,0,.11,.13,.12,sk);mb.blob(0,.74,.02,.12,.08,.13,C.black);
  if(look.cap)mb.box(0,.79,-.03,.25,.06,.29,hexRGB(look.cap));
  mb.restore();m=mb.mesh();RIGS.set(key,m);return m;
}
function playerPose(){
  const w=WPN[LIFE.cur];
  if(LIFE.anim>0){if(LIFE.animK==='bat')return LIFE.anim>.18?'swing0':'swing1';return LIFE.animK;}
  if(LIFE.z>.05)return 'jump';
  if(w.gun&&LIFE.aimT>0)return 'aim';
  if(P.s>3.4)return FOOT.pose?'run1':'run0';
  if(P.s>.3)return FOOT.pose?'walk1':'walk0';
  return 'pose';
}
function playerWeaponShown(){const w=WPN[LIFE.cur];if(w.melee)return LIFE.cur==='fist'?null:LIFE.cur;return LIFE.aimT>0||LIFE.anim>0?LIFE.cur:null;}

/* ---------- small meshes: pickups, street props, wrecks ---------- */
let PKM=null;
function pickMeshes(){
  if(PKM)return PKM;PKM={};let mb;
  mb=new MB();mb.box(0,0,0,.62,.2,.2,[.15,.95,.35],1);mb.box(0,0,0,.2,.62,.2,[.15,.95,.35],1);PKM.health=mb.mesh();
  mb=new MB();for(let i=0;i<3;i++)mb.box(0,i*.07-.07,0,.5,.06,.26,[.35,.65,.3],.6);mb.box(0,0,0,.08,.24,.27,[.95,.85,.4],.5);PKM.cash=mb.mesh();
  mb=new MB();mb.tbox(0,-.3,0,.46,.22,.52,.26,.6,[.15,.35,.85],.6);mb.box(0,.32,0,.2,.06,.26,[.15,.35,.85],.6);PKM.armor=mb.mesh();
  mb=new MB();mb.box(0,0,0,.44,.28,.3,[.42,.45,.2],.4);mb.box(0,.16,0,.3,.04,.2,[.95,.75,.2],.6);PKM.ammo=mb.mesh();
  mb=new MB();weaponGeo(mb,'bat');PKM.bat=mb.mesh();
  /* props */
  mb=new MB();mb.cyl(0,.42,0,.28,.84,'y',12,[.12,.45,.25]);mb.cyl(0,.86,0,.3,.05,'y',12,[.1,.35,.2]);PKM.bin=mb.mesh();
  mb=new MB();mb.tbox(0,0,0,.36,.36,.5,.5,.5,[.72,.36,.2]);mb.blob(0,.72,0,.34,.3,.34,[.2,.5,.18]);PKM.pot=mb.mesh();
  mb=new MB();const pc=[.85,.15,.12];mb.box(0,.45,0,.46,.05,.46,pc);mb.box(0,.75,.21,.46,.6,.05,pc);for(const x of[-.2,.2])for(const z of[-.2,.2])mb.box(x,.22,z,.04,.45,.04,pc);PKM.chair=mb.mesh();
  mb=new MB();mb.box(0,.3,0,.6,.6,.6,[.62,.45,.26]);mb.box(0,.3,0,.62,.08,.62,[.45,.32,.18]);PKM.crate=mb.mesh();
  mb=new MB();mb.tbox(0,0,0,.36,.36,.06,.06,.7,[1,.45,.08]);mb.box(0,.38,0,.2,.08,.2,[.95,.95,.95]);mb.box(0,.02,0,.4,.04,.4,C.black);PKM.cone=mb.mesh();
  mb=new MB();mb.cyl(0,.5,0,.3,1,'y',12,[.2,.45,.85]);mb.cyl(0,1.05,0,.18,.12,'y',10,[.85,.85,.85]);PKM.can=mb.mesh();
  return PKM;
}
const PROPKINDS=['bin','pot','chair','crate','cone','can'];

/* ---------- world extras: pickups, props, venues ---------- */
const VKIND={restaurant:'hotel',fast_food:'hotel',food_court:'hotel',cafe:'cafe',ice_cream:'juice',bar:'bar',pub:'bar',biergarten:'bar',nightclub:'bar',fitness_centre:'gym',sports_centre:'gym',gym:'gym'};
const VNAMES={hotel:['Sri Ganesh Darshini','Udupi Ruchi','Namma Tiffin Room','Annapoorna Upahara','Banashankari Idli Mane','Sagar Fast Food'],
  cafe:['Filter Kaapi Co.','Bean Bloom Cafe','Malnad Roasters','Corner Brew'],
  juice:['Fresh Juice Corner','Tender Coconut Stall','Sprouts & Salad Cart','Fruit Bowl Stall','Ragi Malt Point'],
  bar:['Kaveri Taproom','Mango Leaf Bar','Night Owl Tavern','Lalbagh Brewhouse'],
  gym:['Iron Paradise Gym','Hanuman Vyayamashala','Muscle Mantra Fitness','Garden City Fitness'],
  arms:['Mysore Arms & Ammunition','Kempegowda Gun House','Licensed Arms Dealer']};
const VSPACE={hotel:280,cafe:380,juice:220,bar:450,gym:600,arms:1100};
const VCOL={hotel:['#B71C1C','#FFE082'],cafe:['#4E342E','#FFE0B2'],juice:['#2E7D32','#FFFFFF'],bar:['#1A1A2E','#FFB300'],gym:['#212121','#FF5252'],arms:['#263238','#FFD54F']};
const VSUB={hotel:'Hotel · Tiffin · Meals',cafe:'Coffee · Snacks',juice:'Juice · Healthy food',bar:'Bar & Restaurant',gym:'Gym · Fitness',arms:'Licensed arms dealer'};
function buildLifeWorld(){
  W.pick=[];W.props=[];W.prG=new Map();W.venues=[];
  /* venues from the real map first */
  for(const q of W.pois){const k=VKIND[q.sub];if(!k||!q.name)continue;const v=venueAtPoint(k,q.name,q.x,q.y,true);if(v)W.venues.push(v);}
  for(const s of W.segs){
    if(s.len<30||s.w.br||['motorway','trunk','service'].includes(s.w.cls))continue;
    const hs=hash2(Math.round(s.ax*7+s.by*3),Math.round(s.ay*5-s.bx*2));const r=mulberry32(hs);
    if(r()<.07){const kr=r();const kind=kr<.45?'health':kr<.68?'cash':kr<.8?'armor':kr<.93?'ammo':'bat';const side=r()<.5?1:-1;const[x,y]=segPt(s,s.len*(.2+r()*.6),(s.w.hw+1.3)*side);
      if(!inBuilding(x,y))W.pick.push({key:'p'+hs,kind,x,y,amt:kind==='cash'?50+Math.floor(r()*35)*10:0});}
    if(r()<.4){const n=1+(r()<.45?1:0);for(let i=0;i<n;i++){const side=r()<.5?1:-1;const[x,y]=segPt(s,s.len*(.1+r()*.8),(s.w.hw+1.8+r()*.7)*side);
      if(inBuilding(x,y)||nearSignal(x,y,8))continue;const key='q'+hs+'_'+i;const st=LIFE.propState.get(key);
      const o={key,kind:PROPKINDS[Math.floor(r()*PROPKINDS.length)],x,y,h:r()*TAU,z:0,vx:0,vy:0,vz:0,down:false,pitch:0};if(st)Object.assign(o,st);
      W.props.push(o);gAddBox(W.prG,o.x,o.y,o.x,o.y,o);}}
    /* procedural venues on the buildings that face the road */
    if(RANK[s.w.cls]>=1&&s.len>40&&r()<.11){const kr=r();const kind=kr<.34?'hotel':kr<.52?'juice':kr<.66?'cafe':kr<.79?'bar':kr<.92?'gym':'arms';
      const side=r()<.5?1:-1,t=s.len*(.25+r()*.5);const[x,y]=segPt(s,t,(s.w.hw+1.4)*side);
      if(W.venues.some(v=>v.kind===kind&&Math.hypot(v.x-x,v.y-y)<VSPACE[kind]))continue;
      const nm=VNAMES[kind][(hs>>>0)%VNAMES[kind].length];const v=venueAtPoint(kind,nm,x,y,false,s,side);if(v)W.venues.push(v);}
  }
  /* make sure every kind of place exists near where you start */
  for(const kind of Object.keys(VNAMES)){
    if(W.venues.some(v=>v.kind===kind&&Math.hypot(v.x-P.x,v.y-P.y)<700))continue;
    const cand=W.segs.filter(s=>s.len>35&&!s.w.br&&RANK[s.w.cls]>=1).map(s=>({s,d:Math.abs(Math.hypot((s.ax+s.bx)/2-P.x,(s.ay+s.by)/2-P.y)-260-Object.keys(VNAMES).indexOf(kind)*60)})).sort((a,b)=>a.d-b.d).slice(0,24);
    for(const c of cand){const s=c.s;const[x,y]=segPt(s,s.len*.5,(s.w.hw+1.4));if(W.venues.some(v=>Math.hypot(v.x-x,v.y-y)<40))continue;const v=venueAtPoint(kind,VNAMES[kind][0],x,y,false,s,1);if(v){W.venues.push(v);break;}}
  }
}
/* a venue is a door on the footpath plus a signboard on the building behind it (or a kiosk / cart when there is no building) */
function venueAtPoint(kind,name,px,py,real,seg,side){
  let s=seg;if(!s){const n=nearestSeg(px,py,60,q=>!q.w.br);if(!n.seg)return null;s=n.seg;}
  const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;const t=clamp((px-s.ax)*dx+(py-s.ay)*dy,0,s.len);
  if(side==null){const cr=(px-s.ax)*dy-(py-s.ay)*dx;side=cr>0?-1:1;}
  const[x,y]=segPt(s,t,(s.w.hw+1.4)*side);const nx=-dy*side*-1,ny=dx*side*-1;/* unit normal pointing from the road to this side */
  const ox=x-(s.ax+dx*t),oy=y-(s.ay+dy*t),ol=Math.hypot(ox,oy)||1;const ux=ox/ol,uy=oy/ol;
  const v={kind,name,x,y,real,ux,uy,h:hAng(-ux,-uy),sign:null};
  if(kind==='juice'){v.cart=true;v.cx=x+ux*.9;v.cy=y+uy*.9;return v;}
  /* building facing the road */
  const b=wallFacing(x+ux*2.5,y+uy*2.5,-ux,-uy);
  if(b){v.wall=b;return v;}
  if(real)return v;
  /* no building: a small kiosk on an empty lot */
  const kx=x+ux*3.8,ky=y+uy*3.8;if(!clearLot(kx,ky,v.h,3.4,2.6,false))return null;
  /* a small single-storey shop: added as a real building so walls, shopfront and collisions all work */
  const c=Math.cos(-v.h),sn=Math.sin(-v.h),pts=[];for(const[u,w]of[[-1,-1],[1,-1],[1,1],[-1,1]])pts.push(kx+u*3*c+w*2.2*sn,ky-u*3*sn+w*2.2*c);
  let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9;for(let i=0;i<8;i+=2){mnx=Math.min(mnx,pts[i]);mxx=Math.max(mxx,pts[i]);mny=Math.min(mny,pts[i+1]);mxy=Math.max(mxy,pts[i+1]);}
  const kb={pts,minx:mnx,miny:mny,maxx:mxx,maxy:mxy,cx:kx,cy:ky,h:5.4,area:26,col:hexRGB(['#E8DCC4','#D9E3E8','#F0E2C8','#E3D3D0'][Math.floor(Math.abs(kx*7+ky*3))%4]),tank:false,_q:0,kiosk:true};
  W.bld.push(kb);gAddBox(W.bG,mnx,mny,mxx,mxy,kb);
  const wf=wallFacing(x+ux*2.5,y+uy*2.5,-ux,-uy);if(wf){v.wall=wf;return v;}
  return null;
}
/* nearest building wall in front of a point, facing back towards (fx,fy) */
function wallFacing(px,py,fx,fy){
  const tmp=[];gQuery(W.bG,px,py,14,tmp);let best=null,bd=14;
  for(const b of tmp){if(b.hide)continue;const p=b.pts,n=p.length/2,ccw=polyArea(p)>0;
    for(let i=0;i<n;i++){const j=(i+1)%n;const ax=p[2*i],ay=p[2*i+1],bx=p[2*j],by=p[2*j+1];const L=Math.hypot(bx-ax,by-ay);if(L<3.2)continue;
      const ex=(bx-ax)/L,ey=(by-ay)/L;const nx=ccw?ey:-ey,ny=ccw?-ex:ex;if(nx*fx+ny*fy<.55)continue;
      const d=segDistXY(px,py,ax,ay,bx,by);if(d<bd){const tt=clamp((px-ax)*ex+(py-ay)*ey,1.4,L-1.4);bd=d;best={b,ax,ay,ex,ey,L,nx,ny,cx:ax+ex*tt,cy:ay+ey*tt,bh:b.h};}}}
  return best;
}

/* ---------- textured signboards fixed to walls (not floating) ---------- */
function signQuad(mb,cx,cy,y0,nx,ny,w,h,uv,two){
  const rx=ny,ry=-nx;const off=.07;const x0=cx+nx*off-rx*w/2,z0=cy+ny*off-ry*w/2,x1=cx+nx*off+rx*w/2,z1=cy+ny*off+ry*w/2;
  const u=uv||[0,0,1,1];
  mb.quad([x0,y0,z0],[x1,y0,z1],[x1,y0+h,z1],[x0,y0+h,z0],[1,1,1],[nx,0,ny],[u[0],u[3],u[2],u[3],u[2],u[1],u[0],u[1]]);
  if(two){const bx0=cx-nx*off,bz0=cy-ny*off;mb.quad([bx0+rx*w/2,y0,bz0+ry*w/2],[bx0-rx*w/2,y0,bz0-ry*w/2],[bx0-rx*w/2,y0+h,bz0-ry*w/2],[bx0+rx*w/2,y0+h,bz0+ry*w/2],[1,1,1],[-nx,0,-ny],[u[0],u[3],u[2],u[3],u[2],u[1],u[0],u[1]]);}
}
function signFrame(mb,cx,cy,y0,nx,ny,w,h,col){const rx=ny,ry=-nx;mb.save();mb.tr(cx-nx*.02,y0+h/2,cy-ny*.02);mb.rotY(-hAng(nx,ny));mb.box(0,0,.02,w+.12,h+.12,.08,col||[.15,.15,.16]);mb.restore();}
function makeSign(key,build){let s=SIGNS.get(key);if(s&&s.v===W.version)return s;if(s){freeMesh(s.mesh);if(s.frame)freeMesh(s.frame);}
  const mb=new MB(),fb=new MB();build(mb,fb);s={mesh:mb.mesh(),frame:fb.mesh(),v:W.version};SIGNS.set(key,s);return s;}
const SIGNS=new Map();
function drawSignMesh(s,tex,night){drawLit(s.frame,null,{emiK:.3});drawLit(s.mesh,null,{tex,emTex:tex,emiK:.25+night*.75});}
/* real shop and place names: mounted on the wall of the building facing the road */
function poiSign(q){
  return makeSign('poi:'+q.name+q.x.toFixed(1),(mb,fb)=>{
    const w0=Math.min(7,2.4+q.name.length*.16);let m=null;
    const n=nearestSeg(q.x,q.y,70,s=>!s.w.br);
    if(n.seg){const s=n.seg;const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;const t=clamp((q.x-s.ax)*dx+(q.y-s.ay)*dy,0,s.len);const rx=s.ax+dx*t,ry=s.ay+dy*t;
      const ox=q.x-rx,oy=q.y-ry,ol=Math.hypot(ox,oy)||1;const ux=ox/ol,uy=oy/ol;
      m=wallFacing(rx+ux*(s.w.hw+3),ry+uy*(s.w.hw+3),-ux,-uy)||wallFacing(q.x,q.y,-ux,-uy);
      if(m){const w=Math.min(w0,m.L*.9),h=w/4;let y0=m.bh>5.2?3.55:Math.max(1.9,m.bh-h-.15);if(y0+h>m.bh-.05&&m.bh>2.6)y0=Math.max(1.6,m.bh-h-.1);
        signFrame(fb,m.cx,m.cy,y0,m.nx,m.ny,w,h);signQuad(mb,m.cx,m.cy,y0,m.nx,m.ny,w,h);return;}
      /* no wall: a roadside board on two poles, turned to face the road */
      const[px,py]=segPt(s,t,(s.w.hw+1.7)*(((q.x-s.ax)*dy-(q.y-s.ay)*dx)>0?-1:1));const w=Math.min(w0,4.2),h=w/4;
      for(const k of[-1,1])fb.box(px+dx*k*w*.42,1.25,py+dy*k*w*.42,.08,2.5,.08,[.35,.35,.37]);
      signFrame(fb,px,py,2.3,-ux,-uy,w,h);signQuad(mb,px,py,2.3,-ux,-uy,w,h,null,true);}
  });
}
function drawPoiSigns(night){for(const q of nearPois){if(!q.name)continue;const s=poiSign(q);drawSignMesh(s,boardTex(q).tex,night);}}
function venueTex(v){return textTex('ven:'+v.name,(c,w,h)=>{const sty=VCOL[v.kind];c.fillStyle=sty[0];c.fillRect(0,0,w,h);c.strokeStyle=sty[1];c.lineWidth=5;c.strokeRect(8,8,w-16,h-16);
  c.fillStyle=sty[1];c.textAlign='center';c.textBaseline='middle';let fs=54;c.font=`700 ${fs}px "Barlow Semi Condensed", Arial, sans-serif`;while(c.measureText(v.name).width>w-40&&fs>24){fs-=3;c.font=`700 ${fs}px "Barlow Semi Condensed", Arial, sans-serif`;}
  c.fillText(v.name,w/2,h*.42);c.font='500 24px "Barlow Semi Condensed", Arial, sans-serif';c.fillText(VSUB[v.kind].toUpperCase(),w/2,h*.8);},512,128);}
function venueSign(v){
  return makeSign('ven:'+v.name+v.x.toFixed(1),(mb,fb)=>{
    if(v.wall){const m=v.wall;const w=Math.min(5.5,m.L*.85),h=w/4;let y0=m.bh>5.2?3.55:Math.max(1.9,m.bh-h-.15);if(y0+h>m.bh-.05&&m.bh>2.6)y0=Math.max(1.6,m.bh-h-.1);
      signFrame(fb,m.cx,m.cy,y0,m.nx,m.ny,w,h,[.1,.1,.1]);signQuad(mb,m.cx,m.cy,y0,m.nx,m.ny,w,h);
      /* doorway and a bit of glass so it reads as a shop entrance */
      const rx=m.ny,ry=-m.nx;fb.save();fb.tr(m.cx+m.nx*.03,1.15,m.cy+m.ny*.03);fb.rotY(-hAng(m.nx,m.ny));fb.box(0,0,0,1.6,2.3,.04,[.16,.2,.24],.2);fb.box(0,1.2,0,1.9,.1,.06,hexRGB(VCOL[v.kind][0]));fb.restore();return;}
    if(v.kiosk&&false){const k=v.kiosk;const col=hexRGB(VCOL[v.kind][0]);fb.save();fb.tr(k.x,0,k.y);fb.rotY(-v.h);
      fb.box(0,1.7,.6,6,3.4,4.4,[.86,.84,.8]);fb.box(0,3.5,.6,6.3,.2,4.7,col);fb.box(0,1.2,-1.62,1.6,2.4,.04,[.16,.2,.24],.2);fb.box(-1.9,1.5,-1.62,1.6,1.6,.04,[.3,.4,.5],.3);fb.box(1.9,1.5,-1.62,1.6,1.6,.04,[.3,.4,.5],.3);fb.restore();
      const fx=Math.sin(v.h),fy=-Math.cos(v.h);const cx=k.x+fx*1.66,cy=k.y+fy*1.66;signQuad(mb,cx,cy,2.62,fx,fy,4.4,1.1);return;}
    if(v.cart){const fx=v.ux,fy=v.uy;const rx=fy,ry=-fx;const cx=v.cx-fx*.1,cy=v.cy-fy*.1;
      for(const k of[-1,1])fb.box(cx+rx*k*1.2,1.2,cy+ry*k*1.2,.06,2.4,.06,[.4,.4,.42]);signFrame(fb,cx,cy,2.25,-fx,-fy,2.6,.65);signQuad(mb,cx,cy,2.25,-fx,-fy,2.6,.65,null,true);}
  });
}
function drawVenues(ex,ez,night,A){
  for(const v of W.venues){const d=Math.hypot(v.x-ex,v.y-ez);if(d>190)continue;
    if(v.cart&&d<140){M4.model(TM,v.cx,0,v.cy,-v.h+Math.PI/2,0,0);drawLit(A.cart[v.kind==='juice'?1:0],TM);}
    if(v.real)continue;
    drawSignMesh(venueSign(v),venueTex(v).tex,night);}
}

/* rooftop hoardings: one atlas of made-up local adverts */
function adsTex(){return textTex('ads',(c,w,h)=>{
  const ads=[['#0D47A1','WISE CITY FM','98.3 · Namma hits all day','#FFEB3B'],['#1B5E20','MALNAD COFFEE','Strong filter kaapi','#FFF'],['#B71C1C','DOSA EXPRESS','Ghee roast in 5 minutes','#FFE082'],['#4A148C','SAMPIGE SILKS','Wedding sale · 40% off','#FFD54F'],
    ['#E65100','GARDEN CITY REALTY','2 BHK near metro','#FFF'],['#263238','SHAKTI CEMENT','Builds Bengaluru','#FFC107'],['#00695C','RIDE THE METRO','Beat the traffic','#FFF'],['#880E4F','CHAMUNDI GOLD','Hallmarked jewellery','#FFE082']];
  const cw=w/4,ch=h/2;ads.forEach((a,i)=>{const x=(i%4)*cw,y=Math.floor(i/4)*ch;c.fillStyle=a[0];c.fillRect(x,y,cw,ch);c.fillStyle='rgba(255,255,255,.08)';c.beginPath();c.arc(x+cw*.85,y+ch*.2,ch*.6,0,TAU);c.fill();
    c.strokeStyle='#F5F5F5';c.lineWidth=6;c.strokeRect(x+4,y+4,cw-8,ch-8);c.fillStyle=a[3];c.textAlign='center';c.textBaseline='middle';let fs=40;c.font=`800 ${fs}px "Barlow Semi Condensed", Arial, sans-serif`;
    while(c.measureText(a[1]).width>cw-24&&fs>18){fs-=2;c.font=`800 ${fs}px "Barlow Semi Condensed", Arial, sans-serif`;}c.fillText(a[1],x+cw/2,y+ch*.42);c.font='500 20px "Barlow Semi Condensed", Arial, sans-serif';c.fillStyle='#FFFFFF';c.fillText(a[2],x+cw/2,y+ch*.74);});},1024,256);}
const HOARDS=[];
function hoardingAt(sol,ads,b,ax,ay,bx,by,nx,ny,hs){
  if(HOARDS.length<400)HOARDS.push({x:(ax+bx)/2,y:(ay+by)/2,h:b.h,nx,ny});
  const L=Math.hypot(bx-ax,by-ay);const w=Math.min(8,L*.8),h=w*.42;const mx=(ax+bx)/2-nx*.8,my=(ay+by)/2-ny*.8;const y0=b.h+1.0;
  const rx=ny,ry=-nx;for(const k of[-.38,.38])sol.box(mx+rx*k*w-nx*.3,b.h+.5,my+ry*k*w-ny*.3,.16,1.0+h,.16,[.3,.3,.32]);
  sol.save();sol.tr(mx-nx*.12,y0+h/2,my-ny*.12);sol.rotY(-hAng(nx,ny));sol.box(0,0,0,w+.2,h+.2,.16,[.2,.2,.22]);sol.restore();
  const i=hs%8;const u0=(i%4)/4,v0=Math.floor(i/4)/2;signQuad(ads,mx,my,y0,nx,ny,w,h,[u0+.004,v0+.008,u0+.246,v0+.492]);
}

/* ---------- taking damage, hospital ---------- */
function lfDamage(d,why){
  if(LIFE.dead||state!=='play')return;const a=Math.min(profile.armor,d*.7);profile.armor-=a;d-=a;LIFE.hp-=d;LIFE.hurtT=.45;Hap.crash();
  if(LIFE.hp<=0){LIFE.hp=0;hospital(why);}
}
function hospital(why){
  LIFE.dead=true;state='hosp';releaseAll();Snd.stopEngine();Snd.sirenOff();
  const bill=Math.min(profile.wallet,1500);profile.wallet-=bill;saveProfile();
  let hq=null,hd=1e9;for(const q of W.pois)if(/hospital|clinic/.test(q.sub)){const d=Math.hypot(q.x-P.x,q.y-P.y);if(d<hd){hd=d;hq=q;}}
  LIFE.hospAt=hq;$('#hsTitle').textContent='Hospitalised';
  $('#hsText').textContent=`${why==='crash'?'You were badly hurt in a crash.':'You were knocked out.'} The ambulance took you to ${hq&&hq.name?hq.name:'the government hospital'}. Treatment bill ₹${fmtINR(bill)}.`;
  show('hospScr');
}
$('#hsBtn').addEventListener('click',()=>{
  const wasDriving=!FOOT.on;const pk=wasDriving?{type:P.type,skin:P.skin,x:P.x,y:P.y,h:P.h,cond:P.cond,fuel:P.fuel}:FOOT.parked;
  COP.list=[];COP.level=0;COP.off=[];COP.caughtT=0;COP.lostT=0;COP.pedHit=false;LIFE.copPeds=[];$('#wanted').hidden=true;
  LIFE.dead=false;LIFE.hp=100;LIFE.drunk=0;
  const q=LIFE.hospAt;if(q){const n=nearestSeg(q.x,q.y,80,s=>!s.w.br);if(n.seg){const s=n.seg;const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;const t=clamp((q.x-s.ax)*dx+(q.y-s.ay)*dy,0,s.len);const[x,y]=segPt(s,t,s.w.hw+1.3);P.x=x;P.y=y;P.h=s.h;}}
  state='play';goFoot(null,true);FOOT.parked=profile.seized?null:pk;FOOT.stam=maxStam()*.6;toast('Discharged. Take it easy.','good');
});

/* ---------- fighting ---------- */
function lineClear(ax,ay,bx,by){const L=Math.hypot(bx-ax,by-ay);const n=Math.ceil(L/1.4);for(let i=1;i<n;i++){const t=i/n;if(inBuilding(ax+(bx-ax)*t,ay+(by-ay)*t))return false;}return true;}
function carDist(o,len,wid,x,y){const L=len/2,hx=Math.sin(o.h)*L,hy=-Math.cos(o.h)*L;return segDistXY(x,y,o.x-hx,o.y-hy,o.x+hx,o.y+hy)-wid/2;}
function lfTargets(){
  const out=[];
  for(const p of peds){if(p.dead)continue;out.push({k:'ped',o:p,x:p.x,y:p.y,r:.3,h:p.state==='down'?.25:1.1});}
  for(const c of LIFE.copPeds)if(!c.dead)out.push({k:'cop',o:c,x:c.x,y:c.y,r:.3,h:1.1});
  for(const a of agents)out.push({k:'car',o:a,x:a.x,y:a.y,car:[a.t.len,a.t.wid],h:.9});
  for(const c of COP.list)out.push({k:'pcar',o:c,x:c.x,y:c.y,car:[4.55,1.86],h:.9});
  if(FOOT.parked)out.push({k:'own',o:FOOT.parked,x:FOOT.parked.x,y:FOOT.parked.y,car:[3.8,1.6],h:.8});
  for(const q of LIFE.near)if(!q.down||q.kind==='crate')out.push({k:'prop',o:q,x:q.x,y:q.y,r:.3,h:.5});
  return out;
}
function pickTarget(w){
  let best=null,bs=1e9;
  for(const t of lfTargets()){
    const d=t.car?carDist(t.o,t.car[0],t.car[1],P.x,P.y):Math.hypot(t.x-P.x,t.y-P.y)-t.r;
    const ang=Math.abs(angDiff(P.h,hAng(t.x-P.x,t.y-P.y)));
    if(w.melee){if(d>w.range||(ang>1.05&&d>.5))continue;}
    else{if(d>w.range||ang>(d<6?.8:.4))continue;if(!lineClear(P.x,P.y,t.x,t.y))continue;}
    const sc=Math.max(0,d)+ang*(w.melee?2:12)+(t.k==='prop'?4:0)+(t.k==='own'?20:0)+(t.k==='ped'&&t.o.state==='down'?3:0);
    if(sc<bs){bs=sc;best=t;}}
  return best;
}
function cycleWeapon(back){let i=WORDER.indexOf(LIFE.cur);for(let k=0;k<5;k++){i=(i+(back?4:1))%5;const w=WORDER[i];if(hasW(w)&&(!WPN[w].gun||profile.inv.ammo[WPN[w].gun]>0||w===LIFE.cur)){LIFE.cur=w;break;}}if(back&&WPN[LIFE.cur].gun&&!profile.inv.ammo[WPN[LIFE.cur].gun])LIFE.cur='fist';}
function doAttack(){
  if(FOOT.job&&FOOT.job.carry)return;LIFE.lastAtk=GT;
  const k=LIFE.cur,w=WPN[k];
  if(w.gun&&(profile.inv.ammo[w.gun]||0)<=0){Snd.tick();toast('Out of ammo','bad','ammo',1200);LIFE.cur='fist';return;}
  LIFE.atkT=w.rate;const t=pickTarget(w);
  if(w.melee){
    if(k==='fist'){LIFE.punchAlt=!LIFE.punchAlt;LIFE.animK=LIFE.punchAlt?'punch':'kick';}else LIFE.animK=k==='bat'?'bat':'stab';
    LIFE.anim=k==='bat'?.36:.28;
    if(t){P.h+=angDiff(P.h,hAng(t.x-P.x,t.y-P.y))*.8;const dmg=w.dmg*(k==='fist'?profile.fit.str:1)*(LIFE.animK==='kick'?1.3:1);
      setTimeout(()=>{if(state==='play'&&FOOT.on)dealHit(t,dmg,'melee');},k==='bat'?170:110);}
    else{Snd.tone([180],.06,'triangle',.04);
      const fx=Math.sin(P.h),fy=-Math.cos(P.h);if(inBuilding(P.x+fx*.8,P.y+fy*.8)){setTimeout(()=>{Snd.thud(.15);Hap.tick();},110);}}
  }else{
    profile.inv.ammo[w.gun]--;LIFE.aimT=2.2;LIFE.anim=.1;LIFE.animK='aim';
    Snd.burst(.08,1700,.6,.55,'bandpass');Snd.burst(.22,150,1,.55);Hap.tick();CAM.shake=Math.max(CAM.shake,1.1);
    if(t)P.h=hAng(t.x-P.x,t.y-P.y);
    const fx=Math.sin(P.h),fy=-Math.cos(P.h);const mx=P.x+fx*.7-fy*.22,my=P.y+fy*.7+fx*.22;
    let hx,hy,hz=1.2;
    if(t){const d=Math.hypot(t.x-P.x,t.y-P.y);const acc=clamp(1.02-d/w.range*.6-(P.s>3?.2:0),.3,.97);
      if(Math.random()<acc){hx=t.x;hy=t.y;hz=t.h;dealHit(t,w.dmg,'gun');}else{hx=t.x+(Math.random()-.5)*2.4;hy=t.y+(Math.random()-.5)*2.4;hz=.4+Math.random()*1.4;spark(hx,hz,hy);}}
    else{let d=0;for(;d<w.range;d+=.8)if(inBuilding(P.x+fx*d,P.y+fy*d))break;hx=P.x+fx*d;hy=P.y+fy*d;spark(hx,1.25,hy);}
    LIFE.fx.push({k:'tracer',a:[mx,1.32+LIFE.z,my],b:[hx,hz,hy],t:.06});LIFE.fx.push({k:'flash',p:[mx+fx*.2,1.32+LIFE.z,my+fy*.2],t:.05});
    panic(P.x,P.y,60);
    if(nearCop(80)||Math.random()<.15)crime('arms',2);
    LIFE.saveT=1;
  }
}
function spark(x,y,z,col){LIFE.fx.push({k:'spark',p:[x,y,z],t:.12,c:col||[1,.8,.45]});}
function dealHit(t,dmg,how){
  const dx=t.x-P.x,dy=t.y-P.y,dl=Math.hypot(dx,dy)||1;const nx=dx/dl,ny=dy/dl;
  if(how==='melee'){Snd.thud(.35);Hap.tick();CAM.shake=Math.max(CAM.shake,1.5);}
  if(t.k==='ped')hurtPed(t.o,dmg,nx,ny,how);
  else if(t.k==='cop')hurtCop(t.o,dmg,nx,ny);
  else if(t.k==='car'||t.k==='pcar')hurtCar(t.o,dmg,how,t.k==='pcar');
  else if(t.k==='own'){t.o.cond=Math.max(0,(t.o.cond||100)-dmg*.3);spark(t.x-nx,1,t.y-ny);}
  else if(t.k==='prop')knockProp(t.o,nx*(how==='gun'?2.5:4.5),ny*(how==='gun'?2.5:4.5),2.6);
}
function setFlee(p,x,y){if(p.cart!=null&&p.state==='static'){LIFE.carts.push({x:p.cx,y:p.cy,h:p.h,c:p.cart});}p.cart=null;p.state='flee';p.fx=x;p.fy=y;p.t=0;p.run=true;p.side=Math.random()<.5?1:-1;if(p.kind)p.v=p.v%PED_LOOKS.length;}
function panic(x,y,r){for(const p of peds){if(p.dead||p.state==='down'||p.state==='flee')continue;if(Math.hypot(p.x-x,p.y-y)<r){if(p.state==='static'&&p.kind==='lie'&&Math.random()<.5)continue;setFlee(p,x,y);}}}
function hurtPed(p,dmg,nx,ny,how){
  if(p.hp==null)p.hp=(p.sc&&p.sc<.8)?55:PED_LOOKS[p.v]&&PED_LOOKS[p.v].kind==='elder'?60:100;
  p.hp-=dmg;spark(p.x,1.1,p.y,[1,.35,.25]);
  if(p.state==='static'){if(p.cart!=null)LIFE.carts.push({x:p.cx,y:p.cy,h:p.h,c:p.cart});p.cart=null;p.v=p.v%PED_LOOKS.length;}
  if(p.hp<=0){p.state='down';p.dead=true;p.ko=false;p.t=-30;p.fall=hAng(nx,ny);p.x+=nx*.5;p.y+=ny*.5;dropCash(p.x,p.y,20+Math.floor(Math.random()*18)*10);crime('kill',3);Snd.yelp();}
  else if(dmg>=28||(how==='melee'&&Math.random()<.4)){p.state='down';p.ko=true;p.t=0;p.fall=hAng(nx,ny);p.x+=nx*.6;p.y+=ny*.6;crime('assault',1);}
  else{setFlee(p,P.x,P.y);crime('assault',1);}
  panic(p.x,p.y,16);
}
function dropCash(x,y,amt){W.pick.push({key:'d'+Math.random(),kind:'cash',x:x+(Math.random()-.5),y:y+(Math.random()-.5),amt,temp:true});}
function hurtCop(c,dmg,nx,ny){
  c.hp-=dmg;spark(c.x,1.1,c.y,[1,.35,.25]);c.stag=.35;c.x+=nx*.3;c.y+=ny*.3;LIFE.arrest=Math.max(0,LIFE.arrest-1);
  if(c.hp>0&&(dmg>=20||Math.random()<.45)){c.ko=2.2+Math.random()*1.5;c.fall=hAng(nx,ny);c.x+=nx*.4;c.y+=ny*.4;}
  if(c.hp<=0){c.dead=true;c.t=0;c.fall=hAng(nx,ny);crime('cop',4);}else crime('cop',2);
}
function hurtCar(a,dmg,how,police){
  if(a.hp==null)a.hp=police?220:a.t.len>6?320:a.t.two?70:160;
  if(a.wreck)return;a.hp-=dmg;Snd.tone([260+Math.random()*120],.05,'square',.05);
  if(how!=='ram'){spark(a.x,1,a.y);if(!police&&Math.random()<.4)crime('damage',1);}
  if(police)crime('cop',2);
  if(how!=='ram'&&!a.t?.two&&!police&&a.hp>0){a.stop=0;a.panic=4;}
  if(a.hp<=0)wreckCar(a,police,how);
}
function wreckCar(a,police,how){
  a.wreck=true;const i=police?COP.list.indexOf(a):agents.indexOf(a);if(i>=0)(police?COP.list:agents).splice(i,1);
  const model=police?a.model:a.model;LIFE.wrecks.push({x:a.x,y:a.y,h:a.h,model,t:0,fire:how==='gun'?10:4});
  LIFE.fx.push({k:'boom',p:[a.x,1.2,a.y],t:.7});Snd.crash();CAM.shake=Math.max(CAM.shake,7);Hap.bigCrash();
  const d=Math.hypot(a.x-P.x,a.y-P.y);if(d<6)lfDamage((6-d)*7,'boom');
  for(const p of peds)if(!p.dead&&Math.hypot(p.x-a.x,p.y-a.y)<5)hurtPed(p,40,(p.x-a.x)/5,(p.y-a.y)/5,'gun');
  if(police){for(let k=0;k<2;k++)LIFE.copPeds.push(newCopPed(a.x+(k?2:-2)*Math.cos(a.h),a.y+(k?2:-2)*Math.sin(a.h)));crime('cop',4);}
  else{ejectDriver(a);crime('damage',2);}
}
function ejectDriver(a){
  const lx=-Math.cos(a.h),ly=-Math.sin(a.h),side=a.t&&a.t.wid?a.t.wid/2+.6:1.4;
  const p={x:a.x+lx*side,y:a.y+ly*side,h:a.h,state:'flee',v:pickLook(false),pose:0,pt:0,t:0,sc:1,run:true,speed:1.5,fx:P.x,fy:P.y,side:1};
  if(a.t&&a.t.two){p.state='down';p.ko=true;p.fall=a.h;}
  peds.push(p);
}
function knockProp(q,vx,vy,vz){q.vx=vx;q.vy=vy;q.vz=vz;q.spin=(Math.random()-.5)*9;q.moving=true;Snd.tone([q.kind==='bin'||q.kind==='can'?240:420],.08,'triangle',.06);if(q.kind!=='cone'&&Math.random()<.3)crime('damage',1);}
const nearCop=r=>COP.list.some(c=>Math.hypot(c.x-P.x,c.y-P.y)<r)||LIFE.copPeds.some(c=>!c.dead&&Math.hypot(c.x-P.x,c.y-P.y)<r);
function crime(code,lvl){
  if(state!=='play')return;if(code==='assault'&&!nearCop(140)&&Math.random()<.5)return;
  const st=addHeat(code);const now=GT;if((LIFE.crimeT[code]||-99)>now-4&&st<=COP.level)return;LIFE.crimeT[code]=now;
  offence(code,Math.max(lvl,st));
}

/* ---------- police on foot ---------- */
function newCopPed(x,y){return {x,y,h:0,hp:100,t:0,pose:0,pt:0,shootT:1+Math.random(),stag:0,aim:0,dead:false};}
function updateCopPeds(dt){
  let contact=false;
  for(let i=LIFE.copPeds.length-1;i>=0;i--){const c=LIFE.copPeds[i];c.t+=dt;
    if(c.dead){if(c.t>40)LIFE.copPeds.splice(i,1);continue;}
    const dx=P.x-c.x,dy=P.y-c.y,d=Math.hypot(dx,dy);
    if(d>180||(!COP.level&&c.t>4)){LIFE.copPeds.splice(i,1);continue;}
    c.aim=Math.max(0,c.aim-dt);c.swing=Math.max(0,(c.swing||0)-dt);
    if(c.ko>0){c.ko-=dt;continue;}
    if(c.stag>0){c.stag-=dt;continue;}
    c.h=hAng(dx,dy);
    const shooter=COP.level>=3&&d>3.5&&d<26&&FOOT.on&&!FOOT.ride;
    if(shooter){c.shootT-=dt;if(c.shootT<=0){c.shootT=(COP.level>=5?.7:1.3)+Math.random()*1.1;c.aim=.6;copShoot(c,d);}}
    if(d<1.4&&FOOT.on&&!FOOT.ride){c.mel=(c.mel??.6)-dt;if(c.mel<=0){c.mel=1.1+Math.random()*.4;c.swing=.35;Snd.thud(.3);lfDamage(4+COP.level*1.5,'beaten');CAM.shake=Math.max(CAM.shake,1.2);}}
    const sp=d>1.05?(shooter&&d<14?0:(FOOT.on?5.2:6.5)):0;
    if(sp>0){let hx=dx/d,hy=dy/d;let nx=c.x+hx*sp*dt,ny=c.y+hy*sp*dt;
      if(inBuilding(nx,ny)){for(const r of[1.1,-1.1,2,-2]){const a=Math.atan2(hy,hx)+r;const tx=c.x+Math.cos(a)*sp*dt,ty=c.y+Math.sin(a)*sp*dt;if(!inBuilding(tx,ty)){nx=tx;ny=ty;break;}}if(inBuilding(nx,ny)){nx=c.x;ny=c.y;}}
      c.x=nx;c.y=ny;c.pt+=dt;if(c.pt>.2){c.pt=0;c.pose^=1;}}
    if(d<1.15&&FOOT.on&&!FOOT.ride&&LIFE.z<.2)contact=true;
  }
  const fighting=GT-(LIFE.lastAtk??-99)<1.4;
  if(contact&&!fighting){LIFE.arrest+=dt;toast('A constable is cuffing you! Hit back or run','bad','grab',900);}else LIFE.arrest=Math.max(0,LIFE.arrest-dt*(fighting?1.5:.7));
  if(LIFE.arrest>2.2)busted();
}
function copShoot(c,d){
  Snd.burst(.07,1400,.6,.35*clamp(1-d/60,.2,1),'bandpass');
  const hit=Math.random()<clamp(.7-d/45,.18,.6)*(P.s>4?.6:1);
  const tx=P.x+(hit?0:(Math.random()-.5)*2.5),ty=P.y+(hit?0:(Math.random()-.5)*2.5);
  LIFE.fx.push({k:'tracer',a:[c.x+Math.sin(c.h)*.6,1.32,c.y-Math.cos(c.h)*.6],b:[tx,1.1,ty],t:.06});
  if(hit)lfDamage(6+Math.random()*6,'shot');else spark(tx,.2,ty);
}
function busted(){
  LIFE.arrest=0;if(!COP.off.length)COP.off.push('assault');const had=WORDER.some(k=>k!=='fist'&&profile.inv[k]>0);
  for(const k of['bat','knife','pistol','smg'])profile.inv[k]=0;profile.inv.ammo={pistol:0,smg:0};LIFE.cur='fist';LIFE.copPeds=[];
  caught();$('#outTitle').textContent='Busted';if(had)$('#outText').textContent+=' Your weapons were confiscated.';
}
function lfOnEscape(){LIFE.copPeds=LIFE.copPeds.filter(c=>c.dead);LIFE.arrest=0;}

/* ---------- getting in and out of vehicles ---------- */
function exitVehicle(){
  if(FOOT.on||state!=='play')return;
  if(Math.abs(P.s)>2.5){toast('Slow down to get out','','exit',1200);return;}
  const pk={type:P.type,skin:P.skin,x:P.x,y:P.y,h:P.h,cond:P.cond,fuel:P.fuel};const pm=curModel();
  goFoot(null,true);FOOT.parked=pk;
  const lx=-Math.cos(pk.h),ly=-Math.sin(pk.h);let s=pm.wid/2+.6;P.x=pk.x+lx*s;P.y=pk.y+ly*s;if(inBuilding(P.x,P.y)){P.x=pk.x-lx*s;P.y=pk.y-ly*s;}
  P.h=pk.h;M4.model(P.M,P.x,0,P.y,-P.h,0,0);Snd.tone([520],.05,'square',.03);
}
function enterVehicle(ctx){
  let type,skin=null,x,y,h,cond=100,fuel=null;
  if(ctx.k==='own'){const pk=FOOT.parked;if(profile.seized&&!pk.skin){toast('Your licence is seized. Pay at the court first.','bad');return;}
    type=pk.type;skin=pk.skin;x=pk.x;y=pk.y;h=pk.h;cond=pk.cond??100;fuel=pk.fuel;FOOT.parked=null;}
  else if(ctx.k==='jack'){const a=ctx.a;const i=agents.indexOf(a);if(i<0)return;agents.splice(i,1);type=vehKeyFor(a.t.k);skin={model:a.model,k:a.t.k};x=a.x;y=a.y;h=a.h;
    cond=a.hp!=null?clamp(a.hp/1.6,15,100):100;fuel=30+Math.random()*50;if(!ctx.silent){ejectDriver(a);
    if(nearCop(90)||peds.some(p=>!p.dead&&Math.hypot(p.x-x,p.y-y)<18))crime('theft',1);}toast(`You took the ${VEH[type].sub.toLowerCase()}`,'');}
  else if(ctx.k==='pjack'){const c=ctx.c;const i=COP.list.indexOf(c);if(i<0)return;COP.list.splice(i,1);type='suv';skin={model:c.model,k:'police'};x=c.x;y=c.y;h=c.h;fuel=60;crime('cop',3);toast('You stole a Hoysala!','bad');}
  if(profile.seized&&ctx.k!=='own')crime('nolic',1);
  leaveFoot();P.type=type;P.skin=skin;P.x=x;P.y=y;P.h=h;P.s=0;P.vx=P.vy=0;P.cond=cond;if(fuel!=null)P.fuel=fuel;P.dry=false;P.broke=false;LIFE.z=0;
  const pm=curModel();P.len=pm.len;P.wid=pm.wid;M4.model(P.M,P.x,0,P.y,-P.h,0,0);CAM.yaw=P.h;
  Snd.startEngine(VEH[type].engine,type);Hap.tick();
}
function findContext(){
  if(!FOOT.on||FOOT.ride||FOOT.unload||METRO.ride)return null;
  const jc=jobContext();if(jc)return jc;if(FOOT.job&&FOOT.job.carry)return null;
  const pk=FOOT.parked;if(pk&&carDist(pk,4,1.6,P.x,P.y)<1.6)return {k:'own',label:'Get in'};
  let best=null,bd=1.8;
  for(const a of agents){if(a.t.k==='bus'&&a.v>1)continue;const d=carDist(a,a.t.len,a.t.wid,P.x,P.y);if(d<bd&&a.v<7){bd=d;best={k:'jack',a,label:a.t.two?'Take bike':a.t.k==='auto'?'Take auto':'Take car'};}}
  for(const c of COP.list){const d=carDist(c,4.55,1.86,P.x,P.y);if(d<bd&&c.v<3){bd=d;best={k:'pjack',c,label:'Steal Hoysala'};}}
  if(best)return best;
  const cc=cityContext();if(cc)return cc;
  for(const v of W.venues){if(Math.hypot(v.x-P.x,v.y-P.y)<4.5)return {k:'venue',v,label:v.kind==='gym'?'Work out':v.kind==='arms'?'Buy weapons':v.kind==='bar'?'Have a drink':'Eat & drink'};}
  return null;
}
function useContext(){const c=LIFE.ctx;if(!c||state!=='play')return;if(c.k==='venue')openVenue(c.v);else if(['metro','bus','askwork','park','jpick','jdrop'].includes(c.k))cityUse(c);else enterVehicle(c);}

/* ---------- venues: menus, gym, arms shop ---------- */
const MENUS={
  hotel:[['Idli vada',40,{hp:20,st:25}],['Masala dosa',70,{hp:35,st:40}],['Filter coffee',20,{st:25,boost:60}],['South Indian meals',120,{hp:100,st:100}],['Kesari bath',35,{hp:10,st:20}]],
  cafe:[['Cappuccino',160,{st:35,boost:90}],['Cold coffee',180,{st:45,boost:90}],['Veg sandwich',220,{hp:30,st:30}],['Brownie',150,{hp:15,st:20}]],
  juice:[['Fresh lime soda',40,{st:30}],['Tender coconut',50,{st:45,hp:10}],['Sprouts salad',60,{hp:20,maxst:4}],['Fruit bowl',70,{hp:25,maxst:3}],['Ragi malt',30,{st:25,maxst:2}]],
  bar:[['Draught beer',250,{hp:5,drunk:45}],['Whisky peg',350,{drunk:90}],['Masala peanuts',120,{hp:10}],['Fresh lime soda',80,{st:20}]],
  gym:[['Workout session · 10 reps on the beat',100,{gym:true}],['Protein shake',180,{hp:30,st:30}]],
  arms:[['Cricket bat',600,{wpn:'bat'}],['Knife',900,{wpn:'knife'}],['Pistol + 12 rounds',6000,{wpn:'pistol',ammo:['pistol',12]}],['Pistol ammo · 12 rounds',500,{ammo:['pistol',12]}],['SMG + 60 rounds',16000,{wpn:'smg',ammo:['smg',60]}],['SMG ammo · 60 rounds',1200,{ammo:['smg',60]}],['Body armour',2500,{armor:100}]]};
function effLabel(e){const o=[];if(e.hp)o.push(e.hp>=100?'full health':`+${e.hp} health`);if(e.st)o.push(`+${e.st} stamina`);if(e.maxst)o.push(`+${e.maxst} max stamina`);if(e.boost)o.push('faster recovery');if(e.drunk)o.push('makes you tipsy');if(e.armor)o.push('blocks bullets');if(e.gym)o.push('tap LIFT in the green zone · +8 max stamina, stronger punches');return o.join(' · ');}
function openVenue(v){
  state='venue';releaseAll();$('#vnTitle').textContent=v.name;
  $('#vnSub').textContent=v.kind==='bar'?`${VSUB[v.kind]} · Never drink and drive · Wallet ₹${fmtINR(profile.wallet)}`:`${VSUB[v.kind]} · Wallet ₹${fmtINR(profile.wallet)}`;
  const box=$('#vnItems');box.innerHTML='';
  for(const[name,price,e]of MENUS[v.kind]){
    const b=document.createElement('button');b.className='vitem';
    const own=e.wpn&&profile.inv[e.wpn]>0&&!e.ammo;
    b.innerHTML='<span class="n"></span><span class="e"></span><b></b>';b.querySelector('.n').textContent=name;b.querySelector('.e').textContent=effLabel(e)||(e.wpn?'Weapon':e.ammo?'Ammunition':'');b.querySelector('b').textContent=own?'Owned':'₹'+fmtINR(price);
    b.disabled=own||profile.wallet<price;
    b.addEventListener('click',()=>{if(profile.wallet<price)return;profile.wallet-=price;applyEffect(e,v);saveProfile();Snd.coin();if(state==='venue')openVenue(v);});
    box.appendChild(b);}
  show('venueScr');
}
function applyEffect(e,v){
  if(e.hp)LIFE.hp=Math.min(100,LIFE.hp+e.hp);if(e.st)FOOT.stam=Math.min(maxStam(),FOOT.stam+e.st);
  if(e.maxst)profile.fit.stam=Math.min(200,profile.fit.stam+e.maxst);if(e.boost)LIFE.boost=e.boost;if(e.drunk)LIFE.drunk=Math.min(240,LIFE.drunk+e.drunk);
  if(e.armor)profile.armor=Math.max(profile.armor,e.armor);
  if(e.wpn){profile.inv[e.wpn]=1;LIFE.cur=e.wpn;}if(e.ammo){profile.inv.ammo[e.ammo[0]]+=e.ammo[1];}
  if(e.gym){state='play';show('play');footHud(true);startGym();return;}
  toast(e.wpn?`Bought: ${WPN[e.wpn].name}`:e.ammo?'Ammo bought':e.armor?'Body armour on':e.drunk?'Cheers!':'Tasty!','good');
}
function gymDone(){profile.fit.stam=Math.min(200,profile.fit.stam+8);profile.fit.str=Math.min(2,+(profile.fit.str+.08).toFixed(2));FOOT.stam=Math.max(10,FOOT.stam-40);saveProfile();toast(`Workout done · max stamina ${profile.fit.stam} · strength ×${profile.fit.str.toFixed(2)}`,'gold');Hap.success();}
$('#vnClose').addEventListener('click',()=>{state='play';show('play');footHud(true);});

/* ---------- per-frame update ---------- */
let OBST=[];
function lifeUpdate(dt){
  if(state!=='play')return;
  const onFoot=FOOT.on&&!FOOT.ride;
  LIFE.atkT-=dt;LIFE.anim=Math.max(0,LIFE.anim-dt);LIFE.aimT=Math.max(0,LIFE.aimT-dt);LIFE.hurtT=Math.max(0,LIFE.hurtT-dt);LIFE.boost=Math.max(0,LIFE.boost-dt);
  if(LIFE.drunk>0){LIFE.drunk=Math.max(0,LIFE.drunk-dt);const k=Math.min(1,LIFE.drunk/40);P.h+=Math.sin(GT*1.3)*(onFoot?.5:.22)*k*dt;
    if(!FOOT.on&&Math.abs(P.s)>4&&nearCop(70)&&GT-LIFE.drunkSeen>20){LIFE.drunkSeen=GT;crime('drunk',1);toast('Cops spotted you driving drunk!','bad');}}
  /* jumping and attacking on foot */
  if(onFoot){
    if(input.jump&&LIFE.z<=0&&FOOT.stam>4){LIFE.vz=4.4;FOOT.stam-=4;input.jump=0;Snd.tone([300],.04,'triangle',.03);}
    if(LIFE.z>0||LIFE.vz>0){LIFE.z+=LIFE.vz*dt;LIFE.vz-=13*dt;if(LIFE.z<=0){LIFE.z=0;LIFE.vz=0;Hap.tick();}}
    if(input.atk&&LIFE.atkT<=0&&!FOOT.unload)doAttack();
    if(LIFE.z>0)M4.model(P.M,P.x,LIFE.z,P.y,-P.h,0,0);
  }else{LIFE.z=0;LIFE.vz=0;}
  /* nearby props, every so often */
  if((LIFE.nearT-=dt)<=0){LIFE.nearT=.35;const t=[];gQuery(W.prG||new Map(),P.x,P.y,110,t);LIFE.near=t;}
  for(const q of LIFE.near){
    if(q.moving){q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.vz-=12*dt;q.h+=q.spin*dt;q.pitch=Math.min(1.45,q.pitch+Math.abs(q.spin)*dt*.5);
      if(inBuilding(q.x,q.y)){q.vx*=-.3;q.vy*=-.3;q.x+=q.vx*dt*2;q.y+=q.vy*dt*2;}
      if(q.z<=0){q.z=0;q.vz=Math.abs(q.vz)>1.5?-q.vz*.3:0;q.vx*=.6;q.vy*=.6;q.spin*=.5;if(Math.hypot(q.vx,q.vy)<.3&&q.vz===0){q.moving=false;q.down=q.kind!=='crate';q.pitch=q.down?1.45:0;LIFE.propState.set(q.key,{x:q.x,y:q.y,h:q.h,down:q.down,pitch:q.pitch});}}
      continue;}
    const d=Math.hypot(q.x-P.x,q.y-P.y);
    if(!FOOT.on){if(d<P.wid*.5+.5&&Math.abs(P.s)>1.2){knockProp(q,P.vx*1.15+(q.x-P.x),P.vy*1.15+(q.y-P.y),2+Math.abs(P.s)*.15);Hap.pothole(.25);}}
    else if(!FOOT.ride&&d<.6&&!q.down&&LIFE.z<.5){const n=(d||.01);P.x=q.x+(P.x-q.x)/n*.6;P.y=q.y+(P.y-q.y)/n*.6;if(P.s>4)knockProp(q,P.vx*.8,P.vy*.8,1.5);}
  }
  /* pickups */
  for(let i=W.pick.length-1;i>=0;i--){const k=W.pick[i];if((LIFE.taken.get(k.key)||-1)>GT)continue;const d=Math.hypot(k.x-P.x,k.y-P.y);if(d>(FOOT.on?1.4:2.6)||FOOT.ride)continue;
    if(k.kind==='health'&&LIFE.hp>=100)continue;if(k.kind==='armor'&&profile.armor>=100)continue;
    if(k.kind==='health'){LIFE.hp=Math.min(100,LIFE.hp+40);toast('+40 health','good','pk',900);}
    else if(k.kind==='cash'){profile.wallet+=k.amt;session.fare+=k.amt;toast(`Picked up ₹${k.amt}`,'gold','pk',900);}
    else if(k.kind==='armor'){profile.armor=Math.min(100,profile.armor+50);toast('+50 armour','good','pk',900);}
    else if(k.kind==='ammo'){profile.inv.ammo.pistol+=12;toast(profile.inv.pistol?'+12 pistol rounds':'Pistol rounds (buy a pistol at an arms dealer)','good','pk',1400);}
    else if(k.kind==='bat'){if(profile.inv.bat){continue;}profile.inv.bat=1;toast('Picked up a cricket bat','good','pk',900);}
    Snd.chime();Hap.success();saveProfile();
    if(k.temp)W.pick.splice(i,1);else LIFE.taken.set(k.key,GT+90);}
  /* own parked vehicle and wrecks block your way on foot */
  if(FOOT.on&&!FOOT.ride){const pk=FOOT.parked;const push=(o,len,wid)=>{const d=carDist(o,len,wid,P.x,P.y);if(d<.32){const dx=P.x-o.x,dy=P.y-o.y,l=Math.hypot(dx,dy)||1;P.x+=dx/l*(.32-d);P.y+=dy/l*(.32-d);}};
    if(pk)push(pk,4,1.6);for(const w of LIFE.wrecks)push(w,w.model.len||4,w.model.wid||1.8);}
  /* ramming traffic damages it */
  if(!FOOT.on&&Math.abs(P.s)>6){for(const a of agents){const d=Math.hypot(a.x-P.x,a.y-P.y);if(d<(P.len+a.t.len)*.5&&a.stop>2.3&&!LIFE.ramT.get(a)){LIFE.ramT.set(a,1);hurtCar(a,Math.abs(P.s)*4,'ram');break;}}}
  /* wrecks burn out and get cleared */
  for(let i=LIFE.wrecks.length-1;i>=0;i--){const w=LIFE.wrecks[i];w.t+=dt;if(w.t>60||Math.hypot(w.x-P.x,w.y-P.y)>350)LIFE.wrecks.splice(i,1);}
  for(let i=LIFE.carts.length-1;i>=0;i--)if(Math.hypot(LIFE.carts[i].x-P.x,LIFE.carts[i].y-P.y)>260)LIFE.carts.splice(i,1);
  for(let i=LIFE.fx.length-1;i>=0;i--){LIFE.fx[i].t-=dt;if(LIFE.fx[i].t<=0)LIFE.fx.splice(i,1);}
  /* police: cars stop and constables get out when you are on foot */
  if(FOOT.on&&!FOOT.ride){for(const c of COP.list){if(!c.parked&&Math.hypot(c.x-P.x,c.y-P.y)<20){c.parked=true;c.v=0;for(const k of[-1,1])LIFE.copPeds.push(newCopPed(c.x+Math.cos(c.h)*k*1.6,c.y+Math.sin(c.h)*k*1.6));Snd.whistle();}}}
  else for(const c of COP.list)if(c.parked&&Math.hypot(c.x-P.x,c.y-P.y)>30){c.parked=false;LIFE.copPeds=LIFE.copPeds.filter(q=>q.dead||Math.hypot(q.x-c.x,q.y-c.y)>25);}
  updateCopPeds(dt);
  /* obstacles traffic must respect */
  OBST=[];if(FOOT.parked)OBST.push({x:FOOT.parked.x,y:FOOT.parked.y,len:4,wid:1.7});const R=FOOT.ride;if(R&&R.phase!=='ride')OBST.push({x:R.x,y:R.y,len:R.t.len,wid:R.t.wid});
  /* context button */
  if((LIFE.ctxT-=dt)<=0){LIFE.ctxT=.2;LIFE.ctx=findContext();}
  if((LIFE.saveT-=dt)<=0&&LIFE.saveT>-1){LIFE.saveT=-5;saveProfile();}
  cityUpdate(dt);
}

/* ---------- drawing ---------- */
function lifeRender(A,night,ex,ez){
  const PM=pickMeshes();
  /* wrecks */
  for(const w of LIFE.wrecks){if(Math.hypot(w.x-ex,w.y-ez)>200)continue;M4.model(TM,w.x,0,w.y,-w.h,0,0);drawLit(w.model.body,TM,{tint:[.22,.2,.19],emiK:0});
    if(w.t<w.fire){const f=.6+Math.sin(GT*23+w.x)*.25;DGr.bill(w.x,1.3,w.y,2.2*f,[1*f,.45*f,.1*f],CAM.right);DGr.bill(w.x,2.1,w.y,1.4*f,[.8*f,.3*f,.05*f],CAM.right);}}
  for(const c of LIFE.carts){if(Math.hypot(c.x-ex,c.y-ez)>160)continue;M4.model(TM,c.x,0,c.y,-c.h,0,0);drawLit(A.cart[c.c],TM);}
  /* your parked vehicle */
  const pk=FOOT.on?FOOT.parked:null;
  if(pk&&Math.hypot(pk.x-ex,pk.y-ez)<300){const m=pk.skin?pk.skin.model:playerModel(pk.type);M4.model(TM,pk.x,0,pk.y,-pk.h,0,0);drawLit(m.body,TM,{emiK:.5+night});if(m.glass)drawLit(m.glass,TM);
    if(pk.skin&&pk.skin.k==='police'&&m.decal)drawLit(m.decal.mesh,TM,{tex:hoysalaTex().tex,emTex:TEX.black});}
  /* police on foot */
  const sk=SKINS[2];
  for(const c of LIFE.copPeds){if(Math.hypot(c.x-ex,c.y-ez)>160)continue;
    if(c.dead||c.ko>0){M4.model(TM,c.x,.15,c.y,-c.fall,-Math.PI/2,0);drawLit(rig(COPLOOK,sk,'pose'),TM);continue;}
    const pn=c.aim>0?'aim':c.swing>0?'swing1':Math.hypot(P.x-c.x,P.y-c.y)>1.3?(c.pose?'run1':'run0'):'swing0';
    M4.model(TM,c.x,0,c.y,-c.h,0,0);drawLit(rig(COPLOOK,sk,pn,pn==='aim'?(COP.level>=5?'smg':'pistol'):(pn==='swing0'||pn==='swing1')?'bat':null),TM);}
  /* street props */
  for(const q of LIFE.near){M4.model(TM,q.x,q.z,q.y,-q.h,q.pitch?-q.pitch:0,0);drawLit(PM[q.kind],TM);}
  /* pickups: spinning holograms */
  for(const k of W.pick){if((LIFE.taken.get(k.key)||-1)>GT)continue;const d=Math.hypot(k.x-ex,k.y-ez);if(d>120)continue;
    const bob=.75+Math.sin(GT*3+k.x)*.12;M4.model(TM,k.x,bob,k.y,GT*2.2,0,0);
    const col=k.kind==='health'?[.2,1,.4]:k.kind==='cash'?[.6,1,.4]:k.kind==='armor'?[.3,.5,1]:[1,.8,.3];
    drawLit(PM[k.kind],TM,{emiAdd:col.map(v=>v*.35),noHL:true});DGr.bill(k.x,bob,k.y,1.3,col.map(v=>v*.55),CAM.right);DGr.bill(k.x,.05,k.y,.9,col.map(v=>v*.35),CAM.right);}
  /* muzzle flashes, tracers, sparks, explosions */
  for(const f of LIFE.fx){
    if(f.k==='tracer'){const n=10;for(let i=0;i<=n;i++){const t=i/n;DGr.bill(f.a[0]+(f.b[0]-f.a[0])*t,f.a[1]+(f.b[1]-f.a[1])*t,f.a[2]+(f.b[2]-f.a[2])*t,.09,[1,.85,.5],CAM.right);}}
    else if(f.k==='flash')DGr.bill(f.p[0],f.p[1],f.p[2],.7,[1,.8,.35],CAM.right);
    else if(f.k==='spark')DGr.bill(f.p[0],f.p[1],f.p[2],.35,f.c,CAM.right);
    else if(f.k==='boom'){const s=(.7-f.t)*9+1;DGr.bill(f.p[0],f.p[1],f.p[2],s,[1,.55,.15].map(v=>v*f.t*1.4),CAM.right);}}
  cityRender(A,night,ex,ez);
}
/* the player on foot */
function drawPlayerRig(M,pose,wk){drawLit(rig(PLOOK,SKINS[2],pose,wk),M);}

/* ---------- HUD and controls ---------- */
function lifeHud(){
  const onFoot=FOOT.on&&!FOOT.ride;
  $('#hpbar').style.width=LIFE.hp+'%';$('#arbar').style.width=profile.armor+'%';$('#hpTxt').textContent=Math.ceil(LIFE.hp)+(profile.armor>0?` · ${Math.ceil(profile.armor)} armour`:'');
  $('#hitfx').style.opacity=LIFE.hurtT>0?LIFE.hurtT*1.6:LIFE.hp<25?.25+Math.sin(GT*6)*.1:0;
  const w=WPN[LIFE.cur];$('#wpnChip').textContent=w.name+(w.gun?` · ${profile.inv.ammo[w.gun]||0}`:'');$('#wpnChip').hidden=!onFoot;
  const carry=!!(FOOT.job&&FOOT.job.carry);$('#btnAtk').hidden=!onFoot||carry||!!METRO.ride;$('#btnJump').hidden=!onFoot||carry||!!METRO.ride;$('#btnRun').hidden=!onFoot||carry||!!METRO.ride;$('#btnHorn').hidden=FOOT.on;$('#carry').hidden=!carry;if(carry)$('#carry').textContent='Carrying a sack · walk it over';$('#btnAtk').textContent=w.gun?'FIRE':'HIT';
  $('#btnExit').hidden=FOOT.on;
  const u=$('#btnUse');const c=onFoot?LIFE.ctx:null;u.hidden=!c;if(c&&u.textContent!==c.label)u.textContent=c.label;
  $('#drunkChip').hidden=LIFE.drunk<=0;
}
hold($('#btnAtk'),()=>{input.atk=1;if(LIFE.atkT<=0&&state==='play')doAttack();},()=>{input.atk=0;});
hold($('#btnJump'),()=>{input.jump=1;},()=>{});
$('#btnUse').addEventListener('click',useContext);
$('#btnExit').addEventListener('click',exitVehicle);
$('#wpnChip').addEventListener('click',()=>{cycleWeapon(false);Snd.tick();});
window.addEventListener('keydown',e=>{if(state!=='play'||e.repeat)return;const k=(e.key||'').toLowerCase();
  if(k==='f'||k==='j'){input.atk=1;if(LIFE.atkT<=0&&FOOT.on&&!FOOT.ride)doAttack();}
  else if(k==='x'){input.jump=1;}else if(k==='e'){if(FOOT.on)useContext();else exitVehicle();}else if(k==='q'||k==='tab'){e.preventDefault();cycleWeapon(false);}});
window.addEventListener('keyup',e=>{const k=(e.key||'').toLowerCase();if(k==='f'||k==='j')input.atk=0;});
Object.assign(window.__oosht||{},{HOARDS,W,COP,P,CAM,TT,trafficModel,hash2,nearestSeg,RANK,LIFE,WPN,doAttack,exitVehicle,enterVehicle,findContext,openVenue,lfDamage,useContext,cycleWeapon,peds:()=>peds,agentsL:()=>agents});
/* mechanic sheds, fuel totems and the court: boards fixed to the structures */
function drawFixedSigns(ex,ez,night){
  for(const g of W.garages){if(Math.hypot(g.sx-ex,g.sy-ez)>220)continue;const fx=Math.sin(g.h),fy=-Math.cos(g.h),rx=fy,ry=-fx;
    const s=makeSign('gar:'+g.name+g.sx.toFixed(1),(mb,fb)=>{const cx=g.sx+fx*2.25,cy=g.sy+fy*2.25;for(const k of[-1,1])fb.box(cx+rx*k*1.9,3.5,cy+ry*k*1.9,.08,.7,.08,[.3,.3,.32]);signFrame(fb,cx,cy,3.55,fx,fy,4.4,1.1,[.6,.1,.08]);signQuad(mb,cx,cy,3.55,fx,fy,4.4,1.1);});
    drawSignMesh(s,garageTex(g).tex,night);}
  for(const g of W.fuels){if(Math.hypot(g.sx-ex,g.sy-ez)>260)continue;
    const s=makeSign('fuel:'+g.name+g.sx.toFixed(1),(mb,fb)=>{const c=Math.cos(-g.h),s2=Math.sin(-g.h);const tx=g.sx-6.6*c-3.6*s2,ty=g.sy+6.6*s2-3.6*c;const nx=Math.cos(g.h),ny=Math.sin(g.h);
      signQuad(mb,tx+nx*.2,ty+ny*.2,5.95,nx,ny,2.6,1.3);signQuad(mb,tx-nx*.2,ty-ny*.2,5.95,-nx,-ny,2.6,1.3);});
    drawSignMesh(s,fuelTex(g).tex,night);}
  const c=W.court;if(c&&Math.hypot(c.sx-ex,c.sy-ez)<320){const fx=Math.sin(c.h),fy=-Math.cos(c.h);
    const s=makeSign('court'+c.sx.toFixed(1),(mb,fb)=>{signQuad(mb,c.sx+fx*3.85,c.sy+fy*3.85,8.85,fx,fy,9,1.8);});drawSignMesh(s,courtTex().tex,night);}
}
