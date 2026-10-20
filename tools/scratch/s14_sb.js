const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--hide-scrollbars']});
const p=await (await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_s14/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(6000);
await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark')});
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));let tot=0,withBar=0,thin=0;const bad=[];
for(const id of ids){await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+e.message));await p.waitForTimeout(120);
 const r=await p.evaluate(()=>{const o=[];document.querySelectorAll('#view *').forEach(e=>{const cs=getComputedStyle(e);if(!/auto|scroll/.test(cs.overflowX+cs.overflowY)||cs.scrollbarWidth==='none'||e.closest('.zs-root'))return;const ox=e.scrollHeight>e.clientHeight+1&&/auto|scroll/.test(cs.overflowY),oy=e.scrollWidth>e.clientWidth+1&&/auto|scroll/.test(cs.overflowX);if(!ox&&!oy)return;const sbw=e.offsetWidth-e.clientWidth-parseFloat(cs.borderLeftWidth)-parseFloat(cs.borderRightWidth),sbh=e.offsetHeight-e.clientHeight-parseFloat(cs.borderTopWidth)-parseFloat(cs.borderBottomWidth);o.push({c:(e.tagName+'.'+(typeof e.className==='string'?e.className.trim().split(/\s+/).join('.'):'')).slice(0,60),w:Math.round(sbw),h:Math.round(sbh),ox,oy,sw:cs.scrollbarWidth})});return o});
 r.forEach(x=>{tot++;const okw=!x.ox||x.w>=12,okh=!x.oy||x.h>=12;if(okw&&okh)withBar++;else bad.push(id+' '+JSON.stringify(x))})}
console.log('scroll-overflowing containers',tot,'with visible 12px bar',withBar);console.log(bad.slice(0,15).join('\n'));console.log(errs.slice(0,5));await b.close()})();
