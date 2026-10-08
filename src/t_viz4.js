const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('file://'+process.cwd()+'/out_viz/full.html');await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{VIZ.state.bigN=100000;const out=[];for(let i=0;i<2;i++){const d=document.createElement('div');d.style.width='600px';document.body.appendChild(d);const t=performance.now();VIZ.render(d,{type:'scatter',src:'big',enc:{x:'a',y:'b',color:'g'},agg:''},null,{});out.push(Math.round(performance.now()-t))}
const t=performance.now();const s=VIZ.srcs.big;const r=s.rows(100000);out.push('gen',Math.round(performance.now()-t),r.length);
for(const ty of ['map_points','map_hex','hexbin','density','histogram','bar']){const d=document.createElement('div');d.style.width='700px';document.body.appendChild(d);const sp=VIZ.demoSpec(ty);sp.src='big';sp.enc=ty.startsWith('map')?{color:'g'}:ty==='histogram'||ty==='bar'?{x:ty==='bar'?'g':'a',y:ty==='bar'?'b':undefined}:{x:'a',y:'b'};if(ty==='bar')sp.agg='avg';const t=performance.now();VIZ.render(d,sp,null,{});out.push(ty,Math.round(performance.now()-t))}
return out.join(' ')}));await b.close()})();
