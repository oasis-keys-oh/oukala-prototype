const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const cfg of [{n:'d',w:1440,h:900},{n:'ph',w:400,h:820}]){
 const c=await b.newContext({viewport:{width:cfg.w,height:cfg.h}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|Failed to load/.test(m.text()))errs.push('console: '+m.text())});
 await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html#tour',{waitUntil:'load',timeout:180000});await p.waitForTimeout(4000);
 for(const [i,name] of [[0,'stories'],[1,'moments'],[2,'reh'],[3,'proc']]){
  await p.evaluate(i=>{S.v.r17p_v=i;render()},i);await p.waitForTimeout(700);await p.screenshot({path:`r17_shots/h_${cfg.n}_${name}.png`})}
 /* dark */
 await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark');try{PREF.theme='dark';applyPrefs()}catch(e){}});
 await p.evaluate(()=>{R17P.start('five',0)});await p.waitForTimeout(2200);await p.screenshot({path:`r17_shots/h_${cfg.n}_dark_bar.png`});
 console.log(cfg.n,'ERR',errs,await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));await c.close()}
await b.close()})();
