/* PR-106 phase 1 (COO and CFO), PR-103, PR-108, PR-111: the simplified CxO Home.
   Top to bottom: the original hero with its three metric tiles (unchanged), "Your top three decisions" as aligned rows, "Three to watch" as
   metric panels, then everything else the Home showed before behind one "Show details" control in the same order, so nothing is cut (R3, R38).
   Built once as a per-persona configuration (CFG): phase 2 adds the other CxO personas by adding an entry here, not by writing another page.
   Numbers come from the persona's own profile (R21H), so "Choose what matters to you" still applies. Every watch panel carries a data-state
   label (R29); one target per metric (R25). PR-111 (Omar, 2026-11-17): the numbers band, the contribution band and the Prototype fact label are gone;
   My contribution stays in the DOM behind Show details (tools/tests/contrib.js reads it there) but is no longer a headline.
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
   Three to watch is built from "What you care about": the metrics behind the role's topics (R21H.care: the role defaults, or what the person
   chose with "Choose what matters to you"), minus the three numbers already in the hero, ranked off target first (then the one that moved most,
   a crossing of its target counts extra, then the order the topics list them). The top three are shown. pool is only a fallback when the topics
   leave fewer than three. */
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
/* shorter names where the full metric name would wrap the panel heading on a narrower fallback font */
const SHORT={m_budgetburn:"Cloud spend vs budget",m_spend_var:"Cost to serve"};
const CFG={
 coo:{pool:["m_biz_cycle","m_biz_renew","m_biz_comment","m_biz_ballot","m_biz_lic","m_biz_conf"]},
 cfo:{pool:["m_apsla","m_apcycle","m_cycle","m_budgetburn","m_capex"]}};

/* ---------- helpers ---------- */
const stOf=m=>G(()=>mstat(m),"good");
const stCls=s=>s==="good"?"good":s==="warn"?"warn":"bad";
const stTxt=s=>s==="good"?"On target":s==="warn"?"Watch":"Off target";
const dsLabel=m=>m&&m.label==="simulated"?"Simulated":"Modeled";
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

/* ---------- band 1: the top 3 decisions (one aligned row each) ---------- */
function topDecisions(k){const all=G(()=>R21H.decisions(k),[]);
 return all.slice().sort((a,b)=>{const da=a.dueH==null?1e9:a.dueH,db=b.dueH==null?1e9:b.dueH;return da-db||(b.amt||0)-(a.amt||0)}).slice(0,3)}
function decisionRow(x){const w=dueTxt(x),r=riskTxt[x.risk]||riskTxt.low;const can=x.kind==="approval"&&x.can&&x.can.approve;
 return `<article class="card glass cxo-dec" data-cxo-dec="${E(x.id)}"><div class="cxo-dt"><div class="cxo-dh" role="heading" aria-level="3">${E(clean(x.title))}</div>
 <p class="cxo-dm">${x.req?`<span>${E(clean(x.req))}</span>`:""}${x.amt?`<span>${E(money(x.amt))}</span>`:""}</p></div>
 <span class="cxo-dc cxo-dr"><span class="pill ${r[1]}" title="Risk rating">${E(r[0])} risk</span></span><span class="cxo-dc cxo-dw"><span class="pill ${w[1]}">${E(w[0])}</span></span>
 <div class="cxo-da"><button type="button" class="btn" data-inbx-item="${E(x.id)}" aria-label="Review ${E(clean(x.title))}">Review</button>${can?`<button type="button" class="btn primary" data-inbx-act="approve" data-id="${E(x.id)}" aria-label="Approve ${E(clean(x.title))}" title="Routes to the approval group for this item">Approve</button>`:""}</div></article>`}

/* ---------- band 2: the top 3 to watch (metric panels, the hero tile's family) ---------- */
function movedScore(m){const t=(m.tr||[]).filter(v=>typeof v==="number");if(t.length<2)return{mv:0,cross:false};const p=t[t.length-2],c=+m.cur,rng=Math.abs(m.max)||1;
 const was=G(()=>mstat(Object.assign({},m,{cur:p})),"good"),now=stOf(m);return{mv:Math.abs(c-p)/rng,cross:was==="good"&&now!=="good"}}
function metricWatch(id,rank){const m=M(id);if(!m)return null;const s=stOf(m),mv=movedScore(m);
 const sev=s==="good"?0:s==="warn"?1:2;
 return{id,rank,score:sev*1000+mv.mv*100+(mv.cross?5:0),head:SHORT[id]||m.n,fig:mfmt(m),state:stTxt(s),cls:stCls(s),trend:trend(m),tgt:tgtTxt(m),ds:dsLabel(m),why:WHY[id]||"",tr:m.tr}}
/* the candidates are the role's topics ("What you care about"): each topic's lead metric and the metrics listed under it, in topic order */
function careIds(k){const out=[];G(()=>R21H.care(k),[]).forEach(c=>{[c.p.lead].concat(c.p.rows||[]).forEach(id=>{if(id&&out.indexOf(id)<0)out.push(id)})});return out}
function watchItems(k,numIds){const cf=CFG[k]||{pool:[]},used=new Set(numIds),out=[];
 const add=id=>{if(used.has(id)||out.some(o=>o.id===id))return;const it=metricWatch(id,out.length);if(it)out.push(it)};
 careIds(k).forEach(add);if(out.length<3)cf.pool.forEach(add);
 return out.sort((a,b)=>b.score-a.score||a.rank-b.rank).slice(0,3)}
function watchPanel(it){
 return `<article class="card glass cxo-watch cxo-wp st-${it.cls}" data-cxo-watch data-cxo-wid="${E(it.id)}"${it.why?` title="${E(it.why)}"`:""}><span class="cxo-ds">${lab(it.ds)}</span><span class="cxo-tl">${E(it.head)}</span>
 <span class="cxo-vr"><span class="cxo-tv">${E(it.fig)}</span>${it.trend?`<span class="cxo-trd">${E(it.trend)}</span>`:""}</span>
 <span class="cxo-tt"><span class="pill ${it.cls}">${E(it.state)}</span><span>${E(it.tgt)}</span></span>
 <span class="cxo-wb">${G(()=>R21H.spark(it.tr,"currentColor",130,30),"")}<button type="button" class="btn quiet cxo-tr2" data-r21-met="${E(it.id)}" aria-label="Trace ${E(it.head)}">Trace</button></span></article>`}

/* ---------- the page ---------- */
let OPEN=false;
/* the My contribution card and the role pins are placed after render by other modules (mod_s_contrib, mod_nav) right after the hero; pass() moves them behind Show details, in their old order (pins, then the card) */
function pass(){const h=D.querySelector("#view .cxo-home");if(!h)return;const di=h.querySelector(".cxo-di");if(!di)return;
 const pins=h.querySelector(":scope > .nx-hpins"),card=h.querySelector(":scope > .ctb-card");
 [pins,card].filter(Boolean).reverse().forEach(n=>di.insertAdjacentElement("afterbegin",n))}
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
 const hero=rest.find(c=>/\br21-hero\b/.test(c.className));if(!hero)return h;
 const top=G(()=>R21H.effTop(k),p.top);
 const decs=topDecisions(k),nDec=G(()=>R21H.decisions(k).length,decs.length);
 const decHtml=decs.length?`<div class="cxo-dlist"><div class="cxo-dcols" aria-hidden="true"><span>Decision</span><span class="cxo-dr">Risk</span><span class="cxo-dw">Time left</span><span></span></div>${decs.map(decisionRow).join("")}</div>`:`<p class="muted small cxo-empty">Nothing is waiting on you that only you can decide.</p>`;
 const watch=watchItems(k,top.map(s=>s[0]));
 const watchHtml=watch.map(watchPanel).join("")||`<p class="muted small cxo-empty">Nothing has moved or crossed a target.</p>`;
 const band=(id,title,sub,body,extra)=>`<section class="cxo-band" aria-labelledby="cxo-${id}"><div class="cxo-bh"><h2 id="cxo-${id}">${E(title)}</h2><span class="muted small">${E(sub)}</span>${extra||""}</div>${body}</section>`;
 const det=`<details class="cxo-details"${OPEN?" open":""}><summary><span class="cxo-sh">Show details</span><span class="muted small">Everything else that was on this Home, in the same order.</span></summary><div class="cxo-di">${rest.filter(c=>c!==hero).map(c=>c.outerHTML).join("")}</div></details>`;
 root.className="screen r21-home cxo-home";root.setAttribute("data-cxo-home",k);
 root.innerHTML=lead.map(c=>c.outerHTML).join("")+hero.outerHTML
  +band("d","Your top three decisions","Ranked by due date, then value.",decHtml,`<button type="button" class="btn quiet cxo-all" data-go="inbox">All decisions (${nDec})</button>`)
  +band("w","Three to watch","Off target first, from what you care about.",`<div class="cxo-g">${watchHtml}</div>`)
  +det;
 return root.outerHTML}

function install(){const R=(typeof _R!=="undefined"?_R:W._R);if(!R||!R.home||R.home.__cxo)return;const prev=R.home;
 const f=function(){const h=prev.apply(this,arguments);const k=S.persona;if(!CFG[k])return h;try{return build(h,k)}catch(e){console.error("cxo home",e);return h}};f.__cxo=1;R.home=f}
try{install()}catch(e){console.error(e)}
D.addEventListener("toggle",e=>{const d=e.target;if(d&&d.classList&&d.classList.contains("cxo-details"))OPEN=d.open},true);
W.CXOHOME={config:CFG,owners:OWNERS,watch:watchItems,decisions:topDecisions,applyOwners};
})();
