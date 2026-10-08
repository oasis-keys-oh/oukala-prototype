const fs=require("fs");const parts=["p1_head","p2_pb","p3_engine","p4_text"].map(f=>fs.readFileSync(__dirname+"/"+f+".js","utf8").replace(/^\/\* =+[\s\S]*?\*\/\n\(function\(\)\{\nS\.sow[^\n]*\nconst SW=S\.sow;/,""));
global.S={};global.esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const code=parts.join("\n")+`
const ct={id:"X",num:1,vendor:"Lumen Data Partners",owner:"Dev Rao",vOwner:"Marco Ellis",start:"2027-01-11"};
for(const k of ["sow5","sow4p","sow4c","beacon","msa","dpa","nwp","nwc"]){const L=analyze(TXT[k],ct,"proposal");const c={std:0,var:0,new:0};L.forEach(l=>c[l.m]++);console.log(k,L.length,JSON.stringify(c));
 if(process.argv[2]===k)L.forEach(l=>console.log(l.id,l.ref,l.type.padEnd(11),l.m.padEnd(3),l.pb.padEnd(7),(l.norm||"").padEnd(26),l.conf,l.key,"|",l.src.slice(0,50)))}`;
fs.writeFileSync("/tmp/sow_t.js",code);
