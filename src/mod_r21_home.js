/* Round 21: persona landing pages. A hero with generated art, "Welcome, name", the three numbers the role cares about,
   two or three panels for what that role wants detail on, and for working roles a prioritized collection of work.
   Everything reads live metrics and records. The previous home content stays below under "Also on your home". */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const M=id=>G(()=>METRICS[id],null);

/* ---------- panel library: any role can pick any of these ---------- */
const PL={
 strat:{t:"Strategy delivered",q:"Are the objectives getting built?",go:"r18_strategy",cta:"Open strategy",lead:"m_ontime",rows:["m_spi","m_benefit"]},
 portf:{t:"Portfolio and demand",q:"What should be funded next, and can we staff it?",go:"port",cta:"Open demand",lead:"m_demcap",rows:["m_roi","m_align"]},
 deliv:{t:"Delivery health",q:"Are projects landing on their dates?",go:"ims",cta:"Open the schedule",lead:"m_delivery",rows:["m_mshit","m_schedvar"]},
 spend:{t:"Technology money",q:"Are we inside the approved plan?",go:"r18_spend",cta:"Open spend",lead:"m_budvar",rows:["m_capex","m_budgetburn"]},
 budget:{t:"Budget against forecast",q:"Where will we land against the approved budget?",go:"r18_spend",cta:"Open spend",lead:"m_budvar",rows:["m_fin_variance","m_budgetburn"]},
 capital:{t:"Capital and operating spend",q:"Is the capital plan on pace and funded?",go:"bud_lines",cta:"Open budget lines",lead:"m_capex",rows:["m_fin_headroom","m_fin_capital"]},
 cash:{t:"Dues and cash",q:"Are members paying on time, and are we closing the books on time?",go:"inv",cta:"Open invoices",lead:"m_biz_dso",rows:["m_biz_close","m_apcycle"]},
 vend:{t:"Vendors and contracts",q:"Which contracts need a decision, and are vendors delivering?",go:"bud_ven",cta:"Open vendors",lead:"m_renew",rows:["m_vendor","m_contr"]},
 airisk:{t:"AI and risk",q:"Is AI working inside its guardrails?",go:"ai_runtime",cta:"Open AI",lead:"m_override",rows:["m_aiown","m_grc_ctl_cov"]},
 ai:{t:"AI under control",q:"Is every agent owned, capped and governed?",go:"tower",cta:"Open the control tower",lead:"m_aiown",rows:["m_aispend","m_guard"]},
 aival:{t:"AI value",q:"What is AI returning to people, and at what cost?",go:"r17q_value",cta:"Open value realized",lead:"m_agentauto",rows:["m_tokcost","m_org_cap"]},
 aiq:{t:"AI quality",q:"Can we trust what the agents answer?",go:"kcs_test",cta:"Open AI testing",lead:"m_ground",rows:["m_judge","m_skill_ok"]},
 risk:{t:"Risk and oversight",q:"Is risk inside appetite and AI under control?",go:"exe_risk",cta:"Open risk",lead:"m_grc_risk_app",rows:["m_grc_ctl_cov","m_raid"]},
 sec:{t:"Security and access",q:"Who can reach what, and is it reviewed?",go:"r15_iam",cta:"Open identity and access",lead:"m_access",rows:["m_grc_exc_exp","m_own_nobk"]},
 ctrl:{t:"Controls and evidence",q:"Can every claim be traced to a record?",go:"grc_ctl",cta:"Open controls",lead:"m_grc_ctl_cov",rows:["m_ctrl","m_grc_audit_req"]},
 find:{t:"Exceptions and findings",q:"What is open, late or expiring?",go:"grc_find",cta:"Open findings",lead:"m_grc_find_od",rows:["m_grc_exc_exp","m_debt_exp"]},
 third:{t:"Third-party risk",q:"Are our vendors assessed and meeting their service levels?",go:"grc_ven",cta:"Open third-party risk",lead:"m_grc_ven_t1",rows:["m_renew","m_pf_msp_sla"]},
 pol:{t:"Policies and attestations",q:"Has everyone read and signed what they must?",go:"grc_pol",cta:"Open policies",lead:"m_grc_pol_ack",rows:["m_grc_att_rate","m_trainc"]},
 rely:{t:"Reliability",q:"Are the services members depend on staying up?",go:"itom_slo",cta:"Open observability",lead:"m_avail",rows:["m_mttr","m_slobudget"]},
 members:{t:"Mission and members",q:"Are we serving and keeping our members?",go:"exe_dash",cta:"Open dashboards",lead:"m_biz_renew",rows:["m_biz_onb","m_biz_conf"]},
 member2:{t:"Members",q:"Are member organizations renewing and taking part?",go:"ppl_org",cta:"Open the org chart",lead:"m_biz_renew",rows:["m_biz_onb","m_biz_committee"]},
 pipe:{t:"Standards pipeline",q:"Is every standard moving from comment to vote to publication?",go:"plat_proc",cta:"Open the process library",lead:"m_biz_cycle",rows:["m_biz_comment","m_biz_ballot"]},
 lic:{t:"Licensing and contracts",q:"Are licensing requests answered and contracts reviewed in time?",go:"ppm_sow",cta:"Open contracts",lead:"m_biz_lic",rows:["m_biz_contract","m_renew"]},
 finh:{t:"Financial health",q:"Are we living within our means?",go:"exe_dash",cta:"Open dashboards",lead:"m_budvar",rows:["m_biz_dso","m_biz_close"]},
 cost:{t:"Cost to serve",q:"What does the work cost and where is it late?",go:"r18_spend",cta:"Open spend",lead:"m_spend_var",rows:["m_biz_conf","m_biz_lic"]},
 work:{t:"Workforce",q:"Do we have the people we planned for?",go:"ppl_org",cta:"Open the org chart",lead:"m_org_hc_plan",rows:["m_org_vac_age","m_org_span"]},
 hire:{t:"Hiring and onboarding",q:"How fast do we fill roles and get people ready?",go:"ppl_org",cta:"Open the org chart",lead:"m_biz_hire",rows:["m_org_vac_age","m_r15d_fw_ready"]},
 perf:{t:"Performance and reviews",q:"Is the review cycle complete and fair?",go:"ppl_perf",cta:"Open performance",lead:"m_pf_revdone",rows:["m_pf_calspread","m_pf_align"]},
 learn:{t:"Learning and readiness",q:"Is everyone trained for what they do?",go:"ppl_train",cta:"Open learning",lead:"m_trainc",rows:["m_r15d_fw_ready","m_skill_depth"]},
 cap:{t:"Capacity and load",q:"Do we have the people for what we promised?",go:"ppl_cap",cta:"Open capacity",lead:"m_util",rows:["m_wload","m_pp_gap"]},
 shift:{t:"Work shifting to agents",q:"How much capacity are agents returning, and are they governed?",go:"org_chart",cta:"Open the org chart",lead:"m_org_cap",rows:["m_org_gov","m_org_accept"]},
 proj:{t:"Your projects",q:"Which are behind baseline?",go:"ppm_proj",cta:"Open projects",lead:"m_ontime",rows:["m_spi","m_util"]},
 inc:{t:"Incidents",q:"What is burning right now?",go:"itsm_inc",cta:"Open incidents",lead:"m_mttr",rows:["m_slaatt","m_ops"]},
 chg:{t:"Changes this week",q:"Can everything go in without collisions?",go:"itsm_chg",cta:"Open changes",lead:"m_itsm_cfr",rows:["m_itsm_appr","m_mttr"]},
 plat:{t:"Platform health",q:"Is every module owned and passing its gates?",go:"plat_gate",cta:"Open gates",lead:"m_gate_conf",rows:["m_own_cov","m_own_nobk"]},
 debt:{t:"Data model and debt",q:"What is unmapped, unowned or aging?",go:"plat_debt",cta:"Open debt",lead:"m_debt_open",rows:["m_debt_int","m_own_cov"]},
 inv:{t:"Invoices",q:"What is waiting, and what is late?",go:"inv",cta:"Open invoices",lead:"m_apsla",rows:["m_apcycle","m_aprover"]},
 evid:{t:"Evidence",q:"Can every claim be traced to a record?",go:"r15d_evidence",cta:"Open the evidence room",lead:"m_grc_ctl_cov",rows:["m_grc_audit_req","m_grc_pol_ack"]}};
/* what each role cares about. top = the three numbers in the hero; care = the topics shown by default; dec = how to pick decisions for executives */
const SKIP_X=/^(debt decision|catalog request|time off request|training|proposed entity|data access|alert|meeting review|review to write|project task|process gate|app certification|access request)$/i;
const P={
 exec:{kind:"exec",art:"skyline",pal:["#1b1a4a","#5b5bd6","#cfccff"],sub:"Chief information officer",
  top:[["m_delivery","Delivery health"],["m_spend_var","Spend against plan"],["m_grc_risk_app","Risks above appetite"]],
  care:["strat","spend","airisk"],
  dec:{want:/contract|renew|demand|data lake|release|go or no|retire|hosting|break-glass|conditional access|connector|ai agent|token|overspend|reforecast|beta|architecture|vendor/i,amt:40000}},
 ceo:{kind:"exec",art:"skyline",pal:["#0c1633","#c9962f","#f6dc92"],sub:"Chief executive officer",
  top:[["m_biz_renew","Member renewal"],["m_budvar","Budget against forecast"],["m_biz_cycle","Days to publish a standard"]],
  care:["members","strat","finh"],
  dec:{want:/contract|renew|demand|data lake|retire|member|beta|reforecast|hosting|portal|board|strategy/i,amt:100000}},
 cfo:{kind:"exec",art:"ledger",pal:["#05353c","#1f8a8a","#a6e8d4"],sub:"Chief financial officer",
  top:[["m_spend_var","Forecast against approved"],["m_biz_dso","Days to collect dues"],["m_biz_close","Days to close the books"]],
  care:["budget","capital","cash"],
  dec:{want:/budget|overspend|reforecast|contract|renew|demand|funding|hosting|forecast|invoice|move \$/i,amt:25000,inv:50000}},
 coo:{kind:"exec",art:"pages",pal:["#3a1608","#c4571e","#f6bd8c"],sub:"Chief operating officer · Chief editor",
  top:[["m_biz_comment","Comments answered"],["m_biz_ballot","Ballots at quorum"],["m_biz_cycle","Days to publish"]],
  care:["pipe","member2","cost"],
  dec:{want:/release|go or no|publish|ballot|comment|standard|portal|retire|member login|beta|hosting|demand|connector/i,amt:60000}},
 chro:{kind:"exec",art:"sunrise",pal:["#3a1b2c","#c47a8f","#f7d3d6"],sub:"Chief human resources officer · Head of people operations",
  top:[["m_org_hc_plan","Headcount against plan"],["m_biz_hire","Days to fill a role"],["m_trainc","Training completion"]],
  care:["work","perf","learn"],
  dec:{want:/hire|onboard|role|leave|people|headcount|training|new hire|time off|offboard|manager/i,amt:1e12,cats:/^(time off request|training|access request)$/i}},
 ciso:{kind:"exec",art:"shield",pal:["#061a2b","#3fb4d6","#d4f5ff"],sub:"Chief information security officer · Security lead",
  top:[["m_grc_risk_app","Risks above appetite"],["m_access","Access reviews complete"],["m_grc_ctl_cov","Controls with evidence"]],
  care:["sec","risk","ctrl"],
  dec:{want:/break-glass|conditional access|legacy|privileged|access|alert|security|exception|connector|tenant|sign-in|debt/i,amt:1e12,cats:/^(access request|alert|change request|debt decision|connector request)$/i}},
 caio:{kind:"exec",art:"network",pal:["#2a1146","#9b5de5","#e6d2ff"],sub:"Chief AI officer · AI platform lead",
  top:[["m_aiown","AI with an accountable human"],["m_override","Agent override rate"],["m_aispend","AI spend against the daily cap"]],
  care:["ai","aival","aiq"],
  dec:{want:/\bai\b|agent|token|model|prompt|skill|automation|data lake|catalog|analytics/i,amt:1e12}},
 clo:{kind:"exec",art:"pages",pal:["#0a2a1b","#2f8f5b","#d3ebb8"],sub:"General counsel · Chief legal officer",
  top:[["m_biz_contract","Contracts reviewed in time"],["m_biz_lic","Licensing answered in 5 days"],["m_grc_pol_ack","Policy acknowledgement"]],
  care:["lic","vend","pol"],
  dec:{want:/contract|renew|e-signature|licen|policy|exception|data access|privacy|vendor|terms|liability/i,amt:60000}},
 board:{kind:"exec",art:"shield",pal:["#101a30","#7e93b8","#e8eef9"],sub:"Board member",ro:true,
  top:[["m_biz_renew","Member renewal"],["m_spend_var","Spend against plan"],["m_grc_ctl_cov","Controls with evidence"]],
  care:["members","finh","risk"]},
 audit:{kind:"lead",art:"shield",pal:["#1a2330","#8aa0a8","#e8dcb6"],sub:"Auditor",ro:true,
  top:[["m_grc_ctl_cov","Control coverage"],["m_grc_find_od","Overdue findings"],["m_grc_att_rate","Attestations complete"]],
  care:["evid","find"],work:true},
 portfolio:{kind:"lead",art:"timeline",pal:["#17506b","#3bb3a2","#f0c36d"],sub:"Portfolio lead",
  top:[["m_ontime","Milestones on time"],["m_spi","Schedule performance"],["m_riskexp","Risk against contingency"]],
  care:["portf","cap"],work:true},
 pm:{kind:"line",art:"timeline",pal:["#17506b","#4cb8a6","#f4cd7c"],sub:"Project manager",
  top:[["m_spi","Schedule performance"],["m_ontime","Milestones on time"],["m_vendor","Vendor performance"]],care:["proj"],work:true},
 ops:{kind:"line",art:"signal",pal:["#0f4c5c","#37b5b0","#f0b86a"],sub:"Service desk lead",
  top:[["m_mttr","Time to resolve"],["m_slaatt","Service levels met"],["m_kb","Knowledge freshness"]],care:["inc"],work:true},
 change:{kind:"line",art:"signal",pal:["#2a3f6e","#5f9fd9","#f1c27d"],sub:"Change manager",
  top:[["m_itsm_cfr","Change failure rate"],["m_itsm_appr","Approval time"],["m_ops","Operational health"]],care:["chg"],work:true},
 arch:{kind:"line",art:"network",pal:["#223c6a","#58a4d6","#e8c27a"],sub:"Architect",
  top:[["m_fab_cov","Field mapping"],["m_contract_cov","Contract coverage"],["m_debt_age","Age of open debt"]],care:["debt"],work:true},
 admin:{kind:"line",art:"network",pal:["#1f3a5f","#4fa0c9","#f0c987"],sub:"Platform admin",
  top:[["m_gate_conf","Conformance"],["m_own_cov","Ownership coverage"],["m_aiown","AI with an accountable human"]],care:["plat"],work:true},
 fin:{kind:"line",art:"ledger",pal:["#14506a","#38aaa0","#ecc56f"],sub:"Finance approver",
  top:[["m_apcycle","Approval time"],["m_apsla","Approvals past service level"],["m_cycle","Invoice cycle time"]],care:["inv"],work:true},
 emp:{kind:"self",art:"sunrise",pal:["#1d5d80","#59b8b0","#f6cf85"],sub:"Employee",self:true,
  top:[["@orders","Open orders"],["@requests","Open requests"],["m_slaatt","Service levels met"]],care:[]},
 newhire:{kind:"self",art:"sunrise",pal:["#2a5b86","#6dbcc0","#f6d28f"],sub:"New hire",self:true,
  top:[["@orders","Orders for you"],["@requests","Open requests"],["m_slaatt","Service levels met"]],care:[]},
 guest:{kind:"self",art:"sunrise",pal:["#2d4a68","#6ea6bf","#dcc794"],sub:"Vendor guest",self:true,ro:true,
  top:[["@requests","Items shared with you"],["m_vendor","Vendor performance"],["m_slaatt","Service levels met"]],care:[]}};
const REL={fin:/invoice|budget|payment|vendor|spend|funding/i,ops:/incident|problem|request|change|outage|sla|on-?call|access/i,change:/change|release|cab|freeze/i,arch:/connector|architecture|schema|integration|debt|exception|field/i,admin:/access|role|licen|policy|environment|connector|agent/i,pm:/project|milestone|risk|task|vendor|raid|sow/i,portfolio:/demand|budget|project|capacity|portfolio|request/i,audit:/control|evidence|finding|attest|exception|policy/i};

/* ---------- small helpers ---------- */
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

/* ---------- painted hero art (Round 24): one image per role from HEROMAP, falling back to the generated line art ---------- */
function heroArt(k,p){const h=(window.HEROMAP||{})[k];if(!h)return art(p.art,p.pal,k.length*131+7);
 return `<img class="r21-img" src="hero/${h.f}.webp?v=21b" onerror="this.onerror=null;this.src='hero/${h.f}.webp?r='+Date.now()" alt="" decoding="async" fetchpriority="high" style="object-position:${h.pos||"50% 50%"}">`}
/* ---------- generated hero art ---------- */
let seq=0;
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function art(kind,pal,seed){const id="r21g"+(++seq),r=rng(seed||7),[a,b,c]=pal,f=n=>n.toFixed(0);
 const defs=`<defs><linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".5"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></linearGradient><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${b}" stop-opacity="0"/><stop offset=".6" stop-color="${c}" stop-opacity=".95"/><stop offset="1" stop-color="${c}" stop-opacity=".25"/></linearGradient><linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".9"/><stop offset="1" stop-color="${b}" stop-opacity=".12"/></linearGradient><radialGradient id="${id}s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset=".4" stop-color="${c}" stop-opacity=".28"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient><filter id="${id}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${(seed||7)%97}"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 0"/></filter></defs>`;
 let g="";
 /* shared field: soft flowing bands so every role feels related but not identical */
 for(let i=0;i<7;i++){const y=50+i*36+r()*10,k=40+r()*50,e=(r()-.5)*70;
  g+=`<path d="M150,${f(y+30)} C300,${f(y-k)} 430,${f(y+k+e)} 660,${f(y-18)} L660,${f(y+60)} C430,${f(y+k+e+50)} 300,${f(y+20)} 150,${f(y+70)} Z" fill="url(#${id}a)" opacity="${(.10+i*.012).toFixed(3)}"/><path d="M150,${f(y+30)} C300,${f(y-k)} 430,${f(y+k+e)} 660,${f(y-18)}" fill="none" stroke="${i%3===0?c:b}" stroke-opacity="${(.14+r()*.22).toFixed(2)}" stroke-width="1.2"/>`}
 const halo=(x,y,R)=>`<circle cx="${x}" cy="${y}" r="${R}" fill="url(#${id}s)"/>`;
 if(kind==="skyline"){g+=halo(470,150,150);
  for(let i=1;i<=5;i++)g+=`<path d="M${470-i*44},230 A${i*44},${i*44} 0 0 1 ${470+i*44},230" fill="none" stroke="${c}" stroke-opacity="${(.5-i*.07).toFixed(2)}" stroke-width="1.3"/>`;
  g+=`<circle cx="470" cy="150" r="34" fill="${c}" opacity=".92"/><circle cx="470" cy="150" r="34" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>`;
  for(let i=0;i<18;i++){const x=290+i*21,h=24+Math.abs(Math.sin(i*.7+r()))*90;g+=`<rect x="${f(x)}" y="${f(262-h)}" width="9" height="${f(h)}" rx="4.5" fill="url(#${id}v)" opacity="${(.35+r()*.4).toFixed(2)}"/>`}
  g+=`<line x1="250" x2="660" y1="262" y2="262" stroke="${c}" stroke-opacity=".3"/>`}
 else if(kind==="ledger"){const pts=[];
  for(let i=0;i<12;i++){const x=270+i*30,h=40+i*13+r()*26;g+=`<rect x="${x}" y="${f(270-h)}" width="14" height="${f(h)}" rx="7" fill="url(#${id}v)" opacity="${(.4+i*.04).toFixed(2)}"/>`;pts.push([x+7,270-h-16-i*3])}
  g+=`<path d="M${pts.map(q=>f(q[0])+","+f(q[1])).join(" L")}" fill="none" stroke="url(#${id}b)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  pts.forEach((q,i)=>{if(i%3===2)g+=`<circle cx="${f(q[0])}" cy="${f(q[1])}" r="16" fill="${c}" opacity=".16"/><circle cx="${f(q[0])}" cy="${f(q[1])}" r="5" fill="${c}"/>`});
  g+=`<line x1="250" x2="660" y1="270" y2="270" stroke="${c}" stroke-opacity=".3"/>`}
 else if(kind==="pages"){for(let i=0;i<6;i++){const x=330+i*38,y=40+((i*31)%46),rot=-10+i*5;g+=`<g transform="rotate(${rot} ${x+60} ${y+100})"><rect x="${x}" y="${y}" width="124" height="176" rx="14" fill="${b}" fill-opacity="${(.06+i*.025).toFixed(3)}" stroke="${c}" stroke-opacity="${(.25+i*.08).toFixed(2)}" stroke-width="1.3"/>`;
   for(let k=0;k<5;k++)g+=`<rect x="${x+16}" y="${y+24+k*20}" width="${f(k===0?56:76-r()*26)}" height="4" rx="2" fill="${c}" opacity="${(.25+i*.07).toFixed(2)}"/>`;g+=`</g>`}
  g+=halo(540,70,70)}
 else if(kind==="shield"){g+=halo(470,165,150);
  for(let i=1;i<=5;i++)g+=`<circle cx="470" cy="165" r="${i*32}" fill="none" stroke="${c}" stroke-opacity="${(.5-i*.07).toFixed(2)}" stroke-width="1.2" ${i%2?'':'stroke-dasharray="3 9"'}/>`;
  g+=`<path d="M470,108 l44,15 l0,38 c0,31 -19,50 -44,61 c-25,-11 -44,-30 -44,-61 l0,-38 z" fill="${b}" fill-opacity=".22" stroke="${c}" stroke-width="2"/><path d="M451,164 l14,14 l27,-31" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  for(let i=0;i<10;i++){const an=r()*6.28,rr=70+r()*110;g+=`<circle cx="${f(470+rr*Math.cos(an))}" cy="${f(165+rr*Math.sin(an))}" r="${(1.5+r()*2.5).toFixed(1)}" fill="${c}" opacity=".7"/>`}}
 else if(kind==="network"){const N=[];for(let i=0;i<24;i++)N.push([280+r()*340,30+r()*260,2+r()*5]);
  N.forEach((n,i)=>N.slice(i+1).forEach(m=>{const d=Math.hypot(n[0]-m[0],n[1]-m[1]);if(d<100)g+=`<line x1="${f(n[0])}" y1="${f(n[1])}" x2="${f(m[0])}" y2="${f(m[1])}" stroke="${c}" stroke-opacity="${(.55-d/190).toFixed(2)}" stroke-width="1"/>`}));
  N.forEach((n,i)=>{const hot=i%6===0;g+=`<circle cx="${f(n[0])}" cy="${f(n[1])}" r="${f(n[2]*(hot?5:3))}" fill="${c}" opacity="${hot?.2:.1}"/><circle cx="${f(n[0])}" cy="${f(n[1])}" r="${n[2].toFixed(1)}" fill="${hot?'#fff':c}" opacity="${hot?.95:.8}"/>`})}
 else if(kind==="timeline"){for(let i=0;i<8;i++){const y=44+i*32,x=260+r()*110,w=80+r()*220;g+=`<rect x="${f(x)}" y="${y}" width="${f(w)}" height="10" rx="5" fill="${i%3===0?`url(#${id}b)`:c}" opacity="${i%3===0?.95:(.18+r()*.2).toFixed(2)}"/>`;if(r()>.5)g+=`<path d="M${f(x+w+12)},${y-3} l8,8 l-8,8 l-8,-8 z" fill="${c}" opacity=".9"/>`}
  g+=`<line x1="480" x2="480" y1="20" y2="300" stroke="${c}" stroke-width="1.5" stroke-dasharray="3 7" opacity=".7"/>`+halo(480,160,60)}
 else if(kind==="signal"){for(let i=1;i<=5;i++)g+=`<circle cx="500" cy="165" r="${i*36}" fill="none" stroke="${c}" stroke-opacity="${(.45-i*.07).toFixed(2)}" stroke-width="1.2"/>`;
  let d="M230,170";for(let i=1;i<=20;i++){const x=230+i*20,y=i%7===3?72:i%7===4?262:170+(r()-.5)*18;d+=` L${x},${f(y)}`}
  g+=halo(500,165,50)+`<path d="${d}" fill="none" stroke="url(#${id}b)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="500" cy="165" r="6" fill="#fff" opacity=".95"/>`}
 else{for(let i=1;i<=6;i++)g+=`<path d="M${470-i*58},320 A${i*58},${i*58} 0 0 1 ${470+i*58},320" fill="none" stroke="${c}" stroke-opacity="${(.55-i*.07).toFixed(2)}" stroke-width="${i%2?1.2:2.4}"/>`;
  g+=halo(470,250,110)+`<circle cx="470" cy="256" r="26" fill="${c}" opacity=".95"/>`;for(let i=0;i<22;i++){const an=-3.1+i*.3;g+=`<line x1="${f(470+44*Math.cos(an))}" y1="${f(256+44*Math.sin(an))}" x2="${f(470+(60+r()*30)*Math.cos(an))}" y2="${f(256+(60+r()*30)*Math.sin(an))}" stroke="${c}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`}}
 g+=`<rect width="640" height="320" filter="url(#${id}n)" opacity=".07"/>`;
 return `<svg viewBox="0 0 640 320" preserveAspectRatio="xMaxYMid slice" role="presentation" aria-hidden="true" focusable="false">${defs}${g}</svg>`}

/* ---------- personal choices (saved on this device, per role) ---------- */
const CK="oukala.r21.cus.v2";
function cusAll(){try{return JSON.parse(localStorage.getItem(CK)||"{}")||{}}catch(e){return{}}}
function cusGet(k){return cusAll()[k]||null}
function cusSave(k,v){try{const a=cusAll();if(v)a[k]=v;else delete a[k];localStorage.setItem(CK,JSON.stringify(a))}catch(e){}}
function effTop(k){const p=P[k],c=cusGet(k);if(c&&Array.isArray(c.top)&&c.top.length===3){return c.top.map((id,i)=>{const d=p.top.find(t=>t[0]===id);if(d)return d;if(id==="@orders")return[id,"Open orders"];if(id==="@requests")return[id,"Open requests"];const m=M(id);return m?[id,m.n]:p.top[i]})}return p.top}
function panelOf(id){if(PL[id])return PL[id];if(/^m:/.test(id)){const mid=id.slice(2),m=M(mid);if(!m)return null;const same=Object.keys(METRICS).filter(x=>x!==mid&&METRICS[x].owner===m.owner).slice(0,2);return{t:m.n,q:"Owner: "+m.owner+". What sits behind this number?",go:"metrics:"+mid,cta:"Open in Metrics",lead:mid,rows:same}}return null}
function effCare(k){const p=P[k],c=cusGet(k);const ids=c&&Array.isArray(c.care)?c.care:p.care;return ids.map(id=>({id,p:panelOf(id)})).filter(x=>x.p)}
const stOf=m=>G(()=>mstat(m),"good");
const stCls=s=>s==="good"?"good":s==="warn"?"warn":"bad";
const stTxt=s=>s==="good"?"On target":s==="warn"?"Watch":"Off target";
/* ---------- panels ---------- */
function care(c){const m=M(c.lead);if(!m)return"";const s=stOf(m),cl=stCls(s);
 const rows=(c.rows||[]).map(id=>M(id)?{id,m:M(id)}:null).filter(Boolean).map(({id,m})=>{const s2=stOf(m);return `<li class="r21-row"><button type="button" data-r21-met="${E(id)}"><span class="r21-rl">${E(m.n)}</span><b>${E(mfmt(m))}</b><span class="r21-bar st-${stCls(s2)}" role="img" aria-label="${stTxt(s2)}, target ${m.dir==="max"?"at least":"at most"} ${E(mfmt(m,m.tgt))}"><i style="width:${fillPct(m).toFixed(0)}%"></i></span></button></li>`}).join("");
 return `<section class="card glass r21-care"><div class="r21-ch"><h3>${E(c.t)}</h3><p class="r21-q">${E(c.q)}</p></div>
 <button type="button" class="r21-lead st-${cl}" data-r21-met="${E(c.lead)}"><span class="r21-bigw"><span class="r21-big">${E(mfmt(m))}</span><span class="r21-bl">${E(m.n)}</span><span class="pill ${cl}">${stTxt(s)} · target ${m.dir==="max"?"≥":"≤"} ${E(mfmt(m,m.tgt))}</span></span>${spark(m.tr,"currentColor",170,56)}</button>
 <ul class="r21-rows">${rows}</ul><div class="r21-cf"><button type="button" class="btn quiet" data-go="${E(c.go)}">${E(c.cta)}</button></div></section>`}

/* ---------- ranked work ---------- */
const money=n=>n==null?"":G(()=>"$"+Math.round(n).toLocaleString("en-US"),"");
function dueOf(x){const d=x.dueH;if(d!=null){if(d<0){const dd=Math.round(-d/24);return[dd>=1?"Overdue "+dd+" d":"Overdue "+Math.max(1,Math.round(-d))+" h","bad",d]}if(d<=24)return["Due in "+Math.max(1,Math.round(d))+" h","warn",d];return["Due in "+Math.round(d/24)+" d","mute",d]}
 const a=x.ageH||0;return[a>=24?"Waiting "+Math.round(a/24)+" d":"New","mute",9999]}
const riskTone={high:["High risk","bad"],med:["Medium","warn"],low:["Low","mute"]};
function score(x,re){return(x.urgent?100:0)+Math.min(96,Math.max(0,-(x.dueH||0)))/1.5+({high:30,med:15,low:0}[x.risk]||0)+(re&&re.test((x.cat||"")+" "+(x.title||""))?20:0)+Math.min(30,(x.ageH||0)/12)}
function dedupe(list){const seen={};return list.filter(x=>{const t=(x.title||"")+"|"+(x.cat||"");if(seen[t])return false;seen[t]=1;return true})}
function pool(k){let it=dedupe(G(()=>INBOX.items(),[]));const re=REL[k];
 if(re){const rel=it.filter(x=>re.test((x.cat||"")+" "+(x.title||"")+" "+(x.src||"")));if(rel.length>=3)it=rel}
 return it.map(x=>({x,s:score(x,re)})).sort((a,b)=>b.s-a.s).map(o=>o.x)}
/* executives: the few things only they can decide, chosen by what their role weighs. Small purchases, requests and alerts stay with the people who run them. */
function decisions(k){const d=P[k].dec;if(!d)return[];const all=dedupe(G(()=>INBOX.items(),[]));
 const big=all.filter(x=>(x.amt||0)>=d.amt||(d.inv&&x.cat==="Invoice"&&(x.amt||0)>=d.inv));
 const wanted=all.filter(x=>d.want.test((x.cat||"")+" "+(x.title||""))&&(!SKIP_X.test(x.cat||"")||(d.cats&&d.cats.test(x.cat||""))));
 const cat=all.filter(x=>d.cats&&d.cats.test(x.cat||""));
 let it=[];[wanted,big,cat].forEach(g=>g.forEach(x=>{if(it.indexOf(x)<0)it.push(x)}));
 it=it.filter(x=>!SKIP_X.test(x.cat||"")||(d.cats&&d.cats.test(x.cat||"")));
 const per={};it=it.filter(x=>{per[x.cat]=(per[x.cat]||0)+1;return per[x.cat]<=2});
 const sc=x=>score(x,d.want)+Math.min(60,Math.log10(1+(x.amt||0))*9)+((x.amt||0)>=d.amt?25:0);
 return it.sort((a,b)=>sc(b)-sc(a)).slice(0,6)}
const UI={f:"all",s:"prio",more:false};
const TABS=[["all","All",()=>true],["over","Overdue",x=>x.dueH!=null&&x.dueH<0],["high","High risk",x=>x.risk==="high"],["appr","Approvals",x=>x.kind==="approval"],["act","Actions",x=>x.kind==="action"],["info","Alerts and mentions",x=>x.kind==="mention"]];
function rowsHTML(list,startAt){return list.map((x,i)=>{const w=dueOf(x),r=riskTone[x.risk]||riskTone.low;
 return `<tr class="r21-tr" data-inbx-item="${E(x.id)}" tabindex="0"><td class="r21-n" aria-hidden="true"><span class="r21-rank">${(startAt||0)+i+1}</span></td><td class="r21-c-item"><b>${E(x.title)}</b>${x.urgent?'<span class="pill warn r21-u">Urgent</span>':""}</td><td class="r21-hide-sm">${E(x.cat||"")}</td><td class="r21-hide-sm">${E(x.req||"")}</td><td class="r21-hide-sm r21-num">${E(money(x.amt))}</td><td><span class="pill ${w[1]}">${E(w[0])}</span></td><td class="r21-hide-sm"><span class="pill ${r[1]}">${E(r[0])}</span></td><td class="r21-c-go"><button type="button" class="btn quiet" data-inbx-item="${E(x.id)}" aria-label="Open ${E(x.title)}">Open</button></td></tr>`}).join("")}
const SORTS={prio:["Priority",null],due:["Due soonest",(a,b)=>dueOf(a)[2]-dueOf(b)[2]],val:["Largest value",(a,b)=>(b.amt||0)-(a.amt||0)],old:["Waiting longest",(a,b)=>(b.ageH||0)-(a.ageH||0)]};
function tableHTML(all,opts){opts=opts||{};const tabs=TABS.map(t=>[t[0],t[1],all.filter(t[2]).length,t[2]]).filter(t=>t[0]==="all"||t[2]>0);
 if(!tabs.some(t=>t[0]===UI.f))UI.f="all";
 const f=(TABS.find(t=>t[0]===UI.f)||TABS[0])[2];let list=all.filter(f);const so=SORTS[UI.s];if(so&&so[1])list=list.slice().sort(so[1]);
 const lim=opts.limit||8,shown=UI.more?list:list.slice(0,lim);
 return `<div class="r21-bar2"><div class="r21-chips" role="group" aria-label="Filter your work">${tabs.map(t=>`<button type="button" class="chip" data-r21-f="${t[0]}" aria-pressed="${t[0]===UI.f}">${E(t[1])} <span class="r21-cn">${t[2]}</span></button>`).join("")}</div>
 <label class="r21-sortl">Sort <select class="fin" data-r21-s aria-label="Sort your work">${Object.keys(SORTS).map(s=>`<option value="${s}" ${s===UI.s?"selected":""}>${SORTS[s][0]}</option>`).join("")}</select></label></div>
 <div class="r21-tw" tabindex="0" role="region" aria-label="Work table"><table class="r21-t"><thead><tr><th class="r21-n"><span class="sr-only">Rank</span></th><th>What needs you</th><th class="r21-hide-sm">Type</th><th class="r21-hide-sm">From</th><th class="r21-hide-sm r21-num">Value</th><th>When</th><th class="r21-hide-sm">Risk</th><th class="r21-c-go"><span class="sr-only">Open</span></th></tr></thead><tbody>${rowsHTML(shown)||`<tr><td colspan="8" class="muted small r21-emp">You are clear. New items appear here as they arrive.</td></tr>`}</tbody></table></div>
 <div class="r21-tf"><span class="muted small">Showing ${shown.length} of ${list.length}</span>${list.length>lim?`<button type="button" class="btn quiet" data-r21-more>${UI.more?"Show fewer":"Show all "+list.length}</button>`:""}</div>`}
function acts(k){return G(()=>(PERSONAS[k].actions||[]).map(f=>f()).filter(Boolean).slice(0,4),[])}
function standing(k,title){const a=acts(k);if(!a.length)return"";return `<section class="card glass r21-stand"><div class="cardhead"><div><h3>${E(title)}</h3><span class="muted small">Standing work that comes with your role.</span></div></div><ul class="r21-sl">${a.map(x=>`<li class="r21-st"><div><b>${E(x[0])}</b><small>${E(x[1])}</small></div><button type="button" class="btn quiet" data-needgo="${E((x[2]||[]).join("|"))}">${E(x[3]||"Open")}</button></li>`).join("")}</ul></section>`}
function workHTML(k,p){const all=pool(k);return `<section class="card glass r21-work" id="r21WorkHost"><div class="cardhead"><div><h3>Your work, prioritized</h3><span class="muted small">Ranked by urgency, risk and how much your role is accountable for it. Select a row to open it.</span></div>${p.ro?'<span class="pill mute">Read only</span>':`<button type="button" class="btn quiet" data-inbx-focus>Review one by one</button>`}</div>${tableHTML(all,{limit:8})}</section>`}
function decHTML(k,p){const list=decisions(k);
 const ag=standing(k,"Your agenda");return `<div class="r21-dg${ag?"":" r21-solo"}"><section class="card glass r21-work r21-need"><div class="cardhead"><div><h3>Decisions waiting for you</h3><span class="muted small">Only what a ${E(p.sub.split(" · ")[0].toLowerCase())} decides. Smaller requests stay with the people who run them. Select a row to open it.</span></div><button type="button" class="btn quiet" data-go="inbox">Open the full inbox</button></div>
 <div class="r21-tw" tabindex="0" role="region" aria-label="Decisions table"><table class="r21-t"><thead><tr><th class="r21-n"><span class="sr-only">Rank</span></th><th>Decision</th><th class="r21-hide-sm">Type</th><th class="r21-hide-sm">From</th><th class="r21-hide-sm r21-num">Value</th><th>When</th><th class="r21-hide-sm">Risk</th><th class="r21-c-go"><span class="sr-only">Open</span></th></tr></thead><tbody>${rowsHTML(list)||`<tr><td colspan="8" class="muted small r21-emp">Nothing is waiting on you that only you can decide.</td></tr>`}</tbody></table></div></section>${ag}</div>`}

/* ---------- compose ---------- */
function build(prev){const k=S.persona,p=P[k];if(!p)return prev;
 const m0=prev.match(/^\s*<div class="screen[^"]*"[^>]*>/);if(!m0)return prev;
 const hi=prev.indexOf("</section>");if(hi<0)return prev;
 let rest=prev.slice(hi+10);
 if(p.kind==="self"||p.kind==="line"){rest=rest.replace(/<section class="[^"]*r18-homelens[^"]*"[\s\S]*?<\/section>/,"")}const li=rest.lastIndexOf("</div>");if(li>=0)rest=rest.slice(0,li);
 const who=me();let story=G(()=>R15D.storyFor&&R15D.storyFor(k),"");
 const lvl=({exec:"You decide",lead:"You lead",line:"You do the work",self:"You ask and track"})[p.kind];
 const top=effTop(k).map(t=>tile(t,who.name)).join("");
 const hero=`<section class="hero r21-hero" style="--p1:${p.pal[0]};--p2:${p.pal[1]};--p3:${p.pal[2]}"><div class="r21-art">${heroArt(k,p)}</div><div class="r21-hc"><div class="eyebrow r21-eb">${E(G(()=>NOW.day,"Today"))} · Meridian Standards Foundation</div><h1>Welcome${/^(board|guest)$/.test(k)?'':', '+E(who.first)}.</h1><p class="r21-role">${E(p.sub)} · ${E(lvl)}${p.ro?" · read only":""}</p>${story&&p.kind!=="self"?`<p class="r21-story">${story}</p>`:""}<div class="r21-top" role="group" aria-label="Your three numbers">${top}</div><div class="r21-hr"><button type="button" class="chip" data-r21-cus aria-haspopup="dialog">Choose what matters to you</button><button type="button" class="chip" data-ask="What should I look at first today?">What should I look at first?</button></div></div></section>`;
 const cs=effCare(k),panels=cs.map(c=>care(c.p)).join("");
 const head=`<div class="r21-sh"><h2>What you care about</h2><span class="muted small">${p.kind==="exec"?"The details behind your numbers.":"The numbers behind your work."}</span><button type="button" class="btn quiet r21-edit" data-r21-cus>Change topics</button></div>`;
 const grid=cs.length?`${head}<div class="r21-cg r21-n${Math.min(4,cs.length)}">${panels}</div>`:"";
 const sec=[];
 if(p.kind==="exec"){sec.push(grid);if(p.dec)sec.push(decHTML(k,p));else sec.push(standing(k,"Your agenda"))}
 else if(p.kind==="lead"||p.kind==="line"){sec.push(workHTML(k,p));sec.push(standing(k,"Standing work for your role"));sec.push(grid)}
 else sec.push(grid);
 const more=rest.trim()?`<details class="r21-more" open><summary><span class="r21-mh">Other considerations</span><span class="muted small">More from your home: approvals, projects and the executive lens.</span></summary><div class="r21-mi">${rest}</div></details>`:"";
 return `${m0[0].replace(/class="screen[^"]*"/,'class="screen r21-home"')}${hero}${sec.join("")}${more}</div>`}

function install(){const R=(typeof _R!=="undefined"?_R:W._R);if(!R||!R.home||R.home.__r21)return;const prev=R.home;const f=function(){const h=prev.apply(this,arguments);try{return build(h)}catch(e){console.error("r21 home",e);return h}};f.__r21=1;R.home=f}
try{install()}catch(e){console.error(e)}

/* ---------- a metric opens in a window, not a page ---------- */
function popHost(id,cls){let el=D.getElementById(id);if(!el){el=D.createElement("div");el.id=id;el.setAttribute("popover","auto");el.className="pop glass "+cls;D.body.appendChild(el)}return el}
function openMet(id){if(!M(id))return;const el=popHost("r21MetPop","r21-metpop");
 el.innerHTML=G(()=>metricBody(id),"")+`<div class="row" style="margin-top:14px"><button class="btn" type="button" popovertarget="r21MetPop" popovertargetaction="hide">Close</button><button class="btn quiet" type="button" data-go="metrics:${E(id)}" popovertarget="r21MetPop" popovertargetaction="hide">Open in Metrics</button></div>`;
 el.setAttribute("aria-label",M(id).n);try{el.showPopover()}catch(e){}}

/* ---------- choose what matters ---------- */
function metOptions(sel){const ids=Object.keys(METRICS).sort((a,b)=>METRICS[a].n.localeCompare(METRICS[b].n));
 return `<option value="@orders" ${sel==="@orders"?"selected":""}>My open orders</option><option value="@requests" ${sel==="@requests"?"selected":""}>My open requests</option>`+ids.map(id=>`<option value="${E(id)}" ${id===sel?"selected":""}>${E(METRICS[id].n)}</option>`).join("")}
function openCus(){const k=S.persona,p=P[k];if(!p)return;const el=popHost("r21CusPop","r21-cus");const top=effTop(k),cur=effCare(k).map(c=>c.id);
 const sug=Object.keys(PL),mine=p.care;const order=mine.concat(sug.filter(x=>mine.indexOf(x)<0));
 const customs=cur.filter(x=>/^m:/.test(x));
 const cb=(id,pn,suggested)=>`<label class="r21-ck"><input type="checkbox" name="care" value="${E(id)}" ${cur.indexOf(id)>=0?"checked":""}><span><b>${E(pn.t)}</b><small>${E(pn.q)}</small></span>${suggested?'<span class="pill info">For your role</span>':""}</label>`;
 el.innerHTML=`<div class="eyebrow">Make it yours</div><h3>What matters most to you</h3><p class="muted small">Pick the three numbers at the top of your home, and up to four topics you want detail on. Saved on this device for the ${E(p.sub.split(" · ")[0].toLowerCase())} view. It never changes what you are allowed to see.</p>
 <form class="r21-cf2" data-r21-form><fieldset><legend>Your three numbers</legend>${[0,1,2].map(i=>`<label class="r21-sl2">Number ${i+1}<select class="fin" name="t${i}">${metOptions(top[i][0])}</select></label>`).join("")}</fieldset>
 <fieldset><legend>Topics you want detail on <span class="muted small" data-r21-cnt></span></legend><div class="r21-cks">${order.map(id=>cb(id,PL[id],mine.indexOf(id)>=0)).join("")}${customs.map(id=>{const pn=panelOf(id);return pn?cb(id,pn,false):""}).join("")}</div>
 <label class="r21-sl2">Add any measure as a topic<select class="fin" name="addm"><option value="">Choose a measure…</option>${metOptions("").replace(/<option value="@[^>]*>[^<]*<\/option>/g,"")}</select></label></fieldset>
 <div class="row r21-cb"><button type="submit" class="btn primary">Save</button><button type="button" class="btn quiet" data-r21-reset>Reset to the ${E(p.sub.split(" · ")[0].toLowerCase())} defaults</button><button type="button" class="btn" popovertarget="r21CusPop" popovertargetaction="hide">Cancel</button></div></form>`;
 el.setAttribute("aria-label","What matters most to you");cusCount();try{el.showPopover()}catch(e){}}
function cusCount(){const el=D.getElementById("r21CusPop");if(!el)return;const n=el.querySelectorAll('input[name="care"]:checked').length;const c=el.querySelector("[data-r21-cnt]");if(c)c.textContent="· "+n+" chosen"+(n>4?" (the first four are shown)":"")}
function repaint(){try{render()}catch(e){}}
function closeCus(){const el=D.getElementById("r21CusPop");try{el&&el.hidePopover()}catch(e){}}
function saveCus(form){const k=S.persona,fd=new FormData(form);const top=[fd.get("t0"),fd.get("t1"),fd.get("t2")];
 if(new Set(top).size<3){G(()=>toast("Pick three different numbers","warn"));return}
 let care=fd.getAll("care");const add=fd.get("addm");if(add&&care.indexOf("m:"+add)<0)care.push("m:"+add);
 if(!care.length){G(()=>toast("Pick at least one topic","warn"));return}
 cusSave(k,{top,care:care.slice(0,4)});closeCus();repaint();G(()=>toast("Your home now shows what matters to you","good"))}

/* ---------- clicks ---------- */
D.addEventListener("click",e=>{const T=e.target.closest&&e.target.closest.bind(e.target);if(!T)return;let t;
 if(t=T("[data-r21-met]")){e.preventDefault();openMet(t.dataset.r21Met);return}
 if(T("[data-r21-cus]")){e.preventDefault();openCus();return}
 if(T("[data-r21-reset]")){cusSave(S.persona,null);closeCus();repaint();G(()=>toast("Back to the role defaults","info"));return}
 if(t=T("[data-r21-f]")){UI.f=t.dataset.r21F;UI.more=false;redo();return}
 if(T("[data-r21-more]")){UI.more=!UI.more;redo();return}
 if(t=T(".r21-tr")){if(T("button,a,select"))return;const id=t.dataset.inbxItem;if(id){const b=D.createElement("button");b.dataset.inbxItem=id;b.style.display="none";D.body.appendChild(b);b.click();b.remove()}}});
D.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.classList&&e.target.classList.contains("r21-tr")){e.preventDefault();const id=e.target.dataset.inbxItem;if(id){const b=D.createElement("button");b.dataset.inbxItem=id;b.style.display="none";D.body.appendChild(b);b.click();b.remove()}}});
D.addEventListener("change",e=>{const t=e.target;if(t&&t.matches&&t.matches("[data-r21-s]")){UI.s=t.value;redo()}if(t&&t.matches&&t.matches('#r21CusPop input[name="care"]'))cusCount()});
D.addEventListener("submit",e=>{const f=e.target;if(f&&f.matches&&f.matches("[data-r21-form]")){e.preventDefault();saveCus(f)}});
function redo(){const host=D.getElementById("r21WorkHost");if(!host)return;const k=S.persona,p=P[k];if(!p||!p.work&&p.kind!=="line"&&p.kind!=="lead"){return}const tmp=D.createElement("div");tmp.innerHTML=workHTML(k,p);const n=tmp.firstElementChild;host.replaceWith(n)}
W.R21H={profiles:P,panels:PL,build,decisions,pool,art,openMet,openCus};
})();
