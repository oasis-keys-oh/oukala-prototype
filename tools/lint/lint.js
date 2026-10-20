// Build lint (CL-46, CL-60): reads src/ (not the build) and checks the platform rules that a script can see in source.
// Each rule counts hits per file. The run fails only when a file has more hits for a rule than the recorded baseline
// (tools/lint/baseline.json), so existing violations are listed and new ones cannot drift in (same approach as
// tools/tests/nav_close.js). Lower the baseline when a cleanup lands: run with --update.
// Usage: node tools/lint/lint.js [--update] [--report] [--rule <id>] [--file <name>] [--json]
//   --update  rewrites the baseline from this run (only do this after fixing violations, or with the owner's agreement)
//   --report  prints every rule's top files and sample hits
// Rule list and enforcement status of every platform rule: docs/enforcement.md.
const fs=require('fs'),path=require('path');
const {ROOT,SRC,sources,lex,lineIndex,stripCssComments}=require('./lib');
const BASE=path.join(__dirname,'baseline.json');
const argv=process.argv.slice(2);const has=k=>argv.includes(k);const arg=k=>{const i=argv.indexOf(k);return i>=0?argv[i+1]:null};

/* ---------- shared inputs ---------- */
const files=sources();
const byName=Object.fromEntries(files.map(s=>[s.f,s]));
const tok=fs.readFileSync(path.join(SRC,'tokens.py'),'utf8');
/* U helper names (R10) read from platform.js so the list follows the contract */
const UKEYS=[...new Set([...(byName['platform.js']||{t:''}).t.matchAll(/\bU\.(\w+)\s*=(?!=)/g)].map(m=>m[1]))].filter(k=>!/^[A-Z_]+$/.test(k)&&k!=='store');
/* sample people (R9): the core directory names in kit.js PEOPLE and kit2.js DIR, plus the sample executive */
const PEOPLE=new Set();
for(const m of (byName['kit.js']||{t:''}).t.matchAll(/\["([A-Z][a-z]+ [A-Z][A-Za-z'-]+)","/g))PEOPLE.add(m[1]);
for(const m of (byName['kit2.js']||{t:''}).t.matchAll(/\bD\("([A-Z][a-z]+ [A-Z][A-Za-z'-]+)","human"/g))PEOPLE.add(m[1]);
PEOPLE.add('Casey Rowan');
const PEOPLE_RE=new RegExp('\\b('+[...PEOPLE].map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+'|Meridian)\\b');
/* real names (R32): the owner and his employer's organizations. Patterns are assembled from fragments so this file
   never spells them as one visible token (same convention as the naming rule in mod_plat_contract.js). */
const REAL=[['Om','ar ','Ha','mid'],['Ha','mid'],['Fin','ancial Acc','ounting Found','ation'],['Fin','ancial Acc','ounting Stand','ards Board'],['Gov','ernmental Acc','ounting Stand','ards Board']].map(a=>a.join(''));
const REAL_RE=new RegExp('\\b('+REAL.join('|')+')\\b');
/* banned external names (R31, CL-44): product words never shown, and the accounting-standard words never used in product text */
const BAN_RE=new RegExp('\\b('+['Fab'+'ric( Enterprise)?','Trel'+'lis','F'+'AF','A'+'SU','A'+'SC','F'+'ASB','G'+'ASB','Codif'+'ication'].join('|')+')\\b|\\b(?:Falconaire |the )?Co'+'re (edition|tier|plan|product|platform|license|SKU)\\b');
/* certification claims (R30, R52): the CL-71 rule from tools/tests/guard.js, applied to each source string */
const PLAN=/\b(plan|plans|planned|planning|intend|intends|roadmap|not (yet )?(certified|claimed|attested)|no SOC 2|until it is true)\b/i;
const OWNCLAIM=/(Falconaire|Oukala|our platform|the platform|\bwe are\b|\bwe're\b|\bour\b)[^.]{0,60}(SOC ?2|bank[- ]grade)|SOC ?2[- ](certified|compliant|attested)|bank[- ]grade/i;
const THIRD=/SOC ?2 Type I{1,2}|SOC 2 (report|examination|testing|coverage|and DR|and ISO)|SOC 2[":,)]|SOC 2: |\(SOC 2|across SOC 2|soc ?2[ ,"]|fw:"SOC 2|"SOC 2"/i;
function sentenceAt(t,i){let s=i,e=i;while(s>0&&!/[.!?\n"`]/.test(t[s-1])&&i-s<240)s--;while(e<t.length&&!/[.!?\n"`]/.test(t[e])&&e-i<240)e++;return t.slice(s,e+1)}
function certJudge(t,i,len){const sent=sentenceAt(t,i);const near=t.slice(Math.max(0,i-12),i+len+24);
 if(PLAN.test(sent))return null;if(OWNCLAIM.test(sent))return sent.trim();if(THIRD.test(near))return null;return sent.trim()}
const certSelf=t=>{const x=/(SOC ?2|bank[- ]grade)/i.exec(t);return x?certJudge(t,x.index,x[0].length):null};
if(!certSelf('Falconaire is SOC 2 certified.')||!certSelf('Our security is bank-grade.')||certSelf('Certifications such as SOC 2 are a plan, not a claim.')||certSelf('Ask the vendor for its SOC 2 Type II report.')){console.log('!! certification rule self-test failed');process.exit(1)}
/* a string is "visible-ish" text when it has a letter run and a space; ids, keys, selectors and regex sources are skipped */
const looksText=v=>/[A-Za-z]{2,}[^<>{}]*\s+[A-Za-z]/.test(v)&&!/^[\w.:#\[\]=*>~+-]+$/.test(v);
const isId=v=>/^[\w.:@\/-]*$/.test(v);

/* CSS custom properties defined anywhere: tokens.py, CSS, or set from JS (same logic as tools/tests/css_lint.js) */
const defd=new Set();const addDefs=t=>{for(const m of t.matchAll(/(?<![\w-])--([\w-]+)\s*:/g))defd.add(m[1]);for(const m of t.matchAll(/setProperty\(\s*["'`]--([\w-]+)/g))defd.add(m[1])};
addDefs(tok);files.forEach(s=>addDefs(s.ext==='css'?stripCssComments(s.t):s.t));

/* ---------- the rules ---------- */
// scope: which files a rule reads. js = every JS file; view = hand-written JS other than platform.js and generated data;
// mod = modules only; css = CSS files. each(s, L) returns a list of {i, s} hits (offset and a short sample).
const strHits=(L,re,filter)=>{const out=[];for(const x of L.strings){if(filter&&!filter(x.v))continue;const m=re.exec(x.v);if(m)out.push({i:x.i+m.index,s:x.v.slice(Math.max(0,m.index-30),m.index+40)})}return out};
const reHits=(t,re)=>{const out=[];re.lastIndex=0;let m;while((m=re.exec(t))){out.push({i:m.index,s:m[0].slice(0,70)});if(!re.global)break}return out};
const RULES=[
 {id:'css-var',rule:'R8',ids:'CL-46, CL-18',n:'Undefined CSS variable',scope:'all',each:(s)=>{const t=s.ext==='css'?stripCssComments(s.t):s.t;const out=[];
   for(const m of t.matchAll(/var\(\s*--([\w-]+)(.)/g)){if(/["'`$+]/.test(m[2])||m[1].endsWith('-'))continue;if(!defd.has(m[1]))out.push({i:m.index,s:'--'+m[1]})}return out}},
 {id:'hex-css',rule:'R8',ids:'CL-46, CL-20',n:'Hex color in CSS outside tokens.py',scope:'css',each:(s)=>reHits(stripCssComments(s.t),/#[0-9a-fA-F]{3,8}\b(?![\w-])(?=[^{}]*[;}])/g)},
 {id:'banned-name',rule:'R31',ids:'CL-46, CL-44',n:'Banned external name in a string',scope:'js',each:(s,L)=>strHits(L,BAN_RE,v=>!isId(v))},
 {id:'em-dash',rule:'R37',ids:'CL-46, CL-45',n:'Em dash in a string',scope:'js',each:(s,L)=>strHits(L,/\u2014|\\u2014|&mdash;|&#8212;/)},
 {id:'real-name',rule:'R32',ids:'CL-46, CL-60',n:'Real person or organization name in a string',scope:'js',each:(s,L)=>strHits(L,REAL_RE)},
 {id:'iife',rule:'R39',ids:'CL-46',n:'Module not wrapped in one IIFE',scope:'mod',each:(s,L)=>{const c=L.code.trim();
   const open=/^[;!]?\(\s*(function\b|\(\s*\)\s*=>|async\b)/.test(c)||/^!function\b/.test(c);const close=/\}\s*\)\s*\(\s*\)\s*;?$|\}\s*\(\s*\)\s*\)\s*;?$/.test(c);
   return open&&close?[]:[{i:0,s:(open?'':'no opening IIFE')+(open||close?'':'; ')+(close?'':'no closing IIFE')}]}},
 {id:'price',rule:'R30',ids:'CL-46',n:'Price point (dollar amount per user or per seat)',scope:'js',each:(s,L)=>strHits(L,/\$\s?\d[\d,.]*\s*[kKmM]?\s*(?:\/\s?|per\s+)(?:user|seat)\b|\bper (?:user|seat) per month\b/i)},
 {id:'cert',rule:'R30',ids:'CL-46, CL-71',n:'Certification claim outside a plan sentence',scope:'js',each:(s,L)=>{const out=[];for(const x of L.strings){const re=/(SOC ?2|bank[- ]grade)/gi;let m;while((m=re.exec(x.v))){const v=certJudge(s.t,x.i+m.index,m[0].length);if(v)out.push({i:x.i+m.index,s:v.slice(0,70)})}}return out}},
 {id:'js-literal',rule:'R8',ids:'CL-60',n:'Literal color or size in JS view code',scope:'view',each:(s,L)=>{const out=[];
   const RE=/(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])|\brgba?\(\s*\d|\b(?:font-size|border-radius|z-index)\s*:\s*-?\d/g;
   for(const x of L.strings){RE.lastIndex=0;let m;while((m=RE.exec(x.v))){const h=m[0];if(h[0]==='#'&&!/[a-fA-F]/.test(h)&&!/(color|fill|stroke|background)\s*[:=]\s*["']?$/i.test(x.v.slice(Math.max(0,m.index-14),m.index)))continue;out.push({i:x.i+m.index,s:x.v.slice(Math.max(0,m.index-20),m.index+24)})}}return out}},
 {id:'sample-data',rule:'R9',ids:'CL-60',n:'Sample person or customer name as a string literal in a module',scope:'mod-view',each:(s,L)=>strHits(L,PEOPLE_RE)},
 {id:'helper',rule:'R10',ids:'CL-60, CL-32',n:'Shared helper redeclared (compare U)',scope:'view',each:(s,L)=>reHits(L.code,new RegExp('(?:\\b(?:const|let|var)\\s+|\\bfunction\\s+|[,{]\\s*)('+UKEYS.join('|')+')\\s*(?:=(?![=>])\\s*(?:\\(|function|[a-z]\\s*=>|[a-z]\\w*\\s*=>)|\\()','g')).filter(h=>!/^[,{]/.test(h.s)||/=/.test(h.s))},
 {id:'owner-text',rule:'R13',ids:'CL-60, CL-53',n:'Owner, backup or approver rendered as plain text (heuristic)',scope:'view',each:(s,L)=>reHits(L.code,/\$\{\s*(?:(?:esc|E|H|U\.esc|h|escH|x)\s*\(\s*)?[\w$.]+?\.(?:owner|own|backup|approver|assignee|sponsor|requester|reviewer|ownerName)\s*\)?\s*(?:\|\|\s*[^}]{0,30})?\}/g)},
 {id:'step-label',rule:'R21',ids:'CL-60, CL-72',n:'"Automatic" or "Function" used as a step kind or label',scope:'view',each:(s,L)=>{const out=reHits(L.nc,/\bwho\s*:\s*["'](?:auto|automatic|fn|function)["']/gi);
   for(const x of L.strings)if(/^(Automatic|Function)( step)?$/.test(x.v.trim()))out.push({i:x.i,s:'"'+x.v+'"'});return out}},
 {id:'product-name',rule:'R31',ids:'CL-60, CL-17',n:'Product name typed as a literal (use BRAND.name) or an old product name',scope:'view',each:(s,L)=>strHits(L,/\b(Oukala|Shaheen|Falconaire)\b/,v=>!isId(v)&&!/^[a-z0-9_.:-]+$/.test(v))},
 {id:'wrapper',rule:'R40',ids:'CL-60, CL-35',n:'New wrapper of render, go or openDrawer (use HOOKS)',scope:'view',each:(s,L)=>{const out=[];const c=L.code;
   for(const m of c.matchAll(/(\b(?:window|W)\s*\.\s*|[^\w$.\s]\s*|^\s*)\b(render|go|openDrawer)\s*=(?![=>])/gm)){
    const before=c.slice(Math.max(0,m.index-12),m.index+m[1].length);if(/\b(const|let|var|function)\s*$/.test(before))continue;out.push({i:m.index,s:m[0].trim()})}return out}}
];
const inScope=(r,s)=>{if(r.scope==='all')return true;if(r.scope==='css')return s.ext==='css';if(s.ext!=='js')return false;
 if(r.scope==='js')return true;if(r.scope==='mod')return s.module;
 const view=!s.generated&&s.f!=='platform.js';if(r.scope==='view')return view;
 if(r.scope==='mod-view')return view&&s.module&&!/^mod_s_pack_|^mod_s_tenant/.test(s.f)&&!/_data\.js$/.test(s.f);return false};

/* ---------- self-test: every rule must fire on a known bad sample and stay quiet on a good one ---------- */
const SELF={
 'css-var':['.a{color:var(--zz-undefined-token)}','.a{color:var(--ink)}','css'],
 'hex-css':['.a{color:#12ab34}','.a{color:var(--ink)}','css'],
 'banned-name':['x("Built on '+'Fab'+'ric Enterprise")','x("A fabric of teams")'],
 'em-dash':['x("one — two")','/* one — two */ x("one, two")'],
 'real-name':['x("Owner '+REAL[0]+'")','x("Owner Casey Rowan")'],
 'iife':['const a=1;','(function(){const a=1;})();','mod'],
 'price':['x("Only $12 per user")','x("Spend $12,000 per quarter")'],
 'cert':['x("Falconaire is SOC 2 certified.")','x("SOC 2 is a plan, not a claim.")'],
 'js-literal':['x(`<b style="color:#ab12cd;font-size:14px">`)','x(`<b style="color:var(--ink)">#12 open</b>`)'],
 'sample-data':['x("Owner Casey Rowan")','x("Owner "+U.esc(r.owner))','mod'],
 'helper':['const pct=(a,b)=>a/b;','const r=U.pct(1);'],
 'owner-text':['x(`<td>${esc(r.owner)}</td>`)','x(`<td>${ownerChip(r.owner)}</td>`)'],
 'step-label':['const s={who:"auto"};','const s={who:"robot"};'],
 'product-name':['x("Welcome to Oukala today")','U.store.get("oukala-pref")'],
 'wrapper':['const _r=window.render;window.render=function(){_r()};','HOOKS.on("afterRender",f,{id:"x"});']};
for(const r of RULES){const smp=SELF[r.id];if(!smp){console.log('!! no self-test for rule',r.id);process.exit(1)}
 const mk=(t,kind)=>({f:kind==='css'?'self.css':'mod_self.js',ext:kind==='css'?'css':'js',t,generated:false,module:true,core:false});
 const fire=t=>{const s=mk(t,smp[2]);return r.each(s,s.ext==='js'?lex(t):null).length};
 if(!fire(smp[0])||fire(smp[1])){console.log('!! lint self-test failed for rule',r.id,'(bad sample fires: '+!!fire(smp[0])+', good sample quiet: '+!fire(smp[1])+')');process.exit(1)}}

/* ---------- run ---------- */
const only=arg('--rule'),onlyFile=arg('--file');
const res={};const samples={};
for(const s of files){if(onlyFile&&s.f!==onlyFile)continue;const L=s.ext==='js'?lex(s.t):null;const li=lineIndex(s.t);
 for(const r of RULES){if(only&&r.id!==only)continue;if(!inScope(r,s))continue;let hits;try{hits=r.each(s,L)}catch(e){console.log('!! rule',r.id,'crashed on',s.f,e.message);process.exit(1)}
  if(!hits.length)continue;(res[r.id]=res[r.id]||{})[s.f]=hits.length;(samples[r.id]=samples[r.id]||{})[s.f]=hits.slice(0,4).map(h=>'line '+li(h.i)+': '+String(h.s).replace(/\s+/g,' ').trim().slice(0,90))}}
const base=fs.existsSync(BASE)?JSON.parse(fs.readFileSync(BASE,'utf8')):{rules:{}};
if(has('--update')){
 const out={about:'Build lint baseline (tools/lint/lint.js, CL-46 and CL-60). Counts of existing violations per rule and file, accepted on '+new Date().toISOString().slice(0,10)+'. A file may not go above its count; lower or remove an entry when a cleanup lands (node tools/lint/lint.js --update).',
  rules:Object.fromEntries(RULES.map(r=>[r.id,Object.fromEntries(Object.entries(res[r.id]||{}).sort())]))};
 fs.writeFileSync(BASE,JSON.stringify(out,null,1)+'\n');console.log('baseline written:',path.relative(ROOT,BASE));}
const B=has('--update')?JSON.parse(fs.readFileSync(BASE,'utf8')).rules:base.rules||{};
let bad=0,better=0;const summary=[];
for(const r of RULES){if(only&&r.id!==only)continue;const cur=res[r.id]||{},bl=B[r.id]||{};const tot=Object.values(cur).reduce((a,b)=>a+b,0),btot=Object.values(bl).reduce((a,b)=>a+b,0);
 summary.push(r.id+' '+tot+(tot!==btot?'/'+btot:''));
 for(const [f,n] of Object.entries(cur)){if(onlyFile&&f!==onlyFile)continue;const b0=bl[f]||0;if(n>b0){bad++;console.log('!! '+r.rule+' '+r.n+' ['+r.id+']: '+f+' has '+n+' (baseline '+b0+')');(samples[r.id][f]||[]).forEach(x=>console.log('     '+x))}}
 for(const [f,n] of Object.entries(bl)){if(onlyFile&&f!==onlyFile)continue;if((cur[f]||0)<n)better++}}
console.log('lint',summary.join(' · '));
if(better&&!has('--update'))console.log('lint: '+better+' file and rule pairs are now below the baseline; run node tools/lint/lint.js --update to lock the gain');
if(has('--report'))for(const r of RULES){const cur=res[r.id]||{};const top=Object.entries(cur).sort((a,b)=>b[1]-a[1]).slice(0,8);if(!top.length)continue;
 console.log('\n'+r.rule+' '+r.n+' ['+r.id+'] '+Object.values(cur).reduce((a,b)=>a+b,0)+' in '+Object.keys(cur).length+' files');top.forEach(([f,n])=>{console.log('  '+n+' '+f);(samples[r.id][f]||[]).slice(0,2).forEach(x=>console.log('      '+x))})}
if(has('--json'))console.log(JSON.stringify(res));
if(bad)console.log('lint failed: '+bad+' new violation'+(bad===1?'':'s')+' (rules and fixes: docs/enforcement.md)');
process.exit(bad?1:0);
