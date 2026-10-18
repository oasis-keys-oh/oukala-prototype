
/* ---------- interoperability: what an invoice decision updates ---------- */
const IP_CONS=[["budget","Budget (PO paid, contract milestone)"],["actuals","Budget line actuals"],["forecast","Forecast to complete"],["reserve","Reserve check"],["project","Project cost to date"],["vendor","Vendor record"],["metrics","Metrics"],["audit","Audit trail"],["notify","Notification"],["inbox","Inbox (item leaves the queue)"]];
const IP_EXP=[["bud_ven","Vendors and contracts"],["bud_over","Reserve and overruns"],["fin_budget","Budget lines and actuals"],["bud_model","Budget model and forecast"],["ppm_proj","Project cost"],["exe_dash","Executive metrics"],["adm_audit","Audit trail"],["chat_home","Notifications"],["inbox","Inbox"]];
function expectedFlows(){const fl=G(()=>MODMAP.flows,[]);return IP_EXP.map(e=>({id:e[0],name:e[1],present:fl.some(f=>f.from==="inv"&&f.to===e[0])}))}
function snapIP(){const b=S.bud||{};const j=x=>JSON.stringify(x);
 return {budget:j([b.po,b.con]),actuals:j((b.lines||[]).map(l=>l.act)),forecast:j((b.lines||[]).map(l=>l.fcst-l.act)),reserve:j([b.led,Z.ledger&&Object.values(Z.ledger).map(x=>x.reserve)]),project:j(PROJ.map(p=>p.paid)),vendor:j(b.vend),
  metrics:j(Object.keys(METRICS).map(k=>METRICS[k].cur)),audit:AUDIT.length,notify:(Z.notes||[]).length,inbox:G(()=>INBOX.items().filter(i=>i.src==="inv"&&i.sid==="INV-20433").length,-1)}}
function restoreIn(t,s){if(Array.isArray(t)&&Array.isArray(s)){t.length=s.length;s.forEach((v,i)=>{if(v&&typeof v==="object"&&t[i]&&typeof t[i]==="object")restoreIn(t[i],v);else t[i]=v});return}
 if(t&&s&&typeof t==="object"&&typeof s==="object"){Object.keys(t).forEach(k=>{if(!(k in s))delete t[k]});Object.keys(s).forEach(k=>{const v=s[k];if(v&&typeof v==="object"&&t[k]&&typeof t[k]==="object")restoreIn(t[k],v);else t[k]=v})}}
let _ipBusy=false;
function runIP(force){if(Z.ip&&!force)return Z.ip;if(_ipBusy)return Z.ip||{consumers:[],expected:[],at:""};_ipBusy=true;
 const id="INV-20433";const inv=INVOICES.find(i=>i.id===id);const res={consumers:IP_CONS.map(c=>({id:c[0],name:c[1],updated:false,how:"No change after the decision"})),expected:[],at:TODAY,invoice:id};
 try{
  const sv=JSON.parse(JSON.stringify({bud:S.bud,proj:PROJ,met:Object.keys(METRICS).map(k=>[k,METRICS[k].cur,METRICS[k].tr&&METRICS[k].tr.slice()]),dec:S.dec,inv:S.inv,led:Z.ledger,notes:Z.notes,ev:Z.events}));const alen=AUDIT.length;
  const before=snapIP();S.inv=id;const rr=window.render;window.render=()=>{};
  const b=document.createElement("button");b.setAttribute("data-decide","Approved");b.style.display="none";document.body.appendChild(b);b.click();b.remove();window.render=rr;
  const after=snapIP();
  res.consumers.forEach(c=>{if(String(before[c.id])!==String(after[c.id])){c.updated=true;c.how="Changed after the decision"}});
  /* restore in place */
  restoreIn(S.bud,sv.bud);restoreIn(PROJ,sv.proj);sv.met.forEach(([k,c,tr])=>{if(METRICS[k]){METRICS[k].cur=c;if(tr)METRICS[k].tr=tr}});
  Object.keys(S.dec).forEach(k=>delete S.dec[k]);Object.assign(S.dec,sv.dec);S.inv=sv.inv;AUDIT.splice(0,AUDIT.length-alen);
  Z.ledger=sv.led||{};Z.notes=sv.notes||[];Z.events=sv.ev||[];_bust();
 }catch(e){res.err=String(e&&e.message||e)}
 res.expected=expectedFlows();
 Z.ip=res;_ipBusy=false;return res}
function interopMatrix(){const r=runIP();r.expected=expectedFlows();return r}
function _bust(){_uni=null;_actors=null;_uvV="";Z.dlRev=(Z.dlRev||0)+1}

/* ---------- event layer: invoice.decided fans out to budget, actuals, forecast, reserve, project, vendor, notify ---------- */
const POST=[];
function emitInvoice(id,dec){const inv=INVOICES.find(i=>i.id===id);if(!inv||!S.bud)return;undoInvoice(id,true);
 const eff=[],un={};const amt=inv.amt;const con=S.bud.con.find(c=>arr(c.inv).includes(id));const po=con&&S.bud.po.find(p=>p.ct===con.id&&p.st==="Open")||null;const line=po&&S.bud.lines.find(l=>l.id===po.line)||null;
 const pj=line?PROJ.find(p=>p.id===line.p):(con&&PROJ.find(p=>p.id===con.proj))||null;const vend=S.bud.vend.find(v=>lc(v.n)===lc(inv.vendor));
 const approved=/approve/i.test(dec),rejected=/reject/i.test(dec);
 if(approved){
  if(po){po.paid+=amt;un.po={id:po.id,paid:amt};eff.push(["budget","PO "+po.id+" paid "+money(po.paid)+" of "+money(po.ord)])}
  if(con){const m=con.ms.find(x=>String(x[0]).indexOf(id)>=0);if(m){un.ms={con:con.id,name:m[0],prev:m[3]};m[3]="Approved";eff.push(["budget","Contract "+con.id+" milestone marked Approved"])}}
  if(line){line.act+=amt;un.line={id:line.id,act:amt};eff.push(["actuals",line.id+" actual "+money(line.act)]);eff.push(["forecast","Forecast to complete on "+line.id+" is "+money(line.fcst-line.act)])}
  if(pj){pj.paid+=amt/1000;un.proj={id:pj.id,paid:amt/1000};eff.push(["project",pj.short+" paid to date "+K$(pj.paid*1000)])}
  const over=line&&line.act>line.fcst;Z.ledger[id]=Z.ledger[id]||{};un.reserve=1;
  eff.push(["reserve",over?"Line "+line.id+" is "+money(line.act-line.fcst)+" over forecast: reserve draw review opened":"No draw needed"+(line?" ("+money(line.fcst-line.act)+" left on "+line.id+")":" (funded from the run budget)")])}
 else if(rejected&&po){po.inv=Math.max(0,po.inv-amt);un.po={id:po.id,inv:-amt};eff.push(["budget","PO "+po.id+" invoiced total reduced by the disputed "+money(amt)])}
 else eff.push(["budget","No money moves while the invoice is on hold"]);
 if(vend){un.vend={id:vend.id,prev:vend.lastDecision||""};vend.lastDecision=dec+" "+id+" "+TODAY;eff.push(["vendor",vend.n+": last decision recorded"])}
 eff.push(["notify","Notice to "+(pj?pj.owner:"the invoice owner")+" and Accounts payable"]);
 Z.notes.unshift({id:"N"+(Z.notes.length+1),ev:"invoice.decided",t:inv.id+" "+dec.toLowerCase()+": "+inv.vendor+" "+money(amt),to:[pj?pj.owner:"Avery Chen","Avery Chen"],at:TODAY,rec:id});
 Z.ledger[id]=Object.assign(Z.ledger[id]||{},{dec,at:TODAY,eff,un,reserve:eff.find(e=>e[0]==="reserve")?eff.find(e=>e[0]==="reserve")[1]:""});
 Z.events.unshift({ev:"invoice.decided",rec:id,dec,n:eff.length,at:TODAY});
 G(()=>_origAudit("Downstream effects of "+id,eff.map(e=>e[0]).join(", ")));
 G(()=>{if(METRICS.m_zl_fanout){METRICS.m_zl_fanout.cur=Math.min(100,Math.round(100*Object.keys(Z.ledger).length/Math.max(1,Object.keys(S.dec).length||1)))}})}
function undoInvoice(id,silent){const L=Z.ledger[id];if(!L||!L.un)return;const u=L.un;G(()=>{
  if(u.po){const p=S.bud.po.find(x=>x.id===u.po.id);if(p){if(u.po.paid)p.paid-=u.po.paid;if(u.po.inv)p.inv-=u.po.inv}}
  if(u.ms){const c=S.bud.con.find(x=>x.id===u.ms.con);const m=c&&c.ms.find(x=>x[0]===u.ms.name);if(m)m[3]=u.ms.prev}
  if(u.line){const l=S.bud.lines.find(x=>x.id===u.line.id);if(l)l.act-=u.line.act}
  if(u.proj){const p=PROJ.find(x=>x.id===u.proj.id);if(p)p.paid-=u.proj.paid}
  if(u.vend){const v=S.bud.vend.find(x=>x.id===u.vend.id);if(v)v.lastDecision=u.vend.prev}});
 delete Z.ledger[id];Z.notes=Z.notes.filter(n=>n.rec!==id);if(!silent)G(()=>_origAudit("Reversed downstream effects of "+id,"Undo"))}
let _origAudit=window.audit;
function hookAudit(){if(NOFIX||window.audit.__zl)return;_origAudit=window.audit;
 const w=function(a,d){const r=_origAudit.apply(this,arguments);try{const m=/^(approved|rejected|on hold) invoice$/i.exec(a||"");if(m){const id=String(d||"").split(" ")[0];if(/^INV-/.test(id))emitInvoice(id,m[1])}
  else if(/^undid decision$/i.test(a||"")&&/^INV-/.test(String(d||"")))undoInvoice(String(d))}catch(e){console.error("zlink event",e)}return r};w.__zl=1;window.audit=w}
