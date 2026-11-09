/* Round 17, Agent Q. Screen "Value realized" (r17q_value, alias #value).
   Layer A: figures computed live from this tenant's registries, each with a formula chip and a lineage link.
   Layer B: an editable business case model with visible formulas, sensitivity, saved scenarios, comparison, CSV, print view and a share block.
   Layer B is a model, not a measured result. */
(function(){
"use strict";
const W=window,Q=W.R17Q;if(!Q)return;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=U.esc;
const arr=x=>Array.isArray(x)?x:[];
const ST=Q.st,{nf,usd,usdF}=Q.fmt,INPUTS=Q.INPUTS,GROUPS=Q.GROUPS;
const dg=(a)=>String(a);
const NOTE_MODEL="This is a model, not a measured result. Inputs marked illustrative are example assumptions: replace them with your data.";

/* ---------------- Layer A ---------------- */
const SECS=[["Time returned","Agent work measured in the agent registry, times an assumption you can edit",["runs","hours"]],
 ["Decisions and approvals","Read from approval records and approver groups",["sla","cycle","groups"]],
 ["Ownership and traceability","Who owns what, and whether numbers and money trace to a source",["owner","traced","spend"]],
 ["Reuse and consolidation","Duplicate screens and entities avoided",["merged","reuse"]],
 ["Governance, connectivity and continuity","Contract coverage, links, exercises, controls and the priced cost of open gaps",["contract","zlink","exercise","controls","gapcost"]]];
const tagOf=f=>f.kind==="mixed"?["warn","Data × assumption"]:["good","From this tenant's data"];
function srcChip(f){
 if(typeof metricBody!=="function"||typeof pid!=="function")return "";const p=pid();
 return `<button type="button" class="chip r17q-fc" popovertarget="${p}" aria-label="Formula and source for ${H(f.l)}">ƒ Formula</button><div popover id="${p}" class="pop glass"><div class="eyebrow">Source registry</div><p class="r17q-pp"><b>${H(f.source)}</b></p>${metricBody(f.id)}<div class="row" style="margin-top:14px"><button class="btn" popovertarget="${p}" popovertargetaction="hide">Close</button><button class="btn quiet" data-r17q-lin="${f.id}">Open lineage</button><button class="btn quiet" data-go="metrics:${f.id}">Open in Metrics</button></div></div>`}
function figCard(f){
 const t=tagOf(f),mt=G(()=>METRICS[f.id],null);
 return `<article class="r17q-fig" data-tone="${f.tone}" aria-label="${H(f.l)}">
  <header class="r17q-fh"><h4>${H(f.l)}</h4><span class="pill ${t[0]}">${t[1]}</span></header>
  <div class="r17q-big num" data-role="metric">${H(f.disp)}</div>
  <p class="r17q-sub" data-role="story">${H(f.sub)}</p>
  ${f.assume?`<label class="r17q-as"><span>Minutes saved per run <em class="pill info">illustrative</em></span><input type="number" class="fin r17q-num" inputmode="decimal" min="0" max="120" step="1" value="${H(f.assume.v)}" data-r17q-mins aria-label="Minutes saved per agent run"></label>`:""}
  ${f.small?`<span class="pill warn r17q-sm" title="Small sample in the demo data">n = ${f.n}, small sample</span>`:""}
  <footer class="r17q-ff">${mt?srcChip(f):""}<button type="button" class="chip" data-r17q-lin="${f.id}">Lineage</button><button type="button" class="chip" data-r17q-go="${f.go}">Open</button></footer>
  <p class="r17q-src small muted"><b>Source:</b> ${H(f.source)}</p></article>`}
function layerA(){
 const T=Q.tenant(),by={};T.forEach(f=>by[f.key]=f);
 const hero4=["hours","sla","traced","gapcost"].map(k=>by[k]).filter(Boolean);
 const tiles=`<div class="statrow r17q-tiles">${hero4.map(f=>typeof kpi==="function"?kpi(f.l,f.disp,f.kind==="mixed"?"runs measured, minutes assumed":"from this tenant's data",{metric:f.id,keep:true}):"").join("")}</div>`;
 const secs=SECS.map(s=>{const fs=s[2].map(k=>by[k]).filter(Boolean);return `<section class="r17q-sec"><div class="r17q-sech"><h3>${H(s[0])}</h3><span class="muted small">${H(s[1])}</span></div><div class="r17q-grid">${fs.map(figCard).join("")}</div></section>`}).join("");
 const lg=typeof legend==="function"?legend([["From this tenant's data","--good-f"],["Measured count times an editable assumption","--warn-f"]]):"";
 return `<div class="r17q-stack">${tiles}
  <div class="r17q-note"><b>Layer A reads this tenant's registries when the page opens.</b> Nothing here is typed in. The tenant is a sample (Atlantic Systems) with demonstration records, so counts are small: the same formulas read a customer's own records after setup. ${lg}</div>
  ${secs}</div>`}

/* ---------------- Layer B ---------------- */
function inputRow(i){
 const v=ST.inp[i.k],ed=v!=null&&v!==""&&+v!==i.d;
 return `<div class="r17q-in"><label for="r17q-i-${i.k}"><span class="r17q-il">${H(i.l)}</span><span class="r17q-ih small muted">${H(i.h)}</span></label>
  <div class="r17q-ic"><input id="r17q-i-${i.k}" type="number" class="fin r17q-num" inputmode="decimal" min="${i.min}" max="${i.max}" step="${i.st}" value="${H(v==null||v===""?i.d:v)}" data-r17q-in="${i.k}"><span class="r17q-iu small muted">${H(i.u)}</span>
  <span class="pill ${ed?"good":"info"}" data-r17q-tag="${i.k}">${ed?"your data":"illustrative"}</span><button type="button" class="r17q-x" data-r17q-reset="${i.k}" aria-label="Reset ${H(i.l)} to ${H(i.d)}" ${ed?"":"hidden"}>Reset</button></div></div>`}
function inputsHTML(){return GROUPS.map(g=>`<fieldset class="r17q-fs"><legend>${H(g[1])}</legend><p class="small muted r17q-fsd">${H(g[2])}</p>${INPUTS.filter(i=>i.g===g[0]).map(inputRow).join("")}</fieldset>`).join("")}

function sensSVG(sv){
 /* PR-29: the NPV group is drawn only once a platform quote is entered */
 const gs=[["Annual benefit",k=>sv[k].full]].concat(sv.base.quoted?[["Net present value",k=>sv[k].npv]]:[]),ks=["low","base","high"],cl={low:"--warn-f",base:"--accent",high:"--good-f"};
 const vals=[];gs.forEach(g=>ks.forEach(k=>vals.push(g[1](k))));
 const top=Math.max(0,...vals),bot=Math.min(0,...vals),Wd=420,Ht=300,pt=34,pb=64,ph=Ht-pt-pb,span=(top-bot)||1,sc=ph/span,y0=pt+top*sc;
 const bw=44,gap=8,gg=44,x0=(Wd-(gs.length*(3*bw+2*gap)+(gs.length-1)*gg))/2;let g="",desc=[];
 gs.forEach((G_,gi)=>{const gx=x0+gi*(3*bw+2*gap+gg);
  ks.forEach((k,i)=>{const v=G_[1](k),h=Math.abs(v)*sc,x=gx+i*(bw+gap),y=v>=0?y0-h:y0;desc.push(`${G_[0]} ${k} ${usdF(v)}`);
   g+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${Math.max(1,h).toFixed(1)}" rx="4" style="fill:var(${cl[k]})"><title>${G_[0]}, ${k} case: ${usdF(v)}</title></rect>`;
   g+=`<text x="${(x+bw/2).toFixed(1)}" y="${(v>=0?y-5:y+h+13).toFixed(1)}" text-anchor="middle" class="r17q-vl">${usd(v)}</text>`;
   g+=`<text x="${(x+bw/2).toFixed(1)}" y="${Ht-pb+16}" text-anchor="middle" class="r17q-sk">${k==="low"?"Low":k==="base"?"Base":"High"}</text>`});
  g+=`<text x="${(gx+(3*bw+2*gap)/2).toFixed(1)}" y="${Ht-pb+38}" text-anchor="middle" class="r17q-sg">${G_[0]}</text>`});
 return `<svg class="r17q-svg" viewBox="0 0 ${Wd} ${Ht}" role="img" aria-label="Sensitivity: ${H(desc.join("; "))}"><line x1="${x0-10}" x2="${Wd-x0+10}" y1="${y0.toFixed(1)}" y2="${y0.toFixed(1)}" class="r17q-ax"/>${g}</svg>`}

/* PR-29: the prompt that replaces NPV and ROI until a platform quote is entered */
function quoteNote(M){return M.quoted?"":`<div class="r17q-quote" role="note" data-r17q-quote><span class="pill info">Modeled</span> <b>${H(Q.QUOTE_MSG)}.</b> <span class="muted small">No platform price exists yet, so the model shows benefits only (modeled). Enter the per-user quote you hold under Cost and finance.</span> <button type="button" class="btn sm" data-r17q-focus="price">Enter a quote</button></div>`}
function resultsHTML(){
 const I=Q.inputs(),M=Q.model(I),L=Q.lines(M),sv=Q.sens(I,ST.range),cov=Q.coverage();
 const byId={};L.forEach(l=>byId[l.id]=l);
 const kp=[["Annual hours returned",nf(M.H)+" h","modeled","m_val_hours"],["Annual benefit at full adoption",usd(M.full),"modeled",null],["Payback",M.pb==null?"Not within "+M.yrs+" years":nf(M.pb,1)+" months","modeled",null]].concat(M.quoted?[[M.yrs+"-year net present value",usd(M.npv),"modeled",null],[M.yrs+"-year return on investment",M.roi==null?"Not defined":nf(M.roi*100)+"%","modeled",null]]:[]);
 const tiles=`<div class="statrow r17q-tiles">${kp.map(k=>typeof kpi==="function"?kpi(k[0],k[1],"modeled, illustrative inputs",{keep:true}):"").join("")}</div>${quoteNote(M)}`;
 const fl=L.map(l=>`<div class="r17q-fl${l.strong?" strong":""}"><div class="r17q-flh"><b>${H(l.l)}</b><span class="num">${H(Q.fmtLine(l))}</span></div><div class="r17q-flf small"><span class="muted">Formula</span> ${H(l.fm)}</div><div class="r17q-flf small"><span class="muted">With your numbers</span> <code>${H(l.sub)}</code></div></div>`).join("");
 /* PR-29: discount factor and present value add up to the NPV, so they show only with a quote */
 const qd=M.quoted,pvh=qd?`<th class="n">Discount factor</th><th class="n">Present value</th>`:"",pv0=qd?`<td class="n">1.000</td><td class="n">${usdF(-M.impl)}</td>`:"";
 const yr=`<div class="tscroll"><table class="tbl r17q-t"><thead><tr><th>Year</th><th class="n">Realized</th><th class="n">Benefit</th><th class="n">Platform cost</th><th class="n">Net</th><th class="n">Cumulative</th>${pvh}</tr></thead><tbody><tr><td>0</td><td class="n"></td><td class="n"></td><td class="n">${usdF(M.impl)}</td><td class="n">${usdF(-M.impl)}</td><td class="n">${usdF(-M.impl)}</td>${pv0}</tr>${M.rows.map(r=>`<tr><td>${r.t}</td><td class="n">${nf(r.ramp*100)}%</td><td class="n">${usdF(r.b)}</td><td class="n">${usdF(r.c)}</td><td class="n">${usdF(r.net)}</td><td class="n">${usdF(r.cum)}</td>${qd?`<td class="n">${r.df.toFixed(3)}</td><td class="n">${usdF(r.pv)}</td>`:""}</tr>`).join("")}</tbody></table></div>`;
 const st=`<div class="tscroll"><table class="tbl r17q-t"><thead><tr><th>Case</th><th class="n">Annual benefit</th>${qd?`<th class="n">${M.yrs}-year NPV</th><th class="n">ROI</th>`:""}<th class="n">Payback</th></tr></thead><tbody>${["low","base","high"].map(k=>{const m=sv[k];return `<tr><td>${k==="low"?"Low":k==="base"?"Base":"High"}</td><td class="n">${usdF(m.full)}</td>${qd?`<td class="n">${usdF(m.npv)}</td><td class="n">${m.roi==null?"n/a":nf(m.roi*100)+"%"}</td>`:""}<td class="n">${m.pb==null?"Not within "+m.yrs+" y":nf(m.pb,1)+" mo"}</td></tr>`}).join("")}</tbody></table></div>${qd?"":`<p class="small muted">${H(Q.QUOTE_MSG)} for each case.</p>`}`;
 const lg=typeof legend==="function"?legend([["Low case","--warn-f"],["Base case","--accent"],["High case","--good-f"]]):"";
 return {cov:`<div class="r17q-cov"><span class="r17q-covn num">${cov}%</span><div><b>Business case coverage</b><div class="small muted">${Q.edited().length} of ${INPUTS.length} inputs replaced with your own number</div></div>${typeof fchip==="function"?fchip("m_val_cover","Formula"):""}</div>`,
  body:`${tiles}
  <section class="card glass r17q-c"><div class="cardhead"><div><h3>Sensitivity</h3><span class="muted small">Low, base and high cases in one chart. Low: effect assumptions ${nf(sv.range)}% lower, costs ${nf(sv.range/2)}% higher. High: the reverse.</span></div></div>
   <div class="r17q-sens"><div class="r17q-svgw">${sensSVG(sv)}${lg}</div><div>${st}<label class="r17q-rg small"><span>Range around the base case</span><input type="range" min="10" max="80" step="5" value="${ST.range}" data-r17q-range aria-label="Sensitivity range in percent"><b class="num">±${ST.range}%</b></label></div></div></section>
  <section class="card glass r17q-c"><div class="cardhead"><div><h3>Every formula, with your numbers</h3><span class="muted small">Change an input and the numbers here change with it.</span></div></div><div class="r17q-fls">${fl}</div></section>
  <section class="card glass r17q-c"><div class="cardhead"><div><h3>Year by year</h3><span class="muted small">Year 1 realizes ${nf(I.adopt)}% of the benefit; platform cost is paid every year; implementation is paid at the start.</span></div></div>${yr}</section>`}}

function layerB(){
 const r=resultsHTML();
 return `<div class="r17q-stack">
  <div class="r17q-warn" role="note"><span class="pill warn">Modeled</span> <b>Layer B is a model, not a measured result.</b> ${H(NOTE_MODEL)} No industry benchmark is used; the defaults describe an example midsize enterprise and nothing else.</div>
  <div class="r17q-bar"><button type="button" class="btn primary" data-r17q-save>Save as scenario</button><button type="button" class="btn" data-r17q-print>Print view</button><button type="button" class="btn" data-r17q-csv>Download CSV</button><button type="button" class="btn quiet" data-r17q-reset="*">Reset all inputs</button></div>
  <div class="r17q-b2"><div class="r17q-ins"><div id="r17q-cov">${r.cov}</div>${inputsHTML()}</div><div class="r17q-res" id="r17q-res">${r.body}</div></div></div>`}

/* ---------------- scenarios ---------------- */
function hydrate(){if(ST.hydrated)return;try{if(!W.STORE||!STORE.all)return;const rows=STORE.all("value_scenario")||[];rows.forEach(r=>{if(ST.scn.some(s=>s.id===r.id))return;try{ST.scn.push({id:r.id,name:r.name,inp:JSON.parse(r.inputs||"{}"),at:r.created||""})}catch(e){}});ST.hydrated=true}catch(e){}}
function scnList(){return ST.scn.map(s=>{const M=Q.model(Q.inputs(s.inp));return {id:s.id,name:s.name,at:s.at,inp:s.inp,M}})}
function pickOpts(){return [{v:"__cur",l:"Current inputs",sub:"unsaved"}].concat(scnList().map(s=>({v:s.id,l:s.name,sub:"saved "+(s.at||"")})))}
function getScn(id){if(id==="__cur"||!id)return {name:"Current inputs",inp:Object.assign({},ST.inp),M:Q.model(Q.inputs())};const s=scnList().find(x=>x.id===id);return s?{name:s.name,inp:s.inp,M:s.M}:null}
function compareHTML(){
 const pk=(id,label,val)=>typeof PICKER!=="undefined"&&PICKER.html?PICKER.html({id,label,source:pickOpts(),multi:false,value:val,none:id==="r17q_cb"?"Choose a scenario":"Current inputs",placeholder:"Choose",noun:"scenarios",onPick:v=>{if(id==="r17q_ca")ST.cmpA=v||"__cur";else ST.cmpB=v||"";render()}}):`<span class="muted">Picker unavailable</span>`;
 const A=getScn(ST.cmpA),B=ST.cmpB?getScn(ST.cmpB):null;
 let tbl=`<p class="muted">Pick a second scenario to compare. Save the current inputs first if you have not.</p>`;
 if(A&&B){const LA=Q.lines(A.M),LB=Q.lines(B.M),IA=Q.inputs(A.inp),IB=Q.inputs(B.inp);
  const di=INPUTS.filter(i=>IA[i.k]!==IB[i.k]);
  const dl=(a,b,t)=>{if(a==null||b==null)return "n/a";const d=b-a;return (d>=0?"+":"-")+(t==="$"?usdF(Math.abs(d)):t==="%"?nf(Math.abs(d))+" pts":t==="mo"?nf(Math.abs(d),1)+" mo":nf(Math.abs(d),1))};
  tbl=`<div class="tscroll"><table class="tbl r17q-t"><thead><tr><th>Result</th><th class="n">${H(A.name)}</th><th class="n">${H(B.name)}</th><th class="n">Difference</th></tr></thead><tbody>${LA.filter(l=>["H","full","lic","npv","roi","pb"].includes(l.id)).map((l,i)=>{const lb=LB.find(x=>x.id===l.id);return `<tr><td>${H(l.l)}</td><td class="n">${H(Q.fmtLine(l))}</td><td class="n">${H(Q.fmtLine(lb))}</td><td class="n">${dl(l.v,lb.v,l.t)}</td></tr>`}).join("")}</tbody></table></div>
  <h4 class="r17q-h4">Inputs that differ (${di.length})</h4>${di.length?`<div class="tscroll"><table class="tbl r17q-t"><thead><tr><th>Input</th><th class="n">${H(A.name)}</th><th class="n">${H(B.name)}</th></tr></thead><tbody>${di.map(i=>`<tr><td>${H(i.l)} <span class="muted small">${H(i.u)}</span></td><td class="n">${nf(IA[i.k],2)}</td><td class="n">${nf(IB[i.k],2)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">The two scenarios use the same inputs.</p>`}`}
 return `<div class="r17q-cmp"><div class="r17q-cp">${pk("r17q_ca","Scenario A",ST.cmpA==="__cur"?"__cur":ST.cmpA)}${pk("r17q_cb","Scenario B",ST.cmpB)}</div>${tbl}</div>`}
function scnTable(){const l=scnList();if(!l.length)return `<p class="muted">No saved scenarios yet. Save one from the model; scenarios are kept in this browser through the entity store.</p>`;
 return `<div class="tscroll"><table class="tbl r17q-t"><thead><tr><th>Scenario</th><th class="n">${"NPV"}</th><th class="n">Payback</th><th class="n">Inputs changed</th><th></th></tr></thead><tbody>${l.map(s=>`<tr><td><b>${H(s.name)}</b><div class="small muted">${H(s.at)}</div></td><td class="n">${s.M.quoted?usdF(s.M.npv):`<span class="muted small" title="${H(Q.QUOTE_MSG)}">Needs a platform quote</span>`}</td><td class="n">${s.M.pb==null?"Not within "+s.M.yrs+" y":nf(s.M.pb,1)+" mo"}</td><td class="n">${Q.edited(s.inp).length}</td><td class="r17q-act"><button type="button" class="chip" data-r17q-load="${s.id}">Load</button><button type="button" class="chip" data-r17q-del="${s.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>`}
function shareText(){
 const I=Q.inputs(),M=Q.model(I),L=Q.lines(M),ed=new Set(Q.edited().map(i=>i.k));
 const asm=INPUTS.map(i=>`- ${i.l}: ${nf(I[i.k],2)} ${i.u} (${ed.has(i.k)?"your data":"illustrative"})`).join("\n");
 const T=Q.tenant().filter(f=>["hours","sla","owner","traced","contract"].includes(f.key)).map(f=>`- ${f.l}: ${f.disp} (${f.kind==="mixed"?"measured runs, assumed minutes":"from the sample tenant's data"})`).join("\n");
 return `Business case model: a model, not a measured result.\nInputs marked illustrative are example assumptions; replace them with your data.\n\nAssumptions\n${asm}\n\nResults (modeled)\n${L.filter(l=>["H","full","lic","npv","roi","pb"].includes(l.id)).map(l=>`- ${l.l}: ${Q.fmtLine(l)}`).join("\n")}\n\nFormulas\n${L.filter(l=>["H","lab","tools","out","full","npv","roi"].includes(l.id)).map(l=>`- ${l.l} = ${l.fm}`).join("\n")}\n\nMeasured in the sample tenant (Layer A)\n${T}`}
function exportHTML(){return `<div class="r17q-ex"><div class="r17q-exb"><button type="button" class="btn primary" data-r17q-case>Download one-page business case (.html)</button><button type="button" class="btn" data-r17q-caseopen>Open printable page</button><button type="button" class="btn" data-r17q-print>Print view (one page)</button><button type="button" class="btn" data-r17q-csv>Download CSV</button><button type="button" class="btn" data-r17q-copy>Copy text</button></div><label class="r17q-share"><span class="small muted">Share assumptions: paste this block into an email or a document. It lists every assumption and whether it is illustrative.</span><textarea class="fin" readonly rows="12" id="r17q-share" aria-label="Assumptions text block">${H(shareText())}</textarea></label></div>`}
function scenariosTab(){hydrate();
 return `<div class="r17q-stack"><section class="card glass r17q-c"><div class="cardhead"><div><h3>Saved scenarios</h3><span class="muted small">Save the current inputs under a name, load one back, or compare two.</span></div></div>
  <div class="r17q-sv"><label class="r17q-svl small muted" for="r17q-name"><span>Scenario name</span></label><input id="r17q-name" class="fin" type="text" maxlength="60" placeholder="For example: conservative" value="${H(ST.nm)}" data-r17q-name><button type="button" class="btn primary" data-r17q-save>Save current inputs</button></div>${scnTable()}</section>
  <section class="card glass r17q-c"><div class="cardhead"><div><h3>Compare two scenarios</h3><span class="muted small">Results side by side, then the inputs that differ.</span></div></div>${compareHTML()}</section>
  <section class="card glass r17q-c"><div class="cardhead"><div><h3>Export and share</h3><span class="muted small">Print view, CSV of assumptions and results, and a text block.</span></div></div>${exportHTML()}</section></div>`}

/* ---------------- screen ---------------- */
function screen(){
 Q.ensurePerm();hydrate();
 const T=Q.tenant(),nA=T.length;
 const tab=ST.tab||0;
 return `<div class="screen r17q-screen">${hero("Strategy and performance · Value realized","What the platform is worth to a midsize enterprise",`<b data-role="metric">${nA}</b> figures are computed live from this tenant's registries (Layer A). Layer B is a business case you edit: defaults are illustrative and the result is a model, not a measured one.`,`<div class="row" style="gap:8px;flex-wrap:wrap">${typeof fchip==="function"?fchip("m_val_hours")+fchip("m_val_cover"):""}<button class="btn" data-go="r17q_thinking">How it was built</button></div>`)}${typeof lensNote==="function"?lensNote():""}
  ${typeof views==="function"?views("r17qv",["Layer A: this tenant's data","Layer B: business case model","Scenarios and export"],[layerA(),layerB(),scenariosTab()]):layerA()}
  ${typeof procCard==="function"?procCard("r17q_value"):""}</div>`}
REG("r17q_value","Value realized","strat","M4 19h16M6 16V9m4 7V5m4 11v-6m4 6V8",screen);

/* ---------------- in-place update of Layer B ---------------- */
function paintB(){
 const res=document.getElementById("r17q-res");if(!res)return;
 const r=resultsHTML();res.innerHTML=r.body;const c=document.getElementById("r17q-cov");if(c)c.innerHTML=r.cov;
 INPUTS.forEach(i=>{const v=ST.inp[i.k],ed=v!=null&&v!==""&&+v!==i.d,t=document.querySelector(`[data-r17q-tag="${i.k}"]`);if(t){t.textContent=ed?"your data":"illustrative";t.className="pill "+(ed?"good":"info")}
  const x=document.querySelector(`[data-r17q-reset="${i.k}"]`);if(x)x.hidden=!ed});
 const m=G(()=>METRICS.m_val_cover,null);if(m)m.cur=Q.coverage();
 const sh=document.getElementById("r17q-share");if(sh)sh.value=shareText();
 if(typeof coreAfter==="function")G(()=>coreAfter(),0)}
let at=0;
const note=(k)=>{clearTimeout(at);at=setTimeout(()=>{Q.audit("Changed a value assumption",k);G(()=>EVENTS.emit("value.assumption_changed",{scenario:"current",actor:G(()=>INBOX.me(),""),detail:k},{source:"r17q_value"}),0)},900)};

/* ---------------- exports ---------------- */
const csvq=v=>{v=String(v==null?"":v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
function csv(){
 const I=Q.inputs(),M=Q.model(I),L=Q.lines(M),ed=new Set(Q.edited().map(i=>i.k)),sv=Q.sens(I,ST.range);
 const rows=[["Business case model","A model, not a measured result. Inputs tagged illustrative are example assumptions."],[],["Assumption","Value","Unit","Tag"]];
 INPUTS.forEach(i=>rows.push([i.l,I[i.k],i.u,ed.has(i.k)?"your data":"illustrative"]));
 rows.push([],["Result","Value","Formula","With the numbers"]);L.forEach(l=>rows.push([l.l,l.v==null?"":Math.round(l.v*100)/100,l.fm,l.sub]));
 /* PR-29: no NPV, ROI or present value in the export until a platform quote is entered */
 const qd=M.quoted;if(!qd)rows.push([],[Q.QUOTE_MSG,"No platform price exists yet; benefits are modeled."]);
 rows.push([],["Year","Realized percent","Benefit","Platform cost","Net","Cumulative"].concat(qd?["Present value"]:[]));M.rows.forEach(r=>rows.push([r.t,Math.round(r.ramp*100),Math.round(r.b),Math.round(r.c),Math.round(r.net),Math.round(r.cum)].concat(qd?[Math.round(r.pv)]:[])));
 rows.push([],["Case","Annual benefit"].concat(qd?[M.yrs+"-year NPV","ROI percent"]:[]).concat(["Payback months"]));["low","base","high"].forEach(k=>{const m=sv[k];rows.push([k,Math.round(m.full)].concat(qd?[Math.round(m.npv),m.roi==null?"":Math.round(m.roi*100)]:[]).concat([m.pb==null?"":Math.round(m.pb*10)/10]))});
 rows.push([],["Sensitivity range percent",ST.range]);
 return rows.map(r=>r.map(csvq).join(",")).join("\r\n")}
function download(name,text,type){try{const b=new Blob([text],{type:type||"text/csv;charset=utf-8"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},500);return true}catch(e){return false}}
Q.csv=csv;
/* ---------------- PR-21: one-page business case, as a standalone printable HTML page and a downloadable .html ----------------
   Every number in it carries the label "Modeled" (inputs are modeled assumptions, results are model outputs). Measured Layer A
   figures are left out so nothing measured and nothing modeled share one page. The page uses system colors only (no palette). */
function caseHTML(){
 const I=Q.inputs(),M=Q.model(I),L=Q.lines(M),sv=Q.sens(I,ST.range),ed=new Set(Q.edited().map(i=>i.k));
 const org=G(()=>DATA.tenantInfo().org,"")||G(()=>TENANT.name(),"")||"Sample organization";
 const day=G(()=>U.fmtDate(U.TODAY_ISO,{year:"numeric",month:"long"}),"");
 const MOD='<td class="lb">Modeled</td>';
 const row=(a,b,c)=>`<tr><td>${H(a)}</td><td class="n">${H(b)}</td>${c||MOD}</tr>`;
 const res=L.filter(l=>["H","full","lic","npv","roi","pb"].includes(l.id));
 const asm=INPUTS.map(i=>`<tr><td>${H(i.l)}${i.k==="price"?" (unpriced placeholder for your quote)":""}</td><td class="n">${H(nf(I[i.k],Number.isInteger(+I[i.k])?0:2))} ${H(i.u)}</td><td class="lb">Modeled, ${ed.has(i.k)?"your data":"illustrative"}</td></tr>`).join("");
 const yr=M.rows.map(r=>`<tr><td>Year ${H(r.t)}</td><td class="n">${H(Math.round(r.ramp*100))}%</td><td class="n">${H(usdF(r.b))}</td><td class="n">${H(usdF(r.c))}</td><td class="n">${H(usdF(r.net))}</td><td class="n">${H(usdF(r.cum))}</td>${MOD}</tr>`).join("");
 /* PR-29: the business case follows the screen: no NPV or ROI until a platform quote is entered */
 const qd=M.quoted,QN=H(Q.QUOTE_MSG);
 const sens=["low","base","high"].map(k=>{const m=sv[k];return `<tr><td>${H(k[0].toUpperCase()+k.slice(1))} case</td><td class="n">${H(usdF(m.full))}</td>${qd?`<td class="n">${H(usdF(m.npv))}</td><td class="n">${m.roi==null?"n/a":H(nf(m.roi*100))+"%"}</td>`:""}${MOD}</tr>`}).join("");
 const fm=L.filter(l=>["lab","tools","out","full","lic","npv","roi","pb"].includes(l.id)).map(l=>`<tr><td>${H(l.l)}<div class="fm">${H(l.fm)}</div></td><td class="n">${H(Q.fmtLine(l))}</td>${MOD}</tr>`).join("");
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Business case model</title>
<style>:root{color-scheme:light dark}body{margin:0;background:Canvas;color:CanvasText;font:13px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:780px;margin:0 auto;padding:24px 16px}h1{font-size:22px;margin:0 0 4px}h2{font-size:14px;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.05em}
.sub{color:GrayText;margin:0 0 6px}.note{border:1px solid GrayText;border-radius:8px;padding:8px 10px;margin:10px 0}
table{width:100%;border-collapse:collapse}td,th{padding:4px 6px;border-bottom:1px solid GrayText;text-align:left;vertical-align:top}th{font-size:11px;color:GrayText;font-weight:600}
.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.lb{font-size:11px;color:GrayText;white-space:nowrap}.fm{font-size:11px;color:GrayText}
.cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}@media (max-width:640px){.cols{grid-template-columns:minmax(0,1fr)}}
footer{color:GrayText;font-size:11px;margin-top:14px}@media print{main{padding:0;max-width:none}body{font-size:8.5px;line-height:1.3}h1{font-size:16px}h2{font-size:10px;margin:6px 0 2px}td,th{padding:1px 4px}.lb,.fm,th,footer{font-size:7.5px}.note{margin:4px 0;padding:4px 8px}.cols{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}@page{size:letter;margin:10mm}}</style></head>
<body><main><h1>Business case model</h1><p class="sub">${H(org)} (fictional sample) · ${H(day)}</p>
<p class="note"><b>A model, not a measured result.</b> Every number on this page is modeled: inputs are assumptions (illustrative unless marked your data) and results are computed from them with the formulas shown.</p>${qd?"":`<p class="note" data-case="quote"><b>${QN}.</b> No platform price exists yet, so this page shows benefits only (modeled).</p>`}
<h2>Results</h2><table data-case="results"><thead><tr><th>Result</th><th class="n">Value</th><th>Label</th></tr></thead><tbody>${res.map(l=>row(l.l,Q.fmtLine(l))).join("")}</tbody></table>
<div class="cols"><div><h2>Assumptions</h2><table data-case="assumptions"><thead><tr><th>Input</th><th class="n">Value</th><th>Label</th></tr></thead><tbody>${asm}</tbody></table></div>
<div><h2>Formulas</h2><table data-case="formulas"><thead><tr><th>Line</th><th class="n">Value</th><th>Label</th></tr></thead><tbody>${fm}</tbody></table>
<h2>Low, base and high</h2><table data-case="sensitivity"><thead><tr><th>Case</th><th class="n">Annual benefit</th>${qd?`<th class="n">NPV</th><th class="n">ROI</th>`:""}<th>Label</th></tr></thead><tbody>${sens}</tbody></table>${qd?"":`<p class="sub">${QN} for each case.</p>`}<p class="sub">Range plus or minus ${H(nf(ST.range))}% on the uncertain inputs (modeled).</p></div></div>
<h2>Year by year</h2><table data-case="years"><thead><tr><th>Year</th><th class="n">Realized</th><th class="n">Benefit</th><th class="n">Platform cost</th><th class="n">Net</th><th class="n">Cumulative</th><th>Label</th></tr></thead><tbody>${yr}</tbody></table>
<footer>Prepared with the Value realized screen of a prototype. Figures measured from the sample tenant's records are not on this page; they are on the screen with their formulas and sources. No price or certification is implied.</footer></main></body></html>`}
Q.caseHTML=caseHTML;
function openCase(){const html=caseHTML();let w=null;try{const u=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));w=window.open(u,"_blank");setTimeout(()=>URL.revokeObjectURL(u),60000)}catch(e){}
 if(!w){openPrint();toast("Pop-ups are blocked, so the print view opened here instead","warn")}Q.audit("Opened one-page business case","Value realized");return !!w}
Q.openCase=openCase;
function openPrint(){
 closePrint();
 const I=Q.inputs(),M=Q.model(I),L=Q.lines(M),sv=Q.sens(I,ST.range),ed=new Set(Q.edited().map(i=>i.k)),T=Q.tenant();
 const d=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
 const k=(l,v)=>`<div class="r17q-pk"><span>${H(l)}</span><b class="num">${H(v)}</b></div>`;
 const el=document.createElement("div");el.className="r17q-pv";el.setAttribute("role","dialog");el.setAttribute("aria-label","Print view");
 el.innerHTML=`<div class="r17q-pvbar"><button type="button" class="btn primary" data-r17q-pvprint>Print or save as PDF</button><button type="button" class="btn" data-r17q-pvclose>Close</button></div>
 <article class="r17q-page"><header><div class="r17q-pvt">Value realized: business case model</div><div class="r17q-pvs">${H(G(()=>DATA.tenantInfo().org,"")||"Atlantic Systems")} (sample) · ${H(d)} · <b>A model, not a measured result.</b> Inputs tagged illustrative are example assumptions; replace them with your data.</div></header>
 <div class="r17q-pks">${k("Annual hours returned",nf(M.H)+" h")}${k("Annual benefit",usd(M.full))}${k("Payback",M.pb==null?"Not within "+M.yrs+" y":nf(M.pb,1)+" months")}${M.quoted?k(M.yrs+"-year NPV",usd(M.npv))+k("ROI",M.roi==null?"n/a":nf(M.roi*100)+"%"):k("NPV and ROI",Q.QUOTE_MSG)}</div>
 <div class="r17q-pcols"><div class="r17q-pcol"><h4>Assumptions</h4><table class="r17q-pt2">${INPUTS.map(i=>`<tr><td>${H(i.l)}</td><td class="r17q-pn">${nf(I[i.k],2)} <span>${H(i.u)}</span></td><td>${ed.has(i.k)?"your data":"illustrative"}</td></tr>`).join("")}</table></div>
 <div class="r17q-pcol"><h4>Sensitivity: low, base, high</h4>${sensSVG(sv)}<h4>Formulas</h4><table class="r17q-pt2">${L.filter(l=>["lab","tools","out","full","lic","npv","roi","pb"].includes(l.id)).map(l=>`<tr><td>${H(l.l)}</td><td class="r17q-pn">${H(Q.fmtLine(l))}</td></tr><tr class="r17q-fr"><td colspan="2">${H(l.fm)}</td></tr>`).join("")}</table></div></div>
 <footer><b>Measured in the sample tenant (Layer A):</b> ${T.filter(f=>["hours","sla","owner","traced","contract"].includes(f.key)).map(f=>H(f.l)+" "+H(f.disp)).join("; ")}. Each figure's formula and source registry are listed on the Value realized screen.</footer></article>`;
 document.body.appendChild(el);document.body.classList.add("r17q-printing");const b=el.querySelector("button");if(b)b.focus();Q.audit("Opened print view","Value realized")}
function closePrint(){document.querySelectorAll(".r17q-pv").forEach(e=>e.remove());document.body.classList.remove("r17q-printing")}
Q.openPrint=openPrint;

/* ---------------- events ---------------- */
document.addEventListener("input",e=>{const t=e.target;if(!t.closest)return;
 const i=t.closest("[data-r17q-in]");if(i){ST.inp[i.dataset.r17qIn]=i.value;paintB();note(i.dataset.r17qIn);return}
 if(t.closest("[data-r17q-mins]")){const v=Math.min(120,Math.max(0,+t.value||0));ST.mins=v;return}
 if(t.closest("[data-r17q-range]")){ST.range=+t.value;paintB();return}
 if(t.closest("[data-r17q-name]")){ST.nm=t.value}});
document.addEventListener("change",e=>{const t=e.target;if(t.closest&&t.closest("[data-r17q-mins]")){Q.audit("Changed minutes saved per agent run",String(ST.mins));render()}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.querySelector(".r17q-pv"))closePrint()});
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
 if(b=t.closest("[data-r17q-go]")){go(b.dataset.r17qGo);return}
 if(b=t.closest("[data-r17q-focus]")){const i=document.getElementById("r17q-i-"+b.dataset.r17qFocus);if(i){i.scrollIntoView({block:"center"});i.focus();i.select&&i.select()}return}
 if(b=t.closest("[data-r17q-lin]")){const id=b.dataset.r17qLin;if(W.ATLAS&&ATLAS.lineage)ATLAS.lineage(id);return}
 if(b=t.closest("[data-r17q-reset]")){const k=b.dataset.r17qReset;if(k==="*"){ST.inp={};Q.audit("Reset all value assumptions","")}else{delete ST.inp[k]}render();return}
 if(t.closest("[data-r17q-save]")){const nm=(ST.nm||"").trim()||"Scenario "+(ST.scn.length+1);const id="VS-"+Date.now().toString(36);const inp=Object.assign({},ST.inp),M=Q.model(Q.inputs(inp));
  ST.scn.push({id,name:nm,inp,at:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})});ST.nm="";
  G(()=>{if(W.STORE&&STORE.put)STORE.put("value_scenario",{id,name:nm,inputs:JSON.stringify(inp),results:JSON.stringify({npv:M.quoted?Math.round(M.npv):null,roi:M.quoted?M.roi:null,quoted:M.quoted,pb:M.pb,H:Math.round(M.H)}),owner:Q.own.value[0],backup:Q.own.value[1],created:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})})},0);
  Q.audit("Saved value scenario",nm);G(()=>EVENTS.emit("value.scenario_saved",{scenario:id,actor:G(()=>INBOX.me(),""),detail:nm},{source:"r17q_value"}),0);
  toast("Scenario saved: "+nm,"good");ST.tab=2;S.v.r17qv=2;render();return}
 if(b=t.closest("[data-r17q-load]")){const s=ST.scn.find(x=>x.id===b.dataset.r17qLoad);if(s){ST.inp=Object.assign({},s.inp);Q.audit("Loaded value scenario",s.name);toast("Loaded "+s.name,"good");S.v.r17qv=1;render()}return}
 if(b=t.closest("[data-r17q-del]")){const i=ST.scn.findIndex(x=>x.id===b.dataset.r17qDel);if(i>=0){const s=ST.scn.splice(i,1)[0];G(()=>{if(W.STORE&&STORE.delete)STORE.delete("value_scenario",s.id)},0);if(ST.cmpB===s.id)ST.cmpB="";if(ST.cmpA===s.id)ST.cmpA="__cur";Q.audit("Deleted value scenario",s.name);render()}return}
 if(t.closest("[data-r17q-csv]")){const ok=download("value-case-"+new Date().toISOString().slice(0,10)+".csv",csv());Q.audit("Exported value case CSV","");toast(ok?"CSV downloaded":"Download is blocked in this browser",ok?"good":"warn");return}
 if(t.closest("[data-r17q-case]")){const ok=download("business-case-"+G(()=>U.TODAY_ISO,"model")+".html",caseHTML(),"text/html;charset=utf-8");Q.audit("Downloaded one-page business case","");toast(ok?"Business case downloaded (.html)":"Download is blocked in this browser",ok?"good":"warn");return}
 if(t.closest("[data-r17q-caseopen]")){openCase();return}
 if(t.closest("[data-r17q-print]")){openPrint();return}
 if(t.closest("[data-r17q-pvprint]")){window.print();return}
 if(t.closest("[data-r17q-pvclose]")){closePrint();return}
 if(t.closest("[data-r17q-copy]")){const ta=document.getElementById("r17q-share");if(ta){ta.select();let ok=false;try{ok=document.execCommand("copy")}catch(x){}try{if(!ok&&navigator.clipboard){navigator.clipboard.writeText(ta.value);ok=true}}catch(x){}toast(ok?"Copied the assumptions block":"Select the text and copy it","good")}return}});
})();
