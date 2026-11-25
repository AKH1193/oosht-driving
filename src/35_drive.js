/* ================= WISE CITY: driving feel. Steering sensitivity setting, a hand brake button for skids and slides,
   and emergency braking you can feel: ABS pulses, the nose dips, tyres screech and leave marks ================= */
if(settings.steerSens==null)settings.steerSens='med';
SETS.push(['steerSens','Steering sensitivity',[['low','Gentle'],['med','Normal'],['high','Sharp']]]);
{const st=document.createElement('style');st.textContent=`
.ctl-right{grid-template-columns:auto auto auto!important}
.ctl-right .horn{grid-column:2!important}.ctl-right .pedal.brake{grid-column:2!important}.ctl-right .pedal.gas{grid-column:3!important}
#hud .ctl-act{right:calc(14px + 258px*var(--bs) + env(safe-area-inset-right,0px))!important}
.pedal.hb{grid-column:1;grid-row:2;width:64px;height:74px;font-size:10px;letter-spacing:.08em;line-height:1.15;place-items:center;padding-bottom:0;text-align:center}
.pedal.hb.on{background-color:rgba(255,199,44,.3);border-color:var(--auto-yellow)}
.pedal.brake.hard{background-color:rgba(255,40,30,.55)!important;border-color:#FF3B30!important;box-shadow:0 0 18px rgba(255,59,48,.6)}`;document.head.appendChild(st);}
hold($('#btnHB'),()=>{input.hb=1;},()=>{input.hb=0;});
window.addEventListener('keydown',e=>{if(e.key==='Shift'&&state==='play')input.hb=1;});window.addEventListener('keyup',e=>{if(e.key==='Shift')input.hb=0;});
{const _goH=goFoot;goFoot=function(w,k){input.hb=0;return _goH(w,k);};}
const HB={tick:0,dip:0};
{const _upH=updatePlayer;updatePlayer=function(dt){_upH(dt);
  const sp=Math.abs(P.s),hard=!!P.hard&&!FOOT.on&&!FLY.on;
  $('#btnBrake').classList.toggle('hard',hard);
  if(hard||(input.hb&&sp>4)){if(sp>4)try{addSkid();}catch(e){}
    if((HB.tick-=dt)<=0){HB.tick=hard?.11:.2;Hap.tick&&Hap.tick();}}
  /* the nose dips under hard braking and rises back when you let go */
  const want=hard?Math.min(1,sp/8)*.055:(input.brake&&sp>2?.025:0);HB.dip+=(want-HB.dip)*Math.min(1,dt*(want>HB.dip?9:5));
  if(HB.dip>.002&&VEH[P.type].cat!=='two'){M4.model(TM,0,HB.dip*.5,0,0,-HB.dip,0);M4.mul(TM2,P.M,TM);for(let i=0;i<16;i++)P.M[i]=TM2[i];}};}
Object.assign(window.__oosht||{},{HB,STEERS});
