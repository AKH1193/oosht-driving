/* ================= WISE CITY: neat trees and plants. Smooth rounded canopies with a light top and a shaded underside,
   tapered trunks with the white-and-red painted base you see on Bengaluru roads, tidy tree guards, flowering gulmohar
   and jacaranda, clean palms, and clipped shrubs, saplings and bougainvillea on the medians ================= */
function shade(c,k){return [c[0]*k,c[1]*k,c[2]*k];}
/* a canopy made of a few overlapping smooth domes: brighter on top, darker beneath */
function canopy(mb,x,y,z,rx,ry,col,n,seed){const r=mulberry32(seed);mb.ell(x,y-ry*.3,z,rx*.9,ry*.5,rx*.9,shade(col,.86),8,4);
  mb.ell(x,y,z,rx,ry*.8,rx,col,10,6);
  for(let i=0;i<n;i++){const a=i/n*TAU+r()*.6,d=rx*(.42+r()*.12);mb.ell(x+Math.cos(a)*d,y+ry*(.12+r()*.18),z+Math.sin(a)*d,rx*.55,ry*.55,rx*.55,shade(col,1.05+r()*.1),7,4);}
  mb.ell(x,y+ry*.42,z,rx*.55,ry*.45,rx*.55,shade(col,1.15),7,4);}
function trunk(mb,x,z,h,r,col){mb.tb(x,h/2,z,r*.78,h,col,r);
  /* painted base band, as the city's forest department does */
  mb.tb(x,.35,z,r*1.03,.7,[.93,.93,.9],r*1.06);mb.tb(x,.76,z,r*1.0,.12,[.72,.12,.1],r*1.03);}
function treeGuard(mb,x,z){mb.tb(x,.09,z,.62,.18,[.6,.6,.58],.64);mb.tb(x,.185,z,.56,.01,[.27,.2,.14],.56);}
treeAt=function(mb,x,y,r,sh){
  const kind=r<.08?'palm':r<.17?'gul':r<.25?'jac':r<.6?'rain':'gen';
  const s=.85+(sh%100)/200;const lean=((sh>>>3)%7-3)*.015;
  treeGuard(mb,x,y);
  if(kind==='palm'){const H=6.6*s;
    mb.save();mb.tr(x,0,y);mb.rotZ(lean);
    for(let k=0;k<6;k++)mb.tb(0,H*(k+.5)/6,0,.17-k*.012,H/6+.02,k%2?[.52,.45,.36]:[.47,.4,.32],.19-k*.012);
    mb.ell(0,H+.1,0,.32,.3,.32,[.36,.42,.2],8,5);
    for(let i=0;i<9;i++){const a=i/9*TAU+(sh%10)*.3;mb.save();mb.tr(0,H+.15,0);mb.rotY(a);
      for(let k=0;k<4;k++){mb.save();mb.rotX(.25+k*.32);mb.tr(0,0,-.55-k*.55);mb.box(0,0,0,.62-k*.12,.03,.6,k%2?[.2,.44,.17]:[.24,.5,.2]);mb.restore();}mb.restore();}
    mb.restore();return;}
  const th=kind==='rain'?2.6*s:2.3*s;trunk(mb,x,y,th+.6,kind==='rain'?.24:.19,COL.trunk||[.4,.3,.22]);
  /* two short limbs into the crown */
  for(const q of[-1,1])limb(mb,[x,th*.8,y],[x+q*.55*s,th+.55,y+q*.2],.08,COL.trunk||[.4,.3,.22]);
  if(kind==='rain')canopy(mb,x,th+1.5*s,y,3.3*s,1.35*s,[.22,.42,.18],5,sh);
  else if(kind==='gul'){canopy(mb,x,th+1.4*s,y,2.6*s,1.3*s,[.28,.46,.2],4,sh);
    const rr=mulberry32(sh+3);for(let i=0;i<5;i++){const a=rr()*TAU,d=rr()*2*s;mb.ell(x+Math.cos(a)*d,th+1.4*s+.5+rr()*.7,y+Math.sin(a)*d,.6,.34,.6,[.92,.3+rr()*.12,.1],6,3);}}
  else if(kind==='jac')canopy(mb,x,th+1.5*s,y,2.5*s,1.4*s,[.6,.48,.82],4,sh);
  else canopy(mb,x,th+1.5*s,y,2.2*s,1.7*s,[.24,.42,.2],4,sh);};
/* median planting: clipped round shrubs, staked saplings in green guards, bougainvillea in flower */
function medianPlant(mb,x,y,v,h,rnd){
  if(v===0){mb.ell(x,.52,y,.45,.36,.45,[.2,.46,.22],9,6);mb.ell(x,.72,y,.32,.24,.32,[.24,.52,.25],8,5);
    const r=mulberry32(Math.round(x*13+y*7));for(let i=0;i<6;i++){const a=r()*TAU;mb.ell(x+Math.cos(a)*.3,.68+r()*.18,y+Math.sin(a)*.3,.12,.1,.12,[.93,.26,.6],6,4);}}
  else if(v===1){mb.tb(x,.85,y,.05,1.3,[.45,.34,.22],.06);mb.tb(x,.6,y,.24,.9,[.12,.36,.2],.26);mb.tb(x,1.06,y,.25,.04,[.12,.3,.17],.25);
    mb.ell(x,1.55,y,.48,.42,.48,[.24,.5,.22],9,6);mb.ell(x+.12,1.78,y-.06,.3,.26,.3,[.28,.56,.25],8,5);}
  else{mb.ell(x,.42,y,.55,.28,.55,[.2,.48,.24],9,6);mb.ell(x,.56,y,.38,.2,.38,[.24,.54,.27],8,5);}}
Object.assign(window.__oosht||{},{clearChunks:()=>clearChunks(),treeAt:(a,b,c,d,e)=>treeAt(a,b,c,d,e)});
