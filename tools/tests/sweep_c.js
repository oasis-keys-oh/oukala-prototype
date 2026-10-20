// Wave 3 sweep-c check (CL-45, CL-44, CL-17, CL-72, CL-82): open every screen registered by the modules from mod_r16l_e_trace to the end
// of src/modules.json and assert the rendered text has no em dash, no banned external name, no "Automatic" step label, no "Oukala"
// and no dollar price per user. Usage: node tools/tests/sweep_c.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const root=path.resolve(__dirname,'../..');
const mods=JSON.parse(fs.readFileSync(path.join(root,'src/modules.json'),'utf8')).modules;const from=mods.indexOf('mod_r16l_e_trace');
const ids=new Set();mods.slice(from).forEach(m=>{const f=path.join(root,'src',m+'.js');if(!fs.existsSync(f))return;
 const s=fs.readFileSync(f,'utf8');for(const x of s.matchAll(/REG\(\s*\\?["']([\w]+)\\?["']/g))ids.add(x[1])});
/* screens this range draws or rewires without its own REG call (journey, org chart, home, showroom, tenancy, funding color note) */
['journey','orgchart','home','showroom','tenancy','process_designer','fin_color'].forEach(x=>ids.add(x));
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(800);
const known=new Set(await p.evaluate(()=>SCREENS.map(s=>s[0])));const list=[...ids].filter(i=>known.has(i));
const CHECKS=[['em dash',/\u2014/],['banned name',/\b(Fabric|Trellis|FASB|GASB|FAF|ASC|ASU|Codification)\b|\bCore (edition|tier|plan)\b/],
 ['Automatic step label',/\b(step|kind|mode|owner)\W{0,3}Automatic\b|\bAutomatic\s*(step|robot)\b/i],['old product name',/Oukala|Shaheen/],
 ['price per user',/\$\s?\d[\d,.]*\s*(per user|\/\s?user)|price per user\D{0,20}\$\s?\d/i]];
let bad=0;
for(const id of list){const n0=errs.length;await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(150);
 const txt=await p.evaluate(()=>[...document.querySelectorAll('#view')].map(v=>{const c=v.cloneNode(true);c.querySelectorAll('script,style').forEach(x=>x.remove());return c.textContent}).join('')+'\n'+[...document.querySelectorAll('#view [title]')].map(e=>e.title).join('\n'));
 const hits=[];CHECKS.forEach(([k,re])=>{const m=txt.match(re);if(m){const i=m.index;hits.push(k+': "'+txt.slice(Math.max(0,i-40),i+40).replace(/\s+/g,' ')+'"')}});
 if(hits.length||errs.length>n0){bad++;console.log('!!',id,hits.concat(errs.slice(n0)).join(' | '))}}
console.log('sweep-c screens',list.length,'flagged',bad,'errors',errs.length);await b.close();process.exit(bad||errs.length?1:0)})();
