/* ===== Round 18, H: enterprise spend. Where the money goes across every domain, grouped by the executive who owns each domain.
   A cost center belongs to exactly one domain, a domain to exactly one executive, so nothing is counted twice. An executive may own several domains.
   Shared IT costs can be shown allocated to the domains that consume them (showback by headcount). Screen r18_spend. IT depth stays in the cost transparency screen. ===== */
(function(){
"use strict";
const W=window,D=document;const R18=W.R18;if(!R18)return;
const {G,H,arr,pill,usd}=R18;const ST=R18.st;
const SP=ST.sp=ST.sp||{owners:null,showback:true,view:0};
/* domain per department code (budget DEPTS) and its default executive owner */
const DOM={ED:["Editorial","COO"],SD:["Standards development","COO"],DO:["Data office","CIO"],FN:["Finance and legal operations","CFO"],IT:["IT operations","CIO"],MS:["Membership and sales","CEO"]};
const EXECS=["CEO","CFO","COO","CIO","CTO","CAIO","CHRO","CISO","CLO"];
const owners=()=>{if(!SP.owners){SP.owners={};Object.keys(DOM).forEach(k=>SP.owners[k]=DOM[k][1])}return SP.owners};
const EXEC_NAME={CEO:"Catherine Doyle",CFO:"Marcus Reid",COO:"Elena Marsh",CIO:"Casey Rowan",CTO:"Jordan Lee",CAIO:"Kenji Watanabe",CHRO:"Joanna Pierce",CISO:"Rina Okafor",CLO:"Theo Marlowe"};
const staffOf=n=>G(()=>ORGX.staff.find(x=>x.n===n),null);
const PERSONA_EXEC={exec:"CIO",cfo:"CFO",coo:"COO",ceo:"CEO",chro:"CHRO",ciso:"CISO",caio:"CAIO",clo:"CLO"};
let CUR=null;/* purview scope while one screen renders */
const lines=()=>{const L=G(()=>BUDX.B().lines,[]);return CUR?L.filter(l=>CUR.keys.has(l.dept)):L};
const deptName=k=>G(()=>BUDX.DN(k),k);
const heads=()=>{const o={};arr(G(()=>BUDX.DEPTS,[])).forEach(d=>o[d[0]]=d[3]);return o};
const SHARED_CATS=["Cloud","Licences"];
/* model: per department direct and allocated cost */
function model(){const L=lines(),hc=heads(),own=owners();const by={};
 Object.keys(DOM).forEach(k=>by[k]={k,dom:DOM[k][0],exec:own[k],appr:0,comm:0,act:0,fcst:0,sh:{appr:0,comm:0,act:0,fcst:0},cc:G(()=>BUDX.DEPTS.find(d=>d[0]===k)[2],"")});
 L.forEach(l=>{const d=by[l.dept];if(!d)return;const shared=l.dept==="IT"&&SHARED_CATS.indexOf(l.cat)>=0;
  const tgt=shared?d.sh:d;["appr","comm","act","fcst"].forEach(f=>tgt[f]+=+l[f]||0)});
 /* allocation of IT shared pool by headcount */
 const tot=Object.keys(by).reduce((s,k)=>s+(hc[k]||0),0)||1;const pool=by.IT?by.IT.sh:{appr:0,comm:0,act:0,fcst:0};
 Object.keys(by).forEach(k=>{const d=by[k];const share=(hc[k]||0)/tot;d.alloc={};["appr","comm","act","fcst"].forEach(f=>d.alloc[f]=pool[f]*share);d.hc=hc[k]||0});
 const rows=Object.keys(by).map(k=>{const d=by[k];const sb=SP.showback;const v=f=>d[f]+(sb?d.alloc[f]:0);const r={k,dom:d.dom,exec:d.exec,cc:d.cc,hc:d.hc,appr:v("appr"),comm:v("comm"),act:v("act"),fcst:v("fcst"),direct:{appr:d.appr,fcst:d.fcst},alloc:d.alloc.fcst};r.var=r.appr?(r.fcst-r.appr)/r.appr*100:0;return r});
 return{rows,pool}}
const sum=(a,f)=>a.reduce((s,x)=>s+x[f],0);
const varPct=(f,a)=>a?((f-a)/a*100):0;
const fv=v=>(v>=0?"+":"")+v.toFixed(1)+"%";
const tone=v=>v>5?"bad":v>0?"warn":"good";
R18.spend={model,owners,DOM,EXECS,PERSONA_EXEC,stats(){const m=model();const A=sum(m.rows,"appr"),F=sum(m.rows,"fcst");const ex={};m.rows.forEach(r=>{(ex[r.exec]=ex[r.exec]||{exec:r.exec,rows:[],appr:0,fcst:0});ex[r.exec].rows.push(r);ex[r.exec].appr+=r.appr;ex[r.exec].fcst+=r.fcst});
 const unowned=m.rows.filter(r=>!r.exec).length;return{A,F,v:varPct(F,A),execs:Object.values(ex),unowned,rows:m.rows}}};

function me(){return PERSONA_EXEC[S.persona]||""}
function tbl(rows,sub){return `<div class="tscroll"><table class="tbl r18-t"><thead><tr><th>${sub?"Domain":"Executive and domains"}</th><th>Cost centers</th><th class="n">Approved</th><th class="n">Committed</th><th class="n">Actual</th><th class="n">Forecast</th><th class="n">Against approved</th></tr></thead><tbody>${rows}</tbody></table></div>`}
const num=v=>`<td class="n num">${usd(v)}</td>`;
function byOrgTab(st){const mine=me();const L=lines();const hcOf=r=>r.hc||0;
 const ceo=EXEC_NAME.CEO;const order=st.execs.slice().sort((a,b)=>(a.exec==="CEO"?-1:b.exec==="CEO"?1:0)||b.fcst-a.fcst);
 const per=(f,h)=>h?usd(f/h):"";
 const row=(cls,lvl,name,sub,cc,fte,a,c,ac,f,h)=>{const v=varPct(f,a);return `<tr class="r18-og ${cls}"><td class="r18-ol${lvl}"><b>${H(name)}</b>${sub?`<small class="muted">${H(sub)}</small>`:""}</td><td>${H(cc||"")}</td><td class="n num">${fte?fte:""}</td>${num(a)}${num(ac)}${num(f)}<td class="n num">${per(f,fte)}</td><td class="n">${pill(fv(v),tone(v))}</td></tr>`};
 let body=row("root",0,ceo,(staffOf(ceo)||{}).role||"Chief executive","",sum(st.rows,"hc"),st.A,sum(st.rows,"comm"),sum(st.rows,"act"),st.F);
 order.forEach(e=>{const nm=EXEC_NAME[e.exec];const st1=staffOf(nm);const hc=sum(e.rows,"hc");const own=e.exec===mine?"on":"";
  if(e.exec!=="CEO")body+=row("ex "+own,1,nm,(st1?st1.role:e.exec),"",hc,e.appr,sum(e.rows,"comm"),sum(e.rows,"act"),e.fcst);
  e.rows.forEach(r=>{body+=row("dm",e.exec==="CEO"?1:2,r.dom,"Cost center "+r.cc,r.cc,r.hc,r.appr,r.comm,r.act,r.fcst);
   const dept=r.k;const owners={};L.filter(l=>l.dept===dept).forEach(l=>{const o=owners[l.own]=owners[l.own]||{n:l.own,appr:0,comm:0,act:0,fcst:0};o.appr+=+l.appr||0;o.comm+=+l.comm||0;o.act+=+l.act||0;o.fcst+=+l.fcst||0});
   Object.values(owners).sort((a,b)=>b.fcst-a.fcst).forEach(o=>{const so=staffOf(o.n);body+=row("ow",e.exec==="CEO"?2:3,o.n,so?so.role+" · budget owner":"Budget owner","","",o.appr,o.comm,o.act,o.fcst)})})});
 return `<section class="card glass"><div class="cardhead"><div><h3>Spend along the org chart</h3><span class="muted small">Starts at the chief executive and follows who reports to whom. Each executive's total is the sum of the domains they own; under each domain are the people who own its budget. Cost per head is forecast divided by the department's staff.</span></div></div><div class="tscroll"><table class="tbl r18-t r18-org"><thead><tr><th>Org chart</th><th>Cost center</th><th class="n">Staff</th><th class="n">Approved</th><th class="n">Actual</th><th class="n">Forecast</th><th class="n">Per head</th><th class="n">Vs approved</th></tr></thead><tbody>${body}</tbody></table></div></section>`}
function byExecTab(st){const mine=me();
 const rows=st.execs.slice().sort((a,b)=>(a.exec===mine?-1:b.exec===mine?1:0)||b.fcst-a.fcst).map(e=>{const v=varPct(e.fcst,e.appr);
  const head=`<tr class="r18-sp-h ${e.exec===mine?"on":""}"><td><b>${H(e.exec)}</b> <span class="muted small">${H(EXEC_NAME[e.exec]||"")}</span><small class="muted">${e.rows.length>1?"Owns "+e.rows.length+" domains: "+H(e.rows.map(r=>r.dom).join(" and ")):"Owns "+H(e.rows[0].dom)}</small></td><td></td>${num(e.appr)}${num(sum(e.rows,"comm"))}${num(sum(e.rows,"act"))}${num(e.fcst)}<td class="n">${pill(fv(v),tone(v))}</td></tr>`;
  const kids=e.rows.length>1?e.rows.map(r=>`<tr class="r18-sp-k"><td class="r18-ind">${H(r.dom)}</td><td>${H(r.cc)}</td>${num(r.appr)}${num(r.comm)}${num(r.act)}${num(r.fcst)}<td class="n">${pill(fv(r.var),tone(r.var))}</td></tr>`).join(""):"";
  return head+kids}).join("");
 const foot=`<tr class="r18-sp-t"><td><b>Whole enterprise</b></td><td></td>${num(st.A)}${num(sum(st.rows,"comm"))}${num(sum(st.rows,"act"))}${num(st.F)}<td class="n">${pill(fv(st.v),tone(st.v))}</td></tr>`;
 return `<section class="card glass"><div class="cardhead"><div><h3>Spend by executive</h3><span class="muted small">Each cost center belongs to one domain and each domain to one executive, so no dollar is counted twice. An executive who owns several domains sees each one and the combined total.</span></div></div>${tbl(rows+foot)}</section>`}
function byDomainTab(st){const rows=st.rows.slice().sort((a,b)=>b.fcst-a.fcst).map(r=>`<tr><td><b>${H(r.dom)}</b><small class="muted">${H(deptName(r.k))}</small></td><td>${H(r.cc)}</td>${num(r.appr)}${num(r.comm)}${num(r.act)}${num(r.fcst)}<td class="n">${pill(fv(r.var),tone(r.var))}</td></tr>`).join("");
 return `<section class="card glass"><div class="cardhead"><div><h3>Spend by domain</h3><span class="muted small">${SP.showback?"Shared IT costs (cloud and licences) are allocated to the domains that use them, by headcount.":"Direct spend only. Shared IT costs stay in IT operations."}</span></div><label class="r18-sw"><input type="checkbox" data-r18-showback ${SP.showback?"checked":""}> Allocate shared IT costs</label></div>${tbl(rows,true)}
 <p class="small muted">For IT in depth, with towers, cost pools and unit cost, open <button class="r18-lk" type="button" data-go="tbm_model">Technology cost transparency</button>.</p></section>`}
function byTypeTab(){const L=lines();const cats=G(()=>BUDX.CATS,[]);const rows=cats.map(c=>{const l=L.filter(x=>x.cat===c);const a=sum(l,"appr"),f=sum(l,"fcst");return `<tr><td><b>${H(c)}</b></td><td class="n num">${l.length}</td>${num(a)}${num(sum(l,"act"))}${num(f)}<td class="n">${pill(fv(varPct(f,a)),tone(varPct(f,a)))}</td></tr>`}).join("");
 return `<section class="card glass"><div class="cardhead"><div><h3>Spend by type</h3><span class="muted small">Labor, vendors, hardware, cloud and licences across all domains.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Type</th><th class="n">Lines</th><th class="n">Approved</th><th class="n">Actual</th><th class="n">Forecast</th><th class="n">Against approved</th></tr></thead><tbody>${rows}</tbody></table></div></section>`}
function ownersTab(){const o=owners();const rows=Object.keys(DOM).map(k=>`<tr><td><b>${H(DOM[k][0])}</b><small class="muted">${H(deptName(k))}</small></td><td>${H(G(()=>BUDX.DEPTS.find(d=>d[0]===k)[2],""))}</td><td><select class="fin" data-r18-owner="${k}" aria-label="Executive owner of ${H(DOM[k][0])}">${EXECS.map(e=>`<option ${e===o[k]?"selected":""}>${e}</option>`).join("")}</select></td><td>${H(EXEC_NAME[o[k]]||"")}</td></tr>`).join("");
 return `<section class="card glass"><div class="cardhead"><div><h3>Domains and owners</h3><span class="muted small">Reassign a domain and every view follows. Changes are written to the audit trail. An owner of several domains sees the combined total.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Domain</th><th>Cost centers</th><th>Executive owner</th><th>Name</th></tr></thead><tbody>${rows}</tbody></table></div></section>`}
/* purview: CEO, COO and CFO see every domain; every other executive sees the domains they own.
   An executive who owns no domain (CHRO, CISO, CAIO, general counsel) sees their own budget lines plus the shared costs allocated to their function. */
const ALLVIEW=["CEO","COO","CFO"];
function purview(){const st0=R18.spend.stats();const mine=me();const own=st0.rows.filter(r=>r.exec===mine);
 const scoped=!!mine&&ALLVIEW.indexOf(mine)<0&&own.length>0;const none=!!mine&&ALLVIEW.indexOf(mine)<0&&own.length===0;
 let st=st0;if(scoped){const A=sum(own,"appr"),F=sum(own,"fcst");st={A,F,v:varPct(F,A),rows:own,execs:[{exec:mine,rows:own,appr:A,fcst:F}],unowned:0}}
 return{mine,scoped,none,own,st,all:st0}}
R18.spend.purview=purview;
function subtree(name){const seen=new Set();const walk=n=>{if(!n||seen.has(n))return;seen.add(n);G(()=>ORGX.kids(n),[]).forEach(k=>walk(k&&k.n||k))};walk(name);return seen}
/* what a function without its own domain costs: direct lines plus shared technology split by headcount, against an even share of the enterprise */
function allocModel(mine){const nm=EXEC_NAME[mine]||"";const m=model();const A=sum(m.rows,"appr"),F=sum(m.rows,"fcst");
 const names=subtree(nm);const staff=G(()=>ORGX.staff,[]);const hc=Math.max(1,staff.filter(x=>names.has(x.n)).length);const total=Math.max(1,staff.length);const share=hc/total;
 const L=lines().filter(l=>l.own&&names.has(l.own));const dA=sum(L,"appr"),dF=sum(L,"fcst");
 const pool=m.pool||{appr:0,fcst:0};const aA=(pool.appr||0)*share,aF=(pool.fcst||0)*share;
 return{nm,hc,total,share,A,F,L,dA,dF,aA,aF,totA:dA+aA,totF:dF+aF,evenF:F*share,evenA:A*share,poolF:pool.fcst||0}}
R18.spend.alloc=allocModel;
function allocBody(mine){const x=allocModel(mine);const row=(lab,sub,a,f)=>`<tr><td><b>${H(lab)}</b><small class="muted">${H(sub)}</small></td>${num(a)}${num(f)}<td class="n">${a?pill(fv(varPct(f,a)),tone(varPct(f,a))):""}</td></tr>`;
 const diff=x.evenF?(x.totF-x.evenF)/x.evenF*100:0;
 const body=row("Budget lines you own",x.L.length?x.L.length+" lines in your function":"No budget lines are owned by your function yet",x.dA,x.dF)
  +row("Shared technology allocated to you","Cloud and licences, split by headcount: "+x.hc+" of "+x.total+" staff ("+(x.share*100).toFixed(1)+"%)",x.aA,x.aF)
  +`<tr class="r18-sp-t"><td><b>Cost to run your function</b></td>${num(x.totA)}${num(x.totF)}<td class="n">${x.totA?pill(fv(varPct(x.totF,x.totA)),tone(varPct(x.totF,x.totA))):""}</td></tr>`
  +row("An even per-head share of the enterprise","The enterprise forecast split by headcount, for comparison",x.evenA,x.evenF);
 return `<div class="screen r18-screen">${hero("Budget and spend traceability · "+H(mine)+" purview","How your spend lines up with the enterprise allocations","Your function does not own a spending domain, so this shows what you own directly and the shared technology cost allocated to you by headcount, set against an even share of the enterprise. Allocation by headcount is a modeled working assumption, not a charge-back policy.")}
 ${typeof kpiRow==="function"?kpiRow([["Your function",x.hc+" staff",(x.share*100).toFixed(1)+"% of the enterprise"],["Cost to run it",usd(x.totF),"forecast"],["Even per-head share",usd(x.evenF),"modeled"],["Against an even share",fv(diff),"modeled",{cls:diff>5?"warn":""}]]):""}
 <section class="card glass"><div class="cardhead"><div><h3>Your spend against the enterprise allocation</h3><span class="muted small">Modeled. Direct lines are budget lines whose owner is in your reporting line. The shared pool is cloud and licence cost held in IT operations.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Component</th><th class="n">Approved</th><th class="n">Forecast</th><th class="n">Against approved</th></tr></thead><tbody>${body}</tbody></table></div><p class="small muted">The enterprise totals stay with the chief executive, chief operating officer and chief financial officer.</p></section></div>`}
function screen(){const pv=purview();
 if(pv.none)return allocBody(pv.mine);
 if(pv.scoped)CUR={keys:new Set(pv.own.map(r=>r.k))};
 try{return screenBody(pv.st,pv.scoped)}finally{CUR=null}}
function screenBody(st,scoped){const mine=me();const my=st.execs.find(e=>e.exec===mine);
 const note=my?`<section class="card glass r18-mine"><div class="eyebrow">Your domains</div><h3>${my.rows.length>1?"You own "+my.rows.map(r=>H(r.dom)).join(" and "):"You own "+H(my.rows[0].dom)}</h3><p>Forecast <b>${usd(my.fcst)}</b> against <b>${usd(my.appr)}</b> approved, ${pill(fv(varPct(my.fcst,my.appr)),tone(varPct(my.fcst,my.appr)))}. The rest of the enterprise is below.</p></section>`:"";
 const worst=st.rows.slice().sort((a,b)=>b.var-a.var)[0]||{dom:"",var:0};
 return `<div class="screen r18-screen">${scoped?hero("Budget and spend traceability · "+H(mine)+" purview","Spend in your purview: "+my.rows.map(r=>H(r.dom)).join(" and "),"Only the domains you own, with forecast against approved and the people who own each budget. The chief executive, chief operating officer and chief financial officer see every domain. Follow any dollar to a goal and the work it pays for in <button class=\"r18-lk\" type=\"button\" data-go=\"trace\">Executive trace</button>."):hero("Budget and spend traceability","Where the money goes across the enterprise","Follows the org chart from the chief executive down: every domain, the executive who owns it, and the people who own its budget, with forecast against approved. Follow any dollar to a goal and the work it pays for in <button class=\"r18-lk\" type=\"button\" data-go=\"trace\">Executive trace</button>. Technology cost transparency is the IT depth beneath it.")}
 ${typeof kpiRow==="function"?kpiRow([["Approved",usd(st.A),"all domains"],["Forecast",usd(st.F),"all domains"],["Forecast against approved",fv(st.v),"enterprise",{cls:st.v>5?"crit":st.v>0?"warn":""}],["Largest overrun",worst.dom,fv(worst.var)+" against approved",{cls:worst.var>5?"warn":""}]]):""}
 ${scoped?"":note}${typeof views==="function"?(scoped?views("r18spv",["By domain","By type"],[byDomainTab(st),byTypeTab()]):views("r18spv",["By org chart","By executive","By domain","By type","Domains and owners"],[byOrgTab(st),byExecTab(st),byDomainTab(st),byTypeTab(),ownersTab()])):byExecTab(st)}
 ${typeof procCard==="function"?procCard("r18_spend"):""}</div>`}
REG("r18_spend","Enterprise spend","money","M12 2v20M17 6.5C17 4.6 14.8 4 12 4S7 5 7 7c0 4.5 10 2.5 10 7 0 2.2-2.2 3-5 3s-5-.9-5-3",screen);

D.addEventListener("change",e=>{const t=e.target;if(!t.closest)return;
 const o=t.closest("[data-r18-owner]");if(o){owners()[o.dataset.r18Owner]=o.value;G(()=>audit("Changed domain owner",DOM[o.dataset.r18Owner][0]+" to "+o.value));G(()=>EVENTS.emit&&EVENTS.emit("spend.owner_changed",{domain:o.dataset.r18Owner,owner:o.value,actor:G(()=>R15D.me().name,"")}));G(()=>toast("Owner changed. Every spend view follows.","good"));render();return}
 const s=t.closest("[data-r18-showback]");if(s){SP.showback=s.checked;render()}});
/* IT depth screen points back to the enterprise view */
HOOKS.on("afterRender",()=>{try{if(S.screen==="tbm_model"||S.cur==="tbm_model"){const v=D.getElementById("view");if(v&&!v.querySelector(".r18-tbmnote")){const h=v.querySelector(".hero");if(h)h.insertAdjacentHTML("afterend",`<p class="small muted r18-tbmnote">This is the IT depth. For every domain and executive, including domains that are not IT, open <button class="r18-lk" type="button" data-go="r18_spend">Enterprise spend</button>.</p>`)}}}catch(x){}},{id:"r18h.tbmnote"});
})();
