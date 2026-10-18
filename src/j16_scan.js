const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:240000});await p.waitForTimeout(800);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));const out=[];
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(120);
 const r=await p.evaluate((id)=>{const res=[];const seen=new Set();
  document.querySelectorAll('#view *').forEach(el=>{if(seen.has(el)||el.dataset.pkUp||el.closest('[data-pk-up]'))return;const kids=[...el.children].filter(c=>/^(BUTTON|A|SPAN|LABEL|DIV)$/.test(c.tagName)&&(c.matches('[class*=chip],[class*=pill],[class*=tag],[class*=seg],button,label')) && c.textContent.trim().length<40 && !c.querySelector('button,input,select,table'));
   const btn=kids.filter(c=>c.tagName==='BUTTON'||c.tagName==='LABEL'||c.hasAttribute('data-pick')||c.getAttribute('aria-pressed')!=null||/chip|pill/.test(c.className));
   if(btn.length>=8 && btn.length>=el.children.length*0.8){seen.add(el);res.push({n:btn.length,cls:el.className.slice(0,40),first:btn.slice(0,4).map(c=>c.textContent.trim().slice(0,18)).join('|'),attrs:[...new Set(btn.map(c=>[...c.attributes].map(a=>a.name).filter(a=>a.startsWith('data-')).join(',')))].slice(0,2).join(';')})}});
  const up=[...document.querySelectorAll('#view .pk2-up')].map(w=>({up:1,n:(w.nextElementSibling&&w.nextElementSibling.children.length)||0,cls:(w.nextElementSibling&&w.nextElementSibling.className||'').slice(0,30),first:(w.querySelector('.pk2-t b')||{}).textContent}));return {res,up}},id);
 if(r.res.length||r.up.length)out.push({id,r:r.res,up:r.up})}
console.log(JSON.stringify(out,null,0));console.log(errs.length);await b.close()})();
