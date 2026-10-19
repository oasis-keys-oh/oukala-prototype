/* Round 31: Back and Forward inside Experience journeys.
   The screen keeps its tab, journey, persona, stage and filter in memory only, so the browser had nothing to step through.
   Each change now adds one history step carrying that state; Back and Forward restore it. */
(function(){
const W=window;
let last=null,restoring=false;
const J=()=>W.JYX&&W.JYX.JY, A=()=>W.JYX&&W.JYX.api;
function snap(){const j=J(),a=A();if(!j||!a||!a.st)return null;return{tab:a.st.tab.ppl_jrny||0,sel:j.sel,persona:j.persona,stage:j.stage||null,flt:j.flt,view:j.view}}
const same=(x,y)=>x&&y&&["tab","sel","persona","stage","flt","view"].every(k=>x[k]===y[k]);
function after(){
 if(typeof S==="undefined"||S.screen!=="ppl_jrny"){last=null;return}
 const s=snap();if(!s)return;
 if(restoring){last=s;return}
 try{
  if(!last||!history.state||!history.state.jy){
   history.replaceState(Object.assign({},history.state||{},{jy:s}),"",location.href);last=s;return}
  if(!same(s,last)){history.pushState({jy:s},"",location.href);last=s}
 }catch(e){}
}
const _r=W.render;
if(typeof _r==="function"){W.render=function(){const r=_r.apply(this,arguments);try{after()}catch(e){}return r}}
W.addEventListener("popstate",()=>{
 const y=history.state&&history.state.jy;
 if(!y||typeof S==="undefined")return;
 setTimeout(()=>{
  if(S.screen!=="ppl_jrny"){return}
  const j=J(),a=A();if(!j||!a)return;
  restoring=true;
  try{j.sel=y.sel;j.persona=y.persona;j.stage=y.stage;j.flt=y.flt;j.view=y.view;a.st.tab.ppl_jrny=y.tab;render()}finally{restoring=false}
  last=y;
 },30);
});
})();
