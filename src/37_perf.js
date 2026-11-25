/* ================= WISE CITY: smoothness. Frame-time smoothing, a per-frame budget for building people,
   and timing counters for the heavy jobs ================= */
const PERF={chunk:[],rig:[],frame:[],upd:[],rigN:0,rigFrame:0};
function perfPush(a,v){a.push(v);if(a.length>240)a.shift();}
{const _bc=buildChunk;buildChunk=function(cx,cy){const t=performance.now();const r=_bc(cx,cy);perfPush(PERF.chunk,performance.now()-t);return r;};}
{const _hr=humanRig;humanRig=function(a,b,c,d){const t=performance.now();const r=_hr(a,b,c,d);perfPush(PERF.rig,performance.now()-t);PERF.rigN++;return r;};}
{const _rs=renderScene;renderScene=function(dt){const t=performance.now();_rs(dt);perfPush(PERF.frame,performance.now()-t);};}
{const _up=update;update=function(dt){const t=performance.now();_up(dt);perfPush(PERF.upd,performance.now()-t);};}
Object.assign(window.__oosht||{},{PERF,updateChunksF:(a,b,c)=>updateChunks(a,b,c)});
/* ---------- faster smooth ellipsoids: flat arrays, one winding test per shape, no per-vertex allocations ---------- */
MB.prototype.ell=function(cx,cy,cz,rx,ry,rz,col,U,V){const big=Math.max(rx,ry,rz);if(!U){if(big<.03)return this.blob(cx,cy,cz,rx,ry,rz,col);U=big>.09?10:big>.05?8:6;V=big>.09?7:big>.05?5:4;}
  const m=this.m,t=this.t,N=(U+1)*(V+1),ps=new Float64Array(N*3),ns=new Float64Array(N*3);let q=0;
  for(let j=0;j<=V;j++){const ph=j/V*Math.PI,sy=Math.cos(ph),sr=Math.sin(ph);for(let i=0;i<=U;i++,q+=3){const th=i/U*TAU,ux=Math.cos(th)*sr,uz=Math.sin(th)*sr;
    const lx=cx+ux*rx,ly=cy+sy*ry,lz=cz+uz*rz;ps[q]=m[0]*lx+m[3]*ly+m[6]*lz+t[0];ps[q+1]=m[1]*lx+m[4]*ly+m[7]*lz+t[1];ps[q+2]=m[2]*lx+m[5]*ly+m[8]*lz+t[2];
    const ax=ux/rx,ay=sy/ry,az=uz/rz;let nx=m[0]*ax+m[3]*ay+m[6]*az,ny=m[1]*ax+m[4]*ay+m[7]*az,nz=m[2]*ax+m[5]*ay+m[8]*az;const l=Math.hypot(nx,ny,nz)||1;ns[q]=nx/l;ns[q+1]=ny/l;ns[q+2]=nz/l;}}
  /* winding: test one quad near the equator against its outward normal */
  const W1=U+1,jm=Math.max(0,(V>>1)-1),a0=(jm*W1)*3,b0=(jm*W1+1)*3,c0=((jm+1)*W1+1)*3;
  const ux=ps[b0]-ps[a0],uy=ps[b0+1]-ps[a0+1],uz=ps[b0+2]-ps[a0+2],vx=ps[c0]-ps[a0],vy=ps[c0+1]-ps[a0+1],vz=ps[c0+2]-ps[a0+2];
  const flip=((uy*vz-uz*vy)*ns[a0]+(uz*vx-ux*vz)*ns[a0+1]+(ux*vy-uy*vx)*ns[a0+2])<0;
  const d=this.d,r=col[0],g=col[1],b=col[2];const put=k=>{k*=3;d.push(ps[k],ps[k+1],ps[k+2],ns[k],ns[k+1],ns[k+2],r,g,b,0,0,0);};
  for(let j=0;j<V;j++)for(let i=0;i<U;i++){const A=j*W1+i,B=A+1,C=A+W1+1,D=A+W1;
    if(j>0){if(flip){put(A);put(C);put(B);}else{put(A);put(B);put(C);}}
    if(j<V-1){if(flip){put(A);put(D);put(C);}else{put(A);put(C);put(D);}}}
  return this;};
/* ---------- tree templates: each kind is shaped once, then copied into place ---------- */
const TREET=new Map();const _treeAtSlow=treeAt;
treeAt=function(mb,x,y,r,sh){const m=mb.m,t=mb.t;
  if(!(m[0]===1&&m[4]===1&&m[8]===1&&m[1]===0&&m[2]===0&&m[3]===0&&m[5]===0&&m[6]===0&&m[7]===0&&t[0]===0&&t[1]===0&&t[2]===0))return _treeAtSlow(mb,x,y,r,sh);
  const kind=r<.08?0:r<.17?1:r<.25?2:r<.6?3:4,vari=(sh>>>5)%4,key=kind*8+vari;let T=TREET.get(key);
  if(!T){const tmp=new MB();const rr=[.04,.12,.2,.4,.8][kind];_treeAtSlow(tmp,0,0,rr,vari*1013+7+(sh%100)*0);T=new Float32Array(tmp.d);TREET.set(key,T);}
  const s=.88+(sh%100)/300,d=mb.d,n=T.length;
  let o=d.length;d.length=o+n;for(let i=0;i<n;i+=12,o+=12){d[o]=T[i]*s+x;d[o+1]=T[i+1]*s;d[o+2]=T[i+2]*s+y;d[o+3]=T[i+3];d[o+4]=T[i+4];d[o+5]=T[i+5];d[o+6]=T[i+6];d[o+7]=T[i+7];d[o+8]=T[i+8];d[o+9]=T[i+9];d[o+10]=T[i+10];d[o+11]=T[i+11];}};
/* ---------- chunk streaming: build on alternate frames unless the ground under Tony is missing ---------- */
let CHF=0;
{const _ucP=updateChunks;updateChunks=function(px,py,budget){CHF++;const k=Math.floor(px/CH)+','+Math.floor(py/CH);const c=CHUNKS.get(k);const urgent=!c||c.v!==W.version;
  if(!urgent&&(CHF&1)&&budget<50)return 1;return _ucP(px,py,budget);};}
/* ---------- people: at most two new close-up figures are shaped per frame; the rest use the light figure until then ---------- */
{const _rgP=rig;rig=function(look,sk,pn,wk,far){
  if(!far&&PERF.rigFrame>=2&&look!==PLOOK&&look._id!=null){const key=look._id+'|'+SKINS.indexOf(sk)+'|'+pn+'|'+(wk||'');if(!HRIGS.has(key))return _rgP(look,sk,pn.replace(/~h-?\d/,''),wk,true);}
  return _rgP(look,sk,pn,wk,far);};
 const _hrP=humanRig;humanRig=function(a,b,c,d){PERF.rigFrame++;return _hrP(a,b,c,d);};
 const _rsP=renderScene;renderScene=function(dt){PERF.rigFrame=0;_rsP(dt);};}
