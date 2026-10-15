/* ===== Round 18, K: executive lenses in the language of the business. Meridian Standards Foundation publishes standards, runs ballots and comment periods for 300 member organizations,
   and lives on dues. Each lens leads with what that executive actually answers for: comments closed, ballots, renewals, invoices, spend; platform safety is one line underneath.
   Owns the lens screen and the home strip (replaces the figures in mod_r18e). All dollar and volume figures are illustrative demo data, labeled as such. ===== */
(function(){
"use strict";
const W=window,D=document;const R18=W.R18;if(!R18||!R18.LENSES)return;
const {G,H,arr,pill,usd}=R18;const ST=R18.st;
const n0=n=>Math.round(n).toLocaleString("en-US");
/* what each build does for the business, per month, from and to */
const BIZ={
 ca_comments:{fn:"Standards",did:"Public comments answered",vol:420,per:"a month",kpi:"Days to close a comment",from:21,to:9,u:"days",obj:"Standards reach ballot sooner"},
 ca_ballot:{fn:"Standards",did:"Ballots summarized for committee chairs",vol:6,per:"a month",kpi:"Chair preparation time",from:6,to:1.5,u:"hours",obj:"Chairs decide with the whole record"},
 ca_styleguide:{fn:"Standards",did:"Style questions answered with a citation",vol:740,per:"a month",kpi:"Time to find a past ruling",from:25,to:2,u:"minutes",obj:"Editors apply the same ruling every time"},
 ca_vendor_onb:{fn:"Finance",did:"Vendors onboarded",vol:11,per:"a month",kpi:"Days to onboard a vendor",from:18,to:6,u:"days",obj:"Vendors are paid on time"},
 ca_inv_exc:{fn:"Finance",did:"Invoice exceptions cleared",vol:38,per:"a month",kpi:"Days an exception waits",from:12,to:5,u:"days",obj:"Invoices stop sitting in exception",held:86400,stuck:18},
 ca_budget:{fn:"Finance",did:"Editorial programs tracked against budget",vol:14,per:"programs",kpi:"Variance seen before month end",from:0,to:2,u:"weeks earlier",obj:"No surprises at close"},
 ca_renewals:{fn:"Membership",did:"Member renewals reminded",vol:25,per:"a month",kpi:"Renewal response rate",from:61,to:74,u:"%",obj:"Members renew before the date",dues:320000},
 ca_pipeline:{fn:"Membership",did:"Dues in the renewal pipeline",vol:1900000,money:true,per:"next 90 days",kpi:"Renewals due that have an owner",from:70,to:100,u:"%",obj:"Every renewal has a named owner"},
 ca_digest:{fn:"Standards",did:"Committee members receiving the weekly digest",vol:0,per:"so far",kpi:"Exposure drafts members see",from:0,to:0,u:"",obj:"Members read what is open for comment"},
 ca_travel:{fn:"Standards",did:"Conference trips planned and costed",vol:9,per:"a month",kpi:"Trips over budget",from:3,to:1,u:"trips",obj:"Conference travel stays in budget"},
 ca_lease:{fn:"Facilities",did:"Leases watched for expiry",vol:3,per:"leases",kpi:"Warning before a lease ends",from:30,to:180,u:"days",obj:"No lease lapses unnoticed"},
 ca_laptops:{fn:"IT service",did:"Laptops tracked for refresh",vol:7,per:"due now",kpi:"Staff told before refresh",from:40,to:100,u:"%",obj:"Staff get new laptops without asking"},
 ca_oncall_swap:{fn:"Technology",did:"On-call swaps arranged without a manager email",vol:12,per:"a month",kpi:"Time to arrange a swap",from:2,to:0.2,u:"days",obj:"Coverage is never in doubt"},
 ca_roomkit:{fn:"Facilities",did:"Rooms booked",vol:0,per:"replaced",kpi:"",from:0,to:0,u:"",obj:""}};
G(()=>R18.apps().forEach(a=>{const b=BIZ[a.id];if(b&&b.fn&&!a.fn)a.fn=b.fn}));
R18.BIZ=BIZ;
R18.chgText=b=>b.kpi?(b.u==="%"?b.from+"% to "+b.to+"%":b.from+(b.u?" "+b.u:"")+" to "+b.to+(b.u?" "+b.u:"")):"";
const fmtBig=b=>b.money?usd(b.vol):n0(b.vol);
const chg=b=>b.kpi?(b.u==="%"?b.from+"% to "+b.to+"%":b.from+(b.u?" "+b.u:"")+" to "+b.to+(b.u?" "+b.u:"")):"";
const sp=()=>G(()=>R18.spend.stats(),{A:0,F:0,v:0,rows:[]});
const fv=v=>(v>=0?"+":"")+v.toFixed(1)+"%";
function figs(){const f=R18.lensFigs();const s=sp();const top=s.rows.slice().sort((a,b)=>b.var-a.var)[0]||{dom:"",var:0};
 const lines=G(()=>BUDX.B().lines,[]);const over=lines.filter(l=>(+l.fcst||0)>(+l.appr||0)).length;
 const dues=BIZ.ca_renewals.dues,held=BIZ.ca_inv_exc.held,stuck=BIZ.ca_inv_exc.stuck;
 const hrs=f.P.hours;
 return Object.assign({},f,{s,top,over,dues,held,stuck,hrs})}
const set=(id,o)=>{const l=R18.LENSES.find(x=>x.id===id);if(l)Object.assign(l,o)};
const WHO={ceo:"Catherine Doyle",cfo:"Marcus Reid",coo:"Elena Marsh",cio:"Casey Rowan",ciso:"Rina Okafor",caio:"Kenji Watanabe",chro:"Joanna Pierce"};
const ROLE={ceo:"Chief executive",cfo:"Chief financial officer",coo:"Chief editor, holding the COO view",cio:"Chief information officer",ciso:"Security lead, holding the CISO view",caio:"AI platform lead, holding the CAIO view",chro:"Head of people operations, holding the CHRO view"};
R18.LENSWHO=WHO;
set("ceo",{balance:"Mission delivered against what it costs",q:"Is the Foundation delivering its standards and keeping its members?",
 v:["Mission delivered",f=>[["Public comments answered a month",n0(BIZ.ca_comments.vol),"closed in "+BIZ.ca_comments.to+" days, down from "+BIZ.ca_comments.from],["Member renewal response",BIZ.ca_renewals.to+"%","up from "+BIZ.ca_renewals.from+"% across 300 member organizations"],["Objectives with work behind them",(f.objs.length-f.bare.length)+" of "+f.objs.length,"each is something a function is actively building toward"]]],
 c:["What it costs",f=>{const x=figs();return[["Spend against approved",fv(x.s.v),usd(x.s.F)+" forecast against "+usd(x.s.A)+" approved"],["Largest overrun",x.top.dom||"none",fv(x.top.var||0)+" against approved"],["Staff hours returned a month",n0(x.hrs),"time editors and staff spend on the work itself"]]}],
 r:["Where it could slip",f=>[["Objectives with no work behind them",f.bare.length,f.bare.map(o=>o.n||o.name).slice(0,2).join("; ")||"none"],["Work that depends on one person",f.P.noOwner,"stops if that person is out"],["Owner has left",f.gone,"nobody is accountable"]]],
 sayFn:f=>BIZ.ca_comments.vol+" public comments a month are now answered, each closed in "+BIZ.ca_comments.to+" days instead of "+BIZ.ca_comments.from+". "+BIZ.ca_renewals.to+"% of members respond to renewal reminders. "+f.bare.length+(f.bare.length===1?" strategic objective has":" strategic objectives have")+" no work behind "+(f.bare.length===1?"it":"them")+" yet."});
set("cfo",{balance:"Money protected against money spent",q:"Where is the money going, and is it under control?",
 v:["Money protected",f=>[["Dues retained by earlier reminders",usd(BIZ.ca_renewals.dues)+" a year","response up from "+BIZ.ca_renewals.from+"% to "+BIZ.ca_renewals.to+"%"],["Invoice exceptions cleared",n0(BIZ.ca_inv_exc.vol)+" a month","average wait down from "+BIZ.ca_inv_exc.from+" to "+BIZ.ca_inv_exc.to+" days"],["Staff time returned",usd(f.P.gross)+" a month","at "+usd(ST.rate)+" an hour"]]],
 c:["Spend",f=>{const x=figs();return[["Forecast against approved",fv(x.s.v),usd(x.s.F)+" against "+usd(x.s.A)],["Largest overrun",x.top.dom||"none",fv(x.top.var||0)+" against approved"],["Cost of the tools behind this",usd(f.P.cost)+" a month","platform, connectors and AI"]]}],
 r:["Exposure",f=>{const x=figs();return[["Invoices held in exception",usd(x.held),x.stuck+" have waited more than ten days"],["Budget lines forecast over approved",x.over,"each needs an owner's explanation"],["Data requests waiting on approval",f.ac.pending||0,"work held up until an owner decides"]]}],
 sayFn:f=>{const x=figs();return"Forecast spend is "+usd(x.s.F)+" against "+usd(x.s.A)+" approved ("+fv(x.s.v)+"), led by "+(x.top.dom||"no domain")+". Earlier renewal reminders protect about "+usd(BIZ.ca_renewals.dues)+" of dues a year, and "+usd(x.held)+" is still held in invoice exceptions."}});
set("coo",{balance:"Standards moving through against cost to serve",q:"Where does standards work stall, and what is ready to scale?",
 v:["Work flowing",f=>[["Public comments answered a month",n0(BIZ.ca_comments.vol),"days to close down from "+BIZ.ca_comments.from+" to "+BIZ.ca_comments.to],["Ballots summarized for chairs",BIZ.ca_ballot.vol+" a month","chair preparation from "+BIZ.ca_ballot.from+" hours to "+BIZ.ca_ballot.to],["Vendors onboarded",BIZ.ca_vendor_onb.vol+" a month","days to onboard down from "+BIZ.ca_vendor_onb.from+" to "+BIZ.ca_vendor_onb.to]]],
 c:["Cost to serve",f=>[["Steps still waiting on a person",f.rows.reduce((s,r)=>s+R18.process(r.a.id).counts.human,0),"across every tool, judgement and approval"],["Tools doing the same job",f.dup,"merge before more are made"],["Staff hours returned a month",n0(f.P.hours),"time back to editors and staff"]]],
 r:["Operating risk",f=>[["Work that depends on one person",f.P.noOwner,"stops if the owner is out"],["Owner has left",f.gone,"nobody is accountable"],["Weekly digest readers",BIZ.ca_digest.vol,"committee members not yet reached"]]],
 sayFn:f=>"Comments close in "+BIZ.ca_comments.to+" days, down from "+BIZ.ca_comments.from+", and chairs prepare ballots in "+BIZ.ca_ballot.to+" hours instead of "+BIZ.ca_ballot.from+". "+f.P.noOwner+(f.P.noOwner===1?" tool has":" tools have")+" no backup owner."});
set("chro",{balance:"Time freed against how work changes for people",q:"How is work shifting between people and tools, and who is affected?",
 v:["Time freed",f=>[["Staff hours returned a month",n0(f.P.hours),"about "+(f.P.hours/160).toFixed(1)+" full-time roles of time"],["Editors using the style guide",n0(R18.app("ca_styleguide")?R18.app("ca_styleguide").users:310),"finding past rulings in minutes"],["People who built their own tool",new Set(f.rows.map(r=>r.a.builder)).size,"staff improving their own work"]]],
 c:["Change load",f=>[["People using these tools",f.P.users,"work changed for them"],["Steps now done by a tool",f.rows.reduce((s,r)=>s+R18.process(r.a.id).counts.ai+R18.process(r.a.id).counts.auto,0),"previously done by a person"],["Steps still done by a person",f.rows.reduce((s,r)=>s+R18.process(r.a.id).counts.human,0),"judgement and approval stay with people"]]],
 r:["Workforce risk",f=>[["Builder or owner has left",f.gone,"tool needs a new owner"],["Work that depends on one person",f.P.noOwner,"succession gap"],["Tools with no trained backup",f.rows.filter(r=>!r.m.backup).length,"nobody else knows how it runs"]]],
 sayFn:f=>"About "+(f.P.hours/160).toFixed(1)+" full-time roles of time are returned each month across "+new Set(f.rows.map(r=>r.a.builder)).size+" people who built their own tools. The owner has left on "+f.gone+(f.gone===1?" tool.":" tools.")});
/* technology executives keep technology figures, with plain labels */
set("cio",{q:"How do I stop sprawl without blocking the people building?",sayFn:null});
/* every lens has a name for the person who holds it in this organization */
R18.LENSES.forEach(l=>{l.exec=WHO[l.id];l.execRole=ROLE[l.id]});
const grammar=s=>String(s).replace(/\b1 of (\d+) (builds|tools) (are|have|use)\b/g,(m,n,w,v)=>"1 of "+n+" "+w+" "+({are:"is",have:"has",use:"uses"}[v])).replace(/\b1 (builds|tools)\b/g,"1 build").replace(/\b1 objectives have\b/g,"1 objective has").replace(/\b1 call a model\b/g,"1 calls a model");
R18.grammar=grammar;
const lensOf=()=>R18.LENSES.find(l=>l.id===ST.lens)||R18.LENSES[0];
function sayOf(l,f){const x=figs();let t="";if(l.sayFn)t=l.sayFn(x);else{const m={"{net}":usd(f.P.net),"{n}":f.P.n,"{stall}":f.P.noOwner,"{cost}":usd(f.P.cost),"{unl}":f.P.unlinked,"{ai}":f.aiRows.length,"{direct}":f.P.aiDirect,"{noks}":f.rows.length-f.killOk,"{cov}":f.objs.length-f.bare.length,"{obj}":f.objs.length,"{sec}":f.sec,"{over}":f.ac.over||0,"{fails}":f.fails,"{dup}":f.dup,"{high}":f.high};t=String(l.say||"").replace(/\{[a-z]+\}/g,k=>m[k]!==undefined?m[k]:k)}
 return grammar(t)}
R18.lensSay=sayOf;
const IC={v:'<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.8 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',c:'<path d="M12 2v20M17 6.5C17 4.6 14.8 4 12 4S7 5 7 7c0 4.5 10 2.5 10 7 0 2.2-2.2 3-5 3s-5-.9-5-3"/>',r:'<path d="M12 3l9 16H3zM12 10v4M12 17v.5"/>'};
function tile(tone,[title,fn],f){const rows=fn(f);const lead=rows[0];
 return `<section class="r18-bt r18-bt-${tone}"><div class="r18-bt-h"><span class="r18-bt-i"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[tone]}</svg></span><span class="r18-bt-k">${tone==="v"?"Value":tone==="c"?"Cost":"Risk"}</span><h3>${H(title)}</h3></div>
  <div class="r18-bt-lead"><b>${H(lead[1])}</b><span>${H(lead[0])}</span><small>${H(lead[2])}</small></div>
  <ul class="r18-bt-l">${rows.slice(1).map(([a,b,c])=>`<li><b>${H(b)}</b><span>${H(a)}<small>${H(c)}</small></span></li>`).join("")}</ul></section>`}
const relevance={ceo:()=>1,cfo:id=>/Finance|Membership/.test((BIZ[id]||{}).fn||"")?2:0,coo:id=>/Standards|Finance/.test((BIZ[id]||{}).fn||"")?2:0,chro:id=>1,cio:id=>/Technology|IT service|Security/.test((BIZ[id]||{}).fn||"")?2:0,ciso:id=>/Security|Technology/.test((BIZ[id]||{}).fn||"")?2:0,caio:id=>R18.app(id)&&arr(R18.app(id).ai).length?2:0};
function behind(l,f){const rel=relevance[l.id]||(()=>1);const list=f.rows.filter(r=>BIZ[r.a.id]&&BIZ[r.a.id].kpi).map(r=>({r,b:BIZ[r.a.id],w:rel(r.a.id)})).sort((a,b)=>(b.w-a.w)||(b.r.a.users||0)-(a.r.a.users||0)).slice(0,6);
 return `<section class="card glass r18-behind"><div class="cardhead"><div><h3>What is behind the numbers</h3><span class="muted small">The work these figures come from, in the words of the function that does it. Select a card for the process, the data and the guardrails.</span></div></div><div class="r18-bg">${list.map(({r,b})=>`<article class="r18-bc"><div class="r18-bc-h"><span class="pill mute">${H(b.fn)}</span><b>${H(r.a.n)}</b></div><div class="r18-bc-n"><b>${H(fmtBig(b))}</b><span>${H(b.did)} <em>${H(b.per)}</em></span></div>${b.kpi?`<div class="r18-bc-k"><span>${H(b.kpi)}</span><b>${H(chg(b))}</b></div>`:""}<div class="r18-bc-f"><span class="r18-bc-o">${H(r.m.owner||"No owner")}</span><button class="btn quiet" type="button" data-r18-app="${H(r.a.id)}">Open</button></div></article>`).join("")}</div></section>`}
function safety(f){const x=figs();return `<section class="card glass r18-safe"><div class="cardhead"><div><h3>How safely it runs</h3><span class="muted small">The guardrails behind every tool above, in one line.</span></div><button class="btn quiet" type="button" data-go="r18_builds">Open My builds</button></div><div class="r18-sf"><div><b>${f.P.cov}%</b><span>of guardrails in place</span></div><div><b>${f.fails}</b><span>security checks failing</span></div><div><b>${f.ac.pending||0}</b><span>data requests waiting</span></div><div><b>${f.rows.length-f.killOk}</b><span>stop buttons not yet tested</span></div><div><b>${f.P.noOwner}</b><span>${f.P.noOwner===1?"tool":"tools"} without a backup owner</span></div></div></section>`}
function lensScreen(){const l=lensOf(),f=figs();const pb=l.id==="caio"||ST.showPb?R18.playbook&&R18.playbook(f):null;
 const exec=l.exec;const strip=R18.LENSES.map(x=>`<button type="button" class="r18-lopt ${x.id===l.id?"on":""}" data-r18-lens="${H(x.id)}" aria-pressed="${x.id===l.id}"><b>${H(x.short)}</b><span>${H(x.exec||"")}</span></button>`).join("");
 return `<div class="screen r18-screen r18-lensx">${hero("Oversee · Executive lens · "+l.short,l.q,"The "+l.name+" lens in this organization is held by "+(exec||"the role")+". Switch lens to see the same work the way another executive weighs it. Figures are illustrative demo data.")}
 <section class="r18-lbar" aria-label="Choose a lens">${strip}</section>
 <section class="r18-quote glass"><div class="r18-qwho">${G(()=>avatar(exec,{size:44}),"")}<div><b>${H(exec||"")}</b><small>${H(l.execRole||"")}</small></div></div><p>${H(sayOf(l,f))}</p></section>
 <div class="r18-btiles">${tile("v",l.v,f)}${tile("c",l.c,f)}${tile("r",l.r,f)}</div>
 ${behind(l,f)}
 ${pb?`<section class="card glass"><div class="cardhead"><div><h3>If you had a Chief AI Officer, this is what they would make you do</h3><span class="muted small">Done for you on every tool, with no one to hire.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Duty</th><th>State</th><th>Evidence</th><th class="n"></th></tr></thead><tbody>${pb.map(p=>`<tr><td><b>${H(p.t)}</b></td><td>${pill(R18.stateText[p.s],R18.stateClass[p.s])}</td><td>${H(p.d)}</td><td class="n"><button class="btn quiet" type="button" data-go="${H(p.go)}">Open</button></td></tr>`).join("")}</tbody></table></div></section>`:`<p class="small muted"><button class="btn quiet" type="button" data-r18-pb="1">Show the Chief AI Officer playbook</button></p>`}
 ${safety(f)}
 <p class="small muted">The strategy view: <button class="r18-lk" type="button" data-go="r18_strategy">How each function enables the strategy</button></p>
 ${typeof procCard==="function"?procCard("r18_lens"):""}</div>`}
REG("r18_lens","Executive lenses","lens","M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",lensScreen);
R18.lensHome=function(){const l=lensOf(),f=figs();const k=l.v[1](f)[0],c=l.c[1](f)[0],r=l.r[1](f)[0];
 const t=(tone,x)=>`<div class="r18-hs r18-hs-${tone}"><span class="r18-vk">${tone==="v"?"Value":tone==="c"?"Cost":"Risk"}</span><b>${H(x[1])}</b><span class="small muted">${H(x[0])}</span></div>`;
 return `<section class="card glass r18-homelens" aria-label="Executive lens"><div class="r18-hl-h"><div><div class="eyebrow">${H(l.short)} lens · ${H(l.exec||"")}</div><h3>${H(l.q)}</h3></div><button type="button" class="btn quiet" data-go="r18_lens">Open</button></div><p class="small muted r18-hl-x">A lens is how one executive weighs value, cost and risk. It changes the question and these three figures, never what you can open or change. Switch it from the Lens button in the top bar.</p><div class="r18-hl-row">${t("v",k)}${t("c",c)}${t("r",r)}</div></section>`};
/* grammar on lens screens everywhere */
})();
