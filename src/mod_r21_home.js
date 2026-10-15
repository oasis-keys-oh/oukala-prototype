/* Round 21: persona landing pages. A hero with generated art, "Welcome, name", the three numbers the role cares about,
   two or three panels for what that role wants detail on, and for working roles a prioritized collection of work.
   Everything reads live metrics and records. The previous home content stays below under "Also on your home". */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const M=id=>G(()=>METRICS[id],null);

/* ---------- what each role cares about ---------- */
const P={
 exec:{kind:"exec",art:"skyline",pal:["#0f5c75","#34a7a0","#f3c97a"],sub:"Chief information officer",
  top:[["m_delivery","Delivery health"],["m_spend_var","Spend against plan"],["m_grc_risk_app","Risks above appetite"]],
  care:[{t:"Strategy delivered",q:"Are the objectives getting built?",go:"r18_strategy",cta:"Open strategy",lead:"m_ontime",rows:["m_spi","m_benefit"]},
        {t:"Technology money",q:"Are we inside the approved plan?",go:"r18_spend",cta:"Open spend",lead:"m_budvar",rows:["m_capex","m_budgetburn"]},
        {t:"AI and risk",q:"Is AI working inside its guardrails?",go:"ai_runtime",cta:"Open AI",lead:"m_override",rows:["m_aiown","m_grc_ctl_cov"]}],needs:true},
 cfo:{kind:"exec",art:"ledger",pal:["#14506a","#2fa3a0","#e9c46a"],sub:"Chief financial officer",
  top:[["m_spend_var","Forecast against approved"],["m_biz_dso","Days to collect dues"],["m_biz_close","Days to close the books"]],
  care:[{t:"Budget against forecast",q:"Where will we land against the approved budget?",go:"r18_spend",cta:"Open spend",lead:"m_budvar",rows:["m_fin_variance","m_budgetburn"]},
        {t:"Capital and operating spend",q:"Is the capital plan on pace and funded?",go:"bud_lines",cta:"Open budget lines",lead:"m_capex",rows:["m_fin_headroom","m_fin_capital"]},
        {t:"Dues and cash",q:"Are members renewing and paying on time?",go:"inv",cta:"Open invoices",lead:"m_biz_renew",rows:["m_biz_dso","m_apcycle"]}],needs:true},
 coo:{kind:"exec",art:"pages",pal:["#3b2f7a","#6f8be0","#f2b8a2"],sub:"Chief operating officer · Chief editor",
  top:[["m_biz_comment","Comments answered"],["m_biz_ballot","Ballots at quorum"],["m_biz_cycle","Days to publish"]],
  care:[{t:"Standards pipeline",q:"Is every standard moving from comment to vote to publication?",go:"plat_proc",cta:"Open the process library",lead:"m_biz_cycle",rows:["m_biz_comment","m_biz_ballot"]},
        {t:"Members",q:"Are member organizations renewing and taking part?",go:"ppl_org",cta:"Open the org chart",lead:"m_biz_renew",rows:["m_biz_onb","m_biz_committee"]},
        {t:"Cost to serve",q:"What does the work cost and where is it late?",go:"r18_spend",cta:"Open spend",lead:"m_spend_var",rows:["m_biz_conf","m_biz_lic"]}],needs:true},
 board:{kind:"exec",art:"shield",pal:["#1b3b5f","#5aa7c9","#e4c68b"],sub:"Board member",ro:true,
  top:[["m_biz_renew","Member renewal"],["m_spend_var","Spend against plan"],["m_grc_ctl_cov","Controls with evidence"]],
  care:[{t:"Mission and members",q:"Are we serving and keeping our members?",go:"exe_board",cta:"Read the board pack",lead:"m_biz_renew",rows:["m_biz_ballot","m_biz_cycle"]},
        {t:"Financial health",q:"Are we living within our means?",go:"exe_dash",cta:"Open dashboards",lead:"m_spend_var",rows:["m_biz_dso","m_biz_close"]},
        {t:"Risk and oversight",q:"Is risk inside appetite and AI under control?",go:"exe_risk",cta:"Open risk",lead:"m_grc_risk_app",rows:["m_grc_ctl_cov","m_override"]}]},
 audit:{kind:"lead",art:"shield",pal:["#23405c","#6aa6b8","#d9c38e"],sub:"Auditor",ro:true,
  top:[["m_grc_ctl_cov","Control coverage"],["m_grc_find_od","Overdue findings"],["m_grc_att_rate","Attestations complete"]],
  care:[{t:"Evidence",q:"Can every claim be traced to a record?",go:"r15d_evidence",cta:"Open the evidence room",lead:"m_grc_ctl_cov",rows:["m_grc_audit_req","m_grc_pol_ack"]},
        {t:"Exceptions and findings",q:"What is open, late or expiring?",go:"grc_find",cta:"Open findings",lead:"m_grc_find_od",rows:["m_grc_exc_exp","m_debt_exp"]}],work:true},
 portfolio:{kind:"lead",art:"timeline",pal:["#17506b","#3bb3a2","#f0c36d"],sub:"Portfolio lead",
  top:[["m_ontime","Milestones on time"],["m_spi","Schedule performance"],["m_riskexp","Risk against contingency"]],
  care:[{t:"Demand and priorities",q:"What should be funded next?",go:"port",cta:"Open demand",lead:"m_benefit",rows:["m_roi","m_delivery"]},
        {t:"Capacity",q:"Do we have the people for what we promised?",go:"ppl_cap",cta:"Open capacity",lead:"m_util",rows:["m_vendor","m_ontime"]}],work:true},
 pm:{kind:"line",art:"timeline",pal:["#17506b","#4cb8a6","#f4cd7c"],sub:"Project manager",
  top:[["m_spi","Schedule performance"],["m_ontime","Milestones on time"],["m_vendor","Vendor performance"]],
  care:[{t:"Your projects",q:"Which are behind baseline?",go:"ppm_proj",cta:"Open projects",lead:"m_ontime",rows:["m_spi","m_util"]}],work:true},
 ops:{kind:"line",art:"signal",pal:["#0f4c5c","#37b5b0","#f0b86a"],sub:"Service desk lead",
  top:[["m_mttr","Time to resolve"],["m_slaatt","Service levels met"],["m_kb","Knowledge freshness"]],
  care:[{t:"Incidents",q:"What is burning right now?",go:"itsm_inc",cta:"Open incidents",lead:"m_mttr",rows:["m_slaatt","m_ops"]}],work:true},
 change:{kind:"line",art:"signal",pal:["#2a3f6e","#5f9fd9","#f1c27d"],sub:"Change manager",
  top:[["m_itsm_cfr","Change failure rate"],["m_itsm_appr","Approval time"],["m_ops","Operational health"]],
  care:[{t:"Changes this week",q:"Can everything go in without collisions?",go:"itsm_chg",cta:"Open changes",lead:"m_itsm_cfr",rows:["m_itsm_appr","m_mttr"]}],work:true},
 arch:{kind:"line",art:"network",pal:["#223c6a","#58a4d6","#e8c27a"],sub:"Architect",
  top:[["m_fab_cov","Field mapping"],["m_contract_cov","Contract coverage"],["m_debt_age","Age of open debt"]],
  care:[{t:"Data model and debt",q:"What is unmapped, unowned or aging?",go:"plat_debt",cta:"Open debt",lead:"m_debt_open",rows:["m_debt_int","m_own_cov"]}],work:true},
 admin:{kind:"line",art:"network",pal:["#1f3a5f","#4fa0c9","#f0c987"],sub:"Platform admin",
  top:[["m_gate_conf","Conformance"],["m_own_cov","Ownership coverage"],["m_aiown","AI with an accountable human"]],
  care:[{t:"Platform health",q:"Is every module owned and passing its gates?",go:"plat_gate",cta:"Open gates",lead:"m_gate_conf",rows:["m_own_cov","m_own_nobk"]}],work:true},
 fin:{kind:"line",art:"ledger",pal:["#14506a","#38aaa0","#ecc56f"],sub:"Finance approver",
  top:[["m_apcycle","Approval time"],["m_apsla","Approvals past service level"],["m_cycle","Invoice cycle time"]],
  care:[{t:"Invoices",q:"What is waiting, and what is late?",go:"inv",cta:"Open invoices",lead:"m_apsla",rows:["m_apcycle","m_aprover"]}],work:true},
 emp:{kind:"self",art:"sunrise",pal:["#1d5d80","#59b8b0","#f6cf85"],sub:"Employee",self:true,
  top:[["@orders","Open orders"],["@requests","Open requests"],["m_slaatt","Service levels met"]],care:[]},
 newhire:{kind:"self",art:"sunrise",pal:["#2a5b86","#6dbcc0","#f6d28f"],sub:"New hire",self:true,
  top:[["@orders","Orders for you"],["@requests","Open requests"],["m_slaatt","Service levels met"]],care:[]},
 guest:{kind:"self",art:"sunrise",pal:["#2d4a68","#6ea6bf","#dcc794"],sub:"Vendor guest",self:true,ro:true,
  top:[["@requests","Items shared with you"],["m_vendor","Vendor performance"],["m_slaatt","Service levels met"]],care:[]}};
const REL={fin:/invoice|budget|payment|vendor|spend|funding/i,ops:/incident|problem|request|change|outage|sla|on-?call|access/i,change:/change|release|cab|freeze/i,arch:/connector|architecture|schema|integration|debt|exception|field/i,admin:/access|role|licen|policy|environment|connector|agent/i,pm:/project|milestone|risk|task|vendor|raid|sow/i,portfolio:/demand|budget|project|capacity|portfolio|request/i,audit:/control|evidence|finding|attest|exception|policy/i};

/* ---------- small helpers ---------- */
const stOf=m=>G(()=>mstat(m),"good");
const stCls=s=>s==="good"?"good":s==="warn"?"warn":"bad";
const stTxt=s=>s==="good"?"On target":s==="warn"?"Watch":"Off target";
function spark(tr,col,w,h){tr=(tr||[]).filter(v=>typeof v==="number");if(tr.length<2)return"";const mn=Math.min.apply(null,tr),mx=Math.max.apply(null,tr),sp=(mx-mn)||1,px=i=>(i/(tr.length-1))*(w-6)+3,py=v=>h-4-((v-mn)/sp)*(h-8);
 const pts=tr.map((v,i)=>px(i).toFixed(1)+","+py(v).toFixed(1));const last=pts[pts.length-1].split(",");
 return `<svg class="r21-sp" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Trend over the last ${tr.length} periods" focusable="false"><path d="M${pts.join(" L")} L${w-3},${h} L3,${h} Z" fill="${col}" opacity=".16"/><polyline points="${pts.join(" ")}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last[0]}" cy="${last[1]}" r="3.2" fill="${col}"/></svg>`}
const fillPct=m=>{const c=+m.cur,t=+m.tgt;if(!isFinite(c)||!isFinite(t))return 50;if(m.dir==="max")return Math.max(4,Math.min(100,t?c/t*100:100));return Math.max(4,Math.min(100,c?t/c*100:100))};
const me=()=>G(()=>R15D.me(),{name:"Casey Rowan",first:"Casey"});

function selfVal(id,who){
 if(id==="@orders"){const n=G(()=>OGX.orders().filter(o=>o.by===who||(o.nh&&o.nh.name===who)).length,0);return{v:String(n),sub:"placed by or for you",st:"good",tr:null}}
 if(id==="@requests"){const n=G(()=>SVCX.records?SVCX.records().filter(r=>r.by===who).length:0,0);return{v:String(n),sub:"in the service portal",st:"good",tr:null}}
 return null}

/* ---------- the metric tile in the hero ---------- */
function tile(spec,who){const id=spec[0],lab=spec[1];
 const sv=selfVal(id,who);
 if(sv)return `<button type="button" class="r21-tile st-good" data-go="svc_req" aria-label="${E(lab)}: ${E(sv.v)}"><span class="r21-tl">${E(lab)}</span><span class="r21-tv">${E(sv.v)}</span><span class="r21-tt">${E(sv.sub)}</span></button>`;
 const m=M(id);if(!m)return"";const s=stOf(m),c=stCls(s);
 return `<button type="button" class="r21-tile st-${c}" data-r21-met="${E(id)}" aria-label="${E(lab)}: ${E(mfmt(m))}, ${stTxt(s)}. Open the metric."><span class="r21-tl">${E(lab)}</span><span class="r21-tv">${E(mfmt(m))}</span><span class="r21-tt"><i class="r21-dot"></i>${stTxt(s)} · target ${m.dir==="max"?"≥":"≤"} ${E(mfmt(m,m.tgt))}</span>${spark(m.tr,"currentColor",150,34)}</button>`}

/* ---------- generated hero art ---------- */
let seq=0;
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function art(kind,pal,seed){const id="r21g"+(++seq),r=rng(seed||7),[a,b,c]=pal;
 const defs=`<defs><linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b}" stop-opacity=".95"/><stop offset="1" stop-color="${a}" stop-opacity=".25"/></linearGradient><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="${id}s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c}" stop-opacity="1"/><stop offset=".55" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>`;
 let g="";
 if(kind==="skyline"){g+=`<circle cx="470" cy="120" r="120" fill="url(#${id}s)"/><circle cx="470" cy="120" r="46" fill="${c}" opacity=".92"/>`;
  [[0,.55],[1,.4],[2,.28]].forEach(([l,o])=>{let d="M0,320 L0,"+(210+l*28);let x=0;while(x<640){x+=26+r()*40;d+=" L"+x.toFixed(0)+","+(190+l*30-r()*(90-l*22)).toFixed(0)}d+=" L640,320 Z";g+=`<path d="${d}" fill="${l===0?b:a}" opacity="${o}"/>`});
  for(let i=0;i<14;i++){const x=40+i*42+r()*10,h=60+r()*110;g+=`<rect x="${x.toFixed(0)}" y="${(320-h).toFixed(0)}" width="26" height="${h.toFixed(0)}" rx="3" fill="${a}" opacity=".9"/>`;for(let k=0;k<Math.floor(h/22);k++)if(r()>.35)g+=`<rect x="${(x+5).toFixed(0)}" y="${(320-h+8+k*20).toFixed(0)}" width="5" height="8" rx="1" fill="${c}" opacity=".85"/><rect x="${(x+15).toFixed(0)}" y="${(320-h+8+k*20).toFixed(0)}" width="5" height="8" rx="1" fill="${c}" opacity=".55"/>`}}
 else if(kind==="ledger"){for(let i=0;i<5;i++){g+=`<line x1="0" x2="640" y1="${60+i*52}" y2="${60+i*52}" stroke="${b}" opacity=".16"/>`}
  [[0,.55],[1,.4],[2,.3]].forEach(([l,o])=>{let d="M0,320 L0,"+(200-l*26),x=0;for(let i=0;i<=8;i++){x=i*80;d+=` S ${x-40},${(170-l*30-r()*60).toFixed(0)} ${x},${(190-l*34-i*(9+l*2)-r()*18).toFixed(0)}`}d+=" L640,320 Z";g+=`<path d="${d}" fill="url(#${id}a)" opacity="${o+.2}"/>`});
  let d2="M20,250";for(let i=1;i<=9;i++)d2+=` L${20+i*68},${(250-i*18-r()*20).toFixed(0)}`;g+=`<path d="${d2}" fill="none" stroke="url(#${id}b)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;for(let i=1;i<=9;i+=2){const m=d2.split(" L")[i];if(m){const [x,y]=m.split(",");g+=`<circle cx="${x}" cy="${y}" r="7" fill="${c}"/><circle cx="${x}" cy="${y}" r="13" fill="${c}" opacity=".25"/>`}}}
 else if(kind==="pages"){for(let i=0;i<6;i++){const x=300+i*46,y=40+((i*37)%70),rot=-14+i*7;g+=`<g transform="rotate(${rot} ${x} ${y+110})"><rect x="${x}" y="${y}" width="150" height="200" rx="10" fill="url(#${id}a)" opacity="${.35+i*.1}" stroke="${c}" stroke-opacity=".4"/>`;for(let k=0;k<7;k++)g+=`<rect x="${x+16}" y="${y+22+k*22}" width="${k===0?70:96-r()*30}" height="6" rx="3" fill="${c}" opacity=".7"/>`;g+=`</g>`}
  g+=`<path d="M470,28 l14,0 l0,60 l-7,-12 l-7,12 z" fill="${c}"/>`;for(let i=0;i<26;i++)g+=`<circle cx="${(r()*620).toFixed(0)}" cy="${(r()*300).toFixed(0)}" r="${(1+r()*3).toFixed(1)}" fill="${c}" opacity="${(.2+r()*.5).toFixed(2)}"/>`}
 else if(kind==="shield"){for(let i=1;i<=5;i++)g+=`<circle cx="470" cy="165" r="${i*34}" fill="none" stroke="${b}" stroke-opacity="${.55-i*.07}" stroke-width="${i%2?1.5:3}" stroke-dasharray="${i%2?'':'6 10'}"/>`;
  g+=`<path d="M470,165 L${470+170*Math.cos(-.9)},${165+170*Math.sin(-.9)} A170,170 0 0 1 ${470+170*Math.cos(-.1)},${165+170*Math.sin(-.1)} Z" fill="url(#${id}b)" opacity=".4"/>`;
  g+=`<path d="M470,98 l52,18 l0,44 c0,36 -22,58 -52,72 c-30,-14 -52,-36 -52,-72 l0,-44 z" fill="${a}" stroke="${c}" stroke-width="3" opacity=".95"/><path d="M448,166 l16,16 l32,-36" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  for(let i=0;i<9;i++){const ang=r()*6.28,rr=60+r()*130;g+=`<circle cx="${(470+rr*Math.cos(ang)).toFixed(0)}" cy="${(165+rr*Math.sin(ang)).toFixed(0)}" r="${(3+r()*4).toFixed(1)}" fill="${c}" opacity=".8"/>`}}
 else if(kind==="network"){const N=[];for(let i=0;i<22;i++)N.push([260+r()*360,24+r()*270,4+r()*9]);N.forEach((n,i)=>{N.slice(i+1).forEach(m=>{const d=Math.hypot(n[0]-m[0],n[1]-m[1]);if(d<110)g+=`<line x1="${n[0].toFixed(0)}" y1="${n[1].toFixed(0)}" x2="${m[0].toFixed(0)}" y2="${m[1].toFixed(0)}" stroke="${b}" stroke-opacity="${(.7-d/180).toFixed(2)}" stroke-width="1.6"/>`})});
  N.forEach((n,i)=>{g+=`<circle cx="${n[0].toFixed(0)}" cy="${n[1].toFixed(0)}" r="${(n[2]*2.2).toFixed(0)}" fill="${i%5===0?c:b}" opacity=".18"/><circle cx="${n[0].toFixed(0)}" cy="${n[1].toFixed(0)}" r="${n[2].toFixed(1)}" fill="${i%5===0?c:b}"/>`})}
 else if(kind==="timeline"){for(let i=0;i<9;i++){const y=34+i*32,x=250+r()*120,w=90+r()*220;g+=`<rect x="${x.toFixed(0)}" y="${y}" width="${w.toFixed(0)}" height="16" rx="8" fill="${i%3===0?`url(#${id}b)`:`url(#${id}a)`}" opacity="${(.55+r()*.4).toFixed(2)}"/>`;if(r()>.45)g+=`<path d="M${(x+w+14).toFixed(0)},${y-2} l9,10 l-9,10 l-9,-10 z" fill="${c}"/>`}
  g+=`<line x1="470" x2="470" y1="10" y2="310" stroke="${c}" stroke-width="2" stroke-dasharray="5 7" opacity=".8"/>`}
 else if(kind==="signal"){for(let i=1;i<=5;i++)g+=`<circle cx="500" cy="165" r="${i*38}" fill="none" stroke="${b}" stroke-opacity="${.5-i*.07}" stroke-width="2"/>`;
  let d="M200,170";for(let i=1;i<=22;i++){const x=200+i*20;const y=i%6===3?60:i%6===4?270:170+(r()-.5)*22;d+=` L${x},${y.toFixed(0)}`}g+=`<path d="${d}" fill="none" stroke="url(#${id}b)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="500" cy="165" r="9" fill="${c}"/><circle cx="500" cy="165" r="22" fill="${c}" opacity=".25"/>`}
 else{for(let i=1;i<=6;i++)g+=`<path d="M${470-i*62},330 A${i*62},${i*62} 0 0 1 ${470+i*62},330" fill="none" stroke="${i%2?b:c}" stroke-opacity="${(.7-i*.09).toFixed(2)}" stroke-width="${12-i}"/>`;
  g+=`<circle cx="470" cy="248" r="46" fill="url(#${id}s)"/><circle cx="470" cy="256" r="22" fill="${c}"/>`;for(let i=0;i<20;i++){const an=-3.1+i*.33;g+=`<line x1="${470+70*Math.cos(an)}" y1="${256+70*Math.sin(an)}" x2="${470+96*Math.cos(an)}" y2="${256+96*Math.sin(an)}" stroke="${c}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`}}
 return `<svg viewBox="0 0 640 320" preserveAspectRatio="xMaxYMid slice" role="presentation" aria-hidden="true" focusable="false">${defs}${g}</svg>`}

/* ---------- panels ---------- */
function care(c){const m=M(c.lead);if(!m)return"";const s=stOf(m),cl=stCls(s);
 const rows=(c.rows||[]).map(id=>M(id)?{id,m:M(id)}:null).filter(Boolean).map(({id,m})=>{const s2=stOf(m);return `<li class="r21-row"><button type="button" data-r21-met="${E(id)}"><span class="r21-rl">${E(m.n)}</span><b>${E(mfmt(m))}</b><span class="r21-bar st-${stCls(s2)}" role="img" aria-label="${stTxt(s2)}, target ${m.dir==="max"?"at least":"at most"} ${E(mfmt(m,m.tgt))}"><i style="width:${fillPct(m).toFixed(0)}%"></i></span></button></li>`}).join("");
 return `<section class="card glass r21-care"><div class="r21-ch"><h3>${E(c.t)}</h3><p class="r21-q">${E(c.q)}</p></div>
 <button type="button" class="r21-lead st-${cl}" data-r21-met="${E(c.lead)}"><span class="r21-bigw"><span class="r21-big">${E(mfmt(m))}</span><span class="r21-bl">${E(m.n)}</span><span class="pill ${cl}">${stTxt(s)} · target ${m.dir==="max"?"≥":"≤"} ${E(mfmt(m,m.tgt))}</span></span>${spark(m.tr,"currentColor",170,56)}</button>
 <ul class="r21-rows">${rows}</ul><div class="r21-cf"><button type="button" class="btn quiet" data-go="${E(c.go)}">${E(c.cta)}</button></div></section>`}

function rank(k){let it=G(()=>INBOX.items(),[]);const re=REL[k];
 if(re){const rel=it.filter(x=>re.test((x.cat||"")+" "+(x.title||"")+" "+(x.src||"")));if(rel.length>=3)it=rel}
 const sc=x=>(x.urgent?100:0)+Math.min(96,Math.max(0,-(x.dueH||0)))/1.5+({high:30,med:15,low:0}[x.risk]||0)+(re&&re.test((x.cat||"")+" "+(x.title||""))?20:0)+Math.min(30,(x.ageH||0)/12);
 return it.slice().sort((a,b)=>sc(b)-sc(a)).slice(0,6)}
function why(x){const d=x.dueH;if(d!=null&&d<0){const dd=Math.round(-d/24);return[(dd>=1?"Overdue "+dd+" d":"Overdue "+Math.max(1,Math.round(-d))+" h"),"bad"]}if(x.risk==="high")return["High risk","bad"];if(d!=null&&d<=24)return["Due in "+Math.max(1,Math.round(d))+" h","warn"];if(x.urgent)return["Urgent","warn"];return[(x.ageH>=24?"Waiting "+Math.round(x.ageH/24)+" d":"New"),"mute"]}
function work(k,p){const items=rank(k);const acts=G(()=>(PERSONAS[k].actions||[]).map(f=>f()).filter(Boolean).slice(0,3),[]);
 const rows=items.map((x,i)=>{const w=why(x);return `<li class="r21-wi"><span class="r21-rank" aria-hidden="true">${i+1}</span><div class="r21-wt"><b>${E(x.title)}</b><small>${E(x.cat||"")}${x.amt!=null?" · "+E(G(()=>"$"+Math.round(x.amt).toLocaleString("en-US"),""))+"":""}${x.req?" · from "+E(x.req):""}</small></div><span class="pill ${w[1]}">${E(w[0])}</span><button type="button" class="btn quiet" data-go="inbox" aria-label="Open ${E(x.title)} in the inbox">Open</button></li>`}).join("");
 const st=acts.map(a=>`<li class="r21-st"><div><b>${E(a[0])}</b><small>${E(a[1])}</small></div><button type="button" class="btn quiet" data-needgo="${E((a[2]||[]).join("|"))}">${E(a[3]||"Open")}</button></li>`).join("");
 return `<section class="card glass r21-work"><div class="cardhead"><div><h3>Your work, in order</h3><span class="muted small">Ranked by urgency, risk and how much your role is accountable for it.</span></div>${p.ro?'<span class="pill mute">Read only</span>':`<button type="button" class="btn quiet" data-inbx-focus>Review one by one</button>`}</div>
 <div class="r21-wg"><div><div class="eyebrow">${items.length?"Waiting for you":"Nothing waiting"}</div><ol class="r21-wl">${rows||'<li class="muted small">You are clear. New items appear here as they arrive.</li>'}</ol></div>${st?`<div><div class="eyebrow">Standing work for your role</div><ul class="r21-sl">${st}</ul></div>`:""}</div></section>`}

function needs(k){const items=rank(k).slice(0,3);if(!items.length)return"";
 return `<section class="card glass r21-need"><div class="cardhead"><div><h3>Needs your decision</h3><span class="muted small">The three most urgent items waiting for you.</span></div><button type="button" class="btn quiet" data-go="inbox">Open the inbox</button></div><ol class="r21-wl">${items.map((x,i)=>{const w=why(x);return `<li class="r21-wi"><span class="r21-rank" aria-hidden="true">${i+1}</span><div class="r21-wt"><b>${E(x.title)}</b><small>${E(x.cat||"")}</small></div><span class="pill ${w[1]}">${E(w[0])}</span></li>`}).join("")}</ol></section>`}

/* ---------- compose ---------- */
function build(prev){const k=S.persona,p=P[k];if(!p)return prev;
 const m0=prev.match(/^\s*<div class="screen[^"]*"[^>]*>/);if(!m0)return prev;
 const hi=prev.indexOf("</section>");if(hi<0)return prev;
 let rest=prev.slice(hi+10);
 if(p.kind==="self"||p.kind==="line"){rest=rest.replace(/<section class="[^"]*r18-homelens[^"]*"[\s\S]*?<\/section>/,"")}const li=rest.lastIndexOf("</div>");if(li>=0)rest=rest.slice(0,li);
 const who=me(),story=G(()=>R15D.storyFor&&R15D.storyFor(k),"");
 const lvl=({exec:"You decide",lead:"You lead",line:"You do the work",self:"You ask and track"})[p.kind];
 const top=p.top.map(t=>tile(t,who.name)).join("");
 const hero=`<section class="hero r21-hero" style="--p1:${p.pal[0]};--p2:${p.pal[1]};--p3:${p.pal[2]}"><div class="r21-art">${art(p.art,p.pal,k.length*131+7)}</div><div class="r21-hc"><div class="eyebrow r21-eb">${E(G(()=>NOW.day,"Today"))} · Meridian Standards Foundation</div><h1>Welcome, ${E(who.first)}.</h1><p class="r21-role">${E(p.sub)} · ${E(lvl)}${p.ro?" · read only":""}</p>${story&&p.kind!=="self"?`<p class="r21-story">${story}</p>`:""}<div class="r21-top" role="group" aria-label="Your three numbers">${top}</div><div class="r21-hr"><button type="button" class="chip" data-r15d-vas-open>Change role</button><button type="button" class="chip" data-ask="What should I look at first today?">What should I look at first?</button></div></div></section>`;
 const panels=(p.care||[]).map(care).join("");
 const sec=[];
 if(p.kind==="exec"){sec.push(panels?`<div class="r21-sh"><h2>What you care about</h2><span class="muted small">The details behind your three numbers.</span></div><div class="r21-cg r21-n${p.care.length}">${panels}</div>`:"");if(p.needs)sec.push(needs(k))}
 else if(p.kind==="lead"||p.kind==="line"){sec.push(work(k,p));if(panels)sec.push(`<div class="r21-sh"><h2>What you care about</h2><span class="muted small">The numbers behind your work.</span></div><div class="r21-cg r21-n${p.care.length}">${panels}</div>`)}
 return `${m0[0].replace(/class="screen[^"]*"/,'class="screen r21-home"')}${hero}${sec.join("")}${rest.trim()?`<details class="r21-more" open><summary>Also on your home</summary>${rest}</details>`:""}</div>`}

function install(){const R=(typeof _R!=="undefined"?_R:W._R);if(!R||!R.home||R.home.__r21)return;const prev=R.home;const f=function(){const h=prev.apply(this,arguments);try{return build(h)}catch(e){console.error("r21 home",e);return h}};f.__r21=1;R.home=f}
try{install()}catch(e){console.error(e)}
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-r21-met]");if(t){e.preventDefault();G(()=>go("metrics",t.dataset.r21Met))}});
W.R21H={profiles:P,build,rank,art};
})();
