// Journey maps checks (stream journey, wave 2): FTE cap, experience tile, org chart toolbar at narrow width.
// Usage: node tools/tests/journey.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());
const open=async pg=>{await pg.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
 await pg.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view')&&window.JYX&&JYX.api,null,{timeout:120000});await pg.waitForTimeout(600)};
await open(p);
let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++};
const wait=ms=>p.waitForTimeout(ms);

// 1. DC-01: per-step release is capped, totals are labeled modeled, capped cards say so
const cap=await p.evaluate(async()=>{const out={};for(const k of Object.keys(SCN.list)){SCN.set(k);await new Promise(r=>setTimeout(r,120));
 const a=JYX.api,H=a.REC_CAP_H;let max=0,capped=0;JYX.JY.list.forEach(j=>a.allBoxes(j).forEach(({b})=>{const r=a.rec(b);if(r.st==='cand'){max=Math.max(max,r.save);if(r.capped)capped++}}));
 const B=JXR.builds();const st=B.filter(x=>!x.ext);const fte=st.reduce((s,x)=>s+x.freed,0)/a.FTE_H,raw=st.reduce((s,x)=>s+x.rows.reduce((t,y)=>t+(y.r.raw||y.r.save),0),0)/a.FTE_H;
 capped=B.filter(x=>x.capped).length;
 S.pp2.tab.ppl_jrny=8;go('ppl_jrny');await new Promise(r=>setTimeout(r,150));const tx=document.querySelector('#view').innerText;
 out[k]={H,max,capped,fte:+fte.toFixed(1),raw:+raw.toFixed(1),capChip:document.querySelectorAll('#view .jb-cap').length,modeled:/released if all built, modeled/.test(tx),note:/at most \d+ FTE/.test(tx)}}return out});
for(const k in cap){const c=cap[k];ok(c.max<=c.H+1e-6,`${k}: no step releases more than ${c.H} h a month (max ${Math.round(c.max)})`);ok(c.modeled&&c.note,`${k}: Build list total is labeled modeled and states the per-step cap`);
 if(c.capped)ok(c.capChip>0,`${k}: ${c.capped} capped builds show a "capped" marker on their card`)}
ok(cap.health&&cap.health.fte<cap.health.raw,`health: Build list FTE released is capped (${cap.health&&cap.health.fte} FTE, was ${cap.health&&cap.health.raw} uncapped, modeled)`);

// 2. CL-33 / DC-01: the experience score reads "x of 5", never a percentage
const xla=await p.evaluate(async()=>{SCN.set('core');await new Promise(r=>setTimeout(r,120));S.pp2.tab.ppl_jrny=0;go('ppl_jrny');await new Promise(r=>setTimeout(r,200));
 const m=METRICS.m_jr_xla;const pop=document.getElementById(document.querySelector('[data-k="m_jr_xla"]').getAttribute('popovertarget'));
 return {fmt:mfmt(m),tgt:mfmt(m,m.tgt),pop:pop?pop.innerText.slice(0,240):''}});
ok(/^\d(\.\d)? of 5$/.test(xla.fmt)&&/of 5/.test(xla.tgt),`experience score formats as "x of 5" (${xla.fmt}, target ${xla.tgt})`);
ok(!/\d%/.test(xla.pop.split('Change since')[0]),'experience score popover shows no percentage');

// 3. DC-01: org chart toolbar fits at 400 px (recommendations switch, employment chips, head count)
const narrow=await ctx.newPage();await narrow.setViewportSize({width:400,height:900});await narrow.route(/^https?:/,r=>r.abort());await open(narrow);
const nb=await narrow.evaluate(async()=>{go('org_chart');await new Promise(r=>setTimeout(r,500));const mb=document.querySelector('.k16-morebtn');if(mb&&mb.offsetParent)mb.click();await new Promise(r=>setTimeout(r,300));
 const bar=document.querySelector('.org-bar');const lim=bar.getBoundingClientRect().right+1;
 const L=[...document.querySelectorAll('.org5-bar button, .org5-bar .org5-lbl, .org5-hc')].filter(e=>e.getBoundingClientRect().width);
 const out=L.filter(e=>e.getBoundingClientRect().right>lim).map(e=>e.textContent.slice(0,30));const ov=[];
 for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){if(L[i].contains(L[j])||L[j].contains(L[i]))continue;const a=L[i].getBoundingClientRect(),c=L[j].getBoundingClientRect();if(a.x<c.right-1&&c.x<a.right-1&&a.y<c.bottom-1&&c.y<a.bottom-1)ov.push(L[i].textContent.slice(0,20)+' x '+L[j].textContent.slice(0,20))}
 return {n:L.length,out,ov,doc:document.documentElement.scrollWidth}});
ok(nb.n>0&&!nb.out.length&&!nb.ov.length&&nb.doc<=400,`org chart toolbar at 400 px: ${nb.n} controls, none clipped or overlapping (${nb.out.concat(nb.ov).join('; ')||'clean'})`);
await narrow.close();

ok(!errs.length,'no page errors'+(errs.length?': '+errs.slice(0,5).join(' | '):''));
console.log(fail?fail+' journey check(s) failed':'journey checks passed');await b.close();process.exit(fail?1:0)})();
