'use strict';
/* ================= core helpers ================= */
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
function angDiff(a,b){let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash2(x,y){let h=Math.imul((x|0)^0x9E3779B9,0x85EBCA6B)^Math.imul(((y|0)+0x632BE5AB)|0,0xC2B2AE35);h^=h>>>13;h=Math.imul(h,0x27D4EB2F);return (h^h>>>16)>>>0;}
function hashStr(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const IS_NATIVE=!!window.OoshtNative;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function hexRGB(h){const n=parseInt(h.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
function fmtINR(n){return Math.round(n).toLocaleString('en-IN');}

const store={get(k,d){try{const v=localStorage.getItem('oosht.'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem('oosht.'+k,JSON.stringify(v));}catch(e){}}};
const settings=Object.assign({sound:true,haptics:'med',steer:'buttons',tod:'auto',gfx:'balanced',cam:'chase'},store.get('settings',{}));
const profile=Object.assign({wallet:500,km:0,trips:0,vehicle:'auto',challans:0,suspendedUntil:0,pending:[],seized:false},store.get('profile',{}));
if(profile.wallet<0)profile.wallet=0;
const saveSettings=()=>store.set('settings',settings);
const saveProfile=()=>store.set('profile',profile);

/* ================= 4x4 matrices (column-major) ================= */
const M4={
  create(){const m=new Float32Array(16);m[0]=m[5]=m[10]=m[15]=1;return m;},
  persp(o,fovy,asp,n,f){const t=1/Math.tan(fovy/2);o.fill(0);o[0]=t/asp;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o;},
  lookAt(o,e,c,u){
    let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2];let l=Math.hypot(zx,zy,zz)||1;zx/=l;zy/=l;zz/=l;
    let xx=u[1]*zz-u[2]*zy,xy=u[2]*zx-u[0]*zz,xz=u[0]*zy-u[1]*zx;l=Math.hypot(xx,xy,xz)||1;xx/=l;xy/=l;xz/=l;
    const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
    o[0]=xx;o[1]=yx;o[2]=zx;o[3]=0;o[4]=xy;o[5]=yy;o[6]=zy;o[7]=0;o[8]=xz;o[9]=yz;o[10]=zz;o[11]=0;
    o[12]=-(xx*e[0]+xy*e[1]+xz*e[2]);o[13]=-(yx*e[0]+yy*e[1]+yz*e[2]);o[14]=-(zx*e[0]+zy*e[1]+zz*e[2]);o[15]=1;return o;
  },
  mul(o,a,b){
    const r=new Float32Array(16);
    for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];r[i*4+j]=s;}
    o.set(r);return o;
  },
  /* translation + yaw (about Y) * pitch (about X) * roll (about Z) + uniform scale */
  model(o,x,y,z,yaw,pitch,roll,s){
    s=s||1;const ca=Math.cos(yaw),sa=Math.sin(yaw),cb=Math.cos(pitch||0),sb=Math.sin(pitch||0),cc=Math.cos(roll||0),sc=Math.sin(roll||0);
    /* R = Ry*Rx*Rz */
    const r00=ca*cc+sa*sb*sc, r01=-ca*sc+sa*sb*cc, r02=sa*cb;
    const r10=cb*sc,          r11=cb*cc,           r12=-sb;
    const r20=-sa*cc+ca*sb*sc,r21=sa*sc+ca*sb*cc,  r22=ca*cb;
    o[0]=r00*s;o[1]=r10*s;o[2]=r20*s;o[3]=0;o[4]=r01*s;o[5]=r11*s;o[6]=r21*s;o[7]=0;o[8]=r02*s;o[9]=r12*s;o[10]=r22*s;o[11]=0;o[12]=x;o[13]=y;o[14]=z;o[15]=1;return o;
  },
  xform(m,x,y,z){return [m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]];},
  invert(o,m){
    const a00=m[0],a01=m[1],a02=m[2],a03=m[3],a10=m[4],a11=m[5],a12=m[6],a13=m[7],a20=m[8],a21=m[9],a22=m[10],a23=m[11],a30=m[12],a31=m[13],a32=m[14],a33=m[15];
    const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
    let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;if(!det)return null;det=1/det;
    o[0]=(a11*b11-a12*b10+a13*b09)*det;o[1]=(a02*b10-a01*b11-a03*b09)*det;o[2]=(a31*b05-a32*b04+a33*b03)*det;o[3]=(a22*b04-a21*b05-a23*b03)*det;
    o[4]=(a12*b08-a10*b11-a13*b07)*det;o[5]=(a00*b11-a02*b08+a03*b07)*det;o[6]=(a32*b02-a30*b05-a33*b01)*det;o[7]=(a20*b05-a22*b02+a23*b01)*det;
    o[8]=(a10*b10-a11*b08+a13*b06)*det;o[9]=(a01*b08-a00*b10-a03*b06)*det;o[10]=(a30*b04-a31*b02+a33*b00)*det;o[11]=(a21*b02-a20*b04-a23*b00)*det;
    o[12]=(a11*b07-a10*b09-a12*b06)*det;o[13]=(a00*b09-a01*b07+a02*b06)*det;o[14]=(a31*b01-a30*b03-a32*b00)*det;o[15]=(a20*b03-a21*b01+a22*b00)*det;return o;
  }
};

/* ================= spatial grid ================= */
const CELL=60;
const ck=(ix,iy)=>(ix+30000)*60000+(iy+30000);
function gAdd(g,ix,iy,v){const k=ck(ix,iy);let a=g.get(k);if(!a){a=[];g.set(k,a);}a.push(v);}
function gAddBox(g,x0,y0,x1,y1,v){const a=Math.floor(x0/CELL),b=Math.floor(x1/CELL),c=Math.floor(y0/CELL),d=Math.floor(y1/CELL);for(let i=a;i<=b;i++)for(let j=c;j<=d;j++)gAdd(g,i,j,v);}
let qStamp=1;
function gQuery(g,x,y,r,out){
  out.length=0;const s=++qStamp;
  const a=Math.floor((x-r)/CELL),b=Math.floor((x+r)/CELL),c=Math.floor((y-r)/CELL),d=Math.floor((y+r)/CELL);
  for(let i=a;i<=b;i++)for(let j=c;j<=d;j++){const arr=g.get(ck(i,j));if(!arr)continue;for(const v of arr){if(v._q!==s){v._q=s;out.push(v);}}}
  return out;
}
function segDistXY(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy||1e-9;let t=((px-ax)*dx+(py-ay)*dy)/L2;t=t<0?0:t>1?1:t;return Math.hypot(ax+dx*t-px,ay+dy*t-py);}
function inPoly(x,y,p){let c=false;for(let i=0,n=p.length/2,j=n-1;i<n;j=i++){const xi=p[2*i],yi=p[2*i+1],xj=p[2*j],yj=p[2*j+1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;}
function polyArea(p){let a=0;const n=p.length/2;for(let i=0,j=n-1;i<n;j=i++)a+=p[2*j]*p[2*i+1]-p[2*i]*p[2*j+1];return a/2;}

/* ear-clipping triangulation for simple polygons [x,y,...] -> index triples */
function triangulate(p){
  let n=p.length/2;if(n<3)return [];
  if(n>2 && p[0]===p[2*n-2] && p[1]===p[2*n-1])n--;
  const idx=[];for(let i=0;i<n;i++)idx.push(i);
  if(polyArea(p.slice(0,2*n))<0)idx.reverse();
  const out=[];let guard=0;
  const X=i=>p[2*i],Y=i=>p[2*i+1];
  const cross=(a,b,c)=>(X(b)-X(a))*(Y(c)-Y(a))-(Y(b)-Y(a))*(X(c)-X(a));
  while(idx.length>3&&guard++<n*n+50){
    let found=false;
    for(let i=0;i<idx.length;i++){
      const a=idx[(i+idx.length-1)%idx.length],b=idx[i],c=idx[(i+1)%idx.length];
      if(cross(a,b,c)<=1e-9)continue;
      let inside=false;
      for(const q of idx){if(q===a||q===b||q===c)continue;
        if(cross(a,b,q)>=0&&cross(b,c,q)>=0&&cross(c,a,q)>=0){inside=true;break;}}
      if(inside)continue;
      out.push(a,b,c);idx.splice(i,1);found=true;break;
    }
    if(!found)break;
  }
  if(idx.length===3)out.push(idx[0],idx[1],idx[2]);
  else if(idx.length>3){for(let i=1;i<idx.length-1;i++)out.push(idx[0],idx[i],idx[i+1]);}
  return out;
}
