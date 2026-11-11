/* ================= map data: vector tiles (OpenFreeMap), Overpass fallback, demo city ================= */
const MZ=14,EXT=4096,WPX=Math.pow(2,MZ)*EXT;
function ll2g(lat,lon){const s=Math.sin(clamp(lat,-85,85)*Math.PI/180);return [(lon+180)/360*WPX,(0.5-Math.log((1+s)/(1-s))/(4*Math.PI))*WPX];}
function g2ll(gx,gy){const lon=gx/WPX*360-180;const n=Math.PI-2*Math.PI*gy/WPX;return [180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))),lon];}
const MAP={origin:null,g0:[0,0],mpp:1};
function setOrigin(lat,lon){MAP.origin={lat,lon};MAP.g0=ll2g(lat,lon);MAP.mpp=40075016.686*Math.cos(lat*Math.PI/180)/WPX;}
const g2w=(gx,gy)=>[(gx-MAP.g0[0])*MAP.mpp,(gy-MAP.g0[1])*MAP.mpp];
const w2g=(x,y)=>[x/MAP.mpp+MAP.g0[0],y/MAP.mpp+MAP.g0[1]];
function w2ll(x,y){const g=w2g(x,y);return g2ll(g[0],g[1]);}
function ll2w(lat,lon){const g=ll2g(lat,lon);return g2w(g[0],g[1]);}

/* ---------- Mapbox Vector Tile decoder ---------- */
const TD=typeof TextDecoder!=='undefined'?new TextDecoder('utf-8'):null;
function pbVarint(b,P){let v=0,s=1,x;do{x=b[P.p++];v+=(x&0x7f)*s;s*=128;}while(x>=0x80&&P.p<b.length);return v;}
function pbSkip(b,P,w){if(w===0)pbVarint(b,P);else if(w===1)P.p+=8;else if(w===2){const l=pbVarint(b,P);P.p+=l;}else if(w===5)P.p+=4;else throw new Error('bad tile data');}
function pbStr(b,P){const l=pbVarint(b,P);const s=TD?TD.decode(b.subarray(P.p,P.p+l)):String.fromCharCode.apply(null,b.subarray(P.p,P.p+l));P.p+=l;return s;}
const zz=n=>(n%2===1)?-(n+1)/2:n/2;
function decodeMVT(buf){
  const b=buf instanceof Uint8Array?buf:new Uint8Array(buf);const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);
  const P={p:0},layers={};
  while(P.p<b.length){const tag=pbVarint(b,P),f=Math.floor(tag/8),w=tag&7;
    if(f===3&&w===2){const l=pbVarint(b,P);const L=decodeLayer(b,dv,P.p,P.p+l);layers[L.name]=L;P.p+=l;}else pbSkip(b,P,w);}
  return layers;
}
function decodeLayer(b,dv,s,e){
  const P={p:s},L={name:'',extent:4096,keys:[],values:[],raw:[]};
  while(P.p<e){const tag=pbVarint(b,P),f=Math.floor(tag/8),w=tag&7;
    if(f===1&&w===2)L.name=pbStr(b,P);
    else if(f===2&&w===2){const l=pbVarint(b,P);L.raw.push([P.p,P.p+l]);P.p+=l;}
    else if(f===3&&w===2)L.keys.push(pbStr(b,P));
    else if(f===4&&w===2){const l=pbVarint(b,P);L.values.push(decodeValue(b,dv,P.p,P.p+l));P.p+=l;}
    else if(f===5&&w===0)L.extent=pbVarint(b,P);
    else pbSkip(b,P,w);}
  L.features=L.raw.map(r=>decodeFeature(b,r[0],r[1],L));delete L.raw;
  return L;
}
function decodeValue(b,dv,s,e){
  const P={p:s};let v=null;
  while(P.p<e){const tag=pbVarint(b,P),f=Math.floor(tag/8),w=tag&7;
    if(f===1)v=pbStr(b,P);else if(f===2){v=dv.getFloat32(P.p,true);P.p+=4;}else if(f===3){v=dv.getFloat64(P.p,true);P.p+=8;}
    else if(f===4||f===5)v=pbVarint(b,P);else if(f===6)v=zz(pbVarint(b,P));else if(f===7)v=!!pbVarint(b,P);else pbSkip(b,P,w);}
  return v;
}
function decodeFeature(b,s,e,L){
  const P={p:s},F={id:0,type:0,tags:{},geom:[]};
  while(P.p<e){const tag=pbVarint(b,P),f=Math.floor(tag/8),w=tag&7;
    if(f===1&&w===0)F.id=pbVarint(b,P);
    else if(f===2&&w===2){const l=pbVarint(b,P),end=P.p+l;while(P.p<end){const k=pbVarint(b,P),v=pbVarint(b,P);F.tags[L.keys[k]]=L.values[v];}}
    else if(f===3&&w===0)F.type=pbVarint(b,P);
    else if(f===4&&w===2){const l=pbVarint(b,P),end=P.p+l;let x=0,y=0,cur=null;
      while(P.p<end){const ci=pbVarint(b,P),cmd=ci&7,cnt=Math.floor(ci/8);
        if(cmd===1){for(let i=0;i<cnt;i++){x+=zz(pbVarint(b,P));y+=zz(pbVarint(b,P));cur=[x,y];F.geom.push(cur);}}
        else if(cmd===2){for(let i=0;i<cnt;i++){x+=zz(pbVarint(b,P));y+=zz(pbVarint(b,P));if(cur)cur.push(x,y);}}
        else if(cmd===7){if(cur&&cur.length>=4)cur.push(cur[0],cur[1]);}}}
    else pbSkip(b,P,w);}
  return F;
}

/* ---------- tile fetching with an offline cache ---------- */
let idbP=null;
function idb(){if(idbP)return idbP;idbP=new Promise(res=>{try{const r=indexedDB.open('oosht',1);r.onupgradeneeded=()=>{try{r.result.createObjectStore('tiles');}catch(e){}};r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);r.onblocked=()=>res(null);setTimeout(()=>res(null),3000);}catch(e){res(null);}});return idbP;}
async function idbGet(k){const db=await idb();if(!db)return null;return new Promise(res=>{try{const q=db.transaction('tiles','readonly').objectStore('tiles').get(k);q.onsuccess=()=>{const v=q.result;res(v&&Date.now()-v.t<30*864e5?v.b:null);};q.onerror=()=>res(null);}catch(e){res(null);}});}
async function idbPut(k,b){const db=await idb();if(!db)return;try{db.transaction('tiles','readwrite').objectStore('tiles').put({t:Date.now(),b},k);}catch(e){}}
async function fetchT(url,ms,opt){
  const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),ms);
  try{const r=await fetch(url,Object.assign({signal:ctl.signal},opt||{}));if(!r.ok)throw new Error('the map server answered '+r.status);return r;}
  catch(e){if(e.name==='AbortError')throw new Error('the map server took too long');if(e instanceof TypeError)throw new Error('no internet connection to the map server');throw e;}
  finally{clearTimeout(t);}
}
async function gunzip(u8){
  if(typeof DecompressionStream==='undefined')throw new Error('this phone cannot unpack map tiles');
  const s=new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'));return new Uint8Array(await new Response(s).arrayBuffer());
}
async function tileTemplate(){
  const c=store.get('tpl',null);if(c&&c.u&&Date.now()-c.t<2*864e5)return c.u;
  let last;
  for(let i=0;i<3;i++){try{const r=await fetchT('https://tiles.openfreemap.org/planet',15000);const j=await r.json();const u=j.tiles&&j.tiles[0];if(!u)throw new Error('the map index was empty');store.set('tpl',{u,t:Date.now()});return u;}catch(e){last=e;await sleep(700*(i+1));}}
  if(c&&c.u)return c.u;throw last;
}
async function tileBytes(tpl,x,y){
  const key=MZ+'/'+x+'/'+y;const cached=await idbGet(key);if(cached)return cached;
  const url=tpl.replace('{z}',MZ).replace('{x}',x).replace('{y}',y);let last;
  for(let i=0;i<3;i++){try{const r=await fetchT(url,25000);let u8=new Uint8Array(await r.arrayBuffer());if(u8.length>2&&u8[0]===0x1f&&u8[1]===0x8b)u8=await gunzip(u8);idbPut(key,u8);return u8;}catch(e){last=e;await sleep(800*(i+1));}}
  throw last;
}

/* ---------- tile -> features in global pixel space ---------- */
const TCLS={motorway:'motorway',trunk:'trunk',primary:'primary',secondary:'secondary',tertiary:'tertiary',minor:'residential',service:'service',track:'service',busway:'secondary',living_street:'living_street',residential:'residential',unclassified:'unclassified'};
const nm=t=>t['name:en']||t.name_en||t['name:latin']||t.name_int||t.name||'';
function clipLine(p,x0,y0,x1,y1){
  const out=[];let cur=null;
  for(let i=0;i<p.length/2-1;i++){
    const ax=p[2*i],ay=p[2*i+1],bx=p[2*i+2],by=p[2*i+3];
    const sw=ax>bx||(ax===bx&&ay>by);const px=sw?bx:ax,py=sw?by:ay,qx=sw?ax:bx,qy=sw?ay:by;const dx=qx-px,dy=qy-py;
    let t0=0,t1=1,ok=true;
    for(const [pp,qq] of [[-dx,px-x0],[dx,x1-px],[-dy,py-y0],[dy,y1-py]]){
      if(pp===0){if(qq<0){ok=false;break;}}else{const r=qq/pp;if(pp<0){if(r>t1){ok=false;break;}if(r>t0)t0=r;}else{if(r<t0){ok=false;break;}if(r<t1)t1=r;}}
    }
    if(!ok||t0>t1){cur=null;continue;}
    const P0=[px+dx*t0,py+dy*t0],P1=[px+dx*t1,py+dy*t1];
    const enter=sw?P1:P0,exit=sw?P0:P1,inCut=sw?t1<1:t0>0,outCut=sw?t0>0:t1<1;
    if(!cur||inCut){cur={p:[enter[0],enter[1]],cs:inCut,ce:false};out.push(cur);}
    cur.p.push(exit[0],exit[1]);
    if(outCut){cur.ce=true;cur=null;}
  }
  return out.filter(r=>r.p.length>=4);
}
function parseTile(tx,ty,layers){
  const T={tx,ty,roads:[],blds:[],areas:[],pois:[],names:[],places:[],rails:[]};
  const X0=tx*EXT,Y0=ty*EXT,X1=X0+EXT,Y1=Y0+EXT;
  const G=(L,ring)=>{const k=EXT/(L.extent||4096),o=new Array(ring.length);for(let i=0;i<ring.length;i+=2){o[i]=X0+ring[i]*k;o[i+1]=Y0+ring[i+1]*k;}return o;};
  const tr=layers.transportation;
  if(tr)for(const f of tr.features){
    if(f.type!==2)continue;const t=f.tags;
    if((t.class==='transit'||t.class==='rail')&&/subway|light_rail|monorail/.test(t.subclass||'')){for(const line of f.geom){if(line.length<4)continue;for(const piece of clipLine(G(tr,line),X0,Y0,X1,Y1))T.rails.push({p:piece.p,tun:t.brunnel==='tunnel'?1:0});}continue;}
    const cls=TCLS[t.class]||(t.class==='path'?null:null);if(!cls)continue;
    if(t.brunnel==='tunnel'&&cls==='service')continue;
    const ow=t.oneway===1||t.oneway==='1'||t.oneway===true?1:t.oneway===-1||t.oneway==='-1'?-1:0;
    for(const line of f.geom){if(line.length<4)continue;
      for(const piece of clipLine(G(tr,line),X0,Y0,X1,Y1))T.roads.push({cls,ow,br:t.brunnel==='bridge'?1:0,p:piece.p,cs:piece.cs,ce:piece.ce,name:nm(t)});}
  }
  const bl=layers.building;
  if(bl)for(const f of bl.features){
    if(f.type!==3)continue;const t=f.tags;if(t.hide_3d)continue;
    for(const ring of f.geom){if(ring.length<8)continue;      const g=G(bl,ring);const a=polyArea(g);if(a<=0)continue; /* MVT exterior rings have positive area in tile coords */
      let mnx=1e18,mny=1e18,mxx=-1e18,mxy=-1e18;for(let i=0;i<g.length;i+=2){mnx=Math.min(mnx,g[i]);mxx=Math.max(mxx,g[i]);mny=Math.min(mny,g[i+1]);mxy=Math.max(mxy,g[i+1]);}
      const cx=(mnx+mxx)/2,cy=(mny+mxy)/2;if(cx<X0||cx>=X1||cy<Y0||cy>=Y1)continue;
      T.blds.push({p:g,h:+t.render_height||+t.height||0,mh:+t.render_min_height||0,col:t.colour||null});}
  }
  const addArea=(L,kindOf)=>{if(!L)return;for(const f of L.features){if(f.type!==3)continue;const k=kindOf(f.tags);if(!k)continue;for(const ring of f.geom){if(ring.length<8)continue;const g=G(L,ring);if(polyArea(g)<=0)continue;T.areas.push({p:g,kind:k});}}};
  addArea(layers.water,t=>t.class==='swimming_pool'?null:'water');
  addArea(layers.park,()=> 'park');
  addArea(layers.landcover,t=>({grass:'park',wood:'wood',wetland:'park',farmland:'field',sand:null}[t.class]||null));
  addArea(layers.landuse,t=>({cemetery:'park',stadium:'field',pitch:'field',playground:'park',school:null}[t.class]||null));
  const po=layers.poi;
  if(po)for(const f of po.features){if(f.type!==1)continue;const t=f.tags;const n=nm(t);if(!n)continue;
    for(const pt of f.geom){const g=G(po,pt);if(g[0]<X0||g[0]>=X1||g[1]<Y0||g[1]>=Y1)continue;T.pois.push({g,name:n,cls:t.class||'',sub:t.subclass||'',rank:+t.rank||50});}}
  const tn=layers.transportation_name;
  if(tn)for(const f of tn.features){if(f.type!==2)continue;const n=nm(f.tags);if(!n)continue;for(const line of f.geom)if(line.length>=4)T.names.push({p:G(tn,line),name:n});}
  const pl=layers.place;
  if(pl)for(const f of pl.features){if(f.type!==1)continue;const t=f.tags;if(!/neighbourhood|suburb|quarter|village|hamlet|locality|isolated_dwelling/.test(t.class||''))continue;const n=nm(t);if(!n)continue;for(const pt of f.geom)T.places.push({g:G(pl,pt),name:n,cls:t.class});}
  return T;
}
const KQ=(x,y)=>Math.round(x*4)+':'+Math.round(y*4);
/* merge loaded tiles into world-space data */
function tilesToWorld(tiles){
  const pieces=[];for(const T of tiles)for(const r of T.roads)pieces.push(Object.assign({},r,{p:r.p.slice()}));
  /* join road pieces that the tile edge cut apart */
  const ends=new Map();
  const reg=(k,i,e)=>{let a=ends.get(k);if(!a){a=[];ends.set(k,a);}a.push([i,e]);};
  pieces.forEach((r,i)=>{const n=r.p.length;if(r.cs)reg(KQ(r.p[0],r.p[1]),i,0);if(r.ce)reg(KQ(r.p[n-2],r.p[n-1]),i,1);});
  const alive=pieces.map(()=>true);
  for(const[,list]of ends){
    if(list.length!==2)continue;let[[i,ei],[j,ej]]=list;
    while(!alive[i]&&pieces[i].into!=null)i=pieces[i].into;while(!alive[j]&&pieces[j].into!=null)j=pieces[j].into;
    if(i===j)continue;const A=pieces[i],B=pieces[j];if(A.cls!==B.cls||A.ow!==B.ow||A.br!==B.br)continue;
    const aEnd=KQ(A.p[A.p.length-2],A.p[A.p.length-1]),bStart=KQ(B.p[0],B.p[1]);
    if(aEnd===bStart){A.p=A.p.concat(B.p.slice(2));A.ce=B.ce;alive[j]=false;B.into=i;}
    else{const bEnd=KQ(B.p[B.p.length-2],B.p[B.p.length-1]),aStart=KQ(A.p[0],A.p[1]);if(bEnd===aStart){B.p=B.p.concat(A.p.slice(2));B.ce=A.ce;alive[i]=false;A.into=j;}}
  }
  const out={roads:[],blds:[],areas:[],pois:[],names:[],places:[],rails:[]};
  pieces.forEach((r,i)=>{if(!alive[i])return;const pts=[],keys=[];
    let rev=r.ow===-1;const src=r.p;
    for(let k=0;k<src.length;k+=2){const w=g2w(src[k],src[k+1]);if(pts.length&&Math.abs(pts[pts.length-2]-w[0])<.01&&Math.abs(pts[pts.length-1]-w[1])<.01)continue;pts.push(w[0],w[1]);keys.push(KQ(src[k],src[k+1]));}
    if(pts.length>=4)out.roads.push({cls:r.cls,oneway:r.ow!==0,rev,pts,keys,name:r.name||'',br:r.br});});
  const seenP=new Set();
  for(const T of tiles){
    for(const b of T.blds){const p=[];for(let k=0;k<b.p.length;k+=2){const w=g2w(b.p[k],b.p[k+1]);p.push(w[0],w[1]);}if(p.length>=8&&p[0]===p[p.length-2]&&p[1]===p[p.length-1])p.length-=2;out.blds.push({pts:p,h:b.h,col:b.col});}
    for(const a of T.areas){const p=[];for(let k=0;k<a.p.length;k+=2){const w=g2w(a.p[k],a.p[k+1]);p.push(w[0],w[1]);}out.areas.push({pts:p,kind:a.kind});}
    for(const q of T.pois){const key=q.name+'|'+Math.round(q.g[0]/8)+'|'+Math.round(q.g[1]/8);if(seenP.has(key))continue;seenP.add(key);const w=g2w(q.g[0],q.g[1]);out.pois.push({x:w[0],y:w[1],name:q.name,cls:q.cls,sub:q.sub,rank:q.rank});}
    for(const n of T.names){const p=[];for(let k=0;k<n.p.length;k+=2){const w=g2w(n.p[k],n.p[k+1]);p.push(w[0],w[1]);}out.names.push({pts:p,name:n.name});}
    for(const q of T.places){const w=g2w(q.g[0],q.g[1]);out.places.push({x:w[0],y:w[1],name:q.name,cls:q.cls});}
    for(const r of T.rails||[]){const p=[];for(let k=0;k<r.p.length;k+=2){const w=g2w(r.p[k],r.p[k+1]);p.push(w[0],w[1]);}out.rails.push({pts:p,tun:r.tun});}
  }
  return out;
}

/* ---------- streaming tile manager ---------- */
const TILES={tpl:null,loaded:new Map(),pending:new Set(),failed:new Map()};
function tilesAround(x,y,r){
  const g0=w2g(x-r,y-r),g1=w2g(x+r,y+r);const out=[];
  for(let tx=Math.floor(g0[0]/EXT);tx<=Math.floor(g1[0]/EXT);tx++)for(let ty=Math.floor(g0[1]/EXT);ty<=Math.floor(g1[1]/EXT);ty++)out.push([tx,ty]);
  return out;
}
async function loadTiles(list,onStatus){
  if(!TILES.tpl){onStatus&&onStatus('Finding the map server');TILES.tpl=await tileTemplate();}
  const need=list.filter(([x,y])=>!TILES.loaded.has(x+','+y));
  let done=0;
  await Promise.all(need.map(async([x,y])=>{
    const k=x+','+y;TILES.pending.add(k);
    try{const u8=await tileBytes(TILES.tpl,x,y);const T=parseTile(x,y,decodeMVT(u8));TILES.loaded.set(k,T);}
    finally{TILES.pending.delete(k);done++;onStatus&&onStatus(`Downloading streets (${done}/${need.length})`);}
  }));
}

/* ---------- Overpass fallback ---------- */
const OVERPASS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
async function overpass(q,ms,onStatus){
  let last;
  for(let i=0;i<OVERPASS.length;i++){
    try{onStatus&&onStatus(i?`Map server busy, trying another (${i+1}/${OVERPASS.length})`:'Downloading streets from OpenStreetMap');
      const r=await fetchT(OVERPASS[i],ms,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}});
      const j=await r.json();if(j.remark&&/error|timed out|memory/i.test(j.remark))throw new Error('the map server was overloaded');
      return j;}catch(e){last=e;}
  }
  throw last||new Error('map download failed');
}
const HWCLS=h=>{h=(h||'').replace('_link','');return ['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service'].includes(h)?h:'residential';};
async function overpassWorld(lat,lon,R,onStatus){
  const q=`[out:json][timeout:30];(way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"](around:${R},${lat},${lon});way["building"](around:${Math.round(R*.5)},${lat},${lon});way["leisure"~"^(park|garden|playground|pitch)$"](around:${R},${lat},${lon});way["natural"="water"](around:${R},${lat},${lon});node["highway"="traffic_signals"](around:${R},${lat},${lon});node["name"]["shop"](around:${Math.round(R*.5)},${lat},${lon});node["name"]["amenity"](around:${Math.round(R*.5)},${lat},${lon}););out geom;`;
  const j=await overpass(q,40000,onStatus);
  const out={roads:[],blds:[],areas:[],pois:[],names:[],places:[],signals:[]};
  for(const e of j.elements||[]){
    const t=e.tags||{};
    if(e.type==='node'){const w=ll2w(e.lat,e.lon);if(t.highway==='traffic_signals')out.signals.push({x:w[0],y:w[1]});else if(t.name)out.pois.push({x:w[0],y:w[1],name:t['name:en']||t.name,cls:t.amenity||t.shop||'',sub:t.amenity||t.shop||''});continue;}
    if(e.type!=='way'||!e.geometry)continue;
    const pts=[];for(const g of e.geometry){if(!g)continue;const w=ll2w(g.lat,g.lon);pts.push(w[0],w[1]);}
    if(pts.length<4)continue;
    if(t.highway){const ow=t.oneway;out.roads.push({cls:HWCLS(t.highway),oneway:ow==='yes'||ow==='1'||ow==='-1'||t.junction==='roundabout'||t.highway==='motorway',rev:ow==='-1',pts,keys:(e.nodes&&e.nodes.length===pts.length/2)?e.nodes.map(String):pts.map((_,i)=>i%2?null:'w'+e.id+'_'+i).filter(Boolean),name:t['name:en']||t.name||t.ref||'',br:t.bridge?1:0});}
    else if(t.building){if(pts.length>=8&&pts[0]===pts[pts.length-2])pts.length-=2;out.blds.push({pts,h:parseFloat(t.height)||(parseFloat(t['building:levels'])||0)*3.2,col:null});}
    else out.areas.push({pts,kind:t.natural==='water'?'water':'park'});
  }
  if(out.roads.length<5)throw new Error('too few streets were found here');
  return out;
}
async function overpassSignals(lat,lon,R){
  const j=await overpass(`[out:json][timeout:20];node["highway"="traffic_signals"](around:${R},${lat},${lon});out;`,25000);
  return (j.elements||[]).map(e=>{const w=ll2w(e.lat,e.lon);return {x:w[0],y:w[1]};});
}

/* ---------- demo city (works offline) ---------- */
function buildDemo(){
  const rnd=mulberry32(20261109);
  const N=17,S=150,half=(N-1)*S/2;
  const xs=[],ys=[];for(let i=0;i<N;i++){xs.push(-half+i*S+(rnd()-.5)*30);ys.push(-half+i*S+(rnd()-.5)*30);}
  const P=(i,j)=>[xs[i]+Math.sin(j*1.7+i)*9,ys[j]+Math.cos(i*1.3+j)*9];
  const key=(i,j)=>'d'+i+'_'+j;
  const mainsV=['Hosur Road','100 Feet Road','CMH Road','Outer Ring Road','Sarjapur Road'];
  const mainsH=['80 Feet Road','Bannerghatta Road','Residency Road','Inner Ring Road','Double Road'];
  const ord=n=>n+(n%100>=11&&n%100<=13?'th':['th','st','nd','rd'][n%10]||'th');
  const out={roads:[],blds:[],areas:[],pois:[],names:[],places:[{x:0,y:0,name:'Demo Nagar'}]};let mv=0,mh=0;
  for(let i=0;i<N;i++){const major=i%4===0;const pts=[],keys=[];for(let j=0;j<N;j++){const[x,y]=P(i,j);pts.push(x,y);keys.push(key(i,j));}
    out.roads.push({cls:major?(i===8?'primary':'secondary'):'residential',oneway:false,rev:false,pts,keys,name:major?mainsV[mv++%mainsV.length]:ord(i+1)+' Cross'});}
  for(let j=0;j<N;j++){const major=j%4===0;const pts=[],keys=[];for(let i=0;i<N;i++){const[x,y]=P(i,j);pts.push(x,y);keys.push(key(i,j));}
    out.roads.push({cls:major?(j===8?'primary':'tertiary'):'residential',oneway:false,rev:false,pts,keys,name:major?mainsH[mh++%mainsH.length]:ord(j+1)+' Main'});}
  const shops=[['Sri Sai Darshini','restaurant'],['Udupi Grand','restaurant'],['Ganesh Bakery','bakery'],['Lakshmi Medicals','pharmacy'],['Namma Kirana Store','convenience'],['Kaveri Silks','clothes'],['Sri Rama Temple','place_of_worship'],['Vidya Vardhaka School','school'],['Brahmin\'s Coffee Bar','cafe'],['Mallige Hospital','hospital'],['Canara Cooperative Bank','bank'],['Shanthi Sagar','restaurant'],['Raghavendra Stores','convenience'],['Hanuman Gym','fitness_centre'],['Nandini Milk Parlour','dairy'],['Annapoorna Tiffins','restaurant'],['Sri Krishna Sweets','confectionery'],['Basaveshwara Hardware','hardware']];
  let si=0;
  for(let i=0;i<N-1;i++)for(let j=0;j<N-1;j++){
    const[x0,y0]=P(i,j),[x1,y1]=P(i+1,j+1);
    const pad=12,bx0=x0+pad,by0=y0+pad,bx1=x1-pad,by1=y1-pad;
    if(rnd()<.08){out.areas.push({pts:[bx0,by0,bx1,by0,bx1,by1,bx0,by1],kind:rnd()<.25?'water':'park'});continue;}
    const cols=3+Math.floor(rnd()*3),rows=3+Math.floor(rnd()*2);const cw=(bx1-bx0)/cols,rh=(by1-by0)/rows;
    for(let a=0;a<cols;a++)for(let b=0;b<rows;b++){
      if(a>0&&a<cols-1&&b>0&&b<rows-1)continue;if(rnd()<.1)continue;
      const m=1.5+rnd()*2.5;const X0=bx0+a*cw+m,Y0=by0+b*rh+m,X1=bx0+(a+1)*cw-m,Y1=by0+(b+1)*rh-m;if(X1-X0<5||Y1-Y0<5)continue;
      out.blds.push({pts:[X0,Y0,X1,Y0,X1,Y1,X0,Y1],h:rnd()<.12?18+rnd()*25:0,col:null});
      if(b===0&&rnd()<.35){const s=shops[si++%shops.length];out.pois.push({x:(X0+X1)/2,y:Y0-1,name:s[0],cls:s[1],sub:s[1]});}
    }
  }
  return out;
}
