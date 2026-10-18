const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[2]));const k=process.argv[3];
console.log('errs',j.errs.length,j.errs.slice(0,3));
const rows=Object.entries(j.res);console.log('screens',rows.length);
if(k==='sum'){const t={};for(const [id,r] of rows){for(const key of ['focusRing','hscroll','clipN','lowN','tapN','gapN','uneqN']){if(r[key])t[key]=(t[key]||0)+(+r[key]>0?1:0)}}console.log('screens with issue:',JSON.stringify(t))}
else for(const [id,r] of rows){const v=r[k];if(v&&(Array.isArray(v)?v.length:v))console.log(id,JSON.stringify(v).slice(0,260))}
