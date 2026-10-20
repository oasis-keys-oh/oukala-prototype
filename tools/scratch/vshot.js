// usage: node vshot.js tab [--dark] [--phone] [--eval js]
const {chromium}=require('playwright');
(async()=>{const a=process.argv.slice(2),t=+a[0]||0,dark=a.includes('--dark'),phone=a.includes('--phone'),ev=a.includes('--eval')?a[a.indexOf('--eval')+1]:'';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>{if(!/setting 'innerHTML'/.test(e.message))errs.push('PE '+e.stack.slice(0,400))});p.on('console',m=>m.type()==='error'&&errs.push('C '+m.text().slice(0,300)));
await p.goto('file://'+process.cwd()+'/out_viz/full.html');await p.waitForTimeout(500);
await p.evaluate(t=>{S.v.viz_v=t;go('kcs_viz')},t);await p.waitForTimeout(300);
if(ev){await p.evaluate(ev);await p.waitForTimeout(300)}
const h=await p.evaluate(()=>document.documentElement.scrollHeight);for(let y=0;y<h;y+=500){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(120)}await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(500);
const f='out_viz/shots/v'+t+(dark?'d':'')+(phone?'p':'')+'.png';await p.screenshot({path:f,fullPage:true});console.log(f,'errors:',errs);await b.close()})();
