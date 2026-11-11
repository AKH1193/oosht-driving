/* ================= WISE CITY: full-screen map, destination pin and road directions ================= */
const WP={on:false,x:0,y:0,pts:null,len:0,t:0,fromX:0,fromY:0,name:''};
const BM={cx:0,cy:0,s:.5,ptrs:new Map(),pinch:0,down:null,moved:0,dirty:true};
const bmc=$('#bigMap'),bmx=bmc.getContext('2d');

function openMap(){
  if(state!=='play')return;state='map';releaseAll();BM.cx=WP.on?(P.x+WP.x)/2:P.x;BM.cy=WP.on?(P.y+WP.y)/2:P.y;
  BM.s=WP.on?clamp(Math.min(innerWidth,innerHeight)*.7/Math.max(80,Math.hypot(WP.x-P.x,WP.y-P.y)),.08,3):.6;
  show('mapScr');mapInfo();BM.dirty=true;drawBigMap();}
function closeMap(){state='play';show('play');if(FOOT.on&&!FOOT.ride)footHud(true);else if(!FOOT.on&&!FLY.on)Snd.startEngine(VEH[P.type].engine,P.type);BM.ptrs.clear();}
$('#mini').addEventListener('click',openMap);
$('#mapClose').addEventListener('click',closeMap);
$('#mapClear').addEventListener('click',()=>{clearPin();mapInfo();BM.dirty=true;});
$('#mapMe').addEventListener('click',()=>{BM.cx=P.x;BM.cy=P.y;BM.dirty=true;});
$('#mapZin').addEventListener('click',()=>{BM.s=clamp(BM.s*1.5,.05,6);BM.dirty=true;});
$('#mapZout').addEventListener('click',()=>{BM.s=clamp(BM.s/1.5,.05,6);BM.dirty=true;});
window.addEventListener('keydown',e=>{if((e.key==='m'||e.key==='M')&&!e.repeat){if(state==='play')openMap();else if(state==='map')closeMap();}});

const toWorld=(sx,sy)=>{const r=bmc.getBoundingClientRect();return [BM.cx+(sx-r.left-r.width/2)/BM.s,BM.cy+(sy-r.top-r.height/2)/BM.s];};
bmc.addEventListener('pointerdown',e=>{e.preventDefault();try{bmc.setPointerCapture(e.pointerId);}catch(_){}BM.ptrs.set(e.pointerId,[e.clientX,e.clientY]);
  if(BM.ptrs.size===1){BM.down=[e.clientX,e.clientY];BM.moved=0;}else{const p=[...BM.ptrs.values()];BM.pinch=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);BM.moved=99;}});
bmc.addEventListener('pointermove',e=>{const old=BM.ptrs.get(e.pointerId);if(!old)return;const nw=[e.clientX,e.clientY];BM.ptrs.set(e.pointerId,nw);
  if(BM.ptrs.size===1){BM.cx-=(nw[0]-old[0])/BM.s;BM.cy-=(nw[1]-old[1])/BM.s;BM.moved+=Math.abs(nw[0]-old[0])+Math.abs(nw[1]-old[1]);}
  else{const p=[...BM.ptrs.values()];const d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(BM.pinch>0)BM.s=clamp(BM.s*d/BM.pinch,.05,6);BM.pinch=d;}
  BM.dirty=true;});
const bmUp=e=>{if(!BM.ptrs.has(e.pointerId))return;BM.ptrs.delete(e.pointerId);
  if(!BM.ptrs.size&&BM.moved<10&&BM.down){const w=toWorld(BM.down[0],BM.down[1]);setPin(w[0],w[1]);}if(!BM.ptrs.size)BM.down=null;};
bmc.addEventListener('pointerup',bmUp);bmc.addEventListener('pointercancel',bmUp);
bmc.addEventListener('wheel',e=>{e.preventDefault();BM.s=clamp(BM.s*(e.deltaY<0?1.15:1/1.15),.05,6);BM.dirty=true;},{passive:false});

/* ---------- the pin and its route ---------- */
function pinName(x,y){const n=nearestSeg(x,y,60);if(n.seg&&n.seg.w.name)return n.seg.w.name;let nm=null,bd=1500;for(const pl of W.places){const d=Math.hypot(pl.x-x,pl.y-y);if(d<bd){bd=d;nm=pl.name;}}return nm||'Dropped pin';}
function setPin(x,y){
  const n=nearestSeg(x,y,150,s=>!s.w.br);if(n.seg){const s=n.seg;const t=clamp(((x-s.ax)*(s.bx-s.ax)+(y-s.ay)*(s.by-s.ay))/(s.len*s.len),0,1);x=s.ax+(s.bx-s.ax)*t;y=s.ay+(s.by-s.ay)*t;}
  Object.assign(WP,{on:true,x,y,pts:null,len:0,t:0,name:pinName(x,y)});routePin();mapInfo();BM.dirty=true;Snd.tick&&Snd.tick();}
function clearPin(){WP.on=false;WP.pts=null;$('#wpChip').hidden=true;}
function routePin(){
  if(!WP.on)return;WP.fromX=P.x;WP.fromY=P.y;WP.t=0;
  const a=nodeNear(P.x,P.y),b=nodeNear(WP.x,WP.y);let pts=null;try{pts=a!=null&&b!=null?findPath(a,b):null;}catch(e){pts=null;}
  if(pts&&pts.length){pts=[[P.x,P.y],...pts,[WP.x,WP.y]];}else pts=[[P.x,P.y],[WP.x,WP.y]];
  let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);WP.pts=pts;WP.len=L;}
const fmD=d=>d<1000?Math.round(d/10)*10+' m':(d/1000).toFixed(1)+' km';
function mapInfo(){$('#mapTitle').textContent=WP.on?WP.name:'Map';$('#mapInfo').textContent=WP.on?`${fmD(WP.len)} by road · follow the purple line`:'Tap anywhere to drop a pin · drag to move · pinch to zoom';}
/* remaining distance along the route, and re-route when you stray */
function updateWaypoint(dt){
  if(!WP.on)return;const d=Math.hypot(WP.x-P.x,WP.y-P.y);
  if(d<14){toast(`You have arrived · ${WP.name}`,'good');Snd.chime();clearPin();return;}
  WP.t+=dt;if(WP.t>4||Math.hypot(P.x-WP.fromX,P.y-WP.fromY)>40){let off=1e9;const p=WP.pts||[];for(let i=1;i<p.length;i++)off=Math.min(off,segDistXY(P.x,P.y,p[i-1][0],p[i-1][1],p[i][0],p[i][1]));if(off>18||WP.t>4)routePin();}
  /* trim the part already driven */
  const p=WP.pts;if(p&&p.length>2){let bi=0,bd=1e9;for(let i=1;i<p.length;i++){const q=segDistXY(P.x,P.y,p[i-1][0],p[i-1][1],p[i][0],p[i][1]);if(q<bd){bd=q;bi=i;}}if(bi>1&&bd<15){p.splice(1,bi-1);}p[0]=[P.x,P.y];
    let L=0;for(let i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);WP.len=L;}
  const c=$('#wpChip');c.hidden=false;const t=`📍 ${WP.name} · ${fmD(WP.len)}`;if(c.textContent!==t)c.textContent=t;
}
function drawRoute(m,lw){const p=WP.pts;if(!p||p.length<2)return;m.lineJoin='round';m.lineCap='round';
  m.strokeStyle='rgba(20,0,40,.6)';m.lineWidth=lw*1.6;m.beginPath();m.moveTo(p[0][0],p[0][1]);for(const q of p)m.lineTo(q[0],q[1]);m.stroke();
  m.strokeStyle='#B06CFF';m.lineWidth=lw;m.beginPath();m.moveTo(p[0][0],p[0][1]);for(const q of p)m.lineTo(q[0],q[1]);m.stroke();}
function pinGlyph(m,x,y,sc,rot){m.save();m.translate(x,y);if(rot)m.rotate(rot);m.scale(sc,sc);m.fillStyle='#B06CFF';m.strokeStyle='#FFF';m.lineWidth=2;
  m.beginPath();m.moveTo(0,0);m.bezierCurveTo(-4,-8,-11,-12,-11,-20);m.arc(0,-20,11,Math.PI,0);m.bezierCurveTo(11,-12,4,-8,0,0);m.fill();m.stroke();m.fillStyle='#FFF';m.beginPath();m.arc(0,-20,4,0,TAU);m.fill();m.restore();}

/* hooks: minimap route, edge arrow, beam in the world */
{const _fm=footMini;footMini=function(m,R){_fm(m,R);if(WP.on){drawRoute(m,9);pinGlyph(m,WP.x,WP.y,2.4,P.h);}};
 const _fa=footArrows;footArrows=function(arrow){_fa(arrow);if(WP.on)arrow(WP.x,WP.y,'#B06CFF');};
 const _fb=drawFootBeams;drawFootBeams=function(ex,ez){_fb(ex,ez);if(WP.on){const d=Math.hypot(WP.x-ex,WP.y-ez);drawSprite(beamTex().tex,WP.x,0,WP.y,3.4+d*.012,60,[.7,.42,1]);}};}

/* ---------- drawing the big map ---------- */
const MAPC={water:'#1F4E79',park:'#1E4D2B',wood:'#1A4426',field:'#3D4A24',runway:'#3A3A3E',taxiway:'#444449',apron:'#55565A'};
function drawBigMap(){
  requestAnimationFrame(drawBigMap);if(state!=='map'){return;}
  const dpr=Math.min(2,devicePixelRatio||1),w=Math.round(bmc.clientWidth*dpr),h=Math.round(bmc.clientHeight*dpr);
  if(bmc.width!==w||bmc.height!==h){bmc.width=w;bmc.height=h;BM.dirty=true;}
  if(!BM.dirty&&(GT*2|0)%2===BM.blink)return;BM.dirty=false;BM.blink=(GT*2|0)%2;
  const m=bmx,s=BM.s*dpr;m.setTransform(1,0,0,1,0,0);m.fillStyle='#141B24';m.fillRect(0,0,w,h);
  m.setTransform(s,0,0,s,w/2-BM.cx*s,h/2-BM.cy*s);
  const vx0=BM.cx-w/2/s,vx1=BM.cx+w/2/s,vy0=BM.cy-h/2/s,vy1=BM.cy+h/2/s;const vis=(x0,y0,x1,y1)=>x1>=vx0&&x0<=vx1&&y1>=vy0&&y0<=vy1;
  for(const a of W.areas){const c=MAPC[a.kind];if(!c)continue;const p=a.pts;m.fillStyle=c;m.beginPath();m.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)m.lineTo(p[i],p[i+1]);m.closePath();m.fill();}
  if(s>.25){m.fillStyle='#2A3340';for(const b of W.bld){if(b.hide||!vis(b.minx,b.miny,b.maxx,b.maxy))continue;const p=b.pts;m.beginPath();m.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)m.lineTo(p[i],p[i+1]);m.closePath();m.fill();}}
  m.lineCap='round';m.lineJoin='round';
  for(const k of ORDER){const major=RANK[k]>=3;m.strokeStyle=major?'#E7D9A6':k==='tertiary'?'#C3C7CC':'#8A929B';m.lineWidth=Math.max(HW[k]*2,(major?3.2:1.6)/s*dpr);m.beginPath();
    for(const wy of W.ways){if(wy.cls!==k)continue;const p=wy.pts;m.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)m.lineTo(p[i],p[i+1]);}m.stroke();}
  if(METRO.lines)for(const l of METRO.lines){m.strokeStyle=(l.col&&l.col[0])||'#7B2D8E';m.globalAlpha=.85;m.lineWidth=4/s*dpr;m.setLineDash([12/s*dpr,8/s*dpr]);m.beginPath();const p=l.pts;m.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)m.lineTo(p[i],p[i+1]);m.stroke();m.setLineDash([]);m.globalAlpha=1;}
  if(WP.on)drawRoute(m,7/s*dpr);
  const k=dpr/s;const dot=(x,y,col,r,txt)=>{m.fillStyle=col;m.beginPath();m.arc(x,y,r*k,0,TAU);m.fill();if(txt){m.fillStyle='#FFF';m.font=`800 ${r*1.3*k}px Arial`;m.textAlign='center';m.textBaseline='middle';m.fillText(txt,x,y+.5*k);}};
  for(const g of W.fuels)dot(g.x,g.y,'#4FC3F7',7,'⛽');for(const g of W.garages)dot(g.x,g.y,'#53D68E',7,'🔧');
  for(const st of METRO.stations||[])dot(st.x,st.y,'#7B2D8E',8,'M');
  for(const s2 of PATROL.stations)dot(s2.x,s2.y,'#0D2B5E',9,'P');
  for(const a of agents)if(a.patrol)dot(a.x,a.y,'#1E5BD6',7,'P');for(const c of COP.list)dot(c.x,c.y,'#E53935',8,'P');
  if(W.court)dot(W.court.x,W.court.y,'#E53935',9,'⚖');if(AIR.runways.length)for(const r of AIR.runways.slice(0,2))dot((r.ax+r.bx)/2,(r.ay+r.by)/2,'#455A64',10,'✈');
  if(FOOT.parked)dot(FOOT.parked.x,FOOT.parked.y,'#FFC72C',7,'🚗');
  if(WP.on)pinGlyph(m,WP.x,WP.y,1.3*k,0);
  /* you */
  m.save();m.translate(P.x,P.y);m.rotate(P.h);m.scale(k,k);m.fillStyle='#FFF';m.strokeStyle='#0D1116';m.lineWidth=2;m.beginPath();m.moveTo(0,-13);m.lineTo(-9,9);m.lineTo(0,4);m.lineTo(9,9);m.closePath();m.fill();m.stroke();m.restore();
  /* scale bar */
  m.setTransform(1,0,0,1,0,0);const mpx=1/s,target=120*dpr*mpx;const nice=[10,20,50,100,200,500,1000,2000,5000].find(v=>v>=target*.6)||5000;const bl=nice/mpx;
  m.fillStyle='rgba(13,17,22,.75)';m.fillRect(14*dpr,h-38*dpr,bl+20*dpr,26*dpr);m.fillStyle='#FFF';m.fillRect(24*dpr,h-22*dpr,bl,3*dpr);m.font=`700 ${11*dpr}px Arial`;m.textAlign='left';m.fillText(nice>=1000?nice/1000+' km':nice+' m',24*dpr,h-26*dpr);
}
requestAnimationFrame(drawBigMap);
{const _ls=lifeUpdate;lifeUpdate=function(dt){_ls(dt);if(state==='play')updateWaypoint(dt);};}
Object.assign(window.__oosht||{},{WP,openMap,closeMap,setPin,clearPin,BM});
