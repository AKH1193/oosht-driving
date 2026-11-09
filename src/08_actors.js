/* ================= traffic, people, animals, police ================= */
const CRUISE={motorway:22,trunk:17,primary:14,secondary:12,tertiary:10,unclassified:8,residential:7.5,living_street:5,service:4.5};
let agents=[],peds=[],animals=[],intruder=null,GT=0;
function pickTT(){let tot=0;for(const t of TT)tot+=t.w;let r=Math.random()*tot;for(const t of TT){r-=t.w;if(r<=0)return t;}return TT[0];}
function segOfA(a){const w=a.w,i=a.i,j=a.i+a.dir;return [w.pts[2*i],w.pts[2*i+1],w.pts[2*j],w.pts[2*j+1]];}
function placeAgent(a){
  const[ax,ay,bx,by]=segOfA(a);const L=Math.hypot(bx-ax,by-ay)||1;const dx=(bx-ax)/L,dy=(by-ay)/L;
  const t=clamp(a.d/L,0,1);
  const off=a.w.oneway?(a.t.two?a.w.hw*.45:0):a.w.hw*(a.t.two?.66:.45)*a.laneJ;
  a.x=ax+(bx-ax)*t+dy*off;a.y=ay+(by-ay)*t-dx*off;a.th=hAng(dx,dy);a.segLen=L;
}
function nextLeg(a){
  const w=a.w,j=a.i+a.dir,n=w.pts.length/2;const opts=[];
  const pa=hAng(w.pts[2*j]-w.pts[2*a.i],w.pts[2*j+1]-w.pts[2*a.i+1]);
  if(j+a.dir>=0&&j+a.dir<n)opts.push({w,i:j,dir:a.dir,wt:3});
  const lst=W.nodes.get(w.nodes[j]);
  if(lst)for(const o of lst){if(o.w===w)continue;const m=o.w.pts.length/2;if(o.w.cls==='service'&&Math.random()<.75)continue;if(a.t.len>6&&RANK[o.w.cls]<2)continue;
    if(o.k<m-1&&!(o.w.oneway&&o.w.rev))opts.push({w:o.w,i:o.k,dir:1,wt:1});
    if(o.k>0&&!(o.w.oneway&&!o.w.rev))opts.push({w:o.w,i:o.k,dir:-1,wt:1});}
  if(!opts.length){if(w.oneway)return false;opts.push({w,i:j,dir:-a.dir,wt:1});}
  let tot=0;for(const o of opts)tot+=o.wt;let r=Math.random()*tot;let ch=opts[0];for(const o of opts){r-=o.wt;if(r<=0){ch=o;break;}}
  a.w=ch.w;a.i=ch.i;a.dir=ch.dir;a.d=0;
  const[ax,ay,bx,by]=segOfA(a);a.turnSlow=Math.abs(angDiff(pa,hAng(bx-ax,by-ay)))>.5?1.4:0;
  return true;
}
function spawnAgent(near){
  for(let tries=0;tries<40;tries++){
    const s=W.segs[Math.floor(Math.random()*W.segs.length)];if(!s||s.w.cls==='service')continue;
    const mx=(s.ax+s.bx)/2,my=(s.ay+s.by)/2,d=Math.hypot(mx-P.x,my-P.y);
    if(near?(d<35||d>240):(d<150||d>380))continue;
    const t=pickTT();
    if(t.len>6&&RANK[s.w.cls]<2)continue;
    let dir=Math.random()<.5?1:-1;if(s.w.oneway)dir=s.w.rev?-1:1;
    const col=t.cols?t.cols[Math.floor(Math.random()*t.cols.length)]:(t.k==='bus'?(Math.random()<.5?'red':'blue'):t.k==='truck'?['#E07A1F','#C9A227','#2E86C1','#B03A2E'][Math.floor(Math.random()*4)]:null);
    const a={w:s.w,i:dir===1?s.i:s.i+1,dir,d:Math.random()*s.len*.8,v:CRUISE[s.w.cls]*.7,t,col,model:trafficModel(t,col),x:0,y:0,h:0,th:0,stop:0,brake:false,laneJ:.85+Math.random()*.3,turnSlow:0,k:.85+Math.random()*.3,horn:0,lean:0};
    placeAgent(a);a.h=a.th;return a;
  }
  return null;
}
/* is (x,y) in the lane in front of a vehicle at (ax,ay) heading h, within maxD and lateral lat */
function inFront(ax,ay,h,x,y,maxD,lat){const fx=Math.sin(h),fy=-Math.cos(h);const dx=x-ax,dy=y-ay;const al=dx*fx+dy*fy;if(al<=0||al>maxD)return false;return Math.abs(dx*-fy+dy*fx)<lat;}
function updateAgents(dt){
  const want=settings.gfx==='fast'?24:34;
  for(let k=agents.length-1;k>=0;k--){
    const a=agents[k];
    let tgt=CRUISE[a.w.cls]*a.t.cruise*a.k;
    if(a.turnSlow>0){a.turnSlow-=dt;tgt*=.5;}
    const gap=a.t.len/2+3;
    if(inFront(a.x,a.y,a.h,P.x,P.y,gap+P.len/2+4,a.t.wid/2+P.wid/2+.6)){tgt=0;a.horn+=dt;if(a.horn>2.5&&Math.hypot(a.x-P.x,a.y-P.y)<30){a.horn=-4;Snd.tone([380+Math.random()*120],.25,'square',.04);}}
    for(const b of agents){if(b!==a&&inFront(a.x,a.y,a.h,b.x,b.y,gap+b.t.len/2+1.5,(a.t.wid+b.t.wid)/2+.2))tgt=Math.min(tgt,Math.max(0,b.v-1));}
    for(const c of COP.list)if(inFront(a.x,a.y,a.h,c.x,c.y,gap+4,2.2))tgt=0;
    for(const p of peds)if((p.state==='cross'||p.state==='play')&&inFront(a.x,a.y,a.h,p.x,p.y,gap+7,a.t.wid/2+1.2))tgt=0;
    for(const n of animals)if(n.onRoad&&inFront(a.x,a.y,a.h,n.x,n.y,gap+6,a.t.wid/2+1.2))tgt=0;
    const sa=signalAhead(a.x,a.y,a.h,55);
    if(sa&&sa.d>sa.S.R-.5){const arm=sigArmFor(sa.S,a.x,a.y);const st=sigState(sa.S,arm.ph,GT);
      if(st[0]==='R'||(st[0]==='A'&&sa.d-sa.S.R>9)){const stop=sa.d-sa.S.R-a.t.len/2-.6;tgt=Math.min(tgt,Math.sqrt(Math.max(0,2*3.2*stop)));}}
    if(a.stop>0){a.stop-=dt;tgt=0;}
    a.brake=tgt<a.v-.5;
    a.v+=clamp(tgt-a.v,-8*dt,2.4*dt);if(a.v<0)a.v=0;
    a.d+=a.v*dt;
    let guard=0;
    while(a.d>a.segLen&&guard++<4){const over=a.d-a.segLen;if(!nextLeg(a)){agents.splice(k,1);break;}a.d=over;placeAgent(a);}
    if(agents[k]!==a)continue;
    placeAgent(a);
    const dh=angDiff(a.h,a.th);a.h+=dh*Math.min(1,dt*6);a.lean=a.t.two?clamp(dh*2,-.4,.4):0;
    if(Math.hypot(a.x-P.x,a.y-P.y)>430)agents.splice(k,1);
  }
  if(agents.length<want){const a=spawnAgent(false);if(a)agents.push(a);}
}

/* ---------- pedestrians: walkers, office goers, runners, elders, kids, vendors, people on the footpath ---------- */
function segPt(s,t,off){const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;return [s.ax+dx*t-dy*off,s.ay+dy*t+dx*off];}
const PED_SPEED={walk:[1.1,1.5],office:[1.4,1.8],run:[2.8,3.8],elder:[.6,.85],kid:[1.4,2.6]};
function pickLook(kidOk){let tot=0;for(const l of PED_LOOKS)if(kidOk||l.kind!=='kid')tot+=l.w||0;let r=Math.random()*tot;for(let i=0;i<PED_LOOKS.length;i++){const l=PED_LOOKS[i];if(!kidOk&&l.kind==='kid')continue;r-=l.w||0;if(r<=0)return i;}return 0;}
function kidLook(){const ks=[];PED_LOOKS.forEach((l,i)=>{if(l.kind==='kid')ks.push(i);});return ks[Math.floor(Math.random()*ks.length)];}
function pedSeg(minD,maxD){
  for(let tries=0;tries<30;tries++){const s=W.segs[Math.floor(Math.random()*W.segs.length)];if(!s||s.len<15||s.w.br)continue;if(['motorway','trunk','service'].includes(s.w.cls))continue;
    const mx=(s.ax+s.bx)/2,my=(s.ay+s.by)/2,d=Math.hypot(mx-P.x,my-P.y);if(d>=minD&&d<=maxD)return s;}
  return null;
}
function spawnPed(){
  const s=pedSeg(35,190);if(!s)return null;
  const mx=(s.ax+s.bx)/2,my=(s.ay+s.by)/2;
  const v=pickLook(false);const L=PED_LOOKS[v];const sp=PED_SPEED[L.kind]||PED_SPEED.walk;
  const sigs=[];gQuery(W.sigG,mx,my,90,sigs);
  if(sigs.length&&Math.random()<.5){const S=sigs[Math.floor(Math.random()*sigs.length)];const arm=S.arms[Math.floor(Math.random()*S.arms.length)];
    const ox=Math.sin(arm.ang),oy=-Math.cos(arm.ang),px=-oy,py=ox;const side=Math.random()<.5?1:-1,dd=S.R-1.6,e=arm.hw+1.3;
    const x=S.x+ox*dd+px*e*side,y=S.y+oy*dd+py*e*side;if(Math.hypot(x-P.x,y-P.y)<30)return null;
    return {x,y,h:hAng(-px*side,-py*side),state:'wait',S,arm,tx:S.x+ox*dd-px*e*side,ty:S.y+oy*dd-py*e*side,speed:sp[0]+Math.random()*(sp[1]-sp[0]),v,pose:0,pt:0,t:0,sc:1};}
  const side=Math.random()<.5?1:-1,off=s.w.hw+1.0+Math.random()*.5,t=Math.random()*s.len;const[x,y]=segPt(s,t,off*side);
  if(inBuilding(x,y))return null;
  return {x,y,h:0,state:'walk',s,st:t,side,off,dir:Math.random()<.5?1:-1,speed:sp[0]+Math.random()*(sp[1]-sp[0]),v,pose:0,pt:0,t:0,sc:1,run:L.kind==='run',
    crossIn:L.kind==='run'?1e9:Math.random()<.3?3+Math.random()*14:1e9};
}
/* people who stay put: vendors with carts, someone seated with a bowl, someone asleep on the footpath */
function spawnStatic(){
  const s=pedSeg(60,200);if(!s||s.len<25)return null;
  const side=Math.random()<.5?1:-1,t=5+Math.random()*(s.len-10);const r=Math.random();
  const kind=r<.55?'vendor':r<.78?'sit':'lie';
  const off=s.w.hw+(kind==='vendor'?.9:1.3);const[x,y]=segPt(s,t,off*side);if(inBuilding(x,y)||nearSignal(x,y,2))return null;
  const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len;const face=hAng(-(-dy)*side,-(dx)*side);
  const o={x,y,h:face,state:'static',kind,t:0,v:Math.floor(Math.random()*3),sc:1,s};
  if(kind==='vendor'){o.cart=Math.floor(Math.random()*3);o.cx=x;o.cy=y;const[vx,vy]=segPt(s,t+1.6,(off+.6)*side);o.x=vx;o.y=vy;o.vv=Math.floor(Math.random()*2);}
  if(kind==='lie')o.h=hAng(dx,dy);
  return o;
}
/* kids playing on the verge, darting about; now and then one runs into the road */
function spawnKids(){
  const s=pedSeg(50,170);if(!s||RANK[s.w.cls]>2)return [];
  const side=Math.random()<.5?1:-1,t=Math.random()*s.len;const[cx,cy]=segPt(s,t,(s.w.hw+3.6)*side);if(inBuilding(cx,cy))return [];
  const n=3+Math.floor(Math.random()*3),out=[];
  for(let i=0;i<n;i++){const v=kidLook();out.push({x:cx+(Math.random()-.5)*4,y:cy+(Math.random()-.5)*4,h:Math.random()*TAU,state:'play',cx,cy,s,side,speed:2.4+Math.random()*1.4,v,pose:0,pt:0,t:Math.random()*2,sc:PED_LOOKS[v].scale||.6,run:true,tx:cx,ty:cy});}
  return out;
}
function updatePeds(dt){
  const want=settings.gfx==='fast'?18:settings.gfx==='ultra'?50:36;
  let moving=0,statics=0,kids=0;
  for(let k=peds.length-1;k>=0;k--){
    const p=peds[k];p.t+=dt;
    if(p.state==='static'){statics++;if(Math.hypot(p.x-P.x,p.y-P.y)>260)peds.splice(k,1);continue;}
    if(p.state==='play'){kids++;
      if(p.t>0){p.t=-(1+Math.random()*2.5);
        if(Math.random()<.06&&Math.hypot(P.x-p.x,P.y-p.y)>35){const[tx,ty]=segPt(p.s,clamp(((p.x-p.s.ax)*(p.s.bx-p.s.ax)+(p.y-p.s.ay)*(p.s.by-p.s.ay))/p.s.len,0,p.s.len),-(p.s.w.hw+1.2)*p.side);p.state='cross';p.tx=tx;p.ty=ty;p.after='back';p.hurry=true;}
        else{const a=Math.random()*TAU,r=Math.random()*5;p.tx=p.cx+Math.cos(a)*r;p.ty=p.cy+Math.sin(a)*r;}}
      const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);if(d>.2){p.x+=dx/d*Math.min(d,p.speed*dt);p.y+=dy/d*Math.min(d,p.speed*dt);p.h=hAng(dx,dy);p.pt+=dt;if(p.pt>.16){p.pt=0;p.pose^=1;}}
      if(Math.hypot(p.x-P.x,p.y-P.y)>250)peds.splice(k,1);continue;}
    moving++;
    if(p.state==='walk'){
      p.st+=p.dir*p.speed*dt;if(p.st<1||p.st>p.s.len-1){p.dir*=-1;p.st=clamp(p.st,1,p.s.len-1);}
      const[x,y]=segPt(p.s,p.st,(p.off||p.s.w.hw+1.2)*p.side);const hh=hAng(x-p.x,y-p.y);if(!isNaN(hh))p.h=hh;p.x=x;p.y=y;
      p.crossIn-=dt;
      if(p.crossIn<=0){const fast=Math.hypot(P.x-p.x,P.y-p.y)<18&&Math.abs(P.s)>4;if(!fast&&!nearSignal(p.x,p.y,12)){const[tx,ty]=segPt(p.s,p.st,-(p.s.w.hw+1.2)*p.side);p.state='cross';p.tx=tx;p.ty=ty;p.after='walk';p.crossIn=1e9;}else p.crossIn=2;}
    }else if(p.state==='wait'){
      const st=sigState(p.S,p.arm.ph,GT);if(st[0]==='R'&&st[1]>7){p.state='cross';p.after='gone';}
    }else if(p.state==='cross'){
      const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);
      if(d<.3){if(p.after==='walk'){p.state='walk';p.side=-p.side;}else if(p.after==='back'){p.state='play';p.hurry=false;p.cx=p.x;p.cy=p.y;p.side=-p.side;p.t=-2;}else{p.state='idle';p.t=0;}}
      else{const sp=p.speed*(p.hurry?1.6:1);p.x+=dx/d*Math.min(d,sp*dt);p.y+=dy/d*Math.min(d,sp*dt);p.h=hAng(dx,dy);}
    }else if(p.state==='down'){if(p.t>25){peds.splice(k,1);continue;}}
    else if(p.state==='idle'){if(p.t>6){peds.splice(k,1);continue;}}
    if(p.state==='walk'||p.state==='cross'){p.pt+=dt;if(p.pt>(p.run?.2:.32)){p.pt=0;p.pose^=1;}}
    if(Math.hypot(p.x-P.x,p.y-P.y)>250){peds.splice(k,1);continue;}
  }
  for(let i=0;i<2&&moving<want;i++){const p=spawnPed();if(p){peds.push(p);moving++;}}
  if(statics<(settings.gfx==='fast'?6:14)){const p=spawnStatic();if(p)peds.push(p);}
  if(kids<(settings.gfx==='fast'?0:9)&&Math.random()<.1){for(const k of spawnKids())peds.push(k);}
}

/* ---------- cows, dogs, cats ---------- */
function spawnAnimal(kind){
  for(let tries=0;tries<30;tries++){
    const s=W.segs[Math.floor(Math.random()*W.segs.length)];if(!s||s.len<12||s.w.br)continue;
    if(kind==='cow'&&!['residential','unclassified','tertiary','secondary','living_street'].includes(s.w.cls))continue;
    const mx=(s.ax+s.bx)/2,my=(s.ay+s.by)/2,d=Math.hypot(mx-P.x,my-P.y);if(d<45||d>220)continue;
    const t=Math.random()*s.len;const r=Math.random();
    let side=Math.random()<.5?1:-1,off;
    if(kind==='cow')off=r<.4?(Math.random()*2-1)*s.w.hw*.5:(s.w.hw+.8)*side;else off=(s.w.hw+1.0+Math.random()*.8)*side;
    const[x,y]=segPt(s,t,off);if(inBuilding(x,y))continue;
    const a={kind,x,y,hx:x,hy:y,h:Math.random()*TAU,s,st:t,side,state:'idle',t:Math.random()*4,speed:0,pose:0,pt:0,flee:0,v:0,onRoad:Math.abs(off)<s.w.hw};
    if(kind==='cow'){a.v=Math.floor(Math.random()*3);a.lie=r<.25&&a.onRoad;if(!a.lie&&Math.random()<.3)beginCross(a,.55);}
    else if(kind==='dog'){a.v=Math.floor(Math.random()*4);}
    else{a.v=1+Math.floor(Math.random()*2);}
    return a;
  }
  return null;
}
function beginCross(a,sp){const s=a.s;const t=clamp(((a.x-s.ax)*(s.bx-s.ax)+(a.y-s.ay)*(s.by-s.ay))/(s.len*s.len),0,1)*s.len;const sd=a.side||1;const[tx,ty]=segPt(s,t,-(s.w.hw+1.2)*sd);a.side=-sd;a.state='cross';a.tx=tx;a.ty=ty;a.speed=sp;}
function updateAnimals(dt){
  const counts={cow:0,dog:0,cat:0};
  const pFast=Math.abs(P.s);const two=VEH[P.type].cat==='two';
  for(let k=animals.length-1;k>=0;k--){
    const a=animals[k];a.t-=dt;if(!a.event)counts[a.kind]++;
    const dp=Math.hypot(P.x-a.x,P.y-a.y);
    if(a.event){ /* apshakun cat runs right to left across the road */
      const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);if(d>.2){a.x+=dx/d*Math.min(d,a.speed*dt);a.y+=dy/d*Math.min(d,a.speed*dt);a.h=hAng(dx,dy);a.onRoad=true;}else{a.onRoad=false;a.done=true;}
      a.pt+=dt;if(a.pt>.12){a.pt=0;a.pose^=1;}
      if(a.done&&(APSH.state==='idle'||dp>80)){animals.splice(k,1);}
      continue;
    }
    if(a.lie){if(dp>270)animals.splice(k,1);continue;}
    /* dodge a fast vehicle, chase two-wheelers (dogs) */
    if(a.kind!=='cow'&&a.state!=='flee'&&dp<8&&pFast>5&&inFront(P.x,P.y,P.h,a.x,a.y,9,2.5)&&Math.random()<.6){const ang=Math.atan2(a.y-P.y,a.x-P.x);a.state='flee';a.tx=a.x+Math.cos(ang)*6;a.ty=a.y+Math.sin(ang)*6;a.speed=a.kind==='dog'?6:5;a.t=1.4;}
    if(a.kind==='dog'&&two&&a.state==='idle'&&dp<16&&pFast>3&&pFast<15&&Math.random()<dt*.6){a.state='chase';a.t=3.5;a.speed=7;Snd.bark();}
    if(a.state==='chase'){a.tx=P.x;a.ty=P.y;if(a.t<=0||dp>30){a.state='idle';a.t=2;a.hx=a.x;a.hy=a.y;}else if(Math.random()<dt*1.5)Snd.bark();}
    if(a.state==='idle'&&a.t<=0){
      a.t=3+Math.random()*6;
      if(a.kind!=='cow'&&Math.random()<(a.kind==='dog'?.22:.12)&&dp>18)beginCross(a,a.kind==='dog'?3.6:2.8);
      else if(a.kind==='cow'&&Math.random()<.15)beginCross(a,.55);
      else{const an=Math.random()*TAU,r=Math.random()*3;a.tx=a.hx+Math.cos(an)*r;a.ty=a.hy+Math.sin(an)*r;a.speed=a.kind==='cow'?.4:.9;a.state='wander';}
    }
    if(a.state==='wander'||a.state==='cross'||a.state==='flee'||a.state==='chase'){
      const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);
      if(d<.3||(a.state==='flee'&&a.t<=0)){a.state='idle';a.t=1+Math.random()*4;a.hx=a.x;a.hy=a.y;}
      else{a.x+=dx/d*Math.min(d,a.speed*dt);a.y+=dy/d*Math.min(d,a.speed*dt);a.h+=angDiff(a.h,hAng(dx,dy))*Math.min(1,dt*6);a.pt+=dt;if(a.pt>(a.kind==='cow'?.5:.15)){a.pt=0;a.pose^=1;}}
    }
    const n=nearestSeg(a.x,a.y,8);a.onRoad=!!n.seg&&n.edge<0;
    if(dp>270)animals.splice(k,1);
  }
  const lim={cow:settings.gfx==='fast'?6:10,dog:settings.gfx==='fast'?6:10,cat:4};
  for(const kd of['cow','dog','cat'])if(counts[kd]<lim[kd]){const a=spawnAnimal(kd);if(a){animals.push(a);if(kd==='dog'&&Math.random()<.4){const b=Object.assign({},a,{x:a.x+1.5,y:a.y+1,hx:a.x+1.5,hy:a.y+1,v:Math.floor(Math.random()*4),t:Math.random()*3});animals.push(b);}}break;}
}

/* ---------- apshakun: the black cat ---------- */
const APSH={state:'idle',next:45,cat:null,lx:0,ly:0,fx:0,fy:0,t:0,hold:5,lastTick:0};
function apshakunTick(dt){
  if(state!=='play')return;
  const sp=Math.abs(P.s);
  if(APSH.state==='idle'){
    if(COP.list.length||P.cond<=0)return;
    if(sp>6)APSH.next-=dt;
    if(APSH.next>0)return;
    const sa=signalAhead(P.x,P.y,P.h,60);if(sa){APSH.next=4;return;}
    const fx=Math.sin(P.h),fy=-Math.cos(P.h);const D=clamp(sp*2.3,24,62);
    const n=nearestSeg(P.x+fx*D,P.y+fy*D,10,s=>!s.w.br);const here=nearestSeg(P.x,P.y,6);
    if(!n.seg||!here.seg||n.edge>0){APSH.next=6;return;}
    const s=n.seg;const t=clamp(((P.x+fx*D-s.ax)*(s.bx-s.ax)+(P.y+fy*D-s.ay)*(s.by-s.ay))/(s.len*s.len),0,1);
    const cx=s.ax+(s.bx-s.ax)*t,cy=s.ay+(s.by-s.ay)*t;
    const rx=Math.cos(P.h),ry=Math.sin(P.h);const hw=s.w.hw;
    const A=animalModels();
    const cat={kind:'cat',event:true,x:cx+rx*(hw+2.2),y:cy+ry*(hw+2.2),tx:cx-rx*(hw+2.6),ty:cy-ry*(hw+2.6),h:hAng(-rx,-ry),speed:4.2,v:0,pose:0,pt:0,onRoad:true};
    animals.push(cat);
    Object.assign(APSH,{state:'cross',cat,lx:cx,ly:cy,fx,fy,t:0,hold:5,lastTick:5});
    Snd.meow();Hap.tick();
    $('#apsh').hidden=false;$('#apshN').textContent='5';$('#apshS').textContent="Stop before the cat's path";$('#apshH').textContent='A black cat crossed your path';
    return;
  }
  APSH.t+=dt;
  const along=(APSH.lx-P.x)*APSH.fx+(APSH.ly-P.y)*APSH.fy;
  if(APSH.state==='cross'){
    if(sp<.6){APSH.state='hold';APSH.hold=5;APSH.lastTick=5;$('#apshS').textContent='Stay stopped';Hap.tick();Snd.tick();}
    else if(along<-1||APSH.t>9){apshFail(along<-1?'You crossed the black cat’s path!':'You did not stop for the black cat!');}
  }else if(APSH.state==='hold'){
    if(sp>1){apshFail('You moved before the countdown ended!');return;}
    APSH.hold-=dt;const n=Math.max(0,Math.ceil(APSH.hold));
    if(n<APSH.lastTick){APSH.lastTick=n;$('#apshN').textContent=String(n);if(n>0){Snd.tick();Hap.tick();}}
    if(APSH.hold<=0){APSH.state='idle';APSH.next=70+Math.random()*80;$('#apsh').hidden=true;
      profile.wallet+=51;session.fare+=51;saveProfile();toast('Apshakun avoided · bonus ₹51','gold');Snd.chime();Hap.success();}
  }
}
function apshFail(msg){
  APSH.state='idle';APSH.next=80+Math.random()*80;$('#apsh').hidden=true;
  toast('Apshakun! '+msg,'bad');launchIntruder();
}
function apshReset(){APSH.state='idle';APSH.next=40+Math.random()*40;$('#apsh').hidden=true;}

/* ---------- sudden collision ---------- */
function launchIntruder(){
  const kinds=[TT.find(t=>t.k==='tanker'),TT.find(t=>t.k==='bus'),TT.find(t=>t.k==='truck'),TT.find(t=>t.k==='auto')];
  const t=kinds[Math.floor(Math.random()*kinds.length)];const col=t.k==='bus'?'red':t.k==='truck'?'#E07A1F':null;
  const lx=-Math.cos(P.h),ly=-Math.sin(P.h),fx=Math.sin(P.h),fy=-Math.cos(P.h);
  const x=P.x+lx*20+fx*Math.max(4,Math.abs(P.s)*.8),y=P.y+ly*20+fy*Math.max(4,Math.abs(P.s)*.8);
  intruder={t,model:trafficModel(t,col),x,y,h:hAng(P.x-x,P.y-y),v:19,hit:false,life:0};
  Snd.tone([300,380],.6,'square',.07);
}
function updateIntruder(dt){
  const it=intruder;if(!it)return;it.life+=dt;
  if(!it.hit){
    const dx=P.x-it.x,dy=P.y-it.y,d=Math.hypot(dx,dy);it.h+=angDiff(it.h,hAng(dx,dy))*Math.min(1,dt*5);
    it.x+=Math.sin(it.h)*it.v*dt;it.y+=-Math.cos(it.h)*it.v*dt;
    if(d<it.t.len*.5+P.wid*.8){it.hit=true;it.v=0;suddenCrash();}
    if(it.life>4){it.hit=true;suddenCrash();}
  }else if(it.life>7)intruder=null;
}
function suddenCrash(){
  Snd.crash();Hap.bigCrash();CAM.shake=16;P.bounce=1.2;
  P.h+=(Math.random()<.5?-1:1)*(.8+Math.random()*.6);P.s=0;P.vx=P.vy=0;
  flash();damage(40,true);toast('Sudden accident! −40% condition','bad');
}

/* ---------- Hoysala police ---------- */
const COP={level:0,list:[],trail:[],lastTr:null,off:[],caughtT:0,lostT:0,pedHit:false,cool:0};
const FINES={signal:['Jumped a red signal',1000],rash:['Rash driving',1000],speed:['Overspeeding',1000],wrong:['Driving the wrong way',500],ped:['Hit a pedestrian',5000],crash:['Dangerous driving, collision',2000]};
function offence(code,level){
  if(state!=='play')return;
  if(!COP.off.includes(code))COP.off.push(code);
  const before=COP.level;COP.level=clamp(Math.max(COP.level,level),0,3);
  if(COP.list.length&&before>=COP.level&&code!=='ped')COP.level=Math.min(3,COP.level+1);
  const want=COP.level>=3?2:1;
  while(COP.list.length<want){const c=spawnCop();if(!c)break;COP.list.push(c);}
  if(COP.list.length){Snd.sirenOn();if(before===0)toast(code==='ped'?'Hoysala dispatched!':'Hoysala is after you!','bad');}
  $('#wanted').hidden=false;
}
function spawnCop(){
  const tr=COP.trail;let x,y,h;
  if(tr.length>45){const i=Math.max(0,tr.length-45-COP.list.length*12);x=tr[i].x;y=tr[i].y;const j=Math.min(tr.length-1,i+3);h=hAng(tr[j].x-x,tr[j].y-y);}
  else{const fx=Math.sin(P.h),fy=-Math.cos(P.h);const n=nearestSeg(P.x-fx*120,P.y-fy*120,60);if(!n.seg)return null;const s=n.seg;x=(s.ax+s.bx)/2;y=(s.ay+s.by)/2;h=hAng(P.x-x,P.y-y);}
  return {x,y,h,v:14,idx:Math.max(0,tr.length-45),model:copModel(),fl:0};
}
function updateCops(dt){
  const tr=COP.trail;
  if(!COP.lastTr||Math.hypot(P.x-COP.lastTr.x,P.y-COP.lastTr.y)>3){COP.lastTr={x:P.x,y:P.y};tr.push(COP.lastTr);if(tr.length>900){tr.splice(0,100);for(const c of COP.list)c.idx=Math.max(0,c.idx-100);}}
  if(!COP.list.length){if(COP.level>0&&COP.cool<=0){COP.level=0;}return;}
  let md=1e9;
  for(const c of COP.list){
    const dx=P.x-c.x,dy=P.y-c.y,d=Math.hypot(dx,dy);md=Math.min(md,d);
    let tx,ty;
    if(d<40){tx=P.x+P.vx*.4;ty=P.y+P.vy*.4;}
    else{while(c.idx<tr.length-1&&Math.hypot(tr[c.idx].x-c.x,tr[c.idx].y-c.y)<7)c.idx++;tx=tr[Math.min(c.idx,tr.length-1)].x;ty=tr[Math.min(c.idx,tr.length-1)].y;}
    const want=hAng(tx-c.x,ty-c.y);const da=angDiff(c.h,want);
    c.h+=clamp(da,-2.8*dt,2.8*dt);
    let vt=d>60?39:d>20?Math.max(Math.abs(P.s)+5,12):Math.max(Math.abs(P.s)*.9,2.5);if(Math.abs(da)>.6)vt*=.5;
    c.v+=clamp(vt-c.v,-11*dt,8*dt);
    c.x+=Math.sin(c.h)*c.v*dt;c.y+=-Math.cos(c.h)*c.v*dt;
    if(d<(2.3+P.len/2)*.75){const nx=dx/(d||1),ny=dy/(d||1);P.x+=nx*.4;P.y+=ny*.4;c.v*=.5;P.s*=.8;CAM.shake=Math.max(CAM.shake,4);Hap.rumble();}
    c.fl+=dt;
  }
  Snd.sirenVol(clamp(1-md/450,0,1)*.32);
  if(md<11&&Math.abs(P.s)<3.2)COP.caughtT+=dt;else COP.caughtT=Math.max(0,COP.caughtT-dt*.5);
  if(COP.caughtT>1.6){caught();return;}
  if(md>320)COP.lostT+=dt;else COP.lostT=0;
  if(COP.lostT>7&&!COP.pedHit){escaped();}
  else if(COP.lostT>7&&COP.pedHit){COP.lostT=0;toast('You got away for now. Your licence is still suspended.','bad');COP.list=[];Snd.sirenOff();COP.level=0;$('#wanted').hidden=true;COP.off=[];COP.pedHit=false;}
}
function escaped(){COP.list=[];COP.level=0;COP.off=[];COP.caughtT=0;COP.lostT=0;P.rash=0;Snd.sirenOff();$('#wanted').hidden=true;toast('You lost the Hoysala','good');}
