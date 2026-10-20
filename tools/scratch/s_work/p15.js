const L=require('./load.js');
(async()=>{
const {b,p}=await L(1440,900);
const r=await p.evaluate(async()=>{
 const o={};const sh=(x,n=700)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 const st=R16H.status.state;o.statuses=st.defs.map(d=>d.id+'/'+d.cat+'/'+d.handover+'/'+d.group+'/'+(d.launches||[]).map(l=>l.kind+':'+l.ref).join('+')).join(' ; ');
 o.stKeys=Object.keys(st).join(',');
 const cis=CMDBX.all();o.ciN=cis.length;const k={};cis.forEach(c=>{k[c.ownKind]=(k[c.ownKind]||0)+1});o.ownKind=sh(k);
 o.withOG=cis.filter(c=>c.ownerGroup).length;o.withAG=cis.filter(c=>c.approverGroup).length;o.withGrp=cis.filter(c=>c.grp).length;o.withOwner=cis.filter(c=>c.owner).length;
 const cl={};cis.forEach(c=>cl[c.class]=(cl[c.class]||0)+1);o.classes=sh(cl,900);o.nclasses=Object.keys(cl).length;
 const crit={};cis.forEach(c=>crit[c.crit]=(crit[c.crit]||0)+1);o.crit=sh(crit);
 const ls={};cis.forEach(c=>ls[c.life]=(ls[c.life]||0)+1);o.life=sh(ls);
 o.ccCov=sh(CCMAP.coverage(),600);o.ccrows=sh(CCMAP.rows&&CCMAP.rows().length);o.ccGaps=sh(CCMAP.gaps&&CCMAP.gaps().slice(0,3),500);o.ccrow0=sh(CCMAP.rows()[0],500);
 o.ccdec=sh(CCMAP.decisions&&CCMAP.decisions(),700);
 const P=ORGX.P||[];o.orgP=P.length;
 o.stats5=sh(ORGX.stats5&&ORGX.stats5(),500);o.vacs=sh(ORGX.vacs&&(typeof ORGX.vacs==='function'?ORGX.vacs().length:ORGX.vacs.length));
 o.units=sh(ORGX.TM&&ORGX.TM.slice?ORGX.TM.slice(0,20):Object.keys(ORGX.TM||{}),500);
 o.staff0=sh(ORGX.staff&&ORGX.staff[0],600);o.staffN=ORGX.staff&&ORGX.staff.length;
 o.etOf=sh(['FT','PT'].map(x=>0));
 const ets={};(ORGX.staff||[]).forEach(s=>{const e=ORGX.etOf?ORGX.etOf(s):'?';const k=typeof e==='object'?(e.id||e.n):e;ets[k]=(ets[k]||0)+1});o.employmentTypes=sh(ets);
 o.etBadgeSample=sh(ORGX.etBadge&&String(ORGX.etBadge).slice(0,300));
 return o});
console.log(JSON.stringify(r,null,1));await b.close()})();
