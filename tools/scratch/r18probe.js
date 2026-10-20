const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message.slice(0,200)+' '+String(e.stack).split('\n').slice(0,4).join(' <- ')));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text().slice(0,200))});
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+process.argv[2]);
await p.waitForTimeout(4000);
const ids=['r18_builds','r18_app','r18_mature','r18_debt','r18_access','r18_lens','r18_strategy'];
for(const id of ids){
  const r=await p.evaluate(id=>{try{go(id);}catch(e){return 'ERR '+e.message}
    const t=document.querySelector('.screen')?document.querySelector('.screen').innerText.slice(0,160).replace(/\n+/g,' | '):'NO SCREEN';return t},id);
  console.log(id,'=>',r);
  await p.waitForTimeout(400);
  await p.screenshot({path:`/tmp/r18_${id}.png`});
}
console.log('rail groups:',await p.evaluate(()=>[...document.querySelectorAll('#nav .r18-sec b, #nav .grp-h, #nav [data-g]')].slice(0,40).map(e=>e.textContent.trim()).join(' / ')));
console.log('ERRS',errs.length);errs.slice(0,15).forEach(e=>console.log(e));
await b.close()})();
