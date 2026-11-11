/* ================= WISE CITY: joystick, quit & restart, posh areas, live weather and time, doors, interiors, eating ================= */
/* ---------- weather and time follow the real world: no manual settings ---------- */
for(let i=SETS.length-1;i>=0;i--)if(SETS[i][0]==='weather'||SETS[i][0]==='tod')SETS.splice(i,1);
settings.weather='auto';settings.tod='auto';
WX.real=null;WX.fetchT=0;
async function fetchWeather(){
  if(!currentLoc||currentLoc.demo||currentLoc.lat==null)return;
  try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${currentLoc.lat.toFixed(3)}&longitude=${currentLoc.lon.toFixed(3)}&current=weather_code,precipitation,cloud_cover`;
    const r=await fetch(u);if(!r.ok)return;const j=await r.json();const c=j.current||{};const code=c.weather_code|0;
    let rain=0;if(code>=51&&code<=57)rain=.35;else if(code>=61&&code<=67)rain=code>=65?.95:.7;else if(code>=80&&code<=82)rain=code===82?1:.75;else if(code>=95)rain=1;if(c.precipitation>0&&rain===0)rain=.4;
    const was=WX.real&&WX.real.rain>0;WX.real={rain,cloud:(c.cloud_cover||0)/100,code};if(rain>0&&!was)toast('It is raining here right now','');}catch(e){}
}
function seasonalRain(){const d=new Date(),m=d.getMonth()+1,h=d.getHours();const wet=m>=6&&m<=10?.45:m===5||m===11?.2:.05;const aft=h>=14&&h<=21?1:.35;return wet*aft;}
updateWeather=function(dt){
  if((WX.fetchT-=dt)<=0){WX.fetchT=900;fetchWeather();}
  if(WX.real)WX.target=WX.real.rain;
  else{WX.next-=dt;if(WX.next<=0){if(WX.target>0){WX.target=0;WX.next=400+Math.random()*500;}else if(Math.random()<seasonalRain()){WX.target=.5+Math.random()*.5;WX.next=120+Math.random()*200;}else WX.next=300;}}
  WX.rain+=clamp(WX.target-WX.rain,-dt/25,dt/18);WX.wet=clamp(WX.wet+(WX.rain>.15?dt/35:-dt/150),0,1);WX.flash=Math.max(0,WX.flash-dt*3);
  if(WX.rain>.7){WX.thunderT-=dt;if(WX.thunderT<=0){WX.thunderT=15+Math.random()*30;WX.flash=1;setTimeout(()=>{Snd.burst(1.8,90,.7,.6);Snd.burst(.9,200,1,.25);},700+Math.random()*1500);}}
  rainSound(state==='play'&&!INT.on?WX.rain:0);
};

/* ---------- posh neighbourhoods: Koramangala, MG Road / UB City, Indiranagar ---------- */
const POSH=[[12.9352,77.6245,1800],[12.9740,77.6080,1500],[12.9719,77.6412,1700],[12.9718,77.5960,700]];
function poshAt(x,y){if(!currentLoc||currentLoc.demo)return 0;let ll;try{ll=w2ll(x,y);}catch(e){return 0;}const lat=ll[0],lon=ll[1];let f=0;
  for(const[a,o,R]of POSH){const dy=(lat-a)*111320,dx=(lon-o)*111320*Math.cos(a*Math.PI/180);const d=Math.hypot(dx,dy);f=Math.max(f,clamp((R-d)/(R*.35),0,1));}return f;}
let GLT=null;function glassTex(){if(GLT)return GLT;const mk=(lit)=>{const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;const c=cv.getContext('2d');
  const g=c.createLinearGradient(0,0,S,S);g.addColorStop(0,lit?'#000':'#5F8FA8');g.addColorStop(.5,lit?'#000':'#9CC3D6');g.addColorStop(1,lit?'#000':'#3E6E88');c.fillStyle=g;c.fillRect(0,0,S,S);
  const r=mulberry32(lit?5:3);for(let y=0;y<4;y++)for(let x=0;x<4;x++){if(lit){if(r()<.45){c.fillStyle=r()<.5?'#FFE9B8':'#CFE8FF';c.fillRect(x*64+4,y*64+6,56,48);}}else{c.fillStyle=`rgba(255,255,255,${.05+r()*.12})`;c.fillRect(x*64+4,y*64+6,56,48);}}
  if(!lit){c.strokeStyle='#2F3A42';c.lineWidth=5;for(let k=0;k<=4;k++){c.beginPath();c.moveTo(k*64,0);c.lineTo(k*64,S);c.stroke();c.beginPath();c.moveTo(0,k*64);c.lineTo(S,k*64);c.stroke();}
    c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.moveTo(0,S*.8);c.lineTo(S*.8,0);c.lineTo(S,0);c.lineTo(0,S);c.fill();}
  return texFromCanvas(cv,true);};GLT={t:mk(false),e:mk(true)};return GLT;}

input.jx=input.jy=0;

/* ---------- quit and start over ---------- */
$('#wipeBtn').addEventListener('click',()=>show('quitScr'));
$('#qtNo').addEventListener('click',()=>show('pause'));
$('#qtYes').addEventListener('click',()=>{
  state='wiping';const keep={};try{for(const k of Object.keys(profile))delete profile[k];localStorage.removeItem('oosht.profile');}catch(e){}
  WIPED=true;location.reload();
});
var WIPED=false;

/* ---------- doors and gates on every building ---------- */
function doorOf(b){
  if(b.door!==undefined)return b.door;b.door=null;if(b.hide||b.area<10)return null;
  const ns=nearestSeg(b.cx,b.cy,90,s=>!s.w.br);if(!ns.seg)return null;const s=ns.seg;
  const t=clamp(((b.cx-s.ax)*(s.bx-s.ax)+(b.cy-s.ay)*(s.by-s.ay))/(s.len*s.len),0,1);const rx=s.ax+(s.bx-s.ax)*t,ry=s.ay+(s.by-s.ay)*t;
  const p=b.pts,n=p.length/2,ccw=polyArea(p)>0;let best=null,bs=-2;
  for(let i=0;i<n;i++){const j=(i+1)%n;const ax=p[2*i],ay=p[2*i+1],bx=p[2*j],by=p[2*j+1];const L=Math.hypot(bx-ax,by-ay);if(L<2.4)continue;const ex=(bx-ax)/L,ey=(by-ay)/L;const nx=ccw?ey:-ey,ny=ccw?-ex:ex;
    const mx=(ax+bx)/2,my=(ay+by)/2,vx=rx-mx,vy=ry-my,vl=Math.hypot(vx,vy)||1;const sc=(nx*vx+ny*vy)/vl-vl*.004;if(sc>bs){const tt=clamp((rx-ax)*ex+(ry-ay)*ey,1.1,L-1.1);bs=sc;best={x:ax+ex*tt,y:ay+ey*tt,nx,ny,L};}}
  if(best&&bs>.2&&!inBuilding(best.x+best.nx*1.2,best.y+best.ny*1.2)){best.quiet=RANK[s.w.cls]<=1&&Math.hypot(best.x-rx,best.y-ry)>s.w.hw+3.6;b.door=best;}return b.door;
}
function kindOf(b){
  if(b.ik)return b.ik;let k=null;
  for(const v of W.venues||[])if(v.wall&&v.wall.b===b){k={hotel:'restaurant',cafe:'cafe',juice:'shop',bar:'bar',gym:'gym',arms:'shop'}[v.kind];b.vname=v.name;break;}
  for(const s of PATROL.stations)if(s.wall&&s.wall.b===b){k='police';b.vname=s.name;}
  if(!k)for(const q of W.pois){if(q.x<b.minx||q.x>b.maxx||q.y<b.miny||q.y>b.maxy||!inPoly(q.x,q.y,b.pts))continue;
    k=/mall|department|supermarket/.test(q.sub)?'mall':/restaurant|fast_food|food_court|hotel/.test(q.sub)?'restaurant':q.sub==='cafe'?'cafe':/bar|pub|nightclub/.test(q.sub)?'bar':q.sub==='police'?'police':/office|company|bank|coworking/.test(q.sub)?'office':'shop';b.vname=q.name;break;}
  if(!k){const posh=poshAt(b.cx,b.cy);k=b.area>3500&&posh>.5?'mall':posh>.5&&b.h>14?'office':b.h>10?'apartment':'house';}
  b.ik=k;return k;
}
function doorsChunk(sol,inC,cx,cy){
  const bl=[];gQuery(W.bG,cx,cy,CH*.8,bl);
  for(const b of bl){if(!inC(b.cx,b.cy)||b.hide)continue;const d=doorOf(b);if(!d)continue;const k=kindOf(b);const posh=poshAt(b.cx,b.cy)>.5;
    sol.save();sol.tr(d.x+d.nx*.04,0,d.y+d.ny*.04);sol.rotY(-hAng(d.nx,d.ny));
    const glass=k==='mall'||k==='office'||k==='cafe'||k==='bar'||posh;
    if(glass){sol.box(0,1.25,0,2.2,2.5,.08,[.18,.22,.26],.15);sol.box(0,2.55,0,2.4,.1,.12,[.6,.6,.62]);for(const x of[-1.1,0,1.1])sol.box(x,1.25,-.02,.06,2.5,.1,[.55,.55,.57]);}
    else{sol.box(0,1.08,0,1.05,2.16,.08,k==='police'?[.15,.2,.35]:[.42,.26,.14]);sol.box(0,2.2,0,1.25,.1,.12,[.7,.68,.64]);sol.box(.36,1.05,-.06,.05,.05,.04,[.85,.75,.3]);}
    sol.box(0,.06,-.35,2,.12,.7,[.62,.6,.57]);
    if(k==='house'&&b.h<=9&&!b.kiosk&&d.quiet){const gz=-2.2;for(const x of[-1.6,1.6])sol.box(x,.8,gz,.36,1.6,.36,[.82,.8,.74]);
      for(let i=0;i<11;i++)sol.box(-1.38+i*.276,.75,gz,.03,1.3,.03,[.2,.22,.25]);sol.box(0,1.36,gz,2.86,.05,.05,[.2,.22,.25]);sol.box(0,.2,gz,2.86,.05,.05,[.2,.22,.25]);
      for(const s of[-1,1])sol.box(s*(1.78+1.2),.7,gz,2.4,1.4,.18,[.85,.83,.77]);}
    sol.restore();}
}

/* ---------- interiors ---------- */
const INT={on:false,b:null,kind:'',mesh:null,fan:null,door:null,f:[0,0],r:[0,0],W:8,D:10,H:3,obst:[],npcs:[],items:[],lights:[],tables:[],music:0,saved:null};
const IL=(ix,iz)=>[INT.door.x+INT.f[0]*iz+INT.r[0]*ix,INT.door.y+INT.f[1]*iz+INT.r[1]*ix];
function toLocal(x,y){const dx=x-INT.door.x,dy=y-INT.door.y;return [dx*INT.r[0]+dy*INT.r[1],dx*INT.f[0]+dy*INT.f[1]];}
function enterBuilding(b){
  const d=doorOf(b);if(!d)return;const k=kindOf(b);const posh=poshAt(b.cx,b.cy)>.5;
  INT.on=true;INT.b=b;INT.kind=k;INT.door=d;INT.f=[-d.nx,-d.ny];INT.r=[-INT.f[1],INT.f[0]];INT.obst=[];INT.npcs=[];INT.items=[];INT.lights=[];INT.tables=[];INT.posh=posh;
  INT.saved={x:P.x,y:P.y,h:P.h};const r=mulberry32(hash2(Math.round(b.cx),Math.round(b.cy))>>>0);
  const dims={house:[8,10,3],apartment:[11,9,4],shop:[7,9,3.2],restaurant:[12,12,3.4],cafe:[10,10,3.3],bar:[13,14,3.8],mall:[30,40,9],office:[14,12,3.2],police:[10,10,3.4],gym:[12,12,3.6]}[k]||[8,10,3];
  [INT.W,INT.D,INT.H]=dims;buildInterior(k,r,posh);
  const p=IL(0,1.2);P.x=p[0];P.y=p[1];P.h=hAng(INT.f[0],INT.f[1]);P.s=0;M4.model(P.M,P.x,0,P.y,-P.h,0,0);CAM.yaw=P.h;
  Snd.tone([700,880],.12,'sine',.04);toast(`Inside: ${({house:'a family home',apartment:'the apartment lobby',shop:'the shop',restaurant:'the restaurant',cafe:'the cafe',bar:'the bar',mall:'the mall',office:'the office',police:'the police station',gym:'the gym'})[k]}`,'');
}
function leaveBuilding(){if(!INT.on)return;const d=INT.door;INT.on=false;freeMesh(INT.mesh);freeMesh(INT.fan);INT.mesh=INT.fan=null;P.x=d.x+d.nx*1.6;P.y=d.y+d.ny*1.6;P.h=hAng(d.nx,d.ny);P.s=0;M4.model(P.M,P.x,0,P.y,-P.h,0,0);CAM.yaw=P.h;LIFE.eat=null;LIFE.seated=null;if(FOOT.on&&!FOOT.ride)$('#footBar').hidden=false;}
function buildInterior(k,r,posh){
  const mb=new MB(),fan=new MB();const{W:Wd,D,H}=INT;
  const put=(ix,iz,fn)=>{const p=IL(ix,iz);mb.save();mb.tr(p[0],0,p[1]);mb.rotY(-hAng(INT.f[0],INT.f[1]));fn(mb);mb.restore();};
  const obst=(ix,iz,rad)=>INT.obst.push([ix,iz,rad]);
  const wallC=k==='bar'?[.18,.14,.2]:k==='mall'||k==='office'?[.9,.9,.9]:k==='police'?[.82,.8,.68]:hexRGB(['#E8DCC4','#D7E6E0','#F0DCC8','#E6D3E8','#F3E6B8'][Math.floor(r()*5)]);
  const floorC=k==='bar'?[.12,.1,.1]:k==='mall'||posh?[.86,.85,.82]:k==='house'?[.78,.74,.66]:[.7,.68,.64];
  /* room shell: local z negative is deeper inside */
  put(0,0,m=>{m.box(0,-.05,-D/2,Wd,.1,D,floorC);m.box(0,H+.05,-D/2,Wd,.1,D,[.92,.92,.9]);
    m.box(-Wd/2-.05,H/2,-D/2,.1,H,D,wallC);m.box(Wd/2+.05,H/2,-D/2,.1,H,D,wallC);m.box(0,H/2,-D-.05,Wd,H,.1,wallC);
    m.box(-Wd/4-.6,H/2,.05,Wd/2-1.2,H,.1,wallC);m.box(Wd/4+.6,H/2,.05,Wd/2-1.2,H,.1,wallC);m.box(0,H-.4,.05,2.4,.8,.1,wallC);
    for(let i=1;i<6;i++)m.box(0,.002,-D*i/6,Wd,.004,.02,floorC.map(v=>v*.9));});
  const tableAt=(ix,iz,seats)=>{put(ix,iz,m=>{m.cyl(0,.73,0,.5,.04,'y',16,[.55,.38,.25]);m.cyl(0,.36,0,.06,.72,'y',8,[.3,.3,.3]);});obst(ix,iz,.6);
    const ch=[];for(let s=0;s<seats;s++){const a=s/seats*TAU;const cx=ix+Math.cos(a)*.85,cz=iz+Math.sin(a)*.85;put(cx,cz,m=>{m.box(0,.44,0,.42,.05,.42,[.45,.3,.2]);for(const x of[-.18,.18])for(const z of[-.18,.18])m.box(x,.22,z,.04,.44,.04,[.3,.2,.15]);});ch.push({ix:cx,iz:cz,face:hAng(ix-cx,-(iz-cz)),taken:false});}
    INT.tables.push({ix,iz,chairs:ch});};
  const shelf=(ix,iz,len,rot)=>{put(ix,iz,m=>{m.rotY(rot||0);m.box(0,1,0,len,2,.45,[.6,.6,.62]);for(let y=0;y<4;y++)for(let x=0;x<len/.3-1;x++){const c=[[.85,.2,.2],[.2,.5,.85],[.95,.75,.2],[.25,.7,.3],[.9,.9,.9]][Math.floor(r()*5)];m.box(-len/2+.25+x*.3,.3+y*.48,-.05,.22,.3,.3,c);}});};
  const npc=(ix,iz,look,pose,h,anim)=>INT.npcs.push({ix,iz,look,pose,h:h??0,anim});
  const L=i=>PED_LOOKS[i%PED_LOOKS.length];
  if(k==='house'){
    put(-2.6,-2.6,m=>{m.box(0,.25,0,2.2,.5,.9,[.45,.25,.25]);m.box(0,.7,.38,2.2,.5,.18,[.45,.25,.25]);for(const s of[-1,1])m.box(s*1.05,.45,0,.15,.4,.9,[.45,.25,.25]);});obst(-2.6,2.6,1.1);
    put(-2.6,-1,m=>{m.box(0,.3,0,1.6,.6,.4,[.35,.25,.18]);m.box(0,1.05,0,1.3,.75,.06,[.05,.05,.07],.9);});obst(-2.6,1,.8);
    put(-2.6,-2,m=>m.box(0,.01,0,2.4,.02,1.6,[.6,.2,.15]));
    tableAt(2,5.5,4);
    put(0,-D+.4,m=>{m.box(0,.45,0,4,.9,.6,[.75,.72,.68]);m.box(-1,.95,0,.6,.06,.4,[.15,.15,.15]);m.cyl(.4,1.0,0,.15,.12,'y',10,[.75,.75,.78]);m.box(1.5,.9,-.25,1,1.8,.1,[.85,.85,.85]);});obst(0,D-.4,.0);for(let x=-2;x<=2;x+=.8)obst(x,D-.4,.45);
    put(Wd/2-.4,-D+1.5,m=>{m.box(0,1.2,0,.5,.12,.9,[.6,.4,.2]);m.box(0,1.4,0,.12,.3,.12,[.9,.8,.3],.6);});INT.lights.push([Wd/2-.4,1.5,D-1.5,[1,.7,.3]]);
    put(-2.8,-7.6,m=>{m.box(0,.3,0,2,.5,2.2,[.85,.85,.9]);m.box(0,.6,1,2,.5,.2,[.4,.25,.2]);});obst(-2.8,7.6,1.2);
    put(-Wd/2+.4,-5.6,m=>{m.box(0,1,0,.6,2,1,[.6,.62,.65]);});obst(-Wd/2+.4,5.6,.6);
    fan.save();fan.box(0,0,0,1.4,.02,.14,[.85,.85,.85]);fan.box(0,0,0,.14,.02,1.4,[.85,.85,.85]);fan.restore();INT.fanAt=IL(0,4);
    npc(.8,8.6,L(3),'pose',0);npc(-2.6,2.6,L(6),'seat',Math.PI);npc(1.5,2.2,L(16),'walk0',1.2);
    INT.items.push({ix:-Wd/2+.9,iz:5.6,label:'Search the almirah',fn:()=>{const amt=Math.round(500+r()*4500);profile.wallet+=amt;saveProfile();toast(`Found ₹${fmtINR(amt)} in the almirah`,'gold');say('help','woman',true);crime('theft',2);INT.items=INT.items.filter(i=>i.label!=='Search the almirah');}},
      {ix:1.5,iz:D-1,label:'Grab a snack from the fridge',fn:()=>{LIFE.hp=Math.min(100,LIFE.hp+10);toast('+10 health','good');}},
      {ix:2,iz:4.6,label:'Sit at the table',fn:()=>sitAt(INT.tables[0])});
  }else if(k==='apartment'||k==='office'){
    put(0,-2.5,m=>{m.box(0,.55,0,3,1.1,.8,posh?[.2,.2,.22]:[.55,.4,.3]);});obst(0,2.5,1.5);npc(0,3.3,{shirt:'#2B3A55',pants:'#1E1E22',cap:'#1E1E22'},'pose',Math.PI);
    if(k==='apartment'){for(const x of[-2,2])put(x,-D+.08,m=>{m.box(0,1.2,0,1.4,2.4,.05,[.75,.76,.78],.1);m.box(0,2.6,0,.4,.2,.04,[1,.4,.2],1);});
      put(-Wd/2+1,-5,m=>{m.box(0,.25,0,.9,.5,2,[.3,.3,.35]);});obst(-Wd/2+1,5,1);put(Wd/2-.6,-1,m=>{m.cyl(0,.3,0,.3,.6,'y',10,[.6,.4,.3]);m.blob(0,1,0,.5,.6,.5,[.2,.5,.2]);});
      INT.items.push({ix:0,iz:D-.8,label:'Call the lift',fn:()=>toast('The lift is under maintenance. Use the stairs.','')});}
    else{for(let x=-4;x<=4;x+=4)for(let z=5;z<=10;z+=2.6){put(x,-z,m=>{m.box(0,.73,0,1.6,.05,.8,[.85,.85,.85]);m.box(0,1.05,-.25,.6,.4,.05,[.08,.1,.14],.9);m.box(0,.36,0,.06,.72,.06,[.3,.3,.3]);m.box(.85,.6,0,.05,1.2,.9,[.5,.55,.6]);});obst(x,z,.9);if(r()<.6)npc(x,z+.7,L(Math.floor(r()*3)),'seat',0);}
      INT.items.push({ix:Wd/2-1,iz:3,label:'Coffee machine',fn:()=>{FOOT.stam=Math.min(maxStam(),FOOT.stam+30);toast('Free office coffee · +30 stamina','good');}});}
  }else if(k==='shop'||k==='gym'){
    if(k==='shop'){shelf(-Wd/2+.4,-5,6,Math.PI/2);for(let z=3;z<=7;z+=2)obst(-Wd/2+.4,z,.5);shelf(Wd/2-.4,-5,6,Math.PI/2);for(let z=3;z<=7;z+=2)obst(Wd/2-.4,z,.5);shelf(0,-D+.5,Wd-1,0);}
    else{for(let i=0;i<4;i++){put(-3+i*2,-6,m=>{m.box(0,.25,0,.5,.5,1.4,[.15,.15,.15]);m.cyl(0,1.1,0,.03,1.6,'x',8,[.7,.7,.7]);m.cyl(-.8,1.1,0,.22,.1,'x',12,[.1,.1,.1]);m.cyl(.8,1.1,0,.22,.1,'x',12,[.1,.1,.1]);});obst(-3+i*2,6,.8);}npc(-1,7.5,L(9),'punch',0);}
    put(1.8,-2,m=>{m.box(0,.5,0,2.4,1,.7,[.55,.4,.3]);m.box(.7,1.15,0,.4,.3,.3,[.2,.2,.22]);});obst(1.8,2,1.3);npc(1.8,2.9,L(12),'pose',Math.PI);
    INT.items.push({ix:1.8,iz:1.2,label:k==='gym'?'Gym counter':'Shop counter',fn:()=>{const v=(W.venues||[]).find(v=>v.wall&&v.wall.b===INT.b);openVenue(v||{name:'Shop',kind:k==='gym'?'gym':'juice',x:P.x,y:P.y});}},
      {ix:1.2,iz:1.2,label:'Rob the till',fn:()=>robTill()});
    if(profile.inv.phones)INT.items.push({ix:2.6,iz:1.2,label:`Sell ${profile.inv.phones} phone${profile.inv.phones>1?'s':''}`,fn:sellPhones});
  }else if(k==='restaurant'||k==='cafe'){
    put(0,-D+.6,m=>{m.box(0,.55,0,Wd-3,1.1,.8,k==='cafe'?[.35,.25,.18]:[.7,.55,.35]);m.box(0,2.2,.45,3,.8,.04,[.1,.1,.1]);if(k==='cafe')m.box(1.5,1.3,0,.5,.5,.4,[.6,.6,.62]);});for(let x=-3;x<=3;x+=1.2)obst(x,D-.6,.55);
    INT.lights.push([0,2.6,D-.5,[1,.85,.5]]);npc(0,D-1.2,L(k==='cafe'?11:12),'pose',Math.PI);
    const n=k==='cafe'?4:6;for(let i=0;i<n;i++){const tx=(i%2?2.6:-2.6)+(k==='cafe'?0:(i%3-1)*0),tz=2.8+Math.floor(i/2)*2.8;tableAt(tx,tz,k==='cafe'?2:4);}
    for(const t of INT.tables)if(r()<.5){const c=t.chairs[0];c.taken=true;INT.npcs.push({ix:c.ix,iz:c.iz,look:L(Math.floor(r()*13)),pose:'eatT0',h:c.face,anim:'eat'});}
    INT.items.push({ix:0,iz:D-1.8,label:'See the menu',fn:()=>{const v=(W.venues||[]).find(v=>v.wall&&v.wall.b===INT.b);openVenue(v||{name:k==='cafe'?'Cafe':'Restaurant',kind:k==='cafe'?'cafe':'restaurant',x:P.x,y:P.y});}},{ix:-1,iz:D-1.8,label:'Rob the till',fn:()=>robTill()});
  }else if(k==='bar'){
    put(-Wd/2+1,-D/2,m=>{m.box(0,.55,0,1,1.1,D-4,[.25,.15,.1]);m.box(-.8,1.6,0,.3,2.2,D-4,[.15,.1,.08]);for(let i=0;i<14;i++){const c=[[.2,.6,.3],[.6,.3,.1],[.8,.8,.9],[.5,.1,.15]][i%4];m.cyl(-.8,1.4+(i%2)*.6,-((D-4)/2)+.4+i*.55,.05,.3,'y',8,c,null,.4,.4);}});
    for(let z=2.5;z<D-1.5;z+=.8)obst(-Wd/2+1,z,.55);
    for(const z of[3,5,7,9])put(-Wd/2+1.9,-z,m=>{m.cyl(0,.38,0,.2,.04,'y',10,[.8,.1,.2]);m.cyl(0,.2,0,.04,.4,'y',6,[.4,.4,.4]);});
    put(0,-.1,m=>{m.box(0,H-.2,-D/2,.08,.08,D-1,[1,.2,.6],1);m.box(Wd/2-.3,H-.2,-D/2,.08,.08,D-1,[.2,.6,1],1);});
    put(Wd/2-2,-D+1.5,m=>{m.box(0,.6,0,2,1.2,1,[.1,.1,.12]);m.box(0,1.25,0,.8,.1,.5,[.2,.2,.25]);});obst(Wd/2-2,D-1.5,1.2);
    tableAt(2,4,3);tableAt(2,7.5,3);INT.lights.push([Wd/2-2,2.2,D-1.5,[.9,.2,1]],[0,2.6,6,[.2,.5,1]]);
    npc(-Wd/2+.3,6,L(11),'pose',Math.PI/2);for(let i=0;i<5;i++)INT.npcs.push({ix:-1+r()*4,iz:8+r()*3,look:L(Math.floor(r()*13)),pose:'walk0',h:r()*TAU,anim:'dance'});
    INT.music=1;INT.items.push({ix:-Wd/2+2,iz:5,label:'Order at the bar',fn:()=>{const v=(W.venues||[]).find(v=>v.wall&&v.wall.b===INT.b);openVenue(v||{name:INT.posh?'Skyline Pub':'Bar',kind:'bar',x:P.x,y:P.y});}},{ix:0,iz:9.5,label:'Dance',fn:()=>{LIFE.dance=6;}});
  }else if(k==='mall'){
    for(const s of[-1,1])for(let z=4;z<D-4;z+=7){const c=hexRGB(['#C2185B','#1565C0','#2E7D32','#F9A825','#6A1B9A','#E64A19'][Math.floor(r()*6)]);put(s*(Wd/2-2),-z,m=>{m.box(0,2,0,4,4,5.5,[.3,.35,.4],.15);m.box(0,4.4,0,4.2,.8,5.7,c,.5);m.box(-s*2.02,1.6,0,.05,3,4,[.6,.75,.85],.25);});for(let k2=-2;k2<=2;k2+=2)obst(s*(Wd/2-2),z+k2,1.6);}
    put(0,-D/2,m=>{m.cyl(0,.35,0,2.2,.7,'y',20,[.75,.75,.78]);m.cyl(0,.72,0,2,.02,'y',20,[.3,.6,.9],null,.4,.4);m.cyl(0,1.3,0,.25,1.2,'y',10,[.8,.8,.82]);});obst(0,D/2,2.4);
    put(-4,-D/2-6,m=>{m.save();m.rotX(-.45);m.box(0,2.2,0,1.4,.2,9,[.6,.6,.62]);m.restore();});
    for(let i=0;i<4;i++)tableAt(-4+i*2.7,D-5,4);
    for(let i=0;i<12;i++)INT.npcs.push({ix:-8+r()*16,iz:5+r()*(D-12),look:L(Math.floor(r()*14)),pose:'walk0',h:r()*TAU,anim:'walk'});
    INT.items.push({ix:-(Wd/2-4.3),iz:4,label:'Clothing store · new outfit ₹1,500',fn:buyOutfit},{ix:0,iz:D-6.5,label:'Food court menu',fn:()=>openVenue({name:'Food Court',kind:'restaurant',x:P.x,y:P.y})},{ix:Wd/2-4.3,iz:4,label:'Mobile store · sell phones',fn:sellPhones});
  }else if(k==='police'){
    put(0,-3,m=>{m.box(0,.55,0,3.5,1.1,.8,[.35,.28,.2]);});obst(0,3,1.8);npc(0,3.8,COPLOOK,'pose',Math.PI);
    put(Wd/2-2,-D+1.5,m=>{for(let i=0;i<9;i++)m.cyl(-1.6+i*.4,1.4,1,.025,2.8,'y',6,[.35,.35,.38]);m.box(0,2.85,1,3.4,.1,.1,[.35,.35,.38]);});
    INT.items.push({ix:0,iz:2,label:'Front desk',fn:()=>{toast(profile.pending.length?`Constable: "Pay your ${profile.pending.length} challans at the District Magistrate Court."`:'Constable: "Yes? What do you want?"','');}});
  }
  INT.mesh=mb.mesh();INT.fan=fan.mesh();
}
function robTill(){const armed=WPN[LIFE.cur].gun||LIFE.cur==='knife';if(!armed&&Math.random()<.5){toast('The owner chased you off. Bring a weapon.','bad');lfDamage(8,'beaten');crime('assault',1);return;}
  const amt=Math.round((2000+Math.random()*6000)*(INT.posh?2:1));profile.wallet+=amt;saveProfile();toast(`Grabbed ₹${fmtINR(amt)} from the till!`,'gold');say('help','man',true);crime('robbery',3);INT.items=INT.items.filter(i=>i.label!=='Rob the till');}
function sellPhones(){const n=profile.inv.phones||0;if(!n){toast('No phones to sell','');return;}const v=profile.inv.phoneVal||n*2000;profile.wallet+=v;profile.inv.phones=0;profile.inv.phoneVal=0;saveProfile();toast(`Sold ${n} phone${n>1?'s':''} for ₹${fmtINR(v)} (no questions asked)`,'gold');Snd.coin();INT.items=INT.items.filter(i=>!/phones/.test(i.label));}
function buyOutfit(){if(profile.wallet<1500){toast('You need ₹1,500','bad');return;}profile.wallet-=1500;const sh=['#F5F5F5','#1E3A5F','#8E2430','#2F6B3A','#F2C14E','#5D4037','#7E57C2'],pa=['#1E1E22','#2B3A55','#C8B898','#3E3E3E','#4A5A7A'];
  PLOOK.shirt=sh[Math.floor(Math.random()*sh.length)];PLOOK.pants=pa[Math.floor(Math.random()*pa.length)];profile.look={shirt:PLOOK.shirt,pants:PLOOK.pants};saveProfile();toast('New clothes!','gold');}
function updateInterior(dt){
  if(LIFE.eat){updateEat(dt);return;}
  if(LIFE.dance>0){LIFE.dance-=dt;}
  const jm=Math.hypot(input.jx||0,input.jy||0);let sp=0;
  if(jm>.15){const tgt=(CAM.yaw??P.h)+Math.atan2(input.jx,input.jy);P.h+=angDiff(P.h,tgt)*Math.min(1,dt*10);sp=jm*(input.horn?4.5:2.2);}
  else{let st=(input.R?1:0)-(input.L?1:0);P.h+=st*2.4*dt;if(input.gas)sp=input.horn?4.5:2.2;}
  P.s+=clamp(sp-P.s,-10*dt,8*dt);const fx=Math.sin(P.h),fy=-Math.cos(P.h);let nx=P.x+fx*P.s*dt,ny=P.y+fy*P.s*dt;
  let[ix,iz]=toLocal(nx,ny);ix=clamp(ix,-INT.W/2+.35,INT.W/2-.35);iz=clamp(iz,.35,INT.D-.35);
  for(const o of INT.obst){const dx=ix-o[0],dz=iz-o[1],d=Math.hypot(dx,dz),rr=o[2]+.3;if(d<rr&&d>0){ix=o[0]+dx/d*rr;iz=o[1]+dz/d*rr;}}
  const w=IL(ix,iz);P.x=w[0];P.y=w[1];FOOT.pt+=dt*(P.s>.3?Math.min(P.s,4.5)/1.2:0);if(FOOT.pt>.33){FOOT.pt=0;FOOT.pose^=1;}M4.model(P.M,P.x,0,P.y,-P.h,0,0);
  for(const n of INT.npcs){if(n.anim==='walk'){n.t=(n.t||0)+dt;n.ix+=Math.sin(n.h)*1.1*dt;n.iz+=Math.cos(n.h)*1.1*dt;if(Math.abs(n.ix)>INT.W/2-4||n.iz<4||n.iz>INT.D-5)n.h+=Math.PI;n.pose=Math.floor(n.t*3)%2?'walk1':'walk0';}
    else if(n.anim==='dance'){n.t=(n.t||0)+dt;n.pose=['punch','swing0','kick','pose'][Math.floor(n.t*2.5+n.ix*3)&3];n.h+=dt*.6;}
    else if(n.anim==='eat'){n.t=(n.t||0)+dt;n.pose=Math.floor(n.t*1.2)%2?'eatT0':'eatT1';}}
  if(INT.music){INT.beat=(INT.beat||0)+dt;if(INT.beat>.5){INT.beat=0;Snd.tone([55],.12,'sine',.12);if(Math.random()<.5)Snd.burst(.05,6000,.8,.05);}}
}
function interiorContext(){
  if(!INT.on||LIFE.eat)return null;const[ix,iz]=toLocal(P.x,P.y);
  if(iz<1.1&&Math.abs(ix)<1.3)return {k:'exitb',label:'Go outside'};
  let best=null,bd=1.4;for(const it of INT.items){const d=Math.hypot(it.ix-ix,it.iz-iz);if(d<bd){bd=d;best={k:'item',it,label:it.label};}}
  if(!best)for(const t of INT.tables){if(Math.hypot(t.ix-ix,t.iz-iz)<1.5&&(INT.kind==='restaurant'||INT.kind==='cafe'||INT.kind==='mall'))return {k:'item',it:{fn:()=>{INT.seatPick=t;const v=(W.venues||[]).find(v=>v.wall&&v.wall.b===INT.b);openVenue(v||{name:INT.kind==='cafe'?'Cafe':'Restaurant',kind:INT.kind==='cafe'?'cafe':'restaurant',x:P.x,y:P.y});}},label:'Sit & order'};}
  return best;
}
function sitAt(t){const c=t&&t.chairs.find(c=>!c.taken);if(!c){toast('No free seat','');return null;}const w=IL(c.ix,c.iz);P.x=w[0];P.y=w[1];P.h=hAng(...(()=>{const tw=IL(t.ix,t.iz);return [tw[0]-w[0],tw[1]-w[1]];})());M4.model(P.M,P.x,0,P.y,-P.h,0,0);LIFE.seated={t,c};return c;}
function renderInterior(dt){
  const pm=FOOTPM;setupCamera(dt,P,FOOTV,pm);
  const[ix,iz]=toLocal(P.x,P.y);const back=CAM.mode==='cockpit'?-.15:2.6,up=CAM.mode==='far'?INT.H-.3:Math.min(INT.H-.35,2.1);
  const cy=CAM.mode==='cockpit'?P.h:CAM.yaw;let eix=ix-Math.sin(cy-hAng(INT.f[0],INT.f[1]))*back,eiz=iz-Math.cos(cy-hAng(INT.f[0],INT.f[1]))*back;
  eix=clamp(eix,-INT.W/2+.25,INT.W/2-.25);eiz=clamp(eiz,.25,INT.D-.25);const e=IL(eix,eiz),fw=[Math.sin(cy),-Math.cos(cy)];
  const eye=[e[0],CAM.mode==='cockpit'?1.6:up,e[1]],tgt=CAM.mode==='cockpit'?[P.x+fw[0]*4,1.5,P.y+fw[1]*4]:[P.x+fw[0]*1.2,1.2,P.y+fw[1]*1.2];
  CAM.eye=eye;CAM.tgt=tgt;M4.lookAt(CAM.view,eye,tgt,[0,1,0]);M4.mul(CAM.vp,CAM.proj,CAM.view);M4.invert(CAM.inv,CAM.vp);CAM.right=[CAM.view[0],0,CAM.view[8]];
  setFrameUniforms();
  const bar=INT.kind==='bar';FU.sunDir=[.25,.9,.35];FU.sunCol=bar?[.25,.2,.3]:[.62,.6,.56];FU.sky=bar?[.25,.2,.3]:[.62,.6,.58];FU.gnd=bar?[.12,.1,.12]:[.35,.33,.3];FU.fogCol=[.05,.05,.06];FU.fog=[80,200];FU.shOn=0;FU.wet=0;FU.night=bar?1:0;FU.hl=0;
  gl.viewport(0,0,glc.width,glc.height);gl.clearColor(.05,.05,.06,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);
  drawLit(INT.mesh,null,{emiK:1});
  if(INT.fanAt){M4.model(TM,INT.fanAt[0],INT.H-.25,INT.fanAt[1],GT*9,0,0);drawLit(INT.fan,TM);}
  for(const n of INT.npcs){const w=IL(n.ix,n.iz);M4.model(TM,w[0],0,w[1],-(hAng(INT.f[0],INT.f[1])+n.h),0,0);drawLit(rig(n.look,SKINS[1],n.pose),TM);}
  const eat=LIFE.eat;const pose=eat?(eat.seat?(Math.floor(eat.t*1.3)%2?'eatT0':'eatT1'):(Math.floor(eat.t*1.3)%2?'eatS0':'eatS1')):LIFE.dance>0?['punch','swing0','kick','pose'][Math.floor(GT*2.5)&3]:LIFE.seated?'seat':(P.s>.3?(FOOT.pose?'walk1':'walk0'):'pose');
  if(CAM.mode!=='cockpit')drawPlayerRig(P.M,pose,null);
  if(eat&&eat.seat){const tw=IL(eat.seat.t.ix,eat.seat.t.iz),pw=[P.x+(tw[0]-P.x)*.45,P.y+(tw[1]-P.y)*.45];M4.model(TM,pw[0],.76,pw[1],0,0,0);drawLit(plateMesh(eat.col),TM);}
  for(const t of INT.tables)for(const c of t.chairs)if(c.taken){const w=IL(c.ix+(t.ix-c.ix)*.45,c.iz+(t.iz-c.iz)*.45);M4.model(TM,w[0],.76,w[1],0,0,0);drawLit(plateMesh([.85,.6,.25]),TM);}
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);DGr.reset();
  for(const l of INT.lights){const w=IL(l[0],l[2]);const f=bar?.7+Math.sin(GT*6+l[0])*.3:1;DGr.bill(w[0],l[1],w[1],bar?2.2:1.4,l[3].map(v=>v*.5*f),CAM.right);}
  DGr.draw(0,1);DGr.reset();gl.depthMask(true);gl.disable(gl.BLEND);
}
const PLATES=new Map();function plateMesh(col){const k=col.join();let m=PLATES.get(k);if(m)return m;const mb=new MB();mb.cyl(0,0,0,.22,.02,'y',16,[.82,.84,.86]);mb.blob(-.05,.04,0,.1,.035,.08,col);mb.blob(.08,.035,.04,.05,.03,.05,[.95,.92,.85]);mb.blob(.07,.035,-.06,.05,.025,.05,[.75,.35,.1]);m=mb.mesh();PLATES.set(k,m);return m;}

/* ---------- local food menus, eating at the table or standing at the counter ---------- */
const FOODCOL={idli:[.95,.93,.88],dosa:[.85,.6,.25],rice:[.92,.85,.6],bath:[.95,.6,.2],chai:[.6,.4,.25],coffee:[.55,.35,.2],green:[.4,.65,.3],red:[.8,.3,.15],drink:[.85,.7,.2]};
MENUS.hotel=[['Idli vada (2 idli, 1 vada)',45,{hp:20,st:25,f:'idli'}],['Masala dosa',70,{hp:35,st:40,f:'dosa'}],['Rava idli',60,{hp:25,st:30,f:'idli'}],['Set dosa (3) with saagu',65,{hp:30,st:35,f:'dosa'}],['Kesari bath',40,{hp:12,st:20,f:'bath'}],['Khara bath',40,{hp:15,st:20,f:'bath'}],['Bisi bele bath',60,{hp:30,st:30,f:'bath'}],['Puliyogare',50,{hp:25,st:25,f:'rice'}],['Mini meals',110,{hp:60,st:60,f:'rice'}],['Filter coffee',25,{st:25,boost:60,f:'coffee',drink:1}]];
MENUS.restaurant=[['Full South Indian meals (banana leaf)',160,{hp:100,st:100,f:'rice'}],['Ghee roast dosa',120,{hp:40,st:45,f:'dosa'}],['Donne biryani (chicken)',220,{hp:70,st:60,f:'rice'}],['Ragi mudde with saaru',140,{hp:60,st:50,f:'idli'}],['Akki rotti with chutney',90,{hp:35,st:35,f:'dosa'}],['Neer dosa with chicken sukka',260,{hp:70,st:60,f:'dosa'}],['Kori rotti',240,{hp:65,st:55,f:'red'}],['Obbattu (holige)',50,{hp:15,st:25,f:'dosa'}],['Masala majjige (buttermilk)',35,{st:30,f:'drink',drink:1}]];
MENUS.cafe=[['Filter coffee (by-two)',40,{st:30,boost:90,f:'coffee',drink:1}],['Masala chai',30,{st:25,boost:60,f:'chai',drink:1}],['Bun maska',45,{hp:15,st:20,f:'bath'}],['Benne masala dosa',110,{hp:40,st:45,f:'dosa'}],['Mangalore buns',60,{hp:20,st:25,f:'dosa'}],['Veg puff',35,{hp:12,st:15,f:'bath'}],['Cold coffee',120,{st:45,boost:90,f:'coffee',drink:1}]];
MENUS.juice=[['Pani puri (6)',40,{hp:10,st:20,f:'green'}],['Masala puri',50,{hp:15,st:25,f:'bath'}],['Gobi manchurian',80,{hp:25,st:25,f:'red'}],['Mirchi bajji (2)',30,{hp:10,st:15,f:'bath'}],['Churumuri',40,{hp:12,st:20,f:'bath'}],['Sugarcane juice',30,{st:35,f:'green',drink:1}],['Tender coconut',50,{st:45,hp:10,f:'green',drink:1}],['Sprouts chaat',40,{hp:20,maxst:4,f:'green'}],['Ragi malt',25,{st:25,maxst:2,f:'chai',drink:1}]];
MENUS.bar=[['Draught beer (pint)',320,{hp:5,drunk:45,f:'drink',drink:1}],['Old Monk with Coke',280,{drunk:60,f:'chai',drink:1}],['Kingfisher (bottle)',220,{drunk:45,f:'drink',drink:1}],['Chicken kabab',240,{hp:30,st:25,f:'red'}],['Gobi pepper fry',180,{hp:20,st:20,f:'red'}],['Masala peanuts',120,{hp:10,f:'bath'}],['Fresh lime soda',90,{st:20,f:'green',drink:1}]];
VSUB.restaurant='Restaurant · Meals';VCOL.restaurant=['#8B1A1A','#FFE082'];
for(const k of['hotel','restaurant','cafe','bar','arms','gym','juice'])if(MENUS[k])MENUS[k].forEach(it=>{if(!it._base)it._base=it[1];});
const _openVenue=openVenue;
openVenue=function(v){const posh=poshAt(P.x,P.y)>.5||INT.posh;for(const k in MENUS)for(const it of MENUS[k]){if(it._base==null)it._base=it[1];it[1]=Math.round(it._base*(posh&&k!=='arms'?1.6:1)/5)*5;}_openVenue(v);$('#vnTitle').textContent=v.name+' · Menu';};
const _applyEffect=applyEffect;
applyEffect=function(e,v){
  if(e.f&&!e.wpn&&!e.ammo&&!e.armor&&!e.gym){startEat(e);return;}
  _applyEffect(e,v);
};
function startEat(e){
  state='play';show('play');footHud(true);const col=FOODCOL[e.f]||FOODCOL.rice;
  let seat=null;if(INT.on&&INT.tables.length){const t=INT.seatPick||INT.tables.reduce((b,t)=>{const[ix,iz]=toLocal(P.x,P.y);return Math.hypot(t.ix-ix,t.iz-iz)<Math.hypot(b.ix-ix,b.iz-iz)&&t.chairs.some(c=>!c.taken)?t:b;},INT.tables.find(t=>t.chairs.some(c=>!c.taken))||INT.tables[0]);const c=sitAt(t);if(c)seat={t,c};}
  INT.seatPick=null;LIFE.eat={t:0,dur:e.drink?4:7,e,col,seat};toast(e.drink?'Sipping…':'Eating…','',null,1500);
}
function updateEat(dt){const E=LIFE.eat;E.t+=dt;P.s=0;if(Math.floor(E.t*1.3)!==Math.floor((E.t-dt)*1.3)&&!E.e.drink)Snd.tone([180+Math.random()*60],.04,'triangle',.02);
  if(E.t>=E.dur){LIFE.eat=null;LIFE.seated=null;const e=E.e;if(e.hp)LIFE.hp=Math.min(100,LIFE.hp+e.hp);if(e.st)FOOT.stam=Math.min(maxStam(),FOOT.stam+e.st);if(e.maxst)profile.fit.stam=Math.min(200,profile.fit.stam+e.maxst);if(e.boost)LIFE.boost=e.boost;if(e.drunk)LIFE.drunk=Math.min(240,LIFE.drunk+e.drunk);
    saveProfile();toast(e.drink?'Refreshing!':'Tasty! '+[e.hp?`+${e.hp>=100?'full':e.hp} health`:'',e.st?`+${e.st} stamina`:''].filter(Boolean).join(' · '),'good');}}
/* the context of "go in" for any building with a door near you */
function doorContext(){
  if(INT.on)return interiorContext();
  const q=[];gQuery(W.bG,P.x,P.y,4,q);let best=null,bd=1.7;
  for(const b of q){const d=doorOf(b);if(!d)continue;const dd=Math.hypot(d.x+d.nx*.5-P.x,d.y+d.ny*.5-P.y);if(dd<bd){bd=dd;best=b;}}
  if(best){const k=kindOf(best);return {k:'enterb',b:best,label:'Enter '+({house:'house',apartment:'apartment',shop:'shop',restaurant:'restaurant',cafe:'cafe',bar:'bar',mall:'mall',office:'office',police:'police station',gym:'gym'}[k]||'building')};}
  return null;
}
Object.assign(window.__oosht||{},{INT,enterBuilding,leaveBuilding,doorOf,kindOf,poshAt,LIFEx:LIFE});
