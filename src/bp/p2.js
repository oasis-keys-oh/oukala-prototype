/* ---- financial model ---- */
const cpCost=r=>r[1]*r[2]*r[3];
const laborPlan=p=>sum(B().cp[p],cpCost);
const runTot=p=>{const r=B().run[p];return r.cld+r.lic+r.sup+r.ven};
const PS=p=>p==="all"?PROJ.map(x=>x.id):[p];
const costFY=(p,y,sc)=>{const m=SCEN[sc||B().scen][2];return sum(PS(p),q=>y===0?T(PL(q)).fcst:runTot(q)*Math.pow(1+B().grow/100,y-1))*m};
function roi(p,rate,sc){rate=rate==null?B().rate:rate;const rows=[];let cum=0,pb=null;
 for(let y=0;y<5;y++){const cost=costFY(p,y,sc),ben=sum(PS(p),q=>benFY(q,y,sc)),net=ben-cost,df=1/Math.pow(1+rate/100,y),prev=cum;cum+=net;rows.push({y,fy:"FY"+(27+y),cost,ben,net,df,pv:net*df,cum});if(pb==null&&cum>=0&&net>0)pb=y+(y===0?0:-prev/net)}
 const sc2=sum(rows,r=>r.cost),sb=sum(rows,r=>r.ben);return {rows,npv:sum(rows,r=>r.pv),sc:sc2,sb,roi:(sb-sc2)/sc2,bcr:sb/sc2,pb}}
function goLive(p){const P=plan("now"),ts=TASKS.filter(t=>t.p===p),t=ts[ts.length-1],r=P.R[t.id],w=t.ms?r.es:r.ef,d=dateOf(w);return {date:d,mi:(d.getUTCFullYear()-2026)*12+d.getUTCMonth()-6}}
function amort(p,f){const lines=PS(p).flatMap(q=>PL(q)),hw=sum(lines.filter(l=>l.cat==="Hardware"),capOf),sw=sum(lines.filter(l=>l.cat!=="Hardware"),capOf),L=B().life;
 return sum(PS(p),q=>{const ls=PL(q),h=sum(ls.filter(l=>l.cat==="Hardware"),capOf),s=sum(ls.filter(l=>l.cat!=="Hardware"),capOf),g=goLive(q).mi+1;
  const mon=life=>Math.max(0,Math.min(f*12+12,g+life*12)-Math.max(f*12,g));return s/(L*12)*mon(L)+h/48*mon(4)})}
function allocPct(p){const r=B().alloc[p],u=USE[p],keys=Object.keys(u);let w;
 if(r.driver==="usage")w=u;else if(r.driver==="headcount"){w={};keys.forEach(k=>w[k]=DEPTS.find(d=>d[0]===k)[3])}else if(r.driver==="equal"){w={};keys.forEach(k=>w[k]=1)}else w=r.fixed||u;
 const s=sum(Object.keys(w),k=>+w[k])||1,o={};Object.keys(w).forEach(k=>o[k]=w[k]/s*100);return o}
/* ---- metrics, computed from the same data the screens show ---- */
Object.assign(METRICS,{
 m_budvar:{n:"Forecast variance to approved budget",f:"(Forecast at completion − Approved budget) ÷ Approved budget",u:"%",cur:5.6,tgt:3,badAt:8,dir:"min",max:15,tr:[.8,1.4,2.2,3.1,3.9,4.6,5.2,5.6],owner:"Finance",use:["Budgets overall","Financial model"],rem:{kind:"kb",ref:"KB-114",title:"Reforecast a budget line",agent:"Forecast Agent",auto:false,state:"queued",prog:"Drafted two reserve requests worth $93,000; waiting for approval"}},
 m_commit:{n:"Budget lines over commitment",f:"Count of budget lines where Committed > Approved",u:"",cur:1,tgt:0,badAt:2,dir:"min",max:5,tr:[0,0,0,0,0,0,1,1],owner:"Finance",use:["Budgets overall","Vendors and contracts"],rem:{kind:"sop",ref:"SOP-122",title:"Resolve an over-committed line",agent:"Forecast Agent",auto:false,state:"idle",prog:"Checks the open change orders and drafts a reserve request"}},
 m_reserve:{n:"Reserve coverage",f:"Management reserve balance ÷ Forecast overrun not yet funded by an approved draw",u:"%",cur:113,tgt:120,badAt:100,dir:"max",max:200,tr:[190,170,160,150,140,130,120,113],owner:"CFO",use:["Budgets overall","Delegation of authority"],rem:{kind:"agent",ref:"Forecast Agent",title:"Draft reserve requests",agent:"Forecast Agent",auto:false,state:"idle",prog:"Drafts the reserve release with evidence for the approver"}},
 m_capex:{n:"Capital plan used",f:"Forecast CapEx under ASC 350-40 ÷ Board capital envelope",u:"%",cur:96,tgt:100,badAt:105,dir:"min",max:130,tr:[70,78,84,89,92,94,95,96],owner:"Controller",use:["Budgets overall","Financial model"],rem:{kind:"kb",ref:"KB-131",title:"Document capitalization by project stage",agent:"Forecast Agent",auto:false,state:"idle",prog:"Re-runs the capitalization rules when a project changes stage"}},
 m_roi:{n:"Five-year portfolio return on investment",f:"(Total benefits − Total costs, FY27 to FY31) ÷ Total costs",u:"%",cur:40,tgt:30,badAt:10,dir:"max",max:120,tr:[52,50,47,46,44,43,41,40],owner:"Portfolio office",use:["Financial model","Benefits realization"],rem:{kind:"sop",ref:"SOP-301",title:"Re-test benefit assumptions",agent:"Portfolio Agent",auto:false,state:"idle",prog:"Compares benefit drivers with measurements and flags the weakest"}},
 m_benefit:{n:"Benefits realized to date",f:"Benefits measured to date ÷ Benefits planned to date",u:"%",cur:85,tgt:90,badAt:75,dir:"max",max:120,tr:[100,98,95,92,90,88,86,85],owner:"Benefit owners",use:["Benefits realization"],rem:{kind:"agent",ref:"Benefits Agent",title:"Chase missing measurements",agent:"Benefits Agent",auto:true,state:"running",prog:"Asked 3 owners for the Q1 measurement"}},
 m_renew:{n:"Renewals needing a decision in 90 days",f:"Contracts with a notice deadline in the next 90 days and no recorded decision",u:"",cur:5,tgt:2,badAt:6,dir:"min",max:10,tr:[1,1,2,2,3,3,4,5],owner:"Vendor management",use:["Vendors and contracts"],rem:{kind:"agent",ref:"Contract Agent",title:"Draft renewal recommendations",agent:"Contract Agent",auto:true,state:"running",prog:"Drafted 5 recommendations with evidence"}},
 m_match:{n:"Three-way match rate",f:"Purchase orders where PO, receipt and invoice agree within 2% ÷ Purchase orders with activity",u:"%",cur:82,tgt:95,badAt:85,dir:"max",max:100,tr:[96,95,93,92,90,88,85,82],owner:"Accounts payable",use:["Vendors and contracts","Invoice approval"],rem:{kind:"sop",ref:"SOP-114",title:"Hold invoices that are ahead of receipt",agent:"Invoice Advisor",auto:true,state:"running",prog:"Holding INV-20433 and INV-20440"}}});
function syncM(){const M=METRICS,t=T(B().lines);
 M.m_budvar.cur=+((t.fcst-t.appr)/t.appr*100).toFixed(1);
 M.m_commit.cur=B().lines.filter(l=>l.comm>l.appr).length;
 const un=Math.max(1,netOver()-drawn());M.m_reserve.cur=Math.round(resBal()/un*100);
 M.m_capex.cur=Math.round(capPlanUsed());
 M.m_roi.cur=Math.round(roi("all",8,"base").roi*100);
 const bt=benToDate();M.m_benefit.cur=bt.plan?Math.round(bt.real/bt.plan*100):100;
 M.m_renew.cur=undecided().length;
 const act=B().po.filter(p=>p.inv||p.rec),ok=act.filter(p=>m3(p)[1]==="good").length;M.m_match.cur=act.length?Math.round(ok/act.length*100):100;
 M.m_roi.f=`(Total benefits ${C$(roi("all",8,"base").sb)} − Total costs ${C$(roi("all",8,"base").sc)}) ÷ Total costs, FY27 to FY31, base case`;
 M.m_budvar.f=`(Forecast ${C$(t.fcst)} − Approved ${C$(t.appr)}) ÷ Approved ${C$(t.appr)}`;
 M.m_capex.f=`Forecast CapEx ${C$(capTot(B().lines))} under ASC 350-40 ÷ Board capital envelope ${C$(B().envelope)}`;
 [["m_budvar",0],["m_commit",0],["m_reserve",0],["m_capex",0],["m_roi",0],["m_benefit",0],["m_renew",0],["m_match",0]].forEach(([k])=>{const m=M[k];m.tr[m.tr.length-1]=m.cur})}
