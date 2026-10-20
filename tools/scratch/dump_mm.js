const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:900}});
await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>({
 screens:SCREENS.map(s=>[s[0],s[1],s[3]]),
 procs:Object.keys(PROC.defs).map(k=>[k,PROC.defs[k].title,(PROC.defs[k].steps||[]).length]),
 ents:PLAT.entities().map(e=>[e.id,e.label,e.owner,e.fields.map(f=>f.k).join(",")]),
 apps:PLAT.APPS.map(a=>[a.id,a.n,a.mod,a.reads.join(","),a.writes.join(",")]),
 fams:LINKS.families, pe:LINKS.processEdges().length, lk:Object.keys(LINKS),
 hasModeOf:typeof PROC.modeOf, atlas:typeof window.ATLAS, atlasFocus:window.ATLAS&&typeof ATLAS.focus
}));
require('fs').writeFileSync('mm_dump.json',JSON.stringify(r,null,1));
console.log(r.screens.length,r.procs.length,r.ents.length,r.apps.length,r.pe,r.lk,r.hasModeOf,r.atlas,r.atlasFocus);
await b.close()})();
