// PR-31: compact summary of walk_exec data.json files. Usage: node tools/scratch/ux/summ.js [persona] [section]
const fs=require('fs'),path=require('path');const S=path.join(__dirname,'shots');
const ks=(process.argv[2]||'ceo,exec,coo,cfo,cco,chro,ciso,caio,clo,board').split(',');const sec=process.argv[3]||'screens';
for(const k of ks){const D=JSON.parse(fs.readFileSync(path.join(S,k,'data.json')));
 console.log('\n=== '+k+' '+JSON.stringify(D.who).slice(0,700)+' load '+D.loadMs);
 if(sec==='screens')for(const [id,m] of Object.entries(D.screens)){if(id.includes('@')){console.log('  '+id+' '+JSON.stringify(m).slice(0,300));continue}
  console.log('  '+id+' "'+m.name+'" ms'+m.ms+' h1'+JSON.stringify(m.h1)+' h2:'+m.h2+' words'+m.words+' above:'+m.aboveTxt+' inter'+m.inter+'/'+m.above+' tiny'+m.tiny+' noname'+m.nonameN+' low'+m.lowN+'/'+m.checked+' unk'+m.unknown+' u12:'+m.under12+' em'+m.emdash+' lbl'+m.labels+' hero'+m.hero+' proc'+m.proc+' brk:'+m.brokenHit+' jar:'+m.jargon.join('/')+' fonts:'+m.fonts.join('/')+' sizes:'+JSON.stringify(m.sizes));
  console.log('     low: '+JSON.stringify(m.lowContrast).slice(0,300));console.log('     noname: '+m.noname.join(' '));console.log('     thread: '+m.thread);if(m.card)console.log('     card: '+m.card);console.log('     first: '+m.first.slice(0,300))}
 else console.log(JSON.stringify(D[sec],null,0).slice(0,4000))}
