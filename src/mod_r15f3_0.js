/* ===== mod_r15f3_0: shared helpers for Round 15 Agent F3 modules (time and procure-to-pay, reports and semantic layer, identity lifecycle, mobile).
   Exposes window.R15F3 {G,E,wire,emit,regEvent,actor,iso,money,h1,svgBars,svgLine,csv,download,owners}. Loaded first (alphabetical); everything else is called lazily. */
(function(){
const W=window;const R=W.R15F3=W.R15F3||{};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
R.G=G;
R.E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const E=R.E;
R.PERSONA_USER={exec:"Casey Rowan",fin:"Avery Chen",pm:"Priya Shah",ops:"Tom Becker"};
R.owners={time:["Maya Ortiz","Priya Shah"],p2p:["Avery Chen","Sam Patel"],sem:["Jordan Lee","Maya Ortiz"],rpt:["Jordan Lee","Maya Ortiz"],iam:["Rina Okafor","Jordan Lee"],mob:["Tom Becker","Sam Patel"]};
R.iso=d=>new Date(d).toISOString().slice(0,10);
R.money=n=>(n<0?"-":"")+"$"+Math.abs(Math.round(n)).toLocaleString("en-US");
R.k=n=>Math.abs(n)>=1e6?(n/1e6).toFixed(2).replace(/0$/,"")+"M":Math.abs(n)>=1e3?Math.round(n/1e3)+"K":String(Math.round(n));
R.actor=()=>{const o=G(()=>S.r15i&&S.r15i.actAs,null);if(o)return o;return R.PERSONA_USER[G(()=>S.persona,"exec")]||"Casey Rowan"};
R.emit=(id,payload)=>G(()=>{const e=W.EVENTS;if(e&&typeof e.emit==="function")return e.emit(id,payload||{},{source:"r15f3",actor:R.actor()})},null);
R._rg=R._rg||{};R.regEvent=def=>G(()=>{const e=W.EVENTS;if(R._rg[def.id])return true;if(e&&typeof e.register==="function"){e.register(def);R._rg[def.id]=1;return true}return false},false);
R.on=(id,fn)=>G(()=>{const e=W.EVENTS;if(e&&typeof e.on==="function"){e.on(id,fn);return true}return false},false);
R.csv=(head,rows)=>[head].concat(rows).map(r=>r.map(c=>'"'+String(c==null?"":c).replace(/"/g,'""')+'"').join(",")).join("\n");
R.download=(name,text,type)=>{try{const b=new Blob([text],{type:type||"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);return true}catch(e){return false}};
/* bar chart (SVG, token colors). data: [[label,value,color?]] */
R.svgBars=(data,o)=>{o=o||{};const W_=o.w||520,rowH=o.rowH||26,lw=o.lw||130,pad=8,max=Math.max(1,...data.map(d=>Math.abs(d[1])));const H=data.length*rowH+pad*2;const fmt=o.fmt||R.k;
 return `<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="${E(o.label||"Bar chart")}" style="width:100%;height:auto;max-height:${H+20}px">`+data.map((d,i)=>{const y=pad+i*rowH,bw=Math.max(2,(W_-lw-70)*Math.abs(d[1])/max);return `<text x="0" y="${y+rowH/2+4}" font-size="12" fill="currentColor" opacity=".85">${E(String(d[0]).slice(0,22))}</text><rect x="${lw}" y="${y+4}" width="${bw}" height="${rowH-9}" rx="3" fill="${d[2]||"var(--accent)"}"/><text x="${lw+bw+6}" y="${y+rowH/2+4}" font-size="12" fill="currentColor" class="num">${E(fmt(d[1]))}</text>`}).join("")+`</svg>`};
R.svgLine=(vals,labels,o)=>{o=o||{};const w=o.w||520,h=o.h||160,l=36,b=22,t=10,r=14;const mx=Math.max(1,...vals)*1.1,mn=Math.min(0,...vals);const X=i=>l+(w-l-r)*(vals.length<2?0:i/(vals.length-1)),Y=v=>t+(h-t-b)*(1-(v-mn)/(mx-mn||1));
 const fmt=o.fmt||R.k;const pts=vals.map((v,i)=>X(i).toFixed(1)+","+Y(v).toFixed(1)).join(" ");
 return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${E(o.label||"Trend")}" style="width:100%;height:auto"><line x1="${l}" x2="${w-r}" y1="${Y(0)}" y2="${Y(0)}" stroke="currentColor" opacity=".25"/><text x="0" y="${t+8}" font-size="11" fill="currentColor" opacity=".7">${E(fmt(mx))}</text><polyline fill="none" stroke="var(--accent)" stroke-width="2.2" points="${pts}"/>`+vals.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="var(--accent)"/>`).join("")+(labels||[]).map((s,i)=>(i%Math.ceil(labels.length/7)===0||i===labels.length-1)?`<text x="${X(i)}" y="${h-6}" font-size="11" text-anchor="middle" fill="currentColor" opacity=".7">${E(s)}</text>`:"").join("")+`<text x="${X(vals.length-1)}" y="${Y(vals[vals.length-1])-8}" font-size="12" text-anchor="end" fill="currentColor" class="num">${E(fmt(vals[vals.length-1]))}</text></svg>`};

/* ---------- registration helper: entities, module map, process library, ownership. Idempotent, retried until the registries exist. ---------- */
const WIRED=R.wired=R.wired||{};
R.wire=function(sp){
 const Wd=WIRED[sp.key]=WIRED[sp.key]||{};
 try{
  if(!Wd.ent&&W.ATLAS&&ATLAS.addEntity){
   const fld=f=>({k:f[0],label:f[1],type:f[2],authority:f[4]||"platform",classification:f[3]||"internal"});
   (sp.ent||[]).forEach(e=>{G(()=>ATLAS.addEntity({id:e.id,label:e.label,domain:e.domain||"fin",source:sp.name,ownerApp:sp.screen,ownerMod:sp.mod.id,status:"live",note:e.note,fields:e.fields.map(fld)}));
    G(()=>{if(W.COVER&&COVER.recs&&!COVER.recs.some(r=>r.key===e.id.toUpperCase())){COVER.recs.push({key:e.id.toUpperCase(),label:e.label,scr:[sp.screen],mod:sp.mod.id,n:e.n||40,ent:e.id,how:e.how||"new",path:e.id.toUpperCase()});if(COVER.compute)COVER.compute()}})});
   Wd.ent=true}
  if(!Wd.mod&&W.MODMAP&&MODMAP.addModule&&Wd.ent){const ids=new Set(MODMAP.modules.map(m=>m.id));const fl=[];
   (sp.mod.flows||[]).forEach(f=>{if(ids.has(f[1]))fl.push({dir:f[0],other:f[1],data:f[2],entity:f[3],mode:f[4],trig:f[5]})});
   const r=G(()=>MODMAP.addModule({id:sp.mod.id,name:sp.name,sn:sp.mod.sn||sp.name,band:sp.mod.band,own:sp.mod.own,proposed:false,r:sp.mod.r||[],w:sp.mod.w||[],flows:fl}),null);
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))Wd.mod=true}
  if(!Wd.proc&&W.PROCLIB&&PROCLIB.addProcess&&Wd.mod){const p=sp.proc;
   const st=s=>({n:s[0],d:s[1],who:s[2],owner:s[3],sla:s[4],in:s[5],out:s[6]});
   const r=G(()=>PROCLIB.addProcess({id:p.id,name:p.name,module:sp.mod.id,family:p.family||G(()=>PROCLIB.get("plat_gate").family,undefined),owner:p.owner,backup:p.backup,trigger:p.trigger,steps:p.steps.map(st),inputs:p.inputs,outputs:p.outputs,entities:p.entities,metrics:p.metrics,model:"cmmi"}),null);
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))Wd.proc=true}
  if(Wd.proc&&!Wd.own&&W.OWNX&&OWNX.assign){const o=sp.proc.owner,b=sp.proc.backup;
   G(()=>OWNX.assign("module",sp.mod.id,o,b,"Round 15 module"));G(()=>OWNX.assign("process",sp.proc.id,o,b,"Round 15 process"));
   (sp.ent||[]).forEach(e=>G(()=>OWNX.assign("entity",e.id,o,b,"Round 15 entity")));
   (sp.proc.metrics||[]).forEach(m=>G(()=>OWNX.assign("metric",m,o,b,"Round 15 metric")));Wd.own=true}
 }catch(e){console.error("r15f3 wire",sp.key,e)}
 if(Wd.mod&&W.MODMAP&&MODMAP.refresh&&!Wd.fl){Wd.fl=1;G(()=>MODMAP.refresh())}
 return Wd};
R.wireAll=[];R.queue=sp=>{R.wireAll.push(sp);[1800,4500,9000].forEach(t=>setTimeout(()=>{R.wire(sp);G(()=>W.CONTRACT&&CONTRACT.refresh&&CONTRACT.refresh())},t))};
/* metrics helper: add METRICS with owner/rem */
R.metrics=(defs,owner)=>{Object.keys(defs).forEach(k=>{const m=defs[k];m.owner=m.owner||owner;m.max=m.max||100;if(!METRICS[k])METRICS[k]=m})};

/* events this agent emits; registered lazily when the event bus (Agent E) is present */
R.EVENTS_DEF=[["timesheet.submitted","Timesheet submitted","r15_time",["sheet","person","hours"]],["timesheet.approved","Timesheet approved","r15_time",["sheet","person","hours"]],["actuals.posted","Actuals posted to budget line","r15_time",["sheet","amount"]],["requisition.created","Requisition raised","r15_p2p",["id","amount"]],["po.created","Purchase order raised from requisition","r15_p2p",["po","requisition","amount"]],["receipt.recorded","Receipt recorded","r15_p2p",["receipt","po","amount"]],["payment.released","Payment released","r15_p2p",["po","amount"]],["report.delivered","Report delivered (simulated)","r15_rpt",["report","schedule","recipients"]],["approval.decided.mobile","Approval decided on mobile","r15_mobile",["id","act"]],["incident.acknowledged","Incident acknowledged","r15_mobile",["incident","by","via"]],["incident.escalated","Incident escalated","r15_mobile",["incident","to","via"]]];
R.regAllEvents=()=>R.EVENTS_DEF.forEach(d=>R.regEvent({id:d[0],label:d[1],module:d[2],fields:d[3].map(n=>({name:n,type:/amount|hours|recipients/.test(n)?"number":"string"})),owner:R.owners.time[0]}));
[2500,6000,11000,16000].forEach(t=>setTimeout(R.regAllEvents,t));
})();
