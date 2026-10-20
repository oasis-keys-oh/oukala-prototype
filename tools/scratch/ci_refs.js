/* CI-style reference check (Round 15). usage: NODE_PATH=$(npm root -g) node ci_refs.js <full.html>
   Fails (exit 1) when any DATAMODEL reference field has no declared target entity, or a target that is not a table. */
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());const p=await (await b.newContext()).newPage();p.setDefaultTimeout(120000);
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(process.argv[2]||'out/full.html'));
await p.waitForFunction(()=>window.R15E&&R15E.state.applied&&ZLINK.state.fixed.fx_r15e_c,null,{timeout:150000}).catch(()=>console.error('boot did not finish'));
const r=await p.evaluate(()=>{const T=DATAMODEL.tables;const miss=[],bad=[];let n=0;Object.keys(T).forEach(t=>T[t].fields.forEach(f=>{if(f.type!=='ref')return;n++;if(!f.ref)miss.push(t+'.'+f.k);else if(!T[f.ref])bad.push(t+'.'+f.k+' -> '+f.ref)}));return {n,miss,bad,poly:Object.values(R15E.refState()).filter(x=>x.state==='polymorphic').length}});
console.log('reference fields',r.n,'without target',r.miss.length,'with unknown target',r.bad.length,'polymorphic',r.poly);r.miss.slice(0,30).forEach(x=>console.log('  NO TARGET',x));r.bad.slice(0,30).forEach(x=>console.log('  BAD TARGET',x));
await b.close();process.exit(r.miss.length||r.bad.length?1:0)})();
