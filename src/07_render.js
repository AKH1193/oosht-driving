/* ================= scene: chunks, sky, time of day, cameras ================= */
const CH=200;
const CHUNKS=new Map();
const COL={
  ground:[.48,.45,.38],park:[.33,.5,.26],wood:[.25,.42,.22],field:[.45,.55,.3],water:[.2,.36,.44],
  walk:[.6,.58,.54],curb:[.75,.74,.7],
  road:{motorway:[.27,.28,.3],trunk:[.28,.29,.31],primary:[.29,.3,.32],secondary:[.31,.31,.33],tertiary:[.33,.33,.34],unclassified:[.37,.36,.35],residential:[.38,.37,.36],living_street:[.42,.41,.39],service:[.44,.43,.41]},
  paint:[.9,.88,.82],yellow:[.92,.75,.15],pot:[.12,.11,.1],potRim:[.3,.29,.27],puddle:[.32,.29,.22],
  trunk:[.36,.27,.2],
};
const ORDER=['service','living_street','residential','unclassified','tertiary','secondary','primary','trunk','motorway'];
let AREAMESH=null;

/* ground-level helpers write straight into world space */
function ribbon(mb,ax,ay,bx,by,hw,col,y,us){
  const dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1,nx=-dy/l*hw,ny=dx/l*hw;y=y||0;
  const P1=[ax+nx,y,ay+ny],P2=[bx+nx,y,by+ny],P3=[bx-nx,y,by-ny],P4=[ax-nx,y,ay-ny];
  const uv=us?(a,b,c)=>[a[0]/us,a[2]/us,b[0]/us,b[2]/us,c[0]/us,c[2]/us]:()=>null;
  mb.rtri(P1,P2,P3,col,[0,1,0],uv(P1,P2,P3));mb.rtri(P1,P3,P4,col,[0,1,0],uv(P1,P3,P4));
}
function gdisc(mb,x,y,r,col,segs,us){segs=segs||10;for(let i=0;i<segs;i++){const a0=i/segs*TAU,a1=(i+1)/segs*TAU;const A=[x,0,y],B=[x+Math.cos(a0)*r,0,y+Math.sin(a0)*r],Cc=[x+Math.cos(a1)*r,0,y+Math.sin(a1)*r];mb.rtri(A,B,Cc,col,[0,1,0],us?[A[0]/us,A[2]/us,B[0]/us,B[2]/us,Cc[0]/us,Cc[2]/us]:null);}}
function gpoly(mb,pts,col,y,us){const tri=triangulate(pts);y=y||0;for(let i=0;i<tri.length;i+=3){const a=tri[i],b=tri[i+1],c=tri[i+2];const A=[pts[2*a],y,pts[2*a+1]],B=[pts[2*b],y,pts[2*b+1]],Cc=[pts[2*c],y,pts[2*c+1]];mb.rtri(A,B,Cc,col,[0,1,0],us?[A[0]/us,A[2]/us,B[0]/us,B[2]/us,Cc[0]/us,Cc[2]/us]:null);}}
function glowQuad(arr,x,z,r,col,y){y=y||.05;const c=[[x-r,z-r,-1,-1],[x+r,z-r,1,-1],[x+r,z+r,1,1],[x-r,z+r,-1,1]];for(const i of[0,1,2,0,2,3]){const q=c[i];arr.push(q[0],y,q[1],q[2],q[3],col[0],col[1],col[2]);}}

function buildAreaMesh(){
  freeMesh(AREAMESH);const mb=new MB();
  const order={field:0,park:1,wood:2,water:3};
  const list=W.areas.slice().sort((a,b)=>(order[a.kind]||0)-(order[b.kind]||0));
  for(const a of list){if(a.pts.length<6||a.pts.length>8000)continue;gpoly(mb,a.pts,COL[a.kind]||COL.park,0,a.kind==='water'?0:12.5);}
  AREAMESH=mb.mesh();
}

function treeAt(mb,x,y,r,sh){
  const kind=r<.08?'palm':r<.17?'gul':r<.25?'jac':r<.6?'rain':'gen';
  const s=.8+(sh%100)/150;
  if(kind==='palm'){
    mb.save();mb.tr(x,0,y);mb.rotZ(((sh%7)-3)*.03);mb.box(0,3.6*s,0,.28,7.2*s,.28,[.45,.38,.3],0,true);mb.restore();
    for(let i=0;i<7;i++){const a=i/7*TAU+(sh%10);mb.save();mb.tr(x,7.2*s,y);mb.rotY(a);mb.rotX(.5);mb.box(0,0,-1.5,.5,.05,3.0,[.25,.45,.18]);mb.restore();}
    return;
  }
  mb.box(x,1.6*s,y,.36,3.2*s,.36,COL.trunk,0,true);
  if(kind==='rain'){mb.blob(x,4.6*s,y,3.8*s,1.7*s,3.8*s,[.2,.36,.16]);mb.blob(x+.8,5.3*s,y-.5,2.4*s,1.3*s,2.4*s,[.24,.42,.18]);}
  else if(kind==='gul'){mb.blob(x,4.2*s,y,2.9*s,1.6*s,2.9*s,[.85,.28,.12]);mb.blob(x-.6,4.6*s,y+.4,1.8*s,1.1*s,1.8*s,[.3,.45,.2]);}
  else if(kind==='jac'){mb.blob(x,4.3*s,y,2.8*s,1.7*s,2.8*s,[.62,.5,.82]);}
  else{mb.blob(x,4.0*s,y,2.4*s,2.1*s,2.4*s,[.24,.4,.2]);}
}
function lampAt(mb,x,y,ax,ay){
  mb.box(x,3.6,y,.14,7.2,.14,[.45,.47,.5],0,true);
  const hx=x+ax*1.6,hy=y+ay*1.6;
  limbW(mb,[x,7.1,y],[hx,7.2,hy],.08,[.45,.47,.5]);
  mb.box(hx,7.1,hy,.5,.14,.28,[1,.86,.62],1);
}
function limbW(mb,p0,p1,w,col){limb(mb,p0,p1,w,col);}
function signalPole(mb,S,arm,heads){
  /* pole on the left of incoming traffic, just before the stop line */
  const oa=arm.ang,ox=Math.sin(oa),oy=-Math.cos(oa);
  const hin=oa+Math.PI,lx=-Math.cos(hin),ly=-Math.sin(hin);
  const d=S.R+1.2,x=S.x+ox*d+lx*(arm.hw+1.4),y=S.y+oy*d+ly*(arm.hw+1.4);
  mb.box(x,2.6,y,.16,5.2,.16,[.25,.25,.27],0,true);
  mb.save();mb.tr(x,4.6,y);mb.rotY(-oa);
  mb.box(0,0,0,.36,1.05,.26,[.1,.1,.11]);
  for(let i=0;i<3;i++){mb.box(0,.32-i*.32,-.15,.24,.24,.03,[[.3,.08,.07],[.32,.22,.05],[.06,.25,.12]][i]);mb.box(0,.32-i*.32+.13,-.2,.28,.03,.12,[.1,.1,.11]);}
  /* countdown box below the lamps, as on Bengaluru junctions */
  mb.box(0,-.72,0,.42,.3,.2,[.1,.1,.11]);
  mb.restore();
  heads.push({x,y,ang:oa,arm});
}
function shedAt(mb,g){
  mb.save();mb.tr(g.sx,0,g.sy);mb.rotY(-g.h);
  const tin=[.3,.42,.55],wall=[.62,.6,.55];
  mb.box(-2.9,1.6,0,.15,3.2,4.2,wall);mb.box(2.9,1.6,0,.15,3.2,4.2,wall);mb.box(0,1.6,2.05,5.9,3.2,.15,wall);
  mb.save();mb.tr(0,3.35,0);mb.rotX(-.12);mb.box(0,0,0,6.4,.08,4.8,tin);mb.restore();
  mb.box(0,3.1,-2.2,4.8,.7,.08,[.85,.15,.12]);mb.box(0,3.1,-2.25,4.4,.4,.02,[.98,.85,.1],.3);
  for(let i=0;i<3;i++)mb.cyl(-2.2,.18+i*.24,-1.1,.36,.22,'y',12,C.tyre);
  for(let i=0;i<2;i++)mb.cyl(2.1,.18+i*.24,-1.4,.32,.2,'y',12,C.tyre);
  mb.box(1.6,.6,1.2,.6,1.2,.5,[.7,.12,.1]);mb.box(-.4,.45,1.4,1.8,.9,.6,[.35,.35,.37]);
  mb.restore();
}

function stationAt(mb,dec,g){
  mb.save();mb.tr(g.sx,0,g.sy);mb.rotY(-g.h);
  const pil=[.85,.85,.83],roof=[.96,.96,.95],band=[.2,.24,.32];
  for(const x of[-4.5,4.5])for(const z of[-2.6,2.6])mb.box(x,2.6,z,.35,5.2,.35,pil);
  mb.box(0,5.35,0,12,.3,8,roof);mb.box(0,5.1,0,12.1,.5,8.1,band);
  for(const x of[-2.5,2.5]){mb.box(x,.12,0,1.2,.24,3.4,[.7,.7,.68]);mb.box(x,1.0,0,.7,1.6,.45,[.92,.92,.9]);mb.box(x,1.35,-.235,.5,.3,.02,[.3,.85,1],1);mb.box(x,1.35,.235,.5,.3,.02,[.3,.85,1],1);}
  mb.box(0,1.6,4.6,7,3.2,2.2,[.88,.86,.8]);mb.box(0,2.6,3.48,3,.6,.04,[.2,.24,.32]);
  mb.box(-6.6,3.2,-3.6,.25,6.4,.25,[.5,.5,.52]);mb.box(-6.6,6.6,-3.6,.5,1.6,1.6,band);
  mb.restore();
  const c=Math.cos(-g.h),s2=Math.sin(-g.h);const P2=(x,z)=>[g.sx+x*c+z*s2,g.sy-x*s2+z*c];
  const pad=[P2(-7,-5),P2(7,-5),P2(7,6),P2(-7,6)].flat();gpoly(dec,pad,[.62,.62,.6]);
}
function buildChunk(cx,cy){
  const x0=cx*CH,y0=cy*CH,x1=x0+CH,y1=y0+CH;const inC=(x,y)=>x>=x0&&x<x1&&y>=y0&&y<y1;
  const cas=new MB(),asp=new MB(),mrk=new MB(),dec=new MB(),sol=new MB(),shp=new MB(),ads=new MB(),gls=new MB();const glow=[],shad=[];
  const segs=[];gQuery(W.sG,x0+CH/2,y0+CH/2,CH*.75,segs);
  const mine=segs.filter(s=>inC((s.ax+s.bx)/2,(s.ay+s.by)/2)).sort((a,b)=>RANK[a.w.cls]-RANK[b.w.cls]);
  const verts=new Map();
  for(const s of mine){
    ribbon(cas,s.ax,s.ay,s.bx,s.by,s.w.hw+1.7,COL.walk,0,2.4);
    for(const e of[s.i,s.i+1]){const k=s.w.nodes[e];const x=s.w.pts[2*e],y=s.w.pts[2*e+1];if(!inC(x,y))continue;const v=verts.get(k);if(!v||v.hw<s.w.hw)verts.set(k,{x,y,hw:s.w.hw,cls:s.w.cls});}
  }
  for(const[,v]of verts)gdisc(cas,v.x,v.y,v.hw+1.7,COL.walk,12,2.4);
  for(const s of mine)ribbon(asp,s.ax,s.ay,s.bx,s.by,s.w.hw,COL.road[s.w.cls],0,7);
  const vs=[...verts.values()].sort((a,b)=>RANK[a.cls]-RANK[b.cls]);
  for(const v of vs)gdisc(asp,v.x,v.y,v.hw,COL.road[v.cls],12,7);
  /* lane paint */
  const sigNear=[];gQuery(W.sigG,x0+CH/2,y0+CH/2,CH,sigNear);
  const nearSig=(x,y)=>sigNear.some(S=>Math.hypot(S.x-x,S.y-y)<S.R+2);
  for(const s of mine){
    const w=s.w;const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len,nx=-dy,ny=dx;
    const jA=isJunction(w.nodes[s.i]),jB=isJunction(w.nodes[s.i+1]);
    const t0=jA?w.hw+3:0,t1=s.len-(jB?w.hw+3:0);
    if(RANK[w.cls]>=2&&!w.oneway){for(let t=t0+((s.ax*7+s.ay*3)%3+3)%3;t+3<t1;t+=7.5){const ax=s.ax+dx*t,ay=s.ay+dy*t;if(nearSig(ax,ay))continue;ribbon(mrk,ax,ay,ax+dx*3,ay+dy*3,.08,COL.paint);}}
    if(RANK[w.cls]>=3&&t1-t0>2){for(const sd of[-1,1]){const o=sd*(w.hw-.35);ribbon(mrk,s.ax+dx*t0+nx*o,s.ay+dy*t0+ny*o,s.ax+dx*t1+nx*o,s.ay+dy*t1+ny*o,.06,COL.paint);}}
    if(w.oneway&&RANK[w.cls]>=1&&s.len>30){const t=s.len/2,cx2=s.ax+dx*t,cy2=s.ay+dy*t;const sg=w.rev?-1:1;
      ribbon(mrk,cx2-dx*sg*1.6,cy2-dy*sg*1.6,cx2+dx*sg*.6,cy2+dy*sg*.6,.12,COL.paint);
      mrk.rtri([cx2+dx*sg*1.4,0,cy2+dy*sg*1.4],[cx2+dx*sg*.4+nx*.5,0,cy2+dy*sg*.4+ny*.5],[cx2+dx*sg*.4-nx*.5,0,cy2+dy*sg*.4-ny*.5],COL.paint,[0,1,0]);}
  }
  /* signals: stop lines, zebra crossings, poles */
  const heads=[];
  for(const S of W.sigs){if(!inC(S.x,S.y))continue;
    for(const arm of S.arms){const ox=Math.sin(arm.ang),oy=-Math.cos(arm.ang),px=-oy,py=ox;const hw=arm.hw;
      const sx=S.x+ox*S.R,sy=S.y+oy*S.R;ribbon(mrk,sx-px*hw,sy-py*hw,sx+px*hw,sy+py*hw,.2,COL.paint);
      for(let q=-hw+.5;q<hw-.3;q+=1.1){const zx=S.x+ox*(S.R-1.6)+px*q,zy=S.y+oy*(S.R-1.6)+py*q;ribbon(mrk,zx-ox*1.3,zy-oy*1.3,zx+ox*1.3,zy+oy*1.3,.28,COL.paint);}
      signalPole(sol,S,arm,heads);}}
  /* hazards */
  const hzs=[];gQuery(W.hG,x0+CH/2,y0+CH/2,CH*.75,hzs);
  for(const z of hzs){if(!inC(z.x,z.y))continue;
    if(z.type==='pot'){const ca=Math.cos(z.ang),sa=Math.sin(z.ang);const p=[],q=[];for(let i=0;i<z.poly.length;i+=2){const u=z.poly[i],v=z.poly[i+1];p.push(z.x+u*ca*1.3-v*sa*1.3,z.y+u*sa*1.3+v*ca*1.3);q.push(z.x+u*ca-v*sa,z.y+u*sa+v*ca);}
      gpoly(dec,p,COL.potRim);gpoly(dec,q,COL.pot);}
    else if(z.type==='bump'){const dx=Math.cos(z.ang),dy=Math.sin(z.ang),nx=-dy,ny=dx;const n=Math.max(4,Math.round(z.len*2/1.1)),st=z.len*2/n;
      for(let i=0;i<n;i++){const a=-z.len+i*st;ribbon(dec,z.x+nx*a-dx*.6,z.y+ny*a-dy*.6,z.x+nx*a+dx*.6,z.y+ny*a+dy*.6,st/2,i%2?[.1,.1,.1]:COL.yellow);}
      /* a real hump, so it reads in 3D */
      sol.save();sol.tr(z.x,0,z.y);sol.rotY(-z.ang);sol.tbox(0,0,0,1.2,z.len*2,.5,z.len*2,.1,[[.75,.62,.15],[.2,.2,.2]]);sol.restore();}
    else if(z.type==='water'){const ca=Math.cos(z.ang),sa=Math.sin(z.ang);const p=[];for(let i=0;i<14;i++){const a=i/14*TAU,r=1+((i*37)%5)/20;p.push(z.x+(Math.cos(a)*z.r*1.6*r)*ca-(Math.sin(a)*z.r*r)*sa,z.y+(Math.cos(a)*z.r*1.6*r)*sa+(Math.sin(a)*z.r*r)*ca);}
      gpoly(dec,p,COL.puddle);glowQuad(glow,z.x,z.y,z.r*.8,[.18,.2,.22],.04);}
  }
  /* buildings */
  const bl=[];gQuery(W.bG,x0+CH/2,y0+CH/2,CH*.75,bl);
  for(const b of bl){if(!inC(b.cx,b.cy)||b.hide)continue;
    const p=b.pts,n=p.length/2,h=b.h,col=b.col;const ccw=polyArea(p)>0;
    const posh=h>7&&!b.kiosk&&poshAt(b.cx,b.cy)>.5&&((hash2(Math.round(b.cx),Math.round(b.cy))>>>0)%10<8);
    let run=0,adE=null;
    for(let i=0;i<n;i++){const j=(i+1)%n;const ax=p[2*i],ay=p[2*i+1],bx=p[2*j],by=p[2*j+1];const L=Math.hypot(bx-ax,by-ay);if(L<.05)continue;
      const ex=bx-ax,ey=by-ay;const out=ccw?[ey,0,-ex]:[-ey,0,ex];
      const u0=run/13.6,u1=(run+L)/13.6,v1=h/12.4;run+=L;
      let y0=0;
      if(h>5&&L>3.5){const ol=Math.hypot(out[0],out[2])||1;const mx=(ax+bx)/2+out[0]/ol*1.5,my=(ay+by)/2+out[2]/ol*1.5;const ns=nearestSeg(mx,my,12);
        if(ns.seg&&ns.edge<6.5&&!inBuilding(mx,my)){const r0=(run-L)/16.8,r1=run/16.8,su0=ccw?r1:r0,su1=ccw?r0:r1,F=[1,1,1];
          shp.rtri([ax,0,ay],[bx,0,by],[bx,3.4,by],F,out,[su0,1,su1,1,su1,0]);shp.rtri([ax,0,ay],[bx,3.4,by],[ax,3.4,ay],F,out,[su0,1,su1,0,su0,0]);y0=3.4;}}
      if(!adE&&h>=6&&h<=40&&L>8){const ol2=Math.hypot(out[0],out[2])||1,nx=out[0]/ol2,ny=out[2]/ol2,mx2=(ax+bx)/2,my2=(ay+by)/2;const ns2=nearestSeg(mx2+nx*9,my2+ny*9,16);if(ns2.seg&&RANK[ns2.seg.w.cls]>=2&&!inBuilding(mx2+nx*2,my2+ny*2))adE=[ax,ay,bx,by,L,nx,ny];}
      const vy=(h-y0)/12.4;
      if(posh){const g0=run/12-L/12,g1=run/12,gv=(h-y0)/12,GC=[.9,.95,1];gls.rtri([ax,y0,ay],[bx,y0,by],[bx,h,by],GC,out,[g0,gv,g1,gv,g1,0]);gls.rtri([ax,y0,ay],[bx,h,by],[ax,h,ay],GC,out,[g0,gv,g1,0,g0,0]);
        if(y0>0){const sc=[.85,.84,.8];sol.rtri([ax,y0-.25,ay],[bx,y0-.25,by],[bx,y0+.05,by],sc,out,[.01,.01,.01,.01,.01,.01]);sol.rtri([ax,y0-.25,ay],[bx,y0+.05,by],[ax,y0+.05,ay],sc,out,[.01,.01,.01,.01,.01,.01]);}}
      else{sol.rtri([ax,y0,ay],[bx,y0,by],[bx,h,by],col,out,[u0,vy,u1,vy,u1,0]);
      sol.rtri([ax,y0,ay],[bx,h,by],[ax,h,ay],col,out,[u0,vy,u1,0,u0,0]);}
    }
    if(adE&&h>=6&&h<=40){const hh=hash2(Math.round(b.cx*3),Math.round(b.cy*3));if((hh>>>0)%100<18)hoardingAt(sol,ads,b,adE[0],adE[1],adE[2],adE[3],adE[5],adE[6],hh>>>3);}
    const roof=posh?[.62,.64,.66]:col.map(v=>v*.78);const tri=triangulate(p);
    for(let i=0;i<tri.length;i+=3){const a=tri[i],bb=tri[i+1],c=tri[i+2];sol.rtri([p[2*a],h,p[2*a+1]],[p[2*bb],h,p[2*bb+1]],[p[2*c],h,p[2*c+1]],roof,[0,1,0],[.01,.01,.01,.01,.01,.01]);}
    if(h>4){for(let i=0;i<n;i++){const j=(i+1)%n;const ax=p[2*i],ay=p[2*i+1],bx=p[2*j],by=p[2*j+1];if(Math.hypot(bx-ax,by-ay)<.5)continue;const ex=bx-ax,ey=by-ay;const out=ccw?[ey,0,-ex]:[-ey,0,ex];
      sol.rtri([ax,h,ay],[bx,h,by],[bx,h+.5,by],roof,out,[.01,.01,.01,.01,.01,.01]);sol.rtri([ax,h,ay],[bx,h+.5,by],[ax,h+.5,ay],roof,out,[.01,.01,.01,.01,.01,.01]);}}
    if(b.tank){const tx=b.cx+(b.minx-b.cx)*.45,ty=b.cy+(b.miny-b.cy)*.45;if(inPoly(tx,ty,p)){sol.cyl(tx,h+.75,ty,.6,1.1,'y',10,[.08,.08,.09]);sol.box(tx,h+.1,ty,1.1,.2,1.1,[.5,.5,.5]);}}
  }
  /* trees and street lamps along the roads */
  const trees=[];
  for(const s of mine){const w=s.w;if(w.br)continue;const rk=RANK[w.cls];
    const dx=(s.bx-s.ax)/s.len,dy=(s.by-s.ay)/s.len,nx=-dy,ny=dx;
    const rnd=mulberry32(hash2(Math.round(s.ax*5),Math.round(s.by*5)));
    const pTree={service:.15,living_street:.4,residential:.55,unclassified:.5,tertiary:.55,secondary:.5,primary:.45,trunk:.35,motorway:.2}[w.cls]||.4;
    const jA=isJunction(w.nodes[s.i]),jB=isJunction(w.nodes[s.i+1]);
    for(let t=4+rnd()*10;t<s.len-4;t+=14+rnd()*12){if((jA&&t<w.hw+8)||(jB&&t>s.len-w.hw-8))continue;
      for(const sd of[-1,1]){if(rnd()>pTree)continue;const off=w.hw+2.5+rnd()*.8;const x=s.ax+dx*t+nx*off*sd,y=s.ay+dy*t+ny*off*sd;
        if(inBuilding(x,y)||inBuilding(x+nx*sd*2,y+ny*sd*2))continue;if(nearSignal(x,y,4))continue;
        const sh=hash2(Math.round(x*10),Math.round(y*10));treeAt(sol,x,y,(sh%1000)/1000,sh);trees.push({x,y,_q:0});glowQuad(shad,x,y,3.4,[0,0,0],.03);}}
    if(rk>=1&&w.cls!=='service'){const gap=rk>=3?30:38;let side=1;
      for(let t=gap*.5+rnd()*6;t<s.len-3;t+=gap){side=-side;const off=w.hw+1.0;const x=s.ax+dx*t+nx*off*side,y=s.ay+dy*t+ny*off*side;if(nearSignal(x,y,2))continue;
        lampAt(sol,x,y,-nx*side,-ny*side);glowQuad(glow,x-nx*side*1.6,y-ny*side*1.6,8.5,[1,.78,.5]);}}
  }
  for(const t of trees)gAdd(W.tG,Math.floor(t.x/CELL),Math.floor(t.y/CELL),t);
  for(const g of W.garages)if(inC(g.sx,g.sy))shedAt(sol,g);
  for(const g of W.fuels||[])if(inC(g.sx,g.sy))stationAt(sol,dec,g);
  if(W.court&&inC(W.court.sx,W.court.sy))courtAt(sol,W.court);
  cityChunk(sol,dec,mine,inC);
  doorsChunk(sol,inC,x0+CH/2,y0+CH/2);
  return {cx,cy,v:W.version,gls:gls.mesh(),ads:ads.mesh(),cas:cas.mesh(),asp:asp.mesh(),mrk:mrk.mesh(),dec:dec.mesh(),sol:sol.mesh(),shp:shp.mesh(),glow:makeGlowMesh(glow),shad:makeGlowMesh(shad),heads};
}
function freeChunk(c){for(const k of['cas','asp','mrk','dec','sol','shp','ads','gls','glow','shad'])freeMesh(c[k]);}
function clearChunks(){for(const[,c]of CHUNKS)freeChunk(c);CHUNKS.clear();W.tG=new Map();for(const o of (typeof METRO!=='undefined'&&METRO.piers)||[])gAdd(W.tG,Math.floor(o.x/CELL),Math.floor(o.y/CELL),o);}
function updateChunks(px,py,budgetMs){
  const R=settings.gfx==='fast'?360:settings.gfx==='ultra'?560:460;
  for(const[k,c]of CHUNKS){const dx=(c.cx+.5)*CH-px,dy=(c.cy+.5)*CH-py;if(Math.hypot(dx,dy)>R+300||c.v!==W.version&&c.stale){freeChunk(c);CHUNKS.delete(k);}}
  const t0=performance.now();const ccx=Math.floor(px/CH),ccy=Math.floor(py/CH);const n=Math.ceil(R/CH)+1;
  const want=[];
  for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const cx=ccx+i,cy=ccy+j;const d=Math.hypot((cx+.5)*CH-px,(cy+.5)*CH-py);if(d>R+CH*.7)continue;const k=cx+','+cy;const c=CHUNKS.get(k);if(c&&c.v===W.version)continue;want.push([d,cx,cy,k]);}
  want.sort((a,b)=>a[0]-b[0]);
  for(const[,cx,cy,k]of want){
    const old=CHUNKS.get(k);const c=buildChunk(cx,cy);if(old)freeChunk(old);CHUNKS.set(k,c);
    if(performance.now()-t0>budgetMs)break;
  }
  return want.length;
}

/* ---------- time of day from the real sun ---------- */
function solar(date,lat,lon){
  const rad=Math.PI/180;const n=date.getTime()/86400000+2440587.5-2451545.0;
  const L=(280.460+.9856474*n)%360,g=((357.528+.9856003*n)%360)*rad;
  const lam=(L+1.915*Math.sin(g)+.020*Math.sin(2*g))*rad,eps=(23.439-.0000004*n)*rad;
  const ra=Math.atan2(Math.cos(eps)*Math.sin(lam),Math.cos(lam)),dec=Math.asin(Math.sin(eps)*Math.sin(lam));
  const gmst=((18.697374558+24.06570982441908*n)%24+24)%24;
  let ha=(gmst*15+lon)*rad-ra;ha=Math.atan2(Math.sin(ha),Math.cos(ha));
  const la=lat*rad;
  const el=Math.asin(Math.sin(la)*Math.sin(dec)+Math.cos(la)*Math.cos(dec)*Math.cos(ha));
  const az=Math.atan2(Math.sin(ha),Math.cos(ha)*Math.sin(la)-Math.tan(dec)*Math.cos(la));
  return {el:el/rad,az,haH:ha/rad/15};
}
const TODFIX={dawn:{el:-2,az:-1.7,haH:-6},noon:{el:78,az:.3,haH:0},evening:{el:6,az:1.6,haH:5.4},night:{el:-25,az:2.5,haH:9}};
/* keyframes by sun elevation: sky top, horizon, ground ambient, sky ambient, sun colour */
const TODK=[
  [-14,{top:[.03,.05,.12],hor:[.12,.13,.22],sky:[.22,.24,.34],gnd:[.11,.11,.13],sun:[.3,.34,.48],fog:[.1,.12,.2]}],
  [-5,{top:[.08,.1,.24],hor:[.42,.3,.4],sky:[.27,.27,.36],gnd:[.13,.12,.13],sun:[.36,.3,.38],fog:[.36,.28,.38]}],
  [2,{top:[.2,.3,.55],hor:[.95,.6,.45],sky:[.36,.34,.42],gnd:[.18,.15,.14],sun:[.75,.45,.3],fog:[.82,.58,.48]}],
  [10,{top:[.3,.52,.82],hor:[.98,.8,.6],sky:[.44,.44,.5],gnd:[.24,.21,.18],sun:[.95,.72,.5],fog:[.86,.78,.68]}],
  [25,{top:[.25,.52,.88],hor:[.72,.84,.94],sky:[.46,.5,.58],gnd:[.27,.25,.22],sun:[.92,.88,.78],fog:[.72,.82,.9]}],
  [60,{top:[.2,.5,.92],hor:[.78,.88,.96],sky:[.48,.52,.6],gnd:[.29,.27,.24],sun:[1,.96,.86],fog:[.78,.86,.92]}],
];
let TOD={el:40,phase:'day',label:'Day',night:0,sunDir:[0,1,0]};
function computeTod(){
  const o=MAP.origin||{lat:12.97,lon:77.59};
  const s=settings.tod==='auto'?solar(new Date(),o.lat,o.lon):TODFIX[settings.tod];
  const el=s.el,am=s.haH<0;
  let label;
  if(el<-6)label='Night';else if(el<3)label=am?'Dawn':'Dusk';else if(el<18)label=am?'Morning':'Evening';else if(Math.abs(s.haH)<1.6&&el>45)label='Noon';else label=am?'Morning':'Afternoon';
  let a=TODK[0],b=TODK[TODK.length-1];
  for(let i=0;i<TODK.length-1;i++){if(el>=TODK[i][0]&&el<=TODK[i+1][0]){a=TODK[i];b=TODK[i+1];break;}}
  if(el<TODK[0][0])b=a;if(el>TODK[TODK.length-1][0])a=b;
  const t=a===b?0:clamp((el-a[0])/(b[0]-a[0]),0,1);const L=k=>a[1][k].map((v,i)=>lerp(v,b[1][k][i],t));
  const ce=Math.cos(Math.max(el,4)*Math.PI/180);
  let sunDir=[-Math.sin(s.az)*ce,Math.sin(Math.max(el,4)*Math.PI/180),Math.cos(s.az)*ce];
  if(el<-4)sunDir=[.35,.8,.45];
  const l=Math.hypot(...sunDir);sunDir=sunDir.map(v=>v/l);
  TOD={el,label,night:clamp((4-el)/14,0,1),sunDir,top:L('top'),hor:L('hor'),sky:L('sky'),gnd:L('gnd'),sun:L('sun'),fog:L('fog'),sunC:el>-3?L('sun').map(v=>v*clamp((el+3)/8,0,1)):[0,0,0]};
}

/* ---------- camera ---------- */
const CAM={mode:settings.cam||'chase',eye:[0,5,10],tgt:[0,0,0],fov:62,yaw:0,shake:0,vp:new Float32Array(16),proj:new Float32Array(16),view:new Float32Array(16),inv:new Float32Array(16),right:[1,0,0],fwd:[0,0,-1]};
function pierAt(x,y){const q=[];gQuery(W.tG,x,y,2,q);for(const t of q)if(t.pier&&Math.hypot(t.x-x,t.y-y)<t.r+.35)return true;return false;}
function setupCamera(dt,P,V,model){
  const sp=Math.abs(P.s),top=V.top/3.6,frac=clamp(sp/top,0,1);
  const fx=Math.sin(P.h),fz=-Math.cos(P.h);
  /* on foot the camera stays where you put it (swipe to turn it); in vehicles it follows the heading, plus a swipe offset that springs back */
  CAM.free=FOOT.on&&!FOOT.ride&&!METRO.ride&&CAM.mode!=='cockpit';
  if(!CAM.free)CAM.yaw+=angDiff(CAM.yaw,P.h)*Math.min(1,dt*(CAM.mode==='cockpit'?20:4.5));
  if(CAM.free||CAM.mode==='cockpit')CAM.look=0;else if(!CAM.lookHeld)CAM.look=(CAM.look||0)*Math.pow(.25,dt);
  const yawC=CAM.yaw+(CAM.look||0),cyx=Math.sin(yawC),cyz=-Math.cos(yawC);
  const sh=CAM.shake;const jx=(Math.random()-.5)*sh*.08,jy=(Math.random()-.5)*sh*.08;
  const bump=P.bounce*.12+P.air*.6;
  let near=.2;
  if(CAM.mode==='cockpit'){
    const M=P.M;const e=M4.xform(M,model.eye[0],model.eye[1],model.eye[2]);
    const f=M4.xform(M,model.eye[0],model.eye[1]-.6-bump*2,model.eye[2]-10);
    CAM.eye=[e[0]+jx,e[1]+jy,e[2]];CAM.tgt=f;CAM.fov=lerp(CAM.fov,70+frac*16,Math.min(1,dt*3));near=.04;
  }else{
    const far=CAM.mode==='far';const L=model.len||2;
    const dist=far?30:(3.6+L*1.25)+frac*2.2,ht=far?30:(1.7+L*.32)+frac*.4;
    /* keep the camera out of buildings: pull it in along the line to the player */
    let cd=dist;if(!far&&!inBuilding(P.x,P.y)){for(let t=.8;t<dist;t+=.35){const qx=P.x-cyx*t,qy=P.y-cyz*t,b=inBuilding(qx,qy);if((b&&b.h>1.3+(ht-1.3)*t/dist)||pierAt(qx,qy)){cd=Math.max(.9,t-.4);break;}}}
    CAM.cd=CAM.cd==null||far?cd:cd<CAM.cd?cd:lerp(CAM.cd,cd,Math.min(1,dt*2.2));const cdx=Math.min(CAM.cd,dist),hh=1.3+(ht-1.3)*cdx/dist;
    CAM.eye=[P.x-cyx*cdx+jx,hh+jy+bump,P.y-cyz*cdx];
    const lf=CAM.free||CAM.look?[cyx,cyz]:[fx,fz];CAM.tgt=[P.x+lf[0]*(far?8:6),far?0:1.1+(CAM.pitch||0),P.y+lf[1]*(far?8:6)];
    CAM.fov=lerp(CAM.fov,(far?55:62)+frac*(far?0:18),Math.min(1,dt*3));
  }
  CAM.shake*=Math.pow(.02,dt);
  const asp=glc.width/glc.height;
  const up=[0,1,0];let roll=0;if(CAM.mode==='cockpit'&&V.cat==='two')roll=P.lean*.35;
  if(roll){up[0]=Math.sin(roll)*Math.cos(P.h);up[2]=Math.sin(roll)*Math.sin(P.h);up[1]=Math.cos(roll);}
  M4.persp(CAM.proj,CAM.fov*Math.PI/180,asp,near,1400);
  M4.lookAt(CAM.view,CAM.eye,CAM.tgt,up);
  M4.mul(CAM.vp,CAM.proj,CAM.view);M4.invert(CAM.inv,CAM.vp);
  const dx=CAM.tgt[0]-CAM.eye[0],dz=CAM.tgt[2]-CAM.eye[2],dl=Math.hypot(dx,dz)||1;
  CAM.fwd=[dx/dl,0,dz/dl];CAM.right=[-dz/dl,0,dx/dl];
}
