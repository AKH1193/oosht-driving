/* ================= 3D models (forward = -Z, right = +X, ground y = 0) ================= */
const C={
  tyre:[.06,.06,.07],rim:[.62,.63,.66],chrome:[.86,.87,.9],black:[.09,.09,.1],dark:[.17,.18,.2],grey:[.42,.43,.46],
  glass:[.14,.2,.26],seat:[.1,.09,.085],light:[1,.96,.82],tail:[.92,.08,.06],amber:[1,.58,.08],plateW:[.94,.94,.9],plateY:[.98,.8,.08],
  khaki:[.62,.54,.36],white:[.93,.93,.92],alu:[.75,.76,.78]
};
const SKINS=[[.55,.38,.26],[.45,.3,.2],[.68,.5,.36],[.38,.25,.17],[.6,.43,.3]];
function wheel(mb,x,y,z,R,W,rim){mb.cyl(x,y,z,R,W,'x',14,C.tyre);mb.cyl(x,y,z,R*.6,W+.014,'x',10,rim||C.rim);}
function limb(mb,p0,p1,w,col,h){
  const dx=p1[0]-p0[0],dy=p1[1]-p0[1],dz=p1[2]-p0[2],L=Math.hypot(dx,dy,dz)||.01;
  mb.save();mb.tr((p0[0]+p1[0])/2,(p0[1]+p1[1])/2,(p0[2]+p1[2])/2);mb.rotY(Math.atan2(dx,dz));mb.rotX(-Math.asin(clamp(dy/L,-1,1)));mb.box(0,0,0,w,h||w,L,col);mb.restore();
}

/* ---------- rider (two-wheelers and auto driver) ---------- */
function buildRider(mb,o){
  /* o: seat:[y,z], grip:[x,y,z], peg:[x,y,z], lean, shirt, pants, helmet, skin, noHelmet */
  const sk=o.skin||SKINS[0];
  const hip=[0,o.seat[0]+.08,o.seat[1]];
  const lean=o.lean||0.2;
  const tl=.56,sh=[0,hip[1]+tl*Math.cos(lean),hip[2]-tl*Math.sin(lean)];
  limb(mb,hip,sh,.36,o.shirt,.24);
  const head=[0,sh[1]+.2,sh[2]-.04];
  if(o.noHelmet){mb.blob(head[0],head[1],head[2],.11,.13,.12,sk);mb.blob(head[0],head[1]+.06,head[2]+.02,.115,.07,.12,C.black);}
  else{mb.blob(head[0],head[1]+.02,head[2],.15,.15,.16,o.helmet);mb.box(head[0],head[1],head[2]-.13,.2,.08,.04,C.glass);}
  for(const s of[-1,1]){
    const shp=[s*.2,sh[1]-.05,sh[2]];const g=[s*Math.abs(o.grip[0]),o.grip[1],o.grip[2]];
    const el=[(shp[0]+g[0])/2+s*.05,(shp[1]+g[1])/2-.05,(shp[2]+g[2])/2];
    limb(mb,shp,el,.1,o.shirt);limb(mb,el,g,.085,o.sleeve||sk);
    mb.box(g[0],g[1],g[2],.08,.08,.09,o.glove||sk);
    const hp=[s*.12,hip[1],hip[2]];const pg=[s*Math.abs(o.peg[0]),o.peg[1],o.peg[2]];
    const kn=[s*(Math.abs(o.peg[0])+.04),Math.max(hp[1],pg[1])+.12,Math.min(hp[2],pg[2])-.22];
    limb(mb,hp,kn,.15,o.pants);limb(mb,kn,pg,.12,o.pants);
    mb.box(pg[0],pg[1]-.03,pg[2]-.05,.11,.08,.22,C.black);
  }
}

/* ---------- two-wheelers ---------- */
function buildTwo(o){
  const mb=new MB(),ck=new MB(),rd=new MB(),gm=new MB();
  const R=o.R,Rr=o.Rr||R,W=o.W||.1,Wr=o.Wr||W*1.2,wb=o.wb,zf=-wb/2,zr=wb/2;
  const body=hexRGB(o.col),acc=hexRGB(o.acc||'#1A1A1C');
  wheel(mb,0,R,zf,R,W,o.rim);wheel(mb,0,Rr,zr,Rr,Wr,o.rim);
  const rake=o.rake||.44,Lf=o.fork||.8;
  const topY=R+Lf*Math.cos(rake),topZ=zf+Lf*Math.sin(rake);
  /* fork */
  mb.save();mb.tr(0,R,zf);mb.rotX(rake);
  for(const s of[-1,1])mb.box(s*.085,Lf/2,0,.05,Lf,.05,o.forkCol||(o.scooter?C.dark:C.chrome));
  mb.restore();
  /* front mudguard */
  mb.save();mb.tr(0,R,zf);mb.rotX(rake*.3);mb.box(0,R+.05,0,W+.07,.035,R*1.25,o.guardCol?hexRGB(o.guardCol):body);mb.restore();
  const hbW=o.hbW||.72,hbY=topY+(o.hbRise||.07),hbZ=topZ+(o.hbBack||.06);
  mb.box(0,topY,topZ,.22,.05,.09,C.dark);
  if(o.clip){for(const s of[-1,1]){mb.cyl(s*.2,topY-.03,topZ+.02,.016,.22,'x',6,C.dark);mb.cyl(s*.3,topY-.04,topZ+.03,.022,.12,'x',6,C.black);}}
  else{mb.cyl(0,hbY,hbZ,.016,hbW,'x',6,o.scooter?C.dark:C.chrome);for(const s of[-1,1])mb.cyl(s*(hbW/2-.05),hbY,hbZ,.022,.11,'x',6,C.black);}
  const gripY=o.clip?topY-.04:hbY,gripZ=o.clip?topZ+.03:hbZ,gripX=o.clip?.3:hbW/2-.05;
  /* mirrors */
  for(const s of[-1,1]){const mx=s*(o.clip?.24:hbW/2-.12);limb(mb,[mx,gripY,gripZ],[mx*1.15,gripY+.18,gripZ-.02],.012,C.dark);mb.box(mx*1.17,gripY+.21,gripZ-.02,.075,.045,.02,C.dark);mb.box(mx*1.17,gripY+.21,gripZ-.009,.065,.035,.004,[.55,.62,.7]);}
  /* headlamp */
  const lampY=topY-(o.lampDrop||.14),lampZ=topZ-.16;
  if(o.lamp==='round'){mb.cyl(0,lampY,lampZ+.03,.1,.14,'z',14,o.lampShell?hexRGB(o.lampShell):C.chrome);mb.cyl(0,lampY,lampZ-.05,.085,.02,'z',14,C.light,C.light,1,1);}
  else if(o.lamp==='twin'){mb.tbox(0,lampY-.1,lampZ+.05,.34,.2,.18,.3,.22,body,0,.06);for(const s of[-1,1])mb.box(s*.07,lampY+.02,lampZ-.06,.08,.05,.03,C.light,1);}
  else{mb.tbox(0,lampY-.08,lampZ+.02,.2,.12,.14,.16,.18,o.lampShell?hexRGB(o.lampShell):acc,0,.03);mb.box(0,lampY+.01,lampZ-.05,.12,.07,.03,C.light,1);if(o.drl)mb.box(0,lampY-.07,lampZ-.05,.16,.02,.02,[.8,.95,1],1);}
  /* engine, frame, swingarm */
  const midZ=(zf+zr)/2+.08;
  if(o.scooter){
    /* step-through scooter: apron, floor, rounded rear body */
    mb.tbox(0,.3,zf+.22,.36,.14,.3,.22,o.moped?.62:.66,body,0,.14);
    mb.box(0,.33,midZ-.05,.3,.06,.5,C.dark);
    mb.tbox(0,.3,zr-.25,.36,.72,.3,.6,.42,body,0,.0);
    if(!o.moped)mb.tbox(0,.72,zr-.22,.3,.6,.24,.5,.06,body);
    /* handlebar cover with lamp */
    mb.tbox(0,hbY-.06,hbZ,.42,.2,.36,.16,.12,body);
    if(o.ledStrip)mb.box(0,hbY-.01,hbZ-.105,.3,.025,.02,[.75,.92,1],1);
    if(o.moped){limb(mb,[0,topY,topZ],[0,.55,zr-.25],.06,body);mb.box(0,.86,zr+.12,.26,.04,.45,C.black);for(const s of[-1,1])mb.box(s*.13,.75,zr+.15,.025,.22,.025,C.black);}
  }else{
    mb.box(0,R+.06,midZ,o.engW||.28,o.engH||.34,o.engL||.44,o.engCol?hexRGB(o.engCol):C.dark);
    if(o.cruiser){mb.cyl(0,R+.33,midZ-.05,.09,.26,'y',10,C.grey);mb.cyl(.16,R+.06,midZ,.12,.04,'x',12,C.chrome);}
    limb(mb,[0,topY-.02,topZ+.05],[0,R+.42,zr-.32],.07,o.frameCol?hexRGB(o.frameCol):C.dark);
    if(o.trellis){const fc=hexRGB(o.frameCol);for(const s of[-1,1]){limb(mb,[s*.12,topY-.06,topZ+.08],[s*.13,R+.18,midZ+.1],.035,fc);limb(mb,[s*.12,topY-.06,topZ+.08],[s*.12,R+.45,zr-.3],.035,fc);}}
    for(const s of[-1,1])limb(mb,[s*.11,Rr,zr],[s*.1,R+.05,midZ+.2],.05,C.dark);
  }
  /* tank */
  if(o.tank){const t=o.tank;mb.tbox(0,t.y,t.z,t.w,t.l,t.tw||t.w*.8,t.tl||t.l*.85,t.h,[body,body],0,t.oz||0);
    if(o.stripe)mb.box(0,t.y+t.h+.003,t.z+(t.oz||0)/2,.05,.006,t.l*.75,hexRGB(o.stripe));
    if(o.tankGuard)for(const s of[-1,1])limb(mb,[s*.2,t.y+.05,t.z-t.l/2],[s*.22,t.y-.15,t.z+t.l/2],.03,C.black);}
  /* seat */
  const sY=o.seatY||.8,sZ=o.seatZ||zr-.4,sL=o.seatL||.62;
  if(o.split){mb.box(0,sY,sZ-.08,.26,.08,sL*.55,C.seat);mb.box(0,sY+.08,sZ+sL*.35,.22,.07,sL*.32,C.seat);}
  else if(o.cruiser){mb.box(0,sY,sZ-.1,.3,.09,.32,C.seat);mb.box(0,sY-.02,sZ+.28,.26,.07,.26,C.seat);for(const s of[-1,1])mb.cyl(s*.1,sY-.09,sZ-.02,.025,.1,'y',6,C.chrome);}
  else mb.box(0,sY,sZ,.27,.09,sL,C.seat);
  /* side panels + tail */
  if(!o.scooter){
    mb.box(0,sY-.18,sZ-.05,.3,.22,.3,o.sidePanel?hexRGB(o.sidePanel):body);
    mb.tbox(0,sY-.1,zr-.08,.2,.42,o.sharpTail?.08:.15,o.sharpTail?.2:.32,o.sharpTail?.2:.1,body,0,o.sharpTail?.12:.04);
    if(o.cruiser)mb.save().tr(0,Rr,zr).rotX(-.25).box(0,Rr+.06,.05,Wr+.12,.04,.72,body).restore();
    else mb.save().tr(0,Rr,zr).rotX(-.5).box(0,Rr+.04,.15,Wr+.05,.03,.4,C.black).restore();
  }
  mb.box(0,sY-.03,(o.scooter?zr+.12:zr+.18),.14,.06,.04,C.tail,.9);
  mb.box(0,sY-.2,(o.scooter?zr+.1:zr+.24),.18,.12,.02,C.plateW);
  for(const s of[-1,1]){mb.box(s*.15,sY-.07,(o.scooter?zr+.08:zr+.2),.06,.035,.035,C.amber,.3);mb.box(s*.14,lampY-.03,lampZ+.03,.05,.035,.035,C.amber,.3);}
  /* exhaust */
  if(o.exhaust==='pea'){mb.cyl(.17,.32,zr-.05,.045,.95,'z',8,C.chrome);}
  else if(o.exhaust==='up'){limb(mb,[.16,.3,midZ],[.18,.62,zr+.12],.09,o.exCol?hexRGB(o.exCol):C.dark);}
  else if(o.exhaust==='under'){mb.box(0,.2,midZ+.2,.22,.12,.38,C.dark);}
  else if(o.exhaust==='side'){mb.cyl(.17,.38,zr-.12,.06,.55,'z',10,C.dark);}
  else if(o.exhaust==='scoot'){mb.cyl(.16,.28,zr-.05,.05,.4,'z',8,C.grey);}
  /* fairings, windscreens, luggage */
  if(o.fairing==='full'){
    mb.tbox(0,.5,zf+.3,.3,.38,.18,.24,.44,body,0,.08);
    for(const s of[-1,1])mb.save().tr(s*.17,.42,zf+.66).rotY(s*.12).box(0,.2,0,.05,.4,.48,body).restore();
    gm.save().tr(0,.98,zf+.42).rotX(.75).box(0,0,0,.24,.22,.015,C.glass).restore();
    mb.tbox(0,.2,midZ,.26,.42,.32,.5,.2,body);
  }
  if(o.fairing==='adv'){
    gm.save().tr(0,topY+.08,topZ-.05).rotX(.3).box(0,.12,0,.34,.36,.02,C.glass).restore();
    mb.save().tr(0,R+.5,zf-.08).rotX(.5).box(0,0,0,.14,.04,.4,body).restore();
    for(const s of[-1,1]){mb.box(s*.36,sY-.12,zr-.15,.16,.36,.46,C.alu);}
    mb.box(0,sY+.06,zr+.08,.32,.03,.36,C.black);
  }
  if(o.visor)gm.save().tr(0,lampY+.13,lampZ+.03).rotX(.5).box(0,0,0,.2,.14,.015,o.visorCol?hexRGB(o.visorCol):C.glass).restore();
  if(o.grab)mb.box(0,sY+.03,zr+.12,.28,.03,.12,C.chrome);
  if(o.belly)mb.tbox(0,.16,midZ-.05,.24,.4,.32,.5,.18,body);
  /* cockpit: cluster + gloves (seen from the rider's eyes) */
  const clY=o.clip?topY+.06:hbY+.05,clZ=(o.clip?topZ:hbZ)-.02;
  if(o.digital){ck.box(0,clY,clZ,.2,.1,.06,C.black);ck.box(0,clY+.005,clZ+.032,.17,.075,.005,[.25,.65,1],1);}
  else{ck.cyl(0,clY,clZ+.01,.07,.05,'z',14,C.black);ck.cyl(0,clY,clZ+.04,.06,.006,'z',14,[.85,.85,.8],.25);ck.box(.02,clY+.01,clZ+.045,.008,.05,.004,[1,.3,.2],1);}
  for(const s of[-1,1])ck.box(s*gripX,gripY,gripZ,.09,.09,.1,o.glove?hexRGB(o.glove):[.15,.15,.15]);
  /* rider */
  buildRider(rd,{seat:[sY,sZ-.12],grip:[gripX,gripY,gripZ],peg:o.scooter?[.15,.36,zf+.55]:[.2,.36,midZ+.12],lean:o.lean==null?.2:o.lean,shirt:hexRGB(o.shirt||'#2E4A7A'),pants:hexRGB(o.pants||'#222B38'),helmet:hexRGB(o.helmet||'#C8C8C8'),skin:SKINS[1],glove:o.glove?hexRGB(o.glove):null});
  return {body:mb.mesh(),glass:gm.mesh(),cockpit:ck.mesh(),rider:rd.mesh(),eye:[0,sY+.78,sZ-.08],len:wb+R+Rr+.2,wid:.8,two:true,
    lights:{head:[[0,lampY,lampZ-.08]],tail:[[0,sY-.03,zr+.2]]}};
}

/* ---------- auto-rickshaw ---------- */
function buildAuto(o){
  o=o||{};const mb=new MB(),ck=new MB(),rd=new MB(),gm=new MB();
  const G=hexRGB(o.body||'#1E7A43'),Y=hexRGB(o.roof||'#F2C21B');
  wheel(mb,0,.21,-.98,.21,.11);for(const s of[-1,1])wheel(mb,s*.56,.21,.78,.21,.12);
  /* nose cowl + front panel */
  mb.tbox(0,.24,-1.0,.36,.34,.3,.26,.42,G,0,.02);
  mb.tbox(0,.3,-.66,1.04,.4,1.0,.34,.66,G,0,.03);
  mb.box(0,.36,.25,1.3,.24,1.4,G);
  mb.tbox(0,.48,.82,1.32,.6,1.2,.5,.42,[Y,G]);
  /* windscreen and canopy */
  gm.save().tr(0,.96,-.82).rotX(.22).box(0,.32,0,1.02,.64,.025,C.glass).restore();
  for(const s of[-1,1])mb.box(s*.52,1.28,-.8,.05,.66,.05,C.black);mb.box(0,1.6,-.8,1.08,.05,.05,C.black);
  mb.tbox(0,1.6,.18,1.32,2.0,1.22,1.8,.14,[Y,C.black],0,.04);
  mb.box(0,1.7,.2,1.18,.06,1.7,C.black);
  for(const[x,z]of[[-.6,-.78],[.6,-.78],[-.62,1.0],[.62,1.0]])mb.box(x,1.1,z,.04,1.0,.04,C.black);
  mb.box(0,1.08,1.08,1.24,1.0,.03,C.black);mb.box(0,1.36,1.1,.5,.18,.02,C.glass);
  /* seats */
  mb.box(0,.68,-.25,.42,.1,.36,C.seat);
  mb.box(0,.66,.62,1.12,.12,.42,C.seat);mb.box(0,.95,.86,1.12,.48,.08,C.seat);
  /* handlebar + meter + lamps */
  const hbY=1.0,hbZ=-.6;
  mb.cyl(0,hbY,hbZ,.017,.66,'x',6,C.chrome);for(const s of[-1,1])mb.cyl(s*.3,hbY,hbZ,.024,.1,'x',6,C.black);
  limb(mb,[0,.66,-.82],[0,hbY,hbZ],.05,C.dark);
  mb.box(.3,1.1,hbZ-.02,.16,.12,.08,C.black);mb.box(.3,1.11,hbZ-.065,.11,.05,.005,[1,.25,.15],1);
  mb.cyl(0,.66,-1.19,.08,.08,'z',12,C.chrome);mb.cyl(0,.66,-1.24,.068,.02,'z',12,C.light,C.light,1,1);
  for(const s of[-1,1]){mb.box(s*.5,.62,-.95,.06,.04,.04,C.amber,.3);mb.box(s*.55,.62,1.08,.08,.06,.03,C.tail,.8);}
  mb.box(0,.52,1.09,.3,.12,.02,C.plateY);mb.box(0,.86,-1.05,.24,.08,.02,C.plateY);
  mb.box(0,1.6,-.9,.5,.02,.08,C.black);
  /* cockpit: hands on handlebar, the fare meter glowing */
  for(const s of[-1,1])ck.box(s*.3,hbY,hbZ,.09,.09,.1,SKINS[2]);
  ck.box(.3,1.11,hbZ-.066,.1,.04,.004,[1,.35,.2],1);
  const lk=o.look;buildRider(rd,{seat:[.7,-.22],grip:[.3,hbY,hbZ],peg:[.15,.48,-.7],lean:.08,shirt:lk?hexRGB(lk.shirt):C.khaki,pants:lk?hexRGB(lk.pants):C.khaki,skin:lk?SKINS[2]:SKINS[3],noHelmet:true,sleeve:lk?SKINS[2]:C.khaki});
  return {body:mb.mesh(),glass:gm.mesh(),cockpit:ck.mesh(),rider:rd.mesh(),eye:[0,1.42,-.2],len:2.7,wid:1.34,lights:{head:[[0,.66,-1.26]],tail:[[-.55,.62,1.1],[.55,.62,1.1]]}};
}

/* ---------- cars (hatch, sedan, suv, police) ---------- */
const CARDIM={
  hatch:{L:3.85,W:1.7,H:1.5,R:.3,belt:.86,cf:-.6,cb:1.55,rf:-.05,rb:1.42,dx:.37},
  sedan:{L:4.4,W:1.73,H:1.47,R:.31,belt:.86,cf:-.7,cb:.95,rf:-.15,rb:.6,dx:.38,trunk:true},
  suv:{L:4.55,W:1.86,H:1.82,R:.37,belt:1.06,cf:-.85,cb:2.05,rf:-.45,rb:2.08,dx:.42,rails:true,spare:true},
  veloce:{L:4.55,W:1.98,H:1.14,R:.34,belt:.72,cf:-.5,cb:.9,rf:-.1,rb:.6,dx:.4,wing:true,low:true},
  zephyr:{L:4.7,W:1.92,H:1.3,R:.35,belt:.8,cf:-.3,cb:1.25,rf:.12,rb:1.0,dx:.4,trunk:true,low:true},
  regent:{L:5.35,W:1.96,H:1.56,R:.38,belt:.96,cf:-.55,cb:1.5,rf:-.08,rb:1.15,dx:.42,trunk:true,chrome:true},
  monarch:{L:5.0,W:2.0,H:1.88,R:.41,belt:1.12,cf:-.95,cb:2.25,rf:-.55,rb:2.3,dx:.44,rails:true,chrome:true},
};
function buildCar(type,colHex,o){
  o=o||{};const d=CARDIM[type==='police'?'suv':type];
  const mb=new MB(),ck=new MB(),sw=new MB();
  const col=hexRGB(colHex),dk=col.map(v=>v*.55);
  const L=d.L,W=d.W,H=d.H,R=d.R,b=d.belt;
  /* lower body with a slight shoulder taper */
  mb.tbox(0,.26,0,W,L,W-.06,L-.12,b-.26,col);
  /* greenhouse: glass sides, painted roof */
  const cz=(d.cf+d.cb)/2,cl=d.cb-d.cf,rz=(d.rf+d.rb)/2,rl=d.rb-d.rf;
  mb.tbox(0,b,cz,W-.12,cl,W-.3,rl,H-b-.05,[col,C.glass],0,rz-cz);
  mb.box(0,H-.03,rz,W-.3,.06,rl,col);
  for(const s of[-1,1]){const pz=d.trunk?(d.cf+d.cb)/2+.1:(d.cf+d.cb)/2+.2;const top=(W-.3)/2,bot=(W-.12)/2;limb(mb,[s*(bot-.005),b+.02,pz],[s*(top-.005),H-.06,pz-.05],.06,C.black);}
  /* bumpers, grille, lights, plates, mirrors */
  mb.box(0,.4,-L/2+.02,W-.02,.2,.08,dk);mb.box(0,.4,L/2-.02,W-.02,.2,.08,dk);
  mb.box(0,.66,-L/2+.005,W*.42,.14,.02,C.black);
  for(const s of[-1,1]){
    mb.box(s*(W/2-.24),.72,-L/2+.005,.34,.12,.03,C.light,1);
    mb.box(s*(W/2-.18),.76,L/2-.005,.3,.12,.03,C.tail,.7);
    mb.box(s*(W/2+.06),b+.14,d.cf+.18,.12,.1,.06,col);
    mb.box(s*(W/2-.06),.62,-L/2+.03,.08,.04,.03,C.amber,.3);
  }
  const plate=o.taxi?C.plateY:C.plateW;
  mb.box(0,.44,-L/2-.012,.42,.11,.02,plate);mb.box(0,.56,L/2+.012,.42,.11,.02,plate);
  /* wheels and dark arches */
  for(const sx of[-1,1])for(const sz of[-1,1]){const ax=sz*(L/2-.72);wheel(mb,sx*(W/2-.08),R,ax,R,.2);mb.box(sx*(W/2-.02),R+.1,ax,.06,.2,R*2+.1,C.black);}
  if(d.rails)for(const s of[-1,1])mb.box(s*(W/2-.22),H+.02,rz,.04,.05,rl*.85,C.black);
  if(d.spare&&!o.police)mb.cyl(0,.95,L/2+.12,.34,.22,'z',14,C.black,C.black);
  const chrome=[.86,.87,.9];
  if(d.chrome){mb.box(0,.66,-L/2-.004,W*.34,.36,.03,chrome,.15);for(let i=0;i<6;i++)mb.box(-W*.15+i*W*.06,.66,-L/2-.02,.012,.32,.01,[.3,.3,.32]);
    for(const s of[-1,1])mb.box(s*(W/2+.004),b-.03,0,.012,.035,L*.78,chrome,.1);mb.box(0,b+.02,-L/2+.6,.04,.12,.04,chrome,.2);}
  if(d.wing){for(const s of[-1,1]){mb.box(s*.6,b+.16,L/2-.28,.05,.26,.1,dk);mb.box(s*(W/2+.004),.52,.55,.012,.26,.8,C.black);}
    mb.box(0,b+.3,L/2-.28,W*.86,.035,.34,dk);mb.box(0,.3,L/2,W*.6,.1,.04,C.black);for(const s of[-1,1])mb.cyl(s*.22,.36,L/2+.03,.05,.06,'z',10,[.5,.5,.52]);}
  if(d.low){mb.box(0,.22,-L/2+.05,W*.9,.06,.12,C.black);}
  let lightbar=null,decal=null;
  if(o.police){
    for(const s of[-1,1])mb.box(s*(W/2+.003),.47,0,.01,.14,L-.6,[.12,.28,.78]);
    mb.box(0,H+.04,rz-.2,1.0,.06,.24,C.black);
    const red=new MB();red.box(-.26,H+.12,rz-.2,.44,.12,.2,[.9,.1,.1]);const blu=new MB();blu.box(.26,H+.12,rz-.2,.44,.12,.2,[.15,.3,1]);
    lightbar={red:red.mesh(),blue:blu.mesh(),pos:[0,H+.14,rz-.2]};
    const dm=new MB();
    for(const s of[-1,1]){const x=s*(W/2+.012),y0=b-.46,y1=b-.06,z0=-.95,z1=.95;
      if(s>0)dm.quad([x,y0,z1],[x,y0,z0],[x,y1,z0],[x,y1,z1],[1,1,1],[1,0,0],[0,1,1,1,1,0,0,0]);
      else dm.quad([x,y0,z0],[x,y0,z1],[x,y1,z1],[x,y1,z0],[1,1,1],[-1,0,0],[0,1,1,1,1,0,0,0]);}
    decal={mesh:dm.mesh(),tex:hoysalaTex()};
  }
  /* cockpit interior: right-hand drive */
  const dx=d.dx,fz=d.cf+.12;
  ck.box(0,b-.06,fz+.22,W-.2,.24,.5,[.13,.13,.14]);
  ck.box(dx,b+.1,fz+.4,.42,.1,.24,C.black);
  for(const s of[-1,1])ck.cyl(dx+s*.09,b+.08,fz+.52,.062,.01,'z',14,[.82,.84,.86],.35);
  ck.box(0,b+.02,fz+.47,.24,.14,.01,[.2,.45,.8],.8);
  ck.box(0,b-.18,fz+.75,.22,.2,.6,[.15,.15,.16]);
  for(const s of[-1,1]){
    limb(ck,[s*(W/2-.14),b+.06,fz],[s*((W-.3)/2-.04),H-.08,d.rf+.02],.07,[.14,.14,.15]);
    ck.box(s*(W/2-.08),b-.1,(d.cf+d.cb)/2,.06,.24,cl,[.2,.2,.21]);
  }
  ck.box(0,H-.1,rz,W-.36,.03,rl,[.6,.6,.58]);
  ck.box(0,H-.2,d.rf+.18,.24,.07,.03,C.black);ck.box(0,H-.2,d.rf+.2,.21,.05,.004,[.55,.6,.66]);
  const wheelPos=[dx,b+.04,fz+.72];
  sw.ring(0,0,0,.17,.017,16,[.08,.08,.09]);sw.box(0,0,0,.07,.07,.05,[.15,.15,.16]);sw.box(0,-.09,0,.03,.18,.02,[.12,.12,.12]);sw.box(-.09,0,0,.18,.03,.02,[.12,.12,.12]);sw.box(.09,0,0,.18,.03,.02,[.12,.12,.12]);
  return {body:mb.mesh(),cockpit:ck.mesh(),steer:sw.mesh(),steerPos:wheelPos,eye:[dx,H-.33,fz+1.08],len:L,wid:W,lightbar,decal,
    lights:{head:[[-(W/2-.24),.72,-L/2],[W/2-.24,.72,-L/2]],tail:[[-(W/2-.18),.76,L/2],[W/2-.18,.76,L/2]]}};
}
function hoysalaTex(){
  return textTex('hoysala',(c,w,h)=>{c.fillStyle='#F4F4F2';c.fillRect(0,0,w,h);c.fillStyle='#1E47B8';c.font='bold 60px "Barlow Semi Condensed", Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('HOYSALA',w/2,h*.38);c.fillStyle='#C21E1E';c.font='bold 34px Arial, sans-serif';c.fillText('POLICE',w/2,h*.78);},256,128);
}

/* ---------- heavy vehicles ---------- */
function buildBus(scheme){
  const mb=new MB();const L=11,W=2.5,H=3.1;
  const A=hexRGB(scheme==='red'?'#B5272D':'#C9CED6'),B=hexRGB(scheme==='red'?'#F2F0EA':'#2B5BB8');
  mb.box(0,.85,0,W,1.0,L,A);
  mb.box(0,1.9,0,W+.01,1.1,L-.1,C.glass);
  for(let z=-L/2+.9;z<L/2-.5;z+=1.25)for(const s of[-1,1])mb.box(s*(W/2+.008),1.9,z,.02,1.1,.12,A);
  mb.box(0,2.72,0,W,.55,L,B);mb.box(0,1.36,0,W+.02,.12,L,B);
  mb.box(0,1.75,-L/2-.005,W-.2,1.4,.02,C.glass);
  mb.box(0,2.72,-L/2-.01,1.7,.28,.02,[1,.55,.1],1);
  for(const s of[-1,1]){mb.box(s*(W/2-.3),.62,-L/2-.005,.3,.14,.02,C.light,1);mb.box(s*(W/2-.25),.8,L/2+.005,.2,.3,.02,C.tail,.7);}
  mb.box(-W/2-.005,1.25,-L/2+1.6,.02,2.1,.9,C.dark);mb.box(-W/2-.005,1.25,1.2,.02,2.1,.9,C.dark);
  for(const z of[-L/2+2.0,L/2-2.4,L/2-1.4])for(const s of[-1,1])wheel(mb,s*(W/2-.2),.5,z,.5,.32);
  mb.box(0,.5,L/2+.01,.5,.14,.02,C.plateY);
  return {body:mb.mesh(),len:L,wid:W,lights:{head:[[-.95,.62,-L/2],[.95,.62,-L/2]],tail:[[-1,.8,L/2],[1,.8,L/2]]}};
}
function buildTruck(colHex,tanker){
  const mb=new MB();const L=tanker?7.4:7.2,W=2.35;const col=hexRGB(colHex);
  const cz=-L/2+.9;
  mb.box(0,1.5,cz,W,2.0,1.8,col);mb.box(0,2.62,cz-.1,W-.1,.26,1.5,col.map(v=>v*.8));
  mb.box(0,1.95,cz-.905,W-.3,.8,.02,C.glass);for(const s of[-1,1])mb.box(s*(W/2+.005),1.95,cz-.3,.02,.6,.8,C.glass);
  mb.box(0,.95,cz-.91,W-.4,.4,.02,C.black);
  for(const s of[-1,1])mb.box(s*(W/2-.3),.75,cz-.91,.26,.14,.02,C.light,1);
  mb.box(0,.8,0,W-.4,.3,L-.2,C.dark);
  if(tanker){const tc=hexRGB('#2E6DB4');mb.cyl(0,1.9,1.0,1.0,4.6,'z',16,tc,tc);mb.box(0,1.1,1.0,W-.2,.2,4.8,C.dark);mb.box(0,2.95,1.0,.5,.12,.5,C.dark);}
  else{const bed=hexRGB('#3F6B3A');mb.box(0,1.75,.95,W,1.6,4.9,bed);mb.box(0,2.62,.95,W-.05,.16,4.85,hexRGB('#2F4FA0'));
    for(let i=0;i<4;i++)mb.box(0,1.2+i*.3,3.41,W-.1,.08,.02,[[.9,.2,.2],[.95,.75,.1],[.2,.6,.3],[.2,.4,.85]][i]);}
  for(const s of[-1,1])mb.box(s*(W/2-.2),.9,L/2+.005,.22,.22,.02,C.tail,.7);
  mb.box(0,.6,L/2+.01,.5,.14,.02,C.plateY);
  for(const z of[cz+.2,1.6,2.6])for(const s of[-1,1])wheel(mb,s*(W/2-.22),.5,z,.5,.34);
  return {body:mb.mesh(),len:L,wid:W,lights:{head:[[-.9,.75,-L/2],[.9,.75,-L/2]],tail:[[-.97,.9,L/2],[.97,.9,L/2]]}};
}

/* ---------- pedestrians and animals (two walk poses each) ---------- */
/* people of every age: kind decides how they move; scale shrinks children */
const PED_LOOKS=[
  {kind:'office',shirt:'#F2F2EE',pants:'#4A4F57',bag:'#2B2B2B',w:3},{kind:'office',shirt:'#8FB4E3',pants:'#1E1E22',bag:'#4E342E',w:3},
  {kind:'office',kurta:'#E7A1B5',pants:'#2E2E38',bag:'#5D4037',w:2},{kind:'walk',saree:'#D35400',blouse:'#7D3C98',w:3},
  {kind:'walk',saree:'#1ABC9C',blouse:'#B03A2E',w:2},{kind:'walk',saree:'#2E86C1',blouse:'#F4D03F',w:2},
  {kind:'elder',shirt:'#F5F5F0',pants:'#F5F5F0',dhoti:true,grey:true,stick:true,w:2},{kind:'elder',saree:'#7B241C',blouse:'#7B241C',grey:true,w:2},
  {kind:'run',shirt:'#B6F23A',pants:'#151515',shorts:true,cap:'#151515',w:1},{kind:'run',shirt:'#E53935',pants:'#1A237E',shorts:true,w:1},
  {kind:'walk',shirt:'#2C6E9B',pants:'#2B3A55',backpack:'#C0392B',w:2},{kind:'walk',shirt:'#151515',pants:'#34495E',w:3},
  {kind:'walk',shirt:'#8D6E63',pants:'#1F4E8C',dhoti:true,w:2},{kind:'walk',shirt:'#7E57C2',pants:'#2B3A55',w:2},
  {kind:'kid',shirt:'#F7F7F7',pants:'#1F2D5A',shorts:true,backpack:'#1565C0',scale:.62,w:0},{kind:'kid',shirt:'#FBC02D',pants:'#C62828',shorts:true,scale:.58,w:0},
  {kind:'kid',kurta:'#EC407A',pants:'#EC407A',frock:true,scale:.6,w:0},{kind:'kid',shirt:'#43A047',pants:'#5D4037',shorts:true,scale:.55,w:0},
];
function buildPed(look,pose,skin,run){
  const mb=new MB();const sk=skin||SKINS[0];const hair=look.grey?[.82,.82,.8]:C.black;
  const top=hexRGB(look.shirt||look.kurta||look.blouse);
  const sw=(pose?1:-1)*(run?.7:.35);const bend=look.kind==='elder'?.18:run?.25:0;
  if(look.saree||look.frock){
    const sc=hexRGB(look.saree||look.kurta);
    if(look.frock){for(const q of[-1,1])mb.box(q*.08,.25,q*sw*.15,.1,.5,.11,sk);mb.tbox(0,.45,0,.48,.36,.3,.22,.5,sc);}
    else mb.tbox(0,0,0,.42,.3,.32,.24,.95,sc);
    for(const q of[-1,1])mb.box(q*.08,.03,q*sw*.12-.03,.08,.05,.18,[.15,.1,.08]);
  }else{
    const pc=hexRGB(look.pants);
    for(const q of[-1,1]){const a=q*sw;mb.save().tr(q*.1,.88,0).rotX(a);
      if(look.shorts){mb.box(0,-.2,0,.15,.4,.16,pc).box(0,-.64,0,.11,.48,.12,sk);}else mb.box(0,-.44,0,.13,.88,.14,pc);
      mb.box(0,-.86,-.05,.12,.07,.24,look.kind==='run'?[.9,.9,.92]:[.12,.1,.09]).restore();}
    if(look.dhoti)mb.tbox(0,.15,0,.42,.3,.36,.26,.75,pc);
  }
  mb.save().tr(0,.88,0).rotX(-bend);
  if(look.kurta&&!look.frock)mb.tbox(0,-.3,0,.4,.24,.4,.24,.82,top);else mb.tbox(0,0,0,.38,.22,.42,.24,.5,top);
  for(const q of[-1,1]){const a=-q*sw*(run?1.3:1);mb.save().tr(q*.24,.46,0).rotX(a+(run?-.6:0)).box(0,-.28,0,.08,.56,.09,sk).box(0,-.12,0,.09,.24,.1,top).restore();}
  mb.box(0,.54,0,.1,.08,.1,sk);mb.blob(0,.68,0,.11,.13,.12,sk);mb.blob(0,.74,.02,.12,.08,.13,hair);
  if(look.saree||look.kurta)mb.blob(0,.68,.12,.07,.07,.06,hair);
  if(look.cap)mb.box(0,.8,-.04,.24,.05,.28,hexRGB(look.cap));
  if(look.backpack)mb.box(0,.24,.17,.3,.36,.14,hexRGB(look.backpack));
  mb.restore();
  if(look.bag){mb.box(.27,.82,0,.08,.26,.32,hexRGB(look.bag));limb(mb,[.27,.95,0],[-.12,1.35,0],.025,hexRGB(look.bag));}
  if(look.stick)limb(mb,[.3,1.0,-.12],[.34,0,-.25],.035,[.45,.32,.2]);
  return mb.mesh();
}
/* seated on the footpath (with a steel bowl) and sleeping under a blanket */
function buildSit(look,skin){
  const mb=new MB();const sk=skin||SKINS[3];const top=hexRGB(look.shirt||look.blouse||'#8D7B68'),low=hexRGB(look.pants||look.saree||'#5D4E37');
  mb.box(0,.12,.02,.5,.18,.5,low);for(const q of[-1,1])mb.box(q*.14,.1,-.2,.14,.12,.36,low);
  mb.tbox(0,.2,.05,.36,.22,.36,.2,.48,top);mb.box(0,.72,.04,.1,.08,.1,sk);mb.blob(0,.86,.04,.11,.13,.12,sk);mb.blob(0,.92,.06,.12,.08,.13,look.grey?[.8,.8,.78]:C.black);
  for(const q of[-1,1])limb(mb,[q*.2,.6,.04],[q*.1,.3,-.22],.08,sk);
  mb.cyl(0,.03,-.45,.12,.06,'y',12,[.72,.74,.76]);
  return mb.mesh();
}
function buildLie(col){
  const mb=new MB();mb.box(0,.02,0,.8,.04,1.9,[.32,.27,.2]);
  mb.tbox(0,.04,.08,.62,1.5,.5,1.4,.22,hexRGB(col));mb.blob(0,.16,-.78,.12,.11,.13,SKINS[3]);mb.blob(0,.2,-.82,.12,.07,.12,C.black);
  return mb.mesh();
}
function buildCart(kind){
  const mb=new MB();const wood=[.5,.36,.22];
  mb.box(0,.85,0,.9,.12,1.7,wood);for(const s of[-1,1]){wheel(mb,s*.5,.42,.25,.42,.05,[.5,.5,.52]);mb.box(s*.35,.42,-.7,.05,.84,.05,wood);}
  limb(mb,[0,.9,.85],[0,.95,1.4],.05,wood);
  const fr=kind===0?[[1,.55,.1],[.95,.2,.15],[.3,.7,.2],[.98,.85,.2]]:kind===1?[[.3,.65,.2],[.8,.2,.15],[.95,.75,.3],[.55,.3,.55]]:[[.95,.95,.9],[.9,.8,.5],[.7,.5,.3],[.95,.6,.2]];
  const r=mulberry32(5+kind);for(let i=0;i<34;i++){const c=fr[Math.floor(r()*fr.length)];mb.blob((r()-.5)*.75,.97+r()*.12,(r()-.5)*1.5,.09,.08,.09,c);}
  mb.box(0,1.6,0,.04,1.5,.04,[.3,.3,.3]);
  const uc=[[.9,.2,.15],[.15,.45,.85],[.95,.75,.1]][kind%3];for(let i=0;i<8;i++){const a0=i/8*TAU,a1=(i+1)/8*TAU;mb.tri([0,2.45,0],[Math.cos(a0)*1.1,2.2,Math.sin(a0)*1.1],[Math.cos(a1)*1.1,2.2,Math.sin(a1)*1.1],i%2?uc:[.96,.96,.94],[0,1,0]);mb.tri([0,2.44,0],[Math.cos(a1)*1.1,2.19,Math.sin(a1)*1.1],[Math.cos(a0)*1.1,2.19,Math.sin(a0)*1.1],i%2?uc:[.96,.96,.94],[0,-1,0]);}
  return mb.mesh();
}
function buildCow(col,pose,lying){
  const mb=new MB();const c=hexRGB(col);const by=lying?.45:1.0;
  mb.box(0,by,0,.62,.62,1.5,c);mb.blob(0,by+.36,-.42,.22,.18,.22,c);
  mb.save().tr(0,by+.1,-.75).rotX(lying?-.2:.5).box(0,0,-.2,.26,.28,.5,c).restore();
  const hz=lying?-1.05:-.98,hy=lying?by+.08:by-.1;
  for(const s of[-1,1]){limb(mb,[s*.08,hy+.18,hz],[s*.24,hy+.36,hz+.05],.05,[.85,.8,.68]);mb.box(s*.16,hy+.12,hz+.06,.12,.04,.08,c);}
  mb.box(0,by-.36,-.55,.12,.2,.24,c.map(v=>v*.9));
  if(!lying){for(const sx of[-1,1])for(const sz of[-1,1]){const a=(sx*sz>0?1:-1)*(pose?.3:-.3);mb.save().tr(sx*.2,by-.3,sz*.55).rotX(a).box(0,-.36,0,.12,.72,.12,c).box(0,-.72,0,.12,.06,.13,C.black).restore();}}
  else for(const s of[-1,1])mb.box(s*.34,.2,0,.12,.14,1.0,c);
  limb(mb,[0,by+.2,.74],[0,by-.45,.9],.05,c);
  return mb.mesh();
}
function buildDog(col,pose){
  const mb=new MB();const c=hexRGB(col);
  mb.box(0,.48,0,.24,.26,.7,c);
  mb.save().tr(0,.62,-.38).rotX(.4).box(0,.08,0,.16,.2,.16,c).restore();
  mb.box(0,.66,-.5,.16,.16,.22,c);mb.box(0,.62,-.64,.08,.08,.1,c.map(v=>v*.6));
  for(const s of[-1,1])mb.box(s*.06,.78,-.46,.05,.1,.04,c);
  for(const sx of[-1,1])for(const sz of[-1,1]){const a=(sx*sz>0?1:-1)*(pose?.45:-.45);mb.save().tr(sx*.08,.38,sz*.26).rotX(a).box(0,-.18,0,.06,.38,.07,c).restore();}
  limb(mb,[0,.56,.34],[0,.78,.5],.05,c);
  return mb.mesh();
}
function buildCat(col,pose){
  const mb=new MB();const c=hexRGB(col);
  mb.box(0,.22,0,.15,.15,.42,c);mb.box(0,.32,-.25,.13,.12,.13,c);
  for(const s of[-1,1]){mb.tri([s*.03,.38,-.27],[s*.065,.38,-.22],[s*.05,.45,-.25],c,[0,0,-1]);mb.box(s*.035,.33,-.316,.025,.02,.005,[1,.85,.1],.8);}
  for(const sx of[-1,1])for(const sz of[-1,1]){const a=(sx*sz>0?1:-1)*(pose?.55:-.55);mb.save().tr(sx*.05,.16,sz*.15).rotX(a).box(0,-.08,0,.04,.18,.04,c).restore();}
  limb(mb,[0,.26,.2],[0,.5,.32],.035,c);
  return mb.mesh();
}

/* ---------- vehicle catalogue ---------- */
const TWO_SPECS={
  saathi:{R:.24,wb:1.12,col:'#3B6FB6',scooter:true,moped:true,lamp:'round',lampShell:'#3B6FB6',hbW:.66,hbRise:.12,seatY:.78,seatZ:.28,seatL:.6,exhaust:'scoot',lean:.02,shirt:'#5D6D7E',helmet:'#F2F2F2'},
  sakhi:{R:.22,wb:1.24,W:.1,col:'#B03A3A',scooter:true,lamp:'angular',lampShell:'#B03A3A',hbW:.66,hbRise:.05,seatY:.76,seatZ:.3,seatL:.68,exhaust:'scoot',lean:.03,shirt:'#E1E1D8',helmet:'#2C3E50',lampDrop:.06},
  bijli:{R:.23,wb:1.3,W:.11,col:'#E8ECEF',scooter:true,lamp:'angular',lampShell:'#1F9E92',ledStrip:true,digital:true,hbW:.68,hbRise:.05,seatY:.77,seatZ:.32,seatL:.7,exhaust:'none',lean:.03,shirt:'#1F9E92',helmet:'#111111',lampDrop:.06},
  pratham:{R:.29,wb:1.25,col:'#B71C1C',acc:'#111',lamp:'angular',lampShell:'#111',visor:true,tank:{y:.72,z:-.12,w:.26,l:.44,h:.18,oz:.03},seatY:.8,seatZ:.3,seatL:.72,hbW:.72,exhaust:'side',grab:true,sidePanel:'#B71C1C',shirt:'#F0EDE4',pants:'#2B3445',helmet:'#B71C1C'},
  rocket:{R:.3,wb:1.35,W:.11,Wr:.14,col:'#123A8C',acc:'#111',lamp:'angular',lampShell:'#123A8C',visor:true,drl:true,tank:{y:.72,z:-.1,w:.36,l:.5,h:.22,tw:.26,oz:.05},split:true,seatY:.8,seatZ:.32,seatL:.7,hbW:.74,exhaust:'under',belly:true,sharpTail:true,shirt:'#222',pants:'#1A2230',helmet:'#E53935',lean:.3},
  maharaja:{R:.33,Rr:.31,wb:1.39,W:.1,Wr:.12,col:'#5B1A1A',acc:'#111',lamp:'round',lampShell:'#C8CCD2',cruiser:true,tank:{y:.78,z:-.12,w:.3,l:.52,h:.22,tw:.22,oz:.04},stripe:'#D4AF37',seatY:.82,seatZ:.3,hbW:.8,hbRise:.12,exhaust:'pea',sidePanel:'#5B1A1A',guardCol:'#5B1A1A',shirt:'#4E3B2A',pants:'#2B3445',helmet:'#1A1A1A',lean:.08},
  nandi:{R:.35,Rr:.31,wb:1.5,W:.09,Wr:.13,col:'#7B7B55',acc:'#222',lamp:'round',lampShell:'#222',fairing:'adv',tank:{y:.86,z:-.12,w:.36,l:.5,h:.22,tw:.28,oz:.04},tankGuard:true,seatY:.88,seatZ:.32,seatL:.7,hbW:.82,hbRise:.15,fork:.95,exhaust:'up',exCol:'#222',shirt:'#5D4E37',pants:'#3B3B3B',helmet:'#E8E2D0',lean:.12},
  kesari:{R:.3,wb:1.36,W:.11,Wr:.15,col:'#F26B1D',acc:'#111',lamp:'angular',lampShell:'#111',drl:true,trellis:true,frameCol:'#F26B1D',tank:{y:.74,z:-.08,w:.38,l:.46,h:.22,tw:.24,tl:.36,oz:.06},split:true,seatY:.81,seatZ:.32,hbW:.76,exhaust:'up',exCol:'#333',sharpTail:true,shirt:'#111',pants:'#222',helmet:'#F26B1D',lean:.3,glove:'#F26B1D'},
  garuda:{R:.29,wb:1.33,W:.1,Wr:.14,col:'#1B3FA0',acc:'#C0C0C0',lamp:'twin',fairing:'full',clip:true,tank:{y:.74,z:-.06,w:.34,l:.44,h:.2,tw:.24,oz:.05},split:true,seatY:.8,seatZ:.34,exhaust:'under',sharpTail:true,shirt:'#1B3FA0',pants:'#1A1A1A',helmet:'#FFFFFF',lean:.5,digital:true},
  agni:{R:.31,wb:1.42,W:.12,Wr:.19,col:'#C62828',acc:'#EEE',lamp:'twin',fairing:'full',clip:true,tank:{y:.76,z:-.06,w:.4,l:.48,h:.22,tw:.28,oz:.05},split:true,seatY:.82,seatZ:.36,exhaust:'side',sharpTail:true,shirt:'#C62828',pants:'#111',helmet:'#111',lean:.55,digital:true,engW:.34},
};
const VEH={
  saathi:{name:'Saathi 50',sub:'Moped',cat:'two',top:65,accel:2.4,brake:7,handling:1.4,susp:1.55,cost:2,engine:{base:120,range:180,wave:'sawtooth',putt:24,gears:2,vol:.8},horn:'beep'},
  sakhi:{name:'Sakhi 110',sub:'Scooter',cat:'two',top:92,accel:3.4,brake:8,handling:1.35,susp:1.45,cost:3,engine:{base:95,range:170,wave:'sawtooth',putt:0,gears:1},horn:'beep'},
  bijli:{name:'Bijli e-Scoot',sub:'Electric scooter',cat:'two',top:100,accel:4.6,brake:8.5,handling:1.35,susp:1.3,cost:3,engine:{base:260,range:520,wave:'sine',putt:0,gears:1,vol:.6},horn:'beep2'},
  pratham:{name:'Pratham 100',sub:'Commuter',cat:'two',top:98,accel:3.4,brake:8,handling:1.3,susp:1.35,cost:3,engine:{base:70,range:130,wave:'sawtooth',putt:14,gears:4},horn:'beep'},
  rocket:{name:'Rocket 200',sub:'Sports commuter',cat:'two',top:135,accel:5.2,brake:9.5,handling:1.25,susp:1.2,cost:4,engine:{base:60,range:150,wave:'sawtooth',putt:10,gears:5},horn:'beep2'},
  maharaja:{name:'Maharaja 350',sub:'Retro cruiser',cat:'two',top:120,accel:4.2,brake:8.5,handling:1.1,susp:1.05,cost:5,engine:{base:34,range:80,wave:'sawtooth',putt:9,gears:5},horn:'beep2'},
  nandi:{name:'Nandi 450 ADV',sub:'Adventure tourer',cat:'two',top:150,accel:5.6,brake:9.5,handling:1.15,susp:.75,cost:6,engine:{base:45,range:120,wave:'sawtooth',putt:7,gears:6},horn:'beep2'},
  kesari:{name:'Kesari 390',sub:'Street naked',cat:'two',top:168,accel:6.6,brake:10.5,handling:1.25,susp:1.1,cost:6,engine:{base:55,range:170,wave:'sawtooth',putt:0,gears:6},horn:'sport'},
  garuda:{name:'Garuda 155R',sub:'Faired sports',cat:'two',top:142,accel:5.4,brake:10,handling:1.25,susp:1.2,cost:5,engine:{base:80,range:220,wave:'sawtooth',putt:0,gears:6},horn:'sport'},
  agni:{name:'Agni 1000RR',sub:'Superbike',cat:'two',top:250,accel:9.5,brake:12,handling:1.15,susp:1.1,cost:12,engine:{base:70,range:300,wave:'sawtooth',putt:0,gears:6,vol:1.1},horn:'sport'},
  auto:{name:'Namma Auto',sub:'Auto-rickshaw',cat:'three',top:78,accel:2.9,brake:7,handling:1.05,susp:1.15,cost:3,engine:{base:34,range:60,wave:'square',putt:17,gears:4},horn:'pom'},
  veloce:{name:'Veloce V12',sub:'Supercar',cat:'posh',top:330,accel:10.5,brake:14,handling:1.08,susp:.45,cost:25,engine:{base:60,range:260,wave:'sawtooth',putt:0,gears:7,vol:1.1},horn:'sport',col:'#F2B705'},
  zephyr:{name:'Zephyr GT',sub:'Grand tourer',cat:'posh',top:300,accel:8.6,brake:13,handling:1.02,susp:.55,cost:20,engine:{base:50,range:220,wave:'sawtooth',putt:0,gears:7},horn:'sport',col:'#B3121F'},
  regent:{name:'Regent Imperial',sub:'Luxury saloon',cat:'posh',top:250,accel:6.8,brake:12,handling:.92,susp:.5,cost:22,engine:{base:38,range:120,wave:'sawtooth',putt:0,gears:8,vol:.7},horn:'suv',col:'#15171C'},
  monarch:{name:'Monarch LX',sub:'Luxury SUV',cat:'posh',top:240,accel:6.4,brake:11.5,handling:.88,susp:.45,cost:22,engine:{base:40,range:110,wave:'sawtooth',putt:0,gears:8},horn:'suv',col:'#E8E8E4'},
  bus:{name:'City Bus',sub:'City bus',cat:'heavy',top:90,accel:1.7,brake:6,handling:.62,susp:.5,cost:30,engine:{base:30,range:60,wave:'sawtooth',putt:6,gears:5},horn:'suv',col:'red'},
  lorry:{name:'Goods Lorry',sub:'Horn OK Please',cat:'heavy',top:85,accel:1.7,brake:6,handling:.62,susp:.6,cost:28,engine:{base:28,range:60,wave:'sawtooth',putt:8,gears:5},horn:'suv',col:'#F2A007'},
  tractor:{name:'Farm Tractor',sub:'With trolley',cat:'heavy',top:35,accel:1.6,brake:5,handling:.7,susp:.7,cost:12,engine:{base:22,range:40,wave:'square',putt:10,gears:4},horn:'suv',col:'#C8102E'},
  truck:{name:'Lorry',sub:'Goods carrier',cat:'heavy',top:95,accel:1.9,brake:6,handling:.64,susp:.6,cost:28,engine:{base:28,range:60,wave:'sawtooth',putt:8,gears:5},horn:'suv',col:'#E07A1F'},
  hatch:{name:'Hatchback',sub:'City car',cat:'car',top:158,accel:4.2,brake:10,handling:.98,susp:.85,cost:7,engine:{base:50,range:120,wave:'sawtooth',putt:0,gears:5},horn:'car',col:'#C9CED6'},
  sedan:{name:'Sedan',sub:'Highway cruiser',cat:'car',top:178,accel:4.6,brake:10.5,handling:.94,susp:.75,cost:8,engine:{base:45,range:115,wave:'sawtooth',putt:0,gears:6},horn:'car',col:'#7A1F2B'},
  suv:{name:'SUV',sub:'Ghat road king',cat:'car',top:172,accel:4.4,brake:10,handling:.86,susp:.55,cost:9,engine:{base:40,range:95,wave:'sawtooth',putt:0,gears:6},horn:'suv',col:'#22344C'},
};
/* engine character: cylinders, idle and redline rpm */
const ENG={saathi:{cyl:1,idle:1500,max:6500,gears:2},sakhi:{cyl:1,idle:1600,max:7500,gears:1},bijli:{ev:true},pratham:{cyl:1,idle:1300,max:8000,gears:4},
  rocket:{cyl:1,idle:1400,max:9500,gears:5},maharaja:{cyl:1,idle:1000,max:5500,gears:5,thump:true,p:.6},nandi:{cyl:1,idle:1300,max:8500,gears:6},
  kesari:{cyl:1,idle:1500,max:10500,gears:6},garuda:{cyl:1,idle:1600,max:11000,gears:6},agni:{cyl:4,idle:1300,max:14000,gears:6,p:.85},veloce:{cyl:12,idle:950,max:8800,gears:7,p:.9},zephyr:{cyl:8,idle:850,max:7500,gears:7},regent:{cyl:12,idle:600,max:6000,gears:8,p:.95},monarch:{cyl:8,idle:650,max:6000,gears:8},bus:{cyl:6,idle:600,max:2600,gears:5,diesel:true},lorry:{cyl:6,idle:600,max:2800,gears:5,diesel:true},tractor:{cyl:3,idle:750,max:2200,gears:4,diesel:true,thump:1},truck:{cyl:6,idle:600,max:2800,gears:5,diesel:true},
  auto:{cyl:1,idle:1150,max:5200,gears:4,rattle:true,p:.65},hatch:{cyl:3,idle:800,max:6500,gears:5},sedan:{cyl:4,idle:750,max:6500,gears:6,p:.85},suv:{cyl:4,idle:750,max:4500,gears:6,diesel:true}};
/* fuel: game range on a full tank (km), tank size, fuel type */
const FUEL={saathi:[9,4,'petrol'],sakhi:[10,5.3,'petrol'],bijli:[8,3,'ev'],pratham:[12,9.8,'petrol'],rocket:[9,15,'petrol'],maharaja:[10,13,'petrol'],nandi:[12,17,'petrol'],
  kesari:[9,15,'petrol'],garuda:[9,11,'petrol'],agni:[6,17,'petrol'],veloce:[6,85,'petrol'],zephyr:[7,75,'petrol'],regent:[7,90,'petrol'],monarch:[7,90,'petrol'],bus:[8,180,'diesel'],lorry:[8,200,'diesel'],tractor:[6,60,'diesel'],truck:[8,220,'diesel'],auto:[10,12,'lpg'],hatch:[12,37,'petrol'],sedan:[13,40,'petrol'],suv:[10,57,'diesel']};
const FUELPRICE={petrol:[102.9,'Petrol','L'],diesel:[88.99,'Diesel','L'],lpg:[62,'Auto LPG','L'],ev:[15,'EV charging','kWh']};
const VKEYS=Object.keys(VEH);
const VCATS=[['two','Two-wheelers'],['three','Auto'],['car','Cars'],['posh','Luxury & sports'],['heavy','Bus & lorry']];
const MODELS=new Map();
function playerModel(k){
  const lk=typeof PLOOK!=='undefined'?PLOOK:{shirt:'#2F6FB2',pants:'#2B2F3A'};const key='p:'+k+'|'+lk.shirt+lk.pants;let m=MODELS.get(key);if(m)return m;
  if(TWO_SPECS[k])m=buildTwo(Object.assign({},TWO_SPECS[k],{shirt:lk.shirt,pants:lk.pants}));
  else if(k==='auto')m=buildAuto({look:lk});
  else if(k==='bus'){m=buildBMTC('vajra');}
  else if(k==='lorry'){m=buildLorry(VEH.lorry.col);}
  else if(k==='tractor'){m=buildTractor(VEH.tractor.col);}
  else if(k==='truck'){m=buildTruck(VEH.truck.col,false);m.eye=[.7,2.25,-m.len/2+.9];}
  else m=buildCar(k,VEH[k].col);
  MODELS.set(key,m);return m;
}
/* traffic types */
const TT=[
  {k:'auto',w:.26,len:2.7,wid:1.34,cruise:1},
  {k:'hatch',w:.17,len:3.85,wid:1.7,cruise:1.05,cols:['#E3E6EA','#B9282F','#1F2F4A','#7A7F87','#F2F2F0','#2E5E8C','#C46A1B']},
  {k:'sedan',w:.08,len:4.4,wid:1.73,cruise:1.1,cols:['#F2F2F0','#202226','#8A8D93','#5C1A24']},
  {k:'suv',w:.08,len:4.55,wid:1.86,cruise:1.05,cols:['#F2F2F0','#202226','#6B6E73','#3A4A2A']},
  {k:'taxi',w:.05,len:4.4,wid:1.73,cruise:1.1,cols:['#F2F2F0']},
  {k:'sakhi',w:.1,len:1.7,wid:.72,two:true,cruise:1.05},
  {k:'pratham',w:.08,len:1.9,wid:.78,two:true,cruise:1.1},
  {k:'maharaja',w:.03,len:2.1,wid:.82,two:true,cruise:1.05},
  {k:'veloce',w:.008,len:4.55,wid:1.98,cruise:1.25,cols:['#F2B705','#B3121F','#1B1B1F','#E8E8E4','#2D6CDF','#3BAA4A']},
  {k:'zephyr',w:.01,len:4.7,wid:1.92,cruise:1.2,cols:['#B3121F','#1B1B1F','#C9CED6','#0F3D7A']},
  {k:'regent',w:.012,len:5.35,wid:1.96,cruise:1.1,cols:['#15171C','#C9CED6','#F2F2F0','#3B0D18']},
  {k:'monarch',w:.016,len:5.0,wid:2.0,cruise:1.1,cols:['#E8E8E4','#15171C','#4A4F55','#1E3A2B']},
  {k:'bus',w:.07,len:11.6,wid:2.55,cruise:.85,cols:['ordinary','ordinary','vajra','green','ev']},
  {k:'lorry',w:.035,len:7.6,wid:2.4,cruise:.7,cols:['#F2A007','#E8D21D','#2F7DE1','#D2452B']},
  {k:'tractor',w:.022,len:7.6,wid:2.1,cruise:.42,cols:['#C8102E','#2E7D32','#1565C0']},
  {k:'truck',w:.04,len:7.2,wid:2.35,cruise:.8},
  {k:'tanker',w:.03,len:7.4,wid:2.35,cruise:.8},
];
function trafficModel(t,col){
  const key='t:'+t.k+':'+(col||'');let m=MODELS.get(key);if(m)return m;
  if(t.k==='auto')m=buildAuto();
  else if(t.k==='taxi')m=buildCar('sedan','#F2F2F0',{taxi:true});
  else if(CARDIM[t.k])m=buildCar(t.k,col);
  else if(t.k==='bus')m=buildBMTC(col||'ordinary');
  else if(t.k==='lorry')m=buildLorry(col);
  else if(t.k==='tractor')m=buildTractor(col);
  else if(t.k==='truck')m=buildTruck(col,false);
  else if(t.k==='tanker')m=buildTruck('#E8E8E2',true);
  else{const s=Object.assign({},TWO_SPECS[t.k]);if(col)s.col=col;s.shirt=['#5D6D7E','#E1E1D8','#2C3E50','#7B241C','#1E8449'][hashStr(key)%5];m=buildTwo(s);}
  MODELS.set(key,m);return m;
}
let COPMODEL=null;
function copModel(){if(!COPMODEL)COPMODEL=buildCar('police','#F4F4F2',{police:true});return COPMODEL;}
const ANIM={};
function animalModels(){
  if(ANIM.ready)return ANIM;
  ANIM.cow=[['#EFEBE2',0],['#EFEBE2',1],['#8A6A4E',0],['#8A6A4E',1],['#3B3330',0],['#3B3330',1]].map(([c,p])=>buildCow(c,p,false));
  ANIM.cowLie=['#EFEBE2','#8A6A4E','#3B3330'].map(c=>buildCow(c,0,true));
  ANIM.dog=[];for(const c of['#C49A6C','#8B5A2B','#2B2B2B','#E8DCC8'])ANIM.dog.push([buildDog(c,0),buildDog(c,1)]);
  ANIM.cat=[];for(const c of['#141414','#C77B30','#9A9A9A'])ANIM.cat.push([buildCat(c,0),buildCat(c,1)]);
  ANIM.ped=PED_LOOKS.map((l,i)=>{const run=l.kind==='run'||l.kind==='kid';return [buildPed(l,0,SKINS[i%SKINS.length],run),buildPed(l,1,SKINS[i%SKINS.length],run)];});
  ANIM.sit=[{shirt:'#8D7B68',pants:'#5D4E37',grey:true},{blouse:'#7B5E57',saree:'#6D4C41'},{shirt:'#B0A48E',pants:'#4E4A3E'}].map((l,i)=>buildSit(l,SKINS[(i+3)%SKINS.length]));
  ANIM.lie=['#6D4C41','#455A64','#7B1F1F'].map(buildLie);
  ANIM.cart=[0,1,2].map(buildCart);
  ANIM.vendor=[buildPed({kind:'walk',shirt:'#E0D7C3',pants:'#3E5F8A',dhoti:true},0,SKINS[3]),buildPed({kind:'walk',saree:'#2E7D32',blouse:'#F9A825'},0,SKINS[1])];
  ANIM.ready=true;return ANIM;
}
