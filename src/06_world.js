/* ================= world: road graph, hazards, signals, garages ================= */
const HW={motorway:9,trunk:8.5,primary:7.5,secondary:6.5,tertiary:5.5,unclassified:4.4,residential:4.2,living_street:3.4,service:3};
const RANK={motorway:6,trunk:5,primary:4,secondary:3,tertiary:2,unclassified:1,residential:1,living_street:0,service:0};
const LIMIT={motorway:100,trunk:80,primary:60,secondary:50,tertiary:50,unclassified:40,residential:30,living_street:20,service:20};
const BCOL=['#EDE6D6','#F2D7B6','#D9E4DA','#DDE3EA','#EBCFCF','#E2D9EC','#F3E3A9','#CFC7BB','#E8E4DC','#BFD0D6','#F4F1EA','#E9C9A8','#F0B8A0','#C9DCC0'];
const GARAGE_NAMES=['Sri Manjunatha Auto Works','Lakshmi Puncture Shop','Balaji Two Wheeler Service','Sri Ganesh Motors','Annappa Garage','Venkateshwara Auto Repairs','Raju Mechanic Shed','Basava Auto Garage','Maruthi Service Point','Chamundi Motor Works'];
const W={ways:[],segs:[],nodes:new Map(),sG:new Map(),bld:[],bG:new Map(),areas:[],hz:[],hG:new Map(),sigs:[],sigG:new Map(),garages:[],pois:[],pG:new Map(),places:[],tG:new Map(),
  source:'demo',label:'',bounds:{x0:-1,y0:-1,x1:1,y1:1},version:0,realSignals:null,center:{x:0,y:0},radius:1300};
const hAng=(dx,dy)=>Math.atan2(dx,-dy); /* heading angle of a 2D direction (0 = north) */

function buildWorld(data){
  W.version++;
  W.ways=[];W.segs=[];W.nodes=new Map();W.sG=new Map();W.bld=[];W.bG=new Map();W.areas=data.areas||[];W.hz=[];W.hG=new Map();
  W.sigs=[];W.sigG=new Map();W.garages=[];W.pois=[];W.pG=new Map();W.places=data.places||[];W.tG=new Map();
  let bx0=1e9,by0=1e9,bx1=-1e9,by1=-1e9;
  const roads=data.roads.filter(r=>r.pts.length>=4);
  /* connect dangling ends that stop on another road (tiles drop some shared points) */
  const cnt=new Map();for(const r of roads)for(const k of r.keys)cnt.set(k,(cnt.get(k)||0)+1);
  const tmpG=new Map();
  roads.forEach((r,ri)=>{for(let i=0;i<r.pts.length/2-1;i++){const ax=r.pts[2*i],ay=r.pts[2*i+1],bx=r.pts[2*i+2],by=r.pts[2*i+3];gAddBox(tmpG,Math.min(ax,bx)-2,Math.min(ay,by)-2,Math.max(ax,bx)+2,Math.max(ay,by)+2,{ri,i,_q:0});}});
  const inserts=[];const tmpA=[];
  roads.forEach((r,ri)=>{const n=r.pts.length/2;for(const e of[0,n-1]){const k=r.keys[e];if(cnt.get(k)>1)continue;const x=r.pts[2*e],y=r.pts[2*e+1];
    gQuery(tmpG,x,y,2,tmpA);let best=null,bd=1.8;
    for(const s of tmpA){if(s.ri===ri)continue;const o=roads[s.ri];if((o.br||0)!==(r.br||0))continue;const ax=o.pts[2*s.i],ay=o.pts[2*s.i+1],bx=o.pts[2*s.i+2],by=o.pts[2*s.i+3];const d=segDistXY(x,y,ax,ay,bx,by);if(d<bd){bd=d;best=s;}}
    if(best){const o=roads[best.ri];const ax=o.pts[2*best.i],ay=o.pts[2*best.i+1],bx=o.pts[2*best.i+2],by=o.pts[2*best.i+3];const L2=(bx-ax)**2+(by-ay)**2||1;const t=clamp(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/L2,0,1);
      if(t<.02){r.keys[e]=o.keys[best.i];}else if(t>.98){r.keys[e]=o.keys[best.i+1];}else inserts.push({ri:best.ri,i:best.i,t,x:ax+(bx-ax)*t,y:ay+(by-ay)*t,k});cnt.set(k,2);}}});
  const byRoad=new Map();for(const ins of inserts){let a=byRoad.get(ins.ri);if(!a){a=[];byRoad.set(ins.ri,a);}a.push(ins);}
  for(const[ri,list]of byRoad){const r=roads[ri];list.sort((a,b)=>b.i-a.i||b.t-a.t);for(const ins of list){r.pts.splice(2*ins.i+2,0,ins.x,ins.y);r.keys.splice(ins.i+1,0,ins.k);}}
  /* names from label lines when roads carry none (vector tiles) */
  let nameG=null;
  if(data.names&&data.names.length){nameG=new Map();for(const n of data.names)for(let i=0;i<n.pts.length/2-1;i++){const ax=n.pts[2*i],ay=n.pts[2*i+1],bx=n.pts[2*i+2],by=n.pts[2*i+3];gAddBox(nameG,Math.min(ax,bx)-15,Math.min(ay,by)-15,Math.max(ax,bx)+15,Math.max(ay,by)+15,{n:n.name,ax,ay,bx,by,_q:0});}}
  for(const r of roads){
    const w={name:r.name||'',cls:r.cls,oneway:!!r.oneway,rev:!!r.rev,pts:r.pts,nodes:r.keys,hw:HW[r.cls]||4,br:r.br||0};
    w.major=RANK[w.cls]>=3;w.limit=LIMIT[w.cls]||40;
    if(!w.name&&nameG){let best=null,bd=14;const n=w.pts.length/2;let li=0,ll=0;for(let i=0;i<n-1;i++){const l=Math.hypot(w.pts[2*i+2]-w.pts[2*i],w.pts[2*i+3]-w.pts[2*i+1]);if(l>ll){ll=l;li=i;}}
      const mx=(w.pts[2*li]+w.pts[2*li+2])/2,my=(w.pts[2*li+1]+w.pts[2*li+3])/2,wa=Math.atan2(w.pts[2*li+3]-w.pts[2*li+1],w.pts[2*li+2]-w.pts[2*li]);
      gQuery(nameG,mx,my,15,tmpA);for(const s of tmpA){const d=segDistXY(mx,my,s.ax,s.ay,s.bx,s.by);let da=Math.abs(angDiff(wa,Math.atan2(s.by-s.ay,s.bx-s.ax)));if(da>Math.PI/2)da=Math.PI-da;if(da<.5&&d<bd){bd=d;best=s.n;}}
      if(best)w.name=best;}
    W.ways.push(w);
    const n=w.pts.length/2;
    for(let k=0;k<n;k++){const id=w.nodes[k];let l=W.nodes.get(id);if(!l){l=[];W.nodes.set(id,l);}l.push({w,k});}
    for(let i=0;i<n-1;i++){
      const ax=w.pts[2*i],ay=w.pts[2*i+1],bx=w.pts[2*i+2],by=w.pts[2*i+3];
      const len=Math.hypot(bx-ax,by-ay);if(len<.05)continue;
      const s={w,i,ax,ay,bx,by,len,ang:Math.atan2(by-ay,bx-ax),h:hAng(bx-ax,by-ay),_q:0};
      W.segs.push(s);const p=w.hw+2;
      gAddBox(W.sG,Math.min(ax,bx)-p,Math.min(ay,by)-p,Math.max(ax,bx)+p,Math.max(ay,by)+p,s);
      bx0=Math.min(bx0,ax,bx);bx1=Math.max(bx1,ax,bx);by0=Math.min(by0,ay,by);by1=Math.max(by1,ay,by);
    }
  }
  W.bounds={x0:bx0,y0:by0,x1:bx1,y1:by1};
  /* buildings */
  for(const b of data.blds){
    const p=b.pts;const n=p.length/2;if(n<3)continue;
    let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9,cx=0,cy=0;for(let i=0;i<n;i++){const x=p[2*i],y=p[2*i+1];mnx=Math.min(mnx,x);mxx=Math.max(mxx,x);mny=Math.min(mny,y);mxy=Math.max(mxy,y);cx+=x;cy+=y;}cx/=n;cy/=n;
    if(mxx-mnx>400||mxy-mny>400)continue;
    const hs=hash2(Math.round(cx*3),Math.round(cy*3));const r=mulberry32(hs);
    let h=b.h;if(!h||h<=5.01)h=(r()<.62?6.5+r()*4.5:r()<.8?10+r()*4:3.5+r()*3);if(r()<.05&&!b.h)h+=14+r()*20;
    const area=Math.abs(polyArea(p));
    const o={pts:p,minx:mnx,miny:mny,maxx:mxx,maxy:mxy,cx,cy,h:Math.min(h,120),area,col:hexRGB(BCOL[hs%BCOL.length]),tank:area>60&&h<30&&r()<.6,_q:0};
    W.bld.push(o);gAddBox(W.bG,mnx,mny,mxx,mxy,o);
  }
  W.pois=(data.pois||[]).map(q=>Object.assign({_q:0},q));for(const q of W.pois)gAddBox(W.pG,q.x,q.y,q.x,q.y,q);
  buildSignals(W.realSignals||data.signals||null);
  genHazards();
  buildGarages();
  buildFuels();
  buildCourt();
  buildLifeWorld();
  buildCity(data);
  buildMetro(data);
  buildStations();
  buildAirport(data);
}
function nodeArms(list){let a=0;for(const e of list){if(e.k>0)a++;if(e.k<e.w.pts.length/2-1)a++;}return a;}
function nodeXY(list){const e=list[0];return [e.w.pts[2*e.k],e.w.pts[2*e.k+1]];}
function isJunction(id){const l=id!=null&&W.nodes.get(id);return !!l&&nodeArms(l)>=3;}

/* ---------- traffic signals ---------- */
const SIGC=40;
function buildSignals(real){
  W.sigs=[];W.sigG=new Map();
  const cand=[];
  if(real&&real.length){
    const seen=new Set();const tmp=[];
    for(const s of real){gQuery(W.sG,s.x,s.y,22,tmp);let best=null,bd=22;
      for(const g of tmp)for(const e of[g.i,g.i+1]){const id=g.w.nodes[e];const l=W.nodes.get(id);if(!l||nodeArms(l)<3)continue;const[x,y]=nodeXY(l);const d=Math.hypot(x-s.x,y-s.y);if(d<bd){bd=d;best={id,x,y,l};}}
      if(best&&!seen.has(best.id)){seen.add(best.id);cand.push(best);}}
  }else{
    for(const[id,l]of W.nodes){if(nodeArms(l)<3)continue;let big=0,maj=0;for(const e of l){const n=(e.k>0)+(e.k<e.w.pts.length/2-1);if(RANK[e.w.cls]>=2)big+=n;if(RANK[e.w.cls]>=3)maj+=n;}if(big<3)continue;
      if(maj<2&&(hashStr(id)%3)!==0)continue;
      const[x,y]=nodeXY(l);cand.push({id,x,y,l});}
  }
  cand.sort((a,b)=>a.x-b.x||a.y-b.y);
  const used=new Set();
  for(let i=0;i<cand.length;i++){
    if(used.has(i))continue;const mem=[cand[i]];used.add(i);
    for(let j=i+1;j<cand.length;j++){if(used.has(j))continue;if(cand[j].x-cand[i].x>32)break;if(Math.hypot(cand[j].x-cand[i].x,cand[j].y-cand[i].y)<32){mem.push(cand[j]);used.add(j);}}
    let cx=0,cy=0;for(const m of mem){cx+=m.x;cy+=m.y;}cx/=mem.length;cy/=mem.length;
    const ids=new Set(mem.map(m=>m.id));let maxHw=3,maxD=0;const arms=[];
    for(const m of mem){maxD=Math.max(maxD,Math.hypot(m.x-cx,m.y-cy));
      for(const e of m.l){const w=e.w;maxHw=Math.max(maxHw,w.hw);
        for(const nk of[e.k-1,e.k+1]){if(nk<0||nk>=w.pts.length/2)continue;if(ids.has(w.nodes[nk]))continue;
          const ox=w.pts[2*nk],oy=w.pts[2*nk+1];arms.push({ang:hAng(ox-m.x,oy-m.y),w,rank:RANK[w.cls],hw:w.hw,mx:m.x,my:m.y,ph:0,inbound:!w.oneway||((nk<e.k)!==w.rev)});}}}
    if(arms.length<3)continue;
    let axis=arms[0];for(const a of arms)if(a.rank>axis.rank)axis=a;
    for(const a of arms){let d=Math.abs(angDiff(axis.ang,a.ang));if(d>Math.PI/2)d=Math.PI-d;a.ph=d<Math.PI/4?0:1;}
    if(arms.every(a=>a.ph===arms[0].ph))continue;
    const R=Math.max(7,maxD+maxHw+1.5);
    const S={x:cx,y:cy,R,arms,off:hash2(Math.round(cx),Math.round(cy))%SIGC,_q:0,ids};
    for(const a of arms)a.S=S;
    W.sigs.push(S);gAddBox(W.sigG,cx-R,cy-R,cx+R,cy+R,S);
  }
}
function sigState(S,ph,t){
  const c=((t+S.off)%SIGC+SIGC)%SIGC;const l=ph?((c-20+SIGC)%SIGC):c;
  if(l<16)return ['G',16-l];if(l<19)return ['A',19-l];return ['R',SIGC-l];
}
function sigArmFor(S,x,y){const a=hAng(x-S.x,y-S.y);let best=S.arms[0],bd=9;for(const arm of S.arms){const d=Math.abs(angDiff(arm.ang,a));if(d<bd){bd=d;best=arm;}}return best;}
const tmpS=[];
/* the signal a vehicle at (x,y) heading h is driving towards, if any */
function signalAhead(x,y,h,range){
  gQuery(W.sigG,x,y,range,tmpS);let best=null,bd=range;
  const fx=Math.sin(h),fy=-Math.cos(h);
  for(const S of tmpS){const dx=S.x-x,dy=S.y-y,d=Math.hypot(dx,dy);if(d>bd||d<1)continue;if((dx*fx+dy*fy)/d<.72)continue;best=S;bd=d;}
  return best?{S:best,d:bd}:null;
}

/* ---------- potholes, speed breakers, water logging ---------- */
function addHz(z){z._q=0;z.cd=0;W.hz.push(z);const r=z.type==='bump'?z.len+1:z.r*1.8;gAddBox(W.hG,z.x-r,z.y-r,z.x+r,z.y+r,z);}
function nearSignal(x,y,pad){gQuery(W.sigG,x,y,pad+30,tmpS);for(const S of tmpS)if(Math.hypot(S.x-x,S.y-y)<S.R+pad)return true;return false;}
function genHazards(){
  const potRate={residential:1/60,unclassified:1/65,living_street:1/55,service:1/80,tertiary:1/100,secondary:1/150,primary:1/210,trunk:1/330,motorway:1/600};
  const wetRate={residential:1/220,unclassified:1/220,living_street:1/240,service:1/280,tertiary:1/300,secondary:1/380,primary:1/480,trunk:1/650,motorway:1/1100};
  const bumpCls={residential:1,unclassified:1,living_street:1,tertiary:1,service:1};
  for(const s of W.segs){
    const w=s.w,rnd=mulberry32(hash2(Math.round(s.ax*3),Math.round(s.ay*3))^hash2(Math.round(s.bx*3),Math.round(s.by*3)));
    if(w.br)continue;
    const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len,nx=-dy,ny=dx;
    const at=(t,off)=>[s.ax+dx*t+nx*off,s.ay+dy*t+ny*off];
    let np=s.len*potRate[w.cls];let cnt=Math.floor(np)+(rnd()<np%1?1:0);cnt=Math.min(cnt,6);
    for(let k=0;k<cnt;k++){
      const t=rnd()*s.len,off=(rnd()*2-1)*w.hw*.75,[x,y]=at(t,off),r=.5+rnd()*.8;
      if(nearSignal(x,y,3))continue;
      const poly=[];const m=7+Math.floor(rnd()*4);for(let q=0;q<m;q++){const a=q/m*TAU,rr=r*(.7+rnd()*.5);poly.push(Math.cos(a)*rr,Math.sin(a)*rr);}
      addHz({type:'pot',x,y,r,poly,ang:s.ang});
    }
    if(rnd()<s.len*wetRate[w.cls]){
      const t=s.len*(.2+rnd()*.6),side=rnd()<.6?(rnd()<.5?-1:1)*w.hw*.5:0,[x,y]=at(t,side);
      if(!nearSignal(x,y,4))addHz({type:'water',x,y,r:1.6+rnd()*2.4,ang:s.ang,hidden:rnd()<.28,ph:rnd()*TAU});
    }
    if(bumpCls[w.cls]&&s.len>28){
      for(const[e,t] of[[s.i,11],[s.i+1,s.len-11]]){if(isJunction(w.nodes[e])&&rnd()<.5){const[x,y]=at(t,0);if(!nearSignal(x,y,2))addHz({type:'bump',x,y,ang:s.ang,len:w.hw});}}
      if(s.len>110&&rnd()<.35){const[x,y]=at(s.len*(.35+rnd()*.3),0);addHz({type:'bump',x,y,ang:s.ang,len:w.hw});}
    }else if((w.cls==='secondary'||w.cls==='primary')&&s.len>140&&rnd()<.12){const[x,y]=at(s.len*.5,0);if(!nearSignal(x,y,10))addHz({type:'bump',x,y,ang:s.ang,len:w.hw});}
  }
}

/* ---------- mechanic shops ---------- */
function nearestSeg(x,y,r,filter){const tmp=[];gQuery(W.sG,x,y,r,tmp);let best=null,bd=1e9;for(const s of tmp){if(filter&&!filter(s))continue;const d=segDistXY(x,y,s.ax,s.ay,s.bx,s.by)-s.w.hw;if(d<bd){bd=d;best=s;}}return best?{seg:best,edge:bd}:{seg:null,edge:1e9};}
function inBuilding(x,y){const tmp=[];gQuery(W.bG,x,y,1,tmp);for(const b of tmp){if(b.hide)continue;if(x<b.minx||x>b.maxx||y<b.miny||y>b.maxy)continue;if(inPoly(x,y,b.pts))return b;}return null;}
function addGarage(s,t,name,real){
  const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;
  /* keep-left side of the road */
  const lx=dy,ly=-dx;const mx=s.ax+dx*t,my=s.ay+dy*t;
  for(const g of W.garages)if(Math.hypot(g.x-mx,g.y-my)<(real?60:320))return;
  const spot=[mx+lx*(s.w.hw-1.2),my+ly*(s.w.hw-1.2)];
  const shed=[mx+lx*(s.w.hw+4.2),my+ly*(s.w.hw+4.2)];
  if(!clearLot(shed[0],shed[1],hAng(-lx,-ly),3.5,2.5,real))return;
  W.garages.push({x:spot[0],y:spot[1],sx:shed[0],sy:shed[1],h:hAng(-lx,-ly),name,real:!!real,_q:0});
}
function buildGarages(){
  W.garages=[];
  for(const q of W.pois){if(!/repair|tyre|motorcycle|car_parts|car$/.test(q.sub+' '+q.cls))continue;const n=nearestSeg(q.x,q.y,40,s=>s.len>12&&s.w.cls!=='motorway');if(!n.seg)continue;
    const s=n.seg;const t=clamp(((q.x-s.ax)*(s.bx-s.ax)+(q.y-s.ay)*(s.by-s.ay))/(s.len*s.len),.1,.9)*s.len;addGarage(s,t,q.name,true);}
  const order=W.segs.filter(s=>s.len>45&&['residential','unclassified','tertiary','secondary'].includes(s.w.cls)&&!s.w.br);
  for(const s of order){const h=hash2(Math.round(s.ax),Math.round(s.ay))%1000;if(h<1000*s.len/900){const t=s.len*.5;const mx=s.ax+(s.bx-s.ax)*.5,my=s.ay+(s.by-s.ay)*.5;if(nearSignal(mx,my,35))continue;addGarage(s,t,GARAGE_NAMES[h%GARAGE_NAMES.length],false);}}
}
/* ---------- fuel stations ---------- */
const FUEL_BRANDS=['Indian Oil','Shell','MRPL','Nayara','HP'];
function buildFuels(){
  W.fuels=[];
  const add=(s,t,name,real)=>{const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len,lx=dy,ly=-dx,mx=s.ax+dx*t,my=s.ay+dy*t;
    for(const f of W.fuels)if(Math.hypot(f.x-mx,f.y-my)<(real?40:650))return;
    for(const g of W.garages)if(Math.hypot(g.x-mx,g.y-my)<30)return;
    if(!clearLot(mx+lx*(s.w.hw+7.5),my+ly*(s.w.hw+7.5),hAng(-lx,-ly),7,6,real))return;
    W.fuels.push({x:mx+lx*(s.w.hw-1.4),y:my+ly*(s.w.hw-1.4),sx:mx+lx*(s.w.hw+7.5),sy:my+ly*(s.w.hw+7.5),h:hAng(-lx,-ly),name,real:!!real,_q:0});};
  for(const q of W.pois){if(!/fuel/.test(q.cls+' '+q.sub))continue;const n=nearestSeg(q.x,q.y,45,s=>s.len>20&&!s.w.br);if(!n.seg)continue;const s=n.seg;
    const t=clamp(((q.x-s.ax)*(s.bx-s.ax)+(q.y-s.ay)*(s.by-s.ay))/(s.len*s.len),.2,.8)*s.len;add(s,t,q.name,true);}
  for(const s of W.segs){if(s.len<60||s.w.br||RANK[s.w.cls]<2)continue;const h=hash2(Math.round(s.ax*2),Math.round(s.by*2))%1000;
    if(h<1000*s.len/1100){const mx=(s.ax+s.bx)/2,my=(s.ay+s.by)/2;if(nearSignal(mx,my,40))continue;add(s,s.len*.5,FUEL_BRANDS[h%FUEL_BRANDS.length],false);}}
}
function nearestFuel(x,y){let best=null,bd=1e9;for(const g of W.fuels||[]){const d=Math.hypot(g.x-x,g.y-y);if(d<bd){bd=d;best=g;}}return best?{g:best,d:bd}:null;}
/* a lot is usable if no building stands on it; real places clear the buildings drawn over them */
function clearLot(cx,cy,h,hx,hz,real){
  const c=Math.cos(-h),s=Math.sin(-h);const pts=[];for(const u of[-1,0,1])for(const v of[-1,0,1])pts.push([cx+u*hx*c+v*hz*s,cy-u*hx*s+v*hz*c]);
  const hit=new Set();for(const[x,y]of pts){const b=inBuilding(x,y);if(b)hit.add(b);}
  if(!hit.size)return true;if(!real)return false;
  for(const b of hit)b.hide=true;return true;
}
function nearestGarage(x,y){let best=null,bd=1e9;for(const g of W.garages){const d=Math.hypot(g.x-x,g.y-y);if(d<bd){bd=d;best=g;}}return best?{g:best,d:bd}:null;}
