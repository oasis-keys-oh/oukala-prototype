/* ===== mod_s_exp_company: Bring your company, the setup (DC-43). Prefix xco-. Opens with PACKGEN.openSetup() or ?company=1.
   Three questions with smart defaults (name, industry, what hurts most), about a minute; size and seat are inferred and can be
   changed under "Adjust". PACKGEN (mod_s_packgen.js) builds the tenant pack in the browser, runs the gen_pack checks and
   registers it; the buyer lands in their own company. Everything generated is labeled simulated. The company name stays in this
   browser (U.store "exp.company", this session only) and is never sent anywhere. A native dialog, so no z-index is needed. ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>U.esc(s);
const PG=W.PACKGEN=W.PACKGEN||{};
const ST={step:0,a:{name:"",industry:"",other:"",pain:"",size:"m",role:""},res:null,adj:false};
const INDS=[["health","Healthcare"],["mining","Mining and operational technology"],["storage","Storage and backup"],["standards","Standards and publishing"],["manufacturing","Manufacturing"],["finserv","Financial services"],["public","Public sector"],["retail","Retail"]];
const PAINS=[["speed","Work takes too long"],["cost","Spend runs ahead of plan"],["customer","Customers wait or leave"],["risk","Incidents and audit findings"],["people","Teams are stretched thin"]];
const SIZES=[["s","Under 1,000 people"],["m","1,000 to 10,000"],["l","10,000 to 50,000"],["xl","Over 50,000"]];
const SEATS=[["coo","Operations"],["cfo","Finance"],["cio","Technology"],["ciso","Security"],["ceo","Chief executive"]];
const SHOWS=[["exe_strat","Your strategy","Objectives, key results and funded work"],["bst","Trace your budget","From objective to invoice"],["orgassist","Your organization","Leaders, teams and agents"],["metrics","Your metrics","Owner, formula and target for each"],["ppl_jrny","Your journeys","Reused from the closest sample"],["exe_mat","Your process maturity","Six dimensions and a target"]];
const sim=`<span class="pill info" title="Generated in this browser from your answers. No data leaves the page.">Simulated</span>`;
/* the seat defaults to the role the Showroom is running for, else operations */
const defRole=()=>G(()=>{const s=W.EXP&&EXP.state&&EXP.state();return s&&s.role},null)||G(()=>({fin:"cfo",exec:"coo",ops:"cio"})[S.persona],null)||"coo";
const chip=(k,v,l,on)=>`<button type="button" class="chip xco-chip" data-xco-set="${k}|${E(v)}" aria-pressed="${on}">${E(l)}</button>`;

function q1(){return `<label class="xco-q" for="xcoName"><span class="xco-n">1 of 3</span><b>What is your company called?</b></label>
 <input id="xcoName" class="xco-in" type="text" maxlength="60" autocomplete="off" spellcheck="false" placeholder="Your company" value="${E(ST.a.name)}" data-xco-name>
 <p class="muted small">Used only in this browser to name your sample. Nothing is sent anywhere, and it is forgotten after this session.</p>`}
function q2(){const m=G(()=>PG.match(ST.a.industry||ST.a.other),null);const lab=m?(INDS.find(x=>x[0]===m.id)||[])[1]:"";
 return `<div class="xco-q"><span class="xco-n">2 of 3</span><b>Which industry is closest?</b></div>
 <div class="xco-chips" role="group" aria-label="Industry">${INDS.map(([k,l])=>chip("industry",k,l,ST.a.industry===k)).join("")}</div>
 <label class="xco-other"><span class="muted small">Or type yours</span><input type="text" class="xco-in" maxlength="60" placeholder="For example, logistics" value="${E(ST.a.other)}" data-xco-other></label>
 ${ST.a.other&&!ST.a.industry?`<p class="small" data-xco-match>${m&&!m.fallback?"Closest: <b>"+E(lab)+"</b>.":"No close match, so it builds on <b>"+E(lab)+"</b>, the sample nearest to the default company."}</p>`:""}`}
function q3(){return `<div class="xco-q"><span class="xco-n">3 of 3</span><b>What hurts most right now?</b></div>
 <div class="xco-chips" role="group" aria-label="What hurts most">${PAINS.map(([k,l])=>chip("pain",k,l,ST.a.pain===k)).join("")}</div>
 <details class="xco-adj"${ST.adj?" open":""}><summary>Adjust size and seat (inferred)</summary>
 <div class="xco-chips" role="group" aria-label="Size">${SIZES.map(([k,l])=>chip("size",k,l,ST.a.size===k)).join("")}</div>
 <div class="xco-chips" role="group" aria-label="Your seat">${SEATS.map(([k,l])=>chip("role",k,l,(ST.a.role||defRole())===k)).join("")}</div></details>`}
function building(){return `<div class="xco-build" role="status" aria-live="polite"><b>Building your company in this browser</b><ol class="xco-steps">${["Organization, leaders and people","Owners and different backups on every record","Journeys and workflows from the closest sample","Processes with maturity and targets","Projects, budget lines and invoices","Metrics, objectives and key results","Checks: links, owners, definitions, names"].map((t,i)=>`<li style="--i:${i}">${E(t)}</li>`).join("")}</ol></div>`}
function result(){const r=ST.res;if(!r)return"";
 if(!r.ok)return `<div class="xco-res"><b>The generated pack did not pass its checks, so nothing was loaded.</b><ul class="small">${r.errors.slice(0,6).map(e=>`<li>${E(e)}</li>`).join("")}</ul><div class="xco-act"><button type="button" class="btn" data-xco="back">Change an answer</button></div></div>`;
 const rows=r.pack.rows,n=k=>(rows[k]||[]).length,tot=Object.keys(rows).reduce((a,k)=>a+n(k),0);const info=r.pack.info;
 const chk=["Every link resolves","Every record has an owner and a different backup","Every metric has a formula, baseline, target and remediation","Every process has six maturity dimensions and a target","No em dash, banned or real names","No other company's names, no shared people names"];
 const ms=G(()=>W.EXP&&EXP.list?EXP.list({tenant:r.id,role:ST.a.role||defRole()}):[],[])||[];
 return `<div class="xco-res"><div class="eyebrow">${E(info.industry)} · ${E(info.kind)}</div><h3>Welcome to ${E(info.org)}</h3><p data-role="story">${E(info.story)}</p>
 <div class="xco-tiles">${[["People and agents",n("people")],["Objectives",n("objectives")],["Projects",n("projects")],["Budget lines",n("budget_lines")],["Metrics",n("metrics")],["Processes",n("processes")]].map(([l,v])=>`<div class="xco-tile"><span class="num">${v}</span><small>${E(l)}</small></div>`).join("")}</div>
 <p class="small muted">${tot} records generated in ${E(String(r.ms||0))} ms. ${r.notes&&r.notes.length?E(r.notes.join(" ")):""}</p>
 <ul class="xco-chk" aria-label="Checks passed">${chk.map(c=>`<li>${E(c)}</li>`).join("")}</ul>
 <div class="xco-go">${SHOWS.map(([id,l,d])=>`<button type="button" class="xco-card" data-xco-go="${id}"><b>${E(l)}</b><small>${E(d)}</small></button>`).join("")}</div>
 ${ms.length?`<div class="xco-act"><span class="muted small">Try it in your company:</span>${ms.slice(0,3).map(m=>`<button type="button" class="btn primary" data-xco-mission="${E(m.id)}">${E(m.title)}</button>`).join("")}</div>`:""}
 <div class="xco-act">${sim}<span class="muted small">Every figure is generated sample data. Tenant isolation is simulated.</span><button type="button" class="btn quiet" data-xco="forget">Forget my company</button></div></div>`}
function body(){if(ST.step===4)return result();if(ST.step===3)return building();
 const can=ST.step!==1||ST.a.industry||ST.a.other;
 return `${[q1,q2,q3][ST.step]()}<div class="xco-act"><div class="xco-dots" aria-hidden="true">${[0,1,2].map(i=>`<i class="${i===ST.step?"on":i<ST.step?"done":""}"></i>`).join("")}</div>
 ${ST.step?`<button type="button" class="btn quiet" data-xco="back">Back</button>`:""}${ST.step<2?`<button type="button" class="btn primary" data-xco="next"${can?"":" disabled"}>Next</button>`:`<button type="button" class="btn primary" data-xco="build">Build my company</button>`}</div>`}
function dlg(){let d=D.getElementById("xcoDlg");if(d)return d;d=D.createElement("dialog");d.id="xcoDlg";d.className="xco glass";d.setAttribute("aria-labelledby","xcoT");d.setAttribute("data-rsh-skip","1");d.setAttribute("data-tenant-chooser","1");
 d.innerHTML=`<div class="xco-h"><div><div class="eyebrow">Showroom · Bring your company ${sim}</div><h2 id="xcoT">Your company in about a minute</h2></div><button type="button" class="btn quiet xco-x" data-xco="close" aria-label="Close">&times;</button></div><div class="xco-b" data-xco-body></div>`;
 d.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.matches&&e.target.matches("input")){e.preventDefault();act(ST.step<2?"next":"build")}});
 d.addEventListener("input",e=>{const t=e.target;if(t.matches("[data-xco-name]"))ST.a.name=t.value;else if(t.matches("[data-xco-other]")){ST.a.other=t.value;if(t.value)ST.a.industry="";paint(true)}});
 D.body.appendChild(d);return d}
function paint(keepFocus){const d=dlg();const b=d.querySelector("[data-xco-body]");const a=D.activeElement;const k=a&&a.matches&&a.matches("[data-xco-other]")?"[data-xco-other]":null;b.innerHTML=body();
 if(keepFocus&&k){const n=b.querySelector(k);if(n){n.focus();try{n.setSelectionRange(n.value.length,n.value.length)}catch(e){}}}
 else{const f=b.querySelector("input,[data-xco=next],[data-xco=build],.xco-card");if(f&&ST.step!==3)G(()=>f.focus())}}
function open(o){o=o||{};const d=dlg();const c=G(()=>PG.current(),null);
 if(o.reset||!d.open){ST.step=0;ST.res=null;if(c&&!o.reset){Object.assign(ST.a,{name:c.answers.name||"",industry:c.answers.industry||"",pain:c.answers.pain||"",size:c.answers.size||"m",role:c.answers.role||""})}}
 if(o.answers)Object.assign(ST.a,o.answers);paint();if(!d.open)G(()=>d.showModal(),G(()=>d.setAttribute("open",""),0));return d}
function close(){const d=D.getElementById("xcoDlg");if(d&&d.open)G(()=>d.close(),G(()=>d.removeAttribute("open"),0))}
function answers(){const a=ST.a;return{name:a.name,industry:a.industry||a.other,pain:a.pain||"speed",size:a.size||"m",role:a.role||defRole()}}
function build(){ST.step=3;paint();
 /* the steps animate for a moment so the buyer sees what is made; the generation itself takes well under a second */
 setTimeout(()=>{let r;const t0=performance.now();try{r=PG.fromAnswers(answers())}catch(e){r={ok:false,errors:[String(e&&e.message||e)]}}r.ms=Math.round(performance.now()-t0);ST.res=r;ST.step=4;paint()},1200)}
function act(k){if(k==="close")return close();if(k==="back"){ST.step=ST.step>=3?2:Math.max(0,ST.step-1);return paint()}
 if(k==="next"){if(ST.step===1&&!ST.a.industry&&!ST.a.other)return;ST.step++;return paint()}
 if(k==="build")return build();
 if(k==="forget"){G(()=>PG.forget());ST.res=null;ST.step=0;ST.a.name="";close();G(()=>toast("Your company was removed from this browser","good"))}}
G(()=>ROUTER.on("click","[data-xco],[data-xco-set],[data-xco-go],[data-xco-mission]",(e,el)=>{const d=el.dataset;
 if(d.xco)return act(d.xco);
 if(d.xcoSet){const [k,v]=d.xcoSet.split("|");ST.a[k]=ST.a[k]===v&&k!=="size"&&k!=="role"?"":v;if(k==="industry"&&ST.a.industry)ST.a.other="";if(k==="size"||k==="role")ST.adj=true;return paint()}
 if(d.xcoGo){close();G(()=>go(d.xcoGo));return}
 if(d.xcoMission){close();G(()=>EXP.start(d.xcoMission,{tenant:ST.res&&ST.res.id,role:answers().role,mode:"self"}))}},{id:"xco-click"}));
G(()=>ROUTER.on("click","[data-company-setup]",()=>open(),{id:"xco-open"}));
PG.openSetup=open;PG.closeSetup=close;PG._setupState=()=>JSON.parse(JSON.stringify({step:ST.step,a:ST.a,ok:ST.res&&ST.res.ok}));
G(()=>SEARCHX.push(()=>[{g:"Go to",t:"Bring your company",m:"Your own company as a sample tenant in about a minute (simulated)",c:"--p4",f:()=>open(),k:"bring your company setup my company generate tenant showroom experience"}]));
G(()=>{if(new URLSearchParams(location.search).get("company"))setTimeout(()=>open(),900)});
})();
