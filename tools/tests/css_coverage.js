// CL-28 helper (prototype fact): CSS rule coverage over every registered screen, as in tools/baseline.js.
// Usage: node tools/tests/css_coverage.js <build dir> <out.json> [light|dark|w400]
// Writes {text, ranges}: the inline stylesheet text and the character ranges of rules that matched at least once
// while every screen was opened in turn. A rule that only matches on hover, focus or after a click is reported unused.
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const [dir,out,mode='light']=process.argv.slice(2);
 const vp=mode==='w400'?{width:400,height:820}:{width:1440,height:900};
 const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 const c=await b.newContext({viewport:vp,colorScheme:mode==='dark'?'dark':'light'});const p=await c.newPage();
 await p.route(/^https?:/,r=>r.abort());
 await p.coverage.startCSSCoverage({resetOnNavigation:false});
 await p.goto('file://'+path.resolve(dir)+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(900);
 const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));
 for(const id of ids){await p.evaluate(i=>{try{go(i)}catch(e){}},id);await p.waitForTimeout(200)}
 const cov=await p.coverage.stopCSSCoverage();
 const big=cov.sort((x,y)=>y.text.length-x.text.length)[0];
 fs.writeFileSync(out,JSON.stringify({mode,screens:ids.length,text:big.text,ranges:big.ranges}));
 console.log(mode,'screens',ids.length,'css chars',big.text.length,'used',big.ranges.reduce((s,r)=>s+r.end-r.start,0));
 await b.close()})();
