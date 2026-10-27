/* ============ SOW and contract analyzer (prefix sow) ============
   Screen ppm_sow. Repository of proposals and executed contracts, AI line-by-line analysis, terms playbook,
   proposal vs contract compare, change control, obligations and calendar. */
(function(){
S.sow=S.sow||{ct:"CLM-1002",doc:"proposal",scope:"doc",cmp:"CLM-1001",run:null,line:null,crSel:null,oSel:null,more:{},rq:"all",pbq:""};
const SW=S.sow;
/* ---------- dates ---------- */
const TDY=window.U.TODAY_ISO,DMS=864e5,t0=iso=>Date.parse(iso+"T00:00:00Z");
const addD=(iso,n)=>new Date(t0(iso)+n*DMS).toISOString().slice(0,10);
const difD=(a,b)=>Math.round((t0(a)-t0(b))/DMS);
const fdt=(iso,noy)=>iso?new Date(t0(iso)).toLocaleDateString("en-US",Object.assign({month:"short",day:"numeric",timeZone:"UTC"},noy?{}:{year:"numeric"})):"None";
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONF={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const D$=n=>"$"+Math.round(Math.abs(n)).toLocaleString("en-US");
const S$=n=>(n<0?"-":n>0?"+":"")+D$(n);
const pct1=n=>(Math.round(n*10)/10)+"%";
const sum=(a,f)=>a.reduce((x,y)=>x+(f?f(y):y),0);
const hash=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
const ID=(p)=>p+Math.random().toString(36).slice(2,7);
/* ---------- numbers in words ---------- */
const W2N={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,twelve:12,fifteen:15,twenty:20,thirty:30,sixty:60,ninety:90,"forty-five":45};
const NUMW="(\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|forty-five|sixty|ninety)";
const nOf=x=>{x=String(x).toLowerCase();return W2N[x]!=null?W2N[x]:parseFloat(x.replace(/,/g,""))};
const m1=(s,re)=>{const m=s.match(re);return m?nOf(m[1]):null};
const R_=(src)=>new RegExp(src.replace(/NUM/g,NUMW));
const pctOf=s=>m1(s,/(\d+(?:\.\d+)?)\s*(?:percent|%)/);
/* ---------- people used here ---------- */
const LEGAL="Atlantic Legal";
const TIERS=[{id:"T1",max:10000,role:"Budget owner",who:"Maya Ortiz"},{id:"T2",max:25000,role:"Portfolio lead",who:"Maya Ortiz"},{id:"T3",max:100000,role:"CIO",who:"Casey Rowan"},{id:"T4",max:250000,role:"CFO",who:"CFO"},{id:"T5",max:1000000,role:"CEO",who:"CEO"},{id:"T6",max:Infinity,role:"Board finance committee",who:"Board finance committee"}];
const tierOf=amt=>TIERS.find(t=>Math.abs(amt)<=t.max)||TIERS[5];
const chainFor=amt=>{const t=tierOf(amt),out=[{r:"Contract owner",who:null,why:"Confirms the business need"},{r:LEGAL,who:null,why:"Reviews any change to legal terms"}];if(Math.abs(amt)>10000)out.push({r:"Controller",who:"Avery Chen",why:"Orders above $10,000 need finance review"});out.push({r:t.role,who:t.who,why:"Delegation of authority "+t.id+" covers up to "+(t.max===Infinity?"any amount":D$(t.max))});return out};
/* ---------- Terms playbook: Atlantic Systems standard clause library ---------- */
const ok_=(v,o)=>Object.assign({ok:true,v:v},o||{}),bad_=(v,why,o)=>Object.assign({ok:false,v:v,why:why},o||{});
const PB=[
{id:"PB-PAY",n:"Payment terms",cat:"Commercial",risk:"Medium",
 std:"Atlantic Systems pays undisputed amounts within 45 days of receiving a correct invoice.",
 fb:"Net 30 is acceptable only with a 2 percent discount for payment within 10 days.",kw:"net, payable within, days of invoice",
 re:/net\s*\d+|payable within|within \w+(?:-\w+)? (?:calendar |business )?days (?:of|after) (?:the )?(?:date of |receipt of )?(?:a |the )?(?:correct |undisputed )?invoice/,
 chk:s=>{const d=m1(s,/(?:net\s*|within\s+)(\d+|thirty|forty-five|sixty|ninety)/);if(d==null)return null;return d>=45?ok_("Net "+d):bad_("Net "+d,"The vendor asks to be paid in "+d+" days. Our standard is 45 days"+(d>=30?"; Net 30 is allowed only with a 2 percent early-payment discount.":"."),{fb:d>=30})}},
{id:"PB-ACC",n:"Payment only after acceptance",cat:"Commercial",risk:"High",types:["payment"],
 std:"Milestone payments become due only after Atlantic Systems gives written acceptance of the deliverable. No advance payments are made.",
 fb:"A mobilization advance up to 5 percent is acceptable if it is secured by a credit against the final milestone.",kw:"upon delivery, in advance, prepaid, upon signature",
 re:/\b(?:upon|on|at) (?:delivery|completion|signature|signing|execution)|in advance|prepa|upon acceptance|after (?:written )?acceptance|following acceptance/,
 chk:s=>/accept/.test(s)&&!/deemed/.test(s)?ok_("After acceptance"):bad_(/advance|prepa|signature|signing/.test(s)?"Paid in advance":"Paid on delivery","Payment is triggered by delivery or signature, not by Atlantic Systems' acceptance. That is how the invoice for work not yet accepted gets paid.",{fb:/advance|signature/.test(s)&&(pctOf(s)==null||pctOf(s)<=5)})},
{id:"PB-LOL",n:"Limitation of liability",cat:"Legal",risk:"High",
 std:"Each party's aggregate liability is limited to the fees paid or payable in the 12 months before the claim, with a 3x super-cap for data breach and no cap for IP indemnity, gross negligence or willful misconduct.",
 fb:"A 2x super-cap for data breach is acceptable. A cap below 12 months of fees is not.",kw:"aggregate liability, limited to, cap",
 re:/aggregate liability|liability (?:is|shall be|will be) (?:limited|capped)|total liability|cap on liability/,
 chk:s=>{const mo=m1(s,R_("NUM\\s+months?")),yr=m1(s,R_("NUM\\s+years?"));const m=mo!=null?mo:yr!=null?yr*12:null;if(/unlimited/.test(s))return ok_("Unlimited");if(m==null)return bad_("Cap not clear","The cap is not stated in months of fees, so it cannot be compared with our 12 month standard.");return m>=12?ok_(m+" months of fees"):bad_(m+" months of fees","The cap is "+m+" months of fees; our standard is 12 months. A short cap leaves Atlantic Systems exposed to a vendor failure in the middle of the project.")}},
{id:"PB-IND",n:"IP infringement indemnity",cat:"Legal",risk:"High",
 std:"The supplier will defend and indemnify Atlantic Systems against third-party claims that the deliverables or services infringe intellectual property rights, without a cap.",
 fb:"None. This clause is not negotiable.",kw:"indemnify, defend, infringe",
 re:/indemnif|\bdefend\b/,
 chk:s=>/infring/.test(s)&&/(supplier|vendor|lumen|beacon|northwind|microsoft|contoso|legacydocs|will defend|shall defend)/.test(s)?ok_("Vendor indemnity for infringement"):/(atlantic|customer) (?:shall|will) indemnify/.test(s)?bad_("One-way indemnity from Atlantic Systems","Atlantic Systems would indemnify the vendor, but the vendor gives no matching IP indemnity."):ok_("Indemnity stated")},
{id:"PB-TFC",n:"Termination rights",cat:"Legal",risk:"Medium",
 std:"Atlantic Systems may terminate for convenience on 30 days written notice and pays only for accepted work. Either party may terminate for uncured material breach after 30 days.",
 fb:"60 days notice for convenience is acceptable on subscriptions with a prepaid term refund.",kw:"terminate, convenience, cause, breach",
 re:/terminat/,
 chk:s=>{if(/(?:may not|cannot|shall not) terminate/.test(s))return bad_("No exit for convenience","Atlantic Systems could not leave before the term ends, even if the service fails to deliver value.");if(/(supplier|vendor|lumen|beacon|northwind|microsoft|contoso|legacydocs) may terminate[^.]*convenience/.test(s))return bad_("Vendor may leave for convenience","The vendor could walk away mid-project.");if(/convenience|without cause|for any reason/.test(s)){const d=m1(s,R_("NUM days"));return d==null||d<=60?ok_("Convenience exit, "+(d||30)+" days"):bad_(d+" days notice","Notice is longer than our 60 day fallback.")}return ok_("For cause, cure period "+(m1(s,R_("NUM days"))||30)+" days")}},
{id:"PB-REN",n:"Renewal and auto-renewal",cat:"Commercial",risk:"High",
 std:"The agreement renews only by a written order signed by Atlantic Systems. The supplier sends a renewal reminder at least 120 days before the term ends.",
 fb:"Automatic renewal is acceptable only if notice of non-renewal is 60 days or less and the supplier sends a reminder 120 days before.",kw:"renews automatically, renewal term, non-renewal",
 re:/renew/,
 chk:s=>{const auto=/automatic|automatically|evergreen|successive/.test(s);const nt=m1(s,R_("NUM days'?\\s+(?:written |prior )?(?:notice|before|prior)"))||m1(s,R_("notice[^.]*?NUM days"));if(!auto)return ok_("Renews by written order");if(nt!=null&&nt<=60)return ok_("Auto-renews, "+nt+" days notice",{fbUsed:true});return bad_("Auto-renews, "+(nt!=null?nt+" days notice":"notice not stated"),(nt!=null?"The notice window is "+nt+" days, longer than our 60 day limit. ":"No notice period is stated. ")+"If nobody sends notice in time the contract renews for another term at the vendor's price.",{trap:true,fb:false})}},
{id:"PB-CAP",n:"Price increases and rate card",cat:"Commercial",risk:"Medium",
 std:"Rates are fixed for the term. Renewal price increases are capped at 3 percent a year or the consumer price index, whichever is lower.",
 fb:"A 5 percent cap is acceptable with 90 days written notice.",kw:"increase fees, adjust rates, uplift, cpi",
 re:/(?:increase|adjust|escalat|uplift)[^.]*\b(?:fees?|rates?|prices?|pricing)\b|\b(?:fees?|rates?|prices?|pricing)\b[^.]*(?:increase|adjust|escalat|uplift)|fixed for the (?:term|duration)|\bcpi\b/,
 chk:s=>{if(/fixed for the (?:term|duration)/.test(s))return ok_("Rates fixed for the term");const p=pctOf(s);if(p==null)return bad_("No cap on increases","Increases are allowed but no cap is stated.");return p<=3?ok_("Up to "+p+"% a year"):bad_("Up to "+p+"% a year","The vendor may raise prices by "+p+"% each year; our cap is 3%.",{fb:p<=5})}},
{id:"PB-SLA",n:"Availability service level",cat:"Service levels",risk:"Medium",
 std:"The service is available at least 99.9 percent of each month, measured by Atlantic Systems monitoring, excluding agreed maintenance.",
 fb:"99.5 percent is acceptable for Tier 2 services only.",kw:"availability, uptime",
 re:/availab(?:le|ility)|uptime/,
 chk:s=>{const p=pctOf(s);if(p==null)return null;return p>=99.9?ok_(p+"% monthly"):bad_(p+"% monthly","The vendor offers "+p+"% availability. That allows about "+Math.round((1-p/100)*43200)+" minutes of downtime a month; our standard is 99.9% (43 minutes).",{fb:p>=99.5})}},
{id:"PB-SLC",n:"Service credits",cat:"Service levels",risk:"Medium",
 std:"For each month below the availability target the supplier credits at least 10 percent of the monthly fee, rising to 25 percent below 99 percent. Credits are not the exclusive remedy.",
 fb:"A 7.5 percent credit is acceptable if repeated misses allow termination.",kw:"service credit",
 re:/service credit/,
 chk:s=>{if(/sole|exclusive remedy/.test(s))return null;const p=pctOf(s);if(p==null)return bad_("Credits not defined","Credits are mentioned but the amount is not stated.");return p>=10?ok_(p+"% of monthly fee"):bad_(p+"% of monthly fee","A credit of "+p+"% is below our 10% standard, so missing the target costs the vendor little.",{fb:p>=7.5})}},
{id:"PB-RSP",n:"Severity 1 response time",cat:"Service levels",risk:"Medium",
 std:"The supplier responds to a Severity 1 incident within 30 minutes, around the clock.",
 fb:"60 minutes is acceptable outside Tier 1 services.",kw:"severity 1, response",
 re:/sev(?:erity)?\s*(?:1|one)|priority\s*1|critical (?:incident|issue)/,
 chk:s=>{if(!/respon/.test(s))return null;const mi=m1(s,/(\d+)\s*minutes/),h=m1(s,R_("NUM\\s*hours?"));const m=mi!=null?mi:h!=null?h*60:null;if(m==null)return null;return m<=30?ok_(m+" minutes"):bad_(m<60?m+" minutes":(m/60)+" hours","The vendor responds to a critical incident in "+(m<60?m+" minutes":(m/60)+" hours")+"; our standard is 30 minutes.",{fb:m<=60})}},
{id:"PB-DPA",n:"Breach notification",cat:"Data and security",risk:"High",types:["data"],
 std:"The supplier notifies Atlantic Systems of a security incident affecting Atlantic Systems data within 48 hours of discovery.",
 fb:"72 hours is acceptable where the supplier also gives hourly updates for Severity 1 events.",kw:"breach, security incident, notify",
 re:/breach|security incident|data incident/,
 chk:s=>{const h=m1(s,R_("NUM\\s*hours"));if(h==null)return bad_("No time limit","Notification time is not stated, so Atlantic Systems could learn of a breach late.");return h<=48?ok_(h+" hours"):h<=72?ok_(h+" hours",{fbUsed:true}):bad_(h+" hours","Notice takes "+h+" hours, past our 72 hour fallback.")}},
{id:"PB-DPI",n:"Processing on instructions",cat:"Data and security",risk:"High",
 std:"The supplier processes personal data only on Atlantic Systems' documented instructions under the data processing addendum.",fb:"None.",kw:"documented instructions, data processing addendum",
 re:/documented instructions|data processing addendum|processes? personal data/,
 chk:s=>/own purposes|its own/.test(s)?bad_("Vendor own purposes","The vendor reserves the right to use personal data for its own purposes."):ok_("On instructions only")},
{id:"PB-SUB",n:"Subcontractors and subprocessors",cat:"Data and security",risk:"Medium",
 std:"The supplier may engage subcontractors or subprocessors only with Atlantic Systems' prior written consent and remains responsible for them.",
 fb:"Notice of 30 days with a right to object is acceptable for cloud infrastructure subprocessors.",kw:"subcontractors, subprocessors",
 re:/subcontract|subprocessor|sub-processor/,
 chk:s=>/without (?:the )?(?:prior )?(?:written )?(?:consent|approval|notice)/.test(s)?bad_("No consent needed","Subcontractors could be added without telling Atlantic Systems, including ones that touch Atlantic Systems data.",{fb:false}):/(?:prior|written) (?:written )?(?:consent|approval)|object/.test(s)?ok_("Prior consent"):bad_("Consent not stated","The clause does not say Atlantic Systems must approve subcontractors.")},
{id:"PB-SEC",n:"Security certifications",cat:"Data and security",risk:"Medium",
 std:"The supplier maintains a SOC 2 Type II report or ISO/IEC 27001 certification, provides it annually, encrypts data in transit and at rest, and runs an annual penetration test.",fb:"A SOC 2 Type I report is acceptable for one year for a new supplier.",kw:"soc 2, iso 27001, penetration, encrypt",
 re:/soc ?2|iso ?27001|penetration|encrypt|multi-?factor/,
 chk:s=>/type ii|iso ?27001|aes-?256|tls ?1\.[23]|annual/.test(s)?ok_("Certified, reported annually"):bad_("Certification not stated","No recognized certification or reporting cycle is stated.")},
{id:"PB-RES",n:"Data residency",cat:"Data and security",risk:"Medium",
 std:"Atlantic Systems data is stored and processed in the United States.",fb:"EU regions are acceptable for backup only.",kw:"stored in, hosted in, region",
 re:/(?:stored|hosted|reside|processed) in (?:the )?(?:united states|u\.?s\.?|eu|europe|any)/,
 chk:s=>/united states|\bus\b|u\.s\./.test(s)?ok_("United States"):bad_("Outside the United States","Data would be stored outside the United States.")},
{id:"PB-IPO",n:"Ownership of deliverables",cat:"Intellectual property",risk:"High",
 std:"Atlantic Systems owns all deliverables and work product created under the agreement, and the supplier assigns all rights to Atlantic Systems on payment.",fb:"A license is acceptable for the supplier's own tools, never for custom deliverables.",kw:"owns, ownership, work product, deliverables",
 re:/(?:owns?|ownership|title|assigns?)[^.]*(?:deliverables?|work product)|(?:deliverables?|work product)[^.]*(?:owned|property of)/,
 chk:s=>/atlantic (?:owns|shall own|will own)|owned by atlantic|assigns? [^.]*to atlantic|property of atlantic/.test(s)?ok_("Atlantic Systems owns"):bad_("Vendor keeps ownership","The vendor keeps ownership of work Atlantic Systems pays for.")},
{id:"PB-BIP",n:"Background IP license",cat:"Intellectual property",risk:"Medium",
 std:"The supplier grants Atlantic Systems a perpetual, royalty-free license to supplier tools embedded in the deliverables.",fb:"A term license that matches the life of the service is acceptable for SaaS.",kw:"background, pre-existing, embedded tools",
 re:/background (?:tools|ip|intellectual)|pre-?existing|embedded in the deliverables/,
 chk:s=>/perpetual/.test(s)?ok_("Perpetual license"):bad_("License is not perpetual","Atlantic Systems could lose the right to use deliverables after the contract ends.")},
{id:"PB-WAR",n:"Warranty period",cat:"Legal",risk:"Medium",
 std:"The supplier warrants that deliverables conform to the specification for 90 days after acceptance and corrects defects at no charge.",fb:"60 days is acceptable for low-risk deliverables.",kw:"warrants, conform, days after acceptance",
 re:/warrant/,
 chk:s=>{const d=m1(s,R_("NUM\\s*days"));if(d==null)return null;return d>=90?ok_(d+" days"):bad_(d+" days","The warranty is "+d+" days; our standard is 90.",{fb:d>=60})}},
{id:"PB-ACP",n:"Acceptance",cat:"Delivery",risk:"High",
 std:"Atlantic Systems has 10 business days to review each deliverable against agreed criteria. Silence is never acceptance.",fb:"A 5 business day reminder before a deliverable is escalated is acceptable.",kw:"deemed accepted, review period",
 re:/deemed accept|review (?:each|the) deliverable|acceptance (?:period|criteria)|not rejected/,
 chk:s=>{if(/deemed/.test(s))return bad_("Deemed acceptance","Silence counts as acceptance. A missed email would trigger payment for work nobody checked.",{fb:false});const d=m1(s,R_("NUM\\s*(?:business |calendar )?days"));return d==null||d>=10?ok_((d||10)+" business days"):bad_(d+" days to review","Atlantic Systems gets only "+d+" days to review; our standard is 10 business days.")}},
{id:"PB-CHG",n:"Change control",cat:"Delivery",risk:"Medium",
 std:"Changes take effect only through a written change order signed by both parties before work begins.",fb:"None.",kw:"change order, change request",
 re:/change (?:order|request|control)|changes (?:require|must)/,
 chk:s=>/unilateral|(?:supplier|vendor|lumen) may (?:change|amend)|without (?:atlantic's )?(?:consent|approval)/.test(s)?bad_("Vendor may change terms","The vendor may change the scope or terms without Atlantic Systems' signature."):ok_("Written change order, both sign")},
{id:"PB-EXP",n:"Travel and expenses",cat:"Commercial",risk:"Low",
 std:"Travel and expenses are reimbursed at cost only with Atlantic Systems' prior written approval and within a cap.",fb:"A pre-approved annual travel budget is acceptable.",kw:"travel, expenses",
 re:/expense|travel/,
 chk:s=>/prior (?:written )?(?:approval|consent)|pre-?approved|not to exceed|capped/.test(s)?ok_("Prior approval"):bad_("No approval needed","Expenses are billed at cost with no approval step or cap.")},
{id:"PB-KEY",n:"Key personnel",cat:"Delivery",risk:"Medium",
 std:"Named key personnel are assigned for the term and are replaced only with Atlantic Systems' written consent and a 10 business day handover.",fb:"Replacement with equal skills on 10 days notice is acceptable.",kw:"key personnel, named engineers",
 re:/key personnel|named (?:staff|resources|engineers)/,
 chk:s=>/(?:written )?(?:consent|approval)/.test(s)?ok_("Consent to replace"):bad_("Replacement is free","Named staff could be replaced at will.")},
{id:"PB-ASM",n:"Assumption failure",cat:"Delivery",risk:"Medium",
 std:"If an assumption proves false, the supplier raises a change request within 5 business days. Dates and fees do not change automatically.",fb:"Dates may slip day for day for a documented customer delay of more than 5 business days.",kw:"delay extends dates, additional fees",
 re:/(?:delay|failure|late)[^.]*(?:extend|relief|additional (?:fees|charges|cost))|(?:extends?|extended)[^.]*(?:dates|schedule)/,
 chk:s=>/automatic|extends? all dates|additional (?:fees|charges)/.test(s)?bad_("Dates and fees move automatically","A late approval or file from Atlantic Systems would extend every date and add fees with no change request.",{fb:false}):ok_("Through change request")},
{id:"PB-CONF",n:"Confidentiality",cat:"Legal",risk:"Low",
 std:"Confidentiality is mutual for five years after the term, and indefinitely for trade secrets and personal data.",fb:"Three years for non-sensitive material.",kw:"confidential",
 re:/confidential/,chk:s=>/(?:five|5) years|mutual|both parties/.test(s)?ok_("Mutual, five years"):bad_("One-way or undefined","Confidentiality is not mutual or has no clear period.")},
{id:"PB-LAW",n:"Governing law and venue",cat:"Legal",risk:"Low",
 std:"The agreement is governed by the laws of the State of Delaware, with venue in the courts of Delaware.",fb:"New York is acceptable.",kw:"governed by, governing law",
 re:/governed by|governing law/,chk:s=>/delaware/.test(s)?ok_("Delaware"):/new york/.test(s)?ok_("New York",{fbUsed:true}):bad_((s.match(/state of (\w+)/)||[0,"Another jurisdiction"])[1],"Disputes would be heard under another state's law and courts.",{fb:false})},
{id:"PB-INS",n:"Insurance",cat:"Legal",risk:"Low",
 std:"The supplier carries cyber liability insurance of at least $5,000,000 and professional liability insurance of at least $2,000,000.",fb:"$3,000,000 cyber for suppliers with no access to personal data.",kw:"insurance",
 re:/insurance/,chk:s=>/cyber/.test(s)&&/(?:5|five)\s*(?:million|m\b)|5,000,000/.test(s)?ok_("Cyber $5M"):bad_("Cover is below standard","Insurance is missing cyber cover of $5,000,000.")}
];
const PBN=Object.fromEntries(PB.map(p=>[p.id,p]));
const PBVER={};PB.forEach((p,i)=>{p.ver="v"+(1+(i%4));p.rev=addD(TDY,-30-((i*17)%200));p.owner=LEGAL;p.src="Standard";p.uses=0});
/* Terms the playbook does not cover yet: the AI drafts a proposed Atlantic Systems position for legal to review */
const NEWT=[
{id:"NT-AI",n:"AI and model training on Atlantic Systems data",cat:"Data and security",risk:"High",re:/(?:train|fine-?tun|improve)[^.]*(?:model|algorithm|machine learning)|machine learning|artificial intelligence|generative/,
 draft:"The supplier will not use Atlantic Systems content, prompts, outputs or usage data to train, fine-tune or improve any model. AI features require Atlantic Systems' written approval, and the supplier discloses the models and model providers it uses.",
 why:"Atlantic Systems' AI governance policy forbids vendors from learning from our content. The playbook has no clause for this yet, so legal should approve one."},
{id:"NT-PUB",n:"Publicity and use of Atlantic Systems' name",cat:"Legal",risk:"Low",re:/press release|case stud|publicity|(?:reference|refer to|identify)[^.]*(?:atlantic|customer)[^.]*(?:marketing|publicity|materials)/,
 draft:"The supplier will not use Atlantic Systems' name, logo or any statement about the relationship without Atlantic Systems' prior written approval for each use.",why:"Standards bodies are sensitive about endorsement. There is no publicity clause in the playbook."},
{id:"NT-NSO",n:"Non-solicitation of staff",cat:"Legal",risk:"Low",re:/solicit|(?:hire|employ)[^.]*(?:personnel|employees|staff)/,
 draft:"Neither party actively solicits the other's employees working on this agreement during the term and for six months after. General advertisements are not solicitation.",why:"A one-sided or long non-solicit limits Atlantic Systems' hiring. A mutual six month clause is the usual compromise."},
{id:"NT-USG",n:"Usage true-up and overage",cat:"Commercial",risk:"High",re:/true-?up|overage charges|invoice any overage|exceed(?:s|ed)? the (?:included|licensed)/,
 draft:"Usage above the committed amount is billed at the contracted rate only after Atlantic Systems receives a usage report, with a 10 percent tolerance and a 30 day right to dispute. True-ups never apply retroactively.",
 why:"Usage-based pricing can turn a $186,000 plan into a surprise bill. The playbook needs a rule for tolerance, evidence and dispute time."},
{id:"NT-AUDU",n:"Vendor audit of Atlantic Systems usage",cat:"Legal",risk:"Medium",re:/audit[^.]*(?:atlantic'?s? use|use of the|usage|compliance with (?:the )?licen)/,
 draft:"The supplier may verify license compliance once a year, with 30 days written notice, during business hours, by remote self-certification first and at the supplier's cost.",why:"An audit on 10 days notice at any time can disrupt operations and expose confidential data."},
{id:"NT-EXC",n:"Exclusive remedy",cat:"Legal",risk:"High",re:/sole and exclusive remedy|exclusive remedy/,
 draft:"Service credits are in addition to, and not instead of, Atlantic Systems' other remedies, including termination for chronic failure after three misses in any six months.",why:"If credits are the only remedy Atlantic Systems cannot leave a service that keeps failing."},
{id:"NT-SUS",n:"Suspension of service",cat:"Commercial",risk:"Medium",re:/suspend[^.]*(?:service|access|work)|withhold[^.]*(?:service|work|delivery)/,
 draft:"The supplier may suspend service for non-payment only after 30 days written notice of an undisputed overdue amount, and never for amounts under dispute.",why:"Suspending a production service on a short invoice delay would harm readers of the standards."},
{id:"NT-EXL",n:"Exclusivity and minimum commitment",cat:"Commercial",risk:"High",re:/exclusiv(?:e|ity) (?:provider|supplier|vendor)|minimum (?:purchase|annual) commitment|take-or-pay/,
 draft:"Atlantic Systems makes no exclusivity or minimum purchase commitment beyond the fixed fees in the order form.",why:"Commitments bind spend before value is shown."},
{id:"NT-GEN",n:"Legal term with no playbook position",cat:"Legal",risk:"Medium",re:/(?!)/,
 draft:"Legal to draft a standard position for this topic.",why:"The playbook has no clause covering this sentence."}
];
const NTN=Object.fromEntries(NEWT.map(p=>[p.id,p]));
/* ---------- Line types ---------- */
const TYP={deliverable:["Deliverable","--p1"],milestone:["Milestone","--p4"],commitment:["Commitment","--p5"],outcome:["Outcome","--p6"],kpi:["Measure or KPI","--w1"],sla:["Service level","--w3"],payment:["Payment or invoice term","--e1"],assumption:["Assumption","--e4"],dependency:["Dependency","--s1"],obl_us:["Our obligation","--s3"],obl_vendor:["Vendor obligation","--s4"],risk:["Risk","--u1"],term:["Term, renewal, termination","--u3"],liability:["Liability and indemnity","--u4"],data:["Data protection and security","--accent"],ip:["Intellectual property","--bad"],warranty:["Warranty","--good"],price:["Price or rate card","--warn"],change:["Change control","--story"],legal:["General legal term","--metric"]};
const TR=[
 ["milestone",s=>/^milestone \d+\s*:/.test(s)],
 ["sla",s=>/availab(?:le|ility)|uptime|service credit|sev(?:erity)?\s*(?:1|one|2)\b|response time|resolution time|recovery (?:time|point)/.test(s)],
 ["change",s=>/change (?:order|request|control)|changes (?:require|must)/.test(s)],
 ["legal",s=>/press release|case stud|publicity|solicit|governed by|governing law|confidential|insurance|exclusiv/.test(s)],
 ["data",s=>!/terminat/.test(s)&&/personal data|customer data|atlantic data|data protection|breach|security incident|subprocessor|sub-processor|subcontract|encrypt|soc ?2|iso ?27001|penetration|documented instructions|data processing|stored in|machine learning|train[^.]*model|improve[^.]*models?|artificial intelligence|multi-?factor/.test(s)],
 ["liability",s=>/liabilit|indemnif|\bdefend\b|consequential|exclusive remedy/.test(s)],
 ["ip",s=>/intellectual property|work product|copyright|background (?:tools|ip)|\bowns?\b|ownership|grants? [^.]*licen[sc]e|royalty/.test(s)&&!/infring/.test(s)],
 ["warranty",s=>/warrant|non-?conform|at no charge/.test(s)],
 ["price",s=>/(?:increase|adjust|escalat|uplift)[^.]*(?:fees?|rates?|prices?)|(?:fees?|rates?|prices?)[^.]*(?:increase|adjust|fixed for)|rate card/.test(s)],
 ["term",s=>/terminat|renew|initial term|expire|term of this/.test(s)],
 ["payment",s=>/invoice|net \d+|payable|payment|in advance/.test(s)],
 ["price",s=>/\$\s?\d|per hour|hourly|fixed fee|time and materials|per user|per seat|per query|pricing|expenses|travel|fees? (?:is|are)/.test(s)],
 ["assumption",s=>/assum|any delay|delay in|provided that|contingent/.test(s)],
 ["dependency",s=>/depends on|dependent on|prerequisite|relies on|(?:atlantic|customer) (?:shall|will|must) (?:provide|make|grant|assign)/.test(s)],
 ["risk",s=>/\brisk\b|may delay|could delay|not responsible for delays/.test(s)],
 ["outcome",s=>/outcome|objective|\bgoal\b|so that|result in/.test(s)],
 ["deliverable",s=>/deliver|will produce|documentation|report|runbook|design document|source code|training|onboarding/.test(s)],
 ["kpi",s=>/(?:accuracy|relevance|latency|precision|throughput|kpi)/.test(s)&&/\d/.test(s)||/measured (?:by|quarterly|monthly)/.test(s)],
 ["obl_us",s=>/review (?:each|the)|deemed accept|acceptance (?:period|criteria)/.test(s)],
 ["obligation",s=>/\b(?:shall|must|will|agrees to|responsible for)\b/.test(s)]
];
const STOP=new Set("the a an of to and or for in on at by is are be will shall may must any each all this that with from as its their his her it not no than then also under over into per which who".split(" "));
const words=s=>String(s).toLowerCase().replace(/[^a-z0-9$%. -]/g," ").split(/\s+/).filter(Boolean);
const ovl=(a,b)=>{const A=new Set(words(a).filter(w=>w.length>4&&!STOP.has(w)));return words(b).filter(w=>w.length>4&&A.has(w)).length};
function dateIn(o,ct){let m=o.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i);if(m)return m[3]+"-"+String(MONF[m[1].toLowerCase()]).padStart(2,"0")+"-"+String(+m[2]).padStart(2,"0");
 m=o.match(/\b(\d{4}-\d{2}-\d{2})\b/);if(m)return m[1];
 m=o.toLowerCase().match(R_("within NUM (?:business |calendar |working )?days of (?:the )?(?:effective date|signature|signing|execution)"));if(m&&ct&&ct.start)return addD(ct.start,Math.round(nOf(m[1])*(/business|working/.test(m[0])?1.4:1)));return ""}
const METW=[["availability",/availab|uptime/],["Severity 1 response",/sev(?:erity)?\s*(?:1|one)|response time/],["Relevance accuracy",/relevance accuracy|accuracy|precision/],["Query latency",/latency/],["Service credit",/service credit/],["Resolution time",/resolution/],["Recovery objective",/recovery/]];
function normOf(type,o,s,pr,due){const am=o.match(/\$\s?([\d,]+(?:\.\d+)?)/),pc=pctOf(s),bits=[];let val=null,unit="";
 if(am){val=parseFloat(am[1].replace(/,/g,""));unit="USD";bits.push((val<10?"$"+val:D$(val)))}
 if(pc!=null){if(val==null){val=pc;unit="%"}bits.push(pc+"%")}
 const dd=m1(s,R_("NUM (?:business |calendar |working )?days")),hh=m1(s,R_("NUM hours?")),mm=m1(s,/(\d+)\s*minutes/),ms_=m1(s,/(\d+)\s*milliseconds/);
 if(dd!=null){if(val==null){val=dd;unit="days"}bits.push(dd+" days")}if(hh!=null)bits.push(hh+" hours");if(mm!=null)bits.push(mm+" minutes");if(ms_!=null)bits.push(ms_+" ms");
 const mo=m1(s,R_("NUM months?"));if(mo!=null)bits.push(mo+" months");
 const us=m1(s,R_("NUM named users"));if(us!=null)bits.push(us+" named users");
 const nt=s.match(/net\s*(\d+)/);if(nt)bits.unshift("Net "+nt[1]);
 const base=bits.join(" · ");let norm;if(type==="milestone"&&due)norm="Due "+fdt(due);else if(pr&&pr.v)norm=(type==="price"&&am)?base:pr.v+(base&&!/\d/.test(pr.v)?" · "+base:"");else norm=base||(due?"Due "+fdt(due):"Stated");
 return {norm:norm,val:val,unit:unit}}
function keyOf(L){const s=L.src.toLowerCase();if(L.type==="milestone"){const n=s.match(/^milestone (\d+)/);return "ms"+(n?n[1]:L.ref)}
 if(L.pbs&&L.pbs.length)return L.pbs[0]+(L.type==="payment"&&/advance|signature/.test(s)?"-adv":"");
 const ex=Object.values(NTN).find(t=>t.re.test(s));if(ex&&L.m==="new")return ex.id;
 const w=words(s.replace(/\d+/g," ")).filter(x=>x.length>3&&!STOP.has(x)&&!/^(lumen|atlantic|beacon|northwind|shall|will|provide|deliver)$/.test(x));return L.type+":"+w.slice(0,2).join("-")}
function analyze(text,ct,doc){ct=ct||{};const out=[];const hasSec=/^\s*\d+\.\s+\S/m.test(text)||/^\s*\d+\.\d+\s/m.test(text);
 const vw=new RegExp("^(?:"+words(ct.vendor||"vendor").filter(w=>w.length>3).concat(["supplier","vendor","contractor","provider"]).join("|")+")\\b");
 let sec="",off=0,n=0,started=!hasSec;
 String(text).replace(/\r/g,"").split("\n").forEach(raw=>{const ln=raw.trim();off+=raw.length+1;if(!ln)return;
  const m=ln.match(/^(\d+(?:\.\d+)*)\.?\s+(.*)$/);let ref="",body=ln;if(m){ref=m[1];body=m[2]}
  const head=m&&ref.indexOf(".")<0&&body.length<54&&!/[.;:]$/.test(body);
  if(head){sec=ref;started=true;return}
  if(!started||(!m&&/^[A-Z0-9 ,:'().-]{8,}$/.test(ln)))return;
  body.split(/(?<=[.;])\s+(?=[A-Z])/).forEach((o,i)=>{o=o.trim();if(o.length<12)return;n++;
   const s=o.toLowerCase();let type=(TR.find(r=>r[1](s))||["commitment"])[0];
   let party=/^(?:atlantic|the foundation|customer)\b/.test(s)?"Atlantic Systems":vw.test(s)?"Vendor":null;
   if(!party)party=({deliverable:"Vendor",milestone:"Vendor",sla:"Vendor",kpi:"Vendor",warranty:"Vendor",data:"Vendor",payment:"Atlantic Systems",dependency:"Atlantic Systems",obl_us:"Atlantic Systems"})[type]||"Both";
   if(type==="obligation")type=party==="Atlantic Systems"?"obl_us":party==="Vendor"?"obl_vendor":"commitment";
   // playbook match
   const hits=[];PB.forEach(p=>{if(p.types&&p.types.indexOf(type)<0)return;if(p.re.test(s)){const r=p.chk(s);if(r)hits.push({p:p,r:r})}});
   let mt="std",pb="",pr=null,ours="",nt=null,pbs=hits.map(h=>h.p.id),rk=({liability:"High",data:"High",ip:"Medium",term:"Medium",payment:"Medium",warranty:"Medium",price:"Medium",sla:"Medium",change:"Medium"})[type]||"Low",why="",rec="ai",fb=false,trap=false,vend="",rlab="";
   if(hits.length){const h=hits.find(x=>!x.r.ok)||hits[0];pr=h.r;pb=h.p.id;ours=h.p.std;rk=h.p.risk;vend=h.r.v;trap=!!h.r.trap;
    if(h.r.ok){mt="std";why="Meets our standard clause "+h.p.n+": "+h.r.v+(h.r.fbUsed?" (inside the approved fallback)":"")+"."}
    else{mt="var";why=h.r.why;fb=!!h.r.fb;rec=fb?"ai":rk==="High"?"legal":"shared"}}
   else{nt=NEWT.find(t=>t.id!=="NT-GEN"&&t.re.test(s))||((type==="liability"||type==="data")?NTN["NT-GEN"]:null);
    if(nt){mt="new";pb=nt.id;ours=nt.draft;rk=nt.risk;why=nt.why;rec=nt.risk==="High"?"legal":"shared";vend="Not in playbook"}
    else{why="Operational line. The playbook sets no position on it, so the business owner confirms the value."}}
   const due=dateIn(o,ct),nv=normOf(type,o,s,pr,due);
   let metric="",target="";if(type==="sla"||type==="kpi"){metric=(METW.find(w=>w[1].test(s))||["Measure"])[0];const cmp=/at least|no less|minimum|or better|not below/.test(s)?"At least ":/not exceed|no more than|within|maximum|at most/.test(s)?"Within ":"";target=cmp+(nv.norm.replace(/^Stated$/,"")||"")}
   else if(type==="milestone"){metric="Accepted by Atlantic Systems";target=due?"By "+fdt(due):""}else if(type==="deliverable"){metric="Accepted by Atlantic Systems";target=due?"By "+fdt(due):/review/.test(s)?"":"Review in 10 business days"}else if(type==="payment")metric="Matches accepted work";
   let owner=party==="Atlantic Systems"?(type==="payment"?"Avery Chen":ct.owner||"Dev Rao"):party==="Vendor"?(ct.vOwner||ct.vendor||"Vendor"):(ct.owner||"Dev Rao");
   if(/atlantic monitoring|measured by atlantic/.test(s))owner="Contract Analyst Agent";
   const watch=type==="payment"?"Invoice Advisor":(type==="sla"||type==="kpi"||type==="milestone"||due)?"Contract Analyst Agent":"";
   // suggested links
   const lk={wbs:"",sla:"",inv:"",raid:"",bud:""};
   if(type==="milestone"||type==="deliverable"){const T=(typeof TASKS!=="undefined"&&ct.proj)?TASKS.filter(t=>t.p===ct.proj).map(t=>({t:t,o:ovl(t.n,o)})).sort((a,b)=>b.o-a.o)[0]:null;lk.wbs=T&&T.o>0?T.t.id+" "+T.t.n:"New WBS line"}
   if(type==="sla"||type==="kpi")lk.sla=metric;
   if(type==="payment"||(type==="price"&&nv.unit==="USD")){lk.inv=/milestone (\d)/.test(s)?"Invoice schedule, milestone "+s.match(/milestone (\d)/)[1]:"Invoice schedule";lk.bud=ct.line||"Vendor services"}
   if(type==="assumption"||type==="dependency"||type==="risk"||mt!=="std"){const rr=(typeof window!=="undefined"&&window.PPMRAID&&ct.proj)?window.PPMRAID.filter(x=>x.p===ct.proj).map(x=>({x:x,o:ovl(x.n+" "+x.d,o)})).sort((a,b)=>b.o-a.o)[0]:null;lk.raid=rr&&rr.o>1?rr.x.id:"New RAID item"}
   let conf=.92;if(o.length>230)conf-=.07;const amb=(s.match(/reasonable|as appropriate|best efforts|from time to time|may |substantially|typically/g)||[]).length;conf-=Math.min(.12,amb*.04);if(!TR.some(r=>r[1](s)))conf-=.2;if(nv.norm==="Stated"&&type!=="outcome")conf-=.05;conf+=((hash(o)%7)-3)/100;conf=Math.max(.52,Math.min(.98,conf));
   const L={id:"L"+String(ct.num||"0")+(doc==="proposal"?"P":doc==="contract"?"C":"A")+String(n).padStart(2,"0"),ct:ct.id,doc:doc,ref:(ref||"p"+n)+(i>0?"("+String.fromCharCode(97+i)+")":""),page:1+Math.floor(off/1700),src:o,type:type,norm:nv.norm,val:nv.val,unit:nv.unit,party:party,owner:owner,watch:watch,due:due,measure:metric,target:target,conf:Math.round(conf*100)/100,status:"proposed",lk:lk,m:mt,pb:pb,pbs:pbs,vend:vend,why:why,fb:fb,risk:rk,rec:rec,route:"",trap:trap,routine:!pb,ours:ours,thread:[],by:"AI suggested",lg:false,fbUsed:!!(pr&&pr.fbUsed)};
   L.key=keyOf(L);out.push(L)})});
 return out}
/* word-level redline: strike vendor words not in ours, underline our words not in theirs */
const nw=w=>w.toLowerCase().replace(/[^a-z0-9$%]/g,"");
function diffW(a,b){const A=a.split(/\s+/).filter(Boolean),B=b.split(/\s+/).filter(Boolean),n=A.length,m=B.length;const L=[];for(let i=0;i<=n;i++)L.push(new Uint16Array(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=nw(A[i])===nw(B[j])?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
 const o=[];let i=0,j=0;while(i<n&&j<m){if(nw(A[i])===nw(B[j])){o.push(["=",A[i]]);i++;j++}else if(L[i+1][j]>=L[i][j+1]){o.push(["-",A[i++]])}else{o.push(["+",B[j++]])}}while(i<n)o.push(["-",A[i++]]);while(j<m)o.push(["+",B[j++]]);return o}
function redlineHTML(theirs,ours){return diffW(theirs,ours).map(x=>x[0]==="="?esc(x[1]):x[0]==="-"?`<del class="sow-del">${esc(x[1])}</del>`:`<ins class="sow-ins">${esc(x[1])}</ins>`).join(" ")}
/* ---------- Sample document text (what a document service would return from PDF or Word) ---------- */
const TXT={};
TXT.sow5=`STATEMENT OF WORK 5: SEARCH INDEXER PHASE 2
Between Atlantic Systems ("Atlantic Systems") and Lumen Data Partners ("Lumen"). Proposal version 2, dated September 29, 2026.

1. Scope and deliverables
1.1 Lumen shall deliver a production search indexer for the Standards Platform, including the index schema design document.
1.2 Lumen shall deliver a relevance tuning report covering the top 500 standards queries by December 18, 2026.
1.3 The desired outcome is that editors find the correct standard on the first page of results.

2. Milestones and schedule
2.1 Milestone 1: Design approved by Atlantic Systems on January 29, 2027.
2.2 Milestone 2: Indexer running in the test environment on March 12, 2027.
2.3 Milestone 3: Relevance tuning complete and accepted on April 30, 2027.
2.4 Milestone 4: Production cutover completed on June 25, 2027.

3. Service levels and measures
3.1 Search availability shall be at least 99.5 percent each month.
3.2 Lumen shall respond to a Severity 1 incident within 15 minutes.
3.3 For each month below the availability target, Lumen will issue a service credit of 5 percent of the monthly fee.
3.4 Relevance accuracy shall be at least 90 percent of the top 500 queries returning the correct standard in the first 10 results, measured quarterly.
3.5 Median query latency shall not exceed 400 milliseconds, measured by Atlantic Systems monitoring.

4. Fees and payment
4.1 The fixed fee for this Statement of Work is $348,000.
4.2 Lumen may invoice each milestone upon delivery, and invoices are payable within 30 days.
4.3 Travel and expenses require Atlantic Systems' prior written approval.
4.4 Rates for additional work follow the rate card in Exhibit A and are fixed for the term of this Statement of Work.

5. Assumptions and dependencies
5.1 Lumen assumes Atlantic Systems will provide production-like test data by January 15, 2027.
5.2 Any delay in Atlantic Systems providing data, access or approvals automatically extends all dates and may result in additional fees.
5.3 Atlantic Systems shall provide Azure environments and access for Lumen staff within 5 business days of the effective date.
5.4 The indexer depends on the Standards Platform content API being stable and documented.

6. Acceptance and warranty
6.1 Atlantic Systems shall review each deliverable within 10 business days of delivery.
6.2 A deliverable not rejected in writing within the review period is deemed accepted.
6.3 Lumen warrants that deliverables will conform to the specification for 90 days after acceptance.

7. Ownership, data and security
7.1 Atlantic Systems owns all deliverables and work product created under this Statement of Work.
7.2 Lumen grants Atlantic Systems a perpetual, royalty-free license to Lumen background tools embedded in the deliverables.
7.3 Lumen shall notify Atlantic Systems of a security incident affecting Atlantic Systems data within 72 hours.
7.4 Lumen shall maintain a SOC 2 Type II report and provide it annually.
7.5 Lumen may engage subcontractors without prior consent.
7.6 Lumen may use Atlantic Systems content and query logs to train and improve its relevance models.
7.7 Lumen may use Atlantic Systems' name and logo in press releases and case studies.

8. Liability and termination
8.1 Lumen's aggregate liability is limited to the fees paid in the prior three months.
8.2 Lumen will defend and indemnify Atlantic Systems against third-party claims that the deliverables infringe intellectual property rights.
8.3 Either party may terminate this Statement of Work for cause on 30 days written notice if a material breach is not cured.
8.4 Atlantic Systems may terminate for convenience on 30 days written notice and pays only for accepted work.
8.5 This Statement of Work renews automatically for one year unless either party gives 120 days notice of non-renewal.
8.6 Lumen will not solicit or hire Atlantic Systems employees during the term and for 12 months after.
8.7 This Statement of Work is governed by the laws of the State of Delaware.
8.8 Lumen may suspend work if any invoice is more than 15 days overdue.

9. Change control
9.1 Changes require a written change order signed by both parties before work begins.
9.2 Lumen may adjust its rates by up to 3 percent each year on written notice.
9.3 Lumen will hold a weekly status meeting and send a monthly status report.
`;
TXT.sow4p=`STATEMENT OF WORK 4: TAXONOMY DATA ENGINEERING AND SEARCH INDEXER
Proposal version 2 from Lumen Data Partners to Atlantic Systems, dated January 19, 2026.

1. Scope and deliverables
1.1 Lumen shall deliver a taxonomy data model and the ingestion pipeline for the Taxonomy Data Hub.
1.2 Lumen shall deliver the search indexer for the Standards Platform.
1.3 Lumen will provide 16 hours of operator training and a runbook.

2. Milestones
2.1 Milestone 1: Data model approved on April 10, 2026.
2.2 Milestone 2: Indexer design accepted on May 22, 2026.
2.3 Milestone 3: Taxonomy ingestion pipeline complete on August 28, 2026.
2.4 Milestone 4: Indexer running in the test environment on October 30, 2026.
2.5 Milestone 5: Final acceptance on December 18, 2026.

3. Service levels
3.1 Search availability shall be at least 99.9 percent each month.
3.2 Lumen shall respond to a Severity 1 incident within 30 minutes.
3.3 For each month below the availability target, Lumen will issue a service credit of 10 percent of the monthly fee.
3.4 Taxonomy match accuracy shall be at least 92 percent measured on the validation set.

4. Fees and payment
4.1 The fixed fee for this Statement of Work is $548,000.
4.2 Each milestone is invoiced after written acceptance by Atlantic Systems and is payable within 45 days.
4.3 Travel and expenses require Atlantic Systems' prior written approval.

5. Assumptions and dependencies
5.1 Lumen assumes Atlantic Systems will provide production-like data by April 1, 2026.
5.2 Atlantic Systems shall provide Azure environments and access within 5 business days of the effective date.

6. Acceptance, warranty and people
6.1 Atlantic Systems shall review each deliverable within 10 business days of delivery.
6.2 Lumen warrants that deliverables will conform to the specification for 90 days after acceptance.
6.3 Lumen will assign Marco Ellis and Hana Koval as key personnel and will not replace them without Atlantic Systems' written consent.

7. Ownership and security
7.1 Atlantic Systems owns all deliverables and work product created under this Statement of Work.
7.2 Lumen shall notify Atlantic Systems of a security incident affecting Atlantic Systems data within 48 hours.

8. Liability and termination
8.1 Lumen's aggregate liability is limited to twelve months of fees.
8.2 Atlantic Systems may terminate for convenience on 30 days written notice and pays only for accepted work.

9. Change control
9.1 Changes require a written change order signed by both parties before work begins.
`;
TXT.sow4c=`STATEMENT OF WORK 4: TAXONOMY DATA ENGINEERING AND SEARCH INDEXER
Executed by Lumen Data Partners and Atlantic Systems on February 27, 2026, including Amendment 1.

1. Scope and deliverables
1.1 Lumen shall deliver a taxonomy data model and the ingestion pipeline for the Taxonomy Data Hub.
1.2 Lumen shall deliver the search indexer for the Standards Platform.
1.3 Lumen will provide 8 hours of operator training and a runbook.

2. Milestones
2.1 Milestone 1: Data model approved on April 10, 2026.
2.2 Milestone 2: Indexer design accepted on May 22, 2026.
2.3 Milestone 3: Taxonomy ingestion pipeline complete on September 30, 2026.
2.4 Milestone 4: Indexer running in the test environment on October 30, 2026.
2.5 Milestone 5: Final acceptance on December 18, 2026.

3. Service levels
3.1 Search availability shall be at least 99.5 percent each month.
3.2 Taxonomy match accuracy shall be at least 92 percent measured on the validation set.

4. Fees and payment
4.1 The fixed fee for this Statement of Work is $610,000.
4.2 Lumen may invoice each milestone upon delivery, and invoices are payable within 30 days.
4.3 An advance of $22,000 is payable on signature for mobilization.
4.4 Travel and expenses are billed at cost.

5. Assumptions and dependencies
5.1 Lumen assumes Atlantic Systems will provide production-like data by April 15, 2026.
5.2 Atlantic Systems shall provide Azure environments and access within 5 business days of the effective date.
5.3 Any delay in Atlantic Systems providing data, access or approvals extends all dates and may result in additional fees.

6. Acceptance, warranty and people
6.1 Atlantic Systems shall review each deliverable within 10 business days of delivery.
6.2 Lumen warrants that deliverables will conform to the specification for 60 days after acceptance.

7. Ownership, data and security
7.1 Atlantic Systems owns all deliverables and work product created under this Statement of Work.
7.2 Lumen shall notify Atlantic Systems of a security incident affecting Atlantic Systems data within 72 hours.
7.3 Lumen may use Atlantic Systems content and query logs to improve its relevance models.
7.4 Lumen may engage subcontractors without prior consent.

8. Liability and termination
8.1 Lumen's aggregate liability is limited to six months of fees.
8.2 Atlantic Systems may terminate for convenience on 30 days written notice and pays only for accepted work.
8.3 This Statement of Work renews automatically for one year unless either party gives 120 days notice of non-renewal.

9. Change control
9.1 Changes require a written change order signed by both parties before work begins.
`;
TXT.beacon=`SOFTWARE LICENSE AND SERVICES AGREEMENT: BEACON ANALYTICS PLATFORM
Order Form 1 proposal from Beacon Analytics to Atlantic Systems, dated September 22, 2026.

1. License and pricing
1.1 Beacon grants Atlantic Systems a non-exclusive, non-transferable subscription license to use the Beacon Analytics Platform for 100 named users.
1.2 Usage is billed at $0.42 per query credit above the included 5 million credits each year.
1.3 Beacon may true-up usage quarterly and invoice any overage within 30 days.
1.4 Beacon may audit Atlantic Systems' use of the platform on 10 days notice at any time.
1.5 The annual platform fee is $186,000, payable annually in advance.
1.6 Beacon may increase fees by up to 9 percent at each renewal.

2. Service levels
2.1 Beacon shall make the platform available 99.5 percent of each month.
2.2 Beacon will respond to Severity 1 incidents within 2 hours.
2.3 Service credits are Atlantic Systems' sole and exclusive remedy for downtime.

3. Data and security
3.1 Beacon shall notify Atlantic Systems of a personal data breach without undue delay and within 72 hours.
3.2 Beacon processes personal data only on Atlantic Systems' documented instructions under the attached data processing addendum.
3.3 Beacon may use aggregated and de-identified customer data and prompts to train its machine learning models.
3.4 Beacon maintains ISO 27001 certification and a SOC 2 Type II report.
3.5 Customer data is stored in the United States.

4. Term and termination
4.1 The initial term is three years and renews automatically for successive one-year terms.
4.2 Either party may terminate for cause on 30 days written notice.
4.3 Atlantic Systems may not terminate for convenience during the initial term.
4.4 Beacon's aggregate liability is limited to the fees paid in the prior twelve months.
4.5 Beacon will defend Atlantic Systems against claims that the platform infringes third party intellectual property rights.
4.6 This agreement is governed by the laws of the State of California.

5. Implementation
5.1 Beacon shall deliver onboarding and single sign-on configuration within 30 days of the effective date.
5.2 Atlantic Systems shall assign an administrator and provide Entra ID access to Beacon staff.
5.3 Beacon will provide a quarterly usage report.
`;
TXT.msa=`MASTER SERVICES AGREEMENT
1. Services and fees
1.1 The supplier shall provide the services described in each statement of work.
1.2 The fixed fee for each statement of work is stated in that statement of work.
1.3 Invoices are payable within 30 days.
2. Service levels
2.1 The supplier shall make the services available at least 99.9 percent each month.
2.2 The supplier shall respond to a Severity 1 incident within 30 minutes.
3. Data and legal
3.1 The supplier shall notify Atlantic Systems of a security incident within 48 hours.
3.2 Atlantic Systems owns all deliverables and work product.
3.3 The supplier's aggregate liability is limited to twelve months of fees.
3.4 Atlantic Systems may terminate for convenience on 30 days written notice and pays only for accepted work.
3.5 This agreement renews automatically for one year unless either party gives 90 days notice of non-renewal.
3.6 This agreement is governed by the laws of the State of Delaware.
`;
TXT.dpa=`DATA PROCESSING ADDENDUM
1. Processing
1.1 The processor processes personal data only on Atlantic Systems' documented instructions under this data processing addendum.
1.2 The processor shall notify Atlantic Systems of a personal data breach within 48 hours.
1.3 The processor may engage subprocessors only with Atlantic Systems' prior written consent.
1.4 The processor shall maintain a SOC 2 Type II report and provide it annually.
1.5 Customer data is stored in the United States.
1.6 The processor may use customer data to train machine learning models.
`;
TXT.nwp=`MASTER SERVICES AGREEMENT: SERVICE DESK AND ENDPOINT MANAGEMENT
Proposal version 3 from Northwind Managed Services to Atlantic Systems, dated September 30, 2025.

1. Services
1.1 Northwind shall provide Tier 1 service desk and endpoint management for 640 users as described in Schedule A.
1.2 Northwind will provide a monthly service report by the fifth business day.

2. Service levels
2.1 Service desk availability shall be at least 99.9 percent each month.
2.2 Northwind shall respond to a Severity 1 incident within 15 minutes.
2.3 For each month below the target Northwind will issue a service credit of 10 percent of the monthly fee.
2.4 First contact resolution shall be at least 75 percent measured monthly.

3. Fees and payment
3.1 The fee is $35,000 a month, fixed for the term.
3.2 Invoices are payable within 45 days of receipt.

4. Data, ownership and legal
4.1 Northwind shall notify Atlantic Systems of a security incident within 24 hours.
4.2 Atlantic Systems owns all deliverables and work product, including knowledge articles.
4.3 Northwind may engage subcontractors only with Atlantic Systems' prior written consent.
4.4 Northwind's aggregate liability is limited to twelve months of fees.
4.5 Atlantic Systems may terminate for convenience on 30 days written notice and pays only for accepted work.
4.6 This agreement renews only by written order signed by Atlantic Systems.
`;
TXT.nwc=`MASTER SERVICES AGREEMENT: SERVICE DESK AND ENDPOINT MANAGEMENT
Executed by Northwind Managed Services and Atlantic Systems on October 24, 2025, including Amendment 1.

1. Services
1.1 Northwind shall provide Tier 1 service desk and endpoint management for 640 users as described in Schedule A.
1.2 Northwind will provide a monthly service report by the fifth business day.

2. Service levels
2.1 Service desk availability shall be at least 99.5 percent each month.
2.2 First contact resolution shall be at least 70 percent measured monthly.

3. Fees and payment
3.1 The fee is $35,000 a month and may be adjusted by up to 8 percent each year.
3.2 Invoices are payable within 30 days of receipt.

4. Data, ownership and legal
4.1 Northwind shall notify Atlantic Systems of a security incident within 72 hours.
4.2 Atlantic Systems owns all deliverables and work product, including knowledge articles.
4.3 Northwind may engage subcontractors without prior consent.
4.4 Northwind's aggregate liability is limited to the fees paid in the prior three months.
4.5 Atlantic Systems may terminate for convenience on 30 days written notice and pays only for accepted work.
4.6 This agreement renews automatically for one year unless either party gives 120 days notice of non-renewal.

5. Technology
5.1 Northwind may use ticket data and knowledge articles to train and improve its machine learning models.
`;
const SAMPLEFOR=t=>({"DPA":"dpa","NDA":"dpa","SOW":"sow5","Software license":"beacon"})[t]||"msa";
/* ---------- Seed contracts ---------- */
const inv_=(n,due,amt,st,acc,ms)=>({n:n,due:due,amt:amt,st:st,acc:acc,ms:ms||""});
const CT0=[
{id:"CLM-1001",num:1001,title:"Lumen SOW-4: taxonomy data engineering and search indexer",vendor:"Lumen Data Partners",type:"SOW",status:"Executed",value:610000,start:"2026-03-02",end:"2026-12-18",auto:false,notice:0,owner:"Dev Rao",vOwner:"Marco Ellis",proj:"PR2",svc:"Search and indexing",risk:"High",line:"PR2 vendor services",
 prop:{ver:"v2",vers:["v1 · Dec 8, 2025","v2 · Jan 19, 2026"],date:"2026-01-19",file:"Lumen_SOW-4_proposal_v2.pdf",value:548000,text:"sow4p"},
 exe:{date:"2026-02-27",ver:"Executed with Amendment 1",file:"Lumen_SOW-4_executed_A1.pdf",tcs:"Lumen master terms v6",text:"sow4c"},
 amend:[{id:"A1",date:"2026-05-04",title:"Move Milestone 3 from Aug 28 to Sep 30, 2026",delta:0,sum:"Lumen asked for more time after the data model review. No price change."}],
 inv:[inv_("Mobilization advance","2026-03-06",22000,"paid",false,"adv"),inv_("Milestone 1: Data model approved","2026-04-24",150000,"paid",true,1),inv_("Milestone 2: Indexer design accepted","2026-07-03",240000,"paid",true,2),inv_("Milestone 3: Taxonomy ingestion pipeline","2026-10-19",62900,"held",false,3),inv_("Milestone 4: Indexer in test environment","2026-11-27",70000,"scheduled",false,4),inv_("Milestone 5: Final acceptance","2027-01-18",65100,"scheduled",false,5)]},
{id:"CLM-1002",num:1002,title:"Lumen SOW-5: search indexer phase 2",vendor:"Lumen Data Partners",type:"SOW",status:"In negotiation",value:348000,start:"2027-01-11",end:"2027-06-30",auto:true,notice:120,owner:"Priya Shah",vOwner:"Marco Ellis",proj:"PR1",svc:"Search and indexing",risk:"High",line:"PR1 vendor services",
 prop:{ver:"v2",vers:["v1 · Sep 8, 2026","v2 · Sep 29, 2026"],date:"2026-09-29",file:"Lumen_SOW-5_proposal_v2.pdf",value:348000,text:"sow5"},exe:null,amend:[],
 inv:[inv_("Milestone 1: Design approved","2027-02-26",52200,"scheduled",false,1),inv_("Milestone 2: Indexer in test environment","2027-04-09",104400,"scheduled",false,2),inv_("Milestone 3: Relevance tuning accepted","2027-05-28",104400,"scheduled",false,3),inv_("Milestone 4: Production cutover","2027-07-23",87000,"scheduled",false,4)]},
{id:"CLM-1003",num:1003,title:"Northwind Managed Services: service desk and endpoint MSA",vendor:"Northwind Managed Services",type:"MSA",status:"Executed",value:1260000,start:"2025-11-01",end:"2028-10-31",auto:true,notice:120,owner:"Tom Becker",vOwner:"Northwind Managed Services",proj:"",svc:"Service desk",risk:"Medium",line:"Run budget RB-IT-DESK",
 prop:{ver:"v3",vers:["v1 · Aug 4, 2025","v2 · Sep 2, 2025","v3 · Sep 30, 2025"],date:"2025-09-30",file:"Northwind_MS_MSA_proposal_v3.pdf",value:1188000,text:"nwp"},exe:{date:"2025-10-24",ver:"Executed with Amendment 1",file:"Northwind_MS_MSA_executed.pdf",tcs:"Northwind master terms v4",text:"nwc"},amend:[{id:"A1",date:"2026-03-12",title:"Add endpoint patching to scope",delta:72000,sum:"Adds monthly patch reporting for 640 devices."}],ann:420000,n:38,off:9,prop2:1},
{id:"CLM-1004",num:1004,title:"Microsoft Enterprise Agreement: M365 E5, Azure and Entra ID",vendor:"Microsoft",type:"Software license",status:"Executed",value:1980000,start:"2024-07-01",end:"2027-06-30",auto:false,notice:90,owner:"Jordan Lee",vOwner:"Microsoft enterprise account team",proj:"",svc:"Email and collaboration (M365)",risk:"Low",line:"Run budget RB-IT-M365",
 prop:{ver:"v2",vers:["v1 · May 6, 2024","v2 · Jun 3, 2024"],date:"2024-06-03",file:"Microsoft_EA_proposal_v2.pdf",value:2040000},exe:{date:"2024-06-27",ver:"Executed",file:"Microsoft_EA_enrollment.pdf",tcs:"Microsoft Product Terms and Online Services Terms"},amend:[],ann:660000,n:64,off:14,seats:{bought:640,used:570}},
{id:"CLM-1005",num:1005,title:"Beacon Analytics Platform license (usage-based pricing)",vendor:"Beacon Analytics",type:"Software license",status:"In negotiation",value:558000,start:"2026-12-01",end:"2029-11-30",auto:true,notice:0,owner:"Dev Rao",vOwner:"Beacon Analytics",proj:"",svc:"Data platform",risk:"High",line:"Run budget RB-IT-DATA",
 prop:{ver:"v1",vers:["v1 · Sep 22, 2026"],date:"2026-09-22",file:"Beacon_Order_Form_1_proposal.pdf",value:558000,text:"beacon"},exe:null,amend:[],ann:186000,
 inv:[inv_("Year 1 platform fee","2026-12-31",186000,"scheduled",false,1),inv_("Year 2 platform fee","2027-12-31",186000,"scheduled",false,2),inv_("Year 3 platform fee","2028-12-31",186000,"scheduled",false,3)]},
{id:"CLM-1006",num:1006,title:"Northwind Cloud data processing addendum",vendor:"Northwind Cloud",type:"DPA",status:"Executed",value:0,start:"2026-01-01",end:"2028-12-31",auto:false,notice:0,owner:"Rina Okafor",vOwner:"Northwind Cloud",proj:"",svc:"Standards Portal",risk:"Low",line:"",
 prop:{ver:"v1",vers:["v1 · Nov 18, 2025"],date:"2025-11-18",file:"Northwind_DPA_v1.pdf",value:0},exe:{date:"2025-12-15",ver:"Executed",file:"Northwind_DPA_executed.pdf",tcs:"Attached to MSA CLM-1007"},amend:[],n:22,off:2},
{id:"CLM-1007",num:1007,title:"Northwind Cloud master services agreement (hosting)",vendor:"Northwind Cloud",type:"MSA",status:"Executed",value:3150000,start:"2026-01-01",end:"2028-12-31",auto:true,notice:90,owner:"Tom Becker",vOwner:"Northwind Cloud",proj:"",svc:"Standards Portal",risk:"Medium",line:"Run budget RB-IT-HOST",
 prop:{ver:"v2",vers:["v1 · Oct 6, 2025","v2 · Nov 10, 2025"],date:"2025-11-10",file:"Northwind_Cloud_MSA_proposal_v2.pdf",value:3300000},exe:{date:"2025-12-15",ver:"Executed",file:"Northwind_Cloud_MSA_executed.pdf",tcs:"Northwind master terms v4"},amend:[],ann:1050000,n:47,off:8,credit:{owed:8200,claimed:0},
 inv:[inv_("Reserved capacity prepay","2026-03-01",240000,"paid",true),inv_("Q1 usage","2026-04-10",245000,"paid",true),inv_("Q2 usage","2026-07-10",255000,"paid",true),inv_("Q3 usage (INV-20418)","2026-10-21",184200,"held",true),inv_("Q4 usage, forecast","2027-01-10",125800,"scheduled",false)]},
{id:"CLM-1008",num:1008,title:"LegacyDocs support agreement for the Contract Repository",vendor:"LegacyDocs Inc.",type:"Support agreement",status:"Expiring",value:192000,start:"2025-01-01",end:"2026-12-31",auto:true,notice:60,owner:"Maya Ortiz",vOwner:"LegacyDocs support desk",proj:"PR4",svc:"Contract Repository",risk:"High",line:"PR4 legacy support",
 prop:{ver:"v1",vers:["v1 · Nov 2, 2024"],date:"2024-11-02",file:"LegacyDocs_support_proposal.pdf",value:192000},exe:{date:"2024-12-12",ver:"Executed",file:"LegacyDocs_support_executed.pdf",tcs:"LegacyDocs terms 2024"},amend:[],ann:96000,n:29,off:11},
{id:"CLM-1009",num:1009,title:"Standards Platform hosting and storage order form",vendor:"Northwind Cloud",type:"Order form",status:"Executed",value:60000,start:"2026-06-01",end:"2027-05-31",auto:true,notice:30,owner:"Tom Becker",vOwner:"Northwind Cloud",proj:"PR1",svc:"Standards Platform",risk:"Low",line:"PR1 cloud hosting",
 prop:{ver:"v1",vers:["v1 · May 12, 2026"],date:"2026-05-12",file:"Northwind_storage_order_v1.pdf",value:60000},exe:{date:"2026-05-28",ver:"Executed",file:"Northwind_storage_order_executed.pdf",tcs:"Under MSA CLM-1007"},amend:[],ann:60000,n:18,off:3},
{id:"CLM-1010",num:1010,title:"Contoso Cloud Operations: Azure managed operations MSA",vendor:"Contoso Cloud Operations",type:"MSA",status:"Executed",value:2340000,start:"2026-04-01",end:"2029-03-31",auto:true,notice:90,owner:"Sam Patel",vOwner:"Contoso Cloud Operations",proj:"PR3",svc:"Network and VPN",risk:"Medium",line:"Run budget RB-IT-OPS",
 prop:{ver:"v2",vers:["v1 · Jan 20, 2026","v2 · Feb 24, 2026"],date:"2026-02-24",file:"Contoso_CloudOps_MSA_proposal_v2.pdf",value:2520000},exe:{date:"2026-03-19",ver:"Executed",file:"Contoso_CloudOps_MSA_executed.pdf",tcs:"Contoso master terms v8"},amend:[],ann:780000,n:52,off:12},
{id:"CLM-1011",num:1011,title:"Staffing PO-7712: Ravi Menon, site reliability engineer",vendor:"Northwind Staffing",type:"Order form",status:"Executed",value:224000,start:"2026-02-02",end:"2027-01-29",auto:false,notice:30,owner:"Sam Patel",vOwner:"Ravi Menon",proj:"PR3",svc:"Network and VPN",risk:"Low",line:"PR3 contract labor",
 prop:{ver:"v1",vers:["v1 · Jan 12, 2026"],date:"2026-01-12",file:"PO-7712_proposal.pdf",value:224000},exe:{date:"2026-01-28",ver:"Executed",file:"PO-7712.pdf",tcs:"Northwind Staffing terms v2"},amend:[],ann:224000,n:14,off:1,rate:"$140 an hour, 40 hours a week"},
{id:"CLM-1012",num:1012,title:"Staffing PO-7713: Elise Park, QA automation",vendor:"Northwind Staffing",type:"Order form",status:"Expiring",value:105600,start:"2026-06-29",end:"2026-12-18",auto:false,notice:30,owner:"Priya Shah",vOwner:"Elise Park",proj:"PR1",svc:"Standards Platform",risk:"Low",line:"PR1 contract labor",
 prop:{ver:"v1",vers:["v1 · Jun 8, 2026"],date:"2026-06-08",file:"PO-7713_proposal.pdf",value:105600},exe:{date:"2026-06-22",ver:"Executed",file:"PO-7713.pdf",tcs:"Northwind Staffing terms v2"},amend:[],ann:105600,n:14,off:1,rate:"$110 an hour, 40 hours a week"},
{id:"CLM-1013",num:1013,title:"Lumen mutual non-disclosure agreement",vendor:"Lumen Data Partners",type:"NDA",status:"Executed",value:0,start:"2025-09-01",end:"2028-08-31",auto:false,notice:0,owner:"Maya Ortiz",vOwner:"Lumen Search Services",proj:"",svc:"",risk:"Low",line:"",
 prop:{ver:"v1",vers:["v1 · Aug 20, 2025"],date:"2025-08-20",file:"Lumen_NDA_v1.pdf",value:0},exe:{date:"2025-08-29",ver:"Executed",file:"Lumen_NDA_executed.pdf",tcs:"Mutual NDA template v3"},amend:[],n:16,off:0}
];
CT0.forEach(c=>{c.gen=false;c.inv=c.inv||null});
const genInv=c=>{if(c.inv)return c.inv;const a=c.ann||Math.round((c.value||0)/3),rows=[];if(!c.value&&!a){c.inv=[];return c.inv}
 const per=a>300000?4:a>80000?2:1,amt=Math.round(a/per);let y=+c.start.slice(0,4);for(let k=0;k<12;k++){const mo=+c.start.slice(5,7)-1+Math.round(k*12/per);const d=new Date(Date.UTC(y,mo,15)).toISOString().slice(0,10);if(d>c.end)break;const past=d<TDY;rows.push(inv_("Scheduled payment "+(k+1),d,amt,past?"paid":"scheduled",past,k+1))}c.inv=rows;return rows};
const ctBilled=c=>sum(genInv(c).filter(r=>r.st==="paid"),r=>r.amt);
const ctAcc=c=>sum(genInv(c).filter(r=>r.st==="paid"&&r.acc),r=>r.amt);
const ctLeak=c=>Math.max(0,ctBilled(c)-ctAcc(c))+((c.credit||{}).owed||0)-((c.credit||{}).claimed||0);
/* ---------- Analyses ---------- */
const AN={};
const anKey=(c,d)=>c+"|"+d;
const ctOfRaw=id=>CT0.find(c=>c.id===id)||(GEN.list||[]).find(c=>c.id===id);
const GEN={on:false,list:[],obl:null,lines:null,cr:null};
function runDoc(c,doc,textKey,src){const L=analyze(TXT[textKey],c,doc);const key=anKey(c.id,doc);AN[key]={ct:c.id,doc:doc,src:src||c.title,ver:doc==="proposal"?c.prop&&c.prop.ver:"executed",at:TDY,lines:L,text:textKey};return AN[key]}
const lines_=(cid,doc)=>(AN[anKey(cid,doc)]||{lines:[]}).lines;
const allLines_=cid=>lines_(cid,"proposal").concat(lines_(cid,"contract"),lines_(cid,"amendment"));
const bestDoc=cid=>AN[anKey(cid,"contract")]?"contract":AN[anKey(cid,"proposal")]?"proposal":null;
function counts(c){const d=bestDoc(c.id);if(!d)return {n:c.n||0,std:(c.n||0)-(c.off||0),var:Math.round((c.off||0)*.7),new:(c.off||0)-Math.round((c.off||0)*.7),off:c.off||0,an:false};const L=lines_(c.id,d),k={std:0,var:0,new:0};L.forEach(l=>k[l.m]++);return {n:L.length,std:k.std,var:k.var,new:k.new,off:k.var+k.new,an:true}}
/* ---------- Change requests, obligations, reviews, rounds, audit ---------- */
const STAGES=["Requested","Impact review","Legal review","Approval","Approved"];
const CRT=["Schedule change","Scope or project change","Assumption change","Price or rate change","SLA change","Termination or renewal"];
const CRC={"Schedule change":"--story-f","Scope or project change":"--p4","Assumption change":"--warn-f","Price or rate change":"--s3","SLA change":"--u3","Termination or renewal":"--bad-f"};
const CR0=[
{id:"CR-201",ct:"CLM-1001",type:"Schedule change",title:"Milestone 3 slips 7 work days",st:"Impact review",amt:0,days:7,task:"p2_2",req:"Dev Rao",at:"2026-10-02",reason:"Lumen reports the ingestion pipeline needs another week after reviewer feedback. Milestone 3 was due Sep 30.",oldv:"Sep 30, 2026",newv:"Oct 9, 2026",key:"ms3",thread:[{who:"Dev Rao",t:"Marco says the validator found malformed records. I would take the week rather than accept a bad load.",at:"Oct 2"}]},
{id:"CR-202",ct:"CLM-1001",type:"Price or rate change",title:"Add two Lumen engineers for six weeks",st:"Approval",amt:96000,days:-5,task:"p2_2",req:"Priya Shah",at:"2026-09-28",reason:"Risk R-101 says Lumen keeps slipping. Two more engineers pull work forward about five work days.",oldv:"$610,000",newv:"$706,000",key:"price:fixed-statement",thread:[{who:"Priya Shah",t:"This offsets CR-201 almost exactly. Lumen quoted $2,000 a day per engineer.",at:"Sep 28"},{who:"Avery Chen",t:"Funds are available in PR2 vendor services if the reserve covers the overage.",at:"Sep 30"}]},
{id:"CR-203",ct:"CLM-1008",type:"Termination or renewal",title:"Send non-renewal notice and bridge month to month",st:"Requested",amt:-96000,days:0,task:"",req:"Maya Ortiz",at:"2026-10-05",reason:"PR4 replaces the legacy repository. The agreement auto-renews unless notice arrives by Nov 1, 2026.",oldv:"Auto-renews Dec 31, 2026 for one year",newv:"Ends Dec 31, 2026; month to month to Mar 31, 2027",key:"PB-REN",thread:[]},
{id:"CR-204",ct:"CLM-1003",type:"SLA change",title:"Add a 15 minute Severity 1 response with credits",st:"Legal review",amt:0,days:0,task:"",req:"Tom Becker",at:"2026-09-22",reason:"The desk missed Sev 1 response twice this quarter and the contract has no credit.",oldv:"No Severity 1 response target",newv:"15 minutes, 10 percent monthly credit",key:"PB-RSP",thread:[{who:"Tom Becker",t:"Northwind agreed in principle on the call.",at:"Sep 22"},{who:LEGAL,t:"Drafting the amendment language. Needs Northwind counsel.",at:"Sep 30"}]},
{id:"CR-205",ct:"CLM-1010",type:"Assumption change",title:"Azure landing zone ready Nov 15 instead of Oct 15",st:"Requested",amt:0,days:0,task:"",req:"Sam Patel",at:"2026-10-06",reason:"Network review needs another month. The assumption in the statement of work says the landing zone is ready Oct 15.",oldv:"Oct 15, 2026",newv:"Nov 15, 2026",key:"assumption",thread:[]},
{id:"CR-206",ct:"CLM-1012",type:"Termination or renewal",title:"Extend Elise Park through Mar 26, 2027",st:"Approved",amt:61600,days:0,task:"",req:"Priya Shah",at:"2026-09-14",reason:"Test automation for the beta is not done by Dec 18.",oldv:"Ends Dec 18, 2026",newv:"Ends Mar 26, 2027",key:"term",applied:true,thread:[]},
{id:"CR-207",ct:"CLM-1004",type:"Price or rate change",title:"Reduce unassigned E5 seats by 70 at the true-up",st:"Approval",amt:-44000,days:0,task:"",req:"Jordan Lee",at:"2026-09-30",reason:"About 11 percent of E5 seats are unassigned. The enrollment allows a reduction at the anniversary true-up.",oldv:"640 seats",newv:"570 seats",key:"price",thread:[]},
{id:"CR-208",ct:"CLM-1007",type:"Scope or project change",title:"Add a storage tier for Standards content",st:"Approved",amt:21400,days:0,task:"",req:"Tom Becker",at:"2026-09-02",reason:"Content migration needs a hot tier. Matches invoice INV-20451.",oldv:"Standard storage",newv:"Standard plus hot tier",key:"price",applied:true,thread:[]}
];
const CRS=CR0.map(x=>Object.assign({ver:1},x));
const OBL0=[
 ["CLM-1001","Lumen delivers Milestone 3, the taxonomy ingestion pipeline","Vendor","Marco Ellis","2026-09-30","late"],
 ["CLM-1001","Atlantic Systems reviews the Milestone 3 deliverable within 10 business days","Atlantic Systems","Dev Rao","2026-10-23","open"],
 ["CLM-1001","Lumen delivers Milestone 4, indexer running in the test environment","Vendor","Marco Ellis","2026-10-30","risk"],
 ["CLM-1001","Lumen delivers 8 hours of operator training and the runbook","Vendor","Hana Koval","2026-12-04","open"],
 ["CLM-1001","Final acceptance of all deliverables (Milestone 5)","Atlantic Systems","Chief Editor","2026-12-18","open"],
 ["CLM-1001","Atlantic Systems provides production-like data","Atlantic Systems","Dev Rao","2026-04-15","done","2026-04-13"],
 ["CLM-1001","Lumen delivers Milestone 2, indexer design accepted","Vendor","Marco Ellis","2026-05-22","done","2026-06-02"],
 ["CLM-1001","Lumen delivers Milestone 1, data model approved","Vendor","Hana Koval","2026-04-10","done","2026-04-09"],
 ["CLM-1002","Atlantic Systems signs or rejects proposal v2 (target date)","Atlantic Systems","Priya Shah","2026-11-20","open"],
 ["CLM-1002","Legal returns redlines on liability, renewal and AI terms","Atlantic Systems","Atlantic Legal","2026-10-13","open"],
 ["CLM-1003","Northwind sends the monthly SLA report by the 5th","Vendor","Northwind Managed Services","2026-10-05","late"],
 ["CLM-1003","Hold the quarterly business review","Atlantic Systems","Tom Becker","2026-10-28","open"],
 ["CLM-1003","Decide on renewal or send notice (120 days before Oct 31, 2028)","Atlantic Systems","Tom Becker","2028-07-03","open"],
 ["CLM-1003","Northwind sends the September SLA report","Vendor","Northwind Managed Services","2026-09-05","done","2026-09-04"],
 ["CLM-1004","Annual true-up of seat counts","Atlantic Systems","Jordan Lee","2026-11-30","open"],
 ["CLM-1004","Decide on renewal enrollment (notice 90 days before Jun 30, 2027)","Atlantic Systems","Jordan Lee","2027-04-01","open"],
 ["CLM-1005","Negotiate Beacon terms and target signature","Atlantic Systems","Dev Rao","2026-11-20","open"],
 ["CLM-1007","Claim the Q3 availability service credit of $8,200","Atlantic Systems","Tom Becker","2026-10-31","open"],
 ["CLM-1007","Northwind sends the September usage report","Vendor","Northwind Cloud","2026-10-05","done","2026-10-03"],
 ["CLM-1007","Hold the quarterly business review","Atlantic Systems","Tom Becker","2026-10-28","open"],
 ["CLM-1008","Send notice of non-renewal to LegacyDocs (60 days before Dec 31)","Atlantic Systems","Maya Ortiz","2026-11-01","risk"],
 ["CLM-1008","Export all repository data before support ends","Atlantic Systems","Jordan Lee","2026-12-15","open"],
 ["CLM-1009","Review storage capacity at the quarterly review","Atlantic Systems","Tom Becker","2026-10-28","open"],
 ["CLM-1010","Atlantic Systems provides the Azure landing zone","Atlantic Systems","Sam Patel","2026-10-15","risk"],
 ["CLM-1010","Contoso sends the monthly patch compliance report","Vendor","Contoso Cloud Operations","2026-10-08","open"],
 ["CLM-1010","Contoso sends the September patch compliance report","Vendor","Contoso Cloud Operations","2026-09-08","done","2026-09-08"],
 ["CLM-1011","Approve monthly timesheets","Atlantic Systems","Sam Patel","2026-10-30","open"],
 ["CLM-1011","Decide on extending the engagement (30 days before Jan 29)","Atlantic Systems","Sam Patel","2026-12-30","open"],
 ["CLM-1012","Elise Park hands over test suites and documentation","Vendor","Elise Park","2026-12-11","open"],
 ["CLM-1012","Decide on extension notice","Atlantic Systems","Priya Shah","2026-11-18","open"]
];
const OBL=OBL0.map((o,i)=>({id:"OB-"+String(101+i),ct:o[0],t:o[1],party:o[2],who:o[3],due:o[4],st:o[5],dn:o[6]||"",kind:/invoice|pay/i.test(o[1])?"Payment":/notice|renewal|extension/i.test(o[1])?"Renewal notice":/deliver|handover|export/i.test(o[1])?"Deliverable":/report/i.test(o[1])?"Report":/review|approve|accept/i.test(o[1])?"Review or acceptance":"Other"}));
const REV=[];const RND=[];const AUD=[];
const aud=(who,act,ct,detail)=>{AUD.unshift({at:TDY+" "+String(8+Math.floor(AUD.length/3)%9).padStart(2,"0")+":"+String((AUD.length*7)%60).padStart(2,"0"),who:who,act:act,ct:ct,d:detail});audit(act,(ct?ct+": ":"")+detail)};
const audSeed=(at,who,act,ct,d)=>AUD.push({at:at,who:who,act:act,ct:ct,d:d});
/* ---------- Scale: enterprise volumes ---------- */
function buildGen(){const r=RNG("sowgen"),pick=a=>a[Math.floor(r()*a.length)];
 const A=["Orbit","Helix","Summit","Pioneer","Atlas","Keystone","Vector","Cobalt","Nimbus","Quartz","Lattice","Harbor","Northstar","Redwood","Ironbridge","Clearwater","Bluefin","Skyline","Paragon","Ember","Cascade","Granite","Silverline","Trestle","Monarch"],B=["Systems","Software","Consulting","Cloud","Data","Security","Networks","Services","Analytics","Staffing","Labs","Partners"];
 const TYPESW=[["SOW",.3],["MSA",.12],["Software license",.2],["DPA",.08],["NDA",.1],["Order form",.12],["Support agreement",.08]];
 const own=DIR.filter(d=>d.kind==="human"&&!d.generated).map(d=>d.name),svcs=SVCREG.map(s=>s.n),pj=SCALE.projects().map(p=>p.id).concat(["PR1","PR2","PR3","PR4"]);
 const list=[];for(let i=0;i<420;i++){const vendor=pick(A)+" "+pick(B);let x=r(),ty="SOW";for(const t of TYPESW){x-=t[1];if(x<=0){ty=t[0];break}}
  const yrs=1+Math.floor(r()*4),sd=new Date(Date.UTC(2023,6,1)+Math.floor(r()*1180)*DMS),start=sd.toISOString().slice(0,10),end=addD(start,Math.round(yrs*365)-1);
  const val=ty==="NDA"||ty==="DPA"?0:Math.round((20000+Math.pow(r(),2.4)*2800000)/1000)*1000;let st=end<TDY?"Expired":difD(end,TDY)<120?"Expiring":r()<.08?"In negotiation":r()<.03?"Draft":"Executed";
  if(st==="In negotiation"||st==="Draft"){const s2=addD(TDY,10+Math.floor(r()*90));}
  const off=Math.floor(r()*r()*24),n=12+Math.floor(r()*56),num=2000+i;
  list.push({id:"CLM-"+num,num:num,title:vendor+" "+ty.toLowerCase()+" "+(i%7+1),vendor:vendor,type:ty,status:st,value:val,start:start,end:end,auto:r()<.45&&ty!=="NDA",notice:pick([30,60,90,120]),owner:pick(own),vOwner:vendor,proj:r()<.25?pick(pj):"",svc:pick(svcs),risk:pick(["Low","Low","Medium","Medium","High"]),line:"",gen:true,
   prop:{ver:"v"+(1+Math.floor(r()*3)),vers:[],date:addD(start,-30-Math.floor(r()*40)),file:vendor.replace(/ /g,"_")+"_proposal.pdf",value:Math.round(val*(1+r()*.12)/1000)*1000},exe:st==="Executed"||st==="Expiring"||st==="Expired"?{date:addD(start,-6),ver:"Executed",file:vendor.replace(/ /g,"_")+"_executed.pdf",tcs:"Vendor terms"}:null,amend:r()<.2?[{id:"A1",date:addD(start,90),title:"Scope and price amendment",delta:Math.round(val*.05/1000)*1000,sum:"Generated sample amendment."}]:[],ann:Math.round(val/yrs),n:n,off:off,inv:null})}
 GEN.list=list;GEN.obl=null;GEN.lines=null;GEN.cr=null;GEN.on=true}
function CTS(){if(SCALE.on){if(!GEN.on)buildGen();return CT0.concat(GEN.list)}return CT0}
const ctOf=id=>CTS().find(c=>c.id===id)||CT0.find(c=>c.id===id);
function OBLS(){if(!SCALE.on)return OBL;if(!GEN.obl){const r=RNG("sowobl"),pick=a=>a[Math.floor(r()*a.length)],o=[];GEN.list.filter(c=>c.status==="Executed"||c.status==="Expiring").forEach(c=>{const k=3+Math.floor(r()*4);for(let i=0;i<k;i++){const due=addD(TDY,Math.round(-40+r()*250)),past=due<TDY,x=r();const kind=pick(["Deliverable","Report","Payment","Review or acceptance","Renewal notice","Deliverable","Report"]);const party=kind==="Report"||kind==="Deliverable"?pick(["Vendor","Vendor","Atlantic Systems"]):"Atlantic Systems";
   o.push({id:"OB-G"+o.length,ct:c.id,t:({Deliverable:"Deliver the next scheduled work product",Report:"Send the periodic service report",Payment:"Pay the scheduled invoice",["Review or acceptance"]:"Review and accept the deliverable","Renewal notice":"Decide on renewal before the notice date"})[kind],party:party,who:party==="Vendor"?c.vendor:c.owner,due:due,st:past?(x<.7?"done":x<.82?"done":"late"):x<.04?"risk":"open",dn:past&&x<.7?addD(due,-Math.floor(r()*3)):past&&x<.82?addD(due,2+Math.floor(r()*9)):"",kind:kind})}});GEN.obl=OBL.concat(o)}return GEN.obl}
function CRALL(){if(!SCALE.on)return CRS;if(!GEN.cr){const r=RNG("sowcr"),pick=a=>a[Math.floor(r()*a.length)],o=[];for(let i=0;i<72;i++){const c=pick(GEN.list.filter(x=>x.status==="Executed")),ty=pick(CRT),amt=ty==="Price or rate change"||ty==="Scope or project change"?Math.round((r()-.2)*180000/1000)*1000:0;o.push({id:"CR-G"+(300+i),ct:c.id,type:ty,title:ty+" for "+c.vendor,st:pick(STAGES.slice(0,4).concat(["Approved","Approved"])),amt:amt,days:ty==="Schedule change"?Math.floor(r()*15):0,task:"",req:c.owner,at:addD(TDY,-Math.floor(r()*60)),reason:"Generated enterprise sample.",oldv:"Current terms",newv:"Requested terms",key:"",thread:[],ver:1,applied:false})}GEN.cr=CRS.concat(o)}return GEN.cr}
const ctName=id=>{const c=ctOf(id);return c?c.title:id};
const ctShort=id=>{const c=ctOf(id);return c?c.vendor+" "+(c.type==="SOW"?(c.title.match(/SOW-\d+/)||["SOW"])[0]:c.type):id};
const fmtTz=n=>n>=1e6?"$"+(n/1e6).toFixed(n%1e6?2:0).replace(/0$/,"")+"M":n>=1e3?"$"+Math.round(n/1e3)+"K":"$"+n;
/* ---------- Derived facts ---------- */
const live=c=>c.status==="Executed"||c.status==="Expiring";
const rdate=c=>!live(c)?"":c.auto&&c.notice?addD(c.end,-c.notice):c.end;
const rwin=c=>{const d=rdate(c);if(!d)return "Not applicable";const n=difD(d,TDY);return n<0?"Past due":n<=30?"Within 30 days":n<=90?"31 to 90 days":n<=180?"91 to 180 days":n<=365?"181 to 365 days":"Over a year"};
const isTrap=c=>live(c)&&c.auto&&rdate(c)>=TDY&&difD(rdate(c),TDY)<=120;
const MATCH={std:["Standard","good"],var:["Variance","warn"],new:["New term","info"]};
const STP={proposed:["Proposed","mute"],accepted:["Accepted","good"],negotiating:["Negotiating","warn"],agreed:["Agreed","good"]};
const RTE={ai:"AI picks standard",legal:"Legal review",shared:"Shared review"};
function seed(){
 const c1=CT0[0],c2=CT0[1],c5=CT0[4];
 const c3=CT0[2];runDoc(c3,"proposal","nwp",c3.prop.file);runDoc(c3,"contract","nwc",c3.exe.file);runDoc(c1,"proposal","sow4p",c1.prop.file);runDoc(c1,"contract","sow4c",c1.exe.file);runDoc(c2,"proposal","sow5",c2.prop.file);runDoc(c5,"proposal","beacon",c5.prop.file);
 const L=lines_("CLM-1002","proposal");let k=0;
 const routes={"PB-LOL":["legal","negotiating"],"PB-REN":["shared","negotiating"],"NT-AI":["legal","proposed"],"NT-PUB":["shared","proposed"],"PB-PAY":["ai","negotiating"],"PB-ASM":["shared","negotiating"],"PB-SLA":["ai","agreed"],"PB-SLC":["shared","negotiating"],"PB-ACP":["legal","negotiating"],"PB-SUB":["ai","negotiating"],"NT-NSO":["legal","proposed"],"NT-SUS":["shared","proposed"]};
 L.forEach(l=>{if(l.m==="std"){k++;if(["PB-CHG","PB-LAW","PB-IND","PB-IPO"].includes(l.pb)){l.status="agreed";l.by="Both parties, round 3"}else if(k%2===0){l.status="accepted";l.by="Priya Shah confirmed"}}
  else if(l.m!=="std"&&!(l.pb==="PB-ACP"&&l.m==="std")){const r=routes[l.pb];if(r){l.route=r[0];l.status=r[1];if(r[1]==="agreed"){l.by="Legal approved the fallback";l.lg=true}}}});
 const byPb=(cid,doc,pb,m)=>lines_(cid,doc).find(l=>l.pb===pb&&(!m||l.m===m));
 const mkRev=(l,route,due,part,st,thread)=>{if(!l)return;REV.push({id:"RV-"+(201+REV.length),ct:l.ct,line:l.id,route:route,st:st,due:due,part:part,opened:addD(due,-7),thread:thread||[]});l.route=route};
 mkRev(byPb("CLM-1002","proposal","PB-LOL"),"legal","2026-10-13",[LEGAL,"Priya Shah"],"In review",[{who:LEGAL,t:"Three months of fees is far below our 12 month floor. Counter with 12 months and a 3x super-cap for data breach.",at:"Sep 30"},{who:"Priya Shah",t:"Lumen's own insurance covers $2M only. I can live with 2x if legal agrees.",at:"Oct 1"}]);
 mkRev(byPb("CLM-1002","proposal","NT-AI"),"legal","2026-10-14",[LEGAL,"Rina Okafor"],"Open",[{who:"Rina Okafor",t:"Our AI policy says no vendor training on Atlantic Systems content. Need a clause we can reuse.",at:"Oct 5"}]);
 mkRev(byPb("CLM-1002","proposal","PB-REN"),"shared","2026-10-16",[LEGAL,"Marco Ellis","Priya Shah"],"In review",[{who:"Marco Ellis",t:"Lumen can drop automatic renewal if you accept the Net 30 payment term.",at:"Oct 2"},{who:"Priya Shah",t:"Net 30 with the 2 percent discount is inside our fallback. Legal, please confirm.",at:"Oct 2"}]);
 mkRev(byPb("CLM-1002","proposal","NT-PUB"),"shared","2026-10-20",[LEGAL,"Marco Ellis","Maya Ortiz"],"Open",[]);
 mkRev(byPb("CLM-1002","proposal","PB-ACP","var"),"legal","2026-10-15",[LEGAL,"Chief Editor"],"Open",[]);
 mkRev(byPb("CLM-1005","proposal","NT-USG"),"legal","2026-10-12",[LEGAL,"Dev Rao","Avery Chen"],"In review",[{who:"Avery Chen",t:"An uncapped true-up makes the budget unforecastable. I want a 10 percent tolerance.",at:"Oct 3"}]);
 mkRev(byPb("CLM-1005","proposal","NT-AI"),"legal","2026-10-12",[LEGAL,"Rina Okafor"],"Escalated",[{who:"Rina Okafor",t:"Prompts include unpublished draft standards. Escalating to the CIO.",at:"Oct 4"}]);
 [["CLM-1002",[["2026-09-08","Lumen","Proposal v1 received","v1",0,0],["2026-09-17","Atlantic Systems","Redlined 14 lines: payment, liability, renewal, service levels","v1 markup",2,0],["2026-09-29","Lumen","Proposal v2 accepts 6 of our edits and keeps liability and renewal","v2",1,6],["2026-10-06","Atlantic Systems","Counter in progress: legal review of 5 lines, shared review of 3","v2 markup",0,0]]],
  ["CLM-1005",[["2026-09-22","Beacon","Order Form 1 proposal received","v1",0,0],["2026-10-06","Atlantic Systems","Legal review of true-up, audit and AI terms opened","v1 markup",0,0]]],
  ["CLM-1001",[["2025-12-08","Lumen","Proposal v1 received","v1",0,0],["2026-01-19","Lumen","Proposal v2 after two rounds of calls","v2",3,5],["2026-02-27","Both","Signed with a $22,000 mobilization advance and shorter warranty","executed",4,2]]]].forEach(r=>r[1].forEach((x,i)=>RND.push({ct:r[0],n:i+1,date:x[0],from:x[1],note:x[2],ver:x[3],us:x[4],ven:x[5]})));
 [["2026-10-06 08:12","Contract Analyst Agent","Analyzed proposal","CLM-1002","41 lines in 3.1 seconds, average confidence 89%."],["2026-10-05 16:40","Priya Shah","Routed to legal review","CLM-1002","Limitation of liability, three months of fees."],["2026-10-05 11:05","Rina Okafor","Opened shared review","CLM-1005","AI training on prompts."],["2026-10-02 15:22","Dev Rao","Raised change request","CLM-1001","CR-201 Milestone 3 slips 7 work days."],["2026-09-30 09:30","Casey Rowan","Approved change","CLM-1007","CR-208 storage tier, $21,400 (inside CIO authority)."],["2026-09-14 13:00","Priya Shah","Applied change","CLM-1012","CR-206 extension signed, amendment A1 stored."]].forEach(a=>audSeed(a[0],a[1],a[2],a[3],a[4]));
 if(DATAMODEL){/* registered below */}
}
seed();
/* ---------- Metrics (standard framework) ---------- */
const cycleDays=()=>{const a=CT0.filter(c=>c.exe&&c.prop&&c.prop.vers.length).map(c=>difD(c.exe.date,new Date(Date.parse(c.prop.vers[0].split("·")[1])).toISOString().slice(0,10)));return a.length?Math.round(sum(a)/a.length):0};
function allAnalyzed(){return Object.values(AN).filter(a=>a.doc!=="contract"||true).flatMap(a=>a.lines)}
function mVals(){const A=allAnalyzed(),cov=A.length?Math.round(100*A.filter(l=>l.m==="std").length/A.length*10)/10:0;
 const ob=OBLS().filter(o=>o.st==="done"||o.st==="late"||(o.st==="open"&&o.due<TDY)),good=ob.filter(o=>o.st==="done"&&o.dn&&o.dn<=o.due).length,ot=ob.length?Math.round(100*good/ob.length):100;
 const cs=CTS().filter(live),com=sum(cs,c=>c.value)||1,lk=sum(cs,ctLeak),lkp=Math.round(1000*lk/com)/10;
 return {cov:cov,ot:ot,cy:cycleDays(),lk:lkp,lkd:lk,traps:CTS().filter(isTrap).length}}
const MV=mVals();
Object.assign(METRICS,{
 m_sow_cover:{n:"Clause playbook coverage",f:"Lines that match a standard term or approved fallback ÷ All lines analyzed",u:"%",cur:MV.cov,tgt:85,badAt:70,dir:"max",max:100,tr:[58,61,63,66,68,70,72,MV.cov],owner:"Atlantic Legal",use:["SOW and contract analyzer","Terms playbook"],rem:{kind:"agent",ref:"Contract Analyst Agent",title:"Draft playbook clauses for repeated variances",agent:"Contract Analyst Agent",auto:false,state:"idle",prog:"Finds clauses vendors keep changing and drafts a standard plus fallback for legal to approve"}},
 m_sow_ontime:{n:"Obligation on-time rate",f:"Obligations completed by their due date ÷ (Obligations completed + Obligations overdue)",u:"%",cur:MV.ot,tgt:90,badAt:75,dir:"max",max:100,tr:[88,86,85,84,82,80,79,MV.ot],owner:"Contract owners",use:["Obligations and calendar","SOW and contract analyzer"],rem:{kind:"sop",ref:"SOP-412",title:"Obligation reminder and escalation",agent:"Contract Analyst Agent",auto:false,state:"idle",prog:"Reminds owners 10 days ahead and escalates overdue vendor obligations to the account manager"}},
 m_sow_cycle:{n:"Negotiation cycle time",f:"Σ(date executed − date first proposal received) ÷ Contracts executed",u:" days",cur:MV.cy,tgt:35,badAt:60,dir:"min",max:100,tr:[55,52,50,47,46,44,43,MV.cy],owner:"Procurement and Legal",use:["Terms playbook","SOW and contract analyzer"],rem:{kind:"kb",ref:"KB0510",title:"Faster negotiation: use fallbacks first",agent:"Contract Analyst Agent",auto:false,state:"idle",prog:"Routes lines inside approved fallbacks straight to the business owner so legal sees only true exceptions"}},
 m_sow_leak:{n:"Contract leakage",f:"(Paid beyond accepted work + Service credits owed and unclaimed) ÷ Total committed value of live contracts",u:"%",cur:MV.lk,tgt:1,badAt:3,dir:"min",max:10,tr:[.9,1.1,1.2,1.4,1.1,1.3,1.5,MV.lk],owner:"Controller",use:["Obligations and calendar","Invoice approval"],rem:{kind:"agent",ref:"Invoice Advisor",title:"Hold invoices without acceptance",agent:"Invoice Advisor",auto:false,state:"idle",prog:"Holds a payment until the matching milestone is accepted and claims credits when a service level is missed"}},
 m_sow_trap:{n:"Auto-renewal traps",f:"Live contracts that renew automatically with a notice deadline inside 120 days ÷ none expected",u:"",cur:MV.traps,tgt:0,badAt:2,dir:"min",max:10,tr:[0,0,1,1,0,1,1,MV.traps],owner:"Contract owners",use:["Obligations and calendar","Dashboard and contracts"],rem:{kind:"agent",ref:"Contract Analyst Agent",title:"Draft the renewal decision memo",agent:"Contract Analyst Agent",auto:false,state:"idle",prog:"Drafts a keep, renegotiate or leave recommendation 150 days before every notice deadline"}}
});
function syncMetrics(){const v=mVals();[["m_sow_cover","cov"],["m_sow_ontime","ot"],["m_sow_cycle","cy"],["m_sow_leak","lk"],["m_sow_trap","traps"]].forEach(a=>{METRICS[a[0]].cur=v[a[1]];METRICS[a[0]].tr[7]=v[a[1]]});return v}
/* ---------- Data model, standards, process ---------- */
DATAMODEL.register("contract_line",{label:"Contract line (clause, commitment, outcome)",source:"Contract analyzer",fields:[
 {k:"clause",label:"Clause reference",type:"string"},{k:"page",label:"Page",type:"number"},{k:"source_text",label:"Source text",type:"string"},{k:"type",label:"Type",type:"enum",opts:Object.values(TYP).map(t=>t[0])},{k:"value",label:"Normalized value",type:"string"},{k:"party",label:"Party",type:"enum",opts:["Atlantic Systems","Vendor","Both"]},{k:"owner",label:"Owner",type:"ref"},{k:"due",label:"Due",type:"date"},{k:"measure",label:"Measure",type:"string"},{k:"target",label:"Target",type:"string"},{k:"confidence",label:"AI confidence",type:"percent"},{k:"status",label:"Status",type:"enum",opts:["Proposed","Accepted","Negotiating","Agreed"]},{k:"playbook",label:"Playbook match",type:"enum",opts:["Standard","Variance","Not in playbook"]},{k:"playbook_clause",label:"Playbook clause",type:"ref"},{k:"route",label:"Review route",type:"enum",opts:["AI picks standard","Legal review","Shared review"]},{k:"risk",label:"Risk",type:"enum",opts:["Low","Medium","High"]},{k:"wbs_link",label:"Project WBS line",type:"ref"},{k:"sla_link",label:"SLA",type:"ref"},{k:"invoice_link",label:"Invoice schedule line",type:"ref"},{k:"raid_link",label:"RAID item",type:"ref"},{k:"budget_link",label:"Budget line",type:"ref"}]});
DATAMODEL.register("contract",{label:"Contract or statement of work",source:"Contract repository",fields:[{k:"id",label:"Contract ID"},{k:"vendor",label:"Vendor",type:"ref"},{k:"type",label:"Type",type:"enum",opts:["SOW","MSA","Software license","DPA","NDA","Order form","Support agreement"]},{k:"status",label:"Status",type:"enum",opts:["Draft","In negotiation","Executed","Expiring","Expired"]},{k:"value",label:"Total contract value",type:"currency"},{k:"start",label:"Start",type:"date"},{k:"end",label:"End",type:"date"},{k:"auto_renew",label:"Auto-renews",type:"boolean"},{k:"notice_days",label:"Notice days",type:"number"},{k:"owner",label:"Contract owner",type:"ref"},{k:"project",label:"Linked project",type:"ref"},{k:"risk",label:"Risk",type:"enum",opts:["Low","Medium","High"]}]});
DATAMODEL.register("contract_obligation",{label:"Contract obligation",source:"Contract analyzer",fields:[{k:"id",label:"Obligation ID"},{k:"contract",label:"Contract",type:"ref"},{k:"party",label:"Party",type:"enum",opts:["Atlantic Systems","Vendor"]},{k:"owner",label:"Owner",type:"ref"},{k:"due",label:"Due",type:"date"},{k:"status",label:"Status",type:"enum",opts:["Open","Done","Overdue","At risk"]},{k:"kind",label:"Kind",type:"enum"}]});
DATAMODEL.register("contract_change",{label:"Contract change request",source:"Contract analyzer",fields:[{k:"id",label:"Change ID"},{k:"contract",label:"Contract",type:"ref"},{k:"type",label:"Type",type:"enum",opts:CRT},{k:"state",label:"State",type:"enum",opts:STAGES},{k:"price_impact",label:"Price impact",type:"currency"},{k:"schedule_days",label:"Schedule impact (work days)",type:"number"},{k:"approver",label:"Required approver",type:"ref"}]});
STD.worldcc={n:"WorldCC contracting practice",by:"World Commerce and Contracting",d:"Industry practice for contract lifecycle management: clause libraries, playbooks, negotiation tracking and obligation management after signature."};
STD.coso={n:"Delegation of authority",by:"Atlantic Systems policy, COBIT governance",d:"Approval limits by amount so that nobody signs above their tier."};
PROC.reg("ppm_sow",{title:"From vendor proposal to managed contract",std:["worldcc","cobit","pmbok"],steps:[
 {n:"Intake",d:"A vendor proposal, SOW or terms arrive by upload, email or request. The original file and version are stored.",who:"human",owner:"Maya Ortiz",sla:"Same day",in:"Vendor proposal file",out:"Repository record with metadata"},
 {n:"AI analysis",d:"The Contract Analyst Agent splits the text into typed lines with owners, dates, measures and confidence.",who:"agent",owner:"Contract Analyst Agent",sla:"Under 1 minute",in:"Document text",out:"Line by line register"},
 {n:"Playbook match",d:"Each line is matched to a standard clause, a variance with a redline, or flagged as new for legal.",who:"agent",owner:"Contract Analyst Agent",sla:"Under 1 minute",in:"Register and playbook",out:"Standard, variance or new term"},
 {n:"Legal or shared review",d:"Legal reviews exceptions. Shared review adds the vendor and business owner in one thread with a deadline.",who:"human",owner:"Maya Ortiz",sla:"5 business days",in:"Variances and new terms",out:"Agreed language"},
 {n:"Approval",d:"The signer is chosen by contract value under the delegation of authority. AI cannot accept terms.",who:"gate",owner:"Casey Rowan",sla:"2 business days",in:"Agreed terms",out:"Signed contract"},
 {n:"Execution",d:"The executed contract is stored with its proposal. Project, WBS, invoice schedule and budget are created.",who:"robot",sla:"Immediate",in:"Signed contract",out:"Project, schedule, invoice rules"},
 {n:"Obligations tracking",d:"Due dates, renewal notices and acceptance checks run daily. Invoices wait for accepted work.",who:"agent",owner:"Contract Analyst Agent",sla:"Daily",in:"Obligation register",out:"Reminders and holds"},
 {n:"Change control",d:"Any change to schedule, scope, price, SLA or term is a change request with impact analysis and the right approver.",who:"gate",owner:"Nia Brooks",sla:"5 business days",in:"Change request",out:"Amendment and updated register"}]});
/* ---------- UI helpers ---------- */
const sPill=(t,c)=>`<span class="pill ${c||"mute"}">${esc(t)}</span>`;
const rkPill=r=>sPill(r,r==="High"?"bad":r==="Medium"?"warn":"good");
const mPill=m=>sPill(MATCH[m][0],MATCH[m][1]);
const stPill=s=>sPill(STP[s][0],STP[s][1]);
const ctStPill=s=>sPill(s,s==="Executed"?"good":s==="Expiring"?"warn":s==="In negotiation"?"info":s==="Expired"?"bad":"mute");
const pc=n=>{n=String(n||"");if(n===LEGAL)return `<span class="sow-nm"><i class="sow-lg" aria-hidden="true">§</i><span>${esc(n)}</span></span>`;return who(n)?pchip(n):`<span class="sow-nm">${avatar(n,{size:22})}<span>${esc(n)}</span></span>`};
const stat=(l,v,sub,cls)=>`<div class="stat ${cls||""}"><small>${l}</small><span class="num" data-role="metric">${v}</span><em>${sub}</em></div>`;
const why=(h,t)=>{const id=pid();return `<button class="chip sow-why" popovertarget="${id}">Why this way</button><div popover id="${id}" class="pop glass"><div class="eyebrow">Why</div><h3>${esc(h)}</h3><p class="muted">${esc(t)}</p><div class="row"><button class="btn" popovertarget="${id}" popovertargetaction="hide">Close</button></div></div>`};
const stack=a=>{const t=sum(a,x=>x.v);return `<div class="sow-stack" role="img" aria-label="${esc(a.map(x=>x.l+" "+x.v).join(", "))}">${t?a.filter(x=>x.v>0).map(x=>`<i style="flex:${x.v};background:var(${x.c})" title="${esc(x.l)}: ${x.v}"><b>${x.v}</b></i>`).join(""):""}</div>`};
const hbars=(a,fmt)=>{const mx=Math.max(1,...a.map(x=>x.v));return `<div class="sow-hb">${a.map(x=>`<div class="sow-hbr"><span class="sow-hbl">${esc(x.l)}</span><span class="sow-hbt"><i style="width:${Math.max(2,Math.round(x.v/mx*100))}%;background:var(${x.c})"></i></span><span class="num">${fmt?fmt(x.v):x.v}</span></div>`).join("")}</div>`};
const confBar=c=>`<span class="sow-conf" title="AI confidence ${Math.round(c*100)}%"><i style="width:${Math.round(c*100)}%;background:var(${c>=.85?"--good-f":c>=.7?"--warn-f":"--bad-f"})"></i><b>${Math.round(c*100)}%</b></span>`;
const goTab=i=>{S.v.sow=i;if(S.screen!=="ppm_sow")go("ppm_sow");else render()};
const onSow=()=>S.screen==="ppm_sow";
const analyzerChip=(conf,note)=>aiChip({model:"Contract Analyst Agent",conf:conf||.89,title:"How lines are read and matched",note:note||"Splits the document into sentences, assigns a type, owner, date and measure to each, then compares it with the Terms playbook. It suggests; people decide.",src:["Document text with page and clause reference","Terms playbook","Project WBS, RAID log, invoice schedule"],guards:["Cannot accept or sign terms","High risk lines need legal approval","Every change is audited","Reads only contracts you can open"]});
/* ---------- aggregates ---------- */
function agg(){const cs=CTS(),ob=OBLS(),crs=CRALL(),lv=cs.filter(live);const due30=ob.filter(o=>o.st!=="done"&&o.due>=TDY&&difD(o.due,TDY)<=30);const over=ob.filter(o=>o.st==="late"||(o.st==="open"&&o.due<TDY));const k=cs.map(counts);
 const committed=sum(lv,c=>c.value),billed=sum(lv,ctBilled);return {n:cs.length,lv:lv.length,neg:cs.filter(c=>c.status==="In negotiation").length,due30:due30,over:over,off:sum(k,x=>x.off),std:sum(k,x=>x.std),lines:sum(k,x=>x.n),open:crs.filter(x=>x.st!=="Approved"),committed:committed,billed:billed,traps:cs.filter(isTrap),lk:sum(lv,ctLeak)}}
/* ---------- renewal timeline ---------- */
function renewChart(){const cs=CTS().filter(c=>live(c)&&rdate(c)),mons=[];for(let i=0;i<15;i++){const d=new Date(Date.UTC(2026,9+i,1));mons.push({k:d.toISOString().slice(0,7),l:MON[d.getUTCMonth()]+(d.getUTCMonth()===0||i===0?" "+String(d.getUTCFullYear()).slice(2):""),t:0,a:0,e:0,names:[]})}
 let later=0;const MK=new Map(mons.map(x=>[x.k,x]));/* PR-12: month lookup by key, was mons.find per contract */cs.forEach(c=>{const d=rdate(c),m=MK.get(d.slice(0,7));const v=c.ann||c.value;if(d<TDY)return;if(!m){later+=v;return}if(isTrap(c))m.t+=v;else if(c.auto)m.a+=v;else m.e+=v;m.names.push(c.vendor+" "+c.type+(c.auto?" (notice deadline)":" (ends)"))});
 const W=760,H=250,L=52,R=12,T=16,B=36,mx=Math.max(1,...mons.map(m=>m.t+m.a+m.e))*1.12,bw=(W-L-R)/mons.length,y=v=>T+(H-T-B)*(1-v/mx);let g="";
 for(let i=0;i<=4;i++){const v=mx*i/4;g+=`<line class="grid-l" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L-8}" y="${y(v)+4}" text-anchor="end">${fmtTz(Math.round(v/1000)*1000)}</text>`}
 mons.forEach((m,i)=>{const x=L+i*bw+bw*.18,w=bw*.64;let acc=0;[["t","--bad-f"],["a","--warn-f"],["e","--story-f"]].forEach(([k,c])=>{if(!m[k])return;const h=(H-T-B)*m[k]/mx;g+=`<rect x="${x}" y="${y(acc+m[k])}" width="${w}" height="${h}" rx="3" style="fill:var(${c})"><title>${esc(m.l)}: ${D$(m[k])} a year. ${esc(m.names.join("; "))}</title></rect>`;acc+=m[k]});
  g+=`<text class="ax" x="${x+w/2}" y="${H-14}" text-anchor="middle">${esc(m.l)}</text>`;if(acc)g+=`<text class="ax" x="${x+w/2}" y="${y(acc)-5}" text-anchor="middle" style="font-weight:700">${fmtTz(acc)}</text>`});
 return `<svg viewBox="0 0 ${W} ${H}" class="sow-chart" role="img" aria-label="Annual value of contracts reaching a renewal or end decision, by month">${g}</svg>${legend([["Auto-renews and the notice deadline is inside 120 days (trap)","--bad-f"],["Auto-renews, notice deadline later","--warn-f"],["Ends on its date and needs a decision","--story-f"]])}<p class="muted small">Each bar is the annual value of contracts whose decision date falls in that month. For auto-renewing contracts the date is the last day to send notice, not the end date. ${later?"Another "+fmtTz(later)+" a year has decision dates after Dec 2027.":""}</p>`}
/* ---------- attention list ---------- */
function attention(){const a=agg(),out=[];
 a.traps.slice(0,2).forEach(c=>out.push({c:"bad",t:`${c.vendor}: notice of non‑renewal is due ${fdt(rdate(c))}, ${difD(rdate(c),TDY)} days from now`,s:`${c.title} renews automatically for another term (${D$(c.ann||c.value)} a year) unless we send notice. Project ${c.proj||"none"} replaces it.`,b:["Raise the change request","data-sow-newcr="+c.id]}));
 a.over.filter(o=>o.ct&&!o.id.startsWith("OB-G")).slice(0,2).forEach(o=>out.push({c:"bad",t:o.t,s:`${ctShort(o.ct)} · due ${fdt(o.due,1)}, ${difD(TDY,o.due)} days overdue · ${o.who}`,b:["Open obligations","data-sow-tab=6"]}));
 const l1=CT0[0];if(ctLeak(l1))out.push({c:"warn",t:`${D$(ctLeak(l1))} paid to Lumen ahead of accepted work`,s:"The $22,000 mobilization advance is in the executed contract but was not in the proposal. Invoice INV-20433 for Milestone 3 stays on hold until acceptance.",b:["Compare proposal and contract","data-sow-cmp=CLM-1001"]});
 const off=lines_("CLM-1002","proposal").filter(l=>l.m!=="std"&&l.status!=="agreed");if(off.length)out.push({c:"warn",t:`${off.length} lines in Lumen SOW-5 are off playbook and not agreed`,s:`${off.filter(l=>l.m==="new").length} are new terms with no standard yet, such as AI training on our content. ${REV.filter(r=>r.st!=="Agreed").length} reviews are open with legal or in shared review.`,b:["Open the playbook review","data-sow-tab=3"]});
 const cr=a.open.filter(x=>x.st==="Approval")[0];if(cr)out.push({c:"info",t:`${cr.id} waiting for approval: ${cr.title}`,s:`${S$(cr.amt)} needs ${tierOf(cr.amt).role}. ${cr.amt<=100000?"That is you (CIO) under the delegation of authority.":"That is above your limit of $100,000."}`,b:["Review the change","data-sow-cr="+cr.id]});
 const cl=CT0[6];if(cl.credit&&cl.credit.owed>cl.credit.claimed)out.push({c:"info",t:`${D$(cl.credit.owed-cl.credit.claimed)} of Northwind service credit not claimed`,s:"Q3 availability was 99.62 percent against 99.9 percent. The contract lets Atlantic Systems claim the credit within 30 days of quarter end.",b:["Open obligation","data-sow-tab=6"]});
 return out}
/* ---------- tab 1: dashboard and contract list ---------- */
function tabDash(){const a=agg(),v=syncMetrics();const at=attention();
 const hs=`<div class="statrow">${stat("Contracts",a.n.toLocaleString("en-US"),`${a.lv} live, ${a.neg} in negotiation`)}${stat("Obligations due in 30 days",a.due30.length,`${a.over.length} already overdue`,a.over.length?"crit":"")}${stat("Clauses off playbook",a.off.toLocaleString("en-US"),`of ${a.lines.toLocaleString("en-US")} lines read`,a.off>20?"crit":"")}${stat("Open change requests",a.open.length,`${a.open.filter(x=>x.st==="Approval").length} waiting for approval`)}${stat("Spend vs committed",pct1(100*a.billed/(a.committed||1)),`${fmtTz(a.billed)} paid of ${fmtTz(a.committed)}`)}</div>`;
 return `<div class="sow-tab">${hs}<div class="row sow-mrow">${fchip("m_sow_trap")}${stdChip("worldcc","Clause library, playbook, negotiation tracking and obligation management follow WorldCC contracting practice.")}</div>
 <div class="grid g2 sow-g2">${card("Renewals and decision dates","When money and options run out. Auto-renewals are plotted at their notice deadline, which comes first.",renewChart(),analyzerChip(.93,"Dates come from the executed contract and any amendments. The notice deadline is the end date minus the notice days.")) }${card("Needs attention",at.length+" items, ranked by money and time left",`<div class="needs">${at.map(x=>`<div class="need sow-need"><div class="ico ${x.c}">${ico(x.c==="bad"?"warn":x.c==="warn"?"warn":"info")}</div><div><b>${esc(x.t)}</b><span class="muted" data-role="story">${esc(x.s)}</span></div><div class="act"><button class="btn" ${x.b[1].replace("=","=\"")}">${esc(x.b[0])}</button></div></div>`).join("")||empty("Nothing needs attention","All obligations are on track.")}</div>`)}</div>
 ${card("All contracts",`${a.n.toLocaleString("en-US")} contracts and statements of work. Filter by vendor, type, status, risk or renewal window. Select a row for the full record.`,btHTML({id:"sow_list",h:470,rowH:46,key:"id",exportName:"contracts",facets:["vendor","type","status","risk","win"],open:id=>openCT(id),rows:()=>CTS(),
  cols:[{k:"id",label:"ID"},{k:"title",label:"Contract",wrap:1,fmt:r=>`<b>${esc(r.title)}</b>`},{k:"vendor",label:"Vendor"},{k:"type",label:"Type"},{k:"status",label:"Status",fmt:r=>ctStPill(r.status),val:r=>r.status},{k:"value",label:"Value",cls:"num",fmt:r=>D$(r.value),val:r=>r.value},{k:"end",label:"Ends",fmt:r=>fdt(r.end,1)+" "+r.end.slice(0,4),val:r=>r.end},{k:"win",label:"Renewal window",val:r=>rwin(r),fmt:r=>{const w=rwin(r);return sPill(w,w==="Within 30 days"||w==="Past due"?"bad":w==="31 to 90 days"?"warn":"mute")}},{k:"risk",label:"Risk",fmt:r=>rkPill(r.risk),val:r=>r.risk},{k:"off",label:"Off playbook",cls:"num",val:r=>counts(r).off,fmt:r=>{const k=counts(r);return k.off?`<b>${k.off}</b> <span class="muted">of ${k.n}</span>`:"0"}},{k:"owner",label:"Owner"}]}),`<div class="row"><button class="btn primary" data-sow-upload>Add or analyze a document</button></div>`)}
 </div>`}
/* ---------- contract drawer ---------- */
function openCT(id){const c=ctOf(id);if(!c)return;const k=counts(c),inv=genInv(c),obs=OBLS().filter(o=>o.ct===id),crs=CRALL().filter(x=>x.ct===id),rv=REV.filter(r=>r.ct===id);
 const lr=lrHTML({id:"sow_lr_"+id,limit:5,groups:[{key:"o",label:"Obligations",rows:obs.map(o=>({id:o.id,t:o.t,sub:o.who,tag:fdt(o.due,1),st:o.st==="done"?"good":o.st==="late"?"bad":o.st==="risk"?"warn":"mute",go:()=>{SW.oSel=o.id;goTab(6)}}))},{key:"c",label:"Change requests",rows:crs.map(x=>({id:x.id,t:x.id+" "+x.title,sub:x.type,tag:x.st,st:x.st==="Approved"?"good":"warn",go:()=>openCR(x.id)}))},{key:"i",label:"Invoice schedule",rows:inv.map(r=>({id:r.n,t:r.n,sub:D$(r.amt),tag:r.st,st:r.st==="paid"&&!r.acc?"bad":r.st==="held"?"warn":"mute",go:()=>goTab(6)}))},{key:"r",label:"Reviews",rows:rv.map(r=>({id:r.id,t:r.id+" "+(findLine(r.line)||{}).ref,sub:RTE[r.route],tag:r.st,st:"info",go:()=>openReview(r.line)}))},{key:"s",label:"Service and project",rows:[c.svc?{id:"s",t:c.svc,sub:"Business service",tag:"",st:"info",go:()=>window.openImpact&&openImpact({type:"service",service:c.svc})}:null,c.proj?{id:"p",t:c.proj+" "+((PROJ.find(p=>p.id===c.proj)||{}).n||""),sub:"Linked project",tag:"",st:"info",go:()=>go("ppm_proj")}:null].filter(Boolean)}].filter(g=>g.rows.length)});
 openDrawer(`<span class="eyebrow">${esc(c.id)} · ${esc(c.type)}</span><h2 style="font-size:28px;margin:8px 0">${esc(c.title)}</h2><div class="row">${ctStPill(c.status)}${rkPill(c.risk)}${c.auto?sPill("Auto-renews","warn"):""}${isTrap(c)?sPill("Renewal trap","bad"):""}${c.gen?sPill("Enterprise sample","mute"):""}</div>
 <div class="dfullgrid" style="margin-top:14px"><div><dl class="kv"><dt>Vendor</dt><dd>${pc(c.vendor)}</dd><dt>Value</dt><dd class="num">${D$(c.value)}${c.ann?` <span class="muted">(${D$(c.ann)} a year)</span>`:""}</dd><dt>Term</dt><dd>${fdt(c.start)} to ${fdt(c.end)}</dd><dt>Renewal</dt><dd>${c.auto?`Automatic. Notice needed by <b>${fdt(rdate(c))}</b> (${c.notice||"unstated"} days before the end)`:"By written order"}</dd><dt>Owner</dt><dd>${pc(c.owner)}</dd><dt>Vendor contact</dt><dd>${pc(c.vOwner)}</dd><dt>Service</dt><dd>${esc(c.svc||"None")}</dd><dt>Project</dt><dd>${c.proj?esc(c.proj+" "+((PROJ.find(p=>p.id===c.proj)||{}).n||"")):"None"}</dd><dt>Paid so far</dt><dd class="num">${D$(ctBilled(c))} <span class="muted">${D$(ctAcc(c))} accepted</span></dd></dl></div>
 <div><div class="eyebrow">Playbook position ${k.an?"":'<span class="muted">(estimate until analyzed)</span>'}</div>${stack([{l:"Standard",v:k.std,c:"--good-f"},{l:"Variance",v:k.var,c:"--warn-f"},{l:"New term",v:k.new,c:"--story-f"}])}${legend([["Standard","--good-f"],["Variance","--warn-f"],["New term","--story-f"]])}<p class="story" data-role="story">${k.n} lines: ${k.std} standard, ${k.var} variance, ${k.new} new.${k.an?"":" Run the analyzer to read the document line by line."}</p><div class="row"><button class="btn primary" data-sow-open="${id}:2">Open in analyzer</button><button class="btn" data-sow-open="${id}:3">Playbook review</button><button class="btn" data-sow-newcr="${id}">Request a change</button><button class="btn" data-sow-open="${id}:1">Repository record</button></div></div></div>
 ${ingestHTML(c)}
 <div class="eyebrow" style="margin-top:18px">Linked records</div>${lr||""}`);audit("opened contract",id)}
function findLine(id){for(const k in AN){const l=AN[k].lines.find(x=>x.id===id);if(l)return l}return null}
/* ---------- tab 2: repository ---------- */
function tabRepo(){const cs=CTS(),hp=cs.filter(c=>c.prop),he=cs.filter(c=>c.exe),am=sum(cs,c=>(c.amend||[]).length),un=cs.filter(c=>!bestDoc(c.id)).length;
 const types=["SOW","MSA","Software license","DPA","NDA","Order form","Support agreement"],tc=["--p1","--w1","--e1","--s3","--u1","--p5","--u4"];
 const delta=cs.filter(c=>c.exe&&c.prop&&c.prop.value);const mv=delta.length?sum(delta,c=>c.value-c.prop.value):0;
 return `<div class="sow-tab"><div class="statrow">${stat("Engagements",cs.length.toLocaleString("en-US"),"each keeps proposal and contract together")}${stat("Proposals on file",hp.length.toLocaleString("en-US"),"as received, with versions")}${stat("Executed contracts",he.length.toLocaleString("en-US"),"with terms and conditions")}${stat("Amendments",am,"each one versioned")}${stat("Not yet read by the analyzer",un.toLocaleString("en-US"),"no line register yet",un>cs.length/2?"crit":"")}</div>
 <div class="grid g2 sow-g2">${card("What is stored, by type","Count of engagements. Each has a vendor proposal and, once signed, the executed contract.",hbars(types.map((t,i)=>({l:t,v:cs.filter(c=>c.type===t).length,c:tc[i]}))),"")}${card("Proposal to signed contract",`Across ${delta.length} signed engagements the final price moved ${S$(mv)} from the proposals.`,`<div class="sow-walk">${delta.slice(0,6).map(c=>{const d=c.value-c.prop.value;return `<button class="sow-wk" data-sow-eng="${c.id}"><span><b>${esc(c.vendor)}</b><small>${esc(c.type)} · proposal ${c.prop.ver}</small></span><span class="num">${D$(c.prop.value)} <i aria-hidden="true">→</i> ${D$(c.value)}</span><span class="pill ${d>0?"warn":d<0?"good":"mute"}">${S$(d)}</span></button>`}).join("")}</div>`,"")}</div>
 ${card("Vendor engagements","Select a row to read the proposal and the executed contract side by side.",btHTML({id:"sow_repo",h:450,rowH:46,key:"id",exportName:"repository",facets:["vendor","type","status"],open:id=>openEng(id),rows:()=>CTS(),
  cols:[{k:"title",label:"Engagement",wrap:1,fmt:r=>`<b>${esc(r.title)}</b><small class="muted"> ${esc(r.id)}</small>`},{k:"vendor",label:"Vendor"},{k:"type",label:"Type"},{k:"status",label:"Status",fmt:r=>ctStPill(r.status),val:r=>r.status},{k:"prop",label:"Vendor proposal",val:r=>r.prop?r.prop.ver+" "+r.prop.date:"None",fmt:r=>r.prop?`${esc(r.prop.ver)} <span class="muted">${fdt(r.prop.date,1)}</span>`:"None"},{k:"exe",label:"Executed contract",val:r=>r.exe?r.exe.date:"Not signed",fmt:r=>r.exe?`${fdt(r.exe.date,1)} <span class="muted">${r.exe.date.slice(0,4)}</span>`:sPill("Not signed","info")},{k:"am",label:"Amendments",cls:"num",val:r=>(r.amend||[]).length},{k:"mv",label:"Price moved",cls:"num",val:r=>r.exe&&r.prop?r.value-r.prop.value:0,fmt:r=>r.exe&&r.prop&&r.value!==r.prop.value?S$(r.value-r.prop.value):"None"},{k:"tcs",label:"Terms and conditions",val:r=>r.exe?r.exe.tcs:"None",wrap:1,fmt:r=>r.exe?esc(r.exe.tcs):"None"},{k:"owner",label:"Owner"},{k:"proj",label:"Project",val:r=>r.proj||"None",fmt:r=>esc(String(r.proj||"None"))}]}),`<div class="row"><button class="btn primary" data-sow-upload>Upload a proposal or contract</button></div>`)}</div>`}
function docText(c,which){const o=c[which],k=o&&o.text;return k&&TXT[k]?TXT[k]:""}
function excerpt(t,n){if(!t)return `<p class="muted small">The file is stored but not previewed in this prototype. A document service extracts the text in production. Use Analyze to run the sample text for this type.</p>`;return `<pre class="sow-pre">${esc(t.split("\n").slice(0,n||16).join("\n"))}\n...</pre>`}
function openEng(id){const c=ctOf(id);if(!c)return;const pv=c.prop,ex=c.exe;
 const walk=[["Vendor proposal "+(pv?pv.ver:""),pv?pv.value:null]].concat((ex?[["Executed contract",ex?c.value-(c.amend||[]).reduce((a,x)=>a+x.delta,0):null]]:[]),(c.amend||[]).map(x=>["Amendment "+x.id,x.delta]));
 openDrawer(`<span class="eyebrow">Vendor engagement · ${esc(c.id)}</span><h2 style="font-size:26px;margin:8px 0">${esc(c.title)}</h2><div class="row">${ctStPill(c.status)}<span class="pill mute">${esc(c.type)}</span>${pc(c.vendor)}</div>
 <div class="dfullgrid" style="margin-top:14px"><section class="card glass"><div class="cardhead"><div><h3>Vendor proposal, as received</h3><span class="muted small">${pv?esc(pv.file):"No proposal on file"}</span></div>${pv?sPill(pv.ver,"info"):""}</div>${pv?`<dl class="kv"><dt>Received</dt><dd>${fdt(pv.date)}</dd><dt>Quoted value</dt><dd class="num">${D$(pv.value)}</dd><dt>Versions kept</dt><dd>${(pv.vers||[]).map(x=>`<span class="pill mute">${esc(x)}</span>`).join(" ")||"v1"}</dd></dl>${excerpt(docText(c,"prop"),14)}<div class="row"><button class="btn primary" data-sow-run="${c.id}:proposal">Analyze proposal</button><button class="btn" data-sow-upload="${c.id}">Upload new version</button></div>`:empty("No proposal stored","Upload the vendor proposal so changes can be compared later.")}</section>
 <section class="card glass"><div class="cardhead"><div><h3>Executed contract, with terms and conditions</h3><span class="muted small">${ex?esc(ex.file):"Not signed yet"}</span></div>${ex?sPill("Signed","good"):sPill("In negotiation","info")}</div>${ex?`<dl class="kv"><dt>Signed</dt><dd>${fdt(ex.date)}</dd><dt>Version</dt><dd>${esc(ex.ver)}</dd><dt>Terms and conditions</dt><dd>${esc(ex.tcs)}</dd><dt>Current value</dt><dd class="num">${D$(c.value)}</dd><dt>Amendments</dt><dd>${(c.amend||[]).length?(c.amend||[]).map(a=>`<div><b>${esc(a.id)}</b> ${fdt(a.date)}: ${esc(a.title)} <span class="muted">${a.delta?S$(a.delta):"no price change"}</span></div>`).join(""):"None"}</dd></dl>${excerpt(docText(c,"exe"),14)}<div class="row"><button class="btn primary" data-sow-run="${c.id}:contract">Analyze contract</button>${pv?`<button class="btn" data-sow-cmp="${c.id}">Compare with proposal</button>`:""}<button class="btn" data-sow-newcr="${c.id}">Request an amendment</button></div>`:empty("Not signed","This engagement is still a proposal. Negotiate in the Terms playbook, then upload the signed contract.")}</section></div>
 <div class="eyebrow" style="margin-top:16px">Price walk</div><div class="sow-walk">${walk.filter(w=>w[1]!=null).map(w=>`<div class="sow-wk"><span><b>${esc(w[0])}</b></span><span class="num">${/^Amend/.test(w[0])?S$(w[1]):D$(w[1])}</span></div>`).join("")}<div class="sow-wk"><span><b>Value today</b></span><span class="num">${D$(c.value)}</span></div></div>`)}
/* ---------- scale: synthetic lines for every generated contract ---------- */
function scaleLines(){if(GEN.lines)return GEN.lines;const r=RNG("sowlines"),pick=a=>a[Math.floor(r()*a.length)],out=[];
 const T={deliverable:["Vendor delivers the monthly service report","Vendor delivers the design document"],milestone:["Milestone 2: configuration complete","Milestone 3: user acceptance test passed"],commitment:["Vendor will hold a weekly status meeting"],outcome:["The service reduces manual effort by 20 percent"],kpi:["Ticket backlog stays under 40 items"],sla:["Availability of at least 99.9 percent each month","Severity 1 response within 30 minutes"],payment:["Invoices are payable within 45 days","Milestone invoices follow written acceptance"],assumption:["Atlantic Systems provides test data by the start date"],dependency:["Depends on Entra ID single sign-on"],obl_us:["Atlantic Systems reviews each deliverable in 10 business days"],obl_vendor:["Vendor keeps the SOC 2 report current"],risk:["Vendor staff turnover may delay delivery"],term:["Renews for one year unless notice is sent","Either party may terminate for cause"],liability:["Liability is limited to 12 months of fees"],data:["Vendor notifies Atlantic Systems of a breach within 72 hours"],ip:["Atlantic Systems owns all deliverables"],warranty:["Deliverables conform for 90 days"],price:["Rates are fixed for the term"],change:["Changes need a signed change order"],legal:["Governed by the laws of Delaware"]};
 const types=Object.keys(T),pbFor={liability:"PB-LOL",data:"PB-DPA",term:"PB-REN",payment:"PB-PAY",sla:"PB-SLA",warranty:"PB-WAR",price:"PB-CAP",ip:"PB-IPO",change:"PB-CHG",legal:"PB-LAW"};
 GEN.list.forEach(c=>{const n=Math.min(c.n,18);for(let i=0;i<n;i++){const ty=pick(types),x=r(),m=x<.72?"std":x<.9?"var":"new",pb=pbFor[ty]||"";const party=["obl_vendor","deliverable","milestone","sla","kpi","warranty","data"].includes(ty)?"Vendor":["payment","obl_us","dependency"].includes(ty)?"Atlantic Systems":"Both";
  out.push({id:"L"+c.num+"S"+String(i+1).padStart(2,"0"),ct:c.id,doc:"contract",ref:(1+Math.floor(i/4))+"."+(i%4+1),page:1+Math.floor(i/3),src:pick(T[ty]),type:ty,norm:"Stated",val:null,unit:"",party:party,owner:party==="Vendor"?c.vendor:c.owner,watch:"",due:r()<.4?addD(TDY,Math.round(r()*300-30)):"",measure:"",target:"",conf:Math.round((.6+r()*.38)*100)/100,status:pick(["proposed","accepted","accepted","agreed","negotiating"]),lk:{wbs:"",sla:"",inv:"",raid:"",bud:""},m:m,pb:m==="new"?"NT-GEN":m==="var"?(pb||"PB-LOL"):pb,pbs:[],vend:"",why:"Enterprise sample line.",fb:false,risk:pick(["Low","Medium","High"]),rec:"shared",route:"",trap:false,routine:!pb&&m==="std",ours:"",thread:[],by:"Sample",lg:false,synthetic:true,key:ty})}});
 GEN.lines=out;return out}
function curAn(){return AN[anKey(SW.ct,SW.doc)]||AN[anKey(SW.ct,bestDoc(SW.ct)||"proposal")]||null}
function linesFor(scope){if(scope==="all")return Object.values(AN).flatMap(a=>a.lines).concat(SCALE.on?scaleLines():[]);if(scope==="contract")return allLines_(SW.ct);const a=curAn();return a?a.lines:[]}
function allKnownLines(){return Object.values(AN).flatMap(a=>a.lines).concat(SCALE.on&&GEN.lines?GEN.lines:[])}
const dotT=t=>`<span class="sow-ty"><i style="background:var(${TYP[t][1]})"></i>${esc(TYP[t][0])}</span>`;
const lkCount=l=>Object.values(l.lk||{}).filter(Boolean).length;
const lkChips=l=>["wbs","sla","inv","raid","bud"].filter(k=>l.lk&&l.lk[k]).map(k=>`<span class="pill ${l.lkc&&l.lkc[k]?"good":"mute"}" title="${esc(l.lk[k])}">${({wbs:"WBS",sla:"SLA",inv:"INV",raid:"RAID",bud:"BUD"})[k]}</span>`).join("")||'<span class="muted">None</span>';
/* ---------- analysis run (steps) ---------- */
const STEPS=["Reading the document and mapping pages","Splitting into clauses and sentences","Typing every line: deliverable, SLA, payment, term and so on","Normalizing amounts, dates and durations","Assigning owners, due dates, measures and targets","Linking lines to WBS, SLA, invoice schedule, RAID and budget","Matching each line to the Terms playbook"];
function startRun(cid,doc,tkey,name){SW.run={ct:cid,doc:doc,tkey:tkey,name:name,stage:0};SW.ct=cid;SW.doc=doc;S.v.sow=2;audit("started analysis",name);
 const tick=()=>{const r=SW.run;if(!r)return;r.stage++;if(r.stage>=STEPS.length){const c=ctOf(r.ct),a=runDoc(c,r.doc,r.tkey,r.name);SW.run=null;const k=a.lines.reduce((o,l)=>(o[l.m]++,o),{std:0,var:0,new:0});aud("Contract Analyst Agent","Analyzed "+(r.doc==="proposal"?"proposal":"contract"),r.ct,a.lines.length+" lines: "+k.std+" standard, "+k.var+" variance, "+k.new+" new.");toast(a.lines.length+" lines read: "+k.std+" standard, "+k.var+" variance, "+k.new+" new","good");if(onSow())render();return}
  if(onSow())render();setTimeout(tick,480)};
 if(onSow())render();setTimeout(tick,520)}
function runCard(){const r=SW.run;return card("Reading "+esc(r.name),"Seven steps. The text stays in your browser in this prototype.",`<ol class="sow-steps">${STEPS.map((s,i)=>`<li class="${i<r.stage?"done":i===r.stage?"now":""}"><i aria-hidden="true">${i<r.stage?"✓":i===r.stage?"…":""}</i><span>${esc(s)}</span></li>`).join("")}</ol>`,analyzerChip(.9))}
function dropCard(open){return `<details class="card glass sow-new" ${open?"open":""}><summary><span><b>Analyze a new document</b><small class="muted">Paste text, drop a file, or use a sample. The result replaces the register for the selected document.</small></span><span class="btn">Open</span></summary>
 <div class="grid g2 sow-g2"><label class="sow-dz" data-sow-dz><input type="file" accept=".txt,.md,.pdf,.docx,.doc" data-sow-file hidden><span class="sow-dzi">${ico("book")}</span><b>Drop a proposal, SOW or terms here, or choose a file</b><small>Text and Markdown files are read here. PDF and Word files need the production document service, so this prototype shows the sample text for that document type and says so.</small></label>
 <div class="sow-paste"><label class="flab" for="sow_paste">Or paste the text</label><textarea id="sow_paste" class="fin" rows="6" data-sow-paste placeholder="1. Scope&#10;1.1 The supplier shall deliver ...&#10;4.2 Invoices are payable within 30 days."></textarea><div class="row"><button class="btn primary" data-sow-runpaste>Analyze pasted text</button></div></div></div>
 <div class="row sow-samples"><span class="muted small">Samples:</span><button class="btn quiet" data-sow-sample="sow5">Lumen SOW-5 proposal</button><button class="btn quiet" data-sow-sample="beacon">Beacon usage-based license</button><button class="btn quiet" data-sow-sample="msa">Master services agreement</button><button class="btn quiet" data-sow-sample="dpa">Data processing addendum</button></div></details>`}
/* ---------- tab 3: analyzer ---------- */
function ctBar(docs){const c=ctOf(SW.ct)||CT0[1];return `<div class="sow-pick glass"><div class="sow-pk"><span class="eyebrow">Working on</span><b>${esc(c.title)}</b><span class="muted small">${esc(c.id)} · ${esc(c.vendor)} · ${esc(c.type)} · ${D$(c.value)}</span></div><div class="row">${docs?`<div class="recchips" role="group" aria-label="Document">${[["proposal","Vendor proposal"],["contract","Executed contract"]].map(d=>`<button class="chip" data-sow-doc="${d[0]}" aria-pressed="${SW.doc===d[0]}" ${d[0]==="contract"&&!c.exe?'title="Not signed yet"':""}>${d[1]}${AN[anKey(c.id,d[0])]?" ✓":""}</button>`).join("")}</div>`:""}<button class="btn" data-sow-pick>Change contract</button></div></div>`}
function tabAnalyzer(){const a=curAn(),c=ctOf(SW.ct)||CT0[1];let body="";
 if(SW.run)return `<div class="sow-tab">${ctBar(1)}${runCard()}</div>`;
 if(!a)return `<div class="sow-tab">${ctBar(1)}${empty("This document has not been read yet","Choose a sample below or upload the file. Each sentence becomes a typed line with owner, date, measure and playbook match.")}${dropCard(1)}</div>`;
 const L=a.lines,tc={};L.forEach(l=>tc[l.type]=(tc[l.type]||0)+1);const mk={std:0,var:0,new:0};L.forEach(l=>mk[l.m]++);const avg=L.length?Math.round(100*sum(L,l=>l.conf)/L.length):0,low=L.filter(l=>l.conf<.75).length,dated=L.filter(l=>l.due).length,usd=sum(L.filter(l=>l.type==="price"&&l.unit==="USD"),l=>l.val||0);
 const types=Object.keys(tc).sort((x,y)=>tc[y]-tc[x]).map(t=>({l:TYP[t][0],v:tc[t],c:TYP[t][1]}));
 return `<div class="sow-tab">${ctBar(1)}
 <div class="statrow">${stat("Lines read",L.length,`from ${esc(a.src)}`)}${stat("Average confidence",avg+"%",low+" lines under 75 percent",low>4?"crit":"")}${stat("Lines with a date",dated,"become obligations and WBS dates")}${stat("Fixed price stated",usd?D$(usd):"None","first price line found")}${stat("Off playbook",mk.var+mk.new,`${mk.var} variance, ${mk.new} new`,mk.var+mk.new>8?"crit":"")}</div>
 <div class="row sow-mrow">${fchip("m_sow_cover")}${analyzerChip(avg/100)}${why("Every line keeps its source","Each line shows the clause number, page and exact source sentence so a person can check it. Confidence drops when a sentence is long, vague (for example 'reasonable' or 'best efforts'), or the type is a guess.")}</div>
 <div class="grid g2 sow-g2">${card("What the document contains",L.length+" lines by type. Select a type in the table filter to focus.",hbars(types)+`<p class="muted small">Colors only separate types here. Each bar is labeled.</p>`)}${card("Playbook position","How many lines are our standard, a variance, or not in the playbook yet.",stack([{l:"Standard",v:mk.std,c:"--good-f"},{l:"Variance",v:mk.var,c:"--warn-f"},{l:"New term",v:mk.new,c:"--story-f"}])+legend([["Standard (matches our clause or is routine)","--good-f"],["Variance (differs, redline and fallback ready)","--warn-f"],["New term (no standard yet, draft for legal)","--story-f"]])+`<p class="story" data-role="story">${L.length} lines: <b>${mk.std}</b> standard, <b>${mk.var}</b> variance, <b>${mk.new}</b> new. ${mk.var+mk.new?"The variances and new terms are the only lines that need legal or shared review.":"Nothing needs legal."}</p><div class="row"><button class="btn primary" data-sow-open="${c.id}:3">Review in Terms playbook</button><button class="btn" data-sow-cmp="${c.id}">Compare proposal and contract</button></div>`)}</div>
 ${card("Line by line register",`Every clause, commitment and measure as one row. Select a row for the source text, owner, links and playbook decision.`,`<div class="row sow-scope"><span class="muted small">Show</span><div class="recchips" role="group" aria-label="Register scope">${[["doc","This document"],["contract","This contract"],["all","All contracts"]].map(s=>`<button class="chip" data-sow-scope="${s[0]}" aria-pressed="${SW.scope===s[0]}">${s[1]}</button>`).join("")}</div></div>`+btHTML({id:"sow_lines",h:520,rowH:60,key:"id",exportName:"contract-lines",facets:["type","m","status","party","risk","ct"],open:id=>openLine(id),rows:()=>linesFor(SW.scope),
  cols:[{k:"ref",label:"Clause and page",val:r=>"§"+r.ref+" p."+r.page,fmt:r=>`<b>§${esc(r.ref)}</b><small class="muted"> p.${r.page}</small>`},{k:"type",label:"Type",val:r=>TYP[r.type][0],fmt:r=>dotT(r.type)},{k:"src",label:"Source text",wrap:1,fmt:r=>`<span class="sow-src">${esc(r.src)}</span>`},{k:"norm",label:"Normalized value",wrap:1,val:r=>r.norm,fmt:r=>esc(String(r.norm))},{k:"party",label:"Party"},{k:"owner",label:"Owner",wrap:1,fmt:r=>esc(r.owner)},{k:"due",label:"Due",val:r=>r.due||"",fmt:r=>r.due?fdt(r.due):"None"},{k:"mt",label:"Measure and target",wrap:1,val:r=>(r.measure||"")+" "+(r.target||""),fmt:r=>r.measure?`${esc(r.measure)}<small class="muted"> ${esc(r.target||"")}</small>`:"None"},{k:"conf",label:"Confidence",val:r=>r.conf,fmt:r=>confBar(r.conf)},{k:"status",label:"Status",val:r=>STP[r.status][0],fmt:r=>stPill(r.status)},{k:"m",label:"Playbook",val:r=>MATCH[r.m][0],fmt:r=>mPill(r.m)},{k:"risk",label:"Risk",val:r=>r.risk,fmt:r=>esc(String(r.risk))},{k:"ct",label:"Contract",val:r=>r.ct,fmt:r=>esc(String(r.ct))},{k:"lk",label:"Links",val:r=>lkCount(r),fmt:r=>lkChips(r)}]}))}
 ${dropCard(0)}</div>`}
/* ---------- line drawer: source, links, playbook decision, redline, review route, thread ---------- */
function lineGuard(l){return l.risk==="High"&&l.m!=="std"&&!l.lg}
function openLine(id){const l=findLine(id)||(GEN.lines||[]).find(x=>x.id===id);if(!l)return;SW.line=id;const c=ctOf(l.ct),pbn=PBN[l.pb]||NTN[l.pb],rv=REV.find(r=>r.line===id);
 const red=l.m==="std"?`<p class="story" data-role="story">${esc(l.why)}</p>`:`<div class="sow-red"><div><div class="eyebrow">Vendor language and our standard, compared</div><p class="sow-rl">${redlineHTML(l.src,l.ours||"No standard language yet.")}</p><p class="muted small"><del class="sow-del">Struck through</del> is vendor wording we would remove. <ins class="sow-ins">Underlined</ins> is our wording we would add.</p></div></div>`;
 const rec=l.m==="std"?"No change needed. The business owner confirms the value.":l.m==="var"?(l.fb?"Counter with our fallback position. It is inside the approved range, so legal does not need to review.":l.risk==="High"?"Counter with our standard and send to legal. This is a high risk clause and the vendor value is outside the fallback.":"Counter with our standard in a shared review so the vendor and business owner can agree it."):"Legal should approve a new clause. The AI drafted a proposed position below.";
 openDrawer(`<div class="row">${dotT(l.type)}${mPill(l.m)}${stPill(l.status)}${rkPill(l.risk)}${l.synthetic?sPill("Enterprise sample","mute"):""}</div><h2 style="font-size:24px;margin:10px 0 4px">§${esc(l.ref)} · ${esc(TYP[l.type][0])}</h2><p class="muted small">${esc(ctShort(l.ct))} · ${l.doc==="proposal"?"vendor proposal":"executed contract"} · page ${l.page}</p>
 <blockquote class="sow-quote">${esc(l.src)}</blockquote>
 <div class="dfullgrid"><section class="card glass"><div class="cardhead"><h3>What the AI read</h3>${analyzerChip(l.conf,"Confidence "+Math.round(l.conf*100)+"% for this line. It drops for long or vague sentences.")}</div><dl class="kv"><dt>Normalized value</dt><dd class="num">${esc(l.norm)}</dd><dt>Party</dt><dd>${esc(l.party)}</dd><dt>Owner</dt><dd>${pc(l.owner)} ${who(l.owner)?kindPill(who(l.owner).kind):""}</dd>${l.watch?`<dt>Watched by</dt><dd>${pc(l.watch)} ${kindPill("ai")}</dd>`:""}<dt>Due</dt><dd>${l.due?fdt(l.due)+(difD(l.due,TDY)<0?` <span class="pill bad">${-difD(l.due,TDY)} days overdue</span>`:""):"No date in the text"}</dd><dt>Measure</dt><dd>${esc(l.measure||"None")}</dd><dt>Target</dt><dd>${esc(l.target||"None")}</dd><dt>Confidence</dt><dd>${confBar(l.conf)}</dd><dt>Decision trail</dt><dd>${esc(l.by||"AI suggested")}</dd></dl>
 <div class="row"><button class="btn" data-sow-editline="${l.id}">Edit fields</button><button class="btn" data-sow-accept="${l.id}">Accept line</button>${l.m!=="std"&&l.status!=="agreed"?`<button class="btn" data-sow-agree="${l.id}">Mark agreed</button>`:""}</div></section>
 <section class="card glass"><div class="cardhead"><h3>Linked to</h3>${why("Links are suggestions","The agent matches words in the line to project tasks, RAID items and the invoice schedule. Confirm a link to make it real. Nothing is created without confirmation.")}</div><div class="sow-lk">${[["wbs","Project WBS line","ppm_wbs"],["sla","Service level","itsm_sla"],["inv","Invoice schedule","inv"],["raid","RAID item","ppm_raid"],["bud","Budget line","bud_over"]].map(k=>`<div class="sow-lkr"><span class="muted small">${k[1]}</span><b>${l.lk&&l.lk[k[0]]?esc(l.lk[k[0]]):"None"}</b>${l.lk&&l.lk[k[0]]?(l.lkc&&l.lkc[k[0]]?`<span class="pill good">Confirmed</span>`:`<button class="btn quiet" data-sow-lk="${l.id}:${k[0]}">Confirm</button>`):""}${l.lk&&l.lk[k[0]]?`<button class="btn quiet" data-go="${k[2]}">Open</button>`:""}</div>`).join("")}</div>${(l.type==="milestone"||l.type==="deliverable")&&l.due?`<div class="row"><button class="btn" data-sow-wbs1="${l.id}">Send this date to the WBS</button></div>`:""}</section></div>
 <section class="card glass" style="margin-top:14px"><div class="cardhead"><div><h3>Playbook decision</h3><span class="muted small" data-role="story">${esc(l.why)}</span></div>${analyzerChip(Math.max(.6,l.conf-.02),"Matched against "+(pbn?pbn.n:"the playbook")+". "+(l.m==="new"?"No standard exists, so the agent drafted a proposed position. Legal approves it.":""))}</div>
 <dl class="kv"><dt>Clause</dt><dd>${pbn?`<b>${esc(pbn.n)}</b> <span class="muted">${esc(l.pb)}</span> ${l.m==="new"?"":sPill(pbn.ver+" · reviewed "+fdt(pbn.rev,1),"mute")}`:"Routine line, no clause needed"}</dd><dt>Vendor ask</dt><dd>${esc(l.vend||l.norm)}</dd>${pbn&&pbn.fb?`<dt>Approved fallback</dt><dd>${esc(pbn.fb)}</dd>`:""}<dt>Recommendation</dt><dd><b>${esc(rec)}</b></dd><dt>Route</dt><dd>${l.route?sPill(RTE[l.route],"info"):"Not chosen"}${rv?` <span class="muted small">${esc(rv.id)} · due ${fdt(rv.due,1)} · ${esc(rv.st)}</span>`:""}</dd></dl>${red}
 ${l.m!=="std"?`<div class="row sow-routes"><button class="btn ${l.rec==="ai"?"primary":""}" data-sow-route="${l.id}:ai">AI picks standard</button><button class="btn ${l.rec==="legal"?"primary":""}" data-sow-route="${l.id}:legal">Send to legal</button><button class="btn ${l.rec==="shared"?"primary":""}" data-sow-route="${l.id}:shared">Shared review</button>${l.m==="new"?`<button class="btn" data-sow-addclause="${l.id}">Add draft to the playbook</button>`:""}${rv&&!l.lg?`<button class="btn" data-sow-lgok="${l.id}">Record legal approval</button>`:""}</div>`:""}
 <div class="sow-guard" role="note"><b>Guardrails.</b> The AI recommends and drafts. It cannot accept, sign or send a term. ${lineGuard(l)?"This is a high risk line, so Atlantic Legal must approve before it can be accepted.":"A person confirms before anything is sent to the vendor."} ${l.lg?'<span class="pill good">Legal approved</span>':""}</div></section>
 <section class="card glass" style="margin-top:14px"><div class="cardhead"><h3>Discussion</h3><span class="muted small">${(rv?rv.thread:l.thread).length} comments</span></div><div class="sow-thread">${(rv?rv.thread:l.thread).map(t=>`<div class="sow-cm">${pc(t.who)}<p>${esc(t.t)}</p><small class="muted">${esc(t.at)}</small></div>`).join("")||'<p class="muted small">No comments yet.</p>'}</div><div class="row"><input class="fin" id="sow_cmt" placeholder="Add a comment for the thread" aria-label="Comment"><button class="btn" data-sow-cmt="${l.id}">Post</button></div></section>`);audit("opened line",l.id)}
function openReview(id){openLine(id)}
/* ---------- tab 4: terms playbook ---------- */
const pbUses=id=>allKnownLines().filter(l=>l.pb===id).length;
function negCard(c){const R=RND.filter(r=>r.ct===c.id).sort((a,b)=>a.n-b.n);const us=sum(R,r=>r.us),ve=sum(R,r=>r.ven),first=R[0],last=R[R.length-1];const mx=Math.max(1,...R.map(r=>Math.max(r.us,r.ven)));
 const days=first?difD(last.date,first.date):0;
 return card("Negotiation tracking: "+esc(ctShort(c.id)),R.length?`${R.length} rounds over ${days} days. Atlantic Systems conceded on ${us} lines and the vendor on ${ve}. ${ve>us?"The vendor has moved more.":us>ve?"Atlantic Systems has moved more, so hold firm on the next round.":"Concessions are even."}`:"No rounds logged yet.",R.length?`<div class="sow-rounds">${R.map(r=>`<div class="sow-rd"><div class="sow-rdh"><b>Round ${r.n}</b><span class="muted small">${fdt(r.date)} · ${esc(r.from)} · ${esc(r.ver)}</span></div><p>${esc(r.note)}</p><div class="sow-rdb"><span class="muted small">Atlantic Systems conceded</span><span class="sow-rbar"><i style="width:${r.us/mx*100}%;background:var(--story-f)"></i></span><b>${r.us}</b></div><div class="sow-rdb"><span class="muted small">Vendor conceded</span><span class="sow-rbar"><i style="width:${r.ven/mx*100}%;background:var(--good-f)"></i></span><b>${r.ven}</b></div></div>`).join("")}</div>${legend([["Lines Atlantic Systems conceded or moved on","--story-f"],["Lines the vendor conceded or moved on","--good-f"]])}`:empty("No negotiation history","Log the first round when the proposal arrives."),`<div class="row">${fchip("m_sow_cycle")}<button class="btn" data-sow-round>Log a round</button></div>`)}
function reviewsCard(){const g=[["Legal review",r=>r.route==="legal"&&r.st!=="Escalated"&&r.st!=="Agreed"],["Shared review (vendor, legal and business)",r=>r.route==="shared"&&r.st!=="Agreed"],["Escalated to the CIO",r=>r.st==="Escalated"],["Agreed",r=>r.st==="Agreed"]];
 return card("Reviews in progress",REV.filter(r=>r.st!=="Agreed").length+" open. Legal reviews have an owner and a deadline. Shared reviews add the vendor and the business owner to one thread.",lrHTML({id:"sow_rev",limit:8,groups:g.map((x,i)=>({key:"g"+i,label:x[0],rows:REV.filter(x[1]).map(r=>{const l=findLine(r.line)||{};const pn=PBN[l.pb]||NTN[l.pb]||{};return {id:r.id,t:r.id+" §"+(l.ref||"")+" "+(pn.n||"Line"),sub:ctShort(r.ct)+" · "+r.part.join(", "),tag:"due "+fdt(r.due,1)+" · "+r.thread.length+" comments",st:difD(r.due,TDY)<=3?"bad":"info",go:()=>openLine(r.line)}})}))}))}
function tabPlaybook(){const c=ctOf(SW.ct)||CT0[1],a=curAn();
 const head=ctBar(1);if(!a)return `<div class="sow-tab">${head}${empty("Nothing to review yet","Analyze this document first. The playbook then classifies every line.")}<div class="row"><button class="btn primary" data-sow-open="${c.id}:2">Open the analyzer</button></div></div>`;
 const L=a.lines,k={std:0,var:0,new:0};L.forEach(l=>k[l.m]++);const off=L.filter(l=>l.m!=="std"),pend=off.filter(l=>l.status!=="agreed"),rs=REV.filter(r=>r.ct===c.id&&r.st!=="Agreed"),fbN=off.filter(l=>l.m==="var"&&l.fb&&!l.route).length,hiN=off.filter(l=>l.risk==="High"&&!l.route).length,stdOpen=L.filter(l=>l.m==="std"&&l.status==="proposed").length;
 const hs=`<div class="statrow">${stat("Lines",L.length,"in this document")}${stat("Standard",k.std,pct1(100*k.std/(L.length||1))+" coverage")}${stat("Variance",k.var,"redline and fallback ready")}${stat("New terms",k.new,"draft for legal to approve",k.new?"crit":"")}${stat("Decisions waiting",pend.length,rs.length+" reviews open")}</div>`;
 const g1=card("Where this document stands",`<span data-role="story"><b>${L.length} lines: ${k.std} standard, ${k.var} variance, ${k.new} new.</b> ${fbN} variances sit inside an approved fallback, so the AI can propose our position without legal. ${hiN} high risk lines have no route yet.</span>`,stack([{l:"Standard",v:k.std,c:"--good-f"},{l:"Variance",v:k.var,c:"--warn-f"},{l:"New term",v:k.new,c:"--story-f"}])+legend([["Standard","--good-f"],["Variance","--warn-f"],["New term, not in playbook","--story-f"]])+`<div class="row sow-mrow">${fchip("m_sow_cover")}${analyzerChip(.9,"Classifies each line against the clause library and drafts redlines and fallback positions. A person or legal approves every change.")}${stdChip("cobit","Contract approval and review routes follow COBIT governance: separation between who proposes, who reviews and who approves.")}</div><div class="row"><button class="btn primary" data-sow-batch="std" ${stdOpen?"":"disabled"}>Confirm ${stdOpen} standard lines</button><button class="btn" data-sow-batch="fb" ${fbN?"":"disabled"}>AI picks fallback for ${fbN}</button><button class="btn" data-sow-batch="legal" ${hiN?"":"disabled"}>Send ${hiN} high risk to legal</button></div>`);
 const g2=card("Guardrails","Who can do what in a contract review.",`<ul class="sow-gl"><li><b>AI</b> reads, classifies, drafts redlines and suggests a route. It cannot accept a term, change a price or send anything to the vendor.</li><li><b>Business owner</b> confirms standard and low risk lines and picks a route.</li><li><b>Atlantic Legal</b> must approve every high risk exception and every new clause.</li><li><b>Signer</b> is set by value under the delegation of authority (${D$(c.value)} needs ${tierOf(c.value).role}).</li></ul>`,"");
 const rq=`<div class="row"><div class="recchips" role="group" aria-label="Queue filter"><button class="chip" data-sow-rq="off" aria-pressed="${SW.rq!=="all"}">Off playbook (${off.length})</button><button class="chip" data-sow-rq="all" aria-pressed="${SW.rq==="all"}">All lines (${L.length})</button></div></div>`+btHTML({id:"sow_rq",h:440,rowH:56,key:"id",exportName:"review-queue",facets:["m","route","risk","status"],open:id=>openLine(id),rows:()=>{const A=curAn();const X=A?A.lines:[];return SW.rq==="all"?X:X.filter(l=>l.m!=="std")},
  cols:[{k:"ref",label:"Clause",val:r=>"§"+r.ref,fmt:r=>`<b>§${esc(r.ref)}</b>`},{k:"topic",label:"Topic",wrap:1,val:r=>(PBN[r.pb]||NTN[r.pb]||{n:TYP[r.type][0]}).n,fmt:r=>`<b>${esc((PBN[r.pb]||NTN[r.pb]||{n:TYP[r.type][0]}).n)}</b><small class="muted"> ${esc(TYP[r.type][0])}</small>`},{k:"m",label:"Position",val:r=>MATCH[r.m][0],fmt:r=>mPill(r.m)},{k:"vend",label:"Vendor ask",wrap:1,val:r=>r.vend||r.norm,fmt:r=>esc(String(r.vend||r.norm))},{k:"rec",label:"AI recommends",val:r=>r.m==="std"?"Confirm":RTE[r.rec],fmt:r=>r.m==="std"?"Confirm standard":esc(RTE[r.rec])},{k:"route",label:"Route",val:r=>r.route?RTE[r.route]:"Not chosen",fmt:r=>r.route?sPill(RTE[r.route],"info"):'<span class="muted">Not chosen</span>'},{k:"status",label:"Status",val:r=>STP[r.status][0],fmt:r=>stPill(r.status)},{k:"risk",label:"Risk",fmt:r=>rkPill(r.risk),val:r=>r.risk},{k:"conf",label:"Confidence",val:r=>r.conf,fmt:r=>confBar(r.conf)}]});
 const lib=btHTML({id:"sow_pb",h:430,rowH:58,key:"id",exportName:"playbook",facets:["cat","risk"],open:id=>openClause(id),rows:()=>PB,
  cols:[{k:"id",label:"ID"},{k:"n",label:"Clause",wrap:1,fmt:r=>`<b>${esc(r.n)}</b>`},{k:"cat",label:"Category"},{k:"risk",label:"Risk",fmt:r=>rkPill(r.risk),val:r=>r.risk},{k:"std",label:"Approved language",wrap:1,fmt:r=>`<span class="sow-src">${esc(r.std)}</span>`},{k:"fb",label:"Fallback",wrap:1,fmt:r=>`<span class="sow-src">${esc(r.fb)}</span>`},{k:"uses",label:"Lines seen",cls:"num",val:r=>pbUses(r.id)},{k:"ver",label:"Version",val:r=>r.ver+" "+r.rev,fmt:r=>`${esc(r.ver)} <span class="muted small">${fdt(r.rev,1)}</span>`},{k:"owner",label:"Owner"}]});
 return `<div class="sow-tab">${head}${hs}<div class="grid g2 sow-g2">${g1}${g2}</div>
 ${views("sowpb",["Review queue","Reviews in progress","Negotiation","Clause library"],[card("Lines that need a decision","Select a line to see the side by side redline, the explanation and the three routes.",rq),reviewsCard(),negCard(c),card("Atlantic Systems standard terms library",PB.length+" clauses with approved language, fallback positions and a risk rating. Legal owns each clause.",lib,`<div class="row"><button class="btn primary" data-sow-newclause>New clause</button></div>`)])}</div>`}
function openClause(id){const p=PBN[id];if(!p)return;const ls=allKnownLines().filter(l=>l.pb===id),k={std:0,var:0,new:0};ls.forEach(l=>k[l.m]++);const rate=ls.length?Math.round(100*k.var/ls.length):0;
 openDrawer(`<span class="eyebrow">${esc(p.id)} · ${esc(p.cat)}</span><h2 style="font-size:26px;margin:8px 0">${esc(p.n)}</h2><div class="row">${rkPill(p.risk)}${sPill(p.ver+" · reviewed "+fdt(p.rev),"mute")}${pc(p.owner)}</div>
 <div class="dfullgrid" style="margin-top:14px"><section class="card glass"><div class="cardhead"><h3>Approved language</h3></div><blockquote class="sow-quote good">${esc(p.std)}</blockquote><div class="eyebrow">Fallback ladder</div><blockquote class="sow-quote warn">${esc(p.fb)}</blockquote><dl class="kv"><dt>Keywords</dt><dd>${esc(p.kw||"")}</dd><dt>Owner</dt><dd>${ownerChip(p.owner,{role:"Owner"})} approves any change</dd></dl></section>
 <section class="card glass"><div class="cardhead"><h3>How vendors treat it</h3>${analyzerChip(.84,"Counts lines in every analyzed document that matched this clause.")}</div><p class="story" data-role="story">${ls.length?`Seen on <b>${ls.length}</b> lines across ${new Set(ls.map(l=>l.ct)).size} contracts. <b>${rate}%</b> were variances. ${rate>=40?"Vendors push back often here. Consider whether the standard is too strict or widen the fallback.":"Vendors usually accept this clause."}`:"No analyzed line has matched this clause yet."}</p>${stack([{l:"Standard",v:k.std,c:"--good-f"},{l:"Variance",v:k.var,c:"--warn-f"}])}${legend([["Matched our standard","--good-f"],["Variance","--warn-f"]])}<div class="row"><button class="btn" data-sow-editclause="${p.id}">Edit clause</button></div></section></div>
 <div class="eyebrow" style="margin-top:16px">Lines using this clause</div>${lrHTML({id:"sow_cl_"+id,limit:6,groups:["var","std"].map(m=>({key:m,label:MATCH[m][0],rows:ls.filter(l=>l.m===m).map(l=>({id:l.id,t:"§"+l.ref+" "+l.src.slice(0,70),sub:ctShort(l.ct),tag:l.vend||"",st:m==="std"?"good":"warn",go:()=>openLine(l.id)}))})).filter(g=>g.rows.length),empty:"No lines yet."})}`)}
/* make a PB clause from a form; vendor sentences are compared with our language by wording overlap */
function addClause(v,fromLine){const id="PB-"+(v.n||"X").replace(/[^A-Za-z]/g,"").slice(0,4).toUpperCase()+(PB.length+1);const kws=String(v.kw||"").split(/[,;]/).map(x=>x.trim().toLowerCase()).filter(x=>x.length>2);
 const re=kws.length?new RegExp(kws.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")):/(?!)/;
 const p={id:id,n:v.n,cat:v.cat||"Legal",risk:v.risk||"Medium",std:v.std,fb:v.fb||"None.",kw:v.kw||"",re:re,ver:"v1",rev:TDY,owner:LEGAL,src:"New",uses:0,chk:s=>{const need=words(v.std).filter(w=>w.length>4&&!STOP.has(w)),have=new Set(words(s));const sc=need.length?need.filter(w=>have.has(w)).length/need.length:0;return sc>=.5?ok_("Matches our wording"):bad_("Differs from our wording","The vendor wording does not match the approved language for "+v.n+".")}};
 PB.push(p);PBN[id]=p;let moved=0;allKnownLines().forEach(l=>{if(l.m==="new"&&re.test(l.src.toLowerCase())){const r=p.chk(l.src.toLowerCase());l.pb=id;l.pbs=[id];l.ours=p.std;l.rk=p.risk;l.risk=p.risk;l.m=r.ok?"std":"var";l.why=r.ok?"Meets the new clause "+p.n+".":r.why;l.vend=r.v;l.rec=p.risk==="High"?"legal":"shared";moved++}});
 aud(S.sowUser||"Casey Rowan","Added playbook clause",fromLine?(findLine(fromLine)||{}).ct:"",p.n+" ("+id+"), "+moved+" lines now match it.");return {p:p,moved:moved}}
/* ---------- tab 5: proposal vs contract ---------- */
const CAT=t=>({price:"Price and payment",payment:"Price and payment",milestone:"Scope and schedule",deliverable:"Scope and schedule",commitment:"Scope and schedule",outcome:"Scope and schedule",obl_us:"Scope and schedule",obl_vendor:"Scope and schedule",sla:"Service levels",kpi:"Service levels",assumption:"Assumptions",dependency:"Assumptions",risk:"Assumptions"})[t]||"Terms and conditions";
const RK={std:0,var:1,new:2};
function cmpItems(cid){const P=lines_(cid,"proposal"),C=lines_(cid,"contract");if(!P.length||!C.length)return null;const keys=[...new Set(P.map(l=>l.key).concat(C.map(l=>l.key)))],out=[];
 keys.forEach(k=>{const p=P.filter(l=>l.key===k),c=C.filter(l=>l.key===k),n=Math.max(p.length,c.length);for(let i=0;i<n;i++){const a=p[i],b=c[i],l=b||a;let kind,dir="";
  if(a&&!b)kind="promised";else if(!a&&b)kind="extra";else if(a.norm===b.norm&&a.due===b.due&&a.m===b.m)kind="same";else{kind="changed";dir=RK[b.m]>RK[a.m]?"against":RK[b.m]<RK[a.m]?"favor":/\d/.test(a.norm+b.norm)?"neutral":"neutral";if(dir==="neutral"&&a.norm!==b.norm){const x=parseFloat(String(a.val)),y=parseFloat(String(b.val));if(!isNaN(x)&&!isNaN(y)&&l.type==="price")dir=y>x?"against":"favor"}}
  out.push({id:"cmp-"+cid+"-"+k+"-"+i,key:k,p:a,c:b,kind:kind,dir:dir,cat:(a&&b&&l.type==="milestone"&&a.due!==b.due)?"Scope and schedule":CAT(l.type),l:l})}});return out}
const KINDL={same:"Unchanged",changed:"Changed",promised:"Promised, not in contract",extra:"In contract, not promised"};
const DIRP={against:["Against Atlantic Systems","bad"],favor:["In Atlantic Systems' favor","good"],neutral:["Changed","warn"]};
function tabCompare(){const pairs=CTS().filter(c=>AN[anKey(c.id,"proposal")]&&AN[anKey(c.id,"contract")]);if(!pairs.length)return `<div class="sow-tab">${empty("No engagement has both documents analyzed","Analyze the proposal and the executed contract in the Analyzer tab to compare them.")}</div>`;
 if(!pairs.some(c=>c.id===SW.cmp))SW.cmp=pairs[0].id;const c=ctOf(SW.cmp),it=cmpItems(c.id),ch=it.filter(x=>x.kind==="changed"),pr=it.filter(x=>x.kind==="promised"),ex=it.filter(x=>x.kind==="extra"),sm=it.filter(x=>x.kind==="same"),ag=ch.filter(x=>x.dir==="against").length+ex.filter(x=>x.l.m!=="std").length+pr.length;
 const cats=["Price and payment","Scope and schedule","Service levels","Assumptions","Terms and conditions"],cc=["--s3","--p2","--u3","--e1","--w3"];const byc=cats.map((t,i)=>({l:t,v:it.filter(x=>x.kind!=="same"&&x.cat===t).length,c:cc[i]}));
 const pv=c.prop.value,delta=c.value-pv;
 const ms=it.filter(x=>x.l.type==="milestone"&&x.p&&x.c);
 const row=(x,btns)=>`<div class="need" style="grid-template-columns:auto 1fr auto"><div class="ico ${x.kind==="promised"?"bad":x.l.m!=="std"?"warn":"info"}">${ico(x.kind==="promised"?"warn":"info")}</div><div><b>§${esc(x.l.ref)} ${esc(TYP[x.l.type][0])}${x.l.m!=="std"&&x.kind==="extra"?" "+mPill(x.l.m):""}</b><span class="muted" data-role="story">${esc(x.l.src)}</span></div><div class="act">${btns}</div></div>`;
 return `<div class="sow-tab"><div class="sow-pick glass"><div class="sow-pk"><span class="eyebrow">Engagement</span><b>${esc(c.title)}</b><span class="muted small">Proposal ${esc(c.prop.ver)} (${fdt(c.prop.date,1)}) against the executed contract (${fdt(c.exe.date,1)})</span></div><div class="row"><label class="muted small">Engagement <select class="fin sow-sel" data-sow-cmpsel>${pairs.map(p=>`<option value="${p.id}" ${p.id===c.id?"selected":""}>${esc(p.vendor+" · "+p.id)}</option>`).join("")}</select></label></div></div>
 <div class="statrow">${stat("Price",S$(delta),D$(pv)+" proposed, "+D$(c.value)+" signed",delta>pv*.05?"crit":"")}${stat("Lines changed",ch.length,ag+" moved against Atlantic Systems",ag>3?"crit":"")}${stat("Promised, not in contract",pr.length,"commitments that disappeared",pr.length?"crit":"")}${stat("In contract, not promised",ex.length,ex.filter(x=>x.l.m!=="std").length+" are off playbook",ex.length>3?"crit":"")}${stat("Unchanged",sm.length,"identical in value and date")}</div>
 <p class="story" data-role="story"><b>What moved between the proposal and the signature.</b> ${pr.length?`The vendor promised ${pr.map(x=>x.l.measure||TYP[x.l.type][0].toLowerCase()).slice(0,3).join(", ")} in the proposal, but the signed contract no longer has ${pr.length===1?"it":"them"}. `:""}${ex.length?`The contract adds ${ex.length} terms nobody proposed${ex.some(x=>/advance/.test(x.l.src))?", including an advance payment":""}. `:""}${delta?`The price is ${S$(delta)} (${(100*delta/pv).toFixed(1)} percent) from the proposal.`:""}</p>
 <div class="grid g2 sow-g2">${card("Where the changes are","Count of changed, missing and added lines by area.",hbars(byc)+`<p class="muted small">${analyzerChip(.88,"Lines are paired by clause topic, milestone number or measure. Pairs whose value, date or playbook position differ are reported.")}</p>`)}${card("Milestone dates",ms.length?"Proposed date against signed date for each milestone.":"No milestone pairs found.",ms.length?`<div class="sow-walk">${ms.map(x=>`<div class="sow-wk"><span><b>${esc(x.l.src.split(":")[0])}</b><small>${esc(x.l.src.split(":")[1]||"").slice(0,48)}</small></span><span class="num">${fdt(x.p.due,1)} <i aria-hidden="true">→</i> ${fdt(x.c.due,1)}</span>${x.p.due!==x.c.due?sPill((difD(x.c.due,x.p.due)>0?"+":"")+difD(x.c.due,x.p.due)+" days","warn"):sPill("Same","mute")}</div>`).join("")}</div>`:"")}</div>
 ${card("Promised in the proposal, missing from the contract",pr.length+" lines. These are the commitments most likely to be lost without anyone noticing.",`<div class="needs">${pr.map(x=>row(x,`<button class="btn primary" data-sow-newcr="${c.id}" data-sow-cr-key="${esc(x.key)}">Request amendment</button><button class="btn" data-sow-cmpopen="${x.id}">Compare</button>`)).join("")||empty("Nothing missing","Every proposal commitment is in the contract.")}</div>`)}
 ${card("In the contract, never proposed",ex.length+" lines. New obligations, new risks and anything that moves money.",`<div class="needs">${ex.map(x=>row(x,`<button class="btn" data-sow-open1="${x.l.id}">Open line</button>`)).join("")||empty("Nothing added","The contract adds no new terms.")}</div>`)}
 ${card("Every change, side by side","Select a row to see the proposal and contract wording redlined.",btHTML({id:"sow_cmp",h:420,rowH:60,key:"id",exportName:"proposal-vs-contract",facets:["cat","kind","dirl"],open:id=>openCmp(id),rows:()=>(cmpItems(SW.cmp)||[]).filter(x=>x.kind!=="same"),
  cols:[{k:"cat",label:"Area"},{k:"topic",label:"Topic",wrap:1,val:x=>(PBN[x.l.pb]||NTN[x.l.pb]||{n:TYP[x.l.type][0]}).n,fmt:x=>`<b>§${esc(x.l.ref)}</b> ${esc((PBN[x.l.pb]||NTN[x.l.pb]||{n:TYP[x.l.type][0]}).n)}`},{k:"kind",label:"Kind",val:x=>KINDL[x.kind],fmt:x=>sPill(KINDL[x.kind],x.kind==="changed"?"warn":x.kind==="promised"?"bad":"info")},{k:"pv",label:"Proposal says",wrap:1,val:x=>x.p?x.p.norm:"Not in proposal",fmt:x=>esc(String(x.p?x.p.norm:"Not in proposal"))},{k:"cv",label:"Contract says",wrap:1,val:x=>x.c?x.c.norm:"Not in contract",fmt:x=>esc(String(x.c?x.c.norm:"Not in contract"))},{k:"dirl",label:"Direction",val:x=>x.dir?DIRP[x.dir][0]:"Not rated",fmt:x=>x.dir?sPill(DIRP[x.dir][0],DIRP[x.dir][1]):'<span class="muted">Not rated</span>'}]}))}</div>`}
function openCmp(id){const it=cmpItems(SW.cmp)||[];const x=it.find(y=>y.id===id);if(!x)return;
 openDrawer(`<span class="eyebrow">${esc(KINDL[x.kind])} · ${esc(x.cat)}</span><h2 style="font-size:24px;margin:8px 0">§${esc(x.l.ref)} ${esc(TYP[x.l.type][0])}</h2><div class="dfullgrid"><section class="card glass"><div class="cardhead"><h3>Vendor proposal</h3>${x.p?mPill(x.p.m):""}</div>${x.p?`<blockquote class="sow-quote">${esc(x.p.src)}</blockquote><dl class="kv"><dt>Value</dt><dd>${esc(x.p.norm)}</dd><dt>Date</dt><dd>${x.p.due?fdt(x.p.due):"None"}</dd></dl>`:'<p class="muted">Not in the proposal.</p>'}</section><section class="card glass"><div class="cardhead"><h3>Executed contract</h3>${x.c?mPill(x.c.m):""}</div>${x.c?`<blockquote class="sow-quote">${esc(x.c.src)}</blockquote><dl class="kv"><dt>Value</dt><dd>${esc(x.c.norm)}</dd><dt>Date</dt><dd>${x.c.due?fdt(x.c.due):"None"}</dd></dl>`:'<p class="muted">Not in the contract.</p>'}</section></div>
 ${x.p&&x.c?`<section class="card glass" style="margin-top:14px"><div class="cardhead"><h3>Redline from proposal to contract</h3></div><p class="sow-rl">${redlineHTML(x.p.src,x.c.src)}</p><p class="muted small"><del class="sow-del">Struck through</del> was in the proposal. <ins class="sow-ins">Underlined</ins> is new in the contract.</p></section>`:""}
 <div class="row" style="margin-top:14px"><button class="btn primary" data-sow-newcr="${SW.cmp}" data-sow-cr-key="${esc(x.key)}">Request a change</button>${x.c?`<button class="btn" data-sow-open1="${x.c.id}">Open the contract line</button>`:""}</div>`)}
/* ---------- change control ---------- */
const crDraft=cr=>{const c=ctOf(cr.ct)||{},n=(c.amend||[]).length+1,t=cr.type;const hd=`CHANGE ORDER ${cr.id} / AMENDMENT ${n}\nAgreement: ${c.title||cr.ct} (${cr.ct}) between Atlantic Systems and ${c.vendor||"the vendor"}.\nEffective: on signature by both parties.\n\n`;
 const ft="\n\nExcept as stated in this change order, all terms of the Agreement stay in force. This change order is not effective until signed by both parties (Section: change control).";
 if(t==="Schedule change")return hd+`1. Schedule. The date for ${cr.title.replace(/ slips.*/,"")} is changed from ${cr.oldv} to ${cr.newv}. Dependent dates move only as listed in Exhibit 1.\n2. Fees. No change to fees, and no additional charge arises from this date change.\n3. Acceptance. The review period of 10 business days starts on delivery of the revised milestone.`+ft;
 if(t==="Price or rate change")return hd+`1. Fees. The total fee changes from ${cr.oldv} to ${cr.newv}, a ${S$(cr.amt)} change, for the work described in: ${cr.title}.\n2. Payment. The additional amount is invoiced after Atlantic Systems' written acceptance of the related deliverable and is payable within 45 days.\n3. Rates. Rates not mentioned here stay fixed for the term.`+ft;
 if(t==="Scope or project change")return hd+`1. Scope. The Agreement is amended to include: ${cr.title}.\n2. Fees. ${cr.amt?"The fee increases by "+D$(cr.amt)+".":"No change to fees."}\n3. Acceptance. Deliverables added here follow the acceptance criteria and the 10 business day review period in the Agreement.`+ft;
 if(t==="Assumption change")return hd+`1. Assumption. The assumption "${cr.oldv}" is replaced with "${cr.newv}".\n2. Effect. The change does not extend any date or add any fee. If it puts a milestone at risk, the vendor raises a change request within 5 business days.`+ft;
 if(t==="SLA change")return hd+`1. Service levels. The service level schedule is amended to: ${cr.newv}. Previously: ${cr.oldv}.\n2. Credits. Service credits apply from the first full month after signature and are not the exclusive remedy.\n3. Reporting. The vendor reports the measure monthly with the service report.`+ft;
 return hd+`1. Term. ${cr.oldv} is changed to: ${cr.newv}.\n2. Notice. This change order serves as written notice under the renewal and termination section where that applies.\n3. Transition. The vendor returns or exports Atlantic Systems data within 30 days after the end date.`+ft};
function schedImpact(cr){const c=ctOf(cr.ct);if(!c||!cr.task||!cr.days||typeof cpm==="undefined")return null;const t=TASKS.find(x=>x.id===cr.task);if(!t)return null;const f=(m)=>cpm(x=>Math.max(x.ms?0:1,x.dur+(m&&x.id===cr.task?cr.days:0)));const b=f(false),m=f(true);
 const tasks=TASKS.filter(x=>m.R[x.id].ef!==b.R[x.id].ef).map(x=>({id:x.id,p:x.p,n:x.n,b:fmtD(b.R[x.id].ef),a:fmtD(m.R[x.id].ef),d:m.R[x.id].ef-b.R[x.id].ef}));
 const pj=[...new Set(tasks.map(x=>x.p))].map(p=>({p:p,fb:fmtD(b.pe[p],1),fa:fmtD(m.pe[p],1),d:m.pe[p]-b.pe[p]}));return {tasks:tasks,pj:pj,task:t}}
function crImpact(cr){const c=ctOf(cr.ct)||{},sc=schedImpact(cr),inv=genInv(c||{inv:[]}).filter(r=>r.st!=="paid"),pj=PROJ.find(p=>p.id===c.proj);
 const invMoves=cr.days&&sc?inv.filter(r=>r.ms&&String(cr.key).replace("ms","")==String(r.ms)).map(r=>({n:r.n,from:r.due,to:addD(r.due,Math.round(cr.days*1.4))})):[];
 const rem=pj?pj.bac-pj.paid:null,after=rem!=null?rem-cr.amt/1000:null;
 const sla=lines_(cr.ct,bestDoc(cr.ct)||"proposal").filter(l=>(cr.type==="SLA change"&&(l.type==="sla"||l.type==="kpi"))||(cr.type==="Schedule change"&&l.type==="sla")).slice(0,4);
 const raid=(window.PPMRAID&&c.proj?window.PPMRAID.filter(r=>r.p===c.proj&&(ovl(r.n+" "+r.d,cr.title+" "+cr.reason)>0||r.task===cr.task)):[]).slice(0,3);
 return {sc:sc,invMoves:invMoves,pj:pj,rem:rem,after:after,sla:sla,raid:raid,chain:chainFor(cr.amt),tier:tierOf(cr.amt)}}
function crCard(x){const c=ctOf(x.ct)||{};const t=tierOf(x.amt);return `<div class="sow-crc" data-dnd-id="${x.id}" tabindex="0" data-sow-cr="${x.id}" role="button" aria-label="${esc(x.id+" "+x.title)}">${grip}<div class="sow-crb"><div class="row sp"><b>${esc(x.id)}</b><span class="pill mute" style="border-left:3px solid var(${CRC[x.type]||"--story-f"})">${esc(x.type)}</span></div><span class="sow-crt">${esc(x.title)}</span><small class="muted">${esc(ctShort(x.ct))}</small><div class="row sp small"><span class="num">${x.amt?S$(x.amt):"No price change"}</span><span class="muted">${x.days?(x.days>0?"+":"")+x.days+" work days":""}</span></div><div class="row small">${pc(x.req)}<span class="muted">${esc(t.role)}</span></div></div></div>`}
function tabChanges(){const crs=CRALL(),open=crs.filter(x=>x.st!=="Approved"),pend=open.filter(x=>x.st==="Approval"),val=sum(open,x=>x.amt),ap=crs.filter(x=>x.st==="Approved"),c=ctOf(SW.ct)||CT0[1];
 const bt=CRT.map(t=>({l:t,v:crs.filter(x=>x.type===t).length,c:CRC[t]}));
 const lim=SCALE.on?10:99;
 const board=`<div class="sow-kb">${STAGES.map(s=>{const L=crs.filter(x=>x.st===s).sort((a,b)=>Math.abs(b.amt)-Math.abs(a.amt)),sh=SW.more[s]?L:L.slice(0,lim);return `<section class="sow-kc glass" aria-label="${s}"><div class="row sp"><b>${s}</b><span class="pill mute">${L.length}</span></div><div class="sow-kl" data-dnd="${s}" data-dnd-scope="sow_cr">${sh.map(crCard).join("")||'<span class="muted small sow-ke">Drop a request here</span>'}</div>${L.length>sh.length?`<button class="btn quiet" data-sow-more="${s}">Show ${L.length-sh.length} more</button>`:""}</section>`}).join("")}</div>`;
 const hist=`<div class="sow-walk">${(c.prop?[["Vendor proposal "+c.prop.ver,c.prop.date,c.prop.value]]:[]).concat(c.exe?[["Executed contract",c.exe.date,c.value-(c.amend||[]).reduce((a,x)=>a+x.delta,0)]]:[],(c.amend||[]).map(a=>["Amendment "+a.id+": "+a.title,a.date,a.delta])).map((r,i)=>`<div class="sow-wk"><span><b>${esc(r[0])}</b><small>${fdt(r[1])}</small></span><span class="num">${i>0&&/Amendment/.test(r[0])?S$(r[2]):D$(r[2])}</span></div>`).join("")}<div class="sow-wk"><span><b>Current</b><small>${esc(c.exe?c.exe.ver:"Not signed")}</small></span><span class="num">${D$(c.value)}</span></div></div>`;
 return `<div class="sow-tab"><div class="statrow">${stat("Open change requests",open.length,pend.length+" waiting for approval")}${stat("Net value of open changes",S$(val),"price effect if all are approved")}${stat("Applied this quarter",ap.length,ap.filter(x=>x.applied).length+" amendments stored")}${stat("Schedule days at stake",sum(open,x=>x.days||0),"work days across open requests")}${stat("Your approval limit",D$(100000),"CIO tier T3, delegation of authority")}</div>
 <div class="row sow-mrow">${stdChip("coso","Approver is chosen by the amount of the change under the delegation of authority. Legal reviews any change to terms.")}${analyzerChip(.86,"Drafts the change order language and computes the impact on the schedule, invoice plan, budget, service levels and risks. It cannot approve.")}<button class="btn primary" data-sow-newcr>Request a change</button></div>
 <div class="grid g2 sow-g2">${card("Change requests by type","How contracts are being changed.",hbars(bt))}${card("Version history: "+esc(ctShort(c.id)),"Proposal, executed contract and every amendment, with the price after each. Choose another contract to see its history.",ctBar(0)+hist)}</div>
 ${card("Status board","Drag a request to the next stage. A request cannot reach Approved without impact review, legal review for term changes, and an approver at the right tier.",board+legend([["Border color on the type chip shows the change type, named on each card","--story-f"]]))}
 ${card("All change requests",crs.length+" requests",btHTML({id:"sow_crl",h:380,rowH:46,key:"id",exportName:"change-requests",facets:["type","st","ct"],open:id=>openCR(id),rows:()=>CRALL(),cols:[{k:"id",label:"ID"},{k:"title",label:"Request",wrap:1,fmt:r=>`<b>${esc(r.title)}</b>`},{k:"ct",label:"Contract",val:r=>ctShort(r.ct),fmt:r=>esc(String(ctShort(r.ct)))},{k:"type",label:"Type"},{k:"st",label:"Stage",fmt:r=>sPill(r.st,r.st==="Approved"?"good":r.st==="Approval"?"warn":"info")},{k:"amt",label:"Price effect",cls:"num",val:r=>r.amt,fmt:r=>r.amt?S$(r.amt):"None"},{k:"days",label:"Days",cls:"num",val:r=>r.days||0},{k:"ap",label:"Approver",val:r=>tierOf(r.amt).role,fmt:r=>esc(String(tierOf(r.amt).role))},{k:"req",label:"Requested by"}]}))}
 ${card("Audit trail","Who did what to contracts and changes. Every approval and application is recorded.",`<div class="tscroll"><table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Contract</th><th>Detail</th></tr></thead><tbody>${AUD.slice(0,14).map(a=>`<tr><td class="tabular">${esc(a.at)}</td><td>${esc(a.who)}</td><td>${esc(a.act)}</td><td>${esc(a.ct||"")}</td><td style="white-space:normal;min-width:260px">${esc(a.d)}</td></tr>`).join("")}</tbody></table></div>`)}</div>`}
function openCR(id){const x=CRALL().find(y=>y.id===id);if(!x)return;const c=ctOf(x.ct)||{},im=crImpact(x),pjn=im.pj?im.pj.short||im.pj.n:"";x.imp=x.imp||x.st!=="Requested";
 const ap=x.ap=x.ap||{};
 openDrawer(`<div class="row"><span class="pill mute" style="border-left:3px solid var(${CRC[x.type]||"--story-f"})">${esc(x.type)}</span>${sPill(x.st,x.st==="Approved"?"good":"info")}${x.applied?sPill("Applied to the register","good"):""}</div><h2 style="font-size:25px;margin:8px 0">${esc(x.id)} · ${esc(x.title)}</h2><p class="story" data-role="story">${esc(x.reason)}</p>
 <div class="dfullgrid"><section class="card glass"><div class="cardhead"><h3>The request</h3></div><dl class="kv"><dt>Contract</dt><dd><button class="btn quiet" data-sow-open="${x.ct}:2">${esc(ctShort(x.ct))}</button></dd><dt>From</dt><dd>${esc(x.oldv)}</dd><dt>To</dt><dd><b>${esc(x.newv)}</b></dd><dt>Price effect</dt><dd class="num">${x.amt?S$(x.amt):"None"}</dd><dt>Schedule effect</dt><dd>${x.days?(x.days>0?"+":"")+x.days+" work days":"None"}</dd><dt>Requested by</dt><dd>${pc(x.req)} on ${fdt(x.at)}</dd></dl></section>
 <section class="card glass"><div class="cardhead"><h3>Approvers</h3>${why("Who signs","The approver is the delegation of authority tier for the size of the price change. Legal reviews any change to terms. Finance reviews anything above $10,000.")}</div><div class="sow-chain">${im.chain.map((s,i)=>{const done=x.st==="Approved"||ap[s.r];return `<div class="sow-ch ${done?"done":""}"><i aria-hidden="true">${done?"✓":i+1}</i><span><b>${esc(s.r)}</b>${s.who?` ${pc(s.who)}`:""}<small class="muted">${esc(s.why)}</small></span>${!done&&x.st!=="Approved"&&(s.r===LEGAL||s.r==="Controller"||s.r==="Contract owner")?`<button class="btn quiet" data-sow-sign="${x.id}:${esc(s.r)}">Record</button>`:""}</div>`}).join("")}</div></section></div>
 <section class="card glass" style="margin-top:14px"><div class="cardhead"><div><h3>Impact analysis</h3><span class="muted small">What this change does to the plan, the money and the risks.</span></div>${analyzerChip(.84,"Schedule impact recomputed with the critical path method on the linked project. Other impacts come from the invoice plan, budget, SLA lines and RAID log.")}</div><div class="dfullgrid">
 <div><div class="eyebrow">Project schedule (WBS)</div>${im.sc?`<p class="story">${im.sc.pj.map(p=>`<b>${esc(p.p)}</b> finish moves from ${p.fb} to ${p.fa} (${p.d>0?"+":""}${p.d} work days)`).join(". ")||"No finish date moves"}.</p><div class="sow-walk">${im.sc.tasks.slice(0,6).map(t=>`<div class="sow-wk"><span><b>${esc(t.n)}</b><small>${esc(t.p)}</small></span><span class="num">${t.b} <i aria-hidden="true">→</i> ${t.a}</span></div>`).join("")}</div>`:`<p class="muted">${x.days?"The linked task was not found.":"No schedule effect."}</p>`}</div>
 <div><div class="eyebrow">Invoice schedule</div>${im.invMoves.length?im.invMoves.map(r=>`<p class="small">${esc(r.n)}: due ${fdt(r.from,1)} moves to ${fdt(r.to,1)}</p>`).join(""):x.amt?`<p class="small">${x.amt>0?"A new payment of "+D$(x.amt)+" is added after written acceptance.":"Scheduled payments fall by "+D$(-x.amt)+"."}</p>`:'<p class="muted">No payment changes.</p>'}</div>
 <div><div class="eyebrow">Budget</div>${im.pj?`<p class="small">${esc(pjn)} has ${K$(im.rem)} left of ${K$(im.pj.bac)}. ${x.amt>0?"After this change "+(im.after<0?`<b>it is ${K$(-im.after)} short</b>, so a reserve draw is needed (tier ${im.tier.id}).`:`${K$(im.after)} remains.`):"No budget effect."}</p>`:`<p class="small">${x.amt?"Run budget "+esc(c.line||"line")+" changes by "+S$(x.amt)+" a contract life.":"No budget effect."}</p>`}</div>
 <div><div class="eyebrow">Service levels and risks</div>${im.sla.length?`<p class="small">Touches ${im.sla.map(l=>esc(l.measure||l.type)).join(", ")}.</p>`:'<p class="small muted">No service level lines touched.</p>'}${im.raid.map(r=>`<p class="small"><b>${esc(r.id)}</b> ${esc(r.n)}</p>`).join("")}${window.openImpact&&c.svc?`<button class="btn quiet" data-sow-svcimp="${x.id}">Service impact: ${esc(c.svc)}</button>`:""}</div></div></section>
 <section class="card glass" style="margin-top:14px"><div class="cardhead"><div><h3>Drafted change order language</h3><span class="muted small">For legal review. Not sent to the vendor.</span></div>${analyzerChip(.82,"Drafted from the change type and the old and new values using Atlantic Systems' change order template. Legal edits and approves.")}</div><pre class="sow-pre sow-co">${esc(crDraft(x))}</pre></section>
 <section class="card glass" style="margin-top:14px"><div class="cardhead"><h3>Discussion</h3></div><div class="sow-thread">${x.thread.map(t=>`<div class="sow-cm">${pc(t.who)}<p>${esc(t.t)}</p><small class="muted">${esc(t.at)}</small></div>`).join("")||'<p class="muted small">No comments yet.</p>'}</div><div class="row"><input class="fin" id="sow_cmt" placeholder="Add a comment" aria-label="Comment"><button class="btn" data-sow-cmtcr="${x.id}">Post</button></div></section>
 ${x.st!=="Approved"?`<div class="row" style="margin-top:14px"><button class="btn" data-sow-impact="${x.id}">Mark impact reviewed</button><button class="btn primary" data-sow-approve="${x.id}">Approve and apply</button><button class="btn danger" data-sow-reject="${x.id}">Reject</button></div><p class="muted small">Approving updates the contract value or dates, the line register and the linked schedule. ${im.tier.max<100000||im.tier.id==="T3"?"You can approve this one as CIO.":"This is above your limit, so approval is recorded as a request to the "+im.tier.role+"."}</p>`:""}`);audit("opened change request",x.id)}
/* ---------- tab 7: obligations and calendar ---------- */
const obDays=o=>difD(o.due,TDY);
const obSt=o=>o.st==="done"?"done":(o.st==="late"||(o.st==="open"&&o.due<TDY))?"late":o.st==="risk"?"risk":"open";
const obLbl={done:["Done","good"],late:["Overdue","bad"],risk:["At risk","warn"],open:["Open","mute"]};
function weekChart(){const ob=OBLS().filter(o=>o.st!=="done"),B=[{l:"Overdue",o:0,r:0,l2:0}];for(let i=0;i<12;i++)B.push({l:"Wk "+(i+1),o:0,r:0,l2:0});
 ob.forEach(o=>{const d=obDays(o);const i=d<0?0:Math.floor(d/7)+1;if(i>12)return;const s=obSt(o);if(s==="late")B[i].l2++;else if(s==="risk")B[i].r++;else B[i].o++});
 const W=760,H=220,L=36,R=10,T=14,Bt=34,mx=Math.max(3,...B.map(b=>b.o+b.r+b.l2))*1.15,bw=(W-L-R)/B.length,y=v=>T+(H-T-Bt)*(1-v/mx);let g="";
 for(let i=0;i<=3;i++){const v=mx*i/3;g+=`<line class="grid-l" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L-6}" y="${y(v)+4}" text-anchor="end">${Math.round(v)}</text>`}
 B.forEach((b,i)=>{const x=L+i*bw+bw*.18,w=bw*.64;let acc=0;[["l2","--bad-f","Overdue"],["r","--warn-f","At risk"],["o","--story-f","On track"]].forEach(([k,c,n])=>{if(!b[k])return;const h=(H-T-Bt)*b[k]/mx;g+=`<rect x="${x}" y="${y(acc+b[k])}" width="${w}" height="${h}" rx="3" style="fill:var(${c})"><title>${b.l}: ${b[k]} ${n}</title></rect>`;acc+=b[k]});g+=`<text class="ax" x="${x+w/2}" y="${H-12}" text-anchor="middle">${b.l}</text>`;if(acc)g+=`<text class="ax" x="${x+w/2}" y="${y(acc)-4}" text-anchor="middle" style="font-weight:700">${acc}</text>`});
 return `<svg viewBox="0 0 ${W} ${H}" class="sow-chart" role="img" aria-label="Open obligations by week">${g}</svg>${legend([["Overdue","--bad-f"],["At risk","--warn-f"],["On track","--story-f"]])}`}
function tabObl(){const ob=OBLS(),op=ob.filter(o=>o.st!=="done"),od=op.filter(o=>obSt(o)==="late"),rk=op.filter(o=>obSt(o)==="risk"),d30=op.filter(o=>obDays(o)>=0&&obDays(o)<=30),v=syncMetrics();
 const cs=CTS().filter(live),ren=cs.filter(c=>rdate(c)&&difD(rdate(c),TDY)<=120&&difD(rdate(c),TDY)>=-30),tr=cs.filter(isTrap);const base=CT0;const unacc=[];base.forEach(c=>genInv(c).forEach((r,i)=>{if((r.st==="paid"&&!r.acc)||r.st==="held"&&!r.acc)unacc.push({c:c,r:r,i:i})}));const paidNo=sum(unacc.filter(x=>x.r.st==="paid"),x=>x.r.amt),holdAmt=sum(unacc.filter(x=>x.r.st==="held"),x=>x.r.amt);
 const grp=[["Overdue",o=>obSt(o)==="late"],["Next 7 days",o=>obSt(o)!=="late"&&obDays(o)>=0&&obDays(o)<=7],["8 to 30 days",o=>obSt(o)!=="late"&&obDays(o)>7&&obDays(o)<=30],["31 to 90 days",o=>obSt(o)!=="late"&&obDays(o)>30&&obDays(o)<=90],["Later",o=>obSt(o)!=="late"&&obDays(o)>90]];
 const ag=lrHTML({id:"sow_ag",limit:6,groups:grp.map((g,i)=>({key:"a"+i,label:g[0],rows:op.filter(g[1]).sort((a,b)=>a.due<b.due?-1:1).map(o=>({id:o.id,t:o.t,sub:ctShort(o.ct)+" · "+o.who,tag:fdt(o.due,1),st:obSt(o)==="late"?"bad":obSt(o)==="risk"?"warn":"info",go:()=>openOb(o.id)}))}))});
 const c=ctOf(SW.ct)||CT0[1];
 return `<div class="sow-tab"><div class="statrow">${stat("Due in 30 days",d30.length,od.length+" overdue, "+rk.length+" at risk",od.length?"crit":"")}${stat("Obligation on-time rate",v.ot+"%","completed by the due date")}${stat("Renewal decisions in 120 days",ren.length,tr.length+" are auto-renew traps",tr.length?"crit":"")}${stat("Paid without acceptance",D$(paidNo),D$(holdAmt)+" held until accepted",paidNo?"crit":"")}${stat("Unclaimed service credits",D$(sum(base,x=>x.credit?x.credit.owed-x.credit.claimed:0)),"owed by vendors, not yet claimed")}</div>
 <div class="row sow-mrow">${fchip("m_sow_ontime")}${fchip("m_sow_leak")}${fchip("m_sow_trap")}${analyzerChip(.9,"Obligations come from the dates and owners found in each analyzed line. The agent reminds owners and holds invoices that lack acceptance.")}</div>
 <div class="grid g2 sow-g2">${card("Obligations by week","Open obligations from both sides. Overdue are on the left.",weekChart())}${card("Agenda","Open obligations by how soon they fall due. Select one to act on it.",ag)}</div>
 ${card("Renewal notice windows","Contracts whose decision date falls within a year. Auto-renewal contracts show the last day to send notice. A trap means the notice date is inside 120 days.",btHTML({id:"sow_ren",h:360,rowH:46,key:"id",exportName:"renewals",facets:["win","auto"],open:id=>openCT(id),rows:()=>CTS().filter(c=>live(c)&&rdate(c)&&difD(rdate(c),TDY)<=365),cols:[{k:"title",label:"Contract",wrap:1,fmt:r=>`<b>${esc(r.title)}</b>`},{k:"vendor",label:"Vendor"},{k:"end",label:"Ends",val:r=>r.end,fmt:r=>fdt(r.end)},{k:"notice",label:"Notice days",cls:"num",val:r=>r.auto?r.notice:0,fmt:r=>r.auto?r.notice:"None"},{k:"rd",label:"Decide by",val:r=>rdate(r),fmt:r=>`<b>${fdt(rdate(r))}</b>`},{k:"dl",label:"Days left",cls:"num",val:r=>difD(rdate(r),TDY)},{k:"auto",label:"Renews by",val:r=>r.auto?"Auto-renews":"Written order",fmt:r=>isTrap(r)?sPill("Auto-renew trap","bad"):r.auto?sPill("Auto-renews","warn"):sPill("Written order","mute")},{k:"win",label:"Window",val:r=>rwin(r),fmt:r=>esc(String(rwin(r)))},{k:"annv",label:"Annual value",cls:"num",val:r=>r.ann||r.value,fmt:r=>D$(r.ann||r.value)}]}))}
 ${card("Invoice schedule against accepted work","Payments should follow acceptance. Rows below are paid ahead of acceptance or held waiting for it. Recording acceptance releases a held payment for approval.",`<div class="tscroll"><table><thead><tr><th>Contract</th><th>Payment</th><th>Due</th><th>Amount</th><th>State</th><th></th></tr></thead><tbody>${unacc.map(x=>`<tr><td style="white-space:normal;min-width:180px"><b>${esc(ctShort(x.c.id))}</b></td><td style="white-space:normal;min-width:220px">${esc(x.r.n)}</td><td>${fdt(x.r.due,1)}</td><td class="num">${D$(x.r.amt)}</td><td>${x.r.st==="paid"?sPill("Paid, not accepted","bad"):sPill("Held, no acceptance","warn")}</td><td>${x.r.st==="held"?`<button class="btn" data-sow-accinv="${x.c.id}:${x.i}">Record acceptance</button>`:`<button class="btn" data-sow-offset="${x.c.id}:${x.i}">Offset on next payment</button>`}</td></tr>`).join("")||`<tr><td colspan="6" class="muted">Every payment is backed by accepted work.</td></tr>`}</tbody></table></div>${CT0.filter(x=>x.credit&&x.credit.owed>x.credit.claimed).map(x=>`<div class="need" style="grid-template-columns:auto 1fr auto;margin-top:12px"><div class="ico warn">${ico("warn")}</div><div><b>${D$(x.credit.owed-x.credit.claimed)} service credit owed by ${esc(x.vendor)}</b><span class="muted">Availability fell below target. Claim it on the next invoice.</span></div><div class="act"><button class="btn primary" data-sow-claim="${x.id}">Claim the credit</button></div></div>`).join("")}`)}
 ${card("Obligation register",op.length.toLocaleString("en-US")+" open of "+ob.length.toLocaleString("en-US")+" obligations, ours and the vendor's.",btHTML({id:"sow_ob",h:400,rowH:46,key:"id",exportName:"obligations",facets:["party","kind","state","ct"],open:id=>openOb(id),rows:()=>OBLS(),cols:[{k:"id",label:"ID"},{k:"t",label:"Obligation",wrap:1,fmt:r=>`<b>${esc(r.t)}</b>`},{k:"ct",label:"Contract",val:r=>ctShort(r.ct),fmt:r=>esc(String(ctShort(r.ct)))},{k:"party",label:"Party"},{k:"who",label:"Owner",wrap:1},{k:"kind",label:"Kind"},{k:"due",label:"Due",val:r=>r.due,fmt:r=>fdt(r.due)},{k:"dd",label:"Days",cls:"num",val:r=>obDays(r),fmt:r=>r.st==="done"?"":obDays(r)},{k:"state",label:"State",val:r=>obLbl[obSt(r)][0],fmt:r=>sPill(obLbl[obSt(r)][0],obLbl[obSt(r)][1])}]}),`<div class="row"><button class="btn" data-sow-newob>Add an obligation</button></div>`)}
 ${card("Turn this contract into work","For "+esc(ctShort(c.id))+". These actions use the Projects and WBS modules when they are loaded.",`<div class="row sow-mrow"><button class="btn" data-sow-pick>Change contract</button></div><div class="grid g3 sow-g3"><div class="mini glass"><b>Create a project from the contract</b><span class="muted small">${c.proj?"Already linked to "+esc(c.proj)+".":"Creates a project with kickoff, work and milestones from the dated lines."}</span><button class="btn primary" data-sow-mkproj="${c.id}">Create project</button></div><div class="mini glass"><b>Send milestones to the WBS</b><span class="muted small">${lines_(c.id,bestDoc(c.id)||"proposal").filter(l=>l.type==="milestone").length} milestone lines${c.proj?" go to "+esc(c.proj):", needs a project first"}.</span><button class="btn" data-sow-towbs="${c.id}">Send milestones</button></div><div class="mini glass"><b>Raise a demand request</b><span class="muted small">Adds the vendor work to the demand queue with cost and reason.</span><button class="btn" data-sow-demand="${c.id}">Create demand</button></div></div>`)}</div>`}
function openOb(id){const o=OBLS().find(x=>x.id===id);if(!o)return;const s=obSt(o);
 openDrawer(`<div class="row">${sPill(obLbl[s][0],obLbl[s][1])}${sPill(o.party,"mute")}${sPill(o.kind,"info")}</div><h2 style="font-size:24px;margin:10px 0">${esc(o.t)}</h2><dl class="kv"><dt>Contract</dt><dd><button class="btn quiet" data-sow-open="${o.ct}:2">${esc(ctShort(o.ct))}</button></dd><dt>Owner</dt><dd>${pc(o.who)}</dd><dt>Due</dt><dd>${fdt(o.due)} ${o.st!=="done"?`<span class="muted">(${obDays(o)<0?-obDays(o)+" days overdue":obDays(o)+" days away"})</span>`:`<span class="muted">completed ${fdt(o.dn)}</span>`}</dd><dt>Watched by</dt><dd>${pc("Contract Analyst Agent")} ${kindPill("ai")}</dd></dl>
 ${o.st!=="done"?`<div class="row"><button class="btn primary" data-sow-obdone="${o.id}">${o.kind==="Review or acceptance"?"Record acceptance":"Mark done"}</button><button class="btn" data-sow-obnudge="${o.id}">Send a reminder</button>${o.kind==="Renewal notice"?`<button class="btn" data-sow-newcr="${o.ct}">Raise change request</button>`:""}</div>`:""}`)}
/* ---------- actions ---------- */
const ME="Casey Rowan";
const addWD=(iso,n)=>{try{return dateOf(wdOf(iso)+n).toISOString().slice(0,10)}catch(e){return addD(iso,Math.round(n*1.4))}};
function mkReview(l,route,part,due,msg){let r=REV.find(x=>x.line===l.id);if(!r){r={id:"RV-"+(201+REV.length),ct:l.ct,line:l.id,route:route,st:"Open",due:due,part:part,opened:TDY,thread:[]};REV.push(r)}else{r.route=route;r.due=due;r.part=part;if(r.st==="Agreed")r.st="Open"}
 if(msg)r.thread.push({who:ME,t:msg,at:window.U.fmtDate(window.U.todayDate())});l.route=route;if(l.status==="proposed")l.status="negotiating";l.by=(route==="legal"?"Sent to Atlantic Legal":"Shared review opened")+" by "+ME;aud(ME,route==="legal"?"Sent line to legal":"Opened shared review",l.ct,r.id+" for §"+l.ref+", due "+fdt(due,1)+".");return r}
function setRoute(l,route){if(route==="ai"){l.route="ai";l.by="AI picked our "+((PBN[l.pb]||NTN[l.pb]||{}).n||"standard")+(l.m==="var"&&l.fb?" fallback":" language")+"; a person confirms before it is sent";if(l.m!=="std"&&l.status==="proposed")l.status="negotiating";aud("Contract Analyst Agent","Picked standard language",l.ct,"§"+l.ref+": "+l.by);toast("AI selected our language. A person confirms before it goes to the vendor.","info");render();openLine(l.id)}
 else if(route==="legal"){mkReview(l,"legal",[LEGAL,(ctOf(l.ct)||{}).owner||ME],addWD(TDY,5));toast("Sent to Atlantic Legal. Deadline "+fdt(addWD(TDY,5),1)+".","good");render();openLine(l.id)}
 else sharedForm(l)}
function sharedForm(l){const c=ctOf(l.ct)||{},part=[...new Set([LEGAL,c.vOwner,c.owner,"Rina Okafor","Avery Chen","Maya Ortiz"].filter(Boolean))];
 openForm({id:"sow_review",title:"Open a shared review",story:"Puts the vendor, legal and the business owner in one thread on this line, with a deadline. Everyone sees the same redline. Nothing is agreed until legal approves and a person confirms.",submit:"Open shared review",fields:[{k:"part",label:"Who takes part",type:"multi",opts:part,req:true},{k:"due",label:"Reply by",type:"date",req:true,help:"Reviews with no reply by this date are escalated to the CIO."},{k:"msg",label:"Opening message",type:"longtext",wide:true,ai:{label:"Draft",fn:v=>"Our standard for "+((PBN[l.pb]||NTN[l.pb]||{}).n||"this clause").toLowerCase()+" is shown in the redline. Can the vendor agree, or what would make it work? Legal will respond within three business days."}}],defaults:{part:[LEGAL,c.owner],due:addWD(TDY,7),msg:""},
  live:v=>`<p class="story">${(v.part||[]).length} people. The thread opens on §${esc(l.ref)} and ${v.due?"closes "+fdt(v.due):"has no deadline yet"}.</p>`,onSubmit:v=>{mkReview(l,"shared",v.part,v.due,v.msg);render();return {toast:"Shared review opened. "+v.part.length+" people notified.",audit:l.id}}})}
function acceptLine(l){if(lineGuard(l)){toast("High risk exception. Atlantic Legal must approve it before it can be accepted.","warn");if(!l.route)setRoute(l,"legal");return}
 l.status="accepted";l.by=ME+" confirmed";aud(ME,"Accepted line",l.ct,"§"+l.ref+" "+(PBN[l.pb]||NTN[l.pb]||{n:TYP[l.type][0]}).n);toast("Line accepted","good");render();if(findLine(l.id))openLine(l.id)}
function legalOK(l){l.lg=true;l.status=l.status==="proposed"?"accepted":l.status;l.by="Atlantic Legal approved";const r=REV.find(x=>x.line===l.id);if(r)r.thread.push({who:LEGAL,t:"Approved the position for this line.",at:window.U.fmtDate(window.U.todayDate())});aud(LEGAL,"Approved exception",l.ct,"§"+l.ref);toast("Legal approval recorded","good");render();openLine(l.id)}
function agreeLine(l){if(lineGuard(l)){toast("A high risk line needs legal approval before it is agreed.","warn");return}l.status="agreed";l.by="Both parties agreed";const r=REV.find(x=>x.line===l.id);if(r)r.st="Agreed";aud(ME,"Marked agreed",l.ct,"§"+l.ref);toast("Marked agreed","good");render();openLine(l.id)}
function batch(kind){const a=curAn();if(!a)return;let n=0;a.lines.forEach(l=>{if(kind==="std"&&l.m==="std"&&l.status==="proposed"){l.status="accepted";l.by=ME+" confirmed standard lines";n++}else if(kind==="fb"&&l.m==="var"&&l.fb&&!l.route){l.route="ai";l.status="negotiating";l.by="AI picked our fallback; a person confirms";n++}else if(kind==="legal"&&l.m!=="std"&&l.risk==="High"&&!l.route){mkReview(l,"legal",[LEGAL,(ctOf(l.ct)||{}).owner||ME],addWD(TDY,5));n++}});
 aud(ME,"Bulk "+({std:"confirmed standard lines",fb:"picked fallbacks",legal:"sent high risk lines to legal"})[kind],a.ct,n+" lines.");toast(n+" lines updated","good");render()}
function editLineForm(l){const people=DIR.filter(d=>!d.generated).map(d=>[d.name,d.name+" ("+KINDS[d.kind]+")"]);if(!people.some(p=>p[0]===l.owner))people.unshift([l.owner,l.owner]);
 openForm({id:"sow_line",title:"Edit line §"+l.ref,story:"Correct anything the AI got wrong. Corrections are recorded and improve the next analysis.",submit:"Save line",fields:[{k:"owner",label:"Owner (person, AI agent, contractor or provider)",type:"select",opts:people,req:true},{k:"due",label:"Due date",type:"date"},{k:"measure",label:"Measure",type:"text"},{k:"target",label:"Target",type:"text"},{k:"norm",label:"Normalized value",type:"text",wide:true},{k:"type",label:"Line type",type:"select",opts:Object.keys(TYP).map(k=>[k,TYP[k][0]])}],defaults:{owner:l.owner,due:l.due,measure:l.measure,target:l.target,norm:l.norm,type:l.type},
  onSubmit:v=>{Object.assign(l,{owner:v.owner,due:v.due,measure:v.measure,target:v.target,norm:v.norm,type:v.type});l.by=ME+" corrected";l.conf=Math.min(.99,l.conf+.03);aud(ME,"Edited line",l.ct,"§"+l.ref);render();return {toast:"Line updated",audit:l.id}}})}
function clauseForm(id,from){const p=id?PBN[id]:null,l=from?findLine(from):null,nt=l?NTN[l.pb]:null;
 openForm({id:"sow_clause",title:p?"Edit clause "+p.n:"New playbook clause",story:"Legal owns the playbook. A new clause is matched against every analyzed line, so lines that were 'new' immediately become standard or variance. Changes are versioned.",submit:p?"Save new version":"Add to the playbook",fields:[{k:"n",label:"Clause name",type:"text",req:true,wide:true},{k:"cat",label:"Category",type:"select",opts:["Commercial","Legal","Data and security","Intellectual property","Service levels","Delivery"],req:true},{k:"risk",label:"Risk if it goes wrong",type:"chips",opts:["Low","Medium","High"],req:true},{k:"std",label:"Approved language",type:"longtext",req:true,wide:true,ai:{label:"Draft with AI",fn:v=>nt?nt.draft:"The supplier will "+(v.n||"comply with this clause").toLowerCase()+" in the manner stated in the agreement, and Atlantic Systems may require evidence of compliance on request."}},{k:"fb",label:"Fallback position",type:"longtext",wide:true,help:"What we can concede without legal, in order."},{k:"kw",label:"Words that find this clause",type:"text",wide:true,help:"Comma separated. Lines containing any of these words are compared with the approved language."}],
  defaults:p?{n:p.n,cat:p.cat,risk:p.risk,std:p.std,fb:p.fb,kw:p.kw}:nt?{n:nt.n,cat:nt.cat,risk:nt.risk,std:nt.draft,fb:"None until legal sets one.",kw:(nt.id==="NT-AI"?"machine learning, train, models":nt.id==="NT-PUB"?"press release, case stud, publicity":nt.id==="NT-NSO"?"solicit, hire":nt.id==="NT-USG"?"true-up, overage":nt.id==="NT-AUDU"?"audit":nt.id==="NT-EXC"?"exclusive remedy":nt.id==="NT-SUS"?"suspend":"")}:{risk:"Medium",cat:"Legal"},
  live:v=>`<p class="story">${p?"Saved as version "+(+String(p.ver).slice(1)+1)+". ":""}Owner: ${LEGAL}. ${v.risk==="High"?"High risk clauses always need legal approval on any variance.":"Variances inside the fallback can be agreed by the business owner."}</p>`,
  onSubmit:v=>{if(p){Object.assign(p,{n:v.n,cat:v.cat,risk:v.risk,std:v.std,fb:v.fb,kw:v.kw,ver:"v"+(+String(p.ver).slice(1)+1),rev:TDY});aud(ME,"Edited playbook clause",from?l.ct:"",p.n+" now "+p.ver);render();return {toast:"New version saved"}}
   const r=addClause(v,from);syncMetrics();render();return {toast:"Added "+r.p.n+". "+r.moved+" lines now match it.",audit:r.p.id}}})}
function roundForm(){const c=ctOf(SW.ct)||CT0[1];openForm({id:"sow_round",title:"Log a negotiation round",story:"Each exchange with the vendor is one round. Counting what each side conceded shows who is moving and how long the negotiation has run.",submit:"Log round",fields:[{k:"from",label:"Who sent this version",type:"chips",opts:["Atlantic Systems","Vendor","Both"],req:true},{k:"ver",label:"Version",type:"text",req:true,ph:"v3 markup"},{k:"note",label:"What changed",type:"longtext",req:true,wide:true},{k:"us",label:"Lines Atlantic Systems conceded",type:"number",min:0},{k:"ven",label:"Lines the vendor conceded",type:"number",min:0}],defaults:{from:"Atlantic Systems",us:0,ven:0},
  live:v=>`<p class="story">${esc(ctShort(c.id))} would have ${RND.filter(r=>r.ct===c.id).length+1} rounds.</p>`,onSubmit:v=>{RND.push({ct:c.id,n:RND.filter(r=>r.ct===c.id).length+1,date:TDY,from:v.from==="Vendor"?c.vendor.split(" ")[0]:v.from,note:v.note,ver:v.ver,us:+v.us||0,ven:+v.ven||0});aud(ME,"Logged negotiation round",c.id,v.ver+": "+v.note);render();return {toast:"Round logged"}}})}
function newCT(v){const num=1001+CT0.length,c={id:"CLM-"+num,num:num,title:v.title||v.vendor+" "+(v.type||"SOW"),vendor:v.vendor,type:v.type||"SOW",status:"In negotiation",value:+v.value||0,start:addD(TDY,45),end:addD(TDY,45+365),auto:false,notice:0,owner:v.owner||ME,vOwner:v.vendor,proj:"",svc:"",risk:"Medium",line:"",gen:false,prop:null,exe:null,amend:[],inv:[],n:0,off:0};CT0.push(c);return c}
function uploadForm(cid){const ex=CT0.map(c=>[c.id,c.id+" "+c.title]);
 openForm({id:"sow_upload",title:"Add or analyze a document",story:"Stores the vendor proposal or the executed contract with its version, then reads it line by line. In this prototype text and Markdown files are read. PDF and Word files need the production document service, so the sample text for that contract type is used and the page says so.",submit:"Store and analyze",
  fields:[{section:"Which engagement"},{k:"ct",label:"Engagement",type:"select",opts:[["new","New vendor engagement"]].concat(ex),req:true},{k:"vendor",label:"Vendor",type:"text",req:true,show:v=>v.ct==="new"},{k:"title",label:"Title",type:"text",req:true,wide:true,show:v=>v.ct==="new"},{k:"type",label:"Contract type",type:"select",opts:["SOW","MSA","Software license","DPA","NDA","Order form","Support agreement"],show:v=>v.ct==="new"},{k:"value",label:"Value",type:"money",show:v=>v.ct==="new"},{k:"owner",label:"Contract owner",type:"people",show:v=>v.ct==="new"},
   {section:"The document"},{k:"kind",label:"Which document is this",type:"chips",opts:[["proposal","Vendor proposal"],["contract","Executed contract"]],req:true},{k:"ver",label:"Version",type:"text",ph:"v3"},{k:"file",label:"File",type:"file",accept:".txt,.md,.pdf,.docx",help:"Text and Markdown are read here. PDF and Word use the sample."},{k:"text",label:"Or paste the text",type:"longtext",wide:true,rows:5},{k:"go",label:"Analyze right away",type:"toggle"}],
  defaults:{ct:cid||"new",kind:"proposal",go:true,ver:"v1"},onFile:(f,vals,fid)=>{if(f&&/\.(txt|md)$/i.test(f.name)){const r=new FileReader();r.onload=()=>{vals.text=String(r.result);refreshForm(fid)};r.readAsText(f)}else if(f){toast("PDF and Word files need the document service in production. The sample text for this type will be used.","info")}},
  live:v=>`<p class="story">${v.ct==="new"?"A new engagement is created. ":"The document is added to "+esc(ctShort(v.ct))+". "}${v.text&&v.text.length>40?"Your text will be read ("+v.text.length.toLocaleString("en-US")+" characters).":"No text yet, so the sample for the type is read."}</p>`,
  onSubmit:v=>{const c=v.ct==="new"?newCT(v):ctOf(v.ct);let tk=null;if(v.text&&v.text.trim().length>40){tk="u"+Date.now();TXT[tk]=v.text}const kind=v.kind||"proposal",file=v.file||"pasted-text.txt";
   if(kind==="proposal"){c.prop=c.prop||{vers:[],value:c.value};c.prop.ver=v.ver||"v1";c.prop.date=TDY;c.prop.file=file;c.prop.vers=(c.prop.vers||[]).concat([(v.ver||"v1")+" · "+fdt(TDY)]);if(tk)c.prop.text=tk}else{c.exe=c.exe||{tcs:"Vendor terms"};c.exe.date=TDY;c.exe.ver=v.ver&&v.ver!=="v1"?v.ver:"Executed";c.exe.file=file;if(tk)c.exe.text=tk;c.status="Executed"}
   aud(ME,"Stored "+(kind==="proposal"?"proposal":"executed contract"),c.id,file+" "+(v.ver||""));SW.ct=c.id;SW.doc=kind;
   if(v.go!==false){const key=tk||(kind==="proposal"?c.prop.text:c.exe.text)||SAMPLEFOR(c.type);if(!tk&&!(kind==="proposal"?c.prop.text:c.exe.text))toast("No text supplied, so sample text for "+c.type+" is used","info");startRun(c.id,kind,key,file)}else{S.v.sow=1;render()}return {toast:"Stored "+file}}})}
function crForm(cid,key){const lv=CTS().filter(c=>live(c)||(!c.gen&&c.status==="In negotiation")).slice(0,250),def=cid||SW.ct,pre={};
 if(key){const it=(cmpItems(def)||[]).find(x=>x.key===key);if(it){const l=it.l;pre.type=(l.type==="sla"||l.type==="kpi")?"SLA change":l.type==="price"||l.type==="payment"?"Price or rate change":"Scope or project change";pre.title=(it.kind==="promised"?"Restore: ":"Review: ")+(l.measure||TYP[l.type][0])+" "+(l.norm&&l.norm!=="Stated"?l.norm:"");pre.reason="The vendor proposal said: \""+(it.p||l).src+"\" The signed contract "+(it.kind==="promised"?"does not include it.":"says: \""+(it.c||l).src+"\"");pre.oldv=it.c?it.c.norm:"Not in contract";pre.newv=it.p?it.p.norm:l.norm;pre.key=key}}
 openForm({id:"sow_cr",title:"Request a change",story:"Any change to a signed contract or statement of work starts here: schedule, scope, assumptions, price, service levels, renewal or termination. The form shows the effect on the project schedule, invoice plan and budget, and who must approve.",submit:"Submit change request",
  fields:[{section:"What is changing"},{k:"ct",label:"Contract",type:"select",req:true,wide:true,opts:lv.map(c=>[c.id,c.id+" "+c.title])},{k:"type",label:"Type of change",type:"chips",req:true,opts:CRT},{k:"title",label:"Short title",type:"text",req:true,wide:true,ph:"Milestone 3 slips 7 work days"},{k:"reason",label:"Why is this needed",type:"longtext",req:true,wide:true,ai:{label:"Draft reason",fn:v=>({"Schedule change":"The vendor needs more time because of "+"reviewer feedback and data quality. Holding the date would mean accepting lower quality work.","Price or rate change":"The change adds effort that is not in the current fee. The vendor quote is attached for review.","Scope or project change":"The project needs this capability to meet its goal and it is outside the signed scope.","Assumption change":"An assumption in the statement of work is no longer true, and the date or condition needs to change.","SLA change":"Recent service performance shows the current service levels do not protect the service. A tighter target with credits is needed.","Termination or renewal":"The service is being replaced or reviewed and we need to control the renewal date."})[v.type]||"Describe why."}},
   {section:"The change"},{k:"oldv",label:"Current term",type:"text",wide:true},{k:"newv",label:"Requested term",type:"text",req:true,wide:true},{k:"days",label:"Schedule effect in work days (negative pulls in)",type:"number",show:v=>v.type==="Schedule change"||v.type==="Price or rate change"},{k:"task",label:"WBS task that moves",type:"select",ph:"No schedule effect",opts:TASKS.map(t=>[t.id,t.p+" · "+t.n]),show:v=>v.type==="Schedule change"||v.type==="Price or rate change"},{k:"amt",label:"Price effect in dollars (negative for a saving)",type:"number",step:1000,show:v=>v.type!=="Schedule change"&&v.type!=="Assumption change"},{k:"upd",label:"Update the linked schedule when approved",type:"toggle",show:v=>v.days}],
  defaults:Object.assign({ct:def,type:"Schedule change",upd:true,amt:0,days:0},pre),
  live:v=>{const tmp={id:"CR-new",ct:v.ct,type:v.type,title:v.title||"",reason:v.reason||"",amt:+v.amt||0,days:+v.days||0,task:v.task,oldv:v.oldv,newv:v.newv,key:v.key||""},im=crImpact(tmp);return `<p class="story" data-role="story"><b>Impact preview.</b> ${im.sc?im.sc.pj.map(p=>esc(p.p)+" finish "+p.fb+" to "+p.fa+" ("+(p.d>0?"+":"")+p.d+" work days)").join("; ")+". ":""}${tmp.amt?"Price "+S$(tmp.amt)+". ":""}${im.after!=null&&tmp.amt>0&&im.after<0?"The project budget would be "+K$(-im.after)+" short. ":""}<b>Approver:</b> ${esc(im.tier.role)} (${im.tier.id}, up to ${im.tier.max===Infinity?"any amount":D$(im.tier.max)}), after ${im.chain.filter(s=>s.r!==im.tier.role).map(s=>esc(s.r)).join(" and ")}.</p>`},
  onSubmit:v=>{const n=CRS.length+201+(CRS.filter(x=>/^CR-2/.test(x.id)).length<0?0:0);const id="CR-"+(200+CRS.length+1);const x={id:id,ct:v.ct,type:v.type,title:v.title,st:"Requested",amt:+v.amt||0,days:+v.days||0,task:v.task||"",req:ME,at:TDY,reason:v.reason,oldv:v.oldv||"Current terms",newv:v.newv,key:v.key||"",upd:v.upd,thread:[],ver:1,ap:{}};CRS.unshift(x);if(GEN.cr)GEN.cr.unshift(x);aud(ME,"Raised change request",v.ct,id+" "+v.title);S.v.sow=5;render();return {toast:id+" raised. It starts in Requested. Approver: "+tierOf(x.amt).role+"."}}})}
/* ---------- applying and moving change requests ---------- */
function applyCR(x){const c=ctOf(x.ct);if(!c)return;const eff=[],n=(c.amend||[]).length+1;c.amend=c.amend||[];c.amend.push({id:"A"+n,date:TDY,title:x.title,delta:x.amt,sum:x.reason});if(c.exe)c.exe.ver="Executed with Amendment "+n;
 if(x.amt){c.value+=x.amt;genInv(c).push(inv_("Change "+x.id+": "+x.title,addD(TDY,45),x.amt,"scheduled",false,"cr"));eff.push("value "+S$(x.amt)+", now "+D$(c.value))}
 if(x.type==="Schedule change"&&x.days){allLines_(x.ct).filter(l=>l.key===x.key&&l.due).forEach(l=>{l.due=addWD(l.due,x.days);l.norm="Due "+fdt(l.due);l.status="agreed";l.by="Change "+x.id});OBLS().filter(o=>o.ct===x.ct&&o.st!=="done"&&/Milestone 3/.test(o.t)).forEach(o=>{o.due=addWD(o.due,x.days);o.st="open"});eff.push("milestone date moved "+x.days+" work days")}
 if(x.days&&x.task&&x.upd!==false){if(window.PPMX&&PPMX.shiftTask){try{PPMX.shiftTask(x.task,x.days);eff.push("WBS updated through the planning module")}catch(e){}}else{const t=TASKS.find(y=>y.id===x.task);if(t&&!t.ms){t.dur=Math.max(1,t.dur+x.days);eff.push("WBS task '"+t.n+"' is now "+t.dur+" work days")}}}
 if(x.type==="SLA change"){const l=allLines_(x.ct).find(y=>y.key===x.key||y.type==="sla");if(l){l.norm=x.newv;l.target=x.newv;l.status="agreed";l.by="Change "+x.id}eff.push("service level register updated")}
 if(x.type==="Assumption change"){const l=allLines_(x.ct).find(y=>y.type==="assumption");if(l){l.norm=x.newv;l.status="agreed";l.by="Change "+x.id}OBLS().filter(o=>o.ct===x.ct&&/landing zone/i.test(o.t)).forEach(o=>{o.due=dateIn(x.newv,c)||o.due;o.st="open"});eff.push("assumption and its obligation date updated")}
 if(x.type==="Termination or renewal"){const d=dateIn(x.newv,c);if(d&&d>c.end&&!/non-renewal|notice/i.test(x.title)){c.end=d;eff.push("end date "+fdt(d))}if(/non-renewal|notice/i.test(x.title)){c.auto=false;eff.push("auto-renewal switched off, notice recorded")}OBLS().filter(o=>o.ct===x.ct&&o.kind==="Renewal notice"&&o.st!=="done").forEach(o=>{o.st="done";o.dn=TDY})}
 if(x.type==="Scope or project change"){const L=lines_(x.ct,bestDoc(x.ct)||"proposal");if(L.length){L.push(Object.assign({},L[0],{id:L[0].id+"X"+x.id,ref:"A"+n,src:x.title+" (added by "+x.id+")",type:"deliverable",norm:x.amt?S$(x.amt):"Added",status:"agreed",m:"std",pb:"",pbs:[],routine:true,by:"Change "+x.id,thread:[],key:"cr-"+x.id,route:"",due:""}))}eff.push("scope line added to the register")}
 x.st="Approved";x.applied=true;x.ver=(x.ver||1)+1;aud(ME,"Approved and applied change",x.ct,x.id+": "+eff.join("; ")+". Amendment A"+n+" stored.");const bud=x.amt>0?" Budget reforecast needed: "+(c.line||"run budget")+" "+S$(x.amt)+".":"";toast("Applied "+x.id+": "+eff.join("; ")+"."+bud,"good");syncMetrics()}
function approveCR(x){const t=tierOf(x.amt),ap=x.ap=x.ap||{};
 if(["SLA change","Termination or renewal","Assumption change"].includes(x.type)&&!ap[LEGAL]){toast("Atlantic Legal must review this type of change first. Moved to Legal review.","warn");if(x.st==="Requested"||x.st==="Impact review")x.st="Legal review";return false}
 if(!x.imp){toast("Review the impact analysis first","warn");if(x.st==="Requested")x.st="Impact review";return false}
 if(Math.abs(x.amt)>10000&&!ap.Controller){toast("The Controller must review anything above $10,000","warn");return false}
 if(Math.abs(x.amt)>100000){x.st="Approval";x.thread.push({who:ME,t:"I reviewed this. "+D$(Math.abs(x.amt))+" is above CIO authority, so the "+t.role+" must sign.",at:window.U.fmtDate(window.U.todayDate())});aud(ME,"Routed for signature",x.ct,x.id+" needs the "+t.role+" ("+t.id+").");toast("Above your $100,000 limit. Sent to the "+t.role+".","warn");return false}
 applyCR(x);return true}
function moveCR(id,to){const x=CRALL().find(y=>y.id===id);if(!x||x.st===to){render();return}
 if(x.st==="Approved"){toast("Already applied. Raise a new change request to amend it again.","warn");render();return}
 if(to==="Approved"){approveCR(x);render();return}
 if((to==="Legal review"||to==="Approval")&&!x.imp&&x.st==="Requested"){toast("Impact review comes first. Moved there instead.","warn");x.st="Impact review";render();return}
 if(to==="Approval"&&["SLA change","Termination or renewal","Assumption change"].includes(x.type)&&!(x.ap||{})[LEGAL]){toast("Legal reviews this type of change before approval. Moved to Legal review.","warn");x.st="Legal review";render();return}
 if(to==="Impact review")x.imp=true;x.st=to;aud(ME,"Moved change request",x.ct,x.id+" to "+to);toast(x.id+" moved to "+to,"good");render()}
DND.on("sow_cr",(id,from,to)=>moveCR(id,to));
/* ---------- project, WBS, demand ---------- */
function projForm(cid){const c=ctOf(cid);if(!c)return;const L=lines_(c.id,bestDoc(c.id)||"proposal").filter(l=>l.type==="milestone"&&l.due).sort((a,b)=>a.due<b.due?-1:1);
 openForm({id:"sow_proj",title:"Create a project from "+ctShort(c.id),story:"Builds a project with a kickoff, the work before each contract milestone, and the milestones on their contract dates. A person approves the plan in Projects.",submit:"Create project",fields:[{k:"name",label:"Project name",type:"text",req:true,wide:true},{k:"pm",label:"Project manager",type:"people",req:true},{k:"start",label:"Start",type:"date",req:true}],defaults:{name:c.title.replace(/^Lumen /,"Lumen ").slice(0,60),pm:c.owner&&PEOPLE.some(p=>p[0]===c.owner)?c.owner:"Priya Shah",start:"2026-10-12"},
  live:v=>`<p class="story">${L.length} contract milestones become ${L.length*2+1} tasks. Budget at completion ${K$(Math.round(c.value/1000))}. ${window.addProject?"":"The Projects module is not loaded here, so the request is saved on the contract."}</p>`,
  onSubmit:v=>{const T=[{n:"Kickoff and mobilize",dur:5,snet:v.start,res:[]}];let prev=wdOf(v.start)+5;L.forEach(l=>{T.push({n:"Work toward "+l.src.split(":")[0],dur:Math.max(3,wdOf(l.due)-prev),res:[]});T.push({n:l.src.split(":")[0]+": "+(l.src.split(":")[1]||"").trim().slice(0,40),dur:0,ms:1,snet:l.due,res:[],own:v.pm});prev=wdOf(l.due)});if(!L.length)T.push({n:"Delivery",dur:40,res:[]},{n:"Acceptance",dur:0,ms:1,res:[]});
   let pid="";if(window.addProject){try{pid=window.addProject({name:v.name,short:c.vendor.split(" ")[0]+" "+(c.title.match(/SOW-\d+/)||[c.type])[0],pm:v.pm,cost:Math.round(c.value/1000),tasks:T,src:"contract"})||""}catch(e){}}
   if(pid){c.proj=pid;aud(ME,"Created project from contract",c.id,pid+" with "+T.length+" tasks.");render();return {toast:"Created project "+pid+" with "+T.length+" tasks from the contract."}}c.projReq={name:v.name,pm:v.pm,tasks:T.length};aud(ME,"Requested project from contract",c.id,v.name);render();return {toast:"Projects module not loaded. The request is saved on the contract."}}})}
function toWbs(cid){const c=ctOf(cid);if(!c)return;const L=lines_(cid,bestDoc(cid)||"proposal").filter(l=>l.type==="milestone"||(l.type==="deliverable"&&l.due)).sort((a,b)=>a.due<b.due?-1:1);if(!L.length){toast("No dated milestone lines found. Analyze the document first.","warn");return}
 const T=L.map(l=>({n:l.src.split(":")[0]+": "+(l.src.split(":")[1]||l.src).trim().slice(0,46),dur:0,ms:l.type==="milestone"?1:0,snet:l.due,own:c.owner,pred:[]}));
 if(window.PPMX&&PPMX.addTasks&&c.proj){try{PPMX.addTasks(c.proj,T);aud(ME,"Sent milestones to WBS",cid,T.length+" tasks to "+c.proj);toast(T.length+" milestones sent to the WBS of "+c.proj,"good");return}catch(e){}}
 c.queued=T;aud(ME,"Queued milestones for WBS",cid,T.length+" milestones");toast(c.proj?"WBS module not loaded. "+T.length+" milestones are queued on the contract.":"Create or link a project first. "+T.length+" milestones are queued.","info")}
function demand(cid){const c=ctOf(cid);if(!c)return;const o={title:c.vendor+": "+c.title,reason:"Contract "+c.id+" ("+c.type+") needs funding and sponsor review.",source:"Contract analyzer",cost:Math.round(c.value/1000),service:c.svc,kind:"Contract-driven"};if(window.addDemand){try{window.addDemand(o);aud(ME,"Created demand from contract",cid,o.title);toast("Demand request created","good");return}catch(e){}}toast("Demand module not loaded. Nothing was created.","info")}
/* ---------- events ---------- */
function docKey(c,doc){const o=doc==="proposal"?c.prop:c.exe;return(o&&o.text)||null}
function runFor(cid,doc){const c=ctOf(cid);if(!c)return;let k=docKey(c,doc);const o=doc==="proposal"?c.prop:c.exe;if(!k){k=SAMPLEFOR(c.type);toast("The file text is not stored in this prototype, so sample text for "+c.type+" is used.","info")}startRun(cid,doc,k,o?o.file:c.title)}
function pickDrawer(){openDrawer(`<h2 style="font-size:24px;margin:6px 0">Choose a contract</h2><p class="muted small">Search ${CTS().length.toLocaleString("en-US")} contracts. Select one to work on it in every tab.</p>`+btHTML({id:"sow_pickt",h:420,rowH:44,key:"id",facets:["type","status"],open:id=>{SW.ct=id;SW.doc=bestDoc(id)||"proposal";closeDrawer();render()},rows:()=>CTS(),cols:[{k:"id",label:"ID"},{k:"title",label:"Contract",wrap:1,fmt:r=>`<b>${esc(r.title)}</b>`},{k:"type",label:"Type"},{k:"status",label:"Status"},{k:"value",label:"Value",cls:"num",val:r=>r.value,fmt:r=>D$(r.value)}]}))}
document.addEventListener("click",e=>{const t=e.target.closest("[data-sow-pick],[data-sow-doc],[data-sow-scope],[data-sow-rq],[data-sow-open],[data-sow-tab],[data-sow-cmp],[data-sow-eng],[data-sow-run],[data-sow-upload],[data-sow-sample],[data-sow-runpaste],[data-sow-route],[data-sow-accept],[data-sow-agree],[data-sow-lgok],[data-sow-lk],[data-sow-wbs1],[data-sow-cmt],[data-sow-editline],[data-sow-addclause],[data-sow-newclause],[data-sow-editclause],[data-sow-batch],[data-sow-round],[data-sow-newcr],[data-sow-cr],[data-sow-more],[data-sow-sign],[data-sow-approve],[data-sow-reject],[data-sow-impact],[data-sow-cmtcr],[data-sow-svcimp],[data-sow-cmpopen],[data-sow-open1],[data-sow-mkproj],[data-sow-towbs],[data-sow-demand],[data-sow-obdone],[data-sow-obnudge],[data-sow-accinv],[data-sow-offset],[data-sow-claim],[data-sow-newob]");if(!t)return;const d=t.dataset;
 if("sowPick" in d){pickDrawer();return}
 if(d.sowDoc){SW.doc=d.sowDoc;const c=ctOf(SW.ct);if(!AN[anKey(SW.ct,SW.doc)]&&c&&(SW.doc==="proposal"?c.prop:c.exe)){render()}else render();return}
 if(d.sowScope){SW.scope=d.sowScope;render();return}
 if(d.sowRq){SW.rq=d.sowRq;render();return}
 if(d.sowOpen){const [id,tab]=d.sowOpen.split(":");SW.ct=id;SW.doc=bestDoc(id)||SW.doc;closeDrawer();goTab(+tab);return}
 if(d.sowTab!==undefined&&d.sowTab!==""){goTab(+d.sowTab);return}
 if(d.sowCmp){const c=ctOf(d.sowCmp);if(c&&AN[anKey(c.id,"proposal")]&&AN[anKey(c.id,"contract")]){SW.cmp=c.id;closeDrawer();goTab(4)}else{toast("Analyze both the proposal and the executed contract to compare them. Starting with the contract.","info");SW.ct=d.sowCmp;closeDrawer();const cc=ctOf(d.sowCmp);if(cc&&cc.exe&&!AN[anKey(cc.id,"contract")])runFor(cc.id,"contract");else if(cc&&cc.prop&&!AN[anKey(cc.id,"proposal")])runFor(cc.id,"proposal");else goTab(2)}return}
 if(d.sowEng){openEng(d.sowEng);return}
 if(d.sowRun){const [id,doc]=d.sowRun.split(":");closeDrawer();runFor(id,doc);return}
 if("sowUpload" in d){uploadForm(d.sowUpload||null);return}
 if(d.sowSample){const k=d.sowSample;startRun(SW.ct,SW.doc,k,({sow5:"Lumen SOW-5 proposal sample",beacon:"Beacon license proposal sample",msa:"Sample master services agreement",dpa:"Sample data processing addendum"})[k]);return}
 if("sowRunpaste" in d){const v=($("#sow_paste")||{}).value||"";if(v.trim().length<40){toast("Paste at least a few sentences to analyze","warn");return}const k="p"+Date.now();TXT[k]=v;startRun(SW.ct,SW.doc,k,"Pasted text");return}
 if(d.sowRoute){const [id,r]=d.sowRoute.split(":");const l=findLine(id);if(l)setRoute(l,r);return}
 if(d.sowAccept){const l=findLine(d.sowAccept);if(l)acceptLine(l);return}
 if(d.sowAgree){const l=findLine(d.sowAgree);if(l)agreeLine(l);return}
 if(d.sowLgok){const l=findLine(d.sowLgok);if(l)legalOK(l);return}
 if(d.sowLk){const [id,k]=d.sowLk.split(":"),l=findLine(id);if(l){l.lkc=l.lkc||{};l.lkc[k]=true;aud(ME,"Confirmed link",l.ct,"§"+l.ref+" to "+l.lk[k]);toast("Link confirmed","good");render();openLine(id)}return}
 if(d.sowWbs1){const l=findLine(d.sowWbs1),c=l&&ctOf(l.ct);if(!l||!c)return;const T=[{n:l.src.split(":")[0]+": "+(l.src.split(":")[1]||l.src).trim().slice(0,46),dur:0,ms:l.type==="milestone"?1:0,snet:l.due,own:c.owner,pred:[]}];if(window.PPMX&&PPMX.addTasks&&c.proj){try{PPMX.addTasks(c.proj,T);toast("Sent to the WBS of "+c.proj,"good");aud(ME,"Sent line to WBS",l.ct,"§"+l.ref);return}catch(er){}}toast(c.proj?"WBS module not loaded. Not sent.":"Link a project first. Use Create project on the Obligations tab.","info");return}
 if(d.sowCmt){const i=$("#sow_cmt"),v=i&&i.value.trim();if(!v)return;const l=findLine(d.sowCmt);if(!l)return;const r=REV.find(x=>x.line===l.id);(r?r.thread:l.thread).push({who:ME,t:v,at:window.U.fmtDate(window.U.todayDate())});aud(ME,"Commented on line",l.ct,"§"+l.ref);openLine(l.id);return}
 if(d.sowEditline){const l=findLine(d.sowEditline);if(l)editLineForm(l);return}
 if(d.sowAddclause){clauseForm(null,d.sowAddclause);return}
 if("sowNewclause" in d){clauseForm();return}
 if(d.sowEditclause){clauseForm(d.sowEditclause);return}
 if(d.sowBatch){batch(d.sowBatch);return}
 if("sowRound" in d){roundForm();return}
 if("sowNewcr" in d){closeDrawer();setTimeout(()=>crForm(d.sowNewcr||null,d.sowCrKey||null),30);return}
 if(d.sowCr){openCR(d.sowCr);return}
 if(d.sowMore){SW.more[d.sowMore]=1;render();return}
 if(d.sowSign){const [id,r]=d.sowSign.split(":"),x=CRALL().find(y=>y.id===id);if(x){x.ap=x.ap||{};x.ap[r]=true;x.thread.push({who:r===LEGAL?LEGAL:ME,t:"Recorded the "+r+" review.",at:window.U.fmtDate(window.U.todayDate())});aud(ME,"Recorded review",x.ct,x.id+": "+r);toast(r+" review recorded","good");render();openCR(id)}return}
 if(d.sowImpact){const x=CRALL().find(y=>y.id===d.sowImpact);if(x){x.imp=true;if(x.st==="Requested")x.st="Impact review";aud(ME,"Reviewed impact",x.ct,x.id);toast("Impact review recorded","good");render();openCR(x.id)}return}
 if(d.sowApprove){const x=CRALL().find(y=>y.id===d.sowApprove);if(x){const ok=approveCR(x);render();if(ok)closeDrawer();else openCR(x.id)}return}
 if(d.sowReject){const x=CRALL().find(y=>y.id===d.sowReject);if(x){const i=CRS.indexOf(x);x.st="Requested";x.title="Rejected: "+x.title.replace(/^Rejected: /,"");x.thread.push({who:ME,t:"Rejected. Raise a new request with changes.",at:window.U.fmtDate(window.U.todayDate())});aud(ME,"Rejected change request",x.ct,x.id);toast(x.id+" rejected and returned to Requested","warn");closeDrawer();render()}return}
 if(d.sowCmtcr){const i=$("#sow_cmt"),v=i&&i.value.trim();if(!v)return;const x=CRALL().find(y=>y.id===d.sowCmtcr);if(x){x.thread.push({who:ME,t:v,at:window.U.fmtDate(window.U.todayDate())});openCR(x.id)}return}
 if(d.sowSvcimp){const x=CRALL().find(y=>y.id===d.sowSvcimp),c=x&&ctOf(x.ct);if(c&&window.openImpact)openImpact({type:"change",id:x.id,service:c.svc});return}
 if(d.sowCmpopen){openCmp(d.sowCmpopen);return}
 if(d.sowOpen1){openLine(d.sowOpen1);return}
 if(d.sowMkproj){projForm(d.sowMkproj);return}
 if(d.sowTowbs){toWbs(d.sowTowbs);return}
 if(d.sowDemand){demand(d.sowDemand);return}
 if(d.sowObdone){const o=OBLS().find(x=>x.id===d.sowObdone);if(o){o.st="done";o.dn=TDY;if(o.kind==="Review or acceptance"){const c=ctOf(o.ct);if(c){const r=genInv(c).find(y=>y.st==="held"&&!y.acc);if(r){r.acc=true;toast("Acceptance recorded. "+r.n+" can now be approved for payment.","good")}}}aud(ME,"Completed obligation",o.ct,o.t);if(o.kind!=="Review or acceptance")toast("Marked done","good");syncMetrics();closeDrawer();render()}return}
 if(d.sowObnudge){const o=OBLS().find(x=>x.id===d.sowObnudge);if(o){aud("Contract Analyst Agent","Sent reminder",o.ct,o.who+": "+o.t);toast("Reminder sent to "+o.who,"good")}return}
 if(d.sowAccinv){const [id,i]=d.sowAccinv.split(":"),c=ctOf(id),r=c&&genInv(c)[+i];if(r){r.acc=true;r.st="scheduled";aud(ME,"Recorded acceptance",id,r.n+" released for approval.");toast("Acceptance recorded. The payment can now go to invoice approval.","good");syncMetrics();render()}return}
 if(d.sowOffset){const [id,i]=d.sowOffset.split(":"),c=ctOf(id),inv=c&&genInv(c),r=inv&&inv[+i];if(r){const nx=inv.slice(+i+1).find(y=>y.st==="scheduled"||y.st==="held");if(nx){nx.amt=Math.max(0,nx.amt-22000);r.acc=true;r.n+=" (offset against "+nx.n.split(":")[0]+")";aud(ME,"Offset payment",id,"Reduced "+nx.n+" by $22,000.");toast("Next payment reduced by $22,000 so total paid matches accepted work","good");syncMetrics();render()}else toast("No later payment to offset against. Ask the vendor for a credit note.","warn")}return}
 if(d.sowClaim){const c=ctOf(d.sowClaim);if(c&&c.credit){const amt=c.credit.owed-c.credit.claimed;c.credit.claimed=c.credit.owed;OBLS().filter(o=>o.ct===c.id&&/credit/i.test(o.t)).forEach(o=>{o.st="done";o.dn=TDY});aud(ME,"Claimed service credit",c.id,D$(amt));toast(D$(amt)+" credit claimed on the next invoice","good");syncMetrics();render()}return}
 if("sowNewob" in d){const c=ctOf(SW.ct)||CT0[1];openForm({id:"sow_ob",title:"Add an obligation",story:"Adds a dated obligation to the register for "+ctShort(c.id)+" and reminds the owner 10 days ahead.",submit:"Add obligation",fields:[{k:"t",label:"Obligation",type:"text",req:true,wide:true},{k:"party",label:"Whose obligation",type:"chips",opts:["Atlantic Systems","Vendor"],req:true},{k:"who",label:"Owner",type:"select",opts:DIR.filter(x=>!x.generated).map(x=>[x.name,x.name+" ("+KINDS[x.kind]+")"]),req:true},{k:"due",label:"Due",type:"date",req:true},{k:"kind",label:"Kind",type:"select",opts:["Deliverable","Report","Payment","Review or acceptance","Renewal notice","Other"]}],defaults:{party:"Atlantic Systems",who:c.owner,kind:"Other"},onSubmit:v=>{OBL.push({id:"OB-"+(101+OBL.length),ct:c.id,t:v.t,party:v.party,who:v.who,due:v.due,st:"open",dn:"",kind:v.kind||"Other"});aud(ME,"Added obligation",c.id,v.t);render();return {toast:"Obligation added"}}});return}
});
document.addEventListener("change",e=>{const t=e.target;if(t.matches&&t.matches("[data-sow-cmpsel]")){SW.cmp=t.value;render();return}
 if(t.matches&&t.matches("[data-sow-file]")){const f=t.files&&t.files[0];if(!f)return;if(/\.(txt|md)$/i.test(f.name)){const r=new FileReader();r.onload=()=>{const k="f"+Date.now();TXT[k]=String(r.result);startRun(SW.ct,SW.doc,k,f.name)};r.readAsText(f)}else{toast("PDF and Word files need the document service in production. Showing the sample text for this document type.","info");startRun(SW.ct,SW.doc,SAMPLEFOR((ctOf(SW.ct)||{}).type),f.name)}}});
document.addEventListener("dragover",e=>{if(e.target.closest&&e.target.closest("[data-sow-dz]")){e.preventDefault()}});
document.addEventListener("drop",e=>{const z=e.target.closest&&e.target.closest("[data-sow-dz]");if(!z)return;e.preventDefault();const f=e.dataTransfer.files[0];if(!f)return;if(/\.(txt|md)$/i.test(f.name)){const r=new FileReader();r.onload=()=>{const k="f"+Date.now();TXT[k]=String(r.result);startRun(SW.ct,SW.doc,k,f.name)};r.readAsText(f)}else{toast("PDF and Word files need the document service in production. Showing the sample text.","info");startRun(SW.ct,SW.doc,SAMPLEFOR((ctOf(SW.ct)||{}).type),f.name)}});
/* ---------- the screen ---------- */
const ICON="M7 3h8l4 4v14H7zM14 3v5h5M10 12h6M10 16h6";
/* ---------- PR-11: simulated contract ingestion ----------
   The contract record takes a PDF, Word or text file. Only the file's name, size and type are read, in this browser: nothing is
   uploaded and the content is not parsed. The extraction is simulated from the file name and the record, labeled simulated, and
   attached to the record (metadata only, kept through U.store so it survives a reload). A real document service is PR-11's later step. */
const IGK="falconaire.sow.ingest",IGOK=/\.(pdf|docx|doc|txt|md)$/i;
const IGS=(()=>{try{return window.U.store.get(IGK,{})||{}}catch(e){return{}}})();
const igSave=()=>{try{window.U.store.set(IGK,IGS)}catch(e){}};
const igSize=n=>n<1024?n+" bytes":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(1)+" MB";
const igKind=name=>{const n=String(name).toLowerCase().replace(/[_\-.]+/g," ");return /\bmsa\b|master/.test(n)?"MSA":/\bdpa\b|data processing/.test(n)?"DPA":/\bnda\b|non ?disclosure/.test(n)?"NDA":/\border\b/.test(n)?"Order form":/licen[cs]e/.test(n)?"Software license":/support/.test(n)?"Support agreement":/\bsow\b|statement of work/.test(n)?"SOW":null};
const IGCL={SOW:["Scope and deliverables","Milestones and acceptance","Payment schedule","Change control","Key personnel"],MSA:["Term and termination","Limitation of liability","Indemnity","Confidentiality","Governing law"],DPA:["Processing purposes","Subprocessors","Security measures","Breach notice","Data transfers"],NDA:["Definition of confidential information","Permitted use","Term"],"Order form":["Products and quantities","Fees","Term and renewal"],"Software license":["License grant","Usage limits","Fees and true-up","Renewal"],"Support agreement":["Service levels","Response times","Service credits"]};
function igExtract(c,f){const ext=((String(f.name).match(/\.([a-z0-9]+)$/i)||[])[1]||"").toLowerCase(),kd=igKind(f.name),kind=kd||c.type;
 const per=ext==="pdf"?45000:ext==="docx"||ext==="doc"?18000:3000,pages=Math.max(1,Math.round((+f.size||0)/per));
 const org=(()=>{try{return DATA.tenantInfo().org||DATA.tenantInfo("core").org}catch(e){return""}})()||""; /* R9: the organization name comes from tenant data */
 return {kind,fields:[["Document type",kind,kd?"file name":"contract record"],["Parties",org+" and "+c.vendor,"contract record"],["Effective date",fdt(c.start),"contract record"],["End date",fdt(c.end),"contract record"],["Contract value",D$(c.value),"contract record"],["Renewal",c.auto?"Automatic, "+(c.notice||"unstated")+" days notice":"By written order","contract record"],["Pages",pages+" (estimate)","file size"]],
  clauses:(IGCL[kind]||IGCL.SOW).slice(),conf:kd?.82:.71}}
function igAttach(id,f){const c=ctOf(id);if(!c)return null;if(!f||!IGOK.test(f.name)){toast("Choose a PDF, Word or text file","warn");return null}
 const rec={id:"DOC-"+Date.now().toString(36),name:String(f.name),size:+f.size||0,type:String(f.type||"")||"unknown",at:TDY,by:ME,simulated:true,ext:igExtract(c,f)};
 (IGS[id]=IGS[id]||[]).unshift(rec);c.files=IGS[id];igSave();aud(ME,"Attached contract file",id,rec.name+" ("+igSize(rec.size)+"), simulated extraction");return rec}
function igRemove(id,fid){const L=IGS[id]||[],i=L.findIndex(x=>x.id===fid);if(i<0)return false;const r=L.splice(i,1)[0];igSave();aud(ME,"Removed contract file",id,r.name);return true}
function ingestHTML(c){const L=IGS[c.id]||[];c.files=L;
 const item=r=>`<div class="sow-igf" data-sow-igf="${esc(r.id)}"><div class="sow-igh"><b>${esc(r.name)}</b><span class="muted small">${esc(igSize(r.size))} · ${esc(r.type)} · attached ${esc(fdt(r.at))} by ${esc(r.by)}</span>${sPill("Simulated extraction","warn")}<button type="button" class="btn quiet sm" data-sow-igdel="${esc(c.id)}|${esc(r.id)}" aria-label="Remove ${esc(r.name)}">Remove</button></div>
  <dl class="kv">${r.ext.fields.map(x=>`<dt>${esc(x[0])}</dt><dd>${esc(x[1])} <span class="muted small">(simulated, from the ${esc(x[2])})</span></dd>`).join("")}<dt>Clauses found</dt><dd>${r.ext.clauses.map(x=>`<span class="pill mute">${esc(x)}</span>`).join(" ")} <span class="muted small">(simulated)</span></dd><dt>Confidence</dt><dd>${Math.round(r.ext.conf*100)}% <span class="muted small">(simulated)</span></dd></dl></div>`;
 return `<section class="sow-ig" data-sow-ig="${esc(c.id)}" aria-label="Contract files"><div class="eyebrow">Contract files</div>
  <div class="sow-igbar"><label class="btn"><input type="file" class="sr" accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" data-sow-ingest="${esc(c.id)}">Attach a contract file</label>
  <span class="muted small">PDF, Word or text. Read in this browser only (the file name, size and type); nothing is uploaded. The extraction below is simulated: no document service reads the content in this prototype.</span></div>
  ${L.length?L.map(item).join(""):`<p class="muted small">No file attached to ${esc(c.id)} yet.</p>`}</section>`}
const IGAPI={attach:igAttach,remove:igRemove,files:id=>(IGS[id]||[]).slice(),html:ingestHTML,extract:igExtract};
ROUTER.on("change",e=>{const t=e.target;if(!t.matches||!t.matches("[data-sow-ingest]"))return;const f=t.files&&t.files[0];if(!f)return;const id=t.dataset.sowIngest;
 const r=igAttach(id,f);t.value="";if(r){toast("Attached "+r.name+" to "+id+". Extraction is simulated.","good");openCT(id)}});
ROUTER.on("click",e=>{const b=e.target.closest&&e.target.closest("[data-sow-igdel]");if(!b)return;const [id,fid]=b.dataset.sowIgdel.split("|");if(igRemove(id,fid)){toast("File removed from "+id,"info");openCT(id)}});
function tvSow(){const v=FIN.tv,C=DATA.get("contracts"),vn=id=>(DATA.get("vendors").find(x=>x.id===id)||{}).n||id||"",ct=v.tw("contract"),g=s=>()=>v.G(s,"No documents have been analyzed for this sample company yet.");
 const cols=[[ct,r=>`<b>${esc(r.n)}</b><small class="muted"> ${esc(r.id)}</small>`],[v.tw("supplier"),r=>esc(vn(r.v))],["Type","ty"],["Start","s"],["End","e"],["Total value",r=>money(+r.tcv||0)],["Owner and backup",v.own("own","bak")]];
 const by={};C.forEach(r=>{const k=r.ty||"Not set";(by[k]=by[k]||{n:k,c:0,a:0}).c++;by[k].a+=+r.tcv||0});
 return v.Sc("ppm_sow","Review a statement of work",C.length?`${C.length} ${DATA.term("contract",{many:true})} hold ${money(sum(C,r=>+r.tcv||0))} of commitments in this sample company. Sample figures, simulated.`:"No contracts in this sample company yet.",
 [["Dashboard and contracts",()=>v.C("All "+DATA.term("contract",{many:true}),C.length+" in this sample company","contracts",C,cols)],["Repository",()=>v.C("What is stored, by type","Count and total value","contracts",Object.values(by),[["Type","n"],[v.tw("contract",1),"c"],["Total value",r=>money(r.a)]])],
  ["Analyzer",g("Analyzer")],["Terms playbook",g("Terms playbook")],["Proposal vs contract",g("Proposal against contract")],["Changes",()=>v.C("Change orders","Contracts whose value grew after signature","contracts",C.filter(r=>+r.co>0),cols)],
  ["Obligations and calendar",()=>v.C("Renewals and decision dates","Soonest first","contracts",C.filter(r=>r.rn).sort((a,b)=>a.rn<b.rn?-1:1),[[ct,"n"],["Renews","rn"],["Notice days","ntc"],["Auto-renews",r=>r.auto?"Yes":"No"],["Decision",r=>esc(r.dec||"None yet")]])],
  ["Review queue",g("Review queue")],["Reviews in progress",g("Reviews in progress")],["Negotiation",g("Negotiation")],["Clause library",g("Clause library")]])}
DATA.screen("ppm_sow",{mode:"data",entities:["contracts","vendors"],note:"mod_sow (PR-32 B5)"});
REG("ppm_sow","SOW and contract analyzer","portfolio",ICON,()=>{if(window.FIN&&FIN.tv&&FIN.tv.TEN())return tvSow();syncMetrics();const a=agg(),s5=lines_("CLM-1002","proposal"),o5=s5.filter(l=>l.m!=="std").length,tr=a.traps[0];
 const story=`<b>${a.n.toLocaleString("en-US")} contracts</b> hold ${fmtTz(a.committed)} of commitments and ${fmtTz(a.billed)} has been paid. Lumen's SOW-5 proposal has <b>${o5} of ${s5.length} lines off playbook</b>, ${s5.filter(l=>l.m==="new").length} of them with no standard term yet. <b>${a.due30.length} obligations</b> fall due in 30 days${a.over.length?" and "+a.over.length+" are overdue":""}${tr?`, and notice to stop the ${esc(tr.vendor)} renewal must go out by <b>${fdt(rdate(tr))}</b>`:""}.`;
 return `<div class="screen">${hero("Portfolio and delivery · Contracts","Every proposal and contract, line by line",story,`<div class="row">${fchip("m_sow_cover")}${fchip("m_sow_ontime")}${fchip("m_sow_cycle")}${fchip("m_sow_leak")}<button class="btn primary" data-sow-upload>Analyze a document</button><button class="btn" data-sow-newcr>Request a change</button>${analyzerChip(.9)}</div>`)}${lensNote()}${views("sow",["Dashboard and contracts","Repository","Analyzer","Terms playbook","Proposal vs contract","Changes","Obligations and calendar"],[tabDash(),tabRepo(),tabAnalyzer(),tabPlaybook(),tabCompare(),tabChanges(),tabObl()])}${procCard("ppm_sow")}</div>`});
/* ---------- chat, search, person 360 ---------- */
ASKX.push(q=>{const l=q.toLowerCase();
 if(/(compare|difference|what changed|promised).*(proposal|contract)|proposal (vs|versus|against)/.test(l)){SW.cmp="CLM-1001";go("ppm_sow");S.v.sow=4;render();const it=cmpItems("CLM-1001")||[];say(q,{t:`Between the Lumen SOW-4 proposal and the signed contract, <b>${it.filter(x=>x.kind==="promised").length} promises disappeared</b>, <b>${it.filter(x=>x.kind==="extra").length} terms were added</b> and the price rose ${S$(CT0[0].value-CT0[0].prop.value)}. I opened the comparison.`,steps:["Read both analyzed documents","Paired lines by clause and milestone","Listed what is missing or new"]});return true}
 if(/(analy[sz]e|read|ingest|upload|extract|parse).*(contract|sow|statement of work|proposal|terms|license)/.test(l)||/(contract|sow).*(line by line|milestones|slas|invoice schedule)/.test(l)){go("ppm_sow");S.v.sow=2;render();say(q,{t:"The analyzer turns every sentence of a proposal or contract into a typed line with owner, date, measure and playbook match. Paste text, drop a text file, or use the Lumen SOW-5 sample. PDF and Word need the production document service.",steps:["Opened Analyzer"]});return true}
 if(/(playbook|off playbook|variance|redline|standard terms|new terms|clause|legal review|negotiat)/.test(l)){SW.ct="CLM-1002";SW.doc="proposal";go("ppm_sow");S.v.sow=3;render();const L=lines_("CLM-1002","proposal"),k={std:0,var:0,new:0};L.forEach(x=>k[x.m]++);say(q,{t:`Lumen SOW-5 has <b>${L.length} lines: ${k.std} standard, ${k.var} variance, ${k.new} new</b>. ${REV.filter(r=>r.st!=="Agreed").length} reviews are open with legal or in shared review. I opened the playbook review.`,steps:["Matched each line to the clause library","Counted variances and new terms"]});return true}
 if(/(renewal|renew|notice|auto-?renew|expir|obligation|due in|leakage|accepted work)/.test(l)){go("ppm_sow");S.v.sow=6;render();const a=agg();say(q,{t:`<b>${a.due30.length} obligations</b> are due in 30 days and ${a.over.length} are overdue. ${a.traps.length?`The renewal trap is ${esc(a.traps[0].vendor)}: notice by ${fdt(rdate(a.traps[0]))}.`:"No auto-renewal traps."} ${D$(a.lk)} is leaking through payments ahead of acceptance and unclaimed credits.`,steps:["Read the obligation register","Checked notice windows","Compared invoice schedule with accepted work"]});return true}
 if(/(change request|change order|amend|schedule change|extend (the )?(contract|sow)|request a change)/.test(l)){go("ppm_sow");S.v.sow=5;render();say(q,{t:`There are <b>${CRALL().filter(x=>x.st!=="Approved").length} open change requests</b>. Each shows impact on the schedule, invoices and budget, drafted change order language and the approver by value. I opened Changes.`,steps:["Opened Changes","Computed approvers from delegation of authority"]});setTimeout(()=>crForm(),150);return true}
 if(/(contracts?|sows?|vendors?).*(list|portfolio|how many|dashboard)|contract repository|repository/.test(l)&&/contract|sow/.test(l)){go("ppm_sow");S.v.sow=0;render();say(q,{t:`There are <b>${CTS().length} contracts</b> in the repository. The dashboard shows renewals and what needs attention.`,steps:["Opened the contract dashboard"]});return true}
 return false});
SEARCHX.push(()=>CTS().slice(0,600).map(c=>({g:"Contracts",t:c.id+" "+c.title,m:c.type+" · "+c.status,c:"--s3",f:()=>{SW.ct=c.id;SW.doc=bestDoc(c.id)||"proposal";go("ppm_sow");setTimeout(()=>openCT(c.id),60)},k:c.vendor+" "+c.owner}))
 .concat(PB.map(p=>({g:"Terms playbook",t:p.n,m:p.cat+" · "+p.risk+" risk",c:"--u3",f:()=>{go("ppm_sow");S.v.sow=3;render();setTimeout(()=>openClause(p.id),60)},k:p.kw+" clause standard fallback"})))
 .concat(CRS.map(x=>({g:"Contract changes",t:x.id+" "+x.title,m:x.type+" · "+x.st,c:"--warn-f",f:()=>{go("ppm_sow");S.v.sow=5;render();setTimeout(()=>openCR(x.id),60)},k:x.reason})))
 .concat([{g:"Actions",t:"Analyze a proposal or contract",m:"Contract analyzer",c:"--accent",f:()=>uploadForm(),k:"sow statement of work terms upload extract milestones sla"},{g:"Actions",t:"Request a contract change",m:"Change request",c:"--accent",f:()=>{go("ppm_sow");crForm()},k:"amend change order schedule price sla renewal"},{g:"Actions",t:"Add a playbook clause",m:"Terms playbook",c:"--accent",f:()=>clauseForm(),k:"legal standard terms"}]));
WORK.push({kind:"Contract obligations",tag:"OBL",fn:(name)=>OBL.filter(o=>o.who===name&&o.st!=="done").map(o=>({id:o.id,t:o.t,sub:ctShort(o.ct),due:fdt(o.due,1),st:obSt(o)==="late"?"bad":obSt(o)==="risk"?"warn":"mute",hrs:1,go:()=>{SW.oSel=o.id;go("ppm_sow");S.v.sow=6;render();setTimeout(()=>openOb(o.id),60)}}))});
P360_TABS.push({label:"Contracts",fn:r=>{const cs=CT0.filter(c=>c.owner===r.name||c.vOwner===r.name);return cs.length?`<div class="needs">${cs.map(c=>`<div class="need" style="grid-template-columns:1fr auto"><div><b>${esc(c.title)}</b><span class="muted">${esc(c.id)} · ${esc(c.type)} · ${D$(c.value)} · ${c.owner===r.name?"owner":"vendor contact"}</span></div>${ctStPill(c.status)}</div>`).join("")}</div>`:'<p class="muted">Not an owner or vendor contact on any contract.</p>'}});
window.SOWX={contracts:()=>CTS().map(c=>({id:c.id,title:c.title,vendor:c.vendor,type:c.type,status:c.status,value:c.value,start:c.start,end:c.end,owner:c.owner,project:c.project})),
 contract:id=>ctOf(id)||null,
 lines:(cid,doc)=>{try{const d=doc||bestDoc(cid)||"contract";return lines_(cid,d).map(l=>({key:l.key,type:l.type,text:l.text||l.t,match:l.m}))}catch(e){return []}},
 obligations:cid=>OBLS().filter(o=>!cid||o.ct===cid).map(o=>({id:o.id,contract:o.ct,title:o.t,party:o.party,owner:o.who,due:o.due,status:obSt(o)})),
 changes:cid=>CRALL().filter(x=>!cid||x.ct===cid).map(x=>({id:x.id,contract:x.ct,type:x.type,stage:x.st,amount:x.amt,title:x.t||x.title})),
 open:id=>{SW.cur=id;go("ppm_sow")},openRecord:id=>openCT(id),ingest:IGAPI};
syncMetrics();
})();
