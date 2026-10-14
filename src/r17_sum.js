const fs=require('fs');const f=process.argv[2];const r=JSON.parse(fs.readFileSync(f));
const agg=(k,field)=>{const m={};for(const [id,x] of Object.entries(r))for(const e of (x[field]||[])){const n=Array.isArray(e)?e[0]:e.n;const c=Array.isArray(e)?e[1]:1;m[n]=(m[n]||0)+c}return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,25)};
for(const [k,fl] of [['small','smallEx'],['taps','tapEx'],['wide','wideEx'],['grid','gridEx'],['canvas','canvasEx'],['hscroll','hscrollEx'],['vscroll','vscrollEx']]){console.log('==',k);console.log(agg(k,fl).map(x=>x.join(' ')).join('\n'))}
