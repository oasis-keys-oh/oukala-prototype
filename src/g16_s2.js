module.exports=[
['portfolio',k=>{NAVX.persona.set(k);go('org_chart');return S.persona},'portfolio'],
['profile',async()=>{(window.ORGX&&ORGX.openProfile||O.openProfile)('Priya Shah');await new Promise(r=>setTimeout(r,300));const d=document.getElementById('drawer');return{tabs:[...d.querySelectorAll('.views[data-views="org_p"] .vsw label')].map(x=>x.textContent.trim()),h4:[...d.querySelectorAll('h4.org5-h')].map(x=>x.textContent),done:d.querySelector('.views')&&d.querySelector('.views').dataset.pmDone,sec:PERM.section(null,'person.pay','Priya Shah').ok, who:PERM.principal().user}}],
['ops',k=>{closeDrawer();NAVX.persona.set(k);go('org_chart');return 1},'ops'],
['badges',async()=>{await new Promise(r=>setTimeout(r,800));const c=document.querySelector('.org-card');return{cards:document.querySelectorAll('.org-card').length,badges:[...document.querySelectorAll('.org-card .org-m em')].filter(e=>/% load/.test(e.textContent)).length,ld:c&&c.dataset.pmLd,open:c&&c.dataset.orgOpen,mode:PERM.fieldMode(null,'person','load',c&&c.dataset.orgOpen),html:c&&c.querySelector('.org-m')&&c.querySelector('.org-m').outerHTML.slice(0,300)}}],
['sweep',()=>{PERM.sweep();return [...document.querySelectorAll('.org-card .org-m em')].filter(e=>/% load/.test(e.textContent)).length}]
];
