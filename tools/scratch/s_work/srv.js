const L=require('./load.js');const http=require('http');
(async()=>{const w=+process.argv[2]||1440;const {b,p}=await L(w,900);
http.createServer((q,s)=>{let d='';q.on('data',c=>d+=c);q.on('end',async()=>{try{const r=await p.evaluate(`(async()=>{${d}})()`);s.end(typeof r==='string'?r:JSON.stringify(r,null,1))}catch(e){s.end('ERR '+e.message)}})}).listen(+process.argv[3]||9333);console.log('ready')})();
