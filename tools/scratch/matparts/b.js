/* ---------------- metrics ---------------- */
const trn=(a,c)=>a.concat([c]);
Object.assign(METRICS,{
 m_matatt:{n:"Maturity attainment",f:"Σ (capability weight × min(1, current level ÷ Year 1 target level)) ÷ Σ capability weight × 100, over every leaf capability in every model",u:"%",cur:78,tgt:85,badAt:65,dir:"max",max:100,tr:trn([66,68,70,72,73,75,76],78),owner:"CIO office",use:["Maturity models","Strategy alignment","Executive dashboard","Board pack"],rem:{kind:"sop",ref:"SOP-MAT-01",title:"Quarterly maturity reassessment and target reset",agent:"Maturity Agent",auto:false,state:"idle",prog:"Re-scores each capability from its linked metrics and accepted project work, then lists the largest gaps"}},
 m_matgp:{n:"Glide-path index",f:"Σ (weight × current level) ÷ Σ (weight × expected level today on the straight line from the start-of-year baseline to the Year 1 target) × 100",u:"pts",cur:96,tgt:100,badAt:90,dir:"max",max:120,tr:trn([101,100,99,99,98,98,97],96),owner:"CIO office",use:["Maturity models","Strategy alignment","Executive dashboard"],rem:{kind:"agent",ref:"Maturity Agent",title:"Find the capabilities that fell behind the glide path",agent:"Maturity Agent",auto:true,state:"running",prog:"Lists capabilities below the line and the project milestones that would restore them"}},
 m_matcov:{n:"Capability delivery coverage",f:"Capabilities with a gap to their Year 1 target that have a funded, dated project path to it ÷ Capabilities with a gap to their Year 1 target × 100",u:"%",cur:52,tgt:80,badAt:50,dir:"max",max:100,tr:trn([40,42,44,46,48,49,50],52),owner:"Portfolio office",use:["Maturity models","Strategy alignment","Executive dashboard","Board pack"],rem:{kind:"sop",ref:"SOP-MAT-02",title:"Turn an uncovered maturity gap into a funded demand request",agent:"Portfolio Agent",auto:false,state:"idle",prog:"Drafts a demand request for each uncovered gap with a cost and time estimate from unit costs"}}});
let _sy=0;
function sync(){const R=roll(CAPS());METRICS.m_matatt.cur=Math.round(R.att);METRICS.m_matgp.cur=Math.round(R.exp?R.cur/R.exp*100:100);METRICS.m_matcov.cur=Math.round(R.cov);
 ["m_matatt","m_matgp","m_matcov"].forEach(k=>{METRICS[k].tr[7]=METRICS[k].cur});
 SVCREG.forEach(s=>{const L=nodesOfSvc(s.id);if(!L.length){s.matCaps=0;return}const sw=L.reduce((a,x)=>a+x.w,0);s.maturity=Math.max(1,Math.min(5,Math.round(L.reduce((a,x)=>a+sc5(x,cur(x))*x.w,0)/sw)));s.matTgt=Math.max(1,Math.min(5,Math.round(L.reduce((a,x)=>a+sc5(x,tgtN(x,0))*x.w,0)/sw)));s.matCaps=L.length;s.matModels=[...new Set(L.map(x=>x.model))]})}
/* ---------------- unit costs (TBM style towers) and what-if engine ---------------- */
const TOWERS=[["Labor","--p4"],["Software and tools","--s3"],["Services and training","--w1"],["Cloud and compute","--e4"]];
function stepCost(n,k){const u=M.unit,f=Math.pow(1.4,Math.max(0,k-2)),lab=n.eff*f*u.rate;return [lab,u.tool*f,u.train*f+lab*.12,u.cloud*f*(n.svcs.length?1:.4)]}
const stepMo=(n,k)=>n.mo*Math.pow(1.15,Math.max(0,k-2));
const money0=v=>"$"+(Math.abs(v)>=1e6?(v/1e6).toFixed(2)+"M":Math.round(v/1000)+"K");
function whatIf(rootId,L,hz,crule,prule){const root=BYID[rootId];if(!root)return null;const req=new Map(),why=new Map();
 function setReq(id,lvl,via){const n=BYID[id];if(!n)return;lvl=clamp(Math.round(lvl),1,mMax(n));if((req.get(id)||0)>=lvl)return;req.set(id,lvl);why.set(id,via);kids(n).forEach(k=>setReq(k.id,lvl-crule,"child of "+n.name));n.pre.forEach(([p,o])=>setReq(p,lvl-o-prule,"prerequisite of "+n.name))}
 setReq(rootId,L,"the requested target");
 const rows=[];req.forEach((lv,id)=>{const n=BYID[id],c=cur(n),leaf=isLeaf(n);let cv=c;n.cr.forEach(x=>{if(crFunded(x))cv=Math.max(cv,x.to)});if(!leaf)cv=fore(n,HW[hz]);const gap=Math.max(0,lv-c),rem=leaf?Math.max(0,lv-Math.max(c,Math.min(cv,lv))):0;
  let cost=[0,0,0,0],mo=0;for(let k=Math.floor(Math.max(c,cv))+1;k<=lv&&leaf;k++){const s=stepCost(n,k);cost=cost.map((x,i)=>x+s[i]);mo+=stepMo(n,k)}
  const tot=cost.reduce((a,b)=>a+b,0),cred=leaf?n.cr.filter(x=>x.to>c&&crFunded(x)):[];
  rows.push({n,id,req:lv,cur:c,cv,gap,rem,leaf,cost,tot,mo,why:why.get(id),cred,depth:0})});
 const byId={};rows.forEach(r=>byId[r.id]=r);const memo={};
 function endOf(r,seen){if(memo[r.id]!=null)return memo[r.id];if(seen.has(r.id))return 0;seen.add(r.id);let st=0;r.n.pre.forEach(([p])=>{if(byId[p])st=Math.max(st,endOf(byId[p],seen))});
  if(!r.leaf){const k=kids(r.n).map(x=>byId[x.id]).filter(Boolean);let e=0;k.forEach(x=>{e=Math.max(e,endOf(x,seen))});r.st=st;r.en=Math.max(e,st);memo[r.id]=r.en;return r.en}
  const covEnd=r.cred.length&&r.cv>r.cur?Math.max(...r.cred.map(x=>(crDate(x)-TODAY)/21.7)):0;const startRaw=Math.max(st,covEnd);r.st=r.rem>0?startRaw:0;r.en=r.rem>0?r.st+r.mo:covEnd;if(r.gap===0)r.en=0;memo[r.id]=r.en;return r.en}
 rows.forEach(r=>endOf(r,new Set()));
 const leafRows=rows.filter(r=>r.leaf);const totC=leafRows.reduce((a,r)=>a+r.tot,0),tw=TOWERS.map((t,i)=>leafRows.reduce((a,r)=>a+r.cost[i],0)),months=Math.max(0,...rows.map(r=>r.en)),need=leafRows.filter(r=>r.rem>0),funded=leafRows.filter(r=>r.gap>0&&r.rem===0);
 const svcs={};leafRows.filter(r=>r.gap>0).forEach(r=>r.n.svcs.forEach(s=>{(svcs[s]=svcs[s]||[]).push(r)}));
 const skills={};leafRows.filter(r=>r.rem>0).forEach(r=>{const f=r.n.eff*Math.max(1,r.req-r.cur);r.n.sk.forEach(k=>{skills[k]=(skills[k]||0)+f/Math.max(1,r.n.sk.length)})});
 const projs={};leafRows.forEach(r=>r.cred.forEach(c=>{(projs[c.p]=projs[c.p]||[]).push({r,c})}));
 const by=new Date(dx(TODAY).getTime()+months*30.4*864e5);const dueWd=HW[hz],byWd=TODAY+months*21.7;
 return {root,L,hz,rows,leafRows,totC,tw,months,need,funded,svcs,skills,projs,by,ok:byWd<=dueWd,slackMo:(dueWd-byWd)/21.7,nodes:rows.length}}
/* actions: one per leaf with remaining work */
function actionsOf(w){return w.need.slice().sort((a,b)=>b.tot-a.tot).map(r=>{const n=r.n,sv=n.svcs[0]&&svcOf(n.svcs[0]);return {id:"ACT-"+n.id,node:n.id,title:`Raise ${n.name} from level ${r1(r.cur)} to ${r.req}`,reason:`${modelOf(n.model).n}: ${n.name} must reach level ${r.req} (${why(r.why)}). Estimated ${money0(r.tot)} over about ${Math.ceil(r.mo)} months.`,cost:Math.round(r.tot),mo:Math.ceil(r.mo),owner:n.owner,service:sv?sv.n:"",model:n.model}})}
const why=s=>s||"required";
function gapActions(){const out=[];leaves().forEach(n=>{const t=tgtN(n,0),c=cur(n);if(t<=c)return;const cs=n.cr.filter(x=>x.to>=t&&crFunded(x));if(cs.length)return;let tot=0,mo=0;for(let k=Math.floor(c)+1;k<=t;k++){tot+=stepCost(n,k).reduce((a,b)=>a+b,0);mo+=stepMo(n,k)}
  const sv=n.svcs[0]&&svcOf(n.svcs[0]);out.push({id:"ACT-"+n.id,node:n.id,title:`Fund the path from level ${r1(c)} to ${t} for ${n.name}`,reason:`${modelOf(n.model).n}: no funded project reaches level ${t} by ${HZ[0][2]}. Estimated ${money0(tot)} over about ${Math.ceil(mo)} months.`,cost:Math.round(tot),mo:Math.ceil(mo),owner:n.owner,service:sv?sv.n:"",model:n.model,pri:(t-c)*(n.objs.length||.5)})});return out.sort((a,b)=>b.pri-a.pri)}
function makeDemand(a){const body={title:a.title,reason:a.reason,source:"Maturity models",cost:a.cost,service:a.service,kind:"Maturity uplift"};
 if(M.act.some(x=>x.id===a.id)){toast("Already created as a demand request","info");return false}
 if(window.addDemand){try{window.addDemand(body)}catch(e){}}M.act.push({id:a.id,t:a.title,at:"Oct 6"});audit("created demand from maturity gap",a.title);toast("Demand request created: "+a.title,"good");return true}
