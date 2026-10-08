const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>{if(!/drawChat/.test(e.stack))errs.push('PAGEERROR '+e.stack.slice(0,400))});p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text().slice(0,300)));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const scr={ppl_org:6,ppl_perf:8,ppl_cap:9,ppl_jrny:5};let n=0;
for(const [s,k] of Object.entries(scr))for(let t=0;t<k;t++){await p.evaluate(([s,t])=>{S.pp2.tab[s]=t;go(s)},[s,t]);
 const acts=await p.evaluate(()=>{const m={};document.querySelectorAll('.screen [data-pp2-act]').forEach(e=>{const a=e.dataset.pp2Act;if(!m[a])m[a]=1});return Object.keys(m)});
 for(const a of acts){if(['scaletest'].includes(a))continue;const before=errs.length;
  await p.evaluate(([s,t,a])=>{if(S.screen!==s){S.pp2.tab[s]=t;go(s)}const e=document.querySelector('.screen [data-pp2-act="'+a+'"]');if(e)e.click()},[s,t,a]).catch(e=>errs.push('eval '+a+' '+e.message));
  await p.waitForTimeout(40);n++;if(errs.length>before)console.log('ERR after',s,t,a,errs.slice(before));
  await p.keyboard.press('Escape');await p.evaluate(()=>{try{closeDrawer()}catch(e){}document.querySelectorAll('[data-form] .btn.quiet,[data-form-close]').forEach(()=>{});const f=document.querySelector('[popover]:popover-open');}).catch(()=>{});
 }}
console.log('clicked',n,'actions; errors',errs.length,errs.slice(0,8));await b.close()})();
