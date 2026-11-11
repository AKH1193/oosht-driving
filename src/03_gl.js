/* ================= WebGL engine ================= */
let gl=null,glc=null;
const IDENT=M4.create();
let PL,PG,PS,PK,PD; /* programs: lit, glow, sprite, sky, shadow depth */
let curProg=null,frameId=0;
const FU={}; /* per-frame uniforms */
let TEX={};

const PREC=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;
const LIT_VS=`precision highp float;
attribute vec3 aPos;attribute vec3 aNor;attribute vec3 aCol;attribute vec2 aUv;attribute float aEmi;
uniform mat4 uVP;uniform mat4 uM;uniform mat4 uLVP;
varying vec3 vNor;varying vec3 vCol;varying vec2 vUv;varying float vEmi;varying vec3 vW;varying vec4 vL;
void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vNor=(uM*vec4(aNor,0.0)).xyz;vCol=aCol;vUv=aUv;vEmi=aEmi;vL=uLVP*w;gl_Position=uVP*w;}`;
const LIT_FS=PREC+`
varying vec3 vNor;varying vec3 vCol;varying vec2 vUv;varying float vEmi;varying vec3 vW;
uniform vec3 uSunDir;uniform vec3 uSunCol;uniform vec3 uSky;uniform vec3 uGnd;uniform vec3 uFogCol;uniform vec3 uCam;
uniform vec3 uTint;uniform vec3 uEmiAdd;uniform vec3 uHLPos;uniform vec3 uHLDir;
uniform vec2 uFog;uniform float uUseTex;uniform float uNight;uniform float uHL;uniform float uEmiK;uniform float uAlpha;
uniform sampler2D uTex;uniform sampler2D uEmTex;uniform sampler2D uShadow;uniform float uShOn;uniform float uWet;uniform float uShTx;
varying vec4 vL;
float unpackD(vec4 c){return dot(c,vec4(1.0,1.0/255.0,1.0/65025.0,1.0/16581375.0));}
float shadowAt(vec3 n){
  vec3 p=vL.xyz/vL.w*0.5+0.5;
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0||p.z>1.0)return 1.0;
  float b=0.0012+0.004*(1.0-clamp(dot(n,uSunDir),0.0,1.0));float s=0.0;
  s+=step(p.z-b,unpackD(texture2D(uShadow,p.xy+vec2(-0.6,-0.6)*uShTx)));
  s+=step(p.z-b,unpackD(texture2D(uShadow,p.xy+vec2(0.6,-0.6)*uShTx)));
  s+=step(p.z-b,unpackD(texture2D(uShadow,p.xy+vec2(-0.6,0.6)*uShTx)));
  s+=step(p.z-b,unpackD(texture2D(uShadow,p.xy+vec2(0.6,0.6)*uShTx)));
  s*=0.25;
  float e=max(abs(p.x*2.0-1.0),abs(p.y*2.0-1.0));
  return mix(s,1.0,smoothstep(0.85,1.0,e));
}
void main(){
  vec3 n=normalize(vNor);
  vec3 base=vCol*uTint;
  if(uUseTex>0.5){base*=texture2D(uTex,vUv).rgb;}
  float up=clamp(n.y,0.0,1.0);
  if(uWet>0.0){base*=1.0-0.38*uWet*up;}
  float dif=max(dot(n,uSunDir),0.0);
  if(uShOn>0.5&&dif>0.0)dif*=shadowAt(n);
  vec3 amb=mix(uGnd,uSky,n.y*0.5+0.5);
  vec3 c=base*(amb+uSunCol*dif);
  if(uHL>0.0){vec3 L=vW-uHLPos;float d=length(L);vec3 Ld=L/max(d,0.001);
    float s=smoothstep(0.78,0.93,dot(Ld,uHLDir));float fall=1.0/(1.0+d*d*0.003);
    c+=min(base*vec3(1.0,0.93,0.78)*s*fall*uHL*(0.25+0.75*max(dot(n,-Ld),0.0))*1.6,vec3(0.55));}
  if(uUseTex>0.5){c+=texture2D(uEmTex,vUv).rgb*uNight;}
  if(uWet>0.0&&up>0.8){vec3 v=normalize(uCam-vW);float fr=pow(1.0-max(dot(v,n),0.0),4.0);c=mix(c,uSky*0.9+uFogCol*0.2,fr*0.55*uWet);
    vec3 h=normalize(v+uSunDir);c+=uSunCol*pow(max(dot(n,h),0.0),60.0)*0.6*uWet;}
  c+=vCol*vEmi*uEmiK+uEmiAdd;
  float f=clamp((length(vW-uCam)-uFog.x)/(uFog.y-uFog.x),0.0,1.0);
  gl_FragColor=vec4(mix(c,uFogCol,f*f*(3.0-2.0*f)),uAlpha);
}`;
const SHD_VS=`precision highp float;attribute vec3 aPos;uniform mat4 uLVP;uniform mat4 uM;void main(){gl_Position=uLVP*(uM*vec4(aPos,1.0));}`;
const SHD_FS=PREC+`void main(){vec4 e=vec4(1.0,255.0,65025.0,16581375.0)*gl_FragCoord.z;e=fract(e);e-=e.yzww*vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);gl_FragColor=e;}`;
const GLOW_VS=`precision highp float;
attribute vec3 aPos;attribute vec2 aUv;attribute vec3 aCol;uniform mat4 uVP;
varying vec2 vUv;varying vec3 vCol;varying vec3 vW;
void main(){vW=aPos;vUv=aUv;vCol=aCol;gl_Position=uVP*vec4(aPos,1.0);}`;
const GLOW_FS=PREC+`
varying vec2 vUv;varying vec3 vCol;varying vec3 vW;uniform float uMode;uniform float uK;uniform vec3 uCam;uniform vec2 uFog;
void main(){
  float f=clamp((length(vW-uCam)-uFog.x)/(uFog.y-uFog.x),0.0,1.0);
  if(uMode<0.5){float a=clamp(1.0-length(vUv),0.0,1.0);a*=a;gl_FragColor=vec4(vCol*a*uK*(1.0-f),1.0);}
  else if(uMode<1.5){float a=clamp(1.0-length(vUv),0.0,1.0);a=smoothstep(0.0,0.7,a);gl_FragColor=vec4(0.0,0.0,0.0,a*uK*(1.0-f));}
  else {float a=(1.0-abs(vUv.x))*(1.0-vUv.y);a=clamp(a,0.0,1.0);a*=a;gl_FragColor=vec4(vCol*a*uK*(1.0-f),1.0);}
}`;
const SPR_VS=`precision highp float;
attribute vec3 aPos;uniform mat4 uVP;uniform vec3 uC;uniform vec2 uS;uniform vec3 uR;
varying vec2 vUv;varying vec3 vW;
void main(){vec3 w=uC+uR*(aPos.x*uS.x)+vec3(0.0,1.0,0.0)*(aPos.y*uS.y);vW=w;vUv=vec2(aPos.x+0.5,1.0-aPos.y);gl_Position=uVP*vec4(w,1.0);}`;
const SPR_FS=PREC+`
varying vec2 vUv;varying vec3 vW;uniform sampler2D uTex;uniform vec3 uCam;uniform vec2 uFog;uniform vec3 uDim;
void main(){vec4 t=texture2D(uTex,vUv);float f=clamp((length(vW-uCam)-uFog.x)/(uFog.y-uFog.x),0.0,1.0);gl_FragColor=vec4(t.rgb*uDim,t.a*(1.0-f*0.85));}`;
const SKY_VS=`precision highp float;attribute vec3 aPos;varying vec2 vP;void main(){vP=aPos.xy;gl_Position=vec4(aPos.xy,0.999,1.0);}`;
const SKY_FS=PREC+`
varying vec2 vP;uniform mat4 uInv;uniform vec3 uTop;uniform vec3 uHor;uniform vec3 uBot;uniform vec3 uSunDir;uniform vec3 uSunC;uniform float uStars;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec4 a=uInv*vec4(vP,-1.0,1.0);vec4 b=uInv*vec4(vP,1.0,1.0);vec3 d=normalize(b.xyz/b.w-a.xyz/a.w);
  float e=d.y;vec3 c=e>0.0?mix(uHor,uTop,pow(clamp(e*1.6,0.0,1.0),0.6)):mix(uHor,uBot,clamp(-e*6.0,0.0,1.0));
  float s=max(dot(d,uSunDir),0.0);c+=uSunC*(pow(s,900.0)*3.0+pow(s,18.0)*0.25);
  if(uStars>0.0&&e>0.05){vec2 q=floor(vec2(atan(d.z,d.x)*300.0,e*300.0));float st=step(0.9975,h(q));c+=vec3(st*uStars);}
  gl_FragColor=vec4(c,1.0);
}`;

function mkShader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('shader: '+gl.getShaderInfoLog(s));return s;}
function mkProg(vs,fs,attrs){
  const p=gl.createProgram();gl.attachShader(p,mkShader(gl.VERTEX_SHADER,vs));gl.attachShader(p,mkShader(gl.FRAGMENT_SHADER,fs));
  attrs.forEach(([name,loc])=>gl.bindAttribLocation(p,loc,name));
  gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('link: '+gl.getProgramInfoLog(p));
  const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const inf=gl.getActiveUniform(p,i);const nm=inf.name.replace(/\[0\]$/,'');u[nm]=gl.getUniformLocation(p,nm);}
  return {p,u,locs:attrs.map(a=>a[1]),fid:-1};
}
function initGL(){
  glc=$('#gl');
  const opt={antialias:true,alpha:false,depth:true,stencil:false,powerPreference:'high-performance'};
  try{gl=glc.getContext('webgl2',opt)||glc.getContext('webgl',opt)||glc.getContext('experimental-webgl',opt);}catch(e){gl=null;}
  if(!gl)return false;
  PL=mkProg(LIT_VS,LIT_FS,[['aPos',0],['aNor',1],['aCol',2],['aUv',3],['aEmi',4]]);
  PG=mkProg(GLOW_VS,GLOW_FS,[['aPos',0],['aCol',2],['aUv',3]]);
  PS=mkProg(SPR_VS,SPR_FS,[['aPos',0]]);
  PK=mkProg(SKY_VS,SKY_FS,[['aPos',0]]);
  PD=mkProg(SHD_VS,SHD_FS,[['aPos',0]]);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.frontFace(gl.CCW);gl.cullFace(gl.BACK);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  R.quadBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,R.quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-.5,0,0, .5,0,0, .5,1,0, -.5,0,0, .5,1,0, -.5,1,0]),gl.STATIC_DRAW);
  R.skyBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,R.skyBuf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,0, 3,-1,0, -1,3,0]),gl.STATIC_DRAW);
  makeTextures();
  return true;
}
const R={};
function useProg(P){
  if(curProg!==P){gl.useProgram(P.p);for(let i=0;i<5;i++){if(P.locs.includes(i))gl.enableVertexAttribArray(i);else gl.disableVertexAttribArray(i);}curProg=P;}
  if(P.fid!==frameId){P.fid=frameId;const u=P.u;
    if(u.uVP)gl.uniformMatrix4fv(u.uVP,false,FU.vp);
    if(u.uCam)gl.uniform3fv(u.uCam,FU.cam);
    if(u.uFog)gl.uniform2f(u.uFog,FU.fog[0],FU.fog[1]);
    if(u.uFogCol)gl.uniform3fv(u.uFogCol,FU.fogCol);
    if(u.uSunDir)gl.uniform3fv(u.uSunDir,FU.sunDir);
    if(u.uSunCol)gl.uniform3fv(u.uSunCol,FU.sunCol);
    if(u.uSky)gl.uniform3fv(u.uSky,FU.sky);
    if(u.uGnd)gl.uniform3fv(u.uGnd,FU.gnd);
    if(u.uNight)gl.uniform1f(u.uNight,FU.night);
    if(u.uHL!==undefined&&u.uHL)gl.uniform1f(u.uHL,FU.hl);
    if(u.uHLPos)gl.uniform3fv(u.uHLPos,FU.hlPos);
    if(u.uHLDir)gl.uniform3fv(u.uHLDir,FU.hlDir);
    if(u.uTex)gl.uniform1i(u.uTex,0);
    if(u.uEmTex)gl.uniform1i(u.uEmTex,1);
    if(u.uShadow)gl.uniform1i(u.uShadow,2);
    if(u.uShOn)gl.uniform1f(u.uShOn,FU.shOn||0);
    if(u.uShTx)gl.uniform1f(u.uShTx,FU.shTx||0.0005);
    if(u.uWet)gl.uniform1f(u.uWet,FU.wet||0);
    if(u.uLVP&&P!==PD)gl.uniformMatrix4fv(u.uLVP,false,FU.lvp||IDENT);
  }
}
function makeMesh(arr){
  if(!arr||!arr.length)return null;
  const f=arr instanceof Float32Array?arr:new Float32Array(arr);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,f,gl.STATIC_DRAW);
  return {b,n:f.length/12,bytes:f.byteLength};
}
function makeGlowMesh(arr){
  if(!arr||!arr.length)return null;
  const f=arr instanceof Float32Array?arr:new Float32Array(arr);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,f,gl.STATIC_DRAW);
  return {b,n:f.length/8};
}
/* shadow map: depth packed into an RGBA texture so it works on every WebGL phone */
const SHM={fbo:null,tex:null,rb:null,size:0};
function shadowTarget(size){
  if(SHM.size===size)return true;
  if(SHM.fbo){gl.deleteFramebuffer(SHM.fbo);gl.deleteTexture(SHM.tex);gl.deleteRenderbuffer(SHM.rb);}
  SHM.tex=gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,SHM.tex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  SHM.rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,SHM.rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,size,size);
  SHM.fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,SHM.fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,SHM.tex,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,SHM.rb);
  const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.activeTexture(gl.TEXTURE0);
  SHM.size=ok?size:-1;return ok;
}
function shadowBegin(lvp){
  gl.bindFramebuffer(gl.FRAMEBUFFER,SHM.fbo);gl.viewport(0,0,SHM.size,SHM.size);
  gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);
  useProg(PD);gl.uniformMatrix4fv(PD.u.uLVP,false,lvp);
}
function drawShadow(mesh,M){if(!mesh||!mesh.b)return;gl.uniformMatrix4fv(PD.u.uM,false,M||IDENT);gl.bindBuffer(gl.ARRAY_BUFFER,mesh.b);gl.vertexAttribPointer(0,3,gl.FLOAT,false,48,0);gl.drawArrays(gl.TRIANGLES,0,mesh.n);}
function shadowEnd(){gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,SHM.tex);gl.activeTexture(gl.TEXTURE0);}
function freeMesh(m){if(m&&m.b){gl.deleteBuffer(m.b);m.b=null;}}
const WHITE3=[1,1,1],ZERO3=[0,0,0];
function drawLit(mesh,M,o){
  if(!mesh||!mesh.b)return;o=o||{};
  useProg(PL);const u=PL.u;
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.b);
  gl.vertexAttribPointer(0,3,gl.FLOAT,false,48,0);
  gl.vertexAttribPointer(1,3,gl.FLOAT,false,48,12);
  gl.vertexAttribPointer(2,3,gl.FLOAT,false,48,24);
  gl.vertexAttribPointer(3,2,gl.FLOAT,false,48,36);
  gl.vertexAttribPointer(4,1,gl.FLOAT,false,48,44);
  gl.uniformMatrix4fv(u.uM,false,M||IDENT);
  gl.uniform3fv(u.uTint,o.tint||WHITE3);
  gl.uniform3fv(u.uEmiAdd,o.emiAdd||ZERO3);
  gl.uniform1f(u.uEmiK,o.emiK==null?0.8:o.emiK);
  gl.uniform1f(u.uAlpha,o.alpha==null?1:o.alpha);
  if(o.tex){gl.uniform1f(u.uUseTex,1);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,o.tex);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,o.emTex||TEX.black);gl.activeTexture(gl.TEXTURE0);}
  else gl.uniform1f(u.uUseTex,0);
  gl.uniform1f(u.uHL,o.noHL?0:FU.hl);
  if(o.cull===false)gl.disable(gl.CULL_FACE);else gl.enable(gl.CULL_FACE);
  gl.drawArrays(gl.TRIANGLES,0,mesh.n);
}
function drawGlowMesh(mesh,mode,k){
  if(!mesh||!mesh.b||!mesh.n)return;
  useProg(PG);gl.bindBuffer(gl.ARRAY_BUFFER,mesh.b);
  gl.vertexAttribPointer(0,3,gl.FLOAT,false,32,0);gl.vertexAttribPointer(3,2,gl.FLOAT,false,32,12);gl.vertexAttribPointer(2,3,gl.FLOAT,false,32,20);
  gl.uniform1f(PG.u.uMode,mode);gl.uniform1f(PG.u.uK,k);gl.disable(gl.CULL_FACE);
  gl.drawArrays(gl.TRIANGLES,0,mesh.n);
}
/* dynamic batch of glow quads, rebuilt each frame */
class GlowBatch{
  constructor(maxQ){this.a=new Float32Array(maxQ*48);this.n=0;this.max=maxQ;this.b=null;}
  reset(){this.n=0;}
  /* ground-aligned quad centred on (x,z) with half sizes along unit dir (dx,dz) and its perpendicular */
  quad(x,y,z,dx,dz,hl,hw,col,beam){
    if(this.n>=this.max)return;const a=this.a;let o=this.n*48;this.n++;
    const px=-dz,pz=dx;
    let c0,c1,c2,c3;
    if(beam){ /* beam starts at (x,z) and extends forward hl, width grows to hw */
      c0=[x+px*hw*.15,z+pz*hw*.15,-1,0];c1=[x-px*hw*.15,z-pz*hw*.15,1,0];
      c2=[x+dx*hl-px*hw,z+dz*hl-pz*hw,1,1];c3=[x+dx*hl+px*hw,z+dz*hl+pz*hw,-1,1];
    }else{
      c0=[x-dx*hl-px*hw,z-dz*hl-pz*hw,-1,-1];c1=[x+dx*hl-px*hw,z+dz*hl-pz*hw,1,-1];c2=[x+dx*hl+px*hw,z+dz*hl+pz*hw,1,1];c3=[x-dx*hl+px*hw,z-dz*hl+pz*hw,-1,1];
    }
    const put=c=>{a[o++]=c[0];a[o++]=y;a[o++]=c[1];a[o++]=c[2];a[o++]=c[3];a[o++]=col[0];a[o++]=col[1];a[o++]=col[2];};
    put(c0);put(c1);put(c2);put(c0);put(c2);put(c3);
  }
  /* vertical camera-facing streak (rain) */
  streak(x,y,z,h,w,col,right){
    if(this.n>=this.max)return;const a=this.a;let o=this.n*48;this.n++;
    const rx=right[0]*w,rz=right[2]*w;
    const c=[[x-rx,y,z-rz,-1,-1],[x+rx,y,z+rz,1,-1],[x+rx,y+h,z+rz,1,1],[x-rx,y+h,z-rz,-1,1]];
    const put=q=>{a[o++]=q[0];a[o++]=q[1];a[o++]=q[2];a[o++]=q[3];a[o++]=q[4];a[o++]=col[0];a[o++]=col[1];a[o++]=col[2];};
    put(c[0]);put(c[1]);put(c[2]);put(c[0]);put(c[2]);put(c[3]);
  }
  /* camera-facing glow sprite (for lamp bulbs, siren lights) */
  bill(x,y,z,r,col,right){
    if(this.n>=this.max)return;const a=this.a;let o=this.n*48;this.n++;
    const rx=right[0]*r,rz=right[2]*r;
    const c=[[x-rx,y-r,z-rz,-1,-1],[x+rx,y-r,z+rz,1,-1],[x+rx,y+r,z+rz,1,1],[x-rx,y+r,z-rz,-1,1]];
    const put=q=>{a[o++]=q[0];a[o++]=q[1];a[o++]=q[2];a[o++]=q[3];a[o++]=q[4];a[o++]=col[0];a[o++]=col[1];a[o++]=col[2];};
    put(c[0]);put(c[1]);put(c[2]);put(c[0]);put(c[2]);put(c[3]);
  }
  draw(mode,k){
    if(!this.n)return;
    if(!this.b)this.b=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,this.b);gl.bufferData(gl.ARRAY_BUFFER,this.a.subarray(0,this.n*48),gl.DYNAMIC_DRAW);
    drawGlowMesh({b:this.b,n:this.n*6},mode,k);
  }
}
function drawSprite(tex,x,y,z,w,h,dim){
  useProg(PS);gl.bindBuffer(gl.ARRAY_BUFFER,R.quadBuf);gl.vertexAttribPointer(0,3,gl.FLOAT,false,12,0);
  gl.uniform3f(PS.u.uC,x,y,z);gl.uniform2f(PS.u.uS,w,h);gl.uniform3fv(PS.u.uR,FU.right);const dd=dim==null?1:dim;gl.uniform3fv(PS.u.uDim,typeof dd==='number'?[dd,dd,dd]:dd);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.disable(gl.CULL_FACE);
  gl.drawArrays(gl.TRIANGLES,0,6);
}
function drawSky(top,hor,bot,sunC,stars){
  useProg(PK);gl.bindBuffer(gl.ARRAY_BUFFER,R.skyBuf);gl.vertexAttribPointer(0,3,gl.FLOAT,false,12,0);
  gl.uniformMatrix4fv(PK.u.uInv,false,FU.inv);gl.uniform3fv(PK.u.uTop,top);gl.uniform3fv(PK.u.uHor,hor);gl.uniform3fv(PK.u.uBot,bot);
  gl.uniform3fv(PK.u.uSunDir,FU.sunDir);gl.uniform3fv(PK.u.uSunC,sunC);gl.uniform1f(PK.u.uStars,stars);
  gl.disable(gl.CULL_FACE);gl.depthMask(false);gl.disable(gl.DEPTH_TEST);gl.drawArrays(gl.TRIANGLES,0,3);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
}

/* ================= textures ================= */
function texFromCanvas(cv,repeat){
  const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);
  const pot=(cv.width&(cv.width-1))===0&&(cv.height&(cv.height-1))===0;
  if(pot&&repeat){gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);}
  else{gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);}
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  return t;
}
function noiseCanvas(S,base,amp,seed,extra){
  const cv=document.createElement('canvas');cv.width=cv.height=S;const c=cv.getContext('2d');const im=c.createImageData(S,S);const r=mulberry32(seed);
  /* value noise at a few octaves, tileable by wrapping the lattice */
  const oct=[[8,.5],[32,.3],[128,.2]];const grids=oct.map(([n])=>{const g=new Float32Array(n*n);for(let i=0;i<g.length;i++)g[i]=r();return g;});
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){let v=0;oct.forEach(([n,wt],o)=>{const g=grids[o];const fx=x/S*n,fy=y/S*n;const x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0;const a=g[(y0%n)*n+x0%n],b=g[(y0%n)*n+(x0+1)%n],cc=g[((y0+1)%n)*n+x0%n],d=g[((y0+1)%n)*n+(x0+1)%n];const sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);v+=wt*((a*(1-sx)+b*sx)*(1-sy)+(cc*(1-sx)+d*sx)*sy);});
    v=base+(v-.5)*amp+(r()-.5)*amp*.35;const i=(y*S+x)*4;const q=clamp(v,0,1)*255;im.data[i]=q;im.data[i+1]=q;im.data[i+2]=q;im.data[i+3]=255;}
  c.putImageData(im,0,0);if(extra)extra(c,S,r);return cv;
}
const SHOPWORDS=['STORES','MEDICALS','BAKERY','TEA STALL','MOBILES','XEROX','TAILORS','FANCY','SALOON','PROVISIONS','HOTEL','SWEETS','HARDWARE','OPTICALS','JUICE','CHATS','CONDIMENTS','TEXTILES','ELECTRICALS','DARSHINI'];
function makeTextures(){
  const k=document.createElement('canvas');k.width=k.height=4;const kc=k.getContext('2d');kc.fillStyle='#000';kc.fillRect(0,0,4,4);TEX.black=texFromCanvas(k,false);
  /* asphalt: grain, darker patch repairs and hairline cracks */
  TEX.asph=texFromCanvas(noiseCanvas(256,.9,.28,11,(c,S,r)=>{for(let i=0;i<5;i++){c.fillStyle=`rgba(0,0,0,${.06+r()*.08})`;const w=20+r()*70,h=14+r()*50;c.fillRect(r()*S,r()*S,w,h);}
    c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1;for(let i=0;i<7;i++){let x=r()*S,y=r()*S;c.beginPath();c.moveTo(x,y);for(let j=0;j<6;j++){x+=(r()-.5)*24;y+=(r()-.5)*24;c.lineTo(x,y);}c.stroke();}}),true);
  /* footpath pavers */
  TEX.pave=texFromCanvas(noiseCanvas(128,.92,.2,12,(c,S,r)=>{const n=4,t=S/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){c.fillStyle=`rgba(${r()<.5?0:255},${r()<.5?0:200},0,${r()*.06})`;c.fillRect(i*t,j*t,t,t);}
    c.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<=n;i++){c.fillRect(i*t-1,0,2,S);c.fillRect(0,i*t-1,S,2);}}),true);
  /* bare earth and grass verges */
  TEX.dirt=texFromCanvas(noiseCanvas(256,.88,.45,13,(c,S,r)=>{for(let i=0;i<260;i++){c.fillStyle=`rgba(${60+r()*40},${90+r()*50},${30+r()*20},${.12+r()*.2})`;c.fillRect(r()*S,r()*S,2+r()*5,2+r()*5);}}),true);
  /* ground-floor shop row: 4 bays of signboards, rolling shutters and lit counters */
  {const W2=512,H2=128,cv=document.createElement('canvas');cv.width=W2;cv.height=H2;const c=cv.getContext('2d');
   const ev=document.createElement('canvas');ev.width=W2;ev.height=H2;const e2=ev.getContext('2d');e2.fillStyle='#000';e2.fillRect(0,0,W2,H2);
   const r=mulberry32(21);const SIGN=['#C62828','#1565C0','#2E7D32','#F9A825','#6A1B9A','#EF6C00','#00838F','#AD1457'];
   for(let b=0;b<4;b++){const x0=b*128;
     c.fillStyle='#BDB6A8';c.fillRect(x0,0,128,H2);
     const sc=SIGN[Math.floor(r()*SIGN.length)];c.fillStyle=sc;c.fillRect(x0+4,6,120,30);
     c.fillStyle=sc==='#F9A825'?'#1A1A1A':'#FFFFFF';c.font='700 18px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(SHOPWORDS[Math.floor(r()*SHOPWORDS.length)],x0+64,21);
     e2.fillStyle='rgba(255,240,200,.55)';e2.fillRect(x0+4,6,120,30);
     const open=r()<.6;
     if(open){const g=c.createLinearGradient(0,42,0,H2);g.addColorStop(0,'#5A4A38');g.addColorStop(1,'#2A2219');c.fillStyle=g;c.fillRect(x0+10,42,108,H2-42);
       for(let i=0;i<10;i++){c.fillStyle=`hsl(${r()*360},55%,${45+r()*20}%)`;c.fillRect(x0+14+r()*96,48+Math.floor(r()*3)*24,8+r()*10,12);}
       e2.fillStyle='#FFD9A0';e2.fillRect(x0+10,42,108,H2-42);}
     else{c.fillStyle=['#5C7A8A','#7A8A5C','#8A6A5C','#6E6E78'][Math.floor(r()*4)];c.fillRect(x0+10,42,108,H2-42);c.fillStyle='rgba(0,0,0,.22)';for(let y=44;y<H2;y+=5)c.fillRect(x0+10,y,108,1.5);}
     c.fillStyle='#8E877A';c.fillRect(x0,0,6,H2);c.fillRect(x0+122,0,6,H2);}
   TEX.shop=texFromCanvas(cv,true);TEX.shopE=texFromCanvas(ev,true);}
  /* building facade: 4 bays x 4 floors; white wall (tinted per building), windows with a concrete sunshade (chajja) above */
  const S=256,B=64;
  const w=document.createElement('canvas');w.width=w.height=S;const c=w.getContext('2d');
  const e=document.createElement('canvas');e.width=e.height=S;const ec=e.getContext('2d');
  c.fillStyle='#fff';c.fillRect(0,0,S,S);ec.fillStyle='#000';ec.fillRect(0,0,S,S);
  const rnd=mulberry32(7);
  for(let fx=0;fx<4;fx++)for(let fy=0;fy<4;fy++){
    const x0=fx*B,y0=fy*B;
    const ww=B*.46,wh=B*.5,wx=x0+(B-ww)/2,wy=y0+B*.3;
    c.fillStyle='#CFCFCF';c.fillRect(wx-3,wy-6,ww+6,5);
    c.fillStyle='#A9A9A9';c.fillRect(wx-2,wy-1,ww+4,wh+3);
    const g=c.createLinearGradient(0,wy,0,wy+wh);g.addColorStop(0,'#3E5568');g.addColorStop(1,'#25323D');
    c.fillStyle=g;c.fillRect(wx,wy,ww,wh);
    c.fillStyle='rgba(255,255,255,.18)';c.fillRect(wx+ww/2-1,wy,2,wh);
    c.fillStyle='#E9E9E9';c.fillRect(x0,y0+B-3,B,3);
    const r=rnd();
    if(r<.42){ec.fillStyle=r<.12?'#CFE6FF':r<.3?'#FFD38A':'#FFB86B';ec.fillRect(wx,wy,ww,wh);ec.fillStyle='rgba(0,0,0,.35)';ec.fillRect(wx+ww/2-1,wy,2,wh);}
  }
  /* keep a clean wall pixel block at the very corner for roofs */
  c.fillStyle='#fff';c.fillRect(0,0,6,6);ec.fillStyle='#000';ec.fillRect(0,0,6,6);
  TEX.wall=texFromCanvas(w,true);TEX.wallE=texFromCanvas(e,true);
}
const textCache=new Map();
function textTex(key,draw,wpx,hpx){
  let t=textCache.get(key);if(t){t.used=frameId;return t;}
  const cv=document.createElement('canvas');cv.width=wpx;cv.height=hpx;const c=cv.getContext('2d');draw(c,wpx,hpx);
  t={tex:texFromCanvas(cv,false),w:wpx,h:hpx,used:frameId,keep:/^(hoysala|ads|court|beam)$/.test(key)};textCache.set(key,t);
  if(textCache.size>90){let oldK=null,oldU=1e18;for(const[k2,v]of textCache){if(v.used<oldU&&!v.keep){oldU=v.used;oldK=k2;}}if(oldK){gl.deleteTexture(textCache.get(oldK).tex);textCache.delete(oldK);}}
  return t;
}

/* ================= mesh builder ================= */
class MB{
  constructor(){this.d=[];this.m=[1,0,0,0,1,0,0,0,1];this.t=[0,0,0];this.st=[];}
  save(){this.st.push([this.m.slice(),this.t.slice()]);return this;}
  restore(){const s=this.st.pop();this.m=s[0];this.t=s[1];return this;}
  tr(x,y,z){const m=this.m;this.t[0]+=m[0]*x+m[3]*y+m[6]*z;this.t[1]+=m[1]*x+m[4]*y+m[7]*z;this.t[2]+=m[2]*x+m[5]*y+m[8]*z;return this;}
  _rot(r){const m=this.m,o=new Array(9);for(let c=0;c<3;c++)for(let q=0;q<3;q++)o[c*3+q]=m[q]*r[c*3]+m[3+q]*r[c*3+1]+m[6+q]*r[c*3+2];this.m=o;return this;}
  rotX(a){const c=Math.cos(a),s=Math.sin(a);return this._rot([1,0,0,0,c,s,0,-s,c]);}
  rotY(a){const c=Math.cos(a),s=Math.sin(a);return this._rot([c,0,-s,0,1,0,s,0,c]);}
  rotZ(a){const c=Math.cos(a),s=Math.sin(a);return this._rot([c,s,0,-s,c,0,0,0,1]);}
  scl(x,y,z){return this._rot([x,0,0,0,y==null?x:y,0,0,0,z==null?x:z]);}
  P(p){const m=this.m,t=this.t;return [m[0]*p[0]+m[3]*p[1]+m[6]*p[2]+t[0],m[1]*p[0]+m[4]*p[1]+m[7]*p[2]+t[1],m[2]*p[0]+m[5]*p[1]+m[8]*p[2]+t[2]];}
  D(p){const m=this.m;return [m[0]*p[0]+m[3]*p[1]+m[6]*p[2],m[1]*p[0]+m[4]*p[1]+m[7]*p[2],m[2]*p[0]+m[5]*p[1]+m[8]*p[2]];}
  /* raw world-space triangle, no transform */
  rtri(a,b,c,col,hint,uv,e){
    let ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    if(hint&&nx*hint[0]+ny*hint[1]+nz*hint[2]<0){const t=b;b=c;c=t;nx=-nx;ny=-ny;nz=-nz;if(uv)uv=[uv[0],uv[1],uv[4],uv[5],uv[2],uv[3]];}
    const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
    const d=this.d;e=e||0;
    d.push(a[0],a[1],a[2],nx,ny,nz,col[0],col[1],col[2],uv?uv[0]:0,uv?uv[1]:0,e);
    d.push(b[0],b[1],b[2],nx,ny,nz,col[0],col[1],col[2],uv?uv[2]:0,uv?uv[3]:0,e);
    d.push(c[0],c[1],c[2],nx,ny,nz,col[0],col[1],col[2],uv?uv[4]:0,uv?uv[5]:0,e);
  }
  tri(a,b,c,col,hint,uv,e){this.rtri(this.P(a),this.P(b),this.P(c),col,hint?this.D(hint):null,uv,e);}
  quad(a,b,c,d,col,hint,uv,e){
    this.tri(a,b,c,col,hint,uv?[uv[0],uv[1],uv[2],uv[3],uv[4],uv[5]]:null,e);
    this.tri(a,c,d,col,hint,uv?[uv[0],uv[1],uv[4],uv[5],uv[6],uv[7]]:null,e);
  }
  box(cx,cy,cz,sx,sy,sz,col,e,nob){
    const x0=cx-sx/2,x1=cx+sx/2,y0=cy-sy/2,y1=cy+sy/2,z0=cz-sz/2,z1=cz+sz/2;
    this.quad([x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],col,[1,0,0],null,e);
    this.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],col,[-1,0,0],null,e);
    this.quad([x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],col,[0,1,0],null,e);
    if(!nob)this.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],col,[0,-1,0],null,e);
    this.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],col,[0,0,1],null,e);
    this.quad([x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[x1,y0,z0],col,[0,0,-1],null,e);
    return this;
  }
  /* tapered box: bottom bx*bz at y, top tx*tz at y+h, top shifted by (ox,oz) */
  tbox(cx,y,cz,bx,bz,tx,tz,h,col,ox,oz,e,nob){
    ox=ox||0;oz=oz||0;
    const b=[[cx-bx/2,y,cz-bz/2],[cx+bx/2,y,cz-bz/2],[cx+bx/2,y,cz+bz/2],[cx-bx/2,y,cz+bz/2]];
    const t=[[cx+ox-tx/2,y+h,cz+oz-tz/2],[cx+ox+tx/2,y+h,cz+oz-tz/2],[cx+ox+tx/2,y+h,cz+oz+tz/2],[cx+ox-tx/2,y+h,cz+oz+tz/2]];
    const C=[cx+ox/2,y+h/2,cz+oz/2];
    const side=(i,j)=>{const mx=(b[i][0]+b[j][0]+t[i][0]+t[j][0])/4,my=y+h/2,mz=(b[i][2]+b[j][2]+t[i][2]+t[j][2])/4;this.quad(b[i],b[j],t[j],t[i],Array.isArray(col[0])?col[1]:col,[mx-C[0],0,mz-C[2]],null,e);};
    side(0,1);side(1,2);side(2,3);side(3,0);
    this.quad(t[0],t[1],t[2],t[3],Array.isArray(col[0])?col[0]:col,[0,1,0],null,e);
    if(!nob)this.quad(b[0],b[1],b[2],b[3],Array.isArray(col[0])?col[1]:col,[0,-1,0],null,e);
    return this;
  }
  cyl(cx,cy,cz,r,len,axis,segs,col,capCol,capE,e){
    segs=segs||10;capCol=capCol||col;
    const pt=(a,s)=>{const u=Math.cos(a)*r,v=Math.sin(a)*r;return axis==='x'?[cx+s,cy+u,cz+v]:axis==='y'?[cx+u,cy+s,cz+v]:[cx+u,cy+v,cz+s];};
    const ax=axis==='x'?[1,0,0]:axis==='y'?[0,1,0]:[0,0,1];
    const h=len/2;
    for(let i=0;i<segs;i++){
      const a0=i/segs*TAU,a1=(i+1)/segs*TAU,am=(a0+a1)/2;
      const p0=pt(a0,-h),p1=pt(a1,-h),p2=pt(a1,h),p3=pt(a0,h);
      const n=axis==='x'?[0,Math.cos(am),Math.sin(am)]:axis==='y'?[Math.cos(am),0,Math.sin(am)]:[Math.cos(am),Math.sin(am),0];
      this.quad(p0,p1,p2,p3,col,n,null,e);
      const c0=axis==='x'?[cx+h,cy,cz]:axis==='y'?[cx,cy+h,cz]:[cx,cy,cz+h];
      const c1=axis==='x'?[cx-h,cy,cz]:axis==='y'?[cx,cy-h,cz]:[cx,cy,cz-h];
      this.tri(c0,p3,p2,capCol,ax,null,capE||e);
      this.tri(c1,p0,p1,col,[-ax[0],-ax[1],-ax[2]],null,e);
    }
    return this;
  }
  blob(cx,cy,cz,rx,ry,rz,col,e){
    const t=(1+Math.sqrt(5))/2;
    const V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(v=>{const l=Math.hypot(v[0],v[1],v[2]);return [cx+v[0]/l*rx,cy+v[1]/l*ry,cz+v[2]/l*rz];});
    const F=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    for(const f of F){const a=V[f[0]],b=V[f[1]],c=V[f[2]];this.tri(a,b,c,col,[(a[0]+b[0]+c[0])/3-cx,(a[1]+b[1]+c[1])/3-cy,(a[2]+b[2]+c[2])/3-cz],null,e);}
    return this;
  }
  /* flat disc facing up */
  disc(cx,cy,cz,r,segs,col,e){for(let i=0;i<segs;i++){const a0=i/segs*TAU,a1=(i+1)/segs*TAU;this.tri([cx,cy,cz],[cx+Math.cos(a0)*r,cy,cz+Math.sin(a0)*r],[cx+Math.cos(a1)*r,cy,cz+Math.sin(a1)*r],col,[0,1,0],null,e);}return this;}
  /* ring (torus-like) in the local XY plane, for steering wheels */
  ring(cx,cy,cz,R,r,segs,col){for(let i=0;i<segs;i++){const a=i/segs*TAU,a2=(i+1)/segs*TAU,am=(a+a2)/2;this.save();this.tr(cx+Math.cos(am)*R,cy+Math.sin(am)*R,cz);this.rotZ(am);this.box(0,0,0,r*2,2*R*Math.sin(Math.PI/segs)+.01,r*2,col);this.restore();}return this;}
  mesh(){return makeMesh(this.d);}
  arr(){return new Float32Array(this.d);}
}
