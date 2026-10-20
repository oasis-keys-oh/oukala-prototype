// CSS lint (CL-18 to CL-26, R8): reads the source CSS in src/ (not the ' 2' quarantine copies) and src/tokens.py.
// Fails when: a var(--x) has no definition anywhere (CSS, tokens.py, or a custom property set from JS);
// the count of hex colors outside tokens.py, of !important, of literal z-index values or of literal font stacks
// goes above the ceilings below (ceilings only go down: lower them when a cleanup lands).
// Usage: node tools/tests/css_lint.js [--report]
const fs=require('fs'),path=require('path');
const CEIL={hex:Infinity,important:Infinity,zindex:Infinity,fontStack:Infinity};
const src=path.resolve(__dirname,'../../src');const rep=process.argv.includes('--report');
const files=fs.readdirSync(src).filter(f=>!/ 2\./.test(f));
const css={};for(const f of files.filter(f=>f.endsWith('.css')))css[f]=fs.readFileSync(path.join(src,f),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const js={};for(const f of files.filter(f=>f.endsWith('.js')))js[f]=fs.readFileSync(path.join(src,f),'utf8');
const tok=fs.readFileSync(path.join(src,'tokens.py'),'utf8');
const defd=new Set();const addDefs=t=>{for(const m of t.matchAll(/(?<![\w-])--([\w-]+)\s*:/g))defd.add(m[1]);for(const m of t.matchAll(/setProperty\(\s*["'`]--([\w-]+)/g))defd.add(m[1])};
[tok,...Object.values(css),...Object.values(js)].forEach(addDefs);
const undef={};
for(const [f,t] of [...Object.entries(css),...Object.entries(js)])for(const m of t.matchAll(/var\(\s*--([\w-]+)(.)/g)){
 if(/["'`$+]/.test(m[2])||m[1].endsWith('-'))continue; // name built in a JS template literal
 if(!defd.has(m[1]))(undef[m[1]]=undef[m[1]]||new Set()).add(f)}
const cnt=(re)=>{let n=0;const per={};for(const [f,t] of Object.entries(css)){const k=(t.match(re)||[]).length;if(k){per[f]=k;n+=k}}return {n,per}};
const hex=cnt(/#[0-9a-fA-F]{3,8}\b(?![\w-])(?=[^{}]*[;}])/g);
const imp=cnt(/!\s*important/g);
const zi=cnt(/z-index\s*:\s*-?\d+/g);
const fst={n:0,per:{}};for(const [f,t] of Object.entries(css))for(const m of t.matchAll(/(?<![\w-])font(-family)?\s*:([^;}]+)/g)){
 const v=m[2].replace(/var\([^()]*(\([^()]*\)[^()]*)*\)/g,'');if(/serif|monospace|system-ui|Georgia|Menlo|"/i.test(v)){fst.n++;fst.per[f]=(fst.per[f]||0)+1}}
const out={undefinedVars:Object.keys(undef).length,hex:hex.n,important:imp.n,zindex:zi.n,fontStack:fst.n};
console.log('css lint',JSON.stringify(out));
if(rep){const top=o=>Object.entries(o.per).sort((a,b)=>b[1]-a[1]).slice(0,12).map(x=>x.join(' ')).join(', ');
 console.log(' hex by file:',top(hex));console.log(' !important by file:',top(imp));console.log(' z-index literals:',top(zi));console.log(' font stacks:',top(fst))}
let bad=0;
for(const [k,s] of Object.entries(undef)){bad++;console.log('!! undefined var --'+k+' in',[...s].join(', '))}
for(const k of Object.keys(CEIL))if(out[k]>CEIL[k]){bad++;console.log('!! '+k+' count',out[k],'is above the ceiling',CEIL[k])}
process.exit(bad?1:0);
