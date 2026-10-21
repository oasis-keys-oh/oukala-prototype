// PR-31: summarize walk-*.json. Drops contrast lines measured against color() backgrounds (parser bug in the first run).
const fs=require('fs');const f=process.argv[2];const D=require(require('path').resolve(f));
for(const k in D){const d=D[k];console.log('\n######',k,JSON.stringify(d._user&&{user:d._user.user,scope:d._user.scope,dept:d._user.dept}));
 for(const s in d){if(s[0]==='_')continue;const m=d[s];const low=m.lowContrast.filter(x=>!/color\(/.test(x));
  console.log('==',s,'h1',JSON.stringify(m.h1),'ctl',m.ctl,'smallN',m.smallN,'lowRGB',low.length,'words',m.words,'errs',m.errs.length,m.denied?'DENIED':'');
  if(low.length)console.log('  low:',low.slice(0,3).join(' | '));
  if(m.viewOx.length&&/phone/.test(s))console.log('  clipped:',m.viewOx.slice(0,3).join(' | '));
  if(m.emdash.length)console.log('  em:',m.emdash);if(m.banned.length)console.log('  banned:',m.banned.slice(0,3));
  if(m.casey.length&&k!=='exec')console.log('  casey:',m.casey.slice(0,2));
  if(m.unnamedN)console.log('  unnamed:',m.unnamed.slice(0,2));if(m.inputsNoLabelN)console.log('  nolabel:',m.inputsNoLabel.slice(0,2));
  if(m.denied)console.log('  denied:',m.denied.slice(0,160).replace(/\n/g,' '));
  if(/light/.test(s))console.log('  start:',m.start.replace(/\s+/g,' ').slice(0,260))}}
