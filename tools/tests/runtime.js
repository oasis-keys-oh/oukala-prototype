// CL-35, CL-36, CL-38 ceilings (wave 4 stream runtime). Counts, in the built script, the render, go and openDrawer wrappers,
// the document listeners, the MutationObservers and the setIntervals, and fails if any count rises above its ceiling.
// Lower a ceiling when you remove one; never raise it. New lifecycle code uses HOOKS.on, new delegated listeners use ROUTER.on.
// Usage: node tools/tests/runtime.js [build_out]
const fs=require('fs'),path=require('path');
const dir=path.resolve(process.argv[2]||'build_out');const js=fs.readFileSync(path.join(dir,'oukala-js.js'),'utf8');
const CEIL={
 wrappers:3,          /* mod_people:1850 and mod_r15c_core:36 and :131 (other streams; changes listed in the wave 4 runtime report) */
 docListeners:490,  /* document.addEventListener; ROUTER.on routes are not counted */
 observers:44,      /* new MutationObserver */
 intervals:39       /* setInterval( */
};
/* a wrapper is a reassignment of render, go or openDrawer to a function; temporary stubs inside a dry run (mod_zlink) are listed apart */
const WRAP=/(?<![\w$.])(?<!(?:const|let|var)\s+)(?:(?:window|W)\.)?(render|go|openDrawer)\s*=\s*(?:function|\([^)]*\)\s*=>|[\w$]+\s*=>|async)/g;
const STUB=/(?:window\.)(?:render|go)=\(\)=>\{/g;
const count=re=>(js.match(re)||[]).length;
const got={wrappers:count(WRAP)-count(STUB),docListeners:count(/document\.addEventListener\(/g),observers:count(/new MutationObserver/g),intervals:count(/setInterval\(/g)};
let bad=0;for(const k in CEIL){const ok=got[k]<=CEIL[k];if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+' '+k+' '+got[k]+' (ceiling '+CEIL[k]+')')}
/* the router is one listener per event type */
const routes=count(/ROUTER\.on\(/g);console.log('info ROUTER.on routes in source '+routes);
if(!/window\.ROUTER=|W\.ROUTER=/.test(js)){console.log('FAIL ROUTER (mod_s_router) is not in the build');bad++}
process.exit(bad?1:0);
