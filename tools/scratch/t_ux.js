const {chromium}=require('/opt/npm-tools/node_modules/playwright');const fs=require('fs');
const axe=fs.readFileSync('/tmp/axe_dl/node_modules/axe-core/axe.min.js','utf8');
const W=+process.argv[2]||1440,H=+process.argv[3]||900,out=process.argv[4]||'/tmp/ux_desk.json';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});const errs={};let cur='';p.on('pageerror',e=>(errs[cur]=errs[cur]||[]).push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file:///home/claude/oukala/build_out/full.html');await p.waitForTimeout(4500);
const ids=await p.evaluate(()=>Object.keys(NAVX.map));const res=[];
for(const id of ids){cur=id;try{await p.evaluate(i=>{try{go(i)}catch(e){}},id);await p.waitForTimeout(350);
 await p.addScriptTag({content:axe}).catch(()=>{});
 const r=await p.evaluate(async()=>{const o={};
  try{const a=await axe.run(document.querySelector('main')||document.body,{runOnly:['wcag2a','wcag2aa','wcag21aa'],resultTypes:['violations']});o.v=a.violations.map(v=>({id:v.id,imp:v.impact,n:v.nodes.length,ex:(v.nodes[0]&&v.nodes[0].html||'').slice(0,140)}))}catch(e){o.v=[{id:'axe-fail',n:1,ex:String(e)}]}
  o.ovf=document.documentElement.scrollWidth-document.documentElement.clientWidth;
  o.empty=(document.querySelector('main')||document.body).innerText.trim().length<40;
  const small=[...document.querySelectorAll('main button,main a,main [role=button]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<24||r.width<24)}).length;o.small=small;return o});
 res.push({id,...r,err:errs[id]})}catch(e){res.push({id,fail:String(e).slice(0,100)})}}
fs.writeFileSync(out,JSON.stringify(res));console.log('done',res.length);await b.close()})()
