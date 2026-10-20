module.exports=[
['emp',k=>{NAVX.persona.set(k);go('org_chart');return [S.persona,PERM.principal().user,PERM.principal().roles.join()]},'emp'],
['modes',()=>({maya:PERM.fieldMode(null,'person','load','Maya Ortiz'),casey:PERM.fieldMode(null,'person','load','Casey Rowan'),rd:PERM.can(null,'read','person','Maya Ortiz').ok})],
['badges',async()=>{await new Promise(r=>setTimeout(r,800));const cs=[...document.querySelectorAll('.org-card')];return{n:cs.length,ld:cs.filter(c=>c.dataset.pmLd).length,badges:cs.map(c=>c.dataset.orgOpen+':'+[...c.querySelectorAll('.org-m em')].filter(e=>/% load/.test(e.textContent)).length).filter(x=>!/:0$/.test(x)).slice(0,6)}}]
];
