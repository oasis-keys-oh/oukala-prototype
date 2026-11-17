/* PR-106 phase 1 (COO and CFO), PR-103, PR-108: the simplified CxO Home.
   Three bands of three: the top 3 numbers, the top 3 decisions, the top 3 to watch. Everything the Home showed before sits behind one
   "Show details" control in the same order, so nothing is cut (R3, R38). Built once as a per-persona configuration (CFG): phase 2 adds
   the other CxO personas by adding an entry here, not by writing another page. Numbers come from the persona's own profile (R21H), so
   "Choose what matters to you" still applies. Every tile and row carries a data-state label (R29); one target per metric (R25).
   Brief: CxO Simplified Home and Demo Nav Spec 2026-11-16 (vault, Enterprise Work Platform / Development). */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=U.esc;
const M=id=>G(()=>METRICS[id],null);

/* ---------- PR-108: the owner and a different backup for the numbers on the CFO Home (R12). The same owner shows on the COO Home for MWLS (R6). ----------
   Sample data: in a real company the owner is whoever holds the role. */
const ROLE={fpa:"Director of Financial Planning and Analysis",rep:"Director of Financial Reporting and Controls",ctl:"Controller"};
const OWNERS={m_budvar:["fpa","ctl"],m_biz_close:["ctl","rep"],m_mwls:["rep","ctl"]};
/* the person is found by the role they hold (R12: a role, not a name, is what the metric is accountable to), so no sample name is written here */
const holder=k=>G(()=>DIR.find(d=>d.kind==="human"&&d.role===ROLE[k]).name,null);
function applyOwners(){Object.keys(OWNERS).forEach(id=>{const m=M(id),o=holder(OWNERS[id][0]),b=holder(OWNERS[id][1]);if(m&&o&&b){m.owner=o;m.bak=b}})}
applyOwners();

/* ---------- per-persona configuration ----------
   watch.pin: the items the brief names for the role, always shown first. watch.pool: metrics ranked by the rule (off target first, then the
   one that moved most, a crossing of its target counts extra) to fill what the pins leave free. */
const WHY={
 m_spend_var:"Spend above the approved plan has to be paid for by cutting something else.",
 m_biz_dso:"Dues that arrive late leave less cash to run on.",
 m_biz_cycle:"The longer a standard takes, the longer members wait on it.",
 m_biz_renew:"Members who do not renew leave a hole in next year's income.",
 m_biz_comment:"Comments left unanswered slow every ballot behind them.",
 m_biz_ballot:"A ballot that misses quorum has to be run again.",
 m_biz_lic:"Licensing requests that wait cost the members who asked.",
 m_biz_conf:"Event registrations set how much of the cost the event recovers.",
 m_apsla:"Approvals past their service level hold up the people waiting on them.",
 m_apcycle:"Slow approvals delay payment and the work behind it.",
 m_cycle:"Invoices that wait too long cost late fees and goodwill.",
 m_budgetburn:"Cloud spend over its monthly budget eats the room left for the rest of the year.",
 m_capex:"Capital spend off plan changes what can be funded next."};
/* shorter names where the full metric name would wrap the tile heading on a narrower fallback font */
const SHORT={m_budgetburn:"Cloud spend vs budget"};
const CFG={
 coo:{watch:{pin:[{metric:"m_spend_var",head:"Cost to serve"},{proc:true}],pool:["m_biz_cycle","m_biz_renew","m_biz_comment","m_biz_ballot","m_biz_lic","m_biz_conf"]}},
 cfo:{watch:{pin:[{held:true},{metric:"m_biz_dso",head:"Cash collection"}],pool:["m_apsla","m_apcycle","m_cycle","m_budgetburn","m_capex"]}}};

/* ---------- helpers ---------- */
const stOf=m=>G(()=>mstat(m),"good");
const stCls=s=>s==="good"?"good":s==="warn"?"warn":"bad";
const stTxt=s=>s==="good"?"On target":s==="warn"?"Watch":"Off target";
const dsLabel=(m,hint)=>(m&&m.label==="simulated")||hint==="simulated"?"Simulated":"Modeled";
const fmtUsd=n=>n==null?"":G(()=>U.money(n),"");
/* PR-46 is the copy sweep for real brand names in seed data; until it lands, rows on this Home never show them (R32) */
const clean=s=>String(s==null?"":s).replace(/Contoso Cloud Operations/g,"The cloud operations provider").replace(/\bAzure\b/g,"Cloud").replace(/\bLumen\b/g,"Search vendor");
const lab=t=>`<span class="cxo-lab">${E(t)}</span>`;
const tgtTxt=m=>`target ${m.dir==="max"?"at least":"at most"} ${mfmt(m,m.tgt)}`;
function trend(m){const t=(m.tr||[]).filter(v=>typeof v==="number");if(t.length<2)return"";const p=t[t.length-2],c=+m.cur;if(!isFinite(c))return"";
 if(Math.abs(c-p)<1e-9)return"Flat";return(c>p?"Up":"Down")+" from "+mfmt(m,p)}
const dueTxt=x=>{const d=x.dueH;if(d==null)return["Waiting","mute"];
 if(d<0){const dd=Math.round(-d/24);return[dd>=1?"Overdue "+dd+" d":"Overdue "+Math.max(1,Math.round(-d))+" h","bad"]}
 if(d<=24)return["Due in "+Math.max(1,Math.round(d))+" h","warn"];return["Due in "+Math.round(d/24)+" d","mute"]};
const riskTxt={high:["High","bad"],med:["Medium","warn"],low:["Low","mute"]};

/* ---------- band 1: the top 3 numbers ---------- */
function numberTile(spec,k){const id=spec[0],m=M(id);if(!m)return"";const s=stOf(m),c=stCls(s),name=spec[1]||m.n,tr=trend(m);
 const own=m.owner&&m.bak?`<span class="cxo-own"><span class="cxo-ol">Owner</span>${ownerChip(m.owner,{size:18,role:"Owner",record:"metric:"+id})}<span class="cxo-ol">Backup</span>${ownerChip(m.bak,{size:18,role:"Backup",record:"metric:"+id})}</span>`:"";
 const trk=spec[2]&&G(()=>TRACKS.get(spec[2]).mission,null)?` data-trk-open="${E(spec[2])}"`:` data-r21-met="${E(id)}"`;
 const ds=dsLabel(m,spec[3]);
 return `<article class="card glass cxo-tile st-${c}" data-cxo-metric="${E(id)}"><span class="cxo-ds">${lab(ds)}</span><button type="button" class="cxo-main"${trk} aria-label="${E(name)}: ${E(mfmt(m))}, ${stTxt(s)}, ${tgtTxt(m)}, ${ds.toLowerCase()}. Open the trace."><span class="cxo-tl">${E(name)}</span><span class="cxo-vr"><span class="cxo-tv">${E(mfmt(m))}</span>${tr?`<span class="cxo-tr">${E(tr)}</span>`:""}</span><span class="cxo-tt"><i class="cxo-dot"></i>${stTxt(s)} · ${tgtTxt(m)}</span></button>${own?`<div class="cxo-meta">${own}</div>`:""}</article>`}

/* ---------- band 2: the top 3 decisions ---------- */
function topDecisions(k){const all=G(()=>R21H.decisions(k),[]);
 return all.slice().sort((a,b)=>{const da=a.dueH==null?1e9:a.dueH,db=b.dueH==null?1e9:b.dueH;return da-db||(b.amt||0)-(a.amt||0)}).slice(0,3)}
function decisionTile(x){const w=dueTxt(x),r=riskTxt[x.risk]||riskTxt.low;const can=x.kind==="approval"&&x.can&&x.can.approve;
 return `<article class="card glass cxo-dec" data-cxo-dec="${E(x.id)}"><div class="cxo-dh" role="heading" aria-level="3">${E(clean(x.title))}</div>
 <p class="cxo-dm">${x.req?`<span>${E(clean(x.req))}</span>`:""}${x.amt?`<span>${E(money(x.amt))}</span>`:""}<span class="pill ${w[1]}">${E(w[0])}</span><span class="pill ${r[1]}" title="Risk rating">${E(r[0])} risk</span></p>
 <div class="cxo-da"><button type="button" class="btn" data-inbx-item="${E(x.id)}" aria-label="Review ${E(clean(x.title))}">Review</button>${can?`<button type="button" class="btn primary" data-inbx-act="approve" data-id="${E(x.id)}" aria-label="Approve ${E(clean(x.title))}" title="Routes to the approval group for this item">Approve</button>`:""}${lab("Prototype fact")}</div></article>`}

/* ---------- band 3: the top 3 to watch ---------- */
function movedScore(m){const t=(m.tr||[]).filter(v=>typeof v==="number");if(t.length<2)return{mv:0,cross:false};const p=t[t.length-2],c=+m.cur,rng=Math.abs(m.max)||1;
 const was=G(()=>mstat(Object.assign({},m,{cur:p})),"good"),now=stOf(m);return{mv:Math.abs(c-p)/rng,cross:was==="good"&&now!=="good"}}
function metricWatch(id,head){const m=M(id);if(!m)return null;const s=stOf(m),mv=movedScore(m),tr=trend(m);
 const sev=s==="good"?0:s==="warn"?1:2;
 return{score:sev*1000+mv.mv*100+(mv.cross?5:0),head:head||SHORT[id]||m.n,fig:mfmt(m),state:stTxt(s),cls:stCls(s),line:(tr?tr+". ":"")+(WHY[id]||"It moved or is off target, so it is worth a look."),tgt:tgtTxt(m),ds:dsLabel(m),met:id}}
function procWatch(){const L=G(()=>PROCLIB.list(),[]).filter(p=>p.target>p.level).sort((a,b)=>(b.target-b.level)-(a.target-a.level)||String(a.name).localeCompare(b.name))[0];if(!L)return null;
 const gap=G(()=>PROCLIB.maturity(L.id).gaps[0],"");const wk=gap?gap.split(":")[0].toLowerCase():"";
 return{score:100,head:"Process with the biggest gap",fig:"Level "+L.level,state:"Target "+L.target,cls:"warn",line:`${L.name} is at level ${L.level} against a target of ${L.target}${wk?", weakest on "+wk:""}. A step that stalls here holds up the work behind it.`,ds:"Modeled",proc:L.id}}
function heldWatch(){const b=G(()=>R18.BIZ.ca_inv_exc,null);if(!b||b.held==null)return null;
 return{score:100,head:"Invoices held in exception",fig:money(b.held),state:b.stuck+" over ten days",cls:b.stuck>0?"warn":"good",line:"Held invoices delay payment to the vendors we depend on.",ds:"Modeled",go:"inv"}}
function watchItems(k,numIds){const w=CFG[k].watch,out=[];
 w.pin.forEach(p=>{const it=p.proc?procWatch():p.held?heldWatch():metricWatch(p.metric,p.head);if(it&&out.length<3)out.push(it)});
 const used=new Set(numIds.concat(w.pin.map(p=>p.metric).filter(Boolean)));
 w.pool.filter(id=>!used.has(id)).map(id=>metricWatch(id)).filter(Boolean).sort((a,b)=>b.score-a.score).forEach(it=>{if(out.length<3)out.push(it)});
 return out}
function watchTile(it){const trace=it.proc?`data-cxo-proc="${E(it.proc)}"`:it.go?`data-go="${E(it.go)}"`:`data-r21-met="${E(it.met)}"`;
 return `<article class="card glass cxo-watch st-${it.cls}" data-cxo-watch${it.tgt?` title="${E(it.tgt)}"`:""}><div class="cxo-dh" role="heading" aria-level="3">${E(it.head)}</div><span class="cxo-ds">${lab(it.ds)}</span><p class="cxo-wf"><b>${E(it.fig)}</b><span class="pill ${it.cls}">${E(it.state)}</span><button type="button" class="btn quiet cxo-tr2" ${trace}>Trace</button></p><p class="cxo-wl">${E(clean(it.line))}</p></article>`}

/* ---------- the page ---------- */
let OPEN=false;
const heroImg=k=>{const h=(W.HEROMAP||{})[k];return h?`<img class="cxo-img" src="hero/${h.f}.webp?v=21b" alt="" decoding="async" style="object-position:${E(h.pos||"50% 50%")}">`:""};
/* the My contribution card and the role pins are placed after render by other modules (mod_s_contrib, mod_nav); pass() moves them behind Show details and fills the one-line summary */
function pass(){const h=D.querySelector("#view .cxo-home");if(!h)return;const di=h.querySelector(".cxo-di");if(!di)return;
 const pins=h.querySelector(":scope > .nx-hpins"),card=h.querySelector(":scope > .ctb-card");
 const anchor=di.querySelector(":scope > .r21-hero");
 [pins,card].filter(Boolean).reverse().forEach(n=>{if(anchor)anchor.insertAdjacentElement("afterend",n);else di.insertAdjacentElement("afterbegin",n)});
 const c=di.querySelector(".ctb-card"),slot=h.querySelector("[data-cxo-slot]");if(!slot)return;
 const m=c&&c.textContent.replace(/\s+/g," ").match(/([\d.]+) points of the company score/);
 slot.innerHTML=m?`<button type="button" class="cxo-contrib" data-cxo-contrib>Your work moves ${E(m[1])} points of the company score, modeled</button>`:""}
/* the inbox can finish loading just after the first Home render (persona switch or first visit): repaint once if decisions have since arrived */
let POLL=0;
function refill(n){const h=D.querySelector("#view .cxo-home");if(!h)return;const k=h.getAttribute("data-cxo-home");
 if(!h.querySelector('[aria-labelledby="cxo-d"] .cxo-empty'))return;
 if(G(()=>R21H.decisions(k).length,0)>0){G(()=>render());return}
 if((n||0)<8){clearTimeout(POLL);POLL=setTimeout(()=>refill((n||0)+1),400)}}
G(()=>HOOKS.on("afterRender",()=>{G(pass);G(()=>refill(0))},{id:"cxo.pass",order:1300}));
function build(h,k){const cf=CFG[k],p=G(()=>R21H.profiles[k],null);if(!cf||!p)return h;
 const T=D.createElement("template");T.innerHTML=h;const root=T.content.firstElementChild;if(!root||!/\bscreen\b/.test(root.className))return h;
 const kids=[...root.children];const lead=kids.filter(c=>/stn-chip/.test(c.className)),rest=kids.filter(c=>lead.indexOf(c)<0);
 const me=G(()=>R15D.me(),{first:"there"});
 const top=G(()=>R21H.effTop(k),p.top);
 const nums=top.map(s=>numberTile(s,k)).join("");
 const decs=topDecisions(k),nDec=G(()=>R21H.decisions(k).length,decs.length);
 const decHtml=decs.map(decisionTile).join("")||`<p class="muted small cxo-empty">Nothing is waiting on you that only you can decide.</p>`;
 const watch=watchItems(k,top.map(s=>s[0]));
 const watchHtml=watch.map(watchTile).join("")||`<p class="muted small cxo-empty">Nothing has moved or crossed a target.</p>`;
 const hero=`<section class="cxo-hero"><div class="cxo-art" aria-hidden="true">${heroImg(k)}</div><div class="cxo-hc"><div class="cxo-who"><h1>Welcome, ${E(me.first)}.</h1><p>${E(p.sub)} · ${E(G(()=>NOW.day,"Today"))} · ${E(G(()=>DATA.tenantInfo().org,""))}</p></div><span data-cxo-slot></span></div></section>`;
 const band=(id,title,sub,body,extra)=>`<section class="cxo-band" aria-labelledby="cxo-${id}"><div class="cxo-bh"><h2 id="cxo-${id}">${E(title)}</h2><span class="muted small">${E(sub)}</span>${extra||""}</div><div class="cxo-g">${body}</div></section>`;
 const det=`<details class="cxo-details"${OPEN?" open":""}><summary><span class="cxo-sh">Show details</span><span class="muted small">Everything that was on this Home, in the same order.</span></summary><div class="cxo-di">${rest.map(c=>c.outerHTML).join("")}</div></details>`;
 root.className="screen r21-home cxo-home";root.setAttribute("data-cxo-home",k);
 root.innerHTML=lead.map(c=>c.outerHTML).join("")+hero
  +band("n","Your three numbers","Each opens its trace.",nums)
  +band("d","Your top three decisions","Ranked by due date, then value.",decHtml,`<button type="button" class="btn quiet cxo-all" data-go="inbox">All decisions (${nDec})</button>`)
  +band("w","Three to watch","What moved or is off target since the last period.",watchHtml)
  +det;
 return root.outerHTML}

function install(){const R=(typeof _R!=="undefined"?_R:W._R);if(!R||!R.home||R.home.__cxo)return;const prev=R.home;
 const f=function(){const h=prev.apply(this,arguments);const k=S.persona;if(!CFG[k])return h;try{return build(h,k)}catch(e){console.error("cxo home",e);return h}};f.__cxo=1;R.home=f}
try{install()}catch(e){console.error(e)}

/* ---------- clicks ---------- */
D.addEventListener("click",e=>{const T=e.target.closest&&e.target.closest.bind(e.target);if(!T)return;let t;
 if(T("[data-cxo-contrib]")){e.preventDefault();const d=D.querySelector(".cxo-details");if(d){d.open=true;OPEN=true;const c=d.querySelector(".ctb-card");if(c&&c.scrollIntoView)c.scrollIntoView({block:"start",behavior:"smooth"})}return}
 if(t=T("[data-cxo-proc]")){e.preventDefault();G(()=>PROCLIB.open(t.dataset.cxoProc));return}});
D.addEventListener("toggle",e=>{const d=e.target;if(d&&d.classList&&d.classList.contains("cxo-details"))OPEN=d.open},true);
W.CXOHOME={config:CFG,owners:OWNERS,watch:watchItems,decisions:topDecisions,applyOwners};
})();
