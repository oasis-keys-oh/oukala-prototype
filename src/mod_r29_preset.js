/* ===== mod_r29_preset: industry presets for Agent Action. When a demo scenario is selected (healthcare, mining, storage and backup), the gap list is built from that
   scenario's workflows: each workflow becomes a gap, sized by its steps, with the steps run by people today and the steps an agent or automation could take. Every figure is modeled from the
   fictional sample workflows. Choosing Meridian restores the original 16 gaps. ===== */
(function(){
const W=window;const X=W.ODX;if(!X||!X.GAPS||!W.SCN)return;
const BASE=X.GAPS.slice();
const DIM={wf_h_ref:"exp",wf_h_auth:"fin",wf_h_sched:"exp",wf_h_prev:"data",wf_h_dc:"ops",wf_h_rx:"sc",wf_h_fu:"exp",wf_h_claim:"fin",
 wf_m_det:"ops",wf_m_wo:"ops",wf_m_ptw:"gov",wf_m_hse:"gov",wf_m_inv:"sc",wf_m_ca:"gov",
 wf_s_q2d:"fin",wf_s_o2d:"sc",wf_s_inst:"exp",wf_s_ren:"fin",wf_s_rec:"ops",wf_s_rma:"sc"};
const OUT=/phone|fax|e-?mail|spreadsheet|paper|letter|portal|chat|radio|whiteboard|manual|text|sms|clipboard|tablet/i;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function build(w){
 const st=w.steps||[],n=st.length||1;
 const byPeople=st.filter(s=>s.type==="human"||s.type==="wait").length;
 const run=st.filter(s=>s.type==="agent"||s.type==="auto"||s.type==="robot").length;
 const shift=st.filter(s=>(s.type==="human"||s.type==="wait")&&(s.tobe==="agent"||s.tobe==="auto"||s.tobe==="robot")).length;
 const outside=st.filter(s=>s.system&&OUT.test(s.system)).length;
 const after=st.filter(s=>s.tobe==="agent"||s.tobe==="auto"||s.tobe==="robot").length;
 const gates=st.filter(s=>s.type==="gate").length;
 const first=st.find(s=>s.tobe==="agent"&&s.type!=="agent")||st.find(s=>s.tobe==="agent")||st[0];
 const id="S_"+w.id;
 const erp=st.some(s=>/ERP|billing|ordering|SAP|finance system/i.test(s.system||""))?1:0;
 return{g:{id,dim:DIM[w.id]||"ops",t:w.name,
  now:byPeople+" of "+n+" steps are done by people today"+(outside?", and "+outside+" run outside a system of record ("+st.filter(s=>s.system&&OUT.test(s.system)).slice(0,2).map(s=>s.system).join(", ")+")":""),
  next:after+" of "+n+" steps run by an agent or automation, with people keeping "+gates+" decision gate"+(gates===1?"":"s"),
  size:clamp(Math.round(n/3),1,5),reach:clamp(2+Math.round(shift/n*4),2,5),erp,src:"modeled",
  br:"Put an agent in front of the "+shift+" candidate step"+(shift===1?"":"s")+" and keep the current systems",
  rb:"Rebuild the workflow end to end with the target step types",lv:"Leave the workflow as it runs today",hy:[]},
  meas:{n:"Steps run by an agent or automation in "+w.name,u:"%",base:String(Math.round(run/n*100)),target:Math.round(after/n*100),src:"modeled"},
  form:"Steps run by an agent or automation ÷ steps in the workflow",
  agent:"New agent: "+(first?first.n:w.name)}}
function clear(){X.GAPS.length=0;BASE.forEach(g=>X.GAPS.push(g));Object.keys(X.MEAS).forEach(k=>{if(k.indexOf("S_")===0)delete X.MEAS[k]});Object.keys(X.FORM).forEach(k=>{if(k.indexOf("S_")===0)delete X.FORM[k]});Object.keys(X.AGENT).forEach(k=>{if(k.indexOf("S_")===0)delete X.AGENT[k]})}
X.preset=function(k){
 clear();
 if(k==="core")return;
 const wfs=W.SCN.wfs?W.SCN.wfs(k):[];
 /* the scenario replaces the sample gap list: its workflows are the gaps */
 X.GAPS.length=0;
 wfs.forEach(w=>{const b=build(w);X.GAPS.push(b.g);X.MEAS[b.g.id]=b.meas;X.FORM[b.g.id]=b.form;X.AGENT[b.g.id]=b.agent});
};
})();
