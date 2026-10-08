const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
p.on('console',m=>console.log('C',m.text().slice(0,200)));
await p.goto('file://'+process.cwd()+'/out_viz/full.html');await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{VIZ.state.bigN=100000;const d=document.createElement('div');d.style.width='600px';document.body.appendChild(d);const t=performance.now();VIZ.render(d,{type:'scatter',src:'big',enc:{x:'a',y:'b',color:'g'},agg:''},null,{});return !!d.querySelector('canvas')+d.innerHTML.slice(0,100)+'|'+Math.round(performance.now()-t)+'|'+Object.keys(VIZ.srcs).filter(k=>/big/.test(k))}));
console.log(await p.evaluate(()=>{const d=document.createElement('div');d.style.width='600px';document.body.appendChild(d);const sp=VIZ.demoSpec('scatter');const t=performance.now();VIZ.render(d,sp,null,{});return JSON.stringify(sp)+'|'+!!d.querySelector('canvas')+'|'+Math.round(performance.now()-t)}));
await b.close()})();
