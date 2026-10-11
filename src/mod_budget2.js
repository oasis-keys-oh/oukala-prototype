/* ============ Budgets drill-down (Round 12). Every number, row, category, project and KPI card on the Budgets screen opens
   a drawer that goes from totals to lines to commitments, transactions, vendors, contracts, invoices, the reserve and TBM,
   with a breadcrumb trail and a Back button the whole way. Reads the live budget through window.BUDX (mod_budget.js). ============ */
(function(){
"use strict";
const K=()=>window.BUDX;
if(!K())return;
const E=s=>esc(String(s==null?"":s));
const SHARE=()=>{const k=K(),t=k.sum(k.ACTM,x=>x);return k.ACTM.map(v=>v/t)};
const LV={"PR1-VEN":"LUM","PR2-VEN":"LUM","PR1-CLD":"NWC","PR3-CLD":"MSF","PR2-CLD":"MSF","PR1-LIC":"MSF","PR3-VEN":"NWC","PR1-LAB":"BRT"};
if(window.BUDX)window.BUDX.LV=LV;
const POOL={Labor:"Labor",Vendor:"Vendor and outside services",Hardware:"Hardware",Cloud:"Cloud services",Licences:"Software and licences"};
const GLA={Labor:["6110","Salaries and wages, IT"],Vendor:["6420","Consulting and implementation"],Hardware:["6210","Computer hardware, expensed"],Cloud:["6510","Azure consumption"],Licences:["6310","Software and licences"]};
const TYPE={Labor:"Payroll and timesheet allocation",Vendor:"Vendor invoice posting",Hardware:"Accounts payable invoice",Cloud:"Cloud consumption allocation",Licences:"Subscription invoice"};
const MEMO={Labor:"Time booked by the team and allocated to this line from the payroll cycle.",Vendor:"Vendor charges posted from approved invoices.",Hardware:"Equipment invoices posted on receipt.",Cloud:"Monthly consumption allocated from the cloud bill.",Licences:"Subscription charges posted on invoice."};
const EOM=["2026-07-31","2026-08-31","2026-09-30"],MID=["2026-07-15","2026-08-14","2026-09-15"];
const AUDIT_NOTE="Every drill is read-only. Use Edit on a line to change it; changes are audited.";
const LBL={appr:"Approved budget",comm:"Committed",act:"Actual, closed Sep 30",fcst:"Forecast at completion",unc:"Not yet committed",res:"Management reserve left",env:"Envelope",open:"Opening reserve",drawn:"Drawn so far",bal:"Balance now",after:"After pending",pend:"Pending requests"};

/* ---------- data helpers ---------- */
function lineMonths(l){const k=K(),s=SHARE(),fs=k.sum(k.FCPROF,x=>x),left=Math.max(0,l.fcst-l.act);return k.FM.map((m,i)=>i<3?{m,a:true,v:l.act*s[i]}:{m,a:false,v:left*k.FCPROF[i-3]/fs})}
function txns(l){const k=K(),s=SHARE(),out=[];let n=1;let paid=0;
 k.B().po.filter(p=>p.line===l.id&&p.paid>0).forEach(p=>{const tot=Math.max(0,Math.min(p.paid,l.act-paid));paid+=tot;let rem=tot;
  s.forEach((sh,i)=>{const a=i<2?Math.round(tot*sh):rem;rem-=a;if(a>0)out.push({id:"TX-"+l.id+"-"+String(n++).padStart(2,"0"),d:MID[i],amt:a,type:"Accounts payable payment",po:p.id,ct:p.ct,v:p.v,line:l.id,memo:"Payment against "+p.id+": "+p.d+"."})})});
 const bal=l.act-paid;
 if(bal>0){let rem=bal;s.forEach((sh,i)=>{const a=i<2?Math.round(bal*sh):rem;rem-=a;if(a>0)out.push({id:"TX-"+l.id+"-"+String(n++).padStart(2,"0"),d:EOM[i],amt:a,type:TYPE[l.cat],po:"",ct:"",v:LV[l.id]||"",line:l.id,memo:MEMO[l.cat]})})}
 return out.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:a.id<b.id?-1:1)}
const allTx=ls=>ls.flatMap(txns);
function vendorsOf(ls){const k=K(),ids=new Set(ls.map(l=>l.id)),m={};
 k.B().po.filter(p=>ids.has(p.line)).forEach(p=>{const r=m[p.v]=m[p.v]||{v:p.v,ord:0,paid:0,lines:new Set(),pos:[]};r.ord+=p.ord;r.paid+=p.paid;r.lines.add(p.line);r.pos.push(p.id)});
 ls.forEach(l=>{const v=LV[l.id];if(v&&!m[v])m[v]={v,ord:0,paid:0,lines:new Set([l.id]),pos:[],alloc:true};else if(v)m[v].lines.add(l.id)});
 return Object.values(m).sort((a,b)=>b.ord+b.paid-a.ord-a.paid)}
function contractsOf(ls){const k=K(),ids=new Set(ls.map(l=>l.id)),ps=new Set(ls.map(l=>l.p)),pos=k.B().po.filter(p=>ids.has(p.line)).map(p=>p.ct);
 return k.B().con.filter(c=>ids.has(c.line)||pos.includes(c.id)||(c.proj&&ps.has(c.proj)&&ls.some(l=>l.p===c.proj&&l.cat==="Vendor")))}
const invoicesOf=cs=>INVOICES.filter(i=>cs.some(c=>c.inv.includes(i.id)));
const ledOf=ls=>{const k=K(),ids=new Set(ls.map(l=>l.id));return k.B().led.filter(e=>e.line&&ids.has(e.line))};
const projLines=p=>K().PL(p);

/* ---------- small renderers ---------- */
const dn=(t,d,c)=>/\bbtn\b/.test(c||"")?`<button type="button" class="${c}" data-bd="${d}" data-nodrag>${t}</button>`:K().dn(t,d,c);
const D$=v=>K().D$(v),C$=v=>K().C$(v);
const pill=(t,c)=>`<span class="pill ${c||"mute"}">${E(t)}</span>`;
const eb=t=>`<div class="eyebrow bd-eb">${t}</div>`;
const tbl=(head,rows,min)=>K().wrap(`<table style="min-width:${min||520}px"><thead><tr>${head.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`);
const none=t=>`<p class="muted small">${E(t)}</p>`;
const sec=(id,title,count,body,open)=>`<details class="bd-sec" id="bd-sec-${id}" ${open?"open":""}><summary><b>${title}</b>${count!=null?`<span class="cnt">${count}</span>`:""}</summary><div class="bd-secb">${body}</div></details>`;
const go2=(label,scr,key,val,cls)=>`<button type="button" class="btn ${cls||""}" data-bd-go="${scr}|${key||""}|${val==null?"":val}">${label}</button>`;
const varPill=v=>K().vpill(v);
const vcol=v=>v>0?"var(--bad)":v<0?"var(--good-f)":"var(--muted)";
const statRow=a=>`<div class="statrow bd-stats">${a.map(x=>K().stat(x[0],x[1],x[2],x[3],x[4])).join("")}</div>`;

function linesTable(ls,o){o=o||{};const k=K(),foc=o.foc||"";
 const hdr=["Budget line",o.proj?"Project":"Category","Approved","Committed","Actual","Forecast","Variance"];
 const rows=ls.map(l=>{const v=l.fcst-l.appr,c=(f)=>foc===f?' class="tabular bd-foc"':' class="tabular"';
  return `<tr><td>${dn(`<b>${E(l.id)}</b><span class="sub">${E(l.n)}</span>`,"line:"+l.id,"bd-row")}</td><td class="small">${o.proj?dn(E(k.PJ(l.p).short),"proj:"+l.p):dn(E(l.cat),"cat:"+l.cat)}</td><td${c("appr")}>${dn(D$(l.appr),"line:"+l.id+":appr")}</td><td${c("comm")}>${dn(D$(l.comm),"line:"+l.id+":comm")}</td><td${c("act")}>${dn(D$(l.act),"line:"+l.id+":act")}</td><td${c("fcst")}>${dn(D$(l.fcst),"line:"+l.id+":fcst")}</td><td>${dn(varPill(v),"line:"+l.id+":fcst","bd-pill")}</td></tr>`});
 const t=k.T(ls);rows.push(`<tr class="bd-tot"><td><b>Total, ${ls.length} line${ls.length===1?"":"s"}</b></td><td></td><td class="tabular"><b>${D$(t.appr)}</b></td><td class="tabular"><b>${D$(t.comm)}</b></td><td class="tabular"><b>${D$(t.act)}</b></td><td class="tabular"><b>${D$(t.fcst)}</b></td><td>${varPill(t.fcst-t.appr)}</td></tr>`);
 return tbl(hdr,rows,640)}
function vendorsTable(ls){const k=K(),vs=vendorsOf(ls);if(!vs.length)return none("No vendor is attached to these lines. They are paid through payroll or internal allocation.");
 return tbl(["Vendor","Ordered","Paid","Lines","Scorecard"],vs.map(r=>{const v=k.VID(r.v),sc=v?k.vScore(v).sc:0;
  return `<tr><td>${dn(`<b>${E(v?v.n:r.v)}</b><span class="sub">${r.alloc?"Allocated spend, no purchase order":r.pos.join(", ")}</span>`,"vend:"+r.v,"bd-row")}</td><td class="tabular">${D$(r.ord)}</td><td class="tabular">${D$(r.paid)}</td><td class="small">${[...r.lines].map(x=>dn(E(x),"line:"+x)).join(" ")}</td><td>${dn(pill(sc.toFixed(2),sc>=.85?"good":sc>=.75?"warn":"bad"),"vend:"+r.v,"bd-pill")}</td></tr>`}),520)}
function contractsTable(cs){const k=K();if(!cs.length)return none("No contract is linked. Spend on these lines is internal labor or an unwritten commitment.");
 return tbl(["Contract","Vendor","Value","Paid","Term ends","Status"],cs.map(c=>{const s=k.stCon(c);return `<tr><td>${dn(`<b>${E(c.id)}</b><span class="sub">${E(c.n)}</span>`,"ct:"+c.id,"bd-row")}</td><td>${dn(E(k.VID(c.v).n),"vend:"+c.v)}</td><td class="tabular">${D$(c.tcv)}</td><td class="tabular">${D$(k.conPaid(c))}</td><td class="small">${k.dfmt(c.e)}</td><td>${dn(pill(s[0],s[1]),"ct:"+c.id,"bd-pill")}</td></tr>`}),620)}
function posTable(ps){const k=K();if(!ps.length)return none("No purchase orders.");
 return tbl(["Purchase order","Vendor","Ordered","Received","Invoiced","Paid","Match"],ps.map(p=>{const m=k.m3(p);return `<tr><td>${dn(`<b>${E(p.id)}</b><span class="sub">${E(p.d)}</span>`,"po:"+p.id,"bd-row")}</td><td>${dn(E(k.VID(p.v).n),"vend:"+p.v)}</td><td class="tabular">${D$(p.ord)}</td><td class="tabular">${D$(p.rec)}</td><td class="tabular">${D$(p.inv)}</td><td class="tabular">${D$(p.paid)}</td><td>${dn(pill(m[0],m[1]),"po:"+p.id,"bd-pill")}</td></tr>`}),700)}
function invoicesTable(is){if(!is.length)return none("No open invoices.");
 return tbl(["Invoice","Vendor","Amount","Due","Advisor"],is.map(i=>`<tr><td>${dn(`<b>${E(i.id)}</b><span class="sub">${E(i.contract)}</span>`,"inv:"+i.id,"bd-row")}</td><td>${E(i.vendor)}</td><td class="tabular">${dn(D$(i.amt),"inv:"+i.id)}</td><td class="small">${E(i.due)}</td><td>${dn(pill(i.rec,i.rec==="approve"?"good":i.rec==="hold"?"warn":"bad"),"inv:"+i.id,"bd-pill")}</td></tr>`),520)}
function txTable(ts,limit){const k=K();limit=limit||14;if(!ts.length)return none("No transactions have posted yet.");
 const rows=ts.slice(0,limit).map(t=>`<tr><td>${dn(`<b>${E(t.id)}</b><span class="sub">${k.dfmt(t.d)}</span>`,"txn:"+t.id,"bd-row")}</td><td class="small">${E(t.type)}${t.v?`<span class="sub">${dn(E(k.VID(t.v)?k.VID(t.v).n:t.v),"vend:"+t.v)}</span>`:""}</td><td class="small">${t.po?dn(E(t.po),"po:"+t.po):'<span class="muted">No PO</span>'}</td><td class="small">${dn(E(t.line),"line:"+t.line)}</td><td class="tabular">${dn(D$(t.amt),"txn:"+t.id)}</td></tr>`);
 const tot=ts.reduce((a,t)=>a+t.amt,0);rows.push(`<tr class="bd-tot"><td colspan="4"><b>${ts.length>limit?`Showing ${limit} of ${ts.length}. Total of all ${ts.length}`:`Total, ${ts.length} transaction${ts.length===1?"":"s"}`}</b></td><td class="tabular"><b>${D$(tot)}</b></td></tr>`);
 return tbl(["Transaction","Type and vendor","Purchase order","Line","Amount"],rows,620)}
function ledTable(es){if(!es.length)return none("No reserve entries.");const k=K();
 return tbl(["Entry","Project","Reason","Amount","Status"],es.map(e=>`<tr><td>${dn(`<b>${e.id}</b><span class="sub">${k.dfmt(e.d)}</span>`,"led:"+e.id,"bd-row")}</td><td class="small">${e.line?dn(E(e.line),"line:"+e.line):e.p?dn(E(k.PJ(e.p).short),"proj:"+e.p):"Portfolio"}</td><td class="small" style="white-space:normal;min-width:200px">${E(e.why)}</td><td class="tabular" style="color:${e.amt<0?"var(--bad)":"var(--good-f)"}">${dn((e.amt<0?"−":"+")+D$(Math.abs(e.amt)),"led:"+e.id)}</td><td>${dn(pill(e.st,e.st==="Approved"?"good":e.st==="Pending"?"warn":"bad"),"led:"+e.id,"bd-pill")}</td></tr>`),620)}
function monthTable(ls,foc){const k=K();const ms=ls.map(lineMonths);
 const rows=k.FM.map((m,i)=>{const v=k.sum(ms,a=>a[i].v),a=i<3;return `<tr class="${foc===m?"bd-foc":""}"><td>${dn(`<b>${m}</b>`,"month:"+m,"bd-row")} ${a?pill("Actual","mute"):pill("Forecast","info")}</td><td class="tabular">${dn(D$(v),"month:"+m)}</td></tr>`});
 rows.push(`<tr class="bd-tot"><td><b>Total</b></td><td class="tabular"><b>${D$(k.sum(ms,a=>k.sum(a,x=>x.v)))}</b></td></tr>`);return tbl(["Month","Actual or forecast"],rows,300)}
const tbmBlock=(cats,ls)=>{const k=K();return `<div class="bd-tbm"><div>${cats.map(c=>`<div class="row sp small" style="padding:3px 0"><span>${E(c)} lines</span><span class="muted">Cost pool ${E(POOL[c])}, ledger ${GLA[c][0]} ${E(GLA[c][1])}</span></div>`).join("")}</div><p class="small muted" style="margin:8px 0">In Cost transparency (TBM) this spend lands in those cost pools, then flows through resource towers and services to the consumers who pay for it. ${C$(k.T(ls).fcst)} of forecast is in scope.</p><div class="row">${go2("Open Cost transparency (TBM)","tbm_model")}${go2("Open Financial model","bud_model","budm",3)}</div></div>`};

/* ---------- breadcrumb ---------- */
const BD=window.BD={stack:[],cur:null,_in:false};
function label(it){const k=K(),a=it.kind,id=it.id;
 try{if(a==="m")return LBL[id]||id;if(a==="proj")return k.PJ(id).short;if(a==="line")return id;if(a==="cat")return id;if(a==="dept")return k.DN(id);if(a==="prg")return id;if(a==="txn")return id;if(a==="po")return id;if(a==="ct")return id;if(a==="vend")return k.VID(id).n;if(a==="inv")return id;if(a==="led")return id;if(a==="xf")return id;if(a==="month")return id;if(a==="tier")return "Tier "+id;if(a==="capex")return "CapEx "+id}catch(e){}
 return id}
function crumb(){const st=BD.stack;const items=st.map((it,i)=>i===st.length-1?`<b aria-current="page">${E(label(it))}</b>`:`<button type="button" data-bd-crumb="${i}">${E(label(it))}</button>`);
 return `<nav class="bd-crumb" aria-label="Breadcrumb"><button type="button" data-bd-crumb="-1">Budgets</button>${items.map(x=>`<i aria-hidden="true">›</i>${x}`).join("")}${st.length>1?`<button type="button" class="bd-back" data-bd-back>← Back to ${E(label(st[st.length-2]))}</button>`:""}</nav>`}
BD.after=function(kind,id){const top=BD.stack[BD.stack.length-1];if(!top||top.kind!==kind||top.id!==id){BD.stack=[{kind,id}]}decorate()};
function decorate(){const d=document.getElementById("drawer");if(!d)return;d.querySelectorAll(":scope>.bd-crumb").forEach(n=>n.remove());const nav=document.createElement("div");nav.innerHTML=crumb();const n=nav.firstChild;const bar=d.querySelector(":scope>.dctl");if(bar&&bar.nextSibling)d.insertBefore(n,bar.nextSibling);else d.appendChild(n);d.classList.add("bd-on")}

/* ---------- views ---------- */
const V={};
function head(pillHtml,title,sub){return `${pillHtml||""}<h2 class="bd-title">${title}</h2>${sub?`<p class="muted" data-role="story">${sub}</p>`:""}`}
const foot=(extra)=>`<div class="row bd-foot">${extra||""}</div><p class="small muted bd-note">${AUDIT_NOTE}</p>`;

/* KPI cards and totals */
const MDEF={
 appr:{f:"Σ approved amount of every budget line",per:l=>l.appr,col:"appr"},
 comm:{f:"Σ committed (purchase orders and signed contracts) of every budget line",per:l=>l.comm,col:"comm"},
 act:{f:"Σ actual spend posted through Sep 30 on every budget line",per:l=>l.act,col:"act"},
 fcst:{f:"Σ forecast at completion of every budget line; variance = forecast − approved",per:l=>l.fcst-l.appr,col:"fcst",sorted:"var"},
 unc:{f:"Approved − Committed, per line: money not yet placed on a purchase order or contract",per:l=>l.appr-l.comm,col:"unc"}};
V.m=function(id,foc){const k=K(),B=k.B(),t=k.T(B.lines);
 if(["res","env","open","drawn","bal","after","pend"].includes(id))return V.reserve(id);
 const d=MDEF[id];if(!d)return head("","Unknown measure");
 const val={appr:t.appr,comm:t.comm,act:t.act,fcst:t.fcst,unc:t.appr-t.comm}[id];
 const ps=k.B().lines&&PROJ.map(p=>({p,l:k.PL(p.id)}));
 const prow=ps.map(x=>{const a=k.T(x.l),u=a.appr-a.comm;return `<tr><td>${dn(`<b>${E(x.p.short)}</b><span class="sub">${x.p.id} · ${E(k.PRG[x.p.id])}</span>`,"proj:"+x.p.id+":"+(id==="unc"?"comm":id),"bd-row")}</td><td class="tabular ${id==="appr"?"bd-foc":""}">${dn(D$(a.appr),"proj:"+x.p.id+":appr")}</td><td class="tabular ${id==="comm"?"bd-foc":""}">${dn(D$(a.comm),"proj:"+x.p.id+":comm")}</td><td class="tabular ${id==="act"?"bd-foc":""}">${dn(D$(a.act),"proj:"+x.p.id+":act")}</td><td class="tabular ${id==="fcst"?"bd-foc":""}">${dn(D$(a.fcst),"proj:"+x.p.id+":fcst")}</td><td class="tabular ${id==="unc"?"bd-foc":""}">${dn(D$(u),"proj:"+x.p.id+":comm")}</td></tr>`});
 prow.push(`<tr class="bd-tot"><td><b>Portfolio</b></td><td class="tabular"><b>${D$(t.appr)}</b></td><td class="tabular"><b>${D$(t.comm)}</b></td><td class="tabular"><b>${D$(t.act)}</b></td><td class="tabular"><b>${D$(t.fcst)}</b></td><td class="tabular"><b>${D$(t.appr-t.comm)}</b></td></tr>`);
 const ranked=B.lines.slice().sort((a,b)=>Math.abs(d.per(b))-Math.abs(d.per(a))).filter(l=>d.per(l)!==0).slice(0,id==="fcst"?10:8);
 const cats=k.CATS.map(c=>({c,t:k.T(B.lines.filter(l=>l.cat===c))}));
 return head(pill(LBL[id],"info"),`${LBL[id]}: <span class="num bd-big">${D$(val)}</span>`,{appr:"The sum of approved amounts across the five categories and four projects.",comm:"What has been placed on purchase orders and signed contracts. One line is committed above its approved amount.",act:"Posted spend through the September 30 close. Select a project to see which lines and transactions it came from.",fcst:`${varPill(t.fcst-t.appr)} against the approved budget. The reserve is the funding source for the difference.`,unc:"Approved money that is not committed yet, and what the forecast says will still be needed."}[id])+
 `<div class="formula" data-role="metric">${E(d.f)} = ${D$(val)}</div>`+
 eb("By project")+tbl(["Project","Approved","Committed","Actual","Forecast","Not committed"],prow,640)+
 eb("By category")+tbl(["Category","Approved","Committed","Actual","Forecast"],cats.map(x=>`<tr><td>${dn(`<b>${x.c}</b>`,"cat:"+x.c+":"+(id==="unc"?"comm":id),"bd-row")}</td><td class="tabular">${dn(D$(x.t.appr),"cat:"+x.c+":appr")}</td><td class="tabular">${dn(D$(x.t.comm),"cat:"+x.c+":comm")}</td><td class="tabular">${dn(D$(x.t.act),"cat:"+x.c+":act")}</td><td class="tabular">${dn(D$(x.t.fcst),"cat:"+x.c+":fcst")}</td></tr>`),520)+
 eb(id==="fcst"?"Lines with the biggest variance":"Largest lines for this measure")+linesTable(ranked,{foc:d.col==="unc"?"comm":d.col,proj:true})+
 (id==="act"?eb("Latest transactions")+txTable(allTx(B.lines).sort((a,b)=>a.d<b.d?1:-1),8):"")+
 (id==="comm"?eb("Purchase orders on project lines")+posTable(B.po.filter(p=>k.LN(p.line))):"")+
 (id==="fcst"?eb("Funding the difference")+`<p class="small muted">${varPill(t.fcst-t.appr)} is funded from the management reserve (${C$(k.resBal())} now, ${C$(k.resBal()-k.resPend())} after pending requests).</p><div class="row">${dn("Open the reserve ledger","m:bal","btn")}${go2("Open the Forecast tab","bud_over","budv",3)}</div>`:"")+
 foot(go2("Reforecast","bud_over","budv",0)+go2("Open Cost transparency (TBM)","tbm_model"))};

V.reserve=function(id){const k=K(),B=k.B(),bal=k.resBal(),pend=k.resPend(),op=k.resOpen(),dr=k.drawn(),un=k.unfunded();
 const val={res:bal,bal,open:op,drawn:dr,after:bal-pend,pend,env:k.T(B.lines).appr+op}[id];
 let es=B.led;if(id==="drawn")es=B.led.filter(e=>e.t==="draw"&&e.st==="Approved");if(id==="pend")es=B.led.filter(e=>e.st==="Pending");if(id==="open")es=B.led.filter(e=>e.t==="open");
 const byP=PROJ.map(p=>({p,dr:k.drawn(p.id),pe:k.pendP(p.id),ov:Math.max(0,k.T(k.PL(p.id)).fcst-k.T(k.PL(p.id)).appr)}));
 const ftxt={res:"Reserve balance = opening reserve + approved draws (draws are negative)",bal:"Reserve balance = opening reserve + approved draws (draws are negative)",open:"Opening reserve held by the CFO for the whole portfolio",drawn:"Σ approved draws",pend:"Σ requests waiting for approval",after:"Balance − pending requests",env:"Envelope = approved budgets + opening management reserve"}[id];
 const calc={res:`${D$(op)} − ${D$(dr)} = ${D$(bal)}`,bal:`${D$(op)} − ${D$(dr)} = ${D$(bal)}`,open:D$(op),drawn:D$(dr),pend:D$(pend),after:`${D$(bal)} − ${D$(pend)} = ${D$(bal-pend)}`,env:`${D$(k.T(B.lines).appr)} + ${D$(op)} = ${D$(val)}`}[id];
 let run=0;const lrows=B.led.map(e=>{if(e.st==="Approved")run+=e.amt;return `<tr><td>${dn(`<b>${e.id}</b><span class="sub">${k.dfmt(e.d)}</span>`,"led:"+e.id,"bd-row")}</td><td class="tabular" style="color:${e.amt<0?"var(--bad)":"var(--good-f)"}">${e.amt<0?"−":"+"}${D$(Math.abs(e.amt))}</td><td class="tabular">${e.st==="Approved"?dn(D$(run),"led:"+e.id+":bal"):'<span class="muted">Not posted</span>'}</td><td>${pill(e.st,e.st==="Approved"?"good":e.st==="Pending"?"warn":"bad")}</td></tr>`});
 return head(pill(LBL[id]||"Reserve","info"),`${LBL[id]||"Reserve"}: <span class="num bd-big">${D$(val)}</span>`,"The management reserve is the CFO's pool for the whole portfolio. Every draw, decision and balance below opens its own record.")+
 `<div class="formula" data-role="metric">${E(ftxt)}: ${calc}</div>`+
 eb(id==="env"?"What the envelope is made of":"Reserve by project")+(id==="env"?tbl(["Part","Amount"],[`<tr><td>${dn("<b>Approved budgets</b>","m:appr","bd-row")}</td><td class="tabular">${dn(D$(k.T(B.lines).appr),"m:appr")}</td></tr>`,`<tr><td>${dn("<b>Opening management reserve</b>","m:open","bd-row")}</td><td class="tabular">${dn(D$(op),"m:open")}</td></tr>`,`<tr class="bd-tot"><td><b>Envelope</b></td><td class="tabular"><b>${D$(val)}</b></td></tr>`],360):
 tbl(["Project","Forecast overrun","Drawn","Pending"],byP.map(x=>`<tr><td>${dn(`<b>${E(x.p.short)}</b>`,"proj:"+x.p.id+":res","bd-row")}</td><td class="tabular">${dn(D$(x.ov),"proj:"+x.p.id+":fcst")}</td><td class="tabular">${dn(D$(x.dr),"proj:"+x.p.id+":res")}</td><td class="tabular">${dn(D$(x.pe),"proj:"+x.p.id+":res")}</td></tr>`),480))+
 eb("Ledger entries"+(es.length!==B.led.length?" in this measure":""))+ledTable(es)+
 (id==="bal"||id==="res"||id==="after"?eb("Running balance")+tbl(["Entry","Amount","Balance","Status"],lrows,480):"")+
 `<p class="small muted" data-role="story">${un>0?`${C$(un)} of forecast overrun still has no funding source.`:"Nothing is unfunded."}</p>`+
 foot(go2("Open the Reserve and approvals tab","bud_over","budv",4)+go2("Request reserve","bud_over","budv",4))};

/* project, category, department, program */
function groupView(kicker,title,sub,ls,o){o=o||{};const k=K(),t=k.T(ls),foc=o.foc||"",ps=[...new Set(ls.map(l=>l.p))];
 const cs=contractsOf(ls),pos=k.B().po.filter(p=>ls.some(l=>l.id===p.line)),is=invoicesOf(cs),es=ledOf(ls),tx=allTx(ls);
 const tk=[["Approved",C$(t.appr),k.PRG?ls.length+" lines":"","good","appr"],["Committed",C$(t.comm),k.pc(t.comm/(t.appr||1)*100)+" of approved",k.tcls(t.comm,t.appr),"comm"],["Actual",C$(t.act),k.pc(t.act/(t.appr||1)*100)+" of approved",t.act>t.appr?"warn":"good","act"],["Forecast",C$(t.fcst),k.sgn(t.fcst-t.appr)+" vs approved",k.tcls(t.fcst,t.appr),"fcst"]];
 const kpis=`<div class="statrow bd-stats">${tk.map(x=>k.stat(x[0],x[1],x[2],x[3],o.kpi(x[4]))).join("")}</div>`;
 return head(kicker,title,sub)+kpis+
 (ps.length>1?eb("By project")+tbl(["Project","Approved","Committed","Actual","Forecast"],ps.map(p=>{const a=k.T(ls.filter(l=>l.p===p));return `<tr><td>${dn(`<b>${E(k.PJ(p).short)}</b>`,"proj:"+p,"bd-row")}</td><td class="tabular">${dn(D$(a.appr),"proj:"+p+":appr")}</td><td class="tabular">${dn(D$(a.comm),"proj:"+p+":comm")}</td><td class="tabular">${dn(D$(a.act),"proj:"+p+":act")}</td><td class="tabular">${dn(D$(a.fcst),"proj:"+p+":fcst")}</td></tr>`}),520):"")+
 sec("lines","Budget lines",ls.length,linesTable(ls,{foc,proj:o.projCol}),true)+
 sec("vend","Vendors",vendorsOf(ls).length,vendorsTable(ls),foc==="comm"||foc==="vend")+
 sec("ct","Contracts",cs.length,contractsTable(cs),foc==="comm")+
 sec("po","Purchase orders",pos.length,posTable(pos),foc==="comm")+
 sec("inv","Invoices",is.length,invoicesTable(is),false)+
 sec("tx","Transactions",tx.length,txTable(tx.sort((a,b)=>a.d<b.d?1:-1),12),foc==="act")+
 sec("led","Reserve entries",es.length,ledTable(es),foc==="res")+
 sec("fc","Forecast by month",null,monthTable(ls,""),foc==="fcst")+
 sec("tbm","Cost transparency (TBM)",null,tbmBlock([...new Set(ls.map(l=>l.cat))],ls),false)+
 foot(o.foot||"")}
V.proj=function(id,foc){const k=K(),p=k.PJ(id);if(!p)return head("","Unknown project");const ls=k.PL(id);
 return groupView(pill(id+" · "+k.PRG[id],"info"),E(p.short),`Owner ${pchip(p.owner)}. ${ls.length} budget lines across ${[...new Set(ls.map(l=>l.cat))].length} categories. Every figure below drills to the line, then to the purchase order, contract, vendor, invoice or posting behind it.`,ls,{foc,kpi:f=>"proj:"+id+":"+f,foot:go2("Show in By project","bud_over","budv",1)+go2("Open capitalization","bud_model","budm",1)+dn("CapEx and OpEx for this project","capex:"+id,"btn")})};
V.cat=function(id,foc){const k=K(),ls=k.B().lines.filter(l=>l.cat===id);if(!ls.length)return head("","Unknown category");
 return groupView(pill("Category","info"),E(id),`${ls.length} lines across ${[...new Set(ls.map(l=>l.p))].length} projects. In TBM this category is the ${E(POOL[id])} cost pool.`,ls,{foc,projCol:true,kpi:f=>"cat:"+id+":"+f,foot:go2("Show in By category","bud_over","budv",2)})};
V.dept=function(id,foc){const k=K(),d=DEPTS_(id),ls=k.B().lines.filter(l=>l.dept===id);if(!d)return head("","Unknown department");
 return groupView(pill("Department · "+d[2],"info"),E(d[1]),`Who carries the budget. ${ls.length} lines. Showback to the people who consume the services is in the Financial model.`,ls,{foc,projCol:true,kpi:f=>"dept:"+id+":"+f,foot:go2("Open showback","bud_model","budm",4)})};
const DEPTS_=id=>K().DEPTS.find(d=>d[0]===id);
V.prg=function(id,foc){const k=K(),ls=k.B().lines.filter(l=>k.PRG[l.p]===id);if(!ls.length)return head("","Unknown program");
 return groupView(pill("Program","info"),E(id),`Holds ${[...new Set(ls.map(l=>l.p))].map(p=>p+" "+k.PJ(p).short).join(" and ")}.`,ls,{foc,projCol:true,kpi:f=>"prg:"+id+":"+f,foot:go2("Show in By category","bud_over","budv",2)})};

V.capex=function(id){const k=K(),p=k.PJ(id);if(!p)return head("","Unknown project");const ls=k.PL(id),m=k.B().mp[id],c=k.capTot(ls),f=k.T(ls).fcst;
 return head(pill("CapEx and OpEx","info"),E(p.short)+": capital <span class='num bd-big'>"+D$(c)+"</span>",`${k.pc(c/f*100)} of the ${D$(f)} forecast is capitalized under the project's development stage and direct-labor shares (${m.dev}% development, ${m.dir}% direct).`)+
 `<div class="formula" data-role="metric">CapEx = Labor × ${m.dev}% × ${m.dir}% + Vendor × ${m.dev}% + Hardware × 100% = ${D$(c)}; OpEx = ${D$(f-c)}</div>`+
 eb("Capital share by line")+tbl(["Budget line","Forecast","Capital share","CapEx","OpEx"],ls.map(l=>{const sh=k.capShare(l);return `<tr><td>${dn(`<b>${E(l.id)}</b><span class="sub">${E(l.n)}</span>`,"line:"+l.id+":fcst","bd-row")}</td><td class="tabular">${dn(D$(l.fcst),"line:"+l.id+":fcst")}</td><td class="tabular">${k.pc(sh*100)}</td><td class="tabular">${D$(l.fcst*sh)}</td><td class="tabular">${D$(l.fcst*(1-sh))}</td></tr>`}),560)+
 foot(go2("Open capitalization rules","bud_model","budm",1)+dn("Open the project","proj:"+id,"btn"))};

/* a single budget line */
V.line=function(id,foc){const k=K(),l=k.LN(id);if(!l)return head("","Unknown line");const B=k.B(),v=l.fcst-l.appr,hr=l.appr-l.comm,pj=k.PJ(l.p);
 const pos=B.po.filter(p=>p.line===id),cs=contractsOf([l]).filter(c=>c.line===id||pos.some(p=>p.ct===c.id)),is=invoicesOf(cs),es=ledOf([l]),xs=B.xf.filter(x=>x.line===id||(x.to===l.p&&l.n.indexOf("moved from")>-1)),tx=txns(l),ms=lineMonths(l);
 const posSum=k.sum(pos,p=>p.ord),other=Math.max(0,l.comm-posSum),txSum=k.sum(tx,t=>t.amt);
 const ap=k.whoApproves(l.appr,{Labor:"Labor",Vendor:"Vendor services",Hardware:"Hardware",Cloud:"Cloud",Licences:"Licences"}[l.cat],l.own,{proj:l.p});
 const tk=[["Approved",C$(l.appr),"set at the Jul 1 budget approval","good","appr"],["Committed",C$(l.comm),hr<0?C$(-hr)+" over approved":C$(hr)+" uncommitted",hr<0?"bad":"good","comm"],["Actual",C$(l.act),k.pc(l.act/(l.appr||1)*100)+" of approved","good","act"],["Forecast",C$(l.fcst),k.sgn(v)+" vs approved",k.tcls(l.fcst,l.appr),"fcst"]];
 const dr=-k.sum(es.filter(e=>e.st==="Approved"),e=>e.amt),pe=-k.sum(es.filter(e=>e.st==="Pending"),e=>e.amt);
 const msum=k.sum(ms,m=>m.v);
 return head(pill(l.cat,"mute")+" "+pill(pj.id+" "+pj.short,"info"),`${E(l.id)} · ${E(l.n)}`,`Owner ${pchip(l.own)}. Department ${dn(E(k.DN(l.dept)),"dept:"+l.dept)}. Category ${dn(E(l.cat),"cat:"+l.cat)}. Project ${dn(E(pj.short),"proj:"+l.p)}.`)+
 `<div class="statrow bd-stats">${tk.map(x=>k.stat(x[0],x[1],x[2],x[3],"line:"+id+":"+x[4])).join("")}</div>`+
 (l.why?`<div class="rem"><div class="ico">${ico("info")}</div><div style="flex:1"><b>Why it varies</b><div class="small" data-role="story">${E(l.why)}</div>${l.fix?`<div class="small muted" style="margin-top:4px"><b>What we are doing.</b> ${E(l.fix)}</div>`:""}</div></div>`:"")+
 sec("appr","Approved: "+D$(l.appr),null,`<dl class="kv"><dt>Approved amount</dt><dd data-role="metric">${D$(l.appr)}</dd><dt>Budget owner</dt><dd>${pchip(l.own)}</dd><dt>Approval tier</dt><dd>${E(ap.tier.id)}, up to ${ap.tier.max===Infinity?"any amount":D$(ap.tier.max)}. Final approver ${E(ap.final)}.</dd><dt>Reserve drawn</dt><dd>${dr?dn(D$(dr),"line:"+id+":res"):"None"}${pe?`, ${dn(D$(pe)+" pending","line:"+id+":res")}`:""}</dd></dl>${K().chainHTML(ap)}${xs.length?eb("Transfers")+xs.map(x=>`<div class="row sp small">${dn(`<b>${x.id}</b> ${D$(x.amt)} from ${E(x.from)} to ${E(x.to)}`,"xf:"+x.id)}${pill(x.st,x.st==="Approved"?"good":"warn")}</div>`).join(""):""}`,foc==="appr")+
 sec("comm","Committed: "+D$(l.comm),pos.length+cs.length,`${posTable(pos)}${other>0?`<p class="small muted" style="margin:8px 0 0">Another ${D$(other)} is committed outside a purchase order (${E(l.cat)} plan, internal allocation).</p>`:""}${eb("Contracts")}${contractsTable(cs)}${eb("Vendors")}${vendorsTable([l])}${eb("Invoices")}${invoicesTable(is)}`,foc==="comm")+
 sec("act","Actual: "+D$(l.act),tx.length,`${txTable(tx,20)}<p class="small ${txSum===l.act?"muted":"bud-bad"}">${txSum===l.act?`Transactions add up to the ${D$(l.act)} actual on this line.`:"Transactions do not add up to the line actual."}</p>`,foc==="act")+
 sec("fcst","Forecast: "+D$(l.fcst),null,`${tbl(["Month","Actual or forecast","Basis"],ms.map(m=>`<tr><td>${dn(`<b>${m.m}</b>`,"month:"+m.m,"bd-row")} ${m.a?pill("Actual","mute"):pill("Forecast","info")}</td><td class="tabular">${dn(D$(m.v),"month:"+m.m)}</td><td class="small muted">${m.a?"Closed postings":"Project schedule shape, scaled to the line forecast"}</td></tr>`).concat([`<tr class="bd-tot"><td><b>Total</b></td><td class="tabular"><b>${D$(msum)}</b></td><td></td></tr>`]),480)}<p class="small muted">${E(l.fix||"Forecast equals the approved amount; no action needed.")}</p><div class="row">${go2("Open the Forecast tab","bud_over","budv",3)}${aiChip({model:"Forecast Agent",conf:.84,title:"How this forecast is built",src:["Actuals through Sep 30","Open commitments","Project schedule (IMS)"],guards:["Cannot post journal entries","Reserve requests need human approval"]})}</div>`,foc==="fcst")+
 sec("res","Reserve and transfers",es.length+xs.length,`${ledTable(es)}`,foc==="res")+
 sec("tbm","Cost transparency (TBM)",null,tbmBlock([l.cat],[l]),false)+
 foot(`<button type="button" class="btn primary" data-bud-edit="${id}">Edit line</button>`+dn("Open the project","proj:"+l.p,"btn")+`<button type="button" class="btn" data-bud-refc>Reforecast</button>`)};

V.txn=function(id){const k=K(),line=id.split("-").slice(1,3).join("-"),l=k.LN(line);const t=l&&txns(l).find(x=>x.id===id);if(!t)return head("","Unknown transaction");
 const g=GLA[l.cat],v=k.VID(t.v),po=t.po&&k.B().po.find(p=>p.id===t.po),c=t.ct&&k.CID(t.ct),is=c?invoicesOf([c]):[],dp=k.DEPTS.find(d=>d[0]===l.dept);
 return head(pill("Posted","good")+" "+pill(t.type,"mute"),`${E(t.id)}: <span class="num bd-big">${D$(t.amt)}</span>`,E(t.memo))+
 `<dl class="kv"><dt>Posting date</dt><dd>${k.dfmt(t.d)}</dd><dt>Budget line</dt><dd>${dn(`<b>${E(l.id)}</b> ${E(l.n)}`,"line:"+l.id)}</dd><dt>Project</dt><dd>${dn(E(k.PJ(l.p).short),"proj:"+l.p)}</dd><dt>Ledger account</dt><dd>${g[0]} ${E(g[1])}</dd><dt>Cost center</dt><dd>${E(dp[2])} ${E(dp[1])}</dd><dt>Vendor</dt><dd>${v?dn(E(v.n),"vend:"+v.id):"<span class='muted'>None, internal posting</span>"}</dd><dt>Purchase order</dt><dd>${po?dn(`<b>${po.id}</b> ${E(po.d)}`,"po:"+po.id):"<span class='muted'>No purchase order</span>"}</dd><dt>Contract</dt><dd>${c?dn(`<b>${c.id}</b> ${E(c.n)}`,"ct:"+c.id):"<span class='muted'>None</span>"}</dd><dt>Month</dt><dd>${dn(k.FM[+t.d.slice(5,7)>=7?+t.d.slice(5,7)-7:+t.d.slice(5,7)+5],"month:"+k.FM[+t.d.slice(5,7)>=7?+t.d.slice(5,7)-7:+t.d.slice(5,7)+5])}</dd></dl>`+
 (is.length?eb("Invoices on the contract")+invoicesTable(is):"")+
 eb("Other postings on this line")+txTable(txns(l).filter(x=>x.id!==id),8)+
 foot(dn("Open the line","line:"+l.id,"btn"))};

V.po=function(id){const k=K(),p=k.B().po.find(x=>x.id===id);if(!p)return head("","Unknown purchase order");const v=k.VID(p.v),c=k.CID(p.ct),l=k.LN(p.line),m=k.m3(p),is=c?invoicesOf([c]):[],tx=l?txns(l).filter(t=>t.po===id):[];
 const mx=Math.max(p.ord,p.rec,p.inv,1);
 return head(pill(m[0],m[1])+" "+pill(p.st,"mute"),`${E(p.id)} · ${E(p.d)}`,`${dn(E(v.n),"vend:"+p.v)} under ${dn(E(c.id+" "+c.n),"ct:"+c.id)}. Raised by ${pchip(p.cBy)} on ${k.dfmt(p.date)}.`)+
 `<div class="ledger" style="margin:12px 0">${[["Ordered",p.ord,"--p4"],["Received and accepted",p.rec,"--s3"],["Invoiced",p.inv,"--w1"],["Paid",p.paid,"--u3"]].map(x=>`<div class="lrow"><div class="lbl">${x[0]}</div>${k.meter([{w:x[1]/mx*100,c:`var(${x[2]})`,l:x[0]}])}<div class="amtn num" data-role="metric">${D$(x[1])}</div></div>`).join("")}</div>`+
 `<div class="formula" data-role="metric">Three-way match: ordered ${D$(p.ord)}, received ${D$(p.rec)}, invoiced ${D$(p.inv)} (2% tolerance) = ${E(m[0])}</div>`+
 `<dl class="kv"><dt>Budget line</dt><dd>${l?dn(`<b>${E(l.id)}</b> ${E(l.n)}`,"line:"+l.id):`<span class="muted">${E(p.line)}, a run budget outside the project lines</span>`}</dd><dt>Created by</dt><dd>${pchip(p.cBy)}</dd><dt>Approved by</dt><dd>${p.aBy?E(p.aBy):"<span class='muted'>Waiting for approval</span>"}</dd><dt>Received by</dt><dd>${p.rBy?E(p.rBy):"<span class='muted'>Nothing received</span>"}</dd></dl>`+
 eb("Payments posted against this order")+txTable(tx,10)+eb("Invoices on the contract")+invoicesTable(is)+
 foot(dn("Open the contract","ct:"+p.ct,"btn")+dn("Open the vendor","vend:"+p.v,"btn")+go2("Show purchase orders","bud_ven","budx",4))};

V.inv=function(id){const k=K(),i=INVOICES.find(x=>x.id===id);if(!i)return head("","Unknown invoice");const c=k.B().con.find(x=>x.inv&&x.inv.includes(id)),v=k.B().vend.find(x=>x.n===i.vendor),l=c&&c.line&&k.LN(c.line);
 return head(pill("Advisor: "+i.rec,i.rec==="approve"?"good":i.rec==="hold"?"warn":"bad"),`${E(i.id)}: <span class="num bd-big">${D$(i.amt)}</span>`,E(i.story))+
 `<dl class="kv"><dt>Vendor</dt><dd>${v?dn(E(v.n),"vend:"+v.id):E(i.vendor)}</dd><dt>Contract</dt><dd>${c?dn(`<b>${c.id}</b> ${E(c.n)}`,"ct:"+c.id):E(i.contract)}</dd><dt>Due</dt><dd>${E(i.due)}</dd><dt>Budget line</dt><dd>${l?dn(`<b>${E(l.id)}</b> ${E(l.n)}`,"line:"+l.id):"<span class='muted'>A run budget</span>"}</dd></dl>`+
 eb("Checks")+tbl(["Check","Result","Detail"],i.checks.map(x=>`<tr><td><b>${E(x[0])}</b></td><td>${pill(x[1]==="good"?"Pass":x[1]==="bad"?"Fail":"Watch",x[1])}</td><td class="small" style="white-space:normal">${E(x[2])}</td></tr>`),480)+
 foot(`<button type="button" class="btn primary" data-go="inv:${i.id}">Open in Invoice approval</button>`+(c?dn("Open the contract","ct:"+c.id,"btn"):""))};

V.led=function(id,foc){const k=K(),e=k.B().led.find(x=>x.id===id);if(!e)return head("","Unknown entry");const l=e.line&&k.LN(e.line),r=e.t==="draw"?k.whoApproves(-e.amt,"Reserve release",e.req,{proj:e.p}):null,can=e.st==="Pending"&&e.t==="draw"&&k.ownerCan(-e.amt,"Reserve release",e.req,{proj:e.p});
 let run=0;k.B().led.slice(0,k.B().led.indexOf(e)+1).forEach(x=>{if(x.st==="Approved")run+=x.amt});
 return head(pill(e.st,e.st==="Approved"?"good":e.st==="Pending"?"warn":"bad")+" "+pill(e.t==="open"?"Opening balance":"Reserve draw","mute"),`${E(e.id)}: <span class="num bd-big">${e.amt<0?"−":"+"}${D$(Math.abs(e.amt))}</span>`,E(e.why))+
 `<dl class="kv"><dt>Date</dt><dd>${k.dfmt(e.d)}</dd><dt>Requested by</dt><dd>${pchip(e.req)}${e.ai?" "+pill("Drafted by an agent","info"):""}</dd><dt>Project</dt><dd>${e.p?dn(E(k.PJ(e.p).short),"proj:"+e.p):"Portfolio"}</dd><dt>Budget line</dt><dd>${l?dn(`<b>${E(l.id)}</b> ${E(l.n)}`,"line:"+l.id):"<span class='muted'>None, whole portfolio</span>"}</dd><dt>Approver</dt><dd>${E(e.apr)}</dd><dt>Balance after this entry</dt><dd data-role="metric">${e.st==="Approved"?dn(D$(run),"m:bal"):"Not posted"}</dd></dl>`+
 (r?eb("Who must approve")+K().chainHTML(r):"")+
 (can?`<div class="row" style="margin-top:12px"><button class="btn primary" data-bud-led="${e.id}:ok">Approve</button><button class="btn" data-bud-led="${e.id}:no">Reject</button></div>`:"")+
 eb("Neighbouring entries")+ledTable(k.B().led.filter(x=>x.id!==id&&(x.line===e.line||x.p===e.p)).slice(0,6))+
 foot(dn("Reserve balance","m:bal","btn")+go2("Open Reserve and approvals","bud_over","budv",4))};

V.xf=function(id){const k=K(),x=k.B().xf.find(y=>y.id===id);if(!x)return head("","Unknown transfer");const l=k.LN(x.line);
 return head(pill(x.st,x.st==="Approved"?"good":x.st==="Pending"?"warn":"bad"),`${E(x.id)}: <span class="num bd-big">${D$(x.amt)}</span>`,E(x.why))+
 `<dl class="kv"><dt>From</dt><dd>${l?dn(`<b>${E(l.id)}</b> ${E(l.n)}`,"line:"+l.id):E(x.line)}</dd><dt>To project</dt><dd>${dn(E(k.PJ(x.to).short),"proj:"+x.to)}</dd><dt>Approver</dt><dd>${E(x.apr)}</dd><dt>Date</dt><dd>${k.dfmt(x.d)}</dd></dl>`+foot(go2("Open Reserve and approvals","bud_over","budv",4))};

V.tier=function(id){const k=K(),B=k.B(),i=B.doa.findIndex(t=>t.id===id);if(i<0)return head("","Unknown tier");const t=B.doa[i],lo=i?B.doa[i-1].max:0;
 const inT=a=>a>lo&&a<=t.max||(i===0&&a<=t.max);const es=B.led.filter(e=>e.t==="draw"&&inT(-e.amt)),ps=B.po.filter(p=>inT(p.ord)),ls=B.lines.filter(l=>inT(l.appr));
 return head(pill("Tier "+t.id,"info"),`${E(t.role)}: ${i===0?"up to":"above "+D$(lo)+" up to"} ${t.max===Infinity?"any amount":D$(t.max)}`,"Everything in this band follows the delegation of authority.")+
 eb("Reserve draws in this tier")+ledTable(es)+eb("Purchase orders in this tier")+posTable(ps)+eb("Budget lines approved in this tier")+(ls.length?linesTable(ls,{foc:"appr",proj:true}):none("No lines are approved in this band."))+
 foot(go2("Open Delegation of authority","bud_doa","budd",0))};

V.month=function(id,foc){const k=K(),i=k.FM.indexOf(id);if(i<0)return head("","Unknown month");const B=k.B(),a=i<3,b=k.burn(),kk=k.T(B.lines).appr/2910000;
 const rows=B.lines.map(l=>{const m=lineMonths(l)[i].v,plan=l.appr*k.PLANM[i]/k.sum(k.PLANM,x=>x);return {l,m,plan}}).sort((x,y)=>y.m-x.m);
 const tot=k.sum(rows,r=>r.m),plan=k.sum(rows,r=>r.plan),tx=a?allTx(B.lines).filter(t=>+t.d.slice(5,7)===[7,8,9][i]):[];
 const prev=i>0?k.FM[i-1]:null,next=i<11?k.FM[i+1]:null;
 return head(pill(a?"Actual, closed":"Forecast",a?"mute":"info"),`${id} ${i<6?"2026":"2027"}: <span class="num bd-big">${D$(tot)}</span>`,`${a?"Posted spend":"Forecast spend"} against a phasing plan of ${D$(plan)}: ${k.sgn(tot-plan)}. Cumulative to date ${D$(a?b.act[i]:b.fc[i-2])}.`)+
 `<div class="row">${prev?dn("← "+prev,"month:"+prev,"btn quiet"):""}${next?dn(next+" →","month:"+next,"btn quiet"):""}</div>`+
 eb("Where the month's spend comes from")+tbl(["Budget line","Plan","Actual or forecast","Difference"],rows.filter(r=>r.m>0).map(r=>`<tr><td>${dn(`<b>${E(r.l.id)}</b><span class="sub">${E(r.l.n)}</span>`,"line:"+r.l.id,"bd-row")}</td><td class="tabular ${foc==="plan"?"bd-foc":""}">${D$(r.plan)}</td><td class="tabular">${dn(D$(r.m),"line:"+r.l.id+":"+(a?"act":"fcst"))}</td><td>${varPill(r.m-r.plan)}</td></tr>`).concat([`<tr class="bd-tot"><td><b>Total</b></td><td class="tabular"><b>${D$(plan)}</b></td><td class="tabular"><b>${D$(tot)}</b></td><td>${varPill(tot-plan)}</td></tr>`]),600)+
 (a?eb("Transactions posted in "+id)+txTable(tx.sort((x,y)=>y.amt-x.amt),14):"")+
 foot(go2("Open the Forecast tab","bud_over","budv",3))};

/* ---------- open, show, navigation ---------- */
BD.open=function(kind,id,o){o=o||{};if(!V[kind]&&kind!=="ct"&&kind!=="vend")return;const foc=o.foc||"";
 if(o.reset||!document.getElementById("drawer")||!document.getElementById("drawer").classList.contains("bd-on")||!document.getElementById("drawer").matches(":popover-open"))BD.stack=[];
 const top=BD.stack[BD.stack.length-1];if(top&&top.kind===kind&&top.id===id)top.foc=foc;else BD.stack.push({kind,id,foc});BD.show()};
BD.show=function(){const it=BD.stack[BD.stack.length-1];if(!it)return;const k=K();let h="";
 if(it.kind==="ct"){k.contractDrawer(it.id);return}if(it.kind==="vend"){k.vendorDrawer(it.id);return}
 try{h=V[it.kind](it.id,it.foc)}catch(e){console.error("budget drill failed",it,e);h=head("","This view could not be built")}
 openDrawer(`<div class="bd-wrap" data-bd-view="${E(it.kind)}">${crumb()}${h}</div>`);const d=document.getElementById("drawer");if(d){d.classList.add("bd-on");d.scrollTop=0}
 if(it.foc){const s=document.getElementById("bd-sec-"+it.foc);if(s){s.open=true;setTimeout(()=>{try{s.scrollIntoView({block:"start",behavior:"smooth"})}catch(e){}},60)}}};
BD.back=function(){if(BD.stack.length>1){BD.stack.pop();BD.show()}};
BD.to=function(i){if(i<0){BD.stack=[];closeDrawer();return}BD.stack=BD.stack.slice(0,i+1);BD.show()};
function parse(s){const p=String(s).split(":");const kind=p[0];let id=p.slice(1).join(":"),foc="";const FOCS=["appr","comm","act","fcst","res","plan","bal","apr","var","vend"];
 const q=id.split(":");if(q.length>1&&FOCS.includes(q[q.length-1])){foc=q.pop();id=q.join(":")}
 if(kind==="m"){return {kind,id:id,foc}}return {kind,id,foc}}
document.addEventListener("click",e=>{
 let t=e.target.closest&&e.target.closest("[data-bd]");
 if(t){const p=parse(t.getAttribute("data-bd"));e.preventDefault();e.stopPropagation();BD.open(p.kind,p.id,{foc:p.foc,reset:!t.closest("#drawer")||!(document.getElementById("drawer")||{classList:{contains:()=>false}}).classList.contains("bd-on")});return}
 t=e.target.closest("[data-bd-crumb]");if(t){BD.to(+t.getAttribute("data-bd-crumb"));return}
 t=e.target.closest("[data-bd-back]");if(t){BD.back();return}
 t=e.target.closest("[data-bd-go]");if(t){const a=t.getAttribute("data-bd-go").split("|");if(a[1])S.v[a[1]]=+a[2];BD.stack=[];go(a[0]);return}
 t=e.target.closest("[data-bud-led]");if(t&&t.closest("#drawer .bd-wrap")){setTimeout(()=>{if(document.querySelector("#drawer .bd-wrap"))BD.show()},120)}
},true);
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target;if(t&&t.matches&&t.matches('[data-bd][role="button"]')&&t.tagName!=="BUTTON"){e.preventDefault();t.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}))}});
const dr=document.getElementById("drawer");if(dr)dr.addEventListener("toggle",e=>{if(e.newState==="closed"){BD.stack=[];dr.classList.remove("bd-on")}});
document.addEventListener("toggle",e=>{if(e.target&&e.target.id==="drawer"&&e.newState==="closed"){BD.stack=[];e.target.classList.remove("bd-on")}},true);
/* the lens "What is this?" and chat can open drills too */
window.openBudgetDrill=(spec)=>{const p=parse(spec);BD.open(p.kind,p.id,{foc:p.foc,reset:true})};
})();
