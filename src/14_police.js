/* ================= WISE CITY: patrolling police, police stations, witnesses, P markers ================= */
const POLICE_T={k:'police',len:4.55,wid:1.86,cruise:.8};
const PATROL={t:0,stations:[],note:0};
function buildStations(){
  PATROL.stations=[];
  for(const q of W.pois){if(q.sub!=='police')continue;const v=venueAtPoint('hotel',q.name||'Police Station',q.x,q.y,true);if(v){v.kind='police';v.name=/police/i.test(q.name||'')?q.name:`${q.name||'City'} Police Station`;PATROL.stations.push(v);}}
  if(!PATROL.stations.some(s=>Math.hypot(s.x-P.x,s.y-P.y)<1500)){
    const cand=W.segs.filter(s=>s.len>35&&!s.w.br&&RANK[s.w.cls]>=2).map(s=>({s,d:Math.abs(Math.hypot((s.ax+s.bx)/2-P.x,(s.ay+s.by)/2-P.y)-650)})).sort((a,b)=>a.d-b.d).slice(0,30);
    for(const c of cand){const s=c.s;const[x,y]=segPt(s,s.len*.5,s.w.hw+1.4);let nm=null,bd=1500;for(const pl of W.places){const d=Math.hypot(pl.x-x,pl.y-y);if(d<bd){bd=d;nm=pl.name;}}
      const v=venueAtPoint('hotel',`${nm||'City'} Police Station`,x,y,false,s,1);if(v){v.kind='police';PATROL.stations.push(v);break;}}}
}
function stationTex(v){return textTex('ps:'+v.name,(c,w,h)=>{c.fillStyle='#0D2B5E';c.fillRect(0,0,w,h);c.strokeStyle='#E53935';c.lineWidth=8;c.strokeRect(6,6,w-12,h-12);c.fillStyle='#FFF';c.textAlign='center';c.textBaseline='middle';
  let fs=44;c.font=`800 ${fs}px Arial, sans-serif`;while(c.measureText(v.name.toUpperCase()).width>w-40&&fs>20){fs-=2;c.font=`800 ${fs}px Arial, sans-serif`;}c.fillText(v.name.toUpperCase(),w/2,h*.42);c.font='600 22px Arial';c.fillStyle='#FFD54F';c.fillText('KARNATAKA STATE POLICE',w/2,h*.78);},640,128);}
function drawStations(night){for(const v of PATROL.stations){if(Math.hypot(v.x-CAM.eye[0],v.y-CAM.eye[2])>220)continue;const s=venueSign(v);drawSignMesh(s,stationTex(v).tex,night);
  DGr.bill(v.x,3.2,v.y,.35,Math.floor(GT*2)%2?[1,.1,.1]:[.1,.3,1],CAM.right);}}
/* keep two Hoysalas patrolling the streets around you, and a constable at a few junctions */
function updatePatrols(dt){
  if((PATROL.t-=dt)>0)return;PATROL.t=2;
  const pc=agents.filter(a=>a.patrol).length;
  if(pc<2){const a=spawnAgent(false);if(a){a.t=POLICE_T;a.col=null;a.model=copModel();a.patrol=true;a.k=.8;placeAgent(a);agents.push(a);}}
  const foot=LIFE.copPeds.filter(c=>c.patrol).length;
  if(foot<2&&W.signals&&W.signals.length){const S=W.signals[Math.floor(Math.random()*W.signals.length)];const d=Math.hypot(S.x-P.x,S.y-P.y);
    if(d>80&&d<400){const ang=Math.random()*TAU;let x=S.x+Math.cos(ang)*(S.R+3),y=S.y+Math.sin(ang)*(S.R+3);if(!inBuilding(x,y)){const c=newCopPed(x,y);c.patrol=true;c.h=Math.random()*TAU;LIFE.copPeds.push(c);}}}
  for(let i=LIFE.copPeds.length-1;i>=0;i--){const c=LIFE.copPeds[i];if(c.patrol&&Math.hypot(c.x-P.x,c.y-P.y)>500)LIFE.copPeds.splice(i,1);}
}
/* police only respond when you hurt one of them, or when a cop is right there and can see you */
function copSees(x,y,h,range){const dx=P.x-x,dy=P.y-y,d=Math.hypot(dx,dy);if(d>range)return false;
  const copLooks=Math.abs(angDiff(h,hAng(dx,dy)))<1.2,inFront=Math.abs(angDiff(P.h,hAng(-dx,-dy)))<1.0;
  if(!(copLooks||inFront||d<10))return false;return lineClear(x,y,P.x,P.y)!==false;}
const chaseNear=()=>COP.list.some(c=>Math.hypot(c.x-P.x,c.y-P.y)<70)||LIFE.copPeds.some(c=>!c.dead&&!c.patrol&&Math.hypot(c.x-P.x,c.y-P.y)<45);
function policeWitness(code){
  if(code==='cop')return true;
  for(const a of agents){if(!a.patrol||!copSees(a.x,a.y,a.h,45))continue;const i=agents.indexOf(a);agents.splice(i,1);COP.list.push({x:a.x,y:a.y,h:a.h,v:Math.max(a.v,6),idx:Math.max(0,COP.trail.length-1),model:a.model,fl:0});return true;}
  for(const c of LIFE.copPeds)if(c.patrol&&!c.dead&&copSees(c.x,c.y,c.h||0,30)){for(const k of LIFE.copPeds)if(k.patrol&&Math.hypot(k.x-P.x,k.y-P.y)<60)k.patrol=false;Snd.whistle();return true;}
  if(GT-PATROL.note>25){PATROL.note=GT;toast('No police saw that.','','nopol',1800);}
  return false;
}
/* after an arrest you are released at the police station with jurisdiction over the spot */
function jurisdiction(x,y){let b=null,bd=1e9;for(const s of PATROL.stations){const d=Math.hypot(s.x-x,s.y-y);if(d<bd){bd=d;b=s;}}return b;}
let RELEASE=null;
function markRelease(){RELEASE={st:jurisdiction(P.x,P.y),wasDriving:!FOOT.on,pk:!FOOT.on?{type:P.type,skin:P.skin,x:P.x,y:P.y,h:P.h,cond:P.cond,fuel:P.fuel}:FOOT.parked};}
$('#outPrimary').addEventListener('click',()=>{if(!RELEASE)return;const R=RELEASE;RELEASE=null;const st=R.st;if(!st)return;
  setTimeout(()=>{if(!FOOT.on)goFoot(null,true);FOOT.parked=profile.seized?null:R.pk;P.x=st.x;P.y=st.y;P.h=st.h;P.s=0;M4.model(P.M,P.x,0,P.y,-P.h,0,0);CAM.yaw=P.h;toast(`Released from ${st.name}. Your vehicle is where you were caught.`,'');},30);});
/* minimap: P for police */
function policeMini(m,R){
  const glyph=(x,y,col,big)=>{const r=big?30:24;m.save();m.translate(x,y);m.rotate(P.h);m.fillStyle=col;m.beginPath();m.arc(0,0,r,0,TAU);m.fill();m.lineWidth=4;m.strokeStyle='#FFF';m.stroke();m.fillStyle='#FFF';m.font=`900 ${Math.round(r*1.35)}px Arial`;m.textAlign='center';m.textBaseline='middle';m.fillText('P',0,1);m.restore();};
  for(const a of agents)if(a.patrol&&Math.abs(a.x-P.x)<R&&Math.abs(a.y-P.y)<R)glyph(a.x,a.y,'#1E5BD6');
  for(const c of COP.list)glyph(c.x,c.y,Math.floor(GT*4)%2?'#E53935':'#1E5BD6',true);
  for(const c of LIFE.copPeds)if(!c.dead&&Math.abs(c.x-P.x)<R&&Math.abs(c.y-P.y)<R){m.fillStyle=c.patrol?'#1E5BD6':'#E53935';m.beginPath();m.arc(c.x,c.y,12,0,TAU);m.fill();}
  for(const s of PATROL.stations)if(Math.abs(s.x-P.x)<R*1.2&&Math.abs(s.y-P.y)<R*1.2){m.fillStyle='#0D2B5E';m.fillRect(s.x-26,s.y-26,52,52);m.save();m.translate(s.x,s.y);m.rotate(P.h);m.fillStyle='#FFD54F';m.font='900 38px Arial';m.textAlign='center';m.textBaseline='middle';m.fillText('P',0,1);m.restore();}
  for(const p of peds)if(p.culprit&&!p.caught){m.fillStyle='#FF1744';m.beginPath();m.arc(p.x,p.y,16,0,TAU);m.fill();}
  if(LIFE.keyV&&!CITY.taken.has(LIFE.keyV.key)){m.save();m.translate(LIFE.keyV.x,LIFE.keyV.y);m.rotate(P.h);m.fillStyle='#FFC72C';m.font='900 44px Arial';m.textAlign='center';m.fillText('⚷',0,14);m.restore();}
}
Object.assign(window.__oosht||{},{PATROL,policeWitness,buildStations});
